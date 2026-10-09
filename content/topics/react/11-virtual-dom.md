---
title: Virtual DOM and reconciliation
stack: react
order: 11
level: Basic
mustKnow: true
askedFrequency: very common
summary:
  - The virtual DOM is a light copy of the UI that React keeps in memory as plain JavaScript objects.
  - On every render, React builds a new tree and compares it with the old one. This comparison is called reconciliation.
  - React then updates only the parts of the real DOM that changed.
  - Keys help React match list items between renders, so it moves or updates the right element.
  - A different element type (div → span, or ComponentA → ComponentB) makes React throw away the old subtree and its state.
cards:
  - q: What is the virtual DOM?
    a: A lightweight copy of the UI kept in memory as JavaScript objects. React compares the new copy with the old one and changes only what is different in the real DOM.
  - q: What is reconciliation?
    a: The process where React compares the new tree of elements with the previous one and works out the smallest set of real DOM changes.
  - q: Why do lists need keys?
    a: Keys tell React which item is which between renders, so it can update, move or remove the right element. Use stable IDs, not array indexes.
  - q: What happens if an element's type changes, like div to section?
    a: React removes the old element and everything inside it, including their state, and builds the new one from scratch.
  - q: Is the virtual DOM always faster than editing the DOM by hand?
    a: No. Careful hand-written DOM code can be faster. The virtual DOM makes UI code simple and declarative while staying fast enough.
---

## 💡 What is it?

The **[DOM](glossary:dom)** is the browser's real tree of page elements. Changing it is slow-ish, because the browser may have to recalculate the layout and repaint the screen.

The **virtual DOM** is a **light copy of the UI** that React keeps in memory. It is made of plain JavaScript objects.

When something changes, React builds a **new copy**. It **compares** it with the old copy. Then it changes **only the different parts** in the real DOM. This comparing is called **[reconciliation](glossary:reconciliation)**.

## 🏠 Real-life example

Think of **a teacher correcting a class register**.

The teacher has yesterday's attendance list. Today a new list comes in. The teacher does **not** rewrite the whole register. They **compare the two lists**, find the 2 changed names, and fix only those 2 lines.

- **Yesterday's list** = the old virtual DOM.
- **Today's list** = the new virtual DOM after a state change.
- **Comparing the two lists** = reconciliation ("diffing").
- **Fixing only 2 lines in the register** = updating only the changed parts of the real DOM.
- **Roll numbers** = keys. They tell the teacher which student is which, even if the order changes.

## 🧑‍💻 Code example

Paste this into `src/App.jsx` of a Vite React app. Run `npm run dev` and open the browser **Elements** tab in DevTools.

```jsx
import { useState } from 'react';                                    // bring in the useState hook

export default function App() {                                      // our only component
  const [count, setCount] = useState(0);                             // count starts at 0
  return (                                                           // what App draws
    <main>                                                           {/* this element stays the same every render */}
      <h1>Candidates</h1>                                            {/* never changes → React never touches it */}
      <p>Shortlisted: {count}</p>                                    {/* only the number text changes */}
      <button onClick={() => setCount(count + 1)}>Add one</button>   {/* click → new state → new render */}
    </main>                                                          // end of main
  );                                                                 // end of what App returns
}                                                                    // end of App
```

**What you see in the Elements tab when you click the button:**

```text
Only the text inside <p> flashes (it was updated).
<main>, <h1> and <button> do NOT flash — React left them alone.
```

React re-ran the whole `App` function. But after comparing, it changed **one text node** in the real DOM.

## 🔍 Deeper version

**Render vs commit.** React works in two phases:
1. **Render phase:** React calls your components. They return elements (the new virtual tree). Nothing on screen changes yet.
2. **Commit phase:** React applies the real DOM changes it found, all at once.

So "re-render" does **not** mean "the DOM was rebuilt". It means "React called the component again and compared".

**How React compares (the diffing rules).** A perfect tree comparison would be very slow. React uses two simple rules instead:

| Rule | What happens |
|---|---|
| **Different element type** (`div` → `section`, `<A/>` → `<B/>`) | React destroys the old subtree, **including its state**, and builds a new one |
| **Same type** | React keeps the element and only updates the changed props/attributes |
| **Lists** | React matches children by **`key`**. Same key = same item, even if it moved |

**Why keys matter.** Imagine a list `[Anu, Hari]` with index keys `0, 1`. You add "Meera" at the top. Now Meera has key `0`. React thinks item `0` just changed its text, and item `1` changed too. Any state inside those items (like a typed comment) sticks to the **wrong person**. With stable keys like `candidate.id`, React knows Meera is new and just inserts her. See [lists and keys](topic:react/lists-keys).

**A trick using keys.** Changing a component's `key` on purpose makes React treat it as a **new** component. This resets all its state. For example, `<ProfileForm key={candidateId} />` gives a fresh, empty form for each candidate.

**Fiber.** Since React 16, the engine is called **Fiber**. It can split rendering into small units of work, pause, and continue later. This allows [useTransition](topic:react/use-transition-deferred), which keeps typing smooth while a big list renders.

**Is it always faster?** No. Hand-written DOM code that changes exactly one node is faster. The real win is that you write simple "describe the whole UI" code, and React keeps it **fast enough** for you.

## 🎯 Why do we use it?

- **Simple code.** You describe what the UI should look like for the current state. You don't write "find this node, change that text" code.
- **Fewer DOM changes.** Only the real differences reach the browser.
- **Predictable updates.** The same state always gives the same UI.

## ⚠️ Common mistakes

- **Using the array index as a key** in lists that can be reordered, filtered or added to. State gets attached to the wrong items.
- **Thinking "re-render" means the DOM was rebuilt.** It only means React called the component and compared. The DOM changes only where needed.
- **Defining a component inside another component.** Each render creates a new component type. React sees a "different type" and resets its state every time.
- **Changing the wrapper element type** conditionally (`isMobile ? <div> : <section>`). Everything inside loses its state.

## 🗣️ How to answer in an interview

> "The virtual DOM is a lightweight copy of the UI that React keeps in memory as JavaScript objects. When state or props change, React calls the components again to build a new tree. Then it compares the new tree with the previous one. That comparison is reconciliation. Finally, in the commit phase, it updates only the real DOM nodes that changed.
>
> To keep the comparison fast, React uses simple rules. If an element's type changes, it throws away that whole subtree and its state. If the type is the same, it only updates changed props. For lists, it matches items by key, which is why I always use stable IDs and not array indexes.
>
> The main benefit isn't raw speed. It's that I can write declarative UI code and React keeps the DOM updates small for me."

## 🔁 Follow-up questions

### What is the difference between re-rendering and updating the DOM?

Re-rendering means React called your component function again and got new elements. Updating the DOM happens in the commit phase, and only for the parts that changed. A component can re-render without any DOM change at all.

### What happens if you use the index as a key?

When items are added, removed or reordered, the indexes shift. React thinks the wrong items changed. Input values and local state can end up on the wrong row. Use a stable unique ID instead.

### Is the virtual DOM the same as the Shadow DOM?

No. The virtual DOM is React's in-memory copy for diffing. The Shadow DOM is a browser feature that hides and scopes the inside of web components, mainly for styles.

### What is React Fiber?

The reconciliation engine since React 16. It breaks rendering into small units that can be paused, given a priority, and resumed. This enables concurrent features like `useTransition`.

## ✅ Quick check

### 1. A component's wrapper changes from `<div>` to `<section>`. What happens to the state of components inside it?

:::answer
It is **lost**. A different element type makes React throw away the old subtree, including its state, and mount a new one.
:::

### 2. True or false: when a component re-renders, React rebuilds its whole part of the real DOM.

:::answer
**False.** React calls the component again and compares the new elements with the old ones. It changes only the real DOM nodes that are different.
:::

### 3. Which key is best for a list of candidates that can be sorted?

- A) the array index
- B) `Math.random()`
- C) `candidate.id`

:::answer
**C.** A stable, unique ID. Index keys break when the order changes. Random keys change every render, so React recreates every item.
:::
