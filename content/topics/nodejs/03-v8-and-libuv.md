---
title: "Inside Node: V8 and libuv"
stack: nodejs
order: 3
level: Intermediate
mustKnow: false
askedFrequency: common
summary:
  - Node.js = V8 + libuv + core modules, joined together by C++ "bindings".
  - V8 is Google's JavaScript engine. It turns JavaScript into fast machine code (JIT compiling) and manages memory with a garbage collector.
  - libuv is a C library. It runs the event loop, talks to the operating system for network I/O, and has a thread pool for files, DNS and some crypto.
  - Core modules (fs, http, crypto…) are the JavaScript tools you use. Under them, bindings call into V8 and libuv.
  - "V8 runs your code; libuv does the waiting. That split is why Node is fast at I/O."
cards:
  - q: What are the two main parts inside Node.js?
    a: V8, which runs JavaScript, and libuv, which runs the event loop and handles async I/O (files, network, timers).
  - q: What does V8 do?
    a: It compiles JavaScript into machine code just in time (JIT), runs it, and manages memory with a garbage collector.
  - q: What does libuv do?
    a: It provides the event loop, uses the operating system's async tools for network I/O, and runs a thread pool for file system, DNS lookup, some crypto and zlib work.
  - q: What are Node's "bindings"?
    a: C++ glue code that connects JavaScript functions like fs.readFile to the C/C++ code in libuv and the operating system.
  - q: Is the V8 in Node the same as in Chrome?
    a: Yes, it's the same engine. Node just doesn't include browser parts like the DOM, and it adds libuv and server APIs.
---

## 💡 What is it?

Node.js is built from a few big parts. The two most important are **[V8](glossary:v8)** and **[libuv](glossary:libuv)**.

- **V8** is the engine that **runs your JavaScript**. It comes from Google Chrome.
- **libuv** is a helper library that **does the waiting**. It handles files, the network and timers, and it runs the [event loop](glossary:event-loop).

Node joins them together and adds ready-made tools like `fs` (files) and `http` (servers).

## 🏠 Real-life example

Think of **a school**.

A student sits in class and does the homework. When the student needs something from outside, like a form signed or a letter posted, they don't leave the class. They give it to the **school office**. The office sends helpers, talks on the phone, and tells the student when it's done.

- The **student** = V8. It reads and runs your JavaScript, very fast.
- The **school office** = libuv. It handles all the outside work: files, network, timers.
- The **office helpers** = libuv's [thread pool](glossary:thread-pool). They do slow errands, like reading files.
- The **forms the office gives you** = core modules like `fs` and `http`. They are how you ask for outside work.
- The **intercom between class and office** = the C++ bindings that connect them.

## 🧑‍💻 Code example

Save this as `inside.js`. Run it with `node inside.js`.

```js
console.log('Node:', process.versions.node);   // the Node.js version you are running
console.log('V8:', process.versions.v8);       // the version of the V8 engine inside this Node
console.log('libuv:', process.versions.uv);    // the version of libuv inside this Node ("uv" = libuv)

const used = process.memoryUsage().heapUsed;   // bytes of memory V8 is using right now for your JavaScript objects
console.log('Heap used (MB):', (used / 1024 / 1024).toFixed(1)); // bytes → megabytes; toFixed(1) = 1 decimal place
```

**Output** (your numbers will be different):

```text
Node: 24.11.0
V8: 13.6.233.10-node.30
libuv: 1.51.0
Heap used (MB): 3.9
```

**What to notice:** Node tells you exactly which V8 and libuv it is built on. The **heap** is the memory area where V8 keeps your objects.

## 🔍 Deeper version

**The layers of Node.js (top to bottom):**

| Layer | Written in | Examples |
|---|---|---|
| Your code | JavaScript / TypeScript | routes, services |
| npm packages | JavaScript (some C++) | Express, Mongoose |
| **Core modules** | JavaScript | `fs`, `http`, `crypto`, `stream`, `events` |
| **Bindings** | C++ | connect JS functions to C/C++ code |
| **V8** | C++ | runs JavaScript, manages memory |
| **libuv** | C | event loop, async I/O, thread pool, timers |
| Other C libraries | C/C++ | OpenSSL (crypto), llhttp (HTTP parsing), zlib, c-ares (DNS) |
| Operating system | — | Linux, macOS, Windows |

**What V8 does:**
- **Parses** your code and turns it into **bytecode** (simple instructions). Its interpreter, Ignition, runs this first.
- **JIT compiling.** "Just in time" means it compiles *while* the program runs. Code that runs often ("hot" code) is compiled again by faster compilers (Sparkplug, Maglev, TurboFan) into optimised machine code.
- **De-optimising.** If V8's guesses become wrong (for example, a function that always got numbers now gets a string), it throws away the fast code and goes back. Keeping object shapes and types consistent helps V8 stay fast.
- **Memory and [garbage collection](glossary:garbage-collection).** V8 keeps objects in the **heap**. New objects go into a small "young" area that is cleaned often and quickly. Objects that survive move to the "old" area, which is cleaned less often. You can change the old area's size with `--max-old-space-size`.

