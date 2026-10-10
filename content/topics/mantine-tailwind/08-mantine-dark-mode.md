---
title: "Dark mode in Mantine"
stack: mantine-tailwind
order: 8
level: Intermediate
mustKnow: false
askedFrequency: sometimes
summary:
  - "Mantine has three colour scheme values: light, dark and auto (follow the operating system)."
  - "Set the starting value with <MantineProvider defaultColorScheme=\"auto\">. The user's choice is saved in localStorage."
  - "Toggle it with the useMantineColorScheme() hook: toggleColorScheme(), setColorScheme('dark')."
  - "Mantine sets data-mantine-color-scheme on <html>, so your CSS can use light-dark(white, black) (with postcss-preset-mantine) or @mixin dark."
  - ColorSchemeScript in the HTML head stops a white flash before React loads (important for server rendering like Next.js).
cards:
  - q: What colour scheme values does Mantine support?
    a: "'light', 'dark' and 'auto'. auto follows the user's operating system setting (prefers-color-scheme)."
  - q: How do you add a dark mode toggle in Mantine?
    a: "const { toggleColorScheme } = useMantineColorScheme(); then <ActionIcon onClick={toggleColorScheme}>. The choice is saved in localStorage automatically."
  - q: Why use useComputedColorScheme?
    a: When the scheme is 'auto', useMantineColorScheme returns 'auto'. useComputedColorScheme('light') returns the real result, 'light' or 'dark'.
  - q: How do you write a dark-mode colour in your own CSS?
    a: "With postcss-preset-mantine: background: light-dark(white, var(--mantine-color-dark-6)); — it becomes a rule for [data-mantine-color-scheme='dark']."
  - q: What is ColorSchemeScript for?
    a: It runs before React loads and sets the colour scheme attribute on <html>, so a dark-mode user doesn't see a white flash first. It matters most with server rendering.
---

## 💡 What is it?

**Dark mode** means light text on a dark background. Mantine supports it for all components with almost no work.

Mantine has three **colour scheme** values:
- `light`
- `dark`
- `auto`, which follows the user's phone or computer setting

You set the starting value on `MantineProvider`. You switch it with the `useMantineColorScheme` [hook](glossary:hook). Mantine **remembers the user's choice** in the browser.

## 🏠 Real-life example

Think of **a room with a light switch and a sensor**.

- **The switch set to ON or OFF** = `light` or `dark`.
- **The sensor that turns lights on when it gets dark outside** = `auto`, which follows the system setting.
- **The switch staying where you left it, even the next day** = the choice saved in localStorage.
- **The sign on the door that says "lights off"** = the `data-mantine-color-scheme="dark"` attribute on `<html>`, which all the CSS reads.
- **Switching the lights before guests enter, so they never see the wrong state** = `ColorSchemeScript`, which runs before the page shows.

## 🧑‍💻 Code example

Use the setup from [Mantine setup](topic:mantine-tailwind/mantine-setup) (with `postcss-preset-mantine` installed). In **`src/main.jsx`**, change the provider line:

```jsx
<MantineProvider defaultColorScheme="auto">                   {/* start with the OS setting; user choice is remembered */}
  <App />                                                     {/* the app */}
</MantineProvider>                                            // end of the provider
```

**`src/Card.module.css`**:

```css
.card {                                                       /* our own card class */
  background: light-dark(var(--mantine-color-white), var(--mantine-color-dark-6)); /* white in light, dark grey in dark */
  border: 1px solid light-dark(var(--mantine-color-gray-3), var(--mantine-color-dark-4)); /* border per scheme */
  padding: var(--mantine-spacing-md);                         /* 16px padding from the theme */
  border-radius: var(--mantine-radius-md);                    /* 8px corners */
}                                                             /* end of .card */
```

**`src/App.jsx`**:

```jsx
import { ActionIcon, Group, Text, useComputedColorScheme, useMantineColorScheme } from '@mantine/core'; // parts + hooks
import classes from './Card.module.css';                                // our dark-aware card style

export default function App() {                                          // our main component
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();    // the saved setting + toggle function
  const computed = useComputedColorScheme('light');                      // the real result: 'light' or 'dark'

  return (                                                               // what the screen shows
    <Group p="xl" align="flex-start">                                    {/* a row with 32px padding */}
      <div className={classes.card}>                                     {/* our card, colours change with the scheme */}
        <Text>Setting: {colorScheme}</Text>                              {/* 'light', 'dark' or 'auto' */}
        <Text c="dimmed">Showing: {computed}</Text>                      {/* what is really used now */}
      </div>                                                             {/* end of the card */}
      <ActionIcon                                                        // a square icon button
        variant="default"                                                // a neutral bordered style
        size="lg"                                                        // a bigger button
        onClick={toggleColorScheme}                                      // light ↔ dark on click
        aria-label="Toggle colour scheme"                                // name for screen readers
      >                                                                  {/* end of ActionIcon props */}
        {computed === 'dark' ? '☀️' : '🌙'}                              {/* show sun in dark mode, moon in light */}
      </ActionIcon>                                                      {/* end of the button */}
    </Group>                                                             // end of the row
  );                                                                     // end of what App returns
}                                                                        // end of App
```

Run `npm run dev`.

```text
If your computer is in light mode: a white card says "Setting: auto / Showing: light", with a 🌙 button.
Click 🌙: the page, card and text turn dark; it now says "Setting: dark / Showing: dark", and the button shows ☀️.
Reload the page: it stays dark (the choice was saved in localStorage).
```

## 🔍 Deeper version

