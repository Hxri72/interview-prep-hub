---
title: "Async errors: async wrapper and custom AppError class"
stack: express
order: 10
level: Intermediate
mustKnow: true
askedFrequency: very common
summary:
  - In Express 4, an error inside an async route was NOT sent to the error handler. You needed a small asyncHandler wrapper (or the express-async-errors package).
  - In Express 5, rejected promises from route handlers go to next(err) automatically. The wrapper is only needed for Express 4.
  - A custom AppError class (extends Error) carries a statusCode and a flag isOperational, so the error handler knows what to send.
  - Throw AppError for expected problems (404, 400, 403). Unknown errors become 500 with a generic message.
  - Errors in callbacks, timers and event listeners are still not caught automatically — handle them yourself.
cards:
  - q: Why did Express 4 apps need an asyncHandler wrapper?
    a: Express 4 didn't look at the promise an async handler returns. If it rejected, the error never reached next(err), so the request hung or crashed the app. The wrapper adds .catch(next).
  - q: Do you still need asyncHandler in Express 5?
    a: No. Express 5 catches rejected promises from route handlers and middleware and calls next(err) for you.
  - q: What is a custom AppError class?
    a: A class that extends Error and adds fields like statusCode and isOperational. Routes throw it for expected problems, and the error handler uses its status code.
  - q: What does isOperational mean?
    a: "true = an expected problem we planned for (bad input, not found). false or missing = a bug. Bugs get a generic 500 message and should be fixed."
  - q: Write the asyncHandler wrapper in one line.
    a: "const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);"
---

## 💡 What is it?

Most Express routes use `async`/`await`, because they talk to databases and other [APIs](glossary:api). When an `await` fails, the error must reach your [error-handling middleware](topic:express/error-middleware).

There are two helpers for this:
- an **async wrapper**: a small function that catches errors from async routes. It was **needed in Express 4**.
- a **custom `AppError` class**: your own error type that carries a **status code**, like 404 or 400.

**Express 5** catches async errors by itself. But the `AppError` class is still very useful.

## 🏠 Real-life example

Think of a **courier company**.

Parcels (requests) go out with delivery boys (routes). Sometimes a delivery fails.

- **Express 4** was like a delivery boy with no phone. If he got stuck, nobody at the office heard about it. The customer just waited forever. The **async wrapper** was like giving every delivery boy a phone: "if anything goes wrong, call the office".
- **Express 5** gives every delivery boy a phone automatically.
- **AppError** is a **printed problem slip** with a code: "404 — address not found", "400 — wrong parcel details". The office (error handler) reads the code and knows exactly what to tell the customer.
- A delivery boy who just says "something happened" with no slip is like a **normal `Error`**. The office treats it as a serious, unknown problem (500).

## 🧑‍💻 Code example

Make a folder, run `npm init -y` and `npm install express`. Save this as `app.js`. Run it with `node app.js`.

```js
const express = require('express');                          // load Express (version 5)
const app = express();                                       // create the app

class AppError extends Error {                               // our own error type, built on the normal Error
  constructor(message, statusCode) {                         // it takes a message and an HTTP status code
    super(message);                                          // let Error store the message and the stack trace
    this.statusCode = statusCode;                            // e.g. 404 = not found, 400 = bad request
    this.isOperational = true;                               // true = "we expected this kind of problem"
  }                                                          // end of constructor
}                                                            // end of AppError

const findUser = async (id) => (id === '1' ? { id, name: 'Hari' } : null); // a fake database call

app.get('/users/:id', async (req, res) => {                  // an async route — no try/catch needed in Express 5
  const user = await findUser(req.params.id);                // wait for the "database"
  if (!user) throw new AppError('User not found', 404);      // expected problem → throw AppError with 404
  res.json(user);                                            // found → send it
});                                                          // end of the route

app.get('/bug', async () => {                                // a route with a real bug
  const data = undefined;                                    // pretend the database gave us nothing
  return data.name;                                          // reading .name of undefined → TypeError (a bug)
});                                                          // end of the route

app.use((err, req, res, next) => {                           // the error handler (4 arguments)
  if (err.isOperational) {                                   // our own AppError → safe to show its message
    return res.status(err.statusCode).json({ message: err.message }); // e.g. 404 + "User not found"
  }                                                          // end of the if
  console.error(err);                                        // unknown error = a bug → log everything
  res.status(500).json({ message: 'Something went wrong' }); // 500 = server error; hide the details
});                                                          // end of the error handler

app.listen(3000, () => console.log('Running on port 3000'));  // start the server on port 3000
```

```text
$ curl http://localhost:3000/users/1
{"id":"1","name":"Hari"}

$ curl http://localhost:3000/users/9
{"message":"User not found"}            ← status 404

$ curl http://localhost:3000/bug
{"message":"Something went wrong"}      ← status 500; the TypeError is printed in the server terminal
```

## 🔍 Deeper version

**Why async errors were a problem in Express 4.** An `async` function always returns a [promise](glossary:promise). If something inside fails, the promise is **rejected**. It does not throw in the normal way. Express 4 called your handler but ignored the promise it returned. So a rejected promise had nobody listening:
- the request **hung** until the browser timed out, and
- Node printed an unhandled rejection. Since Node 15, this **crashes the process** (see [error handling](topic:nodejs/error-handling)).

**The asyncHandler wrapper (for Express 4).** It is a [closure](topic:javascript/closures) that wraps your route and adds `.catch(next)`:

```js
const asyncHandler = (fn) =>                                 // takes your async route function
  (req, res, next) =>                                        // gives back a normal Express handler
    Promise.resolve(fn(req, res, next)).catch(next);         // if the promise rejects, pass the error to next

router.get('/users/:id', asyncHandler(async (req, res) => {  // wrap each async route like this
  res.json(await User.findById(req.params.id));              // a failed await now reaches the error handler
}));
```

