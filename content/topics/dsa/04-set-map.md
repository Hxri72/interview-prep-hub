---
title: Set and Map for problem solving
stack: dsa
order: 4
level: Basic
mustKnow: false
askedFrequency: common
summary:
  - A Set stores unique values. set.has(x) checks if x is there in O(1).
  - A Map stores key → value pairs. map.get, map.set and map.has are O(1).
  - "Use a Set for \"unique\" and \"seen before?\" questions. Use a Map for counting and \"value → position\"."
  - They turn many O(n²) brute-force answers into O(n), at the cost of O(n) extra memory.
  - Prefer Map over a plain object when keys are numbers or you need insertion order and size.
cards:
  - q: How do you remove duplicates from an array in one line?
    a: "[...new Set(arr)] — a Set keeps only unique values, and spread turns it back into an array."
  - q: What is the time complexity of set.has(x)?
    a: O(1) on average — much faster than arr.includes(x), which is O(n).
  - q: When do you use a Map instead of a Set?
    a: When you need to store something WITH each key, like a count or a position. A Set only stores the keys.
  - q: Map vs plain object for counting?
    a: A Map keeps key types (1 stays a number), has .size, keeps insertion order and has no prototype keys. Object keys always become strings.
  - q: What trade-off do Set/Map solutions make?
    a: They use O(n) extra memory to get O(n) time instead of O(n²).
---

## 💡 What is it?

**Set** and **Map** are two built-in tools that make many array problems fast.

- A **Set** is a bag of **unique** values. Adding a value twice keeps one copy.
- A **Map** stores **key → value** pairs, like a word and its meaning.

Both can check "is this here?" in **O(1)**, a single step. An array's `includes` needs O(n). See [Big O](topic:dsa/big-o).

## 🏠 Real-life example

**Set = the school gate register.** When a student enters, the guard checks the list: "Already inside?" If yes, they're not written twice.

**Map = the class attendance sheet.** Each student's name (key) has the number of days present next to it (value). To see Meena's attendance, you jump straight to her name.

## 🧑‍💻 Code example

Save as `set-map.js` and run `node set-map.js`.

```js
const ids = [3, 1, 3, 2, 1];                        // a list with repeats

// Set: keeps only unique values
const unique = [...new Set(ids)];                   // make a Set, then spread it back into an array
console.log('unique:', unique);                     // show the unique values

// Set: "have I seen this before?"
function firstRepeat(list) {                        // find the first value that appears again
  const seen = new Set();                           // values we have already met
  for (const x of list) {                           // look at each value once
    if (seen.has(x)) return x;                      // seen before → this is the first repeat
    seen.add(x);                                    // otherwise remember it
  }                                                 // end of the loop
  return null;                                      // no repeat at all
}                                                   // end of firstRepeat
console.log('first repeat:', firstRepeat(ids));     // test it

// Map: count how many times each value appears
const count = new Map();                            // value → how many times
for (const x of ids) {                              // look at each value once
  count.set(x, (count.get(x) ?? 0) + 1);            // old count (or 0) plus 1
}                                                   // end of the loop
console.log('counts:', count);                      // show the Map
console.log('how many 3s?', count.get(3));          // read one count in O(1)
```

**Output:**

```text
unique: [ 3, 1, 2 ]
first repeat: 3
counts: Map(3) { 3 => 2, 1 => 2, 2 => 1 }
how many 3s? 2
```

## 🔍 Deeper version

**The three classic uses:**

| Question says… | Tool | Pattern |
|---|---|---|
| "unique", "distinct", "remove duplicates" | Set | `[...new Set(arr)]` |
| "seen before?", "first repeat", "contains duplicate" | Set | check `has`, then `add` |
| "count", "frequency", "most common" | Map | `map.set(x, (map.get(x) ?? 0) + 1)` |
| "find the partner", "value → position" | Map | Two Sum style |

**Why O(1)?** Sets and Maps are **hash tables**. They turn the key into a number (a hash) and jump straight to its slot. An array has to walk item by item.

**Map vs object:**

| | `Map` | Plain object `{}` |
|---|---|---|
| Key types | any (numbers stay numbers) | strings or symbols only |
| Size | `map.size` | `Object.keys(obj).length` |
| Order | insertion order | mostly, with number-like keys sorted first |
| Hidden keys | none | inherited ones like `toString` |

**Gotcha: objects as keys.** `new Set([{a: 1}, {a: 1}])` has **2** items. Sets compare objects by reference, not by content. For "unique by id", use a Map keyed by `id`.

:::version[Version note]
Since **ES2025**, Sets have built-in methods like `union`, `intersection` and `difference` (Node 22+). See [Map, Set, WeakMap](topic:javascript/map-set-weakmap).
:::

## 🎯 Why do we use it?

In real code: removing duplicate tags, counting events per user, caching results by key, grouping items, and "skip if already processed" checks for webhooks.

In interviews: they are the **number one tool** for turning an O(n²) answer into O(n). See the [hash map pattern](topic:dsa/pattern-hash-map).

## ⚠️ Common mistakes

- **Using `arr.includes()` inside a loop** instead of a Set. That's hidden O(n²).
- **Counting with an object, then comparing numbers.** Object keys become strings, so `1` and `"1"` are the same key.
- **Expecting a Set to remove duplicate objects** by content.
- **Forgetting the extra memory** when you state the complexity.

## 🗣️ How to answer in an interview

> "Whenever a problem says unique, seen before, count or find a partner, I reach for a Set or a Map. They're hash tables, so has, get and set are O(1) on average.
>
> For example, to find the first repeated value, I walk the array once, check whether the value is already in a Set, and add it if not. That's O(n) time and O(n) space, instead of O(n²) with nested loops.
>
> I prefer a Map over a plain object for counting, because keys keep their type, it has a size property, and there are no inherited keys."

## 🔁 Follow-up questions

### How would you find the most frequent value?

Count with a Map in one pass. Then loop over the Map and keep the key with the biggest count. O(n).

### Can you solve "first repeat" without extra memory?

Yes, with nested loops — O(n²) time but O(1) space. Or sort first (O(n log n)) and compare neighbours, but sorting changes the order.

### How do you get unique objects by id?

`[...new Map(users.map((u) => [u.id, u])).values()]`. The Map keeps one user per id.

### What is a WeakMap for?

Keys must be objects, and they don't stop garbage collection. Good for caching data about objects without leaking memory.

## ✅ Quick check

### 1. What does this print?

```js
const s = new Set([1, 2, 2, 3]);  // make a Set
s.add(3);                         // add 3 again
console.log(s.size);              // ?
```

:::answer
**3** — the Set holds 1, 2 and 3. Duplicates are ignored.
:::

### 2. What does this print?

```js
const count = {};               // a plain object
count[1] = 'a';                 // number key 1
count['1'] = 'b';               // string key '1'
console.log(Object.keys(count)); // ?
```

:::answer
**`[ '1' ]`** — object keys become strings, so both lines use the same key `'1'`. A Map would keep two keys.
:::

### 3. Time complexity of removing duplicates with `[...new Set(arr)]`?

:::answer
**O(n)** time and **O(n)** space.
:::
