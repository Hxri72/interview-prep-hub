---
title: "MUI layout: Box, Stack, Container"
stack: mui-tailwind
order: 3
level: Basic
mustKnow: false
askedFrequency: common
summary:
  - Box is a plain div that understands the sx prop — use it for any custom box.
  - Stack lines children up in a column (default) or a row, with an equal gap between them.
  - Container centres your page content and limits its width (maxWidth="lg" = 1200px).
  - Use Stack for one-direction lists, Grid for rows and columns together.
  - All three use the theme's spacing — 1 unit = 8px.
cards:
  - q: What is Box in MUI?
    a: A generic wrapper — by default a div — that accepts the sx prop, so you can style it with theme values.
  - q: What does Stack do?
    a: "It places its children in a column or row with equal space between them. spacing={2} = 16px gap."
  - q: How do you make a Stack horizontal?
    a: "direction=\"row\". You can make it responsive: direction={{ xs: 'column', sm: 'row' }}."
  - q: What does Container do?
    a: It centres the content and sets a maximum width, plus side padding. maxWidth="md" means at most 900px.
  - q: Stack or Grid?
    a: Stack for items in one line (a row or a column). Grid for a layout with rows and columns at the same time.
---

## 💡 What is it?

MUI has three small **layout** [components](glossary:component). They help you place things on the page.

- **Box** — a plain box (a `div`). You style it with the `sx` prop.
- **Stack** — puts items one after another, in a column or a row, with equal gaps.
- **Container** — keeps the page content in the middle, with a maximum width.

## 🏠 Real-life example

Think of **arranging a classroom**.

- The **classroom walls** = `Container`. They decide how wide the room is and keep everything inside.
- A **row of desks with equal space between them** = `Stack`. Each desk is a child.
- **Any single desk or cupboard** you decorate your own way = `Box`.

The mapping is simple: Container is the room, Stack is the line of desks, Box is one desk.

## 🧑‍💻 Code example

Set up: `npm create vite@latest` (React), then `npm install @mui/material @emotion/react @emotion/styled`. Paste into `src/App.jsx`.

```jsx
import Container from '@mui/material/Container';             // centres content with a max width
import Stack from '@mui/material/Stack';                     // lines children up with equal gaps
import Box from '@mui/material/Box';                         // a plain div that understands sx
import Button from '@mui/material/Button';                   // a ready-made button

export default function App() {                               // our main component
  return (                                                    // what the screen shows
    <Container maxWidth="sm" sx={{ py: 4 }}>                  {/* at most 600px wide; padding top/bottom 4 units = 32px */}
      <Box sx={{ p: 2, border: 1, borderColor: 'divider', borderRadius: 2 }}> {/* padding 16px; 1px border; theme's light grey; rounded 2 × 4px = 8px */}
        <Stack                                                // the toolbar
          direction={{ xs: 'column', sm: 'row' }}             // column on phones (0px+), row from 600px
          spacing={2}                                         // 2 units = 16px between buttons
          sx={{ justifyContent: 'space-between' }}            // in a row: first item left, last item right
        >                                                     {/* end of Stack's opening tag */}
          <Button variant="outlined">Filter</Button>          {/* first child */}
          <Button variant="contained">Add job</Button>        {/* second child */}
        </Stack>                                              {/* end of the toolbar */}
      </Box>                                                  {/* end of the bordered box */}
    </Container>                                              // end of the page container
  );                                                          // end of what App returns
}                                                             // end of App
```

```text
On a laptop: a bordered box in the middle of the page (max 600px wide),
with "FILTER" on the left and "ADD JOB" on the right.
On a phone-width window: the two buttons stack on top of each other, 16px apart.
```

## 🔍 Deeper version

**Box.** It renders a `div` by default. You can change the tag with `component`: `<Box component="section">`. It accepts all the [sx shortcuts](topic:mui-tailwind/sx-spacing), so it replaces most one-off styled divs.

**Stack.** It is a flexbox column by default.

| Prop | What it does | Example |
|---|---|---|
| `direction` | `column` (default), `row`, or responsive | `{ xs: 'column', md: 'row' }` |
| `spacing` | Gap between children, in theme units | `2` = 16px |
| `divider` | An element shown between children | `<Divider flexItem />` |
| `useFlexGap` | Uses CSS `gap` instead of margins (better with wrapping) | `useFlexGap` |

Older MUI versions added the gap with margins on children. With `flexWrap: 'wrap'`, that gave odd spacing on wrapped lines. `useFlexGap` uses the real CSS `gap` property and fixes this.

**Container.**

| `maxWidth` | Max width (default theme) |
|---|---|
| `xs` | 444px |
| `sm` | 600px |
| `md` | 900px |
| `lg` (default) | 1200px |
| `xl` | 1536px |
| `false` | No limit |

It also adds side padding (16px on phones, 24px from 600px), so content never touches the screen edge.

**When to use what:**

| Need | Use |
|---|---|
| A styled wrapper | `Box` |
| Items in one line, equal gaps | `Stack` |
| Rows and columns (card gallery, dashboard) | [`Grid`](topic:mui-tailwind/mui-grid) |
| Centre the whole page with a max width | `Container` |

## 🎯 Why do we use it?

- **Less custom CSS.** Most layouts need only these three components.
- **Theme spacing everywhere.** Gaps and padding follow one scale, so screens look consistent.
- **Responsive in one prop.** `direction={{ xs: 'column', sm: 'row' }}` replaces a media query.

## ⚠️ Common mistakes

- **Adding margins to every child** instead of using Stack's `spacing`.
- **Using Grid for a simple row of buttons.** Stack is simpler.
- **Nesting many Containers.** Use one per page; inside, use Box and Stack.
- **Forgetting `useFlexGap` when the Stack wraps**, which gives uneven spacing.

## 🗣️ How to answer in an interview

> "For layout in MUI I mainly use three components. Container centres the page and limits its width — `maxWidth='lg'` is 1200px. Stack lines children up in a column or a row with equal gaps; `spacing={2}` is 16px because one MUI unit is 8px, and `direction` can be responsive, like column on phones and row from the `sm` breakpoint. Box is a plain div that takes the `sx` prop for one-off styles.
>
> I use Stack when items go in one direction, and Grid when I need rows and columns together, like a card gallery."

[FILL IN: a layout you built with these at SkillKeepr — confirm the UI library used at SkillKeepr first.]

## 🔁 Follow-up questions

### How do you make Box render a different HTML tag?

Use the `component` prop: `<Box component="nav">` renders a `nav` element. This helps with semantic HTML.

### How do you put a line between Stack items?

Pass `divider={<Divider flexItem />}`. Stack inserts it between each pair of children.

### Why does `spacing` sometimes look wrong when items wrap?

By default Stack uses margins for the gap. Add `useFlexGap` so it uses the CSS `gap` property, which handles wrapping correctly.

### Is Stack just flexbox?

Yes. It is a flexbox container with `flex-direction` and gap handled for you, using theme spacing.

## ✅ Quick check

### 1. How wide can `<Container maxWidth="md">` get with the default theme?

:::answer
**900px.** `md` = 900px in MUI's default breakpoints.
:::

### 2. What does `direction={{ xs: 'column', sm: 'row' }}` do?

:::answer
Column on screens from 0px, and a row from **600px** (`sm`) and wider. Phones see a stack; tablets and laptops see a row.
:::

### 3. You need a dashboard with 3 cards per row on laptops and 1 on phones. Stack or Grid?

:::answer
**Grid.** You need rows and columns at the same time. Stack is for one direction.
:::
