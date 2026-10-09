---
title: Single thread and non-blocking I/O
stack: nodejs
order: 4
level: Basic
mustKnow: true
askedFrequency: very common
summary:
  - Node.js runs your JavaScript on ONE main thread, so only one piece of your code runs at a time.
  - Blocking code stops everything until it finishes (like readFileSync). Non-blocking code starts the work and moves on (like readFile).
  - Slow I/O (files, database, network) is done in the background. Your callback or promise runs when the result is ready.
  - This lets one Node process serve thousands of users with little memory. It's called concurrency, not parallelism.
  - Never do long CPU work on the main thread. It blocks every user.
cards:
  - q: What does "single-threaded" mean in Node.js?
    a: Your JavaScript runs on one main thread, so only one piece of your code runs at any moment.
  - q: What is the difference between blocking and non-blocking code?
    a: Blocking code makes the thread wait until the work is done. Non-blocking code starts the work, returns right away, and handles the result later with a callback or promise.
  - q: "Which is blocking: fs.readFileSync or fs.readFile?"
    a: fs.readFileSync. It stops the thread until the whole file is read. fs.readFile (and fs.promises.readFile) are non-blocking.
  - q: How can a single thread handle thousands of requests?
    a: Requests mostly wait on I/O. Node starts that I/O in the background and serves other requests meanwhile, running each callback when its result arrives.
  - q: What is the difference between concurrency and parallelism?
    a: Concurrency is handling many tasks by switching between them. Parallelism is doing many tasks at the exact same time on different CPU cores. Node's main thread gives concurrency.
---

## 💡 What is it?

Node.js runs your JavaScript on **one [thread](glossary:thread)**. A thread is one line of work that a computer does step by step. So only one piece of your code runs at a time.

To stay fast, Node uses **[non-blocking](glossary:non-blocking) [I/O](glossary:io)**. I/O means talking to things outside your program, like files, databases or other servers. "Non-blocking" means Node **does not wait** for that slow work. It starts it, moves on, and comes back when the result is ready.

## 🏠 Real-life example

Think of **washing clothes in a washing machine**.

You put the clothes in and press start. Now you have two choices:
1. **Blocking:** you stand next to the machine for 40 minutes and watch it. You do nothing else.
2. **Non-blocking:** you walk away. You cook, study and call a friend. When the machine **beeps**, you come back and take the clothes out.

- **You** = the single JavaScript thread.
- The **washing machine** = the background worker (the operating system or libuv) doing the slow I/O.
- The **beep** = the [callback](glossary:callback) or promise telling you "it's done".
- **Cooking and studying meanwhile** = Node serving other users while it waits.

Node always chooses option 2.

## 🧑‍💻 Code example

Save this as `blocking.js`. Run it with `node blocking.js`.

```js
const fs = require('node:fs');                                  // load Node's built-in file module

console.log('A. before sync read');                             // normal code: runs first
const text = fs.readFileSync(__filename, 'utf8');               // BLOCKING: Node stops here until the whole file is read
console.log('B. sync read done,', text.length, 'characters');   // runs only after the read has finished

fs.readFile(__filename, 'utf8', (err, data) => {                // NON-BLOCKING: start reading, and give a callback for later
  if (err) throw err;                                           // if reading failed, stop with the error
  console.log('D. async read done,', data.length, 'characters'); // runs later, when the file is ready
});                                                             // end of the callback

console.log('C. this line does not wait for the async read');   // runs right away, before D
```

**Output** (the number of characters will match your file):

```text
A. before sync read
B. sync read done, 925 characters
C. this line does not wait for the async read
D. async read done, 925 characters
```

**What to notice:** `C` prints **before** `D`. The program did not wait for `readFile`. With `readFileSync`, it waited, so `B` came right after `A`.

## 🔍 Deeper version

**Blocking vs non-blocking vs sync vs async.**
- **Synchronous (sync):** the function finishes its work before it returns. `readFileSync` returns the file content.
- **Asynchronous (async):** the function returns right away. The result comes later, through a callback, a [promise](glossary:promise) or an event.
- **Blocking:** the thread can't do anything else while it waits. In Node, sync I/O is blocking.
- **Non-blocking:** the thread is free while the I/O happens elsewhere.

**Who does the waiting?** Not your thread. [libuv](glossary:libuv) does:
- **Network** (HTTP, database connections, sockets): the operating system watches many connections at once (epoll, kqueue, IOCP).
- **Files, `dns.lookup`, some crypto**: libuv's [thread pool](glossary:thread-pool) (4 threads by default).

When the result is ready, the [event loop](glossary:event-loop) runs your callback on the main thread. See [the event loop](topic:nodejs/event-loop).

**Thread-per-request vs Node's model.**

