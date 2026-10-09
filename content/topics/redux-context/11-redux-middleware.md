---
title: Redux middleware (thunk, logger)
stack: redux-context
order: 11
level: Intermediate
mustKnow: false
askedFrequency: common
summary:
  - "Middleware sits between dispatch(action) and the reducer. It can log, change, delay, block or replace actions."
  - "Its shape is three nested functions: storeAPI => next => action => { ... }."
  - "Calling next(action) passes the action on. Not calling it stops the action."
  - "configureStore adds default middleware (thunk, plus dev-only checks for mutations and non-serialisable values)."
  - "Add your own with middleware: (getDefault) => getDefault().concat(myMiddleware)."
cards:
  - q: What is Redux middleware?
    a: A function that runs between dispatch and the reducer. It can log, change, delay or block actions, or run side effects.
  - q: What is the signature of a Redux middleware?
    a: "storeAPI => next => action => { ... }. storeAPI has dispatch and getState; next passes the action to the next middleware or the reducer."
  - q: Which middleware does configureStore add by default?
    a: Redux Thunk, plus (in development only) checks that warn about state mutations and non-serialisable values.
  - q: How does the thunk middleware work?
    a: If the dispatched value is a function, it calls it with (dispatch, getState) instead of passing it to the reducer.
  - q: What happens if a middleware never calls next(action)?
    a: The action stops there. The reducer never sees it, and the state does not change.
---

## 💡 What is it?

**Redux middleware** is code that runs **between** `dispatch(action)` and the reducer.

It is like Express [middleware](glossary:middleware), but for actions. Every action passes through each middleware in order. Then it reaches the reducer.

A middleware can **log** the action, **change** it, **block** it, **delay** it, or start some **async work**.

## 🏠 Real-life example

Think of **posting a letter at school**.

You drop a letter in the office box. Before it reaches the principal, it passes some people:

1. The **clerk** writes it in the register. That's a **logger**.
2. The **security guard** checks it. If it's not allowed, it stops here. That's a **blocking** middleware.
3. Then it reaches the **principal**, who makes the decision. That's the **reducer**.

- **The letter** = the action.
- **Dropping it in the box** = `dispatch(action)`.
- **Each person in the line** = one middleware.
- **Handing it to the next person** = `next(action)`.
- **The principal** = the reducer that changes the state.

## 🧑‍💻 Code example

Run `npm install @reduxjs/toolkit`. Save this as `middleware.js` and run `node middleware.js`. It uses CommonJS.

```js
const { configureStore, createSlice } = require('@reduxjs/toolkit'); // load Redux Toolkit

const counterSlice = createSlice({                                // a tiny slice with a number
  name: 'counter',                                                // slice name
  initialState: { value: 0 },                                     // value starts at 0
  reducers: { add: (state, action) => { state.value += action.payload; } }, // add(n) increases value by n
});                                                               // end of createSlice

const logger = (storeAPI) => (next) => (action) => {              // a middleware: 3 nested functions
  if (typeof action === 'function') return next(action);          // skip thunks (functions); only log real actions
  console.log('before:', storeAPI.getState().counter.value, '| action:', action.type); // state BEFORE the reducer
  const result = next(action);                                    // pass the action on → the reducer runs here
  console.log('after: ', storeAPI.getState().counter.value);      // state AFTER the reducer
  return result;                                                  // give back what next() returned
};                                                                // end of logger

const blockNegative = () => (next) => (action) => {               // a second middleware that can stop actions
  if (action.type === 'counter/add' && action.payload < 0) {      // is it an "add" with a negative number?
    console.log('blocked:', action.payload);                      // say we blocked it
    return;                                                       // don't call next() → the reducer never runs
  }                                                               // end of the check
  return next(action);                                            // otherwise pass it on
};                                                                // end of blockNegative

const store = configureStore({                                    // create the store
  reducer: { counter: counterSlice.reducer },                     // our one slice
  middleware: (getDefault) => getDefault().concat(blockNegative, logger), // keep defaults (thunk etc.), then add ours in order
});                                                               // end of configureStore

const { add } = counterSlice.actions;                             // the action creator add(n)
store.dispatch(add(5));                                           // goes through blockNegative → logger → reducer
store.dispatch(add(-2));                                          // blockNegative stops it; logger never sees it
store.dispatch((dispatch) => dispatch(add(1)));                   // a thunk: the built-in thunk middleware runs it
```

**Output:**

```text
before: 0 | action: counter/add
after:  5
blocked: -2
before: 5 | action: counter/add
after:  6
```

The thunk is a function. The built-in thunk middleware calls it, and it dispatches `add(1)` as a normal action. That action then goes through our chain.

## 🔍 Deeper version

