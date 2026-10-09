---
title: What a relational database is
stack: postgresql
order: 1
level: Basic
mustKnow: true
askedFrequency: very common
summary:
  - A relational database stores data in tables made of rows and columns, like many connected spreadsheets.
  - Each kind of thing gets its own table (candidates, jobs, applications). Tables link to each other through id columns.
  - You ask questions in SQL, and JOIN follows the links between tables.
  - The database enforces rules for you — types, required fields, unique values and valid links.
  - "PostgreSQL is a popular free relational database. Pick it when data is connected and correctness matters (billing, orders)."
cards:
  - q: What is a relational database?
    a: A database that stores data in tables (rows and columns) and connects tables through key columns. You query it with SQL.
  - q: Why split data into several tables instead of one big table?
    a: So each fact is stored once. A candidate's name lives in one row; applications only point to it by id. Change it once and every link sees the new value.
  - q: What is the "relation" in relational?
    a: In database theory, a relation is a table. People also use it loosely for the links between tables, made with primary and foreign keys.
  - q: How is PostgreSQL different from MongoDB, in one line?
    a: PostgreSQL stores fixed-shape rows in linked tables and joins them; MongoDB stores flexible JSON-like documents, often with related data nested inside.
  - q: What is SQL?
    a: Structured Query Language — the standard language for creating tables, adding data and asking questions of a relational database.
---

## 💡 What is it?

A **relational database** stores data in **tables**. A table has **rows** (one per item) and **columns** (one per detail).

Each kind of thing gets its own table: one for candidates, one for jobs, one for applications. Tables are **linked** by id numbers.

You talk to it with [SQL](glossary:sql), a language for asking questions. **PostgreSQL** (often called "Postgres") is a very popular, free relational database.

## 🏠 Real-life example

Think of your **school office**.

The office keeps three registers:
- a **student register**: roll number, name, class
- a **subject register**: subject code, subject name
- a **marks register**: roll number, subject code, marks

The marks register does not write the student's full name again. It only writes the **roll number**. To find "Asha's maths marks", the clerk looks up Asha's roll number, then finds that number in the marks register.

- Each **register** = a table.
- Each **line** in a register = a row.
- Each **heading** (name, class) = a column.
- The **roll number** = the key that links the registers.
- The **clerk looking across registers** = a JOIN in SQL.

If Asha's name is spelled wrong, the clerk fixes it **once**, in the student register. Every marks line still points to the right student.

## 🧑‍💻 Code example

Save this as `relational.sql`. Run it with `psql -d postgres -f relational.sql`.

No PostgreSQL installed? Start one with Docker: `docker run --name pg -e POSTGRES_PASSWORD=pw -d postgres:18`, then run `docker exec -i pg psql -U postgres < relational.sql`.

```sql
CREATE TABLE candidates (                         -- table 1: one row per candidate
  id   serial PRIMARY KEY,                        -- id = 1, 2, 3… made automatically; it identifies the row
  name text NOT NULL,                             -- the name; NOT NULL = it must be filled in
  city text                                       -- the city; may be empty
);                                                -- end of the candidates table
CREATE TABLE jobs (                               -- table 2: one row per job
  id    serial PRIMARY KEY,                       -- the job's own id
  title text NOT NULL                             -- the job title
);                                                -- end of the jobs table
CREATE TABLE applications (                       -- table 3: who applied to which job
  id           serial PRIMARY KEY,                -- the application's own id
  candidate_id int REFERENCES candidates(id),     -- points to a row in candidates (the link)
  job_id       int REFERENCES jobs(id),           -- points to a row in jobs (the link)
  status       text                               -- applied / shortlisted / rejected
);                                                -- end of the applications table

INSERT INTO candidates (name, city) VALUES ('Asha', 'Kochi'), ('Ravi', 'Chennai');  -- Asha gets id 1, Ravi gets id 2
INSERT INTO jobs (title) VALUES ('Node.js Developer'), ('React Developer');        -- job ids 1 and 2
INSERT INTO applications (candidate_id, job_id, status) VALUES                     -- three applications:
  (1, 1, 'applied'),                              -- Asha → Node.js Developer
  (1, 2, 'shortlisted'),                          -- Asha → React Developer
  (2, 1, 'applied');                              -- Ravi → Node.js Developer

SELECT c.name, j.title, a.status                  -- the columns we want to see
FROM applications a                               -- start from applications ("a" is a short nickname)
JOIN candidates c ON c.id = a.candidate_id        -- follow the link to the candidate
JOIN jobs j ON j.id = a.job_id                    -- follow the link to the job
ORDER BY c.name, j.title;                         -- sort by name, then by title
```

**Output (what psql prints):**

```text
CREATE TABLE
CREATE TABLE
CREATE TABLE
INSERT 0 2
INSERT 0 2
INSERT 0 3
 name |       title       |   status
------+-------------------+-------------
 Asha | Node.js Developer | applied
 Asha | React Developer   | shortlisted
 Ravi | Node.js Developer | applied
(3 rows)
```

