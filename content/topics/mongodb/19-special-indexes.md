---
title: Unique, partial, TTL and text indexes
stack: mongodb
order: 19
level: Intermediate
mustKnow: false
askedFrequency: common
summary:
  - "A unique index stops duplicate values. On a multi-tenant app, make it unique per company, like { tenantId: 1, email: 1 }."
  - A partial index only includes documents that match a filter (for example, only active jobs). It is smaller, and it can make "unique" apply to only some documents.
  - A TTL index deletes documents automatically after a time, like expired login codes or old logs. A background job removes them about once a minute.
  - "A text index lets you search words inside text with $text. For serious search, teams often use Atlas Search instead."
  - In Mongoose, unique true is NOT a validator. It only creates a unique index, and a duplicate shows up as error code 11000.
cards:
  - q: What does a unique index do?
    a: It rejects any insert or update that would create a second document with the same value(s). MongoDB returns a duplicate key error (code 11000).
  - q: How do you make an email unique per company, not across all companies?
    a: "Use a compound unique index: { tenantId: 1, email: 1 }, { unique: true }. The same email can then exist once in each company."
  - q: What is a partial index?
    a: "An index that only includes documents matching a filter, set with partialFilterExpression. It's smaller, and queries must include the same filter to use it."
  - q: What is a TTL index?
    a: "An index on a date field with expireAfterSeconds. MongoDB's background job deletes each document once that much time has passed after its date."
  - q: Is TTL deletion exact to the second?
    a: No. The TTL job runs about every 60 seconds, so documents can live a little longer than the set time.
---

## 💡 What is it?

Normal [indexes](glossary:index) make searches fast. Some indexes also **add a rule**. MongoDB has a few special kinds:

- **Unique**: no two [documents](glossary:document) may have the same value.
- **Partial**: only documents that match a filter go into the index.
- **TTL** ("time to live"): documents are deleted automatically after some time.
- **Text**: lets you search for words inside long text.

## 🏠 Real-life example

Think of **rules in a school**.

- **Unique** = **roll numbers**. In one class, no two students can have roll number 15. But Class 9 and Class 10 can each have a roll number 15. That's "unique per class", like "unique email per company".
- **Partial** = **the sports team list**. It only includes students who joined a sport, not the whole school. It's a smaller list.
- **TTL** = **the notice board**. Each notice is removed after 7 days. The peon walks by once in a while and takes down old notices. They don't do it at the exact second.
- **Text** = **the library catalogue search**. You type "photosynthesis" and it finds books that contain that word.

## 🧑‍💻 Code example

You need MongoDB (local, or a free Atlas cluster). Make a folder, run `npm init -y` and `npm install mongoose`. Save this as `special.js` (CommonJS). Run it with `node special.js`, or `MONGODB_URI="your-connection-string" node special.js`.

```js
const mongoose = require('mongoose');                                        // load Mongoose
const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/hiring';   // where MongoDB is; local by default
const { ObjectId } = mongoose.Types;                                         // helper to make new ids

async function main() {                                                      // all the steps, in order
  await mongoose.connect(uri);                                               // connect to the database
  const db = mongoose.connection.db;                                         // the raw database object
  const candidates = db.collection('candidates');                            // the candidates collection
  const otps = db.collection('otps');                                        // one-time login codes
  const jobs = db.collection('jobs');                                        // job posts
  await Promise.all([candidates.drop(), otps.drop(), jobs.drop()].map((p) => p.catch(() => {}))); // start clean; ignore "not found"

  // 1) UNIQUE per company: the same email may exist once in EACH company
  await candidates.createIndex({ tenantId: 1, email: 1 }, { unique: true });  // tenantId + email together must be unique
  const companyA = new ObjectId(), companyB = new ObjectId();                // two different companies
  await candidates.insertOne({ tenantId: companyA, email: 'asha@mail.com' }); // OK: first Asha in company A
  await candidates.insertOne({ tenantId: companyB, email: 'asha@mail.com' }); // OK: same email, different company
  try {                                                                      // this one should fail
    await candidates.insertOne({ tenantId: companyA, email: 'asha@mail.com' }); // duplicate in company A
  } catch (err) {                                                            // MongoDB rejects it
    console.log('Duplicate blocked, error code:', err.code);                 // 11000 = duplicate key error
  }                                                                          // end of try/catch

  // 2) TTL: delete each code 300 seconds (5 minutes) after createdAt
  await otps.createIndex({ createdAt: 1 }, { expireAfterSeconds: 300 });     // TTL index on a Date field
  await otps.insertOne({ phone: '9999999999', code: '4821', createdAt: new Date() }); // this code disappears in about 5 minutes

  // 3) TEXT: search words inside the job title and description
  await jobs.createIndex({ title: 'text', description: 'text' });            // one text index over two fields
  await jobs.insertMany([                                                    // two sample jobs
    { title: 'Node.js Developer', description: 'Build REST APIs with Express' }, // job 1
    { title: 'Designer', description: 'Create UI mockups in Figma' },        // job 2
  ]);                                                                        // end of the list
  const found = await jobs.find({ $text: { $search: 'express' } }).toArray(); // find jobs that mention "express"
  console.log('Text search found:', found.map((j) => j.title));              // print only the titles

  await mongoose.disconnect();                                               // close the connection
}                                                                            // end of main
main().catch(console.error);                                                 // run main and print any error
```

**Output:**

```text
Duplicate blocked, error code: 11000
Text search found: [ 'Node.js Developer' ]
```

The OTP document is still there for now. MongoDB's background job deletes it about 5 minutes later.

## 🔍 Deeper version

