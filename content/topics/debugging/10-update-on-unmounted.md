---
title: State update on an unmounted component
template: scenario
stack: debugging
order: 10
level: Intermediate
mustKnow: false
askedFrequency: sometimes
summary:
  - "Symptom: an async call finishes after the component is gone, and it still tries to set state."
  - "Older React showed the warning \"Can't perform a React state update on an unmounted component\". React 18 removed it, but the bug pattern still matters."
  - "The real problem is wasted work and wrong data, like an old response landing on a new page."
  - "Fix: cancel the work in the useEffect cleanup — abort the fetch with AbortController, or ignore late results with a flag."
  - "Prevent: every effect that starts async work should be able to cancel it."
cards:
  - q: Why did React show "Can't perform a React state update on an unmounted component"?
    a: An async task (fetch, timer, subscription) finished after the component was removed and called setState. React removed this warning in version 18, because it was often a false alarm.
  - q: If React 18 removed the warning, why fix anything?
    a: The request still runs for nothing, and its late result can show wrong data or trigger extra work. Cancelling it is cleaner and avoids race conditions.
  - q: What is the best fix for a fetch?
    a: Create an AbortController in the effect, pass its signal to fetch, and call controller.abort() in the cleanup.
  - q: What is the "ignore flag" fix?
    a: "Set let ignore = false in the effect, set ignore = true in the cleanup, and skip setState when ignore is true."
  - q: How does this relate to race conditions?
    a: It's the same cleanup. When the user switches quickly, the old request is cancelled, so an old answer can't overwrite the new one.
---

## 💡 What is it?

A [component](glossary:component) starts some slow work, like a `fetch`. Before it finishes, the user leaves the page. The component is removed ("unmounted").

Then the work finishes and calls `setState` on a component that **no longer exists**.

Older React showed this warning: *"Can't perform a React state update on an unmounted component."* **React 18 removed the warning.** But the pattern is still a bug: wasted work, and sometimes wrong data on screen.

## 🏠 Real-life example

Think of **ordering food to your classroom**.

You order lunch, then your class moves to another room. The delivery boy arrives at the old room and tries to hand the food to nobody. Or worse, he gives it to the next class, who didn't order it.

- **Ordering food** = starting a fetch.
- **Your class moving rooms** = the component unmounting.
- **The delivery arriving late** = the response arriving after unmount.
- **Giving it to the wrong class** = old data showing on a new screen.
- **Calling the shop to cancel the order** = `controller.abort()` in the cleanup.

## 🔎 Detect

- In **React 17 or older**, the console shows the "unmounted component" warning.
- In **React 18+**, there's no warning. You notice other signs:
  - The Network tab shows requests still finishing after you left the page.
  - Old data flashes on a new screen.
  - Errors in the console from code that ran "too late".

Reproduce it: open a page that loads data, and leave it **before** the data arrives. You can slow the network with DevTools → Network → **Slow 3G**.

## 🐞 Debug

1. Find the [effect](glossary:side-effect) or event handler that starts the async work.
2. Check its `useEffect`: is there a **cleanup** function? Does it cancel the work?
3. Add a `console.log` in the cleanup and in the `.then`. If the `.then` runs **after** the cleanup, you found it.
4. Check other async sources too: `setTimeout`, `setInterval`, WebSocket messages, and subscriptions.

## 🔧 Fix

**Before — the request keeps going after the component is gone:**

```jsx
import { useEffect, useState } from 'react';                    // bring in React hooks

function CandidateProfile({ id }) {                             // shows one candidate; id comes from the parent
  const [candidate, setCandidate] = useState(null);             // null = not loaded yet
  useEffect(() => {                                             // runs after the component appears
    fetch(`/api/candidates/${id}`)                              // ❌ start a request that can't be cancelled
      .then((res) => res.json())                                // turn the reply into an object
      .then((data) => setCandidate(data));                      // ❌ may run after the component is gone
  }, [id]);                                                     // run again when id changes
  return <h2>{candidate?.name ?? 'Loading…'}</h2>;              // show the name, or a loading message
}                                                               // end of CandidateProfile
```

**After (best) — cancel the request in the cleanup:**

