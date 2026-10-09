---
title: "Writing custom middleware (auth, roles, logging)"
stack: express
order: 8
level: Intermediate
mustKnow: true
askedFrequency: very common
summary:
  - "Custom middleware is your own (req, res, next) function for a shared step: logging, checking a login, checking a role, adding a request ID."
  - "Auth middleware reads the token from the Authorization header, verifies it, puts the user on req.user, and calls next(). If the token is bad, it sends 401."
  - "Role middleware is often a factory: allowRole('admin') returns a middleware that sends 403 if req.user.role isn't allowed."
  - "Logging middleware can time a request by listening to res.on('finish'), and add a request ID to every log line."
  - "401 = we don't know who you are (not logged in). 403 = we know who you are, but you're not allowed."
cards:
  - q: What are the steps inside a JWT auth middleware?
    a: "Read 'Authorization: Bearer <token>', verify it with the secret, put the decoded user on req.user, then call next(). Missing or invalid token → 401."
  - q: Why write allowRole('admin') as a function that returns middleware?
    a: "So one piece of code can create many checks, like allowRole('admin') or allowRole('admin', 'recruiter'). The inner function remembers the roles through a closure."
  - q: 401 vs 403?
    a: "401 Unauthorized = not logged in or bad token. 403 Forbidden = logged in, but you don't have permission for this action."
  - q: How can logging middleware know the response status and time taken?
    a: "Record the start time, then listen to res.on('finish'). When it fires, res.statusCode is set and you can compute the duration."
  - q: Where do you put the auth middleware?
    a: "Before the routes it protects: on a router with router.use(requireAuth), or on single routes like app.get('/me', requireAuth, handler)."
---

## 💡 What is it?

**Custom middleware** is a [middleware](glossary:middleware) function that **you** write for your app's own needs.

The three most common ones are:
- **Logging**: write one line for every request (what, who, how long).
- **Authentication (auth)**: check **who** the user is, usually with a login token.
- **Authorisation (roles)**: check **what** the user is allowed to do, like "only admins can delete".

You write each one once and reuse it on many routes.

## 🏠 Real-life example

Think of **a school's exam hall**.

1. At the door, a teacher writes your **name and entry time** in a register.
2. Then they check your **hall ticket**. No ticket, or a fake one? You can't enter.
3. Inside, some rooms are only for **teachers**, like the question paper room. A student with a valid ticket still can't go in there.

- **The register at the door** = logging middleware.
- **Checking the hall ticket** = auth middleware. A fake ticket → **401**, "we don't know you".
- **The hall ticket** = the JWT token. It proves who you are.
- **"Teachers only" rooms** = role middleware, `allowRole('teacher')`. A student → **403**, "we know you, but you're not allowed".
- **Writing your name on your desk** so others know who sits there = `req.user`. Later steps can read it.

## 🧑‍💻 Code example

Set up:

```bash
npm init -y
npm install express jsonwebtoken
```

Save as `auth.js`. It uses CommonJS. Run with `node auth.js`.

