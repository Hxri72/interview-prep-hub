---
title: Mongoose middleware (pre/post hooks)
stack: mongodb
order: 14
level: Intermediate
mustKnow: false
askedFrequency: common
summary:
  - Middleware (hooks) are functions Mongoose runs automatically before (pre) or after (post) an action like save or find.
  - "Document hooks (save, validate, deleteOne) get the document as this. Query hooks (find, updateOne, findOneAndUpdate) get the query as this."
  - "Classic use: hash a password in pre('save'), but only if this.isModified('password')."
  - updateOne() and findByIdAndUpdate() do NOT run save hooks. This is a common, silent bug.
  - Use normal function, not arrow functions, so that this works. Async functions are fine.
cards:
  - q: What are Mongoose pre and post hooks?
    a: Functions that run automatically before (pre) or after (post) an operation such as save, validate, find or updateOne.
  - q: Why does a password-hashing pre('save') hook not run on updateOne?
    a: updateOne is a query, so only query middleware runs. Document 'save' hooks run only on save() and create().
  - q: What is this inside a document hook vs a query hook?
    a: In document hooks (save, validate) this is the document. In query hooks (find, updateOne) this is the Query object.
  - q: Why not use an arrow function for a hook?
    a: Arrow functions don't get their own this, so you can't reach the document or query.
  - q: Why check this.isModified('password') before hashing?
    a: Otherwise every save (even changing the name) would hash the already-hashed password again, and login would break.
---

## 💡 What is it?

**Mongoose middleware**, also called **hooks**, are functions that run **automatically** around an action.

A **pre** hook runs **before** the action, like before saving. A **post** hook runs **after** it.

You write the hook once on the [schema](glossary:schema). Then it runs every time, without you calling it. This is the same idea as Express [middleware](glossary:middleware), but for database actions.

## 🏠 Real-life example

Think of the **school exam paper process**.

- **Before** the answer sheets are stored, a teacher seals each sheet and removes the student's name. That's a **pre hook**.
- **After** the sheets are stored, the office sends a message: "Papers received". That's a **post hook**.
- Nobody has to remember these steps. They happen for **every** sheet, every time.
- But if someone **slips a sheet straight into the cupboard**, skipping the counter, no seal is put on it. That's like `updateOne()` skipping the save hooks.

Now map it:
- **Storing the sheet** = `save()`.
- **Sealing before storing** = `pre('save')`, like hashing a password.
- **The "received" message** = `post('save')`, like logging or sending an event.
- **Slipping it into the cupboard directly** = `updateOne()`, which skips save hooks.

## 🧑‍💻 Code example

You need MongoDB running locally (or a free Atlas cluster). Run `npm init -y` and `npm install mongoose bcrypt`. Save this as `hooks.js` and run `node hooks.js`. (CommonJS style.)

```js
const mongoose = require('mongoose');                                   // load Mongoose
const bcrypt = require('bcrypt');                                       // library to hash passwords

const recruiterSchema = new mongoose.Schema({                           // a recruiter who logs in
  name: String,                                                         // display name
  email: { type: String, unique: true },                                // login email
  password: String,                                                     // will be stored HASHED, never plain
});                                                                     // end of schema

recruiterSchema.pre('save', async function () {                         // runs BEFORE every save(); normal function so "this" works
  if (!this.isModified('password')) return;                             // password didn't change → don't hash it again
  this.password = await bcrypt.hash(this.password, 10);                 // replace plain text with a hash; 10 = cost (slowness) level
});                                                                     // end of pre hook

recruiterSchema.post('save', function (doc) {                           // runs AFTER every successful save
  console.log('saved:', doc.email);                                     // e.g. write a log or send an event
});                                                                     // end of post hook

const Recruiter = mongoose.model('Recruiter', recruiterSchema);         // the model

async function main() {                                                 // async so we can use await
  await mongoose.connect('mongodb://127.0.0.1:27017/hiring_hooks');     // connect to a test database
  await Recruiter.deleteMany({});                                       // start clean

  const r = await Recruiter.create({ name: 'Priya', email: 'priya@co.com', password: 'secret123' }); // create runs save hooks
  console.log('hashed?', r.password.startsWith('$2b$'));                // bcrypt hashes start with $2b$
  const firstHash = r.password;                                         // remember the hash

  r.name = 'Priya K';                                                   // change only the name
  await r.save();                                                       // save again → pre hook runs, but skips hashing
  console.log('hash unchanged?', r.password === firstHash);             // true: we didn't double-hash

  await Recruiter.updateOne({ _id: r._id }, { password: 'plain999' });  // a QUERY: save hooks do NOT run
  const after = await Recruiter.findById(r._id);                        // read it back
  console.log('stored as:', after.password);                            // plain text! a silent security bug

  await mongoose.disconnect();                                          // close the connection
}                                                                       // end of main

main();                                                                 // run it
```

**Output:**

```text
saved: priya@co.com
hashed? true
saved: priya@co.com
hash unchanged? true
stored as: plain999
```

The last line shows the trap: `updateOne` skipped the hashing hook.

## 🔍 Deeper version

**Four kinds of middleware:**

