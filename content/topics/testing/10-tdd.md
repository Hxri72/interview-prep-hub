---
title: Test-driven development (TDD)
stack: testing
order: 10
level: Basic
mustKnow: false
askedFrequency: common
summary:
  - "TDD means: write a failing test first, then the code that makes it pass, then clean up."
  - "The loop is Red → Green → Refactor. Red = test fails. Green = simplest code passes. Refactor = improve without breaking."
  - It forces you to decide the expected behaviour before coding, and leaves you with tests for free.
  - It works best for clear logic (helpers, validation, business rules), less well for UI layout or experiments.
  - A good TDD test checks behaviour (input → output), not the internal details.
cards:
  - q: What is TDD in one sentence?
    a: Writing a failing test first, then the smallest code to pass it, then refactoring, in short loops.
  - q: What do Red, Green and Refactor mean?
    a: "Red: write a test and watch it fail. Green: write the simplest code that passes. Refactor: clean the code while the tests stay green."
  - q: Why must you see the test fail first?
    a: To prove the test can actually catch a problem. A test that never fails might not be checking anything.
  - q: When is TDD a poor fit?
    a: When you don't know what you're building yet (a quick experiment), or for visual UI layout that's hard to express as a test.
  - q: Does TDD replace other testing?
    a: No. TDD mostly produces unit tests. You still need integration and end-to-end tests.
---

## 💡 What is it?

**Test-driven development (TDD)** is a way of working where you write the **test first**, and the code second.

You go in tiny loops: write a test that fails, write just enough code to pass it, then tidy the code. The test describes what the code **should** do before the code exists.

## 🏠 Real-life example

Think of a **teacher who writes the answer key before the exam**.

1. First, the teacher writes the questions and the correct answers. Right now nobody has written the exam, so every answer "fails".
2. Then the student writes answers until they match the key.
3. Then the student rewrites them neatly, still matching the key.

- **The answer key** = the test.
- **"Nothing matches yet"** = Red (the test fails).
- **Answers that match** = Green (the test passes).
- **Rewriting neatly** = Refactor.
- **Checking against the key again after rewriting** = running the tests after every change.

## 🧑‍💻 Code example

Set up: `npm init -y`, then `npm install --save-dev jest`. We'll build a `toSlug` helper that turns a job title into a URL part, like `senior-node-js-developer`.

**Step 1 — Red.** Write the test first. Run `npx jest`.

```js
// slug.test.js
const { toSlug } = require('./slug');                          // the function we are about to build

test('turns a job title into a URL slug', () => {               // describe the behaviour we want
  expect(toSlug('Senior Node.js Developer')).toBe('senior-node-js-developer'); // spaces and dots become dashes
});                                                             // end of test 1

test('removes extra spaces at the ends', () => {                // a second rule
  expect(toSlug('  React Dev  ')).toBe('react-dev');            // no dashes at the start or end
});                                                             // end of test 2
```

```js
// slug.js — an empty version, just so the test can run
function toSlug(title) {                    // takes a title
  return '';                                // returns nothing useful yet
}                                           // end of toSlug
module.exports = { toSlug };                // share it with the test
```

```text
  ● turns a job title into a URL slug
    Expected: "senior-node-js-developer"
    Received: ""
  ● removes extra spaces at the ends
    Expected: "react-dev"
    Received: ""
Tests:       2 failed, 2 total
```

**Step 2 — Green.** Write the simplest code that passes.

```js
// slug.js
function toSlug(title) {                    // the simplest code that passes
  return title                              // start from the original title
    .trim()                                 // remove spaces at both ends
    .toLowerCase()                          // "Senior" → "senior"
    .replace(/[^a-z0-9]+/g, '-');           // every run of non-letters/digits becomes one "-"
}                                           // end of toSlug
module.exports = { toSlug };                // share it with the test
```

```text
Tests:       2 passed, 2 total
```

**Step 3 — Refactor.** Clean up names or structure. Run the tests again. They must stay green.

