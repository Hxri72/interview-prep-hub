---
title: "Caching: browser, CDN, server and database"
stack: system-design
order: 8
level: Intermediate
mustKnow: true
askedFrequency: very common
summary:
  - A cache keeps a copy of data close by, so the next read is fast and the slow source (database, API) does less work.
  - "Caches exist at every layer: browser, CDN, server (in-memory or Redis) and the database's own memory."
  - HTTP caching is controlled with headers like Cache-Control (how long) and ETag (has it changed?).
  - Cache data that is read often and changes rarely. Never cache private data in a shared cache by mistake.
  - "The hard part is invalidation: deciding when a cached copy is too old and must be removed."
cards:
  - q: What is a cache?
    a: A fast store that keeps a copy of data so repeated reads don't go back to the slow source.
  - q: Name four places where caching can happen.
    a: The browser, a CDN, the application server (in-memory or Redis), and the database's own memory.
  - q: What does Cache-Control max-age=3600 mean?
    a: The response may be reused for 3600 seconds (1 hour) without asking the server again.
  - q: What is an ETag?
    a: A fingerprint of a response. The browser sends it back in If-None-Match; if nothing changed, the server replies 304 Not Modified with no body.
  - q: What is the main risk of caching?
    a: Showing stale (old) data, or showing one user's private data to another user if cache keys are wrong.
---

## 💡 What is it?

A **cache** keeps a **copy** of data somewhere fast and close. The next time someone asks, you answer from the copy instead of doing the slow work again.

Caching makes apps **faster** and **cheaper**. The database gets fewer requests, so it can serve more users.

There is not just one cache. Caching happens at **many layers**, from the user's browser to the database.

## 🏠 Real-life example

Think of **a student studying for exams**.

- Formulas the student uses every day are **written on a sticky note on the desk** = the **browser cache** (closest, fastest).
- The **class notes in the bag** = a **CDN** (nearby copy).
- The **school library** = the **server cache** (Redis).
- The **big city library** across town = the **database** (has everything, but slow to reach).
- When the syllabus **changes**, the old sticky note is **wrong** and must be thrown away = **cache invalidation**.

## 🧑‍💻 Code example

HTTP caching with `Cache-Control` and an `ETag`. Setup: `npm init -y`, `npm install express`. Save as `httpcache.js`, run `node httpcache.js`.

```js
const express = require('express');                           // the Express web framework
const http = require('node:http');                            // Node's plain HTTP client (acts like a browser here)
const app = express();                                        // create the app (Express adds ETags for us)

app.get('/api/specialities', (req, res) => {                  // a list that rarely changes
  res.set('Cache-Control', 'public, max-age=3600');           // browsers and CDNs may keep it 3600 s = 1 hour
  res.json(['Backend', 'Frontend', 'DevOps']);                // the data (Express also sets an ETag header)
});                                                           // end of route

function get(headers) {                                       // small helper: send a GET with some headers
  return new Promise((resolve) => {                           // wrap the callback API in a promise
    http.get({ port: 7401, path: '/api/specialities', headers }, (res) => { // send the request
      let body = '';                                          // collect the reply body here
      res.on('data', (c) => (body += c));                     // add each chunk of the body
      res.on('end', () => resolve({ res, body }));            // done: hand back the response and body
    });                                                       // end of http.get
  });                                                         // end of promise
}                                                             // end of helper

const server = app.listen(7401, async () => {                 // start on port 7401, then test it
  const first = await get({});                                // first visit: full download
  const etag = first.res.headers.etag;                        // the ETag = a fingerprint of this version
  console.log('1st:', first.res.statusCode, first.res.headers['cache-control'], 'etag:', etag, 'body:', first.body); // 200 + rules
  const second = await get({ 'If-None-Match': etag });        // "I already have this version — has it changed?"
  console.log('2nd:', second.res.statusCode, 'body length:', second.body.length); // 304 = not modified, empty body
  server.close();                                             // stop the server so the script ends
});                                                           // end of listen
```

**Output:**

```text
1st: 200 public, max-age=3600 etag: W/"1f-z5mpcHT/dHaLCfu3+f77ZJ4SfAw" body: ["Backend","Frontend","DevOps"]
2nd: 304 body length: 0
```

The second reply is `304 Not Modified` with an **empty body**: the client reuses its saved copy. (Node's built-in `fetch` adds `Cache-Control: no-cache` when you set `If-None-Match` yourself, which forces a full 200. That's why this demo uses `http.get`.)

