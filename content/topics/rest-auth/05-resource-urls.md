---
title: Designing resource URLs and nested routes
stack: rest-auth
order: 5
level: Intermediate
mustKnow: true
askedFrequency: very common
summary:
  - "Use plural nouns, not verbs: /jobs, /jobs/42. The HTTP method is the verb."
  - "Nest only to show \"belongs to\": /jobs/42/applications. Keep it to one level when you can."
  - "Filters, sorting, search and paging go in the query string: /jobs?status=open&sort=-createdAt&page=2."
  - "Use lowercase and kebab-case (/job-templates), and put a version at the start (/api/v1)."
  - "For actions that aren't simple CRUD, use a sub-resource or a clear action: POST /jobs/42/close."
cards:
  - q: Name 3 rules for good REST URLs.
    a: "Plural nouns, not verbs (/jobs, not /getJobs). Nest to show ownership (/jobs/42/applications). Put filters and paging in the query string (?status=open&page=2)."
  - q: When should you nest routes?
    a: When the child only makes sense inside the parent, like a job's applications. Avoid going deeper than one or two levels.
  - q: Where do filters, sorting and paging go?
    a: "In the query string: /jobs?status=open&sort=-createdAt&page=2&limit=20."
  - q: How do you design an action like "close a job"?
    a: "Prefer PATCH /jobs/42 with { status: 'closed' }. If it's a real process with side effects (emails, payments), POST /jobs/42/close is acceptable."
  - q: Design endpoints for candidates and interviews.
    a: "GET/POST /candidates, GET/PATCH/DELETE /candidates/:id, GET/POST /candidates/:id/interviews, and GET/PATCH /interviews/:id for direct access to one interview."
---

## 💡 What is it?

A **resource URL** is the address of a "thing" in your [API](glossary:api), like `/jobs/42`.

Good URLs are **predictable**. A developer can guess them without reading the docs:

```text
GET    /api/v1/jobs                     → list jobs
POST   /api/v1/jobs                     → create a job
GET    /api/v1/jobs/42                  → read job 42
PATCH  /api/v1/jobs/42                  → change job 42
DELETE /api/v1/jobs/42                  → delete job 42
GET    /api/v1/jobs/42/applications     → applications for job 42
```

The **URL is the noun**. The **[method](topic:rest-auth/http-methods) is the verb**.

## 🏠 Real-life example

Think of **addresses in a school**.

`/school/classes/10-B/students/7` = "School → Class 10-B → Student number 7".

- **Plural nouns** = "classes", "students". These are labels, like room signs.
- **The id** = "10-B" or "7". It points to exactly one.
- **Nesting** = a student **belongs to** a class, so the student comes after the class.
- **Query string** = asking the class teacher, "Show me only students who wear glasses, sorted by height." That's a filter, not a new address: `/students?glasses=yes&sort=height`.
- **Verbs in the address** = writing "please-give-me" on the door sign. It makes no sense. The door is a place, and *you* decide what to do there.

## 🧑‍💻 Code example

A nested route with `express.Router`. Run `npm init -y` and `npm install express`. Save as `urls.js` and run `node urls.js`. (CommonJS, Express 5.)

```js
const express = require('express');                                       // load Express
const app = express();                                                    // create the app

const applications = [                                                    // fake data: applications to jobs
  { id: 1, jobId: 10, candidate: 'Asha', status: 'applied' },             // Asha applied to job 10
  { id: 2, jobId: 10, candidate: 'Ravi', status: 'shortlisted' },         // Ravi is shortlisted for job 10
  { id: 3, jobId: 20, candidate: 'Meera', status: 'applied' },            // Meera applied to job 20
];                                                                        // end of data

const appsRouter = express.Router({ mergeParams: true });                 // a router; mergeParams lets it see :jobId

appsRouter.get('/', (req, res) => {                                       // GET /jobs/:jobId/applications
  let list = applications.filter((a) => a.jobId === Number(req.params.jobId)); // only this job's applications
  if (req.query.status) list = list.filter((a) => a.status === req.query.status); // optional filter: ?status=
  res.json(list);                                                         // send the list
});                                                                       // end of list route

appsRouter.get('/:appId', (req, res) => {                                 // GET /jobs/:jobId/applications/:appId
  const a = applications.find((x) => x.id === Number(req.params.appId) && x.jobId === Number(req.params.jobId)); // must belong to this job
  a ? res.json(a) : res.status(404).json({ error: 'Not found' });         // found → send, else 404
});                                                                       // end of one-item route

app.use('/api/v1/jobs/:jobId/applications', appsRouter);                  // mount the router under the nested path

app.listen(3000, () => console.log('listening on 3000'));                 // start on port 3000
```

Output:

```text
$ curl localhost:3000/api/v1/jobs/10/applications
[{"id":1,"jobId":10,"candidate":"Asha","status":"applied"},{"id":2,"jobId":10,"candidate":"Ravi","status":"shortlisted"}]

$ curl "localhost:3000/api/v1/jobs/10/applications?status=shortlisted"
[{"id":2,"jobId":10,"candidate":"Ravi","status":"shortlisted"}]

$ curl localhost:3000/api/v1/jobs/10/applications/3
{"error":"Not found"}
```

**What to notice:** application 3 exists, but it belongs to job **20**. The nested URL also **checks ownership**, so it returns 404.

## 🔍 Deeper version

**The naming rules**

