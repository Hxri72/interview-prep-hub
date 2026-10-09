---
title: "Customising MUI components (styled, theme overrides)"
stack: mui-tailwind
order: 7
level: Intermediate
mustKnow: false
askedFrequency: common
summary:
  - There are four levels of customising MUI — sx (one element), styled() (a reusable component), theme styleOverrides (every instance) and theme variants (a new variant name).
  - "styled(Button)(({ theme }) => ({ … })) makes a new component with your styles built in."
  - "Theme overrides live in createTheme({ components: { MuiButton: { styleOverrides, defaultProps, variants } } })."
  - Each MUI component has named parts (slots) like root, label and icon, and state classes like Mui-disabled.
  - Pick the smallest level that does the job, and never fight MUI with !important.
cards:
  - q: What are the ways to customise an MUI component?
    a: "sx for a one-off change, styled() for a reusable styled component, theme styleOverrides to change every instance, and theme variants to add a new variant."
  - q: What is styled() in MUI?
    a: "A function that wraps a component and returns a new one with extra styles. It can read the theme: styled(Button)(({ theme }) => ({ … }))."
  - q: What are styleOverrides?
    a: "A theme setting that changes the styles of a component's slots (like root) for every instance in the app."
  - q: What is a slot?
    a: A named part of a component, like root, label or startIcon. Each slot has a class like .MuiButton-root.
  - q: "How do you style the disabled state?"
    a: "Target the state class: '&.Mui-disabled': { … } inside sx, styled or styleOverrides."
---

## 💡 What is it?

MUI's default look is Google's Material Design. Your company's design is often different. So you need to **customise** the components.

MUI gives you four levels:

1. **`sx`** — change one element.
2. **`styled()`** — make your own reusable component with a new look.
3. **Theme `styleOverrides`** — change every copy of a component in the app.
4. **Theme `variants`** — add a brand-new variant, like `variant="dashed"`.

## 🏠 Real-life example

Think of **changing school uniforms**.

- **One student pins a badge on their shirt** = `sx`. Only that one shirt changes.
- **The sports team gets its own special shirt** = `styled()`. A new, reusable kind of shirt.
- **The school changes the collar on every shirt** = theme `styleOverrides`. Every student's shirt changes.
- **The school adds a new "house colours" shirt option** = theme `variants`. A new choice everyone can pick.

## 🧑‍💻 Code example

Set up: `npm create vite@latest` (React), then `npm install @mui/material @emotion/react @emotion/styled`. Paste into `src/App.jsx`.

```jsx
import { createTheme, ThemeProvider, styled } from '@mui/material/styles'; // theme tools + styled()
import Button from '@mui/material/Button';                    // the MUI Button we customise
import Stack from '@mui/material/Stack';                      // a row of children with gaps

const theme = createTheme({                                    // our theme
  components: {                                                // per-component rules
    MuiButton: {                                               // rules for every Button
      defaultProps: { disableRipple: true },                   // no ripple animation anywhere
      styleOverrides: {                                        // style changes for every Button
        root: { borderRadius: 999, textTransform: 'none' },    // root slot: pill shape, normal case
      },                                                       // end of styleOverrides
      variants: [                                              // our own new variant
        {                                                      // one variant rule
          props: { variant: 'dashed' },                        // used when <Button variant="dashed">
          style: { border: '2px dashed', padding: '6px 16px' }, // 2px dashed border; 6px top/bottom, 16px left/right
        },                                                     // end of the dashed rule
      ],                                                       // end of variants
    },                                                         // end of MuiButton
  },                                                           // end of components
});                                                            // end of createTheme

const DangerButton = styled(Button)(({ theme }) => ({          // a new reusable component based on Button
  backgroundColor: theme.palette.error.main,                   // the theme's red
  color: theme.palette.error.contrastText,                     // readable text colour on red (white)
  '&:hover': { backgroundColor: theme.palette.error.dark },    // darker red on hover
}));                                                           // end of DangerButton

export default function App() {                                 // our main component
  return (                                                     // what the screen shows
    <ThemeProvider theme={theme}>                              {/* share the theme */}
      <Stack direction="row" spacing={2} sx={{ p: 3 }}>        {/* a row; 16px gaps; 24px padding */}
        <Button variant="contained">Save</Button>              {/* theme override: pill shape, no caps */}
        <Button variant="dashed">Draft</Button>                {/* our new theme variant */}
        <DangerButton>Delete</DangerButton>                    {/* the styled() component */}
        <Button variant="outlined" sx={{ fontWeight: 700 }}>Bold</Button> {/* sx: only this one is bold */}
      </Stack>                                                 {/* end of the row */}
    </ThemeProvider>                                           // end of the provider
  );                                                           // end of what App returns
}                                                              // end of App
```

