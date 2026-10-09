---
title: any, unknown, void and never
stack: typescript
order: 4
level: Basic
mustKnow: true
askedFrequency: very common
summary:
  - "any turns type checking off: everything is allowed, so bugs slip through. Avoid it."
  - unknown means "could be anything, so check before you use it". It's the safe choice for JSON and API data.
  - void means a function returns nothing useful.
  - never means "this can never happen" — a function that always throws, or an impossible case.
  - "Use never for exhaustive checks: if someone adds a new status and forgets to handle it, TypeScript shows an error."
cards:
  - q: any vs unknown?
    a: any turns off checking, so you can do anything with it. unknown forces you to check the type before using it, so it's safe.
  - q: What is void?
    a: The return type of a function that doesn't return a useful value, like a logger.
  - q: What is never?
    a: A type with no possible values. Used for functions that always throw or never finish, and for impossible cases in exhaustive checks.
  - q: What type should JSON.parse results or API data have?
    a: unknown, then narrow or validate it (e.g. with Zod) before use.
  - q: How does never help with a switch over a union?
    a: "In the default branch, assign the value to a never variable. If a new union member isn't handled, it isn't never any more, so TypeScript reports an error."
---

## 💡 What is it?

These are four **special types**. Each one answers a different question.

- **`any`** = "turn off checking". Anything goes.
- **`unknown`** = "it could be anything, so **check first**".
- **`void`** = "this function returns nothing useful".
- **`never`** = "this can **never** happen".

## 🏠 Real-life example

Think of **parcels arriving at a school office**.

- **`any`** = a parcel the office opens and uses **without checking**. If it holds the wrong thing, there's a mess later.
- **`unknown`** = a parcel with **no label**. The rule is: open it and check what's inside **before** using it.
- **`void`** = a teacher who goes to drop a letter at the post office and **brings nothing back**. The trip is the whole point.
- **`never`** = a "**lost and found for students from the year 3000**" box. Nothing can ever go in it. If something shows up there, something is very wrong.

## 🧑‍💻 Code example

Save this as `unknown.ts`. Run it with `node unknown.ts`.

```ts
const text = '{"name":"Hari","years":3}';           // JSON text, e.g. from an API
const data: unknown = JSON.parse(text);             // unknown = "could be anything; check first"

if (typeof data === 'object' && data !== null && 'name' in data) { // check it is an object with a name
  console.log('Name:', data.name);                  // allowed now: TS knows data has a name
}                                                   // end of the check

function logMessage(msg: string): void {            // void = this function returns nothing useful
  console.log('LOG:', msg);                         // just prints
}                                                   // end of logMessage

function fail(msg: string): never {                 // never = this function never finishes normally
  throw new Error(msg);                             // it always throws
}                                                   // end of fail

logMessage('started');                              // LOG: started
try { fail('boom'); } catch (e) { console.log('Caught:', (e as Error).message); } // Caught: boom
```

**Output:**

```text
Name: Hari
LOG: started
Caught: boom
```

Now compare `any` and `unknown`:

```ts
const a: any = JSON.parse('{"name":"Hari"}');      // any: no checks at all
a.nmae.toUpperCase();                               // typo! TypeScript says nothing...
const u: unknown = JSON.parse('{"name":"Hari"}');  // unknown: must check first
u.name;                                             // TypeScript stops you here
```

`npx tsc --noEmit` only complains about the `unknown` line:

```text
unknown-err.ts(4,1): error TS18046: 'u' is of type 'unknown'.
```

But the `any` line crashes when it runs:

```text
TypeError: Cannot read properties of undefined (reading 'toUpperCase')
```

## 🔍 Deeper version

| Type | You can assign it... | You can use it... | Use it for |
|---|---|---|---|
| `any` | anything | in any way, no checks | almost never (old code, quick migration) |
| `unknown` | anything | only after you check (narrow) it | JSON, API data, `catch (e)` errors |
| `void` | (function return) | — | functions that return nothing |
| `never` | nothing | — | functions that always throw, impossible cases |

**`any` spreads.** If a value is `any`, everything you get from it is also `any`. One `any` can quietly turn off checking for a whole chain of code. With `"strict": true`, TypeScript stops **implicit** `any`, like an untyped parameter. You can still write `any` on purpose.

**`unknown` with narrowing.** You make `unknown` usable by checking it: `typeof`, `instanceof`, `'field' in obj`, or a validation library. In real apps, a schema validator does this best:

