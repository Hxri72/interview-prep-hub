---
title: Code coverage and its limits
stack: testing
order: 9
level: Basic
mustKnow: false
askedFrequency: common
summary:
  - Code coverage tells you which lines and branches your tests ran. It does NOT tell you if the tests checked the right thing.
  - "Four numbers: statements, branches, functions, lines. Branch coverage is the most useful one."
  - "Run it with `jest --coverage`. The \"Uncovered Line #s\" column shows exactly what no test touched."
  - 100% coverage is possible with zero real checks. A test without `expect` still counts as coverage.
  - Use coverage to find untested risky code, not as a score to chase.
cards:
  - q: What does code coverage measure?
    a: Which parts of your code ran while the tests ran — statements, branches, functions and lines.
  - q: Which coverage number is most useful, and why?
    a: Branch coverage. It shows if both sides of every if/else ran, which is where bugs hide.
  - q: Can you have 100% coverage and still have bugs?
    a: Yes. Coverage only proves the code ran. A test with no expect, or a wrong expect, still gives 100%.
  - q: How do you make Jest fail when coverage drops?
    a: "Set coverageThreshold in the Jest config, e.g. { global: { branches: 80 } }. Jest then fails the run if coverage is lower."
  - q: Is 100% coverage a good team target?
    a: Usually not. It pushes people to write empty tests. Aim for high coverage on important logic, like payments and auth.
---

## 💡 What is it?

**Code coverage** shows how much of your code **ran** while your tests ran.

It is a report with percentages. It also lists the lines that no test touched.

Coverage answers "what did my tests visit?". It does not answer "did my tests check the right result?".

## 🏠 Real-life example

Think of a **teacher checking homework**.

The teacher flips through every page of your notebook. Every page was "visited". But did the teacher check if the answers were correct? Not always.

- **Flipping through the pages** = coverage. The code ran.
- **Checking each answer** = assertions (`expect`). The result was checked.
- **A page the teacher never opened** = an uncovered line.
- **A teacher who flips every page but marks nothing** = 100% coverage with useless tests.

So a full flip-through is a good start. But only the marking tells you if the work is right.

## 🧑‍💻 Code example

Set up: `npm init -y`, then `npm install --save-dev jest`. Create the two files. Run `npx jest --coverage`.

```js
// discount.js
function discount(price, isMember) {      // price in rupees, isMember = true/false
  if (price <= 0) return 0;               // free or wrong price → no discount
  if (isMember) return price * 0.1;       // members get 10% off
  return 0;                               // everyone else gets nothing
}
module.exports = { discount };            // share the function with the test file
```

```js
// discount.test.js
const { discount } = require('./discount');   // bring in the function we test

test('member gets 10% off', () => {             // one test case
  expect(discount(1000, true)).toBe(100);       // 10% of 1000 = 100
});                                             // end of the test
```

**Output (real run):**

```text
-------------|---------|----------|---------|---------|-------------------
File         | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s
-------------|---------|----------|---------|---------|-------------------
All files    |   66.66 |       50 |     100 |      75 |
 discount.js |   66.66 |       50 |     100 |      75 | 4
-------------|---------|----------|---------|---------|-------------------
Tests:       1 passed, 1 total
```

**How to read it:**
- **% Funcs = 100**: the one function ran.
- **% Branch = 50**: only half of the if/else paths ran. The "not a member" and "price is 0" paths never ran.
- **Uncovered Line #s = 4**: line 4 (`return 0` for non-members) never ran.
- **Look at line 2:** `if (price <= 0) return 0;` counts as a covered *line*, but its `return 0` never ran. That is why branch coverage matters more than line coverage.

## 🔍 Deeper version

**The four numbers:**

| Metric | Counts | Simple meaning |
|---|---|---|
| Statements | each instruction | how many commands ran |
| Branches | each side of `if`, `?:`, `&&`, `\|\|`, `switch` | did every path run? |
| Functions | each function | was it called at least once? |
| Lines | each line with code | did the line run? |

**How Jest measures it.** Jest adds tiny counters to your code before running the tests. This is called *instrumentation*. By default it uses Babel (istanbul). You can switch to V8's built-in coverage with `coverageProvider: 'v8'`, which is faster.

