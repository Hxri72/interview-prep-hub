---
title: Static site + API (Jamstack)
stack: mern-architectures
order: 8
level: Intermediate
mustKnow: false
askedFrequency: sometimes
template: pattern
section: Frontend and rendering
summary:
  - "Jamstack = JavaScript + APIs + Markup. You build the pages into plain HTML files ahead of time and put them on a CDN."
  - Dynamic parts (login, cart, forms) call an API from the browser, often an Express API or serverless functions.
  - Pages load very fast and hosting is cheap, because a CDN just serves files.
  - It fits content that changes rarely (marketing sites, docs, blogs). Data that changes every second needs rebuilds or client-side fetching.
cards:
  - q: What does Jamstack stand for?
    a: JavaScript, APIs and Markup. Pages are pre-built HTML on a CDN; dynamic parts call APIs with JavaScript.
  - q: Where are Jamstack pages hosted?
    a: On a CDN or static host (S3 + CloudFront, Netlify, Vercel, Cloudflare Pages). There is no app server for the pages.
  - q: How does a Jamstack site do dynamic things like login?
    a: JavaScript in the browser calls an API, such as an Express API or serverless functions.
  - q: What is the main downside?
    a: Content is fixed at build time. When data changes, you must rebuild, or fetch that part in the browser.
---

## 💡 What is it?

**Jamstack** means **J**avaScript + **A**PIs + **M**arkup (HTML).

You build all your pages into plain HTML files **before** anyone visits. You put them on a [CDN](glossary:cdn). The dynamic parts, like login or a contact form, call an [API](glossary:api) from the browser.

There's no server building pages. The CDN just hands out files.

## 🏠 Real-life example

Think of a **school notice board** and the **school office**.

- **The printed notices** = pre-built HTML pages. They're printed once and pinned up. Anyone can read them quickly.
- **Many copies of the notice in every building** = the CDN. Students read the nearest copy.
- **The office window** = the API. If you need something personal (your marks, a form), you go to the window.
- **Printing a new notice when something changes** = a rebuild.

## 🗺️ The diagram

```text
BUILD TIME (once, or on every content change)
  Content (Markdown / CMS / MongoDB) ──▶ Build tool (Vite, Astro, Next.js export) ──▶ HTML/CSS/JS files
                                                                                          │ upload
                                                                                          ▼
REQUEST TIME                                                                      CDN (S3 + CloudFront)
  Browser ──GET /about──▶ CDN ──▶ ready HTML file (very fast)
  Browser ──POST /api/contact──▶ Express API or serverless function ──▶ MongoDB
```

## 🧑‍💻 Code example

A tiny build script turns data into HTML files. A static page then calls an API for the dynamic part.

Save as `build.js`. Run `node build.js`. It creates `dist/index.html`.

```js
const fs = require('node:fs');                                  // Node's file-system module
const jobs = [{ title: 'React Developer' }, { title: 'Node Developer' }]; // content (could come from a CMS or MongoDB)

const items = jobs.map((j) => `<li>${j.title}</li>`).join('');  // turn each job into an <li>
const html = `<!doctype html>  <!-- a normal HTML page -->
<h1>Open jobs</h1>              <!-- page heading -->
<ul>${items}</ul>              <!-- the job list, filled in now at build time -->
<form id="f"><input name="email"><button>Get alerts</button></form> <!-- the dynamic part -->
<script src="app.js"></script>`;                                  // the full page, built ONCE (not per visitor)

fs.mkdirSync('dist', { recursive: true });                      // make the output folder
fs.writeFileSync('dist/index.html', html);                      // write the static HTML file
console.log('Built dist/index.html');                           // tell us it worked
```

Save as `dist/app.js`. This is the "J + A" part: browser JavaScript calling an API.

```js
document.getElementById('f').addEventListener('submit', async (e) => { // when the form is sent
  e.preventDefault();                                           // stop the page from reloading
  const email = new FormData(e.target).get('email');            // read the email field
  await fetch('https://api.example.com/alerts', {               // call the API (Express or a serverless function)
    method: 'POST',                                             // POST = create something
    headers: { 'Content-Type': 'application/json' },            // we send JSON
    body: JSON.stringify({ email }),                            // the data
  });                                                           // end of fetch
  alert('Subscribed!');                                         // tell the user
});                                                             // end of the listener
```

