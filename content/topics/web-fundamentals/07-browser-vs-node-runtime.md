---
title: "Same JavaScript, two homes: browser vs Node runtimes in depth"
stack: web-fundamentals
order: 7
level: Intermediate
mustKnow: true
askedFrequency: common
summary:
  - The language is the same everywhere. What changes is the runtime around it, meaning the tools and rules it gets.
  - "Browser: window, document (DOM), localStorage, a strict security sandbox, and an event loop that also paints the screen."
  - "Node.js: process, require/import from disk, fs, net, full access to files and the network, and libuv's event loop phases."
  - Both have fetch, setTimeout, promises, URL and globalThis. But setTimeout returns a number in browsers and an object in Node.
  - Code that only uses the shared parts can run in both places (isomorphic code), like validation rules or date helpers.
cards:
  - q: Why does document is not defined appear in Node?
    a: document is part of the browser's DOM, not of JavaScript itself. Node has no page, so it has no document or window.
  - q: Which global works in both the browser and Node?
    a: globalThis. In the browser it points to window; in Node it points to the global object.
  - q: Why can Node read files but browser JavaScript can't?
    a: The browser runs page code in a security sandbox to protect the user. Node runs as a normal program on your machine, so it gets the same access as your user account.
  - q: What does setTimeout return in a browser vs Node?
    a: A number (a timer ID) in the browser, and a Timeout object in Node. Both can be passed to clearTimeout.
  - q: What is isomorphic (universal) JavaScript?
    a: Code that runs both in the browser and in Node because it only uses shared features, like a Zod schema used for both form validation and API validation.
---

## 💡 What is it?

JavaScript runs in **two main homes**: the **browser** and **Node.js**. The language rules are the same, but each home gives JavaScript **different tools** and **different limits**.

Knowing the exact differences explains errors like `document is not defined` or `require is not defined`. It also helps you write code that works in **both** places.

## 🏠 Real-life example

Think of **the same cook working in two different kitchens**.

- The **cook's skills** (cutting, frying, timing) = the JavaScript language (V8). Same in both kitchens.
- **Kitchen 1: a food stall in a busy market** = the browser.
  - It has a **display window** customers look at = the DOM.
  - It has **strict market rules**: no entering other stalls, no touching the storeroom = the security sandbox.
  - The cook also **arranges the display** between orders = rendering.
- **Kitchen 2: a big hotel kitchen** = Node.js.
  - There's **no display window** = no DOM.
  - The cook can open **every cupboard and fridge** = files and the network (`fs`, `net`).
  - It has **delivery staff** for big jobs = libuv and its thread pool.
- **Recipes using only basic skills** work in **both** kitchens = isomorphic code.

## 🧑‍💻 Code example

This one file checks what exists in the runtime it runs in. Save it as `where.js`.

```js
const checks = {                                         // things to look for in this runtime
  window: typeof window,                                 // the browser's global object
  document: typeof document,                             // the page (DOM), browser only
  process: typeof process,                               // Node's info about the running program
  require: typeof require,                               // CommonJS loader, Node only
  fetch: typeof fetch,                                   // HTTP client, in both today
  setTimeout: typeof setTimeout,                         // timers, in both
  localStorage: typeof localStorage,                     // browser storage
  globalThis: typeof globalThis,                         // the global object, in both
};                                                       // end of checks
const timer = setTimeout(() => {}, 0);                   // create a timer to see what it returns
checks.timerId = typeof timer;                           // number in browsers, object in Node
clearTimeout(timer);                                     // cancel it, we only wanted the type
console.log(JSON.stringify(checks, null, 1));            // print the results
```

Run it in **Node** with `node where.js`. Then load it in **Chrome** with a page containing `<script src="where.js"></script>` and check the Console. Real results from both:

```text
Node 24:
{ "window": "undefined", "document": "undefined", "process": "object", "require": "function",
  "fetch": "function", "setTimeout": "function", "localStorage": "undefined",
  "globalThis": "object", "timerId": "object" }

Chrome:
{ "window": "object", "document": "object", "process": "undefined", "require": "undefined",
  "fetch": "function", "setTimeout": "function", "localStorage": "object",
  "globalThis": "object", "timerId": "number" }
```

Same file, same language — **different tools**. Even `setTimeout` returns a different type.

## 🔍 Deeper version

**Side by side:**

| | Browser | Node.js |
|---|---|---|
| Engine | V8 (Chrome, Edge), SpiderMonkey (Firefox), JavaScriptCore (Safari) | V8 |
| Global object | `window` (also `self`, `globalThis`) | `global` (also `globalThis`) |
| Page / UI | DOM: `document`, events, `<canvas>` | None |
| Program info | `navigator`, `location` | `process` (env vars, args, exit, signals) |
| Modules | ES Modules (`<script type="module">`), usually bundled | CommonJS (`require`) and ES Modules (`import`) from disk and `node_modules` |
| Files | No access (only files the user picks) | Full access with `fs` |
| Network | `fetch`, `WebSocket`; limited by CORS and the same-origin policy | `fetch`, `http`, `net` (raw TCP) — no CORS limits |
| Storage | `localStorage`, `sessionStorage`, IndexedDB, cookies | Files, databases |
| Event loop | Tasks → microtasks → **render** (rAF, style, layout, paint) | **libuv phases**: timers → poll → check → close, with microtasks between callbacks |
| Background threads | Web Workers | `worker_threads`, libuv thread pool |
| Security | Strong sandbox; one site can't read another's data | Runs with your user's permissions (an opt-in permission model exists) |
| Timer return value | A number | A `Timeout` object |

