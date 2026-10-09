---
title: Recursion basics
stack: dsa
order: 5
level: Basic
mustKnow: false
askedFrequency: common
summary:
  - Recursion means a function calls itself on a smaller version of the same problem.
  - "Every recursive function needs a BASE CASE (when to stop) and a step that moves towards it."
  - Each call waits on the call stack, so n nested calls use O(n) extra memory.
  - Too many nested calls cause "Maximum call stack size exceeded" — a loop avoids this.
  - Recursion is natural for nested data (trees, folders, nested arrays, JSON).
cards:
  - q: What two parts does every recursive function need?
    a: A base case that stops the calls, and a recursive step that calls itself with a smaller input.
  - q: What happens if you forget the base case?
    a: The function calls itself forever until the call stack is full — RangeError, Maximum call stack size exceeded.
  - q: What is the space complexity of summing an array recursively?
    a: O(n), because n calls are waiting on the call stack at the same time.
  - q: When is recursion a better fit than a loop?
    a: For nested or tree-shaped data, like a nested array, a folder tree, or a comment thread.
  - q: Can every recursive solution be written with a loop?
    a: Yes. You can always use a loop with your own stack (an array) instead of the call stack.
---

## 💡 What is it?

**Recursion** is when a [function](glossary:function) **calls itself**.

Each call solves a **smaller** piece of the problem. It stops at a simple case it can answer directly. That stopping point is called the **base case**.

## 🏠 Real-life example

Think of **counting people in a queue at the canteen**, when you can't see the whole line.

You tap the person in front: "How many people are in front of you?" They tap the next person and ask the same thing. This goes on.

- The **first person in the queue** says "zero". That's the **base case**.
- Each person then **adds 1** and passes the answer back.
- The answer comes all the way back to you.

Each person did the same small job. Together they solved the big problem.

## 🧑‍💻 Code example

Save as `recursion.js` and run `node recursion.js`.

```js
// Way 1 — recursion: the function calls itself on a smaller problem
function sumRecursive(arr, i = 0) {          // arr = the list, i = where we are now (starts at 0)
  if (i === arr.length) return 0;            // BASE CASE: past the end → nothing left to add
  return arr[i] + sumRecursive(arr, i + 1);  // this item + the sum of the rest
}                                            // end of sumRecursive

// Way 2 — a plain loop doing the same job
function sumLoop(arr) {                      // same input
  let total = 0;                             // running total starts at 0
  for (let i = 0; i < arr.length; i++) {     // visit each position
    total += arr[i];                         // add this item
  }                                          // end of the loop
  return total;                              // give back the total
}                                            // end of sumLoop

function factorial(n) {                      // n! = n × (n-1) × … × 1
  if (n <= 1) return 1;                      // BASE CASE: 1! and 0! are 1
  return n * factorial(n - 1);               // n times the factorial of one less
}                                            // end of factorial

console.log(sumRecursive([1, 2, 3, 4]));     // recursion version
console.log(sumLoop([1, 2, 3, 4]));          // loop version
console.log(factorial(5));                   // 5 × 4 × 3 × 2 × 1
console.log(sumRecursive([]));               // edge case: empty list
```

**Output:**

```text
10
10
120
0
```

## 🔍 Deeper version

**How it runs (dry run of `sumRecursive([1, 2, 3, 4])`):**

| Call | i | Waits for… | Returns |
|---|---|---|---|
| 1 | 0 | `1 + sum(from 1)` | 1 + 9 = **10** |
| 2 | 1 | `2 + sum(from 2)` | 2 + 7 = 9 |
| 3 | 2 | `3 + sum(from 3)` | 3 + 4 = 7 |
| 4 | 3 | `4 + sum(from 4)` | 4 + 0 = 4 |
| 5 | 4 | base case | 0 |

Each call **waits** on the [call stack](glossary:call-stack) until the one below it returns.

**Complexity:**

| Version | Time | Space |
|---|---|---|
| Recursive sum | O(n) | **O(n)** — n calls waiting on the stack |
| Loop sum | O(n) | **O(1)** — just one variable |

**The stack limit.** JavaScript allows roughly ten thousand nested calls (it depends on the engine and the memory). Recursing over 100,000 items throws `RangeError: Maximum call stack size exceeded`. For long lists, a loop is safer.

**The three-question recipe** for writing any recursive function:
1. What is the **smallest input** I can answer directly? (base case)
2. If I had the answer for a **smaller input**, how would I build the answer for this one?
3. Does every call **move towards** the base case?

**Where recursion shines:** nested data. [Flattening a nested array](topic:dsa/flatten-array) is much easier with recursion than with loops.

## 🎯 Why do we use it?

- **Tree-shaped data:** folder structures, nested comments, menus, the DOM, JSON.
- **Divide and conquer:** merge sort and quick sort split the problem in half again and again. See [sorting algorithms](topic:dsa/sorting-algorithms).
- **Clear code:** some problems are much shorter written recursively.

## ⚠️ Common mistakes

- **No base case**, or a base case that's never reached. You get an infinite loop of calls.
- **Not making the input smaller** (for example, calling `f(n)` inside `f(n)`).
- **Forgetting to `return`** the recursive result, so you get `undefined`.
- **Using recursion on huge lists**, which overflows the stack.

## 🗣️ How to answer in an interview

> "Recursion is when a function calls itself on a smaller version of the problem. Every recursive function needs a base case to stop, and a step that moves towards it.
>
> For example, to sum an array, the base case is an empty rest of the array, which sums to 0. Otherwise, it's the current item plus the sum of the rest.
>
> Each call sits on the call stack, so the space is O(n), and very deep recursion can overflow the stack. For flat lists I'd use a loop. For nested data like trees or nested arrays, recursion is often the cleanest solution."

## 🔁 Follow-up questions

### What is tail recursion?

When the recursive call is the very last thing the function does. Some languages optimise it so the stack doesn't grow. JavaScript engines (except Safari) don't, so don't rely on it.

### How do you avoid repeating work in recursive Fibonacci?

Use [memoization](topic:javascript/memoization): store answers you've already calculated in a Map. It turns O(2ⁿ) into O(n).

### How would you turn recursion into a loop?

Keep your own stack in an array. Push the first item, then loop: pop an item, process it, and push its children.

### What's the difference between recursion and iteration?

Iteration repeats with a loop and uses O(1) extra memory. Recursion repeats by calling itself and uses stack memory.

## ✅ Quick check

### 1. What does this print?

```js
function countDown(n) {          // a recursive countdown
  if (n === 0) return 'done';    // base case
  return countDown(n - 1);       // smaller problem
}
console.log(countDown(3));       // ?
```

:::answer
**`done`** — 3 → 2 → 1 → 0, and 0 hits the base case.
:::

### 2. What goes wrong here?

```js
function f(n) {        // no base case
  return n + f(n - 1); // always calls itself
}
f(5);
```

:::answer
There's no base case, so it never stops. It throws **`RangeError: Maximum call stack size exceeded`**.
:::

### 3. Space complexity of `factorial(n)` written recursively?

:::answer
**O(n)** — up to n calls wait on the call stack at once.
:::
