---
title: "Scope: global, function and block"
stack: javascript
order: 7
level: Basic
mustKnow: true
askedFrequency: very common
summary:
  - Scope is the area of the code where a variable can be seen and used.
  - "There are three main kinds: global scope (everywhere), function scope (inside one function) and block scope (inside one { })."
  - Inner code can see outer variables. Outer code can't see inner variables.
  - "JavaScript looks for a variable from the inside out: current scope first, then the parent, up to global. This is the scope chain."
  - "Scope is decided by where you WRITE the code (lexical scope), not where you call it."
cards:
  - q: What is scope?
    a: The part of the code where a variable is visible and can be used.
  - q: What are the three main kinds of scope?
    a: "Global scope (visible everywhere), function scope (inside one function: var, let and const) and block scope (inside one { }: only let and const)."
  - q: What is the scope chain?
    a: When JavaScript looks for a variable, it checks the current scope, then the parent scope, then its parent, up to the global scope. If it's not found, you get a ReferenceError.
  - q: What is variable shadowing?
    a: When an inner scope declares a variable with the same name as an outer one. Inside, the inner one hides (shadows) the outer one.
  - q: What is lexical scope?
    a: A function's scope depends on where it is written in the code, not on where it is called from.
---

## 💡 What is it?

**[Scope](glossary:scope)** is the area of your code where a variable can be **seen and used**.

A variable made inside a function can't be used outside it. But code inside a function **can** use variables from outside.

There are three main kinds: **global**, **function** and **block** scope.

## 🏠 Real-life example

Think of **a school building**.

- **Global scope = the school notice board in the main hall.** Every student in every classroom can read it.
- **Function scope = one classroom.** Things written on that classroom's board are only seen by students in that room.
- **Block scope = a small group table inside the classroom.** A note on the table is only for that group.
- **Looking outward:** a student at a group table can read the table note, the classroom board and the main notice board. But a student in the main hall **can't** read a note on a group table inside a classroom.
- **Shadowing:** if the classroom board says "Exam: Monday" and the main notice board says "Exam: Friday", students in that classroom follow the **closest** board: Monday.

## 🧑‍💻 Code example

Save this as `scope.js`. Run it with `node scope.js`.

```js
const appName = 'PrepHub';               // global scope: every function can see it
function showScopes() {                  // a function creates a new function scope
  const page = 'Dashboard';              // function scope: lives only inside showScopes
  if (true) {                            // a block { } creates a block scope
    const tab = 'Progress';              // block scope: lives only inside this if
    console.log(appName, page, tab);     // inner code can see all the outer variables
  }                                      // end of the block
  console.log(typeof tab);               // tab is gone outside its block
}                                        // end of showScopes
showScopes();                            // run the function
console.log(typeof page);                // page is not visible outside the function
const level = 'outer';                   // a global variable called level
function shadow() {                      // another function scope
  const level = 'inner';                 // same name inside: it "shadows" (hides) the outer one
  return level;                          // JavaScript uses the nearest level first
}                                        // end of shadow
console.log(shadow(), level);            // the inner one, then the outer one
```

**Output:**

```text
PrepHub Dashboard Progress
undefined
undefined
inner outer
```

We used `typeof` because reading an unknown variable directly would throw a `ReferenceError`. `typeof` safely gives `'undefined'` instead.

## 🔍 Deeper version

**The kinds of scope:**

| Scope | Created by | Which declarations live there |
|---|---|---|
| Global | the top level of a classic script | `var`, `let`, `const`, functions |
| Module | each ES module or Node.js file | everything at its top level (private to that file) |
| Function | every function | `var`, `let`, `const`, parameters |
| Block | any `{ }`: if, for, while, try, plain blocks | only `let`, `const` and `class` (not `var`) |

**Module scope.** In Node.js, and in browser files loaded with `type="module"`, each file has its own scope. A `const` at the top of `utils.js` is **not** visible in `app.js` unless you export it. That's why we rarely create real globals today.

**The scope chain.** Each scope has a link to the scope it was written inside. When you use a name, JavaScript searches:
1. the current scope,
2. then the parent scope,
3. and so on, up to the global scope.

