---
title: Logging with morgan, pino or winston + request IDs
stack: express
order: 18
level: Intermediate
mustKnow: false
askedFrequency: common
summary:
  - Logs are messages your server writes about what it is doing, so you can find problems later.
  - morgan writes one line per HTTP request. pino and winston are general loggers for everything else.
  - "In production, write structured logs (JSON) with levels: error, warn, info, debug."
  - Give every request a request ID, and put it in every log line, so you can follow one request from start to end.
  - Never log passwords, tokens, card numbers or other personal data.
cards:
  - q: What is the difference between morgan and pino/winston?
    a: morgan only logs HTTP requests (method, URL, status, time). pino and winston are full loggers you use anywhere in the app, with levels and JSON output.
  - q: What is a request ID and why use it?
    a: A unique ID given to each request and added to every log line for it. It lets you find all the logs of one request among thousands.
  - q: What is structured logging?
    a: Writing logs as JSON objects with fixed fields (level, time, reqId, msg) instead of free text, so tools can search and filter them.
  - q: Name the usual log levels from most to least serious.
    a: fatal, error, warn, info, debug, trace. Production usually shows info and above.
  - q: What should you never log?
    a: Passwords, JWTs and API keys, card details, and personal data like full addresses or ID numbers.
---

## 💡 What is it?

**Logging** means your server writes short messages about what it is doing. For example: "a request came in", "a user logged in", or "the database call failed".

Later, when something breaks, you read these messages to find out what happened.

In Express, people often use two kinds of tools:
- **morgan** writes one line for each HTTP request.
- **pino** or **winston** are general loggers for any message in your app.

A **request ID** is a unique label for one request. You add it to every log line, so you can follow that one request.

## 🏠 Real-life example

Think of a **hospital patient file**.

When a patient arrives, they get a **file number**. Every doctor and nurse writes notes in the file: "10:02 temperature 101°F", "10:30 gave medicine", "11:00 feeling better". Every note has a **time** and the **file number**.

If something goes wrong, the senior doctor reads the file. They can see exactly what happened, step by step.

- The **patient** = one request.
- The **file number** = the request ID.
- The **notes** = log lines.
- The **time on each note** = the timestamp.
- **"Urgent!" in red ink** = the log level, like `error` or `warn`.
- **Not writing the patient's bank PIN in the file** = never logging passwords or tokens.

## 🧑‍💻 Code example

Set up:

```bash
npm init -y
npm install express morgan
```

Save this as `log.js`. Run it with `node log.js`.

```js
const crypto = require('node:crypto');                          // built-in module; we use it to make random IDs
const express = require('express');                             // load Express
const morgan = require('morgan');                               // load morgan, a request-logging middleware

const app = express();                                          // create the app

app.use((req, res, next) => {                                   // our own middleware: give every request an ID
  req.id = req.get('X-Request-Id') || crypto.randomUUID();      // reuse the caller's ID, or make a new random one
  res.set('X-Request-Id', req.id);                              // send the ID back, so the user can quote it in a bug report
  next();                                                       // go on to the next middleware
});                                                             // end of the request-ID middleware

morgan.token('id', (req) => req.id);                            // teach morgan a new word, :id, that prints req.id
app.use(morgan(':id :method :url :status :response-time ms'));  // one line per request: id, method, URL, status, time

app.get('/users/:id', (req, res) => {                           // a sample route
  if (req.params.id === '0') {                                  // pretend user 0 doesn't exist
    console.error(JSON.stringify({ level: 'warn', reqId: req.id, msg: 'user not found' })); // a structured log line with the same ID
    return res.status(404).json({ error: 'Not found' });        // 404 = not found
  }                                                             // end of the if
  res.json({ id: req.params.id, name: 'Asha' });                // normal answer
});                                                             // end of the route

app.listen(3000, () => console.log('Listening on 3000'));       // start the server on port 3000
```

Call it from a second terminal:

```text
$ curl -i http://localhost:3000/users/7
X-Request-Id: f1bc59e4-e7c6-4f37-ac66-cebd3507413b
{"id":"7","name":"Asha"}

$ curl -H "X-Request-Id: abc-123" http://localhost:3000/users/0
{"error":"Not found"}
```

The server terminal shows:

```text
f1bc59e4-e7c6-4f37-ac66-cebd3507413b GET /users/7 200 2.119 ms
{"level":"warn","reqId":"abc-123","msg":"user not found"}
abc-123 GET /users/0 404 0.426 ms
```

Notice how both lines for the second request share `abc-123`. That's the whole point of a request ID.

## 🔍 Deeper version

**Two kinds of logs:**
- **Access logs**: one line per request (method, URL, status, time). morgan does this.
- **Application logs**: messages from your own code ("payment failed", "email sent"). pino or winston do this.

**Log levels.** Each message has a level. In production you usually show `info` and above, and hide `debug`.

