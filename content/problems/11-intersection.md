---
title: Common items in two arrays (intersection)
order: 11
difficulty: Easy
pattern: Hash map / Set
topic: dsa/intersection
---

## 📝 Problem

Return the values that appear in **both** arrays. Each value should appear only **once** in the answer, in the order it appears in the first array.

## 🧪 Examples

| Input | Output |
|---|---|
| `[1, 2, 2, 3]` and `[2, 3, 4]` | `[2, 3]` |
| `[1, 2]` and `[3, 4]` | `[]` |
| `[]` and `[1]` | `[]` |

## 🤔 Think first

`a.filter(x => b.includes(x))` looks short. How fast is it really?

:::hint
`includes` is a hidden loop. What can you build from the second array so each "is it there?" check takes one step?
:::

## ✅ Solution

:::solution
**Way 1 — Array methods**

```js
const intersection = (a, b) => {
  const inB = new Set(b);                          // fast "is it in b?" checks
  return [...new Set(a.filter((x) => inB.has(x)))]; // keep items found in b, then remove repeats
};
```

Time **O(n + m)**. Space **O(n + m)**.

**Way 2 — Plain loop with objects**

```js
function intersectionLoop(a, b) {
  const inB = {};                           // remembers everything in b
  for (const x of b) inB[x] = true;         // one pass over b
  const result = [];                        // the answer
  const added = {};                         // stops repeats in the answer
  for (const x of a) {                      // one pass over a
    if (inB[x] && !added[x]) {              // in both, and not added yet
      result.push(x);                       // keep it
      added[x] = true;                      // remember we added it
    }
  }
  return result;
}
```

Time **O(n + m)**. Space **O(n + m)**.

**Dry run:** b → {2, 3, 4}. a: 1 no → 2 yes → 2 already added → 3 yes → `[2, 3]` ✅

**What to say:** "The naive filter + includes is O(n × m). Building a Set from one array makes each check O(1), so the whole thing is O(n + m)."
:::
