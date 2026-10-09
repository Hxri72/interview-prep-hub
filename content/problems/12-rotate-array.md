---
title: Rotate an array to the right by k
order: 12
difficulty: Medium
pattern: Reverse trick
topic: dsa/rotate-array
---

## 📝 Problem

Move every item **k places to the right**. Items that fall off the end come back at the start.

## 🧪 Examples

| Input | Output |
|---|---|
| `[1, 2, 3, 4, 5]`, k = 2 | `[4, 5, 1, 2, 3]` |
| `[1, 2, 3]`, k = 3 | `[1, 2, 3]` (a full turn) |
| `[1, 2, 3]`, k = 5 | `[2, 3, 1]` (5 steps = 2 steps) |
| `[]`, k = 4 | `[]` |

## 🤔 Think first

First handle a k that is bigger than the length. Then: can you do it **in place**, with O(1) extra memory?

:::hint
Reversing a whole array puts the last k items at the front — but backwards. What could fix the order of each part?
:::

## ✅ Solution

:::solution
**Way 1 — Array methods**

```js
const rotate = (arr, k) => {
  const n = arr.length;                          // how many items
  if (n === 0) return [];                        // nothing to rotate
  k = k % n;                                     // rotating n times gives the same array
  const cut = n - k;                             // where the last k items start
  return [...arr.slice(cut), ...arr.slice(0, cut)]; // last k items, then the rest
};
```

Time **O(n)**. Space **O(n)**.

**Way 2 — Plain loop, in place (reverse 3 times)**

```js
function rotateInPlace(arr, k) {
  const n = arr.length;                          // how many items
  if (n === 0) return arr;                       // nothing to rotate
  k = k % n;                                     // handle k bigger than n
  const reverse = (left, right) => {             // reverse arr between two positions
    while (left < right) {                       // until the pointers meet
      [arr[left], arr[right]] = [arr[right], arr[left]]; // swap the two ends
      left++;                                    // move inward
      right--;                                   // move inward
    }
  };
  reverse(0, n - 1);                             // 1) reverse everything
  reverse(0, k - 1);                             // 2) fix the first k items
  reverse(k, n - 1);                             // 3) fix the rest
  return arr;
}
```

Time **O(n)**. Space **O(1)**.

**Dry run:** `[1,2,3,4,5]`, k=2 → reverse all `[5,4,3,2,1]` → first 2 `[4,5,3,2,1]` → rest `[4,5,1,2,3]` ✅

**What to say:** "First k % n, because full turns change nothing. The slice version is O(n) time and space. For O(1) space I reverse the whole array, then the first k, then the rest."
:::
