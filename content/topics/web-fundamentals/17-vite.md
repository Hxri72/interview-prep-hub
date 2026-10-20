---
title: "Vite explained: native ESM dev server and production build"
stack: web-fundamentals
order: 17
level: Intermediate
mustKnow: false
askedFrequency: common
summary:
  - "In development, Vite does NOT bundle your code. The browser asks for each file with a normal import, and Vite compiles that one file on request."
  - "Only node_modules packages are pre-bundled once (into node_modules/.vite/deps), because they have many small files."
  - "For production, `vite build` does bundle everything — with Rolldown in Vite 8 — into a few minified, hashed files in dist/."
  - "Only variables starting with VITE_ reach the browser through import.meta.env. They are baked into the files at build time."
  - "It's fast because dev start-up doesn't wait for a full bundle (webpack-style dev servers build the whole app first)."
cards:
  - q: How does Vite's dev server serve your code?
    a: As native ES modules. The browser requests each file through import statements, and Vite transforms only that file when it's asked for.
  - q: What is dependency pre-bundling?
    a: Vite bundles packages from node_modules once at start-up into node_modules/.vite/deps, so the browser doesn't make hundreds of requests for one library.
  - q: Does vite build bundle the code?
    a: Yes. Production uses a real bundler (Rolldown in Vite 8) to make a few minified, hashed files in dist/.
  - q: How do you expose an environment variable to frontend code in Vite?
    a: Name it with a VITE_ prefix and read it as import.meta.env.VITE_NAME. Others are not exposed. Remember it becomes public.
  - q: Why is Vite's dev server faster to start than a webpack dev server?
    a: Webpack builds the whole bundle before serving. Vite starts almost at once and only compiles the files the page actually requests.
---

## 💡 What is it?

**Vite** is a build tool and dev server for frontend apps. React, Vue and many others use it.

It works in **two different ways**. In **development**, it sends your files to the browser **one by one, almost untouched**. For **production**, it **bundles** everything into a few small files.

This very site, the Interview Prep Hub, is built with **Vite 8 + React**.

## 🏠 Real-life example

Think of a **school canteen** on a normal day versus a **catering order** for a wedding.

- **Normal day (dev server):** students order one item at a time. The cook makes **only what was asked**, right then. Nothing is cooked in advance. Opening the counter takes seconds.
- **Ready-made snacks (pre-bundled dependencies):** packets of chips are bought **once** and kept on the shelf. Nobody cooks chips one by one.
- **Wedding order (production build):** everything is cooked **in advance**, packed into a few big boxes, sealed and labelled. Guests get it fast, with no waiting.
- **The old canteen (webpack dev server):** cooks the **whole menu** before opening, every morning. Opening takes a long time.

## 🧑‍💻 Code example

A tiny Vite + React app. Run `npm init -y`, then `npm install react react-dom` and `npm install -D vite @vitejs/plugin-react`. Add `"type": "module"` to `package.json`.

`index.html` (the entry point — Vite starts from HTML, not JS):

```html
<!doctype html> <!-- tell the browser this is modern HTML -->
<html> <!-- start of the page -->
  <head><title>Jobs</title></head> <!-- tab title -->
  <body> <!-- visible part -->
    <div id="root"></div> <!-- React draws the app inside this box -->
    <script type="module" src="/src/main.jsx"></script> <!-- load main.jsx as a native ES module -->
  </body> <!-- end of visible part -->
</html> <!-- end of the page -->
```

`src/main.jsx`:

```jsx
import { createRoot } from 'react-dom/client'; // React's function to start drawing in a DOM element
import App from './App.jsx'; // our component, a plain relative import
createRoot(document.getElementById('root')).render(<App />); // draw <App /> inside <div id="root">
```

`src/App.jsx`:

```jsx
export default function App() { // the main component
  return <h1>{import.meta.env.VITE_APP_TITLE} — {import.meta.env.MODE}</h1>; // show a VITE_ variable and the mode
} // end of App
```

`vite.config.js`:

