---
title: Type inference
stack: typescript
order: 3
level: Basic
mustKnow: false
askedFrequency: common
summary:
  - Type inference means TypeScript works out a type by itself from the value, so you don't have to write it.
  - "let city = 'Kochi' is inferred as string. const country = 'India' is inferred as the exact value 'India'."
  - TypeScript also infers return types, array types and object shapes.
  - Write types yourself for function parameters, public function returns, and empty values like [] or useState(null).
  - Inference keeps code short; explicit types make contracts clear. Good code uses both.
cards:
  - q: What is type inference?
    a: TypeScript working out a type by itself from the value or expression, so you don't need to write it.
  - q: "What type is let city = 'Kochi'? And const country = 'India'?"
    a: "city is string (a let can change to other text). country is the literal type 'India' (a const can never change)."
  - q: Where should you still write types yourself?
    a: Function parameters, return types of exported/public functions, and values that start empty, like [] or useState(null).
  - q: What type does const list = [] get?
    a: "With strict mode it starts as an \"evolving\" any[] that TypeScript narrows as you push. It's clearer to write the type, e.g. const list: string[] = []."
  - q: Can TypeScript infer function parameter types?
    a: Usually no — you must write them. The exception is callbacks, like in arr.map(x => …), where x is inferred from the array.
---

## 💡 What is it?

**Type inference** means TypeScript **works out the type by itself**.

If you write `let city = 'Kochi'`, TypeScript sees the text and decides `city` is a `string`. You don't need to write `: string`.

It works for variables, return values, arrays, objects and callbacks. You only write types where TypeScript can't guess, or where you want to make a promise clear.

## 🏠 Real-life example

Think of a **school librarian sorting new books**.

When a book arrives, she looks at the cover and the first page. She can see it is a science book, so she puts it on the science shelf. Nobody needs to stick a "science" label on it first.

But for a **blank notebook**, she can't guess. Someone must tell her: "this is for maths".

- **Looking at the book and guessing the shelf** = type inference.
- **A clearly printed book** = a value like `'Kochi'` or `[1, 2, 3]`.
- **A blank notebook** = an empty value like `[]` or `null`.
- **Telling her "this is for maths"** = writing the type yourself.

## 🧑‍💻 Code example

Save this as `infer.ts`. Run it with `node infer.ts`.

```ts
let city = 'Kochi';                                 // TS infers: city is a string
const country = 'India';                            // const → TS infers the exact value 'India'
const nums = [1, 2, 3];                             // TS infers: number[]
const user = { name: 'Hari', years: 3 };            // TS infers: { name: string; years: number }

function double(n: number) {                        // we type the parameter...
  return n * 2;                                     // ...TS infers the return type: number
}                                                   // end of double

city = 'Calicut';                                   // fine: still a string
console.log(city, country, nums.map(double), user.years); // Calicut India [ 2, 4, 6 ] 3
```

**Output:**

```text
Calicut India [ 2, 4, 6 ] 3
```

The inferred types still protect you. Try this and run `npx tsc --noEmit`:

```ts
let city = 'Kochi';                                 // inferred as string
city = 5;                                           // a number into a string variable
const user = { name: 'Hari', years: 3 };            // inferred object shape
user.email = 'h@x.com';                             // a field that isn't in the shape
```

```text
infer-err.ts(2,1): error TS2322: Type 'number' is not assignable to type 'string'.
infer-err.ts(4,6): error TS2339: Property 'email' does not exist on type '{ name: string; years: number; }'.
```

## 🔍 Deeper version

**`let` vs `const` (widening).** With `let`, the value can change later, so TypeScript picks the **wider** type: `let city = 'Kochi'` → `string`. With `const`, the value can never change, so TypeScript keeps the **exact** value: `const country = 'India'` → the literal type `'India'`. See [literal types](topic:typescript/union-literal).

**Objects and arrays still widen.** `const user = { role: 'admin' }` gives `role: string`, because object fields can be changed. To keep exact values, add `as const`:

```ts
const config = { role: 'admin', port: 3000 } as const; // every field becomes readonly and exact
// config.role is the type 'admin', config.port is the type 3000
```

