---
title: CORS in Express
stack: express
order: 14
level: Intermediate
mustKnow: true
askedFrequency: very common
summary:
  - CORS (Cross-Origin Resource Sharing) is a BROWSER rule. A page from one origin (like localhost:5173) can only read replies from another origin (like localhost:3000) if that server says "yes" with special headers.
  - An origin = protocol + domain + port. Change any one of them, and it's a different origin.
  - A CORS error is fixed on the SERVER, by sending Access-Control-Allow-Origin and related headers. In Express, use the cors package.
  - For "non-simple" requests (JSON body, PUT/DELETE, Authorization header), the browser first sends an OPTIONS "preflight" request to ask permission.
  - With cookies or credentials, you must list exact origins — never "*". CORS is not security for your API; it only protects users in browsers.
cards:
  - q: What is CORS?
    a: A browser security rule. JavaScript on one origin can read a response from a different origin only if that server allows it with Access-Control-Allow-* headers.
  - q: What makes two URLs different origins?
    a: "A different protocol (http vs https), domain, or port. http://localhost:5173 and http://localhost:3000 are different origins."
  - q: Where do you fix a CORS error — frontend or backend?
    a: On the backend (or a proxy). The server must send the right Access-Control-Allow-Origin header. The frontend can't give itself permission.
  - q: What is a preflight request?
    a: An automatic OPTIONS request the browser sends before a "non-simple" request (for example PUT, DELETE, a JSON body or an Authorization header) to ask if it's allowed.
  - q: Can you use origin "*" with credentials true?
    a: No. When cookies or credentials are allowed, the browser requires one exact origin in the header, not "*".
---

## 💡 What is it?

**CORS** means **Cross-Origin Resource Sharing**. It is a **security rule inside the browser**.

An **origin** is the protocol + domain + port, like `http://localhost:5173`. By default, JavaScript on one origin can't read replies from a **different** origin.

If your React app (`localhost:5173`) calls your Express API (`localhost:3000`), they are different origins. The API must reply with special **headers** that say "this origin is allowed". If it doesn't, the browser blocks the reply and shows a **CORS error**.

## 🏠 Real-life example

Think of a **school hostel with a guest list**.

A visitor (your frontend) comes to the hostel gate and asks to meet a student (your API). The guard (the browser) checks the hostel's **guest list**.

- If the visitor's name is on the list, the guard lets them meet.
- If not, the guard stops them at the gate. It doesn't matter how polite they are.

- The **visitor** = JavaScript on `localhost:5173`.
- The **hostel** = the Express API on `localhost:3000`.
- The **guard** = the browser.
- The **guest list** = the `Access-Control-Allow-Origin` header.
- **Phoning the warden first** to ask "can I bring a parcel?" = the **preflight** request.

Notice: only the **hostel** can add names to the list. The visitor can't write their own name. That's why CORS is fixed on the **server**.

## 🧑‍💻 Code example

Make a folder, run `npm init -y` and `npm install express cors`. Save this as `app.js`. Run it with `node app.js`.

```js
const express = require('express');                                // load Express
const cors = require('cors');                                      // load the cors middleware
const app = express();                                             // create the app

const allowedOrigins = ['http://localhost:5173', 'https://app.example.com']; // frontends we trust

app.use(cors({                                                     // add CORS headers to every response
  origin: (origin, callback) => {                                  // decide per request; origin = who is calling
    if (!origin || allowedOrigins.includes(origin)) {              // no origin = curl/Postman/server; or a trusted site
      return callback(null, true);                                 // allow it → header is set to that origin
    }                                                              // end of the if
    callback(null, false);                                         // not on the list → no CORS headers → browser blocks
  },                                                               // end of origin
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],              // HTTP methods the frontend may use
  allowedHeaders: ['Content-Type', 'Authorization'],               // headers the frontend may send
  credentials: true,                                               // allow cookies / auth with the request
  maxAge: 600,                                                     // browser may remember the preflight for 600 s
}));                                                               // end of cors()

app.use(express.json());                                           // read JSON bodies
app.get('/jobs', (req, res) => res.json([{ id: 1, title: 'Node.js Developer' }])); // a normal route

app.listen(3000, () => console.log('API on port 3000'));            // start the server on port 3000
```

Test what the browser would see (`-i` shows the headers):

```text
$ curl -i -H "Origin: http://localhost:5173" localhost:3000/jobs
HTTP/1.1 200 OK
Access-Control-Allow-Origin: http://localhost:5173      ← allowed
Access-Control-Allow-Credentials: true
Vary: Origin
...

$ curl -i -H "Origin: https://evil.example" localhost:3000/jobs
HTTP/1.1 200 OK                                          ← no Access-Control-Allow-Origin header
...                                                       → a browser would block this reply
```

## 🔍 Deeper version

**Same-origin policy.** Browsers have a basic rule called the **same-origin policy**. JavaScript can only read responses from its own origin. CORS is the official way for a server to **relax** that rule for chosen origins.

| URL A | URL B | Same origin? |
|---|---|---|
| `http://localhost:5173` | `http://localhost:3000` | ❌ different port |
| `http://example.com` | `https://example.com` | ❌ different protocol |
| `https://example.com` | `https://api.example.com` | ❌ different domain (subdomain) |
| `https://example.com/a` | `https://example.com/b` | ✅ only the path differs |

