---
title: "redux-saga effects in depth: take, call, put, fork, race, all, cancel"
stack: redux-context
order: 19
level: Intermediate
mustKnow: false
askedFrequency: sometimes
summary:
  - "Watcher helpers: takeEvery runs every action, takeLatest keeps only the last (cancels older), takeLeading keeps only the first (ignores new ones while busy)."
  - "call blocks and waits; fork starts an attached background task; spawn starts a detached one."
  - "An error in a forked child can't be caught by the parent's try/catch: it aborts the parent. A spawned child's error doesn't touch the parent."
  - "race = first one wins, the rest are cancelled (timeouts, confirm/cancel modals). all = run in parallel, wait for every one."
  - "cancel(task) stops a background task; its finally block runs, and cancelled() tells you it was a cancel."
cards:
  - q: takeEvery vs takeLatest vs takeLeading?
    a: takeEvery runs a worker for every action. takeLatest cancels the running worker and keeps only the newest. takeLeading ignores new actions while one worker is still running.
  - q: call vs fork?
    a: call runs a function and waits for it (blocking). fork starts a background task and continues straight away (non-blocking).
  - q: Can you catch a forked child's error with try/catch around the fork?
    a: No. An error in an attached (forked) child aborts the parent. Catch it inside the child, or use spawn for a detached task.
  - q: How do you add a timeout to an API call in a saga?
    a: "yield race({ data: call(api), timeout: delay(5000) }) — whichever finishes first wins; the other is cancelled."
  - q: How does a saga clean up when it is cancelled?
    a: Put cleanup in a finally block. Inside it, yield cancelled() returns true when the task was cancelled.
---

## 💡 What is it?

**Effects** are the instructions a saga gives to the redux-saga middleware. You read the basics in [redux-saga basics](topic:redux-context/redux-saga).

This page goes deeper. It covers:
- the three **watcher** helpers
- `call`, `fork` and `spawn`
- `put` and `select`
- `race` and `all`
- `cancel`
- `eventChannel` for WebSockets

You also learn how errors move between tasks. It's the part most people get wrong.

## 🏠 Real-life example

Think of a **school office** that handles requests from students.

- **takeEvery** = a clerk who handles every form, one after another. Three forms → three jobs.
- **takeLatest** = a clerk who throws away the old form when a newer one arrives. Only the last form counts.
- **takeLeading** = a clerk who says "I'm busy, come back later". Only the first form counts.
- **call** = the clerk phones another office and **waits** on the line.
- **fork** = the clerk sends a helper to do a job. If the helper has an accident, the clerk's job is stopped too.
- **spawn** = the clerk asks a different department. Their problems don't affect the clerk.
- **race** = "whoever answers first, the parent or the teacher, decides". The other call is hung up.
- **all** = the clerk sends three helpers at once and waits for all of them.
- **cancel** = the clerk calls a helper back. The helper tidies up (the `finally` block) before leaving.

## 🧑‍💻 Code example

One file that shows every effect. Run `npm install redux-saga @reduxjs/toolkit`, save this as `effects.js`, and run `node effects.js`. It uses CommonJS.

