---
title: "Functions: declarations, expressions, arrow functions"
stack: javascript
order: 6
level: Basic
mustKnow: true
askedFrequency: very common
summary:
  - A function is a reusable block of code. You give it inputs (parameters) and it can give back a result (return).
  - A function declaration (function add() {}) is hoisted, so you can call it before its line.
  - A function expression stores a function in a variable. It can't be used before that line.
  - "Arrow functions are short (x => x * 2). They have no own this and no arguments object, and can't be used with new."
  - Functions are values: you can store them, pass them to other functions and return them.
cards:
  - q: What is the difference between a function declaration and a function expression?
    a: A declaration (function add() {}) is hoisted, so you can call it before its line. An expression (const add = function () {}) is only ready after that line runs.
  - q: Name three differences between arrow functions and normal functions.
    a: "Arrow functions have no own this (they use the outer this), no arguments object, and can't be called with new."
  - q: What are default and rest parameters?
    a: "Default: a value used when the argument is missing, like (name = 'friend'). Rest: ...nums collects the remaining arguments into an array."
  - q: What does "functions are first-class" mean?
    a: Functions are normal values. You can store them in variables, pass them as arguments (callbacks) and return them from other functions.
  - q: When should you NOT use an arrow function?
    a: As an object method that uses this, as a constructor with new, or when you need the arguments object.
---

## 💡 What is it?

A **[function](glossary:function)** is a reusable block of code with a name. You **call** it to run the code inside.

You can give it inputs, called **parameters**. It can give back a result with `return`.

JavaScript has three common ways to write a function: a **declaration**, an **expression** and an **arrow function**.

## 🏠 Real-life example

Think of **a juice machine at a shop**.

- You put **fruit in** (the inputs, called **arguments**).
- The machine does the **same steps** every time (the code inside).
- **Juice comes out** (the `return` value).
- The **label on the machine** says what it needs: "apple or orange" (the **parameters**).
- If you put nothing in, it uses a **default fruit**, like water and ice (a **default parameter**).

Three ways to write a function are like three ways to get the machine:
- **Declaration** = a machine fixed to the shop wall. It's there from the moment the shop opens (hoisted).
- **Expression** = a machine delivered later. You can only use it after it arrives.
- **Arrow function** = a small hand-held juicer. It's quick and simple, but it has fewer features.

## 🧑‍💻 Code example

Save this as `functions.js`. Run it with `node functions.js`.

```js
console.log(add(2, 3));                            // works BEFORE the declaration below, because it is hoisted
function add(a, b) {                               // function declaration: has a name, is hoisted
  return a + b;                                    // give back the sum
}                                                  // end of add
const multiply = function (a, b) {                 // function expression: a function stored in a variable
  return a * b;                                    // give back the product
};                                                 // end of multiply
const square = (n) => n * n;                       // arrow function: one line returns n * n automatically
const greet = (name = 'friend') => `Hi ${name}`;   // default parameter: 'friend' is used if no name is given
const sum = (...nums) => nums.reduce((t, n) => t + n, 0); // ...nums collects all arguments into an array
console.log(multiply(4, 5));                       // 4 × 5
console.log(square(6));                            // 6 × 6
console.log(greet(), '|', greet('Hari'));          // without and with a name
console.log(sum(1, 2, 3, 4));                      // 1 + 2 + 3 + 4
```

**Output:**

```text
5
20
36
Hi friend | Hi Hari
10
```

## 🔍 Deeper version

**The three styles side by side:**

| | Declaration | Expression | Arrow |
|---|---|---|---|
| Example | `function f() {}` | `const f = function () {}` | `const f = () => {}` |
| Hoisted (call before the line) | ✅ yes | ❌ no (TDZ) | ❌ no (TDZ) |
| Own `this` | ✅ set by how it's called | ✅ | ❌ uses the outer `this` |
| `arguments` object | ✅ | ✅ | ❌ |
| Can use `new` | ✅ | ✅ | ❌ TypeError |
| Short "implicit return" | ❌ | ❌ | ✅ `x => x * 2` |

**Arrow function return rules.**
- With no `{ }`, the value is returned automatically: `n => n * n`.
- With `{ }`, you must write `return`.
- To return an object, wrap it in brackets: `() => ({ ok: true })`. Without the brackets, `{ }` is read as the function body.

