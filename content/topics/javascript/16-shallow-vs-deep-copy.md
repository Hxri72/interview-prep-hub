---
title: "Shallow copy vs deep copy (structuredClone)"
stack: javascript
order: 16
level: Intermediate
mustKnow: true
askedFrequency: very common
summary:
  - A shallow copy copies only the top level. Nested objects and arrays are still shared with the original.
  - "Spread ({ ...obj }, [...arr]), Object.assign and Array.from all make SHALLOW copies."
  - A deep copy copies every level, so nothing is shared.
  - structuredClone(obj) is the built-in way to deep copy. It keeps Dates, Maps and Sets, but can't copy functions.
  - JSON.parse(JSON.stringify(obj)) is an old trick. It turns Dates into strings and drops functions and undefined.
cards:
  - q: What is a shallow copy?
    a: A new outer object or array, but the nested objects inside are the same ones as in the original (shared references).
  - q: Is { ...obj } a deep copy?
    a: No. It's shallow. Changing copy.address.city also changes the original's address.city.
  - q: What's the best built-in way to deep copy?
    a: structuredClone(value). It copies all levels and handles Dates, Maps, Sets and circular references.
  - q: What can structuredClone NOT copy?
    a: Functions, DOM nodes and class prototypes (class instances come back as plain objects). Functions throw a DataCloneError.
  - q: Why is JSON.parse(JSON.stringify(x)) risky?
    a: Dates become strings, undefined and functions disappear, Infinity/NaN become null, Maps/Sets become {}, and circular references throw.
---

## 💡 What is it?

When you copy an object, you might copy **only the top level** or **every level inside it**.

- A **shallow copy** makes a new outer box. But the boxes **inside** it are still the same ones as in the original. They are shared.
- A **deep copy** makes new boxes **at every level**. Nothing is shared.

This matters because objects are stored **by reference**. Two variables can point to the same object. (See [objects](topic:javascript/objects).)

## 🏠 Real-life example

Think of a **school bag with a pencil box inside**.

- **Shallow copy**: your friend buys an **identical new bag**. But instead of buying a new pencil box, they put **your** pencil box inside it. If they lose a pencil from "their" box, your pencil box loses it too, because it's the same box.
- **Deep copy**: your friend buys a new bag **and** a new pencil box **and** new pencils. Now the two bags are fully separate.

So:
- **The bag** = the top-level object.
- **The pencil box inside** = a nested object.
- **Shallow copy** = new bag, same pencil box.
- **Deep copy** = new everything.

## 🧑‍💻 Code example

Save this as `copy.js`. Run it with `node copy.js`.

```js
const original = { name: 'Asha', marks: { maths: 90 }, joined: new Date('2024-01-15') }; // object with a nested object and a Date

const shallow = { ...original };                 // SHALLOW copy: new outer object, same inner marks object
const deep = structuredClone(original);          // DEEP copy: new objects at every level

shallow.name = 'Ravi';                           // change a top-level value in the shallow copy
shallow.marks.maths = 40;                        // change a NESTED value in the shallow copy
console.log(original.name);                      // 'Asha' → top level was really copied
console.log(original.marks.maths);               // 40 → nested object was SHARED, so the original changed!

deep.marks.maths = 10;                           // change a nested value in the deep copy
console.log(original.marks.maths);               // still 40 → the deep copy doesn't touch the original
console.log(deep.joined instanceof Date);        // true → structuredClone keeps Dates as Dates

const viaJson = JSON.parse(JSON.stringify(original)); // the OLD deep-copy trick
console.log(typeof viaJson.joined);              // 'string' → the Date was turned into text!
```

**Output:**

```text
Asha
40
40
true
string
```

**What to notice:** the shallow copy **changed the original's maths mark**. This is the bug that this topic is about.

## 🔍 Deeper version

**Which tools make which kind of copy:**

| Tool | Copy type | Notes |
|---|---|---|
| `{ ...obj }`, `Object.assign({}, obj)` | shallow | most common |
| `[...arr]`, `arr.slice()`, `Array.from(arr)`, `arr.concat()` | shallow | for arrays |
| `structuredClone(obj)` | deep | built-in, keeps Date/Map/Set/RegExp, handles circular references |
| `JSON.parse(JSON.stringify(obj))` | deep, but lossy | Dates → strings; drops `undefined` and functions; Map/Set → `{}`; circular → throws |
| Lodash `cloneDeep` | deep | a library option; also copies some things structuredClone can't |

