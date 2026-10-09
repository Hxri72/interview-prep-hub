---
title: Node.js performance tips
stack: nodejs
order: 30
level: Advanced
mustKnow: false
askedFrequency: common
summary:
  - Measure first. Find the slow part with timing logs, explain() on queries, and a CPU profile — don't guess.
  - Most slowness is in the database or external calls. Fix with indexes, selecting only needed fields, lean(), and avoiding N+1 queries.
  - Run independent async work in parallel with Promise.all instead of awaiting one after another.
  - Cache hot data (Redis, with a TTL), compress responses, and paginate big lists.
  - Never block the event loop. Move heavy CPU work to worker threads or a queue, and use streams for big files.
cards:
  - q: What is the first step when an API is slow?
    a: Measure. Add timing logs per step (DB, external calls, processing) to find where the time actually goes.
  - q: What is the N+1 query problem?
    a: You fetch a list (1 query), then run one more query for each item (N queries). Fix it with one query using $in, $lookup or a join.
  - q: How does Promise.all improve speed?
    a: It starts independent async tasks at the same time, so total time ≈ the slowest task instead of the sum of all tasks.
  - q: What does Mongoose lean() do?
    a: It returns plain JavaScript objects instead of full Mongoose documents, which is faster and uses less memory for read-only data.
  - q: Name three ways to make a Node API faster without changing hardware.
    a: Add the right DB index, cache frequent results in Redis, run independent calls in parallel, paginate, compress responses, and avoid blocking the event loop.
---

## 💡 What is it?

**Performance** means how fast your app answers, and how many users it can serve at once.

Most slow Node apps are not slow because of Node. They are slow because of **waiting**: slow database queries, slow external APIs, or too much data.

The golden rule: **measure first, then fix the slowest part**.

## 🏠 Real-life example

Think of **making breakfast for your family** in the morning.

- **Slow way:** boil water. Wait. Then make toast. Wait. Then fry eggs. Wait. Total: 20 minutes.
- **Fast way:** start the water, the toast and the eggs **at the same time**. Total: 8 minutes.
- **Even faster:** keep **boiled eggs ready in the fridge** from yesterday.
- **Smart shopping:** buy all items in **one trip** to the shop, not one trip per item.

Here's how this maps to a Node app:
- **Waiting for each step** = `await` one call after another.
- **Doing all at once** = `Promise.all`.
- **Eggs ready in the fridge** = a cache (Redis).
- **One shopping trip** = one database query instead of many (fixing N+1).
- **Timing each step with a clock** = measuring before you fix.

## 🧑‍💻 Code example

Save this as `parallel.js`. Run it with `node parallel.js`.

```js
const wait = (ms, name) =>                                  // a fake slow call, e.g. a database or API request
  new Promise((resolve) => setTimeout(() => resolve(name), ms)); // finishes after ms milliseconds with the value name

async function oneByOne() {                                 // the slow way
  const start = Date.now();                                 // remember the start time
  const user = await wait(300, 'user');                     // wait 300 ms for the user...
  const jobs = await wait(300, 'jobs');                     // ...THEN wait 300 ms for jobs...
  const stats = await wait(300, 'stats');                   // ...THEN wait 300 ms for stats
  console.log('one by one:', Date.now() - start, 'ms', [user, jobs, stats]); // about 900 ms in total
}                                                           // end of oneByOne

async function together() {                                 // the fast way
  const start = Date.now();                                 // remember the start time
  const [user, jobs, stats] = await Promise.all([           // start all three at the SAME time and wait for all
    wait(300, 'user'),                                      // 300 ms
    wait(300, 'jobs'),                                      // 300 ms, running at the same time
    wait(300, 'stats'),                                     // 300 ms, running at the same time
  ]);                                                       // end of the list of tasks
  console.log('together:  ', Date.now() - start, 'ms', [user, jobs, stats]); // about 300 ms in total
}                                                           // end of together

oneByOne().then(together);                                  // run the slow version, then the fast one
```

**Output (numbers may be a few ms different):**

```text
one by one: 903 ms [ 'user', 'jobs', 'stats' ]
together:   301 ms [ 'user', 'jobs', 'stats' ]
```

Same work, three times faster. This only works when the calls **don't depend on each other**.

## 🔍 Deeper version

**Step 1: measure.** Without numbers, you'll fix the wrong thing.
- Timing logs around each step, with a request ID.
- `explain('executionStats')` on MongoDB queries (look for `COLLSCAN` and a high `totalDocsExamined`).
- APM / monitoring for p95 latency (the time that 95% of requests are faster than).
- A CPU profile when the time is in your own code. See [profiling and debugging](topic:nodejs/profiling-and-debugging).
- A load test (autocannon, k6) before and after the change.

**Step 2: fix the data layer first.** This is where most time goes.

