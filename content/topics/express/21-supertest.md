---
title: Testing routes with Supertest
stack: express
order: 21
level: Intermediate
mustKnow: false
askedFrequency: common
summary:
  - Supertest sends fake HTTP requests to your Express app inside a test, and lets you check the status, headers and body.
  - Export the app from app.js and call listen() in a separate server.js, so tests can use the app without opening a port.
  - Test the happy path AND the error paths (400, 401, 404), because bugs usually hide in the error cases.
  - Use a separate test database, or mock the data layer, so tests never touch real data.
  - Supertest works with Jest, Vitest or Node's built-in test runner.
cards:
  - q: What does Supertest do?
    a: It sends real HTTP requests to your Express app inside a test, without you starting the server on a port, and lets you check status, headers and body.
  - q: Why split app.js (export app) from server.js (app.listen)?
    a: So tests can import the app without starting a real server on a port. Supertest starts a temporary server itself.
  - q: Is a Supertest test a unit test or an integration test?
    a: An integration test. It runs the real routes, middleware, validation and error handler together.
  - q: What should you test for a POST route?
    a: The success case (201 + body), validation errors (400), auth errors (401/403), and that the data was really saved.
  - q: How do you keep route tests from touching real data?
    a: Use a separate test database (or mongodb-memory-server), reset it between tests, or mock the service/database layer.
---

## 💡 What is it?

**Supertest** is a small library for **testing your Express routes**.

Inside a test, it sends an HTTP request to your app, just like a real client would. Then you check the answer: the **status code**, the **headers** and the **body**.

It works together with a test runner like **Jest**. Jest runs the tests and shows pass or fail. Supertest makes the HTTP requests.

## 🏠 Real-life example

Think of a **driving test**.

The examiner doesn't just read the car's manual. They sit in the car and give real orders: "turn left", "stop at the signal", "park here". Then they check if the car and driver did the right thing.

They also test **tricky moments**. What happens when a child runs onto the road? A good driver must handle that too.

- **The examiner** = your test (Jest).
- **The orders "turn left", "park here"** = requests sent by Supertest (`GET /students`, `POST /students`).
- **Checking what the car did** = `expect(res.status).toBe(201)`.
- **The child running onto the road** = error cases, like a missing name (400) or no login (401).
- **A practice ground, not a real highway** = a test database, not the real one.

## 🧑‍💻 Code example

Set up:

```bash
npm init -y
npm install express
npm install --save-dev jest supertest
```

Save this as `app.js`:

```js
const express = require('express');                            // load Express

const app = express();                                         // create the app (but do NOT call listen here)
app.use(express.json());                                       // read JSON request bodies into req.body

const students = [{ id: 1, name: 'Asha' }];                    // a tiny in-memory "database"

app.get('/students', (req, res) => {                           // list all students
  res.json(students);                                          // 200 + the array
});                                                            // end of GET

app.post('/students', (req, res) => {                          // add a student
  if (!req.body?.name) {                                       // name is required
    return res.status(400).json({ error: 'name is required' }); // 400 = bad request
  }                                                            // end of the check
  const student = { id: students.length + 1, name: req.body.name }; // make the new student
  students.push(student);                                      // save it
  res.status(201).json(student);                               // 201 = created
});                                                            // end of POST

module.exports = app;                                          // export the app, so tests can use it without a port
```

Save this as `app.test.js`. Run it with `npx jest`.

```js
const request = require('supertest');                          // Supertest: sends fake HTTP requests to an app
const app = require('./app');                                  // the app we exported (not listening on a port)

describe('Students API', () => {                               // a group of related tests
  it('GET /students returns the list', async () => {           // one test case
    const res = await request(app).get('/students');           // send GET /students
    expect(res.status).toBe(200);                              // expect "OK"
    expect(res.body).toEqual([{ id: 1, name: 'Asha' }]);       // expect the exact data
  });                                                          // end of test 1

  it('POST /students creates a student', async () => {         // test 2: the happy path
    const res = await request(app)                             // start a request to the app
      .post('/students')                                       // method + URL
      .send({ name: 'Ravi' });                                 // JSON body (Supertest sets Content-Type for us)
    expect(res.status).toBe(201);                              // 201 = created
    expect(res.body).toMatchObject({ name: 'Ravi' });          // the body has at least name: 'Ravi'
  });                                                          // end of test 2

  it('POST /students without a name returns 400', async () => { // test 3: the error path
    const res = await request(app).post('/students').send({}); // empty body
    expect(res.status).toBe(400);                              // 400 = bad request
    expect(res.body.error).toBe('name is required');           // the right error message
  });                                                          // end of test 3
});                                                            // end of the group
```

**Output:**

```text
Test Suites: 1 passed, 1 total
Tests:       3 passed, 3 total
```

The real server lives in a separate file, `server.js`, with `require('./app').listen(3000)`. Tests never run that file.

## 🔍 Deeper version

