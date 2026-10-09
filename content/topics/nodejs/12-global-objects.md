---
title: "Global objects: process, __dirname, globalThis"
stack: nodejs
order: 12
level: Basic
mustKnow: false
askedFrequency: sometimes
summary:
  - Global objects are things you can use in any file without importing them, like console, setTimeout, process and globalThis.
  - "process tells you about the running program: process.env (settings), process.argv (command words), process.exit(), process.memoryUsage()."
  - __dirname and __filename give the folder and full path of the current file — but only in CommonJS.
  - "In ES modules, use import.meta.dirname and import.meta.filename instead."
  - globalThis is the one standard name for the global object, in Node and in browsers. Avoid putting your own data on it.
cards:
  - q: What is the global object in Node.js?
    a: "globalThis (also called global in Node). It holds things available everywhere, like setTimeout and console. In browsers the same thing is window."
  - q: What is process.argv?
    a: "An array of the words used to start the program. [0] is the node path, [1] is the script path, and your own arguments start at [2]."
  - q: Why does __dirname not work in ES modules?
    a: "It's a CommonJS feature. Each CommonJS file is wrapped in a function that receives __dirname. ES modules don't have that wrapper, so use import.meta.dirname."
  - q: What does process.exit(1) mean?
    a: "Stop the program now with exit code 1. 0 means success; any other number means an error. Avoid it inside a running server — shut down gracefully instead."
---

## 💡 What is it?

**Global objects** are things you can use in any file without importing them. You already know some: `console`, `setTimeout` and `fetch`.

Node.js adds a few of its own:
- **`process`** tells you about the running program.
- **`__dirname`** and **`__filename`** give the folder and the path of the current file (in CommonJS).
- **`globalThis`** is the global object itself, the "home" of all global things.

## 🏠 Real-life example

Think of a **school building**.

Some things are in every classroom without you asking: a clock, a fan, a board. You don't bring them from home. Those are **globals**, like `console` and `setTimeout`.

- The **school office** = `process`. It knows the school's details: the address, the timings, the rules. It can also ring the bell to end the day (`process.exit()`).
- **Your classroom number** = `__dirname`. It tells you where *you* are in the building.
- **The whole building** = `globalThis`. Everything shared lives here.

If one class sticks its own notice on the main gate, everyone sees it. That's why you should not put your own things on `globalThis`.

## 🧑‍💻 Code example

Save this as `info.cjs`. Run `node info.cjs hello 42`.

```js
console.log('Folder:', __dirname);                      // the folder this file is in (CommonJS only)
console.log('File:', __filename);                       // the full path of this file
console.log('Args:', process.argv.slice(2));            // words typed after the file name → ['hello', '42']
console.log('Node version:', process.version);          // the Node.js version, e.g. v24.x.x
console.log('OS type:', process.platform);              // 'darwin' = macOS, 'linux', 'win32' = Windows
console.log('Folder you ran it from:', process.cwd());  // cwd = "current working directory"
console.log('Mode:', process.env.NODE_ENV ?? 'not set'); // read a setting from environment variables
const mb = process.memoryUsage().heapUsed / 1024 / 1024; // heap memory used, changed from bytes to MB
console.log('Memory used (MB):', mb.toFixed(1));        // show it with 1 decimal place
console.log(globalThis.setTimeout === setTimeout);      // true → setTimeout lives on the global object
```

**Output (yours will show your own paths):**

```text
Folder: /Users/hari/demo
File: /Users/hari/demo/info.cjs
Args: [ 'hello', '42' ]
Node version: v24.11.0
OS type: darwin
Folder you ran it from: /Users/hari/demo
Mode: not set
Memory used (MB): 3.9
true
```

## 🔍 Deeper version

**`globalThis` vs `global` vs `window`.** For years, each place had its own name: `window` in browsers, `global` in Node, `self` in workers. **`globalThis`** (from ES2020) is the one standard name that works everywhere. In Node, `global === globalThis`.

**Useful parts of `process`:**

| Property / method | What it gives you |
|---|---|
| `process.env` | environment variables (settings), always strings. See [environment variables](topic:nodejs/environment-variables) |
| `process.argv` | the words used to start the program |
| `process.cwd()` | the folder you **ran** the command from |
| `process.exit(code)` | stop now; `0` = success, any other number = error |
| `process.exitCode = 1` | set the exit code, but let the program finish normally |
| `process.memoryUsage()` | memory numbers in bytes (`rss`, `heapUsed`…) |
| `process.uptime()` | seconds since the program started |
| `process.pid` | the process ID number from the operating system |
| `process.on('SIGTERM', fn)` | run code when the system asks the app to stop. See [graceful shutdown](topic:nodejs/graceful-shutdown) |
| `process.nextTick(fn)` | run `fn` right after the current code. See [the event loop](topic:nodejs/event-loop) |

