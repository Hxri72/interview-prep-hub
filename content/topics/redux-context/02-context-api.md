---
title: "Context API: createContext, Provider, useContext"
stack: redux-context
order: 2
level: Basic
mustKnow: true
askedFrequency: very common
summary:
  - Context shares a value with every component inside a provider, without passing props down by hand.
  - "Three steps: createContext() → wrap a part of the tree with the provider and a value → read it with useContext()."
  - When the provider's value changes, every component that reads that context re-renders.
  - In React 19 you can write <MyContext value={…}> directly (no .Provider), and read it with use(MyContext).
  - Best for small, rarely changing global data — logged-in user, theme, language.
cards:
  - q: What are the three steps to use Context?
    a: Create it with createContext(defaultValue), wrap part of the tree in a provider with a value, and read it with useContext (or use in React 19).
  - q: What does the default value in createContext do?
    a: It's used only when a component reads the context with no provider above it. It is not the starting state.
  - q: What happens when the provider's value changes?
    a: Every component that reads that context re-renders, even if it is wrapped in React.memo.
  - q: What changed in React 19 for Context?
    a: You can render <MyContext value={x}> directly as the provider, and read context with use(MyContext), which also works inside if statements.
  - q: Is Context a state-management tool?
    a: Not by itself. It only passes a value down. The state still lives in useState or useReducer in the provider component.
---

## 💡 What is it?

**Context** is React's built-in way to share a value with many [components](glossary:component) at once.

You put a value "on top" of part of the tree. Any component below can read it directly. You don't need to pass [props](glossary:props) through every level.

It has three parts: **create** the context, **provide** a value, and **read** it.

## 🏠 Real-life example

Think of a **school notice board**.

The principal pins a notice on the board in the hallway. Every classroom on that floor can read it. The principal doesn't walk into each class to tell every student.

- **Making the board** = `createContext()`.
- **Pinning a notice** = the provider with a `value`.
- **The hallway the board covers** = the part of the tree inside the provider.
- **A student reading the notice** = `useContext()` in a component.
- **Changing the notice** = changing the value. Everyone who reads the board sees the new notice.

## 🧑‍💻 Code example

Create a React app with `npm create vite@latest` (pick React). Replace `src/App.jsx` with this. Run `npm run dev`.

```jsx
import { createContext, useContext, useState } from 'react';   // the React tools we need

const UserContext = createContext(null);                        // 1. create the "notice board"; null = value when there is no provider

function Avatar() {                                             // a component deep in the tree
  const user = useContext(UserContext);                         // 3. read the notice board
  return <p>Avatar: {user.name}</p>;                            // show the user's name
}                                                               // end of Avatar

function Sidebar() {                                            // a middle component
  return <Avatar />;                                            // passes NOTHING down
}                                                               // end of Sidebar

export default function App() {                                 // the top component
  const [user, setUser] = useState({ name: 'Hari' });           // the shared data lives here
  return (                                                      // what App shows
    <UserContext value={user} /* 2. put user on the board (React 19 syntax) */>
      <Sidebar /* Avatar is inside Sidebar */ />
      <button onClick={() => setUser({ name: 'Asha' })} /* change the board */>Switch user</button>
    </UserContext>                                              // end of the board
  );                                                            // end of what App shows
}                                                               // end of App
```

**What you see:**

```text
Before the click:  Avatar: Hari   [Switch user]
After the click:   Avatar: Asha   [Switch user]
```

`Sidebar` never touches `user`. `Avatar` reads it straight from the context. When `App` changes the user, `Avatar` updates by itself.

## 🔍 Deeper version

**The default value is a fallback, not the starting state.** `createContext(null)` means "if there is no provider above, give `null`". The real starting value comes from the provider's `value`.

**The closest provider wins.** Providers can be nested. A component reads the value from the **nearest** provider above it. This is handy for themes: a dark section inside a light page.

**Context is not state management on its own.** It only *passes* a value. The state still lives in `useState` or [useReducer](topic:redux-context/context-use-reducer) inside the provider component. Context is the delivery truck, not the warehouse.