| | Thread per request (classic servers) | Node.js |
|---|---|---|
| How | Each request gets its own thread | One thread + event loop |
| While waiting for DB | That thread sits idle | Thread serves other requests |
| Memory | Each thread needs its own memory (often 1 MB+ of stack) | Small cost per connection |
| Many slow connections | Runs out of threads | Handles them easily |
| Heavy CPU work | Other threads keep going | **Blocks everyone** |

**Concurrency vs parallelism.**
- **Concurrency** = dealing with many tasks at once by switching between them. One cook handles 5 orders by moving between them.
- **Parallelism** = doing many tasks at the *same instant* on different CPU cores. Five cooks each cook one order.
- Node's main thread gives **concurrency**. For **parallelism**, use [worker threads](topic:nodejs/worker-threads), [cluster or PM2](topic:nodejs/cluster-and-pm2), or more containers.

**Why one thread is nice.** With one thread, two pieces of your code never change the same variable at the same instant. So you don't need locks, and many tricky bugs disappear. But async **race conditions** still exist. Two requests can read the same database row and both update it. See [error handling](topic:nodejs/error-handling) and [async patterns](topic:nodejs/async-patterns).

**Modern style.** Use promises with `async/await` instead of callbacks:

```js
const fs = require('node:fs/promises');                  // the promise version of the file module
const data = await fs.readFile('notes.txt', 'utf8');     // non-blocking; code below waits, but the thread is free
```

(Top-level `await` works in ES Modules, for example in `.mjs` files.)

## 🎯 Why do we use it?

Most backend requests spend most of their time **waiting**. They wait for the database, for Stripe, or for another service. If a thread just sits and waits, you waste memory and can serve fewer users.

Non-blocking I/O lets **one small process** serve thousands of users. That makes Node cheap to run and great for APIs, chat apps, live dashboards and microservices.

## ⚠️ Common mistakes

- **Using `*Sync` functions inside request handlers.** `readFileSync`, `execSync` or `pbkdf2Sync` block every other user. They're fine at startup only.
- **Doing heavy CPU work on the main thread**, like big loops, huge `JSON.parse` or image processing. See [Blocking the event loop](topic:nodejs/blocking-the-event-loop).
- **Thinking "async" means "runs in parallel".** Your JavaScript callbacks still run one at a time, on one thread.
- **Thinking you need no care with shared data.** Two async requests can still interleave and overwrite each other's database changes.

## 🗣️ How to answer in an interview

> "Node runs my JavaScript on a single main thread, so only one piece of my code runs at a time. To still handle many users, it uses non-blocking I/O.
>
> When my code reads a file, queries a database or calls another API, Node doesn't wait. libuv hands the work to the operating system or to its thread pool, and my code returns right away. When the result is ready, the event loop runs my callback or resolves my promise.
>
> Since most backend requests are mostly waiting, one thread can serve thousands of concurrent requests with little memory. That's concurrency, not parallelism. The trade-off is that CPU-heavy work on the main thread blocks everyone. So I avoid sync functions in request handlers, and I move heavy work to worker threads or a background queue."

## 🔁 Follow-up questions

### If Node is single-threaded, how does it use all CPU cores?

One Node process uses one main thread. To use all cores, run several processes: with the `cluster` module, PM2, or several containers behind a load balancer. For CPU work inside one process, use `worker_threads`.

### Is `fs.readFile` really done on another thread?

Yes. File system calls go to libuv's thread pool, because most operating systems have no good async file API. Network I/O is different: it uses the OS's async tools and needs no extra thread.

### Can two requests in Node change the same data at the same time?

Not at the exact same instant in JavaScript, since there is one thread. But they can **interleave** around `await`. Request A reads a value, waits, and then request B reads the same old value. Both write, and one change is lost. Use atomic database updates (like `$inc`), transactions or version fields.

### When is it OK to use sync functions?

At **startup**, before the server accepts requests. For example, reading a config file. Also in small CLI scripts where nothing else is running. Never inside request handlers.

## ✅ Quick check

### 1. Predict the output.

```js
const fs = require('node:fs');                        // the file module
fs.readFile(__filename, () => console.log('X'));      // non-blocking read
console.log('Y');                                     // normal code
```

:::answer
**Y, then X.** `readFile` starts the read and returns right away. `Y` prints first. `X` prints later, when the file is ready.
:::

### 2. Your API reads a 50 MB file with `fs.readFileSync` on every request. What happens when 100 users call it?

- A) Each user is served in parallel
- B) Users are served one by one, and everyone else waits during each read
- C) Node creates 100 threads automatically

:::answer
**B.** `readFileSync` blocks the single thread. While one read runs, no other request can be handled. Use `fs.promises.readFile` or, better for big files, a stream.
:::

### 3. Concurrency or parallelism: one Node process handling 2,000 open WebSocket connections?

:::answer
**Concurrency.** One thread switches between the connections as events arrive. Parallelism would need several CPU cores working at the same instant (worker threads or several processes).
:::
