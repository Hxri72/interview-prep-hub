---
title: "Babel explained: transpiling, presets, polyfills and browserslist"
stack: web-fundamentals
order: 14
level: Intermediate
mustKnow: true
askedFrequency: common
summary:
  - "Babel is a transpiler: it reads modern JavaScript (and JSX/TypeScript) and writes older JavaScript that your target browsers understand."
  - "It works in three steps: parse the code into a tree (AST), transform the tree with plugins, generate new code."
  - "A preset is a group of plugins: preset-env (new JS → old JS, based on targets), preset-react (JSX), preset-typescript (removes types)."
  - "Syntax (like ?. or #private) can be rewritten; missing built-in features (like Array.prototype.includes) need polyfills from core-js."
  - "Faster tools (Oxc and SWC in Rust, esbuild in Go) do the same job; Vite 8 uses Oxc and Next.js uses SWC, while many webpack apps still use Babel."
cards:
  - q: What is transpiling?
    a: Turning source code in one form (modern JS, JSX, TypeScript) into another form of the same level (older JavaScript), so more browsers can run it.
  - q: What are the three steps inside Babel?
    a: Parse the code into an AST (a tree describing the code), transform the AST with plugins, and generate new code from the changed tree.
  - q: What does @babel/preset-env do?
    a: It looks at your target browsers (browserslist) and turns only the newer syntax those browsers don't support into older syntax.
  - q: Syntax transform vs polyfill?
    a: New syntax like ?. or class private fields can be rewritten into older code. Missing built-ins like Array.prototype.includes can't be rewritten, so a polyfill adds them at runtime.
  - q: Why do Vite and Next.js use Oxc or SWC instead of Babel?
    a: Oxc (Vite 8) and SWC (Next.js) are written in Rust, so they transform code much faster than Babel, which is written in JavaScript.
---

## 💡 What is it?

**Babel** is a tool that turns **modern JavaScript into older JavaScript**. This is called **transpiling**.

You write new syntax like `?.`, `#private` fields and JSX. Babel rewrites it so your **target browsers** can run it. In webpack apps, Babel usually runs through `babel-loader`.

## 🏠 Real-life example

Think of **a translator for a school exchange visit**.

- **Your speech in modern slang** = modern JavaScript (`?.`, `??`, JSX).
- **The visitors, some of whom only know formal language** = older browsers.
- **The translator** = Babel. They listen, understand the meaning (parse), change the words (transform), and speak it again (generate).
- **A phrasebook for a whole topic, like "food words"** = a preset (a group of plugins).
- **The list of which visitors are coming** = targets / browserslist. If everyone knows modern slang, the translator changes very little.
- **Lending a visitor a missing tool, like a calculator** = a polyfill. You can't "translate" a missing tool. You have to provide it.

## 🧑‍💻 Code example

In a folder with Node, run:

```bash
npm install -D @babel/core @babel/preset-env @babel/preset-react babel-plugin-polyfill-corejs3   # Babel + presets + polyfill plugin
```

Save this as `babel-demo.js`, then run `node babel-demo.js`:

```js
const babel = require('@babel/core');                        // the Babel compiler, used as a library

const modern = [                                             // modern JS + JSX, one line per feature
  "const city = user?.address?.city ?? 'Unknown';",         // optional chaining ?. and nullish ??
  'const greet = (name) => `Hi ${name}`;',                  // arrow function + template literal
  'class Job { #salary = 0; }',                             // class with a private field
  'const ok = [1, 2, 3].includes(2);',                      // a newer array method (needs a polyfill)
  'const el = <h1>Hello</h1>;',                             // JSX
].join('\n');                                                // join the lines into one code string

const result = babel.transformSync(modern, {                 // compile the code text
  configFile: false,                                         // ignore babel.config.json; use these options
  presets: [                                                 // a preset = a ready-made group of plugins
    ['@babel/preset-env', { targets: 'chrome 49' }],         // turn new syntax into syntax a 2016 browser knows
    ['@babel/preset-react', { runtime: 'automatic' }],       // turn JSX into jsx() function calls
  ],                                                         // end of presets
  plugins: [                                                 // extra plugins
    ['polyfill-corejs3', { method: 'usage-global', version: '3.51' }], // add polyfills only for features we use
  ],                                                         // end of plugins
});                                                          // end of transformSync
console.log(result.code);                                    // print the old-style output
```

