---
title: Testing sagas
stack: redux-context
order: 20
level: Intermediate
mustKnow: false
askedFrequency: sometimes
summary:
  - "Effects are plain objects, so you can test a saga by stepping through it with gen.next() and comparing each yielded effect."
  - "gen.next(value) is how you 'answer' an effect: the value you pass in becomes the result of the last yield (API reply, user choice, store value)."
  - "runSaga runs the saga for real, with a fake store, a real channel and a mocked API, then you check the dispatched actions."
  - "redux-saga-test-plan (expectSaga) checks behaviour instead of exact order. It still works with redux-saga 1.5, but it hasn't had a release since 2022."
  - Test the happy path, the cancel/decline path and the failure path.
cards:
  - q: Why are sagas easy to unit test?
    a: Each yield returns a plain effect object (like call(api, id)), so you can compare it with toEqual without running the API.
  - q: What does gen.next(x) do in a saga test?
    a: It resumes the generator and makes x the result of the previous yield, so you can fake an API reply or a user's choice.
  - q: What is the downside of step-by-step generator tests?
    a: They lock in the exact order of effects, so a harmless refactor (like adding a select) breaks the test.
  - q: How do you run a saga in a test without the Redux store?
    a: Use runSaga with a fake dispatch, getState and a stdChannel, mock the API with jest.spyOn, and await task.toPromise().
  - q: Is redux-saga-test-plan still a good choice?
    a: It works with redux-saga 1.5 (tested), but its last release was in 2022, so for new tests runSaga-based integration tests are a safe default.
---

## 💡 What is it?

A [saga](topic:redux-context/redux-saga) is a generator [function](glossary:function). It yields **effects**, which are plain objects like `call(api.deleteJob, 'job-42')`.

That makes sagas easy to test. You don't need a real API or a real store. There are three ways:

1. **Step by step:** walk the generator and check each effect.
2. **`runSaga`:** run the saga for real, with fakes, and check the actions it dispatched.
3. **`redux-saga-test-plan`:** a helper library that checks behaviour.

## 🏠 Real-life example

Think of a **school exam with an invigilator**.

- **Step-by-step testing** = the teacher checks every line of a student's working: "Step 1 correct, step 2 correct…". It's very strict. A different but correct method still loses marks.
- **`gen.next(value)`** = the teacher gives the student a fact to use in the next step ("assume x = 5").
- **`runSaga` testing** = the teacher only checks the final answer and the main steps written down. It's more flexible.
- **The fake API** = a practice question paper, so the real exam isn't used up.

## 🧑‍💻 Code example

**The saga under test.** A "Delete job" flow: show a confirm modal, wait for the user, read the tenant, call the API, then dispatch success or failure. Save it as `jobs.js`. It uses CommonJS.

```js
const { call, put, race, take, select } = require('redux-saga/effects');     // effects used by the saga

const api = { deleteJob: async (id) => ({ ok: true, id }) };                  // the real API (tests replace it)
const selectTenant = (state) => state.auth.tenantId;                          // read the tenant from the store

function* deleteJobSaga(action) {                                             // runs when the user clicks "Delete job"
  yield put({ type: 'modal/open', payload: 'Delete this job?' });             // 1. show the confirm modal
  const { yes } = yield race({ yes: take('modal/confirm'), no: take('modal/cancel') }); // 2. wait for the user's choice
  if (!yes) return;                                                           // cancelled → stop here
  const tenantId = yield select(selectTenant);                                // 3. which company is this?
  try {                                                                       // 4. call the API, it may fail
    yield call(api.deleteJob, action.payload, tenantId);                      // delete the job
    yield put({ type: 'jobs/deleted', payload: action.payload });             // 5a. success action
  } catch (e) {                                                               // API failed
    yield put({ type: 'jobs/deleteFailed', error: e.message });               // 5b. failure action
  }                                                                           // end of try
}                                                                             // end of deleteJobSaga

module.exports = { deleteJobSaga, api, selectTenant };                        // export for the tests
```

**The tests**, all three styles. Run `npm install redux-saga jest redux-saga-test-plan`, save this as `jobs.test.js`, then run `npx jest --verbose`.

