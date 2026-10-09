---
title: "Indexes: what they are and how they work"
stack: mongodb
order: 17
level: Intermediate
mustKnow: true
askedFrequency: very common
summary:
  - An index is a small, sorted list of one field's values, with a pointer to each document. It lets MongoDB jump to the right documents instead of reading all of them.
  - Without an index, MongoDB does a COLLSCAN (reads every document). With one, it does an IXSCAN (reads only the matching index entries).
  - MongoDB indexes are B-trees. They help with finding (filter), sorting and range queries like $gt and $lt.
  - Every collection has an index on _id automatically. You add others with createIndex or schema.index() in Mongoose.
  - Indexes are not free — they use memory and disk, and they make every insert and update a little slower.
cards:
  - q: What is an index in MongoDB?
    a: A sorted list of a field's values, each pointing to its document. MongoDB uses it to find matching documents without reading the whole collection.
  - q: What is a COLLSCAN?
    a: A collection scan — MongoDB reads every document to find matches. It's fine for tiny collections but very slow for big ones.
  - q: Which index does every collection already have?
    a: A unique index on _id. MongoDB creates it automatically, and you can't drop it.
  - q: How do you add an index in Mongoose?
    a: "In the schema: schema.index({ email: 1 }) or { email: { type: String, index: true } }. Mongoose builds it when the app starts (autoIndex), or you create it with a migration."
  - q: What is the cost of an index?
    a: Extra disk and memory, and slower writes — every insert, update and delete must also update each index.
---

## 💡 What is it?

An **[index](glossary:index)** is a small, sorted list that helps MongoDB find data fast.

It stores the values of one field (like `email`), in order. Each value points to the [document](glossary:document) it came from.

Without an index, MongoDB must read **every** document in the [collection](glossary:collection) to answer a [query](glossary:query). With an index, it jumps straight to the right ones.

## 🏠 Real-life example

Think of the **index at the back of your school textbook**.

You want to read about "photosynthesis". You could turn every page from page 1 to page 400. That's slow. Or you open the index at the back. It lists topics **in A–Z order**, with page numbers. You find "Photosynthesis — page 212" in seconds and go straight there.

- The **textbook pages** = the documents in the collection.
- **Turning every page** = a collection scan (COLLSCAN).
- The **index at the back** = a MongoDB index.
- **A–Z order** = the index is sorted, so it's quick to search.
- **"page 212"** = the pointer from the index to the document.

But the index costs something too. It adds extra pages to the book. And every time you add a new chapter, someone must update the index.

## 🧑‍💻 Code example

You need MongoDB. Either run it on your computer, or make a free cluster on MongoDB Atlas and copy its connection string. Make a folder, run `npm init -y` and `npm install mongoose`. Save this as `indexes.js` (CommonJS). Run it with `node indexes.js`. To use Atlas, run `MONGODB_URI="your-connection-string" node indexes.js`.

```js
const mongoose = require('mongoose');                                    // load Mongoose
const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/hiring'; // where MongoDB is; local by default

const Candidate = mongoose.model('Candidate', new mongoose.Schema({       // a model for the "candidates" collection
  name: String,                                                          // the candidate's name (text)
  email: String,                                                         // the candidate's email (text)
}));                                                                     // end of the model

async function main() {                                                  // all the steps, in order
  await mongoose.connect(uri);                                           // connect to the database
  await Candidate.collection.drop().catch(() => {});                     // delete old data AND old indexes; ignore "not found"
  const docs = [];                                                       // an empty list to fill with fake candidates
  for (let i = 0; i < 50000; i++) {                                      // make 50,000 candidates
    docs.push({ name: `Candidate ${i}`, email: `c${i}@mail.com` });      // each one gets a different email
  }                                                                      // end of the loop
  await Candidate.insertMany(docs);                                      // save all 50,000 at once

  const query = { email: 'c777@mail.com' };                              // the search: find one candidate by email
  const before = await Candidate.collection.find(query).explain('executionStats'); // run it and ask "how did you do it?"
  console.log('No index → docs read:', before.executionStats.totalDocsExamined); // how many documents MongoDB had to read

  await Candidate.collection.createIndex({ email: 1 });                 // build an index on email (1 = small-to-big order)

  const after = await Candidate.collection.find(query).explain('executionStats'); // the same search again
  console.log('With index → docs read:', after.executionStats.totalDocsExamined); // now MongoDB reads only the match
  await mongoose.disconnect();                                           // close the connection so the script can end
}                                                                        // end of main
main().catch(console.error);                                             // run main and print any error
```

**Output:**

```text
No index → docs read: 50000
With index → docs read: 1
```

Same answer, but MongoDB read **1** document instead of **50,000**.

## 🔍 Deeper version

**What an index really is.** MongoDB indexes are **B-trees**. A B-tree is a sorted tree structure. Finding a value takes a few small steps, not a full scan. The time grows very slowly as data grows (about `O(log n)`).

Each index entry holds:
- the field value (like `"c777@mail.com"`), and
- a pointer to the document on disk.

**The two plan stages you must know:**

| Stage | Meaning | Speed on a big collection |
|---|---|---|
| `COLLSCAN` | read every document | slow |
| `IXSCAN` | walk the index to find matching entries | fast |
| `FETCH` | load the full documents the index pointed to | usually follows IXSCAN |

