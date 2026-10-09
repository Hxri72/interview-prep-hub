---
title: Reverse a string and check a palindrome
stack: dsa
order: 23
level: Basic
mustKnow: true
askedFrequency: very common
summary:
  - A palindrome reads the same forwards and backwards, like "racecar" or "madam".
  - "Way 1: s.split('').reverse().join('') and compare. Way 2: a loop from the last letter to the first."
  - "Best check: two pointers from both ends that move inward — O(n) time, O(1) extra space."
  - "Strings can't be changed in place in JavaScript, so reversing always builds a new string."
  - "Ask first: should case, spaces and punctuation be ignored? (\"A man, a plan, a canal: Panama\")"
cards:
  - q: How do you reverse a string with built-in methods?
    a: "s.split('').reverse().join(''): turn it into an array of letters, reverse the array, join it back into text."
  - q: Why doesn't s.reverse() work?
    a: reverse() is an array method. Strings don't have it, so you must split the string into an array first.
  - q: What is the two-pointer palindrome check?
    a: One pointer at the start, one at the end. Compare; if different, return false. Otherwise move both inward until they meet. O(n) time, O(1) space.
  - q: How do you ignore case and punctuation?
    a: "Clean it first: s.toLowerCase().replace(/[^a-z0-9]/g, ''), then run the normal check."
  - q: Is an empty string a palindrome?
    a: Yes. There are no letters that disagree, so the check returns true.
---

## 💡 What is it?

Two linked tasks:

1. **Reverse a string:** `"hello"` → `"olleh"`.
2. **Check a palindrome:** does the word read the same forwards and backwards?

```text
"racecar" → true
"hello"   → false
""        → true   (nothing to disagree)
```

## 🏠 Real-life example

Think of **two friends checking a row of tiles** with letters on them.

One friend stands at the **left end**, the other at the **right end**. They read their tiles out loud. If the letters match, both take one step towards the middle. If they ever don't match, it's not a palindrome. When they meet in the middle, it is.

- The **row of tiles** = the string.
- The **friend at the left** = the `left` pointer.
- The **friend at the right** = the `right` pointer.
- **Stepping towards the middle** = `left++` and `right--`.
- **Meeting in the middle** = `left >= right`, so stop and say "yes".

## 🧑‍💻 Code example

Save as `palindrome.js` and run `node palindrome.js`.

```js
const word = 'racecar';                                   // a word to test

// Way 1 — array methods
const reversed = word.split('').reverse().join('');       // text → letters → reversed letters → text
console.log('Reversed:', reversed);                       // print the reversed word
console.log('Way 1 palindrome?', word === reversed);      // same both ways = palindrome

// Way 2 — plain loops (no split/reverse/join)
function reverseString(s) {                               // build the reversed text by hand
  let out = '';                                           // start with empty text
  for (let i = s.length - 1; i >= 0; i--) {               // walk from the LAST letter to the first
    out += s[i];                                          // add each letter to the end of out
  }                                                       // end of loop
  return out;                                             // the reversed text
}                                                         // end of reverseString

function isPalindrome(s) {                                // two pointers, no extra text
  let left = 0;                                           // left pointer at the first letter
  let right = s.length - 1;                               // right pointer at the last letter
  while (left < right) {                                  // stop when they meet in the middle
    if (s[left] !== s[right]) return false;               // ends don't match → not a palindrome
    left++;                                               // move left pointer inward
    right--;                                              // move right pointer inward
  }                                                       // end of while
  return true;                                            // every pair matched
}                                                         // end of isPalindrome

console.log('Way 2 reversed:', reverseString('hello'));   // print a reversed word
console.log('Way 2:', isPalindrome('racecar'), isPalindrome('hello'), isPalindrome('')); // test three words
```

**Output (real run):**

```text
Reversed: racecar
Way 1 palindrome? true
Way 2 reversed: olleh
Way 2: true false true
```

## 🔍 Deeper version

**Complexity (n = length of the string):**

| Way | Time | Extra space |
|---|---|---|
| `split('').reverse().join('')` + compare | O(n) | O(n): an array and a new string |
| Loop building a reversed string | O(n) | O(n) new string |
| Two pointers | **O(n)** | **O(1)** |

The two-pointer check also **stops early**: `"abcdz"` fails on the very first comparison. See the [two-pointers pattern](topic:dsa/pattern-two-pointers).

