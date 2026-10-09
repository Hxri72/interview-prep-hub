---
template: scenario
title: Two users update the same record and one change is lost
stack: debugging
order: 25
level: Advanced
mustKnow: false
askedFrequency: sometimes
summary:
  - Two people (or two requests) edit the same record at the same time; the second save silently overwrites the first.
  - "The cause is the read-modify-write pattern: read the document, change it in code, save the whole thing back."
  - For counters and lists, use atomic database operators ($inc, $push, $addToSet, $set on one field) — the database applies them one by one.
  - For edits to whole records, use optimistic locking (a version field); the losing save gets a conflict (409) and the user reloads.
  - Prevent with concurrency tests and code review rules against read-modify-write on shared data.
cards:
  - q: What is a "lost update"?
    a: Two users read the same record, both change it, and both save. The second save overwrites the first, so the first user's change disappears with no error.
  - q: What code pattern causes it?
    a: Read-modify-write — findById, change a field in JavaScript, then save() the whole document back.
  - q: How do you fix a counter that loses updates?
    a: "Use an atomic update like { $inc: { openings: -1 } }. The database applies each change on its own, so none are lost."
  - q: What is optimistic locking?
    a: Each document has a version number. A save only succeeds if the version is still the one you read. If someone saved in between, your save fails, and you return a 409 Conflict.
  - q: Optimistic vs pessimistic locking?
    a: Optimistic assumes conflicts are rare and checks at save time (cheap, no waiting). Pessimistic locks the record while you work, so others wait — safer for very busy records but slower.
---

## 💡 What is it?

Two recruiters open the **same job** at the same time. Recruiter A changes the notes. Recruiter B changes the number of openings. Both click **Save**.

Later, A's notes are **gone**. There was no error. B's save simply **overwrote** A's change.

This is a **lost update**. It's a [race condition](glossary:race-condition): the result depends on who saves last.

## 🏠 Real-life example

Think of a **class attendance sheet** that two monitors update.

Both monitors **take a photocopy** of the sheet at 9:00. Monitor A marks Ravi present on their copy. Monitor B marks Priya present on theirs. Then each one **puts their copy back** as the official sheet. The last one wins, and the other student's mark is lost.

- The **official sheet** = the record in the database.
- **Taking a photocopy** = reading the document into your code.
- **Marking on the copy** = changing it in JavaScript.
- **Replacing the official sheet** = `save()` writing the whole document back.
- The fix: **write directly on the official sheet, one line at a time** (an atomic update), or **put a page number on the sheet** and refuse a copy with an old page number (optimistic locking).

## 🔎 Detect

- Users say **"my change disappeared"** or "the count is wrong".
- Counters drift: 5 openings, 2 people hired, but the count shows **4**, not 3.
- Audit logs show **two updates to the same record** a few milliseconds apart.
- It happens more when **traffic is high** or for **popular records**.

## 🐞 Debug

**Step 1 — Find the update code** for that record. Look for this pattern:

```js
const job = await Job.findById(id);
job.openings = job.openings - 1;
await job.save();
```

That's **read-modify-write**. Between the read and the save, another request can change the record.

**Step 2 — Reproduce it** with two requests at the same time, for example with `Promise.all` in a test. We ran this against a real MongoDB:

```text
broken openings: 4
```

Two people each reduced openings from 5. The right answer is 3. One update was lost.

**Step 3 — Check every place** that writes this record: routes, background jobs, webhooks. Any two of them can race.

See [atomic updates and optimistic locking](topic:mongodb/atomic-updates-locking).

## 🔧 Fix

**Broken: read-modify-write.**

```js
app.post('/jobs/:id/hire', async (req, res) => {                    // a recruiter marks one hire
  const job = await Job.findById(req.params.id);                    // read the whole job (say openings = 5)
  job.openings = job.openings - 1;                                  // change it in JavaScript (5 → 4)
  await job.save();                                                 // write it back — another request may have saved 4 already
  res.json(job);                                                    // both requests reply "4", but it should be 3
});                                                                 // end of route
```

**Fix 1 — Atomic update for counters and lists.** Let the database do the change.

```js
app.post('/jobs/:id/hire', async (req, res) => {                    // same route
  const job = await Job.findOneAndUpdate(                           // one atomic operation in the database
    { _id: req.params.id, openings: { $gt: 0 } },                   // only if there is still an opening (> 0)
    { $inc: { openings: -1 } },                                     // $inc = add −1; the database applies each one in turn
    { returnDocument: 'after' },                                    // return the document AFTER the change
  );                                                                // end of findOneAndUpdate
  if (!job) return res.status(409).json({ message: 'No openings left' }); // no match → already 0 → 409 Conflict
  res.json(job);                                                    // correct count, even with many recruiters at once
});                                                                 // end of route
```

