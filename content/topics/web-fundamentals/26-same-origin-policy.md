---
title: "Same-origin policy: why the browser blocks requests"
stack: web-fundamentals
order: 26
level: Intermediate
mustKnow: false
askedFrequency: common
summary:
  - "An origin is scheme + host + port. http://localhost:3000 and http://localhost:5000 are different origins."
  - The same-origin policy is a browser rule. It stops a page's JavaScript from reading responses from another origin, unless that server allows it.
  - The server allows it with CORS headers like Access-Control-Allow-Origin. CORS is the server's permission slip.
  - It's the browser that blocks, not the server. curl, Postman and Node's fetch are never blocked.
  - In development, a dev-server proxy makes the API look same-origin, so CORS isn't needed.
cards:
  - q: What makes up an origin?
    a: The scheme (http/https), the host (domain) and the port. All three must match for two URLs to be the same origin.
  - q: Who enforces the same-origin policy?
    a: The browser. The request may even reach the server, but the browser hides the response from the page's JavaScript if CORS doesn't allow it.
  - q: Why does curl work when the browser shows a CORS error?
    a: curl is not a browser, so it doesn't apply the same-origin policy. CORS only protects users inside browsers.
  - q: How does a server allow another origin?
    a: By sending CORS headers, mainly Access-Control-Allow-Origin with that exact origin, plus credentials and methods headers when needed.
  - q: How do you avoid CORS in local development?
    a: Use the dev server's proxy, so the browser calls /api on its own origin and the dev server forwards it to the backend.
---

## 💡 What is it?

An [origin](glossary:origin) is three things together: the **scheme** (`http` or `https`), the **host** (like `app.example.com`) and the **port** (like `3000`).

The **same-origin policy** is a safety rule inside every browser. JavaScript on one origin may *send* requests to another origin. But it may not *read* the answer, unless that other server says "this origin is allowed". That permission is called **CORS**.

## 🏠 Real-life example

Think of a **school hostel**.

- **Your room** = your page's origin.
- **Another student's room** = another origin.
- The **warden** = the browser. The warden enforces the rule: "Nobody reads another student's letters without permission."
- The **permission note signed by the other student** = the CORS header (`Access-Control-Allow-Origin`). With it, the warden lets you read the letter.
- **A visitor from outside the hostel** = curl or Postman. The hostel rule doesn't apply to them, so they aren't stopped.

The rule protects students (users), not the letters themselves.

## 🧑‍💻 Code example

An API on port 4706 that gives permission only to the frontend on port 4705. Node's `fetch` doesn't enforce the policy, so the script reads the headers and prints what a browser would decide. Save as `sop.mjs` and run `node sop.mjs`.

```js
import http from 'node:http'; // Node's built-in web server
const api = http.createServer((req, res) => { // the API on port 4706 (a different origin from the page)
  const origin = req.headers.origin; // which page is asking (the browser adds this header)
  if (origin === 'http://localhost:4705') res.setHeader('Access-Control-Allow-Origin', origin); // permission slip only for our frontend
  res.end('{"ok":true}'); // the data
}).listen(4706); // API origin = http://localhost:4706
async function ask(fromOrigin) { // simulate a browser page on fromOrigin calling the API
  const r = await fetch('http://localhost:4706/data', { headers: { Origin: fromOrigin } }); // Node's fetch does NOT enforce CORS, so we read the headers ourselves
  const allowed = r.headers.get('access-control-allow-origin'); // what the server allowed
  console.log(`${fromOrigin.padEnd(24)} status ${r.status}  allow-origin: ${allowed ?? '(none)'}  → browser ${allowed === fromOrigin ? 'lets JS read it' : 'BLOCKS JS from reading it'}`); // the browser's decision
} // end of ask
await ask('http://localhost:4705'); // our frontend (same host, different port = different origin)
await ask('http://evil.example'); // some other website
api.close(); // stop the demo
```

Real output:

```text
http://localhost:4705    status 200  allow-origin: http://localhost:4705  → browser lets JS read it
http://evil.example      status 200  allow-origin: (none)  → browser BLOCKS JS from reading it
```

Notice that the server answered **200 both times**. The server didn't block anything. The block happens in the browser.

## 🔍 Deeper version

**Proof in a real browser.** The same test ran in headless Chrome, with a page on port 4705 and a page on port 4707, both calling the API on 4706:

```text
page on :4705 → read: {"ok":true}
page on :4707 → fetch failed: Failed to fetch
   console: Access to fetch at 'http://localhost:4706/data' from origin 'http://localhost:4707' has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present on …
```

**Same origin or not?** (page = `https://app.example.com`)

| Other URL | Same origin? | Why |
|---|---|---|
| `https://app.example.com/api/jobs` | yes | same scheme, host, port |
| `http://app.example.com` | no | scheme differs |
| `https://api.example.com` | no | host differs (a subdomain counts as different) |
| `https://app.example.com:8443` | no | port differs |

