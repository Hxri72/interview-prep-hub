---
title: Two Sum
stack: dsa
order: 22
level: Basic
mustKnow: true
askedFrequency: very common
summary:
  - "Return the positions of two numbers that add up to a target: [2, 7, 11, 15], target 9 → [0, 1]."
  - "Brute force checks every pair: O(n²). findIndex inside a loop is the same — the loop is just hidden."
  - "Best: one loop with a Map of numbers already seen. For each number, check if target - number is in the Map. O(n) time, O(n) space."
  - "Check the Map BEFORE adding the current number, so you never pair a number with itself."
  - If the array is sorted, two pointers solve it in O(n) time with O(1) extra space.
cards:
  - q: What is the O(n) idea for Two Sum?
    a: "Walk through once. For each number, the partner you need is target - number. Keep a Map of numbers already seen (value → index). If the partner is in the Map, you're done."
  - q: Why check the Map before adding the current number?
    a: So a number can't pair with itself. For [3, 4] and target 6, adding 3 first would wrongly match 3 + 3.
  - q: Is findIndex inside a loop faster than two loops?
    a: No. findIndex is a hidden loop, so it's still O(n²).
  - q: How does [3, 3] with target 6 work with the Map approach?
    a: "i = 0: need 3, Map empty, store 3 → 0. i = 1: need 3, found at 0 → return [0, 1]."
  - q: How do you solve it if the array is sorted?
    a: Two pointers at both ends. If the sum is too small, move left forward; too big, move right back; equal, return. O(n) time, O(1) space.
---

## 💡 What is it?

You get an array of numbers and a **target**. Return the **positions (indexes)** of the two numbers that add up to the target.

You can't use the same item twice. Usually there is exactly one answer.

```text
Input:  nums = [2, 7, 11, 15], target = 9
Output: [0, 1]       because nums[0] + nums[1] = 2 + 7 = 9
```

## 🏠 Real-life example

Think of a **shopkeeper with a ₹9 gift card** helping students pick two items that cost exactly ₹9 together.

He picks up the ₹2 eraser and thinks: "I need a ₹7 item for this." He writes ₹2 in his **notebook** and moves on. Next comes a ₹7 pen. He checks the notebook: is there a ₹2 item? Yes! Done.

- The **items on the shelf** = the array.
- The **₹9 gift card** = the target.
- **"I need ₹7 for this one"** = `need = target - nums[i]`.
- The **notebook** = a `Map` of prices already seen and where they were.
- **Checking the notebook** = `seen.has(need)`, an instant lookup.

## 🧑‍💻 Code example

Save as `twosum.js` and run `node twosum.js`.

```js
const nums = [2, 7, 11, 15];                              // the numbers
const target = 9;                                         // we need two numbers that add up to 9

// Way 1 — array methods (findIndex inside a loop)
function twoSumWay1(nums, target) {                       // returns the two positions
  for (let i = 0; i < nums.length; i++) {                 // pick each number in turn
    const need = target - nums[i];                        // the partner this number needs
    const j = nums.findIndex((x, idx) => x === need && idx !== i); // search the list for the partner
    if (j !== -1) return [i, j];                          // found it → return both positions
  }                                                       // end of loop
  return [];                                              // no pair found
}                                                         // end of twoSumWay1
console.log('Way 1:', JSON.stringify(twoSumWay1(nums, target))); // print the result

// Way 2 — plain loop with a Map ("seen" notebook)
function twoSum(nums, target) {                           // one pass through the list
  const seen = new Map();                                 // value → position, for numbers already passed
  for (let i = 0; i < nums.length; i++) {                 // look at each number once
    const need = target - nums[i];                        // the partner we are looking for
    if (seen.has(need)) return [seen.get(need), i];       // partner seen before → done
    seen.set(nums[i], i);                                 // remember this number and its position
  }                                                       // end of loop
  return [];                                              // no pair found
}                                                         // end of twoSum
console.log('Way 2:', JSON.stringify(twoSum(nums, target))); // print the result
console.log('Edge:', JSON.stringify(twoSum([3, 3], 6)), JSON.stringify(twoSum([1, 2], 10))); // same number twice, no answer
```

**Output (real run):**

```text
Way 1: [0,1]
Way 2: [0,1]
Edge: [0,1] []
```

## 🔍 Deeper version

**Complexity:**

