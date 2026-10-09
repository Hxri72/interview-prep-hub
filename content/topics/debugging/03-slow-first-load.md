---
title: The page takes 6 seconds to load
template: scenario
stack: debugging
order: 3
level: Intermediate
mustKnow: true
askedFrequency: very common
summary:
  - "Detect: Lighthouse score + Network tab (throttled to \"Fast 4G\") to see what is slow."
  - "Debug: three usual causes — a huge JavaScript bundle, slow API calls, big images. A bundle analyzer shows what is inside the bundle."
  - "Fix by cause: code splitting with React.lazy + Suspense, remove or replace heavy libraries, compress and lazy-load images, cache API data, show a skeleton."
  - Measure again with Lighthouse after each change.
  - "Prevent: a bundle-size budget in CI and performance checks before release."
cards:
  - q: Which tools do you open first for a slow first load?
    a: Lighthouse for an overall score and tips, and the Network tab (with throttling) to see which files and API calls take the time.
  - q: What is code splitting?
    a: Breaking the JavaScript into smaller files, so the browser downloads only the code for the current page. In React you use React.lazy + Suspense per route.
  - q: How do you find what is making the bundle big?
    a: Run a bundle analyzer (for example rollup-plugin-visualizer in Vite or webpack-bundle-analyzer). It shows each library's size as boxes.
  - q: How do you make images load faster?
    a: Use modern formats (WebP/AVIF), the right size for the screen, compression, and loading="lazy" for images below the fold.
  - q: How do you make the page feel faster even when data is slow?
    a: Show a skeleton loader or the page layout immediately, then fill in data. Cache API results so repeat visits are instant.
---

## 💡 What is it?

The symptom: a user opens the app for the first time. They stare at a blank or half-empty screen for **about 6 seconds**.

Most users leave a page that takes more than 3 seconds. So this is a real business problem, not just a technical one.

## 🏠 Real-life example

Think of **packing for a school trip**.

You only need clothes for 2 days. But you carry your **whole cupboard** in a giant bag. You are slow at the bus stop, and everyone waits.

- **The giant bag** = a huge JavaScript bundle.
- **Clothes for 2 days** = only the code needed for the first page.
- **Packing a small bag per day** = code splitting (one small file per page).
- **Heavy photo albums in the bag** = big, uncompressed images.
- **Waiting for a friend who is late** = a slow API call.

## 🔎 Detect

1. Open the page in an **Incognito** window (no cache, no extensions).
2. Run **Lighthouse** (Chrome DevTools → Lighthouse → Analyze). Note the score and timings like **LCP** (Largest Contentful Paint — when the main content appears).
3. Open the **Network** tab. Set throttling to **"Fast 4G"** to feel what mobile users feel. Tick **"Disable cache"**. Reload.
4. Sort by **Size** and **Time**. Write down the biggest and slowest items.

## 🐞 Debug

Look for the three usual causes:

| What you see | Cause |
|---|---|
| One JS file is 2–5 MB | **Big bundle**: all pages and libraries in one file |
| The page shell loads, then waits on `/api/...` | **Slow API** — check the backend ([slow endpoint](topic:debugging/slow-endpoint)) |
| Images of 1–4 MB | **Big images**: not compressed, wrong size |
| Many requests one after another (a "waterfall") | Data is fetched in a chain instead of in parallel |

To see **what is inside the bundle**, run a bundle analyzer. In a Vite app:

```bash
npm install -D rollup-plugin-visualizer
```

It draws a map of the bundle. Big boxes are the suspects, like a whole chart library or a full icon set.

## 🔧 Fix

**Match the fix to the cause:**

- **Big bundle:** split code by route with `React.lazy` + `Suspense`. Remove unused libraries. Import only what you use.
- **Slow API:** fix the backend. Fetch in parallel with `Promise.all`. Cache results.
- **Big images:** compress them, use WebP/AVIF, serve the right size, add `loading="lazy"`.
- **Feels slow:** show a **skeleton** (grey placeholder boxes) right away.

**Before:** every page is imported at the top, so all of them load on the first visit.

