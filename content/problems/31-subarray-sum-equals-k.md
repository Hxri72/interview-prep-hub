---
title: Subarray Sum Equals K
order: 31
difficulty: Medium
pattern: Prefix sum
topic: dsa/pattern-prefix-sum
---

## 📝 Problem

You get an array of whole numbers `nums` (they can be negative) and a number `k`. Count how many groups of numbers **next to each other** add up to exactly `k`.

## 🧪 Examples

| Input | Output | Why |
|---|---|---|
| `nums = [1, 1, 1]`, `k = 2` | `2` | `[1, 1]` at index 0–1 and at 1–2 |
| `nums = [1, 2, 3]`, `k = 3` | `2` | `[1, 2]` and `[3]` |
| `nums = [1, -1, 0]`, `k = 0` | `3` | `[1, -1]`, `[1, -1, 0]` and `[0]` |
| `nums = [3]`, `k = 2` | `0` | No group adds to 2 |

## 🤔 Think first

:::hint
Keep a running total as you walk. If the total now is `S`, and some earlier running total was `S - k`, what does the part in between add up to?
:::

## ✅ Solution

:::solution
**Way 1 — Brute force (every start and end)**

```js
function subarraySumBrute(nums, k) {
  let count = 0;                              // how many groups we found
  for (let i = 0; i < nums.length; i++) {     // every possible start
    let sum = 0;                              // running sum from i
    for (let j = i; j < nums.length; j++) {   // extend to the right
      sum += nums[j];                         // add the next number
      if (sum === k) count++;                 // this group adds up to k
    }
  }
  return count;                               // the answer
}
```

Time **O(n²)**. Space **O(1)**.

**Way 2 — Prefix sum + Map (one loop)**

```js
function subarraySum(nums, k) {
  const seen = new Map([[0, 1]]);              // running total → how many times seen (0 seen once, before we start)
  let sum = 0;                                 // running total so far
  let count = 0;                               // groups found
  for (const x of nums) {                      // walk once
    sum += x;                                  // update the running total
    count += seen.get(sum - k) || 0;           // each earlier total of sum - k is one group ending here
    seen.set(sum, (seen.get(sum) || 0) + 1);   // remember this running total
  }
  return count;                                // the answer
}
```

Time **O(n)**. Space **O(n)** for the Map. A sliding window does **not** work here, because negative numbers break it.

**Dry run:** `[1, 1, 1]`, k = 2 → totals 1, 2, 3 → at 2: `0` seen once → count 1 → at 3: `1` seen once → count 2 ✅

**What to say:** "Brute force is O(n²). With running totals, a group from i to j adds to k when total(j) − total(i−1) = k. So for each total I look up how many earlier totals equal total − k, in a Map. I start the Map with {0: 1} so groups from index 0 count. O(n) time and space."
:::
