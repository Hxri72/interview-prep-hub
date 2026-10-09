---
title: var, let and const
stack: javascript
order: 2
level: Basic
mustKnow: true
askedFrequency: very common
summary:
  - "Use const by default. Use let when the value must change. Avoid var in new code."
  - var is function-scoped. let and const are block-scoped (they live only inside the nearest { }).
  - var can be declared twice and used before its line (as undefined). let and const can't.
  - const means the name can't point to something new. The object it points to can still change.
cards:
  - q: What is the main difference between var and let?
    a: var is function-scoped and can be re-declared. let is block-scoped, can't be re-declared in the same scope, and can't be used before its line.
  - q: Can you change an object declared with const?
    a: "Yes. const only stops you from pointing the name at a new value. You can still change the object's properties, like user.name = 'Anu'."
  - q: Which one should you use by default?
    a: const. Switch to let only when you really need to reassign the variable. Avoid var in modern code.
  - q: What does var do inside an if block?
    a: It ignores the block. The variable belongs to the whole function, so it is visible outside the if.
  - q: How do you make an object fully unchangeable?
    a: "Use Object.freeze(obj). It stops changes to the top-level properties. Nested objects need their own freeze."
---

## 💡 What is it?

`var`, `let` and `const` are three ways to create a [variable](glossary:variable). A variable is a named box that holds a value.

- `const` makes a box whose label can't be moved to another value.
- `let` makes a box whose value you can change later.
- `var` is the old way. It has some strange rules, so modern code avoids it.

## 🏠 Real-life example

Think of **three kinds of name tags at school**.

- **`const` = a name tag stitched onto your school bag.** It always stays on *that* bag. But you can still put new books inside the bag.
- **`let` = a sticky note on your desk.** You can peel it off and write a new value. It stays in your classroom (your block).
- **`var` = an old announcement on the school notice board.** Everyone in the whole building can see it, even from other classrooms. Anyone can pin a second one with the same name. This causes confusion.

## 🧑‍💻 Code example

Save this as `vars.js`. Run it with `node vars.js`.

```js
var a = 1;                       // var: function-scoped
var a = 2;                       // var lets you declare the same name again (no error) → a is now 2
let b = 1;                       // let: block-scoped, can be changed later
b = 5;                           // changing a let is fine → b is now 5
const c = { score: 10 };         // const: the name c must always point to this same object
c.score = 20;                    // but the object itself CAN change → score is now 20
if (true) {                      // a block { } starts here
  var insideVar = 'I leak';      // var ignores blocks, so it leaks outside
  let insideLet = 'I stay';      // let lives only inside this block
}                                // end of the block
console.log(a, b, c.score);      // prints the three values
console.log(insideVar);          // var is visible outside the block
console.log(typeof insideLet);   // let is not visible outside the block
try {                            // try something that will fail
  c = {};                        // pointing a const to a new object is not allowed
} catch (err) {                  // catch the error so the program keeps going
  console.log(`${err.name}: ${err.message}`); // print the error type and message
}                                // end of try/catch
```

**Output:**

```text
2 5 20
I leak
undefined
TypeError: Assignment to constant variable.
```

## 🔍 Deeper version

**The full comparison:**

| | `var` | `let` | `const` |
|---|---|---|---|
| [Scope](glossary:scope) | function | block `{ }` | block `{ }` |
| Re-declare in the same scope | ✅ allowed | ❌ SyntaxError | ❌ SyntaxError |
| Reassign | ✅ | ✅ | ❌ TypeError |
| Use before its line | gives `undefined` | ❌ ReferenceError (TDZ) | ❌ ReferenceError (TDZ) |
| Adds a property to the global object | ✅ at the top level of a script | ❌ | ❌ |
| Must have a starting value | no | no | ✅ yes |

