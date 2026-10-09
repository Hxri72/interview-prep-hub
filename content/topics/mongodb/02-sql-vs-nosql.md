---
title: "SQL vs NoSQL: when to choose MongoDB"
stack: mongodb
order: 2
level: Basic
mustKnow: true
askedFrequency: very common
summary:
  - SQL databases (PostgreSQL, MySQL) store data in tables with a fixed schema and use JOINs to connect tables.
  - NoSQL databases like MongoDB store flexible documents. Data that is read together is often stored together.
  - Pick SQL for strong relations, complex joins and strict rules, like payments and accounting.
  - Pick MongoDB for flexible, nested data that changes often and is read as one object, like candidate profiles.
  - Both support indexes and transactions today. The real question is "how is my data shaped and how is it read?"
cards:
  - q: What is the main difference between SQL and NoSQL databases?
    a: SQL stores rows in tables with a fixed schema and links tables with JOINs. NoSQL (like MongoDB) stores flexible documents, often with related data nested inside.
  - q: When would you choose MongoDB?
    a: When data is flexible or nested, changes often, and is usually read as one whole object — like profiles, catalogs or content.
  - q: When would you choose PostgreSQL?
    a: When data is highly relational, needs many joins, strict constraints and multi-row transactions — like billing, accounting or inventory.
  - q: Does MongoDB support transactions?
    a: Yes. Single-document writes are always atomic, and multi-document ACID transactions have been supported since MongoDB 4.0 (on replica sets).
  - q: What is "vertical vs horizontal scaling" in this comparison?
    a: Vertical = a bigger machine. Horizontal = more machines. MongoDB has built-in sharding for horizontal scaling; SQL databases traditionally scale up first.
---

## 💡 What is it?

There are two big families of [databases](glossary:database).

- **SQL databases** (also called relational databases), like PostgreSQL and MySQL. They store data in **tables** with rows and columns. Every row in a table has the same columns.
- **NoSQL databases**, like MongoDB. MongoDB stores data as flexible **[documents](glossary:document)** (JSON-like objects).

This topic is about **how to choose** between them. Interviewers love this question.

## 🏠 Real-life example

Think of two ways to keep your **school records**.

**Way 1 — the SQL way: a register with fixed columns.**
The teacher has one register for names, another for marks, and another for fees. Every page has the same printed columns. To see one student's full report, you look in all three registers and match the roll number. That matching is a **JOIN**.

**Way 2 — the MongoDB way: one file per student.**
Each student has their own file. The name, marks, fees and sports medals are all inside it. To see one student's report, you pick up one file. If one student has an extra certificate, you just add a page.

- **Registers with fixed columns** = SQL tables with a fixed schema.
- **Matching the roll number across registers** = a JOIN.
- **One file per student** = one MongoDB document.
- **Adding an extra page** = adding a new field, with no change to the others.

Neither way is "better". Registers are great for checking totals across the whole school. Files are great for seeing one student quickly.

## 🧑‍💻 Code example

The same "candidate with skills" data, stored both ways. Read the comments; you don't need a database to understand this one. (You can paste the JavaScript part into `compare.js` and run `node compare.js`.)

```sql
-- SQL: data is split into two tables, linked by candidate_id
CREATE TABLE candidates (id SERIAL PRIMARY KEY, name TEXT NOT NULL);  -- one row per candidate
CREATE TABLE skills (candidate_id INT REFERENCES candidates(id), skill TEXT); -- one row per skill, pointing to its candidate

-- to read one candidate WITH skills, we JOIN the two tables
SELECT c.name, s.skill FROM candidates c JOIN skills s ON s.candidate_id = c.id WHERE c.id = 1; -- match rows on the id
```

```js
// MongoDB: the same data as ONE document — skills live inside it
const candidate = {                         // one candidate document
  _id: 1,                                   // unique id (MongoDB usually makes an ObjectId)
  name: 'Asha',                             // a simple field
  skills: ['Node.js', 'React', 'MongoDB'],  // an array inside the document — no second table needed
};                                          // end of the document

console.log(candidate.name, 'knows', candidate.skills.length, 'skills'); // one read gives everything
```

**Output:**

```text
Asha knows 3 skills
```

**What to notice:** SQL needs two tables and a JOIN. MongoDB keeps the skills inside the candidate, so one read is enough.

## 🔍 Deeper version

**Side-by-side comparison:**

| | SQL (PostgreSQL, MySQL) | MongoDB |
|---|---|---|
| Data model | tables, rows, columns | collections, documents, fields |
| Schema | fixed; changing it needs a migration | flexible; add rules with validation or Mongoose |
| Relations | foreign keys + JOINs | embed related data, or reference + `$lookup` |
| Query language | SQL | JSON-like filters + aggregation pipeline |
| Transactions | multi-row ACID, very mature | single-document writes are atomic; multi-document ACID since 4.0 |
| Scaling | usually scale **up** first (bigger machine); read replicas | built-in **sharding** to scale **out** (more machines) |

