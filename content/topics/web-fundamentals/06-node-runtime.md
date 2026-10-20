---
title: "How JavaScript runs in Node.js: V8, libuv and Node APIs"
stack: web-fundamentals
order: 6
level: Intermediate
mustKnow: true
askedFrequency: common
summary:
  - "Node.js = V8 (runs the language) + libuv (event loop, files, network, thread pool) + Node APIs written in JS and C++ (fs, http, crypto…)."
  - "When you type node app.js, Node starts V8 and libuv, loads your file, runs the top-level code, then enters the event loop."
  - Node stays alive while something is still pending — a server, a timer, a socket or a file read. When nothing is left, the process exits.
  - Network I/O uses the operating system's own async tools. Files, DNS lookups and some crypto use libuv's small thread pool.
  - Your JavaScript still runs on one main thread, so heavy CPU work blocks every request.
cards:
  - q: What are the main parts of Node.js?
    a: V8 to run JavaScript, libuv for the event loop and async I/O (plus a thread pool), and Node's built-in modules like fs, http and crypto, which connect JavaScript to C/C++ code.
  - q: Why does a Node script exit by itself, but a server keeps running?
    a: Node exits when the event loop has nothing left to wait for. A listening server is an active handle, so the loop stays alive until the server is closed.
  - q: What is libuv?
    a: A C library inside Node that runs the event loop, talks to the operating system for async network I/O, and has a thread pool for work like file reads, DNS lookups and some crypto.
  - q: What happens first when you run node app.js?
    a: Node sets up V8 and libuv, loads its own internal code, then loads your file as a module and runs its top-level code from top to bottom, before any callbacks run.
  - q: What is the difference between process.on('beforeExit') and process.on('exit')?
    a: beforeExit fires when the loop becomes empty, and you can still schedule more async work. exit fires when the process is really ending, and only synchronous code can run.
---

## 💡 What is it?

Node.js lets JavaScript run **outside the browser**, on a server or your laptop. It joins three things: the [V8](glossary:v8) engine, a C library called [libuv](glossary:libuv), and Node's own built-in modules like `fs` and `http`.

This page follows one command, `node app.js`, from start to finish. You'll see what runs, in what order, and **why the process stops** (or doesn't).

## 🏠 Real-life example

Think of a **restaurant opening for the day**.

- The **manager unlocks the doors and switches on the lights** = Node starts V8 and libuv.
- The manager **reads today's plan** from top to bottom = Node runs your file's top-level code.
- The **waiter** = the single JavaScript thread. One person serving.
- The **kitchen staff** = the operating system and libuv's thread pool. They cook (read files, call the network) while the waiter keeps serving.
- The **order bell** = a callback being queued when the work is done.
- The **"OPEN" sign** = an active handle, like a listening server. While it's up, the restaurant stays open.
- When the sign is turned off, **no orders are pending** and no food is cooking, the manager **locks up and goes home** = the process exits.

## 🧑‍💻 Code example

Save as `lifecycle.js` and run `node lifecycle.js`.

```js
const fs = require('node:fs');                          // built-in file module (handled by libuv)
const http = require('node:http');                      // built-in HTTP module

console.log('1. top-level code runs first');            // your file runs from top to bottom
setTimeout(() => console.log('4. timer fired'), 10);    // a timer keeps the event loop busy for 10 ms
fs.readFile(__filename, () => console.log('3. file read done (libuv)')); // file read goes to libuv's thread pool
process.on('exit', (code) => console.log(`6. process exit, code ${code}`)); // last thing Node says before it stops

const server = http.createServer((req, res) => res.end('hi')); // a server is a long-lived "handle"
server.listen(4802, () => {                             // while it listens, Node will NOT exit
  console.log('2. server listening, Node stays alive'); // printed once the port is open
  setTimeout(() => {                                    // after 50 ms...
    server.close(() => console.log('5. server closed, nothing left to do')); // ...close it; the loop becomes empty
  }, 50);                                               // 50 = milliseconds
});                                                     // end of listen callback
```

Real output (Node 24):

```text
1. top-level code runs first
2. server listening, Node stays alive
3. file read done (libuv)
4. timer fired
5. server closed, nothing left to do
6. process exit, code 0
```

I ran it 5 times and got this order every time. Steps 2 and 3 are both async results, so on another machine they could swap.

**What to notice:**
- All top-level code ran **before any callback**.
- Node **didn't exit** after the top-level code. The server, timer and file read were still pending.
- Once the server closed and nothing was left, Node exited **by itself** with code `0` (success).

## 🔍 Deeper version

**What happens when you type `node app.js`:**

```text
1. Start the process      → the OS starts the node binary
2. Set up V8              → create an "isolate" (a separate JS world) and a context
3. Set up libuv           → create the event loop and (lazily) the thread pool
4. Bootstrap Node         → load Node's internal JS: process, timers, require/import
5. Load your module       → CommonJS or ES module (by file extension / package.json "type")
6. Run top-level code     → your file runs from top to bottom, synchronously
7. Drain microtasks       → process.nextTick queue, then promise callbacks
8. Enter the event loop   → timers → pending → poll (I/O) → check → close … repeat
9. Loop is empty?         → emit 'beforeExit' → if still empty, emit 'exit' → the process ends
```

The loop phases are explained in [the Node.js event loop](topic:nodejs/event-loop).