```js
const createSagaMiddleware = require('redux-saga').default;              // the saga middleware
const { configureStore } = require('@reduxjs/toolkit');                  // Redux Toolkit store
const { takeEvery, takeLatest, takeLeading, call, put, fork, spawn, select, delay, race, take, all, cancel, cancelled } = require('redux-saga/effects'); // all the effects we compare

const log = [];                                                          // we collect what happened, then print it
const api = async (name, ms) => { await new Promise((r) => setTimeout(r, ms)); return `${name} done`; }; // fake API: waits ms, then answers

function* worker(label, action) {                                        // one worker used by all three watchers
  yield delay(30);                                                       // pretend the work takes 30 ms
  log.push(`${label} finished ${action.payload}`);                       // record which click finished
}                                                                        // end of worker

function* watchers() {                                                   // three watchers on three action types
  yield takeEvery('every/click', worker, 'takeEvery');                   // runs EVERY click
  yield takeLatest('latest/click', worker, 'takeLatest');                // cancels older clicks, keeps the LAST
  yield takeLeading('leading/click', worker, 'takeLeading');             // ignores clicks while one is running, keeps the FIRST
}                                                                        // end of watchers

const failingChild = function* () { yield delay(20); throw new Error('child failed'); }; // a child task that crashes after 20 ms

function* forkParent() {                                                 // fork = ATTACHED child
  try {                                                                  // this try/catch will NOT catch the child's error
    yield fork(failingChild);                                            // start the child in the background
    yield delay(50);                                                     // parent keeps waiting…
    log.push('fork parent finished');                                    // …never printed: the child's error aborts the parent
  } catch (e) {                                                          // not reached for forked errors
    log.push('fork parent caught it');                                   // never printed
  }                                                                      // end of try
}                                                                        // end of forkParent

function* spawnParent() {                                                // spawn = DETACHED child
  yield spawn(failingChild);                                             // start the child, fully separate
  yield delay(50);                                                       // parent keeps waiting…
  log.push('spawn parent finished (child error did not stop it)');       // …and finishes normally
}                                                                        // end of spawnParent

function* timeoutRace() {                                                // race: first one wins, the others are cancelled
  const { data, timeout } = yield race({                                 // run both at the same time
    data: call(api, 'slow API', 200),                                    // API takes 200 ms
    timeout: delay(100),                                                 // our limit is 100 ms
  });                                                                    // end of race
  log.push(data ? `race: got ${data}` : `race: timeout won (${timeout === true})`); // which one won?
}                                                                        // end of timeoutRace

function* parallel() {                                                   // all: start together, wait for every one
  const t0 = Date.now();                                                 // start time
  const res = yield all([call(api, 'A', 50), call(api, 'B', 50), call(api, 'C', 50)]); // three 50 ms calls in parallel
  log.push(`all: ${res.join(', ')} in ~${Math.round((Date.now() - t0) / 50) * 50} ms`); // ~50 ms, not 150
}                                                                        // end of parallel

function* poller() {                                                     // a background task we will cancel
  try {                                                                  // keep working until cancelled
    while (true) { yield delay(10); }                                    // poll forever (every 10 ms)
  } finally {                                                            // runs on finish OR cancel
    if (yield cancelled()) log.push('poller: cancelled → cleanup ran');  // cancelled() = true only when cancelled
  }                                                                      // end of finally
}                                                                        // end of poller

function* cancelDemo() {                                                 // start the poller, then stop it
  const task = yield fork(poller);                                       // start it in the background
  yield delay(30);                                                       // let it run a little
  yield cancel(task);                                                    // stop it → its finally block runs
}                                                                        // end of cancelDemo

function* selectAndError() {                                             // select reads the store; try/catch handles errors
  const count = yield select((s) => s.count);                            // read count from the store
  try {                                                                  // the API call may fail
    yield call(async () => { throw new Error('500 from API'); });        // a failing API call
  } catch (e) {                                                          // handle it inside the worker
    yield put({ type: 'failed', error: e.message });                     // dispatch a failure action
    log.push(`select: count=${count}; caught: ${e.message}`);            // record both
  }                                                                      // end of try
}                                                                        // end of selectAndError

const saga = createSagaMiddleware({ onError: (e) => log.push(`onError: ${e.message}`) }); // one place where uncaught saga errors land
const store = configureStore({                                           // tiny store with one number
  reducer: (state = { count: 7, error: null }, a) => (a.type === 'failed' ? { ...state, error: a.error } : state), // only handles 'failed'
  middleware: (g) => g({ thunk: false }).concat(saga),                   // use sagas instead of thunks
});                                                                      // end of configureStore

saga.run(watchers);                                                      // start the three watchers
for (const t of ['every', 'latest', 'leading']) {                        // for each watcher type…
  [1, 2, 3].forEach((n) => store.dispatch({ type: `${t}/click`, payload: n })); // …click 3 times quickly
}                                                                        // end of loop
saga.run(forkParent);                                                    // fork error demo
saga.run(spawnParent);                                                   // spawn error demo
saga.run(timeoutRace);                                                   // race demo
saga.run(parallel);                                                      // all demo
saga.run(cancelDemo);                                                    // cancel demo
saga.run(selectAndError);                                                // select + error demo
setTimeout(() => { console.log(log.join('\n')); console.log('store.error =', store.getState().error); }, 400); // print everything after 400 ms
```

**Output** (redux-saga 1.5.1, Node 24):

```text
select: count=7; caught: 500 from API
onError: child failed
onError: child failed
takeEvery finished 1
takeEvery finished 2
takeEvery finished 3
takeLatest finished 3
takeLeading finished 1
poller: cancelled → cleanup ran
spawn parent finished (child error did not stop it)
all: A done, B done, C done in ~50 ms
race: timeout won (true)
store.error = 500 from API
```

