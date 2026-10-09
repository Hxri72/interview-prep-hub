---
title: Longest substring without repeating characters
stack: dsa
order: 35
level: Intermediate
mustKnow: false
askedFrequency: very common
summary:
  - "Find the length of the longest part of a string where no letter repeats."
  - "Brute force tries every start and grows until a repeat: O(n²)."
  - "Sliding window: move a right edge forward; when a letter repeats, jump the left edge past its last copy."
  - "A Map of letter → last index makes it one pass: O(n) time, O(k) space (k = different letters)."
  - "Check that the old copy is still inside the window (lastSeen >= left) before jumping, or 'abba' breaks."
cards:
  - q: What is a substring?
    a: A part of a string where the letters sit next to each other, with no gaps. "abc" is a substring of "xabcy"; "ac" is not.
  - q: Which pattern solves this in O(n)?
    a: A sliding window. A right edge grows the window; a left edge shrinks it whenever a letter repeats.
  - q: What does the Map store in the optimal solution?
    a: Each letter and the last index where it was seen, so the left edge can jump straight past the old copy.
  - q: "What is the answer for 'pwwkew'?"
    a: "3, from \"wke\". Note \"pwke\" is not a substring because the letters aren't next to each other."
  - q: "Why do we check lastSeen.get(ch) >= left?"
    a: The old copy might already be outside the window. Without the check, the left edge could jump backwards, for example in "abba".
---

## 💡 What is it?

You get a string. Find the **length of the longest substring with no repeated letters**.

A **substring** is a part of the string where the letters sit **next to each other**.

Examples:
- `"abcabcbb"` → **3** (`"abc"`)
- `"bbbbb"` → **1** (`"b"`)
- `"pwwkew"` → **3** (`"wke"`)

## 🏠 Real-life example

Think of a **train of carriages**, where each carriage carries one student's name tag. You want the **longest stretch of carriages with no repeated name**.

- You stand at the **back of the stretch** (left edge) and a friend walks **forward** (right edge).
- Each new carriage your friend reaches = a new letter entering the window.
- If that name is **already in your stretch**, you walk forward to just **past the old carriage with that name**.
- You keep a **notebook** of where you last saw each name, so you can jump straight there.

Mapping:
- **Carriages** = the letters in the string.
- **Your stretch** = the window between `left` and `right`.
- **Notebook** = the `Map` of letter → last index.
- **Longest stretch you ever had** = `best`.

## 🧑‍💻 Code example

Save as `longest.js`. Run `node longest.js`.

```js
// Way 1 — brute force with array methods (try every start, grow until a repeat)
function longestBrute(s) {                             // s = the input string
  let best = 0;                                        // longest length found so far
  [...s].forEach((_, start) => {                       // try every starting position
    const seen = new Set();                            // letters inside the current window
    [...s.slice(start)].some((ch) => {                 // walk forward; some() stops when we return true
      if (seen.has(ch)) return true;                   // repeat found → stop this start
      seen.add(ch);                                    // new letter → add it
      best = Math.max(best, seen.size);                // update the best length
      return false;                                    // keep walking
    });                                                // end of the inner walk
  });                                                  // end of the start loop
  return best;                                         // the longest length
}                                                      // end of longestBrute

// Way 2 — sliding window with a Map (one pass)
function lengthOfLongestSubstring(s) {                 // s = the input string
  const lastSeen = new Map();                          // letter → the last index we saw it at
  let left = 0, best = 0;                              // left edge of the window, best length
  for (let right = 0; right < s.length; right++) {     // right edge moves one step each time
    const ch = s[right];                               // the new letter entering the window
    if (lastSeen.has(ch) && lastSeen.get(ch) >= left) { // this letter is already inside the window
      left = lastSeen.get(ch) + 1;                     // jump left past the old copy
    }                                                  // end of the repeat check
    lastSeen.set(ch, right);                           // remember where we saw this letter
    best = Math.max(best, right - left + 1);           // window size = right - left + 1
  }                                                    // end of the loop
  return best;                                         // the longest length
}                                                      // end of lengthOfLongestSubstring

console.log(longestBrute('abcabcbb'));                 // 3 ("abc")
console.log(lengthOfLongestSubstring('abcabcbb'));     // 3
console.log(lengthOfLongestSubstring('bbbbb'));        // 1 ("b")
console.log(lengthOfLongestSubstring('pwwkew'));       // 3 ("wke")
console.log(lengthOfLongestSubstring(''));             // 0 (empty string)
```

