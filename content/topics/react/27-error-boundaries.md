---
title: Error boundaries
stack: react
order: 27
level: Intermediate
mustKnow: false
askedFrequency: common
summary:
  - Without an error boundary, one crashing component removes the whole app from the screen (a white screen).
  - An error boundary catches render errors in the components below it and shows a fallback UI instead.
  - They catch errors while rendering, in lifecycle methods and in effects — not in event handlers or async code.
  - React only supports them as class components, so most teams use the react-error-boundary library.
  - "React 19 adds root options onCaughtError and onUncaughtError, a good place to send errors to monitoring."
cards:
  - q: What is an error boundary?
    a: A component that catches errors thrown while rendering the components below it, and shows a fallback UI instead of crashing the whole app.
  - q: What errors does an error boundary NOT catch?
    a: Errors in event handlers, in async code like setTimeout or promises, in server rendering, and errors thrown by the boundary itself.
  - q: Can you write an error boundary with hooks?
    a: No. React only supports class components with getDerivedStateFromError or componentDidCatch. The react-error-boundary library wraps this for you.
  - q: Where should you place error boundaries?
    a: Around major sections — the page content, a sidebar, a chart widget — so one broken part shows a fallback while the rest of the app keeps working.
  - q: How do you show an error from an async call in the boundary?
    a: Catch it and pass it to the boundary, for example with showBoundary from react-error-boundary's useErrorBoundary hook.
---

## 💡 What is it?

If any [component](glossary:component) throws an error while [rendering](glossary:render), React removes the **whole app** from the screen. The user sees a blank white page.

An **error boundary** is a safety net. You wrap part of the app in it. If something inside crashes, the boundary shows a **fallback** message instead, like "This section failed to load. Try again." The rest of the app keeps working.

## 🏠 Real-life example

Think of the **circuit breakers (fuses) in your house**.

Each room has its own switch in the fuse box. If the iron in the kitchen short-circuits, only the kitchen fuse trips. The bedroom fan and the TV in the hall keep working.

Without fuses, one bad iron could cut power to the whole house.

- **The whole house** = your React app.
- **One room** = one section, like a chart or a sidebar.
- **The fuse for that room** = an error boundary around that section.
- **The faulty iron** = a component that throws an error.
- **The tripped switch with a red light** = the fallback UI.
- **Pressing the switch back up** = the "Try again" (reset) button.

## 🧑‍💻 Code example

Make a Vite React app and install the library: `npm install react-error-boundary`. Paste this into `src/App.jsx`, then run `npm run dev`.

```jsx
import { useState } from 'react';                                  // state hook
import { ErrorBoundary } from 'react-error-boundary';              // ready-made error boundary component

function Salary({ amount }) {                                      // a component that can crash
  if (amount < 0) throw new Error('Salary cannot be negative');    // throwing while rendering = a crash
  return <p>Expected salary: ₹{amount.toLocaleString('en-IN')}</p>; // normal output, e.g. ₹8,00,000
}                                                                  // end of Salary

function Fallback({ error, resetErrorBoundary }) {                 // what to show instead of the crash
  return (                                                         // the fallback UI
    <div role="alert">                                             {/* role="alert" lets screen readers announce it */}
      <p>Something went wrong: {error.message}</p>                 {/* show a short message */}
      <button onClick={resetErrorBoundary}>Try again</button>      {/* clears the error and renders again */}
    </div>                                                         // end of fallback wrapper
  );                                                               // end of return
}                                                                  // end of Fallback

export default function App() {                                    // the main component
  const [amount, setAmount] = useState(800000);                    // starts as a valid number
  return (                                                         // what to show
    <main>                                                         {/* page wrapper */}
      <h1>Candidate profile</h1>                                   {/* outside the boundary — always visible */}
      <button onClick={() => setAmount(-1)}>Break it</button>      {/* makes Salary throw on next render */}
      <ErrorBoundary                                               // the safety net for this section only
        FallbackComponent={Fallback}                               // show this when something below crashes
        onReset={() => setAmount(800000)}                          // fix the bad data before trying again
        onError={(err) => console.log('send to monitoring:', err.message)} // a hook to log the error
      >                                                            {/* end of ErrorBoundary props */}
        <Salary amount={amount} />                                 {/* the part that might crash */}
      </ErrorBoundary>                                             {/* end of the boundary */}
    </main>                                                        // end of wrapper
  );                                                               // end of return
}                                                                  // end of App
```

**What you see:**

```text
Start:            "Candidate profile"  +  "Expected salary: ₹8,00,000"
Click "Break it": "Candidate profile" stays.
                  The salary section shows "Something went wrong: Salary cannot be negative" + [Try again]
                  Console: send to monitoring: Salary cannot be negative
Click "Try again": amount resets to 800000, the salary appears again.
Remove the <ErrorBoundary> and click "Break it": the WHOLE page goes blank.
```

## 🔍 Deeper version

