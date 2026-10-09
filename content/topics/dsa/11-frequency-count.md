---
title: Count frequency of each item
stack: dsa
order: 11
level: Basic
mustKnow: true
askedFrequency: very common
summary:
  - "Walk the array once. Keep a tally: count[x] = (count[x] || 0) + 1."
  - "Way 1: reduce into an object. Way 2: a for...of loop with if/else."
  - "Use a Map when the items are numbers or objects, because object keys always become strings."
  - "O(n) time and O(k) space, where k = number of different values."
  - "This \"counting\" step is the base of many problems: duplicates, first unique, anagrams, top-k frequent."
cards:
  - q: How do you count how many times each item appears?
    a: "Loop once and keep a tally in an object or Map: count[x] = (count[x] || 0) + 1."
  - q: Why might you use a Map instead of an object for counting?
    a: Object keys become strings, so 1 and '1' merge. A Map keeps the real key type and has no inherited keys.
  - q: What is the complexity?
    a: O(n) time, because each item is visited once. O(k) extra space for k different values.
  - q: What does (count[x] || 0) do?
    a: If x has not been counted yet, count[x] is undefined, so we use 0. Then we add 1.
  - q: Name problems that start with a frequency count.
    a: Find duplicates, first non-repeating item, valid anagram, group anagrams, top K frequent elements.
---

## 💡 What is it?

You get an array. Return how many times **each value** appears.

| Input | Output |
|---|---|
| `['a', 'b', 'a', 'c', 'a']` | `{ a: 3, b: 1, c: 1 }` |
| `[1, 1, 2]` | `Map { 1 => 2, 2 => 1 }` |

This is called a **frequency count** or a **tally**.

## 🏠 Real-life example

Think of **counting votes for class leader**.

The teacher reads each paper slip. On the board, each name has a row. For every slip, the teacher adds one tick next to that name. A new name gets a new row with one tick.

- Each **paper slip** = one item in the array.
- The **board** = the `count` object or Map.
- **Adding a tick** = `count[x]++`.
- **A new row for a new name** = `count[x] = 1`.

The teacher reads every slip only once. That is why it's fast.

## 🧑‍💻 Code example

Save as `frequency.js` and run `node frequency.js`.

```js
const items = ['a', 'b', 'a', 'c', 'a'];                       // input: 'a' appears 3 times

// Way 1 — reduce
const countM = items.reduce((count, x) => {                    // count = the object we are building
  count[x] = (count[x] || 0) + 1;                              // missing → 0, then add 1
  return count;                                                // give the object to the next step
}, {});                                                        // {} = start with an empty object

// Way 2 — plain loop
function frequency(list) {                                     // list = the items to count
  const count = {};                                            // empty "tally sheet"
  for (const x of list) {                                      // visit each item once
    if (count[x]) count[x]++;                                  // seen before → add 1
    else count[x] = 1;                                         // first time → start at 1
  }                                                            // end of the loop
  return count;                                                // the finished tally
}                                                              // end of frequency

console.log(countM);                                           // { a: 3, b: 1, c: 1 }
console.log(frequency(items));                                 // { a: 3, b: 1, c: 1 }

const nums = [1, 1, 2];                                        // numbers this time
const m = new Map();                                           // a Map keeps the key's real type
for (const n of nums) m.set(n, (m.get(n) || 0) + 1);           // same counting idea with a Map
console.log(m);                                                // Map(2) { 1 => 2, 2 => 1 } → keys stay numbers
```

**Output:**

```text
{ a: 3, b: 1, c: 1 }
{ a: 3, b: 1, c: 1 }
Map(2) { 1 => 2, 2 => 1 }
```

## 🔍 Deeper version

**Complexity:** both ways are **O(n) time**. Space is **O(k)**, where k is the number of different values (at most n).

**Dry run** of the loop on `['a', 'b', 'a']`:

| item | before | after |
|---|---|---|
| `'a'` | `{}` | `{ a: 1 }` |
| `'b'` | `{ a: 1 }` | `{ a: 1, b: 1 }` |
| `'a'` | `{ a: 1, b: 1 }` | `{ a: 2, b: 1 }` |

**Object vs Map:**

| | Object `{}` | `Map` |
|---|---|---|
| Key types | turned into strings | any type, kept as-is |
| Inherited keys | yes (e.g. `'constructor'` from the prototype) | none |
| Size | `Object.keys(o).length` | `m.size` |
| Order | integer-like keys first, then insertion | insertion order |

The prototype trap: with a plain object, `count['constructor']` already exists (it's a function). Use `Object.create(null)` or a `Map` if keys come from user input.

:::version[Version note]
`Object.groupBy` and `Map.groupBy` (ES2024) group items into lists. For a pure count, a simple loop is still clearer.
:::

**Most frequent item:** after counting, loop over the entries and keep the max. Still O(n).

## 🎯 Why do we use it?

- **Dashboards.** For example, how many applications are in each status: applied, shortlisted, rejected.
- **Analytics.** The most searched skills, or the most common error codes in logs.
- **As step 1 of other problems:** duplicates, anagrams, first unique, top-k.

## ⚠️ Common mistakes

- **Forgetting the starting value.** `count[x]++` on `undefined` gives `NaN`. Use `(count[x] || 0) + 1`.
- **Forgetting `return count` inside `reduce`.** The next step then gets `undefined`.
- **Using an object for number keys and expecting numbers back.** `Object.keys` returns strings.
- **Counting inside a nested loop.** That makes it O(n²) for no reason.

## 🗣️ How to answer in an interview

> "I'll keep a tally while walking the array once. For each item, I add one to its count, starting from zero if it's new.
>
> If the values are strings, an object is fine. If they're numbers or objects, I'll use a Map so the keys keep their type.
>
> I can write it with reduce, or as a plain for...of loop. Either way it's O(n) time and O(k) space, where k is the number of different values. This tally is also the first step for problems like anagrams or top-k frequent."

## 🔁 Follow-up questions

### Find the most frequent item.

Count first. Then loop over the counts and track the value with the highest count. O(n).

### Count characters in a string.

Same idea. A string is iterable, so `for (const ch of str)` works. Decide whether case and spaces matter.

### Return the counts sorted by frequency.

`[...map.entries()].sort((a, b) => b[1] - a[1])`. Sorting adds O(k log k).

### How would you count very large data that doesn't fit in memory?

Process it in chunks or as a stream, and keep only the running counts. In a database, use `GROUP BY` or a `$group` stage.

## ✅ Quick check

### 1. What does this print?

```js
const c = {};                         // empty tally
for (const x of [1, '1', 1]) c[x] = (c[x] || 0) + 1; // count each value
console.log(c);                       // ?
```

:::answer
**`{ '1': 3 }`.** Object keys become strings, so the number 1 and the string `'1'` share one key.
:::

### 2. What goes wrong with `count[x]++` when x is new?

:::answer
`count[x]` is `undefined`, and `undefined + 1` is `NaN`. Start from 0: `count[x] = (count[x] || 0) + 1`.
:::
