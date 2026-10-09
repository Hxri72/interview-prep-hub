---
title: Verifying webhook signatures (why the raw body)
stack: rest-auth
order: 22
level: Intermediate
mustKnow: true
askedFrequency: very common
summary:
  - The sender signs each webhook with a secret only you and they know (an HMAC). You recompute the signature and compare. If it matches, the request is real and unchanged.
  - The signature is calculated over the exact raw bytes of the body. If you parse and re-stringify the JSON first, even one space changes and the check fails.
  - "In Express, use express.raw({ type: 'application/json' }) on the webhook route only, then call stripe.webhooks.constructEvent(rawBody, signatureHeader, secret)."
  - Signatures usually include a timestamp, so old captured requests can't be replayed later.
  - Keep the signing secret in an environment variable, and reply 400 when the check fails.
cards:
  - q: Why do webhooks have a signature?
    a: Your webhook URL is public. The signature proves the request came from the real sender (who knows the secret) and that nobody changed the body on the way.
  - q: What is an HMAC?
    a: A hash made from the message plus a secret key. Without the secret you can't make a valid HMAC, and any change to the message gives a different HMAC.
  - q: Why does Stripe need the raw request body?
    a: The signature covers the exact bytes Stripe sent. express.json() parses the body, and turning it back into a string can change spacing or key order, so the signature no longer matches.
  - q: How do you get the raw body in Express?
    a: "Use express.raw({ type: 'application/json' }) as middleware on the webhook route, so req.body is a Buffer. Register it before (or instead of) express.json() for that route."
  - q: Why is there a timestamp in the Stripe-Signature header?
    a: The timestamp is part of what's signed, and Stripe rejects events older than a tolerance (5 minutes by default). This stops replay attacks with old, captured requests.
---

## 💡 What is it?

Your webhook URL is **public**. Anyone could send a fake POST to it, like "payment succeeded!". A **signature** proves that a webhook **really came from the sender** and that **nobody changed it**.

The sender and you share a **secret**. The sender mixes the request body with that secret to make a code called an **HMAC** (a kind of [hash](glossary:hash)). It sends the code in a header like `Stripe-Signature`.

Your server makes the same code from the body it received, using the same secret. **If the two codes match, the webhook is real.**

## 🏠 Real-life example

Think of a **sealed envelope with a special wax stamp**.

The principal sends a note to your class teacher. The principal seals it with wax and presses a **special stamp only they own** into the wax. The teacher knows exactly what that stamp looks like.

- The **note** = the webhook body.
- The **principal** = Stripe (the sender).
- The **special stamp** = the shared signing secret.
- The **wax seal** = the signature header.
- The **teacher checking the seal** = your server running `constructEvent`.
- If **anyone opened the envelope and changed the note**, the seal breaks = any change to the body breaks the signature.
- **Rewriting the note neatly in your own handwriting** before checking the seal = parsing and re-stringifying the JSON. Even with the same words, it's no longer the original, so the check fails. That's why you need the **raw body**.

## 🧑‍💻 Code example

Make a folder, run `npm init -y` and `npm install express stripe`. Save this as `signature.js` and run `node signature.js`. Stripe's SDK can create a test signature, so this works offline with no Stripe account.

