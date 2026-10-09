---
title: A 5,000-row list scrolls slowly
template: scenario
stack: debugging
order: 4
level: Intermediate
mustKnow: false
askedFrequency: common
summary:
  - "Detect: scrolling stutters; the Performance tab shows long tasks; the Profiler shows thousands of rows rendering."
  - "Debug: count DOM nodes and check if every row re-renders on each change."
  - "Fix: virtualise the list (render only visible rows, e.g. react-window), or paginate / infinite-scroll; stable keys; memoised rows."
  - "The real fix is usually: don't put 5,000 rows in the DOM at all."
  - "Prevent: server-side pagination by default for big tables."
cards:
  - q: Why is a 5,000-row list slow?
    a: The browser has to create, lay out and paint thousands of DOM elements, and React has to render and compare all of them on every update.
  - q: What is list virtualisation?
    a: Rendering only the rows that are visible on screen (plus a few extra). As you scroll, the same few DOM rows are reused with new data. Libraries like react-window do this.
  - q: Virtualisation vs pagination — when do you use which?
    a: Pagination when users browse page by page and the server can return small pages. Virtualisation when users need one long scrolling list, like a log or a chat.
  - q: Why do stable keys matter in long lists?
    a: With index keys, inserting or deleting an item shifts every key, so React re-renders and can mix up rows. Stable ids let React reuse the right rows.
  - q: Which tool shows "long tasks" during scrolling?
    a: The Chrome DevTools Performance tab. Long tasks (over 50 ms) are marked with red corners.
---

## 💡 What is it?

The symptom: a page shows a big list or table, for example **5,000 candidates**. Scrolling is **jumpy**. Clicking a row feels slow.

The cause is usually simple: there are **too many elements on the page** at the same time.

## 🏠 Real-life example

Think of a **school library with 5,000 books**.

A bad librarian puts **all 5,000 books on one giant table**. Finding anything is slow, and moving the table is impossible.

A good librarian keeps books on shelves and puts **only the 20 books you are looking at** on the table. When you move on, they swap them for the next 20.

- **5,000 books on one table** = 5,000 rows in the DOM.
- **Only 20 books on the table** = virtualisation (render only visible rows).
- **Shelves numbered 1, 2, 3** = pagination.
- **Each book's label** = the stable `key` for each row.

## 🔎 Detect

1. Scroll the list. Does it stutter or freeze?
2. Open the **Performance** tab in Chrome DevTools. Click record, scroll, stop. Look for **long tasks** (red-cornered blocks over 50 ms).
3. In the console, count the elements: `document.querySelectorAll('*').length`. Tens of thousands is a warning sign.
4. Open the **React Profiler** and record a scroll or a small change. Do all 5,000 rows render?

## 🐞 Debug

Check these questions:

| Question | If yes |
|---|---|
| Are all 5,000 rows in the DOM? | The list needs virtualisation or pagination |
| Does every row re-render when one thing changes? | Rows need `React.memo` and stable props |
| Are keys array indexes? | Use real ids instead |
| Does each row do heavy work (formatting, big images)? | Move work out of the row or memoise it |
| Did the API send all 5,000 at once? | The API needs pagination too |

## 🔧 Fix

The best fix: **don't render 5,000 rows**. Either paginate on the server, or virtualise.

**Before (slow):** every row becomes a real DOM element.

```jsx
export default function CandidateList({ candidates }) {         // candidates = an array of 5,000 objects
  return (                                                       // what to draw
    <ul style={{ height: 600, overflowY: 'auto' }}>              {/* a scrolling box 600px tall */}
      {candidates.map((c) => (                                   // loop over ALL 5,000 candidates
        <li key={c.id} style={{ height: 40 }}>{c.name}</li>      // 5,000 <li> elements in the DOM
      ))}                                                        {/* end of the loop */}
    </ul>                                                        // end of the scrolling box
  );                                                             // end of what to draw
}                                                                // end of CandidateList
```

**After (fast):** only about 15 rows exist at any time. Install with `npm install react-window`.

