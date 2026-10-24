---
title: Explaining your project's architecture in an interview
stack: mern-architectures
order: 33
level: Intermediate
mustKnow: true
askedFrequency: very common
template: pattern
section: Choosing an architecture
summary:
  - "Use one fixed order every time: users → frontend → API → backend → data → async work → deployment → trade-offs, then your own part."
  - "Follow one real request through the boxes. It proves you understand how the pieces connect, not just their names."
  - "Give the reason for each choice in one short line (why serverless, why one database per tenant), and name one trade-off."
  - "Keep 'what the system does' and 'what I built' clearly apart. Never claim the whole design if you built parts of it."
  - "Aim for about 2 minutes, then let the interviewer pick where to go deeper."
cards:
  - q: What order should you use to explain an architecture?
    a: "Users → frontend → API → backend → data → async work → deployment → trade-offs, then 'my part'."
  - q: Why walk through one real request?
    a: "It shows you know how the pieces connect, for example: login → cookie → API → tenant check → database → response."
  - q: How long should the first answer be?
    a: "About 2 minutes. Give the big picture, then stop and let the interviewer choose where to go deeper."
  - q: What is the most common mistake when describing a team project?
    a: "Saying 'I built the architecture' when you built parts of it. Say 'the platform uses…' and 'my part was…'."
---

## 💡 What is it?

"Explain the architecture of your project" is one of the most common interview questions. The interviewer wants to see if you understand the **whole system**, not just your own tickets.

Most people answer by listing tools: "React, Node, Mongo, AWS…". That sounds weak. A strong answer **walks through the system in a fixed order**, gives a reason for each choice, and is honest about your own part.

This page gives you a repeatable structure, and fills it in with SkillKeepr as the example.

## 🏠 Real-life example

Think of **giving a guest a tour of your school**.

You don't shout a list: "Lab, library, canteen, ground!" You walk them through in order: the gate, the office, the classrooms, the labs, the playground. At each place, you say what happens there and why.

- **The gate where visitors come in** = the users and the portals they use.
- **The reception desk** = the API, where every request is checked first.
- **The classrooms where the real work happens** = the backend services.
- **The library and records room** = the database.
- **The staff working after school hours** = background jobs and queues.
- **The school's address and buildings** = where it is deployed (AWS, Railway…).
- **"This is the science lab I helped set up"** = your own part. Proud, but honest.

## 🗺️ The diagram

The 8-step structure. Draw these boxes (on a whiteboard or in the air) as you talk:

```text
  1. USERS        who uses it? (recruiters, candidates, staff)
        │
  2. FRONTEND     what do they open? (React SPAs, where hosted)
        │
  3. API          how does the frontend talk to the backend? (REST, auth)
        │
  4. BACKEND      how is the server code organised? (services, shared lib)
        │
  5. DATA         where does data live? (MongoDB, how it is split)
        │
  6. ASYNC WORK   what runs in the background? (queues, crons, webhooks)
        │
  7. DEPLOYMENT   where does it run, how does code ship? (AWS, CI/CD)
        │
  8. TRADE-OFFS   one or two choices and what they cost
        │
  ★ MY PART      what I personally built, inside this picture
```

## 🧑‍💻 Code example

A small practice tool. Fill in your project in the object, run the script, and it prints your speaking outline in the right order. It also warns you about any step you left empty.

Save this as `outline.mjs`. Run it with `node outline.mjs`. No install needed.

```js
const STEPS = ['users', 'frontend', 'api', 'backend', 'data', 'async', 'deploy', 'tradeoffs', 'myPart']; // the fixed order

const project = {                                                      // fill this in for YOUR project
  name: 'SkillKeepr (multi-tenant recruitment SaaS)',                  // one line: what the product is
  users: 'Recruiters, candidates and platform staff',                  // step 1: who uses it
  frontend: 'Three React SPAs (admin, talent, cloud-admin) on S3 + CloudFront', // step 2
  api: 'REST through API Gateway; JWT in an HttpOnly cookie; tenant from the subdomain', // step 3
  backend: 'Serverless Lambda functions in Node.js + TypeScript, shared core library, Joi', // step 4
  data: 'MongoDB with one database per tenant (Mongoose)',             // step 5
  async: 'SQS, Step Functions, EventBridge crons, AWS Batch; Stripe webhooks', // step 6
  deploy: '',                                                          // step 7: left empty on purpose → warning
  tradeoffs: 'DB per tenant: strong isolation, but more databases to manage', // step 8
  myPart: 'Stripe auto-renewal (cron + webhook), AI JD backend, ATS integration backend', // ★ your own work
};                                                                     // end of project

console.log(`Project: ${project.name}\n`);                             // print the title first
STEPS.forEach((step, i) => {                                           // walk the steps in order
  const text = project[step];                                          // what you wrote for this step
  console.log(`${i + 1}. ${step.toUpperCase()}: ${text || '⚠ missing, fill this in!'}`); // print it or warn
});                                                                    // end of forEach
```

