---
title: CORS error when the frontend calls the API
template: scenario
stack: debugging
order: 32
level: Basic
mustKnow: true
askedFrequency: very common
summary:
  - CORS is a browser rule. The browser blocks the response unless the API says this website's origin is allowed.
  - It is fixed on the SERVER (the API), not in the frontend code.
  - Read the exact console message, then check the preflight OPTIONS request and the Access-Control-Allow-* headers in the Network tab.
  - With cookies or credentials, the API must send the exact origin (never *) plus Access-Control-Allow-Credentials true.
  - Prevent it with one allow-list of origins per environment, kept in config, and tested after every deploy.
cards:
  - q: Who blocks a request in a CORS error — the server or the browser?
    a: The browser. The server usually got the request and answered. The browser hides the answer because the API didn't allow the page's origin.
  - q: Where do you fix a CORS error?
    a: On the server (the API), by sending the right Access-Control-Allow-* headers, for example with the cors middleware in Express.
  - q: What is a preflight request?
    a: An automatic OPTIONS request the browser sends first for "non-simple" requests (like JSON bodies or custom headers), to ask if the real request is allowed.
  - q: Why can't you use "*" when sending cookies?
    a: With credentials, browsers reject a wildcard. The API must echo the exact origin and send Access-Control-Allow-Credentials true.
  - q: Postman works but the browser fails. Why?
    a: CORS is only enforced by browsers. Postman, curl and servers don't check it.
---

## 💡 What is it?

Your frontend calls your API. The browser console shows a red error like:

```text
Access to fetch at 'https://api.myapp.com/jobs' from origin 'https://app.myapp.com'
has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present.
```

**CORS** means Cross-Origin Resource Sharing. An **origin** is the protocol + domain + port, like `https://app.myapp.com`. When your page calls an API on a **different origin**, the browser asks: "Does this API allow my page?"

If the API's answer doesn't allow it, the **browser blocks the response**. The API itself often worked fine.

## 🏠 Real-life example

Think of a **school that only accepts letters from approved schools**.

A student from another school sends a letter. The office reads it and writes a reply. But the **school gate guard** checks the reply's envelope. If the envelope doesn't say "approved for your school", the guard **throws it away**. The student never sees it.

- **Your web page** = the student from another school.
- **The API** = the school office that writes the reply.
- **The browser** = the gate guard who checks the envelope.
- **"Approved for your school" written on the envelope** = the `Access-Control-Allow-Origin` header.
- **Asking at the gate first: "May I send a letter?"** = the **preflight** `OPTIONS` request.
- **Postman** = a courier who doesn't pass through that gate, so it always "works".

## 🔎 Detect

- **The browser console** shows "blocked by CORS policy". Read the whole message. It tells you **which** header is missing or wrong.
- **The Network tab** shows the request with a CORS error, and often a failed `OPTIONS` request just before it.
- **Postman or curl work** with the same request. That's a strong sign it is CORS, not a broken API.
- **Timing:** it often appears after a new frontend domain, a deploy, or adding cookies to requests.

## 🐞 Debug

1. **Read the exact message.** The most common ones:
   - "No 'Access-Control-Allow-Origin' header is present" → the API doesn't allow this origin at all.
   - "The value of the 'Access-Control-Allow-Origin' header ... must not be the wildcard '*' when the request's credentials mode is 'include'" → you send cookies, but the API uses `*`.
   - "Response to preflight request doesn't pass access control check" → the `OPTIONS` request failed or returned the wrong headers.
   - "Request header field authorization is not allowed" → the API doesn't list that header in `Access-Control-Allow-Headers`.
2. **Open the Network tab.** Find the `OPTIONS` request. Check its status (should be `204` or `200`) and its `Access-Control-Allow-*` response headers.
3. **Compare origins exactly.** `https://app.myapp.com` and `https://app.myapp.com/` (with a slash), `http` vs `https`, or `www` vs no `www` are all different.
4. **Check if the error is hiding another problem.** If the API crashes with a `500` and the error response has no CORS headers, the browser shows a CORS error instead of the real `500`.
5. **Check middleware order.** CORS middleware must run before your routes and before auth checks, so `OPTIONS` requests get an answer.

## 🔧 Fix

**Before:** no CORS setup, or a wildcard with cookies.

```js
// ❌ BEFORE — "*" with credentials is rejected by browsers
const cors = require('cors');                                   // the CORS middleware for Express
app.use(cors({ origin: '*', credentials: true }));              // the browser rejects "*" when cookies are sent
```

**After:** an exact allow-list from config, credentials on, and the headers you need.

