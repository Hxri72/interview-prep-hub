---
title: Creating a server and your first route
stack: express
order: 2
level: Basic
mustKnow: false
askedFrequency: common
summary:
  - "Three steps: create the app with express(), add a route like app.get('/', handler), and start it with app.listen(port)."
  - "A route handler is a function (req, res) => { … }. It must send exactly one response, for example with res.send() or res.json()."
  - Read the port from process.env.PORT so the same code works on your laptop and on the server.
  - Use node --watch (or nodemon) during development, so the server restarts when you save a file.
  - "If the port is already in use, you get an EADDRINUSE error. Stop the old server or use another port."
cards:
  - q: What are the three steps to make a basic Express server?
    a: "const app = express(); then add a route like app.get('/', (req, res) => res.send('hi')); then app.listen(3000)."
  - q: What is a route handler?
    a: The function that runs when a request matches a method and path. It gets req and res and must send one response.
  - q: Why use process.env.PORT instead of writing 3000?
    a: Hosting platforms (like Railway) choose the port and give it to your app as an environment variable. Your code must use it, with 3000 only as a local fallback.
  - q: What does EADDRINUSE mean?
    a: The port is already used by another program, often an old copy of your server. Stop it, or use a different port.
  - q: What is the difference between res.send() and res.json()?
    a: res.send() sends text, HTML, a Buffer or an object. res.json() always sends JSON and sets the Content-Type to application/json.
---

## 💡 What is it?

A **server** is a program that waits for requests and sends back responses.

To make one in Express, you need only three steps:
1. **Create** the app with `express()`.
2. **Add a route.** A route says "for this URL, run this function".
3. **Start** the server on a [port](glossary:port) with `app.listen()`.

The function that answers a route is called a **route handler**.

## 🏠 Real-life example

Think of **opening a new juice shop**.

1. You **build the shop** (create the app).
2. You **write the menu**: "Orange juice → counter 1. Mango juice → counter 2." (add routes)
3. You **open the shutter** at a fixed address, so customers can come in (start listening on a port).

- The **shop** = the Express app.
- The **menu lines** = routes (`GET /orange`).
- The **person making the juice** = the route handler.
- The **shop address** = the port, like 3000.
- **Opening the shutter** = `app.listen(3000)`.

If another shop is already at that address, you can't open there. That's the `EADDRINUSE` error.

## 🧑‍💻 Code example

Set up a new folder:

```bash
npm init -y
npm install express
```

Save this as `server.js`. It uses CommonJS (`require`). Run it with `node --watch server.js`. (`--watch` restarts the server each time you save.)

```js
const express = require('express');                     // load Express

const app = express();                                  // step 1: create the app
const PORT = process.env.PORT || 3000;                  // use the PORT the host gives us, or 3000 on our laptop

app.get('/', (req, res) => {                            // step 2: a route for GET /
  res.send('Hello from my first Express server!');      // reply with plain text
});                                                     // end of the GET / route

app.get('/time', (req, res) => {                        // another route: GET /time
  res.json({ now: new Date().toISOString() });          // reply with JSON, e.g. {"now":"2026-10-09T10:00:00.000Z"}
});                                                     // end of the GET /time route

app.listen(PORT, () => {                                // step 3: start listening on the port
  console.log(`Listening on http://localhost:${PORT}`); // this runs once the server is ready
});                                                     // end of listen
```

Open these in your browser, or use `curl`:

```text
$ node --watch server.js
Listening on http://localhost:3000

$ curl http://localhost:3000/
Hello from my first Express server!

$ curl http://localhost:3000/time
{"now":"2026-10-09T10:00:00.000Z"}

