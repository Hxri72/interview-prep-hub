---
title: "Arrays and array methods (map, filter, reduce…)"
stack: javascript
order: 13
level: Basic
mustKnow: true
askedFrequency: very common
summary:
  - "map changes every item, filter keeps some items, reduce combines all items into one value."
  - find / findIndex give the first match; some / every answer yes-or-no questions.
  - "push, pop, shift, unshift, splice, sort and reverse CHANGE the original array; map, filter, slice and concat return a NEW one."
  - "Always give sort a compare function for numbers: sort((a, b) => a - b)."
  - "Modern copies: toSorted, toReversed and toSpliced return new arrays without changing the original."
cards:
  - q: What is the difference between map and forEach?
    a: map returns a new array with the changed items. forEach returns nothing (undefined); it's only for side effects.
  - q: "Why does [10, 1, 2].sort() give [1, 10, 2]?"
    a: Without a compare function, sort compares items as text. "10" comes before "2" in text order. Use sort((a, b) => a - b).
  - q: Name array methods that change (mutate) the original array.
    a: push, pop, shift, unshift, splice, sort, reverse, fill.
  - q: What does reduce do, and why pass a starting value?
    a: It walks the array and builds one result (a sum, an object, etc.). The starting value avoids errors on empty arrays and sets the result's type.
  - q: slice vs splice?
    a: slice(start, end) returns a copy of part of the array and doesn't change it. splice(start, count) removes or inserts items IN the original.
---

## 💡 What is it?

An **array** is an ordered list of values, like `[72, 45, 90]`. Each item has a position number called an **index**, starting at 0.

**Array methods** are built-in tools for working with lists. For example: change every item (`map`), keep some items (`filter`), or add them all up (`reduce`).

Some methods **change the original array**. Others **return a new array** and leave the original alone. Knowing which is which is a favourite interview question.

## 🏠 Real-life example

Think of a **teacher with a stack of answer sheets**.

