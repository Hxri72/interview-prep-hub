---
title: redux-saga basics (used at SkillKeepr)
stack: redux-context
order: 17
level: Intermediate
mustKnow: true
askedFrequency: common
summary:
  - "redux-saga is Redux middleware for side effects (API calls, timers, multi-step flows), written with generator functions (function*)."
  - "A watcher saga listens for actions (takeEvery / takeLatest); a worker saga does the job."
  - "Effects are instructions: call (run a function and wait), put (dispatch an action), take (wait for an action), all (run in parallel), race (first one wins)."
  - "takeLatest cancels the old worker when a new action arrives, which is perfect for search boxes."
  - "Teams pick saga for complex flows: waiting for a user's confirm/cancel, cancelling old requests, parallel uploads and central error handling."
cards:
  - q: What is redux-saga?
    a: A Redux middleware for side effects. You write the async logic in generator functions (sagas) that react to actions and dispatch new ones.
  - q: What is the difference between takeEvery and takeLatest?
    a: takeEvery starts a new worker for every action and lets them all run. takeLatest cancels the previous running worker, so only the latest action's work finishes.
  - q: What do call and put do?
    a: call(fn, ...args) runs a function and waits for its result (like await). put(action) dispatches an action.
  - q: How would you make a saga wait for the user to click Confirm or Cancel in a modal?
    a: "Dispatch an action that opens the modal, then yield race({ yes: take('modal/confirm'), no: take('modal/cancel') }). The saga pauses until one of them happens."
  - q: Why use sagas instead of thunks?
    a: Sagas handle complex, long-running flows well (cancellation, races, waiting for actions, retries) and are easy to test because effects are plain objects. Thunks are simpler for basic API calls.
---

## 💡 What is it?

**redux-saga** is a Redux [middleware](topic:redux-context/redux-middleware) for **side effects**: API calls, timers, and flows with many steps.

You write the logic in **sagas**. A saga is a **generator function** (`function*`). Generators can **pause** at each `yield` and continue later. See [generators](topic:javascript/generators-iterators).

A saga listens for actions, does async work, and dispatches new actions. Your components and reducers stay simple.

**SkillKeepr's frontend uses Redux with redux-saga** for its page logic and API calls.

## 🏠 Real-life example

Think of a **school office assistant who follows written instructions**.

- **The watcher** stands at the office door. Every time a student brings a request slip, the watcher passes it to a helper.
- **The helper (worker)** follows steps: "call the parent", "wait for the reply", "write the result in the register".
- With **takeLatest**, if the same student brings a **new** slip, the helper **throws away** the old one and works on the new one.

Mapping:
- **Request slip** = an action.
- **The watcher at the door** = `takeEvery` / `takeLatest`.
- **The helper** = the worker saga.
- **"Call the parent and wait"** = `call(api, …)`.
- **"Write it in the register"** = `put(action)`, which updates the Redux store.
- **"Wait until the principal says yes or no"** = `race` with two `take`s.

## 🧑‍💻 Code example

A search box: the user types fast, but only the **last** search should reach the API.

Run `npm install @reduxjs/toolkit redux-saga`. Save this as `saga.js` and run `node saga.js`. It uses CommonJS.

