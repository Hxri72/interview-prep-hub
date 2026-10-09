---
template: scenario
title: App crashes on an unhandled promise rejection
stack: debugging
order: 24
level: Intermediate
mustKnow: false
askedFrequency: common
summary:
  - Since Node.js 15, a promise that fails with no .catch() or try/catch crashes the whole process — every user is affected.
  - The crash log shows the error and often "UnhandledPromiseRejection"; the stack trace points to an async call with no await or no catch.
  - "Usual causes: fire-and-forget calls (sendEmail() with no await), a missing await, .then() with no .catch(), async code inside callbacks like forEach or setTimeout."
  - Fix by awaiting inside try/catch (Express 5 forwards rejected route promises to the error handler), catching fire-and-forget work, and logging + exiting cleanly in process.on('unhandledRejection').
  - Prevent with the no-floating-promises lint rule, a process manager that restarts the app, and alerts on restarts.
cards:
  - q: What happens in Node 24 when a promise rejects and nobody handles it?
    a: Node prints the error and the process exits with code 1. This default has been in place since Node 15.
  - q: What is a "floating" promise?
    a: A promise that you start but never await or .catch(), for example calling sendEmail() without await. If it fails, nobody handles the error.
  - q: Does Express 5 catch errors from async route handlers?
    a: Yes. If the handler's returned promise rejects, Express 5 passes the error to the error middleware. But it can't catch promises you didn't await or return.
  - q: What should process.on('unhandledRejection') do?
    a: Log the error with full details and exit, so the process manager restarts a clean process. Don't just log and keep running — the app may be in a broken state.
  - q: How do you stop this bug class in code review?
    a: Turn on the @typescript-eslint/no-floating-promises lint rule, so every promise must be awaited, returned or caught.
---

## 💡 What is it?

The whole Node.js server **suddenly stops**. The logs show an error, and often the words **"unhandled promise rejection"**.

A [promise](glossary:promise) "rejects" when the work fails. If no code catches that failure, Node treats it as a serious bug. **Since Node.js 15, Node crashes the process by default.**

Every user is affected, not just the one whose request failed. The app is down until something restarts it.

## 🏠 Real-life example

Think of a **school relay race**.

Each runner must **pass the baton** to the next runner. If a runner drops the baton and **nobody picks it up**, the referee stops the **whole race** — for every team.

- A **runner** = an async task (a promise).
- **Dropping the baton** = the promise rejects (an error).
- **A teammate catching it** = `try/catch` or `.catch()`.
- A runner who **started without telling the team** = a "floating" promise (no `await`). Nobody is watching it.
- **The referee stopping the race** = Node crashing the process.
- **The coach** who restarts the race = a process manager like PM2, Docker or Kubernetes.

## 🔎 Detect

- The app **restarts** often. Your process manager or container platform shows restart counts going up.
- **Logs** show the crash, like this:

```text
Error: SMTP connection timeout
    at sendEmail (/app/services/email.js:14:11)
    at handler (/app/routes/candidates.js:22:3)
    ...
Node.js v24.21.0
```

The process exits with **code 1**. If the promise was rejected with something that isn't an `Error` (like a plain string), the message starts with `UnhandledPromiseRejection: This error originated either by throwing inside of an async function without a catch block…` and the error code is `ERR_UNHANDLED_REJECTION`.

- **Users** see failures for a few seconds while the app restarts.
- Health checks fail briefly.

## 🐞 Debug

**Step 1 — Read the stack trace.** It points to the function that failed, for example `sendEmail`.

**Step 2 — Find where that function is called.** Look for these patterns:
- **Called without `await`** — `sendEmail(user)` alone on a line (a "fire-and-forget" call).
- **`.then()` with no `.catch()`.**
- **Async code inside callbacks** — `array.forEach(async (x) => ...)`, `setTimeout(async () => ...)`, or event listeners. Nobody awaits those promises.
- **A missing `await`** before a function that returns a promise.

**Step 3 — Reproduce it.** Make the failing dependency fail on purpose (for example a wrong SMTP host) and call the code path.

See [error handling in Node](topic:nodejs/error-handling) and [async errors in Express](topic:express/async-errors).

## 🔧 Fix

**Broken: a floating promise inside a route.**

```js
app.post('/candidates', async (req, res) => {                       // create a candidate
  const c = await Candidate.create(req.body);                       // awaited: Express 5 would catch this error
  sendWelcomeEmail(c.email);                                        // NOT awaited, no catch: if it fails → the process crashes
  res.status(201).json(c);                                          // reply 201 Created
});                                                                 // end of route
```

**Fixed: catch the fire-and-forget work, and handle anything that still slips through.**

