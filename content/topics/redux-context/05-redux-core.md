---
title: "Redux core idea: store, action, reducer"
stack: redux-context
order: 5
level: Basic
mustKnow: true
askedFrequency: very common
summary:
  - "Store: one central object that holds the whole app state."
  - "Action: a plain object that says what happened, like { type: 'counter/added', payload: 5 }."
  - "Reducer: a pure function (state, action) → new state. It's the only place state changes."
  - "You change state only by dispatching actions. You read it with getState() or useSelector."
  - These strict rules make changes predictable, easy to test and easy to debug with Redux DevTools.
cards:
  - q: What are the three core parts of Redux?
    a: The store (holds the state), actions (plain objects describing what happened) and reducers (pure functions that turn the old state and an action into the new state).
  - q: What is an action?
    a: A plain object with a type field (a string like 'jobs/jobAdded') and usually a payload with the data.
  - q: What makes a reducer "pure"?
    a: Same input always gives the same output, it never changes its inputs, and it has no side effects like API calls or random values.
  - q: How do you change state in Redux?
    a: Only by calling store.dispatch(action). The store runs the reducer and saves the new state.
  - q: What should a Redux reducer return for an action it doesn't handle?
    a: The current state, unchanged. Every action reaches every reducer, so unknown actions must be ignored.
---

## 💡 What is it?

**Redux** is a library for keeping app [state](glossary:state) in **one central place**.

It has three main ideas:
- **Store** — one object that holds all the shared state.
- **Action** — a small note that says *what happened*, like "a candidate was added".
- **Reducer** — a function that reads the note and returns the *new* state.

You never change the state directly. You **dispatch** (send) an action, and the reducer decides the new state.

## 🏠 Real-life example

Think of a **school bank where students keep their pocket money**.

- The **bank's ledger** = the store. It holds everyone's balance.
- A **deposit or withdrawal slip** = an action. It says what you want: "deposit ₹50".
- **Handing the slip to the counter** = `dispatch`.
- The **cashier who follows the rule book** = the reducer. They read the slip and write the new balance.
- **Checking your balance** = `getState()`.

Nobody writes in the ledger directly. Every change is a slip, so the bank can always see what happened and in what order.

## 🧑‍💻 Code example

Make a folder, run `npm init -y` and `npm install @reduxjs/toolkit`. Save this as `store.js`. Run `node store.js`.

```js
const { configureStore } = require('@reduxjs/toolkit'); // the official way to create a store

const initialState = { count: 0 };                   // the starting data: count is 0

function counterReducer(state = initialState, action) { // a reducer: (old state, action) → new state
  switch (action.type) {                             // look at what happened
    case 'counter/added':                            // an "add" action
      return { count: state.count + action.payload };// NEW object; payload = how much to add
    case 'counter/reset':                            // a "reset" action
      return { count: 0 };                           // back to 0
    default:                                         // any action we don't know
      return state;                                  // return the same state, unchanged
  }                                                  // end of switch
}                                                    // end of counterReducer

const store = configureStore({ reducer: counterReducer }); // the store holds the state

store.subscribe(() => {                              // run this after every dispatch
  console.log('state is now:', store.getState());    // read the latest state
});                                                  // end of subscribe

store.dispatch({ type: 'counter/added', payload: 5 });  // action: add 5
store.dispatch({ type: 'counter/added', payload: 2 });  // action: add 2
store.dispatch({ type: 'counter/reset' });              // action: reset
store.dispatch({ type: 'something/else' });             // unknown action → no change
```

**Output:**

```text
state is now: { count: 5 }
state is now: { count: 7 }
state is now: { count: 0 }
state is now: { count: 0 }
```

Notice the last line. The subscriber ran even for the unknown action, because subscribers run after **every** dispatch. But the state stayed the same, because the reducer returned it unchanged.

## 🔍 Deeper version

**The three principles of Redux:**
1. **Single source of truth.** All shared state lives in one store, as one object tree.
2. **State is read-only.** The only way to change it is to dispatch an action.
3. **Changes are made with pure functions.** Reducers take the old state and an action, and return a new state.

**What "pure" means for a reducer:**
- Same inputs → same output, every time.
- It **never changes** (mutates) the old state. It returns a new object. See [immutability](topic:redux-context/immutability).
- **No side effects:** no API calls, no `Math.random()`, no `Date.now()`, no `localStorage`. Those happen in middleware (thunks, sagas) before or after.

**The action shape.** Redux only requires `type`. By convention (the "Flux Standard Action" style), data goes in `payload`, and errors may set `error: true`. Type names use the `'domain/eventName'` style, like `'jobs/jobAdded'`. That's exactly what Redux Toolkit generates.

