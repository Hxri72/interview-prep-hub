---
title: Conditional rendering
stack: react
order: 7
level: Basic
mustKnow: false
askedFrequency: common
summary:
  - Conditional rendering means showing different UI based on data, like a spinner while loading.
  - "Three common tools: an if with an early return, the ternary (a ? b : c), and && (show or nothing)."
  - Returning null renders nothing.
  - "Watch out for && with numbers: {count && <List />} shows a 0 when count is 0. Use {count > 0 && <List />}."
  - Hiding with CSS keeps the component (and its state) alive; not rendering it removes it and resets its state.
cards:
  - q: What are the common ways to render conditionally in React?
    a: "An if statement with an early return, the ternary operator (cond ? a : b), the && operator (cond && a), and returning null to show nothing."
  - q: "Why does {count && <List />} sometimes show 0?"
    a: If count is 0, && returns 0, and React renders numbers. Use a real boolean, like count > 0 && <List />.
  - q: What does returning null from a component do?
    a: It renders nothing on the screen. The component still runs, though.
  - q: Not rendering vs hiding with CSS — what's the difference?
    a: Not rendering removes the component and resets its state. Hiding with CSS (display none) keeps it mounted and keeps its state.
  - q: Where should you put complex conditions?
    a: Before the return, in normal if statements or variables. Keep the JSX simple to read.
---

## 💡 What is it?

**Conditional rendering** means showing **different things** depending on the data.

For example: show a spinner while data loads, an error if it fails, and the list when it arrives.

In React you do this with normal JavaScript: `if`, the ternary `? :`, and `&&`.

## 🏠 Real-life example

Think of a **traffic signal**.

It checks one condition and shows one light: red, yellow or green. It never shows a light that doesn't match.

- The **current traffic situation** = the data (state or props).
- The **rule** "if stop, show red" = your `if` or ternary.
- The **light that turns on** = the JSX React shows.
- **All lights off at night** = returning `null` (show nothing).

## 🧑‍💻 Code example

Paste this into `src/App.jsx` of a Vite React app. Run `npm run dev`.

```jsx
import { useState } from 'react';                               // bring in useState

function CandidateList({ status, candidates }) {               // props: the loading status and the data
  if (status === 'loading') return <p>Loading…</p>;            // early return: show a spinner text
  if (status === 'error') return <p>Something went wrong.</p>; // early return: show an error
  if (candidates.length === 0) return <p>No candidates yet.</p>; // empty state
  return (                                                     // otherwise, show the list
    <ul>                                                       {/* the list */}
      {candidates.map((c) => <li key={c.id}>{c.name}</li>)}    {/* one row per candidate */}
    </ul>                                                      // end of the list
  );                                                           // end of the return
}                                                              // end of CandidateList

export default function App() {                                // the main component
  const [isAdmin, setIsAdmin] = useState(false);               // true/false flag
  const unread = 0;                                            // a number: no unread messages
  return (                                                     // what App shows
    <main>                                                     {/* a box around everything */}
      <CandidateList status="done" candidates={[{ id: 1, name: 'Asha' }]} /> {/* try 'loading' or 'error' */}
      <p>{isAdmin ? 'Admin view' : 'Recruiter view'}</p>       {/* ternary: one of two texts */}
      {isAdmin && <button>Delete all</button>}                 {/* &&: the button, or nothing */}
      {unread > 0 && <span>{unread} new</span>}                {/* use a real true/false, not the number */}
      <button onClick={() => setIsAdmin(!isAdmin)}>Switch role</button> {/* flip the flag */}
    </main>                                                    // end of the box
  );                                                           // end of what App returns
}                                                              // end of App
```

**What you see:**

```text
• Asha
Recruiter view
[Switch role]

Click "Switch role" → "Admin view" and a [Delete all] button appear.
```

## 🔍 Deeper version

**The four tools.**

