---
title: Callbacks, Promises and async/await in Node
stack: nodejs
order: 18
level: Intermediate
mustKnow: true
askedFrequency: very common
summary:
  - Node has three ways to handle slow work — callbacks, Promises and async/await. They all do the same job; async/await is the easiest to read.
  - "Node callbacks are \"error-first\": callback(err, result). Always check err first."
  - async/await is built on Promises. await pauses only that function, not the whole of Node.
  - "Run independent work in parallel with Promise.all (fails fast) or Promise.allSettled (waits for all, even failures)."
  - Turn old callback functions into Promise functions with util.promisify, or use the built-in promise APIs like node:fs/promises.
cards:
  - q: What is an error-first callback?
    a: "Node's callback style: the first argument is the error (or null if it worked), and the second is the result. Example: fs.readFile(path, (err, data) => …)."
  - q: Does await block the Node.js event loop?
    a: No. await pauses only the async function it is in. Node keeps running other requests while it waits.
  - q: Promise.all vs Promise.allSettled?
    a: Promise.all rejects as soon as one promise fails. Promise.allSettled waits for all of them and tells you which passed and which failed.
  - q: How do you run three independent API calls at the same time?
    a: "Start them all, then await together: const [a, b, c] = await Promise.all([callA(), callB(), callC()])."
  - q: How do you convert a callback function to a Promise?
    a: Use util.promisify(fn), or use the promise version of the module, like require('node:fs/promises').
---

## 💡 What is it?

In Node, slow work like reading a file or calling a database happens in the background. Your code needs a way to say "when it's done, do this next". Node has **three ways** to do that:

1. **[Callbacks](glossary:callback)**: you give Node a function, and it calls it when the work is done.
2. **[Promises](glossary:promise)**: you get an object now that will hold the result later.
3. **async/await**: a cleaner way to write Promise code, so it reads like normal step-by-step code.

All three do the same job. Modern Node code mostly uses async/await.

## 🏠 Real-life example

Think of **ordering food at a busy food court**.

- **Callback** = you give the shop your phone number. "Call me when it's ready." You can't control much after that. If you order from 5 shops, you have 5 phone calls to juggle.
- **Promise** = the shop gives you a **token number** right away. The token is "a promise of food later". It ends as either "food ready" or "sorry, sold out".
- **async/await** = you hold your token and say, "I'll wait here for this one." But **only you** wait. The shop keeps serving other people.
- **Promise.all** = you order from 3 shops at once and eat when all 3 trays are ready. That's faster than ordering one, waiting, then ordering the next.

## 🧑‍💻 Code example

Save this as `async.js`. Run it with `node async.js`.

```js
const fs = require('node:fs');                               // callback-style file functions
const fsp = require('node:fs/promises');                     // promise-style versions of the same functions

// 1) Callback style — the oldest way
fs.readFile(__filename, 'utf8', (err, text) => {             // Node calls this function when the file is read
  if (err) return console.error('callback error:', err);     // FIRST argument = the error (or null if it worked)
  console.log('1) callback: read', text.length, 'chars');    // SECOND argument = the result
});                                                          // end of the callback

// 2) Promise style
fsp.readFile(__filename, 'utf8')                             // returns a Promise right away
  .then((text) => console.log('2) promise: read', text.length, 'chars')) // runs when it succeeds
  .catch((err) => console.error('promise error:', err));     // runs if it fails

// 3) async/await style — the same Promise, easier to read
const sleep = (ms) => new Promise((done) => setTimeout(done, ms)); // a helper: a Promise that finishes after ms milliseconds

async function main() {                                      // async = this function always returns a Promise
  try {                                                      // try/catch catches errors from any await below
    const text = await fsp.readFile(__filename, 'utf8');     // await = wait here for the Promise; Node stays free
    console.log('3) await: read', text.length, 'chars');     // runs after the file is read
    console.time('3 waits in parallel');                     // start a stopwatch
    await Promise.all([sleep(300), sleep(300), sleep(300)]); // start 3 waits at the SAME time, wait for all
    console.timeEnd('3 waits in parallel');                  // prints about 300ms, not 900ms
  } catch (err) {                                            // any error from the awaits lands here
    console.error('await error:', err);                      // show the error
  }                                                          // end of try/catch
}                                                            // end of main

main();                                                      // start main
```

**Output** (lines 1–3 can come in a different order):

```text
1) callback: read 2250 chars
2) promise: read 2250 chars
3) await: read 2250 chars
3 waits in parallel: 301.512ms
```

**What to notice:**
- The three reads all run in the background **at the same time**. That's why their order can change. Node never stops to wait.
- `Promise.all` took about 300 ms, not 900 ms. The three waits ran together.
- The number of chars depends on your file, so yours may be different.

## 🔍 Deeper version

**1. Error-first callbacks.** Node's core APIs use one rule: `callback(err, result)`. If `err` is not `null`, something went wrong, and you must handle it first. Code with many nested callbacks becomes hard to read. People call this **callback hell** (or the "pyramid of doom").

**2. Promises.** A Promise has three states:

| State | Meaning |
|---|---|
| pending | still working |
| fulfilled | finished with a value → `.then` runs |
| rejected | failed with an error → `.catch` runs |

A Promise settles **only once**. You can chain `.then()` calls, and one `.catch()` at the end handles errors from the whole chain.

**3. async/await.** An `async` function always returns a Promise. `await` pauses **only that function** until the Promise settles. The code after `await` runs later as a [microtask](glossary:microtask). Meanwhile, the [event loop](topic:nodejs/event-loop) keeps serving other work. A rejected Promise makes `await` throw, so you use normal `try/catch`.

