---
title: Atomic updates, race conditions and optimistic locking
stack: mongodb
order: 29
level: Advanced
mustKnow: false
askedFrequency: common
summary:
  - "A race condition: two requests read the same value, both change it in code, and the second save overwrites the first (a \"lost update\")."
  - "Fix 1 — atomic update operators ($inc, $set, $push, $addToSet). The database does the change in one step, so nothing is lost."
  - "Fix 2 — conditional updates: put the rule in the filter, e.g. updateOne({ _id, seatsLeft: { $gt: 0 } }, { $inc: { seatsLeft: -1 } })."
  - "Fix 3 — optimistic locking: keep a version number; save only if the version is unchanged. Mongoose: { optimisticConcurrency: true } throws VersionError."
  - Avoid "read in code → change in code → save" for shared counters and limits.
cards:
  - q: What is a lost update?
    a: Two requests read the same document, both change it in code, and save. The later save overwrites the earlier change, so one update is lost.
  - q: How does $inc prevent a race condition?
    a: The database adds the number itself in one atomic step, so two concurrent $inc of 1 always give +2.
  - q: How do you stop a counter going below zero without a transaction?
    a: "Put the condition in the filter: updateOne({ _id, seatsLeft: { $gt: 0 } }, { $inc: { seatsLeft: -1 } }). If no document matched, there were no seats."
  - q: What is optimistic locking?
    a: Each document has a version number. You save only if the version is still the one you read. If someone changed it in between, the save fails and you retry or show a conflict.
  - q: How do you turn on optimistic locking in Mongoose?
    a: "Set the schema option { optimisticConcurrency: true }. Then save() throws a VersionError if the document changed since you loaded it."
---

## 💡 What is it?

A **[race condition](glossary:race-condition)** happens when two requests change the same data at the same time. The final result depends on which one finishes last.

The classic bug is the **lost update**. Two requests read a value, both change it in JavaScript, and both save. The second save **overwrites** the first one.

MongoDB gives you safe tools: **atomic operators** (like `$inc`), **conditional updates**, and **optimistic locking** with a version number.

## 🏠 Real-life example

Think of a **class attendance count on the board**.

The board says **30**. Two monitors come in at the same time with one late student each.
- Monitor A reads 30, thinks "31", and writes 31.
- Monitor B also read 30, thinks "31", and writes 31.

Two students came in, but the board says 31, not 32. One student was **lost**.

The safe way is a rule: "Don't rewrite the number. Just **add one** with a tally mark." Two tally marks always give +2. That's `$inc`.

Another safe way is a **version stamp**. The board has a small number in the corner. You may only write if the corner number is still what you saw. If it changed, read again first. That's **optimistic locking**.

- The **board** = the document.
- **Read → think → rewrite** = read-modify-write in code.
- **Adding a tally mark** = the atomic `$inc` operator.
- **The corner number** = the version field (`__v`).

## 🧑‍💻 Code example

Setup: start MongoDB locally (or use a free Atlas cluster and change the URL). Run `npm init -y` and `npm install mongoose`. Save this as `race.js` and run `node race.js`. It uses CommonJS.

```js
const mongoose = require('mongoose');                                        // load Mongoose

const fields = { title: String, applicants: Number };                        // a job post with an applicant counter
const Job = mongoose.model('Job', new mongoose.Schema(fields));              // normal model: no protection
const SafeJob = mongoose.model('SafeJob', new mongoose.Schema(fields, { optimisticConcurrency: true })); // model WITH optimistic locking

async function main() {                                                      // the demo
  await mongoose.connect('mongodb://127.0.0.1:27017/race_demo');             // connect to a local database
  await Job.deleteMany({}); await SafeJob.deleteMany({});                    // start clean

  // 1) Lost update: two "requests" read the same document, then both save
  const job = await Job.create({ title: 'Node dev', applicants: 0 });       // applicants starts at 0
  const a = await Job.findById(job._id);                                     // request A reads applicants = 0
  const b = await Job.findById(job._id);                                     // request B also reads applicants = 0
  a.applicants += 1; await a.save();                                         // A saves 1
  b.applicants += 1; await b.save();                                         // B also saves 1 → A's change is overwritten
  console.log('read-modify-write:', (await Job.findById(job._id)).applicants); // 1, but it should be 2

  // 2) Atomic $inc: the database adds, so nothing is lost
  await Job.updateOne({ _id: job._id }, { $set: { applicants: 0 } });        // reset to 0
  await Promise.all([                                                        // run two updates at the same time
    Job.updateOne({ _id: job._id }, { $inc: { applicants: 1 } }),            // +1 done inside the database
    Job.updateOne({ _id: job._id }, { $inc: { applicants: 1 } }),            // +1 done inside the database
  ]);                                                                        // end of Promise.all
  console.log('atomic $inc:', (await Job.findById(job._id)).applicants);     // 2 ✅

  // 3) Optimistic locking: the second save is rejected instead of silently overwriting
  const safe = await SafeJob.create({ title: 'React dev', applicants: 0 }); // starts with version __v = 0
  const x = await SafeJob.findById(safe._id);                                // request X reads version 0
  const y = await SafeJob.findById(safe._id);                                // request Y reads version 0
  x.applicants += 1; await x.save();                                         // X saves → version becomes 1
  y.applicants += 1;                                                         // Y changes its old copy
  await y.save().catch((err) => console.log('optimistic lock:', err.name));  // Y's version 0 is out of date → VersionError

  await mongoose.disconnect();                                               // close the connection
}                                                                            // end of main

main().catch(console.error);                                                 // run and print any error
```

```text
read-modify-write: 1
atomic $inc: 2
optimistic lock: VersionError
```

