---
title: "Test databases and mongodb-memory-server"
stack: testing
order: 7
level: Intermediate
mustKnow: false
askedFrequency: sometimes
summary:
  - Tests must never touch the production database. Use a separate test database.
  - mongodb-memory-server starts a real, temporary MongoDB for your test run and deletes it afterwards.
  - "Pattern: start + connect in beforeAll, empty the collections in afterEach, disconnect + stop in afterAll."
  - A real test DB catches things mocks can't — unique indexes, real queries, validation rules.
  - Starting MongoDB is slow, so give beforeAll a longer timeout than the 5-second default.
cards:
  - q: Why use a real test database instead of mocks?
    a: Mocks can't check real query behaviour — unique indexes, filters, aggregations, schema validation. A real test DB catches those bugs.
  - q: What is mongodb-memory-server?
    a: A package that downloads and starts a real MongoDB server just for your tests, gives you its URI, and removes it when you call stop().
  - q: What do you put in beforeAll, afterEach and afterAll?
    a: "beforeAll: start the server and connect. afterEach: delete all documents so tests don't affect each other. afterAll: disconnect and stop the server."
  - q: Why did my beforeAll time out?
    a: Starting (or first downloading) MongoDB can take longer than the 5-second default hook timeout. Pass a longer timeout, like 60000 ms, as the second argument.
  - q: Can tests share one database safely?
    a: Only if each test cleans up its data (or uses unique data), and parallel test files use separate databases. Otherwise tests become flaky.
---

## 💡 What is it?

Some tests need a real [database](glossary:database). For example: "saving the same email twice must fail". A mock can't prove that. Only real MongoDB knows about the unique [index](glossary:index).

But tests must **never** use the real production database. So we use a separate **test database**.

**mongodb-memory-server** is a package that starts a **real, temporary MongoDB** just for your tests. When the tests finish, it disappears.

## 🏠 Real-life example

Think of a **chemistry practical in school**.

Students don't experiment on the school's main water tank. The teacher gives each group a **fresh beaker** of water. They do the experiment, write the result, and **empty the beaker** before the next group comes.

Mapping:

- **The main water tank** = the production database (never touch it).
- **The fresh beaker** = the in-memory test MongoDB.
- **Emptying the beaker between groups** = deleting all documents in `afterEach`.
- **Putting the beaker away at the end** = `afterAll` stopping the server.

Because every group starts with a clean beaker, one group's mistake can't spoil another group's result.

## 🧑‍💻 Code example

Setup: `npm init -y`, `npm install mongoose` and `npm install --save-dev vitest mongodb-memory-server`. Save both files, then run `npx vitest run`. The first run downloads a MongoDB binary, so it is slower.

```js
// candidate.model.js — a Mongoose model with a unique email
const mongoose = require('mongoose');                         // MongoDB library
const schema = new mongoose.Schema({                          // the shape of a candidate
  name: { type: String, required: true },                     // name must be given
  email: { type: String, required: true, unique: true },      // unique: true → MongoDB builds a unique index
});                                                           // end of schema
module.exports = mongoose.model('Candidate', schema);         // the model we use in code
```

```js
// candidate.test.mjs — Vitest (same describe/it/expect style as Jest)
import { beforeAll, afterEach, afterAll, it, expect } from 'vitest'; // test functions
import mongoose from 'mongoose';                               // MongoDB library
import { MongoMemoryServer } from 'mongodb-memory-server';     // starts a real MongoDB in memory
import Candidate from './candidate.model.js';                  // the model under test

let mongo;                                                     // the in-memory server
beforeAll(async () => {                                        // once, before all tests
  mongo = await MongoMemoryServer.create();                    // start a throwaway MongoDB
  await mongoose.connect(mongo.getUri());                      // connect Mongoose to it
  await Candidate.init();                                      // wait until the unique index is built
}, 60000);                                                     // 60 s limit: starting MongoDB is slower than the 5 s default
afterEach(async () => {                                        // after EACH test
  await Candidate.deleteMany({});                              // empty the collection, so tests don't affect each other
});                                                            // end of afterEach
afterAll(async () => {                                         // once, after all tests
  await mongoose.disconnect();                                 // close the connection
  await mongo.stop();                                          // stop and delete the in-memory DB
});                                                            // end of afterAll

it('saves and finds a candidate', async () => {                // test 1
  await Candidate.create({ name: 'Asha', email: 'asha@x.com' }); // real insert into a real (temporary) DB
  const found = await Candidate.findOne({ email: 'asha@x.com' }); // real query
  expect(found.name).toBe('Asha');                             // it came back
});                                                            // end of test 1

it('rejects a duplicate email (unique index)', async () => {   // test 2
  await Candidate.create({ name: 'Asha', email: 'asha@x.com' }); // first one is fine
  await expect(                                                // the second one must fail
    Candidate.create({ name: 'Asha 2', email: 'asha@x.com' }), // same email again
  ).rejects.toThrow(/E11000/);                                 // E11000 = MongoDB "duplicate key" error
});                                                            // end of test 2

it('starts empty because afterEach cleaned up', async () => {  // test 3
  expect(await Candidate.countDocuments()).toBe(0);            // proves tests are isolated
});                                                            // end of test 3
```

