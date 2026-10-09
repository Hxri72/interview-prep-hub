---
title: Intersection of two arrays
stack: dsa
order: 20
level: Intermediate
mustKnow: false
askedFrequency: common
summary:
  - "Intersection = the values that appear in BOTH arrays: [1, 2, 2, 3, 5] and [2, 2, 3, 4] → [2, 3]."
  - "Way 1: put one array in a Set, filter the other with set.has, then remove repeats with a second Set."
  - "Way 2: a plain object as a lookup table — two separate loops, O(n + m)."
  - "Avoid a.filter(x => b.includes(x)) on big arrays: includes is a hidden loop, so it becomes O(n × m)."
  - "Ask first: should repeats count? \"Unique values\" and \"keep counts\" (LeetCode 349 vs 350) are different problems."
cards:
  - q: Why is a.filter(x => b.includes(x)) slow?
    a: includes walks through b every time, so it's a loop inside a loop — O(n × m). A Set lookup is O(1), making the whole thing O(n + m).
  - q: How do you return each common value only once?
    a: Wrap the result in a Set (or keep an "added" object) so the same value isn't added twice.
  - q: What changes if repeats must be kept (like LeetCode 350)?
    a: Count how many times each value appears in one array, then for each value in the other array, take it if the count is above 0 and subtract 1.
  - q: Which modern built-in does this for Sets?
    a: "Set.prototype.intersection (ES2025): new Set(a).intersection(new Set(b))."
  - q: What if both arrays are sorted?
    a: Use two pointers. Move the pointer with the smaller value; when both values are equal, record it and move both. O(n + m) time, O(1) extra space.
---

## 💡 What is it?

Find the values that are in **both** arrays. Each common value appears **once** in the answer.

```text
Input:  a = [1, 2, 2, 3, 5], b = [2, 2, 3, 4]
Output: [2, 3]
```

## 🏠 Real-life example

Think of **two friends making birthday party guest lists**.

You want to know which classmates are on **both** lists. You stick your friend's list on the wall. Then you read your own list, name by name, and check the wall.

- **Your list** = array `a`.
- **Your friend's list on the wall** = array `b` stored in a [Set](topic:dsa/set-map) (quick to check).
- **"Is this name on the wall?"** = `set.has(name)`, an instant check.
- **Ticking a name so you don't write it twice** = removing repeats.
- **The final list of common friends** = the result.

## 🧑‍💻 Code example

Save as `intersect.js` and run `node intersect.js`.

```js
const a = [1, 2, 2, 3, 5];                                // first list (has a repeat: 2)
const b = [2, 2, 3, 4];                                   // second list

// Way 1 — array methods + Set
const inB = new Set(b);                                   // Set = fast "is it inside?" checks
const way1 = [...new Set(a.filter((x) => inB.has(x)))];   // keep a's items found in b, then remove repeats
console.log('Way 1:', way1);                              // print the result

// Way 2 — plain loops with an object as a lookup table
function intersection(a, b) {                             // common values, each only once
  const seen = {};                                        // seen[value] = true if value is in b
  for (let i = 0; i < b.length; i++) {                    // walk through b once
    seen[b[i]] = true;                                    // remember each value of b
  }                                                       // end of first loop
  const result = [];                                      // answers go here
  const added = {};                                       // added[value] = true once we used it
  for (let i = 0; i < a.length; i++) {                    // walk through a once
    const x = a[i];                                       // current value from a
    if (seen[x] && !added[x]) {                           // in b AND not added yet?
      result[result.length] = x;                          // add it to the answer
      added[x] = true;                                    // mark it, so no repeats
    }                                                     // end of if
  }                                                       // end of second loop
  return result;                                          // the common values
}                                                         // end of intersection

console.log('Way 2:', intersection(a, b));                // print the loop result
console.log('Edge:', intersection([], [1]), intersection([7], [8])); // empty, nothing in common
```

**Output (real run):**

```text
Way 1: [ 2, 3 ]
Way 2: [ 2, 3 ]
Edge: [] []
```

## 🔍 Deeper version

**Complexity (n = length of a, m = length of b):**

