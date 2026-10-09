---
title: "Security middleware: helmet, rate limiting, sanitising"
stack: express
order: 15
level: Intermediate
mustKnow: true
askedFrequency: very common
summary:
  - helmet sets safe HTTP response headers in one line (no X-Powered-By, Content-Security-Policy, HSTS, nosniff and more).
  - Rate limiting (express-rate-limit) caps how many requests one client can make in a time window — vital for login, OTP and password-reset routes.
  - Sanitising and validating input stops injection — for MongoDB, never let user objects like {"$ne": null} reach a query. Validate types with Zod/Joi and use Mongoose sanitizeFilter.
  - Also limit body size, set CORS properly, keep secrets in env vars, use HTTPS, and keep npm packages updated (npm audit).
  - Middleware is only one layer. Real security also needs proper auth, authorization checks on every route, and safe logging.
cards:
  - q: What does helmet do?
    a: It sets security-related HTTP response headers, like Content-Security-Policy, Strict-Transport-Security and X-Content-Type-Options, and removes X-Powered-By.
  - q: Why rate-limit a login route?
    a: To stop brute-force attacks, where a bot tries thousands of passwords. A small limit per IP (and per account) makes guessing too slow to work.
  - q: What is NoSQL injection in MongoDB?
    a: "The attacker sends an object instead of a string, like {\"password\": {\"$ne\": null}}. If you pass it straight into a query, it can match any record. Validate types and use sanitizeFilter."
  - q: Why set app.set('trust proxy', 1) with a rate limiter?
    a: Behind a load balancer or proxy, every request seems to come from the proxy's IP. trust proxy tells Express to read the real client IP from X-Forwarded-For.
  - q: Does express-mongo-sanitize work with Express 5?
    a: Not as-is. It tries to replace req.query, which is read-only (a getter) in Express 5. Use schema validation and Mongoose's sanitizeFilter instead, or sanitise the body and params yourself.
---

## 💡 What is it?

**Security middleware** is a set of small [middlewares](glossary:middleware) that protect your Express app from common attacks.

Three of the most important ones:
- **helmet**: adds safe **headers** to every reply. Headers are small notes that tell the browser how to behave.
- **rate limiting**: stops one client from sending too many requests, for example a bot guessing passwords.
- **sanitising and validating**: cleans and checks user input, so it can't trick your database.

They are quick to add, and they block many simple attacks.

## 🏠 Real-life example

Think of **security at a school**.

- **Notice boards with rules** at every door: "No outsiders", "Visitors must sign in". That's **helmet**. It puts safety instructions on every response, for the browser to follow.
- A **guard who counts visitors**: "Only 5 entries per person per hour". Someone trying to enter 1,000 times is stopped. That's **rate limiting**.
- **Checking bags** at the gate for dangerous things. That's **sanitising and validation**. Nothing harmful gets inside.
- A **size limit on parcels**: no truck-sized boxes at the small gate. That's the **body size limit**.

Each one stops a different problem. Together they make the school much safer, but you still need teachers watching inside (auth and authorization).

## 🧑‍💻 Code example

Make a folder, run `npm init -y` and `npm install express helmet express-rate-limit`. Save this as `app.js`. Run it with `node app.js`.

```js
const express = require('express');                                  // load Express
const helmet = require('helmet');                                    // safe HTTP headers
const { rateLimit } = require('express-rate-limit');                 // the rate limiter
const app = express();                                               // create the app

app.set('trust proxy', 1);                                           // behind 1 proxy (e.g. a load balancer): read the real client IP
app.use(helmet());                                                   // add security headers, remove X-Powered-By
app.use(express.json({ limit: '10kb' }));                            // refuse JSON bodies bigger than 10 KB

const loginLimiter = rateLimit({                                     // a strict limiter just for login
  windowMs: 15 * 60 * 1000,                                          // the time window: 15 minutes (in ms)
  limit: 5,                                                          // at most 5 requests per IP in that window
  standardHeaders: 'draft-8',                                        // send the standard RateLimit headers
  legacyHeaders: false,                                              // don't send the old X-RateLimit-* headers
  message: { message: 'Too many login attempts. Try again later.' }, // the reply body after the limit
});                                                                  // end of loginLimiter

app.post('/login', loginLimiter, (req, res) => {                     // the limiter runs before the route
  const { email, password } = req.body;                              // read the login data
  if (typeof email !== 'string' || typeof password !== 'string') {   // block objects like {"$ne": null}
    return res.status(400).json({ message: 'Invalid input' });       // 400 = bad request
  }                                                                  // end of the type check
  res.json({ message: `Pretend we checked ${email}` });              // a real app would check the password here
});                                                                  // end of the route

app.listen(3000, () => console.log('Running on port 3000'));          // start the server on port 3000
```

