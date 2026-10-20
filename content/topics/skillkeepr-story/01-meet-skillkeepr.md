---
template: chapter
title: "Meet SkillKeepr: the product, the people and the map of this story"
stack: skillkeepr-story
order: 1
level: Basic
mustKnow: true
askedFrequency: very common
summary:
  - SkillKeepr is a multi-tenant hiring platform. Many companies use one system, but each company's data stays separate.
  - It has three portals. Recruiters use the admin portal, candidates use the talent portal, and SkillKeepr staff use the cloud-admin portal.
  - "High level: React apps on S3 + CloudFront, a serverless Node.js backend (Lambda + API Gateway), and one MongoDB database per company."
  - Slow work (resume parsing, scoring, reminders) runs in the background with queues and scheduled jobs.
  - This story follows one company (Acme Hiring), one recruiter (Priya) and one candidate (Rahul) through every chapter.
cards:
  - q: What is SkillKeepr, in one sentence?
    a: A multi-tenant recruitment SaaS where companies post jobs, find and screen candidates, and run interviews, with each company's data kept separate.
  - q: What are SkillKeepr's three portals?
    a: The admin portal for recruiters and hiring managers, the talent portal for candidates, and the cloud-admin portal for SkillKeepr staff.
  - q: What is the high-level architecture?
    a: React single-page apps on S3 + CloudFront, a serverless Node.js + TypeScript backend on AWS Lambda behind API Gateway, and MongoDB with one database per company.
  - q: Where does slow work happen?
    a: In the background, with queues (SQS), workflows (Step Functions), scheduled jobs (EventBridge) and batch jobs, so users don't wait for it.
  - q: What did you personally build on SkillKeepr?
    a: Stripe auto-renewal, the backend of the AI job-description chatbot, the ATS integration via unified.to with my team, work on the shared backend library including auth, Jest tests, Swagger docs, and the separate AI voice agent.
---

## 💡 What happens in this chapter

This chapter is the **map** for the whole story.

You meet the product, the people who use it, and the big picture of how it is built. Every later chapter zooms into one moment, like logging in or an AI screening call.

Each chapter links to the concept topics behind it. So this section connects everything you studied into **one real system**.

## 🏠 Real-life example

Think of a **big school with many classes**.

- The **school building** = SkillKeepr, one system everyone uses.
- **Each class with its own register and cupboard** = each company with its own database. Class A never sees Class B's marks.
- The **teachers** = recruiters (like Priya). They run the work.
- The **students** = candidates (like Rahul). They apply and get interviewed.
- The **school office** = SkillKeepr staff in the cloud-admin portal. They add new classes and handle fees.
- The **night staff** who clean and prepare for tomorrow = background jobs and queues.

In this story, **Acme Hiring** is one class. **Priya** is its teacher, and **Rahul** is a student. They are made-up names for the running example.

## 🗺️ The flow

The big picture, from a browser to the database:

```text
          Priya (recruiter)                    Rahul (candidate)
                │                                     │
       admin portal (React)                 talent portal (React)
                └──────────────┬──────────────────────┘
                               ▼
            DNS → CloudFront → S3   (the React apps are static files)
                               │
                     browser calls the API
                               ▼
                 API Gateway  →  AWS Lambda functions (Node.js + TypeScript)
                               │
             ┌─────────────────┼──────────────────────┐
             ▼                 ▼                      ▼
   MongoDB: one database   Background work:      Outside services:
   per company             SQS queues,           Stripe, unified.to (ATS),
   (Acme has its own)      Step Functions,       OpenAI (via a Python agent),
                           scheduled jobs        email, video interviews
                               │
                     AI voice agent (separate Python service on AWS)
```

**The chapter map.** Each row is one moment in the life of the platform:

