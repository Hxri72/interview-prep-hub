---
title: "What MongoDB is: documents and collections"
stack: mongodb
order: 1
level: Basic
mustKnow: true
askedFrequency: very common
summary:
  - MongoDB is a NoSQL database. It stores data as documents, which look like JSON objects.
  - "Documents live in collections (like a table), and collections live in a database. Database → collection → document."
  - Documents in one collection don't need the same fields. This makes it easy to change the shape of your data.
  - Every document has a unique _id. MongoDB adds one for you if you don't.
  - It fits apps with flexible, nested data and fast changes, like a hiring platform's candidate profiles.
cards:
  - q: What is MongoDB, in one sentence?
    a: A NoSQL database that stores data as JSON-like documents, grouped into collections, instead of rows in tables.
  - q: What are a document and a collection?
    a: A document is one record, like one candidate, stored as a JSON-like object. A collection is a group of similar documents, like all candidates.
  - q: Do all documents in a collection need the same fields?
    a: No. MongoDB is schema-flexible. But in real apps we usually add rules with Mongoose or schema validation so the data stays clean.
  - q: How does SQL's table, row and column map to MongoDB?
    a: Table → collection, row → document, column → field. A JOIN is usually replaced by embedding data or by $lookup.
  - q: What is stored in every MongoDB document?
    a: An _id field. It is unique inside the collection. If you don't give one, MongoDB creates an ObjectId.
---

## 💡 What is it?

**MongoDB** is a [database](glossary:database). A database is a program that saves data safely, so you can find it again later.

MongoDB is a **NoSQL** database. It does not use tables with rows. It stores each record as a **[document](glossary:document)**. A document looks just like a JavaScript object (JSON).

Similar documents are kept together in a **[collection](glossary:collection)**. Many collections make one database.

## 🏠 Real-life example

Think of a **school office with files and folders**.

- The **office cupboard** is the database.
- Each **folder** in the cupboard is a collection: "Students", "Teachers", "Fees".
- Each **student's form** inside the folder is a document.
- The lines on the form, like "Name" and "Class", are **fields**.

Now, one student's form has an extra page for "Sports medals". Another student has no medals, so no extra page. That's fine! The folder still holds both forms. MongoDB works the same way. Documents in one collection can have different fields.

And every form has a unique **admission number**. In MongoDB, that is the `_id`.

## 🧑‍💻 Code example

**Setup:** you need MongoDB running. Either install MongoDB Community on your computer, or create a free cluster on MongoDB Atlas and copy its connection string. Then run `npm init -y` and `npm install mongodb`. Save this as `hello-mongo.js`. It uses CommonJS. Run it with `node hello-mongo.js`.

```js
const { MongoClient } = require('mongodb');                    // load the official MongoDB driver for Node

const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017'; // where MongoDB runs; 27017 is the default port
const client = new MongoClient(uri);                           // a client = our connection to the server

async function main() {                                        // async, because talking to the database takes time
  await client.connect();                                      // open the connection
  const db = client.db('hiring');                              // pick the "hiring" database (made on first write)
  const candidates = db.collection('candidates');              // pick the "candidates" collection (also made on first write)

  await candidates.deleteMany({});                             // empty the collection, so the demo starts clean each run
  await candidates.insertMany([                                // save two documents at once
    { name: 'Asha', skills: ['Node.js', 'React'], experience: 3 },        // a candidate with 3 fields
    { name: 'Ravi', skills: ['Java'], experience: 5, city: 'Kochi' },    // this one has an EXTRA field: city
  ]);                                                          // end of the list of documents

  const all = await candidates.find({}).toArray();             // {} = no filter → get every document
  console.log(all.length, 'candidates found');                 // how many documents we got back
  console.log(all[1].name, 'lives in', all[1].city);           // read fields like a normal JS object
  console.log(typeof all[0]._id, all[0]._id.constructor.name); // MongoDB added an _id of type ObjectId by itself

  await client.close();                                        // close the connection when we're done
}                                                              // end of main

main().catch(console.error);                                   // run main and print any error
```

**Output:**

```text
2 candidates found
Ravi lives in Kochi
object ObjectId
```

**What to notice:**
- We never created the database or the collection. MongoDB made them on the first insert.
- Asha has no `city`, but Ravi does. Both live happily in one collection.
- We never set `_id`. MongoDB added it.

## 🔍 Deeper version

**The words, side by side with SQL:**

| SQL (e.g. PostgreSQL) | MongoDB |
|---|---|
| database | database |
| table | collection |
| row | document |
| column | field |
| primary key | `_id` |
| JOIN | embed the data, or use `$lookup` |

**Documents are stored as BSON.** On the wire and on disk, MongoDB doesn't store plain text JSON. It uses **BSON** ("binary JSON"). BSON is faster to read and has more types, like dates and `ObjectId`. See [BSON, _id and ObjectId](topic:mongodb/bson-objectid).

