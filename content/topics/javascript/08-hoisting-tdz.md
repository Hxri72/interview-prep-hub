---
title: Hoisting and the Temporal Dead Zone
stack: javascript
order: 8
level: Basic
mustKnow: true
askedFrequency: very common
summary:
  - Hoisting means JavaScript knows about your variables and functions before it runs the code, as if their declarations were moved to the top.
  - Function declarations are fully hoisted. You can call them before their line.
  - var is hoisted with the value undefined. Reading it early gives undefined, not an error.
  - "let, const and class are hoisted too, but stay in the Temporal Dead Zone (TDZ) until their line runs. Using them early throws a ReferenceError."
cards:
  - q: What is hoisting?
    a: Before running code, JavaScript scans each scope and registers all declarations. So names exist before their line, as if moved to the top.
  - q: What happens if you read a var before its line?
    a: You get undefined. The declaration is hoisted, but the value is only set when the line runs.
  - q: What is the Temporal Dead Zone?
    a: The time between the start of a scope and the line where a let, const or class is declared. Using the variable in that time throws a ReferenceError.
  - q: Are let and const hoisted?
    a: Yes, but they are not given a starting value. They stay in the TDZ until their line runs, so early access throws an error.
  - q: Is a function expression hoisted?
    a: "Only the variable is. With var it's undefined (calling it gives a TypeError). With const or let it's in the TDZ (ReferenceError)."
---

## 💡 What is it?

Before JavaScript runs your code, it quickly **scans** it and notes every variable and function name. This is called **hoisting**. It's as if the declarations were "lifted" to the top.

But each kind is lifted differently:
- **Function declarations** are lifted completely.
- **`var`** is lifted with the value `undefined`.
- **`let` and `const`** are lifted but **locked** until their line. That locked time is called the **Temporal Dead Zone (TDZ)**.

## 🏠 Real-life example

Think of **the attendance register on the first day of school**.

Before classes start, the teacher writes **every student's name** in the register. So the names are known from the start. This is hoisting.

- **Function declaration = a student who arrived early and is already in class.** You can call them any time.
- **`var` = a name in the register, but the seat is empty.** If you call it, you get silence: `undefined`.
- **`let` / `const` = a name in the register with a "Do not disturb until 10 AM" sign.** If you call before 10 AM, the teacher stops you with an error. That waiting time is the **Temporal Dead Zone**.

## 🧑‍💻 Code example

Save this as `hoisting.js`. Run it with `node hoisting.js`.

```js
console.log(sayHi());            // function declarations are fully hoisted, so this works
console.log(score);              // var is hoisted, but its value is not (yet)
var score = 10;                  // the value 10 is set only when this line runs
try {                            // try to use a let variable too early
  console.log(level);            // level is in the Temporal Dead Zone here
} catch (err) {                  // catch the error so the program continues
  console.log(`${err.name}: ${err.message}`); // print the error type and message
}                                // end of try/catch
let level = 3;                   // the Temporal Dead Zone for level ends on this line
console.log(level);              // now it's safe to use
function sayHi() {               // the function declaration itself
  return 'Hi!';                  // give back a greeting
}                                // end of sayHi
```

**Output:**

```text
Hi!
undefined
ReferenceError: Cannot access 'level' before initialization
3
```

## 🔍 Deeper version

**What really happens.** Nothing is physically moved. Before running a scope, the engine creates an **environment** for it. An environment is a table of the names in that scope. It registers every declaration first:

| Declaration | Registered at the start? | Starting value | Use before its line |
|---|---|---|---|
| `function f() {}` | ✅ | the whole function | ✅ works |
| `var x` | ✅ | `undefined` | gives `undefined` |
| `let x` / `const x` | ✅ | *not set* (TDZ) | ❌ ReferenceError |
| `class C {}` | ✅ | *not set* (TDZ) | ❌ ReferenceError |
| `import` | ✅ | ready before the module runs | ✅ works |

**Proof that `let` is hoisted.** If `let` were not hoisted at all, the inner `console.log` below would see the outer `x`. Instead, it throws:

```js
let x = 'outer';             // outer x
{                            // a new block scope
  console.log(x);            // ReferenceError: the inner x below is already registered (TDZ)
  let x = 'inner';           // inner x
}                            // end of block
```

