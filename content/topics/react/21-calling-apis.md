---
title: "Calling APIs: loading, error and empty states"
stack: react
order: 21
level: Intermediate
mustKnow: true
askedFrequency: very common
summary:
  - Every API call has four states to show — loading, error, empty and success.
  - Keep data, loading and error in state, and set them in the right order.
  - fetch does NOT throw on 404 or 500. Check res.ok yourself.
  - Cancel old requests in the useEffect cleanup, so a slow old reply can't overwrite new data.
  - In bigger apps, a data library (TanStack Query) or a store (Redux) handles caching and refetching.
cards:
  - q: What four states should every API call show?
    a: Loading (a spinner or skeleton), error (a clear message and a retry), empty ("No candidates yet") and success (the data).
  - q: Does fetch throw an error for a 500 response?
    a: No. fetch only throws for network failures. You must check res.ok (true for 200–299) and throw yourself.
  - q: Where do you call an API in a React component?
    a: In useEffect for loading data when the page opens, or in an event handler for user actions like Save. In bigger apps, use a data library or a Redux thunk or saga.
  - q: Why put the API base URL in one place?
    a: So you don't repeat it in every call. One wrapper can also add headers, credentials and error handling for all requests.
  - q: How do you avoid showing old data when the user changes the filter quickly?
    a: Cancel the previous request with AbortController in the useEffect cleanup, or ignore replies that are no longer the latest.
---

## 💡 What is it?

Most React pages get their data from a backend [API](glossary:api). For example, "give me the list of candidates".

The call takes time, and it can fail. So the screen must handle **four states**:
1. **Loading** — the data is on its way.
2. **Error** — something went wrong.
3. **Empty** — it worked, but there is nothing to show.
4. **Success** — show the data.

If you forget one, users see a blank screen or a crash.

## 🏠 Real-life example

Think of **ordering food at a school canteen counter**.

- You place the order. The screen says **"Preparing your order…"** = loading.
- Sometimes the cook says **"Sorry, dosa is finished. Try something else."** = error, with a way to try again.
- Sometimes the tray comes back **empty** because the item wasn't ready today = the empty state ("No candidates yet").
- Most days, **your food arrives** = success.

A good canteen tells you which one is happening. A bad canteen just leaves you standing and wondering.

## 🧑‍💻 Code example

Make a Vite React app (`npm create vite@latest`, pick React). Paste this into `src/App.jsx`, then run `npm run dev`.

```jsx
import { useEffect, useState } from 'react';                         // the two hooks we need

const API = 'https://jsonplaceholder.typicode.com';                  // one place for the base URL (a free test API)

async function getJson(path, signal) {                               // a tiny reusable fetch helper
  const res = await fetch(`${API}${path}`, { signal });              // send the request; signal lets us cancel it
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);     // fetch doesn't throw on 404/500, so we do
  return res.json();                                                 // turn the reply into a JavaScript object
}                                                                    // end of getJson

export default function App() {                                      // our page component
  const [userId, setUserId] = useState(1);                           // which user's posts to show; starts at 1
  const [posts, setPosts] = useState([]);                            // the data; starts as an empty list
  const [loading, setLoading] = useState(true);                      // true while the request is running
  const [error, setError] = useState(null);                          // null = no error yet

  useEffect(() => {                                                  // runs after the screen is drawn
    const controller = new AbortController();                        // a "cancel button" for this request
    setLoading(true);                                                // 1. show loading
    setError(null);                                                  // clear any old error
    getJson(`/posts?userId=${userId}`, controller.signal)             // 2. call the API
      .then((data) => setPosts(data))                                // 3a. success → save the data
      .catch((err) => {                                              // 3b. something failed
        if (err.name !== 'AbortError') setError(err.message);        // ignore our own cancel; show real errors
      })                                                             // end of catch
      .finally(() => setLoading(false));                             // 4. stop loading either way
    return () => controller.abort();                                 // cleanup: cancel if userId changes or we leave
  }, [userId]);                                                      // run again when userId changes

  return (                                                           // what to show
    <main>                                                           {/* page wrapper */}
      <button onClick={() => setUserId(userId + 1)}>Next user</button> {/* change the filter */}
      <button onClick={() => setUserId(999)}>User with no posts</button> {/* try the empty state */}
      {loading && <p>Loading…</p>}                                   {/* LOADING state */}
      {!loading && error && <p>Error: {error}</p>}                   {/* ERROR state */}
      {!loading && !error && posts.length === 0 && <p>No posts yet.</p>} {/* EMPTY state */}
      {!loading && !error && posts.length > 0 && (                   // SUCCESS state
        <ul>{posts.map((p) => <li key={p.id}>{p.title}</li>)}</ul>   // one list item per post
      )}                                                             {/* end of success state */}
    </main>                                                          // end of page wrapper
  );                                                                 // end of return
}                                                                    // end of App
```

**What you see:**

