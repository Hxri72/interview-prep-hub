---
title: CRUD operations
stack: mongodb
order: 4
level: Basic
mustKnow: true
askedFrequency: very common
summary:
  - CRUD means Create, Read, Update, Delete — the four basic things you do with data.
  - "Create: insertOne / insertMany. Read: find / findOne. Update: updateOne / updateMany / replaceOne. Delete: deleteOne / deleteMany."
  - "A filter like { name: 'Asha' } picks which documents to read, update or delete. An empty filter {} means ALL documents."
  - Updates use operators like $set. Without them, replaceOne swaps the whole document.
  - Check the result (matchedCount, modifiedCount, deletedCount) to know what really happened.
cards:
  - q: What does CRUD stand for, and the MongoDB methods for each?
    a: "Create (insertOne/insertMany), Read (find/findOne), Update (updateOne/updateMany/replaceOne), Delete (deleteOne/deleteMany)."
  - q: What is the difference between updateOne and replaceOne?
    a: updateOne changes only the fields you name with operators like $set. replaceOne swaps the whole document (except _id) with a new one.
  - q: What happens if you call deleteMany({})?
    a: It deletes EVERY document in the collection, because {} matches all documents. Be very careful.
  - q: What does find() return in the Node driver?
    a: A cursor — a pointer to the results. You read it with .toArray(), a for await loop, or by chaining sort/limit first.
  - q: What is an upsert?
    a: "Update if a match exists, otherwise insert a new document. Pass { upsert: true } to updateOne."
---

## 💡 What is it?

**CRUD** is short for the four basic jobs every app does with data:

- **C**reate — add new data.
- **R**ead — get data back.
- **U**pdate — change data.
- **D**elete — remove data.

In MongoDB, each job has its own methods. Most of them take a **filter**. A filter is an object that says *which* [documents](glossary:document) you mean, like `{ name: 'Asha' }`.

## 🏠 Real-life example

Think of a **class contact list in your phone**.

- You **add** a new friend's number. → Create
- You **search** for "Asha" and look at her number. → Read
- Asha gets a new number, so you **edit** her contact. → Update
- Someone leaves the class, so you **delete** the contact. → Delete

The name you type in the search box is the **filter**. If you search for nothing and press "select all", you get everyone. That is what an empty filter `{}` does. So be careful when you press "delete all"!

## 🧑‍💻 Code example

**Setup:** MongoDB running locally, or a free MongoDB Atlas cluster (set `MONGODB_URI`). Run `npm init -y` and `npm install mongodb`. Save as `crud.js`. It uses CommonJS. Run with `node crud.js`.

```js
const { MongoClient } = require('mongodb');                       // the official MongoDB driver
const client = new MongoClient(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017'); // connect to local MongoDB by default

async function main() {                                           // async, because every database call takes time
  await client.connect();                                         // open the connection
  const jobs = client.db('hiring').collection('jobs');            // the "jobs" collection in the "hiring" database
  await jobs.deleteMany({});                                      // clean start: {} matches ALL documents (demo only!)

  // CREATE
  await jobs.insertMany([                                         // add three job documents
    { title: 'Node.js Developer', city: 'Kochi', openings: 2 },   // job 1
    { title: 'React Developer', city: 'Kochi', openings: 1 },     // job 2
    { title: 'Java Developer', city: 'Pune', openings: 3 },       // job 3
  ]);                                                             // end of insertMany

  // READ
  const kochiJobs = await jobs.find({ city: 'Kochi' }).toArray(); // filter: only jobs where city is 'Kochi'
  console.log('Kochi jobs:', kochiJobs.length);                   // 2
  const one = await jobs.findOne({ title: 'Java Developer' });    // findOne gives the first match, or null
  console.log('Found:', one.city);                                // Pune

  // UPDATE
  const upd = await jobs.updateOne(                               // change ONE matching document
    { title: 'React Developer' },                                 // filter: which document
    { $set: { openings: 4 } },                                    // $set = change only this field
  );                                                              // end of updateOne
  console.log('Updated:', upd.matchedCount, upd.modifiedCount);   // 1 matched, 1 changed

  // DELETE
  const del = await jobs.deleteOne({ city: 'Pune' });             // remove ONE job in Pune
  console.log('Deleted:', del.deletedCount);                      // 1
  console.log('Left:', await jobs.countDocuments());              // countDocuments({}) counts what's left → 2

  await client.close();                                           // close the connection
}                                                                 // end of main

main().catch(console.error);                                      // run, and print any error
```

**Output:**

```text
Kochi jobs: 2
Found: Pune
Updated: 1 1
Deleted: 1
Left: 2
```

## 🔍 Deeper version

**All the main methods:**

| Job | Methods | Notes |
|---|---|---|
| Create | `insertOne(doc)`, `insertMany(docs)` | `_id` is added if missing |
| Read | `find(filter)`, `findOne(filter)`, `countDocuments(filter)` | `find` returns a **cursor** |
| Update | `updateOne`, `updateMany`, `replaceOne` | use [update operators](topic:mongodb/update-operators) like `$set` |
| Delete | `deleteOne`, `deleteMany` | `{}` deletes everything |
| Read + change | `findOneAndUpdate`, `findOneAndDelete`, `findOneAndReplace` | returns the document too |

