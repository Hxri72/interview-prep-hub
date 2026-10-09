---
title: async/await and error handling
stack: javascript
order: 23
level: Intermediate
mustKnow: true
askedFrequency: very common
summary:
  - async/await is a cleaner way to write promise code. It reads top to bottom, like normal code.
  - An async function always returns a promise. await pauses that function until a promise settles.
  - Handle errors with try/catch around await; use finally for cleanup like hiding a loader.
  - Awaiting calls one by one makes them run in sequence. Use Promise.all to run independent calls at the same time.
  - "await only pauses its own function — the rest of the program keeps running."
cards:
  - q: What does the async keyword do?
    a: It makes a function always return a promise. If the function returns a value, the promise resolves with it; if it throws, the promise rejects.
  - q: What does await do?
    a: It pauses the async function until the promise settles, then gives you the value — or throws the error if the promise was rejected.
  - q: How do you handle errors with async/await?
    a: Wrap the await calls in try/catch. Use finally for cleanup that must always run.
  - q: Why can two awaits in a row be slow?
    a: The second call only starts after the first finishes. If they don't depend on each other, start both and use await Promise.all([...]).
  - q: Does await block the whole program?
    a: No. It only pauses its own async function. Other code, events and requests keep running.
---

## 💡 What is it?

`async` and `await` are a **cleaner way to write [promise](glossary:promise) code**.

An `async` function always returns a promise. Inside it, `await` **pauses the function** until a promise is finished, then gives you the result.

The code reads top to bottom, like normal code. For errors, you use the normal `try/catch`.

## 🏠 Real-life example

Think of **making tea with a kettle**.

You switch on the kettle. Then you **wait** for the water to boil before pouring it. You can't pour cold water! But while you wait, your family in the house carries on with their own work.

- **Making tea (the whole recipe)** = the `async` function.
- **"Wait until the water boils"** = `await`.
- **The boiling water** = the value you get from the promise.
- **Your family carrying on** = the rest of the program keeps running. `await` doesn't stop the whole house.
- **"If the kettle is broken, make coffee instead"** = `try/catch`.
- **"Switch off the gas at the end, no matter what"** = `finally`.

## 🧑‍💻 Code example

Save this as `async-await.js`. Run it with `node async-await.js`.

```js
function getUser(id) {                               // a promise-based fake database call
  return new Promise((resolve, reject) =>            // make a new promise
    setTimeout(() =>                                 // wait a little, like a real database
      id > 0 ? resolve({ id, name: 'Asha' })         // good id → success with a user
             : reject(new Error('User not found')),  // bad id → failure with an error
    100));                                           // 100 = wait 100 milliseconds
}                                                    // end of getUser

async function showUser(id) {                        // async = this function always returns a promise
  try {                                              // try = "run this, but catch any error"
    const user = await getUser(id);                  // await = pause HERE until the promise settles
    console.log('Hello', user.name);                 // runs only after the user has arrived
    return user.name;                                // becomes the value of the returned promise
  } catch (err) {                                    // runs if the awaited promise was rejected
    console.log('Problem:', err.message);            // show a friendly message
    return null;                                     // return something safe instead of crashing
  } finally {                                        // always runs, success or failure
    console.log('Finished id', id);                  // good place to stop a loading spinner
  }                                                  // end of try/catch/finally
}                                                    // end of showUser

async function main() {                              // a wrapper so we can use await at the top
  await showUser(7);                                 // wait for the first call to finish
  await showUser(-1);                                // then run the second one (this one fails)
  console.log('All done');                           // runs last
}                                                    // end of main

main();                                              // start everything
```

**Output:**

```text
Hello Asha
Finished id 7
Problem: User not found
Finished id -1
All done
```

## 🔍 Deeper version

**1. What `async` really does.** An `async` function **always** returns a promise:
- `return 5` → the promise resolves with `5`.
- `throw new Error()` → the promise rejects with that error.

So the caller still needs `await` or `.then` to get the value.

**2. What `await` really does.** `await promise` pauses only **this** function. The rest of the function becomes a [microtask](glossary:microtask) that runs when the promise settles. If the promise **rejects**, `await` **throws** the error at that line. That's why normal `try/catch` works.

**3. Sequential vs parallel — the most common performance bug.**

```js
const user = await getUser(id);                     // waits ~100 ms
const jobs = await getJobs();                       // starts only AFTER the user arrives → ~200 ms total

const [user2, jobs2] = await Promise.all([          // start both at the same time
  getUser(id),                                      // ~100 ms
  getJobs(),                                        // ~100 ms
]);                                                 // total ≈ 100 ms (the slowest one)
```

