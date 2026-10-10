---
title: "Mantine theming: createTheme and MantineProvider"
stack: mantine-tailwind
order: 5
level: Intermediate
mustKnow: true
askedFrequency: very common
summary:
  - "A theme is one object with your app's design rules: colours, primary colour, fonts, radius and spacing. You build it with createTheme() and pass it to <MantineProvider theme={theme}>."
  - "Every colour is a tuple of 10 shades, index 0 (lightest) to 9 (darkest). The primary colour uses shade 6 in light mode by default."
  - "Mantine turns the theme into CSS variables like --mantine-color-brand-6 and --mantine-spacing-md, which your own CSS can use too."
  - "theme.components lets you set default props for a component everywhere, e.g. every Button gets radius=\"xl\"."
  - You only write the parts you change; Mantine merges them with the default theme.
cards:
  - q: How do you add a custom brand colour in Mantine?
    a: "Add a 10-shade tuple to createTheme({ colors: { brand: [...10 hex values] }, primaryColor: 'brand' }). Index 0 is lightest, 9 darkest."
  - q: Why does a Mantine colour need 10 shades?
    a: Components use different shades for different states — light backgrounds (0–1), borders (3–4), the filled colour (6), hover (7) and dark mode (8).
  - q: How do you give every Button the same default props?
    a: "In the theme: components: { Button: Button.extend({ defaultProps: { radius: 'xl' } }) }."
  - q: How do you use theme values in your own CSS?
    a: Through the CSS variables Mantine creates, like var(--mantine-color-brand-6), var(--mantine-spacing-md) and var(--mantine-font-family).
  - q: How do you read the theme inside a component?
    a: With the useMantineTheme() hook, e.g. theme.colors.brand[6] or theme.spacing.md.
---

## 💡 What is it?

A **theme** is one object that holds your app's **design rules**: brand colours, the main (primary) colour, fonts, corner radius and spacing.

You create it with `createTheme()`. Then you pass it to `<MantineProvider theme={theme}>`. Every Mantine [component](glossary:component) inside now follows those rules.

You only write what you want to change. Mantine fills in the rest from its default theme.

## 🏠 Real-life example

Think of a **school uniform rule book**.

The rule book says: "Shirt colour is navy. Ties are maroon. Everyone uses the same badge." Each student doesn't decide their own colours. The whole school looks the same.

- **The rule book** = the theme object from `createTheme()`.
- **"Navy is our main colour"** = `primaryColor: 'brand'`.
- **The 10 shades of navy fabric, light to dark** = a colour tuple with 10 values.
- **The principal handing out the rule book to every class** = `MantineProvider` passing the theme down.
- **"Every tie must be the long type"** = `components: { Button: ... defaultProps }`, a default for one component everywhere.

## 🧑‍💻 Code example

Use the setup from [Mantine setup](topic:mantine-tailwind/mantine-setup). Create **`src/theme.js`**:

```js
import { Button, createTheme } from '@mantine/core';          // theme builder + Button (for defaults)

export const theme = createTheme({                            // our design rules
  colors: {                                                   // add our own colours
    brand: [                                                  // 10 shades: index 0 = lightest, 9 = darkest
      '#eaf2fb', '#d4e4f6', '#a8c8ec', '#78aae2', '#5191d9',  // shades 0–4: backgrounds, borders
      '#3881d4', '#1f5f99', '#1a5187', '#154374', '#0f335c',  // shades 5–9: 6 = main filled colour
    ],                                                        // end of the brand tuple
  },                                                          // end of colours
  primaryColor: 'brand',                                      // components use "brand" when no color is given
  fontFamily: 'Rubik, sans-serif',                            // font for all text
  headings: { fontFamily: 'Rubik, sans-serif' },              // font for Title / h1–h6
  defaultRadius: 'md',                                        // corner radius for all components: 8px
  components: {                                               // per-component defaults
    Button: Button.extend({                                   // typed helper for Button settings
      defaultProps: { radius: 'xl' },                         // every Button gets 32px round corners
    }),                                                       // end of Button settings
  },                                                          // end of components
});                                                           // end of the theme
```

In **`src/main.jsx`**, pass it to the provider:

```jsx
import { theme } from './theme.js';                           // our theme
// ...the other imports from the setup topic stay the same      // (styles.css, MantineProvider, App)

createRoot(document.getElementById('root')).render(           // draw the app
  <MantineProvider theme={theme}>                             {/* every component inside follows our theme */}
    <App />                                                   {/* the app */}
  </MantineProvider>,                                         // end of the provider
);                                                            // end of render
```

**`src/App.jsx`**:

```jsx
import { Badge, Button, Group, Paper, Text, useMantineTheme } from '@mantine/core'; // components + theme hook

export default function App() {                               // our main component
  const theme = useMantineTheme();                            // read the theme in JavaScript
  return (                                                    // what the screen shows
    <Paper p="xl" m="xl" withBorder>                          {/* a card: 32px padding and margin, thin border */}
      <Text>Primary colour: {theme.primaryColor}</Text>       {/* prints "brand" */}
      <Text c="brand.9">Darkest brand shade</Text>            {/* text in shade 9 */}
      <Group mt="md">                                         {/* a row, 16px space above */}
        <Button>Save</Button>                                 {/* filled brand shade 6, round (radius xl) */}
        <Button variant="light">Cancel</Button>               {/* light brand background, brand text */}
        <Badge>New</Badge>                                    {/* small brand-coloured label */}
      </Group>                                                {/* end of the row */}
    </Paper>                                                  // end of the card
  );                                                          // end of what App returns
}                                                             // end of App
```