Output:

```text
Project: SkillKeepr (multi-tenant recruitment SaaS)

1. USERS: Recruiters, candidates and platform staff
2. FRONTEND: Three React SPAs (admin, talent, cloud-admin) on S3 + CloudFront
3. API: REST through API Gateway; JWT in an HttpOnly cookie; tenant from the subdomain
4. BACKEND: Serverless Lambda functions in Node.js + TypeScript, shared core library, Joi
5. DATA: MongoDB with one database per tenant (Mongoose)
6. ASYNC: SQS, Step Functions, EventBridge crons, AWS Batch; Stripe webhooks
7. DEPLOY: ⚠ missing, fill this in!
8. TRADEOFFS: DB per tenant: strong isolation, but more databases to manage
9. MYPART: Stripe auto-renewal (cron + webhook), AI JD backend, ATS integration backend
```

The empty step 7 is a reminder: deployment details for SkillKeepr are a [FILL IN: how code is built and deployed (CI/CD tool, environments)].

## 🔍 Deeper version

### The 8 steps, with what to say

| Step | Say | Link to revise |
|---|---|---|
| 1. Users | The user types and what each one does | [Multi-tenant SaaS scenario](topic:mern-architectures/scenario-multi-tenant-saas) |
| 2. Frontend | SPA or SSR, how many apps, where hosted | [CSR SPA](topic:mern-architectures/csr-spa-api), [SSR](topic:mern-architectures/ssr-nextjs) |
| 3. API | REST/GraphQL, how auth travels | [API styles](topic:mern-architectures/api-styles), [auth designs](topic:mern-architectures/auth-designs) |
| 4. Backend | Monolith, modular, serverless or services; shared code | [Serverless MERN](topic:mern-architectures/serverless-mern), [layered](topic:mern-architectures/layered) |
| 5. Data | Which database, how data is split | [Shared vs DB per tenant](topic:architecture/shared-vs-db-per-tenant) |
| 6. Async work | Queues, crons, webhooks | [Event-driven with queues](topic:mern-architectures/event-driven-queues) |
| 7. Deployment | Cloud, CI/CD, environments | [Deployment options](topic:mern-architectures/deployment-options) |
| 8. Trade-offs | One choice + what it costs + why it's worth it | [Decision guide](topic:mern-architectures/decision-guide) |
| ★ My part | 2–3 things you built, each in one line | [Resume Deep-Dive](topic:resume/skillkeepr-overview) |

### Walk one request through it

After the big picture, follow **one real action** through the boxes. For example, "a recruiter opens the jobs list":

1. The recruiter opens `acme.<platform-domain>` in the admin portal (a React SPA from the CDN).
2. The SPA calls the REST API. The browser sends the HttpOnly JWT cookie by itself.
3. The request reaches a Lambda function through API Gateway.
4. Auth checks the token. The tenant in the token must match the tenant of the request.
5. The function picks Acme's own MongoDB database and runs the query.
6. A standard response comes back, and the SPA shows the list.

This short walk shows you understand how the parts **connect**. Practise it with the [SkillKeepr Story](topic:skillkeepr-story/whole-story) and [platform architecture](topic:resume/platform-architecture) pages.

### Keep three layers apart

| Layer | Example sentence |
|---|---|
| What the platform does | "The platform uses one database per tenant." |
| What the team decided | "The team chose serverless for the backend." |
| What **I** built | "I built the Stripe auto-renewal cron and the webhook trigger." |

Interviewers will dig into whatever you say "I" about. Only say "I" for work you can explain in detail.

### Handling "why?" questions

For each big choice, have a one-line reason and one trade-off ready:
- **Why serverless?** Each function scales by itself and there are no servers to manage. Cost: cold starts and time limits ([serverless limits](topic:architecture/serverless-limits)).
- **Why one database per tenant?** Strong data walls between companies and easy per-tenant backups. Cost: more databases to migrate.
- **Why queues?** Heavy work like bulk resume parsing doesn't block users. Cost: more parts to monitor.

