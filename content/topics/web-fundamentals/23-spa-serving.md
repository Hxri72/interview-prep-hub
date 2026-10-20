---
title: "How a React SPA is served: static files and routing fallback"
stack: web-fundamentals
order: 23
level: Intermediate
mustKnow: false
askedFrequency: common
summary:
  - After npm run build, a React SPA is just files — index.html plus JS, CSS and images. Any static host can serve them.
  - The browser always starts from index.html. React Router then reads the URL and shows the right screen.
  - Refreshing /jobs/42 asks the server for a file called /jobs/42. It doesn't exist, so you get a 404 — unless you add a fallback to index.html.
  - "Fixes: an index.html fallback rule on the host (CloudFront error page, _redirects, nginx try_files), or HashRouter URLs like /#/jobs/42."
  - Set the base path when the app lives in a sub-folder, like /interview-prep-hub/.
cards:
  - q: What does a built React SPA contain?
    a: Static files only — index.html, JavaScript bundles, CSS and assets. No server code is needed to serve them.
  - q: Why does refreshing /jobs/42 give a 404 on a plain static host?
    a: The server looks for a real file at /jobs/42. There isn't one, because the route only exists inside React Router in the browser.
  - q: How do you fix the refresh 404?
    a: Tell the host to send index.html for unknown paths (SPA fallback), so React Router can handle the URL. Or use HashRouter.
  - q: How does HashRouter avoid the problem?
    a: Everything after # never reaches the server. The server always gets / and returns index.html, and React reads the part after #.
  - q: What is a base path?
    a: The folder the app is served from, like /interview-prep-hub/. The build must know it so script and CSS links point to the right place.
---

## 💡 What is it?

When you run `npm run build`, React gives you a folder of plain files: `index.html`, some JavaScript, some CSS and images.

That's a [SPA](glossary:spa): one HTML page that JavaScript keeps redrawing. To serve it, you only need something that sends files. No Node server is required.

There is one catch. When users refresh a deep link like `/jobs/42`, the server must send back `index.html`, not a 404.

## 🏠 Real-life example

Think of a **school with one reception desk**.

- The **reception desk** = `index.html`. Every visitor must start here.
- The **receptionist with the map** = React Router. They read your slip ("Room 42, please") and take you there.
- A **visitor who walks straight to "Room 42" from the main gate** = refreshing `/jobs/42`. The gate guard (the server) looks for a building called "Room 42". There is none, so they say "not found" (404).
- The **rule "send everyone to reception first"** = the SPA fallback. The guard sends every unknown request to the reception desk, and the receptionist does the rest.

## 🧑‍💻 Code example

A tiny static file server, run once **without** the fallback and once **with** it. Save it as `server.mjs`. Make a `dist/` folder with an `index.html` and `dist/assets/app.js` inside.

```js
import http from 'node:http'; // Node's built-in web server
import { readFile } from 'node:fs/promises'; // to read files from disk
import path from 'node:path'; // to build safe file paths
const DIST = path.resolve('dist'); // the folder made by "npm run build"
const fallback = process.argv[2] === 'fallback'; // turn the SPA fallback on with an argument
http.createServer(async (req, res) => { // runs for every request
  const file = path.join(DIST, req.url === '/' ? 'index.html' : req.url); // map the URL to a file
  try { // try to send the real file
    res.end(await readFile(file)); // found → 200 with the file
  } catch { // no such file (like /jobs/42)
    if (fallback) { res.end(await readFile(path.join(DIST, 'index.html'))); return; } // fallback: send index.html, React Router shows the page
    res.statusCode = 404; res.end('404 Not Found'); // no fallback → 404
  } // end of try/catch
}).listen(Number(process.argv[3]), () => console.log('listening')); // start on the given port
```

Run both, then test with curl:

```bash
node server.mjs plain 4701      # no fallback, on port 4701
node server.mjs fallback 4702   # with fallback, on port 4702
curl -s -o /dev/null -w '%{http_code}' localhost:4701/jobs/42   # ask for a deep link
```

Real output for three URLs on each server:

```text
port 4701 /               -> 200
port 4701 /assets/app.js  -> 200
port 4701 /jobs/42        -> 404
port 4702 /               -> 200
port 4702 /assets/app.js  -> 200
port 4702 /jobs/42        -> 200
```

Real files work on both. Only the server **with the fallback** answers `/jobs/42` with 200. It returns `index.html`, and React Router then shows job 42.

## 🔍 Deeper version

**What happens step by step:**
1. The browser asks for `/jobs/42`.
2. With a fallback, the server sends `index.html` with status 200.
3. `index.html` loads `/assets/index-CnceAJRU.js`.
4. React starts. [React Router](topic:react/react-router) reads `window.location.pathname` (`/jobs/42`) and shows the job page.
5. Clicking links later doesn't ask the server at all. The router changes the URL with the History API and redraws.

**Setting up the fallback on common hosts:**

