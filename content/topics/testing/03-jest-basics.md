---
title: "Jest basics: describe, it, expect"
stack: testing
order: 3
level: Basic
mustKnow: true
askedFrequency: very common
summary:
  - Jest is a JavaScript test runner. It finds test files, runs them and shows pass or fail.
  - "describe() groups tests, it() (or test()) is one test, expect(value).toBe(x) is one check."
  - Jest finds files named *.test.js or *.spec.js, or files inside a __tests__ folder.
  - "beforeEach / afterEach run before / after every test; beforeAll / afterAll run once per file."
  - When a test fails, Jest shows Expected vs Received and the exact line.
cards:
  - q: What do describe, it and expect do?
    a: "describe groups related tests, it (same as test) defines one test, and expect(actual).toBe(expected) checks one result."
  - q: How does Jest find test files?
    a: By default it runs files ending in .test.js or .spec.js (and .ts/.jsx versions), and any file inside a __tests__ folder.
  - q: What is the difference between beforeEach and beforeAll?
    a: beforeEach runs before EVERY test in its scope; beforeAll runs ONCE before all of them. Use beforeEach to reset data so tests don't affect each other.
  - q: How do you run only one test while you're working on it?
    a: Use it.only (or test.only), or run npx jest -t "part of the test name". Remove .only before committing.
  - q: What does a failing Jest test show you?
    a: The test name, the matcher used, the Expected and Received values, and a code frame pointing at the failing line.
---

## 💡 What is it?

**Jest** is a tool that runs your tests. People call it a **test runner**.

You write tests with three main words:
- `describe` — a **group** of related tests.
- `it` (or `test`) — **one** test.
- `expect(...)` — **one check** inside a test.

Jest runs every test and prints a green ✓ for a pass or a red ✕ for a fail.

## 🏠 Real-life example

Think of a **school exam paper**.

- The **paper** has sections: "Maths", "Science". → `describe` blocks.
- Each **section** has questions. → `it` blocks.
- Each **question** has a correct answer the teacher checks. → `expect(answer).toBe(correct)`.
- The **teacher** marks every question and writes the total at the end. → Jest, printing "3 passed, 1 failed".

If a student gets one question wrong, the teacher circles that exact question. Jest does the same: it shows the exact failing line.

## 🧑‍💻 Code example

Setup: `npm init -y` and `npm install --save-dev jest`. Add `"test": "jest"` to the `scripts` in `package.json`. Save both files, then run `npx jest --verbose`.

```js
// name.js — turns "  hari   prasad " into "Hari Prasad"
function formatName(raw) {                                    // raw = text typed by a user
  return raw                                                  // start with the raw text
    .trim()                                                   // remove spaces at both ends
    .split(/\s+/)                                             // split on one or more spaces
    .map((w) => w[0].toUpperCase() + w.slice(1).toLowerCase()) // capital first letter, rest small
    .join(' ');                                               // glue the words back with one space
}                                                             // end of formatName
module.exports = { formatName };                              // share it
```

```js
// name.test.js — the ".test.js" ending tells Jest this is a test file
const { formatName } = require('./name');                     // the function under test

describe('formatName', () => {                                // describe = a group of related tests
  it('capitalises each word', () => {                         // it = one test (same as test)
    expect(formatName('hari prasad')).toBe('Hari Prasad');    // expect(actual).toBe(expected)
  });                                                         // end of test 1

  it('removes extra spaces', () => {                          // test 2
    expect(formatName('  hari   prasad ')).toBe('Hari Prasad'); // messy input → clean output
  });                                                         // end of test 2

  it('lowercases the rest of each word', () => {              // test 3
    expect(formatName('HARI')).toBe('Hari');                  // "HARI" → "Hari"
  });                                                         // end of test 3
});                                                           // end of the group
```

**Output** (Jest 30, timings removed):

```text
PASS ./name.test.js
  formatName
    ✓ capitalises each word
    ✓ removes extra spaces
    ✓ lowercases the rest of each word

Test Suites: 1 passed, 1 total
Tests:       3 passed, 3 total
```

**What a failure looks like.** If you write `expect(formatName('hari')).toBe('hari')`, Jest prints this (real output):

```text
FAIL ./fail.test.js
  ✕ shows what a failure looks like

  ● shows what a failure looks like

    expect(received).toBe(expected) // Object.is equality

    Expected: "hari"
    Received: "Hari"

    > 3 |   expect(formatName('hari')).toBe('hari');
        |                              ^
```

## 🔍 Deeper version

**The parts of a test file:**

