---
title: Reverse an array
stack: dsa
order: 8
level: Basic
mustKnow: false
askedFrequency: very common
summary:
  - "Way 1: [...arr].reverse() or arr.toReversed() — both keep the original safe."
  - arr.reverse() on its own changes the original array.
  - "Way 2: two pointers — swap the first and last, move inward, stop when they meet."
  - Two pointers is O(n) time and O(1) extra space (in place).
  - The same idea reverses a string (after splitting it into characters) and checks palindromes.
cards:
  - q: Does arr.reverse() change the original array?
    a: Yes. To keep the original, use [...arr].reverse() or arr.toReversed().
  - q: How do you reverse an array in place without methods?
    a: Two pointers — left at 0, right at the end. Swap them, move left up and right down, stop when left >= right.
  - q: Time and space complexity of the two-pointer reverse?
    a: O(n) time (about n/2 swaps) and O(1) extra space.
  - q: How do you swap two items in one line?
    a: "[arr[i], arr[j]] = [arr[j], arr[i]] — array destructuring."
  - q: How do you reverse a string?
    a: "[...str].reverse().join(''), or loop from the last character to the first. Strings can't be changed in place."
---

## 💡 What is it?

**The problem:** reverse the order of an array.

```text
Input:  [1, 2, 3, 4, 5]
Output: [5, 4, 3, 2, 1]
```

The real interview question is usually: **"Do it in place, without `reverse()`."**

## 🏠 Real-life example

Think of a **row of students lined up by height**, and the teacher wants the opposite order.

The first and the last student **swap places**. Then the second and the second-last swap. They keep moving inward. When the two swappers meet in the middle, the line is reversed.

- The **two students swapping** = the `left` and `right` pointers.
- **Moving inward** = `left++` and `right--`.
- **Meeting in the middle** = `while (left < right)` stops.

No second line was needed. That's "in place", O(1) space.

## 🧑‍💻 Code example

Save as `reverse.js` and run `node reverse.js`.

```js
const original = [1, 2, 3, 4, 5];                 // the list we want reversed

// Way 1 — methods (keep the original safe)
const copy1 = [...original].reverse();            // copy first, because reverse() changes the list it is called on
const copy2 = original.toReversed();              // newer method: returns a NEW reversed list
console.log(copy1, copy2, '| original:', original); // original is unchanged

// Way 2 — two pointers, in place, no methods
function reverseInPlace(arr) {                    // arr will be changed directly
  let left = 0;                                   // pointer at the start
  let right = arr.length - 1;                     // pointer at the end
  while (left < right) {                          // stop when they meet in the middle
    const temp = arr[left];                       // keep the left value safe
    arr[left] = arr[right];                       // put the right value on the left
    arr[right] = temp;                            // put the saved left value on the right
    left++;                                       // move the left pointer inward
    right--;                                      // move the right pointer inward
  }                                               // end of the loop
  return arr;                                     // same array, now reversed
}                                                 // end of reverseInPlace

console.log(reverseInPlace([1, 2, 3, 4, 5]));     // odd length
console.log(reverseInPlace([1, 2, 3, 4]));        // even length
console.log(reverseInPlace([]));                  // edge case: empty
```

**Output:**

```text
[ 5, 4, 3, 2, 1 ] [ 5, 4, 3, 2, 1 ] | original: [ 1, 2, 3, 4, 5 ]
[ 5, 4, 3, 2, 1 ]
[ 4, 3, 2, 1 ]
[]
```

## 🔍 Deeper version

**Complexity:**

| Way | Time | Extra space | Changes original? |
|---|---|---|---|
| `[...arr].reverse()` | O(n) | O(n) (the copy) | no |
| `arr.toReversed()` | O(n) | O(n) | no |
| `arr.reverse()` | O(n) | O(1) | **yes** |
| Two pointers | O(n) | O(1) | yes (in place) |
| New array with a backwards loop | O(n) | O(n) | no |

**Dry run** of two pointers on `[1, 2, 3, 4, 5]`:

| left | right | swap | array after |
|---|---|---|---|
| 0 | 4 | 1 ↔ 5 | [5, 2, 3, 4, 1] |
| 1 | 3 | 2 ↔ 4 | [5, 4, 3, 2, 1] |
| 2 | 2 | stop (left = right) | done |

The middle item of an odd-length array never moves. That's correct.

**Shorter swap:** `[arr[left], arr[right]] = [arr[right], arr[left]];` does the swap in one line using [destructuring](topic:javascript/destructuring-spread-rest).

**Edge cases:** empty array and one item — the loop never runs, and that's correct.

**The pattern:** this is the simplest form of [two pointers](topic:dsa/pattern-two-pointers). The same moves check a [palindrome](topic:dsa/palindrome).

## 🎯 Why do we use it?

- **Showing the newest items first**, like the latest notifications.
- **Reversing a string or a linked list**, both common interview questions.
- **Rotating an array** can be done with three reverses. See [rotate an array](topic:dsa/rotate-array).

## ⚠️ Common mistakes

- **Calling `reverse()` on data you don't own**, like a function argument or React state. It changes the caller's array.
- **Looping to `arr.length` instead of the middle.** You swap everything twice and end up where you started.
- **Off-by-one:** `right` must start at `arr.length - 1`, not `arr.length`.
- **Swapping without a temp variable**, which overwrites a value.

## 🗣️ How to answer in an interview

> "The quick way is arr.toReversed(), or a copy with spread followed by reverse, so the original isn't changed. Plain reverse() mutates the array.
>
> Without methods, I'll use two pointers. Left starts at 0, right at the last index. While left is less than right, I swap the two items and move both pointers inward. When they meet, the array is reversed.
>
> That's O(n) time, about n/2 swaps, and O(1) extra space, because it's in place. Empty and one-item arrays work without any special case."

## 🔁 Follow-up questions

### How do you reverse a string?

Strings can't be changed in place in JavaScript. Use `[...str].reverse().join('')`, or build a new string with a loop from the end. Spread handles emoji better than `split('')`.

### How do you reverse only part of an array?

Use the same two pointers, but start them at the given start and end positions.

### How do you reverse the words in a sentence?

`sentence.split(' ').reverse().join(' ')`. Watch out for extra spaces.

### Can you reverse an array with recursion?

Yes: swap the ends, then reverse the inside part. But it uses O(n) stack space, so the loop is better.

## ✅ Quick check

### 1. What does this print?

```js
const a = [1, 2, 3];          // original
const b = a.reverse();        // reverse it
console.log(a, a === b);      // ?
```

:::answer
**`[ 3, 2, 1 ] true`** — `reverse` changes `a` itself and returns the same array.
:::

### 2. How many swaps does the two-pointer reverse make for 6 items?

:::answer
**3** — (0,5), (1,4), (2,3). That's n/2.
:::

### 3. What is wrong here?

```js
for (let i = 0; i < arr.length; i++) {             // goes all the way to the end
  [arr[i], arr[arr.length - 1 - i]] = [arr[arr.length - 1 - i], arr[i]]; // swap
}
```

:::answer
It swaps every pair **twice** — once in the first half and again in the second half — so the array ends up **unchanged**. Loop only to the middle: `i < arr.length / 2`.
:::