**What to notice:** the applications table holds only numbers (1, 2). The JOIN turns those numbers back into names and titles.

## 🔍 Deeper version

**The relational model.** Edgar Codd described it in 1970. Data lives in **relations** (tables) of **tuples** (rows) with **attributes** (columns). Every column has a **type**. Every row is identified by a **[primary key](glossary:primary-key)**.

**Keys link the tables.** A **[foreign key](glossary:foreign-key)** is a column that holds another table's primary key, like `applications.candidate_id`. The database checks it: you can't point to candidate 99 if candidate 99 doesn't exist. See [foreign keys and constraints](topic:postgresql/foreign-keys-constraints).

**Declarative queries.** In SQL you say **what** you want, not **how** to get it. The database's **query planner** picks the fastest way — which [index](glossary:index) to use, which table to read first. You can see its plan with [EXPLAIN](topic:postgresql/explain-analyze).

**ACID transactions.** A [transaction](glossary:transaction) groups changes so they all succeed or all fail. PostgreSQL gives full ACID guarantees by default. See [ACID and transactions](topic:postgresql/acid-transactions).

**Normalisation.** Storing each fact once (like the student's name in one register) is called normalisation. It avoids copies that drift apart. See [normalisation](topic:postgresql/normalization).

**Relational vs document databases:**

| | PostgreSQL (relational) | MongoDB (document) |
|---|---|---|
| Shape of data | fixed columns per table | flexible JSON-like documents |
| Related data | separate tables + JOIN | often nested inside one document |
| Rules | types, NOT NULL, UNIQUE, FK, CHECK — enforced by the DB | mostly in app code / schema validation |
| Multi-row transactions | always available | supported (replica set needed) |
| Good fit | billing, orders, reports with many joins | profiles, catalogs, nested changing data |

PostgreSQL can also store JSON with the `jsonb` type, so the line is blurry today. See [JSONB](topic:postgresql/jsonb) and [SQL vs NoSQL](topic:mongodb/sql-vs-nosql).

## 🎯 Why do we use it?

- **Correct data.** The database itself refuses bad data: wrong types, missing fields, duplicate emails, links to rows that don't exist.
- **No copies drifting apart.** Each fact is stored once and linked, so updates happen in one place.
- **Powerful questions.** SQL can join, group, filter and sum across tables in one query — great for reports.
- **Safe money and orders.** Transactions make sure "take payment + give access" happens fully or not at all.
- **Mature and free.** PostgreSQL is open source, fast and trusted by huge companies.

## ⚠️ Common mistakes

- **Putting everything in one giant table.** You then copy the same name into many rows, and the copies drift apart.
- **Storing lists in one text column**, like `skills = 'node,react'`. You can't search or link it properly. Use a separate table, or an array/JSONB column on purpose.
- **Skipping keys and constraints** "to go faster". Bad data sneaks in, and fixing it later is much harder.
- **Thinking SQL vs NoSQL is about "old vs new".** It's about the shape of your data and how you read it.

## 🗣️ How to answer in an interview

> "A relational database stores data in tables of rows and columns. Each kind of entity gets its own table — for example candidates, jobs and applications — and tables are linked through keys: a primary key identifies a row, and a foreign key in another table points to it. I query it with SQL, using JOINs to follow those links.
>
> The big benefits are data integrity and flexible querying. The database enforces types, NOT NULL, unique and foreign-key constraints, and it gives ACID transactions, so related changes succeed or fail together. That's why I'd pick PostgreSQL for things like billing or orders. For flexible, nested data that's read as one object, a document database like MongoDB can be simpler."

[FILL IN: where you used PostgreSQL — which project or service, and what it stored.]

## 🔁 Follow-up questions

### What is the difference between a database, a schema and a table?

A **database** is the whole container. Inside it, a **schema** is a folder that groups tables (PostgreSQL's default schema is `public`). A **table** holds the actual rows.

### Is PostgreSQL only for relational data?

No. It also has `jsonb` for JSON documents, arrays, full-text search, and extensions like `pgvector` for AI embeddings. But its core strength is relational data with strong rules.

### When would you choose MongoDB over PostgreSQL?

When data is naturally nested and read as one object, its shape changes often, and you rarely need joins across many collections. Candidate profiles with many optional sections are a good example.

### What does "declarative" mean for SQL?

You describe the result you want. The database decides how to get it — which index to use and in which order to read tables. You don't write the loops yourself.

## ✅ Quick check

### 1. In the example, why does `applications` store `candidate_id = 1` instead of the name "Asha"?

:::answer
So the name is stored **once**, in `candidates`. If Asha's name changes, you update one row, and every application still points to her through the id. A JOIN brings the name back when you need it.
:::

### 2. Which one is the best fit for PostgreSQL?

- A) Storing app logs as free-form text
- B) Billing: invoices, payments and customer accounts that must always match
- C) Caching session data for a few minutes

:::answer
**B.** Billing has strongly related data and needs transactions and constraints. Logs and short-lived cache data are better in other tools.
:::