**`this` in arrow functions.** An arrow function **does not have its own `this`**. It uses the `this` of the code around it. This is great inside callbacks, like `setTimeout(() => this.save())` inside a class method. But it is wrong for object methods. See [the this keyword](topic:javascript/this-keyword).

```js
const timer = {                              // an object
  seconds: 0,                                // a property
  startBad: () => typeof this,               // arrow: this is NOT the timer object
  startGood() { return this.seconds; },      // method shorthand: this IS the timer
};                                           // end of timer
console.log(timer.startGood());              // 0
```

**Parameters vs arguments.** Parameters are the names in the definition (`a`, `b`). Arguments are the real values you pass (`2`, `3`). Missing arguments become `undefined`. Extra ones are ignored, unless you use `...rest`.

**Functions are first-class values.** You can:
- store a function in a variable or an object,
- pass it to another function (a [callback](glossary:callback), like `arr.map(fn)`),
- return it from a function. That's how [closures](topic:javascript/closures) and factories work.

A function that takes or returns a function is a **higher-order function**. See [higher-order functions](topic:javascript/higher-order-functions).

**Named function expressions.** `const f = function walk() {}` has the name `walk`. That name only exists inside the function. It's useful for recursion and for clearer error stack traces.

**IIFE.** An Immediately Invoked Function Expression is `(function () { ... })()`. It runs once, right away. It was used to make private scope before modules existed.

## 🎯 Why do we use it?

- **Don't repeat yourself.** Write the logic once and call it many times.
- **Name a step.** `calculateTax(price)` reads better than five lines of maths in the middle of a route.
- **Test small pieces.** Small pure functions are easy to unit test with Jest.
- **Pass behaviour around.** Callbacks, array methods, Express middleware and React event handlers are all functions passed as values.

## ⚠️ Common mistakes

- **Using an arrow function as an object method** and expecting `this` to be the object.
- **Forgetting `return`** in a function with `{ }`. It returns `undefined`.
- **Returning an object from an arrow without brackets.** `() => { ok: true }` returns `undefined`. Write `() => ({ ok: true })`.
- **Calling a function expression before its line.** `const` functions are not ready until their line runs.

## 🗣️ How to answer in an interview

> "A function is a reusable block of code that takes parameters and can return a value. In JavaScript, functions are first-class values, so I can store them, pass them as callbacks and return them from other functions.
>
> A function declaration is hoisted completely, so I can call it before it appears in the file. A function expression or an arrow function stored in a const is only available after that line runs.
>
> Arrow functions are shorter and have an implicit return. The big difference is that they don't have their own this. They take this from the surrounding code, which is perfect for callbacks inside class methods. But I don't use them as object methods or constructors. They also don't have the arguments object, so I use rest parameters instead."

## 🔁 Follow-up questions

### What is the `arguments` object?

It's an array-like object with all the arguments passed to a normal function. It's not a real array, so it has no `.map`. Arrow functions don't have it. In modern code, use `...rest` instead.

### What is a pure function?

A function that always gives the **same output for the same input** and has **no side effects**. It doesn't change outside variables, call APIs or write to the DOM. Pure functions are easy to test and reason about.

### What is a callback?

A function you pass to another function so it can call it later, like `button.addEventListener('click', handleClick)` or `arr.map(x => x * 2)`.

### Can you use `new` with an arrow function?

No. You get `TypeError: ... is not a constructor`. Arrow functions don't have a `prototype` and can't be constructors.

## ✅ Quick check

### 1. Predict the output.

```js
console.log(double(4));              // call before the line
const double = (n) => n * 2;         // arrow function in a const
```

:::answer
**`ReferenceError: Cannot access 'double' before initialization`.** `double` is a `const`, so it is in the Temporal Dead Zone until its line runs.
:::

### 2. What does `make()` return?

```js
const make = () => { ok: true };     // arrow with { }
```

- A) `{ ok: true }`
- B) `undefined`
- C) `true`

:::answer
**B) `undefined`.** The `{ }` is read as a function body, and `ok:` as a label. Write `() => ({ ok: true })` to return an object.
:::

### 3. What does this print?

```js
const total = (...n) => n.length;    // count the arguments
console.log(total(5, 6, 7));         // ?
```

:::answer
**3.** `...n` collects all three arguments into the array `[5, 6, 7]`.
:::