**Return types.** TypeScript infers what a function returns. Many teams still **write the return type** on exported functions. It makes the contract clear, and a mistake inside the function shows up at the function, not far away where it's used.

**Contextual typing (callbacks).** In `nums.map(n => n * 2)`, you don't type `n`. TypeScript knows `nums` is `number[]`, so `n` must be a `number`. The same happens with event handlers in React: `onClick={e => …}` gets a typed event.

**When inference can't help:**

| Situation | Problem | Fix |
|---|---|---|
| Function parameters | TypeScript can't guess them | Write them: `(id: string) => …` |
| `const list = []` | Starts as an "evolving" `any[]` | `const list: Candidate[] = []` |
| `useState(null)` | Type becomes just `null` | `useState<Candidate \| null>(null)` |
| `JSON.parse(text)` | Returns `any` | Type it as `unknown`, then validate |

**`satisfies`.** It checks that a value matches a type **without** losing the exact inferred type:

```ts
type Routes = Record<string, { path: string }>;     // any key, each with a path
const routes = { home: { path: '/' }, jobs: { path: '/jobs' } } satisfies Routes; // checked against Routes
routes.jobs.path;                                   // OK: TS still knows the exact keys home and jobs
routes.typo;                                        // error: 'typo' does not exist — the keys were kept
```

With a normal annotation (`const routes: Routes = …`), TypeScript would forget the exact keys, and `routes.typo` would not be an error.

## 🎯 Why do we use it?

- **Less typing, cleaner code.** No need to write `: string` on every line.
- **Still fully type-safe.** Inferred types are checked just like written ones.
- **Types stay correct after changes.** If you change a value, the inferred type changes with it.
- **Explicit types where they matter.** You write types at the "edges": inputs, outputs and empty starting values.

## ⚠️ Common mistakes

- **Writing obvious types**, like `const count: number = 0`. It adds noise.
- **Leaving empty values untyped**, like `useState(null)` or `const list = []`. You then fight errors later.
- **Not typing function parameters.** Without strict mode they silently become `any`. With strict mode, you get an "implicitly has an 'any' type" error.
- **Expecting `const` objects to keep exact values.** Only the variable is constant. Use `as const` for exact field values.

## 🗣️ How to answer in an interview

> "Type inference means TypeScript works out a type from the value, so I don't have to write it. let city = 'Kochi' becomes string, and a const string becomes the exact literal type. It also infers return types, array element types, and callback parameters, like the item in arr.map.
>
> I let inference handle local variables. I write types at the edges: function parameters, the return type of exported functions, and values that start empty, like useState(null) or an empty array. For JSON or API data, I type it as unknown and validate it, because inference would give me any."

## 🔁 Follow-up questions

### What is "widening"?

When TypeScript picks a wider type than the exact value. `let x = 'a'` becomes `string`, not `'a'`, because a `let` can change. `const` and `as const` stop widening.

### What does `as const` do?

It makes the value **deeply readonly** and keeps **exact literal types**. `['a', 'b'] as const` becomes `readonly ['a', 'b']` instead of `string[]`.

### `satisfies` vs a type annotation — what's the difference?

`const x: Route = …` makes `x` exactly the type `Route`, so extra details are lost. `… satisfies Route` checks the value against `Route` but keeps its more exact inferred type.

### Why type `useState(null)`?

Without a type, the state's type is just `null`, so you can never set a real object. Write `useState<Candidate | null>(null)`.

## ✅ Quick check

### 1. What type does TypeScript infer for `x` and `y`?

```ts
let x = 10;                                         // a let
const y = 10;                                       // a const
```

:::answer
`x` is **`number`** (it can change later). `y` is the literal type **`10`** (it can never change).
:::

### 2. Does this compile?

```ts
const scores = [90, 85];                            // inferred as number[]
scores.push('A+');                                  // add a text grade
```

:::answer
**No.** `scores` is inferred as `number[]`, so you can't push a string. Error: Argument of type 'string' is not assignable to parameter of type 'number'.
:::

### 3. Where is writing a type yourself most useful?

- A) `const count: number = 0`
- B) `function find(id) { … }`
- C) `const name: string = 'Hari'`

:::answer
**B.** Function parameters can't be inferred. Write `function find(id: string)`. A and C are obvious from the value.
:::