```jsx
import { List } from 'react-window';                             // a virtualised list component

function Row({ index, style, candidates }) {                     // react-window gives index + position style
  return <div style={style}>{candidates[index].name}</div>;      // style places the row at the right height
}                                                                // end of Row

export default function CandidateList({ candidates }) {          // the same 5,000 candidates
  return (                                                       // what to draw
    <List                                                        // renders only the visible rows
      rowComponent={Row}                                         // how to draw one row
      rowCount={candidates.length}                               // total rows = 5,000
      rowHeight={40}                                             // each row is 40px tall
      rowProps={{ candidates }}                                  // extra props passed to every row
      style={{ height: 600 }}                                    // the visible box is 600px → about 15 rows
    />                                                           // end of List
  );                                                             // end of what to draw
}                                                                // end of CandidateList
```

:::version[Version note]
This uses the **react-window v2** API (`List`, `rowComponent`, `rowProps`). Older tutorials use v1, which had `FixedSizeList` with `itemCount` and `itemSize`. The idea is the same.
:::

**Other fixes that help:**
- **Server-side pagination:** the API returns 25 rows per page. This also makes the API faster.
- **Infinite scroll:** load the next 50 rows when the user nears the bottom.
- **`React.memo` on rows** so typing in a filter box doesn't re-render every row. See [unnecessary re-renders](topic:debugging/unnecessary-re-renders).

## 🛡️ Prevent

- Make **server-side pagination the default** for any list that can grow.
- Test pages with **realistic data sizes** (thousands of rows), not 10 sample rows.
- Use stable `key`s (ids) in every list.
- Add a code-review check: "Can this list grow without limit?"

## 🗣️ How to answer in an interview

> **Short version:** "I'd profile the scroll in the Performance tab and the React Profiler. Usually every row is in the DOM and re-renders. The fix is virtualisation with something like react-window, so only visible rows render, or server-side pagination. I'd also use stable keys and memoised rows."
>
> **Full version:** "First I confirm it: I record a scroll in the Chrome Performance tab and look for long tasks. I also count DOM nodes and record in the React Profiler. With 5,000 rows, usually all of them are in the DOM and many re-render on every change. The main fix is to not render all of them. If users browse page by page, I paginate on the server. If they need one long scrolling list, I virtualise it with react-window, so only about 15 rows exist at a time. I also use stable ids as keys and wrap rows in React.memo. Then I profile again to confirm. To prevent it, server-side pagination is our default for lists that can grow."

[FILL IN: does a SkillKeepr table use server-side pagination (most list screens do)? Add one real example if you worked on one.]

## 🔁 Follow-up questions

### What are the downsides of virtualisation?

Browser "find in page" (Ctrl+F) only finds visible rows. Rows with different heights need extra measuring. Screen readers see fewer rows. It's also more code.

### Why not just add React.memo to every row?

It helps with re-renders, but the browser still has to create and lay out 5,000 DOM elements. Virtualisation fixes the DOM size itself.

### How would you do infinite scroll?

Use an `IntersectionObserver` on a small element at the bottom of the list. When it becomes visible, fetch the next page and append it. Use cursor-based pagination on the API.

### What is a "long task"?

Any JavaScript work that blocks the main thread for more than 50 ms. During it, the page can't respond to scrolling or clicks.

## ✅ Quick check

### 1. A list renders 5,000 `<li>` items. With virtualisation in a 600px box with 40px rows, about how many rows are in the DOM?

:::answer
**About 15** (600 ÷ 40), plus a few extra above and below for smooth scrolling.
:::

### 2. Which is better for a table that users browse 25 rows at a time?

- A) Virtualisation
- B) Server-side pagination
- C) Loading all rows and hiding most with CSS

:::answer
**B.** The API sends less data, and the page renders only 25 rows.
:::

### 3. True or false: `React.memo` alone fixes a slow 5,000-row list.

:::answer
**False.** It reduces re-renders, but all 5,000 DOM elements still exist. You need virtualisation or pagination.
:::
