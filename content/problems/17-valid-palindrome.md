---
title: Valid palindrome
order: 17
difficulty: Easy
pattern: Two pointers
topic: dsa/palindrome
---

## 📝 Problem

A phrase is a **palindrome** if it reads the same forwards and backwards. Ignore case, and ignore everything that is not a letter or a digit.

Return `true` if the string is a palindrome, otherwise `false`.

## 🧪 Examples

| Input | Output | Why |
|---|---|---|
| `"A man, a plan, a canal: Panama"` | `true` | becomes `amanaplanacanalpanama` |
| `"race a car"` | `false` | becomes `raceacar` |
| `" "` | `true` | nothing left → an empty string is a palindrome |
| `"0P"` | `false` | `0` and `p` are different |

## 🤔 Think first

:::hint
Can you compare the first useful character with the last useful character, then move inwards, without building a new string?
:::

## ✅ Solution

:::solution
**Way 1 — Clean, then reverse**

```js
function isPalindrome(s) {
  const clean = s.toLowerCase().replace(/[^a-z0-9]/g, ''); // lowercase, then keep only letters and digits
  return clean === [...clean].reverse().join('');          // same forwards and backwards?
}
```

Time **O(n)**, space **O(n)** for the cleaned copy.

**Way 2 — Two pointers, no copy**

```js
function isPalindrome(s) {
  const ok = (ch) => /[a-z0-9]/i.test(ch);                      // is this a letter or digit?
  let left = 0, right = s.length - 1;                           // one pointer at each end
  while (left < right) {                                        // stop when they meet
    if (!ok(s[left])) { left++; continue; }                     // skip junk on the left
    if (!ok(s[right])) { right--; continue; }                   // skip junk on the right
    if (s[left].toLowerCase() !== s[right].toLowerCase()) return false; // ends differ → not a palindrome
    left++;                                                     // move both inwards
    right--;
  }
  return true;                                                  // every pair matched
}
```

Time **O(n)**, space **O(1)**.

**Dry run:** `"0P"` → `0` vs `P` → `'0' !== 'p'` → `false` ✅

**What to say:** "The simple way cleans the string and compares it with its reverse. That costs O(n) extra memory. With two pointers I skip junk characters in place, so space is O(1)."
:::
