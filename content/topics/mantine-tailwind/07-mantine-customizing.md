---
title: "Customising Mantine components (Styles API, classNames, CSS modules)"
stack: mantine-tailwind
order: 7
level: Intermediate
mustKnow: false
askedFrequency: common
summary:
  - "Every Mantine component is made of named inner parts (selectors). Button has root, inner, section, label and loader."
  - "classNames={{ root: classes.root, label: classes.label }} adds your own CSS-module classes to those parts; styles={{ root: {...} }} adds inline styles."
  - "Mantine puts data attributes on elements (data-variant, data-disabled, data-size), so your CSS can style states without extra props."
  - "For app-wide changes, put classNames or styles in theme.components with Component.extend()."
  - "createStyles and the sx prop are no longer in the core since v7; they live in the optional @mantine/emotion package for older code."
cards:
  - q: What is Mantine's Styles API?
    a: A way to style a component's inner parts by name (selectors like root, label, input) using the classNames, styles and vars props, or theme.components.
  - q: What is the difference between classNames and styles in Mantine?
    a: classNames attaches CSS classes (usually from a CSS module) to inner parts. styles adds inline style objects to them. classNames is preferred for performance and hover/media rules.
  - q: How do you style a disabled Mantine Button with CSS?
    a: "Use its data attribute: .root[data-disabled] { opacity: 0.4; }. Mantine sets data-disabled, data-variant and data-size for you."
  - q: Where did createStyles and sx go in Mantine 7?
    a: They were removed from @mantine/core. You can keep using them through the @mantine/emotion package, which adds emotion back as an optional layer.
  - q: How do you change one component's look across the whole app?
    a: "In the theme: components: { Button: Button.extend({ classNames: classes }) } — every Button then gets those classes."
---

## 💡 What is it?

Mantine components look good by default, but you often need **your own look**. Mantine gives you several ways to change them:

1. **Style props** for quick tweaks, like `p="md"`. See [Style props](topic:mantine-tailwind/style-props-spacing).
2. **`className`** for the outer element.
3. **The Styles API** for the **inner parts**: the `classNames`, `styles` and `vars` props.
4. **Theme overrides** to change a component everywhere.

The usual way is **CSS modules**: a `.module.css` file whose class names are made unique, so they never clash.

## 🏠 Real-life example

Think of **decorating a ready-made cupboard**.

The cupboard comes with named parts: the frame, the doors, the handles and the shelves. You don't rebuild it. You just say "paint the **doors** blue, make the **handles** gold".

- **The cupboard** = a Mantine component, like `Button`.
- **Its named parts** = selectors: `root`, `inner`, `label`, `section`.
- **"Paint the doors blue"** = `classNames={{ root: classes.root }}`.
- **Stickers on the parts that say "locked" or "open"** = data attributes like `data-disabled`, which your CSS can read.
- **The shop painting every cupboard the same before delivery** = a theme override with `Button.extend`.

## 🧑‍💻 Code example

Use the setup from [Mantine setup](topic:mantine-tailwind/mantine-setup). Create **`src/GradientButton.module.css`**:

```css
.root {                                                     /* the outer <button> element */
  background: linear-gradient(90deg, var(--mantine-color-blue-6), var(--mantine-color-cyan-5)); /* blue → cyan */
  border: 0;                                                /* no border */
  transition: transform 150ms ease;                         /* smooth movement on hover */
}                                                           /* end of .root */
.root:hover {                                               /* when the mouse is over it */
  transform: translateY(-2px);                              /* lift it 2px up */
}                                                           /* end of hover */
.root[data-disabled] {                                      /* Mantine sets data-disabled when disabled */
  background: var(--mantine-color-gray-3);                  /* grey instead of the gradient */
  transform: none;                                          /* no lift when disabled */
}                                                           /* end of disabled */
.label {                                                    /* the inner part that holds the text */
  letter-spacing: 0.05em;                                   /* a little space between letters */
  text-transform: uppercase;                                /* CAPITAL LETTERS */
}                                                           /* end of .label */
```

**`src/App.jsx`**:

```jsx
import { Button, Group, TextInput } from '@mantine/core';          // components we customise
import classes from './GradientButton.module.css';                 // our CSS module (unique class names)

export default function App() {                                     // our main component
  return (                                                          // what the screen shows
    <Group p="xl" align="flex-end">                                 {/* a row, 32px padding, items aligned at the bottom */}
      <TextInput                                                    // a text input
        label="Search"                                              // its label
        styles={{ input: { borderColor: 'var(--mantine-color-blue-4)' } }} // inline style on the inner <input> only
      />                                                            {/* end of the input */}
      <Button classNames={{ root: classes.root, label: classes.label }}> {/* our classes on two inner parts */}
        Apply                                                       {/* button text */}
      </Button>                                                     {/* end of the active button */}
      <Button classNames={classes} disabled>                        {/* same classes (object keys match part names) */}
        Disabled                                                    {/* button text */}
      </Button>                                                     {/* end of the disabled button */}
    </Group>                                                        // end of the row
  );                                                                // end of what App returns
}                                                                   // end of App
```

Run `npm run dev`.

```text
A "Search" input with a light-blue border.
An "APPLY" button with a blue-to-cyan gradient, uppercase spaced text.
  It lifts 2px when you hover over it.
A grey "DISABLED" button that doesn't move on hover.
```

