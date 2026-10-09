---
title: Search insert position
order: 25
difficulty: Easy
pattern: Binary search
topic: dsa/pattern-binary-search
---

## 📝 Problem

You get an array sorted from small to big, with no duplicates, and a `target`. If `target` is there, return its index. If not, return the index where it **would be inserted** to keep the array sorted. Aim for O(log n).

## 🧪 Examples

| Input | Output | Why |
|---|---|---|
| `[1, 3, 5, 6]`, target `5` | `2` | found at index 2 |
| `[1, 3, 5, 6]`, target `2` | `1` | goes between 1 and 3 |
| `[1, 3, 5, 6]`, target `7` | `4` | goes at the end |
| `[1, 3, 5, 6]`, target `0` | `0` | goes at the start |

## 🤔 Think first

:::hint
You are looking for the first position whose value is **not smaller** than the target. Can binary search find "the first position where something becomes true"?
:::

## ✅ Solution

:::solution
**Way 1 — Array method (linear)**

```js
function searchInsert(arr, target) {
  const i = arr.findIndex((x) => x >= target); // first value not smaller than target
  return i === -1 ? arr.length : i;            // none found → insert at the end
}
```

Time **O(n)**.

**Way 2 — Binary search for the "lower bound"**

```js
function searchInsert(arr, target) {
  let low = 0, high = arr.length;             // high = length, because "insert at the end" is allowed
  while (low < high) {                        // stop when low and high meet
    const mid = Math.floor((low + high) / 2); // middle index
    if (arr[mid] < target) low = mid + 1;     // mid is too small → answer is to the right
    else high = mid;                          // mid could be the answer → keep it
  }
  return low;                                 // first index with value >= target
}
```

Time **O(log n)**, space **O(1)**.

**Dry run:** target 2 → low 0, high 4 → mid 2 (5) → high 2 → mid 1 (3) → high 1 → mid 0 (1) → low 1 → return `1` ✅

**What to say:** "This is the lower-bound version of binary search. `high` starts at the length, and I use `high = mid`, not `mid - 1`, because mid might be the answer. It returns the right index whether or not the target exists."
:::
