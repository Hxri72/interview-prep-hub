---
title: "Express 5: what changed from Express 4"
stack: express
order: 20
level: Intermediate
mustKnow: false
askedFrequency: sometimes
summary:
  - Express 5 is the current major version. It needs Node.js 18 or newer.
  - "Biggest win: if an async route throws or its promise rejects, Express 5 sends the error to your error middleware by itself. No more try/catch or asyncHandler in every route."
  - "Route paths are stricter: a wildcard needs a name (/*splat), optional parts use braces (/:file{.:ext}), and ? after a parameter no longer works."
  - "req.query is read-only and uses a simple parser by default; req.body is undefined (not {}) if no body parser ran."
  - "Old methods are gone: app.del, res.sendfile, req.param(), res.json(obj, status). Use app.delete, res.sendFile, req.params/query/body and res.status(code).json(obj)."
cards:
  - q: What is the biggest change in Express 5 for async code?
    a: Rejected promises and errors thrown in async route handlers and middleware are passed to next(err) automatically, so they reach your error middleware.
  - q: How do you write a catch-all route in Express 5?
    a: "The wildcard needs a name: app.get('/*splat', …). To also match the root path, use '/{*splat}'."
  - q: How do you write an optional route parameter in Express 5?
    a: "With braces: '/users{/:id}' or '/files/:name{.:ext}'. The old '/:id?' syntax throws an error."
  - q: What is req.body in Express 5 when no body parser is used?
    a: undefined. In Express 4 it was an empty object {}.
  - q: Name two methods removed in Express 5 and their replacements.
    a: "app.del → app.delete, res.sendfile → res.sendFile, req.param(name) → req.params/req.query/req.body, res.json(obj, 404) → res.status(404).json(obj)."
---

## 💡 What is it?

**Express 5** is the newest major version of Express. "Major" means it has **breaking changes**: some old code needs small edits before it works.

Express 5 was released in late 2024, after many years of Express 4. Now `npm install express` gives you version 5.

Most code works the same. The main changes are about **async errors**, **route path rules** and **a few removed methods**.

## 🏠 Real-life example

Think of a **new edition of a school textbook**.

Most chapters are the same. But a few things changed:
- Some **old exercises were removed**, because they were confusing.
- Some **rules are now stricter**, like "every diagram must have a label".
- One **big new feature** was added: answers to every exercise at the back of the book.

If your teacher still uses page numbers from the old edition, a few will be wrong. So before class, you check a list of changes.

- **The new edition** = Express 5.
- **Removed exercises** = removed methods like `app.del` and `res.sendfile`.
- **Stricter rule: every diagram needs a label** = every wildcard route now needs a name, like `/*splat`.
- **The big new feature** = async errors are caught for you.
- **The "list of changes"** = the official migration guide.

## 🧑‍💻 Code example

Set up:

```bash
npm init -y
npm install express
```

Save this as `e5.js`. Run it with `node e5.js`.

```js
const express = require('express');                             // load Express 5
const app = express();                                          // create the app

const getUser = async (id) => {                                 // a fake database call
  if (id === '0') throw new Error('User 0 does not exist');     // pretend the DB throws for id 0
  return { id, name: 'Asha' };                                  // otherwise return a user
};                                                              // end of getUser

app.get('/users/:id', async (req, res) => {                     // an async route — no try/catch needed in Express 5
  const user = await getUser(req.params.id);                    // if this throws, Express 5 sends the error to next(err)
  res.json(user);                                               // send the user
});                                                             // end of the route

app.get('/files/:name{.:ext}', (req, res) => {                  // {.:ext} = optional part: /files/cv and /files/cv.pdf both match
  res.json(req.params);                                         // show what Express found
});                                                             // end of the route

app.post('/echo', (req, res) => {                               // no body parser is installed on purpose
  res.json({ body: req.body ?? 'undefined' });                  // Express 5: req.body is undefined, not {}
});                                                             // end of the route

app.get('/{*splat}', (req, res) => {                            // catch-all: in Express 5 the wildcard must have a name
  res.status(404).json({ error: 'No route', path: req.params.splat }); // splat is an array of the path parts
});                                                             // end of the catch-all

app.use((err, req, res, next) => {                              // error middleware: 4 arguments
  res.status(500).json({ error: err.message });                 // 500 = server error
});                                                             // end of the error middleware

app.listen(3000, () => console.log('Express', require('express/package.json').version)); // print the version
```

