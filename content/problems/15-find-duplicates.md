---
title: Find duplicate values
order: 15
difficulty: Easy
pattern: Hash map / Set
topic: dsa/find-duplicates
---

## 📝 Problem

You get an array. Return every value that appears **more than once**. Each duplicate should appear only once in your answer.

## 🧪 Examples

| Input | Output | Why |
|---|---|---|
| `[1, 2, 3, 2, 4, 1]` | `[2, 1]` | `2` and `1` appear twice |
| `[1, 2, 3]` | `[]` | nothing repeats |
| `[5, 5, 5]` | `[5]` | `5` repeats, but we list it once |

## 🤔 Think first

Try it for 10–15 minutes. First say the slow way out loud, then try to make it faster.

:::hint
When you look at a number, you need to answer one question fast: "Have I seen this before?" Which data structure answers that in one step?
:::

## ✅ Solution

:::solution
**Way 1 — Array methods**

```js
const findDuplicates = (arr) => [
  ...new Set(                                   // Set removes repeated answers
    arr.filter((x, i) => arr.indexOf(x) !== i)  // keep x if it was seen at an earlier index
  ),
];
```

Time **O(n²)**, because `indexOf` is a hidden loop inside `filter`. Fine for small arrays.

**Way 2 — Plain loop with two Sets**

```js
function findDuplicates(arr) {
  const seen = new Set();          // every value we have passed
  const dupes = new Set();         // values seen more than once
  for (const x of arr) {           // look at each value once
    if (seen.has(x)) dupes.add(x); // seen before → it is a duplicate
    else seen.add(x);              // first time → remember it
  }
  return [...dupes];               // turn the Set back into an array
}
```

Time **O(n)**, space **O(n)**.

**Dry run:** `[1, 2, 3, 2, 4, 1]` → seen grows 1, 2, 3 → `2` is seen → dupes `{2}` → 4 → `1` is seen → dupes `{2, 1}` → `[2, 1]` ✅

**What to say:** "Way 1 is short, but `indexOf` inside `filter` makes it O(n²). With a Set of seen values, each check is O(1), so the whole thing is O(n). A second Set stops the same duplicate from being added twice."
:::
