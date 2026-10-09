---
title: "Pattern: two pointers"
stack: dsa
order: 26
level: Intermediate
mustKnow: true
askedFrequency: very common
summary:
  - "Idea: use two indexes that move toward each other (or the same way) instead of a loop inside a loop."
  - "Keywords: \"sorted array\", \"pair with a sum\", \"palindrome\", \"reverse\", \"in place\", \"remove duplicates\"."
  - On a sorted array, if the sum is too small move the left pointer up; if too big, move the right pointer down.
  - Usually O(n) time and O(1) extra space — no Set or Map needed.
cards:
  - q: When do you think of two pointers?
    a: Sorted array + pair/sum questions, palindromes, reversing, merging two sorted lists, or changing an array in place.
  - q: In "sorted pair sum", what do you do when the sum is too small?
    a: Move the left pointer one step right, to a bigger number.
  - q: Why does two pointers need a sorted array for the sum problem?
    a: Sorting tells you which way to move. Bigger values are on the right, smaller on the left.
  - q: Complexity of two pointers on one array?
    a: O(n) time — each pointer moves at most n steps — and O(1) extra space.
  - q: Name two kinds of two-pointer movement.
    a: Opposite ends moving inward (pair sum, palindrome) and same direction, slow and fast (move zeros, remove duplicates).
---

## 💡 What is it?

Two pointers means using **two index variables** on the same array. Usually one starts at the **left end** and one at the **right end**. They move toward each other until they meet.

This replaces a loop inside a loop. Each step, you look at two items and decide which pointer to move.

**Spot it when the question says:** "sorted array", "pair that adds up to", "palindrome", "reverse", "in place".

## 🏠 Real-life example

Think of **two friends sharing a box of chocolates sorted by price**, cheapest on the left.

They want two chocolates that cost exactly ₹10 together. One friend stands at the cheap end. The other stands at the expensive end.

- If the two prices add up to **less** than ₹10, the cheap-end friend moves one step right, to a costlier chocolate.
- If they add up to **more**, the expensive-end friend moves one step left.
- If it's exactly ₹10, they're done.

- The **box sorted by price** = the sorted array.
- The **two friends** = the `left` and `right` pointers.
- **Moving one step** = `left++` or `right--`.

## 🧑‍💻 Code example

Problem: **in a sorted array, find two numbers that add up to the target** (LeetCode "Two Sum II"). Save as `pattern-two-pointers.js` and run `node pattern-two-pointers.js`.

```js
// Problem: sorted array, find two numbers that add up to target (LeetCode "Two Sum II")
function pairSumBrute(nums, target) {              // brute force: try every pair
  for (let i = 0; i < nums.length; i++) {          // first number
    for (let j = i + 1; j < nums.length; j++) {    // second number, after the first
      if (nums[i] + nums[j] === target) return [i, j]; // found the pair
    }                                              // end of inner loop
  }                                                // end of outer loop
  return [];                                       // no pair
}                                                  // end of pairSumBrute

function pairSum(nums, target) {                   // two pointers on a SORTED array
  let left = 0;                                    // left pointer starts at the smallest
  let right = nums.length - 1;                     // right pointer starts at the biggest
  while (left < right) {                           // stop when they meet
    const sum = nums[left] + nums[right];          // add the two ends
    if (sum === target) return [left, right];      // exact match → done
    if (sum < target) left++;                      // too small → move left up to a bigger number
    else right--;                                  // too big → move right down to a smaller number
  }                                                // end of loop
  return [];                                       // pointers met → no pair
}                                                  // end of pairSum

console.log(pairSumBrute([1, 3, 4, 6, 9], 10));    // [0, 4] → 1 + 9 = 10
console.log(pairSum([1, 3, 4, 6, 9], 10));         // [0, 4] too, but in one pass
```

**Output:**

```text
[ 0, 4 ]
[ 0, 4 ]
```

