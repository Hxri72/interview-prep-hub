---
title: How TypeScript becomes JavaScript
stack: web-fundamentals
order: 15
level: Basic
mustKnow: false
askedFrequency: common
summary:
  - "Browsers and Node only run JavaScript. TypeScript must become JavaScript first."
  - "tsc does two separate jobs: it checks types, and it writes (emits) JavaScript. The types are simply deleted in the output."
  - "Fast tools (esbuild, SWC, Oxc, Node 24 type stripping) only delete types. They never check them, so a type error still runs."
  - "That's why real projects run `tsc --noEmit` separately (in CI or before build) as the safety check."
  - "`target` decides how modern the output JavaScript is. `declaration: true` also writes .d.ts files that describe your types for other code."
cards:
  - q: What two jobs does tsc do?
    a: It type-checks your code, and it emits JavaScript. They are separate. With --noEmit it only checks.
  - q: What happens to types when TypeScript is compiled?
    a: They are erased. The output JavaScript has no types at all, so types never exist at run time.
  - q: Why does a TypeScript file with a type error still run with esbuild or node file.ts?
    a: Those tools only strip types for speed. They don't type-check. You need tsc --noEmit to catch the error.
  - q: What does the target option change?
    a: How modern the output JavaScript is. With an older target, tsc rewrites new syntax like ?? into older code that does the same thing.
  - q: What is a .d.ts file?
    a: A file with only type information (no code). Libraries ship it so your editor and tsc know their types.
---

## 💡 What is it?

Browsers and Node.js can only run **JavaScript**. They can't read TypeScript.

So before your TypeScript code runs, a tool turns it into JavaScript. This step is called **compiling** (or transpiling — see [compiler](glossary:compiler)).

The surprising part: the main job is just **deleting the types**. The types help you while coding, then they disappear.

## 🏠 Real-life example

Think of a **teacher checking an exam paper**, and a **photocopy shop**.

