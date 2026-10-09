---
title: Valid anagram
stack: dsa
order: 24
level: Basic
mustKnow: false
askedFrequency: common
summary:
  - "Two words are anagrams if they use exactly the same letters, the same number of times: \"listen\" and \"silent\"."
  - "Way 1: sort the letters of both and compare — O(n log n)."
  - "Way 2: count letters with an object or Map, then subtract — O(n) time."
  - Check the lengths first. Different lengths can never be anagrams.
  - "Ask first: does case matter? Do spaces count?"
cards:
  - q: What is an anagram?
    a: A word made by rearranging all the letters of another word, using each letter the same number of times. "listen" → "silent".
  - q: What is the sorting approach and its cost?
    a: "Sort the letters of both words and compare the results: s.split('').sort().join(''). O(n log n) time."
  - q: What is the O(n) approach?
    a: Count each letter of the first word in an object or Map, then walk the second word and subtract. If any letter goes missing or below zero, it's not an anagram.
  - q: Why check the lengths first?
    a: Words of different lengths can't use the same letters the same number of times. It's an instant O(1) "no".
  - q: Why is "aab" vs "abb" a trap?
    a: Both use the letters a and b, but in different counts. A check that only asks "is this letter present?" wrongly says yes; you must count.
---

## 💡 What is it?

Two words are **anagrams** if one is made by **rearranging all the letters** of the other. Each letter must appear the **same number of times** in both.

```text
"listen", "silent" → true
"rat",    "car"    → false   (t vs c)
"aab",    "abb"    → false   (same letters, different counts)
```

## 🏠 Real-life example

Think of **Scrabble letter tiles**.

You have a bag of tiles that spells `LISTEN`. Can your friend spell `SILENT` using exactly your tiles, with none left over and none missing?

- **Your bag of tiles** = the letter counts of the first word.
- **Your friend taking a tile out** = subtracting 1 for each letter of the second word.
- **A tile your bag doesn't have** = the count is 0, so return false.
- **Empty bag at the end** = every letter matched, so it's an anagram.
- **Different number of tiles** = different lengths, so the answer is "no" straight away.

## 🧑‍💻 Code example

Save as `anagram.js` and run `node anagram.js`.

```js
const a = 'listen';                                       // first word
const b = 'silent';                                       // second word

// Way 1 — array methods (sort the letters)
const sortLetters = (s) => s.split('').sort().join('');   // text → letters → sorted → text
console.log('Sorted:', sortLetters(a), sortLetters(b));   // both become the same text
console.log('Way 1:', sortLetters(a) === sortLetters(b)); // same sorted letters = anagram

// Way 2 — plain loops with a letter-count table
function isAnagram(s, t) {                                // true if t uses exactly s's letters
  if (s.length !== t.length) return false;                // different length → can't be anagrams
  const count = {};                                       // count[letter] = how many we still need
  for (let i = 0; i < s.length; i++) {                    // walk through the first word
    const ch = s[i];                                      // current letter
    count[ch] = (count[ch] || 0) + 1;                     // add 1 for this letter
  }                                                       // end of first loop
  for (let i = 0; i < t.length; i++) {                    // walk through the second word
    const ch = t[i];                                      // current letter
    if (!count[ch]) return false;                         // letter missing or used up → not an anagram
    count[ch] = count[ch] - 1;                            // use one of this letter
  }                                                       // end of second loop
  return true;                                            // every letter matched exactly
}                                                         // end of isAnagram

console.log('Way 2:', isAnagram('listen', 'silent'), isAnagram('rat', 'car'), isAnagram('aab', 'abb')); // three tests
```

**Output (real run):**

```text
Sorted: eilnst eilnst
Way 1: true
Way 2: true false false
```

## 🔍 Deeper version

**Complexity (n = length of each word):**

| Way | Time | Extra space |
|---|---|---|
| Sort both and compare | O(n log n) | O(n) for the arrays |
| Count + subtract (Way 2) | **O(n)** | O(k), where k = number of different letters |
| Fixed array of 26 counts (only a–z) | O(n) | O(1) — always 26 slots |

