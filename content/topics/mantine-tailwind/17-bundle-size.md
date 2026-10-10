---
title: Bundle size and tree shaking for UI libraries
stack: mantine-tailwind
order: 17
level: Advanced
mustKnow: false
askedFrequency: sometimes
summary:
  - "The bundle is the JavaScript file(s) the browser downloads. Bigger bundles mean slower first loads, especially on phones."
  - "Tree shaking lets the bundler drop code you never import. Named ES module imports make this work."
  - "UI libraries are big, so import only what you use. Icon packs are the usual surprise."
  - "Load heavy, rarely used parts later with React.lazy (code splitting)."
  - "Measure first with a bundle visualiser, change one thing, then measure again."
cards:
  - q: What is tree shaking?
    a: The bundler removes exports that nothing imports, so unused library code never reaches the browser.
  - q: Why does `import * as Icons from '@tabler/icons-react'` hurt?
    a: "It can pull in thousands of icons. Import only the icons you use by name, like import { IconTrash } from '@tabler/icons-react'."
  - q: How do you see what's inside your bundle?
    a: Use a visualiser, such as rollup-plugin-visualizer for Vite, which draws a treemap of every package by size.
  - q: How does code splitting help?
    a: React.lazy loads a page or heavy component only when it's needed, so the first download is smaller.
  - q: Does Tailwind add much to the bundle?
    a: No. It only generates CSS for classes you actually use, and adds no JavaScript at runtime.
---

## 💡 What is it?

When you build a React app, a tool called a **bundler** (like Vite) packs your code and your libraries into a few files. These files are the **bundle**. The browser must download them before the app can start.

UI libraries like Mantine and antd have hundreds of components, so they can make the bundle **big**. A big bundle means a **slow first load**, especially on phones.

**[Tree shaking](glossary:tree-shaking)** is how the bundler removes the parts of a library you never use.

## 🏠 Real-life example

Think of **packing your school bag**.

Your shelf has every textbook for every subject. If you take the whole shelf, the bag is too heavy. So you take **only today's books**.

- **The whole shelf** = the full UI library.
- **Today's books** = the components you import.
- **Leaving the other books at home** = tree shaking.
- **Bringing the art kit only on Friday** = code splitting (`React.lazy`), loading heavy parts only when needed.
- **Weighing the bag** = a bundle visualiser that shows what's inside.

## 🧑‍💻 Code example

Setup: a Vite React app with `@mantine/core` and `@tabler/icons-react` installed. Run `npm install -D rollup-plugin-visualizer`. Update `vite.config.js`, then run `npm run build`.

```js
// vite.config.js
import { defineConfig } from 'vite';                                 // Vite's config helper
import react from '@vitejs/plugin-react';                            // React support
import { visualizer } from 'rollup-plugin-visualizer';               // draws a treemap of the bundle

export default defineConfig({                                        // the config object
  plugins: [                                                         // list of plugins
    react(),                                                         // handle JSX
    visualizer({ filename: 'stats.html', gzipSize: true }),          // write stats.html; also show gzip (compressed) sizes
  ],                                                                 // end of plugins
});                                                                  // end of config
```

```jsx
// src/App.jsx
import { lazy, Suspense } from 'react';                              // lazy = load a component later; Suspense = show a fallback meanwhile
import { Button } from '@mantine/core';                              // one named component (tree-shaken in production)
import { IconTrash } from '@tabler/icons-react';                      // ONE named icon (not the whole icon pack)

const ReportsPage = lazy(() => import('./ReportsPage'));             // heavy page (charts, big tables) loaded only when shown

export default function App({ showReports }) {                       // showReports = true when the user opens reports
  return (                                                           // what the page shows
    <div>                                                            {/* wrapper */}
      <Button leftSection={<IconTrash size={16} />}>Delete</Button>  {/* uses only Button and one icon; size 16 = 16px */}
      {showReports && (                                              // only when reports are needed…
        <Suspense fallback={<p>Loading reports…</p>}>                {/* …show this text while the chunk downloads */}
          <ReportsPage />                                            {/* the lazily loaded page */}
        </Suspense>                                                  // end of Suspense
      )}                                                             {/* end of the condition */}
    </div>                                                           // end of wrapper
  );                                                                 // end of what App returns
}                                                                    // end of App
```

**What you see after `npm run build`:**

```text
Vite prints each output file with its size and gzip size.
ReportsPage gets its own small file (a separate "chunk"), not part of the main one.
Opening stats.html shows a treemap: big boxes = big packages.
If you had written `import * as Icons from '@tabler/icons-react'` and used it dynamically, a huge icons box would appear.
```

## 🔍 Deeper version

