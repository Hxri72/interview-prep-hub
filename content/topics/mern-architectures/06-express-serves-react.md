---
title: Express serving the React build
stack: mern-architectures
order: 6
level: Basic
mustKnow: false
askedFrequency: common
template: pattern
section: Frontend and rendering
summary:
  - "One Node process does both jobs - express.static sends the React build files, and /api routes send JSON."
  - "Route order matters: API routes first, then static files, then a catch-all that returns index.html for client-side routes."
  - "Set caching right: hashed assets cached for a year, index.html not cached."
  - "Deploy is one step - build React, copy dist next to the server, start Node. No CORS, one URL."
  - Good for small apps and MVPs; at scale, a CDN serves static files better than Node.
cards:
  - q: Which Express middleware serves the React build?
    a: express.static, pointed at the dist (or build) folder.
  - q: Why do you need a catch-all route that returns index.html?
    a: So refreshing a client-side route like /jobs/42 loads the React app instead of a 404. React Router then shows the right screen.
  - q: Why must /api routes come before the catch-all?
    a: Express matches routes in order. If the catch-all is first, API calls get index.html instead of JSON.
  - q: How should caching be set for a Vite build served by Express?
    a: "Long cache (max-age one year, immutable) for hashed files in assets/, and no-cache for index.html so new deploys show up."
---

## 💡 What is it?

Here, **one Express app does everything**. It answers API calls under `/api`. It also sends the React files that Vite built.

You build React once with `npm run build`. Express serves the `dist/` folder with `express.static`. For any other page path, Express sends `index.html`, and React Router shows the right screen.

This is the "one server" option from [one server vs separate](topic:mern-architectures/one-server-vs-separate), in full detail.

## 🏠 Real-life example

Think of **a school office**.

- **The notice board with printed forms** = the static files (`dist/`). Anyone can pick them up. They don't change during the day.
- **The clerk at the window** = the `/api` routes. You ask a question and get a fresh, personal answer.
- **"Not sure where to go? Take the school map"** = the catch-all route. Any unknown room number gets the map (`index.html`), and the map (React Router) shows you the way.
- **One building, one address** = one origin. Parents don't need special permission to go from the board to the window (no CORS).

## 🗺️ The diagram

```text
                      ┌──────────────────────── Express (one Node process) ────────────────────────┐
 Browser request ───▶ │ 1. /api/*            → API routes → MongoDB → JSON                          │
                      │ 2. /assets/a1b2.js   → express.static(dist) → file (cached 1 year)          │
                      │ 3. /jobs/42 (no file)→ catch-all → dist/index.html (no-cache)               │
                      │                         → React loads → React Router shows the Job page    │
                      └─────────────────────────────────────────────────────────────────────────────┘

 Build + deploy:  web/ ── npm run build ──▶ web/dist/ ──▶ shipped with server.js ──▶ node server.js
```

## 🧑‍💻 Code example

Folder layout: `web/` (Vite React app) and `server.js` in the root. Install with `npm install express`. Build React first with `npm run build` inside `web`. Then run `node server.js` and open http://localhost:3000.

