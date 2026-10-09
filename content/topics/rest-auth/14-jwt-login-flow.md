---
title: JWT login flow end to end
stack: rest-auth
order: 14
level: Intermediate
mustKnow: true
askedFrequency: very common
summary:
  - "Step 1: the client sends email + password to POST /login over HTTPS."
  - "Step 2: the server finds the user, checks the password with bcrypt.compare, and signs a short-lived JWT with the user id and role."
  - "Step 3: the client sends the token on every request (Authorization: Bearer <token>, or an HttpOnly cookie)."
  - "Step 4: auth middleware verifies the token, puts the user on req.user, and the route runs. Bad or expired token → 401."
  - "Same error for 'no such email' and 'wrong password', short expiry, refresh tokens, rate-limit the login route."
cards:
  - q: Walk through JWT authentication end to end.
    a: "Login with email + password → find user → bcrypt.compare → jwt.sign({ sub, role }, secret, { expiresIn }) → client stores token → sends it each request → middleware jwt.verify → req.user → role check → route."
  - q: Why return the same message for a wrong email and a wrong password?
    a: So attackers can't find out which emails are registered (user enumeration).
  - q: What goes in the token payload?
    a: "Only what you need per request: the user id (sub), role, maybe tenant id. Never the password or private data."
  - q: What does the auth middleware do when the token is expired?
    a: "jwt.verify throws, the middleware returns 401, and the client uses its refresh token or sends the user to login."
  - q: How do you protect the login endpoint itself?
    a: "HTTPS only, rate limiting per IP and per account, generic error messages, and optionally a lockout or CAPTCHA after many failures."
---

## 💡 What is it?

This is the **whole journey** of logging in with a [JWT](glossary:jwt). It runs from typing a password to calling a protected API.

It has four steps:
1. **Log in:** the client sends email and password.
2. **Get a token:** the server checks the password and sends back a signed token.
3. **Send the token:** the client attaches the token to every request.
4. **Check the token:** the server verifies it and lets the request through.

## 🏠 Real-life example

Think of **a school exam**.

1. At the gate, you show your **admit card and ID**. The staff check your face against the photo. (Log in.)
2. They give you a **hall pass** with your seat number and today's date. (Get a token.)
3. Every time you go out and come back in, you **show the hall pass**. (Send the token.)
4. The invigilator **checks the stamp and the date** on the pass. Then you go to your seat. (Check the token.)

- **Admit card + face check** = email + password + `bcrypt.compare`.
- **Hall pass** = the JWT.
- **Seat number on the pass** = the role and user ID in the payload.
- **"Valid today only"** = the `exp` (expiry) claim.
- **An invigilator rejecting a fake or old pass** = 401.

## 🧑‍💻 Code example

Set up: `npm init -y`, then `npm install express bcrypt jsonwebtoken`. Save as `login-flow.js` and run `node login-flow.js`.

```js
const express = require('express');                         // load Express
const bcrypt = require('bcrypt');                           // for password hashes
const jwt = require('jsonwebtoken');                        // for tokens
const app = express();                                      // create the app
app.use(express.json());                                    // read JSON request bodies
const SECRET = process.env.JWT_SECRET ?? 'dev-secret';      // in real apps, always from an env variable

const users = [{ id: 'u1', email: 'asha@example.com', role: 'recruiter', passwordHash: bcrypt.hashSync('Pass@123', 10) }]; // a fake "database" (signup already happened)

app.post('/login', async (req, res) => {                    // step 1: log in
  const { email, password } = req.body;                     // what the user typed
  const user = users.find((u) => u.email === email);        // find the user by email
  const ok = user && (await bcrypt.compare(password, user.passwordHash)); // check the password against the hash
  if (!ok) return res.status(401).json({ error: 'Wrong email or password' }); // same message for both cases
  const token = jwt.sign({ sub: user.id, role: user.role }, SECRET, { expiresIn: '15m' }); // sub = user id
  res.json({ token });                                      // send the token to the client
});                                                         // end of /login

function requireAuth(req, res, next) {                      // step 3: check the token on every protected request
  const token = req.headers.authorization?.split(' ')[1];   // "Bearer <token>" → "<token>"
  if (!token) return res.status(401).json({ error: 'No token' }); // nothing sent
  try {                                                     // verify can throw
    req.user = jwt.verify(token, SECRET);                   // valid → save the payload on req
    next();                                                 // go to the route
  } catch {                                                 // bad signature or expired
    res.status(401).json({ error: 'Invalid or expired token' }); // 401 again
  }                                                         // end of try/catch
}                                                           // end of requireAuth

app.get('/me', requireAuth, (req, res) => {                 // a protected route
  res.json({ userId: req.user.sub, role: req.user.role });  // data comes from the token
});                                                         // end of /me

const server = app.listen(3000, async () => {               // start, then act like a client
  const post = (body) => fetch('http://localhost:3000/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }); // helper
  const bad = await post({ email: 'asha@example.com', password: 'nope' }); // wrong password
  console.log('wrong password →', bad.status);              // 401
  const { token } = await (await post({ email: 'asha@example.com', password: 'Pass@123' })).json(); // right password
  console.log('got token →', token.slice(0, 20) + '...');   // step 2: the client keeps it
  const me = await fetch('http://localhost:3000/me', { headers: { Authorization: `Bearer ${token}` } }); // send it back
  console.log('/me with token →', me.status, JSON.stringify(await me.json())); // 200
  const noToken = await fetch('http://localhost:3000/me');  // forget the token
  console.log('/me without token →', noToken.status);       // 401
  server.close();                                           // stop the server
});                                                         // end of listen
```