```js
app.post('/candidates', async (req, res) => {                       // same route
  const c = await Candidate.create(req.body);                       // Express 5 forwards a rejection here to the error handler
  sendWelcomeEmail(c.email).catch((err) => {                        // we don't wait for the email, but we DO catch its failure
    console.error({ msg: 'welcome email failed', candidateId: c._id, err }); // log it with context
  });                                                               // end of catch
  res.status(201).json(c);                                          // the reply isn't delayed by the email
});                                                                 // end of route

process.on('unhandledRejection', (reason) => {                      // last safety net for anything missed
  console.error({ msg: 'unhandledRejection', reason });             // log the full error first
  server.close(() => process.exit(1));                              // stop taking new requests, then exit with code 1
  setTimeout(() => process.exit(1), 10_000).unref();                // force exit after 10 s if closing hangs
});                                                                 // the process manager starts a fresh, clean process
```

Even better for important side jobs (emails, notifications): put them on a **background queue** with retries, instead of fire-and-forget.

**The `forEach` trap:**

```js
for (const id of ids) {                                             // for...of works with await
  await notify(id);                                                 // each call is awaited, so errors reach try/catch
}                                                                   // end of loop
await Promise.all(ids.map((id) => notify(id)));                     // or run them in parallel and await them all
```

`ids.forEach(async (id) => await notify(id))` does **not** wait, and its errors are not caught by the outer code.

## 🛡️ Prevent

- Turn on the lint rule **`@typescript-eslint/no-floating-promises`**. Every promise must be awaited, returned, or have a `.catch()`.
- **Never `async` inside `forEach`.** Use `for...of` or `Promise.all`.
- Run the app under a **process manager** (PM2, Docker restart policy, Kubernetes) so a crash is followed by a quick restart.
- **Alert on restarts**: a restart is always a bug to investigate.
- Put important side work in a **queue**, not fire-and-forget.

## 🗣️ How to answer in an interview

**Short version (20 seconds):**

> "Since Node 15, an unhandled rejection crashes the process. I read the stack trace and look for a floating promise — a call with no await or no catch, often inside forEach or a fire-and-forget email. I fix it with await plus try/catch or a .catch, rely on Express 5 to forward route errors, and keep process.on('unhandledRejection') as a last net that logs and exits cleanly for the process manager to restart."

**Full version:**

> "When the app crashes on an unhandled rejection, the stack trace usually points to the failing async function. Then I search for where it's called without await or without a catch — typical cases are fire-and-forget calls like sending an email, .then without .catch, or async callbacks inside forEach or setTimeout.
>
> In Node 15 and later, that crash is the default, which is good, because it makes the bug visible. In Express 5, if a route handler's promise rejects, Express sends the error to the error middleware, so awaited calls in routes are safe. The problem is promises nobody awaits.
>
> I fix each one: await it inside try/catch, or add a .catch that logs with context, or move the work to a background queue with retries. As a last safety net, I add process.on('unhandledRejection') that logs the error and exits cleanly, so PM2 or the container platform restarts a fresh process. To prevent it, I turn on the no-floating-promises lint rule and alert on restarts."

[FILL IN: a real crash like this you fixed — only if it happened.]

## 🔁 Follow-up questions

### Why exit the process instead of logging and continuing?

After an unexpected error, the app may be in a **broken state**: half-finished work, a lost connection, wrong data in memory. A clean restart is safer than running in an unknown state.

### Express 4 vs Express 5 — what changed here?

In **Express 4**, a rejected promise in an async route was **not** passed to the error handler. You needed a wrapper like `asyncHandler` or `express-async-errors`. **Express 5** does it automatically. See [Express 5 changes](topic:express/express-5).

### What is the difference between `unhandledRejection` and `uncaughtException`?

`unhandledRejection` is for **promises** that fail with no handler. `uncaughtException` is for **synchronous** errors thrown with no try/catch (for example inside a timer callback). Both should log and exit.

### Can you change Node's crash behaviour?

Yes, with the flag `--unhandled-rejections=warn`. But it hides real bugs. Keep the default (`throw`) and fix the code instead.

## ✅ Quick check

### 1. In Node 24, what happens when this runs and `saveLog` rejects?

```js
function handler() {        // a normal function
  saveLog('hello');         // returns a promise, not awaited
}
```

:::answer
The rejection is **unhandled**, so Node **crashes the process** with exit code 1 (the default since Node 15).
:::

### 2. Does Express 5 catch the error from `sendWelcomeEmail()` if the route doesn't await it?

:::answer
**No.** Express 5 only catches the promise **returned by the handler**. A promise you start but don't await or return is invisible to Express. Add `.catch()` or await it.
:::

### 3. Why is `items.forEach(async (i) => await save(i))` risky?

:::answer
`forEach` **doesn't wait** for async callbacks. The outer code continues at once, and errors from `save` are **not caught** by its try/catch — they become unhandled rejections. Use `for...of` with `await`, or `await Promise.all(...)`.
:::
