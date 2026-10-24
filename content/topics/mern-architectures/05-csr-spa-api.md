---
title: CSR SPA (React + Vite) with an Express API
stack: mern-architectures
order: 5
level: Basic
mustKnow: true
askedFrequency: very common
template: pattern
section: Frontend and rendering
summary:
  - "The classic MERN setup - the browser downloads one HTML page and a JavaScript bundle, and React builds every screen in the browser (client-side rendering)."
  - React Router changes screens without reloading the page; data comes from the Express API as JSON.
  - It's simple, cheap to host (static files on a CDN) and feels fast after the first load.
  - Weak points are a slower first load (blank page until JS runs) and weaker SEO for public pages.
  - Best for dashboards, admin panels and apps behind a login, where SEO doesn't matter.
cards:
  - q: What is a CSR SPA?
    a: A single-page app where the browser downloads one HTML shell plus JavaScript, and React builds and changes all screens in the browser.
  - q: How does a SPA change pages without reloading?
    a: A client-side router (React Router) changes the URL with the History API and swaps the components on screen.
  - q: What is the main SEO and performance downside of CSR?
    a: The first HTML is almost empty, so users see a blank page until JS loads, and crawlers may see less content.
  - q: What does Vite's dev proxy do?
    a: It forwards calls like /api/* from the Vite dev server to the Express server, so in development the browser sees one origin and there's no CORS.
---

## 💡 What is it?

This is the **classic MERN setup**. React is built with Vite into static files: one `index.html`, plus JavaScript and CSS.

The browser downloads these files once. Then React builds every screen inside the browser. This is called [client-side rendering (CSR)](glossary:csr).

When React needs data, it calls the Express API and gets JSON back. The app is a [single-page application (SPA)](glossary:spa), because the browser never loads a new HTML page.

## 🏠 Real-life example

Think of **a flat-pack furniture shop** like IKEA.

- **The box you carry home** = the JavaScript bundle. It's downloaded once.
- **Building the furniture at home** = React rendering the screens in your browser.
- **Calling the shop for a missing screw** = an API call to Express. You only ask for a small part (JSON), not a whole new table.
- **Waiting while you build** = the blank screen before JS runs. The first time takes a while; after that, rearranging furniture is quick.

## 🗺️ The diagram

```text
 FIRST VISIT
 Browser ── GET / ──────────────▶ Static host / CDN
         ◀── index.html (almost empty: <div id="root"></div>)
         ── GET /assets/index-a1b2.js ──▶
         ◀── React app bundle
         React starts, renders the screen in the browser

 AFTER THAT (no full page loads)
 click "Jobs" → React Router changes URL to /jobs → JobsPage component shows
 JobsPage ── fetch GET /api/jobs ──▶ Express API ──▶ MongoDB
          ◀── 200 [ {...}, {...} ] (JSON)  ◀────────
 React re-renders the list
```

## 🧑‍💻 Code example

Create the React app with `npm create vite@latest web -- --template react`, then `cd web && npm install react-router`. Run it with `npm run dev`. The Express API from [the 3-tier page](topic:mern-architectures/three-tier) runs on port 4000.

Save this as `web/vite.config.js`. It forwards `/api` calls to Express during development.

```js
import { defineConfig } from 'vite';                                 // Vite's config helper
import react from '@vitejs/plugin-react';                            // JSX + fast refresh support

export default defineConfig({                                        // the config object
  plugins: [react()],                                                // turn on React support
  server: {                                                          // settings for `npm run dev`
    proxy: { '/api': 'http://localhost:4000' },                      // /api/* → the Express server on 4000
  },                                                                 // end of server
});                                                                  // end of config
```

Save this as `web/src/main.jsx`.

```jsx
import { createRoot } from 'react-dom/client';                       // mounts React into the page
import { BrowserRouter, Routes, Route, Link } from 'react-router';    // client-side routing
import { useEffect, useState } from 'react';                         // hooks

function Jobs() {                                                    // the /jobs screen
  const [jobs, setJobs] = useState(null);                            // null = not loaded yet
  useEffect(() => {                                                  // runs after the first render
    fetch('/api/jobs').then((r) => r.json()).then(setJobs);          // same origin thanks to the proxy
  }, []);                                                            // [] = run only once
  if (!jobs) return <p>Loading...</p>;                               // loading state
  return <ul>{jobs.map((j) => <li key={j._id}>{j.title}</li>)}</ul>;  // one item per job
}                                                                    // end of Jobs

function App() {                                                     // the app shell
  return (                                                           // what to show
    <BrowserRouter>                                                  {/* watches the URL */}
      <nav><Link to="/">Home</Link> | <Link to="/jobs">Jobs</Link></nav> {/* Link = change URL, no reload */}
      <Routes>                                                       {/* pick one screen by URL */}
        <Route path="/" element={<h1>Welcome</h1>} />                {/* the home screen */}
        <Route path="/jobs" element={<Jobs />} />                    {/* the jobs screen */}
      </Routes>                                                      {/* end of Routes */}
    </BrowserRouter>                                                 // end of the router
  );                                                                 // end of return
}                                                                    // end of App

