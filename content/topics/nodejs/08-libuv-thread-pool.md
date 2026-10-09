---
title: The libuv thread pool (UV_THREADPOOL_SIZE)
stack: nodejs
order: 8
level: Advanced
mustKnow: false
askedFrequency: sometimes
summary:
  - libuv keeps a small group of background threads, called the thread pool. It has 4 threads by default.
  - "It's used for work the operating system can't do asynchronously: file system calls, dns.lookup, some crypto (pbkdf2, scrypt, randomBytes) and zlib."
  - Network I/O (HTTP, sockets, database connections) does NOT use the pool. It uses the OS's async tools.
  - If more than 4 slow pool jobs run at once, the extra jobs wait in a line.
  - Change the size with the UV_THREADPOOL_SIZE environment variable, set before Node starts (maximum 1024).
cards:
  - q: How many threads does libuv's thread pool have by default?
    a: 4.
  - q: Which Node operations use the libuv thread pool?
    a: File system (fs) calls, dns.lookup, some crypto (pbkdf2, scrypt, randomBytes, generateKeyPair) and zlib compression.
  - q: Does an HTTP request or a MongoDB query use the thread pool?
    a: No. Network I/O uses the operating system's async mechanisms (epoll, kqueue, IOCP). Only the dns.lookup to resolve a hostname uses the pool.
  - q: How do you change the thread pool size?
    a: Set the UV_THREADPOOL_SIZE environment variable before Node starts, e.g. UV_THREADPOOL_SIZE=8 node app.js. The maximum is 1024.
  - q: What happens if you start 5 slow pbkdf2 hashes at once with the default pool?
    a: 4 run at the same time. The 5th waits for a free thread, so it finishes about twice as late.
---

## 💡 What is it?

Your JavaScript runs on one main thread. But [libuv](glossary:libuv), the library inside Node, also keeps a small team of **background threads**. This team is called the **[thread pool](glossary:thread-pool)**.

By default, the pool has **4 threads**. Node sends them slow jobs that the operating system can't do in an async way. For example, reading files or hashing passwords.

You can change the number of threads with the `UV_THREADPOOL_SIZE` environment variable.

## 🏠 Real-life example

Think of **a school office with 4 helpers**.

Students give the office errands: "Get this form photocopied", "Post this letter". The office has 4 helpers. Each helper does one errand at a time.

If 4 errands come in, all 4 helpers go. If a 5th errand comes, it **waits on the desk** until one helper comes back.

Some things don't need a helper at all. Phone calls, for example. The office just uses the telephone system and waits for the ring.

- The **4 helpers** = the 4 threads in the libuv thread pool.
- **Errands** = file reads, password hashing, compression, DNS lookups.
- The **5th errand waiting on the desk** = jobs waiting for a free pool thread.
- **Phone calls** = network I/O. It uses the operating system, not the pool.
- **Hiring more helpers** = setting `UV_THREADPOOL_SIZE` higher.

## 🧑‍💻 Code example

Save this as `pool.js`. Run it with `node pool.js`. Then run it again with `UV_THREADPOOL_SIZE=5 node pool.js` (Mac/Linux) and compare.

```js
const crypto = require('node:crypto');                             // Node's built-in crypto module
const start = Date.now();                                          // remember when we started (milliseconds)

for (let i = 1; i <= 5; i++) {                                     // start 5 slow hash jobs at the same time
  crypto.pbkdf2('secret', 'salt', 300000, 64, 'sha512', () => {    // 300000 rounds = slow on purpose; 64 = key length in bytes
    console.log(`hash ${i} done in`, Date.now() - start, 'ms');    // runs when THIS job finishes on a pool thread
  });                                                              // end of the callback
}                                                                  // end of the loop
```

**Output with the default pool of 4** (numbers depend on your computer, and the order of 1–4 can change):

```text
hash 2 done in 412 ms
hash 1 done in 415 ms
hash 4 done in 418 ms
hash 3 done in 420 ms
hash 5 done in 829 ms
```

**Output with `UV_THREADPOOL_SIZE=5`:**

```text
hash 1 done in 431 ms
hash 3 done in 433 ms
hash 2 done in 436 ms
hash 5 done in 437 ms
hash 4 done in 440 ms
```

**What to notice:** with 4 threads, jobs 1–4 finish together, and job 5 takes about **twice as long**, because it waited for a free thread. With 5 threads, all five finish together. (This needs at least 5 CPU cores to show clearly.)

## 🔍 Deeper version

**What uses the thread pool:**

