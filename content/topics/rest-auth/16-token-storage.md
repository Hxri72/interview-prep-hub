---
title: "Where to store tokens: httpOnly cookie vs localStorage"
stack: rest-auth
order: 16
level: Intermediate
mustKnow: true
askedFrequency: very common
summary:
  - "localStorage: easy to use, but any JavaScript on the page can read it. One XSS bug can steal the token."
  - "HttpOnly cookie: JavaScript can't read it, so XSS can't steal it. The browser sends it automatically."
  - "Because cookies are sent automatically, they need CSRF protection: SameSite=Strict or Lax, plus a CSRF token or Origin check if needed."
  - "Good cookie flags: HttpOnly, Secure, SameSite, a short Max-Age, and a narrow Path for the refresh token."
  - "A common safe setup: access token in memory (or an HttpOnly cookie), refresh token in an HttpOnly cookie."
cards:
  - q: Why is localStorage risky for tokens?
    a: Any script running on your page can read localStorage. If an attacker injects JavaScript (XSS), they can copy the token and use it from anywhere.
  - q: What does HttpOnly do?
    a: It stops JavaScript (document.cookie) from reading the cookie. Only the browser sends it to the server.
  - q: What new risk do cookies bring?
    a: "CSRF: another website can make the user's browser send a request to your API, and the cookie goes along automatically."
  - q: How does SameSite help?
    a: "SameSite=Strict or Lax tells the browser not to send the cookie on requests started by other sites (Lax still allows top-level GET navigations)."
  - q: What must the frontend do to send cookies to an API on another origin?
    a: "Use fetch with credentials: 'include' (or axios withCredentials: true), and the server must reply with Access-Control-Allow-Credentials: true and an exact allowed origin, not *."
---

## 💡 What is it?

After login, the browser has to **keep the token somewhere**, so it can send it on every request. The two main choices are:

- **`localStorage`:** a small storage box that JavaScript can read and write.
- **An [HttpOnly](glossary:cookie) cookie:** the server sets it, the browser keeps it, and JavaScript **can't read it**. The browser sends it to the server by itself.

Each choice protects you from one attack and exposes you to another. The two attacks are **[XSS](glossary:xss)** and **[CSRF](glossary:csrf)**.

## 🏠 Real-life example

Think of **keeping your house key**.

**Option 1:** you hang the key on a hook **outside** the door (`localStorage`). It's easy to grab when you need it. But anyone who walks onto the porch can grab it too. That is XSS: a bad script on your page simply takes the token.

**Option 2:** you give the key to a **trusted security guard** at the gate (an HttpOnly cookie). You can't even touch it yourself. The guard opens the door whenever someone walks up "with you". The risk is a stranger tricking the guard by walking next to you. That is CSRF: another site makes your browser send a request, and the guard happily opens up.

- The **hook outside the door** = localStorage, readable by any script.
- The **security guard** = the browser, holding an HttpOnly cookie.
- The **guard's rule "only for people who came from our own building"** = `SameSite`.
- **Checking a secret handshake** = a CSRF token.

## 🧑‍💻 Code example

Set up: `npm init -y`, then `npm install express cookie-parser jsonwebtoken`. Save as `cookie-storage.js` and run `node cookie-storage.js`.

```js
const express = require('express');                         // load Express
const cookieParser = require('cookie-parser');              // npm install cookie-parser (reads cookies into req.cookies)
const jwt = require('jsonwebtoken');                        // npm install jsonwebtoken
const app = express();                                      // create the app
app.use(cookieParser());                                    // turn the Cookie header into req.cookies
const SECRET = 'dev-secret';                                // signs the token

app.post('/login', (req, res) => {                          // log in (password check skipped here)
  const token = jwt.sign({ sub: 'u1' }, SECRET, { expiresIn: '15m' }); // make the token
  res.cookie('access_token', token, {                       // store it in a cookie, not in the JSON body
    httpOnly: true,                                         // JavaScript in the page can NOT read it (stops XSS theft)
    secure: true,                                           // only sent over HTTPS
    sameSite: 'strict',                                     // not sent on requests started by other sites (stops CSRF)
    maxAge: 15 * 60 * 1000,                                 // 15 minutes, in milliseconds
  });                                                       // end of cookie options
  res.json({ ok: true });                                   // the body has no token at all
});                                                         // end of /login

app.get('/me', (req, res) => {                              // a protected route
  const token = req.cookies.access_token;                   // the browser sent the cookie by itself
  if (!token) return res.status(401).json({ error: 'Not logged in' }); // no cookie → 401
  res.json({ userId: jwt.verify(token, SECRET).sub });      // verify and answer
});                                                         // end of /me

const server = app.listen(3000, async () => {               // start, then act like a browser
  const login = await fetch('http://localhost:3000/login', { method: 'POST' }); // log in
  const setCookie = login.headers.get('set-cookie');        // what the server asked the browser to save
  console.log('Set-Cookie:', setCookie.replace(/=eyJ[^;]+/, '=eyJ...')); // shorten the token for printing
  const cookie = setCookie.split(';')[0];                   // a browser would send back just "name=value"
  const me = await fetch('http://localhost:3000/me', { headers: { cookie } }); // send it like a browser does
  console.log('/me →', me.status, JSON.stringify(await me.json())); // 200
  server.close();                                           // stop the server
});                                                         // end of listen
```

**Output** (the date will differ):

```text
Set-Cookie: access_token=eyJ...; Max-Age=900; Path=/; Expires=Fri, 09 Oct 2026 15:16:49 GMT; HttpOnly; Secure; SameSite=Strict
/me → 200 {"userId":"u1"}
```

In a real browser, `document.cookie` would **not** show `access_token`, because of `HttpOnly`. (Our Node script copies the header by hand to act like a browser.)