**Dry run** of `isPalindrome('racecar')` (length 7):

| left | right | s[left] | s[right] | Match? |
|---|---|---|---|---|
| 0 | 6 | r | r | yes |
| 1 | 5 | a | a | yes |
| 2 | 4 | c | c | yes |
| 3 | 3 | — | — | pointers met → `true` |

**Strings are immutable in JavaScript.** You can't swap letters inside a string. That's why reversing always creates a new string. If an interviewer says "reverse in place", they usually give you an **array of characters** (LeetCode 344). Then you swap with two pointers.

**Ignoring case, spaces and punctuation** (LeetCode 125, "Valid Palindrome"):

```js
function isCleanPalindrome(s) {                       // ignore case, spaces and punctuation
  const clean = s.toLowerCase().replace(/[^a-z0-9]/g, ''); // keep only letters and digits
  let left = 0, right = clean.length - 1;             // two pointers at both ends
  while (left < right) {                              // until they meet
    if (clean[left++] !== clean[right--]) return false; // compare, then move both inward
  }                                                   // end of while
  return true;                                        // all pairs matched
}                                                     // end of isCleanPalindrome
console.log(isCleanPalindrome('A man, a plan, a canal: Panama')); // prints true
```

The `replace` uses a [regular expression](glossary:regex): `[^a-z0-9]` means "any character that is NOT a lowercase letter or a digit", and `g` means "everywhere".

**Emoji and accented letters:** `split('')` splits by UTF-16 code units, so an emoji can break into two broken halves. `[...s]` or `Array.from(s)` splits by real characters. Mention this only if asked.

## 🎯 Why do we use it?

- It's a warm-up question in almost every coding round.
- It checks you know **string vs array** methods, and that strings can't be changed in place.
- The two-pointer idea here is the same one used in many harder problems.

## ⚠️ Common mistakes

- **Calling `s.reverse()`** on a string. Strings don't have `reverse`.
- **Using `<=` in the while loop.** It still works, but compares the middle letter with itself for no reason.
- **Forgetting to ask** whether case and punctuation count. `"Racecar"` is not a palindrome if case matters.
- **Comparing with `==` after building a new reversed string** when the question wanted O(1) space.

## 🗣️ How to answer in an interview

> "A palindrome reads the same both ways. Should I ignore case, spaces and punctuation? I'll first do the strict version.
>
> The quick way is `s.split('').reverse().join('')` and compare. That's O(n) time but O(n) extra space, because it builds an array and a new string.
>
> Better: two pointers, one at each end. I compare the letters; if they differ I return false, otherwise I move both inward until they meet. That's O(n) time and O(1) space, and it stops early on a mismatch.
>
> If I need to ignore case and punctuation, I lowercase and strip non-alphanumeric characters first. Dry run 'racecar': r = r, a = a, c = c, pointers meet → true. Empty string returns true."

## 🔁 Follow-up questions

### How would you check a palindrome number without converting it to a string?

Reverse the digits with maths. Take `x % 10` to get the last digit, build `rev = rev * 10 + digit`, then `x = Math.floor(x / 10)`. Compare `rev` with the original. Negative numbers are not palindromes.

### Can it become a palindrome if you delete at most one letter?

Use two pointers. At the first mismatch, try skipping either the left letter or the right letter, and check if the rest is a palindrome. O(n). This is LeetCode 680.

### How do you reverse the words in a sentence instead of the letters?

`s.trim().split(/\s+/).reverse().join(' ')`. Split on spaces, reverse the list of words, join with single spaces.

### How do you find the longest palindrome inside a string?

"Expand around the centre": for each position, expand left and right while the letters match. Try both odd and even centres. O(n²) time, O(1) space.

## ✅ Quick check

### 1. What does this print?

```js
const w = 'Racecar';                                      // capital R at the start
console.log(w === w.split('').reverse().join(''));        // compare with its reverse
```

:::answer
**`false`**. The reverse is `"racecaR"`. Case matters unless you lowercase first.
:::

### 2. How much extra space does the two-pointer palindrome check use?

- A) O(n)
- B) O(1)
- C) O(n²)

:::answer
**B.** Only two number variables, `left` and `right`, no matter how long the string is.
:::

### 3. Why doesn't `'abc'.reverse()` work?

:::answer
`reverse` is an **array** method. Strings don't have it. Split the string into an array first: `'abc'.split('').reverse().join('')`.
:::
