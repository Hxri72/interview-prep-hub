---
title: useReducer
stack: react
order: 19
level: Intermediate
mustKnow: false
askedFrequency: common
summary:
  - useReducer manages state with a reducer function — (state, action) => newState — instead of many setState calls.
  - You call dispatch({ type, ...data }) to say WHAT happened. The reducer decides HOW the state changes.
  - It's good when the next state depends on the previous one, or when many values change together.
  - The reducer must be pure. Never change the old state; always return a new object.
  - It's the same idea as Redux reducers, but local to one component (or shared with Context).
cards:
  - q: What does useReducer return?
    a: "[state, dispatch]. You call dispatch(action) and React runs your reducer to get the new state."
  - q: When do you choose useReducer over useState?
    a: When state has several related values, many ways to change, or the next state depends on the previous one — like a form, a wizard or a shortlist.
  - q: What is a reducer?
    a: A pure function (state, action) => newState. It must not change the old state or do side effects.
  - q: Where do side effects like API calls go when using useReducer?
    a: In event handlers or effects. Dispatch actions before and after (e.g. 'fetch_started', 'fetch_succeeded'). Never call the API inside the reducer.
  - q: How is useReducer related to Redux?
    a: Same pattern — actions and a pure reducer. useReducer is local to a component; Redux is a global store with middleware and DevTools.
---

## 💡 What is it?

`useReducer` is a React [hook](glossary:hook) for managing [state](glossary:state). It's an alternative to `useState`.

Instead of changing state directly, you **send a message** that says what happened, like `{ type: 'added', id: 'c1' }`. This message is called an **action**. You send it with `dispatch`.

A function called a **[reducer](glossary:reducer)** reads the old state and the action. It returns the **new state**.

## 🏠 Real-life example

Think of **a school canteen**.

You don't walk into the kitchen and cook. You give the **cashier a token** that says "1 dosa". The **cook** reads the token and makes the dosa, following fixed rules.

- **You** = the component (the button, the form).
- **The token** = the action: `{ type: 'added', id: 'c1' }`.
- **Handing over the token** = `dispatch(action)`.
- **The cook with fixed rules** = the reducer function.
- **The plate you get back** = the new state.
- **The cook never cooks without a token** = the state only changes through actions.

## 🧑‍💻 Code example

Paste this into `src/App.jsx` of a Vite React app. Run `npm run dev`.

```jsx
import { useReducer } from 'react';                                         // bring in the useReducer hook

function shortlistReducer(state, action) {                                  // the reducer: (old state, action) → new state
  switch (action.type) {                                                    // decide by the action's type
    case 'added':                                                           // a candidate was added
      if (state.ids.includes(action.id)) return state;                      // already there → return the SAME state (no re-render)
      return { ...state, ids: [...state.ids, action.id] };                  // new object + new array; never push into the old one
    case 'removed':                                                         // a candidate was removed
      return { ...state, ids: state.ids.filter((id) => id !== action.id) }; // keep every id except this one
    case 'cleared':                                                         // the list was cleared
      return { ...state, ids: [] };                                         // an empty list
    default:                                                                // any other type is a bug
      throw new Error(`Unknown action: ${action.type}`);                    // fail loudly so we notice
  }                                                                         // end of switch
}                                                                           // end of shortlistReducer

export default function App() {                                             // our component
  const [state, dispatch] = useReducer(shortlistReducer, { ids: [] });      // start with an empty shortlist
  return (                                                                  // what App draws
    <main>                                                                  {/* a wrapper */}
      <button onClick={() => dispatch({ type: 'added', id: 'c1' })}>Add c1</button>   {/* send an 'added' action */}
      <button onClick={() => dispatch({ type: 'added', id: 'c2' })}>Add c2</button>   {/* another 'added' action */}
      <button onClick={() => dispatch({ type: 'removed', id: 'c1' })}>Remove c1</button> {/* a 'removed' action */}
      <button onClick={() => dispatch({ type: 'cleared' })}>Clear</button>           {/* a 'cleared' action */}
      <p>Shortlist: {state.ids.join(', ') || 'empty'}</p>                   {/* show the current state */}
    </main>                                                                 // end of the wrapper
  );                                                                        // end of what App returns
}                                                                           // end of App
```

The reducer is plain JavaScript, so you can test it in Node. We ran these steps on Node 24:

```text
add c1, add c2, add c2 again → [ 'c1', 'c2' ]   (the duplicate returned the SAME state object: true)
remove c1                    → [ 'c2' ]
clear                        → []
unknown action 'oops'        → Error: Unknown action: oops
```

## 🔍 Deeper version

**The shape:**

