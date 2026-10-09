---
title: Vertical vs horizontal scaling
stack: system-design
order: 6
level: Basic
mustKnow: true
askedFrequency: very common
summary:
  - Vertical scaling (scale up) = make one machine bigger: more CPU, RAM or disk.
  - Horizontal scaling (scale out) = add more machines and spread the work with a load balancer.
  - Vertical is simple but has a ceiling and one point of failure. Horizontal has no real ceiling and survives one machine dying.
  - Horizontal scaling only works well when app servers are stateless (no user data kept in server memory).
  - Databases usually scale up first, then add read replicas, then sharding as a last step.
cards:
  - q: What is vertical scaling?
    a: Making one server more powerful (more CPU, RAM, disk). Also called scaling up.
  - q: What is horizontal scaling?
    a: Adding more servers and spreading requests between them with a load balancer. Also called scaling out.
  - q: Why is horizontal scaling more reliable?
    a: If one of many servers dies, the others keep serving. With one big server, its failure takes everything down.
  - q: What must be true for app servers to scale horizontally?
    a: They must be stateless — sessions, uploads and caches live in shared places (Redis, S3, the database), not in one server's memory.
  - q: How does serverless relate to scaling?
    a: Platforms like AWS Lambda scale horizontally automatically by running more copies of your function as requests increase.
---

## 💡 What is it?

When more users come, your system needs more power. There are two ways to add it.

- **Vertical scaling (scale up):** make **one** machine **bigger**. More CPU, more memory.
- **Horizontal scaling (scale out):** add **more** machines and share the work between them.

Most real systems use both, but horizontal scaling is how big apps grow.

## 🏠 Real-life example

Think of a **busy dosa shop**.

- The cook gets a **bigger stove** that makes 8 dosas at once instead of 4 = **vertical scaling**. Easy, but there's a limit to how big a stove can get. And if that one cook is sick, the shop closes.
- The owner hires **more cooks**, each with a normal stove = **horizontal scaling**. If one cook is sick, the others keep cooking.
- A **manager at the counter sends each order to a free cook** = the **load balancer**.
- **Orders are written on a shared board, not in one cook's head** = **stateless servers**. Any cook can make any order.

## 🧑‍💻 Code example

A quick capacity calculator. Save as `scale.js`, run `node scale.js`.

```js
const peakRps = 1200;                                         // requests per second at the busiest time
const rpsPerServer = 300;                                     // one server can safely handle 300 requests/second
const headroom = 0.7;                                         // only fill servers to 70%, keep 30% spare

const needed = Math.ceil(peakRps / (rpsPerServer * headroom)); // servers needed for horizontal scaling
console.log('Horizontal: servers needed =', needed);          // print how many small servers we need

const bigServerRps = 1000;                                    // the biggest single machine we can buy handles 1000 rps
const fitsVertically = peakRps <= bigServerRps * headroom;    // can ONE big machine handle the peak at 70%?
console.log('Vertical: one big server enough?', fitsVertically); // true = yes, false = we must scale out
console.log('If one of', needed, 'servers dies, capacity left =', Math.round(((needed - 1) / needed) * 100) + '%'); // why many servers are safer
```

**Output:**

```text
Horizontal: servers needed = 6
Vertical: one big server enough? false
If one of 6 servers dies, capacity left = 83%
```

Even the biggest machine can't handle this peak. Six smaller servers can, and losing one still leaves 83% capacity.

## 🔍 Deeper version

**Side-by-side:**

| | Vertical (scale up) | Horizontal (scale out) |
|---|---|---|
| How | Bigger machine | More machines + load balancer |
| Code changes | Usually none | App must be stateless |
| Ceiling | Yes, the biggest machine | Practically none |
| Failure | One machine = single point of failure | Survives single failures |
| Cost | Big machines get expensive fast | Many cheaper machines |
| Downtime to grow | Often a restart | Add machines while running |

**Stateless servers.** For horizontal scaling, any request must be able to go to any server. So the server must not keep important data in its own memory:
- **Sessions** → in Redis or a signed token like a [JWT](glossary:jwt) cookie.
- **Uploaded files** → in S3, not the server's disk.
- **Caches** → shared Redis, or small local caches that are OK to lose.

See [load balancers and stateless services](topic:system-design/load-balancers-stateless).

**Scaling Node.js on one machine.** Node runs your JavaScript on one thread, so one process uses one CPU core. Run one process per core with the `cluster` module or PM2. That is horizontal scaling *inside* one machine. See [cluster and PM2](topic:nodejs/cluster-and-pm2).

**Auto-scaling.** Cloud platforms add or remove servers based on CPU or request count. Serverless (like [AWS Lambda](topic:architecture/serverless-lambda)) goes further: it runs more copies of your function automatically. SkillKeepr's backend runs on Lambda, so the API layer scales out on its own.

**Databases are harder.** Usual order:
1. **Scale up** the database machine.
2. Add **indexes** and **caching** to reduce load.
3. Add **read replicas** for read-heavy traffic.
4. **Shard** (split data across machines) only when one primary can't handle the writes.

See [database scaling](topic:system-design/database-scaling).

## 🎯 Why do we use it?

- **To handle more users** without slowing down.
- **To survive failures:** many servers means no single point of failure.
- **To control cost:** add servers at peak, remove them at night.

## ⚠️ Common mistakes

- **Keeping sessions in server memory,** then adding a second server. Users get logged out randomly.
- **Scaling app servers while the database is the real bottleneck.** More servers just send more load to the same slow database.
- **Saving uploads to local disk.** The next request may hit a server that doesn't have the file.
- **Thinking vertical scaling is "wrong".** For small apps it's the simplest, cheapest first step.

## 🗣️ How to answer in an interview

> "Vertical scaling means making one machine bigger, with more CPU and memory. It's simple and needs no code changes, but it has a ceiling and the machine is a single point of failure. Horizontal scaling means adding more machines behind a load balancer. It has no real ceiling and survives one machine failing, but the app servers must be stateless, so sessions go to Redis or a token, files go to S3, and shared caches go to Redis. For Node.js, I also run one process per CPU core with cluster or PM2. On serverless platforms like Lambda, horizontal scaling is automatic. The database is usually the hardest part, so I scale it up first, then add indexes, caching and read replicas, and shard only as a last step."

[FILL IN: a real scaling problem you saw at SkillKeepr, if any.]

## 🔁 Follow-up questions

### What is a single point of failure?

One part whose failure brings the whole system down, like one server, one database or one load balancer. You remove it by having more than one.

### How do you scale WebSocket servers horizontally?

Each user is connected to one server, so servers need a shared channel to send messages to users on other servers, like a Redis adapter or pub/sub. See [real-time at scale](topic:system-design/realtime-at-scale).

### When is vertical scaling the right choice?

For small or medium apps, for databases (before replicas or sharding), and when you need a quick fix today.

### What does auto-scaling watch?

Usually CPU use, memory, request count or queue length. When the number crosses a limit, it adds servers. When it drops, it removes them.

## ✅ Quick check

### 1. You add 4 more servers behind a load balancer. Which type of scaling is this?

:::answer
**Horizontal scaling** (scaling out).
:::

### 2. After adding a second server, users get logged out randomly. Most likely cause?

- A) The load balancer is slow
- B) Sessions are stored in one server's memory
- C) The database is too big

:::answer
**B.** The next request goes to the other server, which doesn't have the session. Store sessions in Redis or use a signed token.
:::

### 3. True or false: horizontal scaling removes the single point of failure of one app server.

:::answer
**True** — as long as you have more than one server and the load balancer itself is also redundant.
:::
