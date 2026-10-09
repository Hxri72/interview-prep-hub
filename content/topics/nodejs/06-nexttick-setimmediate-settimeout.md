---
title: process.nextTick vs setImmediate vs setTimeout
stack: nodejs
order: 6
level: Intermediate
mustKnow: false
askedFrequency: common
summary:
  - process.nextTick runs right after the current code, before promises and before the event loop moves on.
  - Promise callbacks (.then, await) run next, as microtasks.
  - setImmediate runs in the check phase, right after I/O callbacks in the same loop round.
  - setTimeout(fn, 0) runs in the timers phase, after at least 1 ms. In the main script its order with setImmediate is not guaranteed.
  - "Prefer setImmediate or promises. Too many nextTick calls can starve the event loop."
cards:
  - q: Order these from first to last — setTimeout(0), setImmediate, process.nextTick, Promise.then (inside an I/O callback).
    a: process.nextTick → Promise.then → setImmediate → setTimeout(0).
  - q: Which runs first — process.nextTick or a resolved promise's .then?
    a: process.nextTick. Node empties the nextTick queue before the promise microtask queue.
  - q: In which event loop phase does setImmediate run?
    a: The check phase, which comes right after the poll (I/O) phase.
  - q: "Does setTimeout(fn, 0) run after exactly 0 ms?"
    a: No. Node treats 0 as 1 ms, and the callback runs in a timers phase at least that late — often later if the loop is busy.
  - q: What is the danger of process.nextTick?
    a: If nextTick callbacks keep adding more nextTick callbacks, the event loop never moves on, and I/O starves.
---

## 💡 What is it?

Node gives you three ways to say "run this function **a bit later**":
- `process.nextTick(fn)`: **right after the current code**, before anything else.
- `setImmediate(fn)`: **after the current I/O work**, in this round of the loop.
- `setTimeout(fn, ms)`: **after at least `ms` milliseconds**.

They look alike, but they run at **different moments** of the [event loop](glossary:event-loop). Promise callbacks (`.then`, `await`) also fit into this order.

## 🏠 Real-life example

Think of **a teacher answering questions in class**.

The teacher is explaining something. Students give her notes with different labels:
- **"nextTick" note:** "Answer me the moment you finish this sentence." She answers before anything else.
- **Promise note:** "Answer me right after the nextTick notes." Also very soon.
- **"setImmediate" note:** "Answer me after this round of questions." She first finishes the questions already in line.
- **"setTimeout" note:** "Answer me after 5 minutes." She checks the clock at the start of the next round.

Mapping:
- The **teacher** = the single JavaScript thread.
- The **sentence she is saying** = the code running right now.
- The **rounds of questions** = the rounds (phases) of the event loop.

If students keep sending new "nextTick" notes forever, the teacher never gets to the next round. That's **starving the loop**.

## 🧑‍💻 Code example

Save this as `order.js`. Run it with `node order.js`.

```js
const fs = require('node:fs');                              // built-in file module; we use it to get inside an I/O callback

fs.readFile(__filename, () => {                             // read this file; the callback runs in the poll phase
  setTimeout(() => console.log('4. setTimeout 0'), 0);      // timers phase of the NEXT loop round
  setImmediate(() => console.log('3. setImmediate'));       // check phase of THIS round (right after poll)
  Promise.resolve().then(() => console.log('2. promise'));  // promise microtask: right after the nextTick queue
  process.nextTick(() => console.log('1. nextTick'));       // nextTick queue: first, as soon as this callback ends
  console.log('0. normal code in the callback');            // normal code always runs before all of them
});                                                         // end of the readFile callback
```

**Output:**

```text
0. normal code in the callback
1. nextTick
2. promise
3. setImmediate
4. setTimeout 0
```

**What to notice:** the order in the code is the opposite of the order in the output. When something runs depends on **which queue** it goes into, not on which line comes first.

## 🔍 Deeper version

**The full order, after any piece of code finishes:**

| Order | What | Queue / phase |
|---|---|---|
| 1 | `process.nextTick` callbacks | nextTick queue (Node only) |
| 2 | `.then`, `.catch`, code after `await`, `queueMicrotask` | promise [microtask](glossary:microtask) queue |
| 3 | `setImmediate` | **check** phase |
| 4 | `setTimeout`, `setInterval` | **timers** phase (next round) |

Both microtask queues are emptied after **every** callback, before the loop continues. See [the event loop](topic:nodejs/event-loop).

**setTimeout vs setImmediate in the main script.**

```js
setTimeout(() => console.log('timeout'), 0);   // timers phase
setImmediate(() => console.log('immediate'));  // check phase
// In the MAIN script, the order can change from run to run!
```

When the main script ends, the loop starts at the timers phase. If 1 ms has already passed, the timeout runs first. If not, the immediate runs first. It depends on how fast your computer is. **Inside an I/O callback**, `setImmediate` always wins, because check comes right after poll.

