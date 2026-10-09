---
title: Middleware and next()
stack: express
order: 6
level: Basic
mustKnow: true
askedFrequency: very common
summary:
  - "Middleware is a function (req, res, next) that runs in the middle of a request, before the final route handler."
  - "Each middleware must do one of two things: send a response, or call next() to pass the request on."
  - "Order matters: Express runs middleware in the order you add it with app.use()."
  - "Middleware can be global (app.use), for one router (router.use), or for one route (app.get('/x', auth, handler))."
  - "next(err) skips normal middleware and jumps to the error handler, which has 4 arguments (err, req, res, next)."
cards:
  - q: What is middleware in Express?
    a: "A function (req, res, next) that runs during a request before the final handler. It can read or change req and res, end the request, or call next()."
  - q: What happens if middleware neither responds nor calls next()?
    a: The request gets stuck. The client waits until it times out.
  - q: Why does the order of app.use() calls matter?
    a: "Express runs middleware top to bottom. express.json() must come before routes that use req.body, and auth must come before protected routes."
  - q: What does next(err) do?
    a: "It skips all normal middleware and routes, and goes straight to the next error-handling middleware (the one with 4 arguments)."
  - q: Give 4 examples of middleware.
    a: "express.json() (body parsing), cors() (CORS headers), a logger like morgan, an auth check that verifies a JWT, and helmet (security headers)."
---

## 💡 What is it?

**[Middleware](glossary:middleware)** is a function that runs **in the middle** of a request. It runs after the request arrives, but before the final route handler.

It looks like this: `(req, res, next) => { ... }`.

Each middleware must do **one** of two things:
- **send a response** (and stop), or
- **call `next()`** to pass the request to the next function.

Many middleware functions together make a **chain**. Express runs them in order.

## 🏠 Real-life example

Think of **airport security before you board a plane**.

1. At the door, a guard checks your **ticket**.
2. Next, your bag goes through the **X-ray machine**.
3. Then an officer checks your **passport**.
4. Finally, you reach the **gate** and board the plane.

At each step, the officer either says "go ahead" or stops you: "No ticket? You can't go in."

- **Each checkpoint** = one middleware.
- **"Go ahead"** = calling `next()`.
- **"Stop, you can't go"** = sending a response, like `res.status(401)`.
- **The gate and the plane** = the final route handler.
- **The order of checkpoints** = the order of `app.use()`. You can't check the passport before you enter the airport.
- **Calling a supervisor because something is wrong** = `next(err)`. It skips the normal steps and goes to the error desk.

## 🧑‍💻 Code example

Set up: `npm init -y`, then `npm install express`. Save as `middleware.js`. It uses CommonJS. Run with `node middleware.js`.

```js
const express = require('express');                         // load Express
const app = express();                                      // create the app

app.use((req, res, next) => {                               // middleware 1: runs for EVERY request
  req.startTime = Date.now();                               // remember when the request started
  console.log(`→ ${req.method} ${req.url}`);                // log, e.g. "→ GET /secret"
  next();                                                   // pass the request on
});                                                         // end of middleware 1

app.use(express.json());                                    // middleware 2: built-in body parser

function requireKey(req, res, next) {                       // middleware 3: used only on some routes
  if (req.get('x-api-key') !== 'abc123') {                  // check a header value
    return res.status(401).json({ error: 'Missing or wrong API key' }); // 401 = not allowed in; stop here
  }                                                         // end of the check
  next();                                                   // key is correct → go on
}                                                           // end of requireKey

app.get('/public', (req, res) => {                          // no requireKey here
  res.json({ message: 'Anyone can see this' });             // the final handler
});                                                         // end of GET /public

app.get('/secret', requireKey, (req, res) => {              // requireKey runs first, then this handler
  res.json({ message: 'Secret data', ms: Date.now() - req.startTime }); // time taken so far, in ms
});                                                         // end of GET /secret

app.listen(3000, () => console.log('http://localhost:3000')); // start on port 3000
```

```text
$ curl http://localhost:3000/public
{"message":"Anyone can see this"}

$ curl http://localhost:3000/secret
{"error":"Missing or wrong API key"}

$ curl http://localhost:3000/secret -H "x-api-key: abc123"
{"message":"Secret data","ms":0}

Server terminal:
http://localhost:3000
→ GET /public
→ GET /secret
→ GET /secret
```

## 🔍 Deeper version

**The pipeline.** Express keeps one list of "layers": middleware and routes, in the order you add them. For each request, it walks down the list. It runs each layer whose path matches. `next()` means "go to the next matching layer".

```text
request → logger → express.json() → cors() → auth → route handler → response
                                               │
                                               └─ fails → res.status(401) (chain stops)
```

**Where middleware can live:**

