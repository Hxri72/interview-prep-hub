---
title: Basic types, arrays and tuples
stack: typescript
order: 2
level: Basic
mustKnow: false
askedFrequency: common
summary:
  - The basic types are string (text), number (any number), boolean (true/false), null and undefined.
  - "An array type means every item has the same type: string[] or Array<string>."
  - "A tuple is a fixed-length array where each position has its own type: [string, number]."
  - TypeScript has one number type for integers and decimals. bigint is separate, for very large whole numbers.
  - Use lowercase types (string, number). Uppercase String or Number are wrapper objects — avoid them.
cards:
  - q: Name the basic TypeScript types.
    a: string, number, boolean, null, undefined — plus bigint and symbol, which you use less often.
  - q: Two ways to write an array of strings?
    a: "string[] or Array<string>. They mean the same thing."
  - q: What is a tuple?
    a: "A fixed-length array where each position has a fixed type, like [string, number] for ['Hari', 3]."
  - q: Does TypeScript have separate int and float types?
    a: No. number covers both, like in JavaScript. bigint is for very large whole numbers.
  - q: string vs String — which should you use?
    a: Lowercase string. Uppercase String is the wrapper object type and is almost never what you want.
---

## 💡 What is it?

A **type** tells TypeScript what kind of value something holds.

The **basic types** are: `string` (text), `number` (any number), `boolean` (`true` or `false`), `null` and `undefined`.

For lists, you use an **array type**, like `string[]`. For a short list with a fixed order, you use a **tuple**, like `[string, number]`.

## 🏠 Real-life example

Think of the **boxes on a school admission form**.

- The **"Name" box** only accepts letters = `string`.
- The **"Age" box** only accepts a number = `number`.
- The **"Hostel needed? Yes / No" box** = `boolean`.
- A **list of subjects**, any number of them, all text = an array, `string[]`.
- The **"Date of birth: DD / MM / YYYY" box** has exactly 3 parts, each a number, in that order = a tuple, `[number, number, number]`.
- A box left **empty on purpose** = `null`. A box **never filled in** = `undefined`.

## 🧑‍💻 Code example

Save this as `basic.ts`. Run it with `node basic.ts`.

```ts
const name: string = 'Hari';                        // text
const age: number = 27;                             // any number: 27, 3.5, -1
const isActive: boolean = true;                     // only true or false
const skills: string[] = ['Node', 'React'];         // a list where every item is text
const scores: Array<number> = [80, 92];             // the same idea, other spelling
const point: [number, number] = [10, 20];           // a tuple: exactly 2 numbers, in order
const entry: [string, number] = ['Hari', 3];        // a tuple: text first, then a number
let notSet: string | undefined;                     // may be text, may be missing (undefined)

console.log(name, age, isActive);                   // Hari 27 true
console.log(skills.length, scores[1]);              // 2 92
console.log(point[0] + point[1], entry[0]);         // 30 Hari
console.log(notSet);                                // undefined (we never gave it a value)
```

**Output:**

```text
Hari 27 true
2 92
30 Hari
undefined
```

Now try two mistakes, and check with `npx tsc --noEmit`:

```ts
skills.push(42);                                    // a number into a string[] list
const point: [number, number] = [10, 20, 30];       // 3 items in a 2-item tuple
```

```text
basic-err.ts(2,13): error TS2345: Argument of type 'number' is not assignable to parameter of type 'string'.
basic-err.ts(3,7): error TS2322: Type '[number, number, number]' is not assignable to type '[number, number]'.
  Source has 3 element(s) but target allows only 2.
```

## 🔍 Deeper version

**All the basic (primitive) types:**

| Type | Holds | Example |
|---|---|---|
| `string` | text | `'Hari'` |
| `number` | integers and decimals | `3`, `3.5`, `-1`, `NaN` |
| `bigint` | very large whole numbers | `9007199254740993n` |
| `boolean` | `true` / `false` | `true` |
| `null` | "empty on purpose" | `null` |
| `undefined` | "not set yet" | `undefined` |
| `symbol` | a unique key | `Symbol('id')` |

