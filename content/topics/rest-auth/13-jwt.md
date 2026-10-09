---
title: "JWT: structure and how it works"
stack: rest-auth
order: 13
level: Basic
mustKnow: true
askedFrequency: very common
summary:
  - "A JWT (JSON Web Token) is a signed string with 3 parts: header.payload.signature."
  - "The header and payload are only base64url-encoded, NOT encrypted. Anyone can read them, so never put secrets inside."
  - "The signature is made with a secret key. If anyone changes the payload, the signature no longer matches, and verify fails."
  - "Common payload fields (claims): sub (user id), role, iat (issued at), exp (expires at), jti (token id)."
  - "HS256 uses one shared secret. RS256 uses a private key to sign and a public key to verify — good when many services verify."
cards:
  - q: What are the three parts of a JWT?
    a: "Header (algorithm and type), payload (the claims, like user id and expiry) and signature, joined with dots."
  - q: Is a JWT encrypted?
    a: "No. A normal JWT is only encoded (base64url) and signed. Anyone can decode and read the payload. The signature only proves it wasn't changed."
  - q: What stops a user from changing their role in the token?
    a: The signature. It is calculated from the header and payload with a secret only the server knows. Any change makes jwt.verify throw 'invalid signature'.
  - q: HS256 vs RS256?
    a: "HS256: one shared secret both signs and verifies. RS256: a private key signs, and a public key verifies, so other services can verify without being able to create tokens."
  - q: What should you never put in a JWT payload?
    a: Passwords, secrets, or private personal data. The payload is readable by anyone who has the token.
---

## 💡 What is it?

A **[JWT](glossary:jwt)** (JSON Web Token, said "jot") is a small string the server gives you after login. It says **who you are**, and it is **signed** so nobody can fake it.

It looks like three blocks of random text joined with dots:

`header.payload.signature`

The server checks the [signature](glossary:signature) on every request. If it's valid, the server trusts what the token says.

## 🏠 Real-life example

Think of **a sealed school permission slip**.

The slip says: "Asha, Class 10, may leave early at 2 pm". The principal signs it with a **special stamp** that only the office has.

- The **slip's text** = the payload (who you are, your role, until when).
- The **heading "PERMISSION SLIP — official stamp type A"** = the header.
- The **principal's stamp** = the signature.
- The **gate guard checking the stamp** = `jwt.verify`.
- The slip is written in **plain language**: anyone can read it. The stamp doesn't hide anything. It only proves the text wasn't changed.
- If Asha changes "2 pm" to "10 am", the **stamp no longer matches** the text, and the guard rejects it.

## 🧑‍💻 Code example

Set up: `npm init -y`, then `npm install jsonwebtoken`. Save as `jwt-parts.js` and run `node jwt-parts.js`.

```js
const jwt = require('jsonwebtoken');                        // npm install jsonwebtoken
const SECRET = 'my-very-secret-key';                        // only the server knows this

const token = jwt.sign({ userId: 'u1', role: 'recruiter' }, SECRET, { expiresIn: '15m' }); // make a token
console.log('token:', token);                               // three parts joined by dots

const [header, payload, signature] = token.split('.');      // split into header.payload.signature
console.log('header:', Buffer.from(header, 'base64url').toString());   // decode part 1 (it is NOT encrypted)
console.log('payload:', Buffer.from(payload, 'base64url').toString()); // decode part 2 (anyone can read it)

const decoded = jwt.verify(token, SECRET);                  // check the signature with the secret
console.log('verified role:', decoded.role);                // safe to trust now

const fakePayload = Buffer.from(JSON.stringify({ userId: 'u1', role: 'admin' })).toString('base64url'); // attacker edits the role
const fakeToken = `${header}.${fakePayload}.${signature}`;  // keeps the old signature
try {                                                       // try to verify the edited token
  jwt.verify(fakeToken, SECRET);                            // this will throw
} catch (err) {                                             // the signature no longer matches
  console.log('tampered token:', err.message);              // print why it failed
}                                                           // end of try/catch
```

**Output** (your token and times will differ):

```text
token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ1MSIsInJvbGUiOiJyZWNydWl0ZXIiLCJpYXQiOjE3OTE1NTgwNjUsImV4cCI6MTc5MTU1ODk2NX0.XmZNR2BhASibRpRQQplz3dOpANCJ_KPPuVLD2RmspFA
header: {"alg":"HS256","typ":"JWT"}
payload: {"userId":"u1","role":"recruiter","iat":1791558065,"exp":1791558965}
verified role: recruiter
tampered token: invalid signature
```

**What to notice:**
- We decoded the header and payload **without the secret**. Anyone can.
- `iat` and `exp` were added automatically. They are times in seconds. `exp - iat` = 900 seconds = 15 minutes.
- Changing `recruiter` to `admin` broke the signature.

## 🔍 Deeper version

**The three parts:**

| Part | Contains | Example |
|---|---|---|
| Header | the algorithm and token type | `{"alg":"HS256","typ":"JWT"}` |
| Payload | the **claims**: facts about the user and the token | `{"sub":"u1","role":"recruiter","exp":...}` |
| Signature | `HMAC-SHA256(base64url(header) + "." + base64url(payload), secret)` | random-looking bytes |

