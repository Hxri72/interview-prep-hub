---
title: Responsive design with Mantine (breakpoints, responsive props, useMediaQuery)
stack: responsive-design
order: 14
level: Intermediate
mustKnow: true
askedFrequency: common
summary:
  - "Mantine's default breakpoints are xs 36em, sm 48em, md 62em, lg 75em, xl 88em. At a 16px root that is 576, 768, 992, 1200 and 1408px."
  - "Mantine is mobile-first. A responsive prop like p={{ base: 'xs', sm: 'md' }} means: small padding on phones, medium from sm (768px) and up."
  - "Layout helpers take the same object: Grid.Col span={{ base: 12, sm: 6 }} and SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }}."
  - "hiddenFrom='sm' hides a component from 768px up. visibleFrom='sm' shows it only from 768px up."
  - useMediaQuery gives you a true/false in JavaScript, when you need to render a different component, not just restyle one.
cards:
  - q: What are Mantine's default breakpoints in pixels?
    a: "xs 576px, sm 768px, md 992px, lg 1200px, xl 1408px (36, 48, 62, 75 and 88em at a 16px root)."
  - q: "What does p={{ base: 'xs', sm: 'md' }} mean?"
    a: "Padding xs (10px) on all screens, then padding md (16px) from the sm breakpoint (768px) and wider."
  - q: How do you make a 1 → 2 → 3 column card list in Mantine?
    a: "SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }}, or Grid with Grid.Col span={{ base: 12, sm: 6, lg: 4 }}."
  - q: What is the difference between hiddenFrom and visibleFrom?
    a: "hiddenFrom='md' hides the element from md (992px) and up. visibleFrom='md' shows it only from md and up."
  - q: When do you use useMediaQuery instead of responsive props?
    a: When the screen size should change WHICH component renders (for example cards on mobile, a table on desktop), not just its spacing or columns.
---

## 💡 What is it?

[Mantine](topic:mantine-tailwind/mantine-setup) is a React component library. It works **mobile-first**: you write the phone style first, then add rules for bigger screens.

It has 5 named [breakpoints](glossary:breakpoint): **xs, sm, md, lg, xl**. Many props accept an object like `{ base: …, sm: …, lg: … }`. `base` means "all screens". `sm` means "from the sm width and wider".

For logic in JavaScript, the `useMediaQuery` hook tells you `true` or `false` for a screen size.

## 🏠 Real-life example

Think of **shoe sizes in a school shop**.

- The shop has fixed size labels: **xs, sm, md, lg, xl**. Each label means a real number.
- A rule like "**base**: sandals, **from sm**: shoes" means small kids get sandals, and everyone size sm or bigger gets shoes.
- The shopkeeper can also **ask a question**: "Is this kid size md or bigger?" That's `useMediaQuery`. The answer decides which item to bring, not just its colour.

Mapping:
- **Size labels** = Mantine breakpoints (xs → xl).
- **The real number behind a label** = the em/px value (sm = 48em = 768px).
- **"base: sandals, from sm: shoes"** = a responsive prop object.
- **Asking "is this kid md or bigger?"** = `useMediaQuery`.

## 🧑‍💻 Code example

Create a Vite React app, then install Mantine:

```bash
npm create vite@latest mantine-demo -- --template react   # make a new React app
cd mantine-demo                                           # go into it
npm install @mantine/core @mantine/hooks                  # Mantine components and hooks
```

Paste this into **`src/App.jsx`**, run `npm run dev`, and resize the window.

