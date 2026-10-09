---
title: MongoDB aggregation and indexing on multi-tenant data
template: story
stack: resume
order: 13
level: Intermediate
mustKnow: true
askedFrequency: very common
summary:
  - This page helps you BUILD your story. Pick one real pipeline and one real index from the code before you claim them.
  - SkillKeepr uses one MongoDB database per tenant, so queries inside a tenant need no tenantId filter.
  - "Typical pipelines in a recruitment app: dashboard counters ($facet), list pages ($lookup + $unwind + $sort/$skip/$limit + a count), interview counters, a candidate calendar ($group)."
  - "Typical index wins: a compound index on the fields a list page filters and sorts by, and an index on join keys like jobDescriptionId + candidateId."
  - Prove an index helped with explain('executionStats') before and after.
cards:
  - q: Why don't your queries filter by tenantId?
    a: Each tenant has its own database. The connection itself picks the tenant, so a query inside it only sees that tenant's data.
  - q: Describe a typical list-page aggregation.
    a: "$match the filters → $lookup related data → $unwind it → $project the fields the page needs → $sort → $skip/$limit, with a separate count for the total."
  - q: Why is $facet useful for a dashboard?
    a: It runs several counts in one query and returns them together, like total, active and shortlisted candidates.
  - q: How do you prove an index helped?
    a: "Run explain('executionStats') before and after. Look for COLLSCAN changing to IXSCAN, and totalDocsExamined dropping close to nReturned."
  - q: What is the risk of $facet as the first stage?
    a: Each branch can scan the whole collection. Put a $match before it when you can, so fewer documents enter the facet.
---

:::note[Make this your own story]
You told me you don't remember exactly which pipelines and indexes you wrote. That's fine. Use this page to prepare: open the code, pick **one** pipeline you can explain end to end and **one** index, and fill in the [FILL IN] slots. Only claim what you can explain.
:::

## 💡 What is it?

Your resume says you wrote **complex queries and MongoDB aggregation pipelines** over multi-tenant candidate and recruiter data. It also says you **applied indexing**, so response times stayed good as data grew.

An [aggregation pipeline](glossary:aggregation-pipeline) is a list of steps that data flows through: filter, join, group, sort. An [index](glossary:index) is a sorted list that helps the database find data fast.

## 🏠 Real-life example

Think of a **school library**.

The librarian wants a report: "How many books did each class borrow this month?" They take all the borrow slips, keep only this month's slips, group them by class, and count. That's an **aggregation pipeline**.

Finding one book is slow if you check every shelf. The library catalogue tells you exactly which shelf to go to. That's an **index**.

- **Borrow slips** = documents.
- **"Keep this month's"** = `$match`.
- **"Group by class and count"** = `$group`.
- **The catalogue** = an index.

## 🧩 The problem

Recruiters look at lists and dashboards all day: job lists, candidate lists, interview counts, calendars. Each one needs data from several collections joined together.

As each customer's data grows, a query that was fast with 1,000 records can be slow with 100,000. Without the right indexes, MongoDB reads every document (a COLLSCAN).

**Important fact:** SkillKeepr uses **one database per tenant**. A query inside one tenant's database only sees that tenant's data, so no `tenantId` filter is needed.

## 🛠️ What I built

**Kinds of pipelines a recruitment SaaS like SkillKeepr runs (general patterns):**

| Screen | Pipeline shape |
|---|---|
| Dashboard tiles | `$facet` with several branches, each `$match` + `$count` |
| Users or jobs list | `$match` → `$lookup` (departments, recruiters) → `$unwind` → `$project` → `$sort` → `$skip` / `$limit`, plus a separate count |
| Interview counters per job | `$match` by job → `$unwind` interview rounds → `$match` by status → `$count` |
| Candidate calendar | `$match` by candidate and date range → `$group` to remove duplicates → `$lookup` job details |