**Output:**

```text
3
3
1
3
0
```

## 🔍 Deeper version

**Complexity:**

| Way | Time | Space | Why |
|---|---|---|---|
| Brute force | O(n²) | O(k) | Every start, growing up to the end. |
| Sliding window + Map | O(n) | O(k) | Each letter enters the window once; `left` only moves forward. |

`k` = the number of different letters. For English letters, k is at most 26 (or 128 for all ASCII), so the space is small.

**Dry run** on `"abcabcbb"`:

| right | letter | left after check | window | best |
|---|---|---|---|---|
| 0 | a | 0 | a | 1 |
| 1 | b | 0 | ab | 2 |
| 2 | c | 0 | abc | **3** |
| 3 | a | 1 | bca | 3 |
| 4 | b | 2 | cab | 3 |
| 5 | c | 3 | abc | 3 |
| 6 | b | 5 | cb | 3 |
| 7 | b | 7 | b | 3 |

**The `>= left` check.** Take `"abba"`. At the last `a`, the Map says `a` was at index 0. But `left` is already 2 (after the second `b`). Without the check, `left` would jump **back** to 1, and the answer would be wrong. With it, the answer is correctly **2**.

**Edge cases:** empty string (0), one letter (1), all the same (1), all different (the full length), spaces and symbols (they count as letters too).

This is the classic example of [the sliding window pattern](topic:dsa/pattern-sliding-window). The Map is the [hash map pattern](topic:dsa/pattern-hash-map).

## 🎯 Why do we use it?

- It is one of the most asked string questions (LeetCode "Longest Substring Without Repeating Characters").
- It is the best way to show you understand a **variable-size sliding window**.
- Real uses: the longest run of unique items in a log, or the longest stretch with no repeated user in a queue.

## ⚠️ Common mistakes

- **Confusing substring with subsequence.** In `"pwwkew"`, `"pwke"` is not valid, because the letters aren't next to each other.
- **Moving `left` one step at a time** with a Set, and forgetting to delete letters that leave. It works, but you must remove letters correctly.
- **Missing the `>= left` check**, so `left` jumps backwards.
- **Off-by-one in the window size.** The size is `right - left + 1`, not `right - left`.

## 🗣️ How to answer in an interview

> "I need the longest substring with no repeated letters. Substring means the letters are next to each other. Can the string be empty, and does case matter?
>
> The brute force tries every start and grows until it hits a repeat. That's O(n²).
>
> I'll use a sliding window. The right edge moves forward one letter at a time. I keep a Map of each letter's last index. If the new letter was already seen inside the window, I move the left edge to just past that old copy. After each step, the window size is right minus left plus one, and I keep the best.
>
> Each letter is visited once, so it's O(n) time and O(k) space for the Map."

## 🔁 Follow-up questions

### Can you do it with a Set instead of a Map?

Yes. When the new letter is in the Set, remove letters from the left and move `left` forward until it's gone. It's still O(n), because each letter is added and removed at most once. The Map version just jumps faster.

### How would you return the substring itself?

Also save `bestStart = left` whenever you update `best`. At the end, return `s.slice(bestStart, bestStart + best)`.

### What if at most 2 different letters are allowed?

Same sliding window, but the Map counts letters inside the window. When the Map has more than 2 keys, shrink from the left until it has 2 again.

### Does it work with emojis?

Not exactly. Some emojis use two JavaScript characters. Use `[...s]` (which splits by real characters) and index into that array instead of the string.

## ✅ Quick check

### 1. What does `lengthOfLongestSubstring('abba')` return?

:::answer
**2.** The best windows are `"ab"` and `"ba"`. The `>= left` check stops `left` from jumping back to index 1 at the last `a`.
:::

### 2. What does `lengthOfLongestSubstring('dvdf')` return?

:::answer
**3**, from `"vdf"`. When the second `d` arrives, `left` jumps to index 1 (just past the first `d`).
:::

### 3. Which pattern is this?

- A) Two pointers moving towards each other
- B) Sliding window
- C) Binary search

:::answer
**B) Sliding window.** Both edges move forward, and the window grows and shrinks.
:::
