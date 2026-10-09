---
title: Matching Tailwind and MUI breakpoints in one project
stack: responsive-design
order: 15
level: Intermediate
mustKnow: false
askedFrequency: sometimes
summary:
  - "Tailwind and MUI use different numbers: Tailwind md = 768px, MUI md = 900px."
  - If a page uses both, parts of it switch layout at different widths. That looks broken.
  - "Fix: pick ONE set of numbers and set it in both places — Tailwind's @theme and MUI's createTheme."
  - "Tailwind v4: --breakpoint-md: 56.25rem; (= 900px). MUI: breakpoints.values.md: 900."
  - Keep the numbers in one shared file so they never drift apart.
cards:
  - q: Why do Tailwind and MUI breakpoints need matching?
    a: "Their defaults differ (Tailwind md = 768px, MUI md = 900px). Without matching, one part of the page changes layout at 768px and another at 900px."
  - q: How do you change Tailwind v4 breakpoints?
    a: "In CSS, inside @theme: --breakpoint-md: 56.25rem; (56.25 × 16 = 900px)."
  - q: How do you change MUI breakpoints?
    a: "createTheme({ breakpoints: { values: { xs: 0, sm: 600, md: 900, lg: 1200, xl: 1536 } } })."
  - q: Which set should you pick?
    a: Usually the library that owns most of the layout. Many MUI-heavy apps change Tailwind to MUI's numbers, because MUI's Grid and components already use them.
  - q: How do you stop the two configs drifting apart later?
    a: Keep the numbers in one place (a shared constants file, or CSS variables) and add a comment in both configs pointing to it.
---

## 💡 What is it?

Some projects use **MUI for components** and **Tailwind for layout and small styles**.

But their [breakpoints](glossary:breakpoint) are **different numbers**:

| Name | Tailwind | MUI |
|---|---|---|
| sm | 640px | 600px |
| md | 768px | 900px |
| lg | 1024px | 1200px |
| xl | 1280px | 1536px |

If you don't match them, one part of the page changes at 768px and another at 900px. You pick **one set** and use it in **both** configs.

## 🏠 Real-life example

Think of **two school bells** that are 5 minutes apart.

- The **first bell** (Tailwind) rings at 10:00. Half the students go to break.
- The **second bell** (MUI) rings at 10:05. The other half go then.
- For 5 minutes, the corridors are a mess.

The fix is simple: **set both bells to the same time**.

Mapping:
- **The two bells** = Tailwind's and MUI's breakpoints.
- **The 5-minute mess** = widths between 768px and 900px, where the page looks half-changed.
- **Setting both clocks the same** = putting the same numbers in `@theme` and `createTheme`.

## 🧑‍💻 Code example

This makes **Tailwind use MUI's numbers**. Set up a Vite React app with both libraries (`npm install @mui/material @emotion/react @emotion/styled tailwindcss @tailwindcss/vite`, and add `tailwindcss()` to `vite.config.js`).

**`src/breakpoints.js`**, the single source of truth:

```js
export const BP = { xs: 0, sm: 600, md: 900, lg: 1200, xl: 1536 }; // our ONE set of numbers, in pixels (MUI's defaults)
```

**`src/index.css`**, Tailwind with the same numbers:

```css
@import "tailwindcss"; /* load Tailwind v4 */
@theme { /* change Tailwind's design values */
  --breakpoint-sm: 37.5rem; /* 37.5 × 16 = 600px, same as BP.sm */
  --breakpoint-md: 56.25rem; /* 56.25 × 16 = 900px, same as BP.md */
  --breakpoint-lg: 75rem; /* 75 × 16 = 1200px, same as BP.lg */
  --breakpoint-xl: 96rem; /* 96 × 16 = 1536px, same as BP.xl */
  --breakpoint-2xl: initial; /* remove 2xl: so nobody uses a breakpoint MUI doesn't have */
} /* end of @theme — keep these in sync with src/breakpoints.js */
```

**`src/App.jsx`**, MUI with the same numbers:

```jsx
import { createTheme, ThemeProvider } from '@mui/material/styles'; // tools to make and provide a theme
import Box from '@mui/material/Box'; // a div with the sx prop
import { BP } from './breakpoints'; // our shared numbers

const theme = createTheme({ breakpoints: { values: BP } }); // MUI now uses 0/600/900/1200/1536 (same as its defaults, but explicit)

export default function App() { // our main component
  return ( // what we draw
    <ThemeProvider theme={theme}> {/* give the theme to every MUI component */}
      <div className="p-4 md:p-8"> {/* Tailwind: 16px padding, 32px from md (now 900px) */}
        <Box sx={{ bgcolor: { xs: 'tomato', md: 'seagreen' }, color: 'white', p: 2 }}> {/* MUI: red below 900px, green from 900px; 16px padding */}
          Both libraries switch at exactly 900px {/* the label we see */}
        </Box> {/* end of the MUI box */}
      </div> {/* end of the Tailwind wrapper */}
    </ThemeProvider> // end of the theme provider
  ); // end of what App returns
} // end of App
```

