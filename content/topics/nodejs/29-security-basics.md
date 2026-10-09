---
title: Security basics for Node apps
stack: nodejs
order: 29
level: Intermediate
mustKnow: false
askedFrequency: common
summary:
  - Never trust user input. Validate every request body, query and param (Zod or Joi) and reject anything unexpected.
  - Prevent injection — parameterised SQL queries, and block MongoDB operators like $gt or $where coming from user input.
  - Keep secrets in environment variables or a secret manager, never in code or Git. Never log passwords or tokens.
  - "Use helmet (security headers), a strict CORS list, rate limiting, HTTPS, and bcrypt for passwords."
  - Keep dependencies updated (npm audit, Dependabot) and avoid running user input through eval, child_process or unsafe regexes.
cards:
  - q: How do you prevent NoSQL injection in a Node + MongoDB app?
    a: Validate input types with a schema (Zod/Joi) so a field like email must be a string, and strip or reject keys starting with $. Never pass req.body straight into a query.
  - q: What does helmet do?
    a: It sets security-related HTTP headers, like Content-Security-Policy and X-Content-Type-Options, to protect against common browser attacks.
  - q: Where should secrets live?
    a: In environment variables or a secret manager (AWS Secrets Manager, GCP Secret Manager). Never in code, never in Git, never in logs.
  - q: What is a ReDoS attack?
    a: A slow regular expression on long user input blocks the single Node thread, so the whole server stops responding.
  - q: How do you keep npm dependencies safe?
    a: Run npm audit, use Dependabot or similar, keep the lock file committed, update regularly and avoid unknown packages.
---

## 💡 What is it?

**Security** means stopping people from misusing your app. For example, stealing data, logging in as someone else, or crashing your server.

In a Node app, most attacks come through **user input**. That's anything sent in a request: the body, the URL, headers or uploaded files.

The basic rule is simple: **never trust input**. Check it, limit it, and keep your secrets secret.

## 🏠 Real-life example

Think of a **school with a security guard at the gate**.

- The guard **checks ID cards**. People without a card don't get in.
- The guard **checks bags**. Nobody brings in dangerous things.
- The guard **limits visitors**. One person can't bring 500 friends at once.
- The **staff room key** is kept safe. It is not written on the notice board.
- The **locks are replaced** when an old lock is found to be weak.

Here's how this maps to a Node app:
- **Checking ID cards** = authentication (JWT, sessions).
- **Checking bags** = validating input.
- **Limiting visitors** = rate limiting.
- **The staff room key** = secrets like API keys and the database password.
- **Replacing weak locks** = updating npm packages with known security problems.

## 🧑‍💻 Code example

Make a folder, run `npm init -y`, then `npm install express helmet express-rate-limit zod`. Save this as `secure.js`. Run it with `node secure.js`.

```js
const express = require('express');                         // the web framework
const helmet = require('helmet');                            // adds safe HTTP headers
const rateLimit = require('express-rate-limit');             // limits how many requests one user can send
const { z } = require('zod');                                // a library to check the shape of data

const app = express();                                       // create the app
app.use(helmet());                                           // turn on the safe headers for every response
app.use(express.json({ limit: '10kb' }));                    // read JSON bodies, but reject bodies bigger than 10 KB

const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 5 }); // 5 tries per 15 minutes per IP address

const LoginSchema = z.object({                               // the only shape we accept for login
  email: z.string().email(),                                 // email must be a real email STRING (not an object)
  password: z.string().min(8).max(100),                      // password must be a string, 8 to 100 characters
});                                                          // end of the schema

app.post('/login', loginLimiter, (req, res) => {             // the login route, protected by the rate limiter
  const parsed = LoginSchema.safeParse(req.body);            // check the body against the schema
  if (!parsed.success) return res.status(400).json({ error: 'Invalid input' }); // 400 = bad request
  const { email } = parsed.data;                             // use ONLY the checked data from now on
  res.json({ message: `Checking login for ${email}` });      // (real code would check the password with bcrypt)
});                                                          // end of the route

app.listen(3000, () => console.log('Listening on 3000'));    // start the server on port 3000
```

**Try an attack.** Send `{"email": {"$gt": ""}, "password": "anything123"}`. Zod rejects it because `email` is an object, not a string.

```text
POST /login  {"email": {"$gt": ""}, ...}   →  400 {"error":"Invalid input"}
6th POST /login within 15 minutes          →  429 Too Many Requests
```

## 🔍 Deeper version

**1. Injection.** This is when user input becomes part of a command or query.
- **SQL:** never build queries with string joining. Use parameters: `pool.query('SELECT * FROM users WHERE email = $1', [email])`.
- **NoSQL (MongoDB):** if `req.body.email` is `{ "$gt": "" }`, then `User.findOne({ email })` matches the first user! Validate types. Mongoose's `sanitizeFilter` option, or `express-mongo-sanitize`, can strip `$` keys.
- **Command injection:** never pass user input to `child_process.exec`. Use `execFile` with an argument list instead.
- **Never use `eval` or `new Function`** on input.

