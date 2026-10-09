---
title: Generic constraints (extends)
stack: typescript
order: 13
level: Intermediate
mustKnow: false
askedFrequency: common
summary:
  - "A constraint is a rule on a generic: `<T extends { id: string }>` means T can be any type, as long as it has an id."
  - Inside the function, you can safely use the fields the constraint promises.
  - "`<K extends keyof T>` means K must be one of T's real field names. `T[K]` is the type of that field."
  - "Constraints can be any type: `T extends string`, `T extends { length: number }`, `T extends object`."
  - Wrong arguments fail at compile time with a clear error.
cards:
  - q: "What does `<T extends { id: string }>` mean?"
    a: T can be any type, but it must have an id of type string. Inside the function you can use item.id safely.
  - q: What does `<T, K extends keyof T>` give you?
    a: K must be a real key of T, so typos in field names are caught. T[K] is the exact type of that field.
  - q: Why do you need a constraint at all?
    a: Without it, T could be anything, so TypeScript won't let you read any property on it.
  - q: Is extends in a generic the same as extends in a class?
    a: No. In a generic it means "must be assignable to" (a rule). In a class it means inheritance.
---

## 💡 What is it?

A plain [generic](topic:typescript/generics) `T` can be **any** type. So TypeScript won't let you read any field on it. It might not have that field!

A **constraint** adds a rule. `<T extends { id: string }>` means: "T can be any type, **as long as it has an `id`** that is a string."

Now you can use `item.id` inside the function. And callers must pass something that follows the rule.

## 🏠 Real-life example

Think of a **school sports day entry form**.

"Any student can enter the race, **as long as they have a sports-day ID card**."

- **Any student** = any type `T`.
- **"Must have an ID card"** = the constraint `extends { id: string }`.
- The **gate keeper** who checks the card = the TypeScript compiler.
- The **race official** who can call out every runner's ID number = the function using `item.id` safely.

A visitor without a card is stopped at the gate. In the same way, passing an object without `id` gives a compile error.

## 🧑‍💻 Code example

Save this as `constraints.ts`. Run it with `node constraints.ts`.

```ts
type Candidate = { id: string; name: string; experience: number }; // has an id
type Job = { id: string; title: string };                          // also has an id

function findById<T extends { id: string }>(list: T[], id: string): T | undefined { // T must have id: string
  return list.find((item) => item.id === id);                      // safe: every T has .id
}                                                                  // end of findById

function getField<T, K extends keyof T>(obj: T, key: K): T[K] {    // K must be one of T's keys
  return obj[key];                                                 // T[K] = the type of that field
}                                                                  // end of getField

function longest<T extends { length: number }>(a: T, b: T): T {    // works for strings, arrays, anything with length
  return a.length >= b.length ? a : b;                             // compare their lengths
}                                                                  // end of longest

const candidates: Candidate[] = [{ id: 'c1', name: 'Asha', experience: 3 }]; // sample data
const jobs: Job[] = [{ id: 'j9', title: 'React Developer' }];      // sample data

console.log(findById(candidates, 'c1')?.name);                     // T = Candidate
console.log(findById(jobs, 'j9')?.title);                          // T = Job
console.log(getField(candidates[0], 'experience'));                // returns a number
console.log(longest('Node', 'React'));                             // two strings
console.log(longest([1, 2, 3], [4]));                              // two arrays
```

**Output:**

```text
Asha
React Developer
3
React
[ 1, 2, 3 ]
```

**Breaking the rules.** These two calls:

```ts
findById([{ name: 'Asha' }], 'c1');                           // object without an id
getField({ name: 'Asha', experience: 3 }, 'salary');          // a key that doesn't exist
```

give these real errors from `npx tsc --noEmit --strict`:

```text
error TS2353: Object literal may only specify known properties, and 'name' does not exist in type '{ id: string; }'.
error TS2345: Argument of type '"salary"' is not assignable to parameter of type '"experience" | "name"'.
```

## 🔍 Deeper version