**Details about `setTimeout`:**
- A delay of `0` (or less than 1) becomes **1 ms**.
- The delay is a **minimum**, not a promise. If the loop is busy, it runs later.
- Delays above 2,147,483,647 ms (about 24.8 days) are too big. Node sets them to 1 ms and prints a `TimeoutOverflowWarning`.
- In Node, `setTimeout` returns a `Timeout` object with `.unref()` (don't keep the process alive) and `.refresh()`.

**Promise-based timers.** Node has awaitable versions:

```js
const { setTimeout: sleep } = require('node:timers/promises'); // promise version of setTimeout
await sleep(1000);                                              // wait 1000 ms (1 second) without blocking
```

**When to use which:**
- **`process.nextTick`**: rare. Use it when an API must call back *asynchronously* but *before* any I/O. For example, emitting an error event after a constructor returns, so the caller can attach listeners first.
- **`queueMicrotask` or promises**: the standard way to run something "very soon". It also works in browsers.
- **`setImmediate`**: to give I/O a chance to run. For example, between chunks of a long CPU task. See [Blocking the event loop](topic:nodejs/blocking-the-event-loop).
- **`setTimeout`**: when you need a real time delay (retry after 2 seconds, debounce).

:::tip[Node docs advice]
The Node.js docs recommend using `setImmediate` instead of `process.nextTick` in most cases. It is easier to reason about, and it can't starve I/O.
:::

## 🎯 Why do we use it?

- **To control the order of async steps.** For example, let the caller attach listeners before you emit an event.
- **To keep the server responsive.** Splitting long work with `setImmediate` lets other requests run in between.
- **To delay or retry work** with `setTimeout`, like retrying a failed API call after a short wait.
- **To answer "predict the output" questions**, which are very common in interviews.

## ⚠️ Common mistakes

- **Thinking `setTimeout(fn, 0)` runs immediately.** It runs after the current code, after all microtasks, and in a later timers phase.
- **Relying on the setTimeout-vs-setImmediate order in the main script.** It's not guaranteed.
- **Calling `process.nextTick` recursively.** The loop never reaches I/O, and the server freezes.
- **Mixing up the names.** "nextTick" actually runs **sooner** than "setImmediate". The names are historical and confusing.

## 🗣️ How to answer in an interview

> "All three schedule a function to run later, but at different points.
>
> `process.nextTick` runs right after the current operation finishes, before promise callbacks and before the event loop moves to the next phase. Promise callbacks run next, as microtasks. `setImmediate` runs in the check phase, right after the poll phase where I/O callbacks run. And `setTimeout` with zero delay runs in the timers phase, after at least one millisecond.
>
> So inside an I/O callback, the order is nextTick, promise, setImmediate, setTimeout. In the main script, setTimeout versus setImmediate is not guaranteed.
>
> In practice I use promises for 'run soon', setImmediate to give I/O a chance during long work, and setTimeout for real delays like retries. I avoid nextTick, because recursive nextTick calls can starve the event loop."

## 🔁 Follow-up questions

### What is `queueMicrotask`?

A standard function (also in browsers) that puts a callback in the **promise microtask queue**. It runs after the nextTick queue and before `setImmediate`. Use it instead of `process.nextTick` when you want code that also works in browsers.

### Why would anyone use `process.nextTick`?

To make an API **always asynchronous**, even when the answer is ready immediately. For example, a function that sometimes calls back synchronously and sometimes later is confusing. Wrapping the early call in `nextTick` makes it consistent. Node's own core modules use it for this.

### Can `setTimeout` run later than the delay you give?

Yes, often. The delay is only a minimum. If the thread is busy with other callbacks or CPU work, the timer waits until the timers phase comes around.

### How do you cancel each one?

`clearTimeout(t)` for `setTimeout`, `clearInterval(i)` for `setInterval`, and `clearImmediate(im)` for `setImmediate`. There is no way to cancel a `process.nextTick` callback.

## ✅ Quick check

### 1. Predict the output.

```js
setImmediate(() => console.log('A'));             // check phase
process.nextTick(() => console.log('B'));         // nextTick queue
Promise.resolve().then(() => console.log('C'));   // promise microtask
console.log('D');                                 // normal code
```

:::answer
**D, B, C, A.** Normal code first. Then the nextTick queue (B), then promises (C). Then the loop reaches the check phase (A).
:::

### 2. Which is guaranteed?

- A) In the main script, `setTimeout(f, 0)` always runs before `setImmediate(g)`
- B) Inside an `fs.readFile` callback, `setImmediate(g)` always runs before `setTimeout(f, 0)`
- C) `setTimeout(f, 0)` runs after exactly 0 ms

:::answer
**B.** After the poll phase comes the check phase in the same round. A depends on timing and can change between runs. C is wrong: the minimum delay is 1 ms, and it can be later.
:::

### 3. What happens here?

```js
function again() { process.nextTick(again); }   // schedules itself forever
again();                                         // start it
setTimeout(() => console.log('timer'), 10);      // will this ever print?
```

:::answer
**"timer" never prints.** The nextTick queue never empties, so the loop never reaches the timers phase. This is called starving the event loop.
:::