```text
$ curl -i localhost:3000/login -H "Content-Type: application/json" -d '{"email":"a@b.com","password":"x"}'
HTTP/1.1 200 OK
Content-Security-Policy: default-src 'self';...       ← from helmet
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Content-Type-Options: nosniff
RateLimit: "5-in-15min"; r=4; t=900                    ← from the rate limiter; r = requests left
RateLimit-Policy: "5-in-15min"; q=5; w=900; pk=...
...                                                    (no X-Powered-By: Express)

(the 6th request within 15 minutes)
HTTP/1.1 429 Too Many Requests
{"message":"Too many login attempts. Try again later."}

$ curl localhost:3000/login -H "Content-Type: application/json" -d '{"email":{"$ne":null},"password":"x"}'
{"message":"Invalid input"}                            ← 400, the injection object is blocked
```

## 🔍 Deeper version

**helmet: what the headers do.**

| Header | What it protects against |
|---|---|
| `Content-Security-Policy` | Limits where scripts, styles and images can load from. A strong defence against **XSS** (attackers running their own script on your page). |
| `Strict-Transport-Security` (HSTS) | Tells the browser "always use HTTPS for this site". |
| `X-Content-Type-Options: nosniff` | Stops the browser from guessing file types (a file upload trick). |
| `X-Frame-Options` / CSP `frame-ancestors` | Stops your site from being shown inside another site's frame (**clickjacking**). |
| `Referrer-Policy` | Controls how much of your URL is sent to other sites. |
| removes `X-Powered-By` | Hides that you use Express, so attackers know less. |

For a pure JSON API, most of these matter less, but they are cheap and safe. For a server that also serves HTML, the CSP needs tuning so your own scripts still load.

**Rate limiting in production.**
- Use **stricter limits** on sensitive routes: login, OTP, password reset, sign-up. Use looser limits for normal API routes.
- By default the counts are stored **in memory**. With several servers or [PM2 cluster](topic:nodejs/cluster-and-pm2) workers, each one counts separately. Use a shared store, like **Redis** (`rate-limit-redis`).
- Behind a proxy or load balancer, set **`trust proxy`** correctly. If you set it wrong, all users share one IP (everyone gets blocked), or attackers can fake the `X-Forwarded-For` header.
- Limit by **IP and by account** for login, so attackers can't just switch IPs.
- Reply with **429 Too Many Requests**, and include a `Retry-After` header.

**Sanitising and NoSQL injection.** `express.json()` can turn the body into **objects**, not just strings. Say the body is `{"email": "admin@x.com", "password": {"$ne": null}}`, and you write `User.findOne(req.body)`. MongoDB reads `$ne` as an operator ("not equal to null"). That matches the admin's password, and the attacker logs in.

Defences:
1. **Validate types** with a schema (see [validation](topic:express/validation)). "password must be a string" rejects the object.
2. Use Mongoose's **`sanitizeFilter`** option (Mongoose 6+), or wrap values with `mongoose.trusted()` only when you really mean an operator. It strips keys starting with `$` from query filters.
3. **Never pass `req.body` straight into a query** or an update. Pick the fields you need.

:::version[Express 5 note]
The old `express-mongo-sanitize` package replaces `req.query`. In **Express 5**, `req.query` is a read-only getter, so that package throws an error. Prefer schema validation plus Mongoose `sanitizeFilter`. Or sanitise `req.body` and `req.params` yourself.
:::

**XSS and HTML.** If you return user content that will be shown as HTML, escape it. Don't trust "sanitising" alone. React escapes text by default. Be careful with `dangerouslySetInnerHTML` and with server-rendered templates.

