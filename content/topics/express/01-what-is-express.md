---
title: What Express is and why we use it
stack: express
order: 1
level: Basic
mustKnow: true
askedFrequency: very common
summary:
  - Express is a small web framework for Node.js. It helps you build APIs and web servers with much less code.
  - It is built on top of Node's built-in http module, and adds routing, middleware and helpers like res.json().
  - "A request goes through a line of middleware functions, then reaches a route handler that sends the response."
  - Express is "unopinionated". It gives you the basic tools and lets you choose your own folder structure, database and libraries.
  - Express 5 is the current major version. It catches errors from async handlers by itself.
cards:
  - q: What is Express in one sentence?
    a: A small, flexible web framework for Node.js that gives you routing, middleware and response helpers, so building an API takes much less code.
  - q: How is Express related to Node's http module?
    a: Express is built on top of it. Every Express app is still an http server, but Express adds routing, middleware, body parsing and helpers.
  - q: What does "unopinionated" mean for Express?
    a: It does not force a folder structure, database or style. You choose them. Frameworks like NestJS are "opinionated" and decide more for you.
  - q: Name three things Express gives you that plain Node doesn't.
    a: "Routing by method and path (app.get('/users/:id')), middleware chains (app.use), and helpers like res.json(), res.status() and express.json() for the body."
  - q: When might you pick something other than Express?
    a: When you want a strict structure for a big team (NestJS), or the highest speed with built-in schema validation (Fastify).
---

## 💡 What is it?

**Express** is a small **web framework** for [Node.js](topic:nodejs/what-is-nodejs). A framework is a set of ready-made tools that gives your code a shape.

Express helps you build **web servers** and **[APIs](glossary:api)** with much less code. It is the most popular Node.js framework.

It sits on top of Node's built-in [http module](topic:nodejs/http-module). It adds the boring parts for you: picking the right code for each URL, reading JSON, and sending replies.

## 🏠 Real-life example

Think of a **school office** with a helpful **receptionist**.

Students come with different requests. "I need my ID card." "I want to pay my fees." "Where is the principal?"

The receptionist does three things:
- First, they check every student at the door (are you a student here?).
- Then, they send each student to the right counter.
- Each counter does one job and gives the student an answer.

- The **school office** = your Express app (the server).
- **Students with requests** = HTTP requests from browsers or mobile apps.
- **Checking at the door** = [middleware](glossary:middleware). It runs for every request.
- **Sending to the right counter** = routing (`/fees` goes to the fees counter).
- **Each counter** = a route handler, a function that sends the response.

Without the receptionist (plain Node), every student would have to find the right counter alone. That's slow and messy.

## 🧑‍💻 Code example

Set up a new folder, then install Express:

```bash
npm init -y
npm install express
```

Save this as `app.js`. It uses CommonJS (`require`). Run it with `node app.js`.

```js
const express = require('express');                      // load the Express package we installed

const app = express();                                   // create the app (our server)

app.use(express.json());                                 // middleware: read JSON bodies into req.body

app.get('/', (req, res) => {                             // when someone does GET / ...
  res.send('Welcome to the school office!');             // ...send back plain text
});                                                      // end of the GET / route

app.get('/students/:id', (req, res) => {                 // :id = a value inside the URL, like /students/7
  res.json({ id: req.params.id, name: 'Asha' });         // send JSON; req.params.id is "7" (always a string)
});                                                      // end of the GET /students/:id route

app.post('/students', (req, res) => {                    // when someone sends POST /students with a JSON body
  res.status(201).json({ created: req.body });           // 201 = "created"; send back what we received
});                                                      // end of the POST route

app.listen(3000, () => {                                 // start the server on port 3000
  console.log('Server running on http://localhost:3000'); // runs once the server is ready
});                                                      // end of listen
```

Now test it in a second terminal:

```text
$ curl http://localhost:3000/
Welcome to the school office!

$ curl http://localhost:3000/students/7
{"id":"7","name":"Asha"}

$ curl -X POST http://localhost:3000/students -H "Content-Type: application/json" -d '{"name":"Ravi"}'
{"created":{"name":"Ravi"}}
```

## 🔍 Deeper version

**What Express really is.** An Express app is just a function `(req, res)`. When you call `app.listen(3000)`, Express does `http.createServer(app).listen(3000)` for you. So every Express app is still a plain Node `http` server underneath.

**The two big ideas:**

| Idea | What it means | Example |
|---|---|---|
| **Routing** | Pick the right function by **HTTP method + path** | `app.get('/students/:id', handler)` |
| **Middleware** | Functions that run **in order** for a request, before the final handler | `app.use(express.json())`, an auth check, a logger |

Every request flows through a **pipeline**: middleware 1 → middleware 2 → … → route handler → response. Each step can stop the request (send a reply) or pass it on with `next()`.

