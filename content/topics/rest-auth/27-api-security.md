---
title: "API security: rate limiting and OWASP API Top 10"
stack: rest-auth
order: 27
level: Advanced
mustKnow: false
askedFrequency: common
summary:
  - Rate limiting caps how many requests a client can make in a time window (for example 5 logins per minute per IP). Extra requests get 429 Too Many Requests.
  - It protects against brute-force logins, scraping, runaway scripts and surprise bills, and keeps the API fair for everyone.
  - The OWASP API Security Top 10 (2023) lists the most common API risks. Number 1 is Broken Object Level Authorization — a user changing an id in the URL and seeing someone else's data.
  - Always check permissions on the server for every object and every field, validate input, limit sizes, and never trust the client.
  - With several servers, keep rate-limit counters in a shared store like Redis, and trust proxy headers only from your own load balancer.
cards:
  - q: What is rate limiting and what status code does it use?
    a: Limiting how many requests a client (IP, user or API key) can make in a time window. Requests over the limit get 429 Too Many Requests, often with a Retry-After header.
  - q: What is Broken Object Level Authorization (BOLA)?
    a: "The #1 OWASP API risk. The API checks that the user is logged in, but not that they own the object they ask for — so changing /invoices/101 to /invoices/102 shows another customer's invoice."
  - q: Name four items from the OWASP API Security Top 10 (2023).
    a: Broken Object Level Authorization, Broken Authentication, Broken Object Property Level Authorization, Unrestricted Resource Consumption, Broken Function Level Authorization, Unrestricted Access to Sensitive Business Flows, SSRF, Security Misconfiguration, Improper Inventory Management, Unsafe Consumption of APIs.
  - q: Why does rate limiting need Redis when you have several servers?
    a: Each server counts only its own requests in memory. A client spread across 4 servers could make 4× the limit. A shared store like Redis keeps one counter for everyone.
  - q: What's the difference between rate limiting and throttling?
    a: Rate limiting rejects extra requests (429). Throttling slows them down or queues them. People often use the words loosely.
---

## 💡 What is it?

**API security** means making sure only the **right people** can do the **right things** with your [API](glossary:api), and that nobody can **abuse** it.

Two big parts:

1. **Rate limiting.** Cap how many requests one client can make in a time window. For example, **5 login attempts per minute**. Extra requests get **429 Too Many Requests**.
2. **The OWASP API Security Top 10.** OWASP is a non-profit security group. Its list shows the **10 most common ways APIs get hacked**, so you know what to check.

## 🏠 Real-life example

Think of a **school library**.

- **Rate limiting** = "Each student may borrow **3 books per week**." It stops one person from emptying the shelves.
- **The library card** = authentication (who you are).
- **Checking that a book is really on *your* card before you return or renew it** = object-level authorization. Without it, a student could say "renew book #102" and change someone else's loan. That's **BOLA**, OWASP's #1 risk.
- **The staff-only room** = admin endpoints. Students shouldn't get in just by knowing the door's name (function-level authorization).
- **The librarian's checklist of common tricks** = the OWASP Top 10.
- **"Come back next week"** = the 429 reply with a `Retry-After` time.

## 🧑‍💻 Code example

Make a folder, run `npm init -y` and `npm install express express-rate-limit`. Save this as `ratelimit.js` and run `node ratelimit.js`. It allows 3 login attempts per minute, then tries 5 times.

