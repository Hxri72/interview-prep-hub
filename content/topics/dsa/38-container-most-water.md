---
title: Container with most water
stack: dsa
order: 38
level: Intermediate
mustKnow: false
askedFrequency: common
summary:
  - "Each number is the height of a line. Pick two lines that hold the most water between them."
  - "Water = the shorter line × the distance between the two lines."
  - "Brute force checks every pair: O(n²)."
  - "Two pointers: start at both ends and always move the SHORTER line inward. O(n) time, O(1) space."
  - "Moving the taller line can never give more water, because the shorter line still limits the height."
cards:
  - q: How do you calculate the water between two lines?
    a: "min(height[left], height[right]) × (right - left). The shorter line decides how high the water can go."
  - q: Which pattern solves this in O(n)?
    a: Two pointers, starting at both ends and moving toward each other.
  - q: Which pointer do you move, and why?
    a: The one at the shorter line. Moving the taller one makes the width smaller, and the height is still limited by the same short line, so it can't help.
  - q: "What is the answer for [1,8,6,2,5,4,8,3,7]?"
    a: "49, using the lines at index 1 (height 8) and index 8 (height 7): min(8, 7) × 7 = 49."
  - q: What are the time and space of the two-pointer solution?
    a: O(n) time, because the two pointers together walk the array once. O(1) space.
---

## 💡 What is it?

You get an array of heights. Each number is a **vertical line** standing at that index.

Pick **two lines**. Together with the floor, they make a container. Find the pair that holds **the most water**.

Water = **the shorter line × the distance** between them.

Example: `[1, 8, 6, 2, 5, 4, 8, 3, 7]` → **49** (lines at index 1 and 8: `min(8, 7) × 7`).

## 🏠 Real-life example

Think of **building a pool between two walls in a playground**.

The water can only rise to the **shorter wall**; it spills over the short one. A pool is bigger if the walls are **taller** or **further apart**.

You start with the two walls **furthest apart**. Then you try a new wall, always replacing the **shorter** wall, because the short wall is what holds you back.

- **Walls** = the heights in the array.
- **Distance between walls** = `right - left`.
- **The shorter wall** = `Math.min(h[left], h[right])`.
- **Replacing the shorter wall** = moving that pointer inward.

## 🧑‍💻 Code example

Save as `container.js`. Run `node container.js`.

```js
// Way 1 — brute force with array methods (check every pair of lines)
const maxAreaBrute = (h) =>                            // h = heights of the vertical lines
  Math.max(...h.flatMap((a, i) =>                      // for each left line i…
    h.slice(i + 1).map((b, k) =>                       // …pair it with every line to its right
      Math.min(a, b) * (k + 1))));                     // water = shorter line × distance (k + 1)

// Way 2 — two pointers (one pass)
function maxArea(h) {                                  // h = heights of the vertical lines
  let left = 0, right = h.length - 1;                  // start at both ends (widest container)
  let best = 0;                                        // the most water found so far
  while (left < right) {                               // stop when the pointers meet
    const width = right - left;                        // distance between the two lines
    const area = Math.min(h[left], h[right]) * width;  // water is limited by the shorter line
    best = Math.max(best, area);                       // remember the best
    if (h[left] < h[right]) left++;                    // move the SHORTER side inward
    else right--;                                      // (moving the taller side can never help)
  }                                                    // end of the loop
  return best;                                         // the maximum water
}                                                      // end of maxArea

const heights = [1, 8, 6, 2, 5, 4, 8, 3, 7];           // the classic example
console.log(maxAreaBrute(heights));                    // 49
console.log(maxArea(heights));                         // 49 (lines at index 1 and 8)
console.log(maxArea([1, 1]));                          // 1
```

**Output:**

```text
49
49
1
```

`flatMap` runs a function on each item and flattens the result by one level.

## 🔍 Deeper version

**Complexity:**

| Way | Time | Space | Why |
|---|---|---|---|
| Brute force | O(n²) | O(n²) for the `flatMap` list, or O(1) with plain loops | Every pair. |
| Two pointers | O(n) | O(1) | The pointers together cross the array once. |

**Why moving the shorter line is safe.** Say the left line is shorter. Any container that keeps this left line and uses a line closer to it is **narrower**, and its height is **at most** the left line's height. So it can never beat the area we just measured. We can safely drop the left line and move on.

**Dry run** on `[1, 8, 6, 2, 5, 4, 8, 3, 7]`:

| left (h) | right (h) | width | area | best | move |
|---|---|---|---|---|---|
| 0 (1) | 8 (7) | 8 | 8 | 8 | left (1 < 7) |
| 1 (8) | 8 (7) | 7 | **49** | **49** | right (7 < 8) |
| 1 (8) | 7 (3) | 6 | 18 | 49 | right |
| 1 (8) | 6 (8) | 5 | 40 | 49 | right (equal → move right) |
| 1 (8) | 5 (4) | 4 | 16 | 49 | right |
| … | … | … | smaller | 49 | … |

**Edge cases:** two lines (one possible container), all heights equal, heights of 0 (no water).

This is the [two-pointers pattern](topic:dsa/pattern-two-pointers).

## 🎯 Why do we use it?

- It's a classic medium question (LeetCode "Container With Most Water").
- It tests whether you can **prove** a greedy step is safe, not just guess it.
- It shows a key two-pointer idea: start wide, then **throw away options that can't win**.

## ⚠️ Common mistakes

- **Using the taller line for the height.** Water spills over the shorter one.
- **Moving the taller pointer.** That can never improve the answer and can miss the best one.
- **Counting the distance wrong.** It's `right - left`, not `right - left + 1`.
- **Confusing it with "Trapping Rain Water"**, a different problem where water sits on top of many bars.

## 🗣️ How to answer in an interview

> "I need two lines that hold the most water. The water is the shorter line times the distance between them.
>
> The brute force checks every pair, which is O(n²).
>
> I'll use two pointers at the two ends, so I start with the widest container. Each step, I measure the area and move the pointer at the shorter line inward. Moving the taller one can't help: the width shrinks and the height is still limited by the short line.
>
> The pointers meet after one pass, so it's O(n) time and O(1) space."

## 🔁 Follow-up questions

### Why start at both ends?

That's the widest container. From there, every move makes it narrower, so we only move when it might give a taller short wall.

### What do you do when both heights are equal?

Move either one. Both are the limiting height, so neither line can give a better container with a narrower width.

### How is this different from Trapping Rain Water?

Here, water sits between **two** chosen lines, and the lines in between don't matter. In Trapping Rain Water, every bar holds water on top of it, depending on the tallest bars on its left and right.

### Can you return the two indexes too?

Yes. Save `left` and `right` whenever you update `best`.

## ✅ Quick check

### 1. What does `maxArea([4, 3, 2, 1, 4])` return?

:::answer
**16.** The two outer lines are both 4, and they are 4 apart: `4 × 4 = 16`.
:::

### 2. In `[2, 9, ..., 5]`, left is 2 and right is 5. Which pointer moves?

:::answer
**The left pointer**, because `2 < 5`. The short line is the one holding the water down.
:::

### 3. What is the time of the two-pointer solution?

- A) O(n²)
- B) O(n log n)
- C) O(n)

:::answer
**C) O(n).** Each step moves one pointer, and they meet after at most n steps.
:::
