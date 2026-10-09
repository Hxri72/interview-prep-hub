---
title: Top K Frequent Elements
order: 35
difficulty: Medium
pattern: Hash map / Set
topic: dsa/top-k-frequent
---

## 📝 Problem

You get an array of numbers `nums` and a number `k`. Return the `k` numbers that appear **most often**. The order of the answer doesn't matter. You can assume the answer is unique.

## 🧪 Examples

| Input | Output |
|---|---|
| `nums = [1, 1, 1, 2, 2, 3]`, `k = 2` | `[1, 2]` |
| `nums = [1]`, `k = 1` | `[1]` |
| `nums = [4, 4, 5, 5, 5, 6]`, `k = 1` | `[5]` |

## 🤔 Think first

:::hint
First count. Then think: a number can appear at most `nums.length` times. Could you use the count itself as an index?
:::

## ✅ Solution

:::solution
**Way 1 — Count, then sort (array methods)**

```js
function topKSort(nums, k) {
  const count = new Map();                         // number → how many times
  for (const x of nums) count.set(x, (count.get(x) || 0) + 1); // count each number
  return [...count.entries()]                      // [[number, count], …]
    .sort((a, b) => b[1] - a[1])                   // biggest count first
    .slice(0, k)                                   // keep the top k
    .map((entry) => entry[0]);                     // keep just the numbers
}
```

Time **O(n log n)** because of the sort. Space **O(n)**.

**Way 2 — Count, then buckets (plain loops)**

```js
function topKFrequent(nums, k) {
  const count = new Map();                                    // number → how many times
  for (const x of nums) count.set(x, (count.get(x) || 0) + 1); // count each number
  const buckets = Array.from({ length: nums.length + 1 }, () => []); // buckets[f] = numbers seen f times
  for (const [num, f] of count) buckets[f].push(num);         // drop each number in its bucket
  const result = [];                                          // the answer
  for (let f = buckets.length - 1; f > 0 && result.length < k; f--) { // highest count first
    for (const num of buckets[f]) {                           // every number with this count
      result.push(num);                                       // take it
      if (result.length === k) break;                         // stop at k numbers
    }
  }
  return result;                                              // the answer
}
```

Time **O(n)**. Space **O(n)**.

**Dry run:** `[1, 1, 1, 2, 2, 3]` → counts `{1: 3, 2: 2, 3: 1}` → buckets[3] = [1], buckets[2] = [2] → `[1, 2]` ✅

**What to say:** "I count with a Map in O(n). Sorting the counts is O(n log n). To do better, I use bucket sort: counts go from 1 to n, so bucket i holds numbers seen i times. Reading buckets from the top gives the answer in O(n). A min-heap of size k is another O(n log k) option."
:::
