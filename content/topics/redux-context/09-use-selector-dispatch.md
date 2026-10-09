---
title: useSelector and useDispatch
stack: redux-context
order: 9
level: Basic
mustKnow: false
askedFrequency: very common
summary:
  - "<Provider store={store}> makes the Redux store available to every component inside it."
  - useSelector(state => state.jobs.open) reads one piece of the store, and re-renders only when that piece changes (checked with ===).
  - useDispatch() gives you the store's dispatch function, so a component can send actions.
  - A selector that returns a new object every time causes extra re-renders — select small values, use shallowEqual, or a memoised selector.
  - "In TypeScript, create typed hooks once — useAppSelector = useSelector.withTypes<RootState>()."
cards:
  - q: What does useSelector do?
    a: It reads a piece of the Redux state with a selector function, subscribes the component to the store, and re-renders it only when the selected value changes by ===.
  - q: What does useDispatch do?
    a: It returns the store's dispatch function, so the component can send actions like dispatch(jobClosed()).
  - q: Why might a component re-render after every action?
    a: "Its selector returns a new object or array every time, like state => ({ a: state.a }), so === always says it changed."
  - q: How do you fix a selector that returns a new object?
    a: Select primitive values separately, pass shallowEqual as the second argument, or use a memoised selector made with createSelector.
  - q: How do you type useSelector and useDispatch in TypeScript?
    a: "Create typed hooks once with useSelector.withTypes<RootState>() and useDispatch.withTypes<AppDispatch>(), and use those everywhere."
---

## 💡 What is it?

`react-redux` connects a Redux store to React with two [hooks](glossary:hook):

- **`useSelector`** — **reads** a piece of the store. The component re-renders when that piece changes.
- **`useDispatch`** — gives you **`dispatch`**, so the component can **send** actions.

First, you wrap your app in `<Provider store={store}>`. Then any component inside can use both hooks.

## 🏠 Real-life example

Think of the **school's big scoreboard** on sports day.

- The **scoreboard** = the Redux store.
- The **gate that lets students into the ground** = `<Provider>`. Only students inside can see the board.
- A student **watching only their house's score** = `useSelector(state => state.scores.redHouse)`. They only cheer (re-render) when *that* number changes.
- The **runner who takes a result slip to the scorekeeper** = `useDispatch`. They don't change the board themselves. They send a slip.

## 🧑‍💻 Code example

Make a React app with `npm create vite@latest` (pick React), then `npm install @reduxjs/toolkit react-redux`. Put this in `src/App.jsx`. Run `npm run dev` and open the browser console.

```jsx
import { configureStore, createSlice } from '@reduxjs/toolkit'; // Redux Toolkit
import { Provider, useDispatch, useSelector } from 'react-redux'; // the React bindings

const jobsSlice = createSlice({                            // one slice of state
  name: 'jobs',                                            // action prefix 'jobs/'
  initialState: { open: 3, filter: 'all' },                // 3 open jobs, show all
  reducers: {                                              // allowed changes
    jobClosed: (state) => { state.open -= 1; },            // one job closed → open - 1
    filterChanged: (state, action) => { state.filter = action.payload; }, // change the filter
  },                                                       // end of reducers
});                                                        // end of jobsSlice

const store = configureStore({ reducer: { jobs: jobsSlice.reducer } }); // the store
const { jobClosed, filterChanged } = jobsSlice.actions;    // action creators

function OpenJobs() {                                      // shows the open-jobs count
  const open = useSelector((state) => state.jobs.open);    // pick ONE number from the store
  console.log('OpenJobs rendered');                        // when does it re-render?
  return <p>Open jobs: {open}</p>;                         // show it
}                                                          // end of OpenJobs

function Controls() {                                      // buttons that change the store
  const dispatch = useDispatch();                          // get the store's dispatch function
  return (                                                 // two buttons
    <div /* no state read here */>
      <button onClick={() => dispatch(jobClosed())} /* send jobs/jobClosed */>Close a job</button>
      <button onClick={() => dispatch(filterChanged('mine'))} /* send jobs/filterChanged */>My jobs</button>
    </div>                                                 // end of the buttons
  );                                                       // end of return
}                                                          // end of Controls

export default function App() {                            // the top component
  return (                                                 // what App shows
    <Provider store={store} /* every child can now use the store */>
      <OpenJobs /* reads */ />
      <Controls /* writes */ />
    </Provider>                                            // end of the Provider
  );                                                       // end of return
}                                                          // end of App
```

**Console and screen** (start, click "Close a job", then click "My jobs"):

```text
OpenJobs rendered
screen: Open jobs: 3
--- click "Close a job"
OpenJobs rendered
screen: Open jobs: 2
--- click "My jobs"
screen: Open jobs: 2
```

The last click changed `filter`, not `open`. So `OpenJobs` did **not** re-render. That's `useSelector` doing its job.

(With `<StrictMode>` in `main.jsx`, you may see each "rendered" line twice in development.)

