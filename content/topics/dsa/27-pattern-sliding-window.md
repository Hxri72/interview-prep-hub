---
title: "Pattern: sliding window"
stack: dsa
order: 27
level: Intermediate
mustKnow: true
askedFrequency: very common
summary:
  - "Idea: keep a \"window\" over part of the array and slide it, updating the answer instead of recomputing."
  - "Fixed window: size k stays the same — add the new right item, remove the old left item."
  - "Variable window: grow the right edge; shrink the left edge when a rule breaks (e.g. a repeated letter)."
  - "Keywords: \"subarray of size k\", \"longest / shortest substring\", \"at most k\", \"in a row\"."
  - Turns O(n × k) or O(n²) into O(n).
cards:
  - q: What problems hint at the sliding window pattern?
    a: "Contiguous parts: \"subarray of size k\", \"longest substring without…\", \"shortest subarray with sum ≥ x\"."
  - q: How does a fixed-size window update its sum?
    a: "sum += arr[newRight] - arr[oldLeft] — one addition and one subtraction per step."
  - q: When does a variable window shrink?
    a: When the window breaks the rule, like having a repeated character or a sum above the limit. Move the left edge until it's valid again.
  - q: What is the complexity of sliding window?
    a: O(n) time — each item enters and leaves the window at most once. Space is O(1), or O(k) if you track contents in a Map.
  - q: Does sliding window work for "any subset" questions?
    a: No. It only works for contiguous (side-by-side) parts of the array or string.
---

## 💡 What is it?

A sliding window looks at a **continuous part** of an array or string, like a frame. Then it **slides** the frame one step at a time.

When it slides, you don't recount everything. You **add the item that enters** on the right and **remove the item that leaves** on the left.

There are two kinds:
- **Fixed window:** the size `k` never changes.
- **Variable window:** the window grows, and shrinks when a rule is broken.

**Spot it when the question says:** "subarray of size k", "k numbers in a row", "longest substring", "shortest subarray".

## 🏠 Real-life example

Think of **looking out of a train window**.

The window shows 3 houses at a time. When the train moves, one new house appears on the right. One old house disappears on the left. You don't look at all 3 houses again; you only notice the change.

- The **row of houses** = the array.
- The **train window** = the current window (from `start` to `end`).
- **One house appearing / disappearing** = adding `arr[end]` and removing `arr[start]`.
- A **stretchy window** that grows until something you don't like appears = the variable window.

## 🧑‍💻 Code example

Two problems: the **largest sum of k numbers in a row** (fixed), and the **longest substring without a repeating letter** (variable). Save as `pattern-window.js` and run `node pattern-window.js`.

```js
// Problem 1 (fixed window): largest sum of k numbers in a row
function maxSumKBrute(arr, k) {                    // brute force: add up every window again
  let best = -Infinity;                            // smaller than any real sum
  for (let i = 0; i + k <= arr.length; i++) {      // each start position
    let sum = 0;                                   // fresh sum for this window
    for (let j = i; j < i + k; j++) sum += arr[j]; // add the k numbers
    best = Math.max(best, sum);                    // keep the biggest
  }                                                // end of outer loop
  return best;                                     // the answer
}                                                  // end of maxSumKBrute

function maxSumK(arr, k) {                         // sliding window
  let sum = 0;                                     // sum of the current window
  for (let i = 0; i < k; i++) sum += arr[i];       // build the first window
  let best = sum;                                  // first window is the best so far
  for (let i = k; i < arr.length; i++) {           // slide one step at a time
    sum += arr[i] - arr[i - k];                    // add the new right item, drop the old left item
    best = Math.max(best, sum);                    // keep the biggest
  }                                                // end of loop
  return best;                                     // the answer
}                                                  // end of maxSumK

// Problem 2 (variable window): longest substring with no repeating letter
function longestUnique(s) {                        // window grows and shrinks
  const last = new Map();                          // letter → last index we saw it
  let start = 0;                                   // left edge of the window
  let best = 0;                                    // longest length found
  for (let end = 0; end < s.length; end++) {       // right edge moves one letter at a time
    const ch = s[end];                             // the new letter
    if (last.has(ch) && last.get(ch) >= start) {   // letter repeats inside the window
      start = last.get(ch) + 1;                    // shrink: jump the left edge past the old copy
    }                                              // end of if
    last.set(ch, end);                             // remember where we saw this letter
    best = Math.max(best, end - start + 1);        // window size = end - start + 1
  }                                                // end of loop
  return best;                                     // the answer
}                                                  // end of longestUnique

console.log(maxSumKBrute([2, 1, 5, 1, 3, 2], 3));  // 9 (5 + 1 + 3)
console.log(maxSumK([2, 1, 5, 1, 3, 2], 3));       // 9, but much faster on big arrays
console.log(longestUnique('abcabcbb'));            // 3 ("abc")
```

