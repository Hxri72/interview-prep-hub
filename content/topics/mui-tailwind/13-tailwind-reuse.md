---
title: Reusing Tailwind styles (components, clsx, @apply)
stack: mui-tailwind
order: 13
level: Intermediate
mustKnow: false
askedFrequency: common
summary:
  - "Long class lists repeat. The best way to reuse them is a React component, like <Button>."
  - "clsx joins class names and drops the false ones: clsx('p-4', isActive && 'bg-blue-600')."
  - "tailwind-merge fixes clashes: twMerge('p-2 p-4') keeps only p-4. Many teams combine both in a cn() helper."
  - "@apply copies utilities into your own CSS class. Use it rarely, for things like third-party HTML you can't edit."
  - "Variants (primary, danger, small) are often stored as a lookup object of full class names."
cards:
  - q: What is the best way to reuse a long list of Tailwind classes?
    a: Make a React component (like <Button>) that holds the classes once. Then reuse the component everywhere.
  - q: What does clsx do?
    a: "It joins class names into one string and skips falsy values, so clsx('btn', false && 'hidden') gives 'btn'."
  - q: Why use tailwind-merge?
    a: When two classes set the same thing (p-2 and p-4), CSS order decides the winner, not the order in className. twMerge removes the loser so the last one you wrote wins.
  - q: When is @apply a good idea?
    a: For HTML you don't control, like Markdown output or a third-party widget. For your own JSX, a component is usually better.
  - q: What is a cn() helper?
    a: "A tiny function: cn(...inputs) = twMerge(clsx(inputs)). It handles conditions and clashes in one call."
---

## 💡 What is it?

Tailwind class lists can get long. If ten buttons need the same twenty classes, you don't want to copy them ten times.

There are three main ways to **reuse** Tailwind styles:
1. **A React [component](glossary:component)** that holds the classes once (the best way).
2. **Helper functions** like `clsx` and `tailwind-merge`, to build class lists cleanly.
3. **`@apply`** in CSS, which copies utilities into your own class (use rarely).

## 🏠 Real-life example

Think of **school ID cards**.

The school doesn't hand-draw each card. It makes **one card template** with the logo, colours and layout. Then it prints each student's name and photo on it.

- **The card template** = a `<Button>` component with all the Tailwind classes inside.
- **The student's name and photo** = the props (`variant="danger"`, `size="sm"`).
- **A small sticker added for prefects** = a condition with `clsx` (`isPrefect && 'border-gold'`).
- **Fixing two stickers in the same spot** = `tailwind-merge`, which keeps only the last one.
- **Photocopying the template's style onto a paper form you didn't design** = `@apply`.

## 🧑‍💻 Code example

Setup: a Vite React app with Tailwind v4. Run `npm install clsx tailwind-merge`. Put the helper in `src/cn.js` and the button in `src/Button.jsx`.

```jsx
// src/cn.js
import { clsx } from 'clsx';                                  // joins class names, skips false/null/undefined
import { twMerge } from 'tailwind-merge';                     // removes clashing Tailwind classes, keeps the last one

export function cn(...inputs) {                               // cn = "class names"; takes any number of inputs
  return twMerge(clsx(inputs));                               // first join with clsx, then fix clashes with twMerge
}                                                             // end of cn
```

```jsx
// src/Button.jsx
import { cn } from './cn';                                    // our helper from above

const variants = {                                            // full class names per variant (Tailwind can see them)
  primary: 'bg-blue-600 text-white hover:bg-blue-700',        // blue button; darker blue on hover
  danger: 'bg-red-600 text-white hover:bg-red-700',           // red button; darker red on hover
  ghost: 'bg-transparent text-slate-700 hover:bg-slate-100',  // no background; light grey on hover
};                                                            // end of variants

const sizes = {                                               // full class names per size
  sm: 'px-3 py-1 text-sm',                                    // 12px left/right, 4px top/bottom, 14px text
  md: 'px-4 py-2 text-base',                                  // 16px left/right, 8px top/bottom, 16px text
};                                                            // end of sizes

export function Button({ variant = 'primary', size = 'md', loading = false, className, ...rest }) { // defaults: primary, md, not loading
  return (                                                    // what the button renders
    <button                                                   // a real <button> (keyboard and screen readers work)
      className={cn(                                          // build the final class list
        'rounded-lg font-medium',                             // shared by every button: 8px corners, weight 500
        variants[variant],                                    // the colour set for this variant
        sizes[size],                                          // the padding and text size for this size
        loading && 'cursor-wait opacity-60',                  // only added while loading (false is skipped by clsx)
        className,                                            // extra classes from the parent; they win clashes
      )}                                                      // end of cn(...)
      disabled={loading}                                      // can't click while loading
      {...rest}                                               // pass other props like onClick
    />                                                        // self-closing; children come through rest
  );                                                          // end of what Button returns
}                                                             // end of Button
```

Use it:

