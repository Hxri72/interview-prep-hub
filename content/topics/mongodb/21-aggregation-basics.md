---
title: "Aggregation pipeline basics: $match, $group, $sort, $project"
stack: mongodb
order: 21
level: Intermediate
mustKnow: true
askedFrequency: very common
summary:
  - An aggregation pipeline is a list of steps (stages). Documents flow through them in order, and each stage changes the data a little, like a factory line.
  - "$match filters, $group combines documents and counts or sums them, $sort orders them, and $project chooses and renames fields."
  - Put $match first (and $sort early) so MongoDB can use an index and work on fewer documents.
  - Mongoose does NOT convert types inside aggregate(). A tenantId string must be turned into an ObjectId yourself, or $match finds nothing.
  - "Typical use: reports and dashboards, like \"applications per job per status for one company\"."
cards:
  - q: What is an aggregation pipeline?
    a: An array of stages. Documents pass through each stage in order, and each stage filters, groups, sorts or reshapes them. The output of one stage is the input of the next.
  - q: Why put $match first?
    a: So MongoDB can use an index and send fewer documents to the later stages. A $match after $group can't use an index.
  - q: What does $group need?
    a: "An _id that says what to group by (like { jobId: '$jobId', status: '$status' }) and accumulators like { count: { $sum: 1 } }."
  - q: Why does my aggregation return nothing when find() works?
    a: Mongoose doesn't cast types in aggregate(). If you pass tenantId as a string, it won't match the ObjectId stored in the database. Wrap it in new mongoose.Types.ObjectId(id).
  - q: When do you use aggregation instead of find()?
    a: When you need to group, count, sum, average, join ($lookup) or reshape data — reports, dashboards and statistics. Plain filtering and sorting is simpler with find().
---

## 💡 What is it?

An **aggregation [pipeline](glossary:pipeline)** is a list of steps. MongoDB passes your [documents](glossary:document) through the steps, one after another.

Each step is called a **stage**. It does one job:
- `$match` keeps only the documents you want.
- `$group` combines documents and counts or adds them up.
- `$sort` puts them in order.
- `$project` picks and renames fields.

You use it for reports, like "how many applications per job, per status, for this company?"

## 🏠 Real-life example

Think of **counting votes in a school election**.

1. **$match**: first, take only **valid** ballot papers. Throw away the spoiled ones.
2. **$group**: put the papers into **piles**, one pile per candidate. Count each pile.
3. **$sort**: arrange the piles from **most votes to least**.
4. **$project**: write the final notice: just "Name — Votes". Leave out the extra details.

Each step works on what the step before it handed over.

- **The ballot papers** = documents.
- **Each table in the counting room** = a stage.
- **The whole counting line** = the pipeline.
- **Throwing away spoiled papers first** = putting `$match` first. Less work for every table after it.

## 🧑‍💻 Code example

You need MongoDB (local, or a free Atlas cluster). Make a folder, run `npm init -y` and `npm install mongoose`. Save this as `aggregate.js` (CommonJS). Run it with `node aggregate.js`, or `MONGODB_URI="your-connection-string" node aggregate.js`.

