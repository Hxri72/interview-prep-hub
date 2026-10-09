---
title: "Data types: primitives vs objects (value vs reference)"
stack: javascript
order: 3
level: Basic
mustKnow: true
askedFrequency: very common
summary:
  - "JavaScript has 7 primitive types: string, number, bigint, boolean, undefined, null and symbol. Everything else is an object."
  - Primitives are copied by value. Changing the copy never changes the original.
  - Objects (including arrays and functions) are copied by reference. Two names can point to the same object.
  - "=== on objects checks if they are the SAME object, not if they look the same."
  - "typeof null is 'object' (an old bug), and typeof [] is 'object' too. Use Array.isArray() for arrays."
cards:
  - q: Name the 7 primitive types in JavaScript.
    a: string, number, bigint, boolean, undefined, null and symbol.
  - q: What does "copied by reference" mean?
    a: The variable holds the address of the object, not the object itself. Copying the variable copies the address, so both names point to the same object.
  - q: "Why is { a: 1 } === { a: 1 } false?"
    a: They are two different objects at two different addresses. === on objects compares the address, not the contents.
  - q: What is typeof null, and why?
    a: "'object'. It's a bug from the first version of JavaScript that can never be fixed, because fixing it would break old websites."
  - q: How do you check if a value is an array?
    a: "Array.isArray(value). typeof gives 'object' for arrays, so it can't tell them apart."
---

## 💡 What is it?

Every value in JavaScript has a **type**. There are two big groups.

- **Primitives** are simple values: text, numbers, true/false and a few more. They are copied **by value**.
- **Objects** are bigger things with many parts: objects, arrays and functions. They are copied **by reference**. That means the variable holds an **address**, not the thing itself.

This one difference explains many bugs.

## 🏠 Real-life example

Think of **a photocopy vs a house address**.

- **A primitive is like a photocopied worksheet.** Your friend gets their own copy. If they write on it, your sheet stays clean.
- **An object is like a house.** You can't photocopy a house. You give your friend the **address** on a piece of paper. Now you both have the address of the **same** house. If your friend paints the door red, you will see a red door too.
- **Two houses that look the same** are still two different houses at two different addresses. That's why `{ a: 1 } === { a: 1 }` is `false`.

## 🧑‍💻 Code example

Save this as `types.js`. Run it with `node types.js`.

```js
let x = 10;                            // a primitive (number) is copied by VALUE
let y = x;                             // y gets its own copy of 10
y = 99;                                // change only y
console.log(x, y);                     // x did not change
const user1 = { name: 'Hari' };        // an object is stored by REFERENCE (an address)
const user2 = user1;                   // user2 copies the address, not the object
user2.name = 'Anu';                    // change the object through user2
console.log(user1.name);               // user1 sees the change: it is the same object
console.log({ a: 1 } === { a: 1 });    // two different objects = two different addresses
console.log(typeof 'hi', typeof 42, typeof true, typeof undefined); // four primitive types
console.log(typeof null, typeof {}, typeof []);                    // the tricky ones
```

**Output:**

```text
10 99
Anu
false
string number boolean undefined
object object object
```

## 🔍 Deeper version

**The 7 primitive types:**

| Type | Example | Note |
|---|---|---|
| `string` | `'Hari'` | text |
| `number` | `42`, `3.14`, `NaN`, `Infinity` | one type for whole and decimal numbers |
| `bigint` | `9007199254740993n` | very big whole numbers (ends in `n`) |
| `boolean` | `true`, `false` | yes / no |
| `undefined` | `undefined` | "no value was given" |
| `null` | `null` | "empty on purpose" |
| `symbol` | `Symbol('id')` | a unique key, often for hidden object properties |

Everything else is an **object**: plain objects, arrays, functions, dates, Maps, Sets and so on.

**Primitives can't be changed.** You can't change a primitive in place. `'hi'.toUpperCase()` returns a **new** string. The old one stays `'hi'`.

**Passing to functions.** JavaScript always passes a **copy of what the variable holds**. For a primitive, that's the value. For an object, that's the address. So a function **can change** an object you pass in, but it **can't replace** your variable.

