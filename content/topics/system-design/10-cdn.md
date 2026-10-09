---
title: CDNs
stack: system-design
order: 10
level: Basic
mustKnow: false
askedFrequency: common
summary:
  - A CDN (content delivery network) is a set of servers around the world that keep copies of your files close to users.
  - The first user in a city gets a cache MISS (the edge fetches from your origin); the next users get a fast HIT.
  - CDNs are perfect for static files (JS, CSS, images, videos) and can also cache some public API responses.
  - Cache-Control headers and hashed file names decide how long edges keep copies; invalidation clears them early.
  - A common setup is a React app in an S3 bucket with CloudFront (AWS's CDN) in front.
cards:
  - q: What is a CDN?
    a: A network of edge servers in many cities that cache copies of your content, so users download it from somewhere nearby.
  - q: What is the origin?
    a: Your real server or storage (like an S3 bucket) that holds the original files. Edges fetch from it on a cache miss.
  - q: What is a cache HIT vs MISS at the edge?
    a: HIT = the edge already has the file and serves it at once. MISS = it doesn't, so it fetches from the origin, saves a copy, then serves it.
  - q: How do you make sure users get a new JS file after a deploy?
    a: Use hashed file names (app.3f9a.js) with long caching, and serve index.html with no-cache; or invalidate the CDN cache.
  - q: Besides speed, what else can a CDN give you?
    a: Less load on your servers, protection from traffic spikes and DDoS, TLS at the edge, and lower bandwidth costs.
---

## 💡 What is it?

A **CDN (content delivery network)** is a group of servers spread across many cities and countries. These are called **edge servers**.

Each edge keeps **copies of your files**, like images, JavaScript and CSS. A user in Mumbai downloads them from a server in Mumbai, not from your main server far away.

Your main server or storage is called the **origin**.

## 🏠 Real-life example

Think of **a newspaper**.

- The **printing press** is in one city = the **origin**.
- Copies are sent to **newspaper stalls in every area** = the **edge servers**.
- You buy the paper at the **stall near your house** = the user gets files from the **nearest edge**.
- If the stall **runs out**, it asks the depot for more copies = a **cache MISS**.
- If it **has copies**, you get one instantly = a **cache HIT**.
- If there's a **printing mistake**, the press tells every stall to throw away today's copies = **invalidation**.

## 🧑‍💻 Code example

A tiny simulation of two edge servers and one origin. Save as `cdn.js`, run `node cdn.js`.

```js
const originFiles = { '/logo.png': 'LOGO-BYTES' };            // the origin server (e.g. an S3 bucket) holds the real file
let originHits = 0;                                           // counts trips to the far-away origin

function makeEdge(city) {                                     // an edge server is a CDN copy close to users
  const cache = new Map();                                    // this edge's own saved copies
  return function get(path) {                                 // a user in this city asks for a file
    if (cache.has(path)) return `${city}: HIT  (served from nearby)`; // already saved here → fast
    originHits++;                                             // not saved → go to the origin once
    cache.set(path, originFiles[path]);                       // save the copy at this edge
    return `${city}: MISS (fetched from origin, now saved)`;  // first visit in this city is slower
  };                                                          // end of get
}                                                             // end of makeEdge

const mumbai = makeEdge('Mumbai');                            // edge server in Mumbai
const london = makeEdge('London');                            // edge server in London
console.log(mumbai('/logo.png'));                             // 1st Mumbai user → MISS
console.log(mumbai('/logo.png'));                             // 2nd Mumbai user → HIT
console.log(london('/logo.png'));                             // 1st London user → MISS (different edge)
console.log(london('/logo.png'));                             // 2nd London user → HIT
console.log('trips to origin:', originHits);                  // only 2 trips for 4 users
```

**Output:**

```text
Mumbai: MISS (fetched from origin, now saved)
Mumbai: HIT  (served from nearby)
London: MISS (fetched from origin, now saved)
London: HIT  (served from nearby)
trips to origin: 2
```

Four users, but the origin was asked only twice. With millions of users, the origin may serve only a tiny fraction of requests.

## 🔍 Deeper version

**How a request reaches the edge.** The DNS answer for `cdn.example.com` points to the CDN. The CDN routes the user to the **nearest healthy edge**. See [what happens when you type a URL](topic:system-design/what-happens-url).

**What to put on a CDN:**

| Content | CDN? | Notes |
|---|---|---|
| JS, CSS, fonts, images | ✅ Yes | Use hashed file names and long caching |
| Videos | ✅ Yes | Often streamed in small chunks |
| `index.html` of a SPA | ✅ With `no-cache` | So users always get the newest file list |
| Public API data (job listings) | ⚠️ Sometimes | Short TTL, only if it's the same for everyone |
| Private, per-user data | ❌ No | Unless you're very careful with cache keys |

**Controlling the cache.** Edges follow your `Cache-Control` headers (see [caching](topic:system-design/caching)):
- `app.3f9a2c.js` → `public, max-age=31536000, immutable` (1 year). The hash in the name changes with every build, so a new file gets a new URL.
- `index.html` → `no-cache`, so every visit checks for the newest version.

**Invalidation.** You can tell the CDN to delete copies early, e.g. CloudFront invalidation of `/*` after a deploy. It takes some time to reach every edge, and many invalidations can cost money, so hashed file names are the better everyday method.

**A common AWS setup:**

```text
User ──► CloudFront edge (CDN) ──miss──► S3 bucket (origin) with the built React app
```

SkillKeepr's three React apps are hosted this way: built files in S3, served through CloudFront. Static data like specialities and countries is also served as JSON through a CDN.

**Extra benefits:**
- **Less load and bandwidth** on your servers.
- **DDoS protection:** the CDN absorbs huge traffic spikes.
- **TLS at the edge:** the HTTPS handshake happens close to the user, which is faster.
- **Edge functions:** small code at the edge (like CloudFront Functions or Lambda@Edge) can rewrite URLs or add headers.

## 🎯 Why do we use it?

- **Speed:** files travel a short distance, so pages load faster, especially for far-away users.
- **Scale:** the origin handles a tiny part of the traffic.
- **Reliability:** if one edge fails, users are routed to another.

## ⚠️ Common mistakes

- **Long caching on `index.html`.** Users keep loading old JavaScript after a deploy.
- **No hashed file names,** then relying on invalidation after every deploy.
- **Caching personal pages publicly.** One user may see another user's data.
- **Forgetting CORS headers** for fonts or API responses served from a different domain.

## 🗣️ How to answer in an interview

> "A CDN is a network of edge servers around the world that cache copies of my files near users. The first request in a region is a miss, so the edge fetches from my origin, like an S3 bucket, and saves a copy. Later requests are hits and are served instantly from nearby. I put JS, CSS, images and videos on the CDN. Built files get hashed names and a one-year cache, while index.html gets no-cache, so users always pick up the newest build. Besides speed, a CDN reduces load on my servers, absorbs traffic spikes and DDoS, and ends TLS close to the user. A common setup is a React app in S3 with CloudFront in front."

[FILL IN: your part, if any, in the S3 + CloudFront setup or deploys at SkillKeepr.]

## 🔁 Follow-up questions

### Can a CDN cache API responses?

Yes, if the response is public and the same for everyone, like a list of open jobs. Use a short `max-age` (like 60 s). Never cache per-user or per-tenant responses as public.

### What is the difference between a CDN and a load balancer?

A CDN caches content at many locations near users. A [load balancer](topic:system-design/load-balancers-stateless) spreads requests across your own servers in one region. They are often used together.

### Why is the first visit from a new country still slow?

That edge has a cache miss and must fetch from the origin first. Some CDNs use an extra "origin shield" layer to reduce these trips.

### How do you roll back a bad front-end deploy on a CDN?

Point `index.html` back to the previous build's files (they're still in S3 with their old hashed names) and invalidate `index.html`.

## ✅ Quick check

### 1. A user in Chennai requests `logo.png` for the first time in that region. HIT or MISS?

:::answer
**MISS.** The Chennai edge doesn't have it yet, so it fetches from the origin and saves a copy. The next Chennai user gets a HIT.
:::

### 2. Which file should NOT have a one-year cache?

- A) `app.3f9a2c.js`
- B) `index.html`
- C) `logo.8b1d.png`

:::answer
**B) `index.html`.** It lists the current files, so it must always be fresh. Hashed files can be cached for a year.
:::

### 3. Name two benefits of a CDN besides speed.

:::answer
Any two of: **less load on your servers**, **lower bandwidth costs**, **DDoS / spike protection**, **TLS close to users**, **better reliability**.
:::
