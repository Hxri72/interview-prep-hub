---
title: Union and literal types
stack: typescript
order: 7
level: Basic
mustKnow: true
askedFrequency: very common
summary:
  - "A union type means \"one of these\": string | number can be text or a number."
  - "A literal type is one exact value, like 'applied'. A union of literals limits a value to a fixed list."
  - "type Status = 'applied' | 'shortlisted' | 'rejected' allows only those 3 words — a typo is a compile error."
  - Before using a union value, you narrow it (typeof, ===, in) so TypeScript knows which member you have.
  - Literal unions are a light alternative to enums and give great autocomplete.
cards:
  - q: What is a union type?
    a: "A value that can be one of several types, written with |, like string | number."
  - q: What is a literal type?
    a: "A type that is one exact value, like 'applied' or 404. Unions of literals make a fixed list of allowed values."
  - q: Why can't you call id.toUpperCase() when id is string | number?
    a: Because numbers don't have toUpperCase. You must narrow first, e.g. if (typeof id === 'string').
  - q: Literal union vs enum?
    a: Both limit a value to a fixed set. A literal union adds no JavaScript at runtime and is simpler; an enum creates a real object.
  - q: Give a real use of a literal union.
    a: "A candidate's application status: 'applied' | 'shortlisted' | 'rejected'. A typo like 'shortlist' fails to compile."
---

## 💡 What is it?

A **union type** means "**one of these**". You write it with `|`. For example, `string | number` can be text **or** a number.

A **literal type** is **one exact value**, like `'applied'` or `404`.

Put them together and you get a **fixed list of allowed values**: `'applied' | 'shortlisted' | 'rejected'`. Anything else is a compile error.

## 🏠 Real-life example

Think of a **school uniform rule**.

"Students may wear **white or blue** shirts." Not green, not red. Only those two.

- **"White or blue"** = a union of literal types: `'white' | 'blue'`.
- **A student in a green shirt** = a value that isn't in the union → error.
- **The watchman checking the colour** before letting the student in = narrowing (checking which member you have).
- **"A shirt OR a T-shirt"** = a union of two different types, like `string | number`.

## 🧑‍💻 Code example

Save this as `union.ts`. Run it with `node union.ts`.

```ts
type Status = 'applied' | 'shortlisted' | 'rejected'; // literal union: ONLY these 3 exact words

function label(status: Status): string {            // status must be one of the 3
  if (status === 'applied') return '🟡 New';        // TS knows status is exactly 'applied' here
  if (status === 'shortlisted') return '🟢 Shortlisted'; // ...and 'shortlisted' here
  return '🔴 Rejected';                             // only 'rejected' is left
}                                                   // end of label

function formatId(id: string | number): string {    // union: id can be text OR a number
  return typeof id === 'string' ? id.toUpperCase() : `#${id}`; // check which one, then use it
}                                                   // end of formatId

console.log(label('shortlisted'));                  // 🟢 Shortlisted
console.log(formatId('c-12'), formatId(42));        // C-12 #42
```

**Output:**

```text
🟢 Shortlisted
C-12 #42
```

Now try two mistakes, and run `npx tsc --noEmit`:

```ts
let s: Status = 'hired';                            // not one of the 3 words
function formatId(id: string | number) { return id.toUpperCase(); } // used without checking
```

```text
union-err.ts(2,5): error TS2322: Type '"hired"' is not assignable to type 'Status'.
union-err.ts(3,52): error TS2339: Property 'toUpperCase' does not exist on type 'string | number'.
  Property 'toUpperCase' does not exist on type 'number'.
