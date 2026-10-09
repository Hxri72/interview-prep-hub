---
title: useTransition and useDeferredValue
stack: react
order: 32
level: Advanced
mustKnow: false
askedFrequency: sometimes
summary:
  - Both hooks mark some updates as "not urgent", so urgent ones (like typing) stay fast.
  - "useTransition gives you startTransition(fn) and isPending. Wrap the slow state update inside startTransition."
  - "useDeferredValue gives you a lagging copy of a value. Use it when you don't control the state update, e.g. a prop."
  - React can pause and throw away a non-urgent render if a new urgent update arrives.
  - They don't make slow code faster, and they are not debounce. They only change what React does first.
cards:
  - q: What problem do useTransition and useDeferredValue solve?
    a: A heavy update (like filtering a big list) can make typing feel slow. These hooks mark that update as non-urgent, so React keeps the input responsive and renders the heavy part afterwards.
  - q: useTransition vs useDeferredValue?
    a: useTransition wraps the state update you control (startTransition(() => setX(...))). useDeferredValue gives a delayed copy of a value you may not control, like a prop.
  - q: What is isPending?
    a: A boolean from useTransition that is true while the non-urgent update is still rendering. Use it to show a small spinner or dim old results.
  - q: Is useDeferredValue the same as debounce?
    a: No. Debounce waits a fixed time. useDeferredValue has no fixed delay; React renders the deferred value as soon as it can, and drops stale renders. Debounce is still better for limiting API calls.
  - q: Can you put a controlled input's setState inside startTransition?
    a: No. The input's own value must update urgently, or typing becomes laggy and broken. Keep the input update outside, and put only the heavy update in the transition.
---

## 💡 What is it?

Some updates are **urgent**: the letter you just typed must appear at once. Others can **wait a little**: a big list of search results.

`useTransition` and `useDeferredValue` are React [hooks](glossary:hook) that mark updates as **not urgent**. React then keeps the urgent things fast and does the slow work after.

They are part of React's **concurrent rendering**. That means React can pause a slow render and start a more important one.

## 🏠 Real-life example

Think of a **school canteen at lunch time**.

A teacher asks for a cup of tea. A student orders 200 sandwiches for a class party. The canteen makes the **tea first**, because it is quick and the teacher is waiting. The sandwiches are made **after**. If the student changes the order halfway, the canteen **stops** the old order and starts the new one.

- The **cup of tea** = the urgent update (the letter you typed).
- The **200 sandwiches** = the non-urgent update (filtering a big list).
- **Making tea first** = React keeping the input responsive.
- **Stopping the old order** = React throwing away a stale render.
- **"Order in progress" sign** = `isPending`.

## 🧑‍💻 Code example

Paste into `src/App.jsx` of a Vite React app (`npm create vite@latest`, pick React). Run `npm run dev`, then type fast in the box.

```jsx
import { memo, useDeferredValue, useState } from 'react';          // the hooks and memo we need

const names = Array.from({ length: 20000 }, (_, i) => `Candidate ${i}`); // 20,000 fake names

const Results = memo(function Results({ query }) {                 // memo: re-render only when query changes
  const list = names.filter((n) => n.includes(query));             // slow part: filter 20,000 names
  return <ul>{list.slice(0, 200).map((n) => <li key={n}>{n}</li>)}</ul>; // show the first 200 matches
});                                                                // end of Results

export default function App() {                                    // the main component
  const [query, setQuery] = useState('');                          // what the user typed (urgent)
  const deferredQuery = useDeferredValue(query);                   // a copy of query that may lag behind
  const isStale = query !== deferredQuery;                         // true while the list is catching up
  return (                                                         // what App draws
    <div>                                                          {/* a wrapper */}
      <input value={query} onChange={(e) => setQuery(e.target.value)} /> {/* typing updates at once */}
      <div style={{ opacity: isStale ? 0.5 : 1 }}>                 {/* dim old results while updating */}
        <Results query={deferredQuery} />                          {/* the heavy list uses the lagging copy */}
      </div>                                                       {/* end of the results box */}
    </div>                                                         // end of wrapper
  );                                                               // end of return
}                                                                  // end of App
```

**What you see:**

```text
Typing stays smooth. The letters appear at once.
The results list follows a moment later, dimmed while it catches up.
Without useDeferredValue (pass `query` instead), each key press
waits for the 20,000-name filter, and typing feels sticky.
```

