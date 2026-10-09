---
title: Modern Node features (built-in fetch, test runner, --watch, running TypeScript)
stack: nodejs
order: 31
level: Intermediate
mustKnow: false
askedFrequency: sometimes
summary:
  - Modern Node has many tools built in, so you need fewer npm packages.
  - "fetch is built in (no axios or node-fetch needed). node:test + node --test is a built-in test runner."
  - "node --watch restarts on file changes (like nodemon). node --env-file=.env loads environment variables (like dotenv)."
  - Node can run .ts files directly by stripping the types — but it does NOT type-check. You still run tsc for checking.
  - "Other useful ones: the permission model (--permission), node --run for package.json scripts, and require() of ES modules."
cards:
  - q: Do you still need axios or node-fetch in modern Node?
    a: Not for basic HTTP calls. fetch is built in and stable. Teams may still use axios for interceptors and other conveniences.
  - q: What is node:test?
    a: Node's built-in test runner. You write tests with test() / describe() and assert, and run them with node --test.
  - q: What do --watch and --env-file replace?
    a: --watch replaces nodemon (restart on file change). --env-file=.env replaces dotenv for loading environment variables.
  - q: When Node runs a .ts file directly, does it check your types?
    a: No. It only removes the type annotations (type stripping). Type errors are not reported, so you still run tsc --noEmit in CI.
  - q: Which TypeScript features don't work with Node's type stripping?
    a: Features that create JavaScript code, like enums, namespaces with values and constructor parameter properties. Only "erasable" syntax works.
---

## 💡 What is it?

For years, every Node project installed the same helper packages. `node-fetch` to call APIs. `jest` or `mocha` to test. `nodemon` to restart on changes. `dotenv` for `.env` files. `ts-node` to run TypeScript.

**Modern Node has most of these built in.** You can call APIs, run tests, watch files, load `.env` files and even run TypeScript files with plain `node`.

Fewer packages means fewer updates, fewer security risks and faster installs.

## 🏠 Real-life example

Think of an **old mobile phone vs a new smartphone**.

With an old phone, you carried many things: a separate camera, a torch, a calculator, an alarm clock and a music player.

A new smartphone has **all of these built in**. You still *can* buy a professional camera when you need something special. But for everyday use, the built-in one is enough.

- **The old phone + many gadgets** = old Node + many npm packages.
- **The smartphone** = modern Node.
- **Built-in camera** = `fetch`.
- **Built-in alarm** = `--watch` (it "wakes up" your app when files change).
- **Built-in calculator** = `node:test`.
- **The professional camera** = packages like Jest or axios, still useful for special needs.

## 🧑‍💻 Code example

Make a folder. Save this as `math.test.js`. Run it with `node --test`.

```js
const { test } = require('node:test');               // the built-in test function (no Jest needed)
const assert = require('node:assert/strict');        // built-in checks; "strict" means === style comparison

function add(a, b) {                                 // the small function we want to test
  return a + b;                                      // give back the sum
}                                                    // end of add

test('adds two numbers', () => {                     // a test with a name, and the code to run
  assert.equal(add(2, 3), 5);                        // we expect add(2, 3) to be exactly 5
});                                                  // end of the first test

test('fetch is built in', async () => {              // a second test; async because fetch returns a promise
  assert.equal(typeof fetch, 'function');            // fetch exists without installing anything
});                                                  // end of the second test
```

**Output (shortened):**

```text
✔ adds two numbers (0.5ms)
✔ fetch is built in (0.2ms)
ℹ tests 2
ℹ pass 2
ℹ fail 0
```

`node --test` finds files named like `*.test.js` and runs them. You didn't install a single package.

## 🔍 Deeper version

**What's built in now, and what it replaces:**

| Built-in | What it does | Replaces |
|---|---|---|
| `fetch`, `Request`, `Response`, `FormData` | HTTP calls, same API as the browser | `node-fetch`, often `axios` |
| `node:test` + `node --test` | test runner with `describe`, `it`, mocks, coverage | `jest`, `mocha` for simple projects |
| `node --watch app.js` | restart when files change | `nodemon` |
| `node --env-file=.env app.js` | load environment variables from a file | `dotenv` |
| `node app.ts` | run TypeScript by removing the types | `ts-node`, `tsx` (for simple cases) |
| `node --run dev` | run a `package.json` script, faster than `npm run` | — |
| `node --permission` | limit file system, child process and worker access | — |

**Built-in `fetch`.** It is based on **undici**, a fast HTTP client by the Node team. It reuses connections (keep-alive) automatically. It doesn't throw on 404 or 500 — you must check `res.ok`. For a timeout, pass `signal: AbortSignal.timeout(5000)`.

**`node:test`.** It supports `describe`/`it`, `before`/`after` hooks, `mock.fn()` and mock timers. Add `--experimental-test-coverage` for coverage. For big projects with many existing Jest tests, Jest is still common. For new small services, the built-in runner is often enough.

