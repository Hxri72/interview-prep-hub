---
title: Generics
stack: typescript
order: 12
level: Intermediate
mustKnow: true
askedFrequency: very common
summary:
  - A generic is a "blank" for a type, usually called `T`, that gets filled in later.
  - One generic function or type works for many types and still stays fully type-safe.
  - TypeScript usually fills in `T` by itself from the arguments you pass.
  - "A classic example: `ApiResponse<T>` — one response shape, where `data` is a different type for each endpoint."
  - Built-in generics you already use include `Array<T>`, `Promise<T>`, `useState<T>()` and `Record<K, V>`.
cards:
  - q: What are generics?
    a: Type parameters — a blank like T that is filled in later — so one function or type works with many types and stays type-safe.
  - q: Give a real example of a generic type.
    a: "ApiResponse<T> = { success: boolean; data: T }. ApiResponse<Candidate[]> and ApiResponse<Job> share one shape but have different data."
  - q: Why not just use any?
    a: any loses the type. A generic keeps it — whatever type goes in comes back out, so autocomplete and errors still work.
  - q: Do you always have to write the type in angle brackets?
    a: "No. TypeScript usually infers T from the arguments. You write it yourself when it can't, like useState<Candidate[]>([])."
  - q: Name some built-in generics.
    a: "Array<T>, Promise<T>, Map<K, V>, Record<K, V>, Partial<T>, and React's useState<T>."
---

## 💡 What is it?

A **[generic](glossary:generic)** is a **blank space for a type**. It's usually called `T`, and it gets filled in later.

With generics, you write **one** function or type that works for **many** types. It also stays safe, because TypeScript remembers which type went in.

You already use generics: `Array<string>`, `Promise<Candidate>` and `useState<number>()` are all generics.

## 🏠 Real-life example

Think of a **school lunch box with a name slip**.

The lunch box is the same for every student. The slip says what's inside today: "rice", "chapati" or "sandwich".

- The **lunch box** = a generic type, like `ApiResponse<T>`.
- The **name slip** = the type parameter `T`.
- **"Rice" on the slip** = `ApiResponse<Rice>`. Everyone knows rice is inside before opening it.
- A box with **no slip at all** = `any`. You have to open it and guess.

So generics are "one box, but always labelled".

## 🧑‍💻 Code example

Save this as `generics.ts`. Run it with `node generics.ts`.

```ts
type Candidate = { id: string; name: string };                     // one candidate
type Job = { id: string; title: string };                          // one job

interface ApiResponse<T> {                                         // T = a blank for "what kind of data"
  success: boolean;                                                // true or false
  data: T;                                                         // data is whatever T is
}                                                                  // end of ApiResponse

function first<T>(list: T[]): T | undefined {                      // T = the type of the items in the list
  return list[0];                                                  // may be undefined if the list is empty
}                                                                  // end of first

function wrap<T>(data: T): ApiResponse<T> {                        // put any data inside the response shape
  return { success: true, data };                                  // T flows from input to output
}                                                                  // end of wrap

const candidates: Candidate[] = [{ id: 'c1', name: 'Asha' }];      // a list of candidates
const jobs: Job[] = [{ id: 'j1', title: 'Node.js Developer' }];    // a list of jobs

const c = first(candidates);                                       // T becomes Candidate automatically
const j = first(jobs);                                             // T becomes Job automatically
const res = wrap(candidates);                                      // ApiResponse<Candidate[]>

console.log(c?.name);                                              // ?. because c may be undefined
console.log(j?.title);                                             // TypeScript knows j has a title
console.log(res.data.length, res.success);                         // data is Candidate[] here
console.log(first<number>([]));                                    // T written by hand; empty list → undefined
```

**Output:**

```text
Asha
Node.js Developer
1 true
undefined
```

**The type is kept.** Try `first<Job>([...])?.name`. `npx tsc --noEmit --strict` says:

```text
error TS2339: Property 'name' does not exist on type 'Job'.
```

With `any` instead of `T`, this mistake would compile and print `undefined` at runtime.

## 🔍 Deeper version

**Inference.** In `first(candidates)`, TypeScript sees `Candidate[]` and sets `T = Candidate`. You only write `<T>` yourself when there is nothing to infer from, like an empty array: `useState<Candidate[]>([])`.

**Generic types and interfaces:**

```ts
interface ApiResponse<T> { success: boolean; data: T }       // a generic interface
type Paginated<T> = { items: T[]; total: number; page: number }; // a generic type alias
type CandidatePage = ApiResponse<Paginated<Candidate>>;       // generics can nest
```

