---
title: "The http module: a server without Express"
stack: nodejs
order: 16
level: Basic
mustKnow: false
askedFrequency: common
summary:
  - The built-in http module can create a web server with no packages at all. Express is built on top of it.
  - "http.createServer((req, res) => { … }) runs your function once for every request; server.listen(3000) starts it on a port."
  - "req = the incoming request (method, url, headers, body); res = the reply you build (status code, headers, body)."
  - "Without Express, you do everything by hand: route by req.method and req.url, read the body in chunks, set headers and call res.end()."
  - Express adds routing, middleware, JSON parsing and helpers like res.json() — that's why we use it for real APIs.
cards:
  - q: How do you create a server with only Node.js?
    a: "const server = http.createServer((req, res) => { res.end('hi'); }); server.listen(3000);"
  - q: What are req and res in http.createServer?
    a: "req is the incoming request (method, URL, headers, body stream). res is the response you write (status code, headers, body). You must finish it with res.end()."
  - q: Why is reading the request body harder without Express?
    a: The body arrives as a stream of chunks. You have to collect the chunks, join them and JSON.parse the result yourself. Express's express.json() does this for you.
  - q: What happens if you never call res.end()?
    a: The response never finishes, so the browser or client keeps waiting until it times out.
  - q: What does Express add on top of the http module?
    a: Routing (app.get('/users/:id')), middleware, body parsing, error handling and helpers like res.json() and res.status().
---

## 💡 What is it?

**`http`** is a module built into Node.js. With it, you can make a **web server** without installing anything.

A web server waits for **requests** (like "give me the list of users"). For each request, it sends back a **response**.

**Express** is built on top of this module. Learning `http` shows you what Express does for you behind the scenes.

## 🏠 Real-life example

Think of a **small tea stall** with one person running it.

- The **stall** = the server.
- The **stall's spot on the street** = the **[port](glossary:port)**, like 3000. Customers must come to the right spot.
- A **customer's order** = the **request** (`req`): what they want, from which counter.
- **Making the tea and handing it over** = the **response** (`res`). You hand it over with `res.end()`.
- **Reading each order and deciding what to make** = routing (`if url is /tea … else if /coffee …`).

With only the `http` module, the stall owner does **everything** by hand. **Express** is like hiring a helper who takes orders, reads the menu and hands out cups. The owner just makes the tea.

## 🧑‍💻 Code example

Save this as `server.mjs`. Run `node server.mjs`. Then open `http://localhost:3000/hello` in your browser.

```js
import http from 'node:http';                                    // Node's built-in web server module

const server = http.createServer((req, res) => {                 // this function runs once for EVERY request
  console.log(req.method, req.url);                              // e.g. "GET /hello" → what was asked for

  if (req.method === 'GET' && req.url === '/hello') {            // our own simple routing
    res.writeHead(200, { 'Content-Type': 'text/plain' });        // 200 = OK; tell the browser it's plain text
    res.end('Hello from plain Node!');                           // send the body AND finish the response
  } else if (req.method === 'GET' && req.url === '/users') {     // a second route
    const users = [{ id: 1, name: 'Hari' }];                     // pretend data
    res.writeHead(200, { 'Content-Type': 'application/json' });  // tell the browser it's JSON
    res.end(JSON.stringify(users));                              // turn the object into JSON text and send it
  } else {                                                       // any other URL
    res.writeHead(404, { 'Content-Type': 'text/plain' });        // 404 = Not Found
    res.end('Not found');                                        // finish the response
  }                                                              // end of the routing
});                                                              // end of the request handler

server.listen(3000, () => {                                      // start listening on port 3000
  console.log('Server running at http://localhost:3000');        // runs once the server is ready
});                                                              // end of listen
```

**What you see:**

```text
Browser at /hello  →  Hello from plain Node!
Browser at /users  →  [{"id":1,"name":"Hari"}]
Browser at /other  →  Not found
Terminal           →  GET /hello
                      GET /favicon.ico
```

