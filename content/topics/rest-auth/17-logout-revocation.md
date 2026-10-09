---
title: Logout and token revocation
stack: rest-auth
order: 17
level: Advanced
mustKnow: false
askedFrequency: common
summary:
  - "A JWT keeps working until it expires, even after 'logout', because the server stores nothing about it."
  - "Real logout = clear the cookie AND revoke the refresh token on the server."
  - "To kill an access token early: a denylist of token ids (jti) until they expire, or a tokenVersion on the user that you bump."
  - "Short access-token expiry keeps the risky window small, so most apps only revoke refresh tokens."
  - "'Log out of all devices' = delete all the user's refresh tokens and bump their tokenVersion."
cards:
  - q: Why doesn't deleting the JWT on the client fully log the user out?
    a: If someone copied the token, it still works until it expires. The server never checks a list for plain JWTs.
  - q: What is a token denylist?
    a: A server-side list (often in Redis) of revoked token ids (jti). The auth middleware rejects any token on the list. Each entry is kept only until that token would expire anyway.
  - q: What is a tokenVersion?
    a: A number stored on the user and copied into each token. Bumping it (on password change or 'log out everywhere') makes all older tokens invalid.
  - q: What should POST /logout do?
    a: Revoke the refresh token in the database, clear the auth cookies, and optionally add the current access token's jti to a denylist.
  - q: Why are short-lived access tokens part of the answer?
    a: If access tokens live only 5–15 minutes, even without a denylist a revoked user loses access very soon, at their next refresh.
---

## 💡 What is it?

**Logout** sounds simple: forget the token. But a [JWT](glossary:jwt) is **stateless**. The server doesn't keep a list of tokens, so it can't "forget" one.

**Revocation** means making a token stop working **before** its expiry time. You need it for:
- a normal logout,
- "log out of all devices",
- a password change,
- blocking a user or a stolen token.

## 🏠 Real-life example

Think of **a movie ticket with a show time printed on it**.

If you tear up your ticket, you can't use it. But if someone took a **photocopy**, the copy still works until the show starts, because the gate only checks the printed time and the stamp.

To stop the copy, the cinema keeps a **"cancelled tickets" list** at the gate. The guard checks every ticket against it.

- The **ticket** = the access token.
- **Tearing up your own ticket** = deleting the token on the client.
- The **photocopy** = a stolen token.
- The **cancelled list at the gate** = a denylist on the server.
- The **show time** = `exp`. After it passes, the ticket is useless anyway, so the cancelled list can forget it.

## 🧑‍💻 Code example

Set up: `npm init -y`, then `npm install express jsonwebtoken`. Save as `logout.js` and run `node logout.js`.