| Way | Time | Extra space |
|---|---|---|
| `a.filter(x => b.includes(x))` | **O(n × m)** — hidden loop | O(n) |
| Set + filter (Way 1) | O(n + m) | O(m) for the Set |
| Lookup object (Way 2) | O(n + m) | O(m) |
| Two pointers (sorted input) | O(n + m) | O(1) extra |

The key idea is the [hash map / Set pattern](topic:dsa/pattern-hash-map): build a lookup once, then each check is **O(1)**.

**Dry run of Way 2** with `a = [1, 2, 2, 3, 5]`, `seen = {2, 3, 4}`:

| x | In b? | Already added? | result |
|---|---|---|---|
| 1 | no | — | `[]` |
| 2 | yes | no | `[2]` |
| 2 | yes | **yes** → skip | `[2]` |
| 3 | yes | no | `[2, 3]` |
| 5 | no | — | `[2, 3]` |

**Object keys become strings.** In Way 2, `seen[1]` and `seen['1']` are the same key. If the arrays can mix numbers and number-like strings, use a `Map` or `Set` instead. Both keep the real type.

**When repeats should count** (LeetCode 350, "Intersection of Two Arrays II"): `[1, 2, 2, 1]` and `[2, 2]` → `[2, 2]`. Count each value of `a` in a Map. For each value in `b`, if the count is above 0, push it and subtract 1.

:::version[Version note]
**ES2025** added Set methods: `new Set(a).intersection(new Set(b))` returns a Set of common values. Spread it to get an array: `[...setA.intersection(setB)]`. They work in Node 22+ and current browsers. Interviewers may still ask you to write it yourself.
:::

## 🎯 Why do we use it?

- Finding common items is everywhere: candidates who match **both** filters, skills a candidate has that the job needs, users in two groups.
- It's the best small example of turning **O(n × m)** into **O(n + m)** with a Set.
- It trains you to ask about duplicates before coding.

## ⚠️ Common mistakes

- **Using `includes` inside `filter`** and calling it O(n). It's O(n × m).
- **Returning duplicates** when the question wants unique values (or the other way round).
- **Using a plain object with mixed types**, where `1` and `'1'` become the same key.
- **Forgetting the empty-array case.** It should return `[]`, not crash.

## 🗣️ How to answer in an interview

> "I need values found in both arrays. Should each value appear once, or as many times as it appears in both? I'll assume once.
>
> The simple way is `a.filter(x => b.includes(x))`. But `includes` is a hidden loop, so that's O(n × m).
>
> Better: put `b` into a Set. Then I filter `a` with `set.has`, which is O(1), and wrap the result in another Set to remove repeats. Total O(n + m) time and O(m) extra space.
>
> If both arrays were already sorted, I could use two pointers with O(1) extra space. Let me dry-run `[1, 2, 2, 3, 5]` and `[2, 2, 3, 4]`… I get `[2, 3]`."

## 🔁 Follow-up questions

### What if one array is huge and the other is tiny?

Build the Set from the **smaller** array and loop over the bigger one. The extra memory is then only the size of the small array.

### What if the arrays are too big to fit in memory?

Sort both on disk (or stream them sorted), then use the two-pointer merge idea to find common values while reading.

### How would you find the union or the difference?

Union: `[...new Set([...a, ...b])]`. Difference (in `a` but not `b`): `a.filter(x => !setB.has(x))`. ES2025 also has `union()` and `difference()` on Sets.

### How do you find the intersection of three or more arrays?

Count how many arrays each value appears in, counting each value once per array. Keep values whose count equals the number of arrays.

## ✅ Quick check

### 1. What does this print?

```js
console.log([1, 1, 2].filter((x) => [1].includes(x))); // filter with includes
```

:::answer
**`[1, 1]`**. `filter` keeps **every** matching item, so the repeat stays. To get unique values, wrap it in a Set: `[...new Set(...)]`.
:::

### 2. What is the time complexity of `a.filter(x => b.includes(x))`?

- A) O(n)
- B) O(n + m)
- C) O(n × m)

:::answer
**C.** For each of the n items, `includes` may scan all m items of `b`.
:::

### 3. Why is a Set lookup faster than `includes`?

:::answer
A Set stores values in a hash table, so `has` jumps straight to the right place: **O(1)** on average. `includes` checks items one by one: **O(m)**.
:::
