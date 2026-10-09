---
title: "Routing: methods, paths and express.Router"
stack: express
order: 3
level: Basic
mustKnow: true
askedFrequency: very common
summary:
  - "A route = HTTP method + path + handler, like app.get('/students/:id', handler)."
  - "Express checks routes from top to bottom. The first one that matches handles the request, unless it calls next()."
  - "express.Router() is a mini-app for one group of routes (like /students). You mount it with app.use('/students', router)."
  - "Use :name for URL parameters (req.params.name). In Express 5, a wildcard must have a name, like /*splat."
  - Put specific routes (/students/search) above general ones (/students/:id), or the general one catches them first.
cards:
  - q: What three things make a route in Express?
    a: "An HTTP method (get, post, put, patch, delete), a path ('/students/:id') and a handler function."
  - q: What is express.Router and why use it?
    a: A mini-app that holds a group of related routes. You mount it on a prefix with app.use('/students', router), so each feature can live in its own file.
  - q: Why can /students/search be "caught" by /students/:id?
    a: Express checks routes in order. If /students/:id comes first, "search" matches :id. Put the specific route first.
  - q: How do you write a catch-all (wildcard) route in Express 5?
    a: "Give the wildcard a name: app.get('/*splat', …). Use '/{*splat}' if it should also match the root path /. The old bare '*' no longer works."
  - q: What does app.route('/students') do?
    a: It lets you chain several methods on one path, like app.route('/students').get(list).post(create), so you don't repeat the path.
---

## 💡 What is it?

**Routing** means deciding **which code runs for which request**.

In Express, a **route** has three parts:
1. an **HTTP method**, like `GET` (read) or `POST` (create),
2. a **path**, like `/students`,
3. a **handler**, the function that answers.

`express.Router()` lets you group related routes together, for example all the `/students` routes in one file.

## 🏠 Real-life example

Think of a **big hospital**.

At the entrance, a sign says: "Heart problems → Floor 2. Bones → Floor 3. Eyes → Floor 4."

On each floor, there are rooms for different jobs: "Room 1: check-up. Room 2: X-ray."

- The **hospital** = the Express app.
- **Each floor** = a Router (`/students`, `/courses`).
- **The entrance sign** = `app.use('/students', studentRouter)`. It sends people to the right floor.
- **Each room on the floor** = one route (`GET /`, `POST /`, `GET /:id`).
- **What the patient wants** (check-up or X-ray) = the HTTP method.

You don't put every room on the ground floor. Groups make the hospital easy to manage. Routers do the same for your code.

## 🧑‍💻 Code example

Set up: `npm init -y` then `npm install express`. Save both files in the same folder. They use CommonJS (`require`). Run with `node app.js`.

**students.js** (one Router for all student routes):

```js
const express = require('express');                    // load Express
const router = express.Router();                       // a mini-app just for student routes

const students = [{ id: 1, name: 'Asha' }];            // fake data instead of a database

router.get('/', (req, res) => {                        // GET /students → list all students
  res.json(students);                                  // send the whole list as JSON
});                                                    // end of GET /

router.get('/search', (req, res) => {                  // GET /students/search?name=as → MUST be above /:id
  const q = (req.query.name || '').toLowerCase();      // read ?name=… from the URL, or '' if missing
  res.json(students.filter((s) => s.name.toLowerCase().includes(q))); // students whose name contains q
});                                                    // end of GET /search

router.get('/:id', (req, res) => {                     // GET /students/1 → :id becomes req.params.id
  const student = students.find((s) => s.id === Number(req.params.id)); // params are strings, so turn "1" into 1
  if (!student) return res.status(404).json({ error: 'Not found' });    // 404 = nothing with that id
  res.json(student);                                   // found → send it
});                                                    // end of GET /:id

router.post('/', (req, res) => {                       // POST /students → create a student
  const student = { id: students.length + 1, name: req.body.name }; // build the new student
  students.push(student);                              // save it in our fake data
  res.status(201).json(student);                       // 201 = "created"
});                                                    // end of POST /

module.exports = router;                               // share this router with app.js
```

**app.js** (the main app):

```js
const express = require('express');                    // load Express
const studentRouter = require('./students');           // load our router file

const app = express();                                 // create the app
app.use(express.json());                               // read JSON bodies into req.body
app.use('/students', studentRouter);                   // every path starting with /students goes to the router

app.listen(3000, () => console.log('http://localhost:3000')); // start the server on port 3000
```

```text
$ curl http://localhost:3000/students
[{"id":1,"name":"Asha"}]

$ curl "http://localhost:3000/students/search?name=as"
[{"id":1,"name":"Asha"}]

$ curl http://localhost:3000/students/99
{"error":"Not found"}

$ curl -X POST http://localhost:3000/students -H "Content-Type: application/json" -d '{"name":"Ravi"}'
{"id":2,"name":"Ravi"}
```

## 🔍 Deeper version

**Route methods.** `app.get`, `app.post`, `app.put`, `app.patch`, `app.delete` match one HTTP method each. `app.all(path, fn)` matches every method. `app.use(path, fn)` is for middleware and routers. It matches the path **and everything under it** (`/students`, `/students/1`, …).