The `express-async-errors` package did the same thing for every route, by patching Express.

:::version[Express 4 vs 5]
**Express 5** (the current version) checks the value your handler returns. If it is a rejected promise, Express calls `next(err)` with the reason. This works for route handlers **and** middleware. So in Express 5 you can delete the wrapper and `express-async-errors`. If you join a team still on Express 4, you will see the wrapper everywhere.
:::

**What Express 5 still does NOT catch:**
- errors thrown inside `setTimeout`, `setInterval` or old-style callbacks,
- errors in event listeners (like `stream.on('data', ...)`),
- a promise you started but didn't `await` or `return` ("fire and forget").

For these, catch the error yourself and call `next(err)`. Or turn the callback into a promise and `await` it.

**Why a custom error class still matters.** Express 5 delivers the error, but it doesn't know **what kind** of error it is. `AppError` adds that meaning:
- `statusCode`: which HTTP code to send.
- `isOperational`: `true` for expected problems. Unknown errors are treated as bugs.
- You can add more fields: `code: 'USER_NOT_FOUND'` (for the frontend), or `details` (a list of validation problems).

Many teams also make small subclasses: `NotFoundError` (404), `ValidationError` (400), `UnauthorizedError` (401), `ForbiddenError` (403).

**Turning library errors into AppErrors.** The error handler can also translate known errors:
- Mongoose `CastError` (bad ObjectId) → 400
- MongoDB duplicate key (`code: 11000`) → 409 Conflict
- JWT `TokenExpiredError` → 401

**`Error.captureStackTrace`.** Some AppError examples call `Error.captureStackTrace(this, this.constructor)`. This hides the constructor itself from the stack trace. It is optional. Modern classes that call `super(message)` already get a correct stack.

## 🎯 Why do we use it?

- **No hanging requests.** Every failed `await` reaches the error handler. The user always gets a reply.
- **No crashes.** Unhandled rejections no longer take down the whole server.
- **Less repeated code.** Routes just `throw new AppError(...)`. No `try/catch` and `res.status().json()` in every route.
- **Clear difference between "expected" and "bug".** Users see helpful messages for expected problems, and bugs are logged and hidden.

## ⚠️ Common mistakes

- **Forgetting `await` or `return`** on a promise inside a handler. If it rejects, even Express 5 can't see it.
- **Throwing strings**: `throw 'not found'`. A string has no stack trace and no status code. Always throw an `Error` or `AppError`.
- **Showing every error message to users.** Only `isOperational` errors are safe to show. A bug's message may contain database or file details.
- **Keeping `try/catch` in every route** just to call `res.status(500)`. This repeats code and often hides the real error.

## 🗣️ How to answer in an interview

> "In Express 4, async route handlers were a problem. Express ignored the returned promise, so a failed await never reached the error middleware. The request would hang, and since Node 15 an unhandled rejection crashes the process. The fix was an asyncHandler wrapper that adds .catch(next), or the express-async-errors package. Express 5 now does this automatically, so the wrapper isn't needed any more.
>
> I still use a custom AppError class that extends Error. It carries a status code and an isOperational flag. Routes just throw, for example new AppError('User not found', 404). The central error handler sends that status and message. Anything without the flag is treated as a bug: I log it fully and send a generic 500. I also remember that Express can't catch errors in timers, callbacks or promises I didn't await."

[FILL IN: whether the SkillKeepr services are on Express 4 or 5, and whether an error class or async wrapper was part of the reusable backend modules on your resume. Only add what's true.]

## 🔁 Follow-up questions

### How does the asyncHandler wrapper work?

It is a function that takes your async handler and returns a new normal handler. The new handler calls yours, wraps the result in `Promise.resolve(...)`, and adds `.catch(next)`. So any rejection is passed to Express's `next`. It works because of closures: the inner function remembers `fn`.

### Why `Promise.resolve(fn(...))` and not just `fn(...).catch(next)`?

If someone wraps a normal (non-async) function, it may not return a promise. Then `.catch` would not exist and the code would crash. `Promise.resolve` turns any value into a promise first, so `.catch` is always safe.

### What is the difference between an operational error and a programmer error?

An operational error is an expected problem at runtime: bad input, record not found, an external API timing out. You handle it and reply with a clear message. A programmer error is a bug, like reading a property of `undefined`. You log it, send a generic 500 and fix the code.

### How would you map a MongoDB duplicate key error to a nice response?

In the error handler, check `err.code === 11000`. Turn it into a 409 Conflict with a message like "Email already exists". You can read the duplicated field from `err.keyValue`.

## ✅ Quick check

### 1. Express 4. What happens when this route's `await` rejects, with no wrapper?

```js
app.get('/x', async (req, res) => {        // an async route
  const data = await failingCall();        // this promise rejects
  res.json(data);                          // never reached
});
```

:::answer
The error handler is **not** called. The request hangs, and Node reports an unhandled promise rejection. Since Node 15, that crashes the process. Fix it with an `asyncHandler` wrapper, or upgrade to Express 5.
:::

### 2. Which line makes `AppError` keep the message and stack trace?

- A) `this.statusCode = statusCode;`
- B) `super(message);`
- C) `this.isOperational = true;`

:::answer
**B.** `super(message)` runs the parent `Error` constructor. It sets `message` and builds the stack trace.
:::

### 3. True or false: in Express 5, an error thrown inside a `setTimeout` callback in a route is passed to `next(err)` automatically.

:::answer
**False.** Express 5 only catches rejected promises returned by your handler. A `setTimeout` callback runs later, outside Express. Catch it there and call `next(err)`.
:::
