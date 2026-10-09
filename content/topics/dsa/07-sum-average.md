---
title: Sum and average
stack: dsa
order: 7
level: Basic
mustKnow: false
askedFrequency: common
summary:
  - "Way 1: arr.reduce((total, x) => total + x, 0). Way 2: a for loop that adds each item."
  - Always give reduce a starting value of 0 — otherwise an empty array throws an error.
  - Check for an empty array before dividing — 0 / 0 is NaN.
  - O(n) time and O(1) extra space for both ways.
  - "Decimals can surprise you: 0.1 + 0.2 is 0.30000000000000004. Round only when you display."
cards:
  - q: How do you sum an array with reduce?
    a: arr.reduce((total, x) => total + x, 0) — the 0 is the starting total.
  - q: What happens if you call reduce with no starting value on an empty array?
    a: "It throws TypeError: Reduce of empty array with no initial value."
  - q: What is the average of an empty array if you don't guard it?
    a: NaN, because 0 / 0 is NaN.
  - q: Why is 0.1 + 0.2 not exactly 0.3?
    a: Numbers are stored in binary floating point, which can't hold 0.1 exactly. Round for display, or work in whole units like paise.
  - q: Time and space complexity of summing an array?
    a: O(n) time, O(1) extra space.
---

## 💡 What is it?

**The problem:** add up all the numbers in an array, then find the average.

```text
Input:  [80, 65, 90, 72]
Output: sum = 307, average = 76.75
```

**Average = sum ÷ how many items.** The tricky part is the **empty array**.

## 🏠 Real-life example

Think of a **shopkeeper totalling a bill**.

He starts the calculator at **0**. Then he adds each item's price, one by one. At the end, he has the total.

- The **calculator starting at 0** = `total = 0`, or reduce's starting value.
- **Adding each price** = the loop.
- **An empty basket** = an empty array. The total is 0, but "average price per item" makes no sense, so you must handle it.

## 🧑‍💻 Code example

Save as `sum-average.js` and run `node sum-average.js`.

```js
const marks = [80, 65, 90, 72];                         // test marks

// Way 1 — reduce
const sum1 = marks.reduce((total, x) => total + x, 0);  // start at 0, add each mark
const avg1 = marks.length ? sum1 / marks.length : 0;    // avoid dividing by 0
console.log('reduce:', sum1, avg1);                     // show sum and average

// Way 2 — plain loop
function sumAndAverage(list) {                          // list = the numbers
  let sum = 0;                                          // running total
  for (let i = 0; i < list.length; i++) {               // visit each position
    sum += list[i];                                     // add this number
  }                                                     // end of the loop
  const average = list.length === 0 ? 0 : sum / list.length; // empty list → average 0
  return { sum, average };                              // give back both
}                                                       // end of sumAndAverage

console.log('loop:', sumAndAverage(marks));             // normal case
console.log('empty:', sumAndAverage([]));               // edge case: empty list
console.log('no guard:', 0 / 0);                        // what happens without the guard
console.log('decimals:', 0.1 + 0.2);                    // floating point surprise
```

**Output:**

```text
reduce: 307 76.75
loop: { sum: 307, average: 76.75 }
empty: { sum: 0, average: 0 }
no guard: NaN
decimals: 0.30000000000000004
```

## 🔍 Deeper version

**Complexity:** both ways are **O(n) time** (each item once) and **O(1) extra space** (one running total).

**How reduce works**, dry run on `[80, 65, 90, 72]` with start 0:

| Step | total (before) | x | total (after) |
|---|---|---|---|
| 1 | 0 | 80 | 80 |
| 2 | 80 | 65 | 145 |
| 3 | 145 | 90 | 235 |
| 4 | 235 | 72 | **307** |

**Edge cases:**
- **Empty array:** sum is 0. The average must be guarded: return 0, `null`, or throw — say which.
- **No starting value in reduce:** `[].reduce((a, b) => a + b)` throws `TypeError`.
- **Strings in the array:** `[1, '2']` sums to `'12'`, because `+` joins strings. Convert with `Number()` first.
- **Decimals:** `0.1 + 0.2` is `0.30000000000000004`. For money, store whole paise (integers) and divide at the end. Use `toFixed(2)` only for display.
- **Very big numbers:** past `Number.MAX_SAFE_INTEGER` (about 9 quadrillion), sums lose precision. Use `BigInt` if needed.

## 🎯 Why do we use it?

Totals and averages are everywhere: cart totals, average rating, average response time in logs, monthly fees collected.

In a database you'd do it with `SUM` and `AVG`. See [aggregates in SQL](topic:postgresql/aggregates-group-by) and the [MongoDB aggregation pipeline](topic:mongodb/aggregation-basics).

## ⚠️ Common mistakes

- **Dividing by zero** for an empty array, giving `NaN`.
- **Leaving out reduce's starting value.**
- **Summing strings** from a form or API without converting them.
- **Rounding too early**, which adds up small errors. Round once, at the end.

## 🗣️ How to answer in an interview

> "I can sum with reduce, starting at 0, or with a simple loop that adds each item to a running total. Both are O(n) time and O(1) space.
>
> For the average, I divide by the length, but I guard the empty array first, because 0 divided by 0 is NaN. I'd agree with you whether an empty input should return 0, null or throw.
>
> I'd also watch out for strings coming from user input, which would be joined instead of added, and for floating-point decimals. For money I'd keep values in whole units like paise."

## 🔁 Follow-up questions

### How do you sum only the even numbers?

`arr.filter((x) => x % 2 === 0).reduce((t, x) => t + x, 0)`, or one loop with an `if`. The loop avoids making a new array.

### How do you sum a field in an array of objects?

`orders.reduce((t, o) => t + o.amount, 0)`.

### How would you find the average of each group?

Use a Map: group key → `{ sum, count }`. Then divide at the end. This is like SQL's `GROUP BY`.

### Sum of a range many times?

Build a [prefix sum](topic:dsa/pattern-prefix-sum) array once. Then every range sum is one subtraction, O(1).

## ✅ Quick check

### 1. What does this print?

```js
console.log([1, '2', 3].reduce((t, x) => t + x, 0)); // ?
```

:::answer
**The string `123`** (console.log shows `123` without quotes). 0 + 1 = 1, then 1 + '2' = '12' (text joining), then '12' + 3 = '123'.
:::

### 2. What does this throw?

```js
[].reduce((t, x) => t + x); // no starting value
```

:::answer
**`TypeError: Reduce of empty array with no initial value`**.
:::

### 3. Average of `[]` with `sum / arr.length` and no guard?

:::answer
**`NaN`** (0 / 0).
:::
