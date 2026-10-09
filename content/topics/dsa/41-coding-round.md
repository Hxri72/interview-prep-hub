---
title: What to say in the coding round (phrases and mistakes)
stack: dsa
order: 41
level: Basic
mustKnow: true
askedFrequency: very common
summary:
  - "Talk while you think. The interviewer marks your thinking, not just the final code."
  - "Follow the same order every time: repeat the question → ask about edge cases → brute force → improve → code → dry run → say the Big O."
  - "Before saying \"done\", test your code against edge cases: empty, one item, duplicates, negatives."
  - "Practise 1–2 problems a day for 4 weeks, without AI, and keep a mistake notebook."
  - "If you can't finish, explain clearly how you would. A clear plan scores better than rushed broken code."
cards:
  - q: What should you say first in a coding round?
    a: Repeat the question in your own words, then ask about edge cases — can the array be empty, have negatives or duplicates, is it sorted?
  - q: Why say the brute-force solution before the optimal one?
    a: It shows you understand the problem, gives a working baseline with its Big O, and lets you explain why the better solution is better.
  - q: Which edge cases should you always test?
    a: An empty array, one item, all items the same, negative numbers, and duplicates.
  - q: What goes in a mistake notebook?
    a: For every problem — the pattern used, the mistake you made, and one line on the key idea. Read it before each interview.
  - q: What should you do if you're stuck for a long time?
    a: Think out loud about which pattern might fit. In practice, after about 25 minutes, read the solution, close it, and write it yourself again; revisit it 3 days later.
---

## 💡 What is it?

The **coding round** is the part of an interview where you solve a problem live, often on a shared editor or on paper.

The interviewer is checking **how you think**, not only whether the code runs. So *what you say* matters as much as *what you type*.

This page gives you a **script to follow**, **phrases to use**, the **mistakes to avoid**, and a **4-week practice plan**.

## 🏠 Real-life example

Think of a **maths exam where the teacher gives marks for working**, not just the final answer.

If you write only "42", you get 1 mark, or 0 if it's wrong. If you show each step, you get most of the marks even when the last line has a small slip.

- **Showing your working** = talking through your thinking.
- **Checking your answer at the end** = the dry run and edge-case tests.
- **The marking scheme** = understanding, approach, code quality, testing and complexity.

## 🧑‍💻 Code example

Before you say "I'm done", **test your solution against edge cases**. This tiny harness does that. Save as `harness.js`. Run `node harness.js`.

```js
// A tiny test harness: run your solution against normal AND edge cases before you say "done"
function secondLargest(arr) {                          // the solution we want to test
  let first = -Infinity, second = -Infinity;           // smaller than any real number
  for (const x of arr) {                               // one pass over the array
    if (x > first) { second = first; first = x; }      // new biggest → old biggest becomes second
    else if (x > second && x !== first) second = x;    // between them, and not a copy of first
  }                                                    // end of the loop
  return second === -Infinity ? null : second;         // null when there is no second largest
}                                                      // end of secondLargest

const cases = [                                        // [input, expected answer]
  [[10, 5, 20, 20, 8], 10],                            // normal case with a duplicate biggest
  [[], null],                                          // edge: empty array
  [[7], null],                                         // edge: one item
  [[3, 3, 3], null],                                   // edge: all the same
  [[-5, -2, -9], -5],                                  // edge: all negative
];                                                     // end of the test cases

for (const [input, expected] of cases) {               // run every case
  const got = secondLargest(input);                    // what our function returns
  const ok = got === expected ? 'PASS' : 'FAIL';       // compare with the expected answer
  console.log(ok, JSON.stringify(input), '→', got);    // print one line per case
}                                                      // end of the test loop
```

**Output:**

```text
PASS [10,5,20,20,8] → 10
PASS [] → null
PASS [7] → null
PASS [3,3,3] → null
PASS [-5,-2,-9] → -5
```

In a live interview you won't write a full harness. But walk through the **same cases out loud**. See [second largest](topic:dsa/second-largest) for this problem.

## 🔍 Deeper version

**The 7-step script** (the full version is in [how to approach a problem](topic:dsa/approach)):

| Step | What to do |
|---|---|
| 1. Understand | Repeat the question in your own words. |
| 2. Ask | Empty? Negatives? Duplicates? Sorted? What to return if there's no answer? |
| 3. Examples | One normal example and one edge case. |
| 4. Brute force | Say the simplest way and its Big O. |
| 5. Improve | Can a Map, two pointers, sorting or a sliding window help? |
| 6. Code | Clear names; explain each part as you write. |
| 7. Test | Dry-run your example, check edge cases, say the time and space. |

