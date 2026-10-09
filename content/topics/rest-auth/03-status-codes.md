---
title: HTTP status codes you must know
stack: rest-auth
order: 3
level: Basic
mustKnow: true
askedFrequency: very common
summary:
  - "A status code is a 3-digit number in every response. The first digit is the family: 2xx success, 3xx redirect, 4xx the client's mistake, 5xx the server's mistake."
  - "Must-know: 200 OK, 201 Created, 204 No Content, 400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found, 409 Conflict, 422 Unprocessable Content, 429 Too Many Requests, 500, 502, 503."
  - 401 means "I don't know who you are". 403 means "I know you, but you're not allowed".
  - Never send 200 with an error inside the body. Clients, monitoring and retries all depend on the code.
  - 4xx errors should not be retried as they are. Some 5xx and 429 errors can be retried after waiting.
cards:
  - q: What do the five status code families mean?
    a: "1xx info, 2xx success, 3xx redirect, 4xx the client sent something wrong, 5xx the server failed."
  - q: 401 vs 403?
    a: "401 Unauthorized = not logged in or bad token (\"who are you?\"). 403 Forbidden = logged in, but not allowed to do this."
  - q: When do you return 409?
    a: When the request conflicts with the current state, like registering an email that already exists, or an edit based on an old version.
  - q: What is 429?
    a: Too Many Requests. The client hit the rate limit. Often sent with a Retry-After header.
  - q: 502 vs 503 vs 504?
    a: "502 Bad Gateway: the proxy got a bad reply from the server behind it. 503 Service Unavailable: the server is overloaded or down for maintenance. 504 Gateway Timeout: the server behind the proxy was too slow."
---

## 💡 What is it?

Every HTTP response starts with a **[status code](glossary:status-code)**: a 3-digit number that says how the request went.

The **first digit** tells you the family:

| Family | Meaning |
|---|---|
| 2xx | ✅ Success |
| 3xx | ↪️ Go somewhere else (redirect) |
| 4xx | 🙋 The **client** made a mistake |
| 5xx | 🔥 The **server** failed |

The client reads the code first. The body only adds details.

## 🏠 Real-life example

Think of **sending a letter through the post office**.

- **200 OK** = the letter arrived, and you got a reply.
- **201 Created** = you asked to open a new account, and here is your new account number.
- **301 Moved** = "This person moved. Here is the new address."
- **400 Bad Request** = you wrote the address so badly that nobody can read it.
- **401 Unauthorized** = the office asks, "Show your ID first."
- **403 Forbidden** = they saw your ID, but you can't enter the staff room.
- **404 Not Found** = no one lives at that address.
- **500 Internal Server Error** = the post office itself caught fire. Not your fault.

## 🧑‍💻 Code example

A small Express 5 server that returns the common codes. Run `npm init -y` and `npm install express`. Save as `codes.js` and run `node codes.js`. (CommonJS.)

```js
const express = require('express');                               // load Express
const app = express();                                            // create the app
app.use(express.json());                                          // parse JSON bodies

const jobs = { 1: { id: 1, title: 'Node.js Developer' } };       // fake data: job 1 exists

app.get('/jobs/:id', (req, res) => {                              // read one job
  const job = jobs[req.params.id];                                // look it up by id
  if (!job) return res.status(404).json({ error: 'Not found' });  // 404 = it doesn't exist
  res.status(200).json(job);                                      // 200 = OK (the default)
});                                                               // end of route

app.post('/jobs', (req, res) => {                                 // create a job
  if (!req.body.title) {                                          // title is required
    return res.status(422).json({ error: 'title is required' });  // 422 = valid JSON, but the data breaks a rule
  }                                                               // end of check
  res.status(201).json({ id: 2, title: req.body.title });         // 201 = created
});                                                               // end of route

app.get('/admin/report', (req, res) => {                          // a protected page
  if (!req.headers.authorization) return res.status(401).end();   // 401 = not logged in (who are you?)
  res.status(403).end();                                          // 403 = logged in, but not allowed
});                                                               // end of route

app.get('/crash', () => {                                         // a route with a bug
  throw new Error('Oops');                                        // Express 5 turns this into a 500
});                                                               // end of route

app.use((err, req, res, next) => {                                // error handler (4 arguments)
  const status = err.status || 500;                               // bad JSON comes with status 400; bugs have none → 500
  res.status(status).json({ error: status === 400 ? 'Bad JSON' : 'Something went wrong' }); // send the right code
});                                                               // end of error handler

app.listen(3000, () => console.log('listening on 3000'));         // start on port 3000
```

Calling each route with `curl -s -o /dev/null -w "%{http_code}"` (print only the code):

```text
GET /jobs/1             → 200
GET /jobs/99            → 404
POST /jobs (title)      → 201
POST /jobs (no title)   → 422
POST /jobs (bad JSON)   → 400
GET /admin/report       → 401
GET /admin/report+token → 403
GET /crash              → 500
GET /nope               → 404
```

**What to notice:** broken JSON gets **400**, because `express.json()` marks that error with `status: 400`. If the error handler always sent 500, a client mistake would look like a server bug.

## 🔍 Deeper version

**The codes you should know by heart:**

