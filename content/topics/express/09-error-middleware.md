---
title: Error-handling middleware
stack: express
order: 9
level: Intermediate
mustKnow: true
askedFrequency: very common
summary:
  - Error-handling middleware is a middleware with FOUR arguments: (err, req, res, next). Express knows it's for errors because of the 4 arguments.
  - You send an error to it with next(err), or by throwing. In Express 5, a rejected promise in an async handler also goes there automatically.
  - Put it LAST, after all routes. Express skips normal middleware and jumps straight to it when there's an error.
  - Use it to send one clean JSON error, pick the right status code, and log the full error. Never send the stack trace to users in production.
  - If the response has already started (res.headersSent), call next(err) and let Express's default handler close it.
cards:
  - q: How does Express know a middleware is an error handler?
    a: "It has exactly four parameters: (err, req, res, next). Even if you don't use next, you must keep it in the list."
  - q: How do you send an error to the error-handling middleware?
    a: "Call next(err), or throw inside a route. In Express 5, a rejected promise from an async handler is also passed to next(err) automatically."
  - q: Where must the error handler be placed?
    a: After all routes and other middleware. Express looks for it further down the list, so if it comes first, it never runs for route errors.
  - q: What should the error handler send to the client?
    a: A consistent JSON body with a safe message and the right status code (400, 404, 500…). Log the full error and stack on the server, but don't send the stack to users in production.
  - q: What do you do if headers were already sent when an error happens?
    a: Call next(err). Express's built-in handler will close the connection. You can't send a second response.
---

## 💡 What is it?

**Error-handling middleware** is a special [middleware](glossary:middleware) that runs **only when something goes wrong**.

It looks like normal middleware, but it has **four** arguments: `(err, req, res, next)`. The first one, `err`, is the error.

You put it at the **end** of your app. Any route that fails sends its error there. Then this one function sends a clean reply to the user.

## 🏠 Real-life example

Think of a **school with one sick room**.

Students go from class to class all day. If a student feels sick in any class, the teacher doesn't treat them in the classroom. The teacher sends them to the **sick room**. There, one trained nurse handles every case the same way.

- The **classes** = your routes.
- A **student feeling sick** = an error in a route.
- **"Go to the sick room"** = `next(err)`.
- The **sick room nurse** = the error-handling middleware.
- The **nurse's register** = your error log.

Because there is one sick room, every case is handled properly. And no teacher has to be a nurse.

## 🧑‍💻 Code example

Make a folder, run `npm init -y` and `npm install express`. Save this as `app.js`. Run it with `node app.js`.

```js
const express = require('express');                         // load Express
const app = express();                                      // create the app

app.get('/users/:id', (req, res, next) => {                 // a route; :id is a value from the URL
  if (req.params.id !== '1') {                              // we only have user 1 in this demo
    const err = new Error('User not found');                // make an Error object with a message
    err.status = 404;                                       // 404 = "not found"
    return next(err);                                       // send the error to the error handler
  }                                                         // end of the if
  res.json({ id: 1, name: 'Hari' });                        // user 1 exists → send it as JSON
});                                                         // end of the route

app.get('/crash', () => {                                   // a route with a bug in it
  throw new Error('Something broke');                       // throwing also sends the error to the handler
});                                                         // end of the route

app.use((err, req, res, next) => {                          // FOUR arguments → this is the error handler
  console.error(err);                                       // log the full error (with stack) on the server
  const status = err.status || 500;                         // use the error's status, or 500 = "server error"
  if (res.headersSent) return next(err);                    // reply already started → let Express close it
  res.status(status).json({                                 // send one clean JSON reply
    message: status === 500 ? 'Something went wrong' : err.message, // hide details of real bugs from users
  });                                                       // end of the JSON body
});                                                         // end of the error handler

app.listen(3000, () => console.log('Running on port 3000')); // start the server on port 3000
```

Test it in another terminal:

```text
$ curl http://localhost:3000/users/1
{"id":1,"name":"Hari"}

$ curl http://localhost:3000/users/7
{"message":"User not found"}          ← status 404

$ curl http://localhost:3000/crash
{"message":"Something went wrong"}    ← status 500 (the real error is only in the server log)
```

## 🔍 Deeper version

**How Express finds it.** Express keeps one list of middleware and routes, in the order you add them. When you call `next(err)` with any value (except the string `'route'`), Express **skips all normal middleware**. It goes down the list to the next function with four arguments. That is why the error handler must come **after** the routes.

**The arity rule.** "Arity" means "how many arguments a function takes". Express checks `fn.length === 4`. So you must write all four, even if you never use `next`. If you write `(err, req, res)`, Express thinks it is a normal middleware. Then it will never get errors.

**Three ways an error reaches it:**

| How | Example | Works in |
|---|---|---|
| `next(err)` | `return next(new Error('x'))` | Express 4 and 5 |
| `throw` in **sync** code | `throw new Error('x')` | Express 4 and 5 |
| rejected promise in an **async** handler | `await db.find()` fails | **Express 5 only** (automatic) |

