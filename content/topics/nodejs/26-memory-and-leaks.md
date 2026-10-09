---
title: Memory, garbage collection and memory leaks
stack: nodejs
order: 26
level: Advanced
mustKnow: true
askedFrequency: common
summary:
  - V8 stores objects in the heap. The garbage collector frees objects that nothing can reach any more.
  - A memory leak is memory you keep holding by mistake, so memory use grows until the app crashes.
  - "Common causes: caches with no limit, event listeners or timers never removed, global arrays that keep growing, closures holding big data."
  - "Find leaks with process.memoryUsage(), heap snapshots (node --inspect + Chrome DevTools) and comparing snapshots over time."
  - "Fix: set limits and TTLs on caches, remove listeners, clear timers, stream big files instead of loading them whole."
cards:
  - q: What is a memory leak in Node.js?
    a: Memory your program keeps holding even though it doesn't need it. Memory use keeps growing until the process slows down or crashes.
  - q: How does garbage collection decide what to free?
    a: It starts from the "roots" (global objects, the current call stack) and marks everything it can reach. Anything it can't reach is freed.
  - q: Name three common causes of memory leaks in Node.
    a: An in-memory cache with no size limit, event listeners or intervals never removed, and global arrays or maps that keep growing.
  - q: How do you find a memory leak?
    a: Watch process.memoryUsage() over time, then take heap snapshots with node --inspect and Chrome DevTools, and compare them to see which objects keep growing.
  - q: What does --max-old-space-size do?
    a: It sets the maximum size of V8's old-generation heap in MB. It's a limit, not a fix for a leak.
---

## 💡 What is it?

Every object your program creates is stored in **memory**. In Node, this area is called the **[heap](glossary:heap)**.

When nothing uses an object any more, Node frees its memory by itself. This is called **[garbage collection](glossary:garbage-collection)**.

A **[memory leak](glossary:memory-leak)** happens when your code keeps holding objects it doesn't need. The garbage collector can't free them. Memory grows and grows until the app becomes slow or crashes.

## 🏠 Real-life example

Think of a **classroom with a cleaner**.

Every evening, the cleaner throws away papers left on the floor. But they never touch papers that are inside a student's bag.

One student keeps every paper they ever get in their bag. Old tests, old notices, wrappers. The cleaner can't throw them away, because they are "in use". Every day, the bag gets heavier. One day, the bag tears.

- The **classroom** = the heap (memory).
- The **cleaner** = the garbage collector.
- **Papers on the floor** = objects nothing uses any more. They get freed.
- **Papers in the bag** = objects your code still points to.
- **The student who keeps everything** = a leak, like a cache that never deletes old items.
- **The bag tearing** = the "heap out of memory" crash.

## 🧑‍💻 Code example

Save this as `leak.js`. Run it with `node leak.js`. Watch the numbers grow. Press Ctrl+C to stop.

```js
const cache = {};                                       // a global object used as a cache — it is never cleaned

function handleRequest(id) {                            // pretend this runs for every web request
  cache[id] = Buffer.alloc(1024 * 1024);                // store 1 MB of data for this id (1024 × 1024 bytes)
}                                                       // end of handleRequest

let id = 0;                                             // a counter that makes a new id each time
setInterval(() => {                                     // run this code again and again
  for (let i = 0; i < 10; i++) handleRequest(id++);     // 10 new "requests" → 10 MB more data
  const mb = process.memoryUsage().rss / 1024 / 1024;   // rss = total memory used by this process, in MB
  console.log(`Memory: ${Math.round(mb)} MB`);          // print it, rounded to a whole number
}, 1000);                                               // 1000 ms = every 1 second
```

**Output (your numbers will differ):**

```text
Memory: 55 MB
Memory: 65 MB
Memory: 76 MB
Memory: 86 MB
...
```

The number never goes down. Nothing ever deletes old keys from `cache`, so the garbage collector can't free them. That's a leak.

**The fix:** give the cache a limit. For example, delete the oldest key when there are more than 100 keys. Or use a library like `lru-cache`, or Redis with a TTL (time to live — how long a key is kept).

## 🔍 Deeper version

**How V8 stores memory.** V8 (the JavaScript engine inside Node) splits memory into:
- the **stack**: small, short-lived values and function calls,
- the **heap**: objects, arrays, strings and closures.

`Buffer` data is stored *outside* the V8 heap. It shows up as `external` and `arrayBuffers` in `process.memoryUsage()`.

**Generational garbage collection.** Most objects die young. So V8 splits the heap into two parts:
- **New space (young generation):** new objects. It's cleaned often and fast (a "scavenge").
- **Old space (old generation):** objects that survived a few cleanings. It's cleaned less often with **mark-and-sweep**: start from the roots, mark everything reachable, free the rest.

A "root" is something always reachable: global variables, the current call stack, active timers and handles. If a chain of references leads from a root to an object, that object stays alive.

**Reading `process.memoryUsage()`:**

| Field | Meaning |
|---|---|
| `rss` | total memory the process uses (heap + code + buffers + more) |
| `heapTotal` | heap size V8 has reserved |
| `heapUsed` | heap actually used by objects — watch this for leaks |
| `external` | memory for C++ objects tied to JS, e.g. Buffers |

