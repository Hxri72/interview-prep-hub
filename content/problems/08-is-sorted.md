---
title: Check if an array is sorted
order: 8
difficulty: Easy
pattern: Single pass
topic: dsa/is-sorted
---

## 📝 Problem

Return `true` if the array is sorted from small to big. Equal neighbours are allowed. Otherwise return `false`.

## 🧪 Examples

| Input | Output |
|---|---|
| `[1, 2, 2, 5]` | `true` |
| `[3, 1, 2]` | `false` |
| `[4]` | `true` |
| `[]` | `true` (nothing is out of order) |

## 🤔 Think first

Do you need to sort the array to answer this? (You don't.)

:::hint
Being "sorted" is a rule about **neighbours**. Which two items do you compare at each step, and when can you stop early?
:::

## ✅ Solution

:::solution
**Way 1 — Array methods**

```js
const isSorted = (arr) =>
  arr.every((x, i) => i === 0 || arr[i - 1] <= x); // each item must be ≥ the one before it; every() stops at the first false
```

Time **O(n)**. Space **O(1)**.

**Way 2 — Plain loop**

```js
function isSortedLoop(arr) {
  for (let i = 1; i < arr.length; i++) {   // start at 1, so arr[i - 1] always exists
    if (arr[i - 1] > arr[i]) return false; // the previous one is bigger → not sorted, stop now
  }
  return true;                             // no problem found (also true for [] and [x])
}
```

Time **O(n)**, and it stops early. Space **O(1)**.

**Dry run:** `[3, 1, 2]` → compare 3 > 1 → return `false` straight away ✅

**What to say:** "I only compare neighbours. One pass, O(n), and it stops at the first wrong pair. Empty and one-item arrays count as sorted."
:::
