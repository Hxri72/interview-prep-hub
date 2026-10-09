---
title: What TypeScript is and how it compiles to JavaScript
stack: typescript
order: 1
level: Basic
mustKnow: true
askedFrequency: very common
summary:
  - TypeScript is JavaScript plus types. You label your data, and the editor warns you about mistakes before the code runs.
  - Browsers and Node run only JavaScript. The types are removed before the code runs, so types don't exist at runtime.
  - The compiler (tsc) checks types. Build tools and Node 24 can also just strip the types without checking.
  - Main benefits are fewer bugs, safer refactoring, better autocomplete, and types that act as documentation.
  - Because types vanish at runtime, data from outside (API requests, JSON, AI output) still needs runtime validation, e.g. with Zod or Joi.
cards:
  - q: What is TypeScript, in one sentence?
    a: JavaScript with types — you describe your data, and mistakes show up while you code, before the app runs.
  - q: Do TypeScript types exist when the app runs?
    a: No. They are removed when the code is compiled or stripped. Only plain JavaScript runs.
  - q: Does `node file.ts` in Node 24 check your types?
    a: No. Node only strips the types and runs the JavaScript. You still need `tsc --noEmit` (or your editor) to check types.
  - q: Why do teams use TypeScript?
    a: It catches mistakes early, makes refactoring safer, gives better autocomplete, and the types document the code.
  - q: If types vanish at runtime, how do you check data from an API request?
    a: With runtime validation, like Zod or Joi, on every input that comes from outside your code.
---

## 💡 What is it?

**TypeScript** is **JavaScript plus types**. A type is a label that says what kind of data something is. For example, "this is text" or "this is a number".

You write `.ts` files. Your editor checks the labels while you type. If you use something the wrong way, you see a red line **before** you run the code.

Browsers and Node can only run JavaScript. So the types are **removed** before the code runs.

## 🏠 Real-life example

Think of a **school exam with a rough-work check**.

Before you submit your answer sheet, a teacher quickly checks it. She looks for silly mistakes: a wrong unit, a missing answer, a spelling slip. She marks them in red. You fix them. Then you submit the clean sheet. The red marks are not on the final copy.

- **Your answer sheet** = your TypeScript code.
- **The teacher's quick check** = the TypeScript compiler checking types.
- **The red marks** = type errors in your editor.
- **The clean final copy** = the plain JavaScript that actually runs.
- **The red marks are not on the final copy** = types don't exist at runtime.

## 🧑‍💻 Code example

Save this as `hello.ts`. Run it with `node hello.ts` (Node 24 can run `.ts` files directly).

```ts
type Candidate = {                                  // describe the shape of a candidate
  name: string;                                     // name must be text
  experience: number;                               // experience must be a number (years)
};                                                  // end of the type

function introduce(c: Candidate): string {          // takes a Candidate, returns text
  return `${c.name} has ${c.experience} years`;     // build a sentence from the two fields
}                                                   // end of introduce

const hari: Candidate = { name: 'Hari', experience: 3 }; // a value that matches the shape
console.log(introduce(hari));                       // prints the sentence
```

**Output:**

```text
Hari has 3 years
```

Now make a spelling mistake: `console.log(hari.experiance);`. Then run the type checker with `npx tsc --noEmit`:

```text
typo.ts(3,18): error TS2551: Property 'experiance' does not exist on type 'Candidate'. Did you mean 'experience'?
```

In plain JavaScript, this bug would quietly print `undefined`. TypeScript catches it before you run anything.

## 🔍 Deeper version

**How TypeScript runs.** There are two separate jobs:

| Job | What it does | Tool |
|---|---|---|
| **Type checking** | Reads your types and reports mistakes | `tsc` (the TypeScript [compiler](glossary:compiler)), or your editor |
| **Removing types** | Deletes the types so plain JavaScript is left | `tsc`, Vite/esbuild, or Node 24 itself |

Many build tools (like Vite) only **remove** types to stay fast. They don't check them. So teams run `tsc --noEmit` separately, often in CI, to check types. (`--noEmit` means "check only, don't write any files".)

:::version[Version note]
- **Node 24** can run `.ts` files directly (`node file.ts`). It only **strips** the types; it does not check them. A wrong type like `const x: number = 'oops'` still runs and prints `oops`. Features that create real JavaScript, like `enum`, are not supported in this mode (Node throws `ERR_UNSUPPORTED_TYPESCRIPT_SYNTAX`).
- **TypeScript 7** has a new compiler written in Go. It is much faster than the old one written in JavaScript. The TypeScript language you write stays the same.
:::