**Two event loops, one idea.** Both run one callback at a time on one thread and drain microtasks between callbacks. The browser adds **rendering steps** to its loop; Node adds **I/O phases** and `process.nextTick`. Compare [the browser loop](topic:web-fundamentals/browser-runtime) and [Node's loop](topic:nodejs/event-loop).

**Why CORS exists only in browsers.** CORS protects **users**: it stops a random website from reading another site's API **using the user's cookies**. A Node script has no user cookies to protect, so it has no CORS checks. That's why "it works in Postman/Node but not in the browser" is so common. See [same-origin policy](topic:web-fundamentals/same-origin-policy).

**Isomorphic (universal) code.** Code that uses only shared features runs in both:
- validation schemas (Zod), formatting helpers, types
- business rules shared by the frontend and backend
- Next.js runs the **same React component** on the server (Node) to make HTML, then in the browser to make it interactive

When code must differ, check first: `typeof window !== 'undefined'` means "I'm in a browser".

**Other runtimes.** **Deno** (V8, secure by default, built-in TypeScript) and **Bun** (JavaScriptCore, very fast startup, all-in-one tools) also run JavaScript outside the browser. Most Node code runs on them too. Cloud "edge" runtimes (like Cloudflare Workers) use V8 with mostly browser-style APIs.

The short intro version of this topic: [Node.js vs browser JavaScript](topic:nodejs/node-vs-browser).

## 🎯 Why do we use it?

Knowing the runtime differences helps you:
- fix errors like `window is not defined` during server rendering or tests
- decide **where** code must run: secrets and file access on the server, DOM work in the browser
- share code safely between frontend and backend
- understand why browser-only security rules (CORS, cookies, sandbox) don't apply to backend code

## ⚠️ Common mistakes

- **Using `window` or `localStorage` in code that also runs in Node.** This crashes during Next.js server rendering or in Jest tests without jsdom.
- **Thinking CORS protects your API from scripts.** It only limits browsers. Your API still needs authentication and rate limits.
- **Typing timer IDs as `number` in shared TypeScript code.** In Node it's an object. Use `ReturnType<typeof setTimeout>`.
- **Expecting `require` in the browser.** Browsers understand ES Modules. Bundlers turn `require` into browser-ready code.

## 🗣️ How to answer in an interview

> "The JavaScript language is the same, but the runtime around it differs. In the browser, V8 is wrapped with the DOM, window, localStorage, fetch and an event loop that also handles rendering, and everything runs inside a security sandbox with the same-origin policy and CORS.
>
> Node wraps V8 with libuv and its own APIs — process, fs, http, net — so it has full file and network access, uses CommonJS or ES Modules from disk, and its event loop has I/O phases instead of render steps.
>
> Some APIs exist in both — fetch, timers, promises, globalThis — but even setTimeout returns a number in the browser and an object in Node. When I write code shared by both sides, like validation schemas, I only use those common features, and I guard browser-only code with typeof window checks."

## 🔁 Follow-up questions

### Why does `fetch` work in Node now?

Node added a built-in `fetch` (based on the Undici library) to match the browser. It became stable in Node 21 and is available in Node 24 LTS without any package.

### Why can a Node script call an API that fails with a CORS error in the browser?

CORS is enforced **by the browser** to protect the user's cookies and data. Node doesn't enforce it. The fix belongs on the API server, which must send the right `Access-Control-Allow-*` headers.

### How do you test DOM code with Jest, which runs in Node?

Use the **jsdom** test environment. It's a fake DOM written in JavaScript, so `document` and `window` exist during tests.

### What's `globalThis` for?

It's one standard name for the global object in every runtime. Before it existed, you had to check for `window`, `self` or `global` yourself.

## ✅ Quick check

### 1. You run a React component's file directly with `node` and get `ReferenceError: document is not defined`. Why?

:::answer
`document` comes from the browser's DOM. Node has no DOM, so the name doesn't exist. Run that code in the browser, or use jsdom in tests.
:::

### 2. Which of these exist in BOTH the browser and Node 24: `fetch`, `fs`, `localStorage`, `setTimeout`, `process`?

:::answer
**`fetch` and `setTimeout`.** `fs` and `process` are Node only, and `localStorage` is browser only.
:::

### 3. True or false: CORS stops a Node.js script from calling your API.

:::answer
**False.** CORS is a browser rule. A Node script, curl or Postman can call your API freely. That's why the API itself must check authentication.
:::
