---
title: "explain('executionStats'): COLLSCAN vs IXSCAN"
stack: mongodb
order: 20
level: Intermediate
mustKnow: true
askedFrequency: very common
summary:
  - explain() shows HOW MongoDB ran a query — which plan it chose and how much work it did. Use explain('executionStats') to see real numbers.
  - "COLLSCAN = read every document (bad on big collections). IXSCAN = used an index (good). FETCH = loaded documents. SORT = sorted in memory (often a warning sign)."
  - Compare three numbers — nReturned (results), totalKeysExamined (index entries read) and totalDocsExamined (documents read).
  - A healthy query has keys and docs examined close to nReturned. Reading 50,000 documents to return 20 means a missing or wrong index.
  - Check slow queries with explain before and after adding an index, so you can prove the index helped.
cards:
  - q: What does explain('executionStats') show?
    a: The winning plan MongoDB chose (stages like IXSCAN, FETCH, SORT) plus real numbers from running it — results returned, index keys read, documents read and time taken.
  - q: COLLSCAN vs IXSCAN?
    a: COLLSCAN reads every document in the collection. IXSCAN walks an index and reads only matching entries. On big collections, IXSCAN is far faster.
  - q: Which numbers do you compare in executionStats?
    a: nReturned, totalKeysExamined and totalDocsExamined. Ideally all three are close. If docs examined is much bigger than nReturned, the index isn't selective enough or is missing.
  - q: What does a SORT stage in the plan mean?
    a: MongoDB had to sort results in memory because no index gave them in the right order. It's slow on big results and has a memory limit.
  - q: How do you run explain in Mongoose?
    a: "Add .explain('executionStats') to the query, e.g. await Model.find(filter).sort(s).explain('executionStats'). For aggregations, use Model.aggregate(pipeline).explain('executionStats')."
---

## 💡 What is it?

`explain()` tells you **how** MongoDB ran your [query](glossary:query).

It shows:
- **which plan it chose**: did it read every [document](glossary:document), or use an [index](glossary:index)?
- **how much work it did**: how many index entries and documents it read.

`explain('executionStats')` actually runs the query and gives real numbers. It's your main tool for fixing slow queries.

## 🏠 Real-life example

Think of a **teacher checking how a student solved a maths problem**.

Two students both write the right answer: 42. But the teacher says, "Show your working."
- Student A tried every number from 1 to 1,000 until one worked. Right answer, but very slow.
- Student B used a formula and got it in two steps.

The answer is the same. The **working** shows who will survive the big exam with 100 questions.

- **The final answer** = the query results.
- **"Show your working"** = `explain('executionStats')`.
- **Trying every number** = a COLLSCAN.
- **Using the formula** = an IXSCAN using an index.
- **Counting the steps** = `totalDocsExamined` and `totalKeysExamined`.

## 🧑‍💻 Code example

You need MongoDB (local, or a free Atlas cluster). Make a folder, run `npm init -y` and `npm install mongoose`. Save this as `explain.js` (CommonJS). Run it with `node explain.js`, or `MONGODB_URI="your-connection-string" node explain.js`.

