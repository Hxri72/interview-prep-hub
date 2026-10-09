---
title: Browser memory keeps growing (frontend memory leak)
template: scenario
stack: debugging
order: 9
level: Advanced
mustKnow: true
askedFrequency: common
summary:
  - "Symptom: the app gets slower the longer the tab stays open, and memory keeps going up."
  - "Detect: watch memory in Chrome Task Manager or the Performance monitor; it never comes back down."
  - "Debug: take heap snapshots in Chrome's Memory tab, compare them, and look for detached DOM nodes and growing listener counts."
  - "Fix: clean up in the useEffect return — clear intervals and timeouts, remove listeners, close sockets, abort fetches."
  - "Prevent: every effect that starts something must also stop it; test by opening and closing a page many times."
cards:
  - q: What is a memory leak in a React app?
    a: Memory the app keeps holding after it no longer needs it. Usually a timer, listener or socket that was never cleaned up, so the browser can't free it.
  - q: Which Chrome tool finds a frontend memory leak?
    a: The Memory tab. Take a heap snapshot, repeat the action a few times, take another snapshot, and compare them. Look for "Detached" DOM nodes and objects that keep growing.
  - q: What is a detached DOM node?
    a: An element that was removed from the page, but JavaScript still holds a reference to it. So the browser can't delete it from memory.
  - q: Name four things you must clean up in useEffect.
    a: setInterval/setTimeout, event listeners on window or document, WebSocket or other subscriptions, and in-flight fetch requests (with AbortController).
  - q: How do you prove the fix worked?
    a: Repeat the same action, take heap snapshots again, and check that memory comes back down and the detached nodes are gone.
---

## 💡 What is it?

The app works fine at first. But the longer the tab stays open, the **slower** it gets. The browser's **memory keeps going up** and never comes down.

This is a **frontend [memory leak](glossary:memory-leak)**. The app keeps holding memory it no longer needs. Over hours, the tab can freeze or crash.

## 🏠 Real-life example

Think of a **classroom where students leave the fans on**.

Every period, a new class comes in and switches on the fan. When they leave, nobody switches it off. By the end of the day, every fan is running. The electricity bill keeps growing.

- **A class coming in** = a component appearing on screen.
- **Switching on the fan** = starting a timer, listener or socket.
- **Leaving without switching it off** = no cleanup when the component goes away.
- **All fans running at the end of the day** = memory that keeps growing.
- **The rule "switch off when you leave"** = the cleanup function in `useEffect`.

## 🔎 Detect

How you notice it:

- Users say "the app gets slow after a while" or "the tab crashed".
- In **Chrome Task Manager** (Shift + Esc), the tab's memory keeps rising.
- In DevTools, open **Performance monitor** (Cmd/Ctrl + Shift + P → "Performance monitor"). Watch **JS heap size**, **DOM nodes** and **JS event listeners**. In a leak, they climb and never drop.

Confirm it is real: do one action again and again. For example, open and close the same page 10 times. If memory stays high even after a forced [garbage collection](glossary:garbage-collection) (the 🗑️ button in the Memory tab), it's a leak.

## 🐞 Debug

1. Open the **Memory** tab in Chrome DevTools.
2. Take a **heap snapshot**. (A heap snapshot is a photo of everything in memory.)
3. Repeat the suspicious action a few times. For example, open and close a modal.
4. Take a **second snapshot**.
5. Choose **Comparison** view. Sort by "# Delta" (how many new objects).
6. Search for **"Detached"**. A **detached DOM node** is an element removed from the page, but still held by JavaScript.
7. Click an object and read its **Retainers** panel. It shows *who* is still holding it. Often it's a closure inside an `addEventListener` or a `setInterval`.

Common causes in React apps:

| Cause | What you see |
|---|---|
| `setInterval` never cleared | the callback keeps running after the page closes |
| `window.addEventListener` never removed | "JS event listeners" count keeps growing |
| WebSocket never closed | open connections pile up, messages still arrive |
| Big data stored in a module-level variable or cache | heap grows with every page visit |
| A listener removed with a **different** function than the one added | it looks cleaned up, but it isn't |

## 🔧 Fix

**Before — leaks a timer and a listener every time the component mounts:**

```jsx
import { useEffect, useState } from 'react';                       // bring in React hooks

function LiveClock() {                                             // a component that shows the time
  const [time, setTime] = useState(new Date());                    // the current time, stored in state
  useEffect(() => {                                                // runs after the component appears
    setInterval(() => setTime(new Date()), 1000);                  // ❌ starts a timer every 1000 ms, never stopped
    window.addEventListener('resize', () => console.log('resize')); // ❌ adds a new listener, never removed
  }, []);                                                          // [] = run once, when the component appears
  return <p>{time.toLocaleTimeString()}</p>;                       // show the time on screen
}                                                                  // end of LiveClock
```

**After — every start has a matching stop:**