If you don't know why a choice was made, say so: "That was decided before I joined. My understanding is… and the trade-off I see is…".

## ⚖️ Pros and cons

| Pros of the fixed structure | Cons / watch out |
|---|---|
| You never freeze; you always know the next step | Can sound memorised if you read it like a list |
| Covers everything an interviewer checks | 2 minutes is short; you must leave details out |
| Makes trade-offs and your own part easy to find | Needs real understanding for the follow-ups |
| Works for any project: SaaS, MVP, college project | You must fill in facts you're not sure of before the interview |

## 🎯 When to choose it

- "Tell me about your project's architecture."
- "Walk me through what happens when a user does X."
- "Draw your system on the whiteboard."
- "What would you change if you rebuilt it?" Use step 8 (trade-offs), then the [decision guide](topic:mern-architectures/decision-guide).

It also works for system design questions about a new app. Use the same 8 boxes, but you design each one. See [how to approach system design](topic:system-design/how-to-approach).

## ⚠️ Common mistakes

- **Listing tools with no flow.** "React, Node, Lambda, Mongo, SQS" says nothing about how they connect. Walk a request.
- **Claiming the whole design.** "I architected the platform" invites questions you can't answer. Say "the platform uses…" and "my part was…".
- **Sharing secrets.** Never mention internal repo names, hostnames, keys or known security weaknesses. Stay at the feature and high-level design.
- **Going too deep too early.** Five minutes on one Lambda's code before showing the big picture. Give the overview first, then let them choose.

## 🗣️ How to answer in an interview

> "SkillKeepr is a multi-tenant recruitment SaaS. There are three kinds of users: recruiters and hiring managers, candidates, and our own platform staff. Each has a React SPA: the admin portal, the talent portal and the cloud-admin portal, hosted on S3 and CloudFront.
>
> The frontend calls a REST API through API Gateway. The backend is serverless: Lambda functions in Node.js and TypeScript, with a shared core library for auth, responses and validation with Joi. Auth uses a JWT in an HttpOnly cookie. The tenant comes from the subdomain and is locked inside the token. Data is in MongoDB with one database per tenant, so companies are fully separated.
>
> Heavy and scheduled work runs in the background with SQS, Step Functions, EventBridge crons and AWS Batch. Stripe handles subscriptions through webhooks.
>
> The main trade-off is database per tenant: strong isolation, but more databases to manage.
>
> My part: I built the Stripe auto-renewal flow, the renewal cron and the webhook trigger, and I tested it with Stripe Test Clocks. I built the backends for the AI job-description assistant and for the ATS integration through unified.to. I also worked on the shared auth modules with the team. Which part would you like me to go deeper into?"

Team size and your role in it: [FILL IN: team size and who did what].

## 🔁 Follow-up questions

### What would you change if you rebuilt it today?

Pick one honest, specific thing and a reason. For example: a clearer local development setup, or more automated tests around the tenant checks. Don't attack the whole design, and don't share weaknesses the company hasn't made public.

### How does one request flow through your system?

Use the 6-step walk above: SPA → API with cookie → Lambda → auth and tenant check → tenant database → response.

### How did your part fit into the bigger system?

Place it on the diagram. For example: "The renewal cron is a scheduled job in the async layer. It works with Stripe, and the webhook updates the tenant's plan in the tenant's database."

### How would this architecture handle 10 times more customers?

Serverless functions scale out by themselves. The database is the likely limit, so move the biggest tenants to their own clusters, add indexes and caching, and push more work to queues. See [growing 10x](topic:skillkeepr-story/growing-10x).

## ✅ Quick check

### 1. Put these in the right order: data, users, async work, frontend, API.

:::answer
**Users → frontend → API → (backend) → data → async work.** Then deployment, trade-offs and your own part.
:::

### 2. Which sentence is the safest way to describe a team design you didn't create?

- A) "I designed the multi-tenant architecture."
- B) "The platform uses one database per tenant. My part was the Stripe renewal flow."
- C) "I don't really know how the rest works."

:::answer
**B.** It describes the system honestly and makes your own work clear. A invites questions you may not be able to answer. C hides your real understanding.
:::

### 3. The interviewer says "Explain your architecture." What should you do after about 2 minutes?

:::answer
**Stop and offer a choice:** "Which part would you like me to go deeper into?" Let the interviewer lead, instead of talking for 10 minutes.
:::
