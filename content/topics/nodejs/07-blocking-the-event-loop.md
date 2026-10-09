---
title: Blocking the event loop and how to avoid it
stack: nodejs
order: 7
level: Intermediate
mustKnow: true
askedFrequency: very common
summary:
  - The event loop is "blocked" when long synchronous work keeps the single JavaScript thread busy. Then no other request, timer or callback can run.
  - "Common causes: big loops, sorting huge arrays, *Sync functions (readFileSync, pbkdf2Sync), JSON.parse on huge data, slow regular expressions."
  - "Signs: every route gets slow at the same time, one CPU core at 100%, timers fire late."
  - "Fixes: worker threads, a job queue (BullMQ), splitting work into chunks with setImmediate, streams for big files, async versions of functions."
  - Measure it with perf_hooks.monitorEventLoopDelay() and profile with node --cpu-prof or Chrome DevTools.
cards:
  - q: What does "blocking the event loop" mean?
    a: Long synchronous work keeps Node's single JavaScript thread busy, so no other request, timer or callback can run until it finishes.
  - q: Name four things that commonly block the event loop.
    a: Big CPU loops, *Sync functions like readFileSync, JSON.parse/stringify on huge data, and slow (catastrophic) regular expressions.
  - q: How do you notice a blocked event loop in production?
    a: All routes get slow at once, CPU is at 100% on one core, health checks time out, and event loop delay metrics go up.
  - q: How do you run CPU-heavy work without blocking?
    a: Move it to worker_threads, send it to a background job queue, split it into chunks with setImmediate, or move it to a separate service.
  - q: What is ReDoS?
    a: Regular expression Denial of Service. A badly written regex can take seconds on certain input, blocking the loop. Attackers can send that input on purpose.
---

## 💡 What is it?

Node runs your JavaScript on **one thread**. "Blocking the event loop" means some code keeps that thread busy for a long time.

While the thread is busy, **nothing else can run**. No other request is answered, no timer fires, no database reply is handled. Every user waits.

This happens with long **synchronous** work. That's code that runs from start to end without pausing, like a huge loop or `fs.readFileSync`.

## 🏠 Real-life example

Think of **a railway ticket counter with one clerk**.

Normally the line moves fast. The clerk prints a ticket, takes money, and calls the next person. If a ticket needs a phone call, the clerk asks someone else to call and serves the next person meanwhile.

Then one customer asks the clerk to **count 10,000 coins by hand**, right at the counter. The clerk starts counting. The whole line stops. Even people who just want one simple ticket wait 30 minutes.

- The **clerk** = the single JavaScript thread.
- **Quick tickets** = normal, short request handlers.
- **"Someone else makes the phone call"** = non-blocking I/O.
- **Counting 10,000 coins** = CPU-heavy synchronous work. It blocks the loop.
- **The fix** = send the coin counting to a back room, with a separate worker. That's a [worker thread](topic:nodejs/worker-threads) or a job queue.

## 🧑‍💻 Code example

Save this as `block.js`. Run it with `node block.js`.

```js
const start = Date.now();                                   // remember when the program started (in milliseconds)

const timer = setInterval(() => {                           // try to print a "tick" every 100 ms
  console.log('tick at', Date.now() - start, 'ms');         // show how many ms have passed since the start
}, 100);                                                    // 100 = repeat every 100 milliseconds

setTimeout(() => {                                          // after 300 ms, do some heavy CPU work
  console.log('--- heavy work starts ---');                 // mark the start of the blocking part
  const end = Date.now() + 2000;                            // plan to stay busy for 2000 ms (2 seconds)
  while (Date.now() < end) {}                               // a busy loop: the thread can do NOTHING else for 2 s
  console.log('--- heavy work ends ---');                   // mark the end of the blocking part
}, 300);                                                    // 300 = wait 300 ms before starting

setTimeout(() => clearInterval(timer), 3000);               // stop the ticks after 3 seconds so the program ends
```

**Output** (your numbers will be slightly different):

```text
tick at 101 ms
tick at 202 ms
--- heavy work starts ---
--- heavy work ends ---
tick at 2303 ms
tick at 2404 ms
tick at 2505 ms
...
```

**What to notice:** the ticks should come every 100 ms. But between 300 ms and 2300 ms there are **no ticks at all**. The busy loop blocked the event loop. In a real server, every request in those 2 seconds would wait.

## 🔍 Deeper version

**What usually blocks the loop:**

| Cause | Example | Better way |
|---|---|---|
| Sync I/O | `fs.readFileSync`, `execSync` in a route | `fs.promises`, `exec`, streams |
| Sync crypto | `crypto.pbkdf2Sync`, `bcrypt.hashSync` | async versions (they use the thread pool) |
| Huge JSON | `JSON.parse` / `JSON.stringify` of 50 MB | stream parsing, smaller payloads, pagination |
| Big CPU loops | building reports, sorting 1M items | worker thread, job queue, database aggregation |
| Slow regex | `/(a+)+$/` on long input (ReDoS) | safe patterns, input length limits |
| Big in-memory work | loading a whole file to change it | [streams](topic:nodejs/streams) |

**How to detect it:**
- **Symptoms:** *all* routes slow at the same time (not just one), one core at 100% CPU, health checks timing out, timers firing late.
- **Measure the delay:**

