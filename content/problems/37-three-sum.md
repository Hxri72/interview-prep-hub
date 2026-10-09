---
title: 3Sum
order: 37
difficulty: Medium
pattern: Two pointers
topic: dsa/three-sum
---

## 📝 Problem

You get an array of numbers `nums`. Find all **different** groups of three numbers (from three different positions) that add up to `0`. Don't return the same group twice. The groups can come back in any order.

## 🧪 Examples

| Input | Output |
|---|---|
| `[-1, 0, 1, 2, -1, -4]` | `[[-1, -1, 2], [-1, 0, 1]]` |
| `[0, 1, 1]` | `[]` |
| `[0, 0, 0, 0]` | `[[0, 0, 0]]` |

## 🤔 Think first

:::hint
Sort the array first. If you fix the first number, the problem becomes "find two numbers with a given sum" in a **sorted** array.
:::

## ✅ Solution

:::solution
**Way 1 — Brute force (three loops + a Set for duplicates)**

```js
function threeSumBrute(nums) {
  const seen = new Set();                                  // groups we already added, as strings
  const result = [];                                       // the answer
  for (let i = 0; i < nums.length; i++) {                  // first number
    for (let j = i + 1; j < nums.length; j++) {            // second number
      for (let k = j + 1; k < nums.length; k++) {          // third number
        if (nums[i] + nums[j] + nums[k] !== 0) continue;   // must add up to 0
        const group = [nums[i], nums[j], nums[k]].sort((a, b) => a - b); // sort so duplicates look the same
        const key = group.join(',');                       // e.g. "-1,0,1"
        if (!seen.has(key)) {                              // new group?
          seen.add(key);                                   // remember it
          result.push(group);                              // keep it
        }
      }
    }
  }
  return result;                                           // the answer
}
```

Time **O(n³)**. Space **O(number of answers)**.

**Way 2 — Sort + two pointers**

```js
function threeSum(nums) {
  const a = [...nums].sort((x, y) => x - y);              // sorted copy (numbers, so a compare function)
  const result = [];                                       // the answer
  for (let i = 0; i < a.length - 2; i++) {                 // fix the first number
    if (i > 0 && a[i] === a[i - 1]) continue;              // same first number as before → skip duplicates
    let left = i + 1;                                      // smallest remaining
    let right = a.length - 1;                              // biggest remaining
    while (left < right) {                                 // two pointers walk inward
      const sum = a[i] + a[left] + a[right];               // try this group
      if (sum < 0) left++;                                 // too small → bigger number
      else if (sum > 0) right--;                           // too big → smaller number
      else {                                               // found one
        result.push([a[i], a[left], a[right]]);            // keep it
        left++;                                            // move the left pointer in
        right--;                                           // and the right pointer in
        while (left < right && a[left] === a[left - 1]) left++;   // skip repeated left values
        while (left < right && a[right] === a[right + 1]) right--; // skip repeated right values
      }
    }
  }
  return result;                                           // the answer
}
```

Time **O(n²)** (sorting O(n log n) is smaller). Space **O(1)** extra, apart from the sorted copy and the result.

**Dry run:** sorted `[-4, -1, -1, 0, 1, 2]` → i = -4: no match → i = -1: finds `[-1, -1, 2]` and `[-1, 0, 1]` → next -1 skipped → done ✅

**What to say:** "Three loops is O(n³). I sort, fix one number, and use two pointers for the other two: too small, move left; too big, move right. I skip equal neighbours to avoid duplicate groups. That's O(n²), the expected interview answer."
:::
