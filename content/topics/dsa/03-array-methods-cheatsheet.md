---
title: "Array methods cheat sheet: which ones change the original"
stack: dsa
order: 3
level: Basic
mustKnow: true
askedFrequency: very common
summary:
  - "Methods that CHANGE the original array: push, pop, shift, unshift, splice, sort, reverse, fill."
  - "Methods that return a NEW value and leave the original alone: map, filter, slice, concat, toSorted, toReversed, toSpliced, with."
  - "The sort trap: sort() with no compare function sorts as text, so [10, 1, 2] becomes [1, 10, 2]. Use (a, b) => a - b."
  - If you must not change the input, copy first ([...arr]) or use the newer toSorted / toReversed / with.
  - Know the cost too — push/pop are O(1), shift/unshift are O(n).
cards:
  - q: Name four array methods that change the original array.
    a: push, pop, shift, unshift, splice, sort, reverse (and fill, copyWithin).
  - q: What does [10, 1, 2].sort() return, and why?
    a: "[1, 10, 2]. Without a compare function, sort turns items into text and compares them as text, so \"10\" comes before \"2\"."
  - q: How do you sort numbers small to big without changing the original?
    a: arr.toSorted((a, b) => a - b), or [...arr].sort((a, b) => a - b).
  - q: slice vs splice?
    a: slice(start, end) returns a copy of a part and doesn't change the array. splice(start, count) removes or inserts items and changes the array.
  - q: Why is shift() slower than pop()?
    a: shift removes the first item, so every other item must move one place — O(n). pop removes the last item — O(1).
---

## 💡 What is it?

A very common interview question: **"Does this method change the original array?"**

- Some methods **change (mutate)** the array you call them on.
- Others **return something new** and leave the original alone.

Getting this wrong causes real bugs, especially in React and Redux, where you must **never** change state directly. See [immutability](topic:redux-context/immutability).

## 🏠 Real-life example

Think of your **class notebook**.

- **Writing in your own notebook** with a pen = a mutating method (`sort`, `reverse`, `splice`). Your notebook is changed for good.
- **Photocopying a page and writing on the copy** = a non-mutating method (`map`, `filter`, `toSorted`). Your notebook stays clean.

If a friend borrows your notebook and writes in it, you get a surprise later. That surprise is the bug.

## 🧑‍💻 Code example

Save as `methods.js` and run `node methods.js`.

```js
const nums = [10, 1, 2];                           // our starting list

const sortedCopy = nums.toSorted((a, b) => a - b); // NEW sorted list; nums stays the same
console.log('toSorted:', sortedCopy, '| original:', nums); // show both

const textSorted = [...nums].sort();               // sort WITHOUT a compare function (on a copy)
console.log('sort() with no compare:', textSorted); // the "sort trap": compares as text

nums.sort((a, b) => a - b);                        // sort IN PLACE: changes nums itself
console.log('after sort():', nums);                // nums is now changed

const doubled = nums.map((x) => x * 2);            // map makes a NEW list
console.log('map:', doubled, '| original:', nums); // original is untouched

const removed = nums.splice(1, 1);                 // splice CHANGES nums: removes 1 item at position 1
console.log('splice removed:', removed, '| original now:', nums); // nums lost an item

const replaced = nums.with(0, 99);                 // with() returns a NEW list with position 0 = 99
console.log('with:', replaced, '| original:', nums); // original still the same
```

**Output:**

```text
toSorted: [ 1, 2, 10 ] | original: [ 10, 1, 2 ]
sort() with no compare: [ 1, 10, 2 ]
after sort(): [ 1, 2, 10 ]
map: [ 2, 4, 20 ] | original: [ 1, 2, 10 ]
splice removed: [ 2 ] | original now: [ 1, 10 ]
with: [ 99, 10 ] | original: [ 1, 10 ]
```

## 🔍 Deeper version