**Output** (real run, Babel 8):

```text
var _user$address$city, _user;
import "core-js/modules/es.array.includes.js";
import "core-js/modules/es.weak-map.get-or-insert.js";
import "core-js/modules/es.weak-map.get-or-insert-computed.js";
import { jsxDEV as _jsxDEV } from "react/jsx-dev-runtime";
function _classPrivateFieldInitSpec(e, t, a) { _checkPrivateRedeclaration(e, t), t.set(e, a); }
function _checkPrivateRedeclaration(e, t) { if (t.has(e)) throw new TypeError("Cannot initialize the same private elements twice on an object"); }
var city = (_user$address$city = (_user = user) === null || _user === void 0 || (_user = _user.address) === null || _user === void 0 ? void 0 : _user.city) !== null && _user$address$city !== void 0 ? _user$address$city : 'Unknown';
var greet = name => `Hi ${name}`;
var _salary = /*#__PURE__*/new WeakMap();
class Job {
  constructor() {
    _classPrivateFieldInitSpec(this, _salary, 0);
  }
}
var ok = [1, 2, 3].includes(2);
var el = /*#__PURE__*/_jsxDEV("h1", {
  children: "Hello"
}, void 0, false);
```

**What to notice:**
- **`?.` and `??`** became long `=== null || === void 0` checks. Chrome 49 doesn't know them.
- **`#salary`** became a `WeakMap`. That's how private fields are faked in old browsers.
- **Arrow function and template literal stayed.** Chrome 49 already supports them, and Babel changes only what's needed.
- **`.includes`** can't be "rewritten", so Babel added `import "core-js/…/es.array.includes.js"`. That's a **polyfill**.
- **JSX** became `_jsxDEV(...)` calls. It used the development helper because we didn't set production mode.

Now the **same code** for modern browsers (`targets: 'defaults'`) with `NODE_ENV=production` (real output):

```text
import "core-js/modules/es.array.includes.js";
import { jsx as _jsx } from "react/jsx-runtime";
const city = user?.address?.city ?? 'Unknown';
const greet = name => `Hi ${name}`;
class Job {
  #salary = 0;
}
const ok = [1, 2, 3].includes(2);
const el = /*#__PURE__*/_jsx("h1", {
  children: "Hello"
});
```

