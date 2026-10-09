---
title: 3Sum
stack: dsa
order: 39
level: Advanced
mustKnow: false
askedFrequency: common
summary:
  - "Find all UNIQUE triples of numbers that add up to 0."
  - "Brute force tries every triple: O(n³), plus work to remove duplicates."
  - "Optimal: sort, fix the first number, then use two pointers for the other two. O(n²) time."
  - "Skip duplicates in three places: the first number, the left pointer and the right pointer."
  - "It's Two Sum on a sorted array, run once for every first number."
cards:
  - q: What does 3Sum ask for?
    a: All unique groups of three numbers from the array whose sum is 0. Each group must use three different positions.
  - q: What is the optimal approach?
    a: Sort the array. For each first number, run two pointers on the rest to find two numbers that sum to minus the first number.
  - q: What is the time complexity of the optimal solution?
    a: "O(n²): sorting is O(n log n), then an O(n) two-pointer scan for each of the n first numbers."
  - q: How do you avoid duplicate triples?
    a: Skip a first number if it equals the one before it. After finding a triple, move both pointers past any repeated values.
  - q: What do you do when the sum is too small?
    a: Move the left pointer right, to a bigger number. If the sum is too big, move the right pointer left, to a smaller number.
---

## 💡 What is it?

You get an array of numbers. Find **all unique triples** that **add up to 0**.

Each triple must use three **different positions**, and no triple may appear twice.

Example: `[-1, 0, 1, 2, -1, -4]` → `[[-1, -1, 2], [-1, 0, 1]]`.

## 🏠 Real-life example

Think of **three friends sharing a bill**, where some owe money (negative) and some are owed money (positive). You want every group of three whose amounts **cancel out to exactly 0**.

You first **line everyone up from lowest to highest amount**. Then you pick one friend, and look for the other two from **both ends of the line**:
- If the total is **too low**, swap in someone from the higher end.
- If it's **too high**, swap in someone from the lower end.

Mapping:
- **Friends' amounts** = the numbers.
- **Lining up** = sorting.
- **The first friend you pick** = the fixed number `a[i]`.
- **Looking from both ends** = the `left` and `right` pointers.
- **Not counting the same group twice** = skipping duplicates.

## 🧑‍💻 Code example

Save as `three-sum.js`. Run `node three-sum.js`.

```js
// Way 1 — brute force with array methods (every triple, Set to remove duplicates)
function threeSumBrute(nums) {                         // nums = the array of numbers
  const found = new Set();                             // triples as strings, e.g. "-1,0,1"
  nums.forEach((a, i) =>                               // first number
    nums.forEach((b, j) =>                             // second number
      nums.forEach((c, k) => {                         // third number
        if (i < j && j < k && a + b + c === 0) {       // three different positions that sum to 0
          found.add([a, b, c].sort((x, y) => x - y).join(',')); // sort so duplicates look the same
        }                                              // end of the sum check
      })));                                            // end of the three loops
  return [...found].map((t) => t.split(',').map(Number)); // turn strings back into number arrays
}                                                      // end of threeSumBrute

// Way 2 — sort + two pointers
function threeSum(nums) {                              // nums = the array of numbers
  const a = [...nums].sort((x, y) => x - y);           // sort a copy, small to big
  const result = [];                                   // the triples we find
  for (let i = 0; i < a.length - 2; i++) {             // fix the first number
    if (i > 0 && a[i] === a[i - 1]) continue;          // same first number as before → skip duplicate
    let left = i + 1, right = a.length - 1;            // two pointers for the other two numbers
    while (left < right) {                             // until the pointers meet
      const sum = a[i] + a[left] + a[right];           // total of the three
      if (sum < 0) left++;                             // too small → need a bigger number
      else if (sum > 0) right--;                       // too big → need a smaller number
      else {                                           // exactly 0 → found one
        result.push([a[i], a[left], a[right]]);        // save the triple
        while (left < right && a[left] === a[left + 1]) left++;    // skip duplicate lefts
        while (left < right && a[right] === a[right - 1]) right--; // skip duplicate rights
        left++;                                        // move both pointers inward
        right--;                                       // to look for the next triple
      }                                                // end of the found branch
    }                                                  // end of the two-pointer loop
  }                                                    // end of the first-number loop
  return result;                                       // all unique triples that sum to 0
}                                                      // end of threeSum

const nums = [-1, 0, 1, 2, -1, -4];                    // the classic example
console.log(threeSumBrute(nums));                      // [[-1, 0, 1], [-1, -1, 2]] (order may differ)
console.log(threeSum(nums));                           // [[-1, -1, 2], [-1, 0, 1]]
console.log(threeSum([0, 0, 0, 0]));                   // [[0, 0, 0]] — only once
```

