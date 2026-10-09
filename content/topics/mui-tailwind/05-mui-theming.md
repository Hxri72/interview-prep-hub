---
title: "MUI theming: createTheme and ThemeProvider"
stack: mui-tailwind
order: 5
level: Intermediate
mustKnow: true
askedFrequency: very common
summary:
  - A theme is one object that holds the app's design rules — colours, fonts, spacing, shapes and breakpoints.
  - createTheme builds the theme; ThemeProvider shares it with every MUI component below it.
  - Change palette.primary.main once, and every primary button, link and input changes everywhere.
  - "The theme can also set default props and style overrides for each component (components: { MuiButton: … })."
  - Read the theme in your own code with the useTheme hook or an sx function.
cards:
  - q: What is an MUI theme?
    a: One object with the app's design rules — palette (colours), typography (fonts), spacing, shape (corner radius) and breakpoints.
  - q: What do createTheme and ThemeProvider do?
    a: createTheme builds a full theme from your changes plus MUI's defaults. ThemeProvider wraps the app so every component can use it.
  - q: How do you change the main brand colour?
    a: "createTheme({ palette: { primary: { main: '#1f5f99' } } }). MUI works out the light, dark and text colours by itself."
  - q: How do you make every Button non-uppercase by default?
    a: "In the theme: typography: { button: { textTransform: 'none' } }, or a style override under components.MuiButton."
  - q: How do you read theme values in your own component?
    a: "const theme = useTheme(); then theme.palette.primary.main or theme.spacing(2). Or use an sx function."
---

## 💡 What is it?

A **theme** is one JavaScript object that holds your app's **design rules**. It holds colours, fonts, spacing, corner shapes and screen sizes.

You build it with `createTheme`. You share it with `ThemeProvider`.

After that, every MUI [component](glossary:component) uses your rules. Change a colour in one place, and it changes in the whole app.

## 🏠 Real-life example

Think of a **school's colour and uniform rules**.

The school decides once: "Our colour is navy blue. Our font on notices is bold. Every badge has round corners." Every class follows these rules. If the school changes navy to green, every class changes too.

- **The rule book** = the theme object.
- **Writing the rule book** = `createTheme`.
- **Giving the rule book to every class** = `ThemeProvider` around the app.
- **A class that follows the rules** = an MUI component.
- **One class asking "what is our colour?"** = `useTheme()`.

## 🧑‍💻 Code example

Set up: `npm create vite@latest` (React), then `npm install @mui/material @emotion/react @emotion/styled`. Paste into `src/App.jsx`.

```jsx
import { createTheme, ThemeProvider, useTheme } from '@mui/material/styles'; // theme tools
import CssBaseline from '@mui/material/CssBaseline';            // resets browser styles, uses theme background
import Button from '@mui/material/Button';                      // a themed button
import Typography from '@mui/material/Typography';              // themed text

const theme = createTheme({                                      // build our theme (MUI fills in the rest)
  palette: {                                                     // the colour rules
    primary: { main: '#1f5f99' },                                // brand blue; MUI makes light/dark versions
    secondary: { main: '#e07a1f' },                              // brand orange
  },                                                             // end of palette
  typography: {                                                  // the font rules
    fontFamily: 'Inter, Roboto, sans-serif',                     // first font found is used
    button: { textTransform: 'none', fontWeight: 600 },          // buttons: no UPPERCASE, semi-bold
  },                                                             // end of typography
  shape: { borderRadius: 10 },                                   // default corner radius = 10px
  components: {                                                  // rules for specific components
    MuiButton: {                                                 // every Button
      defaultProps: { disableElevation: true },                  // no shadow by default
    },                                                           // end of MuiButton
  },                                                             // end of components
});                                                              // end of createTheme

function BrandNote() {                                           // a small component of our own
  const t = useTheme();                                          // read the theme object
  return <Typography sx={{ color: t.palette.primary.main }}>Our blue is {t.palette.primary.main}</Typography>; // shows the colour value
}                                                                // end of BrandNote

export default function App() {                                  // our main component
  return (                                                       // what the screen shows
    <ThemeProvider theme={theme}>                                {/* share the theme with everything inside */}
      <CssBaseline />                                            {/* page background and fonts from the theme */}
      <BrandNote />                                              {/* uses useTheme */}
      <Button variant="contained">Save</Button>                  {/* brand blue, no caps, no shadow, 10px corners */}
      <Button variant="outlined" color="secondary">Cancel</Button> {/* orange border and text */}
    </ThemeProvider>                                             // end of the provider
  );                                                             // end of what App returns
}                                                                // end of App
```

```text
Our blue is #1f5f99
[ Save ]  (dark-blue filled button, normal case, rounded corners, no shadow)
[ Cancel ] (orange outlined button)
```

## 🔍 Deeper version

**What a theme contains:**

