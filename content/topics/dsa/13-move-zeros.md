---
title: Move zeros to the end
stack: dsa
order: 13
level: Basic
mustKnow: true
askedFrequency: very common
summary:
  - "Move every 0 to the end and keep the other numbers in their original order."
  - "Way 1: [...non-zeros, ...zeros] with two filters. Clear, but makes a new array."
  - "Way 2 (in place): a pointer pos marks where the next non-zero goes. Swap each non-zero forward."
  - "In place = O(n) time and O(1) extra space. This is the two-pointers pattern."
  - "This is LeetCode \"Move Zeroes\"."
cards:
  - q: How do you move zeros to the end in place?
    a: Keep pos = 0. Walk with i. When arr[i] is not 0, swap arr[i] with arr[pos] and do pos++. Zeros end up at the back.
  - q: Does the order of non-zero numbers stay the same?
    a: Yes. Non-zeros are moved forward in the order we meet them, so their order is kept (stable).
  - q: What is the complexity of the in-place solution?
    a: O(n) time, one pass. O(1) extra space, since we only use one extra variable.
  - q: Why not just sort?
    a: Sorting changes the order of the non-zero numbers, and it is O(n log n).
  - q: What pattern is this?
    a: Two pointers. One pointer reads (i), one pointer writes (pos).
---

## 💡 What is it?

Move all `0`s in an array to the **end**. Keep the other numbers in the **same order**.

| Input | Output |
|---|---|
| `[0, 1, 0, 3, 12]` | `[1, 3, 12, 0, 0]` |
| `[0]` | `[0]` |
| `[1, 2, 3]` | `[1, 2, 3]` |

Often the interviewer adds: "do it **in place**". That means change the same array, without making a new one.

## 🏠 Real-life example

Think of **packing a school bag shelf**.

Some slots on the shelf have books, and some are empty. You want all books pushed to the left, in the same order, and the empty slots at the right.

You keep one finger on "the next free slot on the left". You look at each slot. When you find a book, you move it to your finger's slot, and move your finger one step right.

- **Slots** = array positions.
- **Books** = non-zero numbers. **Empty slots** = zeros.
- **Your finger** = `pos`.
- **Your eyes moving along the shelf** = `i`.

## 🧑‍💻 Code example

Save as `move-zeros.js` and run `node move-zeros.js`.

```js
// Way 1 — array methods (makes a new array)
const moveZerosM = (arr) => [                 // build a brand-new array from two parts
  ...arr.filter((x) => x !== 0),              // all non-zero numbers, in their original order
  ...arr.filter((x) => x === 0),              // then all the zeros
];                                            // end of the new array

// Way 2 — plain loop, in place (changes the same array)
function moveZerosL(arr) {                    // arr = the array to fix
  let pos = 0;                                // pos = where the next non-zero number should go
  for (let i = 0; i < arr.length; i++) {      // walk through every position
    if (arr[i] !== 0) {                       // found a non-zero number
      [arr[pos], arr[i]] = [arr[i], arr[pos]];// swap it forward to position pos
      pos++;                                  // the next non-zero goes one place later
    }                                         // end of the if
  }                                           // end of the loop
  return arr;                                 // same array, now fixed
}                                             // end of moveZerosL

console.log(moveZerosM([0, 1, 0, 3, 12]));    // [ 1, 3, 12, 0, 0 ]
console.log(moveZerosL([0, 1, 0, 3, 12]));    // [ 1, 3, 12, 0, 0 ]
console.log(moveZerosL([1, 2, 3]));           // [ 1, 2, 3 ] → no zeros, nothing moves
```

**Output:**

```text
[ 1, 3, 12, 0, 0 ]
[ 1, 3, 12, 0, 0 ]
[ 1, 2, 3 ]
```

## 🔍 Deeper version

**Complexity:**

| Way | Time | Space | Changes input? |
|---|---|---|---|
| two filters | O(n) (two passes) | O(n) new array | no |
| swap in place | O(n) (one pass) | **O(1)** | yes |

**Dry run** of the in-place way on `[0, 1, 0, 3, 12]`:

| i | arr[i] | action | array after | pos |
|---|---|---|---|---|
| 0 | 0 | skip | `[0,1,0,3,12]` | 0 |
| 1 | 1 | swap 0↔1 | `[1,0,0,3,12]` | 1 |
| 2 | 0 | skip | `[1,0,0,3,12]` | 1 |
| 3 | 3 | swap 1↔3 | `[1,3,0,0,12]` | 2 |
| 4 | 12 | swap 2↔4 | `[1,3,12,0,0]` | 3 |

**Why it's correct:** everything before `pos` is a non-zero in the original order. Everything between `pos` and `i` is a zero.

**Fewer writes:** another version copies non-zeros forward (`arr[pos++] = arr[i]`), then fills the rest with 0. Both are O(n). The swap version is one pass and doesn't need a second loop.

**Small improvement:** skip the swap when `pos === i`, so you don't swap a number with itself.

## 🎯 Why do we use it?

- **The two-pointers idea** ("read pointer + write pointer") also solves: remove duplicates from a sorted array, remove an element in place, and partition by a condition.
- **Real code:** pushing "empty" or "inactive" items to the end of a list while keeping the order of the rest.

## ⚠️ Common mistakes

- **Using `sort`.** It scrambles the order of non-zero numbers.
- **Using `splice` + `push` inside a loop.** Removing an item shifts indexes, so you skip numbers. It is also O(n²).
- **Forgetting the "in place" requirement** and returning a new array when the interviewer asked not to.
- **Moving `pos` on zeros.** `pos` should only move after placing a non-zero.

## 🗣️ How to answer in an interview

> "Should I keep the order of the non-zero numbers, and do it in place? Okay.
>
> The easy version is two filters: non-zeros first, then zeros. That's O(n) but makes a new array.
>
> In place, I'll use two pointers. `pos` is where the next non-zero should go. I scan with `i`. Every time I see a non-zero, I swap it with `arr[pos]` and move `pos` forward. At the end, all zeros are at the back and the order is kept.
>
> That's O(n) time and O(1) extra space. Let me dry-run [0, 1, 0, 3, 12]…"

## 🔁 Follow-up questions

### Move zeros to the front instead.

Walk from the end backwards with `pos` starting at the last index. Place non-zeros at `pos` and move `pos` left.

### Remove all copies of a value in place and return the new length.

Same read/write pointers: copy values that are not the target to `arr[pos++]`. Return `pos`.

### What if the order of non-zero numbers doesn't matter?

Use pointers from both ends. Swap a zero on the left with a non-zero on the right. Fewer swaps.

### Is the in-place solution stable?

Yes for the non-zero numbers. They keep their relative order.

## ✅ Quick check

### 1. After the loop, what is `pos` for `[0, 1, 0, 3, 12]`?

:::answer
**3.** There are 3 non-zero numbers, so `pos` moved 3 times. It also tells you where the zeros start.
:::

### 2. Why is `arr.sort((a, b) => (a === 0) - (b === 0))` risky in an interview?

:::answer
It works in modern JavaScript because `sort` is stable since ES2019. But it is O(n log n), and it hides the idea the interviewer wants to see: two pointers in O(n).
:::
