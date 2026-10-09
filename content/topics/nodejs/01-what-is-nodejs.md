---
title: What Node.js is and why we use it
stack: nodejs
order: 1
level: Basic
mustKnow: true
askedFrequency: very common
summary:
  - Node.js lets you run JavaScript outside the browser, for example on a server or your laptop.
  - It is a runtime made of the V8 engine (runs JavaScript) and libuv (handles files, network and timers).
  - It uses one thread with non-blocking I/O, so one process can serve thousands of users at the same time.
  - It is great for APIs, real-time apps and tools. It is weak for heavy CPU work, unless you use worker threads.
  - npm gives you millions of ready-made packages, and you can use JavaScript on both frontend and backend.
cards:
  - q: What is Node.js, in one sentence?
    a: A JavaScript runtime, built on Chrome's V8 engine and libuv, that runs JavaScript outside the browser — mostly on servers.
  - q: Is Node.js a programming language or a framework?
    a: Neither. JavaScript is the language. Node.js is a runtime (the place where JavaScript runs). Express is a framework built on top of Node.
  - q: What kind of work is Node.js best at?
    a: I/O-heavy work — APIs, real-time apps (chat, WebSockets), streaming and microservices. Not long CPU-heavy work on the main thread.
  - q: Why can one Node.js process handle many users?
    a: It uses non-blocking I/O. It starts slow work (database, files, network), moves on to other requests, and runs the callback when the result is ready.
  - q: Which Node.js versions should you use in production?
    a: LTS (Long-Term Support) versions. Even-numbered versions, like Node 22 and Node 24, become LTS.
---

## 💡 What is it?

**Node.js** lets you run JavaScript **outside the browser**. For example, on a server or on your own laptop.

Before Node.js, JavaScript ran only inside web pages. Node.js took the JavaScript engine from Chrome and gave it new powers. Now it can read files, talk to databases and answer requests from users.

Node.js is not a language and not a framework. It is a **[runtime](glossary:runtime)**: a place where JavaScript code can run.

## 🏠 Real-life example

Think of a **mobile SIM card**.

At first, your SIM card works only in one phone. Then you get a new phone, and you put the same SIM card in it. Your number is the same. But the new phone can do new things, like video calls and maps.

- The **SIM card** = the JavaScript language. It stays the same.
- The **first phone** = the browser. JavaScript could only work there.
- The **new phone** = Node.js. Same JavaScript, but now it can reach files, databases and the network.
- The **apps you install** = npm packages. They add extra powers in seconds.

## 🧑‍💻 Code example

Save this as `server.js`. Run it with `node server.js`. Then open `http://localhost:3000` in your browser.

```js
const http = require('node:http');                        // load Node's built-in http module (no install needed)

const server = http.createServer((req, res) => {          // make a server; this function runs for EVERY request
  res.writeHead(200, { 'Content-Type': 'text/plain' });   // 200 = "OK"; the reply will be plain text
  res.end('Hello from Node.js!');                         // send the text and finish the reply
});                                                       // end of the request function

server.listen(3000, () => {                               // start listening on port 3000 (a "door number" on your computer)
  console.log('Server running at http://localhost:3000'); // runs once, when the server is ready
});                                                       // end of listen
```

**Output in the terminal:**

```text
Server running at http://localhost:3000
```

The browser shows: `Hello from Node.js!`

**What to notice:** just 8 lines of JavaScript make a real web server. Press `Ctrl + C` in the terminal to stop it.

## 🔍 Deeper version

**What is inside Node.js?**

| Part | What it does |
|---|---|
| **[V8](glossary:v8)** | Google's JavaScript engine (also used in Chrome). It turns your JavaScript into fast machine code. |
| **[libuv](glossary:libuv)** | A C library. It runs the [event loop](glossary:event-loop) and handles files, network, timers and a small [thread pool](glossary:thread-pool). |
| **Core modules** | Built-in tools like `fs` (files), `http` (servers), `path`, `crypto`, `events`, `stream`. |
| **Bindings** | C++ glue code that connects JavaScript to V8 and libuv. |

You can read more in [Inside Node: V8 and libuv](topic:nodejs/v8-and-libuv).

**How it handles many users.** Your JavaScript runs on **one [thread](glossary:thread)**. Node uses [non-blocking](glossary:non-blocking) I/O. When code asks for a file or a database result, Node does not wait. It starts the job, serves other requests, and runs your [callback](glossary:callback) when the result is ready. See [Single thread and non-blocking I/O](topic:nodejs/single-thread-non-blocking) and [the event loop](topic:nodejs/event-loop).

**Good fits for Node.js:**
- REST and GraphQL APIs, and backends for web and mobile apps
- Real-time apps: chat, live dashboards, notifications (WebSockets)
- Microservices and serverless functions (like AWS Lambda)
- Streaming data, like file uploads and video
- Command-line tools (npm, Vite and ESLint are all Node programs)

