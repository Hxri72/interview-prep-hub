---
title: "Database scaling: indexes, read replicas, sharding"
stack: system-design
order: 11
level: Intermediate
mustKnow: false
askedFrequency: common
summary:
  - Scale the database in steps. Fix queries and add indexes first, then add read replicas, and shard only when nothing else works.
  - Read replicas are copies that answer reads. All writes still go to one primary.
  - Replicas can be a little behind the primary (replication lag), so "read your own write" needs care.
  - Sharding splits the data across servers by a shard key. A bad key creates one overloaded "hot" shard.
  - Database-per-tenant is another way to spread data. Each company's data lives in its own database.
cards:
  - q: What should you try first when a database gets slow?
    a: Look at the slow queries. Add the right indexes, fetch only needed fields, and fix N+1 queries. Then add caching. Bigger steps come later.
  - q: What is a read replica?
    a: A copy of the database that receives every change from the primary. It answers read queries, so the primary has more time for writes.
  - q: What is replication lag?
    a: The small delay before a change on the primary reaches a replica. A user may save something and not see it for a moment if the next read goes to a replica.
  - q: What is sharding?
    a: Splitting one big data set across several servers. A shard key, like tenantId, decides which server holds each record.
  - q: What makes a bad shard key?
    a: A key with few values or uneven traffic, like country or "createdAt". One shard gets most of the work and becomes a hot spot.
---

## 💡 What is it?

When an app grows, the [database](glossary:database) gets more data and more requests. **Database scaling** means helping it keep up.

There are three main steps, from easy to hard:
1. **Indexes and better queries** — make each query cheaper.
2. **Read replicas** — copies of the database that answer reads.
3. **Sharding** — split the data across many servers.

## 🏠 Real-life example

Think of a **busy school library**.

- At first, students wait because books are in random order. The librarian adds a **catalogue**. Now finding a book is fast. That is an **index**.
- Then many students come just to **read**. The school buys **copies of popular books** for other rooms. Anyone can read a copy. But only the main library **adds new books**. Those copies are **read replicas**.
- Copies arrive a few minutes late. A student may not see the newest book in a copy room yet. That is **replication lag**.
- Finally, the library is too big for one building. Books A–M go to building 1, and N–Z go to building 2. That is **sharding**. The first letter is the **shard key**.

Map it:
- **Catalogue** = an index.
- **Copy rooms** = read replicas.
- **Late copies** = replication lag.
- **Two buildings** = shards.
- **First letter of the title** = the shard key.

## 🧑‍💻 Code example

A tiny "router" sends reads to replicas and writes to the primary. It also picks a shard for each company. Save as `scaling.js` and run `node scaling.js`.

```js
const crypto = require('node:crypto');                      // Node's built-in tool for hashing
const primary = 'primary-db';                               // the one server that takes all writes
const replicas = ['replica-1', 'replica-2'];                // copies that only answer reads
let next = 0;                                               // which replica gets the next read

function pickServer(query) {                                // decide where one query should go
  if (query.type === 'write') return primary;               // writes always go to the primary
  const server = replicas[next % replicas.length];          // reads take turns between replicas
  next++;                                                   // move to the next replica for next time
  return server;                                            // give back the chosen replica
}                                                           // end of pickServer

function shardFor(tenantId, shardCount) {                   // which shard holds this tenant's data
  const hash = crypto.createHash('md5').update(tenantId).digest(); // turn the id into bytes
  return hash.readUInt32BE(0) % shardCount;                 // first 4 bytes as a number, then remainder
}                                                           // end of shardFor

console.log(pickServer({ type: 'read' }));                  // first read
console.log(pickServer({ type: 'read' }));                  // second read
console.log(pickServer({ type: 'write' }));                 // a write
console.log(pickServer({ type: 'read' }));                  // third read
console.log('acme  -> shard', shardFor('acme', 4));         // where company "acme" lives (4 shards)
console.log('zenco -> shard', shardFor('zenco', 4));        // where company "zenco" lives
console.log('acme  -> shard', shardFor('acme', 4));         // same id always gives the same shard
```

**Output:**

```text
replica-1
replica-2
primary-db
replica-1
acme  -> shard 1
zenco -> shard 0
acme  -> shard 1
```

The same id always lands on the same shard. That is the whole point of a shard key.

## 🔍 Deeper version

