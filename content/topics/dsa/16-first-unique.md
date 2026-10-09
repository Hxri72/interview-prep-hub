---
title: First non-repeating item
stack: dsa
order: 16
level: Basic
mustKnow: false
askedFrequency: common
summary:
  - "Find the first value that appears exactly once."
  - "Way 1: arr.find(x => arr.indexOf(x) === arr.lastIndexOf(x)). Short, but O(n²)."
  - "Way 2: two passes — count everything with a Map, then return the first value with count 1. O(n)."
  - "The second pass must go over the original array, not the Map, to respect the original order."
  - "Same idea for strings: first non-repeating character (LeetCode 387)."
cards:
  - q: How do you find the first non-repeating item in O(n)?
    a: Pass 1 counts every value in a Map. Pass 2 walks the array again and returns the first value whose count is 1.
  - q: Why do we need two passes?
    a: While walking the first time, you don't yet know whether a value will repeat later. You need the full counts first.
  - q: How does indexOf === lastIndexOf find a unique value?
    a: If the first and last positions of a value are the same, it appears only once. But both calls scan the array, so it is O(n²).
  - q: What should you return if every value repeats?
    a: null, -1 or undefined. Say which one you chose. For the LeetCode string version, return -1 as the index.
  - q: What is the first non-repeating character in "swiss"?
    a: "w. s appears 3 times, w once, i once, and w comes first."
---

## 💡 What is it?

Find the **first** value that appears **exactly once**.

| Input | Output | Why |
|---|---|---|
| `[4, 5, 1, 2, 0, 4, 1]` | `5` | 4 and 1 repeat; 5 is the first unique |
| `[2, 2, 3, 3]` | `null` | nothing is unique |
| `"swiss"` | `"w"` | s repeats; w comes before i |

## 🏠 Real-life example

Think of a **class photo-day queue**. Some students come twice to get a second photo. You want the **first student in the queue who came only once**.

You can't decide while the queue is still moving, because someone might come back later. So:

1. **First walk:** write down how many times each student came.
2. **Second walk:** go down the queue again, and stop at the first student with "1".

- **The queue** = the array, in its original order.
- **The tally list** = the `count` Map.
- **Second walk in queue order** = pass 2 over the array, not over the Map.

## 🧑‍💻 Code example

Save as `first-unique.js` and run `node first-unique.js`.

```js
const arr = [4, 5, 1, 2, 0, 4, 1];                                   // 4 and 1 repeat; 5 is the first unique

// Way 1 — array methods (O(n²))
const firstM = arr.find((x) => arr.indexOf(x) === arr.lastIndexOf(x)); // first and last position equal → appears once

// Way 2 — count first, then find (O(n))
function firstUnique(list) {                                         // list = the values
  const count = new Map();                                           // value → how many times
  for (const x of list) count.set(x, (count.get(x) || 0) + 1);       // pass 1: count everything
  for (const x of list) if (count.get(x) === 1) return x;            // pass 2: first value with count 1
  return null;                                                       // every value repeats
}                                                                    // end of firstUnique

console.log(firstM);                                                 // 5
console.log(firstUnique(arr));                                       // 5
console.log(firstUnique([2, 2, 3, 3]));                              // null
console.log(firstUnique([...'swiss']));                              // w → works on letters too
```

**Output:**

```text
5
5
null
w
```

## 🔍 Deeper version

**Complexity:**

| Way | Time | Space |
|---|---|---|
| `find` + `indexOf` + `lastIndexOf` | O(n²) | O(1) |
| count, then scan (two passes) | **O(n)** | O(k) |

Two passes are still O(n): 2n steps drop the constant.

**Dry run** of Way 2 on `[4, 5, 1, 2, 0, 4, 1]`:

- Pass 1 counts: `4→2, 5→1, 1→2, 2→1, 0→1`
- Pass 2: 4 (count 2) skip → **5 (count 1) return 5**

**Why not loop over the Map in pass 2?** A Map keeps insertion order, which here equals first-appearance order. So that also works, and it is faster when there are many repeats. Looping over the array is simpler to explain and always correct.

**Streams (data that keeps coming):** to answer "first unique so far" after every new item, keep a count Map plus a queue of candidates. Pop from the front while the front's count is above 1. Each item enters and leaves the queue once, so it's O(1) on average per item.

**Letters only (a–z):** use an array of 26 counters instead of a Map. That's O(1) space.

## 🎯 Why do we use it?

- **Strings:** the first non-repeated character, or the first unique word in a log line.
- **Data checks:** the first record that has no duplicate partner.
- **Practice for the "count, then use the counts" pattern,** which also solves anagrams and top-k problems.

## ⚠️ Common mistakes

- **Trying to decide in one pass.** A value that looks unique now may repeat later.
- **Returning the first value with count 1 from an object's keys.** Integer-like keys are sorted numerically, not by first appearance. Loop over the array instead.
- **Forgetting the "none found" case.** Return `null` or `-1` and say which.
- **Ignoring case in strings** without asking. Should "S" and "s" count as the same letter?

## 🗣️ How to answer in an interview

> "I need the first value that appears exactly once, in the original order. If none exists, I'll return null.
>
> The quick way is `find` with `indexOf === lastIndexOf`, but both of those scan the array, so it's O(n²).
>
> Better: two passes. First I count every value in a Map. Then I walk the array again and return the first value whose count is 1. That's O(n) time and O(k) space.
>
> I loop over the array in the second pass, so the original order is respected."

## 🔁 Follow-up questions

### Return the index instead of the value (LeetCode 387).

In pass 2, loop with an index: `for (let i = 0; i < s.length; i++) if (count.get(s[i]) === 1) return i;` Return `-1` if none.

### Ignore case and spaces.

Normalise first: `str.toLowerCase().replace(/\s/g, '')`. Then count.

### First repeating item instead?

One pass with a Set: return the first `x` where `seen.has(x)` is true.

### Data arrives as a stream. Answer after every item.

Use a count Map plus a queue of candidates. Remove items from the front of the queue while their count is more than 1.

## ✅ Quick check

### 1. What does `firstUnique([...'aabbcd'])` return?

:::answer
**`'c'`.** `a` and `b` repeat. `c` is the first letter with a count of 1.
:::

### 2. Why can't one pass decide the answer for `[3, 1, 3]`?

:::answer
When you first meet 3, it looks unique, but it repeats at the end. You need the full counts before deciding, so the answer is 1.
:::
