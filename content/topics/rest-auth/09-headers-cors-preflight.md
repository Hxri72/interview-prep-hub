---
title: Headers, content types and the CORS preflight
stack: rest-auth
order: 9
level: Intermediate
mustKnow: false
askedFrequency: common
summary:
  - "Headers are extra labels on every request and response: who you are (Authorization, Cookie), what you send (Content-Type), what you want back (Accept), and caching rules."
  - "Content-Type says what the body is: application/json, multipart/form-data for file uploads, text/html…"
  - CORS is a browser rule. A page from one origin can only read responses from another origin if the server allows it with Access-Control-* headers.
  - For "non-simple" requests (PATCH, DELETE, JSON bodies, an Authorization header), the browser first sends an automatic OPTIONS request, called the preflight.
  - CORS is fixed on the server. Postman and curl ignore it, which is why a request "works in Postman but not in the browser".
cards:
  - q: What is the difference between Content-Type and Accept?
    a: Content-Type describes the body you are SENDING. Accept says what format you WANT back.
  - q: What is a CORS preflight?
    a: An automatic OPTIONS request the browser sends before a "non-simple" cross-origin request. It asks the server which origins, methods and headers are allowed.
  - q: Which requests trigger a preflight?
    a: "Anything not \"simple\": methods like PUT, PATCH or DELETE, a Content-Type of application/json, or custom headers like Authorization."
  - q: Why does an API work in Postman but fail in the browser with a CORS error?
    a: CORS is enforced only by browsers. Postman and curl don't check Access-Control-* headers, so the server must send the right ones for the browser.
  - q: Can you use Access-Control-Allow-Origin * with cookies?
    a: No. With credentials, the server must name the exact origin and send Access-Control-Allow-Credentials true.
---

## 💡 What is it?

**Headers** are small labels on every HTTP request and response. They carry information **about** the message:

- `Authorization: Bearer <token>` → who you are
- `Content-Type: application/json` → what the body is
- `Accept: application/json` → what you want back
- `Cache-Control: no-store` → caching rules

**CORS** (Cross-Origin Resource Sharing) is a **browser safety rule**. A page from `https://app.example.com` can call `https://api.example.com` **only if the API allows it**, using `Access-Control-*` headers.

For some requests, the browser first sends a test request called the **preflight** (`OPTIONS`) to ask permission.

## 🏠 Real-life example

Think of **sending a parcel to another school**.

- The **labels on the box** = headers: "From: Class 10-B", "Contains: books", "Fragile".
- **"Contains: books"** = `Content-Type`. It tells the receiver what's inside.
- **"Please reply in English"** = `Accept`.

Now **CORS**. Your school guard (the browser) won't hand you a reply from another school unless that school says, "Yes, we accept parcels from your school."

