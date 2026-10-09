---
title: Async logic with createAsyncThunk
stack: redux-context
order: 10
level: Intermediate
mustKnow: true
askedFrequency: very common
summary:
  - "createAsyncThunk makes an async Redux action, for example an API call."
  - "It dispatches 3 actions for you automatically: pending (started), fulfilled (worked) and rejected (failed)."
  - "You handle those 3 actions in extraReducers to set loading, data and error in the slice."
  - "The value you return becomes action.payload; a thrown error becomes action.error (or use rejectWithValue for your own error data)."
  - "Thunk support is built into configureStore, so no extra setup is needed."
cards:
  - q: What does createAsyncThunk do?
    a: It wraps an async function (like an API call) and automatically dispatches pending, fulfilled and rejected actions around it.
  - q: Where do you handle the pending, fulfilled and rejected actions?
    a: In the slice's extraReducers, using builder.addCase(thunk.pending, ...) and so on.
  - q: How do you return a custom error from a thunk?
    a: "Use the second argument: async (arg, { rejectWithValue }) => ... and return rejectWithValue(data). It arrives as action.payload in the rejected case."
  - q: Why use a status field like 'idle' | 'loading' | 'succeeded' | 'failed'?
    a: So the UI always knows what to show (spinner, data or error message), and you avoid two booleans that can disagree.
  - q: How do you wait for a thunk in a component and get its result?
    a: "await dispatch(thunk(arg)). Add .unwrap() to get the payload directly, or catch the error if it was rejected."
---

## 💡 What is it?

`createAsyncThunk` is a Redux Toolkit tool for **async work**, like calling an [API](glossary:api).

A Redux reducer must be fast and simple. It can't wait for a server. So the waiting happens **outside** the reducer, in a "thunk". A thunk is a function that runs async code and then dispatches normal actions.

`createAsyncThunk` builds that thunk for you. It also sends **three actions** automatically: **pending**, **fulfilled** and **rejected**.

## 🏠 Real-life example

Think of **ordering food at a school canteen with a token**.

1. You give your order. The counter shows "**Preparing**". This is **pending**.
2. The food is ready. Your token number lights up. This is **fulfilled**.
3. Sometimes the item is finished. The counter says "**Sorry, not available**". This is **rejected**.

- **You placing the order** = `dispatch(fetchCandidates())`.
- **The kitchen cooking** = the async function (the API call).
- **The display board** = the Redux state (`status`, `list`, `error`).
- **The three board messages** = the pending, fulfilled and rejected actions.

You don't have to update the board yourself. The canteen system does it. That's what `createAsyncThunk` does for Redux.

## 🧑‍💻 Code example

Make a folder, run `npm init -y` and `npm install @reduxjs/toolkit`. Save this as `thunk.js` and run `node thunk.js`. It uses CommonJS (`require`).

```js
const { configureStore, createSlice, createAsyncThunk } = require('@reduxjs/toolkit'); // load Redux Toolkit tools

const fakeApi = (fail) =>                                       // a pretend API call; fail = true makes it fail
  new Promise((resolve, reject) =>                              // it returns a promise, like fetch does
    setTimeout(() => (fail ? reject(new Error('Server error 500')) : resolve(['Asha', 'Ravi'])), 100), // after 100 ms: error or 2 names
  );                                                            // end of fakeApi

const fetchCandidates = createAsyncThunk(                       // make an async action ("thunk")
  'candidates/fetch',                                           // its name; RTK adds /pending, /fulfilled, /rejected
  async (shouldFail) => fakeApi(shouldFail),                    // the async work; its return value becomes action.payload
);                                                              // end of createAsyncThunk

const candidatesSlice = createSlice({                           // one slice of the store
  name: 'candidates',                                           // slice name
  initialState: { list: [], status: 'idle', error: null },      // status starts as 'idle' (nothing happened yet)
  reducers: {},                                                 // no normal reducers in this example
  extraReducers: (builder) => {                                 // react to the thunk's 3 automatic actions
    builder                                                     // the builder lets us add one case per action
      .addCase(fetchCandidates.pending, (state) => { state.status = 'loading'; })            // request started
      .addCase(fetchCandidates.fulfilled, (state, action) => {                               // request worked
        state.status = 'succeeded';                                                          // mark success
        state.list = action.payload;                                                         // save the names
      })                                                                                     // end of fulfilled case
      .addCase(fetchCandidates.rejected, (state, action) => {                                // request failed
        state.status = 'failed';                                                             // mark failure
        state.error = action.error.message;                                                  // save the error text
      });                                                                                    // end of rejected case
  },                                                            // end of extraReducers
});                                                             // end of createSlice

const store = configureStore({ reducer: { candidates: candidatesSlice.reducer } }); // the store (thunk support is built in)

async function main() {                                         // an async function so we can use await
  const p = store.dispatch(fetchCandidates(false));             // start a request that will work
  console.log('during:', store.getState().candidates.status);   // right away the status is 'loading'
  await p;                                                      // wait for it to finish
  console.log('after ok:', store.getState().candidates);        // now status 'succeeded' and the list is filled
  const result = await store.dispatch(fetchCandidates(true));   // start a request that will fail
  console.log('after fail:', store.getState().candidates.status, '-', store.getState().candidates.error); // 'failed' + message
  console.log('action type:', result.type);                     // the last action was candidates/fetch/rejected
}                                                               // end of main
main();                                                         // run it
```

**Output:**

```text
during: loading
after ok: { list: [ 'Asha', 'Ravi' ], status: 'succeeded', error: null }
after fail: failed - Server error 500
action type: candidates/fetch/rejected
```

## 🔍 Deeper version