```ts
import { z } from 'zod';                            // a runtime validation library
const Candidate = z.object({ name: z.string() });   // the shape we expect
const candidate = Candidate.parse(data);            // throws if data doesn't match; now fully typed
```

See [Zod](topic:typescript/zod) and [type narrowing](topic:typescript/narrowing).

**Errors in `catch` are `unknown`.** With `strict` (the `useUnknownInCatchVariables` setting), `catch (e)` gives `e: unknown`. Anything can be thrown in JavaScript, not only `Error` objects. So check first: `if (e instanceof Error) console.log(e.message)`.

**`void` in callbacks.** A callback typed `() => void` may still return a value; the caller just ignores it. That's why `arr.forEach(x => list.push(x))` is fine, even though `push` returns a number.

**`never` for exhaustive checks.** This is a favourite interview trick:

```ts
type Status = 'applied' | 'shortlisted' | 'rejected' | 'hired'; // 'hired' was added later
function label(s: Status): string {                // turns a status into a label
  switch (s) {                                      // handle each status
    case 'applied': return 'New';                   // case 1
    case 'shortlisted': return 'Shortlisted';       // case 2
    case 'rejected': return 'Rejected';             // case 3 — but no case for 'hired'!
    default: {                                      // anything not handled above lands here
      const check: never = s;                       // only allowed if nothing is left over
      return check;                                 // never runs if all cases are handled
    }                                               // end of default
  }                                                 // end of switch
}                                                   // end of label
```

```text
never.ts(8,13): error TS2322: Type '"hired"' is not assignable to type 'never'.
```

TypeScript tells you exactly which case you forgot.

## 🎯 Why do we use it?

- **`unknown`** keeps outside data safe. You must check it before you trust it.
- **`void`** makes it clear a function is called for its effect, not its result.
- **`never`** turns "I forgot a case" into a compile error instead of a production bug.
- **Avoiding `any`** keeps the safety TypeScript gives you.

## ⚠️ Common mistakes

- **Using `any` to silence an error.** It hides the bug instead of fixing it. Use `unknown` and narrow it.
- **Typing API responses as `any`.** Use `unknown` plus validation, or a typed client.
- **Assuming `catch (e)` is an `Error`.** It is `unknown`. Check with `instanceof Error`.
- **Mixing up `void` and `undefined`.** `void` is for function returns. For a value that may be missing, use `undefined` in a union.

## 🗣️ How to answer in an interview

> "any turns type checking off for that value, so mistakes slip through, and it spreads to everything that touches it. I avoid it. unknown is the safe version: it can hold anything, but TypeScript makes me check the type before using it. I use unknown for JSON.parse results, API responses and caught errors, and I validate with something like Zod.
>
> void is the return type of a function that returns nothing useful, like a logger. never means something can't happen: a function that always throws, or the leftover case in a switch. I use never for exhaustive checks — if someone adds a new status to a union and forgets to handle it, the build fails."

## 🔁 Follow-up questions

### When is `any` acceptable?

During a gradual migration from JavaScript, or with a badly typed third-party library, as a short-term step. Add a comment and plan to remove it. Prefer `unknown` even then.

### Why is the `catch` variable `unknown`?

Because JavaScript can throw anything: an `Error`, a string, a number. TypeScript can't know which, so it makes you check.

### What is the difference between `void` and `never`?

A `void` function **finishes** and returns nothing useful. A `never` function **never finishes normally** — it always throws, or loops forever.

### How do you make an `unknown` value usable?

Narrow it with `typeof`, `instanceof` or `'key' in obj`, or validate it with a schema library like Zod, which gives you a fully typed value.

## ✅ Quick check

### 1. Does this compile?

```ts
const value: unknown = 'hello';                     // holds text, but typed unknown
console.log(value.toUpperCase());                   // use it directly
```

:::answer
**No.** You must check first: `if (typeof value === 'string') console.log(value.toUpperCase());`
:::

### 2. Does this compile, and does it run?

```ts
const value: any = 42;                              // a number, typed any
console.log(value.toUpperCase());                   // call a string method
```

:::answer
**It compiles** (any turns off checking), but **it crashes at runtime**: `TypeError: value.toUpperCase is not a function`. That's the danger of `any`.
:::

### 3. What is the return type of a function that always throws?

- A) `void`
- B) `undefined`
- C) `never`

:::answer
**C) `never`.** It never returns normally, so no value ever comes out.
:::
