---
title: ACID and transactions
stack: postgresql
order: 17
level: Intermediate
mustKnow: true
askedFrequency: very common
summary:
  - A transaction groups several SQL statements into one unit. Either all of them are saved, or none are.
  - "ACID = Atomicity (all or nothing), Consistency (rules always hold), Isolation (transactions don't see each other's half-done work), Durability (once saved, it survives a crash)."
  - "You write it as BEGIN … COMMIT. If anything fails, ROLLBACK undoes every step since BEGIN."
  - After an error inside a transaction, PostgreSQL refuses every other command until you ROLLBACK.
  - Use transactions when one action changes several rows or tables, like moving credits or creating a user with a profile.
cards:
  - q: What is a transaction?
    a: A group of SQL statements that runs as one unit. Either every statement is saved (COMMIT), or none are (ROLLBACK).
  - q: What does ACID stand for?
    a: Atomicity (all or nothing), Consistency (constraints always hold), Isolation (others don't see half-done work), Durability (committed data survives a crash).
  - q: What happens in PostgreSQL after one statement fails inside a transaction?
    a: "The transaction is marked as aborted. Every later command fails with 'current transaction is aborted' until you run ROLLBACK."
  - q: Is a single UPDATE statement atomic without BEGIN?
    a: Yes. Every statement runs in its own transaction automatically (autocommit). You need BEGIN only to group several statements.
  - q: How does Durability work in PostgreSQL?
    a: Before COMMIT returns, the change is written to the write-ahead log (WAL) on disk. After a crash, Postgres replays the WAL.
---

## 💡 What is it?

A **[transaction](glossary:transaction)** is a group of SQL steps that the [database](glossary:database) treats as **one single job**.

Either **every step is saved**, or **none of them are**. There is no "half done".

You start it with `BEGIN`. You save it with `COMMIT`. You cancel it with `ROLLBACK`.

**ACID** is the list of four promises a transaction gives you.

## 🏠 Real-life example

Think of **moving money between two piggy banks** at home.

You take ₹300 out of your piggy bank. Then you put it into your sister's piggy bank. What if the doorbell rings between the two steps and you forget? The money is gone from yours but never reached hers.

A transaction is like a **rule from your parents**: "Either both steps happen, or you put the money back."

- **Taking money out + putting it in** = the SQL steps inside the transaction.
- **"Both or neither" rule** = **Atomicity**.
- **"No piggy bank can go below zero"** = **Consistency** (a rule the data must follow).
- **Your brother can't peek while you are halfway** = **Isolation**.
- **Once done, it stays done, even if the lights go off** = **Durability**.
- **Putting the money back** = `ROLLBACK`.

## 🧑‍💻 Code example

This runs on any PostgreSQL. Save it as `acid.sql` and run `psql -d mydb -f acid.sql`. It moves job-posting credits from a company wallet to a job.

```sql
CREATE TABLE wallets (                          -- one row per wallet of job-posting credits
  owner   text PRIMARY KEY,                     -- who owns the wallet, e.g. 'acme'
  credits int  NOT NULL CHECK (credits >= 0)    -- credits can never go below 0
);                                              -- end of the table
INSERT INTO wallets VALUES ('acme', 5), ('job-42', 0);   -- acme has 5 credits, job 42 has 0

BEGIN;                                          -- start transaction 1: all steps or none
UPDATE wallets SET credits = credits - 3 WHERE owner = 'acme';    -- take 3 from acme (5 - 3 = 2)
UPDATE wallets SET credits = credits + 3 WHERE owner = 'job-42';  -- give 3 to job 42 (0 + 3 = 3)
COMMIT;                                         -- save both changes together

BEGIN;                                          -- start transaction 2
UPDATE wallets SET credits = credits + 10 WHERE owner = 'job-42'; -- give 10 to job 42 first
UPDATE wallets SET credits = credits - 10 WHERE owner = 'acme';   -- take 10 from acme: 2 - 10 = -8 breaks the CHECK
SELECT * FROM wallets;                          -- any query now fails: the transaction is broken
ROLLBACK;                                       -- undo transaction 2, including the +10

SELECT * FROM wallets ORDER BY owner;           -- the final balances
```

**Output** (real run on PostgreSQL 18.4):

```text
CREATE TABLE
INSERT 0 2
BEGIN
UPDATE 1
UPDATE 1
COMMIT
BEGIN
UPDATE 1
ERROR:  new row for relation "wallets" violates check constraint "wallets_credits_check"
ERROR:  current transaction is aborted, commands ignored until end of transaction block
ROLLBACK
 owner  | credits
--------+---------
 acme   |       2
 job-42 |       3
(2 rows)
```

**What to notice:**
- Transaction 1 worked. Both rows changed together.
- In transaction 2, the `+10` **did** run. But after `ROLLBACK`, job 42 still has 3, not 13. The `+10` was undone.
- After the error, even a simple `SELECT` failed. Postgres blocks everything until you `ROLLBACK`.

## 🔍 Deeper version

**The four ACID promises, in PostgreSQL terms:**

| Letter | Promise | How PostgreSQL keeps it |
|---|---|---|
| **A**tomicity | All steps or none | `ROLLBACK` throws away every change since `BEGIN`. A crash before `COMMIT` = rollback. |
| **C**onsistency | Data always follows the rules | Constraints (`CHECK`, `NOT NULL`, `UNIQUE`, foreign keys) are checked. A failing rule aborts the transaction. |
| **I**solation | Others don't see half-done work | **MVCC** (multi-version concurrency control): each transaction reads a snapshot. Default level: Read Committed. |
| **D**urability | Saved data survives a crash | Changes go to the **WAL** (write-ahead log) on disk before `COMMIT` returns. |

**Autocommit.** Without `BEGIN`, every single statement is its own small transaction. So one `UPDATE` is already atomic. You need `BEGIN` only to **group** statements.

**Aborted state.** This is PostgreSQL-specific. MySQL lets you continue after an error. Postgres says: "this transaction is broken; roll it back". That is why app code always puts `ROLLBACK` in a `catch` block.

**Savepoints** let you undo part of a transaction:

```sql
BEGIN;                                   -- start
INSERT INTO wallets VALUES ('beta', 1);  -- step that we want to keep
SAVEPOINT before_risky;                  -- a bookmark inside the transaction
UPDATE wallets SET credits = -1 WHERE owner = 'beta';  -- fails the CHECK
ROLLBACK TO SAVEPOINT before_risky;      -- undo only back to the bookmark
COMMIT;                                  -- 'beta' with 1 credit is saved
```

**Keep transactions short.** A transaction holds **locks** on the rows it changed. Other users who want those rows must wait. Never call a slow external API (like Stripe or an email service) while a transaction is open.

**Compared with MongoDB.** In MongoDB, one document update is atomic. Multi-document transactions need a replica set and sessions. In PostgreSQL, transactions are the normal way of working. See [Transactions in MongoDB](topic:mongodb/transactions).

**How to use it from Node.js** (with `BEGIN` / `COMMIT` / `ROLLBACK` and `client.release()`) is in [Using PostgreSQL from Node.js](topic:postgresql/node-pg). How transactions behave when they run **at the same time** is in [Isolation levels and row locking](topic:postgresql/isolation-locking).

## 🎯 Why do we use it?

Many real actions change **more than one row**:
- Move credits from a company to a job.
- Create a user **and** their profile **and** their first role.
- Mark an invoice as paid **and** extend the subscription end date.

Without a transaction, a crash or an error in the middle leaves **broken data**. For example, money taken but never given. Transactions make the database clean up for you, so your code doesn't need complex "undo" logic.

## ⚠️ Common mistakes

- **Forgetting `ROLLBACK` in the error path.** In Node, a connection stuck in an aborted transaction goes back to the pool and breaks the next request that uses it.
- **Doing slow work inside a transaction**, like an HTTP call to a payment API. Locks stay held, and other requests queue up.
- **Thinking "read, then write" is safe inside a transaction.** Two transactions can both read the same old value. Use `UPDATE … SET x = x - 1` or `SELECT … FOR UPDATE`. See [Isolation levels and row locking](topic:postgresql/isolation-locking).
- **Wrapping single statements in BEGIN/COMMIT for no reason.** One statement is already atomic.

## 🗣️ How to answer in an interview

> "A transaction groups several statements into one unit: either all are committed or all are rolled back. ACID describes what it guarantees. Atomicity means all or nothing. Consistency means constraints like CHECK and foreign keys always hold. Isolation means concurrent transactions don't see each other's half-done work; Postgres does this with MVCC snapshots, and the default level is Read Committed. Durability means once COMMIT returns, the change is in the write-ahead log and survives a crash.
>
> In Postgres, if one statement fails inside a transaction, the whole transaction is aborted, so in application code I always run ROLLBACK in the catch block and release the client in finally. I also keep transactions short and never call external APIs inside them, because they hold row locks."

[FILL IN: where you used PostgreSQL, and one real case where you needed a transaction.]

## 🔁 Follow-up questions

### What is the difference between COMMIT and ROLLBACK?

`COMMIT` saves every change since `BEGIN` permanently. `ROLLBACK` throws all of them away, as if they never happened.

### What happens if the server crashes in the middle of a transaction?

The transaction never committed, so on restart Postgres treats it as rolled back. Committed transactions are safe, because they were written to the WAL first.

### What is MVCC?

Multi-version concurrency control. When a row is updated, Postgres keeps the old version too. Readers see a consistent snapshot, so **readers don't block writers and writers don't block readers**. Old versions are cleaned later by `VACUUM`.

### When should you NOT use a long transaction?

When the work includes slow or external steps, like sending emails or calling Stripe. Save to the database in a short transaction, then do the slow work after. Or use a background queue.

### Do you need transactions for a single INSERT?

No. Every statement is automatically atomic. Use `BEGIN` only to group several statements.

## ✅ Quick check

### 1. After this runs, how many rows are in `t`?

```sql
CREATE TABLE t (id int PRIMARY KEY);   -- a tiny table
BEGIN;                                 -- start
INSERT INTO t VALUES (1);              -- ok
INSERT INTO t VALUES (1);              -- fails: duplicate key
COMMIT;                                -- what happens here?
```

:::answer
**0 rows.** The second insert failed, so the transaction is aborted. In PostgreSQL, `COMMIT` on an aborted transaction actually performs a **ROLLBACK**. The first insert is thrown away too.
:::

### 2. Which ACID letter means "a committed change survives a power cut"?

- A) Atomicity
- B) Isolation
- C) Durability

:::answer
**C) Durability.** PostgreSQL writes the change to the write-ahead log on disk before `COMMIT` returns.
:::

### 3. True or false: one `UPDATE wallets SET credits = credits - 1 WHERE owner = 'acme'` needs `BEGIN` to be atomic.

:::answer
**False.** Every single statement already runs in its own transaction (autocommit).
:::
