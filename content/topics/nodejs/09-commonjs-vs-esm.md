---
title: "Modules: CommonJS vs ES Modules"
stack: nodejs
order: 9
level: Basic
mustKnow: true
askedFrequency: very common
summary:
  - A module is one file of code that can share parts of itself with other files.
  - "CommonJS (CJS) is Node's older system: require() to bring code in, module.exports to share it."
  - "ES Modules (ESM) is the official JavaScript standard: import and export. Browsers use it too."
  - "Node picks the system by file type: .cjs = CommonJS, .mjs = ESM, .js = whatever \"type\" in package.json says (CommonJS if not set)."
  - In Node 22.12+ and Node 24, require() can load most ES modules, so mixing the two is much easier than before.
cards:
  - q: What is the difference between CommonJS and ES Modules?
    a: "CommonJS uses require() and module.exports and loads files one by one, at run time. ES Modules use import and export, are the JavaScript standard, and are checked before the code runs."
  - q: How does Node decide if a .js file is CommonJS or ESM?
    a: "It looks at the nearest package.json. \"type\": \"module\" means ESM. No type (or \"commonjs\") means CommonJS. .mjs is always ESM and .cjs is always CommonJS."
  - q: Can you use __dirname in an ES module?
    a: "No, it doesn't exist there. Use import.meta.dirname (Node 20.11+) or build it from import.meta.url."
  - q: Can you require() an ES module?
    a: Yes, in Node 22.12+ and Node 24, as long as that module does not use top-level await. In older versions you had to use dynamic import().
  - q: What is a dynamic import?
    a: "import('./file.js') used like a function. It loads a module later, when the code runs, and returns a promise. It works in both CommonJS and ESM."
---

## 💡 What is it?

A **[module](glossary:module)** is one file of code that can share parts of itself with other files.

Node.js has **two ways** to share code between files:
- **CommonJS** (CJS) is the older Node way. You use `require()` and `module.exports`.
- **ES Modules** (ESM) is the official JavaScript way. You use `import` and `export`.

Both do the same job. They just use different words and follow slightly different rules.

## 🏠 Real-life example

Think of **two kinds of electric plugs**.

In an old house, the sockets take the old round plug. New appliances come with a new standard plug that works in every country. Both plugs give your fan the same electricity. But a plug must fit its socket. Sometimes you need an adapter.

- An **appliance** (fan, phone charger) = a module, one file of code.
- **Sharing power through a plug** = exporting code from a file.
- **Plugging in** = importing code into another file.
- The **old round plug** = CommonJS (`require`).
- The **new standard plug** = ES Modules (`import`). It works in browsers and in Node.
- The **adapter** = tools that let the two systems talk, like `require()` loading an ES module in new Node versions.

## 🧑‍💻 Code example

Make these four small files in one folder. Then run `node app.cjs` and `node app.mjs`.

```js
// ---- math.cjs (CommonJS) ----
function add(a, b) {                       // a normal function that adds two numbers
  return a + b;                            // give back the sum
}                                          // end of add
module.exports = { add };                  // share add with other files (CommonJS way)

// ---- app.cjs (CommonJS) ----
const { add } = require('./math.cjs');     // bring in add from math.cjs (CommonJS way)
console.log('CJS:', add(2, 3));            // prints "CJS: 5"

// ---- math.mjs (ES Module) ----
export function multiply(a, b) {           // "export" shares this function (ESM way)
  return a * b;                            // give back the product
}                                          // end of multiply

// ---- app.mjs (ES Module) ----
import { multiply } from './math.mjs';     // bring in multiply; ESM needs the full file name with extension
console.log('ESM:', multiply(2, 3));       // prints "ESM: 6"
```

**Output:**

```text
$ node app.cjs
CJS: 5
$ node app.mjs
ESM: 6
```

**What to notice:**
- `.cjs` files always use CommonJS. `.mjs` files always use ES Modules.
- In ESM you must write the file extension (`./math.mjs`). In CommonJS you can leave it out.

## 🔍 Deeper version

**How Node picks the system for a `.js` file.** Node looks at the nearest `package.json`:

| File | Treated as |
|---|---|
| `.cjs` | always CommonJS |
| `.mjs` | always ES Module |
| `.js` with `"type": "module"` | ES Module |
| `.js` with `"type": "commonjs"` or no `type` | CommonJS |

**Main differences:**

| | CommonJS | ES Modules |
|---|---|---|
| Bring code in | `require('./x')` | `import x from './x.js'` |
| Share code | `module.exports = …` | `export` / `export default` |
| When it loads | at run time, line by line, **synchronously** (waits for each file) | parsed **before** the code runs; loading can be async |
| Top-level `await` | ❌ not allowed | ✅ allowed |
| `__dirname`, `__filename` | ✅ available | ❌ use `import.meta.dirname` / `import.meta.filename` |
| Value you get | a **copy** of what was exported at that moment | a **live binding** (a link that sees later changes) |
| Browsers | ❌ need a bundler | ✅ built in |