**Output:**

```text
[ [ -1, 0, 1 ], [ -1, -1, 2 ] ]
[ [ -1, -1, 2 ], [ -1, 0, 1 ] ]
[ [ 0, 0, 0 ] ]
```

## 🔍 Deeper version

**Complexity:**

| Way | Time | Space | Why |
|---|---|---|---|
| Brute force | O(n³) | O(number of triples) | Three nested loops. |
| Sort + two pointers | O(n²) | O(n) for the sorted copy (O(1) if you sort in place) | Sort once, then an O(n) scan for each first number. |

**Dry run** on the sorted array `[-4, -1, -1, 0, 1, 2]`:

| i (a[i]) | left, right | sum | action |
|---|---|---|---|
| 0 (-4) | -1, 2 | -3 | too small → left++ … no triple found for -4 |
| 1 (-1) | -1, 2 | **0** | save `[-1, -1, 2]`, move both |
| 1 (-1) | 0, 1 | **0** | save `[-1, 0, 1]`, move both |
| 2 (-1) | — | — | same as a[1] → **skip** |
| 3 (0) | 1, 2 | 3 | too big → right-- → pointers meet |

**The three duplicate skips:**
1. Skip `a[i]` if it equals `a[i - 1]`. The same first number would find the same triples again.
2. After a match, skip equal values on the **left**.
3. After a match, skip equal values on the **right**.

**Early stop (optional):** if `a[i] > 0`, every number after it is also positive, so no sum can be 0. You can `break`.

**Edge cases:** fewer than 3 numbers (return `[]`), all zeros (one triple `[0,0,0]`), no answer, many duplicates.

It uses [Two Sum](topic:dsa/two-sum) thinking and the [two-pointers pattern](topic:dsa/pattern-two-pointers) on a sorted array.

## 🎯 Why do we use it?

- It's a well-known medium/hard question (LeetCode "3Sum").
- It shows you can **reduce a new problem to one you know**: 3Sum = "fix one number + Two Sum".
- It tests careful handling of **duplicates**, which matters in real data too.

## ⚠️ Common mistakes

- **Forgetting to sort.** Two pointers only work on sorted data.
- **Not skipping duplicates**, so `[-1, 0, 1]` appears twice.
- **Skipping duplicates in the wrong place**, for example before finding the first match, and missing valid triples.
- **Using `sort()` without `(x, y) => x - y`.** It sorts numbers as text, so `-4` and `-1` end up in the wrong order.

## 🗣️ How to answer in an interview

> "I need all unique triples that sum to zero. Should the output be sorted? Can the array be small?
>
> The brute force tries every triple, O(n cubed), and then removes duplicates.
>
> Better: I sort the array. Then I fix the first number and look for two numbers that sum to minus that number. On a sorted array, that's Two Sum with two pointers. If the sum is too small I move left; if it's too big I move right.
>
> To avoid duplicates, I skip a first number equal to the previous one, and after a match I skip repeated values on both sides.
>
> Sorting is O(n log n), and the scans are O(n²), so the total is O(n²)."

## 🔁 Follow-up questions

### Can you do better than O(n²)?

Not in any practical way. Research papers have slightly faster methods, but O(n²) is the expected interview answer.

### How would you solve it with a hash Set instead of two pointers?

Fix `a[i]`, then walk the rest, checking whether `-(a[i] + x)` is in a Set of numbers seen so far. It's also O(n²), but handling duplicates is messier.

### What about 3Sum Closest, or 4Sum?

- **3Sum Closest:** the same loop, but keep the sum closest to the target instead of only exact matches.
- **4Sum:** add one more outer loop. That's O(n³).

### Why copy the array before sorting?

`sort()` changes the original array. Copying with `[...nums]` keeps the caller's data unchanged, unless the interviewer says in-place is fine.

## ✅ Quick check

### 1. What does `threeSum([1, 2, 3])` return?

:::answer
**`[]`.** All numbers are positive, so no three can add up to 0.
:::

### 2. Why do we skip `a[i]` when it equals `a[i - 1]`?

:::answer
The same first number would find exactly the same triples again, creating duplicates.
:::

### 3. The sum is `-2`. Which pointer moves?

:::answer
**The left pointer moves right.** The sum is too small, so we need a bigger number, and bigger numbers are to the right in a sorted array.
:::
