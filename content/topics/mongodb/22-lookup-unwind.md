---
title: "$lookup and $unwind; populate vs $lookup"
stack: mongodb
order: 22
level: Intermediate
mustKnow: true
askedFrequency: very common
summary:
  - $lookup joins data from another collection inside an aggregation, like adding the job details to each application. The result is an array field.
  - $unwind turns one document with an array into one document per array item. After a one-to-one $lookup, it turns the [job] array into a plain job object.
  - Mongoose populate() also fills in referenced documents, but it does it in your Node app with an extra query per path. $lookup does the join inside MongoDB.
  - Use populate for simple pages that load a few documents. Use $lookup when you also filter, group or sort on the joined data, like in reports.
  - Index the field you join on (foreignField). _id is indexed already.
cards:
  - q: What does $lookup do?
    a: "It joins another collection inside an aggregation. For each document, it finds matching documents in the other collection (localField = foreignField) and puts them in an array field."
  - q: What does $unwind do?
    a: "It splits an array field into separate documents — one per item. { tags: ['a','b'] } becomes two documents, one with tags 'a' and one with tags 'b'."
  - q: populate vs $lookup?
    a: populate is a Mongoose feature that runs a second query from Node and stitches the results together. $lookup is a MongoDB stage that joins inside the database, so you can then group, sort or filter on the joined fields.
  - q: What happens to a document in $unwind if its array is empty?
    a: "By default it disappears from the results. Use { path: '$job', preserveNullAndEmptyArrays: true } to keep it."
  - q: How do you make $lookup fast?
    a: Filter with $match before the $lookup, so fewer documents need joining, and make sure the foreignField is indexed.
---

## 💡 What is it?

In MongoDB, related data often lives in **different [collections](glossary:collection)**. For example, an application stores only a `jobId`. The job's title is in the `jobs` collection.

`$lookup` brings them together inside an aggregation. It is MongoDB's version of a [join](glossary:join). It adds the matching job as an **array** field.

`$unwind` then turns that array into a normal field. Mongoose's `populate()` does a similar job, but in your Node.js app instead of in the database.

## 🏠 Real-life example

Think of a **school report card**.

The marks register has only the **roll number** and the **marks**. The student's **name and photo** are in a different file: the admission file.

To print report cards, the office does this:
1. Takes each row of the marks register.
2. Looks up the roll number in the admission file.
3. Clips the student's name and photo onto the row.

That clipping is `$lookup`. The admission file gives back an envelope with the student's details inside. `$unwind` is **opening the envelope**, so the name sits directly on the row instead of inside the envelope.

- **The marks register** = the `applications` collection.
- **The admission file** = the `jobs` collection.
- **The roll number** = `jobId` (localField) matching `_id` (foreignField).
- **The envelope** = the array `$lookup` returns.
- **Opening the envelope** = `$unwind`.

`populate()` is like sending a peon to the admission office with the list of roll numbers. He comes back with all the names, and **you** clip them on yourself.

## 🧑‍💻 Code example

You need MongoDB (local, or a free Atlas cluster). Make a folder, run `npm init -y` and `npm install mongoose`. Save this as `lookup.js` (CommonJS). Run it with `node lookup.js`, or `MONGODB_URI="your-connection-string" node lookup.js`.

