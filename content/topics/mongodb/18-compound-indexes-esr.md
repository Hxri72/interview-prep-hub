---
title: Compound indexes and the ESR rule
stack: mongodb
order: 18
level: Intermediate
mustKnow: true
askedFrequency: very common
summary:
  - "A compound index is one index on several fields, like { tenantId: 1, status: 1, appliedAt: -1 }. The order of the fields matters a lot."
  - "Prefix rule: the index { a, b, c } can also serve queries on { a } and { a, b }, but not on { b } or { c } alone."
  - "ESR rule for ordering fields: Equality first (status: 'applied'), then Sort (appliedAt), then Range ($gte, $lt)."
  - Following ESR lets MongoDB skip the in-memory SORT stage and stop early when you use limit().
  - On a multi-tenant app, tenantId is almost always the first field, because every query filters by it.
cards:
  - q: What is a compound index?
    a: One index on two or more fields, stored sorted by the first field, then the second, and so on.
  - q: What is the ESR rule?
    a: "The usual best order for fields in a compound index: Equality fields first, then Sort fields, then Range fields."
  - q: "Can the index { tenantId: 1, status: 1 } be used for a query on status alone?"
    a: Not efficiently. An index can only be used from its left side (its prefix). A query on status alone doesn't match the prefix.
  - q: Why does the Sort field go before the Range field?
    a: If the range comes first, the matching entries are not in sort order, so MongoDB must sort them in memory. Sort-before-range keeps the results in order and lets it stop early.
  - q: Does direction (1 or -1) matter in a compound index?
    a: "Only when you sort by two or more fields. The index must match the sort directions, or the exact reverse of them."
---

## 💡 What is it?

A **compound [index](glossary:index)** is one index on **several fields** together. For example: `{ tenantId: 1, status: 1, appliedAt: -1 }`.

The entries are sorted by the first field. Then, inside each value, by the second field. Then by the third.

So **the order of fields matters**. The **ESR rule** tells you the best order: **E**quality, then **S**ort, then **R**ange.

## 🏠 Real-life example

Think of the **school attendance register**, stored in a cupboard.

The registers are arranged by **class**. Inside each class, students are listed by **roll number**. On each page, you see each student's **marks**.

- Finding "Class 10, roll number 15" is fast. You go to Class 10, then to roll 15.
- Finding "everyone in Class 10" is also fast. That's the first part (the "prefix").
- But finding "roll number 15 in **every** class" is slow. Roll numbers are only in order **inside** each class. You must open every class register.

Now the ESR rule. The teacher asks: "In Class 10, list students with marks above 60, in roll-number order."
- **Equality** (class = 10): go straight to Class 10.
- **Sort** (roll number): the list is already in roll-number order. Just read it from the top.
- **Range** (marks > 60): skip the students below 60 while you read.

The answer comes out already sorted. No need to rewrite the list.

- **Cupboard of registers** = the compound index.
- **Class, then roll number** = the order of fields in the index.
- **"Every class" search** = a query that doesn't use the index prefix.

## 🧑‍💻 Code example

You need MongoDB (local, or a free Atlas cluster). Make a folder, run `npm init -y` and `npm install mongoose`. Save this as `esr.js` (CommonJS). Run it with `node esr.js`, or `MONGODB_URI="your-connection-string" node esr.js` for Atlas.