| Uses the pool | Does NOT use the pool |
|---|---|
| All async `fs` calls (`readFile`, `writeFile`, `stat`…) | TCP / HTTP / HTTPS sockets |
| `dns.lookup` (used when you connect by hostname) | `dns.resolve*` functions (they use c-ares, async) |
| `crypto.pbkdf2`, `scrypt`, `randomBytes`, `randomFill`, `generateKeyPair` | Database drivers' network traffic (MongoDB, PostgreSQL) |
| async `zlib` (gzip, deflate, brotli) | Timers, `setImmediate`, promises |
| Some native addons (for example, `bcrypt`'s async hash) | Your JavaScript code itself |

**Why files use threads but sockets don't.** Operating systems have good async APIs for sockets (epoll on Linux, kqueue on macOS, IOCP on Windows). One thread can watch thousands of connections. For regular files, most systems have no reliable async API. So libuv fakes it: a pool thread does the normal *blocking* file call, and your main thread stays free.

**Setting the size:**
- Set `UV_THREADPOOL_SIZE` **before Node starts**, in the shell, Dockerfile or platform settings: `UV_THREADPOOL_SIZE=8 node app.js`.
- The pool is created the first time it's used. Setting `process.env.UV_THREADPOOL_SIZE` at the very top of your code *may* work on Linux and macOS. But it does not work on Windows, so prefer the environment.
- The maximum is **1024** (it was 128 in older libuv versions).
- More threads use more memory and compete for CPU cores. Measure before and after. A good starting point is around the number of CPU cores.

**A hidden problem: pool starvation.** All these jobs share the same 4 threads. Say your app hashes many passwords with `pbkdf2` and also reads files. During a login spike, file reads wait behind the hashes. Even `dns.lookup` waits, so **outgoing HTTP calls to hostnames** can slow down too. Signs: file and DNS operations get slow, while CPU isn't fully used.

**Fixes for pool starvation:**
- Raise `UV_THREADPOOL_SIZE` a bit (for example, to the number of cores).
- Move heavy CPU work (like hashing many files) to [worker threads](topic:nodejs/worker-threads) or a job queue.
- Cache DNS results, or use connection keep-alive so fewer lookups happen.
- Run more Node processes ([cluster or PM2](topic:nodejs/cluster-and-pm2)). Each process has its own pool.

**Pool threads vs worker threads.** The libuv pool runs **C/C++ work** for Node's built-in APIs. You can't put your own JavaScript there. To run your own JavaScript in parallel, use `worker_threads`.

## 🎯 Why do we use it?

- **To keep file and crypto work non-blocking.** Without the pool, `fs.readFile` would freeze the main thread.
- **To tune performance.** If your app does a lot of file I/O, hashing or compression at once, a bigger pool can help.
- **To debug strange slowness**, like "file reads and outgoing API calls are slow, but CPU is low". This is a classic sign of a full pool.
- **To answer advanced interview questions** like "Is Node really single-threaded?" with real detail.

## ⚠️ Common mistakes

- **Saying all async work goes to the thread pool.** Network I/O doesn't.
- **Setting `UV_THREADPOOL_SIZE` too late**, after some `fs` or `crypto` call already started the pool. The change is then ignored.
- **Setting it very high "just in case"**, like 512. Extra threads compete for CPU and use memory. Measure first.
- **Using sync versions** (`pbkdf2Sync`, `readFileSync`) and thinking the pool helps. Sync versions run on the main thread and block it.

## 🗣️ How to answer in an interview

> "Besides the main JavaScript thread, libuv keeps a thread pool with four threads by default. Node uses it for work the operating system can't do asynchronously: file system calls, `dns.lookup`, some crypto like `pbkdf2` and `scrypt`, and zlib compression. Network I/O doesn't use the pool. Sockets use the OS's async mechanisms like epoll or kqueue.
>
> Because the pool is small and shared, it can become a bottleneck. If I start five slow `pbkdf2` hashes at once, four run in parallel and the fifth waits. And a busy pool can even slow down DNS lookups for outgoing HTTP calls.
>
> I can raise the size with the `UV_THREADPOOL_SIZE` environment variable, set before Node starts, up to 1024. I'd measure first, though. For heavy CPU work, worker threads or a job queue are usually the better fix."

## 🔁 Follow-up questions

### Can I run my own JavaScript on the libuv thread pool?

No. The pool only runs Node's internal C/C++ work. For your own CPU-heavy JavaScript, use `worker_threads`, which gives each worker its own V8 instance and event loop.

### Why does `dns.lookup` use the pool, but `dns.resolve4` doesn't?

`dns.lookup` uses the operating system's `getaddrinfo` function. That function is blocking, so libuv runs it on a pool thread. `dns.resolve*` uses the c-ares library, which talks to DNS servers over the network asynchronously, so it doesn't need the pool.

### What's a sensible value for `UV_THREADPOOL_SIZE`?

There's no single answer. Start with the default (4). If profiling shows pool jobs waiting, try the number of CPU cores, then measure again. Apps with lots of file or crypto work benefit most.

### Does `cluster` change the thread pool?

Each process has its **own** libuv thread pool. With 4 cluster workers, you get 4 separate pools of 4 threads each.

## ✅ Quick check

### 1. Which of these uses the libuv thread pool?

- A) `fetch('https://api.example.com')` (the HTTP data transfer)
- B) `fs.promises.readFile('report.csv')`
- C) `setImmediate(fn)`

:::answer
**B.** File system calls use the pool. A's data transfer uses the OS's async networking (only its hostname lookup may use the pool). C is just an event loop phase.
:::

### 2. You start 8 `crypto.scrypt` calls at once with the default pool. Roughly how do they finish?

:::answer
**In two waves of 4.** The first 4 run together on the 4 pool threads. The next 4 wait, then run when threads become free, so they finish about twice as late.
:::

### 3. True or false: adding `process.env.UV_THREADPOOL_SIZE = 16` in the middle of your app, after the server has already read some files, changes the pool size.

:::answer
**False.** The pool is created on first use, so later changes are ignored. Set it in the environment before Node starts: `UV_THREADPOOL_SIZE=16 node app.js`.
:::