| Piece | What it does |
|---|---|
| `describe(name, fn)` | Groups tests. Can be nested. Names show up in the output. |
| `it(name, fn)` / `test(name, fn)` | One test. Exactly the same function, two names. |
| `expect(value)` | Starts a check. Followed by a **matcher** like `.toBe()`. |
| `beforeEach(fn)` / `afterEach(fn)` | Runs before / after **every** test in the same `describe`. |
| `beforeAll(fn)` / `afterAll(fn)` | Runs **once** before / after all tests in the same `describe`. |
| `it.only` / `describe.only` | Run only this one (for focusing while coding). |
| `it.skip` / `it.todo` | Skip a test / list a test you still need to write. |

**The AAA pattern.** A clear test has three parts: **Arrange** (set up data), **Act** (call the code), **Assert** (check the result). Keep one main idea per test, so the test name explains a failure.

**Test isolation.** Tests should not depend on each other or on their order. Jest runs test **files** in parallel in separate workers. Inside one file, tests run in order, but you should still reset shared data in `beforeEach`.

**Useful commands:**
- `npx jest --watch` — re-runs the tests for files you changed.
- `npx jest -t "removes extra"` — runs only tests whose name matches.
- `npx jest --coverage` — shows which lines your tests ran.

**Config.** Jest works with zero config for plain JavaScript. For TypeScript, teams add `ts-jest` or a Babel preset, and set the `testEnvironment` (`node` for backend, `jsdom` for React).

:::version[Version note]
**Jest 30** (2025) needs Node 18+ and drops some old aliases, such as `toBeCalled` (use `toHaveBeenCalled`). **Vitest** is a popular alternative with almost the same API (`describe`, `it`, `expect`), and it's common in Vite projects.
:::

**At SkillKeepr.** Our backend services use Jest with `ts-jest`, and the tests call handlers with mocked data layers. I wrote Jest unit tests there. [FILL IN: one test you wrote and what it checked.]

## 🎯 Why do we use it?

- **One tool for everything:** finding test files, running them, matchers, mocks and coverage are all built in.
- **Readable tests:** `describe` and `it` read like sentences, so a failing test explains itself.
- **Fast feedback:** watch mode re-runs only what changed while you code.
- **Common skill:** most JavaScript and Node teams know Jest, so tests are easy for others to read.

## ⚠️ Common mistakes

- **Forgetting to remove `.only`.** Then CI runs one test and everything "passes".
- **Tests that depend on each other.** If test 2 needs data from test 1, both break together. Reset data in `beforeEach`.
- **Vague names** like "works" or "test 1". Name the behaviour: "removes extra spaces".
- **Calling the function outside `expect` for errors.** Use `expect(() => fn()).toThrow()`. Without the arrow function, the error crashes the test before `expect` can catch it.

## 🗣️ How to answer in an interview

> "Jest is a test runner for JavaScript. It finds files ending in .test.js or .spec.js, runs them and reports pass or fail. I group related tests with describe, write each test with it, and check results with expect plus a matcher, like toBe or toEqual.
>
> I follow arrange, act, assert, and keep one behaviour per test with a clear name. I use beforeEach to reset data so tests don't affect each other, and beforeAll for slow one-time setup like starting a test database. While coding I use watch mode, and I run the full suite in CI.
>
> At SkillKeepr I wrote Jest unit tests for backend code. [FILL IN: one example.]"

## 🔁 Follow-up questions

### What is the difference between `it` and `test`?

Nothing — they are the same function. `it` reads nicely after `describe` ("formatName › it capitalises each word").

### How do you run tests in CI?

Add `"test": "jest"` to `package.json`, then run `npm test` (or `npx jest --ci`) in the pipeline. A non-zero exit code fails the job and blocks the merge.

### Jest or Vitest?

Both have nearly the same API. Jest is the long-time standard, especially for Node backends. Vitest is built on Vite, so it's fast and natural in Vite/React projects and supports ES modules out of the box.

### What is a snapshot test?

`expect(value).toMatchSnapshot()` saves the output the first time, then fails if it changes later. It's useful for big outputs, but snapshots are easy to approve without reading, so use them carefully.

## ✅ Quick check

### 1. Which line is ONE check inside a test?

- A) `describe('formatName', ...)`
- B) `it('capitalises each word', ...)`
- C) `expect(formatName('a b')).toBe('A B')`

:::answer
**C.** `describe` is a group, `it` is one test, `expect` is one check.
:::

### 2. You have 5 tests. How many times does `beforeEach` run? And `beforeAll`?

:::answer
`beforeEach` runs **5 times** (once before each test). `beforeAll` runs **once**.
:::

### 3. Will Jest pick up a file called `price.tests.js` by default?

:::answer
**No.** The default pattern looks for `.test.js` or `.spec.js` (singular), or files in a `__tests__` folder. `price.tests.js` doesn't match.
:::
