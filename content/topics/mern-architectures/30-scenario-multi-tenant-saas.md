---
title: "Scenario: multi-tenant SaaS (SkillKeepr-style)"
stack: mern-architectures
order: 30
level: Intermediate
mustKnow: true
askedFrequency: very common
template: pattern
section: Choosing an architecture
summary:
  - "A multi-tenant SaaS is one app that many companies (tenants) use, and each company sees only its own data."
  - "The tenant is found once per request (often from the subdomain), checked against the login token, and then used for every database call."
  - "Data isolation choices: a shared database with a tenantId on every document, or one database per tenant. SkillKeepr uses one database per tenant."
  - "Typical pieces: one React SPA per user type (portal), a REST API, background jobs for heavy work, Stripe for subscriptions, and webhooks for outside systems."
  - "In the interview, keep three things apart: the general design, what the platform does, and what you built yourself."
cards:
  - q: What is a tenant in a SaaS app?
    a: "One customer company. All its users and data belong together and must stay hidden from other companies."
  - q: How does a request know which tenant it belongs to?
    a: "Usually from the subdomain (acme.app.com). The server checks it against the tenant stored inside the login token, then uses it for all database calls."
  - q: Shared database vs database per tenant?
    a: "Shared is cheaper and simpler to run, but every query must filter by tenantId. Database per tenant gives stronger isolation and easy per-tenant backups, but more databases to manage."
  - q: Why do SaaS apps lean on background jobs?
    a: "Work like bulk resume parsing, subscription renewals and reminder emails is slow or scheduled, so it runs outside the user's request."
  - q: What is the most dangerous bug in a multi-tenant app?
    a: "A data leak: one company seeing another company's data because a query forgot the tenant."
---

## 💡 What is it?

**SaaS** (software as a service) means companies pay a monthly fee to use your app in the browser. **[Multi-tenant](glossary:multi-tenant)** means **one** app serves **many** companies at the same time. Each company is a **tenant**.

The big rule: every company must see **only its own data**. Company A must never see Company B's candidates.

This page designs a recruitment SaaS, like SkillKeepr. We look at the general design first. Then we look at what SkillKeepr really uses, and what Hari built on it.

## 🏠 Real-life example

Think of a **big apartment building**.

One building, one owner, one set of pipes and lifts. But each family has its own flat with its own lock. Family 101 can't open the door of flat 205.

- **The building** = the one SaaS app and its servers.
- **Each family's flat** = one tenant (one company) and its data.
- **The flat number on the door** = the subdomain, like `acme.app.com`.
- **The key card** = the login token (a [JWT](glossary:jwt)) with the flat number written inside it.
- **The security guard who checks the card matches the door** = middleware that checks the token's tenant matches the subdomain.
- **Separate lockers in the basement for each flat** = one database per tenant.
- **The lift and the water pipes** = shared code and shared services that every tenant uses.
- **Monthly maintenance bill** = the Stripe subscription.

## 🗺️ The diagram

```text
  Recruiter at acme.app.com       Candidate         Platform staff
          │                          │                    │
  ┌───────▼───────┐        ┌─────────▼──────┐   ┌─────────▼───────┐
  │ Admin portal  │        │ Talent portal  │   │ Cloud-admin     │   React SPAs
  │ (React SPA)   │        │ (React SPA)    │   │ portal (SPA)    │   on a CDN
  └───────┬───────┘        └─────────┬──────┘   └─────────┬───────┘
          └────────── HTTPS + HttpOnly JWT cookie ────────┘
                                   │  tenant = "acme" (from subdomain)
                          ┌────────▼─────────┐
                          │ API (REST)       │  1. read tenant
                          │ auth middleware  │  2. check JWT tenant == "acme"
                          │ tenant resolver  │  3. pick acme's database
                          └──┬────────────┬──┘
             normal requests │            │ slow / scheduled work
                    ┌────────▼───┐   ┌────▼───────────────────────┐
                    │ services   │   │ queue → workers            │
                    │ (business) │   │ resume parsing, reminders, │
                    └────────┬───┘   │ subscription renewal crons │
                             │       └────┬───────────────────────┘
               ┌─────────────▼────────────▼──┐      ┌──────────────┐
               │ MongoDB                     │      │ Stripe       │
               │  db_acme   db_globex   ...  │      │ (billing)    │
               │  (one database per tenant)  │      │ webhooks ──► API
               └─────────────────────────────┘      └──────────────┘
```

