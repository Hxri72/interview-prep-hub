---
title: Worker threads
stack: nodejs
order: 23
level: Advanced
mustKnow: false
askedFrequency: common
summary:
  - Worker threads let Node run heavy CPU work (big calculations, image resizing, parsing huge files) on another thread, so the main event loop stays free.
  - Each worker has its own JavaScript engine instance, its own event loop and its own memory. They talk by sending messages.
  - "Send data with postMessage(); receive it with the 'message' event. Data is copied, unless you transfer or share it."
  - Workers are for CPU work, not for I/O. Node already handles I/O without blocking.
  - Starting a worker is costly, so reuse workers with a pool (for example, the piscina library) instead of one per request.
cards:
  - q: When should you use worker threads in Node.js?
    a: For CPU-heavy work that would block the event loop — big calculations, image or PDF processing, compression, parsing huge data. Not for I/O.
  - q: How do the main thread and a worker communicate?
    a: "With messages: worker.postMessage(data) / parentPort.postMessage(data), received with the 'message' event. Data is copied using the structured clone algorithm."
  - q: Do worker threads share memory?
    a: Not by default — each has its own heap. You can share memory on purpose with a SharedArrayBuffer (and use Atomics to coordinate).
  - q: Worker threads vs cluster?
    a: Cluster runs several copies of your whole server as separate processes to use more CPU cores. Workers run extra threads inside one process for specific heavy tasks.
  - q: Why use a worker pool?
    a: Creating a worker takes time and memory. A pool keeps a few workers ready and reuses them for many tasks.
---

## 💡 What is it?

Node runs your JavaScript on **one main [thread](glossary:thread)**. If you give it heavy maths, like a loop of 300 million steps, that thread is busy. Every other user has to wait. This is called [blocking the event loop](topic:nodejs/blocking-the-event-loop).

**Worker threads** let you run that heavy work on **another thread**. The main thread stays free to answer requests. When the worker finishes, it sends the result back as a message.

## 🏠 Real-life example

Think of a **school principal on exam-result day**.

- The principal must keep meeting parents at the office (answering requests).
- Calculating the marks for 1,000 students would take hours. If the principal does it alone, every parent waits outside.
- So the principal gives the marks sheets to **two helper teachers** in another room. That's starting **worker threads**.
- The helpers work in their own room with their own desk and papers. That's their **own memory**.
- They can't read the principal's papers directly. They talk by **sending notes**. That's `postMessage()`.
- When they finish, they send a note with the results. The principal never stopped meeting parents.
- Hiring a new helper for every single job is slow. Keeping two helpers ready all day is better. That's a **worker pool**.

## 🧑‍💻 Code example

Save this as `worker.js`. Run it with `node worker.js`. The same file acts as both the main program and the worker.

```js
const { Worker, isMainThread, parentPort, workerData } = require('node:worker_threads'); // the worker tools

if (isMainThread) {                                               // this part runs in the MAIN thread
  const timer = setInterval(() => console.log('main thread is free ✔'), 100); // proves the main thread is not blocked
  const worker = new Worker(__filename, { workerData: 300_000_000 }); // start a worker running THIS file; send it a number
  worker.on('message', (sum) => {                                 // runs when the worker sends its answer
    console.log('worker result:', sum);                           // print the answer
    clearInterval(timer);                                         // stop the "free" messages
  });                                                             // end of the message handler
  worker.on('error', (err) => console.error('worker failed:', err)); // an error inside the worker arrives here
} else {                                                          // this part runs INSIDE the worker thread
  let sum = 0;                                                    // a running total
  for (let i = 0; i < workerData; i++) sum += i % 7;              // heavy CPU work: 300 million loop steps
  parentPort.postMessage(sum);                                    // send the answer back to the main thread
}                                                                 // end of if/else
```

