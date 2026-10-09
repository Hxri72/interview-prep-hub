---
title: Flatten a nested array
order: 13
difficulty: Medium
pattern: Recursion
topic: dsa/flatten-array
---

## 📝 Problem

An array can contain other arrays, nested at any depth. Return **one flat array** with all the values, in order.

## 🧪 Examples

| Input | Output |
|---|---|
| `[1, [2, [3, [4]]]]` | `[1, 2, 3, 4]` |
| `[1, 2]` | `[1, 2]` |
| `[[], [[]]]` | `[]` |
| `[]` | `[]` |

## 🤔 Think first

You don't know how deep the nesting goes. So a fixed number of loops can't work.

:::hint
An inner array is the **same problem**, only smaller. What can your function do when it meets one?
:::

## ✅ Solution

:::solution
**Way 1 — Array methods**

```js
const flatten = (arr) => arr.flat(Infinity); // Infinity = flatten every level, however deep
```

Time **O(total items)**. Space **O(total items)**.

**Way 2 — Plain loop with recursion**

```js
function flattenLoop(arr) {
  const result = [];                          // the flat answer
  for (const item of arr) {                   // look at each item
    if (Array.isArray(item)) {                // an inner array → same problem, smaller
      for (const x of flattenLoop(item)) {    // flatten it first (recursion)
        result.push(x);                       // then add its values
      }
    } else {
      result.push(item);                      // a normal value → just add it
    }
  }
  return result;
}
```

Time **O(total items)**. Space **O(total items + depth)**, because each level of nesting adds one function call to the call stack.

**Dry run:** `[1, [2, [3, [4]]]]` → 1 → flatten `[2,[3,[4]]]` → 2 → flatten `[3,[4]]` → 3 → flatten `[4]` → 4 ✅

**What to say:** "`flat(Infinity)` does it in one line. Without it, I recurse: values go straight in, arrays get flattened first. For extremely deep nesting I'd switch to a loop with my own stack, so the call stack can't overflow."
:::