```js
const express = require('express');                            // load Express
const { rateLimit } = require('express-rate-limit');           // load the rate-limit middleware

const app = express();                                         // create the app
const loginLimiter = rateLimit({                               // build a limiter for the login route
  windowMs: 60 * 1000,                                         // the time window: 60 seconds
  limit: 3,                                                    // at most 3 requests per IP in that window
  standardHeaders: 'draft-8',                                  // send the standard RateLimit headers
  legacyHeaders: false,                                        // don't send the old X-RateLimit-* headers
  message: { error: 'Too many login attempts. Try again later.' }, // body for blocked requests
});                                                            // end of rateLimit
app.post('/login', loginLimiter, (req, res) => res.json({ ok: true })); // only /login is limited

const server = app.listen(3107, async () => {                  // start on port 3107
  for (let i = 1; i <= 5; i++) {                               // try to log in 5 times quickly
    const res = await fetch('http://localhost:3107/login', { method: 'POST' }); // one attempt
    console.log(`attempt ${i}:`, res.status);                  // 200 or 429
  }                                                            // end of the loop
  server.close();                                              // stop the server
});                                                            // end of listen
```

**Output:**

```text
attempt 1: 200
attempt 2: 200
attempt 3: 200
attempt 4: 429
attempt 5: 429
```

## 🔍 Deeper version

**Rate-limiting details:**
- **What to count by:** IP for public routes, user id for logged-in routes, API key for partners. Logins are often limited by IP **and** by account. That stops one attacker hitting many accounts, and many IPs hitting one account.
- **Algorithms:**
  - **Fixed window**: simple, but allows bursts at the window edges.
  - **Sliding window**: smoother.
  - **Token bucket**: allows short bursts, then a steady rate.
- **Shared store:** with several servers or containers, keep counters in **Redis** (for example `rate-limit-redis`). Otherwise each server has its own count.
- **Behind a proxy or load balancer:** set Express's `app.set('trust proxy', 1)` so `req.ip` is the real client. Trust only your **own** proxy. Otherwise attackers fake the `X-Forwarded-For` header to dodge limits.
- **Layers:** limits at the edge (API gateway, CDN or WAF) stop floods before they reach Node. App-level limits handle per-user business rules.
- **Headers:** `429` with `Retry-After` and the `RateLimit-*` headers, so well-behaved clients know when to slow down.

**OWASP API Security Top 10 (2023), in plain words:**

| # | Risk | Simple meaning | Main defence |
|---|---|---|---|
| API1 | Broken Object Level Authorization | Changing an id shows someone else's data | Check ownership of **every** object on the server |
| API2 | Broken Authentication | Weak login, tokens never expire, no brute-force protection | Strong hashing, short-lived tokens, rate limits, MFA |
| API3 | Broken Object Property Level Authorization | Returning or accepting fields the user shouldn't see or set (like `isAdmin`) | Allow-list fields in responses; validate inputs (no mass assignment) |
| API4 | Unrestricted Resource Consumption | No limits on requests, page size, upload size or costly operations | Rate limits, max page size, body size limits, timeouts |
| API5 | Broken Function Level Authorization | A normal user can call admin endpoints | Role checks on every route (see [RBAC](topic:rest-auth/rbac)) |
| API6 | Unrestricted Access to Sensitive Business Flows | Bots abusing a valid flow (mass sign-ups, buying all tickets) | Business-level limits, CAPTCHA, bot detection |
| API7 | Server Side Request Forgery (SSRF) | Your server fetches a URL the attacker gives it, even internal ones | Allow-list hosts, block internal IPs |
| API8 | Security Misconfiguration | Debug mode, open CORS, missing security headers, stack traces in errors | Secure defaults, [helmet](topic:express/security-middleware), tidy error replies |
| API9 | Improper Inventory Management | Old, forgotten API versions or test servers still running | Keep a list of all APIs and versions; retire old ones |
| API10 | Unsafe Consumption of APIs | Trusting data from third-party APIs blindly | Validate and limit what you receive from other services too |

**BOLA in code. The most common real bug:**

```js
// ❌ Logged in? Yes. But is this invoice theirs? Not checked.
app.get('/invoices/:id', auth, async (req, res) => {
  res.json(await Invoice.findById(req.params.id));
});

// ✅ Only find invoices that belong to the logged-in user's company
app.get('/invoices/:id', auth, async (req, res) => {
  const invoice = await Invoice.findOne({ _id: req.params.id, companyId: req.user.companyId });
  if (!invoice) return res.status(404).json({ error: 'Not found' }); // 404 hides whether it exists
  res.json(invoice);
});
```