```js
const mongoose = require('mongoose');                                        // load Mongoose
const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/hiring';   // where MongoDB is; local by default
const statuses = ['applied', 'shortlisted', 'rejected', 'hired'];            // the 4 possible statuses

function stages(node) {                                                      // turn the plan tree into "A ← B ← C"
  const n = node.queryPlan || node;                                          // newer versions wrap the plan in queryPlan
  const child = n.inputStage || (n.inputStages && n.inputStages[0]);          // the stage that feeds this one
  return child ? `${n.stage} ← ${stages(child)}` : n.stage;                   // keep walking down until the last stage
}                                                                            // end of stages

async function report(col, label, tenantId) {                                // run the query with explain and print it
  const plan = await col.find({ tenantId, status: 'shortlisted' })            // this company's shortlisted applications
    .sort({ appliedAt: -1 }).limit(20)                                       // newest first, first page of 20
    .explain('executionStats');                                              // run it AND return how it was done
  const s = plan.executionStats;                                             // the real numbers
  console.log(label, stages(plan.queryPlanner.winningPlan));                 // which stages were used
  console.log('  nReturned:', s.nReturned, '| keys:', s.totalKeysExamined, '| docs:', s.totalDocsExamined); // the 3 key numbers
}                                                                            // end of report

async function main() {                                                      // all the steps, in order
  await mongoose.connect(uri);                                               // connect to the database
  const col = mongoose.connection.db.collection('applications');             // the raw applications collection
  await col.drop().catch(() => {});                                          // remove old data and old indexes
  const tenants = [new mongoose.Types.ObjectId(), new mongoose.Types.ObjectId()]; // two companies
  const docs = [];                                                           // a list for fake applications
  for (let i = 0; i < 20000; i++) {                                          // 20,000 applications in total
    docs.push({ tenantId: tenants[i % 2], status: statuses[Math.floor(i / 2) % 4], appliedAt: new Date(Date.UTC(2026, 0, 1) + i * 60000) }); // even/odd → company; every status appears for both companies
  }                                                                          // end of the loop
  await col.insertMany(docs);                                                // save them all

  await report(col, 'BEFORE:', tenants[0]);                                  // no index yet
  await col.createIndex({ tenantId: 1, status: 1, appliedAt: -1 });          // compound index in ESR order
  await report(col, 'AFTER: ', tenants[0]);                                  // same query with the index
  await mongoose.disconnect();                                               // close the connection
}                                                                            // end of main
main().catch(console.error);                                                 // run main and print any error
```

**Output** (stage names can differ a little between MongoDB versions):

```text
BEFORE: SORT ← COLLSCAN
  nReturned: 20 | keys: 0 | docs: 20000
AFTER:  LIMIT ← FETCH ← IXSCAN
  nReturned: 20 | keys: 20 | docs: 20
```

Before: MongoDB read **all 20,000** documents and sorted them to return 20. After: it read **20 index entries and 20 documents**. That's the perfect result.

## 🔍 Deeper version

**The three verbosity modes:**

| Mode | What you get | Runs the query? |
|---|---|---|
| `'queryPlanner'` (default) | the chosen plan only | no |
| `'executionStats'` | the plan + real counts and time | yes |
| `'allPlansExecution'` | the above + stats for the plans that lost | yes |

Use `executionStats` for most debugging.

**Stages to know.** Read the plan from the bottom (the leaf) up.

| Stage | Meaning |
|---|---|
| `COLLSCAN` | read every document. Bad on big collections. |
| `IXSCAN` | scanned an index. Look at `indexName` and `indexBounds`. |
| `FETCH` | loaded full documents after the index scan |
| `SORT` | sorted in memory. Often a sign the index order is wrong. |
| `LIMIT` / `SKIP` | applied `.limit()` / `.skip()` |
| `PROJECTION_COVERED` | answered from the index only (a covered query) |

**The three key numbers:**
- `nReturned`: how many documents came back.
- `totalKeysExamined`: how many index entries MongoDB read.
- `totalDocsExamined`: how many documents MongoDB read.

The goal: **`nReturned ≈ totalKeysExamined ≈ totalDocsExamined`**. Here's what different results mean:
- **docs ≫ nReturned**: no index, or the index doesn't cover the filter fields. MongoDB reads documents and throws most away.
- **keys ≫ nReturned**: the index is used, but the field order is poor (think [ESR](topic:mongodb/compound-indexes-esr)).
- **keys = 0 and docs = whole collection**: a COLLSCAN.
- **A `SORT` stage**: no index gives this sort order.

Also look at `executionTimeMillis`. But times change with cache and load. The **counts** are a more reliable signal.

**How MongoDB picks a plan.** If several indexes could work, the query planner tries them for a short time. It picks the plan that returned results with the least work. It then caches that choice for queries of the same shape. `allPlansExecution` shows the losers. `.hint()` forces an index, which is useful for testing.

