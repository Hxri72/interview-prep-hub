---
title: Context performance pitfalls and splitting context
stack: redux-context
order: 3
level: Intermediate
mustKnow: true
askedFrequency: common
summary:
  - When a context value changes, EVERY component that reads it re-renders — React.memo can't stop it.
  - "A common bug: value={{ user }} makes a new object on every render, so readers re-render even when nothing changed."
  - Fix 1 — wrap the value in useMemo (and functions in useCallback) so it stays the same object.
  - Fix 2 — split one big context into smaller ones (data vs dispatch, user vs theme), so readers only listen to what they need.
  - For big, fast-changing state, use Redux or Zustand, where each component subscribes to just one piece.
cards:
  - q: Why can Context make an app slow?
    a: Every component that reads a context re-renders whenever its value changes. A big, frequently changing context re-renders many components.
  - q: "What's wrong with value={{ user, setUser }}?"
    a: It creates a new object every time the provider renders. Readers see a "changed" value and re-render, even if user didn't change.
  - q: How do you fix an unstable context value?
    a: Wrap it in useMemo with the right dependencies, and wrap functions in useCallback, so the value stays the same object.
  - q: What does "splitting context" mean?
    a: Using several small contexts instead of one big one, for example a state context and a dispatch context, so each reader only re-renders for the data it uses.
  - q: Does React.memo prevent re-renders caused by context?
    a: No. memo only checks props. A component that reads a context re-renders when that context's value changes.
---

## 💡 What is it?

Context is easy to use. But it has one rule that can make apps slow.

**When a context's value changes, every component that reads it re-renders.** [React.memo](topic:react/react-memo) can't stop this.

So two things matter: keep the value **stable** (the same object when nothing changed), and keep each context **small**.

## 🏠 Real-life example

Think of **one school notice board for everything**: exam dates, sports news, the canteen menu and lost-and-found.

Every time anyone changes anything, a bell rings. Every student runs to read the board, even if they only care about exams.

Worse: the office reprints the **whole board every hour**, even when nothing changed. The bell rings anyway.

- **One big board** = one big context.
- **The bell** = a re-render.
- **Reprinting with no change** = a new `value` object on every render.
- **Separate boards** for exams, sports and canteen = split contexts.
- **Only reprinting when something changes** = `useMemo`.

## 🧑‍💻 Code example

Make a React app with `npm create vite@latest` (pick React). Put this in `src/App.jsx`. Render `<BadApp />` and then `<GoodApp />`, and open the browser console.

```jsx
import { createContext, memo, useContext, useMemo, useState } from 'react'; // React tools

const UserContext = createContext(null);                  // one context for the user

const UserBadge = memo(function UserBadge() {             // memo = skip re-render if props are the same
  const { user } = useContext(UserContext);               // but it ALSO listens to the context
  console.log('UserBadge rendered');                      // count how often it renders
  return <p>User: {user}</p>;                             // show the user
});                                                       // end of UserBadge

export function BadApp() {                                // ❌ the slow version
  const [user] = useState('Hari');                        // the user never changes here
  const [count, setCount] = useState(0);                  // unrelated state: a click counter
  const value = { user };                                 // ❌ a NEW object on every render
  return (                                                // what BadApp shows
    <UserContext value={value} /* new value → every reader re-renders */>
      <UserBadge /* re-renders on every click */ />
      <button onClick={() => setCount(count + 1)} /* only changes count */>Clicked {count}</button>
    </UserContext>                                        // end of the provider
  );                                                      // end of what BadApp shows
}                                                         // end of BadApp

export function GoodApp() {                               // ✅ the fixed version
  const [user] = useState('Hari');                        // same user
  const [count, setCount] = useState(0);                  // same unrelated counter
  const value = useMemo(() => ({ user }), [user]);        // ✅ same object until user changes
  return (                                                // what GoodApp shows
    <UserContext value={value} /* same value → readers are skipped */>
      <UserBadge /* renders once */ />
      <button onClick={() => setCount(count + 1)} /* only changes count */>Clicked {count}</button>
    </UserContext>                                        // end of the provider
  );                                                      // end of what GoodApp shows
}                                                         // end of GoodApp
```

**Console output** (first render, then 2 clicks on the button):

```text
--- BadApp: first render
UserBadge rendered
--- BadApp: click the button 2 times
UserBadge rendered
UserBadge rendered
--- GoodApp: first render
UserBadge rendered
--- GoodApp: click the button 2 times
```

In `BadApp`, `UserBadge` re-renders on every click, even though `user` never changed. In `GoodApp`, `useMemo` keeps the same object, so `UserBadge` is skipped.