:::version[Express 4 vs 5]
In **Express 4**, an error thrown inside an `async` handler was **not** caught. The promise was rejected, nobody handled it, and the request hung (or the app crashed). People used a wrapper or the `express-async-errors` package. **Express 5** passes rejected promises to `next(err)` for you. See [async errors](topic:express/async-errors).
:::

**Errors inside callbacks and timers are not caught.** If you throw inside `setTimeout` or an old-style callback, Express is not on the call stack any more. You must catch it there and call `next(err)` yourself.

**`res.headersSent`.** Sometimes the error happens after you started sending. For example, halfway through a stream. You can't send a new status code then. So you call `next(err)`. Express's **default error handler** then closes the connection.

**The default error handler.** If you don't write one, Express uses its own. It sends an HTML page with the status. In development it also shows the stack trace. In production (`NODE_ENV=production`) it hides it. For a JSON API, you almost always want your own.

**What a good error handler does:**
1. **Logs** the full error, with a request ID if you have one (see [logging](topic:express/logging)).
2. **Picks the status code**: from a custom error class, or 500 for unknown errors.
3. **Sends one consistent JSON shape** (see [response format](topic:express/response-format)).
4. **Hides internal details** (stack, SQL, file paths) for 500 errors.

**404 is not an error.** If no route matches, Express does not call your error handler. Add a "not found" middleware just before the error handler: `app.use((req, res) => res.status(404).json({ message: 'Not found' }))`.

## 🎯 Why do we use it?

- **One place for all errors.** Without it, every route needs its own `try/catch` and its own `res.status(500).json(...)`. That is a lot of repeated code, and each one is a little different.
- **Consistent replies.** The frontend can handle every error the same way, because the shape is always the same.
- **Safety.** You decide in one place what users see. Secrets and stack traces stay in the server log.
- **Better logging.** Every failure passes through one function, so nothing is missed.

## ⚠️ Common mistakes

- **Writing only three arguments**: `(err, req, res)`. Express then treats it as normal middleware, and it never receives errors.
- **Putting it before the routes.** It must be the last `app.use`.
- **Sending `err.stack` or `err.message` for every 500 error.** This can leak database details, file paths or secrets.
- **Calling `res.json` after the response was already sent.** You get "Cannot set headers after they are sent". Check `res.headersSent` and call `next(err)`.

## 🗣️ How to answer in an interview

> "In Express, an error-handling middleware is a middleware with four parameters: err, req, res and next. Express recognises it by that count. I register it last, after all routes. When a route calls next with an error, or throws, Express skips the normal middleware and goes straight to it. In Express 5, a rejected promise from an async handler also goes there automatically.
>
> In that handler, I log the full error with the request ID. I read the status code from a custom error class, and fall back to 500. Then I send one consistent JSON error shape. For 500 errors I send a generic message, so stack traces and database details never reach the client. If headers were already sent, I just call next with the error and let Express close the connection. I also add a separate 404 handler before it, because an unmatched route is not an error."

[FILL IN: how errors were handled in the SkillKeepr Express services — for example a shared error handler that was part of your reusable backend modules. Only add it if it's true.]

## 🔁 Follow-up questions

### Why must the error handler have four parameters?

Express checks how many parameters the function declares (`fn.length`). Exactly four means "error handler". With three, Express treats it as normal middleware and skips it when there's an error.

### Can you have more than one error handler?

Yes. They run in order, like normal middleware. For example, the first one can turn database errors into 400 errors and then call `next(err)`. The last one sends the reply. You can also add error handlers inside a router for errors that only happen there.

### What happens if you don't write any error handler?

Express uses its built-in default handler. It replies with an HTML page and the status code. It shows the stack trace in development, but hides it when `NODE_ENV` is `production`. For a JSON API, this is not what the frontend expects.

### How do you handle a 404 for routes that don't exist?

Add a normal middleware **after** all routes and **before** the error handler. It runs only if no route matched. It can send a 404 reply, or create an error with status 404 and call `next(err)`.

### Does the error handler catch errors thrown in setTimeout?

No. That code runs later, outside Express. Catch the error inside the callback and call `next(err)`. Or use promises and `await`, so Express 5 can catch it.

## ✅ Quick check

### 1. Which of these is an error-handling middleware?

- A) `app.use((req, res, next) => { ... })`
- B) `app.use((err, req, res) => { ... })`
- C) `app.use((err, req, res, next) => { ... })`

:::answer
**C.** Only a function with exactly four parameters is treated as an error handler. B has three, so Express treats it as normal middleware.
:::

### 2. The error handler is added with `app.use` at the top of the file, before the routes. A route calls `next(err)`. What happens?

:::answer
Your handler **does not run**. Express only looks further down the list after the failing route. It finds nothing, so it uses its own default handler and sends an HTML error page.
:::

### 3. True or false: in Express 5, if `await db.findUser()` rejects inside an async route, you must catch it yourself or the request hangs.

:::answer
**False.** Express 5 passes rejected promises from route handlers to `next(err)` automatically. (In Express 4, it was true.)
:::
