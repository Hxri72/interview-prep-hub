---
title: "Modules: ES Modules vs CommonJS"
stack: javascript
order: 26
level: Intermediate
mustKnow: false
askedFrequency: common
summary:
  - A module is one file that shares some of its code with other files and keeps the rest private.
  - "ES Modules (ESM) use import / export. It's the official JavaScript standard, used by browsers, Vite, React and modern Node."
  - "CommonJS (CJS) uses require / module.exports. It's Node's older system, still common in older Express apps."
  - ESM imports are static, so bundlers can remove unused code (tree shaking). Dynamic import() loads code only when needed (code splitting).
  - "Named exports can be many per file and need exact names; there can be only one default export, and you can name it anything when importing."
cards:
  - q: What is a JavaScript module?
    a: A file with its own scope that shares chosen parts using export, and uses other files' parts using import (or require in CommonJS).
  - q: What is the difference between ES Modules and CommonJS?
    a: "ESM uses import/export, is the official standard, loads asynchronously and is analysed before running. CJS uses require/module.exports, is Node's older system and loads synchronously at runtime."
  - q: Named export vs default export?
    a: A file can have many named exports, imported with exact names in { }. It can have only one default export, which you can import under any name.
  - q: What is tree shaking?
    a: The bundler removes exports that nobody imports, so the final bundle is smaller. It works well with ESM because imports are static.
  - q: What does dynamic import() do?
    a: It loads a module only when the code runs, and returns a promise. Bundlers use it for code splitting, like React.lazy.
---

## 💡 What is it?

A **[module](glossary:module)** is **one file** that shares some of its code and keeps the rest private.

There are two module systems in JavaScript:
- **ES Modules (ESM):** `import` and `export`. This is the official standard, used in browsers, React and Vite.
- **CommonJS (CJS):** `require` and `module.exports`. This is Node's older system.

Both let you split a big app into small files that are easy to understand and reuse.

## 🏠 Real-life example

Think of **a school with different departments**: the library, the sports room and the science lab.

Each department keeps most of its things inside. It only **lends out** certain items to other departments.

- **Each department** = a module (one file).
- **The list of items it lends out** = `export`.
- **Asking another department for an item** = `import` (or `require`).
- **Things that stay inside the room** = private code that isn't exported.
- **The department's main, famous item** (the library's book collection) = the `default` export.
- **The new official lending form** = ESM. **The old handwritten form** that some departments still use = CommonJS.

## 🧑‍💻 Code example

Make a folder with these two files. Then run `node app.mjs`. (The `.mjs` ending tells Node "this is an ES module".)

**`math.mjs`**

```js
export const PI = 3.14;                             // a named export
export function area(r) {                           // another named export
  return PI * r * r;                                // area of a circle
}                                                   // end of area
export default function hello(name) {               // the default export (one per file)
  return `Hello ${name}`;                           // build a greeting
}                                                   // end of hello
```

**`app.mjs`**

```js
import hello, { PI, area } from './math.mjs';       // default import (any name) + named imports (exact names)
import * as math from './math.mjs';                 // import everything as one object called math

console.log(hello('Asha'));                         // Hello Asha
console.log(PI, area(2));                           // 3.14 12.56
console.log(Object.keys(math));                     // [ 'PI', 'area', 'default' ]

const { default: lazyHello } = await import('./math.mjs'); // dynamic import: load the file only when needed
console.log(lazyHello('Ravi'));                     // Hello Ravi
```

**Output:**

```text
Hello Asha
3.14 12.56
[ 'PI', 'area', 'default' ]
Hello Ravi
```

The same idea in **CommonJS** (files `math.cjs` and `app.cjs`, run `node app.cjs`):

```js
// math.cjs
const PI = 3.14;                                    // a normal constant
function area(r) { return PI * r * r; }             // area of a circle
module.exports = { PI, area };                      // CommonJS: share these two things

// app.cjs
const { PI: pi, area: circleArea } = require('./math.cjs'); // CommonJS: load the file and take what we need
console.log(pi, circleArea(2));                     // 3.14 12.56
```

## 🔍 Deeper version

**1. Side-by-side:**

| | ES Modules | CommonJS |
|---|---|---|
| Syntax | `import` / `export` | `require()` / `module.exports` |
| Standard | Official JavaScript (ES2015) | Node.js only |
| When imports are known | **Before** the code runs (static) | **While** the code runs (dynamic) |
| Loading | Asynchronous; works in browsers | Synchronous; built for Node |
| Top-level `await` | Yes | No |
| `this` at the top level | `undefined` | `module.exports` |
| Strict mode | Always on | Off unless you write `'use strict'` |
| Tree shaking | Works well | Hard |

