---
title: What a bundler does (webpack, Vite, esbuild, Rollup)
stack: web-fundamentals
order: 12
level: Basic
mustKnow: true
askedFrequency: very common
summary:
  - A bundler starts from an entry file, follows every import to build a dependency graph, and writes a few optimised files for the browser.
  - "Browsers can't use your src folder well: too many files, npm package names, JSX/TypeScript, CSS imports and old browsers."
  - "On the way it transforms code (JSX/TS → JS), splits code into chunks, tree-shakes unused exports, minifies and adds content hashes to file names."
  - "Main tools: webpack (very configurable, older), Rollup (great for libraries), esbuild (very fast, written in Go), Vite (dev server + production build; Vite 8 bundles with Rolldown)."
  - In interviews, explain the graph, the transforms and the outputs; the tool names matter less than the idea.
cards:
  - q: What does a bundler do, in one sentence?
    a: It starts from an entry file, follows all imports to build a dependency graph, transforms the code, and writes a small number of optimised files the browser can load.
  - q: Why can't we just ship the src folder to the browser?
    a: There would be hundreds of requests, bare package names like 'react' the browser can't find, JSX and TypeScript the browser can't run, and CSS imports it doesn't understand.
  - q: What is code splitting?
    a: Splitting the bundle into chunks so the browser downloads only what a page needs, often by using dynamic import() for routes or heavy components.
  - q: Why do bundles have names like main.97d5ea50.js?
    a: The hash comes from the file's content. When the content changes, the name changes, so browsers and CDNs can cache files forever and still get updates.
  - q: Name four bundlers or build tools.
    a: webpack, Rollup, esbuild and Vite (plus newer Rust-based tools like Rspack, Rolldown and Turbopack).
---

## 💡 What is it?

A **bundler** is a tool that prepares your code for the browser.

It starts at one **entry file**, like `src/index.js`. It follows every `import` and builds a map of all the files your app needs. Then it writes a few optimised files into a `dist` folder.

Popular bundlers are **webpack**, **Vite**, **Rollup** and **esbuild**.

## 🏠 Real-life example

Think of **packing for a school trip**.

- **Your room** = the `src` folder: lots of small things everywhere.
- **The packing list that says "the camera needs its charger"** = the dependency graph. One thing leads to the next.
- **Packing everything into one or two bags** = bundling. Fewer things to carry means fewer trips.
- **Leaving behind things you won't use** = tree shaking.
- **A separate small bag for the swimming day** = code splitting. You only open it when needed.
- **Folding clothes tightly** = minifying.
- **Writing the date on each bag** = the content hash. If anything changes, the label changes.

## 🧑‍💻 Code example

A tiny bundler in about 30 lines, to see the idea. Make a folder with `src/index.js`, `src/cart.js`, `src/price.js` and `bundler.js` as below. Add `{"type":"commonjs"}` as `package.json`. Then run `node bundler.js` and `node dist/bundle.js`.

```js
// src/price.js
module.exports = (amount) => '₹' + amount.toFixed(2); // format a number as rupees
```

```js
// src/cart.js
const price = require('./price.js');                 // cart needs price
module.exports = (items) => price(items.reduce((s, i) => s + i, 0)); // total of all items
```

```js
// src/index.js — the entry file
const total = require('./cart.js');                  // index needs cart
console.log('Cart total:', total([199, 349.5]));     // print the formatted total
```

```js
// bundler.js — our toy bundler
const fs = require('node:fs');                                // read and write files
const path = require('node:path');                            // join folder and file names

const modules = {};                                           // file path → its code, for every file we find
function collect(file) {                                      // add one file and everything it needs
  if (modules[file]) return;                                  // already added → skip it (stops endless loops)
  const code = fs.readFileSync(file, 'utf8');                 // read the file's text
  modules[file] = code;                                       // remember its code
  for (const [, rel] of code.matchAll(/require\('(.+?)'\)/g)) { // find each require('./x.js') inside it
    collect(path.join(path.dirname(file), rel));              // follow it → this builds the dependency graph
  }                                                           // end of for
}                                                             // end of collect
collect('src/index.js');                                      // start from the entry file

let out = 'const files = {\n';                                // the bundle starts with one object of files
for (const [id, code] of Object.entries(modules)) {           // every file we collected
  out += `'${id}': function (require, module) {\n${code}\n},\n`; // wrap it in a function → its own scope
}                                                             // end of for
out += `}; // end of the files object
const path = require('node:path');            // the bundle's tiny runtime starts here
const cache = {};                             // each file runs only once
function load(id) {                           // run a file and return what it exports
  if (cache[id]) return cache[id].exports;    // already ran → reuse the result
  const module = { exports: {} };             // the object the file fills in
  cache[id] = module;                         // save it before running
  const req = (rel) => load(path.join(path.dirname(id), rel)); // its own require()
  files[id](req, module);                     // run the wrapped file
  return module.exports;                      // give back what it exported
} // end of load
load('src/index.js');                         // start the app from the entry file
`;                                                            // end of the runtime text
fs.mkdirSync('dist', { recursive: true });                    // make the output folder
fs.writeFileSync('dist/bundle.js', out);                      // write ONE file with everything inside
console.log('Bundled:', Object.keys(modules).join(', '));     // show which files went in
```