## 🔍 Deeper version

**How `useSelector` works.** It subscribes the component to the store. After **every** dispatch, it runs your selector again and compares the result with the last one using `===`. Same value → no re-render. Different → re-render.

**The new-object trap.** This selector returns a new object every time:

```jsx
const data = useSelector((state) => ({ open: state.jobs.open })); // ❌ new object every run
```

`===` always says "changed", so the component re-renders after **every** action, even unrelated ones. In development, react-redux 9 even warns: *"Selector unknown returned a different result when called with the same parameters."* Fixes:
- **Select small values separately**: `const open = useSelector((s) => s.jobs.open);`
- **Use `shallowEqual`**: `useSelector(selector, shallowEqual)` compares the object's fields.
- **Use a memoised selector** made with `createSelector`, for derived data like filtered lists. See [memoised selectors](topic:redux-context/selectors-memoized).

**`useDispatch` is stable.** The `dispatch` function never changes. It's safe in `useEffect` dependency arrays and to pass to memoised children.

**Typed hooks in TypeScript.** Create them once and use them everywhere:

```ts
// store.ts
export const store = configureStore({ reducer: { jobs: jobsSlice.reducer } }); // the store
export type RootState = ReturnType<typeof store.getState>;     // the whole state's type
export type AppDispatch = typeof store.dispatch;               // dispatch's type (knows about thunks)

// hooks.ts
import { useDispatch, useSelector } from 'react-redux';        // the plain hooks
export const useAppSelector = useSelector.withTypes<RootState>(); // typed useSelector
export const useAppDispatch = useDispatch.withTypes<AppDispatch>(); // typed useDispatch
```

:::version[Version note]
`.withTypes()` was added in **react-redux 9.1**. Older code writes `export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;`. Both work.
:::

**Older code: `connect`.** Before hooks, components used `connect(mapStateToProps, mapDispatchToProps)(Component)`. It still works, and you'll see it in older codebases. Hooks are the recommended way today.

## 🎯 Why do we use it?

- **Read only what you need.** Each component subscribes to a small piece of the state, so it re-renders less.
- **Send changes simply.** `dispatch(action())` from any component, with no props passed down.
- **Simple to test and type.** Typed hooks catch wrong state paths at compile time.

## ⚠️ Common mistakes

- **Returning new objects or arrays from selectors** (`state => state.list.filter(…)`). Use memoised selectors.
- **Selecting the whole state** (`state => state`). The component re-renders after every action.
- **Using the hooks outside `<Provider>`.** You get an error: could not find react-redux context value.
- **Using the plain hooks in TypeScript** and getting `unknown` for the state. Create typed hooks.

## 🗣️ How to answer in an interview

> "I wrap the app in the react-redux Provider. Then components use useSelector to read a piece of the state, and useDispatch to get dispatch and send actions.
>
> useSelector subscribes the component to the store. After every action, it runs the selector again and compares the result with ===. The component re-renders only if that value changed. So I keep selectors small and stable. If a selector builds an object or a filtered array, it returns a new reference every time and causes extra renders. Then I use shallowEqual or a memoised selector from createSelector.
>
> In TypeScript, I create typed hooks once with useSelector.withTypes<RootState>() and useDispatch.withTypes<AppDispatch>(), so the state and thunks are typed everywhere."

## 🔁 Follow-up questions

### When exactly does a useSelector component re-render?

After a dispatch, if the selector's new result is not `===` to the previous result. A parent re-render can also re-render it, unless it's wrapped in `React.memo`.

### Can I call useSelector several times in one component?

Yes. Several small selectors are often better than one selector returning an object, because each returns a stable primitive.

### Is dispatch stable?

Yes. It's the store's `dispatch` function, which never changes while the store exists.

### useSelector vs connect — which do you use?

Hooks (`useSelector`, `useDispatch`) for new code. They need less code and work well with TypeScript. `connect` is still supported for older class components and code.

## ✅ Quick check

### 1. The store has `{ jobs: { open: 3, filter: 'all' } }`. Which component re-renders after `dispatch(filterChanged('mine'))`?

```jsx
function A() { const open = useSelector((s) => s.jobs.open); return <p>{open}</p>; }      // reads open
function B() { const f = useSelector((s) => s.jobs.filter); return <p>{f}</p>; }         // reads filter
```

:::answer
**Only `B`.** The `filter` value changed. `open` is still `3`, so `A`'s selector returns the same value and `A` is skipped.
:::

### 2. Why does this component re-render after every action?

```jsx
const visible = useSelector((s) => s.jobs.items.filter((j) => j.open)); // filter in the selector
```

:::answer
`filter` always returns a **new array**, so `===` always says "changed". Use a memoised selector with `createSelector`, so the array is only rebuilt when `items` changes.
:::

### 3. What does `useSelector.withTypes<RootState>()` give you?

:::answer
A version of `useSelector` that already knows your `RootState` type, so selectors like `s => s.jobs.open` are type-checked without writing the type each time.
:::