```js
const express = require('express');                            // load Express
const Stripe = require('stripe');                              // load the Stripe SDK
const stripe = new Stripe('sk_test_dummy');                    // a test key (not used for network calls here)
const endpointSecret = 'whsec_test_secret';                    // the webhook signing secret from the Stripe dashboard

const app = express();                                         // create the app
app.post('/webhooks/stripe',                                   // the Stripe webhook route
  express.raw({ type: 'application/json' }),                   // keep the body as RAW bytes (a Buffer), do NOT parse it
  (req, res) => {                                              // the handler
    try {                                                      // constructEvent throws if the signature is wrong
      const event = stripe.webhooks.constructEvent(            // check the signature, then parse the JSON
        req.body,                                              // the raw bytes exactly as Stripe sent them
        req.get('stripe-signature'),                           // the signature header Stripe sent
        endpointSecret,                                        // our shared secret
      );                                                       // end of constructEvent
      console.log('✅ verified', event.type);                  // the event is real
      res.json({ received: true });                            // tell Stripe we got it (200)
    } catch (err) {                                            // signature did not match
      console.log('❌ rejected:', err.message.split('\n')[0]); // log the reason (first line only)
      res.status(400).send('Bad signature');                   // 400 = we refuse it
    }                                                          // end of try/catch
  });                                                          // end of the route

const server = app.listen(3103, async () => {                  // start on port 3103
  const payload = JSON.stringify({ id: 'evt_123', object: 'event', type: 'invoice.paid' }); // a fake event body
  const header = stripe.webhooks.generateTestHeaderString({ payload, secret: endpointSecret }); // sign it like Stripe does
  const send = (body) => fetch('http://localhost:3103/webhooks/stripe', { // helper to POST a webhook
    method: 'POST', headers: { 'Content-Type': 'application/json', 'stripe-signature': header }, body, // same header each time
  });                                                          // end of send
  await send(payload);                                         // 1) the real, untouched body
  await send(payload.replace('invoice.paid', 'invoice.void')); // 2) someone changed the body
  await send(JSON.stringify(JSON.parse(payload), null, 2));    // 3) same data, but re-formatted JSON
  server.close();                                              // stop the server
});                                                            // end of listen
```

**Output:**

```text
✅ verified invoice.paid
❌ rejected: No signatures found matching the expected signature for payload. Are you passing the raw request body you received from Stripe?
❌ rejected: No signatures found matching the expected signature for payload. Are you passing the raw request body you received from Stripe?
```

Look at case 3. **The data is exactly the same**, but the spacing changed, so the signature fails. That is exactly what happens if `express.json()` parses the body before your handler.

## 🔍 Deeper version

**How an HMAC signature works:**

```text
signature = HMAC_SHA256(secret, timestamp + "." + rawBody)
```

- The sender computes it and sends `t=<timestamp>,v1=<signature>` in the `Stripe-Signature` header.
- You compute it again from the **raw [buffer](glossary:buffer)** and compare.
- Without the secret, an attacker can't make a valid signature. If they change one byte, the HMAC changes completely.

**Doing it by hand** (for providers without an SDK):

```js
const crypto = require('node:crypto');                         // built-in crypto
function isValid(rawBody, timestamp, signatureHex, secret) {   // rawBody is a Buffer
  const expected = crypto.createHmac('sha256', secret)         // HMAC with SHA-256 and our secret
    .update(`${timestamp}.${rawBody}`)                         // sign "timestamp.body", like the sender does
    .digest('hex');                                            // as a hex string
  const a = Buffer.from(expected);                             // our signature as bytes
  const b = Buffer.from(signatureHex);                         // their signature as bytes
  return a.length === b.length && crypto.timingSafeEqual(a, b); // compare in constant time
}                                                              // end of isValid
```

`timingSafeEqual` takes the same time whether the first or the last character is wrong. A normal `===` stops early, and that tiny time difference could help an attacker guess.

**Why the raw body, in detail.** JSON can show the same data in many ways: spaces, key order, how Unicode is escaped. The signature is over **the exact bytes**. `express.json()` turns bytes into an object. `JSON.stringify` makes **new** bytes that may differ. So:
- Use `express.raw({ type: 'application/json' })` **only on the webhook route**.
- If `app.use(express.json())` is registered globally **before** that route, it reads the body first. Then `req.body` is an object, not a Buffer, and verification fails. Register the webhook route **before** the global JSON parser, or skip JSON parsing for that path.
- In serverless setups (API Gateway + Lambda), check whether the body arrives base64-encoded (`isBase64Encoded`), and decode it to the original bytes first.

