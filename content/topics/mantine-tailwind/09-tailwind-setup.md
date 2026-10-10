---
title: "Tailwind: the utility-first idea and setup (v4)"
stack: mantine-tailwind
order: 9
level: Basic
mustKnow: true
askedFrequency: very common
summary:
  - Tailwind is a utility-first CSS framework — you style elements with small classes like p-4, flex and text-lg.
  - "Setup in Tailwind v4 with Vite: npm install tailwindcss @tailwindcss/vite, add the plugin, and put @import \"tailwindcss\"; in your CSS."
  - Tailwind scans your files and outputs CSS only for the classes you used, so the CSS stays small.
  - "Spacing: 1 unit = 4px, so p-4 = 16px and mt-2 = 8px."
  - "v4 needs no tailwind.config.js — you customise it in CSS with @theme."
cards:
  - q: What does utility-first mean?
    a: You style with many small classes that each do one thing (p-4 = padding 16px, flex = display flex), instead of writing your own CSS classes.
  - q: How do you add Tailwind v4 to a Vite app?
    a: "npm install tailwindcss @tailwindcss/vite, add tailwindcss() to plugins in vite.config, and write @import \"tailwindcss\"; at the top of your CSS file."
  - q: "What is 1 spacing unit in Tailwind?"
    a: "0.25rem, which is 4px by default. So p-4 = 16px, m-8 = 32px."
  - q: Why is Tailwind's CSS file small in production?
    a: It scans your source files and only generates the classes you actually wrote.
  - q: What changed in Tailwind v4?
    a: CSS-first setup (@import "tailwindcss", @theme for custom values), no config file needed, automatic file detection and a much faster engine.
---

## 💡 What is it?

**Tailwind CSS** is a styling tool. You don't write your own CSS classes. Instead, you use **many tiny ready-made classes**.

Each class does **one small job**. `p-4` adds padding. `flex` makes a row. `text-lg` makes text bigger.

You put the classes on your HTML or JSX. Tailwind then makes a CSS file with **only the classes you used**.

## 🏠 Real-life example

Think of **dressing up with stickers**.

Instead of drawing a whole costume, you have a sheet of small stickers: "red", "big", "round", "shiny". You stick the ones you want onto your paper doll.

- **The sticker sheet** = Tailwind's classes.
- **One sticker** = one class, like `bg-red-500`.
- **Sticking several on one doll** = `className="bg-red-500 p-4 rounded-full"`.
- **The shop only charges for stickers you used** = Tailwind only puts used classes into the CSS file.

## 🧑‍💻 Code example

Set up a Vite React app with Tailwind v4:

```bash
npm create vite@latest tw-demo        # make a new app (pick React)
cd tw-demo                            # go into the folder
npm install tailwindcss @tailwindcss/vite   # Tailwind + its Vite plugin
```

**`vite.config.js`:**

```js
import { defineConfig } from 'vite';                 // Vite's config helper
import react from '@vitejs/plugin-react';            // React support for Vite
import tailwindcss from '@tailwindcss/vite';         // the Tailwind v4 plugin

export default defineConfig({                         // export our config
  plugins: [react(), tailwindcss()],                  // turn on React and Tailwind
});                                                   // end of config
```

**`src/index.css`** (replace everything in it):

```css
@import "tailwindcss";   /* loads all of Tailwind — this one line is the whole setup */
```

**`src/App.jsx`:**

```jsx
export default function App() {                                     // our main component
  return (                                                          // what the screen shows
    <div className="flex min-h-screen items-center justify-center bg-slate-100"> {/* full-height page, content centred, light grey */}
      <div className="rounded-xl bg-white p-6 shadow-md">           {/* card: rounded 12px, white, padding 24px, shadow */}
        <h1 className="text-2xl font-bold text-slate-900">Hari</h1> {/* 24px bold dark text */}
        <p className="mt-2 text-slate-600">Full stack developer</p> {/* margin-top 8px, grey text */}
      </div>                                                        {/* end of the card */}
    </div>                                                          // end of the page
  );                                                                // end of what App returns
}                                                                   // end of App
```

Run `npm run dev` and open the link.

```text
A light-grey page with a white card in the exact centre.
The card has rounded corners and a soft shadow.
"Hari" is big and bold; "Full stack developer" is grey, just below it.
```

What every class means:

| Class | Meaning |
|---|---|
| `flex` | display: flex (children in a row) |
| `min-h-screen` | at least the full height of the screen |
| `items-center` / `justify-center` | centre vertically / horizontally |
| `bg-slate-100` | very light grey background (100 = light shade) |
| `rounded-xl` | 12px rounded corners |
| `p-6` | padding 6 × 4px = 24px |
| `shadow-md` | a medium shadow |
| `text-2xl` | font size 24px |
| `font-bold` | weight 700 |
| `mt-2` | margin-top 2 × 4px = 8px |
| `text-slate-600` | medium grey text |

## 🔍 Deeper version

