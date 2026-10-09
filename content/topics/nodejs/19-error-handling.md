---
title: Error handling in Node (sync, async, unhandled rejections)
stack: nodejs
order: 19
level: Intermediate
mustKnow: true
askedFrequency: very common
summary:
  - Sync code → try/catch. Callbacks → check the err argument. Promises → .catch(). async/await → try/catch around await.
  - A rejected Promise that nobody handles crashes Node by default (since Node.js 15).
  - "process.on('uncaughtException') and process.on('unhandledRejection') are a last safety net: log the error, then exit and let a process manager restart the app."
  - Separate expected (operational) errors, like "user not found", from bugs (programmer errors).
  - Use Error objects (with a stack trace) and custom error classes with a status code, then handle them in one central place.
cards:
  - q: How do you catch errors from an await?
    a: Wrap the await in try/catch. A rejected Promise makes await throw, so a normal catch block receives the error.
  - q: What happens to an unhandled promise rejection in modern Node?
    a: Since Node.js 15, Node treats it like an uncaught exception. It prints the error and the process exits with code 1.
  - q: Can try/catch catch an error thrown inside a setTimeout callback?
    a: No. The callback runs later, after the try/catch has finished. You need a try/catch inside the callback itself.
  - q: Operational error vs programmer error?
    a: "Operational: expected problems at runtime — bad input, network timeout, record not found. Handle them. Programmer error: a bug, like reading a property of undefined. Fix the code; often the process should restart."
  - q: Should you keep the app running after uncaughtException?
    a: No. The app may be in a broken state. Log the error, close things cleanly, and exit. Let PM2, Docker or the platform restart it.
---

## 💡 What is it?

**Error handling** means planning what your app does when something goes wrong. A file may be missing, a database may be slow, or a user may send bad data.

Node has different tools for different kinds of code:
- **normal (sync) code** → `try/catch`
- **[callbacks](glossary:callback)** → check the `err` argument
- **[Promises](glossary:promise) and async/await** → `.catch()` or `try/catch` around `await`

If an error is not handled anywhere, Node **crashes the whole app**. Every user is affected, not just one.

## 🏠 Real-life example

Think of a **cricket team fielding**.

- The ball is hit. Each fielder must be ready to **catch** it in their area. That's `try/catch` around the code that might fail.
- If the ball goes over the boundary and nobody catches it, the other team scores. That's an **unhandled error**: it "escapes" and the app crashes.
- The **wicketkeeper** is the last line of defence behind everyone. That's `process.on('unhandledRejection')`. It catches what everyone else missed. But if the ball reaches him that often, the fielding plan is wrong.
- A **dropped catch** (an easy mistake) is a bug. A **brilliant shot** you couldn't stop is an expected problem. You plan for shots. You fix drops at practice.

## 🧑‍💻 Code example

Save this as `errors.js`. Run it with `node errors.js`.

```js
function parseUser(json) {                                 // turns JSON text into an object
  try {                                                    // try = "run this, but be ready for an error"
    return JSON.parse(json);                               // throws a SyntaxError if the text is not valid JSON
  } catch (err) {                                          // catch = runs only if something above threw
    console.log('Bad JSON:', err.message);                 // err.message = a short reason for the error
    return null;                                           // give back null so the caller can carry on
  }                                                        // end of try/catch
}                                                          // end of parseUser

async function loadOrder(id) {                             // async function → a throw becomes a rejected Promise
  if (!id) throw new Error('Order id is required');        // no id → reject with a clear message
  return { id, total: 499 };                               // success → resolve with this object
}                                                          // end of loadOrder

process.on('unhandledRejection', (reason) => {             // last safety net: a rejected Promise nobody handled
  console.error('Unhandled rejection:', reason.message);   // log it so we can find the bug
  process.exitCode = 1;                                    // mark the run as failed (exit code 1)
});                                                        // end of the safety net

async function main() {                                    // our main program
  console.log(parseUser('{"name":"Hari"}'));               // valid JSON → prints { name: 'Hari' }
  console.log(parseUser('{name: Hari}'));                  // invalid JSON → caught inside parseUser → prints null
  try {                                                    // catch errors that come from await
    await loadOrder();                                     // no id → loadOrder rejects → await throws here
  } catch (err) {                                          // so we handle it like a normal error
    console.log('Caught:', err.message);                   // prints "Caught: Order id is required"
  }                                                        // end of try/catch
  loadOrder();                                             // MISTAKE: no await and no .catch → nobody handles it
}                                                          // end of main

main();                                                    // start the program
```

