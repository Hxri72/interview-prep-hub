---
title: "Declaration files (.d.ts) and @types packages"
stack: typescript
order: 23
level: Advanced
mustKnow: false
askedFrequency: sometimes
summary:
  - A .d.ts file holds only types — no real code. It describes JavaScript that lives somewhere else.
  - Many npm packages ship their own .d.ts files. For others, the community writes them in @types/<package> (DefinitelyTyped).
  - "If a library has no types at all, write a small declaration yourself: declare module 'lib-name' { … }."
  - .d.ts files are also used to add to existing types, like req.user on Express's Request (declaration merging).
  - "Typing a library wrongly is worse than not typing it: the editor will believe the wrong types."
cards:
  - q: What is a .d.ts file?
    a: A declaration file. It contains only type information (functions, classes, shapes) for JavaScript code that lives in another file or package.
  - q: What are @types packages?
    a: Community-written type definitions published from the DefinitelyTyped project, like @types/express or @types/node, for libraries that don't ship their own types.
  - q: How do you know if a package needs @types?
    a: If its package.json has a "types" (or "typings") field, or a .d.ts file, it already includes types. Otherwise look for @types/<name>.
  - q: What do you do if a library has no types and no @types package?
    a: "Write a small declaration: declare module 'lib-name' with the functions you use. As a quick fix, declare module 'lib-name'; makes it any."
  - q: Should @types packages be dependencies or devDependencies?
    a: Usually devDependencies, because types are only needed while building and checking, not at runtime.
---

## 💡 What is it?

A **declaration file** ends with `.d.ts`. It contains **only types**, no real code.

It tells TypeScript what a piece of JavaScript looks like: which functions exist, what they take, and what they return.

Many libraries are written in plain JavaScript. Their types come from a `.d.ts` file. Either the library ships it, or the community publishes it as an **`@types/...`** [package](glossary:package).

## 🏠 Real-life example

Think of a **menu card in a restaurant**.

- The **kitchen** = the JavaScript code. It does the real work.
- The **menu card** = the `.d.ts` file. It only *describes* each dish and its price. You can't eat the menu.
- **A restaurant that prints its own menu** = a library that ships its own types.
- **A food blogger who writes a menu for a restaurant that has none** = an `@types` package, written by the community.
- **A wrong menu** (says "veg", but the dish is chicken) = wrong types. That's worse than no menu at all.

## 🧑‍💻 Code example

Make a folder with these three files. Run `npm install -D typescript`, add a `tsconfig.json` with `"strict": true` and `"module": "nodenext"`, then check with `npx tsc --noEmit` and run with `node app.ts`.

**salary.js** (plain JavaScript, no types):

```js
// salary.js — plain JavaScript, no types (like an old library)
export function monthlyPay(yearly) {        // takes a yearly salary
  return Math.round(yearly / 12);           // gives back the monthly amount
}                                           // end of monthlyPay
```

**salary.d.ts** (only types):

```ts
// salary.d.ts — ONLY types for salary.js (no real code inside)
export declare function monthlyPay(yearly: number): number; // "this function takes a number and returns a number"
```

**app.ts** (uses it):

```ts
import { monthlyPay } from './salary.js';   // TypeScript finds salary.d.ts next to salary.js
console.log(monthlyPay(1200000));           // 1200000 a year → 100000 a month
console.log(monthlyPay('12 lakh'));         // mistake on purpose: a string, not a number
```

**Output of `npx tsc --noEmit`:**

```text
app.ts(3,24): error TS2345: Argument of type 'string' is not assignable to parameter of type 'number'.
```

**Output of `node app.ts`:**

```text
100000
NaN
```

Thanks to the `.d.ts` file, TypeScript caught the mistake. Without the check, the program quietly prints `NaN`.

## 🔍 Deeper version

**Where types come from** (TypeScript checks in this order):
1. The package's own types: a `"types"` field in its `package.json`, or an `index.d.ts`. Most modern packages, like Zod, Mongoose and Axios, ship their own.
2. `node_modules/@types/<name>`, from the community **DefinitelyTyped** project. For example `@types/express` and `@types/node`.
3. Your own declarations, in a `.d.ts` file in your project.

`@types` packages usually go in **devDependencies**. They're needed to check and build, not to run.

