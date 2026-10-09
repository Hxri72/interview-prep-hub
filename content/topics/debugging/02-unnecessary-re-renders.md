---
title: A component re-renders unnecessarily
template: scenario
stack: debugging
order: 2
level: Intermediate
mustKnow: true
askedFrequency: very common
summary:
  - "Detect: React DevTools → turn on \"Highlight updates when components render\". Flashing = re-rendering."
  - "Debug: record in the React DevTools Profiler with \"Record why each component rendered\" on. It tells you: props, state, hooks, context or parent."
  - "Fix by cause: React.memo for the child, useCallback/useMemo for unstable props, split context, move state down, stable keys."
  - Don't wrap everything in memo — it has a cost. Only fix what the Profiler shows.
  - Profile again after the fix to prove the render count dropped.
cards:
  - q: How do you see which components re-render?
    a: React DevTools → settings → "Highlight updates when components render". Each re-render flashes a box around the component.
  - q: How do you find WHY a component re-rendered?
    a: Record an interaction in the React DevTools Profiler with "Record why each component rendered while profiling" turned on. It lists the reason, like "props changed" or "parent rendered".
  - q: A memoised child still re-renders because the parent passes onClick={() => ...}. Fix?
    a: Wrap the function in useCallback so its reference stays the same between renders. React.memo then sees equal props.
  - q: Every consumer re-renders when one value in a context changes. Fix?
    a: Memoise the provider value, split the context into smaller ones, or move fast-changing state out of context.
  - q: Why not wrap every component in React.memo?
    a: Memo compares props on every render, which costs time and memory. It only helps when re-renders are really expensive or frequent.
---

## 💡 What is it?

The symptom: the app feels **slow or laggy**. Typing has a delay. A list stutters.

The cause is often that a component **re-renders when nothing it shows has changed**. A [re-render](glossary:render) means React runs your component function again. A few extra renders are fine. Hundreds per keystroke are not.

## 🏠 Real-life example

Think of a **class teacher taking attendance**.

One new student joins the class. A bad teacher calls **every name again** from the start. A smart teacher just adds the new name.

- **The teacher calling all names** = React re-rendering every component.
- **Only the new student changed** = only one prop or piece of state changed.
- **Adding just the new name** = React skipping components whose props didn't change (`React.memo`).
- **The attendance register** = the React DevTools Profiler. It shows who was called and why.

## 🔎 Detect

First confirm it's real and that it matters.

1. You notice lag: slow typing, a stuttering list, a slow button.
2. Open **React DevTools** → ⚙️ settings → turn on **"Highlight updates when components render"**.
3. Do the slow action. Every component that re-renders **flashes**.
4. Look for components that flash even though their data didn't change.

## 🐞 Debug

Now find the exact reason.

1. Open the **Profiler** tab in React DevTools.
2. In settings, turn on **"Record why each component rendered while profiling"**.
3. Click **record**, do the slow action, click **stop**.
4. Click a component in the flame chart. It shows **how long it took** and **why it rendered**.

The reasons you will see:

| Reason shown | What it means |
|---|---|
| Props changed | The parent passed a new value (often a new object or function) |
| State changed | The component's own state changed |
| Hooks changed | A hook it uses returned something new |
| Context changed | A context it reads got a new value |
| The parent component rendered | The parent re-rendered, so this child did too |

For a quick check, you can also add `console.log('render ProductRow')` inside the component.

## 🔧 Fix

**Match the fix to the cause:**

| Cause found | Fix |
|---|---|
| Parent re-renders, child gets the same props | Wrap the child in `React.memo` |
| A new object or array is passed each render (`style={{...}}`) | Move it outside the component, or `useMemo` |
| A new function is passed each render (`onClick={() => ...}`) | `useCallback` |
| A context value changes and all consumers re-render | Memoise the provider value, or split the context |
| State lives too high in the tree | Move the state down to the component that uses it |
| A heavy calculation runs every render | `useMemo` around the calculation |

**Before (broken):** typing in the search box re-renders every row.

```jsx
import { useState } from 'react';                                   // the state hook

function Row({ job, onSelect }) {                                   // one row of the list
  console.log('render row', job.id);                                // proves how often it renders
  return <li onClick={() => onSelect(job.id)}>{job.title}</li>;     // click → tell the parent which job
}                                                                   // end of Row

export default function JobList({ jobs }) {                         // the parent list
  const [query, setQuery] = useState('');                           // the search text
  const handleSelect = (id) => console.log('selected', id);         // a NEW function on every render
  return (                                                          // what to draw
    <>                                                              {/* a wrapper with no extra HTML */}
      <input value={query} onChange={(e) => setQuery(e.target.value)} /> {/* each key press changes state */}
      <ul>{jobs.map((j) => <Row key={j.id} job={j} onSelect={handleSelect} />)}</ul> {/* every row re-renders */}
    </>                                                             // end of the wrapper
  );                                                                // end of what to draw
}                                                                   // end of JobList
```