Real result from our test: `atomic openings: 3`.

**Fix 2 — Optimistic locking for editing a whole record.** Mongoose can check a version number for you.

```js
const candidateSchema = new mongoose.Schema(                        // schema for a candidate
  { name: String, notes: String },                                  // the fields people edit
  { optimisticConcurrency: true },                                  // save() fails if someone else saved since we read
);                                                                  // end of schema

app.put('/candidates/:id', async (req, res) => {                    // edit a candidate
  const c = await Candidate.findById(req.params.id);                // read it (with its version number, __v)
  c.notes = req.body.notes;                                         // change the field
  try {                                                             // the save can now fail on a conflict
    await c.save();                                                 // only succeeds if __v is still the one we read
    res.json(c);                                                    // saved safely
  } catch (err) {                                                   // the save failed
    if (err.name === 'VersionError') {                              // someone else saved first
      return res.status(409).json({ message: 'This record changed. Please reload.' }); // 409 Conflict: ask the user to reload
    }                                                               // end of the conflict check
    throw err;                                                      // other errors go to the error handler
  }                                                                 // end of try/catch
});                                                                 // end of route
```

Real result from our test: the second save threw a `VersionError`, and the first recruiter's notes were kept.

**Which fix when?**

| Situation | Fix |
|---|---|
| Counters, likes, stock, openings | `$inc` |
| Adding to a list | `$push` or `$addToSet` |
| Changing one field | `$set` on just that field (not `save()` of the whole doc) |
| Editing a whole form | Optimistic locking (version field) + 409 |
| Several documents must change together | A [transaction](topic:mongodb/transactions) |

## 🛡️ Prevent

- **Code review rule:** no read-modify-write on shared data. Use update operators.
- For edit forms, send the **version** with the form and reject old versions (409).
- **Concurrency tests:** fire two updates at once with `Promise.all` and check the result.
- In the UI, show a clear **"this record changed, reload"** message instead of failing silently.

## 🗣️ How to answer in an interview

**Short version (20 seconds):**

> "A lost update is a race condition from read-modify-write: two requests read the same document, change it in code, and the last save wins. For counters and lists I use atomic operators like $inc and $push, so the database applies each change. For whole-record edits I use optimistic locking with a version field and return 409 on a conflict."

**Full version:**

> "First I find the write path for that record and look for read-modify-write — findById, change a field in JavaScript, then save the whole document. Between the read and the save, another request can save, and its change gets overwritten without any error.
>
> I reproduce it with two concurrent requests in a test, and the count comes out wrong.
>
> The fix depends on the update. For counters and lists, I use atomic operators — $inc, $push, $addToSet, or $set on a single field — often with findOneAndUpdate and a condition like openings greater than zero, so the database does the change safely. For edits to a whole record, I use optimistic locking: Mongoose's optimisticConcurrency checks a version number on save, and if someone saved in between it throws a VersionError, which I turn into a 409 so the user reloads. If several documents must change together, I use a transaction.
>
> To prevent it, I avoid read-modify-write in code review and add concurrency tests."

[FILL IN: a real case where two users or two jobs overwrote each other's change — only if it happened.]

## 🔁 Follow-up questions

### Why doesn't MongoDB stop this by itself?

Each single update **is** atomic in MongoDB. The problem is your code: it **reads**, then **thinks**, then **writes** in separate steps. The database can't know you based the write on old data — unless you use an operator like `$inc` or a version check.

### What is the difference between optimistic and pessimistic locking?

**Optimistic:** don't lock; check the version when saving; retry or ask the user on conflict. Good when conflicts are rare. **Pessimistic:** lock the record while working, others wait. Safer for very busy records, but slower and can cause waiting or deadlocks.

### When do you need a transaction instead?

When **several documents** must change together or not at all — for example moving a candidate from one job to another and updating both jobs' counts. See [transactions](topic:mongodb/transactions).

### How do you handle the conflict in the UI?

Show "This record was changed by someone else", load the latest version, and let the user apply their change again. Never silently overwrite.

## ✅ Quick check

### 1. Two requests both run `job.openings -= 1; await job.save()` on a job with 5 openings. What can the final value be?

:::answer
It can be **4** instead of 3. Both read 5, both write 4, so one update is lost.
:::

### 2. Which update is safe when 100 recruiters click "hire" at the same moment?

- A) Read the job, subtract 1 in JavaScript, then `save()`
- B) `updateOne({ _id }, { $inc: { openings: -1 } })`
- C) Read the job twice to be sure

:::answer
**B.** `$inc` is applied inside the database, one change at a time, so no change is lost.
:::

### 3. With `optimisticConcurrency: true`, what happens when a save finds the version has changed?

:::answer
Mongoose throws a **`VersionError`** and doesn't save. Return **409 Conflict** and ask the user to reload.
:::