**4. Sequential vs parallel.** This is the most common real bug:

```js
const user = await getUser(id);          // waits ~100 ms
const orders = await getOrders(id);      // then waits ~100 ms more → ~200 ms total

const [user2, orders2] = await Promise.all([getUser(id), getOrders(id)]); // both start together → ~100 ms total
```

Use the first style only when step 2 **needs** the result of step 1.

**5. The Promise combinators:**

| Method | Resolves when | Rejects when | Use it for |
|---|---|---|---|
| `Promise.all` | all succeed | **any one** fails (fail fast) | you need every result |
| `Promise.allSettled` | all finish (pass or fail) | never | batch jobs where some may fail |
| `Promise.race` | the first one settles | the first one fails | timeouts |
| `Promise.any` | the first one succeeds | all fail | trying several mirrors or providers |

**6. Converting old callback code.** Use `util.promisify(fn)`. Or use the built-in promise APIs: `node:fs/promises`, `node:timers/promises`, `node:stream/promises`, `node:dns/promises`.

**7. Loops.** `array.forEach(async (x) => { await … })` does **not** wait. `forEach` ignores the Promises. Use `for…of` with `await` to run one by one. Use `Promise.all(array.map(…))` to run all together.

**8. Timeouts and cancelling.** Many APIs accept an `AbortSignal`. For example, `fetch(url, { signal: AbortSignal.timeout(5000) })` gives up after 5 seconds.

:::version[Version note]
Since **Node.js 14.8**, you can use `await` at the top level of an **ES module** (`.mjs` files, or `"type": "module"` in package.json). In CommonJS files you still need an `async` function, like `main()` above.
:::

## 🎯 Why do we use it?

A backend spends most of its time **waiting** for databases, other APIs and files. These three patterns let Node start the slow work, keep serving other users, and continue your code when the result arrives.

async/await is the standard today because:
- the code reads top to bottom, like normal code,
- one `try/catch` handles errors from many steps,
- it's easy to switch between running steps one by one or in parallel.

## ⚠️ Common mistakes

- **Forgetting `await`.** You get a pending Promise instead of the data. Errors from it go unhandled.
- **Awaiting independent calls one by one.** Three 100 ms calls take 300 ms instead of 100 ms. Use `Promise.all`.
- **Using `forEach` with `async`.** It doesn't wait, so code after the loop runs too early.
- **Ignoring `err` in callbacks**, or forgetting `.catch()` on a Promise chain. The error is lost or crashes the app.

## 🗣️ How to answer in an interview

> "Node has three styles for async work. Callbacks are the oldest. Node uses error-first callbacks, where the first argument is the error. Deep nesting leads to callback hell. Promises fix that. A Promise is pending, then fulfilled or rejected, and you can chain `.then` with one `.catch`. async/await is syntax on top of Promises. It lets me write async code top to bottom with normal try/catch. `await` only pauses that function, not the event loop.
>
> The thing I watch most is sequential versus parallel. If calls don't depend on each other, I start them together with `Promise.all`. If some are allowed to fail, I use `Promise.allSettled`. For old callback APIs, I use `util.promisify` or the built-in promise modules like `fs/promises`."

[FILL IN: a real place at SkillKeepr where you ran calls in parallel or fixed a missing await. Only add it if it's true.]

## 🔁 Follow-up questions

### Is async/await faster than Promises?

No. async/await **is** Promises underneath. It only makes the code easier to read. Speed depends on whether you run work in parallel, not on which syntax you use.

### What happens if one promise in Promise.all fails?

`Promise.all` rejects right away with that error. The other promises keep running, but their results are ignored. If you need every result, pass or fail, use `Promise.allSettled`.

### How do you add a timeout to a promise?

Use `Promise.race([work(), timeoutPromise])`, where the timeout promise rejects after N ms. Or, if the API supports it, pass `AbortSignal.timeout(ms)`. The abort way is better, because it really cancels the work.

### How do you run 1,000 tasks without starting all of them at once?

Limit the concurrency (how many run at the same time). Process them in batches of, say, 10 with `Promise.all`. Or use a small library like `p-limit`. Starting 1,000 database calls at once can overload the database.

### What is the difference between process.nextTick, a resolved Promise and setTimeout?

`process.nextTick` runs first, then Promise callbacks (microtasks), then `setTimeout` in the timers phase of the [event loop](topic:nodejs/event-loop).

## ✅ Quick check

### 1. How long does this take, roughly?

```js
const wait = (ms) => new Promise((r) => setTimeout(r, ms)); // a Promise that finishes after ms
await wait(200);                                            // first wait
await wait(200);                                            // second wait
```

- A) about 200 ms
- B) about 400 ms

:::answer
**B) about 400 ms.** Each `await` waits for the previous one to finish. `await Promise.all([wait(200), wait(200)])` would take about 200 ms.
:::

### 2. What is wrong here?

```js
async function saveAll(users) {                 // save a list of users
  users.forEach(async (u) => await save(u));    // save each user
  console.log('all saved');                     // print when done
}
```

:::answer
`forEach` doesn't wait for async callbacks. "all saved" prints **before** the saves finish, and errors are not caught. Use `for (const u of users) await save(u);` or `await Promise.all(users.map(save));`.
:::

### 3. In `fs.readFile(path, (a, b) => {})`, what are `a` and `b`?

:::answer
`a` is the **error** (or `null` if it worked), and `b` is the **result** (the file content). This is Node's error-first callback style.
:::
