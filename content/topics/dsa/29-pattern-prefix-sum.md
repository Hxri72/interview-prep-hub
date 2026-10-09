---
title: "Pattern: prefix sum"
stack: dsa
order: 29
level: Intermediate
mustKnow: false
askedFrequency: common
summary:
  - "Idea: build an array of running totals once; then any range sum is one subtraction."
  - "prefix[i] = sum of the first i items, with prefix[0] = 0; sum(i..j) = prefix[j+1] − prefix[i]."
  - "Building costs O(n); each range question then costs O(1) instead of O(n)."
  - "\"Count subarrays with sum k\" uses running sums + a Map of how often each sum appeared."
  - Works with negative numbers, where sliding window fails.
cards:
  - q: What is a prefix sum array?
    a: An array where position i holds the total of the first i numbers. prefix[0] is 0.
  - q: How do you get the sum from index i to j with prefix sums?
    a: prefix[j + 1] − prefix[i].
  - q: When is prefix sum worth it?
    a: When you answer many range-sum questions on the same array, or count subarrays with a given sum.
  - q: Why add a 0 at the start of the prefix array?
    a: So a range starting at index 0 still works with the same formula, without special cases.
  - q: How does "subarray sum equals k" use prefix sums?
    a: Keep a running sum and a Map of how many times each running sum appeared. At each step, add map.get(sum − k) to the count.
---

## 💡 What is it?

A prefix sum is a list of **running totals**. Position `i` holds the sum of the **first i numbers**.

Once you have it, the sum of **any range** is just **one subtraction**. You build it once and reuse it for every question.

**Spot it when the question says:** "sum between index i and j" (many times), "number of subarrays that add up to k", "range totals".

## 🏠 Real-life example

Think of a **cricket scoreboard that shows the total after every over**.

After over 1 it shows 3. After over 2 it shows 4. After over 3 it shows 8, and so on.

Someone asks: "How many runs were scored in overs 2 to 4?" You don't add each over again. You take the **total after over 4** and **subtract the total after over 1**.

- The **runs in each over** = the array.
- The **scoreboard totals** = the prefix array.
- **Total after over 4 − total after over 1** = `prefix[j + 1] − prefix[i]`.

## 🧑‍💻 Code example

Problem: **answer many "sum from i to j" questions quickly** (LeetCode "Range Sum Query – Immutable"). Save as `prefix.js` and run `node prefix.js`.

```js
// Problem: answer many "sum from index i to j" questions quickly
const arr = [3, 1, 4, 1, 5];                       // our numbers

function rangeSumBrute(i, j) {                     // brute force: loop every time
  let sum = 0;                                     // start at 0
  for (let k = i; k <= j; k++) sum += arr[k];      // add each number in the range
  return sum;                                      // the answer
}                                                  // end of rangeSumBrute

const prefix = [0];                                // prefix[i] = sum of the first i numbers
for (const x of arr) prefix.push(prefix[prefix.length - 1] + x); // running total
const rangeSum = (i, j) => prefix[j + 1] - prefix[i]; // one subtraction per question

console.log(prefix);                               // [0, 3, 4, 8, 9, 14]
console.log(rangeSumBrute(1, 3), rangeSum(1, 3));  // 6 6 (1 + 4 + 1)
console.log(rangeSumBrute(0, 4), rangeSum(0, 4));  // 14 14 (whole array)
```

**Output:**

```text
[ 0, 3, 4, 8, 9, 14 ]
6 6
14 14
```

The brute force loops over the range for **every question**: O(n) each. The prefix version takes **O(n) once to build**, then **O(1) per question**. With q questions, that's O(n × q) vs O(n + q).

## 🔍 Deeper version

**Template:**

```js
const prefix = new Array(arr.length + 1).fill(0);  // one extra slot for the leading 0
for (let i = 0; i < arr.length; i++) {             // build once
  prefix[i + 1] = prefix[i] + arr[i];               // running total
}
const sum = (i, j) => prefix[j + 1] - prefix[i];   // any range in O(1)
```

**Subarray sum equals k** (count the subarrays whose sum is k, negatives allowed):

```js
function subarraySum(nums, k) {               // count subarrays that add to k
  const seen = new Map([[0, 1]]);             // running sum 0 has been seen once (empty prefix)
  let sum = 0, count = 0;                     // running sum and answer
  for (const x of nums) {                     // one pass
    sum += x;                                 // running total up to here
    count += seen.get(sum - k) || 0;          // earlier prefixes that leave exactly k
    seen.set(sum, (seen.get(sum) || 0) + 1);  // remember this running total
  }
  return count;                               // e.g. [1, 1, 1], k = 2 → 2
}
```

Why it works: if the running sum now is `S` and earlier it was `S − k`, then the numbers in between add up to `k`.

**Complexity:** building is **O(n)** time and **O(n)** space. Each range query is **O(1)**.

**More problems:** Range Sum Query – Immutable, Subarray Sum Equals K, and [Product of Array Except Self](topic:dsa/product-except-self), which uses prefix and suffix products.

## 🎯 Why do we use it?

When the same array gets **many range questions**, re-adding each range is wasted work. Prefix sums move the work to one setup step.

They also handle **negative numbers**, where the sliding window's "shrink when too big" rule breaks.

## ⚠️ Common mistakes

- **Forgetting the leading 0**, then writing special cases for ranges that start at index 0.
- **Off-by-one:** the formula is `prefix[j + 1] − prefix[i]`, not `prefix[j] − prefix[i]`.
- **Using it when the array keeps changing.** Each update forces a rebuild. Then you'd need a Fenwick tree or segment tree.
- **Forgetting `seen.set(0, 1)`** in the subarray-count problem, which misses subarrays that start at index 0.

## 🗣️ How to answer in an interview

> "Since we'll answer many range-sum questions on the same array, I'll build a prefix sum array first. prefix[i] is the sum of the first i numbers, with a 0 at the start. Then the sum from i to j is prefix[j + 1] minus prefix[i]. Building takes O(n) once, and every question is O(1). For 'count subarrays that sum to k', I'd combine running sums with a Map of how often each sum appeared. That's O(n) and works with negative numbers."

## 🔁 Follow-up questions

### What if the array changes between questions?

A plain prefix array must be rebuilt after each change (O(n)). For many updates and queries, use a Fenwick tree or a segment tree: both are O(log n) for each.

### Why doesn't sliding window work for "subarray sum equals k" with negatives?

Sliding window shrinks when the sum is too big. With negative numbers, adding an item can make the sum smaller, so the shrink rule gives wrong answers. Prefix sums with a Map don't depend on that.

### Can prefix sums work in 2D?

Yes. A 2D prefix table answers "sum of any rectangle" in O(1), using four lookups.

### How much extra memory does it use?

O(n) for the prefix array. If you only need the running total once (like counting), you can keep just one variable plus the Map.

## ✅ Quick check

### 1. `arr = [2, 4, 6]`. What is the prefix array, and what is `sum(1, 2)`?

:::answer
prefix = **[0, 2, 6, 12]**. sum(1, 2) = prefix[3] − prefix[1] = 12 − 2 = **10** (4 + 6).
:::

### 2. Why does `subarraySum` start the Map with `[[0, 1]]`?

:::answer
So a subarray that starts at **index 0** is counted. Its "earlier running sum" is the empty prefix, which is 0.
:::
