---
title: Longest Substring Without Repeating Characters
order: 33
difficulty: Medium
pattern: Sliding window
topic: dsa/longest-substring
---

## 📝 Problem

You get a string `s`. Find the length of the longest part of it (characters **next to each other**) where **no character repeats**.

## 🧪 Examples

| Input | Output | Why |
|---|---|---|
| `"abcabcbb"` | `3` | `"abc"` |
| `"bbbbb"` | `1` | `"b"` |
| `"pwwkew"` | `3` | `"wke"` (`"pwke"` is not next to each other) |
| `""` | `0` | Empty string |
| `"abba"` | `2` | `"ab"` or `"ba"` |

## 🤔 Think first

:::hint
Keep a window with no repeats. When a repeated character arrives, where must the left edge of the window jump to?
:::

## ✅ Solution

:::solution
**Way 1 — Brute force (grow from every start)**

```js
function longestBrute(s) {
  let best = 0;                                // longest length found
  for (let i = 0; i < s.length; i++) {         // every possible start
    const seen = new Set();                    // characters in this substring
    for (let j = i; j < s.length; j++) {       // grow to the right
      if (seen.has(s[j])) break;               // repeat found → stop growing
      seen.add(s[j]);                          // remember this character
      best = Math.max(best, j - i + 1);        // update the best length
    }
  }
  return best;                                 // the answer
}
```

Time **O(n²)**. Space **O(k)**, where k is the number of different characters.

**Way 2 — Sliding window with last-seen positions**

```js
function lengthOfLongestSubstring(s) {
  const last = new Map();                        // character → last index where we saw it
  let left = 0;                                  // left edge of the window
  let best = 0;                                  // longest length found
  for (let right = 0; right < s.length; right++) { // move the right edge one step
    const ch = s[right];                         // the new character
    if (last.has(ch) && last.get(ch) >= left) {  // repeat INSIDE the current window?
      left = last.get(ch) + 1;                   // jump left past the old copy
    }
    last.set(ch, right);                         // update where we last saw it
    best = Math.max(best, right - left + 1);     // window size = right - left + 1
  }
  return best;                                   // the answer
}
```

Time **O(n)**. Space **O(k)**. The `>= left` check matters: without it, `"abba"` wrongly returns 3.

**Dry run:** `"abcabcbb"` → windows `a`, `ab`, `abc`, `bca`, `cab`, `abc`, `cb`, `b` → best `3` ✅

**What to say:** "Brute force grows a substring from every start, O(n²). I keep a window with no repeats and a Map of last positions. When a character repeats inside the window, the left edge jumps past its old copy. Each character is visited once, so O(n)."
:::
