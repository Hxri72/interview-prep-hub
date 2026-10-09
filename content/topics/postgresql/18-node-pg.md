---
title: Using PostgreSQL from Node.js (pg, parameterised queries)
stack: postgresql
order: 18
level: Intermediate
mustKnow: true
askedFrequency: very common
summary:
  - The pg package lets Node.js talk to PostgreSQL. A Pool keeps a few connections open and reuses them.
  - "Always use placeholders ($1, $2) and pass values in an array. Never glue user input into the SQL string. This stops SQL injection."
  - "pool.query() is fine for one statement. For a transaction, borrow one client with pool.connect()."
  - "Transaction pattern: BEGIN → work → COMMIT; on error ROLLBACK; in finally client.release()."
  - Call pool.end() when a script finishes, or Node keeps waiting on the open connections.
cards:
  - q: Why use a Pool instead of a new connection for every request?
    a: Opening a Postgres connection is slow and uses server memory. A Pool keeps a few connections open (10 by default in pg) and lends them out again and again.
  - q: How do you pass user input safely to a query in pg?
    a: "Use placeholders like $1, $2 in the SQL and pass the values as an array: pool.query('SELECT * FROM users WHERE email = $1', [email])."
  - q: Why can't you run a transaction with pool.query()?
    a: Each pool.query() call may use a different connection. BEGIN, the inserts and COMMIT must all run on the same connection, so you borrow one with pool.connect().
  - q: What must always happen in the finally block of a pg transaction?
    a: client.release(), so the connection goes back to the pool. Otherwise the pool slowly runs out of connections.
  - q: What does RETURNING do?
    a: It makes INSERT, UPDATE or DELETE send back columns of the changed rows, like the new id, without a second query.
---

## 💡 What is it?

**`pg`** (also called *node-postgres*) is the most common [package](glossary:package) for talking to PostgreSQL from Node.js.

You create a **Pool**. A pool is a small group of open connections that your app shares. You send SQL with `pool.query()`.

You never put user input directly into the SQL text. You use **placeholders** like `$1` and pass the values separately. This is called a **parameterised query**.

## 🏠 Real-life example

Think of a **school library with a few reading cards**.

Getting a new library card made takes a long time. So the school keeps **5 cards at the desk**. A student borrows one, reads, and gives it back. The next student uses the same card.

- The **library** = the PostgreSQL database.
- A **reading card** = one database connection.
- The **desk with 5 cards** = the Pool.
- **Borrowing and returning a card** = `pool.connect()` and `client.release()`.
- The **request slip** you fill in = the SQL. You write the book name in a **box on the slip**, not in your own words. That box is the `$1` placeholder. The librarian treats whatever is in the box as just a book name, never as an instruction.

## 🧑‍💻 Code example

Set up: `npm init -y`, then `npm install pg`. Save this as `app.js`. Run it with your connection string:
`DATABASE_URL=postgres://user:pass@localhost:5432/hiring node app.js`

```js
const { Pool } = require('pg');                                  // the Pool class from the pg package
const pool = new Pool({ connectionString: process.env.DATABASE_URL }); // a pool = a few reusable connections

async function main() {                                          // async so we can use await
  await pool.query(                                              // create the table (SQL on the next lines)
    `CREATE TABLE IF NOT EXISTS candidates (                     -- make the table if it is missing
      id    serial PRIMARY KEY,                                  -- 1, 2, 3... made by Postgres
      name  text NOT NULL,                                       -- the candidate's name
      email text NOT NULL UNIQUE                                 -- no two candidates share an email
    )`);                                                         // end of CREATE TABLE

  const added = await pool.query(                                // insert one candidate
    'INSERT INTO candidates (name, email) VALUES ($1, $2) RETURNING id, name', // $1, $2 = placeholders
    ['Meena', 'meena@example.com'],                              // the values, sent separately from the SQL
  );                                                             // end of the insert
  console.log('added:', added.rows[0]);                          // rows = the returned rows

  const evil = "x' OR '1'='1";                                   // a classic SQL-injection attempt
  const found = await pool.query('SELECT * FROM candidates WHERE email = $1', [evil]); // treated as plain text
  console.log('rows for evil input:', found.rowCount);           // 0: nobody has that exact email

  const client = await pool.connect();                           // borrow ONE connection for the transaction
  try {                                                          // try the transaction
    await client.query('BEGIN');                                 // start: all or nothing
    await client.query('INSERT INTO candidates (name, email) VALUES ($1, $2)', ['Ravi', 'ravi@example.com']); // ok
    await client.query('INSERT INTO candidates (name, email) VALUES ($1, $2)', ['Copy', 'meena@example.com']); // duplicate email fails
    await client.query('COMMIT');                                // never reached
  } catch (err) {                                                // the duplicate email lands here
    await client.query('ROLLBACK');                              // undo Ravi as well
    console.log('rolled back:', err.code, err.detail);           // 23505 = unique_violation
  } finally {                                                    // always runs
    client.release();                                            // give the connection back to the pool
  }                                                              // end of try/catch/finally

  const all = await pool.query('SELECT id, name FROM candidates ORDER BY id'); // who is saved?
  console.log('saved:', all.rows);                               // only Meena
  await pool.end();                                              // close every connection so Node can exit
}                                                                // end of main

main();                                                          // run it
```

**Output** (real run: Node 24, pg 8.23, PostgreSQL 18.4):

```text
added: { id: 1, name: 'Meena' }
rows for evil input: 0
rolled back: 23505 Key (email)=(meena@example.com) already exists.
saved: [ { id: 1, name: 'Meena' } ]
```

**What to notice:**
- The injection string found **0 rows**. It was compared as a plain email, never run as SQL.
- Ravi was inserted, then **rolled back** with the failed duplicate. Only Meena is saved.
- `err.code` is Postgres's error code. `23505` always means "unique value already exists".

