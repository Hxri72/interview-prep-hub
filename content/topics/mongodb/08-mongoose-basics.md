---
title: "Mongoose: connecting, schemas and models"
stack: mongodb
order: 8
level: Basic
mustKnow: true
askedFrequency: very common
summary:
  - Mongoose is an ODM — a library that sits on top of the MongoDB driver and adds schemas, validation and helpers.
  - A schema describes the shape of a document (field types, required fields, defaults). A model is the class you use to read and write that collection.
  - "mongoose.model('Candidate', schema) uses the collection 'candidates' (lowercase and plural)."
  - Connect ONCE when the app starts with mongoose.connect(uri). All requests share that connection pool.
  - Mongoose 7+ is promise-only (no callbacks). Use async/await everywhere.
cards:
  - q: What is Mongoose?
    a: An ODM (Object Data Modeling) library for MongoDB in Node.js. It adds schemas, validation, middleware hooks, populate and other helpers on top of the official driver.
  - q: What is the difference between a schema and a model?
    a: A schema is the blueprint (fields, types, rules). A model is built from the schema and is what you use to create, find, update and delete documents.
  - q: Which collection does mongoose.model('Candidate', schema) use?
    a: "'candidates' — Mongoose lowercases and pluralises the model name, unless you set a collection name yourself."
  - q: "What does { timestamps: true } do in a schema?"
    a: It adds createdAt and updatedAt fields and keeps them up to date automatically.
  - q: Should you connect to MongoDB on every request?
    a: No. Connect once at startup. Mongoose keeps a pool of connections that all requests share.
---

## 💡 What is it?

**Mongoose** is a popular library for using MongoDB from Node.js. It is an **[ODM](glossary:odm)** (Object Data Modeling library). It sits on top of the official MongoDB driver.

MongoDB itself does not force a shape on your data. Mongoose adds that shape with a **[schema](glossary:schema)**: which fields exist, their types, and their rules.

From a schema, you make a **model**. The model is what you use in your code to save and find [documents](glossary:document).

## 🏠 Real-life example

Think of **a school admission form**.

- The **blank printed form** says which boxes exist: Name (required), Date of birth (a date), Class (a number from 1 to 12). That's the **schema**.
- The **admission office** uses this form to accept, find and update students. That's the **model**.
- **One filled-in form** for one student is a **document**.
- The office clerk who checks "Name is empty — please fill it" before accepting the form is **validation**.
- The office opens its doors **once in the morning**, not once per student. That's like **connecting once** when the app starts.

## 🧑‍💻 Code example

**Setup:** MongoDB running locally, or a free Atlas cluster (set `MONGODB_URI`, including a database name). Run `npm init -y` and `npm install mongoose`. Save as `models.js`. It uses CommonJS. Run with `node models.js`.

```js
const mongoose = require('mongoose');                                // load Mongoose

const candidateSchema = new mongoose.Schema(                         // the blueprint for a candidate document
  {                                                                  // the fields:
    tenantId: { type: String, required: true },                      // which company this candidate belongs to; must be given
    name: { type: String, required: true, trim: true },              // required; trim removes spaces at the start and end
    email: { type: String, required: true, lowercase: true },        // saved in lowercase, so 'A@B.com' becomes 'a@b.com'
    experience: { type: Number, min: 0, default: 0 },                // years; can't be below 0; 0 if not given
    skills: [String],                                                // an array of strings
  },                                                                 // end of the fields
  { timestamps: true },                                              // options: add createdAt and updatedAt automatically
);                                                                   // end of the schema

const Candidate = mongoose.model('Candidate', candidateSchema);      // the model → uses the "candidates" collection

async function main() {                                              // async, because DB calls take time
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/hiring'); // connect ONCE; "hiring" = database name
  await Candidate.deleteMany({});                                    // clean start for the demo

  const asha = await Candidate.create({                              // validate the data, then save it
    tenantId: 'acme',                                                // the company id
    name: '  Asha ',                                                 // extra spaces (trim will remove them)
    email: 'ASHA@Mail.com',                                          // mixed case (lowercase will fix it)
    skills: ['Node.js'],                                             // one skill
  });                                                                // end of create
  console.log(asha.name, asha.email, asha.experience);               // cleaned values + the default experience
  console.log(Candidate.collection.name);                            // the real collection name

  try {                                                              // this one breaks the rules on purpose
    await Candidate.create({ tenantId: 'acme', email: 'x@y.com', experience: -2 }); // no name, and experience below 0
  } catch (err) {                                                    // Mongoose rejects it BEFORE it reaches MongoDB
    console.log(err.name, '→', Object.keys(err.errors).join(', '));  // which fields failed
  }                                                                  // end of try/catch

  await mongoose.disconnect();                                       // close the connection (a real server keeps it open)
}                                                                    // end of main

main().catch(console.error);                                         // run, and print any error
```

**Output:**

```text
Asha asha@mail.com 0
candidates
ValidationError → name, experience
```

## 🔍 Deeper version

**Schema → model → document:**

| Part | What it is | Example |
|---|---|---|
| Schema | rules and types | `new mongoose.Schema({ name: String })` |
| Model | the class for one collection | `mongoose.model('Candidate', schema)` |
| Document | one instance of the model | `await Candidate.create({...})` |

**Common schema options for a field:** `type`, `required`, `default`, `unique` (this creates a unique **index**; it is not a validator), `enum` (allowed values), `min`/`max`, `minlength`/`maxlength`, `match` (a regex), `trim`, `lowercase`, `ref` (another model, for [populate](topic:mongodb/populate)) and `index`. More in [schema validation](topic:mongodb/schema-validation).