Await one by one **only when a step needs the result of the step before it**. See [Promise.all and friends](topic:javascript/promise-combinators).

**4. `await` in loops.**
- `for...of` with `await` inside runs the steps **one by one**, in order. That's good when order or rate limits matter.
- `array.forEach(async (x) => { await ... })` does **not** wait. `forEach` ignores the returned promises. Use `for...of`, or `await Promise.all(array.map(async ...))`.

**5. Where errors can slip through:**
- Calling an async function **without `await`** (a "floating promise"). If it fails, nothing catches it.
- A `try/catch` only catches errors from the promises you **await** inside it.

:::version[Version note]
**Top-level `await`** (using `await` outside any function) works in ES modules: `.mjs` files, `"type": "module"`, and `<script type="module">` in browsers. It has worked in Node since 14.8. In CommonJS files, you still need an `async` function like `main()`.
:::

**6. In Express 5**, if an `async` route handler throws or rejects, the error goes to your error middleware automatically. In Express 4, you needed a wrapper. See [async errors in Express](topic:express/async-errors).

## 🎯 Why do we use it?

- **Readable code.** Async steps read like a simple list, top to bottom.
- **Normal error handling.** `try/catch/finally` works the same as for sync code.
- **Easier debugging.** Stack traces and breakpoints are easier to follow than long `.then` chains.
- **It's the standard today** in React data loading, Express routes, database calls and AI API calls.

## ⚠️ Common mistakes

- **Forgetting `await`.** You get a pending promise instead of the data, for example `user.name` is `undefined`.
- **Awaiting independent calls one by one.** The page or API is slower than it needs to be.
- **Using `await` inside `forEach`** and expecting it to wait.
- **Having no `try/catch`** (or `.catch`) anywhere up the chain. This causes unhandled rejections.

## 🗣️ How to answer in an interview

> "async/await is syntax on top of promises. An async function always returns a promise. Inside it, await pauses that function until the promise settles, and then gives me the value or throws the error. Because of that, I can use normal try/catch for errors and finally for cleanup, like turning off a loading state.
>
> await only pauses its own function, not the whole program, so other requests and events keep running.
>
> The main thing I watch for is accidental sequential code. If two calls don't depend on each other, I start them together with Promise.all, or allSettled if some can fail. I also avoid await inside forEach, because forEach doesn't wait. I use for...of when order matters."

[FILL IN: a real place you used Promise.all or async/await error handling at SkillKeepr, e.g. calling several APIs at once — only if it's true.]

## 🔁 Follow-up questions

### What's the difference between `return await promise` and `return promise` in an async function?

Inside a `try/catch`, `return await` lets the `catch` handle a rejection. Plain `return promise` sends the rejection to the caller instead. Outside `try/catch`, they behave almost the same.

### How do you run 3 API calls in parallel with async/await?

Start them together: `const [a, b, c] = await Promise.all([callA(), callB(), callC()]);`. Use `Promise.allSettled` if you want the results even when some calls fail.

### Can you use `await` in a normal (non-async) function?

No, it's a syntax error. The only exception is top-level `await` in ES modules.

### How do you add a timeout to an awaited call?

Use `Promise.race` with a timer promise. Or, for `fetch`, pass `signal: AbortSignal.timeout(5000)` so the request is cancelled after 5 seconds.

## ✅ Quick check

### 1. What does this print?

```js
async function f() { return 5; }                   // an async function returning 5
console.log(f());                                  // ?
f().then((v) => console.log(v));                   // ?
```

:::answer
First **`Promise { 5 }`**, then **`5`**. An async function always returns a promise, so you need `await` or `.then` to get the value.
:::

### 2. Predict the order.

```js
async function run() {                             // an async function
  console.log('A');                                // runs right away when run() is called
  await null;                                      // pause; the rest becomes a microtask
  console.log('C');                                // runs after the current sync code
}
run();                                             // call it
console.log('B');                                  // normal code
```

:::answer
**A, B, C.** The code before the first `await` runs immediately. After `await`, the function pauses, so `B` prints before `C`.
:::

### 3. Roughly how long does this take, if each call takes 1 second?

```js
const a = await callA();                           // 1 second
const b = await callB();                           // 1 second, doesn't need a
```

:::answer
**About 2 seconds**, because `callB` starts only after `callA` finishes. With `await Promise.all([callA(), callB()])`, it would take about 1 second.
:::
