---
title: Isolation levels and row locking
stack: postgresql
order: 21
level: Advanced
mustKnow: false
askedFrequency: common
summary:
  - Isolation decides what one transaction can see of other transactions that run at the same time.
  - "PostgreSQL's default is Read Committed. Each statement sees data committed before that statement started."
  - "Read-then-write in two steps can lose updates. Fix it with an atomic UPDATE (x = x - 1), SELECT … FOR UPDATE, or a stricter level."
  - FOR UPDATE locks the selected rows until your transaction ends. Others who want them must wait.
  - "FOR UPDATE SKIP LOCKED lets many workers pull different jobs from a table queue without fighting over the same row."
cards:
  - q: What is PostgreSQL's default isolation level?
    a: Read Committed. Each statement sees a snapshot of data committed before the statement began.
  - q: What is a lost update?
    a: Two transactions read the same value, both calculate a new value from it, and both write. The second write overwrites the first, so one change is lost.
  - q: What does SELECT … FOR UPDATE do?
    a: It locks the rows it returns until the transaction commits or rolls back. Other transactions that try to lock or update those rows wait.
  - q: What is SKIP LOCKED used for?
    a: Job queues in a table. Each worker locks one free row and skips rows other workers already locked, so no two workers take the same job.
  - q: What happens under REPEATABLE READ when two transactions update the same row?
    a: "The second one fails with error 40001 (could not serialize access due to concurrent update). The app must retry the transaction."
---

## 💡 What is it?

Many users change the [database](glossary:database) at the same time. **Isolation** decides how much one [transaction](glossary:transaction) can see of another one that is still running.

**Row locking** lets one transaction say: "I'm working on this row. Others, please wait."

Together, they stop **[race conditions](glossary:race-condition)**. A race condition is a bug where the result depends on who finishes first.

## 🏠 Real-life example

Think of **5 tickets left for a school trip**, written on the notice board.

Two class leaders read the board at the same moment. Both see "5". Each sells a ticket, then each writes "4" on the board. But 2 tickets were sold, so it should say **3**. One sale was lost.

- **The notice board** = the row in the table.
- **Reading "5"** = `SELECT open`.
- **Writing "4"** = `UPDATE … SET open = 4`.
- **Both writing "4"** = a **lost update**.
- **Taking the board off the wall** while you count, so nobody else can read it = `SELECT … FOR UPDATE`.
- **Many helpers each picking a different unsold ticket from a box, skipping ones someone is already holding** = `FOR UPDATE SKIP LOCKED`.

## 🧑‍💻 Code example

This runs three things at the same time using real connections. Set up: `npm init -y`, `npm install pg`. Save as `lock.js`, then run `DATABASE_URL=postgres://user:pass@localhost:5432/hiring node lock.js`

```js
const { Pool } = require('pg');                                     // the pg driver
const pool = new Pool({ connectionString: process.env.DATABASE_URL }); // shared pool

async function setup() {                                            // fresh tables for the demo
  await pool.query(                                                 // run the setup SQL below
    `DROP TABLE IF EXISTS jobs, job_slots;                          -- start clean
    CREATE TABLE job_slots (job text PRIMARY KEY, open int NOT NULL); -- open interview slots per job
    INSERT INTO job_slots VALUES ('backend', 5);                     -- 5 slots open
    CREATE TABLE jobs (id serial PRIMARY KEY, status text NOT NULL DEFAULT 'queued'); -- a tiny job queue
    INSERT INTO jobs (status) SELECT 'queued' FROM generate_series(1, 4); -- 4 queued jobs
  `);                                                               // end of setup SQL
}                                                                   // end of setup

async function book(name, lock) {                                   // one recruiter books one slot
  const c = await pool.connect();                                   // own connection = own transaction
  try {                                                             // try the booking
    await c.query('BEGIN');                                         // start transaction
    const sql = 'SELECT open FROM job_slots WHERE job = $1' + (lock ? ' FOR UPDATE' : ''); // read, maybe with a row lock
    const { rows } = await c.query(sql, ['backend']);               // read the current count
    await new Promise((r) => setTimeout(r, 100));                   // pretend some work takes 100 ms
    await c.query('UPDATE job_slots SET open = $1 WHERE job = $2', [rows[0].open - 1, 'backend']); // write count - 1
    await c.query('COMMIT');                                        // save
    console.log(`${name} saw ${rows[0].open}, wrote ${rows[0].open - 1}`); // what this recruiter did
  } finally { c.release(); }                                        // return the connection
}                                                                   // end of book

async function worker(name) {                                       // a queue worker takes one job
  const c = await pool.connect();                                   // own connection
  try {                                                             // try to grab a job
    await c.query('BEGIN');                                         // start
    const { rows } = await c.query(                                 // ask for one job
      `SELECT id FROM jobs WHERE status = 'queued'                  -- only jobs not done yet
       ORDER BY id LIMIT 1 FOR UPDATE SKIP LOCKED`);                // lock one free row, skip rows others locked
    await new Promise((r) => setTimeout(r, 100));                   // pretend to process it
    if (rows[0]) await c.query("UPDATE jobs SET status = 'done' WHERE id = $1", [rows[0].id]); // mark done
    await c.query('COMMIT');                                        // save
    console.log(`${name} took job ${rows[0]?.id}`);                 // which job this worker got
  } finally { c.release(); }                                        // return the connection
}                                                                   // end of worker

async function main() {                                             // run the three demos
  await setup();                                                    // fresh data
  await Promise.all([book('A', false), book('B', false)]);          // two bookings at the same time, NO lock
  console.log('open after no-lock:', (await pool.query('SELECT open FROM job_slots')).rows[0].open); // should be 3
  await Promise.all([book('C', true), book('D', true)]);            // same again, WITH FOR UPDATE
  console.log('open after FOR UPDATE:', (await pool.query('SELECT open FROM job_slots')).rows[0].open); // 4 - 2 = 2
  await Promise.all([worker('W1'), worker('W2'), worker('W3')]);    // three workers at the same time
  await pool.end();                                                 // close connections
}                                                                   // end of main

main();                                                             // run it
```

