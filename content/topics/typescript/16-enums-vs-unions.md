---
title: Enums vs string unions
stack: typescript
order: 16
level: Intermediate
mustKnow: false
askedFrequency: common
summary:
  - Both limit a value to a fixed set, like 'admin' | 'recruiter' | 'candidate'.
  - "A string union (`type Role = 'admin' | 'recruiter'`) is only a type. It adds no JavaScript code."
  - "An `enum` creates a real object in the JavaScript output, so you can loop over its values at runtime."
  - "Many teams prefer unions, or an `as const` object plus a union, because they're simpler and lighter."
  - "Enums aren't erasable syntax: Node.js's built-in TypeScript support (type stripping) rejects them unless you add a flag."
cards:
  - q: What is the difference between an enum and a string union?
    a: Both limit values to a fixed set. A union is only a type and produces no JavaScript. An enum creates a real object at runtime.
  - q: Which one do you prefer, and why?
    a: String unions, or an as-const object when I also need the values at runtime. They're simpler, add no extra code, and work with Node's type stripping.
  - q: What is a numeric enum's "reverse mapping"?
    a: "For numeric enums TypeScript also maps numbers back to names, so Level[1] gives 'Intermediate'. String enums don't do this."
  - q: Why does node file.ts fail on an enum?
    a: Node only strips types; it can't generate code. An enum needs generated code, so Node throws ERR_UNSUPPORTED_TYPESCRIPT_SYNTAX unless you use --experimental-transform-types or a compiler.
---

## 💡 What is it?

Sometimes a value must be **one of a few fixed words**. A role can only be `admin`, `recruiter` or `candidate`.

TypeScript gives you two ways to say this:

1. A **string union**: `type Role = 'admin' | 'recruiter' | 'candidate'`. This is **only a type**.
2. An **[enum](glossary:enum)**: `enum Role { Admin = 'admin', … }`. This **also creates a real object** when the code runs.

Both stop wrong values. The difference is what happens at runtime.

## 🏠 Real-life example

Think of the **school uniform rule**: "Shirts must be white, blue or grey."

- A **string union** = the rule **written in the school diary**. Teachers check it, but nothing extra is printed or stored.
- An **enum** = the rule **plus a printed colour chart hanging on the wall**. It takes up space, but you can look at the chart any time.
- An **`as const` object** = a **small chart in the diary**. You get the list to look at, without a big poster.

Most schools are fine with the diary rule, or the small chart. The wall poster is extra.

## 🧑‍💻 Code example

Save this as `roles.ts`. Run it with `node roles.ts`.

```ts
type Role = 'admin' | 'recruiter' | 'candidate';                   // a string union: only these 3 words

const ROLES = { Admin: 'admin', Recruiter: 'recruiter' } as const; // an object "like an enum", read-only
type RoleName = (typeof ROLES)[keyof typeof ROLES];                // 'admin' | 'recruiter'

function canPostJob(role: Role): boolean {                         // role must be one of the 3 words
  return role === 'admin' || role === 'recruiter';                 // candidates can't post jobs
}                                                                  // end of canPostJob

const mine: RoleName = ROLES.Recruiter;                            // use the object like an enum
console.log(canPostJob('recruiter'));                              // true
console.log(canPostJob('candidate'));                              // false
console.log(mine, Object.values(ROLES));                           // values you can loop over at runtime
```

**Output:**

```text
true
false
recruiter [ 'admin', 'recruiter' ]
```

**Now try a real enum** in `enum.ts`:

```ts
enum Status { Applied = 'applied', Shortlisted = 'shortlisted' } // a string enum
console.log(Status.Applied, Object.values(Status));             // use it at runtime
```

`node enum.ts` fails. This is the real error from Node 24:

```text
SyntaxError [ERR_UNSUPPORTED_TYPESCRIPT_SYNTAX]: TypeScript enum is not supported in strip-only mode
```

Compiled with `tsc`, the enum becomes this real JavaScript:

```text
var Status;
(function (Status) {
    Status["Applied"] = "applied";
    Status["Shortlisted"] = "shortlisted";
})(Status || (Status = {}));
```

Then it prints `applied [ 'applied', 'shortlisted' ]`.

## 🔍 Deeper version

**Comparison:**

| | String union | `as const` object + union | `enum` |
|---|---|---|---|
| Runtime code | none | a plain object | a generated object (an IIFE) |
| Loop over values | no (types vanish) | yes, `Object.values` | yes |
| Works with Node type stripping | yes | yes | **no** (needs a flag or compiler) |
| Passes plain strings | yes, `'admin'` | yes | string enums: **no**, you must write `Role.Admin` |
| Reverse mapping | — | — | numeric enums only |

