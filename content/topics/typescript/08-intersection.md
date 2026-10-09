---
title: Intersection types
stack: typescript
order: 8
level: Intermediate
mustKnow: false
askedFrequency: sometimes
summary:
  - "An intersection type (A & B) means \"all of these together\": the value must have every field from A and from B."
  - It's how you combine type aliases, like Person & Timestamps.
  - "If two parts disagree on a field (id: string vs id: number), that field becomes never, and no value fits."
  - Intersections are common in generic helpers, like withTimestamps<T>(data) returning T & Timestamps.
  - "For objects, interface extends gives clearer errors on clashes; & is more flexible."
cards:
  - q: What is an intersection type?
    a: "A & B — a type that has all the members of A and all the members of B at the same time."
  - q: Union vs intersection?
    a: "A | B is \"either one\". A & B is \"both together\", with every field from each."
  - q: "What happens with { id: string } & { id: number }?"
    a: The id field becomes string & number, which is never. No real value can satisfy it.
  - q: "What is string & number?"
    a: never — nothing can be both a string and a number.
  - q: extends vs & — when does it matter?
    a: With interface extends, a clashing field is reported immediately. With &, it quietly becomes never and you see the error later.
---

## 💡 What is it?

An **intersection type** is written `A & B`. It means "**all of these together**".

A value of type `Person & Timestamps` must have **every field** from `Person` **and** every field from `Timestamps`.

It's the main way to **combine** type aliases.

## 🏠 Real-life example

Think of a **school sports-team selection rule**.

"To join the team, you must be **in Class 10** AND **have a medical certificate** AND **have parent permission**."

A student must meet **all three**. Meeting just one is not enough.

- **Each condition** = one type (`Class10Student`, `MedicalCert`, `ParentPermission`).
- **"AND" between them** = the `&` operator.
- **A student who meets all three** = a value that fits the intersection type.
- **A rule that says "must be in Class 10 AND in Class 9"** = an impossible rule. No student fits. That's `never`.

## 🧑‍💻 Code example

Save this as `intersect.ts`. Run it with `node intersect.ts`.

```ts
type Person = { name: string; email: string };      // basic person details
type Timestamps = { createdAt: Date; updatedAt: Date }; // fields every saved record has
type CandidateRecord = Person & Timestamps & { experience: number }; // & = "ALL of these together"

const record: CandidateRecord = {                   // must have every field from all three parts
  name: 'Hari',                                     // from Person
  email: 'hari@example.com',                        // from Person
  experience: 3,                                    // from the extra part
  createdAt: new Date('2026-01-01'),                // from Timestamps
  updatedAt: new Date('2026-10-01'),                // from Timestamps
};                                                  // end of the object

function withTimestamps<T>(data: T): T & Timestamps { // adds the two date fields to ANY object
  const now = new Date('2026-10-09');               // a fixed date so the output is the same every run
  return { ...data, createdAt: now, updatedAt: now }; // copy the data, add the dates
}                                                   // end of withTimestamps

console.log(record.name, record.experience);        // Hari 3
console.log(Object.keys(withTimestamps({ title: 'Node Dev' }))); // [ 'title', 'createdAt', 'updatedAt' ]
```

**Output:**

```text
Hari 3
[ 'title', 'createdAt', 'updatedAt' ]
```

Now see what goes wrong. Run `npx tsc --noEmit` on this:

```ts
type A = { id: string };                            // id is text here
type B = { id: number };                            // id is a number here
type C = A & B;                                     // id must be text AND a number
const c: C = { id: 'x' };                           // nothing can fit
const r: { name: string } & { age: number } = { name: 'Hari' }; // age is missing
```

```text
intersect-err.ts(4,16): error TS2322: Type 'string' is not assignable to type 'never'.
intersect-err.ts(6,7): error TS2322: Type '{ name: string; }' is not assignable to type '{ name: string; } & { age: number; }'.
  Property 'age' is missing in type '{ name: string; }' but required in type '{ age: number; }'.
```