**`find` returns a cursor.** A cursor is a pointer to the results, not the results themselves. MongoDB sends the documents in batches as you read. You can:
- call `.toArray()` for small results,
- loop with `for await (const doc of cursor)` for big results, to save memory,
- chain `.sort()`, `.limit()` and `.project()` before reading. See [projection, sort and limit](topic:mongodb/projection-sort-limit).

**Read the result object.** Write methods tell you what happened:
- `updateOne` → `matchedCount` (how many matched) and `modifiedCount` (how many really changed). If the new value equals the old one, `modifiedCount` is 0.
- `deleteOne` → `deletedCount`.
- `insertOne` → `insertedId`.

If `matchedCount` is 0, the record wasn't found. In an API, that usually means a **404**.

**updateOne vs replaceOne:**
- `updateOne(filter, { $set: { openings: 4 } })` changes only `openings`.
- `replaceOne(filter, { title: 'X' })` swaps the **whole** document. All other fields are gone (except `_id`).
- In the driver, passing a plain object without operators to `updateOne` throws an error. This protects you from wiping a document by mistake.

**Upsert** = update, or insert if nothing matches:

```js
await jobs.updateOne(                         // update...
  { title: 'Go Developer' },                  // ...the job with this title
  { $set: { city: 'Remote', openings: 1 } },  // set these fields
  { upsert: true },                           // if no job matches, insert a new one instead
);                                            // end of updateOne
```

This is very useful when syncing data from another system. For example, save a candidate from an external ATS keyed by its external id, without creating duplicates.

**Atomic per document.** One write to one document is atomic. Either the whole change happens, or none of it. Changes across many documents need a [transaction](topic:mongodb/transactions).

:::version[Version note]
In **MongoDB Node driver 6+**, `findOneAndUpdate` returns the **document itself** by default. Older versions returned `{ value: doc, ok: 1 }`, so old code reads `result.value`. Also, the shell commands `insert`, `update` and `remove` are old. Use `insertOne`, `updateOne`, `deleteOne` and friends.
:::

## 🎯 Why do we use it?

CRUD is the base of almost every feature. A recruiter creates a job, candidates read it, the recruiter edits it, and later it gets closed or deleted.

Knowing the exact methods and their results helps you:
- return the right status codes (201 for created, 404 for not found),
- avoid silent bugs (an update that matched nothing),
- avoid disasters (an empty filter on `deleteMany`).

## ⚠️ Common mistakes

- **An empty or wrong filter on `updateMany`/`deleteMany`.** `{}` matches every document. Double-check filters, especially when they come from user input.
- **Using `replaceOne` (or Mongoose `findOneAndReplace`) when you meant to change one field.** All the other fields disappear.
- **Calling `.toArray()` on huge results.** It loads everything into memory. Use `limit` and pagination, or stream with `for await`.
- **Ignoring the result.** Not checking `matchedCount` means "not found" looks like success.

## 🗣️ How to answer in an interview

> "CRUD is create, read, update and delete. In MongoDB, I create with insertOne or insertMany, read with find or findOne, update with updateOne, updateMany or replaceOne, and delete with deleteOne or deleteMany. Each takes a filter that picks the documents.
>
> For updates I use operators like $set, so only the named fields change. replaceOne swaps the whole document. find returns a cursor, so for big results I add limits and pagination instead of loading everything with toArray.
>
> I always check the result, like matchedCount or deletedCount, so I can return a 404 when nothing matched. And I use upsert when syncing data from other systems, so I don't create duplicates."

[FILL IN: a real example of upsert or bulk updates at SkillKeepr, for example in the Workable candidate sync — only if that is how it was built.]

## 🔁 Follow-up questions

### What is the difference between find and findOne?

`find` returns a cursor over **all** matching documents. `findOne` returns just the **first** matching document, or `null` if none match.

### What is the difference between updateOne and updateMany?

`updateOne` changes only the first document that matches. `updateMany` changes **all** matching documents. Both need update operators like `$set`.

### How do you do many different writes in one round trip?

Use `bulkWrite([...])`. It takes a list of insert, update and delete operations and sends them together. It's much faster for big imports and syncs.

### Is a single update atomic?

Yes. A write to one document is always atomic, even if it changes many fields. Changes across several documents need a transaction.

## ✅ Quick check

### 1. What does this print if no job has the title "PHP Developer"?

```js
const r = await jobs.updateOne(                      // try to update
  { title: 'PHP Developer' },                         // filter that matches nothing
  { $set: { openings: 5 } },                          // the change
);                                                    // end of updateOne
console.log(r.matchedCount, r.modifiedCount);         // ?
```

:::answer
**`0 0`.** Nothing matched, so nothing changed. No error is thrown. Your API should check this and return 404.
:::

### 2. Which call removes ALL documents in the collection?

- A) `deleteOne({})`
- B) `deleteMany({})`
- C) `deleteMany({ all: true })`

:::answer
**B.** An empty filter `{}` matches every document, and `deleteMany` removes all matches. (A removes only one. C only matches documents that have a field `all: true`.)
:::

### 3. A document is `{ _id: 1, title: 'Dev', city: 'Kochi' }`. You run `replaceOne({ _id: 1 }, { title: 'Senior Dev' })`. What does the document look like now?

:::answer
**`{ _id: 1, title: 'Senior Dev' }`.** replaceOne swaps the whole document, so `city` is gone. To change only the title, use `updateOne` with `$set`.
:::
