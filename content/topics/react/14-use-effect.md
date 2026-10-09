---
title: "useEffect: dependencies and cleanup"
stack: react
order: 14
level: Intermediate
mustKnow: true
askedFrequency: very common
summary:
  - useEffect runs code AFTER React has drawn the screen. Use it for side effects like loading data, timers, subscriptions and changing the page title.
  - "The dependency array decides when it runs again: no array = after every render, [] = only once after the first render, [a, b] = when a or b changes."
  - The function you return is the cleanup. It runs before the effect runs again, and when the component is removed.
  - Always clean up timers, listeners, sockets and fetches. If you don't, you get memory leaks and old data on screen.
  - In development, StrictMode runs effects twice on purpose (mount → cleanup → mount) to catch missing cleanups.
cards:
  - q: When does useEffect run?
    a: After React has rendered and updated the screen. After that, only when a value in the dependency array changes.
  - q: "What is the difference between no dependency array, [] and [userId]?"
    a: "No array: after every render. []: only once, after the first render. [userId]: after the first render, and again whenever userId changes."
  - q: What is the cleanup function, and when does it run?
    a: The function you return from the effect. React runs it before running the effect again, and when the component is removed from the screen.
  - q: Why does my effect run twice in development?
    a: React StrictMode mounts, cleans up and mounts again, in development only. It does this to find effects that forget to clean up. It doesn't happen in production.
  - q: Why can useEffect cause an infinite loop?
    a: The effect sets state that is also in its own dependency array. Or it depends on an object or function that is made new on every render. So it keeps triggering itself again.
---

## 💡 What is it?

`useEffect` is a React [hook](glossary:hook). It lets a [component](glossary:component) run some code **after React has drawn the screen**.

We use it for [side effects](glossary:side-effect). A side effect is work that reaches outside the component. For example: loading data from an [API](glossary:api), starting a timer, or watching the window size.

You give it two things:
1. **what to do**, and
2. **when to do it again** (the [dependency array](glossary:dependency-array)).

You can also return a **[cleanup](glossary:cleanup)** function. It tidies up when the work is no longer needed.

## 🏠 Real-life example

Think of **moving into a new classroom**.

1. First, the room is set up: desks, chairs and the board. This is React **rendering** the screen.
2. *After* the room is ready, you do the extra jobs. You switch on the fan, open the window and put your bag down. This is the **effect**. It runs after the room is ready, not before.
3. When you **leave the room**, you switch off the fan and close the window. This is the **cleanup**. If you forget, the fan runs all night and wastes power. A timer you forget to stop wastes memory in the same way.
4. The **dependency array** is a rule: "only redo the setup when the *class changes*". If it's the same class, you don't switch the fan off and on again for no reason.

## 🧑‍💻 Code example

Make a new React app with `npm create vite@latest` (pick React). Paste this into `src/App.jsx`. Then run `npm run dev`.

```jsx
import { useEffect, useState } from 'react';                     // bring in two React hooks

function UserCard({ userId }) {                                  // a component; userId comes from the parent (a prop)
  const [user, setUser] = useState(null);                        // user starts as null, which means "not loaded yet"

  useEffect(() => {                                              // this runs AFTER React has drawn the screen
    const controller = new AbortController();                    // a "cancel button" for the request below
    setUser(null);                                               // clear the old user while the new one loads
    fetch(`https://jsonplaceholder.typicode.com/users/${userId}`, { signal: controller.signal }) // ask a free test API for this user
      .then((res) => res.json())                                 // turn the reply into a JavaScript object
      .then((data) => setUser(data))                             // save it in state → React draws the screen again with it
      .catch((err) => {                                          // runs if the request fails or is cancelled
        if (err.name !== 'AbortError') console.error(err);       // a cancel is expected, so only show real errors
      });                                                        // end of the fetch chain
    return () => controller.abort();                             // CLEANUP: cancel this request if userId changes or the card goes away
  }, [userId]);                                                  // [userId] = run again only when userId changes

  if (!user) return <p>Loading…</p>;                             // no data yet → show a loading message
  return <h2>{user.name}</h2>;                                   // data is here → show the user's name
}                                                                // end of UserCard