```js
const mongoose = require('mongoose');                                        // load Mongoose
const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/hiring';   // where MongoDB is; local by default
const Application = mongoose.model('Application', new mongoose.Schema({      // a model for "applications"
  tenantId: mongoose.Schema.Types.ObjectId,                                  // which company owns it
  job: String,                                                               // the job title (kept simple here)
  status: String,                                                            // applied / shortlisted / rejected / hired
}));                                                                         // end of the model

async function main() {                                                      // all the steps, in order
  await mongoose.connect(uri);                                               // connect to the database
  await Application.deleteMany({});                                          // start empty
  const companyA = new mongoose.Types.ObjectId();                            // the company we report on
  const companyB = new mongoose.Types.ObjectId();                            // another company (must be ignored)
  const plan = [                                                             // [company, job, status, how many]
    [companyA, 'Node Developer', 'applied', 3], [companyA, 'Node Developer', 'shortlisted', 2], // company A, Node job
    [companyA, 'Node Developer', 'hired', 1], [companyA, 'Designer', 'applied', 2],            // more for company A
    [companyA, 'Designer', 'rejected', 1], [companyB, 'Node Developer', 'applied', 5],         // company B's data
  ];                                                                         // end of the plan
  for (const [tenantId, job, status, n] of plan) {                           // for each row of the plan
    for (let i = 0; i < n; i++) await Application.create({ tenantId, job, status }); // create n applications
  }                                                                          // end of the loop

  const tenantIdFromRequest = companyA.toString();                           // in a real API this arrives as a STRING
  const rows = await Application.aggregate([                                 // the pipeline: a list of stages
    { $match: { tenantId: new mongoose.Types.ObjectId(tenantIdFromRequest) } }, // 1) only company A (string → ObjectId!)
    { $group: { _id: { job: '$job', status: '$status' }, count: { $sum: 1 } } }, // 2) one pile per job+status; count each
    { $project: { _id: 0, job: '$_id.job', status: '$_id.status', count: 1 } }, // 3) flatten: job, status, count
    { $sort: { job: 1, count: -1 } },                                        // 4) job A→Z, then biggest count first
  ]);                                                                        // end of the pipeline
  for (const r of rows) console.log(`${r.job} | ${r.status} | ${r.count}`);  // print one line per group
  await mongoose.disconnect();                                               // close the connection
}                                                                            // end of main
main().catch(console.error);                                                 // run main and print any error
```

**Output:**

```text
Designer | applied | 2
Designer | rejected | 1
Node Developer | applied | 3
Node Developer | shortlisted | 2
Node Developer | hired | 1
```

Company B's 5 applications are not counted. `$match` removed them first.

## 🔍 Deeper version

**How it flows.** `Model.aggregate([stage1, stage2, ...])`. The output of each stage is the input of the next. The result is a plain array, not Mongoose documents.

**The four basic stages:**

| Stage | Job | Example |
|---|---|---|
| `$match` | filter (same syntax as `find`) | `{ $match: { tenantId, status: 'applied' } }` |
| `$group` | group by a key and compute values | `{ $group: { _id: '$jobId', total: { $sum: 1 } } }` |
| `$sort` | order the documents | `{ $sort: { total: -1 } }` |
| `$project` | include, exclude, rename or compute fields | `{ $project: { _id: 0, jobId: '$_id', total: 1 } }` |

Other common stages: `$limit`, `$skip`, `$count`, `$addFields` / `$set`, [$lookup and $unwind](topic:mongodb/lookup-unwind), and [$facet](topic:mongodb/advanced-aggregation).

**`$group` accumulators:**
- `$sum: 1` counts documents. `$sum: '$salary'` adds up a field.
- `$avg`, `$min`, `$max` work as their names say.
- `$push: '$name'` makes a list of values. `$addToSet` does the same without duplicates.
- `$first` / `$last` take the first or last value (sort before the group to make them meaningful).
- The `$` before a field name (`'$status'`) means "the value of this field".

**Put `$match` first. Put `$sort` early.**
- A `$match` at the start can use an [index](glossary:index), just like `find()`. A `$match` **after** `$group` can't. It filters the computed results in memory.
- A `$sort` right after the first `$match` can also use an index.
- MongoDB's optimizer moves some stages for you. But write them in the right order anyway. It's clearer, and the optimizer can't fix everything.
- Check with `Model.aggregate(pipeline).explain('executionStats')`. Look for `IXSCAN` in the first stage. See [explain()](topic:mongodb/explain).

**The type-casting trap.** In `find()`, Mongoose converts `"6650…"` (a string) to an ObjectId for you, because it knows the schema. In `aggregate()`, it does **not**. A string never equals an ObjectId, so `$match` returns nothing, with no error. Always convert: `new mongoose.Types.ObjectId(id)`. The same goes for dates: pass real `Date` objects.

