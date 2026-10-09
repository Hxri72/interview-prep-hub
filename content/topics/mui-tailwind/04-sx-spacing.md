---
title: The sx prop and the spacing scale (1 unit = 8px)
stack: mui-tailwind
order: 4
level: Basic
mustKnow: true
askedFrequency: very common
summary:
  - The sx prop lets you add one-off styles to any MUI component, using theme values.
  - "Spacing shortcuts: p = padding, m = margin, t/b/l/r = top/bottom/left/right, x = left+right, y = top+bottom."
  - "One spacing unit = 8px by default, so p: 2 = 16px and mt: 3 = 24px."
  - "Colours can use theme names, like color: 'primary.main' or bgcolor: 'grey.100'."
  - "Any value can be responsive: p: { xs: 2, md: 4 } = 16px on phones, 32px from 900px."
cards:
  - q: What is the sx prop?
    a: A prop on every MUI component for one-off styles. It understands theme values like spacing units, palette colours and breakpoints.
  - q: "What does sx={{ px: 3 }} mean?"
    a: "Padding left and right of 3 spacing units. With the default 8px unit, that is 24px on each side."
  - q: "What does p: { xs: 1, md: 3 } mean?"
    a: "Padding of 8px from 0px wide (phones), and 24px from 900px wide (md) and up."
  - q: "How do you use a theme colour in sx?"
    a: "Write the palette path as a string, like color: 'primary.main', bgcolor: 'error.light' or borderColor: 'divider'."
  - q: When would you NOT use sx?
    a: When the same style repeats in many places. Then make a styled component or change the theme instead.
---

## 💡 What is it?

`sx` is a [prop](glossary:props) on every MUI component. You use it to add **one-off styles**.

It is like a `style` prop, but smarter. It understands the **theme**: its spacing, colours and screen sizes.

The most important rule: **one spacing unit = 8px**. So `p: 2` means padding 16px.

## 🏠 Real-life example

Think of measuring with **tiles on a floor**.

Instead of measuring in centimetres, your school measures in **tiles**. "Put the desk 2 tiles from the wall." Everybody uses the same tile size, so everything lines up.

- **One tile** = one spacing unit (8px).
- **"2 tiles from the wall"** = `m: 2` (margin 16px).
- **The tile size decided by the school** = the theme's spacing setting.
- **A note stuck on one desk** = the `sx` prop on one component.

## 🧑‍💻 Code example

Set up: `npm create vite@latest` (React), then `npm install @mui/material @emotion/react @emotion/styled`. Paste into `src/App.jsx`.

```jsx
import Box from '@mui/material/Box';                           // a plain div that understands sx
import Typography from '@mui/material/Typography';             // themed text

export default function App() {                                 // our main component
  return (                                                      // what the screen shows
    <Box                                                        // the card
      sx={{                                                     // one-off styles that use theme values
        p: { xs: 2, md: 4 },                                    // padding 16px on phones, 32px from 900px (md)
        mx: 'auto',                                             // margin left+right auto → card is centred
        mt: 3,                                                  // margin-top 3 units = 24px
        maxWidth: 400,                                          // a plain number here = 400px
        bgcolor: 'grey.100',                                    // very light grey from the theme palette
        border: 1,                                              // 1 = a 1px solid border
        borderColor: 'primary.main',                            // the theme's main blue
        borderRadius: 2,                                        // 2 × the theme's shape radius (4px) = 8px
        '&:hover': { boxShadow: 3 },                            // on hover: shadow level 3 from the theme
      }}                                                        // end of the sx object
    >                                                           {/* end of Box's opening tag */}
      <Typography sx={{ color: 'text.secondary', mb: 1 }}>      {/* grey text; margin-bottom 1 unit = 8px */}
        Candidate                                               {/* small label */}
      </Typography>                                             {/* end of the label */}
      <Typography variant="h6">Asha R.</Typography>             {/* h6 = a small heading */}
    </Box>                                                      // end of the card
  );                                                            // end of what App returns
}                                                               // end of App
```

```text
A light-grey card with a blue border and rounded corners, centred, 24px from the top.
It has more padding on a wide window (32px) than on a narrow one (16px).
Hovering over it adds a soft shadow.
```

## 🔍 Deeper version

**Spacing shortcuts:**

