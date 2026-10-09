---
title: Reverse a string in place
order: 21
difficulty: Easy
pattern: Two pointers
topic: dsa/palindrome
---

## 📝 Problem

You get the string as an **array of characters**. Reverse it **in place**: change the same array, don't build a new one. Use only O(1) extra memory.

## 🧪 Examples

| Input | Output |
|---|---|
| `["h","e","l","l","o"]` | `["o","l","l","e","h"]` |
| `["H","a","n","n","a","h"]` | `["h","a","n","n","a","H"]` |
| `["x"]` | `["x"]` |

## 🤔 Think first

:::hint
Which two characters should swap first? After that swap, which two are next?
:::

## ✅ Solution

:::solution
**Way 1 — Built-in method**

```js
const reverseString = (chars) => chars.reverse(); // reverse() changes the original array in place
```

Time **O(n)**, space **O(1)**. Interviewers usually then ask you to write it yourself.

**Way 2 — Two pointers, swapping**

```js
function reverseString(chars) {
  let left = 0;                       // pointer at the start
  let right = chars.length - 1;       // pointer at the end
  while (left < right) {              // stop when they meet in the middle
    [chars[left], chars[right]] = [chars[right], chars[left]]; // swap the two ends
    left++;                           // move inwards
    right--;
  }
  return chars;                       // same array, now reversed
}
```

Time **O(n)** (n/2 swaps), space **O(1)**.

**Dry run:** `h e l l o` → swap h/o → swap e/l → middle `l` stays → `o l l e h` ✅

**What to say:** "I swap the two ends and move both pointers inwards. Each pair is swapped once, so it's O(n) time with no extra array."
:::
