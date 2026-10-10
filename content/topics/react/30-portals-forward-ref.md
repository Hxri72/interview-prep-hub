---
title: Portals and forwarding refs
stack: react
order: 30
level: Advanced
mustKnow: false
askedFrequency: sometimes
summary:
  - "A portal (createPortal) draws a component into a different place in the HTML page, like document.body, while it stays in the same React tree."
  - Portals are used for modals, tooltips, dropdowns and toasts, so they are not cut off by a parent's overflow or z-index.
  - Events from a portal still bubble up through the React tree, not the HTML tree.
  - A ref gives you direct access to a DOM element, for example to focus an input.
  - "In React 19, a component can receive ref as a normal prop. Before that you needed forwardRef, which is now on the way out."
cards:
  - q: What is a React portal?
    a: A way to render children into a different DOM node (like document.body) while keeping them in the same React component tree. Made with createPortal(children, domNode).
  - q: When would you use a portal?
    a: "For modals, tooltips, dropdown menus and toasts — anything that must appear on top and not be clipped by a parent's overflow: hidden or z-index."
  - q: Do events from inside a portal reach the parent component?
    a: Yes. Events bubble through the React tree, so a click inside a portal still reaches onClick handlers on its React parents.
  - q: What is forwardRef, and do you still need it?
    a: forwardRef let a parent pass a ref through a component to an inner DOM element. In React 19, function components can take ref as a normal prop, so new code doesn't need forwardRef.
  - q: Give a common use of refs.
    a: Focusing an input, scrolling to an element, measuring its size, or working with a non-React library that needs a real DOM node.
---

## 💡 What is it?

These are two separate tools that are often asked together.

A **portal** lets a [component](glossary:component) appear in a **different place in the HTML page**. For example, a popup can be drawn at the end of `<body>`. In your React code, it still lives inside its parent component.

A **ref** gives you the **real HTML element** (a [DOM](glossary:dom) node). **Forwarding a ref** means a parent passes its ref through a child component to an element inside that child.

## 🏠 Real-life example

**Portal:** think of a **school announcement**. The message is written in the principal's office, but it plays from the **speakers in every classroom**. It belongs to the office, but it appears somewhere else.

- The **principal's office** = the parent component, where the modal is written in code.
- The **speakers** = `document.body`, where the modal actually appears in the page.
- **Replies still go back to the office** = events still bubble up to the React parent.

**Ref:** think of a **TV remote**. You don't walk to the TV to press its buttons. The remote gives you **direct control**.

- The **TV** = an input box in the page.
- The **remote** = the ref.
- **Lending your remote to a friend** = forwarding the ref, so the parent can control an element inside the child.

## 🧑‍💻 Code example

Paste into `src/App.jsx` of a Vite React app (`npm create vite@latest`, pick React). Run `npm run dev`.

```jsx
import { useRef, useState } from 'react';                          // two React hooks
import { createPortal } from 'react-dom';                          // the portal function

function Modal({ onClose, children }) {                            // a simple modal component
  return createPortal(                                             // draw this somewhere else in the page…
    <div style={{ position: 'fixed', inset: 0, background: '#0008' }}> {/* full-screen dark overlay */}
      <div style={{ background: 'white', margin: '20vh auto', padding: 16, width: 300 }}> {/* the white box */}
        {children}                                                 {/* whatever the parent put inside */}
        <button onClick={onClose}>Close</button>                   {/* close button */}
      </div>                                                       {/* end of the box */}
    </div>,                                                        // end of the overlay
    document.body,                                                 // …here: at the end of <body>
  );                                                               // end of createPortal
}                                                                  // end of Modal

function NameInput({ ref, label }) {                               // React 19: ref arrives as a normal prop
  return <label>{label} <input ref={ref} /></label>;               // attach the ref to the real <input>
}                                                                  // end of NameInput

export default function App() {                                    // the main component
  const [open, setOpen] = useState(false);                         // is the modal open? starts false
  const inputRef = useRef(null);                                   // will hold the real <input> element
  return (                                                         // what App draws
    <div style={{ overflow: 'hidden', height: 120, border: '1px solid' }}> {/* a box that clips its children */}
      <NameInput ref={inputRef} label="Name" />                    {/* pass the ref down to the child */}
      <button onClick={() => inputRef.current.focus()}>Focus name</button> {/* use the ref: put the cursor in the input */}
      <button onClick={() => setOpen(true)}>Open modal</button>    {/* show the modal */}
      {open && <Modal onClose={() => setOpen(false)}>Hello from a portal!</Modal>} {/* only when open */}
    </div>                                                         // end of the clipping box
  );                                                               // end of return
}                                                                  // end of App
```

**What you see:**

```text
- "Focus name" puts the cursor in the Name box (the ref works).
- "Open modal" shows a full-screen modal. It is NOT cut off,
  even though its parent box has overflow: hidden and is only 120px tall.
- In DevTools > Elements, the modal's <div> is at the end of <body>,
  outside the #root div.
```

