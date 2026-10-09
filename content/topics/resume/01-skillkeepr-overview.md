---
template: story
title: "SkillKeepr: what the product does and my role"
stack: resume
order: 1
level: Basic
mustKnow: true
askedFrequency: very common
summary:
  - SkillKeepr is a multi-tenant recruitment SaaS built by Haspaces Technology Solutions. I have worked there as a Software Engineer since May 2023.
  - "It has three portals: an admin portal for recruiters, a talent portal for candidates, and a cloud-admin portal for SkillKeepr staff."
  - Each customer company gets its own database, but all companies share the same servers.
  - "My parts: Stripe auto-renewal, the backend of the AI job-description chatbot, ATS integration through unified.to (with my team), shared core-service and auth modules, backend optimisation, Jest tests and Swagger docs."
  - "My most recent project: an AI voice agent that phones candidates for recruiters."
cards:
  - q: What is SkillKeepr, in one sentence?
    a: A multi-tenant recruitment SaaS where companies manage jobs, candidates and interviews, with AI helping in job descriptions, search and screening.
  - q: Who uses the platform?
    a: Recruiters and hiring managers (admin portal), candidates (talent portal), and SkillKeepr staff who manage customer companies (cloud-admin portal).
  - q: What is your role there?
    a: Software Engineer since May 2023. I build backend features in Node.js and TypeScript, and also work on React screens.
  - q: Name three things you built.
    a: The Stripe auto-renewal flow (cron + webhook), the backend of the AI job-description chatbot, and an AI voice agent that calls candidates.
  - q: How is your time split between frontend and backend?
    a: "[FILL IN: your honest split, e.g. 70% backend / 30% frontend] — with one example of each."
---

## 💡 What is it?

**SkillKeepr** is a recruitment platform sold as a service (**SaaS** = software you use online and pay for monthly). It is built by **Haspaces Technology Solutions** in Trivandrum. I have worked there as a **Software Engineer since May 2023**.

Many companies use it at the same time. That makes it **[multi-tenant](glossary:multi-tenant)**. Each company sees only its own jobs and candidates.

This page is your "home base" story. Almost every interview starts here.

## 🏠 Real-life example

Think of a **big shopping mall**.

- The **mall building** = SkillKeepr's shared servers.
- Each **shop** = one customer company (a tenant). Each shop has its own locked storeroom = its own database.
- **Shop staff** = recruiters, using the admin portal.
- **Customers walking in** = candidates, using the talent portal.
- The **mall management office** = SkillKeepr staff, using the cloud-admin portal to add new shops and manage plans.

## 🧩 The problem

Hiring is slow and manual. Recruiters write job descriptions, collect resumes, search for the right people, schedule interviews and track everything in many places.

SkillKeepr puts all of this in one place:
- **Job descriptions** — including AI help to write them.
- **Candidate profiles** — with bulk resume upload and automatic parsing.
- **Candidate search and matching** for each job.
- **Interviews** — live video interviews with a shared code editor, and one-sided recorded interviews.
- **Scheduling and reminders.**
- **Subscriptions and billing** with Stripe.
- **ATS and CRM integrations** — an ATS is the hiring software a company already uses, like Greenhouse or Lever.

## 🛠️ What I built

These are the parts I personally worked on:

- **Stripe auto-renewal** — the renewal cron and the webhook trigger. See [Stripe billing](topic:resume/stripe-billing).
- **The AI job-description chatbot (backend)** — a recruiter gives the main points, and OpenAI writes the rest. Another developer built the frontend. See [OpenAI structured outputs](topic:resume/openai-structured-outputs).
- **ATS integration through unified.to** (with my team) — pulling jobs and candidates from Greenhouse, Lever and Zoho. See [ATS integration](topic:resume/ats-integration).
- **The shared core-service library**, including the authentication modules, together with the team. See [Reusable modules](topic:resume/reusable-modules).
- **Backend code optimisation**, **Jest unit tests** and **Swagger** API docs.
- **My recent project:** an **AI voice agent** that phones candidates for recruiters. See [Voice agent](topic:resume/voice-agent-microservice).

[FILL IN: team size and roles — how many developers, QA, product, design.]
[FILL IN: how work is assigned to you — sprint tickets, feature ownership?]

## 🧗 The hard part

The platform is big. It has many services, many background jobs and many external tools. Learning where things live took time.

[FILL IN: the hardest thing for you when you joined, or the hardest feature so far — one concrete example.]

## 🏆 The result

- I have shipped features across billing, AI, integrations and the shared backend library.
- I moved from feature work to building a full new service: the AI voice agent.

[FILL IN: any result you can prove — features shipped, bugs fixed, test coverage you added, praise from the team.]

## 🗣️ How to answer in an interview

> "I'm a Software Engineer at Haspaces Technology Solutions, where I work on SkillKeepr. It's a multi-tenant recruitment SaaS. There are three portals: one for recruiters, one for candidates, and one for our own team to manage customer companies. Each customer gets its own database, and the backend is serverless on AWS.
>
> On the backend I built the Stripe auto-renewal flow, which is a renewal cron plus webhook handling. I built the backend for our AI job-description chatbot, where a recruiter gives the key points and OpenAI writes the full job description. With my team I built the ATS integration through unified.to, so we can pull jobs and candidates from tools like Greenhouse and Lever. I've also worked on our shared core-service library, including authentication, plus Jest tests, Swagger docs and backend optimisation.
>
> Most recently, I built an AI voice agent. It phones candidates for recruiters and collects their basic details, so recruiters save time on first calls."

## 🔁 Follow-up questions

### Which parts did you build yourself, and which did others build?

Be exact. Mine: Stripe auto-renewal (cron + webhook), the JD chatbot backend, the voice agent, Jest tests, Swagger docs, backend optimisation. Shared with the team: ATS integration via unified.to, the core-service and auth modules. Others built: the Stripe purchase flow and the JD chatbot frontend.

### What does SkillKeepr do for a recruiter, step by step?

Create a job (with AI help) → bring in candidates (upload resumes or sync from an ATS) → search and shortlist → schedule interviews → interview live or with a recorded interview → review and decide.

### What is the tech stack?

React SPAs on the frontend. A serverless backend on AWS: Lambda functions with Node.js and TypeScript, MongoDB with Mongoose, and Joi for validation. Queues and scheduled jobs for background work. See [Platform architecture](topic:resume/platform-architecture).

### Why are you looking for a change?

Keep it positive: growth, bigger scale, new challenges. [FILL IN: your honest reason.] Never criticise your current company.

### What would you do differently if you rebuilt it?

[FILL IN: one real trade-off you have seen — for example faster cold starts, more tests in CI, or simpler shared libraries.]

## 📚 Topics to revise

- [Platform architecture](topic:resume/platform-architecture)
- [Multi-tenant platform](topic:resume/multi-tenant-platform)
- [Multi-tenant data design](topic:mongodb/multi-tenant-design)
- [What Express is](topic:express/what-is-express) and [What Node.js is](topic:nodejs/what-is-nodejs)