- **Before sending a big or unusual parcel**, the guard **phones the other school first**: "Will you accept a heavy parcel from Class 10-B?" That phone call is the **preflight**.
- If the other school says no (or doesn't answer properly), the guard **blocks** it.
- A courier company (Postman or curl) doesn't have that guard, so it delivers anyway.

## 🧑‍💻 Code example

An API that allows one website, with cookies, using the `cors` package. Run `npm init -y` and `npm install express cors`. Save as `preflight.js` and run `node preflight.js`. (CommonJS, Express 5.)

```js
const express = require('express');                                   // load Express
const cors = require('cors');                                         // the cors middleware package
const app = express();                                                // create the app

app.use(cors({                                                        // turn on CORS with these rules
  origin: 'https://app.example.com',                                  // only this website may call us
  methods: ['GET', 'POST', 'PATCH'],                                  // the methods it may use
  allowedHeaders: ['Content-Type', 'Authorization'],                  // the headers it may send
  credentials: true,                                                  // allow cookies to be sent along
  maxAge: 600,                                                        // browser may cache the preflight for 600 s (10 min)
}));                                                                  // end of CORS rules
app.use(express.json());                                              // parse JSON bodies

app.patch('/jobs/:id', (req, res) => {                                // a normal PATCH route
  res.json({ id: req.params.id, ...req.body });                       // echo back what was changed
});                                                                   // end of route

app.listen(3000, () => console.log('listening on 3000'));             // start on port 3000
```

Now we pretend to be the browser and send the preflight with `curl`:

```text
$ curl -i -X OPTIONS localhost:3000/jobs/5 \
    -H 'Origin: https://app.example.com' \
    -H 'Access-Control-Request-Method: PATCH' \
    -H 'Access-Control-Request-Headers: content-type'
HTTP/1.1 204 No Content
Access-Control-Allow-Origin: https://app.example.com
Vary: Origin
Access-Control-Allow-Credentials: true
Access-Control-Allow-Methods: GET,POST,PATCH
Access-Control-Allow-Headers: Content-Type,Authorization
Access-Control-Max-Age: 600

$ curl -i -X OPTIONS localhost:3000/jobs/5 \
    -H 'Origin: https://evil.example' -H 'Access-Control-Request-Method: PATCH'
HTTP/1.1 204 No Content
Access-Control-Allow-Origin: https://app.example.com
...
```

**What to notice:** the second answer allows `https://app.example.com`, **not** `https://evil.example`. The server still replies, but the **browser** compares the origins. They don't match, so it blocks the real request. **The browser enforces CORS, not the server.**

## 🔍 Deeper version

**Headers you should know**

| Header | Direction | Meaning |
|---|---|---|
| `Content-Type` | both | Format of the body: `application/json`, `multipart/form-data` (file uploads), `application/x-www-form-urlencoded` (HTML forms) |
| `Accept` | request | Formats the client wants back |
| `Authorization` | request | Credentials, like `Bearer <JWT>` |
| `Cookie` / `Set-Cookie` | request / response | Session or token cookies |
| `Cache-Control`, `ETag`, `If-None-Match` | both | Caching and 304 responses |
| `Location` | response | URL of the new resource after 201, or the target of a redirect |
| `Retry-After` | response | How long to wait after a 429 or 503 |
| `X-Request-Id` | both | A request id for tracing logs. See [Logging](topic:express/logging). |

**Simple vs preflighted requests.** A cross-origin request is "simple" (no preflight) only if:
- the method is `GET`, `HEAD` or `POST`, **and**
- the only custom headers are basic ones, **and**
- the `Content-Type` is `text/plain`, `multipart/form-data` or `application/x-www-form-urlencoded`.

So **sending JSON**, using **PATCH/PUT/DELETE**, or adding an **`Authorization` header** all trigger a preflight.

**The preflight conversation**

```text
Browser → OPTIONS /jobs/5
          Origin: https://app.example.com
          Access-Control-Request-Method: PATCH
          Access-Control-Request-Headers: content-type

Server  → 204
          Access-Control-Allow-Origin: https://app.example.com
          Access-Control-Allow-Methods: GET,POST,PATCH
          Access-Control-Allow-Headers: Content-Type,Authorization
          Access-Control-Max-Age: 600

Browser → (allowed) sends the real PATCH request
```

**Cookies and CORS.** To send cookies cross-origin:
- The frontend uses `fetch(url, { credentials: 'include' })`.
- The server sends `Access-Control-Allow-Credentials: true` **and** the exact origin. **`*` is not allowed with credentials.**
- Also check the cookie's `SameSite` and `Secure` settings. SkillKeepr's frontend, for example, sends its HttpOnly JWT cookies with `credentials: 'include'`, so the API must allow its exact origin.

**Many allowed origins.** Pass an array or a function to `cors({ origin })`. The middleware then echoes the matching origin and adds `Vary: Origin`, so caches don't mix answers for different sites.

**Cost of preflights.** Each one is an extra round trip. `Access-Control-Max-Age` lets the browser cache the answer (browsers cap it, for example Chrome at 2 hours). On serverless backends like API Gateway + Lambda, preflights also cost invocations.

For Express setup details, see [CORS in Express](topic:express/cors). For debugging steps, see [CORS error](topic:debugging/cors-error).

## 🎯 Why do we use it?

- **Headers** let the client and server agree on format, identity and caching without mixing that into the body.
- **CORS protects users.** Without it, any website you visit could read your data from other sites where you're logged in.
- **The preflight protects old servers** that never expected PATCH/DELETE or JSON from other sites.

## ⚠️ Common mistakes

- **Trying to fix CORS in the frontend** (extra headers, `mode: 'no-cors'`). It must be fixed on the **server**. `no-cors` just makes the response unreadable.
- **`Access-Control-Allow-Origin: *` with cookies.** Browsers reject it.
- **Auth middleware blocking OPTIONS.** The preflight carries no token, so it gets a 401 and CORS fails. Let OPTIONS through **before** auth.
- **Wrong `Content-Type`**, like sending JSON without `application/json`. Then `express.json()` ignores the body and `req.body` is `undefined`.

## 🗣️ How to answer in an interview

> "Headers carry metadata: Content-Type says what I'm sending, Accept says what I want back, Authorization or cookies carry identity, and Cache-Control and ETag handle caching.
>
> CORS is a browser rule: a page can only read a cross-origin response if the server allows that origin with Access-Control-Allow-Origin. For non-simple requests, like JSON bodies, PATCH or DELETE, or an Authorization header, the browser first sends an OPTIONS preflight asking which origins, methods and headers are allowed. Only then does it send the real request.
>
> So CORS is always fixed on the server. I configure an explicit list of allowed origins, allow credentials only for trusted origins, never use * with cookies, make sure OPTIONS isn't blocked by auth middleware, and set Max-Age to cut down repeated preflights. That's also why something can work in Postman but fail in the browser: Postman doesn't enforce CORS."

## 🔁 Follow-up questions

### Does CORS protect the server from attacks?

No. It protects **users' browsers**. A script or curl can still call your API directly. Protect the server with auth, rate limits and validation. See [API security](topic:rest-auth/api-security).

### Why is there an OPTIONS request in the Network tab before my PATCH?

That's the preflight. The browser sends it because PATCH (and JSON bodies) aren't "simple". If it fails, the PATCH is never sent.

### How do you allow several frontends (admin and candidate portals)?

Give `cors` an array of allowed origins, or a function that checks the origin against a list. The response then echoes the matching origin, plus `Vary: Origin`.

### What `Content-Type` do you use for file uploads?

`multipart/form-data`. The body is split into parts: the file plus normal fields. In Express, read it with a library like [multer](topic:express/file-uploads).

## ✅ Quick check

### 1. Which request triggers a preflight?

- A) `GET /jobs` with no custom headers
- B) `POST /login` with `Content-Type: application/json`
- C) A normal HTML form POST

:::answer
**B.** `application/json` is not a "simple" content type, so the browser sends an OPTIONS preflight first. A and C are simple requests.
:::

### 2. The API returns `Access-Control-Allow-Origin: *`, and the frontend uses `credentials: 'include'`. What happens?

:::answer
The browser **blocks** it. With credentials, the server must return the **exact origin** and `Access-Control-Allow-Credentials: true`.
:::

### 3. It works in Postman but fails in Chrome with a CORS error. Where do you fix it?

:::answer
On the **server**: send the right `Access-Control-*` headers for that origin, and handle OPTIONS. Postman doesn't enforce CORS. Browsers do.
:::