**The TDZ is about time, not position.** A function can mention a `let` written later in the file. That's fine, as long as the function is **called** after the line has run.

```js
function show() { return limit; }   // mentions limit before its line
const limit = 5;                    // the TDZ ends here
console.log(show());                // 5 → called after the TDZ ended
```

**Function expressions and arrows are not hoisted as functions.** Only the variable is hoisted:
- `var f = function () {}`: calling `f()` early gives `TypeError: f is not a function`, because `f` is `undefined`.
- `const f = () => {}`: calling early gives a `ReferenceError` (TDZ).

**Same names.** If a `var` and a function declaration have the same name, the function wins at the start. The `var` assignment replaces it when that line runs. Avoid this: it's very confusing.

**`typeof` and the TDZ.** `typeof undeclaredName` safely gives `'undefined'`. But `typeof x` for a `let x` that is still in its TDZ **throws**.

## 🎯 Why do we use it?

Hoisting isn't something you "use" on purpose. You need to **understand** it to:
- **Read errors correctly.** "Cannot access 'x' before initialization" means a TDZ problem. "x is not defined" means the name doesn't exist in any scope.
- **Organise code.** Function declarations let you put helper functions at the bottom of a file and the main logic at the top.
- **Avoid silent bugs.** With `var`, reading too early silently gives `undefined`. `let` and `const` make it a loud error, which is much safer.
- **Answer "predict the output" questions**, which are very common in interviews.

## ⚠️ Common mistakes

- **Saying "let and const are not hoisted".** They are hoisted. They are just not set to a value until their line (the TDZ).
- **Calling a function expression or arrow before its line.** Only declarations are fully hoisted.
- **Relying on `var` hoisting.** Code that reads a `var` before setting it is a bug waiting to happen.
- **Mixing up the two errors.** "not defined" (no such name) vs "before initialization" (TDZ).

## 🗣️ How to answer in an interview

> "Hoisting means that before a scope runs, the engine registers all the declarations in it, so the names exist from the start of the scope. Function declarations are fully hoisted, so I can call them before their line. var is hoisted with the value undefined, so reading it early gives undefined instead of an error.
>
> let, const and class are also hoisted, but they're not initialised. From the start of the block until their declaration line, they're in the temporal dead zone, and any access throws 'Cannot access before initialization'. You can prove they're hoisted, because an inner let shadows an outer variable even before its line.
>
> Function expressions and arrow functions only hoist the variable, not the function. In practice, I use const and let, so early access fails loudly instead of silently giving undefined."

## 🔁 Follow-up questions

### Why does the TDZ exist?

To catch bugs. Using a variable before it's set is almost always a mistake. The TDZ turns it into a clear error. It also makes `const` safe: you can never see a `const` before it has its value.

### Are classes hoisted?

Yes, but like `let`, they are in the TDZ. `new User()` before `class User {}` throws a ReferenceError.

### What's the difference between "x is not defined" and "Cannot access 'x' before initialization"?

"Not defined" means no scope in the chain has a variable called `x`. "Before initialization" means `x` exists (`let`, `const` or `class`), but you used it during its TDZ.

### Does hoisting happen inside functions too?

Yes. Every function and every block has its own hoisting. A `var` inside a function is hoisted to the top of **that function**, not to the top of the file.

## ✅ Quick check

### 1. Predict the output.

```js
console.log(a);   // ?
var a = 5;        // var declaration
```

:::answer
**`undefined`.** `var a` is hoisted with `undefined`. The value 5 is only set when its line runs.
:::

### 2. Predict the output.

```js
greet();                       // call early
var greet = function () {      // function expression in a var
  console.log('hello');        // print hello
};                             // end of expression
```

- A) `hello`
- B) `undefined`
- C) `TypeError: greet is not a function`

:::answer
**C.** Only the `var greet` is hoisted, with the value `undefined`. Calling `undefined()` is a TypeError.
:::

### 3. Predict the output.

```js
const getLimit = () => limit;  // mentions limit before its line
const limit = 10;              // TDZ ends here
console.log(getLimit());       // ?
```

:::answer
**10.** The function is **called** after `limit` has its value. The TDZ is about when the code runs, not where it is written.
:::
