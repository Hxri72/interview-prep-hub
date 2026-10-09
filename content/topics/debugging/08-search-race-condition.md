---
title: Search shows results for the wrong query (race condition)
template: scenario
stack: debugging
order: 8
level: Intermediate
mustKnow: false
askedFrequency: common
summary:
  - "Detect: the user types \"react\" but sees results for \"rea\" — sometimes, not always."
  - "Debug: in the Network tab (with throttling) the responses finish in a different order than they started. The last response to arrive wins, even if it's old."
  - "Fix: cancel old requests with AbortController, or ignore stale responses with a request id / ignore flag. Debounce to reduce the number of requests."
  - "Prevent: a data-fetching library (TanStack Query, RTK Query) or saga takeLatest, which handle this for you."
cards:
  - q: Why does a search sometimes show results for an older query?
    a: Two requests run at the same time. The older one is slower and finishes last, so it overwrites the newer results. This is a race condition.
  - q: How does AbortController fix it?
    a: Before starting a new request, you abort the previous one. The old request is cancelled, so it can never overwrite the screen.
  - q: What is the "ignore flag" pattern in useEffect?
    a: Set let ignore = false in the effect and ignore = true in the cleanup. When an old response arrives, ignore is true, so you skip setState.
  - q: Does debouncing fully fix race conditions?
    a: No. It sends fewer requests, but two requests can still overlap. You still need cancellation or a stale check.
  - q: How does redux-saga's takeLatest help?
    a: When a new action comes in, takeLatest cancels the running saga for the older action, so only the latest one can update the store.
---

## 💡 What is it?

The symptom: a user types **"react"** in a search box. The list shows results for **"rea"**. It doesn't happen every time, which makes it confusing.

The cause is a [race condition](glossary:race-condition): two requests are running, and the **slower old one finishes last** and overwrites the newer result.

## 🏠 Real-life example

Think of **sending two friends to buy snacks**.

First you send Ravi for chips. Then you change your mind and send Anu for biscuits. Anu is quick and comes back first. Then Ravi arrives late with chips, and **puts them on the table over the biscuits**. Now the table shows your **old** choice.

- **Your first and second request** = the "rea" and "react" API calls.
- **Ravi being slow** = the old request taking longer.
- **The last one to arrive wins the table** = the last response updates the screen.
- **Calling Ravi to say "stop, don't come back"** = `AbortController` cancelling the old request.
- **Ignoring whatever Ravi brings** = the ignore flag / request id check.

## 🔎 Detect

1. Set the Network tab throttling to **"Slow 4G"**, so timing differences are bigger.
2. Type quickly, then pause.
3. Watch the **order** in which responses finish. Is an older query finishing after a newer one?
4. Check if the screen shows the results of the **last finished** request instead of the **last typed** text.

## 🐞 Debug

Look at how the request is made:

| Code pattern | Problem |
|---|---|
| `fetch` on every change, then `setResults(data)` | Whichever answer comes last wins |
| An effect without a cleanup | Old requests are never cancelled or ignored |
| Debounce only | Fewer requests, but they can still overlap |

You can prove it with a quick log: print the query when the request starts and when it finishes.

## 🔧 Fix

**See the bug in Node first.** Save as `race.js` and run `node race.js`.

```js
const fakeApi = (query, ms) =>                                   // pretend server: answers after `ms` milliseconds
  new Promise((resolve) => setTimeout(() => resolve(`results for "${query}"`), ms)); // resolve later with text

let screen = '';                                                 // what the user sees

async function searchBroken(query, ms) {                         // no protection against old answers
  const data = await fakeApi(query, ms);                         // wait for this query's answer
  screen = data;                                                 // last answer to ARRIVE wins
}                                                                // end of searchBroken

let latest = 0;                                                  // id of the newest request
async function searchFixed(query, ms) {                          // ignores stale answers
  const id = ++latest;                                           // give this request a new id
  const data = await fakeApi(query, ms);                         // wait for this query's answer
  if (id !== latest) return;                                     // a newer request exists → ignore this answer
  screen = data;                                                 // only the newest request updates the screen
}                                                                // end of searchFixed

(async () => {                                                   // run both demos one after another
  await Promise.all([searchBroken('rea', 300), searchBroken('react', 100)]); // "rea" is slower
  console.log('broken:', screen);                                // shows the OLD query
  await Promise.all([searchFixed('rea', 300), searchFixed('react', 100)]);   // same timing again
  console.log('fixed:', screen);                                 // shows the NEW query
})();                                                            // start the demo
```

