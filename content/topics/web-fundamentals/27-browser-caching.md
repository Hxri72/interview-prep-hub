---
title: Browser caching and cache busting
stack: web-fundamentals
order: 27
level: Intermediate
mustKnow: false
askedFrequency: common
summary:
  - The browser keeps copies of files (the cache) so it doesn't download them again. The server controls this with the Cache-Control header.
  - "max-age=N means 'use your copy for N seconds without asking'. no-cache means 'keep it, but check with me first'. no-store means 'don't keep it at all'."
  - "Revalidation: the browser sends the file's fingerprint (ETag). If nothing changed, the server answers 304 Not Modified with no body."
  - "Cache busting: put a content hash in file names (index-CnceAJRU.js). New code = new name, so long caching is safe."
  - "index.html must not be cached for long (no-cache). Otherwise users keep loading the old file names after a deploy."
cards:
  - q: What does Cache-Control max-age=31536000, immutable mean?
    a: Use this file for one year without asking the server again. It never changes under this name.
  - q: What is the difference between no-cache and no-store?
    a: no-cache lets the browser keep a copy but it must check with the server before using it. no-store means never keep a copy.
  - q: What is a 304 response?
    a: '"Not Modified": the browser''s copy is still current, so the server sends no body and the browser uses its cached copy.'
  - q: What is cache busting?
    a: Changing a file's URL when its content changes, usually with a content hash in the file name, so browsers fetch the new version.
  - q: Users see the old version after a deploy. What's the usual cause?
    a: index.html (or a CDN copy of it) is cached too long, so it still points to the old hashed files. Serve index.html with no-cache and invalidate the CDN.
---

## 💡 What is it?

When you open a website, the browser saves copies of its files. This store is the **cache**. Next time, it can reuse those copies instead of downloading them again. That makes pages load much faster.

The server decides how long copies may be used, with the `Cache-Control` header. **Cache busting** is the trick that makes sure users still get new code after a deploy.

## 🏠 Real-life example

Think of a **school textbook**.

- **Your own copy of the textbook** = the browser cache. You don't buy it again every day.
- **"Valid for this whole year"** = `max-age=31536000`. Use it all year without checking.
- **Asking the teacher, "Is my edition still current?"** = revalidation with an ETag. The teacher says "yes, keep using it" = **304 Not Modified**.
- **A new edition with a new cover number** = a new hashed file name. Nobody confuses it with the old one.
- **The notice board telling everyone which edition to use** = `index.html`. It must always be up to date, so students check it every day (`no-cache`).

## 🧑‍💻 Code example

A tiny server that sends an **ETag** (a short fingerprint of the file) and `no-cache`, then tests itself twice. Save as `cache.mjs` and run `node cache.mjs`.

```js
import http from 'node:http'; // Node's built-in web server
import { createHash } from 'node:crypto'; // to make a fingerprint (ETag) of the content
const body = 'console.log("app v1")'; // pretend this is app.js
const etag = '"' + createHash('sha1').update(body).digest('hex').slice(0, 10) + '"'; // a short fingerprint of the file
http.createServer((req, res) => { // runs for every request
  res.setHeader('Cache-Control', 'no-cache'); // "you may keep it, but check with me before using it"
  res.setHeader('ETag', etag); // the file's fingerprint
  if (req.headers['if-none-match'] === etag) { res.statusCode = 304; res.end(); return; } // same fingerprint → 304, no body
  res.end(body); // first visit or changed file → 200 with the full body
}).listen(4703, async () => { // start, then test ourselves
  const r1 = await fetch('http://localhost:4703/app.js'); // first visit: nothing cached yet
  console.log('1st:', r1.status, r1.headers.get('etag'), (await r1.text()).length, 'bytes'); // expect 200
  const r2 = await fetch('http://localhost:4703/app.js', { headers: { 'If-None-Match': r1.headers.get('etag') } }); // second visit: send the saved fingerprint
  console.log('2nd:', r2.status, (await r2.text()).length, 'bytes'); // expect 304 and 0 bytes
  process.exit(0); // stop the demo
}); // end of listen
```

Real output:

```text
1st: 200 "5f65c98454" 21 bytes
2nd: 304 0 bytes
```

The second time, the file didn't travel again. Only a tiny "still the same" answer did. For a 200 KB bundle, that saves a lot.

## 🔍 Deeper version

**Where caches live:**
- **Memory cache:** very fast, cleared when the tab closes.
- **Disk cache:** survives restarts.
- **CDN cache:** copies at edge servers near users. See [CDNs](topic:system-design/cdn).
- **Service worker cache:** a cache your own code controls, used by offline apps (PWAs).