```js
const mongoose = require('mongoose');                                        // load Mongoose
const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/hiring';   // where MongoDB is; local by default
const { Schema } = mongoose;                                                 // shortcut for mongoose.Schema
const Job = mongoose.model('Job', new Schema({ title: String }));            // jobs collection: each job has a title
const Application = mongoose.model('Application', new Schema({               // applications collection
  tenantId: Schema.Types.ObjectId,                                           // which company owns it
  candidate: String,                                                         // candidate's name
  jobId: { type: Schema.Types.ObjectId, ref: 'Job' },                        // points to a job; ref lets populate() work
}));                                                                         // end of the model

async function main() {                                                      // all the steps, in order
  await mongoose.connect(uri);                                               // connect to the database
  await Promise.all([Job.deleteMany({}), Application.deleteMany({})]);       // start empty
  const tenantId = new mongoose.Types.ObjectId();                            // one company
  const [node, design] = await Job.create([{ title: 'Node Developer' }, { title: 'Designer' }]); // two jobs
  await Application.create([                                                 // three applications
    { tenantId, candidate: 'Asha', jobId: node._id },                        // Asha applied for Node Developer
    { tenantId, candidate: 'Ravi', jobId: design._id },                      // Ravi applied for Designer
    { tenantId, candidate: 'Meera', jobId: node._id },                       // Meera applied for Node Developer
  ]);                                                                        // end of the list

  const joined = await Application.aggregate([                               // WAY 1: $lookup inside MongoDB
    { $match: { tenantId } },                                                // only this company (filter FIRST)
    { $lookup: { from: 'jobs', localField: 'jobId', foreignField: '_id', as: 'job' } }, // job = [matching job] (an array)
    { $unwind: '$job' },                                                     // job = the job object (no array)
    { $project: { _id: 0, candidate: 1, jobTitle: '$job.title' } },          // keep just name and job title
    { $sort: { candidate: 1 } },                                             // A to Z by name
  ]);                                                                        // end of the pipeline
  console.log('$lookup :', joined.map((r) => `${r.candidate}→${r.jobTitle}`).join(', ')); // print "name→job" pairs

  const populated = await Application.find({ tenantId })                     // WAY 2: populate in Mongoose
    .populate('jobId', 'title')                                              // a 2nd query loads the jobs; keep only title
    .sort({ candidate: 1 }).lean();                                          // A to Z; return plain objects
  console.log('populate:', populated.map((a) => `${a.candidate}→${a.jobId.title}`).join(', ')); // same pairs
  await mongoose.disconnect();                                               // close the connection
}                                                                            // end of main
main().catch(console.error);                                                 // run main and print any error
```

**Output:**

```text
$lookup : Asha→Node Developer, Meera→Node Developer, Ravi→Designer
populate: Asha→Node Developer, Meera→Node Developer, Ravi→Designer
```

Same result, two different ways. `$lookup` did it in **one** database command. `populate` sent **two** queries (applications, then jobs) and joined them in Node.js.

## 🔍 Deeper version

**`$lookup`, the simple form:**

```js
{ $lookup: {
    from: 'jobs',          // the OTHER collection's real name (Mongoose model 'Job' → collection 'jobs')
    localField: 'jobId',   // field in the current documents
    foreignField: '_id',   // field in the other collection
    as: 'job',             // name of the new array field
} }
```

- The result is **always an array**, even for a one-to-one link. No match gives `[]`.
- **The pipeline form** lets you filter the joined collection and join on more than one condition:

```js
{ $lookup: {
    from: 'interviews',                                      // the other collection
    localField: '_id', foreignField: 'applicationId',        // join condition
    pipeline: [{ $match: { status: 'scheduled' } }],         // only scheduled interviews
    as: 'upcoming',                                          // result array
} }
```

**`$unwind`:**
- It turns `{ job: [A] }` into `{ job: A }`. For `{ skills: ['node','react'] }`, it makes **two** documents, one per skill. That's handy for "count candidates per skill".
- Documents with a missing or empty array are **dropped** by default. Add `preserveNullAndEmptyArrays: true` to keep them (for example, applications whose job was deleted).
- Unwinding a big array can multiply your documents a lot. Watch out.

**populate vs $lookup:**

| | `populate()` (Mongoose) | `$lookup` (MongoDB) |
|---|---|---|
| Where the join happens | in your Node.js app | inside the database |
| Queries sent | 1 + one per populated path (uses `$in`) | 1 aggregation |
| Can you filter, sort or group on joined fields? | not really | yes |
| Result | Mongoose documents (or plain with `lean()`) | plain objects |
| Best for | simple detail and list pages | reports, dashboards, search on joined data |

