---
title: White screen after one component crashes
template: scenario
stack: debugging
order: 13
level: Intermediate
mustKnow: false
askedFrequency: common
summary:
  - "Symptom: one small part of the page throws an error while rendering, and the whole app turns into a blank white screen."
  - "Why: when a render error isn't caught, React removes the whole component tree."
  - "Detect and debug: read the error and component stack in the Console; reproduce with the same data."
  - "Fix: wrap major sections in error boundaries with a fallback UI, and fix the real bug (often missing data)."
  - "Prevent: boundaries around routes and widgets, safe data access (?.), and send errors to monitoring."
cards:
  - q: Why does one crashing component blank the whole page?
    a: If an error during rendering isn't caught by an error boundary, React unmounts the entire tree, so nothing is left on screen.
  - q: What is an error boundary?
    a: A component that catches errors thrown while rendering its children, and shows a fallback UI instead, so the rest of the app keeps working.
  - q: What errors do error boundaries NOT catch?
    a: Errors in event handlers, in async code like setTimeout or fetch callbacks, and errors inside the boundary itself. Use try/catch for those.
  - q: Can you write an error boundary as a function component?
    a: Not with React alone — it still needs a class with getDerivedStateFromError or componentDidCatch. Many teams use the react-error-boundary package, which gives a ready-made component.
  - q: Where do you put error boundaries?
    a: Around each route or page, and around risky widgets like charts or third-party components. Not one per tiny component.
---

## 💡 What is it?

One small part of the page has a bug. For example, it reads `candidate.address.city` when `address` is missing. It throws an error while [rendering](glossary:render).

Instead of breaking only that part, **the whole app becomes a white screen**. The user sees nothing at all.

This happens because React, by design, **removes the whole tree** when a render error is not caught.

## 🏠 Real-life example

Think of a **power cut in a school building**.

One classroom's fan has a short circuit. If there's no fuse for that room, the **whole building** loses power. With a fuse for each floor, only that floor goes dark, and a sign says "Repair in progress".

- **The fan's short circuit** = one component throwing an error.
- **Whole building dark** = the white screen.
- **A fuse for each floor** = an error boundary around each section.
- **The "Repair in progress" sign** = the fallback UI.
- **Other floors still working** = the rest of the app keeps running.

## 🔎 Detect

- Users report a **blank page** after clicking or opening something.
- The **Console** shows a red error, like `TypeError: Cannot read properties of undefined (reading 'city')`.
- React also prints the **component stack**: the list of parent components. It tells you which component crashed.
- Your error-monitoring tool (if you have one) shows the same error with the user's browser and page. [FILL IN: tool you use, if any.]

## 🐞 Debug

1. Read the **error message** and the **component stack** in the Console.
2. In production, the code is minified. Use **source maps** to see the real file and line.
3. Find **which data** caused it. Often an API returned `null`, an empty array, or a missing field for one record.
4. Reproduce it with that same data. React DevTools lets you inspect the props of each component.
5. Check: is there an **error boundary** above this component? If not, that's why the whole page went blank.

## 🔧 Fix

Two fixes: **contain** the crash (error boundary) and **fix** the bug (safe data access).

**1. An error boundary (class component — React still needs a class for this):**

```jsx
import { Component } from 'react';                                   // bring in the base class

export class ErrorBoundary extends Component {                       // a component that catches render errors
  state = { hasError: false };                                       // false = everything is fine
  static getDerivedStateFromError() {                                // React calls this when a child throws
    return { hasError: true };                                       // switch to the fallback UI
  }                                                                  // end of getDerivedStateFromError
  componentDidCatch(error, info) {                                   // also called after a child throws
    console.error(error, info.componentStack);                       // log it (send to monitoring in real apps)
  }                                                                  // end of componentDidCatch
  render() {                                                         // decide what to show
    if (this.state.hasError) return this.props.fallback;             // show the fallback instead of the crash
    return this.props.children;                                      // normal case: show the children
  }                                                                  // end of render
}                                                                    // end of ErrorBoundary
```

**2. Wrap big sections, not the whole app only:**

