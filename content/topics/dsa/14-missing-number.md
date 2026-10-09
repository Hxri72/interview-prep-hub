---
title: Find the missing number (1 to n)
stack: dsa
order: 14
level: Basic
mustKnow: true
askedFrequency: very common
summary:
  - "The numbers 1..n should all be there, but one is missing. Find it."
  - "Maths trick: the sum of 1..n is n × (n + 1) / 2. Subtract the real sum; what's left is the missing number."
  - "n = arr.length + 1, because one number is missing."
  - "XOR trick: XOR all numbers 1..n and all array values. Pairs cancel, and only the missing one is left."
  - "All ways are O(n) time and O(1) space. Ask whether the range starts at 0 or 1."
cards:
  - q: How do you find the one missing number in 1..n?
    a: Compute the expected sum n × (n + 1) / 2, subtract the sum of the array, and the difference is the missing number.
  - q: If the array has 4 numbers and one is missing, what is n?
    a: n = 5. The full list would have one more item than the array.
  - q: How does the XOR way work?
    a: x ^ x = 0 and x ^ 0 = x. XOR every number from 1 to n and every array value. Each present number appears twice and cancels, so only the missing one remains.
  - q: What is the complexity?
    a: O(n) time to add or XOR everything once. O(1) space, since we only keep one running number.
  - q: Why might someone prefer XOR over the sum formula?
    a: The sum can get very large for big n. XOR never grows beyond the size of the numbers. In JavaScript the sum is safe up to Number.MAX_SAFE_INTEGER.
---

## 💡 What is it?

You get an array with the numbers **1 to n**, but **one is missing**. The order can be mixed. Return the missing number.

| Input | n | Output |
|---|---|---|
| `[1, 2, 4, 5]` | 5 | `3` |
| `[2, 3, 1, 5]` | 5 | `4` |
| `[1]` | 2 | `2` |

## 🏠 Real-life example

Think of **roll numbers 1 to 40 in a class**.

The teacher collects 39 answer sheets. One student is absent. The teacher knows that roll numbers 1 to 40 add up to 820. The teacher adds up the roll numbers on the 39 sheets. If they add up to 795, the absent student is roll number **25** (820 − 795).

- **Roll numbers 1–40** = the full range 1..n.
- **820** = the expected sum, `n × (n + 1) / 2`.
- **Adding the sheets** = summing the array.
- **The difference** = the missing number.

No need to sort or check each roll number one by one.

## 🧑‍💻 Code example

Save as `missing-number.js` and run `node missing-number.js`.

```js
const arr = [1, 2, 4, 5];                                    // numbers 1..5 with one missing (3)

// Way 1 — maths + reduce
const n = arr.length + 1;                                    // the full list would have one more item
const missingM = (n * (n + 1)) / 2 - arr.reduce((s, x) => s + x, 0); // sum of 1..n minus what we have

// Way 2 — plain loop
function missingNumber(list) {                               // list = numbers 1..n with one gap
  const total = list.length + 1;                             // total = n
  let expected = (total * (total + 1)) / 2;                  // sum of 1..n, e.g. 5 → 15
  for (const x of list) expected -= x;                       // take away each number we have
  return expected;                                           // what is left is the missing one
}                                                            // end of missingNumber

// Way 3 — XOR (no big sums)
function missingXor(list) {                                  // same input
  let x = 0;                                                 // x starts at 0
  for (let i = 1; i <= list.length + 1; i++) x ^= i;         // XOR all numbers 1..n
  for (const v of list) x ^= v;                              // XOR the numbers we have; pairs cancel out
  return x;                                                  // only the missing number is left
}                                                            // end of missingXor

console.log(missingM);                                       // 3
console.log(missingNumber(arr));                             // 3
console.log(missingXor(arr));                                // 3
```

**Output:**

```text
3
3
3
```

## 🔍 Deeper version

**Complexity:**

| Way | Time | Space | Note |
|---|---|---|---|
| sum formula + reduce | O(n) | O(1) | shortest |
| sum formula + loop | O(n) | O(1) | no built-ins |
| XOR | O(n) | O(1) | no large sums |
| sort, then find the gap | O(n log n) | depends | slower |
| Set of all values, then check 1..n | O(n) | O(n) | works, but uses memory |

**Dry run** of Way 2 on `[1, 2, 4, 5]`: n = 5, expected = 15. Subtract 1 → 14, 2 → 12, 4 → 8, 5 → **3**.

**How XOR cancels** (`^` means XOR):
- `a ^ a = 0` (a number XOR itself is zero)
- `a ^ 0 = a`
- the order doesn't matter

So `(1^2^3^4^5) ^ (1^2^4^5)` = `3`, because every other number appears twice.

**Overflow:** in some languages, `n × (n + 1) / 2` can overflow for large n. In JavaScript, numbers are exact up to `Number.MAX_SAFE_INTEGER` (about 9 × 10¹⁵). XOR avoids the problem everywhere.

**Variation, 0..n (LeetCode "Missing Number"):** then n = `arr.length`, and the expected sum is `n × (n + 1) / 2`.

## 🎯 Why do we use it?

- **Finding gaps** in sequences: missing invoice numbers, a skipped ticket id, a lost message in a numbered stream.
- **The pattern "compare expected vs actual"** is common in reconciliation jobs. For example, checking that every payment event arrived.
- **Interview signal.** It shows you look for a maths shortcut before writing nested loops.

## ⚠️ Common mistakes

- **Using `n = arr.length`** for the 1..n version. It must be `arr.length + 1`.
- **Mixing up 0..n and 1..n.** Ask which one before coding.
- **Sorting first.** It works, but it's slower and the interviewer will ask you to improve it.
- **Using `includes` inside a loop from 1 to n.** That is O(n²).

## 🗣️ How to answer in an interview

> "Just to confirm: the numbers are 1 to n, there are no duplicates, and exactly one is missing? Okay.
>
> A brute-force way is to check each number from 1 to n with `includes`. That's O(n²).
>
> Better: the sum of 1 to n is n times n plus one, over two. Here n is the array length plus one. I subtract the real sum, and the difference is the missing number. That's O(n) time and O(1) space.
>
> If the numbers can be huge, I can use XOR instead, which never grows: XOR 1 to n with all the values, and the pairs cancel out."

## 🔁 Follow-up questions

### What if two numbers are missing?

Use the sum and the sum of squares to make two equations. Or split by the average: one missing number is ≤ the average and the other is above it. A simpler O(n) space way: put the values in a Set and check 1..n.

### What if the array also has a duplicate?

That's "find the duplicate and the missing number". Use a counting array or Set, or the sum and sum-of-squares equations.

### What if the array is sorted?

Use binary search. If `arr[mid] === mid + 1`, the gap is on the right. Otherwise it's on the left. O(log n).

### Can you do it without changing the array or using extra memory?

Yes. The sum and XOR ways both read the array once and keep one number.

## ✅ Quick check

### 1. What does `missingNumber([2, 3, 4])` return?

:::answer
**1.** n = 4, expected = 10, the real sum = 9, so 10 − 9 = 1.
:::

### 2. What is `5 ^ 5 ^ 7`?

:::answer
**7.** `5 ^ 5` is 0, and `0 ^ 7` is 7. This cancelling is why the XOR trick works.
:::
