---
title: Merge two sorted arrays
stack: dsa
order: 19
level: Intermediate
mustKnow: false
askedFrequency: common
summary:
  - "Combine two already-sorted arrays into one sorted array: [1, 4, 7] + [2, 3, 8, 9] → [1, 2, 3, 4, 7, 8, 9]."
  - "Way 1: join with spread and sort((x, y) => x - y) — O((n + m) log(n + m))."
  - "Way 2: two pointers, always take the smaller front item — O(n + m) time."
  - After one array runs out, copy the rest of the other one.
  - This is the "merge" step inside merge sort.
cards:
  - q: What is the fastest way to merge two sorted arrays?
    a: Two pointers, one in each array. Compare the front items, take the smaller one, move that pointer. Then copy whatever is left. O(n + m).
  - q: What is wrong with [...a, ...b].sort()?
    a: Without a compare function, sort compares as text, so 10 comes before 2. Also it costs O((n+m) log(n+m)) and ignores that the inputs were already sorted.
  - q: After the main loop, why do we need two more loops?
    a: The main loop stops when ONE array runs out. The other may still have items. They're already sorted and bigger, so we copy them at the end.
  - q: Why use <= instead of < when comparing?
    a: With <=, equal values are taken from the first array first. That keeps the merge "stable" — equal items keep their original order.
  - q: Where is this used in real algorithms?
    a: It is the merge step of merge sort, and it's used to combine sorted results, like sorted pages from two data sources.
---

## 💡 What is it?

You get **two arrays that are already sorted** from small to big. Return **one sorted array** with all the values.

```text
Input:  a = [1, 4, 7], b = [2, 3, 8, 9]
Output: [1, 2, 3, 4, 7, 8, 9]
```

## 🏠 Real-life example

Think of **two queues of students sorted by height** joining into one line.

The teacher looks at the **front student of each queue**. The shorter one steps into the new line. Then the teacher compares the next two fronts again.

- The **two queues** = the two sorted arrays.
- **Looking at the two front students** = comparing `a[i]` and `b[j]`.
- **The shorter one steps forward** = push the smaller value and move that pointer.
- **One queue is empty** = copy the rest of the other queue as it is.
- **The new line** = the result array.

## 🧑‍💻 Code example

Save as `merge.js` and run `node merge.js`.

```js
const a = [1, 4, 7];                                      // first sorted list (small to big)
const b = [2, 3, 8, 9];                                   // second sorted list (small to big)

// Way 1 — array methods
const way1 = [...a, ...b].sort((x, y) => x - y);          // join both, then sort numbers small to big
console.log('Way 1:', JSON.stringify(way1));              // print the result on one line

// Way 2 — plain loops with two pointers
function mergeSorted(a, b) {                              // a and b are both already sorted
  const result = [];                                      // the merged list goes here
  let i = 0;                                              // i = position in a (starts at the front)
  let j = 0;                                              // j = position in b (starts at the front)
  while (i < a.length && j < b.length) {                  // while BOTH lists still have items
    if (a[i] <= b[j]) {                                   // a's front item is smaller (or equal)
      result[result.length] = a[i];                       // take it from a
      i++;                                                // move a's pointer forward
    } else {                                              // b's front item is smaller
      result[result.length] = b[j];                       // take it from b
      j++;                                                // move b's pointer forward
    }                                                     // end of if/else
  }                                                       // end of while
  while (i < a.length) { result[result.length] = a[i]; i++; } // copy what is left in a
  while (j < b.length) { result[result.length] = b[j]; j++; } // copy what is left in b
  return result;                                          // the merged, sorted list
}                                                         // end of mergeSorted

console.log('Way 2:', JSON.stringify(mergeSorted(a, b))); // print the loop result on one line
console.log('Edge:', mergeSorted([], [5]), mergeSorted([1, 1], [1])); // empty list, duplicates
```

**Output (real run):**

```text
Way 1: [1,2,3,4,7,8,9]
Way 2: [1,2,3,4,7,8,9]
Edge: [ 5 ] [ 1, 1, 1 ]
```

## 🔍 Deeper version

**Complexity (n = length of a, m = length of b):**

| Way | Time | Extra space |
|---|---|---|
| Spread + `sort` | O((n + m) log(n + m)) | O(n + m) |
| Two pointers | **O(n + m)** | O(n + m) for the result |