**Typical index improvements (general patterns):**
- A **compound index** on the fields a list page filters and sorts by. Example: soft-delete flag, state and status for a jobs list.
- An index on **join keys** used by `$lookup` or lookups. Example: `{ jobDescriptionId: 1, candidateId: 1 }`.
- Follow the **ESR rule** for compound indexes: Equality fields first, then Sort, then Range.

**Example pipeline (not the real SkillKeepr code):**

```js
db.jobs.aggregate([                                         // run a pipeline on the jobs collection
  { $match: { isDeleted: false, status: 'active' } },       // filter first, so fewer documents go through
  { $lookup: { from: 'departments', localField: 'departmentId',
               foreignField: '_id', as: 'department' } },   // join the department of each job
  { $unwind: { path: '$department', preserveNullAndEmptyArrays: true } }, // array → single object; keep jobs without one
  { $project: { title: 1, status: 1, 'department.name': 1 } }, // send only the fields the page needs
  { $sort: { createdAt: -1 } },                             // newest jobs first
  { $skip: 0 }, { $limit: 20 },                             // page 1, 20 jobs per page
]);
```

[FILL IN: the one real pipeline you will talk about — which screen, which stages, and why.]
[FILL IN: the one real index you added — fields, and which query it helped.]

## 🧗 The hard part

**Common hard parts in this kind of work:**
- **String vs ObjectId bugs.** Mongoose converts types in normal queries, but not inside `aggregate()`. A string id in `$match` silently matches nothing.
- **Deep pages.** `$skip` with a large number still reads all the skipped documents.
- **Stage order.** `$match` must come early. A `$project` or `$facet` before `$match` can cause full scans.

[FILL IN: the real hard part you faced.]

## 🏆 The result

From the resume: response times **held as data volumes grew**.

[FILL IN: numbers if you have them — e.g. "the jobs list went from 2.1 s to 180 ms; explain() showed COLLSCAN → IXSCAN, docs examined 40,000 → 20".]

## 🗣️ How to answer in an interview

Fill the slots first. Then practise saying it out loud.

> "At SkillKeepr each customer has its own MongoDB database, so queries never need a tenant filter. I wrote aggregation pipelines for recruiter screens. One example is [FILL IN: the screen]. The pipeline does [FILL IN: the stages, e.g. $match on status, $lookup departments and recruiters, $project, $sort, $skip/$limit, plus a count for the total].
>
> As data grew, [FILL IN: which query got slow]. I checked it with explain('executionStats') and saw a collection scan. I added [FILL IN: the index], following the equality-sort-range rule. After that, explain showed an index scan, and [FILL IN: the before/after numbers]."

## 🔁 Follow-up questions

### Why not use populate() everywhere?

`populate()` runs extra queries from Node, one per reference path. `$lookup` does the join inside the database in one pipeline. For list pages with many joins, `$lookup` is usually better. `populate()` is fine for a single detail page.

### What are the costs of adding indexes?

Every write must also update each index, so writes get slower. Indexes also use memory and disk. Add them for real query patterns, not "just in case".

### How would you paginate a very large list?

Use cursor (keyset) pagination: "give me 20 items after this `_id` or `createdAt`". It uses an index and doesn't read skipped documents. `$skip` gets slower on deep pages.

### Why database-per-tenant instead of a tenantId field?

Strong isolation between customers, simple backup or deletion per customer, and no risk of forgetting a tenant filter. The cost: more connections to manage and migrations run per tenant.

### What does explain() show you?

The plan MongoDB chose (COLLSCAN or IXSCAN), how many index keys and documents it examined, how many it returned, and the time taken.

## 📚 Topics to revise

- [Aggregation pipeline basics](topic:mongodb/aggregation-basics)
- [$lookup and $unwind](topic:mongodb/lookup-unwind)
- [Advanced aggregation: $facet and $bucket](topic:mongodb/advanced-aggregation)
- [explain('executionStats')](topic:mongodb/explain)
- [Compound indexes and the ESR rule](topic:mongodb/compound-indexes-esr)
- [Pagination at scale](topic:mongodb/pagination)
- [Multi-tenant data design](topic:mongodb/multi-tenant-design)