```jsx
import { useEffect, useState } from 'react';                    // bring in React hooks

function CandidateProfile({ id }) {                             // the same component, fixed
  const [candidate, setCandidate] = useState(null);             // null = not loaded yet
  useEffect(() => {                                             // runs after the component appears
    const controller = new AbortController();                   // a "cancel button" for this request
    fetch(`/api/candidates/${id}`, { signal: controller.signal }) // connect the request to the cancel button
      .then((res) => res.json())                                // turn the reply into an object
      .then((data) => setCandidate(data))                       // save it (only runs if not cancelled)
      .catch((err) => {                                         // runs on errors and on cancel
        if (err.name !== 'AbortError') console.error(err);      // a cancel is expected, so only log real errors
      });                                                       // end of the fetch chain
    return () => controller.abort();                            // ✅ cleanup: cancel when unmounting or when id changes
  }, [id]);                                                     // run again when id changes
  return <h2>{candidate?.name ?? 'Loading…'}</h2>;              // show the name, or a loading message
}                                                               // end of CandidateProfile
```

**After (when you can't cancel the work) — ignore late results:**

```jsx
useEffect(() => {                                               // runs after the component appears
  let ignore = false;                                           // false = we still want the result
  loadCandidate(id).then((data) => {                            // some async work we can't abort
    if (!ignore) setCandidate(data);                            // ✅ only save if this effect is still current
  });                                                           // end of then
  return () => { ignore = true; };                              // cleanup: from now on, ignore the result
}, [id]);                                                       // run again when id changes
```

## 🛡️ Prevent

- Make it a habit: **async work in an effect = a cleanup that cancels it.**
- Use a data-fetching library like TanStack Query (React Query). It handles cancelling, caching and late responses for you.
- Clear timers and close sockets in cleanups too.
- In reviews, look for `.then(setSomething)` inside effects with no cleanup.
- See [useEffect: dependencies and cleanup](topic:react/use-effect) and [The fetch API](topic:javascript/fetch-api).

## 🗣️ How to answer in an interview

**Short version (20 seconds):**

> "It happens when an async call finishes after the component unmounts and still calls setState. React 18 removed the warning, but it's still wasted work and can show stale data. I fix it by aborting the request in the useEffect cleanup with AbortController, or with an ignore flag when I can't cancel."

**Full version:**

> "The component starts a fetch, the user navigates away, and the response comes back later and calls setState on a component that's gone. React 17 warned about this. React 18 removed the warning, because the setState itself is harmless. But the request still wastes work, and the same pattern causes race conditions, where an old response overwrites newer data.
>
> To debug, I slow the network in DevTools and leave the page before the data arrives. Then I check whether the effect has a cleanup.
>
> The fix is to create an AbortController in the effect, pass its signal to fetch, and abort it in the cleanup. I ignore the AbortError in the catch. If the work can't be cancelled, I use an ignore flag that the cleanup sets to true.
>
> To prevent it, I make cancellation part of every async effect, or use React Query, which does it for me."

## 🔁 Follow-up questions

### Why did React 18 remove the warning?

It was often a false alarm. Many apps had no real leak, just a harmless late setState. The warning made people add awkward "isMounted" checks. React's team removed it and recommends proper cleanup instead.

### Is an "isMounted" flag a good fix?

It hides the symptom but doesn't stop the request. AbortController is better, because it stops the network work too. A flag is fine when the work truly can't be cancelled.

### How is this related to a search race condition?

It's the same tool. When the search text changes, the cleanup aborts the old request. So a slow old answer can't replace the new one. See [search race condition](topic:debugging/search-race-condition).

### What about a `setTimeout` in an effect?

Save its id and call `clearTimeout(id)` in the cleanup. Otherwise the callback runs after the component is gone.

## ✅ Quick check

### 1. In React 19, does this code print a warning when the component unmounts early?

```jsx
useEffect(() => {                                       // the effect
  fetch('/api/data').then((r) => r.json()).then(setData); // no cleanup
}, []);                                                 // run once
```

:::answer
**No warning** (React 18 removed it). But the request still finishes for nothing, and the setState runs on a removed component. Add an AbortController cleanup.
:::

### 2. What does `controller.abort()` cause in the fetch promise?

- A) It resolves with `null`
- B) It rejects with an error named `AbortError`
- C) Nothing happens

:::answer
**B.** The fetch promise rejects with an `AbortError`. That's why the `.catch` ignores errors with that name.
:::
