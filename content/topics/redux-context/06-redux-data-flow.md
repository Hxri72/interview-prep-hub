---
title: Redux data flow end to end
stack: redux-context
order: 6
level: Intermediate
mustKnow: true
askedFrequency: very common
summary:
  - Redux data moves in one direction only — a "one-way data flow".
  - "UI event → dispatch(action) → middleware (optional) → reducer → new state in the store → subscribed components re-read with selectors → UI updates."
  - Middleware (thunks, sagas) sits between dispatch and the reducer, and handles async work like API calls.
  - useSelector re-renders a component only if the piece of state it selected has changed.
  - Because the flow is fixed, every change can be logged, replayed and debugged.
cards:
  - q: Describe the Redux data flow.
    a: A UI event dispatches an action. It passes through middleware, then the reducer computes the new state. The store saves it, notifies subscribers, and components re-read their data with selectors and re-render if it changed.
  - q: Why is it called one-way data flow?
    a: Data always moves in the same circle — action → reducer → store → UI → action. The UI never changes the store directly.
  - q: Where does an API call fit in the flow?
    a: In middleware (a thunk or a saga) — after dispatch, before the reducer. It dispatches new actions like pending, fulfilled or rejected.
  - q: When does a component using useSelector re-render?
    a: After every dispatch, its selector runs again. The component re-renders only if the selected value is different (by ===) from last time.
  - q: What is a selector?
    a: A function that takes the whole state and returns the piece a component needs, like state => state.jobs.items.
---

## 💡 What is it?

In Redux, data always moves in **one direction**, in a fixed circle:

1. Something happens in the UI (a click).
2. The UI **dispatches an action**.
3. The **reducer** makes the new state.
4. The **store** saves it and tells its listeners.
5. Components **re-read** the data they need, using **selectors**.
6. The screen updates.

This is called **one-way data flow**. The UI never changes the store directly.

## 🏠 Real-life example

Think of **ordering food in a school canteen**.

1. You decide you want a sandwich = a **UI event**.
2. You fill an **order slip** and drop it in the box = **dispatch an action**.
3. If the kitchen needs bread from the shop first, a helper goes out to buy it = **middleware** (async work).
4. The cook follows the recipe and makes the sandwich = the **reducer** makes new state.
5. The sandwich goes on the **counter** = the **store** saves the new state.
6. The token screen shows the number, and only the person with that token walks up = **selectors**: only the components whose data changed re-render.

The order always goes slip → kitchen → counter → screen. You never walk into the kitchen yourself.

## 🧑‍💻 Code example

Make a folder, run `npm init -y` and `npm install @reduxjs/toolkit`. Save this as `flow.js`. Run `node flow.js`. The numbers in the comments are the steps of the flow.

```js
const { configureStore, createSlice } = require('@reduxjs/toolkit'); // Redux Toolkit helpers

const candidatesSlice = createSlice({                  // one "slice" of the app state
  name: 'candidates',                                  // used as the action type prefix
  initialState: { list: [], filter: 'all' },           // start: no candidates, show all
  reducers: {                                          // each reducer = one kind of change
    candidateAdded(state, action) {                    // runs for 'candidates/candidateAdded'
      state.list.push(action.payload);                 // looks like a mutation, but Immer makes a copy
    },                                                 // end of candidateAdded
    filterChanged(state, action) {                     // runs for 'candidates/filterChanged'
      state.filter = action.payload;                   // 'all' or 'shortlisted'
    },                                                 // end of filterChanged
  },                                                   // end of reducers
});                                                    // end of createSlice

const { candidateAdded, filterChanged } = candidatesSlice.actions; // action creators
const store = configureStore({ reducer: { candidates: candidatesSlice.reducer } }); // 1. the store

const selectVisible = (state) =>                       // a selector: picks data from the state
  state.candidates.filter === 'all'                    // if the filter is 'all'…
    ? state.candidates.list                            // …show every candidate
    : state.candidates.list.filter((c) => c.status === state.candidates.filter); // …else only matches

function render() {                                    // 5. the "UI" re-reads the store
  const names = selectVisible(store.getState()).map((c) => c.name); // use the selector
  console.log('UI shows:', names);                     // pretend this is the screen
}                                                      // end of render
store.subscribe(render);                               // 4. tell the UI when the store changes

const action = candidateAdded({ name: 'Asha', status: 'shortlisted' }); // 2. a user clicks "Add"
console.log('action:', action);                        // see what an action looks like
store.dispatch(action);                                // 3. send it to the store → reducer runs
store.dispatch(candidateAdded({ name: 'Ravi', status: 'applied' })); // another click
store.dispatch(filterChanged('shortlisted'));          // user picks the "Shortlisted" filter
```

**Output:**

```text
action: {
  type: 'candidates/candidateAdded',
  payload: { name: 'Asha', status: 'shortlisted' }
}
UI shows: [ 'Asha' ]
UI shows: [ 'Asha', 'Ravi' ]
UI shows: [ 'Asha' ]
```