| Level | How | Runs for |
|---|---|---|
| Application | `app.use(fn)` or `app.use('/api', fn)` | every request (or every request under `/api`) |
| Router | `router.use(fn)` | requests handled by that router |
| Route | `app.get('/x', fn1, fn2, handler)` | only that route |
| Error | `app.use((err, req, res, next) => { … })` | only after `next(err)` or a thrown error |
| Built-in / third-party | `express.json()`, `cors()`, `helmet()` | wherever you mount them |

**Special `next` values:**
- `next()`: continue to the next layer.
- `next(err)`: skip to the **error-handling middleware** (4 arguments). See [error middleware](topic:express/error-middleware).
- `next('route')`: skip the remaining handlers **of this route** and try the next matching route.
- `next('router')`: leave the current router.

**Changing `req` and `res`.** Middleware often adds data for later steps: `req.user = decodedToken` after auth, or `req.id = randomUUID()` for logging. This works because all layers share the **same** `req` and `res` objects during one request.

**Middleware factories.** A function that **returns** middleware lets you configure it: `allowRole('admin')`. This uses a [closure](topic:javascript/closures) to remember `'admin'`. See [custom middleware](topic:express/custom-middleware).

**Async middleware.** If middleware does async work, like checking a token in the database, it must call `next()` only **after** that work finishes.

:::version[Version note]
In **Express 5**, if an `async` middleware or handler throws, or returns a rejected promise, Express calls `next(err)` for you. In **Express 4**, an error inside an `async` function was not caught. The request hung, or the process got an unhandled rejection, unless you used `try/catch` or a wrapper like `express-async-handler`.
:::

## 🎯 Why do we use it?

Many routes need the **same steps**: read JSON, log the request, check the login, add security headers, limit the request rate. Without middleware, you would copy this code into every route.

Middleware lets you:
- **write a step once** and reuse it everywhere,
- **keep route handlers small**, focused only on their real job,
- **control the order** of steps in one clear place,
- **stop bad requests early**, before they reach your database.

## ⚠️ Common mistakes

- **Forgetting to call `next()`.** The request hangs forever.
- **Calling `next()` and also sending a response.** This often causes "headers already sent". Use `return res...` when you stop.
- **Wrong order.** Auth added *after* the routes doesn't protect them. `express.json()` added after a route means `req.body` is empty in that route.
- **Error middleware with only 3 arguments.** Express treats it as normal middleware. An error handler needs exactly **4**: `(err, req, res, next)`.

## 🗣️ How to answer in an interview

> "Middleware in Express is a function with req, res and next that runs in the request pipeline before the final handler. Each one either ends the request by sending a response, or calls next to pass control on. Express runs them in the order they're registered, so order really matters. Body parsing comes before routes that need req.body, and auth comes before protected routes.
>
> I use middleware at different levels: app.use for global things like helmet, cors, JSON parsing and logging; router.use for a group, like all admin routes; and per-route for things like a role check. Middleware can also attach data to the request, like req.user after verifying a JWT.
>
> For errors, calling next(err) or throwing in an async handler in Express 5 jumps straight to the error-handling middleware with four arguments, where I format one consistent error response."

## 🔁 Follow-up questions

### What is the difference between middleware and a route handler?

Technically, both are functions with `req` and `res`. A route handler is the **last** step, and it sends the response. Middleware usually does a **shared** step and then calls `next()`. Middleware can also end the request early, for example with a 401.

### How do you apply middleware to only some routes?

Pass it in the route: `app.get('/admin', requireAdmin, handler)`. Or put those routes in a router and call `router.use(requireAdmin)`. Or mount it on a path prefix: `app.use('/admin', requireAdmin)`.

### What is `next('route')` used for?

It skips the remaining handlers of the **current route** and moves to the next route that matches the same path. It's rarely used. One example is a fallback route for users without a special feature.

### How do you pass data from middleware to the handler?

Attach it to `req` (like `req.user`) or to `res.locals`. Both live only for that one request.

## ✅ Quick check

### 1. What does the client receive?

```js
app.use((req, res, next) => {           // middleware
  console.log('checking...');           // log a message
});                                     // no next(), no response
app.get('/', (req, res) => res.send('hi')); // route
```

:::answer
**Nothing. The request hangs.** The middleware never calls `next()` and never responds, so the route is never reached.
:::

### 2. In which order are these logged for `GET /x`?

```js
app.use((req, res, next) => { console.log('A'); next(); });          // global middleware
app.get('/x', (req, res, next) => { console.log('B'); next(); },     // route middleware
              (req, res) => { console.log('C'); res.send('ok'); });  // route handler
app.use((req, res, next) => { console.log('D'); next(); });          // added after the route
```

:::answer
**A, B, C.** `D` never runs, because the handler sent a response and didn't call `next()`.
:::

### 3. How many arguments does an error-handling middleware need?

:::answer
**Four:** `(err, req, res, next)`. With 3, Express treats it as normal middleware.
:::