**2. Live bindings.** An ESM import is a **live link** to the exported variable. If the exporting file changes the variable, importers see the new value. A CJS `require` gives you a **copy** of whatever `module.exports` held at that moment, for simple values like numbers. Also, you can't assign to an imported name in ESM. It is read-only.

**3. In the browser and in bundlers:**
- Browsers load ESM with `<script type="module" src="app.js">`. Module scripts are deferred and run in strict mode.
- Tools like **Vite**, webpack and Rollup read your `import`s to build a **dependency graph**. Then they bundle the files.
- **[Tree shaking](glossary:tree-shaking):** exports nobody imports are removed from the final bundle. This needs static imports, which is why ESM is preferred.
- **Code splitting:** `import('./AdminPage.js')` makes a separate file (a "chunk") that loads only when needed. `React.lazy(() => import('./Page'))` uses this.

**4. Named vs default exports.** Many teams prefer **named exports**. The name stays the same everywhere, editor auto-import works better, and renaming is safer. Default exports are common for React components and config files.

**5. In Node.** A file is ESM if it ends in `.mjs`, or if `package.json` has `"type": "module"`. Recent Node versions can also `require()` most ES modules. See [CommonJS vs ESM in Node](topic:nodejs/commonjs-vs-esm) for the Node details.

**6. Circular imports.** File A imports B, and B imports A. This can give you `undefined` or a "Cannot access before initialization" error, depending on the order. Fix it by moving shared code into a third file.

## 🎯 Why do we use it?

- **To organise code.** Small files with one job are easier to read, test and reuse.
- **To avoid global variables.** Each module has its own [scope](glossary:scope), so names don't clash between files.
- **For faster websites.** Tree shaking makes bundles smaller, and dynamic `import()` loads pages only when the user opens them.
- **To use packages.** Every npm package you install is a module.

## ⚠️ Common mistakes

- **Mixing `require` and `import` in the same file** without understanding the project's module type.
- **Getting the default/named braces wrong**, like `import { hello } from './math.mjs'` when `hello` is the default export. The result is a syntax error or `undefined`.
- **Forgetting the file extension in Node ESM.** `import './math'` fails; Node needs `'./math.mjs'` or `'./math.js'`. Bundlers like Vite are more forgiving.
- **Exporting a big object of everything** with `export default { a, b, c }`. Tree shaking can't remove the unused parts.

## 🗣️ How to answer in an interview

> "A module is a file with its own scope that shares specific values through exports. JavaScript has two systems. ES Modules use import and export. It's the official standard and works in browsers, Vite and modern Node. CommonJS uses require and module.exports. It's Node's original system and still common in older Express code.
>
> The key difference is that ESM imports are static, so the structure is known before the code runs. That allows tree shaking in bundlers, top-level await, and async loading in browsers. CommonJS loads synchronously at runtime. ESM imports are also live, read-only bindings.
>
> On the frontend, I use dynamic import() for code splitting, for example with React.lazy, so heavy pages load only when they're opened. For new projects I use ESM, and I prefer named exports for consistency."

[FILL IN: which module system your SkillKeepr frontend and backend use — only if you know it.]

## 🔁 Follow-up questions

### What is code splitting?

Breaking the app's JavaScript into several smaller files that load only when needed, instead of one huge bundle. Dynamic `import()` creates these split points.

### Can you use `import` inside an `if` statement?

Not the normal `import` statement. It must be at the top level of the file. But you can call dynamic `import('./file.js')` anywhere. It returns a promise.

### What happens if you import the same module in 10 files?

It's loaded and run **once**. Every importer gets the same instance. That's why a module can safely hold shared state, like a single database connection.

### What is a barrel file?

An `index.js` that re-exports many modules: `export * from './Button'`. It makes imports tidy, but it can slow builds and hurt tree shaking in big projects.

## ✅ Quick check

### 1. Which import is correct for `export default function Card() {}`?

- A) `import { Card } from './Card.js'`
- B) `import Card from './Card.js'`
- C) `import * from './Card.js'`

:::answer
**B.** A default export is imported **without** braces, and you can choose any name. A would only work for a *named* export called `Card`. C is invalid syntax.
:::

### 2. What does this print? (in ESM)

```js
// counter.mjs
export let count = 0;                              // a named export
export function inc() { count++; }                 // changes count inside the module

// main.mjs
import { count, inc } from './counter.mjs';        // import the live binding and the function
inc();                                             // count becomes 1 inside counter.mjs
console.log(count);                                // ?
```

:::answer
**`1`.** ESM imports are live bindings, so `main.mjs` sees the updated value. (With CommonJS and a destructured number, you'd still see `0`.)
:::

### 3. True or false: tree shaking works best with CommonJS `require`.

:::answer
**False.** It works best with ES Modules, because `import`/`export` are static. The bundler can see exactly what is used before running the code.
:::
