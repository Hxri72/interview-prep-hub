---
title: "ORMs: Prisma vs Sequelize vs raw SQL"
stack: postgresql
order: 19
level: Intermediate
mustKnow: false
askedFrequency: common
summary:
  - An ORM lets you work with database rows as JavaScript objects. It writes the SQL for you.
  - "Raw SQL (pg): full control and speed, but more typing and no types. ORMs: faster to write and type-safe, but they can hide slow queries."
  - "Prisma: a schema file + generated, fully typed client. Drizzle: tables defined in TypeScript, SQL-like API. Sequelize: older, model classes, v6 is the stable line."
  - Good ORMs still use parameterised queries, so they protect you from SQL injection.
  - Most teams mix both. Use the ORM for everyday CRUD, and raw SQL for complex reports.
cards:
  - q: What is an ORM?
    a: Object-Relational Mapper. A library that maps database tables to objects in your code, so you can query with methods instead of writing SQL by hand.
  - q: Give one advantage and one risk of an ORM.
    a: "Advantage: faster to write, type-safe, migrations built in. Risk: it can hide slow queries, like N+1 queries, and makes complex SQL harder."
  - q: How is Prisma different from Drizzle?
    a: "Prisma uses its own schema file and generates a typed client from it. Drizzle defines tables in TypeScript and its API looks like SQL, so you can predict the query."
  - q: Does an ORM protect against SQL injection?
    a: Yes, when you use its normal query methods, because it sends values as parameters. Raw-SQL escape hatches can still be unsafe if you build strings yourself.
  - q: When would you write raw SQL even if you use an ORM?
    a: For complex reports, window functions, CTEs, bulk updates, or when you need to tune one slow query exactly.
---

## 💡 What is it?

An **ORM** (Object-Relational Mapper) is a library that lets you use database rows as **JavaScript objects**.

Instead of writing `SELECT * FROM candidates WHERE id = $1`, you write something like `db.candidate.findUnique({ where: { id } })`. The ORM writes the SQL for you.

The three common choices in Node.js are **Prisma**, **Drizzle** and **Sequelize**. The other option is **raw SQL** with the `pg` package.

## 🏠 Real-life example

Think of **ordering food in a foreign country**.

- **Raw SQL** = you learn the language and speak to the cook yourself. You can ask for anything exactly, but you must know the words.
- **An ORM** = a **translator** at your side. You say "one dosa, no onions" in your language, and the translator tells the cook.
- **A good translator** (Drizzle) repeats almost word for word, so you know what the cook heard.
- **A smart translator** (Prisma) understands what you mean and can be very helpful. But sometimes you don't know exactly what they said.
- **Checking with the cook yourself** = reading the SQL the ORM generated. You should always be able to do this.

## 🧑‍💻 Code example

This compares **raw SQL** and an **ORM** (Drizzle) on the same table. Set up: `npm init -y`, `npm install pg drizzle-orm`. Create the table first in Postgres:
`CREATE TABLE candidates (id serial PRIMARY KEY, name text NOT NULL, email text NOT NULL UNIQUE, experience int NOT NULL DEFAULT 0);`
Save this as `orm.js`, then run `DATABASE_URL=postgres://user:pass@localhost:5432/hiring node orm.js`