**How it works.** `MantineProvider` sets `data-mantine-color-scheme="light"` or `"dark"` on `<html>`. Mantine's component CSS has rules for both values. So switching the scheme just changes one attribute, and the CSS does the rest. Nothing re-renders.

**The two hooks:**

| Hook | Returns | Use it for |
|---|---|---|
| `useMantineColorScheme()` | `colorScheme` ('light' / 'dark' / 'auto'), `setColorScheme`, `toggleColorScheme`, `clearColorScheme` | reading and changing the **setting** |
| `useComputedColorScheme('light')` | 'light' or 'dark' | knowing what is **really shown** (resolves 'auto') |

**Saving the choice.** By default, Mantine uses `localStorageColorSchemeManager`, which saves under the key `mantine-color-scheme-value`. You can pass your own `colorSchemeManager`, for example to save it in a cookie or in the user's profile.

**Provider options:**
- `defaultColorScheme` — used when nothing is saved yet (default `'light'`).
- `forceColorScheme="dark"` — always dark, ignoring the user's choice and saved value.

**Writing dark-aware CSS** (with `postcss-preset-mantine`):
- `light-dark(A, B)` — this is Mantine's PostCSS function. It compiles to two rules: `A` normally, and `B` under `[data-mantine-color-scheme='dark']`. It is **not** the browser's native `light-dark()`, which reads the CSS `color-scheme` property.
- `@mixin dark { … }` and `@mixin light { … }` — blocks of rules for one scheme.

You can also hide elements per scheme with the `lightHidden` and `darkHidden` props.

**Avoiding the white flash.** In a single-page app, there can be a short moment before React runs where the page shows light colours. `ColorSchemeScript` puts a tiny inline script in `<head>` that sets the attribute immediately. With server rendering (Next.js), also spread `mantineHtmlProps` on `<html>`, which adds `suppressHydrationWarning` and a starting attribute.

:::version[Version note]
- **Mantine 6** used a `ColorSchemeProvider` and a `colorScheme` prop on the theme, controlled by your own state.
- **Mantine 7+** replaced that with `defaultColorScheme`, the `useMantineColorScheme` hook, built-in localStorage saving and the `data-mantine-color-scheme` attribute.
- These APIs are the same in Mantine 7, 8 and 9.
:::

## 🎯 Why do we use it?

- **User comfort.** Many people prefer dark screens, especially at night.
- **Following the system.** `auto` respects the user's phone or OS setting.
- **Almost no work.** All Mantine components already support both schemes.
- **No re-render cost.** One attribute change switches all colours through CSS.

## ⚠️ Common mistakes

- **Showing `colorScheme` and expecting 'light' or 'dark'.** It can be `'auto'`. Use `useComputedColorScheme` for the real value.
- **Hard-coded colours in your own CSS** (`background: white`). These don't change in dark mode. Use `light-dark()` or theme variables.
- **Forgetting `postcss-preset-mantine`.** Then `light-dark()` and `@mixin dark` don't compile.
- **No `ColorSchemeScript` with server rendering.** Dark-mode users see a white flash.

## 🗣️ How to answer in an interview

> "Mantine supports light, dark and auto colour schemes. I set the starting value with `defaultColorScheme` on `MantineProvider`, and toggle it with `useMantineColorScheme`, which also saves the choice in localStorage. Under the hood, Mantine sets a `data-mantine-color-scheme` attribute on the html element, and all component CSS reacts to it, so switching doesn't re-render React. For my own CSS, I use `light-dark()` or `@mixin dark` from `postcss-preset-mantine`. When the scheme is `auto`, I use `useComputedColorScheme` to know what's actually shown. And with server rendering, I add `ColorSchemeScript` to avoid a white flash."

[FILL IN: whether the SkillKeepr portals support dark mode, and anything you built for it.]

## 🔁 Follow-up questions

### How do you save the user's choice in their profile instead of localStorage?

Write a custom `colorSchemeManager` with `get`, `set`, `subscribe`, `unsubscribe` and `clear` functions, and pass it to `MantineProvider`. Its `set` can call your API.

### Is Mantine's `light-dark()` the same as the CSS `light-dark()` function?

No. Mantine's comes from `postcss-preset-mantine` and compiles to a `[data-mantine-color-scheme='dark']` rule. The native CSS function picks a colour from the element's `color-scheme` property.

### How do you make one page always dark?

Wrap that part in another `MantineProvider` with `forceColorScheme="dark"`, or set `forceColorScheme` on the main provider if the whole app must be dark.

### Why does a server-rendered page sometimes flash white?

The HTML arrives before the script that reads the saved scheme. `ColorSchemeScript` in the `<head>` runs first and sets the right attribute.

## ✅ Quick check

### 1. The scheme is `'auto'` and the user's OS is dark. What do `colorScheme` and `useComputedColorScheme('light')` return?

:::answer
`colorScheme` is **'auto'** (the setting). `useComputedColorScheme` returns **'dark'** (what is really shown).
:::

### 2. Which attribute does Mantine set on `<html>` for dark mode?

- A) `class="dark"`
- B) `data-mantine-color-scheme="dark"`
- C) `data-theme="dark"`

:::answer
**B.** All Mantine CSS and `@mixin dark` rules read `data-mantine-color-scheme`.
:::

### 3. A card has `background: white;` in your CSS module. What happens in dark mode?

:::answer
It **stays white**, because hard-coded colours don't change. Use `light-dark(var(--mantine-color-white), var(--mantine-color-dark-6))` or theme variables.
:::