createRoot(document.getElementById('root')).render(<App />);         // put the app into <div id="root">
```

Click "Jobs". Open DevTools → Network. You'll see only one `fetch` for `/api/jobs`, not a new HTML page.

:::version[Version note]
From **React Router v7**, you import from `react-router` (the old `react-router-dom` package still works and re-exports it). SkillKeepr's apps use React Router v5, which has a different API (`Switch` instead of `Routes`).
:::

## 🔍 Deeper version

**What the build makes.** `npm run build` creates a `dist/` folder:
- `index.html`: a tiny shell with `<div id="root">` and script tags.
- `assets/index-<hash>.js` and `.css`: the bundled, minified code. The hash changes when the content changes, so browsers can cache these files for a long time.

See [what a bundler is](topic:web-fundamentals/what-is-bundler) and [Vite](topic:web-fundamentals/vite).

**Hosting.** The `dist/` folder is just files, so any static host works: S3 + CloudFront, Netlify, Vercel, or Express itself. The host must send `index.html` for unknown paths, or a refresh on `/jobs` gives a 404. See [how SPAs are served](topic:web-fundamentals/spa-serving).

**Performance tricks for CSR:**
- **Code splitting:** `React.lazy(() => import('./Reports'))` loads big screens only when needed.
- **Caching:** hashed assets get `Cache-Control: max-age=31536000, immutable` (one year). `index.html` gets `no-cache` so users get new versions.
- **Data caching:** React Query or RTK Query avoid fetching the same data again on each screen.

**SEO and first paint.** The first HTML has no content. Google can run JS, but slowly, and social media previews (like WhatsApp or LinkedIn cards) usually don't. That's why public, content-heavy sites move to [SSR with Next.js](topic:mern-architectures/ssr-nextjs) or a [static site](topic:mern-architectures/jamstack).

**CSR vs other rendering types:**

| | CSR (SPA) | SSR | SSG (static) |
|---|---|---|---|
| Who builds the HTML | Browser, every visit | Server, per request | Build step, once |
| First load | Slower (blank until JS) | Fast content | Fastest |
| SEO | Weak | Strong | Strong |
| Hosting | Static files only | Needs a Node server | Static files only |

## ⚖️ Pros and cons

| Pros | Cons |
|---|---|
| Simple mental model: React UI + JSON API | Blank screen until the JS bundle loads |
| Very cheap hosting: static files on a CDN | Weak SEO and link previews for public pages |
| Fast, app-like screen changes after the first load | Big bundles hurt slow phones and networks |
| Clean split: the API can also serve mobile apps | Data waterfalls (load JS → then fetch data) add delay |

## 🎯 When to choose it

- **Dashboards and admin panels** behind a login, where SEO doesn't matter.
- **Internal tools** and B2B SaaS apps. SkillKeepr's admin, talent and cloud-admin portals are React SPAs served from S3 and CloudFront.
- **Apps with lots of interaction**, like editors, chat, or drag-and-drop boards.
- **Not the best fit** for a blog, an e-commerce catalogue or a marketing site that needs Google traffic.

## ⚠️ Common mistakes

- **No SPA fallback on the host.** Refreshing `/jobs` returns 404. Configure the host to serve `index.html` for unknown paths.
- **One giant bundle.** Every page's code loads on the home page. Use lazy loading for big screens.
- **Caching `index.html` for a long time.** Users keep loading old JS file names after a deploy. Cache hashed assets long, but not `index.html`.
- **Putting secrets in `VITE_` variables.** They are baked into the public JS bundle. Only put public values there.

## 🗣️ How to answer in an interview

> "The classic MERN setup is a client-side rendered SPA. Vite builds React into an `index.html` shell and hashed JS and CSS files. The browser downloads them once, React renders everything in the browser, and React Router changes screens without page reloads. Data comes from the Express API as JSON.
>
> It's cheap and simple to host, because the build is just static files on a CDN, and it feels fast after the first load. The downsides are the initial blank page and weak SEO, so I'd use it for dashboards and apps behind a login, and pick SSR or static generation for public content pages.
>
> At SkillKeepr our portals are React SPAs on S3 and CloudFront, built with Webpack and using React Router, talking to a serverless API. To keep them fast, you lazy-load heavy screens and cache the hashed assets."

## 🔁 Follow-up questions

### Why does a SPA show a blank page if JavaScript fails?

The HTML only has an empty `<div id="root">`. All content is made by JS. If the bundle fails to load or crashes, there is nothing to show. Error boundaries and monitoring help catch this.

### How do you make a CSR app load faster?

Lazy-load routes, remove unused libraries, compress and cache assets on a CDN, preload key data, and show a skeleton loader. Measure with Lighthouse.

### What's the difference between Vite's proxy and CORS?

The proxy is only for development: Vite forwards `/api` to Express, so the browser sees one origin. In production, you either serve both from one domain or enable CORS on the API.

### Can a SPA have good SEO?

Partly. You can pre-render key public pages at build time, or use SSR for those pages. For pages behind a login, SEO doesn't matter.

## ✅ Quick check

### 1. A user clicks a `<Link to="/jobs">`. Does the browser request a new HTML page?

:::answer
**No.** React Router updates the URL and swaps the component. Only the data `fetch` for `/api/jobs` goes to the server.
:::

### 2. Which file should NOT be cached for a year: `index.html` or `assets/index-a1b2.js`?

:::answer
**`index.html`.** It points to the latest hashed files. The hashed JS file can be cached for a year, because a new version gets a new name.
:::

### 3. Is CSR a good choice for a public blog that needs Google traffic?

:::answer
**Not the best.** SSR or static generation gives crawlers full HTML on the first request.
:::
