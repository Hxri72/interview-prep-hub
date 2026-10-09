---
title: Auth errors after a deploy
template: scenario
stack: debugging
order: 30
level: Intermediate
mustKnow: false
askedFrequency: sometimes
summary:
  - Right after a deploy, some or all users get 401s or are logged out. Something about auth config changed.
  - "Common causes: a different or missing JWT secret, servers with different secrets, changed cookie settings (domain, SameSite, secure), or a changed token format."
  - Compare environment variables and config between the old and new version first.
  - Roll back quickly if users are blocked, then fix forward with a gradual key rotation.
  - Prevent it with config checks at startup, the same secrets on every instance, health checks and staged rollouts.
cards:
  - q: Users get 401 only after a deploy. What do you check first?
    a: What changed in auth config between the old and new version — the JWT secret, cookie settings, token expiry — and whether every server got the same values.
  - q: Why do only SOME requests fail with 401 after a deploy?
    a: Different servers have different secrets (or old and new versions run side by side). A token signed by one server fails on another.
  - q: How do you rotate a JWT secret without logging everyone out?
    a: Sign new tokens with the new key, but accept both old and new keys for a while (for example using a key id, "kid"). Remove the old key after tokens have expired.
  - q: A deploy changed cookie settings and users can't stay logged in. What might be wrong?
    a: "The cookie domain, path, Secure or SameSite value changed, so the browser doesn't send the cookie anymore, or the frontend and API domains no longer match."
  - q: What should happen if a required secret is missing at startup?
    a: The app should fail fast and refuse to start, with a clear log message, so the bad deploy never takes traffic.
---

## 💡 What is it?

You deploy a new version. Suddenly users get **`401 Unauthorized`**, or they are **logged out**, or login **doesn't stick**.

Sometimes **everyone** is affected. Sometimes only **some requests** fail, which is even more confusing.

The code for auth may not have changed at all. Usually the **auth configuration** changed: a secret, a cookie setting, or a token format.

## 🏠 Real-life example

Think of **school ID cards with a special stamp**.

The office stamps every ID card. The guard at the gate checks the stamp.

One day, the office **gets a new stamp**. But nobody told the guards. Now every old ID card "looks fake", and students are stopped at the gate.

Worse: the **morning guard has the new stamp design**, and the **evening guard has the old one**. So the same card works in the morning and fails in the evening.

- **The stamp** = the JWT secret that signs tokens.
- **The ID card** = the token (or the cookie that carries it).
- **The guards** = your servers checking tokens.
- **Guards with different stamp designs** = servers with different secrets.
- **Telling guards to accept both stamps for a week** = a gradual **key rotation**.

## 🔎 Detect

- **Error spike right after the deploy time:** many `401` or `440` (session expired) responses.
- **Pattern:** all users? Only users who logged in before the deploy? Only some requests, at random?
- **Support tickets:** "I keep getting logged out", "login works then fails".
- **Logs:** messages like `invalid signature`, `jwt malformed`, or "token missing" (the cookie was not sent).

## 🐞 Debug