```js
const express = require('express');                                // load Express
const jwt = require('jsonwebtoken');                               // load the JWT library
const { randomUUID } = require('node:crypto');                     // built-in random ID maker

const app = express();                                             // create the app
app.use(express.json());                                           // read JSON bodies
const SECRET = process.env.JWT_SECRET || 'dev-only-secret';        // the signing key; use a real secret in production

function requestLogger(req, res, next) {                           // 1) LOGGING middleware
  req.id = randomUUID();                                           // a unique ID for this request
  const start = Date.now();                                        // remember the start time in ms
  res.on('finish', () => {                                         // runs after the response is sent
    console.log(`${req.id.slice(0, 8)} ${req.method} ${req.originalUrl} ${res.statusCode} ${Date.now() - start}ms`); // one log line
  });                                                              // end of the finish listener
  next();                                                          // continue to the next step
}                                                                  // end of requestLogger

function requireAuth(req, res, next) {                             // 2) AUTH middleware
  const header = req.get('Authorization') || '';                   // e.g. "Bearer eyJhbGci..."
  const [type, token] = header.split(' ');                         // split into "Bearer" and the token
  if (type !== 'Bearer' || !token) {                               // no token sent?
    return res.status(401).json({ error: 'Login required' });      // 401 = we don't know who you are
  }                                                                // end of the check
  try {                                                            // jwt.verify throws if the token is bad
    req.user = jwt.verify(token, SECRET);                          // valid → save the user, e.g. { id: 1, role: 'admin' }
    next();                                                        // continue
  } catch {                                                        // expired, changed or fake token
    return res.status(401).json({ error: 'Invalid or expired token' }); // 401 again
  }                                                                // end of try/catch
}                                                                  // end of requireAuth

function allowRole(...roles) {                                     // 3) ROLE middleware factory, e.g. allowRole('admin')
  return (req, res, next) => {                                     // the real middleware; it remembers roles (a closure)
    if (!roles.includes(req.user.role)) {                          // is the user's role in the allowed list?
      return res.status(403).json({ error: 'Not allowed' });       // 403 = we know you, but no permission
    }                                                              // end of the check
    next();                                                        // allowed → continue
  };                                                               // end of the inner middleware
}                                                                  // end of allowRole

app.use(requestLogger);                                            // log EVERY request

app.post('/login', (req, res) => {                                 // demo login (no password check here!)
  const user = { id: 1, role: req.body.role || 'student' };        // pretend we found this user
  const token = jwt.sign(user, SECRET, { expiresIn: '15m' });      // make a token that expires in 15 minutes
  res.json({ token });                                             // send it to the client
});                                                                // end of POST /login

app.get('/me', requireAuth, (req, res) => res.json(req.user));     // any logged-in user
app.delete('/students/:id', requireAuth, allowRole('admin'), (req, res) => { // logged in AND admin
  res.json({ deleted: req.params.id, by: req.user.id });           // pretend we deleted the student
});                                                                // end of DELETE

app.listen(3000, () => console.log('http://localhost:3000'));      // start on port 3000
```

Try it (copy the token from the login reply into `TOKEN`):

```text
$ curl http://localhost:3000/me
{"error":"Login required"}

$ curl -X POST http://localhost:3000/login -H "Content-Type: application/json" -d '{"role":"student"}'
{"token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."}

$ curl http://localhost:3000/me -H "Authorization: Bearer $TOKEN"
{"id":1,"role":"student","iat":1791547200,"exp":1791548100}

$ curl -X DELETE http://localhost:3000/students/7 -H "Authorization: Bearer $TOKEN"
{"error":"Not allowed"}          ← a student token gets 403

Server terminal:
http://localhost:3000
3f2a9c1e GET /me 401 1ms
b81d0f44 POST /login 200 3ms
c0e7a512 GET /me 200 1ms
9d4b6e20 DELETE /students/7 403 0ms
```

(`iat` = "issued at" and `exp` = "expires at", both in seconds since 1970. Log in with `{"role":"admin"}` to get an admin token, and the DELETE works.)

## 🔍 Deeper version

**Auth vs authorisation.**
- **Authentication** = *who are you?* → `requireAuth` → fails with **401**.
- **Authorisation** = *what may you do?* → `allowRole` → fails with **403**.

Always run auth **first**. `allowRole` needs `req.user`.

**The auth middleware in a real app:**
- Use a **strong secret** from an [environment variable](glossary:environment-variable). Never commit it to Git.
- Pin the algorithm: `jwt.verify(token, SECRET, { algorithms: ['HS256'] })`. This blocks tricks with other algorithms.
- Keep access tokens **short-lived** (like 15 minutes) and use refresh tokens (see the REST & Auth stack).
- Put only **small, non-secret** data in the token (user id, role, maybe tenant id). Anyone can decode a JWT; the signature only stops changes.
- For instant logout or banning, also check the user in the database, or a token version, inside the middleware.

**Multi-tenant apps.** In a [multi-tenant](glossary:multi-tenant) app, auth middleware often also sets `req.tenantId` from the token. Every later database query then filters by it. Then no company can see another company's data.

**Middleware factories use closures.** `allowRole('admin', 'recruiter')` returns a new function that remembers the `roles` list. This is the same idea as in [closures](topic:javascript/closures). Other examples: `validate(schema)`, `rateLimit({ limit: 5 })`.

