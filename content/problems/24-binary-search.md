---
title: Binary search
order: 24
difficulty: Easy
pattern: Binary search
topic: dsa/pattern-binary-search
---

## 📝 Problem

You get an array sorted from small to big, with no duplicates, and a `target`. Return the **index** of `target`, or `-1` if it isn't there. Aim for **O(log n)** time.

## 🧪 Examples

| Input | Output |
|---|---|
| `[-1, 0, 3, 5, 9, 12]`, target `9` | `4` |
| `[-1, 0, 3, 5, 9, 12]`, target `2` | `-1` |
| `[5]`, target `5` | `0` |

## 🤔 Think first

:::hint
Look at the middle item. Compared with the target, which half can you throw away completely?
:::

## ✅ Solution

:::solution
**Way 1 — Built-in (linear)**

```js
const search = (arr, target) => arr.indexOf(target); // checks items one by one; -1 if missing
```

Time **O(n)**. Correct, but it ignores that the array is sorted.

**Way 2 — Binary search**

```js
function search(arr, target) {
  let low = 0, high = arr.length - 1;          // the part of the array still possible
  while (low <= high) {                        // while that part is not empty
    const mid = Math.floor((low + high) / 2);  // middle index
    if (arr[mid] === target) return mid;       // found it
    if (arr[mid] < target) low = mid + 1;      // target is bigger → keep the right half
    else high = mid - 1;                       // target is smaller → keep the left half
  }
  return -1;                                   // the range became empty → not found
}
```

Time **O(log n)**: 1,000,000 items need about 20 checks. Space **O(1)**.

**Dry run:** target 9 → mid 2 (3) too small → low 3 → mid 4 (9) → return `4` ✅

**What to say:** "Each check throws away half of what's left, so it's O(log n). I watch the loop condition `low <= high` and the `mid + 1` / `mid - 1` updates, because off-by-one errors are the usual bug."
:::
