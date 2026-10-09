---
title: Check if an array is sorted
stack: dsa
order: 9
level: Basic
mustKnow: false
askedFrequency: sometimes
summary:
  - Compare each item with the one just before it. If any earlier item is bigger, the array is not sorted.
  - "Way 1: arr.every((x, i) => i === 0 || arr[i - 1] <= x)."
  - "Way 2: a for loop from index 1 that returns false at the first problem."
  - Both are O(n) time and O(1) extra space. Both stop early when they find a problem.
  - Empty arrays and one-item arrays count as sorted.
cards:
  - q: How do you check if an array is sorted small to big?
    a: Walk from index 1 and compare each item with the one before it. If any previous item is bigger, return false. Otherwise return true.
  - q: Is [1, 2, 2, 5] sorted?
    a: Yes. Equal neighbours are allowed when we check "small to big" with <=.
  - q: What is the time and space complexity?
    a: O(n) time, because we look at each item at most once. O(1) space, because we only use a counter.
  - q: Why start the loop at index 1?
    a: So arr[i - 1] always exists. At index 0 there is no item before it.
  - q: Is an empty array sorted?
    a: Yes. There are no two items in the wrong order, so the function returns true.
---

## 💡 What is it?

You get an array of numbers. Return `true` if it is sorted from **small to big**. Otherwise return `false`.

| Input | Output | Why |
|---|---|---|
| `[1, 2, 2, 5]` | `true` | every item is ≥ the one before it |
| `[3, 1, 2]` | `false` | 3 is bigger than 1 |
| `[]` | `true` | nothing can be out of order |

## 🏠 Real-life example

Think of students standing in a line **by height**.

A teacher walks down the line. The teacher only compares each student with the **one just in front**. If someone is shorter than the person in front, the teacher stops and says "not in order".

- Each **student** = one item in the array.
- **Comparing with the one in front** = `arr[i - 1] <= arr[i]`.
- **Stopping at the first problem** = `return false` early.
- **Reaching the end happily** = `return true`.

The teacher never needs to compare the first student with the last one. Neighbours are enough.

## 🧑‍💻 Code example

Save as `is-sorted.js` and run `node is-sorted.js`.

```js
// Way 1 — array methods
const isSortedM = (arr) => arr.every((x, i) => i === 0 || arr[i - 1] <= x); // each item must be >= the one before it

// Way 2 — plain loop
function isSortedL(arr) {                        // arr = the list to check
  for (let i = 1; i < arr.length; i++) {         // start at 1, so arr[i - 1] always exists
    if (arr[i - 1] > arr[i]) return false;       // previous is bigger → not sorted, stop early
  }                                              // end of the loop
  return true;                                   // no problem found → sorted
}                                                // end of isSortedL

console.log(isSortedM([1, 2, 2, 5]));            // true → equal neighbours are fine
console.log(isSortedM([3, 1, 2]));               // false → 3 is bigger than 1
console.log(isSortedL([1, 2, 2, 5]));            // true → same answer with the loop
console.log(isSortedL([]));                      // true → an empty list is sorted
```

**Output:**

```text
true
false
true
true
```

## 🔍 Deeper version

**Complexity:**

| Way | Time | Space | Note |
|---|---|---|---|
| `every` | O(n) | O(1) | `every` stops at the first `false` |
| `for` loop | O(n) | O(1) | `return false` stops early |

**Dry run** for `[1, 3, 2]`:

| i | arr[i - 1] | arr[i] | bigger first? | result |
|---|---|---|---|---|
| 1 | 1 | 3 | no | keep going |
| 2 | 3 | 2 | **yes** | return `false` |

**Edge cases:** empty array (`true`), one item (`true`), all equal (`true` with `<=`), negative numbers (work the same).

**Strictly sorted?** If repeats are **not** allowed, change `<=` to `<` (or `>` to `>=` in the loop).

**Big to small?** Flip the comparison: `arr[i - 1] >= arr[i]`.

**Don't sort to check.** `JSON.stringify(arr) === JSON.stringify([...arr].sort((a, b) => a - b))` works, but it is O(n log n) and uses O(n) extra memory. One pass is better.

## 🎯 Why do we use it?

- **Before binary search.** Binary search only works on sorted data. A quick check can catch bad input.
- **Validating data.** For example, timestamps in a log or events in a timeline should go up.
- **Tests.** A test can assert that a "sort by date" API really returns sorted results.

## ⚠️ Common mistakes

- **Starting the loop at 0.** Then `arr[-1]` is `undefined`, and the comparison gives wrong results.
- **Using `<` when repeats are allowed.** `[1, 2, 2]` would wrongly fail.
- **Sorting a copy to compare.** It is slower and uses more memory than one pass.
- **Comparing strings by mistake.** `'10' < '9'` is `true` for strings. Make sure the values are numbers.

## 🗣️ How to answer in an interview

> "Let me confirm: small to big, and equal neighbours are allowed? Okay.
>
> I only need to compare neighbours. If every item is at least the one before it, the whole array is sorted. So I loop from index 1 and check `arr[i - 1] > arr[i]`. If that ever happens, I return false straight away. If the loop finishes, I return true.
>
> With methods, I'd write the same idea with `every`, which also stops at the first false.
>
> It's O(n) time and O(1) space. An empty or single-item array returns true."

## 🔁 Follow-up questions

### How would you check sorted in either direction?

Check both directions in one pass. Keep two flags, `up` and `down`, both `true`. Turn `up` off when you see a drop and `down` off when you see a rise. Return `up || down`.

### What if the array holds objects, like jobs sorted by date?

Compare a field: `jobs[i - 1].createdAt <= jobs[i].createdAt`. For dates, compare the numbers from `getTime()`.

### Can you do it recursively?

Yes. "Sorted if the first two are in order AND the rest is sorted." But recursion uses O(n) stack space, so the loop is better.

### How many comparisons in the worst case?

`n - 1`. Each neighbour pair is compared once.

## ✅ Quick check

### 1. What does `isSortedL([5])` return?

:::answer
**`true`.** The loop starts at 1, but the length is 1, so it never runs. We return `true`.
:::

### 2. With `arr[i - 1] <= x`, is `[2, 2, 1]` sorted?

:::answer
**No.** At i = 2 we compare 2 and 1. 2 is bigger, so it returns `false`.
:::
