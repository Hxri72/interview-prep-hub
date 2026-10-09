---
title: Typing in a search box feels slow
template: scenario
stack: debugging
order: 5
level: Intermediate
mustKnow: false
askedFrequency: common
summary:
  - "Detect: letters appear late while typing; the Profiler shows a big tree re-rendering on every key press, or the Network tab shows one API call per letter."
  - "Fix 1: debounce the API call (wait ~300–500 ms after the user stops typing)."
  - "Fix 2: keep the input's state local, so only the small input re-renders on each key press."
  - "Fix 3: useDeferredValue or useTransition, so heavy results update at low priority and typing stays smooth."
  - Also cancel old requests so results don't arrive in the wrong order.
cards:
  - q: Why does typing feel slow in a search box?
    a: Each key press causes heavy work — a big component tree re-renders, or an API call fires for every letter.
  - q: What is debouncing?
    a: Waiting until the user stops typing for a short time (like 300 ms) and then doing the work once, instead of on every key press.
  - q: What does useDeferredValue do?
    a: It gives you a "lagging" copy of a value. React updates the input immediately and re-renders the heavy part with the deferred value at a lower priority.
  - q: Why keep search input state local?
    a: If the text lives high in the tree, every key press re-renders the whole page. Local state re-renders only the input.
  - q: Debounce vs useDeferredValue?
    a: Debounce reduces how OFTEN work happens (good for API calls). useDeferredValue keeps typing smooth while heavy rendering happens (good for client-side filtering).
---

## 💡 What is it?

The symptom: the user types in a search box. The letters **appear late**, or the cursor freezes for a moment.

Two common causes:
1. Every key press **re-renders a big part of the page**.
2. Every key press **calls the API**.

## 🏠 Real-life example

Think of **asking a shopkeeper for something** while you are still deciding.

You say "s", and he runs to the back. You say "so", and he runs again. You say "soap", and he runs again. He is tired, and you wait each time.

A smart shopkeeper **waits until you finish speaking**, then goes once.

- **Each letter you say** = each key press.
- **Running to the back** = an API call or a heavy re-render.
- **Waiting until you finish** = debounce.
- **Nodding immediately while you talk** = the input updating right away (local state, `useDeferredValue`).

## 🔎 Detect

1. Type quickly in the box. Do letters lag behind your fingers?
2. Open the **Network** tab. Type "react". Do you see **5 requests**, one per letter?
3. Open the **React Profiler** and record while typing. Does a **big tree** (the whole page or a long list) render on each key press?

## 🐞 Debug

| What you find | Cause |
|---|---|
| One request per letter | No debounce on the API call |
| The whole page renders per key press | Search text state lives too high (page or Redux) |
| A big list re-filters on every key press | Heavy filtering inside render, without priority control |
| Old results appear after new ones | A race condition — see [search race condition](topic:debugging/search-race-condition) |

## 🔧 Fix

**Fix 1 — debounce the API call.** This part runs in plain Node, so you can test the idea. Save it as `debounce.js` and run `node debounce.js`.

```js
function debounce(fn, delay) {                       // wraps fn so it runs only after a pause
  let timerId;                                       // remembers the pending timer (a closure)
  return (...args) => {                              // the new function we call on every key press
    clearTimeout(timerId);                           // cancel the previous waiting call
    timerId = setTimeout(() => fn(...args), delay);  // start a fresh wait of `delay` milliseconds
  };                                                 // end of the returned function
}                                                    // end of debounce

const search = (text) => console.log('API call for:', text); // pretend this calls the server
const debouncedSearch = debounce(search, 300);       // wait 300 ms after the last key press

['r', 're', 'rea', 'reac', 'react'].forEach((text, i) => { // simulate 5 quick key presses
  setTimeout(() => debouncedSearch(text), i * 50);   // one key press every 50 ms
});                                                  // end of the simulation
```

**Output:**

```text
API call for: react
```