**Output** (Vitest 5, Mongoose 9, MongoDB 8.2 in memory):

```text
 ✓ candidate.test.mjs > saves and finds a candidate
 ✓ candidate.test.mjs > rejects a duplicate email (unique index)
 ✓ candidate.test.mjs > starts empty because afterEach cleaned up

 Test Files  1 passed (1)
      Tests  3 passed (3)
```

:::note[Why Vitest here?]
When this exact test was run under **Jest 30** with Mongoose 9 (while writing this page), the connection failed inside Jest's test sandbox with `MongooseServerSelectionError: Missing required sub-document 'driver' in the client metadata document`. The same code connected fine in plain Node and in Vitest. The setup pattern (beforeAll / afterEach / afterAll) is identical in Jest. If you use Jest and hit that error, check your Jest, Mongoose and MongoDB driver versions together.
:::

## 🔍 Deeper version

**Where a test database fits:**

| Approach | Good for | Weak at |
|---|---|---|
| Mock the repository | fast unit tests of business logic | real query behaviour |
| **In-memory real MongoDB** | indexes, queries, aggregations, validation | slower start; not identical to your hosted setup |
| Docker MongoDB / a CI service container | the same version and config as production | needs Docker; slower |
| A shared "test" cluster | nothing much | tests collide; data leaks between runs — avoid |

**Speed tips:**
- Start the server **once per test file** (`beforeAll`), not per test.
- Clear data with `deleteMany({})` per collection, which is faster than dropping the database each time.
- For big suites, start one server in Jest's `globalSetup`, and give each test file **its own database name**, so parallel files don't collide.

**Replica sets for transactions.** MongoDB [transactions](glossary:transaction) need a replica set. mongodb-memory-server has `MongoMemoryReplSet` for that. Use it when the code under test calls `session.withTransaction()`.

**Seeding data.** Create test data with small **factory** helpers, like `makeCandidate({ email })`, inside each test. Tests then show exactly which data they rely on.

**Multi-tenant apps.** If each tenant has its own database, as at SkillKeepr, a test can create **two** temporary databases and check that tenant A's request can never read tenant B's data. That is one of the most valuable tests in a multi-tenant system. [FILL IN: whether you wrote tests against a real or in-memory database.]

**What NOT to do:** point tests at a "dev" database that people also use by hand. Data changes under the tests, and tests change real-looking data.

## 🎯 Why do we use it?

- **Real behaviour:** unique indexes, `$lookup`, filters and validators run exactly as MongoDB runs them.
- **Safety:** production data is never touched.
- **Repeatable:** every run starts from an empty database, so results don't depend on yesterday's data.
- **No manual setup:** no one needs to install MongoDB to run the tests; the package downloads it.

## ⚠️ Common mistakes

- **No longer timeout on `beforeAll`.** Starting MongoDB can take more than the 5-second default. The hook times out until you pass a bigger limit, like `60000`, as the second argument.
- **Forgetting to clean up between tests.** Test 3 then sees test 1's data and fails sometimes.
- **Forgetting `afterAll` stop/disconnect.** The test runner hangs with "did not exit" because the connection is still open.
- **Testing the unique index before it exists.** Indexes build in the background. Call `Model.init()` (or `syncIndexes()`) first, or the duplicate insert may succeed.

## 🗣️ How to answer in an interview

> "Tests never touch the real database. For logic I mock the repository, but for anything that depends on real database behaviour — unique indexes, queries, aggregations — I use a real test database. With MongoDB, mongodb-memory-server starts a real temporary MongoDB.
>
> The pattern is: in beforeAll I start the server and connect, with a longer timeout because startup is slow. In afterEach I delete all documents so tests stay independent. In afterAll I disconnect and stop the server. For transactions I use the replica-set version. For a multi-tenant app, I'd also test that one tenant can never read another tenant's data.
>
> [FILL IN: what database testing looked like on your team.]"

## 🔁 Follow-up questions

### mongodb-memory-server or Docker?

The memory server is easiest: no Docker, nothing to install. Docker (or a CI service container) lets you match the exact production version and config. Many teams use the memory server locally and in CI, and Docker for a few end-to-end checks.

### How do you keep parallel test files from colliding?

Give each test file its own database name or its own server, and never share state through global variables.

### How do you test code that uses transactions?

Use `MongoMemoryReplSet`, because MongoDB only supports transactions on replica sets. Then test both the commit path and the abort path, where one step fails and nothing should be saved.

### How would you test a PostgreSQL-backed service?

The same idea: a real Postgres in Docker or Testcontainers, run migrations once, and wrap each test in a transaction that you roll back at the end.

## ✅ Quick check

### 1. In which hook do you empty the collections?

- A) `beforeAll`
- B) `afterEach`
- C) `afterAll`

:::answer
**B) `afterEach`** (or `beforeEach`), so every test starts clean. `beforeAll`/`afterAll` run only once.
:::

### 2. Your `beforeAll` fails with "Exceeded timeout of 5000 ms for a hook". What's the fix?

:::answer
Starting MongoDB is slow. Pass a longer timeout as the second argument: `beforeAll(async () => { … }, 60000)`.
:::

### 3. True or false: a mocked repository can prove that the unique email index works.

:::answer
**False.** Only a real database enforces a unique index. A mock returns whatever you tell it to.
:::