**What the policy blocks, and what it doesn't:**
- **Blocked:** reading `fetch`/XHR responses from another origin without CORS; reading another origin's page through an iframe.
- **Allowed:** loading images, scripts, CSS and fonts with tags (`<img>`, `<script>`); submitting forms; following links. That's why [CSRF](glossary:csrf) attacks are still possible, and why cookies need `SameSite`.

**CORS headers in short** (more in [Express CORS](topic:express/cors) and [Headers and preflight](topic:rest-auth/headers-cors-preflight)):
- `Access-Control-Allow-Origin`: the origin allowed to read the response.
- **Preflight:** for "non-simple" requests (JSON body, `Authorization` header, `PUT`/`DELETE`), the browser first sends an `OPTIONS` request to ask permission.
- **With cookies:** the page uses `credentials: 'include'`, and the server must send `Access-Control-Allow-Credentials: true` with the **exact** origin. `*` is not allowed then.

**Cookies across subdomains.** A [cookie](glossary:cookie) set with `Domain=example.com` is sent to `app.example.com` and `api.example.com`. `SameSite=Strict` or `Lax` stops it being sent from *other sites*. Subdomains of the same site still count as "same-site", even though they are different **origins** for CORS. So a frontend on `app.example.com` calling `api.example.com` needs both: CORS with credentials, and the cookie's `Domain` set to the parent domain. See [Where to store tokens](topic:rest-auth/token-storage).

**Dev proxy.** Vite and webpack dev servers can forward `/api` to your backend. The browser only talks to `localhost:5173`, so everything is same-origin and CORS never comes up:

```js
// vite.config.js — forward /api to the backend during development
export default { server: { proxy: { '/api': 'http://localhost:4000' } } }; // browser → :5173/api → dev server → :4000/api
```

## 🎯 Why do we use it?

Without this rule, any website you visit could use *your* logged-in browser to read your email, bank or company data from other sites. The same-origin policy keeps each site's data private to that site, unless the site itself opens a door with CORS.

## ⚠️ Common mistakes

- **"Fixing" CORS on the frontend.** You can't. The server (or a proxy) must send the headers.
- **Using `Access-Control-Allow-Origin: *` with cookies.** Browsers reject it. Use the exact origin.
- **Thinking CORS protects the API from attackers.** It only protects users in browsers. curl can still call your API, so you still need authentication.
- **Forgetting the preflight.** The `OPTIONS` request must also get the CORS headers, or the real request never runs.

## 🗣️ How to answer in an interview

> "An origin is the scheme, host and port together. The same-origin policy is a browser rule. JavaScript on one origin can't read responses from another origin unless that server allows it with CORS headers, like Access-Control-Allow-Origin. The request can still reach the server. The browser just hides the response from the page. That's why curl or Postman work while the browser shows a CORS error.
>
> For non-simple requests, like JSON or an Authorization header, the browser sends an OPTIONS preflight first. With cookies, the server must echo the exact origin and allow credentials. In development I usually use the dev server's proxy, so the frontend and API look like the same origin. In production I configure CORS on the API to allow only our frontend origins."

[FILL IN: a CORS issue you fixed at work, if any — only add it if it's true.]

## 🔁 Follow-up questions

### Is `localhost:3000` the same origin as `localhost:5000`?

No. The port is different, so it's a different origin. This is why a React dev server on one port calling an API on another needs CORS or a proxy.

### Does the same-origin policy stop CSRF?

Not fully. A form or image tag can still send a request with cookies to another site. You stop CSRF with `SameSite` cookies, CSRF tokens, and not using GET for changes.

### Why does a CORS error show status 200 in the Network tab sometimes?

Because the server did answer. The browser then refused to give the response to your JavaScript, since the CORS header was missing or wrong.

### What's the difference between "same-origin" and "same-site"?

Same-origin needs scheme, host and port to match. Same-site only compares the registrable domain, like `example.com`. So `app.example.com` and `api.example.com` are cross-origin but same-site.

## ✅ Quick check

### 1. The page is `https://shop.com`. Which URL is the same origin?

- A) `http://shop.com/cart`
- B) `https://shop.com/api/items`
- C) `https://api.shop.com/items`

:::answer
**B.** A has a different scheme (http). C has a different host (a subdomain).
:::

### 2. curl gets data from your API, but the browser shows a CORS error. Where is the fix?

:::answer
**On the server** (or a proxy). It must send `Access-Control-Allow-Origin` for your frontend's origin, and handle the preflight if there is one. The frontend can't fix it.
:::

### 3. True or false: CORS stops attackers from calling your API with a script on their own computer.

:::answer
**False.** CORS is enforced only by browsers, to protect users. Scripts, curl and servers ignore it. You still need authentication and authorisation.
:::