```text
Four pill-shaped buttons in normal case (no UPPERCASE), with no ripple on click:
"Save" (filled blue), "Draft" (2px dashed border), "Delete" (red, darker red on hover),
"Bold" (outlined, bold text — only this one is bold).
```

## 🔍 Deeper version

**Which level to choose:**

| Need | Use | Scope |
|---|---|---|
| Tweak one element | `sx` | That element |
| Same custom look in several places | `styled()` or a small wrapper component | Where you use it |
| Change the look of a component everywhere | theme `styleOverrides` | Whole app |
| Change a default prop everywhere | theme `defaultProps` | Whole app |
| A new named style option | theme `variants` | Whole app, opt-in |

**Slots and classes.** Each component has named parts called **slots**. For Button: `root`, `startIcon`, `endIcon`. Each slot has a global class like `.MuiButton-root`. States have classes too: `.Mui-disabled`, `.Mui-focused`, `.Mui-error`, `.Mui-selected`.

In `sx` or `styled`, target them with nested selectors:

- `'& .MuiButton-startIcon': { mr: 0.5 }` — the icon inside.
- `'&.Mui-disabled': { opacity: 0.5 }` — note: no space, because the class is on the same element.

**styleOverrides can read props.** Use a function: `root: ({ ownerState, theme }) => ({ … })`. `ownerState` holds the component's props, like `variant` or `size`.

**`slotProps`.** In MUI v6/v7 you can pass props to inner parts, like `slotProps={{ input: { … } }}` on TextField. This replaced older props like `InputProps`.

**CSS specificity.** MUI's styles are injected by Emotion. If plain CSS doesn't win, the fix is to use the theme or `sx`, not `!important`. If you must use plain CSS or Tailwind, configure the style order (CSS layers or `StyledEngineProvider injectFirst`). See [MUI and Tailwind together](topic:mui-tailwind/mui-and-tailwind-together).

:::version[Version note]
`makeStyles` and `withStyles` (MUI v4) are removed. In v5+ use `styled()` and `sx`. In v6/v7, many old props like `InputProps` and `componentsProps` are deprecated in favour of `slots` and `slotProps`.
:::

## 🎯 Why do we use it?

- **Match the company design** without rewriting components.
- **Change the whole app in one place** with theme overrides.
- **Reuse a custom look** without copy-pasting styles.
- **Keep MUI's behaviour** (keyboard, focus, accessibility) while changing the look.

## ⚠️ Common mistakes

- **Using `!important`** to beat MUI's styles. Use the theme or the right selector.
- **A space in `'& .Mui-disabled'`** when you meant the same element. That targets a child, so nothing changes. Use `'&.Mui-disabled'`.
- **Copying the same `sx` object into many files** instead of making a `styled` component.
- **Defining `styled()` components inside another component.** They are re-created every render. Define them at the top level.

## 🗣️ How to answer in an interview

> "I customise MUI at the smallest level that works. For one element I use `sx`. For a look I reuse, I wrap the component with `styled()`, which can read the theme — for example a red DangerButton based on Button. To change a component everywhere, I use the theme's `components` key: `defaultProps` for defaults, `styleOverrides` for slot styles like `root`, and `variants` to add my own variant name.
>
> I target parts and states with MUI's classes, like `.MuiButton-startIcon` or `&.Mui-disabled`, and I avoid `!important` — if plain CSS loses, it's a sign to use the theme or fix the style order instead."

[FILL IN: confirm the UI library used at SkillKeepr, and one component your team customised.]

## 🔁 Follow-up questions

### `styled()` vs `sx` — which is faster?

`styled()` creates the styles once per component type. `sx` is processed on each render. For thousands of rows, `styled()` (or a class) is faster.

### How do you style based on a prop?

In `styled`, read the prop: `styled(Box)(({ active }) => ({ … }))`. Use `shouldForwardProp` so your custom prop isn't passed to the DOM.

### What is `ownerState`?

The props and state of the component, given to `styleOverrides` functions. For example, `ownerState.variant === 'contained'`.

### How do you add a new colour option like `color="brand"`?

Add `brand` to the palette, then (in TypeScript) extend the component's props interface so `color="brand"` is allowed.

## ✅ Quick check

### 1. You want every TextField in the app to be `size="small"`. Which level?

:::answer
**Theme `defaultProps`:** `components: { MuiTextField: { defaultProps: { size: 'small' } } }`.
:::

### 2. Why doesn't this make disabled buttons faded?

```jsx
<Button sx={{ '& .Mui-disabled': { opacity: 0.4 } }} disabled>Save</Button> // style for disabled state
```

:::answer
The space in `'& .Mui-disabled'` means "a **child** with that class". The class is on the button itself, so it should be `'&.Mui-disabled'`.
:::

### 3. True or false: `makeStyles` is the recommended way to style MUI v7 components.

:::answer
**False.** `makeStyles` was MUI v4. Use `sx`, `styled()` and the theme.
:::