**`Cache-Control` values:**

| Value | Meaning |
|---|---|
| `max-age=3600` | use the copy for 3600 seconds (1 hour) without asking |
| `no-cache` | keep a copy, but revalidate before every use |
| `no-store` | never store it (for private data like a bank statement) |
| `immutable` | the file will never change, so don't even revalidate on reload |
| `public` | shared caches (CDNs) may store it |
| `private` | only the user's browser may store it, not CDNs |
| `s-maxage=…` | how long shared caches like a CDN may keep it |

**Revalidation in detail.** The server sends `ETag: "abc"` (a fingerprint) or `Last-Modified: <date>`. Next time, the browser sends `If-None-Match: "abc"` or `If-Modified-Since: <date>`. If nothing changed, the server replies **304** with no body.

**The standard plan for a built frontend:**

| File | Header | Why |
|---|---|---|
| `assets/index-CnceAJRU.js`, `.css` | `public, max-age=31536000, immutable` | the name changes when the content changes, so a long cache is safe |
| `index.html` | `no-cache` | it lists the newest file names, so users must always get the fresh one |
| images without a hash | `max-age=3600` or so | a middle ground |
| API responses with private data | `private, no-store` or short `max-age` | don't let other users or CDNs see them |

**"Users see the old version after a deploy."** The usual causes, in order:
1. `index.html` was cached with a long `max-age` (in the browser or the CDN), so it still points to the old JS names.
2. The CDN wasn't invalidated after the deploy. See [Hosting a frontend on AWS](topic:web-fundamentals/hosting-frontend-aws).
3. A service worker served an old cached shell.

The fix is `no-cache` on `index.html`, a CDN invalidation for `/index.html`, and hashed names for everything else.

**How the hash gets into the name.** Bundlers like Vite and webpack add it automatically in production builds. See [Minification, source maps and hashed file names](topic:web-fundamentals/minify-sourcemaps). The bigger picture of caching layers is in [Caching](topic:system-design/caching).

## 🎯 Why do we use it?

- **Speed:** repeat visits load almost instantly.
- **Less bandwidth and cost:** fewer bytes leave your servers and CDN.
- **Safe updates:** with cache busting, long caching and fresh deploys work together.

## ⚠️ Common mistakes

- **Long-caching `index.html`.** The deploy is live, but users still see old code.
- **Long-caching files without a hash** (like `app.js`). Then users can't get the new version at all.
- **Using `no-store` everywhere "to be safe".** The site gets slow for no reason.
- **Letting a CDN cache private API responses.** Use `private` or `no-store` for user-specific data.

## 🗣️ How to answer in an interview

> "Browsers cache files based on the Cache-Control header. max-age says how long to use the copy without asking. no-cache means keep it but revalidate first, using an ETag or Last-Modified, and the server answers 304 Not Modified if nothing changed. no-store means don't keep it at all.
>
> For a built React app, I give hashed JS and CSS files a one-year immutable cache. Any change creates a new file name, which is cache busting. index.html gets no-cache, because it points to the newest file names. If users see an old version after a deploy, I first check whether index.html was cached too long, in the browser or the CDN, and whether the CDN was invalidated."

## 🔁 Follow-up questions

### What's the difference between `no-cache` and `max-age=0`?

They behave almost the same: the browser must revalidate before using the copy. `no-cache` states it more clearly, so it's the usual choice.

### Why use a content hash instead of `app.js?v=2`?

A hash changes automatically and only when the content changes. A manual version number is easy to forget, and some caches ignore query strings.

### How do you force all users to get a new version right now?

Deploy with new hashed names, serve `index.html` with `no-cache`, and invalidate it in the CDN. If you use a service worker, update it so it doesn't serve the old shell.

### Should API responses be cached?

Public, shared data can have a short `max-age` or be cached at the CDN. Private, per-user data should use `private` or `no-store`.

## ✅ Quick check

### 1. A file is served with `Cache-Control: no-cache` and an ETag. What happens on the second visit if it didn't change?

:::answer
The browser sends `If-None-Match` with the ETag. The server replies **304 Not Modified** with no body, and the browser uses its saved copy.
:::

### 2. Which file should NOT get `max-age=31536000`?

- A) `assets/index-CnceAJRU.js`
- B) `index.html`
- C) `assets/index-Bx2a9Lmw.css`

:::answer
**B.** `index.html` keeps the same name but its content changes on every deploy, so it needs `no-cache`.
:::

### 3. You deployed, but a user still sees the old screen. Name one likely cause.

:::answer
`index.html` is cached too long (browser or CDN), or the CDN wasn't invalidated, or a service worker is serving an old copy.
:::
