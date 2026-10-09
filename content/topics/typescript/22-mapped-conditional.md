---
title: Mapped and conditional types
stack: typescript
order: 22
level: Advanced
mustKnow: false
askedFrequency: sometimes
summary:
  - "A mapped type loops over the keys of a type and builds a new type: { [K in keyof T]: … }."
  - "Built-in utility types like Partial, Readonly, Pick and Record are mapped types under the hood."
  - "A conditional type is an if/else for types: T extends string ? 'yes' : 'no'."
  - "infer lets a conditional type catch a part of another type, like the item type of an array."
  - Use them for reusable library-style types. In everyday app code, the built-in utility types are usually enough.
cards:
  - q: What is a mapped type?
    a: "A type that loops over the keys of another type and changes each one, like { readonly [K in keyof T]: T[K] } which makes every field read-only."
  - q: What is a conditional type?
    a: "A type-level if/else: T extends U ? X : Y. If T fits U, the result is X, otherwise Y."
  - q: What does infer do?
    a: "Inside a conditional type, it captures part of a type into a new name, e.g. T extends (infer U)[] ? U : never gets the array's item type."
  - q: How is Partial<T> built?
    a: "As a mapped type: { [K in keyof T]?: T[K] }. It adds ? to every key."
  - q: What does "as" do inside a mapped type?
    a: "Key remapping: it renames keys while looping, e.g. turning name into getName with a template literal type."
---

## 💡 What is it?

These are tools for **making new types from old types**.

- A **mapped type** loops over every key of a type and changes it. For example, it can make every field read-only.
- A **conditional type** is an **if/else for types**: "if T is a string, then this type, else that type".
- **`infer`** lets a conditional type pull out a piece of another type. For example, "the type of the items in this array".

## 🏠 Real-life example

Think of a **school photocopier** with special settings.

- The **original report card** = your starting type (`Candidate`).
- **"Copy every page, but stamp 'READ ONLY' on each"** = a mapped type (`MyReadonly`). It goes through every field and changes it the same way.
- **"If the page is a marks sheet, print in colour, else black and white"** = a conditional type.
- **"Take just the student's name from the top of the page"** = `infer`. It picks out one piece.

You don't rewrite the report card by hand. The machine builds the new copy from the old one.

## 🧑‍💻 Code example

Save this as `types.ts`. Check it with `npx tsc --noEmit`, then run it with `node types.ts` (Node 24).

```ts
type Candidate = { id: string; name: string; experience: number }; // our starting shape

type MyReadonly<T> = { readonly [K in keyof T]: T[K] };   // MAPPED type: loop over every key K of T, make it readonly
type Getters<T> = {                                       // mapped type with "key remapping" (as)
  [K in keyof T as `get${Capitalize<string & K>}`]: () => T[K]; // name → getName, value → a function returning it
};                                                        // end of Getters
type IsText<T> = T extends string ? 'yes' : 'no';         // CONDITIONAL type: like a ternary, but for types
type ItemOf<T> = T extends (infer U)[] ? U : never;       // infer U = "catch the item type of an array"

const c: MyReadonly<Candidate> = { id: 'c1', name: 'Asha', experience: 3 }; // a read-only candidate
const getters: Getters<Candidate> = {                     // TypeScript demands exactly getId, getName, getExperience
  getId: () => c.id,                                      // returns string
  getName: () => c.name,                                  // returns string
  getExperience: () => c.experience,                      // returns number
};                                                        // end of getters
const a: IsText<'hello'> = 'yes';                         // 'hello' is a string → type is 'yes'
const b: IsText<42> = 'no';                               // 42 is not a string → type is 'no'
const skill: ItemOf<string[]> = 'Node';                   // item of string[] is string

console.log(getters.getName(), getters.getExperience(), a, b, skill); // print the values
c.name = 'Ravi';                                          // mistake on purpose: name is readonly now
```

**Output of `npx tsc --noEmit`:**

```text
types.ts(21,3): error TS2540: Cannot assign to 'name' because it is a read-only property.
```

**Output of `node types.ts`:**

```text
Asha 3 yes no Node
```

The last line is a mistake on purpose. TypeScript catches it. Node still runs the file, because Node only removes types and never checks them.

## 🔍 Deeper version

**Mapped type syntax:**

```ts
type Mapped<T> = { [K in keyof T]: T[K] };   // K = each key of T, T[K] = the type of that key
```

You can add or remove modifiers:
- `readonly` / `-readonly`: add or remove read-only.
- `?` / `-?`: make fields optional or required. `Required<T>` is `{ [K in keyof T]-?: T[K] }`.

**The built-in utility types are mapped types.** For example:

