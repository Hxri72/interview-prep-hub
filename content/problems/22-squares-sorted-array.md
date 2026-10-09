---
title: Squares of a sorted array
order: 22
difficulty: Easy
pattern: Two pointers
topic: dsa/pattern-two-pointers
---

## 📝 Problem

You get an array sorted from small to big. It may contain negative numbers. Return the **squares** of each number, also sorted from small to big.

## 🧪 Examples

| Input | Output |
|---|---|
| `[-4, -1, 0, 3, 10]` | `[0, 1, 9, 16, 100]` |
| `[-7, -3, 2, 3, 11]` | `[4, 9, 9, 49, 121]` |
| `[-5, -3, -1]` | `[1, 9, 25]` |

## 🤔 Think first

:::hint
After squaring, where can the **biggest** value be? Only in one of two places. Fill the answer from the back.
:::

## ✅ Solution

:::solution
**Way 1 — Square, then sort**

```js
const sortedSquares = (arr) =>
  arr.map((x) => x * x)          // square every number
     .sort((a, b) => a - b);     // sort numbers small to big (compare function needed!)
```

Time **O(n log n)** because of sorting.

**Way 2 — Two pointers from both ends**

```js
function sortedSquares(arr) {
  const n = arr.length;                       // how many numbers
  const result = new Array(n);                // answer, filled from the back
  let left = 0, right = n - 1;                // pointers at both ends
  for (let i = n - 1; i >= 0; i--) {          // place the biggest square first
    if (Math.abs(arr[left]) > Math.abs(arr[right])) { // the left end is bigger in size
      result[i] = arr[left] * arr[left];      // put its square here
      left++;                                 // move left inwards
    } else {                                  // the right end is bigger (or equal)
      result[i] = arr[right] * arr[right];    // put its square here
      right--;                                // move right inwards
    }
  }
  return result;
}
```

Time **O(n)**, space **O(n)** for the answer.

**Dry run:** `[-4, -1, 0, 3, 10]` → 10 vs 4 → 100 → 3 vs 4 → 16 → 3 vs 1 → 9 → 0 vs 1 → 1 → 0 → `[0, 1, 9, 16, 100]` ✅

**What to say:** "The simple way squares and sorts, O(n log n). The biggest square is always at one of the ends, so two pointers fill the answer from the back in O(n)."
:::
