---
title: The req and res objects
stack: express
order: 4
level: Basic
mustKnow: false
askedFrequency: common
summary:
  - "req (request) is everything the client sent: method, URL, params, query, body, headers, cookies, IP."
  - "res (response) is the reply you build: status code, headers, and a body sent with res.json(), res.send() and similar."
  - Both are Node's normal http objects with extra Express helpers added on top.
  - "You can call res.status(201).json(data) in one line, because res.status() returns res."
  - Send exactly one response per request. Use return before res.json() inside if blocks, so the code stops there.
cards:
  - q: What is req in Express?
    a: "The request object. It holds what the client sent: req.method, req.path, req.params, req.query, req.body, req.headers, req.ip, and more."
  - q: What is res in Express?
    a: "The response object you use to reply: res.status(), res.set() for headers, res.json(), res.send(), res.redirect(), res.sendFile()."
  - q: How do you read a request header?
    a: "req.get('Authorization') or req.headers.authorization. Header names in req.headers are lowercase."
  - q: Why write return res.status(400).json(...)?
    a: The return stops the function, so code below does not try to send a second response ("Cannot set headers after they are sent").
  - q: What does res.locals do?
    a: It's an object for passing data from middleware to later handlers during one request, like the logged-in user or a request ID.
---

## 💡 What is it?

Every route handler gets two objects: **`req`** and **`res`**.

- **`req`** (request) = what the client **sent** you. It has the URL, the data, the headers and more.
- **`res`** (response) = the **reply** you send back. You set the status code, the headers and the body.

They are Node's normal [http](topic:nodejs/http-module) objects. Express adds helpful extra functions to them.

## 🏠 Real-life example

Think of a **letter and its reply at the post office**.

