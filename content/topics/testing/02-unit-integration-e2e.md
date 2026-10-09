---
title: "Unit vs integration vs end-to-end tests"
stack: testing
order: 2
level: Basic
mustKnow: true
askedFrequency: very common
summary:
  - A unit test checks one small piece (a function) alone, with no network or database.
  - An integration test checks several parts working together, like a route + validation + logic, often with Supertest.
  - An end-to-end (e2e) test drives the whole app through a real browser, like a user. Playwright is the common tool.
  - "Trade-off: unit = fast and precise, e2e = slow but closest to reality. Integration sits in the middle."
  - A good suite has all three, with many unit tests and only a few e2e tests.
cards:
  - q: What is a unit test?
    a: A test of one small piece of code alone — usually one function — with no real database, network or browser.
  - q: What is an integration test?
    a: A test of several parts working together, for example an Express route with its middleware, validation and logic, called with Supertest.
  - q: What is an end-to-end test?
    a: A test that runs the whole app through a real browser, clicking and typing like a user, for example with Playwright.
  - q: Is a Supertest route test a unit test?
    a: No, it's an integration test. It runs the real routing, middleware, JSON parsing and handler together.
  - q: Why not test everything end to end?
    a: E2e tests are slow, need a full running app, are more flaky, and when they fail it's hard to see which part broke.
---

## 💡 What is it?

There are three main sizes of automated tests.

- A **unit test** checks **one small piece** of code alone, usually one [function](glossary:function).
- An **integration test** checks **several pieces working together**, like an [API](glossary:api) route and the logic behind it.
- An **end-to-end (e2e) test** checks the **whole app** through a real browser, the way a user uses it.

Each one catches different bugs. A healthy project uses all three.

## 🏠 Real-life example

Think of **making a bicycle in a factory**.

- A worker checks that **one gear** turns smoothly. That's a **unit test**.
- Then they fix the gear, chain and pedals together and check that **pedalling turns the wheel**. That's an **integration test**.
- Finally, a tester **rides the finished bicycle** around the yard. That's an **end-to-end test**.

Mapping:

- **The gear** = one function.
- **Gear + chain + pedals** = route + middleware + logic.
- **Riding the bike** = a real browser using the whole app.

A perfect gear is no use if the chain doesn't fit. And a test ride won't tell you **which** part is squeaking. You need all three.

## 🧑‍💻 Code example

Setup: `npm init -y`, then `npm install express` and `npm install --save-dev jest supertest`. Save the three files, then run `npx jest --verbose`.

```js
// score.js — pure logic: is a candidate eligible for a job?
function isEligible(candidate, minYears) {                 // candidate object + the job's minimum years
  return candidate.years >= minYears;                       // true when they have enough experience
}                                                           // end of isEligible
module.exports = { isEligible };                            // share it
```

```js
// app.js — a tiny Express app that USES the logic
const express = require('express');                         // the web framework
const { isEligible } = require('./score');                  // our pure function
const app = express();                                      // create the app
app.use(express.json());                                    // read JSON bodies
app.post('/check', (req, res) => {                          // POST /check
  const ok = isEligible(req.body, 3);                       // jobs here need 3+ years
  res.json({ eligible: ok });                               // send the answer as JSON
});                                                         // end of the route
module.exports = app;                                       // export the app (no listen) for tests
```

```js
// levels.test.js — one unit test and one integration test for the same feature
const request = require('supertest');                       // sends HTTP requests to the app
const { isEligible } = require('./score');                  // the pure function
const app = require('./app');                               // the whole Express app

describe('unit test: one function alone', () => {           // group 1
  it('5 years is eligible for a 3-year job', () => {        // fast: no server, no network
    expect(isEligible({ years: 5 }, 3)).toBe(true);         // 5 >= 3 → true
  });                                                       // end of it
});                                                         // end of group 1

describe('integration test: route + JSON + function together', () => { // group 2
  it('POST /check returns eligible: false for 1 year', async () => { // async because HTTP takes time
    const res = await request(app).post('/check').send({ years: 1 }); // real HTTP request through Express
    expect(res.status).toBe(200);                           // 200 = OK
    expect(res.body).toEqual({ eligible: false });          // 1 < 3 → false
  });                                                       // end of it
});                                                         // end of group 2
```

**Output** (Jest 30, timings removed):

```text
PASS ./levels.test.js
  unit test: one function alone
    ✓ 5 years is eligible for a 3-year job
  integration test: route + JSON + function together
    ✓ POST /check returns eligible: false for 1 year

Test Suites: 1 passed, 1 total
Tests:       2 passed, 2 total
```

**What to notice:** the unit test only knows about `isEligible`. The integration test also proves that the route, the JSON body parser and the response all work together.

## 🔍 Deeper version