## 🔍 Deeper version

**The full loop in a React app:**

```text
 ┌──────────── UI (React component) ─────────────┐
 │  onClick → dispatch(jobAdded(job))            │
 └───────────────────┬───────────────────────────┘
                     ▼
        Middleware (thunk / saga / logger)        ← async work, API calls
                     ▼
        Reducer: (oldState, action) → newState     ← pure, no side effects
                     ▼
        Store saves newState, notifies subscribers
                     ▼
 useSelector(selector) runs again in each subscribed component
   → value changed (!==)?  yes → re-render    no → skip
```

**Middleware sits in the middle.** It sees every action *before* the reducer. It can log it, delay it, or run async work. A thunk can call an API and then dispatch `pending`, `fulfilled` or `rejected` actions. See [middleware](topic:redux-context/redux-middleware) and [createAsyncThunk](topic:redux-context/create-async-thunk).

**How `useSelector` decides to re-render.** After every dispatch, `react-redux` runs each component's selector again. It compares the new result with the old one using `===` (reference equality). Only if it's different does the component re-render. That's why selectors should return the **same reference** when nothing changed. A selector that builds a new array or object every time causes extra renders. See [memoised selectors](topic:redux-context/selectors-memoized).

**Derived data with selectors.** Don't store things you can calculate, like "visible candidates". Store the raw `list` and `filter`, and compute the visible list in a selector, like `selectVisible` above.

**At SkillKeepr**, the async step in the middle is handled by **redux-saga**. Each page has its own slice with a `loading` and `error` pair, and memoised selectors (reselect) to read it. See [redux-saga](topic:redux-context/redux-saga). [FILL IN: one real flow you worked on — e.g. "a search box dispatches an action → a saga calls the API → success action → reducer saves the list → the table re-renders".]

## 🎯 Why do we use it?

- **Easy to follow.** Every change has one path, so you always know where to look.
- **Easy to debug.** Redux DevTools logs each action with the state before and after.
- **No surprise changes.** Components can't quietly change shared data.
- **Fast updates.** Selectors let each component re-render only for the data it uses.

## ⚠️ Common mistakes

- **Changing the store's state directly**, like `store.getState().list.push(x)`. Always dispatch.
- **Storing derived data** (filtered lists, totals) and forgetting to update it. Compute it with selectors.
- **Selectors that return a new object every time**, like `state => ({ a: state.a })`. The component re-renders after every action.
- **Doing API calls in components and reducers**, instead of thunks or sagas. The flow becomes hard to follow.

## 🗣️ How to answer in an interview

> "Redux has a one-way data flow. A UI event dispatches an action, which is a plain object saying what happened. The action passes through middleware, where thunks or sagas can do async work like API calls. Then the reducer, a pure function, takes the old state and the action and returns the new state. The store saves it and notifies subscribers.
>
> In React, each component reads its data with useSelector. After every dispatch, the selector runs again, and the component re-renders only if the selected value changed by reference. So I keep selectors returning stable values, and I compute derived data, like filtered lists, in memoised selectors instead of storing it.
>
> Because the flow is fixed, every change shows up in Redux DevTools, which makes bugs easy to trace."

## 🔁 Follow-up questions

### What happens after dispatch, step by step?

Middleware runs first. Then the root reducer passes the action to every slice reducer. The store saves the new state. Then it calls all subscribers. In React, each `useSelector` re-runs and compares its result.

### Is dispatch synchronous?

Yes. Plain dispatch runs the reducer right away, and `getState()` on the next line already shows the new state. Async work happens in middleware, which dispatches more actions later.

### Why not store the filtered list in the state?

It's derived data. If you store it, you must remember to update it whenever the list or filter changes. A selector always computes it correctly from the source data.

### How is this different from two-way data binding?

In two-way binding (like old AngularJS), the UI and the model update each other automatically. In Redux, the UI only *requests* changes by dispatching. The reducer decides, so changes are explicit.

## ✅ Quick check

### 1. Put these in the right order: reducer runs · user clicks · component re-renders · dispatch(action) · store saves state.

:::answer
User clicks → dispatch(action) → reducer runs → store saves state → component re-renders.
:::

### 2. This selector is used in a component. Will the component re-render after an unrelated action?

```js
const data = useSelector((state) => ({ open: state.jobs.open })); // builds a new object
```

:::answer
**Yes.** The selector returns a new object on every run, so `===` always says "changed". Select the number directly (`state => state.jobs.open`), pass `shallowEqual` as the second argument, or use a memoised selector.
:::

### 3. Where should the API call for "load candidates" live?

- A) Inside the reducer
- B) In a thunk or saga (middleware)
- C) Inside the selector

:::answer
**B.** Reducers and selectors must stay pure. Middleware handles side effects and dispatches the results.
:::