Try it:

```text
$ curl http://localhost:3000/users/7
{"id":"7","name":"Asha"}

$ curl http://localhost:3000/users/0
{"error":"User 0 does not exist"}          ← the async error reached the error middleware

$ curl http://localhost:3000/files/cv
{"name":"cv"}

$ curl http://localhost:3000/files/cv.pdf
{"name":"cv","ext":"pdf"}

$ curl -X POST -H "Content-Type: application/json" -d '{"a":1}' http://localhost:3000/echo
{"body":"undefined"}                       ← no express.json(), so no body

$ curl http://localhost:3000/a/b/c
{"error":"No route","path":["a","b","c"]}
```

In Express 4, `/users/0` would cause an unhandled promise rejection. The request would hang, or the process would crash.

## 🔍 Deeper version

**1. Async errors are forwarded.** If a route handler or middleware returns a promise that **rejects**, Express 5 calls `next(err)` for you. So you can delete `try/catch` blocks and wrappers like `express-async-handler` that only existed to pass errors on. See [async errors](topic:express/async-errors).

**2. New route path rules.** Express 5 uses a newer version of the `path-to-regexp` library (version 8).

| Express 4 | Express 5 | Meaning |
|---|---|---|
| `'/*'` | `'/*splat'` | Wildcard needs a name. `req.params.splat` is an **array** of path parts |
| `'*'` (to match everything) | `'/{*splat}'` | Braces make it optional, so `/` matches too |
| `'/users/:id?'` | `'/users{/:id}'` | Optional parts now use braces |
| `'/:file.:ext?'` | `'/:file{.:ext}'` | Same idea for an optional extension |
| `'/user(s)?'` | Not allowed | Regex characters like `( ) [ ] ? +` in **strings** are reserved. Use two routes, or a real `RegExp` |

If you use the old syntax, Express throws an error **when the app starts**, like `Missing parameter name` or `Unexpected ?`. So you find these problems quickly.

**3. Request changes:**
- **`req.query` is read-only.** It is now a getter. Code like `req.query = cleaned` doesn't work anymore. Store cleaned values somewhere else, like `res.locals` or `req.validatedQuery`.
- **Default query parser is "simple".** `?a=1&a=2` still gives an array. But `?filter[status]=open` is **not** turned into a nested object. Turn the old behaviour back on with `app.set('query parser', 'extended')`.
- **`req.body` is `undefined`** when no body parser ran. In Express 4 it was `{}`. Code like `req.body.name` now throws if you forgot `express.json()`.
- **`express.urlencoded()` uses `extended: false` by default.**
- **`req.host` keeps the port**, like `localhost:3000`. Use `req.hostname` for just the name.

**4. Removed or changed methods:**

| Removed in Express 5 | Use instead |
|---|---|
| `app.del()` | `app.delete()` |
| `res.sendfile()` | `res.sendFile()` (capital F) |
| `req.param('id')` | `req.params.id`, `req.query.id` or `req.body.id` |
| `res.json(obj, 404)` / `res.send(404, obj)` | `res.status(404).json(obj)` |
| `res.send(200)` (a number as the body) | `res.sendStatus(200)` |
| `res.redirect('back')` | `res.redirect(req.get('Referrer') \|\| '/')` |

`res.status()` is also stricter. It only accepts a whole number from 100 to 999. `res.status('200')` now throws a `TypeError`.

**5. Requirements.** Express 5 needs **Node.js 18 or newer**.

