---
title: Callbacks and callback hell
stack: javascript
order: 21
level: Basic
mustKnow: false
askedFrequency: common
summary:
  - A callback is a function you pass to another function, so it can be called later.
  - Callbacks are how JavaScript first handled async work like timers, events and file reads.
  - Node-style callbacks take the error first, (err, data), and you must check err every time.
  - Nesting many async steps inside each other makes deep, hard-to-read code called callback hell (the pyramid of doom).
  - Promises and async/await fix callback hell by keeping steps flat and giving one place to handle errors.
cards:
  - q: What is a callback?
    a: A function passed as an argument to another function, which calls it later — for example when a timer ends or data arrives.
  - q: What is an error-first callback?
    a: "The Node.js style where the callback's first argument is an error (or null) and the second is the result: (err, data) => {...}."
  - q: What is callback hell?
    a: Many async steps nested inside each other's callbacks, making code drift to the right and become hard to read, debug and handle errors in.
  - q: How do you fix callback hell?
    a: Use promises or async/await. You can also split nested steps into named functions.
  - q: Are all callbacks asynchronous?
    a: No. The function you pass to array.map or forEach is a callback too, but it runs synchronously, right away.
---

## 💡 What is it?

A **[callback](glossary:callback)** is a function you **give to another function**, so that function can **call it later**.

"Later" might mean "when the timer ends", "when the user clicks" or "when the data arrives".

**Callback hell** is what happens when many slow steps are nested inside each other's callbacks. The code drifts to the right like a pyramid and becomes hard to read.

## 🏠 Real-life example

Think of a **tailor shop**.

You give the tailor your cloth and your phone number. You say: "Call me when the shirt is ready." Then you go home. You don't wait in the shop.

- **Your phone number** = the callback.
- **The tailor** = the function that does the slow work.
- **The phone call** = the tailor calling your callback when the work is done.

Now imagine this: "When the shirt is ready, call the dry cleaner. When they finish, call the delivery boy. When he delivers, call me." Each step is inside the previous one. One mistake and the whole chain is confusing. That's **callback hell**.

## 🧑‍💻 Code example

Save this as `callbacks.js`. Run it with `node callbacks.js`.

```js
function getUser(id, callback) {                    // a fake "slow" function; callback = what to do when done
  setTimeout(() => {                                // pretend the database takes 100 ms
    callback(null, { id, name: 'Asha' });           // Node style: first argument = error (null = no error), second = data
  }, 100);                                          // 100 = wait 100 milliseconds
}                                                   // end of getUser

function getJobs(user, callback) {                  // another slow function that needs the user first
  setTimeout(() => {                                // pretend this takes 100 ms too
    if (!user) return callback(new Error('No user')); // something went wrong → pass an Error as the first argument
    callback(null, ['Node.js Developer', 'React Developer']); // success → error is null, data is the job list
  }, 100);                                          // wait 100 ms
}                                                   // end of getJobs

getUser(7, (err, user) => {                         // step 1: get the user; this arrow function is the callback
  if (err) return console.error(err.message);       // always check the error first
  console.log('User:', user.name);                  // prints the user's name
  getJobs(user, (err2, jobs) => {                   // step 2: nested callback — this nesting is how "callback hell" starts
    if (err2) return console.error(err2.message);   // check this step's error too
    console.log('Jobs:', jobs.join(', '));          // prints the jobs as one line of text
  });                                               // end of getJobs callback
});                                                 // end of getUser callback

console.log('Waiting...');                          // runs first, because the two steps above are async
```

**Output:**

```text
Waiting...
User: Asha
Jobs: Node.js Developer, React Developer
```

**What to notice:** there are only two steps, and the code is already nested twice. Imagine five steps.

## 🔍 Deeper version

**1. Sync vs async callbacks.** Not every callback is async.
- **Sync callbacks** run right away, inside the function: `[1, 2, 3].map(x => x * 2)`, `forEach`, `sort`.
- **Async callbacks** run later: `setTimeout`, `addEventListener`, `fs.readFile`.

**2. The error-first convention (Node.js).** Node's classic APIs use `(err, data)`. The first argument is an `Error` object, or `null` if all went well. You must check `err` in **every** callback. Throwing inside an async callback won't be caught by a `try/catch` around the outer call, because that code has already finished.