## 🔍 Deeper version

**Selectors (inner parts).** Each component lists its parts in the docs and in its TypeScript types. For example, `Button` has `root | inner | loader | section | label`, and `TextInput` has `root | wrapper | input | label | description | error | section` (plus a few more in v9). The Styles API props take an object keyed by these names.

| Way | Best for | Notes |
|---|---|---|
| Style props (`p`, `bg`) | quick spacing/colour tweaks | inline styles |
| `className` | the outer element | can't reach inner parts |
| `classNames={{ part: cls }}` | real customisation | supports `:hover`, media queries, data attributes |
| `styles={{ part: {...} }}` | small one-off inline styles | no hover or media queries |
| `vars` | changing the component's own CSS variables | e.g. Button's height or padding variables |
| `theme.components` | the same look everywhere | `Button.extend({ classNames, styles, defaultProps })` |
| `unstyled` | build your own look from scratch | removes Mantine's styles from that component |

**Data attributes.** Mantine adds `data-variant`, `data-size`, `data-disabled`, `data-loading` and others to elements. So `.root[data-variant='light']` styles only light buttons. You don't need extra props.

**Static class names.** Every part also gets a stable global class, like `.mantine-Button-root`. They're handy in quick global CSS, but CSS modules are safer in big apps because they can't clash.

**Using emotion (`sx`, `createStyles`) in Mantine 7+.** Mantine 7 removed emotion from the core. Code written for Mantine 6 can keep working by installing `@mantine/emotion`, wrapping the app in `MantineEmotionProvider`, and passing `stylesTransform={emotionTransform}` to `MantineProvider`. Then `sx` and `createStyles` work again. This is a migration path. New code should use CSS modules, because emotion adds runtime cost on every render.

:::version[Version note]
- **Mantine 6 → 7** was the big styling change. emotion was removed from the core, styles moved to CSS files and CSS variables, `createStyles` and `sx` moved to the optional `@mantine/emotion` package, and `classNames` with CSS modules became the main way to customise.
- **SkillKeepr** kept its existing `sx`/`createStyles` code working after upgrading to v7 by adding `@mantine/emotion`. That's a common, practical choice for a large codebase.
- `@mantine/emotion` is still published for Mantine 9 (9.7 in October 2026).
:::

## 🎯 Why do we use it?

- **Brand look without fighting the library.** You change named parts instead of overriding random internal CSS.
- **States for free.** Data attributes give you disabled, loading and variant styling in plain CSS.
- **Performance.** CSS modules are static CSS, so there's no styling work at runtime.
- **One place for global changes** through theme overrides.

## ⚠️ Common mistakes

- **Using `className` to style an inner part.** It only reaches the root. Use `classNames={{ label: … }}`.
- **Using the `styles` prop for hover or media queries.** Inline styles can't do those. Use a CSS module with `classNames`.
- **Overriding `.mantine-Button-root` in a global file for one screen.** It changes every button. Use a CSS module on that one component.
- **Writing new code with `createStyles`.** It's the legacy path. Prefer CSS modules.

## 🗣️ How to answer in an interview

> "Mantine components are made of named parts, like Button's root and label. The Styles API lets me target those parts with `classNames`, `styles` or `vars`. My default is CSS modules with `classNames`, because they support hover, media queries and Mantine's data attributes like `data-disabled` and `data-variant`, with no runtime cost. For app-wide changes, I put classNames or default props in `theme.components` using `Button.extend`. Since Mantine 7, emotion isn't in the core. At SkillKeepr we upgraded to v7 and kept our existing `sx` and `createStyles` code working through the `@mantine/emotion` package, which is a sensible migration path for a large codebase."

[FILL IN: a component you customised at SkillKeepr, e.g. a themed table or uploader.]

## 🔁 Follow-up questions

### How do you know a component's selector names?

From the component's "Styles API" section in the Mantine docs, or the TypeScript type, such as `ButtonStylesNames`.

### classNames vs styles — which is faster?

`classNames` with CSS modules. The CSS is static and cached by the browser. `styles` creates inline style objects on every render, and it can't do hover or media queries.

### How do you migrate a big app from Mantine 6 to 7 without rewriting every `sx`?

Install `@mantine/emotion`, add `MantineEmotionProvider`, and pass `stylesTransform={emotionTransform}` to `MantineProvider`. The old `sx`/`createStyles` code keeps working. Then move components to CSS modules gradually.

### What does the `unstyled` prop do?

It removes Mantine's own styles from that component but keeps the behaviour, like keyboard handling and focus trapping. You then style it fully yourself.

## ✅ Quick check

### 1. You wrote `<TextInput className={classes.input} />`, but the border of the text box doesn't change. Why?

:::answer
`className` goes on the **root wrapper**, not the inner `<input>`. Use `classNames={{ input: classes.input }}`.
:::

### 2. Which CSS selects only disabled Mantine Buttons that use your module class `.root`?

- A) `.root:disabled-button`
- B) `.root[data-disabled]`
- C) `.root.disabled`

:::answer
**B.** Mantine sets the `data-disabled` attribute when the button is disabled.
:::

### 3. True or false: `createStyles` is exported from `@mantine/core` in Mantine 9.

:::answer
**False.** It was removed from the core in Mantine 7. It now comes from `@mantine/emotion`.
:::
