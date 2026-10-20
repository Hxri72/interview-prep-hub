# Interview Prep Hub — rules for every session

Personal interview-prep site for Hari, a full stack (MERN) developer with 3+ years of experience. A complete beginner (a school student) must also be able to understand every page.

## Commands

- `npm run dev`: local site at http://localhost:5173 (content changes reload automatically)
- `npm run build`: type-check, check the content, and build to `dist/`. **Run it after every stack you write.** It fails if any topic breaks the template.
- `npm run preview`: serve the built site

## Where things live

| Path | What |
|---|---|
| `content/topics/<stack>/<NN>-<slug>.md` | one topic. `NN` is just for sorting files; the URL is `/topic/<stack>/<slug>` |
| `content/problems/<NN>-<slug>.md` | one practice problem |
| `content/stacks.yaml` | sidebar stacks, in order (`planned` = number of topics planned) |
| `content/glossary.yaml` | glossary words |
| `TOPIC-PLAN.md` | the approved list of topics per stack. Follow it; ask before adding or removing topics |
| `plugins/content.ts` | turns Markdown into HTML at build time and checks the template |
| `src/` | the React app (Vite + React 19 + TypeScript + Tailwind v4 + React Router, HashRouter). **Light theme only** — Hari asked to remove dark mode; don't add `dark:` classes. |
| `source-notes/` | Hari's resume and study notes (PDFs). **The only source of facts about Hari's work.** |

## Topic template (every topic MUST follow this)

Frontmatter:

```yaml
---
title: Closures
stack: javascript            # must equal the folder name
order: 9                     # position inside the stack (from TOPIC-PLAN.md)
level: Intermediate          # Basic | Intermediate | Advanced
mustKnow: true               # true | false
askedFrequency: very common  # very common | common | sometimes
summary:                     # 3–5 bullets → Quick Revise page and "Remember this" box
  - ...
cards:                       # 3–5 rapid-fire flashcards → Rapid Fire page
  - q: Short question?
    a: Short answer (1–2 sentences).
---
```

Sections, as `##` headings, **exactly these titles in this order**:

1. `## 💡 What is it?`: 2–4 short sentences in very simple English.
2. `## 🏠 Real-life example`: an everyday analogy a 10th-standard student understands (school, home, shop, cricket, restaurant…). Map each part of the analogy to the technical part.
3. `## 🧑‍💻 Code example`: small and runnable. Say how to run it (file name + command). **Every line has a comment** saying what it does and what each value means (e.g. `[] = run only once`, `p-4 = padding of 16px`). Closing brackets get a short comment too (`// end of makeCounter`). Show the output in a separate ```text block when useful. The build warns about lines without a comment.
4. `## 🔍 Deeper version`: the technical explanation an interviewer expects from a 3-year developer. Use tables for comparisons. Comment the code here too.
5. `## 🎯 Why do we use it?`: the real problem it solves.
6. `## ⚠️ Common mistakes`: 2–4 bullets.
7. `## 🗣️ How to answer in an interview`: a 30–60 second spoken answer in the first person, as a `>` blockquote.
8. `## 🔁 Follow-up questions`: 3–5 questions, each as a `###` heading followed by a short answer. The site makes each one collapsible automatically.
9. `## ✅ Quick check`: 2–3 multiple-choice or "predict the output" questions as `###` headings, each answer inside `:::answer … :::`.

### Other templates (set `template:` in frontmatter; the build checks them)

**`template: story`** is for Resume Deep-Dive. One resume project, told as a story. Use the same frontmatter, plus these sections in order:
`## 💡 What is it?` (the project in simple words) → `## 🏠 Real-life example` → `## 🧩 The problem` → `## 🛠️ What I built` → `## 🧗 The hard part` → `## 🏆 The result` → `## 🗣️ How to answer in an interview` (a 2-minute first-person story) → `## 🔁 Follow-up questions` → `## 📚 Topics to revise` (links to topics).
Use ONLY facts from the resume and notes. Every missing detail (numbers, names, phases, tools, team size) is a `[FILL IN: …]`.

**`template: scenario`** is for Debugging Scenarios:
`## 💡 What is it?` (the symptom) → `## 🏠 Real-life example` → `## 🔎 Detect` → `## 🐞 Debug` → `## 🔧 Fix` (code with every line commented) → `## 🛡️ Prevent` → `## 🗣️ How to answer in an interview` → `## 🔁 Follow-up questions` → `## ✅ Quick check`.