| Kind | Runs for | `this` is |
|---|---|---|
| Document | `save`, `validate`, `deleteOne` / `updateOne` called on a document | the document |
| Query | `find`, `findOne`, `countDocuments`, `updateOne`, `updateMany`, `findOneAndUpdate`, `deleteOne`, `deleteMany`… | the Query |
| Aggregate | `aggregate` | the Aggregate object |
| Model | `insertMany`, `bulkWrite` | the Model |

`create()` calls `save()`, so save hooks run for it. `insertMany()` does **not** run save hooks; it runs its own model middleware.

**Order of events for `save()`:** `pre('validate')` → validation → `post('validate')` → `pre('save')` → the write → `post('save')`.

**Async hooks.** You can write `async function () { … }` and Mongoose waits for it. Throwing an error inside a pre hook **stops** the action, and the error reaches your `await`. Older code calls `next()` or `next(err)` instead.

**Query middleware ideas:**

```js
candidateSchema.pre(/^find/, function () {         // a regex: runs before find, findOne, findOneAndUpdate…
  this.where({ deletedAt: null });                  // "this" is the query: hide soft-deleted candidates
});                                                 // end of hook

candidateSchema.pre('findOneAndUpdate', function () { // before this update query
  this.set({ updatedBy: 'system' });                   // add a field to every update
});                                                    // end of hook
```

In query hooks you **don't have the document**. You can read the filter with `this.getFilter()` and the update with `this.getUpdate()`.

**Handling password updates properly.** Either always change passwords with `doc.password = …; await doc.save()`, or add a `pre('findOneAndUpdate')` hook that hashes `this.getUpdate().password`. Many teams keep one service function, `changePassword()`, that does it the safe way.

**`post` error handlers.** A `post('save', function (err, doc, next) { … })` with **three** arguments runs only when there was an error. It's a nice place to turn a duplicate-key error (code 11000) into a friendly message.

**Don't hide too much.** Hooks are invisible when you read a route. If a hook sends emails or calls other services, a simple `save()` becomes slow and surprising. Keep hooks for data rules (hashing, normalising, timestamps), and put business actions in services.

## 🎯 Why do we use it?

- **Rules that must always happen** live in one place. No route can forget to hash a password.
- **Cleaner services.** Normalising data (like making emails lowercase), setting `updatedBy` or filtering soft-deleted rows doesn't repeat in every function.
- **Side tasks after writes**, like logging or emitting an [event](glossary:event), stay out of the main code.

## ⚠️ Common mistakes

- **Expecting save hooks on `updateOne` / `findByIdAndUpdate`.** They don't run, and passwords end up in plain text.
- **Arrow functions** in hooks: `this` is not the document, so `this.isModified` crashes.
- **Hashing on every save** without `isModified('password')`, which double-hashes and breaks login.
- **Heavy work in hooks**, like calling slow APIs, which makes every save slow and hard to debug.

## 🗣️ How to answer in an interview

> "Mongoose middleware are hooks that run before or after an operation. Document middleware like pre save gets the document as this. Query middleware like pre find or pre findOneAndUpdate gets the query object, so it can change the filter or the update.
>
> The classic example is hashing a password in pre save with bcrypt. I check this.isModified('password') first, so I don't hash it twice. I use a normal function, not an arrow function, so this works.
>
> The big gotcha is that updateOne and findByIdAndUpdate are queries, so save hooks don't run. If someone updates a password that way, it's stored in plain text. So I either always change passwords through save, or add a findOneAndUpdate hook. I keep hooks for data rules and put real business actions in services, so nothing surprising hides in a save call."

[FILL IN: a real hook you wrote or used in SkillKeepr's models (for example bcrypt hashing or timestamps). Only add it if it's true.]

## 🔁 Follow-up questions

### How do you stop a save from a pre hook?

Throw an error inside the async hook (or call `next(err)` in older style). The save is cancelled, and the error is rejected to the code that called `save()`.

### Does `insertMany()` run `pre('save')`?

No. It runs `insertMany` model middleware instead. Validation still runs by default, but save hooks don't. If you rely on save hooks, use `create()`.

### How would you implement soft delete with middleware?

Add a `deletedAt` field. Add a `pre(/^find/)` query hook that adds `{ deletedAt: null }` to every find. Then "deleting" becomes `updateOne({ _id }, { deletedAt: new Date() })`. Remember aggregations need their own `$match`, or a `pre('aggregate')` hook.

### What is `this.getUpdate()`?

In query middleware for updates, it returns the update object, like `{ $set: { status: 'shortlisted' } }`. You can read or change it before the query runs.

## ✅ Quick check

### 1. Which of these runs the `pre('save')` hook?

- A) `Recruiter.create({...})`
- B) `Recruiter.updateOne({ _id }, {...})`
- C) `Recruiter.findByIdAndUpdate(id, {...})`

:::answer
**A.** `create()` calls `save()`. B and C are queries, so only query middleware runs.
:::

### 2. What's wrong with this hook?

```js
schema.pre('save', async () => {                                   // arrow function
  this.email = this.email.toLowerCase();                           // tries to use "this"
});
```

:::answer
It's an **arrow function**, so `this` is not the document. Use `async function () { … }`.
:::

### 3. A recruiter changes only their name and saves. Without the `isModified('password')` check, what happens?

:::answer
The hook hashes the **already hashed** password again. The stored hash no longer matches the real password, so the recruiter can't log in.
:::
