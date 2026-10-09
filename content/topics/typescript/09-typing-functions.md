---
title: Typing functions (parameters, return types, optional params)
stack: typescript
order: 9
level: Basic
mustKnow: false
askedFrequency: common
summary:
  - "Give every parameter a type, like `(a: number, b: number)`. TypeScript then checks every call."
  - "The return type comes after the brackets, like `): number`. Write it for public and exported functions."
  - "`title?: string` means the parameter is optional. `experience = 0` gives it a default value."
  - An `async` function always returns a `Promise<T>`, like `Promise<Candidate>`.
  - "A function type looks like `(id: string) => void`. Use it for callbacks and props."
cards:
  - q: How do you type a function's parameters and return value?
    a: "Put a type after each parameter and after the brackets: function add(a: number, b: number): number { … }."
  - q: "What is the difference between `title?: string` and `title: string | undefined`?"
    a: With `?` the caller can leave the argument out. With `| undefined` the caller must still pass something, even if it is undefined.
  - q: What is the return type of an async function that returns a number?
    a: "Promise<number>. An async function always wraps its result in a Promise."
  - q: How do you write the type of a callback that takes an id and returns nothing?
    a: "(id: string) => void"
  - q: Should you always write the return type?
    a: TypeScript can infer it. But writing it on exported functions catches mistakes inside the function and documents the contract.
---

## 💡 What is it?

A [function](glossary:function) takes some values in and gives a value back.

In TypeScript, you write **what type each input is** and **what type comes out**. Then the editor checks every place you call the function.

If you pass the wrong kind of value, or forget one, you get a red line before you run the code.

## 🏠 Real-life example

Think of a **juice machine at a shop**.

The machine has a label: "Put in **2 oranges**. You get **1 glass of juice**."

- The **label** = the function's types.
- **"2 oranges"** = the parameter types, like `(a: number, b: number)`.
- **"1 glass of juice"** = the return type, like `: number`.
- An **"add ice? (optional)"** button = an optional parameter, `ice?: boolean`.
- A **"sugar: normal unless you choose"** setting = a default value, `sugar = 'normal'`.

If you try to put in an apple, the shopkeeper stops you before the machine starts. TypeScript is that shopkeeper.

## 🧑‍💻 Code example

Save this as `functions.ts`. Run it with `node functions.ts` (Node 24 runs simple TypeScript files directly).

```ts
type Candidate = { name: string; experience: number };          // the shape of one candidate

function add(a: number, b: number): number {                     // two numbers in, one number out
  return a + b;                                                  // give back the sum
}                                                                // end of add

const greet = (name: string, title?: string): string =>          // title? = optional, may be missing
  `Hello ${title ?? ''}${title ? ' ' : ''}${name}`;              // ?? '' = use '' when title is missing

function makeCandidate(name: string, experience = 0): Candidate { // experience = 0 → default value
  return { name, experience };                                   // build and return the object
}                                                                // end of makeCandidate

async function getYears(c: Candidate): Promise<number> {         // async → always returns a Promise
  return c.experience;                                           // the number is wrapped in a Promise
}                                                                // end of getYears

const onSelect: (id: string) => void = (id) => console.log('picked', id); // a variable that holds a function type

console.log(add(2, 3));                                          // 5
console.log(greet('Hari'));                                      // no title given
console.log(greet('Hari', 'Mr.'));                               // with a title
console.log(makeCandidate('Asha'));                              // experience falls back to 0
getYears(makeCandidate('Ravi', 4)).then(console.log);            // prints 4 when the Promise finishes
onSelect('c-101');                                               // call the function stored in onSelect
```

**Output:**

```text
5
Hello Hari
Hello Mr. Hari
{ name: 'Asha', experience: 0 }
picked c-101
4
```

`4` prints last because the Promise finishes after the normal code.

**Now try a mistake.** Make a file `bad.ts`:

```ts
function add(a: number, b: number): number { return a + b; } // the same add function
add(2, '3');                                                 // a string instead of a number
add(2);                                                      // one argument is missing
```

Run `npx tsc --noEmit --strict bad.ts`:

```text
bad.ts(2,8): error TS2345: Argument of type 'string' is not assignable to parameter of type 'number'.
bad.ts(3,1): error TS2554: Expected 2 arguments, but got 1.
```

## 🔍 Deeper version

**Parameter types are required, return types are often inferred.** TypeScript can't guess a parameter's type, so in strict mode an untyped parameter becomes an error ("implicitly has an 'any' type"). The return type it *can* work out from the `return` lines. Many teams still write return types on exported functions. This catches a wrong `return` inside the function, instead of at every caller.

