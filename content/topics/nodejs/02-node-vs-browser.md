---
title: Node.js vs browser JavaScript
stack: nodejs
order: 2
level: Basic
mustKnow: false
askedFrequency: common
summary:
  - Both use the same JavaScript language, but they have different built-in tools (APIs).
  - The browser has window, document (the DOM) and localStorage. Node.js has process, fs, http and full access to files and the network.
  - The browser keeps code in a safe "sandbox". Node.js code can read files and run programs, so it must be trusted code.
  - In the browser, the user picks the version. On a server, YOU pick the Node.js version.
  - "globalThis works in both. Modern Node also has fetch, setTimeout, URL and Web Streams, just like browsers."
cards:
  - q: What is the main difference between Node.js and browser JavaScript?
    a: Same language, different built-in tools. The browser gives you the DOM and window. Node gives you process, fs, http and access to the file system.
  - q: Can you use document or window in Node.js?
    a: No. There is no web page in Node, so there is no DOM. The global object is globalThis (also called global in Node).
  - q: Does Node.js have fetch?
    a: Yes. fetch is built in since Node 18 and stable since Node 21. Before that you needed a package like node-fetch or axios.
  - q: Why can Node.js read files but browser JavaScript cannot?
    a: The browser runs untrusted code from any website, so it locks it inside a sandbox. Node runs code you chose to run, so it gets full access to your computer.
  - q: Who controls the JavaScript version in each environment?
    a: In the browser, each user's browser decides. On a server, you choose the Node.js version, so you can use new features safely.
---

## 💡 What is it?

Node.js and the browser both run **the same JavaScript language**. `let`, functions, arrays, promises and classes work the same in both.

But each place gives JavaScript **different built-in tools**. These tools are called [APIs](glossary:api). The browser gives tools for web pages, like buttons and the screen. Node.js gives tools for servers, like files and the network.

## 🏠 Real-life example

Think of **one chef working in two kitchens**.

The chef cooks at home in the morning. In the evening, the same chef works in a big hotel kitchen. Their cooking skills are the same. But the tools are different.

- The **chef and their skills** = the JavaScript language.
- The **home kitchen** = the browser. It's safe and small. The chef can't touch the main gas line or the building's storeroom.
- The **hotel kitchen** = Node.js. It has big ovens and keys to the storeroom (files) and the delivery door (network).
- The **home kitchen's dining table** = the web page (the DOM). The hotel kitchen has no dining table, so there is no `document` in Node.

## 🧑‍💻 Code example

Save this as `where.js`. Run it with `node where.js`.

```js
const where = typeof window === 'undefined' ? 'Node.js' : 'a browser'; // window exists only in browsers
console.log('Running in', where);                    // prints which place this code is running in
console.log(typeof globalThis);                      // "object" → globalThis is the global object in BOTH places
console.log(process.version);                        // the Node version, e.g. "v24.x.x" (process exists only in Node)
console.log(process.platform);                       // the operating system: "darwin" = Mac, "linux", "win32" = Windows

const fs = require('node:fs');                       // load the file module — browsers cannot do this
fs.writeFileSync('hello.txt', 'Hi from Node');       // create a real file on your computer
console.log(fs.readFileSync('hello.txt', 'utf8'));   // read it back as text ('utf8' = normal text)
```

**Output** (your version and platform may be different):

```text
Running in Node.js
object
v24.11.0
darwin
Hi from Node
```

Now try the first two lines in the browser console (F12 → Console). You will see `Running in a browser`. The `process` line fails there, because `process` doesn't exist in browsers.

## 🔍 Deeper version

**Side-by-side:**

| | Browser | Node.js |
|---|---|---|
| Main job | Show and control web pages | Servers, APIs, tools, scripts |
| Global object | `window` (also `globalThis`) | `global` (also `globalThis`) |
| Page / [DOM](glossary:dom) | `document`, events like `click` | None |
| Files | No direct access (only files the user picks) | Full access with `fs` |
| Network | `fetch`, WebSocket (limited by CORS) | `fetch`, `http`, `net` — any server, no CORS |
| Storage | `localStorage`, cookies, IndexedDB | Files, databases |
| Modules | ES Modules (`import`) | ES Modules **and** CommonJS (`require`) |
| Security | Sandbox (very limited) | Full access to the computer |
| Version | Chosen by each user's browser | Chosen by you |
| Event loop | Built by the browser (HTML rules) | Built by [libuv](glossary:libuv) |

**Same language, same engine (sometimes).** Chrome and Node both use the **V8** engine. Firefox and Safari use other engines. The language rules (ECMAScript) are the same everywhere.

