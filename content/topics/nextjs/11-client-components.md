---
title: "Client Components and 'use client'"
stack: nextjs
order: 11
level: Basic
mustKnow: true
askedFrequency: very common
summary:
  - "Add 'use client' as the first line of a file to make it a Client Component."
  - Client Components can use state, effects, event handlers and browser APIs like window and localStorage.
  - They are still rendered to HTML on the server first, then hydrated in the browser.
  - "'use client' marks a boundary: everything that file imports also becomes client code."
  - Keep Client Components small, and place them as low in the tree as you can.
cards:
  - q: How do you make a Client Component in Next.js?
    a: "Put 'use client' as the very first line of the file."
  - q: When do you need a Client Component?
    a: When the component needs useState, useEffect, onClick or onChange, or browser APIs like window or localStorage.
  - q: Are Client Components rendered only in the browser?
    a: No. They are also rendered to HTML on the server for the first load, then hydrated in the browser to become interactive.
  - q: "If a Client Component imports another component, what is that component?"
    a: "It also runs as client code. 'use client' marks a boundary, and everything imported below it is part of the client bundle."
  - q: Where should 'use client' go in the tree?
    a: As low as possible, on small interactive pieces like a button or a form, so the rest stays on the server.
---

## 💡 What is it?

A **Client Component** is a normal React [component](glossary:component) that also runs **in the browser**.

In the App Router, components are Server Components by default. To make a Client Component, you write **`'use client'`** as the **first line** of the file.

Client Components can use [state](glossary:state), [hooks](glossary:hook) like `useEffect`, click handlers, and browser things like `window` and `localStorage`.

## 🏠 Real-life example

Think of a **restaurant** again.

The kitchen cooks the food (Server Components). But some things must happen **at your table**: taking your order, bringing extra salt, refilling water.

- The **kitchen** = the server.
- The **waiter at your table** = a Client Component. It reacts to you.
- **Waving your hand** = a click event.
- **The waiter remembering your order** = state.
- **The sign on the door that says "Staff at tables"** = `'use client'`. It marks where the table service begins.

A good restaurant has a big kitchen and only as many waiters as it needs. A good Next.js page has many Server Components and only a few small Client Components.

## 🧑‍💻 Code example

In a Next.js 16 project (`npx create-next-app@latest my-app`), create these two files. Run `npm run dev` and open `http://localhost:3000/jobs`.

```tsx
// app/jobs/SaveButton.tsx — a Client Component
'use client'; // first line: this file (and what it imports) also runs in the browser

import { useState } from 'react'; // hooks work in Client Components

export default function SaveButton({ jobTitle }: { jobTitle: string }) { // jobTitle comes from the server page
  const [saved, setSaved] = useState(false); // false = not saved yet

  return ( // what the button shows
    <button onClick={() => setSaved(!saved)}> {/* click flips saved true ↔ false */}
      {saved ? `★ Saved ${jobTitle}` : `☆ Save ${jobTitle}`} {/* text depends on state */}
    </button> // end of the button
  ); // end of the returned JSX
} // end of SaveButton
```

```tsx
// app/jobs/page.tsx — a Server Component (no 'use client')
import SaveButton from './SaveButton'; // a Server Component can render a Client Component

export default function JobsPage() { // runs on the server
  const jobs = ['Node.js Developer', 'React Developer']; // could come from a database
  return ( // what the page shows
    <ul> {/* list of jobs */}
      {jobs.map((title) => ( // one item per job
        <li key={title}> {/* key = unique value for React */}
          {title} <SaveButton jobTitle={title} /> {/* pass plain text (a string) to the client */}
        </li> // end of the list item
      ))} {/* end of the map */}
    </ul> // end of the list
  ); // end of the returned JSX
} // end of JobsPage
```

**What you see:**

```text
Two jobs, each with a "☆ Save …" button.
Click a button → it changes to "★ Saved …". Click again → back to "☆ Save …".
View page source: the buttons are already in the HTML (server-rendered),
then React "hydrates" them so the clicks work.
```

## 🔍 Deeper version

**`'use client'` is a boundary, not a label for one component.** It marks the point where code moves from the server graph to the client graph. **Everything that file imports** becomes part of the client bundle too. So if you put `'use client'` on a big layout, all its imports ship to the browser.

**Client Components still render on the server first.** For the first page load, Next.js renders Client Components to HTML on the server. Then React loads in the browser and [hydrates](topic:nextjs/hydration) them, attaching event handlers. That's why using `window` during render breaks: `window` doesn't exist on the server.

