---
title: One server vs separate frontend and backend
stack: mern-architectures
order: 3
level: Basic
mustKnow: true
askedFrequency: very common
template: pattern
section: Foundations
summary:
  - "There are two common ways to run a MERN app - one server that sends both the React files and the API, or two separate deployments."
  - "One server: Express serves the React build and the /api routes. One URL, one deploy, no CORS."
  - "Separate: React goes to a static host or CDN (S3 + CloudFront, Vercel, Netlify), and the API runs on its own server or Lambda."
  - Separate deployments scale and release independently, but need CORS (or one domain with path routing) and two pipelines.
  - Small apps often start with one server; growing products usually split.
cards:
  - q: What are the two common ways to deploy a MERN app?
    a: One server where Express serves both the React build and the API, or separate deployments where React is on a static host/CDN and the API runs on its own.
  - q: Why don't you need CORS with one server?
    a: The page and the API come from the same origin (same protocol, domain and port), so the browser allows the calls.
  - q: Name one big benefit of separate deployments.
    a: You can deploy and scale the frontend and backend on their own. A CSS fix doesn't redeploy the API, and the static files go on a cheap, fast CDN.
  - q: How can separate deployments avoid CORS?
    a: Put both behind one domain and route by path, e.g. CloudFront sends /api/* to the API and everything else to S3.
---

## 💡 What is it?

Your MERN app has a React part and an Express part. You must decide **how to run them**.

- **One server:** Express sends the React files *and* answers the API calls. One app, one URL.
- **Separate:** React's built files live on a static host. The Express API runs somewhere else.

Both are correct. The best choice depends on the size of the app and the team.

## 🏠 Real-life example

Think of **a small café vs a food court**.

- **The small café** = one server. The same counter gives you the menu and the food. Simple and cheap to run.
- **The food court** = separate deployments. One stall prints the menus (static files), another kitchen cooks (the API). Each can open, close or grow on its own.
- **The common entrance of the food court** = one domain with path routing. Customers walk in one door, and signs send them to the right stall. No confusion (no CORS).

## 🗺️ The diagram

```text
 OPTION A: ONE SERVER
 ┌─────────┐   GET /            ┌──────────────────────────────┐        ┌─────────┐
 │ Browser │ ─────────────────▶ │ Express (one Node process)   │ ─────▶ │ MongoDB │
 │         │   GET /api/users   │  • express.static(dist)      │        └─────────┘
 └─────────┘ ─────────────────▶ │  • /api/* routes             │
                                └──────────────────────────────┘
                  same origin → no CORS · one deploy

 OPTION B: SEPARATE
                  GET /  (HTML, JS, CSS)
 ┌─────────┐ ───────────────────────────▶ ┌───────────────────────────┐
 │ Browser │                              │ Static host / CDN         │
 │         │                              │ (S3 + CloudFront, Vercel) │
 │         │                              └───────────────────────────┘
 │         │   GET /api/users             ┌───────────────────────────┐        ┌─────────┐
 │         │ ───────────────────────────▶ │ API (Express server,      │ ─────▶ │ MongoDB │
 └─────────┘                              │  container or Lambda)     │        └─────────┘
                                          └───────────────────────────┘
        different origins → needs CORS (or one domain that routes /api/* to the API)
```

## 🧑‍💻 Code example

**Option A: one server.** First build React with `npm run build` inside the `web` folder. That creates `web/dist`. Then save this as `server.js` in the project root and run `node server.js` (after `npm install express`).

```js
const express = require('express');                                  // the web framework
const path = require('node:path');                                   // builds file paths safely

const app = express();                                               // one app for everything
app.get('/api/hello', (req, res) => res.json({ msg: 'Hi from API' })); // API routes first, under /api

const dist = path.join(__dirname, 'web', 'dist');                    // the folder Vite built
app.use(express.static(dist));                                       // send JS, CSS and images from dist
app.get('/{*splat}', (req, res) => res.sendFile(path.join(dist, 'index.html'))); // any other path → React's index.html

app.listen(3000, () => console.log('App + API on http://localhost:3000')); // 3000 = the only port
```

**Option B: separate.** The API allows the frontend's origin with CORS. Save as `api/server.js` and run `node server.js` (after `npm install express cors`).

```js
const express = require('express');                                  // the web framework
const cors = require('cors');                                        // adds CORS headers

const app = express();                                               // API only, no React files here
app.use(cors({ origin: process.env.WEB_ORIGIN ?? 'http://localhost:5173', credentials: true })); // who may call us; credentials = allow cookies
app.get('/api/hello', (req, res) => res.json({ msg: 'Hi from API' })); // the API route

app.listen(4000, () => console.log('API on http://localhost:4000'));  // 4000 = API port; React runs elsewhere
```

In React (Option B), the API's address comes from a Vite [environment variable](glossary:environment-variable). Put `VITE_API_URL=http://localhost:4000` in `web/.env`.

```js
const API = import.meta.env.VITE_API_URL;                            // read at build time; different per environment
const res = await fetch(`${API}/api/hello`, { credentials: 'include' }); // include = send cookies cross-origin
console.log(await res.json());                                       // { msg: 'Hi from API' }
```

:::version[Version note]
Express 5 changed wildcard routes. The old `app.get('*', …)` must now be written with a named wildcard, like `'/{*splat}'`. See [Express 5 changes](topic:express/express-5).
:::

## 🔍 Deeper version

**Same-origin vs cross-origin.** An origin is protocol + domain + port. `https://app.com` and `https://api.app.com` are different origins. The browser blocks cross-origin reads unless the server sends CORS headers. See [same-origin policy](topic:web-fundamentals/same-origin-policy).

**Three ways to avoid CORS pain:**
1. **One server** (Option A).
2. **One domain, path routing.** A CDN or load balancer sends `/api/*` to the API and everything else to the static files. The browser sees one origin.
3. **Vite's dev proxy** in local development. Vite forwards `/api` calls to port 4000, so dev feels like one origin.

**Cookies across sites.** With HttpOnly cookie auth on separate domains, you need `credentials: 'include'` in fetch, `credentials: true` in CORS, and the right `SameSite` and `Secure` cookie settings. Subdomains of one site (`app.example.com` and `api.example.com`) are easier than two different sites. See [token storage](topic:rest-auth/token-storage).

**Build-time vs run-time config.** In Option B, `VITE_API_URL` is baked into the JS at build time. To point the same build at another API, you rebuild, or load a small `config.json` at start-up. See [env at build vs run time](topic:web-fundamentals/env-build-vs-runtime).

**Where each option usually runs:**

| | One server | Separate |
|---|---|---|
| Frontend | Inside the Node app | S3 + [CDN](glossary:cdn), Vercel, Netlify |
| Backend | Same Node app on a VPS, Railway, Render, or a [container](glossary:container) | Its own server, container or [serverless](glossary:serverless) functions |
| Deploys | One pipeline | Two pipelines |
| Scaling | Scale the whole app together | Static files scale almost free; scale only the API |

## ⚖️ Pros and cons

| | One server | Separate |
|---|---|---|
| **Pros** | One deploy, one URL, no CORS, cheap, simple to explain | Independent deploys, static files on a fast CDN, API scales alone, teams work separately |
| **Cons** | Node also serves files (less efficient), a UI change redeploys the API, scales as one block | CORS and cookie settings, two pipelines, version mismatch risk between UI and API |

## 🎯 When to choose it

- **One server:** a college project, a portfolio, an internal admin tool, an early MVP, or a small team on Railway or Render.
- **Separate:** a growing SaaS product, a team with separate frontend and backend developers, an app with a mobile client, or heavy traffic where a CDN matters.
- **Separate on AWS:** a common setup is React on S3 + CloudFront, and the API on Lambda behind API Gateway. SkillKeepr uses this shape. See [serverless MERN](topic:mern-architectures/serverless-mern).

## ⚠️ Common mistakes

- **Putting the catch-all route before `/api` routes.** Then API calls get `index.html` instead of JSON.
- **Using `origin: '*'` with cookies.** Browsers reject `*` when credentials are included. List the exact origin.
- **Hard-coding `http://localhost:4000` in React.** It breaks in production. Use an environment variable.
- **Deploying a new API that breaks the old UI.** With separate deploys, keep the API backward-compatible for a while.

## 🗣️ How to answer in an interview

> "There are two common ways to run a MERN app. In the first, one Express server serves the React build with `express.static` and also handles the `/api` routes. It's one deploy and one origin, so there's no CORS. It's great for small apps and MVPs.
>
> In the second, the React build goes to a static host or CDN, and the API runs separately on a server, a container or Lambda. Each side deploys and scales on its own, and the static files are served fast from the CDN. The cost is CORS and cookie settings, two pipelines, and keeping the API backward-compatible.
>
> At SkillKeepr we use the separate model: the React apps are on S3 with CloudFront, and the backend is serverless on Lambda behind API Gateway. For a small project, I'd start with one server and split later."

## 🔁 Follow-up questions

### How do you avoid CORS with separate deployments?

Put both behind one domain. For example, CloudFront sends `/api/*` to API Gateway and everything else to S3. The browser sees one origin, so no CORS checks are needed.

### Why does a page refresh on `/dashboard` give a 404 sometimes?

The server looks for a file called `/dashboard` and doesn't find it. A [SPA](glossary:spa) needs the server to return `index.html` for unknown paths, so React Router can show the page. See [Express serving the React build](topic:mern-architectures/express-serves-react).

### Can you switch from one server to separate later?

Yes, if React uses a configurable API URL and only talks to `/api` routes. Then you move the build to a CDN, add CORS or path routing, and deploy the API on its own.

### Which is cheaper?

For tiny apps, one server is usually cheapest: one small machine. At scale, separate is often cheaper, because a CDN serves static files very cheaply and you only scale the API.

## ✅ Quick check

### 1. React runs on `https://app.example.com`, and the API on `https://api.example.com`. Same origin?

:::answer
**No.** The domains are different, so they're different origins. The API must send CORS headers (or both must go behind one domain).
:::

### 2. In the one-server code, what goes wrong if the `'/{*splat}'` route is written before `/api/hello`?

:::answer
The catch-all matches first, so `/api/hello` returns `index.html` instead of JSON.
:::

### 3. Which option lets you fix a CSS bug without redeploying the API?

:::answer
**Separate deployments.** You only rebuild and upload the frontend.
:::
