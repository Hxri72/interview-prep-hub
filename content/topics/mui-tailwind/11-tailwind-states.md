---
title: "Tailwind states: hover, focus, dark mode"
stack: mui-tailwind
order: 11
level: Intermediate
mustKnow: false
askedFrequency: common
summary:
  - "A prefix plus a colon applies a class only in some state: hover:bg-blue-700 works only while the mouse is over the element."
  - "Common states: hover:, focus-visible:, active:, disabled:, and first: / last: for list items."
  - "group-hover: styles a child when its parent is hovered. peer-*: styles an element based on its sibling."
  - "dark: applies in dark mode. In v4 it follows the system setting by default; use @custom-variant to switch with a class."
  - "Prefixes stack: md:hover:bg-blue-700 = on screens 768px and up, while hovered."
cards:
  - q: What does hover:bg-blue-700 do?
    a: It makes the background darker blue (shade 700) only while the mouse is over the element.
  - q: Why use focus-visible instead of focus for outlines?
    a: focus-visible shows the outline for keyboard users, but not after a mouse click. Keyboard users still see where they are.
  - q: How do you style a child when the whole card is hovered?
    a: Put the class group on the parent, and use group-hover:... on the child.
  - q: How does dark mode work by default in Tailwind v4?
    a: dark:... follows the operating system setting (prefers-color-scheme). For a toggle button, add @custom-variant dark (&:where(.dark, .dark *)); and put the class dark on <html>.
  - q: Can you combine prefixes?
    a: "Yes. md:hover:bg-blue-700 applies only on screens 768px and wider, while hovered."
---

## 💡 What is it?

A **state** is a moment when an element looks different. For example: the mouse is over it, it has keyboard focus, or the app is in dark mode.

In Tailwind, you add a **prefix and a colon** in front of a class. `hover:bg-blue-700` means: "use `bg-blue-700`, but **only while hovered**."

You don't write any CSS for this. The prefix does it. Changing `dark` with a button uses React [state](glossary:state).

## 🏠 Real-life example

Think of a **classroom light switch with a small glow**.

- Normally the switch is white. That's the **normal class**, like `bg-white`.
- When you put your finger near it, it glows. That's **`hover:`**.
- When it's the one you're about to press, it has a ring around it. That's **`focus-visible:`**.
- At night, the whole room changes to soft colours. That's **`dark:`**.
- When the teacher locks it, it turns grey and can't be pressed. That's **`disabled:`**.

The switch is the same switch. Only its look changes with the situation.

## 🧑‍💻 Code example

Vite React app with Tailwind v4 (see [Tailwind classes](topic:mui-tailwind/tailwind-classes) for setup). Put the CSS in `src/index.css` and the JSX in `src/App.jsx`. Run `npm run dev`.

```css
@import "tailwindcss";                                 /* load Tailwind */
@custom-variant dark (&:where(.dark, .dark *));        /* dark: now means "inside an element that has class dark" */
```

```jsx
import { useState } from 'react';                                    // React's state hook

export default function App() {                                      // the main component
  const [dark, setDark] = useState(false);                           // dark = false means light mode at start
  return (                                                           // what the page shows
    <div className={dark ? 'dark' : ''}>                             {/* add class "dark" when dark is true */}
      <div className="min-h-screen bg-white p-6 dark:bg-slate-900">  {/* white page; dark:bg-slate-900 = very dark blue-grey in dark mode */}
        <button                                                      // a normal HTML button
          onClick={() => setDark(!dark)}                             // clicking flips light ↔ dark
          className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 active:scale-95" // hover = darker blue; keyboard focus = 2px outline 2px away; active = shrink to 95% while pressed
        >                                                            {/* end of the opening button tag */}
          Toggle dark mode                                           {/* the button label */}
        </button>                                                    {/* end of the button */}
        <div className="group mt-6 rounded-xl border border-slate-200 p-4 hover:border-blue-500 dark:border-slate-700"> {/* group = children can react to this card's hover; border colour changes on hover */}
          <p className="font-semibold text-slate-900 dark:text-white">Candidate card</p> {/* almost-black text; white in dark mode */}
          <p className="text-sm text-slate-500 group-hover:text-blue-600">Hover the card to see me change</p> {/* turns blue when the PARENT card is hovered */}
        </div>                                                       {/* end of the card */}
        <button disabled className="mt-6 rounded-lg bg-blue-600 px-4 py-2 text-white disabled:cursor-not-allowed disabled:opacity-50"> {/* disabled: = only when the button is disabled; opacity-50 = half see-through */}
          Can't click me                                             {/* the disabled button label */}
        </button>                                                    {/* end of the disabled button */}
      </div>                                                         {/* end of the page */}
    </div>                                                           // end of the dark-mode wrapper
  );                                                                 // end of what App returns
}                                                                    // end of App
```

**What you see:**

```text
A blue button. Hovering darkens it. Pressing Tab shows a blue outline around it.
Clicking it switches the page to a dark background with white text.
Hovering the card turns its border blue AND turns the small line of text blue.
The last button is faded and shows a "not allowed" cursor.
```

