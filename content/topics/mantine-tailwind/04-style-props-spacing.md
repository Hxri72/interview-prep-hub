---
title: "Style props and the spacing scale (xs–xl)"
stack: mantine-tailwind
order: 4
level: Basic
mustKnow: true
askedFrequency: very common
summary:
  - "Style props are short props for common CSS on any Mantine component: p = padding, m = margin, mt = margin-top, bg = background, c = colour, w = width."
  - "Spacing keys map to sizes: xs = 10px, sm = 12px, md = 16px, lg = 20px, xl = 32px."
  - "A number is turned into rem: p={20} = 20px. A string that isn't a key is used as-is: p=\"5%\"."
  - "Responsive values use breakpoints: p={{ base: 'xs', md: 'lg' }} = 10px on phones, 20px from 992px wide."
  - Use style props for small one-off tweaks; use CSS modules or the theme for anything repeated.
cards:
  - q: What does p="md" mean in Mantine?
    a: Padding of the theme's md spacing, which is 16px by default (1rem).
  - q: What are Mantine's default spacing values?
    a: "xs = 10px, sm = 12px, md = 16px, lg = 20px, xl = 32px."
  - q: How do you give different padding on phones and laptops?
    a: "Pass an object: p={{ base: 'xs', md: 'xl' }}. base is for all sizes, md applies from 62em (992px) wide and up."
  - q: What is the difference between mt and my?
    a: "mt = margin-top only. my = margin on the y-axis, meaning top AND bottom (margin-block)."
  - q: When should you avoid style props?
    a: For styles repeated across many elements or long lists — responsive style props add a small style tag per element. Use CSS modules or theme overrides there.
---

## 💡 What is it?

**Style props** are short props that add common CSS to any Mantine [component](glossary:component). You don't write a CSS file.

For example, `p="md"` adds padding, `mt="xl"` adds space on top, and `bg="blue.1"` adds a light blue background.

Sizes like `md` and `xl` come from the **spacing scale** in the theme. So every gap in the app uses the same few sizes.

## 🏠 Real-life example

Think of **rulers with fixed marks in a drawing class**.

The teacher says: "Only use the marks xs, sm, md, lg and xl." Now every student's drawing has the same spacing, and the class work looks neat together.

- **The fixed marks on the ruler** = the spacing scale (`xs` = 10px … `xl` = 32px).
- **"Leave an md gap at the top"** = `mt="md"` (margin-top 16px).
- **Writing a size in your own numbers** = `p={20}`, which works but skips the shared marks.
- **"Small gap on a small page, big gap on a big poster"** = a responsive value: `p={{ base: 'xs', md: 'lg' }}`.

## 🧑‍💻 Code example

Use the setup from [Mantine setup](topic:mantine-tailwind/mantine-setup), then replace **`src/App.jsx`**:

```jsx
import { Box, Button, Text, Title } from '@mantine/core';             // components that accept style props

export default function App() {                                       // our main component
  return (                                                            // what the screen shows
    <Box                                                              // a plain div with style props
      maw={480}                                                       // max-width 480px
      mx="auto"                                                       // margin left + right auto → centred
      mt="xl"                                                         // margin-top 32px
      p={{ base: 'xs', md: 'xl' }}                                    // padding 10px on phones, 32px from 992px
      bg="blue.0"                                                     // background: lightest blue (shade 0 of 0–9)
      bd="1px solid blue.3"                                           // 1px solid border in a light blue
      bdrs="md"                                                       // border-radius 8px (theme radius md)
    >                                                                 {/* end of Box props */}
      <Title order={3} c="blue.9">Profile card</Title>                {/* <h3>, darkest blue text (shade 9) */}
      <Text mt="sm" c="dimmed" fz="sm">                               {/* 12px space above, grey text, 14px font */}
        Full stack developer                                          {/* the text */}
      </Text>                                                         {/* end of the text */}
      <Button mt="md" w={{ base: '100%', sm: 'auto' }}>               {/* 16px space above; full width on phones */}
        Contact                                                       {/* button text */}
      </Button>                                                       {/* end of the button */}
    </Box>                                                            // end of the card
  );                                                                  // end of what App returns
}                                                                     // end of App
```

Run `npm run dev` and resize the window.

```text
A light-blue card, max 480px wide, centred, 32px below the top.
375px wide: padding is small (10px) and the Contact button fills the card width.
1280px wide: padding grows to 32px and the button shrinks to fit its text.
```

What every value means:

| Prop | CSS it sets | Value here |
|---|---|---|
| `maw={480}` | `max-width` | 480px (number → rem) |
| `mx="auto"` | `margin-inline` | auto → centred |
| `mt="xl"` | `margin-top` | 32px |
| `p={{ base: 'xs', md: 'xl' }}` | `padding` | 10px, then 32px from 992px |
| `bg="blue.0"` | `background` | blue, shade 0 (lightest) |
| `bd="1px solid blue.3"` | `border` | 1px solid light blue |
| `bdrs="md"` | `border-radius` | 8px |
| `c="dimmed"` | `color` | Mantine's soft grey text colour |
| `fz="sm"` | `font-size` | 14px |

## 🔍 Deeper version