```js
const { configureStore, createSlice } = require('@reduxjs/toolkit'); // Redux Toolkit for the store
const createSagaMiddleware = require('redux-saga').default;       // the saga middleware
const { takeLatest, call, put, delay } = require('redux-saga/effects'); // saga "effects" (instructions)

const searchSlice = createSlice({                                 // a slice for search results
  name: 'search',                                                 // slice name
  initialState: { results: [], loading: false },                  // nothing found yet
  reducers: {                                                     // the actions
    searchRequested: (state) => { state.loading = true; },        // user typed → start loading
    searchSucceeded: (state, action) => {                         // API answered
      state.loading = false;                                      // stop loading
      state.results = action.payload;                             // save the results
    },                                                            // end of searchSucceeded
  },                                                              // end of reducers
});                                                               // end of createSlice
const { searchRequested, searchSucceeded } = searchSlice.actions; // action creators

const fakeSearchApi = async (text) => {                           // pretend API: slow, returns matches
  await new Promise((r) => setTimeout(r, 100));                   // wait 100 ms like a network call
  return [`results for "${text}"`];                               // one fake result
};                                                                // end of fakeSearchApi

function* searchWorker(action) {                                  // a WORKER saga (generator function: note the *)
  yield delay(50);                                                // wait 50 ms (a simple debounce)
  console.log('calling API for:', action.payload);                // only the last search gets this far
  const results = yield call(fakeSearchApi, action.payload);      // call = "run this function and wait"
  yield put(searchSucceeded(results));                            // put = "dispatch this action"
}                                                                 // end of searchWorker

function* rootSaga() {                                            // a WATCHER saga
  yield takeLatest(searchRequested.type, searchWorker);           // on each search, CANCEL the old worker, start a new one
}                                                                 // end of rootSaga

const sagaMiddleware = createSagaMiddleware();                    // create the middleware
const store = configureStore({                                    // create the store
  reducer: { search: searchSlice.reducer },                       // our slice
  middleware: (getDefault) => getDefault({ thunk: false }).concat(sagaMiddleware), // use sagas instead of thunks
});                                                               // end of configureStore
sagaMiddleware.run(rootSaga);                                     // start the watcher

store.dispatch(searchRequested('r'));                             // user types "r"
store.dispatch(searchRequested('re'));                            // then "re" → the "r" worker is cancelled
store.dispatch(searchRequested('react'));                         // then "react" → the "re" worker is cancelled
setTimeout(() => console.log('state:', store.getState().search), 300); // after 300 ms, look at the store
```

**Output:**

```text
calling API for: react
state: { results: [ 'results for "react"' ], loading: false }
```

Three searches were dispatched, but only **"react"** reached the API. `takeLatest` cancelled the older workers while they were waiting.

## 🔍 Deeper version

**Effects are plain objects.** `yield call(api, 'react')` doesn't call the API itself. It **returns an instruction**, `{ CALL: { fn: api, args: ['react'] } }`. The middleware reads it and does the work. This makes sagas **easy to test**: you step through the generator and check each instruction, with no real API.

**Common effects:**

| Effect | Meaning |
|---|---|
| `call(fn, ...args)` | run a function (often async) and wait for the result |
| `put(action)` | dispatch an action |
| `take(type)` | **pause** until an action of this type is dispatched |
| `select(selector)` | read from the store |
| `all([...])` | run several effects **in parallel** and wait for all |
| `race({ a, b })` | run several; the **first** to finish wins, the others are cancelled |
| `delay(ms)` | wait |
| `fork` / `cancel` | start a background task / stop it |
| `takeEvery` / `takeLatest` / `takeLeading` | watcher helpers |