## 🔍 Deeper version

**Portals:**

- `createPortal(children, domNode, key?)` renders `children` into `domNode`.
- The portal is still **part of the React tree**. It gets context from its parents (theme, Redux store, router).
- **Events bubble through the React tree**, not the DOM tree. A click inside the modal reaches `onClick` handlers on the modal's React parents, even though in the DOM it sits under `<body>`. Use `e.stopPropagation()` if you don't want that.
- Common uses: modals, dialogs, tooltips, dropdown menus, toast messages. Component libraries like Mantine use portals inside their `Modal`, `Menu` and `Popover`.
- **Accessibility:** a real modal also needs focus trapping, `Escape` to close, `role="dialog"`, `aria-modal="true"`, and returning focus when it closes. The native `<dialog>` element with `showModal()` gives much of this for free.

**Refs:**

- `useRef(null)` creates a box `{ current: null }`. React fills `current` with the DOM element after it is drawn.
- Use refs for things outside React's normal data flow: focus, scroll, measuring size, media playback, or third-party libraries.
- Don't use refs to read or change what React already controls, like an input's text in a controlled form.

**Passing a ref to a child — old way vs new way:**

| React version | How a child receives a ref |
|---|---|
| React 18 and older | Wrap the child in `forwardRef((props, ref) => …)` |
| React 19 | Just read `ref` from props: `function Input({ ref }) { … }` |

**`useImperativeHandle`** lets a child give the parent a **custom object** instead of the raw DOM node. For example, it could expose only `focus()` and `clear()`. Use it rarely.

:::version[Version note]
**React 19** made `ref` a normal prop for function components, and `forwardRef` is planned for deprecation. React 19 also lets ref callbacks **return a cleanup function**. Libraries that support React 18 still use `forwardRef`, so you will see both styles.
:::

## 🎯 Why do we use it?

**Portals** solve a layout problem. A modal inside a card with `overflow: hidden` or a low `z-index` gets cut off or hidden. Rendering it at the end of `<body>` fixes this. You can still write it next to the code that opens it, with all its props and context.

**Refs** solve the "I need the real element" problem. React manages the screen for you, but some tasks need the actual element, like putting the cursor in an input after a dialog opens.

## ⚠️ Common mistakes

- **Building modals without a portal**, then fighting `z-index` and `overflow` bugs.
- **Forgetting that portal events bubble to React parents**, so a click inside the modal also triggers a parent's `onClick`.
- **Reading `ref.current` during render.** It is `null` on the first render. Use it in effects or event handlers.
- **Using refs instead of state** for things that should update the screen. Changing `ref.current` does **not** re-render.

## 🗣️ How to answer in an interview

> "A portal, created with createPortal, renders children into a different DOM node, usually document.body, while keeping them in the same React tree. I use it for modals, tooltips and dropdowns, so they're not clipped by a parent's overflow or z-index. Because it's still in the React tree, it gets context, and events bubble up through the React parents, not the DOM parents.
>
> Refs give direct access to a DOM element. I use them for focus, scrolling or measuring, never for things that should be state. To let a parent reach an element inside a child, React 18 needed forwardRef. In React 19, a function component can read ref straight from props, so new code doesn't need forwardRef."

## 🔁 Follow-up questions

### Why do events from a portal bubble to the React parent?

React handles events through its own tree, not the browser's DOM tree. The portal is a React child of its parent, so the event travels up the React tree.

### What's the difference between `useRef` and `useState`?

Both keep a value between renders. Changing state re-renders the component. Changing `ref.current` does not. Use state for what the screen shows, and a ref for things like timers or DOM elements.

### When would you use `useImperativeHandle`?

When a child should give the parent a small, safe API — like `focus()` and `scrollToTop()` — instead of the whole DOM node. It's rare.

### Do you need a portal if you use the `<dialog>` element?

Often not. `dialog.showModal()` shows it in the browser's "top layer", above everything, with no z-index fight. It also traps focus and closes on `Escape`.

## ✅ Quick check

### 1. A modal is inside a `<div onClick={handleParent}>`. The modal is rendered with a portal into `document.body`. You click inside the modal. Does `handleParent` run?

:::answer
**Yes.** Events from a portal bubble through the **React** tree. The modal is a React child of that div, so the click reaches `handleParent`. Use `e.stopPropagation()` inside the modal if you don't want this.
:::

### 2. What does this print on the first render?

```jsx
function Box() {                         // a component
  const ref = useRef(null);              // a ref box
  console.log(ref.current);              // read it during render
  return <div ref={ref}>Hi</div>;        // attach it to a div
}
```

:::answer
**`null`.** During the first render, the `<div>` doesn't exist yet. React fills `ref.current` after it updates the page. Read refs in effects or event handlers.
:::