**Order matters.** Express keeps routes in a list, in the order you add them. For each request, it walks the list from the top. The **first match** runs. If that handler calls `next()`, Express keeps looking further down. That's why `/students/search` must be written **before** `/students/:id`.

**Path patterns in Express 5:**

| Pattern | Matches | Notes |
|---|---|---|
| `/students/:id` | `/students/7` | `req.params.id === '7'` (always a string) |
| `/files/:name.:ext` | `/files/cv.pdf` | two params: `name`, `ext` |
| `/students{/:id}` | `/students` and `/students/7` | `{ }` = optional part |
| `/*splat` | any path except `/` | wildcard **must have a name** |
| `/{*splat}` | any path, including `/` | optional wildcard |

:::version[Version note]
**Express 5** uses a newer path matcher (path-to-regexp v8). Some Express 4 patterns no longer work:
- A bare `*` → write `/*splat` (or `/{*splat}` to also match `/`).
- Optional `?`, as in `/:id?` → write `{/:id}`.
- Regex-like characters such as `+`, `(`, `)` inside path strings are not allowed. Use a real `RegExp` instead.

See [Express 5 changes](topic:express/express-5).
:::

**`express.Router()`** is a "mini-app". It has its own middleware and routes. You mount it with `app.use('/students', router)`. Inside the router, paths are **relative**: `router.get('/:id')` becomes `/students/:id`. Options:
- `express.Router({ mergeParams: true })`: lets a nested router read params from its parent, like `:schoolId` in `/schools/:schoolId/students`.
- `router.use(authMiddleware)`: runs only for routes in this router.

**`app.route()`** chains methods for one path, so you don't repeat it:

```js
router.route('/:id')              // one path…
  .get(getStudent)                // GET /students/:id
  .patch(updateStudent)           // PATCH /students/:id
  .delete(deleteStudent);         // DELETE /students/:id
```

**Many handlers on one route.** A route can take several functions: `router.delete('/:id', requireAdmin, deleteStudent)`. They run in order, like middleware for just that route.

## 🎯 Why do we use it?

- **To send each request to the right code.** Without routing, one giant function would check every URL with `if` statements.
- **To organise a growing app.** Each feature (students, courses, payments) gets its own router file. Teams can work on different files without conflicts.
- **To protect groups of routes at once.** Add `router.use(requireLogin)` to a router, and every route inside it needs a login.
- **To version an API.** Mount routers under `/api/v1` and later `/api/v2`.

## ⚠️ Common mistakes

- **Wrong order.** `/:id` above `/search` makes "search" look like an id.
- **Forgetting that params are strings.** `req.params.id === 7` is false. Use `Number(req.params.id)`, or compare as strings.
- **Using Express 4 wildcard syntax in Express 5**, like `app.get('*', …)`. It throws an error at startup. Use `'/*splat'`.
- **Mounting the router twice, or with the full path inside.** If the app uses `app.use('/students', router)`, write `router.get('/:id')`, not `router.get('/students/:id')`.

## 🗣️ How to answer in an interview

> "A route in Express is an HTTP method, a path and a handler, like app.get('/students/:id', handler). Express keeps routes in the order they're defined and runs the first match. So I put specific paths like /students/search above dynamic ones like /students/:id.
>
> For organisation, I use express.Router. Each resource gets its own router file, which I mount with app.use and a prefix, like app.use('/api/v1/students', studentRouter). I can attach middleware to a whole router, for example authentication, and chain methods with router.route for the same path.
>
> One Express 5 detail: it uses a newer path matcher, so wildcards need a name, like /*splat, and optional parts use braces instead of a question mark."

## 🔁 Follow-up questions

### What is the difference between `app.use()` and `app.get()`?

`app.get` matches only GET requests, and only the **exact** path pattern. `app.use` matches **every** method, and any path that **starts with** the given prefix. We use `app.use` for middleware and for mounting routers.

### How do you read `:schoolId` from a parent path inside a nested router?

Create the child router with `express.Router({ mergeParams: true })`. Then `req.params.schoolId` from `/schools/:schoolId/students` is available inside it.

### How do you return a JSON 404 for unknown routes?

After **all** routes, add a last middleware: `app.use((req, res) => res.status(404).json({ error: 'Not found' }))`. Any request that no route handled reaches it.

### How would you version an API?

Mount routers under a version prefix: `app.use('/api/v1', v1Router)`. When you need breaking changes, add `/api/v2` and keep v1 running until clients move.

## ✅ Quick check

### 1. Routes are added in this order. What does `GET /students/search` return?

```js
router.get('/:id', (req, res) => res.send('id route'));       // added first
router.get('/search', (req, res) => res.send('search route')); // added second
```

:::answer
**"id route".** Express checks routes in order. `/:id` matches `search` first. Move `/search` above `/:id`.
:::

### 2. The app has `app.use('/api/students', router)` and the router has `router.get('/:id', …)`. Which URL reaches this handler?

- A) `/students/5`
- B) `/api/students/5`
- C) `/api/students/students/5`

:::answer
**B) `/api/students/5`.** The mount path and the router path are joined together.
:::

### 3. Why does `app.get('*', handler)` crash on startup in Express 5?

:::answer
Express 5 needs named wildcards. Write `app.get('/*splat', handler)`, or `'/{*splat}'` to also match `/`.
:::
