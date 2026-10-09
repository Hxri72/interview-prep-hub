---
title: Split an array into chunks of size k
order: 14
difficulty: Easy
pattern: Single pass
topic: dsa/chunk-array
---

## 📝 Problem

Split an array into groups of **k** items. The last group can be smaller.

## 🧪 Examples

| Input | Output |
|---|---|
| `[1, 2, 3, 4, 5]`, k = 2 | `[[1, 2], [3, 4], [5]]` |
| `[1, 2, 3]`, k = 3 | `[[1, 2, 3]]` |
| `[1, 2]`, k = 5 | `[[1, 2]]` |
| `[]`, k = 2 | `[]` |

## 🤔 Think first

This is how you split results into pages, or send records to an API in batches.

:::hint
Each group starts at a fixed jump from the last one. How big is the jump, and where does each group end?
:::

## ✅ Solution

:::solution
**Way 1 — Array methods**

```js
const chunk = (arr, k) =>
  Array.from(
    { length: Math.ceil(arr.length / k) },      // how many groups: round up 5 / 2 = 3
    (_, i) => arr.slice(i * k, i * k + k),      // group i holds items i*k up to (not including) i*k + k
  );
```

Time **O(n)**. Space **O(n)**.

**Way 2 — Plain loop**

```js
function chunkLoop(arr, k) {
  const result = [];                                  // list of groups
  for (let i = 0; i < arr.length; i += k) {           // jump k steps each time: 0, k, 2k…
    const group = [];                                 // the current group
    for (let j = i; j < i + k && j < arr.length; j++) { // up to k items, but never past the end
      group.push(arr[j]);                             // add one item
    }
    result.push(group);                               // save the finished group
  }
  return result;
}
```

Time **O(n)** — every item is copied once. Space **O(n)**.

**Dry run:** `[1,2,3,4,5]`, k=2 → i=0 `[1,2]` → i=2 `[3,4]` → i=4 `[5]` ✅

**What to say:** "I jump k at a time and slice each group. It's O(n), since every item is copied once. The `j < arr.length` check handles a short last group. I'd also ask what to do if k is 0 or negative."
:::