Both find `1 + 9 = 10`. The brute force checks every pair: **O(n²)**. Two pointers walks the array once: **O(n)** time, **O(1)** space.

**Dry run** on `[1, 3, 4, 6, 9]`, target `10`: 1 + 9 = 10 → found at once. Try target `7`: 1 + 9 = 10 (too big, right--) → 1 + 6 = 7 → found.

## 🔍 Deeper version

**Template A — opposite ends:**

```js
let left = 0, right = arr.length - 1;   // start at both ends
while (left < right) {                  // until they meet
  // look at arr[left] and arr[right]
  // move left++ or right-- based on a rule
}
```

**Template B — same direction (slow / fast):** `slow` marks where the next "good" item goes. `fast` scans every item. Used in [Move zeros](topic:dsa/move-zeros) and "Remove Duplicates from Sorted Array".

**Why it's correct (sorted pair sum):** if `arr[left] + arr[right]` is too small, then `arr[left]` can't pair with anything. Every other partner is even smaller. So it's safe to drop `left`. The same logic in reverse drops `right`.

**Complexity:** each pointer moves at most n times → **O(n)** time. Only two variables → **O(1)** space. If the array isn't sorted, sorting first costs **O(n log n)**.

**More problems that use it:**
- **Valid Palindrome / Reverse String:** compare or swap the two ends. See [Palindrome](topic:dsa/palindrome).
- **Merge Sorted Array:** one pointer per array. See [Merge sorted](topic:dsa/merge-sorted).
- **Container With Most Water** and **3Sum.** See [Container with most water](topic:dsa/container-most-water) and [3Sum](topic:dsa/three-sum).

## 🎯 Why do we use it?

It's as fast as the hash map pattern (O(n)) but uses **no extra memory**. It's also the natural way to change an array **in place**: reverse it, move zeros, or remove duplicates without making a new array.

## ⚠️ Common mistakes

- **Using it on an unsorted array** for a sum problem. The move rule only works when the array is sorted.
- **`while (left <= right)`** in pair problems. Then an item can pair with itself. Use `<`.
- **Forgetting to move a pointer**, which makes an infinite loop.
- **Sorting and then returning indexes.** Sorting changes the original positions. If the question wants original indexes, use a Map instead.

## 🗣️ How to answer in an interview

> "The array is sorted, so I'll use two pointers: one at the start and one at the end. If the sum is too small, I move the left pointer up to a bigger number. If it's too big, I move the right pointer down. If it's equal, I return the pair. Each pointer moves at most n steps, so it's O(n) time and O(1) space, which beats the O(n²) brute force. If the array weren't sorted, I'd either sort first in O(n log n) or use a hash map for O(n) time with O(n) space."

## 🔁 Follow-up questions

### What if the array is not sorted?

Either sort it first (O(n log n)), or use a Map of value → index (O(n) time, O(n) space). The Map keeps the original indexes. See [Two Sum](topic:dsa/two-sum).

### How do you find all pairs, not just one?

When you find a match, record it, then move **both** pointers. Skip equal values next to each other if duplicates aren't allowed.

### How is "slow / fast" different from "opposite ends"?

Opposite ends meet in the middle. Slow / fast both start on the left. `fast` reads every item and `slow` writes the ones you keep.

### Can two pointers work on two different arrays?

Yes. Merging two sorted arrays uses one pointer in each array and always takes the smaller item.

## ✅ Quick check

### 1. Sorted `[2, 3, 5, 8]`, target `11`. What is the first pair the pointers check, and which pointer moves?

:::answer
They check **2 + 8 = 10**. That's less than 11, so the **left** pointer moves to 3. Then 3 + 8 = 11 → found.
:::

### 2. What is the extra space used by two pointers on one array?

- A) O(1)
- B) O(n)
- C) O(log n)

:::answer
**A) O(1).** Only two index variables, no matter how big the array is.
:::
