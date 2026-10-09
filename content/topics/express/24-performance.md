---
title: "Performance: compression, caching headers, clustering"
stack: express
order: 24
level: Advanced
mustKnow: false
askedFrequency: common
summary:
  - "Compression (gzip/brotli) shrinks responses a lot. A 21 KB JSON list can become about 2.5 KB."
  - "Caching headers tell browsers and CDNs how long they may reuse a response: Cache-Control: public, max-age=60. Use private, no-store for user data."
  - "ETags let the browser ask \"has this changed?\" If not, the server replies 304 Not Modified with no body."
  - "One Node process uses one CPU core for your JavaScript. Use the cluster module, PM2 or many containers to use all cores."
  - "The biggest wins are usually not in Express: fast database queries, indexes, caching (Redis), and never blocking the event loop."
cards:
  - q: What does the compression middleware do?
    a: It compresses responses (gzip, and brotli in newer versions) when the client supports it, so less data goes over the network.
  - q: "What does Cache-Control: public, max-age=60 mean?"
    a: Any cache (browser or CDN) may store the response and reuse it for 60 seconds without asking the server again.
  - q: What is an ETag and what is a 304?
    a: An ETag is a fingerprint of the response. The browser sends it back in If-None-Match; if nothing changed, the server replies 304 Not Modified with no body.
  - q: How do you use all CPU cores with Express?
    a: Run several Node processes, with the cluster module, PM2 in cluster mode, or several containers behind a load balancer. Keep the app stateless.
  - q: Where are the biggest performance wins in an Express API usually found?
    a: In the data layer (indexes, fewer and lighter queries, no N+1), caching hot data, and moving heavy CPU work off the event loop.
---

## 💡 What is it?

**Performance** means your API answers **fast**, even when many people use it at the same time.

In Express, three tools help a lot:
- **Compression**: make each response smaller, so it travels faster.
- **Caching headers**: tell browsers and CDNs they can **reuse** an answer, so they don't need to ask again.
- **Clustering**: run **several copies** of your app, so you use every CPU core.

But often the slow part isn't Express at all. It's usually the database, which we cover at the end.

## 🏠 Real-life example

Think of **a busy school canteen**.

- **Compression**: instead of carrying 30 separate plates, the server uses one tray that holds everything neatly. It's the same food, but much easier to carry. That's gzip making the response smaller.
- **Caching**: the canteen writes today's menu on a **board outside**. Students read the board. They don't ask the cook "what's for lunch?" again and again. The board says "valid until 1 PM". That's `Cache-Control: max-age`.
- **"Has anything changed?"**: a student asks, "Is the menu still the same?" The cook just nods: "Same." They don't read the whole menu again. That's an ETag and a **304 Not Modified** reply.
- **Clustering**: on a busy day, the canteen opens **4 counters** instead of 1. That's running 4 copies of your app, one per CPU core.
- **The real slowdown**: if the kitchen cooks slowly, more counters won't help. That's the database. Fix the kitchen first.

## 🧑‍💻 Code example

Set up:

```bash
npm init -y
npm install express compression
```

Save this as `perf.js`. Run it with `node perf.js`.

```js
const express = require('express');                               // load Express
const compression = require('compression');                       // middleware that gzips responses

const app = express();                                            // create the app
app.use(compression());                                           // compress responses bigger than about 1 KB

const jobs = Array.from({ length: 500 }, (_, i) => ({ id: i, title: `Node.js developer ${i}` })); // a big-ish JSON list

app.get('/jobs', (req, res) => {                                  // a public list that changes rarely
  res.set('Cache-Control', 'public, max-age=60');                 // browsers and CDNs may reuse it for 60 seconds
  res.json(jobs);                                                 // Express also adds an ETag (a fingerprint of the body)
});                                                               // end of the route

app.get('/me', (req, res) => {                                    // private, per-user data
  res.set('Cache-Control', 'private, no-store');                  // never store this in shared caches
  res.json({ name: 'Asha' });                                     // small reply
});                                                               // end of the route

app.listen(3000, () => console.log('Listening on 3000'));         // start the server on port 3000
```

Try it:

```text
$ curl -s -o /dev/null -w "%{size_download} bytes\n" http://localhost:3000/jobs
21281 bytes                                   ← without compression

$ curl -s -o /dev/null -H "Accept-Encoding: gzip" -w "%{size_download} bytes\n" http://localhost:3000/jobs
2534 bytes                                    ← with gzip: about 8× smaller

$ curl -s -D - -o /dev/null -H "Accept-Encoding: gzip" http://localhost:3000/jobs
Cache-Control: public, max-age=60
ETag: W/"5321-COLzDCjHHYaeiuXgaxSQvHTVZdM"
Content-Encoding: gzip

$ curl -s -o /dev/null -w "%{http_code} %{size_download} bytes\n" \
    -H 'If-None-Match: W/"5321-COLzDCjHHYaeiuXgaxSQvHTVZdM"' http://localhost:3000/jobs
304 0 bytes                                   ← "nothing changed", so no body is sent
```

## 🔍 Deeper version

**1. Compression.**
- `compression()` uses gzip or deflate, and brotli in recent versions, based on the `Accept-Encoding` header.
- It skips small responses (below about 1 KB), because they don't shrink much.
- Compressing costs CPU. At high traffic, many teams let **nginx, a load balancer or a CDN** compress instead, so Node doesn't spend its single thread on it.
- Images and videos are already compressed. Gzipping them again wastes CPU.

**2. Caching headers.**