| Problem | Fix |
|---|---|
| query scans the whole collection | add a matching (compound) index |
| returns big documents | `select()` only needed fields |
| Mongoose documents are heavy | `.lean()` for read-only data |
| N+1 queries in a loop | one query with `$in`, `$lookup` or a SQL join |
| `skip(100000)` is slow | cursor-based pagination on `_id` or `createdAt` |
| a new DB connection per request | reuse one connection pool |

**Step 3: async patterns.**
- Use `Promise.all` for independent calls. Use `Promise.allSettled` when some may fail.
- Don't `await` inside a `for` loop when the items are independent. But don't fire 10,000 calls at once either. Use a limit (for example `p-limit`) or batches.
- Always set **timeouts** on outgoing HTTP calls. One slow partner API can hold all your requests.
- Reuse HTTP connections (keep-alive). Node's built-in `fetch` does this by default.

**Step 4: do less work.**
- **Cache** frequent, rarely changing data in Redis with a TTL (the cache-aside pattern). Cache in memory only for small, fixed data.
- **Paginate** list endpoints. Never return 50,000 rows.
- **Compress** responses (gzip or brotli). Often a reverse proxy or CDN does this.
- Move slow side jobs, like sending emails or making reports, to a **queue** (BullMQ). Reply to the user right away.

**Step 5: protect the event loop.**
- No `*Sync` functions inside request handlers.
- Heavy CPU work (image resizing, big reports, PDF generation) → [worker threads](topic:nodejs/worker-threads) or a separate service.
- Large files → [streams](topic:nodejs/streams), not `readFile`.
- Huge `JSON.parse` / `JSON.stringify` calls block the thread. Send smaller payloads.

**Step 6: scale out.** Use all CPU cores ([cluster or PM2](topic:nodejs/cluster-and-pm2)), or run more instances behind a load balancer. The app must be stateless for this.

**Small things that rarely matter.** Micro-tweaks like `for` vs `forEach` almost never matter for an API. Fix the database and I/O first.

## 🎯 Why do we use it?

Slow pages lose users. A slow API also costs more money, because you need more servers to handle the same traffic.

Good performance work is about **finding the one real bottleneck**. Often a single index or a `Promise.all` turns a 3-second endpoint into a 200 ms one.

## ⚠️ Common mistakes

- **Optimising without measuring.** You spend a day on code that took 2 ms, while the query took 2 seconds.
- **`await` inside a loop** for independent calls. Total time becomes the sum of all calls.
- **Fetching whole documents and then filtering in JavaScript.** Filter and pick fields in the database.
- **Caching without expiry or invalidation.** Users see old data, and memory grows.

## 🗣️ How to answer in an interview

> "I always start by measuring. I add timing logs around each step of the request, like the database call and external APIs, and I look at p95 latency in monitoring. In most cases the time is in the database or in external calls, not in Node itself.
>
> For the database, I check the query with explain. I add the right compound index, select only the needed fields, use lean() for read-only Mongoose queries, and remove N+1 patterns. For list endpoints, I paginate, preferably with a cursor.
>
> In the code, I run independent calls in parallel with Promise.all, add timeouts to external calls, and cache hot data in Redis with a TTL. Heavy work like reports or emails goes to a background queue. And I never block the event loop: CPU-heavy work goes to worker threads, and large files are streamed."

[FILL IN: a real performance fix from SkillKeepr — your resume mentions applying MongoDB indexing so response times held as data grew. Add the details (which query, before/after) only if you know them.]

## 🔁 Follow-up questions

### What is p95 latency and why not use the average?

p95 is the time that 95% of requests are faster than. The average hides slow requests: a few 5-second requests disappear among many fast ones. p95 and p99 show what your slowest users feel.

### When is Promise.all a bad idea?

When the calls depend on each other (you need the user ID before fetching orders). Or when there are thousands of them, because you'd flood the database or the partner API. Then use batches or a concurrency limit.

### How do you decide what to cache?

Data that is read often, changes rarely, and is slow or costly to compute. Set a TTL. Delete or update the cache when the data changes. Include the tenant ID in cache keys in a multi-tenant app.

### How would you fix an endpoint that generates a big report?

Don't make the user wait for it. Put a job in a queue and return a job ID (202 Accepted). A worker builds the report, then notifies the user or lets them download it later.

## ✅ Quick check

### 1. Three independent API calls take 200 ms, 300 ms and 500 ms. About how long do they take with `await` one by one, and with `Promise.all`?

:::answer
**One by one:** about 1000 ms (200 + 300 + 500). **Promise.all:** about 500 ms (the slowest one).
:::

### 2. What's wrong here?

```js
const posts = await Post.find().lean();                         // 1 query for all posts
for (const p of posts) p.author = await User.findById(p.authorId).lean(); // 1 more query PER post
```

:::answer
It's the **N+1 problem**. 100 posts = 101 queries. Collect all `authorId`s and fetch them in **one** query with `User.find({ _id: { $in: ids } })`, or use `$lookup`.
:::

### 3. True or false: switching from `forEach` to a `for` loop is usually the best first fix for a slow API.

:::answer
**False.** Measure first. The slow part is usually the database or an external call, not the loop style.
:::
