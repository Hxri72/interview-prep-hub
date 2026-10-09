---
title: Rotate an array by k
stack: dsa
order: 21
level: Intermediate
mustKnow: false
askedFrequency: common
summary:
  - "Rotate right by k: every item moves k places to the right, and items falling off the end wrap to the front. [1,2,3,4,5], k=2 → [4,5,1,2,3]."
  - "First do k = k % length: rotating by the length gives the same array back."
  - "Way 1: slice the last k items and put them before the rest. Way 2: a loop placing arr[i] at (i + k) % n."
  - "In place with O(1) extra space: reverse the whole array, then reverse the first k, then reverse the rest."
  - "All ways are O(n) time; only the reverse trick uses O(1) extra space."
cards:
  - q: Why do we write k = k % arr.length first?
    a: Rotating by the array's length brings every item back to where it started. So only the remainder matters, and it also stops slice from misbehaving when k is bigger than the length.
  - q: Where does the item at index i go when rotating right by k?
    a: "To index (i + k) % n. The % n makes it wrap around to the front."
  - q: What is the reverse trick for rotating in place?
    a: Reverse the whole array, then reverse the first k items, then reverse the remaining items. O(n) time, O(1) extra space.
  - q: How would you rotate LEFT by k?
    a: Rotating left by k is the same as rotating right by n - k. Or use slice(k) followed by slice(0, k).
  - q: What should you return for an empty array?
    a: An empty array. Also guard against dividing by zero, because k % 0 is NaN.
---

## 💡 What is it?

**Rotate right by k** means: move every item **k places to the right**. Items that fall off the end come back at the **front**.

```text
Input:  [1, 2, 3, 4, 5], k = 2
Output: [4, 5, 1, 2, 3]
```

## 🏠 Real-life example

Think of **students sitting in a circle** passing seats.

The teacher says: "Everyone move 2 seats to the right." The two students at the end walk round to the first seats.

- The **row of seats** = the array.
- **Moving 2 seats right** = rotating by k = 2.
- **Walking round to the start** = wrapping, done with `% n`.
- **Moving 5 seats in a circle of 5** = everyone is back in the same seat. That's why we do `k % n`.

## 🧑‍💻 Code example

Save as `rotate.js` and run `node rotate.js`.

```js
const nums = [1, 2, 3, 4, 5];                             // the list to rotate
const k = 2;                                              // move every item 2 places to the right

// Way 1 — array methods
function rotateWay1(arr, k) {                             // returns a NEW rotated list
  if (arr.length === 0) return [];                        // empty list → nothing to rotate
  const steps = k % arr.length;                           // k bigger than length? keep only the remainder
  const cut = arr.length - steps;                         // cut = where the "moving" tail starts
  return [...arr.slice(cut), ...arr.slice(0, cut)];       // tail first, then the front part
}                                                         // end of rotateWay1
console.log('Way 1:', JSON.stringify(rotateWay1(nums, k))); // print the result

// Way 2 — plain loop with the "wrap-around" index
function rotateWay2(arr, k) {                             // also returns a new list
  const n = arr.length;                                   // n = number of items
  const result = new Array(n);                            // a list with n empty slots
  for (let i = 0; i < n; i++) {                           // look at each position
    result[(i + k) % n] = arr[i];                         // item at i moves to i + k, wrapping past the end
  }                                                       // end of loop
  return result;                                          // the rotated list
}                                                         // end of rotateWay2
console.log('Way 2:', JSON.stringify(rotateWay2(nums, k))); // print the result
console.log('k = 7:', JSON.stringify(rotateWay2(nums, 7)), 'k = 5:', JSON.stringify(rotateWay2(nums, 5))); // big k wraps around
```

**Output (real run):**

```text
Way 1: [4,5,1,2,3]
Way 2: [4,5,1,2,3]
k = 7: [4,5,1,2,3] k = 5: [1,2,3,4,5]
```

`k = 7` is the same as `k = 2` (7 % 5 = 2). `k = 5` gives back the original.

## 🔍 Deeper version

**Complexity (n = length):**

| Way | Time | Extra space |
|---|---|---|
| slice + spread | O(n) | O(n) new array |
| Loop with `(i + k) % n` | O(n) | O(n) new array |
| Reverse three times (in place) | O(n) | **O(1)** |
| Move one step, k times | O(n × k) | O(1) — too slow |

**The reverse trick (in place):**

