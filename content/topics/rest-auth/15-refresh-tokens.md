---
title: Access tokens and refresh tokens (rotation)
stack: rest-auth
order: 15
level: Intermediate
mustKnow: true
askedFrequency: very common
summary:
  - "Access token: short life (5–15 min), sent on every request, checked quickly without a database."
  - "Refresh token: long life (days), used ONLY to get a new access token, and stored on the server so it can be cancelled."
  - "When the access token expires, the client calls /refresh and gets a new one, so the user stays logged in."
  - "Rotation: every refresh gives a NEW refresh token and kills the old one. If an old one is used again, it was probably stolen → log that user out everywhere."
  - "Store refresh tokens hashed in the database, and send them in an HttpOnly cookie limited to the refresh path."
cards:
  - q: Why use two tokens instead of one long-lived token?
    a: "A short access token limits damage if it's stolen. The refresh token, kept safer and stored on the server, lets the user stay logged in and can be revoked."
  - q: What is refresh token rotation?
    a: Each time a refresh token is used, the server issues a new one and invalidates the old one. Each refresh token works only once.
  - q: What is reuse detection?
    a: If an already-used refresh token comes back, someone copied it. The server revokes the whole token family and forces a new login.
  - q: Where should the refresh token live in the browser?
    a: In an HttpOnly, Secure, SameSite cookie, ideally with a path like /auth/refresh, so JavaScript can't read it and it isn't sent to every API call.
  - q: What should the frontend do on a 401 from an expired access token?
    a: Call /refresh once, queue other requests while it waits, retry them with the new token, and send the user to login if refresh fails.
---

## 💡 What is it?

Most apps use **two tokens** after login.

- **Access token:** a short-lived [JWT](glossary:jwt), valid for maybe **15 minutes**. You send it on every API call.
- **[Refresh token](glossary:refresh-token):** a long-lived token, valid for maybe **7–30 days**. You use it **only** to get a new access token when the old one expires.

**Rotation** means every time you use a refresh token, you get a **new** one, and the old one stops working.

## 🏠 Real-life example

Think of **a hostel with day passes**.

Every morning, you get a **day pass** at the warden's office. You show it at the gate, the mess and the library all day. At night it expires.

You also have your **hostel ID card**. You show it **only at the warden's office** to get the next day pass.

- The **day pass** = the access token. It is used everywhere and expires fast.
- The **hostel ID card** = the refresh token. It is used in one place only.
- The **warden's register** = the server's list of valid refresh tokens.
- **Rotation:** each morning, the warden gives you a **new ID card** and tears up the old one.
- If someone later shows the **old, torn-up card**, the warden knows it was copied. She **cancels all your cards**, and you must come in person (log in again).

## 🧑‍💻 Code example

Set up: `npm init -y`, then `npm install jsonwebtoken`. Save as `refresh.js` and run `node refresh.js`.

```js
const jwt = require('jsonwebtoken');                        // npm install jsonwebtoken
const crypto = require('node:crypto');                      // for random refresh tokens
const SECRET = 'dev-secret';                                // signs access tokens
const validRefresh = new Map();                             // refreshToken → userId (a DB table in real apps)

function login(userId) {                                    // give a fresh pair of tokens
  const access = jwt.sign({ sub: userId }, SECRET, { expiresIn: '1s' }); // short life (1 second here, 15 min in real apps)
  const refresh = crypto.randomUUID();                      // long-lived, random, stored on the server
  validRefresh.set(refresh, userId);                        // remember it
  return { access, refresh };                               // send both to the client
}                                                           // end of login

function refreshTokens(oldRefresh) {                        // swap an old refresh token for a new pair
  const userId = validRefresh.get(oldRefresh);              // is it still valid?
  if (!userId) return 'REJECTED: refresh token is not valid (maybe reused or stolen)'; // reuse → refuse
  validRefresh.delete(oldRefresh);                          // ROTATION: the old one can't be used again
  return login(userId);                                     // issue a brand-new pair
}                                                           // end of refreshTokens

async function main() {                                     // run the story
  const first = login('u1');                                // user logs in
  console.log('access works:', jwt.verify(first.access, SECRET).sub); // u1
  await new Promise((r) => setTimeout(r, 1500));            // wait 1.5 s, so the access token expires
  try { jwt.verify(first.access, SECRET); } catch (e) { console.log('after 1.5s:', e.message); } // jwt expired
  const second = refreshTokens(first.refresh);              // use the refresh token
  console.log('refreshed, new access works:', jwt.verify(second.access, SECRET).sub); // u1 again
  console.log('reuse old refresh token:', refreshTokens(first.refresh)); // rotation blocks it
}                                                           // end of main

main();                                                     // run it
```

**Output:**

```text
access works: u1
after 1.5s: jwt expired
refreshed, new access works: u1
reuse old refresh token: REJECTED: refresh token is not valid (maybe reused or stolen)
```

The user stayed logged in after the access token expired. The old refresh token couldn't be used twice.

## 🔍 Deeper version