**Step 1 — make each query cheaper.** Most "the database is slow" problems are query problems:
- Add an [index](glossary:index) that matches the filter and sort. See [compound indexes](topic:mongodb/compound-indexes-esr).
- Check the plan with [explain()](topic:mongodb/explain).
- Fetch only needed fields. Avoid N+1 queries (one query per item in a loop).
- Use [cursor pagination](topic:rest-auth/pagination-offset-cursor) instead of a big `skip`.
- Cache hot data. See [caching](topic:system-design/caching).

**Step 2 — scale up (vertical).** A bigger machine (more RAM, faster disk) is the simplest next step. Indexes work best when they fit in memory.

**Step 3 — read replicas.** In MongoDB this is a [replica set](glossary:replica-set). In PostgreSQL it is streaming replication.

| Topic | What to know |
|---|---|
| Writes | Still go to **one primary**. Replicas don't help write-heavy apps. |
| Reads | Can be spread across replicas (MongoDB `readPreference: 'secondaryPreferred'`). |
| Lag | Replicas are a little behind. Read from the primary right after a user saves. |
| Failover | If the primary dies, a replica is elected as the new primary. |

**Step 4 — partitioning and [sharding](glossary:sharding).**
- **Hash sharding** (like the code above) spreads data evenly. But range queries must ask every shard.
- **Range sharding** keeps nearby keys together. But new data can pile up on one shard ("hot shard").
- A **good shard key** has many values, spreads traffic evenly and appears in most queries.
- **Costs:** cross-shard queries and joins are slow, transactions across shards are harder, and moving data later (resharding) is painful.

**Another way to split: database-per-tenant.** Each customer company gets its own database. Big tenants can move to their own server. See [shared vs per-tenant](topic:architecture/shared-vs-db-per-tenant).

**Connection limits.** Many app servers or serverless functions each open a pool. Together they can exceed the database's connection limit. Use small pools, reuse connections, or a proxy (for example RDS Proxy or PgBouncer).

## 🎯 Why do we use it?

The database is usually the hardest part to scale. App servers are easy to copy. Data is not.

Scaling in steps keeps the system simple for as long as possible. Each step only adds the complexity you really need.

## ⚠️ Common mistakes

- **Jumping to sharding first.** Most apps only need better indexes and a cache.
- **Ignoring replication lag.** A user saves a profile, refreshes and sees old data.
- **Picking a shard key by habit.** `createdAt` or `country` often creates a hot shard.
- **Forgetting connection limits.** 100 Lambda functions × a pool of 10 = 1,000 connections.

## 🗣️ How to answer in an interview

> "I scale a database in steps. First I find the slow queries and fix them: the right compound indexes, fetching only needed fields, and no N+1 queries. Then I add caching for hot data. If reads are still the problem, I add read replicas. Writes go to the primary and reads go to the copies. I remember replicas can lag, so a read right after a write goes to the primary.
>
> Sharding is the last step. It splits data across servers by a shard key. The key must have many values and spread traffic evenly, otherwise one shard gets hot. Another option for SaaS is database-per-tenant, where each company has its own database.
>
> [FILL IN: one real slow query or index you fixed, if you have one.]"

## 🔁 Follow-up questions

### Do read replicas help a write-heavy app?

No. Every write still goes to the primary, and replicas must apply every write too. For heavy writes, you batch writes, use a queue, or shard.

### How do you avoid stale reads after a save?

Read from the primary for that user for a short time. Or return the saved data in the save response, so the UI doesn't need to read again.

### What is the difference between partitioning and sharding?

Partitioning splits a table into parts, often inside one database server. Sharding puts those parts on different servers.

### Why is a monotonically increasing shard key bad with range sharding?

All new records have the biggest values. So every new write goes to the last shard. That shard becomes hot while others sit idle.

## ✅ Quick check

### 1. Your app has 95% reads and 5% writes, and the database CPU is high. Which step helps most after indexes?

- A) Sharding
- B) Read replicas and caching
- C) A bigger write buffer

:::answer
**B.** Most traffic is reads. Replicas and a cache take reads away from the primary. Sharding is far more complex than needed.
:::

### 2. In the code, why does `shardFor('acme', 4)` always return the same number?

:::answer
A hash of the same text always gives the same bytes. So the remainder is always the same. That is how the system knows where a tenant's data lives.
:::

### 3. Name one cost of sharding.

:::answer
Queries that need data from many shards are slow. Joins and transactions across shards are harder. Changing the shard key later means moving lots of data.
:::
