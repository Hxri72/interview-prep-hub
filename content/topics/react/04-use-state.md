---
title: State with useState
stack: react
order: 4
level: Basic
mustKnow: true
askedFrequency: very common
summary:
  - useState gives a component memory. It returns the current value and a setter function, e.g. const [count, setCount] = useState(0).
  - Calling the setter tells React to re-render the component with the new value.
  - State is a snapshot. Inside one render, the value doesn't change, even right after you call the setter.
  - "Use the updater form setCount(c => c + 1) when the new value depends on the old one."
  - Never change objects or arrays in state directly. Make a new copy with the change.
cards:
  - q: What does useState return?
    a: An array with two items — the current value and a setter function. We usually destructure it, e.g. const [name, setName] = useState('').
  - q: Why doesn't console.log show the new value right after setCount?
    a: State is a snapshot for the current render. The setter schedules a re-render; the new value appears in the next render.
  - q: When should you use setCount(c => c + 1)?
    a: When the new value depends on the previous one, especially if you update several times in a row or inside timers and closures.
  - q: How do you update one field of an object in state?
    a: "Copy it and change one field — setUser({ ...user, name: 'Asha' }). Never write user.name = 'Asha'."
  - q: What is automatic batching?
    a: Since React 18, several state updates in the same event, timeout or promise are combined into one re-render.
---

## 💡 What is it?

`useState` is a React [hook](glossary:hook). It gives a component **memory**.

You call it with a starting value. It gives back two things: the **current value** and a **setter function** to change it.

When you call the setter, React **re-renders** the component and shows the new value.

## 🏠 Real-life example

Think of a **scoreboard in a cricket match**.

The board shows the current score. When a run is scored, the scorer changes the number. Everyone looks up and sees the new score.

- The **number on the board** = the state value (`score`).
- The **scorer who changes it** = the setter (`setScore`).
- **Everyone looking at the new number** = React re-rendering the screen.
- **You can't scratch the board with a pen** = you can't change state directly; you must use the setter.

## 🧑‍💻 Code example

Paste this into `src/App.jsx` of a Vite React app. Run `npm run dev`.

```jsx
import { useState } from 'react';                         // bring in the useState hook

export default function App() {                           // the main component
  const [count, setCount] = useState(0);                  // count starts at 0; setCount changes it
  const [name, setName] = useState('');                   // name starts as an empty string

  function addThree() {                                   // runs when the second button is clicked
    setCount((c) => c + 1);                               // updater: take the latest count, add 1
    setCount((c) => c + 1);                               // again, using the newest value
    setCount((c) => c + 1);                               // again — total +3
  }                                                       // end of addThree

  return (                                                // what the screen shows
    <main>                                                {/* a box around everything */}
      <p>Count: {count}</p>                               {/* shows the current count */}
      <button onClick={() => setCount(count + 1)}>+1</button> {/* adds 1 */}
      <button onClick={addThree}>+3</button>              {/* adds 3 using the updater form */}
      <input value={name} onChange={(e) => setName(e.target.value)} /> {/* typing updates name */}
      <p>Hello, {name || 'stranger'}</p>                  {/* shows 'stranger' while name is empty */}
    </main>                                               // end of the box
  );                                                      // end of what App returns
}                                                         // end of App
```

**What you see:**

```text
Count: 0     [+1] [+3]
[ type here ]
Hello, stranger

Click +1 → Count: 1. Click +3 → Count: 4.
Type "Hari" → Hello, Hari
```

## 🔍 Deeper version

**What really happens.** React keeps the state value outside your function. Each time your component runs, `useState` hands you the current value. Calling the setter:
1. stores the new value,
2. schedules a re-render,
3. runs your component again, and `useState` now returns the new value.

**State is a snapshot.** Inside one render, `count` is a fixed number:

```jsx
function handleClick() {                                  // a click handler
  setCount(count + 1);                                    // count is 0 here, so this asks for 1
  setCount(count + 1);                                    // count is STILL 0 here, so this also asks for 1
  console.log(count);                                     // prints 0 — the old snapshot
}                                                         // result after the click: 1, not 2
```