**Why three nested functions?** Each layer is filled in at a different time:

| Layer | Filled in when | Gives you |
|---|---|---|
| `storeAPI =>` | once, when the store is created | `dispatch` and `getState` |
| `next =>` | once, when the chain is built | the next middleware (or the reducer at the end) |
| `action =>` | on **every** dispatch | the action being dispatched |

This shape is called [currying](topic:javascript/currying-composition). The inner functions use a [closure](glossary:closure) to remember `storeAPI` and `next`.

**`next` vs `storeAPI.dispatch`:**
- `next(action)` continues **down** the chain from this point.
- `storeAPI.dispatch(action)` starts again from the **top** of the chain. Use it to send a *new* action. If you call it with the same action, you get an endless loop.

**Default middleware in `configureStore`:**
- **thunk**: lets you dispatch functions.
- **immutability check** (development only): warns if you mutate state outside a reducer.
- **serializability check** (development only): warns if you put things like `Date`, `Map` or class instances in actions or state.

You can switch a default off, for example when using redux-saga instead of thunks: `getDefault({ thunk: false })`.

**Popular middleware:**
- `redux-thunk`: built in. Async functions.
- `redux-saga`: async flows with generators. See [redux-saga basics](topic:redux-context/redux-saga).
- `redux-logger`: logs every action and state change in development.
- RTK Query's `api.middleware`: caching and refetching. See [RTK Query](topic:redux-context/rtk-query).
- **Listener middleware** (`createListenerMiddleware`, built into RTK): run side effects when a specific action happens. It's a lighter alternative to sagas.

:::version[Version note]
In **Redux Toolkit 2**, `middleware` in `configureStore` must be a **callback** (`(getDefault) => getDefault().concat(...)`). The old array form was removed. `getDefault()` returns a `Tuple`, which keeps the TypeScript types correct.
:::

## 🎯 Why do we use it?

- **One place for cross-cutting work.** Logging, analytics, crash reporting and auth checks touch every action. Middleware handles them in one place.
- **Async work.** Reducers must be pure, so async flows live in middleware (thunk, saga, listeners).
- **Clean reducers.** Reducers stay simple: state in, new state out.

## ⚠️ Common mistakes

- **Forgetting to call `next(action)`.** The action silently disappears.
- **Calling `storeAPI.dispatch(action)` with the same action** inside middleware. This creates an endless loop.
- **Passing an array to `middleware` in RTK 2.** It must be a callback that uses `getDefault()`.
- **Dropping the defaults by mistake.** If you write `middleware: () => [logger]`, you lose thunk and the safety checks.

## 🗣️ How to answer in an interview

> "Redux middleware sits between dispatch and the reducer. Every action passes through it, so it can log, change, block or delay actions, or start async work. The signature is three nested functions: storeAPI, then next, then action. Calling next passes the action down the chain, and not calling it stops the action.
>
> configureStore adds thunk by default, plus development checks for mutations and non-serialisable data. I add my own with the middleware callback and getDefault().concat(...). Thunk itself is a middleware: if you dispatch a function, it calls it with dispatch and getState. Sagas, RTK Query and the listener middleware all plug in the same way."

## 🔁 Follow-up questions

### Write a simple logger middleware.

`const logger = (api) => (next) => (action) => { console.log(action.type); return next(action); };`. Add it with `getDefault().concat(logger)`.

### In what order does middleware run?

In the order you list them. The action goes through the first middleware, then the next, and finally reaches the reducer.

### How would you add crash reporting for actions?

Wrap `next(action)` in try/catch inside a middleware. If an error happens, send the action type and error to the monitoring tool, then rethrow.

### Thunk, saga or listener middleware: how do you choose?

Thunk is for simple async calls. The listener middleware is for "when action X happens, do Y". Saga is for complex, long-running flows with cancellation, races and waiting for user actions.

## ✅ Quick check

### 1. What is printed?

```js
const mw = () => (next) => (action) => { console.log('A'); next(action); console.log('B'); }; // log around next
// the reducer logs 'R' when it runs
store.dispatch({ type: 'x' });                         // ?
```

:::answer
**A, R, B.** The middleware logs A, then `next(action)` runs the reducer (R), then control comes back and it logs B.
:::

### 2. Which is the correct way to add `logger` in Redux Toolkit 2?

- A) `middleware: [logger]`
- B) `middleware: (getDefault) => getDefault().concat(logger)`
- C) `applyMiddleware(logger)` inside the reducer

:::answer
**B.** RTK 2 needs the callback form. A also drops the default middleware.
:::

### 3. A middleware returns early without calling `next(action)`. Does the state change?

:::answer
**No.** The action never reaches the reducer.
:::
