---
title: Designing a REST API for a feature
stack: system-design
order: 4
level: Intermediate
mustKnow: true
askedFrequency: very common
summary:
  - Start from the user actions, then turn each action into a resource + HTTP method, like POST /jobs/:id/applications.
  - Use nouns for URLs, methods for actions, and the right status codes (201 created, 400 bad input, 404 not found).
  - Every list endpoint needs pagination, filters and sorting from day one.
  - Version the API (/api/v1), keep one response and error format, and make retries safe with idempotency keys.
  - In a system design round, list 3–5 core endpoints with their request and response shape. Don't list 30.
cards:
  - q: How do you start designing an API for a feature?
    a: List the user actions, find the resources (nouns) they touch, then map each action to a method and URL.
  - q: Which status code do you return after creating something?
    a: 201 Created, usually with the new resource in the body.
  - q: Why add pagination to every list endpoint?
    a: Lists grow. Without pagination one request can return thousands of rows, which is slow and uses a lot of memory.
  - q: Why put /v1 in the URL?
    a: So you can release breaking changes as /v2 later without breaking existing clients.
  - q: How do you make "create payment" safe to retry?
    a: Accept an Idempotency-Key header and store results by key, so a retried request returns the first result instead of creating a duplicate.
---

## 💡 What is it?

Designing an [API](glossary:api) means deciding **how clients talk to your server**: which URLs exist, which methods they use, what data goes in and what comes out.

In a system design interview, the API step comes right after requirements. You list the **3–5 most important endpoints**.

This page is about the **design process**. The rules themselves live in the REST stack, like [resource URLs](topic:rest-auth/resource-urls) and [status codes](topic:rest-auth/status-codes).

## 🏠 Real-life example

Think of a **restaurant menu**.

- The **menu items** (Dosa, Idli, Coffee) = **resources** (jobs, candidates, applications).
- **Order, cancel, ask for the bill** = **HTTP methods** (POST, DELETE, GET).
- The **way you write your order on the slip** = the **request format**.
- **"Sorry, sold out"** = an **error response** with a clear [status code](glossary:status-code) (404).
- **"Menu version 2" with new prices, while old customers keep their old menu** = **API versioning**.

A good menu is clear, consistent and hard to misunderstand. A good API is the same.

## 🧑‍💻 Code example

A tiny jobs API with three core endpoints. Setup: `npm init -y`, `npm install express`. Save as `api.js`, run `node api.js`. It starts the server, tests itself and stops.

```js
const express = require('express');                          // the Express web framework
const app = express();                                       // create the app
app.use(express.json());                                     // read JSON request bodies into req.body

const jobs = [{ id: 1, title: 'Node.js Developer', status: 'open' }]; // fake "database": one job to start
let nextId = 2;                                              // the id the next new job will get

app.get('/api/v1/jobs', (req, res) => {                      // GET = read a list; /v1 = version 1 of the API
  const limit = Math.min(Number(req.query.limit) || 20, 100);// page size from ?limit=; default 20, max 100
  res.json({ data: jobs.slice(0, limit), total: jobs.length }); // send one page plus the total count
});                                                          // end of GET list

app.get('/api/v1/jobs/:id', (req, res) => {                  // :id = any job id in the URL
  const job = jobs.find((j) => j.id === Number(req.params.id)); // look for the job with that id
  if (!job) return res.status(404).json({ error: 'Job not found' }); // 404 = no such resource
  res.json({ data: job });                                   // 200 OK with the job
});                                                          // end of GET one

app.post('/api/v1/jobs', (req, res) => {                     // POST = create a new job
  if (!req.body?.title) return res.status(400).json({ error: 'title is required' }); // 400 = bad input
  const job = { id: nextId++, title: req.body.title, status: 'open' }; // build the new job
  jobs.push(job);                                            // save it in our fake database
  res.status(201).json({ data: job });                       // 201 = created
});                                                          // end of POST

const server = app.listen(7201, async () => {                // start on port 7201, then test it
  const base = 'http://localhost:7201/api/v1/jobs';          // the base URL for our tests
  const post = await fetch(base, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: 'React Developer' }) }); // create a job
  console.log('POST', post.status, JSON.stringify(await post.json())); // expect 201
  const list = await fetch(`${base}?limit=10`);              // read the first page
  console.log('GET list', list.status, JSON.stringify(await list.json())); // expect 200 with 2 jobs
  const missing = await fetch(`${base}/99`);                 // ask for a job that doesn't exist
  console.log('GET /99', missing.status, JSON.stringify(await missing.json())); // expect 404
  server.close();                                            // stop the server so the script ends
});                                                          // end of listen
```

**Output:**

```text
POST 201 {"data":{"id":2,"title":"React Developer","status":"open"}}
GET list 200 {"data":[{"id":1,"title":"Node.js Developer","status":"open"},{"id":2,"title":"React Developer","status":"open"}],"total":2}
GET /99 404 {"error":"Job not found"}
```