**What `structuredClone` can't copy:**
- **Functions** → it throws a `DataCloneError`.
- **DOM nodes** → error.
- **Class instances** → copied as **plain objects**, so their methods (from the prototype) are lost.
- Getters and setters are read as plain values.

:::version[Version note]
`structuredClone` became a built-in in **Node 17** and in all modern browsers around **2022**. Before that, people used the JSON trick or Lodash.
:::

**Shallow copies are often enough, and faster.** In React and Redux, you usually update immutably, **level by level**:

```js
setUser({                                        // make a NEW user object
  ...user,                                       // copy all top-level fields
  address: { ...user.address, city: 'Pune' },    // make a NEW address object with the changed city
});                                              // other nested objects stay shared, and that's fine
```

Only the path you change gets new objects. Shared, unchanged parts are fine, and they help React skip re-renders. A deep copy of a big state on every change is slow and makes everything look "changed".

**Primitives are always copied.** Strings, numbers and booleans are copied by value. Only objects, arrays, Maps and similar are shared by reference.

## 🎯 Why do we use it?

- **To avoid hidden bugs.** Changing a "copy" and accidentally changing the original is a very common bug, especially with nested data.
- **React and Redux need new objects** to detect changes. Mutating state directly means React may not re-render.
- **Safe data handling.** When you change a config or an API response for one use, you don't want to break other code that uses the same object.

## ⚠️ Common mistakes

- **Thinking spread is a deep copy.** It's shallow.
- **Using the JSON trick on data with Dates.** Your Dates become strings, and later date maths fails.
- **Deep cloning class instances and expecting methods to work.** `structuredClone` returns a plain object.
- **Deep copying huge state on every update.** It's slow and breaks memoisation. Copy only the path you change.

## 🗣️ How to answer in an interview

> "A shallow copy creates a new top-level object, but nested objects are still shared by reference. A deep copy duplicates every level. Spread, `Object.assign` and `slice` are all shallow. So if I spread a user object and then change `copy.address.city`, the original changes too.
>
> For a real deep copy I use `structuredClone`, which is built in. It handles Dates, Maps, Sets and circular references, but it can't copy functions, and class instances come back as plain objects. The old `JSON.parse(JSON.stringify())` trick turns Dates into strings and drops undefined values, so I avoid it.
>
> In React state, I usually don't deep copy at all. I copy only the path I'm changing, level by level, with spread. That's faster, and it keeps unchanged parts the same reference."

## 🔁 Follow-up questions

### How would you write your own deep clone?

Use recursion. If the value is not an object, return it. If it's an array, map each item through the function. If it's an object, create a new object and clone each value. To handle circular references, keep a `WeakMap` of objects you've already copied. Dates, Maps and Sets need special cases, which is why `structuredClone` is better.

### Does `Object.freeze` make a deep freeze?

No. It's shallow too. Nested objects can still change. A deep freeze needs recursion.

### Why does React care about new references?

React and `React.memo` compare props and state with `Object.is`, which checks references. If you mutate an object and pass the same reference, React thinks nothing changed.

### Does `structuredClone` work in Node?

Yes. It has been a global function since Node 17, so no import is needed.

## ✅ Quick check

### 1. What does this print?

```js
const a = [[1, 2], [3, 4]];          // an array of arrays
const b = [...a];                    // shallow copy
b[0].push(99);                       // change a NESTED array
console.log(a[0]);                   // ?
```

:::answer
**`[ 1, 2, 99 ]`.** Spread copied only the outer array. `b[0]` and `a[0]` are the same inner array.
:::

### 2. What does this print?

```js
const data = { when: new Date(0), note: undefined };   // a Date and an undefined value
const copy = JSON.parse(JSON.stringify(data));          // JSON trick
console.log(typeof copy.when, 'note' in copy);         // ?
```

- A) `object true`
- B) `string false`
- C) `string true`

:::answer
**B) `string false`.** JSON turns the Date into a string, and `undefined` values are dropped completely.
:::

### 3. What happens with `structuredClone({ save() {} })`?

:::answer
**It throws a `DataCloneError`.** structuredClone can't copy functions.
:::