```jsx
import { Routes, Route } from 'react-router';                 // routing components
import Dashboard from './pages/Dashboard';                     // loaded immediately
import Reports from './pages/Reports';                         // heavy charts — also loaded immediately
import Settings from './pages/Settings';                       // loaded immediately, even if never opened

export default function App() {                                // the root component
  return (                                                     // what to draw
    <Routes>                                                   {/* choose a page by URL */}
      <Route path="/" element={<Dashboard />} />               {/* home page */}
      <Route path="/reports" element={<Reports />} />          {/* reports page */}
      <Route path="/settings" element={<Settings />} />        {/* settings page */}
    </Routes>                                                  // end of the routes
  );                                                           // end of what to draw
}                                                              // end of App
```

**After:** each page becomes its own small file, downloaded only when the user opens it.

```jsx
import { lazy, Suspense } from 'react';                        // lazy = load a component later
import { Routes, Route } from 'react-router';                 // routing components

const Dashboard = lazy(() => import('./pages/Dashboard'));     // separate file, loaded on first visit to "/"
const Reports = lazy(() => import('./pages/Reports'));         // charts download only on /reports
const Settings = lazy(() => import('./pages/Settings'));       // downloads only if opened

export default function App() {                                // the root component
  return (                                                     // what to draw
    <Suspense fallback={<p>Loading…</p>}>                      {/* shown while a page file downloads */}
      <Routes>                                                 {/* choose a page by URL */}
        <Route path="/" element={<Dashboard />} />             {/* home page */}
        <Route path="/reports" element={<Reports />} />        {/* reports page */}
        <Route path="/settings" element={<Settings />} />      {/* settings page */}
      </Routes>                                                {/* end of the routes */}
    </Suspense>                                                // end of the loading boundary
  );                                                           // end of what to draw
}                                                              // end of App
```

**Images:**

```html
<img src="/team-800.webp" width="800" height="450" loading="lazy" alt="Our team"> <!-- WebP, right size, lazy, has alt text -->
```

## 🛡️ Prevent

- Run **Lighthouse after each fix**. Compare the numbers with your first measurement.
- Add a **bundle-size budget** in CI, so a pull request that adds 500 KB fails.
- Review new libraries before adding them. Ask: "Is there a smaller one?"
- Keep code splitting per route as a team rule.
- Monitor real users' load times (Core Web Vitals) after release.

## 🗣️ How to answer in an interview

> **Short version:** "I'd run Lighthouse and look at the Network tab with throttling, to see if the time goes to a big JavaScript bundle, a slow API or big images. Then I fix that cause: code splitting with React.lazy, removing heavy libraries, compressing and lazy-loading images, and caching API data. Then I measure again."
>
> **Full version:** "First I reproduce it in Incognito with the cache disabled and 'Fast 4G' throttling, and I run Lighthouse to get numbers like LCP. In the Network tab I sort by size and time. If one JavaScript file is several megabytes, I run a bundle analyzer to see which libraries are in it. Then I split code per route with React.lazy and Suspense, and I remove or replace heavy libraries. If the page is waiting on an API, I look at the backend and fetch data in parallel. If images are large, I compress them, use WebP and add lazy loading. I also show a skeleton so it feels faster. Finally I measure again and add a bundle-size check so it doesn't grow back."

[FILL IN: if you did load-time work on SkillKeepr's portals (for example code-split pages), add one real line here.]

## 🔁 Follow-up questions

### What is LCP?

Largest Contentful Paint. It's the time until the biggest visible thing (a heading, an image) appears. Google suggests under 2.5 seconds.

### What is tree shaking?

When the bundler removes code you exported but never used. Importing one function instead of a whole library helps it. See [tree shaking](glossary:tree-shaking).

### Does code splitting make other pages slower?

A little, the first time you open them, because their file downloads then. You can **prefetch** likely next pages in the background to hide this.

### How does caching help the first load?

The very first visit still downloads everything. But with long cache headers on hashed file names, every later visit loads from the browser cache almost instantly.

## ✅ Quick check

### 1. The Network tab shows `main.js` is 4 MB. What's the first fix to try?

:::answer
**Code splitting** with `React.lazy` + `Suspense`, and a bundle analyzer to find heavy libraries to remove or replace.
:::

### 2. What does `loading="lazy"` on an image do?

- A) Makes the image smaller
- B) Downloads the image only when it is near the visible part of the screen
- C) Converts it to WebP

:::answer
**B.** The browser waits until the user scrolls near it.
:::

### 3. The page shell appears fast, but the data takes 5 seconds. Is the bundle the problem?

:::answer
**Probably not.** The slow part is the API. Debug the backend endpoint and the database query.
:::