```ts
type MyPartial<T> = { [K in keyof T]?: T[K] };                    // = Partial<T>
type MyPick<T, K extends keyof T> = { [P in K]: T[P] };            // = Pick<T, K>
type MyRecord<K extends string, V> = { [P in K]: V };              // = Record<K, V>
```

**Key remapping with `as`.** You can rename keys while looping, using [template literal types](topic:typescript/union-literal) and helpers like `Capitalize`. If you remap a key to `never`, it is **removed**. That's how you filter keys:

```ts
type OnlyStrings<T> = { [K in keyof T as T[K] extends string ? K : never]: T[K] }; // keep only string fields
```

**Conditional types** work like the `? :` ternary operator:

```ts
type IsText<T> = T extends string ? 'yes' : 'no';   // "extends" here means "fits into"
```

**They distribute over unions.** When `T` is a union, the condition runs on **each member** separately:

```ts
type NoNull<T> = T extends null | undefined ? never : T;   // like the built-in NonNullable<T>
type R = NoNull<string | null>;                            // string (null became never and vanished)
```

**`infer` captures a piece of a type:**

```ts
type ItemOf<T> = T extends (infer U)[] ? U : never;                        // item type of an array
type Result<F> = F extends (...args: any[]) => infer R ? R : never;        // how ReturnType<F> works
type Unwrap<P> = P extends Promise<infer V> ? V : P;                       // like the built-in Awaited<P>
```

**Where you meet these in real work:**
- Typing API helpers: `Awaited<ReturnType<typeof fetchJobs>>` gives "what the promise resolves to".
- Form libraries: turn a data type into an "errors" type with the same keys.
- Redux Toolkit and Zod: their types use these patterns heavily.

## 🎯 Why do we use it?

- **No copy-paste types.** Build `UpdateJobInput` from `Job` instead of writing it again.
- **Types stay in sync.** Add a field to `Candidate`, and every mapped type updates automatically.
- **Reading library types.** Knowing mapped and conditional types helps you understand error messages from libraries like Zod and Redux Toolkit.

## ⚠️ Common mistakes

- **Over-engineering app code** with clever types nobody else can read. Prefer the built-ins (`Partial`, `Pick`, `Omit`, `Record`).
- **Forgetting that conditional types distribute over unions**, and getting a surprising result. Wrap both sides in `[ ]` (`[T] extends [string]`) to stop it.
- **Thinking these types do anything at runtime.** Like all types, they vanish. `MyReadonly` doesn't freeze the object; `Object.freeze` does.
- **Using `infer` outside a conditional type.** It only works in the `extends` part of a conditional type.

## 🗣️ How to answer in an interview

> "Mapped types loop over the keys of a type and build a new one, using the `[K in keyof T]` syntax. The built-in utility types like Partial, Readonly, Pick and Record are mapped types. With the `as` clause, I can also rename or filter keys.
>
> Conditional types are an if/else for types, like `T extends string ? A : B`, and they distribute over unions. With `infer`, I can capture part of a type. For example, ReturnType and Awaited are built that way.
>
> In app code, I mostly use the built-in utilities, and something like `Awaited<ReturnType<typeof fn>>` to get a function's result type. I only write custom mapped or conditional types for shared helpers, because readability matters more than clever types."

## 🔁 Follow-up questions

### How would you write `Partial<T>` yourself?

`type MyPartial<T> = { [K in keyof T]?: T[K] };`. It loops over every key and adds `?`.

### What is `Awaited<T>` used for?

It unwraps a promise type. `Awaited<Promise<Job[]>>` is `Job[]`. It's often used with `ReturnType` to get the result type of an async function.

### What does "distributive" mean for conditional types?

When you pass a union, the condition runs on each member separately, and the results are joined back into a union. So `NonNullable<string | null>` gives `string`.

### How do you make a "deep" read-only type?

Use a mapped type that calls itself for nested objects: `type DeepReadonly<T> = { readonly [K in keyof T]: T[K] extends object ? DeepReadonly<T[K]> : T[K] };`. Functions and arrays need extra care in real code.

## ✅ Quick check

### 1. What is `X`?

```ts
type X = Exclude<'a' | 'b' | 'c', 'a'>;   // Exclude is a conditional type
```

:::answer
**`'b' | 'c'`.** `Exclude<T, U>` is `T extends U ? never : T`. It runs for each member, and `'a'` becomes `never`, which disappears.
:::

### 2. What does `ItemOf<number[]>` give, if `type ItemOf<T> = T extends (infer U)[] ? U : never`?

:::answer
**`number`.** `infer U` catches the item type of the array.
:::

### 3. True or false: a value typed as `MyReadonly<Candidate>` can't be changed at runtime.

:::answer
**False.** It's only a compile-time check. At runtime it's a normal object. Use `Object.freeze` if you need it frozen at runtime too.
:::
