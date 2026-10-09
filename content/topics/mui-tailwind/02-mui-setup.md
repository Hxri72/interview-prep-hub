---
title: "Material UI: setup and core components"
stack: mui-tailwind
order: 2
level: Basic
mustKnow: true
askedFrequency: very common
summary:
  - Material UI (MUI) is a React component library based on Google's Material Design.
  - "Install it with: npm install @mui/material @emotion/react @emotion/styled. Emotion is the styling engine MUI uses."
  - Import each component from its own path, like import Button from '@mui/material/Button'.
  - Most-used components are Button, TextField, Typography, Box, Stack, Dialog, Table and Snackbar.
  - Components are changed with props (variant, color, size), and styled with the sx prop or the theme.
cards:
  - q: What do you install to use Material UI?
    a: "@mui/material plus @emotion/react and @emotion/styled. Emotion is the CSS-in-JS engine MUI uses by default. Icons are a separate package, @mui/icons-material."
  - q: What does the variant prop do on a Button?
    a: "It picks the style: text (no background), outlined (border only) or contained (filled background)."
  - q: What is Typography for?
    a: Showing text with the theme's font sizes. variant="h1" to "h6", "body1", "body2", "caption" and so on.
  - q: What is CssBaseline?
    a: A component that resets browser default styles (like body margin) so the app looks the same in every browser.
  - q: How do you show a form input in MUI?
    a: With TextField. It includes the label, the input, helper text and error state in one component.
---

## 💡 What is it?

**Material UI (MUI)** is a free library of ready-made React [components](glossary:component). It follows **Material Design**, Google's design system.

You install it once. Then you can use `<Button>`, `<TextField>`, `<Dialog>` and many more, already styled.

You change how each one looks with [props](glossary:props), like `variant="contained"` or `color="error"`.

## 🏠 Real-life example

Think of a **LEGO set**.

- The **box of LEGO pieces** = the MUI library.
- **Each piece** (window, wheel, door) = a component like `Button` or `TextField`.
- **The colour of a piece** = a prop like `color="primary"`.
- **The instruction book** = the MUI docs.
- **Your finished house** = your app's screen.

You don't make the pieces. You only choose and join them.

## 🧑‍💻 Code example

Set up: `npm create vite@latest mui-demo` (pick React), then `cd mui-demo` and run `npm install @mui/material @emotion/react @emotion/styled`. Paste into `src/App.jsx` and run `npm run dev`.

```jsx
import { useState } from 'react';                              // React hook to remember the typed name
import CssBaseline from '@mui/material/CssBaseline';           // resets browser default styles
import Typography from '@mui/material/Typography';             // text that uses the theme's font sizes
import TextField from '@mui/material/TextField';               // label + input + helper text in one
import Button from '@mui/material/Button';                     // a styled, accessible button
import Stack from '@mui/material/Stack';                       // puts children in a column or row with gaps

export default function App() {                                 // our main component
  const [name, setName] = useState('');                         // name starts as an empty string
  const isEmpty = name.trim() === '';                           // true when nothing real is typed
  return (                                                      // what the screen shows
    <>                                                          {/* a fragment: groups items without an extra div */}
      <CssBaseline />                                           {/* same look in every browser */}
      <Stack spacing={2} sx={{ maxWidth: 360, m: 4 }}>          {/* column, gap 2 units = 16px; max 360px wide; margin 4 units = 32px */}
        <Typography variant="h5">Add candidate</Typography>    {/* h5 = a medium heading size from the theme */}
        <TextField                                              // the input box
          label="Full name"                                     // the label shown inside the box
          value={name}                                          // the input shows our state (controlled input)
          onChange={(e) => setName(e.target.value)}             // save every key press into state
          error={isEmpty}                                       // red border when empty
          helperText={isEmpty ? 'Name is required' : ' '}       // small text under the box
        />                                                      {/* end of TextField */}
        <Button variant="contained" disabled={isEmpty}>Save</Button> {/* contained = filled blue; disabled when empty */}
      </Stack>                                                  {/* end of the column */}
    </>                                                         // end of the fragment
  );                                                            // end of what App returns
}                                                               // end of App
```

```text
A heading "Add candidate", a text box with the label "Full name"
showing a red border and "Name is required", and a grey (disabled) SAVE button.
Type a name: the red border goes away and the button turns blue.
```

## 🔍 Deeper version

**Packages:**