```jsx
<Button variant="danger" size="sm" className="px-6">Reject</Button> // px-6 (24px) replaces px-3 thanks to twMerge
```

**What you see:**

```text
A small red "Reject" button with 24px left/right padding.
In DevTools, its class list contains px-6 but NOT px-3 — tailwind-merge removed the clash.
```

## 🔍 Deeper version

**Why clashes happen.** `className="p-2 p-4"` looks like "p-4 wins because it's last". But CSS doesn't care about the order inside `className`. It cares about the order of rules **in the stylesheet**. Tailwind decides that order, not you. So the winner can feel random. `tailwind-merge` knows which utilities clash (`p-2` vs `p-4`, `bg-red-600` vs `bg-blue-600`) and keeps only the **last one you passed**.

**clsx input types.** `clsx` accepts strings, arrays and objects:
- `clsx('a', ['b', 'c'])` → `'a b c'`
- `clsx({ 'bg-blue-600': isActive, 'opacity-50': isDisabled })` → only the keys whose value is true.

**Variant libraries.** For bigger design systems, teams use `cva` (class-variance-authority) or `tailwind-variants`. They describe variants and sizes as a config object, with defaults and combined variants, and return the right class string.

**`@apply`, used carefully.**

```css
.prose-table th {                                  /* style HTML from Markdown that we can't add classes to */
  @apply bg-slate-100 px-3 py-2 text-left;         /* copy these utilities into this rule */
}                                                  /* end of the rule */
```

`@apply` is fine for content you can't put classes on: Markdown output, CMS HTML, a third-party widget. For your own components, prefer a React component. Heavy `@apply` use brings back the problems Tailwind was meant to avoid: invented class names and CSS that is far from the markup.

:::version[Version note]
In **Tailwind v4**, if you use `@apply` inside a separate stylesheet (like a CSS module or a Vue `<style>` block), add `@reference "../index.css";` at the top. That tells Tailwind where your theme lives. In v3, this worked without the extra line.
:::

## 🎯 Why do we use it?

- **One place to change.** Change the button component once, and every button in the app updates.
- **Clean JSX.** Pages say `<Button variant="danger">`, not 20 classes.
- **Predictable overrides.** With `cn()`, a parent can pass `className="px-6"` and it reliably wins.
- **Fewer bugs from conditions.** `clsx` handles `false`, `null` and `undefined`, so you don't get `"undefined"` in your class list.

## ⚠️ Common mistakes

- **Building class names dynamically**, like `` `bg-${color}-600` ``. Tailwind can't see them. Use a lookup object with full names, as in `variants` above.
- **Copy-pasting long class lists** instead of making a component.
- **Using `@apply` for everything**, recreating a big custom CSS file.
- **Expecting the last class in `className` to win** without `tailwind-merge`.

## 🗣️ How to answer in an interview

> "My first choice for reusing Tailwind styles is a React component. A Button component holds the classes once and takes props like variant and size. I keep the variant classes in a lookup object with full class names, so Tailwind can find them.
>
> To build the class string I use a small cn helper, which is twMerge of clsx. clsx handles conditions, like adding opacity only while loading. tailwind-merge removes clashes, so if a parent passes px-6, it replaces the default px-3 instead of fighting with it.
>
> I use @apply only for HTML I can't put classes on, like rendered Markdown. Using it everywhere brings back a big custom CSS file."

[FILL IN: if you built a shared component like this in a past project, mention it — only if true.]

## 🔁 Follow-up questions

### What's the difference between clsx and classnames?

They do the same job. `clsx` is a smaller, faster drop-in replacement for the older `classnames` package.

### Why not just put the shared classes in a constant string?

You can, for very small cases. But a component also shares behaviour: `disabled`, loading spinners, accessibility attributes and the `<button>` element itself. A string only shares looks.

### When would you choose cva?

When a component has many variants that combine, like `intent × size × outline`, plus default variants. `cva` keeps that matrix readable and gives typed props in TypeScript.

### Does tailwind-merge slow down rendering?

Slightly, because it parses classes on every render. For normal UIs it is very fast and caches results. For huge lists, you can memoise the class string.

## ✅ Quick check

### 1. What does this return?

```js
clsx('p-4', false && 'hidden', null, 'text-sm'); // join only the truthy values
```

:::answer
**`'p-4 text-sm'`.** `false` and `null` are skipped.
:::

### 2. What does this return?

```js
twMerge('px-3 py-1 bg-red-600', 'px-6'); // later px wins
```

:::answer
**`'py-1 bg-red-600 px-6'`.** `px-6` clashes with `px-3`, so `px-3` is removed.
:::

### 3. Where is `@apply` a better fit than a React component?

- A) Your own Button component
- B) Styling HTML produced from Markdown, where you can't add classes
- C) Every div in the app

:::answer
**B.** For HTML you don't control, `@apply` in a CSS rule is a good fit.
:::
