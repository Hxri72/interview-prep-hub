---
title: Move zeros to the end
order: 2
difficulty: Easy
pattern: Two pointers
topic: dsa/move-zeros
---

## 📝 Problem

Move all `0`s in an array to the end. Keep the other numbers in the **same order** they were in.

## 🧪 Examples

| Input | Output |
|---|---|
| `[0, 1, 0, 3, 12]` | `[1, 3, 12, 0, 0]` |
| `[0]` | `[0]` |
| `[1, 2, 3]` | `[1, 2, 3]` |

## 🤔 Think first

:::hint
Keep a pointer `pos` that says "the next non-zero number should go here". Walk through the array once. Every time you find a non-zero number, put it at `pos` and move `pos` forward.
:::

## ✅ Solution

:::solution
**Way 1 — Array methods (short and clear)**

```js
const moveZeros = (arr) => [
  ...arr.filter((x) => x !== 0),   // all the non-zero numbers, in their original order
  ...arr.filter((x) => x === 0),   // then all the zeros
];
```

Time **O(n)** (two passes). Space **O(n)**, because it builds a new array.

**Way 2 — Plain loop, in place (no new array)**

```js
function moveZerosInPlace(arr) {
  let pos = 0;                                     // where the next non-zero number should go
  for (let i = 0; i < arr.length; i++) {
    if (arr[i] !== 0) {                            // found a non-zero number
      [arr[pos], arr[i]] = [arr[i], arr[pos]];     // swap it forward to position pos
      pos++;                                       // the next non-zero goes one place later
    }
  }
  return arr;
}
```

Time **O(n)**. Space **O(1)**, because it changes the same array.

**What to say:** "The filter version is easy to read but creates a new array. If the interviewer wants it in place, I use two pointers: `pos` marks where the next non-zero goes, and I swap as I go. That's O(n) time and O(1) space."
:::
