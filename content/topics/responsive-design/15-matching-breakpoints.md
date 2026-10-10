---
title: Matching Mantine and Tailwind breakpoints in one project
stack: responsive-design
order: 15
level: Intermediate
mustKnow: false
askedFrequency: sometimes
summary:
  - "Mantine and Tailwind use the SAME names for DIFFERENT widths: Mantine sm = 768px, Tailwind sm = 640px."
  - "Even worse, Mantine's sm (768px) equals Tailwind's md (768px). Mixing them without care confuses everyone."
  - "Fix: pick ONE set of names and numbers. Usually keep Mantine's, and set Tailwind's @theme to match (add xs, change sm to xl, remove 2xl)."
  - "Also load Mantine's styles.layer.css and declare the CSS layer order, so Tailwind utilities can override Mantine styles."
  - Keep the numbers in one shared place so the two configs never drift apart.
cards:
  - q: What are the default breakpoints of Mantine and Tailwind?
    a: "Mantine: xs 576, sm 768, md 992, lg 1200, xl 1408px. Tailwind: sm 640, md 768, lg 1024, xl 1280, 2xl 1536px."
  - q: Why is the name mismatch dangerous?
    a: "The same word means different widths. A teammate writes md: in Tailwind (768px) and md in Mantine (992px), and the page changes at two different widths."
  - q: How do you make Tailwind v4 use Mantine's breakpoints?
    a: "In @theme: --breakpoint-xs: 36rem; --breakpoint-sm: 48rem; --breakpoint-md: 62rem; --breakpoint-lg: 75rem; --breakpoint-xl: 88rem; --breakpoint-2xl: initial;"
  - q: How do you let Tailwind utilities override Mantine styles?
    a: "Import '@mantine/core/styles.layer.css' (Mantine inside @layer mantine) and declare @layer theme, base, mantine, components, utilities; so utilities come last and win."
  - q: Should you change Mantine or Tailwind?
    a: Usually change Tailwind to Mantine's numbers, because Mantine's components (Grid, SimpleGrid, hiddenFrom) already use them.
---

## 💡 What is it?

Some projects use **Mantine for components** and **Tailwind for small layout styles**.

Both use names like `sm`, `md` and `lg` for [breakpoints](glossary:breakpoint). But the **same name means a different width**:

| Name | Mantine | Tailwind |
|---|---|---|
| xs | 576px | — (none) |
| sm | **768px** | 640px |
| md | 992px | **768px** |
| lg | 1200px | 1024px |
| xl | 1408px | 1280px |
| 2xl | — (none) | 1536px |

Look at 768px: it's Mantine's `sm` but Tailwind's `md`. If you don't match them, one part of the page changes at 768px and another at 992px. You pick **one set** and use it in **both** places.

## 🏠 Real-life example

Think of **two schools that both say "Class 5"**. In one school, Class 5 students are 10 years old. In the other, they are 11.

- If both schools share one sports day and announce "Class 5 come forward", **different-age kids walk up**.
- The fix: both schools agree on **one meaning** of "Class 5".

Mapping:
- **The two schools** = Mantine and Tailwind.
- **"Class 5"** = a breakpoint name like `md`.
- **Different ages** = different widths (Mantine md = 992px, Tailwind md = 768px).
- **Agreeing on one meaning** = setting Tailwind's `@theme` to Mantine's numbers.

## 🧑‍💻 Code example

This makes **Tailwind use Mantine's names and numbers**. Set up a Vite React app with both:

```bash
npm install @mantine/core @mantine/hooks tailwindcss @tailwindcss/vite   # Mantine + Tailwind v4
```

Add `tailwindcss()` to the `plugins` list in `vite.config.js`.

**`src/index.css`**, Tailwind with Mantine's breakpoints:

```css
@layer theme, base, mantine, components, utilities; /* layer order: later layers win, so Tailwind utilities beat Mantine */
@import "tailwindcss"; /* load Tailwind v4 */
@theme { /* change Tailwind's design values */
  --breakpoint-xs: 36rem; /* 36 × 16 = 576px, same as Mantine xs */
  --breakpoint-sm: 48rem; /* 48 × 16 = 768px, same as Mantine sm */
  --breakpoint-md: 62rem; /* 62 × 16 = 992px, same as Mantine md */
  --breakpoint-lg: 75rem; /* 75 × 16 = 1200px, same as Mantine lg */
  --breakpoint-xl: 88rem; /* 88 × 16 = 1408px, same as Mantine xl */
  --breakpoint-2xl: initial; /* remove 2xl: Mantine has no 2xl, so nobody should use it */
} /* end of @theme — keep these in sync with Mantine's theme */
```

**`src/App.jsx`**, Mantine in its own CSS layer:

```jsx
import '@mantine/core/styles.layer.css'; // Mantine's CSS, wrapped in @layer mantine
import './index.css'; // Tailwind + our layer order + matching breakpoints
import { MantineProvider, Paper } from '@mantine/core'; // provider and a card component

export default function App() { // our main component
  return ( // what we draw
    <MantineProvider> {/* default Mantine theme: xs 36em, sm 48em, md 62em, lg 75em, xl 88em */}
      <div className="p-4 md:p-8"> {/* Tailwind: 16px padding, 32px from md (now 992px, same as Mantine md) */}
        <Paper withBorder p={{ base: 'xs', md: 'xl' }}> {/* Mantine: 10px padding, 32px from md (992px) */}
          Both libraries switch at exactly 992px {/* the label we see */}
        </Paper> {/* end of the Mantine card */}
      </div> {/* end of the Tailwind wrapper */}
    </MantineProvider> // end of the provider
  ); // end of what App returns
} // end of App
```

