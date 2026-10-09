---
title: useRef
stack: react
order: 15
level: Intermediate
mustKnow: false
askedFrequency: common
summary:
  - "useRef gives you a box `{ current: value }` that keeps its value between renders."
  - Changing ref.current does NOT cause a re-render. Use state when the screen must update.
  - "Two main uses: pointing at a DOM element (focus, scroll, measure), and remembering a value like a timer ID or the previous value."
  - Don't read or write ref.current during render. Do it in effects and event handlers.
  - In React 19, a function component can receive `ref` as a normal prop — forwardRef is no longer needed.
cards:
  - q: What does useRef return?
    a: "A plain object `{ current: initialValue }` that stays the same object for the whole life of the component."
  - q: Does changing ref.current cause a re-render?
    a: No. That's the key difference from state.
  - q: Give two common uses of useRef.
    a: Getting a DOM element (to focus an input, scroll, measure size), and storing a mutable value that shouldn't trigger renders, like an interval ID or the previous props.
  - q: When should you use state instead of a ref?
    a: When the value is shown on screen. Changing a ref won't update what the user sees.
  - q: How do you pass a ref to a child component in React 19?
    a: Just pass it as a prop called ref. forwardRef is no longer needed for function components.
---

## 💡 What is it?

`useRef` is a React [hook](glossary:hook). It gives you a small **box** with one slot: `ref.current`.

The box **keeps its value between renders**. And when you change `ref.current`, React **does not re-render**.

We use it for two things:
1. **Pointing at a real page element**, like an input box, to focus it.
2. **Remembering a value** that the screen doesn't show, like a timer ID.

## 🏠 Real-life example

Think of **a sticky note inside your school bag**.

You write the locker number on it. The note stays in your bag all year. When you change the number, **nobody makes an announcement**. Only you know it changed.

Compare it with the **class notice board** (state). When the teacher changes the notice board, **everyone looks up** and sees the new notice.

- **Sticky note in your bag** = `ref.current`. It's kept, but changing it is silent.
- **Notice board** = state. Changing it makes the screen update (a re-render).
- **Writing "the red door" on the note** = a ref pointing at a DOM element.

## 🧑‍💻 Code example

Paste this into `src/App.jsx` of a Vite React app. Run `npm run dev`.

```jsx
import { useRef, useState } from 'react';                              // bring in useRef and useState

export default function App() {                                        // our component
  const inputRef = useRef(null);                                       // a ref for the input box; null until React attaches it
  const clicksRef = useRef(0);                                         // a ref used as a silent counter; starts at 0
  const [shown, setShown] = useState(0);                               // state for the counter we SHOW on screen

  function handleFocus() {                                             // runs when the first button is clicked
    inputRef.current.focus();                                          // .current is the real <input> element → focus it
  }                                                                    // end of handleFocus

  function handleSilentClick() {                                       // runs when the second button is clicked
    clicksRef.current = clicksRef.current + 1;                         // change the ref → NO re-render
    console.log('ref clicks:', clicksRef.current);                     // the value is updated, just not shown
  }                                                                    // end of handleSilentClick

  return (                                                             // what App draws
    <main>                                                             {/* a wrapper */}
      <input ref={inputRef} placeholder="Candidate name" />            {/* React puts this element into inputRef.current */}
      <button onClick={handleFocus}>Focus the input</button>           {/* uses the DOM ref */}
      <button onClick={handleSilentClick}>Silent +1</button>           {/* changes the ref only */}
      <button onClick={() => setShown(clicksRef.current)}>Show count</button> {/* copy the ref into state → re-render */}
      <p>Shown count: {shown}</p>                                      {/* only updates when state changes */}
    </main>                                                            // end of the wrapper
  );                                                                   // end of what App returns
}                                                                      // end of App
```

**What you see:**

```text
"Focus the input" → the cursor jumps into the text box.
"Silent +1" three times → console shows ref clicks: 1, 2, 3 — the page still says "Shown count: 0".
"Show count" → the page now says "Shown count: 3".
```

## 🔍 Deeper version

**What the box really is.** `useRef(initial)` returns `{ current: initial }`. React gives you the **same object** on every render. That's why the value survives.

**Ref vs state vs normal variable:**