| Way | Time | Extra space |
|---|---|---|
| Two nested loops (check every pair) | O(n²) | O(1) |
| `findIndex` inside a loop (Way 1) | O(n²) — the second loop is hidden | O(1) |
| One loop + Map (Way 2) | **O(n)** | O(n) |
| Sort + two pointers | O(n log n) | O(n) to keep original indexes |

The classic brute force, to say first in the interview:

```js
for (let i = 0; i < nums.length; i++) {          // pick the first number
  for (let j = i + 1; j < nums.length; j++) {    // pick every number after it
    if (nums[i] + nums[j] === target) return [i, j]; // this pair adds up → return their positions
  }                                              // end of inner loop
}                                                // end of outer loop
```

**Dry run of Way 2** with `[2, 7, 11, 15]`, target 9:

| i | nums[i] | need | In Map? | Map after |
|---|---|---|---|---|
| 0 | 2 | 7 | no | `{2 → 0}` |
| 1 | 7 | 2 | **yes, at 0** | return `[0, 1]` |

**Order matters.** We check the Map **before** adding the current number. For `[3, 4]` with target 6, adding 3 first would find `need = 3` and wrongly pair 3 with itself.

**Why a Map, not an object?** Object keys become strings, but numbers work fine for this problem either way. A `Map` is clearer, keeps number keys as numbers and has an O(1) `has`. See [Set and Map](topic:dsa/set-map) and the [hash map pattern](topic:dsa/pattern-hash-map).

**Sorted input (LeetCode 167, "Two Sum II"):** put one pointer at the start and one at the end. If the sum is too small, move the left pointer forward. If it's too big, move the right one back. That's O(n) time and O(1) space. See [two pointers](topic:dsa/pattern-two-pointers).

## 🎯 Why do we use it?

- It's the **most famous interview question**, often the very first one asked.
- It's the cleanest example of trading **memory for speed**: O(n) extra space turns O(n²) into O(n).
- The "remember what you've seen" idea solves many other problems: duplicates, first repeating item, pairs with a difference of k.

## ⚠️ Common mistakes

- **Returning the values instead of the indexes.** Read the question carefully.
- **Pairing a number with itself**, by adding it to the Map before checking.
- **Calling `findIndex` or `indexOf` "O(n)"** when it sits inside a loop.
- **Sorting first and then returning indexes.** Sorting changes the positions, so the indexes are wrong unless you saved the originals.

## 🗣️ How to answer in an interview

> "So I need two different positions whose values add up to the target. Can I assume exactly one answer? Can there be negative numbers or duplicates? For example, `[2, 7, 11, 15]` with target 9 gives `[0, 1]`.
>
> The simple way checks every pair with two loops, which is O(n²).
>
> To improve: for each number I already know the partner it needs, `target - number`. If I store the numbers I've passed in a Map, value to index, I can check for the partner in O(1). So it becomes one loop, O(n) time, with O(n) space for the Map.
>
> One detail: I check the Map before adding the current number, so a number never pairs with itself. Dry run: i = 0, need 7, not seen, store 2. i = 1, need 2, found at 0, return `[0, 1]`."

## 🔁 Follow-up questions

### What if there can be many pairs, and you must return all of them?

Don't return early. Push each pair you find into a result list. If duplicates are allowed, store a list of indexes per value in the Map, or count values.

### What if the array is sorted?

Use two pointers from both ends, as in the Deeper section. O(n) time and O(1) space.

### Can you solve it with O(1) extra space on unsorted input?

Only in O(n²) with two loops, or O(n log n) by sorting a copy of `[value, index]` pairs and then using two pointers.

### How would you solve Three Sum?

Sort the array. Fix one number, then run the two-pointer Two Sum on the rest for `target - fixed`. Skip duplicates. O(n²). See [3Sum](topic:dsa/three-sum).

## ✅ Quick check

### 1. What does `twoSum([3, 2, 4], 6)` return with the Map approach?

:::answer
**`[1, 2]`**. i = 0: need 3, not seen, store 3 → 0. i = 1: need 4, not seen, store 2 → 1. i = 2: need 2, seen at 1 → return `[1, 2]`. It does **not** return `[0, 0]`, because 3 isn't in the Map when we check it.
:::

### 2. What is the time complexity of a loop that calls `nums.indexOf(need)` each time?

- A) O(n)
- B) O(n log n)
- C) O(n²)

:::answer
**C.** `indexOf` walks the array each time, so it's a loop inside a loop.
:::

### 3. Why do we store `value → index` in the Map, not just the values?

:::answer
Because the question asks for **positions**. When we find the partner, we need to know where it was. A Set would only tell us that it exists.
:::
