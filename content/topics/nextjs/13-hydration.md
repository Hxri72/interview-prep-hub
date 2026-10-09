---
title: Hydration and hydration errors
stack: nextjs
order: 13
level: Intermediate
mustKnow: true
askedFrequency: very common
summary:
  - The server sends ready HTML so the page shows fast. Then React loads in the browser and attaches event handlers. That step is hydration.
  - A hydration error happens when the browser's first render is different from the server's HTML.
  - "Common causes: Date.now(), Math.random(), window or localStorage during render, and invalid HTML nesting like a div inside a p."
  - "Fix it by rendering the same thing on both sides, then changing it after mount in useEffect."
  - "suppressHydrationWarning is only for small, expected differences like a timestamp."
cards:
  - q: What is hydration?
    a: React taking the HTML the server sent and attaching event handlers and state to it, so the page becomes interactive.
  - q: What causes a hydration error?
    a: The first render in the browser doesn't match the server HTML, for example because of Date.now(), Math.random(), window checks or invalid HTML nesting.
  - q: How do you show something that only the browser knows, like the window width?
    a: Render a neutral value first, then update it in useEffect after the component mounts.
  - q: Why is a div inside a p a hydration problem?
    a: It's invalid HTML. The browser fixes the HTML its own way, so the DOM no longer matches what React expects.
  - q: When is suppressHydrationWarning OK?
    a: Only for one element with a small, expected difference, like a timestamp. It hides the warning; it doesn't fix the real cause.
---

## 💡 What is it?

The server sends **ready HTML**, so the user sees the page quickly. But that HTML can't react to clicks yet.

Then React's JavaScript loads in the browser. It walks over the HTML and **attaches event handlers and state**. This step is called **hydration**.

A **hydration error** happens when the browser's first render **doesn't match** the server's HTML.

## 🏠 Real-life example

Think of a **printed class photo** that the school will turn into a **digital class list**.

The office scans the photo. A teacher then adds each student's name and phone number to the matching face.

- The **printed photo** = the server's HTML. Everyone can see it quickly.
- **Adding names and numbers to each face** = hydration. Now you can "click" a face.
- **A hydration error** = the teacher's list says 30 students, but the photo has 31. The names don't line up with the faces.
- **Why it happened** = someone was added to the list after the photo was taken. In code, something changed between the server render and the browser render.

## 🧑‍💻 Code example

In a Next.js 16 project, this component **causes** a hydration error, and the second one fixes it.

```tsx
// app/clock/BadClock.tsx — causes a hydration error
'use client'; // a Client Component (still server-rendered first)

export default function BadClock() { // runs on the server AND in the browser
  const now = new Date().toLocaleTimeString(); // different value on the server and in the browser
  return <p>Time: {now}</p>; // server HTML and browser render won't match
} // end of BadClock
```

```tsx
// app/clock/GoodClock.tsx — the fix
'use client'; // a Client Component
import { useEffect, useState } from 'react'; // hooks for state and after-mount code

export default function GoodClock() { // the fixed version
  const [now, setNow] = useState<string | null>(null); // null = same on server and first browser render
  useEffect(() => { // runs only in the browser, after hydration
    setNow(new Date().toLocaleTimeString()); // now it's safe to read the real time
  }, []); // [] = run once, after the first render
  return <p>Time: {now ?? '…'}</p>; // server and first browser render both show "…"
} // end of GoodClock
```

```tsx
// app/clock/page.tsx
import BadClock from './BadClock'; // the broken version
import GoodClock from './GoodClock'; // the fixed version

export default function Page() { // a Server Component page
  return <><BadClock /><GoodClock /></>; // show both
} // end of Page
```

Run `npm run dev` and open `http://localhost:3000/clock`.

**What you see:**

```text
BadClock: Next.js shows an error overlay in development, with a message that
the server-rendered text didn't match the client (a hydration mismatch).
GoodClock: shows "Time: …" for a moment, then the real time. No error.
```

## 🔍 Deeper version

**Why the HTML must match.** During hydration, React does **not** rebuild the page. It assumes the existing HTML is correct and only attaches handlers. If the first browser render is different, React can't trust the HTML. In development it reports a mismatch. In production, React re-renders that part on the client, which is slower and can flicker.

**Common causes and fixes:**

