---
title: Find duplicate values
stack: dsa
order: 15
level: Basic
mustKnow: false
askedFrequency: common
summary:
  - "Return the values that appear more than once, each listed one time."
  - "Way 1: filter with indexOf !== i, then a Set. Short, but O(n²)."
  - "Way 2: two Sets, seen and dupes. One pass, O(n) time."
  - "No-built-ins way: a count object, and record a value when its count reaches exactly 2."
  - "Related LeetCode: \"Contains Duplicate\" (just true/false) — return as soon as you see a repeat."
cards:
  - q: How do you find duplicate values in O(n)?
    a: Keep a seen Set and a dupes Set. For each value, if it is already in seen, add it to dupes; otherwise add it to seen.
  - q: Why use a Set for dupes instead of an array?
    a: A value that appears 3 times would be added twice to an array. A Set keeps each duplicate once.
  - q: What is the complexity of filter + indexOf?
    a: O(n²), because indexOf scans from the start for every item.
  - q: How do you only answer "does it contain a duplicate?"
    a: Loop with a Set and return true the first time set.has(x) is true. Or compare new Set(arr).size with arr.length.
  - q: In the counting version, why record when the count is exactly 2?
    a: That records each duplicate once, the moment it first repeats. Counts of 3 or more don't add it again.
---

## 💡 What is it?

Return the values that appear **more than once**. List each repeated value **one time**.

| Input | Output |
|---|---|
| `[1, 2, 3, 2, 4, 1]` | `[2, 1]` |
| `[5, 5, 5]` | `[5]` |
| `[1, 2, 3]` | `[]` |

The output order here is "the order in which values first repeat".

## 🏠 Real-life example

Think of a **library checking returned books** by their ID.

A helper has two trays:
- **"Seen" tray**: every book ID that came back today.
- **"Problem" tray**: IDs that came back more than once, which means a copying mistake.

For each book, the helper asks: "Is this ID already in the seen tray?" If yes, its ID goes to the problem tray. If no, it goes to the seen tray.

- **Book IDs** = array values.
- **Seen tray** = `seen` Set.
- **Problem tray** = `dupes` Set. A tray holds each ID once, even if a book came back three times.

## 🧑‍💻 Code example

Save as `find-duplicates.js` and run `node find-duplicates.js`.

```js
const arr = [1, 2, 3, 2, 4, 1];                                  // 1 and 2 appear twice

// Way 1 — array methods (short, but O(n²))
const dupesM = [...new Set(arr.filter((x, i) => arr.indexOf(x) !== i))]; // seen earlier → it's a repeat

// Way 2 — one loop with two Sets (O(n))
function findDuplicates(list) {                                  // list = the numbers
  const seen = new Set();                                        // everything we have met so far
  const dupes = new Set();                                       // values we met more than once
  for (const x of list) {                                        // visit each number once
    if (seen.has(x)) dupes.add(x);                               // met before → it's a duplicate
    else seen.add(x);                                            // first time → remember it
  }                                                              // end of the loop
  return [...dupes];                                             // turn the Set into an array
}                                                                // end of findDuplicates

// Way 3 — plain loops only (no Set, no methods)
function findDuplicatesLoop(list) {                              // same input
  const count = {};                                              // tally of each value
  const result = [];                                             // the duplicates we find
  for (let i = 0; i < list.length; i++) {                        // walk through the list
    count[list[i]] = (count[list[i]] || 0) + 1;                  // add 1 to this value's tally
    if (count[list[i]] === 2) result[result.length] = list[i];   // exactly the 2nd time → record it once
  }                                                              // end of the loop
  return result;                                                 // duplicates in the order they repeat
}                                                                // end of findDuplicatesLoop

console.log(dupesM);                                             // [ 2, 1 ]
console.log(findDuplicates(arr));                                // [ 2, 1 ]
console.log(findDuplicatesLoop(arr));                            // [ 2, 1 ]
```

**Output:**

```text
[ 2, 1 ]
[ 2, 1 ]
[ 2, 1 ]
```

## 🔍 Deeper version

**Complexity:**

| Way | Time | Space |
|---|---|---|
| filter + indexOf + Set | O(n²) | O(n) |
| two Sets | **O(n)** | O(n) |
| count object | O(n) | O(n) |
| sort, then compare neighbours | O(n log n) | O(1)–O(n) |

**Dry run** of Way 2 on `[1, 2, 3, 2, 4, 1]`:

| x | in seen? | seen | dupes |
|---|---|---|---|
| 1 | no | {1} | {} |
| 2 | no | {1,2} | {} |
| 3 | no | {1,2,3} | {} |
| 2 | **yes** | {1,2,3} | {2} |
| 4 | no | {1,2,3,4} | {2} |
| 1 | **yes** | {1,2,3,4} | {2,1} |

**Sort first (low memory):** sort a copy, then any duplicates sit next to each other. Compare `a[i] === a[i - 1]`. Good when memory matters more than time.

**Values in range 1..n:** a trick (LeetCode "Find All Duplicates in an Array") marks visited values by making `arr[value - 1]` negative. O(n) time and O(1) extra space, but it changes the input.

**Just yes/no:** `new Set(arr).size !== arr.length` is one line. A loop that returns early can stop sooner on big data.

## 🎯 Why do we use it?

- **Data validation.** For example, the same email used twice in a bulk candidate upload.
- **Finding repeated events,** like a webhook delivered twice. See [duplicate webhook events](topic:debugging/duplicate-webhook-events).
- **Cleaning imports** before saving to a database with a unique index.

## ⚠️ Common mistakes

- **Pushing to an array every time a value repeats.** A value seen 3 times then appears twice in the result.
- **Using `includes` inside a loop.** That's a hidden O(n²).
- **Forgetting that object keys become strings.** `1` and `'1'` are counted together. Use a Set or Map to keep types apart.
- **Sorting the original array** when the caller still needs it unchanged. Copy it first: `[...arr].sort(...)`.

## 🗣️ How to answer in an interview

> "Should each duplicate appear once in the output, and does the order matter? Okay.
>
> The short version is filter with indexOf, but indexOf is a hidden loop, so it's O(n²).
>
> I'll use two Sets: `seen` and `dupes`. For each value, if it's already in `seen`, it's a duplicate, so I add it to `dupes`. Otherwise I add it to `seen`. Using a Set for dupes means each value is reported once. That's O(n) time and O(n) space.
>
> If memory is tight, I could sort a copy and compare neighbours, which is O(n log n)."

## 🔁 Follow-up questions

### Return true if any duplicate exists (Contains Duplicate).

Loop with a Set and return `true` the first time `set.has(x)` is true. Return `false` after the loop.

### Find duplicates within k positions of each other.

Keep a sliding window Set of the last k values. Add the new value, and remove the value that falls out of the window.

### Find duplicate objects by email.

Use a Set of `email.toLowerCase()`, and compare by that key instead of the whole object.

### Return each duplicate with how many times it appears.

Count with a Map, then keep the entries whose count is greater than 1.

## ✅ Quick check

### 1. What does `findDuplicates([7, 7, 7])` return?

:::answer
**`[7]`.** The second and third 7 both try to add 7 to `dupes`, but a Set keeps it only once.
:::

### 2. What does `new Set([1, 2, 2]).size !== 3` tell you?

:::answer
**`true`, so there is a duplicate.** The Set has size 2, which is less than the array length 3.
:::