```js
function reverse(arr, left, right) {                // reverse arr between two positions
  while (left < right) {                            // stop when the two ends meet
    [arr[left], arr[right]] = [arr[right], arr[left]]; // swap the two ends
    left++;                                         // move the left end inward
    right--;                                        // move the right end inward
  }                                                 // end of while
}                                                   // end of reverse
function rotateInPlace(arr, k) {                    // rotate without a second list
  const n = arr.length;                             // number of items
  k = k % n;                                        // keep k inside 0..n-1
  reverse(arr, 0, n - 1);                           // 1) reverse everything
  reverse(arr, 0, k - 1);                           // 2) reverse the first k items
  reverse(arr, k, n - 1);                           // 3) reverse the rest
  return arr;                                       // same list, now rotated
}                                                   // end of rotateInPlace
console.log(JSON.stringify(rotateInPlace([1, 2, 3, 4, 5], 2))); // prints [4,5,1,2,3]
```

**Why it works**, with k = 2:

| Step | Array |
|---|---|
| Start | `[1, 2, 3, 4, 5]` |
| Reverse all | `[5, 4, 3, 2, 1]` |
| Reverse first 2 | `[4, 5, 3, 2, 1]` |
| Reverse the rest | `[4, 5, 1, 2, 3]` ✅ |

The full reverse puts the last k items at the front, but backwards. Reversing each part fixes their order. This uses the [two-pointers pattern](topic:dsa/pattern-two-pointers) inside `reverse`.

**Dry run of Way 2** (n = 5, k = 2): item at 0 (`1`) → slot 2; item at 3 (`4`) → slot `5 % 5 = 0`; item at 4 (`5`) → slot `6 % 5 = 1`.

**Edge cases:** empty array (guard against `k % 0`, which is `NaN`), k = 0, k = n, k much bigger than n, and an array with one item.

## 🎯 Why do we use it?

- Rotation shows up in circular things: round-robin scheduling, a circular buffer, rotating a carousel of cards on screen.
- It tests the **modulo (`%`) wrap-around** idea, which appears in many problems.
- It's a classic "now do it in O(1) space" follow-up question.

## ⚠️ Common mistakes

- **Forgetting `k % n`.** With k = 7 and n = 5, `slice(-7)` returns the whole array, giving a wrong answer.
- **Rotating the wrong way.** Right rotation moves the **last** items to the front. Left rotation moves the **first** items to the back.
- **Mutating when the caller expects a new array** (or the opposite). Ask which one they want.
- **Moving one step at a time k times.** That's O(n × k) and too slow for big k.

## 🗣️ How to answer in an interview

> "Rotating right by k means the last k items move to the front. First I'll do k = k % n, because rotating by n gives the same array.
>
> Easy version: `[...arr.slice(n - k), ...arr.slice(0, n - k)]`. That's O(n) time and O(n) space. With a loop I place each item at `(i + k) % n`.
>
> If they want it in place with O(1) extra space, I use the reverse trick: reverse everything, then the first k, then the rest. Still O(n) time.
>
> Let me dry-run `[1, 2, 3, 4, 5]` with k = 2… reverse all gives `[5, 4, 3, 2, 1]`, then `[4, 5, 3, 2, 1]`, then `[4, 5, 1, 2, 3]`. And I've handled the empty array and k bigger than n."

## 🔁 Follow-up questions

### How do you rotate left by k?

Rotating left by k is rotating right by `n - k`. Or: `[...arr.slice(k), ...arr.slice(0, k)]` (after `k = k % n`).

### How would you rotate a string?

The same idea: `s.slice(n - k) + s.slice(0, n - k)`. A related question: "Is B a rotation of A?" Check `A.length === B.length && (A + A).includes(B)`.

### How do you rotate a 2D matrix by 90 degrees?

Transpose it (swap `m[i][j]` with `m[j][i]`), then reverse each row. That rotates it clockwise in place.

### Can you do it with `unshift` and `pop`?

Yes: `pop` the last item and `unshift` it, k times. But `unshift` shifts every item, so each step is O(n). The total is O(n × k).

## ✅ Quick check

### 1. What does rotating `[1, 2, 3]` right by k = 4 give?

:::answer
**`[3, 1, 2]`**. First 4 % 3 = 1, so it's a rotation by 1. The last item moves to the front.
:::

### 2. Which approach rotates in place with O(1) extra space?

- A) slice + spread
- B) A new array filled with `(i + k) % n`
- C) Reverse the whole array, then the first k, then the rest

:::answer
**C.** The other two build a new array of size n.
:::

### 3. Why is `if (arr.length === 0) return []` needed before `k % arr.length`?

:::answer
`k % 0` is `NaN` in JavaScript, which breaks the slicing maths. An empty array has nothing to rotate, so return it straight away.
:::
