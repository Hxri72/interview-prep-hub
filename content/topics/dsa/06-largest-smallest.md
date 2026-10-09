---
title: Find the largest and smallest number
stack: dsa
order: 6
level: Basic
mustKnow: false
askedFrequency: very common
summary:
  - "Way 1: Math.max(...arr) and Math.min(...arr), or reduce."
  - "Way 2: one loop — start with the first item, update max and min as you go."
  - Both are O(n) time. The loop is O(1) extra space.
  - Start from arr[0], not 0 — otherwise all-negative arrays give the wrong answer.
  - "Edge cases: empty array (Math.max gives -Infinity) and very large arrays (spread can fail)."
cards:
  - q: How do you find the largest number without built-in methods?
    a: Set max = arr[0], loop from index 1, and replace max whenever you find a bigger item. O(n) time, O(1) space.
  - q: Why not start with max = 0?
    a: If every number is negative, like [-5, -2], the answer would wrongly be 0.
  - q: What does Math.max() return for an empty array?
    a: -Infinity. (Math.min() of nothing returns Infinity.)
  - q: Why can Math.max(...arr) fail on huge arrays?
    a: Spreading passes every item as a separate argument. Too many arguments can throw a RangeError.
  - q: Can you find both max and min in one loop?
    a: Yes — check both in the same loop. Still O(n).
---

## 💡 What is it?

**The problem:** find the biggest and the smallest number in an array.

```text
Input:  [7, -3, 15, 0, 9]
Output: max = 15, min = -3
```

It's a warm-up question. Interviewers often add: **"Now do it without `Math.max`."**

## 🏠 Real-life example

Think of a **teacher finding the top mark** in a pile of answer sheets.

She picks up the **first sheet** and remembers its mark. Then she goes through the pile **one by one**. Each time she sees a higher mark, she remembers that one instead.

- The **pile** = the array.
- The **mark she remembers** = the `max` variable.
- **Going through one by one** = the loop.

She only needs to remember one number at a time. That's why the space is O(1).

## 🧑‍💻 Code example

Save as `max-min.js` and run `node max-min.js`.

```js
const arr = [7, -3, 15, 0, 9];                       // our list of numbers

// Way 1 — built-in methods
console.log('Math:', Math.max(...arr), Math.min(...arr)); // spread the list into Math.max / Math.min
const maxByReduce = arr.reduce((max, x) => (x > max ? x : max), arr[0]); // keep the bigger one each step
console.log('reduce max:', maxByReduce);             // show the reduce result

// Way 2 — one plain loop, no shortcuts
function maxMin(list) {                              // list = the numbers to check
  if (list.length === 0) return null;                // edge case: empty list has no max or min
  let max = list[0];                                 // start with the first item as the biggest
  let min = list[0];                                 // and also as the smallest
  for (let i = 1; i < list.length; i++) {            // check every other item
    if (list[i] > max) max = list[i];                // found a bigger one → remember it
    if (list[i] < min) min = list[i];                // found a smaller one → remember it
  }                                                  // end of the loop
  return { max, min };                               // give back both answers
}                                                    // end of maxMin

console.log('loop:', maxMin(arr));                   // test the loop version
console.log('empty:', maxMin([]));                   // edge case: empty list
console.log('Math.max of empty:', Math.max(...[]));  // trap: Math.max of nothing
```

**Output:**

```text
Math: 15 -3
reduce max: 15
loop: { max: 15, min: -3 }
empty: null
Math.max of empty: -Infinity
```

## 🔍 Deeper version

**Complexity:**

| Way | Time | Space | Notes |
|---|---|---|---|
| `Math.max(...arr)` | O(n) | O(n) for the spread arguments | can throw on very huge arrays |
| `reduce` | O(n) | O(1) | safe for big arrays |
| One loop | O(n) | O(1) | finds both in one pass |

**Dry run** of the loop on `[7, -3, 15, 0, 9]`:

| i | item | max | min |
|---|---|---|---|
| start | 7 | 7 | 7 |
| 1 | -3 | 7 | **-3** |
| 2 | 15 | **15** | -3 |
| 3 | 0 | 15 | -3 |
| 4 | 9 | 15 | -3 |

**Edge cases:**
- **Empty array:** `Math.max(...[])` is `-Infinity`. Our loop returns `null`. Say which one you'd return, or throw an error.
- **One item:** max and min are the same item.
- **All negative:** works because we start from `arr[0]`.
- **Huge arrays:** spreading 1,000,000+ items into a function call can throw `RangeError`. The loop and `reduce` are safe.

**Can it be faster?** No. To be sure of the biggest number, you must look at every item at least once. So O(n) is the best possible.

## 🎯 Why do we use it?

Real code does this all the time: the highest salary, the latest date, the cheapest plan, the longest response time in a log.

It's also the base idea behind the [second largest](topic:dsa/second-largest) and [best time to buy and sell](topic:dsa/buy-sell-stock) problems.

## ⚠️ Common mistakes

- **Starting `max` at `0`.** Wrong for all-negative arrays.
- **Forgetting the empty-array case.**
- **Sorting just to find the max.** Sorting is O(n log n); one loop is O(n).
- **Using `if / else if`** for max and min. On the first item both can matter, so use two separate `if`s.

## 🗣️ How to answer in an interview

> "The quick way is Math.max with spread, but it can fail on very large arrays and returns minus Infinity for an empty one. So I'll write one loop.
>
> I set both max and min to the first item, then loop from index 1. If the current item is bigger than max, I update max. If it's smaller than min, I update min. I start from the first item, not zero, so all-negative arrays still work.
>
> That's one pass, O(n) time, O(1) extra space. You can't do better than O(n), because you have to look at every number at least once."

## 🔁 Follow-up questions

### How would you find the index of the largest number?

Track `maxIndex` instead of the value. Update it when `arr[i] > arr[maxIndex]`.

### Find the max of an array of objects, like the oldest user?

`users.reduce((a, b) => (b.age > a.age ? b : a))`. Same idea, compare a field.

### What if the array is sorted?

Then the min is `arr[0]` and the max is `arr[arr.length - 1]`. That's **O(1)**.

### Find the largest number in a nested array?

Flatten first, or use [recursion](topic:dsa/recursion) to look inside each inner array.

## ✅ Quick check

### 1. What does this print?

```js
let max = 0;                          // bad start value
for (const x of [-5, -2, -9]) {       // all negative
  if (x > max) max = x;               // never true
}
console.log(max);                     // ?
```

:::answer
**0** — which is wrong. No item is bigger than 0. Start with `max = arr[0]` to get **-2**.
:::

### 2. What does `Math.min(...[])` return?

:::answer
**`Infinity`**.
:::

### 3. Time complexity of finding the max in a sorted array?

:::answer
**O(1)** — it's the last item.
:::