**Writing types for an untyped library:**

```ts
// types/csv-magic.d.ts — a small declaration for a library with no types
declare module 'csv-magic' {                                   // the package name
  export function toRows(text: string): string[][];            // only the functions you actually use
}

// Quick, unsafe escape hatch (everything becomes any):
// declare module 'csv-magic';
```

Make sure the folder is covered by `include` in `tsconfig.json`.

**Global declarations.** Some values exist without an import, like a script-tag library or a variable that the bundler injects. Declare them globally:

```ts
declare const __APP_VERSION__: string;   // injected by the bundler at build time
```

**Declaration merging (augmentation).** A `.d.ts` file can also **add to** existing types:
- `req.user` on Express's `Request`. See [TypeScript with Express](topic:typescript/ts-express).
- Custom environment variables on `ImportMetaEnv` in Vite (`import.meta.env.VITE_API_URL`).
- A custom theme on a UI library's theme type, for example adding custom colour names to Mantine's `MantineThemeColorsOverride`.

**Generating `.d.ts` for your own library.** Set `"declaration": true` in `tsconfig.json`, and `tsc` writes `.d.ts` files next to the JavaScript output. That's how shared packages give types to the apps that use them.

**`skipLibCheck`.** It skips checking `.d.ts` files, which speeds up builds and avoids errors between two libraries' types. Your own `.ts` files are still checked.

## 🎯 Why do we use it?

- **To get types for JavaScript libraries**, so you get autocomplete and checks, not `any`.
- **To describe things TypeScript can't see**, like bundler-injected globals or `import.meta.env`.
- **To extend library types**, like adding `req.user`.
- **To share types** from a library you publish, without shipping TypeScript source.

## ⚠️ Common mistakes

- **Writing a declaration that doesn't match the real code.** TypeScript believes it, so bugs slip through. Keep declarations small and accurate.
- **Installing `@types/x` when `x` already ships types.** The two can conflict. Check the package's `package.json` first.
- **Mismatched versions,** like `express@5` with `@types/express@4`. Keep their major versions aligned.
- **A `.d.ts` file outside `include`,** so TypeScript never sees it.

## 🗣️ How to answer in an interview

> "A .d.ts file is a declaration file. It holds only type information for JavaScript that lives somewhere else, like a menu describing a kitchen.
>
> Most modern packages ship their own types. For older JavaScript libraries, the community publishes types in @types packages from DefinitelyTyped, like @types/express. I install those as dev dependencies and keep their major version aligned with the library.
>
> If a library has no types at all, I write a small `declare module` file with just the functions I use. I also use declaration files for augmentation, like adding `user` to Express's Request type or typing Vite's environment variables. And if I'm building a shared package, I turn on `declaration` so its consumers get types automatically."

## 🔁 Follow-up questions

### What is DefinitelyTyped?

A big open-source GitHub repository of community-written types. Each library's types are published to npm as `@types/<library>`.

### What does `declare` mean?

"This exists somewhere else; I'm only describing its type." It never creates real code. That's why `.d.ts` files contain only `declare` statements and types.

### What's the difference between `declare module 'x' { … }` and `declare module 'x';`?

The first describes the module's exports with real types. The second, the "shorthand", says the module exists but makes everything `any`. That's quick, but unsafe.

### How do you type `import.meta.env` in a Vite app?

Add a `vite-env.d.ts` file and extend `ImportMetaEnv` with your variables, like `readonly VITE_API_URL: string`. Then the editor knows each variable and its type.

## ✅ Quick check

### 1. Where should `@types/express` usually be installed?

- A) `dependencies`
- B) `devDependencies`
- C) Globally with `npm install -g`

:::answer
**B.** Types are only needed while checking and building, not when the app runs.
:::

### 2. True or false: adding a `.d.ts` file changes how the JavaScript runs.

:::answer
**False.** A `.d.ts` file contains only types. It's never run, and it doesn't change the program's behaviour, only what TypeScript checks.
:::

### 3. A library has no types and no `@types` package. What is the quickest **safe** fix?

:::answer
Write a small `declare module 'lib-name' { … }` file with real types for the functions you use. The one-line `declare module 'lib-name';` is quicker, but it makes everything `any`, so it isn't safe.
:::