**Hoisting and the TDZ.** All three are "hoisted". That means the engine knows about them before the code runs. But `var` starts as `undefined`, while `let` and `const` stay in the **Temporal Dead Zone (TDZ)** until their line runs. Touching them early throws an error. See [hoisting and the TDZ](topic:javascript/hoisting-tdz).

**const is not "immutable".** Immutable means "can't be changed at all". `const` only fixes the **binding**, which is the link between the name and the value.

```js
const list = [1, 2];          // the name list points to this array
list.push(3);                 // allowed: the same array, now [1, 2, 3]
Object.freeze(list);          // now the array itself is locked (shallow)
list.push(4);                 // TypeError: Cannot add property 3, object is not extensible
```

`Object.freeze` is **shallow**. Objects nested inside are not frozen.

**Loops and closures.** `let` creates a **new** variable for each loop round. `var` shares one. This is the famous `setTimeout` loop question in [closures](topic:javascript/closures).

**The global object.** In a classic browser script, `var x` at the top level becomes `window.x`. `let` and `const` don't. In Node.js modules and ES modules, the top level is not global anyway.

## 🎯 Why do we use it?

- **`const` tells readers "this won't be reassigned".** That makes code easier to follow.
- **Block scope stops bugs.** A loop counter or temporary value can't leak out and get changed by other code.
- **The TDZ catches mistakes early.** Using a variable before you set it is almost always a bug. `let` and `const` turn it into a clear error instead of a silent `undefined`.
- **No accidental re-declaring.** Two parts of a file can't both declare `total` by mistake.

## ⚠️ Common mistakes

- **Thinking `const` objects can't change.** You can still change their properties and array items.
- **Using `var` in loops with callbacks.** All callbacks see the last value. Use `let`.
- **Declaring a `const` without a value.** `const x;` is a SyntaxError.
- **Using `let` for everything.** If you never reassign it, use `const`. It shows your intent.

## 🗣️ How to answer in an interview

> "All three declare variables, but they differ in scope and in what you can change. var is function-scoped, can be re-declared, and is hoisted with the value undefined. So you can read it before its line without an error. let and const are block-scoped, can't be re-declared in the same scope, and stay in the temporal dead zone until their line runs, so early access throws a ReferenceError.
>
> The difference between let and const is reassignment. const fixes the binding, not the value. So a const object or array can still be changed. If I need it fully locked, I use Object.freeze, which is shallow.
>
> My rule is: const by default, let only when I need to reassign, and no var in new code."

## 🔁 Follow-up questions

### Why was `let` added if `var` already existed?

`var`'s function scope and silent hoisting caused bugs, like loop variables leaking and closures seeing the wrong value. ES6 (2015) added `let` and `const` with block scope and the TDZ. This made code safer and easier to predict.

### What happens if you re-declare a `let`?

You get a **SyntaxError** before the code even runs. For example: "Identifier 'x' has already been declared". In a *different* block, though, you can use the same name. That's called shadowing.

### Is `const` faster than `let`?

Not in any way you'd notice. Engines are very good at both. Choose based on meaning, not speed.

### What is the scope of a `var` inside a `for` loop?

The whole function around the loop, or the global scope if there is no function. That's why the counter is still readable after the loop ends.

## ✅ Quick check

### 1. What does this print?

```js
if (true) {             // a block
  var x = 1;            // var
  let y = 2;            // let
}                       // end of block
console.log(typeof x, typeof y);  // ?
```

:::answer
**`number undefined`.** `var x` leaks out of the block. `let y` does not exist outside it.
:::

### 2. Which line throws an error?

```js
const team = ['Anu'];   // line 1
team.push('Hari');      // line 2
team = ['Ravi'];        // line 3
```

:::answer
**Line 3.** Pushing into a const array is fine. Pointing the name `team` at a new array is a TypeError.
:::

### 3. True or false: `Object.freeze` also freezes objects nested inside.

:::answer
**False.** `Object.freeze` is shallow. Nested objects can still change unless you freeze them too.
:::
