---
title: Using MUI and Tailwind together without conflicts
stack: mui-tailwind
order: 14
level: Intermediate
mustKnow: true
askedFrequency: common
summary:
  - "MUI gives ready-made components; Tailwind gives small layout and spacing classes. Many teams use both."
  - "The main problem is which style wins. Put MUI's styles in a CSS layer (enableCssLayer) placed before Tailwind's utilities layer."
  - "The second problem is breakpoints: MUI md = 900px, Tailwind md = 768px. Make them the same in one of the two configs."
  - "Share one set of brand colours and spacing, so both systems look like one design."
  - "A simple team rule helps: MUI for components, Tailwind for layout and small tweaks."
cards:
  - q: Why do MUI and Tailwind styles conflict?
    a: Both add CSS to the page. When two rules set the same property with the same strength, the rule that comes later in the CSS wins, and that order is hard to predict.
  - q: How do you make Tailwind classes win over MUI styles in MUI v7?
    a: "Wrap the app in <StyledEngineProvider enableCssLayer> and declare the layer order @layer theme, base, mui, components, utilities; so utilities come after MUI."
  - q: What are the md breakpoints in MUI and Tailwind?
    a: "MUI md = 900px and up. Tailwind md = 768px and up. They must be matched, or layouts switch at different widths."
  - q: How do you keep the colours the same in both?
    a: Define brand colours once (for example as CSS variables in Tailwind's @theme) and use the same values in MUI's createTheme.
  - q: What is a sensible rule for which library to use?
    a: MUI for complex components (dialogs, tables, date pickers); Tailwind for layout, spacing and small visual tweaks.
---

## 💡 What is it?

**MUI** (Material UI) gives you ready-made React components: buttons, dialogs, tables, date pickers. **Tailwind** gives you small classes for layout and spacing.

Many teams use **both**. MUI handles complex components. Tailwind handles layout and small tweaks.

Using both can cause **conflicts**: a Tailwind class doesn't apply, or screens switch layout at the wrong width. This topic shows how to stop that.

## 🏠 Real-life example

Think of a **school with two sports coaches**: a cricket coach and a football coach. They share **one playground**.

If nobody plans, both teams want the ground at the same time. They argue about who goes first. They even mark the pitch with different lines.

- **The two coaches** = MUI and Tailwind.
- **The shared playground** = the page's CSS.
- **A fixed timetable** ("football first, then cricket") = CSS layer order. It decides who wins.
- **Agreeing on one set of pitch markings** = matching breakpoints (both say "medium screen = 900px").
- **Same school colours on both jerseys** = one shared brand theme.

## 🧑‍💻 Code example

Setup: a Vite React app. Run `npm install @mui/material @emotion/react @emotion/styled tailwindcss @tailwindcss/vite`, and add the Tailwind Vite plugin to `vite.config.js`.

`src/index.css`:

```css
@layer theme, base, mui, components, utilities;       /* layer order: later layers win → Tailwind utilities beat MUI */
@import "tailwindcss";                                 /* load Tailwind (it fills theme, base, components, utilities) */

@theme {                                               /* make Tailwind's breakpoints match MUI's defaults */
  --breakpoint-sm: 600px;                              /* sm: = 600px and up (MUI sm) */
  --breakpoint-md: 900px;                              /* md: = 900px and up (MUI md) */
  --breakpoint-lg: 1200px;                             /* lg: = 1200px and up (MUI lg) */
  --breakpoint-xl: 1536px;                             /* xl: = 1536px and up (MUI xl) */
  --color-brand-600: #2554d9;                          /* one brand blue, shared with MUI below */
}                                                      /* end of @theme */
```

`src/main.jsx`:

```jsx
import { createRoot } from 'react-dom/client';                       // React's way to start the app
import { StyledEngineProvider, ThemeProvider, createTheme } from '@mui/material/styles'; // MUI style tools
import Button from '@mui/material/Button';                           // one MUI component
import './index.css';                                                // our Tailwind CSS from above

const theme = createTheme({                                          // MUI theme
  palette: { primary: { main: '#2554d9' } },                         // same brand blue as --color-brand-600
});                                                                  // end of theme

function App() {                                                     // the main component
  return (                                                           // what the page shows
    <div className="flex flex-col gap-4 p-6 md:flex-row">            {/* Tailwind layout: column on phones, row from 900px (because md is now 900px) */}
      <Button variant="contained">MUI default</Button>               {/* plain MUI button */}
      <Button variant="contained" className="rounded-full px-8">     {/* Tailwind classes on an MUI button: fully round, 32px side padding */}
        MUI + Tailwind tweak                                         {/* the label */}
      </Button>                                                      {/* end of the tweaked button */}
    </div>                                                           // end of the layout
  );                                                                 // end of what App returns
}                                                                    // end of App

createRoot(document.getElementById('root')).render(                  // mount the app into <div id="root">
  <StyledEngineProvider enableCssLayer>                              {/* put MUI's styles inside the CSS layer "mui" */}
    <ThemeProvider theme={theme}>                                    {/* give every MUI component our theme */}
      <App />                                                        {/* the app */}
    </ThemeProvider>                                                 {/* end of ThemeProvider */}
  </StyledEngineProvider>,                                           // end of StyledEngineProvider
);                                                                   // end of render
```

**What you see:**

```text
Two blue buttons in the brand colour.
The second one is fully rounded with wider padding — the Tailwind classes won over MUI's own styles.
Below 900px the buttons are stacked; from 900px they sit in a row.
```

## 🔍 Deeper version

**Problem 1: who wins?** MUI uses **Emotion**, a CSS-in-JS library. It adds `<style>` tags while the app runs. Tailwind's CSS is a normal stylesheet. When an MUI rule and a Tailwind class set the same property with the same specificity, **the later rule wins**. That order depends on when the styles were injected, so it feels random.

**Fix with CSS cascade layers.** A cascade layer (`@layer`) is a named group of CSS. Layer order beats normal rule order: rules in a later layer win, even if they appear earlier in the file.
- `StyledEngineProvider enableCssLayer` puts all MUI styles into a layer called `mui`.
- `@layer theme, base, mui, components, utilities;` places `mui` **before** Tailwind's `utilities`.
- Result: a Tailwind class like `rounded-full` reliably beats MUI's default border radius.

**Older fixes** you may see in existing code:
- `StyledEngineProvider injectFirst` puts MUI's styles at the **top** of `<head>`, so later stylesheets (Tailwind) win.
- Tailwind's `important` option, which adds `!important` to utilities. It works, but it is heavy-handed.

**Problem 2: breakpoints.** They don't match by default:

| Name | MUI starts at | Tailwind starts at |
|---|---|---|
| `sm` | 600px | 640px |
| `md` | 900px | 768px |
| `lg` | 1200px | 1024px |
| `xl` | 1536px | 1280px |

If you mix `sx={{ display: { md: 'none' } }}` with `md:block`, they switch at different widths. Between 768px and 899px, the page looks broken. Fix it by changing **one** side, either Tailwind's `--breakpoint-*` (as above) or MUI's `createTheme({ breakpoints: { values: {...} } })`.

**Problem 3: base styles.** Tailwind's **Preflight** (its CSS reset) and MUI's `CssBaseline` both reset browser styles. Usually keep one. With the layer order above, Preflight sits in `base`, before `mui`, so MUI components keep their look.

**Problem 4: two design systems.** MUI's spacing unit is 8px (`p: 2` = 16px). Tailwind's step is 4px (`p-4` = 16px). Both reach 16px but count differently. Agree on shared tokens (colours, radius, spacing), and write a team rule for which library does what.

:::version[Version note]
`enableCssLayer` on `StyledEngineProvider` is the recommended approach for **MUI v7** with **Tailwind v4**. Older MUI v5 projects usually used `injectFirst`. Tailwind v3 projects often set `important: '#root'` in `tailwind.config.js` instead.
:::

## 🎯 Why do we use it?

- **Best of both.** MUI saves weeks on complex, accessible components like data tables, dialogs and date pickers. Tailwind is fast for layout and small tweaks.
- **Predictable styling.** Layer order means "Tailwind class on top" always works.
- **One look.** Shared colours and breakpoints make two libraries feel like one product.

## ⚠️ Common mistakes

- **Not fixing the cascade**, then adding `!important` everywhere to force Tailwind classes to apply.
- **Leaving breakpoints unmatched**, so MUI and Tailwind switch layouts at different widths.
- **Two sets of brand colours**: the MUI theme says one blue and Tailwind uses another.
- **Mixing styling methods randomly in one component**: `sx`, `className` and `styled()` all at once. Pick one main method per component.

## 🗣️ How to answer in an interview

> "Using MUI and Tailwind together works well if you plan for two things: who wins the cascade, and breakpoints.
>
> MUI injects its styles with Emotion, so Tailwind classes can lose randomly. In MUI v7 I wrap the app in StyledEngineProvider with enableCssLayer, which puts MUI's styles in a CSS layer called mui. Then I declare the layer order so Tailwind's utilities layer comes after mui. Now a Tailwind class on an MUI component always wins, without !important.
>
> The breakpoints don't match by default: MUI's md is 900 pixels and Tailwind's is 768. I change one side so both say the same thing, and I keep brand colours in one place and reuse them in the MUI theme. Our rule was MUI for complex components and Tailwind for layout and small tweaks."

[FILL IN: confirm the UI library at SkillKeepr — your resume says MUI and Tailwind; only describe a real setup you used.]

## 🔁 Follow-up questions

### Why not just use `!important`?

It works, but every utility then becomes very hard to override. It also hides the real ordering problem. Cascade layers fix the order cleanly.

### MUI's spacing is 8px and Tailwind's is 4px. Is that a problem?

Not really. Both produce multiples of 4px. `p: 2` in MUI and `p-4` in Tailwind are both 16px. Just make sure the team knows the two scales.

### Would you start a new project with both?

Only if there's a clear need, like MUI's advanced components plus Tailwind for layout. Otherwise, one system is simpler. Some teams choose Tailwind plus a headless library instead.

### How do you share colours between them?

Put the brand values in Tailwind's `@theme`. In MUI's `createTheme`, use the same hex values, or `var(--color-brand-600)` with MUI's CSS-variables mode.

## ✅ Quick check

### 1. Without any fix, an MUI button has `className="rounded-full"`, but it stays slightly square. Why?

:::answer
**MUI's own border-radius rule wins the cascade.** Both rules have the same specificity, and MUI's styles were injected later. Putting MUI in an earlier CSS layer fixes it.
:::

### 2. MUI is at its defaults and Tailwind is at its defaults. At 800px wide, which `md` is active?

- A) Both
- B) Only Tailwind's `md:` (768px+)
- C) Only MUI's `md` (900px+)

:::answer
**B.** Tailwind's `md:` starts at 768px, so it's active. MUI's `md` starts at 900px, so it isn't. That gap is the bug you prevent by matching breakpoints.
:::

### 3. In `@layer theme, base, mui, components, utilities;`, which layer wins a clash between `mui` and `utilities`?

:::answer
**`utilities`.** It is listed later, and later layers win.
:::
