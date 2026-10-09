---
title: "Higher-order functions and callbacks"
stack: javascript
order: 17
level: Basic
mustKnow: false
askedFrequency: common
summary:
  - In JavaScript, functions are values. You can store them, pass them and return them.
  - A higher-order function takes a function as an input, or returns a function, or both.
  - A callback is the function you pass in, so the other function can call it later.
  - "map, filter, setTimeout, addEventListener and Express middleware all use callbacks."
  - "Returning a function (a factory like makeMultiplier) relies on closures."
cards:
  - q: What is a higher-order function?
    a: A function that takes another function as an argument, or returns a function. map, filter and setTimeout are examples.
  - q: What is a callback?
    a: A function you pass into another function, so that function can call it — now (like in map) or later (like in setTimeout).
  - q: What does "functions are first-class" mean?
    a: Functions are values like numbers or strings. You can assign them to variables, pass them as arguments and return them.
  - q: Synchronous vs asynchronous callbacks?
    a: A synchronous callback runs right away inside the call (map, forEach). An asynchronous one runs later (setTimeout, fs.readFile, a click handler).
  - q: What is callback hell?
    a: Many callbacks nested inside each other, making code hard to read and handle errors. Promises and async/await fix it.
---

## 💡 What is it?

In JavaScript, a [function](glossary:function) is a **value**, just like a number or a string. You can put it in a variable, pass it to another function, or return it from a function.

- A **higher-order function** is a function that **takes a function** as an input, or **returns a function**.
- A **[callback](glossary:callback)** is the function you **pass in**. The other function "calls it back" when it needs to.

You already use these every day: `map`, `filter`, `setTimeout` and `addEventListener` all take callbacks.

## 🏠 Real-life example

Think of a **school sports day**.

The PE teacher says: "When I blow the whistle, **do this**: run to the finish line." The teacher doesn't run. They **hold your instruction** and **use it** at the right moment.

- **The PE teacher** = the higher-order function (it receives the instruction).
- **"Run to the finish line"** = the callback (the instruction you gave).
- **The whistle** = the moment the callback runs, either right now or later.

A **function that returns a function** is like a **stamp maker**. You order a stamp that says "PASSED". The shop (the outer function) gives you a stamp (a new function). You use it on every answer sheet later.

## 🧑‍💻 Code example

Save this as `hof.js`. Run it with `node hof.js`.

```js
function repeat(times, action) {                 // a HIGHER-ORDER function: action is a function
  for (let i = 1; i <= times; i++) {             // run the loop "times" times
    action(i);                                   // call the callback, passing the round number
  }                                              // end of the loop
}                                                // end of repeat

repeat(3, (n) => console.log('Round', n));       // pass an arrow function as the callback

function makeMultiplier(factor) {                // a function that RETURNS a function
  return (num) => num * factor;                  // the new function remembers factor (a closure)
}                                                // end of makeMultiplier

const triple = makeMultiplier(3);                // triple is now a function: num => num * 3
console.log(triple(5));                          // 15

const prices = [100, 250, 40];                   // a list of prices
const discounted = prices.map((p) => p - 10);    // map is a built-in higher-order function
console.log(discounted);                         // every price minus 10
```

**Output:**

```text
Round 1
Round 2
Round 3
15
[ 90, 240, 30 ]
```

**What to notice:**
- `repeat` doesn't know **what** to do each round. The callback decides. That's what makes it reusable.
- `makeMultiplier(3)` returned a brand-new function. It remembers `3` because of a [closure](topic:javascript/closures).

## 🔍 Deeper version

**"First-class functions"** means functions are normal values. That's what makes higher-order functions possible.

**Two kinds of callbacks:**

| Kind | When it runs | Examples |
|---|---|---|
| **Synchronous** | right now, before the outer function returns | `map`, `filter`, `forEach`, `sort` compare function |
| **Asynchronous** | later, after some event or wait | `setTimeout`, `addEventListener`, `fs.readFile`, `.then()` |

Async callbacks run later through the [event loop](topic:javascript/event-loop).

**Node's "error-first" callbacks.** Older Node APIs pass the error as the first argument:

```js
fs.readFile('a.txt', 'utf8', (err, data) => {    // Node calls this when the file is read
  if (err) return console.error(err.message);    // always check the error first
  console.log(data);                             // only then use the data
});                                              // end of the callback
```