redux-saga also prints the full error stack for `child failed` to the console. That's normal.

**Reading the output:**
- `takeEvery` ran all 3 clicks. `takeLatest` kept only click **3**. `takeLeading` kept only click **1**.
- **"fork parent finished" never appears.** The forked child's error aborted the parent, and the parent's `try/catch` didn't catch it. The error reached `onError` instead.
- The **spawn parent finished** normally. The spawned child's error went to `onError` on its own.
- `all` took about **50 ms**, not 150: the calls ran in parallel.
- In the race, the 100 ms timeout beat the 200 ms API, so the API call was cancelled.

## 🔍 Deeper version

**Blocking vs non-blocking:**

| Effect | Waits? | Use it for |
|---|---|---|
| `call(fn, ...args)` | yes | an API call whose result you need next |
| `fork(saga)` | no | a background task tied to this saga (cancelled with it) |
| `spawn(saga)` | no | a fully independent task (not cancelled with the parent) |
| `put(action)` | no* | dispatching an action |
| `take(type)` | yes | pausing until an action arrives |
| `select(fn)` | no | reading the store |
| `delay(ms)` | yes | waiting, or a simple debounce |
| `race({...})` | yes | first to finish wins; the losers are cancelled |
| `all([...])` | yes | run in parallel, wait for all |
| `cancel(task)` | no | stopping a forked task |

\* `put` dispatches straight away. `putResolve` waits if the dispatch returns a promise.

**Error rules (memorise these):**
1. An error in **your own** code, or from a `call`, can be caught with `try/catch` around the `call`.
2. An error in a **forked** child **bubbles up and aborts the parent**. The parent's other forks are cancelled too. A `try/catch` around `fork` does **not** catch it. Catch errors **inside** the child, or use `spawn`.
3. An uncaught error that reaches the root goes to the middleware's **`onError`** option. Use it to report errors to your error tracker.

**Two patterns that use `race`:**

```js
function* fetchWithTimeout(id) {                               // give the API 5 seconds at most
  const { data, timeout } = yield race({                       // start both at the same time
    data: call(api.getCandidate, id),                          // the real request
    timeout: delay(5000),                                      // 5000 ms = 5 seconds
  });                                                          // end of race
  if (timeout) yield put({ type: 'candidate/timeout' });       // too slow → show "try again"
  else yield put({ type: 'candidate/loaded', payload: data }); // fast enough → save it
}                                                              // end of fetchWithTimeout

function* confirmThenDelete(action) {                          // wait for the user's choice in a modal
  yield put({ type: 'modal/open' });                           // show "Are you sure?"
  const { yes } = yield race({ yes: take('modal/confirm'), no: take('modal/cancel') }); // whichever click comes first
  if (yes) yield call(api.deleteJob, action.payload);          // only delete after "Confirm"
}                                                              // end of confirmThenDelete
```

**`eventChannel`: turning a WebSocket into actions.** A saga can't `take()` from a socket's [events](glossary:event) directly. A channel turns socket events into something it can `take()`. Save this as `channel.js` and run `node channel.js`. It uses a fake socket, so no network is needed:

```js
const { runSaga, eventChannel, END } = require('redux-saga');                // runSaga: run a saga without a store
const { take, call, put } = require('redux-saga/effects');                  // effects we need
const { EventEmitter } = require('node:events');                            // a fake WebSocket for the demo

function socketChannel(socket) {                                            // turn socket events into a channel a saga can take() from
  return eventChannel((emit) => {                                           // emit = push a value into the channel
    socket.on('message', (msg) => emit(msg));                               // every message → into the channel
    socket.on('close', () => emit(END));                                    // END = close the channel, the loop stops
    return () => socket.removeAllListeners();                               // cleanup when the channel closes
  });                                                                       // end of eventChannel
}                                                                           // end of socketChannel

function* watchSocket(socket) {                                             // read messages one by one, forever
  const chan = yield call(socketChannel, socket);                           // create the channel
  try {                                                                     // loop until the channel ends
    while (true) {                                                          // keep listening
      const msg = yield take(chan);                                         // pause until the next message
      yield put({ type: 'notification/received', payload: msg });           // turn it into a Redux action
    }                                                                       // end of loop
  } finally {                                                               // runs when END arrives
    console.log('channel closed, listeners removed:', socket.listenerCount('message') === 0); // cleanup check
  }                                                                         // end of try
}                                                                           // end of watchSocket

const socket = new EventEmitter();                                          // the fake socket
const dispatched = [];                                                      // collect dispatched actions
runSaga({ dispatch: (a) => dispatched.push(a), getState: () => ({}) }, watchSocket, socket); // start the saga
socket.emit('message', 'Interview at 3 PM');                                // server pushes a message
socket.emit('message', 'New candidate applied');                            // and another
socket.emit('close');                                                       // connection closes
console.log(dispatched.map((a) => a.payload));                              // what reached Redux
```

