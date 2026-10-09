---
title: "Context vs Redux vs Zustand vs React Query: how to choose"
stack: redux-context
order: 16
level: Intermediate
mustKnow: true
askedFrequency: very common
summary:
  - "First split your state into two kinds: server state (data from the API) and client state (UI state like filters, modals, theme)."
  - "Server state → a data-fetching library: TanStack Query, or RTK Query if you already use Redux."
  - "Small, rarely changing global values (logged-in user, theme, language) → Context."
  - "Lots of shared client state that changes often, needing DevTools and strict patterns → Redux Toolkit."
  - "Want shared state with very little code → Zustand. And always keep state local when only one component needs it."
cards:
  - q: How do you decide between Context and Redux?
    a: Context for small, rarely changing global values like the user or theme. Redux for big, frequently changing shared state where you want DevTools, middleware and a strict update pattern.
  - q: What is "server state" and why treat it differently?
    a: Data that lives on the server (jobs, candidates). It can go stale and needs caching, refetching and loading/error handling, so a library like TanStack Query or RTK Query fits better than a hand-written slice.
  - q: Why can Context cause performance problems?
    a: Every component using a context re-renders when its value changes. If one context holds fast-changing data, many components re-render for no reason.
  - q: What is Zustand?
    a: A small state library. You create a store with state and actions in one function, and components subscribe to only the pieces they use. It needs no Provider and little boilerplate.
  - q: What should you check before adding any global state tool?
    a: Whether the state can stay local in one component, or be lifted to a shared parent. Global state is only for data many distant components need.
---

## 💡 What is it?

React apps have many ways to share [state](glossary:state): **Context**, **Redux**, **Zustand**, and data libraries like **TanStack Query** or **RTK Query**.

Interviewers often ask, "Which one would you pick, and why?"

The simple way to decide: first ask **what kind of state** it is.
- **Server state**: data from the API, like jobs and candidates.
- **Client state**: UI things, like an open dialog, filters or the theme.

Then pick the **smallest tool** that solves the problem.

## 🏠 Real-life example

Think of **how a school shares information**.

- **Your own notebook** = local state (`useState`). Only you need it.
- **The class notice board** = Context. A few things everyone in the class reads, like the timetable. It rarely changes.
- **The school office register** = Redux. Lots of records that change all day, with strict rules about who writes what, and a full history.
- **A small shared whiteboard** = Zustand. Quick to use, anyone can update it, with no paperwork.
- **The library catalogue** = TanStack Query or RTK Query. The real books live somewhere else (the server). The catalogue keeps a fresh copy and updates it when it gets old.

You wouldn't use the office register for your own homework. And you wouldn't keep the school records in your notebook.

## 🧑‍💻 Code example

This puts the **same** small piece of state in Zustand and in Redux, so you can compare the code. Zustand's `vanilla` version runs without React.

Run `npm install zustand @reduxjs/toolkit`. Save this as `choose.js` and run `node choose.js`. It uses CommonJS.

```js
const { createStore } = require('zustand/vanilla');                // Zustand without React (same idea as the hook)
const { configureStore, createSlice } = require('@reduxjs/toolkit'); // Redux Toolkit

const useFilters = createStore((set) => ({                        // Zustand: state + actions in one small object
  search: '',                                                     // the search text
  setSearch: (text) => set({ search: text }),                     // an action that changes it
}));                                                              // end of the Zustand store

const filtersSlice = createSlice({                                // Redux: the same thing as a slice
  name: 'filters',                                                // slice name
  initialState: { search: '' },                                   // the search text
  reducers: { setSearch: (state, action) => { state.search = action.payload; } }, // reducer that changes it
});                                                               // end of the slice
const store = configureStore({ reducer: { filters: filtersSlice.reducer } }); // the Redux store

useFilters.getState().setSearch('node');                          // Zustand: call the action directly
store.dispatch(filtersSlice.actions.setSearch('node'));           // Redux: dispatch an action object

console.log('Zustand:', useFilters.getState().search);            // node
console.log('Redux:  ', store.getState().filters.search);         // node
console.log('Redux action log entry:', filtersSlice.actions.setSearch('node')); // Redux actions are plain, loggable objects
```

**Output:**

```text
Zustand: node
Redux:   node
Redux action log entry: { type: 'filters/setSearch', payload: 'node' }
```

Zustand needs less code. Redux gives you **plain action objects**, which you can log, replay and inspect in [DevTools](topic:redux-context/redux-devtools). That's the trade-off.

## 🔍 Deeper version

**A decision table:**