**What keeps Node alive.** libuv counts active **handles** (long-lived things: servers, sockets, timers, intervals) and **requests** (one-off operations: a file read, a DNS lookup). While any are "referenced", the loop keeps going. Useful tricks:
- `timer.unref()` → "don't keep Node alive just for this timer"
- forgetting to close a database connection → your script **never exits**, which is a common bug in scripts and tests

**Who does the real I/O work:**

| Work | Who does it | Blocks your JS? |
|---|---|---|
| TCP/HTTP sockets | The OS's async system (epoll on Linux, kqueue on macOS), via libuv | No |
| Files (`fs`), `dns.lookup`, some `crypto`, `zlib` | libuv's **thread pool** (4 threads by default) | No |
| Your JavaScript, `JSON.parse`, loops | The **main thread** | **Yes** |

More: [V8 and libuv](topic:nodejs/v8-and-libuv) and [the libuv thread pool](topic:nodejs/libuv-thread-pool).

**How a Node API reaches C++.** `fs.readFile` is JavaScript in Node's own code. It calls a C++ **binding**, which asks libuv to do the read. libuv uses a thread-pool thread. When the read is done, libuv queues the callback, and the event loop runs your JavaScript callback on the main thread.

**Exit codes and signals.**
- `0` = success. Any other number = failure (CI tools and Docker read this).
- An uncaught exception or an unhandled promise rejection → exit code `1`.
- `SIGTERM` (sent by Docker, Kubernetes or PM2 when stopping) → handle it to close the server and the DB cleanly. See [graceful shutdown](topic:nodejs/graceful-shutdown).

**Same idea on AWS Lambda.** Lambda freezes the process **between requests** instead of exiting it. That's why a database connection created **outside** the handler can be reused on the next call (a "warm start"). See [serverless and Lambda](topic:architecture/serverless-lambda).

## 🎯 Why do we use it?

Knowing the runtime explains everyday Node problems:
- **"My script never finishes"** → something is still open (a DB connection, an interval, a server).
- **"The whole API is slow when one user exports a report"** → heavy CPU work on the main thread. See [blocking the event loop](topic:nodejs/blocking-the-event-loop).
- **"Many file reads at once are slow"** → the thread pool has only 4 threads by default.
- **"Tests hang at the end"** → open handles. Jest even has a `--detectOpenHandles` option for this.

## ⚠️ Common mistakes

- **Saying "Node is single-threaded" without detail.** Your JavaScript runs on one thread, but libuv and V8 use more threads behind the scenes.
- **Not closing connections in scripts and tests.** The event loop stays alive, so the process never exits.
- **Doing async cleanup in `process.on('exit')`.** Only synchronous code runs there. Do async cleanup on `SIGTERM` or `beforeExit`.
- **Thinking `await` makes CPU work run elsewhere.** `await` only waits. The CPU work still blocks the main thread.

## 🗣️ How to answer in an interview

> "Node.js is V8 plus libuv plus a set of built-in modules. When I run node app.js, Node sets up V8 and libuv, bootstraps its internal modules, loads my file as a CommonJS or ES module, and runs the top-level code synchronously. Then it drains the nextTick and promise queues and enters the event loop.
>
> The loop keeps running as long as there are active handles or requests — a listening server, a timer, an open socket or a pending file read. When nothing is left, Node emits beforeExit and exit and the process ends.
>
> For I/O, network sockets use the OS's async mechanisms through libuv, while file system work, DNS lookups and some crypto go to libuv's thread pool, which has four threads by default. My JavaScript still runs on one main thread, so I keep CPU-heavy work out of request handlers."

## 🔁 Follow-up questions

### How does Node decide if a file is CommonJS or an ES module?

By the extension and `package.json`: `.mjs` is ESM, `.cjs` is CommonJS, and `.js` follows `"type"` in the nearest `package.json` (`"module"` or `"commonjs"`). Recent Node versions also detect ESM syntax automatically. See [CommonJS vs ES Modules](topic:nodejs/commonjs-vs-esm).

### Why did the server's callback print before the file read?

Both are async results that arrive in later loop turns. Opening a local port is very fast; the file read had to go through the thread pool. The order isn't guaranteed — never write code that depends on it.

### What's the difference between the main thread and the thread pool?

The main thread runs **all your JavaScript**. The thread pool runs **C/C++ work** for some Node APIs (files, DNS lookups, crypto, compression). Your callback still comes back to the main thread.

### How would you run CPU-heavy work in Node?

Use `worker_threads`, a job queue (for example BullMQ), or a separate service. See [worker threads](topic:nodejs/worker-threads).

## ✅ Quick check

### 1. Does this script exit by itself?

```js
setInterval(() => console.log('tick'), 1000);   // runs every 1000 ms (1 second), forever
```

:::answer
**No.** An interval is an active handle, so the event loop stays alive forever. It exits only if you call `clearInterval`, `unref()` it, or stop the process.
:::

### 2. Which of these runs on libuv's thread pool: an HTTP request to an API, or `fs.readFile`?

:::answer
**`fs.readFile`.** File system work uses the thread pool. Network sockets (like an HTTP request) use the OS's own async system, not the pool.
:::

### 3. Your test file passes, but Jest says it "did not exit one second after the test run". What's the likely cause?

:::answer
Something is still open — for example a database connection or a server that was never closed — so Node's event loop stays alive. Close it in an `afterAll` hook.
:::
