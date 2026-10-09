---
title: Prop drilling through 5 levels
template: scenario
stack: debugging
order: 16
level: Basic
mustKnow: false
askedFrequency: common
summary:
  - "Symptom: a value like the logged-in user is passed through 5 components, and 3 of them never use it."
  - "Detect: in code review, many components accept props only to pass them down; changing one prop means editing many files."
  - "Fix by choice: composition (pass children) for layout, Context for small shared data, Redux or another store for big, often-changing data."
  - "Context isn't free: every consumer re-renders when the value changes, so keep contexts small and memoise the value."
  - "Prevent: keep state close to where it's used, and only lift or share it when two parts really need it."
cards:
  - q: What is prop drilling?
    a: Passing a prop through several components that don't use it, only so a deep child can get it.
  - q: Name three ways to fix prop drilling.
    a: Component composition (pass ready-made children), the Context API, or a state store like Redux Toolkit.
  - q: When is Context the right fix?
    a: For small data many components read and that changes rarely, like the logged-in user, theme or language.
  - q: When is Redux better than Context?
    a: For large shared data that changes often and is updated from many places, like lists, filters and server data — Redux gives selectors, so components only re-render for the slice they use.
  - q: What is composition, in one line?
    a: Instead of passing data down, the parent builds the child that needs it and passes that child down as children.
---

## 💡 What is it?

The top of the app knows the **logged-in user**. A small `Avatar` component deep in the page needs it. So the user is passed down like this:

`App → Layout → Header → UserMenu → Avatar`

`Layout`, `Header` and `UserMenu` don't use `user`. They only **pass it along**. This is called **prop drilling**. It makes code noisy and hard to change.

## 🏠 Real-life example

Think of passing a **note in class**.

You want to give a note to a friend on the last bench. You pass it to the student in front, who passes it back, and so on. Five students touch it, but none of them needs it. If one forgets, the note is lost.

- **The note** = the prop (for example, the user).
- **The students passing it along** = the middle components.
- **Your friend on the last bench** = the deep component that needs it.
- **A notice board everyone can read** = Context.
- **The school office that keeps all records** = Redux, a central store.
- **Walking to your friend and giving it directly** = composition (pass the ready child down).

## 🔎 Detect

- In code review, components accept props they **never use**, only to pass them on.
- Changing one prop name means editing **many files**.
- Components are hard to reuse, because they need props from far away.
- React DevTools shows the same prop at many levels of the tree.

## 🐞 Debug

Ask three questions before choosing a fix:

1. **Who really needs this data?** One deep child, or many components across the app?
2. **How often does it change?** Rarely (user, theme), or very often (search text, lists)?
3. **Do the middle components only arrange layout?** Then composition may solve it without any new state tool.

## 🔧 Fix

**Before — `user` drilled through components that don't use it:**

```jsx
function App() {                                             // the top component
  const user = { name: 'Hari' };                             // the logged-in user lives here
  return <Layout user={user} />;                             // ❌ Layout doesn't need it, only passes it on
}                                                            // end of App
function Layout({ user }) { return <Header user={user} />; } // ❌ passes it again
function Header({ user }) { return <UserMenu user={user} />; } // ❌ and again
function UserMenu({ user }) { return <Avatar user={user} />; } // ❌ and again
function Avatar({ user }) { return <span>{user.name}</span>; } // finally used here
```

**Fix 1 — Context (for small, rarely-changing data like the user):**

```jsx
import { createContext, useContext, useMemo, useState } from 'react'; // bring in the Context tools

const UserContext = createContext(null);                     // a "notice board" for the user; null = no user yet

function App() {                                             // the top component
  const [user] = useState({ name: 'Hari' });                 // the logged-in user
  const value = useMemo(() => ({ user }), [user]);           // keep the same object unless user changes
  return (                                                   // what to draw
    <UserContext.Provider value={value}>                     {/* everything inside can read the user */}
      <Layout />                                             {/* ✅ no user prop needed */}
    </UserContext.Provider>                                  // end of provider
  );                                                         // end of return
}                                                            // end of App
function Layout() { return <Header />; }                     // ✅ clean: no props to pass
function Header() { return <UserMenu />; }                   // ✅ clean
function UserMenu() { return <Avatar />; }                   // ✅ clean
function Avatar() {                                          // the component that needs the user
  const { user } = useContext(UserContext);                  // ✅ read it straight from the "notice board"
  return <span>{user.name}</span>;                           // show the name
}                                                            // end of Avatar
```