- **map**: the teacher adds 5 bonus marks to *every* sheet. She gets a new stack with every sheet changed.
- **filter**: she keeps only the sheets that **passed**. She gets a new, smaller stack.
- **reduce**: she adds up **all** the marks to get one number, the class total.
- **find**: she looks for the **first** sheet that failed and stops there.
- **sort**: she **reorders the actual stack** on her desk. The original order is gone. (That's a method that changes the original.)

## 🧑‍💻 Code example

Save this as `arr.js`. Run it with `node arr.js`.

```js
const marks = [72, 45, 90, 38, 65];                // a list of 5 students' marks

const doubled = marks.map((m) => m * 2);           // map: a NEW array with every mark × 2
const passed = marks.filter((m) => m >= 50);       // filter: a NEW array with only marks ≥ 50
const total = marks.reduce((sum, m) => sum + m, 0); // reduce: add all marks; 0 = starting value of sum
const firstFail = marks.find((m) => m < 50);       // find: the FIRST mark below 50 (or undefined)
const allAbove30 = marks.every((m) => m > 30);     // every: true only if ALL marks are above 30
const sorted = marks.toSorted((a, b) => a - b);    // toSorted: a NEW sorted copy, small to big

console.log(doubled);                              // [144, 90, 180, 76, 130]
console.log(passed);                               // [72, 90, 65]
console.log(total);                                // 310
console.log(firstFail);                            // 45
console.log(allAbove30);                           // true
console.log(sorted);                               // the sorted copy
console.log(marks);                                // the original is unchanged so far

marks.sort((a, b) => b - a);                       // sort: CHANGES marks itself, big to small
console.log(marks);                                // now the original is changed
```

**Output:**

```text
[ 144, 90, 180, 76, 130 ]
[ 72, 90, 65 ]
310
45
true
[ 38, 45, 65, 72, 90 ]
[ 72, 45, 90, 38, 65 ]
[ 90, 72, 65, 45, 38 ]
```

## 🔍 Deeper version

**Changes the original (mutates) ✏️ vs returns something new 🆕:**

| Method | What it does | Mutates? |
|---|---|---|
| `push` / `pop` | add / remove at the end | ✏️ |
| `unshift` / `shift` | add / remove at the start | ✏️ |
| `splice(start, count, ...items)` | remove or insert in the middle | ✏️ |
| `sort`, `reverse`, `fill` | reorder / fill in place | ✏️ |
| `map`, `filter`, `slice`, `concat`, `flat`, `flatMap` | new array | 🆕 |
| `toSorted`, `toReversed`, `toSpliced`, `with(i, v)` | new copies of the mutating ones | 🆕 |
| `find`, `findIndex`, `findLast`, `includes`, `indexOf`, `some`, `every` | search / yes-no | (read only) |
| `reduce`, `join` | one value / a string | (read only) |

:::version[Version note]
`toSorted`, `toReversed`, `toSpliced` and `with` arrived in **ES2023**. They work in Node 20+ and all modern browsers. Before them, people copied first: `[...arr].sort(...)`.
:::

**The sort trap.** Without a compare function, `sort` turns items into **strings** and compares them as text. So `[10, 1, 2].sort()` gives `[1, 10, 2]`. For numbers, always use `(a, b) => a - b` (small to big) or `(a, b) => b - a` (big to small).

**reduce, step by step.** `reduce((acc, item) => ..., start)`. `acc` (the "accumulator") holds the result so far. Each step returns the new `acc`. Without a starting value, reduce uses the first item. On an empty array, that throws a TypeError. reduce can build any shape:

```js
const byCity = candidates.reduce((acc, c) => {        // group candidates by city
  (acc[c.city] ??= []).push(c.name);                  // make an empty list for a new city, then add the name
  return acc;                                         // give the object back for the next step
}, {});                                               // {} = start with an empty object
```

(Modern alternative: `Object.groupBy(candidates, (c) => c.city)`.)

**Chaining.** Because map and filter return arrays, you can chain them: `jobs.filter(j => j.open).map(j => j.title)`. Each step loops once. For very large arrays, one `reduce` or a `for` loop can be faster, but readability usually matters more.

**Speed.** Most methods are O(n): they look at every item once. `includes` or `indexOf` *inside* a loop makes it O(n²). Use a `Set` for fast lookups. (See the Arrays & DSA section.)

**Holes and `forEach`.** `forEach` can't be stopped with `break`. If you need to stop early, use `for...of`, `some` or `find`.

## 🎯 Why do we use it?

- **Clean, readable code.** `marks.filter(m => m >= 50)` says exactly what it does. A `for` loop needs more lines and more chances for bugs.
- **No accidental changes.** map and filter return new arrays. This matters in React and Redux, where state must not be changed directly.
- **Data shaping for APIs.** Turning API data into what the UI needs is mostly map, filter and reduce.

## ⚠️ Common mistakes

- **Using `sort()` on numbers without a compare function.**
- **Sorting or reversing state directly in React.** That changes the original state. Use `toSorted` or copy first.
- **Using `map` when you don't need the result.** Use `forEach` or `for...of` for side effects.
- **Forgetting to `return` inside `map` with curly braces.** `arr.map(x => { x * 2 })` gives `[undefined, ...]`. Write `x => x * 2` or add `return`.
- **reduce with no starting value on a possibly empty array.** It throws an error.

## 🗣️ How to answer in an interview

> "I use map to transform each item, filter to keep items that pass a test, and reduce to combine everything into one value, like a sum or a grouped object. find and some are good when I can stop at the first match.
>
> The big thing I watch is mutation. push, pop, splice, sort and reverse change the original array, while map, filter, slice and concat return new arrays. In React state, I never mutate. I use spread, or the newer `toSorted` and `toReversed` methods. And I always give sort a compare function for numbers, because the default sort compares strings, so `[10, 1, 2]` becomes `[1, 10, 2]`."

## 🔁 Follow-up questions

### map vs forEach?

`map` returns a new array of results. `forEach` returns `undefined` and is only for side effects, like logging. Neither can be stopped early with `break`.

### How do you remove duplicates from an array?

`[...new Set(arr)]`. A Set keeps only unique values, and spread turns it back into an array. It runs in O(n).

### What is the difference between `find` and `filter`?

`find` returns the **first** matching item (or `undefined`) and stops. `filter` always walks the whole array and returns **all** matches in a new array.

### How do you flatten a nested array?

`arr.flat()` flattens one level. `arr.flat(Infinity)` flattens every level. `flatMap` maps and then flattens one level in a single step.

## ✅ Quick check

### 1. What does this print?

```js
console.log([10, 1, 5, 2].sort());          // default sort
console.log([10, 1, 5, 2].sort((a, b) => a - b)); // number sort
```

:::answer
**`[1, 10, 2, 5]`** and then **`[1, 2, 5, 10]`**. The default sort compares text, so "10" comes before "2".
:::

### 2. What does this print?

```js
const nums = [1, 2, 3];                     // an array
const out = nums.map((n) => { n * 2; });    // curly braces but no return
console.log(out);                           // ?
```

:::answer
**`[ undefined, undefined, undefined ]`.** With curly braces you must write `return n * 2;`.
:::

### 3. Which of these change the original array? `slice`, `splice`, `concat`, `reverse`, `toReversed`

:::answer
**`splice` and `reverse`.** `slice`, `concat` and `toReversed` return new arrays.
:::
