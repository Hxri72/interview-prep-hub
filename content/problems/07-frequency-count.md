---
title: Count how many times each item appears
order: 7
difficulty: Easy
pattern: Hash map / Set
topic: dsa/frequency-count
---

## 📝 Problem

You get an array. Return an object that says **how many times** each value appears.

## 🧪 Examples

| Input | Output |
|---|---|
| `['a', 'b', 'a', 'c', 'a']` | `{ a: 3, b: 1, c: 1 }` |
| `[1, 1, 2]` | `{ '1': 2, '2': 1 }` (object keys become text) |
| `[]` | `{}` |

## 🤔 Think first

This is the base of many bigger problems: anagrams, duplicates, "most common item".

:::hint
You need a place where the item is the label and the count is the value. What happens the first time you see an item?
:::

## ✅ Solution

:::solution
**Way 1 — Array methods**

```js
const frequency = (arr) =>
  arr.reduce((count, x) => {          // count = the object we build, x = current item
    count[x] = (count[x] || 0) + 1;   // first time: 0 + 1; after that: old count + 1
    return count;                     // give the object to the next step
  }, {});                             // start with an empty object
```

Time **O(n)**. Space **O(k)**, where k = number of different values.

**Way 2 — Plain loop with a Map**

```js
function frequencyLoop(arr) {
  const count = new Map();                       // a Map keeps the real type of each key
  for (const x of arr) {                         // look at each item once
    count.set(x, (count.get(x) || 0) + 1);       // add 1 to this item's count
  }
  return Object.fromEntries(count);              // turn the Map into a plain object for printing
}
```

Time **O(n)**. Space **O(k)**.

**Dry run:** `['a', 'b', 'a', 'c', 'a']` → a:1 → b:1 → a:2 → c:1 → a:3 ✅

**What to say:** "One pass with a hash map, O(n). I'd use a Map when keys are numbers, because object keys turn into strings — `1` and `'1'` would share one count."
:::
