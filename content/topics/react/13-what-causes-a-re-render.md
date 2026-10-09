---
title: What causes a re-render
stack: react
order: 13
level: Intermediate
mustKnow: true
askedFrequency: very common
summary:
  - "A component re-renders for three main reasons: its state changes, its parent re-renders, or a context it reads changes."
  - Props changing is not a separate trigger. Props only change because the parent re-rendered.
  - By default, when a parent re-renders, ALL its children re-render too, even if their props look the same.
  - Setting state to the exact same value (Object.is) usually lets React skip the re-render.
  - Re-renders are normal and usually cheap. Only optimise when the Profiler shows a real problem.
cards:
  - q: What causes a React component to re-render?
    a: Its own state changes, its parent re-renders, or a context value it uses changes. (Plus custom hooks it uses, since they are made of state and context.)
  - q: If a parent re-renders, do its children re-render even with the same props?
    a: Yes, by default. Wrap a child in React.memo to skip the render when its props are shallowly equal.
  - q: Does changing a ref (useRef) cause a re-render?
    a: No. Changing ref.current never triggers a render.
  - q: Why can a new object prop break React.memo?
    a: An object created during render is a new reference every time, so the shallow comparison sees "changed" and the child re-renders anyway.
  - q: How do you find out WHY a component re-rendered?
    a: React DevTools Profiler with "Record why each component rendered" turned on. "Highlight updates" shows which components render.
---

## 💡 What is it?

A **[re-render](glossary:render)** is React calling your component function again to see what the screen should look like now.

A component re-renders for **three main reasons**:
1. **Its [state](glossary:state) changes** (you called a setter like `setCount`).
2. **Its parent re-renders.**
3. **A context it reads changes.**

Knowing these three reasons helps you fix slow screens.

## 🏠 Real-life example

Think of **a class taking a group photo**.

The photographer takes a **new photo** when:
1. A student **changes their own pose** = the component's own state changes.
2. **The whole row moves** = the parent re-renders, so everyone in that row is photographed again.
3. **The school notice board changes**, and every student who reads it reacts = a context value changes, and every component reading it re-renders.

- The **photographer** = React.
- **Each new photo** = a re-render.
- **A student who says "I look the same, skip me"** = `React.memo`. React skips that child if nothing changed.

## 🧑‍💻 Code example

Paste this into `src/App.jsx` of a Vite React app. Open the browser console and click the buttons.

```jsx
import { memo, useState } from 'react';                                  // bring in memo and useState

function Child({ label }) {                                              // a normal child component
  console.log('Child rendered');                                         // runs every time Child renders
  return <p>{label}</p>;                                                 // show the label
}                                                                        // end of Child

const MemoChild = memo(function MemoChild({ label }) {                   // the same child, wrapped in memo
  console.log('MemoChild rendered');                                     // runs only when its props change
  return <p>{label}</p>;                                                 // show the label
});                                                                      // end of MemoChild

export default function App() {                                          // the parent
  const [count, setCount] = useState(0);                                 // parent state; starts at 0
  console.log('App rendered');                                           // runs every time App renders
  return (                                                               // what App draws
    <main>                                                               {/* a wrapper */}
      <button onClick={() => setCount(count + 1)}>Count: {count}</button> {/* changes parent state */}
      <button onClick={() => setCount(count)}>Same value</button>        {/* sets the SAME value */}
      <Child label="I always re-render" />                               {/* re-renders whenever App does */}
      <MemoChild label="I skip if props are equal" />                    {/* skips: its props never change */}
    </main>                                                              // end of the wrapper
  );                                                                     // end of what App returns
}                                                                        // end of App
```

**What the console shows** (in production mode — StrictMode in development logs renders twice):

```text
On load:          App rendered, Child rendered, MemoChild rendered
Click "Count":    App rendered, Child rendered        ← MemoChild skipped
Click "Same value": usually nothing — React bails out because the value didn't change.
                  (Sometimes React calls App once more first, but it still skips the children.)
```

## 🔍 Deeper version

**The full list of triggers:**

| Trigger | Re-renders? |
|---|---|
| `setState` with a **new** value | ✅ yes, this component and (by default) all its children |
| `setState` with the **same** value (`Object.is`) | Usually no. React bails out early |
| Parent re-renders | ✅ yes, even if props look the same |
| A `useContext` value changes | ✅ yes, every component reading that context |
| A custom hook's internal state changes | ✅ yes, because the hook's state is the component's state |
| `ref.current` changes | ❌ no |
| A normal variable changes | ❌ no, and the change is lost on the next render |

