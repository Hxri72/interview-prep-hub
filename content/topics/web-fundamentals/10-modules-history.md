---
title: "Why modules exist: script tags → CommonJS → ES Modules"
stack: web-fundamentals
order: 10
level: Basic
mustKnow: true
askedFrequency: common
summary:
  - "Before modules, every <script> shared one global scope, so files clashed and had to load in the right order."
  - "CommonJS (require / module.exports) came with Node: loading is synchronous and happens while the code runs."
  - "ES Modules (import / export) are the official standard: imports are static, so tools can see the whole dependency graph before running anything."
  - "Static imports make tree shaking possible: bundlers can drop exports that nothing imports."
  - "CommonJS exports a copy of a value; ES Modules export live bindings (you always see the current value)."
cards:
  - q: What problem do modules solve?
    a: Without modules, all script files share one global scope, so names clash and the load order matters. Modules give each file its own scope and clear imports and exports.
  - q: What is the main difference between CommonJS and ES Modules?
    a: CommonJS uses require() and runs while the code executes (synchronous, dynamic). ES Modules use import/export, which are static, so the dependency graph is known before the code runs.
  - q: Why do ES Modules allow tree shaking?
    a: Because imports and exports are static and declared at the top level, a bundler can see exactly which exports are used and remove the rest.
  - q: "If a CommonJS module exports count and later changes it, does the importer see the new value?"
    a: No. module.exports got a copy of the value at that moment. With ES Modules, imports are live bindings, so you see the new value.
  - q: "How do you use ES Modules directly in a browser?"
    a: "With <script type=\"module\">. The browser then follows import statements itself. These scripts are deferred and run in strict mode."
---

## 💡 What is it?

A **[module](glossary:module)** is one file with its own private variables. It shares only what it **exports**, and uses other files through **imports**.

JavaScript didn't have modules at first. The community made **CommonJS** for Node. Later, JavaScript got an official system: **ES Modules**.

Knowing this history explains why you still see both `require` and `import` today.

## 🏠 Real-life example

Think of **lockers in a school**.