**`process` is also an EventEmitter.** You can listen for `'exit'`, `'uncaughtException'` and `'unhandledRejection'`. See [EventEmitter](topic:nodejs/event-emitter).

**Where does `__dirname` come from?** It's not truly global. In CommonJS, Node wraps every file in a hidden function, like this:

```js
(function (exports, require, module, __filename, __dirname) {  // Node adds this wrapper around your file
  // ...your code is here...
});                                                            // end of the wrapper
```

That's why `require`, `module`, `__dirname` and `__filename` work in every CommonJS file. ES modules have no wrapper. So there, use `import.meta.dirname` and `import.meta.filename`.

:::version[Version note]
`import.meta.dirname` and `import.meta.filename` were added in **Node 20.11**. In older code you will see this longer version: `path.dirname(fileURLToPath(import.meta.url))`.
:::

**`__dirname` vs `process.cwd()`.** This difference causes real bugs:
- `__dirname` is the folder of **the file**. It never changes.
- `process.cwd()` is the folder you **ran the command from**. It changes if you start the app from somewhere else.

To read a file that sits next to your code, use `__dirname` (or `import.meta.dirname`), not `cwd()`.

## 🎯 Why do we use it?

- **Settings without hard-coding.** `process.env.PORT` and `process.env.MONGO_URL` come from the environment, not from the code.
- **Safe file paths.** `__dirname` builds paths that work no matter where you start the app from.
- **Command-line tools.** `process.argv` reads what the user typed.
- **Health and monitoring.** `process.memoryUsage()` and `process.uptime()` help you watch the app.
- **Clean shutdown.** `process.on('SIGTERM')` lets you close the database before the app stops.

## ⚠️ Common mistakes

- **Using `__dirname` in an ES module.** You get `ReferenceError: __dirname is not defined`. Use `import.meta.dirname`.
- **Using `process.cwd()` to find your own files.** It breaks when the app is started from another folder.
- **Calling `process.exit()` inside a running server.** Open requests and unfinished logs are cut off. Set `process.exitCode` or shut down gracefully.
- **Putting your own data on `globalThis`.** It's a hidden shared variable that any file can change, so bugs are hard to find. Export and import it instead.

## 🗣️ How to answer in an interview

> "Global objects are available in every file without importing, like console, setTimeout and fetch. The global object itself is globalThis, which is the same as global in Node and window in browsers.
>
> The most useful Node-specific one is process. It gives me process.env for configuration, process.argv for command-line arguments, process.memoryUsage for monitoring, and events like SIGTERM for graceful shutdown.
>
> __dirname and __filename give the current file's folder and path, but they only exist in CommonJS, because Node passes them into its module wrapper function. In ES modules I use import.meta.dirname. And for paths to my own files, I use __dirname, not process.cwd, because cwd depends on where the app was started."

## 🔁 Follow-up questions

### Is `require` a global?

Not really. Like `__dirname`, it is a parameter of the hidden wrapper function Node puts around each CommonJS file. That's why it doesn't exist in ES modules.

### What is the difference between `process.exit()` and `process.exitCode`?

`process.exit(1)` stops the program **immediately**. Pending work, like writing logs, may be lost. `process.exitCode = 1` only sets the code. The program then ends normally when nothing is left to do. This is safer.

### Why are values in `process.env` always strings?

Environment variables come from the operating system, and they are just text. So `process.env.PORT` is `'3000'`, not `3000`. Convert it with `Number(process.env.PORT)`. Also, `'false'` is a string, and any non-empty string is truthy!

### Are `setTimeout` and `fetch` part of JavaScript itself?

No. They are given by the environment (the browser or Node), not by the JavaScript language. Node added `fetch` as a global in version 18.

## ✅ Quick check

### 1. You run `node app.js build --watch`. What is `process.argv.slice(2)`?

:::answer
**`['build', '--watch']`.** `argv[0]` is the node path and `argv[1]` is the script path. Your own words start at index 2.
:::

### 2. In an `.mjs` file, which line gives the current folder?

- A) `__dirname`
- B) `import.meta.dirname`
- C) `process.cwd()`

:::answer
**B) `import.meta.dirname`.** `__dirname` doesn't exist in ES modules. `process.cwd()` gives the folder you ran the command from, which may be different.
:::

### 3. `process.env.DEBUG` is `'false'`. What does `if (process.env.DEBUG)` do?

:::answer
It **runs the `if` block**, because `'false'` is a non-empty string, and non-empty strings are truthy. Compare it properly: `process.env.DEBUG === 'true'`.
:::
