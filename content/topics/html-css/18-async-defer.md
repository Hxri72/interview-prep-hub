---
title: "Loading scripts: async vs defer"
stack: html-css
order: 18
level: Intermediate
mustKnow: false
askedFrequency: common
summary:
  - A normal script tag stops HTML parsing until the script is downloaded and run. This blocks the page.
  - "defer: download in the background, run after the HTML is parsed, in the order they appear."
  - "async: download in the background, run as soon as it arrives, in any order."
  - Scripts with type module are deferred by default.
  - Use defer (or module) for your app code, and async for independent scripts like analytics.
cards:
  - q: What does a plain script tag in the head do to page loading?
    a: The browser stops building the page, downloads the script, runs it, and only then continues. The user sees a blank or half page while waiting.
  - q: defer vs async?
    a: Both download in parallel. defer runs after HTML parsing, in document order. async runs as soon as it downloads, in any order, and may interrupt parsing.
  - q: When to use async?
    a: For independent scripts that don't depend on other scripts or the DOM being ready, like analytics or ads.
  - q: Is type module async or deferred?
    a: Deferred by default. You can add async to a module script to run it as soon as it is ready.
  - q: When does DOMContentLoaded fire relative to defer scripts?
    a: After all defer scripts have run.
---

## 💡 What is it?

When the browser reads your HTML, it builds the page step by step. This is called **parsing**.

A normal `<script>` tag makes the browser **stop parsing**. It waits for the script to download and run, then continues. The page looks frozen or blank while it waits.

The `defer` and `async` attributes let the browser download scripts **in the background**, so the page keeps building.

## 🏠 Real-life example

Think of a **teacher writing notes on the board** while students bring in books from the library.

- **Normal script** = the teacher stops writing, waits at the door for a student to fetch a book, reads it aloud, and only then continues writing. The class waits.
- **`defer`** = the teacher keeps writing. Students fetch the books meanwhile. When the board is finished, the teacher reads the books **in the order they were asked for**.
- **`async`** = the teacher keeps writing. But the moment *any* book arrives, the teacher stops and reads it straight away, in whatever order they arrive.

The board = the HTML page. The books = scripts.

## 🧑‍💻 Code example

Create three files in one folder: `index.html`, `a.js` and `b.js`. Open `index.html` in your browser, then open the Console (F12).

```html
<!DOCTYPE html>                                         <!-- modern HTML page -->
<html lang="en">                                        <!-- page language = English -->
<head>                                                  <!-- page settings -->
  <script defer src="a.js"></script>                    <!-- defer: download now, run after parsing, 1st -->
  <script defer src="b.js"></script>                    <!-- defer: download now, run after parsing, 2nd -->
  <script>                                              // an inline script with no attribute: runs right away
    console.log('1. inline script in head');            // runs before the body is even parsed
    document.addEventListener('DOMContentLoaded', () => { // event: HTML fully parsed + defer scripts done
      console.log('4. DOMContentLoaded');               // runs after a.js and b.js
    });                                                 // end of listener
  </script>                                             <!-- end inline script -->
</head>                                                 <!-- end of head -->
<body>                                                  <!-- visible content -->
  <h1 id="title">Hello</h1>                             <!-- a heading the scripts will look for -->
</body>                                                 <!-- end of body -->
</html>                                                 <!-- end of page -->
```

```js
// a.js
console.log('2. a.js found title:', !!document.getElementById('title')); // !! turns the element into true/false
```

```js
// b.js
console.log('3. b.js runs after a.js'); // defer keeps the order: a.js, then b.js
```

**What you see in the Console:**

```text
1. inline script in head
2. a.js found title: true
3. b.js runs after a.js
4. DOMContentLoaded
```

Because of `defer`, `a.js` could already find the `<h1>` (the HTML was parsed), and `a.js` ran before `b.js`. If you change both to `async`, the order of lines 2 and 3 can change between reloads.

## 🔍 Deeper version

| Attribute | Download | Runs when | Order kept? | Blocks parsing? |
|---|---|---|---|---|
| none | stops parsing to download | immediately after download | yes | **yes** |
| `defer` | in parallel | after HTML is parsed, before `DOMContentLoaded` | **yes** | no |
| `async` | in parallel | as soon as it's downloaded | **no** | only while running |
| `type="module"` | in parallel | like `defer` | yes | no |
| `type="module" async` | in parallel | as soon as it's ready | no | only while running |

