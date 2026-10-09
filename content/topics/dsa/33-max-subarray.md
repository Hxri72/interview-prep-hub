---
title: Maximum subarray (Kadane)
stack: dsa
order: 33
level: Intermediate
mustKnow: true
askedFrequency: very common
summary:
  - "Find the group of numbers next to each other (a subarray) with the biggest total."
  - "Brute force checks every start and end: O(n²) time."
  - "Kadane's idea: at each number, either continue the old subarray or start fresh here — whichever is bigger."
  - "Kadane is O(n) time and O(1) space. Track a start index to also return where the subarray is."
  - "If all numbers are negative, the answer is the biggest single number, not 0."
cards:
  - q: What does "maximum subarray" ask for?
    a: The largest sum of a block of numbers that sit next to each other in the array.
  - q: What is the one decision Kadane's algorithm makes at each number?
    a: "Is it better to continue the subarray I have, or to start a new one at this number? It keeps the bigger of current + x and x."
  - q: What are the time and space of Kadane's algorithm?
    a: O(n) time, because it looks at each number once. O(1) space, because it keeps only a few variables.
  - q: "What is the answer for [-3, -1, -2]?"
    a: "-1. When every number is negative, the best subarray is the single biggest number."
  - q: How do you also return where the best subarray starts and ends?
    a: Remember the index where the current subarray started. When you find a new best sum, save that start and the current index as the end.
---

## 💡 What is it?

You get an array of numbers. Some are positive and some are negative.

Find the **subarray with the biggest sum**. A subarray is a group of numbers that sit **next to each other**, with no gaps.

Example: `[-2, 1, -3, 4, -1, 2, 1, -5, 4]` → **6**, from the subarray `[4, -1, 2, 1]` (index 3 to 6).

## 🏠 Real-life example

Think of a **cricket batter's runs over many overs**, where some overs are a loss (negative) because of penalties.

You want the **best streak of overs in a row**.

- Each **over's score** = one number in the array.
- A **streak of overs in a row** = a subarray.
- Your **running streak total** = the `current` sum.
- If the streak so far is *dragging you down*, you **forget it and start counting fresh** from this over. That is Kadane's one decision.
- The **best streak you ever saw** = the `best` sum.

## 🧑‍💻 Code example

Save as `max-subarray.js`. Run `node max-subarray.js`.

```js
// Way 1 — brute force with array methods (check every subarray)
function maxSubArrayBrute(nums) {                      // nums = the array of numbers
  let best = -Infinity;                                // smaller than any real sum
  nums.forEach((_, start) => {                         // pick where the subarray starts
    nums.slice(start).reduce((sum, x) => {             // walk forward from start, adding numbers
      sum += x;                                        // running sum of nums[start..here]
      best = Math.max(best, sum);                      // remember the biggest sum seen
      return sum;                                      // pass the running sum to the next step
    }, 0);                                             // each start begins with sum 0
  });                                                  // end of the start loop
  return best;                                         // the largest sum of any subarray
}                                                      // end of maxSubArrayBrute

// Way 2 — Kadane's algorithm with a plain loop (also returns where the subarray is)
function maxSubArray(nums) {                           // nums = the array of numbers
  let current = nums[0], best = nums[0];               // best sum ending here, best sum overall
  let start = 0, bestStart = 0, bestEnd = 0;           // indexes of the current and best subarray
  for (let i = 1; i < nums.length; i++) {              // look at every number after the first
    if (nums[i] > current + nums[i]) {                 // starting fresh here is better than continuing
      current = nums[i];                               // new subarray starts at i
      start = i;                                       // remember where it starts
    } else {                                           // continuing is better (or equal)
      current = current + nums[i];                     // extend the current subarray
    }                                                  // end of the start-fresh choice
    if (current > best) {                              // found a new best sum
      best = current;                                  // save the sum
      bestStart = start;                               // save where it starts
      bestEnd = i;                                     // save where it ends
    }                                                  // end of the new-best check
  }                                                    // end of the loop
  return { sum: best, from: bestStart, to: bestEnd };  // sum plus the start and end indexes
}                                                      // end of maxSubArray

const nums = [-2, 1, -3, 4, -1, 2, 1, -5, 4];          // the classic example
console.log(maxSubArrayBrute(nums));                   // 6
console.log(maxSubArray(nums));                        // { sum: 6, from: 3, to: 6 }
console.log(nums.slice(3, 7));                         // the subarray itself: [4, -1, 2, 1]
console.log(maxSubArray([-3, -1, -2]));                // all negative: the biggest single number
```

