---
title: Product of Array Except Self
order: 32
difficulty: Medium
pattern: Prefix sum
topic: dsa/product-except-self
---

## 📝 Problem

You get an array of numbers `nums`. Return a new array `answer`. Each `answer[i]` is the product of **all numbers except** `nums[i]`.

Rules: **don't use division**, and aim for O(n) time.

## 🧪 Examples

| Input | Output |
|---|---|
| `[1, 2, 3, 4]` | `[24, 12, 8, 6]` |
| `[-1, 1, 0, -3, 3]` | `[0, 0, 9, 0, 0]` |
| `[2, 3]` | `[3, 2]` |

## 🤔 Think first

:::hint
The product of everything except `nums[i]` = (product of everything **to the left** of i) × (product of everything **to the right** of i).
:::

## ✅ Solution

:::solution
**Way 1 — Brute force (multiply the others each time)**

```js
function productExceptSelfBrute(nums) {
  return nums.map((_, i) =>                          // one answer for each position i
    nums.reduce((product, x, j) =>                   // multiply all the numbers…
      (j === i ? product : product * x), 1));        // …skipping the one at i
}
```

Time **O(n²)**. Space **O(n)** for the result.

**Way 2 — Left products, then right products (two loops)**

```js
function productExceptSelf(nums) {
  const n = nums.length;                        // how many numbers
  const answer = new Array(n);                  // result array
  let left = 1;                                 // product of everything to the left
  for (let i = 0; i < n; i++) {                 // pass 1: left to right
    answer[i] = left;                           // store the left product
    left *= nums[i];                            // include this number for the next spot
  }
  let right = 1;                                // product of everything to the right
  for (let i = n - 1; i >= 0; i--) {            // pass 2: right to left
    answer[i] *= right;                         // left product × right product
    right *= nums[i];                           // include this number for the next spot
  }
  return answer;                                // the answer
}
```

Time **O(n)**. Extra space **O(1)** (the result array doesn't count). Note: `console.log` may show `-0` in the second example; `-0 === 0` is `true`.

**Dry run:** `[1, 2, 3, 4]` → after pass 1: `[1, 1, 2, 6]` → pass 2 multiplies by 24, 12, 4, 1 → `[24, 12, 8, 6]` ✅

**What to say:** "Brute force is O(n²). Without division, I split each answer into a left product and a right product. One pass fills left products, a second pass multiplies in right products with a single variable. O(n) time, O(1) extra space, and zeros need no special case."
:::
