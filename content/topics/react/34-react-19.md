---
title: "What's new in React 19 (Actions, use, ref as a prop)"
stack: react
order: 34
level: Advanced
mustKnow: false
askedFrequency: common
summary:
  - "React 19 (December 2024) added Actions: async functions for forms and updates, with pending state, errors and form reset handled for you."
  - "New hooks: useActionState (result + pending of an action), useOptimistic (show the result before the server answers), and useFormStatus."
  - "The use() API reads a promise or a context, and unlike hooks it can be called inside if statements."
  - "ref is now a normal prop (forwardRef is on its way out), <Context> works as a provider, and <title>/<meta> can be written inside components."
  - "React 19.2 (October 2025) added <Activity> and useEffectEvent. React Compiler 1.0 can memoise automatically."
cards:
  - q: What are Actions in React 19?
    a: Async functions used in transitions or passed to a form's action prop. React tracks their pending state, errors and optimistic updates, and resets the form after a successful submit.
  - q: What does useActionState return?
    a: "[state, formAction, isPending]: the last result of the action, a function to pass to <form action>, and whether it is still running."
  - q: What is useOptimistic for?
    a: Showing the expected result immediately (like a new comment) while the request is still running, then switching to the real server result or rolling back on failure.
  - q: How is use() different from a hook?
    a: use() reads a promise (suspending until it resolves) or a context. Unlike hooks, it can be called inside conditions and loops.
  - q: Name some React 19 changes for refs and context.
    a: Function components can take ref as a normal prop (no forwardRef needed), ref callbacks can return a cleanup function, and you can render <MyContext value={...}> instead of <MyContext.Provider>.
---

## 💡 What is it?

**React 19** is the major version released in **December 2024**. Smaller updates followed: **19.1** (March 2025) and **19.2** (October 2025).

The biggest idea is **Actions**. An Action is an **async function** for a form or an update. React handles the waiting state, errors and form reset for you.

It also added new [hooks](glossary:hook), a `use()` API, simpler refs and context, and support for page metadata.

## 🏠 Real-life example

Think of **submitting your homework online**.

Before, you had to watch everything yourself: press Submit, show "Uploading…", show an error if it failed, clear the form when done. React 19 is like a smart homework portal that **does this paperwork for you**.

- **Pressing Submit** = calling the Action.
- **The portal showing "Uploading…"** = `isPending`.
- **"Submitted ✓" shown at once, even before the teacher gets it** = `useOptimistic`.
- **The portal's message after upload ("Saved" or "File too big")** = the state from `useActionState`.
- **The form clearing itself** = React resetting the form after a successful Action.

## 🧑‍💻 Code example

Make a React 19 app with `npm create vite@latest` (pick React). Paste this into `src/App.jsx` and run `npm run dev`.

```jsx
import { useActionState } from 'react';                                    // React 19 hook for Actions

async function saveName(previousState, formData) {                         // the Action: gets the old state + form data
  const name = formData.get('name');                                       // read the "name" field from the form
  await new Promise((r) => setTimeout(r, 300));                            // pretend to call the server (300 ms)
  if (!name) return { error: 'Name is required', saved: null };            // empty → return an error state
  return { error: null, saved: name };                                     // success → return the saved name
}                                                                          // end of the Action

export default function App() {                                            // the main component
  const [state, formAction, isPending] = useActionState(saveName, { error: null, saved: null }); // result, action, pending flag
  return (                                                                 // what App draws
    <form action={formAction}>                                             {/* React 19: a function as the form action */}
      <input name="name" placeholder="Candidate name" />                   {/* no useState needed for the input */}
      <button disabled={isPending}>{isPending ? 'Saving…' : 'Save'}</button> {/* disabled while saving */}
      {state.error && <p>{state.error}</p>}                                {/* show the error, if any */}
      {state.saved && <p>Saved: {state.saved}</p>}                         {/* show the saved name, if any */}
    </form>                                                                // end of the form
  );                                                                       // end of return
}                                                                          // end of App
```

**What happens** (checked with React 19 + Testing Library):

```text
Click Save with an empty box → button shows "Saving…" → "Name is required"
Type "Hari", click Save      → button shows "Saving…" → "Saved: Hari"
After a successful save, the form clears itself.
```

## 🔍 Deeper version

**React 19.0 — the main features:**