## 🔍 Deeper version

**Pool vs Client.**

| | `pool.query(sql, values)` | `const client = await pool.connect()` |
|---|---|---|
| Connection | borrowed and returned for you | you hold it until `client.release()` |
| Use for | single statements | transactions, `LISTEN`, session settings |
| Risk | none | forgetting `release()` leaks the connection |

**Pool settings worth knowing.** `max` (default **10** connections), `idleTimeoutMillis`, `connectionTimeoutMillis`. Postgres itself has a limit (`max_connections`, often 100). If you run 20 app instances × 10 connections, you can hit it. Big setups put **PgBouncer** in front.

**How placeholders work.** pg sends the SQL text and the values **separately** (the "extended query protocol"). The database parses the SQL first, then plugs in values as data. So `x' OR '1'='1` can never change the query. Placeholders work for **values only**. Table or column names can't be `$1`. Pick those from an allow-list in your code. More in [SQL injection](topic:postgresql/sql-injection).

**Types.** pg turns Postgres types into JavaScript:
- `integer` → number, `text` → string, `boolean` → boolean, `json/jsonb` → object, `timestamptz` → `Date`.
- `bigint` and `numeric` → **string** by default, so large numbers don't lose precision.

**Sequences don't roll back.** In the run above, the rolled-back inserts still used up ids 2 and 3. The next candidate added got **id 4**. Gaps in `serial` ids are normal. Never use them as a "count".

**A reusable transaction helper:**

```js
async function withTransaction(pool, work) {   // work = an async function that receives the client
  const client = await pool.connect();         // one connection for the whole transaction
  try {                                        // try the work
    await client.query('BEGIN');               // start
    const result = await work(client);         // run the caller's queries on this client
    await client.query('COMMIT');              // save
    return result;                             // give back whatever work returned
  } catch (err) {                              // anything failed
    await client.query('ROLLBACK');            // undo everything
    throw err;                                 // let the caller handle the error
  } finally {                                  // always
    client.release();                          // return the connection
  }                                            // end of try/catch/finally
}                                              // end of withTransaction
```

**In Express**, create **one** pool when the app starts and share it. Don't create a pool per request. On shutdown, call `pool.end()`. See [Graceful shutdown](topic:nodejs/graceful-shutdown).

## 🎯 Why do we use it?

- **Speed.** Reusing connections avoids the slow connect step on every request.
- **Safety.** Parameterised queries stop SQL injection, one of the most common security bugs.
- **Control.** Raw SQL with pg gives you every Postgres feature. ORMs build on top of drivers like pg. See [ORMs](topic:postgresql/orms).

## ⚠️ Common mistakes

- **Building SQL with template strings:** `` `WHERE email = '${email}'` ``. That opens the door to SQL injection. Use `$1`.
- **Running BEGIN / COMMIT with `pool.query()`.** Each call can land on a different connection, so the transaction doesn't really exist.
- **Forgetting `client.release()`.** After 10 leaks, every request hangs, waiting for a free connection.
- **Creating a new Pool per request.** You open a new set of connections every time and soon hit the server limit.

## 🗣️ How to answer in an interview

> "I use the pg package with a single Pool created at startup. The pool keeps up to 10 connections by default and reuses them, because opening a Postgres connection is slow. For queries I always use placeholders like $1 and pass values as an array. pg sends the SQL and values separately, so user input can never change the query. That's how I prevent SQL injection.
>
> For transactions I don't use pool.query, because each call can go to a different connection. I borrow one client with pool.connect, run BEGIN, the work and COMMIT, roll back in the catch block, and always call client.release in finally. Otherwise the pool leaks connections."

[FILL IN: where you used PostgreSQL, and whether you used pg directly or an ORM.]

## 🔁 Follow-up questions

### Can you use a placeholder for a table name or ORDER BY column?

No. Placeholders are for values only. For names, check the input against a fixed list in your code, like `const allowed = ['name', 'created_at']`.

### What happens if the database restarts while the app is running?

Idle clients in the pool get an error. pg emits an `'error'` event on the pool. Add `pool.on('error', …)` to log it, or Node may crash. New queries will open fresh connections.

### How do you avoid too many connections when you scale out?

Lower `max` per instance, and put a connection pooler like PgBouncer in front of Postgres. Serverless functions especially need this, because many small instances each open their own pool.

### Why does pg return bigint as a string?

JavaScript numbers lose precision above 2^53. Returning a string keeps the exact value. You can convert it yourself if you know it's small.

### What is RETURNING?

A Postgres clause that sends back columns of the rows you just inserted, updated or deleted. It saves a second `SELECT`, for example to get the new `id`.

## ✅ Quick check

### 1. Is this safe?

```js
pool.query(`SELECT * FROM candidates WHERE name = '${req.query.name}'`); // name comes from the URL
```

:::answer
**No.** The input is pasted into the SQL text, so a value like `' OR '1'='1` changes the query. Write `pool.query('SELECT * FROM candidates WHERE name = $1', [req.query.name])`.
:::

### 2. What is wrong here?

```js
await pool.query('BEGIN');                      // start?
await pool.query('UPDATE wallets SET credits = credits - 1 WHERE owner = $1', ['acme']); // work
await pool.query('COMMIT');                     // save?
```

:::answer
Each `pool.query()` can use a **different connection**, so BEGIN, UPDATE and COMMIT may not be in the same transaction. Borrow one client with `pool.connect()`, use `client.query()` for all three, and release it in `finally`.
:::

### 3. A transaction inserted a row with a `serial` id, then rolled back. Is that id number reused?

:::answer
**No.** Sequences don't roll back, so there will be a gap. In the example run, the next candidate got id 4.
:::