```js
import { defineConfig } from 'vite'; // helper that gives editor hints for the config
import react from '@vitejs/plugin-react'; // plugin: JSX + React Fast Refresh
export default defineConfig({ plugins: [react()] }); // use the React plugin
```

`.env` (environment variables for the frontend):

```text
VITE_APP_TITLE=Mini Job Board
SECRET_KEY=abc123
```

Run these:

```bash
npx vite        # start the dev server (default port 5173)
npx vite build  # make the production files in dist/
```

Real output of `npx vite build`:

```text
vite v8.3.4 building client environment for production...
transforming...
✓ 15 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                  0.17 kB │ gzip:  0.14 kB
dist/assets/index-CSd6dRXR.js  219.55 kB │ gzip: 68.63 kB

✓ built in 94ms
```

Then I searched the built file. `Mini Job Board` **is** inside it. `abc123` (the `SECRET_KEY` value) is **not**, because it has no `VITE_` prefix.

## 🔍 Deeper version

**What the dev server really sends.** I ran `npx vite` and asked for files with `curl`, like a browser does. Real responses, shortened:

`GET /` — your `index.html`, with two scripts added by Vite:

```html
<script type="module">import { injectIntoGlobalHook } from "/@react-refresh"; ...</script> <!-- React Fast Refresh setup -->
<script type="module" src="/@vite/client"></script> <!-- Vite's client: WebSocket for hot updates -->
```

`GET /src/App.jsx` — your file, compiled **only when asked**:

```js
import { createHotContext as __vite__createHotContext } from "/@vite/client"; // hook for hot reload
import.meta.env = {"BASE_URL": "/", "DEV": true, "MODE": "development", "PROD": false, "SSR": false, "VITE_APP_TITLE": "Mini Job Board"}; // env values filled in
import __vite__cjsImport0_react_jsxDevRuntime from "/node_modules/.vite/deps/react_jsx-dev-runtime.js?v=328fb58b"; // pre-bundled React
export default function App() { /* JSX already turned into _jsxDEV(...) calls */ }
```

And `main.jsx` now imports `"/node_modules/.vite/deps/react-dom_client.js?v=0de6cd6e"` instead of `'react-dom/client'`. Browsers can't understand a bare name like `'react-dom/client'`. So Vite **rewrites** it to a real URL.

**The steps, in order:**

| Step | Dev (`vite`) | Production (`vite build`) |
|---|---|---|
| Start | instant; nothing bundled yet | reads every file from `index.html` down |
| Your code | compiled per file, on request (JSX, TS → JS) | bundled into a few chunks |
| `node_modules` | **pre-bundled once** into `node_modules/.vite/deps` | bundled with your code, split into chunks |
| Output | served from memory | files in `dist/` with hashed names |
| Minified | no | yes |
| Updates | hot module replacement over a WebSocket | rebuild |

**Why pre-bundle dependencies?** Some packages ship hundreds of tiny files, and some still use old CommonJS (`require`). Browsers only understand ES modules. So Vite converts and combines each package **once**, then caches it.

**Vite 8's tools.** I checked the installed package:
- **Rolldown** (written in Rust) bundles the production build and pre-bundles dependencies.
- **Oxc** compiles JSX/TypeScript and minifies by default.
- **esbuild** is no longer required. Its config options are marked deprecated in favour of `oxc` and `rolldownOptions`.

:::version[Version note]
Vite 7 and older used **esbuild** for dev transforms and dependency pre-bundling, and **Rollup** for production builds. Vite 8 replaced both with **Rolldown + Oxc**, so dev and production use the same bundler.
:::

**Plugins.** A plugin can change how files are loaded or transformed. `@vitejs/plugin-react` adds JSX support and React Fast Refresh. This site also has its own plugin: it reads the Markdown topic files and turns them into HTML at build time.

**`import.meta.env`.** Vite gives you these values:
- `MODE` — `development` or `production` (or your own, like `--mode staging`).
- `DEV` / `PROD` — true/false shortcuts.
- `BASE_URL` — the `base` path. GitHub Pages needs `/repo-name/`.
- Any `VITE_*` variable from `.env` files.