Each part is **[base64url](glossary:base64)-encoded**. That is like base64, but safe for URLs (`-` and `_` instead of `+` and `/`, no `=` padding). Encoding is **not** encryption.

**Standard claims** (short names, to keep tokens small):
- `sub`: subject, the user ID.
- `iat`: issued at.
- `exp`: expiry time. `jwt.verify` rejects expired tokens with "jwt expired".
- `nbf`: not valid before this time.
- `iss` / `aud`: who issued the token and who it is for. Check them when several systems use tokens.
- `jti`: a unique token ID. Useful for [revocation](topic:rest-auth/logout-revocation).

You add your own claims too, like `role` or `tenantId`. In a multi-tenant app, putting the tenant inside the token means a token can't be used for another company.

**HS256 vs RS256:**
- **HS256** (HMAC): **one secret** signs and verifies. Simple. But every service that verifies can also create tokens.
- **RS256 / ES256** (public-key): a **private key** signs, and a **public key** verifies. Other services get only the public key, so they can check tokens but never make them. Identity providers usually publish their public keys at a URL (a "JWKS" endpoint).

**Security rules:**
- **Always pin the algorithm:** `jwt.verify(token, SECRET, { algorithms: ['HS256'] })`. Old attacks tried `"alg": "none"` or swapped algorithms.
- **Use a long, random secret** from an [environment variable](glossary:environment-variable), never a short word in code.
- **Keep tokens short-lived** (5–15 minutes) and use [refresh tokens](topic:rest-auth/refresh-tokens).
- **`jwt.decode` does NOT verify.** Use it only for debugging. Use `jwt.verify` for anything you trust.

**Encrypted tokens exist** (they're called JWE), but most APIs don't need them. If the data is private, keep it on the server and put only an ID in the token.

## 🎯 Why do we use it?

- **No lookup per request.** The server verifies the signature with maths, without asking a database. That's fast and works across many servers.
- **Works across services.** Any service with the key (or public key) can trust the same token.
- **Carries useful facts.** The user ID, role and tenant travel with every request, so middleware can do quick checks.

## ⚠️ Common mistakes

- **Putting secrets or private data in the payload.** It's readable by anyone.
- **Using `jwt.decode` instead of `jwt.verify`.** Decode doesn't check the signature.
- **Very long expiry times** (like 30 days) for access tokens. A stolen token stays useful for weeks.
- **Weak secrets** like `"secret"`. HS256 secrets can be brute-forced offline if they're short.
- **Trusting the role in the token forever.** If you demote a user, their old token still says "admin" until it expires. Keep expiry short.

## 🗣️ How to answer in an interview

> "A JWT has three base64url parts separated by dots: a header with the algorithm, a payload with claims like `sub`, `role` and `exp`, and a signature. The signature is calculated from the header and payload using a secret key. So when the server calls `jwt.verify`, any change to the payload makes the signature invalid.
>
> The important point is that a normal JWT is signed, not encrypted. Anyone can decode and read the payload, so I never put passwords or private data in it, just the user ID, role and maybe the tenant.
>
> I keep access tokens short-lived, pin the algorithm when verifying, and keep the secret in an environment variable. For multiple services, I'd prefer RS256, so services only get the public key and can verify tokens but not create them."

## 🔁 Follow-up questions

### What happens when a JWT expires?

`jwt.verify` throws a `TokenExpiredError` ("jwt expired"). The API returns 401, and the client uses its refresh token to get a new access token, or logs in again.

### Why not store everything about the user in the token?

The token is sent with every request, so big tokens waste bandwidth. The data can also go stale, and anyone can read it. Store only what you need for quick checks.

### What is the difference between `jwt.decode` and `jwt.verify`?

`decode` just reads the payload. It does not check the signature or the expiry. `verify` checks both and throws if anything is wrong. Only trust the result of `verify`.

### How do you rotate the signing secret?

Support two keys for a while: sign new tokens with the new key, and accept both keys when verifying. Add a `kid` (key ID) in the header so the server knows which key to use. After old tokens expire, remove the old key.

## ✅ Quick check

### 1. A user decodes their JWT in the browser and sees `"role":"recruiter"`. Is this a security problem?

:::answer
**No.** The payload is meant to be readable. It becomes a problem only if secret data is inside, or if the server forgets to verify the signature.
:::

### 2. What does this print?

```js
const jwt = require('jsonwebtoken');                        // load the library
const t = jwt.sign({ sub: 'u1' }, 'a-secret');              // sign with one secret
try { jwt.verify(t, 'another-secret'); console.log('ok'); } // verify with a different secret
catch (e) { console.log(e.message); }                       // print the error
```

:::answer
**`invalid signature`.** The token was signed with `a-secret`, so verifying with a different secret fails.
:::

### 3. Which algorithm lets other services verify tokens without being able to create them?

- A) HS256
- B) RS256

:::answer
**B) RS256.** The private key (kept by the auth server) signs. Other services get only the public key, which can verify but not sign.
:::
