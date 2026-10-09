---
title: Contains duplicate
order: 19
difficulty: Easy
pattern: Hash map / Set
topic: dsa/pattern-hash-map
---

## 📝 Problem

Return `true` if **any** value appears at least twice in the array. Return `false` if every value is different.

## 🧪 Examples

| Input | Output |
|---|---|
| `[1, 2, 3, 1]` | `true` |
| `[1, 2, 3, 4]` | `false` |
| `[]` | `false` |

## 🤔 Think first

:::hint
The slow way compares every pair. What can remember everything you've passed, and answer "seen it?" in one step?
:::

## ✅ Solution

:::solution
**Way 1 — Set size**

```js
const containsDuplicate = (arr) =>
  new Set(arr).size !== arr.length; // a Set drops repeats, so a smaller size means a duplicate existed
```

Time **O(n)**, space **O(n)**. Short, but it always reads the whole array.

**Way 2 — Stop at the first repeat**

```js
function containsDuplicate(arr) {
  const seen = new Set();      // values we have passed
  for (const x of arr) {       // check each value once
    if (seen.has(x)) return true; // seen before → answer straight away
    seen.add(x);               // remember it
  }
  return false;                // finished with no repeats
}
```

Time **O(n)** worst case, but it can stop early. Space **O(n)**.

**Dry run:** `[1, 2, 3, 1]` → add 1, 2, 3 → `1` is in seen → `true` ✅

**What to say:** "Comparing every pair is O(n²). A Set gives O(1) lookups, so one pass is enough. The loop version also returns early on the first repeat."
:::