| Package | What it gives |
|---|---|
| `@mui/material` | The core components |
| `@emotion/react`, `@emotion/styled` | The styling engine (CSS-in-JS) |
| `@mui/icons-material` | 2,000+ Material icons as components |
| `@mui/x-data-grid`, `@mui/x-date-pickers` | Advanced components (MUI X). Some features are paid |
| `@fontsource/roboto` | The Roboto font, if you want Material's default font |

**Import style.** `import Button from '@mui/material/Button'` (a path import) and `import { Button } from '@mui/material'` (a named import) both work. Modern bundlers like Vite remove unused code ([tree shaking](glossary:tree-shaking)), so both are fine in production. Path imports can make the dev server start faster.

**Components you use most:**

| Group | Components |
|---|---|
| Layout | `Box`, `Stack`, `Container`, `Grid` |
| Text and inputs | `Typography`, `TextField`, `Select`, `Checkbox`, `Switch`, `Autocomplete` |
| Actions | `Button`, `IconButton`, `Menu` |
| Feedback | `Dialog`, `Snackbar`, `Alert`, `CircularProgress`, `Skeleton` |
| Data | `Table`, `List`, `Chip`, `Avatar`, `Card` |
| Navigation | `AppBar`, `Drawer`, `Tabs`, `Breadcrumbs` |

**Common props work the same everywhere:**
- `variant` — the style version (`contained`/`outlined`/`text` for Button).
- `color` — `primary`, `secondary`, `error`, `warning`, `info`, `success`.
- `size` — `small`, `medium`, `large`.
- `sx` — one-off styles using the theme (see [the sx prop](topic:mui-tailwind/sx-spacing)).

:::version[Version note]
MUI **v5** introduced the `sx` prop and Emotion. **v6** added CSS theme variables and the new Grid as `Grid2`. **v7** (2025) renamed `Grid2` to `Grid`, kept the old one as `GridLegacy`, and improved ES module support. Old tutorials using `@material-ui/core` are MUI v4 — don't follow those.
:::

## 🎯 Why do we use it?

- **Fast to build.** Forms, dialogs and tables are ready on day one.
- **Accessible.** Focus handling, keyboard support and ARIA labels are built in.
- **Consistent.** Every screen uses the same pieces and the same theme.
- **Well documented**, with many examples you can copy and adapt.

## ⚠️ Common mistakes

- **Forgetting the Emotion packages.** The app crashes with "Can't resolve '@emotion/react'".
- **Following MUI v4 tutorials** (`@material-ui/core`, `makeStyles`). They are outdated.
- **Styling with plain CSS and `!important`** instead of the theme or `sx`.
- **Not using `CssBaseline`**, so the page has a white margin and different defaults in each browser.

## 🗣️ How to answer in an interview

> "Material UI is a React component library based on Material Design. I install `@mui/material` plus Emotion, which is the styling engine. Then I use components like Button, TextField, Typography, Dialog and Table, and I change them with props like `variant`, `color` and `size`.
>
> For one-off styles I use the `sx` prop, and for app-wide branding I use a theme with `createTheme` and `ThemeProvider`. I also add `CssBaseline` so every browser starts from the same defaults.
>
> The big benefit is speed with accessibility: complex widgets like dialogs or autocompletes already handle focus and keyboard support."

[FILL IN: confirm the UI library used at SkillKeepr, and one screen you built with it.]

## 🔁 Follow-up questions

### What is Emotion and why does MUI need it?

Emotion is a CSS-in-JS library. MUI uses it to turn style objects (from `sx`, `styled` and the theme) into real CSS classes while the app runs.

### What is the difference between MUI and MUI X?

MUI (Material UI) is the free core library. MUI X has advanced components like the Data Grid and Date Pickers. Some of their features need a paid licence.

### Should I use named imports or path imports?

Both work. Production builds remove unused code either way. Path imports (`@mui/material/Button`) can make development faster in some setups.

### How do I show an icon in a button?

Install `@mui/icons-material`, import an icon like `SaveIcon`, and pass it as `startIcon={<SaveIcon />}`.

## ✅ Quick check

### 1. Which Button variant has a filled background?

- A) `text`
- B) `outlined`
- C) `contained`

:::answer
**C) `contained`.** `text` has no background, and `outlined` has only a border.
:::

### 2. Your app crashes with "Module not found: @emotion/react". What's missing?

:::answer
The Emotion packages. Run `npm install @emotion/react @emotion/styled`. MUI needs them as its styling engine.
:::

### 3. In `<Stack spacing={2}>`, how big is the gap between children?

:::answer
**16px.** MUI's spacing unit is 8px, so 2 × 8 = 16px.
:::