**Memory.** Stages like `$group` and `$sort` hold data in memory, and each stage has a memory limit. On large data, MongoDB can spill to temporary disk files (`allowDiskUse`, which is on by default in recent versions). That works but is slower. Better: filter early, so less data reaches those stages.

**Multi-tenant rule.** Every pipeline on shared collections should **start** with `$match: { tenantId }`. Otherwise a report could count other companies' data. It's also the fastest pipeline, because the `{ tenantId: 1, ... }` index can be used. See [multi-tenant design](topic:mongodb/multi-tenant-design).

## 🎯 Why do we use it?

`find()` gives you documents. But dashboards need **numbers**: totals, counts per group, averages and trends.

Without aggregation, you'd fetch thousands of documents into Node.js and count them in JavaScript. That wastes network, memory and time.

With aggregation, MongoDB does the counting **inside the database**, close to the data. It sends back only the small result. For example: 5 rows instead of 50,000 documents.

## ⚠️ Common mistakes

- **Putting `$match` after `$group`.** The index can't be used, and every document gets grouped first.
- **Passing string ids in `$match`.** Mongoose doesn't cast in aggregate, so you get an empty result.
- **Forgetting the `$` before field names.** `_id: 'status'` groups everything under the text "status". You need `_id: '$status'`.
- **Forgetting the tenant filter** in a multi-tenant app. Your report counts other companies' data.

## 🗣️ How to answer in an interview

> "An aggregation pipeline is an array of stages that documents flow through in order. Each stage filters, groups, sorts or reshapes the data. The basic ones are $match to filter, $group to combine and count with accumulators like $sum and $avg, $sort, and $project to shape the output.
>
> For example, applications per job per status for one tenant: $match on tenantId first, then $group with _id as job and status and count as $sum 1, then $project to flatten it, then $sort.
>
> Two things I'm careful about. $match goes first, so it can use an index and the later stages get less data. And Mongoose doesn't cast types in aggregate, so I convert the tenantId string to an ObjectId myself. Otherwise the match silently returns nothing."

[FILL IN: a real aggregation pipeline you wrote at SkillKeepr over candidate or recruiter data — what report it powered. Only add it if it's true.]

## 🔁 Follow-up questions

### What's the difference between `$project` and `$addFields`?

`$project` sets the **exact** output shape. Fields you don't include are dropped (except `_id`). `$addFields` (also called `$set`) **keeps** all existing fields and adds or changes some.

### How do you count the total number of matching documents in a pipeline?

Use a `$count` stage: `[{ $match: {...} }, { $count: 'total' }]`. To get the page of results and the total in one query, use `$facet`.

### Can aggregation results be very large?

The pipeline itself can process huge data. But each result document must be under 16 MB, and the result comes back through a cursor. For big reports, add `$limit`, or write the result to another collection with `$merge` or `$out`.

### Is aggregation slower than find()?

Not by itself. A simple `$match` + `$sort` + `$limit` pipeline performs like the same `find()`. It gets slow when early stages can't use an index and big data reaches `$group`, `$sort` or `$lookup`.

## ✅ Quick check

### 1. Which pipeline is better, and why?

- A) `[{ $group: { _id: '$status', n: { $sum: 1 } } }, { $match: { tenantId: X } }]`
- B) `[{ $match: { tenantId: X } }, { $group: { _id: '$status', n: { $sum: 1 } } }]`

:::answer
**B.** `$match` first can use an index and only groups one company's documents. A is also **wrong**: after `$group`, the documents no longer have a `tenantId` field, so `$match` finds nothing.
:::

### 2. `find({ tenantId: idString })` works, but `aggregate([{ $match: { tenantId: idString } }])` returns `[]`. Why?

:::answer
Mongoose casts types in `find()`, but **not** in `aggregate()`. The string doesn't equal the stored ObjectId. Use `new mongoose.Types.ObjectId(idString)`.
:::

### 3. What does `{ $sum: 1 }` do inside `$group`?

:::answer
It **counts** the documents in each group. It adds 1 for every document.
:::
