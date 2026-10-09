---
title: "Code splitting: React.lazy and Suspense"
stack: react
order: 26
level: Intermediate
mustKnow: false
askedFrequency: common
summary:
  - Code splitting breaks one big JavaScript bundle into smaller files that load only when needed.
  - "React.lazy(() => import('./Page')) loads a component the first time it is shown."
  - Suspense shows a fallback (like a spinner) while that code is downloading.
  - The usual place to split is per route (page), so the first load only downloads the first page.
  - Split big, rarely used parts too, like charts, editors or PDF tools.
cards:
  - q: What is code splitting?
    a: Splitting the app's JavaScript into smaller chunks, so the browser downloads only what the current page needs, and loads the rest later.
  - q: How do React.lazy and Suspense work together?
    a: React.lazy takes a function that calls import(). The first render throws a promise while the chunk loads; Suspense catches it and shows its fallback until the code is ready.
  - q: Where is the best place to split?
    a: Per route, because users only see one page at a time. Also big, rarely used widgets like charts, rich editors or PDF generators.
  - q: What does a dynamic import() return?
    a: A promise that resolves to the module. Bundlers like Vite and Webpack turn each dynamic import into a separate file (chunk).
  - q: What must a React.lazy module export?
    a: "A default export that is a React component. For a named export, map it, like import('./x').then(m => ({ default: m.Named }))."
---

## 💡 What is it?

A React app is usually built into one or a few big JavaScript files called a **bundle**. On the first visit, the browser downloads and runs it all. Big bundles make the first load slow.

**Code splitting** cuts the bundle into smaller files called **chunks**. The browser downloads a chunk only when it's needed.

In React you do it with two tools:
- **`React.lazy`** — load a [component](glossary:component)'s code the first time it is shown.
- **`<Suspense>`** — show a fallback (like "Loading…") while the code downloads.

## 🏠 Real-life example

Think of **school textbooks**.

At the start of the year, you could carry all 12 textbooks in your bag every day. The bag is heavy, and you're slow every morning. Smart students carry only **today's books**. Other books stay in the locker until a class needs them.

- **All 12 books in the bag** = one huge bundle.
- **Only today's books** = the first page's chunk.
- **Fetching a book from the locker when that class starts** = `React.lazy` loading a page on demand.
- **"Wait one minute, I'm getting my book"** = the `Suspense` fallback.

## 🧑‍💻 Code example

Make a Vite React app. Create a second file, then replace `src/App.jsx`. Run `npm run build` and look at the `dist/assets` folder, then `npm run dev`.