**After (fixed):** rows only re-render when their own job changes.

```jsx
import { memo, useCallback, useState } from 'react';                // memo + useCallback added

const Row = memo(function Row({ job, onSelect }) {                  // memo: skip re-render if props are equal
  console.log('render row', job.id);                                // now prints only once per row
  return <li onClick={() => onSelect(job.id)}>{job.title}</li>;     // same row markup as before
});                                                                 // end of the memoised Row

export default function JobList({ jobs }) {                         // the parent list
  const [query, setQuery] = useState('');                           // typing still updates the parent
  const handleSelect = useCallback((id) => console.log('selected', id), []); // [] = same function every render
  return (                                                          // what to draw
    <>                                                              {/* a wrapper with no extra HTML */}
      <input value={query} onChange={(e) => setQuery(e.target.value)} /> {/* only the parent re-renders */}
      <ul>{jobs.map((j) => <Row key={j.id} job={j} onSelect={handleSelect} />)}</ul> {/* rows are skipped */}
    </>                                                             // end of the wrapper
  );                                                                // end of what to draw
}                                                                   // end of JobList
```

Paste both into a Vite React app and type in the box. Watch the console.

## 🛡️ Prevent

- **Profile again** after the fix. Confirm the render count really dropped.
- Keep the **`react-hooks/exhaustive-deps`** lint rule on, so hooks have correct dependencies.
- **Don't memo everything.** Memoisation costs memory and comparison time. Use it where the Profiler shows a real problem.
- Use **stable `key`s** (ids, not array indexes) in lists.
- For long lists, consider **virtualisation**. See [A 5,000-row list scrolls slowly](topic:debugging/slow-long-list).

## 🗣️ How to answer in an interview

> **Short version:** "I'd confirm it with React DevTools highlight updates, then use the Profiler to see why it rendered: props, state, context or the parent. The fix depends on the cause: React.memo for the child, useCallback or useMemo for unstable props, splitting context, or moving state down. Then I profile again to confirm."
>
> **Full version:** "First I confirm the problem is real, for example typing lag. I turn on 'highlight updates' in React DevTools and repeat the action. Components that flash without their data changing are the suspects. Then I record in the Profiler with 'record why each component rendered' on. It tells me the exact reason. If the parent re-rendered and passed the same data, I wrap the child in React.memo. If the props are new functions or objects each render, I stabilise them with useCallback or useMemo. If a context update re-renders everyone, I split the context or memoise its value. If state lives too high, I move it down. After the fix I profile again, and I keep the exhaustive-deps lint rule on. I don't add memo everywhere, because it has its own cost."

[FILL IN: a real re-render problem you fixed in the recruiter or candidate screens, if you have one.]

## 🔁 Follow-up questions

### What causes a component to re-render?

Its own state changes, its parent re-renders, or a context it reads changes. Props changing is really "the parent re-rendered with new props". See [useEffect](topic:react/use-effect) for how effects relate to renders.

### Does a re-render always update the real DOM?

No. React re-runs the component and compares the result with the last one. It only changes the DOM where something is different. But the comparison itself costs time.

### When does React.memo NOT help?

When the props really change every time, or when you pass new objects or functions each render. Then memo compares and re-renders anyway, so it only adds cost.

### What about Redux?

`useSelector` re-renders the component when the selected value changes. If the selector returns a new object every time, it re-renders always. Select only the fields you need, or use a memoised selector (`createSelector`).

## ✅ Quick check

### 1. A child is wrapped in `React.memo`, but the parent passes `style={{ color: 'red' }}`. Does the child skip re-renders?

:::answer
**No.** `{ color: 'red' }` is a new object every render, so memo sees a "changed" prop. Move the object outside the component or use `useMemo`.
:::

### 2. Which tool tells you WHY a component rendered?

- A) The Network tab
- B) The React DevTools Profiler
- C) Lighthouse

:::answer
**B.** With "Record why each component rendered" turned on.
:::

### 3. True or false: you should wrap every component in `React.memo` to be safe.

:::answer
**False.** Memo has its own cost. Use it where the Profiler shows a real problem.
:::
