---
template: scenario
title: Server memory grows until it crashes
stack: debugging
order: 20
level: Advanced
mustKnow: true
askedFrequency: common
summary:
  - Memory goes up slowly over hours or days, never comes back down, and the process finally crashes with "JavaScript heap out of memory".
  - "Common causes: an unbounded in-memory cache, event listeners or timers never removed, big arrays kept in module scope, closures holding large data, loading whole files into memory."
  - Detect with memory graphs and process.memoryUsage(); debug by comparing two or three heap snapshots taken minutes apart.
  - Fix the cause — cap or expire caches (LRU + TTL), remove listeners, clear timers, stream big files.
  - Prevent with memory alerts, soak tests and bounded data structures by default.
cards:
  - q: What does a memory leak look like on a graph?
    a: A saw-tooth or line that keeps climbing. After each garbage collection the low point is higher than before, until the process crashes.
  - q: How do you find what is leaking?
    a: Take 2–3 heap snapshots a few minutes apart (node --inspect + Chrome DevTools Memory tab) and compare them. Look for objects whose count keeps growing.
  - q: Name 4 common causes of a Node.js memory leak.
    a: An in-memory cache with no limit, listeners added on every request but never removed, setInterval never cleared, and global arrays or Maps that only grow.
  - q: How do you fix an unbounded cache?
    a: Give it a maximum size and an expiry time (an LRU cache with TTL), or move the cache to Redis.
  - q: Why is restarting the server not a real fix?
    a: It only hides the leak. Memory will climb again, and the crash will come back. Find and remove the cause.
---

## 💡 What is it?

The server works fine at first. But its **memory keeps growing** — over hours or days — and never goes back down.

Finally the process crashes with an error like `FATAL ERROR: JavaScript heap out of memory`. It restarts, and the cycle starts again.

This is a **[memory leak](glossary:memory-leak)**. Your code keeps a link to data it no longer needs, so [garbage collection](glossary:garbage-collection) can't free it.

## 🏠 Real-life example

Think of a **classroom cupboard**.

Every day, students put their old papers in the cupboard "just in case". Nobody ever throws anything away. After a few weeks the cupboard is full, and the door won't close.

- The **cupboard** = the server's memory (the [heap](glossary:heap)).
- **Old papers** = data your code keeps but never uses again.
- **"Just in case"** = a cache, list or listener that only grows.
- The **cleaner** = garbage collection. They only remove papers that **nobody is holding**. If a paper is still in the cupboard, the cleaner can't throw it away.
- **Cupboard door won't close** = the crash.
- **The fix** = a rule like "keep only the last 100 papers" (a size limit), or "throw away papers older than a week" (an expiry time).

## 🔎 Detect

- A **memory graph** (from your hosting or APM tool) climbs steadily. After each garbage collection, the lowest point is **higher** than the last one.
- Crash logs show `heap out of memory`, or the container is killed for using too much memory (an "OOM kill").
- The app **restarts on a pattern**, for example every 2 days.

Quick check from inside the app:

```js
setInterval(() => {
  const m = process.memoryUsage();
  console.log('heapUsed MB:', Math.round(m.heapUsed / 1024 / 1024), 'rss MB:', Math.round(m.rss / 1024 / 1024));
}, 60000);
```

If `heapUsed` keeps rising under steady traffic, something is leaking.

## 🐞 Debug

**Step 1 — Reproduce.** Run the app locally or in staging, and send steady traffic with a load tool.

**Step 2 — Take heap snapshots.** Start with `node --inspect app.js`. Open Chrome → `chrome://inspect` → **Memory** tab:
1. Take snapshot 1.
2. Send traffic for a few minutes.
3. Take snapshot 2, then later snapshot 3.

**Step 3 — Compare them.** Use the **Comparison** view. Look for object types whose count **keeps growing** between snapshots. The **Retainers** panel shows *who* is holding them — often a `Map`, an array or a listener list.

See [memory and leaks](topic:nodejs/memory-and-leaks) and [profiling and debugging](topic:nodejs/profiling-and-debugging).

**Step 4 — Check the usual suspects:**
- a cache object or `Map` at the top of a file that only gets new keys
- `emitter.on(...)` called inside a request handler (a new [listener](glossary:listener) every request)
- `setInterval` started but never cleared
- arrays like `requestLog.push(...)` that never shrink
- reading whole large files or exports into memory instead of [streaming](topic:nodejs/streams)

Node also warns you with `MaxListenersExceededWarning` when more than 10 listeners pile up on one [event](glossary:event). Treat that warning as a leak alarm.

## 🔧 Fix

**Broken: two classic leaks.**

```js
const cache = new Map();                                           // module-level cache: lives as long as the process
app.get('/candidates/:id', async (req, res) => {                   // route: get one candidate
  if (!cache.has(req.params.id)) {                                 // not cached yet?
    cache.set(req.params.id, await Candidate.findById(req.params.id)); // add it… and NEVER remove it → grows forever
  }                                                                // end of the cache check
  jobEvents.on('updated', () => console.log('updated'));           // a NEW listener on every request → piles up forever
  res.json(cache.get(req.params.id));                              // reply with the cached candidate
});                                                                // end of the route
```

