---
title: Sorting algorithms overview (bubble, merge, quick)
stack: dsa
order: 40
level: Intermediate
mustKnow: false
askedFrequency: sometimes
summary:
  - "Bubble sort swaps neighbours until nothing is out of order: O(n²). Simple but slow."
  - "Merge sort splits in half, sorts each half and merges them: O(n log n) always, stable, needs O(n) extra space."
  - "Quick sort picks a pivot and splits into smaller and bigger: O(n log n) on average, O(n²) in the worst case."
  - "JavaScript's Array.prototype.sort is stable (since ES2019); V8 uses TimSort, a merge + insertion sort mix."
  - "Always pass a compare function for numbers: sort((a, b) => a - b)."
cards:
  - q: What is the time of bubble, merge and quick sort?
    a: "Bubble: O(n²). Merge: O(n log n) always. Quick: O(n log n) on average, O(n²) in the worst case."
  - q: What does "stable sort" mean?
    a: Items that compare as equal keep their original order. For example, two people with the same age stay in the order they were in.
  - q: Which algorithm does V8 use for Array.prototype.sort?
    a: TimSort, a mix of merge sort and insertion sort. It is stable, and stability is required by the spec since ES2019.
  - q: "What does [10, 1, 2].sort() return, and why?"
    a: "[1, 10, 2]. Without a compare function, sort compares items as text, and \"10\" comes before \"2\"."
  - q: When is quick sort slow?
    a: When the pivot is always the smallest or biggest item, for example a bad pivot choice on already-sorted data. Then each split removes only one item and it becomes O(n²).
---

## 💡 What is it?

A **sorting algorithm** puts items in order, like smallest to biggest.

Interviewers rarely ask you to write one from memory. But they *do* ask:
- how the common ones work,
- their speed (Big O),
- and what JavaScript's own `sort()` does.

This topic covers three: **bubble sort**, **merge sort** and **quick sort**.

## 🏠 Real-life example

Think of **sorting answer sheets by roll number** in a classroom.

- **Bubble sort:** walk along the pile, swapping any two neighbouring sheets that are in the wrong order. Repeat until no swaps are needed. Easy, but slow for a big pile.
- **Merge sort:** split the pile between two teachers, each sorts half, then they **merge** the two sorted piles by always taking the smaller top sheet.
- **Quick sort:** pick one sheet as the **middle mark** (pivot). Put smaller roll numbers on the left and bigger on the right, then sort each side the same way.

Mapping:
- **Sheets** = array items.
- **Swapping neighbours** = bubble sort's inner loop.
- **Two teachers** = merge sort's two halves (recursion).
- **Middle mark** = quick sort's pivot.

## 🧑‍💻 Code example

Save as `sorting.js`. Run `node sorting.js`.

```js
// Bubble sort — swap neighbours until nothing is out of order. O(n²)
function bubbleSort(input) {                           // input = array of numbers
  const a = [...input];                                // copy, so we don't change the original
  for (let end = a.length - 1; end > 0; end--) {       // after each pass, the biggest is at the end
    let swapped = false;                               // did this pass change anything?
    for (let i = 0; i < end; i++) {                    // compare each pair of neighbours
      if (a[i] > a[i + 1]) {                           // left is bigger → wrong order
        [a[i], a[i + 1]] = [a[i + 1], a[i]];           // swap them
        swapped = true;                                // remember we swapped
      }                                                // end of the compare
    }                                                  // end of one pass
    if (!swapped) break;                               // no swaps → already sorted, stop early
  }                                                    // end of all passes
  return a;                                            // the sorted copy
}                                                      // end of bubbleSort

// Merge sort — split in half, sort each half, merge them. O(n log n), stable
function mergeSort(a) {                                // a = array of numbers
  if (a.length <= 1) return a;                         // 0 or 1 item is already sorted
  const mid = Math.floor(a.length / 2);                // middle index
  const left = mergeSort(a.slice(0, mid));             // sort the left half (recursion)
  const right = mergeSort(a.slice(mid));               // sort the right half (recursion)
  const out = [];                                      // the merged result
  let i = 0, j = 0;                                    // one pointer per half
  while (i < left.length && j < right.length) {        // both halves still have items
    out.push(left[i] <= right[j] ? left[i++] : right[j++]); // take the smaller; <= keeps it stable
  }                                                    // end of the merge loop
  return [...out, ...left.slice(i), ...right.slice(j)]; // add whatever is left over
}                                                      // end of mergeSort

// Quick sort — pick a pivot, put smaller left and bigger right. O(n log n) average
function quickSort(a) {                                // a = array of numbers
  if (a.length <= 1) return a;                         // 0 or 1 item is already sorted
  const pivot = a[Math.floor(a.length / 2)];           // pick the middle item as the pivot
  const less = a.filter((x) => x < pivot);             // everything smaller than the pivot
  const equal = a.filter((x) => x === pivot);          // the pivot (and its copies)
  const more = a.filter((x) => x > pivot);             // everything bigger than the pivot
  return [...quickSort(less), ...equal, ...quickSort(more)]; // sort both sides and join
}                                                      // end of quickSort

const data = [5, 2, 9, 1, 5, 6];                       // test data with a duplicate 5
console.log(bubbleSort(data));                         // [1, 2, 5, 5, 6, 9]
console.log(mergeSort(data));                          // [1, 2, 5, 5, 6, 9]
console.log(quickSort(data));                          // [1, 2, 5, 5, 6, 9]
console.log([10, 1, 2].sort());                        // the trap: sorts as text → [1, 10, 2]
console.log([10, 1, 2].sort((x, y) => x - y));         // correct number sort → [1, 2, 10]
const people = [{ n: 'A', age: 30 }, { n: 'B', age: 25 }, { n: 'C', age: 30 }]; // two people aged 30
console.log(people.sort((p, q) => p.age - q.age).map((p) => p.n).join('')); // stable: A stays before C
```

