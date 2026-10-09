---
title: One-to-many and many-to-many relationships
stack: mongodb
order: 12
level: Intermediate
mustKnow: false
askedFrequency: common
summary:
  - "One-to-few (a candidate's 3 addresses): embed the few inside the one."
  - "One-to-many (a job and its many applications): put the parent's _id on each child (applications.jobId)."
  - "Many-to-many (candidates ↔ jobs): use a middle collection (applications) with both ids — or an array of ids on one side if it stays small."
  - Store the reference on the side that keeps the arrays small, and index those reference fields.
  - Pick the shape by the questions the app asks most, like "applications for this job" or "jobs this candidate applied to".
cards:
  - q: How do you model one-to-many when the "many" can be huge?
    a: Store the parent's _id on each child document (child → parent reference), for example applications.jobId, and index that field.
  - q: How do you model many-to-many in MongoDB?
    a: With a middle collection that holds both ids (like applications with candidateId and jobId), or with an array of ids on one side if that list stays small.
  - q: What is "one-to-few"?
    a: A relationship where the many side is small and fixed, like a person's phone numbers. Embed it.
  - q: Why put the reference on the child instead of an array on the parent?
    a: An array of child ids on the parent grows without limit and can hit the 16 MB document limit. A single parent id on each child never grows.
  - q: Why does a middle collection help in many-to-many?
    a: It can hold data about the link itself, like the application's status and date, and both sides can be queried with indexes.
---

## 💡 What is it?

A **relationship** says how two kinds of data are connected. For example: "one job has many applications".

There are three common kinds: **one-to-one**, **one-to-many** and **many-to-many**.

