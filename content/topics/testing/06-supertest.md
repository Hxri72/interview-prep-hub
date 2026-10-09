---
title: "Testing Express APIs with Supertest"
stack: testing
order: 6
level: Intermediate
mustKnow: true
askedFrequency: common
summary:
  - Supertest sends real HTTP requests to your Express app inside a test — no real port needed.
  - "Build the app with a function (createApp) that receives its dependencies, so each test gets a fresh app and a fake or test data store."
  - For protected routes, make a real test token with a test secret and send it in the Authorization header.
  - "Test every path of an endpoint: success (200/201), not logged in (401), not allowed (403), bad input (400), not found (404)."
  - Reset data in beforeEach, so every test starts from the same clean state.
cards:
  - q: What does Supertest give you over calling the controller function directly?
    a: It runs the real routing, middleware (auth, JSON parsing, validation) and error handling, so you test the endpoint the way a client uses it.
  - q: How do you test a route that needs login?
    a: "Sign a real JWT in the test with a test-only secret, and send it with .set('Authorization', `Bearer ${token}`)."
  - q: Why build the app with a createApp() function?
    a: So each test can create a fresh app and pass in its own dependencies (a fake store or a test database), with no shared state between tests.
  - q: Which cases should an endpoint test cover?
    a: The success case plus each failure the endpoint can return — 401 no token, 403 wrong role, 400 bad input, 404 not found — and that the data was really saved.
  - q: Is a Supertest test a unit or integration test?
    a: An integration test — the route, middleware and handler run together.
---

## 💡 What is it?

**Supertest** sends HTTP requests to your Express app **inside a test**. You don't start a real server on a [port](glossary:port).

You already met the basics in [Testing routes with Supertest](topic:express/supertest). This topic is about **organising** API tests in a real project:
- how to give each test a **fresh app**,
- how to test **protected routes** that need a login [token](glossary:jwt),
- and how to cover **every status code** an endpoint can return.

## 🏠 Real-life example

Think of a **school's exam hall door** with a guard.

To check the guard does the job well, you send in different people:
- A student **with a hall ticket** → allowed in. (201: success)
- Someone **with no ticket** → stopped at the door. (401: not logged in)
- A **parent with a visitor pass** → recognised, but not allowed into the exam. (403: not allowed)
- A student with a ticket but **no pen and no roll number** → sent back. (400: bad input)

Mapping:

- **The guard** = the auth and validation middleware.
- **The hall tickets** = test tokens you make yourself.
- **A fresh, empty hall before each test** = `beforeEach` creating a new app and empty store.

You test the door by **actually sending people through it**, not by reading the guard's rule book. That's what Supertest does.

## 🧑‍💻 Code example

Setup: `npm init -y`, `npm install express jsonwebtoken` and `npm install --save-dev jest supertest`. Save both files, then run `npx jest --verbose`.

```js
// createApp.js — builds the app; the data store is passed IN, so tests can give a fake one
const express = require('express');                           // web framework
const jwt = require('jsonwebtoken');                          // to check login tokens
function createApp({ store, secret }) {                       // store = where jobs are saved; secret = JWT key
  const app = express();                                      // a fresh app every time we call createApp
  app.use(express.json());                                    // read JSON bodies
  function auth(req, res, next) {                             // a tiny auth middleware
    const token = (req.headers.authorization || '').replace('Bearer ', ''); // "Bearer abc" → "abc"
    try { req.user = jwt.verify(token, secret); next(); }     // valid → remember the user, continue
    catch { res.status(401).json({ error: 'Not logged in' }); } // invalid or missing → 401
  }                                                           // end of auth
  app.post('/jobs', auth, (req, res) => {                     // create a job (login required)
    if (req.user.role !== 'recruiter') return res.status(403).json({ error: 'Not allowed' }); // logged in, wrong role → 403
    if (!req.body.title) return res.status(400).json({ error: 'title is required' }); // bad input → 400
    const job = store.add({ title: req.body.title });         // save it
    res.status(201).json(job);                                // 201 = created
  });                                                         // end of route
  return app;                                                 // give the app back
}                                                             // end of createApp
module.exports = { createApp };                               // share it
```

