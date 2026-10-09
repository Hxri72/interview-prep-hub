---
title: MUI Grid (v7 size prop vs older item xs)
stack: mui-tailwind
order: 6
level: Intermediate
mustKnow: false
askedFrequency: common
summary:
  - MUI Grid is a 12-column layout. Each item says how many of the 12 columns it takes.
  - "In MUI v7, items use the size prop: <Grid size={{ xs: 12, sm: 6, lg: 4 }}>."
  - "xs: 12 = full width on phones; sm: 6 = half from 600px; lg: 4 = one-third from 1200px."
  - "The parent needs container; spacing={2} = 16px gaps."
  - "Old code (v5) used <Grid item xs={12} sm={6}>. In v7 that old Grid is called GridLegacy."
cards:
  - q: How many columns does MUI Grid have?
    a: 12 by default. An item with size 6 takes half the row; size 4 takes one-third.
  - q: "What does size={{ xs: 12, md: 6 }} mean?"
    a: "Full width (12 of 12) from 0px, and half width (6 of 12) from 900px (md) and wider."
  - q: How is the v7 Grid different from the v5 Grid?
    a: "v7 uses size={{ … }} on items and has no item prop. The v5 style (item xs={12}) lives on as GridLegacy."
  - q: What does spacing={2} on the container do?
    a: "Adds a gap of 2 units (16px) between items, both across and down."
  - q: When should you use Grid instead of Stack?
    a: When you need rows and columns at the same time, like a card gallery or a dashboard.
---

## 💡 What is it?

**Grid** is MUI's layout for **rows and columns**.

Every row is split into **12 equal columns**. Each item says how many columns it wants. 12 is the full row, 6 is half, 4 is one-third, 3 is a quarter.

The number can change with the screen size. So one item can be full width on a phone and one-third on a laptop.

## 🏠 Real-life example

Think of a **chocolate bar with 12 pieces** in a row.

- **The whole bar** = one row of the grid (12 columns).
- **A friend who takes 6 pieces** = an item with `size={6}` (half the row).
- **Three friends who take 4 pieces each** = three items side by side, each one-third.
- **On a small plate (phone), each friend gets the whole bar** = `xs: 12`, so items stack.
- **The small gap between pieces** = `spacing`.

## 🧑‍💻 Code example

Set up: `npm create vite@latest` (React), then `npm install @mui/material @emotion/react @emotion/styled`. Paste into `src/App.jsx`. Resize the browser window to see it change.

```jsx
import Grid from '@mui/material/Grid';                        // the v7 Grid (12 columns, size prop)
import Paper from '@mui/material/Paper';                      // a white card with a soft shadow

const jobs = ['Node.js Dev', 'React Dev', 'QA Engineer', 'DevOps', 'Designer', 'PM']; // 6 sample job titles

export default function App() {                                // our main component
  return (                                                     // what the screen shows
    <Grid container spacing={2} sx={{ p: 2 }}>                 {/* container = the parent; gap 2 units = 16px; padding 16px */}
      {jobs.map((title) => (                                   // one grid item for each job
        <Grid key={title} size={{ xs: 12, sm: 6, lg: 4 }}>     {/* 12/12 on phones, 6/12 from 600px, 4/12 from 1200px */}
          <Paper sx={{ p: 2 }}>{title}</Paper>                 {/* the card, with 16px padding */}
        </Grid>                                                // end of one item
      ))}                                                      {/* end of the list */}
    </Grid>                                                    // end of the container
  );                                                           // end of what App returns
}                                                              // end of App
```

```text
Window under 600px:      1 card per row (6 rows).
Window 600px – 1199px:   2 cards per row (3 rows).
Window 1200px and wider: 3 cards per row (2 rows).
```

## 🔍 Deeper version

**The breakpoints** (MUI default):

| Key | Starts at | Typical device |
|---|---|---|
| `xs` | 0px | phones |
| `sm` | 600px | large phones, small tablets |
| `md` | 900px | tablets in landscape, small laptops |
| `lg` | 1200px | laptops |
| `xl` | 1536px | big monitors |

Each key means "**this size and up**", until a bigger key overrides it.

**Useful props:**

