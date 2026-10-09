---
title: Currying and function composition
stack: javascript
order: 34
level: Advanced
mustKnow: false
askedFrequency: sometimes
summary:
  - "Currying turns a function with many inputs into a chain of functions that take one input each: add(1)(2)(3)."
  - "You can give some inputs now and the rest later. This makes ready-made helpers, like sayHi = greet('Hi')."
  - Currying works because of closures. Each inner function remembers the inputs given so far.
  - "Composition joins small functions into one bigger function. compose runs them right to left; pipe runs them left to right."
  - Use them for reusable helpers and clean data steps. Don't overuse them, or the code becomes hard to read.
cards:
  - q: What is currying?
    a: Turning a function that takes many inputs, like add(a, b, c), into a chain of functions that take one input each, like add(a)(b)(c).
  - q: What is partial application?
    a: Giving a function some of its inputs now and getting back a new function that waits for the rest, e.g. sayHi = greet('Hi').
  - q: What is the difference between compose and pipe?
    a: Both join functions into one. compose runs them right to left (like maths f(g(x))). pipe runs them left to right, in reading order.
  - q: Why does currying need closures?
    a: Each inner function must remember the inputs given earlier. Closures let it keep those values after the outer function has finished.
  - q: "Write a curried add so add(1)(2)(3) returns 6."
    a: "const add = (a) => (b) => (c) => a + b + c;"
---

## 💡 What is it?

**Currying** means splitting a [function](glossary:function) with many inputs into small steps. Each step takes **one** input.

So `add(1, 2, 3)` becomes `add(1)(2)(3)`.

**Function composition** means joining small functions into one bigger function. The output of one function becomes the input of the next.

## 🏠 Real-life example

Think of **ordering a dosa at a food stall**.

The cook doesn't ask for everything at once. First you choose the **type** (plain or masala). Then the **size**. Then **chutney or sambar**. After each choice, the cook remembers it and waits for the next one.

- **The dosa order** = the curried function.
- **Each question** = one function that takes one input.
- **The cook remembering your choices** = the [closure](glossary:closure) keeping earlier inputs.
- **"Masala dosa, please" said once for the whole family** = partial application. The type is fixed, and only the size changes for each person.

Now think of a **school uniform line**. One student irons the shirt, the next folds it, the next packs it. Each person does one small job and passes the result on. That line of small jobs is **composition**.

## 🧑‍💻 Code example

Save this as `curry.js`. Run it with `node curry.js`.

```js
const add = (a) => (b) => (c) => a + b + c;          // a curried function: takes one value at a time
console.log(add(1)(2)(3));                            // 1 + 2 + 3 → 6

const greet = (greeting) => (name) => `${greeting}, ${name}!`; // first give the greeting, later the name
const sayHi = greet('Hi');                            // sayHi remembers greeting = 'Hi' (a closure)
console.log(sayHi('Hari'));                           // "Hi, Hari!"
console.log(sayHi('Anu'));                            // "Hi, Anu!" → same greeting, new name

const double = (n) => n * 2;                          // small step 1: multiply by 2
const addTen = (n) => n + 10;                         // small step 2: add 10
const compose = (...fns) => (x) => fns.reduceRight((acc, fn) => fn(acc), x); // run functions right → left
const pipe = (...fns) => (x) => fns.reduce((acc, fn) => fn(acc), x);         // run functions left → right

console.log(compose(double, addTen)(5));              // addTen first (15), then double → 30
console.log(pipe(double, addTen)(5));                 // double first (10), then addTen → 20
```

**Output:**

```text
6
Hi, Hari!
Hi, Anu!
30
20
```

**What to notice:**
- `sayHi` is a ready-made helper. We fixed the first input once and reused it.
- `compose` and `pipe` use the same two functions, but in a different order. So the answers are different.

## 🔍 Deeper version

**1. Currying vs partial application.** People mix these up.
- **Currying** changes the *shape* of a function. `f(a, b, c)` becomes `f(a)(b)(c)`.
- **Partial application** means fixing *some* inputs and getting a function back for the rest. `greet('Hi')` is partial application.

Currying makes partial application easy, but they are not the same thing.

**2. A general `curry` helper.** Interviewers sometimes ask you to write one. It counts how many inputs the function expects with `fn.length`. It keeps collecting inputs until it has enough.

```js
function curry(fn) {                                   // turns any normal function into a curried one
  return function curried(...args) {                   // collect the inputs given in this call
    if (args.length >= fn.length) return fn(...args);  // enough inputs → call the real function
    return (...more) => curried(...args, ...more);     // not enough → wait for more (closure keeps args)
  };                                                   // end of curried
}                                                      // end of curry
const sum3 = curry((a, b, c) => a + b + c);            // a normal 3-input function, curried
console.log(sum3(1)(2)(3), sum3(1, 2)(3), sum3(1)(2, 3)); // 6 6 6 → any grouping works
```

