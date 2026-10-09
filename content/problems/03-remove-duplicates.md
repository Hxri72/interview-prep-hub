---
title: Remove duplicates from an array
order: 3
difficulty: Easy
pattern: Hash map / Set
topic: dsa/remove-duplicates
---

## 📝 Problem

You get an array. Return a **new array** with each value only **once**.

Keep the values in the order they first appear. Don't change the original array.

## 🧪 Examples

| Input | Output |
|---|---|
| `[1, 2, 2, 3, 1]` | `[1, 2, 3]` |
| `[5, 5, 5]` | `[5]` |
| `[]` | `[]` |
| `[1, '1', 1]` | `[1, '1']` (the number 1 and the text "1" are different) |

## 🤔 Think first

Try it for 10 minutes. First say the simple way and its speed. Then make it faster.

:::hint
For each item, you must answer one question: "Have I seen this before?" Which data structure answers that question in one step?
:::

## ✅ Solution

:::solution
**Way 1 — Array methods**

```js
const removeDuplicates = (arr) => [...new Set(arr)]; // a Set keeps only unique values; spread turns it back into an array
```

Time **O(n)**. Space **O(n)** for the Set.

**Way 2 — Plain loop (no Set)**

```js
function removeDuplicatesLoop(arr) {
  const seen = {};                              // remembers values we have already added
  const result = [];                            // the new array we build
  for (let i = 0; i < arr.length; i++) {        // look at every item once
    const key = typeof arr[i] + ':' + arr[i];   // "number:1" and "string:1" stay different
    if (!seen[key]) {                           // first time we see this value
      seen[key] = true;                         // mark it as seen
      result[result.length] = arr[i];           // add it at the end (same as push)
    }
  }
  return result;                                // the original array is unchanged
}
```

Time **O(n)**. Space **O(n)**.

**Dry run:** `[1, 2, 2, 3, 1]` → add 1, add 2, skip 2, add 3, skip 1 → `[1, 2, 3]` ✅

**What to say:** "A Set gives me O(1) lookups, so one pass is O(n). Without a Set I use an object as a 'seen' list. I add the type to the key, so the number 1 and the text '1' don't clash."
:::
