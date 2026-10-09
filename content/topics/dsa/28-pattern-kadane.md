---
title: "Pattern: Kadane's algorithm"
stack: dsa
order: 28
level: Intermediate
mustKnow: true
askedFrequency: very common
summary:
  - "Kadane's algorithm finds the largest sum of a continuous subarray in one pass."
  - "At each item, ask: is it better to continue the current run, or start fresh here? current = max(x, current + x)."
  - "Keep two numbers: current (best sum ending here) and best (best sum anywhere)."
  - "O(n) time, O(1) space, versus O(n²) for trying every start and end."
  - Start both values at the first item, so an all-negative array still works.
cards:
  - q: What problem does Kadane's algorithm solve?
    a: The maximum sum of a contiguous subarray (LeetCode "Maximum Subarray").
  - q: What is the key line of Kadane's algorithm?
    a: "current = Math.max(nums[i], current + nums[i]) — continue the run, or start fresh at this item."
  - q: Why start current and best at nums[0] and not at 0?
    a: If every number is negative, starting at 0 would wrongly return 0. The answer must be at least one real item.
  - q: What is Kadane's complexity?
    a: O(n) time and O(1) extra space.
  - q: How is Kadane related to "best time to buy and sell stock"?
    a: Both walk once and keep "best so far" plus a running value. Stock tracks the minimum price; Kadane tracks the best sum ending here.
---

## 💡 What is it?

Kadane's algorithm finds the **biggest sum of numbers that sit next to each other** in an array.

It walks through the array **once**. At each number, it asks one question: **"Should I keep adding to my current run, or start a new run from here?"**

