---
title: Context + useReducer pattern
stack: redux-context
order: 4
level: Intermediate
mustKnow: false
askedFrequency: common
summary:
  - useReducer keeps state changes in one function — (old state, action) → new state — like a mini Redux.
  - Context shares that state (and the dispatch function) with the whole tree.
  - Together they give a small "global store" with no extra library.
  - Put state and dispatch in two separate contexts, so buttons that only dispatch never re-render.
  - It has no DevTools, middleware or selectors — for big apps, Redux Toolkit is still better.
cards:
  - q: What is the Context + useReducer pattern?
    a: A provider component holds state with useReducer and shares the state and dispatch through Context. Any child can read the state or dispatch actions.
  - q: Why use useReducer instead of useState here?
    a: All the update rules live in one reducer function, so changes are predictable and easy to test, and dispatch is a stable function.
  - q: Why put dispatch in a separate context?
    a: dispatch never changes. Components that only send actions can read the dispatch context and won't re-render when the state changes.
  - q: How is this different from Redux?
    a: It's similar in idea, but has no DevTools, no middleware (like thunks or sagas) and no selectors, so every state reader re-renders on any change.
  - q: What should a reducer do with an unknown action?
    a: In useReducer, throwing an error is common, so typos are caught early. Redux reducers instead return the state unchanged.
---

## 💡 What is it?

`useReducer` is a React [hook](glossary:hook) for state with clear rules. You write one **reducer** function: it takes the old state and an **action** (a description of what happened), and returns the new state.

**Context** lets many components share a value.

Put them together, and you get a **small global store** built only with React. A provider holds the state. Any child can read it, or send actions to change it.

## 🏠 Real-life example

Think of the **school's lost-and-found office**.

- The **office** = the provider component.
- The **logbook** = the state.
- The **rule book** for writing in the logbook = the reducer. Only the office writes in the logbook, and always by the rules.
- A **slip you drop in the box** ("I found a bottle") = an action.
- The **drop box** = `dispatch`. Anyone can use it.
- The **notice board showing the logbook** = the state context. Anyone can read it.

Students don't write in the logbook themselves. They drop a slip. The office updates the logbook by the rules.

## 🧑‍💻 Code example

Make a React app with `npm create vite@latest` (pick React). Put this in `src/App.jsx`. Run `npm run dev`.

```jsx
import { createContext, useContext, useReducer } from 'react'; // React tools

const ShortlistContext = createContext(null);              // holds the shortlist state
const ShortlistDispatchContext = createContext(null);      // holds the dispatch function (never changes)

function shortlistReducer(state, action) {                 // (old state, action) → new state
  switch (action.type) {                                   // what happened?
    case 'added':                                          // a candidate was shortlisted
      return [...state, action.name];                      // new array with the name added
    case 'removed':                                        // a candidate was removed
      return state.filter((n) => n !== action.name);       // new array without that name
    default:                                               // an unknown action is a bug
      throw new Error('Unknown action: ' + action.type);   // fail loudly
  }                                                        // end of switch
}                                                          // end of shortlistReducer

function ShortlistProvider({ children }) {                 // wraps the part of the app that needs it
  const [list, dispatch] = useReducer(shortlistReducer, []); // [] = start with an empty list
  return (                                                 // give both values to the tree
    <ShortlistContext value={list} /* the data */>
      <ShortlistDispatchContext value={dispatch} /* the "change it" function */>{children}</ShortlistDispatchContext>
    </ShortlistContext>                                    // end of the providers
  );                                                       // end of return
}                                                          // end of ShortlistProvider

function AddButton({ name }) {                             // a button deep in the tree
  const dispatch = useContext(ShortlistDispatchContext);   // only needs dispatch
  return <button onClick={() => dispatch({ type: 'added', name })}>Shortlist {name}</button>; // send an action
}                                                          // end of AddButton

function Counter() {                                       // shows how many are shortlisted
  const list = useContext(ShortlistContext);               // reads the data
  return <p>Shortlisted: {list.length} ({list.join(', ')})</p>; // e.g. "Shortlisted: 2 (Asha, Ravi)"
}                                                          // end of Counter

export default function App() {                            // the top component
  return (                                                 // what App shows
    <ShortlistProvider /* everything inside can read and change the list */>
      <Counter /* reads */ />
      <AddButton name="Asha" /* writes */ />
      <AddButton name="Ravi" /* writes */ />
    </ShortlistProvider>                                   // end of the provider
  );                                                       // end of return
}                                                          // end of App
```

**What you see** (start, then click "Shortlist Asha", then "Shortlist Ravi"):