All of them are **replaced with fixed values** at build time. See [env at build time vs run time](topic:web-fundamentals/env-build-vs-runtime).

**Vite vs webpack.**

| | webpack dev server | Vite dev server |
|---|---|---|
| Start-up | builds the whole bundle first | starts at once, compiles on request |
| Big app | start-up grows with app size | stays fast |
| After a change | re-bundle affected part | recompile one file |
| Config | lots (loaders, plugins) | small, sensible defaults |

webpack is still common in older projects. [FILL IN: SkillKeepr's frontend uses a custom webpack 5 setup — mention only if you worked on it.]

## 🎯 Why do we use it?

- **Fast feedback while coding.** The server starts in about 100 ms, and changes show up almost instantly.
- **Small, fast files for users.** The production build is bundled, minified and split.
- **Little setup.** TypeScript, JSX, CSS and environment variables work without long config files.

## ⚠️ Common mistakes

- **Putting secrets in `VITE_` variables.** Everything with that prefix ends up in public JavaScript files. Keep secrets on the backend.
- **Thinking dev and production behave the same.** Dev isn't bundled or minified. Always test with `vite build` and `vite preview` before deploying.
- **Wrong `base` for sub-paths.** On GitHub Pages (`/repo-name/`), files 404 unless `base` matches.
- **Using `process.env` in frontend code.** In Vite it's `import.meta.env`. `process.env` doesn't exist in the browser.

## 🗣️ How to answer in an interview

> "Vite works differently in dev and production. In development it doesn't bundle my code. It serves `index.html`, and the browser loads each file through native ES module imports. Vite compiles only the file that's requested, so JSX and TypeScript are transformed on demand. Packages from node_modules are pre-bundled once and cached, because they can have hundreds of files or use CommonJS. Updates come through hot module replacement over a WebSocket.
>
> For production, `vite build` does a real bundle — Rolldown in Vite 8 — with code splitting, minification and hashed file names in `dist/`. Environment variables prefixed with `VITE_` are replaced with fixed values at build time, so they're public. The big win over a classic webpack dev server is start-up time: webpack builds the whole app before serving, while Vite starts at once and only compiles what the page asks for."

[FILL IN: a Vite project you built — e.g. this Interview Prep Hub, which uses Vite 8 + React with a custom content plugin.]

## 🔁 Follow-up questions

### Why does Vite start from `index.html` instead of a JS file?

Because in dev the browser loads the page normally. `index.html` is the real entry, and its `<script type="module">` tag starts the import chain. In the build, Vite follows the same chain to find every file.

### What is `vite preview`?

It serves the **built** `dist/` folder locally. Use it to test the production build before you deploy.

### How does Vite handle CSS?

In dev, importing a CSS file injects it with a `<style>` tag (and hot-swaps it on change). In the build, CSS is pulled out into separate minified `.css` files.

### Can Vite proxy API calls to my backend?

Yes, with `server.proxy` in the config. The browser calls the dev server's own address, which forwards to the backend. This avoids CORS in development. See [localhost and the dev server](topic:web-fundamentals/localhost-dev-server).

## ✅ Quick check

### 1. In Vite's dev server, when is `src/Settings.jsx` compiled?

:::answer
**When the browser requests it** — when an import chain reaches it, for example after you open the settings page. It is not compiled at start-up.
:::

### 2. Your `.env` has `API_KEY=xyz` and `VITE_API_URL=/api`. Which one can frontend code read?

:::answer
Only **`VITE_API_URL`**, as `import.meta.env.VITE_API_URL`. Variables without the `VITE_` prefix aren't exposed. (And remember: anything exposed is public.)
:::

### 3. True or false: Vite's production build serves your source files one by one, like the dev server.

:::answer
**False.** `vite build` bundles, minifies and splits the code into a few hashed files in `dist/`.
:::