**Replay protection.** The timestamp is inside the signed text. Stripe's `constructEvent` rejects events older than **300 seconds** by default. So a captured old request can't be sent again later.

**Secrets.** Each webhook endpoint has its **own** signing secret (`whsec_...`), and it's different in test and live mode. Keep it in an [environment variable](topic:nodejs/environment-variables). Some providers support two secrets during rotation.

**After verification,** still handle duplicates. A valid signature means "real", not "new". See [idempotency keys](topic:rest-auth/idempotency-keys).

## 🎯 Why do we use it?

- **Stop fake events.** Without it, anyone could POST "invoice.paid" and get free access.
- **Detect changes.** A signature proves the body wasn't changed between the sender and you.
- **Stop replays.** The signed timestamp blocks old requests from being re-sent.
- **It's cheap.** One HMAC per request, with no extra network call.

## ⚠️ Common mistakes

- **Global `express.json()` running before the webhook route**, so the raw bytes are gone.
- **Re-stringifying the parsed body** and checking that instead of the original bytes.
- **Using the wrong secret.** The secret is per endpoint, and test and live mode use different ones.
- **Comparing signatures with `===`** in hand-written checks, instead of `crypto.timingSafeEqual`.
- **Catching the verification error and still replying 200.** Then bad requests look "successful" and real problems stay hidden. Reply 400 and log it.

## 🗣️ How to answer in an interview

> "A webhook URL is public, so I verify every request. The sender signs the raw body plus a timestamp with an HMAC, using a secret that only we share. In Express, I put express.raw with type application/json only on the webhook route, so req.body stays as the exact bytes. Then I call stripe.webhooks.constructEvent with the raw body, the Stripe-Signature header and the endpoint secret from an environment variable.
>
> The raw body matters because the signature covers the exact bytes. If express.json parses the body and I stringify it again, even a spacing change breaks the match. The timestamp in the signature also stops replay attacks, because Stripe rejects events older than five minutes by default. If verification fails, I return 400. If it passes, I still check the event id for duplicates before processing."

[FILL IN: confirm how the Stripe renewal webhook you worked on was verified. Only add details that are true.]

## 🔁 Follow-up questions

### What does `express.raw()` give you in `req.body`?

A **Buffer**: the exact bytes that arrived. Use `req.body.toString('utf8')` only if you need the text. Pass the Buffer itself to `constructEvent`.

### My global `express.json()` is breaking Stripe verification. How do I fix it?

Mount the webhook route with `express.raw` **before** `app.use(express.json())`. Or make the JSON parser skip that path. Another option is `express.json({ verify: (req, res, buf) => { req.rawBody = buf } })`, which keeps a copy of the raw bytes.

### Is HTTPS enough without a signature?

No. HTTPS hides the data on the way, but it doesn't prove **who sent** it. Anyone can make an HTTPS request to your public URL.

### What is a replay attack?

An attacker captures a real, valid request and sends it again later. The signed timestamp, plus a time limit, makes old copies invalid.

## ✅ Quick check

### 1. Your Stripe webhook fails with "No signatures found matching…", but the secret is correct. What's the most likely cause?

:::answer
The body isn't raw. Something, usually a global `express.json()`, parsed it before the handler. Use `express.raw({ type: 'application/json' })` on that route.
:::

### 2. An attacker sends a fake `invoice.paid` with a copied, old `Stripe-Signature` header and a different body. What happens?

:::answer
Verification **fails**. The signature was made for the old body, so the HMAC won't match the new body. Even with the same body, an old timestamp would fall outside the 5-minute tolerance.
:::

### 3. Which Node function should you use to compare two signatures safely?

- A) `a === b`
- B) `crypto.timingSafeEqual(a, b)`
- C) `a.includes(b)`

:::answer
**B.** It compares in constant time, so the time taken doesn't reveal how many characters matched.
:::
