---
title: "webpack explained: entry, output, loaders, plugins and code splitting"
stack: web-fundamentals
order: 13
level: Intermediate
mustKnow: true
askedFrequency: common
summary:
  - "webpack's four core ideas: entry (where to start), output (where to write), loaders (how to transform each file type) and plugins (extra jobs on the whole build)."
  - "Loaders work on one file at a time (babel-loader for JS/JSX, css-loader + style-loader for CSS); plugins work on the whole build (HtmlWebpackPlugin, DefinePlugin)."
  - "mode: 'production' minifies and tree-shakes; mode: 'development' builds fast with readable code."
  - "Code splitting: dynamic import() makes a lazy chunk, and splitChunks moves npm packages into a separate vendor chunk."
  - "[contenthash] in file names gives each build new names only for changed files, so browsers can cache safely."
cards:
  - q: What are entry, output, loaders and plugins in webpack?
    a: Entry is the start file of the dependency graph. Output is where bundles are written and how they're named. Loaders transform individual files (JSX, CSS). Plugins do jobs on the whole build (create index.html, inject env values, extract CSS).
  - q: Loader vs plugin?
    a: A loader transforms one module at a time as it's imported (like babel-loader). A plugin hooks into the whole build process (like HtmlWebpackPlugin writing index.html).
  - q: How does webpack do code splitting?
    a: Each dynamic import() becomes a separate chunk loaded on demand, and optimization.splitChunks moves shared and npm code into its own chunks.
  - q: What does [contenthash] do?
    a: It puts a hash of the file's content into its name, so the name changes only when that file changes, which allows long browser caching.
  - q: What changes between mode development and production?
    a: Production minifies, tree-shakes and sets process.env.NODE_ENV to "production", making much smaller files. Development builds faster and keeps code readable.
---

## 💡 What is it?

**webpack** is a popular **[bundler](topic:web-fundamentals/what-is-bundler)**. It turns your React app's many files into a few files the browser can load.

You control it with a config file, `webpack.config.js`. Four words explain most of it: **entry**, **output**, **loaders** and **plugins**.

Many company apps built in the last ten years still use webpack, so you'll meet it at work.

## 🏠 Real-life example

Think of **a school canteen kitchen**.

- **Entry** = the first item on the order: "start with the main meal".
- **Following imports** = the main meal needs rice, curry and salad; the curry needs spices… The kitchen follows the recipe tree.
- **Loaders** = **workers for each food type**: one washes vegetables (CSS), another cooks rice (JSX → JS). Each works on one item at a time.
- **Plugins** = **jobs for the whole kitchen**: printing the menu card (index.html), labelling all boxes with today's date (env values).
- **Output** = the packed lunch boxes, each labelled with a code (the content hash).
- **Code splitting** = dessert goes in a separate box, given out only to students who ask.

## 🧑‍💻 Code example

A real, minimal React + webpack 5 project. Setup:

```bash
mkdir wp-demo && cd wp-demo                       # new folder
npm init -y                                       # create package.json
npm install react react-dom                       # the app's runtime packages
npm install -D webpack webpack-cli babel-loader @babel/core @babel/preset-env @babel/preset-react html-webpack-plugin css-loader style-loader   # build tools only
```

`src/index.js`:

```jsx
import React, { lazy, Suspense } from 'react';              // React and two helpers for lazy loading
import { createRoot } from 'react-dom/client';             // puts React on the page
import './styles.css';                                      // CSS imported like a module (css-loader)

const Jobs = lazy(() => import('./Jobs.jsx'));             // dynamic import → webpack makes a separate chunk

function App() {                                            // the main component
  return (                                                  // JSX → Babel turns this into JS
    <main>                                                  {/* page wrapper */}
      <h1>Interview Prep</h1>                               {/* heading */}
      <Suspense fallback={<p>Loading…</p>}><Jobs /></Suspense> {/* Jobs code loads only when needed */}
    </main>                                                 // end of wrapper
  );                                                        // end of return
}                                                           // end of App

createRoot(document.getElementById('root')).render(<App />); // draw App inside <div id="root">
```

`webpack.config.js`:

```js
const path = require('node:path');                          // builds absolute folder paths
const HtmlWebpackPlugin = require('html-webpack-plugin');   // writes index.html with <script> tags

module.exports = (env, argv) => ({                          // a function so we can read --mode
  entry: './src/index.js',                                  // where the dependency graph starts
  output: {                                                 // where and how files are written
    path: path.resolve(__dirname, 'dist'),                  // the output folder
    filename: '[name].[contenthash:8].js',                  // name + 8 characters of content hash → cache busting
    clean: true,                                            // delete old files before each build
  },                                                        // end of output
  resolve: { extensions: ['.js', '.jsx'] },                 // let imports skip these extensions
  module: {                                                 // how to treat each kind of file
    rules: [                                                // a list of rules, checked for every import
      { test: /\.jsx?$/, exclude: /node_modules/, use: 'babel-loader' }, // .js/.jsx → Babel
      { test: /\.css$/, use: ['style-loader', 'css-loader'] },           // .css → JS that adds a <style> tag
    ],                                                      // end of rules
  },                                                        // end of module
  plugins: [new HtmlWebpackPlugin({ template: './src/index.html' })], // copy index.html and add the scripts
  optimization: {                                           // how output is split
    splitChunks: { chunks: 'all' },                         // npm packages go into a separate vendor file
  },                                                        // end of optimization
  devtool: argv.mode === 'production' ? 'source-map' : 'eval-source-map', // maps from bundle back to source
});                                                         // end of config
```

