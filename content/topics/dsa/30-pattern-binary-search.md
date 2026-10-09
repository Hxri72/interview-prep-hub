---
title: "Pattern: binary search"
stack: dsa
order: 30
level: Intermediate
mustKnow: true
askedFrequency: very common
summary:
  - "Binary search finds an item in a SORTED array by checking the middle and throwing away half each step."
  - O(log n) time — about 20 checks for 1,000,000 items — and O(1) space.
  - "Keywords: \"sorted\", \"find\", \"first position\", \"insert position\", \"minimum value that works\"."
  - "Lower bound (search insert position): the first index where arr[i] >= target."
  - Watch the loop condition (low <= high) and always move low/high past mid, or it loops forever.
cards:
  - q: What does binary search need?
    a: A sorted array (or any space where you can say "the answer is to the left" or "to the right").
  - q: What is the time complexity of binary search?
    a: O(log n). Each step halves the search area, so 1,000,000 items need about 20 checks.
  - q: How do you pick the middle index?
    a: "mid = Math.floor((low + high) / 2). In languages with overflow, low + (high − low) / 2."
  - q: What is "search insert position" (lower bound)?
    a: The first index where the item is greater than or equal to the target — where you would insert it to keep the array sorted.
  - q: Why can binary search loop forever?
    a: If you set low = mid or high = mid instead of mid + 1 / mid − 1, the range can stop shrinking.
---

## 💡 What is it?

Binary search finds a value in a **sorted** array very fast.

Look at the **middle** item. If it's the target, you're done. If the target is bigger, **throw away the left half**. If it's smaller, **throw away the right half**. Repeat with the half that's left.

Each step cuts the problem in half. That's why it's **O(log n)**.

**Spot it when the question says:** "sorted array" + "find", "first position of", "insert position", "smallest value that satisfies…".

## 🏠 Real-life example

Think of **finding a word in a printed dictionary**.

You don't read from page 1. You open the **middle**. Your word starts with "P", but the page shows "M". So "P" must be in the **right half**. You open the middle of the right half, and so on. In a few jumps you're on the right page.

- The **dictionary** = the sorted array.
- **Opening the middle** = `mid = Math.floor((low + high) / 2)`.
- **Ignoring half the book** = `low = mid + 1` or `high = mid - 1`.
- **The pages still possible** = the range from `low` to `high`.

## 🧑‍💻 Code example

Problem: **find a number in a sorted array of one million numbers**. Save as `binary-search.js` and run `node binary-search.js`.

```js
// Problem: find a number in a SORTED array
function linearSearch(arr, target) {               // brute force: check one by one
  for (let i = 0; i < arr.length; i++) {           // every index
    if (arr[i] === target) return i;               // found it
  }                                                // end of loop
  return -1;                                       // not found
}                                                  // end of linearSearch

function binarySearch(arr, target) {               // binary search: halve each step
  let low = 0;                                     // left end of the search area
  let high = arr.length - 1;                       // right end of the search area
  let steps = 0;                                   // count checks, just to show the speed
  while (low <= high) {                            // area is not empty
    steps++;                                       // one more check
    const mid = Math.floor((low + high) / 2);      // middle index
    if (arr[mid] === target) return { index: mid, steps }; // found it
    if (arr[mid] < target) low = mid + 1;          // target is bigger → drop the left half
    else high = mid - 1;                           // target is smaller → drop the right half
  }                                                // end of loop
  return { index: -1, steps };                     // not found
}                                                  // end of binarySearch

const big = Array.from({ length: 1_000_000 }, (_, i) => i * 2); // 0, 2, 4, … sorted
console.log(linearSearch(big, 1_999_998));         // 999999 (after ~1,000,000 checks)
console.log(binarySearch(big, 1_999_998));         // { index: 999999, steps: … }
console.log(binarySearch(big, 7));                 // odd number is missing → index -1
```

**Output:**

```text
999999
{ index: 999999, steps: 20 }
{ index: -1, steps: 20 }
```