Serve the folder with `npx serve dist` and open the URL it prints.

## 🔍 Deeper version

**Static site generators (SSGs)** do the build step for you. Examples: Astro, Eleventy, Hugo, and Next.js with `output: 'export'`.

**Where content comes from:**
- Markdown files in the repo (like this prep site).
- A headless CMS: a content tool with an API but no website of its own. Editors write there; the build pulls the content.
- A database, read at build time.

**Rebuild triggers.** When content changes, a webhook from the CMS starts a CI build. The new files go to the CDN. Then the CDN cache is cleared (called "invalidation"). See [CDN](topic:system-design/cdn) and [hosting frontend on AWS](topic:web-fundamentals/hosting-frontend-aws).

**Jamstack vs SPA.** A [CSR SPA](topic:mern-architectures/csr-spa-api) is also static files on a CDN. The difference: an SPA ships an almost empty HTML and builds everything in the browser. Jamstack ships **finished HTML** for each page.

**Jamstack vs SSR.** SSR builds HTML on every request. Jamstack builds it once. Next.js ISR sits in between: static, but refreshed every N seconds.

## ⚖️ Pros and cons

| Pros | Cons |
|---|---|
| Very fast first load (CDN, ready HTML) | Content is fixed until the next build |
| Cheap hosting: just files | Big sites can take long to rebuild |
| Very secure: no page server to attack | Per-user pages still need an API and JS |
| Easy to scale: CDNs handle traffic spikes | Preview of drafts needs extra setup |

## 🎯 When to choose it

- **Marketing site, landing pages, docs, blogs.** Content changes a few times a week.
- **A portfolio or a study site** like this prep hub (Markdown → HTML at build time).
- **A shop catalogue** with a few hundred products, plus an API for cart and checkout.
- **Not a good fit:** a live dashboard, a chat app, or data that changes every second.

## ⚠️ Common mistakes

- **Putting secret keys in the static JS.** Everything on a CDN is public. Secrets must stay in the API.
- **Forgetting to clear the CDN cache** after a deploy. Users keep seeing the old page.
- **Rebuilding thousands of pages for one change.** Use incremental builds or ISR for big sites.
- **Forgetting CORS.** The static site and the API are on different domains, so the API must allow the site's origin. See [CORS](topic:express/cors).

## 🗣️ How to answer in an interview

> "Jamstack means JavaScript, APIs and Markup. We pre-build the pages into static HTML and serve them from a CDN like CloudFront. Anything dynamic, like a form or login, calls an API from the browser. That API could be Express or serverless functions.
>
> The benefits are speed, low cost and security, because there's no page server. The trade-off is that content is fixed at build time, so changes need a rebuild. Usually a CMS webhook starts one.
>
> I'd use it for marketing sites, docs and blogs. For a logged-in app with live data, I'd use an SPA or SSR instead."

## 🔁 Follow-up questions

### Is a React SPA on S3 a Jamstack site?

Partly. It's static files on a CDN calling an API, so it shares the idea. But pure Jamstack usually means pre-rendered HTML for every page, which a plain SPA doesn't have.

### How do you update a Jamstack site when content changes?

The CMS sends a webhook to your CI. The CI runs the build, uploads the new files, and clears the CDN cache.

### Can a Jamstack site have logged-in users?

Yes. The page is static, but JavaScript calls an auth API and then fetches the user's data. The personal parts load after the page.

## ✅ Quick check

### 1. Which part of a Jamstack site runs on every request?

- A) The build tool
- B) The CDN serving files, and the API for dynamic parts
- C) A Node server that renders HTML

:::answer
**B.** HTML is built once. On each request, the CDN serves files, and the API runs only for dynamic actions.
:::

### 2. You changed a blog post in the CMS, but the site still shows the old text. What is missing?

:::answer
A **rebuild** (often started by a webhook) and/or a **CDN cache invalidation**.
:::