**Fix 2 — Composition (when middle components only do layout):**

```jsx
function App() {                                             // the top component
  const user = { name: 'Hari' };                             // the user lives here
  return (                                                   // what to draw
    <Layout header={<Header menu={<Avatar user={user} />} />} /> // ✅ build Avatar here and pass it down ready-made
  );                                                         // end of return
}                                                            // end of App
function Layout({ header }) { return <div>{header}</div>; }  // just places the header; knows nothing about user
function Header({ menu }) { return <nav>{menu}</nav>; }      // just places the menu
```

**Fix 3 — a store (Redux Toolkit) for big, often-changing data:** keep things like candidate lists and filters in a slice, and read only what you need with `useSelector((s) => s.jobs.filters)`. Components re-render only when their selected value changes.

## 🛡️ Prevent

- **Keep state close** to where it's used. Only lift it up when two siblings need it.
- Use **composition** first for layout components (pass `children` or named elements).
- Use **Context** for small, app-wide data. Split big contexts into smaller ones, and memoise the value with `useMemo`, so consumers don't re-render for no reason.
- Use **Redux Toolkit** (or React Query for server data) for large, frequently-changing shared data.
- In code reviews, question props that are only passed through.

## 🗣️ How to answer in an interview

**Short version (20 seconds):**

> "Prop drilling is passing props through components that don't use them. I fix it based on the data: composition when the middle components only do layout, Context for small app-wide data like the user or theme, and Redux for big, often-changing shared state. I keep Context values memoised and small to avoid extra re-renders."

**Full version:**

> "I notice prop drilling in code review: components accept props only to forward them, and renaming one prop touches five files.
>
> I don't jump straight to Context. First I ask who needs the data and how often it changes. If the middle components only arrange layout, composition is cleanest: the parent builds the deep child and passes it down as children, so nothing is drilled.
>
> For small data many components read, like the logged-in user, theme or permissions, I use Context. I memoise the provider value and split contexts, because every consumer re-renders when the value changes.
>
> For large shared data that changes often, like lists and filters, I use Redux Toolkit with selectors, so each component only re-renders for its own slice."

[FILL IN: how your project shares the logged-in user and permissions across pages, at a public-safe level, if you know it.]

## 🔁 Follow-up questions

### Is prop drilling always bad?

No. Passing a prop down **one or two levels** is normal and clear. It becomes a problem when many middle components only forward it.

### What's the performance risk of Context?

When the context value changes, **every** component that reads it re-renders. If you put fast-changing data (like typing) in a big context, the whole app re-renders. Keep contexts small and stable.

### Context vs Redux — how do you choose?

Context for small, rarely-changing data, with no extra library. Redux for large, often-updated state with many writers, plus DevTools, middleware and selectors. For server data, React Query is often better than both.

### What is "lifting state up"?

Moving state to the closest common parent, so two siblings can share it. It's the first step; drilling only becomes a problem when that parent is far above.

## ✅ Quick check

### 1. Only `Avatar` uses `user`, and `Layout`, `Header` and `UserMenu` only arrange the page. What's the simplest fix?

- A) Redux
- B) Composition: build `<Avatar user={user} />` in App and pass it down as an element
- C) Put `user` in localStorage

:::answer
**B.** Composition removes the drilling without any new state tool.
:::

### 2. A context holds `{ user, theme, searchText }`. Typing in search feels slow across the app. Why?

:::answer
`searchText` changes on every key press, so **every** component that reads this context re-renders. Move `searchText` out of the context (keep it local), or split the context.
:::