`populate` does **not** cause one query per document (no N+1). It collects all the ids and runs one `$in` query per path. But it can't do "sort applications by job title" or "count applications per job category". That needs the joined data inside the database.

**Performance:**
- `$match` **before** `$lookup`. Join only the documents you need.
- The **foreignField should be indexed**. `_id` always is. Joining on something like `applicationId` needs an index there.
- `$lookup` on many documents is still real work. If a page always needs the job title, you can store a copy of it in the application (**denormalize**). See [embedding vs referencing](topic:mongodb/embedding-vs-referencing).
- In a multi-tenant app, the joined collection is filtered by `_id` here, so it's safe. With the pipeline form, add `tenantId` to the inner `$match` too.

## 🎯 Why do we use it?

Good data design often splits related data into separate collections. Jobs, candidates, applications and interviews each live on their own. But screens and reports need them **together**.

- `populate` makes simple screens easy: "show this application with its job".
- `$lookup` makes reports possible: "applications per job category, sorted by count", all in one database call.

## ⚠️ Common mistakes

- **Using the model name in `from`.** It must be the **collection** name (`'jobs'`), not `'Job'`.
- **Forgetting `$unwind`** and then reading `job.title`. `job` is an array, so you get `undefined`.
- **`$unwind` silently dropping documents** that had no match.
- **`$lookup` before `$match`.** You join the whole collection, then throw most of it away.

## 🗣️ How to answer in an interview

> "$lookup is MongoDB's join inside an aggregation. You give it the other collection, the local field, the foreign field and an output name. It adds an array of matching documents. For a one-to-one link, like an application's job, I follow it with $unwind to turn the array into an object. The pipeline form of $lookup lets me filter the joined collection too.
>
> Mongoose's populate looks similar, but it works differently. It runs a second query with $in and stitches the results together in Node. That's fine for simple pages. But if I need to filter, sort or group on the joined fields, like counting applications per job category, I use $lookup, so the database does the work in one call.
>
> For performance, I put $match before $lookup and make sure the foreign field is indexed."

[FILL IN: where you used populate or $lookup at SkillKeepr (e.g. recruiter dashboards). Only add it if it's true.]

## 🔁 Follow-up questions

### Does populate cause the N+1 query problem?

No. Mongoose collects all the referenced ids and runs **one** `$in` query per populated path. But populating several paths, or nested populates, adds more queries. Each one is a round trip to the database.

### What happens if the referenced job was deleted?

With `$lookup`, the `job` array is empty. A plain `$unwind` drops that application from the results. Use `preserveNullAndEmptyArrays: true` to keep it. With `populate`, the field becomes `null`.

### Can you `$lookup` from a collection in another database?

Not with a normal `$lookup`. Both collections must be in the same database. That's one reason to keep related collections together.

### When would you denormalize instead of joining?

When you read the joined field very often and it rarely changes. For example, a job title shown on every application card. Store a copy and update it when the job changes. You trade a little write work for much faster reads.

## ✅ Quick check

### 1. After `$lookup: { from: 'jobs', localField: 'jobId', foreignField: '_id', as: 'job' }`, what type is `job`?

:::answer
An **array**, even if only one job matches. Use `$unwind: '$job'` to turn it into an object.
:::

### 2. You need "number of applications per job title, sorted by count". `populate` or `$lookup`?

:::answer
**`$lookup`.** You need to group and sort on a joined field. That must happen inside the database. `populate` only fills in data after the query.
:::

### 3. Which `from` value is correct for a Mongoose model named `Job`?

- A) `'Job'`
- B) `'jobs'`

:::answer
**B.** `$lookup` needs the real collection name. Mongoose makes it plural and lowercase by default: `'jobs'`.
:::