**Output:**

```text
broken: results for "rea"
fixed: results for "react"
```

**In React**, cancel the old request in the effect's cleanup. Paste into a Vite React app.

```jsx
import { useEffect, useState } from 'react';                     // React hooks

export default function CandidateSearch({ query }) {             // query = the latest typed text
  const [results, setResults] = useState([]);                    // what we show
  useEffect(() => {                                              // runs when query changes
    const controller = new AbortController();                   // a cancel button for THIS request
    fetch(`/api/candidates?q=${encodeURIComponent(query)}`, { signal: controller.signal }) // safe URL text
      .then((res) => res.json())                                 // turn the reply into JSON
      .then(setResults)                                          // show the results
      .catch((err) => {                                          // runs on error or cancel
        if (err.name !== 'AbortError') console.error(err);       // a cancel is expected, ignore it
      });                                                        // end of the fetch chain
    return () => controller.abort();                             // new query → cancel the old request
  }, [query]);                                                   // re-run only when the query changes
  return <ul>{results.map((c) => <li key={c.id}>{c.name}</li>)}</ul>; // draw the list
}                                                                // end of CandidateSearch
```

Add a **debounce** on `query` too (see [slow search typing](topic:debugging/slow-search-typing)), so fewer requests start.

## 🛡️ Prevent

- Use a **data-fetching library** (TanStack Query, RTK Query). It tracks requests by key and ignores old ones.
- In **redux-saga**, use **`takeLatest`**: it cancels the older saga when a new action arrives.
- Every effect that fetches data must have a **cleanup** that aborts or ignores.
- Test with **network throttling** before release.

## 🗣️ How to answer in an interview

> **Short version:** "That's a race condition: an older, slower request finishes last and overwrites the newer results. I'd confirm it in the Network tab with throttling. The fix is to cancel old requests with AbortController, or ignore stale responses with a request id, plus a debounce to send fewer requests."
>
> **Full version:** "I'd throttle the network to Slow 4G, type quickly and watch the order the responses finish in. If an older query finishes after a newer one, that's the bug: the last response to arrive wins. In React, I fix it in the effect: I create an AbortController for each request and abort it in the cleanup, so a new query cancels the old one. Another option is an ignore flag or a request id that I check before setting state. I also debounce the input to reduce requests, but debounce alone doesn't fix the race. With redux-saga, takeLatest does the cancellation, and libraries like TanStack Query handle it too."

[FILL IN: SkillKeepr's frontend uses redux-saga — confirm if search sagas use takeLatest, and add a real example if you have one.]

## 🔁 Follow-up questions

### Does aborting a fetch stop the work on the server?

Not always. The browser stops waiting and closes the connection, but the server may finish the query anyway. The main goal is to protect the UI.

### What's the difference between `takeLatest` and `takeEvery`?

`takeEvery` runs a saga for every action, in parallel. `takeLatest` cancels the previous running saga when a new action comes, so only the latest result is used.

### Can race conditions happen on the backend too?

Yes. Two requests updating the same record can overwrite each other. See [lost update](topic:debugging/lost-update) and [atomic updates](topic:mongodb/atomic-updates-locking).

### Why use `encodeURIComponent` on the query?

So characters like `&`, `?` or spaces don't break the URL or change its meaning.

## ✅ Quick check

### 1. Request A ("rea") takes 300 ms, request B ("react") takes 100 ms. Without protection, what does the screen show at the end?

:::answer
**Results for "rea"**, because A finishes last and overwrites B.
:::

### 2. Which line cancels the old request when `query` changes?

- A) `return () => controller.abort();`
- B) `if (!res.ok) throw new Error()`
- C) `setResults([])`

:::answer
**A.** The cleanup runs before the next effect, and it aborts the previous request.
:::

### 3. True or false: adding a 300 ms debounce completely removes race conditions.

:::answer
**False.** It reduces how many requests start, but two can still overlap.
:::