**Common leak causes in Node:**
1. **Unbounded caches.** A `Map` or object that only grows.
2. **Event listeners not removed.** `emitter.on(...)` inside a request handler adds a new listener every time. Node warns: `MaxListenersExceededWarning: Possible EventEmitter memory leak detected`.
3. **Timers not cleared.** A `setInterval` keeps its callback, and everything that callback remembers, alive forever.
4. **[Closures](topic:javascript/closures) holding big data.** A long-living function keeps a big object it no longer needs.
5. **Global arrays** used for logs, metrics or "recent requests".
6. **Loading huge files fully** with `readFile` instead of [streams](topic:nodejs/streams). That's not a true leak, but it causes the same crash.

**How to find a leak:**
1. **Confirm it.** Graph `heapUsed` over hours. A sawtooth that goes back down is normal. A line that keeps going up is a leak.
2. **Take heap snapshots.** Start with `node --inspect app.js`. Open `chrome://inspect` → Memory tab → "Heap snapshot". Take one, send traffic, take another.
3. **Compare.** Use the "Comparison" view. Look for object types whose count keeps growing. Then check "Retainers", which shows who is holding them.
4. You can also write a snapshot from code with `v8.writeHeapSnapshot()`, or start Node with `--heapsnapshot-near-heap-limit=1`.

**`--max-old-space-size`.** For example, `node --max-old-space-size=4096 app.js` allows a 4 GB old space. This helps when the app really needs more memory. It **doesn't fix a leak**. It only delays the crash.

:::version[Version note]
Since **Node.js 12**, the default heap limit is based on the machine's available memory, instead of a small fixed number. Very old blog posts say Node "can only use about 1.5 GB". That is no longer true by default.
:::

## 🎯 Why do we use it?

Knowing how memory works helps you keep a server **running for weeks without restarts**.

A leaking server gets slower as the garbage collector works harder. Then it crashes with `JavaScript heap out of memory`. Every user loses their request.

If you understand roots, references and leaks, you can find the cause quickly. You don't just add more memory or restart the server every night.

## ⚠️ Common mistakes

- **Using a plain object or `Map` as a cache with no limit.** Always add a max size or a TTL.
- **Adding listeners inside a request handler** with `on(...)` and never calling `off(...)`. Use `once(...)` or remove them.
- **Fixing leaks by raising `--max-old-space-size`.** It only hides the problem.
- **Reading a big file fully into memory.** Use streams for large files and uploads.

## 🗣️ How to answer in an interview

> "Node uses V8, which stores objects on the heap. The garbage collector frees objects that can't be reached from the roots, like globals and the current call stack. V8 uses generations: new objects are cleaned often, and long-living ones are cleaned with mark-and-sweep.
>
> A memory leak is when my code still holds references it doesn't need, so memory keeps growing until the process crashes. The usual causes are caches with no limit, event listeners or intervals that are never removed, global arrays, and closures that keep big objects.
>
> To find one, I first watch heapUsed over time to confirm the trend. Then I run the app with --inspect, take heap snapshots in Chrome DevTools before and after some traffic, and compare them to see which objects grow and who retains them. Then I fix the cause, like adding a size limit or TTL to the cache, or removing listeners."

[FILL IN: if you ever investigated memory growth in a SkillKeepr service, add one line about what you found. Only if it's true.]

## 🔁 Follow-up questions

### What is the difference between `rss` and `heapUsed`?

`rss` is all the memory the process uses: heap, code, stack and Buffers. `heapUsed` is only the memory used by JavaScript objects on the V8 heap. For JavaScript leaks, watch `heapUsed`. For Buffer leaks, also watch `external`.

### What is a "sawtooth" memory graph?

Memory rises as you create objects. Then it drops when the garbage collector runs. Up, down, up, down — like the teeth of a saw. That's healthy. A leak looks like a sawtooth whose low points keep going higher.

### How do WeakMap and WeakRef help?

A `WeakMap` holds its keys "weakly". If nothing else points to a key object, the garbage collector can free it, and the entry disappears. It's good for attaching extra data to objects without keeping them alive.

### What happens when Node runs out of heap memory?

V8 tries hard to free memory. If it still can't, the process crashes with `FATAL ERROR: ... JavaScript heap out of memory`. A process manager or the platform then restarts it. All requests in progress fail.

## ✅ Quick check

### 1. Is this a memory leak?

```js
app.get('/data', (req, res) => {          // runs on every request
  process.on('exit', () => {});           // adds a new listener each time
  res.send('ok');                         // reply
});
```

:::answer
**Yes.** Every request adds one more `exit` listener that is never removed. Node will warn with `MaxListenersExceededWarning`. Add the listener once, outside the handler.
:::

### 2. Which number should you watch first to spot a JavaScript object leak?

- A) `heapUsed`
- B) CPU usage
- C) the number of files in the project

:::answer
**A) `heapUsed`.** It shows memory used by JavaScript objects. If its low points keep rising over time, you probably have a leak.
:::

### 3. True or false: `--max-old-space-size=8192` fixes a memory leak.

:::answer
**False.** It only gives the heap more room, so the crash comes later. The leak is still there.
:::