```

## 🔍 Deeper version

**What you can do with a union value.** Before narrowing, you can only use what **every** member has. `string | number` both have `toString()`, so that's allowed. Only strings have `toUpperCase()`, so you must check first.

**Ways to narrow** (see [narrowing](topic:typescript/narrowing)):

| Check | Example | Works for |
|---|---|---|
| `typeof` | `typeof id === 'string'` | primitives |
| `===` | `status === 'applied'` | literal values |
| `in` | `'email' in user` | object shapes |
| `instanceof` | `err instanceof Error` | classes |
| a shared tag field | `result.status === 'success'` | discriminated unions |

**Literal types from `const`.** `const role = 'admin'` already has the literal type `'admin'`. To keep literal types in arrays and objects, use `as const`:

```ts
const STATUSES = ['applied', 'shortlisted', 'rejected'] as const; // a readonly tuple of exact words
type Status = (typeof STATUSES)[number];            // 'applied' | 'shortlisted' | 'rejected'
```

Now one list drives both the runtime values (for a dropdown) and the type.

**Literal unions vs enums.** Both limit a value to a fixed set. Many teams prefer literal unions:
- They add **no extra JavaScript**.
- They work with Node 24's type stripping (enums don't).
- They read naturally: `'applied'` instead of `Status.Applied`.

See [enums vs unions](topic:typescript/enums-vs-unions).

**Discriminated unions.** When each member of a union has a shared "tag" field, like `status: 'success' | 'error'`, checking the tag tells TypeScript exactly which shape you have. This is a very common pattern for API results and Redux actions. See [discriminated unions](topic:typescript/discriminated-unions).

**Union vs intersection.** `A | B` means "**A or B**" (one of them). `A & B` means "**A and B**" (all fields of both). See [intersection types](topic:typescript/intersection).

## 🎯 Why do we use it?

- **Real data often has several shapes.** An ID might be a string or a number. A response might be success or error.
- **Literal unions stop typos.** `'shortlist'` instead of `'shortlisted'` fails at compile time, not in production.
- **Great autocomplete.** Your editor lists every allowed value.
- **Safer `switch` statements**, especially with a `never` exhaustive check (see [never](topic:typescript/any-unknown-void-never)).

## ⚠️ Common mistakes

- **Using a union member's method without narrowing.** Check the type first.
- **Typing a fixed list as `string`.** `status: string` accepts any text. Use a literal union.
- **Writing the same list twice**, once as a type and once as an array. Use `as const` and derive the type.
- **Mixing up `|` and `&`.** `|` is "one of". `&` is "all together".

## 🗣️ How to answer in an interview

> "A union type means a value can be one of several types, like string | number. A literal type is one exact value, like 'applied'. Combining them gives a fixed list, like type Status = 'applied' | 'shortlisted' | 'rejected', so any other value — even a small typo — is a compile error, and the editor autocompletes the allowed values.
>
> To use a union value, I narrow it first: typeof for primitives, === for literals, in for object shapes, or a shared tag field for discriminated unions. I usually prefer literal unions over enums because they create no runtime code and read naturally. If I also need the list at runtime, for example for a dropdown, I write an array with as const and derive the type from it."

## 🔁 Follow-up questions

### What can you do with a `string | number` value without narrowing?

Only what both types share, like `toString()` or `toLocaleString()`. For anything type-specific, narrow first.

### How do you get a union type from an array?

Make the array `as const`, then write `type Status = (typeof STATUSES)[number]`.

### What is a discriminated union?

A union of object types that all share a literal "tag" field, like `type: 'success' | 'error'`. Checking the tag narrows to the exact shape. It's great for API results and reducer actions.

### Can a function return a union?

Yes, for example `Promise<Candidate | null>`. Then the caller must handle the `null` case.

## ✅ Quick check

### 1. Does this compile?

```ts
type Role = 'admin' | 'recruiter';                  // two allowed roles
const r: Role = 'Admin';                            // capital A
```

:::answer
**No.** Literal types are exact. `'Admin'` is not the same as `'admin'`.
:::

### 2. Does this compile?

```ts
function len(x: string | string[]) {                // text, or a list of text
  return x.length;                                  // both have .length
}
```

:::answer
**Yes.** Both `string` and `string[]` have a `length` property, so no narrowing is needed.
:::

### 3. Which one means "has all the fields of both A and B"?

- A) `A | B`
- B) `A & B`

:::answer
**B) `A & B`.** `A | B` means "either A or B".
:::
