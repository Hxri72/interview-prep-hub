---
title: Top K frequent elements
stack: dsa
order: 37
level: Intermediate
mustKnow: false
askedFrequency: common
summary:
  - "Return the k numbers that appear most often."
  - "Step 1 is always the same: count each number with a Map. O(n)."
  - "Sort way: sort the (number, count) pairs by count and take k. O(n log n)."
  - "Bucket way: bucket[count] = numbers with that count, then read buckets from the top. O(n)."
  - "A heap of size k gives O(n log k) — mention it as another option."
cards:
  - q: What is the first step in every solution to "top K frequent"?
    a: Count how many times each number appears, using a Map. That's O(n).
  - q: How does the bucket-sort solution work?
    a: "Make buckets where the index is the count. Put each number into bucket[count]. Then read the buckets from the highest index down until you have k numbers."
  - q: Why can the bucket array have length n + 1?
    a: A number can appear at most n times, so counts go from 0 to n.
  - q: What are the times of the three common solutions?
    a: "Sort: O(n log n). Heap of size k: O(n log k). Bucket sort: O(n)."
  - q: "What is the answer for [1,1,1,2,2,3] with k = 2?"
    a: "[1, 2]. 1 appears 3 times and 2 appears 2 times."
---

## 💡 What is it?

You get an array of numbers and a number `k`. Return the **k numbers that appear the most times**.

Example: `[1, 1, 1, 2, 2, 3]`, `k = 2` → `[1, 2]`.
`1` appears 3 times and `2` appears 2 times.

## 🏠 Real-life example

Think of a **class voting for their favourite fruit**.

The teacher first **counts the votes** for each fruit. Then she puts each fruit on a **shelf numbered by its vote count**: shelf 3 for 3 votes, shelf 2 for 2 votes. To find the top 2 fruits, she reads the shelves **from the highest down**.

- The **votes** = the numbers in the array.
- **Counting the votes** = the Map of number → count.
- The **numbered shelves** = the buckets.
- **Reading from the top shelf** = the loop from the highest count down.

## 🧑‍💻 Code example

Save as `topk.js`. Run `node topk.js`.

```js
// Way 1 — array methods: count, then sort by count
function topKSort(nums, k) {                           // nums = the numbers, k = how many to return
  const count = nums.reduce((m, x) => m.set(x, (m.get(x) || 0) + 1), new Map()); // number → how many times
  return [...count.entries()]                          // [[number, count], ...]
    .sort((a, b) => b[1] - a[1])                       // most frequent first
    .slice(0, k)                                       // keep the first k pairs
    .map(([num]) => num);                              // keep only the numbers
}                                                      // end of topKSort

// Way 2 — plain loops: bucket sort (bucket index = how many times)
function topKFrequent(nums, k) {                       // nums = the numbers, k = how many to return
  const count = new Map();                             // number → how many times
  for (const x of nums) count.set(x, (count.get(x) || 0) + 1); // count every number
  const buckets = [];                                  // buckets[f] = numbers seen exactly f times
  for (let i = 0; i <= nums.length; i++) buckets.push([]); // a count can be at most nums.length
  for (const [num, f] of count) buckets[f].push(num);  // drop each number into its bucket
  const result = [];                                   // the answer
  for (let f = buckets.length - 1; f >= 0 && result.length < k; f--) { // from the highest count down
    for (const num of buckets[f]) {                    // every number with this count
      if (result.length < k) result.push(num);         // take it while we still need more
    }                                                  // end of the bucket loop
  }                                                    // end of the count loop
  return result;                                       // the k most frequent numbers
}                                                      // end of topKFrequent

console.log(topKSort([1, 1, 1, 2, 2, 3], 2));          // [1, 2]
console.log(topKFrequent([1, 1, 1, 2, 2, 3], 2));      // [1, 2]
console.log(topKFrequent([4], 1));                     // [4]
```

**Output:**

```text
[ 1, 2 ]
[ 1, 2 ]
[ 4 ]
```

