---
title: useMemo and useCallback
stack: react
order: 16
level: Intermediate
mustKnow: true
askedFrequency: very common
summary:
  - useMemo remembers a calculated VALUE between renders. useCallback remembers a FUNCTION between renders.
  - Both re-calculate only when something in their dependency array changes.
  - Main uses — skip an expensive calculation, and keep props stable for children wrapped in React.memo.
  - They are not free. Don't wrap everything; use them where the Profiler shows a real cost.
  - React Compiler 1.0 can add this memoisation automatically at build time.
cards:
  - q: What is the difference between useMemo and useCallback?
    a: useMemo caches the result of a function (a value). useCallback caches the function itself. useCallback(fn, deps) is the same as useMemo(() => fn, deps).
  - q: When does useMemo help?
    a: For an expensive calculation (like filtering 10,000 items), or to keep an object or array prop stable for a memoised child.
  - q: Why does useCallback alone often not help?
    a: A stable function only matters if the child that receives it is wrapped in React.memo (or it's used in a dependency array). Otherwise the child re-renders anyway.
  - q: Should you wrap every function in useCallback?
    a: No. It adds code and its own cost. Use it where it prevents real work, as measured with the Profiler.
  - q: What does the React Compiler do?
    a: It analyses components at build time and memoises values, functions and JSX automatically, so you need far fewer manual useMemo and useCallback calls.
---

## 💡 What is it?

Every time a component renders, all the code inside it runs again. New values are calculated. New functions are created.

- **`useMemo`** remembers a **calculated value**. It only calculates again when its inputs change.
- **`useCallback`** remembers a **function**. It gives you the *same* function until its inputs change.

Both take a [dependency array](glossary:dependency-array) that says when to update. This idea is called [memoization](glossary:memoization).

## 🏠 Real-life example

Think of **doing your maths homework**.

The teacher gives the same sum two days in a row. On day 2, you don't solve it again. You **copy your answer from yesterday's notebook**. You only solve it again when the teacher **changes the numbers**.

- **Solving the sum** = an expensive calculation.
- **Yesterday's notebook** = the value saved by `useMemo`.
- **The numbers in the sum** = the dependency array.
- **Giving your friend the same phone number every day**, instead of a new number = `useCallback` giving the child the same function. Your friend doesn't need to update their contacts.

## 🧑‍💻 Code example

Paste this into `src/App.jsx` of a Vite React app. Open the browser console.

```jsx
import { memo, useCallback, useMemo, useState } from 'react';               // bring in the tools we need

const allNames = Array.from({ length: 20000 }, (_, i) => `Candidate ${i}`);  // a big list made once, outside the component

const SaveButton = memo(function SaveButton({ onSave }) {                    // a child wrapped in memo
  console.log('SaveButton rendered');                                        // shows when the child renders
  return <button onClick={onSave}>Save</button>;                             // calls the function from the parent
});                                                                          // end of SaveButton

export default function App() {                                              // the parent
  const [search, setSearch] = useState('');                                  // the search text; starts empty
  const [theme, setTheme] = useState('light');                               // unrelated state, to cause re-renders

  const results = useMemo(() => {                                            // remember the filtered list
    console.log('filtering...');                                             // shows when filtering really runs
    return allNames.filter((n) => n.includes(search));                       // the expensive work
  }, [search]);                                                              // only filter again when search changes

  const handleSave = useCallback(() => {                                     // remember this function
    console.log('saving', search);                                           // uses the current search
  }, [search]);                                                              // make a new function only when search changes

  return (                                                                   // what App draws
    <main className={theme}>                                                 {/* theme is just a class name */}
      <input value={search} onChange={(e) => setSearch(e.target.value)} />   {/* typing changes search */}
      <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>Toggle theme</button> {/* unrelated change */}
      <SaveButton onSave={handleSave} />                                     {/* gets a stable function */}
      <p>{results.length} matches</p>                                        {/* uses the remembered list */}
    </main>                                                                  // end of the wrapper
  );                                                                         // end of what App returns
}                                                                            // end of App
```

**What the console shows:**

```text
Type "9"        → filtering...  and  SaveButton rendered   (search changed, so both update)
Toggle theme    → nothing logged                            (results and handleSave are reused)
```

Without `useMemo`, "Toggle theme" would filter 20,000 names again. Without `useCallback`, `SaveButton` would re-render, because it would get a new function every time.

## 🔍 Deeper version

**They are almost the same thing.**

```jsx
useCallback(fn, deps)            // is the same as...
useMemo(() => fn, deps)          // ...returning the function from useMemo
```

**When they actually help:**

| Situation | Helps? |
|---|---|
| Expensive calculation (big filter, sort, heavy maths) | ✅ `useMemo` |
| Object/array prop for a child wrapped in `React.memo` | ✅ `useMemo` |
| Function prop for a child wrapped in `React.memo` | ✅ `useCallback` |
| Value or function used in another hook's dependency array | ✅ prevents the effect from running again |
| Function passed to a normal `<button>` or a non-memo child | ❌ the child re-renders anyway |
| Cheap calculation like `a + b` | ❌ the hook costs more than it saves |

**Why "stable references" matter.** React compares props with `Object.is`. A function written inside the component is a **new function** every render, so `React.memo` thinks the prop changed. See [what causes a re-render](topic:react/what-causes-a-re-render) and [React.memo](topic:react/react-memo).

**Dependencies must be honest.** If the function uses `search` but you leave it out of the array, it keeps the **old** `search` forever (a stale [closure](topic:javascript/closures)). Keep the `exhaustive-deps` lint rule on.

**useMemo is a performance hint, not a promise.** React may throw away cached values in some cases (for example, components that suspend). Your code must still be correct without it.

**How to tell if a calculation is "expensive".** Wrap it in `console.time` / `console.timeEnd`. If it takes about 1 ms or more, memoising may be worth it. The React DevTools **Profiler** shows which renders are slow.

:::version[Version note]
**React Compiler 1.0** (stable since October 2025) memoises values, functions and JSX automatically at build time. In projects that use it, you rarely write `useMemo`/`useCallback` by hand. Interviewers still ask about them, because most existing codebases use them.
:::

## 🎯 Why do we use it?

- **To skip slow work** on renders that don't need it, like filtering a big candidate list when only the theme changed.
- **To make `React.memo` work**, by giving children the same props each render.
- **To stop effects from running too often**, when an object or function is in a dependency array.

## ⚠️ Common mistakes

- **Wrapping everything.** Each hook adds memory, comparison work and code to read.
- **`useCallback` without a memoised child.** The child re-renders anyway, so nothing is saved.
- **Missing dependencies.** The function or value uses an old value.
- **Using `useMemo` for side effects** (like fetching). It's for pure calculations only. Use `useEffect` for side effects.

## 🗣️ How to answer in an interview

> "useMemo caches the result of a calculation, and useCallback caches a function reference. Both recompute only when their dependencies change. In fact, useCallback is just useMemo returning a function.
>
> I use useMemo for genuinely expensive calculations, like filtering a big list, and to keep object or array props stable. I use useCallback when I pass a function to a child wrapped in React.memo, or when the function is a dependency of another hook. Without a memoised child, useCallback alone doesn't save anything.
>
> I don't wrap everything, because the hooks have their own cost. I measure first with the Profiler. And with the React Compiler, much of this memoisation is now done automatically at build time."

[FILL IN: a real place you used useMemo or useCallback at SkillKeepr, if you have one.]

## 🔁 Follow-up questions

### What's the difference between useMemo and React.memo?

`useMemo` caches a **value** inside a component. `React.memo` wraps a **whole component** and skips its render when its props are the same.

### Can useMemo replace useEffect for fetching data?

No. `useMemo` runs during render and must be pure. Fetching is a side effect, so it belongs in `useEffect`, an event handler, or a data library.

### Why might my useMemo still run on every render?

One of its dependencies is new on every render, like an object or array created in the component body. Memoise that dependency too, or move it outside the component.

### Do I still need these hooks with the React Compiler?

Rarely. The compiler adds memoisation automatically. You may still use them as an escape hatch, or in projects without the compiler.

## ✅ Quick check

### 1. Which hook keeps the same function reference between renders?

- A) `useMemo(() => value, [])`
- B) `useCallback(fn, [])`
- C) `useRef(0)`

:::answer
**B) `useCallback`.** (A caches a value; C is a mutable box.)
:::

### 2. `const sorted = useMemo(() => [...list].sort(), [])` — `list` changes later. What's the bug?

:::answer
The dependency array is empty, so `sorted` is calculated **once** and never updates. Add `list`: `[list]`.
:::

### 3. `handleClick` is wrapped in `useCallback` and passed to a plain `<Child />` (not memo). Does it stop `Child` from re-rendering?

:::answer
**No.** `Child` re-renders whenever its parent re-renders. The stable function only helps if `Child` is wrapped in `React.memo`.
:::
