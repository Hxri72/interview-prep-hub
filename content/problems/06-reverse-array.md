---
title: Reverse an array in place
order: 6
difficulty: Easy
pattern: Two pointers
topic: dsa/reverse-array
---

## 📝 Problem

Reverse an array **in place**. That means: change the same array, without making a new one. Return the array.

## 🧪 Examples

| Input | Output |
|---|---|
| `[1, 2, 3, 4, 5]` | `[5, 4, 3, 2, 1]` |
| `[1, 2]` | `[2, 1]` |
| `[9]` | `[9]` |
| `[]` | `[]` |

## 🤔 Think first

`arr.reverse()` exists. The interviewer will ask you to do it without it.

:::hint
Which two items must swap first? After that swap, which two are next?
:::

## ✅ Solution

:::solution
**Way 1 — Array methods**

```js
const reversed = (arr) => [...arr].reverse(); // copy first, because reverse() changes the original array
```

Time **O(n)**. Space **O(n)** for the copy. (Use `arr.reverse()` alone if changing the original is allowed.)

**Way 2 — Plain loop with two pointers (in place)**

```js
function reverseInPlace(arr) {
  let left = 0;                     // pointer at the start
  let right = arr.length - 1;       // pointer at the end
  while (left < right) {            // stop when the pointers meet in the middle
    const temp = arr[left];         // keep the left value safe
    arr[left] = arr[right];         // copy the right value to the left
    arr[right] = temp;              // put the saved left value on the right
    left++;                         // move the left pointer inward
    right--;                        // move the right pointer inward
  }
  return arr;                       // same array, now reversed
}
```

Time **O(n)** (n/2 swaps). Space **O(1)**.

**Dry run:** `[1, 2, 3, 4, 5]` → swap 1↔5 → swap 2↔4 → pointers meet at 3 → `[5, 4, 3, 2, 1]` ✅

**What to say:** "I use two pointers from both ends and swap until they meet. That's O(n) time and O(1) extra space. For an odd length the middle item stays where it is."
:::