A customer gives you a letter. It has:
- the **address** on the envelope (where it's going),
- the **sender details** and stamps on the outside,
- the **letter inside**.

You read it and write a reply. You stamp the reply "Approved" or "Rejected", and send it back.

- The **customer's letter** = `req`.
- The **address** = `req.path` and `req.params`.
- **Notes on the envelope** (like "Urgent") = `req.headers`.
- **The letter inside** = `req.body`.
- **Your reply** = `res`.
- **The "Approved" / "Rejected" stamp** = the status code (`200`, `404`).
- **Sending the reply** = `res.json(...)`. You send **one** reply per letter.

## 🧑‍💻 Code example

Set up: `npm init -y`, then `npm install express`. Save as `inspect.js`. It uses CommonJS. Run with `node inspect.js`.

```js
const express = require('express');                       // load Express
const app = express();                                    // create the app
app.use(express.json());                                  // fill req.body from JSON

app.post('/orders/:orderId', (req, res) => {              // :orderId comes from the URL
  const info = {                                          // collect what the client sent
    method: req.method,                                   // "POST"
    path: req.path,                                       // "/orders/42"
    params: req.params,                                   // { orderId: "42" } — from the URL path
    query: req.query,                                     // { coupon: "SAVE10" } — from ?coupon=SAVE10
    body: req.body,                                       // { item: "pen" } — the JSON we sent
    userAgent: req.get('User-Agent'),                     // a header: which program sent the request
    ip: req.ip,                                           // the client's IP address
  };                                                      // end of info

  if (!req.body.item) {                                   // no item in the body?
    return res.status(400).json({ error: 'item is required' }); // 400 = bad request; return stops here
  }                                                       // end of the check

  res.set('X-Order-Id', req.params.orderId);              // add a custom header to the reply
  res.status(201).json(info);                             // 201 = created; send info back as JSON
});                                                       // end of the route

app.listen(3000, () => console.log('http://localhost:3000')); // start on port 3000
```

```text
$ curl -i -X POST "http://localhost:3000/orders/42?coupon=SAVE10" -H "Content-Type: application/json" -d '{"item":"pen"}'
HTTP/1.1 201 Created
X-Order-Id: 42
Content-Type: application/json; charset=utf-8

{"method":"POST","path":"/orders/42","params":{"orderId":"42"},"query":{"coupon":"SAVE10"},
 "body":{"item":"pen"},"userAgent":"curl/8.7.1","ip":"::1"}

$ curl -X POST http://localhost:3000/orders/42 -H "Content-Type: application/json" -d '{}'
{"error":"item is required"}
```

(`-i` tells curl to also show the status line and headers. `::1` is your own computer's address in IPv6.)

## 🔍 Deeper version

**`req`: the most-used properties**

| Property | What it is | Example |
|---|---|---|
| `req.method` | HTTP method | `'POST'` |
| `req.path` / `req.originalUrl` | path only / full URL with query | `'/orders/42'` / `'/orders/42?coupon=SAVE10'` |
| `req.params` | values from `:name` in the path | `{ orderId: '42' }` |
| `req.query` | values after `?` | `{ coupon: 'SAVE10' }` |
| `req.body` | parsed body (needs a body parser) | `{ item: 'pen' }` |
| `req.headers` / `req.get(name)` | headers (lowercase keys) / one header, any case | `req.get('authorization')` |
| `req.ip` | client IP (needs `trust proxy` behind a load balancer) | `'203.0.113.5'` |
| `req.cookies` | cookies (needs `cookie-parser`) | `{ session: '…' }` |

**`res`: the most-used methods**

| Method | What it does |
|---|---|
| `res.status(code)` | sets the status code; returns `res`, so you can chain |
| `res.json(obj)` | sends JSON and ends the response |
| `res.send(body)` | sends a string, Buffer or object |
| `res.sendStatus(code)` | sends only a status, like `204` |
| `res.set(name, value)` | sets a response header |
| `res.cookie(name, value, options)` | sets a cookie (for example `httpOnly`) |
| `res.redirect(url)` | sends a redirect (302 by default) |
| `res.sendFile(path)` / `res.download(path)` | sends a file / sends it as a download |

**One response only.** Once the headers are sent, you can't change them. Sending twice gives `ERR_HTTP_HEADERS_SENT`. That's why we write `return res.status(400).json(...)` inside `if` blocks. You can check `res.headersSent` in error handlers.

**`res.locals`.** An empty object that lives for **one request**. Middleware can put data on it, like `res.locals.user`, and later handlers can read it. Many teams use `req.user` for the logged-in user instead. Both work. Just be consistent.

**`req.ip` behind a proxy.** On hosting platforms, your app sits behind a load balancer. Then `req.ip` shows the load balancer's address. Set `app.set('trust proxy', 1)` so Express reads the real client IP from the `X-Forwarded-For` header. Rate limiting by IP needs this.

:::version[Version note]
**Express 5** changed a few things:
- `req.body` is `undefined` (not `{}`) when no body parser ran.
- `req.query` is now read-only. You can't assign to it, so validation middleware should store cleaned values somewhere else.
- The default query parser is "simple", so `?a[b]=1` is no longer turned into a nested object.
- `res.status()` only accepts whole numbers from 100 to 999.
- Old forms like `res.send(200)` and `res.json(obj, 200)` were removed. Use `res.status(200).json(obj)`.
:::

## 🎯 Why do we use it?

- **`req` gives you everything you need to decide what to do.** Which user? Which item? What data? Which filters?
- **`res` lets you answer the right way.** A correct status code, clear headers and a clean JSON body. That makes your API easy for the frontend to use.
- **The helpers save time.** `res.json()` turns the object into JSON and sets the right `Content-Type` header for you.

## ⚠️ Common mistakes

- **Sending two responses.** For example, forgetting `return` after an error response.
- **Trusting `req.body` blindly.** The client can send anything. Always validate it (see [validation](topic:express/validation)).
- **Comparing params as numbers.** `req.params.id` is always a **string**.
- **Using `req.ip` behind a load balancer without `trust proxy`.** Every user seems to have the same IP.

## 🗣️ How to answer in an interview

> "req and res are Node's IncomingMessage and ServerResponse objects, extended by Express. From req I read the method, req.params for path values, req.query for the query string, req.body after a body parser like express.json, and headers with req.get.
>
> With res I build the reply. res.status sets the code and returns res, so I can chain res.status(201).json(data). I can also set headers, cookies or redirect. Each request must get exactly one response, so I return early in error branches to avoid the 'headers already sent' error.
>
> For passing data between middleware, like the authenticated user, I attach it to req.user or res.locals. Behind a load balancer, I enable trust proxy so req.ip is the real client IP."

## 🔁 Follow-up questions

### What is the difference between `req.params`, `req.query` and `req.body`?

`req.params` comes from the **path** (`/students/:id`). `req.query` comes from after the **`?`** (`?page=2`). `req.body` is the **data sent in the request body**, usually JSON in POST, PUT and PATCH. See [params vs query vs body](topic:express/params-query-body).

### What causes "Cannot set headers after they are sent to the client"?

You sent a response, then tried to send another one or change headers. Common causes: a missing `return` after `res.json`, calling `next()` after responding, or two `.then` branches both replying.

### How do you set a secure cookie?

`res.cookie('token', value, { httpOnly: true, secure: true, sameSite: 'strict', maxAge: 15 * 60 * 1000 })`. `httpOnly` stops JavaScript from reading it, `secure` sends it only over HTTPS, and `maxAge` is in milliseconds.

### What does `trust proxy` do?

It tells Express the app is behind a proxy or load balancer. Express then trusts the `X-Forwarded-*` headers for `req.ip`, `req.protocol` and `req.secure`.

## ✅ Quick check

### 1. For `GET /students/7?sort=name`, what are `req.params` and `req.query`? The route is `/students/:id`.

:::answer
`req.params` is `{ id: '7' }`, and `req.query` is `{ sort: 'name' }`. Both values are strings.
:::

### 2. What's wrong here?

```js
app.get('/x', (req, res) => {                   // a route
  if (!req.query.id) res.status(400).json({ error: 'id needed' }); // no return!
  res.json({ ok: true });                       // runs even after the error reply
});
```

:::answer
There is no `return` after the 400 reply. When `id` is missing, it sends **two** responses and Express throws "headers already sent". Write `return res.status(400).json(...)`.
:::

### 3. Why can you write `res.status(404).json({...})` on one line?

:::answer
`res.status()` returns the same `res` object, so you can call `.json()` on it right away. This is called **method chaining**.
:::
