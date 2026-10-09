---
title: The Node.js event loop and its phases
stack: nodejs
order: 5
level: Intermediate
mustKnow: true
askedFrequency: very common
summary:
  - The event loop lets one JavaScript thread serve thousands of requests. Slow work (files, network, database) happens in the background, and its callback runs later.
  - "Each round of the loop has steps (phases): timers → pending callbacks → poll (I/O) → check (setImmediate) → close callbacks."
  - "Microtasks run first, between callbacks: the process.nextTick queue, then promise callbacks (.then / await)."
  - Inside an I/O callback, setImmediate always runs before setTimeout(…, 0).
  - Heavy CPU work (big loops, sync file reads, huge JSON.parse) blocks the loop and freezes every user.
cards:
  - q: What is the event loop in Node.js?
    a: A loop, run by libuv, that keeps checking for finished background work. It runs each finished job's callback on the single JavaScript thread, so Node never sits and waits.
  - q: Name the main phases of the Node.js event loop, in order.
    a: Timers → pending callbacks → poll (I/O) → check (setImmediate) → close callbacks.
  - q: Which runs first — process.nextTick or a promise .then?
    a: process.nextTick. Node empties the nextTick queue first, then the promise queue.
  - q: Inside an fs.readFile callback, which runs first — setTimeout(fn, 0) or setImmediate(fn)?
    a: setImmediate. The check phase comes right after poll. The timer must wait for the next round of the loop.
  - q: What "blocks" the event loop?
    a: Long synchronous CPU work — big loops, fs.readFileSync, sync crypto, JSON.parse on huge data. While it runs, no other request can be handled.
---

## 💡 What is it?

Node.js runs your JavaScript on **one [thread](glossary:thread)**. So only one piece of your code runs at a time.

The **[event loop](glossary:event-loop)** lets that one thread serve thousands of users. Slow jobs, like reading a file or asking a database, are sent to the background. When a job is done, its [callback](glossary:callback) waits in a line. The event loop runs it when the thread is free.

The event loop goes round and round. Each round has fixed steps called **phases**.

## 🏠 Real-life example

Think of **one waiter in a busy restaurant**.

The waiter takes your order and gives it to the kitchen. They do **not** stand in the kitchen and wait for your food. They go and take the next table's order. Then the next one.

When a dish is ready, the kitchen rings a bell. When the waiter is free, they pick up the dish and serve it.

- The **waiter** = the single JavaScript thread.
- The **kitchen** = the background workers (the operating system and [libuv](glossary:libuv)).
- The **bell and the line of ready dishes** = the callback queues.
- The waiter's **fixed routine** ("check ready dishes, then new orders, then the bill counter…") = the event loop and its phases.

Now imagine the waiter stops to peel 100 kg of potatoes by themselves. **Every table has to wait.** That is called "blocking the event loop".

## 🧑‍💻 Code example

Save this as `loop.js`. Run it with `node loop.js`. Try to guess the order first!

```js
const fs = require('node:fs');                         // load Node's built-in file module

console.log('1. start');                               // normal code: runs right now

fs.readFile(__filename, () => {                        // ask Node to read this same file in the background
  console.log('4. file read (poll phase)');            // runs later, when the file is ready (poll phase)
  setTimeout(() => console.log('7. timeout'), 0);      // timers phase; 0 means "as soon as possible", not "now"
  setImmediate(() => console.log('6. immediate'));     // check phase — it comes right after poll
  process.nextTick(() => console.log('5. nextTick'));  // runs as soon as this callback ends, before anything else
});                                                    // end of the readFile callback

Promise.resolve().then(() => console.log('3. promise')); // a microtask: runs right after the normal code ends
console.log('2. end');                                 // normal code: runs right now
```

**Output:**

```text
1. start
2. end
3. promise
4. file read (poll phase)
5. nextTick
6. immediate
7. timeout
```

**Why this order?**
1. `1` and `2` are normal code. They run first, from top to bottom.
2. The normal code is done. Node now runs the [microtasks](glossary:microtask) → `3. promise`.
3. The loop starts. When the file is ready, the **poll** phase runs its callback → `4`.
4. That callback ends. Microtasks run again → `5. nextTick`.
5. Next comes the **check** phase → `6. immediate`.
6. The loop goes round again and reaches **timers** → `7. timeout`.

## 🔍 Deeper version

**Who runs the loop?** A C library inside Node called **libuv**. For network work (sockets, HTTP), libuv uses the operating system's own async tools. ("Async" means "start now, finish later".) These tools are epoll on Linux and kqueue on macOS. Some jobs can't use those tools, so libuv sends them to a small **thread pool**. A thread pool is a group of helper threads. It has 4 threads by default, and you can change the number with `UV_THREADPOOL_SIZE`. These jobs go to the pool:
- file system work
- `dns.lookup`
- some `crypto`, like `pbkdf2`
- `zlib` compression

Your own JavaScript still runs on one thread.

**The phases of one loop round (one "tick"):**

| Phase | What runs here | Example |
|---|---|---|
| **timers** | callbacks whose time is up | `setTimeout`, `setInterval` |
| **pending callbacks** | some system callbacks that were delayed | some TCP errors |
| idle, prepare | used only inside Node | — |
| **poll** | most I/O callbacks; it also waits here for new I/O | `fs.readFile`, HTTP data, database replies |
| **check** | `setImmediate` callbacks | `setImmediate` |
| **close callbacks** | "close" events | `socket.on('close')` |

**Microtasks run between everything.** Each time a callback finishes, Node empties two queues before moving on:
1. first, the `process.nextTick` queue,
2. then, the promise queue (`.then`, `.catch`, and the code after `await`).