```js
const { monitorEventLoopDelay } = require('node:perf_hooks'); // built-in performance tools
const h = monitorEventLoopDelay({ resolution: 20 });          // sample the loop delay every 20 ms
h.enable();                                                    // start measuring
setInterval(() => {                                            // every 5 seconds, report
  console.log('p99 loop delay (ms):', (h.percentile(99) / 1e6).toFixed(1)); // nanoseconds → ms
  h.reset();                                                   // start a fresh measurement window
}, 5000);                                                      // 5000 ms = 5 seconds
```

- **Find the slow function:** run `node --cpu-prof app.js` and open the profile in Chrome DevTools. Or use `node --inspect` with the Performance tab, or clinic.js. See [Profiling and debugging](topic:nodejs/profiling-and-debugging).

**How to fix it:**
1. **Use async APIs** for I/O and crypto. Never `*Sync` inside a request.
2. **Move CPU work to a worker thread** (`worker_threads`) or a worker pool library like Piscina.
3. **Use a job queue** (BullMQ + Redis). The API responds "accepted", and a separate worker process does the heavy job.
4. **Split the work into chunks** and yield between them with `setImmediate`:

```js
function processInChunks(items, handle, done) {     // handle each item without blocking for long
  let i = 0;                                        // position in the list
  function nextChunk() {                            // do one small piece of the work
    const stop = Math.min(i + 1000, items.length);  // 1000 items per chunk
    for (; i < stop; i++) handle(items[i]);         // process this chunk
    if (i < items.length) setImmediate(nextChunk);  // let I/O run, then continue
    else done();                                    // all items finished
  }
  nextChunk();                                      // start with the first chunk
}
```

5. **Do heavy data work in the database**, like a MongoDB aggregation, instead of loading everything into Node.
6. **Limit input sizes**: body size limits, pagination, and max lengths for strings tested with regex.

**Cluster is not a fix for blocking.** Running several processes ([cluster or PM2](topic:nodejs/cluster-and-pm2)) spreads users across cores. But each process can still block its own users. You still need to remove the blocking code.

## 🎯 Why do we use it?

Avoiding a blocked loop is what keeps a Node server **fast for everyone**. One slow report request should never freeze login, payments or health checks for all other users.

If health checks time out, platforms like Kubernetes or Railway may even **restart** your app. That makes things worse.

## ⚠️ Common mistakes

- **Using `*Sync` functions inside routes**, because they're easier to write.
- **Thinking `async` makes code non-blocking.** An `async` function with a big `for` loop inside still blocks. Only the `await` points give the thread back.
- **Loading huge files or query results into memory**, then looping over them. Use streams, pagination or database aggregations.
- **Adding more servers instead of fixing the code.** More instances hide the problem but don't remove it.

## 🗣️ How to answer in an interview

> "Blocking the event loop means some synchronous code keeps Node's single JavaScript thread busy for a long time. While it runs, no other request, timer or callback can be handled, so every user waits.
>
> Common causes are `*Sync` functions like `readFileSync` or `pbkdf2Sync` inside request handlers, big CPU loops, `JSON.parse` on very large payloads, and badly written regular expressions.
>
> I notice it when all routes slow down at the same time and one core is at 100%. I'd measure event loop delay with `monitorEventLoopDelay` and profile with `--cpu-prof` to find the hot function.
>
> To fix it, I use async APIs for I/O and crypto, move CPU-heavy work to worker threads or a background queue like BullMQ, use streams and pagination for big data, and push heavy data work into the database with aggregations."

[FILL IN: if you ever saw or fixed a slow endpoint or blocking code at SkillKeepr, add one line here. Only if it's true.]

## 🔁 Follow-up questions

### Does an `async` function avoid blocking?

No. `async` only means the function returns a promise. The code between `await`s still runs synchronously on the main thread. A huge loop inside an `async` function blocks just like a normal function.

### What is ReDoS, and how do you prevent it?

"Regular expression Denial of Service." Some regex patterns, like nested `(a+)+`, take exponential time on certain inputs. Attackers can send such input to freeze your server. Prevent it with simple patterns, input length limits, and tools that check regexes for this problem.

### Why is `bcrypt.hash` better than `bcrypt.hashSync` in an API?

The async version runs the slow hashing on a background thread. The main thread stays free for other requests. `hashSync` runs on the main thread and blocks everyone during each login or signup.

### How does a job queue help?

The API puts a job in the queue (for example, in Redis with BullMQ) and responds right away. A separate worker process picks up the job and does the heavy work. If it fails, the queue can retry it. The API server never blocks.

## ✅ Quick check

### 1. Which of these blocks the event loop?

- A) `await db.collection('users').find().toArray()`
- B) `const hash = crypto.pbkdf2Sync(pw, salt, 300000, 64, 'sha512')`
- C) `await fetch('https://api.stripe.com/...')`

:::answer
**B.** `pbkdf2Sync` does heavy CPU work on the main thread. A and C are non-blocking I/O. (A can still be slow if it returns a huge result, but the waiting itself doesn't block.)
:::

### 2. True or false: wrapping a long `for` loop inside an `async` function stops it from blocking.

:::answer
**False.** The loop still runs on the main thread from start to end. Only `await` gives the thread back. Use a worker thread or split the loop into chunks.
:::

### 3. Your API's `/login`, `/jobs` and `/health` routes all become slow at the same moment, every time someone downloads a big report. What is the most likely cause?

:::answer
**The report code blocks the event loop.** It probably builds the report with sync CPU work or loads huge data into memory. Move it to a worker thread or job queue, or stream it.
:::