**Logging with `res.on('finish')`.** When the middleware runs, the response isn't ready yet. So we listen for the `finish` [event](glossary:event), which fires when the response has been handed to the network. Then `res.statusCode` is final. A **request ID** lets you find every log line for one request, even across services. Send it back as an `X-Request-Id` header too. In production, use a structured logger like pino. See [logging](topic:express/logging).

**Async middleware.** If a check is async (like loading the user from the database), make it an `async` function. In **Express 5**, if it throws, the error goes to your error handler by itself. In Express 4, you needed `try/catch` + `next(err)`.

**Where to attach:**

```js
app.use('/api', requireAuth);                       // every /api route needs login
adminRouter.use(requireAuth, allowRole('admin'));   // every route in this router: admins only
app.get('/me', requireAuth, getMe);                 // one route only
```

## 🎯 Why do we use it?

- **No repeated code.** Without middleware, every protected route would copy the same token-checking lines. One missed copy = a security hole.
- **One place to fix bugs.** Change the auth logic once, and every route gets the fix.
- **Clear routes.** `app.delete('/students/:id', requireAuth, allowRole('admin'), deleteStudent)` reads like a sentence.
- **Better debugging.** Request IDs and timings in the logs make production problems much easier to trace.

## ⚠️ Common mistakes

- **Returning 403 when the token is missing.** Missing or invalid token = **401**. Valid user without permission = **403**.
- **Running `allowRole` before `requireAuth`.** `req.user` is undefined, and the code crashes.
- **Trusting data in the token for everything.** A token stays valid until it expires, even if you changed the user's role in the database.
- **Logging the `Authorization` header or the request body.** That leaks tokens and passwords into logs.

## 🗣️ How to answer in an interview

> "I write custom middleware for cross-cutting concerns. For auth, the middleware reads the Bearer token from the Authorization header, verifies it with jwt.verify using the secret from an environment variable, and attaches the decoded payload to req.user. If the token is missing, invalid or expired, it returns 401.
>
> For permissions, I use a middleware factory like allowRole('admin'). It returns a middleware that checks req.user.role and returns 403 if the role isn't allowed. The factory works because the inner function closes over the roles list. I chain them on routes, or apply them to a whole router.
>
> For logging, I generate a request ID, record the start time, and log method, path, status and duration in res.on('finish'). That makes it easy to trace one request through the logs."

[FILL IN: how JWT auth and roles are set up in your SkillKeepr services (for example, recruiter vs candidate roles), if you can share it. The resume confirms you used JWT; add details only if true.]

## 🔁 Follow-up questions

### Why put the user on `req.user`?

All later middleware and the route handler share the same `req` object. Putting the decoded user there means no one has to verify the token again. It's the standard place for the logged-in user.

### How would you make auth optional on a route?

Write an `optionalAuth` middleware. If there's a valid token, set `req.user`. If there's no token, just call `next()` without an error. The handler then shows more data to logged-in users.

### How do you check that a user owns the resource, not just their role?

Role checks aren't enough for things like "edit **your own** profile". Inside the handler (or a middleware), load the resource and compare `resource.ownerId` with `req.user.id`. If they don't match, return 403, or 404 to hide that it exists.

### How do you test auth middleware?

Write unit tests that call the middleware with a fake `req`, a fake `res` and a mock `next`. Or use Supertest on a route: no token → 401, wrong role → 403, valid admin token → 200. See [Supertest](topic:express/supertest).

## ✅ Quick check

### 1. A user's token is valid, but they try to delete a student and they're not an admin. Which status code?

- A) 400
- B) 401
- C) 403

:::answer
**C) 403 Forbidden.** We know who they are (valid token), but they don't have permission.
:::

### 2. What is wrong with this route?

```js
app.delete('/students/:id', allowRole('admin'), requireAuth, deleteStudent); // order of middleware
```

:::answer
The order is wrong. `allowRole` runs before `requireAuth`, so `req.user` is still `undefined` and `req.user.role` crashes. Put `requireAuth` first.
:::

### 3. Why does the logger use `res.on('finish', …)` instead of logging right away?

:::answer
At the start, the response hasn't been sent yet, so the status code and the time taken aren't known. The `finish` event fires after the response is sent, when both are final.
:::