export default function App() {                                  // the main component of the app
  const [id, setId] = useState(1);                               // which user to show; starts at user 1
  return (                                                       // what App draws on the screen
    <main>                                                       {/* a box around the page */}
      <button onClick={() => setId(id + 1)}>Next user</button>   {/* click → id + 1 → UserCard's effect runs again */}
      <UserCard userId={id} />                                   {/* send id down as the userId prop */}
    </main>                                                      // end of the box
  );                                                             // end of what App returns
}                                                                // end of App
```

**Try this:** click "Next user" very fast. Each click cancels the old request in the cleanup. So you never see the wrong user's name flash on the screen.

## 🔍 Deeper version

**When exactly does it run?** React works in this order:
1. It renders your component.
2. It updates the real page (the [DOM](glossary:dom)).
3. The browser usually paints the screen.
4. Only *then* does `useEffect` run.

So the user sees the screen without waiting for your effect. Sometimes you must measure or change the layout *before* the browser paints, to avoid a flicker. For that, use `useLayoutEffect`. You will rarely need it.

**How React compares dependencies.** React checks each dependency against its value from the last render. It uses `Object.is`, which is almost the same as `===`.
- Numbers and strings are compared by **value**.
- **Objects, arrays and functions are compared by reference** (by "which object is it", not "what's inside").

So a new `{}` or `() => {}` made during render counts as "different" every time. The effect then runs again after every render.

| Dependency array | When the effect runs |
|---|---|
| *(none)* | after **every** render (usually not what you want) |
| `[]` | once, after the **first** render |
| `[userId]` | after the first render, and **whenever `userId` changes** |

**The cleanup order.** Say `userId` changes from 1 to 2. React does this:
1. It renders with the new value.
2. It runs the **old** effect's cleanup. (This cancels request 1.)
3. It runs the **new** effect. (This starts request 2.)

When the component is removed from the screen, the last cleanup runs one more time.

**Race conditions.** A race condition is when the result depends on which job finishes first. Say request 1 is slow and request 2 is fast. Without cleanup, request 1 can finish **last**. Then it overwrites the screen with the wrong user. Cancelling in the cleanup fixes this. Keeping an `ignore` flag also works.

**StrictMode in development.** Since React 18, `<StrictMode>` runs every effect like this: mount → cleanup → mount. This happens **in development only**. If your app breaks, or a double API call causes a problem, your cleanup is missing or wrong. This does not happen in production.

**Stale values (stale closures).** The effect function is a [closure](topic:javascript/closures). It sees the props and state from the render where it was made. If you leave a value out of the dependency array, the effect keeps using an **old** value. Keep the `react-hooks/exhaustive-deps` lint rule on. It warns you about missing dependencies.

**You might not need an effect.** Don't use an effect for things you can work out during render:
- A full name made from `first + last`? Just calculate it in the render.
- Something that should happen *because the user clicked*? Do it in the click handler.

In bigger apps, use a library like TanStack Query (React Query) for loading data. It handles caching, loading states, retries and race conditions for you.

:::version[Version note]
**React 19.2** added `useEffectEvent`. It lets an effect read the latest props or state *without* adding them as dependencies. It's useful for things like logging or analytics. The rules above still apply to everything else.
:::

## 🎯 Why do we use it?

A React component should be "pure". That means the same props and state always give the same screen. But real apps need to **talk to the outside world**. They load data, start timers, connect WebSockets, watch the window size and change `document.title`.

`useEffect` gives these jobs a safe place:
- They run **after** the screen is shown, so the app stays fast.
- They run again **only when their data changes**.
- The **cleanup** stops them properly. So you don't waste memory or show old data.

## ⚠️ Common mistakes

- **Forgetting the cleanup.** Timers, event listeners and sockets keep running after the component is gone. This causes a [memory leak](glossary:memory-leak).
- **Infinite loops.** You set state inside the effect, and that same state is in the dependency array. Or an object or function made during render is in the array. Fix the dependencies, or wrap the object or function with `useMemo` or `useCallback`.
- **Lying about dependencies.** You leave a value out "so it runs only once". Then the effect uses an old value. Follow the lint rule instead.
- **Making the effect function `async`** (`useEffect(async () => …)`). An async function always returns a promise. But React expects nothing, or a cleanup function. Write an async function *inside* the effect and call it.

## 🗣️ How to answer in an interview

> "useEffect lets a component run side effects, like fetching data, timers or subscriptions. It runs after React has rendered and painted the screen. It takes a function and a dependency array. With no array, it runs after every render. With an empty array, it runs once after mount. With values, it runs again when any of them change. React compares them with Object.is, so objects and functions made during render count as new every time.
>
> The function I return is the cleanup. React runs it before the next run of the effect, and on unmount. I use it to clear intervals, remove listeners, close sockets and abort fetch requests with AbortController. This also prevents race conditions, where an old, slow response overwrites a newer one.
>
> I watch for two bugs. Infinite loops, from setting state that is also a dependency. And stale values, from missing dependencies. That's why I keep the exhaustive-deps lint rule on. And if an API is called twice in development, that's StrictMode testing my cleanup. It's not a production bug."

[FILL IN: a real useEffect bug you found or fixed in the recruiter or candidate screens at SkillKeepr, if you have one. Only add it if it's true.]

## 🔁 Follow-up questions

### What is the difference between useEffect and useLayoutEffect?

`useEffect` runs **after** the browser paints. So it doesn't slow down what the user sees. `useLayoutEffect` runs **after the DOM updates but before the paint**. Use it only when you must measure or fix the layout to avoid a flicker. For example, placing a tooltip.

### Why does my API get called twice when the page loads?

In development, React 18+ StrictMode mounts every component, removes it, and mounts it again. It does this to check that your effects clean up properly. It only happens in development. Make the effect safe to run twice by cancelling in the cleanup. Or use a data library that removes duplicate requests.

### Can the function passed to useEffect be async?

Not directly. An `async` function always returns a promise. But React expects the effect to return nothing, or a cleanup function. Write it like this: `useEffect(() => { async function load() { … } load(); }, [id]);`.

### How do you avoid race conditions when fetching in an effect?

Cancel the old request in the cleanup with `AbortController`. Or use a local flag: set `let ignore = false`, set it to `true` in the cleanup, and skip `setState` when it's `true`. Libraries like TanStack Query do this for you.

### How do you run code only when the component is removed?

Use an empty dependency array, and put the code in the cleanup: `useEffect(() => () => { /* runs on unmount */ }, []);`.

## ✅ Quick check

### 1. The component first appears, then re-renders 3 times with the same `id`. How many times does "effect" print?

```jsx
useEffect(() => {                 // the effect
  console.log('effect');          // show a message each time it runs
}, [id]);                         // depends only on id
```

:::answer
**Once** (in production). The effect runs after the first render. After that, it runs only if `id` changes, and here it didn't. In development with StrictMode, you would see it twice on the first mount.
:::

### 2. What's wrong with this code?

```jsx
useEffect(() => {                                    // the effect
  const id = setInterval(() => setSeconds((s) => s + 1), 1000); // add 1 every second (1000 ms)
}, []);                                              // run once
```

- A) Nothing
- B) The interval is never cleared, so it keeps running after the component is gone
- C) `[]` should be removed

:::answer
**B.** There is no cleanup. Add `return () => clearInterval(id);` inside the effect.
:::

### 3. Why does this cause an infinite loop?

```jsx
const [data, setData] = useState([]);              // data starts as an empty list
useEffect(() => {                                  // the effect
  setData([...data, 1]);                           // makes a NEW array every time
}, [data]);                                        // depends on data
```

:::answer
The effect changes `data`, and `data` is in its own dependency array. A new array is a new reference, so React sees a change. It re-renders and runs the effect again, forever. Don't put state you set inside the effect into its own dependencies. Or move this logic into an event handler.
:::