**Pausing for a confirmation modal** (a pattern SkillKeepr's frontend uses):

```js
function* deleteJob() {                                        // runs when the user clicks "Delete"
  yield put({ type: 'modal/open' });                           // show the "Are you sure?" modal
  const { yes } = yield race({                                 // wait for whichever happens first
    yes: take('modal/confirm'),                                // the user clicks Confirm
    no: take('modal/cancel'),                                  // or the user clicks Cancel
  });                                                          // end of race
  console.log(yes ? 'confirmed → delete' : 'cancelled');       // continue only after the user decides
}                                                              // end of deleteJob
```

**Parallel uploads with `all`:**

```js
function* uploadAll() {                                        // upload 3 file parts at the same time
  const results = yield all([call(up, 1), call(up, 2), call(up, 3)]); // start all 3, wait for all
  console.log(results);                                        // ['part 1 done', 'part 2 done', 'part 3 done']
}                                                              // end of uploadAll
```

I ran both snippets. They printed `confirmed → delete` and `[ 'part 1 done', 'part 2 done', 'part 3 done' ]`.

**Error handling.** Wrap work in `try/catch` inside the worker and `put` a failure action. Many teams use **one shared helper saga** for API calls. It handles 401 (send to login), 503 (maintenance page) and network errors in one place, so every page behaves the same.

**Saga vs thunk vs listener:**

| | Thunk | Saga | Listener middleware (RTK) |
|---|---|---|---|
| Written with | async functions | generators | async functions |
| Best for | simple API calls | complex flows: cancel, race, wait for actions | "when X happens, do Y" |
| Learning curve | low | higher | low |
| Testing | mock fetch | step through effects | mock fetch |

:::note
redux-saga is still maintained (version 1.x), but **new** projects often choose RTK Query, TanStack Query or the RTK listener middleware instead. Many existing large apps, including SkillKeepr's frontend, still use sagas, so knowing them is valuable.
:::

## 🎯 Why do we use it?

- **Multi-step flows read like a story.** "Open the modal → wait for confirm → call the API → show a toast" is written top to bottom.
- **Cancellation.** `takeLatest` and `race` cancel old work, which prevents [race conditions](topic:debugging/search-race-condition) in searches.
- **Central error handling.** One helper handles 401/503 and network errors for every API call.
- **Testability.** Effects are plain objects, so tests don't need real APIs.

## ⚠️ Common mistakes

- **Forgetting the `*`** in `function*`. Then `yield` is a syntax error.
- **Calling the function yourself**: `yield api(x)` instead of `yield call(api, x)`. It works, but you lose easy testing and cancellation.
- **Using `takeEvery` for search.** Old responses can arrive late and overwrite new results. Use `takeLatest`.
- **No `try/catch` in workers.** An error kills the saga, and later actions are ignored.
- **Forgetting `sagaMiddleware.run(rootSaga)`.** Nothing happens.

## 🗣️ How to answer in an interview

> "redux-saga is a Redux middleware for side effects, written with generator functions. A watcher saga listens for actions with takeEvery or takeLatest, and starts a worker saga. The worker yields effects: call to run an API and wait, put to dispatch an action, take to wait for an action, all for parallel work, and race when the first result wins. Effects are plain objects that the middleware runs, so sagas are easy to test.
>
> SkillKeepr's frontend uses Redux with redux-saga. Typical patterns are takeLatest for searches, so old requests are cancelled; a saga that opens a confirmation modal and waits with race for confirm or cancel; all for parallel uploads; and one shared helper for API errors like 401 and 503. For simpler apps today I'd consider thunks, the listener middleware or RTK Query, but for complex multi-step flows sagas are very clear."

[FILL IN: one saga you wrote or changed at SkillKeepr, if you did.]

## 🔁 Follow-up questions

### Why generators and not async/await?

A generator can be **paused and controlled from outside**. The middleware decides when to continue, and it can **cancel** the saga in the middle. With async/await you can't stop a function halfway.

### What does takeLeading do?

It runs the first action's worker and **ignores** new actions until that worker finishes. It's useful for "submit" buttons, to prevent double submits.

### How do you test a saga?

Call the generator, then call `.next()` step by step and check each yielded effect with `toEqual(call(api, 'x'))`. You can also use `runSaga` or a helper library to run it with fake results.

### How do you cancel a background task?

Start it with `fork`, keep the returned task, and later `yield cancel(task)`. Inside the task, a `finally` block can check `yield cancelled()` to clean up.

## ✅ Quick check

### 1. The user dispatches searches for "j", "ja" and "java" quickly. With `takeLatest`, which one reaches the API?

:::answer
Only **"java"**. `takeLatest` cancels the earlier workers when a new action arrives.
:::

### 2. Which effect pauses a saga until a specific action is dispatched?

- A) `put`
- B) `take`
- C) `call`

:::answer
**B) `take`.** `put` dispatches an action, and `call` runs a function.
:::

### 3. What does `yield all([call(a), call(b)])` do?

:::answer
It runs `a` and `b` **in parallel** and waits until both finish. The result is an array of both results.
:::
