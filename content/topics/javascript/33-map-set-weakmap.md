---
title: Map, Set, WeakMap, WeakSet
stack: javascript
order: 33
level: Intermediate
mustKnow: false
askedFrequency: common
summary:
  - A Set stores unique values. Great for removing duplicates and fast "is it there?" checks.
  - A Map stores key → value pairs. Keys can be any type, it keeps insertion order, and it has a .size.
  - Map and Set lookups (has, get) are very fast — O(1) on average.
  - WeakMap and WeakSet only take objects as keys, and they don't stop those objects from being garbage-collected.
  - Use a plain object for simple fixed records or JSON. Use a Map for dynamic keys, counting and frequent add/delete.
cards:
  - q: How do you remove duplicates from an array in one line?
    a: "[...new Set(arr)] — the Set keeps each value once, and the spread turns it back into an array."
  - q: Map vs plain object?
    a: Map keys can be any type (objects, numbers), it keeps insertion order, has .size, and is built for frequent adds and deletes. Object keys are only strings or symbols.
  - q: What is special about WeakMap?
    a: Its keys must be objects, and it holds them "weakly". If nothing else uses the key object, it can be garbage-collected, along with its entry.
  - q: Why can't you loop over a WeakMap?
    a: Its entries can disappear at any time when garbage collection runs, so it has no size, keys() or forEach.
  - q: What is the time complexity of set.has(x) vs array.includes(x)?
    a: set.has is O(1) on average. array.includes is O(n), because it may check every item.
---

## 💡 What is it?

JavaScript has four special collections:

- **Set**: a list of **unique** values. No duplicates are allowed.
- **Map**: a list of **key → value** pairs. The key can be anything, even an object.
- **WeakSet** and **WeakMap**: like Set and Map, but the keys must be **objects**. They let unused objects be cleaned from memory.

They are faster and clearer than arrays and plain objects for many jobs.

## 🏠 Real-life example

- **Set = the school attendance register for today.** Each student is marked present **once**. Marking Asha twice doesn't add a second Asha.
- **Map = a locker list.** Locker number → the student who owns it. You look up a locker and get the owner. The locker "key" could be a number, a name, anything.
- **WeakMap = sticky notes on library books.** You stick a note ("returned late") on a book. If the book is thrown away, the note goes with it. You never need to clean up the notes yourself.

## 🧑‍💻 Code example

Save this as `collections.js`. Run it with `node collections.js` (Node 22 or newer).

```js
const skills = new Set(['node', 'react', 'node', 'mongo']); // a Set keeps each value only once
console.log(skills.size);                                  // 3 → the second 'node' was ignored
console.log(skills.has('react'));                          // true → checking is very fast (O(1))
console.log([...skills]);                                  // turn the Set back into an array

const jobNeeds = new Set(['node', 'aws']);                 // skills a job needs
console.log([...skills.intersection(jobNeeds)]);           // skills in BOTH sets → ['node']

const appliedCount = new Map();                            // a Map stores key → value pairs
appliedCount.set('job-1', 5);                              // key 'job-1' → value 5
appliedCount.set(42, 'number keys work');                  // keys can be any type, not only strings
console.log(appliedCount.get('job-1'));                    // 5
console.log(appliedCount.size);                            // 2 → how many pairs
for (const [key, value] of appliedCount) {                 // a Map remembers insertion order
  console.log(key, '→', value);                            // print each pair
}                                                          // end of loop

const cache = new WeakMap();                               // keys must be objects; doesn't stop garbage collection
let candidate = { name: 'Asha' };                          // an object we use as a key
cache.set(candidate, { score: 87 });                       // attach extra data to that object
console.log(cache.get(candidate).score);                   // 87
candidate = null;                                          // nothing else points to the object now → it can be freed, and its cache entry with it
```

**Output:**

```text
3
true
[ 'node', 'react', 'mongo' ]
[ 'node' ]
5
2
job-1 → 5
42 → number keys work
87
```

## 🔍 Deeper version

**Set methods:** `add(v)`, `has(v)`, `delete(v)`, `clear()`, `size`, and you can loop with `for...of`. Sets compare values with "SameValueZero". That is almost `===`, except `NaN` equals `NaN`. **Objects are compared by reference**, so two `{ id: 1 }` objects are two different values.

:::version[Version note]
**ES2025** added set maths methods: `union`, `intersection`, `difference`, `symmetricDifference`, `isSubsetOf`, `isSupersetOf` and `isDisjointFrom`. They work in current browsers and Node 22+. In older code you'll see `a.filter(x => setB.has(x))` instead.
:::

**Map vs plain object:**

