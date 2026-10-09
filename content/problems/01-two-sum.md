---
title: Two Sum
order: 1
difficulty: Easy
pattern: Hash map / Set
topic: dsa/two-sum
---

## 📝 Problem

You get an array of numbers `nums` and a number `target`. Return the **indexes** (positions) of the two numbers that add up to `target`.

You may assume there is exactly one answer, and you can't use the same item twice.

## 🧪 Examples

| Input | Output | Why |
|---|---|---|
| `nums = [2, 7, 11, 15]`, `target = 9` | `[0, 1]` | `2 + 7 = 9` |
| `nums = [3, 2, 4]`, `target = 6` | `[1, 2]` | `2 + 4 = 6` |
| `nums = [3, 3]`, `target = 6` | `[0, 1]` | `3 + 3 = 6` |

## 🤔 Think first

Try it yourself for 10–15 minutes. Say out loud: the simple way, its speed, then how to make it faster.

:::hint
For each number, you already know which partner it needs: `target - number`. Where can you store the numbers you've already seen so you can check for the partner in one step?
:::

## ✅ Solution

:::solution
**Way 1 — Brute force with two loops (check every pair)**

```js
function twoSumBrute(nums, target) {
  for (let i = 0; i < nums.length; i++) {            // pick the first number
    for (let j = i + 1; j < nums.length; j++) {      // pick every number after it
      if (nums[i] + nums[j] === target) return [i, j]; // this pair adds up → return their positions
    }
  }
  return [];                                         // no pair found
}
```

Time **O(n²)** (a loop inside a loop). Space **O(1)** (only a few variables).

**Way 2 — One loop with a Map (the answer interviewers want)**

```js
function twoSum(nums, target) {
  const seen = new Map();                            // value → index of every number we've passed
  for (let i = 0; i < nums.length; i++) {
    const need = target - nums[i];                   // the partner this number needs
    if (seen.has(need)) return [seen.get(need), i];  // partner seen before → done
    seen.set(nums[i], i);                            // remember this number for later
  }
  return [];
}
```

Time **O(n)**, because we loop once and `Map` lookups are O(1). Space **O(n)** for the Map.

**Dry run:** `[2, 7, 11, 15]`, target `9` → i=0: need 7, not seen, store 2 → i=1: need 2, seen at index 0 → return `[0, 1]` ✅

**What to say:** "The brute force checks every pair, which is O(n²). If I store numbers I've seen in a Map, I can find each number's partner in O(1), so the whole thing becomes O(n) time, with O(n) extra space."
:::
