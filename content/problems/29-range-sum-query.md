---
title: Range Sum Query – Immutable
order: 29
difficulty: Easy
pattern: Prefix sum
topic: dsa/pattern-prefix-sum
---

## 📝 Problem

Build a small class `NumArray`.

- `new NumArray(nums)` receives an array of numbers. The array never changes.
- `sumRange(left, right)` returns the sum of the numbers from index `left` to index `right`, both included.

`sumRange` may be called **many thousands of times**, so it must be fast.

## 🧪 Examples

| Calls | Output |
|---|---|
| `nums = [-2, 0, 3, -5, 2, -1]`, `sumRange(0, 2)` | `1` |
| same array, `sumRange(2, 5)` | `-1` |
| same array, `sumRange(0, 5)` | `-3` |
| `nums = [7]`, `sumRange(0, 0)` | `7` |

## 🤔 Think first

:::hint
You are allowed to do some extra work **once**, in the constructor. What could you store there so each question needs only one or two steps?
:::

## ✅ Solution

:::solution
**Way 1 — Brute force (add the range every time)**

```js
class NumArrayBrute {
  constructor(nums) {
    this.nums = nums;                                    // just keep the array
  }
  sumRange(left, right) {
    return this.nums.slice(left, right + 1)              // copy the range (right is included, so + 1)
      .reduce((sum, x) => sum + x, 0);                   // add it up
  }
}
```

Each query is **O(n)**. With many queries this becomes slow.

**Way 2 — Prefix sums (plain loop)**

```js
class NumArray {
  constructor(nums) {
    this.prefix = [0];                                   // prefix[i] = sum of the first i numbers
    for (let i = 0; i < nums.length; i++) {              // walk the array once
      this.prefix.push(this.prefix[i] + nums[i]);        // running total so far
    }
  }
  sumRange(left, right) {
    return this.prefix[right + 1] - this.prefix[left];   // total up to right, minus total before left
  }
}
```

Building is **O(n)** once. Each query is **O(1)**. Space **O(n)** for the prefix array.

**Dry run:** `[-2, 0, 3, -5, 2, -1]` → prefix `[0, -2, -2, 1, -4, -2, -3]` → `sumRange(2, 5)` = `prefix[6] - prefix[2]` = `-3 - (-2)` = `-1` ✅

**What to say:** "Adding the range each time is O(n) per query. Since the array never changes, I build prefix sums once in O(n). Then any range is one subtraction, O(1). The leading 0 avoids a special case for left = 0."
:::