**The action names.** `createAsyncThunk('candidates/fetch', …)` creates three action types:

| Action type | When | What's inside |
|---|---|---|
| `candidates/fetch/pending` | right when you dispatch | `meta.arg` (the argument you passed) |
| `candidates/fetch/fulfilled` | the promise resolved | `payload` = the returned value |
| `candidates/fetch/rejected` | the promise rejected or threw | `error` (a serialised error), or `payload` if you used `rejectWithValue` |

**The second argument: `thunkAPI`.** The payload creator gets `(arg, thunkAPI)`. Useful parts:
- `rejectWithValue(value)`: reject with **your own** error data, like a server's validation messages.
- `getState()`: read the current state.
- `dispatch`: dispatch other actions.
- `signal`: an `AbortSignal`. Pass it to `fetch` so you can cancel the request.

```js
const saveJob = createAsyncThunk('jobs/save', async (job, { rejectWithValue, signal }) => { // get helpers from thunkAPI
  const res = await fetch('/api/jobs', { method: 'POST', body: JSON.stringify(job), signal }); // signal lets us cancel
  if (!res.ok) return rejectWithValue(await res.json());       // send the server's error body as the payload
  return res.json();                                           // success: this becomes action.payload
});                                                            // end of saveJob
```

**`unwrap()` in components.** `dispatch(thunk())` always resolves to the final action, even when it failed. To use try/catch, call `.unwrap()`:

```js
try {                                                          // try the save
  const job = await dispatch(saveJob(form)).unwrap();          // unwrap → gives the payload, or THROWS on rejection
  toast('Saved ' + job.title);                                 // success message
} catch (err) {                                                // rejected
  setErrors(err);                                              // err is the rejectWithValue data (or the error)
}                                                              // end of try/catch
```

**Cancelling.** `const promise = dispatch(fetchCandidates()); promise.abort();` cancels it. The thunk then dispatches `rejected` with `error.name === 'AbortError'`. This helps with [race conditions](topic:react/race-conditions-abort).

**The `condition` option** can skip a request, for example when data is already loading:

```js
createAsyncThunk('candidates/fetch', fetcher, {               // same thunk with options
  condition: (_, { getState }) => getState().candidates.status !== 'loading', // false → don't even start
});                                                            // end of options
```

:::note
For **server data** that many screens read (lists, details), many teams now use [RTK Query](topic:redux-context/rtk-query) or TanStack Query. They handle caching and refetching for you. `createAsyncThunk` is still great for one-off actions and custom flows.
:::

## 🎯 Why do we use it?

- **Reducers can't wait.** They must be pure and fast. Async work needs a separate place.
- **No boilerplate.** Before RTK, you wrote three action types, three action creators and the dispatch logic by hand for every API call.
- **Consistent loading and error state.** Every request follows the same pending → fulfilled/rejected pattern, so every screen can show a spinner and errors the same way.

## ⚠️ Common mistakes

- **Putting the API call inside a reducer.** Reducers must not do async work or side effects.
- **Forgetting the `rejected` case.** Then the status stays `'loading'` forever when the server fails.
- **Expecting `dispatch(thunk())` to throw on failure.** It doesn't. Use `.unwrap()` if you want try/catch.
- **Returning non-serialisable data** (like a `Response` object or a `Date`). Return plain JSON. Redux expects serialisable state.

## 🗣️ How to answer in an interview

> "createAsyncThunk is Redux Toolkit's way to handle async logic like API calls. Reducers have to be pure, so the async work runs in a thunk instead. I give it an action name and an async function. It dispatches pending when it starts, fulfilled with the returned value when it works, and rejected when it throws.
>
> In the slice I handle those three in extraReducers to set a status field (idle, loading, succeeded, failed), the data and the error. If I need the server's error details, I use rejectWithValue. In a component I can await dispatch(...).unwrap() to use try/catch. I can also pass the AbortSignal to fetch to cancel old requests.
>
> For heavy server-data caching, I'd look at RTK Query instead, but createAsyncThunk is great for custom flows."

## 🔁 Follow-up questions

### What is a "thunk"?

A function that runs later. In Redux, a thunk is a function you dispatch instead of an action object. The thunk middleware calls it with `dispatch` and `getState`, so it can do async work and then dispatch real actions.

### How is createAsyncThunk different from writing a thunk by hand?

A hand-written thunk is just `(dispatch) => { … }`. You dispatch your own loading, success and error actions. `createAsyncThunk` generates those three actions and their types for you, plus cancellation and `condition` support.

### How do you avoid fetching the same data twice?

Use the `condition` option to skip when already loading or loaded. Or move server data to RTK Query, which removes duplicate requests and caches automatically.

### What's the difference between `action.error` and `action.payload` in the rejected case?

`action.error` is a serialised version of the thrown error, with `message`, `name` and `stack`. `action.payload` only exists if you returned `rejectWithValue(...)`, and it holds exactly what you passed.

## ✅ Quick check

### 1. Which three actions does `createAsyncThunk('jobs/load', fn)` dispatch?

:::answer
`jobs/load/pending`, `jobs/load/fulfilled` and `jobs/load/rejected`.
:::

### 2. What is printed?

```js
const r = await store.dispatch(fetchCandidates(true));   // this request fails
console.log(r.type.endsWith('rejected'));                 // ?
```

- A) It throws an error before printing
- B) `true`
- C) `false`

:::answer
**B) `true`.** `dispatch(thunk())` does not throw. It resolves to the rejected action. Only `.unwrap()` would throw.
:::

### 3. Where should the `fetch` call go: in the reducer or in the thunk?

:::answer
**In the thunk.** Reducers must be pure: no API calls, no timers, no random values.
:::