## 🔍 Deeper version

**Why single-document operators are safe.** MongoDB applies one update to one document **atomically**. Reads and writes inside that update can't interleave with another write to the same document. So `$inc`, `$set`, `$push`, `$addToSet` and `$pull` are all race-safe.

**Common safe patterns:**

| Problem | Safe way |
|---|---|
| Count applicants | `$inc: { applicants: 1 }` |
| Add a tag only once | `$addToSet: { tags: 'node' }` |
| Don't overbook interview slots | `updateOne({ _id, slotsLeft: { $gt: 0 } }, { $inc: { slotsLeft: -1 } })` and check `modifiedCount` |
| Move status only from the right state | `updateOne({ _id, status: 'applied' }, { $set: { status: 'shortlisted' } })` |
| Create once, or update if it exists | `updateOne(filter, update, { upsert: true })` plus a **unique index** on the filter fields |

**`findOneAndUpdate`.** It changes a document and returns it (pass `returnDocument: 'after'` to get the updated version; older Mongoose code uses `{ new: true }`), in one atomic step. It's useful for things like "take the next job from a queue".

**Optimistic locking.** "Optimistic" means you **don't lock** while reading. You just check at save time that nobody else changed the document.
- Each document has a version. In Mongoose, that's the `__v` field.
- On save, the filter includes the old version: "update where `_id` = X **and** `__v` = 0".
- If someone else saved first, the version is now 1. Nothing matches, so you get a **VersionError**. Then reload, re-apply the change, and retry, or show "This record was changed by someone else".

:::note[Mongoose detail]
By default, Mongoose's `__v` only protects some **array** changes. Turn on `{ optimisticConcurrency: true }` in the schema to check the version on **every** `save()`. It only applies to `save()`. `updateOne` and `findOneAndUpdate` skip it, so use atomic operators or conditions in the filter there.
:::

**Pessimistic locking** (lock first, then edit) is common in SQL databases with `SELECT … FOR UPDATE`. MongoDB doesn't offer row locks for your app code. You use atomic operators, conditional filters, optimistic versions, or [transactions](topic:mongodb/transactions) instead.

**Unique indexes stop duplicate creates.** "Check if it exists, then insert" is also a race: two requests can both see "not found". A unique index (for example, one application per candidate per job) lets the database reject the second insert with a `E11000 duplicate key` error.

## 🎯 Why do we use it?

Real apps get **many requests at the same time**. Two recruiters update one candidate. Many candidates apply to one job. A webhook arrives twice. Without atomic updates, counts go wrong, slots get overbooked, and changes silently disappear.

These tools keep the data correct **without slow locks or transactions**. Most of the time, the database does the change in one safe step.

## ⚠️ Common mistakes

- **"Read, change in JavaScript, save" for counters and limits.** Use `$inc` and conditional filters instead.
- **"Find first, then insert if missing."** Two requests can both insert. Use a unique index and/or an upsert.
- **Thinking Mongoose `__v` protects every save by default.** It doesn't. Turn on `optimisticConcurrency`.
- **Ignoring the update result.** Check `modifiedCount` (or the returned document). It tells you if your condition matched.

## 🗣️ How to answer in an interview

> "A race condition is when two requests change the same data at the same time and the result depends on timing. The classic case is a lost update: both requests read a counter, add one in code and save, so one increment is lost.
>
> In MongoDB, updates to a single document are atomic. So my first tool is atomic operators like `$inc`, `$push` and `$addToSet`, where the database does the change in one step. For rules like 'don't book a slot if none are left', I put the rule in the filter, like `slotsLeft: { $gt: 0 }`, and check `modifiedCount`. For edit forms where two people might change the same record, I use optimistic locking. In Mongoose, that's `optimisticConcurrency: true`, which makes `save()` throw a `VersionError` if the version changed. And to stop duplicates, I add a unique index instead of 'check then insert'."

[FILL IN: a real race condition or duplicate-record bug you saw at SkillKeepr and how you fixed it — only if true.]

## 🔁 Follow-up questions

### Optimistic vs pessimistic locking — which is better?

Optimistic is better when conflicts are **rare**, which is true for most web apps. There's no waiting, just a retry when a conflict happens. Pessimistic locking (lock before editing) suits **frequent** conflicts, but it makes others wait, and MongoDB doesn't offer it for app code.

### When do you need a transaction instead?

When one action must change **several documents** together, and atomic operators on one document can't express it. For example, an invoice plus a plan extension.

### How do you handle a VersionError for the user?

Reload the latest document and either re-apply the change automatically (if it's safe) or show "This candidate was updated by someone else. Please review and save again."

### How do you stop the same webhook creating two records?

Store the provider's event ID in a collection with a **unique index**. The second insert fails with a duplicate key error, so you skip it and still return 200.

## ✅ Quick check

### 1. Two requests run `updateOne({ _id }, { $inc: { views: 1 } })` at the same time. `views` was 10. What is it after?

:::answer
**12.** `$inc` runs atomically inside the database, so both increments are kept.
:::

### 2. Which filter prevents booking when no slots are left?

- A) `{ _id }`
- B) `{ _id, slotsLeft: { $gt: 0 } }`
- C) `{ slotsLeft: 0 }`

:::answer
**B.** The update only matches if `slotsLeft` is above 0. If `modifiedCount` is 0, there were no slots left.
:::

### 3. True or false: `Model.updateOne()` checks the version when `optimisticConcurrency` is on.

:::answer
**False.** Optimistic concurrency in Mongoose applies to `document.save()`. For `updateOne`, use conditions in the filter or atomic operators.
:::