**"Props changed" is not a trigger by itself.** Props only change because the parent rendered again with new values. People often say "props change causes re-render", but the real trigger is the **parent's render**.

**Referential equality is the usual trap.** React compares with `Object.is` (like `===`). Objects, arrays and functions created during render are **new every time**:

```jsx
<MemoChild style={{ color: 'red' }} onClick={() => save()} />  // new object + new function each render → memo is useless
```

Fixes: move constants outside the component, or use `useMemo` / `useCallback`. See [useMemo and useCallback](topic:react/use-memo-use-callback) and [React.memo](topic:react/react-memo).

**Context re-renders everyone who reads it.** If a Provider's `value` is a new object every render, every consumer re-renders. See [context performance](topic:redux-context/context-performance).

**Redux.** `useSelector` re-renders a component when the selected value changes by reference. Selecting a new object on every call (`state => ({ a: state.a })`) causes a re-render on every store update.

**Moving state down.** Often the cheapest fix is to move state into the small component that uses it. Then its parent and siblings don't re-render at all.

**React Compiler.** React Compiler 1.0 (October 2025) can memoise components and values automatically at build time. With it, many manual `memo`/`useMemo` calls are no longer needed. You should still understand *why* renders happen.

## 🎯 Why do we use it?

- **To fix slow screens.** If you know why something rendered, you know what to change.
- **To answer the very common interview question** "a component re-renders unnecessarily — what do you do?". See [the debugging scenario](topic:debugging/unnecessary-re-renders).
- **To avoid over-optimising.** Many re-renders are cheap and fine.

## ⚠️ Common mistakes

- **Thinking a child only re-renders when its props change.** By default it re-renders whenever its parent does.
- **Wrapping everything in `React.memo`.** It has its own cost, and new object/function props break it anyway.
- **Mutating state** (`list.push(x); setList(list)`). It's the same reference, so React may skip the update. Always create a new array or object.
- **Putting fast-changing values in a big context.** Every consumer re-renders on each change.

## 🗣️ How to answer in an interview

> "A component re-renders when its own state changes, when its parent re-renders, or when a context it reads changes. Props changing isn't really a separate trigger, because props only change when the parent renders. By default, a parent's render re-renders all its children, even with the same props.
>
> React compares values with Object.is, so setting the same state value usually skips the render. But objects and functions created during render are new references every time. That's the usual reason React.memo doesn't help.
>
> When a screen feels slow, I first check with React DevTools: Highlight updates to see what renders, and the Profiler to see why. Then I fix the cause — move state down, memoise the child, stabilise props with useMemo or useCallback, or split a context. And I only optimise where the Profiler shows a real cost."

[FILL IN: a re-render you fixed in the recruiter or candidate screens, if you have one.]

## 🔁 Follow-up questions

### Does a re-render always change the DOM?

No. React compares the new output with the old one. If nothing changed, the DOM is not touched. See [virtual DOM and reconciliation](topic:react/virtual-dom).

### How do you stop a child from re-rendering when the parent does?

Wrap the child in `React.memo` and keep its props stable (same references). Or pass the child as `children`, so it is created by a component that didn't re-render.

### Why does my component render twice in development?

`<StrictMode>` renders components twice in development to find impure code. It doesn't happen in production.

### Does useRef cause re-renders?

No. Changing `ref.current` is invisible to React. Use state if the screen should update. See [useRef](topic:react/use-ref).

## ✅ Quick check

### 1. `App` re-renders. `Child` gets `label="hi"` every time and is NOT wrapped in memo. Does `Child` re-render?

:::answer
**Yes.** Without `memo`, a child re-renders whenever its parent re-renders, even if its props are the same.
:::

### 2. Which of these does NOT cause a re-render?

- A) `setCount(count + 1)`
- B) `inputRef.current = 'x'`
- C) A context value changes

:::answer
**B.** Changing a ref never triggers a render.
:::

### 3. `MemoChild` is wrapped in `memo`, but still re-renders every time. Its prop is `options={['a', 'b']}`. Why?

:::answer
The array is created during each render, so it's a **new reference** every time. `memo` compares by reference and sees a change. Move the array outside the component, or wrap it in `useMemo`.
:::
