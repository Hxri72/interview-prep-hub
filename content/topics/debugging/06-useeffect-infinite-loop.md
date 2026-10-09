---
title: useEffect runs in an infinite loop
template: scenario
stack: debugging
order: 6
level: Intermediate
mustKnow: true
askedFrequency: very common
summary:
  - "Detect: the same API call repeats nonstop in the Network tab, the CPU fan spins, or React warns \"Maximum update depth exceeded\"."
  - "Debug: log inside the effect and check the dependency array for objects, arrays or functions created during render, or state the effect itself sets."
  - "Fix: correct dependencies, use primitive values (ids) as deps, useMemo/useCallback for objects and functions, never set state that is also a dependency."
  - "Prevent: keep the react-hooks/exhaustive-deps lint rule on, and prefer a data-fetching library for API calls."
cards:
  - q: What usually causes a useEffect infinite loop?
    a: The effect sets state that is also in its dependency array, or a dependency is an object, array or function that is re-created on every render.
  - q: "Why does useEffect(fn, [filters]) loop when filters = { status: 'open' } is written inside the component?"
    a: That object is new on every render. React compares dependencies by reference, so it looks "changed" every time, and the effect runs again after every render.
  - q: How do you fix an object dependency?
    a: Depend on primitive values instead (filters.status), move the object outside the component, or wrap it in useMemo.
  - q: How do you see an infinite loop quickly?
    a: The Network tab shows the same request repeating nonstop; a console.log inside the effect prints again and again; React may throw "Maximum update depth exceeded".
  - q: Which lint rule helps here?
    a: react-hooks/exhaustive-deps. It warns about missing dependencies and about objects or functions that change every render.
---

## 💡 What is it?

The symptom: a page keeps **calling the same API again and again**. The browser gets slow. The laptop fan spins. Sometimes React shows **"Maximum update depth exceeded"**.

The cause is almost always a [useEffect](topic:react/use-effect) that triggers itself. It runs, changes something, and that change makes it run again.

## 🏠 Real-life example

Think of a **student whose rule is: "Whenever my notebook changes, I copy it into a new notebook."**

Copying makes a **new** notebook. A new notebook counts as a "change". So the student copies again. And again. Forever.

- **The rule "whenever X changes, do this"** = `useEffect` with a dependency array.
- **Copying into a new notebook** = `setState` with a new object or array.
- **The new notebook counting as a change** = React comparing by reference.
- **Breaking the loop** = only reacting to the things that really changed (the right dependencies).

## 🔎 Detect

1. Open the **Network** tab. Is the same request repeating nonstop?
2. Look at the **console**. Is there a "Maximum update depth exceeded" error?
3. Add `console.log('effect ran')` inside the effect. Does it print without stopping?

## 🐞 Debug

Look at the **dependency array** and the **state the effect sets**:

| Pattern | Why it loops |
|---|---|
| The effect sets `data`, and `data` is in the deps | Setting it triggers the effect again |
| A dep is an object/array made in render: `const filters = { status }` | A new reference every render → always "changed" |
| A dep is a function made in render: `const load = () => {...}` | Same: a new function every render |
| No dependency array at all, plus `setState` inside | Runs after every render, and each run causes a render |

Tip: React compares dependencies with `Object.is`. Numbers and strings compare by value. Objects, arrays and functions compare by **reference**.

## 🔧 Fix

**Before (loops forever):**

```jsx
import { useEffect, useState } from 'react';                         // React hooks

export default function Jobs({ status }) {                           // status comes from the parent, e.g. 'open'
  const [jobs, setJobs] = useState([]);                              // the list of jobs
  const filters = { status };                                        // a NEW object on every render
  useEffect(() => {                                                  // runs after render
    fetch(`/api/jobs?status=${filters.status}`)                      // ask the API for jobs
      .then((res) => res.json())                                     // turn the reply into JSON
      .then((data) => setJobs(data));                                // new state → re-render → new filters object
  }, [filters]);                                                     // filters is "different" every time → loop
  return <p>{jobs.length} jobs</p>;                                  // show how many jobs
}                                                                    // end of Jobs
```

**After (runs only when `status` really changes):**