| Prop | Where | What it does |
|---|---|---|
| `container` | parent | Turns on the grid layout |
| `spacing` | parent | Gap between items (theme units). `rowSpacing` / `columnSpacing` for each direction |
| `columns` | parent | Change from 12 to another number, like `columns={16}` |
| `size` | item | Columns to take: a number, `"grow"` (fill the rest), `"auto"` (fit content), or a responsive object |
| `offset` | item | Empty columns before the item, like `offset={{ md: 2 }}` |

**Nested grids.** An item can itself be a `container`, to split its space into more columns.

**How it works.** Despite the name, MUI Grid uses CSS **flexbox**, not CSS Grid. It calculates each item's width from `size` and the spacing.

**Compare with plain CSS.** The same "cards that wrap" layout without breakpoints is `grid-template-columns: repeat(auto-fit, minmax(260px, 1fr))` in CSS Grid. MUI Grid is better when the design says exact columns per breakpoint.

:::version[Version note]
- **MUI v5:** `<Grid container>` and `<Grid item xs={12} sm={6}>`. It used negative margins on the container for spacing, which could cause small overflow bugs.
- **MUI v6:** a new `Grid2` with the `size` prop.
- **MUI v7:** `Grid2` became `Grid`. The old one was renamed `GridLegacy`. The `item` prop is gone; every child is an item.

When you upgrade, change `item xs={12} sm={6}` to `size={{ xs: 12, sm: 6 }}`.
:::

## 🎯 Why do we use it?

- **Responsive layouts with no media queries.** One `size` object handles phone, tablet and laptop.
- **Matches design files.** Designers often use 12-column grids, so the code matches their plan.
- **Consistent gaps** from the theme spacing.

## ⚠️ Common mistakes

- **Forgetting `container`** on the parent. The items don't line up.
- **Mixing v5 and v7 syntax.** `item xs={6}` does nothing on the v7 Grid.
- **Item sizes that add up to more than 12** in a row. Extra items wrap to the next line. That is fine if you meant it.
- **Using Grid for a simple row of buttons.** [Stack](topic:mui-tailwind/mui-layout) is simpler.

## 🗣️ How to answer in an interview

> "MUI Grid is a 12-column responsive layout. The parent gets `container` and a `spacing`, like `spacing={2}` for 16px gaps. Each child says how many columns it takes, per breakpoint. In MUI v7 that's `size={{ xs: 12, sm: 6, lg: 4 }}` — full width on phones, half from 600px, one-third from 1200px — because each breakpoint key means 'this size and up'.
>
> In older MUI v5 code you'll see `<Grid item xs={12} sm={6}>`. In v7 that version is called GridLegacy, so when upgrading I convert `item xs` props into the `size` object.
>
> I use Grid for rows and columns together, like a card gallery or dashboard, and Stack for one-direction layouts."

[FILL IN: confirm the UI library used at SkillKeepr, and a screen where you used a grid layout.]

## 🔁 Follow-up questions

### What does `size="grow"` do?

The item takes all the space left over in the row, after the other items. It is like `flex: 1`.

### How do you leave empty columns before an item?

Use `offset`, like `offset={{ md: 2 }}`. From 900px, two empty columns come before the item.

### How do you change the number of columns?

Set `columns` on the container, like `columns={10}`. Then `size={5}` is half.

### Why did the v5 Grid sometimes cause a horizontal scroll bar?

It used negative margins on the container to make room for spacing. In some layouts this made the page slightly wider than the screen. The new Grid no longer relies on those negative margins, so this problem goes away.

## ✅ Quick check

### 1. How many cards per row with `size={{ xs: 12, md: 3 }}` on a 1000px screen?

:::answer
**4.** At 1000px, `md` (900px+) applies. 3 of 12 columns each → 12 ÷ 3 = 4 cards per row.
:::

### 2. Convert this v5 code to v7: `<Grid item xs={12} md={6}>`

:::answer
`<Grid size={{ xs: 12, md: 6 }}>` — no `item` prop in v7.
:::

### 3. What is the gap between items with `spacing={3}` and the default theme?

:::answer
**24px** (3 × 8px).
:::