**Bad fits (unless you plan for it):**
- Long [CPU-heavy](glossary:cpu-bound) work, like video encoding or big calculations. It blocks the single thread. You can move it to [worker threads](topic:nodejs/worker-threads) or a separate service.

**Versions.** Node has a new major version every 6 months. **Even-numbered versions** (20, 22, 24…) become **LTS** (Long-Term Support). LTS means they get bug and security fixes for about 30 months. Use LTS in production.

:::version[Version note]
**Node.js 24** became the Active LTS version in October 2025. Recent versions added many things you used to install from npm: `fetch`, a test runner (`node:test`), watch mode (`node --watch`), `.env` file loading (`--env-file`), and running simple TypeScript files directly. See [Modern Node features](topic:nodejs/modern-node-features).
:::

## 🎯 Why do we use it?

- **One language everywhere.** You use JavaScript (or TypeScript) on the frontend and the backend. Teams can share code, types and validation rules.
- **Fast for I/O work.** Most backend work is waiting for databases and other APIs. Node handles a lot of this waiting with little memory.
- **Huge ecosystem.** npm has millions of packages. Express, Mongoose, Stripe's SDK and Jest are all one install away.
- **Great for real-time.** Keeping many connections open (chat, live updates) is cheap in Node.
- **Fast to build with.** Small, simple services are quick to write, test and deploy.

## ⚠️ Common mistakes

- **Calling Node.js a framework or a language.** It is a runtime. Express is the framework. JavaScript is the language.
- **Doing heavy CPU work on the main thread.** One slow calculation freezes every user. See [Blocking the event loop](topic:nodejs/blocking-the-event-loop).
- **Using browser-only things in Node**, like `window`, `document` or `localStorage`. They don't exist in Node.
- **Using an old or odd-numbered version in production.** Use an LTS version and keep it updated.

## 🗣️ How to answer in an interview

> "Node.js is a JavaScript runtime. It lets you run JavaScript outside the browser, mostly on servers. It's built on Chrome's V8 engine, which runs the JavaScript, and libuv, which gives it the event loop and non-blocking I/O.
>
> The key idea is that my JavaScript runs on a single thread, but it never sits and waits for slow work. When a request needs the database or a file, Node starts that work and serves other requests. It runs my callback when the result is ready. That's why one Node process can handle thousands of connections with little memory.
>
> So Node is a great fit for APIs, real-time apps and microservices, which is mostly I/O work. It's not a great fit for heavy CPU work on the main thread. For that, I'd use worker threads or a separate service. At SkillKeepr, I build backend services with Node.js and Express, and I like that the team can use TypeScript on both the frontend and the backend."

## 🔁 Follow-up questions

### Is Node.js single-threaded?

Your JavaScript runs on one main thread. But Node itself uses more threads. libuv has a thread pool (4 threads by default) for files, DNS lookups and some crypto. V8 also uses background threads for garbage collection. You can create your own threads with `worker_threads`.

### Why is Node.js fast if it has only one thread?

Because most backend work is waiting, not calculating. Node doesn't block while it waits. It starts many I/O jobs at the same time and handles each result when it arrives. V8 also compiles JavaScript into fast machine code.

### When would you NOT choose Node.js?

For long CPU-heavy work, like image or video processing, machine-learning training or big number crunching. Languages like Go, Rust, Java or Python (with native libraries) can be better there. Or you keep Node for the API and send heavy work to a worker or another service.

### What is the difference between Node.js and Express?

Node.js is the runtime. It can make a server with the built-in `http` module. Express is a small framework on top of Node. It adds routing, [middleware](glossary:middleware) and helpers, so you write less code.

### What does LTS mean?

Long-Term Support. LTS versions get bug fixes and security fixes for about 30 months. Even-numbered versions (like 22 and 24) become LTS. Companies use LTS versions in production.

## ✅ Quick check

### 1. Which statement is true?

- A) Node.js is a JavaScript framework, like Express
- B) Node.js is a runtime that runs JavaScript outside the browser
- C) Node.js is a new programming language

:::answer
**B.** Node.js is a runtime. JavaScript is the language. Express is a framework built on Node.
:::

### 2. Which job is the WORST fit for the main Node.js thread?

- A) A REST API that reads from MongoDB
- B) A chat server with 5,000 WebSocket users
- C) Resizing 10,000 large photos in a loop

:::answer
**C.** Resizing photos is heavy CPU work. It blocks the single thread, so every other user waits. A and B are mostly I/O, which Node handles very well.
:::

### 3. Your team asks which Node version to use in production. Which is the better choice: an odd-numbered "Current" version or an even-numbered LTS version?

:::answer
**The even-numbered LTS version**, like Node 24. It gets bug and security fixes for a long time. Odd-numbered versions never become LTS.
:::
