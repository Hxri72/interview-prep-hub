---
title: Virtuals, instance methods and statics
stack: mongodb
order: 15
level: Intermediate
mustKnow: false
askedFrequency: sometimes
summary:
  - A virtual is a field you can read on a document, but it is calculated, not stored in MongoDB (like fullName from first + last).
  - "An instance method works on ONE document: candidate.isSenior(). A static works on the whole model: Candidate.findByEmail()."
  - "Virtuals don't appear in res.json() unless you set toJSON: { virtuals: true }. They also vanish with lean()."
  - You can't filter or sort by a virtual in a query, because the database doesn't know it exists.
  - Use normal function (not arrow functions) so this points to the document or the model.
cards:
  - q: What is a Mongoose virtual?
    a: A property you can read (and optionally set) on a document that is calculated in Node and never saved in the database, like fullName.
  - q: Instance method vs static method?
    a: An instance method runs on one document (this = the document), like candidate.isSenior(). A static runs on the model (this = the Model), like Candidate.findByEmail(email).
  - q: Why doesn't my virtual show up in the API response?
    a: "Virtuals are left out of toJSON() by default. Set the schema option toJSON: { virtuals: true }. Also, lean() results never have virtuals."
  - q: Can you query by a virtual field?
    a: No. It doesn't exist in MongoDB, so find({ fullName }) can't match it. Query the real stored fields instead.
  - q: What is virtual populate?
    a: A virtual that loads related documents by a foreign field, like job.applications from applications.jobId, without storing an array of ids on the job.
---

## 💡 What is it?

Mongoose lets you add **your own features** to a [schema](glossary:schema). There are three kinds:

- A **virtual** is a field you can read, like `candidate.fullName`, but it is **calculated**, not saved.
- An **instance method** is a [function](glossary:function) you call on **one** document, like `candidate.isSenior()`.
- A **static** is a function you call on the **whole model**, like `Candidate.findByEmail()`.

They keep data logic in one place, next to the data.

## 🏠 Real-life example

Think of a **student report card**.

- The card stores marks for each subject. The **total** is not stored separately. It's calculated from the marks whenever you look. That's a **virtual**.
- A teacher can ask **one student's card**, "Did this student pass?" That's an **instance method**.
- The headmaster can ask **the whole school register**, "Find the student with roll number 42." That's a **static**.

Now map it:
- **Subject marks** = real stored fields.
- **The total** = a virtual (calculated, never stored).
- **"Did this student pass?"** = `candidate.isSenior()`, a method on one document.
- **"Find roll number 42"** = `Candidate.findByEmail()`, a static on the model.

## 🧑‍💻 Code example

You need MongoDB running locally (or a free Atlas cluster). Run `npm init -y` and `npm install mongoose`. Save this as `virtuals.js` and run `node virtuals.js`. (CommonJS style.)

```js
const mongoose = require('mongoose');                                  // load Mongoose

const candidateSchema = new mongoose.Schema(                           // the candidate schema
  {                                                                    // stored fields
    firstName: String,                                                 // stored in MongoDB
    lastName: String,                                                  // stored in MongoDB
    email: { type: String, lowercase: true },                          // stored, always small letters
    experienceYears: Number,                                           // stored
  },                                                                   // end of fields
  { toJSON: { virtuals: true } },                                      // include virtuals when turned into JSON (res.json)
);                                                                     // end of schema

candidateSchema.virtual('fullName').get(function () {                 // VIRTUAL: calculated every time you read it
  return `${this.firstName} ${this.lastName}`;                         // "this" = the document
});                                                                    // end of virtual

candidateSchema.methods.isSenior = function () {                      // INSTANCE METHOD: works on one document
  return this.experienceYears >= 5;                                    // true if 5 or more years
};                                                                     // end of method

candidateSchema.statics.findByEmail = function (email) {              // STATIC: works on the whole model
  return this.findOne({ email: email.toLowerCase() });                 // "this" = the Candidate model
};                                                                     // end of static

const Candidate = mongoose.model('Candidate', candidateSchema);        // the model

async function main() {                                                // async so we can use await
  await mongoose.connect('mongodb://127.0.0.1:27017/hiring_virtual');  // connect to a test database
  await Candidate.deleteMany({});                                      // start clean
  await Candidate.create({ firstName: 'Asha', lastName: 'Nair', email: 'Asha@Mail.com', experienceYears: 6 }); // one candidate

  const c = await Candidate.findByEmail('ASHA@mail.com');              // use the static
  console.log(c.fullName);                                             // use the virtual
  console.log(c.isSenior());                                           // use the instance method
  console.log('fullName' in JSON.parse(JSON.stringify(c)));            // is the virtual in the JSON? yes, because of toJSON

  const raw = await Candidate.collection.findOne({});                  // read straight from MongoDB, skipping Mongoose
  console.log('fullName' in raw);                                      // false: it was never stored

  await mongoose.disconnect();                                         // close the connection
}                                                                      // end of main

main();                                                                // run it
```

**Output:**

```text
Asha Nair
true
true
false
```

## 🔍 Deeper version