**How tree shaking works.** ES modules use static `import` and `export`. The bundler can see, at build time, which exports are used. Unused exports are dropped. This needs:
- **ES module** builds of the library (Mantine, antd v5+ and most modern libraries ship them).
- **Side-effect-free code.** Libraries mark this with `"sideEffects": false` in `package.json`.
- **Named imports.** `import { Button } from '@mantine/core'` tree-shakes well in production with modern bundlers. Mantine marks only its `.css` files as having side effects (`"sideEffects": ["*.css"]`).

**The usual size traps:**

| Trap | Better |
|---|---|
| `import * as Icons from '@tabler/icons-react'` | `import { IconTrash } from '@tabler/icons-react'` |
| Whole utility libraries (`import _ from 'lodash'`) | `lodash-es` with named imports, or plain JS |
| Big date or chart libraries on the first screen | lazy-load the screen that uses them |
| Two UI libraries in one app (Mantine + antd) | pick one |
| Moment.js with all locales | a smaller library like date-fns or dayjs |

**Code splitting.** `React.lazy(() => import('./Page'))` tells the bundler to create a separate **chunk** (a smaller file) for that page. Route-level splitting is the easiest win: each page loads only when visited.

**CSS.** Tailwind generates only the classes it finds in your files, so its CSS stays small. Mantine 7+ ships plain CSS. `@mantine/core/styles.css` holds every component's styles, but you can import only the files you need, like `@mantine/core/styles/Button.css` (plus the base files the docs list). antd creates styles at runtime with CSS-in-JS. That costs some JavaScript and work in the browser, but only for components you render.

**Measure.** Use:
- the size list Vite prints after `npm run build`,
- a visualiser (treemap),
- Lighthouse in Chrome DevTools, for real load metrics like LCP (when the main content appears).

Change one thing at a time and measure again. Gzip or Brotli sizes are what users really download.

## 🎯 Why do we use it?

- **Faster first load**, especially on slow mobile networks.
- **Better Core Web Vitals and SEO** for public pages.
- **Less JavaScript to run.** Big bundles also cost CPU time to parse, not just download time.
- **Cheaper for users** on mobile data.

## ⚠️ Common mistakes

- **Importing the whole icon pack** with `import *`.
- **Guessing instead of measuring.** Optimising a package that's already small.
- **Lazy-loading tiny components.** Each extra chunk is another network request. Split at page or heavy-widget level.
- **Shipping two UI libraries** because one page "needed" a component from the other.

## 🗣️ How to answer in an interview

> "UI libraries are large, so I treat bundle size as something to measure. First I run a visualiser after a production build to see which packages are biggest.
>
> Tree shaking removes unused exports, but only if the library ships ES modules and I import named pieces. The common trap is icons: importing the whole icon pack instead of single icons can add a lot.
>
> Then I code-split: routes and heavy widgets like charts or rich editors are loaded with React.lazy and Suspense, so the first screen only downloads what it needs. I make one change at a time and check the gzip sizes and Lighthouse again."

[FILL IN: if you reduced a bundle or sped up a page load, add the real before/after here — only if true.]

## 🔁 Follow-up questions

### Can you load only some of Mantine's CSS?

Yes. Instead of `@mantine/core/styles.css`, import the base styles and then one CSS file per component you use, from `@mantine/core/styles/`. It saves CSS, but you must remember to add a file whenever you start using a new component.

### What's a barrel file?

An `index.js` that re-exports many modules (`export * from './Button'`). Barrels are convenient, but can slow builds and confuse tree shaking if modules have side effects.

### How small should a bundle be?

There's no fixed number. A common goal is keeping the first-load JavaScript small enough for a fast LCP on a mid-range phone. Measure with Lighthouse on a throttled mobile profile.

### Does code splitting help the first page?

Indirectly. The first page downloads less, because other pages' code is in separate chunks. You can also prefetch the next likely page when the browser is idle.

## ✅ Quick check

### 1. Which import is smaller?

- A) `import * as Icons from '@tabler/icons-react'; const Icon = Icons[name];` (icon picked by a variable)
- B) `import { IconTrash } from '@tabler/icons-react'; <IconTrash />`

:::answer
**B.** It brings in one icon. In A the bundler can't know which icon you need, so it keeps the whole icon library.
:::

### 2. What does `React.lazy(() => import('./ReportsPage'))` change in the build?

:::answer
The bundler puts `ReportsPage` in a **separate chunk**. It downloads only when the component is first rendered.
:::

### 3. Why doesn't Tailwind make your JavaScript bundle bigger?

:::answer
Tailwind is **CSS only**. It runs at build time and generates CSS for the classes you use. It adds no JavaScript to the browser.
:::
