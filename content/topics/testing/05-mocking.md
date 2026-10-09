---
title: "Mocking: jest.mock, spies and test doubles"
stack: testing
order: 5
level: Intermediate
mustKnow: true
askedFrequency: very common
summary:
  - A mock is a fake version of something slow or risky — a database, an email service, an API — used only in tests.
  - jest.fn() makes a fake function that records how it was called. jest.mock('./file') replaces a whole module with fakes.
  - jest.spyOn(obj, 'method') watches a real method, and can also replace its answer. Restore it afterwards.
  - "Stub = returns a fixed answer. Mock = also checks how it was called. Fake = a simple working version (like an in-memory store)."
  - Mock the edges (DB, network, email, time), not your own logic — or the test checks nothing real.
cards:
  - q: What is a mock?
    a: A fake stand-in for a real dependency (database, API, email) in a test. It returns answers you choose and records how it was called.
  - q: jest.fn vs jest.mock vs jest.spyOn?
    a: "jest.fn() creates one fake function. jest.mock('./module') replaces every export of a module with fakes. jest.spyOn(obj, 'name') wraps a real method so you can watch or override it, and restore it later."
  - q: How do you make a mocked async function return a value?
    a: "mockFn.mockResolvedValue(value) for success, or mockRejectedValue(new Error('x')) for failure."
  - q: Why call jest.clearAllMocks() in beforeEach?
    a: So call counts and recorded arguments from the previous test don't leak into the next one.
  - q: What should you NOT mock?
    a: The logic you're testing. Mock only the edges — DB, network, email, time — otherwise the test only proves the mocks work.
---

## 💡 What is it?

**Mocking** means using a **fake** version of something in a test.

Real code talks to slow or risky things: a [database](glossary:database), an email service, a payment [API](glossary:api). In a unit test you don't want real emails or real payments. So you swap them for fakes that **you control**.

A mock can also **remember how it was called**. Then you can check: "Did my code send exactly one welcome email, to the right person?"

## 🏠 Real-life example

Think of a **school fire drill**.

The school wants to check that everyone knows what to do in a fire. But nobody lights a real fire! The teacher just **rings the bell** and watches.

- The **real fire** = the real database or email service (dangerous in a test).
- The **bell** = the mock. It's fake, but it starts the same reaction.
- The **teacher with a clipboard**, writing "Class 7B left in 2 minutes" = the mock **recording calls**.
- Checking the clipboard afterwards = `expect(mock).toHaveBeenCalledWith(...)`.

The drill tests the **students' behaviour** (your logic), not the fire.

## 🧑‍💻 Code example

Setup: `npm init -y` and `npm install --save-dev jest`. Save the four files, then run `npx jest --verbose`. The service skips duplicate emails — the same idea as checking for an existing email before importing a candidate.

```js
// repo.js — talks to the real database (we do NOT want this in a unit test)
module.exports = {                                            // the database layer
  findByEmail: async (email) => { throw new Error('real DB called!'); }, // would hit MongoDB for real
  create: async (data) => { throw new Error('real DB called!'); },       // would insert for real
};                                                            // end of module
```

```js
// mailer.js — sends real emails (we do NOT want this in a test either)
module.exports = { sendWelcome: async (email) => { throw new Error('real email sent!'); } }; // the email layer
```

```js
// candidateService.js — the logic we want to test
const repo = require('./repo');                               // database layer
const mailer = require('./mailer');                           // email layer
async function addCandidate(data) {                           // add a new candidate
  const existing = await repo.findByEmail(data.email);        // is this email already saved?
  if (existing) return { created: false, reason: 'duplicate' }; // yes → skip it
  const saved = await repo.create(data);                      // no → save it
  await mailer.sendWelcome(saved.email);                      // and send a welcome email
  return { created: true, id: saved.id };                     // report success
}                                                             // end of addCandidate
module.exports = { addCandidate };                            // share it
```

