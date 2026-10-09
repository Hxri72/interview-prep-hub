---
title: Why we need state management (prop drilling)
stack: redux-context
order: 1
level: Basic
mustKnow: true
askedFrequency: very common
summary:
  - "Prop drilling: passing data through many components that don't use it, just to reach one that does."
  - It makes code noisy, hard to change and easy to break.
  - Fixes, from small to big — move state closer, use composition (children), use Context, use a store like Redux.
  - Context is good for small data that rarely changes (user, theme). Redux suits big shared data that changes often.
  - Server data (lists from an API) is often best kept in a data-fetching library like TanStack Query.
cards:
  - q: What is prop drilling?
    a: Passing a prop through several middle components that don't need it, only so a deep child can use it.
  - q: Why is prop drilling a problem?
    a: Middle components get extra props they don't use. Renaming or adding data means editing many files. It's easy to break.
  - q: Name three ways to avoid prop drilling.
    a: Component composition (pass children), the Context API, and a global store like Redux Toolkit.
  - q: When is Context enough, and when do you need Redux?
    a: Context for small, rarely changing global data like the logged-in user or theme. Redux for large shared data that changes often, with many screens and DevTools.
  - q: Is all state global state?
    a: No. Keep state as local as possible. Only lift it up or make it global when several distant components really need it.
---

## 💡 What is it?

In React, data flows **down** from parent to child through [props](glossary:props).

Sometimes a component deep in the tree needs some data. Then every component in between must **pass it along**, even if it doesn't use it. This is called **prop drilling**.

**State management** means choosing a better home for shared [state](glossary:state), so any component can reach it directly.

## 🏠 Real-life example

Think of a **message passed down the rows of a classroom**.

The teacher at the front wants to give a note to a student in the last row. The note goes from row 1 to row 2 to row 3 to row 4. Rows 1, 2 and 3 don't need the note. They just pass it on. If one student forgets, the note is lost.

A better way: the teacher **pins the note on the notice board**. The student in the last row walks up and reads it.

- The **teacher** = the top component that owns the data.
- The **note** = the data (a prop).
- **Rows 1–3** = middle components that only pass the data along.
- The **last-row student** = the deep component that needs the data.
- The **notice board** = a shared place: Context or a Redux store.

## 🧑‍💻 Code example

This uses plain functions, so you can run it in Node. Save it as `drilling.js`. Run it with `node drilling.js`.

```js
// PROP DRILLING: the user must travel through every level
function App() {                                    // top of the tree; it owns the user
  const user = { name: 'Hari', role: 'recruiter' }; // the data we need deep down
  return Layout(user);                              // pass it down to Layout
}                                                   // end of App
function Layout(user) {                             // Layout does NOT use user…
  return Sidebar(user);                             // …but it must pass it on
}                                                   // end of Layout
function Sidebar(user) {                            // Sidebar does NOT use user either…
  return Avatar(user);                              // …it only passes it on
}                                                   // end of Sidebar
function Avatar(user) {                             // the ONLY function that needs user
  return `Avatar shows: ${user.name}`;              // finally we use it
}                                                   // end of Avatar
console.log(App());                                 // run the drilled version

// SHARED STORE: keep the data in one place that anyone can read
const store = { user: { name: 'Hari', role: 'recruiter' } }; // one shared box
function App2() { return Layout2(); }               // no user passed down
function Layout2() { return Sidebar2(); }           // middle level passes nothing
function Sidebar2() { return Avatar2(); }           // middle level passes nothing
function Avatar2() {                                // reads straight from the store
  return `Avatar2 shows: ${store.user.name}`;       // no props needed
}                                                   // end of Avatar2
console.log(App2());                                // run the shared-store version
```

**Output:**

```text
Avatar shows: Hari
Avatar2 shows: Hari
```

Both print the same thing. But in the second version, `Layout2` and `Sidebar2` know nothing about the user. In React, the "shared box" is Context or a Redux store. The difference: React also **re-renders** the readers when the shared data changes.

## 🔍 Deeper version