**What you see:**

```text
375px  → 16px padding (Tailwind), red box (MUI)
768px  → still 16px padding AND still red — nothing changes at 768px any more
900px  → 32px padding AND green box at the SAME moment
1280px → same as 900px
```

Before the change, at 800px you would see 32px padding (Tailwind's md at 768px) with a **red** box (MUI's md at 900px). That's the mismatch.

## 🔍 Deeper version

**Which direction to choose?**

| Option | When it fits | Watch out |
|---|---|---|
| Change Tailwind to MUI's numbers | MUI owns most components and Grid | Tailwind docs and examples assume 768px for md |
| Change MUI to Tailwind's numbers | Tailwind owns most of the layout | MUI docs assume 900px; `createTheme({ breakpoints: { values: { xs: 0, sm: 640, md: 768, lg: 1024, xl: 1280 } } })` |

Either way, **write it down** in the README, because new teammates will expect the library defaults.

**rem vs px.** Tailwind v4 breakpoints are in `rem` (1rem = 16px by default). MUI's are pixel numbers. `56.25rem = 900px` only while the root font size is 16px, which it almost always is for media queries.

**Using MUI breakpoints in plain CSS.** MUI v7 can expose its theme as CSS variables (`cssVariables: true`), but **media queries can't use CSS variables**. That's why the numbers must be written in Tailwind's `@theme` directly.

**Other things to align** when mixing the two:
- **Spacing:** MUI 1 unit = 8px; Tailwind 1 unit = 4px. So MUI `p: 2` = Tailwind `p-4` = 16px.
- **Colours:** put brand colours in both `createTheme` palette and Tailwind `@theme` (`--color-brand-500`).
- **CSS order:** use `StyledEngineProvider enableCssLayer` and an `@layer` order so Tailwind utilities can override MUI styles. See [MUI and Tailwind together](topic:mui-tailwind/mui-and-tailwind-together).

## 🎯 Why do we use it?

Users don't care which library drew which part. They see **one page**.

If the header switches at 768px and the cards at 900px, the page looks broken between those widths. Matching breakpoints makes the whole page change **at the same moment**, and lets the team talk about "md" without confusion.

## ⚠️ Common mistakes

- **Assuming `md` means the same width** in both libraries.
- **Changing only one config** and forgetting the other.
- **Typing the numbers in two places** with no shared source. They drift apart after a few months.
- **Leaving extra breakpoints** (like Tailwind's `2xl:`) that the other library doesn't have.

## 🗣️ How to answer in an interview

> "Tailwind and MUI both work mobile-first, but their breakpoint numbers differ. Tailwind's md is 768 and MUI's is 900, and sm, lg and xl differ too. If a project uses both, parts of the page switch layout at different widths, which looks broken. So I pick one set, usually the library that owns most of the layout, and configure both: in Tailwind v4 that's `--breakpoint-*` variables in `@theme`, and in MUI it's `breakpoints.values` in `createTheme`. I keep the numbers in one shared file and comment both configs. I also align spacing, since MUI's unit is 8px and Tailwind's is 4px, and set up CSS layers so Tailwind utilities can override MUI styles."

[FILL IN: only if a project of yours used both libraries — say which one owned the breakpoints.]

## 🔁 Follow-up questions

### Why not use CSS variables for breakpoints in media queries?

Media queries don't support `var()`. The numbers must be real values, so you write them in Tailwind's `@theme` and in MUI's theme.

### What else should be aligned when mixing MUI and Tailwind?

Spacing units (8px vs 4px), brand colours, fonts, and CSS order (layers), so one library doesn't accidentally override the other.

### Does changing MUI's breakpoints affect Grid?

Yes. Grid `size={{ md: 6 }}` and every `sx` object use the theme's values, so they all move together.

### Is mixing two styling libraries a good idea?

It works, but it adds weight and two ways of doing things. Many teams pick one for components (MUI) and use the other only for layout utilities, with clear rules.

## ✅ Quick check

### 1. Without any changes, at 800px, is Tailwind's `md:` active? Is MUI's `md` active?

:::answer
**Tailwind: yes** (768px and up). **MUI: no** (900px and up). That's exactly the mismatch.
:::

### 2. What rem value gives a 900px breakpoint in Tailwind v4?

:::answer
**56.25rem.** 900 ÷ 16 = 56.25.
:::

### 3. Where do you change MUI's breakpoints?

- A) In `index.css`
- B) In `createTheme({ breakpoints: { values: {...} } })`
- C) In `vite.config.js`

:::answer
**B.** MUI reads breakpoints from its theme.
:::