If it's not found anywhere, you get `ReferenceError: x is not defined`.

**Lexical (static) scope.** "Lexical" means "where the code is written". A function remembers the scope **where it was written**, not where it is called. This is the base of [closures](topic:javascript/closures).

```js
const who = 'global';                 // a global variable
function sayWho() {                   // written at the top level
  return who;                         // so it sees the global who
}                                     // end of sayWho
function run() {                      // another function
  const who = 'inside run';           // a local who
  return sayWho();                    // calling sayWho from here does NOT give it this local who
}                                     // end of run
console.log(run());                   // 'global'
```

**Accidental globals.** In old "sloppy mode", assigning to an undeclared name creates a global: `total = 5`. In **strict mode**, this is a `ReferenceError`. ES modules and classes are always strict. Always declare variables with `const` or `let`.

**`var` and blocks.** `var` ignores block scope. A `var` inside an `if` or a `for` belongs to the whole function. See [var, let and const](topic:javascript/var-let-const).

## 🎯 Why do we use it?

- **No name clashes.** Two functions can both have a variable called `result` without fighting.
- **Safety.** Private variables can't be changed by other code by mistake.
- **Memory.** When a scope is finished, and nothing else points to its variables, they can be cleaned up by [garbage collection](glossary:garbage-collection).
- **Readable code.** A variable that lives in a small block is easy to follow. You know exactly where it's used.

## ⚠️ Common mistakes

- **Forgetting `let` or `const`.** `count = 1` creates a global in sloppy mode, or throws in strict mode.
- **Expecting a block variable outside the block.** A `const` made inside an `if` is gone after the `}`.
- **Accidental shadowing.** You declare `const user` inside a function and accidentally hide the outer `user` you wanted to change.
- **Thinking scope depends on where a function is called.** It depends on where it is **written**.

## 🗣️ How to answer in an interview

> "Scope is where a variable is visible. JavaScript has global scope, function scope and block scope, and in modules each file has its own module scope. var is function-scoped. let and const are block-scoped, so they only exist inside the nearest curly braces.
>
> When I use a variable, the engine searches the scope chain: the current scope first, then each outer scope, up to global. If it isn't found, I get a ReferenceError. Inner code can read outer variables, but not the other way round.
>
> JavaScript uses lexical scope, which means a function's scope is decided by where it's written, not where it's called. That's what makes closures work. I also keep variables in the smallest scope I can, and I rely on strict mode, so a missing declaration throws an error instead of creating a global."

## 🔁 Follow-up questions

### What is the difference between scope and context (`this`)?

**Scope** is about which **variables** you can see. It's decided by where the code is written. **Context** is the value of **`this`**. For normal functions, it's decided by **how** the function is called. They are different things.

### What is strict mode?

A safer version of JavaScript, turned on with `'use strict'` at the top of a file or function. It turns silent mistakes into errors, such as assigning to undeclared variables. ES modules and classes are always in strict mode.

### Can two different blocks use the same `let` name?

Yes. Each block has its own scope, so `let i` in two separate `for` loops is fine.

### How do you share a variable between two files?

Export it from one [module](glossary:module) and import it in the other. Don't create globals.

## ✅ Quick check

### 1. Predict the output.

```js
let x = 1;                  // outer x
{                           // a plain block
  let x = 2;                // inner x shadows the outer one
  console.log(x);           // ?
}                           // end of block
console.log(x);             // ?
```

:::answer
**2, then 1.** The inner `x` only exists inside the block. Outside, the outer `x` is still 1.
:::

### 2. What happens here?

```js
function f() {              // a function
  const secret = 42;        // function scope
}                           // end of f
f();                        // run it
console.log(secret);        // ?
```

- A) `42`
- B) `undefined`
- C) `ReferenceError: secret is not defined`

:::answer
**C.** `secret` only exists inside `f`. Reading it outside throws a ReferenceError.
:::

### 3. True or false: a function can see variables from the place where it is **called**.

:::answer
**False.** JavaScript uses lexical scope. A function sees variables from where it is **written**, not from where it is called.
:::
