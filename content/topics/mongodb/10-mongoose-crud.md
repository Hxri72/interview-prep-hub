---
title: Mongoose CRUD methods
stack: mongodb
order: 10
level: Basic
mustKnow: false
askedFrequency: very common
summary:
  - "Create: Model.create() or new Model() + save(). Read: find(), findOne(), findById(), countDocuments(), exists()."
  - "Update: updateOne(), updateMany(), findByIdAndUpdate() (pass { returnDocument: 'after' } to get the changed document back)."
  - "Delete: deleteOne(), deleteMany(), findByIdAndDelete()."
  - save() runs validation and document hooks. updateOne() is faster but skips them unless you ask.
  - Since Mongoose 7, all methods return promises. Callbacks are gone, so use async/await.
cards:
  - q: Name the main Mongoose methods for each CRUD action.
    a: "Create: create / save. Read: find, findOne, findById. Update: updateOne, updateMany, findByIdAndUpdate. Delete: deleteOne, deleteMany, findByIdAndDelete."
  - q: What does findByIdAndUpdate return by default?
    a: "The document as it was BEFORE the update. Pass { returnDocument: 'after' } to get the updated one. (Older code uses { new: true }.)"
  - q: What do find() and findOne() return when nothing matches?
    a: find() returns an empty array []. findOne() and findById() return null.
  - q: save() vs updateOne() — what's the difference?
    a: save() loads the whole document, runs validation and save hooks, then writes. updateOne() sends one update to the database, which is faster, but skips validation and save hooks by default.
  - q: Do Mongoose methods still accept callbacks?
    a: No. Callbacks were removed in Mongoose 7. Every method returns a promise, so you use await or .then().
---

## 💡 What is it?

**CRUD** means the four basic things you do with data: **C**reate, **R**ead, **U**pdate and **D**elete.

A Mongoose **model** gives you ready-made methods for all four. A model is a class made from a [schema](glossary:schema). Each model works with one [collection](glossary:collection).

Every method returns a [promise](glossary:promise), so you use `await`.

## 🏠 Real-life example

Think of the **school library register**.

- **Create:** a new book arrives. The librarian writes a new line in the register.
- **Read:** a student asks, "Do you have this book?" The librarian searches the register.
- **Update:** a student borrows a book. The librarian changes "in shelf" to "borrowed".
- **Delete:** a book is lost for good. The librarian strikes out its line.

Now map it:
- The **register** = a collection, like `candidates`.
- **One line** = one [document](glossary:document).
- **The librarian** = the Mongoose model, like `Candidate`.
- **Writing, searching, changing, striking out** = `create`, `find`, `updateOne`, `deleteOne`.

## 🧑‍💻 Code example

You need MongoDB running locally (or a free Atlas cluster and its connection string). Run `npm init -y` and `npm install mongoose`. Save this as `crud.js` and run `node crud.js`. (CommonJS style.)

