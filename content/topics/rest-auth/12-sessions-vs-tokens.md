---
title: Sessions and cookies vs tokens
stack: rest-auth
order: 12
level: Intermediate
mustKnow: false
askedFrequency: common
summary:
  - "Session: the server remembers who you are. The browser only holds a random session ID, usually in a cookie."
  - "Token (like a JWT): the user's info is inside a signed token. The server stores nothing and just checks the signature."
  - "Sessions are easy to cancel (delete the session), but need shared storage (like Redis) when you run many servers."
  - "Tokens scale easily across servers and services, but are hard to cancel before they expire."
  - "Cookie vs token is a different question: a cookie is HOW the value travels; session or token is WHAT the value is."
cards:
  - q: Session vs token in one line?
    a: "Session: the server stores the login state, and the client holds only an ID. Token: the state is inside a signed token, so the server stores nothing."
  - q: Which is easier to log out or revoke?
    a: Sessions. Delete the session on the server and it stops working at once. A JWT stays valid until it expires, unless you add a denylist.
  - q: Why do sessions need Redis when you scale?
    a: With many servers, any server may get the next request. They all need to see the same session data, so it goes in a shared store like Redis.
  - q: Can a JWT be stored in a cookie?
    a: Yes. Cookie is just the transport. Many apps put the JWT in an HttpOnly cookie, which mixes token-style data with cookie-style safety.
  - q: When would you choose sessions?
    a: A classic web app with one backend, where instant logout and simple revocation matter more than scaling across many services.
---

## 💡 What is it?

After you log in, the server needs to remember you on the **next** request. HTTP doesn't remember anything by itself. There are two main ways to solve this.

- **[Session](glossary:session):** the **server** remembers you. It stores your login in memory or a database, and gives the browser a random **session ID**, usually in a [cookie](glossary:cookie).
- **Token** (often a **[JWT](glossary:jwt)**): the server gives you a **signed token** that contains your details. The server stores nothing. On each request, it just checks the signature.

## 🏠 Real-life example

Think of **a school library**.

**Session style:** you show your face at the counter. The librarian opens **her register book** and finds your row: "Asha, Class 10, 2 books out". You only carry your **roll number**.

**Token style:** the school gives you a **laminated ID card with a stamp**. Any librarian, in any branch, reads your details straight from the card and checks the stamp. Nobody opens a register.

- The **register book** = the server's session store.
- Your **roll number** = the session ID in a cookie.
- The **stamped ID card** = the signed token (JWT).
- The **stamp** = the signature. A fake card has the wrong stamp.
- **Losing your card** = a stolen token. It keeps working until it expires, because no register is checked.

## 🧑‍💻 Code example

Set up: `npm init -y`, then `npm install express jsonwebtoken`. Save as `sessions-vs-tokens.js` and run `node sessions-vs-tokens.js`.

```js
const express = require('express');                         // load Express
const crypto = require('node:crypto');                      // built-in module, makes random IDs
const jwt = require('jsonwebtoken');                        // npm install jsonwebtoken
const app = express();                                      // create the app
const sessions = new Map();                                 // SESSION style: the server remembers users here
const SECRET = 'dev-secret';                                // TOKEN style: secret used to sign tokens

app.post('/login-session', (req, res) => {                  // session login
  const sessionId = crypto.randomUUID();                    // a random, meaningless ID
  sessions.set(sessionId, { name: 'Asha' });                // the server stores the user under that ID
  res.cookie('sid', sessionId, { httpOnly: true });         // send the ID to the browser in a cookie
  res.json({ ok: true });                                   // reply
});                                                         // end of route

app.get('/me-session', (req, res) => {                      // who am I? (session)
  const sid = req.headers.cookie?.split('=')[1];            // read the sid value from the Cookie header
  res.json(sessions.get(sid) ?? { error: 'no session' });   // look it up in server memory
});                                                         // end of route

app.post('/login-token', (req, res) => {                    // token login
  const token = jwt.sign({ name: 'Asha' }, SECRET, { expiresIn: '15m' }); // the user's data goes INSIDE the token
  res.json({ token });                                      // the server stores nothing
});                                                         // end of route

app.get('/me-token', (req, res) => {                        // who am I? (token)
  const token = req.headers.authorization?.split(' ')[1];   // read "Bearer <token>"
  const { name } = jwt.verify(token, SECRET);               // check the signature, read the data
  res.json({ name });                                       // no database or memory lookup needed
});                                                         // end of route

const server = app.listen(3000, async () => {               // start, then test both styles
  const base = 'http://localhost:3000';                     // server address
  const r1 = await fetch(`${base}/login-session`, { method: 'POST' }); // log in (session)
  const cookie = r1.headers.get('set-cookie').split(';')[0];// keep just "sid=..."
  const me1 = await fetch(`${base}/me-session`, { headers: { cookie } }); // send the cookie back
  console.log('session:', await me1.json(), '| server is storing', sessions.size, 'session'); // result
  const { token } = await (await fetch(`${base}/login-token`, { method: 'POST' })).json(); // log in (token)
  const me2 = await fetch(`${base}/me-token`, { headers: { Authorization: `Bearer ${token}` } }); // send the token
  console.log('token:', await me2.json());                  // result
  server.close();                                           // stop the server
});                                                         // end of listen
```

