---
title: Find the second largest number
order: 5
difficulty: Easy
pattern: Single pass
topic: dsa/second-largest
---

## 📝 Problem

Return the **second largest different** number in an array.

If there is no second different number, return `null`.

## 🧪 Examples

| Input | Output |
|---|---|
| `[10, 5, 20, 20, 8]` | `10` (20 is repeated, so the answer is 10) |
| `[-3, -1, -2]` | `-2` |
| `[7, 7, 7]` | `null` |
| `[1]` | `null` |

## 🤔 Think first

Sorting works, but it is O(n log n). Can you do it in one pass?

:::hint
Keep **two** variables while you walk. What should happen to the old "first" when you find a new biggest number?
:::

## ✅ Solution

:::solution
**Way 1 — Array methods**

```js
const secondLargest = (arr) => {
  const unique = [...new Set(arr)].sort((a, b) => b - a); // remove repeats, then sort big → small
  return unique.length > 1 ? unique[1] : null;            // second item, or null if there isn't one
};
```

Time **O(n log n)** because of the sort. Space **O(n)**.

**Way 2 — Plain loop (one pass)**

```js
function secondLargestLoop(arr) {
  let first = -Infinity, second = -Infinity;     // smaller than any real number
  for (const x of arr) {                         // look at each number once
    if (x > first) {                             // new biggest number
      second = first;                            // the old biggest becomes second
      first = x;                                 // remember the new biggest
    } else if (x > second && x !== first) {      // between them, and not a repeat of first
      second = x;                                // new second
    }
  }
  return second === -Infinity ? null : second;   // null if no second was found
}
```

Time **O(n)**. Space **O(1)**.

**Dry run:** `[10, 5, 20, 20, 8]` → first 10 → 5 becomes second → 20: second=10, first=20 → 20 repeat skipped → 8 < 10 → answer `10` ✅

**What to say:** "Sorting is simple but O(n log n). With two variables I need one pass, O(n) time and O(1) space. The `x !== first` check handles repeats like `[20, 20]`."
:::
