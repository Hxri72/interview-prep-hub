---
title: Majority element
order: 20
difficulty: Easy
pattern: Hash map / Set
topic: dsa/pattern-hash-map
---

## 📝 Problem

The **majority element** appears **more than half** the time (more than `n / 2` times). You may assume it always exists. Return it.

## 🧪 Examples

| Input | Output | Why |
|---|---|---|
| `[3, 2, 3]` | `3` | 2 of 3 |
| `[2, 2, 1, 1, 1, 2, 2]` | `2` | 4 of 7 |
| `[7]` | `7` | 1 of 1 |

## 🤔 Think first

:::hint
Counting works. For a bonus: since the winner is more than half, could the other values "cancel out" against it?
:::

## ✅ Solution

:::solution
**Way 1 — Count with an object**

```js
function majorityElement(arr) {
  const count = {};                          // value → how many times so far
  for (const x of arr) {                     // look at each value
    count[x] = (count[x] || 0) + 1;          // add 1
    if (count[x] > arr.length / 2) return x; // passed half → this is the majority
  }
}
```

Time **O(n)**, space **O(n)**.

**Way 2 — Boyer–Moore voting (O(1) space)**

```js
function majorityElement(arr) {
  let candidate = null;                     // our current guess
  let votes = 0;                            // how strong the guess is
  for (const x of arr) {                    // one pass
    if (votes === 0) candidate = x;         // no votes left → pick a new guess
    votes += x === candidate ? 1 : -1;      // same value adds a vote, different value cancels one
  }
  return candidate;                         // the majority always survives the cancelling
}
```

Time **O(n)**, space **O(1)**.

**Dry run:** `[2, 2, 1, 1, 1, 2, 2]` → votes 1, 2, 1, 0 → pick `1` (votes 1) → `2` cancels (0) → pick `2` (1) → `2` (2) → answer `2` ✅

**What to say:** "Counting in a map is O(n) time and O(n) space. Because the majority is more than half, every other value can cancel one of its votes and it still wins. That's Boyer–Moore: O(n) time, O(1) space."
:::
