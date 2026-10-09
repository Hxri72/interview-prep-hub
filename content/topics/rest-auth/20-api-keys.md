---
title: API keys and service-to-service auth
stack: rest-auth
order: 20
level: Intermediate
mustKnow: false
askedFrequency: common
summary:
  - An API key is a long secret string that identifies a calling program (not a person). It is sent in a header like x-api-key or Authorization.
  - Store only a hash of each key in your database, like a password. Show the full key to the client once, when you create it.
  - Give each client its own key, with limited permissions, so you can rotate or revoke one key without breaking the others.
  - "For service-to-service calls, common options are API keys, the OAuth client credentials flow (short-lived tokens), signed requests (HMAC), and mutual TLS."
  - Never put a secret API key in frontend code or in Git. Anything in the browser is public.
cards:
  - q: What is an API key?
    a: A long random secret that identifies a calling application. The app sends it with every request, usually in a header like x-api-key.
  - q: How should a server store API keys?
    a: Store only a hash (for example SHA-256) of each key, plus who owns it and what it may do. Show the full key once at creation. If the database leaks, the keys still can't be used.
  - q: API key vs JWT — what's the difference?
    a: An API key is a long-lived secret that identifies an app; the server looks it up on every request. A JWT is a short-lived signed token, usually about a user, that the server can verify without a lookup.
  - q: How can two backend services authenticate each other?
    a: "Options: a shared API key per service, the OAuth client credentials flow (short-lived tokens), signed requests with HMAC, or mutual TLS where both sides show certificates."
  - q: How do you rotate an API key without downtime?
    a: Allow two valid keys for a while. Create the new key, update the client to use it, check traffic has moved, then revoke the old key.
---

## 💡 What is it?

An **API key** is a long, secret string that tells your [API](glossary:api) **which program** is calling. It identifies an app or a service, not a person.

The caller sends the key with every request, usually in a **header** like `x-api-key: sk_live_...`. Your server checks the key. If it's valid, the request goes through. If not, the server replies **401 Unauthorized**.

**Service-to-service auth** means one backend proving who it is to another backend, with no human logged in. API keys are the simplest way to do that.

## 🏠 Real-life example

Think of **company ID cards for delivery partners**.

A school lets a few trusted companies enter: the milk supplier, the bookshop van, the bus company. Each gets its **own ID card** with a number.

- The **delivery company** = a client app or service.
- The **ID card** = the API key.
- The **gate guard checking the card** = your middleware.
- The guard's **register of valid card numbers** = the database of key hashes.
- **Each company has a different card** = one key per client. If the milk company loses its card, you cancel only that one.
- The card **only opens the kitchen gate, not the staff room** = limited permissions (scopes).

## 🧑‍💻 Code example

Make a folder, run `npm init -y` and `npm install express`. Save this as `apikey.js` and run `node apikey.js`. It starts a server, then calls it twice: once with the right key and once with a wrong one.

```js
const express = require('express');                            // load Express
const crypto = require('node:crypto');                         // built-in crypto for hashing

const sha256 = (text) => crypto.createHash('sha256').update(text).digest('hex'); // helper: hash any text

const issuedKey = 'sk_live_' + 'a1b2c3d4e5f6';                 // the key we gave to a partner (shown to them once)
const storedHashes = new Map([[sha256(issuedKey), 'payroll-service']]); // we store only the HASH → client name

function requireApiKey(req, res, next) {                       // middleware that checks the key
  const key = req.get('x-api-key') || '';                      // read the key from the header (empty if missing)
  const client = storedHashes.get(sha256(key));                // hash it and look it up
  if (!client) return res.status(401).json({ error: 'Invalid API key' }); // unknown key → 401 Unauthorized
  req.client = client;                                         // remember which client is calling
  next();                                                      // key is fine → go to the route
}                                                              // end of requireApiKey

const app = express();                                         // create the app
app.get('/reports', requireApiKey, (req, res) => res.json({ for: req.client })); // a protected route

const server = app.listen(3101, async () => {                  // start on port 3101, then test it
  const good = await fetch('http://localhost:3101/reports', { headers: { 'x-api-key': issuedKey } }); // right key
  console.log(good.status, await good.json());                 // print status and body
  const bad = await fetch('http://localhost:3101/reports', { headers: { 'x-api-key': 'guess' } }); // wrong key
  console.log(bad.status, await bad.json());                   // print status and body
  server.close();                                              // stop the server
});                                                            // end of listen
```

**Output:**

```text
200 { for: 'payroll-service' }
401 { error: 'Invalid API key' }
```