| Key | Holds | Example |
|---|---|---|
| `palette` | Colours: primary, secondary, error, warning, info, success, grey, text, background, divider | `primary.main` |
| `typography` | Font family, sizes and weights for `h1`–`h6`, `body1`, `button`… | `typography.h4.fontSize` |
| `spacing` | The spacing unit (default 8px) | `theme.spacing(2)` → `16px` |
| `shape` | `borderRadius` (default 4px) | `shape.borderRadius` |
| `breakpoints` | `xs` 0, `sm` 600, `md` 900, `lg` 1200, `xl` 1536 | `theme.breakpoints.up('md')` |
| `shadows`, `zIndex`, `transitions` | Shadow levels, stacking order, animation timing | `shadows[3]` |
| `components` | Default props and style overrides per component | `MuiButton.styleOverrides` |

**Automatic colour variants.** If you only give `main`, MUI calculates `light`, `dark` and `contrastText` (black or white text that is readable on that colour).

**Component customisation in the theme:**
- `defaultProps` — change a default for every instance, like `size: 'small'` for all TextFields.
- `styleOverrides` — change styles of a component's parts (slots), like `root` or `label`.
- `variants` — add your own variant, like `variant="dashed"`. See [customising components](topic:mui-tailwind/mui-customizing).

**Nested themes.** A `ThemeProvider` inside another can change part of the theme for one section, for example a dark sidebar. Pass a function to merge with the outer theme.

**Reading the theme:**
- `useTheme()` in a component.
- `sx={(theme) => ({ … })}` in a style.
- `styled(Box)(({ theme }) => ({ … }))` in a styled component.

**TypeScript.** To add your own palette colour (like `palette.brand`), you extend MUI's types with *module augmentation* so `theme.palette.brand` is typed.

:::version[Version note]
In MUI **v5**, themes were plain JS objects only. From **v6**, `createTheme({ cssVariables: true })` can output CSS variables (like `--mui-palette-primary-main`), and **colour schemes** (light/dark) live in the same theme. See [dark mode in MUI](topic:mui-tailwind/mui-dark-mode).
:::

## 🎯 Why do we use it?

- **One place to change the brand.** Colours and fonts change everywhere at once.
- **Consistency.** Every screen follows the same rules without anyone remembering them.
- **Fewer overrides.** Instead of fixing styles on each page, set the rule once.
- **Dark mode and white-labelling** become possible, because colours come from the theme, not hard-coded values.

## ⚠️ Common mistakes

- **Hard-coding colours** like `color: '#1f5f99'` in components. Use `'primary.main'` so the theme controls it.
- **Forgetting `ThemeProvider`**, or placing a component outside it. Then it uses MUI's default blue.
- **Creating the theme inside a component.** It is rebuilt on every render. Create it once outside, or wrap it in `useMemo`.
- **Overriding styles with global CSS and `!important`** instead of `styleOverrides`.

## 🗣️ How to answer in an interview

> "In MUI, the theme is one object with the app's design rules — palette, typography, spacing, shape and breakpoints. I build it with `createTheme` and wrap the app in `ThemeProvider`, so every component uses it. If I change `palette.primary.main`, every primary button and input changes, and MUI calculates the light, dark and contrast text colours for me.
>
> I also use the `components` key to set default props and style overrides, like turning off uppercase on all buttons. In my own components I read values with `useTheme` or an `sx` function instead of hard-coding colours. That keeps the design consistent and makes things like dark mode much easier."

[FILL IN: confirm the UI library used at SkillKeepr, and what your team's theme customised — brand colours, fonts?]

## 🔁 Follow-up questions

### How do you add a custom colour like `brand`?

Add it in `createTheme({ palette: { brand: { main: '#…' } } })`. In TypeScript, extend the `Palette` and `PaletteOptions` interfaces so it is typed. With an extra step, components can use `color="brand"`.

### What is `contrastText`?

The text colour that is readable on top of a palette colour. MUI picks black or white automatically from `main`, using a contrast check.

### Can two parts of the app use different themes?

Yes. Nest a second `ThemeProvider` around that part. Components inside use the inner theme.

### Why not just use a global CSS file?

You can, but a theme is typed, understood by every MUI component, works with `sx` and breakpoints, and can switch at runtime (for example, light and dark).

## ✅ Quick check

### 1. You set `palette.primary.main` to green. What happens to `<Button variant="contained">`?

:::answer
It turns **green** everywhere, because `color="primary"` is the default and reads the theme's primary colour.
:::

### 2. What is wrong with this?

```jsx
function App() {                                    // main component
  const theme = createTheme({ palette: { mode: 'dark' } }); // theme made inside the component
  return <ThemeProvider theme={theme}>…</ThemeProvider>;    // provide it
}
```

:::answer
The theme is **created again on every render**. Create it once outside the component, or wrap it in `useMemo`.
:::

### 3. `theme.spacing(3)` with the default theme returns what?

:::answer
**`'24px'`** — 3 units × 8px.
:::
