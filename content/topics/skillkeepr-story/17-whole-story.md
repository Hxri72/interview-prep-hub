---
template: chapter
title: Telling the whole SkillKeepr story in an interview
stack: skillkeepr-story
order: 17
level: Intermediate
mustKnow: true
askedFrequency: very common
summary:
  - Have two versions ready — 90 seconds and 5 minutes — and let the interviewer pull you into details.
  - "Follow the user's journey: a company joins → a recruiter logs in → creates a job → finds candidates → AI call → interview → billing."
  - Always separate "the platform does…" from "my part was…". Interviewers test ownership.
  - Keep the security and isolation story (tenants) and the production stories (debugging, shipping) ready as deep-dives.
  - Every chapter of this story links to the concept topics behind it — revise those for follow-ups.
cards:
  - q: How do you start the SkillKeepr story?
    a: One line on the product (a multi-tenant recruitment SaaS for recruiters and candidates), then my role, then the user journey, then my parts in depth.
  - q: What are your own pieces of work you should mention?
    a: Stripe auto-renewal, the AI JD chatbot backend, the unified.to ATS integration backend, shared auth modules with the team, the AI voice agent, plus backend optimisation, Jest tests and Swagger docs.
  - q: Why separate "the platform" from "my part"?
    a: Interviewers dig into anything you claim. Being clear about what you built makes you more believable, not less.
  - q: What is the high-level architecture in one sentence?
    a: React apps on S3 and CloudFront, a serverless Node.js backend of Lambda functions behind API Gateway, MongoDB with one database per company, and queues for background work.
---

## 💡 What happens in this chapter

This chapter puts **all 16 chapters together** into one story you can tell out loud.

It gives you a **90-second version**, a **5-minute version**, and the follow-ups each part usually leads to.

## 🏠 Real-life example

Think of **showing a friend around your school**.

- **The gate and the main building** = what the product is and who uses it.
- **Walking the route a new student takes** = the user's journey through the app.
- **"This is the lab I helped set up"** = your own work, clearly marked.
- **The friend asks "how does the lab work?"** = a follow-up. You open the right chapter.

## 🗺️ The flow

```text
Joining and logging in
  1. Meet SkillKeepr  →  2. A new company joins  →  3. A recruiter logs in  →  4. The dashboard loads
Hiring work
  5. Creating a job with AI  →  6. Pulling from an ATS  →  7. Bulk resume upload  →  8. Searching and scoring
Talking to candidates
  9. AI screening call  →  10. Scheduling and reminders  →  11. Live video interview  →  12. Billing and renewal
Running it well
  13. Keeping companies apart  →  14. When things break  →  15. Shipping a change  →  16. Growing 10×
```

## 🧱 Tech used

| Chapter | Main technology | Chapter link |
|---|---|---|
| 1 | Product overview | [Meet SkillKeepr](topic:skillkeepr-story/meet-skillkeepr) |
| 2 | Tenants, subdomains, database per company | [A new company joins](topic:skillkeepr-story/new-company-joins) |
| 3 | DNS, CloudFront, S3, JWT in HttpOnly cookies | [A recruiter logs in](topic:skillkeepr-story/recruiter-logs-in) |
| 4 | React + Redux-saga, API Gateway, Lambda, MongoDB aggregation | [The dashboard loads](topic:skillkeepr-story/dashboard-loads) |
| 5 | Node backend, Python agent, OpenAI, validation | [Creating a job with AI](topic:skillkeepr-story/creating-job-with-ai) |
| 6 | unified.to, sync, dedupe by email | [Pulling from an ATS](topic:skillkeepr-story/ats-sync) |
| 7 | S3 uploads, queues, parsing | [Bulk resume upload](topic:skillkeepr-story/bulk-resume-upload) |
| 8 | Search, scoring | [Searching and scoring](topic:skillkeepr-story/search-and-scoring) |
| 9 | Twilio, Google speech, Claude, Grok, FastAPI, S3 | [AI screening call](topic:skillkeepr-story/ai-screening-call) |
| 10 | Scheduling, reminders | [Scheduling and reminders](topic:skillkeepr-story/scheduling-interview) |
| 11 | Video calls, WebSocket code editor | [Live video interview](topic:skillkeepr-story/live-interview) |
| 12 | Stripe, cron, webhooks, Test Clocks | [Billing and renewal](topic:skillkeepr-story/billing-renewal) |
| 13 | Tenant checks, cache keys | [Keeping companies apart](topic:skillkeepr-story/keeping-tenants-apart) |
| 14 | CloudWatch logs, debugging | [When things break](topic:skillkeepr-story/when-things-break) |
| 15 | Git, CI, webpack, Serverless, S3/CloudFront | [Shipping a change](topic:skillkeepr-story/shipping-a-change) |
| 16 | Caching, indexes, queues | [Growing 10×](topic:skillkeepr-story/growing-10x) |