**`tsconfig.json`** is the settings file. The most important setting is `"strict": true`. It turns on all the safety checks, like forcing you to handle `null` and `undefined`. See [tsconfig and strict mode](topic:typescript/tsconfig-strict).

**Types vanish at runtime.** This is the most important point for interviews. TypeScript trusts what you tell it. If an API sends `{ "age": "twenty" }` and you typed `age` as `number`, TypeScript can't stop it while the app runs. So for any data from outside — request bodies, JSON files, third-party APIs, AI responses — you still need **runtime validation** with a library like Zod or Joi. See [Zod](topic:typescript/zod).

**Structural typing.** TypeScript compares types by **shape**, not by name. If an object has all the fields a type needs, it fits. This is sometimes called "duck typing": if it walks like a duck and quacks like a duck, it is a duck.

## 🎯 Why do we use it?

- **Catch mistakes early.** Typos, wrong arguments and missing fields show up while you type, not in production.
- **Safer refactoring.** Rename a field, and every place that uses it turns red. You fix them all before shipping.
- **Better autocomplete.** The editor knows every field and suggests it.
- **Living documentation.** A function's types tell you what it takes and returns, without reading its body.
- **Teamwork.** On a big codebase, types act as a contract between files and between people.

## ⚠️ Common mistakes

- **Thinking types protect you at runtime.** They don't. Validate outside data with Zod or Joi.
- **Using `any` everywhere** to make red lines go away. That turns off checking. See [any vs unknown](topic:typescript/any-unknown-void-never).
- **Not running the type checker.** Vite and `node file.ts` don't check types. Run `tsc --noEmit` in CI.
- **Turning off `strict`.** You lose most of the safety. Keep `"strict": true`.

## 🗣️ How to answer in an interview

> "TypeScript is JavaScript with a type system. I describe the shape of my data, and the compiler or my editor tells me about mistakes before the code runs. Browsers and Node only run JavaScript, so the types are removed when we compile or strip the code. That means types don't exist at runtime.
>
> The main benefits are fewer bugs, safer refactoring, better autocomplete, and types that document the code. Because types vanish at runtime, I still validate anything coming from outside, like request bodies or third-party responses, with Zod or Joi.
>
> In my work, our React frontends and Node backends are written in TypeScript."

[FILL IN: one real bug TypeScript caught for you at SkillKeepr — only if you have one.]

## 🔁 Follow-up questions

### Is TypeScript a different language from JavaScript?

It is a **superset**. Every valid JavaScript file is also valid TypeScript (with fewer checks). TypeScript only adds types on top. After compiling, it's plain JavaScript.

### Do you need to write types everywhere?

No. TypeScript **infers** many types by itself. For example, `let city = 'Kochi'` is a `string` automatically. You mainly write types for function parameters, return values and object shapes. See [type inference](topic:typescript/type-inference).

### What does `tsc --noEmit` do?

It checks types only and writes no files. Teams use it in CI because the bundler (like Vite) removes types but doesn't check them.

### How do you add TypeScript to an existing JavaScript project?

Add a `tsconfig.json`, rename files from `.js` to `.ts` one by one, and fix the errors as you go. The `allowJs` option lets JavaScript and TypeScript files live together during the move.

## ✅ Quick check

### 1. True or false: if a TypeScript app compiles, a wrong value from an API can't reach your code.

:::answer
**False.** Types are removed at runtime. TypeScript can't check data that arrives while the app runs. You need runtime validation, like Zod or Joi.
:::

### 2. You run `node app.ts` in Node 24. The file contains `const x: number = 'oops'; console.log(x);`. What happens?

- A) A type error, and the program doesn't run
- B) It prints `oops`
- C) It prints `NaN`

:::answer
**B) It prints `oops`.** Node 24 only strips the types; it doesn't check them. Run `tsc --noEmit` to see the type error.
:::

### 3. Which one is the main job of `"strict": true` in `tsconfig.json`?

:::answer
It **turns on all the strong safety checks**, like strict `null`/`undefined` checks, no implicit `any`, and stricter function checks. Most teams keep it on.
:::