**Output:**

```text
wrong password → 401
got token → eyJhbGciOiJIUzI1NiIs...
/me with token → 200 {"userId":"u1","role":"recruiter"}
/me without token → 401
```

(`hashSync` is used only to build the fake user at startup. Inside routes, always use the async `bcrypt.compare`.)

## 🔍 Deeper version

**The full flow, with the parts real apps add:**

```text
Client                                   Server
  │ POST /login {email, password} ──────►│ rate limit check
  │                                      │ find user by email (lower-cased)
  │                                      │ bcrypt.compare(password, hash)
  │                                      │ check: account active? email verified?
  │                                      │ sign access token (15 min) + refresh token
  │◄────── token (body or HttpOnly cookie)│
  │ GET /jobs  Authorization: Bearer … ─►│ requireAuth: jwt.verify (algorithm pinned)
  │                                      │ load/check permissions → 403 if not allowed
  │◄────────────── 200 data ─────────────│
  │ … 15 minutes later: 401 expired      │
  │ POST /refresh (refresh token) ──────►│ rotate refresh token, issue new access token
```

**Design choices to talk about:**
- **Where the token travels:** an `Authorization: Bearer` header (common for mobile apps and APIs), or an **HttpOnly cookie** (safer in browsers against [XSS](glossary:xss)). See [token storage](topic:rest-auth/token-storage).
- **Expiry:** short access tokens (5–15 min) plus [refresh tokens](topic:rest-auth/refresh-tokens).
- **What to put in the token:** `sub`, `role`, and in multi-tenant apps the tenant ID. The server can then reject a token used on the wrong tenant.
- **Fresh permissions:** the role in a token can be stale until it expires. For sensitive actions, re-check the user in the database.

**Security details interviewers like:**
- **User enumeration:** answer "Wrong email or password" for both cases. Some teams also run `bcrypt.compare` against a dummy hash when the email doesn't exist, so both cases take similar time.
- **Rate limiting** on `/login`: limit attempts per IP **and** per account, and add a lockout or CAPTCHA after repeated failures. See [security middleware](topic:express/security-middleware).
- **HTTPS everywhere:** passwords and tokens must never travel over plain HTTP.
- **Log events, not secrets:** log "login failed for user X from IP Y". Never log passwords or tokens.

**Express middleware pieces.** See [custom middleware](topic:express/custom-middleware) for `requireAuth` and role checks, and [error middleware](topic:express/error-middleware) for one consistent 401/403 format.

## 🎯 Why do we use it?

- The user logs in **once** and stays logged in for the session.
- The server doesn't store per-user login state for the access token, so it scales easily.
- Each request carries the user's identity, so authorisation checks are simple.

## ⚠️ Common mistakes

- **Different messages for "no user" and "wrong password".** This leaks which emails are registered.
- **Long-lived access tokens with no refresh.** A stolen token works for days.
- **Forgetting to check the account is still active.** A deleted or blocked user can keep using an old token until it expires.
- **No rate limit on login.** Attackers can try thousands of passwords.
- **Storing the token in `localStorage` without thinking about XSS.**

## 🗣️ How to answer in an interview

> "The client sends email and password to the login endpoint over HTTPS. The server finds the user, compares the password with the stored bcrypt hash, and if it matches, signs a short-lived JWT. The JWT holds the user ID as `sub` and the role. I return the same 'wrong email or password' message in both failure cases, so nobody can find out which emails exist.
>
> The client sends the token on each request, either as a Bearer header or in an HttpOnly cookie. An auth middleware calls `jwt.verify`. If it's missing, invalid or expired, it returns 401. Otherwise it puts the user on `req.user`. Then a permission check returns 403 if the role isn't allowed.
>
> Around that, I add rate limiting on login, short expiry with refresh tokens, and HTTPS everywhere. [FILL IN: if true — 'At SkillKeepr, auth uses HttpOnly JWT cookies, and the tenant is locked inside the JWT, so a token from one company can't be used on another company's site.']"

## 🔁 Follow-up questions

### Where do you store the JWT secret?

In an environment variable or a secret manager, never in code or Git. Use a long random value. See [environment variables](topic:nodejs/environment-variables).

### What if the user changes their password? Should old tokens still work?

Usually not. Store a `tokenVersion` (or "password changed at" time) on the user. Put it in the token and reject tokens with an older version. See [logout and revocation](topic:rest-auth/logout-revocation).

### How would you add "remember me"?

Give a longer-lived refresh token when "remember me" is ticked, and a shorter one otherwise. Keep the access token short in both cases.

### How do multiple tabs share the login?

With cookies, all tabs share it automatically. With `localStorage`, all tabs read the same value, and you can listen to the `storage` event to log out every tab together.

## ✅ Quick check

### 1. Put these steps in order: (a) `jwt.verify`, (b) `bcrypt.compare`, (c) `jwt.sign`, (d) client sends `Authorization: Bearer`.

:::answer
**b → c → d → a.** Check the password, sign a token, the client sends it on later requests, and the middleware verifies it.
:::

### 2. What's wrong with this login reply? `if (!user) return res.status(404).json({ error: 'Email not found' })`

:::answer
It tells attackers which emails are registered. Return **401** with a generic "Wrong email or password" for both a missing user and a wrong password.
:::

### 3. The access token expired 1 minute ago. What should `/me` return?

- A) 200 with the old data
- B) 401
- C) 403

:::answer
**B) 401.** The token no longer proves who the user is. The client should refresh the token or log in again.
:::