**Other important layers:**
- Body size limits (`express.json({ limit })`). The default is 100 KB.
- A strict [CORS](topic:express/cors) allow-list.
- Secrets only in [environment variables](topic:nodejs/environment-variables), never in code or logs.
- HTTPS everywhere, and secure cookies (`HttpOnly`, `Secure`, `SameSite`).
- `npm audit` and Dependabot to update packages with known holes. See [Node security basics](topic:nodejs/security-basics).
- **Authorization on every route.** Middleware can't stop a logged-in user from reading someone else's record. Your query must check ownership or the tenant.

## 🎯 Why do we use it?

- **Cheap protection.** A few lines block many automated attacks that scan the internet all day.
- **Stops brute force and abuse.** Rate limits protect login and OTP routes, and also save money on paid APIs like SMS and email.
- **Protects the database.** Validation stops injection and mass-assignment tricks.
- **Required by clients.** Security reviews and audits often check these exact headers and limits.

## ⚠️ Common mistakes

- **Thinking helmet = secure.** It only sets headers. Auth, authorization and input checks are still your job.
- **In-memory rate limits with many servers.** Each server counts on its own, so the real limit is much higher than you think.
- **Wrong `trust proxy` setting.** Either everyone is blocked together, or attackers can fake their IP.
- **Passing `req.body` straight into Mongo queries or updates.** This opens the door to operator injection and mass assignment (for example `"role": "admin"`).

## 🗣️ How to answer in an interview

> "For Express I add a few security layers. helmet sets safe response headers, like Content-Security-Policy, HSTS and nosniff, and removes X-Powered-By. express-rate-limit protects sensitive routes like login and OTP from brute force. In production with multiple instances, I'd store the counts in Redis and set trust proxy correctly so we see the real client IP. I limit body size with express.json limit.
>
> For input, I validate every request with a schema, so types are enforced. For MongoDB that blocks NoSQL injection, where someone sends an object like dollar-ne null instead of a string. I also use Mongoose's sanitizeFilter and never pass req.body straight into a query. On top of that: a strict CORS allow-list, secrets in environment variables, HTTPS, npm audit, and authorization checks on every route. Middleware alone isn't enough."

[FILL IN: which of these were set up in the SkillKeepr Express services (helmet, rate limiting, CORS, validation), and anything specific you added. Only add what's true.]

## 🔁 Follow-up questions

### What attacks does rate limiting help with?

Brute-force password guessing, OTP guessing, credential stuffing (trying leaked passwords), scraping, and simple denial-of-service from one source. It also protects paid services, like SMS sending, from abuse.

### How would you rate-limit across 4 servers?

Use a shared store, like Redis, so every server reads and updates the same counters. With an in-memory store, each server has its own counter, so a client could make four times the limit.

### Explain NoSQL injection with an example.

A login query uses `User.findOne({ email, password: req.body.password })`. An attacker sends `"password": {"$ne": null}`. MongoDB reads it as "password not equal to null", which matches the user. Fix it by validating that password is a string, comparing hashed passwords with bcrypt, and using `sanitizeFilter`.

### What is Content-Security-Policy?

A header that tells the browser which sources of scripts, styles, images and frames are allowed. If an attacker injects a `<script>` from their own site, the browser refuses to run it. It's one of the strongest defences against XSS.

## ✅ Quick check

### 1. Which middleware stops a bot from trying 10,000 passwords in a minute?

- A) helmet
- B) express-rate-limit
- C) express.json()

:::answer
**B) express-rate-limit.** It caps the number of requests per client in a time window and replies with 429 after that.
:::

### 2. What is the risk in this line? `const user = await User.findOne(req.body);`

:::answer
**NoSQL injection and unexpected filters.** The body can contain objects with Mongo operators like `{"$ne": null}`, or extra fields. Validate the input, pick only the fields you need, and use `sanitizeFilter`.
:::

### 3. True or false: you run 3 servers with the default in-memory rate limiter set to 5 logins per 15 minutes. An attacker can still try about 15 logins.

:::answer
**True.** Each server keeps its own counter. A load balancer spreads the requests, so the real limit is about 5 × 3. Use a shared store like Redis.
:::