Way 1 throws away useful information: the inputs were **already sorted**. Way 2 uses that, so each item is looked at once. This is the [two-pointers pattern](topic:dsa/pattern-two-pointers).

**Dry run** with `a = [1, 4, 7]`, `b = [2, 3, 8, 9]`:

| i | j | Compare | Take | result |
|---|---|---|---|---|
| 0 | 0 | 1 vs 2 | 1 (a) | `[1]` |
| 1 | 0 | 4 vs 2 | 2 (b) | `[1, 2]` |
| 1 | 1 | 4 vs 3 | 3 (b) | `[1, 2, 3]` |
| 1 | 2 | 4 vs 8 | 4 (a) | `[1, 2, 3, 4]` |
| 2 | 2 | 7 vs 8 | 7 (a) | `[1, 2, 3, 4, 7]` |
| 3 | 2 | a is empty | copy 8, 9 | `[1, 2, 3, 4, 7, 8, 9]` |

**Edge cases:** one or both arrays empty, duplicates across both arrays, negative numbers, very different lengths.

**LeetCode "Merge Sorted Array" (88)** is a twist: merge `b` **into** `a` in place, where `a` has empty space at the end. The trick is to fill from the **back**: compare the last items, put the bigger one at the last free slot. That way you never overwrite a value you still need. Space becomes O(1).

## 🎯 Why do we use it?

- It is the heart of **merge sort**, one of the most important sorting algorithms. See [sorting algorithms](topic:dsa/sorting-algorithms).
- Real systems merge sorted streams: sorted search results from two shards, or two sorted lists of interview slots.
- It teaches the habit of **using what the input already gives you** (here: "already sorted").

## ⚠️ Common mistakes

- **`sort()` without a compare function.** `[10, 1, 2].sort()` gives `[1, 10, 2]`, because it compares as text.
- **Forgetting the "copy what is left" loops.** Then the biggest values go missing.
- **Using `||` instead of `&&`** in the main `while`. Then you read past the end of one array and get `undefined`.
- **Sorting the merged array anyway** after two pointers. It's already sorted.

## 🗣️ How to answer in an interview

> "Both arrays are sorted small to big, and I return one sorted array. Can they be empty or have duplicates? I'll handle both.
>
> The simple way is to spread both into one array and sort with `(x, y) => x - y`. That's O((n + m) log(n + m)). But that ignores that the inputs are already sorted.
>
> Better: two pointers, one per array. I compare the two front values, push the smaller one, and move that pointer. When one array runs out, I copy the rest of the other. Each item is touched once, so it's O(n + m) time and O(n + m) space for the result.
>
> Dry run with `[1, 4, 7]` and `[2, 3, 8, 9]`… I get `[1, 2, 3, 4, 7, 8, 9]`. If they want it in place, like LeetCode 88, I'd fill from the back to get O(1) extra space."

## 🔁 Follow-up questions

### How would you merge k sorted arrays?

Simple: merge them two at a time. Better: use a **min-heap** (priority queue) holding the front item of each array. Always pop the smallest and push the next item from the same array. That's O(N log k), where N is the total items.

### How do you merge in place when the first array has extra space?

Use three pointers from the **end**: last real item of `a`, last item of `b`, and the last slot of `a`. Put the bigger value in the last slot and move left. Stop when `b` is used up.

### How would you remove duplicates while merging?

Before pushing a value, check whether it equals the last value in `result`. If it does, skip it.

### Is the two-pointer merge stable?

Yes, if you use `<=`. Equal values from `a` go before equal values from `b`, keeping their original order.

## ✅ Quick check

### 1. What does this print?

```js
console.log([...[1, 10], ...[2]].sort()); // no compare function
```

:::answer
**`[1, 10, 2]`**. Without a compare function, `sort` compares items as **text**, and `"10"` comes before `"2"`. Use `sort((x, y) => x - y)`.
:::

### 2. What is the time complexity of the two-pointer merge?

- A) O(n × m)
- B) O(n + m)
- C) O(log n)

:::answer
**B.** Each item from both arrays is pushed exactly once.
:::

### 3. The main loop has finished and `i = 3` (end of `a`) while `j = 2`. What happens next?

:::answer
The remaining items of `b`, from index 2 onward, are copied to the end of `result`. They are already sorted and bigger than everything added so far.
:::