| Host | How |
|---|---|
| S3 + CloudFront | Custom error responses: 403 and 404 → `/index.html` with status 200 (S3 returns 403 for missing keys when the bucket is private) |
| Netlify / Cloudflare Pages | A `_redirects` file: `/* /index.html 200` (Cloudflare Pages also serves `index.html` for unknown paths by default for SPAs) |
| nginx | `try_files $uri /index.html;` |
| Express | `app.use(express.static('dist'))` then a catch-all route that sends `dist/index.html` |
| GitHub Pages | No fallback setting. People use HashRouter or a copied `404.html` trick |

**HashRouter: a real example.** This very site uses **HashRouter** on GitHub Pages. Its URLs look like `/#/topic/nodejs/event-loop`. The browser never sends the part after `#` to the server. So the server only ever sees `/` and always returns `index.html`. A refresh can never 404. The downsides: URLs look less clean, and search engines treat everything as one page.

**Base path.** If the app lives at `https://hxri72.github.io/interview-prep-hub/`, the build must know that. Otherwise `<script src="/assets/app.js">` points to the wrong folder and fails. In Vite you set `base: '/interview-prep-hub/'`. In webpack it's `output.publicPath`. In React Router you set `basename`.

**Watch out:** a fallback should not hide real missing files. If `/assets/old-file.js` is missing, sending `index.html` instead gives a confusing error ("Unexpected token <"). Good servers only fall back for page-like URLs, not for `/assets/...`.

**SPA vs server rendering.** A Next.js or other SSR app is different. A server runs code for each page and returns finished HTML. So it needs a running server (Node, Lambda or Vercel), not just a file host. See [What is Next.js](topic:nextjs/what-is-nextjs).

## 🎯 Why do we use it?

- **Cheap and simple hosting.** Static files can live on S3, a CDN, GitHub Pages or Netlify. There's no server to manage.
- **Fast.** A CDN can cache the files close to every user.
- **Knowing the fallback rule** fixes the most common "works when clicking, 404 on refresh" bug.

## ⚠️ Common mistakes

- **No fallback on the host.** Navigation works, but refresh or a shared link gives 404.
- **Wrong base path.** The page is blank, and the console shows 404s for the JS files.
- **Falling back for asset URLs too.** A missing JS file returns HTML, so you get "Unexpected token '<'".
- **Caching `index.html` for a long time.** Users keep loading old JS file names after a deploy. See [Browser caching](topic:web-fundamentals/browser-caching).

## 🗣️ How to answer in an interview

> "After npm run build, a React SPA is just static files: index.html plus hashed JS and CSS bundles. Any static host or CDN can serve them. Routing happens in the browser. React Router reads the URL and renders the right screen.
>
> The classic problem is refreshing a deep link like /jobs/42. The server looks for a real file there, finds nothing, and returns 404. The fix is an SPA fallback: unknown page routes return index.html with a 200, and React Router takes over. On S3 with CloudFront, that's a custom error response mapping 403 and 404 to index.html. With nginx it's try_files. Another option is HashRouter, where the route sits after the # and never reaches the server. I also make sure the base path is set if the app isn't at the domain root."

[FILL IN: how SkillKeepr's SPA routing is handled on CloudFront, if you know — only add what's true.]

## 🔁 Follow-up questions

### Why does S3 return 403 instead of 404 for a missing file?

When the bucket is private and CloudFront reads it with limited permissions, S3 won't say whether a file exists. So a missing key comes back as 403 Access Denied. That's why the CloudFront rule maps both 403 and 404 to `index.html`.

### BrowserRouter or HashRouter?

BrowserRouter gives clean URLs and works when you can add a fallback rule. HashRouter works on any static host with no setup, but URLs contain `#`. Pick HashRouter only when you can't configure the host.

### Does an SPA need a Node server in production?

No. Only the API needs a server. The frontend files can be served by any static host or CDN.

### What is the "Unexpected token '<'" error after a deploy?

The browser asked for a JS file but got HTML, usually `index.html` from a fallback, because the JS file name was wrong or old. Check the base path and caching.

## ✅ Quick check

### 1. A plain static server has `index.html` and `assets/app.js`. What does it return for `/jobs/42`?

:::answer
**404.** There is no file at that path. Only a server with an SPA fallback would return `index.html` with 200.
:::

### 2. With HashRouter, the URL is `https://site.com/#/jobs/42`. What path does the server receive?

- A) `/jobs/42`
- B) `/`
- C) `/#/jobs/42`

:::answer
**B) `/`.** The browser never sends the part after `#` to the server.
:::

### 3. Your app is deployed at `/my-app/`, but the page is blank and `/assets/app.js` returns 404. What's the likely cause?

:::answer
The **base path** isn't set. The HTML asks for `/assets/app.js` instead of `/my-app/assets/app.js`. Set `base` (Vite) or `publicPath` (webpack) to `/my-app/`.
:::