**Re-renders.** React compares the new `value` with the old one using `Object.is`, which is basically `===`. If it changed, **every** component reading that context re-renders. `React.memo` does **not** stop this. Read [Context performance](topic:redux-context/context-performance) to avoid slow apps.

:::version[Version note]
**React 19** changed two things:
- **Provider:** you can write `<UserContext value={user}>` directly. The old `<UserContext.Provider value={user}>` still works, but will be deprecated later.
- **Reading:** the new `use(UserContext)` works like `useContext`, but you can call it inside `if` statements and loops. `useContext` still works everywhere.
:::

**A safe custom hook.** Teams often wrap the context in a small hook that throws a clear error when the provider is missing:

```jsx
function useUser() {                                            // a custom hook around the context
  const user = useContext(UserContext);                         // read it
  if (user === null) throw new Error('useUser must be inside <UserContext>'); // clear error
  return user;                                                  // give it back
}                                                               // end of useUser
```

**Good uses:** logged-in user, theme, language, feature flags, a design-system config. **Weak uses:** a big list that changes on every keystroke.

## 🎯 Why do we use it?

- **No prop drilling.** Deep components read shared data directly. See [why state management](topic:redux-context/why-state-management).
- **Built into React.** No extra library, no setup.
- **Scoped.** A provider covers only part of the tree, so you can have different values in different sections.

## ⚠️ Common mistakes

- **Thinking the default value is the initial state.** It's only used when there's no provider.
- **Reading context outside the provider** and getting `null` or `undefined`. Use a custom hook that throws a clear error.
- **Passing a new object every render** (`value={{ user, setUser }}`). Every reader re-renders. Wrap it in `useMemo`.
- **Putting fast-changing data in one big context.** Split it, or use Redux for that data.

## 🗣️ How to answer in an interview

> "The Context API lets me share a value with every component inside a provider, without prop drilling. There are three steps: I create the context with createContext, I wrap part of the tree with a provider and a value, and components read it with useContext. In React 19, I can render the context itself as the provider, and I can also read it with the new use hook.
>
> Context only passes the value. The state still lives in useState or useReducer in the provider. When the value changes, every component that reads the context re-renders, even memoised ones. So I use Context for small, rarely changing data like the logged-in user or theme. I memoise the value object, and I split contexts when parts change at different speeds. For big, fast-changing shared state, I'd use Redux Toolkit."

## 🔁 Follow-up questions

### What is the default value in createContext for?

It's used only when a component reads the context and there's **no provider** above it. It's useful for tests and for safe fallbacks. It is not the starting state.

### Does React.memo stop a context re-render?

No. `memo` only compares props. If a memoised component reads a context and the context value changes, it still re-renders.

### Can you have more than one provider of the same context?

Yes. A component reads from the **nearest** provider above it. Nested providers can override the value for a section of the page.

### Context vs Redux — when do you pick which?

Context for small, rarely changing values. Redux (Toolkit) for large shared state that changes often, with DevTools, middleware and selectors that let each component subscribe to only the data it needs. See [how to choose](topic:redux-context/how-to-choose).

## ✅ Quick check

### 1. What does `Avatar` show here?

```jsx
const ThemeContext = createContext('light');                    // default value is 'light'
function Avatar() {                                             // a component
  const theme = useContext(ThemeContext);                       // read the context
  return <p>{theme}</p>;                                        // show it
}
export default function App() {                                 // no provider anywhere!
  return <Avatar />;                                            // render Avatar
}
```

:::answer
**`light`.** There's no provider above `Avatar`, so React uses the default value from `createContext('light')`.
:::

### 2. True or false: the value given to `createContext()` is the state that the provider starts with.

:::answer
**False.** The provider's `value` prop decides what readers get. The default is only for components with no provider above them.
:::

### 3. Which is the React 19 way to provide a value?

- A) `<UserContext.Provider value={user}>`
- B) `<UserContext value={user}>`
- C) Both work in React 19

:::answer
**C.** Both work. **B** is the new, shorter way. The `.Provider` form still works but is planned for deprecation.
:::
