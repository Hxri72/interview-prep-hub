---
title: Two Sum II (sorted input)
order: 23
difficulty: Medium
pattern: Two pointers
topic: dsa/pattern-two-pointers
---

## 📝 Problem

You get an array sorted from small to big, and a `target`. Find two **different** numbers that add up to `target`.

Return their positions **1-indexed** (the first item is position 1). There is exactly one answer. Use only O(1) extra memory.

## 🧪 Examples

| Input | Output | Why |
|---|---|---|
| `[2, 7, 11, 15]`, target `9` | `[1, 2]` | `2 + 7 = 9` |
| `[2, 3, 4]`, target `6` | `[1, 3]` | `2 + 4 = 6` |
| `[-1, 0]`, target `-1` | `[1, 2]` | `-1 + 0 = -1` |

## 🤔 Think first

:::hint
The array is sorted. If the sum of the two ends is too big, which end should move? If it's too small?
:::

## ✅ Solution

:::solution
**Way 1 — Brute force (check every pair)**

```js
function twoSumSorted(arr, target) {
  for (let i = 0; i < arr.length; i++) {          // pick the first number
    for (let j = i + 1; j < arr.length; j++) {    // pick every number after it
      if (arr[i] + arr[j] === target) return [i + 1, j + 1]; // +1 because positions are 1-indexed
    }
  }
  return [];                                      // no pair (won't happen here)
}
```

Time **O(n²)**, space **O(1)**.

**Way 2 — Two pointers**

```js
function twoSumSorted(arr, target) {
  let left = 0, right = arr.length - 1;          // smallest and biggest numbers
  while (left < right) {                         // the two pointers must stay different
    const sum = arr[left] + arr[right];          // current pair
    if (sum === target) return [left + 1, right + 1]; // found it (1-indexed)
    if (sum < target) left++;                    // too small → need a bigger left number
    else right--;                                // too big → need a smaller right number
  }
  return [];
}
```

Time **O(n)**, space **O(1)**.

**Dry run:** `[2, 3, 4]`, 6 → 2+4 = 6 → `[1, 3]` ✅

**What to say:** "Because it's sorted, moving the left pointer only makes the sum bigger, and moving the right only makes it smaller. So each step removes one number from the search. That's O(n) with no extra memory, which a hash map version can't give."
:::