**What you see:**

```text
375px  → wrapper 16px padding (Tailwind), card 10px padding (Mantine)
800px  → still 16px and 10px — nothing changes at 768px any more for md
992px  → wrapper 32px AND card 32px at the SAME moment
1280px → same as 992px
```

Before the change, at 800px the wrapper had 32px padding (Tailwind's old md at 768px) while the card still had 10px (Mantine's md at 992px). That's the mismatch.

## 🔍 Deeper version

**Which direction to choose?**

| Option | When it fits | Watch out |
|---|---|---|
| Change Tailwind to Mantine's numbers | Mantine owns most components, Grid and `hiddenFrom` | Tailwind docs and copied snippets assume md = 768px |
| Change Mantine to Tailwind's numbers | Tailwind owns most of the layout | Mantine has no `2xl`, and its names would then mean Tailwind widths; `createTheme({ breakpoints: { xs: '30em', sm: '40em', md: '48em', lg: '64em', xl: '80em' } })` |

Either way, **write it down** in the README. New teammates expect the library defaults.

**rem vs em.** Tailwind v4 writes breakpoints in `rem`. Mantine writes them in `em`. In media queries, both are based on the browser's default font size (usually 16px), so `48rem` and `48em` both mean 768px.

**Why the CSS layer order matters.** Tailwind v4 puts its CSS into layers named `theme`, `base`, `components` and `utilities`. Mantine's `styles.layer.css` puts all Mantine CSS into a layer named `mantine`. Declaring `@layer theme, base, mantine, components, utilities;` first means:
- Tailwind's reset (`base`) loads **before** Mantine, so it doesn't break Mantine components.
- Tailwind's `utilities` load **after** Mantine, so `className="p-8"` can override a Mantine style.

Without this, a Tailwind class on a Mantine component may silently lose.

**Other things to align:**
- **Spacing:** Mantine uses named sizes (xs 10px, sm 12px, md 16px, lg 20px, xl 32px). Tailwind uses a 4px unit (`p-4` = 16px). So Mantine `p="md"` equals Tailwind `p-4`.
- **Colours:** put brand colours in both Mantine's `createTheme({ colors })` and Tailwind's `@theme` (`--color-brand-500`).
- **Dark mode:** Mantine sets `data-mantine-color-scheme` on `<html>`. Point Tailwind's `dark:` variant at it with `@custom-variant dark (&:where([data-mantine-color-scheme=dark], [data-mantine-color-scheme=dark] *));`.

## 🎯 Why do we use it?

Users don't care which library drew which part. They see **one page**.

If the header switches at 768px and the cards at 992px, the page looks broken between those widths. Matching breakpoints makes the whole page change **at the same moment**. It also lets the team say "md" and mean one thing.

## ⚠️ Common mistakes

- **Assuming `sm` or `md` means the same width** in both libraries. They don't.
- **Changing only one config** and forgetting the other.
- **Importing `@mantine/core/styles.css`** (not the layer version) together with Tailwind, so the CSS order decides who wins by accident.
- **Leaving Tailwind's `2xl:`** when Mantine has no matching breakpoint.

## 🗣️ How to answer in an interview

> "Mantine and Tailwind are both mobile-first, but their breakpoint names don't mean the same widths. Mantine's sm is 768 pixels, which is Tailwind's md, and Mantine's md is 992. If a project mixes them, parts of the page switch at different widths. So I pick one set, usually Mantine's because its Grid and hiddenFrom use it, and set Tailwind's `--breakpoint-*` variables in `@theme` to the same values, removing 2xl. I also import Mantine's layered stylesheet and declare the layer order, so Tailwind utilities come after Mantine and can override it. Then I align spacing and colours, and document the choice in the README."

[FILL IN: only if a project of yours mixed Mantine (or another component library) with Tailwind — say which one owned the breakpoints.]

## 🔁 Follow-up questions

### Why not put breakpoints in CSS variables and use them in media queries?

Media queries don't support `var()`. The numbers must be real values, so you write them in Tailwind's `@theme` and in Mantine's theme.

### What if a utility class doesn't override a Mantine style?

Check the CSS layer order. Load `@mantine/core/styles.layer.css` and declare `@layer theme, base, mantine, components, utilities;` before importing Tailwind.

### Is it a good idea to mix two styling systems?

It works, but it adds weight and two ways to do the same thing. Many teams use the component library (Mantine) for components and Tailwind only for page layout and small tweaks, with clear rules in the README.

## ✅ Quick check

### 1. With no changes, at 800px: is Tailwind's `md:` active? Is Mantine's `md` active?

:::answer
**Tailwind: yes** (768px and up). **Mantine: no** (992px and up). That's the mismatch.
:::

### 2. What Tailwind v4 value makes `md:` start at 992px?

:::answer
**`--breakpoint-md: 62rem;`** because 62 × 16 = 992.
:::

### 3. Which file lets Tailwind utilities override Mantine?

- A) `@mantine/core/styles.css`
- B) `@mantine/core/styles.layer.css` plus a declared layer order
- C) `vite.config.js`

:::answer
**B.** The layered stylesheet puts Mantine in `@layer mantine`, and the declared order puts `utilities` after it.
:::