Almost nothing changed except JSX. Modern targets mean **less work and smaller code**. (Babel still added one polyfill import, based on core-js's data for the browsers in that list.)

## 🔍 Deeper version

**1. Parse → transform → generate.**
- **Parse:** the code text becomes an **AST** (abstract syntax tree). A tree of objects like `OptionalMemberExpression` or `ClassPrivateProperty`.
- **Transform:** each **plugin** visits the nodes it cares about and replaces them. For example, the optional-chaining plugin swaps `a?.b` for a null check.
- **Generate:** the changed tree is printed back to code, plus a **source map**.

**2. Presets.**

| Preset | Job |
|---|---|
| `@babel/preset-env` | New JS syntax → older syntax, only what your **targets** need |
| `@babel/preset-react` | JSX → `jsx()` calls (automatic runtime) |
| `@babel/preset-typescript` | Removes TypeScript types (doesn't type-check) |

**3. Targets and browserslist.** `targets` (or a `browserslist` entry in `package.json`) says which browsers you support, for example `"defaults"`, `"> 0.5%, not dead"` or `"chrome 49"`. Fewer old browsers means less transformed code.

**4. Syntax vs polyfills.** Babel can rewrite **syntax**. It can't create **missing built-in features** (`Array.prototype.includes`, `Promise`, `Object.groupBy`). Those need **polyfills**, usually from **core-js**. The `usage-global` method adds only the polyfills your code actually uses.

:::version[Version note]
**Babel 8** was released in June 2026. Its `@babel/preset-env` **removed the `useBuiltIns` option**. If you try it, you get: *"The 'useBuiltIns' option has been removed. Please use babel-plugin-polyfill-corejs3 instead."* Most older tutorials and Babel 7 projects still use `useBuiltIns: 'usage'` with `corejs: 3`, so you'll see both styles.
:::

**5. Babel vs faster tools.**

| Tool | Written in | Used by |
|---|---|---|
| **Babel** | JavaScript | Many webpack apps; the most plugins |
| **TypeScript compiler (`tsc`)** | TypeScript (TS 7: native Go version) | Type-checking; can also output JS |
| **SWC** | Rust | Next.js, Vite's React-SWC plugin, Jest via `@swc/jest` |
| **Oxc** | Rust | Vite 8 (transforms and minifying) |
| **esbuild** | Go | Vite 7 and older, many build scripts |

Rust and Go tools are much faster, because they're compiled to machine code and work in parallel. Babel stays popular for its huge plugin ecosystem. See [how TypeScript becomes JavaScript](topic:web-fundamentals/typescript-compile) and [how JSX becomes JavaScript](topic:web-fundamentals/jsx-compile).

## 🎯 Why do we use it?

- **Write modern code, support older browsers.** Your users don't all have the newest browser.
- **JSX and TypeScript** need to become plain JavaScript before a browser can run them.
- **Control.** Targets decide exactly how much rewriting happens.

## ⚠️ Common mistakes

- **Expecting Babel to add polyfills automatically.** Syntax is rewritten, but built-ins need a polyfill setup.
- **Running Babel over `node_modules`.** It's very slow. Exclude it in the loader rule.
- **Targeting very old browsers by accident.** The output gets bigger and slower. Check your browserslist.
- **Thinking `@babel/preset-typescript` checks types.** It only removes them. Run `tsc --noEmit` separately.

## 🗣️ How to answer in an interview

> "Babel is a transpiler. It parses modern JavaScript, JSX or TypeScript into an AST, transforms the tree with plugins, and generates older JavaScript plus a source map. Presets are groups of plugins: preset-env rewrites only the syntax my target browsers don't support, based on browserslist, preset-react turns JSX into jsx function calls, and preset-typescript strips types.
>
> One important point is the difference between syntax and built-ins. Babel can rewrite optional chaining or private fields, but it can't create a missing Array.includes, so we add polyfills from core-js. In Babel 8 that's done with babel-plugin-polyfill-corejs3.
>
> Today many tools use faster compilers instead, like Oxc in Vite 8, SWC in Next.js, or esbuild, because they're written in Rust or Go. But a lot of webpack projects still use babel-loader."

[FILL IN: whether your SkillKeepr frontend uses Babel through babel-loader — the codebase's webpack config is Babel-based; say only what you touched.]

## 🔁 Follow-up questions

### Does Babel make my code run faster?

No. It makes the code **work in more browsers**. Transformed code is often a little **bigger and slower**, which is why modern targets are better.

### What is an AST?

An abstract syntax tree: your code as a tree of objects, like "a variable declaration whose value is a function call". Babel, ESLint, Prettier and bundlers all work on ASTs.

### Where does Babel run in a webpack project?

Inside **babel-loader**. Every `.js`/`.jsx` file webpack imports goes through Babel before webpack reads its imports.

### Polyfill vs ponyfill?

A **polyfill** adds the missing feature globally, like `Array.prototype.includes`. A **ponyfill** is a normal function you import and call, and it doesn't change globals.

## ✅ Quick check

### 1. Can Babel turn `[1, 2].includes(2)` into code that works in a browser without `includes`?

:::answer
**Not by rewriting syntax.** `includes` is a missing built-in method, so it needs a **polyfill** (core-js) added at runtime.
:::

### 2. What decides how much Babel changes your code?

- A) The size of the file
- B) The target browsers (targets / browserslist)
- C) The number of presets

:::answer
**B.** preset-env only rewrites features your targets don't support. Modern targets mean almost no changes.
:::

### 3. Name Babel's three internal steps.

:::answer
**Parse** (code → AST), **transform** (plugins change the AST), **generate** (AST → code + source map).
:::