## 🔍 Deeper version

**The layers, from closest to farthest:**

| Layer | What it caches | Controlled by |
|---|---|---|
| Browser | Files and API responses | `Cache-Control`, `ETag`, `Last-Modified` |
| CDN | Images, JS, CSS, sometimes public API responses | `Cache-Control`, CDN rules. See [CDNs](topic:system-design/cdn) |
| Server in-memory | Small hot data in one process | Your code (e.g. a `Map` with TTL) |
| Shared cache (Redis) | Query results, sessions, computed data | Your code. See [Redis and cache-aside](topic:system-design/redis-cache-aside) |
| Database | Recently used data and index pages in RAM | The database itself |

**Important `Cache-Control` values:**

| Value | Meaning |
|---|---|
| `max-age=3600` | Reuse for 3600 seconds without asking |
| `public` | Shared caches (CDNs) may store it |
| `private` | Only the user's own browser may store it |
| `no-cache` | Store it, but check with the server (ETag) before using |
| `no-store` | Never store it (passwords, bank details) |
| `immutable` | It will never change (files with a hash in the name) |

**A common front-end pattern:** build tools add a hash to file names (`app.3f9a2c.js`). Those files get `max-age=31536000, immutable` (1 year). The `index.html` gets `no-cache`, so users always get the newest list of files.

**What to cache:**
- ✅ Read often, changes rarely: job listings, settings, country lists, product pages.
- ✅ Expensive to compute: dashboard counts, reports.
- ❌ Changes every second and must be exact: stock levels at checkout, account balances.
- ❌ Private data in a **shared** cache without the user or tenant in the key.

**Cache hit ratio** = hits ÷ total reads. 90% means only 1 in 10 reads reaches the database.

**Invalidation strategies:**
- **TTL** (time to live): the copy expires after N seconds. Simple; data may be old for up to N seconds.
- **Delete on write:** when data changes, delete its cache entry.
- **Versioned keys:** put a version in the key (`job:7:v3`), so new data uses a new key.

At SkillKeepr, static lists like specialities and countries are served as JSON files through a CDN, which is a simple, effective cache.

## 🎯 Why do we use it?

- **Speed:** a Redis read takes about 1 ms; a slow database query can take 100+ ms.
- **Less load:** the database handles fewer repeated queries, so it serves more users.
- **Lower cost and better resilience:** cached data can still be served when the source is slow.

## ⚠️ Common mistakes

- **Caching without a plan for invalidation.** Users see old data after saving.
- **Caching private data with `public`.** A CDN might show one user's page to another.
- **Forgetting the tenant or user in the cache key** in a multi-tenant app.
- **Caching everything.** Caches use memory, and rarely-read data just wastes it.

## 🗣️ How to answer in an interview

> "A cache keeps a copy of data close to where it's needed, so reads are faster and the database does less work. Caching happens at several layers: the browser and CDN using HTTP headers like Cache-Control and ETag, the application with an in-memory cache or Redis, and the database's own memory. I cache data that's read often and changes rarely, like job listings or settings, and never cache private data in a shared cache without the user or tenant in the key. The hard part is invalidation, so I use a TTL for data that can be a little old, and delete the cache entry on write when users must see changes immediately."

[FILL IN: a place you added or used caching in a real project, if any.]

## 🔁 Follow-up questions

### What is the difference between `no-cache` and `no-store`?

`no-cache` means "you may store it, but check with the server before using it". `no-store` means "never store it at all".

### What is a cache stampede?

A popular key expires, and hundreds of requests hit the database at the same moment to rebuild it. Fixes: a lock so only one request rebuilds, or refresh the key a little before it expires.

### What is an eviction policy?

What the cache throws out when it's full. LRU (least recently used) is the most common: the item not used for the longest time goes first.

### How do you know your cache is working?

Measure the hit ratio, database load and response times before and after.

## ✅ Quick check

### 1. A response has `Cache-Control: max-age=600`. How long can the browser reuse it without asking?

:::answer
**600 seconds = 10 minutes.**
:::

### 2. Which header value should a bank account page use?

- A) `public, max-age=3600`
- B) `no-store`
- C) `immutable`

:::answer
**B) `no-store`.** Sensitive, personal data must never be stored in caches.
:::

### 3. The server replies `304 Not Modified`. What does the browser do?

:::answer
It **reuses its saved copy**. The 304 response has no body, which saves bandwidth.
:::