| Key | Means | Example | Result (8px unit) |
|---|---|---|---|
| `p` | padding (all sides) | `p: 2` | 16px |
| `pt`, `pb`, `pl`, `pr` | padding top / bottom / left / right | `pt: 1` | 8px top |
| `px` | padding left + right | `px: 3` | 24px each side |
| `py` | padding top + bottom | `py: 0.5` | 4px top and bottom |
| `m`, `mt`, `mb`, `ml`, `mr`, `mx`, `my` | the same, for margin | `mx: 'auto'` | centres a block |
| `gap` | gap in flex or grid | `gap: 2` | 16px |

**How values are read:**
- **Spacing keys** (`p`, `m`, `gap`): a number is multiplied by the spacing unit. `p: 2` → `theme.spacing(2)` → `16px`.
- **Size keys** (`width`, `maxWidth`, `height`): a number between 0 and 1 is a percentage (`width: 0.5` = 50%). A bigger number is pixels (`maxWidth: 400` = 400px).
- **Colours** (`color`, `bgcolor`, `borderColor`): a string path into the palette, like `'primary.main'` or `'text.secondary'`.
- **`borderRadius`**: a number is multiplied by `theme.shape.borderRadius` (4px by default).
- **`boxShadow`**: a number 0–24 picks a shadow level from the theme.
- **Strings stay strings**: `p: '10px'` is exactly 10px.

**Responsive values** use the breakpoint keys: `xs` 0px, `sm` 600px, `md` 900px, `lg` 1200px, `xl` 1536px. Each key means "this size **and up**". `{ xs: 2, md: 4 }` = 16px until 899px, then 32px.

**Nested selectors** work: `'&:hover'`, `'& .MuiButton-root'`, `'&.Mui-disabled'`.

**Performance note.** `sx` is processed at runtime by Emotion on each render. For a few elements this is fine. For long lists (thousands of rows), a `styled()` component or plain CSS class is faster, because the style is created once.

## 🎯 Why do we use it?

- **Consistent spacing.** Everyone uses units of 8px, so things line up.
- **Theme-aware.** Change the theme, and every `sx` value that uses it updates.
- **Responsive in one line**, without writing media queries.
- **Quick.** No separate CSS file for small tweaks.

## ⚠️ Common mistakes

- **Thinking `p: 2` means 2px.** It means 2 units = **16px**.
- **Writing `p: 16`** expecting 16px. That is 16 × 8 = **128px**. Use `p: 2` or `p: '16px'`.
- **Thinking `md` means "only tablets".** It means **900px and wider**.
- **Copy-pasting the same big `sx` object everywhere.** Move it into a `styled` component or the theme.

## 🗣️ How to answer in an interview

> "The `sx` prop is MUI's way to add one-off styles that understand the theme. Spacing keys like `p`, `m`, `px`, `mt` multiply by the spacing unit, which is 8px by default — so `p: 2` is 16px and `mt: 3` is 24px. Colours can be theme paths like `'primary.main'` or `'text.secondary'`.
>
> Any value can be responsive with breakpoint keys: `p: { xs: 2, md: 4 }` gives 16px on phones and 32px from 900px up, because each key means 'this size and up'.
>
> I use `sx` for small tweaks. If the same style repeats, I move it into a styled component or the theme, which is cleaner and faster for long lists."

[FILL IN: confirm the UI library used at SkillKeepr, and whether your team used sx or styled more.]

## 🔁 Follow-up questions

### How do you change the spacing unit for the whole app?

In the theme: `createTheme({ spacing: 4 })` makes one unit 4px. Every `p: 2` becomes 8px.

### What is the difference between `sx` and `style`?

`style` is plain inline CSS: no theme, no hover, no media queries. `sx` understands theme values, pseudo-classes like `:hover`, and responsive objects.

### `sx` vs `styled()` — when to use which?

`sx` for one-off tweaks on one element. `styled()` for a reusable component with the same look in many places.

### Can `sx` take a function?

Yes. `sx={(theme) => ({ color: theme.palette.primary.main })}` gives you the full theme object for complex cases.

## ✅ Quick check

### 1. With the default theme, what is `sx={{ mt: 3, px: 1.5 }}`?

:::answer
margin-top **24px** (3 × 8) and padding left and right **12px** each (1.5 × 8).
:::

### 2. What does `p: { xs: 1, lg: 3 }` give on an 1000px-wide screen?

:::answer
**8px.** `lg` starts at 1200px. At 1000px only `xs` (1 × 8px) applies.
:::

### 3. A developer wrote `sx={{ p: 16 }}` and the box is huge. Why?

:::answer
`16` is in units, not pixels: 16 × 8 = **128px**. They wanted `p: 2` (16px).
:::
