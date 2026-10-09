---
title: An API call runs twice in development
template: scenario
stack: debugging
order: 17
level: Basic
mustKnow: false
askedFrequency: very common
summary:
  - "Symptom: in development, the Network tab shows the same API call twice when a page loads."
  - "Cause: React StrictMode mounts, cleans up and mounts every component again, in development only, to catch effects without proper cleanup."
  - "It does not happen in the production build — check with npm run build + preview."
  - "Fix: don't remove StrictMode; make the effect safe to run twice (abort in cleanup), or use a data library like TanStack Query."
  - "If it ALSO happens in production, it's a real bug: check dependencies, double renders of the parent, or two components fetching the same data."
cards:
  - q: Why does my useEffect run twice in development?
    a: React StrictMode (React 18+) mounts the component, runs the cleanup, and mounts it again, in development only. It does this to find effects that don't clean up properly.
  - q: Should you remove StrictMode to fix it?
    a: No. It only hides the symptom. Make the effect safe to run twice instead, for example by aborting the fetch in the cleanup.
  - q: How do you check it's only a development thing?
    a: Run the production build (npm run build, then npm run preview). If the call happens once there, it's StrictMode.
  - q: What should you check if it happens twice in production too?
    a: The effect's dependencies (an object or function that changes every render), the parent remounting the component (a changing key), or two components fetching the same data.
  - q: How do libraries like TanStack Query help?
    a: They cache requests and remove duplicates, so two requests for the same data at the same time become one network call.
---

## 💡 What is it?

You open a page in development. In the **Network tab**, the same API call appears **twice**. Your `console.log` inside `useEffect` also prints twice.

Most of the time this is **not a bug**. It's React's **StrictMode** doing a safety check, **only in development**.

## 🏠 Real-life example

Think of a **fire drill at school**.

The teacher says: "Leave the classroom, then come back in." It's not a real fire. It checks that everyone knows how to leave properly and switch off the lights. Real school days don't have this drill every morning.

- **The fire drill** = StrictMode mounting, cleaning up and mounting again.
- **Only during practice** = only in development, never in production.
- **Checking you switch off the lights when leaving** = checking your effect's cleanup works.
- **A student who leaves the lights on** = an effect without cleanup, which StrictMode exposes.

## 🔎 Detect

- The call happens twice **on first load**, not on every click.
- Your app is wrapped in `<StrictMode>` (usually in `main.jsx` or `index.jsx`).
- Run the **production build** with `npm run build` and `npm run preview`. If the call now happens **once**, it's StrictMode.

## 🐞 Debug

1. Check `main.jsx` (or `index.jsx`) for `<StrictMode>`.
2. Add `console.log('mount')` in the effect and `console.log('cleanup')` in its cleanup. In development you'll see: **mount → cleanup → mount**. That's the drill.
3. Test the production build. **Once** there = expected behaviour.
4. **Twice in production too?** Then it's a real bug. Check:
   - the [dependency array](glossary:dependency-array): an object or function made fresh every render makes the effect run again,
   - a parent that **remounts** the component (for example a `key` that changes),
   - **two components** fetching the same data.

## 🔧 Fix

Don't remove StrictMode. Make the effect **safe to run twice**.

**Before — no cleanup, so the drill starts two real requests that both finish:**

```jsx
import { useEffect, useState } from 'react';                    // bring in React hooks

function JobsPage() {                                           // a page that loads jobs
  const [jobs, setJobs] = useState([]);                         // start with an empty list
  useEffect(() => {                                             // runs after the page appears
    fetch('/api/jobs')                                          // ❌ the drill runs this twice, nothing cancels the first
      .then((res) => res.json())                                // turn the reply into data
      .then((data) => setJobs(data));                           // both replies set state
  }, []);                                                       // [] = once per mount (twice in dev due to the drill)
  return <p>{jobs.length} jobs</p>;                             // show how many jobs
}                                                               // end of JobsPage
```

**After — the cleanup cancels the first request:**

