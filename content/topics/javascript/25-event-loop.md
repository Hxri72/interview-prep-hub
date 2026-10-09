---
title: "The event loop: call stack, microtasks, macrotasks"
stack: javascript
order: 25
level: Intermediate
mustKnow: true
askedFrequency: very common
summary:
  - JavaScript runs one thing at a time on the call stack. Slow work (timers, network, clicks) is handled by the browser in the background.
  - When background work finishes, its callback waits in a queue. The event loop moves it to the call stack when the stack is empty.
  - "There are two main queues: microtasks (promise .then, await, queueMicrotask) and macrotasks/tasks (setTimeout, setInterval, events)."
  - "Order: run all normal code → run ALL microtasks → run ONE macrotask → microtasks again → and so on. The browser may repaint between tasks."
  - setTimeout(fn, 0) means "as soon as possible after the current code and microtasks", not "right now".
cards:
  - q: What is the event loop?
    a: The process that keeps checking whether the call stack is empty, and if it is, moves the next waiting callback from a queue onto the stack to run.
  - q: What is the difference between microtasks and macrotasks?
    a: "Microtasks are promise callbacks, await continuations and queueMicrotask. Macrotasks (tasks) are setTimeout, setInterval and events. All microtasks run before the next macrotask."
  - q: "console.log(1); setTimeout(()=>console.log(2)); Promise.resolve().then(()=>console.log(3)); console.log(4) — order?"
    a: "1, 4, 3, 2. Sync code first, then the promise microtask, then the timer macrotask."
  - q: Why can too many microtasks freeze the page?
    a: The browser empties the whole microtask queue before rendering or running the next task. If microtasks keep adding more microtasks, the page never repaints.
  - q: Is the browser event loop the same as Node's?
    a: The idea is the same (stack, microtasks, tasks), but Node's loop has named phases (timers, poll, check…) and extras like process.nextTick.
---

## 💡 What is it?

JavaScript runs **one thing at a time**. The function running right now sits on the **[call stack](glossary:call-stack)**.

Slow work, like timers, network calls and clicks, is handled by the browser **in the background**. When it's done, its [callback](glossary:callback) waits in a **queue**.

The **[event loop](glossary:event-loop)** is the helper that keeps asking: "Is the call stack empty? Then let me run the next waiting callback."

There are two waiting lines. The **[microtask](glossary:microtask)** line (promises) always goes before the **[macrotask](glossary:macrotask)** line (timers and events).

## 🏠 Real-life example

Think of **one teacher answering questions in class**.

The teacher can only talk to one student at a time.

- **The student the teacher is talking to now** = the call stack.
- **Homework sent home** (it comes back tomorrow) = background work, like a timer or an API call.
- **The class monitor's urgent notes** ("finish this point first!") = the microtask queue. The teacher reads **all** of these before taking anyone new.
- **Students waiting with their hands up** = the macrotask (task) queue. The teacher takes **one** student, then checks the monitor's notes again.
- **The teacher's habit of checking "who's next?"** = the event loop.

So a monitor's note always jumps ahead of the students with their hands up.

## 🧑‍💻 Code example

Save this as `event-loop.js`. Run it with `node event-loop.js`, or paste it into the browser console. The output is the same.

```js
console.log('1. script start');                     // normal code: goes on the call stack and runs now

setTimeout(() => {                                  // a macrotask: its callback waits in the task queue
  console.log('6. setTimeout');                     // runs after the stack is empty AND all microtasks are done
}, 0);                                              // 0 ms = "as soon as possible", not "right now"

Promise.resolve()                                   // a promise that is already fulfilled
  .then(() => console.log('3. promise 1'))          // .then callbacks are microtasks
  .then(() => console.log('5. promise 2'));         // this one is queued only after "promise 1" has run

queueMicrotask(() => console.log('4. microtask'));  // another microtask, queued after "promise 1"

console.log('2. script end');                       // normal code: runs now, before any queued callback
```

**Output:**

```text
1. script start
2. script end
3. promise 1
4. microtask
5. promise 2
6. setTimeout
```

**Why this order?**
1. `1` and `2` are normal code, so they run first.
2. The stack is empty, so **all** microtasks run: `promise 1`, then `microtask`. Running `promise 1` adds `promise 2` to the microtask queue, so it also runs now.
3. Only when the microtask queue is completely empty does the loop take a macrotask: the `setTimeout`.

## 🔍 Deeper version

**1. The pieces:**

| Piece | What it is |
|---|---|
| Call stack | The list of functions running right now. JavaScript runs whatever is on top. |
| Web APIs (browser) / libuv (Node) | Do the waiting in the background: timers, network, file reads, events. |
| Macrotask (task) queue | `setTimeout`, `setInterval`, user events, `MessageChannel`, I/O callbacks. |
| Microtask queue | Promise `.then` / `.catch` / `.finally`, code after `await`, `queueMicrotask`, `MutationObserver`. |
| Event loop | Moves callbacks from the queues to the stack when the stack is empty. |