:::version[Version note]
Since **Node.js 11**, microtasks run after *each* `setTimeout` or `setImmediate` callback. This is the same as in browsers. Before that, they ran only at the end of the whole phase. Since **Node.js 20** (libuv 1.45), timers are checked only after the poll phase. Interviewers rarely ask about this. But it explains small differences you may see in old blog posts.
:::

**`setTimeout(fn, 0)` vs `setImmediate(fn)`:**
- Inside an **I/O callback**, `setImmediate` always wins. That's because check comes straight after poll.
- In the **main script**, the order is **not fixed**. It depends on how fast the program starts. Don't write code that depends on it.

**Starving the loop.** Say `process.nextTick` keeps adding itself again and again. Then the loop never moves to the next phase, and I/O never runs. A never-ending chain of promises can do the same thing.

**What blocks the loop.** Any long **synchronous** work keeps the single thread busy. ("Synchronous" means the code waits until the job is fully done.) Examples:
- big loops over large arrays, or sorting huge data
- `fs.readFileSync`, `crypto.pbkdf2Sync`, and `JSON.parse` or `JSON.stringify` on very large objects
- slow regular expressions on long text

How to fix it:
- Move CPU work to **worker threads**.
- Or use a **job queue** (like BullMQ) or a separate service.
- Or split the work into small pieces with `setImmediate`.

You can measure how blocked the loop is with `perf_hooks.monitorEventLoopDelay()`.

## 🎯 Why do we use it?

Most backend work is **waiting**. You wait for the database, for another API, or for a file. Many older servers use one thread for each request. That thread just sits and waits. Threads use memory, so this limits how many users you can serve.

With the event loop, **the one thread never waits**. It starts the slow job and moves on to the next request. It comes back when the result is ready.

That's why Node is great for APIs and real-time apps like chat and WebSockets. It's also great for services that mostly do [I/O](glossary:io), like talking to databases and other APIs.

## ⚠️ Common mistakes

- **Thinking `setTimeout(fn, 0)` runs right away.** It runs in the next timers phase. That's after the current code and all microtasks.
- **Saying "Node is single-threaded" and stopping there.** *Your JavaScript* runs on one thread. But libuv uses the operating system and a thread pool for I/O.
- **Doing heavy CPU work inside a request.** For example, building a big report with a huge loop. Every other user freezes until it finishes.
- **Using `*Sync` functions** like `readFileSync` inside requests. They're fine when the app starts. But inside requests they block the loop.

## 🗣️ How to answer in an interview

> "Node runs JavaScript on a single thread. The event loop is what lets that thread handle many requests at once. When my code starts slow work, like a database query or a file read, Node hands it to the operating system or to libuv's thread pool. Then it keeps going. When the work finishes, its callback is queued. The event loop runs it when the call stack is empty.
>
> Each round of the loop has phases. First timers, for setTimeout. Then pending callbacks. Then poll, where most I/O callbacks run. Then check, for setImmediate. Then close callbacks. Between every callback, Node empties the microtask queues: first process.nextTick, then promises.
>
> The main lesson is: never block the loop. Heavy CPU work, sync file reads, or parsing a huge JSON inside a request freezes every user. I'd move that work to a worker thread or a background queue."

[FILL IN: if you ever fixed slow or blocking code in a Node service at SkillKeepr, add one line about it here. Only if it's true.]

## 🔁 Follow-up questions

### Is Node.js really single-threaded?

Your JavaScript runs on one main thread. But Node itself uses more threads:
- libuv's thread pool (4 by default) for files, DNS lookup, some crypto and compression
- V8's own background threads for garbage collection

You can also make your own threads with `worker_threads`.

### What is the difference between `process.nextTick` and `setImmediate`?

`process.nextTick` runs **right after the current code**, before the loop moves on. It goes first, even before promises. `setImmediate` runs later, in the **check phase**, after I/O. The names are confusing: "nextTick" actually runs sooner than "setImmediate".

### How would you find out if something is blocking the event loop?

Look for these signs: one CPU core at 100%, and *every* route getting slow at the same time. Measure the loop delay with `perf_hooks.monitorEventLoopDelay()` or a monitoring tool. To find the slow function, profile with `node --inspect` and Chrome DevTools, or use clinic.js.

### How do you run CPU-heavy work in Node without blocking?

- Use `worker_threads` for CPU work inside the same app.
- Or use a job queue (BullMQ + Redis) to do it in the background.
- Or split the work into small pieces.

To use more CPU cores, run several copies of Node with the `cluster` module or PM2.

### Where do `async`/`await` callbacks run?

`await` is built on promises. The code after `await` runs as a **promise microtask**. It runs when the awaited promise finishes.

## ✅ Quick check

### 1. Predict the output.

```js
setTimeout(() => console.log('A'), 0);          // a timer
Promise.resolve().then(() => console.log('B')); // a promise microtask
process.nextTick(() => console.log('C'));       // a nextTick
console.log('D');                               // normal code
```

:::answer
**D, C, B, A.** Normal code runs first (D). Then the nextTick queue (C). Then promises (B). Then the loop reaches the timers phase (A).
:::

### 2. Which of these blocks the event loop?

- A) `await fetch(url)`
- B) `fs.readFileSync('big.csv')` inside a route handler
- C) `setTimeout(fn, 5000)`

:::answer
**B.** `readFileSync` keeps the single thread busy until the whole file is read. A and C send the waiting to the background, so other requests keep running.
:::

### 3. Inside an `fs.readFile` callback, you call `setTimeout(x, 0)` and `setImmediate(y)`. Which runs first?

:::answer
**`y` (setImmediate).** The check phase comes right after poll, in the same round. The timer must wait for the timers phase of the next round.
:::
