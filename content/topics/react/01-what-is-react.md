---
title: What React is and why we use it
stack: react
order: 1
level: Basic
mustKnow: true
askedFrequency: very common
summary:
  - React is a JavaScript library for building user interfaces from small, reusable pieces called components.
  - You describe what the screen should look like for the current data. React updates the real page for you.
  - When data (state) changes, React re-runs your component and changes only the parts of the page that are different.
  - React only does the UI. Routing, data fetching and styling come from other libraries or a framework like Next.js.
  - Big reasons teams use it — reusable components, a huge ecosystem, and one clear way to think about UI.
cards:
  - q: What is React?
    a: A JavaScript library for building user interfaces from reusable components. You describe the UI for the current data, and React keeps the page in sync.
  - q: Is React a library or a framework?
    a: A library. It only handles the view (the UI). Routing, data fetching and build tools come from other packages or from a framework like Next.js.
  - q: What does "declarative" mean in React?
    a: You describe WHAT the screen should look like for the current data, not the step-by-step DOM changes. React works out the changes itself.
  - q: What happens when state changes in React?
    a: React re-runs the component function, compares the new result with the old one, and updates only the changed parts of the real page.
  - q: Why did React become so popular?
    a: Reusable components, one-way data flow that is easy to follow, a very large ecosystem, and strong support from Meta and the community.
---

## 💡 What is it?

**React** is a JavaScript library for building **user interfaces**. A user interface (UI) is everything you see and click on a website.

In React, you build the page from small pieces called [components](glossary:component). A button, a search box and a candidate card can each be a component.

You tell React **what the screen should look like** for the current data. React then updates the real page for you.

## 🏠 Real-life example

Think of building a house with **LEGO blocks**.

You don't carve the whole house from one big stone. You snap together small blocks. You can reuse the same window block many times.

- The **LEGO blocks** = components.
- The **instruction sheet** = your code that says which blocks go where.
- **Swapping one block** without breaking the house = React changing only one part of the page.
- **Reusing the same window block** = using the same component on many pages.

When you want a red door instead of a blue one, you change just the door. You don't rebuild the house. React works the same way.

## 🧑‍💻 Code example

Create an app with `npm create vite@latest my-app` (choose React). Paste this into `src/App.jsx`. Run `npm run dev` and open the link.

```jsx
import { useState } from 'react';                          // bring in the useState hook from React

function Greeting({ name }) {                              // a small component; name comes from the parent
  return <h2>Hello, {name}!</h2>;                          // {name} puts the value inside the heading
}                                                          // end of Greeting

export default function App() {                            // the main component of the app
  const [count, setCount] = useState(0);                   // count starts at 0; setCount changes it
  return (                                                 // what App shows on the screen
    <main>                                                 {/* a box around everything */}
      <Greeting name="Hari" />                             {/* reuse the Greeting block with name = "Hari" */}
      <Greeting name="Asha" />                             {/* the same block again, with a different name */}
      <button onClick={() => setCount(count + 1)}>         {/* on click, add 1 to count */}
        Clicked {count} times                              {/* shows the current count */}
      </button>                                            {/* end of the button */}
    </main>                                                // end of the box
  );                                                       // end of what App returns
}                                                          // end of App
```

**What you see:**

```text
Hello, Hari!
Hello, Asha!
[ Clicked 0 times ]   ← click it and the number goes up: 1, 2, 3…
```

When you click, only the button text changes. React does not rebuild the headings.

## 🔍 Deeper version

**Declarative, not imperative.** In plain JavaScript you write each step: "find this element, change its text, add a class". That is **imperative**. In React you write: "for this data, the UI looks like this". That is **declarative**. React works out the steps.

**How an update works:**
1. Something changes the [state](glossary:state) (for example, a click).
2. React calls your component function again. This is a [render](glossary:render).
3. React compares the new result with the last one. (This is called reconciliation. See [the virtual DOM](topic:react/virtual-dom).)
4. React changes only the different parts of the real [DOM](glossary:dom).

**One-way data flow.** Data goes **down** from parent to child as [props](glossary:props). Children send messages **up** by calling functions the parent gave them. This makes bugs easier to trace.

**Library vs framework.**

| | React (library) | Framework (e.g. Next.js) |
|---|---|---|
| What it gives you | Components, state, rendering | React + routing, server rendering, data fetching, build setup |
| Routing | Add React Router | Built in |
| Who decides the structure | You | The framework's rules |

**Where React runs.** Usually in the browser, as a single-page app (SPA). An SPA loads one HTML page, and JavaScript changes the screen without full page reloads. React can also render on the server (for example with Next.js).

:::version[Version note]
**React 19** (Dec 2024) added Actions for forms, the `use()` API, and `ref` as a normal prop. **React 19.2** added `useEffectEvent` and `<Activity>`. The **React Compiler** can now add memoisation for you. Older tutorials use class components; new code uses function components and hooks.
:::

## 🎯 Why do we use it?

- **Reusable pieces.** Build a `CandidateCard` once and use it on many screens.
- **Easier thinking.** You only describe the UI for the current data. You don't track every DOM change by hand.
- **Fast enough updates.** React changes only what is different.
- **Huge ecosystem.** Routing, forms, charts, UI kits and testing tools already exist.
- **Jobs and community.** Many companies use it, so help and examples are easy to find.

## ⚠️ Common mistakes

- **Changing the DOM directly** with `document.querySelector` inside React. React won't know about it, and it may undo your change.
- **Thinking React is a full framework.** You still need to choose a router, a data-fetching approach and a build tool (or use Next.js).
- **Putting everything in one huge component.** Split it into smaller components with one job each.
- **Changing state variables directly** (`count = 5`). Always use the setter (`setCount(5)`), or React won't update the screen.

## 🗣️ How to answer in an interview

> "React is a JavaScript library for building user interfaces from reusable components. It's declarative: I describe what the UI should look like for the current state, and React keeps the real DOM in sync.
>
> When state changes, React re-renders the component, compares the new output with the previous one through reconciliation, and updates only the parts of the DOM that changed. Data flows one way, from parent to child through props, which makes the app easier to reason about.
>
> It's a library, not a full framework, so for routing or server rendering I add React Router or use a framework like Next.js. I've used React with TypeScript for recruiter and candidate screens at SkillKeepr."

[FILL IN: one screen or feature you built in React at SkillKeepr, in one line.]

## 🔁 Follow-up questions

### Why is React called a library and not a framework?

It only handles the view layer: components, state and rendering. It doesn't decide your routing, data fetching or folder structure. Frameworks like Next.js add those on top of React.

### What is the difference between React and plain JavaScript DOM code?

With plain JavaScript you change the DOM step by step yourself. With React you describe the UI for the current data, and React works out the DOM changes. This is less error-prone in big apps.

### What is a single-page application (SPA)?

An app that loads one HTML page once. After that, JavaScript changes what you see, without full page reloads. React apps built with Vite are usually SPAs.

### What are the downsides of React?

It's only the UI, so you must pick many extra libraries. An SPA can have a slow first load and weaker SEO unless you add server rendering. You also need to learn hooks and re-render rules well.

## ✅ Quick check

### 1. Which statement is true?

- A) React is a full framework with routing built in
- B) React is a library for building UIs from components
- C) React only works on the server

:::answer
**B.** React is a UI library. Routing needs React Router or a framework like Next.js. React runs in the browser and can also render on the server.
:::

### 2. A user clicks a button that changes `count` from 2 to 3. What does React update on the page?

:::answer
Only the parts of the DOM that show `count`. React re-runs the component, compares the result with the last one, and changes just the difference.
:::