```js
// candidateService.test.js
jest.mock('./repo');                                          // replace EVERY function in repo.js with a jest.fn()
jest.mock('./mailer');                                        // same for mailer.js — no real emails
const repo = require('./repo');                               // now these are the mocks
const mailer = require('./mailer');                           // mocked mailer
const { addCandidate } = require('./candidateService');       // real logic, using the mocks

beforeEach(() => jest.clearAllMocks());                       // forget calls from the previous test

it('saves a new candidate and sends a welcome email', async () => { // test 1: the happy path
  repo.findByEmail.mockResolvedValue(null);                   // stub: "no one has this email"
  repo.create.mockResolvedValue({ id: 'c1', email: 'asha@x.com' }); // stub: pretend the save worked
  const result = await addCandidate({ email: 'asha@x.com' }); // run the real logic
  expect(result).toEqual({ created: true, id: 'c1' });        // check the returned value
  expect(mailer.sendWelcome).toHaveBeenCalledWith('asha@x.com'); // check the email was "sent" to the right person
});                                                           // end of test 1

it('skips a duplicate email', async () => {                   // test 2: the duplicate path
  repo.findByEmail.mockResolvedValue({ id: 'old' });          // stub: email already exists
  const result = await addCandidate({ email: 'asha@x.com' }); // run the logic
  expect(result).toEqual({ created: false, reason: 'duplicate' }); // it should skip
  expect(repo.create).not.toHaveBeenCalled();                 // nothing saved
  expect(mailer.sendWelcome).not.toHaveBeenCalled();          // no email sent
});                                                           // end of test 2

it('spyOn watches a real method', () => {                     // test 3: spying on a real function
  const spy = jest.spyOn(Math, 'random').mockReturnValue(0.5); // control a real function's answer
  expect(Math.random()).toBe(0.5);                            // now it is predictable
  spy.mockRestore();                                          // put the real Math.random back
});                                                           // end of test 3
```

**Output** (Jest 30, timings removed):

```text
PASS ./candidateService.test.js
  ✓ saves a new candidate and sends a welcome email
  ✓ skips a duplicate email
  ✓ spyOn watches a real method

Test Suites: 1 passed, 1 total
Tests:       3 passed, 3 total
```

**What to notice:** the real `repo.js` and `mailer.js` throw errors. The tests still pass, which proves they were never called.

## 🔍 Deeper version

**Kinds of test doubles** (a "test double" is any stand-in, like a stunt double in a film):

| Name | What it does | Example |
|---|---|---|
| **Dummy** | Passed in but never used | an empty object for a required argument |
| **Stub** | Returns a fixed answer | `findByEmail.mockResolvedValue(null)` |
| **Spy** | Records calls; may keep the real behaviour | `jest.spyOn(console, 'error')` |
| **Mock** | A stub + checks on how it was called | `expect(sendWelcome).toHaveBeenCalledWith(...)` |
| **Fake** | A simple *working* version | an in-memory array instead of MongoDB |

In everyday Jest talk, people call all of these "mocks".

**The Jest tools:**
- `jest.fn()` — a fake function. Program it with `.mockReturnValue`, `.mockResolvedValue`, `.mockRejectedValue`, `.mockImplementation`.
- `jest.mock('./module')` — auto-mocks every export. Jest **hoists** (moves) `jest.mock` calls to the top of the file, so they run before `require`.
- `jest.mock('./module', () => ({ fn: jest.fn() }))` — a factory, when you want to choose exactly what's inside.
- `jest.spyOn(obj, 'method')` — wraps a real method. Always call `.mockRestore()` (or turn on `restoreMocks` in config).
- `clearAllMocks` (forget calls) vs `resetAllMocks` (also remove programmed answers) vs `restoreAllMocks` (put real spied methods back).

**Dependency injection makes mocking easy.** If a function receives its database as an argument (`createApp({ store })`), the test just passes a fake. No module mocking is needed. See [Supertest](topic:testing/supertest) for an example.

