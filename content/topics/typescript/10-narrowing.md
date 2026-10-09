---
title: Type narrowing and type guards
stack: typescript
order: 10
level: Intermediate
mustKnow: true
askedFrequency: very common
summary:
  - When a value can be more than one type, TypeScript makes you check which one it is first. This check is called narrowing.
  - "Ways to narrow: `typeof` (basic types), `instanceof` (classes like Error), `'field' in obj`, truthiness checks, and a shared status field."
  - After the check, TypeScript knows the exact type inside that `if` block.
  - "A custom type guard is a function that returns `x is Candidate`. It lets you write your own runtime check."
  - Prefer narrowing over `as` assertions. Narrowing really checks; `as` only silences the compiler.
cards:
  - q: What is type narrowing?
    a: Checking which type a value really is (typeof, instanceof, in, a status field). After the check, TypeScript knows the exact type inside that block.
  - q: When do you use typeof vs instanceof?
    a: "typeof for basic types like string, number and boolean. instanceof for objects made from a class, like Error or Date."
  - q: What is a custom type guard?
    a: "A function whose return type is `value is SomeType`. If it returns true, TypeScript treats the value as SomeType after the call."
  - q: Why do you need narrowing for data typed `unknown`?
    a: unknown means "could be anything", so TypeScript won't let you use it until you prove its type with a check.
  - q: Narrowing vs a type assertion (as)?
    a: Narrowing runs a real check at runtime. An assertion only tells the compiler "trust me" and checks nothing.
---

## 💡 What is it?

Sometimes a value can be **one of several types**. For example, an id can be a `string` **or** a `number`.

TypeScript won't let you use string-only or number-only features until you **check which one it is**. That check is called **narrowing**.

After the check, TypeScript knows the exact type inside that block. A function that does the check for you is called a **[type guard](glossary:type-guard)**.

## 🏠 Real-life example

Think of a **school lost-and-found box**.

Inside there might be a pen, a water bottle or a lunch box. You can't "open the lid" until you know it's a bottle or a lunch box. A pen has no lid.

- The **box** = a value with a union type, like `Pen | Bottle | LunchBox`.
- **Looking at the item** = a check like `typeof`, `instanceof` or `'lid' in item`.
- **"It's a bottle, so I can open the lid"** = TypeScript allowing bottle-only actions inside the `if` block.
- A **teacher who checks items for you** and says "yes, it's a bottle" = a custom type guard function.

## 🧑‍💻 Code example

Save this as `narrowing.ts`. Run it with `node narrowing.ts`.

```ts
class NotFoundError extends Error {}                              // a custom error class for "not found"

type Candidate = { id: string; name: string; email?: string };     // email? = may be missing
type Job = { id: string; title: string };                          // a job has a title, not a name

function formatId(id: string | number): string {                   // id can be text OR a number
  if (typeof id === 'string') return id.toUpperCase();             // here TypeScript knows id is a string
  return `C-${id.toFixed(0)}`;                                     // here it knows id is a number
}                                                                  // end of formatId

function label(item: Candidate | Job): string {                    // item can be a candidate OR a job
  if ('title' in item) return `Job: ${item.title}`;                // 'title' in item → it must be a Job
  return `Candidate: ${item.name}`;                                // otherwise it must be a Candidate
}                                                                  // end of label

function message(err: unknown): string {                           // unknown = could be anything
  if (err instanceof NotFoundError) return '404 ' + err.message;   // instanceof → it's our class
  if (err instanceof Error) return '500 ' + err.message;           // any other Error object
  return '500 unknown error';                                      // not an Error at all
}                                                                  // end of message

function isCandidate(x: unknown): x is Candidate {                 // a custom type guard: returns true/false
  return typeof x === 'object' && x !== null && 'name' in x;       // our own runtime check
}                                                                  // end of isCandidate

function emailDomain(c: Candidate): string {                       // email may be undefined
  if (!c.email) return 'no email';                                 // after this line, email is a string
  return c.email.split('@')[1];                                    // safe: TypeScript knows it exists
}                                                                  // end of emailDomain

console.log(formatId('c-7'), formatId(42));                        // a string id and a number id
console.log(label({ id: 'j1', title: 'Node.js Developer' }));      // a Job
console.log(label({ id: 'c1', name: 'Asha' }));                    // a Candidate
console.log(message(new NotFoundError('candidate missing')));      // our custom error
console.log(message('oops'));                                      // a plain string was thrown
const data: unknown = JSON.parse('{"id":"c2","name":"Ravi"}');      // data from outside is unknown
if (isCandidate(data)) console.log('hello', data.name);            // after the guard, data is a Candidate
console.log(emailDomain({ id: 'c3', name: 'Meera', email: 'meera@mail.com' })); // has an email
```

**Output:**

```text
C-7 C-42
Job: Node.js Developer
Candidate: Asha
404 candidate missing
500 unknown error
hello Ravi
mail.com
```

**Without narrowing**, TypeScript stops you. This line:

```ts
function f(id: string | number) { return id.toUpperCase(); } // no check before using a string method
```

gives this real error:

```text
error TS2339: Property 'toUpperCase' does not exist on type 'string | number'.
  Property 'toUpperCase' does not exist on type 'number'.
```

## 🔍 Deeper version

**The ways to narrow:**