**Several type parameters.** Names are free, but conventions help: `T` for a type, `K` for a key, `V` for a value, `E` for an error.

```ts
function toMap<K, V>(pairs: [K, V][]): Map<K, V> {  // two blanks: key type and value type
  return new Map(pairs);                            // Map<K, V> keeps both types
}                                                   // end of toMap
```

**Defaults.** `interface ApiResponse<T = unknown>` means "if nobody fills in T, use `unknown`".

**Constraints.** Sometimes `T` must have certain fields, like an `id`. You write `<T extends { id: string }>`. That's the next topic: [generic constraints](topic:typescript/generic-constraints).

**Generics vs `any` vs `unknown`:**

| | Keeps the type? | Safe to use? |
|---|---|---|
| `any` | no | no checks at all |
| `unknown` | no | must narrow first |
| `T` (generic) | **yes**, the caller's type flows through | fully checked |

**In React and Express:**
- `useState<Candidate | null>(null)` and `useRef<HTMLInputElement>(null)`.
- `Request<Params, ResBody, ReqBody>` in Express types the params and body.
- A typed fetch helper: `async function getJson<T>(url: string): Promise<T>`. Be careful: the `T` here is a **promise you make**, not a check. Validate outside data at runtime with [Zod](topic:typescript/zod).

## 🎯 Why do we use it?

- **No copy-paste.** One `first`, one `ApiResponse`, one table component works for candidates, jobs and users.
- **No lost types.** Unlike `any`, the exact type comes back out, so autocomplete and errors keep working.
- **Clear API contracts.** `ApiResponse<Candidate[]>` tells the frontend exactly what an endpoint returns.
- **Reusable components and hooks.** A `useFetch<T>()` hook or a `Table<T>` component can serve every page.

## ⚠️ Common mistakes

- **Using `any` when a generic fits.** You lose all checking for the caller.
- **Adding `<T>` that is used only once.** If `T` appears in only one place, it adds nothing. A plain type is clearer.
- **Trusting `getJson<T>()` blindly.** The generic doesn't check the server's real data. Validate at runtime.
- **Too many type parameters.** `<A, B, C, D>` is hard to read. Simplify, or use one object type.

## 🗣️ How to answer in an interview

> "Generics are type parameters — a blank like `T` that's filled in later — so one function or type works with many types and still stays type-safe. For example, I'd define `ApiResponse<T>` with `success` and `data: T`. Then `ApiResponse<Candidate[]>` and `ApiResponse<Job>` share one shape, but each has the right data type.
>
> TypeScript usually infers `T` from the arguments, so I only write it when it can't, like `useState<Candidate[]>([])`. The big difference from `any` is that the type flows through: what goes in comes back out, so autocomplete and errors still work. When `T` must have certain fields, I add a constraint like `T extends { id: string }`."

[FILL IN: a generic type or helper you used at SkillKeepr, e.g. a typed API response or a shared table component — only if true.]

## 🔁 Follow-up questions

### What is the difference between `Array<string>` and `string[]`?

Nothing. They are the same type. `string[]` is the short form.

### When does TypeScript fail to infer `T`?

When there's nothing to look at, like `useState([])` (it becomes `never[]`) or a function that only returns `T`. Write it yourself then: `useState<Candidate[]>([])`.

### Can a class be generic?

Yes. `class Cache<T> { private items = new Map<string, T>(); }` stores one type of value, chosen when you create it.

### What is a generic constraint?

A rule on what `T` can be, like `<T extends { id: string }>`. See [generic constraints](topic:typescript/generic-constraints).

## ✅ Quick check

### 1. What is the type of `x`?

```ts
function first<T>(list: T[]): T | undefined { return list[0]; } // the generic from above
const x = first([10, 20, 30]);                                  // a list of numbers
```

:::answer
**`number | undefined`.** TypeScript infers `T = number` from the array.
:::

### 2. What's the main advantage of `function wrap<T>(data: T): T` over `function wrap(data: any): any`?

:::answer
The generic keeps the type. `wrap('hi')` returns a `string`, so the caller still gets checking and autocomplete. With `any`, everything is unchecked.
:::

### 3. True or false: `ApiResponse<Candidate>` checks at runtime that the server really sent a candidate.

:::answer
**False.** Types are removed when the code runs. The generic only describes what you expect. Use runtime validation (like Zod) for real checks.
:::