**How Tailwind builds the CSS.** At build time, Tailwind scans your project files for class names. It generates CSS only for those. If you never write `bg-pink-300`, it is not in the output. This keeps production CSS small (often under 15 KB gzipped).

**Class names must be complete strings.** Tailwind reads your files as text. It cannot run your code. So `` `bg-${color}-500` `` doesn't work — the full name `bg-red-500` never appears. Use a lookup object with full class names instead.

**The scale.** Tailwind uses fixed scales so designs stay consistent:
- Spacing: `1` = 0.25rem = 4px. `p-4` = 16px, `p-8` = 32px.
- Colours: 50 (lightest) to 950 (darkest), like `blue-500`.
- Text: `text-sm` 14px, `text-base` 16px, `text-lg` 18px, `text-xl` 20px, `text-2xl` 24px.
- Arbitrary values for one-offs: `w-[327px]`, `bg-[#1f5f99]`.

**Variants (prefixes).** `hover:`, `focus:`, `md:` (from 768px), `dark:` and more add conditions to a class. See [Tailwind states](topic:mantine-tailwind/tailwind-states).

**Customising in v4.** No JS config file is needed. You add design tokens in CSS:

```css
@import "tailwindcss";      /* load Tailwind */
@theme {                    /* our design tokens */
  --color-brand: #1f5f99;   /* now bg-brand, text-brand, border-brand work */
}                           /* end of @theme */
```

See [customising Tailwind with @theme](topic:mantine-tailwind/tailwind-theme).

:::version[Version note]
**Tailwind v3** used `npx tailwindcss init`, a `tailwind.config.js` with a `content: [...]` list of files, PostCSS, and three lines: `@tailwind base; @tailwind components; @tailwind utilities;`.
**Tailwind v4** (2025) uses one line, `@import "tailwindcss";`, finds your files automatically, is configured in CSS with `@theme`, and has a dedicated Vite plugin. It also needs modern browsers (Safari 16.4+, Chrome 111+, Firefox 128+), because it uses newer CSS features.
:::

## 🎯 Why do we use it?

- **Fast to write.** No switching between JSX and CSS files, and no inventing class names.
- **Small CSS.** Only used classes are shipped.
- **Consistent design.** Spacing, colours and font sizes come from one scale.
- **Easy responsive design.** `md:flex-row` instead of writing media queries.
- **Safe to change.** Styles live on the element, so deleting a component deletes its styles too.

## ⚠️ Common mistakes

- **Building class names with string templates** (`` `text-${size}` ``). Tailwind can't see them, so they are missing in the CSS.
- **Following v3 tutorials in a v4 project** (`@tailwind base`, `tailwind.config.js`). Use the v4 setup.
- **Forgetting that 1 unit = 4px.** `p-4` is 16px, not 4px.
- **Huge, unreadable class strings.** Extract repeated patterns into components. See [reusing Tailwind styles](topic:mantine-tailwind/tailwind-reuse).

## 🗣️ How to answer in an interview

> "Tailwind is a utility-first CSS framework. Instead of writing custom CSS classes, I combine small classes that each do one thing, like `flex`, `p-4` for 16px padding, or `text-slate-600`. At build time Tailwind scans my files and generates CSS only for the classes I used, so production CSS stays small.
>
> In Tailwind v4 the setup is very simple: install `tailwindcss` and `@tailwindcss/vite`, add the plugin, and put `@import "tailwindcss";` in my CSS. Custom colours or fonts go in an `@theme` block in CSS — no config file needed.
>
> One rule I'm careful about: class names must appear as complete strings, because Tailwind reads the files as text, so I never build them with template strings."

[FILL IN: the early-career project where you used Tailwind, and what you built with it.]

## 🔁 Follow-up questions

### Doesn't Tailwind make HTML messy?

It can. Long class lists are the main downside. The fix is to keep components small and extract repeated patterns into React components (not `@apply` everywhere).

### How does Tailwind know which classes to keep?

It scans your source files as plain text for class-like words. In v4 this is automatic. In v3 you listed the files in `content`.

### Can I use a value that isn't in the scale?

Yes, with arbitrary values in square brackets: `mt-[13px]`, `bg-[#ff5733]`, `grid-cols-[200px_1fr]`.

### What is the difference between Tailwind and Bootstrap?

Bootstrap gives ready components (`btn`, `card`, `navbar`) with a fixed look. Tailwind gives low-level utilities, so you build your own look.

## ✅ Quick check

### 1. What is the padding of `p-6`?

:::answer
**24px** — 6 units × 4px.
:::

### 2. Why won't this class work? `` <div className={`bg-${color}-500`} /> ``

:::answer
Tailwind reads files as text. The full class name (like `bg-red-500`) never appears, so its CSS is **never generated**. Use a map such as `{ red: 'bg-red-500', blue: 'bg-blue-500' }`.
:::

### 3. Which line loads Tailwind in a v4 CSS file?

- A) `@tailwind base;`
- B) `@import "tailwindcss";`
- C) `@use tailwind;`

:::answer
**B.** `@tailwind base;` is the old v3 way.
:::