**What to mock — the edges:**
- ✅ Database, HTTP calls to other services (Stripe, an ATS, an AI API), email/SMS, file storage, time (`Date`), randomness.
- ❌ Your own business logic, pure helper functions, and simple data shaping.

**Mocking HTTP.** For code that calls `fetch`, a tool like **MSW** (Mock Service Worker) intercepts requests at the network level. Your code stays unchanged. It works in Node tests and in the browser.

**At SkillKeepr.** Our backend tests call handlers with a hand-built request, and mock the repository (data) layer and the database connection, so no real database is touched. [FILL IN: a test you wrote using mocks, and what it checked.]

## 🎯 Why do we use it?

- **Speed:** no real database or network, so tests run in milliseconds.
- **Safety:** no real emails, payments or calls to third parties from a test.
- **Control:** you can easily create rare cases, like "the payment API is down" or "this email already exists".
- **Checks on side effects:** you can prove an email was sent once, to the right person.

## ⚠️ Common mistakes

- **Mocking the thing you're testing.** Then the test only proves the mock works.
- **Not resetting mocks between tests.** Old call counts leak into the next test. Use `beforeEach(() => jest.clearAllMocks())`.
- **Forgetting `mockRestore()` after `spyOn`.** The fake stays for later tests and causes strange failures.
- **Mocks that drift from reality.** If the real API changes its response shape, your mock still returns the old shape, and the test keeps passing. Back mocks up with a few integration tests.

## 🗣️ How to answer in an interview

> "Mocking means replacing a slow or risky dependency with a fake I control. In Jest, jest.fn creates a fake function that records its calls. jest.mock replaces a whole module, like the repository or email module. jest.spyOn wraps a real method, and I restore it afterwards.
>
> For example, to test an 'add candidate' service, I mock the repository so findByEmail returns null or an existing record, and mock the mailer. Then I check two paths: a new email is saved and gets a welcome mail, and a duplicate is skipped with nothing saved and no email sent.
>
> I mock only the edges — database, network, email, time — never the logic under test. I reset mocks before each test. And I keep a few integration tests with a real test database, so my mocks don't hide real problems.
>
> At SkillKeepr I wrote Jest unit tests with mocked data layers. [FILL IN: one example.]"

## 🔁 Follow-up questions

### What is the difference between `mockReturnValue` and `mockResolvedValue`?

`mockReturnValue(x)` returns `x` directly. `mockResolvedValue(x)` returns a Promise that resolves to `x`, for async functions. It's the same as `mockImplementation(() => Promise.resolve(x))`.

### Why does `jest.mock` work even though it comes after `require` in my head?

Jest (through its Babel/transform step) **hoists** `jest.mock` calls to the top of the file. So the mock is set up before any `require` runs.

### How do you mock only one function in a module and keep the rest real?

Use a factory with `jest.requireActual`: `jest.mock('./utils', () => ({ ...jest.requireActual('./utils'), sendEmail: jest.fn() }))`.

### How do you test what happens when the database fails?

Program the mock to fail: `repo.create.mockRejectedValue(new Error('DB down'))`. Then check your code returns the right error or retries.

## ✅ Quick check

### 1. What does this line do?

```js
repo.findByEmail.mockResolvedValue(null);   // inside a test
```

:::answer
It makes the mocked async `findByEmail` return a Promise that resolves to `null` — meaning "no candidate has this email" — for this test.
:::

### 2. After `jest.spyOn(Math, 'random').mockReturnValue(0.5)`, you forget `mockRestore()`. What happens?

:::answer
Later code in the same test file keeps getting `0.5` from `Math.random()`, which can break other tests in confusing ways. Always restore spies (or set `restoreMocks: true` in config).
:::

### 3. You're testing `calculateDiscount()`, a pure function with no database. Should you mock anything?

:::answer
**No.** It has no slow or risky dependencies. Call it directly and check the result.
:::