**Output** (real run on Node 24):

```text
$ node bundler.js
Bundled: src/index.js, src/cart.js, src/price.js
$ node dist/bundle.js
Cart total: ₹548.50
```

Three files became **one** file that still works. Each original file got its own function, so its variables can't clash with others. That's the core of webpack's output too.

## 🔍 Deeper version

**1. Why browsers need this.**

| Problem | What the bundler does |
|---|---|
| Hundreds of small files → many network requests | Combines them into a few chunks |
| `import React from 'react'`: the browser doesn't know where "react" is | Resolves package names from `node_modules` |
| JSX, TypeScript, new syntax | Transforms them, using Babel, esbuild or SWC |
| `import './styles.css'`, images, fonts | Turns them into CSS files, URLs or inlined data |
| Old browsers | Compiles down, and adds polyfills if configured |
| Big downloads | Minifies, tree-shakes, compresses |

**2. The steps inside a real bundler.**
1. **Resolve:** turn each import string into a real file path. Same rules as [npm/Node](topic:web-fundamentals/npm-install), plus aliases like `@components`.
2. **Load + transform:** read the file and run it through transformers (loaders/plugins), like TSX → JS.
3. **Build the graph:** parse imports and repeat for each dependency.
4. **Optimise:** tree-shake unused exports (works best with [ES Modules](topic:web-fundamentals/modules-history)), split chunks, minify.
5. **Emit:** write files with **content hashes**, plus `index.html` and **source maps** (maps from the bundle back to your original lines, for debugging).

**3. The tools.**

| Tool | Written in | Known for |
|---|---|---|
| **webpack** | JavaScript | Very configurable (loaders + plugins); huge ecosystem; common in older apps |
| **Rollup** | JavaScript | Clean ES Module output; popular for libraries |
| **esbuild** | Go | Extremely fast transforms and bundling |
| **Vite** | JS, using fast native tools | Fast dev server using the browser's native ESM; production build |
| **Rspack / Rolldown / Turbopack** | Rust | Newer, very fast; Rspack aims to be webpack-compatible, Rolldown powers newer Vite, Turbopack is used by Next.js |

Deep dives: [webpack](topic:web-fundamentals/webpack), [Vite](topic:web-fundamentals/vite), and [why bundle size matters](topic:mantine-tailwind/bundle-size).

## 🎯 Why do we use it?

- **Speed for users.** Fewer, smaller, cacheable files make the first load faster.
- **Modern code everywhere.** You can write JSX, TypeScript and `import`, and the browser still gets plain JavaScript.
- **Use npm in the browser.** The bundler finds packages in `node_modules`.
- **Safe caching.** Hashed names mean you can cache files for a year and still ship updates.

## ⚠️ Common mistakes

- **Thinking the bundler "runs" your app.** It only builds files. The browser runs them later.
- **Importing a whole library for one function,** like all of lodash. Import only what you need, so tree shaking works.
- **Not splitting routes.** One giant bundle makes the first page slow. Use dynamic `import()` for pages.
- **Shipping source maps publicly without thinking.** They reveal your original source code. Decide on purpose.

## 🗣️ How to answer in an interview

> "A bundler starts from an entry file, follows every import to build a dependency graph, and writes a few optimised files for the browser. On the way it resolves package names from node_modules, transforms JSX and TypeScript into JavaScript, handles CSS and images, tree-shakes unused exports, splits the code into chunks, minifies it, and adds content hashes to the file names for caching.
>
> We need it because browsers can't efficiently load hundreds of source files, don't understand bare package names or JSX, and old browsers don't support new syntax. Popular tools are webpack, which is very configurable, Rollup for libraries, esbuild which is very fast, and Vite, which uses native ES modules in development and does an optimised build for production."

[FILL IN: which bundler your current project uses, e.g. "At SkillKeepr the React apps are built with webpack 5" — the codebase uses a custom webpack 5 setup; say what you personally did with it, if anything.]

## 🔁 Follow-up questions

### What is the difference between bundling and transpiling?

**Transpiling** changes the language of one file, like JSX → JS or new JS → old JS. **Bundling** combines many files into a few. Most build tools do both.

### Do we still need bundlers now that browsers support ES Modules?

Mostly yes, for production. Browsers can load modules natively, but deep import chains mean many round trips. Bundlers still do tree shaking, minifying and hashing. Vite uses native ESM in development and bundles for production.

### What is a chunk?

One output file. Usually there's a main chunk, a vendor chunk with npm packages, and lazy chunks created by `import()`.

### What is a source map?

A file that maps lines in the minified bundle back to your original source. DevTools and error trackers use it, so stack traces point to your real code.

## ✅ Quick check

### 1. What does a bundler build first, before writing any output?

:::answer
The **dependency graph**: starting at the entry file, it follows every import to find all the files the app needs.
:::

### 2. Why does `main.97d5ea50.js` have a hash in its name?

- A) To hide the code
- B) So the name changes when the content changes, allowing long caching
- C) Because browsers require it

:::answer
**B.** The hash comes from the content. New content gets a new name, so old cached copies are never used by mistake.
:::

### 3. Which module system makes tree shaking easiest?

:::answer
**ES Modules**, because their imports and exports are static, so the bundler can see exactly what is used.
:::