**Output** (how many "free" lines you see depends on your computer's speed):

```text
main thread is free ✔
main thread is free ✔
main thread is free ✔
worker result: 899999997
```

**What to notice:** the "free" messages keep printing **while** the worker is busy. If you put the same loop directly in the main thread, you would see **no** "free" messages until the loop ended.

## 🔍 Deeper version

**What a worker really is.** Each worker gets its own V8 instance (called an **isolate**), its own [event loop](topic:nodejs/event-loop) and its own heap memory. It runs in the **same process** as the main thread. So it's lighter than a new process, but each worker still costs several MB of memory and some startup time.

**Talking between threads:**

| Way | How | Notes |
|---|---|---|
| Messages | `postMessage(data)` + `'message'` event | data is **copied** (structured clone); simple and safe |
| Transfer | `postMessage(buf, [buf.buffer])` | moves an ArrayBuffer **without copying**; the sender can't use it anymore |
| Shared memory | `SharedArrayBuffer` + `Atomics` | both threads see the same memory; fast but tricky to get right |

Functions, class instances with methods and open sockets **cannot** be sent in a message.

**Worker events:** `'message'`, `'error'` (an uncaught error in the worker), `'exit'` (with an exit code), and `'online'`. Always handle `'error'` and `'exit'`, so a crashed worker doesn't fail silently.

**Use a pool in real apps.** Creating a new worker for every request wastes time and memory. A pool keeps, for example, one worker per CPU core and reuses them. The `piscina` library is a popular pool. You can find the core count with `os.availableParallelism()`.

**Workers vs other options:**

| Option | What it is | Use it for |
|---|---|---|
| **Worker threads** | extra threads in one process | CPU-heavy tasks inside your app |
| **[Cluster / PM2](topic:nodejs/cluster-and-pm2)** | many copies of the whole server, as separate processes | using all CPU cores to serve more requests |
| **[Child processes](topic:nodejs/child-processes)** | run another program (ffmpeg, Python, a script) | tools that aren't JavaScript, or full isolation |
| **Job queue** (BullMQ) | work saved in Redis and run by worker services | slow jobs that can run later, with retries |

**Not for I/O.** File reads, database calls and HTTP requests already run without blocking the main thread (see [the libuv thread pool](topic:nodejs/libuv-thread-pool)). Moving them into a worker adds cost and no benefit.

**ES modules.** In an ESM project, start a worker with `new Worker(new URL('./task.js', import.meta.url))`.

## 🎯 Why do we use it?

- **Keep the API fast for everyone.** One user's heavy export or image resize shouldn't freeze every other user's request.
- **Use more CPU cores.** One Node thread uses one core. Workers can run CPU tasks on other cores at the same time.
- **Stay in one app.** You don't need a separate service or language just for one heavy function.

Typical uses: resizing images, generating PDFs, hashing or encrypting big data, parsing very large JSON or CSV files, and heavy calculations or scoring.

## ⚠️ Common mistakes

- **Using workers for I/O** (database calls, HTTP). It's slower and more complex, with no gain.
- **Creating a new worker on every request.** Startup cost and memory grow fast. Use a pool.
- **Sending huge objects back and forth.** Copying them can cost more than the work itself. Transfer buffers, or send less data.
- **Not handling `'error'` and `'exit'`.** A crashed worker leaves the caller waiting forever.

## 🗣️ How to answer in an interview

> "Worker threads let Node run CPU-heavy JavaScript in parallel without blocking the main event loop. Each worker has its own V8 isolate, event loop and memory, inside the same process. The main thread and the worker communicate with `postMessage` and the `message` event. Data is copied by structured clone. For big binary data, you can transfer an ArrayBuffer or share memory with SharedArrayBuffer.
>
> I'd use them for things like image processing, PDF generation or heavy parsing. I wouldn't use them for I/O, because Node already handles I/O asynchronously. In production, I'd use a pool like piscina, sized to the CPU cores, rather than starting a worker per request. And if the job can run later, a queue like BullMQ with separate worker processes is often a better fit, because you also get retries and persistence."

[FILL IN: any CPU-heavy work at SkillKeepr that was moved off the main thread or to a background job, if any. Only add it if it's true.]

## 🔁 Follow-up questions

### Do worker threads make Node multi-threaded?

For your JavaScript, yes. Each worker runs JavaScript in parallel on its own thread. But threads don't share normal variables. They only share data through messages or a SharedArrayBuffer. So you avoid most classic threading bugs.

### How many workers should you create?

Usually about one per CPU core (`os.availableParallelism()`), minus one for the main thread. More workers than cores just makes them take turns, which adds overhead.

### What happens if a worker throws an error?

The worker stops, and the main thread gets an `'error'` event with that error, then an `'exit'` event. If you don't handle it, the task's caller never gets a result.

### Worker threads or a job queue?

If the user is waiting for the result in the same request and it takes a few seconds or less, use a worker. If it can run later, may take long, or needs retries, put it in a queue (BullMQ + Redis) and process it in a separate worker service.

## ✅ Quick check

### 1. Your API calls three databases and two external APIs per request. Will worker threads make it faster?

:::answer
**No.** That's I/O work, which Node already does without blocking. Workers help with **CPU** work, like heavy calculations.
:::

### 2. How does a worker send its result back to the main thread?

- A) By returning a value from the file
- B) `parentPort.postMessage(result)`
- C) By changing a global variable

:::answer
**B.** Workers can't share normal variables with the main thread. They send messages.
:::

### 3. True or false: you should create a new Worker for every incoming HTTP request.

:::answer
**False.** Workers are costly to start. Use a pool that reuses a few workers.
:::
