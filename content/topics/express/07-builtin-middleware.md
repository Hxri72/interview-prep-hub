---
title: "Built-in and third-party middleware (json, cors, helmet, morgan)"
stack: express
order: 7
level: Basic
mustKnow: false
askedFrequency: common
summary:
  - "Built-in middleware comes with Express: express.json(), express.urlencoded(), express.static(), express.raw() and express.text()."
  - "Third-party middleware is installed from npm: cors (allow other websites to call your API), helmet (security headers), morgan (request logs)."
  - "A typical order: helmet → cors → body parsers → logger → routes → 404 handler → error handler."
  - "Configure them instead of using defaults blindly: for example, cors({ origin: 'https://myapp.com' }) and express.json({ limit: '1mb' })."
  - Stripe-style webhooks need the RAW body (express.raw) on that one route, because signature checks use the exact bytes.
cards:
  - q: Name the built-in middleware in Express.
    a: "express.json(), express.urlencoded(), express.static(), express.raw() and express.text()."
  - q: What does the cors package do?
    a: "It adds CORS headers (like Access-Control-Allow-Origin) so a browser allows a website on another domain to call your API."
  - q: What does helmet do?
    a: "It sets many security-related HTTP headers in one line, like Content-Security-Policy and X-Content-Type-Options, and removes X-Powered-By."
  - q: What does morgan do?
    a: "It logs each request, for example 'GET /api/students 200 4.1 ms - 52', which helps with debugging."
  - q: Why use express.raw() for a Stripe webhook route?
    a: The signature check needs the exact raw bytes of the body. express.json() parses and changes them, so the check would fail.
---

## 💡 What is it?

You don't need to write every [middleware](glossary:middleware) yourself. There are two ready-made kinds:

- **Built-in middleware** comes inside Express. Examples: `express.json()` reads JSON bodies, and `express.static()` serves files like images.
- **Third-party middleware** is a [package](glossary:package) you install from npm. The most common are **cors**, **helmet** and **morgan**.

You add them with `app.use()`, usually at the top of your app.

## 🏠 Real-life example

Think of **setting up a new shop**.

You don't build everything yourself. Some things come **with the building**: lights and a front door. Other things you **buy from experts**: a security camera, a visitor register book, and a pass system for delivery people from other companies.

- **Things that come with the building** = built-in middleware (`express.json()`, `express.static()`).
- **The security camera and strong locks** = `helmet`. It adds security headers.
- **The visitor register book** = `morgan`. It writes down every visitor.
- **The pass system for other companies' delivery people** = `cors`. It decides which other websites may call your API.
- **The order you set them up** = the order of `app.use()`. The lock goes on the door before you open the shop.

## 🧑‍💻 Code example

Set up:

```bash
npm init -y
npm install express cors helmet morgan
```

Save as `app.js`. It uses CommonJS. Run with `node app.js`.

```js
const express = require('express');                          // load Express
const cors = require('cors');                                // third-party: CORS headers
const helmet = require('helmet');                            // third-party: security headers
const morgan = require('morgan');                            // third-party: request logger

const app = express();                                       // create the app

app.use(helmet());                                           // 1. add security headers to every response
app.use(cors({ origin: 'http://localhost:5173' }));          // 2. only this website (a React dev server) may call us
app.use(express.json({ limit: '1mb' }));                     // 3. read JSON bodies up to 1 MB into req.body
app.use(morgan('dev'));                                      // 4. log every request in a short, coloured format
app.use('/files', express.static('public'));                 // 5. serve files from the "public" folder at /files

app.get('/api/hello', (req, res) => {                        // a normal route
  res.json({ message: 'hello' });                            // reply with JSON
});                                                          // end of the route

app.listen(3000, () => console.log('http://localhost:3000')); // start on port 3000
```

Ask for the response headers with `curl -i`:

```text
$ curl -i http://localhost:3000/api/hello -H "Origin: http://localhost:5173"
HTTP/1.1 200 OK
Content-Security-Policy: default-src 'self';base-uri 'self';...      ← from helmet
X-Content-Type-Options: nosniff                                       ← from helmet
Access-Control-Allow-Origin: http://localhost:5173                    ← from cors
Content-Type: application/json; charset=utf-8

{"message":"hello"}

Server terminal:
http://localhost:3000
GET /api/hello 200 2.347 ms - 19      ← from morgan: method, path, status, time, body size
```

Notice there is **no** `X-Powered-By: Express` header. Helmet removes it, so attackers learn less about your server.

## 🔍 Deeper version

**Built-in middleware in Express 5:**

| Middleware | Reads | Puts result in | Typical use |
|---|---|---|---|
| `express.json()` | `application/json` bodies | `req.body` (object) | normal APIs |
| `express.urlencoded()` | HTML form posts | `req.body` | classic web forms |
| `express.raw()` | any body, as bytes | `req.body` (a [Buffer](glossary:buffer)) | **webhooks** with signature checks |
| `express.text()` | plain text bodies | `req.body` (string) | rare |
| `express.static(dir)` | — | sends files from `dir` | images, a built React app |

Useful options: `limit` (max body size, default `'100kb'`) and `type` (which `Content-Type` to accept).

**Common third-party middleware:**