| Code | Name | Use it when… |
|---|---|---|
| 200 | OK | A normal success with a body (GET, PUT, PATCH). |
| 201 | Created | POST created something. Also send a `Location: /jobs/2` header. |
| 202 | Accepted | The work was queued and will finish later (e.g. a bulk upload). |
| 204 | No Content | Success with no body (often DELETE). |
| 301 / 308 | Moved Permanently | The URL changed for good. 308 keeps the method and body. |
| 302 / 307 | Found / Temporary Redirect | Go elsewhere for now. 307 keeps the method. |
| 304 | Not Modified | The cached copy is still fresh (used with `ETag`). |
| 400 | Bad Request | Broken syntax: bad JSON, wrong types, missing required headers. |
| 401 | Unauthorized | No credentials, or bad or expired credentials. Really means "unauthenticated". |
| 403 | Forbidden | Credentials are fine, but this user may not do this. |
| 404 | Not Found | The resource doesn't exist, or you're hiding that it exists. |
| 405 | Method Not Allowed | E.g. DELETE on a route that only supports GET. |
| 409 | Conflict | The data clashes with current state: duplicate email, version mismatch. |
| 413 | Content Too Large | The upload or body is bigger than the limit. |
| 415 | Unsupported Media Type | Wrong `Content-Type`, e.g. XML sent to a JSON-only API. |
| 422 | Unprocessable Content | Valid JSON, but it fails validation rules. |
| 429 | Too Many Requests | Rate limit hit. Add `Retry-After`. |
| 500 | Internal Server Error | An unexpected bug on the server. |
| 502 | Bad Gateway | A proxy or gateway got a bad reply from the app behind it. |
| 503 | Service Unavailable | Overloaded or in maintenance. Often temporary. |
| 504 | Gateway Timeout | The app behind the proxy didn't answer in time. |

:::version[Version note]
The current HTTP standard is **RFC 9110** (2022). It renamed 413 to "Content Too Large" and 422 to "**Unprocessable Content**" (it used to be "Unprocessable Entity"). The numbers didn't change.
:::

**400 vs 422.** Many teams use **400 for every input error**. Others use 400 for "can't parse it" and 422 for "parsed, but the rules fail". Both are fine. Just be consistent. See [PUT vs PATCH, 401 vs 403, 400 vs 422](topic:rest-auth/put-patch-401-403-400-422).

**404 to hide things.** If a user asks for another company's candidate, returning **404** instead of 403 hides the fact that the record exists. This matters in a [multi-tenant](glossary:multi-tenant) product.

**Retries.** Don't retry most 4xx errors: the same request will fail again. You can retry **429, 502, 503 and 504** after a wait, with exponential backoff (waiting longer each time). For POST, only retry if it's protected with an [idempotency key](topic:rest-auth/idempotency-keys).

**API Gateway's 29-second limit.** In AWS API Gateway (REST APIs), the default integration timeout is **29 seconds**. If the backend takes longer, the gateway gives up and returns **504**. Long jobs should return **202 Accepted** and finish in the background.

## 🎯 Why do we use it?

- **Clients can react without reading the body.** The frontend logs out on 401, shows "no access" on 403, and retries on 503.
- **Monitoring depends on it.** Dashboards count 5xx errors to alert you. A 200 with an error inside hides real problems.
- **Caches and browsers use it.** 301 redirects are remembered, and 304 saves bandwidth.
- **It is a shared language.** Every developer knows what 404 means.

## ⚠️ Common mistakes

- **200 for everything**, with `{ "success": false }` in the body. Monitoring and retries can't see the error.
- **Mixing up 401 and 403.** A logged-in user without permission should get 403, not 401. Otherwise the frontend may log them out.
- **500 for user mistakes**, like bad JSON or a duplicate email. 5xx should mean "our fault".
- **Leaking error details** (stack traces, SQL) in 500 responses. Log them on the server. Send a short message to the client.

## 🗣️ How to answer in an interview

> "Status codes tell the client the result before it reads the body. 2xx means success, 4xx means the client sent something wrong, and 5xx means the server failed.
>
> The ones I use every day: 200 for normal reads and updates, 201 when something is created, 204 for deletes with no body, 400 or 422 for invalid input, 401 when the user isn't authenticated, 403 when they are but don't have permission, 404 when it doesn't exist, 409 for conflicts like a duplicate email, 429 for rate limits, and 500 for unexpected bugs.
>
> I'm careful with two things. First, I never return 200 with an error inside, because monitoring and retries depend on the code. Second, my central error handler maps known errors to the right 4xx code, so a client mistake doesn't show up as a 500."

## 🔁 Follow-up questions

### A logged-in recruiter opens a page they don't have permission for. 401 or 403?

**403.** They are authenticated, just not allowed. A 401 would make the frontend think the session expired and log them out.

### What would you return for "email already registered"?

**409 Conflict**, with a clear message. Some teams use 422 for this too. Pick one and document it.

### A request takes 2 minutes to process. What do you return?

Don't make the client wait. Return **202 Accepted** with a job id, do the work in the background (a queue), and let the client check status or get a notification.

### When is 404 better than 403?

When you don't want to show that something exists, like another tenant's record or a private document. 404 gives away nothing.

### What does 304 Not Modified do?

The client sends `If-None-Match` with the `ETag` it has. If nothing changed, the server replies 304 with no body, and the client uses its cached copy.

## ✅ Quick check

### 1. The JSON body is valid, but `experience` is `-5`. Best code?

- A) 500
- B) 422 (or 400)
- C) 404

:::answer
**B.** The request was readable, but the data breaks a validation rule. Many teams use 400 here too. 500 would wrongly blame the server.
:::

### 2. Your API runs behind a load balancer. The Node app crashed, so the load balancer gets no good reply. What does the client most likely see?

:::answer
**502 Bad Gateway** (or 503 if no healthy server is left). The load balancer is the "gateway", and the app behind it failed.
:::

### 3. Which codes are usually safe to retry after waiting?

:::answer
**429, 502, 503 and 504.** They are often temporary. 400, 401, 403, 404 and 422 will fail again with the same request.
:::