**Other must-haves:**
- **Validate every input** (type, length, format) with a schema (see [validation](topic:express/validation)), and cap body sizes.
- **Never build queries from raw input.** Watch for NoSQL injection, like `{ "$ne": null }` (see [NoSQL injection](topic:mongodb/nosql-injection)).
- **HTTPS everywhere**, secrets in environment variables, and dependencies kept up to date (`npm audit`).
- **Log security events** (failed logins, 403s, 429s), and alert on spikes.

## 🎯 Why do we use it?

- **Stop brute-force attacks** on logins and OTPs.
- **Protect data.** BOLA-style bugs are the top cause of API data leaks.
- **Keep the service up and costs down.** One runaway script shouldn't slow down every customer or run up the cloud bill.
- **Fairness.** Every customer gets a fair share of the API.
- **Trust and compliance.** Customers and auditors expect these basics.

## ⚠️ Common mistakes

- **Checking "logged in" but not "owns this object"** (BOLA).
- **Returning whole database documents,** including fields like `passwordHash` or internal flags.
- **In-memory rate limits on many servers,** which makes the real limit much higher than planned.
- **`trust proxy` set wrongly,** so every request looks like it came from the load balancer's IP. Or the opposite: attackers can fake their IP.
- **Old API versions left running** with weaker security.

## 🗣️ How to answer in an interview

> "For API security I think in layers. First, rate limiting: I cap requests per IP, user or API key, and return 429 with Retry-After. Login and OTP routes get strict limits. With several instances, the counters go in Redis, and I set trust proxy correctly so I limit the real client IP.
>
> Second, I use the OWASP API Security Top 10 as a checklist. The biggest one is Broken Object Level Authorization. Being logged in isn't enough, so every query is scoped to what the user owns, and I return 404 otherwise. I also allow-list the fields I return and accept, check roles on admin routes, validate all input with a schema, set body and page-size limits, use helmet and strict CORS, and don't leak stack traces. Finally, I log failed logins, 403s and 429s so we can spot attacks."

[FILL IN: a real security measure you added or reviewed in a backend you worked on. Only add it if it's true.]

## 🔁 Follow-up questions

### How would you protect a login endpoint from brute force?

Rate-limit by IP **and** by account, add increasing delays or a temporary lock after repeated failures, show a CAPTCHA after a few failures, use MFA for sensitive accounts, and alert on spikes. See [login brute force](topic:debugging/login-brute-force).

### Why return 404 instead of 403 when a user asks for someone else's object?

A 403 confirms the object exists. A 404 reveals nothing, so attackers can't use the API to discover which ids are real.

### Where should rate limiting live: the API gateway or the app?

Both. The edge (gateway, CDN or WAF) blocks floods cheaply before they reach your servers. The app applies smarter rules per user, plan or endpoint.

### What is mass assignment?

Copying the whole request body into a database update, like `User.updateOne({ _id }, req.body)`. An attacker can then set fields like `role: 'admin'`. Always pick allowed fields explicitly.

## ✅ Quick check

### 1. What status code means "too many requests"?

:::answer
**429 Too Many Requests**, usually with a `Retry-After` header saying when to try again.
:::

### 2. A logged-in user changes `/orders/500` to `/orders/501` and sees another customer's order. Which OWASP API risk is this?

- A) Security Misconfiguration
- B) Broken Object Level Authorization
- C) Improper Inventory Management

:::answer
**B.** The API checked that the user was logged in, but not that the order belonged to them. Scope every query by owner or company.
:::

### 3. Your API runs on 3 servers, each with an in-memory limit of 100 requests per minute. A client spreads requests across all 3. How many can they really make?

:::answer
Up to **300 per minute**. Each server counts separately. Use a shared store like Redis for one global counter.
:::
