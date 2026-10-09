---
title: Maximum Average Subarray I
order: 28
difficulty: Easy
pattern: Sliding window
topic: dsa/pattern-sliding-window
---

## 📝 Problem

You get an array of numbers `nums` and a number `k`. Find the group of `k` numbers **next to each other** that has the biggest average. Return that average.

## 🧪 Examples

| Input | Output | Why |
|---|---|---|
| `nums = [1, 12, -5, -6, 50, 3]`, `k = 4` | `12.75` | `12 + -5 + -6 + 50 = 51`, and `51 / 4 = 12.75` |
| `nums = [5]`, `k = 1` | `5` | Only one group |
| `nums = [-1, -2, -3]`, `k = 2` | `-1.5` | `(-1 + -2) / 2` is the least negative |

## 🤔 Think first

Try it yourself for 10–15 minutes. Start with the simple way, then make it faster.

:::hint
Two groups next to each other share almost all their numbers. When you move one step right, what really changes?
:::

## ✅ Solution

:::solution
**Way 1 — Brute force (add up every group again)**

```js
function maxAverageBrute(nums, k) {
  let best = -Infinity;                                   // smaller than any real average
  for (let i = 0; i + k <= nums.length; i++) {            // every start where a full group fits
    const sum = nums.slice(i, i + k).reduce((s, x) => s + x, 0); // copy the group and add it up
    best = Math.max(best, sum / k);                       // keep the biggest average
  }
  return best;                                            // the answer
}
```

Time **O(n × k)**, because each group is added from scratch. Space **O(k)** for the copied slice.

**Way 2 — Sliding window (plain loop)**

```js
function maxAverage(nums, k) {
  let sum = 0;                                  // sum of the current window
  for (let i = 0; i < k; i++) sum += nums[i];   // add up the first k numbers
  let best = sum;                               // best sum seen so far
  for (let i = k; i < nums.length; i++) {       // slide the window one step at a time
    sum += nums[i] - nums[i - k];               // add the new right number, drop the old left one
    if (sum > best) best = sum;                 // remember the biggest sum
  }
  return best / k;                              // divide once at the end
}
```

Time **O(n)**, one pass. Space **O(1)**.

**Dry run:** `[1, 12, -5, -6, 50, 3]`, k = 4 → first sum `2` → add 50, drop 1 → `51` → add 3, drop 12 → `42` → best `51` → `51 / 4 = 12.75` ✅

**What to say:** "The simple way re-adds every group, which is O(n·k). Neighbouring groups share k−1 numbers, so I slide a window: add the new number and remove the old one. That's O(n) time and O(1) space. I compare sums and divide once at the end."
:::