**Node is getting more "browser-like".** Modern Node has many web-standard APIs: `fetch`, `URL`, `AbortController`, `TextEncoder`, `structuredClone`, Web Streams, `WebSocket` (client) and `crypto.subtle`. So more code can run in both places.

:::version[Version note]
`fetch` became built-in in **Node 18** and stable in **Node 21**. A built-in `WebSocket` client became stable in **Node 22**. In older projects you will still see packages like `node-fetch`, `axios` and `ws`.
:::

**Small differences that cause bugs:**
- `setTimeout` returns a **number** in the browser, but a **Timeout object** in Node. TypeScript types can complain if you mix them.
- **No CORS in Node.** CORS is a browser rule. A Node script can call any API. (That's why CORS errors are fixed on the server, not in Node clients.)
- **The event loops differ.** Node has extra queues like `process.nextTick` and `setImmediate`. Browsers don't have them. See [process.nextTick vs setImmediate vs setTimeout](topic:nodejs/nexttick-setimmediate-settimeout).
- **Modules.** Node supports old CommonJS (`require`) and ES Modules (`import`). See [CommonJS vs ES Modules](topic:nodejs/commonjs-vs-esm).

## 🎯 Why do we use it?

Knowing the difference helps you:
- **Choose where code should run.** Secret keys and database access must stay in Node, never in the browser.
- **Share code safely.** Validation rules and helper functions can be shared, as long as they don't use `window` or `fs`.
- **Fix "works in one place, fails in the other" bugs**, like `document is not defined` or `process is not defined`.
- **Understand server-side rendering** (like Next.js). There, the same component runs once in Node and once in the browser.

## ⚠️ Common mistakes

- **Using `window`, `document` or `localStorage` in Node code.** You get `ReferenceError: window is not defined`. Check with `typeof window !== 'undefined'` if code must run in both.
- **Putting secrets in frontend code.** Anything sent to the browser can be read by users. API keys belong in Node, in environment variables.
- **Thinking CORS protects your API from scripts.** CORS only limits browsers. Postman, curl or a Node script can still call your API, so you still need authentication.
- **Assuming all browser APIs exist in Node** (or the other way round). Check the docs for each one.

## 🗣️ How to answer in an interview

> "Both run the same JavaScript language, but they give it different APIs. The browser gives me the DOM, `window`, events and `localStorage`, and it runs code inside a sandbox for safety. Node gives me `process`, the file system, `http` and full network access, because it runs trusted code on a server.
>
> A few practical differences matter. There is no DOM in Node, and no CORS, since CORS is a browser rule. Node supports both CommonJS and ES Modules. And on the server I choose the exact Node version, while in the browser each user's browser decides.
>
> Modern Node is closer to the browser than before. It now has built-in `fetch`, `URL`, `AbortController` and Web Streams, so more code can be shared. Chrome and Node also use the same V8 engine."

## 🔁 Follow-up questions

### What is `globalThis`?

A standard name for the global object that works everywhere. In the browser it equals `window`. In Node it equals `global`. In web workers it equals `self`. Use `globalThis` when code must run in many places.

### Why does Node not have CORS errors?

CORS is a safety rule inside **browsers**. It stops a website from reading another site's data with the user's cookies. Node is not a browser and has no user cookies, so it does not apply CORS. The server still decides who may call it, using authentication.

### Can the same code run in both Node and the browser?

Yes, if it only uses the language and shared APIs (like `fetch`, `URL`, `JSON`, `Math`). Code that uses `fs` or `document` can't be shared. Libraries often check the environment, or bundlers swap in a browser version.

### Is the event loop the same in Node and the browser?

The idea is the same: run one task, then the microtasks, then the next task. But the details differ. Node's loop comes from libuv and has phases plus `process.nextTick` and `setImmediate`. The browser's loop also handles rendering (painting the screen). See [the event loop](topic:nodejs/event-loop).

## ✅ Quick check

### 1. Which line fails in Node.js?

- A) `console.log(globalThis)`
- B) `document.querySelector('#app')`
- C) `fetch('https://example.com')`

:::answer
**B.** There is no DOM in Node, so `document` is not defined. A works everywhere. C works in modern Node (18+).
:::

### 2. True or false: an API with no CORS setup can't be called by a Node.js script on another server.

:::answer
**False.** CORS is enforced only by browsers. A Node script, curl or Postman can call the API anyway. Protect APIs with authentication, not CORS.
:::

### 3. What does `typeof setTimeout(() => {}, 10)` print in Node? And in the browser?

:::answer
In Node: **`"object"`** (a Timeout object). In the browser: **`"number"`** (a timer ID). Both can be passed to `clearTimeout`.
:::
