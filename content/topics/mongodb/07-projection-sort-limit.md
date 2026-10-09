---
title: Projection, sort, limit and skip
stack: mongodb
order: 7
level: Basic
mustKnow: false
askedFrequency: common
summary:
  - "Projection picks which fields come back: { title: 1, salary: 1 } (include) or { notes: 0 } (exclude)."
  - "sort orders the results: 1 = small to big (A→Z), -1 = big to small (Z→A)."
  - limit sets the most documents to return. skip jumps over some documents. Together they make simple pages.
  - MongoDB always runs sort first, then skip, then limit — whatever order you write them in.
  - Big skips are slow, because MongoDB still walks past every skipped document. For deep pages, use cursor-based pagination.
cards:
  - q: What is a projection?
    a: "The second argument to find (or .project()) that says which fields to return, like { title: 1, salary: 1, _id: 0 }."
  - q: Can you mix 1 and 0 in one projection?
    a: "No — except for _id. You either list fields to include or fields to exclude. { _id: 0 } is allowed with includes."
  - q: In what order are sort, skip and limit applied?
    a: Always sort, then skip, then limit — no matter what order you chain them in the code.
  - q: How do you get page 3 with 20 items per page?
    a: "sort by a stable key, then skip((3 - 1) * 20) = skip(40), then limit(20)."
  - q: Why is skip(100000) slow?
    a: MongoDB still has to walk past all 100,000 skipped documents. Use cursor-based pagination (e.g. _id greater than the last one seen) for deep pages.
---

## 💡 What is it?

When you read data with `find`, you can shape the result in four ways:

- **Projection** — choose **which fields** come back.
- **Sort** — choose the **order** of the results.
- **Limit** — return **at most N** [documents](glossary:document).
- **Skip** — **jump over** the first N documents.

Together, they let you show "the 10 newest jobs, with only the title and salary".

## 🏠 Real-life example

Think of a **teacher reading out exam results**.

- "Just tell me the **name and marks**, not the address." → **projection**
- "Read them from **highest marks to lowest**." → **sort** (`-1`)
- "Only the **top 10**, please." → **limit**
- "We already heard the first 10. Now read **numbers 11 to 20**." → **skip** 10, then limit 10

And the teacher always **sorts first**. Only after that does she skip and count. It would make no sense to pick 10 random students and then sort them. MongoDB works the same way.

## 🧑‍💻 Code example

**Setup:** MongoDB running locally, or a free Atlas cluster (set `MONGODB_URI`). Run `npm init -y` and `npm install mongodb`. Save as `paging.js`. It uses CommonJS. Run with `node paging.js`.

```js
const { MongoClient } = require('mongodb');                          // the official MongoDB driver
const client = new MongoClient(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017'); // local MongoDB by default

async function main() {                                              // async, because DB calls take time
  await client.connect();                                            // open the connection
  const jobs = client.db('hiring').collection('jobs');               // the jobs collection
  await jobs.deleteMany({});                                         // clean start for the demo
  await jobs.insertMany([                                            // six jobs; salaryLakh = salary in lakhs per year
    { title: 'Intern', salaryLakh: 5, notes: 'long text...' },       // job A
    { title: 'Backend Dev', salaryLakh: 9, notes: 'long text...' },  // job B
    { title: 'Frontend Dev', salaryLakh: 7, notes: 'long text...' }, // job C
    { title: 'Tech Lead', salaryLakh: 12, notes: 'long text...' },   // job D
    { title: 'QA Engineer', salaryLakh: 6, notes: 'long text...' },  // job E
    { title: 'Full Stack Dev', salaryLakh: 8, notes: 'long text...' }, // job F
  ]);                                                                // end of insertMany

  const page = 2;                                                    // we want page 2...
  const perPage = 2;                                                 // ...with 2 jobs per page

  const result = await jobs                                          // start a query on jobs
    .find({}, { projection: { title: 1, salaryLakh: 1, _id: 0 } })   // projection: only title + salary, hide _id and notes
    .sort({ salaryLakh: -1 })                                        // -1 = highest salary first
    .skip((page - 1) * perPage)                                      // skip page 1's jobs: (2 - 1) * 2 = 2
    .limit(perPage)                                                  // then return at most 2 jobs
    .toArray();                                                      // read the cursor into an array

  console.log(JSON.stringify(result));                               // print page 2 on one line
  await client.close();                                              // close the connection
}                                                                    // end of main

main().catch(console.error);                                         // run, and print any error
```

**Output:**

```text
[{"title":"Full Stack Dev","salaryLakh":8},{"title":"Frontend Dev","salaryLakh":7}]
```

Sorted by salary: Tech Lead (12), Backend Dev (9), **Full Stack Dev (8), Frontend Dev (7)**, QA (6), Intern (5). Page 2 skips the first two and takes the next two.

## 🔍 Deeper version

**Projection rules:**
- **Include mode:** `{ title: 1, salaryLakh: 1 }` returns only those fields, plus `_id`.
- **Exclude mode:** `{ notes: 0 }` returns everything except `notes`.
- You **can't mix** `1` and `0`, except for `_id`. `{ title: 1, _id: 0 }` is fine.
- Nested fields use dot notation: `{ 'address.city': 1 }`.
- `$slice` returns part of an array: `{ comments: { $slice: -5 } }` gives the last 5.