`babel.config.json` (JSON can't have comments: `preset-env` turns new JS into older JS, and `preset-react` turns JSX into function calls):

```json
{ "presets": [["@babel/preset-env", { "targets": "defaults" }], ["@babel/preset-react", { "runtime": "automatic" }]] }
```

Add a small `src/Jobs.jsx`, `src/styles.css` and `src/index.html` with `<div id="root"></div>`. Then build:

```bash
npx webpack --mode production    # build for real users
```

**Output** (real run, webpack 5.112):

```text
asset 132.2b8a7d55.js 217 KiB [emitted] [immutable] [minimized] (id hint: vendors) 2 related assets
asset main.97d5ea50.js 4.25 KiB [emitted] [immutable] [minimized] (name: main) 1 related asset
asset 343.667f7a36.js 301 bytes [emitted] [immutable] [minimized] 1 related asset
asset index.html 154 bytes [emitted] [minimized]
webpack 5.112.0 compiled successfully in 2100 ms
```

And the `index.html` webpack wrote:

```text
<!doctype html><head><script defer src=132.2b8a7d55.js></script><script defer src=main.97d5ea50.js></script></head><body><div id=root></div></body></html>
```

**What to notice:**
- **Three JS files:** `132…` is the **vendor** chunk (React and ReactDOM). `main…` is **your code**. `343…` is the lazy **Jobs** chunk, loaded only when `<Jobs>` renders.
- Every name has a **content hash**.
- HtmlWebpackPlugin added the `<script defer>` tags for you.

## 🔍 Deeper version

**1. The build pipeline.** webpack starts at `entry` and **resolves** each import (using `resolve.extensions` and `resolve.alias`). It runs the matching **loaders** from `module.rules`, **parses** the result to find more imports, and repeats. Then it **optimises** (tree shaking, splitting, minifying with Terser) and **emits** files. Plugins can hook into every stage.

**2. Loaders run right to left.** In `use: ['style-loader', 'css-loader']`, `css-loader` runs **first**. It turns CSS into a JS module. Then `style-loader` adds a `<style>` tag at run time. For production, people often swap `style-loader` for **MiniCssExtractPlugin**, which writes a real `.css` file.

**3. Useful plugins.**

| Plugin | Job |
|---|---|
| `HtmlWebpackPlugin` | Writes `index.html` with the right hashed script tags |
| `DefinePlugin` / `EnvironmentPlugin` | Replaces `process.env.X` in your code with a fixed value **at build time** |
| `MiniCssExtractPlugin` | Writes CSS into separate files |
| `CompressionPlugin` | Writes pre-compressed `.gz` / `.br` files for the server or CDN |
| `BundleAnalyzerPlugin` | Shows a map of what's inside each bundle |

**4. Development vs production (real numbers from the same project).**

| | Development | Production |
|---|---|---|
| Vendor chunk | **3.21 MiB** (readable, with eval source maps) | **217 KiB** (minified) |
| Chunk names | `src_Jobs_jsx.aa49f45c.js` (readable) | `343.667f7a36.js` (short ids) |
| Speed | Fast rebuilds | Slower, fully optimised |

**5. Dev server.** `webpack serve` (webpack-dev-server) builds in **memory**, serves on a [localhost port](topic:web-fundamentals/localhost-dev-server), and updates the page with [hot reload](topic:web-fundamentals/hot-reload).

**6. A real-world gotcha we hit.** With `"type": "commonjs"` in `package.json`, webpack 5 parsed `.js` source files as CommonJS. `import` then failed with *"'import' and 'export' may appear only with 'sourceType: module'"*. Removing the `type` field, or using `.mjs`/`.jsx` files, fixed it. webpack respects the package's module type.

**7. webpack at SkillKeepr (public-safe).** The SkillKeepr React apps use a custom **webpack 5** setup with **Babel**. It has per-page code splitting with `React.lazy`, vendor chunks per npm package, content-hashed file names, gzip pre-compression, a whitelist of allowed environment variables, and path aliases like `@components`. [FILL IN: what you personally changed or debugged in this setup, if anything.]

## 🎯 Why do we use it?

- **Total control.** Loaders and plugins can handle almost any file or need.
- **Mature ecosystem.** Many company projects already use it.
- **Fast first load.** Code splitting, vendor caching and hashing make pages quick.
- **One place for build rules.** Aliases, env variables and output names all live in the config.

## ⚠️ Common mistakes

- **Getting loader order wrong.** Loaders run **right to left** (bottom to top).
- **Forgetting `exclude: /node_modules/` for Babel.** Builds become very slow.
- **Putting secrets in `DefinePlugin`/`EnvironmentPlugin`.** They're written into the public JS file. See [build-time env variables](topic:web-fundamentals/env-build-vs-runtime).
- **Using `[hash]` or no hash.** Use `[contenthash]`, so only changed files get new names.

## 🗣️ How to answer in an interview

> "webpack builds a dependency graph starting from the entry file. For each import it resolves the path, runs the matching loaders, like babel-loader for JSX or css-loader for CSS, and follows the new imports. Loaders work on one file at a time. Plugins hook into the whole build, for example HtmlWebpackPlugin writes index.html with the script tags, and DefinePlugin injects environment values at build time.
>
> In production mode it tree-shakes and minifies. I split code with dynamic import for routes, use splitChunks to put npm packages in a vendor chunk, and name files with contenthash so browsers can cache them for a long time. The difference is big: production mode can shrink a React vendor chunk from a few megabytes to around 200 KB."

## 🔁 Follow-up questions

### What is tree shaking in webpack and when does it fail?

In production, webpack drops exports nobody imports. It needs ES Modules. It can fail with CommonJS code, or when a module has **side effects** on import. Packages mark themselves safe with `"sideEffects": false` in `package.json`.

### How do you make the first load faster in a webpack app?

Lazy-load routes and heavy components with `import()`. Split vendor code. Remove big unused libraries (check with a bundle analyzer). Compress with gzip or brotli. Cache hashed files for a long time.

### What is `resolve.alias` for?

Short import paths like `import Button from '@components/Button'`, instead of `../../../components/Button`. The same aliases must also be set in `tsconfig.json` and Jest, or those tools can't find the files.

### webpack vs Vite?

webpack bundles everything even in development, so big apps start slowly. Vite serves native ES Modules in development, so it starts almost instantly, and bundles only for production. See [Vite](topic:web-fundamentals/vite).

## ✅ Quick check

### 1. In `use: ['style-loader', 'css-loader']`, which runs first?

:::answer
**`css-loader`.** Loaders run right to left. css-loader turns CSS into a JS module, then style-loader injects it into the page.
:::

### 2. Which file in the real output is the lazy `Jobs` page?

- A) `132.2b8a7d55.js` (217 KiB)
- B) `main.97d5ea50.js` (4.25 KiB)
- C) `343.667f7a36.js` (301 bytes)

:::answer
**C.** The tiny chunk was created by `import('./Jobs.jsx')`. `132…` is the vendor chunk, and `main…` is the app code.
:::

### 3. Loader or plugin: "write index.html with the right script tags"?

:::answer
**Plugin** (HtmlWebpackPlugin). It works on the whole build, not on one imported file.
:::