1. **Line up the timing.** Did the errors start exactly at the deploy? Then it's almost certainly config or code from that deploy.
2. **Compare config, old vs new.** Check every auth-related [environment variable](glossary:environment-variable): the JWT secret, token expiry, cookie domain, allowed origins. A missing value may become `undefined` or an empty string.
3. **Check every instance.** Do all servers (or containers or functions) have the **same** secret? A random-failure pattern points here.
4. **Decode a failing token** (for example at jwt.io, using a test token, never a real user's). Check the algorithm, the `exp` time and the claims. Did the token format change?
5. **Check cookies in the browser DevTools.** Is the cookie still set? Is it sent with the API request? Look at `Domain`, `Path`, `Secure` and `SameSite`.
6. **Check old and new versions running together** during a rolling deploy. Do they create or expect different tokens?

## 🔧 Fix

**Before:** the secret can silently be missing, and only one key is accepted.

```js
// ❌ BEFORE — a missing secret doesn't stop the app, and a key change logs everyone out
const jwt = require('jsonwebtoken');                            // library to sign and check JWTs
const SECRET = process.env.JWT_SECRET || 'dev-secret';          // if the env var is missing, a weak default is used!

function verifyToken(token) {                                   // check a token from a request
  return jwt.verify(token, SECRET);                             // only this one key is accepted
}                                                               // end of verifyToken
```

**After:** fail fast at startup, and accept the old key during a rotation.

```js
// ✅ AFTER — required config is checked at startup, and keys rotate safely
const jwt = require('jsonwebtoken');                            // library to sign and check JWTs

const KEYS = {                                                  // all keys we currently accept, by key id
  k2: process.env.JWT_SECRET_CURRENT,                           // the new key: used to sign new tokens
  k1: process.env.JWT_SECRET_PREVIOUS,                          // the old key: only to accept old tokens for a while
};                                                              // end of KEYS
if (!KEYS.k2) {                                                 // the current secret must exist
  console.error('JWT_SECRET_CURRENT is missing — refusing to start'); // a clear log message
  process.exit(1);                                              // stop now: this bad deploy never takes traffic
}                                                               // end of the startup check

function signToken(payload) {                                   // create a token at login
  return jwt.sign(payload, KEYS.k2, { expiresIn: '1h', keyid: 'k2' }); // sign with the new key; "kid" header = k2
}                                                               // end of signToken

function verifyToken(token) {                                   // check a token from a request
  const { header } = jwt.decode(token, { complete: true }) || {}; // read the header without checking yet
  const secret = KEYS[header?.kid];                             // pick the key the token says it was signed with
  if (!secret) throw new Error('Unknown key id');               // a key we don't accept (or no kid at all)
  return jwt.verify(token, secret, { algorithms: ['HS256'] });  // now really check it; allow only HS256
}                                                               // end of verifyToken
```

**What the values mean:**
- `expiresIn: '1h'` = the token is valid for 1 hour.
- `keyid: 'k2'` = writes `kid: "k2"` in the token header, so the server knows which key to use.
- `algorithms: ['HS256']` = only accept this signing method, so nobody can trick the check with another algorithm.

After every old token has expired (here, after 1 hour; longer if refresh tokens use the old key too), you can **remove `k1`**.

**If users are blocked right now: roll back first.** Redeploy the previous version (or restore the old secret), then fix forward calmly.

## 🛡️ Prevent

- **Validate config at startup.** Missing or empty secrets stop the app. Many teams check all env vars with a schema (for example Zod). See [environment variables](topic:nodejs/environment-variables).
- **One source of truth for secrets** (a secrets manager), so every instance gets the same values.
- **Plan key rotation** with key ids, accepting old and new keys for a while.
- **Staged rollouts and health checks.** Send a little traffic to the new version first, and include a real "login + protected request" check. See [health checks](topic:express/health-checks).
- **A quick rollback** that is tested and takes minutes.
- **Never change cookie settings casually.** `Domain`, `SameSite` and `Secure` decide whether the browser sends the cookie at all.

## 🗣️ How to answer in an interview

**Short version (20 seconds):**

> "If 401s start right after a deploy, I compare auth config between the old and new version — the JWT secret, cookie settings, token format — and check that every instance got the same secret. If users are blocked, I roll back first. Then I prevent it with startup config checks, one secrets source, and key rotation that accepts old and new keys for a while."

**Full version:**

> "The timing tells me it's the deploy. Next I look at the pattern. If everyone fails, the secret or the token format probably changed. If only some requests fail, at random, different instances likely have different secrets, or old and new versions are running side by side.
>
> I compare the environment variables between versions, decode a test token to check `kid`, `exp` and the algorithm, and check in DevTools that the cookie is still set and sent — `Domain`, `SameSite` and `Secure` matter here.
>
> If users can't work, I roll back first. The real fix is to make the app refuse to start if a required secret is missing, to load secrets from one source so all instances match, and to rotate keys safely: sign with the new key, but accept the old key until old tokens expire. A staged rollout with a login health check would catch this before most users see it."

[FILL IN: a real auth problem after a deploy you saw at SkillKeepr or elsewhere, and how you found it. Only if true.]

## 🔁 Follow-up questions

### Why did only users who logged in BEFORE the deploy fail?

Their tokens were signed with the old secret. The new version only knows the new secret. Users who log in again get a new token and work fine. Accepting both keys during the change fixes this.

### What is the `kid` in a JWT?

"Key id". It's a value in the token's header that says which key signed it. The server uses it to pick the right key to check the signature.

### Should a deploy ever change the JWT secret?

Only on purpose, as a planned rotation, or after a leak. In a leak you may *want* to log everyone out. Otherwise, rotate gradually.

### How can cookie changes log users out?

If the cookie's `Domain` or `Path` changes, the browser treats it as a different cookie and may not send the old one. If `Secure` is on but the site uses plain HTTP, the cookie isn't sent. `SameSite=Strict` can block it on some cross-site requests.

## ✅ Quick check

### 1. After a deploy, about half of all requests fail with `invalid signature`, at random. Most likely cause?

:::answer
Servers have **different JWT secrets**, for example one instance got the new secret and another kept the old one. A token signed by one server fails on another.
:::

### 2. What does `process.exit(1)` do in the startup check?

:::answer
It stops the app with an error code (`1` means "failed"). The bad version never starts taking traffic, and the deploy shows as failed.
:::

### 3. You rotated the key. When can you remove the old key `k1`?

:::answer
When every token signed with `k1` has expired. With 1-hour access tokens, after about an hour. If refresh tokens were also signed with `k1`, wait until they expire too.
:::