**ACID**, in simple words: a [transaction](glossary:transaction) is "all or nothing" (Atomicity), keeps the data valid (Consistency), doesn't mix with other running transactions (Isolation) and survives a crash once saved (Durability).

**Myths to avoid in interviews:**
- *"MongoDB has no transactions."* False. It has supported multi-document ACID transactions since version 4.0.
- *"SQL can't store JSON."* False. PostgreSQL has a strong `JSONB` type.
- *"NoSQL is always faster."* It depends on your queries and indexes. A badly designed MongoDB collection can be slower than a good SQL table.

**How to decide — ask these questions:**
1. **How is the data read?** Mostly "give me one whole profile"? Documents fit well. Mostly "totals across many tables"? SQL fits well.
2. **How strong are the relations?** Many-to-many everywhere, with strict rules? Prefer SQL.
3. **How often does the shape change?** Often, with optional fields? Documents are easier.
4. **How important are strict constraints?** Money, stock levels, ledgers? SQL is the safer default.

**Many real systems use both.** For example, MongoDB for flexible profiles, and PostgreSQL for billing records. This is called *polyglot persistence* (using more than one kind of database).

## 🎯 Why do we use it?

Picking the right database early saves months of pain later.

- With the **wrong** choice, you fight the tool. You write many joins in MongoDB, or many table migrations in SQL for data that keeps changing.
- With the **right** choice, common reads are simple and fast, and the data stays correct.

Being able to explain **the trade-off** shows an interviewer you think about design, not just syntax.

## ⚠️ Common mistakes

- **Saying one is "better".** Interviewers want trade-offs, not fan opinions.
- **Using MongoDB like SQL.** Many tiny collections and `$lookup` everywhere. Then you get the costs of both and the benefits of neither.
- **Saying MongoDB has no schema or no transactions.** Both statements are outdated.
- **Ignoring how the data is read.** Design comes from the queries, not only from how the data "looks".

## 🗣️ How to answer in an interview

> "SQL databases store data in tables with a fixed schema and connect them with joins. They're great when the data is very relational and needs strict constraints and multi-row transactions, like billing or accounting.
>
> MongoDB stores flexible JSON-like documents. Data that's read together can be stored together, so a candidate profile with skills and education can be one document and one read. It's easy to change the shape, and it scales out with sharding.
>
> Both have indexes and ACID transactions today, so I decide based on how the data is shaped and how it's read. For a hiring platform with flexible candidate profiles, MongoDB fits well. For payments or ledgers, I'd lean towards PostgreSQL. Many systems use both."

[FILL IN: why MongoDB was chosen for SkillKeepr, and where (if anywhere) PostgreSQL is used there. Your resume lists both — say only what is true.]

## 🔁 Follow-up questions

### Can MongoDB do joins?

Yes, with the `$lookup` stage in the aggregation pipeline, and Mongoose offers `populate`. But if you need joins in almost every query, your design or your database choice may be wrong. See [$lookup and $unwind](topic:mongodb/lookup-unwind).

### Is MongoDB ACID compliant?

Yes. A write to a single document is always atomic. Since MongoDB 4.0, you can also run multi-document ACID transactions on a replica set. They cost more, so use them only when you really need "all or nothing" across documents.

### What is the CAP theorem, in simple words?

When the network between servers breaks, a distributed database must choose: stay **C**onsistent (refuse some requests) or stay **A**vailable (answer, maybe with old data). **P** is that network break (partition). MongoDB with default settings leans towards consistency, because writes go to the primary server.

### Can PostgreSQL store JSON like MongoDB?

Yes, with the `JSONB` column type, and you can index it. It's a good choice when you mostly need relational data with a few flexible parts.

## ✅ Quick check

### 1. A banking app must move money between two accounts with strict rules and many related tables. Which is the safer default?

- A) MongoDB
- B) PostgreSQL

:::answer
**B) PostgreSQL.** Strong relations, strict constraints and mature multi-row transactions make SQL the safer default for money. (MongoDB *can* do transactions, but this data is very relational.)
:::

### 2. True or false: MongoDB does not support transactions.

:::answer
**False.** Single-document writes are atomic, and multi-document ACID transactions are supported since MongoDB 4.0.
:::

### 3. In MongoDB, what usually replaces a SQL JOIN for data that is always read together?

:::answer
**Embedding.** You store the related data inside the same document, like a candidate's skills array, so one read gets everything.
:::