| Rule | ✅ Good | ❌ Bad |
|---|---|---|
| Plural nouns | `/candidates` | `/candidate`, `/getCandidates` |
| No verbs for CRUD | `DELETE /jobs/42` | `POST /deleteJob?id=42` |
| Lowercase, kebab-case | `/job-templates` | `/JobTemplates`, `/job_templates` |
| Nest for "belongs to" | `/jobs/42/applications` | `/applicationsOfJob/42` |
| Shallow nesting | `/applications/7` for direct access | `/companies/1/jobs/42/applications/7/notes/3` |
| Query for options | `/jobs?status=open&page=2` | `/jobs/open/page/2` |
| No file extensions | `/jobs/42` + `Accept: application/json` | `/jobs/42.json` |

**How deep to nest.** Use nesting to **list or create children**: `GET/POST /jobs/42/applications`. To work with one child, a **flat URL** is often easier: `GET /applications/7`. This is "shallow nesting". Deep URLs get long and force the client to know every parent id.

**Actions that aren't CRUD.** Some operations are real processes, like "close job" (emails, archiving) or "resend invite". You have two options:
1. Treat it as a state change: `PATCH /jobs/42` with `{ "status": "closed" }`.
2. Use an **action sub-resource**: `POST /jobs/42/close` or `POST /invitations/9/resend`.

Both are common. Option 2 is clearer when the action has side effects.

**Query string conventions**
- Filter: `?status=open&city=Kochi`
- Search: `?q=node`
- Sort: `?sort=-createdAt` (the minus means descending)
- Page: `?page=2&limit=20`, or `?cursor=…` (see [Pagination](topic:rest-auth/pagination-offset-cursor))
- Fields: `?fields=id,title`

**Ownership and tenants.** A nested URL must also **check** that the child belongs to the parent, like in the code above. In a multi-tenant SaaS, every lookup must also be scoped to the caller's tenant. SkillKeepr does this with a database per tenant: the tenant comes from the subdomain and the JWT, so `/jobs/42` can only ever read the current tenant's database. See [Multi-tenant platform](topic:resume/multi-tenant-platform).

**Versioning.** Start with `/api/v1/`. Then you can make breaking changes in `/api/v2/` later. See [API versioning](topic:rest-auth/api-versioning).

## 🎯 Why do we use it?

- **Easy to guess.** Frontend developers find endpoints without asking you.
- **Easy to secure.** Clear patterns make it easy to apply auth middleware per resource.
- **Easy to document.** Swagger groups endpoints by resource, like Jobs, Candidates and Interviews.
- **Easy to change.** Clear boundaries make versioning and splitting into services easier later.

## ⚠️ Common mistakes

- **Verbs everywhere**: `/createJob`, `/updateCandidateStatus`.
- **Mixed styles** in one API: `/jobs`, `/Candidate`, `/interview_list`. Pick one style.
- **Nesting too deep**, so the URL needs four ids to reach one item.
- **Not checking ownership** in nested routes. `/jobs/10/applications/3` should return 404 if application 3 belongs to job 20.
- **Filters in the path** (`/jobs/open`) instead of the query string (`/jobs?status=open`).

## 🗣️ How to answer in an interview

> "I design URLs around resources, using plural nouns, and let the HTTP method be the verb. So for candidates and interviews: GET and POST on /candidates, GET, PATCH and DELETE on /candidates/:id, and GET and POST on /candidates/:id/interviews to list or schedule interviews for that candidate. For one interview I'd also allow /interviews/:id directly, so nesting stays shallow.
>
> Filters, search, sorting and paging go in the query string, like ?status=scheduled&sort=-startTime&page=2. I version from day one with /api/v1, use lowercase kebab-case, and return correct status codes: 201 on create, 404 when a nested item doesn't belong to its parent.
>
> For actions that aren't plain CRUD, like closing a job, I either PATCH the status or use a clear action endpoint like POST /jobs/:id/close."

## 🔁 Follow-up questions

### Singular or plural nouns?

Plural (`/jobs`, `/jobs/42`) is the common convention. It reads as "the jobs collection" and "item 42 in it". Whatever you pick, use it everywhere.

### How would you design a search across many resources?

A separate search endpoint is fine: `GET /search?q=node&type=candidates`. Or add `?q=` to each collection, like `GET /candidates?q=node`.

### How do you handle bulk operations?

Use a collection-level endpoint: `POST /candidates/bulk` with an array in the body, or `PATCH /candidates` with a list of ids and changes. For big jobs, return **202 Accepted** and process them in the background.

### Where does the user's own data go — /users/123 or /me?

Many APIs add `/me` (e.g. `GET /me`, `GET /me/interviews`). The user id comes from the token, so users can't ask for someone else's id by mistake.

## ✅ Quick check

### 1. Fix this URL: `POST /api/getShortlistedCandidatesForJob?jobId=42`

:::answer
`GET /api/v1/jobs/42/applications?status=shortlisted` (or `/jobs/42/candidates?status=shortlisted`). It's a read, so use GET. Use nouns, nest under the job, and filter with the query string.
:::

### 2. Which part should hold the sort order: path, query string or body?

:::answer
The **query string**, like `?sort=-createdAt`. Sorting is an option for how to show a list, not a different resource.
:::

### 3. `GET /jobs/10/applications/3` — application 3 exists but belongs to job 20. What should the API return?

:::answer
**404 Not Found.** Inside job 10, application 3 doesn't exist. The nested URL must check that the child belongs to the parent.
:::