**`extends` here means "is assignable to".** It is a rule, not inheritance. `T extends { id: string }` accepts `Candidate`, `Job`, or anything else that has at least `id: string`. Extra fields are fine (that's structural typing).

**`keyof` + indexed access is the most useful pair:**

```ts
function pluck<T, K extends keyof T>(list: T[], key: K): T[K][] { // K = a real field name of T
  return list.map((item) => item[key]);                         // T[K][] = an array of that field's type
}                                                               // end of pluck
pluck(candidates, 'name');                                      // string[]
pluck(candidates, 'experience');                                // number[]
```

See [keyof and typeof](topic:typescript/keyof-typeof) for more on `keyof` and `T[K]`.

**Common constraints:**

| Constraint | Meaning |
|---|---|
| `T extends string` | T is a string, or a string literal like `'admin'` |
| `T extends object` | any non-primitive (not string, number…) |
| `T extends { length: number }` | anything with a length: strings, arrays |
| `T extends unknown[]` | any array |
| `K extends keyof T` | one of T's field names |
| `T extends (...args: any[]) => unknown` | any function |

**Constraint plus default:** `<T extends object = Record<string, unknown>>` sets both a rule and a fallback.

**Return the generic, not the constraint.** If `findById` returned `{ id: string }` instead of `T`, the caller would lose `name` and every other field. Returning `T` keeps the full type.

**Conditional types** use the same word in another way: `T extends string ? 'text' : 'other'`. That's a type-level "if". See [mapped and conditional types](topic:typescript/mapped-conditional).

## 🎯 Why do we use it?

- **Safe reusable helpers.** `findById`, `sortBy`, `groupBy` and `pluck` work for candidates, jobs and users, and still check their inputs.
- **Typos in field names are caught.** With `K extends keyof T`, `'salary'` is rejected when the field doesn't exist.
- **Exact return types.** `T[K]` gives the caller the real field type, not `any`.
- **Shared components.** A generic `Table<T extends { id: string }>` can use `row.id` as the React `key`.

## ⚠️ Common mistakes

- **Reading a field on an unconstrained `T`.** `item.id` fails if `T` has no constraint. Add `extends { id: string }`.
- **Returning the constraint type** instead of `T`, which throws away the caller's extra fields.
- **Using `key: string`** instead of `K extends keyof T`, so any typo compiles.
- **Thinking `extends` means inheritance** here. It only means "must fit this shape".

## 🗣️ How to answer in an interview

> "A generic constraint puts a rule on a type parameter. `<T extends { id: string }>` means T can be any type, as long as it has a string `id`. That lets me use `item.id` inside the function, and callers get an error if they pass something without one. I return `T` itself, so callers keep their full type.
>
> The pattern I use most is `<T, K extends keyof T>`. K must be a real field name of T, and `T[K]` is that field's exact type. It's great for helpers like `sortBy` or `pluck`, because a misspelled field name fails at compile time."

[FILL IN: a shared helper or component where you used a constraint, if any.]

## 🔁 Follow-up questions

### What does `T[K]` mean?

It's an indexed access type: "the type of field K on type T". If T is `Candidate` and K is `'experience'`, then `T[K]` is `number`.

### Can a constraint refer to another type parameter?

Yes. `K extends keyof T` does exactly that.

### What's the difference between `T extends object` and `T extends {}`?

`object` means any non-primitive value. `{}` means any value except `null` and `undefined`, so it also accepts strings and numbers.

### Why not just type the parameter as `{ id: string }[]`?

Then the function returns `{ id: string }`, and the caller loses all the other fields. The generic keeps the full type.

## ✅ Quick check

### 1. Does this compile?

```ts
function getId<T>(item: T) {   // T has no rule
  return item.id;              // reads a field
}
```

:::answer
**No.** `T` could be any type, so TypeScript can't promise it has `id`. Add `<T extends { id: string }>`.
:::

### 2. What is the return type?

```ts
function getField<T, K extends keyof T>(obj: T, key: K): T[K] { return obj[key]; } // from above
const v = getField({ name: 'Asha', experience: 3 }, 'name');                       // ask for 'name'
```

:::answer
**`string`**, because `T['name']` is `string`.
:::

### 3. Which calls are allowed for `longest<T extends { length: number }>`?

- A) `longest('a', 'bb')`
- B) `longest([1], [2, 3])`
- C) `longest(5, 10)`

:::answer
**A and B.** Strings and arrays have `length`. Numbers don't, so C fails.
:::