**Comparison:**

| | Unit | Integration | End-to-end |
|---|---|---|---|
| **Scope** | one function / class | a few real parts together | the whole system |
| **Fake things?** | mocks for DB, email, network | sometimes a test DB or a fake external API | as little as possible |
| **Speed** | ~1 ms each | ~10–100 ms each | seconds each |
| **When it fails** | points to the exact function | points to one area | "something in the journey broke" |
| **Tools (Node/React)** | Jest, Vitest | Supertest, mongodb-memory-server, React Testing Library | Playwright, Cypress |

**An end-to-end test with Playwright.** Playwright opens a real browser, then types and clicks like a user. Here's a small one I ran with Playwright 1.64 and a local Chrome. `page.setContent` stands in for a real page; in a project you'd use `page.goto('http://localhost:5173/login')`.

```js
// login.spec.js — run with: npx playwright test
const { test, expect } = require('@playwright/test');        // Playwright's test runner
test('user can log in', async ({ page }) => {                 // page = a real browser tab
  await page.setContent(`<form onsubmit="event.preventDefault();document.body.innerHTML='<h1>Dashboard</h1>'">
    <label>Email <input name=email></label><button>Log in</button></form>`); // stand-in for the real app page
  await page.getByLabel('Email').fill('hari@example.com');   // type like a user
  await page.getByRole('button', { name: 'Log in' }).click(); // click like a user
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible(); // check what the user sees
});                                                            // end of the test
```

```text
Running 1 test using 1 worker
  ✓  1 login.spec.js:2:1 › user can log in
  1 passed
```

**Where the line blurs.** Is a React Testing Library test a unit or an integration test? It renders one component, but with its real children and real event handling. Most people call it an integration test. In interviews, explain **what you mock and what you don't**. That matters more than the label.

**Contract tests.** In microservices, a contract test checks that service A's requests still match what service B accepts. It sits between integration and e2e. It's good to know the name.

## 🎯 Why do we use it?

- **Unit tests** give fast, exact feedback while you code.
- **Integration tests** catch the bugs that live in the gaps: wrong middleware order, a missing JSON parser, a wrong status code.
- **E2e tests** prove the most important user journeys really work, from button click to database and back.

Using all three in the right amounts gives the most confidence for the least time.

## ⚠️ Common mistakes

- **Calling a route test a "unit test".** If it goes through Express, it's integration.
- **Mocking everything in an integration test.** Then it doesn't test integration any more.
- **Many slow e2e tests for small details.** Test validation messages with unit or integration tests; keep e2e for journeys.
- **E2e tests that share data.** One test's leftover data breaks another. Give each test its own fresh data.

## 🗣️ How to answer in an interview

> "A unit test checks one piece alone, like a function that decides if a candidate is eligible. I mock its dependencies, so it runs in milliseconds and points to the exact problem.
>
> An integration test checks parts together. For an Express API, I use Supertest to send a real request through the route, middleware and handler, sometimes with a test database. It catches bugs in the gaps between parts, like a wrong status code.
>
> An end-to-end test drives the whole app through a real browser with a tool like Playwright: log in, search, click. It's closest to the user, but slow and harder to debug, so I keep only a few for key journeys.
>
> My backend work at SkillKeepr was mostly Jest unit tests. [FILL IN: whether you also wrote integration or e2e tests there.]"

## 🔁 Follow-up questions

### What do you mock in a unit test?

Anything slow or outside your control: the database, external APIs, email, time and randomness. The function's own logic stays real.

### Should integration tests use a real database?

Often yes — a **test** database, never production. Tools like mongodb-memory-server start a throwaway MongoDB for the test run. See [test databases](topic:testing/test-databases).

### Playwright or Cypress?

Both are good. Playwright supports Chromium, Firefox and WebKit, runs tests in parallel by default, and has auto-waiting locators. Cypress has a very friendly interactive runner. Many new projects pick Playwright.

### How do you stop e2e tests from being flaky?

Use auto-waiting locators (`getByRole`) instead of fixed sleeps. Give each test fresh data. Mock third-party services that you don't own. Retry only as a last resort.

## ✅ Quick check

### 1. A test calls `POST /jobs` with Supertest and checks the 201 response. What kind of test is it?

:::answer
**An integration test.** It runs the real route, middleware and handler together.
:::

### 2. Which test is the FASTEST?

- A) A Playwright test that logs in
- B) A Jest test of one pure function
- C) A Supertest test with a test database

:::answer
**B.** A pure-function unit test needs no browser, server or database.
:::

### 3. Your e2e test fails with "something went wrong on the search page". Which kind of test would help you find the exact broken function?

:::answer
**A unit test** of the search logic. Unit tests point to the exact function; e2e tests only tell you the journey broke.
:::