## 🔍 Deeper version

**`useTransition`:**

```jsx
const [isPending, startTransition] = useTransition();     // isPending = is the transition still running?
function selectTab(tab) {                                 // called when the user clicks a tab
  startTransition(() => {                                 // everything inside is non-urgent
    setTab(tab);                                          // the heavy tab content renders later
  });                                                     // end of the transition
}                                                         // end of selectTab
```

- Use it when **you control the state update**.
- `isPending` is `true` until the new screen is ready. Show a small spinner, and keep the old content visible.
- React 19 allows **async functions** inside `startTransition`. These are "Actions", useful for form submits.

**`useDeferredValue`:**
- Use it when you **receive a value**, for example a prop or state from another component, and can't wrap its update.
- It returns the **old value** first, then re-renders in the background with the new one.
- React 19 added an optional **initial value**: `useDeferredValue(value, initialValue)`.

**Important rules:**
- The **heavy component must be memoised** (`memo`). Otherwise it re-renders with the urgent update anyway, and you gain nothing.
- **Don't** put a controlled input's own state update inside `startTransition`. The input must update urgently.
- They don't make your code faster. They only **change the order** and let React **drop stale work**. If the filter itself is slow, also make it faster: index the data, paginate, or move the work to the server.

**Compared with debounce:**

| | debounce | useDeferredValue / useTransition |
|---|---|---|
| Delay | fixed (e.g. 300 ms) | none; as soon as React can |
| Stale work | not started | started, but thrown away if outdated |
| Best for | limiting **API calls** | keeping **heavy rendering** smooth |

Often you use **both**: debounce the API call, and defer the heavy rendering. See [slow search typing](topic:debugging/slow-search-typing) and [debounce](topic:javascript/debounce-throttle).

## 🎯 Why do we use it?

Before concurrent rendering, every update was equally urgent. A big render blocked the main thread, so key presses and clicks felt frozen.

These hooks let you tell React **what matters first**. The app feels responsive even when there's heavy work to do.

## ⚠️ Common mistakes

- **Forgetting `memo` on the heavy child.** The deferred value then gives no benefit.
- **Wrapping the input's own `setState` in `startTransition`.** Typing becomes laggy and jumpy.
- **Using them instead of fixing slow code.** They hide the slowness, but don't remove it.
- **Using them to limit API calls.** That's what debounce or a data library is for.

## 🗣️ How to answer in an interview

> "useTransition and useDeferredValue are concurrent features that mark some updates as non-urgent. useTransition gives me startTransition and isPending. I wrap the heavy state update, like switching to a big tab, and show a small loading hint with isPending. useDeferredValue gives me a lagging copy of a value. I use it when I don't control the update, like a search query prop, and pass the deferred value to a memoised heavy list.
>
> The input stays fast, and React renders the heavy part after. It can also throw away stale renders. They don't make code faster and they're not debounce. For API calls I still debounce, and if the work itself is slow, I fix it with pagination or virtualisation."

## 🔁 Follow-up questions

### When would you choose `useTransition` over `useDeferredValue`?

When you own the `setState` call, like a tab click or a filter change. Choose `useDeferredValue` when the value arrives from props or from a hook you don't control.

### Why does the heavy child need `memo`?

Without `memo`, the child re-renders during the urgent update too, because its parent re-rendered. With `memo`, it only re-renders when the deferred value changes, which happens in the background.

### Do transitions work with `Suspense`?

Yes. Inside a transition, React keeps showing the old screen instead of jumping to a `Suspense` fallback. This avoids the page flashing a spinner.

### What happens if the user types again during a deferred render?

React stops the old background render and starts a new one with the latest value. Stale results are never shown.

## ✅ Quick check

### 1. You wrapped a list in `useDeferredValue`, but typing is still slow. The list component is NOT wrapped in `memo`. Why is it still slow?

:::answer
Without `memo`, the list re-renders on every urgent update too, because its parent re-renders. So the heavy work still runs on each key press. Wrap the list in `memo`.
:::

### 2. Which is the best tool to stop sending an API request on every key press?

- A) `useTransition`
- B) `useDeferredValue`
- C) Debounce

:::answer
**C) Debounce.** The two hooks control **rendering**, not network calls. Debounce waits until the user stops typing before calling the API.
:::
