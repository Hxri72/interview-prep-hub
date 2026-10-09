---
title: Race conditions and AbortController
stack: react
order: 22
level: Intermediate
mustKnow: false
askedFrequency: common
summary:
  - A race condition happens when two requests are in flight and the OLD one finishes last, so old data replaces new data.
  - AbortController is a built-in "cancel button" for fetch. Pass its signal, then call abort().
  - In React, create the controller inside useEffect and abort it in the cleanup.
  - An aborted fetch rejects with an AbortError. Ignore that error; it is expected.
  - "AbortSignal.timeout(ms) cancels a request that takes too long."
cards:
  - q: What is a race condition in a React data fetch?
    a: Two requests run at the same time, and the older, slower one finishes last. Its reply overwrites the newer data, so the screen shows the wrong result.
  - q: How does AbortController work?
    a: You create a controller, pass controller.signal to fetch, and call controller.abort() to cancel. The fetch promise then rejects with an AbortError.
  - q: Where do you abort in a React component?
    a: In the useEffect cleanup function. It runs before the effect runs again and when the component is removed.
  - q: Besides aborting, what is another way to avoid the race?
    a: An "ignore" flag. Set let ignore = false in the effect, set it to true in the cleanup, and skip setState when ignore is true.
  - q: How do you add a timeout to fetch?
    a: Pass signal AbortSignal.timeout(5000). The request is cancelled after 5 seconds with a TimeoutError.
---

## 💡 What is it?

A [race condition](glossary:race-condition) is a bug where the result depends on **which job finishes first**.

In React, it often looks like this. The user types "re", then "react". Two search requests start. The "re" request is slow and finishes **last**. Now the screen shows results for "re", but the box says "react".

**AbortController** is a built-in browser tool. It lets you **cancel** a `fetch` you no longer need.

## 🏠 Real-life example

Think of **calling two friends for homework answers**.

You first ask Friend A for question 5. Then you change your mind and ask Friend B for question 6. Friend B replies quickly. Ten minutes later, Friend A replies with the answer to question 5. You copy it into the box for question 6 by mistake.

- **Asking a friend** = sending a request.
- **Friend A being slow** = the old request finishing last.
- **Writing the late answer in the wrong box** = old data replacing new data.
- **Texting Friend A "never mind, cancel"** = `controller.abort()`.

## 🧑‍💻 Code example

Make a Vite React app. Paste this into `src/App.jsx`, then run `npm run dev`. The fake server is slower for short words, so the race shows up easily.

```jsx
import { useEffect, useState } from 'react';                          // React hooks we need

function fakeSearch(text, signal) {                                   // pretend server: short words are SLOWER
  return new Promise((resolve, reject) => {                           // a promise we resolve later
    const delay = 2000 - text.length * 300;                           // "re" = 1400 ms, "react" = 500 ms
    const timer = setTimeout(() => resolve(`results for "${text}"`), delay); // reply after the delay
    signal?.addEventListener('abort', () => {                         // listen for "cancel"
      clearTimeout(timer);                                            // stop the fake request
      reject(new DOMException('Aborted', 'AbortError'));              // reject the same way fetch does
    });                                                               // end of abort listener
  });                                                                 // end of the promise
}                                                                     // end of fakeSearch

export default function App() {                                       // our component
  const [text, setText] = useState('');                               // what the user typed
  const [result, setResult] = useState('');                           // what we show

  useEffect(() => {                                                   // runs after each change of text
    if (!text) return;                                                // nothing typed → do nothing
    const controller = new AbortController();                         // a new "cancel button" for THIS search
    fakeSearch(text, controller.signal)                               // start the search, pass the signal
      .then(setResult)                                                // success → show it
      .catch((err) => {                                               // failure or cancel
        if (err.name !== 'AbortError') console.error(err);            // a cancel is expected; ignore it
      });                                                             // end of catch
    return () => controller.abort();                                  // CLEANUP: cancel this search when text changes
  }, [text]);                                                         // run again whenever text changes

  return (                                                            // what to show
    <main>                                                            {/* page wrapper */}
      <input value={text} onChange={(e) => setText(e.target.value)} /> {/* type here quickly */}
      <p>Box says: "{text}"</p>                                       {/* what the user typed */}
      <p>Showing: {result}</p>                                        {/* what we got back */}
    </main>                                                           // end of wrapper
  );                                                                  // end of return
}                                                                     // end of App
```

**What you see:**

```text
Type "react" quickly.
With the cleanup line:     Showing: results for "react"   ✅ always matches the box
Delete the cleanup line:   Showing: results for "react" … then it flips to
                           results for "rea" or "re"      ❌ old replies arrived last
```

## 🔍 Deeper version

**How AbortController works:**
1. `const controller = new AbortController()` makes a controller.
2. `controller.signal` is an object you pass to `fetch(url, { signal })`.
3. `controller.abort()` cancels. The `fetch` promise rejects with a `DOMException` named `AbortError`.
4. One controller works once. After `abort()`, make a new one for the next request.