## 🔍 Deeper version

**A 4-step process you can use for any feature.** Example feature: "candidates apply to jobs; recruiters review applications".

**1. List the user actions.**
- Recruiter creates a job. Candidate lists open jobs. Candidate applies. Recruiter sees applications for a job. Recruiter changes an application's status.

**2. Find the resources (nouns).** `jobs`, `candidates`, `applications`.

**3. Map actions to method + URL.**

| Action | Method + URL | Success code |
|---|---|---|
| Create a job | `POST /api/v1/jobs` | 201 |
| List open jobs | `GET /api/v1/jobs?status=open&page=1` | 200 |
| Apply to a job | `POST /api/v1/jobs/:jobId/applications` | 201 |
| See applications for a job | `GET /api/v1/jobs/:jobId/applications?status=shortlisted` | 200 |
| Change status | `PATCH /api/v1/applications/:id` with `{ "status": "shortlisted" }` | 200 |

**4. Add the "boring but important" parts.**
- **Pagination** on every list: offset (`?page=2`) or cursor (`?after=...`). See [offset vs cursor](topic:rest-auth/pagination-offset-cursor).
- **One response and error format**, like `{ data }` and `{ error: { code, message } }`.
- **Auth and permissions:** who can call what. See [authentication vs authorisation](topic:rest-auth/authn-vs-authz).
- **Versioning** with `/v1`. See [API versioning](topic:rest-auth/api-versioning).
- **Idempotency** for risky creates, like payments. See [idempotency keys](topic:rest-auth/idempotency-keys).
- **Rate limits** to protect the server. See [rate limiting](topic:system-design/rate-limiting).

**Nested or flat?** Nest only one level when the child belongs to the parent: `/jobs/:jobId/applications`. To change one application, use its own URL: `/applications/:id`. Deep URLs like `/companies/1/jobs/2/applications/3/notes` are hard to use.

**Slow work goes to a queue.** If "apply" must also parse a resume and send emails, return `202 Accepted` quickly and do the slow parts in the background. See [queues and background jobs](topic:system-design/queues-background-jobs).

## 🎯 Why do we use it?

- **Clients (web, mobile, other services) need a clear contract.** A clear API means fewer bugs and less back-and-forth.
- **Consistent APIs are easy to learn.** One pattern for every resource.
- **Good defaults prevent future pain:** pagination, versioning and error formats are hard to add later without breaking clients.

## ⚠️ Common mistakes

- **Verbs in URLs:** `POST /createJob`. Use `POST /jobs`.
- **Returning 200 for everything,** even errors. Clients can't react properly.
- **Lists without pagination.** Fine with 10 rows, a crash with 100,000.
- **Listing 30 endpoints in an interview.** Pick the 3–5 that matter for the design.

## 🗣️ How to answer in an interview

> "I start from the user actions, find the resources, and map each action to a method and URL. For a job portal: POST /jobs to create a job, GET /jobs with filters and pagination to list them, POST /jobs/:jobId/applications to apply, GET /jobs/:jobId/applications for the recruiter, and PATCH /applications/:id to change a status. I return 201 for creates, 400 or 422 for bad input, 404 when something doesn't exist, and 401 or 403 for auth problems. Every list is paginated, the API is versioned under /v1, and all responses use one format. For anything slow, like resume parsing or emails, I return 202 and do the work in a background queue."

[FILL IN: one API you designed or documented with Swagger at SkillKeepr, if you can describe it at a high level.]

## 🔁 Follow-up questions

### REST or GraphQL for this?

REST is simpler and caches well with HTTP. GraphQL helps when many clients need very different shapes of the same data. For a typical CRUD product, REST is a safe default.

### How do you handle a long-running action, like a bulk import?

Return `202 Accepted` with a job id, process it in the background, and give a status endpoint like `GET /imports/:id`, or push progress over a WebSocket.

### How do you document the API?

With an OpenAPI (Swagger) spec, ideally generated from the code. See [Swagger / OpenAPI](topic:rest-auth/swagger-openapi).

### How do you avoid breaking mobile apps that can't update quickly?

Only add new fields (never rename or remove) within a version. Put breaking changes in `/v2` and keep `/v1` running for a while.

## ✅ Quick check

### 1. Which URL is better for "apply to job 12"?

- A) `POST /applyToJob?id=12`
- B) `POST /jobs/12/applications`
- C) `GET /jobs/12/apply`

:::answer
**B.** A noun-based URL with POST to create a new application. A uses a verb. C uses GET, which must not change data.
:::

### 2. What status code should a successful create return?

:::answer
**201 Created**, usually with the new resource in the response body.
:::

### 3. Your "apply" endpoint must parse a resume, which takes 20 seconds. What do you return?

:::answer
**202 Accepted** quickly, then parse the resume in a background queue. Clients can check status later or get a notification.
:::
