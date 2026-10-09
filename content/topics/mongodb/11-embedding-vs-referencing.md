---
title: "Data modelling: embedding vs referencing"
stack: mongodb
order: 11
level: Intermediate
mustKnow: true
askedFrequency: very common
summary:
  - Embedding = putting related data INSIDE one document. Referencing = storing only the other document's _id.
  - "Embed when the data is read together, belongs to the parent, and stays small (bounded): a candidate's education list."
  - "Reference when the data grows without limit, is shared, or is used on its own: a job's thousands of applications."
  - A document can be at most 16 MB, so never let an embedded array grow forever (the unbounded array problem).
  - "Rule of thumb: design for how the app READS the data. Data used together should be stored together."
cards:
  - q: What is the difference between embedding and referencing?
    a: Embedding stores the related data inside the parent document. Referencing stores only the _id of a document in another collection.
  - q: When should you embed?
    a: When the data is always read with the parent, belongs only to it, and stays small and bounded — like a candidate's addresses or education.
  - q: When should you reference?
    a: When the related data can grow without limit, is shared by many documents, or is queried on its own — like applications for a job.
  - q: What is the maximum size of a MongoDB document?
    a: 16 MB. That is why unbounded arrays (lists that keep growing) are dangerous.
  - q: What is the main advantage of embedding?
    a: One read gets everything, and a write to one document is atomic (all or nothing) without a transaction.
---

## 💡 What is it?

When two pieces of data are related, MongoDB gives you two choices.

**Embedding** means you put the related data **inside** the same [document](glossary:document). **Referencing** means you keep it in a separate [collection](glossary:collection) and store only its `_id`.

Choosing well is the most important part of MongoDB design. It decides how fast your reads are and how big your documents grow.

## 🏠 Real-life example

Think of a **student's school bag** and the **school library**.

- Your **pencil box** lives inside your bag. You always need it with you. It is small and it belongs only to you. That's **embedding**.
- A **library book** is not kept in your bag forever. Many students share it. The library has thousands of books. You just keep a **library card number** that points to it. That's **referencing**.
- If you tried to carry every book you ever borrowed in your bag, the bag would burst. That's the **16 MB document limit**.