**Unique indexes.**
- MongoDB rejects the write with **error code 11000** (`E11000 duplicate key error`). Your API should turn this into a clear **409 Conflict** message, like "This email already exists."
- In Mongoose, `email: { type: String, unique: true }` is **not a validator**. It only asks Mongoose to build a unique index. If the collection already has duplicates, the index build fails, and duplicates keep getting in. Check that the index really exists.
- A missing field counts as `null`. So a unique index on `phone` allows only **one** document without a phone. Use a partial index to fix this (below).
- **Multi-tenant tip:** make it `{ tenantId: 1, email: 1 }`. A global unique email would stop the same candidate from applying to two different companies.

**Partial indexes.**

```js
db.collection('jobs').createIndex(                              // an index on jobs
  { tenantId: 1, title: 1 },                                    // company + job title
  { unique: true, partialFilterExpression: { status: 'open' } } // unique ONLY among open jobs
);                                                              // closed jobs may reuse a title
```

- Only documents matching `partialFilterExpression` go into the index. So it's smaller and faster to update.
- A query can only use it if the query includes the same condition (here, `status: 'open'`).
- Use it for unique rules on optional fields, too: `{ partialFilterExpression: { phone: { $exists: true } } }`.
- You may see **sparse** indexes in old code. They skip documents that don't have the field. Partial indexes do the same job and more, so prefer them.

**TTL indexes.**
- Must be on a **Date** field (or an array of dates). Single-field only.
- A background task runs about **every 60 seconds**. It deletes documents where `date + expireAfterSeconds` is in the past. So deletion is not exact to the second.
- Good for: OTP codes, password-reset tokens, sessions, temporary uploads and old logs.
- To expire each document at its own time, store an `expiresAt` date and use `expireAfterSeconds: 0`.

**Text indexes.**
- Only **one** text index per collection, but it can cover several fields.
- Search with `{ $text: { $search: 'node express' } }`. You can sort by relevance with `{ score: { $meta: 'textScore' } }`.
- It handles word stems ("developers" also matches "developer") and ignores common words like "the".
- It's basic. It has no typo tolerance and no partial-word matching. For real search boxes, teams often use **MongoDB Atlas Search**. That's a full search engine built into Atlas.

## 🎯 Why do we use it?

- **Unique** keeps data correct at the database level. Your code may check "does this email exist?" first. But two requests at the same time can both pass that check. The unique index stops the second one.
- **Partial** keeps indexes small, and lets you apply a rule to only some documents.
- **TTL** removes temporary data without writing a cron job.
- **Text** gives you simple word search without another system.

## ⚠️ Common mistakes

- **Trusting Mongoose `unique: true` as validation.** It's an index, not a check. Handle error 11000.
- **A global unique email on a multi-tenant app.** One candidate can't then exist in two companies. Scope it with `tenantId`.
- **Expecting TTL to delete at the exact second.** It can be up to a minute (or more under load) late. Also check the expiry time in your code when it matters, like OTPs.
- **A partial index the query never uses**, because the query doesn't include the partial filter.

## 🗣️ How to answer in an interview

> "Besides normal indexes, MongoDB has a few special ones. A unique index rejects duplicates with error code 11000. On a multi-tenant system, I scope it, like tenantId plus email, so the same email can exist once per company. In Mongoose, unique true is not a validator, it only builds the index, so I handle the 11000 error and return a 409.
>
> A partial index only includes documents that match a filter. It's smaller, and it lets a unique rule apply only to, say, open jobs or documents that have a phone number. A TTL index deletes documents automatically after a time. It's good for OTPs, reset tokens and sessions. It runs about every minute, so it's not exact.
>
> A text index gives basic word search with $text. For a real search experience with typo tolerance, I'd use Atlas Search."

[FILL IN: any unique, TTL or partial index you actually used at SkillKeepr (e.g. for tokens or per-tenant uniqueness). Only add it if it's true.]

## 🔁 Follow-up questions

### How do you handle a duplicate key error in an Express API?

Catch the error in your error middleware. If `err.code === 11000`, send **409 Conflict** with a friendly message. `err.keyValue` tells you which field was duplicated.

### Why does my unique index fail to build?

The collection already has duplicate values. MongoDB can't build a unique index over existing duplicates. Find them with an aggregation (`$group` by the field, `count > 1`), clean them up, then build again.

### Can a TTL index be on a compound index?

No. TTL works only on a **single-field** index on a date field. For a compound need, keep a separate TTL index on the date field.

### Why use a partial index instead of a sparse index?

A sparse index can only say "skip documents without this field". A partial index can use any filter, like `{ status: 'open' }` or `{ deletedAt: null }`. MongoDB recommends partial indexes for new work.

## ✅ Quick check

### 1. A collection has a unique index on `{ tenantId: 1, email: 1 }`. Which insert fails?

- A) Same email, different `tenantId`
- B) Same email, same `tenantId`
- C) Different email, same `tenantId`

:::answer
**B.** Only the pair (tenantId + email) must be unique. A and C create new pairs.
:::

### 2. A TTL index has `expireAfterSeconds: 300`. A document's `createdAt` was 5 minutes and 10 seconds ago. Is it gone for sure?

:::answer
**Not for sure.** The TTL job runs about every 60 seconds, so the document can stay a little longer. It will be removed on the next run.
:::

### 3. True or false: `unique: true` in a Mongoose schema checks for duplicates before saving, like `required: true`.

:::answer
**False.** It only creates a unique index in MongoDB. The database blocks the duplicate and returns error 11000. Mongoose doesn't check it as a validator.
:::