**What libuv does:**
- Runs the **event loop** and its phases (timers, poll, check…). See [the event loop](topic:nodejs/event-loop).
- **Network I/O** (TCP, HTTP, sockets): uses the operating system's own async tools: epoll (Linux), kqueue (macOS) and IOCP (Windows). No extra threads needed.
- **Thread pool** (4 threads by default) for work the OS can't do asynchronously: file system calls, `dns.lookup`, some `crypto` and `zlib`. See [the libuv thread pool](topic:nodejs/libuv-thread-pool).
- **Timers**, child processes, signals and file watching.

**What happens on `fs.readFile('a.txt', cb)`:**
1. The `fs` module (JavaScript) checks your arguments.
2. A C++ binding passes the request to libuv.
3. libuv gives the read to a thread-pool thread. Your JavaScript continues right away.
4. The thread finishes and tells the event loop.
5. In the poll phase, the event loop calls your callback `cb` on the main thread, through V8.

## 🎯 Why do we use it?

You don't call V8 or libuv directly. But knowing them helps you:
- **Explain why Node is fast at I/O**: V8 runs code quickly, and libuv makes sure the thread never waits.
- **Debug performance**: is the problem slow JavaScript (V8, CPU) or slow I/O (libuv, network, thread pool)?
- **Tune memory**: heap size flags and heap snapshots are V8 features.
- **Answer "how does Node work internally?"**, which is common in interviews for 2–4 years of experience.

## ⚠️ Common mistakes

- **Saying "libuv runs my JavaScript".** V8 runs JavaScript. libuv only does I/O and tells the loop when results are ready.
- **Saying "all async work uses the thread pool".** Network I/O uses the OS directly. Only files, `dns.lookup`, some crypto and zlib use the pool.
- **Writing code that keeps changing object shapes and types.** It makes V8 de-optimise hot code. For example, adding new properties to objects in random order inside a hot loop.
- **Thinking Node and Chrome are the same thing.** They share V8, but Node has no DOM, and Chrome has no `fs`.

## 🗣️ How to answer in an interview

> "Node.js is mainly V8 plus libuv, joined by C++ bindings, with core modules on top.
>
> V8 is Google's JavaScript engine, the same one in Chrome. It parses my code, compiles hot code to optimised machine code just in time, and manages memory with a generational garbage collector.
>
> libuv is a C library that gives Node its event loop and async I/O. For network work, it uses the operating system's async tools like epoll or kqueue. For things the OS can't do asynchronously, like file system calls, `dns.lookup` and some crypto, it uses a thread pool with four threads by default.
>
> So when I call `fs.readFile`, the binding hands it to libuv, a pool thread reads the file, and the event loop runs my callback on the main thread through V8. V8 runs my code, and libuv does the waiting. That's why Node is good at I/O."

## 🔁 Follow-up questions

### What is JIT compilation?

"Just-in-time" compiling. V8 doesn't compile everything before running. It starts quickly with bytecode. Then it watches which functions run often, and compiles those into fast machine code while the program runs.

### Does network I/O use the libuv thread pool?

No. Sockets and HTTP use the operating system's async mechanisms (epoll, kqueue, IOCP). The thread pool is only for file system work, `dns.lookup`, some `crypto` functions and `zlib`.

### How do you give Node more memory?

Use the V8 flag `--max-old-space-size`, in megabytes. For example: `node --max-old-space-size=4096 app.js` for about 4 GB of old-space heap. But first check you don't have a [memory leak](glossary:memory-leak).

### What other libraries are inside Node?

OpenSSL (for TLS and crypto), llhttp (a fast HTTP parser), zlib (compression), c-ares (DNS resolving), and ICU (for languages and dates in `Intl`).

## ✅ Quick check

### 1. Which part of Node actually runs your JavaScript code?

- A) libuv
- B) V8
- C) The thread pool

:::answer
**B. V8.** libuv handles the event loop and I/O. The thread pool does background I/O work. Neither runs JavaScript.
:::

### 2. True or false: an HTTP request your server makes to another API uses one of libuv's 4 thread-pool threads.

:::answer
**False.** Network I/O uses the operating system's async tools directly. (Only the DNS lookup by hostname, through `dns.lookup`, uses the thread pool.)
:::

### 3. What does `process.memoryUsage().heapUsed` show?

:::answer
How many **bytes** of the V8 heap your JavaScript objects are using right now. It's useful for spotting memory that keeps growing.
:::
