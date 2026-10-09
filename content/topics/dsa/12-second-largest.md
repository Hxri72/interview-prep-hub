---
title: Find the second largest number
stack: dsa
order: 12
level: Basic
mustKnow: true
askedFrequency: very common
summary:
  - "Way 1: remove duplicates, sort big to small, take index 1. Easy, but O(n log n)."
  - "Way 2 (what interviewers want): one loop with two variables, first and second. O(n) time, O(1) space."
  - "New biggest → the old biggest moves down to second. Between them (and not equal to first) → it becomes second."
  - Start both at -Infinity so negative numbers work.
  - Return null when there is no second largest, like [7, 7, 7].
cards:
  - q: How do you find the second largest number in one pass?
    a: Keep first and second, both -Infinity. If x > first, move first down to second and set first = x. Else if x > second and x !== first, set second = x.
  - q: Why start with -Infinity and not 0?
    a: With 0, an array of negatives like [-3, -1, -2] would wrongly answer 0. -Infinity is smaller than every number.
  - q: What is the second largest of [10, 5, 20, 20, 8]?
    a: 10. The duplicate 20 must not count as the second largest.
  - q: What should you return for [7, 7, 7]?
    a: There is no second largest. Return null (or -1, or throw), and say which one you chose.
  - q: Why is the sort solution worse?
    a: Sorting is O(n log n) and needs a copy. The one-loop solution is O(n) and O(1) space.
---

## 💡 What is it?

You get an array of numbers. Return the **second biggest different value**.

| Input | Output | Why |
|---|---|---|
| `[10, 5, 20, 20, 8]` | `10` | 20 is biggest; the repeated 20 doesn't count |
| `[7, 7, 7]` | `null` | there is no second value |
| `[-3, -1, -2]` | `-2` | works with negatives |

## 🏠 Real-life example

Think of a **school race**, where you want the **silver medal**.

You watch runners finish one by one. You hold two medals: gold and silver.

- A runner **faster than gold** arrives → gold moves to the silver holder, and this runner gets gold.
- A runner **faster than silver but not faster than gold** → they get silver.
- A runner who **ties exactly with gold** → no change. A tie isn't a new place.

Mapping:
- **Gold holder** = `first`.
- **Silver holder** = `second`.
- **Watching runners one by one** = one loop.
- **"No silver yet"** = `-Infinity`, so we return `null`.

## 🧑‍💻 Code example

Save as `second-largest.js` and run `node second-largest.js`.

```js
const arr = [10, 5, 20, 20, 8];                                 // input: 20 is the biggest, 10 is second

// Way 1 — remove duplicates, sort big to small, take index 1
const secondM = [...new Set(arr)].sort((a, b) => b - a)[1];     // b - a = big to small; [1] = second item

// Way 2 — one loop, two variables
function secondLargest(list) {                                  // list = the numbers
  let first = -Infinity, second = -Infinity;                    // -Infinity = smaller than any number
  for (const x of list) {                                       // look at each number once
    if (x > first) { second = first; first = x; }               // new biggest → old biggest moves down to second
    else if (x > second && x !== first) second = x;             // between them, and not a copy of first
  }                                                             // end of the loop
  return second === -Infinity ? null : second;                  // never changed → there is no second largest
}                                                               // end of secondLargest

console.log(secondM);                                           // 10
console.log(secondLargest(arr));                                // 10
console.log(secondLargest([7, 7, 7]));                          // null → all the same
console.log(secondLargest([-3, -1, -2]));                       // -2 → works with negatives
```

**Output:**

```text
10
10
null
-2
```

## 🔍 Deeper version

**Complexity:**

| Way | Time | Space |
|---|---|---|
| Set + sort | O(n log n) | O(n) |
| One loop | **O(n)** | **O(1)** |

**Dry run** of the loop on `[10, 5, 20, 20, 8]`:

| x | rule | first | second |
|---|---|---|---|
| 10 | x > first | 10 | -∞ |
| 5 | x > second | 10 | 5 |
| 20 | x > first | 20 | 10 |
| 20 | equal to first → skip | 20 | 10 |
| 8 | not > second (10) | 20 | 10 |

**Why `x !== first` matters:** without it, the second 20 would make `second = 20`. Then the answer would wrongly be 20.

**Edge cases:** empty array (`null`), one item (`null`), all equal (`null`), negatives (work), `-Infinity` itself in the data (rare; then use a "found" flag instead of the sentinel).

**K-th largest:** for any k, use a min-heap of size k (O(n log k)), or Quickselect (O(n) on average). For k = 2, two variables are simplest.

## 🎯 Why do we use it?

- **Rankings.** Runner-up scores, second-highest bids, the second-best candidate score.
- **The "track the best so far" idea.** It shows up in many problems, like max profit or Kadane's algorithm.
- **Interview signal.** It shows you can avoid sorting when one pass is enough.

## ⚠️ Common mistakes

- **Using `sort()` without a compare function.** `[10, 5, 20].sort()` sorts as text. Use `(a, b) => b - a`.
- **Not handling duplicates.** `[20, 20, 10]` must give 10, not 20.
- **Starting at 0.** It breaks for all-negative arrays.
- **Forgetting to move first down to second** when a new biggest arrives.

## 🗣️ How to answer in an interview

> "Should duplicates count? For example, is the second largest of [20, 20, 10] 20 or 10? I'll assume distinct values, so 10. And what should I return if there's no second value? I'll return null.
>
> The quick way is to remove duplicates, sort big to small, and take index 1. That's O(n log n).
>
> Better: one pass with two variables, first and second, both starting at minus infinity. A new biggest pushes the old one down to second. A value between them that isn't equal to first becomes second. That's O(n) time and O(1) space. Let me dry-run it with [10, 5, 20, 20, 8]…"

## 🔁 Follow-up questions

### What if duplicates should count (second of [20, 20, 10] is 20)?

Remove the `x !== first` check, and use `>=` when comparing with first.

### Find the second smallest.

Mirror the logic: start with `+Infinity` and flip the comparisons.

### Find the k-th largest for any k.

Use a min-heap of size k: push each value, and pop when the size passes k. The heap's top is the answer. O(n log k).

### Find the largest and second largest at the same time.

That's exactly this loop. `first` is the largest when it ends.

## ✅ Quick check

### 1. What does `secondLargest([5, 5, 3])` return?

:::answer
**3.** First becomes 5. The second 5 equals first, so it's skipped. Then 3 is bigger than -Infinity, so second = 3.
:::

### 2. What does `[1, 10, 2].sort()[1]` give?

:::answer
**`10`.** Without a compare function, `sort` compares as text: `['1', '10', '2']`. Index 1 is 10. Always use `(a, b) => a - b` for numbers.
:::