Note: `fn.length` does not count default parameters or `...rest` parameters. So this helper only works for functions with a fixed number of inputs.

**3. Composition is just nesting.** `compose(f, g)(x)` is the same as `f(g(x))`. That is the maths order: the function on the **right** runs first. `pipe` is the same idea in reading order, so many developers find it easier to read.

**4. Point-free style.** Some code never names the data. It just joins functions: `const cleanName = pipe(trim, toLowerCase, capitalize)`. This can be neat, but too much of it is hard to debug.

**5. Where you see these ideas in real code:**
- **Express middleware factories** like `allowRole('admin')` are partial application. See [closures](topic:javascript/closures).
- **Redux** `connect(mapState)(Component)` in older code, and middleware written as `store => next => action => {}`. That is a curried function.
- **Data-cleaning steps** for API input: trim → validate → format, joined with `pipe`.

## 🎯 Why do we use it?

- **To make reusable helpers.** Fix the common input once, like a tax rate or a role, and reuse the function many times.
- **To build clean steps.** Many tiny, testable functions joined together are easier to read than one huge function.
- **To fit APIs that pass one argument.** `map`, `filter` and `then` call your function with one value. A curried function plugs straight in: `prices.map(addTax(0.18))`.

## ⚠️ Common mistakes

- **Mixing up compose and pipe order.** `compose` runs right to left. `pipe` runs left to right.
- **Using `fn.length` with default or rest parameters.** It ignores them, so a generic `curry` helper breaks.
- **Currying everything.** `add(1)(2)` is cute, but plain `add(1, 2)` is clearer when you don't need partial application.
- **Forgetting the call at the end.** `pipe(a, b)` only *builds* a function. You must still call it: `pipe(a, b)(value)`.

## 🗣️ How to answer in an interview

> "Currying is turning a function that takes several arguments into a chain of functions that take one argument each. So add(a, b, c) becomes add(a)(b)(c). It works because of closures. Each inner function remembers the arguments given so far.
>
> The practical benefit is partial application. I can fix some arguments once and get a reusable helper, like greet('Hi') or a middleware factory such as allowRole('admin').
>
> Function composition is joining small functions so the output of one feeds the next. compose runs right to left, like f of g of x. pipe runs left to right, which reads more naturally. I use these ideas for small reusable helpers, but I don't overuse them, because heavily curried code can be harder for a team to read."

[FILL IN: a real helper or middleware factory from your SkillKeepr code that uses this idea, if you have one. Only add it if it's true.]

## 🔁 Follow-up questions

### Can you write a generic `curry` function?

Yes. Return a function that collects arguments. If it has at least `fn.length` arguments, call `fn`. If not, return a new function that waits for more and joins the arguments. The code is in the Deeper version above.

### What is the difference between currying and partial application?

Currying changes the shape of a function into one-argument steps. Partial application fixes some arguments and returns a function for the rest. Currying makes partial application easy, but you can also do partial application without currying, for example with `fn.bind(null, a)`.

### Is Redux middleware curried?

Yes. Redux middleware has the shape `store => next => action => { ... }`. Redux calls each layer at a different time. It gives `store` once at setup, `next` when it builds the chain, and `action` on every dispatch.

### Does currying make code slower?

Very slightly, because it creates extra functions. In normal apps you won't notice it. Readability matters more than this tiny cost.

## ✅ Quick check

### 1. What does this print?

```js
const mul = (a) => (b) => a * b;          // curried multiply
const triple = mul(3);                    // fix a = 3
console.log(triple(5), mul(2)(4));        // ?
```

:::answer
**`15 8`.** `triple` remembers `a = 3`, so `triple(5)` is `15`. `mul(2)(4)` is `8`.
:::

### 2. What does this print?

```js
const pipe = (...fns) => (x) => fns.reduce((acc, fn) => fn(acc), x); // left → right
console.log(pipe((n) => n + 1, (n) => n * 3)(2));                    // ?
```

- A) `7`
- B) `9`
- C) `5`

:::answer
**B) `9`.** `pipe` runs left to right: `2 + 1 = 3`, then `3 * 3 = 9`. With `compose`, the order flips: `2 * 3 = 6`, then `6 + 1 = 7`.
:::

### 3. True or false: `compose(f, g)(x)` is the same as `f(g(x))`.

:::answer
**True.** `compose` runs the right-most function first, so `g` runs first and `f` uses its result.
:::