Run `npm run dev`.

```text
A white bordered card with text in the Rubik font (if installed; otherwise sans-serif).
"Primary colour: brand", then a line in very dark blue.
A dark-blue round "Save" button, a pale-blue "Cancel" button and a blue "New" badge.
No color prop was needed — everything uses the brand colour.
```

## 🔍 Deeper version

**What the provider does with the theme.** `MantineProvider` merges your theme with the default theme. Then it writes **CSS variables** on `:root`:

| CSS variable | Comes from |
|---|---|
| `--mantine-color-brand-0` … `--mantine-color-brand-9` | `colors.brand` |
| `--mantine-primary-color-filled` | the primary colour's filled shade |
| `--mantine-spacing-md` | `spacing.md` |
| `--mantine-radius-default` | `defaultRadius` |
| `--mantine-font-family` | `fontFamily` |

Your own CSS modules can use them, so custom elements match the components:

```css
.card { border-left: 4px solid var(--mantine-color-brand-6); } /* uses shade 6 of brand */
```

**Why 10 shades?** Component variants pick different shades:
- `filled` buttons use the primary shade, **6** in light mode and **8** in dark mode by default (`primaryShade: { light: 6, dark: 8 }`).
- `light` variants use pale shades for the background.
- Hover states use a darker shade.

If you only have one brand hex, `colorsTuple('#1f5f99')` repeats it 10 times. That works, but hover and light variants then look the same as filled. A real 10-shade palette looks better.

**Useful theme keys:**

| Key | What it controls |
|---|---|
| `colors`, `primaryColor`, `primaryShade` | colours |
| `fontFamily`, `headings`, `fontSizes` | text |
| `spacing`, `radius`, `defaultRadius`, `shadows` | sizes |
| `breakpoints` | the `xs`–`xl` screen widths |
| `components` | default props, classNames and styles per component |
| `other` | your own custom values, like `other.sidebarWidth` |
| `autoContrast` | choose black or white text automatically on filled colours |

**Nested providers.** You can wrap one part of the app in another `MantineProvider` with a different theme. This is rarely needed. Usually one theme at the root is enough.

:::version[Version note]
- **Mantine 6** themes were applied through emotion. **Mantine 7+** turns the theme into CSS variables instead, which is why `var(--mantine-color-...)` works in plain CSS files.
- `Component.extend()` for typed component defaults arrived with Mantine 7.
- At **SkillKeepr** (Mantine 7), the theme is built with `createTheme` with custom colour palettes and a custom font.
:::

## 🎯 Why do we use it?

- **One source of truth.** Brand colour or radius changes in one file, and the whole app updates.
- **Consistency.** Developers don't pick their own blues and paddings.
- **Less code.** No `color="brand"` on every button, because the primary colour is the default.
- **Works with plain CSS.** CSS variables let your own styles match the components.

## ⚠️ Common mistakes

- **Giving a colour fewer than 10 shades.** The TypeScript type needs exactly 10, and some variants read missing shades.
- **Writing `primaryColor: '#1f5f99'`.** It must be the **name** of a colour in `colors`, like `'brand'`.
- **Copying the whole default theme into yours.** Only write what you change; Mantine merges the rest.
- **Hard-coding hex values in CSS** instead of using `var(--mantine-color-brand-6)`. Then dark mode and theme changes miss them.

## 🗣️ How to answer in an interview

> "In Mantine, the theme is one object made with `createTheme` and passed to `MantineProvider`. It holds colours, the primary colour, fonts, radius, spacing, breakpoints and per-component defaults. Each colour is a tuple of 10 shades, because variants use different shades — filled buttons use shade 6 in light mode, light variants use the pale ones. The provider turns the theme into CSS variables like `--mantine-color-brand-6`, so my own CSS modules can match the components. For app-wide defaults, I use `components` with `Button.extend({ defaultProps })`. At SkillKeepr, our Mantine 7 theme sets custom palettes and the brand font this way."

[FILL IN: if you changed or extended the SkillKeepr theme, say what you added.]

## 🔁 Follow-up questions

### How do you access theme values in JavaScript?

With `useMantineTheme()`. For example, `theme.colors.brand[6]` gives the hex value and `theme.spacing.md` gives `'1rem'`.

### What is `primaryShade`?

It says which shade of the primary colour is the "main" one. The default is `{ light: 6, dark: 8 }`, so filled buttons use shade 6 in light mode and shade 8 in dark mode.

### How do you change one component's styles for the whole app?

In `theme.components`, use `Button.extend({ defaultProps, classNames, styles })`. `defaultProps` changes default props. `classNames` attaches CSS module classes to the component's inner parts.

### Can you add your own values to the theme?

Yes, in `other`: `createTheme({ other: { sidebarWidth: 260 } })`. Then read `theme.other.sidebarWidth` with `useMantineTheme()`.

## ✅ Quick check

### 1. Which shade does a filled brand Button use in light mode with the default `primaryShade`?

:::answer
**Shade 6** — `theme.colors.brand[6]`.
:::

### 2. What is wrong with `createTheme({ primaryColor: '#1f5f99' })`?

:::answer
`primaryColor` must be the **name** of a colour that exists in `theme.colors`, like `'blue'` or `'brand'`. A hex string isn't valid there.
:::

### 3. How can a plain CSS file use the brand colour?

- A) `color: theme.brand;`
- B) `color: var(--mantine-color-brand-6);`
- C) `color: brand.6;`

:::answer
**B.** Mantine writes theme values as CSS variables, so plain CSS can use `var(--mantine-color-brand-6)`.
:::