| Tool | Use it when… | Example |
|---|---|---|
| `if` + early return | Whole different screens (loading, error, empty) | `if (loading) return <Spinner />;` |
| Ternary `a ? b : c` | One of two pieces inside JSX | `{open ? <Close /> : <Open />}` |
| `&&` | Something or nothing | `{isAdmin && <AdminPanel />}` |
| `null` | Show nothing at all | `return null;` |

**The `0` trap.** `&&` returns the **left side** if it is falsy. React shows `0` and `NaN`, but not `false`, `null` or `undefined`.

```jsx
{items.length && <List />}                  // when length is 0, this renders "0" on the page
{items.length > 0 && <List />}              // a real boolean: renders nothing when empty
```

See [truthy and falsy values](topic:javascript/truthy-falsy).

**Not rendering vs hiding.**
- `{show && <Panel />}`: when `show` turns false, `Panel` is **unmounted**. Its state is lost, and its effects clean up.
- `<Panel hidden={!show} />` or CSS `display: none`: `Panel` stays **mounted**. Its state survives.

Pick based on whether you want to keep the state (for example, half-filled form tabs).

:::version[Version note]
**React 19.2** added `<Activity mode="hidden">`. It hides a part of the UI but keeps its state. Its effects are cleaned up while hidden and run again when it's shown. It's useful for tabs you want to keep ready.
:::

**Keep JSX readable.** Avoid nested ternaries like `a ? b : c ? d : e`. Move the logic above the `return`, or into a small helper component.

**Same position, same component.** If both branches render the **same component type** in the same place, React keeps its state:

```jsx
{isEdit ? <Form mode="edit" /> : <Form mode="view" />}   // same <Form> in the same place → state is kept
```

Add a `key` to force a fresh component.

## 🎯 Why do we use it?

Real screens have many states: **loading, error, empty, success, logged in or not, has permission or not**. Conditional rendering shows the right UI for each one, so users always understand what is happening.

## ⚠️ Common mistakes

- **Showing `0` by accident** with `{count && …}`. Use `count > 0`.
- **Deep nested ternaries.** Hard to read. Use early returns or variables.
- **Forgetting the loading and empty states.** The UI shows a blank area, and users think it's broken.
- **Hiding admin-only UI only on the frontend.** The backend must still check permissions.

## 🗣️ How to answer in an interview

> "Conditional rendering is just JavaScript inside components. For whole different screens, like loading, error or empty, I use early returns with if statements. Inside JSX, I use a ternary for one of two options and `&&` for something-or-nothing. Returning null renders nothing.
>
> Two details I watch for. With `&&`, a number like 0 on the left gets rendered, so I compare explicitly, like `count > 0`. And not rendering a component unmounts it and resets its state, while hiding it with CSS keeps it mounted. I choose based on whether the state should survive.
>
> I also always handle loading, error and empty states, so the screen is never confusing."

## 🔁 Follow-up questions

### Why does `0` show but `false` doesn't?

React renders numbers and strings. It skips `false`, `true`, `null` and `undefined`. So `0 && <X />` returns `0`, which appears.

### Can a component return `null`?

Yes. It renders nothing. The component function still runs, and its hooks still work.

### How do you avoid nested ternaries?

Calculate a variable before the return, use early returns, or create a small component for each case. A `switch` on a status string is also clear.

### Does hiding admin buttons make the app secure?

No. It's only for user experience. The backend must check permissions on every request.

## ✅ Quick check

### 1. `messages` is an empty array. What does this show?

```jsx
<div>{messages.length && <p>You have mail</p>}</div>  // length is 0
```

:::answer
It shows **`0`**. Use `messages.length > 0 && …` to show nothing.
:::

### 2. Which one keeps the Panel's state when hidden?

- A) `{show && <Panel />}`
- B) `<div style={{ display: show ? 'block' : 'none' }}><Panel /></div>`

:::answer
**B.** The Panel stays mounted and is only hidden with CSS. In A, it's unmounted and its state resets.
:::

### 3. What does a component render when it returns `null`?

:::answer
Nothing. No element is added to the page.
:::
