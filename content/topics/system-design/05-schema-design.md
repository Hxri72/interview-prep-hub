---
title: Designing a database schema
stack: system-design
order: 5
level: Intermediate
mustKnow: true
askedFrequency: very common
summary:
  - Start from the main screens and queries, not from the tables. Design for how the data is read.
  - Find the entities (candidate, job, application) and their relationships (one-to-many, many-to-many).
  - In MongoDB, embed data that is small and always read together; reference data that is shared or grows without limit.
  - In PostgreSQL, normalise into tables with foreign keys, and use joins and transactions.
  - Add an index for every main query, and plan tenant isolation from day one in a multi-tenant app.
cards:
  - q: Where do you start when designing a schema?
    a: From the main screens and queries — "what will we read most often, and with which filters?" — then shape the data for those reads.
  - q: In MongoDB, when do you embed and when do you reference?
    a: Embed small data that is always read together with the parent. Reference data that is shared by many documents or can grow without limit.
  - q: How do you model "candidates apply to many jobs, and jobs have many candidates"?
    a: As a separate applications collection or table with jobId and candidateId — a many-to-many relationship through a link record.
  - q: When would you choose PostgreSQL over MongoDB?
    a: When data is strongly related, needs joins across many tables, strict constraints, and multi-row transactions, like billing or accounting.
  - q: What must every main query have?
    a: A matching index, otherwise the database scans every row as data grows.
---

## 💡 What is it?

A **schema** is the shape of your data: which tables or collections exist, which fields they have, and how they connect.

In a system design round, the data model step comes right after the API. You show the **main entities**, their **relationships**, and the **indexes** for the main queries.

A good schema is designed around **how the data is read**, not just how it looks.

## 🏠 Real-life example

Think of a **school's records**.

- Each **student** has a file with name, class and photo = a **candidate** document.
- Each **subject** has its own register = a **job** document.
- A student takes many subjects, and a subject has many students. So the school keeps a **separate marks register**, one line per student per subject = the **applications** collection (a link between both).
- The student's **address** lives inside the student's file, because you always read it with the student = **embedding**.
- The **index at the back of the register**, sorted by roll number, helps find a student fast = a database [index](glossary:index).

## 🧑‍💻 Code example

A tiny model of a hiring app in plain JavaScript, to see embedding, referencing and a "join". Save as `schema.js`, run `node schema.js`.

```js
const jobs = [{ _id: 'j1', title: 'Node.js Developer' }];    // jobs collection: one document per job
const candidates = [                                          // candidates collection
  { _id: 'c1', name: 'Asha', skills: ['Node', 'MongoDB'] },   // skills is EMBEDDED: small list, always read together
  { _id: 'c2', name: 'Ravi', skills: ['React'] },             // another candidate
];                                                            // end of candidates
const applications = [                                        // applications: REFERENCES both sides (many-to-many)
  { _id: 'a1', jobId: 'j1', candidateId: 'c1', status: 'applied' },    // Asha applied to job j1
  { _id: 'a2', jobId: 'j1', candidateId: 'c2', status: 'shortlisted' }, // Ravi applied to job j1
];                                                            // end of applications

const jobId = 'j1';                                           // the screen: "show applicants for job j1"
const rows = applications                                     // start from the applications list
  .filter((a) => a.jobId === jobId)                           // like WHERE job_id = 'j1' — needs an index on jobId
  .map((a) => ({                                              // build one row per application
    candidate: candidates.find((c) => c._id === a.candidateId).name, // the "join": look up the candidate by id
    status: a.status,                                         // keep the application status
  }));                                                        // end of map
console.table(rows);                                          // print the result as a table
```

**Output:**

```text
┌─────────┬───────────┬───────────────┐
│ (index) │ candidate │ status        │
├─────────┼───────────┼───────────────┤
│ 0       │ 'Asha'    │ 'applied'     │
│ 1       │ 'Ravi'    │ 'shortlisted' │
└─────────┴───────────┴───────────────┘
```

In a real database, the `filter` is a query with an index on `jobId`, and the "join" is `$lookup` / `populate` in MongoDB or `JOIN` in SQL.

## 🔍 Deeper version

**A 5-step process:**

1. **List the main screens and their queries.** "Recruiter sees applicants for a job, filtered by status, newest first."
2. **Find entities and relationships.** Candidate, Job, Application. One job → many applications. Candidate ↔ Job is many-to-many through Application.
3. **Pick the database** for the data shape (table below).
4. **Write the fields** for each entity, with types and required fields.
5. **Add indexes for each main query.** For the query above: `{ jobId: 1, status: 1, createdAt: -1 }`. See [compound indexes and the ESR rule](topic:mongodb/compound-indexes-esr).

