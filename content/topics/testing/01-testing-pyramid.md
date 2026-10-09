---
title: "Why we test; the testing pyramid"
stack: testing
order: 1
level: Basic
mustKnow: true
askedFrequency: very common
summary:
  - A test is a small program that runs your code and checks the answer is right.
  - Tests catch bugs early, let you change code without fear, and act as living documentation.
  - "The testing pyramid: many fast unit tests at the bottom, fewer integration tests in the middle, a few slow end-to-end tests at the top."
  - Lower tests are fast and cheap; higher tests are slow but closer to what real users do.
  - Test the risky parts most — money, login, data that must not be lost — not every line.
cards:
  - q: What is the testing pyramid?
    a: A guide for how many tests of each kind to write. Many unit tests at the bottom, fewer integration tests, and only a few end-to-end tests at the top.
  - q: Why have more unit tests than end-to-end tests?
    a: Unit tests are fast, cheap and point to the exact broken function. End-to-end tests are slow and flaky, and when they fail it's harder to see why.
  - q: Name three reasons we write tests.
    a: To catch bugs before users do, to change code safely later (refactoring), and to document how the code should behave.
  - q: What should you test first in a project?
    a: The risky parts — payments, login and permissions, and anything that can lose or corrupt data.
  - q: Does 100% test coverage mean no bugs?
    a: No. Coverage only shows which lines ran during tests, not whether the checks were good.
---

## 💡 What is it?

A **test** is a small piece of code that runs your real code and checks the result. If the result is wrong, the test **fails** and tells you.

We write tests so we find bugs **before** users do.

The **testing pyramid** is a simple rule for which tests to write. Write **many** small, fast tests. Write only a **few** big, slow tests.

## 🏠 Real-life example

Think of a **school building a new wall**.

- First, the mason checks **each brick** before using it. Is it cracked? This is quick and cheap.
- Then the supervisor checks **one finished section** of the wall. Do the bricks and cement hold together?
- At the end, the principal **walks through the whole new building**. Can students actually use it?

Mapping:

- **Checking each brick** = unit tests (the bottom of the pyramid, many of them).
- **Checking one section** = integration tests (the middle).
- **The principal's walk-through** = end-to-end tests (the top, only a few).

You can't check every brick by walking through the building. And checking only bricks won't tell you the door is in the wrong place. You need **all three**, in the right amounts.

## 🧑‍💻 Code example

Make a folder, run `npm init -y` and `npm install --save-dev jest`. Save these two files, then run `npx jest --verbose`.

```js
// price.js — a small function we want to protect with tests
function finalPrice(price, discountPercent) {              // price in rupees, discount like 10 for 10%
  if (price < 0) throw new Error('Price cannot be negative'); // bad input → throw an error
  const discount = (price * discountPercent) / 100;         // how many rupees to take off
  return Math.round(price - discount);                      // round to whole rupees
}                                                           // end of finalPrice
module.exports = { finalPrice };                            // share it with the test file
```

```js
// price.test.js — Jest finds files ending in .test.js automatically
const { finalPrice } = require('./price');                  // bring in the function to test

test('10% off 500 is 450', () => {                          // one test: a name + a function
  expect(finalPrice(500, 10)).toBe(450);                    // 500 - 50 = 450
});                                                         // end of test 1

test('0% off keeps the price', () => {                      // edge case: no discount
  expect(finalPrice(299, 0)).toBe(299);                     // nothing taken off
});                                                         // end of test 2

test('negative price throws', () => {                       // error case
  expect(() => finalPrice(-1, 10)).toThrow('Price cannot be negative'); // wrap in a function so Jest can catch it
});                                                         // end of test 3
```

**Output** (Jest 30, timings removed):

```text
PASS ./price.test.js
  ✓ 10% off 500 is 450
  ✓ 0% off keeps the price
  ✓ negative price throws

Test Suites: 1 passed, 1 total
Tests:       3 passed, 3 total
```

**What to notice:** these are **unit tests**. They test one function alone, with no server and no database. All three run in well under a second.

## 🔍 Deeper version

**The three layers:**

| Layer | What it tests | Speed | How many | Example tools |
|---|---|---|---|---|
| **Unit** | one function or class alone | milliseconds | many | Jest, Vitest |
| **Integration** | several parts together (route + validation + DB) | slower | some | Jest + Supertest, mongodb-memory-server |
| **End-to-end (e2e)** | the whole app through a real browser | seconds each | few | Playwright, Cypress |

