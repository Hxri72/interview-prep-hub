---
title: Connection pooling, replica sets and sharding (overview)
stack: mongodb
order: 30
level: Advanced
mustKnow: false
askedFrequency: common
summary:
  - Connection pool — the driver keeps a set of open connections and reuses them. Connect ONCE when the app starts, never per request. (Node driver default maxPoolSize is 100.)
  - Replica set — copies of the same data on several servers. One primary takes writes; secondaries copy it. If the primary dies, a new one is elected automatically (high availability).
  - Read preference decides where reads go (primary by default). Reading from secondaries may return slightly old data.
  - Sharding — splits ONE big collection across many servers by a shard key, to scale writes and storage. mongos routes each query.
  - Pick the shard key carefully (high cardinality, even spread, used in queries). For multi-tenant apps, tenantId is often part of it.
cards:
  - q: What is a connection pool?
    a: A set of open database connections the driver keeps and reuses for many requests, so the app doesn't open a new connection each time.
  - q: Why connect to MongoDB only once in an Express app?
    a: Opening connections is slow. Mongoose keeps one pool for the whole app; connecting per request wastes time and can exhaust the server's connection limit.
  - q: What is a replica set?
    a: A group of MongoDB servers with the same data. One primary takes writes, secondaries copy from it, and a new primary is elected automatically if it fails.
  - q: What is sharding?
    a: Splitting one large collection across several servers (shards) using a shard key, so data size and write load are spread out.
  - q: What makes a good shard key?
    a: Many different values, an even spread of writes, and being used in most queries — so mongos can send each query to one shard.
---

## 💡 What is it?

These are three ways MongoDB handles **more users and more data**.

- A **connection pool** reuses open connections between your app and the database.
- A **[replica set](glossary:replica-set)** keeps **copies** of your data on several servers. If one server dies, another takes over.
- **[Sharding](glossary:sharding)** **splits** a very big collection across many servers. Each server holds only a part.

## 🏠 Real-life example

Think of a **big school**.

- **Connection pool = school buses.** The school doesn't buy a new bus for every student trip. It keeps 10 buses and reuses them all day.
- **Replica set = the principal and vice-principals.** The principal makes decisions (writes). The vice-principals keep copies of every notice. If the principal is absent, a vice-principal takes charge at once.
- **Sharding = splitting classes into sections.** One class of 3,000 students won't fit in one room. So students are split into sections A–F by roll number. Each room (shard) holds only some students. The office (mongos) knows which room each roll number is in.

- **The roll number range** = the shard key.
- **The office that directs you** = `mongos`, the router.

## 🧑‍💻 Code example