```js
const { Pool } = require('pg');                                   // the plain driver
const { drizzle } = require('drizzle-orm/node-postgres');         // Drizzle's adapter for pg
const { pgTable, serial, text, integer } = require('drizzle-orm/pg-core'); // helpers to describe a table
const { gte } = require('drizzle-orm');                           // gte = greater than or equal

const pool = new Pool({ connectionString: process.env.DATABASE_URL }); // one shared pool

const candidates = pgTable('candidates', {                        // describe the existing table in code
  id: serial('id').primaryKey(),                                  // id column, auto number
  name: text('name').notNull(),                                   // name column, required
  email: text('email').notNull().unique(),                        // email column, unique
  experience: integer('experience').notNull().default(0),         // years of experience
});                                                               // end of the table description

async function main() {                                           // async so we can await
  // 1) RAW SQL with pg: you write the SQL yourself
  const raw = await pool.query(                                   // send hand-written SQL
    'INSERT INTO candidates (name, email, experience) VALUES ($1, $2, $3) RETURNING id, name', // plain SQL
    ['Meena', 'meena@example.com', 4],                            // values for $1, $2, $3
  );                                                              // end of query
  console.log('raw insert   :', raw.rows[0]);                     // { id, name }

  // 2) ORM-style with Drizzle: you write JavaScript, it writes the SQL
  const db = drizzle({ client: pool });                           // wrap the same pool
  const added = await db.insert(candidates)                       // INSERT INTO candidates
    .values({ name: 'Ravi', email: 'ravi@example.com', experience: 2 }) // the new row as an object
    .returning({ id: candidates.id, name: candidates.name });     // RETURNING id, name
  console.log('drizzle insert:', added[0]);                       // { id, name }

  const query = db.select({ name: candidates.name })              // SELECT name
    .from(candidates)                                             // FROM candidates
    .where(gte(candidates.experience, 3));                        // WHERE experience >= 3
  console.log('generated SQL :', query.toSQL());                  // see the SQL Drizzle wrote
  console.log('3+ years      :', await query);                    // run it

  await pool.end();                                               // close connections
}                                                                 // end of main

main();                                                           // run it
```

**Output** (real run: Node 24, pg 8.23, drizzle-orm 0.45.4, PostgreSQL 18.4):

```text
raw insert   : { id: 1, name: 'Meena' }
drizzle insert: { id: 2, name: 'Ravi' }
generated SQL : {
  sql: 'select "name" from "candidates" where "candidates"."experience" >= $1',
  params: [ 3 ]
}
3+ years      : [ { name: 'Meena' } ]
```

**What to notice:** Drizzle wrote a **parameterised** query (`$1` with `params: [3]`) by itself. `toSQL()` lets you see exactly what it will send.

## 🔍 Deeper version

**The same query in each tool** (find candidates with 3+ years):

| Tool | How it looks | Where the "shape" of the table lives |
|---|---|---|
| raw `pg` | `pool.query('SELECT name FROM candidates WHERE experience >= $1', [3])` | only in the database |
| **Prisma** | `prisma.candidate.findMany({ where: { experience: { gte: 3 } }, select: { name: true } })` | `schema.prisma` file → a generated client |
| **Drizzle** | `db.select({ name: candidates.name }).from(candidates).where(gte(candidates.experience, 3))` | TypeScript `pgTable(...)` definitions |
| **Sequelize** | `Candidate.findAll({ where: { experience: { [Op.gte]: 3 } }, attributes: ['name'] })` | model classes defined in JS |

**How they compare:**

| | raw SQL (pg) | Prisma | Drizzle | Sequelize |
|---|---|---|---|---|
| Type safety | none by default | very strong (generated) | strong (inferred from tables) | weaker |
| Learning curve | know SQL | learn its schema language | know SQL + its API | learn its API |
| Control over SQL | full | less | high (SQL-like) | medium |
| Migrations | separate tool | `prisma migrate` | `drizzle-kit` | `sequelize-cli` |
| Good for | complex reports, tuning | fast product work, big teams | TS teams who like SQL | older codebases |

Versions as of October 2026: Sequelize's stable line is **v6** (v7 is still alpha). Drizzle is in the **0.4x** series. Prisma is actively developed, so check its docs for the current major.

**The N+1 problem.** A classic ORM trap. You load 50 jobs, then loop and load each job's candidates. That is 1 + 50 queries. Fix: ask the ORM to **include** the relation in one query (Prisma `include`, Drizzle relational queries, Sequelize `include`), or write one JOIN. It is the same idea as `populate` vs `$lookup` in MongoDB. See [$lookup and populate](topic:mongodb/lookup-unwind).