**How to upgrade:**
1. Update the package: `npm install express@5`.
2. Start the app. Fix every path error it reports.
3. Search the code for removed methods. The Express team also gives a codemod tool, `npx @expressjs/codemod upgrade`, that fixes many of them for you.
4. Check middleware that **writes** to `req.query`, and code that expects `req.body` to always exist.
5. Run your tests, especially error cases.

## 🎯 Why do we use it?

- **Safer async code.** Forgetting `try/catch` in one async route can't crash or hang the app anymore.
- **Less boilerplate.** You can remove async wrappers from every route.
- **Clearer, safer routes.** The new path rules are simpler and remove a kind of attack (ReDoS), where a tricky path made the regex very slow.
- **Kept up to date.** New projects get Express 5 by default, so you'll see it in modern codebases and interviews.

## ⚠️ Common mistakes

- **Copying old tutorials with `app.get('*', …)` or `'/:id?'`.** Express 5 throws an error at startup. Use `'/{*splat}'` and `'{/:id}'`.
- **Thinking every error is caught now.** Errors are forwarded only if they happen in the handler's promise. An error thrown later, inside a `setTimeout` callback or an event listener, still isn't caught.
- **Mutating `req.query` in validation middleware.** It quietly doesn't work in Express 5. Save the cleaned data in a new property.
- **Assuming `req.body` exists.** Without `express.json()`, it's `undefined`, and `req.body.email` throws.

## 🗣️ How to answer in an interview

> "Express 5 is the current major version, and it needs Node 18 or newer. The most useful change is async error handling. If an async route or middleware throws or its promise rejects, Express 5 passes the error to next for me. So I don't need try/catch or an asyncHandler wrapper in every route anymore.
>
> The other big change is the routing syntax, because it moved to path-to-regexp version 8. Wildcards must be named, like `/*splat`. Optional segments use braces, like `/users{/:id}`. And regex characters inside path strings aren't allowed.
>
> There are also smaller breaking changes. `req.query` is read-only and uses a simple parser by default. `req.body` is undefined if there's no body parser. And old methods like `app.del`, `res.sendfile` and `req.param` are removed. When upgrading, I'd run the codemod, fix the path errors the app reports at startup, and run the test suite."

[FILL IN: whether your SkillKeepr services run Express 4 or Express 5, and if you did or planned an upgrade — only if you know.]

## 🔁 Follow-up questions

### Do I still need an async error wrapper in Express 5?

Not for errors in the handler's own promise. Express 5 forwards those automatically. You still need care for errors in callbacks that run *later*, like timers or stream events. Those must call `next(err)` themselves or be turned into promises.

### Why did Express change the route path syntax?

The old syntax allowed regex-like patterns in strings. Some patterns could be made extremely slow by a crafted URL (a ReDoS attack), and the rules were confusing. The new syntax is smaller, clearer and safer.

### What happens if you upgrade and still use `'/*'`?

The app crashes at startup with an error like `Missing parameter name`. This is good: you find the problem immediately, not in production traffic. Rename it to `'/*splat'` or `'/{*splat}'`.

### How do you validate query strings now that `req.query` is read-only?

Validate `req.query` with a schema (Zod or Joi). Then store the parsed result in a new place, like `res.locals.query` or `req.validated`, and use that in the controller.

## ✅ Quick check

### 1. Which route path is valid in Express 5?

- A) `app.get('/users/:id?', …)`
- B) `app.get('/*', …)`
- C) `app.get('/users{/:id}', …)`

:::answer
**C.** Optional parts use braces. A throws `Unexpected ?`, and B throws `Missing parameter name`, because the wildcard has no name.
:::

### 2. In Express 5, an `async` route does `await db.find()` and it rejects. There is no try/catch. What happens?

:::answer
Express 5 catches the rejected promise and calls `next(err)`. Your error-handling middleware runs and sends the error response. In Express 4, the error would not reach your middleware.
:::

### 3. What is the Express 5 replacement for `res.json({ error: 'Not found' }, 404)`?

:::answer
`res.status(404).json({ error: 'Not found' })`. Passing the status as a second argument was removed.
:::