**Simple vs preflighted requests.**
- **Simple requests**: GET, HEAD or POST, with only basic headers, and a body type like a form (not JSON). The browser sends them directly. If the response has no CORS header, the browser hides the reply from JavaScript.
- **Everything else** gets a **preflight**: PUT, PATCH or DELETE, `Content-Type: application/json`, or an `Authorization` header. The browser first sends an **`OPTIONS`** request with `Access-Control-Request-Method` and `Access-Control-Request-Headers`. Only if the reply allows them does it send the real request.

The `cors` package answers preflight `OPTIONS` requests for you when you use `app.use(cors(...))`.

**The important headers:**
- `Access-Control-Allow-Origin`: which origin may read the reply (`*` or one exact origin).
- `Access-Control-Allow-Methods` and `Access-Control-Allow-Headers`: used in preflight replies.
- `Access-Control-Allow-Credentials: true`: allows cookies and auth. Then the origin **can't** be `*`.
- `Access-Control-Max-Age`: how long the browser may cache the preflight answer.
- `Access-Control-Expose-Headers`: which response headers JavaScript may read (for example `X-Total-Count`).
- `Vary: Origin`: tells caches that the reply depends on the origin.

**CORS is not API security.** CORS only protects **users in browsers** from other websites reading data with their logged-in session. It does **not** stop curl, Postman, scripts or other servers. Your API still needs authentication, authorization and rate limiting.

**Credentials.** For cookie-based auth across origins you need **both** sides:
- server: `credentials: true` + an exact origin
- frontend: `fetch(url, { credentials: 'include' })` or axios `withCredentials: true`
- cookies: `SameSite=None; Secure` if the sites are on different domains

**Avoiding CORS completely.** In development, the Vite dev server can **proxy** `/api` to `localhost:3000`. In production, you can serve the frontend and API from the same domain (for example via Nginx). Then the browser sees one origin, and no CORS is needed.

:::version[Express 5 note]
In Express 5, route paths use new syntax, so the old `app.options('*', cors())` no longer works. Use `'/{*splat}'`, or just `app.use(cors(...))`, which already handles preflight for every route.
:::

## 🎯 Why do we use it?

- **Modern apps are split.** The React app and the API usually run on different ports or domains. Without CORS, the browser blocks every API call.
- **Control.** You decide exactly which frontends may call your API from a browser.
- **User safety.** It stops a random website from reading a logged-in user's data through their browser.

## ⚠️ Common mistakes

- **Trying to fix CORS in React** (adding headers to the request, or a "no-cors" mode). The fix belongs on the server.
- **`origin: '*'` with `credentials: true`.** Browsers reject this combination.
- **Reflecting any origin** (`origin: true`) together with credentials in production. Any website could then make logged-in requests and read the reply.
- **Thinking CORS protects the API from attackers.** It doesn't. Non-browser clients ignore it.
- **The CORS middleware placed after the routes,** or the auth middleware rejecting the `OPTIONS` preflight with 401.

## 🗣️ How to answer in an interview

> "CORS is a browser rule built on the same-origin policy. An origin is the protocol, domain and port, so a React app on localhost 5173 and an API on 3000 are different origins. The browser only lets JavaScript read the response if the server sends Access-Control-Allow-Origin with that origin. So CORS errors are always fixed on the server, never in the frontend.
>
> For requests like PUT, DELETE, JSON bodies or an Authorization header, the browser first sends an OPTIONS preflight. In Express I use the cors package with an allow-list of origins from config, the allowed methods and headers, and credentials true if we use cookies. With credentials, the origin can't be a star. I also remember that CORS isn't security for the API itself. Postman or another server can still call it, so authentication and rate limiting are still needed."

[FILL IN: a real CORS issue you fixed between the SkillKeepr frontend and backend (for example a new environment or domain). Only add it if it's true.]

## 🔁 Follow-up questions

### Why does Postman work but the browser shows a CORS error?

CORS is enforced only by browsers. Postman and curl don't follow the same-origin policy, so they show the response. In the browser, the reply arrives but JavaScript isn't allowed to read it.

### What is a preflight request and when does it happen?

It is an `OPTIONS` request the browser sends first, to ask if the real request is allowed. It happens for "non-simple" requests: methods like PUT or DELETE, a JSON content type, or custom headers like `Authorization`.

### How do you allow cookies across origins?

On the server: `credentials: true` and one exact allowed origin. On the client: `credentials: 'include'` (fetch) or `withCredentials: true` (axios). The cookie itself needs `SameSite=None; Secure` if the domains are different.

### How do you avoid CORS during local development?

Use the dev server proxy. For example, Vite's `server.proxy` sends `/api` calls to `http://localhost:3000`. The browser only talks to the Vite origin, so there is no cross-origin request.

## ✅ Quick check

### 1. Are `https://app.example.com` and `https://api.example.com` the same origin?

:::answer
**No.** The domains are different (different subdomains). So the API must allow `https://app.example.com` with CORS headers.
:::

### 2. A React app sends `fetch('/x', { method: 'DELETE' })` to another origin. What does the browser send first?

- A) Nothing, it sends the DELETE directly
- B) An OPTIONS preflight request
- C) A GET request

:::answer
**B.** DELETE is not a "simple" method, so the browser first sends an `OPTIONS` preflight to ask permission.
:::

### 3. True or false: setting CORS correctly stops hackers from calling your API with curl.

:::answer
**False.** CORS is only enforced by browsers. curl, Postman and servers ignore it. You still need authentication, authorization and rate limiting.
:::
