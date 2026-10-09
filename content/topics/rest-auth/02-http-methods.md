---
title: "HTTP methods: GET, POST, PUT, PATCH, DELETE"
stack: rest-auth
order: 2
level: Basic
mustKnow: true
askedFrequency: very common
summary:
  - "GET reads, POST creates, PUT replaces the whole thing, PATCH changes some fields, DELETE removes."
  - GET must never change data. Browsers, caches and crawlers may repeat it.
  - "PUT, DELETE and GET are idempotent: repeating them gives the same result. POST is not: two POSTs create two items."
  - "Usual success codes: GET 200, POST 201, PUT/PATCH 200, DELETE 204."
  - HEAD and OPTIONS also exist. The browser sends OPTIONS for the CORS preflight.
cards:
  - q: What does each main HTTP method do?
    a: "GET = read, POST = create, PUT = replace the whole resource, PATCH = change some fields, DELETE = remove."
  - q: Which methods are idempotent?
    a: "GET, HEAD, OPTIONS, PUT and DELETE. Repeating them leaves the server in the same state. POST and (usually) PATCH are not."
  - q: Why must GET never change data?
    a: GET is "safe". Browsers prefetch it, caches repeat it and crawlers follow links. A GET that deletes something could run by accident.
  - q: Which status code fits a successful DELETE?
    a: 204 No Content (nothing to send back). 200 with a body is also fine.
  - q: Can a GET request have a body?
    a: The spec gives it no meaning, and many servers, proxies and libraries ignore or reject it. Put GET inputs in the URL (params and query string).
---

## 💡 What is it?

Every HTTP request has a **method**. The method is the **verb**. It tells the server what you want to do with the resource in the URL.

| Method | Meaning | Example |
|---|---|---|
| `GET` | read | `GET /candidates/1` |
| `POST` | create a new one | `POST /candidates` |
| `PUT` | replace the whole thing | `PUT /candidates/1` |
| `PATCH` | change some fields | `PATCH /candidates/1` |
| `DELETE` | remove | `DELETE /candidates/1` |

## 🏠 Real-life example

Think of your **class attendance register**.

- **GET** = looking at a student's row. You only read. Nothing changes.
- **POST** = a new student joins, so you add a new row. Add it twice and you get two rows!
- **PUT** = you tear out a student's row and write a **fresh, full row**. Anything you didn't write is gone.
- **PATCH** = you use correction tape on **one box**, like the phone number. The rest stays.
- **DELETE** = you strike out the student's row.

## 🧑‍💻 Code example

Run `npm init -y` and `npm install express`. Save as `methods.js` and run `node methods.js`. (CommonJS.)

```js
const express = require('express');                         // load Express
const app = express();                                      // create the app
app.use(express.json());                                    // parse JSON bodies into req.body

let candidates = [{ id: 1, name: 'Asha', city: 'Kochi' }];  // our "database": one candidate
let nextId = 2;                                             // the id the next new candidate gets

app.get('/candidates/:id', (req, res) => {                  // GET = read
  const c = candidates.find((x) => x.id === Number(req.params.id)); // find by id ('1' → 1)
  c ? res.json(c) : res.status(404).end();                  // found → send it; not found → 404, no body
});                                                         // end of GET

app.post('/candidates', (req, res) => {                     // POST = create a new one
  const c = { id: nextId++, ...req.body };                  // new id + the data from the body
  candidates.push(c);                                       // save it
  res.status(201).json(c);                                  // 201 Created + the new candidate
});                                                         // end of POST

app.put('/candidates/:id', (req, res) => {                  // PUT = replace the WHOLE candidate
  const id = Number(req.params.id);                         // the id from the URL, as a number
  const c = { id, ...req.body };                            // the new full version (missing fields are gone)
  candidates = candidates.map((x) => (x.id === id ? c : x)); // swap old for new
  res.json(c);                                              // 200 OK + the new version
});                                                         // end of PUT

app.patch('/candidates/:id', (req, res) => {                // PATCH = change only some fields
  const c = candidates.find((x) => x.id === Number(req.params.id)); // find the candidate
  Object.assign(c, req.body);                               // copy only the sent fields onto it
  res.json(c);                                              // 200 OK + the updated candidate
});                                                         // end of PATCH

app.delete('/candidates/:id', (req, res) => {               // DELETE = remove
  candidates = candidates.filter((x) => x.id !== Number(req.params.id)); // keep all except this one
  res.status(204).end();                                    // 204 No Content = done, nothing to send back
});                                                         // end of DELETE

app.listen(3000, () => console.log('listening on 3000'));   // start the server on port 3000
```