| # | Chapter | What it covers |
|---|---|---|
| 2 | [A new company joins](topic:skillkeepr-story/new-company-joins) | Tenants, subdomains, a database per company |
| 3 | [A recruiter logs in](topic:skillkeepr-story/recruiter-logs-in) | DNS, CloudFront, JWT cookies, tenant check |
| 4 | [The dashboard loads](topic:skillkeepr-story/dashboard-loads) | React, Redux + saga, Lambda, aggregation |
| 5 | [Creating a job with AI](topic:skillkeepr-story/creating-job-with-ai) | The JD chatbot (my backend work) |
| 6 | [Pulling from an ATS](topic:skillkeepr-story/ats-sync) | unified.to sync (my team's work) |
| 7 | [Bulk resume upload](topic:skillkeepr-story/bulk-resume-upload) | S3 uploads, queues, parsing |
| 8 | [Searching and scoring](topic:skillkeepr-story/search-and-scoring) | Search, scoring in the background |
| 9 | [The AI screening call](topic:skillkeepr-story/ai-screening-call) | The voice agent (my project) |
| 10 | [Scheduling and reminders](topic:skillkeepr-story/scheduling-interview) | Slots, reminders, workflows |
| 11 | [The live interview](topic:skillkeepr-story/live-interview) | Video, shared code editor, WebSockets |
| 12 | [Billing and auto-renewal](topic:skillkeepr-story/billing-renewal) | Stripe renewals (my work) |
| 13 | [Keeping data apart](topic:skillkeepr-story/keeping-tenants-apart) | Multi-tenant safety |
| 14 | [When things break](topic:skillkeepr-story/when-things-break) | Logs, debugging, fixes |
| 15 | [Shipping a change](topic:skillkeepr-story/shipping-a-change) | Git, review, CI, deploy |
| 16 | [Growing to 10×](topic:skillkeepr-story/growing-10x) | Scaling, caching, indexes |
| 17 | [The whole story](topic:skillkeepr-story/whole-story) | A 5-minute interview answer |

## 🧱 Tech used

| Piece | Technology | Learn it |
|---|---|---|
| Frontend apps | React + TypeScript, Redux + redux-saga, Mantine | [What React is](topic:react/what-is-react), [redux-saga](topic:redux-context/redux-saga), [Mantine setup](topic:mantine-tailwind/mantine-setup) |
| Hosting the frontend | S3 + CloudFront | [Hosting a frontend on AWS](topic:web-fundamentals/hosting-frontend-aws) |
| Backend | Node.js + TypeScript on AWS Lambda, behind API Gateway | [Serverless and Lambda](topic:architecture/serverless-lambda), [Hosting a backend on AWS](topic:web-fundamentals/hosting-backend-aws) |
| Validation | Joi | [Validation with Joi](topic:express/joi) |
| Database | MongoDB with Mongoose, one database per company | [Shared vs per-tenant database](topic:architecture/shared-vs-db-per-tenant) |
| Background work | SQS, Step Functions, EventBridge, Batch | [Queues and background jobs](topic:system-design/queues-background-jobs) |
| Login | JWT in HttpOnly cookies | [JWT login flow](topic:rest-auth/jwt-login-flow) |
| The whole journey | Browser → server → database → screen | [The big picture](topic:web-fundamentals/big-picture) |

## 🧑‍💻 Key code idea

A tiny simulation of **one request's trip**, from Priya's browser to her dashboard. Save it as `trace.js` and run `node trace.js`.

```js
const steps = [                                              // each hop a request makes, in order
  ['Browser', 'Priya types acme.skillkeepr.example'],         // the recruiter opens her company's address
  ['DNS', 'finds the CDN address for that name'],             // DNS turns the name into an IP address
  ['CloudFront + S3', 'sends index.html and the JS files'],   // the React app is just static files
  ['React app', 'reads "acme" from the address bar'],         // the tenant comes from the subdomain
  ['API Gateway', 'receives GET /dashboard with cookies'],    // the front door for every API call
  ['Lambda', 'checks the JWT and the tenant'],                // a small function runs only for this request
  ['MongoDB (acme db)', 'counts candidates and jobs'],        // Acme's own database answers
  ['Browser', 'shows the numbers on the dashboard'],          // the result is drawn on screen
];                                                           // end of the list of hops
let time = 0;                                                // a pretend clock in milliseconds
for (const [where, what] of steps) {                          // walk through every hop
  time += 20;                                                // pretend each hop takes 20 ms
  console.log(`${String(time).padStart(4)} ms  ${where.padEnd(18)} ${what}`); // print one line per hop
}                                                            // end of the loop
console.log(`Total: ${time} ms (pretend numbers)`);           // the whole trip, from click to screen
```

```text
  20 ms  Browser            Priya types acme.skillkeepr.example
  40 ms  DNS                finds the CDN address for that name
  60 ms  CloudFront + S3    sends index.html and the JS files
  80 ms  React app          reads "acme" from the address bar
 100 ms  API Gateway        receives GET /dashboard with cookies
 120 ms  Lambda             checks the JWT and the tenant
 140 ms  MongoDB (acme db)  counts candidates and jobs
 160 ms  Browser            shows the numbers on the dashboard
Total: 160 ms (pretend numbers)
```

The times are made up. The **order** of the hops is the real lesson. `acme.skillkeepr.example` is a pretend address for the example.

## 🧗 Hard parts and trade-offs

- **Many companies, one system.** Sharing servers saves money. But each company's data must never leak to another. That is why each company gets its own database (chapter 13).
- **Serverless backend.** Lambda scales on its own and you pay per use. The trade-off is cold starts and time limits on long jobs (see [serverless limits](topic:architecture/serverless-limits)).
- **Lots of slow work.** Parsing resumes, scoring and reminders can't happen while a user waits. So they move to queues and scheduled jobs.
- **Many outside services.** Stripe, ATS systems, AI models and email can be slow or down. The code needs timeouts and retries.

## 🙋 My part

These facts come from my resume and confirmed notes:

- I have worked at **Haspaces Technology Solutions on SkillKeepr since 05/2023**, on React/TypeScript frontends and Node.js backends.
- **Stripe:** I built the **auto-renewal** part (the renewal cron and webhook trigger) and tested it with Stripe Test Clocks.
- **AI JD chatbot:** I built the **backend**. Another developer built the frontend.
- **ATS integration via unified.to:** I built the backend with my team.
- **Shared backend library:** I worked on it, including the authentication modules, together with the team.
- **Quality:** backend code optimisation, Jest unit tests and Swagger docs.
- **AI voice agent:** my recent project, a separate service on AWS.

The platform has many other parts built by other developers. [FILL IN: team size and how work is split]

## 🗣️ How to explain it in an interview

> "SkillKeepr is a multi-tenant recruitment SaaS. Companies use it to post jobs, find and screen candidates and run interviews. There are three portals: one for recruiters, one for candidates, and one for our own staff to manage customer companies.
>
> The frontend is React with TypeScript, Redux and redux-saga, and Mantine. The apps are static files served from S3 through CloudFront. The backend is serverless: Node.js and TypeScript on AWS Lambda behind API Gateway. Each customer company gets its own MongoDB database. Slow work like resume parsing, scoring and reminders runs in the background with queues and scheduled jobs.
>
> My main work was Stripe auto-renewal, the backend of the AI job-description chatbot, the ATS integration through unified.to, work on our shared backend library including auth, and recently an AI voice agent that phones candidates."

## 🔁 Follow-up questions

### Why is it called multi-tenant?

"Tenant" means one customer company. Multi-tenant means many companies share the same application and servers. Their data is still kept apart. At SkillKeepr each company has its own database.

### Why a serverless backend?

Traffic is bursty and spread across many endpoints. Lambda scales on its own, and you pay only when code runs. Each function can also have its own time limit. See [serverless and Lambda](topic:architecture/serverless-lambda).

### Which part was the hardest to understand when you joined?

[FILL IN: your honest answer, for example the tenant flow or the background jobs.]

### Is it a monolith or microservices?

The main backend is one codebase deployed as many Lambda functions. That is often called a "serverless monolith". The AI voice agent is a separate service. See [monolith vs microservices](topic:architecture/microservices).

## 📚 Topics to revise

- [The big picture: from code to user](topic:web-fundamentals/big-picture)
- [Explain your app end to end](topic:web-fundamentals/end-to-end-story)
- [Multi-tenant architecture](topic:architecture/multi-tenant)
- [Serverless and AWS Lambda](topic:architecture/serverless-lambda)
- [SkillKeepr overview (resume)](topic:resume/skillkeepr-overview)
- [Platform architecture (resume)](topic:resume/platform-architecture)