**Lowercase, not uppercase.** Always write `string`, `number`, `boolean`. The uppercase `String`, `Number` and `Boolean` are wrapper **object** types from old JavaScript. They are almost never what you want.

**Arrays.** `string[]` and `Array<string>` are the same. Most teams use `string[]`. For an array of objects, write `Candidate[]`. For mixed items, use a union: `(string | number)[]`.

**Tuples.** A tuple has a fixed length and a fixed type at each position. You see them in real code:
- React's `useState` returns a tuple: `[value, setValue]`.
- `Object.entries()` gives `[key, value]` pairs.

You can **name** tuple parts so the code reads better: `type Range = [start: number, end: number]`. You can also make them read-only: `readonly [number, number]`.

**`null` vs `undefined`.** With `"strict": true`, they are **not** included in other types. A `string` can't be `null`. If a value may be missing, say so: `string | null` or `string | undefined`. Then TypeScript makes you check before using it.

**Objects.** For object shapes, use `type` or `interface`, covered in [type vs interface](topic:typescript/type-vs-interface).

## 🎯 Why do we use it?

- The basic types are the building blocks for every other type.
- Array types stop wrong items from sneaking into a list.
- Tuples make "a pair of values in a fixed order" clear and safe, like `[value, setValue]`.
- With strict null checks, you can't forget that a value might be missing.

## ⚠️ Common mistakes

- **Using `String` instead of `string`.** Use the lowercase type.
- **Using a tuple for a long or changing list.** Tuples are for short, fixed lists. Use an array for lists that grow.
- **Forgetting `| null` or `| undefined`** for values that can be missing, then fighting errors later. Model the missing case honestly.
- **Writing types everywhere.** `const age = 27` is already a `number`. Let TypeScript [infer](topic:typescript/type-inference) simple types.

## 🗣️ How to answer in an interview

> "The basic types are string, number and boolean, plus null and undefined, and the less common bigint and symbol. There's only one number type for both integers and decimals, like in JavaScript. I always use the lowercase types, never String or Number, which are wrapper objects.
>
> For lists I use array types, like string[] or Candidate[]. For a short fixed-order list I use a tuple, like [string, number]. React's useState returns a tuple: the value and the setter.
>
> With strict mode on, null and undefined aren't part of other types, so if something can be missing I write it as string | undefined, and TypeScript makes me handle that case."

## 🔁 Follow-up questions

### What is the difference between `null` and `undefined`?

`undefined` usually means "never set". `null` usually means "empty on purpose". With strict mode, you must include them in a type explicitly, like `string | null`.

### What does `useState` return, in TypeScript terms?

A tuple: `[state, setState]`. For example, `useState<number>(0)` returns `[number, Dispatch<SetStateAction<number>>]`.

### How do you type an array of objects?

Define the object shape once, then use it with `[]`: `type Candidate = { name: string }`, then `const list: Candidate[] = []`.

### What is `bigint` for?

Whole numbers larger than `Number.MAX_SAFE_INTEGER` (about 9 quadrillion). For example, some database IDs. You write them with an `n` at the end: `10n`.

## ✅ Quick check

### 1. Does this compile?

```ts
const ids: number[] = [1, 2, '3'];                  // a number list with a text item
```

:::answer
**No.** `'3'` is a string, but the array only allows numbers. TypeScript reports: Type 'string' is not assignable to type 'number'.
:::

### 2. Which type fits `['Hari', 3]` best if it is always "name, then years"?

- A) `string[]`
- B) `[string, number]`
- C) `any[]`

:::answer
**B) `[string, number]`.** It is a tuple: the first item is text, the second is a number, and there are exactly two.
:::

### 3. With `"strict": true`, does this compile? `let email: string = null;`

:::answer
**No.** In strict mode, `null` is not part of `string`. Write `let email: string | null = null;` if the value can be empty.
:::