```jsx
import { useEffect, useState } from 'react';                         // React hooks

export default function Jobs({ status }) {                           // status = a plain string
  const [jobs, setJobs] = useState([]);                              // the list of jobs
  useEffect(() => {                                                  // runs after render
    const controller = new AbortController();                       // lets us cancel this request later
    fetch(`/api/jobs?status=${status}`, { signal: controller.signal }) // use the primitive value directly
      .then((res) => res.json())                                     // turn the reply into JSON
      .then((data) => setJobs(data))                                 // save the jobs
      .catch((err) => {                                              // runs on error or cancel
        if (err.name !== 'AbortError') console.error(err);           // ignore our own cancels
      });                                                            // end of the fetch chain
    return () => controller.abort();                                 // cleanup: cancel if status changes
  }, [status]);                                                      // a string compares by value → no loop
  return <p>{jobs.length} jobs</p>;                                  // show how many jobs
}                                                                    // end of Jobs
```

**Other fixes, by pattern:**
- Need an object as a dependency? Wrap it: `const filters = useMemo(() => ({ status }), [status]);`
- Need a function? Define it **inside** the effect, or wrap it in `useCallback`.
- Setting state from its own old value? Use the updater form `setCount((c) => c + 1)`, and leave `count` out of the dependencies.

## 🛡️ Prevent

- Keep the **`react-hooks/exhaustive-deps`** ESLint rule on, and don't silence it.
- Prefer **primitive dependencies** (ids, strings, numbers).
- For data fetching, consider **TanStack Query**. It handles caching and refetching, so you write fewer effects.
- Ask "**Do I need an effect at all?**" Values you can calculate during render don't need one.

## 🗣️ How to answer in an interview

> **Short version:** "I'd log inside the effect and check the dependency array. Usually the effect sets state that's also a dependency, or a dependency is an object or function re-created each render. I fix the dependencies, use primitive values, or memoise with useMemo and useCallback. The exhaustive-deps lint rule helps prevent it."
>
> **Full version:** "First I confirm it: the Network tab shows the same call repeating, or React throws 'Maximum update depth exceeded'. Then I add a log in the effect and look at its dependency array. React compares dependencies by reference. So an object like `{ status }` created during render is new every time, and the effect re-runs after every render. Since the effect sets state, that causes another render, and it loops. I fix it by depending on the primitive value, like `status`, or by memoising the object with useMemo, or a function with useCallback. If the effect updates state from its old value, I use the updater form and remove that state from the dependencies. To prevent it, I keep the exhaustive-deps lint rule on, and for data fetching I prefer a library like TanStack Query."

[FILL IN: a real infinite-loop bug you hit in a SkillKeepr screen, if you have one.]

## 🔁 Follow-up questions

### Why does the effect run twice on the first load in development?

That's React StrictMode, not a loop. In development only, React mounts, cleans up and mounts again to test your cleanup. See [API called twice in development](topic:debugging/api-called-twice-dev).

### Is it ever OK to have no dependency array?

Rarely. Without one, the effect runs after every render. It's fine only for things that must run every time and don't set state.

### Can I just remove the dependency to stop the loop?

That hides the bug. The effect will then use stale values. Fix the real cause instead.

### How does `useCallback` help here?

It returns the **same function reference** between renders, as long as its own dependencies don't change. So an effect that depends on it won't re-run for no reason.

## ✅ Quick check

### 1. Does this loop forever?

```jsx
const [count, setCount] = useState(0);           // count starts at 0
useEffect(() => { setCount(count + 1); }, [count]); // depends on count, and changes count
```

:::answer
**Yes.** The effect changes `count`, and `count` is a dependency. Each change triggers the effect again.
:::

### 2. Which dependency is safe from reference problems?

- A) `[filters]` where `filters = { status }` is created in render
- B) `[status]` where `status` is a string
- C) `[load]` where `load = () => {}` is created in render

:::answer
**B.** Strings compare by value. A and C are new references on every render.
:::

### 3. True or false: an effect that runs twice on mount in development is always an infinite loop.

:::answer
**False.** That's StrictMode running effects twice on purpose, in development only.
:::
