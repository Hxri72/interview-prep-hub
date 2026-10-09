---
title: tsconfig.json and strict mode
stack: typescript
order: 18
level: Basic
mustKnow: false
askedFrequency: common
summary:
  - tsconfig.json is the settings file for TypeScript. It says which files to check and how strict to be.
  - '"strict": true turns on a family of safety checks. The most useful are noImplicitAny and strictNullChecks.'
  - strictNullChecks makes you handle null and undefined, which removes the most common runtime crash.
  - Useful extras beyond strict include noUncheckedIndexedAccess (arr[i] may be undefined).
  - New projects should start strict. Old projects can turn checks on one by one.
cards:
  - q: What is tsconfig.json?
    a: The settings file for the TypeScript compiler. It lists which files to check, which JavaScript version to output, how modules work, and how strict the checks are.
  - q: 'What does "strict": true do?'
    a: It turns on all the strict-family checks at once, like noImplicitAny, strictNullChecks, strictFunctionTypes and useUnknownInCatchVariables.
  - q: What does strictNullChecks catch?
    a: Using a value that might be null or undefined without checking it first, like found.name when found may be undefined.
  - q: What does noImplicitAny catch?
    a: Variables or parameters with no type that TypeScript can't work out. Without it, they silently become any and lose all checking.
  - q: How do you move an old JavaScript-style project to strict mode?
    a: Turn the checks on one at a time, fix the errors in small pull requests, and use // @ts-expect-error only as a short-term marker.
---

## 💡 What is it?

`tsconfig.json` is the **settings file** for TypeScript. It sits in the root of the project.

It tells the TypeScript [compiler](glossary:compiler) which files to check and **how strict to be**.

The most important setting is `"strict": true`. It switches on all the main safety checks.

## 🏠 Real-life example

Think of the **rule sheet for a school exam**.

- The **rule sheet** = `tsconfig.json`.
- **"Which subjects are in this exam?"** = `include` (which files to check).
- **"Calculators not allowed"** = one strict rule, like `noImplicitAny`.
- **"Strict exam mode: all rules on"** = `"strict": true`.
- A **relaxed class test** = a project with strict off. It's easier, but more mistakes slip through.

Same students, same questions. The rule sheet decides how many mistakes get caught.

## 🧑‍💻 Code example

Make a folder with these two files. Run `npm install -D typescript @types/node`, then run `npx tsc` to check the code.

**tsconfig.json**

```json
{
  "compilerOptions": {                  // all compiler settings go inside here
    "target": "ES2022",                 // which JavaScript version to output
    "module": "nodenext",               // how imports/exports work (Node's modern rules)
    "strict": true,                     // turn ON all the safety checks
    "noEmit": true,                     // only check types, don't write .js files
    "noUncheckedIndexedAccess": true,   // arr[i] might be undefined → make me check
    "types": ["node"]                   // load Node's built-in types
  },                                    // end of compilerOptions
  "include": ["*.ts"]                   // check every .ts file in this folder
}
```

**app.ts**

```ts
function greet(name) {                                  // no type on name → strict says "implicit any"
  return 'Hello ' + name;                               // joins text with the name
}                                                       // end of greet

function findCandidate(id: string): { name: string } | undefined { // may return undefined
  return id === 'c1' ? { name: 'Asha' } : undefined;    // only c1 exists
}                                                       // end of findCandidate
const found = findCandidate('c2');                      // found could be undefined
console.log(found.name);                                // strict: "found is possibly undefined"

const scores = [80, 92];                                // a list of numbers
const third: number = scores[2];                        // noUncheckedIndexedAccess: this may be undefined
console.log(greet('Hari'), third);                      // use the values so nothing is "unused"
```

**Output of `npx tsc`:**

```text
app.ts(1,16): error TS7006: Parameter 'name' implicitly has an 'any' type.
app.ts(9,13): error TS18048: 'found' is possibly 'undefined'.
app.ts(12,7): error TS2322: Type 'number | undefined' is not assignable to type 'number'.
  Type 'undefined' is not assignable to type 'number'.
```

With `"strict": false`, the first two errors disappear. The code would then crash at runtime on `found.name`.

## 🔍 Deeper version

**What `strict: true` switches on.** It's a shortcut for a family of flags. The important ones:

| Flag | What it catches |
|---|---|
| `noImplicitAny` | Parameters or variables that silently become `any` |
| `strictNullChecks` | Using a value that may be `null` or `undefined` |
| `strictFunctionTypes` | Unsafe function parameter types in callbacks |
| `strictPropertyInitialization` | Class fields that are never given a value |
| `useUnknownInCatchVariables` | `catch (err)` gives `unknown`, not `any`, so you must check it |
| `noImplicitThis` | `this` with an unknown type |
| `alwaysStrict` | Emits `"use strict"` in every file |

New strict-family flags added in later versions turn on automatically. That's why upgrading TypeScript can show new errors.