**Output** (real run: Node 24, pg 8.23, PostgreSQL 18.4):

```text
A saw 5, wrote 4
B saw 5, wrote 4
open after no-lock: 4
C saw 4, wrote 3
D saw 3, wrote 2
open after FOR UPDATE: 2
W1 took job 1
W2 took job 2
W3 took job 3
```

**What to notice:**
- **Without a lock**, A and B both saw 5 and both wrote 4. Two bookings, but the count only dropped by 1. That's a **lost update**.
- **With `FOR UPDATE`**, D had to **wait** until C committed. Then D saw 3, not 4. The count is correct.
- **With `SKIP LOCKED`**, three workers ran at once and each got a **different** job. Nobody waited, and no job was taken twice. (The order of the three `W` lines can change between runs, because the workers finish at slightly different times.)

## 🔍 Deeper version

**The isolation levels in PostgreSQL:**

| Level | What a transaction sees | Lost update? |
|---|---|---|
| Read Uncommitted | Postgres treats it as Read Committed | — |
| **Read Committed** (default) | each **statement** sees data committed before it started | possible with read-then-write |
| Repeatable Read | one snapshot for the **whole transaction** | detected → error `40001`, you retry |
| Serializable | as if transactions ran one after another | detected → error `40001`, you retry |

Set the level with `BEGIN ISOLATION LEVEL REPEATABLE READ;`. You can check the default with `SHOW default_transaction_isolation;`, which returned `read committed` in our run.

**Repeatable Read catches the lost update.** We ran the same two bookings with `BEGIN ISOLATION LEVEL REPEATABLE READ`. Real result:

```text
A ok
B error 40001: could not serialize access due to concurrent update
```

The count ended at 4, which is correct for one booking. B must **retry** its whole transaction. Stricter levels are safer, but your code needs a retry loop.

**Three ways to avoid lost updates, best first:**
1. **Atomic update** (no read first): `UPDATE job_slots SET open = open - 1 WHERE job = 'backend' AND open > 0`. The database does the maths on the latest value. Simplest and fastest.
2. **`SELECT … FOR UPDATE`**, when you must read, decide in code, then write.
3. **Optimistic locking**: add a `version` column. `UPDATE … SET open = $1, version = version + 1 WHERE job = $2 AND version = $3`. If 0 rows change, someone else won, so you retry. The same idea is in [Atomic updates and optimistic locking](topic:mongodb/atomic-updates-locking).

**Lock types for rows:**
- `FOR UPDATE`: the strongest. Blocks other `FOR UPDATE`, `UPDATE` and `DELETE` on those rows.
- `FOR NO KEY UPDATE`, `FOR SHARE`, `FOR KEY SHARE`: weaker versions for special cases.
- `NOWAIT`: fail at once instead of waiting.
- `SKIP LOCKED`: skip rows someone else has locked. Perfect for queues.

