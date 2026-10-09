---
title: Container With Most Water
order: 36
difficulty: Medium
pattern: Two pointers
topic: dsa/container-most-water
---

## 📝 Problem

You get an array `height`. Each number is the height of a vertical line, and the lines stand 1 unit apart. Pick **two** lines. Together with the floor, they hold water. The water amount is:

`width × the shorter line's height`

Return the biggest amount of water possible.

## 🧪 Examples

| Input | Output | Why |
|---|---|---|
| `[1, 8, 6, 2, 5, 4, 8, 3, 7]` | `49` | Lines at index 1 (8) and 8 (7): width 7 × height 7 |
| `[1, 1]` | `1` | Width 1 × height 1 |
| `[4, 3, 2, 1, 4]` | `16` | The two 4s: width 4 × height 4 |

## 🤔 Think first

:::hint
Start with the widest pair: the first and last line. If you move a pointer inward, the width shrinks. Which pointer is the only one worth moving?
:::

## ✅ Solution

:::solution
**Way 1 — Brute force (every pair)**

```js
function maxAreaBrute(height) {
  let best = 0;                                          // most water found
  for (let i = 0; i < height.length; i++) {              // left line
    for (let j = i + 1; j < height.length; j++) {        // right line
      const area = Math.min(height[i], height[j]) * (j - i); // shorter line × width
      best = Math.max(best, area);                       // keep the biggest
    }
  }
  return best;                                           // the answer
}
```

Time **O(n²)**. Space **O(1)**.

**Way 2 — Two pointers (one loop)**

```js
function maxArea(height) {
  let left = 0;                                            // start at the far left
  let right = height.length - 1;                           // and the far right
  let best = 0;                                            // most water found
  while (left < right) {                                   // until the pointers meet
    const area = Math.min(height[left], height[right]) * (right - left); // water for this pair
    if (area > best) best = area;                          // remember the best
    if (height[left] < height[right]) left++;              // move the SHORTER line inward
    else right--;                                          // (moving the taller one can't help)
  }
  return best;                                             // the answer
}
```

Time **O(n)**. Space **O(1)**.

**Dry run:** `[1, 8, 6, 2, 5, 4, 8, 3, 7]` → (0, 8): 8 → move left → (1, 8): 49 → move right … → best `49` ✅

**What to say:** "Brute force checks all pairs, O(n²). With two pointers I start wide. The shorter line limits the water, so moving the taller one can only lose width without gaining height. I always move the shorter line. That's O(n), O(1) space."
:::