**Escape hatches.** Every ORM lets you write raw SQL when needed (Prisma `$queryRaw`, Drizzle `sql` template, Sequelize `query`). Use their tagged-template forms, which still parameterise values. Never paste strings together.

**Transactions in ORMs.** Prisma: `prisma.$transaction(async (tx) => …)`. Drizzle: `db.transaction(async (tx) => …)`. Both use one connection and roll back if the function throws. The idea is the same as in [Using PostgreSQL from Node.js](topic:postgresql/node-pg).

## 🎯 Why do we use it?

- **Speed of development.** Simple CRUD becomes one line, with autocomplete.
- **Type safety.** With Prisma or Drizzle, TypeScript knows every column. Renaming a column shows errors everywhere it's used.
- **Migrations.** The ORM tracks schema changes as files you can review and commit.
- **Safety by default.** Values are always sent as parameters.

Raw SQL is still the best tool for complex reports, window functions and performance tuning. See [Window functions](topic:postgresql/window-functions).

## ⚠️ Common mistakes

- **Never looking at the generated SQL.** Turn on query logging in development and check for N+1 queries and missing indexes.
- **Loading whole rows when you need 2 columns.** Use `select` / `attributes`, just like `SELECT name` instead of `SELECT *`.
- **Using raw-SQL helpers with string concatenation.** That brings SQL injection back.
- **Mixing many migration tools.** Pick one way to change the schema, or the database and code drift apart.

## 🗣️ How to answer in an interview

> "An ORM maps tables to objects so I can query with methods instead of hand-written SQL. Prisma has its own schema file and generates a fully typed client. Drizzle defines tables in TypeScript and has a SQL-like API, so the query is predictable. Sequelize is the older option with model classes. Raw SQL with pg gives full control.
>
> My rule is: an ORM for everyday CRUD, because it's faster to write, type-safe and parameterises values for me, and raw SQL for complex reports or a query I need to tune. The main risk with ORMs is hidden performance problems like N+1 queries, so I always check the generated SQL and use includes or joins instead of querying inside loops."

[FILL IN: where you used PostgreSQL, and whether you used an ORM or raw SQL there.]

## 🔁 Follow-up questions

### What is the N+1 query problem?

You run 1 query to get a list, then 1 more query for each item. 50 items = 51 queries. Fix it by loading the related data in one query, with a JOIN or the ORM's `include`.

### Is an ORM slower than raw SQL?

There is a small overhead, but the real danger is **bad queries** the ORM writes for you, not the ORM itself. A well-written ORM query is usually fine.

### How do migrations work in Prisma?

You change `schema.prisma`, run `prisma migrate dev`, and Prisma writes a SQL migration file. In production, `prisma migrate deploy` applies pending migrations.

### Would you use an ORM with MongoDB too?

For MongoDB, Mongoose plays a similar role. It's called an ODM (Object Data Modeling), because MongoDB stores documents, not relational tables.

## ✅ Quick check

### 1. What does this Drizzle query send to Postgres?

```js
db.select({ name: candidates.name }).from(candidates).where(gte(candidates.experience, 3)); // a Drizzle query
```

:::answer
`select "name" from "candidates" where "candidates"."experience" >= $1` with `params: [3]`. Notice the value is a parameter, not pasted into the SQL.
:::

### 2. You load 100 jobs with an ORM, then call `job.getCandidates()` inside a loop. How many queries run?

- A) 1
- B) 2
- C) 101

:::answer
**C) 101.** That is the N+1 problem. Load the candidates together with the jobs in one query instead.
:::

### 3. True or false: once you use an ORM, you should never write raw SQL.

:::answer
**False.** Use raw SQL (safely parameterised) for complex reports, window functions and tuning slow queries.
:::
