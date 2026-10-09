---
title: Chunk an array into groups of k
stack: dsa
order: 17
level: Basic
mustKnow: false
askedFrequency: common
summary:
  - "Split an array into smaller arrays of size k. The last group can be smaller."
  - "Way 1: Array.from with length Math.ceil(n / k) and slice(i * k, i * k + k)."
  - "Way 2: fill a current group in a loop; when it reaches k, save it and start a new one."
  - "O(n) time and O(n) space. Every item is copied once."
  - "Used for pagination, batching API calls and showing items in rows."
cards:
  - q: How do you split an array into chunks of size k?
    a: "Loop with i += k and push arr.slice(i, i + k). Or Array.from({ length: Math.ceil(n / k) }, (_, i) => arr.slice(i * k, i * k + k))."
  - q: How many chunks are there for 5 items and k = 2?
    a: "Math.ceil(5 / 2) = 3: [1, 2], [3, 4], [5]."
  - q: What happens to the leftover items?
    a: They form a last, smaller chunk. Don't forget to push it after the loop in the plain-loop version.
  - q: What should happen when k is 0 or negative?
    a: That would loop forever or make no sense. Validate k first and throw an error.
  - q: Where is chunking used in real backend work?
    a: Batching database writes or API calls, for example inserting 10,000 records 500 at a time.
---

## 💡 What is it?

Split an array into **smaller arrays of size k**. The last group gets whatever is left.

| Input | k | Output |
|---|---|---|
| `[1, 2, 3, 4, 5]` | 2 | `[[1, 2], [3, 4], [5]]` |
| `[1, 2, 3, 4]` | 2 | `[[1, 2], [3, 4]]` |
| `[]` | 3 | `[]` |

## 🏠 Real-life example

Think of **making teams for a school game**.

There are 5 students and each team can have 2 players. The teacher walks down the line and puts students into a team. When a team is full, it goes out to play, and a new empty team starts. The last student forms a smaller team of 1.

- **Students in line** = array items.
- **Team size** = `k`.
- **The team being filled** = `current`.
- **"Team is full, send it out"** = `if (current.length === size)` then save it.
- **The last small team** = the leftover chunk.

## 🧑‍💻 Code example

Save as `chunk.js` and run `node chunk.js`.

```js
const arr = [1, 2, 3, 4, 5];                                         // 5 items
const k = 2;                                                         // group size

// Way 1 — Array.from + slice
const chunksM = Array.from(                                          // make a new array of groups
  { length: Math.ceil(arr.length / k) },                             // how many groups: ceil(5 / 2) = 3
  (_, i) => arr.slice(i * k, i * k + k),                             // group i = items from i*k up to (not including) i*k+k
);                                                                   // end of Array.from

// Way 2 — plain loops (no slice)
function chunk(list, size) {                                         // list = items, size = group size
  const result = [];                                                 // all groups go here
  let current = [];                                                  // the group we are filling now
  for (let i = 0; i < list.length; i++) {                            // visit each item
    current[current.length] = list[i];                               // add it to the current group
    if (current.length === size) {                                   // group is full
      result[result.length] = current;                               // save the full group
      current = [];                                                  // start a new empty group
    }                                                                // end of the if
  }                                                                  // end of the loop
  if (current.length) result[result.length] = current;               // keep the last, smaller group
  return result;                                                     // all the groups
}                                                                    // end of chunk

console.log(chunksM);                                                // [ [ 1, 2 ], [ 3, 4 ], [ 5 ] ]
console.log(chunk(arr, k));                                          // [ [ 1, 2 ], [ 3, 4 ], [ 5 ] ]
console.log(chunk([], 3));                                           // [] → nothing to group
```

**Output:**

```text
[ [ 1, 2 ], [ 3, 4 ], [ 5 ] ]
[ [ 1, 2 ], [ 3, 4 ], [ 5 ] ]
[]
```

## 🔍 Deeper version

**Complexity:** both ways are **O(n) time**, since each item is copied once. They use **O(n) space** for the new arrays.

**Another common way:** jump by k and slice.

```js
for (let i = 0; i < arr.length; i += k) result.push(arr.slice(i, i + k)); // i jumps 0, 2, 4…; slice takes the next k items
```

**Dry run** of Way 2 with `[1, 2, 3, 4, 5]`, size 2:

| item | current | result |
|---|---|---|
| 1 | [1] | [] |
| 2 | [1, 2] → full | [[1, 2]] |
| 3 | [3] | [[1, 2]] |
| 4 | [3, 4] → full | [[1, 2], [3, 4]] |
| 5 | [5] | [[1, 2], [3, 4]] |
| after loop | — | [[1, 2], [3, 4], **[5]**] |

**Number of chunks** = `Math.ceil(n / k)`. 5 / 2 = 2.5, which rounds up to 3.

**Edge cases:**
- `k <= 0` → a loop with `i += k` never ends. Throw an error.
- `k` not a whole number → round it or reject it.
- `k >= n` → one chunk with everything.
- An empty array → `[]`.

**Lazy chunking:** for huge data or streams, use a generator that `yield`s one chunk at a time, so you never hold all chunks in memory.

## 🎯 Why do we use it?

- **Batching.** Insert 10,000 rows 500 at a time with `insertMany`, or send emails in small groups to respect rate limits.
- **Parallel work with limits.** Process API calls in batches with `Promise.all` on each chunk.
- **UI layout.** Show cards 3 per row, or split results into pages.

## ⚠️ Common mistakes

- **Forgetting the last, smaller chunk** in the loop version.
- **Not validating k.** `k = 0` causes an infinite loop.
- **Using `splice` on the original array.** It empties the caller's data. `slice` does not change the original.
- **Off-by-one in slice.** `slice(start, end)` does not include `end`, so it's `slice(i, i + k)`.

## 🗣️ How to answer in an interview

> "What should happen to leftover items? I'll put them in a smaller last group. And I'll throw an error if k isn't a positive whole number.
>
> The method way is `Array.from` with `Math.ceil(n / k)` groups, each made with slice. Or a loop that jumps by k and slices.
>
> Without built-ins, I fill a `current` group. When it reaches size k, I push it to the result and start a new one. After the loop, I push whatever is left.
>
> It's O(n) time and O(n) space. In real code I use this to batch database writes or API calls."

## 🔁 Follow-up questions

### Split into exactly k groups (as even as possible) instead of groups of size k.

Group size = `Math.ceil(n / k)`. Or give the first `n % k` groups one extra item, so sizes differ by at most 1.

### Process API calls 5 at a time.

Chunk the list into groups of 5. Then `for (const group of chunks) await Promise.all(group.map(callApi));`

### Chunk a string into pieces of 3 characters.

The same loop with `str.slice(i, i + 3)`, or the regex `str.match(/.{1,3}/g)`.

### What if the data is too big to hold in memory?

Read it as a stream, and emit a chunk whenever `current` is full. Each chunk can be written and then forgotten.

## ✅ Quick check

### 1. How many chunks does `chunk([1, 2, 3, 4, 5, 6, 7], 3)` make?

:::answer
**3:** `[1, 2, 3]`, `[4, 5, 6]`, `[7]`. `Math.ceil(7 / 3)` is 3.
:::

### 2. What does `[1, 2, 3, 4].slice(2, 4)` return?

:::answer
**`[3, 4]`.** It starts at index 2 and stops before index 4.
:::