**Normal reads never block.** Thanks to MVCC (multi-version concurrency control), a plain `SELECT` doesn't wait for writers. Only **locking** reads (`FOR UPDATE`) and writes wait.

**Deadlocks.** Transaction 1 locks row A and wants row B. Transaction 2 locks row B and wants row A. Postgres detects this after about one second (`deadlock_timeout`) and kills one of them with an error. Avoid it by always locking rows in the **same order**, for example by `id`.

**SKIP LOCKED as a job queue.** Postgres can be a simple, reliable queue for background jobs. For bigger systems, a dedicated queue (SQS, BullMQ) may be better. See [A background job runs twice](topic:debugging/background-job-twice).

## 🎯 Why do we use it?

Real apps have **many users acting at once**:
- Two recruiters book the last interview slot.
- Two webhook deliveries update the same subscription.
- Several workers process a queue of resume-parsing jobs.

Without the right isolation or locks, you get wrong counts, double bookings and jobs done twice. These bugs only appear under real traffic, so they are hard to find later. See [Two users update the same record](topic:debugging/lost-update).

## ⚠️ Common mistakes

- **Read, calculate in JavaScript, then write**, with no lock. This is the lost-update bug from the demo.
- **Holding a `FOR UPDATE` lock while calling a slow API.** Everyone else waits for that row.
- **Using Repeatable Read or Serializable with no retry code.** The `40001` error then reaches the user.
- **Locking rows in a different order** in different code paths. That invites deadlocks.

## 🗣️ How to answer in an interview

> "Isolation decides what a transaction sees of other concurrent transactions. Postgres defaults to Read Committed, where each statement sees data committed before it started. That means a read-then-write in two statements can lose an update: two requests both read 5 and both write 4.
>
> My first fix is an atomic update like SET open = open - 1, so the database uses the latest value. If I must read and decide in code, I use SELECT … FOR UPDATE, which locks the row until commit, so the second request waits and sees the new value. Repeatable Read or Serializable also catch it, but they throw a 40001 error, so the app needs a retry loop. For job queues in a table, FOR UPDATE SKIP LOCKED lets many workers take different rows without blocking each other."

[FILL IN: where you used PostgreSQL, and any real concurrency bug you fixed.]

## 🔁 Follow-up questions

### Does a normal SELECT block an UPDATE in PostgreSQL?

No. MVCC keeps old row versions, so readers see a snapshot and never block writers, and writers never block plain readers.

### What is the difference between Repeatable Read and Serializable?

Repeatable Read gives one stable snapshot and stops lost updates on the same row. Serializable also catches subtler problems where two transactions read overlapping data and write different rows, called write skew. Both can fail with `40001`.

### How do you handle a deadlock error?

Retry the transaction. Then prevent it by locking rows in a consistent order and keeping transactions short.

### Why not always use SERIALIZABLE?

It causes more `40001` failures under load, so more retries and lower throughput. Most apps use Read Committed plus atomic updates or targeted `FOR UPDATE`.

### Can Postgres replace a message queue?

For small to medium workloads, yes. `FOR UPDATE SKIP LOCKED` makes a reliable table queue. For very high volume or many consumers, a dedicated queue is better.

## ✅ Quick check

### 1. Two requests run this at the same time under Read Committed. The count starts at 5. What can the final value be?

```sql
-- each request runs these two statements in its own transaction
SELECT open FROM job_slots WHERE job = 'backend';        -- both read 5
UPDATE job_slots SET open = 4 WHERE job = 'backend';     -- the app computed 5 - 1
```

:::answer
**4**, even though two slots were booked. That's a lost update. Use `SET open = open - 1`, or `SELECT … FOR UPDATE`.
:::

### 2. Which query lets 10 workers each take a different queued job without waiting?

- A) `SELECT id FROM jobs WHERE status = 'queued' LIMIT 1`
- B) `SELECT id FROM jobs WHERE status = 'queued' LIMIT 1 FOR UPDATE`
- C) `SELECT id FROM jobs WHERE status = 'queued' LIMIT 1 FOR UPDATE SKIP LOCKED`

:::answer
**C.** A doesn't lock, so two workers can grab the same job. B locks, but the other workers wait for the same row. C skips rows others have locked.
:::

### 3. Under REPEATABLE READ, the second of two concurrent updates to the same row gets error `40001`. What should the app do?

:::answer
**Retry the whole transaction** from the start. The error means "someone changed this row after your snapshot".
:::
