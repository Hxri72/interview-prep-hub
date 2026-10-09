---
title: "Performance: Profiler and list virtualisation"
stack: react
order: 31
level: Advanced
mustKnow: true
askedFrequency: very common
summary:
  - Measure first. Use the React DevTools Profiler to see which components rendered, how long they took, and why.
  - Turn on "Highlight updates when components render" to spot components that re-render for no reason.
  - "For long lists, use virtualisation: only draw the rows on screen (react-window), or use server-side pagination."
  - Fix by cause — React.memo, useMemo/useCallback, moving state down, splitting context, code splitting — and then profile again.
  - Don't add memo everywhere. It has a cost; use it where the Profiler shows a real problem.
cards:
  - q: How do you find out why a React page is slow?
    a: Record the interaction in the React DevTools Profiler. It shows which components rendered, how long each took, and (with the setting on) why each one rendered.
  - q: What is list virtualisation?
    a: Drawing only the rows that are visible in the scroll area, plus a few extra, instead of all rows. A 10,000-row list then has only ~20 real DOM rows.
  - q: Which library do you use for virtualisation?
    a: react-window (v2 has a List component with rowComponent, rowCount and rowHeight), or TanStack Virtual. Server-side pagination is another option.
  - q: Should you wrap every component in React.memo?
    a: No. memo has a cost (comparing props). Use it where the Profiler shows a component re-rendering often with the same props and being slow.
  - q: What are the main causes of slow React UIs?
    a: Unneeded re-renders, very long lists, heavy calculations during render, a big JavaScript bundle, and slow network requests.
---

## 💡 What is it?

When a React page feels slow, you need to **find the cause before fixing it**.

The **React DevTools Profiler** is a tool in your browser. It records what React did and shows **which [components](glossary:component) [rendered](glossary:render), how long each took, and why**.

One common cause is a **very long list**. **Virtualisation** fixes it by drawing only the rows you can see.

## 🏠 Real-life example

**Profiler:** think of a **school sports day video**. The PE teacher records the relay race. Then they replay it slowly to see **which runner was slow and why**. They don't guess.

- The **video recording** = recording in the Profiler.
- **Each runner's time** = how long each component took to render.
- **Why the runner was slow** = "why did this render?" (props changed, state changed, parent rendered).

**Virtualisation:** think of a **train window**. A train passes 1,000 trees, but through the window you only see about 10 at a time. Nobody builds all 1,000 trees inside the train.

- The **window** = the visible part of the list.
- The **trees you can see** = the rows React actually draws.
- **New trees appearing as you move** = rows drawn as you scroll.

## 🧑‍💻 Code example

This is a list of 10,000 candidates, virtualised with **react-window v2**. In a Vite React app run `npm install react-window`, paste this into `src/App.jsx`, and run `npm run dev`.

```jsx
import { List } from 'react-window';                               // the virtualised list component (v2)

const candidates = Array.from({ length: 10000 }, (_, i) => ({      // make 10,000 fake candidates
  id: i,                                                           // a unique id for each one
  name: `Candidate ${i + 1}`,                                      // a name like "Candidate 1"
}));                                                               // end of the fake data

function Row({ index, style, items }) {                            // draws ONE row; react-window gives index + style
  return (                                                         // what one row looks like
    <div style={style}>                                            {/* style = the row's position; you must use it */}
      {items[index].name}                                          {/* the candidate's name for this row */}
    </div>                                                         // end of the row
  );                                                               // end of return
}                                                                  // end of Row

export default function App() {                                    // the main component
  return (                                                         // what App draws
    <List                                                          // only draws the visible rows
      rowComponent={Row}                                           // the component used for each row
      rowCount={candidates.length}                                 // how many rows in total: 10,000
      rowHeight={36}                                               // each row is 36px tall
      rowProps={{ items: candidates }}                             // extra props passed to every Row
      style={{ height: 400 }}                                      // the visible area is 400px tall
    />                                                             // end of List
  );                                                               // end of return
}                                                                  // end of App
```

**What you see** (open DevTools → Elements):

```text
The list scrolls smoothly through all 10,000 candidates.
Only about 15–20 row <div>s exist in the page at any time:
400px ÷ 36px ≈ 11 visible rows, plus a few extra (overscan).
```

## 🔍 Deeper version

**Step 1 — See it.** In React DevTools → ⚙️ Settings, turn on **"Highlight updates when components render"**. Every component that re-renders flashes. If something flashes when its data didn't change, that's a clue.