**Dry run of Way 2** with `"aab"` and `"abb"`:

| Step | Letter | count before | Action | count after |
|---|---|---|---|---|
| Count s | a, a, b | — | add | `{a: 2, b: 1}` |
| t[0] | a | a: 2 | use one | `{a: 1, b: 1}` |
| t[1] | b | b: 1 | use one | `{a: 1, b: 0}` |
| t[2] | b | b: **0** | missing → `false` | — |

**Why the length check makes "subtract only" enough.** If both words have the same length and no count ever goes below zero, then every count must end at exactly zero. So you don't need a final loop to check for leftovers.

**The 26-slot version** (lowercase English letters only): `const count = new Array(26).fill(0)` and use `ch.charCodeAt(0) - 97` as the index. It's very fast and uses constant space. This is a nice optimisation to mention.

**Case and spaces:** clean both words first with `s.toLowerCase().replace(/\s/g, '')` if the question says to ignore them.

**Unicode:** a `Map` works with any characters, including accented letters. The 26-slot array works only for a–z.

This is the [hash map pattern](topic:dsa/pattern-hash-map) used for **counting**, like [frequency count](topic:dsa/frequency-count).

## 🎯 Why do we use it?

- It's a classic warm-up question, and it leads to harder ones like [group anagrams](topic:dsa/group-anagrams).
- It tests whether you think about **counts**, not just presence.
- The "count then compare" idea appears everywhere: matching skills, checking stock, comparing two lists of tags.

## ⚠️ Common mistakes

- **Only checking that each letter exists** in the other word. `"aab"` vs `"abb"` then wrongly returns true.
- **Skipping the length check**, then needing an extra loop to find leftovers.
- **`sort()` on the string itself.** Strings have no `sort`; split into an array first.
- **Not asking about case and spaces.** `"Dormitory"` and `"dirty room"` are only anagrams if you ignore both.

## 🗣️ How to answer in an interview

> "Two words are anagrams if they use the same letters the same number of times. Does case matter? Should spaces count? I'll assume lowercase letters only.
>
> First, if the lengths differ, I return false straight away.
>
> The simple way is to sort the letters of both words and compare. That's O(n log n).
>
> Better: I count each letter of the first word in an object, then walk the second word and subtract. If a letter is missing or already used up, I return false. That's O(n) time. If the input is only a to z, I can use an array of 26 counts, so the space is constant.
>
> Dry run 'aab' and 'abb': counts a2 b1; use a, use b, then b is already 0, so false."

## 🔁 Follow-up questions

### How would you group many words into anagram groups?

Give each word a **key**: its sorted letters (or its 26 letter counts as a string). Store words in a Map from key to list. Words with the same key are anagrams. See [group anagrams](topic:dsa/group-anagrams).

### How do you find all anagrams of a short word inside a long text?

Use a **sliding window** of the short word's length. Keep letter counts for the window. As it moves, add the new letter and remove the old one, then compare counts. O(n). See [sliding window](topic:dsa/pattern-sliding-window).

### What if the input can contain any Unicode character?

Use a `Map` for the counts instead of a 26-slot array. Split with `[...s]` so emoji and other multi-part characters stay whole.

### Can you do it in one loop?

Yes. With equal lengths, loop once: add 1 for `s[i]` and subtract 1 for `t[i]`. At the end, every count must be 0.

## ✅ Quick check

### 1. What does `isAnagram('rat', 'tar')` return?

:::answer
**`true`**. Same length; counts r1 a1 t1, and `"tar"` uses each exactly once.
:::

### 2. What is the time complexity of the sorting approach?

- A) O(n)
- B) O(n log n)
- C) O(n²)

:::answer
**B.** Sorting the letters is O(n log n). Comparing the two sorted strings is O(n), which is smaller.
:::

### 3. Are `"a gentleman"` and `"elegant man"` anagrams if spaces count as characters?

:::answer
**Yes.** Both have 11 characters, including one space each, and the same letter counts. Sorting both gives the same string.
:::
