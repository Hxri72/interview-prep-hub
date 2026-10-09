---
title: Big O in simple words (time and space)
stack: dsa
order: 2
level: Basic
mustKnow: true
askedFrequency: very common
summary:
  - "Big O answers one question: if the input gets 10 times bigger, how much slower does my code get?"
  - "Common ones, fast to slow: O(1), O(log n), O(n), O(n log n), O(n²)."
  - One loop is O(n). A loop inside a loop over the same data is O(n²). Two loops one after another is still O(n).
  - Hidden loops count — includes, indexOf and filter inside a loop make it O(n²).
  - "Space complexity = extra memory: a new array or Map of size n is O(n); a few variables is O(1)."
cards:
  - q: What does Big O measure?
    a: How the running time (or memory) grows as the input size n grows. It ignores small constants.
  - q: Two separate loops over the array, one after the other — what is the Big O?
    a: O(n). It's 2n steps, and we drop the constant 2.
  - q: Why is arr.includes(x) inside a for loop O(n²)?
    a: includes is a hidden loop over the array. A loop inside a loop is O(n²).
  - q: What is O(log n)? Give an example.
    a: Work that cuts the problem in half each step, like binary search. 1,000,000 items need about 20 steps.
  - q: What is the space complexity of making a Set of the input?
    a: O(n) — the Set can hold up to n values.
---

## 💡 What is it?

**Big O** tells you how your code slows down as the input grows.

`n` means the number of items. Big O answers: **"If the array gets 10 times bigger, how much slower does my code get?"**

**Space complexity** asks the same question about **extra memory**.

## 🏠 Real-life example

Think of a **teacher with a class of students**.

- **O(1):** "Is the first student here?" One look, however big the class. → Constant.
- **O(n):** "Check every student's homework." Double the class, double the work. → Linear.
- **O(n²):** "Every student shakes hands with every other student." Double the class, **four times** the handshakes. → Quadratic.
- **O(log n):** finding a name in a **sorted register** by opening it in the middle, then the middle of the half, and so on. → Logarithmic.

## 🧑‍💻 Code example

This program **counts the steps** for three kinds of code at n = 10, 100 and 1000. Save as `big-o.js` and run `node big-o.js`.

```js
// Count how many steps each kind of code takes
function linearSteps(n) {                    // O(n): one loop over n items
  let steps = 0;                             // start the counter at 0
  for (let i = 0; i < n; i++) steps++;       // one step for each item
  return steps;                              // give back the count
}                                            // end of linearSteps

function quadraticSteps(n) {                 // O(n²): a loop inside a loop
  let steps = 0;                             // start the counter at 0
  for (let i = 0; i < n; i++) {              // outer loop: n times
    for (let j = 0; j < n; j++) steps++;     // inner loop: n times for EACH outer step
  }                                          // end of the outer loop
  return steps;                              // give back the count
}                                            // end of quadraticSteps

function binarySteps(n) {                    // O(log n): cut the work in half each time
  let steps = 0;                             // start the counter at 0
  while (n > 1) {                            // keep going while more than 1 item is left
    n = Math.floor(n / 2);                   // throw away half
    steps++;                                 // that was one step
  }                                          // end of the while loop
  return steps;                              // give back the count
}                                            // end of binarySteps

for (const n of [10, 100, 1000]) {           // try three sizes: 10, 100 and 1000 items
  console.log(`n=${n}  O(log n)=${binarySteps(n)}  O(n)=${linearSteps(n)}  O(n²)=${quadraticSteps(n)}`); // print all three counts
}                                            // end of the loop
```

**Output:**

```text
n=10  O(log n)=3  O(n)=10  O(n²)=100
n=100  O(log n)=6  O(n)=100  O(n²)=10000
n=1000  O(log n)=9  O(n)=1000  O(n²)=1000000
```

**What to notice:** when n grows 10 times, O(n) grows 10 times, O(n²) grows **100 times**, and O(log n) grows by just **3 steps**.