(To keep it short, PATCH here doesn't check for a missing candidate. Real code would return 404.)

Try each method with `curl` in another terminal:

```text
$ curl -X POST localhost:3000/candidates -H 'Content-Type: application/json' -d '{"name":"Ravi","city":"Pune"}'
{"id":2,"name":"Ravi","city":"Pune"}

$ curl -X PATCH localhost:3000/candidates/2 -H 'Content-Type: application/json' -d '{"city":"Kochi"}'
{"id":2,"name":"Ravi","city":"Kochi"}

$ curl -X PUT localhost:3000/candidates/2 -H 'Content-Type: application/json' -d '{"name":"Ravi K"}'
{"id":2,"name":"Ravi K"}

$ curl -o /dev/null -w "%{http_code}\n" -X DELETE localhost:3000/candidates/2
204

$ curl -o /dev/null -w "%{http_code}\n" localhost:3000/candidates/2
404
```

**What to notice:** PATCH kept `name` and changed `city`. PUT replaced everything, so `city` disappeared.

## 🔍 Deeper version

**Two important properties** (from the HTTP standard, RFC 9110):

- **Safe** = the method only reads. It must not change server data. Safe: `GET`, `HEAD`, `OPTIONS`.
- **Idempotent** = sending it once or ten times leaves the server in the **same state**. Idempotent: `GET`, `HEAD`, `OPTIONS`, `PUT`, `DELETE`.

| Method | Safe? | Idempotent? | Usual success code | Has a body? |
|---|---|---|---|---|
| GET | ✅ | ✅ | 200 | no |
| POST | ❌ | ❌ | 201 (+ `Location` header) | yes |
| PUT | ❌ | ✅ | 200 or 204 (201 if it created it) | yes |
| PATCH | ❌ | ❌ (can be made idempotent) | 200 or 204 | yes |
| DELETE | ❌ | ✅ | 204 (or 200 with a body) | usually no |
| HEAD | ✅ | ✅ | 200, headers only | no |
| OPTIONS | ✅ | ✅ | 204 / 200 | no |

**Why idempotency matters.** Networks fail. If a request times out, the client (or a proxy) may **retry** it. Retrying `PUT` or `DELETE` is harmless. Retrying `POST` may create a **duplicate** order or charge. To make POST safe to retry, use an [idempotency key](topic:rest-auth/idempotency-keys), as Stripe does.

**DELETE is idempotent even if the second call returns 404.** Idempotency is about the **server state**, not the status code. After one DELETE or five, the item is gone.

**PATCH formats.** A simple JSON object ("merge patch", RFC 7396) is most common: send only the fields to change. There is also JSON Patch (RFC 6902): a list of operations like `{ "op": "replace", "path": "/city", "value": "Kochi" }`.

**OPTIONS and CORS.** Before some cross-origin requests, the browser sends an automatic `OPTIONS` request, called a **preflight**. See [Headers and the CORS preflight](topic:rest-auth/headers-cors-preflight).

## 🎯 Why do we use it?

- **The method is part of the contract.** One URL like `/candidates/2` can be read, changed or deleted. You don't need `/updateCandidate`.
- **Tools understand the methods.** Caches only cache GET. Browsers warn before re-sending a POST form. Retry logic only retries idempotent methods.
- **Clear API docs.** Anyone reading `DELETE /jobs/:id` knows what it does.

## ⚠️ Common mistakes

- **Changing data in a GET**, like `GET /jobs/5/delete`. A link preview or crawler could delete your data.
- **Using PUT for partial updates.** If the client sends only `{ city }`, PUT means "the candidate now has only a city". Use PATCH.
- **Using POST for everything.** You lose caching, safe retries and clear docs.
- **Returning 200 with no body after DELETE** while clients expect JSON. Pick 204 or 200 + body, and stay consistent.

## 🗣️ How to answer in an interview

> "The method says what to do with the resource in the URL. GET reads, POST creates, PUT replaces the whole resource, PATCH updates some fields, and DELETE removes it.
>
> Two properties matter. Safe methods like GET must never change data. Idempotent methods, like GET, PUT and DELETE, give the same server state whether you call them once or many times, so they can be retried safely. POST isn't idempotent: retrying it can create a duplicate, so for things like payments I'd use an idempotency key.
>
> For status codes, I return 200 for reads and updates, 201 with the new resource for creates, and 204 for deletes. And I use PATCH for partial updates, because PUT means 'replace everything'."

## 🔁 Follow-up questions

### PUT vs POST — which one creates?

POST usually creates, and the **server** picks the id: `POST /candidates`. PUT can also create when the **client** knows the id: `PUT /candidates/abc-123`. Then PUT means "make this URL hold exactly this".

### Is PATCH idempotent?

Not by definition. `{ "city": "Kochi" }` is idempotent in practice. But `{ "op": "increment", "field": "views" }` is not: each call adds one more.

### Why does DELETE return 404 the second time? Isn't that non-idempotent?

Idempotency is about the **effect on the server**, not the response. The item is gone after the first call and stays gone. A different status code is allowed.

### What is HEAD used for?

It returns the same **headers** as GET, but no body. It's useful to check if a file exists, or its size and last-modified date, without downloading it.

## ✅ Quick check

### 1. The client sends `PUT /candidates/2` with only `{ "name": "Ravi K" }`. What should happen to the `city` field?

:::answer
**It is removed** (or set to its default). PUT replaces the whole resource with what was sent. To change only `name`, use PATCH.
:::

### 2. Which request is safe to retry automatically after a timeout?

- A) `POST /payments`
- B) `DELETE /jobs/5`
- C) `POST /emails/send`

:::answer
**B.** DELETE is idempotent: deleting twice still leaves the job deleted. The POSTs could charge twice or send two emails.
:::

### 3. What's wrong with `GET /candidates/7/archive`?

:::answer
It **changes data with a GET**. GET must be safe. Use `PATCH /candidates/7` with `{ "status": "archived" }`, or `POST /candidates/7/archive`.
:::