| Method | Changes original? | Returns | Cost |
|---|---|---|---|
| `push(x)` / `pop()` | ✏️ yes | new length / removed item | O(1) |
| `unshift(x)` / `shift()` | ✏️ yes | new length / removed item | **O(n)** |
| `splice(i, n, ...items)` | ✏️ yes | removed items | O(n) |
| `sort(fn)` | ✏️ yes | the same array | O(n log n) |
| `reverse()` | ✏️ yes | the same array | O(n) |
| `fill(v)` | ✏️ yes | the same array | O(n) |
| `map(fn)` / `filter(fn)` | 🆕 no | new array | O(n) |
| `slice(i, j)` | 🆕 no | new array (j not included) | O(j − i) |
| `concat` / `[...a, ...b]` | 🆕 no | new array | O(n + m) |
| `toSorted(fn)` / `toReversed()` | 🆕 no | new array | O(n log n) / O(n) |
| `toSpliced(...)` / `with(i, v)` | 🆕 no | new array | O(n) |
| `reduce`, `find`, `some`, `every`, `includes`, `indexOf`, `join` | 🆕 no | a value | O(n) |

:::version[Version note]
`toSorted`, `toReversed`, `toSpliced` and `with` were added in **ES2023**. They work in Node 20+ and all current browsers. In older code, people write `[...arr].sort()` to get the same safety.
:::

**The sort trap, explained.** With no compare function, `sort` converts items to **strings** and compares them letter by letter. `"10"` starts with `"1"`, so it comes before `"2"`. Always pass a compare function for numbers:
- `(a, b) => a - b` → small to big.
- `(a, b) => b - a` → big to small.

**Shallow copies.** `[...arr]` and `slice()` copy only the top level. Objects inside are still shared. See [shallow vs deep copy](topic:javascript/shallow-vs-deep-copy).

## 🎯 Why do we use it?

- **No surprise bugs.** A function that sorts its input in place changes the caller's data too.
- **React and Redux need new arrays.** If you `push` into state, React may not see the change, so the screen doesn't update.
- **Speed.** Knowing `shift` is O(n) stops you from writing a slow queue.

## ⚠️ Common mistakes

- **`sort()` on numbers without `(a, b) => a - b`.**
- **Using `reverse()` or `sort()` on a function's input** and changing the caller's array by accident.
- **Mixing up `slice` and `splice`.**
- **Using `shift()` in a loop** as a queue on big data — it's O(n) each time.

## 🗣️ How to answer in an interview

> "Some array methods mutate the original, like push, pop, shift, unshift, splice, sort and reverse. Others return a new array or value and leave the original alone, like map, filter, slice, concat, and the newer toSorted, toReversed and with.
>
> The classic trap is sort: without a compare function it compares items as strings, so [10, 1, 2] becomes [1, 10, 2]. For numbers I always pass (a, b) => a - b.
>
> In React or Redux state, I never mutate. I use map, filter, spread, or the 'to' methods so a new reference is created and the UI updates."

## 🔁 Follow-up questions

### How do you remove an item without changing the array?

`arr.filter((x, i) => i !== index)` or `arr.toSpliced(index, 1)`.

### How do you sort an array of objects by a field?

`users.toSorted((a, b) => a.age - b.age)` for numbers, or `(a, b) => a.name.localeCompare(b.name)` for text.

### Is `sort` stable in JavaScript?

Yes. Since ES2019, `sort` is **stable**: items that compare equal keep their original order.

### Why might `forEach` not be the best choice?

You can't `break` out of it, and it returns nothing. Use a `for…of` loop when you need to stop early, or `some`/`find`.

## ✅ Quick check

### 1. What does this print?

```js
const a = [3, 1, 2];        // original
const b = a.sort();         // sort it
console.log(a === b, a);    // ?
```

:::answer
**`true [ 1, 2, 3 ]`**. `sort` changes `a` in place and returns **the same array**, so `a === b` is true.
:::

### 2. What does `[5, 25, 100].sort()` return?

:::answer
**`[100, 25, 5]`**. As text, "100" < "25" < "5" because "1" < "2" < "5". Use `(a, b) => a - b` to get `[5, 25, 100]`.
:::

### 3. Which one does NOT change the original?

- A) `splice`
- B) `toSpliced`
- C) `reverse`

:::answer
**B) `toSpliced`** — it returns a new array.
:::
