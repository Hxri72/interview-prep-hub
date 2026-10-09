---
template: scenario
title: "One API endpoint is slow (2–5 seconds)"
stack: debugging
order: 18
level: Intermediate
mustKnow: true
askedFrequency: very common
summary:
  - First measure. Add timing logs around each step (database, other APIs, your own code) to find the slow part.
  - "For the database, run explain('executionStats'). COLLSCAN or many docs examined = a missing index."
  - Look for N+1 queries (one query per item inside a loop). Replace them with one batched query.
  - "Quick wins: the right compound index, select only needed fields, lean(), cache hot data, move heavy work to a queue."
  - Measure again after the fix, and add monitoring so it doesn't come back.
cards:
  - q: An endpoint takes 4 seconds. What is your first step?
    a: Measure. I add timing logs around each step — DB queries, external API calls, processing — to see which part is slow before changing anything.
  - q: How do you check if a MongoDB query is slow because of a missing index?
    a: "Run the query with .explain('executionStats'). If the stage is COLLSCAN, or totalDocsExamined is much bigger than nReturned, an index is missing."
  - q: What is an N+1 query problem?
    a: You run 1 query to get a list, then 1 more query for each item in a loop. 100 items = 101 queries. Fix it with one batched query ($in) or a join.
  - q: Name 4 fixes for a slow endpoint.
    a: Add the right compound index, return only needed fields (select + lean), cache hot data, and move heavy work to a background queue.
  - q: How do you prove the fix worked?
    a: Compare the timing logs and explain() numbers before and after, and watch the endpoint's response time (p95) in monitoring.
---

## 💡 What is it?

One API endpoint is slow. It takes **2 to 5 seconds** to reply. Other endpoints are fast.

Users see a spinner for a long time. Some may click again and make it worse.

The cause is usually one of these: a slow [database](glossary:database) query, a slow call to another [API](glossary:api), too many queries in a loop, or heavy work inside the request.

## 🏠 Real-life example

Think of a **school canteen queue** that suddenly moves very slowly.

You don't guess. You **watch each step** with a stopwatch:

- Taking the order = **reading the request**.
- Finding the food in a messy store room = **a database query without an index**.
- The cook walking to the store room **once for every plate**, instead of once for all = **an N+1 query**.
- Waiting for the bakery next door to deliver bread = **a call to another API**.
- Cutting vegetables at the counter while people wait = **heavy work inside the request**.

When you know the slow step, the fix is easy. Tidy the store room (add an index). Bring all items in one trip (batch the query). Cut vegetables before lunch starts (a background job or cache).

## 🔎 Detect

How you notice it:

- **Monitoring** shows the endpoint's response time is high. Look at **p95** (95% of requests are faster than this number), not just the average.
- **Users complain** about one screen, like "the candidates list is slow".
- **Logs** show long durations for one route.

First, confirm it's real:
- Is it slow **every time**, or only sometimes?
- Is it slow for **everyone**, or one customer with much more data?
- Did it start **after a deploy**?

## 🐞 Debug

**Step 1 — Time every step.** Add timing logs around the database calls, external API calls and your own processing. Then you know exactly where the time goes.

**Step 2 — Check the database query.** Run it with [explain](topic:mongodb/explain):

```js
db.applications.find({ jobId: X, status: 'shortlisted' }).explain('executionStats')
```

Red flags:
- `COLLSCAN` — MongoDB read **every** [document](glossary:document). No [index](glossary:index) was used.
- `totalDocsExamined` is much bigger than `nReturned` — it read 50,000 docs to return 20.
- A `SORT` stage in memory — the sort is not covered by an index.

**Step 3 — Look for N+1 queries.** Count the queries for one request. If the count grows with the number of items, you have a loop of queries.

**Step 4 — Check external calls.** A slow payment or ATS API adds its delay to yours. Check if you call them one after another when you could call them in parallel.

**Step 5 — Check the response size.** Returning huge documents with fields the screen doesn't use is slow too.

## 🔧 Fix

**Broken: an N+1 query.** One query for the list, then one query per item.

```js
app.get('/jobs/:jobId/applications', async (req, res) => {          // route: list applications for one job
  const apps = await Application.find({ jobId: req.params.jobId });  // query 1: get every application (all fields)
  for (const app of apps) {                                         // loop over each application
    app.candidate = await Candidate.findById(app.candidateId);       // 1 MORE query per item → 100 apps = 101 queries
  }                                                                 // end of the loop
  res.json(apps);                                                   // send everything back, including fields the UI never shows
});                                                                 // end of the route
```

**Fixed: time each step, batch the query, return only what's needed.**

