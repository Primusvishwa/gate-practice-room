# GATE Practice Room

A private practice website for **GATE Biotechnology (BT)**, **GATE Life Sciences (XL)** and **TIFR JGEEBILS** (GS Biology), built from real past papers.
It makes mock exams, marks them exactly the way GATE does, and shows which topics are strong and which need work.

## What's inside

| Paper | Questions | Years |
|---|---|---|
| GATE BT | 520 | 2014–2021 (every paper complete, 65 questions each) |
| GATE XL | 250 | 2020, 2021 (GA, Chemistry and all five optional sections) |
| JGEEBILS | 412 | 2020–2026 (General, Physics, Chemistry, Biology; from TIFR's official answer-key papers) |

Every question has its official answer key, a short explanation, and tags for section → topic → subtopic, difficulty and type (MCQ / MSQ / NAT).
Questions are shown as the original printed image, so formulas, figures and tables look exactly as in the paper.
Questions outside the 2027 syllabus are left out by default (there's a switch to include them). Questions whose official key looks wrong (1 in GATE BT, 4 in JGEEBILS) are left out of mocks, and questions the examiners dropped are never used. The explanation says what the correct answer should be.

## Features

**Choose your paper.** Switch between BT, XL and JGEEBILS at the top. For XL, pick your two optional sections (Biochemistry, Botany, Microbiology, Zoology, Food Technology); GA and Chemistry are always included.

**Six ways to practise**
- **Full mock exam:** 3 hours in the real pattern. BT: GA 10 + subject 55 (100 marks). XL: GA 10 + Chemistry 15 + 20 from each chosen section (100 marks). JGEEBILS: 15 each from General, Physics, Chemistry and Biology (80 marks). Mixed from all years, and questions not seen before come first.
- **A real past paper:** sit any year's actual paper in its original order.
- **Pick topics:** choose sections or individual topics, the number of questions, question types and difficulty.
- **Weak topics:** a set built from the topics with the lowest marks so far.
- **Retry my mistakes:** questions answered wrongly or left blank last time. Get one right and it leaves the list.
- **Quick 10:** ten fresh questions, balanced across the paper.

Topic tests can be **timed** (marks at the end, like the real exam) or **practice** (check each answer and read the explanation straight away).

**Exam screen**
- Countdown timer, question palette with GATE-style colours (answered, not answered, not visited, marked for review)
- Mark for review, clear response, previous / next; keyboard shortcuts A–D and ← →
- Pause any time and resume later from Home
- Tap a question to zoom in (handy on a phone)
- XL full mocks: switch optional sections mid-exam, just like on exam day

**Marking**
GATE: wrong MCQ −1/3 (1-mark) or −2/3 (2-mark); MSQ and NAT have no negative marking. MSQ is all-or-nothing; NAT accepts the official range.
JGEEBILS: in each section the first 10 questions are worth 1 mark and the last 5 are worth 2 (TIFR's official pattern). A wrong answer costs −0.25 or −0.5. TIFR confirms negative marking but doesn't publish the amount; these are the commonly reported values.

**Results after every test**
- Score, right / wrong / blank, marks lost to negatives, accuracy, time used
- "What this tells us": plain-language takeaways (where marks were lost, guessing, blank MSQ/NAT, 1-mark vs 2-mark, comparison with the previous test)
- Marks by section, and a topic-by-topic table (weakest first) labelled ✓ Strong or ! Needs work
- Time per question, and the questions that took longest
- Full review of every question: your answer, the correct answer, and the explanation, filtered by wrong / blank / marked / right
- One click to practise that test's weak topics

**Progress page**
- Score trend across timed tests
- Section-by-section performance and accuracy, with ↑ improving / ↓ slipping
- Strengths (75%+ of marks over 5+ questions) and weak spots (under 50%)
- Every topic in the syllabus, including ones not tried yet
- XL only: which two optional sections suit you best, based on your results
- History of every test

**Private and synced.** The site asks for a passcode, and question data is only sent after it's entered. Progress is saved to Supabase, so tests done on a laptop show up on a phone. Search engines are told not to index the site.

## How it's built

- `public/index.html`: the whole app (plain HTML, CSS and JavaScript; no build step)
- `data/`: the question bank (`bank.json`) and question images, one file per paper
- `server.js`: a small Node server with no dependencies. It checks the passcode, serves the data and saves progress to Supabase.
- `render.yaml`: tells Render how to run it. `supabase.sql` creates the one table it uses.

## Setup (about 20 minutes, all free)

**1. Supabase (saves progress)**
- Create a free project at supabase.com (region: Mumbai).
- **SQL Editor → New query**, paste `supabase.sql`, press **Run**.
- Copy the **Project URL** (`https://xxxx.supabase.co`, without `/rest/v1/`) and the **secret key** (Project Settings → API Keys, starts with `sb_secret_`). Keep the secret key private.

**2. GitHub.** Put this folder in a **private** repository.

**3. Render.** New → **Blueprint** → pick the repository, then fill in:
- `PASSCODE`: the passcode to open the site
- `SUPABASE_URL`: the Project URL
- `SUPABASE_SERVICE_KEY`: the secret key

Deploy, wait for **Live**, and share the `.onrender.com` link.

## Updating

Change files, then in this folder:

```
git add .
git commit -m "Describe the change"
git push
```

Render redeploys automatically within a few minutes.

## Good to know

- Render's free plan sleeps after ~15 minutes without visitors; the first visit after that takes up to a minute to load.
- Supabase's free plan pauses a project after a week with no activity. If that happens, open the Supabase dashboard and press **Restore**. Nothing is lost.
- To change the passcode: Render → the service → **Environment** → edit `PASSCODE`. Everyone is asked for the new one.
- To replace the Supabase key: create a new secret key in Supabase, paste it into `SUPABASE_SERVICE_KEY` in Render, then delete the old key.
- Without the Supabase values the site still works; progress is just kept in the browser.

## Coming next

- GATE XL papers from 2012 and 2014–2019
- Older JGEEBILS papers (before 2020), if official keys are available
- New practice questions for topics with few past questions