**Static vs dynamic.** ESM `import` lines are "static". That means tools can read them without running the code. Bundlers use this to remove code you never use. This is called **tree shaking**. `require()` can be called anywhere, even inside an `if`, so tools can't be as smart.

**Dynamic import.** `import('./file.js')` works like a function. It loads a module later and returns a [promise](glossary:promise). You can use it in both systems. In CommonJS, it is the classic way to load an ES module.

:::version[Version note]
- **Node 20.11+**: `import.meta.dirname` and `import.meta.filename` were added for ES modules.
- **Node 22.12+ (and Node 24)**: `require()` can load an ES module, if that module has no top-level `await`. Before this, you got an `ERR_REQUIRE_ESM` error.
- **Node 22.7+**: if a `.js` file has no `"type"` but uses `import`/`export`, Node detects it and runs it as ESM.
:::

**Which one to pick today?** New projects usually choose **ESM** (`"type": "module"`). It is the standard, and the same code works in browsers. Many older Express apps and libraries still use CommonJS. That is fine. You need to read and write both.

## 🎯 Why do we use it?

- **To split a big app into small files.** One file for routes, one for the database, one for helpers. Each file shares only what others need.
- **To keep names private.** Anything you don't export stays inside the file. Other files can't break it by mistake.
- **To reuse code** from other people. Every npm package is a module.
- **ESM gives one system everywhere.** The same `import` works in the browser, in Node and in tools like Vite.

## ⚠️ Common mistakes

- **Mixing the two in one file.** Writing `require` and `import` in the same `.js` file usually fails. Pick one per file.
- **Forgetting the extension in ESM.** `import x from './math'` fails in Node ESM. Write `./math.js`.
- **Using `__dirname` in ESM.** It is not defined there. Use `import.meta.dirname`.
- **Mixing `module.exports` and `exports`.** Writing `exports = { add }` does nothing, because it only changes a local variable. Use `module.exports = { add }` or `exports.add = add`.

## 🗣️ How to answer in an interview

> "Node has two module systems. CommonJS is the original one. It uses require and module.exports, and it loads files synchronously at run time. ES Modules is the JavaScript standard. It uses import and export, it's parsed before the code runs, and it supports top-level await. It's also what browsers use, so tools can do tree shaking.
>
> Node decides by the file: .cjs is CommonJS, .mjs is ESM, and .js follows the "type" field in package.json. A few things change in ESM. There's no __dirname, so I use import.meta.dirname. And I must write file extensions in imports.
>
> For new projects I'd choose ESM. Since Node 22.12, require can even load ES modules, so mixing old and new code is much easier than before."

[FILL IN: which module system your SkillKeepr Node services use — CommonJS or ESM — if you know. Only add it if it's true.]

## 🔁 Follow-up questions

### What is the difference between `module.exports` and `exports`?

`exports` is just a shortcut that points to `module.exports`. You can add to it: `exports.add = add`. But if you write `exports = {...}`, you break the link, and nothing is shared. Node always shares whatever `module.exports` points to.

### Does `require()` load the same file twice?

No. Node **caches** each module after the first load. The next `require()` of the same file gives back the same object. ES modules are also loaded only once.

### What is tree shaking, and why does ESM help?

Tree shaking means removing code you never use from the final bundle. ESM `import`/`export` lines are static, so tools can see exactly what is used before running anything. With `require()`, tools can't be sure.

### How do you use an ES-module-only package from old CommonJS code?

In Node 22.12+ and 24, just `require()` it (if it has no top-level `await`). In older Node versions, use `const pkg = await import('pkg')` inside an async function.

### What is top-level `await`?

Using `await` directly in a file, outside any function. For example: `const config = await loadConfig();`. Only ES modules allow it.

## ✅ Quick check

### 1. Your `package.json` has `"type": "module"`. What system does `server.js` use?

:::answer
**ES Modules.** The `"type": "module"` field makes every `.js` file in that package ESM. Only a `.cjs` file would still be CommonJS.
:::

### 2. What happens here, in a CommonJS file?

```js
exports = { add: (a, b) => a + b };   // try to share add
```

- A) `add` is shared
- B) Nothing is shared
- C) Error

:::answer
**B) Nothing is shared.** This only changes the local `exports` variable. Node shares `module.exports`, which is still empty. Use `module.exports = { add: … }`.
:::

### 3. True or false: `__dirname` works the same in an `.mjs` file.

:::answer
**False.** `__dirname` doesn't exist in ES modules. Use `import.meta.dirname` (Node 20.11+).
:::