**`src/Reports.jsx`** (a big page we don't want in the first load):

```jsx
export default function Reports() {                     // default export — React.lazy needs this
  return <h2>📊 Reports page (loaded on demand)</h2>;   // pretend this page is large
}                                                       // end of Reports
```

**`src/App.jsx`:**

```jsx
import { lazy, Suspense, useState } from 'react';                  // lazy + Suspense come from React

const Reports = lazy(() => import('./Reports.jsx'));               // dynamic import → a separate chunk file

export default function App() {                                    // our main component
  const [show, setShow] = useState(false);                         // false = Reports not needed yet
  return (                                                         // what to show
    <main>                                                         {/* page wrapper */}
      <h1>Dashboard</h1>                                           {/* part of the main bundle */}
      <button onClick={() => setShow(true)}>Open reports</button>  {/* first click starts the download */}
      {show && (                                                   // only render Reports after the click
        <Suspense fallback={<p>Loading reports…</p>}>              {/* shown while the chunk downloads */}
          <Reports />                                              {/* the lazy component */}
        </Suspense>                                                // end of Suspense
      )}                                                           {/* end of conditional */}
    </main>                                                        // end of wrapper
  );                                                               // end of return
}                                                                  // end of App
```

**What you see:**

```text
npm run build → dist/assets has the main index-xxxx.js AND a small Reports-xxxx.js chunk
Open the app with DevTools → Network tab:
  first load: only index-xxxx.js is downloaded
  click "Open reports": "Loading reports…" flashes, Reports-xxxx.js downloads, then the page appears
  click again later: no new download — the chunk is cached
```

## 🔍 Deeper version

**How it works.** `import('./Reports.jsx')` is a **dynamic import**. It returns a promise of the module. Bundlers (Vite, Webpack) see it and put that module into its own chunk file. `React.lazy` wraps the promise. On the first render, the lazy component "suspends": it throws the promise. The nearest `<Suspense>` above catches it and shows its `fallback`. When the promise resolves, React renders the real component.

**Split by route first.** Users see one page at a time, so per-page chunks give the biggest win:

```jsx
const Jobs = lazy(() => import('./pages/Jobs'));             // the Jobs page, in its own chunk
const Candidates = lazy(() => import('./pages/Candidates')); // the Candidates page, in its own chunk
// <Suspense fallback={<PageSkeleton />}> around <Routes> … </Suspense>
```

Then split **heavy, rarely used parts**: chart libraries, rich text editors, code editors, PDF/DOCX generators, maps.

**Rules for `React.lazy`:**
- The module needs a **default export** that is a component. For a named export: `lazy(() => import('./x').then((m) => ({ default: m.Chart })))`.
- Call `lazy()` at the **top level** of a module, not inside a component. Otherwise a new lazy component is created on every render, and its state resets.
- Every lazy component needs a `<Suspense>` somewhere above it. Without one, there is no fallback to show.

**Loading failures.** If a chunk fails to download (bad network, or an old chunk deleted after a new deploy), the lazy promise rejects. Wrap lazy parts in an [error boundary](topic:react/error-boundaries) with a "Reload" button.

**Preloading.** Start the import early to hide the wait, for example on hover: `onMouseEnter={() => import('./Reports.jsx')}`. The second import reuses the same request.

**Vendor chunks.** Bundlers also split big libraries (React, chart libraries) into separate chunks. Those change rarely, so the browser cache keeps them across deploys. Files get a content hash in their name (`index-a1b2c3.js`), so a new version gets a new name.

**Measure first.** Use the Lighthouse panel and a bundle analyzer (like `rollup-plugin-visualizer` for Vite) to find what is actually big. See [the page takes 6 seconds to load](topic:debugging/slow-first-load).

## 🎯 Why do we use it?

- **A faster first load.** Users download only the first page's code.
- **Less work on slow phones.** Less JavaScript to parse and run.
- **Better caching.** A change in one page only changes that page's chunk.
- **Pay only for what you use.** A user who never opens Reports never downloads it.

## ⚠️ Common mistakes

- **Calling `lazy()` inside a component.** It creates a new component on every render and resets state.
- **No `<Suspense>` around a lazy component.** There's no fallback, so you get an error or a blank screen while the code loads.
- **Splitting tiny components.** Each chunk is an extra network request. Split pages and heavy widgets, not buttons.
- **No error handling for failed chunk loads.** After a deploy, users with an old tab get a white screen. Add an error boundary.
- **One spinner for the whole app.** Use page-shaped skeletons, so the layout doesn't jump.

## 🗣️ How to answer in an interview

> "Code splitting breaks the JavaScript bundle into chunks, so the first load only downloads what the first page needs. In React I use React.lazy with a dynamic import, and wrap it in Suspense with a fallback like a skeleton. The bundler turns each dynamic import into a separate chunk file.
>
> I split by route first, because users see one page at a time. Then I split heavy, rarely used parts like charts, rich editors or PDF generators. I keep lazy calls at the module's top level and put an error boundary around lazy parts, because chunk downloads can fail, especially right after a deploy.
>
> To decide what to split, I measure first with Lighthouse and a bundle analyzer, then check the Network tab to confirm the chunk only loads when needed."

[FILL IN: if true — at SkillKeepr every page was lazy-loaded through a small loadable wrapper. Describe one heavy part you split or would split.]

## 🔁 Follow-up questions

### What happens if the chunk fails to load?

The lazy component's promise rejects, and the error goes to the nearest error boundary. Show a friendly message with a "Reload" button. Reloading fetches the new `index.html` with the new chunk names.

### What is the difference between code splitting and tree shaking?

[Tree shaking](glossary:tree-shaking) removes code you never import, so the bundle is smaller. Code splitting keeps the code but moves it into separate files that load later. You use both.

### Can you code-split without React.lazy?

Yes. Any dynamic `import()` creates a chunk. For example, load a big library only inside a click handler: `const { jsPDF } = await import('jspdf')`.

### How does Suspense relate to data fetching?

Suspense can also wait for data in frameworks and libraries that support it (for example TanStack Query's `useSuspenseQuery`, or React 19's `use()` with a promise). The fallback shows until the data is ready.

## ✅ Quick check

### 1. What is wrong here?

```jsx
function App() {                                       // a component
  const Reports = lazy(() => import('./Reports'));     // lazy() called inside the component
  return <Suspense fallback="…"><Reports /></Suspense>; // render it
}
```

:::answer
`lazy()` runs on **every render**, creating a brand-new component each time. React unmounts and remounts it, and its state resets. Move the `lazy()` call to the top level of the file.
:::

### 2. A lazy component is rendered with no `<Suspense>` anywhere above it. What happens?

:::answer
There is no Suspense boundary to show a fallback. Depending on the React version and how the update started, you get an error or nothing shows until the code loads. Always put a `<Suspense>` above lazy components.
:::

### 3. Where does code splitting usually give the biggest win?

- A) Every small button
- B) Each route or page
- C) CSS files only

:::answer
**B.** Users see one page at a time, so per-page chunks keep the first load small.
:::