| Situation | Good choice | Why |
|---|---|---|
| Only one component uses it | `useState` / `useReducer` | No need to share |
| Two siblings need it | lift state to the parent | Still simple |
| Logged-in user, theme, language | **Context** | Small, rarely changes |
| Lists, details from the API | **TanStack Query** or **RTK Query** | Caching, refetching, loading states for free |
| Large shared client state, complex updates, many developers | **Redux Toolkit** | DevTools, middleware, strict and predictable patterns |
| Shared client state, small team, little boilerplate | **Zustand** | Tiny API, no Provider, selective subscriptions |
| Form fields | the form library (React Hook Form) | Keeps typing fast |

**Why Context isn't a "state manager".** Context only **passes a value down**. When the value changes, **every** consumer re-renders. That's fine for rare changes. For fast-changing data it can be slow. You can split contexts or memoise the value. See [Context performance](topic:redux-context/context-performance).

**Why separate server state.** API data has problems UI state doesn't: it gets stale, two screens may need it, it needs loading and error states, and you shouldn't fetch it twice. TanStack Query and RTK Query solve these. After moving server data there, many apps have very little global client state left. Sometimes Context or Zustand is enough for the rest.

**Comparison at a glance:**

| | Context | Redux Toolkit | Zustand | TanStack Query |
|---|---|---|---|---|
| Main use | pass values down | global client state | global client state | server state |
| Boilerplate | low | medium | very low | low |
| Re-render control | coarse (all consumers) | fine (`useSelector`) | fine (selector) | fine (per query) |
| DevTools | React DevTools only | excellent | via middleware | own DevTools |
| Async / caching | none | thunks, sagas, RTK Query | your own code | built in |

**Real example.** SkillKeepr's frontend uses **Redux with redux-saga** for page state and API flows. See [redux-saga basics](topic:redux-context/redux-saga) and [the recruiter and candidate UI story](topic:resume/recruiter-candidate-ui). [FILL IN: what you would choose if you started that frontend today, and why.]

## 🎯 Why do we use it?

Picking the right tool keeps an app **simple and fast**:
- Too little (prop drilling everywhere) makes code hard to change.
- Too much (Redux for one dialog) adds boilerplate for nothing.
- The wrong kind (server data in a hand-written slice) means re-building caching, loading states and refetching by hand.

## ⚠️ Common mistakes

- **Putting everything in global state.** Most state should stay local.
- **Using Context for fast-changing data**, like the text of a search box. Every consumer re-renders on each keystroke.
- **Storing API data in Redux by hand** and writing loading/error code for every endpoint, when a data library does it better.
- **Answering "Redux is old" or "Context replaces Redux".** They solve different problems. Explain the trade-offs instead.

## 🗣️ How to answer in an interview

> "I first split state into server state and client state. Server state, like jobs or candidates, needs caching, refetching and loading and error handling, so I'd use TanStack Query, or RTK Query if the app already uses Redux.
>
> For client state, I keep things local whenever only one component needs them, and lift state up for siblings. Context is good for small values that rarely change, like the logged-in user or theme, because every consumer re-renders when the value changes. For a lot of shared client state that changes often, where I want DevTools, middleware and strict patterns across a big team, I'd use Redux Toolkit. If I want shared state with very little code, Zustand is a great fit.
>
> At SkillKeepr the frontend uses Redux with redux-saga for page state and API flows."

## 🔁 Follow-up questions

### Can Context and Redux be used together?

Yes. Many apps use Context for the theme or auth and Redux for the rest. `react-redux` itself uses Context to give components access to the store.

### Is Redux still worth learning?

Yes. Many large codebases use it, and Redux Toolkit removed most of the old boilerplate. The ideas (one-way data flow, pure reducers, immutable updates) also apply to other tools.

### Why doesn't Zustand need a Provider?

The store is a plain module-level object. Components import its hook and subscribe directly, so no component tree wrapper is needed.

### How would you migrate from hand-written API slices to TanStack Query?

Move one screen at a time. Replace the fetch thunk and its loading/error reducers with a `useQuery` hook. Keep the UI state in the existing slice until it's no longer needed.

## ✅ Quick check

### 1. Where would you keep the "is the filter panel open?" flag that only one component uses?

:::answer
In **local state** (`useState`) in that component. No global tool is needed.
:::

### 2. The candidates list from the API must be cached and refetched after changes. What fits best?

- A) Context
- B) TanStack Query or RTK Query
- C) `localStorage`

:::answer
**B.** It's server state: it needs caching, deduplication and refetching, which these libraries provide.
:::

### 3. Why is Context a poor choice for a value that changes on every keystroke?

:::answer
Every component that uses the context re-renders on every change, even if it only needs a small part of the value.
:::
