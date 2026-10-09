---
title: How to approach any coding problem in an interview (7 steps)
stack: dsa
order: 1
level: Basic
mustKnow: true
askedFrequency: very common
summary:
  - "Use the same 7 steps every time: understand, ask, examples, brute force, improve, code, test."
  - Talk while you think. The interviewer marks your thinking, not only the final code.
  - Always say the simple (brute force) answer first, with its Big O, before improving it.
  - "Common speed-up tools: a hash map (Map/Set), two pointers, sorting, a sliding window."
  - Finish with a dry run, edge cases and the time and space complexity.
cards:
  - q: What are the 7 steps for solving a coding problem in an interview?
    a: Understand, ask questions, write examples, brute force, improve, code, then test and state the complexity.
  - q: Why say the brute force answer first?
    a: It proves you can solve the problem at all. Then you improve it. A working slow answer beats a broken fast one.
  - q: Two Sum — brute force vs better solution?
    a: "Brute force checks every pair: O(n²). Better: store numbers you've seen in a Map and look up target − number: O(n) time, O(n) space."
  - q: Which questions should you ask before coding an array problem?
    a: Can it be empty? Negative numbers? Duplicates? Is it sorted? What do I return if there's no answer?
  - q: What do you do if you get stuck?
    a: Think out loud about which pattern might fit (Map, two pointers, sorting), and ask for a hint if needed. Silence is the worst option.
---

## 💡 What is it?

Interviewers care about **how you think**, not just the final code. So use the **same 7 steps** for every problem:

1. **Understand** — say the question again in your own words.
2. **Ask** — empty array? negatives? duplicates? sorted?
3. **Examples** — one normal example and one edge case.
4. **Brute force** — the simplest answer, even if slow.
5. **Improve** — can a [Map or Set](topic:dsa/set-map), two pointers or sorting make it faster?
6. **Code** — clean names, explain as you write.
7. **Test** — dry run, edge cases, then say the [Big O](topic:dsa/big-o).

## 🏠 Real-life example

Think of a **doctor seeing a patient**.

- The doctor first **listens** (understand).
- Then asks **questions**: "Since when? Any fever?" (ask).
- Checks a few **signs** (examples).
- Thinks of the **simple cause** first (brute force).
- Then the **best treatment** (improve).
- **Writes the prescription** (code).
- Asks you to **come back** and checks it worked (test).

A doctor who writes a prescription before listening is a bad doctor. A coder who types before understanding is the same.

## 🧑‍💻 Code example

The classic example: **Two Sum**. Given `nums` and a `target`, return the positions of two numbers that add up to `target`.

Save as `two-sum.js` and run `node two-sum.js`.

```js
// Way 1 — brute force: check every pair of numbers
function twoSumBrute(nums, target) {            // nums = the list, target = the sum we want
  for (let i = 0; i < nums.length; i++) {        // i = position of the first number
    for (let j = i + 1; j < nums.length; j++) {  // j = every position after i
      if (nums[i] + nums[j] === target) {        // do these two add up to the target?
        return [i, j];                           // yes → return both positions
      }                                          // end of the if
    }                                            // end of the inner loop
  }                                              // end of the outer loop
  return [];                                     // no pair found → empty list
}                                                // end of twoSumBrute

// Way 2 — one loop with a Map (the improved answer)
function twoSum(nums, target) {                  // same inputs as before
  const seen = new Map();                        // value → position, for numbers we already passed
  for (let i = 0; i < nums.length; i++) {        // walk through the list once
    const need = target - nums[i];               // the partner this number needs
    if (seen.has(need)) {                        // have we already seen the partner?
      return [seen.get(need), i];                // yes → partner's position and ours
    }                                            // end of the if
    seen.set(nums[i], i);                        // remember this number and its position
  }                                              // end of the loop
  return [];                                     // no pair found
}                                                // end of twoSum

console.log(twoSumBrute([2, 7, 11, 15], 9));     // test the brute force version
console.log(twoSum([2, 7, 11, 15], 9));          // test the Map version
console.log(twoSum([3, 3], 6));                  // edge case: the same value twice
console.log(twoSum([1, 2], 10));                 // edge case: no answer
```