```text
First: "Loading…" for a moment, then 10 post titles for user 1.
Click "Next user": "Loading…", then user 2's titles.
Click "User with no posts": "Loading…", then "No posts yet."
Turn off Wi-Fi and click "Next user": "Error: Failed to fetch".
```

## 🔍 Deeper version

**`fetch` only throws for network errors.** A `404` or `500` reply still "succeeds" from `fetch`'s point of view. You must check `res.ok` (true for status 200–299) and throw yourself. See [the fetch API](topic:javascript/fetch-api).

**One API wrapper.** Don't write the base URL and headers in every component. Make one helper (like `getJson` above) or one axios instance. It can:
- add the base URL,
- send cookies with `credentials: 'include'` if your auth uses [HttpOnly cookies](topic:rest-auth/token-storage),
- turn non-2xx replies into one error format,
- handle `401` in one place (for example, send the user to the login page).

**Where to call APIs:**

| Situation | Where |
|---|---|
| Load data when the page opens or a filter changes | `useEffect` with cleanup |
| The user clicks "Save" or "Delete" | the event handler, not an effect |
| Many pages need the same data, caching, refetching | a data library like TanStack Query |
| A big Redux app | a thunk or a saga that dispatches loading/success/failure actions |

**Race conditions.** If the user clicks "Next user" fast, an old slow reply can arrive **after** the new one. Then the screen shows the wrong user. Cancelling in the cleanup fixes this. See [race conditions and AbortController](topic:react/race-conditions-abort).

**Better loading UI.** Skeleton boxes (grey placeholders) feel faster than a spinner. Keep the old data on screen while new data loads, so the page doesn't jump.

**StrictMode.** In development, React runs effects twice to test your cleanup. So you may see two requests. That's expected. See [an API call runs twice in development](topic:debugging/api-called-twice-dev).

## 🎯 Why do we use it?

Network calls are slow and can fail. Users need to know what is happening.

- **Loading** stops them clicking again and again.
- **Error with retry** lets them recover without refreshing the page.
- **Empty** tells them "it worked, there's just nothing here yet".
- **One wrapper** keeps every call consistent: same headers, same errors, same login handling.

## ⚠️ Common mistakes

- **Forgetting to check `res.ok`.** A 500 error page gets parsed as data, and the app crashes later.
- **No empty state.** An empty list shows a blank page, and users think it's broken.
- **Not cancelling old requests.** Fast filter changes show the wrong results.
- **Setting `loading` to `false` only on success.** On error, the spinner spins forever. Use `finally`.
- **Calling the API directly in the component body.** It runs on every render and creates an infinite loop. Use `useEffect` or an event handler.

## 🗣️ How to answer in an interview

> "Every API call in my components has four states: loading, error, empty and success, and I make sure the UI shows each one. For loading data on page open, I call the API in useEffect, set loading first, then data or error, and turn loading off in finally.
>
> I keep one API wrapper, so the base URL, credentials and error handling live in one place. Since fetch doesn't throw on 404 or 500, the wrapper checks res.ok and throws. A 401 is handled once, by sending the user to login.
>
> I also cancel the old request in the effect cleanup with AbortController, so a slow old response can't overwrite new data. For larger apps I'd use a data library like TanStack Query, or Redux with thunks or sagas, so caching and refetching are handled for me."

[FILL IN: how API calls were made in the SkillKeepr screens you built — for example a shared fetch wrapper called from Redux sagas.]

## 🔁 Follow-up questions

### fetch or axios?

Both work. `fetch` is built in and has no dependency. axios adds interceptors, automatic JSON and throws on non-2xx by default. Many teams use a small fetch wrapper. Others prefer axios for interceptors.

### How do you handle a 401 (not logged in) on every request?

Handle it in the one API wrapper or in an axios interceptor. Clear the user's state and redirect to `/login`. Or try a token refresh once, then retry the request.

### How do you show a retry button?

Keep the request in a function. Show the error with a "Try again" button that calls the function again. Or bump a `reloadKey` state that is in the effect's dependency array.

### Why not keep API data in Redux for everything?

Server data needs caching, refetching and "is it stale?" logic. Data libraries like TanStack Query do this for you. Redux is better for client state that many screens share. See [TanStack Query](topic:react/tanstack-query).

## ✅ Quick check

### 1. The server returns `500`. Does this code reach the `catch`?

```js
fetch('/api/candidates')               // the request
  .then((res) => res.json())           // parse the reply
  .then((data) => console.log(data))   // use the data
  .catch(() => console.log('failed')); // handle errors
```

:::answer
**No** (unless the 500 body isn't valid JSON). `fetch` doesn't throw for HTTP errors. Check `res.ok` and throw yourself.
:::

### 2. The spinner never stops after an error. What is the likely bug?

:::answer
`setLoading(false)` only runs on success. Put it in `finally`, so it runs after success **and** after an error.
:::

### 3. Which is NOT one of the four states to show?

- A) Loading
- B) Empty
- C) Cached
- D) Error

:::answer
**C.** The four are loading, error, empty and success.
:::
