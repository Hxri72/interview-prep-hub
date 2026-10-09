---
title: Intersection of Two Arrays II
order: 39
difficulty: Easy
pattern: Hash map / Set
topic: dsa/intersection
---

## 📝 Problem

You get two arrays `a` and `b`. Return the numbers that appear in **both**. If a number appears more than once in both, include it **as many times as it appears in both** (the smaller count). Any order is fine.

## 🧪 Examples

| Input | Output |
|---|---|
| `a = [1, 2, 2, 1]`, `b = [2, 2]` | `[2, 2]` |
| `a = [4, 9, 5]`, `b = [9, 4, 9, 8, 4]` | `[9, 4]` (or `[4, 9]`) |
| `a = [1, 2]`, `b = [3]` | `[]` |

## 🤔 Think first

:::hint
A Set only says "yes or no". Here you also need "how many are left". What structure stores a count for each number?
:::

## ✅ Solution

:::solution
**Way 1 — Array methods (find and remove from a copy)**

```js
function intersectMethods(a, b) {
  const rest = [...b];                       // copy b, so we can remove used numbers
  return a.filter((x) => {                   // keep x only if b still has one
    const i = rest.indexOf(x);               // find x in what's left of b (a hidden loop)
    if (i === -1) return false;              // not there → drop x
    rest.splice(i, 1);                       // use it up, so it can't match twice
    return true;                             // keep x
  });
}
```

Time **O(n × m)**, because `indexOf` and `splice` are loops inside a loop. Space **O(m)** for the copy.

**Way 2 — Count with a Map (plain loops)**

```js
function intersect(a, b) {
  const count = new Map();                       // number → how many times it is in a
  for (const x of a) count.set(x, (count.get(x) || 0) + 1); // count a
  const result = [];                             // the answer
  for (const x of b) {                           // walk b once
    if (count.get(x) > 0) {                      // a still has one of these?
      result.push(x);                            // take it
      count.set(x, count.get(x) - 1);            // use up one copy
    }
  }
  return result;                                 // the answer
}
```

Time **O(n + m)**. Space **O(n)** for the Map.

**Dry run:** `a = [1, 2, 2, 1]` → counts `{1: 2, 2: 2}` → b: 2 → take (left 1), 2 → take (left 0) → `[2, 2]` ✅

**What to say:** "The filter + indexOf version is short but O(n·m) because of hidden loops. I count the first array in a Map, then walk the second array and take a number only while its count is above zero. O(n + m) time. If both arrays are sorted, two pointers do it with O(1) extra space."
:::