Now map it:
- **Your bag** = the parent document (a candidate).
- **The pencil box** = embedded data (the candidate's education list).
- **The library card number** = a reference (`jobId`).
- **The library** = another collection (`jobs`).
- **A bursting bag** = an unbounded array hitting the size limit.

## 🧑‍💻 Code example

You need MongoDB running locally (or a free Atlas cluster). Run `npm init -y` and `npm install mongoose`. Save this as `model.js` and run `node model.js`. (CommonJS style.)

```js
const mongoose = require('mongoose');                                   // load Mongoose
const { Schema } = mongoose;                                            // shortcut to the Schema class

const educationSchema = new Schema({ degree: String, year: Number }, { _id: false }); // small part of a candidate; no own _id needed

const Candidate = mongoose.model('Candidate', new Schema({              // candidates collection
  name: String,                                                         // candidate's name
  education: [educationSchema],                                         // EMBEDDED: small list, always shown with the candidate
}));                                                                    // end of Candidate

const Job = mongoose.model('Job', new Schema({ title: String }));       // jobs collection; shared by many candidates

const Application = mongoose.model('Application', new Schema({          // applications collection; grows without limit
  candidateId: { type: Schema.Types.ObjectId, ref: 'Candidate' },       // REFERENCE: only the candidate's _id
  jobId: { type: Schema.Types.ObjectId, ref: 'Job' },                   // REFERENCE: only the job's _id
  status: { type: String, default: 'applied' },                         // the application's own data
}));                                                                    // end of Application

async function main() {                                                 // async so we can use await
  await mongoose.connect('mongodb://127.0.0.1:27017/hiring_model');     // connect to a test database
  await Promise.all([Candidate.deleteMany({}), Job.deleteMany({}), Application.deleteMany({})]); // start clean

  const asha = await Candidate.create({                                 // one candidate…
    name: 'Asha',                                                       // …named Asha
    education: [{ degree: 'BSc', year: 2022 }, { degree: 'MCA', year: 2026 }], // …with her education INSIDE the document
  });                                                                   // end of create
  const job = await Job.create({ title: 'Node.js Developer' });         // one job

  await Application.create({ candidateId: asha._id, jobId: job._id });  // link them by storing the two ids

  const found = await Candidate.findById(asha._id);                     // ONE read gets the candidate and her education
  console.log(found.name, found.education.map((e) => e.degree));        // Asha [ 'BSc', 'MCA' ]

  const apps = await Application.find({ jobId: job._id });              // all applications for this job
  console.log('applications for job:', apps.length);                    // 1

  await mongoose.disconnect();                                          // close the connection
}                                                                       // end of main

main();                                                                 // run it
```

**Output:**

```text
Asha [ 'BSc', 'MCA' ]
applications for job: 1
```

**What to notice:**
- `education` is **embedded**. It's small (a few degrees), and we always show it with the candidate.
- Applications are **referenced**. A popular job can get 50,000 applications. We can't put them all inside the job document.

## 🔍 Deeper version

**The questions to ask, for each relationship:**

| Question | If yes → |
|---|---|
| Is the data always read **together** with the parent? | Embed |
| Does it **belong only** to this parent? | Embed |
| Is it **small and bounded** (a known, low maximum)? | Embed |
| Can it **grow without limit**? | Reference |
| Is it **shared** by many parents? | Reference |
| Is it **queried or updated on its own** often? | Reference |

**Why embedding is fast.** One read returns everything. And a write to a single document is **atomic**. That means it fully happens or doesn't happen at all, with no transaction needed.

**The 16 MB limit and unbounded arrays.** A single document can't be bigger than **16 MB**. An array that keeps growing, like "all applications" inside a job, is called an **unbounded array**. It causes trouble long before 16 MB:
- Every read of the job loads the whole huge array.
- Every update rewrites more data.
- Indexes on the array (multikey indexes) get very large.

Store the "many" side in its own collection, and put the parent's `_id` on each child.

**The hybrid: copy a few fields (denormalisation).** Sometimes you reference, but also copy a few fields that you always show. For example, each application stores `jobId` **and** `jobTitle`. Now the applications list shows titles without a second query. The cost: if the job title changes, you must update the copies too. Only copy fields that **rarely change**. This is called the **extended reference pattern**.

**Referencing costs.** To show referenced data, you need a second query. In Mongoose that's [populate()](topic:mongodb/populate). In the database that's [$lookup](topic:mongodb/lookup-unwind). Both are slower than reading one embedded document.

**Design for reads.** In SQL, you design tables first and write queries later. In MongoDB, you start with the **screens and API calls**: "What does the candidate profile page need?" Then you shape the documents so the common reads are one query.

## 🎯 Why do we use it?

The wrong choice hurts in two opposite ways:
- **Embedding too much** gives huge documents, slow reads and the 16 MB wall.
- **Referencing too much** turns MongoDB into a slow SQL copy, with many extra queries for every page.

Getting it right means **most pages load with one query**, while big, growing data stays in its own collection.

## ⚠️ Common mistakes

- **Unbounded arrays.** For example, pushing every application, log line or message into one parent document.
- **Normalising everything like SQL.** Splitting small, always-together data (like addresses) into separate collections.
- **Copying fields that change often** into many documents. Then every change means updating thousands of copies.
- **Designing without looking at the queries.** The right shape depends on how the app reads the data.

## 🗣️ How to answer in an interview

> "In MongoDB I can either embed related data inside a document or reference it by storing its _id. I decide based on how the data is read. I embed when the data is always read with the parent, belongs only to it, and stays small, like a candidate's education or addresses. One read gets everything, and the write is atomic.
>
> I reference when the data can grow without limit, is shared, or is queried on its own, like applications for a job. A document can be at most 16 MB, and unbounded arrays get slow long before that, so the many side gets its own collection with the parent's id on each child.
>
> Sometimes I use a hybrid. I reference, but copy a few rarely changing fields, like the job title on each application, so list pages don't need a second query."

[FILL IN: one real modelling choice in the SkillKeepr candidate or recruiter data (what you embedded and what you referenced). Only add it if it's true.]

## 🔁 Follow-up questions

### What is an unbounded array, and why is it bad?

An array with no upper limit, like every message in a chat stored inside the chat document. It makes reads and writes slower as it grows, makes indexes huge, and can finally hit the 16 MB document limit. Move the items to their own collection.

### If you embed, how do you update one item inside the array?

Use the positional operator. For example, `updateOne({ _id, 'education.degree': 'BSc' }, { $set: { 'education.$.year': 2023 } })`. The `$` means "the item that matched the filter". `arrayFilters` helps with more complex cases.

### Embedding duplicates data. Isn't that bad?

Only when the copies change often. Duplicating data that rarely changes, like a job title or a company name, is a normal MongoDB trade-off. You get faster reads in return for a little extra work on rare updates.

### How would you model candidates, jobs and applications?

`candidates` and `jobs` are separate collections, because both are shared and used on their own. `applications` is its own collection with `candidateId`, `jobId`, `tenantId` and `status`. Small, owned data, like a candidate's education, is embedded in the candidate. See [relationships](topic:mongodb/relationships).

## ✅ Quick check

### 1. Embed or reference? A candidate's 2–3 phone numbers.

:::answer
**Embed.** It's small, bounded, belongs only to the candidate and is always shown with them.
:::

### 2. Embed or reference? All interview feedback notes ever written for a busy job opening.

:::answer
**Reference.** The list can grow without limit. Put each note in its own collection with the `jobId`.
:::

### 3. What is the maximum size of one MongoDB document?

- A) 1 MB
- B) 16 MB
- C) No limit

:::answer
**B) 16 MB.**
:::