**2. Authentication and passwords.**
- Hash passwords with **bcrypt** (or argon2). Never store plain text.
- Short-lived access tokens. Store refresh tokens in **httpOnly cookies**, which JavaScript can't read.
- Use the same error message for "wrong email" and "wrong password", so attackers can't find valid emails.

**3. Authorisation.** Check *what* the user may do on **every** request, not just in the UI. In a [multi-tenant](glossary:multi-tenant) app, every query must include the tenant ID. Otherwise, one company can see another company's data.

**4. HTTP layer.**
- **helmet:** sets headers like `Content-Security-Policy`, `X-Content-Type-Options: nosniff` and `Strict-Transport-Security`.
- **CORS:** allow only your own frontend origins. Never use `*` together with credentials.
- **Rate limiting:** on login, signup, password reset and expensive endpoints.
- **Body size limits** and file upload limits (type and size).
- **HTTPS everywhere.**

**5. Denial of service on one thread.** Node has one main thread, so one slow operation hurts everyone.
- **ReDoS:** a badly written regex like `/(a+)+$/` on long input can take minutes.
- Huge JSON bodies and giant uploads use up memory.
- Set limits, and use timeouts on outgoing calls.

**6. Secrets and logs.**
- Secrets go in [environment variables](topic:nodejs/environment-variables) or a secret manager. Add `.env` to `.gitignore`.
- Never log passwords, tokens, card details or full personal data.
- Error responses in production should not show stack traces.

**7. Dependencies (the supply chain).** Most of your code comes from npm packages.
- Run `npm audit` and use Dependabot or Renovate.
- Commit `package-lock.json`, and use `npm ci` in CI.
- Be careful with new or unknown packages. Typosquatting (fake packages with names like `expresss`) is real.

The **OWASP Top 10** (and OWASP API Security Top 10) is the standard list of the most common web risks. It's worth reading once.

:::version[Version note]
`express-rate-limit` renamed its `max` option to `limit` in version 7. Older tutorials use `max`. Both work in v7, but `limit` is the current name.
:::

## 🎯 Why do we use it?

One security hole can leak every user's data, cost money (stolen API keys) and destroy trust in the company. For a platform that stores candidate and recruiter data, a leak is also a legal problem.

Most attacks are not clever. They try the same simple tricks on thousands of sites. These basics stop almost all of them.

## ⚠️ Common mistakes

- **Passing `req.body` straight into a database query** (`User.findOne(req.body)`). This allows NoSQL injection.
- **Committing `.env` files or API keys to Git.** Bots scan GitHub for keys within minutes.
- **Checking permissions only in the frontend.** Anyone can call your API directly with Postman.
- **`cors({ origin: '*', credentials: true })`.** This is either broken or unsafe. List the exact origins.

## 🗣️ How to answer in an interview

> "My starting rule is: never trust input. I validate every body, query and param with a schema, like Zod or Joi, so types are enforced. That also blocks NoSQL injection, where someone sends an object like $gt instead of a string. For SQL, I always use parameterised queries.
>
> For the HTTP layer, I use helmet for security headers, a strict CORS allow-list, rate limiting on login and other sensitive routes, body size limits and HTTPS. Passwords are hashed with bcrypt, and tokens are short-lived.
>
> Authorisation is checked on the server for every request. In a multi-tenant app, every query is scoped by tenant ID. Secrets live in environment variables or a secret manager, never in Git or logs. And I keep dependencies updated with npm audit and automated update PRs."

[FILL IN: one real security practice from SkillKeepr — e.g. how tenant isolation or Stripe webhook verification was done. Only add what is true.]

## 🔁 Follow-up questions

### How exactly does NoSQL injection work?

Say your login code runs `User.findOne({ email: req.body.email, password: ... })`. An attacker sends `{"email": {"$ne": null}}`. MongoDB reads `$ne` as "not equal to null", which matches any user. The fix is to check that `email` is a string before using it.

### Where do you store JWTs on the frontend?

An httpOnly, Secure, SameSite cookie is safest against XSS, because JavaScript can't read it. localStorage is easier, but any XSS bug can steal the token. If you use cookies, also protect against CSRF (SameSite plus a CSRF token for unsafe methods).

### How do you protect against brute-force login attempts?

Rate limit by IP and by account. Add a delay or a temporary lock after several failures. Show a CAPTCHA after repeated failures, and alert on unusual spikes.

### What is the OWASP Top 10?

A list of the most common and serious web security risks, published by OWASP. Examples are broken access control, injection and security misconfiguration. There is also a separate list just for APIs.

## ✅ Quick check

### 1. Is this code safe?

```js
const user = await User.findOne({ email: req.body.email }); // find the user by email
```

- A) Yes, Mongoose escapes everything
- B) No — if `email` is an object like `{"$gt": ""}`, it can match any user

:::answer
**B.** Validate that `email` is a string first (for example with Zod), or sanitise `$` keys.
:::

### 2. Where should your Stripe secret key be stored?

:::answer
In an environment variable or a secret manager. Never in the code, never in Git, never in the frontend, and never in logs.
:::

### 3. Why is a slow regex dangerous in Node specifically?

:::answer
Node runs your JavaScript on one main thread. A regex that takes seconds on bad input blocks that thread, so **every** user's request waits.
:::