## 🔍 Deeper version

**The common ones, fast to slow:**

| Big O | Name | Simple meaning | Example |
|---|---|---|---|
| O(1) | Constant | Same speed for any size | `arr[5]`, `map.get(k)`, `arr.push(x)` |
| O(log n) | Logarithmic | Cuts the problem in half each step | Binary search |
| O(n) | Linear | Looks at each item once | One `for` loop, `filter`, `includes` |
| O(n log n) | Linearithmic | A bit more than linear | `arr.sort()` |
| O(n²) | Quadratic | Every pair | A loop inside a loop |

**Quick rules:**
1. **Drop constants.** 2n or 3n is still O(n).
2. **Drop smaller terms.** n² + n is O(n²).
3. **Loops one after another add up:** O(n) + O(n) = O(n).
4. **Loops inside each other multiply:** O(n) × O(n) = O(n²).
5. **Different inputs get different letters:** a loop over `a` inside a loop over `b` is O(a × b).
6. **Hidden loops count:** `includes`, `indexOf`, `filter`, `find`, spread `[...arr]` are all O(n).

**Space complexity:**
- A few variables → **O(1)**.
- A new array, Set or Map with up to n items → **O(n)**.
- [Recursion](topic:dsa/recursion) uses stack space: n nested calls → O(n).

**Best, average and worst case.** Big O usually means the **worst case**. Example: `includes` might find the value first (best case), but in the worst case it checks everything, so we say O(n).

## 🎯 Why do we use it?

- To **compare two solutions** without running them.
- To know if code will survive **real data**. An O(n²) loop is fine for 100 items, but 1,000,000 items means 10¹² steps. That freezes a server.
- Interviewers **always** ask "what's the complexity?" at the end.

## ⚠️ Common mistakes

- **Missing hidden loops**, like `arr.includes()` inside a `for` loop.
- **Saying O(2n).** Drop the constant: O(n).
- **Forgetting space.** A Set or Map makes space O(n), not O(1).
- **Calling sort O(n).** JavaScript's sort is O(n log n).

## 🗣️ How to answer in an interview

> "Big O describes how the running time or memory grows as the input size grows, usually in the worst case, ignoring constants. One loop over the input is O(n), a nested loop over the same input is O(n²), and halving the problem each step, like binary search, is O(log n).
>
> For my solution: I loop once and use a Map for lookups, which are O(1), so the time is O(n). The Map can hold up to n items, so the space is O(n). The brute force would have been O(n²) time but O(1) space, so I'm trading memory for speed."

## 🔁 Follow-up questions

### Is Map.get always O(1)?

On average, yes. Hash maps can have rare slow cases, but in interviews we treat them as O(1).

### What is the Big O of `[...arr].sort()`?

Copying is O(n) and sorting is O(n log n). The bigger one wins: **O(n log n)** time, O(n) extra space for the copy.

### Is a faster Big O always better?

For big inputs, yes. For tiny inputs (like 10 items), simple code may be just as fast and easier to read.

### What is amortised O(1)?

Most `push` calls are instant. Sometimes the array must grow and copy itself, which is slow. **On average** it's still O(1). That average is called "amortised".

## ✅ Quick check

### 1. What is the time complexity?

```js
for (const x of a) {           // loop over a
  if (b.includes(x)) count++;  // includes loops over b
}
```

:::answer
**O(a × b)** — `includes` is a hidden loop over `b` inside the loop over `a`. If both have size n, it's O(n²). Putting `b` in a Set first makes it O(a + b).
:::

### 2. Two loops over the same array, one after the other. Big O?

:::answer
**O(n).** n + n = 2n, and we drop the 2.
:::

### 3. Binary search on 1,000,000 sorted items needs about how many steps?

- A) 1,000,000
- B) 1,000
- C) 20

:::answer
**C) about 20.** Halving 1,000,000 about 20 times gets you down to 1 (2²⁰ ≈ 1,000,000).
:::
