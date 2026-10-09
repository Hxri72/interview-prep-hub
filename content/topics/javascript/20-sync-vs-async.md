---
title: Synchronous vs asynchronous code
stack: javascript
order: 20
level: Basic
mustKnow: true
askedFrequency: very common
summary:
  - Synchronous code runs line by line. Each line waits for the one before it to finish.
  - Asynchronous code starts a slow job now and finishes it later, so the program doesn't freeze while waiting.
  - JavaScript runs one thing at a time (single-threaded), so slow work like timers, network calls and file reads must be asynchronous.
  - The result of async work comes back through a callback, a promise, or async/await.
  - Long synchronous work (a huge loop) freezes the page or server, because nothing else can run.
cards:
  - q: What is synchronous code?
    a: Code that runs one line after another. Each line must finish before the next one starts.
  - q: What is asynchronous code?
    a: Code that starts a slow task and moves on right away. The result is handled later, through a callback, a promise or async/await.
  - q: "console.log('A'); setTimeout(() => console.log('B'), 0); console.log('C'); — what prints?"
    a: A, C, B. The setTimeout callback waits until the normal code has finished, even with 0 ms.
  - q: Why does JavaScript need async code?
    a: It runs on one thread. If it waited for slow work like a network call, the whole page or server would freeze.
  - q: What are the three ways to get the result of async work?
    a: Callbacks, promises (.then), and async/await (which is built on promises).
---

## 💡 What is it?

**Synchronous** (sync) code runs **line by line**. Each line waits until the line before it is completely finished.

**[Asynchronous](glossary:async)** (async) code **starts a slow job now and finishes it later**. While it waits, the rest of your code keeps running.

JavaScript runs only one thing at a time. So slow jobs, like timers, API calls and reading files, are done asynchronously. That way the app never freezes.

## 🏠 Real-life example

Think of **ordering a pizza**.

**Sync way:** you call the pizza shop. Then you stand at the door doing nothing for 30 minutes until it arrives. You can't do homework, eat or talk. That's wasteful.

**Async way:** you order the pizza. Then you do your homework. When the doorbell rings, you go and get the pizza.

- **Ordering the pizza** = starting an async job (like calling an API).
- **Doing homework while waiting** = the rest of your code keeps running.
- **The doorbell** = the callback or promise that tells you "it's ready".
- **Standing at the door for 30 minutes** = blocking code that freezes everything.

## 🧑‍💻 Code example

Save this as `sync-async.js`. Run it with `node sync-async.js`.

```js
console.log('1. Order pizza');                     // synchronous: runs right now

setTimeout(() => {                                 // asynchronous: start a 2-second timer, run this later
  console.log('3. Pizza arrived!');                // runs after about 2000 ms, when the timer ends
}, 2000);                                          // 2000 = 2000 milliseconds = 2 seconds

console.log('2. Do homework while waiting');       // synchronous: runs right now, no waiting for pizza
```

**Output:**

```text
1. Order pizza
2. Do homework while waiting
3. Pizza arrived!
```

**What to notice:** line 2 is printed **before** the pizza arrives, even though the timer is written above it. The program didn't stop and wait.

## 🔍 Deeper version

**1. One thread, many waiting jobs.** JavaScript runs your code on a single [thread](glossary:thread) using a [call stack](glossary:call-stack). The browser (or Node.js) does the slow work in the background: timers, network requests, file reads. When a job is done, its callback joins a queue. The [event loop](glossary:event-loop) runs it once the call stack is empty. See [the event loop](topic:javascript/event-loop).

**2. Common async things in JavaScript:**

| Kind of work | Example |
|---|---|
| Timers | `setTimeout`, `setInterval` |
| Network | `fetch`, `axios`, database calls in Node |
| Files (Node) | `fs.promises.readFile` |
| User events (browser) | clicks, typing, scrolling |
| Promise callbacks | `.then`, code after `await` |

**3. Three ways to handle the result** (they were added over time):

```js
setTimeout(() => console.log('callback style'), 0);      // 1. callback: pass a function to run later
fetch(url).then((res) => console.log(res.status));       // 2. promise: chain .then on the returned promise
const res = await fetch(url);                             // 3. async/await: looks sync, but it's still async
```

