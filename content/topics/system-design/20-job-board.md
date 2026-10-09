---
title: "Practice: job board / college admission portal"
stack: system-design
order: 20
level: Intermediate
mustKnow: false
askedFrequency: common
summary:
  - A job board lets companies post jobs and candidates search and apply. A college portal is the same shape — courses instead of jobs, students instead of candidates.
  - "Core data: companies, jobs, candidates, applications. An application links one candidate to one job with a status."
  - Search is the hardest read path. Start with database indexes and filters; move to a search engine (like OpenSearch) when you need relevance and fuzzy matching.
  - Use cursor pagination, caching for popular listings, and a queue for slow work like resume parsing and emails.
  - Protect applications with a unique (jobId, candidateId) index, so a candidate can't apply twice.
cards:
  - q: What are the main entities in a job board?
    a: Companies (employers), jobs, candidates, and applications. An application connects one candidate and one job, with a status like applied, shortlisted or rejected.
  - q: How do you stop duplicate applications?
    a: Add a unique index on (jobId, candidateId). The second insert fails, and the API returns 409 Conflict.
  - q: When do you need a search engine instead of database queries?
    a: When you need relevance ranking, typo tolerance, synonyms or fast full-text search over lots of text. For simple filters, database indexes are enough.
  - q: How do you keep the search engine in sync with the database?
    a: The database stays the source of truth. Send changes to the search index through events or change streams, with a full re-index job as backup.
  - q: Why cursor pagination for job listings?
    a: Large skip/offset gets slower deep in the list and can show duplicates when new jobs arrive. A cursor ("after this id") stays fast and stable.
---

## 💡 What is it?

A **job board** lets employers **post jobs** and candidates **search and apply**. Recruiters then **review applications** and move them through stages.

A **college admission portal** has the same shape: colleges post courses, students search and apply, admins review.

This is a good practice design because it mixes CRUD, search, file uploads, notifications and multi-tenancy.

## 🏠 Real-life example

Think of the **school notice board for part-time jobs**.

- Shops pin **job cards** on the board. That is posting a job.
- Students look at the board and **pick cards by area and type**. That is search with filters.
- A student writes their name on an **application slip** and drops it in the shop's box. One slip per job per student. That is an application with a unique rule.
- The shop owner **sorts the slips** into "call", "maybe" and "no". That is the application status.
- The office **puts a copy of the most-read cards** near the gate. That is caching popular listings.

Map it:
- **Job cards** = jobs.
- **Picking by area and type** = filtered search.
- **Application slip** = an application (candidate + job).
- **One slip per job per student** = a unique (jobId, candidateId) index.
- **Sorting slips** = status changes.
- **Copy near the gate** = a cache.

## 🧑‍💻 Code example

The core of the search API: turn query parameters into a safe database filter, with cursor pagination and a capped page size. Save as `search.js` and run `node search.js`.

```js
function buildJobQuery(params) {                            // turn URL query params into a database filter
  const filter = { status: 'open' };                        // only show open jobs
  if (params.city) filter.city = params.city;               // exact city match, e.g. "Kochi"
  if (params.skill) filter.skills = params.skill;           // array field contains this skill
  if (params.minExp) filter.minExperience = { $lte: Number(params.minExp) }; // jobs this person qualifies for
  if (params.after) filter._id = { $lt: params.after };     // cursor: only jobs older than the last one seen
  const limit = Math.min(Number(params.limit) || 20, 50);   // page size: default 20, never more than 50
  return { filter, sort: { _id: -1 }, limit };              // newest first
}                                                           // end of buildJobQuery

console.log(JSON.stringify(buildJobQuery({ city: 'Kochi', skill: 'node', minExp: '3' }))); // first page
console.log(JSON.stringify(buildJobQuery({ city: 'Kochi', after: '665f1c', limit: '500' }))); // next page, limit capped
```

**Output:**

```text
{"filter":{"status":"open","city":"Kochi","skills":"node","minExperience":{"$lte":3}},"sort":{"_id":-1},"limit":20}
{"filter":{"status":"open","city":"Kochi","_id":{"$lt":"665f1c"}},"sort":{"_id":-1},"limit":50}
```

The client asked for 500 per page, but the server capped it at 50. Only known fields reach the filter, so users can't inject their own operators. See [NoSQL injection](topic:mongodb/nosql-injection).

## 🔍 Deeper version

**1. Requirements**
- Employers: post, edit and close jobs; review applications; move candidates through stages.
- Candidates: sign up, build a profile, upload a resume, search jobs, apply, see status.
- Non-functional: search under ~300 ms, no duplicate applications, files private, emails for status changes.
- Scale guess: 100,000 open jobs, 1 million candidates, many more searches than applications.

**2. API**