| Level | Use it for |
|---|---|
| `fatal` | The app cannot continue and will stop |
| `error` | Something failed, like a DB error or an unexpected crash in a route |
| `warn` | Something odd, but the app handled it, like a retry |
| `info` | Normal important events, like "server started" or "order created" |
| `debug` | Extra detail for developers, turned off in production |

**Structured logs (JSON).** Text like `"user 7 failed"` is hard to search. JSON like `{"level":"error","reqId":"…","userId":7,"msg":"payment failed"}` can be filtered by tools. Examples of such tools are Grafana Loki, Elasticsearch, Datadog and CloudWatch.

**pino vs winston:**
- **pino** is very fast and writes JSON by default. `pino-http` adds request logging *and* a child logger on `req.log` that already holds the request ID.
- **winston** is older and very flexible. It has many "transports" (places to send logs: console, files, services).
- Both are fine. pino is a common choice for new projects because it adds little overhead.

**Request IDs, in more detail:**
- Make one at the start of the request (`crypto.randomUUID()`), or reuse the `X-Request-Id` header if a load balancer or another service already set one.
- If you accept the caller's ID, check its length and characters, so nobody can inject junk into your logs.
- Pass it on when you call other services, in the same header. Then you can follow a request across many services.
- To get the ID deep inside your code without passing `req` everywhere, Node has `AsyncLocalStorage` (in `node:async_hooks`).

**Don't block the app with logging.** `console.log` to a terminal can be slow when there is a lot of output. Good loggers write fast and leave shipping logs to another process or the platform.

**Never log secrets.** pino has a `redact` option to hide fields like `req.headers.authorization` or `password`.

## 🎯 Why do we use it?

- **To find bugs in production.** You can't attach a debugger to a live server. Logs are often the only clue.
- **To follow one user's problem.** A user says "it failed at 3:15". With the request ID, you find every line for that request.
- **To see patterns.** Many 500 errors on one route, or slow response times, show up clearly in logs.
- **For audits.** Important actions, like a role change or a deleted record, should leave a record.

## ⚠️ Common mistakes

- **Logging secrets or personal data.** Passwords, JWTs, API keys and card numbers must never appear in logs. Logs are often read by many people and kept for a long time.
- **Only using `console.log` with free text.** It works on your laptop. But in production you can't search it or filter by level.
- **No request ID.** With many users at once, log lines get mixed together. You can't tell which lines belong to which request.
- **Logging too much at `info`.** Huge logs cost money and hide the important lines. Use `debug` for detail and turn it off in production.

## 🗣️ How to answer in an interview

> "I split logging into two parts. Access logs record every request: method, URL, status and response time. morgan or pino-http does that. Application logs are messages from my own code, with levels like error, warn, info and debug. In production I write them as structured JSON, so tools can search and filter them.
>
> Every request gets a request ID. I reuse the `X-Request-Id` header if it exists, or create one with `crypto.randomUUID()`. I put it in every log line and send it back in the response. Then, when a user reports a problem, I can find every line for that one request. I also pass the ID on to other services.
>
> And I never log passwords, tokens or personal data. pino's redact option helps with that."

[FILL IN: which logging and error-tracking tools you used at SkillKeepr (the resume mentions logging and error tracking, but not the tool names) — only if you know.]

## 🔁 Follow-up questions

### Why not just use `console.log` everywhere?

It has no levels, no fixed format and no request ID. You can't turn off debug messages in production. You also can't easily search millions of free-text lines. A real logger gives you levels, JSON output, redaction and better speed.

### How do you get the request ID inside a service function without passing `req`?

Use `AsyncLocalStorage` from `node:async_hooks`. A middleware starts a "store" with the ID for each request. Any code that runs for that request, even after `await`, can read the ID from the store. Many loggers support this.

### Where do logs go in production?

Usually the app writes to standard output (the console). The platform collects it, for example Docker, Kubernetes, Railway or a cloud service. Then it ships the logs to a log tool where you can search and set alerts. Writing to local files is rare in containers, because the files disappear when the container restarts.

### What's the difference between logging and error tracking?

Logs record many events of all kinds. An **error tracking** tool (like Sentry) groups crashes and errors, shows the stack trace, counts how many users were hit, and alerts you. Most teams use both.

## ✅ Quick check

### 1. Which of these should NOT be in a log line?

- A) `reqId: "abc-123"`
- B) `status: 500`
- C) `authorization: "Bearer eyJhbGciOi..."`

:::answer
**C.** That's a login token. Anyone who reads the logs could use it to act as that user. Redact it.
:::

### 2. Your app logs at level `info` in production. Which message is hidden?

- A) `logger.error('DB down')`
- B) `logger.debug('query took 3 ms')`
- C) `logger.warn('retrying payment')`

:::answer
**B.** `debug` is below `info`, so it is not printed. `warn` and `error` are above `info`, so they are printed.
:::

### 3. Why does the code example send `X-Request-Id` back in the response?

:::answer
So the user (or the frontend) can see the ID. When they report a bug, they can share it, and you can find every log line for that exact request.
:::
