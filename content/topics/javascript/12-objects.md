---
title: "Objects: create, read, update, loop"
stack: javascript
order: 12
level: Basic
mustKnow: false
askedFrequency: common
summary:
  - An object stores related data as key–value pairs, like { name, city, years }.
  - Read with dot notation (obj.name) or brackets (obj['name']). Use brackets when the key is in a variable.
  - Add or change a value by assigning; remove a key with delete.
  - "Loop with Object.keys / values / entries, or for...in (which also walks inherited keys)."
  - Objects are stored by reference, so two variables can point to the same object.
cards:
  - q: Dot notation vs bracket notation — when do you need brackets?
    a: When the key is stored in a variable, has spaces or dashes, or starts with a number. Example obj[key] or obj['first-name'].
  - q: How do you check if an object has a key?
    a: "'key' in obj (also checks inherited keys) or Object.hasOwn(obj, 'key') (own keys only)."
  - q: What do Object.keys, Object.values and Object.entries return?
    a: Arrays of the keys, the values, and [key, value] pairs.
  - q: Why does changing an object inside a function change it outside too?
    a: Objects are passed by reference. The function gets a pointer to the same object, not a copy.
  - q: What is the difference between for...in and Object.keys?
    a: for...in also loops over inherited enumerable keys from the prototype. Object.keys gives only the object's own keys.
---

## 💡 What is it?

An **object** is a box that stores **related data together**. Each piece of data has a **key** (a name) and a **value**.

```js
{ name: 'Asha', city: 'Kochi', years: 3 }
```

Here `name`, `city` and `years` are keys. `'Asha'`, `'Kochi'` and `3` are values. Almost everything in JavaScript is built on objects.

## 🏠 Real-life example

Think of a **student's ID card**.

The card has labels and values: *Name: Asha*, *Class: 10*, *Blood group: B+*. You read a value by looking at its label. You can update the card (new class next year). You can add a new line (a phone number).

- **The ID card** = the object.
- **The labels** ("Name", "Class") = the keys.
- **What's written next to them** = the values.

And if the teacher has a **photocopy pointer** to the same card in a file? That's a reference. Writing on the card changes what everyone sees.

## 🧑‍💻 Code example

Save this as `obj.js`. Run it with `node obj.js`.

```js
const candidate = { name: 'Asha', skills: ['Node', 'React'], years: 3 }; // create an object with 3 keys

console.log(candidate.name);                 // read with dot notation → 'Asha'
console.log(candidate['years']);             // read with brackets (key as a string) → 3

candidate.city = 'Kochi';                    // ADD a new key called city
candidate.years = 4;                         // UPDATE an existing key
delete candidate.skills;                     // REMOVE the skills key

for (const key in candidate) {               // loop over every key
  console.log(key, '=', candidate[key]);     // brackets, because key is a variable
}                                            // end of the loop

console.log(Object.keys(candidate));         // all keys as an array
console.log(Object.entries(candidate));      // all [key, value] pairs as an array
console.log('email' in candidate);           // does the key exist? → false
```

**Output:**

```text
Asha
3
name = Asha
years = 4
city = Kochi
[ 'name', 'years', 'city' ]
[ [ 'name', 'Asha' ], [ 'years', 4 ], [ 'city', 'Kochi' ] ]
false
```

**What to notice:**
- `const` didn't stop us from changing the object. `const` only means the variable can't point to a **different** object.
- We used `candidate[key]`, not `candidate.key`. `candidate.key` would look for a key literally named "key".

## 🔍 Deeper version

**Ways to create objects:**
- Object literal: `{ name: 'Asha' }` (most common).
- Shorthand: if a variable `name` exists, `{ name }` means `{ name: name }`.
- Computed keys: `{ [field]: value }` uses the value of `field` as the key.
- `new Object()`, `Object.create(proto)`, or a class with `new`.

**Reading safely.** Reading a missing key gives `undefined`, not an error. Reading a key **of** `undefined` throws. Use [optional chaining](topic:javascript/template-literals-optional-chaining): `user.address?.city`.

**Checking if a key exists:**

