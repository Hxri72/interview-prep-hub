---
title: Remove duplicates
stack: dsa
order: 10
level: Basic
mustKnow: true
askedFrequency: very common
summary:
  - "Best way: [...new Set(arr)]. A Set keeps only unique values. O(n) time."
  - "filter + indexOf also works, but indexOf is a hidden loop, so it is O(n²)."
  - "Without built-ins: loop over the input and add each item only if it is not already in the result."
  - Both keep the order of first appearance.
  - "Set compares with ===, so {} and {} are different objects and both stay."
cards:
  - q: What is the fastest way to remove duplicates in JavaScript?
    a: "[...new Set(arr)]. A Set stores each value once, and checking or adding is O(1), so the whole thing is O(n)."
  - q: Why is arr.filter((x, i) => arr.indexOf(x) === i) slow on big arrays?
    a: indexOf scans the array from the start each time. That is a loop inside a loop, so O(n²).
  - q: Does new Set keep the original order?
    a: Yes. A Set remembers insertion order, so values appear in the order they were first seen.
  - q: How would you remove duplicates without Set or array methods?
    a: Build a result array. For each item, loop over the result to see if it is already there. Add it only if not found. This is O(n²).
  - q: Does Set remove duplicate objects like {id:1} and {id:1}?
    a: No. They are two different objects, so === says they are different. Use a Map keyed by id instead.
---

## 💡 What is it?

You get an array. Return a new array with each value **only once**. Keep the order in which values first appear.

| Input | Output |
|---|---|
| `[1, 2, 2, 3, 1]` | `[1, 2, 3]` |
| `['a', 'a']` | `['a']` |
| `[]` | `[]` |

## 🏠 Real-life example

Think of a **class attendance sheet**.

Some students sign twice by mistake. The teacher makes a clean list. For each name on the sheet, the teacher checks: "Is this name already on my clean list?" If not, write it down.

- The **messy sheet** = the input array.
- The **clean list** = the result.
- **"Is it already there?"** = the check: `Set.has` (fast) or a search loop (slow).
- **Writing names in order** = keeping the order of first appearance.

A Set is like a clean list with a magic index. You know instantly whether a name is on it.

## 🧑‍💻 Code example

Save as `remove-duplicates.js` and run `node remove-duplicates.js`.

```js
const arr = [1, 2, 2, 3, 1];                              // our input; 1 and 2 appear twice

// Way 1 — array methods
const uniqueSet = [...new Set(arr)];                      // a Set keeps only unique values; spread turns it back into an array
const uniqueFilter = arr.filter((x, i) => arr.indexOf(x) === i); // keep x only at the FIRST place it appears

// Way 2 — plain loops (no Set, no methods)
function removeDuplicates(list) {                         // list = the array with repeats
  const result = [];                                      // result starts empty
  for (let i = 0; i < list.length; i++) {                 // look at every item
    let found = false;                                    // assume we haven't seen it yet
    for (let j = 0; j < result.length; j++) {             // search the result so far
      if (result[j] === list[i]) { found = true; break; } // already there → stop searching
    }                                                     // end of the inner search
    if (!found) result[result.length] = list[i];          // new value → add it at the end (same as push)
  }                                                       // end of the outer loop
  return result;                                          // the list without repeats
}                                                         // end of removeDuplicates

console.log(uniqueSet);                                   // [ 1, 2, 3 ]
console.log(uniqueFilter);                                // [ 1, 2, 3 ]
console.log(removeDuplicates(arr));                       // [ 1, 2, 3 ]
```

**Output:**

```text
[ 1, 2, 3 ]
[ 1, 2, 3 ]
[ 1, 2, 3 ]
```

## 🔍 Deeper version

**Complexity:**

| Way | Time | Space | Why |
|---|---|---|---|
| `[...new Set(arr)]` | **O(n)** | O(n) | each add/check in a Set is O(1) |
| `filter` + `indexOf` | O(n²) | O(n) | `indexOf` is a hidden loop |
| two plain loops | O(n²) | O(n) | inner loop searches the result |
| plain loop + object "seen" map | O(n) | O(n) | best you can do without `Set` |

**Dry run** of the loop version on `[1, 2, 2, 3, 1]`:

| item | in result? | result after |
|---|---|---|
| 1 | no | `[1]` |
| 2 | no | `[1, 2]` |
| 2 | yes | `[1, 2]` |
| 3 | no | `[1, 2, 3]` |
| 1 | yes | `[1, 2, 3]` |

**O(n) without Set:** use an object as a "seen" table: `if (!seen[x]) { seen[x] = true; result.push(x); }`. Careful: object keys become strings, so `1` and `'1'` count as the same value. A `Set` or `Map` keeps the real type.

**Sorted input?** Use two pointers in place (LeetCode "Remove Duplicates from Sorted Array"). Keep a write index, and copy a value only when it differs from the last written one. O(n) time, O(1) space.

**Objects:** dedupe by a key, for example `[...new Map(users.map(u => [u.id, u])).values()]`. That keeps the **last** user for each id.

## 🎯 Why do we use it?

- **Tags and skills.** A candidate's skills list should not show "React" twice.
- **Merging data from two sources.** For example, candidates pulled from two places.
- **Unique dropdown options.** For example, the list of cities from all jobs.

## ⚠️ Common mistakes

- **Using `filter` + `indexOf` on huge arrays.** It looks short, but it is O(n²).
- **Expecting Set to dedupe objects.** Two objects with the same content are still different.
- **Forgetting about `'1'` vs `1`** when using a plain object as the "seen" table.
- **Changing the original array by mistake** with `splice` inside a loop. It shifts indexes and skips items.

## 🗣️ How to answer in an interview

> "Can the values be objects, or just numbers and strings? And should I keep the first-appearance order? Okay.
>
> The simple way is two loops: for each item, search the result, and add it if it's missing. That's O(n²).
>
> To improve it, I remember what I've seen in a Set, so each check is O(1). In JavaScript that's simply `[...new Set(arr)]`. That's O(n) time and O(n) space, and it keeps the order.
>
> If you'd like it without Set, I can use an object as a seen-table, keeping in mind that its keys become strings."

## 🔁 Follow-up questions

### Remove duplicates in place from a sorted array.

Two pointers. `write` starts at 1. For each `i` from 1, if `arr[i] !== arr[write - 1]`, copy it to `arr[write]` and move `write`. The first `write` items are the unique ones. O(n) time, O(1) space.

### Keep only values that appear exactly once.

Count first with a Map, then filter values with count 1. See [frequency count](topic:dsa/frequency-count).

### Remove duplicate objects by id.

Use a Map keyed by id, or a `seen` Set of ids: keep an object only if its id is not yet in the Set.

### Is the Set version stable (keeps order)?

Yes. Sets keep insertion order, so the first appearance wins.

## ✅ Quick check

### 1. What does `[...new Set([3, '3', 3])]` return?

:::answer
**`[3, '3']`.** A Set compares with `===`. The number 3 and the string `'3'` are different values.
:::

### 2. What is the time complexity of `arr.filter((x, i) => arr.indexOf(x) === i)`?

- A) O(n)
- B) O(n log n)
- C) O(n²)

:::answer
**C) O(n²).** `filter` is one loop, and `indexOf` inside it is another loop.
:::