**Collection name.** `mongoose.model('Candidate', schema)` lowercases and pluralises the name, so the collection is `candidates`. You can set it yourself: `new Schema({...}, { collection: 'people' })`.

**Connecting the right way in an Express app:**
- Call `mongoose.connect(uri)` **once**, when the app starts. Start listening for HTTP requests only after it succeeds.
- Mongoose keeps a **connection pool** (a set of open connections) that all requests share. The default `maxPoolSize` is 100.
- Until the connection is ready, Mongoose **buffers** (holds) your queries. If the database is down, they wait and then fail with a timeout. Many teams fail fast at startup instead.
- Listen to events like `mongoose.connection.on('error', ...)` and `'disconnected'` for logging.
- On shutdown, call `mongoose.disconnect()`. See [graceful shutdown](topic:nodejs/graceful-shutdown).
- Keep the connection string in an [environment variable](glossary:environment-variable), never in the code.

**Mongoose vs the native driver:**
- **Mongoose** gives you schemas, validation, defaults, hooks, `populate` and TypeScript support. It costs a little speed.
- **The driver** is faster and closer to MongoDB, but you write the checks yourself.
- For plain reads where you don't need full Mongoose documents, use `.lean()` to get plain objects. It is faster. See [lean() and select()](topic:mongodb/lean-and-select).

:::version[Version note]
- **Mongoose 7** removed **callbacks**. Old code like `Model.find({}, function (err, docs) {...})` no longer works. Use `await`.
- **Mongoose 7** also changed the `strictQuery` default to `false`. Filters on fields that are not in the schema are no longer silently removed.
- Old options like `useNewUrlParser` and `useUnifiedTopology` do nothing now. You can delete them.
- In **Mongoose 9**, `validateSync()` shows a deprecation warning. Use `await doc.validate()` instead.
:::

## 🎯 Why do we use it?

- **Clean, consistent data.** Required fields, types and allowed values are checked before anything is saved.
- **Less repeated code.** Defaults, trimming, lowercasing and timestamps happen automatically.
- **Useful extras.** Middleware hooks (like hashing a password before save), virtual fields, `populate` for references, and easy TypeScript types.
- **One place for the data rules.** Every developer can see the shape of a candidate by opening one schema file.

## ⚠️ Common mistakes

- **Connecting inside every request.** It's slow and can exhaust connections. Connect once at startup.
- **Thinking `unique: true` is validation.** It only creates a unique index. A duplicate gives a MongoDB error with code `11000`, not a ValidationError. Handle it and return `409 Conflict`.
- **Trusting the schema alone.** Mongoose checks data that goes through Mongoose. Other scripts or tools can still write different data. Add MongoDB `$jsonSchema` validation if you need a hard rule.
- **Using old callback-style code** from old tutorials. It fails in Mongoose 7 and later.

## 🗣️ How to answer in an interview

> "Mongoose is an ODM for MongoDB in Node.js. It sits on top of the official driver and adds schemas, validation, middleware hooks and helpers like populate.
>
> A schema defines the fields, their types and rules, like required, default, enum and min. From the schema I create a model, which maps to a collection. mongoose.model('Candidate') uses the 'candidates' collection, and the model is what I use for create, find, update and delete. With timestamps: true, I get createdAt and updatedAt for free.
>
> I connect once when the app starts, and Mongoose keeps a connection pool shared by all requests. The connection string lives in an environment variable. For read-heavy list endpoints, I use lean() to get plain objects, which is faster. And since Mongoose 7, everything is promise-based, so I use async/await."

[FILL IN: how SkillKeepr's Express services set up Mongoose (one shared connection module? schema files per model? lean() on list endpoints?) — only what is true.]

## 🔁 Follow-up questions

### What is the difference between Model.create() and new Model().save()?

Both validate and save. `create()` is a shortcut that builds the document and saves it in one step, and it can take an array. `new Model(data)` gives you a document first, so you can change it before calling `save()`.

### Does unique: true validate the data?

No. It creates a unique index in MongoDB. A duplicate fails with a duplicate-key error (code `11000`) from MongoDB, not a Mongoose ValidationError. Make sure the index is actually built, especially if data already existed.

### How do you handle a validation error in an Express API?

Catch `err.name === 'ValidationError'` in your error middleware. Return `400` (or `422`) with the message for each field from `err.errors`. See [error-handling middleware](topic:express/error-middleware).

### How do you use Mongoose with TypeScript?

Define an interface for the document and pass it to the schema: `new Schema<ICandidate>({...})`. Then `model<ICandidate>('Candidate', schema)`. Mongoose can also infer types from the schema.

## ✅ Quick check

### 1. Which collection does `mongoose.model('JobPost', schema)` use by default?

:::answer
**`jobposts`**. Mongoose lowercases and pluralises the model name.
:::

### 2. The schema says `experience: { type: Number, min: 0 }`. You save `experience: -1`. What happens?

- A) MongoDB saves it anyway
- B) Mongoose throws a ValidationError and nothing is saved
- C) Mongoose changes it to 0

:::answer
**B.** Mongoose validates before saving. `min: 0` fails, so you get a ValidationError and the document is not written.
:::

### 3. Where should `mongoose.connect()` be called in an Express app?

:::answer
**Once, when the app starts** (before `app.listen`). Mongoose then shares one connection pool across all requests. Never connect inside a route handler.
:::