```js
const { call, put, race, take, select } = require('redux-saga/effects');     // to build the expected effects
const { runSaga, stdChannel } = require('redux-saga');                        // run a saga with a fake store + a real channel
const { expectSaga } = require('redux-saga-test-plan');                       // the helper library
const { throwError } = require('redux-saga-test-plan/providers');             // fake a failing call
const { deleteJobSaga, api, selectTenant } = require('./jobs');               // the saga under test

const action = { type: 'jobs/delete', payload: 'job-42' };                    // the action that starts the saga

test('1. step by step: confirm → select → call → success', () => {           // way 1: walk the generator by hand
  const gen = deleteJobSaga(action);                                          // create the generator (nothing runs yet)
  expect(gen.next().value).toEqual(put({ type: 'modal/open', payload: 'Delete this job?' })); // first instruction
  expect(gen.next().value).toEqual(race({ yes: take('modal/confirm'), no: take('modal/cancel') })); // waits for the user
  expect(gen.next({ yes: { type: 'modal/confirm' } }).value).toEqual(select(selectTenant)); // we "answer" yes
  expect(gen.next('acme').value).toEqual(call(api.deleteJob, 'job-42', 'acme')); // we "answer" tenant = acme
  expect(gen.next({ ok: true }).value).toEqual(put({ type: 'jobs/deleted', payload: 'job-42' })); // API "returned" ok
  expect(gen.next().done).toBe(true);                                         // the saga has finished
});                                                                           // end of test 1

test('2. step by step: cancel stops the saga', () => {                        // the user clicks Cancel
  const gen = deleteJobSaga(action);                                          // new generator
  gen.next(); gen.next();                                                     // skip to the race
  expect(gen.next({ no: { type: 'modal/cancel' } }).done).toBe(true);        // Cancel → finished, no API call
});                                                                           // end of test 2

test('3. runSaga: real effects, fake API and store', async () => {            // way 2: run it like the real middleware
  const dispatched = [];                                                      // collect every put()
  const spy = jest.spyOn(api, 'deleteJob').mockResolvedValue({ ok: true });   // fake the API call
  const channel = stdChannel();                                               // the same kind of channel the middleware uses
  const task = runSaga({                                                      // run with a fake store
    channel,                                                                  // take() listens on this channel
    dispatch: (a) => { dispatched.push(a); channel.put(a); },                 // record actions AND let take() see them
    getState: () => ({ auth: { tenantId: 'acme' } }),                         // the state select() will read
  }, deleteJobSaga, action);                                                  // the saga and its starting action
  channel.put({ type: 'modal/confirm' });                                     // the user clicks Confirm
  await task.toPromise();                                                     // wait until the saga ends
  expect(spy).toHaveBeenCalledWith('job-42', 'acme');                         // the API got the right arguments
  expect(dispatched.map((a) => a.type)).toEqual(['modal/open', 'jobs/deleted']); // actions in order
  spy.mockRestore();                                                          // put the real API back
});                                                                           // end of test 3

test('4. redux-saga-test-plan: failure path', () => {                         // way 3: the helper library
  return expectSaga(deleteJobSaga, action)                                    // run the saga in a test harness
    .withState({ auth: { tenantId: 'acme' } })                               // the store state
    .provide([[call(api.deleteJob, 'job-42', 'acme'), throwError(new Error('500 from API'))]]) // fake a failing API
    .dispatch({ type: 'modal/confirm' })                                      // the user clicks Confirm
    .put({ type: 'jobs/deleteFailed', error: '500 from API' })                // we expect the failure action
    .run();                                                                   // run it (returns a promise)
});                                                                           // end of test 4
```

**Output** (Jest 30.5, redux-saga 1.5.1, redux-saga-test-plan 4.0.6, Node 24):

```text
PASS t/jobs.test.js
  ✓ 1. step by step: confirm → select → call → success (1 ms)
  ✓ 2. step by step: cancel stops the saga
  ✓ 3. runSaga: real effects, fake API and store (1 ms)
  ✓ 4. redux-saga-test-plan: failure path (7 ms)

Test Suites: 1 passed, 1 total
Tests:       4 passed, 4 total
```

## 🔍 Deeper version

**How `gen.next(value)` works.** Every `yield` pauses the saga. In a test, **you** decide what comes back.

| Call | What the saga receives | What you check |
|---|---|---|
| `gen.next()` | nothing (start) | the first effect: `put(modal/open)` |
| `gen.next()` | nothing (the `put` result) | the `race` effect |
| `gen.next({ yes: … })` | the race result: "the user clicked Confirm" | the `select` effect |
| `gen.next('acme')` | `tenantId = 'acme'` | the `call` effect, with the right arguments |
| `gen.next({ ok: true })` | the API result | the success `put` |
| `gen.throw(new Error('500'))` | an error at the last `yield` | the failure `put` (tests the `catch`) |

**What a failure looks like.** If the expected effect is wrong, Jest shows the difference inside the effect object:

```text
- Expected  - 1
+ Received  + 1
      Object {
        "@@redux-saga/IO": true,
        "payload": Object {
          "action": Object {
-           "payload": "Delete job?",
+           "payload": "Delete this job?",
            "type": "modal/open",
```