```js
const express = require('express');                         // load Express
const jwt = require('jsonwebtoken');                        // npm install jsonwebtoken
const crypto = require('node:crypto');                      // to give every token a unique id
const app = express();                                      // create the app
const SECRET = 'dev-secret';                                // signs tokens
const revoked = new Map();                                  // denylist: token id (jti) → its expiry time (Redis in real apps)

function requireAuth(req, res, next) {                      // check the token on each request
  try {                                                     // verify can throw
    const payload = jwt.verify(req.headers.authorization?.split(' ')[1], SECRET); // signature + expiry check
    if (revoked.has(payload.jti)) return res.status(401).json({ error: 'Token revoked' }); // logged out already
    req.user = payload;                                     // remember the user
    next();                                                 // allowed
  } catch {                                                 // bad or expired token
    res.status(401).json({ error: 'Invalid token' });       // refuse
  }                                                         // end of try/catch
}                                                           // end of requireAuth

app.post('/login', (req, res) => {                          // log in (password check skipped)
  res.json({ token: jwt.sign({ sub: 'u1', jti: crypto.randomUUID() }, SECRET, { expiresIn: '15m' }) }); // jti = unique token id
});                                                         // end of /login
app.get('/me', requireAuth, (req, res) => res.json({ userId: req.user.sub })); // protected route
app.post('/logout', requireAuth, (req, res) => {            // log out
  revoked.set(req.user.jti, req.user.exp);                  // add THIS token to the denylist until it expires
  res.json({ ok: true });                                   // done
});                                                         // end of /logout

const server = app.listen(3000, async () => {               // start, then test
  const url = (p) => `http://localhost:3000${p}`;           // helper for URLs
  const { token } = await (await fetch(url('/login'), { method: 'POST' })).json(); // log in
  const auth = { Authorization: `Bearer ${token}` };        // header with the token
  console.log('before logout:', (await fetch(url('/me'), { headers: auth })).status); // 200
  await fetch(url('/logout'), { method: 'POST', headers: auth }); // log out
  const after = await fetch(url('/me'), { headers: auth }); // same token again
  console.log('after logout:', after.status, JSON.stringify(await after.json())); // 401 Token revoked
  server.close();                                           // stop the server
});                                                         // end of listen
```

**Output:**

```text
before logout: 200
after logout: 401 {"error":"Token revoked"}
```

The same token worked before logout and was refused after, even though it hadn't expired yet.

## 🔍 Deeper version

**Four ways to revoke, from simplest:**

| Approach | How | Good for | Cost |
|---|---|---|---|
| **Short expiry only** | access token lives 5–15 min | most apps | a revoked user keeps access for a few minutes |
| **Revoke refresh tokens** | delete or mark them in the DB | logout, "log out everywhere", blocking users | access token still works until it expires |
| **Denylist of `jti`** | store revoked token ids until their `exp` | instant logout of one token | a fast lookup (Redis) on every request |
| **`tokenVersion` on the user** | put `ver` in the token; reject if `ver < user.tokenVersion` | password change, "log out everywhere" | read the user (or a cached version) per request |

**A good logout endpoint:**
1. Revoke the current **refresh token** in the database. This is the most important step.
2. Clear the auth cookies: `res.clearCookie('access_token')`, using the same `path` and `domain` used when setting them.
3. Optionally, denylist the current access token's `jti` until its `exp`, if you need instant logout.
4. On the frontend: clear any in-memory state and redirect to login.

**Keep the denylist small.** Store each `jti` only until the token's `exp`. After that, the token fails anyway. In Redis, use `SET revoked:<jti> 1 EX <seconds-left>`, so entries delete themselves. See [TTL indexes](topic:mongodb/special-indexes) for the MongoDB way of doing the same.

**"Log out of all devices":** delete all the user's refresh tokens, **and** bump `tokenVersion`, so even unexpired access tokens fail. Do the same after a password change or a suspected account takeover.

**Is it still "stateless"?** Not fully. Any revocation check brings back some server state. That's a normal trade-off: keep the check small and fast (an in-memory or Redis lookup), and keep access tokens short.

**Sessions make this easy.** With [server-side sessions](topic:rest-auth/sessions-vs-tokens), logout is just "delete the session". This is one of the main reasons some teams still choose sessions.

## 🎯 Why do we use it?

- **Users expect logout to work**, especially on shared or lost devices.
- **Security incidents** (a stolen token, a fired employee, a hacked account) need a way to cut access now, not in 7 days.
- **Password changes** should end other sessions.

## ⚠️ Common mistakes

- **Logout only on the frontend.** The token is removed from the browser, but the refresh token is still valid on the server.
- **`clearCookie` with different options** than `res.cookie` used (path or domain). The cookie isn't removed.
- **A denylist that grows forever.** Store entries only until the token's expiry.
- **Long-lived access tokens and no revocation.** Then "logout" means nothing for days.

## 🗣️ How to answer in an interview

> "Because a JWT is stateless, deleting it on the client doesn't revoke it. A copied token keeps working until it expires. So real logout has two parts. On the server, I revoke the refresh token in the database and clear the auth cookies. And I keep access tokens short, 5 to 15 minutes, so the window is small.
>
> If I need instant revocation, I add a `jti` to each token and keep a denylist in Redis, with each entry expiring when the token would expire anyway. For 'log out of all devices' or after a password change, I delete all the user's refresh tokens and bump a `tokenVersion` on the user, so every older token is rejected.
>
> The trade-off is that any revocation check adds some state back. I keep it as a small, fast lookup."

## 🔁 Follow-up questions

### Why not just use a very short access token and skip the denylist?

That's what many apps do. With 5-minute tokens, a revoked user loses access at the next refresh. A denylist is only worth it when even minutes are too long, for example in banking or admin panels.

### Where would you store the denylist?

In Redis, with an expiry per key. It's fast, shared by all servers, and cleans itself. A database table with a TTL index also works, but is slower per request.

### What happens to the denylist if Redis is down?

You decide in advance: **fail closed** (reject requests, safer) or **fail open** (allow, more available). For auth, failing closed is usually the safer choice. Monitor Redis closely.

### How does a password change log out other devices?

Bump the user's `tokenVersion` and delete their refresh tokens. All old tokens carry an older version and are rejected. The current device gets a fresh pair.

## ✅ Quick check

### 1. A user clicks "Log out", and the frontend deletes the token from memory. An attacker copied that token 2 minutes ago. Can the attacker still use it?

:::answer
**Yes**, until it expires, unless the server revokes it (with a denylist or `tokenVersion`). That's why logout must also happen on the server.
:::

### 2. How long should a revoked `jti` stay in the denylist?

- A) Forever
- B) Until the token's `exp` time
- C) 1 minute

:::answer
**B.** After `exp`, `jwt.verify` rejects the token anyway, so keeping it longer just wastes memory.
:::

### 3. Which is the single most important step in a logout endpoint when you use refresh tokens?

:::answer
**Revoke the refresh token on the server.** Without that, the client (or an attacker) can keep getting new access tokens.
:::
