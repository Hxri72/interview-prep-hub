---
template: scenario
title: The server becomes unresponsive under load
stack: debugging
order: 19
level: Advanced
mustKnow: true
askedFrequency: common
summary:
  - When traffic grows, every request becomes slow — even /health. One CPU core sits at 100%.
  - The usual cause is synchronous CPU work (big loops, readFileSync, huge JSON.parse, slow regex) blocking the single event loop thread.
  - Detect with event-loop delay metrics; find the exact function with a CPU profile (node --inspect or clinic.js).
  - Fix by making work async, moving CPU work to worker threads or a job queue, and running several Node processes (cluster/PM2 or more containers).
  - Prevent with load tests, event-loop-lag alerts and a rule of no *Sync calls inside request handlers.
cards:
  - q: Every endpoint gets slow at the same time under load, even /health. What do you suspect?
    a: The event loop is blocked. Some synchronous CPU-heavy code is holding the single JavaScript thread, so no other request can run.
  - q: How do you confirm the event loop is blocked?
    a: Measure event loop delay (perf_hooks.monitorEventLoopDelay or an APM tool). High delay plus one CPU core at 100% means blocking code.
  - q: How do you find which function is blocking?
    a: Take a CPU profile — node --inspect with Chrome DevTools, or clinic.js flame graphs — while the load is on. The widest bar is the culprit.
  - q: Name three fixes.
    a: Replace sync calls with async ones, move CPU-heavy work to worker threads or a background queue, and run more Node processes (cluster, PM2, more containers).
  - q: Why doesn't adding more RAM fix it?
    a: The problem is one busy CPU thread, not memory. More RAM doesn't free the event loop.
---

## 💡 What is it?

Traffic goes up, and the whole server **freezes**. Every request is slow. Even a tiny `/health` route takes seconds or times out.

The CPU shows **one core at 100%**, while the other cores are idle.

In Node.js this almost always means the **[event loop](glossary:event-loop) is blocked**. Your JavaScript runs on one [thread](glossary:thread). If one piece of code keeps that thread busy, nobody else gets a turn.

## 🏠 Real-life example

Think of a **school office with only one clerk**.

Usually the clerk is fast. They take a form, send it to the right teacher, and serve the next student.

One day, a student asks the clerk to **count 10,000 coins by hand**. While the clerk counts, the line stops. Even students who only want to ask "where is room 5?" must wait.

- The **one clerk** = the single JavaScript thread.
- **Counting coins** = synchronous CPU work, like a huge loop or `JSON.parse` on giant data.
- **The long line** = all the waiting requests.
- **Giving the coins to a back room** = moving the work to a [worker thread](topic:nodejs/worker-threads) or a job queue.
- **Hiring more clerks** = running several Node processes.

## 🔎 Detect

Signs:

- **All routes** get slow together, not just one. (One slow route is a different problem — see [slow endpoint](topic:debugging/slow-endpoint).)
- **CPU at 100% on one core** under load.
- **Health checks fail**, so the load balancer or Kubernetes restarts the app.
- **Event loop delay** is high. This is the time a callback waits before it can run.

You can watch event loop delay with Node's built-in tool:

```js
const { monitorEventLoopDelay } = require('node:perf_hooks');
const h = monitorEventLoopDelay({ resolution: 20 });
h.enable();
setInterval(() => console.log('p99 delay ms:', h.percentile(99) / 1e6), 5000);
```

A healthy app shows a few milliseconds. A blocked app shows hundreds or thousands.

## 🐞 Debug

**Step 1 — Reproduce under load.** Use a load tool like `autocannon` or `k6` against a staging server.

**Step 2 — Take a CPU profile while the load is on.**
- `node --inspect app.js`, then open Chrome DevTools → **Performance** or **Profiler**, record for 10 seconds.
- Or use `clinic flame -- node app.js` to get a **flame graph**.

The **widest bar** in the flame graph is the function using the most CPU. See [profiling and debugging](topic:nodejs/profiling-and-debugging).

**Step 3 — Look for the usual suspects:**
- `fs.readFileSync`, `crypto.pbkdf2Sync`, `zlib.gzipSync` inside a request
- `JSON.parse` / `JSON.stringify` on very large data
- big loops, sorting huge arrays in memory
- a slow regular expression on long user input
- building a big PDF or Excel file inside the request

**Step 4 — Check the thread pool too.** Many parallel `bcrypt` or `fs` calls can fill libuv's small [thread pool](glossary:thread-pool) (4 threads by default). Then file and crypto work queues up.

## 🔧 Fix

**Broken: heavy synchronous work inside the request.**

```js
app.get('/reports/applications', (req, res) => {                  // route that builds a report
  const raw = fs.readFileSync('./big-export.json', 'utf8');        // SYNC read: the whole thread waits for the disk
  const rows = JSON.parse(raw);                                    // parse a huge string: blocks the thread for seconds
  const total = rows.reduce((sum, r) => sum + r.score, 0);         // big loop over every row, still blocking
  res.json({ total });                                             // only now can any other request run
});                                                                // end of the route
```

