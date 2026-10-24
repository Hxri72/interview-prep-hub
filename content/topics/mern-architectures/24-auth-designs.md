---
title: "Auth designs: sessions, JWT cookies, hosted auth"
stack: mern-architectures
order: 24
level: Intermediate
mustKnow: true
askedFrequency: very common
template: pattern
section: State, auth and files
summary:
  - "There are three common ways to do login in a MERN app: server sessions, JWTs (usually in HttpOnly cookies), and hosted auth services like Auth0, Cognito or Clerk."
  - "Sessions keep the login state on the server (often in Redis). The browser only holds a random session ID in a cookie."
  - "JWTs keep the login state inside a signed token. The server checks the signature, so it doesn't need to look anything up."
  - "Hosted auth hands sign-up, passwords, social login and MFA to another company. Your API only checks their tokens."
  - "Store tokens in HttpOnly cookies, not localStorage, so page scripts (and XSS attacks) can't read them."
cards:
  - q: What are the three main auth designs for a MERN app?
    a: Server sessions (session ID in a cookie), JWTs (signed tokens, often in HttpOnly cookies), and hosted auth (Auth0, Cognito, Clerk) where another service handles login.
  - q: Where does the login state live with sessions vs JWTs?
    a: With sessions it lives on the server (memory, Redis or the database). With JWTs it lives inside the signed token the client sends back.
  - q: Why put a JWT in an HttpOnly cookie instead of localStorage?
    a: JavaScript on the page can't read an HttpOnly cookie, so an XSS attack can't steal the token.
  - q: What is the main weakness of a plain JWT?
    a: You can't easily cancel it before it expires. That's why access tokens are short-lived and paired with refresh tokens.
  - q: When does hosted auth make sense?
    a: When you need social login, MFA or enterprise SSO quickly and don't want to build and secure password handling yourself.
---

## 💡 What is it?

**Auth** is how your app knows *who* the user is ([authentication](glossary:authentication)) and *what* they may do ([authorization](glossary:authorization)).

In a MERN app, there are three common designs. You can keep the login on the server (**sessions**). You can put it in a signed token (**JWT**). Or you can let another company handle it (**hosted auth**).

All three end the same way. Each request carries some proof, and the Express API checks it before it answers.

## 🏠 Real-life example

Think of **three ways to enter a gym**.

- **Session = a locker number.** At the desk you get a small card with the number 47. The desk keeps a register: "47 = Asha, paid till March". The card means nothing alone. The desk must check the register every time.
- **JWT = a stamped membership card.** The card itself says "Asha, member till March", with the gym's official stamp. The guard checks the stamp only, and doesn't open any register.
- **Hosted auth = a building pass from the mall security office.** The gym doesn't check IDs at all. The mall's security office does it, and the gym trusts their pass.

Mapping:

| Gym | Web app |
|---|---|
| Locker number card | Session ID in a cookie |
| The desk register | Session store (Redis or MongoDB) |
| Stamped card | JWT with a signature |
| The stamp | The secret key that signs the token |
| Mall security office | Auth0, Cognito or Clerk |

## 🗺️ The diagram

```text
1) SESSIONS
   Browser ──cookie: sid=abc123──▶ Express ──"who is abc123?"──▶ Redis / MongoDB
                                    ◀──────── "Asha, role: admin" ──┘

2) JWT IN AN HttpOnly COOKIE
   Browser ──cookie: token=eyJ...──▶ Express ── checks signature with secret ──▶ ✅ Asha
                                    (no lookup needed)

3) HOSTED AUTH (Auth0 / Cognito / Clerk)
   Browser ──login──▶ Auth provider ──token──▶ Browser
   Browser ──token──▶ Express ── checks token with provider's public key ──▶ ✅ Asha
```

## 🧑‍💻 Code example

This is design 2: a JWT inside an HttpOnly cookie. It is very common in MERN apps.

Set up:

```bash
npm init -y
npm install express jsonwebtoken cookie-parser
```

Save as `auth.js`. Run with `node auth.js`.