**Optional vs default vs `| undefined`:**

| You write | Caller can skip it? | Type inside the function |
|---|---|---|
| `title?: string` | yes | `string \| undefined` |
| `title = 'Mr.'` | yes | `string` (never undefined) |
| `title: string \| undefined` | **no**, must pass something | `string \| undefined` |

Optional parameters must come **after** required ones.

**Rest parameters** collect many arguments into one array:

```ts
function total(...scores: number[]): number {     // ...scores = all arguments, as an array of numbers
  return scores.reduce((sum, s) => sum + s, 0);   // add them up, starting from 0
}                                                 // end of total
total(70, 85, 90);                                // 245
```

**Function types.** You can describe a function as a type and reuse it. This is how you type callbacks and React props:

```ts
type OnSelect = (id: string) => void;             // takes a string, returns nothing useful
type Validator = (value: string) => string | null; // returns an error message or null
```

`void` means "the return value is not used". A function typed as returning `void` may still return something. TypeScript just won't let you use it.

**Typing `this` and overloads (rare).** You can declare several call signatures for one function ("overloads"), for example when a string input gives a string and a number input gives a number. In most app code, a [union type](glossary:union-type) or a [generic](topic:typescript/generics) is simpler.

**Async functions** always return `Promise<T>`. If you write `async function load(): Candidate`, TypeScript gives an error and asks for `Promise<Candidate>`.

## 🎯 Why do we use it?

- **Wrong calls are caught at once.** Passing a string where a number is needed, or forgetting an argument, shows up in the editor.
- **The function signature is documentation.** A teammate reads `(candidateId: string, round?: number): Promise<Interview>` and knows how to use it, without opening the code.
- **Refactoring is safer.** Add a required parameter, and every call that misses it turns red.
- **Callbacks and props get checked too.** An `onSelect` prop typed as `(id: string) => void` stops someone passing a function with the wrong shape.

## ⚠️ Common mistakes

- **Leaving parameters untyped.** In non-strict mode they silently become `any`, and you lose all checking.
- **Putting an optional parameter before a required one.** `(title?: string, name: string)` is an error. Put optional ones last.
- **Writing `: Candidate` on an async function.** It must be `: Promise<Candidate>`.
- **Using `Function` as a type.** It accepts any function and checks nothing. Write the real shape, like `(id: string) => void`.

## 🗣️ How to answer in an interview

> "In TypeScript I type every parameter and usually the return type too, like `function add(a: number, b: number): number`. Parameters must be typed in strict mode. The return type can be inferred, but I write it on exported functions because it documents the contract and catches a wrong return inside the function.
>
> For optional values I use `?`, or a default value like `experience = 0`, which also removes `undefined` from the type. Optional parameters go last. Async functions return `Promise<T>`. For callbacks and React props I write function types like `(id: string) => void`, never the loose `Function` type."

[FILL IN: one function signature from your SkillKeepr backend that you can explain, e.g. a service method's parameters and return type.]

## 🔁 Follow-up questions

### What does `void` mean as a return type?

It means the caller should not use the return value. It's common for callbacks and event handlers. `never` is different: it means the function never returns at all, for example because it always throws.

### When would you not write a return type?

For small private helpers and inline arrow functions, inference is fine and keeps code short. For exported functions, service methods and API handlers, I write it.

### How do you type a function that can take a string or a number?

Use a union, `(id: string | number)`, and narrow inside with `typeof`. See [narrowing](topic:typescript/narrowing). If the output type depends on the input type, use a [generic](topic:typescript/generics) or overloads.

### What is a rest parameter?

`...scores: number[]` collects all remaining arguments into one array. It must be the last parameter.

## ✅ Quick check

### 1. Does this compile?

```ts
function greet(title?: string, name: string) {    // optional first, required second
  return `${title} ${name}`;                      // build the greeting
}
```

:::answer
**No.** A required parameter cannot follow an optional one. Move `title?` to the end, or give it a default value.
:::

### 2. What is the correct return type?

```ts
async function getCount(): ??? {                  // what goes here?
  return 5;                                       // returns a number
}
```

- A) `number`
- B) `Promise<number>`
- C) `void`

:::answer
**B) `Promise<number>`.** An async function always returns a Promise.
:::

### 3. Inside `function f(x = 10)`, what is the type of `x`?

:::answer
**`number`.** A default value means `x` is never `undefined` inside the function, even though the caller may leave it out.
:::
