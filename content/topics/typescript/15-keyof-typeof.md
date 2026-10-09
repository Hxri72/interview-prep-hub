---
title: keyof, typeof and indexed access types
stack: typescript
order: 15
level: Intermediate
mustKnow: false
askedFrequency: common
summary:
  - "`keyof Candidate` gives a union of the field names: `'name' | 'experience' | 'skills'`."
  - "`typeof config` (in a type position) makes a type from a real JavaScript value."
  - "`Candidate['experience']` is an indexed access type. It gives the type of one field."
  - "`as const` + `typeof` + `[number]` turns an array of values into a union type, with one list for both."
  - Together they let you build types from your data, so values and types never drift apart.
cards:
  - q: What does keyof do?
    a: "It gives a union of an object type's property names, e.g. keyof Candidate → 'name' | 'experience' | 'skills'."
  - q: What does typeof do in a type position?
    a: It creates a type from an existing value, e.g. type Config = typeof config.
  - q: What is an indexed access type?
    a: "T['field'] — the type of one property. Candidate['skills'][number] gives the type of one item in the skills array."
  - q: How do you get a union type from an array of strings?
    a: "Write the array with `as const`, then type Status = (typeof STATUSES)[number]."
  - q: Is TypeScript's typeof the same as JavaScript's typeof?
    a: No. In code (a value position) it returns a string at runtime, like 'object'. In a type position it copies the full static type.
---

## 💡 What is it?

These are three small tools for **making types from things you already have**.

- **`keyof`** gives you the **list of field names** of a type, as a union like `'name' | 'experience'`.
- **`typeof`** (used in a type) makes a **type from a real value**, like a config object.
- **Indexed access**, like `Candidate['experience']`, gives you **the type of one field**.

With them, you write your data or main type once, and build other types from it.

## 🏠 Real-life example

Think of a **school report card**.

- **`keyof`** = the **list of subject names** printed on the card: Maths, Science, English.
- **`Card['Maths']`** = "what kind of value goes in the Maths box?" A number out of 100.
- **`typeof`** = making a **blank form by copying a filled card**. You look at a real card and copy its layout.
- **`as const` + `[number]`** = a **fixed list of grades** (A, B, C) printed on the wall. Only those letters are allowed.

You don't invent the layout twice. You copy it from what already exists.

## 🧑‍💻 Code example

Save this as `keyof.ts`. Run it with `node keyof.ts`.

```ts
interface Candidate {                                              // the candidate shape
  name: string;                                                    // text
  experience: number;                                              // number
  skills: string[];                                                // list of text
}                                                                  // end of Candidate

type CandidateKey = keyof Candidate;                               // 'name' | 'experience' | 'skills'
type Experience = Candidate['experience'];                         // indexed access → number
type Skill = Candidate['skills'][number];                          // one item of the skills array → string

const config = { port: 3000, env: 'dev', debug: false };           // a normal JavaScript object
type Config = typeof config;                                       // a type copied from the value

const STATUSES = ['applied', 'shortlisted', 'rejected'] as const;  // as const = keep exact values, read-only
type Status = (typeof STATUSES)[number];                           // 'applied' | 'shortlisted' | 'rejected'

function sortBy(list: Candidate[], key: CandidateKey): Candidate[] { // key must be a real field name
  return [...list].sort((a, b) => String(a[key]).localeCompare(String(b[key]))); // copy, then sort by that field
}                                                                  // end of sortBy

const years: Experience = 3;                                       // must be a number
const skill: Skill = 'Node.js';                                    // must be a string
const settings: Config = { port: 8080, env: 'prod', debug: true }; // must match config's shape
const s: Status = 'shortlisted';                                   // only the three allowed words

const people: Candidate[] = [                                      // sample data
  { name: 'Ravi', experience: 5, skills: ['React'] },              // first candidate
  { name: 'Asha', experience: 3, skills: ['Node.js'] },            // second candidate
];                                                                 // end of the list

console.log(sortBy(people, 'name').map((p) => p.name));            // sorted by name
console.log(years, skill, settings.port, s);                       // the typed values
console.log(STATUSES);                                             // the runtime array still exists
```

**Output:**

```text
[ 'Asha', 'Ravi' ]
3 Node.js 8080 shortlisted
[ 'applied', 'shortlisted', 'rejected' ]
```

**What TypeScript stops:**

```ts
const k: CandidateKey = 'salary';   // not a real field name
const st: Status = 'hired';         // not in the list
```

Real errors from `npx tsc --noEmit --strict`:

```text
error TS2322: Type '"salary"' is not assignable to type 'keyof Candidate'.
error TS2322: Type '"hired"' is not assignable to type '"applied" | "rejected" | "shortlisted"'.
```