- **Before modules:** everyone throws their things on **one big table** (the global scope). Two students named "Ravi" mix up their bags. The order people arrive in matters.
- **Modules:** each student gets a **locker** (a file's own scope). They can only take what someone puts in the **sharing tray** (export).
- **CommonJS:** you **walk to the locker when you need something** during the day (require at run time). You get a **photocopy** of the note inside.
- **ES Modules:** the **timetable lists everything you'll need before school starts** (static imports). You look through a **window into the locker**, so you always see the current note (live bindings).

## 🧑‍💻 Code example

Make a folder with these four files. Run `node app.cjs`, then `node app.mjs`. (`.cjs` always means CommonJS, and `.mjs` always means ES Modules.)

```js
// counter.cjs — a CommonJS module
let count = 0;                          // a private variable inside this module
function increment() { count++; }       // a function that changes count
module.exports = { count, increment };  // CommonJS: export a COPY of count's value (0) and the function
```

```js
// app.cjs — uses the CommonJS module
const counter = require('./counter.cjs');     // CommonJS: load the module now (synchronous)
counter.increment();                          // count inside the module becomes 1
console.log('CommonJS count:', counter.count); // still 0, because we got a copy
console.log('Same object on 2nd require?', require('./counter.cjs') === counter); // modules are cached
```

```js
// counter.mjs — an ES Module
export let count = 0;                       // ES Module: export the variable itself (a live binding)
export function increment() { count++; }    // a function that changes count
```

```js
// app.mjs — uses the ES Module
import { count, increment } from './counter.mjs'; // ES Module: static import, read before the code runs
increment();                                     // count inside the module becomes 1
console.log('ES Module count:', count);          // 1, because we see the live variable
```

**Output:**

```text
CommonJS count: 0
Same object on 2nd require? true
ES Module count: 1
```

## 🔍 Deeper version

**1. Life before modules.** Pages loaded many `<script>` tags. Every top-level `var` or `function` became a global. Two libraries could overwrite each other's `$` or `utils`. Developers used the **IIFE / module pattern**: a function that runs at once and returns only a public object, to hide private variables in a [closure](topic:javascript/closures).

```js
var Cart = (function () {          // an IIFE: a function that runs immediately
  var items = [];                  // private, hidden inside the function
  return { add: function (x) { items.push(x); } }; // only this object becomes global
})();                              // () runs it now
```

**2. CommonJS (2009, Node).** `require()` is a normal function call. It reads the file from disk, wraps it in a function, runs it once, caches it, and returns `module.exports`. Because it's a function call, you can call it inside an `if` or build the path from a variable. That's flexible, but tools can't know the full graph without running the code.

**3. AMD (older).** "Asynchronous Module Definition", used with RequireJS in browsers. You'll rarely see it now.

**4. ES Modules (ES2015, the standard).**
- `import`/`export` must be at the **top level**, with fixed strings. They're **static**.
- The engine reads all imports **before** running code. It builds the graph, downloads files, then runs them in order.
- Imports are **live bindings**: read-only views of the exporting module's variables.
- Modules run in **strict mode**, and top-level `this` is `undefined`.
- **Top-level `await`** is allowed in ES Modules.
- For conditional loading, use **dynamic `import()`**, which returns a promise. Bundlers use it for code splitting.

**5. Why static matters: tree shaking.** A bundler can see `import { a } from './utils'` and know that `b` is never used. Then it drops `b` from the final file. This is called [tree shaking](glossary:tree-shaking). With CommonJS, the bundler often can't be sure, so it keeps everything.

**6. In the browser.** `<script type="module" src="main.js">` lets the browser follow imports itself. It's deferred by default. Plain names like `import React from 'react'` don't work in the browser alone. You need a bundler, or an **import map** that maps the name to a URL.

**7. In Node today.** `.mjs` files and `"type": "module"` in `package.json` mean ESM. Recent Node can even `require()` most ES Modules. See [CommonJS vs ESM in Node](topic:nodejs/commonjs-vs-esm) and [modules in the browser](topic:javascript/modules).

## 🎯 Why do we use it?

- **No name clashes.** Each file has its own scope.
- **Clear dependencies.** You can see exactly what a file needs.
- **Reuse.** npm packages are modules you import.
- **Smaller bundles.** Static ES Modules let bundlers tree-shake and split code.

## ⚠️ Common mistakes

- **Mixing `require` and `import` in one file** without knowing the file's module type. Node decides by the extension and the `"type"` field.
- **Expecting a CommonJS export to update.** You got a copy of the value at export time.
- **Writing `import` inside an `if`.** Static imports must be top-level. Use `await import('./x.js')` instead.
- **Thinking browsers understand `import 'react'` by themselves.** They need a bundler or an import map to find the file.

## 🗣️ How to answer in an interview

> "Before modules, every script shared one global scope, so names clashed and load order mattered. People used the IIFE pattern to hide variables. Node then introduced CommonJS, with require and module.exports. It's synchronous and dynamic: require runs while the code executes, and you get a copy of exported values.
>
> ES Modules are the official standard, with import and export. They're static, so the engine and bundlers know the whole dependency graph before running anything. That's what makes tree shaking and code splitting with dynamic import possible. ES Module imports are also live bindings, so you always see the current value.
>
> Today I use ES Modules for new code, and I know Node decides the module type from the file extension or the type field in package.json."

## 🔁 Follow-up questions

### Can you use ES Modules and CommonJS together?

Yes, with care. ESM can `import` CommonJS packages. Modern Node can also `require()` most ES Modules, unless they use top-level `await`. In one file, pick one system.

### What does Node do when you `require` the same file twice?

It runs the file **once** and caches the result. The second `require` returns the same `module.exports` object.

### What is a circular import?

File A imports B, and B imports A. It works, but one of them sees the other only half-finished. With CommonJS you may get an incomplete object. With ESM you may get a "cannot access before initialization" error. Fix it by moving shared code into a third file.

### Why does `this` behave differently at the top of a module?

In CommonJS, top-level `this` is `module.exports`. In ES Modules it's `undefined`, because modules run in strict mode.

## ✅ Quick check

### 1. Which line is valid ES Module syntax?

- A) `if (admin) { import x from './admin.js'; }`
- B) `const admin = await import('./admin.js');`
- C) `import x from someVariable;`

:::answer
**B.** Dynamic `import()` can be used anywhere and returns a promise. Static `import` must be top-level, with a fixed string.
:::

### 2. Why can bundlers tree-shake ES Modules but often not CommonJS?

:::answer
ES Module imports and exports are **static**, so the bundler can see which exports are used without running the code. `require()` is a normal function call that may be dynamic.
:::

### 3. What does `app.cjs` print for `counter.count` after `increment()`?

:::answer
**`0`.** `module.exports` got a copy of `count` (0) when the module ran. The later change is not seen.
:::