```jsx
<Layout>                                                             {/* the page frame keeps working */}
  <ErrorBoundary fallback={<p>Couldn't load the profile.</p>}>       {/* a "fuse" for this section */}
    <CandidateProfile id={id} />                                     {/* if this crashes, only this part shows the fallback */}
  </ErrorBoundary>                                                   {/* end of the boundary */}
  <ErrorBoundary fallback={<p>Couldn't load the chart.</p>}>         {/* a separate fuse for the chart */}
    <HiringChart />                                                  {/* a risky third-party widget */}
  </ErrorBoundary>                                                   {/* end of the boundary */}
</Layout>                                                            // end of the page frame
```

**3. Fix the real bug — read data safely:**

```jsx
<p>{candidate.address.city}</p>                                      {/* ❌ crashes when address is missing */}
<p>{candidate.address?.city ?? 'City not added'}</p>                 {/* ✅ ?. stops safely; ?? shows a default */}
```

## 🛡️ Prevent

- Put an **error boundary around each route** and around risky widgets (charts, editors, third-party components). Also keep one at the top as a last safety net.
- Read API data safely with **optional chaining** `?.` and **defaults** `??`. See [Template literals, optional chaining and nullish coalescing](topic:javascript/template-literals-optional-chaining).
- Use **TypeScript** with `strict` mode, so possibly-missing fields are flagged while coding.
- Validate API responses that come from outside, so bad data is caught early.
- Send errors from `componentDidCatch` to an **error-monitoring** tool.
- Remember: boundaries don't catch errors in **event handlers** or **async code**. Use try/catch there. See [Error handling: try/catch and custom errors](topic:javascript/error-handling).

:::version[Version note]
React 19 added root options `onCaughtError` and `onUncaughtError` on `createRoot`. You can use them to report errors in one place. Error boundaries themselves still need a class component, or a library like `react-error-boundary`.
:::

## 🗣️ How to answer in an interview

**Short version (20 seconds):**

> "An uncaught render error makes React unmount the whole tree, so the page goes white. I'd read the error and component stack in the Console, find the bad data, and fix it with safe access. Then I'd add error boundaries around routes and risky widgets, so one crash only shows a small fallback instead of a blank app."

**Full version:**

> "When a component throws during rendering and nothing catches it, React removes the entire tree. That's why one small bug becomes a white screen.
>
> To debug, I read the error and the component stack in the Console. In production I use source maps. Usually some data is missing for one record, like an address that's null. I reproduce it with the same data.
>
> The fix has two parts. First, the real bug: read data safely with optional chaining and defaults, or fix the API. Second, containment: error boundaries around each route and risky widgets, with a friendly fallback, and componentDidCatch sending the error to monitoring.
>
> I also remember that boundaries don't catch event-handler or async errors, so those need try/catch."

[FILL IN: if your project has (or lacks) error boundaries, and what you would add. Keep it public-safe.]

## 🔁 Follow-up questions

### Why does React unmount everything instead of showing the broken part?

Showing a half-broken UI can be dangerous. For example, a payment page with wrong numbers. React chooses "show nothing" unless you tell it, with a boundary, what to show instead.

### Do error boundaries catch errors in `onClick`?

No. Event handlers run outside rendering. Use `try/catch` inside the handler, and show an error message with state.

### How many error boundaries should an app have?

Enough to keep failures small: one at the top, one per route, and around widgets that often break. Not one per button. Too many makes code noisy.

### How can the user recover from the fallback?

Add a "Try again" button that resets the boundary's state, or reloads that section. `react-error-boundary` gives you a `resetErrorBoundary` function for this.

## ✅ Quick check

### 1. Which error does an error boundary catch?

- A) An error inside an `onClick` handler
- B) An error while a child component renders
- C) An error inside a `setTimeout` callback

:::answer
**B.** Boundaries only catch errors during rendering (and in lifecycle methods) of their children. A and C need try/catch.
:::

### 2. `candidate.skills.length` crashes when `skills` is missing. Write a safe version that shows 0.

:::answer
`candidate.skills?.length ?? 0` — `?.` returns `undefined` instead of crashing, and `?? 0` turns that into 0.
:::