## 🔍 Deeper version

**How the prefix becomes CSS.** `hover:bg-blue-700` makes a rule like `.hover\:bg-blue-700:hover { background-color: … }`. The prefix (Tailwind calls it a **variant**) only adds the condition.

**Common variants:**

| Prefix | Applies when… |
|---|---|
| `hover:` | the mouse is over it |
| `focus:` | it has focus (mouse or keyboard) |
| `focus-visible:` | it has focus **and** the browser thinks a ring should show (mostly keyboard) |
| `active:` | it is being pressed |
| `disabled:` | the element has the `disabled` attribute |
| `first:` / `last:` / `odd:` | it is the first / last / odd child |
| `group-hover:` | a parent with class `group` is hovered |
| `peer-checked:` | an earlier sibling with class `peer` is checked |
| `aria-expanded:` | the element has `aria-expanded="true"` |
| `md:` | the screen is 768px wide or more |

**Stacking.** You can chain prefixes: `md:hover:bg-blue-700` = "on screens 768px and up, while hovered". `dark:md:hover:…` also works.

**Dark mode, two ways.**
1. **Default (v4):** `dark:` uses the CSS media query `prefers-color-scheme: dark`. It follows the operating system. No setup needed.
2. **With a toggle:** add `@custom-variant dark (&:where(.dark, .dark *));` in your CSS. Then `dark:` applies inside any element with class `dark`. You usually put that class on `<html>` and save the choice in `localStorage`.

The `:where()` part gives the selector **zero specificity**. Specificity is how strongly a CSS rule wins. Zero means `dark:` classes don't accidentally beat other utilities.

:::version[Version note]
In **Tailwind v3**, you turned on class-based dark mode with `darkMode: 'class'` in `tailwind.config.js`. **Tailwind v4** uses `@custom-variant` in CSS instead. Also, in v4, `hover:` only applies on devices that **can** hover. On a phone, a tap no longer leaves a "stuck" hover style.
:::

## 🎯 Why do we use it?

- **No extra CSS files.** The state styles sit right next to the normal styles.
- **Easy to read.** `hover:bg-blue-700` says exactly what happens and when.
- **Accessibility.** `focus-visible:` makes it simple to give keyboard users a clear outline.
- **Dark mode with little work.** One `dark:` class per colour, instead of a second stylesheet.

## ⚠️ Common mistakes

- **Removing the focus outline** with `outline-none` and adding nothing back. Keyboard users then can't see where they are. Add a `focus-visible:` style.
- **Forgetting the `group` class on the parent.** `group-hover:` on the child does nothing without it.
- **Expecting `dark:` to follow a toggle** without adding `@custom-variant`. By default it follows the operating system.
- **Relying on hover for important actions.** Phones have no hover. Hidden-until-hover buttons are invisible on mobile.

## 🗣️ How to answer in an interview

> "In Tailwind, states are handled with variant prefixes. hover:bg-blue-700 only applies while the element is hovered. The common ones I use are hover, focus-visible for keyboard outlines, active, disabled, and group-hover when a child should react to its parent being hovered.
>
> Prefixes can be stacked, like md:hover:something, which means on medium screens and up, while hovered.
>
> For dark mode, Tailwind v4 follows the system setting by default. If the app has its own toggle, I add a custom variant in CSS so dark: applies inside an element with the dark class, and I put that class on the html element. I'm careful never to remove focus outlines without replacing them, because keyboard users need them."

## 🔁 Follow-up questions

### What is the difference between `focus:` and `focus-visible:`?

`focus:` applies whenever the element has focus, even after a mouse click. `focus-visible:` applies mostly when the user is using the keyboard. It lets you show a strong outline for keyboard users without showing it after every click.

### How do you style an input's label when the input is invalid?

Give the input the class `peer` and put the label **after** it. Then use `peer-invalid:text-red-600` on the label. Peer variants only work on **later** siblings, because CSS can only look forward.

### How do you avoid a "flash" of light mode when the page loads in dark mode?

Set the `dark` class on `<html>` in a tiny inline script in `index.html`, before React loads. Read the saved choice from `localStorage` there.

### Can you make your own variant?

Yes. In v4, `@custom-variant` creates one. For example, `@custom-variant theme-brand (&:where(.brand, .brand *));` lets you write `theme-brand:bg-blue-600`.

## ✅ Quick check

### 1. When does `md:hover:underline` apply?

:::answer
**On screens 768px and wider, while the mouse is over the element.** Both conditions must be true.
:::

### 2. A child has `group-hover:text-blue-600`, but nothing happens on hover. What is missing?

:::answer
The **parent needs the class `group`**. Without it, the child has no group to watch.
:::

### 3. Your app has a dark-mode toggle that adds `dark` to `<html>`, but `dark:` classes ignore it. Why?

- A) Tailwind doesn't support dark mode
- B) In v4, `dark:` follows the system setting until you add a `@custom-variant dark` rule
- C) You must restart the computer

:::answer
**B.** Add `@custom-variant dark (&:where(.dark, .dark *));` to your CSS.
:::