```js
// jobs.test.js
const request = require('supertest');                         // HTTP requests in tests
const jwt = require('jsonwebtoken');                          // to make test tokens
const { createApp } = require('./createApp');                 // the app builder

const SECRET = 'test-secret';                                 // a fake key, only for tests
const tokenFor = (role) => jwt.sign({ id: 'u1', role }, SECRET); // helper: a real token for any role

let app, store;                                               // fresh for every test
beforeEach(() => {                                            // runs before EACH test
  const jobs = [];                                            // a new, empty "database"
  store = { add: (j) => { const job = { id: jobs.length + 1, ...j }; jobs.push(job); return job; }, all: () => jobs }; // a simple in-memory fake
  app = createApp({ store, secret: SECRET });                 // a new app using the fake store
});                                                           // end of beforeEach

describe('POST /jobs', () => {                                // one group per endpoint
  it('201: recruiter creates a job', async () => {            // success path
    const res = await request(app).post('/jobs')              // send POST /jobs
      .set('Authorization', `Bearer ${tokenFor('recruiter')}`) // log in as a recruiter
      .send({ title: 'Node Developer' });                     // the JSON body
    expect(res.status).toBe(201);                             // created
    expect(res.body).toEqual({ id: 1, title: 'Node Developer' }); // the new job
    expect(store.all()).toHaveLength(1);                      // and it was really saved
  });                                                         // end of test
  it('401: no token', async () => {                           // not logged in
    const res = await request(app).post('/jobs').send({ title: 'X' }); // no Authorization header
    expect(res.status).toBe(401);                             // not logged in
  });                                                         // end of test
  it('403: candidate cannot create jobs', async () => {       // wrong role
    const res = await request(app).post('/jobs')              // send POST /jobs
      .set('Authorization', `Bearer ${tokenFor('candidate')}`) // logged in, wrong role
      .send({ title: 'X' });                                  // a valid body
    expect(res.status).toBe(403);                             // not allowed
  });                                                         // end of test
  it('400: missing title', async () => {                      // bad input
    const res = await request(app).post('/jobs')              // send POST /jobs
      .set('Authorization', `Bearer ${tokenFor('recruiter')}`) // correct role
      .send({});                                              // empty body
    expect(res.status).toBe(400);                             // bad request
    expect(res.body.error).toBe('title is required');         // clear message
  });                                                         // end of test
});                                                           // end of group
```

**Output** (Jest 30, timings removed):

```text
PASS ./jobs.test.js
  POST /jobs
    ✓ 201: recruiter creates a job
    ✓ 401: no token
    ✓ 403: candidate cannot create jobs
    ✓ 400: missing title

Test Suites: 1 passed, 1 total
Tests:       4 passed, 4 total
```

## 🔍 Deeper version

**A good folder layout:**

```text
src/
  app.js          ← createApp(deps): routes + middleware, NO listen()
  server.js       ← creates real deps, calls app.listen(PORT)
tests/
  helpers/auth.js ← tokenFor(role)
  jobs.test.js    ← one file per resource
```

Splitting `app` from `server` means tests can import the app without opening a port.

**Three ways to handle data in API tests:**

| Option | Speed | Realism | When |
|---|---|---|---|
| In-memory fake store (like above) | fastest | low | testing route logic, auth and status codes |
| Mock the service/repository with `jest.mock` | fast | low | when the app isn't built with dependency injection |
| Real test database (e.g. mongodb-memory-server) | slower | high | checking real queries, indexes and unique rules — see [test databases](topic:testing/test-databases) |

Many teams use the first two for most tests and a real test DB for the data-heavy endpoints.

