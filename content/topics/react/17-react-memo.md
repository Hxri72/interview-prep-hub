---
title: React.memo
stack: react
order: 17
level: Intermediate
mustKnow: true
askedFrequency: very common
summary:
  - React.memo wraps a component and skips its re-render when its props are the same as last time.
  - It compares each prop shallowly with Object.is — objects, arrays and functions must keep the same reference.
  - Pair it with useMemo/useCallback for object and function props, or it won't help.
  - It does not stop re-renders caused by the component's own state or a context it reads.
  - Use it for components that render often with the same props and are costly to render, like rows in a big list.
cards:
  - q: What does React.memo do?
    a: It makes a component skip re-rendering when its parent re-renders with the same props (compared shallowly).
  - q: Why can React.memo fail to prevent re-renders?
    a: A prop is a new object, array or function each render, so the shallow comparison sees a change.
  - q: Does React.memo stop re-renders from the component's own state or context?
    a: No. It only checks props coming from the parent.
  - q: What is the second argument of React.memo?
    a: An optional compare function (prevProps, nextProps) that returns true when the props should be treated as equal.
  - q: When should you NOT use React.memo?
    a: For cheap components, or ones whose props change on almost every render. The comparison then costs time and saves nothing.
---

## 💡 What is it?

By default, when a parent re-renders, **every child re-renders too**. This happens even if the child gets exactly the same [props](glossary:props).

`React.memo` wraps a [component](glossary:component). Before rendering it, React checks: **"Are the props the same as last time?"** If yes, React **skips** rendering it and reuses the last result.

## 🏠 Real-life example

Think of **a school photo day**.

Every time the photographer reshoots the class, one student says: "I'm wearing the **same clothes** and sitting in the **same seat**. Just reuse my old photo."

The photographer checks quickly. If everything matches, they **paste the old photo**. If one thing changed, like a new jacket, they take a new photo.

- **The photographer** = React.
- **Reshooting the class** = the parent re-rendering.
- **The student who asks to reuse the photo** = a component wrapped in `React.memo`.
- **Same clothes, same seat** = the same props.
- **A new jacket** = a changed prop, so the child renders again.

## 🧑‍💻 Code example

Paste this into `src/App.jsx` of a Vite React app. Open the browser console.

```jsx
import { memo, useCallback, useState } from 'react';                        // bring in what we need

const CandidateRow = memo(function CandidateRow({ name, onSelect }) {       // a row component, wrapped in memo
  console.log('rendered row:', name);                                       // shows when this row really renders
  return <li onClick={() => onSelect(name)}>{name}</li>;                    // a clickable list item
});                                                                         // end of CandidateRow

export default function App() {                                             // the parent
  const [selected, setSelected] = useState('');                             // which name is selected; starts empty
  const names = ['Anu', 'Arjun', 'Hari'];                                   // three rows

  const handleSelect = useCallback((name) => setSelected(name), []);        // the same function every render ([] = never changes)

  return (                                                                  // what App draws
    <main>                                                                  {/* a wrapper */}
      <p>Selected: {selected || 'none'}</p>                                 {/* shows the selected name */}
      <ul>                                                                  {/* the list */}
        {names.map((n) => (                                                 // one row per name
          <CandidateRow key={n} name={n} onSelect={handleSelect} />         // same name + same function → memo can skip
        ))}                                                                 {/* end of the map */}
      </ul>                                                                 {/* end of the list */}
    </main>                                                                 // end of the wrapper
  );                                                                        // end of what App returns
}                                                                           // end of App
```

**What the console shows:**

```text
On load:        rendered row: Anu, rendered row: Arjun, rendered row: Hari
Click "Hari":   (nothing) — App re-rendered, but every row's props were the same
```

Now remove `useCallback` and write `onSelect={(name) => setSelected(name)}`. Click again. **All three rows render again**, because each one gets a brand-new function.

## 🔍 Deeper version

**How it compares.** `React.memo` does a **shallow comparison**. For each prop it checks `Object.is(oldValue, newValue)`:

| Prop type | Same if… |
|---|---|
| string, number, boolean | the value is equal (`'Hari' === 'Hari'`) |
| object, array, function | it is the **same reference** (the same object in memory) |

So `style={{ color: 'red' }}`, `items={[1, 2]}` and `onClick={() => …}` are **new every render**, and memo never skips. Fix them with [useMemo / useCallback](topic:react/use-memo-use-callback), or move constants outside the component.

**What memo does NOT block:**
- the component's **own state** changes
- a **context** it reads (`useContext`) changes
- a custom hook inside it updating state

**The custom compare function.** The second argument lets you decide equality yourself:

```jsx
const Row = memo(RowComponent, (prev, next) => prev.candidate.id === next.candidate.id); // treat rows with the same id as equal
```

Be careful: if you ignore a prop that is used for display, the screen shows **old** data.

**The `children` trap.** `<MemoCard><p>Hi</p></MemoCard>` creates new JSX for `children` on every render, so `MemoCard` re-renders anyway.

**Where it really pays off:**
- rows in a long list, when one row changes
- heavy charts or editors inside a page that re-renders often
- components under a parent that updates on every keystroke

For very long lists, **virtualisation** helps even more. See [slow long list](topic:debugging/slow-long-list).

**Measure first.** Use the React DevTools Profiler to see which components re-render and how long they take. See [unnecessary re-renders](topic:debugging/unnecessary-re-renders).

:::version[Version note]
**React Compiler 1.0** can memoise components automatically, so many apps that use it don't need manual `React.memo`. Without the compiler, `React.memo` is still the standard tool.
:::

## 🎯 Why do we use it?

- **To skip expensive child renders** when a parent updates for an unrelated reason.
- **To keep big lists smooth**, so changing one row doesn't redraw all of them.
- **To fix the classic "component re-renders unnecessarily" problem** once the Profiler shows it matters.

## ⚠️ Common mistakes

- **Passing inline objects or functions** to a memo component. It re-renders every time anyway.
- **Wrapping every component.** For cheap components, the comparison costs more than it saves.
- **A custom compare function that ignores displayed props.** The UI then shows stale data.
- **Expecting memo to stop context or state updates.** It only checks props from the parent.

## 🗣️ How to answer in an interview

> "React.memo wraps a component so it skips re-rendering when its parent re-renders with the same props. It compares each prop shallowly with Object.is. So primitives compare by value, but objects, arrays and functions compare by reference.
>
> That's why memo often 'doesn't work': the parent passes an inline function or object, which is new on every render. I fix that with useCallback or useMemo, or by moving constants out of the component. Memo also doesn't stop re-renders from the component's own state or from a context it reads.
>
> I use it where the Profiler shows a real cost — list rows, heavy widgets, or children of components that update on every keystroke. I don't wrap everything, because the comparison has its own cost."

[FILL IN: a real component you wrapped in React.memo, if any.]

## 🔁 Follow-up questions

### What is the difference between React.memo and useMemo?

`React.memo` wraps a **component** and skips its whole render. `useMemo` caches a **value** inside a component.

### Why does my memoised component still re-render?

One of its props is a new reference each render (inline object, array or function, or JSX `children`). Or its own state or a context it reads changed.

### Is React.memo the same as PureComponent?

They are similar. `PureComponent` was the class-component version: it shallowly compares props **and state**. `React.memo` is for function components and compares props only.

### Should every list row be memoised?

Only if rows are costly or the list is big and re-renders often. For thousands of rows, use virtualisation, so only the visible rows render at all.

## ✅ Quick check

### 1. A memo child gets `config={{ size: 'lg' }}`. Does it skip re-rendering when the parent re-renders?

:::answer
**No.** The object is created again on every render, so it's a new reference each time. Move it outside the component or wrap it in `useMemo`.
:::

### 2. A memo component calls `useContext(ThemeContext)`. The theme changes. Does it re-render?

:::answer
**Yes.** `React.memo` only checks props from the parent. A context change still re-renders every component that reads it.
:::