```js
app.get('/jobs/:jobId/applications', async (req, res) => {          // same route
  const t0 = performance.now();                                     // start time for the whole request
  const apps = await Application.find({ jobId: req.params.jobId })  // query 1: applications for this job
    .select('candidateId status createdAt')                         // only the 3 fields the screen needs
    .sort({ createdAt: -1 })                                        // newest first (covered by the index below)
    .limit(50)                                                      // one page, not everything
    .lean();                                                        // plain objects: faster, less memory than full Mongoose docs
  const t1 = performance.now();                                     // time after query 1
  const ids = apps.map((a) => a.candidateId);                       // collect all candidate ids into one array
  const candidates = await Candidate.find({ _id: { $in: ids } })    // query 2: ALL candidates in ONE query ($in = "any of these")
    .select('name email')                                           // only the fields we show
    .lean();                                                        // plain objects again
  const t2 = performance.now();                                     // time after query 2
  const byId = new Map(candidates.map((c) => [String(c._id), c]));  // Map for fast lookup: id → candidate
  const rows = apps.map((a) => ({ ...a, candidate: byId.get(String(a.candidateId)) })); // join in memory: no extra queries
  console.log({ appsMs: t1 - t0, candidatesMs: t2 - t1 });          // timing log: shows which step is slow
  res.json(rows);                                                   // smaller, faster reply
});                                                                 // end of the route

applicationSchema.index({ jobId: 1, createdAt: -1 });               // compound index: filter by jobId, then sort by createdAt
```

Now one request runs **2 queries**, not 101. The index turns a `COLLSCAN` into an `IXSCAN`.

**Other fixes, by cause:**

| Cause found | Fix |
|---|---|
| `COLLSCAN` / too many docs examined | Add a [compound index](topic:mongodb/compound-indexes-esr) that matches the filter and sort |
| N+1 queries | One `$in` query, or `$lookup` in an [aggregation](topic:mongodb/lookup-unwind) |
| Big documents | `select()` + [`lean()`](topic:mongodb/lean-and-select) |
| Same data read again and again | Cache it (for example in Redis) with a short expiry time |
| Slow external API | Call in parallel with `Promise.all`, set a timeout, or cache the result |
| Heavy work (PDF, emails, big reports) | Move it to a background queue and reply at once |

## 🛡️ Prevent

- **Measure again** after the fix. Compare the before and after numbers.
- **Monitor p95 response time** per endpoint, with an alert when it crosses a limit.
- **Test with realistic data.** A query that is fast with 100 rows can be slow with 1 million.
- **Review new queries** in code review: is there an index for this filter and sort?
- Turn on **slow query logging** in the database.

## 🗣️ How to answer in an interview

**Short version (20 seconds):**

> "First I measure, I don't guess. I add timing logs around each step to find the slow part. If it's the database, I run explain('executionStats') and look for COLLSCAN or N+1 queries. Then I fix the cause — usually a compound index, selecting fewer fields with lean, or batching queries — and I measure again to confirm."

**Full version:**

> "When an endpoint takes 2 to 5 seconds, I first confirm it in monitoring — I look at p95, and whether it's every request or one customer with lots of data.
>
> Then I add timing logs around each step: the database queries, any external API calls and my own processing. That tells me exactly where the time goes.
>
> If it's the database, I run the query with explain('executionStats'). A COLLSCAN, or totalDocsExamined far bigger than nReturned, means a missing index, so I add a compound index that matches the filter and sort. I also check for N+1 queries — a query inside a loop — and replace them with one $in query or a $lookup. I return only the fields the screen needs, with select and lean.
>
> If it's an external API, I add timeouts, call things in parallel, or cache. If it's heavy work, I move it to a background queue.
>
> Finally, I measure again to prove the fix, and add an alert on response time so it doesn't come back."

[FILL IN: a real slow endpoint you fixed at SkillKeepr — what was slow, what you found, what you changed, and the before/after time. Only if it's true.]

## 🔁 Follow-up questions

### Why look at p95 instead of the average?

The average hides slow requests. If most requests take 100 ms but 5% take 4 seconds, the average still looks fine. p95 shows what your slowest normal users feel.

### How do you find N+1 queries?

Turn on query logging (for example `mongoose.set('debug', true)` in development) and count the queries for one request. If the number grows with the number of items, there's a loop of queries. APM tools also show this.

### When would you use a cache, and what is the risk?

Use a cache for data that is read often and changes rarely, like settings or lists. The risk is **old (stale) data**. So set a short expiry time, or delete the cache entry when the data changes. In a multi-tenant app, always put the tenant in the cache key.

### The query has an index but is still slow. What next?

Check if the index **matches** the query: the order of fields matters (the ESR rule — Equality, Sort, Range). Check `totalKeysExamined`. Also check the response size, network time, and whether skip-based pagination is reading thousands of rows.

## ✅ Quick check

### 1. `explain()` shows `COLLSCAN`, `totalDocsExamined: 80000`, `nReturned: 20`. What does it mean?

:::answer
No index was used. MongoDB read all 80,000 documents to return just 20. Add an index that matches the query's filter (and sort).
:::

### 2. A loop runs `await Candidate.findById(id)` for 200 applications. How many queries run, and what is the fix?

:::answer
**201 queries** (1 for the list + 200 in the loop). This is the N+1 problem. Fix it with one query: `Candidate.find({ _id: { $in: ids } })`, or a `$lookup`.
:::

### 3. Which helps memory and speed when you only read data and don't call `.save()`?

- A) `.populate()`
- B) `.lean()`
- C) `.exec()`

:::answer
**B) `.lean()`.** It returns plain JavaScript objects instead of full Mongoose documents, so it's faster and uses less memory.
:::
