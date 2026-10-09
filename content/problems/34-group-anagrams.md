---
title: Group Anagrams
order: 34
difficulty: Medium
pattern: Hash map / Set
topic: dsa/group-anagrams
---

## 📝 Problem

You get an array of words. Put words that are **anagrams** of each other into the same group. (Anagrams use exactly the same letters, like `"eat"` and `"tea"`.) Return the groups in any order.

## 🧪 Examples

| Input | Output |
|---|---|
| `["eat", "tea", "tan", "ate", "nat", "bat"]` | `[["eat","tea","ate"], ["tan","nat"], ["bat"]]` |
| `[""]` | `[[""]]` |
| `["a"]` | `[["a"]]` |

## 🤔 Think first

:::hint
Find a "fingerprint" that is the same for all anagrams and different otherwise. Then you can use it as a key.
:::

## ✅ Solution

:::solution
**Way 1 — Brute force (compare every pair)**

```js
function groupAnagramsBrute(words) {
  const key = (w) => [...w].sort().join('');            // sorted letters: "tea" → "aet"
  const used = new Array(words.length).fill(false);     // which words are already grouped
  const groups = [];                                    // the result
  for (let i = 0; i < words.length; i++) {              // pick a word that starts a group
    if (used[i]) continue;                              // already in a group → skip
    const group = [words[i]];                           // start a new group
    used[i] = true;                                     // mark it as used
    for (let j = i + 1; j < words.length; j++) {        // compare with every later word
      if (!used[j] && key(words[j]) === key(words[i])) { // same letters?
        group.push(words[j]);                           // add it to this group
        used[j] = true;                                 // mark it as used
      }
    }
    groups.push(group);                                 // save the finished group
  }
  return groups;                                        // the answer
}
```

Time **O(n² · m log m)**, where m is the word length. Slow for many words.

**Way 2 — Hash map with a sorted key (one loop)**

```js
function groupAnagrams(words) {
  const map = new Map();                         // sorted letters → list of words
  for (const word of words) {                    // look at each word once
    const key = [...word].sort().join('');       // its fingerprint, e.g. "aet"
    if (!map.has(key)) map.set(key, []);         // first time → start an empty group
    map.get(key).push(word);                     // add the word to its group
  }
  return [...map.values()];                      // all the groups
}
```

Time **O(n · m log m)**. Space **O(n · m)**.

**Dry run:** `eat → aet`, `tea → aet`, `tan → ant`, `ate → aet`, `nat → ant`, `bat → abt` → 3 groups ✅

**What to say:** "Anagrams share the same sorted letters, so I use that as a Map key. One pass groups everything: O(n · m log m). If words are long and only lowercase, a 26-letter count string as the key avoids sorting and makes it O(n · m)."
:::