**How Supertest works.** You give it the app. It starts the app on a **random free port** for that request, sends a real HTTP request, and closes it afterwards. So you test the whole HTTP layer: routing, middleware, body parsing, validation, the error handler and the status codes.

**Unit vs integration tests:**
- A **unit test** checks one function alone, like a price calculator.
- A **Supertest test** is an **integration test**. Many parts work together, including the real Express stack.

Both are useful. Put the business rules in services and unit test them. Then use Supertest for the main paths of each route.

**Useful Supertest features:**

```js
await request(app)
  .get('/me')                                       // the route to call
  .set('Authorization', `Bearer ${token}`)          // add a header, e.g. a test JWT
  .expect('Content-Type', /json/)                   // check a header with a regex
  .expect(200);                                     // check the status (throws if different)
```

**What to do about the database.** Choose one approach per test suite:

| Approach | How | Good for |
|---|---|---|
| Separate test database | A different `DATABASE_URL` in a `.env.test` file. Clean the data in `beforeEach` | Realistic tests, closest to production |
| In-memory MongoDB | `mongodb-memory-server` starts a temporary MongoDB inside the tests | Fast, needs no setup on CI |
| Mock the data layer | `jest.mock('./services/userService')` returns fake data | Testing only the HTTP layer (validation, status codes) |

Close database connections in `afterAll`. Otherwise Jest may say it "did not exit" because something is still open.

**Testing protected routes.** Make a real test token with your JWT secret from the test environment. Or log in through the API in `beforeAll` and reuse the token.

**Running in CI.** Tests run on every push in GitHub Actions. If one fails, the pull request can't merge.

**Express 5 note.** Async errors now reach your error handler by themselves. A test that sends bad data and expects a clean `500` or `400` JSON response is a great way to prove that.

## 🎯 Why do we use it?

- **Catches real bugs.** It tests what the client actually sees: the status code, the JSON shape and the headers.
- **Safe changes.** When you refactor a controller or update Express, the tests tell you if a route broke.
- **Documents the API.** A test like "POST without a name returns 400" shows how the endpoint should behave.
- **No manual Postman clicks.** The same checks run in seconds, every time, on every push.

## ⚠️ Common mistakes

- **Calling `app.listen()` inside `app.js`.** Then every test file opens a real port, and tests fight over it or hang. Export the app and listen in `server.js`.
- **Only testing the happy path.** Most bugs live in error paths: missing fields, wrong types, no token, wrong role.
- **Tests that depend on each other.** If test 2 needs data from test 1, running one test alone fails. Reset the data before each test.
- **Using the real production or development database.** Tests may delete or change real data. Always use a separate test database.

## 🗣️ How to answer in an interview

> "I test Express routes with Jest and Supertest. I split the code so `app.js` exports the Express app and `server.js` calls listen. Then in a test, I pass the app to Supertest, send a request like `request(app).post('/students').send({...})`, and check the status code and the response body.
>
> These are integration tests. They run the real middleware, validation and error handler together. I always test the error paths too: a 400 for invalid input, a 401 with no token, and a 404 for a missing record.
>
> For data, I use a separate test database or mongodb-memory-server and reset it before each test. Sometimes I mock the service layer when I only want to test the HTTP part. The tests run in CI on every pull request."

[FILL IN: what your Jest coverage at SkillKeepr included — unit tests, route tests with Supertest, or both, and one real example. The resume mentions Jest coverage, but not Supertest specifically.]

## 🔁 Follow-up questions

### What's the difference between `toEqual` and `toMatchObject`?

`toEqual` needs the object to be exactly the same, field by field. `toMatchObject` only checks the fields you list, so extra fields like `id` or `createdAt` are fine. Use `toMatchObject` when the response has values you can't predict.

### How do you test a route that calls an external API, like Stripe?

Don't call the real service in tests. Mock the module that wraps it (`jest.mock('./stripeClient')`), or use a tool like `nock` to fake the HTTP reply. Then also test what happens when the fake service fails.

### Why does Jest say "did not exit one second after the test run"?

Something is still open, often a database connection, a timer or a server. Close connections in `afterAll`, and make sure `app.js` doesn't call `listen`.

### Can you use Supertest without Jest?

Yes. It works with any test runner, like Vitest, Mocha or Node's built-in `node:test`.

## ✅ Quick check

### 1. Why should `app.js` NOT call `app.listen()` if you test it with Supertest?

:::answer
Supertest starts its own temporary server from the app. If `app.js` also listens on a port, every test file opens that port too. Tests can then fail with "port already in use", or hang and never exit.
:::

### 2. Which test is MOST likely to find a bug that users would hit?

- A) `GET /students` returns 200
- B) `POST /students` with an empty body returns 400 with a clear message
- C) Checking that `app` is an object

:::answer
**B.** Error paths are where bugs hide. A is useful, but it only proves the easy case. C tests almost nothing.
:::

### 3. Is a Supertest route test a unit test or an integration test?

:::answer
**An integration test.** It runs many real parts together: routing, middleware, body parsing, validation and the error handler.
:::