```text
channel closed, listeners removed: true
[ 'Interview at 3 PM', 'New candidate applied' ]
```

## 🎯 Why do we use it?

- **Search boxes:** `takeLatest` makes sure only the last search updates the screen. Older requests are cancelled, so no [race conditions](glossary:race-condition).
- **"Submit" buttons:** `takeLeading` stops double submits while a request is running.
- **User decisions:** `race` with `take` lets a saga pause for a confirm/cancel modal, then continue.
- **Uploads:** `all` sends several file parts at once.
- **Long-running tasks:** `fork` plus `cancel` start and stop polling or sockets, with proper cleanup.

SkillKeepr's frontend uses Redux with redux-saga: `takeLatest` for searches, a `race` that waits for a confirmation modal, `all()` for parallel uploads, and one shared helper for 401/503 errors. [FILL IN: one saga you wrote yourself, and which effects it used.]

## ⚠️ Common mistakes

- **Using `takeEvery` for a search box.** Old, slow responses can overwrite newer results. Use `takeLatest`.
- **Wrapping `fork` in `try/catch` and expecting it to catch the child's error.** It won't. Catch inside the child.
- **Calling the API directly**, like `yield api.get()`, instead of `yield call(api.get)`. It still works, but you lose easy testing, because `call` gives tests a plain object to check.
- **Forgetting `finally` cleanup** in long-running tasks. Sockets and intervals stay open after cancel.

## 🗣️ How to answer in an interview

> "Sagas give instructions called effects, and the middleware carries them out. For watchers, takeEvery handles every action, takeLatest cancels the older one and keeps the newest, which is ideal for search, and takeLeading ignores new actions while one is running, which prevents double submits.
>
> call blocks and waits, fork starts an attached background task, and spawn starts a detached one. An error in a forked child aborts the parent, and you can't catch it around the fork, so I catch errors inside the worker and use the middleware's onError for anything uncaught.
>
> race is great for timeouts and for waiting on a confirm-or-cancel modal. all runs calls in parallel. And when I cancel a task, cleanup goes in a finally block, where cancelled() tells me it was a cancel."

## 🔁 Follow-up questions

### What is the difference between fork and spawn?

`fork` creates an **attached** task. The parent waits for it before finishing, cancelling the parent cancels it, and its errors abort the parent. `spawn` creates a **detached** task, with none of those links.

### How would you debounce in a saga?

Use `takeLatest` with `yield delay(300)` at the start of the worker. Each new action cancels the waiting worker, so the API is only called once the user stops typing. There is also a built-in `debounce(ms, pattern, worker)` helper.

### How do you stop a background task when the user logs out?

`const task = yield fork(poller); yield take('auth/logout'); yield cancel(task);`. Put the cleanup in the poller's `finally` block.

### What does `put` do differently from `store.dispatch`?

It does the same job, but `put` returns a plain effect object. That makes the saga testable without a real store.

## ✅ Quick check

### 1. A user clicks "Save" 3 times quickly. Which helper makes sure only ONE save request runs?

:::answer
**`takeLeading`.** The first click starts the worker. The next clicks are ignored until it finishes.
:::

### 2. What prints?

```js
function* parent() {                          // the parent saga
  try {                                       // try to catch the child's error
    yield fork(function* () { throw new Error('boom'); }); // a forked child that fails
    yield delay(10);                          // wait a little
    console.log('A');                         // does this run?
  } catch (e) {                               // does this catch it?
    console.log('B');                         // ?
  }                                           // end of try
}                                             // end of parent
```

:::answer
**Neither A nor B.** The forked child's error aborts the parent, and a `try/catch` around `fork` doesn't catch it. The error goes up to the root and to `onError`.
:::

### 3. `yield race({ data: call(api), timeout: delay(5000) })`. The API answers in 2 seconds. What happens to the delay?

:::answer
It is **cancelled**. `data` holds the API result, and `timeout` is `undefined`.
:::
