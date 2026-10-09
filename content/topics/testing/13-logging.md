---
title: "Logging: levels, structure, what never to log"
stack: testing
order: 13
level: Intermediate
mustKnow: true
askedFrequency: very common
summary:
  - "Logs are the app's diary. Good logs let you answer \"what happened, to whom, when, and why?\" in production."
  - "Use levels: debug (details), info (normal events), warn (odd but OK), error (something failed). Production usually shows info and above."
  - Log structured JSON with a request ID on every line, so you can follow one request through the whole system.
  - Never log passwords, tokens, API keys, card numbers or full personal data — redact them.
  - Logs cost money and are kept only for a set time (retention), so log what helps you debug, not everything.
cards:
  - q: What are the main log levels, and when do you use each?
    a: "debug for detailed dev info, info for normal events (request done, job finished), warn for odd but handled situations, error for real failures."
  - q: Why log in JSON instead of plain text?
    a: JSON logs can be searched and filtered by field (requestId, status, route) in tools like CloudWatch, instead of guessing with text search.
  - q: What is a request ID, and why use it?
    a: A unique id given to each request and added to every log line for it. You can then find every line for one user's failing request.
  - q: What must never be logged?
    a: Passwords, tokens, cookies, API keys, card details and unnecessary personal data. Redact them automatically in the logger config.
  - q: What is log retention?
    a: How long logs are kept before being deleted. Short retention saves money; longer retention helps investigations and audits.
---

## 💡 What is it?

**Logging** means your app writes short notes about what it is doing. For example: "request received", "payment failed", "job finished".

In production you can't add `console.log` and re-run. **Logs are your eyes.** They let you see what happened after a problem is reported.

Good logs have a **level**, a clear **structure**, and **no secrets**.

## 🏠 Real-life example

Think of a **school security guard's register book**.

- **Each line in the book** = one log line.
- **Time, name and reason for visit** = the structured fields (time, user, route).
- **Normal visits** = `info`.
- **"Visitor came without ID, allowed after a call"** = `warn`.
- **"Gate broken, could not let anyone in"** = `error`.
- **A visitor pass number written on every line about that visitor** = the request ID.
- **Never writing down a parent's ATM PIN** = never logging passwords or tokens.
- **Old register books thrown away after one year** = log retention.

## 🧑‍💻 Code example

Set up: `npm init -y`, then `npm install pino`. Save as `log.js`. Run `node log.js`.

```js
const pino = require('pino');                          // a fast JSON logger for Node
const { randomUUID } = require('node:crypto');         // makes a unique id for each request

const logger = pino({                                  // create the main logger
  level: 'info',                                       // show info and above; hide debug
  base: { service: 'candidate-api' },                  // add this field to every line
  timestamp: pino.stdTimeFunctions.isoTime,            // readable time, like 2026-10-09T10:00:00.000Z
  redact: ['req.body.password', 'req.headers.authorization'], // NEVER print these: replace with [Redacted]
});                                                    // end of logger settings

const requestId = randomUUID();                        // one id that follows this whole request
const log = logger.child({ requestId });               // every line from `log` carries the requestId

log.debug('this is hidden');                           // level debug < info, so it is not printed
log.info({ req: { method: 'POST', url: '/login', body: { email: 'a@b.com', password: 'secret123' }, headers: { authorization: 'Bearer abc.def' } } }, 'login attempt'); // password and token are hidden
log.warn({ attempts: 3 }, 'too many failed logins');   // something odd, but the app still works
log.error({ err: new Error('DB timeout') }, 'login failed'); // a real failure, with the error stack
```

**Output (real run; the id, time and stack are shortened here):**

```text
{"level":30,"time":"2026-10-09T…","service":"candidate-api","requestId":"6f1c…","req":{"method":"POST","url":"/login","body":{"email":"a@b.com","password":"[Redacted]"},"headers":{"authorization":"[Redacted]"}},"msg":"login attempt"}
{"level":40,"time":"2026-10-09T…","service":"candidate-api","requestId":"6f1c…","attempts":3,"msg":"too many failed logins"}
{"level":50,"time":"2026-10-09T…","service":"candidate-api","requestId":"6f1c…","err":{"type":"Error","message":"DB timeout","stack":"Error: DB timeout\n    at …"},"msg":"login failed"}
```

**What to notice:**
- The `debug` line is **missing**, because the level is `info`.
- Levels are numbers: **30 = info, 40 = warn, 50 = error**.
- The password and the `Authorization` header became **`[Redacted]`**.
- Every line has the same **`requestId`**, so you can find all three together.
- The email is still visible. Email is personal data, so many teams mask it too.