**Key points:**
- `defer` and `async` only affect scripts with `src`. On inline classic scripts they are ignored. (Inline **module** scripts are deferred.)
- Old advice was "put scripts at the end of `<body>`". It works, but the download only starts late. `defer` in the `<head>` starts the download early **and** doesn't block, so it's better.
- **CSS can block scripts.** A classic script waits for earlier stylesheets to load, because the script might read styles. Keep important CSS small. See [critical rendering path](topic:html-css/critical-rendering-path).
- **`DOMContentLoaded`** fires when the HTML is parsed and all `defer`/module scripts have run. **`load`** fires later, when images and other resources are done too.
- **Resource hints:** `<link rel="preload" as="script" href="…">` fetches early. `<link rel="modulepreload">` fetches a module and its imports early.
- **Bundlers.** Vite outputs `<script type="module" src="/assets/index-xxx.js">`, so modern apps are deferred automatically. Code splitting adds more chunks loaded on demand. See [code splitting in React](topic:react/code-splitting).
- **`fetchpriority="high"`** on a script or image tells the browser it's important.

**Third-party scripts** (analytics, chat widgets) should be `async`, or loaded after the page is interactive, so they can't slow down your app.

## 🎯 Why do we use it?

- **Faster first view.** The user sees content while scripts download.
- **Better Core Web Vitals.** Blocking scripts delay Largest Contentful Paint and make the page feel slow. See [Core Web Vitals](topic:html-css/core-web-vitals).
- **Safe DOM access.** `defer` scripts run after the HTML exists, so `getElementById` finds elements.
- **Predictable order** for scripts that depend on each other (with `defer`).

## ⚠️ Common mistakes

- **Using `async` for scripts that depend on each other.** A library and the code that uses it can run in the wrong order.
- **A big blocking script in `<head>`.** The page stays white until it runs.
- **Expecting `defer` to work on an inline script.** It's ignored there.
- **Forgetting that `type="module"` is already deferred.** Adding `defer` to it does nothing.

## 🗣️ How to answer in an interview

> "A plain script tag blocks HTML parsing: the browser stops, downloads the script, runs it, then continues, so the user waits. defer and async both download the script in parallel. The difference is when it runs. defer runs after the HTML is fully parsed, just before DOMContentLoaded, and keeps the scripts in order. async runs as soon as it's downloaded, in any order, which can interrupt parsing.
>
> So I use defer, or type module, which is deferred by default, for app code that needs the DOM or depends on other scripts. I use async for independent third-party scripts like analytics. With a bundler like Vite, the app is a module script, so it's already deferred."

## 🔁 Follow-up questions

### Why is `defer` in `<head>` better than a script at the end of `<body>`?

Both avoid blocking. But in the `<head>`, the browser finds the script early and starts downloading it while it parses the rest of the HTML. At the end of `<body>`, the download only starts after the whole page has been parsed.

### What's the difference between `DOMContentLoaded` and `load`?

`DOMContentLoaded` fires when the HTML is parsed and deferred scripts have run. `load` fires when everything, including images, fonts and iframes, has finished loading.

### Can an async script use `document.getElementById`?

Only if that element is already parsed when the script happens to run. It's not guaranteed, so async scripts shouldn't rely on the DOM being complete.

### How do you load a script only when needed?

Use dynamic `import('./module.js')` in JavaScript. It returns a promise and downloads the code on demand. This is how lazy routes work.

## ✅ Quick check

### 1. Two scripts: `<script async src="lib.js">` and `<script async src="app.js">`. `app.js` uses functions from `lib.js`. What can go wrong?

:::answer
`app.js` might download first and run **before** `lib.js`, so its functions are missing and it throws an error. Use `defer` on both to keep the order.
:::

### 2. Which one does NOT block HTML parsing while downloading?

- A) `<script src="x.js">`
- B) `<script defer src="x.js">`
- C) Both block

:::answer
**B.** `defer` downloads in parallel and waits to run until parsing is done. A plain script stops parsing.
:::