## 🔍 Deeper version

**The two attacks:**

| Attack | What happens | localStorage | HttpOnly cookie |
|---|---|---|---|
| **XSS** (cross-site scripting) | attacker's JavaScript runs on your page | ❌ token can be read and sent away | ✅ can't be read (but the script can still make requests while the page is open) |
| **CSRF** (cross-site request forgery) | another site makes the browser call your API | ✅ not sent automatically | ❌ sent automatically, so it needs protection |

**Cookie flags, one by one:**
- `HttpOnly`: hidden from JavaScript.
- `Secure`: sent only over HTTPS.
- `SameSite=Strict`: never sent on requests that come from another site.
- `SameSite=Lax`: like Strict, but still sent when the user clicks a normal link to your site. Modern browsers treat cookies with no `SameSite` as `Lax`.
- `SameSite=None`: sent everywhere. Only allowed together with `Secure`. Needed if your frontend and API are on **different sites** (different registered domains).
- `Max-Age` / `Expires`: how long the cookie lives.
- `Domain`: lets subdomains share the cookie (for example `app.example.com` and `api.example.com`).
- `Path`: only send to these paths. For example, use `Path=/auth/refresh` for a refresh token.

**CSRF defences, from simplest:**
1. `SameSite=Strict` or `Lax` on auth cookies. This is often enough when the frontend and API are on the same site.
2. Check the `Origin` (or `Referer`) header on state-changing requests.
3. A **CSRF token**: the server gives the page a random value, and the page sends it back in a header. Other sites can't read it.
4. Never change data with `GET` requests.

**Calling an API on another origin with cookies:**
- Frontend: `fetch(url, { credentials: 'include' })`, or axios `withCredentials: true`.
- Server: `Access-Control-Allow-Credentials: true` and an **exact** `Access-Control-Allow-Origin`. It can't be `*` when credentials are allowed. See [CORS in Express](topic:express/cors).

**The in-memory pattern.** Keep the access token in a JavaScript variable (lost on refresh), and the refresh token in an HttpOnly cookie. On page load, call `/refresh` to get a new access token. XSS can still use the token while the page is open, but it can't steal a long-lived token.

**Remember: XSS is still the real enemy.** HttpOnly stops token *theft*, but an injected script can still call your API as the user while the page is open. So also escape output, use a Content Security Policy, and never put user input into `innerHTML`. See [browser storage](topic:javascript/browser-storage).

## 🎯 Why do we use it?

The token is the key to the user's account. Where you keep it decides **which attacks can steal it**. Choosing HttpOnly cookies with `SameSite` protects users from the most common token theft, with a little extra setup.

## ⚠️ Common mistakes

- **Putting a long-lived token in localStorage.** One XSS bug and attackers get weeks of access.
- **Using cookies but ignoring CSRF.** No `SameSite`, no CSRF token, and `GET` routes that change data.
- **`SameSite=None` without `Secure`.** Browsers reject the cookie.
- **`Access-Control-Allow-Origin: *` with credentials.** Browsers block it. You must echo an exact, trusted origin.
- **Thinking HttpOnly fixes XSS.** It only stops the token being read. You still need to prevent XSS itself.

## 🗣️ How to answer in an interview

> "localStorage is easy, but any JavaScript on the page can read it. So one XSS bug, for example from a third-party script, can steal the token. An HttpOnly cookie can't be read by JavaScript, which protects against that. But the browser sends cookies automatically, which opens the door to CSRF. So I set `SameSite` to Strict or Lax, use `Secure`, and for sensitive cases also check the Origin header or use a CSRF token.
>
> My usual setup is a short-lived access token, and a refresh token in an HttpOnly, Secure, SameSite cookie with a narrow path. If the API is on a different origin, the frontend sends `credentials: 'include'`, and the server allows that exact origin with credentials. I also remember that HttpOnly doesn't fix XSS itself, so I still escape output and use a Content Security Policy.
>
> [FILL IN: if true — 'At SkillKeepr we use HttpOnly JWT cookies, and the frontend only reads a simple logged-in flag.']"

## 🔁 Follow-up questions

### Is sessionStorage safer than localStorage?

Only slightly. It's cleared when the tab closes, but any script on the page can still read it. XSS can steal from it the same way.

### Why does SameSite=Strict sometimes log users out when they click a link from email?

With `Strict`, the cookie isn't sent on the first request coming from another site, even a normal link click. The user looks logged out on that first page. `Lax` allows top-level link navigations and fixes this.

### Can a CSRF attack read the response?

No. The attacker's site can make the browser **send** the request, but CORS stops it from **reading** the reply. CSRF is about unwanted actions (transfer money, change email), not stealing data.

### How does the frontend know the user is logged in if it can't read the cookie?

Call a `/me` endpoint on load, or set a second, harmless, readable cookie like `isLoggedIn=true` that holds no secret.

## ✅ Quick check

### 1. An XSS bug lets an attacker run JavaScript on your page. Where is the token safer from being copied?

- A) localStorage
- B) An HttpOnly cookie

:::answer
**B.** JavaScript can't read HttpOnly cookies. (The attacker could still make requests while the page is open, but can't take the token away.)
:::

### 2. Which cookie setting stops the browser sending it on requests started by another website?

:::answer
**`SameSite=Strict`** (or `Lax`, which still allows normal link clicks).
:::

### 3. Your React app on `app.example.com` calls `api.example.com` with an auth cookie, but the cookie isn't sent. What is the most likely missing piece on the frontend?

:::answer
**`credentials: 'include'`** in `fetch` (or `withCredentials: true` in axios). The server must also send `Access-Control-Allow-Credentials: true` with the exact origin.
:::
