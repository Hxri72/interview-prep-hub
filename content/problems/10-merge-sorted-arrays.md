---
title: Merge two sorted arrays
order: 10
difficulty: Easy
pattern: Two pointers
topic: dsa/merge-sorted
---

## 📝 Problem

You get two arrays. Each one is already **sorted small to big**. Return one new sorted array with all the numbers.

## 🧪 Examples

| Input | Output |
|---|---|
| `[1, 3, 5]` and `[2, 4, 6]` | `[1, 2, 3, 4, 5, 6]` |
| `[]` and `[1, 2]` | `[1, 2]` |
| `[1, 1]` and `[1]` | `[1, 1, 1]` |

## 🤔 Think first

Joining and sorting works, but it ignores the fact that both inputs are already sorted.

:::hint
Look only at the **front** of each array. Which of the two fronts must come next in the answer?
:::

## ✅ Solution

:::solution
**Way 1 — Array methods**

```js
const mergeSorted = (a, b) => [...a, ...b].sort((x, y) => x - y); // join both, then sort numbers small → big
```

Time **O((n + m) log(n + m))**. Space **O(n + m)**.

**Way 2 — Plain loop with two pointers**

```js
function mergeSortedLoop(a, b) {
  const result = [];                             // the merged answer
  let i = 0, j = 0;                              // one pointer for each array
  while (i < a.length && j < b.length) {         // while both arrays still have items
    if (a[i] <= b[j]) result.push(a[i++]);       // take the smaller front, move that pointer
    else result.push(b[j++]);                    // b's front is smaller
  }
  while (i < a.length) result.push(a[i++]);      // add whatever is left in a
  while (j < b.length) result.push(b[j++]);      // add whatever is left in b
  return result;
}
```

Time **O(n + m)**. Space **O(n + m)** for the result.

**Dry run:** `[1,3,5]` + `[2,4,6]` → 1, 2, 3, 4, 5 → a is empty → add 6 ✅

**What to say:** "Both inputs are sorted, so I compare the fronts with two pointers. That's O(n + m) instead of O((n + m) log(n + m)). This is the merge step of merge sort."
:::