| | Access token | Refresh token |
|---|---|---|
| Lifetime | 5–15 minutes | days or weeks |
| Sent to | every API request | only `/auth/refresh` |
| Format | usually a JWT (stateless) | usually a random string (stateful), sometimes a JWT |
| Stored on server? | no | yes (hashed), so it can be revoked |
| If stolen | useful for minutes | dangerous, so rotation + reuse detection |

**The refresh endpoint, step by step:**
1. Read the refresh token (from an HttpOnly cookie, or the request body for mobile apps).
2. Hash it and look it up in the database. Is it there, not expired, not revoked?
3. **Rotate:** mark the old one used or revoked, and create a new refresh token.
4. Sign a new access token.
5. Return both (set the new refresh cookie).

**Reuse detection.** Tokens from the same login form a **family**. If a token that was **already rotated** shows up again, either the real user or an attacker has an old copy. You can't tell which. So the safe answer is: **revoke the whole family**. Everyone has to log in again. The real user is annoyed for a moment, but the attacker is locked out.

**Store refresh tokens hashed.** Like passwords, store `sha256(refreshToken)` in the database, not the token itself. A leaked database then can't be used to log in. (A fast hash is fine here, because refresh tokens are long and random, unlike passwords.)

**Cookie settings for the refresh token:**
`HttpOnly; Secure; SameSite=Strict` (or `Lax`) and `Path=/auth/refresh`. The path means the browser sends it only to the refresh endpoint, not to every API call. See [token storage](topic:rest-auth/token-storage).

**On the frontend.** When an API call returns 401 because the access token expired:
1. Call `/auth/refresh` **once**, even if 5 requests failed at the same time.
2. **Queue** the other failed requests while refresh is running.
3. Retry them with the new access token.
4. If refresh fails, clear the state and send the user to login.

Without the queue, five parallel refresh calls race each other. With rotation, all but one fail, and the user is logged out "randomly". See the [random logouts debugging scenario](topic:debugging/random-logouts).

**Sliding vs absolute expiry.** Rotation can extend the session forever while the user is active (sliding). Many apps also set an **absolute** limit (for example 30 days) after which the user must log in again.

## 🎯 Why do we use it?

- **Security:** a stolen access token works only for minutes.
- **Good user experience:** users don't have to log in every 15 minutes.
- **Control:** because refresh tokens are stored on the server, you can log a user out of all devices, or block a user immediately at the next refresh.

## ⚠️ Common mistakes

- **Long-lived access tokens** "because refresh is complicated". That defeats the purpose.
- **Refresh tokens that never change.** Without rotation, a stolen refresh token works for weeks.
- **Storing refresh tokens in `localStorage`.** Any [XSS](glossary:xss) bug can steal them. Use HttpOnly cookies in browsers.
- **Parallel refresh calls from the frontend.** They race each other and cause random logouts.
- **Storing refresh tokens in plain text in the database.**

## 🗣️ How to answer in an interview

> "I use a short-lived access token, about 15 minutes, which is a JWT sent on every request and verified without a database lookup. I also use a long-lived refresh token, which is only sent to the refresh endpoint. I store the refresh token hashed in the database, so I can revoke it.
>
> When the access token expires, the client calls refresh. The server checks the refresh token, rotates it, so the old one stops working and a new one is issued, and returns a new access token. If an old, already-used refresh token comes back, that means it was copied, so I revoke the whole token family and force a new login.
>
> In the browser, I keep the refresh token in an HttpOnly, Secure, SameSite cookie limited to the refresh path. On the frontend, I make sure only one refresh call runs at a time, and other requests wait for it. Otherwise you get random logouts."

## 🔁 Follow-up questions

### Why not just make the access token last 30 days?

If it's stolen, the attacker has 30 days of access, and you can't easily cancel a JWT. Short access tokens plus revocable refresh tokens give security and convenience together.

### Should the refresh token be a JWT or a random string?

Either works. A random string stored (hashed) in the database is simple and easy to revoke. A JWT refresh token still needs a server-side record if you want rotation and revocation.

### How do you log a user out of all devices?

Delete or revoke all their refresh tokens in the database. Their access tokens die within minutes. For instant effect, also bump a `tokenVersion` on the user. See [logout and revocation](topic:rest-auth/logout-revocation).

### What happens to a mobile app with no cookies?

It stores the refresh token in the phone's secure storage (Keychain on iOS, Keystore on Android) and sends it in the body of the refresh request.

## ✅ Quick check

### 1. Which token is sent with every API request?

- A) Access token
- B) Refresh token

:::answer
**A) Access token.** The refresh token is sent only to the refresh endpoint.
:::

### 2. With rotation on, refresh token R1 was already swapped for R2. Now R1 arrives again. What should the server do?

:::answer
Reject it, and treat it as possible theft: **revoke the whole family** (R2 too) and make the user log in again.
:::

### 3. Five API calls fail with 401 at the same moment. How many times should the frontend call `/refresh`?

:::answer
**Once.** Queue the other requests until the single refresh finishes, then retry them all with the new access token.
:::