## 🔍 Deeper version

**Type position vs value position.** TypeScript has two "worlds":
- **Values** exist when the code runs: `config`, `STATUSES`.
- **Types** exist only while compiling: `Config`, `Status`.

`typeof` in **code** (`typeof x === 'string'`) is JavaScript's runtime operator. It returns a string. `typeof` in a **type** (`type Config = typeof config`) is TypeScript's operator. It copies the full static type. Same word, two jobs.

**Why `as const` matters.** Without it, `['applied', 'shortlisted']` has type `string[]`, so `[number]` gives just `string`. With `as const`, the array becomes `readonly ['applied', 'shortlisted', 'rejected']`, and `[number]` gives the exact union. Now **one list** is both your runtime values (for a dropdown or validation) and your type.

**Indexed access goes deep:**

```ts
type Address = Candidate['address'];             // the whole nested object type (if Candidate had one)
type City = Candidate['address']['city'];        // one nested field
type Field = Candidate[CandidateKey];            // string | number | string[] — every field's type
```

**`keyof` with generics** is how safe helpers work: `function get<T, K extends keyof T>(obj: T, key: K): T[K]`. See [generic constraints](topic:typescript/generic-constraints).

**Object of values → union of values:**

```ts
const ROLES = { Admin: 'admin', Recruiter: 'recruiter' } as const; // a fixed object
type Role = (typeof ROLES)[keyof typeof ROLES];                   // 'admin' | 'recruiter'
```

This is a popular alternative to enums. See [enums vs unions](topic:typescript/enums-vs-unions).

**`keyof` on index signatures.** For a type like `{ [key: string]: number }`, `keyof` gives `string | number`, because JavaScript also allows number keys on objects. That surprises people. (`Record<string, number>` is written differently and gives just `string`.)

**`satisfies` (TypeScript 4.9+)** checks a value against a type but keeps its exact literal types. For example, `const config = {...} satisfies AppConfig`. You still get the narrow `typeof config`, plus an error if the object doesn't match `AppConfig`.

## 🎯 Why do we use it?

- **Values and types never drift apart.** The status list in the dropdown and the `Status` type come from the same array.
- **Field names are checked.** A `sortBy(list, 'experiance')` typo fails at compile time.
- **No duplicate types.** A config type copied with `typeof` updates when the config object changes.
- **They power generics and utility types.** `Pick`, `Omit` and `Record` are all built on `keyof` and indexed access.

## ⚠️ Common mistakes

- **Forgetting `as const`**, so `(typeof LIST)[number]` is just `string`.
- **Mixing up the two `typeof`s.** `typeof x === 'Candidate'` will never be true at runtime.
- **Using `string` for a key parameter** instead of `keyof T`, which lets typos through.
- **Writing a type by hand** that could be copied from a value with `typeof`.

## 🗣️ How to answer in an interview

> "`keyof` gives the union of an object type's field names. Indexed access, like `Candidate['experience']`, gives the type of one field. And `typeof` in a type position copies the type of a real value. I use them to build types from what already exists, so I don't write the same thing twice.
>
> A pattern I like: an array of statuses written with `as const`, and `type Status = (typeof STATUSES)[number]`. One list gives me both the runtime values for a dropdown or validation, and the union type. With generics, `K extends keyof T` and `T[K]` make helpers like `sortBy` reject misspelled field names."

[FILL IN: a status list or config in your project that you typed this way, if any.]

## 🔁 Follow-up questions

### What does `(typeof STATUSES)[number]` mean, step by step?

`typeof STATUSES` is the array's type. `[number]` means "the type you get when you read any numeric index", which is the type of one item. With `as const`, that's the union of the exact strings.

### Why does `keyof` sometimes include `number`?

For index signatures like `{ [key: string]: T }`, JavaScript converts number keys to strings. So `keyof` gives `string | number`.

### What is `satisfies`?

It checks that a value matches a type, without widening the value's own type. You keep the exact literal types and still get an error for a wrong shape.

### Can you use `typeof` on a function?

Yes. `typeof loadCandidate` is the function's full type. It's often combined with `ReturnType` or `Parameters`.

## ✅ Quick check

### 1. What is `keyof { id: string; age: number }`?

:::answer
**`'id' | 'age'`** — a union of the field names.
:::

### 2. What is `T` here?

```ts
const LEVELS = ['Basic', 'Advanced'];   // no "as const"
type T = (typeof LEVELS)[number];       // one item's type
```

:::answer
**`string`.** Without `as const`, the array is `string[]`. Add `as const` to get `'Basic' | 'Advanced'`.
:::

### 3. What does `Candidate['skills'][number]` give if `skills: string[]`?

:::answer
**`string`** — the type of one item in the skills array.
:::