| Package | Job |
|---|---|
| `cors` | CORS headers, so browsers allow cross-site calls. See [CORS](topic:express/cors). |
| `helmet` | about a dozen security headers in one call. See [security middleware](topic:express/security-middleware). |
| `morgan` | simple request logs (`dev`, `combined` formats) |
| `pino-http` | fast, structured JSON logs for production. See [logging](topic:express/logging). |
| `cookie-parser` | fills `req.cookies` |
| `express-rate-limit` | limits requests per IP, for example on login |
| `compression` | gzip/brotli responses (often done by a proxy instead) |
| `multer` | file uploads (`multipart/form-data`). See [file uploads](topic:express/file-uploads). |

**A good order:**

```text
helmet → cors → rate limit → body parsers → cookie parser → request logger
→ auth (where needed) → routes → 404 handler → error handler
```

- Security headers and CORS go **first**, so even error responses get them.
- Body parsers go **before** the routes that need `req.body`.
- 404 and error handlers go **last**.

**The webhook exception.** Payment providers like Stripe sign each [webhook](glossary:webhook). To check the signature, you need the **exact bytes** the provider sent. `express.json()` parses the body and throws those bytes away. So mount `express.raw({ type: 'application/json' })` **only on the webhook route**, and **before** the global JSON parser, or exclude that path from it:

```js
app.post('/webhooks/stripe', express.raw({ type: 'application/json' }), stripeWebhookHandler); // raw bytes here
app.use(express.json());                                                                      // JSON for everything else
```

**CORS is a browser rule.** CORS errors happen only in browsers. Postman and curl ignore it. The fix is always on the **server** (the `cors` options), never in the frontend code.

:::version[Version note]
Since **Express 4.16**, `express.json()` and `express.urlencoded()` are built in, so you no longer need the separate `body-parser` package. In **Express 5**, `express.urlencoded()` defaults to `extended: false`, and `express.static()` ignores dotfiles (like `.env`) by default.
:::

## 🎯 Why do we use it?

- **Don't reinvent the wheel.** These packages are used by millions of apps and tested well.
- **Security in one line.** `helmet()` adds protections you might forget, like blocking your site from being shown inside another site's frame.
- **Frontend and backend on different domains.** A React app on `app.mysite.com` calling an API on `api.mysite.com` needs CORS.
- **Visibility.** Request logs are the first thing you check when something breaks.

## ⚠️ Common mistakes

- **`cors()` with no options in production.** It allows **every** website. Set `origin` to your real frontend URL(s).
- **`cors({ origin: '*', credentials: true })`.** Browsers reject this mix. If you send cookies, list exact origins.
- **Global `express.json()` before a Stripe webhook route.** Signature checks fail with "No signatures found matching the expected signature".
- **Logging bodies or headers that contain passwords or tokens.** Logs must never contain secrets.

## 🗣️ How to answer in an interview

> "Express ships with built-in middleware: express.json and express.urlencoded for parsing bodies, express.static for serving files, and express.raw and express.text for raw bodies. Everything else comes from npm. The ones I add to almost every API are helmet for security headers, cors configured with an allow-list of frontend origins, and a logger, morgan in development or pino in production.
>
> Order matters. Security headers and CORS go first, then body parsers, then logging and auth, then routes, with the 404 and error handlers last.
>
> One real-world catch is webhooks. Providers like Stripe sign the raw request body, so on the webhook route I use express.raw instead of express.json, otherwise the signature verification fails."

[FILL IN: which of these packages your Express services at SkillKeepr actually use (for example the logger), and how CORS is configured there. Only add what's true.]

## 🔁 Follow-up questions

### What exactly does helmet set?

Headers like `Content-Security-Policy` (which scripts and images may load), `Strict-Transport-Security` (always use HTTPS), `X-Content-Type-Options: nosniff`, `X-Frame-Options` / `frame-ancestors` (stops clickjacking), and `Referrer-Policy`. It also removes `X-Powered-By`.

### What is a CORS preflight request?

Before some cross-site requests (like `PUT`, `DELETE`, or JSON `POST` with custom headers), the browser first sends an `OPTIONS` request. It asks "am I allowed?". The `cors` middleware answers it with the allowed origins, methods and headers.

### morgan or pino: which would you use in production?

pino (with `pino-http`). It writes structured JSON logs, it's very fast, and log tools can search the fields. morgan is simpler and fine for development.

### Do you still need the body-parser package?

No. Since Express 4.16, `express.json()` and `express.urlencoded()` are built in. They use body-parser internally.

## ✅ Quick check

### 1. Your React app gets a CORS error calling your API. Where do you fix it?

- A) In the React code
- B) On the server, with the `cors` middleware and the right `origin`
- C) In the browser settings

:::answer
**B.** CORS is enforced by the browser, but it's **allowed by the server's response headers**. Configure `cors({ origin: 'https://your-frontend.com' })` on the API.
:::

### 2. Why does this Stripe webhook verification fail?

```js
app.use(express.json());                                          // global JSON parser first
app.post('/webhooks/stripe', express.raw({ type: 'application/json' }), handler); // raw parser too late
```

:::answer
`express.json()` runs first and already used up and parsed the body. The handler doesn't get the original raw bytes, so the signature check fails. Put the webhook route (with `express.raw`) **before** `app.use(express.json())`.
:::

### 3. Which built-in middleware serves images from a folder?

:::answer
**`express.static('folderName')`**, for example `app.use('/files', express.static('public'))`.
:::
