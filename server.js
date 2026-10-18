"use strict";
/*
  GATE Practice Room — tiny server, no dependencies.
  - Serves the page; question data only after the passcode is entered.
  - Saves her tests to Supabase (optional — without it, progress stays in her browser).
  Environment variables (set them in Render):
    PASSCODE              the passcode she types to open the site (required)
    SUPABASE_URL          e.g. https://abcd1234.supabase.co        (optional)
    SUPABASE_SERVICE_KEY  Supabase "secret" / service_role key     (optional, keep private)
*/
const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const zlib = require("zlib");

const PORT = process.env.PORT || 3000;
const PASSCODE = (process.env.PASSCODE || "").trim();
const SECRET = process.env.SESSION_SECRET || PASSCODE;
const SB_URL = (process.env.SUPABASE_URL || "").trim().replace(/\/+$/, "");
const SB_KEY = (process.env.SUPABASE_SERVICE_KEY || "").trim();
const STORE = Boolean(SB_URL && SB_KEY);
const PUB = path.join(__dirname, "public");
const DATA = path.join(__dirname, "data");

if (!PASSCODE) console.warn("PASSCODE is not set — nobody can open the site until you set it in Render.");
if (!STORE) console.warn("Supabase is not set — progress will be saved in the browser only.");

/* ---- login ---- */
const token = () => crypto.createHmac("sha256", SECRET).update("gate-practice-room:v1").digest("base64url");
function authed(req) {
  if (!PASSCODE) return false;
  const m = /(?:^|;\s*)gpr=([^;]+)/.exec(req.headers.cookie || "");
  if (!m) return false;
  const a = Buffer.from(m[1]), b = Buffer.from(token());
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
function sameCode(x) {
  const h = v => crypto.createHash("sha256").update(String(v)).digest();
  return crypto.timingSafeEqual(h(String(x).trim()), h(PASSCODE));
}
const tries = new Map();                        // simple brute-force guard: 10 wrong tries per 15 min per IP
const recent = ip => (tries.get(ip) || []).filter(t => Date.now() - t < 15 * 60e3);

/* ---- responses ---- */
const BASE = {"X-Robots-Tag": "noindex, nofollow", "X-Content-Type-Options": "nosniff", "Referrer-Policy": "same-origin"};
function send(res, code, body, headers = {}) { res.writeHead(code, {...BASE, ...headers}); res.end(body); }
const json = (res, code, obj) => send(res, code, JSON.stringify(obj), {"Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store"});
const TYPES = {".html": "text/html; charset=utf-8", ".json": "application/json; charset=utf-8"};
const files = new Map();
function entry(fp) {
  const s = fs.statSync(fp);
  let e = files.get(fp);
  if (!e || e.mtime !== s.mtimeMs) {
    const raw = fs.readFileSync(fp);
    e = {mtime: s.mtimeMs, raw, gz: zlib.gzipSync(raw), etag: '"' + crypto.createHash("sha1").update(raw).digest("hex").slice(0, 16) + '"'};
    files.set(fp, e);
  }
  return e;
}
function serveFile(req, res, fp, cache) {
  let e;
  try { e = entry(fp); } catch { return send(res, 404, "Not found"); }
  const h = {ETag: e.etag, "Cache-Control": cache, Vary: "Accept-Encoding"};
  if (req.headers["if-none-match"] === e.etag) return send(res, 304, "", h);
  const gz = /\bgzip\b/.test(req.headers["accept-encoding"] || "");
  send(res, 200, gz ? e.gz : e.raw, {...h, "Content-Type": TYPES[path.extname(fp)] || "application/octet-stream", ...(gz ? {"Content-Encoding": "gzip"} : {})});
}
function readBody(req, limit = 512 * 1024) {
  return new Promise((ok, no) => {
    const chunks = []; let n = 0;
    req.on("data", c => { n += c.length; if (n > limit) { no(new Error("body too large")); req.destroy(); } else chunks.push(c); });
    req.on("end", () => ok(Buffer.concat(chunks).toString("utf8")));
    req.on("error", no);
  });
}

/* ---- Supabase (one table: store(key text primary key, value jsonb)) ---- */
async function sb(method, query, body, prefer) {
  const headers = {apikey: SB_KEY, "Content-Type": "application/json"};
  if (!SB_KEY.startsWith("sb_")) headers.Authorization = `Bearer ${SB_KEY}`;   // legacy JWT keys also want this header
  if (prefer) headers.Prefer = prefer;
  const r = await fetch(`${SB_URL}/rest/v1/store${query}`, {method, headers, body: body ? JSON.stringify(body) : undefined});
  if (!r.ok) throw new Error(`Supabase ${r.status}: ${(await r.text()).slice(0, 300)}`);
  const t = await r.text();
  return t ? JSON.parse(t) : null;
}

/* ---- routes ---- */
const server = http.createServer(async (req, res) => {
  try {
    const p = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
    if (p === "/healthz") return send(res, 200, "ok", {"Content-Type": "text/plain"});
    if (p === "/robots.txt") return send(res, 200, "User-agent: *\nDisallow: /\n", {"Content-Type": "text/plain"});
    if (p === "/" || p === "/index.html") return serveFile(req, res, path.join(PUB, "index.html"), "no-cache");
    if (p === "/api/me") return json(res, 200, {ok: authed(req), store: STORE});

    if (p === "/api/login" && req.method === "POST") {
      const ip = String(req.headers["x-forwarded-for"] || req.socket.remoteAddress || "").split(",")[0].trim();
      const t = recent(ip);
      if (t.length >= 10) return json(res, 429, {error: "Too many tries. Please wait 15 minutes."});
      let code = "";
      try { code = JSON.parse(await readBody(req, 4096)).passcode || ""; } catch {}
      if (!PASSCODE || !sameCode(code)) { t.push(Date.now()); tries.set(ip, t); return json(res, 401, {error: "That passcode isn't right."}); }
      tries.delete(ip);
      const secure = String(req.headers["x-forwarded-proto"] || "").includes("https") ? "; Secure" : "";
      res.setHeader("Set-Cookie", `gpr=${token()}; Path=/; HttpOnly; SameSite=Lax; Max-Age=31536000${secure}`);
      return json(res, 200, {ok: true});
    }
    if (p === "/api/logout" && req.method === "POST") {
      res.setHeader("Set-Cookie", "gpr=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0");
      return json(res, 200, {ok: true});
    }

    /* everything below needs the passcode */
    if (!authed(req)) return json(res, 401, {error: "login"});

    if (p.startsWith("/data/")) {
      const name = path.basename(p);
      if (!/^[\w.-]+\.json$/.test(name)) return send(res, 404, "Not found");
      return serveFile(req, res, path.join(DATA, name), "private, no-cache");
    }
    if (p === "/api/store" && req.method === "GET") {
      if (!STORE) return json(res, 503, {error: "no store"});
      return json(res, 200, await sb("GET", "?select=key,value&order=key.asc&limit=5000"));
    }
    const m = /^\/api\/store\/([\w.:@+-]{1,100})$/.exec(p);
    if (m) {
      if (!STORE) return json(res, 503, {error: "no store"});
      if (req.method === "PUT") {
        let v;
        try { v = JSON.parse(await readBody(req)); } catch { return json(res, 400, {error: "bad json"}); }
        if (!v || typeof v !== "object" || Array.isArray(v)) return json(res, 400, {error: "bad body"});
        await sb("POST", "?on_conflict=key", [{key: m[1], value: v, updated_at: new Date().toISOString()}], "resolution=merge-duplicates,return=minimal");
        return json(res, 200, {ok: true});
      }
      if (req.method === "DELETE") {
        await sb("DELETE", `?key=eq.${encodeURIComponent(m[1])}`, null, "return=minimal");
        return json(res, 200, {ok: true});
      }
    }
    return send(res, 404, "Not found", {"Content-Type": "text/plain"});
  } catch (e) {
    console.error(e);
    if (!res.headersSent) json(res, 500, {error: "server error"});
  }
});
server.listen(PORT, () => console.log(`GATE Practice Room on port ${PORT} · Supabase ${STORE ? "on" : "off"}`));