You see these in [explain()](topic:mongodb/explain).

**What an index helps with:**
- **Equality**: `{ email: 'a@b.com' }`
- **Ranges**: `{ experience: { $gte: 3 } }`
- **Sorting**: `.sort({ createdAt: -1 })` can read the index in order, instead of sorting in memory.
- **Covered queries**: if the query and the returned fields are all in the index, MongoDB doesn't even need to open the documents.

**Direction (`1` vs `-1`).** `1` means ascending (small to big). `-1` means descending. For a **single-field** index, direction doesn't matter. MongoDB can read it both ways. It matters in [compound indexes](topic:mongodb/compound-indexes-esr) with more than one sort field.

**Creating indexes in Mongoose:**

```js
const schema = new mongoose.Schema({                          // the candidate schema
  email: { type: String, index: true },                       // shortcut: a single-field index on email
  tenantId: mongoose.Schema.Types.ObjectId,                    // which company owns this candidate
});                                                            // end of the schema
schema.index({ tenantId: 1, createdAt: -1 });                  // a compound index: company first, newest first
```

By default, Mongoose's `autoIndex` builds schema indexes when the app starts. On big production collections, many teams turn `autoIndex` off. They build indexes on purpose, with a migration script, at a quiet time.

**Index builds.** Since MongoDB 4.2, an index build only blocks the collection briefly at the start and the end. Reads and writes keep working during the build. But it still uses CPU and disk, so plan big builds.

**Memory.** Indexes work best when they fit in RAM. This "working set" (the data and indexes you use often) should fit in memory. If not, MongoDB keeps reading from disk, which is slow.

**The cost.** Every insert, update and delete must also update **every index** on that collection. More indexes = slower writes and more storage. See [the costs of indexes](topic:mongodb/index-costs).

## 🎯 Why do we use it?

When a collection is small, everything feels fast. Then it grows to a million documents. Now every search reads a million documents. Pages take seconds to load, and the database CPU goes to 100%.

An index fixes this. The search reads only the few entries it needs. Response time stays almost the same as data grows.

This is exactly the problem on a **[multi-tenant](glossary:multi-tenant)** hiring platform. Candidates and applications keep growing, but recruiters still expect their lists to load fast.

## ⚠️ Common mistakes

- **No index on fields you filter by often.** The app works in development with 100 documents, then times out in production.
- **Indexing every field "just in case".** Each index slows down writes and eats memory. Index what your real queries use.
- **Thinking `unique: true` in Mongoose is a validator.** It only creates a unique index. If the index wasn't built, duplicates still get in.
- **Not checking.** You add an index but never run `explain()`. The query may not even use it.

## 🗣️ How to answer in an interview

> "An index is a sorted data structure — a B-tree in MongoDB — that stores a field's values with pointers to the documents. Without one, MongoDB does a collection scan and reads every document. With one, it does an index scan and reads only the matching entries. That's the difference between reading a million documents and reading ten.
>
> Indexes help with equality filters, ranges and sorting. If the index also has every field the query returns, it can be a covered query. Every collection has a unique index on _id by default.
>
> But indexes aren't free. They take memory and disk, and every write must update every index. So I index the fields my real queries filter and sort on, and I check with explain that the query uses an IXSCAN and not a COLLSCAN. On a multi-tenant platform, these indexes usually start with tenantId."

[FILL IN: a real index you added on SkillKeepr candidate or recruiter data, and how you knew it helped. Only add it if it's true.]

## 🔁 Follow-up questions

### How do you know if a query is using an index?

Run it with `.explain('executionStats')`. Look for an `IXSCAN` stage instead of `COLLSCAN`. Then compare `totalDocsExamined` with `nReturned`. If MongoDB read 50,000 documents to return 10, the index is missing or wrong.

### Can MongoDB use an index for sorting?

Yes. If the sort fields match the index order, MongoDB reads the index already sorted. If not, it must load the results and sort them in memory. You see this as a `SORT` stage in explain. In-memory sorts are slow on large results and have a memory limit.

### Why not index every field?

Every index must be updated on every write. Ten indexes means each insert does about ten extra pieces of work. Indexes also use disk and RAM. Unused indexes are pure cost.

### What is a covered query?

A query where all filter fields and all returned fields are in the index. MongoDB answers it from the index alone, without opening any document. It's very fast. You usually need a projection that excludes `_id`, unless `_id` is in the index.

### Does creating an index lock the database?

Not for long. Since MongoDB 4.2, index builds hold a strong lock only at the very start and end. Reads and writes keep working in between. But the build uses CPU and disk, so big builds should run at a quiet time.

## ✅ Quick check

### 1. A collection has 2 million job applications and no indexes except `_id`. You run `find({ status: 'shortlisted' })`. What does MongoDB do?

:::answer
A **COLLSCAN**. It reads all 2 million documents to find the shortlisted ones, because there's no index on `status`.
:::

### 2. Which one is true about indexes?

- A) They make reads and writes faster.
- B) They make most reads faster but writes a little slower.
- C) They only help with sorting.

:::answer
**B.** Reads that use the index get faster. But every write must also update the index, so writes get a little slower.
:::

### 3. Which index does every MongoDB collection already have?

:::answer
A unique index on **`_id`**. MongoDB makes it automatically.
:::