| Cause | Why it differs | Fix |
|---|---|---|
| `Date.now()`, `new Date()`, `Math.random()` in render | Different value each time | Set it in `useEffect`, or render it only on the server |
| `typeof window !== 'undefined'` branches in render | Server has no `window` | Render the same first; update after mount |
| `localStorage` / `sessionStorage` in render | Not on the server | Read in `useEffect` |
| Invalid HTML nesting (`<div>` in `<p>`, `<a>` in `<a>`) | Browser "fixes" the HTML | Use valid nesting (`<div>` instead of `<p>`) |
| Locale or time-zone formatting | Server and user settings differ | Format on one side only, or pass a fixed time zone |
| Browser extensions changing the HTML | Not your code | Usually safe to ignore; test in a private window |

**`suppressHydrationWarning`.** You can add it to **one element** whose text is expected to differ, like a timestamp. It only silences the warning for that element's own text. It is not a fix for real bugs.

**Browser-only components.** If a component truly can't render on the server (for example a map library that needs `window`), load it with `next/dynamic` and `{ ssr: false }` inside a Client Component.

**Less to hydrate = fewer problems.** [Server Components](topic:nextjs/server-components) are never hydrated, because they have no client JavaScript. Only [Client Components](topic:nextjs/client-components) are. So keeping most of the page on the server also reduces hydration work.

:::version[Version note]
React 19 (used by Next.js 15 and 16) shows **one clearer error with a diff** of what didn't match, instead of many vague warnings. The Next.js dev overlay also points to the component that caused it.
:::

## 🎯 Why do we use it?

Hydration gives you **both** benefits:
- The user sees content **fast**, because HTML comes from the server.
- The page still becomes **fully interactive**, because React takes over in the browser.

Understanding hydration errors helps you fix "the page flickers" and "the page works after refresh but the console is full of errors" bugs.

## ⚠️ Common mistakes

- **Using `Date`, random numbers or `window` during render.** Move them into `useEffect`.
- **Putting a `<div>` inside a `<p>`.** Many UI components render a `<div>`, so wrapping them in `<p>` causes this silently.
- **Adding `suppressHydrationWarning` everywhere.** It hides real bugs.
- **Blaming React for an extension's change.** Test in a private window to rule out browser extensions.

## 🗣️ How to answer in an interview

> "Hydration is when React takes the HTML the server sent and attaches event handlers and state to it, so the page becomes interactive. The user sees content fast, and then it becomes clickable.
>
> A hydration error means the first render in the browser didn't match the server HTML. The usual causes are values that differ each time, like Date.now or Math.random, code that checks window or reads localStorage during render, locale formatting differences, and invalid HTML nesting like a div inside a p.
>
> The fix is to render exactly the same thing on both sides first, then update in useEffect after mount. If a component can't run on the server at all, I'd load it with next/dynamic and ssr false. I'd only use suppressHydrationWarning for a single expected difference like a timestamp. I haven't used Next.js in production, but I know this problem from React server-rendering concepts. [FILL IN: once you've built the practice project, mention a hydration issue you hit, if any.]"

## 🔁 Follow-up questions

### Do Server Components get hydrated?

No. They have no client JavaScript. Only Client Components are hydrated.

### What does React do in production when there's a mismatch?

It throws away the mismatched server HTML for that part and renders it again on the client. The page still works, but it's slower and may flicker.

### How do you show the user's local time without a hydration error?

Render a placeholder (or nothing) first, then set the time in `useEffect`. Or render a fixed time zone on the server and format it the same way in the browser.

### How do you find which component caused the mismatch?

Read the error diff in the Next.js dev overlay. It shows the expected and actual content. Then look for time, random values, `window`, or bad HTML nesting in that component.

## ✅ Quick check

### 1. Will this cause a hydration error?

```tsx
'use client'; // a Client Component
export default function Hello() { // runs on server and browser
  return <p>{typeof window === 'undefined' ? 'Server' : 'Browser'}</p>; // different text on each side
}
```

:::answer
**Yes.** The server renders "Server" and the browser's first render is "Browser". The text doesn't match.
:::

### 2. Which is valid HTML that avoids a nesting mismatch?

- A) `<p><div>Hi</div></p>`
- B) `<div><p>Hi</p></div>`
- C) `<a href="/"><a href="/x">x</a></a>`

:::answer
**B.** A `<div>` can contain a `<p>`. A and C are invalid nesting, and the browser rewrites them.
:::

### 3. True or false: adding `suppressHydrationWarning` to `<body>` fixes all hydration errors in the app.

:::answer
**False.** It only affects that one element's own attributes and text, and it only hides the warning. It doesn't fix mismatches in child components.
:::