**100% coverage, zero checking.** We ran this test on the same file:

```js
test('runs everything but checks nothing', () => { // a test with NO expect
  discount(1000, true);                             // member path runs
  discount(1000, false);                            // non-member path runs
  discount(0, true);                                // price-0 path runs
});                                                 // nothing is checked
```

Real result: `discount.js | 100 | 100 | 100 | 100`. The test passes. It would still pass if the discount were 90% by mistake. Coverage proves **execution**, not **correctness**.

**Thresholds.** You can make the run fail when coverage drops:

```js
// jest.config.js
module.exports = {                                   // Jest settings
  collectCoverageFrom: ['src/**/*.js'],              // measure all source files, even untested ones
  coverageThreshold: { global: { branches: 80, lines: 80 } }, // fail below 80%
};                                                   // end of config
```

`collectCoverageFrom` matters. Without it, a file with **no tests at all** may not appear in the report, so it doesn't pull the number down.

**Better signals than one big number:**
- Coverage of **changed lines** in a pull request. Tools like SonarQube show "coverage on new code".
- High coverage on **risky modules**: payments, auth, money maths, permissions.
- **Mutation testing** (for example Stryker). It changes your code on purpose (`>` becomes `>=`) and checks that a test fails. If no test fails, the tests are weak.

## 🎯 Why do we use it?

- **To find blind spots.** The "Uncovered Line #s" column shows exactly which code no test touches.
- **To protect important logic.** A threshold stops someone from deleting tests for the payment code without anyone noticing.
- **To guide new tests.** A low branch number tells you which `if` paths still need a test.

## ⚠️ Common mistakes

- **Treating 100% as "bug-free".** A test without `expect` still counts.
- **Chasing a number.** Teams write tiny useless tests just to reach a target.
- **Only reading line coverage.** A one-line `if (x) return y;` looks covered even when one path never ran.
- **Forgetting `collectCoverageFrom`.** Untested files are missing from the report, so the number looks better than it is.

## 🗣️ How to answer in an interview

> "Code coverage shows which statements, branches, functions and lines ran during the tests. I find branch coverage the most useful, because bugs usually hide in the path nobody tested. I run `jest --coverage` and look at the uncovered lines column.
>
> But coverage only proves the code ran, not that it was checked. A test without an assertion still gives 100%. So I use it to find blind spots, not as a score. I'd rather have high coverage on risky code like payments and auth, a threshold so it can't silently drop, and good assertions, than 100% everywhere."

[FILL IN: how you used coverage for the Jest unit tests you wrote at SkillKeepr — e.g. which module you added tests to.]

## 🔁 Follow-up questions

### What coverage percentage should a team aim for?

There's no magic number. Many teams use 70–80% overall, with higher targets for critical code. More important: coverage on **new code** in each pull request should not go down.

### What is mutation testing?

A tool makes small changes to your code, like `>` to `>=`. Each change is a "mutant". If your tests still pass, the mutant "survived", which means your tests didn't really check that logic.

### Why is a file with no tests missing from my report?

Jest only reports files that tests imported. Add `collectCoverageFrom: ['src/**/*.js']` to include every file, even untested ones.

### Istanbul (babel) vs V8 coverage — what's the difference?

Istanbul rewrites your code with counters before running it. V8 coverage uses the JavaScript engine's own counters, so it's faster. Both give the same kind of report. Set it with `coverageProvider`.

## ✅ Quick check

### 1. One test calls `discount(1000, true)` and checks the result. What is the branch coverage of the file above?

:::answer
**50%.** Only the "member" path of each `if` ran. The "price is 0" and "not a member" paths never ran.
:::

### 2. True or false: if coverage is 100%, the code has no bugs.

:::answer
**False.** Coverage proves the code ran, not that the result was checked. A test without `expect` gives 100% too.
:::

### 3. Which setting makes Jest fail when branch coverage is below 80%?

- A) `collectCoverage: 80`
- B) `coverageThreshold: { global: { branches: 80 } }`
- C) `--coverage=80`

:::answer
**B.** `coverageThreshold` makes the test run fail when coverage is lower than the number you set.
:::