```js
function rename(user) {        // user holds a copy of the address
  user.name = 'Ravi';          // changes the shared object → the caller sees it
  user = { name: 'Zed' };      // only changes the local copy of the address
}                              // end of rename
const u = { name: 'Hari' };    // the original object
rename(u);                     // pass it in
console.log(u.name);           // Ravi (not Zed)
```

**typeof quirks:**
- `typeof null === 'object'`. This is a bug from 1995 that can never be fixed. Check null with `value === null`.
- `typeof []` is `'object'`. Use `Array.isArray(value)`.
- `typeof function(){}` is `'function'`, even though functions are objects.

**Number limits.** Numbers are 64-bit decimals. So `0.1 + 0.2` is `0.30000000000000004`. Whole numbers are only safe up to `Number.MAX_SAFE_INTEGER` (9007199254740991). Above that, use `bigint`.

**Copying objects.** `{ ...obj }` makes a **shallow** copy: nested objects are still shared. For a full copy, use `structuredClone(obj)`. See [shallow vs deep copy](topic:javascript/shallow-vs-deep-copy).

## 🎯 Why do we use it?

Knowing value vs reference helps you:
- **Avoid "spooky" changes.** You change an object in one function, and another part of the app suddenly shows different data.
- **Understand React.** React checks if state changed by comparing references. If you change an object in place, the reference stays the same, so React may not re-render. That's why we always create a **new** object or array when updating state.
- **Compare values correctly.** `===` on objects compares addresses, so you must compare fields, or use a deep-equal helper.

## ⚠️ Common mistakes

- **Thinking `const b = a` copies an object.** It only copies the address. Both names point to the same object.
- **Checking arrays with `typeof`.** It says `'object'`. Use `Array.isArray`.
- **Comparing two objects with `===` to see if they "look the same".** It checks if they are the same object.
- **Changing props or state objects directly in React.** Make a new copy instead (`{ ...user, name: 'Anu' }`).

## 🗣️ How to answer in an interview

> "JavaScript has seven primitive types: string, number, bigint, boolean, undefined, null and symbol. Everything else is an object, including arrays and functions.
>
> The key difference is how they're copied. Primitives are copied by value, so changing a copy never affects the original. Objects are copied by reference: the variable holds an address, so two variables can point to the same object, and a change through one shows up in the other. That's also why triple equals on two objects that look the same returns false, because it compares the addresses.
>
> This matters a lot in React, where state updates must create new objects or arrays so React sees a new reference. Two quirks I remember: typeof null is 'object', and typeof an array is 'object', so I use Array.isArray."

## 🔁 Follow-up questions

### What is the difference between `null` and `undefined`?

`undefined` means "no value was set". It is what you get from a missing property or an empty variable. `null` means "empty on purpose", set by the programmer. `null == undefined` is `true`, but `null === undefined` is `false`.

### Is JavaScript "pass by reference"?

Strictly, no. It is always **pass by value**. But for objects, the value *is* a reference (an address). So a function can change the object's contents, but it can't make your variable point somewhere else.

### Why is `0.1 + 0.2 !== 0.3`?

Numbers are stored in binary floating point. Some decimals can't be stored exactly, like 1/3 in decimal. For money, store whole paise or cents as integers, or round when you compare.

### When would you use `bigint`?

For whole numbers bigger than about 9 quadrillion. Examples: some database IDs, very large counters, or exact maths. You can't mix `bigint` and `number` in maths without converting.

## ✅ Quick check

### 1. What does this print?

```js
const a = [1, 2];       // an array
const b = a;            // copy the reference
b.push(3);              // change through b
console.log(a.length);  // ?
```

:::answer
**3.** `a` and `b` point to the same array, so `push` through `b` changes `a` too.
:::

### 2. What does this print?

```js
let s = 'hi';           // a primitive string
let t = s;              // copy the value
t = t.toUpperCase();    // t becomes a new string
console.log(s, t);      // ?
```

:::answer
**`hi HI`.** Strings are primitives, copied by value. Changing `t` never touches `s`.
:::

### 3. Which is the correct way to check that a value is an array?

- A) `typeof value === 'array'`
- B) `Array.isArray(value)`
- C) `value instanceof Object`

:::answer
**B.** `typeof` returns `'object'` for arrays, and `instanceof Object` is true for almost everything.
:::
