---
title: Rules of hooks
stack: react
order: 12
level: Basic
mustKnow: false
askedFrequency: common
summary:
  - "Rule 1: call hooks only at the top level of a component or custom hook — never inside if, loops, or nested functions."
  - "Rule 2: call hooks only from React function components or from custom hooks — not from normal functions or classes."
  - React remembers hooks by their call order. If the order changes between renders, state gets mixed up.
  - The eslint-plugin-react-hooks lint rules catch these mistakes for you.
  - The new `use` API (React 19) is the one exception that can be called inside if and loops.
cards:
  - q: What are the two rules of hooks?
    a: Call hooks only at the top level (not in conditions, loops or nested functions), and call them only from function components or custom hooks.
  - q: Why can't you call useState inside an if?
    a: React identifies each hook by the order it is called. If a condition skips a hook, every hook after it gets the wrong stored value.
  - q: How do you run an effect only sometimes, then?
    a: Call the hook every time, and put the condition INSIDE the hook's function, e.g. inside useEffect.
  - q: Which tool catches broken hook rules?
    a: The eslint-plugin-react-hooks rules (rules-of-hooks and exhaustive-deps). Vite and Next.js templates include them.
  - q: Is there any hook-like API you can call conditionally?
    a: Yes, React 19's `use` API can be called inside if statements and loops. Normal hooks still cannot.
---

## 💡 What is it?

[Hooks](glossary:hook) are special functions like `useState` and `useEffect`. They have **two rules**:

1. **Call hooks only at the top level.** Never inside an `if`, a loop, or a nested function.
2. **Call hooks only from React components or custom hooks.** Not from normal JavaScript functions.

Break a rule, and React may give a component the **wrong state**.

## 🏠 Real-life example

Think of **a school locker room with numbered lockers**.

Every day, students go to the lockers **in the same order**. Student 1 opens locker 1. Student 2 opens locker 2. Nobody writes names on the lockers. The order is the only label.

One day, student 2 is absent (an `if` skipped them). Now student 3 walks to locker 2 and takes student 2's books!

- **Lockers** = the places where React stores each hook's value.
- **Walking in the same order every day** = calling hooks in the same order every render.
- **An absent student** = a hook skipped by an `if`.
- **Taking the wrong books** = a hook reading another hook's state.

## 🧑‍💻 Code example

Paste this into `src/App.jsx` of a Vite React app. Run `npm run dev`.

```jsx
import { useEffect, useState } from 'react';                     // bring in two hooks

function Profile({ isLoggedIn }) {                                // a component; isLoggedIn comes from the parent
  // ❌ WRONG (don't do this):
  // if (isLoggedIn) { const [name, setName] = useState(''); }   // a hook inside an if — order can change

  const [name, setName] = useState('');                           // ✅ always called, at the top level
  useEffect(() => {                                               // ✅ always called, at the top level
    if (!isLoggedIn) return;                                      // ✅ the condition goes INSIDE the hook
    setName('Hari');                                              // pretend we loaded the user's name
  }, [isLoggedIn]);                                               // run again when isLoggedIn changes

  if (!isLoggedIn) return <p>Please log in</p>;                   // ✅ early return AFTER all hooks is fine
  return <p>Hello, {name}</p>;                                    // show the name
}                                                                 // end of Profile

export default function App() {                                   // the main component
  const [loggedIn, setLoggedIn] = useState(false);                // starts logged out
  return (                                                        // what App draws
    <main>                                                        {/* a wrapper */}
      <button onClick={() => setLoggedIn(!loggedIn)}>Toggle</button> {/* switch logged in / out */}
      <Profile isLoggedIn={loggedIn} />                           {/* the child component */}
    </main>                                                       // end of the wrapper
  );                                                              // end of what App returns
}                                                                 // end of App
```

**What you see:**

```text
First: "Please log in"
Click Toggle: "Hello, Hari"
Click again: "Please log in" — no errors, because the hook order never changed
```

## 🔍 Deeper version

**Why the order matters.** React does not know your hooks by name. Inside, each component has a **list of hook slots**. On every render, the first `useState` call gets slot 1, the second gets slot 2, and so on.