**Erasable syntax.** Node.js 24 runs `.ts` files by **stripping types**: it deletes the type annotations and runs what's left. That only works for syntax that can be removed without changing behaviour. Enums, `namespace` with code, and constructor parameter properties (`constructor(private x: string)`) generate JavaScript, so Node refuses them. You can run them with `node --experimental-transform-types`. TypeScript 5.8 added the `erasableSyntaxOnly` option, which flags them while you type:

```text
error TS1294: This syntax is not allowed when 'erasableSyntaxOnly' is enabled.
```

**Numeric enums.** `enum Level { Basic, Intermediate, Advanced }` numbers them 0, 1, 2. They also get a reverse mapping, so `Level[1]` is `'Intermediate'`. Our test printed `1 Intermediate` for `Level.Intermediate, Level[1]`. Numeric enums are risky, because any number was historically assignable to them, and reordering members changes the stored values.

**String enums are "nominal".** A function that takes `Status` won't accept the plain string `'applied'`. You must pass `Status.Applied`. Some people like this strictness. Others find it annoying, especially with JSON from an API, where values arrive as plain strings.

**`const enum`** is inlined by the compiler and leaves no object. But it doesn't work with tools that compile one file at a time (`isolatedModules`, Babel, esbuild, Node type stripping), so most teams avoid it.

**Mongoose and Zod work well with the `as const` pattern:** `enum: Object.values(STATUS)` in a schema, or `z.enum(STATUSES)` in Zod. One list drives the type, the database check and the request validation.

## 🎯 Why do we use it?

- **To stop invalid values.** A role or status must be one of the allowed words.
- **Unions keep things light.** No extra code ships to the browser or server.
- **`as const` objects give both.** You get runtime values for dropdowns and validation, plus a type.
- **Enums suit some teams.** Existing code may use them, and they read nicely (`Status.Applied`). You should understand both, because you'll meet both.

## ⚠️ Common mistakes

- **Using numeric enums for data stored in the database.** Reordering members silently changes the stored numbers.
- **Using enums when running `.ts` directly with Node.** Node's type stripping rejects them.
- **Assuming a union exists at runtime.** You can't loop over `type Role`. Use an `as const` array or object if you need the values.
- **Comparing a string enum with a raw string from JSON**, then fighting the compiler. Convert or validate the value first.

## 🗣️ How to answer in an interview

> "Both limit a value to a fixed set. A string union like `'admin' | 'recruiter'` is only a type, so it adds no JavaScript. An enum creates a real object at runtime, so I can loop over its values, and numeric enums even map numbers back to names.
>
> I usually prefer string unions, or an `as const` object with a union type made from it when I also need the values at runtime, for example for a dropdown or a Zod or Mongoose enum check. They're lighter, and they work with Node's built-in type stripping, which rejects enums because they need generated code. If a codebase already uses enums, I follow that style, and I avoid numeric enums for data stored in a database."

[FILL IN: which style your SkillKeepr codebase uses for statuses and roles, if you know.]

## 🔁 Follow-up questions

### What is a reverse mapping?

For numeric enums, TypeScript adds both directions: `Level.Intermediate` is `1`, and `Level[1]` is `'Intermediate'`. String enums don't get it.

### What is `erasableSyntaxOnly`?

A compiler option (TypeScript 5.8+) that reports errors for syntax that can't simply be deleted, like enums and parameter properties. It keeps code compatible with Node's type stripping.

### How do you get a list of allowed values from a union?

You can't, because the union disappears at runtime. Start from a value instead: `const STATUSES = [...] as const`, then `type Status = (typeof STATUSES)[number]`.

### What is a `const enum`?

An enum the compiler inlines, leaving no object behind. It breaks with single-file compilers and type stripping, so it's rarely recommended now.

## ✅ Quick check

### 1. Which of these adds no JavaScript to the output?

- A) `enum Role { Admin = 'admin' }`
- B) `type Role = 'admin' | 'recruiter'`
- C) `const ROLES = { Admin: 'admin' } as const`

:::answer
**B.** A union is only a type and is fully removed. A creates an enum object, and C is a real object.
:::

### 2. What does this print after compiling with `tsc`?

```ts
enum Level { Basic, Intermediate, Advanced }   // a numeric enum
console.log(Level.Intermediate, Level[1]);     // value and reverse lookup
```

:::answer
**`1 Intermediate`.** Members are numbered from 0, and numeric enums have a reverse mapping.
:::

### 3. Why does `node app.ts` fail when `app.ts` contains an enum?

:::answer
Node only strips type syntax. An enum needs generated JavaScript, so Node throws `ERR_UNSUPPORTED_TYPESCRIPT_SYNTAX`. Use a union or an `as const` object, or run with `--experimental-transform-types`.
:::
