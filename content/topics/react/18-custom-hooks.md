---
title: Custom hooks (e.g. useFetch)
stack: react
order: 18
level: Intermediate
mustKnow: true
askedFrequency: very common
summary:
  - A custom hook is your own function whose name starts with "use" and that calls other hooks inside it.
  - It lets you reuse stateful logic (loading data, debouncing, reading window size) in many components.
  - Each component that calls a custom hook gets its OWN separate state. Hooks share logic, not data.
  - A good useFetch returns { data, loading, error } and cancels old requests in the effect cleanup.
  - Custom hooks follow the rules of hooks, and must start with "use" so the linter can check them.
cards:
  - q: What is a custom hook?
    a: A function whose name starts with "use" and that calls other hooks. It packages stateful logic so many components can reuse it.
  - q: Do two components using the same custom hook share state?
    a: No. Each call gets its own state. To share data, use lifted state, Context or a store.
  - q: What should a useFetch hook return?
    a: Usually { data, loading, error }, and sometimes a refetch function.
  - q: Why must custom hooks start with "use"?
    a: So React's lint rules and the React Compiler know it's a hook and can check the rules of hooks inside it.
  - q: How do you avoid race conditions in useFetch?
    a: Abort the old request in the effect's cleanup with AbortController, or ignore results from requests that are no longer current.
---

## 💡 What is it?

A **custom hook** is **your own [hook](glossary:hook)**. It is a normal function with two features:
1. Its name **starts with `use`**, like `useFetch` or `useDebounce`.
2. It **calls other hooks** inside, like `useState` and `useEffect`.

It lets you write some logic **once** and reuse it in many [components](glossary:component).

## 🏠 Real-life example

Think of **a recipe card for making tea**.

The recipe says: boil water, add tea leaves, add milk, add sugar. Every house in the street can use the **same recipe card**. But each house makes **its own cup of tea**, in its own kitchen.

- **The recipe card** = the custom hook (the shared logic).
- **Each house** = each component that uses the hook.
- **Each house's own cup of tea** = each component's own separate state.
- **Not sharing one cup** = hooks share logic, not data.

## 🧑‍💻 Code example

Paste this into `src/App.jsx` of a Vite React app. Run `npm run dev`.

```jsx
import { useEffect, useState } from 'react';                                     // bring in the hooks we build on

function useFetch(url) {                                                         // our custom hook; its name starts with "use"
  const [data, setData] = useState(null);                                        // the result; null = nothing yet
  const [loading, setLoading] = useState(true);                                  // true while the request is running
  const [error, setError] = useState(null);                                      // an error message, or null

  useEffect(() => {                                                              // run after render, and again when url changes
    const controller = new AbortController();                                    // a "cancel button" for this request
    setLoading(true);                                                            // a new request starts
    setError(null);                                                              // clear the old error
    fetch(url, { signal: controller.signal })                                    // ask the server; link it to the cancel button
      .then((res) => {                                                           // the server answered
        if (!res.ok) throw new Error(`HTTP ${res.status}`);                      // 404/500 don't reject on their own, so throw
        return res.json();                                                       // turn the body into a JS object
      })                                                                         // end of the first then
      .then((json) => setData(json))                                             // save the data
      .catch((err) => {                                                          // network error, HTTP error or cancel
        if (err.name !== 'AbortError') setError(err.message);                    // a cancel is expected; ignore it
      })                                                                         // end of catch
      .finally(() => {                                                           // runs on success or failure
        if (!controller.signal.aborted) setLoading(false);                       // only stop loading for the current request
      });                                                                        // end of the fetch chain
    return () => controller.abort();                                             // cleanup: cancel if url changes or the component leaves
  }, [url]);                                                                     // [url] = fetch again only when url changes

  return { data, loading, error };                                               // what every component gets back
}                                                                                // end of useFetch

function UserName({ id }) {                                                      // a component that USES the hook
  const { data, loading, error } = useFetch(`https://jsonplaceholder.typicode.com/users/${id}`); // one line instead of 20
  if (loading) return <p>Loading user {id}…</p>;                                 // loading state
  if (error) return <p>Error: {error}</p>;                                       // error state
  return <p>User {id}: {data.name}</p>;                                          // success state
}                                                                                // end of UserName