| | Map | Object |
|---|---|---|
| Key types | anything (objects, numbers, functions) | strings and symbols only (numbers become strings) |
| Order | insertion order, always | mostly insertion order, but integer-like keys go first |
| Size | `map.size` | `Object.keys(obj).length` |
| Adding/removing often | built and optimised for it | slower for many deletes |
| JSON | not directly (`Object.fromEntries(map)` first) | works with `JSON.stringify` |
| Hidden keys | none | inherited ones like `toString` can clash |

**Rule of thumb:** use an **object** for a fixed shape, like a record or a JSON payload. Use a **Map** for a dictionary that grows and shrinks at runtime: caches, counters, lookups by id.

**Counting with a Map** (a common interview pattern):

```js
const count = new Map();                                // word → how many times
for (const w of ['a', 'b', 'a']) {                      // loop over the words
  count.set(w, (count.get(w) ?? 0) + 1);                // start at 0 if missing, then add 1
}                                                       // end of loop
console.log(count);                                     // Map(2) { 'a' => 2, 'b' => 1 }
```

**WeakMap and WeakSet.** Their keys must be objects. They hold keys **weakly**: the entry doesn't keep the object alive. When nothing else points to the key object, [garbage collection](glossary:garbage-collection) can remove both the object and its entry. Because entries can vanish at any time, you **can't loop** over them, and there's **no `size`**.

Uses:
- Extra data for objects you don't own, like DOM nodes, without causing a [memory leak](glossary:memory-leak).
- Caching results per object (memoization).
- Private data for class instances (though `#private` fields now do this more simply).

**Big O.** `set.has`, `map.get` and `map.set` are **O(1)** on average. `array.includes` and `array.indexOf` are **O(n)**. Inside a loop, that's the difference between O(n) and O(n²). This is why DSA solutions use Sets and Maps so much.

## 🎯 Why do we use it?

- **Remove duplicates** in one line: `[...new Set(arr)]`.
- **Fast lookups.** "Have I seen this before?" in O(1), which makes many algorithms much faster.
- **Safe dictionaries** with any key type and no clashes with built-in object keys.
- **Memory-safe caches** with WeakMap, which don't keep old objects alive.

## ⚠️ Common mistakes

- **Using `map[key] = value` on a Map.** That sets a normal property, not a Map entry. Use `map.set(key, value)`.
- **Expecting a Set to remove duplicate objects** that look the same. `{ id: 1 }` and `{ id: 1 }` are different references.
- **Calling `JSON.stringify(map)`.** It gives `{}`. Convert first with `Object.fromEntries(map)`.
- **Using a Map as a cache with no limit.** It grows forever and leaks memory. Add a size limit, or use a WeakMap when the keys are objects.

## 🗣️ How to answer in an interview

> "A Set stores unique values. I use it to remove duplicates with [...new Set(arr)] and for fast membership checks, because has() is O(1) on average, while array.includes is O(n). A Map stores key-value pairs where the key can be any type. It keeps insertion order and has a size property, so I prefer it over a plain object for dictionaries that change at runtime, like counters or caches by id.
>
> WeakMap and WeakSet only accept objects as keys, and they hold them weakly. If nothing else references the key object, it can be garbage-collected along with the entry. That makes them good for attaching metadata to objects without memory leaks. The trade-off is that you can't iterate them or get their size."

## 🔁 Follow-up questions

### When would you choose an object over a Map?

For a fixed set of fields, like a user record or an API payload, because objects work directly with JSON and destructuring. For dynamic keys, non-string keys, frequent add/delete, or when you need `.size`, choose a Map.

### How do you convert between Map and object?

`Object.fromEntries(map)` turns a Map into an object. `new Map(Object.entries(obj))` turns an object into a Map.

### Why don't WeakMaps have a size or forEach?

Garbage collection can remove entries at any moment. The engine can't give a stable count or list. So the API only allows `get`, `set`, `has` and `delete` with a key you already hold.

### How would you find the common items in two arrays efficiently?

Put one array in a Set, then filter the other: `a.filter(x => setB.has(x))`. That's O(n + m). In modern JavaScript you can also use `setA.intersection(setB)`.

## ✅ Quick check

### 1. What does this print?

```js
const s = new Set([1, 2, 2, 3, 3, 3]);   // a Set from an array with repeats
console.log(s.size);                      // ?
```

:::answer
**3.** A Set keeps each value once: 1, 2 and 3.
:::

### 2. What does this print?

```js
const s = new Set();                      // an empty Set
s.add({ id: 1 });                         // add one object
s.add({ id: 1 });                         // add another object that looks the same
console.log(s.size);                      // ?
```

:::answer
**2.** The two objects look the same, but they are different references in memory. A Set compares objects by reference.
:::

### 3. Which one lets the key object be garbage-collected when nothing else uses it?

- A) Map
- B) WeakMap

:::answer
**B) WeakMap.** A Map holds its keys strongly, so the object stays in memory as long as it's in the Map.
:::