## 🔍 Deeper version

**The next loop finds a real bug.** We tried a trickier title in Node:

```js
toSlug('C# & .NET Developer!')   // real result: "c-net-developer-"   ← a dash at the end
```

In TDD, you **first add a failing test** for this case. Then you fix the code:

```js
.replace(/[^a-z0-9]+/g, '-')     // runs of symbols → "-"
.replace(/^-+|-+$/g, '')         // then remove dashes at the start or end → "c-net-developer"
```

The first test protects you while you change the code. That is the real power of TDD.

**The three rules (simple version):**
1. Don't write real code until you have a failing test.
2. Write only enough test to fail.
3. Write only enough code to pass.

**Test behaviour, not internals.** Test "input → output". Don't test which private function was called. Then you can refactor freely without rewriting tests.

**Where TDD fits well:**

| Good fit | Poor fit |
|---|---|
| Helpers, validation, money maths | Quick experiments and prototypes |
| Business rules (pricing, permissions) | Visual layout and styling |
| Fixing a bug: write a test that reproduces it first | Code you'll throw away tomorrow |

**Bug-fix TDD** is the easiest way to start. When a bug comes in, write a test that reproduces it (Red). Fix it (Green). The bug can never come back silently.

**Related ideas.** BDD (behaviour-driven development) writes tests in "given / when / then" language. Outside-in TDD starts from an API or end-to-end test and works inward.

## 🎯 Why do we use it?

- **You decide the behaviour first.** Writing the test makes you think about inputs, outputs and edge cases before coding.
- **You get tests for free.** Every feature arrives with tests already written.
- **Safe refactoring.** Green tests tell you a clean-up didn't break anything.
- **Simpler code.** You only write code that a test needs, so there's less extra code.

## ⚠️ Common mistakes

- **Skipping the Red step.** If you never see the test fail, it might not test anything.
- **Writing too much code at once.** The loop should be minutes, not hours.
- **Testing internal details.** Then every refactor breaks tests, and people stop trusting them.
- **Using TDD for everything.** For a quick experiment, write the code first, then add tests once the design settles.

## 🗣️ How to answer in an interview

> "TDD is Red, Green, Refactor. I write a small failing test that describes the behaviour, run it to see it fail, then write the simplest code that passes, and then clean up while the tests stay green.
>
> The big benefit is that I think about edge cases before coding, and I end up with tests that protect every refactor. I use it most for clear logic like validation, helpers and business rules, and always for bug fixes: first a test that reproduces the bug, then the fix. For quick prototypes or UI layout, I usually write the code first and add tests after."

[FILL IN: whether you used test-first for any of the Jest unit tests you wrote at SkillKeepr — only if true.]

## 🔁 Follow-up questions

### Doesn't TDD slow you down?

At first, yes. But you spend less time debugging and re-testing by hand later. The tests also make later changes faster and safer.

### What is "bug-first" TDD?

When a bug is reported, you first write a test that reproduces it. The test fails. You fix the code until it passes. Now that bug is covered forever.

### TDD vs writing tests after the code?

Both give you tests. Test-first also shapes the design, because you think about how the code is used before writing it. Tests written after can miss cases you didn't think about.

### Does TDD mean 100% coverage?

Often close, because every line was written to pass a test. But coverage isn't the goal. The goal is good behaviour checks.

## ✅ Quick check

### 1. Put the TDD steps in order: Refactor, Green, Red.

:::answer
**Red → Green → Refactor.** First a failing test, then the simplest passing code, then clean-up with the tests still green.
:::

### 2. With the Green version of `toSlug`, what does `toSlug('Node.js!')` return?

:::answer
**`"node-js-"`.** The `!` at the end becomes a dash. That is exactly the kind of case you add a new failing test for, and then fix.
:::

### 3. Why should you see a new test fail before writing the code?

:::answer
To prove the test can catch a problem. A test that never fails might be checking nothing.
:::