```text
Shortlisted: 0 ()
Shortlisted: 1 (Asha)
Shortlisted: 2 (Asha, Ravi)
```

## 🔍 Deeper version

**Why `useReducer` and not `useState`?**
- **All the rules in one place.** Every change goes through the reducer. You can read one function and know every way the state can change.
- **Easy to test.** A reducer is a pure function: same input, same output. Test it without React.
- **Stable `dispatch`.** React gives you the same `dispatch` function on every render. That's perfect for a separate context.

**Two contexts, not one.** If `list` and `dispatch` were in one context, every `AddButton` would re-render whenever the list changed. With a separate dispatch context, the buttons read only `dispatch`, which never changes. See [Context performance](topic:redux-context/context-performance).

**Custom hooks make it nicer.**

```jsx
export function useShortlist() {                           // read the list
  return useContext(ShortlistContext);                     // components call useShortlist()
}                                                          // end of useShortlist
export function useShortlistDispatch() {                   // get dispatch
  return useContext(ShortlistDispatchContext);             // components call useShortlistDispatch()
}                                                          // end of useShortlistDispatch
```

**Compared with Redux Toolkit:**

| Feature | Context + useReducer | Redux Toolkit |
|---|---|---|
| Extra library | No | Yes |
| DevTools (time travel, action log) | No | Yes |
| Middleware (thunks, sagas, logging) | No | Yes |
| Selectors (re-render only for one piece) | No — all readers re-render | Yes, with `useSelector` |
| Good for | Small/medium shared state, one feature | Large shared state, many screens |

**Unknown actions.** In a `useReducer` reducer, throwing on an unknown action catches typos. In Redux, reducers must **return the state unchanged** for unknown actions, because every action goes to every reducer.

## 🎯 Why do we use it?

- **A store without a library.** Good for a wizard, a shopping cart, or one feature's shared state.
- **Clear update rules.** Easier to reason about than many `useState` setters passed around.
- **Better performance than one big context**, thanks to the stable dispatch context.

## ⚠️ Common mistakes

- **Mutating state in the reducer**, like `state.push(name)`. React won't see a change. Always return a new array or object. See [immutability](topic:redux-context/immutability).
- **Putting state and dispatch in one context object** without `useMemo`. Every reader re-renders on every change.
- **Side effects inside the reducer**, like API calls. Reducers must be pure. Do side effects in event handlers or effects.
- **Using it for a huge, busy app state.** You'll miss DevTools and selectors. Move to Redux Toolkit.

## 🗣️ How to answer in an interview

> "Context plus useReducer is a lightweight global store built only with React. A provider component holds the state with useReducer, where a reducer function defines every allowed change. It shares the state and the dispatch function through Context, so any child can read the state or dispatch actions.
>
> I put state and dispatch in two separate contexts. dispatch never changes, so components that only send actions don't re-render when the state changes. I also wrap them in custom hooks like useShortlist.
>
> It's great for one feature or a small app. For a large app with lots of shared, fast-changing state, I'd use Redux Toolkit instead, because it adds DevTools, middleware, and selectors so each component re-renders only for the data it uses."

## 🔁 Follow-up questions

### Is dispatch from useReducer stable?

Yes. React guarantees the same `dispatch` function on every render. That's why it's safe to put in its own context, or to leave out of effect dependency arrays.

### Can you do async work (API calls) with this pattern?

Not inside the reducer. Do the API call in an event handler or effect, then `dispatch` the result. Redux adds middleware (thunks, sagas) for this.

### How would you test this?

Test the reducer as a plain function: give it a state and an action, and check the returned state. Test components with React Testing Library inside the provider.

### When would you move from this to Redux Toolkit?

When many features share the state, you need DevTools or middleware, or re-renders become a problem because there are no selectors.

## ✅ Quick check

### 1. What's wrong with this reducer?

```js
function reducer(state, action) {                          // a reducer
  if (action.type === 'added') {                           // add case
    state.push(action.name);                               // change the array
    return state;                                          // return it
  }
  return state;
}
```

:::answer
It **mutates** the old array and returns the **same** array. React compares with `Object.is`, sees the same reference, and may skip the re-render. Return a new array: `return [...state, action.name];`.
:::

### 2. Which components re-render when the shortlist changes, if state and dispatch are in separate contexts?

- A) Only components that read the state context
- B) Every component inside the provider
- C) Only components that read the dispatch context

:::answer
**A.** Readers of the state context re-render. Components that only read the dispatch context don't, because `dispatch` never changes.
:::

### 3. True or false: Context + useReducer gives you Redux DevTools for free.

:::answer
**False.** There are no DevTools, middleware or selectors. You only get React DevTools to inspect the component state.
:::
