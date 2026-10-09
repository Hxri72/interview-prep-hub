---
title: Promises
stack: javascript
order: 22
level: Intermediate
mustKnow: true
askedFrequency: very common
summary:
  - A promise is an object that stands for a value that will arrive later.
  - "It has three states: pending, fulfilled (success) or rejected (error). Once settled, it never changes."
  - .then runs on success, .catch on error, and .finally in both cases. Each returns a new promise, so you can chain them.
  - Whatever you return from .then is passed to the next .then; a thrown error jumps to the nearest .catch.
  - Promise callbacks are microtasks, so they run before timers like setTimeout.
cards:
  - q: What is a promise?
    a: An object that represents a value that isn't ready yet. Later it becomes fulfilled with a value or rejected with an error.
  - q: What are the three states of a promise?
    a: Pending (still waiting), fulfilled (success with a value) and rejected (failed with a reason). Fulfilled and rejected together are called "settled".
  - q: What does .then return?
    a: A new promise. It resolves with whatever the .then callback returns, which is why you can chain .then calls.
  - q: Where does an error inside a .then go?
    a: It rejects the promise returned by that .then, and skips forward to the next .catch in the chain.
  - q: How do promises fix callback hell?
    a: Steps are chained flat with .then instead of nested, and one .catch at the end handles errors from any step.
---

## 💡 What is it?

A **[promise](glossary:promise)** is an object that stands for **a value that will arrive later**.

When you start slow work, like an API call, you get a promise back right away. Later, the promise is either **fulfilled** (it worked and has a value) or **rejected** (it failed and has an error).

You attach code with `.then` for success and `.catch` for errors.

## 🏠 Real-life example

Think of **ordering food at a food court**.

You pay and get a **token with a number**. You don't have your food yet, but the token promises you'll get it. You sit down and chat. Later, one of two things happens:
- your number is called and you get the food, or
- the counter says, "Sorry, we ran out."

- **The token** = the promise.
- **Waiting with the token** = the "pending" state.
- **Getting your food** = "fulfilled", and the food is the value.
- **"Sorry, we ran out"** = "rejected", and the reason is the error.
- **"When my number is called, I'll eat"** = `.then`.
- **"If they run out, I'll order something else"** = `.catch`.

A token is used **once**. Once you have the food (or the bad news), it doesn't change again.

## 🧑‍💻 Code example

Save this as `promises.js`. Run it with `node promises.js`.

```js
function getUser(id) {                              // returns a Promise instead of taking a callback
  return new Promise((resolve, reject) => {         // resolve = "success", reject = "failure"
    setTimeout(() => {                              // pretend the database takes 100 ms
      if (id <= 0) reject(new Error('Bad id'));     // bad input → the promise becomes rejected
      else resolve({ id, name: 'Asha' });           // good input → the promise becomes fulfilled with a user
    }, 100);                                        // wait 100 milliseconds
  });                                               // end of new Promise
}                                                   // end of getUser

console.log('Start');                               // runs first

getUser(7)                                          // start the work; we get a Promise back right away
  .then((user) => {                                 // runs when the promise is fulfilled
    console.log('Got user:', user.name);            // prints Asha
    return user.name.toUpperCase();                 // the value we return goes to the next .then
  })                                                // end of first .then
  .then((upper) => console.log('Upper:', upper))    // receives "ASHA" from the step above
  .catch((err) => console.log('Error:', err.message)) // runs if ANY step above failed
  .finally(() => console.log('Done 1'));            // runs at the end, success or failure

getUser(0)                                          // this one will fail on purpose
  .then((user) => console.log('Never runs', user))  // skipped, because the promise is rejected
  .catch((err) => console.log('Error:', err.message)); // prints "Bad id"

console.log('End of script');                       // runs before any .then, because promises are async
```

**Output:**

```text
Start
End of script
Got user: Asha
Upper: ASHA
Done 1
Error: Bad id
```

## 🔍 Deeper version

**1. States.** A promise starts **pending**. It settles **once**, to **fulfilled** or **rejected**, and then never changes. Calling `resolve` or `reject` a second time does nothing.

**2. Chaining rules.** Every `.then`, `.catch` and `.finally` returns a **new** promise:
- If the callback **returns a value**, the next `.then` gets that value.
- If it **returns a promise**, the chain **waits** for that promise. That's how you run async steps in order without nesting.
- If it **throws**, the chain jumps to the next `.catch`.
- A `.catch` that returns normally **recovers** the chain. The `.then` after it will run.
- `.finally` gets no value. It passes the original result or error through unchanged.