```text
Render 1:  useState('') → slot 1    useEffect → slot 2
Render 2:  (if skipped useState)    useEffect → slot 1 ❌ reads the wrong slot
```

If a condition skips a hook, every later hook reads the wrong slot. React then throws an error like *"Rendered fewer hooks than expected"*, or worse, shows wrong data.

**Where you CAN'T call hooks:**
- inside `if`, `for`, `while`, `switch`
- after an early `return` (because then they are sometimes skipped)
- inside event handlers like `onClick`
- inside callbacks passed to `useMemo`, `useEffect` or `.map()`
- in normal functions and class components

**Where you CAN call hooks:**
- at the top of a function component
- at the top of a **custom hook** (a function whose name starts with `use`). See [custom hooks](topic:react/custom-hooks).

**Why the `use` name matters.** The lint plugin and the React Compiler treat any function named `useSomething` as a hook. So name custom hooks with `use`, and never name normal functions that way.

**The lint plugin.** `eslint-plugin-react-hooks` has two key rules:
- `rules-of-hooks`: catches hooks in the wrong place.
- `exhaustive-deps`: catches missing values in dependency arrays. See [useEffect](topic:react/use-effect).

:::version[Version note]
**React 19** added the `use` API, for reading a promise or a context. Unlike other hooks, `use` **can** be called inside `if` and loops. All the normal hooks (`useState`, `useEffect`, and the rest) still follow both rules.
:::

## 🎯 Why do we use it?

- **To keep state attached to the right hook.** The rules guarantee the same call order on every render.
- **To make components predictable.** The same hooks run every time, so the behaviour is easy to reason about.
- **So tools can help.** Lint rules and the React Compiler rely on these rules to find bugs and optimise code.

## ⚠️ Common mistakes

- **Putting a hook inside an `if`.** Put the condition inside the hook instead.
- **Returning early before some hooks run.** Move all hooks above the first `return`.
- **Calling a hook inside an event handler**, like `onClick={() => useState(0)}`. Hooks only run during render.
- **Turning off the lint rule** to silence the warning. The warning is almost always right.

## 🗣️ How to answer in an interview

> "There are two rules. First, call hooks only at the top level of a component or custom hook — never inside conditions, loops or nested functions. Second, call them only from function components or custom hooks.
>
> The reason is that React doesn't identify hooks by name. It stores their values in a list and matches them by call order. If a condition skips a hook on one render, every hook after it reads the wrong value.
>
> So if I need conditional logic, I always call the hook and put the condition inside it — for example, an early return inside the effect. I keep the eslint react-hooks plugin on, so these mistakes are caught before they run. The one exception is React 19's `use` API, which can be called conditionally."

## 🔁 Follow-up questions

### Why must custom hooks start with "use"?

It's how React's lint rules and the React Compiler know a function is a hook. Then they can check the rules of hooks inside it. Without the prefix, bugs inside it won't be caught.

### Can I call a hook inside a loop if the loop always runs the same number of times?

Technically the order would stay the same, but it's fragile and the linter flags it. Usually the better design is a child component for each item, where each child calls its own hooks.

### What error do you see when the rules are broken?

Often "Rendered more hooks than during the previous render" or "Rendered fewer hooks than expected". Sometimes there's no error, just the wrong values on screen.

### Can class components use hooks?

No. Hooks only work in function components and custom hooks. A class component can be wrapped by a function component that uses hooks and passes the values down as props.

## ✅ Quick check

### 1. Is this allowed?

```jsx
function Card({ show }) {                    // a component
  if (!show) return null;                    // early return
  const [open, setOpen] = useState(false);   // a hook after the return
  return <div>{String(open)}</div>;          // show the value
}
```

:::answer
**No.** When `show` is false, the hook is skipped, so the number of hooks changes between renders. Move `useState` above the `if`.
:::

### 2. Where should the condition go if you only want to fetch when `userId` exists?

:::answer
**Inside the effect:** `useEffect(() => { if (!userId) return; /* fetch */ }, [userId]);`. The hook itself is still called on every render.
:::