Only **one** API call, with the final text.

**Fix 2 and 3 — keep typing smooth in React.** Paste into a Vite React app.

```jsx
import { useDeferredValue, useMemo, useState } from 'react';     // React 18+ hooks

function Results({ query, items }) {                             // the heavy part of the page
  const filtered = useMemo(                                      // re-filter only when inputs change
    () => items.filter((x) => x.toLowerCase().includes(query.toLowerCase())), // the slow filtering work
    [query, items],                                              // dependencies of the calculation
  );                                                             // end of useMemo
  return <ul>{filtered.map((x) => <li key={x}>{x}</li>)}</ul>;   // draw the matching items
}                                                                // end of Results

export default function Search({ items }) {                      // the search box + results
  const [text, setText] = useState('');                          // LOCAL state: what the user typed
  const deferredText = useDeferredValue(text);                   // a "lagging" copy for the heavy part
  return (                                                       // what to draw
    <>                                                           {/* wrapper with no extra HTML */}
      <input value={text} onChange={(e) => setText(e.target.value)} /> {/* updates instantly */}
      <Results query={deferredText} items={items} />             {/* updates at lower priority */}
    </>                                                          // end of the wrapper
  );                                                             // end of what to draw
}                                                                // end of Search
```

`useDeferredValue` lets React update the input first. The heavy list catches up a moment later, without blocking typing.

## 🛡️ Prevent

- Put debounce on **every search box that calls an API**. A reusable hook (like `useDebouncedValue`) keeps it consistent.
- Keep **input state local**. Only lift the final value up when needed.
- **Cancel old requests** with `AbortController`, so slow old answers can't overwrite new ones.
- Test search with **large data**, not 5 sample items.

## 🗣️ How to answer in an interview

> **Short version:** "I'd check the Network tab and the Profiler. If an API call fires on every key press, I debounce it, around 300 to 500 ms. If a big tree re-renders on every key press, I keep the input state local and use useDeferredValue or useTransition for the heavy results. I also cancel old requests."
>
> **Full version:** "First I type quickly and watch the Network tab and the React Profiler. If I see one request per letter, I debounce the call, so it fires once after the user stops typing. If the whole page re-renders per letter, the search text probably lives too high, like in the page or in Redux. I move it down into the input component. If filtering a big list is heavy, I use useDeferredValue, so the input stays instant and the list updates at lower priority. I also abort old requests with AbortController, so results don't come back in the wrong order. Then I profile again to confirm typing is smooth."

At SkillKeepr, search boxes on list pages are debounced before calling the API. [FILL IN: confirm the delay you used and one screen where you worked on this.]

## 🔁 Follow-up questions

### Debounce vs throttle?

Debounce waits for a pause, then runs once. Throttle runs at most once every X ms, even while the user keeps going. Search uses debounce. Scroll and resize handlers often use throttle. See [debounce and throttle](topic:javascript/debounce-throttle).

### What is useTransition?

It marks a state update as "not urgent". React keeps the input responsive and does the heavy update in the background. `useDeferredValue` is similar, but you apply it to a value instead of an update.

### How long should the debounce delay be?

Usually 250–500 ms. Too short still sends many calls. Too long feels unresponsive.

### Should the debounced search value live in Redux?

Only the final value, if other parts of the app need it. The raw typing state should stay local.

## ✅ Quick check

### 1. A user types "node" quickly. Without debounce, how many API calls fire?

:::answer
**4** — one for "n", "no", "nod" and "node".
:::

### 2. Which hook keeps the input instant while a heavy list updates later?

- A) `useEffect`
- B) `useDeferredValue`
- C) `useRef`

:::answer
**B.** It gives the heavy part a lower-priority copy of the value.
:::

### 3. True or false: debouncing also fixes results arriving in the wrong order.

:::answer
**False.** It reduces the number of calls, but two calls can still race. Cancel old requests with `AbortController` or ignore stale responses.
:::