**What a boundary catches:**
- errors thrown while **rendering** components below it,
- errors in class lifecycle methods,
- errors thrown inside `useEffect` / `useLayoutEffect` of components below it.

**What it does NOT catch:**
- errors inside **event handlers** (`onClick`). Use `try/catch` there.
- **async** errors: `setTimeout`, promise `.then`, `await` inside a handler.
- errors during **server-side rendering**.
- errors thrown by the boundary component **itself**.

For async errors you still want in the boundary, catch them and hand them over. `react-error-boundary` gives you `const { showBoundary } = useErrorBoundary()`, then call `showBoundary(error)`.

**Why a library?** React supports boundaries only as **class components**. A class with `static getDerivedStateFromError(error)` switches to the fallback. `componentDidCatch(error, info)` logs the error and the component stack. There's no hook version. `react-error-boundary` wraps this in a simple component with `FallbackComponent`, `onError`, `onReset` and `resetKeys`.

**`resetKeys`.** Pass values like `[userId]`. When one changes, the boundary resets itself. This is useful when the user navigates to another record.

**Where to place boundaries.** One at the top as the last safety net ("Something went wrong — reload"). Then smaller ones around **independent sections**: the page content under the layout, each dashboard widget, a chart, a rich-text editor. The menu and header stay usable when one widget fails. Wrap [lazy-loaded](topic:react/code-splitting) parts too, because chunk downloads can fail after a deploy.

**Logging.** Send errors to a monitoring tool from `onError` or `componentDidCatch`, with the component stack. Then you hear about crashes before users report them.

:::version[Version note]
**React 19** added root options: `createRoot(el, { onCaughtError, onUncaughtError, onRecoverableError })`. `onCaughtError` runs when a boundary catches an error. `onUncaughtError` runs when nothing caught it. They're a good central place for monitoring. React 19 also logs each error once instead of twice.
:::

## 🎯 Why do we use it?

- **No more white screens.** One broken part doesn't take down the whole app.
- **A way to recover.** "Try again" or "Reload" instead of a dead page.
- **Better bug reports.** Errors are logged with the component stack.
- **Calmer users.** The menu and the rest of the page still work.

## ⚠️ Common mistakes

- **No boundary at all.** One render error blanks the whole app.
- **Expecting boundaries to catch `onClick` or async errors.** They don't. Use `try/catch`, or `showBoundary`.
- **Only one boundary at the very top.** Then any error still replaces the whole page with the fallback. Add section-level boundaries.
- **A "Try again" button that changes nothing.** If the bad data is still there, it crashes again. Fix the cause in `onReset`, or use `resetKeys`.
- **Not logging the error.** The user sees a nice message, but nobody on the team ever knows.

## 🗣️ How to answer in an interview

> "Without an error boundary, any error during rendering unmounts the whole React tree, and users see a white screen. An error boundary catches render errors in the components below it and shows a fallback instead.
>
> React only supports them as class components, so I use the react-error-boundary library. I put one at the top as a last safety net, and smaller ones around independent sections like the page content, charts or lazy-loaded parts, so one broken widget doesn't kill the whole page. The fallback has a Try again button, and onReset fixes the cause first.
>
> Boundaries don't catch errors in event handlers or async code, so I use try/catch there, or pass the error to the boundary with showBoundary. I log errors from onError to monitoring. In React 19, the root's onCaughtError and onUncaughtError are also a good central place for that."

[FILL IN: whether your app had error boundaries, and where you added or would add them.]

## 🔁 Follow-up questions

### Why can't error boundaries catch event handler errors?

Event handlers don't run during rendering. React already knows the UI is fine, so it doesn't need to replace anything. Catch those errors with `try/catch` and show a message or toast.

### Can a function component be an error boundary?

Not by itself. React needs `getDerivedStateFromError` or `componentDidCatch`, which only exist on classes. Libraries like `react-error-boundary` give you a ready-made class you can use from function components.

### What happens to the state of components inside a boundary after an error?

They are unmounted, and their state is lost. When the boundary resets, they mount again with fresh state.

### How is this related to a white screen in production?

A white screen usually means a render error with no boundary. Check the console stack trace, then add boundaries around major sections. See [white screen after a crash](topic:debugging/white-screen-crash).

## ✅ Quick check

### 1. Will an error boundary catch this error?

```jsx
<button onClick={() => { throw new Error('boom'); }}>Click</button> // throws inside a click handler
```

:::answer
**No.** Errors in event handlers are not caught by error boundaries. Use `try/catch` inside the handler.
:::

### 2. A widget crashes. Only the widget area shows "Something went wrong"; the menu still works. Why?

:::answer
The widget is wrapped in its **own** error boundary. The crash is contained there, so the rest of the app keeps rendering.
:::

### 3. True or false: you can write an error boundary with only hooks, no class.

:::answer
**False.** React needs a class with `getDerivedStateFromError` or `componentDidCatch`. Libraries wrap this so you don't write the class yourself.
:::