**Fixed: send the heavy work to a worker thread.** The main thread stays free.

```js
// report-worker.js — runs on a separate thread
const { parentPort, workerData } = require('node:worker_threads'); // tools to talk to the main thread
const fs = require('node:fs');                                     // file system module
const rows = JSON.parse(fs.readFileSync(workerData.file, 'utf8')); // heavy work is OK here: this is NOT the main thread
const total = rows.reduce((sum, r) => sum + r.score, 0);           // the big loop also runs on the worker thread
parentPort.postMessage({ total });                                 // send the result back to the main thread
```

```js
// app.js — the main thread
const { Worker } = require('node:worker_threads');                 // used to start a worker thread
app.get('/reports/applications', (req, res, next) => {             // same route as before
  const worker = new Worker('./report-worker.js', {                // start the worker with the heavy job
    workerData: { file: './big-export.json' },                     // data passed to the worker
  });                                                              // end of the worker options
  worker.once('message', (msg) => res.json(msg));                  // when the worker finishes, send its result
  worker.once('error', next);                                      // if the worker crashes, pass the error to Express
});                                                                // the main thread is free while the worker counts
```

For very heavy or long jobs, a **job queue** is often better: reply `202 Accepted` at once, process the job in the background (for example BullMQ), and tell the user when it's ready.

**Fixes by cause:**

| Cause found | Fix |
|---|---|
| `*Sync` calls in requests | Use the async version (`fs.promises.readFile`) |
| CPU-heavy calculation | [Worker threads](topic:nodejs/worker-threads) or a background job queue |
| Huge JSON | [Stream](topic:nodejs/streams) it, paginate, or send less data |
| Slow regex on user input | Limit input length, rewrite the regex |
| One process can't keep up | Run more processes: [cluster / PM2](topic:nodejs/cluster-and-pm2), or more containers behind a load balancer |

## 🛡️ Prevent

- **Load test** before big releases (autocannon, k6).
- **Alert on event loop delay** and on CPU per process.
- **Code review rule:** no `*Sync` calls and no big loops inside request handlers.
- Put **limits** on input sizes and page sizes.
- Keep heavy jobs (reports, imports, PDF building) in **background workers** from the start.

## 🗣️ How to answer in an interview

**Short version (20 seconds):**

> "If every route slows down together and one CPU core is at 100%, I suspect a blocked event loop. I confirm it with event-loop delay metrics, then take a CPU profile with --inspect or clinic.js to find the function. The fix is to make sync code async, move CPU work to worker threads or a queue, and run more processes."

**Full version:**

> "Node runs my JavaScript on one thread. So when the whole server freezes under load — even the health check — the first thing I suspect is synchronous CPU work blocking the event loop.
>
> I confirm it two ways: one CPU core at 100%, and high event loop delay, which I can read with perf_hooks.monitorEventLoopDelay or an APM tool.
>
> Then I reproduce it with a load test and take a CPU profile with node --inspect or a clinic.js flame graph. The widest bar shows the function. The usual suspects are readFileSync, a huge JSON.parse, a big loop or sort, or a slow regex.
>
> The fix depends on the cause: use async APIs, stream large data, move CPU work to a worker thread or a background queue, and run several Node processes with cluster, PM2 or more containers. Then I load-test again and add an alert on event-loop lag."

[FILL IN: a real case where a Node service froze under load and what you changed — only if it happened.]

## 🔁 Follow-up questions

### Why does `/health` get slow if it does nothing?

Because it waits in the same line. The single thread is busy with the heavy job, so even a tiny route can't start until that job finishes.

### Worker threads vs cluster — what is the difference?

**Cluster / PM2** run several copies of the whole app, one per CPU core, to handle more requests. **Worker threads** run one heavy task in the background inside one app. Use cluster for more traffic, workers for CPU-heavy jobs. See [worker threads](topic:nodejs/worker-threads).

### Would async/await fix a CPU-heavy loop?

No. `async`/`await` helps when you are **waiting** (for the database or network). A loop that calculates is still running on the main thread. It must move to a worker or a queue.

### How is this different from a memory leak?

A blocked loop shows **high CPU** and freezes quickly under load. A memory leak shows **memory growing slowly** over hours until a crash. See [server memory leak](topic:debugging/server-memory-leak).

## ✅ Quick check

### 1. Under load, all routes are slow, and CPU on one core is 100%. RAM is fine. Most likely cause?

- A) Memory leak
- B) Blocked event loop
- C) Slow network

:::answer
**B) Blocked event loop.** Synchronous CPU work is holding the single JavaScript thread.
:::

### 2. Does wrapping a CPU-heavy loop in an `async` function stop it from blocking?

:::answer
**No.** `async` only helps while waiting for I/O. The loop still runs on the main thread. Move it to a worker thread or a background job.
:::

### 3. Which tool shows the function using the most CPU?

:::answer
A **CPU profile** — `node --inspect` with Chrome DevTools, or a **clinic.js flame graph**. The widest bar is the most expensive function.
:::