**Output:**

```text
[ 1, 2, 5, 5, 6, 9 ]
[ 1, 2, 5, 5, 6, 9 ]
[ 1, 2, 5, 5, 6, 9 ]
[ 1, 10, 2 ]
[ 1, 2, 10 ]
BAC
```

The last line shows a **stable** sort: A and C are both 30, and A stays before C.

## 🔍 Deeper version

| Algorithm | Best | Average | Worst | Extra space | Stable? |
|---|---|---|---|---|---|
| Bubble | O(n) (already sorted, with the early stop) | O(n²) | O(n²) | O(1) | Yes |
| Insertion | O(n) | O(n²) | O(n²) | O(1) | Yes |
| Merge | O(n log n) | O(n log n) | O(n log n) | O(n) | Yes |
| Quick (in place) | O(n log n) | O(n log n) | O(n²) | O(log n) stack | No |
| TimSort (V8's `sort`) | O(n) | O(n log n) | O(n log n) | O(n) | Yes |

**Why merge sort is O(n log n).** You can halve an array about log n times. At each level, merging all the pieces touches n items. So it's n × log n.

**Quick sort's worst case.** If the pivot is always the smallest or biggest item, each step removes just one item, so you get n levels: O(n²). Picking the middle item or a random pivot makes this very unlikely. The version above uses `filter`, which is easy to read but uses O(n) extra space; the classic version partitions **in place**.

**JavaScript's `sort()`:**
- Since **ES2019**, the spec requires `Array.prototype.sort` to be **stable**.
- V8 (Chrome and Node) uses **TimSort**. It finds runs that are already sorted, uses insertion sort for small pieces, and merges runs. That's why it's fast on nearly-sorted data.
- With no compare function, items are **converted to strings** and compared as text.
- `sort()` changes the **original** array. Use `toSorted()` (ES2023) to get a sorted copy instead.

[Recursion](topic:dsa/recursion) and [Big O](topic:dsa/big-o) explain the ideas used here.

## 🎯 Why do we use it?

- Sorting is everywhere: leaderboards, lists by date, prices from low to high.
- Many problems become easier **after sorting**: [3Sum](topic:dsa/three-sum), merging intervals, finding duplicates.
- Knowing the trade-offs helps you answer "why is your solution O(n log n)?"

## ⚠️ Common mistakes

- **Calling `sort()` on numbers without a compare function.**
- **Forgetting that `sort()` changes the original array.**
- **Saying quick sort is always O(n log n).** Its worst case is O(n²).
- **Writing your own sort in production.** Use the built-in one; it's tested and fast.

## 🗣️ How to answer in an interview

> "Bubble sort swaps neighbouring items until nothing is out of order. It's O(n²), so it's only good for teaching.
>
> Merge sort splits the array in half, sorts each half, and merges them. It's always O(n log n) and stable, but it needs O(n) extra space.
>
> Quick sort picks a pivot and partitions into smaller and bigger items. It's O(n log n) on average and very fast in practice, but O(n²) in the worst case if the pivot is bad.
>
> In JavaScript I use the built-in sort, which in V8 is TimSort. It's stable since ES2019. For numbers, I always pass a compare function, like a minus b."

## 🔁 Follow-up questions

### What does "stable" mean, and why does it matter?

Equal items keep their original order. It matters when you sort by one field after another, for example by name and then by department. A stable sort keeps the names in order inside each department.

### Which sort would you use for a nearly-sorted array?

Insertion sort, or TimSort (which JavaScript already uses). Both are close to O(n) when data is nearly sorted.

### Can you sort in less than O(n log n)?

Not by comparing items. But special sorts like **counting sort** or **bucket sort** can be O(n) when the values are in a small, known range. [Top K frequent](topic:dsa/top-k-frequent) uses buckets this way.

### How do you sort objects by two fields?

```js
items.sort((a, b) => a.dept.localeCompare(b.dept) || a.name.localeCompare(b.name)); // dept first, then name
```

If the departments are equal, `localeCompare` returns 0, so the `||` moves on to compare names.

## ✅ Quick check

### 1. What does this print?

```js
console.log([3, 20, 100].sort());              // no compare function
```

:::answer
**`[100, 20, 3]`.** The items are compared as text: `"100"` < `"20"` < `"3"`, because `"1"` comes before `"2"` and `"3"`.
:::

### 2. Which sort is always O(n log n), even in the worst case?

- A) Quick sort
- B) Merge sort
- C) Bubble sort

:::answer
**B) Merge sort.**
:::

### 3. Is JavaScript's `Array.prototype.sort` stable?

:::answer
**Yes.** The spec has required it since ES2019, and V8 uses TimSort, which is stable.
:::
