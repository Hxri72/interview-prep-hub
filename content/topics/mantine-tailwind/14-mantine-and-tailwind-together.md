---
title: Using Mantine and Tailwind together without conflicts
stack: mantine-tailwind
order: 14
level: Intermediate
mustKnow: true
askedFrequency: common
summary:
  - Mantine and Tailwind can live in one app. Mantine gives complex widgets; Tailwind is handy for layout and small tweaks.
  - "The main risk is CSS order: which rule wins when both style the same element. CSS layers (@layer) fix this."
  - "Declare the order once: @layer theme, base, mantine, components, utilities; — so Tailwind utilities win over Mantine, and Mantine wins over Tailwind's reset."
  - "Breakpoints differ: Mantine sm/md/lg = 48em/62em/75em (768/992/1200px); Tailwind sm/md/lg = 640/768/1024px. Make Tailwind's match Mantine's in @theme."
  - Use one source of truth for colours and spacing, so both libraries look like one product.
cards:
  - q: Why can Mantine and Tailwind clash?
    a: Both add CSS to the same page. Tailwind's reset (preflight) and utilities can override Mantine styles, or Mantine can override your utilities, depending on order.
  - q: What is a CSS layer?
    a: "A named group of CSS rules (@layer name). A later layer beats an earlier one, no matter how specific the selectors are."
  - q: Which Mantine CSS file do you import when using layers?
    a: "@mantine/core/styles.layer.css — the same styles as styles.css, wrapped in @layer mantine."
  - q: What layer order do you declare with Tailwind v4?
    a: "@layer theme, base, mantine, components, utilities; — Tailwind's reset first, then Mantine, then utilities last so they can adjust Mantine components."
  - q: How do you stop md breaking at different widths in Mantine and Tailwind?
    a: "Override Tailwind's breakpoints in @theme to Mantine's values, e.g. --breakpoint-md: 62em; (992px)."
---

## 💡 What is it?

Some apps use **Mantine** for ready-made widgets and **Tailwind** for quick layout classes.

Both put [CSS](glossary:css) on the same page. If you don't plan it, they fight. A Tailwind class may not apply to a Mantine button. Or Tailwind's reset may change how Mantine looks.

The fix is to tell the browser the **order** of the styles, using **CSS layers**. Then you also make the **breakpoints** and **colours** match.

## 🏠 Real-life example

Think of **painting a classroom wall** with your class.

- First, the caretaker puts on a **base coat** (white primer).
- Then the art teacher paints a **big mural** with set colours.
- Last, students add **small touches**, like their names.

If the caretaker comes back and paints primer over the mural, the mural is ruined. So everyone agrees on an **order**.

- **Base coat** = Tailwind's reset (`preflight`).
- **The mural** = Mantine's component styles.
- **Students' small touches** = Tailwind utility classes like `mt-4`.
- **The agreed order** = `@layer theme, base, mantine, components, utilities;`.
- **Using the same paint colours** = sharing brand colours and breakpoints between both.

## 🧑‍💻 Code example

Setup: a Vite React app with Mantine and Tailwind v4 (`npm install @mantine/core @mantine/hooks tailwindcss @tailwindcss/vite`, then add the Tailwind plugin to `vite.config.js`). Put this in `src/index.css` and import it once in `src/main.jsx`.

```css
/* src/index.css */
@layer theme, base, mantine, components, utilities; /* the order: later layers win, so utilities beat Mantine */
@import "tailwindcss/theme.css" layer(theme);       /* Tailwind's design tokens (colours, spacing…) */
@import "tailwindcss/preflight.css" layer(base);    /* Tailwind's reset goes in "base" — below Mantine */
@import "tailwindcss/utilities.css" layer(utilities); /* Tailwind classes like p-4 go in the top layer */
@import "@mantine/core/styles.layer.css";           /* Mantine's styles, already wrapped in @layer mantine */

@theme {                                             /* make Tailwind's breakpoints match Mantine's */
  --breakpoint-xs: 36em;                             /* xs = 36em = 576px */
  --breakpoint-sm: 48em;                             /* sm = 48em = 768px */
  --breakpoint-md: 62em;                             /* md = 62em = 992px */
  --breakpoint-lg: 75em;                             /* lg = 75em = 1200px */
  --breakpoint-xl: 88em;                             /* xl = 88em = 1408px */
}                                                    /* end of @theme */
```

```jsx
// src/App.jsx
import { MantineProvider, Button } from '@mantine/core';            // Mantine provider and Button

export default function App() {                                      // the main component
  return (                                                           // what the page shows
    <MantineProvider>                                                {/* Mantine theme for everything inside */}
      <div className="flex flex-col gap-4 p-6 md:flex-row">          {/* Tailwind layout: column on phones, row from md (992px) */}
        <Button>Save</Button>                                        {/* a normal Mantine button */}
        <Button className="w-full md:w-auto">Export</Button>         {/* Tailwind classes adjust a Mantine button: full width, then auto from 992px */}
      </div>                                                         {/* end of the layout box */}
    </MantineProvider>                                               // end of the provider
  );                                                                 // end of what App returns
}                                                                    // end of App
```

**What happens** (I compiled this CSS with the Tailwind v4 CLI to check it):

```text
Output CSS starts with:  @layer theme, base, mantine, components, utilities;
Mantine rules live in:   @layer mantine { ... }
md:flex-row compiles to: @media (width >= 62em)   ← Mantine's md, not Tailwind's 768px
On screen: a phone shows the two buttons stacked and Export full width.
From 992px wide they sit in a row, and Export shrinks to its normal width.
```