| | Kept between renders? | Changing it re-renders? | Use for |
|---|---|---|---|
| Normal `let` variable | ❌ reset every render | ❌ | temporary values |
| `useState` | ✅ | ✅ | anything shown on screen |
| `useRef` | ✅ | ❌ | DOM elements, timer IDs, "previous" values |

**Common real uses:**
- **Focus, scroll, measure:** `inputRef.current.focus()`, `listRef.current.scrollTo(0, 0)`, `boxRef.current.getBoundingClientRect()`.
- **Timer IDs:** keep `setInterval`'s ID in a ref, so a "Stop" button can clear it.
- **Latest value inside a long-living callback:** a ref always holds the newest value, so it avoids [stale closures](topic:javascript/closures).
- **AbortController** of the last request, to cancel it later. See [race conditions](topic:react/race-conditions-abort).

**Don't use refs during render.** Reading or writing `ref.current` while rendering makes output unpredictable. The only exception is lazy setup: `if (ref.current === null) ref.current = new Thing()`. Read and write refs in **event handlers and effects**.

**When is a DOM ref filled?** React sets `ref.current` **after** it puts the element on the page. So it's `null` during the first render, and ready inside `useEffect` and event handlers.

**Callback refs.** You can pass a function: `<div ref={(node) => { /* node is the element */ }} />`. React calls it with the element. In React 19, a callback ref can **return a cleanup function**, called when the element is removed.

:::version[Version note]
**React 19:** function components can take `ref` as a **normal prop**. You no longer need `forwardRef` to pass a ref into your own input component. `forwardRef` still works, but it will be deprecated in a future version. See [portals and refs](topic:react/portals-forward-ref).
:::

## 🎯 Why do we use it?

- **To talk to the real DOM** when React's normal flow isn't enough: focusing inputs, scrolling, measuring, using non-React libraries.
- **To remember values without re-rendering**, which saves wasted renders.
- **To hold IDs** (timers, requests, sockets) that cleanup code needs later.

## ⚠️ Common mistakes

- **Using a ref for something shown on screen.** The screen won't update. Use state.
- **Reading `ref.current` in the first render** and expecting the DOM element. It's still `null`.
- **Changing `ref.current` during render** instead of in an effect or handler.
- **Using refs to "skip React"** for things state can do, like toggling classes. That leads to bugs where React and the DOM disagree.

## 🗣️ How to answer in an interview

> "useRef gives me a mutable box, `{ current }`, that keeps its value across renders. The key difference from state is that changing `ref.current` doesn't trigger a re-render.
>
> I use it in two ways. First, to reference DOM elements — focusing an input, scrolling a list, or measuring an element. Second, to store values the UI doesn't show, like an interval ID, an AbortController for the last request, or the latest value for a callback, which avoids stale closures.
>
> I don't read or write refs during render — only in effects and event handlers. And if the value should appear on screen, I use state instead. Also, since React 19, I can pass `ref` to a function component as a normal prop, without forwardRef."

## 🔁 Follow-up questions

### How do you get the previous value of a prop?

Keep it in a ref and update it in an effect: `useEffect(() => { prevRef.current = value; });`. During the next render, `prevRef.current` still holds the old value.

### What's the difference between useRef and createRef?

`createRef` makes a **new** ref object every time it's called. In a function component, that's every render. `useRef` gives back the **same** object every render. Use `useRef` in function components.

### Can you put a ref on your own component?

In React 19, yes: the component receives `ref` as a prop and attaches it to an inner element. Before React 19, you needed `forwardRef`.

### How would you build a "Stop" button for a setInterval?

Store the interval ID in a ref when you start it. In the Stop handler, call `clearInterval(timerRef.current)`. Also clear it in the effect's cleanup.

## ✅ Quick check

### 1. You click a button 5 times. Each click runs `countRef.current++`. The JSX shows `{countRef.current}`. What does the screen show?

:::answer
Still **0** (or whatever it showed before). Changing a ref doesn't re-render, so the screen isn't updated. The ref itself does hold 5.
:::

### 2. Why is `inputRef.current` null here?

```jsx
function Box() {                         // a component
  const inputRef = useRef(null);         // make a ref
  inputRef.current.focus();              // try to focus during render
  return <input ref={inputRef} />;       // attach the ref
}
```

:::answer
During the **first render**, the input isn't on the page yet, so `inputRef.current` is still `null` and this crashes. Focus it inside `useEffect` or an event handler.
:::