**Why the pyramid shape?**
- **Cost:** a unit test takes minutes to write and milliseconds to run. An e2e test needs a browser, a running app and test data.
- **Feedback:** when a unit test fails, it names the exact function. When an e2e test fails, the bug could be anywhere.
- **Flakiness:** a "flaky" test sometimes passes and sometimes fails without any code change. E2e tests are flaky more often, because of timing, network and browsers.

**The "testing trophy" view.** Some teams, especially frontend teams, prefer **more integration tests** than unit tests. An integration test checks how parts work together, which is where many real bugs live. Both views agree on the main idea: e2e tests are expensive, so keep them few and focused on the most important user journeys (login, checkout, apply for a job).

**What to test first (by risk):**
1. Money: billing, renewals, refunds.
2. Security: login, permissions, tenant separation.
3. Data that must not be lost or duplicated: imports, syncs, webhooks.
4. Tricky logic: dates, time zones, calculations.

**Tests and CI.** Tests are most useful when they run **automatically** on every push or pull request. This is part of CI (continuous integration). A failing test should block the merge, so broken code never reaches main.

**Where this connects to my work.** I wrote Jest unit tests for backend code at SkillKeepr. [FILL IN: which modules or services you tested, e.g. a service or helper, and one real bug a test caught.]

## 🎯 Why do we use it?

- **Catch bugs early.** A bug found by a test costs minutes. The same bug found by a customer costs hours, money and trust.
- **Change code without fear.** When you refactor, the tests tell you if you broke something.
- **Documentation that can't go stale.** A test like "negative price throws" shows exactly how the code should behave.
- **Faster reviews.** Reviewers trust a change more when it comes with tests.

## ⚠️ Common mistakes

- **Only writing e2e tests.** The suite becomes slow and flaky, and failures are hard to understand.
- **Only testing the happy path.** Bugs usually hide in edge cases: empty input, zero, negative numbers, missing fields.
- **Chasing 100% coverage.** Tests that run every line but check nothing give false confidence.
- **Testing implementation details.** If a test breaks every time you rename a private variable, it is testing the wrong thing. Test behaviour: inputs and outputs.

## 🗣️ How to answer in an interview

> "We test to catch bugs before users do, and so we can change code safely later. I follow the testing pyramid. At the bottom are many unit tests: fast tests for one function, like a price calculation. In the middle are integration tests, where I test an API route together with validation and a test database, using Supertest. At the top are a few end-to-end tests that drive a real browser through key journeys like login.
>
> I keep the pyramid shape because unit tests are fast and point to the exact problem, while e2e tests are slow and more flaky. I focus testing effort on risk: payments, auth, and anything that could lose data. And tests should run in CI on every pull request, so a failing test blocks the merge.
>
> At SkillKeepr I wrote Jest unit tests for backend code. [FILL IN: one example.]"

## 🔁 Follow-up questions

### What is a flaky test, and how do you fix one?

A flaky test passes sometimes and fails sometimes, with no code change. Common causes are timing (waiting a fixed time instead of waiting for something), shared data between tests, and real network calls. Fix it by waiting for the actual condition, resetting data before each test, and mocking external services.

### What is the testing trophy?

It is a different shape that puts the most weight on integration tests. The idea is that integration tests give the best balance of confidence and cost. It agrees with the pyramid that e2e tests should be few.

### How do you decide what NOT to test?

Simple code with no logic (a getter, a config file), third-party libraries (they have their own tests), and code that is about to be deleted. Spend time where a bug would hurt.

### Who should write tests — developers or QA?

Developers write unit and integration tests for their own code, as part of the feature. QA engineers focus on test plans, exploratory testing and often e2e automation. Quality is everyone's job.

## ✅ Quick check

### 1. Which layer of the pyramid should have the MOST tests?

- A) End-to-end
- B) Integration
- C) Unit

:::answer
**C) Unit.** They are the fastest and cheapest, so you can have many of them.
:::

### 2. True or false: if every line of code runs during the tests, the code has no bugs.

:::answer
**False.** Running a line is not the same as checking it gives the right answer. A test with no good `expect` still "covers" lines.
:::

### 3. A test checks: log in through a real browser, search for a candidate, open their profile. Which kind of test is it?

:::answer
**End-to-end (e2e).** It drives the whole app through a real browser, the way a user would.
:::