export default function App() {                                                  // the main component
  return (                                                                       // what App draws
    <main>                                                                       {/* a wrapper */}
      <UserName id={1} />                                                        {/* gets its OWN loading/data/error */}
      <UserName id={2} />                                                        {/* a separate copy of the same logic */}
    </main>                                                                      // end of the wrapper
  );                                                                             // end of what App returns
}                                                                                // end of App
```

**What you see:**

```text
Loading user 1…   Loading user 2…
then:
User 1: Leanne Graham
User 2: Ervin Howell
```

Both components use `useFetch`, but each one keeps its own `data`, `loading` and `error`.

## 🔍 Deeper version

**It's just a function.** React doesn't treat custom hooks specially at runtime. When `UserName` calls `useFetch`, the `useState` calls inside it become **part of `UserName`**. That's why each component gets separate state.

**Hooks share logic, not state.** Two components calling `useFetch('/users')` make **two requests** and keep **two copies** of the data. To share data:
- [lift state up](topic:react/lifting-state),
- use [Context](topic:redux-context/context-api) or Redux,
- or use a data library like [TanStack Query](topic:react/tanstack-query), which also caches requests.

**Good custom hook ideas:**

| Hook | What it does |
|---|---|
| `useFetch(url)` | data + loading + error, with cancelling |
| `useDebounce(value, ms)` | gives the value only after the user stops typing. See [debounce](topic:javascript/debounce-throttle) |
| `useLocalStorage(key, initial)` | state that is saved in localStorage |
| `useWindowSize()` | the current width/height, with listener cleanup |
| `usePrevious(value)` | the value from the last render, using a ref |
| `useToggle(initial)` | `[on, toggle]` for open/close UI |

**Design tips:**
- Return an **object** (`{ data, loading, error }`) when there are many values. Return an **array** (`[value, setValue]`) when callers will rename them, like `useState`.
- Always **clean up**: listeners, timers, sockets and requests. See [useEffect](topic:react/use-effect).
- Keep hooks **focused**. A hook doing five jobs is hard to reuse.
- Stabilise returned functions with `useCallback` if callers may put them in dependency arrays.

**Race conditions.** If `url` changes quickly, an older, slower response could arrive last and overwrite newer data. The `controller.abort()` in the cleanup prevents this. See [race conditions](topic:react/race-conditions-abort).

**Testing.** React Testing Library's `renderHook` lets you test a hook on its own, without building a whole component.

## 🎯 Why do we use it?

- **No copy-paste.** Loading-and-error logic is written once.
- **Cleaner components.** The component shows UI. The hook handles the details.
- **Easier testing and fixing.** A bug fixed in the hook is fixed everywhere it's used.

## ⚠️ Common mistakes

- **Naming it without `use`**, like `fetchData()` that calls `useState`. The linter can't check it, and the rules of hooks may be broken.
- **Expecting shared state** between components. Each call has its own state.
- **No cleanup**, so old requests or listeners keep running after the component is gone.
- **Calling the custom hook inside an `if`.** It follows the [rules of hooks](topic:react/rules-of-hooks) like any other hook.

## 🗣️ How to answer in an interview

> "A custom hook is a function that starts with 'use' and calls other hooks. It's how I reuse stateful logic between components. For example, a useFetch hook that returns data, loading and error, so each component doesn't repeat the same fetch code.
>
> The important point is that hooks share logic, not state. Each component that calls the hook gets its own separate state. If components need the same data, I lift the state up, use Context or a store, or use a library like TanStack Query that caches requests.
>
> In useFetch, I always cancel the old request in the effect cleanup with AbortController. That avoids race conditions and updates after unmount. I also keep hooks small and focused, and test them with renderHook."

[FILL IN: a custom hook you wrote or used at SkillKeepr, e.g. for debounced search, if you remember one.]

## 🔁 Follow-up questions

### What's the difference between a custom hook and a normal utility function?

A utility function has no React state or effects. It just calculates something. A custom hook calls hooks, so it can keep state, run effects and trigger re-renders.

### Can a custom hook return JSX?

It can, but then it's really a component. Hooks usually return values and functions. Components return JSX.

### How would you write useDebounce?

Keep a `debounced` value in state. In an effect, start a `setTimeout` that copies `value` into `debounced` after `ms` milliseconds. Clear the timeout in the cleanup. The effect depends on `[value, ms]`.

### Why use TanStack Query instead of your own useFetch?

It adds caching, removes duplicate requests, retries, refetches in the background and handles race conditions. A home-made `useFetch` is fine for learning or small apps.

## ✅ Quick check

### 1. Two components both call `useCounter()`. One clicks "+1". Does the other one's count change?

:::answer
**No.** Each component has its own state inside the hook. Hooks share logic, not data.
:::

### 2. Is this a valid custom hook?

```jsx
function getUser(id) {                         // name does not start with "use"
  const [user, setUser] = useState(null);      // calls a hook inside
  return user;                                 // returns the state
}
```

:::answer
**No.** It calls a hook but its name doesn't start with `use`. The lint rules won't check it, and someone may call it inside an `if` or a loop. Rename it to `useUser`.
:::
