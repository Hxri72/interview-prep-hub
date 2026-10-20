---
title: Development build vs production build
stack: web-fundamentals
order: 22
level: Basic
mustKnow: false
askedFrequency: common
summary:
  - A development build is made for you, the developer. It is big, readable, and full of helpful warnings.
  - A production build is made for users. It is small, minified (squeezed), and fast to download.
  - "NODE_ENV=production tells tools and libraries like React to drop dev-only code, such as warnings and extra checks."
  - Production files get hashed names (like index-CnceAJRU.js), so browsers can cache them for a long time.
  - Always test the production build on your laptop (npm run build, then npm run preview) before you deploy.
cards:
  - q: What is the main difference between a development and a production build?
    a: Dev is big and readable, with warnings and source maps for debugging. Prod is minified, smaller and faster, with dev-only code removed.
  - q: What does NODE_ENV=production do?
    a: It tells build tools and libraries that this is a real release. Code inside "if not production" blocks is removed, so React's dev warnings and checks disappear.
  - q: Why do production files have names like index-CnceAJRU.js?
    a: The random-looking part is a hash of the file's content. If the code changes, the name changes, so browsers can safely cache files for a year.
  - q: Why test the production build locally?
    a: Some bugs only appear after minifying or removing dev code, such as wrong environment variables or broken paths. npm run build plus npm run preview shows them before users do.
  - q: Does StrictMode run twice in production?
    a: No. StrictMode's double-run checks only happen in development builds.
---

## 💡 What is it?

Your app can be built in two ways.

A **development build** is for you while you code. It is readable and has lots of warnings to help you find bugs.

A **production build** is for real users. It is small and fast. All the helper code for developers is removed.

## 🏠 Real-life example

Think of a **school science project**.

- Your **rough notebook** = the development build. It has crossed-out lines, notes to yourself and "check this!" reminders. It is messy but useful while you work.
- The **final chart on the wall** = the production build. It is neat and short, with only what the visitors need.
- **Removing your rough notes** before the exhibition = removing dev-only code.
- **Writing the date on the final chart** = the hash in the file name. A new version gets a new date, so nobody mixes up old and new.

You would never put your rough notebook on the wall. You also never send a development build to users.

## 🧑‍💻 Code example

This builds one tiny React app both ways with **esbuild** (a very fast bundler). Make a folder, then run `npm init -y` and `npm install esbuild react react-dom`.

`app.jsx`:

```jsx
import { createRoot } from 'react-dom/client'; // React's tool that draws your app into the page
function App() { // our tiny component
  if (process.env.NODE_ENV !== 'production') console.log('debug: App rendered'); // a dev-only log
  return <h1>Hello from the build</h1>; // what the user sees
} // end of App
createRoot(document.getElementById('root')).render(<App />); // start the app inside <div id="root">
```

`build.mjs` (run it with `node build.mjs`):

```js
import * as esbuild from 'esbuild'; // the bundler we use for this demo
import { statSync, readFileSync } from 'node:fs'; // to read file sizes and contents
const common = { entryPoints: ['app.jsx'], bundle: true, jsx: 'automatic', logLevel: 'silent' }; // settings shared by both builds
await esbuild.build({ ...common, outfile: 'dev/app.js', sourcemap: true, define: { 'process.env.NODE_ENV': '"development"' } }); // development build
await esbuild.build({ ...common, outfile: 'prod/app.js', minify: true, define: { 'process.env.NODE_ENV': '"production"' } }); // production build
const kb = (f) => (statSync(f).size / 1024).toFixed(1) + ' KB'; // turn bytes into kilobytes
console.log('dev  app.js:', kb('dev/app.js'), '+ source map', kb('dev/app.js.map')); // dev sizes
console.log('prod app.js:', kb('prod/app.js'), '(no source map)'); // prod size
console.log('dev has debug log :', readFileSync('dev/app.js', 'utf8').includes('debug: App rendered')); // is the dev log still there?
console.log('prod has debug log:', readFileSync('prod/app.js', 'utf8').includes('debug: App rendered')); // was it removed?
console.log('prod first 80 chars:', readFileSync('prod/app.js', 'utf8').slice(0, 80)); // what minified code looks like
```

Real output (esbuild 0.28, React 19):

```text
dev  app.js: 1212.3 KB + source map 1812.4 KB
prod app.js: 218.3 KB (no source map)
dev has debug log : true
prod has debug log: false
prod first 80 chars: "use strict";(()=>{var yd=Object.create;var X0=Object.defineProperty;var md=Obje
```

**What to notice:**
- The production file is about **5.5 times smaller** (218 KB vs 1212 KB).
- The dev-only `console.log` is **gone** from production.
- Production code is squeezed: short names like `yd` and `X0`, no spaces.