Linear search may check all **1,000,000** items: O(n). Binary search needs only **20** checks: O(log n), because 2²⁰ ≈ 1,000,000.

## 🔍 Deeper version

**Template (find exact value):**

```js
let low = 0, high = arr.length - 1;           // search the whole array
while (low <= high) {                         // while the range isn't empty
  const mid = Math.floor((low + high) / 2);   // middle
  if (arr[mid] === target) return mid;        // found
  if (arr[mid] < target) low = mid + 1;       // go right
  else high = mid - 1;                        // go left
}
return -1;                                    // not found
```

**Lower bound / Search Insert Position** (first index with `arr[i] >= target`):

```js
function lowerBound(arr, target) {            // where target is, or where it would go
  let low = 0, high = arr.length;             // high = length: "insert at the end" is allowed
  while (low < high) {                        // range [low, high) is not empty
    const mid = Math.floor((low + high) / 2); // middle
    if (arr[mid] < target) low = mid + 1;     // answer is right of mid
    else high = mid;                          // mid might be the answer; keep it
  }
  return low;                                 // [1, 3, 5, 6], 5 → 2; 2 → 1; 7 → 4
}
```

Note the different loop (`low < high`) and `high = mid`. Mixing the two templates is the most common bug.

**Binary search on the answer:** sometimes there's no array. Example: "what is the smallest speed that finishes in time?" If speed X works, every faster speed works too. You can binary search over possible speeds.

**Complexity:** **O(log n)** time, **O(1)** space (the loop version). If the array isn't sorted, sorting first costs O(n log n).

**More problems:** Binary Search, Search Insert Position, and Find First and Last Position of Element.

## 🎯 Why do we use it?

Sorted data is everywhere: ids, dates, prices, logs. Binary search turns "look at everything" into "look at about 20 things". Databases use the same idea inside their B-tree [indexes](glossary:index).

## ⚠️ Common mistakes

- **Using it on an unsorted array.** The answer will be wrong, with no error.
- **Infinite loops** from `low = mid` with `while (low <= high)`. Always move past `mid` in the exact-match template.
- **Off-by-one** between `high = arr.length - 1` (exact match) and `high = arr.length` (lower bound).
- **Returning the wrong thing** when not found: say whether you return `-1` or the insert position.

## 🗣️ How to answer in an interview

> "The array is sorted, so I'll use binary search. I keep low and high pointers. Each step I check the middle. If it's the target, I return it. If the middle is smaller, the target must be on the right, so low becomes mid + 1. Otherwise high becomes mid − 1. Each step halves the range, so it's O(log n) time and O(1) space. A million items need about 20 checks. If they want the insert position, I'd use the lower-bound version: the loop runs while low < high, and I set high to mid instead of mid − 1."

## 🔁 Follow-up questions

### What if the array has duplicates and they want the first occurrence?

Use lower bound. When you find the target, don't stop: keep searching left (`high = mid`) until the range closes.

### Can binary search work on a rotated sorted array?

Yes. At each step, one half is still sorted. Check if the target is inside that sorted half, and search there; otherwise search the other half.

### Why `Math.floor((low + high) / 2)`?

To get a whole-number index. In languages like Java or C, `low + (high − low) / 2` avoids integer overflow. In JavaScript the numbers are big enough that this rarely matters.

### Recursive or loop?

The loop uses O(1) space. A recursive version uses O(log n) call-stack space. Interviewers usually prefer the loop.

## ✅ Quick check

### 1. Sorted `[2, 4, 6, 8, 10]`, target `8`. Which indexes does the exact-match search check?

:::answer
**2, then 3.** mid = 2 (value 6) → too small → low = 3. mid = 3 (value 8) → found.
:::

### 2. About how many checks does binary search need for 1,000 items?

- A) 10
- B) 100
- C) 500

:::answer
**A) about 10.** 2¹⁰ = 1,024, so about 10 halvings shrink 1,000 items to one.
:::