**3. What callback hell looks like:**

```js
getUser(id, (err, user) => {                        // level 1
  getJobs(user, (err, jobs) => {                    // level 2
    getApplications(jobs, (err, apps) => {          // level 3
      sendEmail(apps, (err) => {                    // level 4
        console.log('done');                        // the "pyramid of doom"
      });
    });
  });
});
```

Problems with it:
- **Hard to read.** The code moves right instead of down.
- **Error handling is repeated** at every level and easy to forget.
- **Hard to run steps in parallel** or to stop early.

**4. Inversion of control.** When you hand a callback to a library, you trust it to call your function **exactly once**, with the right arguments. A buggy library might call it twice or never. Promises fix this: a promise can only settle once.

**5. The fixes:**
- **Named functions:** split each level into its own function. It's flatter but still callback-based.
- **[Promises](topic:javascript/promises):** a flat `.then().then().catch()` chain with one place for errors.
- **[async/await](topic:javascript/async-await):** code that reads top to bottom, with normal `try/catch`.
- In Node, `util.promisify` turns an error-first callback function into a promise function. Most built-in modules also have promise versions, like `fs/promises`.

## 🎯 Why do we use it?

- **Callbacks are the base of async JavaScript.** Event listeners, timers and old Node APIs all use them.
- **They make functions flexible.** `array.map(callback)` lets you decide what happens to each item.
- **Understanding callback hell explains why promises and async/await exist.** That's a common interview story.

## ⚠️ Common mistakes

- **Not checking `err`** in an error-first callback, then crashing on `undefined` data.
- **Calling the callback twice**, for example forgetting `return` after `callback(err)`, so the success line runs too.
- **Wrapping an async callback call in `try/catch`** and expecting it to catch errors thrown later inside the callback.
- **Nesting many steps** instead of using promises or async/await.

## 🗣️ How to answer in an interview

> "A callback is a function passed into another function to be called later, for example when a timer ends, a click happens or data comes back. Not all callbacks are async. map and forEach callbacks run synchronously.
>
> Node's classic APIs use error-first callbacks: the first argument is an error or null, and the second is the result. The problem appears when async steps depend on each other. Each step goes inside the previous callback, and you get callback hell: deeply nested code, repeated error checks and hard debugging.
>
> Promises solved this with flat chains and a single catch. async/await made it read like normal code with try/catch. Today I use async/await, and if I meet an old callback API in Node, I wrap it with util.promisify or use the promise version of the module."

## 🔁 Follow-up questions

### What is `util.promisify`?

A Node helper. It takes a function that uses an error-first callback and returns a version that returns a promise. Then you can `await` it.

### Why can't `try/catch` catch an error thrown inside a `setTimeout` callback?

The `try` block has already finished by the time the callback runs. The error happens later, in a new call stack, so it isn't inside the `try` any more.

### What is "inversion of control" with callbacks?

You give control of *when and how often* your code runs to someone else's function. If it's buggy, it might call your callback twice or never. A promise can only settle once, which removes that risk.

### Are event listeners callbacks?

Yes. In `button.addEventListener('click', handleClick)`, `handleClick` is a callback that runs every time the event happens.

## ✅ Quick check

### 1. What does this print?

```js
[1, 2].forEach((n) => console.log('item', n));     // forEach calls the callback for each item
console.log('after');                              // the next line
```

:::answer
**`item 1`, `item 2`, `after`.** The `forEach` callback is synchronous, so it runs fully before the next line.
:::

### 2. What does this print?

```js
function load(cb) { setTimeout(() => cb('data'), 0); } // calls cb later
let result = 'empty';                              // starting value
load((d) => { result = d; });                      // the callback will change result later
console.log(result);                               // ?
```

:::answer
**`empty`.** The callback runs later, after `console.log` has already printed.
:::

### 3. What's the bug?

```js
function check(x, cb) {                            // error-first callback
  if (x < 0) cb(new Error('negative'));            // report an error
  cb(null, x);                                     // report success
}
```

:::answer
**It calls the callback twice for negative numbers.** After `cb(new Error(...))`, the function keeps going and also calls `cb(null, x)`. Fix it with `return cb(new Error('negative'));`.
:::