**Output:**

```text
session: { name: 'Asha' } | server is storing 1 session
token: { name: 'Asha' }
```

Both styles know it's Asha. But only the session style made the **server store** something.

## 🔍 Deeper version

| | Session | Token (JWT) |
|---|---|---|
| Where the login state lives | on the server (memory, Redis, DB) | inside the token, on the client |
| What the client holds | a random session ID | the whole signed token |
| Each request | look up the session in the store | verify the signature (no lookup) |
| Logout / revoke | delete the session → instant | hard; the token works until it expires |
| Many servers | need a shared store (Redis) | any server with the key can verify |
| Many services | each service needs access to the store | easy: pass the token along |
| Size on each request | tiny ID | bigger (header + payload + signature) |
| Common in | classic server-rendered web apps | SPAs, mobile apps, APIs, microservices |

**Stateful vs stateless.** Sessions are **stateful**: the server holds data per user. Tokens are **stateless**: each request carries everything needed. Stateless servers are easier to scale, because any server can answer any request.

**Cookie is the transport, not the type.** People often say "cookies vs tokens", but that compares two different things:
- **How the value travels:** a cookie (sent automatically by the browser) or an `Authorization: Bearer` header (added by your JavaScript).
- **What the value is:** a session ID or a JWT.

You can mix them. A very common setup is a **JWT inside an HttpOnly cookie**. JavaScript can't read it, so [XSS](glossary:xss) can't steal it. Because cookies are sent automatically, you must also protect against [CSRF](glossary:csrf). See [token storage](topic:rest-auth/token-storage).

**Real sessions in Express** use a library like `express-session` with a Redis store, not a plain `Map`. A `Map` is lost when the server restarts, and other servers can't see it.

**The hybrid most APIs use.** A short-lived access token (stateless, fast) plus a long-lived refresh token that **is** stored on the server (stateful, revocable). This gives most of the benefits of both. See [refresh tokens](topic:rest-auth/refresh-tokens).

## 🎯 Why do we use it?

HTTP is stateless. Without sessions or tokens, the user would have to send their password with every request. Both methods let a user log in once and stay logged in safely. Choosing the right one affects scaling, logout and security.

## ⚠️ Common mistakes

- **Storing sessions in server memory with several servers.** The user is logged in on server A but "logged out" on server B. Use a shared store.
- **Thinking JWTs can be cancelled like sessions.** Deleting the token on the client doesn't stop a stolen copy. See [logout and revocation](topic:rest-auth/logout-revocation).
- **Putting lots of data in a JWT.** It is sent on every request and anyone can read it. Keep it small: user ID, role, tenant.
- **Using cookies without thinking about CSRF.** Any cookie the browser sends automatically needs `SameSite` or a CSRF token.

## 🗣️ How to answer in an interview

> "With sessions, the server stores the login state, and the browser only holds a random session ID in a cookie. With tokens like JWTs, the user's ID and role are inside a signed token, so the server only verifies the signature and doesn't need to look anything up.
>
> Sessions are easy to revoke, because you just delete them. But with many servers, you need a shared store like Redis. Tokens are stateless, so they scale across servers and microservices easily, but they're hard to revoke before they expire. That's why I usually use short-lived access tokens plus refresh tokens that are stored on the server.
>
> I also separate 'what the value is' from 'how it travels'. A JWT can live in an HttpOnly cookie, which protects it from XSS, as long as I also handle CSRF with SameSite cookies. [FILL IN: if true and you're comfortable — 'that's the setup we use at SkillKeepr: HttpOnly JWT cookies'.]"

## 🔁 Follow-up questions

### Why are tokens popular for microservices?

Each service can verify a JWT by itself with the shared secret or a public key. Nobody has to call a central session store on every request.

### What happens to sessions if the server restarts?

In-memory sessions are lost, and everyone is logged out. Sessions in Redis or a database survive a restart.

### Are sessions more secure than JWTs?

Neither is automatically more secure. Sessions are easier to revoke. JWTs need short expiry times and careful storage. Most security problems come from storage (XSS, CSRF) and expiry, not from the choice itself.

### What is "sticky sessions"?

A load balancer setting that always sends a user to the same server, so in-memory sessions work. It hurts scaling and failover. A shared store is the better fix.

## ✅ Quick check

### 1. You need users to be logged out **immediately** when an admin disables their account. Which is simpler?

- A) Long-lived JWTs with no server storage
- B) Server-side sessions

:::answer
**B.** Delete or disable the session, and the very next request fails. With plain JWTs, the token keeps working until it expires.
:::

### 2. True or false: if you store a JWT in a cookie, you are now using sessions.

:::answer
**False.** The cookie is only how the token travels. It is still a stateless token, because the server stores nothing about it.
:::

### 3. Your app runs on 3 servers with in-memory sessions. Users randomly get logged out. Why?

:::answer
Each server has its own memory. A request that hits a different server can't find the session. Move sessions to a shared store like Redis (or use sticky sessions as a weaker fix).
:::
