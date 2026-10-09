---
title: "Matchers and async tests"
stack: testing
order: 4
level: Intermediate
mustKnow: false
askedFrequency: common
summary:
  - "A matcher is the check after expect(): toBe, toEqual, toContain, toThrow, toHaveBeenCalled…"
  - toBe checks the exact same value (like ===). toEqual checks the same content, so use it for objects and arrays.
  - "For async code, make the test async and await it. For errors, use await expect(promise).rejects.toThrow()."
  - If you forget await, the test can PASS even though the check failed.
  - Fake timers (jest.useFakeTimers) let you test a 5-second timer without waiting 5 seconds.
cards:
  - q: What is the difference between toBe and toEqual?
    a: toBe checks the exact same value or the same object reference (Object.is). toEqual checks the content, so two different objects with the same fields are equal.
  - q: How do you test that an async function throws?
    a: "await expect(myAsyncFn()).rejects.toThrow('message'). The await is required."
  - q: What happens if you forget await before expect(...).rejects?
    a: The test finishes before the promise settles, so it can pass even though the check failed. The error appears later or not at all.
  - q: How do you compare decimals like 0.1 + 0.2?
    a: Use toBeCloseTo(0.3), because floating-point numbers are not exact.
  - q: How do you test code that uses setTimeout without waiting?
    a: Call jest.useFakeTimers(), then jest.advanceTimersByTime(ms) to move the fake clock forward.
---

## 💡 What is it?

A **matcher** is the word after `expect(...)` that does the checking. For example, `.toBe(4)` or `.toContain('react')`.

Some code is **[asynchronous](glossary:async)**: it answers later, like a database call. To test it, you make the test `async` and `await` the result. Jest then waits before checking.

## 🏠 Real-life example

Think of a **teacher checking homework**.

- Some answers must match **exactly**: "2 + 2 = 4". → `toBe`.
- Some answers are a **list**, and the teacher checks each item, not the paper it's written on. → `toEqual`.
- Some answers are a **project** the student hands in next week. The teacher must **wait until next week** to check it. → `async` / `await`.

Mapping:

- **Exact answer** = `toBe`.
- **Same content on a different paper** = `toEqual`.
- **Waiting for the project** = `await`.

If the teacher marks the project "correct" **before** it arrives, that's the classic mistake: a test that passes without really checking.

## 🧑‍💻 Code example

Setup: `npm init -y` and `npm install --save-dev jest`. Save the files, then run `npx jest --verbose`.

```js
// api.js — a fake "database" call that takes time
function getCandidate(id) {                                   // id of the candidate we want
  return new Promise((resolve, reject) => {                   // it answers later, like a real DB
    setTimeout(() => {                                        // wait a little, like network time
      if (id === 1) resolve({ id: 1, name: 'Asha', skills: ['node', 'react'] }); // found → success
      else reject(new Error('Candidate not found'));          // anything else → failure
    }, 50);                                                   // 50 ms delay
  });                                                         // end of the Promise
}                                                             // end of getCandidate
module.exports = { getCandidate };                            // share it
```

```js
// matchers.test.js — the most-used matchers + async tests
const { getCandidate } = require('./api');                    // the async function

describe('common matchers', () => {                           // group 1: checking values
  it('toBe vs toEqual', () => {                               // the most asked difference
    expect(2 + 2).toBe(4);                                    // toBe: exact same value (===-like)
    expect({ a: 1 }).toEqual({ a: 1 });                       // toEqual: same CONTENT, new objects are fine
    expect({ a: 1 }).not.toBe({ a: 1 });                      // two different objects are never toBe-equal
  });                                                         // end of test
  it('arrays, strings and numbers', () => {                   // more matchers
    expect(['node', 'react']).toContain('react');             // the array has this item
    expect('Hari Prasad').toMatch(/prasad/i);                 // the string matches this pattern
    expect(0.1 + 0.2).toBeCloseTo(0.3);                       // decimals are not exact, so use "close to"
    expect(null).toBeNull();                                  // exactly null
  });                                                         // end of test
});                                                           // end of group 1

describe('async tests', () => {                               // group 2: code that answers later
  it('async/await: found candidate', async () => {            // mark the test async
    const c = await getCandidate(1);                          // wait for the Promise
    expect(c).toMatchObject({ name: 'Asha' });                // check only the fields we care about
  });                                                         // end of test
  it('rejects: missing candidate', async () => {              // the failure path
    await expect(getCandidate(99)).rejects.toThrow('Candidate not found'); // MUST await, or the test ends too early
  });                                                         // end of test
});                                                           // end of group 2
```

```js
// timers.test.js — test a 5-second timer instantly
jest.useFakeTimers();                                         // replace real timers with fake, controllable ones
it('fake timers: no real waiting', () => {                    // checks a 5-second reminder without waiting 5 s
  const remind = jest.fn();                                   // a fake function that records its calls
  setTimeout(remind, 5000);                                   // schedule it for 5 seconds later
  expect(remind).not.toHaveBeenCalled();                      // nothing yet
  jest.advanceTimersByTime(5000);                             // jump the fake clock forward 5 s
  expect(remind).toHaveBeenCalledTimes(1);                    // now it has run once
});                                                           // end of test
```

**Output** (Jest 30, timings removed):

```text
PASS ./timers.test.js
  ✓ fake timers: no real waiting

PASS ./matchers.test.js
  common matchers
    ✓ toBe vs toEqual
    ✓ arrays, strings and numbers
  async tests
    ✓ async/await: found candidate
    ✓ rejects: missing candidate

Test Suites: 2 passed, 2 total
Tests:       5 passed, 5 total
```

## 🔍 Deeper version