**Output:**

```text
[ 0, 1 ]
[ 0, 1 ]
[ 0, 1 ]
[]
```

## 🔍 Deeper version

**Steps 1–3, what you say:** "I need two different positions whose values add to the target. Can I assume exactly one answer? Can numbers be negative or repeat? Example: `[2, 7, 11, 15]`, target `9` → `[0, 1]`, because 2 + 7 = 9."

**Step 4 — brute force:** check every pair. Two loops → **O(n²) time**, **O(1) space**.

**Step 5 — improve:** for each number, I already know its partner: `target − number`. If I store numbers I've passed in a `Map`, I can check for the partner in **one step**. One loop → **O(n) time**, **O(n) space**.

**Step 7 — dry run** on `[2, 7, 11, 15]`, target 9:

| i | nums[i] | need | seen before? | seen after |
|---|---|---|---|---|
| 0 | 2 | 7 | no | {2→0} |
| 1 | 7 | 2 | **yes, at 0** | return `[0, 1]` |

**Edge cases tested:** `[3, 3]` with target 6 works, because we check *before* storing the current number. `[1, 2]` with target 10 returns `[]`.

**The "which pattern?" table** (more on each later):

| The question says… | Try |
|---|---|
| pair, seen before, count, duplicate | [hash map / Set](topic:dsa/pattern-hash-map) |
| sorted array, pair, palindrome | [two pointers](topic:dsa/pattern-two-pointers) |
| subarray of size k, longest substring | [sliding window](topic:dsa/pattern-sliding-window) |
| sorted + find | [binary search](topic:dsa/pattern-binary-search) |

## 🎯 Why do we use it?

Under pressure, people panic and start typing. A fixed routine stops that.

It also gives the interviewer **many chances to give you marks**: good questions, a correct brute force, a smart improvement, and clean testing. Even if you don't finish, a clear approach often scores well.

## ⚠️ Common mistakes

- **Coding before understanding.** You solve the wrong problem.
- **Staying silent.** The interviewer can't follow you or help you.
- **Skipping edge cases** like an empty array or one item.
- **Forgetting to say the Big O** at the end.

## 🗣️ How to answer in an interview

> "Let me repeat the question to make sure I understood it. I need the positions of two numbers that add up to the target. Can I assume there's exactly one answer, and can numbers repeat?
>
> The simple way is to check every pair with two loops. That's O(n²). Let me see if I can do better.
>
> For each number, I know the partner it needs: target minus the number. If I store the numbers I've seen in a Map, I can check for the partner in O(1). So the whole thing becomes one loop, O(n) time and O(n) space.
>
> Let me dry-run it with [2, 7, 11, 15] and target 9… and check the edge case where the same value appears twice."

There's a full Two Sum problem on the **Practice Problems** page.

## 🔁 Follow-up questions

### What if the array is sorted?

Use **two pointers**: one at the start, one at the end. If the sum is too small, move the left pointer right. If too big, move the right pointer left. O(n) time, **O(1) space**.

### What if you need all pairs, not just one?

Keep looping instead of returning. Store each pair you find. Watch out for duplicate pairs.

### What if you don't know the answer at all?

Say the brute force anyway. Then think out loud about patterns. It's fine to ask, "Would a hint be OK?"

### Should you use built-in methods or loops?

Say: "I'll use a method here because it's clear. I can also write it with a plain loop if you'd like." Interviewers often ask for the loop version.

## ✅ Quick check

### 1. What is the time complexity of the brute force Two Sum?

:::answer
**O(n²)** — a loop inside a loop over the same array.
:::

### 2. What does `twoSum([3, 3], 6)` return with the Map version?

:::answer
**`[0, 1]`**. At i = 0, 3 is stored. At i = 1, the partner 3 is already in the Map at position 0.
:::

### 3. Which step comes right after writing the brute force?

- A) Code it
- B) Improve it
- C) Test it

:::answer
**B) Improve it** — say the brute force and its Big O, then look for a faster way before coding.
:::