**Why the cleanup is the right place.** React runs the old effect's cleanup **before** it runs the effect again. So when `text` changes from "re" to "rea", the "re" request is cancelled first. Only the latest request can update the state.

**The "ignore flag" option.** Some APIs can't be cancelled (for example, an SDK without `signal`). Then use a flag:

```jsx
useEffect(() => {                                // the effect
  let ignore = false;                            // this effect's own flag
  search(text).then((r) => {                     // start the request
    if (!ignore) setResult(r);                   // only the latest effect may update state
  });                                            // end of then
  return () => { ignore = true; };               // cleanup: mark this effect as old
}, [text]);                                      // re-run when text changes
```

The request still runs, but its reply is ignored. Aborting is better, because it also saves network and server work.

**Timeouts.** `fetch` has no timeout of its own. Use `AbortSignal.timeout(5000)` to cancel after 5 seconds. It rejects with a `TimeoutError`. To combine a timeout with a manual cancel, use `AbortSignal.any([controller.signal, AbortSignal.timeout(5000)])`.

**axios** also supports `signal` (since v0.22). **Data libraries** like TanStack Query pass a `signal` into your fetch function and cancel old queries for you.

**Debounce helps too.** [Debouncing](topic:javascript/debounce-throttle) a search box sends fewer requests. But it does not remove the race fully. A slow request can still arrive late, so keep the abort as well. See [search shows results for the wrong query](topic:debugging/search-race-condition).

## 🎯 Why do we use it?

- **Correct screens.** The user always sees data for what is currently selected.
- **Less waste.** Cancelled requests stop downloading. On the server, some frameworks can stop work too.
- **Clean unmounts.** When a component leaves the screen, its requests stop, so no state update happens on a removed component.
- **Timeouts.** A request can't hang forever.

## ⚠️ Common mistakes

- **Showing the AbortError to the user.** A cancel is expected. Check `err.name === 'AbortError'` and ignore it.
- **Reusing one controller for many requests.** After `abort()`, that signal is used up. Create a new controller inside each effect run.
- **Creating the controller outside `useEffect`.** Then it isn't tied to one specific request.
- **Thinking debounce alone fixes races.** It reduces requests, but a late reply can still win.

## 🗣️ How to answer in an interview

> "A race condition in data fetching is when an older request finishes after a newer one, so stale data replaces fresh data, for example in a search box when the user types fast.
>
> My fix is to create an AbortController inside the useEffect, pass its signal to fetch, and call abort in the cleanup. React runs the cleanup before the next effect, so only the latest request can update state. The aborted fetch rejects with an AbortError, which I ignore.
>
> If an API can't be cancelled, I use an ignore flag set in the cleanup. I also add timeouts with AbortSignal.timeout, and I often debounce search input to send fewer requests. Libraries like TanStack Query handle this cancellation for me."

[FILL IN: a place in your SkillKeepr screens where fast filter or search changes could show stale results, and how it was handled — for example takeLatest in a saga.]

## 🔁 Follow-up questions

### Does aborting a fetch stop the work on the server?

Not always. The browser stops waiting and closes the connection. The server may notice the closed connection and stop. But many servers finish the work anyway. Design APIs so repeated or cancelled calls are safe.

### How does Redux-saga avoid this race?

`takeLatest` cancels the previous saga task when a new action of the same type arrives. Its result is never used. Note that the HTTP request itself may still finish unless you also abort it.

### What is the difference between AbortError and TimeoutError?

`controller.abort()` gives an `AbortError`. `AbortSignal.timeout(ms)` gives a `TimeoutError` when the time runs out. You can show "This is taking too long" for timeouts and ignore normal aborts.

### Can you use AbortController in Node.js?

Yes. Node has `AbortController`, `AbortSignal.timeout` and `AbortSignal.any` built in. Built-in `fetch`, timers and many `fs` functions accept a `signal`.

## ✅ Quick check

### 1. What does this print?

```js
const c = new AbortController();                           // make a controller
fetch('https://example.com', { signal: c.signal })         // start a request with its signal
  .catch((err) => console.log(err.name));                   // print the error name
c.abort();                                                 // cancel right away
```

:::answer
**`AbortError`.** Aborting makes the fetch promise reject with an error named `AbortError`.
:::

### 2. A search box shows results for "rea" while the box says "react". Which fix stops this best?

- A) Add a loading spinner
- B) Abort the old request in the `useEffect` cleanup
- C) Use `useMemo`

:::answer
**B.** Cancelling the old request means only the latest one can update the state.
:::

### 3. True or false: you can call `abort()` on the same controller to cancel a second, later request.

:::answer
**False.** A controller's signal is aborted forever after the first `abort()`. Make a new controller for each request.
:::