**Output:**

```text
{ name: 'Hari' }
Bad JSON: Expected property name or '}' in JSON at position 1 (line 1 column 2)
null
Caught: Order id is required
Unhandled rejection: Order id is required
```

The exact wording of the JSON error can be a little different in other Node versions.

**What to notice:** the last `loadOrder()` has no `await` and no `.catch()`. Its error "escapes". Only the safety net sees it. Without that `process.on` handler, Node would **crash** here.

## 🔍 Deeper version

**1. Where each error goes:**

| Code style | How to handle errors |
|---|---|
| sync code | `try { … } catch (err) { … }` |
| error-first callback | `if (err) { … }` as the first line of the callback |
| Promise chain | `.catch(err => …)` at the end of the chain |
| async/await | `try { await … } catch (err) { … }` |
| EventEmitter / stream | `.on('error', err => …)` — see [EventEmitter](topic:nodejs/event-emitter) |

**2. try/catch can't catch "later" errors.** This does **not** work:

```js
try {                                              // this try finishes right away…
  setTimeout(() => { throw new Error('boom'); }, 100); // …but this throw happens 100 ms later
} catch (err) {                                    // too late — this catch has already finished
  console.log('never runs');                       // so this never runs, and the app crashes
}
```

The callback runs later, on a fresh [call stack](glossary:call-stack). Put the `try/catch` inside the callback, or use Promises and `await`.

**3. Operational errors vs programmer errors.**
- **Operational errors** are expected in real life: invalid input, "not found", a timeout, a full disk. Handle them and return a clear response, like `400` or `404`.
- **Programmer errors** are bugs: `Cannot read properties of undefined`, calling a function with the wrong arguments. You can't "handle" a bug safely. Log it, fix the code, and often restart the process.

**4. Always throw Error objects.** `throw new Error('msg')` gives you a **stack trace** (the list of function calls that led to the error). `throw 'msg'` (a plain string) gives you no stack. Since ES2022, you can wrap errors with a cause: `new Error('Payment failed', { cause: err })`.

**5. Custom error classes.** A common pattern in APIs:

```js
class AppError extends Error {                     // our own error type, built on Error
  constructor(message, statusCode = 500) {         // statusCode = the HTTP status to send back
    super(message);                                // set message and stack like a normal Error
    this.statusCode = statusCode;                  // e.g. 404 for "not found"
    this.isOperational = true;                     // marks it as an expected error, not a bug
  }                                                // end of constructor
}                                                  // end of AppError

throw new AppError('Candidate not found', 404);    // a service throws it; one central handler turns it into a response
```

In Express, one error-handling [middleware](glossary:middleware) catches these and sends one consistent JSON format. (Express 5 also passes errors from `async` route handlers to that middleware automatically.)

**6. The process-level safety nets.**
- `process.on('uncaughtException', …)` catches a sync error nobody caught.
- `process.on('unhandledRejection', …)` catches a rejected Promise nobody handled.

After an uncaught exception, the app may be in a broken state. Open connections or half-finished work may be left behind. The safe pattern is: **log it, clean up quickly, exit, and let a process manager restart it** (PM2, Docker, Kubernetes, Railway). See [graceful shutdown](topic:nodejs/graceful-shutdown).