**Virtuals.**
- A **getter** calculates a value: `fullName`, `age` from `dateOfBirth`, `isOverdue` from `dueDate`.
- A **setter** can split a value: setting `fullName = 'Asha Nair'` can fill `firstName` and `lastName`.
- They are **not in the database**. So you can't `find({ fullName: … })`, `sort` by them, or index them.
- They are **left out of JSON and objects by default**. Turn them on with `{ toJSON: { virtuals: true }, toObject: { virtuals: true } }`.
- **`lean()` drops them.** `lean()` returns plain objects with no Mongoose features (see [lean and select](topic:mongodb/lean-and-select)). The `mongoose-lean-virtuals` plugin can add them back.
- Mongoose adds an `id` virtual (a string copy of `_id`) by default.

**Virtual populate.** This is the most useful virtual in real apps:

```js
jobSchema.virtual('applications', {              // a virtual list on each job
  ref: 'Application',                            // look in the Application model
  localField: '_id',                             // match the job's _id…
  foreignField: 'jobId',                         // …against application.jobId
});                                              // end of virtual
// later: await Job.findById(id).populate('applications');   // fills job.applications
```

The job never stores an array of application ids, so it never grows (see [relationships](topic:mongodb/relationships)). But you can still load its applications in one call. Add `count: true` to get only the number.

**Instance methods vs statics:**

| | Instance method | Static |
|---|---|---|
| Defined on | `schema.methods.x` | `schema.statics.x` |
| Called as | `doc.x()` | `Model.x()` |
| `this` is | the document | the Model |
| Good for | `comparePassword`, `isSenior`, `toPublicJSON` | `findByEmail`, `findActiveForTenant`, `search` |

A real-life method: `recruiter.comparePassword(plain)` returns `bcrypt.compare(plain, this.password)`. The login route then reads cleanly.

**Query helpers** are a fourth kind. `schema.query.forTenant = function (tenantId) { return this.where({ tenantId }); }` lets you chain `Candidate.find().forTenant(t).sort(...)`.

**TypeScript.** Methods and statics need extra type declarations so the editor knows about them. Or you can pass `methods`, `statics` and `virtuals` as options inside the `new Schema(...)` call, and Mongoose infers the types.

**Where should logic live?** Small, data-only rules fit well as methods and virtuals. Bigger business flows, like "shortlist this candidate and email the recruiter", belong in a **service**, so models stay simple.

## 🎯 Why do we use it?

- **No repeated code.** `fullName` is built in one place, not in every route and screen.
- **Readable code.** `if (candidate.isSenior())` explains itself.
- **Small documents.** Calculated values and reverse relationships (virtual populate) don't take space in the database.
- **Reusable queries.** `Candidate.findByEmail()` hides the "always lowercase the email" rule.

## ⚠️ Common mistakes

- **Expecting virtuals in `res.json()`** without `toJSON: { virtuals: true }`.
- **Using `lean()` and then reading a virtual.** It's `undefined` on plain objects.
- **Trying to query or sort by a virtual.** The database can't see it.
- **Arrow functions** for virtuals, methods or statics. `this` won't be the document or model.

## 🗣️ How to answer in an interview

> "Mongoose lets me add three kinds of logic to a schema. A virtual is a calculated property, like fullName from firstName and lastName. It's never stored, so I can't query, sort or index by it, and it's left out of JSON unless I set toJSON virtuals true. It also disappears with lean.
>
> Instance methods work on one document, like comparePassword or isSenior, and this is the document. Statics work on the model, like Candidate.findByEmail, and this is the model.
>
> The virtual I find most useful is virtual populate. A job can load its applications by matching applications.jobId, without storing a growing array of ids on the job. I keep methods for small data rules and put bigger business flows in services."

[FILL IN: a method, static or virtual you used in SkillKeepr's models, if any. Only add it if it's true.]

## 🔁 Follow-up questions

### How do you include virtuals in API responses?

Set `toJSON: { virtuals: true }` (and `toObject` if you use `toObject()`) in the schema options. `res.json(doc)` calls `toJSON()`, so the virtuals appear. Don't use `lean()` for that query.

### Can a virtual be async?

A getter should be synchronous. For async data (like counts from another collection), use virtual populate with `count: true`, or a separate query in a service.

### What is the `id` virtual?

Mongoose adds `doc.id`, which is `_id` as a string. You can turn it off with the schema option `id: false`.

### When would you use a static instead of a service function?

When the logic is a reusable query about that one model, like `findByEmail` or `findActive`. If it touches several models or sends emails, use a service.

## ✅ Quick check

### 1. What does this print?

```js
const c = await Candidate.findOne().lean();          // plain object, no Mongoose features
console.log(c.fullName);                             // fullName is a virtual
```

:::answer
**`undefined`.** `lean()` returns a plain object, so virtuals aren't there.
:::

### 2. `Candidate.find({ fullName: 'Asha Nair' })` returns `[]` even though Asha exists. Why?

:::answer
`fullName` is a virtual. It's not stored in MongoDB, so the database can't match it. Query `firstName` and `lastName` instead.
:::

### 3. Where would you put `comparePassword(plain)`?

- A) A static
- B) An instance method
- C) A virtual

:::answer
**B.** It needs one user's stored hash (`this.password`), so it's an instance method.
:::