```js
const express = require('express');                        // load Express
const jwt = require('jsonwebtoken');                       // library to sign and check JWTs
const cookieParser = require('cookie-parser');             // reads cookies into req.cookies

const app = express();                                     // create the app
app.use(express.json());                                   // read JSON request bodies
app.use(cookieParser());                                   // fill req.cookies on every request
const SECRET = process.env.JWT_SECRET || 'dev-only-secret'; // signing key; use a real secret in production

app.post('/login', (req, res) => {                         // login route
  const { email } = req.body;                              // in a real app, also check the password with bcrypt
  const token = jwt.sign({ sub: email, role: 'user' }, SECRET, { expiresIn: '15m' }); // sub = who, 15m = short life
  res.cookie('token', token, {                             // send the token as a cookie
    httpOnly: true,                                        // page JavaScript can't read it (stops XSS theft)
    secure: process.env.NODE_ENV === 'production',         // only over HTTPS in production
    sameSite: 'lax',                                       // not sent on most cross-site requests (helps against CSRF)
    maxAge: 15 * 60 * 1000,                                // 15 minutes in milliseconds
  });                                                      // end of res.cookie
  res.json({ ok: true });                                  // the body doesn't need the token
});                                                        // end of /login

function requireAuth(req, res, next) {                     // middleware that guards private routes
  try {                                                    // jwt.verify throws if the token is bad
    req.user = jwt.verify(req.cookies.token, SECRET);      // check the signature and expiry, keep the payload
    next();                                                // all good, go to the route
  } catch {                                                // missing, expired or fake token
    res.status(401).json({ error: 'Please log in' });      // 401 = not logged in
  }                                                        // end of try/catch
}                                                          // end of requireAuth

app.get('/me', requireAuth, (req, res) => {                // a private route
  res.json({ email: req.user.sub, role: req.user.role });  // the user from the token
});                                                        // end of /me

app.listen(3000, () => console.log('API on 3000'));        // start on port 3000
```

Try it (`-c` saves cookies to a file, `-b` sends them back):

```text
$ curl -c jar.txt -H "Content-Type: application/json" -d '{"email":"asha@example.com"}' http://localhost:3000/login
{"ok":true}
$ curl -b jar.txt http://localhost:3000/me
{"email":"asha@example.com","role":"user"}
$ curl http://localhost:3000/me
{"error":"Please log in"}
```

In React, call the API with `fetch(url, { credentials: 'include' })`. That tells the browser to send the cookie, even when the API is on another subdomain.

## 🔍 Deeper version

**Comparing the three designs:**

