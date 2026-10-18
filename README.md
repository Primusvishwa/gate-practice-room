# GATE Practice Room

Mock exams for GATE BT and GATE XL from past papers, marked the GATE way, with topic-by-topic analysis.
The site is private: it asks for a passcode. Her progress is saved in Supabase, so it follows her across devices.

## Setup (about 20 minutes, all free)

**1. Supabase (saves her progress)**
- Make a free account at supabase.com and create a new project (any name, any password, region: Mumbai).
- Open **SQL Editor → New query**, paste everything in `supabase.sql`, and press **Run**.
- Open **Project Settings → API Keys**. Copy:
  - the **Project URL** (looks like `https://abcd1234.supabase.co`)
  - the **secret key** (starts with `sb_secret_`; on older projects it is the `service_role` key)
- Keep the secret key private. It only goes into Render, never into the page.

**2. GitHub**
- Create a new **private** repository and upload everything in this folder (including the `data` folder).

**3. Render**
- Make a free account at render.com and connect your GitHub.
- Click **New → Blueprint**, pick the repository. Render reads `render.yaml` and asks for three values:
  - `PASSCODE` — the passcode she will type (pick something only she knows)
  - `SUPABASE_URL` — from step 1
  - `SUPABASE_SERVICE_KEY` — the secret key from step 1
- Click **Apply**. After a couple of minutes you get a link like `https://gate-practice-room.onrender.com`. That's the link to send her.

## Good to know
- Render's free plan sleeps after ~15 minutes of no use; the first visit after that takes up to a minute to load.
- Supabase's free plan pauses a project after a week with no activity. If she takes a long break, open the
  Supabase dashboard and press **Restore**. Nothing is lost.
- To change the passcode, edit `PASSCODE` in Render → Environment. She'll be asked for the new one.
- Without the Supabase values, the site still works; progress is just saved in her browser only.