## 🧑‍💻 Key code idea

A small script that prints the story as an outline. Read it out loud once a day until you can say it without looking. Save as `chapters.js`, run `node chapters.js`.

```js
// chapters.js — print the story as a numbered outline
const parts = [                                                   // the story in four parts
  ['Joining and logging in', ['Meet SkillKeepr', 'A new company joins', 'A recruiter logs in', 'The dashboard loads']], // part 1
  ['Hiring work', ['Creating a job with AI', 'Pulling from an ATS', 'Bulk resume upload', 'Searching and scoring']],     // part 2
  ['Talking to candidates', ['AI screening call', 'Scheduling and reminders', 'Live video interview', 'Billing and renewal']], // part 3
  ['Running it well', ['Keeping companies apart', 'When things break', 'Shipping a change', 'Growing 10x']],            // part 4
];                                                                // end of the parts
let n = 1;                                                        // chapter counter
for (const [title, chapters] of parts) {                          // each part with its chapters
  console.log(`\n${title}`);                                      // print the part name
  for (const c of chapters) console.log(`  ${n++}. ${c}`);        // print each chapter with its number
}                                                                 // end of the loop
console.log(`\n${n}. Telling the whole story`);                   // the last chapter: this one
```

```text

Joining and logging in
  1. Meet SkillKeepr
  2. A new company joins
  3. A recruiter logs in
  4. The dashboard loads

Hiring work
  5. Creating a job with AI
  6. Pulling from an ATS
  7. Bulk resume upload
  8. Searching and scoring

Talking to candidates
  9. AI screening call
  10. Scheduling and reminders
  11. Live video interview
  12. Billing and renewal

Running it well
  13. Keeping companies apart
  14. When things break
  15. Shipping a change
  16. Growing 10x

17. Telling the whole story
```

## 🧗 Hard parts and trade-offs

- **Too much detail too early.** Start high level. Let the interviewer choose where to go deeper.
- **Claiming too much.** The platform has many features built by a team. Say clearly which parts were yours. [FILL IN] items are things only you can confirm.
- **Too little detail on your own work.** For your parts, be ready with the problem, what you built, the hard part and the result.
- **Public vs private.** Talk about architecture at a high level. Don't share internal names, keys or security weak spots of a real product.

## 🙋 My part

Only these are confirmed as my work. Everything else in the story is "the platform" or "the team".