$ curl http://localhost:3000/nothing-here
Cannot GET /nothing-here      ← Express's default 404 page (status 404)
```

## 🔍 Deeper version

**What `app.listen` does.** `app.listen(port, callback)` is a short form of `http.createServer(app).listen(port, callback)`. It returns the Node `http.Server` object. Keep it in a variable if you need it later, for example to close it during [graceful shutdown](topic:nodejs/graceful-shutdown).

**One request, one response.** A handler must end the request **exactly once**:
- `res.send(body)`: sends a string, HTML, a Buffer, or an object (objects become JSON).
- `res.json(obj)`: always sends JSON and sets `Content-Type: application/json`.
- `res.sendStatus(204)`: sends only a status code.
- `res.end()`: ends with no body.

If you reply twice, Express throws "Cannot set headers after they are sent to the client". If you never reply, the client hangs until it times out.

**Default 404.** If no route matches, Express runs its built-in "not found" handler. It returns status 404 with the text `Cannot GET /path`. In real APIs, you add your own 404 middleware **after all routes** to return JSON instead.

**Ports and environment variables.** On your laptop you pick a port, like 3000. Hosting platforms like Railway choose the port for you and pass it in `process.env.PORT`. That's why we write `process.env.PORT || 3000`. (See [environment variables](topic:nodejs/environment-variables).)

**Common startup errors:**

| Error | Meaning | Fix |
|---|---|---|
| `EADDRINUSE` | The port is already in use | Stop the other process, or change the port |
| `EACCES` | No permission for that port (ports below 1024 on Linux/macOS) | Use a port like 3000 or 8080 |
| `Cannot find module 'express'` | Express is not installed in this folder | Run `npm install express` |

**Restart on save.** Node has `node --watch file.js` built in (stable since Node 22). Older projects use the `nodemon` package for the same job.

:::version[Version note]
In **Express 5**, if `app.listen` fails (for example, the port is in use), the error is passed to your callback as its first argument. In Express 4 the error was only emitted as an `'error'` event on the server.
:::

## 🎯 Why do we use it?

Every backend starts here. Before you add a database, login or validation, you need a server that:
- starts on a known port,
- answers a simple route, so you can check that it works,
- restarts quickly while you write code.

A tiny "hello" route is also a quick **health check**. It tells you, and later your hosting platform, that the server is alive.

## ⚠️ Common mistakes

- **Hard-coding the port** (`app.listen(3000)` only). This can fail on hosting platforms that give you a different port.
- **Forgetting to send a response** in a handler. The browser keeps loading forever.
- **Running two copies of the server.** The second one fails with `EADDRINUSE`.
- **Restarting by hand after every change.** Use `node --watch` or `nodemon`.

## 🗣️ How to answer in an interview

> "To create an Express server, I call express() to create the app. Then I register routes, like app.get with a path and a handler. Then I call app.listen with the port. The handler gets req and res, and it must send exactly one response, with res.json, res.send or res.status.
>
> I read the port from process.env.PORT with a local fallback, so the same code runs on my machine and on the host. In development I use node --watch or nodemon to restart on save.
>
> Behind the scenes, app.listen just creates a normal Node http server with the app as the request handler. I keep that server object so I can close it cleanly on shutdown."

## 🔁 Follow-up questions

### What does `app.listen()` return?

It returns a Node `http.Server` object. You can use it to call `server.close()` during shutdown, to attach WebSockets (like Socket.IO), or to start the app in tests.

### Why separate `app.js` (the app) and `server.js` (the listen call)?

So tests can import the app **without** starting a real server. Tools like Supertest take the `app` directly. This is a very common pattern (see [Supertest](topic:express/supertest)).

### What happens if no route matches a request?

Express's default handler sends status 404 with `Cannot GET /path`. In an API you add your own catch-all middleware after all routes, which returns a JSON error like `{ "error": "Not found" }`.

### What is the difference between `res.send` and `res.json`?

`res.send` accepts many types and guesses the Content-Type. `res.json` always converts the value to JSON and sets `application/json`. For APIs, use `res.json` so the response is always consistent.

## ✅ Quick check

### 1. What is wrong with this handler?

```js
app.get('/hello', (req, res) => {   // a route for GET /hello
  console.log('someone said hello'); // log a message
});                                  // no response sent!
```

:::answer
It never sends a response. The client waits until it times out. Add `res.send('hello')` or `res.json(...)`.
:::

### 2. You start the server and see `Error: listen EADDRINUSE: address already in use :::3000`. What do you do?

:::answer
Another program (often an old copy of your server) is using port 3000. Stop it, or start your server on a different port, for example `PORT=4000 node server.js`.
:::

### 3. Why write `process.env.PORT || 3000`?

:::answer
Hosting platforms give your app a port through the `PORT` environment variable. `|| 3000` is only a fallback for your laptop, when `PORT` is not set.
:::
