---
title: Valid anagram
order: 18
difficulty: Easy
pattern: Hash map / Set
topic: dsa/valid-anagram
---

## 📝 Problem

Two strings are **anagrams** if they use exactly the same letters, the same number of times, in any order.

Return `true` if `a` and `b` are anagrams.

## 🧪 Examples

| Input | Output | Why |
|---|---|---|
| `"anagram"`, `"nagaram"` | `true` | same letters, same counts |
| `"rat"`, `"car"` | `false` | `t` vs `c` |
| `"aab"`, `"abb"` | `false` | same letters, different counts |
| `""`, `""` | `true` | two empty strings match |

## 🤔 Think first

:::hint
What quick check can rule out many cases straight away? After that, think about counting letters.
:::

## ✅ Solution

:::solution
**Way 1 — Sort both**

```js
const isAnagram = (a, b) =>
  a.length === b.length &&                          // different lengths can never match
  [...a].sort().join('') === [...b].sort().join(''); // sorted letters must be identical
```

Time **O(n log n)** because of sorting.

**Way 2 — Count letters**

```js
function isAnagram(a, b) {
  if (a.length !== b.length) return false;  // quick rule-out
  const count = {};                         // letter → how many left
  for (const ch of a) {                     // count every letter in a
    count[ch] = (count[ch] || 0) + 1;       // start at 0 if new
  }
  for (const ch of b) {                     // use up letters with b
    if (!count[ch]) return false;           // letter missing or used up → not an anagram
    count[ch]--;                            // use one
  }
  return true;                              // lengths match and every letter was available
}
```

Time **O(n)**, space **O(k)** where k is the number of different letters.

**Dry run:** `"aab"`, `"abb"` → counts `{a:2, b:1}` → `a` ok → `b` ok (0 left) → `b` again → count is 0 → `false` ✅

**What to say:** "Sorting works in O(n log n). Counting with an object is O(n). The length check first makes the second loop safe."
:::
