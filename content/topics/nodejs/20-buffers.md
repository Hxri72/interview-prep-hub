---
title: Buffers and encoding (utf8, base64)
stack: nodejs
order: 20
level: Intermediate
mustKnow: false
askedFrequency: common
summary:
  - A Buffer is a box of raw bytes (numbers from 0 to 255). Node uses it for files, network data, images and anything that isn't plain text.
  - An encoding is the rule for turning text into bytes and back. utf8 is the default; base64 and hex are ways to write bytes as safe text.
  - One character can be more than one byte — "₹" is 3 bytes in utf8. So text.length and buffer.length can be different.
  - base64 is NOT encryption. Anyone can decode it. It just makes binary data safe to send as text, and it's about 33% bigger.
  - Webhook signatures (like Stripe's) are checked on the raw body bytes. Parsing to JSON first changes the bytes, so the check fails.
cards:
  - q: What is a Buffer in Node.js?
    a: A fixed-size chunk of raw bytes (a subclass of Uint8Array). Node uses it for binary data like files, network packets and images.
  - q: Why can 'Hi ₹'.length be 4 but Buffer.from('Hi ₹').length be 6?
    a: length on a string counts characters. On a Buffer it counts bytes. In utf8, ₹ needs 3 bytes.
  - q: Is base64 a way to encrypt data?
    a: No. base64 only changes how bytes are written, using safe text characters. Anyone can decode it.
  - q: Why do you need the raw request body to verify a Stripe webhook?
    a: The signature is an HMAC of the exact bytes Stripe sent. If you parse the JSON and turn it back into text, spaces or order can change, so the signature no longer matches.
  - q: Buffer.alloc vs Buffer.allocUnsafe?
    a: alloc fills the new memory with zeros (safe). allocUnsafe is faster but may contain old data from memory, so you must overwrite it all.
---

## 💡 What is it?

Computers store everything as **bytes**. A byte is a small number from 0 to 255. Text, images, PDFs and videos are all just bytes.

A **[Buffer](glossary:buffer)** is Node's box for holding raw bytes. Node uses Buffers when it reads files, receives network data or handles images.

An **[encoding](glossary:encoding)** is the rule for turning text into bytes and bytes back into text. The most common one is **utf8**. **base64** and **hex** are ways to write bytes as plain, safe text.

## 🏠 Real-life example

Think of **sending a message in Morse code**.

- Your message "HELLO" is the **text**.
- The dots and dashes are the **raw bytes**. The telegraph wire can only carry dots and dashes, not letters.
- The **Morse code chart** is the **encoding**. It's the rule that says "H = ••••".
- The person receiving it must use the **same chart**. If they use a different chart, they get rubbish. Using the wrong encoding gives broken text like `Ã¢Â‚Â¹`.
- Some letters take more symbols than others. In utf8, some characters take more bytes. "A" is 1 byte, but "₹" is 3 bytes.

## 🧑‍💻 Code example

Save this as `buffers.js`. Run it with `node buffers.js`.

```js
const text = 'Hi ₹';                                       // text: H, i, a space, and the rupee sign = 4 characters
const buf = Buffer.from(text, 'utf8');                     // turn the text into raw bytes using the utf8 encoding

console.log(buf);                                          // shows each byte in hex (base 16)
console.log(text.length, buf.length);                      // 4 characters, but 6 bytes (₹ needs 3 bytes)
console.log(buf.toString('utf8'));                         // bytes back to text using utf8
console.log(buf.toString('base64'));                       // the same bytes, written as base64 text
console.log(buf.toString('hex'));                          // the same bytes, written as hex text
console.log(Buffer.from('SGkg4oK5', 'base64').toString('utf8')); // base64 text → bytes → normal text again
console.log(buf[0]);                                       // the first byte as a number: 72 (that's "H")
```

**Output:**

```text
<Buffer 48 69 20 e2 82 b9>
4 6
Hi ₹
SGkg4oK5
486920e282b9
Hi ₹
72
```

**What to notice:**
- `48 69 20` are "H", "i" and the space. `e2 82 b9` are the **three bytes** of "₹".
- The same 6 bytes can be shown as utf8, base64 or hex. The bytes don't change, only how we write them.

## 🔍 Deeper version

**What a Buffer really is.** `Buffer` is a subclass of `Uint8Array`, a JavaScript array of 8-bit numbers (0–255). Its size is **fixed** when you create it. Large Buffers are stored **outside** the normal JavaScript memory (the V8 heap). That's why `process.memoryUsage()` reports them separately as `external` and `arrayBuffers`.

**Creating Buffers:**

| Code | What it does |
|---|---|
| `Buffer.from('text', 'utf8')` | bytes from a string |
| `Buffer.from([72, 105])` | bytes from numbers |
| `Buffer.alloc(10)` | 10 bytes, all set to 0 (safe) |
| `Buffer.allocUnsafe(10)` | 10 bytes, **not** cleared — faster, but may hold old memory data; overwrite it fully |
| `Buffer.concat([a, b])` | join Buffers together |

**Common encodings:**

| Encoding | Use it for |
|---|---|
| `utf8` | normal text (the default) |
| `base64` | sending binary data as text: email attachments, images in JSON, JWT parts (which use `base64url`) |
| `hex` | showing hashes and IDs, like SHA-256 results |
| `latin1`, `ascii` | old systems; avoid for new code |

**base64 facts.** base64 uses 64 safe characters (A–Z, a–z, 0–9, `+`, `/`). Every 3 bytes become 4 characters, so the data gets about **33% bigger**. `base64url` swaps `+/` for `-_` so it's safe in URLs. And again: **base64 is not encryption**.

**The "split character" bug.** Streams give you data in [chunks](glossary:chunk). A 3-byte "₹" can be split between two chunks. If you call `chunk.toString()` on each chunk, you get broken characters. Fixes:
- `stream.setEncoding('utf8')`, so Node joins split characters for you,
- or collect all chunks and use `Buffer.concat(chunks).toString()` at the end,
- or use the `string_decoder` module.

**Why webhooks need the raw body.** Services like Stripe sign each [webhook](glossary:webhook) request. They create an **HMAC** (a secret-key fingerprint) of the **exact bytes** they sent. You must compute the same fingerprint from the same bytes.

If `express.json()` parses the body first and you later `JSON.stringify` it, the bytes can change. Spaces, key order or escaped characters may differ. Then the signature won't match. So for the webhook route, read the raw bytes:

```js
app.post('/webhooks/stripe',                                   // the webhook route
  express.raw({ type: 'application/json' }),                   // keep the body as a raw Buffer, don't parse it
  (req, res) => {                                              // the route handler
    const sig = req.headers['stripe-signature'];               // the signature Stripe sent in a header
    const event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET); // verify using the raw bytes
    // ...handle the event, then reply 200 quickly
  });
```

When you compare signatures yourself, use `crypto.timingSafeEqual(bufA, bufB)`, not `===`. A normal comparison stops at the first wrong byte. An attacker can measure that tiny time difference and guess the signature bit by bit.

## 🎯 Why do we use it?

- **Not everything is text.** Images, PDFs, ZIP files and audio are raw bytes. Buffers let Node handle them directly.
- **Networks and files work in bytes.** HTTP bodies, TCP sockets and `fs.readFile` (without an encoding) all give you Buffers.
- **Security checks work on bytes.** Hashes, HMAC signatures and encryption all take bytes as input. For example, verifying a Stripe webhook.
- **Moving binary data through text-only places.** JSON and email can't carry raw bytes, so you use base64.

## ⚠️ Common mistakes

- **Parsing a webhook body before checking its signature.** The bytes change and the check fails. Use the raw body for that route.
- **Thinking base64 hides or protects data.** It doesn't. Anyone can decode it.
- **Calling `toString()` on each chunk** of a stream with multi-byte characters. Characters get broken in half.
- **Using `string.length` to measure bytes**, for example for size limits. Use `Buffer.byteLength(str)` instead.

## 🗣️ How to answer in an interview

> "A Buffer is Node's way of holding raw binary data. It's a fixed-size array of bytes, a subclass of Uint8Array, and big ones live outside the V8 heap. Node gives you Buffers for file reads, network data and anything binary. An encoding is how bytes map to text. utf8 is the default, and one character can take several bytes. base64 and hex are ways to write bytes as text. base64 is about 33% bigger and it's not encryption.
>
> A practical place this matters is webhook verification. With Stripe, the signature is an HMAC over the exact raw body. So on the webhook route, I use `express.raw` instead of `express.json`, pass the raw Buffer to Stripe's `constructEvent`, and only then parse it. If you parse first, the bytes can change and verification fails."

[FILL IN: confirm how the raw body was handled for the Stripe webhook route at SkillKeepr (the resume mentions secure webhook handling). Only add what's true.]

## 🔁 Follow-up questions

### Where are Buffers stored in memory?

Small Buffers may come from a shared memory pool. Large Buffers are stored outside the V8 heap, in "external" memory. So a big file read into a Buffer increases `external` memory, not just `heapUsed`. That's why it's better to stream big files.

### How do you get the byte size of a string?

Use `Buffer.byteLength(str, 'utf8')`. `str.length` counts UTF-16 code units, not bytes, so it's wrong for non-English characters and emojis.

### When would you send a file as base64 instead of raw bytes?

Only when the channel accepts text only, like a JSON field or an email. For normal uploads, use `multipart/form-data` or stream the raw bytes. base64 adds about 33% size and costs CPU time.

### What is an HMAC?

A hash (fingerprint) made with a secret key. Only someone with the same key can create the same HMAC. Webhook providers use it so you can check that the request really came from them and wasn't changed.

## ✅ Quick check

### 1. What does this print?

```js
console.log(Buffer.from('₹').length);   // byte length of the rupee sign in utf8
```

:::answer
**3.** In utf8, "₹" (U+20B9) is stored as 3 bytes: `e2 82 b9`.
:::

### 2. True or false: storing a password as base64 keeps it secret.

:::answer
**False.** base64 can be decoded by anyone in one line. Passwords must be **hashed** with a slow hash like bcrypt.
:::

### 3. Your Stripe webhook verification always fails, even with the right secret. What is the most likely cause?

- A) The webhook secret is too long
- B) The body was parsed with `express.json()` before verification, so the raw bytes changed
- C) Stripe webhooks can't be verified in Node

:::answer
**B.** Verify with the raw body (`express.raw({ type: 'application/json' })`) on that route, then parse it after verification.
:::