(If your `main.jsx` uses `<StrictMode>`, React renders twice in development, so you may see each line twice. That doesn't happen in production.)

## 🔍 Deeper version

**How React decides.** When the provider re-renders, React compares the new `value` with the old one using `Object.is`. A new object `{ user }` is never equal to the old object, even with the same content. So every reader re-renders.

**Fix 1 — keep the value stable.**

```jsx
const login = useCallback((u) => setUser(u), []);        // the same function every render
const value = useMemo(() => ({ user, login }), [user, login]); // a new object only when user changes
```

**Fix 2 — split the context.** Put data that changes at different speeds in different contexts:
- **State vs dispatch.** The `dispatch` from `useReducer` never changes. Put it in its own context. Buttons that only *send* actions then never re-render. See [Context + useReducer](topic:redux-context/context-use-reducer).
- **By topic.** `UserContext`, `ThemeContext`, `PermissionsContext`. Changing the theme doesn't re-render user readers.

**Fix 3 — move fast state out of context.** Context has no "selector". A component can't say "only tell me when `user.name` changes". For big, fast-changing state, use:
- **Redux Toolkit**: `useSelector` picks one piece, and the component re-renders only when that piece changes. See [useSelector](topic:redux-context/use-selector-dispatch).
- **Zustand**: same idea, smaller library.

**Fix 4 — keep the provider low.** Put the provider around the part of the tree that needs it, not around the whole app.

**How to find the problem.** Turn on "Highlight updates" in React DevTools, then record with the Profiler. A context change shows as "Context changed" in "why did this render". See [unnecessary re-renders](topic:debugging/unnecessary-re-renders).

:::note[React Compiler]
The **React Compiler** (stable since late 2025) adds memoisation for you, which can make `useMemo` around context values unnecessary. Many codebases don't use it yet, so you still need to know the manual fix for interviews.
:::

## 🎯 Why do we use it?

- **Speed.** One badly built context can re-render most of the app on every keystroke.
- **Predictability.** Components update only when their data changes, which makes bugs easier to find.
- **It shows you understand React's rendering.** Interviewers love this topic.

## ⚠️ Common mistakes

- **Inline objects or functions as the value**, like `value={{ user, setUser }}`. Use `useMemo` and `useCallback`.
- **One giant "AppContext"** with user, theme, cart and filters together. Split it.
- **Expecting `React.memo` to stop context re-renders.** It only checks props.
- **Putting fast-changing values in context**, like a text input value or a timer. Keep them local, or use a store with selectors.

## 🗣️ How to answer in an interview

> "When a context value changes, every component that reads it re-renders, and React.memo can't stop that. The most common bug is passing an inline object, like value={{ user, setUser }}. It's a new object on every render, so every reader re-renders even if nothing changed.
>
> I fix it in three ways. First, I wrap the value in useMemo and functions in useCallback, so it's stable. Second, I split contexts, for example state and dispatch separately, or user and theme separately. Third, if the state is big and changes often, I don't use Context for it. I use Redux Toolkit, where useSelector lets each component subscribe to only the piece it needs. To confirm the problem, I use the React DevTools Profiler, which shows 'context changed' as the reason for a render."

## 🔁 Follow-up questions

### Why doesn't React.memo help here?

`memo` compares props. Context is a separate input. When the context a component reads changes, React re-renders it no matter what its props are.

### Why put dispatch in its own context?

`dispatch` from `useReducer` is stable. It never changes. If it's in its own context, components that only send actions (like buttons) never re-render when the state changes.

### Can Context have selectors like Redux?

Not built in. A component re-renders on any change to the context value. Libraries like Zustand or Redux give you selectors. Some small libraries add selectors to context too.

### How do you prove a context is causing re-renders?

React DevTools Profiler with "Record why each component rendered" turned on. It will say "Context changed". Then re-test after the fix.

## ✅ Quick check

### 1. Will `Badge` re-render when `count` changes?

```jsx
const Badge = memo(function Badge() {                     // a memoised reader
  const { user } = useContext(UserContext);               // reads the context
  return <p>{user}</p>;                                   // shows the user
});
function App() {                                          // the provider owner
  const [count, setCount] = useState(0);                  // unrelated state
  return (
    <UserContext value={{ user: 'Hari' }} /* inline object */>
      <Badge />
      <button onClick={() => setCount(count + 1)}>+1</button>
    </UserContext>
  );
}
```

:::answer
**Yes.** `{ user: 'Hari' }` is a new object every time `App` renders, so the context value "changes" and `Badge` re-renders. Wrap the value in `useMemo`.
:::

### 2. Which change stops buttons that only call `dispatch` from re-rendering on every state change?

- A) Wrap the buttons in `React.memo`
- B) Put `dispatch` in its own context
- C) Use `useEffect` in the buttons

:::answer
**B.** `dispatch` never changes, so a dispatch-only context never triggers a re-render. `memo` alone doesn't help if the button reads the state context.
:::

### 3. True or false: `useMemo` on the context value helps even if the state inside the value changes on every keystroke.

:::answer
**False.** `useMemo` only helps when the data didn't change. If the data really changes every keystroke, readers must re-render. Split the context, or move that state to a store with selectors.
:::