(The browser also asks for `/favicon.ico`, the little tab icon, by itself. That's why you see a second request.)

## 🔍 Deeper version

**What `req` and `res` really are.**
- `req` is an `IncomingMessage`. It has `method`, `url` and `headers`. It is also a **readable [stream](topic:nodejs/streams)**: the body arrives in pieces.
- `res` is a `ServerResponse`. It is a **writable stream**. You set the status and headers, write the body, and must call **`res.end()`**.

**Reading a JSON body by hand** (Express does this with `express.json()`):

```js
let body = '';                                                   // we'll collect the pieces here
req.on('data', (chunk) => { body += chunk; });                   // each piece (a Buffer) is added as it arrives
req.on('end', () => {                                            // all pieces have arrived
  try {                                                          // the text might not be valid JSON
    const data = JSON.parse(body);                               // turn the text into an object
    res.writeHead(201, { 'Content-Type': 'application/json' });  // 201 = Created
    res.end(JSON.stringify({ received: data }));                 // send it back
  } catch {                                                      // bad JSON from the client
    res.writeHead(400);                                          // 400 = Bad Request
    res.end('Invalid JSON');                                     // finish the response
  }                                                              // end of try/catch
});                                                              // end of the 'end' handler
```

A real server would also **limit the body size**, so nobody can send a 5 GB request and fill your memory.

**What you must do by hand, and what Express gives you:**

| Job | Plain `http` | Express |
|---|---|---|
| Routing | `if (req.method === … && req.url === …)` | `app.get('/users/:id', …)` |
| URL params and query | parse `req.url` yourself with `new URL(req.url, base)` | `req.params`, `req.query` |
| JSON body | collect chunks + `JSON.parse` | `app.use(express.json())` |
| Send JSON | `writeHead` + `JSON.stringify` + `end` | `res.status(201).json(data)` |
| Shared logic (auth, logging) | call functions yourself | middleware |
| Errors | try/catch everywhere | central error handler |

**Under the hood.** `server.listen()` asks the operating system to open a port. Incoming connections are handled by the [event loop](topic:nodejs/event-loop). The request handler is just a [callback](glossary:callback). That's why one Node process can keep thousands of connections open.

**The module family:** `node:https` (same API, with TLS certificates), `node:http2` and `fetch` (a global since Node 18) for making requests to *other* servers. In production, HTTPS is usually handled by a load balancer or reverse proxy (like Nginx or the cloud platform) in front of Node.

## 🎯 Why do we use it?

- **To understand Express.** Express's `app` is just a request handler passed to `http.createServer()`. Its `req` and `res` are the same objects, with extra helpers added.
- **Tiny services with zero dependencies.** For example, a health-check endpoint, a webhook receiver in a small tool, or a quick test server.
- **Interview questions.** "Create a server without Express" is a common basic task.
- For real APIs, we still use **Express** (or Fastify, NestJS), because routing, middleware and error handling by hand get messy fast.

## ⚠️ Common mistakes

- **Forgetting `res.end()`.** The request hangs until it times out.
- **Setting headers after sending the body.** You get `ERR_HTTP_HEADERS_SENT`. Set the status and headers first.
- **Calling `JSON.parse` without `try/catch`.** One bad request body can crash your handler.
- **Matching `req.url` exactly when it has a query string.** `/users?page=2` is not equal to `'/users'`. Parse it with `new URL(req.url, 'http://localhost')` and use `.pathname`.

## 🗣️ How to answer in an interview

> "Node has a built-in http module. I can create a server with http.createServer and a handler function that gets req and res, then call server.listen on a port. req is a readable stream with the method, URL and headers. res is a writable stream: I set the status code and headers, write the body, and must call res.end.
>
> Without a framework, I do everything by hand. I route by checking req.method and req.url, collect the body chunks and parse JSON myself, and stringify responses.
>
> That's exactly what Express does for me. An Express app is just a request handler on top of this module. It adds routing with params, middleware, body parsing, res.json and central error handling. So for real APIs I use Express, but knowing the http module helps me understand and debug what Express does underneath."

## 🔁 Follow-up questions

### How is Express connected to the http module?

`app.listen(3000)` in Express calls `http.createServer(app).listen(3000)` behind the scenes. The Express `app` is just a function `(req, res) => {…}` with routing and middleware inside. Express adds helpers like `res.json()` onto the normal `req` and `res` objects.

### How do you read query parameters without Express?

Use the `URL` class: `const url = new URL(req.url, 'http://localhost'); url.searchParams.get('page');`. `url.pathname` gives the path without the query string.

### What does `ERR_HTTP_HEADERS_SENT` mean?

You tried to set headers or send a response **after** the response was already sent. A common cause is sending twice, for example forgetting a `return` after `res.end()` in an `if`.

### How would you add HTTPS?

Use the `https` module with a certificate and key: `https.createServer({ key, cert }, handler)`. In real deployments, HTTPS is usually handled in front of Node, by a load balancer, a reverse proxy or the hosting platform, and Node itself speaks plain HTTP.

## ✅ Quick check

### 1. What's wrong with this handler?

```js
http.createServer((req, res) => {            // handle each request
  res.writeHead(200);                        // status 200 = OK
  res.write('Hi');                           // write some text
}).listen(3000);                             // start on port 3000
```

:::answer
It never calls **`res.end()`**, so the response never finishes and the client keeps waiting. Add `res.end()` (or write `res.end('Hi')`).
:::

### 2. A request comes to `/users?page=2`. What is `req.url`?

- A) `/users`
- B) `/users?page=2`
- C) `page=2`

:::answer
**B) `/users?page=2`.** `req.url` includes the query string. Use `new URL(req.url, 'http://localhost').pathname` to get only `/users`.
:::

### 3. True or false: Express replaces Node's http module with its own server.

:::answer
**False.** Express runs **on top of** the http module. `app.listen()` creates a normal `http` server and passes the Express app as its request handler.
:::