**2. One turn of the browser loop:**
1. Take **one** macrotask and run it. (The first one is your whole script.)
2. Run **all** microtasks, including new ones added while running them.
3. If it's time, **render**: run `requestAnimationFrame` callbacks, then update the layout and paint.
4. Repeat.

**3. Why `setTimeout(fn, 0)` isn't instant.** It waits for the current code, then all microtasks, and often a render. Browsers also enforce a minimum delay of about 4 ms for deeply nested timers. So the number is a **minimum**, not an exact time.

**4. Microtask starvation.** If microtasks keep queuing more microtasks forever, the loop never reaches rendering or the next task. The page freezes, just like an endless `while` loop.

**5. Long tasks block rendering.** A 2-second sync loop means no clicks, no typing and no repaint for 2 seconds. Fixes: split the work into chunks (for example with `setTimeout` between chunks), or move it to a **Web Worker**.

**6. `await` and the loop.** Everything after an `await` runs as a microtask. So `async` code that awaits already-resolved values still runs **after** the current sync code.

**7. Node.js is similar but has more detail.** Node has named phases (timers, poll, check…), `setImmediate`, and `process.nextTick`, which runs even before promise microtasks. See [the Node.js event loop](topic:nodejs/event-loop).

## 🎯 Why do we use it?

- **To understand "predict the output" questions.** These are among the most-asked JavaScript interview questions.
- **To debug real bugs:** UI not updating during a long loop, state reading an old value, or code running in an unexpected order.
- **To write smooth UIs:** knowing that long tasks block rendering helps you keep the page responsive.

## ⚠️ Common mistakes

- **Thinking `setTimeout(fn, 0)` runs before promises.** Promise callbacks (microtasks) always run first.
- **Thinking `await` blocks the whole program.** It only pauses its own async function.
- **Doing heavy sync work on the main thread** and wondering why the spinner doesn't spin. The browser can't paint until the task ends.
- **Mixing up Node and browser details**, like saying the browser has `process.nextTick` or `setImmediate`. It doesn't.

## 🗣️ How to answer in an interview

> "JavaScript runs on a single thread with a call stack. Async work like timers, network requests and DOM events is handled by the browser's Web APIs, or by libuv in Node. When that work finishes, its callback is put in a queue, and the event loop moves it onto the stack once the stack is empty.
>
> There are two important queues. Microtasks are promise callbacks, code after await and queueMicrotask. Macrotasks are setTimeout, setInterval and events. After each task, the engine drains the whole microtask queue before it takes the next task, and the browser can render between tasks. So for console.log, setTimeout 0 and a resolved promise, the order is: the sync logs first, then the promise, then the timeout.
>
> In practice this matters because long synchronous work or endless microtasks block rendering. So I split heavy work or move it to a worker."

## 🔁 Follow-up questions

### Where does `requestAnimationFrame` fit?

It runs just **before the browser paints the next frame**, after the microtasks. It's the right place for animations. It is not a normal macrotask.

### What is `queueMicrotask`?

A built-in function that schedules a function as a microtask directly, without creating a promise.

### Why does a long `for` loop stop the UI from updating?

Rendering happens **between** tasks. While the loop runs, the current task never ends, so the browser can't paint or handle clicks.

### What is the order of `process.nextTick`, a promise and `setTimeout` in Node?

The sync code first, then `process.nextTick`, then the promise, then `setTimeout`. In Node, the nextTick queue runs before the promise microtask queue.

## ✅ Quick check

### 1. Predict the output.

```js
console.log('A');                                  // sync
setTimeout(() => console.log('B'), 0);             // macrotask
Promise.resolve().then(() => console.log('C'));    // microtask
console.log('D');                                  // sync
```

:::answer
**A, D, C, B.** Sync code first (A, D). Then the microtask (C). Then the macrotask (B).
:::

### 2. Predict the output.

```js
setTimeout(() => console.log('timeout'), 0);       // macrotask
(async () => {                                     // an async function that runs right away
  console.log('async start');                      // sync part of the async function
  await null;                                      // the rest becomes a microtask
  console.log('after await');                      // runs as a microtask
})();                                              // call it now
console.log('end');                                // sync
```

:::answer
**`async start`, `end`, `after await`, `timeout`.** The code before `await` runs immediately. The code after `await` is a microtask, so it runs before the timer.
:::

### 3. What does this print?

```js
setTimeout(() => console.log('T1'), 0);            // first timer
setTimeout(() => {                                 // second timer
  console.log('T2');                               // runs in its own task
  Promise.resolve().then(() => console.log('P'));  // a microtask queued inside T2
}, 0);                                             // also 0 ms
setTimeout(() => console.log('T3'), 0);            // third timer
```

:::answer
**T1, T2, P, T3.** After each task (timer), all microtasks run before the next task. So `P` runs right after `T2`, before `T3`.
:::