Setup: use a free MongoDB Atlas cluster (it's a 3-node replica set) and copy its connection string. Run `npm init -y` and `npm install mongoose`. Save this as `scale.js` and run `MONGO_URL="your-atlas-url" node scale.js`. A local `mongod` also works, but it will show "standalone". It uses CommonJS.

```js
const mongoose = require('mongoose');                                        // load Mongoose

async function main() {                                                      // the demo
  await mongoose.connect(process.env.MONGO_URL, {                            // connect ONCE when the app starts
    maxPoolSize: 20,                                                         // at most 20 open connections from this app (driver default is 100)
    minPoolSize: 2,                                                          // keep 2 connections ready even when idle
    serverSelectionTimeoutMS: 5000,                                          // give up after 5 seconds if no server is reachable
  });                                                                        // end of connect options

  const info = await mongoose.connection.db.admin().command({ hello: 1 });   // ask the server "who are you?"
  console.log('replica set:', info.setName ?? 'standalone (no replica set)'); // setName exists only for replica sets
  console.log('members:', info.hosts?.length ?? 1);                          // how many data-bearing servers are in the set
  console.log('talking to primary?', info.isWritablePrimary);               // true → this server accepts writes

  const Job = mongoose.model('Job', new mongoose.Schema({ title: String })); // a simple model
  const jobs = await Job.find().read('secondaryPreferred').limit(5);         // this read may go to a secondary (fine for reports)
  console.log('jobs read:', jobs.length);                                    // number of jobs returned (0 on a fresh database)

  await mongoose.disconnect();                                               // close the pool when the app stops
}                                                                            // end of main

main().catch(console.error);                                                 // run and print any error
```

```text
replica set: atlas-abc123-shard-0
members: 3
talking to primary? true
jobs read: 0
```

Your replica set name will be different. On a local `mongod` you will see `replica set: standalone (no replica set)` and `members: 1`.

## 🔍 Deeper version

### Connection pooling

- Opening a database connection takes several network round trips (TCP, TLS, authentication). A **pool** keeps connections open and lends them to queries.
- Mongoose (and the Node driver) creates **one pool per `connect()`**. Call it **once** at startup and reuse it everywhere.
- **Pool size:** the Node driver default `maxPoolSize` is 100 per server. Total connections = pool size × number of app instances. With many instances (for example, cluster mode or serverless functions), you can hit the database's connection limit.
- **Serverless tip (like AWS Lambda):** create the connection **outside** the handler, so warm invocations reuse it. Keep `maxPoolSize` small.

### Replica sets

- One **primary** takes all writes. **Secondaries** copy its changes from the **oplog** (a log of every write).
- If the primary fails, the members **elect** a new primary, usually within seconds. Drivers retry many writes automatically (retryable writes).
- **Write concern** says how many members must save a write before it counts as done. `w: 'majority'` survives one server failing. It's the usual default.
- **Read preference** says where reads go:

| Read preference | Reads from | Use for |
|---|---|---|
| `primary` (default) | primary only | anything that must be fresh |
| `primaryPreferred` | primary, else a secondary | fresh when possible |
| `secondaryPreferred` | a secondary, else the primary | reports, analytics |
| `nearest` | the lowest-latency member | multi-region reads |

- Secondaries can **lag** behind, so reading from them may show slightly old data.
- A replica set is about **availability and safety**, not about scaling writes. All writes still go to one primary.

### Sharding

- A **sharded cluster** has **shards** (each one a replica set), **config servers** (they store which data lives where), and **`mongos`** routers (your app connects to these).
- Data is split by a **shard key** into ranges (called chunks). MongoDB's **balancer** moves ranges between shards to keep them even.
- **A good shard key:**
  - has **high cardinality** (many different values),
  - spreads **writes evenly** (not a value that always grows, like a plain timestamp, unless it's hashed),
  - appears in **most queries**, so `mongos` sends each query to **one** shard (a *targeted* query) instead of **all** shards (*scatter-gather*).
- **Multi-tenant apps:** a compound key like `{ tenantId: 1, _id: 1 }` keeps one company's data together and makes tenant queries targeted. A hashed key spreads writes but makes range queries scatter.
- Changing a shard key later is possible (resharding, since MongoDB 5.0), but it's heavy work. So choose carefully up front.

**When to shard?** Usually **late**. First use good indexes, a bigger server (vertical scaling), read replicas for reports, and archiving old data. Shard when one replica set can't hold the data or handle the write load.

## 🎯 Why do we use it?

- **Pools** make every query faster and protect the database from too many connections.
- **Replica sets** keep the app running when a server crashes, and keep data safe on several machines. Atlas clusters are replica sets by default.
- **Sharding** lets a collection grow beyond one server's disk and write capacity. Very large platforms need this.

## ⚠️ Common mistakes

- **Creating a new connection per request** (for example `mongoose.createConnection()` or `new MongoClient()` inside a route). Each one opens a new pool. Connect once at startup.
- **Reading from secondaries for data that must be fresh,** like "did my payment go through?". Use the primary.
- **A shard key that always increases** (like `createdAt`). All new writes hit one shard, a "hot shard".
- **Sharding too early.** It adds a lot of complexity. Indexes and a bigger server often solve the problem.

## 🗣️ How to answer in an interview

> "There are three different ideas here. Connection pooling means the driver keeps open connections and reuses them. So in Express, I connect once at startup and share the pool. The default max pool size in the Node driver is 100, and with many app instances, I watch the total connection count.
>
> A replica set is several copies of the data. One primary takes writes, secondaries replicate from the oplog, and if the primary fails, a new one is elected automatically. That gives high availability. Write concern `majority` makes writes survive a node failure. Read preference controls where reads go; secondaries can be slightly stale, so I use them only for reports.
>
> Sharding splits one big collection across shards by a shard key, and `mongos` routes queries. The shard key should have high cardinality, spread writes evenly, and appear in most queries. In a multi-tenant app, something like tenant ID plus `_id` keeps tenant queries targeted. I'd shard only after indexes, vertical scaling and archiving are no longer enough."

[FILL IN: how the SkillKeepr MongoDB is hosted (Atlas or self-managed, replica set or sharded) — only if true.]

## 🔁 Follow-up questions

### What happens to my app when the primary fails?

The replica set elects a new primary, usually in seconds. The driver finds the new primary by itself. Retryable writes and reads hide many short errors, but some in-flight operations may fail and need a retry or an error message.

### Is a replica set the same as a backup?

No. A replica set copies every change, **including mistakes**. If you delete data by accident, the secondaries delete it too. You still need real backups or point-in-time restore.

### Why are scatter-gather queries slow?

The query doesn't include the shard key. So `mongos` must ask **every** shard and merge the answers. More shards means more work and slower answers.

### How does connection pooling work with AWS Lambda?

Each Lambda instance has its own pool. Create the client outside the handler so warm calls reuse it, keep `maxPoolSize` small, and watch the database's connection count. Many parallel Lambdas can still open many connections.

## ✅ Quick check

### 1. Where do all writes go in a replica set?

:::answer
To the **primary**. Secondaries copy the writes from it. If the primary fails, a new one is elected.
:::

### 2. Which shard key is the worst choice for a busy multi-tenant collection?

- A) `{ tenantId: 1, _id: 1 }`
- B) `{ createdAt: 1 }`
- C) a hashed `_id`

:::answer
**B.** `createdAt` always increases, so all new writes go to the same shard (a hot shard), and most tenant queries would hit every shard.
:::

### 3. A developer calls `mongoose.createConnection(url)` inside every request handler. What problem does this cause?

:::answer
Each call opens a brand-new connection pool. That is slow, and the open connections pile up until the database's connection limit is reached. Connect once at startup and reuse the pool.
:::