## 🔍 Deeper version

**Why order matters.** Without layers, the winner depends on **selector specificity** and **which file loads last**. That is fragile. With `@layer`, the browser compares layers first. A rule in a later layer wins, even if a rule in an earlier layer is more specific.

**What each layer is for:**

| Layer | Contains | Why there |
|---|---|---|
| `theme` | Tailwind's CSS variables | only variables, no conflicts |
| `base` | Tailwind preflight (reset) | lowest, so it can't undo Mantine's styles |
| `mantine` | Mantine component styles | above the reset |
| `components` | your own component classes | above Mantine |
| `utilities` | Tailwind classes (`p-4`, `md:flex-row`) | top, so one class can tweak a Mantine component |

**Mantine ships two CSS files.** `@mantine/core/styles.css` is normal CSS. `@mantine/core/styles.layer.css` has the same rules inside `@layer mantine`. Use the layer file whenever you mix it with other libraries.

**Breakpoints are the quiet bug.** The defaults differ:

| Name | Mantine | Tailwind default |
|---|---|---|
| xs | 36em (576px) | — |
| sm | 48em (768px) | 640px |
| md | 62em (992px) | 768px |
| lg | 75em (1200px) | 1024px |
| xl | 88em (1408px) | 1280px |

So `md` means 992px in Mantine but 768px in Tailwind. One part of a screen switches layout before the other. Setting Tailwind's `--breakpoint-*` to Mantine's values fixes it. Mantine uses `em`, which is 16px at the default font size.

**One set of colours.** Choose your brand colour once. Put a 10-shade array in Mantine's `createTheme({ colors, primaryColor })`. Add the same shades to Tailwind's `@theme` as `--color-brand-*`. Or point Tailwind at Mantine's CSS variables, like `var(--mantine-color-blue-6)`.

**Dark mode.** Mantine sets `data-mantine-color-scheme="dark"` on `<html>`. You can make Tailwind's `dark:` follow it: `@custom-variant dark (&:where([data-mantine-color-scheme=dark], [data-mantine-color-scheme=dark] *));`.

## 🎯 Why do we use it?

- **Best of both.** Mantine's accessible widgets (modals, selects, date pickers) plus Tailwind's fast layout classes.
- **Predictable styles.** Layers end the "why isn't my class working?" problem.
- **One visual system.** Matching breakpoints and colours make the app feel like one product.

## ⚠️ Common mistakes

- **Importing `@import "tailwindcss";` and `@mantine/core/styles.css` with no layer order.** Then Tailwind's reset or utilities and Mantine's rules fight unpredictably.
- **Using `!important` everywhere** to win fights. Layers solve this properly.
- **Leaving default breakpoints.** `md:` in Tailwind and `md` in Mantine switch at different widths.
- **Two colour palettes.** The Mantine blue and the Tailwind blue look slightly different side by side.

## 🗣️ How to answer in an interview

> "Mantine and Tailwind can work together, but they both add CSS, so I control the order with CSS cascade layers. I declare `@layer theme, base, mantine, components, utilities` once. Tailwind's reset goes into base, Mantine's layered stylesheet goes into the mantine layer, and Tailwind utilities go last. That way the reset can't break Mantine, and a utility class can still adjust a Mantine component.
>
> Then I align the design tokens. Mantine's breakpoints are em-based — md is 62em, about 992px — while Tailwind's md is 768px. I override Tailwind's breakpoints in @theme so both switch at the same width. I also keep the brand colours in one place.
>
> At SkillKeepr we use Mantine. I'd only add Tailwind next to it with this setup."

[FILL IN: whether any project you worked on mixed Mantine (or another library) with Tailwind, and how you handled styling conflicts.]

## 🔁 Follow-up questions

### What is CSS specificity, and why don't layers care about it?

Specificity is a score based on the selector: ids beat classes, classes beat tags. Inside one layer it still decides the winner. But the browser compares **layers first**. A rule in a later layer wins over any rule in an earlier layer.

### Where do un-layered styles go?

Styles not inside any `@layer` beat **all** layered styles. So a stray un-layered CSS file can override everything. Put your own CSS in a layer too, like `components`.

### Mantine also has style props like `p="md"`. When would you still use Tailwind?

For layout around components (flex, grid, gaps, responsive changes) and one-off tweaks. Inside Mantine components, prefer Mantine's own props and theme, so one system controls them.

### Is mixing both a good idea for a new project?

Often you don't need both. Mantine already has layout components (`Group`, `Stack`, `Grid`, `SimpleGrid`) and style props. Mix them only if the team really wants Tailwind's workflow.

## ✅ Quick check

### 1. With `@layer theme, base, mantine, components, utilities;`, which wins: Mantine's button padding or the Tailwind class `p-8` on that button?

:::answer
**`p-8` (Tailwind).** The `utilities` layer comes after `mantine`, and later layers win.
:::

### 2. Tailwind's default `md:` starts at 768px. At what width does Mantine's `md` start?

- A) 768px
- B) 900px
- C) 62em (about 992px)

:::answer
**C.** Mantine's `md` is 62em. At the default 16px font size that is 992px.
:::

### 3. Which Mantine stylesheet do you import when you use CSS layers?

:::answer
**`@mantine/core/styles.layer.css`.** It has the same styles as `styles.css`, wrapped in `@layer mantine`.
:::