**Running TypeScript directly ("type stripping").** Node removes the type annotations and runs the JavaScript that's left. Important limits:
- It **does not type-check**. Wrong types won't cause an error. Keep `tsc --noEmit` in CI.
- Only **erasable** syntax works. "Erasable" means the type can be deleted and the JavaScript still works. **Enums**, **namespaces with code** and **constructor parameter properties** generate real JavaScript, so they need the `--experimental-transform-types` flag or a build step.
- Imports must use the real file extension, e.g. `import { x } from './utils.ts'`.
- It doesn't read `tsconfig.json` (so `paths` aliases don't work).
- In TypeScript 5.8+, the `erasableSyntaxOnly` option warns you about code Node can't strip.

**`require()` of ES modules.** Modern Node lets CommonJS code `require()` an ES module (if it doesn't use top-level `await`). This removes a lot of old CommonJS vs ESM pain. See [CommonJS vs ESM](topic:nodejs/commonjs-vs-esm).

**The permission model.** `node --permission --allow-fs-read=./data app.js` lets the app read only the `./data` folder. Other file access, child processes and workers are blocked unless allowed. It's a safety net, not a full sandbox.

:::version[Version note]
- `fetch`: on by default since **Node 18**, marked stable in **Node 21**.
- `node:test`: added in **Node 18**, stable since **Node 20**.
- `--watch`: added in **Node 18.11**, stable in **Node 22**.
- `--env-file`: added in **Node 20.6**.
- Running `.ts` files without a flag: **Node 23.6+** and **22.18+**, so it works in **Node 24 LTS**. Earlier versions needed `--experimental-strip-types`.
- The permission model started as `--experimental-permission` in **Node 20**. Current versions use `--permission`.
:::

## 🎯 Why do we use it?

- **Fewer dependencies.** Every package is code you must update and trust. Fewer packages means a smaller attack surface.
- **Faster setup.** A new script or small service can start with zero installs.
- **Standard APIs.** `fetch`, `URL`, `AbortController` and `structuredClone` work the same in the browser and in Node. You learn them once.
- **Interviews.** Knowing what's built in shows you keep up with the platform.

## ⚠️ Common mistakes

- **Thinking Node's TypeScript support checks types.** It only strips them. Bugs pass silently unless you run `tsc`.
- **Using enums with type stripping.** They fail without `--experimental-transform-types`. Use string unions or `as const` objects instead.
- **Forgetting `res.ok` with `fetch`.** A 500 response does not throw an error.
- **Committing `.env` because "Node reads it now".** `--env-file` changes nothing about safety. Keep `.env` out of Git.

## 🗣️ How to answer in an interview

> "Modern Node has a lot built in that used to need packages. fetch is built in and stable, so for simple HTTP calls I don't need node-fetch or even axios. There's a built-in test runner, node:test, run with node --test. node --watch replaces nodemon, and --env-file replaces dotenv for loading environment variables.
>
> Node can also run TypeScript files directly now. But it only strips the types. It doesn't type-check, and it only supports erasable syntax, so no enums or parameter properties without an extra flag. In a real project, I'd still run tsc in CI, and usually still have a build step.
>
> Using built-ins means fewer dependencies to maintain and fewer supply-chain risks. For bigger projects, tools like Jest or axios are still fine when we need their extra features."

[FILL IN: which of these you actually use at SkillKeepr — e.g. Jest for tests (on your resume), nodemon or --watch, dotenv. Only add what is true.]

## 🔁 Follow-up questions

### Should you replace Jest with node:test in an existing project?

Usually not right away. Jest has a big ecosystem, snapshot testing and your team knows it. Migrating hundreds of tests costs time. For new, small services, node:test is a good, lightweight choice.

### How do you add a timeout to built-in fetch?

Pass an abort signal: `fetch(url, { signal: AbortSignal.timeout(5000) })`. After 5 seconds, the request is cancelled and the promise rejects with a timeout error.

### What's the difference between type stripping and compiling with tsc?

Type stripping only deletes the types and runs the rest. It's fast, but it checks nothing. `tsc` checks every type, reports errors, and can turn TypeScript features (like enums) and new syntax into JavaScript that older targets understand.

### Is `--env-file` a full replacement for dotenv?

For loading a `.env` file at startup, yes. Since Node 21.7, you can also call `process.loadEnvFile()` from code. dotenv still has extra features in its ecosystem, like variable expansion helpers.

## ✅ Quick check

### 1. You run `node app.ts` and the file has `let age: number = 'twenty';`. What happens?

:::answer
**It runs.** Node removes `: number` and runs `let age = 'twenty';`. Type stripping doesn't check types. Only `tsc` would report the error.
:::

### 2. Which built-in flag replaces nodemon?

- A) `--inspect`
- B) `--watch`
- C) `--env-file`

:::answer
**B) `--watch`.** It restarts the app when your files change.
:::

### 3. True or false: built-in `fetch` throws an error when the server returns 500.

:::answer
**False.** `fetch` only rejects on network errors. For 4xx and 5xx responses, check `res.ok` or `res.status` yourself.
:::