**3. Promises are microtasks.** `.then` callbacks always run **asynchronously**, even if the promise is already settled. They go in the [microtask](glossary:microtask) queue, which runs before timers. So `Promise.resolve().then(a); setTimeout(b, 0);` runs `a` before `b`. See [the event loop](topic:javascript/event-loop).

**4. Useful helpers:**
- `Promise.resolve(value)` and `Promise.reject(error)` make already-settled promises.
- `Promise.all`, `allSettled`, `race` and `any` combine many promises. See [promise combinators](topic:javascript/promise-combinators).

:::version[Version note]
**ES2024** added `Promise.withResolvers()`. It returns `{ promise, resolve, reject }`, so you can resolve a promise from outside its constructor. Older code did this by saving `resolve` into an outer variable.
:::

**5. Unhandled rejections.** If a promise rejects and nothing catches it, the browser logs an "Uncaught (in promise)" error. Since Node.js 15, an unhandled rejection **crashes the process** by default. Always end chains with `.catch`, or use `try/catch` with `await`. See [error handling in Node](topic:nodejs/error-handling).

**6. The "forgot to return" bug.** Inside a `.then`, if you start another promise but don't `return` it, the chain won't wait for it. Its errors also won't reach your `.catch`.

## 🎯 Why do we use it?

- **Flat code instead of callback hell.** Steps go one after another: `.then().then()`. See [callbacks](topic:javascript/callbacks).
- **One place for errors.** A single `.catch` handles a failure from any step.
- **A promise settles only once.** You don't need to trust a library to call your callback exactly once.
- **It's the base of `async/await`,** `fetch`, and almost every modern API (database drivers, Stripe, OpenAI SDKs).

## ⚠️ Common mistakes

- **Forgetting to `return`** a promise inside `.then`. The chain doesn't wait, and errors are lost.
- **No `.catch` at the end.** This causes unhandled rejections, which crash Node.
- **Nesting `.then` inside `.then`.** This recreates callback hell. Return the inner promise and chain instead.
- **Wrapping a promise in `new Promise` for no reason** (the "explicit construction" anti-pattern). If you already have a promise, just return it.

## 🗣️ How to answer in an interview

> "A promise is an object that represents the result of an async operation that isn't finished yet. It starts pending and settles once, either fulfilled with a value or rejected with an error, and it never changes after that.
>
> I handle it with .then for success, .catch for errors and .finally for cleanup. Each of these returns a new promise. If I return a value, the next .then gets it. If I return a promise, the chain waits for it. If something throws, it skips to the nearest .catch. That's how promises replaced deeply nested callbacks with a flat chain and one error handler.
>
> Promise callbacks run as microtasks, so they run before setTimeout callbacks. And I always handle rejections, because in Node an unhandled rejection crashes the process."

## 🔁 Follow-up questions

### What is the difference between `.then(success, failure)` and `.then(success).catch(failure)`?

With `.then(success, failure)`, an error **thrown inside `success`** is not caught by `failure`. With `.then(success).catch(failure)`, the `.catch` also catches errors from `success`. The second form is usually what you want.

### Can a promise be resolved twice?

No. The first `resolve` or `reject` wins. Later calls are ignored.

### How do you turn a callback API into a promise?

Wrap it: `new Promise((resolve, reject) => fs.readFile(p, (err, data) => err ? reject(err) : resolve(data)))`. In Node, you can also use `util.promisify` or the built-in promise versions like `fs/promises`.

### What is a "thenable"?

Any object with a `.then` method. `await` and `Promise.resolve` treat it like a promise. That's how some older libraries' promise-like objects work with modern code.

## ✅ Quick check

### 1. What does this print?

```js
Promise.resolve(1)                                 // a fulfilled promise with value 1
  .then((x) => x + 1)                              // returns 2
  .then((x) => { throw new Error('oops ' + x); })  // throws with x = 2
  .then(() => console.log('skipped'))              // skipped because of the error
  .catch((e) => console.log(e.message))            // catches the error
  .then(() => console.log('after catch'));         // runs, because catch recovered the chain
```

:::answer
**`oops 2`, then `after catch`.** The error skips the third `.then`. `.catch` handles it and returns normally, so the last `.then` runs.
:::

### 2. Predict the order.

```js
setTimeout(() => console.log('timeout'), 0);       // a macrotask
Promise.resolve().then(() => console.log('promise')); // a microtask
console.log('sync');                               // normal code
```

:::answer
**`sync`, `promise`, `timeout`.** Normal code runs first. Then microtasks (promise callbacks). Then timers.
:::

### 3. True or false: `.then` callbacks run synchronously if the promise is already resolved.

:::answer
**False.** They always run asynchronously, as microtasks, after the current code has finished.
:::