See [callbacks](topic:javascript/callbacks), [promises](topic:javascript/promises) and [async/await](topic:javascript/async-await).

**4. "Looks sync" is not "is sync".** `await` makes code *read* top to bottom. But the function still pauses and returns a promise. Other code (other users' requests, other clicks) runs during that pause.

**5. Blocking.** Sync code that takes a long time **blocks** the thread. In the browser, the page freezes: clicks and scrolling stop working. In Node, every user waits. That's why Node has `fs.readFile` (async) next to `fs.readFileSync` (sync). Use the sync one only at startup. See [blocking the event loop](topic:nodejs/blocking-the-event-loop).

**6. Async doesn't mean parallel.** Two `await`s in a row run **one after the other**. To run independent jobs at the same time, start them together with [Promise.all](topic:javascript/promise-combinators).

## 🎯 Why do we use it?

- **To keep apps responsive.** The page can still scroll and react to clicks while data loads.
- **To serve many users at once in Node.** While one request waits for the database, Node can handle other requests.
- **Because the real world is slow.** Networks, disks and databases take milliseconds or seconds. CPUs are much faster than that.

## ⚠️ Common mistakes

- **Expecting async results immediately.** For example, `let data; fetch(url).then(r => data = r); console.log(data);` prints `undefined`, because the fetch hasn't finished yet.
- **Thinking `setTimeout(fn, 0)` runs right away.** It runs after the current code and all promise callbacks.
- **Running independent `await`s one by one** when they could run in parallel with `Promise.all`.
- **Using sync APIs** (`readFileSync`, heavy loops) inside a Node request handler. This blocks every user.

## 🗣️ How to answer in an interview

> "Synchronous code runs line by line, and each line waits for the previous one to finish. Asynchronous code starts a slow operation, like a network call, a timer or a file read, and continues without waiting. The result is handled later through a callback, a promise or async/await.
>
> JavaScript needs this because it runs on a single thread. If it waited for slow I/O synchronously, the browser would freeze and a Node server couldn't serve other users. The environment does the waiting in the background, and the event loop runs the callback when the call stack is free.
>
> In practice I use async/await for readability, I run independent calls in parallel with Promise.all, and I avoid long synchronous work on the main thread."

## 🔁 Follow-up questions

### Is async/await synchronous?

No. It only *looks* synchronous. An `async` function returns a promise. At each `await`, the function pauses and lets other code run until the awaited promise settles.

### What happens if a synchronous task takes 5 seconds in the browser?

The page freezes for 5 seconds. Clicks, typing, scrolling and animations all stop, because the single thread is busy. Fix it by splitting the work, or by moving it to a Web Worker.

### Is JavaScript multi-threaded?

Your JavaScript code runs on one main thread. But browsers and Node do I/O in the background, and you can create extra threads with Web Workers (browser) or worker threads (Node).

### What is the difference between async and parallel?

Async means "don't wait while a job runs". Parallel means "two jobs truly run at the same time". `Promise.all` lets several network waits overlap. Your JavaScript itself still runs one step at a time.

## ✅ Quick check

### 1. Predict the output.

```js
console.log('A');                                  // sync
setTimeout(() => console.log('B'), 0);             // async: runs later
console.log('C');                                  // sync
```

:::answer
**A, C, B.** The two sync lines run first. The timer callback runs only after the current code finishes, even with a 0 ms delay.
:::

### 2. What does this print?

```js
let name = 'none';                                 // starting value
setTimeout(() => { name = 'Asha'; }, 0);           // change it later
console.log(name);                                 // ?
```

:::answer
**`none`.** The `console.log` runs before the timer callback has had a chance to change `name`.
:::

### 3. Which of these blocks the thread?

- A) `await fetch('/api/jobs')`
- B) A `for` loop that runs 5 billion times
- C) `setTimeout(fn, 5000)`

:::answer
**B.** A huge synchronous loop keeps the single thread busy. A and C hand the waiting to the background, so other code keeps running.
:::