**MongoDB or PostgreSQL?** See also [SQL vs NoSQL](topic:mongodb/sql-vs-nosql).

| Need | Better fit |
|---|---|
| Nested, flexible data (a candidate profile with many optional sections) | MongoDB |
| Strong relations, many joins, strict constraints | PostgreSQL |
| Money, billing, multi-row transactions | PostgreSQL (MongoDB can do transactions too, but SQL is the natural fit) |
| Fast changes to the shape of data | MongoDB |
| Reporting with complex joins and grouping | PostgreSQL |

**MongoDB rules of thumb** (more in [embedding vs referencing](topic:mongodb/embedding-vs-referencing)):
- **Embed** small, bounded data read together: skills, address, an interview's ratings.
- **Reference** shared or unbounded data: applications of a job can grow to thousands, so they get their own collection.
- Remember the **16 MB document limit**. Never let an array grow forever.

**PostgreSQL version of the same model:**

```text
candidates(id PK, name, email UNIQUE)
jobs(id PK, title, status)
applications(id PK, job_id FK → jobs, candidate_id FK → candidates,
             status, created_at, UNIQUE(job_id, candidate_id))
```

`UNIQUE(job_id, candidate_id)` stops a candidate from applying twice to the same job.

**Multi-tenant apps.** Decide early how one company's data is kept away from another's:
- a `tenantId` on every row, with every index starting with `tenantId`, or
- a separate database per tenant.

See [shared database vs database per tenant](topic:architecture/shared-vs-db-per-tenant). SkillKeepr uses **one database per tenant**, so queries inside a tenant's database don't need a tenant filter.

## 🎯 Why do we use it?

- **The schema decides speed.** Wrong shape or missing indexes = slow pages as data grows.
- **It's expensive to change later.** Migrating millions of rows is risky.
- **It protects data quality.** Unique constraints and required fields stop bad data at the door.

## ⚠️ Common mistakes

- **Designing tables first, queries later.** Then the main screen needs five slow joins.
- **Unbounded arrays in MongoDB,** like pushing every application into the job document.
- **No index for the main query.** Fast in development, a timeout in production.
- **Forgetting tenant isolation** in a SaaS app until it's too late.

## 🗣️ How to answer in an interview

> "I start from the main screens and their queries, because the schema should fit how data is read. For a hiring app, the entities are candidates, jobs and applications. Candidate to job is many-to-many, so applications is its own collection with jobId, candidateId, status and timestamps. In MongoDB, I embed small data that's always read together, like a candidate's skills, and I reference anything shared or unbounded, like applications. Then I add an index for each main query, for example jobId plus status plus createdAt for the recruiter's list. If the data were very relational or financial, I'd pick PostgreSQL with foreign keys and a unique constraint on job and candidate. In a multi-tenant app I also decide tenant isolation up front."

[FILL IN: one schema decision you made or saw at SkillKeepr, e.g. why a section was embedded.]

## 🔁 Follow-up questions

### How do you stop duplicate applications?

A unique index on `{ jobId, candidateId }` (MongoDB) or a `UNIQUE(job_id, candidate_id)` constraint (SQL). The database rejects the second insert, even if two requests race.

### How do you show "applications count" on every job card quickly?

Either count with an index each time, or keep a counter field on the job that you `$inc` when someone applies. The counter is faster to read but must be kept in sync.

### What is denormalisation, and when is it OK?

Copying some data into another place to avoid a join, like storing the job title inside each application. It's OK when that data rarely changes and reads are much more common than writes.

### How do you change a schema in production safely?

Add new fields first (optional), write to both old and new, backfill old records with a script, then switch reads, then remove the old field.

## ✅ Quick check

### 1. A job can have 50,000 applications. Embed them in the job document or reference them?

:::answer
**Reference.** Put applications in their own collection with a `jobId`. Embedding would create an unbounded array and could hit the 16 MB document limit.
:::

### 2. Which index helps "applications for job X with status Y, newest first"?

- A) `{ status: 1 }`
- B) `{ jobId: 1, status: 1, createdAt: -1 }`
- C) `{ createdAt: 1 }`

:::answer
**B.** It matches the equality fields (`jobId`, `status`) first, then the sort field (`createdAt`).
:::

### 3. Billing data with invoices, payments and refunds that must always add up. MongoDB or PostgreSQL?

:::answer
**PostgreSQL** is the natural fit: strong relations, constraints and multi-row transactions.
:::