**Useful flags *not* included in `strict`:**
- `noUncheckedIndexedAccess`: `arr[i]` and `obj[key]` may be `undefined`. Very good for backend code.
- `exactOptionalPropertyTypes`: `email?: string` means "missing", not "can be set to `undefined`".
- `noFallthroughCasesInSwitch` and `noUnusedLocals`: catch common slips.

**Other settings you'll see often:**
- `target`: which JavaScript version to output, for example `ES2022`.
- `module` / `moduleResolution`: how imports are resolved. `nodenext` for Node, `bundler` for Vite and webpack apps.
- `jsx`: `react-jsx` for React 17+.
- `paths`: import aliases like `@services/*`. The bundler and Jest must use the **same** aliases, or the build passes but tests fail.
- `noEmit`: only type-check. Vite or esbuild does the real build.
- `skipLibCheck`: skip checking `.d.ts` files in `node_modules` (faster).

:::version[Version note]
**TypeScript 7** (2026) is a new, much faster compiler written in Go. It's the same language and the same `tsconfig.json`. A few very old options were removed, like `target: ES5` and `moduleResolution: node`. Node.js 22.18+ and 24 can also **run** `.ts` files directly by removing the types, but they **don't type-check**. You still need `tsc` for the checks.
:::

**Migrating an old project to strict.** Turn on one flag at a time, `noImplicitAny` first and `strictNullChecks` second. Fix the errors module by module. Use `// @ts-expect-error` only as a temporary marker. It fails the build once the error is gone, so it can't be forgotten.

## 🎯 Why do we use it?

- **One place for the rules**, shared by the whole team and by CI.
- **Strict mode catches the most common JavaScript crash**: "cannot read properties of undefined".
- It makes refactoring safer: change a type, and every wrong use turns red.
- The editor uses the same settings, so autocomplete and red lines match what CI checks.

## ⚠️ Common mistakes

- **Starting a new project with `strict: false`** "to go faster". You pay for it later in bugs.
- **Thinking Node or Vite checks types.** Running `.ts` with Node 24, or building with Vite, only **removes** types. Run `tsc --noEmit` in CI.
- **Aliases in `paths` but not in the bundler or Jest.** The editor is happy, but tests fail with "cannot find module".
- **Silencing errors with `any` or `// @ts-ignore`** instead of fixing them.

## 🗣️ How to answer in an interview

> "tsconfig.json is the settings file for the TypeScript compiler. It says which files to check, which JavaScript version to output, how modules resolve, and how strict to be.
>
> I always use `strict: true`. It turns on checks like noImplicitAny and strictNullChecks. strictNullChecks is the most valuable one, because it forces me to handle null and undefined, which removes the most common runtime crash. For backend code I also like noUncheckedIndexedAccess, so array lookups are treated as possibly undefined.
>
> One thing I keep in mind is that build tools like Vite, or Node running .ts files directly, only strip types. So I run `tsc --noEmit` in CI to actually check them."

[FILL IN: how strict the tsconfig is in your SkillKeepr services, if you know — e.g. "strict is on in the services I work on".]

## 🔁 Follow-up questions

### What is the difference between `noEmit` and a normal build?

With `noEmit`, `tsc` only checks types and writes no files. Another tool, like Vite, esbuild or the Serverless webpack plugin, produces the JavaScript. This split is common because those tools are faster at building.

### What does `skipLibCheck` do, and is it safe?

It skips type-checking `.d.ts` files, mostly the ones in `node_modules`. It makes builds faster and avoids errors from mismatched library types. Your own code is still checked, so most teams turn it on.

### Why does `catch (err)` give `unknown` in strict mode?

Anything can be thrown, not just `Error` objects. `unknown` forces you to check, for example `if (err instanceof Error) console.log(err.message)`, before you use it.

### How do you share settings across many packages?

Put the common settings in a base file. Each package then uses `"extends": "../tsconfig.base.json"` and adds only its own settings, like `jsx` for the UI.

## ✅ Quick check

### 1. With `strict: true`, which line is an error?

```ts
const list = ['a', 'b'];                         // an array of strings
const user = list.find((x) => x === 'c');        // find may return undefined
console.log(user.toUpperCase());                 // ?
```

:::answer
**The last line.** `find` returns `string | undefined`, and strictNullChecks says `user` is possibly undefined. Check it first: `if (user) ...`.
:::

### 2. True or false: running `node app.ts` on Node 24 reports type errors.

:::answer
**False.** Node only strips the types and runs the JavaScript. You need `tsc` (or `tsc --noEmit`) to find type errors.
:::

### 3. Which flag makes `scores[5]` have the type `number | undefined`?

- A) `strict`
- B) `noUncheckedIndexedAccess`
- C) `noImplicitAny`

:::answer
**B.** It is **not** part of `strict`. You turn it on separately.
:::