```jsx
import '@mantine/core/styles.css'; // Mantine's base CSS — required, or components look unstyled
import { MantineProvider, Box, SimpleGrid, Grid, Paper, Text, useMantineTheme } from '@mantine/core'; // components we use
import { useMediaQuery } from '@mantine/hooks'; // hook that answers "does this media query match?"

function Demo() { // a child component, so it can read the theme from MantineProvider
  const theme = useMantineTheme(); // the theme object, including theme.breakpoints
  const isDesktop = useMediaQuery(`(min-width: ${theme.breakpoints.md})`); // true from md (62em = 992px) and wider

  return ( // what Demo draws
    <Box p={{ base: 'xs', sm: 'md', lg: 'xl' }}> {/* padding: xs = 10px on phones, md = 16px from 768px, xl = 32px from 1200px */}
      <Text fw={700} hiddenFrom="sm">📱 Phone layout</Text> {/* shown below 768px, hidden from sm (768px) up */}
      <Text fw={700} visibleFrom="sm">💻 Tablet/desktop layout</Text> {/* hidden below 768px, shown from sm (768px) up */}

      <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md" mt="md"> {/* 1 column on phones, 2 from 768px, 3 from 1200px; 16px gaps; 16px top margin */}
        <Paper withBorder p="md">Card 1</Paper> {/* a bordered card with 16px padding */}
        <Paper withBorder p="md">Card 2</Paper> {/* second card */}
        <Paper withBorder p="md">Card 3</Paper> {/* third card */}
      </SimpleGrid> {/* end of the card grid */}

      <Grid mt="md"> {/* a 12-column grid, 16px top margin */}
        <Grid.Col span={{ base: 12, md: 8 }}><Paper withBorder p="md">Main</Paper></Grid.Col> {/* full width (12/12) on small screens, 8/12 from 992px */}
        <Grid.Col span={{ base: 12, md: 4 }}><Paper withBorder p="md">Sidebar</Paper></Grid.Col> {/* full width on small screens, 4/12 from 992px */}
      </Grid> {/* end of the 12-column grid */}

      <Text mt="md">{isDesktop ? 'Rendering the TABLE view' : 'Rendering the CARD view'}</Text> {/* different content chosen in JavaScript */}
    </Box> // end of the padded wrapper
  ); // end of what Demo returns
} // end of Demo

export default function App() { // the main component
  return ( // what App draws
    <MantineProvider> {/* gives every Mantine component the default theme */}
      <Demo /> {/* our responsive demo */}
    </MantineProvider> // end of the provider
  ); // end of what App returns
} // end of App
```

**What you see:**

```text
375px  → "📱 Phone layout", 10px padding, cards in 1 column, Main and Sidebar stacked, "CARD view"
768px  → "💻 Tablet/desktop layout", 16px padding, cards in 2 columns, Main and Sidebar still stacked, "CARD view"
1280px → "💻 Tablet/desktop layout", 32px padding, cards in 3 columns, Main (8/12) beside Sidebar (4/12), "TABLE view"
```

At 1280px, Main sits beside Sidebar because 1280px is above **md (992px)**. The cards have 3 columns because 1280px is above **lg (1200px)**.

## 🔍 Deeper version

**Default breakpoints (Mantine 7+):**

| Name | em | px at 16px root | Roughly |
|---|---|---|---|
| (base) | 0 | 0 | every screen |
| xs | 36em | 576px | big phones (landscape) |
| sm | 48em | 768px | tablets |
| md | 62em | 992px | small laptops |
| lg | 75em | 1200px | laptops |
| xl | 88em | 1408px | big monitors |

Mantine writes breakpoints in **em**, not px. In media queries, `em` is based on the browser's default font size (usually 16px). So 48em = 48 × 16 = 768px. If a user raises the browser's default font size, the breakpoints grow too, which helps people who zoom text.

**The spacing scale** used in props like `p`, `m`, `gap` and `spacing`:

| Key | Value at default scale |
|---|---|
| xs | 10px |
| sm | 12px |
| md | 16px |
| lg | 20px |
| xl | 32px |

**Four ways to be responsive in Mantine:**

| Tool | Use it for | Example |
|---|---|---|
| Responsive style props | spacing, sizes, colours | `p={{ base: 'xs', md: 'xl' }}` |
| Component responsive props | columns, spans, gaps | `SimpleGrid cols={{ base: 1, sm: 2 }}`, `Grid.Col span={{ base: 12, md: 6 }}` |
| `hiddenFrom` / `visibleFrom` | show or hide a whole element with CSS | `<Burger hiddenFrom="sm" />` |
| `useMediaQuery` | render a different component in JS | table on desktop, cards on mobile |

**CSS modules (the recommended way for big lists).** Responsive style props add a small `<style>` block for each component that uses them. For hundreds of items, a CSS module is faster. With `postcss-preset-mantine` installed, you can use Mantine's breakpoints in CSS:

```css
.card { /* a CSS module class */
  padding: 10px; /* phone padding */
  @mixin larger-than $mantine-breakpoint-sm { /* from sm (768px) and wider */
    padding: 16px; /* tablet and desktop padding */
  } /* end of the sm rule */
} /* end of .card */
```

**Changing the breakpoints.** Pass new values to `createTheme`. Values you leave out keep their defaults:

```jsx
import { createTheme } from '@mantine/core'; // helper to build a theme override
const theme = createTheme({ breakpoints: { sm: '40em' } }); // sm becomes 40em = 640px; xs, md, lg, xl stay the same
```

**`useMediaQuery` and first render.** On the very first render, the hook may return its initial value (`false`) before it reads the real screen. In client-only apps (like a Vite SPA) this flicker is usually invisible. With server rendering, prefer `hiddenFrom`/`visibleFrom` or CSS, so the HTML is right from the start.

:::version[Version note]
Mantine 7 replaced Emotion with plain CSS (CSS modules and CSS variables). Since Mantine 7, breakpoints are **em strings** like `'48em'`. Very old versions (v5 and earlier) used pixel numbers. Mantine 9 is the current major version. The breakpoint values are the same in 7, 8 and 9.
:::

## 🎯 Why do we use it?

Most users of a recruiter or candidate portal switch between a laptop and a phone. One codebase must look right on both.

Mantine's breakpoint props let you describe the whole responsive layout **inline**, right where the component is, without writing media queries by hand. The breakpoint names are shared by every component, so the whole app changes layout at the same widths.

[FILL IN: one screen you built with Mantine that changes layout on mobile, if you have one.]

## ⚠️ Common mistakes

- **Thinking Mantine's `sm` equals Tailwind's `sm`.** Mantine `sm` = 768px; Tailwind `sm` = 640px. Mantine's `sm` is actually Tailwind's `md`. See [matching breakpoints](topic:responsive-design/matching-breakpoints).
- **Forgetting `base`.** `p={{ sm: 'md' }}` sets nothing below 768px. Always say what phones get.
- **Using `useMediaQuery` just to change spacing.** That causes extra re-renders. Use responsive props or CSS instead.
- **Forgetting `import '@mantine/core/styles.css'`.** Without it, components and `hiddenFrom` don't work properly.

## 🗣️ How to answer in an interview

> "Mantine is mobile-first, with five breakpoints: xs, sm, md, lg and xl. They're 36, 48, 62, 75 and 88em, which is 576, 768, 992, 1200 and 1408 pixels at a 16px root. Most props accept a responsive object, so `p={{ base: 'xs', sm: 'md' }}` means small padding on phones and medium padding from 768 up. For layout I use `SimpleGrid` with `cols={{ base: 1, sm: 2, lg: 3 }}`, or `Grid.Col span` on a 12-column grid. To show or hide parts, I use `hiddenFrom` and `visibleFrom`, which work with pure CSS. I only use `useMediaQuery` when the screen size decides which component renders, like cards on mobile and a table on desktop. For long lists I move responsive styles into CSS modules with the Mantine PostCSS preset, because responsive style props add styles per component."

## 🔁 Follow-up questions

### Why does Mantine use em instead of px for breakpoints?

Media queries in `em` scale with the browser's default font size. If a user sets a bigger default font, the layout switches earlier, so text doesn't get squeezed. At the normal 16px default, the result is the same as px.

### How do you change Mantine's breakpoints?

`createTheme({ breakpoints: { sm: '40em' } })` and pass the theme to `MantineProvider`. Any breakpoint you don't list keeps its default value.

### What is the difference between `hiddenFrom` and `useMediaQuery`?

`hiddenFrom` uses CSS, so the element is still rendered but hidden, and there is no flicker. `useMediaQuery` runs in JavaScript and can skip rendering a component entirely, but it can flicker on the first render with server rendering.

### SimpleGrid or Grid?

`SimpleGrid` is for equal-width items, like a card list. `Grid` is a 12-column grid for different widths, like 8 + 4 for main content and a sidebar.

## ✅ Quick check

### 1. The screen is 900px wide. Which value does `p={{ base: 'xs', sm: 'md', lg: 'xl' }}` use?

:::answer
**md (16px).** 900px is above sm (768px) but below lg (1200px).
:::

### 2. What does `<Burger hiddenFrom="md" />` do on a 1280px laptop?

- A) Shows the burger
- B) Hides the burger
- C) Shows it only after a click

:::answer
**B.** `hiddenFrom="md"` hides it from 992px and wider. 1280px is wider than 992px.
:::

### 3. You want 1 column on phones, 2 from 768px and 4 from 1200px. Which `SimpleGrid` props?

:::answer
`cols={{ base: 1, sm: 2, lg: 4 }}`. sm = 768px and lg = 1200px.
:::