- The **teacher (tsc type-check)** reads every answer carefully and marks mistakes in red. This is slow but careful.
- The **photocopy shop (esbuild / Node's type stripping)** just copies the paper fast. It removes the teacher's notes in the margin. It does **not** check if the answers are right.
- The **margin notes** = your types. They are useful while studying, but they are not part of the final copy.
- A school that only uses the photocopy shop sends out wrong answers quickly. A good school does **both**: the fast copy for daily use, and the teacher's check before results go out.

## 🧑‍💻 Code example

Make a folder, then run `npm init -y` and `npm install -D typescript`. Save this as `price.ts`.

```ts
type Job = { title: string; salary: number }; // a Job must have a title (text) and a salary (number)

function withBonus(job: Job): number { // takes a Job, gives back a number
  return job.salary + 5000; // salary plus a 5000 bonus
} // end of withBonus

const dev: Job = { title: 'MERN Developer', salary: '50000' }; // BUG: salary is text '50000', not the number 50000
console.log(withBonus(dev)); // print salary + bonus
```

Add a tiny `tsconfig.json` (settings file) next to it:

```json
{ "compilerOptions": { "strict": true, "target": "es2022", "module": "esnext", "outDir": "dist" }, "files": ["price.ts"] }
```

Now run the four tools and compare:

```bash
npx tsc --noEmit   # job 1 only: check types, write nothing
node price.ts      # Node 24: strip types and run (no checking)
npx tsc            # job 1 + job 2: check, then write dist/price.js
npx esbuild price.ts # fast tool: strip types only, print the JavaScript
```

Real output:

```text
$ npx tsc --noEmit
price.ts(7,45): error TS2322: Type 'string' is not assignable to type 'number'.

$ node price.ts
500005000

$ npx tsc
price.ts(7,45): error TS2322: Type 'string' is not assignable to type 'number'.

$ npx esbuild price.ts
"use strict";
function withBonus(job) {
  return job.salary + 5e3;
}
const dev = { title: "MERN Developer", salary: "50000" };
console.log(withBonus(dev));
```

**What to notice:**
- `tsc --noEmit` **caught the bug** before the code ran.
- Plain `npx tsc` reported the same error, but **still wrote** `dist/price.js`. That's the default.
- `node price.ts` **ran the bug** and printed `500005000`. JavaScript joined the text `'50000'` with `5000` instead of adding them.
- The esbuild output has **no types left**. `type Job`, `: Job` and `: number` are simply gone.

## 🔍 Deeper version

**tsc has two separate jobs.**

| Job | What it does | Flag |
|---|---|---|
| Type-check | Reads all files together and finds type errors | always (unless you skip tsc) |
| Emit | Writes `.js` (and optionally `.d.ts`) files | turn off with `--noEmit` |

By default, `tsc` writes the JavaScript **even when there are type errors**. Add `"noEmitOnError": true` if you want it to stop.

**Type erasure.** "Erasure" means the types are deleted. Nothing about `Job` exists in the output. This is why you can't do `if (x instanceof Job)` for a `type`. It's also why data from outside (API requests, AI replies) still needs **run-time** checks, like Zod or Joi. See [TypeScript basics](topic:typescript/what-is-typescript).

**`target` changes the output syntax.** "Target" is the JavaScript version you want to produce. Here is the same line compiled twice (real output):

```js
// source: export const cityOf = (u: User): string => u.city ?? 'unknown';

// target: es2019 (?? did not exist yet, so tsc rewrites it)
export const cityOf = (u) => { var _a; return (_a = u.city) !== null && _a !== void 0 ? _a : 'unknown'; };

// target: es2022 (?? is allowed, so it stays)
export const cityOf = (u) => u.city ?? 'unknown';
```

`module` decides the import style in the output: `esnext` keeps `import/export`, while `commonjs` turns them into `require`.

:::version[Version note]
TypeScript 7 (the new fast compiler written in Go) **removed** `target: "es5"`. Using it gives `error TS5108: Option 'target=ES5' has been removed`. Very old browsers now need a separate tool like Babel. See [tsconfig and strict mode](topic:typescript/tsconfig-strict).
:::

**`.d.ts` files.** With `"declaration": true`, tsc also writes a **declaration file**. It holds only types, no code (real output):

```ts
export interface User {          // the shape, kept for other projects
    name: string;                // a required field
    city?: string;               // an optional field
}                                // end of User
export declare const cityOf: (u: User) => string; // "this function exists", but no body
```

Libraries publish `.d.ts` files so your editor knows their types.

**Strip-only tools.** These tools skip the slow checking part:

| Tool | Where you meet it | Checks types? |
|---|---|---|
| Oxc | inside Vite 8 (dev and build) | No |
| esbuild | Vite 7 and older, many build scripts | No |
| SWC | Next.js, some Vite setups | No |
| Babel (`@babel/preset-typescript`) | older webpack setups | No |
| Node 24 type stripping | `node file.ts` | No |
| `tsc` | CI, `npm run build` scripts | **Yes** |

Strip-only tools treat each file alone, so they are very fast. But they can't see types across files. That's why a normal setup is: **fast tool for running, `tsc --noEmit` for checking**. This project does exactly that: `"build": "tsc --noEmit && vite build"`.

Node's type stripping only removes "erasable" syntax. Features that create real code, like `enum`, fail with `ERR_UNSUPPORTED_TYPESCRIPT_SYNTAX`. See [modern Node features](topic:nodejs/modern-node-features).

## 🎯 Why do we use it?

- You get type safety **while writing** code, with red lines in the editor.
- The final app stays **plain, fast JavaScript** with no type overhead at run time.
- You can choose **how modern** the output is, to match the browsers or Node version you support.
- Splitting "check" and "build" keeps the dev server fast, while CI still blocks type errors.

## ⚠️ Common mistakes

- **Thinking `vite dev` or `node file.ts` checks types.** They don't. Run `tsc --noEmit` in CI or before every build.
- **Expecting types at run time.** Types are erased. Validate outside data with Zod or Joi.
- **Using `enum` with Node's type stripping.** It isn't erasable syntax, so Node refuses to run it. Use a string union.
- **Ignoring tsc errors because "the build still worked".** By default tsc still emits files. Turn on `noEmitOnError`, or make CI fail on errors.

## 🗣️ How to answer in an interview

> "TypeScript doesn't run anywhere directly. It's compiled to JavaScript, and the types are erased in that step. tsc does two separate jobs: it type-checks the whole project, and it emits JavaScript. The target option decides how modern the output is, so with an older target it rewrites things like the nullish operator.
>
> In practice, we don't use tsc to run code during development, because it's slow. Tools like esbuild, SWC or Node's built-in type stripping just delete the types per file, which is very fast but doesn't check anything. So the standard setup is: a fast tool for the dev server and build, plus `tsc --noEmit` in CI or the build script as the real type check. And because types are gone at run time, I still validate external input with something like Joi or Zod."

[FILL IN: how TypeScript was compiled in your SkillKeepr projects — e.g. through webpack with a loader, or a type-check script before deploy. Only if you know.]

## 🔁 Follow-up questions

### If types are erased, why is TypeScript worth it?

Most bugs are caught **before** the code runs, in the editor and in CI. Refactoring is safer, because every wrong use turns red. And types act as documentation for the next developer.

### What is the difference between transpiling and compiling?

People use both words. "Transpiling" usually means turning one high-level language into another at the same level, like TypeScript into JavaScript. "Compiling" is the general word. tsc calls itself a compiler.

### Why is esbuild so much faster than tsc?

It skips type checking, handles each file on its own, and is written in Go and runs in parallel. tsc must load the whole project to understand types across files. (TypeScript 7 is also written in Go now, which makes tsc much faster too.)

### What does `isolatedModules` do?

It makes tsc warn about code that a per-file tool (esbuild, SWC, Babel) can't compile safely. For example, re-exporting a type without `export type`. Turn it on when a fast tool builds your code.

## ✅ Quick check

### 1. You run `node app.ts` on Node 24. The file has a type error. What happens?

:::answer
**It runs anyway.** Node only strips types and never checks them. Only `tsc` (or your editor) reports type errors.
:::

### 2. What does `tsc --noEmit` do?

- A) Compiles but writes no output files, and doesn't check types
- B) Checks types and writes no output files
- C) Writes JavaScript without checking types

:::answer
**B.** `--noEmit` turns off job 2 (writing files) and keeps job 1 (checking types).
:::

### 3. In the compiled JavaScript, what is left of `type Job = { title: string }`?

:::answer
**Nothing.** Type aliases and interfaces are completely erased. They exist only while coding.
:::