In MongoDB, you build them with **embedding** (data inside data) or **references** (storing another document's `_id`). See [embedding vs referencing](topic:mongodb/embedding-vs-referencing).

## 🏠 Real-life example

Think of a **school**.

- **One-to-few:** one student has 2 parents' phone numbers. That's written on the student's own ID card.
- **One-to-many:** one class has 40 students. Each student's card says "Class 9-B". The class teacher doesn't carry 40 cards.
- **Many-to-many:** students join clubs. One student can join many clubs, and one club has many students. The school keeps a **club register**: each line says "this student is in this club, joined on this date".

Now map it:
- **ID card with phone numbers** = embedding (one-to-few).
- **"Class 9-B" written on each student card** = a reference from child to parent (one-to-many).
- **The club register** = a middle collection (many-to-many).
- **"Joined on this date"** = extra data about the link itself, like an application's status.

## 🧑‍💻 Code example

You need MongoDB running locally (or a free Atlas cluster). Run `npm init -y` and `npm install mongoose`. Save this as `relations.js` and run `node relations.js`. (CommonJS style.)

```js
const mongoose = require('mongoose');                                     // load Mongoose
const { Schema } = mongoose;                                              // shortcut to Schema

const Candidate = mongoose.model('Candidate', new Schema({ name: String })); // candidates collection
const Job = mongoose.model('Job', new Schema({ title: String }));         // jobs collection

const applicationSchema = new Schema({                                    // the MIDDLE collection: one line per "candidate applied to job"
  candidateId: { type: Schema.Types.ObjectId, ref: 'Candidate', required: true }, // which candidate
  jobId: { type: Schema.Types.ObjectId, ref: 'Job', required: true },     // which job
  status: { type: String, default: 'applied' },                           // data about the LINK itself
});                                                                       // end of schema
applicationSchema.index({ jobId: 1 });                                    // fast "applications for this job"
applicationSchema.index({ candidateId: 1, jobId: 1 }, { unique: true });  // fast "jobs for this candidate"; no double apply
const Application = mongoose.model('Application', applicationSchema);     // applications collection

async function main() {                                                   // async so we can use await
  await mongoose.connect('mongodb://127.0.0.1:27017/hiring_rel');         // connect to a test database
  await Promise.all([Candidate.deleteMany({}), Job.deleteMany({}), Application.deleteMany({})]); // start clean

  const [asha, ravi] = await Candidate.create([{ name: 'Asha' }, { name: 'Ravi' }]); // two candidates
  const [nodeJob, reactJob] = await Job.create([{ title: 'Node Dev' }, { title: 'React Dev' }]); // two jobs

  await Application.create([                                              // the links (many-to-many)
    { candidateId: asha._id, jobId: nodeJob._id },                        // Asha → Node Dev
    { candidateId: asha._id, jobId: reactJob._id },                       // Asha → React Dev
    { candidateId: ravi._id, jobId: nodeJob._id },                        // Ravi → Node Dev
  ]);                                                                     // end of create

  const forNode = await Application.find({ jobId: nodeJob._id });         // ONE-TO-MANY: applications for one job
  console.log('Node Dev applications:', forNode.length);                  // 2

  const ashaApps = await Application.find({ candidateId: asha._id });     // the other direction
  const jobIds = ashaApps.map((a) => a.jobId);                            // collect the job ids
  const ashaJobs = await Job.find({ _id: { $in: jobIds } }).sort({ title: 1 }); // load those jobs in ONE query
  console.log('Asha applied to:', ashaJobs.map((j) => j.title));          // both job titles

  await mongoose.disconnect();                                            // close the connection
}                                                                         // end of main

main();                                                                   // run it
```

**Output:**

```text
Node Dev applications: 2
Asha applied to: [ 'Node Dev', 'React Dev' ]
```

## 🔍 Deeper version

**The patterns, from small to huge:**

| Relationship | Example | Best shape |
|---|---|---|
| One-to-one | candidate ↔ profile settings | embed (or the same document) |
| One-to-few | candidate ↔ 3 addresses | embed an array |
| One-to-many (hundreds) | recruiter ↔ saved searches | array of ids on the parent is OK, if it stays bounded |
| One-to-squillions (no limit) | job ↔ applications, user ↔ logs | each child stores the parent `_id` |
| Many-to-many (small one side) | job ↔ 5 required skill tags | array of ids or values on one side |
| Many-to-many (big both sides) | candidates ↔ jobs | middle collection with both ids |

("Squillions" is a funny word for "a huge, unknown number".)

**Where to put the reference.** Put it where it **won't grow**. Each application has exactly **one** `jobId`. But a job could have unlimited applications. So the reference goes on the application, not as an array on the job. This avoids the 16 MB limit and keeps the job document small.

**Two-way references.** Sometimes you store links on both sides. For example, a candidate keeps `appliedJobIds` and each job keeps `candidateIds`. Reads become fast in both directions. But now you must update two documents for every change, and they can get out of sync. Use it only when both arrays are small, and wrap the two writes in a [transaction](topic:mongodb/transactions) if they must always match.

**Why a middle collection wins for big many-to-many:**
- It can hold **data about the link**: status, applied date, recruiter notes.
- Both directions are fast with **indexes** on `jobId` and `candidateId`.
- A **unique compound index** on `{ candidateId, jobId }` stops duplicate applications.
- Nothing grows without limit.

**Joining it back.** To show names and titles, you need a second step:
- With Mongoose: [populate()](topic:mongodb/populate).
- In the database: an aggregation with [$lookup](topic:mongodb/lookup-unwind).
- Or by hand: collect ids, then `find({ _id: { $in: ids } })`, as in the example. That's **two queries in total**, not one per item.

**Multi-tenant note.** In a [multi-tenant](glossary:multi-tenant) app, each application should also store `tenantId`. Indexes should start with it, like `{ tenantId: 1, jobId: 1 }` (see [multi-tenant design](topic:mongodb/multi-tenant-design)).

## 🎯 Why do we use it?

Real apps are full of connected data: companies, recruiters, jobs, candidates and applications.

The right relationship shape means:
- **Common questions are fast**, like "show applications for this job, newest first".
- **Documents stay small**, with no runaway arrays.
- **The rules hold**, like "a candidate can apply to a job only once" (a unique index).

## ⚠️ Common mistakes

- **Storing all child ids in an ever-growing array on the parent**, like `job.applicationIds`.
- **Querying inside a loop.** For example, `for (const app of apps) await Job.findById(app.jobId)`. That's the **N+1 problem**: 1 query for the list plus N more. Use `$in`, `populate` or `$lookup`.
- **Forgetting indexes on reference fields**, so every lookup scans the whole collection.
- **Two-way links without keeping them in sync.**

## 🗣️ How to answer in an interview

> "I model relationships by how big each side can get and how the app queries them. One-to-few, like a candidate's addresses, I embed. One-to-many where the many side has no limit, like applications for a job, I put the parent's id on each child, so applications have a jobId with an index on it. That way no document grows forever.
>
> For many-to-many, like candidates and jobs, I use a middle collection, applications, with candidateId and jobId. It can hold data about the link, like status and applied date. A unique compound index on candidateId and jobId stops duplicate applications. If one side is small, like a few skill tags, an array of ids is fine.
>
> To bring the data back together I use populate, $lookup, or an $in query, never one query per item in a loop."

[FILL IN: how candidates, jobs and applications are actually connected in SkillKeepr's data, if you can describe it. Only add it if it's true.]

## 🔁 Follow-up questions

### What is the N+1 query problem?

You load a list (1 query), then run one more query for each item (N queries). With 100 applications, that's 101 database calls. Fix it by collecting the ids and loading them in one `$in` query, or with `populate` or `$lookup`.

### Should a job store an array of application ids?

No. The number of applications has no limit, so the array grows forever. Store `jobId` on each application and index it.

### How do you stop a candidate from applying twice to the same job?

Create a unique compound index on `{ candidateId: 1, jobId: 1 }`. A second insert fails with a duplicate-key error (code 11000), which you turn into a 409 response.

### When is an array of ids fine for many-to-many?

When it stays small and has a known limit. For example, a job with up to 10 required skill ids, or a candidate saved to a few talent pools.

## ✅ Quick check

### 1. How should you store "a recruiter has many candidates in their pipeline" (could be 10,000+)?

- A) An array of candidate ids inside the recruiter document
- B) A `recruiterId` field on each pipeline entry, with an index

:::answer
**B.** The list has no real limit. Keep the reference on the "many" side so no document grows forever.
:::

### 2. This code loads 200 applications and then their jobs. How many database queries does it run?

```js
const apps = await Application.find({ candidateId });               // 1 query
for (const a of apps) a.job = await Job.findById(a.jobId);           // inside a loop
```

:::answer
**201.** One for the list, plus one per application. That's the N+1 problem. Use `Job.find({ _id: { $in: ids } })` instead: 2 queries in total.
:::

### 3. Which index stops duplicate applications?

:::answer
A unique compound index: `applicationSchema.index({ candidateId: 1, jobId: 1 }, { unique: true })`.
:::