## 🧑‍💻 Code example

The key piece of any multi-tenant app: **find the tenant once, then use it everywhere**. This Express middleware reads the subdomain, checks the tenant exists, and picks that tenant's own MongoDB database.

You need MongoDB running locally (or an Atlas URI in `MONGO_URI`). Set up:

```bash
npm init -y
npm install express mongoose
```

Save this as `tenant.mjs`. Run it with `node tenant.mjs`.

```js
import express from 'express';                                         // load Express 5
import mongoose from 'mongoose';                                       // load Mongoose 8

await mongoose.connect(process.env.MONGO_URI ?? 'mongodb://127.0.0.1:27017/platform'); // one connection pool for all tenants
const KNOWN_TENANTS = new Set(['acme', 'globex']);                      // in real life: a "tenants" collection

const jobSchema = new mongoose.Schema({ title: String });               // a simple job post shape

function resolveTenant(req, res, next) {                                // middleware: runs before every route
  const tenant = req.hostname.split('.')[0];                            // "acme.localhost" → "acme"
  if (!KNOWN_TENANTS.has(tenant)) {                                      // unknown subdomain?
    return res.status(404).json({ error: 'Unknown company' });          // 404 = not found, stop here
  }                                                                     // end of check
  // In a real app: also check that the JWT's tenant claim === tenant, else 403.
  const db = mongoose.connection.useDb(`db_${tenant}`, { useCache: true }); // pick this tenant's own database
  req.tenant = tenant;                                                  // remember the tenant for later code
  req.models = { Job: db.models.Job ?? db.model('Job', jobSchema) };    // models bound to THIS tenant's db
  next();                                                               // go on to the route
}                                                                       // end of resolveTenant

const app = express();                                                  // create the app
app.use(express.json());                                                // read JSON bodies
app.use(resolveTenant);                                                 // every request gets a tenant first

app.post('/api/jobs', async (req, res) => {                             // create a job for the current tenant
  const job = await req.models.Job.create({ title: req.body.title });   // saved in db_acme or db_globex
  res.status(201).json(job);                                            // 201 = created
});                                                                     // end of POST

app.get('/api/jobs', async (req, res) => {                              // list jobs for the current tenant
  res.json(await req.models.Job.find());                                // can only see its own database
});                                                                     // end of GET

app.listen(3000, () => console.log('SaaS API on 3000'));                // start the server
```

Try it. Most systems resolve `*.localhost` to your own machine, so subdomains work locally:

```text
$ curl -X POST -H "Content-Type: application/json" -d '{"title":"Node Developer"}' http://acme.localhost:3000/api/jobs
{"title":"Node Developer","_id":"...","__v":0}

$ curl http://acme.localhost:3000/api/jobs
[{"title":"Node Developer", ...}]

$ curl http://globex.localhost:3000/api/jobs
[]                       ← globex can't see acme's job

$ curl http://evil.localhost:3000/api/jobs
{"error":"Unknown company"}
```

## 🔍 Deeper version

### The general design, piece by piece

