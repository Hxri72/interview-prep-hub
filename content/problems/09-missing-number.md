---
title: Find the missing number (1 to n)
order: 9
difficulty: Easy
pattern: Math / XOR
topic: dsa/missing-number
---

## 📝 Problem

The array should hold every number from **1 to n**, but **one is missing**. So the array has `n - 1` numbers, in any order. Return the missing number.

## 🧪 Examples

| Input | Output |
|---|---|
| `[1, 2, 4, 5]` | `3` |
| `[2, 3, 4]` | `1` |
| `[1, 2, 3]` | `4` (the last number is missing) |
| `[]` | `1` (n = 1, and 1 is missing) |

## 🤔 Think first

Sorting or a Set works. Can you do it with **no extra memory**?

:::hint
You know exactly what the full list *should* add up to. Compare that with what you actually have.
:::

## ✅ Solution

:::solution
**Way 1 — Array methods (sum formula)**

```js
const missingNumber = (arr) => {
  const n = arr.length + 1;                     // one number is missing, so the full list has length + 1
  const expected = (n * (n + 1)) / 2;           // sum of 1..n
  const actual = arr.reduce((s, x) => s + x, 0); // sum of what we have
  return expected - actual;                     // the difference is the missing number
};
```

Time **O(n)**. Space **O(1)**.

**Way 2 — Plain loop with XOR (no overflow risk)**

```js
function missingNumberXor(arr) {
  let x = 0;                                    // XOR of everything so far
  for (let i = 1; i <= arr.length + 1; i++) {   // XOR all numbers 1..n
    x ^= i;                                     // a ^ a = 0, so pairs cancel out
  }
  for (const v of arr) x ^= v;                  // XOR the numbers we have
  return x;                                     // only the missing number has no partner
}
```

Time **O(n)**. Space **O(1)**.

**Dry run (sum):** `[1, 2, 4, 5]` → n = 5 → expected 15 → actual 12 → `3` ✅

**What to say:** "Sum of 1 to n is n(n+1)/2, so I subtract the real sum. That's O(n) time and O(1) space. With very big n the sum could overflow in some languages, so XOR is a safe alternative."
:::