That's why the **updater form** exists. `setCount(c => c + 1)` gets the latest value each time, so three calls add 3.

**Automatic batching.** Since React 18, React combines several updates in the same event, timeout or promise into **one** re-render. This is faster.

**Objects and arrays: always copy.** React checks if the value changed with `Object.is` (like `===`). If you change an object in place, it's the **same object**, so React may skip the update.

```jsx
setUser({ ...user, name: 'Asha' });                       // new object with one changed field
setSkills([...skills, 'Node']);                           // new array with one item added
setSkills(skills.filter((s) => s !== 'PHP'));             // new array with one item removed
```

See [immutability](topic:redux-context/immutability) and [shallow vs deep copy](topic:javascript/shallow-vs-deep-copy).

**Lazy initial state.** `useState(expensiveFn())` runs `expensiveFn` on every render (the result is ignored after the first). `useState(() => expensiveFn())` runs it only once.

**Same value, no re-render.** If you set the same value again (`setCount(count)`), React usually skips the re-render.

**When to use something else.** Many related values with complex rules → [`useReducer`](topic:react/use-reducer). A value you need to remember but not show → [`useRef`](topic:react/use-ref).

:::version[Version note]
Before **React 18**, updates were only batched inside React event handlers. Updates inside `setTimeout` or promises caused one re-render each. React 18 batches them everywhere.
:::

## 🎯 Why do we use it?

A plain variable inside a component is reset on every render, and changing it doesn't update the screen. `useState`:
- **remembers** the value between renders, and
- **tells React** to update the screen when it changes.

Typing in a box, opening a menu, counting clicks and storing loaded data all need state.

## ⚠️ Common mistakes

- **Changing state directly** (`count = 5` or `user.name = 'x'`). The screen won't update. Use the setter with a new value.
- **Expecting the new value right after `setX`.** It shows in the next render.
- **Using `setCount(count + 1)` many times in a row.** Use the updater form `setCount(c => c + 1)`.
- **Storing values you can calculate.** If `fullName` comes from `first + last`, calculate it during render. Don't store it in state.

## 🗣️ How to answer in an interview

> "useState gives a function component its own memory. It returns the current value and a setter. When I call the setter, React stores the new value and re-renders the component.
>
> Two details matter. First, state is a snapshot: inside one render the value doesn't change, so logging it right after the setter shows the old value. When the next value depends on the previous one, I use the updater form, like `setCount(c => c + 1)`. Second, I never mutate objects or arrays in state. I create a new copy with spread, map or filter, because React compares by reference.
>
> Since React 18, updates are batched automatically, so several setters in one event cause one re-render."

## 🔁 Follow-up questions

### Is the setter synchronous or asynchronous?

It doesn't change the value immediately. It schedules a re-render. The new value is available in the next render, not on the next line.

### Why use the updater function form?

It always receives the latest value. Without it, several updates in a row (or updates inside old closures, like timers) can use a stale value and lose changes.

### What happens if you set state during render?

It can cause an infinite loop: render → set state → render again. Set state in event handlers or effects instead.

### How is useState different from a normal variable?

A normal variable resets on every render and doesn't update the screen when changed. State survives between renders and triggers a re-render.

## ✅ Quick check

### 1. `count` is 0. After one click, what does the screen show?

```jsx
function onClick() {                       // click handler
  setCount(count + 1);                     // asks for 0 + 1
  setCount(count + 1);                     // asks for 0 + 1 again
}
```

:::answer
**1.** Both lines read the same snapshot (`count` is 0). Use `setCount(c => c + 1)` twice to get 2.
:::

### 2. Why doesn't this update the screen?

```jsx
const [skills, setSkills] = useState(['React']); // an array in state
skills.push('Node');                             // change it in place
setSkills(skills);                               // set the same array
```

:::answer
It's the **same array object**, so React sees no change. Create a new array: `setSkills([...skills, 'Node'])`.
:::

### 3. What does `useState` return?

:::answer
An array of two items: the current value and the setter function.
:::