```js
// ✅ AFTER — npm install cors
const cors = require('cors');                                   // the CORS middleware for Express
const allowed = (process.env.ALLOWED_ORIGINS || '').split(',');  // e.g. "https://app.myapp.com,https://admin.myapp.com"

app.use(cors({                                                  // run before every route
  origin(origin, callback) {                                    // decide per request
    if (!origin || allowed.includes(origin)) {                  // no origin (curl, server-to-server) or an allowed site
      return callback(null, origin || true);                    // allow it, and echo back the exact origin
    }                                                           // end of the allow check
    return callback(null, false);                               // not allowed → no CORS headers → the browser blocks it
  },                                                            // end of the origin function
  credentials: true,                                            // sends Access-Control-Allow-Credentials: true (cookies allowed)
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],           // methods the frontend may use
  allowedHeaders: ['Content-Type', 'Authorization'],            // request headers the frontend may send
  maxAge: 600,                                                  // the browser may cache the preflight answer for 600 seconds
}));                                                            // end of the cors options
```

**And on the frontend**, if the API uses cookies:

```js
await fetch('https://api.myapp.com/jobs', {                     // call the API on another origin
  credentials: 'include',                                       // send cookies with the request
});                                                             // end of the fetch call
```

**What each value means:**
- `origin` echoed back = the browser sees `Access-Control-Allow-Origin: https://app.myapp.com`, which matches the page.
- `credentials: true` = the browser may send and receive cookies on this call.
- `maxAge: 600` = fewer preflight requests, so the app feels faster.

The cors package answers `OPTIONS` preflight requests for you when it runs with `app.use()`. See [CORS in Express](topic:express/cors).

:::warning
Don't "fix" CORS by allowing every origin while also allowing credentials (for example by echoing back any origin). That lets any website make logged-in requests on behalf of your users. Keep a real allow-list.
:::

## 🛡️ Prevent

- **One allow-list per environment** (local, staging, production), stored in config, not hard-coded.
- **CORS headers on error responses too.** Make sure the CORS middleware runs first, so even `401` and `500` responses include them. Then real errors show as real errors.
- **A smoke test after deploy** that calls the API from the real frontend domain.
- **Same-site setups where possible.** If the frontend and API share a parent domain, or the API is served under the same origin through a proxy, CORS problems mostly disappear.
- **In development**, use your bundler's proxy (for example Vite's `server.proxy`), so the browser sees one origin.

## 🗣️ How to answer in an interview

**Short version (20 seconds):**

> "CORS is a browser rule, so the fix is on the API. I read the exact console message, then check the preflight OPTIONS request and the Access-Control-Allow headers in the Network tab. I configure the cors middleware with an exact origin allow-list, and with cookies I use credentials true and echo the exact origin — never a wildcard."

**Full version:**

> "First I confirm it's really CORS. Postman working while the browser fails is a strong sign, because only browsers enforce it. Then I read the exact console message — it says which header is missing.
>
> In the Network tab I look at the preflight `OPTIONS` request: its status and the `Access-Control-Allow-Origin`, `-Methods`, `-Headers` and `-Credentials` headers. I compare the origin exactly — protocol, domain, port, no trailing slash.
>
> The fix is on the server. In Express I use the cors middleware before my routes, with an allow-list of origins from config. If the frontend sends cookies, I set `credentials: true` on both sides and echo the exact origin, because browsers reject `*` with credentials.
>
> One more check: sometimes the API is actually throwing a 500 without CORS headers, and the browser reports it as a CORS error. So I make sure error responses also go through the CORS middleware."

[FILL IN: a real CORS problem you fixed — for example after a new subdomain or adding cookies. Only if true.]

## 🔁 Follow-up questions

### Which requests trigger a preflight?

"Non-simple" ones: methods like PUT, PATCH or DELETE; a `Content-Type` like `application/json`; or custom headers like `Authorization`. Simple GET or POST form requests skip it.

### Does CORS protect my API from attackers?

No. CORS only controls what **browsers** let pages read. Attackers can call your API with curl. You still need authentication, authorization and rate limiting.

### Can I fix CORS in the frontend?

Not really. The frontend can't give itself permission. In development a proxy can hide the problem, but production needs the right headers from the API.

### Why does the error say CORS when my API returned 500?

If the error response skips the CORS middleware, it has no `Access-Control-Allow-Origin` header. The browser then hides it and shows a CORS error. Fix the CORS order, then you'll see the real 500.

## ✅ Quick check

### 1. Where is a CORS error fixed?

- A) In the React code
- B) In the API's response headers
- C) In the browser settings

:::answer
**B.** The API must send the right `Access-Control-Allow-*` headers. The frontend can't give itself permission.
:::

### 2. The page origin is `https://app.myapp.com`. The API sends `Access-Control-Allow-Origin: *` and the request uses `credentials: 'include'`. Does it work?

:::answer
**No.** With credentials, browsers reject `*`. The API must send the exact origin `https://app.myapp.com` and `Access-Control-Allow-Credentials: true`.
:::

### 3. Postman gets a 200 from the API, but the browser shows a CORS error. Is the API broken?

:::answer
Probably **not**. Postman doesn't check CORS. The API works, but it doesn't send headers that allow your page's origin.
:::