## 🔍 Deeper version

**What changes between the two builds:**

| Thing | Development build | Production build |
|---|---|---|
| Size | big | small (minified) |
| Readable code | yes | no (short names, no spaces) |
| Source maps | yes, so DevTools shows your real files | usually off, or uploaded privately to an error tool |
| `NODE_ENV` | `development` | `production` |
| React warnings and checks | on | removed |
| StrictMode double-runs | on | off |
| File names | simple (`app.js`) | hashed (`index-CnceAJRU.js`) |
| Speed of building | fast, rebuilds on every save | slower, does a full careful build once |

**How dev-only code disappears.** The bundler replaces `process.env.NODE_ENV` with the text `"production"`. Then `if ("production" !== "production")` is always false. The minifier sees this branch can never run, so it deletes it. This is called **dead-code elimination**. React uses exactly this trick for its warnings. That's why React's production bundle is much smaller.

**Minifying** means rewriting code to be as short as possible without changing what it does: removing spaces and comments, and renaming variables to one or two letters. See [Minification, source maps and hashed file names](topic:web-fundamentals/minify-sourcemaps).

**Hashed names** let the server tell browsers "keep this file for a year". A new deploy makes new names, so users still get the new code. See [Browser caching and cache busting](topic:web-fundamentals/browser-caching).

**In real projects you rarely write this yourself:**
- **Vite:** `npm run dev` = development mode, `npm run build` = production build, `npm run preview` = serve that build locally.
- **webpack:** `mode: 'development'` or `mode: 'production'` in the config sets `NODE_ENV` and turns minifying on or off.
- **Create React App** (old, no longer recommended) did the same with `npm start` and `npm run build`.

**Bugs that only appear in production:**
- An [environment variable](glossary:environment-variable) is missing because it was only in your local `.env` file. See [Environment variables at build time vs run time](topic:web-fundamentals/env-build-vs-runtime).
- A wrong base path, so the JS files 404 on the real server.
- Code that accidentally depended on a dev-only check.
- Case-sensitive file paths: `Header.jsx` vs `header.jsx` works on a Mac but breaks on a Linux server.

## 🎯 Why do we use it?

- **Developers need help.** Warnings, readable code and source maps make bugs easy to find.
- **Users need speed.** A smaller file downloads faster, especially on a phone with a weak network.
- **Two builds give both.** You get a comfortable coding experience and a fast app for users, from the same code.

## ⚠️ Common mistakes

- **Deploying the dev build.** The site works, but it is slow and full of warnings in the console.
- **Never running the production build locally.** Then the first time you see it is on the live site.
- **Leaving public source maps on a sensitive app** without thinking. They let anyone read your original code.
- **Thinking `console.log` is always removed.** Only logs inside dev-only branches are removed. Normal `console.log` calls stay unless you configure the tool to drop them.

## 🗣️ How to answer in an interview

> "A development build is optimised for the developer. It isn't minified, it has source maps, and React keeps its warnings and StrictMode checks. A production build is optimised for users. The bundler sets NODE_ENV to production, so dev-only code is removed by dead-code elimination. The code is minified, and files get content-hashed names so they can be cached for a long time.
>
> In a Vite project that's npm run dev versus npm run build. Before deploying, I run npm run build and npm run preview locally. That catches production-only problems, like a missing environment variable or a wrong base path."

[FILL IN: how builds ran at your work — for example, a webpack production build on the CI server before upload. Only add what's true.]

## 🔁 Follow-up questions

### Why is React's production build so much smaller?

React's code has a lot of warnings and checks wrapped in "if not production" blocks. In a production build those blocks become dead code and are deleted. Minifying shrinks the rest.

### Should you ship source maps to production?

It depends. Public source maps let anyone read your original code. Many teams generate them but upload them only to an error-tracking tool, so stack traces are readable for the team but not public.

### What does `npm run preview` do in Vite?

It serves the files in `dist/` (the production build) on a local port. It's how you test the real production output before deploying.

### Why can a bug appear only in production?

Because the production build is different code: dev branches are removed, code is minified, and environment variables can differ. Things like missing variables or wrong paths only show up there.

## ✅ Quick check

### 1. In a production build, what happens to this line?

```js
if (process.env.NODE_ENV !== 'production') console.log('debug'); // a dev-only log
```

:::answer
It is **removed**. The bundler turns the condition into `'production' !== 'production'`, which is always false. The minifier then deletes the whole line as dead code.
:::

### 2. Which file name is from a production build?

- A) `app.js`
- B) `index-CnceAJRU.js`

:::answer
**B.** The extra part is a hash of the file's content. Production builds add it so browsers can cache the file safely.
:::

### 3. True or false: StrictMode's double effect runs also happen for real users.

:::answer
**False.** They only happen in development builds.
:::
