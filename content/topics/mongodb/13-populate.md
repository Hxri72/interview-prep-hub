---
title: populate()
stack: mongodb
order: 13
level: Intermediate
mustKnow: false
askedFrequency: very common
summary:
  - populate() replaces a stored _id with the real document it points to, using the ref in the schema.
  - It runs a SECOND query behind the scenes (one per populated path, using $in), not a database join.
  - "Pass a field list to load only what you need: populate('candidateId', 'name email')."
  - It also works on arrays of ids, nested paths, with match and options, and with lean().
  - For heavy reports or filtering by the joined data, an aggregation with $lookup is usually better.
cards:
  - q: What does populate() do?
    a: It replaces an ObjectId reference in a document with the full referenced document, by running an extra query on the referenced collection.
  - q: Is populate() a database join?
    a: No. Mongoose runs a separate query (find with $in on the ids) and stitches the results in Node. $lookup is the join that runs inside MongoDB.
  - q: How do you populate only some fields?
    a: "Give a select string: populate('jobId', 'title location'), or populate({ path: 'jobId', select: 'title' })."
  - q: What does populate need in the schema?
    a: "A ref option on the ObjectId field, like { type: Schema.Types.ObjectId, ref: 'Job' }, so Mongoose knows which model to query."
  - q: populate() vs $lookup — when do you use which?
    a: populate for simple API reads in Mongoose code. $lookup when you need to filter, group or sort by the joined data, or for big reports, because it runs inside the database.
---

## 💡 What is it?

When you **reference** data, a document only stores an `_id`. For example, an application stores `candidateId: 66f1…`.

`populate()` is a Mongoose method that **swaps that `_id` for the real document**. So `candidateId` becomes `{ name: 'Asha', email: '…' }` in the result.

It works because the schema field has a `ref`, which tells Mongoose which [collection](glossary:collection) to look in.

## 🏠 Real-life example

Think of a **class attendance sheet**.

The sheet only has **roll numbers**: 12, 7, 31. The headmaster asks, "Show me the names."

The class teacher goes to the **student register**, finds roll numbers 12, 7 and 31 in **one trip**, and writes the names next to them.

Now map it:
- **Roll numbers on the sheet** = stored ObjectId references.
- **The student register** = the referenced collection (`candidates`).
- **One trip to the register for all numbers** = one extra query with `$in`.
- **Names written next to the numbers** = the populated result.
- **The teacher** = Mongoose, doing the work in your Node app (not the database).

## 🧑‍💻 Code example

You need MongoDB running locally (or a free Atlas cluster). Run `npm init -y` and `npm install mongoose`. Save this as `populate.js` and run `node populate.js`. (CommonJS style.)

```js
const mongoose = require('mongoose');                                   // load Mongoose
const { Schema } = mongoose;                                            // shortcut to Schema

const Candidate = mongoose.model('Candidate', new Schema({ name: String, email: String, phone: String })); // candidates
const Job = mongoose.model('Job', new Schema({ title: String, location: String }));                     // jobs

const Application = mongoose.model('Application', new Schema({          // applications
  candidateId: { type: Schema.Types.ObjectId, ref: 'Candidate' },       // ref = "this id belongs to the Candidate model"
  jobId: { type: Schema.Types.ObjectId, ref: 'Job' },                   // ref = "this id belongs to the Job model"
  status: String,                                                       // the application's own data
}));                                                                    // end of Application

async function main() {                                                 // async so we can use await
  await mongoose.connect('mongodb://127.0.0.1:27017/hiring_pop');       // connect to a test database
  await Promise.all([Candidate.deleteMany({}), Job.deleteMany({}), Application.deleteMany({})]); // start clean

  const asha = await Candidate.create({ name: 'Asha', email: 'asha@mail.com', phone: '98xxxx' }); // one candidate
  const job = await Job.create({ title: 'Node Dev', location: 'Kochi' }); // one job
  await Application.create({ candidateId: asha._id, jobId: job._id, status: 'applied' }); // link them

  const plain = await Application.findOne();                            // WITHOUT populate
  console.log(typeof plain.candidateId, plain.candidateId instanceof mongoose.Types.ObjectId); // just an id

  const app = await Application.findOne()                               // WITH populate
    .populate('candidateId', 'name email')                              // swap the id for the candidate; only name + email (+ _id)
    .populate('jobId', 'title -_id');                                   // swap the id for the job; only title, hide _id
  console.log(app.candidateId.name, app.candidateId.email, app.candidateId.phone); // phone was not selected → undefined
  console.log(app.jobId.title, app.status);                             // job title and the application's own field

  await mongoose.disconnect();                                          // close the connection
}                                                                       // end of main

main();                                                                 // run it
```

**Output:**

```text
object true
Asha asha@mail.com undefined
Node Dev applied
```

**What happened:** Mongoose ran 3 queries in total. One for the application, one for the candidate, and one for the job.

## 🔍 Deeper version

**How it really works.** `populate()` is **not** a join inside MongoDB:
1. Mongoose runs your main query.
2. It collects every id in the populated path.
3. It runs **one** more query on the referenced model: `find({ _id: { $in: [ids] } })`.
4. It puts the results into the right places in Node.

