---
title: Group anagrams
stack: dsa
order: 36
level: Intermediate
mustKnow: false
askedFrequency: common
summary:
  - "Put words that are anagrams of each other (same letters, different order) into the same group."
  - "The trick: give every word a KEY that is the same for all its anagrams, then group by the key with a Map."
  - "Key 1: sort the letters (\"eat\" → \"aet\"). Time O(n · m log m)."
  - "Key 2: count the 26 letters (\"1#0#…\"). Time O(n · m), no sorting."
  - "n = number of words, m = length of the longest word."
cards:
  - q: What is an anagram?
    a: A word made from exactly the same letters as another word, in a different order. "eat", "tea" and "ate" are anagrams.
  - q: What is the main trick to group anagrams?
    a: Make a key that is the same for all anagrams (sorted letters, or letter counts), and group words by that key in a Map or object.
  - q: What is the time with the sorted-letters key?
    a: "O(n · m log m): for each of n words, sorting m letters costs m log m."
  - q: Why is the letter-count key faster?
    a: "Counting letters is O(m) per word, so the total is O(n · m), with no sorting."
  - q: Why join the counts with a separator like "#"?
    a: "Without it, counts like [1, 11] and [11, 1] could both become \"111\". The separator keeps the key unique."
---

## 💡 What is it?

You get a list of words. Put words that are **anagrams** of each other into the **same group**.

An anagram uses **exactly the same letters**, in a different order. `"eat"`, `"tea"` and `"ate"` are anagrams.

Example:
`["eat", "tea", "tan", "ate", "nat", "bat"]` → `[["eat","tea","ate"], ["tan","nat"], ["bat"]]`

## 🏠 Real-life example

Think of a **school library sorting returned books by the letters on their spine labels**.

The librarian has boxes. For each book, she writes a **label** by putting its letters in alphabetical order. `"eat"` and `"tea"` both get the label `"aet"`, so they go in the **same box**.

- Each **word** = a book.
- The **alphabetical label** = the key (`"aet"`).
- The **boxes** = the groups in a Map.
- **Same label → same box** = anagrams end up together.

## 🧑‍💻 Code example

Save as `anagrams.js`. Run `node anagrams.js`.

```js
// Way 1 — array methods: sort each word's letters to make a "key"
const groupAnagramsMethods = (words) =>                // words = the list of strings
  Object.values(                                       // keep only the groups (drop the keys)
    words.reduce((groups, w) => {                      // build an object: key → list of words
      const key = [...w].sort().join('');              // "eat" → "aet" (anagrams share this key)
      (groups[key] ||= []).push(w);                    // create the list if missing, then add the word
      return groups;                                   // pass the object to the next word
    }, {}));                                           // start with an empty object

// Way 2 — plain loops: count letters to make the key (no sorting)
function groupAnagrams(words) {                        // words = the list of strings
  const groups = new Map();                            // key → list of words
  for (const w of words) {                             // look at each word
    const count = new Array(26).fill(0);               // one counter per letter a–z
    for (const ch of w) {                              // look at each letter
      count[ch.charCodeAt(0) - 97]++;                  // 'a' is char code 97 → index 0
    }                                                  // end of the letter loop
    const key = count.join('#');                       // e.g. "1#0#0#...#1" — same for anagrams
    if (!groups.has(key)) groups.set(key, []);         // first word with this key → new group
    groups.get(key).push(w);                           // add the word to its group
  }                                                    // end of the word loop
  return [...groups.values()];                         // the groups as an array of arrays
}                                                      // end of groupAnagrams

const words = ['eat', 'tea', 'tan', 'ate', 'nat', 'bat']; // the classic example
console.log(groupAnagramsMethods(words));              // grouped by sorted letters
console.log(groupAnagrams(words));                     // same groups, built by counting
console.log(groupAnagrams(['']));                      // one empty word → one group
```

**Output:**