**Output:**

```text
9
9
3
```

The brute force re-adds k numbers for every start: **O(n × k)**. The sliding window does one add and one subtract per step: **O(n)**. The variable window also runs in **O(n)**, because each letter enters and leaves the window at most once.

## 🔍 Deeper version

**Fixed window template:**

```js
let sum = 0;                                   // window total
for (let i = 0; i < k; i++) sum += arr[i];     // build the first window
let best = sum;                                // answer so far
for (let i = k; i < arr.length; i++) {         // slide
  sum += arr[i] - arr[i - k];                  // in with the new, out with the old
  best = Math.max(best, sum);                  // update the answer
}
```

**Variable window template:**

```js
let start = 0;                                 // left edge
for (let end = 0; end < arr.length; end++) {   // right edge always moves forward
  // 1) add arr[end] to the window
  // 2) while the window is invalid: remove arr[start], start++
  // 3) update the answer with the valid window (end - start + 1)
}
```

**Complexity:** both are **O(n)** time. Space is **O(1)** for a sum, or **O(k)** / **O(alphabet size)** when a Map tracks what's inside.

**More problems that use it:**
- **Maximum Average Subarray I:** fixed window, then divide by k.
- **Longest Substring Without Repeating Characters:** the variable example above. See [Longest substring](topic:dsa/longest-substring).
- **Minimum Size Subarray Sum:** variable window that shrinks while the sum is still ≥ target.

## 🎯 Why do we use it?

Many questions ask about **every block of k items**, or **the best continuous stretch**. Recomputing each block from scratch wastes work, because neighbouring blocks share almost all their items. The window reuses that shared work.

## ⚠️ Common mistakes

- **Using it for non-contiguous questions**, like "any 3 numbers". The window only works for side-by-side items.
- **Off-by-one errors:** the window size is `end - start + 1`, and the first slide index is `k`.
- **Shrinking with `if` instead of `while`** in variable windows. Sometimes you must move the left edge several steps.
- **Not handling `k > arr.length`.** Return early or say what you'll return.

## 🗣️ How to answer in an interview

> "It asks for k numbers in a row, so it's a sliding window. The brute force adds up every block of k, which is O(n × k). Instead, I build the first window's sum once. Then, each time I slide right, I add the new number and subtract the one that left. I track the best sum as I go. That's O(n) time and O(1) space. For 'longest substring without repeats', I'd use a variable window: grow the right edge, and when a letter repeats, jump the left edge past its last position, using a Map of letter to last index."

## 🔁 Follow-up questions

### What if the array has negative numbers?

The fixed-size window still works. For "smallest subarray with sum ≥ target", negative numbers break the shrink rule. Then you'd use prefix sums. See [Prefix sum](topic:dsa/pattern-prefix-sum).

### How is sliding window different from two pointers?

It's a special case of two pointers moving in the same direction. Here the two pointers mark the edges of a window, and you track something about the inside (a sum or counts).

### Why is the variable window O(n) if it has a loop inside a loop?

The inner `while` only moves `start` forward. Across the whole run, `start` moves at most n times. So the total work is about 2n steps.

### What if they ask for the window itself, not just its size?

Store `bestStart` and `bestEnd` when you update `best`, then return `s.slice(bestStart, bestEnd + 1)`.

## ✅ Quick check

### 1. `[1, 2, 3, 4]` with k = 2. What are the window sums as it slides?

:::answer
**3, 5, 7.** 1+2 = 3 → (+3 −1) = 5 → (+4 −2) = 7. The largest is 7.
:::

### 2. Can sliding window answer "is there any pair of numbers (not next to each other) that sums to 10"?

:::answer
**No.** The numbers don't have to be next to each other. Use a hash set or two pointers instead.
:::
