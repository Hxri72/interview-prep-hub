---
title: A query is fast in development but times out in production
template: scenario
stack: debugging
order: 28
level: Intermediate
mustKnow: false
askedFrequency: common
summary:
  - The usual reason is data size. Development has 100 rows; production has millions.
  - Run explain('executionStats') on production-like data. COLLSCAN means MongoDB reads every document.
  - Fix with an index that matches the query (equality → sort → range), a projection, and real pagination.
  - Avoid big skip values and regex searches that can't use an index.
  - Prevent it by testing with realistic data volumes and watching slow-query logs.
cards:
  - q: Why can a query be fast locally but slow in production?
    a: Production has far more data. A query that reads every document (COLLSCAN) is instant on 100 docs and very slow on 5 million.
  - q: What is the first tool you use?
    a: "explain('executionStats') on the real query, ideally on production-sized data. Look at the stage (COLLSCAN vs IXSCAN), totalDocsExamined and nReturned."
  - q: What is a bad ratio in explain output?
    a: totalDocsExamined much bigger than nReturned — for example 2,000,000 examined to return 20. The database is doing far too much work.
  - q: Why is skip(100000) slow?
    a: MongoDB still has to walk past 100,000 documents before returning the page. Cursor (keyset) pagination jumps straight to the right spot.
  - q: How do you stop this from happening again?
    a: Test with realistic data volumes, review indexes for every new query, and turn on slow-query logging or the profiler in production.
---

## 💡 What is it?

A page works **instantly on your laptop**. In production, the same page **times out**.

The code is the same. The query is the same. The difference is the **amount of data**.

On your laptop, the collection has 100 documents. In production, it has millions. A query that **reads every document** feels fast with 100. With millions, it can take many seconds.

## 🏠 Real-life example

Think of **finding one student's notebook**.

In your **classroom** there are 30 notebooks on a desk. You can check every one in a few seconds.

In the **whole school library** there are 50,000 notebooks. Checking every one takes all day.

- **30 notebooks** = your development database.
- **50,000 notebooks** = production.
- **Checking every notebook** = a **COLLSCAN** (collection scan).
- **A list sorted by student name, with shelf numbers** = an **index**.
- **Going straight to the right shelf** = an **IXSCAN** (index scan).

## 🔎 Detect

- **Timeouts** or slow responses on one endpoint, only in production.
- **Database CPU** goes up when that page is used.
- **Slow-query logs.** MongoDB logs queries slower than 100ms by default. Atlas shows them in its Performance Advisor and Profiler.
- **Your own timing logs** around the database call show the query is the slow part, not your code.

## 🐞 Debug

1. **Copy the exact query** the endpoint sends: the filter, the sort, the skip and the limit.
2. **Run `explain('executionStats')`** on it, against production or a copy with similar size. See [explain()](topic:mongodb/explain).
3. **Read three things:**
   - `stage`: `COLLSCAN` means no index was used. `IXSCAN` means an index was used.
   - `totalDocsExamined` vs `nReturned`: examining 2,000,000 to return 20 is bad.
   - `SORT` stage in memory: the sort couldn't use an index.
4. **Check for other slow patterns:**
   - a large `skip` (deep pages)
   - a `$regex` that doesn't start with `^`, or that is case-insensitive
   - `$lookup` on a field that has no index on the other collection
   - returning huge documents with no projection

```js
// mongosh — run the real query with explain
db.candidates.find({ status: 'shortlisted', city: 'Kochi' })   // the filter from the endpoint
  .sort({ createdAt: -1 })                                     // newest first
  .limit(20)                                                   // one page of 20
  .explain('executionStats');                                  // show how MongoDB ran it
```

## 🔧 Fix

**Before:** no matching index, deep `skip`, full documents.

```js
// ❌ BEFORE — fine with 100 docs, a timeout with millions
const page = Number(req.query.page) || 1;                        // page number from the URL, default 1
const items = await Candidate.find({ status: 'shortlisted', city: 'Kochi' }) // no index on these fields → COLLSCAN
  .sort({ createdAt: -1 })                                      // sorted in memory, because no index covers it
  .skip((page - 1) * 20)                                        // page 5000 → skips 99,980 documents first
  .limit(20);                                                   // finally takes 20
```

**After:** a compound index that matches the query, a projection, and cursor pagination.