**Every action goes to every reducer.** With many slices, the root reducer calls each slice reducer with each action. That's why a reducer must return the state unchanged for actions it doesn't know.

**Store methods:**

| Method | What it does |
|---|---|
| `getState()` | returns the current state |
| `dispatch(action)` | runs the reducer and saves the new state |
| `subscribe(fn)` | calls `fn` after every dispatch; returns an "unsubscribe" function |

In React, you rarely call these directly. `react-redux` gives you `useSelector` and `useDispatch`. See [useSelector and useDispatch](topic:redux-context/use-selector-dispatch).

:::version[Version note]
The old `createStore` from the `redux` package still works, but it's marked **deprecated** (with a strikethrough in editors). The official recommendation is **Redux Toolkit**: `configureStore` and `createSlice`. See [Redux Toolkit](topic:redux-context/redux-toolkit).
:::

## 🎯 Why do we use it?

- **Predictable.** State only changes in one way, by actions through reducers.
- **Easy to debug.** Redux DevTools shows every action and the state before and after. You can even "time travel".
- **Easy to test.** Reducers are pure functions: give input, check output.
- **Shared state without prop drilling**, for big apps with many screens. See [why state management](topic:redux-context/why-state-management).

## ⚠️ Common mistakes

- **Mutating the state** in a plain reducer (`state.count++`). Return a new object, or use Redux Toolkit, which handles this with Immer.
- **Side effects in reducers**, like API calls. Use thunks or sagas.
- **Forgetting the `default` case.** The reducer returns `undefined`, and the state breaks.
- **Putting everything in Redux.** Local UI state, like "is this menu open", belongs in `useState`.

## 🗣️ How to answer in an interview

> "Redux keeps shared app state in one central store. It has three parts. The store holds the state. Actions are plain objects with a type, like 'jobs/jobAdded', and usually a payload, describing what happened. Reducers are pure functions that take the old state and an action and return the new state.
>
> The rules are strict on purpose: state is read-only, and the only way to change it is to dispatch an action. Reducers never mutate and never do side effects. That makes every change predictable, testable and visible in Redux DevTools.
>
> In practice I use Redux Toolkit, where configureStore and createSlice remove most of the boilerplate. At SkillKeepr the frontend uses Redux with redux-saga for the side effects. [FILL IN: one thing you stored in Redux, like a page's list data with its loading and error flags.]"

## 🔁 Follow-up questions

### Why must reducers be pure?

So that the same actions always give the same state. That makes testing simple, and DevTools can replay actions ("time travel"). Side effects would make results unpredictable.

### Where do API calls go if not in reducers?

In middleware: Redux Thunk (`createAsyncThunk`), redux-saga or RTK Query. They dispatch actions with the results. See [createAsyncThunk](topic:redux-context/create-async-thunk) and [redux-saga](topic:redux-context/redux-saga).

### Is Redux only for React?

No. Redux is plain JavaScript. The example above runs in Node. `react-redux` is the separate package that connects it to React.

### What is the difference between Redux and Redux Toolkit?

Redux is the core idea and library. Redux Toolkit is the official, recommended way to write Redux. It reduces boilerplate, uses Immer for safe updates, and sets up DevTools and thunk for you.

## ✅ Quick check

### 1. What is the state after these dispatches?

```js
store.dispatch({ type: 'counter/added', payload: 3 });  // add 3
store.dispatch({ type: 'counter/oops' });               // unknown type
store.dispatch({ type: 'counter/added', payload: 1 });  // add 1
```

(Using the `counterReducer` from the example, starting at `{ count: 0 }`.)

:::answer
**`{ count: 4 }`.** 0 + 3 = 3. The unknown action returns the state unchanged. Then 3 + 1 = 4.
:::

### 2. Which of these is a valid Redux action?

- A) `{ payload: 5 }`
- B) `{ type: 'counter/added', payload: 5 }`
- C) `() => ({ count: 5 })`

:::answer
**B.** An action must be a plain object with a `type`. A has no `type`. C is a function, which needs thunk middleware.
:::

### 3. Is this reducer pure?

```js
function reducer(state = { at: null }, action) {           // a reducer
  if (action.type === 'saved') return { at: Date.now() };  // uses the current time
  return state;                                            // unchanged otherwise
}
```

:::answer
**No.** `Date.now()` gives a different result each time. Put the time in the action's payload instead: `dispatch({ type: 'saved', payload: Date.now() })`.
:::