**Comparing the three styles:**

| | Step by step | `runSaga` | `expectSaga` (test-plan) |
|---|---|---|---|
| Checks | exact order of every effect | the final dispatched actions + API calls | chosen effects, any order |
| Breaks on harmless refactor | **often** | rarely | rarely |
| Extra library | no | no (part of redux-saga) | yes |
| Good for | small, critical sagas, error branches | most sagas | teams already using it |

:::note[About redux-saga-test-plan]
Version **4.0.6** works with redux-saga 1.5 (all four tests above pass), but its **last release was in 2022**. For new tests, `runSaga` plus `stdChannel` is a safe default that needs no extra library. Keep `expectSaga` where a project already uses it.
:::

**Why `stdChannel`?** `take()` listens on a channel. With `stdChannel`, every action you `put` into it is seen by the saga, even when two `take`s are waiting inside a `race`. If you write a home-made fake channel, it usually supports only one waiting `take`, and the `race` test hangs or fails. That happened to me while writing this page.

## 🎯 Why do we use it?

- **Sagas hold the important flows:** payments, deletes, uploads, login. Bugs there are expensive.
- **Branches are easy to miss:** the cancel path, the API failure path and the timeout path. Tests make you check each one.
- **No network needed:** the API is mocked, so tests are fast and don't fail when a server is down.
- **Safe refactors:** with `runSaga` tests, you can rewrite a saga and still prove it behaves the same.

[FILL IN: whether your team tests sagas at SkillKeepr, and which style. You wrote Jest unit tests on the backend; only claim frontend saga tests if you really wrote them.]

## ⚠️ Common mistakes

- **Testing only the happy path.** Also test cancel, API failure (`gen.throw` or `throwError`) and an empty result.
- **Forgetting that `gen.next(x)` answers the previous `yield`**, not the next one. That one-step shift causes most confusing test failures.
- **Calling the real API in tests.** Mock it with `jest.spyOn`, a provider, or step-by-step tests that never run `call`.
- **Writing only step-by-step tests for big sagas.** They break on every small reorder. Prefer `runSaga` for complex flows.

## 🗣️ How to answer in an interview

> "Sagas are nice to test because each yield returns a plain effect object. For small sagas, I step through the generator with gen.next and compare each effect with toEqual. I pass values into next to fake an API reply or a user's choice, and use gen.throw to test the error branch.
>
> For bigger flows, I prefer an integration-style test with runSaga. I give it a fake dispatch and getState, a real stdChannel so take and race work, and mock the API with jest.spyOn. Then I check which actions were dispatched and what the API was called with. That doesn't break when I reorder effects.
>
> redux-saga-test-plan's expectSaga is also handy. It still works with the current redux-saga, but it hasn't had a release since 2022, so for new code I lean on runSaga. In every case I test the success, cancel and failure paths."

## 🔁 Follow-up questions

### How do you test the catch block with step-by-step tests?

Walk the generator to the `call`, then run `gen.throw(new Error('500'))` instead of `gen.next(...)`. The error appears at that `yield`, so the next value should be the failure `put`.

### How do you test a saga that uses delay or a timeout race?

In step-by-step tests, `delay` is just an effect, so pass the race result you want: `gen.next({ timeout: true })`. With `runSaga`, use Jest fake timers, or keep the delays very short in tests.

### Do you test watchers like takeLatest?

Rarely. They're library code. Test the **worker** saga directly. Testing a watcher mostly checks that it's wired to the right action type.

### What's the difference between this and testing a thunk?

A thunk calls the API directly, so you must mock `fetch` or `axios`. A saga yields `call(...)` instructions, so you can test without mocking anything.

## ✅ Quick check

### 1. In test 1, what would `gen.next({ no: { type: 'modal/cancel' } })` return at the race step?

:::answer
`{ value: undefined, done: true }`. The saga sees `yes` is undefined, runs `return`, and finishes without calling the API.
:::

### 2. Which line fakes the API's reply in the step-by-step test?

- A) `gen.next('acme')`
- B) `gen.next({ ok: true })`
- C) `jest.spyOn(api, 'deleteJob')`

:::answer
**B.** That value becomes the result of `yield call(api.deleteJob, …)`. (A answers the `select`; C is only used in the `runSaga` test.)
:::

### 3. Why does test 3 call `channel.put(a)` inside the fake `dispatch`?

:::answer
So that actions the saga dispatches are visible to its own `take()` effects, just like in the real middleware. The test also uses `channel.put` to send the user's "Confirm".
:::