| Check | Own keys | Inherited keys | Notes |
|---|---|---|---|
| `'key' in obj` | ✅ | ✅ | also true for things like `'toString'` |
| `Object.hasOwn(obj, 'key')` | ✅ | ❌ | modern, recommended |
| `obj.key !== undefined` | ✅ | ✅ | wrong if the value really is `undefined` |

**Looping:**
- `Object.keys / values / entries` → own keys only, as arrays. You can then use array methods like `map` and `filter`.
- `for...in` → own **and inherited** enumerable keys. That's why old code added `hasOwnProperty` checks.
- `Object.fromEntries(pairs)` turns `[key, value]` pairs back into an object. This is great for "transform an object": `Object.fromEntries(Object.entries(prices).map(([k, v]) => [k, v * 2]))`.

**Key order.** Integer-like keys ("1", "2") come first, in number order. Then string keys in the order you added them.

**Reference, not copy.** `const b = a` doesn't copy the object. Both names point to the same object. Changing `b.x` changes `a.x`. To copy, use spread `{ ...a }` (shallow) or `structuredClone(a)` (deep). See [shallow vs deep copy](topic:javascript/shallow-vs-deep-copy).

**Comparing objects.** `{ a: 1 } === { a: 1 }` is `false`. They are two different objects. `===` compares references, not contents.

**Freezing.** `Object.freeze(obj)` stops changes to the top level. Nested objects can still change, because freeze is shallow.

## 🎯 Why do we use it?

- **To group related data**, like one candidate, one job or one API response. JSON from an [API](glossary:api) becomes objects.
- **To look things up fast by name**, like a dictionary or a count of items: `counts[word]++`.
- **To pass many options to a function** in one argument: `createUser({ name, email, role })`.
- **Objects are the base of JavaScript.** Arrays, functions and classes are all built on objects.

## ⚠️ Common mistakes

- **Using `obj.key` when the key is in a variable.** Use `obj[key]`.
- **Thinking `const` makes the object unchangeable.** Only the variable is locked. Use `Object.freeze` if you need that.
- **Copying with `=` and then changing the "copy"**, which changes the original.
- **Using `for...in` on arrays.** It loops over keys as strings and can include extra keys. Use `for...of` or array methods.

## 🗣️ How to answer in an interview

> "An object stores key–value pairs. I usually create them with object literals. I read with dot notation, or with brackets when the key is dynamic. To loop, I prefer `Object.keys`, `values` or `entries`, because they return arrays and only include own properties. `for...in` also walks inherited keys.
>
> The most important thing is that objects are stored by reference. Assigning or passing an object doesn't copy it. So I'm careful not to mutate objects that come from props or state, and I copy with spread or `structuredClone` when I need to change something. Also, `===` on two objects compares references, not contents."

## 🔁 Follow-up questions

### How do you compare two objects by value?

`===` won't work. For simple data you can compare `JSON.stringify` output (if the key order is the same). In real code, use a deep-equal helper like `util.isDeepStrictEqual` in Node, or a library such as Lodash `isEqual`.

### What is the difference between `Object.freeze` and `const`?

`const` stops the variable from pointing to another value. `Object.freeze` stops changes to the object's own top-level properties. Neither makes nested objects unchangeable.

### How do you remove a key without mutating the object?

Use rest destructuring: `const { password, ...safeUser } = user;`. Now `safeUser` has everything except `password`, and `user` is unchanged.

### What is `Object.groupBy`?

A newer built-in (ES2024) that groups an array into an object by a key: `Object.groupBy(candidates, (c) => c.city)`. It's available in Node 21+ and modern browsers.

## ✅ Quick check

### 1. What does this print?

```js
const a = { score: 1 };            // an object
const b = a;                       // b points to the SAME object
b.score = 99;                      // change it through b
console.log(a.score, a === b);     // ?
```

:::answer
**`99 true`.** `b` is not a copy. Both names point to one object.
:::

### 2. What does this print?

```js
const field = 'city';                         // a key stored in a variable
const user = { city: 'Kochi' };               // an object
console.log(user.field, user[field]);         // ?
```

:::answer
**`undefined Kochi`.** `user.field` looks for a key named "field". `user[field]` uses the variable's value, "city".
:::