**The default scales** (from Mantine's default theme, 1rem = 16px):

| Key | Spacing (`p`, `m`, `gap`) | Font size (`fz`) | Radius (`bdrs`, `radius`) | Breakpoint |
|---|---|---|---|---|
| `xs` | 10px | 12px | 2px | 36em = 576px |
| `sm` | 12px | 14px | 4px | 48em = 768px |
| `md` | 16px | 16px | 8px | 62em = 992px |
| `lg` | 20px | 18px | 16px | 75em = 1200px |
| `xl` | 32px | 20px | 32px | 88em = 1408px |

**How a value is read** (the spacing resolver):
- A **theme key** (`'md'`) becomes `var(--mantine-spacing-md)`. A minus key (`'-md'`) becomes the negative of that.
- A **number** (`20`) becomes a rem value, `1.25rem`, which is 20px.
- **Any other string** (`'5%'`, `'2rem'`) is used as it is.

**The full set of style props**: margins (`m`, `mt`, `mb`, `ml`, `mr`, `mx`, `my`), paddings (`p`, `pt`, `pb`, `pl`, `pr`, `px`, `py`), colours (`c`, `bg`, `opacity`), text (`ff`, `fz`, `fw`, `lts`, `ta`, `lh`, `fs`, `tt`, `td`), size (`w`, `miw`, `maw`, `h`, `mih`, `mah`), border (`bd`, `bdrs`), position (`pos`, `top`, `left`, `bottom`, `right`, `inset`), and `display`, `flex`.

**Responsive values.** An object like `{ base: 'xs', md: 'xl' }` uses **min-width** media queries (mobile-first): `base` applies everywhere, and `md` applies from 992px up. The `base` value becomes an inline style. The breakpoint values go into a small `<style>` tag that Mantine adds next to the element. That's fine for a few elements. For hundreds of list rows, put the CSS in a CSS module instead.

**Hide or show by screen size** with `hiddenFrom="sm"` (hidden from 768px up) and `visibleFrom="sm"` (shown only from 768px up).

**Mantine vs Tailwind spacing.** Mantine uses five named steps (`xs`–`xl`). Tailwind uses a number scale where 1 unit = 4px (`p-4` = 16px). Both give you a shared, limited set of sizes. See [Mantine and Tailwind together](topic:mantine-tailwind/mantine-and-tailwind-together).

:::version[Version note]
Style props and the `xs`–`xl` scale work the same way in Mantine 7, 8 and 9. The default spacing and breakpoint values are also unchanged across these versions. SkillKeepr uses Mantine 7.
:::

## 🎯 Why do we use it?

- **Speed.** Small spacing and colour changes without opening a CSS file.
- **Consistency.** Named keys stop "13px here, 15px there" drift.
- **One place to change.** Change `spacing.md` in the theme, and every `p="md"` in the app updates.
- **Simple responsive tweaks** right in the JSX.

## ⚠️ Common mistakes

- **Mixing numbers and keys everywhere.** `p={14}` here and `p="sm"` there breaks the shared scale. Prefer keys.
- **Confusing `my` with margin-top.** `my` sets top **and** bottom. Use `mt` for top only.
- **Long style-prop lists on repeated elements.** Rows in a 500-item table each get their own styles. Use a CSS module or a theme override.
- **Thinking `md: ` means "only medium screens".** It means "992px and **wider**".

## 🗣️ How to answer in an interview

> "Style props are shorthand props on every Mantine component for common CSS — `p` for padding, `mt` for margin-top, `bg`, `c`, `w` and so on. Sizes like `md` come from the theme's spacing scale: xs is 10px, sm 12px, md 16px, lg 20px and xl 32px. A number is converted to rem, and other strings pass through. You can make them responsive with an object like `p={{ base: 'xs', md: 'xl' }}`, which works mobile-first with min-width breakpoints. I use them for small one-off tweaks, and move anything repeated into CSS modules or theme overrides, because responsive style props add a style tag per element."

[FILL IN: if you used style props or the spacing scale at SkillKeepr, add one example.]

## 🔁 Follow-up questions

### What does `mx="auto"` do?

It sets `margin-inline: auto`, so left and right margins are equal. With a `maw` (max-width), that centres the element.

### What does `p={20}` produce?

`padding: 1.25rem`, which is 20px when the root font size is 16px. Mantine converts numbers to rem so they scale with the user's font size.

### How do you hide something only on phones?

Use `visibleFrom="sm"`. The element is hidden below 768px and shown from 768px up. The opposite is `hiddenFrom="sm"`.

### Can you change the spacing scale?

Yes. In `createTheme({ spacing: { md: '1.25rem' } })`. Every `p="md"`, `gap="md"` and default gap then uses the new value. See [Mantine theming](topic:mantine-tailwind/mantine-theming).

## ✅ Quick check

### 1. What padding does `p="lg"` give with the default theme?

:::answer
**20px** (`1.25rem`).
:::

### 2. What does `p={{ base: 'sm', lg: 'xl' }}` give at 1000px and at 1300px wide?

:::answer
At **1000px**: 12px (`sm`), because `lg` starts at 75em = 1200px. At **1300px**: 32px (`xl`).
:::

### 3. Which prop sets margin-top only?

- A) `my`
- B) `mt`
- C) `m`

:::answer
**B) `mt`.** `my` sets top and bottom, and `m` sets all four sides.
:::