**Sort rules:**
- `1` = ascending (small to big, A→Z, old→new). `-1` = descending.
- Many keys: `{ city: 1, salaryLakh: -1 }` sorts by city, then by salary inside each city.
- **Add a unique tie-breaker.** MongoDB doesn't promise an order for equal values. Two jobs with the same salary could swap places between pages. So you might see one job twice and miss another. Sort by `{ salaryLakh: -1, _id: 1 }` to fix this.
- **Sorting needs an index to be fast.** Without one, MongoDB sorts in memory. Since MongoDB 6.0, big in-memory sorts can spill to disk by default, but they are still slow. An [index](glossary:index) that matches the sort returns results already in order. See [compound indexes and the ESR rule](topic:mongodb/compound-indexes-esr).

**The order is fixed: sort → skip → limit.** `find().limit(2).sort(...)` gives the **same** result as `find().sort(...).limit(2)`. The chain order in your code doesn't matter.

**Why big `skip` is slow.** `skip(100000)` doesn't jump directly. MongoDB still walks past 100,000 documents (or index entries), then throws them away. Page 1 is fast, page 5,000 is slow.

For deep or infinite-scroll pages, use **cursor-based (keyset) pagination**. Remember where the last page ended, and continue from there:

```js
const next = await jobs                       // next page of jobs
  .find({ _id: { $gt: lastSeenId } })         // only jobs AFTER the last one we showed
  .sort({ _id: 1 })                           // same order every time
  .limit(20)                                  // one page
  .toArray();                                 // read it
```

This stays fast on every page, because the index jumps straight to `lastSeenId`. More in [pagination at scale](topic:mongodb/pagination).

**Counting for "Page 3 of 50".** Use `countDocuments(filter)`. It can be slow on huge collections. Many apps show "Load more" instead of exact page numbers.

## 🎯 Why do we use it?

- **Projection** sends less data over the network. A job list doesn't need the long description of every job.
- **Sort** shows what users expect, like newest first or highest salary first.
- **Limit and skip** stop you from loading 100,000 documents into a page that shows 20.

All of this makes list screens fast and keeps memory low on both the server and the browser.

## ⚠️ Common mistakes

- **No limit on list endpoints.** One day the collection has 1 million documents, and the API sends all of them.
- **Sorting on a field without an index.** It works with small data and gets slow later.
- **No tie-breaker in the sort.** Items repeat or go missing between pages.
- **Big skips for deep pages or infinite scroll.** Use cursor-based pagination instead.
- **Mixing include and exclude** in one projection, which throws an error.

## 🗣️ How to answer in an interview

> "Projection chooses which fields come back, so I don't send big fields like descriptions on list screens. Sort orders the results, with 1 for ascending and -1 for descending. Limit caps the number of documents, and skip jumps over some. MongoDB always applies them in the order sort, skip, limit.
>
> For classic page numbers I use skip of page minus one times page size, plus a limit. I always add a unique tie-breaker like _id to the sort, so items don't repeat or go missing between pages. And I make sure an index supports the sort.
>
> skip gets slow for deep pages, because MongoDB still walks past every skipped document. So for large lists or infinite scroll, I use cursor-based pagination: I filter on _id or createdAt greater than the last item I showed."

[FILL IN: how list screens (e.g. candidate lists for recruiters) were paginated at SkillKeepr — page numbers or "load more" — only if you know.]

## 🔁 Follow-up questions

### Does the order of .limit() and .sort() in code matter?

No. For `find`, MongoDB always sorts first, then skips, then limits. (In an **aggregation pipeline**, though, stages run in the order you write them.)

### What's the difference between limit(0) and no limit?

None. `limit(0)` means "no limit" and returns all matching documents.

### How do you return only part of an array?

Use `$slice` in the projection, for example `{ notes: { $slice: -5 } }` for the last 5 notes. Or `$elemMatch` to return only the first array element that matches.

### Why do some items appear twice when paging?

The sort has ties (equal values), so their order can change between queries. Or new items were inserted while the user was paging. Add `_id` as a tie-breaker, and consider cursor-based pagination.

## ✅ Quick check

### 1. What is the skip value for page 4 with 25 items per page?

:::answer
**75.** `(4 - 1) * 25 = 75`. Then `limit(25)`.
:::

### 2. Which projection is invalid?

- A) `{ title: 1, city: 1 }`
- B) `{ title: 1, _id: 0 }`
- C) `{ title: 1, notes: 0 }`

:::answer
**C.** You can't mix include (`1`) and exclude (`0`) in one projection. The only exception is `_id`, as in B.
:::

### 3. You write `find().limit(3).sort({ salaryLakh: -1 })`. Do you get the 3 highest salaries, or 3 random jobs sorted?

:::answer
**The 3 highest salaries.** For `find`, MongoDB always sorts first, then limits, whatever order you write them in.
:::
