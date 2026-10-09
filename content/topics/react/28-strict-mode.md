---
title: StrictMode and effects running twice in development
stack: react
order: 28
level: Intermediate
mustKnow: false
askedFrequency: common
summary:
  - "<StrictMode> is a development-only helper. It does extra checks to find bugs early. It adds nothing in production."
  - In development it renders components twice, and runs every effect as mount → cleanup → mount.
  - If an effect breaks or an API call causes trouble when it runs twice, your cleanup is missing or wrong.
  - Fix the effect (abort the request, clear the timer), don't remove StrictMode.
  - It also warns about old, unsafe APIs.
cards:
  - q: What is React StrictMode?
    a: A wrapper component that runs extra checks in development only, to find bugs like missing effect cleanups. It does nothing in production.
  - q: Why does my API get called twice when the page loads?
    a: In development, StrictMode mounts, cleans up and mounts every component again. So each effect runs twice. It doesn't happen in production.
  - q: Should I remove StrictMode to stop the double call?
    a: No. The double run shows that your effect is not safe to repeat. Add a cleanup (for example abort the fetch) or use a data library that removes duplicate requests.
  - q: What does StrictMode do twice?
    a: It calls your component function twice per render, runs effects as mount → cleanup → mount, and calls ref callbacks twice. All in development only.
  - q: Does StrictMode slow down production?
    a: No. All its checks are removed from the production build.
---

## 💡 What is it?

`<StrictMode>` is a special [component](glossary:component) from React. You wrap your app in it.

It only works **in development**. It does extra checks to show bugs early. For example, it runs every [effect](glossary:side-effect) **twice** on purpose.

In the production build, it does nothing at all.

## 🏠 Real-life example

Think of a **driving test examiner**.

Before you get your licence, the examiner makes you **park twice, stop twice and start again**. On real roads, nobody makes you do it twice. But in the test, doing it twice shows if your driving is safe every time.

- The **driving test** = development mode.
- The **examiner** = StrictMode.
- **"Do it again"** = React running your effect a second time.
- **Real roads** = production. No double checks there.
- **Failing the test** = your app breaks when the effect runs twice. That means it has a bug, like a missing cleanup.

## 🧑‍💻 Code example

Make a React app with `npm create vite@latest` (pick React). Replace `src/main.jsx` and `src/App.jsx` with this. Run `npm run dev` and open the browser console.

```jsx
// src/main.jsx
import { StrictMode } from 'react';                   // the development helper component
import { createRoot } from 'react-dom/client';        // the function that starts React in the page
import App from './App';                              // our app component

createRoot(document.getElementById('root')).render(   // find <div id="root"> and draw into it
  <StrictMode>                                        {/* turn on the extra checks (development only) */}
    <App />                                           {/* the whole app is inside StrictMode */}
  </StrictMode>,                                      // end of StrictMode
);                                                    // end of render
```

```jsx
// src/App.jsx
import { useEffect } from 'react';                    // bring in the useEffect hook

export default function App() {                       // our component
  useEffect(() => {                                   // runs after the screen is drawn
    console.log('effect: connect');                   // pretend we open a connection
    return () => console.log('cleanup: disconnect');  // cleanup: close it again
  }, []);                                             // [] = run once after the first render
  return <h1>Open the console</h1>;                   // what we show on the screen
}                                                     // end of App
```

**Console output in development:**

```text
effect: connect
cleanup: disconnect
effect: connect
```

**In the production build** (`npm run build` then `npm run preview`) you only see `effect: connect`, once.

## 🔍 Deeper version

**What StrictMode does in development:**

| Check | What happens | Which bug it finds |
|---|---|---|
| Double render | Your component function runs twice for each render | Code that changes things during render (not "pure") |
| Effects run twice | mount → cleanup → mount, right after the first mount | Missing or wrong [cleanup](glossary:cleanup) |
| Ref callbacks run twice | The ref is set, cleared, then set again | Missing ref cleanup (React 19) |
| Old API warnings | Warns about deprecated APIs | Code that will break in future versions |

**Why run effects twice?** React wants your app to survive being unmounted and mounted again. That happens in real life too: fast navigation, hot reload, and newer features that keep hidden screens around. If an effect can't run twice safely, it will break in those cases.

**Effects running twice is a symptom, not the bug.** A good effect is **symmetrical**:
- connect → disconnect
- add listener → remove listener
- start timer → clear timer
- start fetch → abort fetch

If setup and cleanup match, the double run is invisible to the user.

**Double API calls.** A `fetch` in an effect runs twice in development. Fix it with `AbortController` in the cleanup (see [useEffect](topic:react/use-effect)). Or use a data library like [TanStack Query](topic:react/tanstack-query), which removes duplicate requests and caches results.

**Things that are NOT fine to do twice:** sending an analytics "purchase" event or a POST that creates data, inside an effect. Move these into event handlers, like the button's `onClick`.

:::version[Version note]
The effect double-run arrived with **React 18**. **React 19** added the ref-callback double run, and in development, the second render reuses the results of `useMemo` and `useCallback` from the first one.
:::

## 🎯 Why do we use it?

Some bugs only appear later, in rare cases. A timer that was never cleared slowly leaks memory. A socket that was never closed sends duplicate messages.

StrictMode **forces these bugs to show up right away**, while you are coding, instead of in front of users. It costs nothing in production.

## ⚠️ Common mistakes

- **Removing StrictMode** to stop double API calls. This hides the bug instead of fixing it.
- **Using a `useRef` flag to "run only once"**. It works around the check, but the real problem (no cleanup) stays.
- **Thinking production also runs effects twice.** It does not.
- **Doing one-time actions in effects**, like creating a record with POST. Put them in event handlers.

## 🗣️ How to answer in an interview

> "StrictMode is a development-only wrapper that runs extra checks to find bugs early. Since React 18, it mounts every component, runs the cleanup, and mounts it again, so each effect runs twice. It also renders components twice to catch impure render code. None of this happens in production.
>
> If an API is called twice in development, I don't remove StrictMode. It's telling me my effect isn't safe to repeat. I make the effect symmetrical: abort the fetch, clear the timer, remove the listener in the cleanup. For data fetching, a library like TanStack Query also handles duplicates and caching. And anything that should happen once because the user did something, like a POST, goes in the event handler, not in an effect."

## 🔁 Follow-up questions

### Does StrictMode affect production performance?

No. All of its checks are removed in the production build. It only costs a little time while you develop.

### How do you stop the double fetch in development?

Don't stop it; make it safe. Abort the old request in the cleanup with `AbortController`. Then the first request is cancelled and only one result is used. A data library also removes the duplicate.

### Why does my `console.log` inside the component print twice?

StrictMode calls your component function twice per render in development. This checks that rendering has no side effects. React 19 shows the second log dimmed in DevTools.

### Can I turn StrictMode on for only part of the app?

Yes. Wrap only that part of the tree in `<StrictMode>`. This helps when you add it slowly to an old app.

## ✅ Quick check

### 1. In production, how many times does this effect print "hi" on the first mount?

```jsx
useEffect(() => {          // the effect
  console.log('hi');       // print a message
}, []);                    // run once after mount
```

:::answer
**Once.** The double run only happens in development with StrictMode. In development you would see it twice.
:::

### 2. Your effect starts a `setInterval`. In development, the counter goes up twice as fast. What's wrong?

- A) StrictMode is broken
- B) The effect has no cleanup, so two intervals are running
- C) `setInterval` doesn't work in React

:::answer
**B.** StrictMode ran the effect twice. Without `return () => clearInterval(id)`, the first interval never stops. Add the cleanup and only one interval runs.
:::
