---
title: "Pattern: stack (valid brackets)"
stack: dsa
order: 31
level: Intermediate
mustKnow: true
askedFrequency: very common
summary:
  - "A stack is last in, first out (LIFO): the last thing you push is the first thing you pop."
  - In JavaScript, use an array with push() and pop() — both O(1).
  - "Keywords: \"brackets\", \"matching pairs\", \"undo\", \"most recent\", \"next greater element\"."
  - "Valid brackets: push every opening bracket; every closing bracket must match the top of the stack."
  - One pass, O(n) time, O(n) space in the worst case.
cards:
  - q: What does LIFO mean?
    a: Last in, first out. The most recently added item is the first one removed, like a pile of plates.
  - q: How do you build a stack in JavaScript?
    a: Use an array with push() to add on top and pop() to remove from the top. Both are O(1).
  - q: How does the valid-brackets solution work?
    a: Push each opening bracket. For a closing bracket, pop and check it matches. At the end the stack must be empty.
  - q: Why must the stack be empty at the end?
    a: Anything left is an opening bracket that never got closed, like "((".
  - q: Name another problem solved with a stack.
    a: Next greater element (monotonic stack), undo history, evaluating expressions, or checking HTML tags.
---

## 💡 What is it?

A **stack** is a pile. You can only add to the **top** and take from the **top**. The last item you added is the first one you take out. This is called **LIFO**: last in, first out.

In JavaScript, an array is a stack: `push()` adds on top, `pop()` removes from the top.

**Spot it when the question says:** "brackets", "matching pairs", "undo", "most recent", "next greater element".

## 🏠 Real-life example

Think of a **pile of plates in the school canteen**.

Clean plates are put **on top** of the pile. Students take a plate **from the top**. Nobody pulls a plate from the bottom.

Now imagine each opening bracket is a plate you put down, and each closing bracket must pick up the **matching** plate from the top. If the top plate doesn't match, something is wrong.

- The **pile of plates** = the stack (an array).
- **Putting a plate down** = `stack.push('(')`.
- **Taking the top plate** = `stack.pop()`.
- **Plates left at the end** = brackets that were never closed.

## 🧑‍💻 Code example

Problem: **are the brackets valid?** `"({[]})"` → true, `"(]"` → false (LeetCode "Valid Parentheses"). Save as `stack.js` and run `node stack.js`.

```js
// Problem: are the brackets valid? e.g. "({[]})" → true, "(]" → false
function isValidBrute(s) {                         // brute force: keep removing "()", "[]", "{}"
  let prev = '';                                   // string before this round
  while (s !== prev) {                             // stop when nothing changes
    prev = s;                                      // remember this round's string
    s = s.replace('()', '').replace('[]', '').replace('{}', ''); // remove one empty pair of each kind
  }                                                // end of loop
  return s === '';                                 // valid only if everything was removed
}                                                  // end of isValidBrute

function isValid(s) {                              // stack pattern
  const stack = [];                                // array used as a stack (push / pop at the end)
  const pairs = { ')': '(', ']': '[', '}': '{' };  // closing → its matching opening
  for (const ch of s) {                            // read each character once
    if (ch === '(' || ch === '[' || ch === '{') stack.push(ch); // opening → save it on top
    else if (stack.pop() !== pairs[ch]) return false; // closing must match the last opening
  }                                                // end of loop
  return stack.length === 0;                       // nothing left open → valid
}                                                  // end of isValid

const tests = ['({[]})', '(]', '((', ''];        // test cases (the last one is an empty string)
for (const t of tests) {                           // check each test case
  console.log(JSON.stringify(t), isValidBrute(t), isValid(t)); // both ways should agree
}                                                  // end of loop
```

**Output:**

```text
"({[]})" true true
"(]" false false
"((" false false
"" true true
```

The brute force removes pairs again and again. Each `replace` scans the string, and it may repeat about n/2 times: **O(n²)**. The stack reads each character once: **O(n)** time, **O(n)** space.

## 🔍 Deeper version

**Template:**

```js
const stack = [];                      // empty pile
for (const item of input) {            // one pass
  if (/* should open / remember */) stack.push(item);  // put on top
  else {
    const top = stack.pop();           // take the most recent
    // compare top with item; fail if it doesn't fit
  }
}
// often: the stack must be empty at the end
```

**Monotonic stack** (a common next step): keep the stack always increasing or decreasing. It solves "next greater element" in O(n). For each number, pop every smaller number from the stack. The current number is their "next greater".

**Why a stack fits brackets:** brackets close in the **reverse order** they opened. `({[` must close as `]})`. The most recent opening is always the one that must close next. That is exactly LIFO.

**Complexity:** **O(n)** time. **O(n)** space in the worst case, like `"(((((("`.

**More problems:** Valid Parentheses, Min Stack, Daily Temperatures / Next Greater Element (monotonic stack), and evaluating Reverse Polish Notation.

## 🎯 Why do we use it?

Many problems need **"the most recent unfinished thing"**: the last open bracket, the last action to undo, or the last page in browser history. A stack gives you that in O(1). Your code also uses one all the time: the JavaScript [call stack](glossary:call-stack) tracks which function to return to.

## ⚠️ Common mistakes

- **Forgetting the final check** that the stack is empty, so `"(("` wrongly passes.
- **Popping from an empty stack** without thinking. In JS, `pop()` returns `undefined`, which won't match, so it fails correctly here. But say it out loud.
- **Using `shift()` / `unshift()`** (the front of the array) instead of `push()` / `pop()`. Front operations are O(n).
- **Counting brackets** instead of using a stack. Counting can't tell `"([)]"` (invalid) from `"([])"` (valid).

## 🗣️ How to answer in an interview

> "Brackets must close in the reverse order they opened, so this is a stack problem. I go through the string once. For an opening bracket, I push it. For a closing bracket, I pop the top and check it's the matching opening bracket; if not, I return false. At the end, the stack must be empty, otherwise something wasn't closed. It's O(n) time and O(n) space. A simple counter wouldn't work, because it can't catch wrongly nested brackets like '([)]'."

## 🔁 Follow-up questions

### Why can't you just count opening and closing brackets?

Counts can match while the order is wrong. `"([)]"` has two of each, but it's invalid. Only a stack checks the order.

### How would you return the position of the first wrong bracket?

Push indexes instead of characters. When a closing bracket doesn't match, return its index. At the end, if the stack isn't empty, return the index still on top.

### What is a monotonic stack?

A stack you keep sorted (always increasing or decreasing) by popping items that break the order. It answers "next greater/smaller element" for every item in O(n).

### Stack vs queue?

A stack is last in, first out. A [queue](glossary:queue) is first in, first out, like a line at the canteen counter.

## ✅ Quick check

### 1. Is `"{[()]}"` valid? What does the stack look like before the first closing bracket?

:::answer
**Valid.** Before the first `)`, the stack is `['{', '[', '(']`. Then `)` pops `(`, `]` pops `[`, `}` pops `{`. The stack ends empty.
:::

### 2. Why does `"(()"` return false?

:::answer
After reading it, one `(` is still on the stack. The stack isn't empty, so a bracket was never closed.
:::
