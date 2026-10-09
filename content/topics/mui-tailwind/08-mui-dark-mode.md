---
title: Dark mode in MUI
stack: mui-tailwind
order: 8
level: Intermediate
mustKnow: false
askedFrequency: sometimes
summary:
  - "Modern MUI (v6+) supports light and dark in one theme: createTheme({ colorSchemes: { dark: true } })."
  - "The useColorScheme hook gives mode ('light', 'dark' or 'system') and setMode to switch."
  - The user's choice is saved in localStorage, and 'system' follows the computer's setting.
  - "With cssVariables: true, colours become CSS variables, so switching modes doesn't re-render every component and avoids a flash."
  - Use palette names (text.primary, background.paper) — never hard-coded colours — so both modes look right.
cards:
  - q: How do you turn on dark mode support in MUI v6/v7?
    a: "Create the theme with colorSchemes: createTheme({ colorSchemes: { dark: true } }), and wrap the app in ThemeProvider."
  - q: How does the user switch modes?
    a: "With the useColorScheme hook: const { mode, setMode } = useColorScheme(); then setMode('dark'), 'light' or 'system'."
  - q: What does mode 'system' mean?
    a: It follows the operating system's light/dark setting (the prefers-color-scheme media query).
  - q: Why use cssVariables true?
    a: Colours become CSS variables. Switching modes only changes the variables, so the page doesn't flash and React doesn't re-render everything.
  - q: Why can't you hard-code colours like '#fff'?
    a: They don't change with the mode. Use palette paths like 'background.paper' and 'text.primary' that have a light and a dark value.
---

## 💡 What is it?

**Dark mode** shows light text on a dark background. Many users like it at night. It also saves battery on some phone screens.

In modern MUI (v6 and v7), **one theme can hold both light and dark colours**. These are called **colour schemes**.

A small hook, `useColorScheme`, lets the user switch between `light`, `dark` and `system`.

## 🏠 Real-life example

Think of a **classroom with two sets of lights**.