```text
[ [ 'eat', 'tea', 'ate' ], [ 'tan', 'nat' ], [ 'bat' ] ]
[ [ 'eat', 'tea', 'ate' ], [ 'tan', 'nat' ], [ 'bat' ] ]
[ [ '' ] ]
```

`||=` means "set it only if it's empty" (it was added in ES2021).

## 🔍 Deeper version

**Complexity** (n = number of words, m = length of the longest word):

| Way | Time | Space | Why |
|---|---|---|---|
| Sorted key | O(n · m log m) | O(n · m) | Each word is sorted. |
| Count key | O(n · m) | O(n · m) | Each word is counted once; the key has a fixed 26 parts. |

**Dry run** with the count key:

| word | key (only non-zero letters shown) | group |
|---|---|---|
| eat | a1 e1 t1 | new group 1 |
| tea | a1 e1 t1 | group 1 |
| tan | a1 n1 t1 | new group 2 |
| ate | a1 e1 t1 | group 1 |
| nat | a1 n1 t1 | group 2 |
| bat | a1 b1 t1 | new group 3 |

**Why the `#` separator?** Counts are numbers that can have more than one digit. Without a separator, `[1, 11]` and `[11, 1]` would both join into `"111"`, and two different words could land in one group.

**Edge cases:** an empty word (`""`), one word, uppercase letters (lowercase them first), and letters outside a–z. For any characters, use the sorted key or count with a Map instead of a fixed 26-slot array.

This is the [hash map pattern](topic:dsa/pattern-hash-map). It builds on [valid anagram](topic:dsa/valid-anagram), which checks just two words.

## 🎯 Why do we use it?

- It is a common medium question (LeetCode "Group Anagrams").
- It teaches a powerful idea: **design a key** so that "equal" things collide in a Map. You'll reuse it often.
- Real uses: grouping duplicate records that are written differently, like phone numbers with different spacing.

## ⚠️ Common mistakes

- **Using the array as a Map key directly.** `map.set([1,0,...])` uses the array's *reference*, so equal arrays never match. Turn it into a string first.
- **Forgetting the separator** in the count key.
- **Not lowercasing** when the question says case doesn't matter.
- **Comparing every pair of words**, which is O(n² · m). Grouping by key avoids pairs entirely.

## 🗣️ How to answer in an interview

> "I need to group words that use exactly the same letters. Is it lowercase a to z only? Does the group order matter?
>
> The key idea: give each word a key that's the same for all its anagrams. Then I group by that key in a Map.
>
> The simplest key is the sorted letters. 'eat' becomes 'aet'. That's O(n times m log m).
>
> A faster key is a count of the 26 letters, joined with a separator. Counting is O(m) per word, so the total is O(n times m). I join with a hash sign so that different counts can't produce the same string."

## 🔁 Follow-up questions

### Which key would you use in real code?

The sorted key. It's shorter, easy to read, and works for any characters. The count key is faster for long words, but only for a small fixed alphabet.

### What if the input has uppercase and spaces?

Clean each word first: lowercase it and remove spaces. Then make the key from the cleaned word, but store the original word in the group.

### How would you return only groups with more than one word?

After grouping, use `.filter(g => g.length > 1)`.

### What is the space complexity?

O(n · m). The Map stores every word once, plus one key per group.

## ✅ Quick check

### 1. What is the sorted key of `"listen"`?

:::answer
**`"eilnst"`.** It's the same as the key of `"silent"`, so they're in the same group.
:::

### 2. What's wrong with this?

```js
const groups = new Map();                              // key → words
groups.set([1, 2], ['ab']);                            // an array used as the key
console.log(groups.has([1, 2]));                       // ?
```

:::answer
It prints **`false`**. A Map compares array keys by reference, and `[1, 2]` is a new array each time. Turn the key into a string, like `"1#2"`.
:::

### 3. What is the time of the letter-count solution?

- A) O(n²)
- B) O(n · m)
- C) O(n · m log m)

:::answer
**B) O(n · m).** Each of the n words is counted letter by letter, with no sorting.
:::