| Feature | What it does |
|---|---|
| **Actions** | Async functions in `startTransition` or `<form action={fn}>`. React tracks pending state and errors, and resets the form on success. |
| `useActionState(fn, initial)` | Returns `[state, formAction, isPending]`. Replaces most hand-written "loading/error/result" state. |
| `useOptimistic(state, updateFn)` | Shows a temporary result at once, then the real result (or a rollback) when the Action ends. |
| `useFormStatus()` (from `react-dom`) | Lets a child, like a Submit button, read whether its parent form is submitting. |
| `use(promiseOrContext)` | Reads a promise (and suspends until it resolves) or a context. Can be called inside `if` statements. |
| `ref` as a prop | Function components can read `ref` from props, so `forwardRef` is no longer needed. |
| Ref cleanup | A ref callback can return a cleanup function. |
| `<Context value={…}>` | Use the context itself as the provider, instead of `<Context.Provider>`. |
| Document metadata | `<title>`, `<meta>` and `<link>` written in a component are moved into `<head>`. |
| Resource APIs | `preload`, `preinit` and stylesheet `precedence` help load fonts, scripts and CSS earlier. |
| Server Components and Server Actions | Stable in React 19, used through frameworks like Next.js. |
| Better errors | Clearer hydration error messages, and new `onCaughtError` / `onUncaughtError` root options. |

**Removed or changed in 19.0:** `ReactDOM.render` and `hydrate` (use `createRoot` and `hydrateRoot`), string refs, legacy context, `propTypes` checks and `defaultProps` on function components (use default parameters), and `findDOMNode`.

**React 19.1** focused on debugging, for example **owner stacks**, which show which component created another.

**React 19.2:**
- `<Activity mode="hidden">` hides part of the UI but **keeps its state**, like a tab you'll come back to.
- `useEffectEvent` lets an effect read the latest props or state **without** adding them as dependencies.
- New **Performance tracks** in Chrome DevTools show React's work on a timeline.

**React Compiler 1.0** (October 2025) is a build-time tool. It adds memoisation automatically, so you write fewer `useMemo`, `useCallback` and `React.memo` calls.

## 🎯 Why do we use it?

Forms and data updates were full of repeated code: `isLoading` state, error state, disabling buttons, clearing inputs, and rolling back optimistic updates. Actions and the new hooks put that logic into React itself, with fewer bugs.

`ref` as a prop and `<Context>` as a provider remove boilerplate. `use()` and Suspense make async data easier to read. Knowing these changes also shows interviewers you keep up with React.

## ⚠️ Common mistakes

- **Using old tutorial code** like `ReactDOM.render` in a React 19 app. It was removed.
- **Mixing up `useActionState` and `useFormStatus`.** `useFormStatus` only reads the status of the **parent** `<form>`, so it must be used in a child component.
- **Calling `use()` with a promise created during render.** A new promise every render means it suspends forever. Create the promise outside, or cache it.
- **Thinking every app must rewrite to Actions.** Old patterns still work. Adopt the new ones where they help.

## 🗣️ How to answer in an interview

> "React 19 was released in December 2024. The biggest change is Actions: async functions you pass to a form's action or run in a transition. React tracks the pending state, errors and form reset for you. The new hooks are useActionState, which gives me the result, a form action and isPending, useOptimistic for instant feedback, and useFormStatus for submit buttons.
>
> There's also the use() API to read a promise or context, and it can be called conditionally. ref is now a normal prop, so forwardRef isn't needed, and a context can be rendered directly as its provider. React 19.2 added Activity, to hide UI but keep its state, and useEffectEvent. And React Compiler 1.0 can memoise automatically at build time."

[FILL IN: which React version SkillKeepr uses, and whether you've used any React 19 features. The code guide says the platform is on React 18.3.]

## 🔁 Follow-up questions

### What is an optimistic update?

You show the expected result **before** the server confirms it. For example, a "Like" count goes up at once. If the request fails, you roll back. `useOptimistic` does the rollback automatically when the Action ends.

### Can `use()` replace `useEffect` for data fetching?

It can read a promise inside `Suspense`, but you must create and cache the promise outside the component, usually in a framework or a data library. For most apps, TanStack Query or a framework's loaders are still the easier path.

### Why was `forwardRef` needed before?

`ref` was a special prop, so React removed it from the props object. `forwardRef` was the way to receive it. In React 19, function components get `ref` as a normal prop.

### What happens to `defaultProps` on function components?

It's ignored in React 19. Use JavaScript default parameters instead, like `function Button({ size = 'md' })`.

## ✅ Quick check

### 1. What are the three values returned by `useActionState`?

:::answer
**`[state, formAction, isPending]`**: the last result of the Action, a function to pass to `<form action>`, and a boolean that is true while the Action runs.
:::

### 2. Which of these can be called inside an `if` statement?

- A) `useState`
- B) `useEffect`
- C) `use`

:::answer
**C) `use`.** It's an API, not a normal hook, so it can be called conditionally. `useState` and `useEffect` must follow the rules of hooks: top level only.
:::

### 3. In React 19, how do you provide a context value?

:::answer
You can render the context itself: `<ThemeContext value="dark">…</ThemeContext>`. The old `<ThemeContext.Provider value="dark">` still works.
:::