```js
const mongoose = require('mongoose');                                        // load Mongoose
const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/hiring';   // where MongoDB is; local by default
const Application = mongoose.model('Application', new mongoose.Schema({}, { strict: false })); // a loose model for "applications"

async function main() {                                                      // all the steps, in order
  await mongoose.connect(uri);                                               // connect to the database
  const col = Application.collection;                                        // the raw MongoDB collection
  await col.drop().catch(() => {});                                          // remove old data and old indexes
  const tenantId = new mongoose.Types.ObjectId();                            // one company (tenant)
  const docs = [];                                                           // a list for fake applications
  for (let i = 0; i < 20000; i++) {                                          // make 20,000 applications
    docs.push({ tenantId, experience: i % 10, appliedAt: new Date(Date.UTC(2026, 0, 1) + i * 1000) }); // experience 0–9; each one 1 second later
  }                                                                          // end of the loop
  await col.insertMany(docs);                                                // save them all

  await col.createIndex({ tenantId: 1, experience: 1, appliedAt: -1 }, { name: 'E_R_S' }); // WRONG order: range before sort
  await col.createIndex({ tenantId: 1, appliedAt: -1, experience: 1 }, { name: 'E_S_R' }); // ESR order: equality, sort, range

  const query = { tenantId, experience: { $gte: 3 } };                       // equality on tenantId, range on experience
  for (const name of ['E_R_S', 'E_S_R']) {                                   // try each index, one by one
    const plan = await col.find(query).sort({ appliedAt: -1 }).limit(10)      // "newest 10 candidates with 3+ years"
      .hint(name).explain('executionStats');                                 // force this index and ask how it went
    const sortedInMemory = JSON.stringify(plan.queryPlanner.winningPlan).includes('"SORT"'); // is there a SORT stage?
    console.log(name, '→ keys read:', plan.executionStats.totalKeysExamined, '| sorted in memory:', sortedInMemory); // print the result
  }                                                                          // end of the loop
  await mongoose.disconnect();                                               // close the connection
}                                                                            // end of main
main().catch(console.error);                                                 // run main and print any error
```

**Output** (your key counts may differ slightly):

```text
E_R_S → keys read: 14000 | sorted in memory: true
E_S_R → keys read: 13 | sorted in memory: false
```

Same 10 results. But the ESR index read **13** index entries instead of **14,000**, and it didn't need to sort in memory.

## 🔍 Deeper version

**How a compound index is stored.** Entries are sorted by field 1, then field 2, then field 3. It's like a phone book sorted by surname, then first name.

**The prefix rule.** The index `{ tenantId: 1, status: 1, appliedAt: -1 }` can serve:

| Query filters on | Can it use this index well? |
|---|---|
| `tenantId` | ✅ yes (prefix) |
| `tenantId` + `status` | ✅ yes (prefix) |
| `tenantId` + `status` + `appliedAt` | ✅ yes (full index) |
| `status` only | ❌ no (skips the first field) |
| `tenantId` + `appliedAt` | ⚠️ partly: uses `tenantId`, then must check `appliedAt` more slowly |

So you rarely need both `{ tenantId: 1 }` and `{ tenantId: 1, status: 1 }`. The second one covers the first.

**The ESR rule, step by step.**
1. **Equality** fields first (`tenantId`, `status: 'applied'`). They narrow the search to one small, exact part of the index.
2. **Sort** fields next (`appliedAt: -1`). Inside that part, entries are already in the order you want. No in-memory sort.
3. **Range** fields last (`experience: { $gte: 3 }`, `$lt`, `$in` with many values). MongoDB skips the non-matching entries as it reads.

Why does the range go after the sort? A range matches **many** values. If it comes before the sort field, the results come out sorted by the range field, not by the sort field. MongoDB must then collect **all** matches and sort them in memory. With `limit(10)`, ESR lets MongoDB stop after 10 matches. That's the 13-vs-14,000 difference in the example.

**ESR is a guideline, not a law.** If a range is very selective (it matches very few documents), putting it earlier can sometimes be better. Always check with [explain()](topic:mongodb/explain).

**Sort direction.** For one sort field, direction doesn't matter. MongoDB can read the index backwards. For two or more sort fields, the index must match the sort directions **or the exact reverse**:
- Index `{ status: 1, appliedAt: -1 }` supports `.sort({ status: 1, appliedAt: -1 })` and `.sort({ status: -1, appliedAt: 1 })`.
- It does **not** support `.sort({ status: 1, appliedAt: 1 })` without an in-memory sort.

**In-memory sorts are risky.** A `SORT` stage loads all matching documents into memory first. On big results it's slow, and it has a memory limit. In recent MongoDB versions it can spill to disk, but that's even slower.