**In Mongoose and aggregations:**

```js
await Application.find({ tenantId, status }).sort({ appliedAt: -1 }).explain('executionStats'); // explain a find
await Application.aggregate(pipeline).explain('executionStats');                                  // explain an aggregation
```

For [aggregations](topic:mongodb/aggregation-basics), check that the first `$match` uses an `IXSCAN`.

**In production.** You don't run explain on every query. Use the **database profiler** or Atlas **Query Profiler / Performance Advisor** to find slow queries first. Those tools show queries slower than a threshold, often with index suggestions. Then use explain on those queries.

## 🎯 Why do we use it?

"The API is slow" is a feeling. `explain()` gives **facts**:
- Is the slow part the database, or something else?
- Is an index being used at all?
- Did the new index actually help? Compare the before and after numbers.

These numbers are also great in interviews. "Docs examined dropped from 20,000 to 20" is a strong, concrete story.

## ⚠️ Common mistakes

- **Only looking at time.** Time changes with cache and load. Compare the **counts**.
- **Testing on tiny data.** With 50 documents, a COLLSCAN looks fast. Test with realistic data volumes.
- **Missing the `SORT` stage.** The filter uses an index, but the sort happens in memory.
- **Running `executionStats` carelessly on a heavy production query.** It really runs the query. Use `queryPlanner` mode, or a copy of the data.

## 🗣️ How to answer in an interview

> "To debug a slow query, I run it with explain('executionStats'). First I look at the winning plan's stages. COLLSCAN means it read the whole collection. IXSCAN means it used an index. A SORT stage means it sorted in memory, which usually means the index order is wrong.
>
> Then I compare three numbers: nReturned, totalKeysExamined and totalDocsExamined. In a healthy query they're close. If it reads 20,000 documents to return 20, I add or fix a compound index, usually in ESR order: equality, sort, range. Then I run explain again to prove it, and I'd expect something like 20 keys and 20 documents examined.
>
> In production, I'd first find the slow queries with the profiler or Atlas Performance Advisor, then explain them."

[FILL IN: a real query you checked with explain at SkillKeepr, and the before/after numbers if you have them. Only add it if it's true.]

## 🔁 Follow-up questions

### What's the difference between `queryPlanner` and `executionStats` mode?

`queryPlanner` only shows the plan MongoDB **would** use. It doesn't run the query. `executionStats` runs the query and adds real counts and time. Use `queryPlanner` when the query is too heavy to run.

### Why would MongoDB choose a COLLSCAN even when an index exists?

The query doesn't match the index prefix. Or the filter uses a negation like `$ne` or `$nin` that the index can't narrow well. Or the query matches most of the collection anyway. Check the field order and the operators.

### What is `indexBounds` in explain output?

It shows which range of the index MongoDB scanned for each field. For example, `tenantId: [X, X]` is an exact match, and `appliedAt: [MaxKey, MinKey]` means "all values". Wide bounds on early fields mean a lot of keys are read.

### How do you find slow queries in production?

Turn on the database profiler for queries slower than a threshold (like 100 ms). Or use Atlas's Query Profiler and Performance Advisor. Logging the time of each query in your app also helps.

## ✅ Quick check

### 1. explain shows `nReturned: 15`, `totalKeysExamined: 0`, `totalDocsExamined: 400000`. What happened?

:::answer
A **COLLSCAN**. No index was used (0 keys). MongoDB read all 400,000 documents to return 15. Add an index on the filter fields.
:::

### 2. The plan is `SORT ← FETCH ← IXSCAN`. The filter uses an index, but…?

:::answer
The **sort** is done in memory. The index doesn't give results in the sort order. Put the sort field into the index in the right place (ESR: after equality, before range).
:::

### 3. Which mode actually runs the query and gives real counts?

- A) `queryPlanner`
- B) `executionStats`

:::answer
**B.** `queryPlanner` only shows the chosen plan, without running it.
:::