- **Daytime lights** = the light colour scheme.
- **Night-time lamps** = the dark colour scheme.
- **The switch on the wall** = `setMode`.
- **An automatic sensor that follows the sun** = mode `'system'` (it follows the computer's setting).
- **Painting the wall a fixed colour** = hard-coding `#fff`. It looks wrong when the lights change.

## 🧑‍💻 Code example

Set up: `npm create vite@latest` (React), then `npm install @mui/material @emotion/react @emotion/styled`. Paste into `src/App.jsx`.

```jsx
import { createTheme, ThemeProvider, useColorScheme } from '@mui/material/styles'; // theme tools + mode hook
import CssBaseline from '@mui/material/CssBaseline';           // sets page background/text from the theme
import Paper from '@mui/material/Paper';                       // a card that uses background.paper
import Typography from '@mui/material/Typography';             // themed text
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'; // a group of toggle buttons
import ToggleButton from '@mui/material/ToggleButton';          // one toggle button

const theme = createTheme({                                     // our theme
  cssVariables: true,                                           // output colours as CSS variables (no flash)
  colorSchemes: { dark: true },                                 // add a dark scheme next to the default light one
});                                                             // end of createTheme

function ModeSwitch() {                                         // the light/dark/system switch
  const { mode, setMode } = useColorScheme();                   // current mode + function to change it
  if (!mode) return null;                                       // mode is undefined for a moment on first load
  return (                                                      // what the switch shows
    <ToggleButtonGroup                                          // three buttons, one selected
      value={mode}                                              // the selected button = current mode
      exclusive                                                 // only one can be selected
      onChange={(e, next) => next && setMode(next)}             // change mode (ignore clicks that unselect)
    >                                                           {/* end of the group's opening tag */}
      <ToggleButton value="light">Light</ToggleButton>          {/* always light */}
      <ToggleButton value="dark">Dark</ToggleButton>            {/* always dark */}
      <ToggleButton value="system">System</ToggleButton>        {/* follow the computer's setting */}
    </ToggleButtonGroup>                                        // end of the group
  );                                                            // end of what ModeSwitch returns
}                                                               // end of ModeSwitch

export default function App() {                                  // our main component
  return (                                                      // what the screen shows
    <ThemeProvider theme={theme}>                               {/* share the theme with both schemes */}
      <CssBaseline />                                           {/* page background follows the mode */}
      <Paper sx={{ m: 3, p: 3 }}>                               {/* margin 24px, padding 24px; colour from background.paper */}
        <Typography sx={{ mb: 2, color: 'text.secondary' }}>    {/* grey text that works in both modes; margin-bottom 16px */}
          Pick a theme                                          {/* the label */}
        </Typography>                                           {/* end of the label */}
        <ModeSwitch />                                          {/* our switch */}
      </Paper>                                                  {/* end of the card */}
    </ThemeProvider>                                            // end of the provider
  );                                                            // end of what App returns
}                                                               // end of App
```

```text
A card with "Pick a theme" and three buttons: Light | Dark | System.
Click "Dark": the page turns dark grey, the card a little lighter, the text light.
Reload the page: your choice is remembered (it is saved in localStorage).
```

## 🔍 Deeper version

**How it works.** With `colorSchemes`, the theme has two palettes. MUI stores the chosen mode in [localStorage](topic:javascript/browser-storage) (key `mui-mode` by default) and applies it on load. `'system'` reads the `prefers-color-scheme` media query.

**`cssVariables: true`.** Without it, switching modes re-creates the theme, and every themed component re-renders. With it, colours become CSS variables like `--mui-palette-background-paper`. Switching only changes which variable values apply, so it is fast. It also allows a script in the page head to set the right mode **before** the first paint, which avoids a white flash in dark mode.

**Server rendering (Next.js).** The server doesn't know the user's mode. Add `<InitColorSchemeScript />` to the document head, so the correct mode is set before React loads. Without it you can see a flash, or a hydration warning.

**Choosing the selector.** By default MUI uses the `prefers-color-scheme` media query or a data attribute. With `colorSchemeSelector: 'class'`, it adds a `.dark` class to `<html>`. This is useful when you also use Tailwind's class-based dark mode.

**Designing for both modes:**
- Use `background.default`, `background.paper`, `text.primary`, `text.secondary`, `divider` — they have light and dark values.
- In dark mode, MUI lightens `Paper` with higher elevation, instead of only adding shadows.
- Check contrast in **both** modes. Grey text that looks fine on white can be too faint on dark grey.

**The old way (MUI v5).** You created two themes and switched between them: `createTheme({ palette: { mode: darkMode ? 'dark' : 'light' } })`, with your own React state and localStorage code. It still works, but it re-renders the whole app and can flash on load.

:::version[Version note]
`colorSchemes`, `cssVariables` and `useColorScheme` on the normal `ThemeProvider` arrived in **MUI v6**. In v5, CSS variables needed the separate experimental `CssVarsProvider`.
:::

## 🎯 Why do we use it?

- **User comfort.** Many people prefer dark screens, especially at night.
- **Respect the system setting** automatically with `'system'`.
- **No flash and fast switching** with CSS variables.
- **One theme** for both modes keeps colours consistent.

## ⚠️ Common mistakes

- **Hard-coded colours** like `color: '#333'` or `bgcolor: 'white'`. They don't change in dark mode.
- **Reading `mode` on the first render** without checking for `undefined`. Show nothing (or a placeholder) until it is ready.
- **Forgetting `CssBaseline`**, so the page background stays white in dark mode.
- **Only testing light mode.** Text that is fine on white can be unreadable on dark grey.

## 🗣️ How to answer in an interview

> "In MUI v6 and v7, I add dark mode with colour schemes in one theme: `createTheme({ colorSchemes: { dark: true }, cssVariables: true })`. The `useColorScheme` hook gives me `mode` and `setMode`, so a toggle can switch between light, dark and system, and MUI saves the choice in localStorage.
>
> With `cssVariables` on, colours are CSS variables, so switching doesn't re-render every component and there's no white flash on load. For server-rendered apps I add `InitColorSchemeScript`.
>
> The key rule is to never hard-code colours — I use palette names like `background.paper` and `text.secondary`, and I test contrast in both modes."

[FILL IN: confirm the UI library used at SkillKeepr, and whether your app had dark mode.]

## 🔁 Follow-up questions

### Why is `mode` undefined on the first render?

MUI reads the saved mode from localStorage after mounting. Until then it doesn't know, so it returns `undefined`. Render nothing or a placeholder until it is set.

### How do you avoid the white flash in a server-rendered app?

Use CSS variables and add `<InitColorSchemeScript />` in the HTML head. It sets the mode before the page paints.

### How do you make MUI and Tailwind dark mode match?

Set MUI's `colorSchemeSelector: 'class'` so it adds a `dark` class, and use Tailwind's class-based `dark:` variant. Both then follow the same class.

### Can each scheme have its own primary colour?

Yes: `colorSchemes: { light: { palette: { primary: { main: … } } }, dark: { palette: { primary: { main: … } } } }`.

## ✅ Quick check

### 1. What does `setMode('system')` do?

:::answer
It makes the app follow the **operating system's** light or dark setting (`prefers-color-scheme`).
:::

### 2. Why does this card stay white in dark mode? `<Box sx={{ bgcolor: '#fff' }} />`

:::answer
The colour is **hard-coded**. Use `bgcolor: 'background.paper'`, which has a light and a dark value.
:::

### 3. What is the benefit of `cssVariables: true` for dark mode?

:::answer
Switching modes only changes CSS variable values, so there is **no full re-render** and **no flash** of the wrong colours on load.
:::