```text
GET    /api/jobs?city=&skill=&minExp=&after=&limit=      → { items, nextCursor }
GET    /api/jobs/:jobId
POST   /api/jobs                                          (employer)
POST   /api/jobs/:jobId/applications                      → 201, or 409 if already applied
GET    /api/jobs/:jobId/applications?status=shortlisted   (employer)
PATCH  /api/applications/:id   { "status": "shortlisted" }
```

See [designing an API](topic:system-design/api-design) and [resource URLs](topic:rest-auth/resource-urls).

**3. Data model**

| Collection / table | Key fields | Indexes |
|---|---|---|
| companies | name, plan | — |
| jobs | companyId, title, city, skills[], minExperience, status, createdAt | (status, city, createdAt), skills, text index on title/description |
| candidates | name, email, skills[], resumeKey | unique email |
| applications | jobId, candidateId, status, statusHistory[], appliedAt | **unique (jobId, candidateId)**, (jobId, status) |

Applications are their own collection (not an array inside the job), because they can grow without limit and are queried on their own. See [embedding vs referencing](topic:mongodb/embedding-vs-referencing).

**4. Architecture**

```text
Browser ──► CDN (static SPA) ──► Load balancer ──► API servers (stateless)
                                                     │        │          │
                                                     ▼        ▼          ▼
                                                 Database   Redis     Queue ──► workers:
                                                 (source    (cache    resume parsing, emails,
                                                  of truth)  popular   search index updates
                                                             listings)
                                                     │
                                                     └──► Search engine (optional: OpenSearch) ◄── sync from DB changes
Resumes ──► presigned upload ──► S3 (private)
```

**5. Search: database or search engine?**

| | Database indexes + text index | Search engine (OpenSearch / Elasticsearch) |
|---|---|---|
| Good for | exact filters (city, status, experience) | full-text relevance, typos, synonyms, facets |
| Ops cost | none extra | another cluster to run and keep in sync |
| When | start here | when search quality or speed demands it |

**Other bottlenecks:** cache the first page of popular searches; use [cursor pagination](topic:rest-auth/pagination-offset-cursor); rate-limit search and apply; send emails and parse resumes through [queues](topic:system-design/queues-background-jobs); upload resumes with [presigned URLs](topic:system-design/file-upload-service).

**Multi-tenant version:** if many companies use one product, every job and application belongs to a tenant. See [multi-tenant architecture](topic:architecture/multi-tenant).

**At SkillKeepr (public-safe):** the platform is a multi-tenant recruitment product with jobs, candidate profiles, candidate search, applications and interviews, using a database per tenant. [FILL IN: which parts of this flow you worked on.]

## 🎯 Why do we use it?

This design shows you can model real business data, pick the right indexes, decide when search needs its own engine, and keep slow work out of the request.

## ⚠️ Common mistakes

- **Storing applications as an ever-growing array inside the job.** Documents grow too big and updates clash.
- **No unique rule on applications.** A double-click creates two applications.
- **Building filters straight from user input.** NoSQL injection and slow, unindexed queries.
- **Adding a search engine on day one.** Extra cost and sync problems before you need them.

## 🗣️ How to answer in an interview

> "I'd start with requirements and scale: many more searches than applications. The main entities are companies, jobs, candidates and applications. Applications are a separate collection with a unique index on job and candidate, so nobody can apply twice — the API returns 409 if they try.
>
> For search, I'd begin with database filters and compound indexes on the common filters, plus a text index, with cursor pagination and a capped page size. Popular searches get cached in Redis. If we need relevance ranking or typo tolerance, I'd add a search engine like OpenSearch, kept in sync from database changes, with the database as the source of truth.
>
> Slow work like resume parsing and emails goes through a queue, and resumes upload straight to S3 with presigned URLs. The API servers are stateless, so they scale horizontally behind a load balancer."

## 🔁 Follow-up questions

### How would you rank jobs for a candidate?

Score jobs by skill match, experience fit, location and freshness. Start with a simple formula; a search engine or a recommendation service can do more later.

### How do you handle a job that gets 10,000 applications in an hour?

Applications are small inserts, which is fine. Heavy work (parsing, scoring, emails) goes to a queue so the apply request stays fast.

### How do you keep application status history?

Keep a `statusHistory` array (or a separate table) with status, who changed it and when. It's small and bounded per application, so embedding is fine.

## ✅ Quick check

### 1. In the code, why is `limit` 50 when the client asked for 500?

:::answer
The server caps page size with `Math.min(..., 50)`. This protects the database from huge, slow queries.
:::

### 2. A candidate double-clicks "Apply". What stops a duplicate application?

:::answer
The unique index on (jobId, candidateId). The second insert fails, and the API returns 409 Conflict.
:::

### 3. Users complain search can't find "Javascript" when they type "Java Script". What would help most?

:::answer
A search engine with analyzers and fuzzy matching (or at least a better text index setup). Plain exact filters can't handle spelling variations well.
:::