**Output:**

```text
6
{ sum: 6, from: 3, to: 6 }
[ 4, -1, 2, 1 ]
{ sum: -1, from: 1, to: 1 }
```

## 🔍 Deeper version

**Complexity:**

| Way | Time | Space | Why |
|---|---|---|---|
| Brute force | O(n²) | O(1) | Every start × every end. |
| Kadane | O(n) | O(1) | One pass, a few variables. |

**Why "start fresh" works.** If `current` is negative, adding it to the next number only makes that number **smaller**. So a negative running sum can never help. Kadane's check `nums[i] > current + nums[i]` is the same as "is `current` negative?".

**Dry run** on `[-2, 1, -3, 4, -1, 2, 1, -5, 4]`:

| i | x | current (best ending here) | best so far |
|---|---|---|---|
| 0 | -2 | -2 | -2 |
| 1 | 1 | 1 (start fresh) | 1 |
| 2 | -3 | -2 | 1 |
| 3 | 4 | 4 (start fresh) | 4 |
| 4 | -1 | 3 | 4 |
| 5 | 2 | 5 | 5 |
| 6 | 1 | **6** | **6** |
| 7 | -5 | 1 | 6 |
| 8 | 4 | 5 | 6 |

**Edge cases:**
- **All negative** → start `best` at `nums[0]`, not `0`. Otherwise you would wrongly return 0.
- **One item** → the answer is that item.
- **Empty array** → ask the interviewer. Usually return `null` or throw an error.

This is the same idea as [the Kadane pattern](topic:dsa/pattern-kadane). The [buy and sell stock](topic:dsa/buy-sell-stock) problem is a close cousin.

## 🎯 Why do we use it?

- It is one of the most asked array questions (LeetCode "Maximum Subarray").
- It teaches a key habit: **keep the best answer ending here**, and build the next answer from it. That idea is the start of dynamic programming.
- Real uses: the best run of profit days, the strongest streak in data, the biggest gain in a score chart.

## ⚠️ Common mistakes

- **Starting `best` at 0.** It breaks when every number is negative.
- **Mixing up subarray and subsequence.** A subarray must be **next to each other**. You can't skip numbers.
- **Resetting to 0 instead of to `nums[i]`.** Reset to the current number, so a single negative number can still be the answer.
- **Forgetting to update the indexes** when you start fresh, if the question asks *where* the subarray is.

## 🗣️ How to answer in an interview

> "Let me repeat it: I need the largest sum of a block of numbers next to each other. Can the array be empty, and can all numbers be negative?
>
> The simple way is to try every start and every end. That's O(n²).
>
> I can do better with Kadane's algorithm. I walk once and keep two values. `current` is the best sum of a subarray ending at this number. `best` is the best sum I've seen anywhere. At each number I decide: continue the old subarray, or start fresh here? If the running sum is negative, starting fresh is better. Then I update `best`.
>
> That's O(n) time and O(1) space. I start both values at the first number, so an all-negative array works. If you want the subarray itself, I also track where the current run started."

## 🔁 Follow-up questions

### What if all numbers are negative?

Kadane still works if you start with `nums[0]` instead of `0`. The answer is the biggest single number.

### How would you return the subarray, not just the sum?

Keep a `start` index. Move it to `i` when you start fresh. When `current` beats `best`, save `bestStart = start` and `bestEnd = i`. Then `nums.slice(bestStart, bestEnd + 1)` is the subarray.

### Is this dynamic programming?

Yes, a very small form. `current` is "the best answer ending at i", and it is built from the answer ending at `i - 1`. We only keep the last value, so the space is O(1).

### Can you solve it with divide and conquer?

Yes. Split the array in half. The best subarray is in the left half, the right half, or crosses the middle. That is O(n log n), so Kadane is better. It is still a good answer to show you know more than one way.

## ✅ Quick check

### 1. What does this print?

```js
console.log(maxSubArray([5, -9, 6]).sum);   // using the Kadane function above
```

:::answer
**6.** At `-9`, current becomes `5 + -9 = -4`. At `6`, starting fresh (`6`) is better than continuing (`-4 + 6 = 2`). So the best is `6`.
:::

### 2. Why do we start `best` at `nums[0]` and not `0`?

:::answer
If all numbers are negative, the real answer is negative. Starting at `0` would wrongly return `0`, which is the sum of an *empty* subarray.
:::

### 3. What is the time complexity of Kadane's algorithm?

- A) O(n²)
- B) O(n log n)
- C) O(n)

:::answer
**C) O(n).** It looks at each number exactly once.
:::