**Three kinds of state.** Before picking a tool, sort your state:

| Kind | Example | Good home |
|---|---|---|
| **Local UI state** | is this dropdown open? | `useState` in that component |
| **Shared client state** | logged-in user, theme, filters, a form wizard | Context, or Redux / Zustand |
| **Server state** | list of jobs from the API | TanStack Query or RTK Query (caching, refetching) |

**Fixes, from smallest to biggest:**
1. **Move state down.** Maybe the data only belongs in one small part of the tree.
2. **Composition.** Pass components as `children`, so the parent fills in the deep part directly. The middle components don't see the data at all. See [composition and children](topic:react/composition-children).
3. **Context.** One provider at the top. Any child reads it with `useContext`. See [Context API](topic:redux-context/context-api).
4. **A store (Redux Toolkit, Zustand).** One central store with clear rules, DevTools and middleware. See [Redux core idea](topic:redux-context/redux-core).

**Prop drilling is not always bad.** Passing a prop down 1–2 levels is normal and clear. It becomes a problem at 3+ levels, or when many components pass the same data.

**Cost of global state.** Global state is easy to read from anywhere. But it is also easy to change from anywhere. That's why Redux adds strict rules: changes only happen through actions and reducers.

**At SkillKeepr**, the frontend uses **Redux with redux-saga**. Each page has its own slice of state. [FILL IN: one example of data many screens shared, like the logged-in user's details and permissions.]

## 🎯 Why do we use it?

- **Cleaner components.** Middle components only get the props they really use.
- **Easier changes.** Add a field to the user once, not in five files.
- **One source of truth.** Every screen shows the same data, so the UI never disagrees with itself.
- **Better debugging.** With Redux, you can see every change in DevTools.

## ⚠️ Common mistakes

- **Making everything global.** A dropdown's open/closed flag doesn't belong in Redux. Keep state local first.
- **Using Context for fast-changing data.** Every reader re-renders on each change. See [Context performance](topic:redux-context/context-performance).
- **Copying server data into Redux by hand** and forgetting to refresh it. A data-fetching library handles caching for you.
- **Jumping to a big library too early.** Composition often fixes drilling with zero extra code.

## 🗣️ How to answer in an interview

> "Prop drilling is when I pass a prop through several components that don't use it, just so a deep child can. It makes the middle components noisy and fragile, because every change touches many files.
>
> First I check if the state can live lower in the tree, or if composition with children solves it. If several distant components really share the data, I pick a home based on the kind of state. For small, rarely changing data like the logged-in user or theme, Context is enough. For big shared data that changes often, I use Redux Toolkit, because it gives one store, predictable updates and DevTools. And for server data, a library like TanStack Query or RTK Query is often better, because it handles caching and refetching."

## 🔁 Follow-up questions

### Is passing props down two levels prop drilling?

Technically yes, but it's fine. Props are explicit and easy to follow. It becomes a problem when it's deep (3+ levels) or repeated across many components.

### How does composition remove prop drilling?

The parent renders the deep child itself and passes it as `children`. The middle components just render `{children}`. They never touch the data.

### Why not put everything in Redux?

More code, more re-render checks, and local details leak into global state. Keep state local first. Make it global only when it must be shared.

### What is "server state" and why treat it differently?

It's data that lives on the server, like a list of jobs. It can go out of date, needs loading/error states, and should be cached. Tools like TanStack Query and RTK Query are built for this.

## ✅ Quick check

### 1. Which of these is the best home for "is this modal open?"

- A) Redux store
- B) Context
- C) `useState` in the component that shows the modal

:::answer
**C.** It's local UI state. Only that component needs it.
:::

### 2. A `Header`, `Sidebar` and `Profile` page all need the logged-in user's name. It changes only on login and logout. What's a simple fit?

:::answer
**Context** (or your existing Redux store). The data is shared by distant components and changes rarely.
:::

### 3. True or false: prop drilling means your app has a bug.

:::answer
**False.** It's a code-design smell, not a bug. The app works. It's just harder to read and change.
:::