```js
const express = require('express');                                  // the web framework
const path = require('node:path');                                   // safe file paths on every OS

const app = express();                                               // the one app
app.use(express.json());                                             // parse JSON bodies for the API

// ---- 1. API routes come first ----
const api = express.Router();                                        // a mini-app for /api
api.get('/jobs', (req, res) => res.json([{ _id: '1', title: 'MERN Developer' }])); // demo data
api.use((req, res) => res.status(404).json({ error: 'No such API route' })); // 404 as JSON for unknown /api paths
app.use('/api', api);                                                // mount it under /api

// ---- 2. Static files from the React build ----
const dist = path.join(__dirname, 'web', 'dist');                    // where Vite put the build
app.use('/assets', express.static(path.join(dist, 'assets'), {       // hashed JS/CSS/images
  maxAge: '1y',                                                      // 1y = browsers keep them for a year
  immutable: true,                                                   // the file never changes (new version = new name)
}));                                                                 // end of assets
app.use(express.static(dist, { index: false }));                     // other files like favicon.ico; index: false = let step 3 send index.html

// ---- 3. Catch-all: send index.html for client-side routes ----
app.get('/{*splat}', (req, res) => {                                 // any path not matched above (Express 5 syntax)
  res.set('Cache-Control', 'no-cache');                              // always check for a new index.html
  res.sendFile(path.join(dist, 'index.html'));                       // React loads, React Router reads the URL
});                                                                  // end of catch-all

const PORT = process.env.PORT ?? 3000;                               // hosts like Railway give PORT; 3000 locally
app.listen(PORT, () => console.log(`App + API on http://localhost:${PORT}`)); // start the one server
```

Try these:

```text
GET /api/jobs        → [{"_id":"1","title":"MERN Developer"}]
GET /api/nope        → 404 {"error":"No such API route"}
GET /jobs/42         → index.html (React Router shows the page)
GET /assets/index-*.js → the bundle, with Cache-Control: public, max-age=31536000, immutable
```

## 🔍 Deeper version

**Why API 404s must stay JSON.** Without the `/api` 404 handler, a typo like `/api/jbos` falls through to the catch-all and returns HTML. The frontend then fails with a confusing "Unexpected token <" JSON error. Keep API misses inside `/api`.

**Production build pipeline.** A typical `package.json` in the root:
- `"build": "npm --prefix web ci && npm --prefix web run build"`
- `"start": "node server.js"`

The host runs `build`, then `start`. On Railway or Render, this is one service. In Docker, a multi-stage build makes the React files in one stage and copies `dist/` into a small Node image. See [a Dockerfile for Node](topic:devops/dockerfile-node).

**Extra middleware worth adding:**
- `compression()` gzips text responses (or let a reverse proxy like Nginx do it).
- `helmet()` sets security headers. Its Content Security Policy may need tuning for your React build. See [security middleware](topic:express/security-middleware).

**Efficiency.** Node can serve files, but it's not its best job. Each file request uses the same event loop as your API. A reverse proxy (Nginx) or a [CDN](glossary:cdn) in front can cache files and take that load away. See [serving static files](topic:express/static-files).

**Environment config.** Because the page and the API share one origin, React can call `/api/...` with a relative URL. No `VITE_API_URL` is needed, and the same build works in every environment.

:::version[Version note]
Express 5 uses a new path syntax. The old catch-all `app.get('*', …)` becomes `app.get('/{*splat}', …)`. See [Express 5 changes](topic:express/express-5).
:::

## ⚖️ Pros and cons

| Pros | Cons |
|---|---|
| One deploy, one URL, one service to watch | Node spends event-loop time sending files |
| No CORS, simple cookie auth (same origin) | A small CSS fix redeploys the whole server |
| Relative `/api` URLs, the same build in every environment | Frontend and backend must scale together |
| Cheap: one small server or one PaaS service | No global CDN by default, so far-away users load slower |

## 🎯 When to choose it

- **MVPs and side projects** on one small server, Railway or Render.
- **Internal tools** used by a few people in one office.
- **When cookie-based auth must be simple**, because everything is same-origin.
- **Move away from it** when traffic grows, you need a CDN, or separate teams want separate releases. Then go to [a CSR SPA on a CDN with a separate API](topic:mern-architectures/csr-spa-api).

## ⚠️ Common mistakes

- **Catch-all before `/api` routes.** API calls return HTML.
- **Forgetting to build React before deploying.** `dist/` is missing, and every page fails with "ENOENT: no such file".
- **Committing `dist/` to Git and forgetting to rebuild.** The server ships old UI code. Build in CI or on the host.
- **Caching `index.html` for a long time.** Users see the old app after a deploy.

## 🗣️ How to answer in an interview

> "For a small app, I'd let one Express server serve both. API routes are mounted under `/api` first, with their own JSON 404. Then `express.static` serves the Vite `dist` folder: hashed assets with a one-year immutable cache, and `index.html` with no-cache. Last, a catch-all returns `index.html` for any other path, so refreshing a client-side route like `/jobs/42` works and React Router takes over.
>
> It's one deploy and one origin, so there's no CORS and cookie auth is simple. The trade-off is that Node also serves files, and the UI and API deploy and scale together. When traffic grows, I'd move the static files to a CDN like CloudFront and run the API on its own."

## 🔁 Follow-up questions

### Why do you set `index: false` on `express.static`?

Without it, `express.static` sends `index.html` for `/` with its own default cache headers. With `index: false`, the catch-all sends it, so `index.html` always gets `no-cache`.

### How would you put a CDN in front of this setup?

Point CloudFront (or Cloudflare) at the Express server as the origin. Let it cache `/assets/*` for a long time, pass `/api/*` through without caching, and keep `index.html` short-lived.

### Is this the same as server-side rendering?

No. Express only sends the same `index.html` shell for every page. React still renders in the browser. SSR means the server builds the page's HTML with real content for each request. See [SSR with Next.js](topic:mern-architectures/ssr-nextjs).

### What happens to logged-in users during a redeploy?

With one server, there's a short restart. Use a host that does zero-downtime deploys, or run two copies behind a load balancer. With [graceful shutdown](topic:nodejs/graceful-shutdown), in-flight requests finish first.

## ✅ Quick check

### 1. A user requests `/settings`. No such file exists in `dist/`. What does this server return?

:::answer
`index.html`, from the catch-all route. React then loads and React Router shows the Settings screen.
:::

### 2. Why does the code add a 404 handler inside the `/api` router?

:::answer
So unknown API paths return a **JSON 404** instead of falling through to the catch-all and returning HTML.
:::

### 3. Which needs `Cache-Control: no-cache`: `index.html` or `/assets/index-a1b2.js`?

:::answer
**`index.html`.** The hashed asset can be cached for a year, because a new build gets a new file name.
:::