**Step 2 — Measure it.** Open the **Profiler** tab, turn on **"Record why each component rendered"**, click record, do the slow action, then stop.
- The **flamegraph** shows the component tree for one commit, coloured by render time.
- The **ranked chart** lists the slowest components first.
- Each component shows **why** it rendered: props changed, state changed, a hook changed, or the parent rendered.

**Step 3 — Fix by cause:**

| Cause found | Fix |
|---|---|
| Parent re-renders, child gets the same props | `React.memo` on the child |
| A new object or function is passed as a prop on every render | `useMemo` / `useCallback`, or move it outside the component |
| A context value changes and every consumer re-renders | Split the context, memoise the value |
| State lives too high in the tree | Move the state down to where it's used |
| Expensive calculation on every render | `useMemo` |
| Thousands of list rows | Virtualise, or paginate on the server |
| Big first load | Code splitting with `React.lazy` + `Suspense` |
| Typing feels slow because results are heavy | `useDeferredValue` / `useTransition` |

**Step 4 — Check again.** Profile the same action. The render count and time should go down.

**Virtualisation details:**
- react-window v2's `List` takes `rowComponent`, `rowCount`, `rowHeight` and `rowProps`. Your row **must** apply the `style` prop, because it holds the row's position.
- Variable row heights: pass a function to `rowHeight`, or use the dynamic height helpers.
- Trade-offs: the browser's Find (Ctrl+F) can't see rows that aren't drawn, and screen readers need the `ariaAttributes` that react-window gives each row.
- **Server-side pagination** is often simpler: load 20 or 50 rows per page from the API. It also saves network and memory. See [cursor vs offset pagination](topic:rest-auth/pagination-offset-cursor).

:::version[Version note]
**React Compiler 1.0** (released in late 2025) can add memoisation automatically at build time. Fewer manual `useMemo`/`useCallback`/`React.memo` calls are needed in projects that use it. The Profiler is still how you check the result.
:::

## 🎯 Why do we use it?

Guessing wastes time. You might add `React.memo` to ten components and fix nothing, because the real problem was a 5,000-row table. The Profiler shows the **real** cause in a few minutes.

Virtualisation keeps long lists fast. The browser only has to lay out and paint a few dozen rows instead of thousands.

## ⚠️ Common mistakes

- **Optimising without measuring.** Always profile first, and again after.
- **Wrapping everything in `React.memo`.** Comparing props has a cost, and it does nothing if props change every time.
- **Forgetting the `style` prop** in a virtualised row. The rows then stack on top of each other.
- **Profiling in development only.** Development builds are slower. Check important numbers on a production build too.

## 🗣️ How to answer in an interview

> "I always measure before fixing. First I turn on 'Highlight updates' in React DevTools to see what re-renders. Then I record the slow interaction in the Profiler, with 'record why each component rendered' turned on. That tells me which components are slow and why: props, state, context or the parent.
>
> Then I fix by cause. React.memo for a child that gets the same props, useCallback or useMemo for unstable props, moving state down, or splitting a context. For long lists I use virtualisation with react-window, so only the visible rows are drawn, or I paginate on the server. For a slow first load, I use code splitting. After the fix, I profile again to confirm the improvement. I don't add memo everywhere, because it has its own cost."

[FILL IN: one real performance problem you found in a React screen, if you have one. At SkillKeepr, list tables use server-side pagination.]

## 🔁 Follow-up questions

### What's the difference between the browser's Performance tab and the React Profiler?

The React Profiler shows React work: components and render times. The browser's Performance tab shows everything: JavaScript, layout, paint and long tasks. Use React's Profiler for re-render problems, and the Performance tab for anything else.

### Virtualisation or pagination?

Pagination is simpler and saves network and memory, and it works well for tables. Virtualisation feels like one smooth list, which suits feeds and long dropdowns. Many apps use server pagination plus a virtualised list inside each page.

### Does `React.memo` stop all re-renders?

No. It only skips a re-render when the props are shallowly equal. A component still re-renders when its own state changes, or when a context it uses changes.

### How do you make a 5,000-option dropdown fast?

Virtualise the options list, debounce the search box, and filter on the server if the data is large.

## ✅ Quick check

### 1. A list has 5,000 rows, and each row is a simple `<div>`. Scrolling is slow. Which fix helps most?

- A) Wrap each row in `React.memo`
- B) Virtualise the list
- C) Use `useCallback` for the click handler

:::answer
**B.** The problem is too many DOM rows. Virtualisation draws only the visible ~20 rows. memo and useCallback don't reduce the number of rows.
:::

### 2. In react-window v2, why must your row component use the `style` prop?

:::answer
The `style` prop holds each row's **position and size**. Without it, all visible rows render at the top and overlap.
:::