| | Sessions | JWT (HttpOnly cookie) | Hosted auth |
|---|---|---|---|
| Where state lives | Server store (Redis/Mongo) | Inside the token | The provider |
| Check per request | Store lookup | Signature check only | Signature check (provider's public key) |
| Log out / ban a user now | Easy: delete the session | Hard: token is valid until expiry | Provider's revoke + short token life |
| Scaling many servers | Need a shared store | [Stateless](topic:system-design/load-balancers-stateless) | Stateless for your API |
| Works for mobile apps | Yes, with a cookie jar | Yes (cookie or header) | Yes, with SDKs |
| Who builds password, reset, MFA | You | You | The provider |

**Key ideas, in plain words:**
- **Stateless** means the server keeps no memory between requests. JWTs let any server check the user, which suits [serverless](glossary:serverless) and many servers behind a load balancer.
- **Revocation** means cancelling a login before it ends. JWTs can't be "taken back". So access tokens live 5–15 minutes, and a longer [refresh token](glossary:refresh-token) gets new ones. See [refresh tokens](topic:rest-auth/refresh-tokens) and [logout and revocation](topic:rest-auth/logout-revocation).
- **CSRF** ([glossary](glossary:csrf)) is a risk for any cookie. Another site can trick the browser into sending your cookie. `SameSite=Lax` or `Strict`, plus a CSRF token for risky actions, protects you.
- **Hosted auth** uses OAuth 2.0 and OpenID Connect (standard login protocols). Your API checks the token's signature with the provider's public keys (a JWKS URL). See [OAuth](topic:rest-auth/oauth).

**Multi-tenant apps.** You can put the tenant ID inside the token. Then a user from company A can't send requests as company B, because the token is signed. More in [the multi-tenant SaaS scenario](topic:mern-architectures/scenario-multi-tenant-saas).

**Where the token is stored** matters a lot. See [token storage](topic:rest-auth/token-storage):
- `localStorage`: easy, but any script on the page can read it.
- HttpOnly cookie: scripts can't read it, but you must handle CSRF.
- Memory only: safe from both, but lost when the page reloads.

## ⚖️ Pros and cons

| Design | Pros | Cons |
|---|---|---|
| Sessions | Instant logout and ban; small cookie; simple mental model | Needs a shared store (Redis) when you have many servers; a lookup on every request |
| JWT in HttpOnly cookie | No lookup; scales easily; works with serverless; can carry role and tenant | Hard to revoke early; must add refresh tokens; token size grows with claims |
| Hosted auth | Social login, MFA, SSO ready in days; experts handle password security | Monthly cost per user; vendor lock-in; less control over the login screens |

## 🎯 When to choose it

- **Classic server app, one or two servers, admin panel:** sessions with `express-session` and a Redis or MongoDB store.
- **React SPA + Express API, or serverless Lambdas:** JWT in an HttpOnly cookie, with short access tokens and refresh tokens.
- **Startup that needs "Login with Google" and MFA next week:** hosted auth (Auth0, Clerk, Cognito, Firebase Auth).
- **Enterprise customers who want SSO with their own Okta or Azure AD:** hosted auth or a library that supports SAML/OIDC.
- **Mobile app + web app sharing one API:** JWTs (or hosted auth), because the same token works everywhere.

## ⚠️ Common mistakes

- **Storing the JWT in `localStorage`.** One XSS bug and the token is stolen. Prefer an HttpOnly cookie.
- **Long-lived JWTs with no refresh flow.** A token that lasts 30 days can't be cancelled if it leaks.
- **Putting secrets in the JWT payload.** The payload is only base64-encoded, not encrypted. Anyone can read it.
- **Forgetting `credentials: 'include'` and CORS `credentials: true`.** Then the browser silently doesn't send the cookie, and every call returns 401.

## 🗣️ How to answer in an interview

> "There are three common designs. With sessions, the server stores the login state, often in Redis, and the browser only keeps a session ID cookie. It's easy to log someone out, but every server needs the shared store.
>
> With JWTs, the user's ID and role are inside a signed token. Any server can verify it without a lookup, so it scales well and fits serverless. The trade-off is revocation, so I keep access tokens short and use refresh tokens.
>
> The third option is hosted auth, like Auth0 or Cognito. It's great when you need social login, MFA or SSO quickly.
>
> At SkillKeepr the backend uses JWTs in HttpOnly cookies, and the tenant is locked inside the JWT. So a user can't switch tenants by changing a header. I worked on the authentication modules in our shared backend library together with the team."

[FILL IN: which parts of the auth modules you personally wrote, e.g. cookie handling, token checks, role checks — only what you really did.]

## 🔁 Follow-up questions

### How do you log a user out when you use JWTs?

Clear the cookie on the client side of the API (`res.clearCookie('token')`). Also delete or block the refresh token on the server. The current access token still works until it expires, so keep it short (5–15 minutes).

### Sessions or JWT for a serverless backend?

Usually JWT. Lambda functions keep no memory between runs. A JWT can be checked with just the secret, so no shared session store is needed.

### Are cookies safe from CSRF?

Not by default. Use `SameSite=Lax` or `Strict`, check the `Origin` header, and add a CSRF token for state-changing requests if you need cross-site cookies.

### What does `sub` mean in a JWT?

"Subject". It is the standard claim for *who* the token is about, usually the user ID.

## ✅ Quick check

### 1. Which design makes "log this user out right now" easiest?

- A) JWT in localStorage
- B) Server sessions
- C) JWT in an HttpOnly cookie

:::answer
**B.** You delete the session from the store, and the next request fails at once.
:::

### 2. Your React app on `app.example.com` calls `api.example.com`. Login works, but `/me` always returns 401. What is the most likely cause?

:::answer
The browser isn't sending the cookie. Add `credentials: 'include'` to `fetch`, and allow credentials in CORS on the API (`credentials: true` with a specific origin, not `*`).
:::

### 3. True or false: the data inside a JWT is encrypted.

:::answer
**False.** It is signed, not encrypted. Anyone can decode and read the payload. The signature only proves it wasn't changed.
:::