**Matcher cheat sheet:**

| Matcher | Use it for |
|---|---|
| `toBe(x)` | numbers, strings, booleans, or "the same object" |
| `toEqual(x)` | objects and arrays by content (ignores `undefined` fields) |
| `toStrictEqual(x)` | like `toEqual`, but also checks `undefined` fields and class types |
| `toMatchObject(x)` | "has at least these fields" — great for API responses |
| `toContain(x)` / `toHaveLength(n)` | arrays and strings |
| `toMatch(/re/)` | strings against a pattern |
| `toBeNull()`, `toBeUndefined()`, `toBeDefined()`, `toBeTruthy()` | special values |
| `toBeCloseTo(n)` | decimal numbers |
| `toThrow(msg)` | sync errors — wrap the call in `() => …` |
| `.resolves` / `.rejects` | promises — always `await` them |
| `toHaveBeenCalled()`, `toHaveBeenCalledWith(…)`, `toHaveBeenCalledTimes(n)` | mock functions |
| `.not` | flips any matcher |

**`toBe` uses `Object.is`.** That's almost `===`, with two differences: `Object.is(NaN, NaN)` is `true`, and `Object.is(0, -0)` is `false`.

**Three ways to test async code:**
1. `async` test + `await` (the clearest — use this).
2. `return` the promise from the test.
3. `.resolves` / `.rejects` — but you must `await` or `return` them.

**The missing-`await` trap (real run).** I ran this with Jest 30. The check is wrong, and `await` is missing:

```js
it('missing await on resolves', () => {                       // NOT async, no await
  expect(getCandidate(99)).resolves.toMatchObject({ name: 'Asha' }); // getCandidate(99) actually REJECTS
});                                                            // end of test
```

```text
PASS ./noawait.test.js
  ✓ missing await on resolves
...
JestAssertionError: expect(received).resolves.toMatchObject()
Received promise rejected instead of resolved
```

The test shows **PASS**. The failure only appears after the run, outside any test. In a big suite this is easy to miss. The ESLint rule `jest/valid-expect` catches it.

**`expect.assertions(n)`.** Put it at the top of a test to say "exactly n checks must run". If a `catch` block never runs, the test fails instead of silently passing.

**Fake timers.** `jest.useFakeTimers()` replaces `setTimeout`, `setInterval` and `Date`. Move time with `jest.advanceTimersByTime(ms)` or `jest.runAllTimers()`. Call `jest.useRealTimers()` after, if other tests need real time.

## 🎯 Why do we use it?

- **The right matcher gives a clear failure message.** `toContain` says "the array didn't contain 'react'". A generic `toBe(true)` only says "expected true, got false".
- **Async tests match real code.** Most backend work — DB calls, HTTP calls — is async.
- **Fake timers keep tests fast.** A reminder job that waits 30 minutes can be tested in milliseconds.

## ⚠️ Common mistakes

- **Using `toBe` on objects.** `expect({a:1}).toBe({a:1})` fails, because they are two different objects. Use `toEqual`.
- **Forgetting `await` before `.rejects` / `.resolves`.** The test can pass falsely, as shown above.
- **Not wrapping a throwing call:** `expect(fn()).toThrow()` crashes the test. Write `expect(() => fn()).toThrow()`.
- **Exact comparison of decimals.** `0.1 + 0.2` is `0.30000000000000004`. Use `toBeCloseTo`.

## 🗣️ How to answer in an interview

> "Matchers are the checks after expect. The one I'm asked about most is toBe versus toEqual. toBe uses Object.is, so it's for primitives or the same object reference. toEqual compares content, so I use it for objects and arrays. For API responses I like toMatchObject, which checks only the fields I care about.
>
> For async code, I make the test async and await the call. For the error path, I write await expect(promise).rejects.toThrow. The await matters: without it the test can finish before the promise settles and pass even though the check failed. For timers, I use Jest's fake timers and advance time instead of really waiting."

## 🔁 Follow-up questions

### What is the difference between `toEqual` and `toStrictEqual`?

`toEqual` ignores fields that are `undefined` and doesn't check class types. `toStrictEqual` checks both. Use `toStrictEqual` when the exact shape matters.

### How do you check part of a big object?

Use `toMatchObject({ name: 'Asha' })`, or `expect.objectContaining({...})` inside other matchers. For "any string" or "any number", use `expect.any(String)`.

### How do you test a callback-style function?

Wrap it in a Promise and `await` it, or use the `done` argument: `it('x', (done) => { fn((err, data) => { expect(data).toBe(1); done(); }); })`.

### How do you test code that uses `Date.now()`?

Use fake timers with `jest.setSystemTime(new Date('2026-01-01'))`, so "now" is fixed and the test gives the same result every day.

## ✅ Quick check

### 1. Does this test pass?

```js
expect([1, 2]).toBe([1, 2]);  // two arrays with the same items
```

:::answer
**No.** They are two different arrays, and `toBe` checks they are the *same* array. `toEqual([1, 2])` would pass.
:::

### 2. What's wrong with this test?

```js
it('throws for a missing candidate', () => {          // not async
  expect(getCandidate(99)).rejects.toThrow();          // no await
});
```

:::answer
It's missing `async` and `await`. The test ends before the promise rejects, so it doesn't really check anything. Write `it('…', async () => { await expect(getCandidate(99)).rejects.toThrow(); })`.
:::

### 3. Which matcher should you use for `0.1 + 0.2`?

- A) `toBe(0.3)`
- B) `toEqual(0.3)`
- C) `toBeCloseTo(0.3)`

:::answer
**C.** Floating-point maths isn't exact, so `toBe` and `toEqual` both fail.
:::