- **Stripe auto-renewal**: the renewal cron and webhook trigger, tested with Stripe Test Clocks. Other developers built the purchase flow.
- **AI JD chatbot backend**: Node backend → a Python agent that calls OpenAI → I mapped and validated the result into the job-description shape → preview → saved only after the recruiter confirms. Another developer built the frontend.
- **ATS integration backend via unified.to**: pulling jobs and candidates, interview-status sync, a manual Sync button and scheduled sync, duplicates skipped by email. It was a trial feature.
- **Shared auth modules**, together with the team, in the shared backend library.
- **AI voice agent** (my recent project): a Python FastAPI service on AWS with Twilio, Google speech-to-text and text-to-speech, and Claude for the thinking; Grok Voice for premium calls. Includes the turn-taking fix (wait raised from about 2–3 s to 5–7 s).
- **Scoring gap analysis**: aligned production scoring with the prototype and checked it in CloudWatch logs.
- **Also**: backend code optimisation, Jest unit tests, Swagger API docs.
- [FILL IN: team size, your exact frontend/backend split, and how long you've owned each piece.]

## 🗣️ How to explain it in an interview

**90-second version:**

> "SkillKeepr is a multi-tenant recruitment SaaS. Recruiters manage jobs and candidates, candidates apply and interview, and each customer company gets its own subdomain and its own MongoDB database. The frontend is React with Redux and redux-saga, hosted on S3 and CloudFront. The backend is serverless Node.js and TypeScript: Lambda functions behind API Gateway, with queues for slow work like resume parsing.
>
> My own work: I built the Stripe auto-renewal, the backend of our AI job-description chatbot, and the backend of our ATS integration through unified.to. I worked on the shared authentication modules with the team. Most recently I built an AI voice agent that screens candidates by phone, using Twilio, Google speech and Claude. I also write Jest tests and maintain Swagger docs. Happy to go deeper into any of these."

**5-minute version** (walk the journey, pause after each part):

> "Let me follow one customer. When a new company joins, it gets a subdomain and its own database. [Chapter 2]
>
> A recruiter opens their subdomain. The React app loads from CloudFront, and login sets a JWT in an HttpOnly cookie, with the company locked inside it. Every API call is checked against that company. [Chapters 3, 4, 13]
>
> To create a job, the recruiter can use our AI chatbot. I built its backend: our Node service calls a Python agent that uses OpenAI, and I map and validate the answer into our job format. The recruiter previews it, and we save only after they confirm. [Chapter 5]
>
> Jobs and candidates can also come from their ATS. I built the backend of that integration with unified.to. A Sync button or a scheduled sync pulls new candidates, and we skip anyone whose email already exists. [Chapter 6]
>
> Candidates who pass scoring can get an AI screening call. That's my voice agent: Twilio for the call, Google speech, and Claude deciding what to say through a phase-based state machine. The recording goes to S3 and is scored, so recruiters just review results. [Chapters 8, 9]
>
> Billing runs on Stripe subscriptions. I built the auto-renewal part, a cron plus webhook handling, and tested renewals with Stripe Test Clocks. [Chapter 12]
>
> When things break, I go detect, debug, fix, prevent. For example, I fixed the voice agent interrupting candidates by raising the end-of-turn wait. [Chapter 14]
>
> Changes go through a branch, review, checks and an automated deploy. [Chapter 15] [FILL IN: one sentence about what you'd improve next, from Chapter 16.]"

## 🔁 Follow-up questions

### "Draw the architecture."

Use chapter 1's map: browser → CloudFront/S3 → API Gateway → Lambda → MongoDB per company, plus queues, Stripe, unified.to, OpenAI, and the separate voice service. See [Meet SkillKeepr](topic:skillkeepr-story/meet-skillkeepr) and [Resume: platform architecture](topic:resume/platform-architecture).

### "How do you keep customers' data apart?"

Go to [chapter 13](topic:skillkeepr-story/keeping-tenants-apart).

### "Tell me about a production issue you fixed."

Go to [chapter 14](topic:skillkeepr-story/when-things-break): the voice-agent turn-taking fix, or the scoring gap analysis.

### "What was the hardest part of the voice agent?"

Go to [chapter 9](topic:skillkeepr-story/ai-screening-call) and [the voice state machine](topic:resume/voice-state-machine).

### "What would you improve?"

Go to [chapter 16](topic:skillkeepr-story/growing-10x). Pick one or two ideas you can defend.

## 📚 Topics to revise

- [Putting it together: explain your app end to end](topic:web-fundamentals/end-to-end-story)
- [Resume: SkillKeepr overview](topic:resume/skillkeepr-overview)
- [Resume: platform architecture](topic:resume/platform-architecture)
- [Resume question bank](topic:resume/question-bank)
- [Tell me about yourself](topic:hr/tell-me-about-yourself)