**What it adds on top of `http`:**
- Routing with URL parameters (`:id`) and `express.Router` for splitting routes into files.
- `req.params`, `req.query`, `req.body` (with `express.json()`).
- Helpers: `res.json()`, `res.status()`, `res.redirect()`, `res.sendFile()`.
- A central error handler (a middleware with 4 arguments).

**"Unopinionated."** Express does not choose your folder structure, database, validation library or auth method. That gives freedom, but in a big team you must agree on your own structure. A common one is routes → controllers → services → models (see [project structure](topic:express/project-structure)).

**Express vs other Node frameworks:**

| Framework | In short |
|---|---|
| **Express** | Small, flexible, huge community and middleware ecosystem. The default choice. |
| **Fastify** | Faster, with built-in JSON schema validation and logging. |
| **NestJS** | Opinionated, uses TypeScript classes and decorators. Good for large teams. It can run on Express or Fastify underneath. |

:::version[Version note]
**Express 5** is the current major version. 5.0 came out in late 2024, and 5.1 became the default on npm in 2025. The biggest change: if an `async` route handler throws or its promise rejects, Express 5 sends the error to your error handler by itself. In Express 4 you needed a wrapper or `try/catch` plus `next(err)`. Express 5 needs Node 18 or newer. See [Express 5 changes](topic:express/express-5).
:::

## 🎯 Why do we use it?

With plain Node, you must do everything by hand. You check `req.method` and `req.url` with `if` statements. You collect the body in [chunks](glossary:chunk) and parse JSON yourself. You set headers and call `res.end()` every time.

Express removes this repeated work:
- **Less code.** One line per route instead of a big `if/else` block.
- **Reusable middleware.** Write an auth check or logger once, and use it on any route.
- **Huge ecosystem.** Ready-made middleware exists for CORS, security headers, logging, file uploads, rate limiting and more.
- **Easy to learn.** Most Node.js tutorials, jobs and codebases use it.

## ⚠️ Common mistakes

- **Forgetting `app.use(express.json())`.** Then `req.body` is `undefined` for JSON requests.
- **Sending two responses.** Calling `res.json()` twice (or `res.send()` after `res.json()`) causes the error "Cannot set headers after they are sent".
- **Never sending a response.** If a handler doesn't reply and doesn't call `next()`, the client waits until it times out.
- **Putting all routes in one huge `app.js` file.** Use `express.Router` and split the code into folders as the app grows.

## 🗣️ How to answer in an interview

> "Express is a minimal web framework for Node.js. It sits on top of Node's http module and adds routing, middleware and helpers like res.json and res.status. So I can build a REST API with much less code.
>
> The core idea is a pipeline. Every request goes through middleware functions in order, like JSON parsing, logging and authentication. Then it reaches a route handler, which sends the response. Each middleware either responds or calls next.
>
> Express is unopinionated, so the team decides the structure. I usually split it into routes, controllers, services and models, with a central error handler. In Express 5, errors from async handlers go to the error handler automatically, which removes a lot of try/catch code."

[FILL IN: one line on what your Express services at SkillKeepr do (for example, which APIs you built). Only add what's true.]

## 🔁 Follow-up questions

### Why use Express instead of Node's http module directly?

The http module gives you only the basics. You would write your own routing, body parsing and error handling. Express gives you these in a tested, well-known way. Your code is shorter, and other developers understand it quickly.

### What is the difference between a library and a framework?

You **call** a library when you need it (like `lodash`). A framework **calls your code** at the right time. Express calls your route handlers and middleware when a matching request arrives. Express is a small, light framework.

### Is Express good for big production apps?

Yes. Many large companies use it. But Express doesn't give you structure, so you must add it yourself: a clear folder structure, validation, central error handling, logging, tests and security middleware. For very large teams, some choose NestJS for the built-in structure.

### Express vs Fastify vs NestJS?

Express is the most popular and flexible. Fastify is faster and has built-in schema validation. NestJS adds a strict structure with TypeScript decorators and dependency injection, and can run on top of Express or Fastify.

## ✅ Quick check

### 1. What does `app.listen(3000)` do?

- A) Sends a request to port 3000
- B) Starts an HTTP server that waits for requests on port 3000
- C) Opens the browser

:::answer
**B.** It creates a Node http server with your app as the request handler and starts listening on port 3000.
:::

### 2. A client sends JSON to `POST /students`, but `req.body` is `undefined`. What is missing?

:::answer
**`app.use(express.json())`**, placed before the route. It reads the JSON body and puts it on `req.body`.
:::

### 3. True or false: Express replaces Node's http module.

:::answer
**False.** Express is built **on top of** the http module. `app.listen()` still creates a normal Node http server.
:::