**`template: bank`** is for the Resume question bank (`resume/question-bank`): `## 💡 What is it?` → `## 🏠 Real-life example` → `## 🧩 How to use this page` → one collapsible `###` Q&A section per area (see `BANK_SECTIONS` in `plugins/content.ts`) → `## 🛡️ Honest-answer reminders` → `## ✅ Final revision checklist`. Keep it in sync with the story pages.

**`template: answer`** is for HR & Behavioural:
`## 💡 What they really want to know` → `## 🏠 Real-life example` → `## 🧩 How to structure your answer` → `## 🗣️ Sample answer` (first person, built only from confirmed facts plus `[FILL IN]`) → `## ✅ Do` → `## ❌ Don't` → `## 🔁 Follow-up questions` (### headings) → `## ✍️ Your own version` (a fill-in skeleton).
Never put real salary numbers or notice details on the public site.

**`template: chapter`** is for SkillKeepr Story (`skillkeepr-story`): `## 💡 What happens in this chapter` → `## 🏠 Real-life example` → `## 🗺️ The flow` (text diagram) → `## 🧱 Tech used` (table: piece → technology → linked topic) → `## 🧑‍💻 Key code idea` (small, runnable, every line commented) → `## 🧗 Hard parts and trade-offs` → `## 🙋 My part` (ONLY confirmed facts about Hari, else `[FILL IN]`) → `## 🗣️ How to explain it in an interview` → `## 🔁 Follow-up questions` → `## 📚 Topics to revise`. Platform facts stay public-safe. Clearly separate what the platform does from what Hari built.

To add a new template, add its section list to `TEMPLATES` in `plugins/content.ts`.

## Markdown extras

- `[word](glossary:id)`: links to a glossary entry and shows its definition on hover. The `id` must exist in `content/glossary.yaml` (the build fails otherwise). Add new words there.
- `[text](topic:stack/slug)`: links to another topic.
- `:::answer` / `:::solution` / `:::hint` … `:::`: hidden until clicked. Custom label: `:::answer[Show output]`.
- `:::note` / `:::tip` / `:::warning` / `:::version` … `:::`: coloured callout boxes. Use `:::version[Version note]` for "this changed in version X".

## Writing rules (very important)

- **Very simple English.** Hari asked for it simpler than the first draft. Write for a 10th-standard student whose first language is not English:
  - Keep sentences short: about 15 words, never more than 20. Split long sentences into two.
  - Put one idea in each sentence, and at most one new technical word.
  - Use common words: use (not utilise), start (not initiate), needs (not requires), so (not therefore), shows (not demonstrates), about (not approximately), helps (not facilitates), a lot of (not numerous).
  - Use active voice and "you": "Node runs your callback", not "the callback is executed".
  - No idioms: avoid "under the hood", "boils down to", "out of the box", "in a nutshell".
  - Keep paragraphs to 3 sentences or fewer. Prefer bullet lists and small tables.
  - In "🔍 Deeper version", technical words are fine, but explain each one in plain words the first time.
  - In "🗣️ How to answer in an interview", use the correct technical words, because the interviewer expects them. Keep the sentences short and natural to say out loud.
- **Explain every technical word the first time it appears** on the page, in the sentence itself or with a glossary link.
- **Explain every value in code** (what `0`, `[]`, `'admin'`, `403`, `p-4` mean).
- **Technically accurate and current** (October 2026): React 19, Node.js 24 LTS, Express 5, Next.js 16 **App Router only**, Tailwind v4, MUI v7, Mongoose 8+. When behaviour changed between versions, say so briefly in a `:::version` callout.
- **Never invent facts about Hari's work.** Use only what is in `source-notes/` (the resume and notes). If a detail is missing (numbers, names, team size, phases, tools), write `[FILL IN: what is needed]`. In "How to answer in an interview", don't claim Hari did something at SkillKeepr unless the resume or notes say so.
- Write all content originally. Don't copy text from other websites.
- Next.js: Hari has **not** used it in production. Keep it beginner level, and keep interview answers honest about that.

## Known facts (resume + notes + Hari's answers on 2026-10-09 and 2026-10-11)

Sources: the resume, the PDF notes, the "SkillKeepr Backend Interview Preparation Notes" Hari pasted on 2026-10-11 (confirmed by him where they conflicted), `source-notes/INTERVIEW_GUIDE.md` (an internal guide to how SkillKeepr is built), and Hari's own answers in chat. The guide says what the **codebase** contains, not who built it. Only claim Hari built something if he said so.

**Public-site rule:** the site is public. Write SkillKeepr at the level Hari would say in an interview: features, what he built, high-level architecture. NEVER publish internal repo, file or env-variable names, hostnames, or the security weaknesses listed in the guide.

**SkillKeepr (Haspaces Technology Solutions, Trivandrum, since 05/2023), a multi-tenant recruitment SaaS**
- Portals: an admin portal for recruiters and hiring managers, a talent portal for candidates, and a cloud-admin portal for SkillKeepr staff.
- Features: candidate profiles, AI-assisted job descriptions, candidate search and matching, live video interviews with a shared code editor, one-sided recorded interviews, scheduling and reminders, bulk resume parsing, Stripe subscriptions, ATS/CRM integrations.
- Architecture (high level):
  - three React SPAs on S3 + CloudFront
  - a serverless backend: Serverless Framework, many AWS Lambda functions behind API Gateway, Node.js + TypeScript, Mongoose, Joi validation
  - shared backend and UI libraries ("core-service"), used across services
  - background work on SQS, Step Functions, EventBridge crons and AWS Batch
  - MongoDB with one database per tenant
- Tenant flow: the tenant comes from the subdomain, travels as a header, and is locked inside the JWT. Auth uses HttpOnly JWT cookies.
- Frontend: Redux + redux-saga, React Router v5, Webpack, **Mantine 7**. Hari confirmed on 2026-10-10 that the UI library is **Mantine**, not Material UI. Forms use @mantine/form, and services validate with **Joi**. Ant Design and Tailwind are from his early career. He doesn't remember using the Context API and is learning it now, so never claim he used it at work.

**Hari's own work:**
- **Stripe:** only the **auto-renewal** part: the renewal cron and the webhook trigger. He tested it with **Stripe Test Clocks**. Other developers built the purchase flow.
  - The codebase (not necessarily Hari) has: `charge_automatically` collection, stored subscription ID and plan dates, scheduled jobs for expiry reminders and blocked-account notices, account blocking after a configured grace period, a manual renewal path, and a separate free-tier extension flow. Exact event names and retry rules: [FILL IN]. Hari may say he would revisit the module for low-level details.
- **AI JD chatbot:** recruiters give high-level JD details, and OpenAI generates the rest. Hari built the **backend**; another developer built the frontend.
  - Flow: frontend → Node backend → a **Python agent** that calls OpenAI → back to the Node backend. Hari **mapped and validated** the response into the expected JD shape (it didn't always match). The JD is returned for **preview** and saved to MongoDB **only after the recruiter confirms**. Validation library: [FILL IN] (don't name one).
- **ATS integration via unified.to:**
  - unified.to is one API for many ATSs: Workable, Greenhouse, Lever, Zoho, and others. Recruiters authorise their ATS account; Hari built the backend, another developer the frontend.
  - Built by Hari's team: pulling jobs (they already existed in Greenhouse/Lever), pulling candidates, and syncing interview status.
  - A **Sync button** on a JD fetches new candidates (manual sync). There was also a configurable **time-based (scheduled) sync**; intervals: [FILL IN]. It was **not** webhook-driven.
  - Duplicates are checked by **email**; if the candidate already exists, the full details aren't fetched again and the existing record is **not updated**. The existing candidate is just linked to the JD, and an existing candidate–JD link is skipped.
  - Tested with **Workable**, Zoho, Greenhouse and Lever. It was a **trial feature with no real customer usage**. Don't claim a compound unique index unless verified.
- **Shared core-service library:** Hari worked on it, including the authentication modules (built together with the team). Shared patterns in the codebase: a response builder, authorizer decorators, pagination/sorting helpers, data-transformation helpers, Stripe wrappers, integration utilities. The "~30% faster development" is an **estimate, not measured**. Don't claim he built the whole library.
- **Other work:** backend code optimisation, Jest unit tests, Swagger docs. PostgreSQL is used: [FILL IN: where].
- **MongoDB aggregations and indexes:** Hari doesn't remember exactly which pipelines or indexes he wrote. Pages must suggest that he confirm one real pipeline and one real index from the code before claiming them.

**AI voice agent (Hari's recent project, separate repo):**
- Recruiters and hiring teams use AI agents to phone candidates and collect basic details, which saves recruiter time.
- All services are **hosted on AWS** (not GCP).
- Standard voice: Twilio + Google Cloud Speech-to-Text and Text-to-Speech + Claude as the LLM, driven by a phase-based state machine.
- Premium voice: xAI Grok Voice instead of Google's speech services. **Grok handles only the call audio (the voice).** Claude still does the thinking: the conversation logic and decisions, in both modes.
- The voice service is a **Python FastAPI** microservice (the main platform backend is Node.js). The main backend calls it over HTTP to start a call; it calls back over HTTP with the transcript and recording info. Internal networking details: don't guess.
- **Build-vs-buy (confirmed 2026-10-11):** SkillKeepr first used **Retell AI**; cost became a concern. Hari researched Twilio + Google Cloud speech + an LLM, presented cost and feasibility to the team, and was asked to build the separate voice service. He **estimated** about **65%** lower cost (an estimate, not measured).
- **Latency/turn-taking fix (Hari's):** the agent took a short pause as the end of the candidate's turn and interrupted. He raised the wait from about **2–3 s to 5–7 s**, tested with calls, and checked AWS CloudWatch and voice-service logs. He also saw calls that connected but the agent didn't respond, and traced them in the logs.
- Interview levels: configurations such as **basic** (experience, notice period, visa/sponsorship; about 5–10 minutes) and **intermediate** (skills and past experience; longer).
- Calls start in two ways: **a recruiter can start a call** from SkillKeepr, and calls also go out **automatically** to eligible candidates. Automatic flow:
  1. Candidates are scored.
  2. Each candidate who is **eligible after scoring** gets an automatic call from the AI agent.
  3. The call recording is **stored in S3**.
  4. AI then **evaluates and scores the call**.
  5. Recruiters review the results instead of making the calls. That is where the time is saved.
- Time saved is an **estimate, not measured**: a manual call takes 10–15 minutes, and up to 20 for longer HR calls. Always say "an estimated…".

**Railway:** used only for personal projects.

**Unclear, so flag them:**
- **Gap analysis (confirmed 2026-10-11):** the tech lead asked Hari to find why resume scoring and candidate scoring gave different results between the **prototype and production**. He traced the logic (technical skills, experience, trust score), found the formulas differed, aligned production with the prototype (the prototype held the intended business rules), and checked the applied formula in **CloudWatch logs** (no formal automated test unless confirmed). Trust Score: he investigated how it is calculated but did **not** fix a Trust Score issue.
- **Context API and GCP:** the notes' "Tell me about yourself" mentions both. Keep the rules above: never claim Context API at work, and GCP means only Google Cloud speech services (hosting is AWS).

**Education:** BSc Physics (2022), MERN course at Brototype Kozhikode (2023), MCA at Amity Online (2026).

**Always [FILL IN]:** team size, latency numbers, state-machine phase names, error-tracking tool, salary, notice period.

## Workflow

All 22 stacks are written (544 topics, October 2026). When adding or editing topics, follow the templates above. Run `npm run build`, fix every error, and add new glossary words to `content/glossary.yaml`. Every definition with `: ` in it must be in double quotes.
Practice problems live in `content/problems/`: Problem → Examples → Think first (`:::hint`) → Solution (`:::solution`, two ways, complexity, "what to say"). Use these pattern names: Hash map / Set, Two pointers, Sliding window, Kadane, Prefix sum, Binary search, Stack, Single pass, Recursion, Math / XOR, Reverse trick, Sorting.

## "How the Web Works" stack (web-fundamentals)

Added 2026-10-20, first in the sidebar. It explains the core: how JS runs in the browser and in Node, modules, npm, bundlers (webpack, Vite), Babel, TS/JSX compilation, localhost and dev servers, dev vs prod builds, SPA serving, hosting on AWS, same-origin policy, caching, and an end-to-end interview walkthrough. It goes deeper than the javascript/nodejs/html-css topics and links to them instead of repeating them.

## Slugs already linked from written topics (use these exact file slugs when writing those stacks)

architecture: microservices, monolith, state-machines, serverless-lambda, event-driven, multi-tenant, gap-analysis-adrs · rest-auth: webhooks, webhook-signatures, idempotency-keys, websockets · ai: voice-ai, structured-outputs, tool-calling · devops: github-actions · testing: jest-basics · debugging: duplicate-webhook-events · system-design: queues-background-jobs · react: what-causes-a-re-render · dsa: two-sum, move-zeros · redux-context: how-to-choose · mantine-tailwind: mui-and-tailwind-together · responsive-design: what-is-responsive-design.
Check with `npm run build` — it warns about every link to a topic that doesn't exist yet.

## [FILL IN] checklist

`npm run fillins` regenerates `FILL-IN-CHECKLIST.md`, which lists every placeholder, resume pages first.