**Phrases you can use word for word:**

| Moment | What to say |
|---|---|
| Starting | "Let me repeat the question to make sure I understood it…" |
| Asking | "Can the array be empty? Can it have negative numbers or duplicates? Is it sorted?" |
| Brute force | "The simple way is to check every pair with two loops. That's O(n²). Let me see if I can do better." |
| Improving | "If I store what I've seen in a Map, I can check in O(1), so the whole thing becomes O(n)." |
| Stuck | "I'm thinking about whether sorting first or two pointers would help here…" |
| Methods vs loops | "I'll use `filter` here because it's clear. I can also write it with a plain loop if you'd like." |
| Testing | "Let me dry-run it with the example… and check the empty array case." |
| Finishing | "Time is O(n) because I loop once; space is O(n) for the Set." |

**4-week practice plan** (1 hour a day, 1–2 problems, in JavaScript, **no AI**):

| Week | Focus | Example problems (LeetCode names) |
|---|---|---|
| 1 | Arrays and hash maps | Two Sum, Contains Duplicate, Move Zeroes, Missing Number, Valid Anagram |
| 2 | Two pointers and strings | Valid Palindrome, Merge Sorted Array, Two Sum II, Container With Most Water |
| 3 | Sliding window, Kadane, prefix sum | Best Time to Buy and Sell Stock, Maximum Subarray, Longest Substring Without Repeating Characters |
| 4 | Binary search, stack, mixed | Binary Search, Valid Parentheses, Group Anagrams, Top K Frequent Elements, 3Sum |

Also do the "Arrays" and "Strings" sections of HackerRank's Interview Preparation Kit. HackerRank tests often **read input and print output**, so practise that format too.

**Stuck rule:** if you're stuck for 25 minutes, read the solution, understand it, **close it**, and write it again yourself. Come back to it **3 days later**.

**Mistake notebook:** for every problem, write three things: the **pattern**, **your mistake**, and **one line on the key idea**. Read it before every interview.

## 🎯 Why do we use it?

- Many candidates who *can* solve the problem fail because they stay silent, rush, or skip testing.
- A clear script calms your nerves: you always know the next step.
- Interviewers often help candidates who think out loud. They can't help if they can't follow you.

## ⚠️ Common mistakes

- **Starting to code before you understand the question.**
- **Staying silent.** The interviewer can't give marks for thinking they can't hear.
- **Forgetting edge cases:** empty array, one item, all duplicates, negative numbers.
- **Using `sort()` on numbers without `(a, b) => a - b`.**
- **Changing the input array** when you weren't asked to. `sort`, `reverse` and `splice` change it.
- **Off-by-one errors in loops.** Check `<` vs `<=` and `length - 1`.

## 🗣️ How to answer in an interview

This is what a strong opening sounds like:

> "Let me repeat the question to be sure: I need to return the indexes of two numbers that add up to the target. Can I assume exactly one answer exists? Can numbers be negative or repeated?
>
> Here's an example: [2, 7, 11, 15] with target 9 gives [0, 1].
>
> The simple way is two loops over every pair, which is O(n²). I can do better: for each number, I know the partner it needs, which is target minus the number. If I keep a Map of numbers I've already seen, I can check for the partner in O(1). That makes it one pass, O(n) time and O(n) space.
>
> Let me code that… Now let me dry-run it with the example, and check what happens with an empty array."

## 🔁 Follow-up questions

### What if I can't think of the optimal solution?

Code the brute force cleanly, test it, and say its Big O. Then say what you would try next. A working brute force with a clear explanation is better than a half-written clever solution.

### Should I use array methods or loops?

Use whatever is clearest, and say why. Many interviewers then ask, "Can you do it without built-in methods?" Practise both ways; this whole stack shows both.

### What if the interviewer gives a hint?

Take it, and say so: "That's a good point — if it's sorted, two pointers would work." Using hints well is a positive signal.

### How do I handle a problem I've seen before?

Be honest if asked. Still walk through the steps out loud, including the brute force. They want to see your reasoning, not a memorised answer.

## ✅ Quick check

### 1. What are the first two things you should do?

:::answer
**Repeat the question in your own words**, then **ask about edge cases and constraints** (empty, negatives, duplicates, sorted?).
:::

### 2. You finished coding. What do you do before saying "done"?

:::answer
**Dry-run** your example by hand, **check edge cases** (empty, one item, duplicates, negatives), and **state the time and space complexity**.
:::

### 3. You've been stuck for 25 minutes in practice. What should you do?

:::answer
Read the solution, understand it, close it, and **write it again yourself**. Then come back to the problem **3 days later**, and add the lesson to your mistake notebook.
:::