```jsx
import { useEffect, useState } from 'react';                       // bring in React hooks

function LiveClock() {                                             // the same component, fixed
  const [time, setTime] = useState(new Date());                    // the current time, stored in state
  useEffect(() => {                                                // runs after the component appears
    const id = setInterval(() => setTime(new Date()), 1000);       // start the timer and keep its id
    const onResize = () => console.log('resize');                  // keep ONE named function for the listener
    window.addEventListener('resize', onResize);                   // add the listener using that function
    return () => {                                                 // cleanup: runs when the component goes away
      clearInterval(id);                                           // ✅ stop the timer using its id
      window.removeEventListener('resize', onResize);              // ✅ remove the SAME function we added
    };                                                             // end of cleanup
  }, []);                                                          // [] = set up once, clean up once
  return <p>{time.toLocaleTimeString()}</p>;                       // show the time on screen
}                                                                  // end of LiveClock
```

**For a WebSocket or a fetch, the cleanup looks like this:**

```jsx
useEffect(() => {                                                  // runs after the component appears
  const socket = new WebSocket('wss://example.com/live');          // open a live connection
  const controller = new AbortController();                        // a "cancel button" for the fetch
  fetch('/api/notifications', { signal: controller.signal });      // start a request that can be cancelled
  return () => {                                                   // cleanup when the component goes away
    socket.close();                                                // ✅ close the connection
    controller.abort();                                            // ✅ cancel the request if it's still running
  };                                                               // end of cleanup
}, []);                                                            // [] = run once
```

After the fix, repeat the same action and take snapshots again. Memory should come back down, and the detached nodes should be gone.

## 🛡️ Prevent

- **Rule for the team:** every effect that *starts* something must *stop* it in its cleanup. Check this in code reviews.
- Keep the **react-hooks/exhaustive-deps** lint rule on. It helps you see what an effect uses.
- Use one shared hook for repeated patterns, like `useInterval` or `useEventListener`, with the cleanup built in.
- Don't keep big data in module-level variables "for later". Use state, or a cache with a size limit.
- For long-living pages (dashboards, live interviews), open and close them many times in testing and watch memory.
- See [useEffect: dependencies and cleanup](topic:react/use-effect) and [Garbage collection and memory leaks](topic:javascript/garbage-collection).

## 🗣️ How to answer in an interview

**Short version (20 seconds):**

> "I'd confirm it with Chrome's Performance monitor: if memory and listener counts keep rising, it's a leak. Then I'd compare heap snapshots in the Memory tab and look for detached DOM nodes and their retainers. Usually the cause is an interval, listener or socket that isn't cleaned up in useEffect. I'd add the cleanup and take snapshots again to prove memory drops."

**Full version:**

> "First I confirm it's real. I open the Performance monitor and watch JS heap size, DOM nodes and event listeners while I repeat one action, like opening and closing a page. If they keep climbing even after a forced garbage collection, it's a leak.
>
> Then I go to the Memory tab. I take a heap snapshot, repeat the action a few times, and take another one. In Comparison view I search for 'Detached' and check the Retainers panel. It tells me which closure or listener is holding the old objects.
>
> The fix is usually cleanup in the useEffect return: clearInterval, removeEventListener with the same function, closing the WebSocket, and aborting fetches with AbortController. Then I take snapshots again to confirm memory goes back down.
>
> To prevent it, we make 'every start has a stop' a code-review rule, and use shared hooks like useInterval that clean up by themselves."

[FILL IN: a real memory or performance issue you found in a React app, if you have one. Only add it if it's true.]

## 🔁 Follow-up questions

### What is the difference between a slow app and a leaking app?

A slow app is slow from the start, often because of heavy renders or big bundles. A leaking app starts fast and **gets slower over time**, because memory keeps growing. The memory graph tells you which one it is.

### Why doesn't `removeEventListener(() => ...)` work?

`removeEventListener` must get **the same function** that was added. A new arrow function is a different function, even if the code looks the same. Save the function in a variable and use it in both places.

### Can a closure cause a memory leak?

Yes. A [closure](glossary:closure) keeps the variables it uses alive. If a listener's closure holds a big array and the listener is never removed, the array stays in memory too. See [Closures](topic:javascript/closures).

### Does React clean up for me?

React removes the DOM elements it created. But it can't know about timers, `window` listeners, sockets or subscriptions you started yourself. That's your job, in the cleanup function.

### What would you check in a Redux app?

Subscriptions or middleware that keep adding data and never remove it. For example, a list that only grows, or a cache with no size limit.

## ✅ Quick check

### 1. Which line causes a leak?

```jsx
useEffect(() => {                                         // the effect
  window.addEventListener('scroll', () => track());       // A
  return () => window.removeEventListener('scroll', () => track()); // B
}, []);                                                   // run once
```

:::answer
**B does nothing useful, so A leaks.** Line B removes a *new* function, not the one added in A. Save the function in a variable (`const onScroll = () => track();`) and use it in both lines.
:::

### 2. In Chrome's Memory tab, what are you looking for to find leaked elements?

- A) "Detached" DOM nodes
- B) The biggest image
- C) The number of CSS rules

:::answer
**A.** Detached DOM nodes are elements removed from the page but still held by JavaScript. Their Retainers panel shows who is holding them.
:::

### 3. True or false: if a page is closed, its `setInterval` stops automatically.

:::answer
**False** (inside a single-page app). Closing a *component* does not stop its timer. You must call `clearInterval` in the cleanup. Only closing the whole browser tab stops everything.
:::
