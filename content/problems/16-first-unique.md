---
title: First non-repeating item
order: 16
difficulty: Easy
pattern: Hash map / Set
topic: dsa/first-unique
---

## 📝 Problem

You get an array. Return the **first** value that appears **exactly once**. If every value repeats, return `null`.

## 🧪 Examples

| Input | Output | Why |
|---|---|---|
| `[4, 5, 1, 2, 0, 4, 1]` | `5` | `4` repeats, so `5` is the first single one |
| `[2, 2, 3, 3]` | `null` | everything repeats |
| `[7]` | `7` | a single item is unique |

## 🤔 Think first

:::hint
You can't know a value is unique until you have seen the **whole** array. What if you walk through the array twice?
:::

## ✅ Solution

:::solution
**Way 1 — Array methods**

```js
const firstUnique = (arr) =>
  arr.find((x) => arr.indexOf(x) === arr.lastIndexOf(x)) // first and last position match → it appears once
  ?? null;                                               // find gives undefined if nothing matched → return null
```

Time **O(n²)**: `indexOf` and `lastIndexOf` each scan the array.

**Way 2 — Count first, then find**

```js
function firstUnique(arr) {
  const count = new Map();                     // value → how many times it appears
  for (const x of arr) {                       // pass 1: count everything
    count.set(x, (count.get(x) || 0) + 1);     // add 1 (start from 0 if new)
  }
  for (const x of arr) {                       // pass 2: walk in the original order
    if (count.get(x) === 1) return x;          // the first one with count 1 is the answer
  }
  return null;                                 // nothing appeared exactly once
}
```

Time **O(n)** (two separate passes), space **O(n)** for the Map.

**Dry run:** counts `{4:2, 5:1, 1:2, 2:1, 0:1}` → second pass: `4` (2) skip → `5` (1) return ✅

**What to say:** "I need the full counts before I can decide, so I do two passes. A Map keeps counts in O(1) each, so it's O(n) overall. I use a Map instead of an object so number keys stay numbers."
:::