```js
// ✅ AFTER — an index in the order Equality → Sort → Range (the ESR rule)
candidateSchema.index({ status: 1, city: 1, createdAt: -1 });   // equality fields first, then the sort field

const filter = { status: 'shortlisted', city: 'Kochi' };       // the same filter as before
if (req.query.before) {                                         // the client sends the last createdAt it saw
  filter.createdAt = { $lt: new Date(req.query.before) };       // only older items → no skip needed
}                                                               // end of the cursor check
const items = await Candidate.find(filter)                      // uses the index → IXSCAN
  .select('name city status createdAt')                         // projection: only the fields the page shows
  .sort({ createdAt: -1 })                                      // the index already has this order → no memory sort
  .limit(20)                                                    // one page
  .lean();                                                      // plain objects: faster than full Mongoose docs
const nextCursor = items.at(-1)?.createdAt;                     // the client sends this back as ?before= for the next page
```

**Result after the fix (example):**

```text
Before:  stage COLLSCAN   totalDocsExamined 2,000,000   nReturned 20   time 4,800 ms
After:   stage IXSCAN     totalDocsExamined 20          nReturned 20   time 3 ms
```

These numbers are an example to show the shape of the change. Your real numbers will differ.

:::tip
If two items can have the same `createdAt`, add `_id` as a tie-breaker: sort by `{ createdAt: -1, _id: -1 }` and use both in the cursor. See [pagination at scale](topic:mongodb/pagination).
:::

## 🛡️ Prevent

- **Test with realistic data.** Seed your staging database with production-like volume, or a large fake dataset.
- **Review indexes for every new query.** Ask "which index will this use?" in code review. See [compound indexes and ESR](topic:mongodb/compound-indexes-esr).
- **Turn on slow-query logging** and alert on queries above a time limit.
- **Use cursor pagination** for lists that can grow without limit.
- **Remember indexes have a cost.** They slow down writes and use memory. Add the ones your real queries need. See [the cost of indexes](topic:mongodb/index-costs).

## 🗣️ How to answer in an interview

**Short version (20 seconds):**

> "It's almost always data size. I'd run explain('executionStats') on production-sized data. If I see a COLLSCAN or far more documents examined than returned, I add a compound index that matches the filter and sort, use a projection, and switch deep skip pagination to cursor pagination. Then I test with realistic volumes."

**Full version:**

> "When a query is fast locally but times out in production, the difference is usually the amount of data. A collection scan over 100 documents is instant; over millions, it's seconds.
>
> I take the exact query the endpoint sends and run `explain('executionStats')` on production or a production-sized copy. I check the stage — COLLSCAN means no index — and compare `totalDocsExamined` with `nReturned`. I also look for an in-memory sort, a large skip, or a regex that can't use an index.
>
> The fix is usually a compound index in the Equality, Sort, Range order, plus a projection so we only return what the page shows. For deep pages I switch from skip to cursor pagination. Then I re-run explain to prove it uses an IXSCAN with few documents examined.
>
> To prevent it, we test with realistic data volumes, check indexes in code review, and watch slow-query logs."

[FILL IN: a real slow query you fixed at SkillKeepr, with the before/after numbers. See the MongoDB aggregation resume page for how to prepare it. Only if true.]

## 🔁 Follow-up questions

### Why does a regex search get slow?

An index can help a regex only if it is case-sensitive and starts with `^` (a prefix, like `/^Har/`). A regex like `/hari/i` must check every value. For real search, use a text index or a search engine.

### The index exists but explain still shows COLLSCAN. Why?

Common reasons: the field order doesn't match the query, the query uses a different field or type (a string vs an ObjectId), or the index was built on another collection or database. Check with `getIndexes()`.

### Can adding an index make things worse?

Yes. Every index slows down inserts and updates, and uses memory and disk. Too many indexes can make writes slow. Add indexes for the queries that really run.

### How do you add an index to a big collection safely?

Modern MongoDB builds indexes without blocking reads and writes for the whole build. Still, do it at a quiet time, watch the load, and test on staging first.

## ✅ Quick check

### 1. explain shows `totalDocsExamined: 1500000` and `nReturned: 15`. What does it mean?

:::answer
MongoDB read 1.5 million documents to return 15. The query has no good index. Add an index that matches the filter (and the sort), then check again.
:::

### 2. The query is `find({ status, city }).sort({ createdAt: -1 })`. Which index fits best?

- A) `{ createdAt: -1, status: 1, city: 1 }`
- B) `{ status: 1, city: 1, createdAt: -1 }`
- C) `{ city: 1 }`

:::answer
**B.** By the ESR rule: equality fields (`status`, `city`) first, then the sort field (`createdAt`). It finds the right documents and returns them already sorted.
:::

### 3. Why is `skip(200000).limit(20)` slow even with an index?

:::answer
MongoDB still walks past 200,000 index entries before returning 20. Cursor pagination (`createdAt < lastSeen`) jumps straight to the right place.
:::