| Piece | Choice | Why it fits a SaaS |
|---|---|---|
| Frontend | One React SPA per user type (portal) | Recruiters, candidates and staff need very different screens. Each can deploy on its own. Served from a [CDN](glossary:cdn). |
| Tenant routing | Subdomain per company | Easy for users. The tenant is clear from the URL. |
| Auth | JWT in an HttpOnly cookie, with the tenant inside | The token can't be read by page scripts, and it can't be reused on another tenant's subdomain. See [auth designs](topic:mern-architectures/auth-designs). |
| Backend | A [modular monolith](topic:mern-architectures/modular-monolith) or [serverless functions](topic:mern-architectures/serverless-mern), with a shared library | One place for tenant checks, auth, validation and response format. |
| Data | Shared DB + `tenantId`, or one DB per tenant | See the table below. |
| Slow work | [Queues and workers](topic:mern-architectures/event-driven-queues), plus scheduled jobs | Bulk imports, AI calls, reminder emails and renewals don't block users. |
| Files | [Presigned uploads](topic:mern-architectures/presigned-uploads) to S3, with a per-tenant folder | Big resumes skip your server. |
| Billing | Stripe subscriptions + [webhooks](glossary:webhook) | Stripe handles cards and renewals. Your app reacts to events. |
| Integrations | Webhooks and sync jobs with outside systems (ATS, calendars) | Each tenant connects its own accounts. |

### Data isolation: the biggest decision

| | Shared database + `tenantId` | One database per tenant |
|---|---|---|
| Isolation | By code: every query must filter | By design: a query can only see one database |
| Risk | Forget one filter → data leak | Much smaller leak risk |
| Cost to run | Low; one database | More databases, connections and migrations |
| Backup / delete one tenant | Hard (filter by tenantId) | Easy (one database) |
| Good for | Many small tenants (thousands) | Fewer, bigger business tenants |

Read more in [shared vs database per tenant](topic:architecture/shared-vs-db-per-tenant) and [multi-tenant design in MongoDB](topic:mongodb/multi-tenant-design).

### The tenant flow, step by step

1. The browser calls `acme.app.com`. The frontend reads `acme` and sends it with each API call.
2. At login, the server puts `tenant: "acme"` **inside** the JWT. Nobody can change it without breaking the [signature](glossary:signature).
3. On every request, middleware checks: does the requested tenant match the tenant in the token? If not, `403`.
4. Only then does the code pick the tenant's database. Services never take a tenant from the request body.

### What SkillKeepr actually uses (public level)

SkillKeepr follows this pattern on AWS:
- **Three React SPAs** (admin portal, talent portal, cloud-admin portal), hosted on S3 + CloudFront.
- A **[serverless](glossary:serverless) backend**: many Lambda functions behind API Gateway, in Node.js + TypeScript, with Mongoose and Joi validation.
- A **shared library** used across services for common patterns like auth, responses and pagination.
- **Background work** on SQS, Step Functions, scheduled EventBridge jobs and AWS Batch.
- **MongoDB with one database per tenant.** The tenant comes from the subdomain, travels as a header, and is locked inside the JWT, which sits in an HttpOnly cookie.
- Stripe subscriptions and ATS/CRM integrations.

The full journey is in the [SkillKeepr Story](topic:skillkeepr-story/meet-skillkeepr), especially [keeping tenants apart](topic:skillkeepr-story/keeping-tenants-apart).

### What Hari built on it

Keep this separate from the platform. Hari didn't design the whole system. He built these parts:
- The **Stripe auto-renewal** part: the renewal cron and the webhook trigger, tested with Stripe Test Clocks. See [Stripe billing](topic:resume/stripe-billing).
- The **backend** of the AI job-description assistant.
- The **backend** of the ATS integration through unified.to. See [ATS integration](topic:resume/ats-integration).
- **Auth modules** in the shared library, built together with the team. See [reusable modules](topic:resume/reusable-modules).

Team size: [FILL IN: team size].

### How it changes as it grows

| Stage | Change |
|---|---|
| First 10 tenants | Modular monolith, one MongoDB cluster, shared DB or DB per tenant |
| Hundreds of tenants | Background jobs for all heavy work, a CDN, per-tenant rate limits |
| A tenant gets huge | Move that tenant's database to its own cluster |
| Many teams | Split busy areas (billing, search, AI calls) into separate services |

## ⚖️ Pros and cons