```jsx
import { useEffect, useState } from 'react';                    // bring in React hooks

function JobsPage() {                                           // the same page, fixed
  const [jobs, setJobs] = useState([]);                         // start with an empty list
  useEffect(() => {                                             // runs after the page appears
    const controller = new AbortController();                   // a "cancel button" for this request
    fetch('/api/jobs', { signal: controller.signal })           // connect the request to the cancel button
      .then((res) => res.json())                                // turn the reply into data
      .then((data) => setJobs(data))                            // save the jobs
      .catch((err) => {                                         // runs on errors and on cancel
        if (err.name !== 'AbortError') console.error(err);      // a cancel is expected, so only log real errors
      });                                                       // end of the fetch chain
    return () => controller.abort();                            // ✅ the drill's "cleanup" cancels the first request
  }, []);                                                       // [] = once per mount
  return <p>{jobs.length} jobs</p>;                             // show how many jobs
}                                                               // end of JobsPage
```

In the Network tab you'll still see two requests in development, but the first one is shown as **(canceled)**. Only one result is used.

**Even better for real apps — let a data library do it:**

```jsx
import { useQuery } from '@tanstack/react-query';               // a data-fetching library

function JobsPage() {                                           // the same page with React Query
  const { data: jobs = [] } = useQuery({                        // load and cache the data
    queryKey: ['jobs'],                                         // a name for this data, used for caching
    queryFn: () => fetch('/api/jobs').then((r) => r.json()),    // how to load it
  });                                                           // duplicates with the same key become one request
  return <p>{jobs.length} jobs</p>;                             // show how many jobs
}                                                               // end of JobsPage
```

**For effects that must never run twice** (like "send a welcome email"), don't put them in a mount effect at all. Run them in an **event handler** (on a click), or on the server.

## 🛡️ Prevent

- Keep **StrictMode on**. It finds real bugs early.
- Give every effect that starts work a **cleanup** that stops it.
- Use **TanStack Query** (or a similar library) for server data: caching, deduping and cancelling are built in.
- Keep **"do it once" actions** (payments, emails, creating records) in event handlers or on the server, never in mount effects.
- Make server actions **idempotent** where possible, so a repeated request does no harm. See [Idempotency keys](topic:rest-auth/idempotency-keys).

## 🗣️ How to answer in an interview

**Short version (20 seconds):**

> "In development, React StrictMode mounts, cleans up and mounts again to test effect cleanup, so the call appears twice. It doesn't happen in production. I don't remove StrictMode; I make the effect safe with an AbortController cleanup, or use React Query, which dedupes requests."

**Full version:**

> "First I check if it's StrictMode. Since React 18, StrictMode runs every effect as mount, cleanup, mount in development only, to find effects that don't clean up. I confirm it by running the production build: the call happens once there.
>
> I don't turn StrictMode off, because that just hides the problem. Instead I make the effect safe to run twice: I create an AbortController, pass its signal to fetch, and abort in the cleanup. The first request is cancelled, so only one result is used. In real apps I prefer React Query, which caches and removes duplicate requests.
>
> If the call also happens twice in production, it's a real bug. Then I check the dependency array for objects or functions recreated every render, a parent that remounts the component, or two components fetching the same data."

## 🔁 Follow-up questions

### Does StrictMode affect production?

No. The double mount and other StrictMode checks only run in development. The production build behaves normally.

### Why did React add this check?

To prepare apps for features where React may unmount and remount parts of the UI while keeping their state. Effects must be able to stop and start cleanly for that to work.

### My effect sends an analytics event and it's counted twice in dev. Is that a problem?

Only in development data. Either ignore dev events, or move "send once" logic to an event handler. Don't depend on a mount effect running exactly once.

### Can a `ref` flag stop the second run?

You can, but it fights React instead of fixing the effect, and it can break with future features. A proper cleanup or a data library is the better answer.

## ✅ Quick check

### 1. In development with StrictMode, what does this print when the component first appears?

```jsx
useEffect(() => {                         // the effect
  console.log('mount');                   // runs on mount
  return () => console.log('cleanup');    // runs on cleanup
}, []);                                   // run once per mount
```

:::answer
**mount, cleanup, mount.** StrictMode runs the drill once in development. In production it prints only **mount**.
:::

### 2. The call happens twice in production too. Which of these could be the cause?

- A) StrictMode
- B) The effect depends on an object created during every render
- C) The production build

:::answer
**B.** A new object every render looks "changed" to React, so the effect runs again. StrictMode doesn't run in production.
:::