**Nested data is normal.** A document can hold arrays and objects inside it. One candidate can carry a list of skills and a list of past jobs. You can often read everything you need in **one read**, with no join.

**Size limit.** One document can be at most **16 MB**. That's huge for normal data. But it means you should not keep growing one array forever (for example, every application ever made, inside a job document).

**"Schema-less" really means "schema-flexible".** The database doesn't force a shape by default. But your app still has a shape in mind. Most teams add rules:
- in the app, with [Mongoose](topic:mongodb/mongoose-basics) schemas, or
- in the database, with `$jsonSchema` validation.

**How you talk to it from Node:**
- The **official driver** (`mongodb` package). It's close to the database, like the example above.
- **Mongoose**. It's an [ODM](glossary:odm) built on top of the driver. It adds schemas, validation and helpers. Most Express projects use it.

**Other features you will meet later:** [indexes](topic:mongodb/indexes) for fast search, the [aggregation pipeline](topic:mongodb/aggregation-basics) for reports, [transactions](topic:mongodb/transactions), replica sets for safety and sharding for very big data.

## 🎯 Why do we use it?

- **The data looks like your code.** A candidate document looks like the JavaScript object you use in Node and React. You don't convert rows into objects all the time.
- **Easy to change.** Product wants a new "LinkedIn URL" field? Just start saving it. No big table migration first.
- **Nested data in one read.** A profile with skills, education and past jobs can live in one document.
- **Scales out.** MongoDB is built to spread data across many machines when it gets very big.

That's why MongoDB fits the MERN stack (MongoDB, Express, React, Node) so well.

## ⚠️ Common mistakes

- **Thinking "flexible" means "no rules".** Without validation, you get messy data. For example, `experience: "3"` in one document and `experience: 3` in another.
- **Designing it like SQL tables.** Splitting everything into many small collections and joining them all the time. In MongoDB, store together what you read together.
- **Arrays that grow forever.** Pushing every application into one job document. It gets slow and can hit the 16 MB limit.
- **Forgetting indexes.** Without them, MongoDB checks every document for each search. It's fast with 100 documents and very slow with 1 million.

## 🗣️ How to answer in an interview

> "MongoDB is a NoSQL document database. Instead of tables and rows, it stores data as JSON-like documents, which are saved as BSON. Similar documents go into a collection, and collections live in a database. So table maps to collection, row to document, and column to field.
>
> Every document has a unique _id, and MongoDB creates an ObjectId if I don't give one. Documents can hold nested objects and arrays, so related data that's read together can live in one document, without joins.
>
> It's schema-flexible, which makes changes easy. But in real projects I still define a schema with Mongoose, add validation and add indexes for the main queries. I've written complex queries and aggregation pipelines over multi-tenant candidate and recruiter data, and used indexing to keep response times stable as the data grew."

[FILL IN: one or two lines on what the main SkillKeepr collections are (for example candidates, jobs, recruiters) and how big they are, only if you know it.]

## 🔁 Follow-up questions

### Why is MongoDB called "NoSQL"?

It doesn't use the table-and-row model or SQL as its main language. It stores documents and you query it with JSON-like filters, like `{ experience: { $gte: 3 } }`. "NoSQL" is best read as "not only SQL".

### Is MongoDB really schema-less?

The database doesn't force a shape by default, so it's better called "schema-flexible". In practice, we add a schema with Mongoose or with `$jsonSchema` validation in MongoDB, so the data stays consistent.

### What is the maximum size of a document?

16 MB. If data can grow without limit, like all applications for a job, keep it in its own collection and store a reference instead.

### When would you NOT pick MongoDB?

When the data is very relational and needs many joins and strict rules across tables. A classic case is accounting or banking ledgers. A relational database like PostgreSQL is often a better fit there. See [SQL vs NoSQL](topic:mongodb/sql-vs-nosql).

### What is the difference between the MongoDB driver and Mongoose?

The driver is the official, low-level library to talk to MongoDB. Mongoose sits on top of it and adds schemas, validation, middleware (hooks) and handy helpers like `populate`.

## ✅ Quick check

### 1. Match the words: a SQL **table** is a MongoDB ____, and a SQL **row** is a MongoDB ____.

:::answer
**Collection** and **document**. (A column is a **field**.)
:::

### 2. You insert `{ name: 'Asha' }` without an `_id`. What happens?

- A) MongoDB throws an error
- B) MongoDB adds a unique `_id` (an ObjectId) for you
- C) The document is saved with no `_id`

:::answer
**B.** Every document must have an `_id`. If you don't give one, MongoDB creates an ObjectId automatically.
:::

### 3. True or false: two documents in the same collection can have different fields.

:::answer
**True.** MongoDB is schema-flexible. But in real apps we usually add a schema (Mongoose) so the data stays clean.
:::