**When you need `'use client'`:**

| Need | Client Component? |
|---|---|
| `useState`, `useReducer`, `useEffect` | Yes |
| `onClick`, `onChange`, `onSubmit` handlers | Yes |
| `window`, `document`, `localStorage` | Yes |
| React Context provider/consumer | Yes |
| Third-party UI that uses hooks (many UI libraries) | Yes |
| Fetching data with secrets, reading a DB | **No** — do it in a Server Component |

**The "slot" pattern.** A Client Component can't `import` a Server Component. But it can **receive** one as `children`:

```tsx
// app/Modal.tsx
'use client'; // a client wrapper with state
import { useState } from 'react'; // hook for open/closed state
export default function Modal({ children }: { children: React.ReactNode }) { // children can be Server Components
  const [open, setOpen] = useState(false); // false = closed
  return <div>{open && children}<button onClick={() => setOpen(!open)}>Toggle</button></div>; // show children when open
} // end of Modal
```

The server page can then write `<Modal><ServerPart /></Modal>`, and `ServerPart` still runs on the server.

**Props must be serialisable.** From a Server Component to a Client Component, pass plain data: strings, numbers, booleans, arrays, plain objects and Dates. Normal functions can't cross the boundary. [Server Actions](topic:nextjs/server-actions) are the exception.

**Pushing `'use client'` down.** Instead of making a whole page client-side for one search box, make **only the search box** a Client Component. The rest stays on the server.

## 🎯 Why do we use it?

- **Interactivity.** Buttons, forms, dropdowns, tabs and modals need state and events.
- **Browser features.** Reading `localStorage`, the window size, or the camera only works in the browser.
- **Libraries with hooks.** Many UI and chart libraries need to run on the client.
- **Balance.** Server Components handle data and layout; Client Components handle the interactive bits.

## ⚠️ Common mistakes

- **Putting `'use client'` on the root layout or a big page.** Everything below becomes client code, and the bundle grows.
- **Using `window` or `localStorage` during render.** It crashes on the server, or causes a [hydration error](topic:nextjs/hydration). Use it inside `useEffect` or an event handler.
- **Importing server-only code into a Client Component.** Secrets could leak into the bundle. Use `import 'server-only'` to guard such files.
- **Writing `'use client'` after the imports.** It must be the first statement in the file.

## 🗣️ How to answer in an interview

> "A Client Component is a component marked with 'use client' at the top of its file. I use one when I need state, effects, event handlers, or browser APIs like localStorage.
>
> An important detail is that 'use client' is a boundary: everything that file imports also becomes client code. And Client Components are still server-rendered to HTML on the first load, then hydrated in the browser. That's why I never touch window during render.
>
> My approach is to keep pages as Server Components and push 'use client' down to small leaves, like a save button or a search box. If a client wrapper needs to show server content, I pass it in as children. I haven't used Next.js in production yet, but in React I've built lots of interactive components with hooks, and this model maps onto that. [FILL IN: once you've built the practice project, mention the 'use client' component you made.]"

## 🔁 Follow-up questions

### Does 'use client' mean the component only renders in the browser?

No. It's still pre-rendered to HTML on the server for the first load. It also runs in the browser, where it becomes interactive. If you truly need browser-only rendering, use `next/dynamic` with `ssr: false` inside a Client Component.

### Do I need 'use client' in every interactive component file?

Only at the **entry point** of the client part. Components imported by a `'use client'` file are already client code. Adding the directive again does no harm, but it isn't required.

### Can I use React Context in the App Router?

Yes, but the provider must be a Client Component. A common pattern is a `Providers.tsx` file with `'use client'`, which wraps `{children}` in the root layout.

### How do you call the server from a Client Component?

Either call a [Route Handler](topic:nextjs/route-handlers) with `fetch`, or call a [Server Action](topic:nextjs/server-actions) passed in as a prop or imported from a `'use server'` file.

## ✅ Quick check

### 1. Where must `'use client'` go?

- A) Anywhere in the file
- B) As the first line, before the imports
- C) Inside the component function

:::answer
**B.** It must be the first statement in the file, before any imports.
:::

### 2. A Client Component file imports `Chart.tsx`, which has no directive. Where does `Chart` run?

:::answer
**On the client too.** `'use client'` is a boundary. Everything imported below it becomes part of the client bundle.
:::

### 3. Why does `const w = window.innerWidth;` at the top of a Client Component's render cause problems?

:::answer
Client Components are first rendered on the **server**, where `window` doesn't exist. Read `window` inside `useEffect` or an event handler instead.
:::
