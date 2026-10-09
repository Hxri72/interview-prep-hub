---
title: Maximum Subarray
order: 30
difficulty: Medium
pattern: Kadane
topic: dsa/max-subarray
---

## 📝 Problem

You get an array of numbers `nums`. Some may be negative. Find the group of numbers **next to each other** (at least one number) with the biggest sum. Return that sum.

## 🧪 Examples

| Input | Output | Why |
|---|---|---|
| `[-2, 1, -3, 4, -1, 2, 1, -5, 4]` | `6` | `4 + -1 + 2 + 1 = 6` |
| `[1]` | `1` | Only one number |
| `[5, 4, -1, 7, 8]` | `23` | The whole array |
| `[-3, -1, -2]` | `-1` | All negative: pick the biggest single number |

## 🤔 Think first

:::hint
Walk from left to right. At each number, you have two choices for "the best group that ends here". What are they?
:::

## ✅ Solution

:::solution
**Way 1 — Brute force (try every start)**

```js
function maxSubArrayBrute(nums) {
  let best = -Infinity;                      // smaller than any real sum
  for (let i = 0; i < nums.length; i++) {    // every possible start
    let sum = 0;                             // running sum from i
    for (let j = i; j < nums.length; j++) {  // extend the group to the right
      sum += nums[j];                        // add the next number
      best = Math.max(best, sum);            // keep the biggest sum seen
    }
  }
  return best;                               // the answer
}
```

Time **O(n²)**. Space **O(1)**.

**Way 2 — Kadane's algorithm (one loop)**

```js
function maxSubArray(nums) {
  let current = nums[0];                           // best sum of a group that ends here
  let best = nums[0];                              // best sum seen anywhere
  for (let i = 1; i < nums.length; i++) {          // look at each next number
    current = Math.max(nums[i], current + nums[i]); // start fresh here, or keep adding?
    if (current > best) best = current;            // remember the best
  }
  return best;                                     // the answer
}
```

Time **O(n)**. Space **O(1)**.

**Dry run:** `[-2, 1, -3, 4, -1, 2, 1, -5, 4]` → current: -2, 1, -2, 4, 3, 5, 6, 1, 5 → best `6` ✅

**What to say:** "Brute force tries every start and end, O(n²). Kadane keeps the best sum ending at each index: either start fresh at this number or extend the previous group. If the running sum would hurt, I drop it. That's O(n) time, O(1) space, and it also works when every number is negative."
:::