**Callback hell.** When each step needs the result of the previous one, callbacks nest deeper and deeper. Error handling gets repeated at every level. [Promises](topic:javascript/promises) and [async/await](topic:javascript/async-await) flatten this.

**Real higher-order functions you write as a backend developer:**
- **Express middleware factories**: `allowRole('admin')` returns a middleware function.
- **Async error wrappers** (in Express 4): `asyncHandler(fn)` returns a function that catches errors from `fn`.
- **[Debounce and throttle](topic:javascript/debounce-throttle)**: they take a function and return a "controlled" version.
- **React**: `onClick={() => ...}` passes a callback. Higher-order components (HOCs) take a component and return a new one.

**Composition.** Small functions can be combined into bigger ones: `compose(trim, toLowerCase)`. See [currying and composition](topic:javascript/currying-composition).

**Pure callbacks.** For `map`, `filter` and `reduce`, the callback should only compute and return a value. It should not change outside variables. That keeps code predictable.

## 🎯 Why do we use it?

- **Reuse.** One loop function (`repeat`, `map`) works for any action. You only pass a different callback.
- **Separation of jobs.** The higher-order function handles *how* (looping, timing, waiting). The callback handles *what*.
- **Async work.** JavaScript can't stop and wait. Callbacks are how you say "do this when the data arrives".
- **Customised functions.** Factories like `makeMultiplier` or `allowRole` create many specific functions from one piece of code.

## ⚠️ Common mistakes

- **Calling the callback instead of passing it.** `setTimeout(sayHi(), 1000)` runs `sayHi` now and passes its result. Write `setTimeout(sayHi, 1000)` or `setTimeout(() => sayHi(), 1000)`.
- **Losing `this`** when passing a method as a callback. Use `bind` or an arrow. See [the this keyword](topic:javascript/this-keyword).
- **Ignoring the `err` argument** in Node-style callbacks.
- **Deep nesting** of async callbacks instead of using promises or async/await.

## 🗣️ How to answer in an interview

> "In JavaScript, functions are first-class values, so I can pass them around and return them. A higher-order function is one that takes a function as an argument, or returns one. The function I pass in is called a callback.
>
> Callbacks can be synchronous, like the function I give to map or filter, or asynchronous, like a setTimeout handler or a Node fs callback that runs later through the event loop.
>
> In backend work, I see this pattern everywhere. Express middleware factories like `allowRole('admin')` return a function, and in Express 4 an async wrapper takes a route handler and returns a safer one. The main things I watch for are passing a function instead of calling it, and avoiding nested callbacks by using async/await."

## 🔁 Follow-up questions

### Is every callback asynchronous?

No. The callback passed to `map` or `forEach` runs immediately, before `map` returns. A callback is only asynchronous when the function schedules it for later, like `setTimeout` or `fs.readFile`.

### What is a higher-order component in React?

A function that takes a component and returns a new component with extra behaviour, like `withAuth(Dashboard)`. Today most teams use custom hooks instead, but HOCs still appear in older code.

### Why is `setTimeout(fn(), 1000)` a bug?

`fn()` runs immediately, and its **return value** is passed to `setTimeout`. You need to pass the function itself: `setTimeout(fn, 1000)`.

### How do callbacks relate to promises?

A promise is an object for a future result. You still pass callbacks to `.then()` and `.catch()`. But the chain stays flat, and errors flow to one `.catch()`, instead of being handled in every nested callback.

## ✅ Quick check

### 1. What does this print?

```js
function apply(fn, value) { return fn(value); }          // a higher-order function
console.log(apply((x) => x + 1, 5), apply(String, 7));   // ?
```

:::answer
**`6 7`.** The first call runs `x => x + 1` on 5. The second passes the built-in `String` function, which turns 7 into the string `'7'` (console.log shows it as `7`).
:::

### 2. In what order is this printed?

```js
[1, 2].forEach((n) => console.log('loop', n));  // synchronous callback
setTimeout(() => console.log('timer'), 0);      // asynchronous callback
console.log('end');                              // normal code
```

:::answer
**`loop 1`, `loop 2`, `end`, `timer`.** The forEach callback runs right away. The setTimeout callback waits until the current code has finished.
:::