**Testing auth properly:**
- Make tokens with a **test-only secret**, passed in through config. Never use the production secret in tests.
- Test an **expired** token too: `jwt.sign(payload, SECRET, { expiresIn: -10 })` makes a token that is already expired.
- If your app uses **cookies** instead of headers, Supertest can send them with `.set('Cookie', 'token=...')`, or use `request.agent(app)` to keep cookies between requests, like a real browser.

**What to check in each test:** the status code, the important parts of the body, important headers (like `Content-Type` or `Location`), and the **side effect** — was it really saved, was the email really queued.

**Keep tests independent.** Each test builds its own app and data in `beforeEach`. Tests then pass in any order, and Jest can run files in parallel.

**At SkillKeepr.** I documented our backend APIs with Swagger and wrote Jest unit tests. [FILL IN: whether you also tested endpoints end to end with requests, and how auth was handled in those tests.]

## 🎯 Why do we use it?

- **Tests what clients really see:** status codes, JSON shape, headers.
- **Catches wiring bugs** that unit tests miss: middleware in the wrong order, a missing `express.json()`, the wrong status code.
- **Safe refactoring:** you can rewrite a handler's insides, and the endpoint tests prove the contract didn't change.
- **Covers security:** you can prove that wrong roles really get 403, not just assume it.

## ⚠️ Common mistakes

- **Calling `app.listen()` in the file the tests import.** Tests then open real ports and can hang. Export the app, and listen in a separate file.
- **Only testing the 200 path.** The 401, 403 and 400 paths are where security bugs hide.
- **Shared data between tests.** One test's leftover job makes another test's count wrong. Reset in `beforeEach`.
- **Using real secrets or a real database URL in tests.** Use test config.

## 🗣️ How to answer in an interview

> "For Express APIs I write integration tests with Supertest. I keep the app in a createApp function that receives its dependencies, and call listen in a separate server file. Each test builds a fresh app in beforeEach with a fake store or a test database, so tests never share data.
>
> For a protected endpoint, I sign real JWTs in the test with a test-only secret, using a small helper like tokenFor('recruiter'). Then I cover every path: 201 for success — and I check it was really saved — 401 with no token, 403 for the wrong role, and 400 for bad input. These catch wiring and security bugs that unit tests miss.
>
> [FILL IN: how API testing was done on your team.]"

## 🔁 Follow-up questions

### How do you test an endpoint that calls Stripe or another external API?

Mock the client module (`jest.mock('./stripeClient')`), or intercept the HTTP call with a tool like MSW or nock. Never call the real service from tests. Test both the success answer and the error answer.

### How do you test file uploads with Supertest?

Use `.attach('file', 'tests/fixtures/resume.pdf')`, and `.field('name', 'value')` for other form fields. Check size and type limits too.

### Should you check the whole response body?

Check what matters for that test. `toMatchObject` checks a subset, so tests don't break when you add a new field. Check the full shape when the contract itself is what you're testing.

### How do you test a route that uses cookies for auth?

Send the cookie with `.set('Cookie', ['token=abc'])`, or log in once with `request.agent(app)`. The agent stores cookies and sends them on later requests.

## ✅ Quick check

### 1. Why is `createApp()` better than `const app = express()` at the top of the file?

:::answer
Each test can create a **fresh** app and pass in its **own** dependencies (fake store, test secret), so tests are independent and nothing real is touched.
:::

### 2. A recruiter token gets 201. A candidate token also gets 201. Which test would catch this bug?

:::answer
The **403** test ("candidate cannot create jobs"). It expects 403, gets 201, and fails.
:::

### 3. Which test should check that the job was really saved, not just that the response was 201?

- A) The 401 test
- B) The 201 test
- C) No test should

:::answer
**B.** A 201 response with nothing saved is a real bug. The success test should check the side effect: `expect(store.all()).toHaveLength(1)`.
:::