So populating 100 applications by `candidateId` costs **2 queries**, not 101. Each extra `populate()` path adds one more query.

**Useful options:**

```js
Application.find({ jobId })                                     // applications for one job
  .populate({                                                   // the object form gives more control
    path: 'candidateId',                                        // which field to fill
    select: 'name email',                                       // which fields to load
    match: { isActive: true },                                  // only populate active candidates; others become null
    options: { sort: { name: 1 } },                             // options for the extra query
  })                                                            // end of populate
  .lean();                                                      // plain objects; populate still works
```

- **Arrays work too.** If `skills: [{ type: ObjectId, ref: 'Skill' }]`, `populate('skills')` fills every id.
- **Nested populate.** `populate({ path: 'jobId', populate: { path: 'recruiterId', select: 'name' } })` fills the job, then the job's recruiter.
- **Missing documents become `null`.** If the candidate was deleted, `candidateId` comes back as `null`. Your code must handle it.
- **`match` doesn't filter the parent.** Applications whose candidate fails `match` are **still returned**, just with `null`. To filter applications by candidate data, use `$lookup`.

**Virtual populate.** If the job doesn't store application ids (good, see [relationships](topic:mongodb/relationships)), you can still write `job.populate('applications')`. Declare a virtual on the job schema with `ref: 'Application'`, `localField: '_id'` and `foreignField: 'jobId'`. See [virtuals](topic:mongodb/virtuals-methods-statics).

**`populate()` vs `$lookup`:**

| | `populate()` | `$lookup` (aggregation) |
|---|---|---|
| Runs where | Node (extra queries) | inside MongoDB |
| Easy to write | yes | more code |
| Filter or sort by joined fields | no | yes |
| Group, count, report | no | yes |
| Good for | simple API reads | reports, dashboards, heavy lists |

See [$lookup and $unwind](topic:mongodb/lookup-unwind).

**Multi-tenant safety.** `populate` only follows the ids you stored. Still, add `match: { tenantId }` or make sure ids come from tenant-checked documents, so a bad reference can never show another company's data.

## 🎯 Why do we use it?

- **Clean API responses.** The frontend gets the candidate's name and the job title, not just ids.
- **Less code.** One line instead of collecting ids and running `$in` queries by hand.
- **It fits referenced designs.** You keep documents small with references, and still get rich results when you need them.

## ⚠️ Common mistakes

- **Forgetting `ref`** in the schema. Then `populate` has nothing to follow and returns plain ids.
- **Populating everything.** Loading full candidate documents (with big fields) when the list only needs `name`. Always pass a field list.
- **Expecting `match` to filter the main results.** It only sets non-matching populated values to `null`.
- **Deep chains of populate on big lists.** Each path adds a query, and the work happens in Node. Use `$lookup` for heavy cases.

## 🗣️ How to answer in an interview

> "populate replaces a stored ObjectId with the referenced document. The schema field needs a ref so Mongoose knows which model to query. It's not a database join. Mongoose runs the main query, collects all the ids, runs one extra find with $in per populated path, and stitches the results together in Node. So populating a list of 100 applications is 2 queries, not 101.
>
> I always pass a select so I only load the fields the API needs, like name and email. It works on arrays, nested paths, and with lean.
>
> When I need to filter or sort by the joined data, or build a report with grouping, I use an aggregation with $lookup instead, because that runs inside MongoDB."

[FILL IN: a real place you used populate or $lookup at SkillKeepr, like showing candidate names on an applications list. Only add it if it's true.]

## 🔁 Follow-up questions

### Does populate cause the N+1 problem?

No. It runs **one** extra query per populated path for the whole result, using `$in`. But many populate paths, or nested populates on big lists, still add round trips and memory use in Node.

### What happens if the referenced document was deleted?

The populated field becomes `null` (or the item is removed from a populated array). Your code and frontend must handle that, for example by showing "Candidate deleted".

### Can you populate after the query has run?

Yes. `await doc.populate('jobId')` on a single document, or `Model.populate(docs, { path: 'jobId' })` on a list you already loaded.

### How do you sort applications by the candidate's name?

Not with `populate`, because the sort happens before the candidate data is fetched. Use an aggregation: `$lookup` the candidate, then `$sort` by `candidate.name`. Or copy the name onto the application if it rarely changes.

## ✅ Quick check

### 1. How many database queries does this run?

```js
await Application.find({ jobId })                // the main query
  .populate('candidateId', 'name')               // first populated path
  .populate('jobId', 'title');                   // second populated path
```

:::answer
**3.** The main query, plus one `$in` query for each populated path.
:::

### 2. The schema says `candidateId: { type: Schema.Types.ObjectId }` with no `ref`. What does `populate('candidateId')` do?

:::answer
It can't know which model to query, so `candidateId` stays a plain ObjectId. Add `ref: 'Candidate'`.
:::

### 3. You populate with `match: { isActive: false }`. What happens to applications whose candidate is active?

- A) They are removed from the results
- B) They stay in the results, with `candidateId: null`

:::answer
**B.** `match` only affects the populated value, not which parent documents are returned.
:::