(The key is short here so it's easy to read. Real keys are 32+ random bytes, made with `crypto.randomBytes(32)`.)

## 🔍 Deeper version

**How to design API keys well:**
- **Make them long and random.** Use `crypto.randomBytes(32).toString('base64url')`. Add a readable prefix like `sk_live_` or `sk_test_`. It helps people (and secret scanners) spot a leaked key.
- **Store only a [hash](glossary:hash).** Because a key is long and random, a fast hash like SHA-256 is enough. (Passwords need slow hashes like [bcrypt](topic:rest-auth/bcrypt), because people choose weak passwords.) Also keep the **last 4 characters** so the client can tell keys apart in a dashboard.
- **One key per client, with scopes.** For example `reports:read`. Check the scope in your [middleware](glossary:middleware), not only that the key exists.
- **Rotation.** Let a client have **two active keys** for a while. They switch to the new key, and you revoke the old one.
- **Log and limit by key.** Record which key made each request. Apply rate limits per key (see [API security](topic:rest-auth/api-security)).
- **Send keys only in headers and only over HTTPS.** Query strings end up in logs and browser history.

**Comparing service-to-service options:**

| Method | How it works | Good for |
|---|---|---|
| **API key** | a static secret in a header; the server looks it up | simple partner APIs, internal tools |
| **OAuth client credentials** | the service trades its client id + secret for a **short-lived** access token | larger systems; tokens expire, so leaks hurt less |
| **HMAC signed request** | the caller signs the request body + a timestamp with a shared secret | webhooks, payment APIs (see [webhook signatures](topic:rest-auth/webhook-signatures)) |
| **Mutual TLS (mTLS)** | both sides show certificates during the HTTPS handshake | service meshes, banks, zero-trust networks |
| **Cloud IAM roles** | the platform signs calls with the service's identity (for example AWS IAM) | calls between services inside one cloud |

**API key vs JWT:**
- An **API key** identifies an **app**. It lives a long time. The server must look it up on every request, but it's easy to revoke.
- A **JWT** usually identifies a **user session**. It's short-lived and signed, so it can be checked without a database lookup. It's harder to revoke early (see [JWT](topic:rest-auth/jwt)).

**Comparing keys safely.** When you compare a secret directly with `===`, the time taken can leak how many characters matched. For a direct comparison, use `crypto.timingSafeEqual`. Looking up a hash in a map or an indexed table, like the example does, avoids that problem.

## 🎯 Why do we use it?

- **Know who is calling.** Every request is tied to one client, for logs, billing and limits.
- **Simple to use.** Partners just add one header. No login flow is needed.
- **Control.** You can switch off one client without touching the others.
- **Machine-to-machine traffic has no user.** A cron job or a partner's server can't type a password or click "Login with Google".

## ⚠️ Common mistakes

- **Shipping a secret key in a React or mobile app.** Anyone can open the bundle and copy it. Keys that must be in the frontend (like a maps key) must be "publishable" keys, with strict domain limits.
- **Storing keys as plain text** in the database.
- **Committing keys to Git.** Bots scan GitHub for keys within minutes. Use [environment variables](topic:nodejs/environment-variables) and a secrets manager.
- **One shared key for everyone,** so you can't revoke or track one client.
- **No expiry or rotation plan,** so a leaked key works forever.

## 🗣️ How to answer in an interview

> "An API key is a long random secret that identifies a calling application, not a user. The client sends it in a header like x-api-key, and a middleware on my server checks it.
>
> I treat keys like passwords: I generate them with crypto.randomBytes, show the full key once, and store only a SHA-256 hash plus the owner, the scopes and the last four characters. Each client gets its own key, so I can rate-limit, log and revoke them separately. For rotation, I allow two active keys for a while.
>
> For service-to-service auth there are other options too. OAuth client credentials gives short-lived tokens, HMAC signatures prove a request wasn't changed, and mutual TLS uses certificates on both sides. And I never put a secret key in frontend code."

[FILL IN: a real place you used API keys or service-to-service auth (for example a third-party API key kept in environment variables). Only add it if it's true.]

## 🔁 Follow-up questions

### Why hash API keys if they're random?

If the database leaks, plain-text keys could be used straight away to call your API. With only hashes stored, the attacker can't recover the real keys.

### Why is SHA-256 fine for API keys but not for passwords?

Passwords are short and guessable, so attackers can try billions of guesses against a fast hash. That's why passwords need slow hashes like bcrypt. A 32-byte random key can't be guessed, so a fast hash is safe.

### Header or query string for the key?

Use a **header**. URLs with query strings get saved in server logs, proxies and browser history, so the key could leak.

### How would you detect a leaked key?

Watch for unusual usage per key: new IP addresses, traffic spikes, or calls to endpoints that client never uses. GitHub secret scanning also warns providers when keys with known prefixes are pushed.

## ✅ Quick check

### 1. Where is it safe to put a secret API key?

- A) In the React app's source code
- B) In a server-side environment variable or secrets manager
- C) In a public GitHub repo, if it's private-looking

:::answer
**B.** Secrets belong on the server. Anything in browser code is visible to every user, and public repos are scanned by bots.
:::

### 2. A request has a wrong API key. Which status code should the API return?

:::answer
**401 Unauthorized.** The caller isn't authenticated. (403 Forbidden is for a valid key that isn't allowed to do this action.)
:::

### 3. True or false: you should store API keys in the database exactly as you gave them to the client.

:::answer
**False.** Store only a hash, like you do for passwords. Show the full key to the client once, when it's created.
:::
