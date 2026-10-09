---
title: "Pattern: hash map / Set"
stack: dsa
order: 25
level: Intermediate
mustKnow: true
askedFrequency: very common
summary:
  - "Idea: remember what you have already seen, so checking again costs O(1) instead of another loop."
  - "Keywords that point to it: \"seen before\", \"duplicate\", \"count\", \"pair that adds up to\", \"first unique\"."
  - Use a Set for "is it there?" and a Map for "value → count" or "value → index".
  - It usually turns an O(n²) nested loop into one O(n) loop, at the cost of O(n) extra memory.
cards:
  - q: When should you think of the hash map / Set pattern?
    a: When the question asks about duplicates, counts, "seen before", or finding a partner value (like Two Sum).
  - q: Why is a Set faster than arr.includes() inside a loop?
    a: Set.has() is O(1) on average. includes() is a hidden loop, O(n), so inside another loop it becomes O(n²).
  - q: Set or Map — how do you choose?
    a: Set when you only need "is it there?". Map when you need to store something with each key, like a count or an index.
  - q: What is the cost of this pattern?
    a: Extra memory — up to O(n) for the Set or Map.
  - q: Why use a Map instead of a plain object for counting numbers?
    a: Object keys become strings, so 1 and "1" collide. A Map keeps the real key type and has a clean size property.
---

## 💡 What is it?

The hash map pattern means **remembering what you have already seen**.

You keep a [hash](glossary:hash)-based box, a `Set` or a `Map`. Before you do the slow thing again, you ask the box: "Have I seen this?" The box answers in one step.

**Spot it when the question says:** "duplicate", "seen before", "count how many", "first unique", "find a pair that adds up to".

## 🏠 Real-life example

Think of a **school gate guard with a register**.

Students come in one by one. For each student, the guard looks at the register. "Is this name already written?" If yes, someone is trying to enter twice. If no, the guard writes the name.

- The **students coming in** = the array items.
- The **register** = the `Set` (or `Map`).
- **Looking up a name** = `set.has(x)`, one quick check.
- **Writing a name** = `set.add(x)`.

Without a register, the guard would have to ask every student already inside. That is the slow nested loop.

## 🧑‍💻 Code example

Problem: **does the array contain any duplicate?** (LeetCode "Contains Duplicate"). Save as `pattern-hash.js` and run `node pattern-hash.js`.

```js
// Problem: does the array contain any duplicate? (LeetCode "Contains Duplicate")
function hasDuplicateBrute(nums) {                 // brute force: compare every pair
  for (let i = 0; i < nums.length; i++) {          // pick the first number
    for (let j = i + 1; j < nums.length; j++) {    // compare with every number after it
      if (nums[i] === nums[j]) return true;        // same value found → duplicate
    }                                              // end of inner loop
  }                                                // end of outer loop
  return false;                                    // no pair matched → no duplicate
}                                                  // end of hasDuplicateBrute

function hasDuplicate(nums) {                      // hash pattern: remember what we've seen
  const seen = new Set();                          // empty Set; has() and add() are O(1)
  for (const n of nums) {                          // look at each number once
    if (seen.has(n)) return true;                  // seen before → duplicate found
    seen.add(n);                                   // first time → remember it
  }                                                // end of loop
  return false;                                    // finished with no repeats
}                                                  // end of hasDuplicate

console.log(hasDuplicateBrute([3, 1, 4, 1]));      // true  (1 appears twice)
console.log(hasDuplicate([3, 1, 4, 1]));           // true
console.log(hasDuplicate([3, 1, 4, 5]));           // false (all different)
```

**Output:**

```text
true
true
false
```

The brute force compares every pair: **O(n²)**. The Set version looks at each number once: **O(n)** time, **O(n)** extra space.

## 🔍 Deeper version

**Template:**

```js
const seen = new Map();                 // key → whatever you need (index, count…)
for (let i = 0; i < arr.length; i++) {  // one pass
  const x = arr[i];                     // current item
  // 1) ask the map about x (or about a partner of x)
  // 2) then store x in the map
}
```

**Order matters.** In Two Sum you *check first, then store*. If you store first, a number can pair with itself.

**Complexity:** `Set` and `Map` operations (`has`, `get`, `set`, `add`) are **O(1) on average**. So one loop gives **O(n) time** and **O(n) space**.

**More problems that use it** (from your 4-week plan):
- **Two Sum:** a Map of value → index. See [Two Sum](topic:dsa/two-sum).
- **Valid Anagram:** count letters in one word, subtract with the other. See [Valid anagram](topic:dsa/valid-anagram).
- **Group Anagrams:** a Map of sorted-letters → list of words. See [Group anagrams](topic:dsa/group-anagrams).
- **Top K Frequent Elements:** a count Map, then pick the biggest. See [Top K frequent](topic:dsa/top-k-frequent).

## 🎯 Why do we use it?

Many array questions are slow because of a **hidden second loop**. You search the array again for every item. The pattern removes that second loop. You trade a little memory for a big speed gain.

On 100,000 items, O(n²) is about 10 billion steps. O(n) is about 100,000 steps.

## ⚠️ Common mistakes

- **Using `arr.includes()` or `indexOf()` inside a loop.** That is still O(n²). Use a Set.
- **Storing before checking** in pair problems, so an item pairs with itself.
- **Counting numbers in a plain object.** Keys turn into strings. Use a Map when the key type matters.
- **Forgetting to say the space cost.** Interviewers expect "O(n) extra space".

## 🗣️ How to answer in an interview

> "This looks like a 'seen before' problem, so I'll use a hash set. The brute force compares every pair, which is O(n²). Instead, I walk through the array once. For each number I check if the set already has it. If yes, I return true. If not, I add it. Set lookups are O(1) on average, so the whole thing is O(n) time and O(n) extra space. If memory were tight, I could sort first and compare neighbours, which is O(n log n) time and O(1) extra space."

## 🔁 Follow-up questions

### What if you can't use extra memory?

Sort the array first, then compare each item with the next one. That is O(n log n) time and O(1) extra space, but it changes the original array (or you copy it first).

### Why is a Set lookup "O(1) on average" and not always?

A hash table can have collisions, when two keys land in the same slot. In the worst case a lookup gets slower. In practice JavaScript engines keep it close to O(1).

### How would you count every item, not just find duplicates?

Use a Map: `count.set(x, (count.get(x) || 0) + 1)`. See [Frequency count](topic:dsa/frequency-count).

### Can you use an object instead of a Map?

For string keys, yes. For numbers or mixed keys, a Map is safer, because object keys are always strings.

## ✅ Quick check

### 1. What is the time complexity of this code?

```js
for (const x of a) {          // loop over a
  if (b.includes(x)) count++; // includes is another loop over b
}
```

:::answer
**O(n × m).** `includes` loops through `b` for every item of `a`. Put `b` in a Set first to make it O(n + m).
:::

### 2. Which structure fits "return the index of the partner number"?

- A) Set
- B) Map
- C) Array

:::answer
**B) Map.** You need to store something with each value (its index). A Set only remembers "is it there".
:::
