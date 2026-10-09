---
title: Remove Duplicates from Sorted Array
order: 38
difficulty: Easy
pattern: Two pointers
topic: dsa/pattern-two-pointers
---

## 📝 Problem

You get a **sorted** array `nums`. Remove the repeated values **in place** (change the same array, don't make a new one). Keep the original order.

Return `k`, the number of unique values. The first `k` positions of `nums` must hold those unique values. What is after them doesn't matter.

## 🧪 Examples

| Input | Return `k` | First `k` items |
|---|---|---|
| `[1, 1, 2]` | `2` | `[1, 2]` |
| `[0, 0, 1, 1, 1, 2, 2, 3, 3, 4]` | `5` | `[0, 1, 2, 3, 4]` |
| `[]` | `0` | `[]` |
| `[7]` | `1` | `[7]` |

## 🤔 Think first

:::hint
The array is sorted, so copies always sit next to each other. Keep one pointer for "where the next unique value goes".
:::

## ✅ Solution

:::solution
**Way 1 — Array methods (Set, then copy back)**

```js
function removeDuplicatesMethods(nums) {
  const unique = [...new Set(nums)];          // unique values, in order
  for (let i = 0; i < unique.length; i++) {   // copy them back to the front
    nums[i] = unique[i];                      // overwrite position i
  }
  return unique.length;                       // k = how many unique values
}
```

Time **O(n)**, but space **O(n)** for the Set. Interviewers usually want O(1) space here.

**Way 2 — Two pointers (in place)**

```js
function removeDuplicates(nums) {
  if (nums.length === 0) return 0;            // empty array → nothing to keep
  let k = 1;                                  // the first value is always unique
  for (let i = 1; i < nums.length; i++) {     // read every other value
    if (nums[i] !== nums[k - 1]) {            // different from the last kept value?
      nums[k] = nums[i];                      // write it at the next free spot
      k++;                                    // one more unique value
    }
  }
  return k;                                   // k unique values at the front
}
```

Time **O(n)**. Space **O(1)**.

**Dry run:** `[1, 1, 2]` → i = 1: 1 equals kept 1 → skip → i = 2: 2 is new → `nums[1] = 2`, k = 2 → `[1, 2]` ✅

**What to say:** "A Set is easy but uses O(n) extra space. Because the array is sorted, duplicates sit together. I use a slow pointer k for the next write spot and a fast pointer i to read. When I see a new value, I write it at k. O(n) time, O(1) space."
:::