If the run so far is dragging you down (it's negative), you drop it and start fresh.

**Spot it when the question says:** "maximum sum subarray", "largest sum of consecutive…", "best continuous stretch".

## 🏠 Real-life example

Think of a **cricket batter's runs, over by over**, where some overs are bad (negative, like losing wickets cost you).

You want the best continuous spell of overs. You keep a running total for the current spell.

- After each over, if the running total has gone **below what this one over gives alone**, the old spell is hurting you. Start a new spell from this over.
- You also write down the **best spell total ever seen**.

- The **overs** = array items.
- The **running spell total** = `current`.
- **"Start a new spell"** = `current = nums[i]`.
- The **best spell ever** = `best`.

## 🧑‍💻 Code example

Problem: **biggest sum of a continuous part of the array** (LeetCode "Maximum Subarray"). Save as `kadane.js` and run `node kadane.js`.

```js
// Problem: biggest sum of a continuous part of the array (LeetCode "Maximum Subarray")
function maxSubArrayBrute(nums) {                  // brute force: every start, every end
  let best = -Infinity;                            // smaller than any real sum
  for (let i = 0; i < nums.length; i++) {          // start position
    let sum = 0;                                   // running sum from i
    for (let j = i; j < nums.length; j++) {        // end position
      sum += nums[j];                              // extend the subarray by one
      best = Math.max(best, sum);                  // keep the biggest
    }                                              // end of inner loop
  }                                                // end of outer loop
  return best;                                     // the answer
}                                                  // end of maxSubArrayBrute

function maxSubArray(nums) {                       // Kadane's algorithm
  let current = nums[0];                           // best sum that ENDS at this position
  let best = nums[0];                              // best sum seen anywhere
  for (let i = 1; i < nums.length; i++) {          // walk once from the 2nd item
    current = Math.max(nums[i], current + nums[i]); // start fresh here, or keep going?
    best = Math.max(best, current);                // remember the best
  }                                                // end of loop
  return best;                                     // the answer
}                                                  // end of maxSubArray

const data = [-2, 1, -3, 4, -1, 2, 1, -5, 4];      // sample from the classic problem
console.log(maxSubArrayBrute(data));               // 6
console.log(maxSubArray(data));                    // 6 (from [4, -1, 2, 1])
console.log(maxSubArray([-3, -1, -2]));            // -1 (all negative → the biggest single number)
```

**Output:**

```text
6
6
-1
```

The brute force tries every start and end: **O(n²)**. Kadane walks once: **O(n)** time, **O(1)** space.

**Dry run** on `[-2, 1, -3, 4, -1, 2, 1, -5, 4]`:

| i | item | current = max(item, current + item) | best |
|---|---|---|---|
| 0 | -2 | -2 | -2 |
| 1 | 1 | max(1, -1) = **1** (fresh start) | 1 |
| 2 | -3 | max(-3, -2) = -2 | 1 |
| 3 | 4 | max(4, 2) = **4** (fresh start) | 4 |
| 4 | -1 | 3 | 4 |
| 5 | 2 | 5 | 5 |
| 6 | 1 | 6 | **6** |
| 7 | -5 | 1 | 6 |
| 8 | 4 | 5 | 6 |

## 🔍 Deeper version

**Template:**

```js
let current = nums[0], best = nums[0];          // start with the first item
for (let i = 1; i < nums.length; i++) {         // walk once
  current = Math.max(nums[i], current + nums[i]); // continue or restart
  best = Math.max(best, current);               // remember the best
}
```

**Why it works:** the best subarray that **ends at index i** is either just `nums[i]`, or `nums[i]` plus the best subarray ending at `i - 1`. That is a tiny piece of dynamic programming: each answer is built from the previous one.

**Returning the subarray itself:** keep `tempStart`. When you "start fresh", set `tempStart = i`. When `best` improves, save `start = tempStart` and `end = i`.

**Complexity:** **O(n)** time, **O(1)** space.

**Related problems:**
- **Maximum Subarray** (this one). See [Max subarray](topic:dsa/max-subarray).
- **Best Time to Buy and Sell Stock:** the same "best so far" idea. See [Buy and sell stock](topic:dsa/buy-sell-stock).
- **Maximum Product Subarray:** like Kadane, but track both the max and the min, because two negatives make a positive.

## 🎯 Why do we use it?

There are about n²/2 subarrays. Checking them all is slow for large inputs. Kadane notices that you never need to look back: one running number carries everything you need. It's a classic interview question because it tests whether you can find that insight.

## ⚠️ Common mistakes

- **Starting `current` and `best` at 0.** An all-negative array then wrongly returns 0. Start at `nums[0]`.
- **Resetting with `if (current < 0) current = 0`** before adding the item. It works only if you're careful with order and all-negative input. The `Math.max` form is safer.
- **Mixing up "subarray" (continuous) and "subsequence"** (can skip items). Kadane is for continuous parts.
- **Forgetting the empty-array case.** Say what you'd return, or throw.

## 🗣️ How to answer in an interview

> "Brute force tries every start and end, which is O(n²). Kadane's algorithm does it in one pass. I keep 'current', the best sum of a subarray ending at this index, and 'best', the best sum seen anywhere. At each number, current becomes the bigger of the number alone, or the number plus current. That decides whether to extend the run or start fresh. Then I update best. I start both at the first element, so an all-negative array returns its largest single number. It's O(n) time and O(1) space."

## 🔁 Follow-up questions

### What if the array is all negative?

The answer is the largest single number, like `-1` in `[-3, -1, -2]`. That's why both variables start at `nums[0]`.

### How would you return the actual subarray?

Track where the current run started. Whenever `best` improves, save that start and the current index as the answer's range.

### Is this dynamic programming?

Yes, a very small version. `current` at index i depends only on `current` at index i − 1, so you don't need a full table.

### What about the maximum product subarray?

Track both the largest and the smallest product ending here. A negative number can turn the smallest into the largest.

## ✅ Quick check

### 1. What does Kadane return for `[5, -9, 6]`?

:::answer
**6.** current goes 5 → max(-9, -4) = -4 → max(6, 2) = 6. best ends at 6, from `[6]` alone.
:::

### 2. What goes wrong if `best` starts at `0` for `[-4, -2, -7]`?

:::answer
It returns **0**, which isn't the sum of any real subarray. The correct answer is **-2**.
:::