| Check | Use it for | Example |
|---|---|---|
| `typeof x === 'string'` | basic types: string, number, boolean, bigint, symbol, undefined, function | ids, form values |
| `x instanceof Error` | objects made from a class | errors, `Date` |
| `'title' in x` | objects that differ by which fields they have | `Candidate \| Job` |
| `if (x)` / `if (!x)` | removing `null`, `undefined`, `''`, `0` | optional fields |
| `x.status === 'success'` | a shared label field | [discriminated unions](topic:typescript/discriminated-unions) |
| `Array.isArray(x)` | arrays | `string \| string[]` |
| `x is T` function | your own runtime rule | data from APIs |

**Control-flow analysis.** TypeScript follows your `if`, `return`, `switch` and `throw` lines. After `if (!c.email) return …;`, it knows `email` is a string on every later line. An early `return` narrows the rest of the function.

**Truthiness traps.** `if (count)` removes `0` as well as `undefined`. If `0` is a valid value, write `if (count !== undefined)` instead. The same goes for empty strings.

**`typeof null` is `'object'`.** So a check for "is it an object?" must also say `x !== null`, like the `isCandidate` guard above.

**Custom type guards are a promise you make.** TypeScript trusts the `x is Candidate` return type. If your check is too weak (for example, it only checks `'name' in x`), wrong data can still pass. For data from outside the app (request bodies, external APIs, AI output), a schema library like [Zod](topic:typescript/zod) is safer. It checks every field and gives you the type at the same time.

**Assertion functions** are a related tool. A function with return type `asserts x is Candidate` throws if the check fails, and narrows the value after the call:

```ts
function assertCandidate(x: unknown): asserts x is Candidate { // throws instead of returning false
  if (!isCandidate(x)) throw new Error('Not a candidate');    // stop here if the data is wrong
}                                                             // end of assertCandidate
```

:::version[Version note]
Since **TypeScript 5.5**, TypeScript can work out simple type guards by itself. For example, `list.filter((x) => x !== undefined)` now gives you an array without `undefined`. Before 5.5, you had to write the `x is T` return type yourself.
:::

## 🎯 Why do we use it?

- **Union types are everywhere.** An id is a string or a number. A result is a success or an error. A field may be missing. Narrowing is how you work with them safely.
- **It turns runtime checks into type safety.** The `if` you'd write anyway now also teaches the compiler.
- **It handles `unknown` safely.** `JSON.parse`, `catch (err)` and API responses give you `unknown`. Narrowing lets you use them without falling back to `any`.
- **It catches forgotten cases.** If you forget to handle `null`, TypeScript tells you.

## ⚠️ Common mistakes

- **Using `as` instead of a check.** `(data as Candidate).name` compiles, but crashes if the data is wrong. Narrow first.
- **Forgetting `x !== null`** when checking `typeof x === 'object'`. `null` is an "object" in JavaScript.
- **Using `if (value)` when `0` or `''` is valid.** Truthiness narrowing throws those away too.
- **Writing a weak type guard.** It claims `x is Candidate` but checks only one field. The type is now a lie.

## 🗣️ How to answer in an interview

> "Narrowing is how TypeScript works out the exact type of a value that could be several types. I check with `typeof` for basic types, `instanceof` for classes like Error, the `in` operator when objects have different fields, and a shared status field for discriminated unions. After the check, TypeScript knows the exact type inside that block, and early returns narrow the rest of the function.
>
> For data from outside, like `JSON.parse` results or errors in a catch block, the type is `unknown`, so I must narrow before using it. I can write a custom type guard that returns `value is Candidate`, but for request bodies and external APIs I prefer a schema library like Zod, because a weak guard can lie. I avoid `as` assertions, because they don't check anything at runtime."

[FILL IN: a place in your SkillKeepr code where you narrowed a union or an `unknown` value, if you remember one.]

## 🔁 Follow-up questions

### What type is `err` in a `catch` block?

With `strict` (`useUnknownInCatchVariables`), it is `unknown`. Narrow it with `err instanceof Error` before reading `err.message`.

### How is a type guard different from a type assertion?

A type guard runs real code and returns true or false. An assertion (`as Candidate`) runs no code at all. It only tells the compiler to trust you.

### How do you narrow an array that may contain `undefined`?

Use `filter` with a check: `items.filter((x) => x !== undefined)`. Since TypeScript 5.5, the result type drops `undefined` automatically.

### What does `in` check, exactly?

Whether a property name exists on the object, including on its prototype. It works well for unions where each member has a different field.

## ✅ Quick check

### 1. Does this compile?

```ts
function len(x: string | string[]) {   // a string or an array of strings
  return x.toUpperCase();               // uses a string-only method
}
```

:::answer
**No.** `toUpperCase` doesn't exist on `string[]`. Narrow first, e.g. `if (typeof x === 'string') …` or `Array.isArray(x)`.
:::

### 2. Which check is the right one for an object made with `class ApiError extends Error`?

- A) `typeof err === 'ApiError'`
- B) `err instanceof ApiError`
- C) `'ApiError' in err`

:::answer
**B.** `instanceof` checks the class. `typeof` only returns basic names like `'object'` or `'string'`.
:::

### 3. What is wrong with `if (count) { … }` when `count: number | undefined`?

:::answer
It also skips `count = 0`, because `0` is falsy. Use `if (count !== undefined)` when zero is a valid value.
:::