```js
const mongoose = require('mongoose');                                    // load Mongoose

const Candidate = mongoose.model('Candidate', new mongoose.Schema({      // a model for the "candidates" collection
  name: String,                                                          // the candidate's name
  status: { type: String, default: 'applied' },                          // starts as 'applied'
  experienceYears: Number,                                               // years of work
}));                                                                     // end of model

async function main() {                                                  // async so we can use await
  await mongoose.connect('mongodb://127.0.0.1:27017/hiring_crud');       // connect to a test database
  await Candidate.deleteMany({});                                        // empty the collection so every run starts clean

  // CREATE
  const asha = await Candidate.create({ name: 'Asha', experienceYears: 3 });  // add one candidate
  await Candidate.insertMany([{ name: 'Ravi', experienceYears: 1 }, { name: 'Meera', experienceYears: 5 }]); // add two at once

  // READ
  const all = await Candidate.find();                                    // every candidate → an array
  console.log('count:', all.length);                                     // how many we have
  const senior = await Candidate.find({ experienceYears: { $gte: 3 } }); // only 3 or more years
  console.log('senior:', senior.map((c) => c.name));                     // just their names
  const one = await Candidate.findById(asha._id);                        // find by the unique _id
  console.log('found:', one.name);                                       // Asha
  console.log('missing:', await Candidate.findOne({ name: 'Nobody' }));  // no match → null

  // UPDATE
  const updated = await Candidate.findByIdAndUpdate(                     // find by id and change it
    asha._id,                                                            // which document
    { status: 'shortlisted' },                                           // what to change
    { returnDocument: 'after' },                                         // give back the NEW version (after the update)
  );                                                                     // end of update
  console.log('status:', updated.status);                               // shortlisted
  const res = await Candidate.updateMany({ experienceYears: { $lt: 2 } }, { status: 'rejected' }); // change many
  console.log('modified:', res.modifiedCount);                           // how many changed

  // DELETE
  const del = await Candidate.deleteOne({ name: 'Ravi' });               // remove one candidate
  console.log('deleted:', del.deletedCount);                             // 1
  console.log('left:', await Candidate.countDocuments());                // how many are left

  await mongoose.disconnect();                                           // close the connection
}                                                                        // end of main

main();                                                                  // run it
```

**Output:**

```text
count: 3
senior: [ 'Asha', 'Meera' ]
found: Asha
missing: null
status: shortlisted
modified: 1
deleted: 1
left: 2
```

## 🔍 Deeper version

**The full method map:**

| Action | Methods | Returns |
|---|---|---|
| Create | `create(obj or array)`, `new Model(obj).save()`, `insertMany(array)` | the saved document(s) |
| Read | `find(filter)`, `findOne(filter)`, `findById(id)` | array / document or `null` |
| Count | `countDocuments(filter)`, `estimatedDocumentCount()`, `exists(filter)` | number / `{ _id }` or `null` |
| Update | `updateOne`, `updateMany`, `replaceOne` | `{ matchedCount, modifiedCount }` |
| Update + get doc | `findOneAndUpdate`, `findByIdAndUpdate` | document (old by default) |
| Delete | `deleteOne`, `deleteMany` | `{ deletedCount }` |
| Delete + get doc | `findOneAndDelete`, `findByIdAndDelete` | the deleted document |

**Queries are lazy.** `Candidate.find(...)` builds a **Query** object. Nothing is sent to MongoDB until you `await` it (or call `.exec()`). That's why you can chain: `Candidate.find(filter).sort({ createdAt: -1 }).limit(10).select('name')`. Using `.exec()` gives a better stack trace when something fails.

**Update operators.** In Mongoose, `{ status: 'shortlisted' }` is turned into `{ $set: { status: 'shortlisted' } }` for you. So other fields stay safe. You can also use operators like `$inc`, `$push` and `$pull` directly (see [update operators](topic:mongodb/update-operators)).

**`save()` vs `updateOne()`:**

| | `doc.save()` | `Model.updateOne()` |
|---|---|---|
| Round trips | read first, then write | one write |
| Validation | always | only with `runValidators: true` |
| `pre('save')` hooks | yes | no (query hooks run instead) |
| Race safety | can overwrite a change made in between | atomic single update |

Use `save()` when you need hooks (like hashing a password). Use `updateOne()` for fast, simple changes.

**Getting the new document back.** `findOneAndUpdate` returns the **old** document by default. Pass `{ returnDocument: 'after' }`. Older code uses `{ new: true }`, which Mongoose 9 still accepts but marks as deprecated (it prints a warning). Add `{ upsert: true }` to create the document if none matches.

**Bad ids.** `findById('abc')` throws a **CastError**, because `'abc'` is not a valid ObjectId. Check ids first with `mongoose.isValidObjectId(id)`, or catch the error and return 400.

**Multi-tenant safety.** In a [multi-tenant](glossary:multi-tenant) app, never call `findById(id)` alone. Use `findOne({ _id: id, tenantId })`. Then one company can never read another company's candidate by guessing an id (see [multi-tenant design](topic:mongodb/multi-tenant-design)).