## 🔍 Deeper version

**`&` vs `|`.** These two are easy to mix up:

| | `A \| B` (union) | `A & B` (intersection) |
|---|---|---|
| Meaning | either A or B | A and B together |
| Fields you can use without checking | only shared ones | every field from both |
| Values that fit | more | fewer |

**Why "fewer values" but "more fields"?** Think of `&` as **adding rules**. Each extra rule means more fields are required, so fewer objects can pass.

**Clashing fields become `never`.** If both parts have `id` with different types, the result is `id: string & number`. Nothing is both a string and a number, so that is `never`. TypeScript won't warn you when you **create** the type; you only see it when you try to use it. For primitives, `string & number` is simply `never`.

**`extends` catches clashes earlier.** With interfaces:

```ts
interface A { id: string }                          // id is text
interface B extends A { id: number }                // error right here: id types don't match
```

TypeScript reports the problem **at the declaration**. That's one reason many teams use `interface … extends` for object hierarchies, and `&` for quick combinations and generics. See [type vs interface](topic:typescript/type-vs-interface).

**Intersections in generics.** They're perfect for "add something to any type":
- `T & Timestamps`: add `createdAt`/`updatedAt` to any record.
- `T & { tenantId: string }`: tag any object with the tenant it belongs to.
- `Props & { children?: React.ReactNode }`: add children to some props.

**Intersections with functions.** `((x: string) => void) & ((x: number) => void)` describes an **overloaded** function that accepts both. You'll rarely write this by hand.

## 🎯 Why do we use it?

- **Reuse small building blocks.** Define `Timestamps` once and add it to many types.
- **Generic helpers** can return "the input type plus extra fields" safely.
- **Mixins and decorators** (adding behaviour to an object) can describe their result precisely.
- **Combining library types**, like your own props plus a library's props.

## ⚠️ Common mistakes

- **Mixing up `&` and `|`.** If you mean "one of these", use `|`.
- **Combining types with clashing fields** and getting a silent `never`. Prefer `interface … extends` if you want an early error.
- **Building huge chains of `&`.** They can make error messages long and slow down the type checker. Name the pieces.
- **Expecting `&` to merge values at runtime.** It's only a type. You still need `{ ...a, ...b }` to merge the actual objects.

## 🗣️ How to answer in an interview

> "An intersection type, written A & B, means a value has everything from A and everything from B. I use it to combine type aliases, like Person & Timestamps, and in generic helpers — for example a withTimestamps function that takes any T and returns T & Timestamps.
>
> It's the opposite of a union: a union is 'one of', an intersection is 'all of'. One thing to watch: if the two parts have the same field with different types, that field becomes never and nothing fits. For object hierarchies I often use interface extends instead, because it reports that kind of clash immediately."

## 🔁 Follow-up questions

### What is `string & number`?

`never`. No value can be both a string and a number.

### When would you choose `&` over `interface extends`?

When you combine type aliases, unions or generic types, like `T & Timestamps`. Interfaces can only extend object types with known fields.

### Does `A & B` merge two objects at runtime?

No. It only describes the type. To merge real objects, use the spread syntax: `{ ...a, ...b }`.

### What happens with `{ a: string } & { b: number }`?

You get a type that needs both fields: `{ a: string; b: number }`. That's the most common, useful case.

## ✅ Quick check

### 1. Does this compile?

```ts
type HasName = { name: string };                    // needs name
type HasAge = { age: number };                      // needs age
const p: HasName & HasAge = { name: 'Hari', age: 27 }; // both fields given
```

:::answer
**Yes.** The value has every field from both types.
:::

### 2. What is the type of `x` here?

```ts
type X = { id: string } & { id: number };           // id clashes
type Id = X['id'];                                  // what is Id?
```

:::answer
**`never`.** `string & number` can't hold any value.
:::

### 3. A value of type `A | B` vs `A & B` — which one lets you use **every** field of A and B without checking?

:::answer
**`A & B`.** With `A | B`, you only get the shared fields until you narrow.
:::