## 🔍 Deeper version

**Complexity:**

| Way | Time | Space | Why |
|---|---|---|---|
| Count + sort | O(n log n) | O(n) | Sorting up to n unique numbers. |
| Count + heap of size k | O(n log k) | O(n + k) | Each push/pop on a size-k heap costs log k. |
| Count + buckets | O(n) | O(n) | Counting is O(n); reading the buckets is O(n). |

**Dry run** of the bucket way on `[1, 1, 1, 2, 2, 3]`, `k = 2`:

| step | state |
|---|---|
| count | `{1 → 3, 2 → 2, 3 → 1}` |
| buckets | `[ [], [3], [2], [1], [], [], [] ]` (index = count) |
| read from top | index 3 → take `1`; index 2 → take `2` |
| result | `[1, 2]` |

**About heaps.** A heap is a structure that always gives you the smallest (or largest) item quickly. JavaScript has no built-in heap, so in an interview you can either write a small one or say: "In Python I'd use heapq; in JS I'd write a min-heap or use the bucket way."

**Ties.** If two numbers have the same count, the question usually says "any order is fine". Ask first.

**Edge cases:** `k` equals the number of unique values (return all), every number unique (any k numbers), one element.

It's a mix of the [hash map pattern](topic:dsa/pattern-hash-map) and [frequency counting](topic:dsa/frequency-count).

## 🎯 Why do we use it?

- It is a common medium question (LeetCode "Top K Frequent Elements").
- It shows you can **beat O(n log n) sorting** when the values have a known small range (counts go from 0 to n).
- Real uses: top 5 skills in candidate profiles, most common error messages in logs, trending search words.

## ⚠️ Common mistakes

- **Sorting the original array** instead of the counts. You need to sort by *how often*, not by value.
- **Making the bucket array too small.** A number can appear n times, so you need n + 1 buckets.
- **Not stopping at k** when reading the buckets.
- **Using an object for counting numbers** and getting string keys back. A `Map` keeps the numbers as numbers.

## 🗣️ How to answer in an interview

> "I need the k numbers that appear most often. Does the order matter when counts tie?
>
> First I count each number with a Map. That's O(n).
>
> The simple next step is to sort the pairs by count and take the first k. That's O(n log n).
>
> I can do better with bucket sort. A count can only be between 1 and n, so I make an array of buckets where the index is the count. I drop each number into its bucket, then read from the highest bucket down until I have k numbers. That's O(n) time and O(n) space.
>
> Another option is a min-heap of size k, which is O(n log k)."

## 🔁 Follow-up questions

### When is the heap better than buckets?

When the data is a **stream** you can't store all at once, or when k is tiny and n is huge. A size-k heap only keeps k items in memory at the end.

### What if you need the top K words, sorted alphabetically on ties?

Count the words, then sort by count (high to low), and for equal counts by `a.localeCompare(b)`. That's LeetCode "Top K Frequent Words".

### Can you do it in one line?

Yes, with the sort way and method chaining. But in an interview, also explain the O(n) bucket way.

### How would you do this in MongoDB?

An aggregation: `$unwind` the array field, `$group` by value with `$sum: 1`, `$sort` by count, then `$limit: k`. See [aggregation basics](topic:mongodb/aggregation-basics).

## ✅ Quick check

### 1. What does `topKFrequent([5, 5, 6, 6, 6, 7], 1)` return?

:::answer
**`[6]`.** `6` appears 3 times, more than any other number.
:::

### 2. Why do we need `nums.length + 1` buckets?

:::answer
A number can appear at most `nums.length` times, so the highest bucket index we might need is `nums.length`. Indexes start at 0, so that's `nums.length + 1` buckets.
:::

### 3. Which solution is O(n)?

- A) Count + sort
- B) Count + bucket sort
- C) Sorting the original array

:::answer
**B) Count + bucket sort.** Counting is O(n), and reading the buckets is O(n).
:::
