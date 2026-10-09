---
title: Find the largest and smallest number
order: 4
difficulty: Easy
pattern: Single pass
topic: dsa/largest-smallest
---

## 📝 Problem

You get an array of numbers. Return the **largest** and the **smallest** number as `{ max, min }`.

If the array is empty, return `null`.

## 🧪 Examples

| Input | Output |
|---|---|
| `[3, 9, -2, 7]` | `{ max: 9, min: -2 }` |
| `[42]` | `{ max: 42, min: 42 }` |
| `[-5, -1, -9]` | `{ max: -1, min: -9 }` |
| `[]` | `null` |

## 🤔 Think first

Can you find both answers by walking through the array only once?

:::hint
What value should your "best so far" start with? Think about an array where every number is negative.
:::

## ✅ Solution

:::solution
**Way 1 — Array methods**

```js
const maxMin = (arr) =>
  arr.length ? { max: Math.max(...arr), min: Math.min(...arr) } : null; // spread the numbers into Math.max / Math.min; empty → null
```

Time **O(n)** (two passes). Space **O(n)**, because spreading copies the values into arguments. On a very huge array the spread can fail.

**Way 2 — Plain loop (one pass)**

```js
function maxMinLoop(arr) {
  if (arr.length === 0) return null;          // nothing to compare
  let max = arr[0], min = arr[0];             // start with the first item, not with 0
  for (let i = 1; i < arr.length; i++) {      // check every other item once
    if (arr[i] > max) max = arr[i];           // found a bigger one
    if (arr[i] < min) min = arr[i];           // found a smaller one
  }
  return { max, min };                        // both answers from one pass
}
```

Time **O(n)**. Space **O(1)**.

**Dry run:** `[3, 9, -2, 7]` → start 3/3 → 9 is bigger → -2 is smaller → 7 changes nothing → `{ max: 9, min: -2 }` ✅

**What to say:** "I start from the first element, not 0, so all-negative arrays work. One loop is O(n) time and O(1) space. I prefer the loop over `Math.max(...arr)` for huge arrays, because spreading can hit the argument limit."
:::