```jsx
const [state, dispatch] = useReducer(reducer, initialState); // reducer + starting state
dispatch({ type: 'added', id: 'c1' });                        // describe what happened
```

You can also pass a third argument, an **init function**, to build the first state lazily: `useReducer(reducer, props.id, createInitialState)`.

**useState vs useReducer:**

| | `useState` | `useReducer` |
|---|---|---|
| Best for | one or two simple values | related values, many kinds of updates |
| Update logic lives | scattered in event handlers | in one reducer function |
| Testing | test the component | test the reducer alone, in plain JS |
| Next state depends on previous | `setX(prev => …)` | built in |

**The reducer must be pure.** Same inputs → same output. No API calls, no `Math.random()`, no changing the old state. React may call it twice in development (StrictMode) to catch impure reducers.

**Immutability.** Always return a **new** object or array (spread `...`, `map`, `filter`). If you change the old state and return it, React sees the same reference and **skips the update**. See [immutability](topic:redux-context/immutability).

**Returning the same state skips the render.** In `'added'`, a duplicate returns `state` unchanged. React compares with `Object.is`, sees nothing changed, and bails out.

**dispatch is stable.** The `dispatch` function never changes between renders. So it's safe to pass to children or put in dependency arrays.

**Where do side effects go?** In event handlers or `useEffect`. A common pattern for loading data:

```text
dispatch({ type: 'fetch_started' })  →  call the API  →  dispatch({ type: 'fetch_succeeded', data })
                                                     ↘  dispatch({ type: 'fetch_failed', error })
```

**useReducer + Context = mini Redux.** Put `state` and `dispatch` in Context, and any child can dispatch actions. See [Context + useReducer](topic:redux-context/context-use-reducer). For bigger apps, Redux Toolkit adds DevTools, middleware and a global store. See [Redux core](topic:redux-context/redux-core).

## 🎯 Why do we use it?

- **All update rules in one place.** You read one function to understand every way the state can change.
- **Fewer bugs with related values.** For example, `loading`, `data` and `error` change together, in one action.
- **Easy to test.** A reducer is a pure function, so a few `expect(reducer(state, action))` lines test it fully.

## ⚠️ Common mistakes

- **Changing the old state** (`state.ids.push(id); return state;`). React won't re-render. Return a new object.
- **API calls inside the reducer.** Reducers must be pure. Do side effects in handlers or effects.
- **Forgetting a `default` case.** A typo in an action type then fails silently.
- **Using a reducer for one simple boolean.** `useState` is clearer there.

## 🗣️ How to answer in an interview

> "useReducer is an alternative to useState for more complex state. I write a pure reducer function that takes the current state and an action, and returns the new state. Components call dispatch with an action that describes what happened, like `{ type: 'added', id }`.
>
> I pick it when several values change together or there are many ways to update the state — like a multi-step form, a shortlist, or loading/data/error together. All the update rules live in one place, and the reducer is easy to unit-test in plain JavaScript.
>
> The reducer must stay pure. I never mutate the old state, and I keep API calls in handlers or effects, dispatching actions before and after. It's the same pattern as Redux. If I combine useReducer with Context, I get a small global store; for larger apps I'd use Redux Toolkit."

## 🔁 Follow-up questions

### What's the difference between useReducer and Redux?

Both use actions and a pure reducer. `useReducer` is local to one component. Redux is one global store for the whole app, with middleware (like thunks or sagas), DevTools and selectors.

### Why must the reducer be pure?

React may call it more than once (for example in StrictMode), and it relies on the result to decide what to render. Side effects or random values would make the UI unpredictable.

### Is dispatch synchronous? Can I read the new state right after it?

No. Like `setState`, `dispatch` schedules an update. The `state` variable in the current render still has the old value. You see the new value on the next render.

### How do you handle async work like fetching with useReducer?

Do the fetch in an effect or event handler. Dispatch `'fetch_started'` first, then `'fetch_succeeded'` or `'fetch_failed'` when it finishes.

## ✅ Quick check

### 1. What's wrong with this reducer?

```js
function reducer(state, action) {           // a reducer
  if (action.type === 'added') {            // when something is added
    state.ids.push(action.id);              // change the old array
    return state;                           // return the same object
  }
  return state;                             // otherwise keep the state
}
```

:::answer
It **mutates** the old state and returns the same object. React sees the same reference and may skip the re-render. Return a new object: `return { ...state, ids: [...state.ids, action.id] };`.
:::

### 2. Which is a better fit for useReducer?

- A) A single "show password" toggle
- B) A 3-step job application form with validation, back/next and submit status

:::answer
**B.** Many related values and many kinds of updates. A single toggle is simpler with `useState`.
:::