## 🔍 Deeper version

**Levels and when to use them:**

| Level | pino number | Use for | Example |
|---|---|---|---|
| `debug` | 20 | details while developing | "cache miss for key X" |
| `info` | 30 | normal, important events | "request done 201 in 120 ms", "job finished" |
| `warn` | 40 | odd but handled | "retrying payment provider (2/3)" |
| `error` | 50 | something failed | "could not save application" + error stack |
| `fatal` | 60 | the app must stop | "cannot connect to database at startup" |

Production usually runs at `info`. You can lower it to `debug` for a short time while investigating.

**What to log:**
- One line per request: method, route, status, duration, request ID, user or tenant ID (an id, not personal details).
- Important business events: "subscription renewed", "candidate imported".
- Every error, with its stack and enough context to reproduce it.
- Calls to outside services that fail or are slow (Stripe, an ATS), with the time taken.

**What never to log:** passwords, tokens, cookies, API keys, secrets from config, card numbers, full request bodies with personal data, and decrypted values. Use the logger's **redact** option, so a mistake can't leak them. Logs are often kept for months and read by many people, so treat them as semi-public.

**Request IDs.** Make one at the edge (or reuse an incoming `x-request-id` header), put it on a child logger, and send it on to other services. Then one search finds the full story. For Express setup, see [Logging with morgan, pino or winston](topic:express/logging).

**Structured JSON.** Tools like AWS CloudWatch Logs Insights can then query fields: `filter status >= 500 | stats count() by route`. Plain text logs only support guessing with text search.

**Cost and retention.** Logs are stored and paid for by size. Set a **retention period** (for example 7, 30 or 90 days) per log group, and don't log huge objects on every request. Keep audit logs (who changed what) separately if you must keep them longer.

**Performance.** `console.log` is synchronous in many cases and can slow a busy server. pino is built to be fast, and can send logs through a separate worker ("transport").

## 🎯 Why do we use it?

- **Debug production.** You can't attach a debugger to a live server. Logs tell you what happened.
- **Follow one request.** Request IDs connect lines across services.
- **Spot trends.** Count errors per route, or find slow endpoints.
- **Audit and security.** See who logged in, and notice brute-force attempts.

## ⚠️ Common mistakes

- **Logging secrets or personal data.** It is a real security and legal problem. Use redaction.
- **Logging everything at `info`.** Huge bills, and the important lines are lost in the noise.
- **Plain text without context.** "Error happened" with no route, user ID or stack is useless.
- **Swallowing errors.** `catch (e) {}` with no log hides the real cause forever.

## 🗣️ How to answer in an interview

> "I log structured JSON with a logger like pino, with a level on each line. Info for normal events like a finished request, warn for odd but handled cases like a retry, and error for real failures with the stack. Production runs at info.
>
> Every request gets a request ID on a child logger, so I can pull up every line for one failing request, even across services. I log the route, status, duration and user or tenant ID, but never passwords, tokens, cookies, API keys or card details. I set up redaction in the logger so a mistake can't leak them. And I keep retention and volume in mind, because logs cost money."

At SkillKeepr, you supported production services with application logging and error tracking. [FILL IN: one time logs helped you find a bug — what you searched for and what you found.]

## 🔁 Follow-up questions

### How would you find all logs for one failing request?

Search by its request ID. That's why every line should carry it, and why it should be passed to downstream services.

### What's the difference between logs, metrics and traces?

Logs are individual events with details. Metrics are numbers over time (error rate, latency). Traces follow one request across many services with timings. Together they're called "observability".

### Why not just use `console.log`?

It has no levels, no structure and no redaction, and it can be slow under load. A real logger gives JSON, levels, child loggers and redaction.

### How do you keep log costs down?

Use the right level, avoid logging huge objects, sample very noisy debug logs, and set a sensible retention period.

## ✅ Quick check

### 1. The logger level is `warn`. Which lines are printed: debug, info, warn, error?

:::answer
**warn and error.** A level shows itself and everything more serious.
:::

### 2. Which of these is safe to log?

- A) The `Authorization` header
- B) The user's password, for debugging login
- C) The route, status code and request ID

:::answer
**C.** Tokens and passwords must never be logged. Route, status and request ID are exactly what you need.
:::

### 3. Why add a request ID to every log line?

:::answer
So you can find every line that belongs to one request, even across different services.
:::