:::version[Version note]
Since **Node.js 15**, an unhandled promise rejection **crashes the process** by default (exit code 1). Before Node 15, it only printed a warning, which hid many bugs. You can change this with the `--unhandled-rejections` flag, but keeping the default is safer.
:::

## 🎯 Why do we use it?

- **One bad request shouldn't crash the app for everyone.** Node runs all users in one process. An uncaught error stops all of them.
- **Users get a clear message**, like "email is required" (400), instead of a timeout or a blank page.
- **Developers can find bugs fast.** Proper Error objects with stack traces, logged in one place, show exactly where things broke.
- **Data stays safe.** You can undo or retry half-finished work, for example a payment step.

## ⚠️ Common mistakes

- **Calling an async function without `await` or `.catch()`.** Its error becomes an unhandled rejection and crashes the app.
- **Empty catch blocks** (`catch (e) {}`). The error disappears and the bug is hidden forever.
- **Throwing strings** instead of `Error` objects. You lose the stack trace.
- **Keeping the app running after `uncaughtException`** as if nothing happened. The app may be in a broken state.

## 🗣️ How to answer in an interview

> "It depends on the type of code. For sync code I use try/catch. For error-first callbacks I check `err` first. For promises I use `.catch`, and with async/await I put try/catch around the await. Streams and EventEmitters need an `'error'` listener.
>
> I separate operational errors, like validation failures or not found, from programmer errors, which are bugs. In an Express API, I throw a custom `AppError` with a status code from the service layer. One central error middleware turns it into a consistent JSON response and logs it.
>
> Since Node 15, an unhandled rejection crashes the process. So I make sure every promise is awaited or has a catch. I also add `unhandledRejection` and `uncaughtException` handlers as a last safety net. They log the error and exit, and a process manager restarts the app. I never keep running after an uncaught exception."

[FILL IN: how errors were logged or tracked in production at SkillKeepr (the resume mentions logging and error tracking — add the real tool name). Only add what's true.]

## 🔁 Follow-up questions

### Why not just catch everything with uncaughtException and keep running?

After an uncaught exception, you don't know what state the app is in. A database transaction may be half done, or a lock may be held. Continuing can cause wrong data or strange bugs. Log it, exit, and restart cleanly.

### How do you handle errors in async Express route handlers?

In Express 5, a rejected Promise from an `async` handler is passed to the error middleware automatically. In Express 4, you need `try/catch` with `next(err)`, or a small wrapper function: `const wrap = fn => (req, res, next) => fn(req, res, next).catch(next)`.

### What should you log when an error happens?

The error message, the stack trace, a request ID to connect related logs, and useful context like the route and user ID. **Never** log passwords, tokens or card details.

### How do you handle errors from a third-party API like Stripe or Twilio?

Set a timeout on every call. Retry only safe operations, with a growing delay between tries (exponential backoff). Return a clear message to the user if it still fails. For webhooks, make the handler safe to run twice.

## ✅ Quick check

### 1. Does this catch block run?

```js
try {                                                          // start a try block
  Promise.reject(new Error('fail'));                           // a rejected Promise, not awaited
} catch (err) {                                                // would this catch it?
  console.log('caught');                                       // ?
}
```

:::answer
**No.** The rejection is async and there is no `await`, so the `try` block finishes first. It becomes an unhandled rejection. Use `await Promise.reject(…)` inside an async function, or add `.catch()`.
:::

### 2. What happens by default in Node.js 24 when a Promise rejects and nobody handles it?

- A) A warning is printed and the app keeps running
- B) The process prints the error and exits with code 1
- C) Nothing

:::answer
**B.** Since Node 15, unhandled rejections crash the process by default.
:::

### 3. Which of these is a programmer error (a bug), not an operational error?

- A) The user sends an email without "@"
- B) The database times out
- C) `TypeError: Cannot read properties of undefined (reading 'id')`

:::answer
**C.** It's a bug in the code: something was `undefined` when it shouldn't be. A and B are expected problems you plan for.
:::