| Header | Meaning |
|---|---|
| `Cache-Control: public, max-age=60` | Anyone (browser, CDN) may reuse it for 60 s |
| `Cache-Control: private, max-age=60` | Only the user's browser may keep it, not shared caches |
| `Cache-Control: no-store` | Never store it (use for personal or sensitive data) |
| `Cache-Control: no-cache` | Store it, but check with the server (ETag) before each use |
| `max-age=31536000, immutable` | Keep for a year; for files with a hash in the name, like `app.3f9a.js` |

**ETags.** For `res.send` and `res.json`, Express adds a weak ETag by default (`W/"…"`). This is a fingerprint of the body. On the next request, the browser sends `If-None-Match`. If it matches, Express replies **304** with no body. Note that the server still ran your route and built the JSON. A 304 saves **network**, not **server work**. To save server work, cache the data itself (see Redis below).

**3. Use every CPU core.** Your JavaScript runs on one thread, so one process uses about one core.
- **cluster module or PM2** (`pm2 start server.js -i max`): several processes share one port. See [cluster and PM2](topic:nodejs/cluster-and-pm2).
- **Containers**: run several copies behind a load balancer (Kubernetes, ECS, Cloud Run). This is the common approach today.
- The app must be **stateless**: no sessions or caches stored in process memory. Use Redis or the database.

**4. The usual big wins (outside Express):**
- **Database**: the right indexes, select only needed fields, `lean()` in Mongoose, no N+1 queries (one query per item in a loop), and pagination.
- **Caching data**: keep hot, rarely-changing data in Redis (the cache-aside pattern).
- **Don't block the event loop**: no sync file reads, huge `JSON.parse` or heavy loops inside requests. See [blocking the event loop](topic:nodejs/blocking-the-event-loop).
- **Do slow work later**: send emails and build reports in a background queue (like BullMQ), and reply right away.
- **Run calls in parallel**: `Promise.all` for independent calls, instead of `await` one by one.

**5. Smaller Express-level tips.**
- Set `NODE_ENV=production`. Express then caches view templates and hides stack traces in error pages, and many libraries skip extra debug work.
- Keep the middleware list short, and put cheap checks (like auth) before expensive ones.
- Measure first: response time logs, APM tools, `autocannon` for load testing, and `--inspect` profiling. Don't guess.

## 🎯 Why do we use it?

- **Faster pages.** Smaller and cached responses load faster, especially on mobile data.
- **More users per server.** Less work per request means the same servers handle more traffic.
- **Lower cost.** Less bandwidth and fewer servers.
- **Better experience.** Users notice delays of even a few hundred milliseconds.

## ⚠️ Common mistakes

- **Caching personal data as `public`.** A CDN could show one user's data to another user. Use `private, no-store` for anything per-user.
- **Adding clustering before fixing slow queries.** More copies of a slow query just load the database more.
- **Compressing in Node at huge scale.** It uses the single JavaScript thread. Let the proxy or CDN do it.
- **Optimising without measuring.** Find the real slow part first with logs, profiling and load tests.

## 🗣️ How to answer in an interview

> "I start by measuring: response-time logs, profiling and a load test, so I fix the real bottleneck. The biggest wins are usually in the data layer: proper indexes, fetching only the fields I need, avoiding N+1 queries, and caching hot data in Redis. Then I make sure nothing blocks the event loop, and slow work like emails goes to a background queue.
>
> At the Express level, I enable compression, or let nginx or the CDN do it at scale. I set Cache-Control headers: public with a max-age for shared, rarely changing data, and private, no-store for user data. Express adds ETags, so unchanged responses come back as 304 with no body.
>
> To use all CPU cores, I run several stateless processes, with PM2 cluster mode or multiple containers behind a load balancer, and keep sessions and cache in Redis."

[FILL IN: one real performance fix you made at SkillKeepr — the resume mentions indexing so response times held as data grew; add the details only if you remember them.]

## 🔁 Follow-up questions

### Does a 304 response mean the server did no work?

No. The route still ran and built the response. Express then compared the ETag and sent only a 304. It saves bandwidth, not CPU or database time. To save server work, cache the data (Redis) or the whole response (CDN).

### `no-cache` vs `no-store`?

`no-store` means never keep a copy. `no-cache` means you may keep a copy, but must check with the server before using it (with an ETag). The names are confusing; remember that "no-store" is the strict one.

### When should you NOT use compression in Node?

For already-compressed files (images, video, zip). Also for tiny responses, and when a proxy or CDN in front already compresses. Then Node's thread stays free for your app logic.

### How would you find out why an endpoint is slow?

Add timing logs around each step (database, external APIs, processing). Check the database query plan (`explain` in MongoDB). Look for N+1 queries and missing indexes. Profile with `--inspect` if CPU is high. Then fix the biggest part first and measure again.

## ✅ Quick check

### 1. Which header fits `GET /me` (the logged-in user's profile)?

- A) `Cache-Control: public, max-age=3600`
- B) `Cache-Control: private, no-store`
- C) No header at all

:::answer
**B.** It's personal data. `public` could let a shared cache (like a CDN) serve one user's profile to someone else.
:::

### 2. The browser sends `If-None-Match` with the current ETag. What does Express reply?

:::answer
**304 Not Modified**, with no body. The browser uses its saved copy.
:::

### 3. An endpoint takes 3 seconds because of a MongoDB query with no index. Will running 4 cluster workers fix it?

:::answer
**No.** Each request still waits 3 seconds for the slow query, and 4 workers put even more load on the database. Add the right index (and maybe cache the result) first.
:::