**Multi-tenant apps.** Almost every query has `tenantId: X`. That's an equality filter, so `tenantId` goes **first** in nearly every compound index. This also keeps each company's data close together in the index. See [multi-tenant design](topic:mongodb/multi-tenant-design).

## 🎯 Why do we use it?

Real queries filter on more than one field. "Show this company's shortlisted applications, newest first, page 1." A single-field index on `tenantId` still leaves MongoDB checking the status and sorting thousands of documents.

A compound index in ESR order serves the whole query from the index:
- it jumps to the right company and status,
- it reads in date order,
- it stops after the first page.

The query stays fast even when that company has 100,000 applications.

## ⚠️ Common mistakes

- **Wrong field order.** `{ appliedAt: -1, tenantId: 1 }` can't be used well for "this tenant's applications", because `tenantId` isn't first.
- **Range before sort.** This causes in-memory sorts and reads far too many keys.
- **Too many overlapping indexes**, like `{ tenantId: 1 }`, `{ tenantId: 1, status: 1 }` and `{ tenantId: 1, status: 1, appliedAt: -1 }`. The last one already covers the first two.
- **Wrong direction on multi-field sorts.** It silently adds an in-memory `SORT` stage.

## 🗣️ How to answer in an interview

> "A compound index is one index on several fields, sorted by the first field, then the second, and so on. Because of that, it follows the prefix rule. An index on tenantId, status and appliedAt also serves queries on tenantId alone, or tenantId plus status, but not status alone.
>
> For field order, I follow the ESR rule: Equality fields first, then Sort fields, then Range fields. Equality narrows to one exact part of the index. The sort field then gives results already in order. The range is checked while reading. If the range comes before the sort, MongoDB has to sort in memory, and with a limit it can't stop early.
>
> On a multi-tenant platform, tenantId is the first field in almost every index, because every query filters by it. Then I check with explain that there's no SORT stage, and that totalKeysExamined is close to nReturned."

[FILL IN: a real compound index from SkillKeepr (field order) and the query it served. Only add it if it's true.]

## 🔁 Follow-up questions

### Can MongoDB use two separate indexes for one query?

Sometimes. It's called "index intersection". But MongoDB rarely chooses it, and it's usually slower than one good compound index. Design compound indexes for your main queries instead.

### Does the order of fields in my query object matter?

No. `{ status: 'applied', tenantId: X }` and `{ tenantId: X, status: 'applied' }` are the same query. The order that matters is in the **index** definition.

### Where does `$in` go in ESR?

It depends. With a few values and no sort, `$in` behaves like equality. With a sort, MongoDB may need to merge or sort the results, so it acts more like a range. Test it with explain.

### How many fields should a compound index have?

As many as your main query needs, usually 2–4. A compound index can have up to 32 fields, but wide indexes are big and slow down writes.

## ✅ Quick check

### 1. Index: `{ tenantId: 1, status: 1 }`. Which query can use it well?

- A) `find({ status: 'shortlisted' })`
- B) `find({ tenantId: X })`
- C) `find({ appliedAt: { $gte: d } })`

:::answer
**B.** `tenantId` is the index prefix. A skips the first field, and C uses a field that isn't in the index.
:::

### 2. Query: `find({ tenantId: X, status: 'applied', experience: { $gte: 5 } }).sort({ appliedAt: -1 })`. Which index follows ESR?

- A) `{ tenantId: 1, status: 1, experience: 1, appliedAt: -1 }`
- B) `{ tenantId: 1, status: 1, appliedAt: -1, experience: 1 }`
- C) `{ appliedAt: -1, tenantId: 1, status: 1, experience: 1 }`

:::answer
**B.** Equality fields (`tenantId`, `status`) first, then the sort field (`appliedAt`), then the range field (`experience`).
:::

### 3. You see a `SORT` stage in explain for a query that should be using your compound index. What's the most likely cause?

:::answer
The sort field comes **after** a range field in the index, or the sort directions don't match the index. Reorder the fields in ESR order, or fix the directions.
:::