:::version[Version note]
**Mongoose 7** removed callbacks from all methods, and removed old methods like `remove()`. Use `deleteOne()` and `await`. Old tutorials that show `Model.find({}, function (err, docs) {...})` no longer work. **Mongoose 9** prefers `{ returnDocument: 'after' }` over the older `{ new: true }` option, which now prints a deprecation warning.
:::

## 🎯 Why do we use it?

- **No raw driver code.** The methods are short and clear, and they use your schema.
- **Casting and defaults for free.** Strings become numbers, ids become ObjectIds, defaults are filled.
- **Chaining.** You build a query step by step: filter, sort, limit, select.
- **Every backend route maps to one of these.** `POST /candidates` → `create`. `GET /candidates/:id` → `findOne`. `PATCH` → `updateOne`. `DELETE` → `deleteOne`.

## ⚠️ Common mistakes

- **Forgetting `{ returnDocument: 'after' }`** and sending the old document back to the frontend.
- **Not checking for `null`.** `findById` returns `null` when nothing matches. Return 404 instead of crashing on `doc.name`.
- **Using `updateOne` and expecting `pre('save')` hooks to run.** They don't. Hashing a password there will silently not happen.
- **Forgetting `await`.** You get a Query object instead of data, and the request never really runs.

## 🗣️ How to answer in an interview

> "Mongoose models give me methods for all four CRUD actions. For create I use create or insertMany. For reads, find returns an array, and findOne or findById return a document or null. For updates I use updateOne or updateMany, or findByIdAndUpdate with new true when I need the changed document back. For deletes, deleteOne and deleteMany.
>
> Queries are lazy. They only run when I await them, so I can chain sort, limit and select first. Since Mongoose 7 there are no callbacks, everything is promise-based.
>
> The main trade-off is save versus updateOne. save runs validation and save hooks but needs a read first. updateOne is a single atomic write, but it skips validation unless I pass runValidators, and it doesn't run save hooks. And in a multi-tenant app I always include tenantId in the filter, not just the id."

[FILL IN: one real CRUD route from SkillKeepr, like updating a candidate's status. Only add it if it's true.]

## 🔁 Follow-up questions

### What does `upsert` mean?

"Update or insert". With `{ upsert: true }`, if no document matches the filter, MongoDB creates a new one from the filter and the update. It's useful for syncing data from another system, keyed by an external id.

### `countDocuments()` vs `estimatedDocumentCount()`?

`countDocuments(filter)` really counts the matching documents, so it's exact but can be slow on big collections. `estimatedDocumentCount()` reads the collection's stored count. It's very fast, but it ignores filters and may be slightly off.

### How do you delete safely in production?

Many apps use **soft delete**: set `deletedAt: new Date()` instead of removing the document. Then reads filter out deleted ones. This keeps history and lets you undo mistakes. Hard-delete only when the law or the user requires it.

### What does `exists()` return?

`{ _id: ... }` if a match is found, or `null` if not. It's a cheap "is it there?" check, because it only fetches the `_id`.

## ✅ Quick check

### 1. What does this print if no candidate is named "Zoya"?

```js
console.log(await Candidate.find({ name: 'Zoya' }));    // find() with no match
```

:::answer
**`[]`**, an empty array. `find()` always returns an array. `findOne()` would return `null`.
:::

### 2. What is `doc.status` after this runs? (It was `'applied'` before.)

```js
const doc = await Candidate.findByIdAndUpdate(id, { status: 'shortlisted' }); // no options
```

- A) `'shortlisted'`
- B) `'applied'`

:::answer
**B) `'applied'`.** Without `{ returnDocument: 'after' }`, you get the document as it was **before** the update. The database has the new value.
:::

### 3. A `pre('save')` hook hashes passwords. Does `User.updateOne({ _id }, { password: 'new123' })` hash it?

:::answer
**No.** `updateOne` doesn't run save hooks, so the plain password is stored. Load the user, set the password, and call `save()`.
:::