**Fixed: a bounded cache with expiry, and no per-request listener.**

```js
const { LRUCache } = require('lru-cache');                         // npm install lru-cache — a cache with limits
const cache = new LRUCache({ max: 500, ttl: 60_000 });             // max 500 items; each expires after 60,000 ms (1 minute)
jobEvents.on('updated', () => console.log('updated'));             // add the listener ONCE, at startup, not per request
app.get('/candidates/:id', async (req, res) => {                   // same route
  let candidate = cache.get(req.params.id);                        // try the cache first
  if (!candidate) {                                                // not in the cache (or expired)
    candidate = await Candidate.findById(req.params.id).lean();    // read from the database as a plain object
    cache.set(req.params.id, candidate);                           // store it; the oldest item is dropped when full
  }                                                                // end of the cache check
  res.json(candidate);                                             // reply
});                                                                // end of the route
```

**Fixes by cause:**

| Cause found | Fix |
|---|---|
| Cache that only grows | LRU cache with `max` + `ttl`, or move it to Redis |
| Listener added per request | Add it once, or remove it with `off()` / use `once()` |
| `setInterval` never cleared | Keep the id and `clearInterval(id)` when done or on shutdown |
| Global arrays of logs or requests | Don't keep them in memory — write logs out |
| Whole files in memory | [Stream](topic:nodejs/streams) them |

## 🛡️ Prevent

- **Alert on memory**, for example "heap used above 80% for 10 minutes".
- Run **soak tests**: steady load for a few hours, then check that memory stays flat.
- Make **bounded caches** the default. Every cache needs a size limit or an expiry time.
- In code review, flag `.on(` inside request handlers and any module-level array or `Map` that only grows.
- Don't just raise `--max-old-space-size`. That only delays the crash.

## 🗣️ How to answer in an interview

**Short version (20 seconds):**

> "A climbing memory graph that never drops back means a leak. I reproduce it, take two or three heap snapshots a few minutes apart, and compare them to see which objects keep growing and who holds them. Usually it's an unbounded cache, a listener added per request, or a timer never cleared. I fix the cause, then run a soak test to confirm memory stays flat."

**Full version:**

> "First I confirm it's a leak and not just high usage: on the memory graph, the low point after each garbage collection keeps rising, and the process eventually dies with heap out of memory.
>
> Then I reproduce it with steady traffic in staging. I start Node with --inspect and take two or three heap snapshots a few minutes apart in Chrome DevTools. The comparison view shows which object types keep growing, and the retainers panel shows what is holding them.
>
> The usual causes are a module-level cache or Map with no limit, event listeners added inside a request handler, setInterval never cleared, or reading big files fully into memory. The fixes are an LRU cache with a size limit and TTL — or Redis — adding listeners once, clearing timers, and streaming large data.
>
> Restarting the server only hides the leak, so after the fix I run a soak test and add a memory alert."

[FILL IN: a real memory problem you saw in a Node service — only if it happened.]

## 🔁 Follow-up questions

### What is the difference between `heapUsed` and `rss`?

`heapUsed` is memory used by JavaScript objects. `rss` is the total memory of the whole process, including buffers and native code. A JavaScript leak shows in `heapUsed`. Big [buffers](glossary:buffer) show more in `rss`.

### Can a closure cause a leak?

Yes. A [closure](glossary:closure) keeps its outer variables alive. If a long-living function (like a listener) closes over a big object, that object can't be freed. See [closures](topic:javascript/closures).

### Why not just increase `--max-old-space-size`?

It gives the process more memory, so the crash comes later. But the leak is still there. It's fine for apps that truly need more memory, not as a leak fix.

### How do you find leaks in production safely?

Taking a heap snapshot pauses the process, so take it on **one** instance taken out of the load balancer, or reproduce the leak in staging with the same traffic pattern.

## ✅ Quick check

### 1. Memory rises from 200 MB to 1.5 GB over two days, then the app crashes. After restart it starts at 200 MB again. What is this?

:::answer
A **memory leak**. Memory that should be freed is still being held. Restarting only resets it; the cause is still in the code.
:::

### 2. What is wrong here?

```js
app.get('/x', (req, res) => {             // a route
  bus.on('done', () => res.end());        // add a listener
});
```

:::answer
A **new listener is added on every request** and never removed. Listeners pile up (Node warns with `MaxListenersExceededWarning`) and keep their closures — and `res` objects — in memory. Use `once()`, remove the listener, or add it only once at startup.
:::

### 3. Which change stops an in-memory cache from leaking?

- A) Use `const` instead of `let`
- B) Give it a maximum size and an expiry time
- C) Call `JSON.stringify` on values

:::answer
**B.** A bounded cache (for example an LRU cache with `max` and `ttl`) drops old items, so memory stays flat.
:::