| Pros | Cons |
|---|---|
| One codebase and one deploy serve every customer | A single missed tenant check can leak data |
| Cheaper than running one copy of the app per customer | A bad deploy hits every customer at once |
| New customers join in minutes (a new subdomain and DB) | One noisy tenant can slow others (needs limits) |
| Shared features improve for everyone at once | Per-tenant custom features add complexity |
| Database per tenant makes backup and deletion easy | More databases to migrate and monitor |

## 🎯 When to choose it

- You sell **one product to many businesses** on a monthly plan: HR tools, CRMs, school software, clinic software.
- Each business has **many users** and needs its own data walls.
- You want new customers to **sign up and start at once**, without a new server.

Pick database per tenant when tenants are businesses that care about isolation and backups. Pick a shared database with `tenantId` when you have thousands of small tenants (like a free-tier app).

## ⚠️ Common mistakes

- **Trusting the tenant from the request body.** A user could send another company's id. Take it from the subdomain and check it against the token.
- **Filtering by tenant in some queries but not others.** Put the tenant check in one middleware or a shared base repository, not in every controller.
- **Forgetting background jobs.** Workers have no subdomain. Every job message must carry the tenant id.
- **No per-tenant limits.** One tenant's bulk import of 50,000 resumes slows everyone. Use queues and limits.

## 🗣️ How to answer in an interview

> "At SkillKeepr, a multi-tenant recruitment SaaS, the architecture follows a common SaaS pattern. There are three React SPAs: the admin portal for recruiters, the talent portal for candidates, and a cloud-admin portal for our staff. They're hosted on S3 and CloudFront. The backend is serverless: Lambda functions behind API Gateway, in Node.js and TypeScript, with Mongoose and Joi.
>
> Isolation is the key part. The tenant comes from the subdomain, travels as a header, and is locked inside the JWT in an HttpOnly cookie. Each tenant has its own MongoDB database, so a query can only see that company's data. Heavy work like resume parsing and scheduled jobs runs in the background on SQS, Step Functions and EventBridge.
>
> My own work was in specific parts. I built the Stripe auto-renewal flow, the cron and the webhook trigger. I built the backend for the AI job-description assistant and for the ATS integration through unified.to. I also worked on the auth modules in our shared library with the team.
>
> If I designed it from scratch for a small start, I'd begin with a modular monolith and one tenant middleware. I'd split out services only when load or team size needed it."

## 🔁 Follow-up questions

### How do you stop one tenant from seeing another's data?

Find the tenant in one place (middleware), check it against the token, and give the rest of the code models bound to that tenant's database. Then also test it: call the API as tenant A and try to read tenant B's ids.

### How do background jobs know the tenant?

The job message carries the tenant id, like `{ tenant: 'acme', resumeId: '…' }`. The worker uses it to pick the right database before doing anything.

### What if one tenant becomes 100 times bigger than the others?

With a database per tenant, you can move that one database to its own bigger cluster. You can also give it its own queue or rate limit, so it doesn't slow other tenants.

### How do you run a schema change across 500 tenant databases?

Write the migration once, then run it as a background job that loops through every tenant database. Log each one and make it safe to run twice. Mongoose code should also handle old and new shapes during the rollout.

### How does Stripe fit in?

Each tenant is a Stripe customer with a subscription. Stripe sends webhooks (payment succeeded, payment failed) and the app updates the tenant's plan. Always check the webhook signature and handle duplicate events.

## ✅ Quick check

### 1. A developer writes `Job.find({ tenantId: req.body.tenantId })`. What is wrong?

:::answer
The tenant comes from the **request body**, which the user controls. They could send another company's id. Take the tenant from the subdomain and check it against the tenant inside the JWT.
:::

### 2. Which isolation choice makes "delete all of Acme's data" a one-step job?

- A) A shared database with a tenantId field
- B) One database per tenant

:::answer
**B.** You drop Acme's database. With A, you must find and delete Acme's documents in every collection.
:::

### 3. A worker parses resumes from a queue, but saves them into the wrong company. What is the likely cause?

:::answer
The job message didn't carry the **tenant id**, or the worker didn't use it to pick the database. Workers have no subdomain or cookie, so the tenant must travel inside the message.
:::
