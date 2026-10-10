---
title: "Mantine Grid and SimpleGrid"
stack: mantine-tailwind
order: 6
level: Intermediate
mustKnow: false
askedFrequency: common
summary:
  - "Grid is a 12-column layout. Each Grid.Col says how many of the 12 columns it takes: span={6} = half the row."
  - "Spans can change per screen size: span={{ base: 12, sm: 6, lg: 4 }} = full width on phones, half from 768px, a third from 1200px."
  - "SimpleGrid is easier when every item has the same width: cols={{ base: 1, sm: 2, lg: 3 }}."
  - "Gaps use the spacing scale (default md = 16px). Current Mantine calls the Grid prop gap; Mantine 7 and 8 call it gutter."
  - Both work mobile-first with min-width breakpoints (sm = 768px, md = 992px, lg = 1200px).
cards:
  - q: How many columns does Mantine Grid have by default?
    a: 12. Grid.Col span={4} takes 4 of 12 = one third of the row. You can change it with the columns prop.
  - q: "What does span={{ base: 12, sm: 6, lg: 4 }} do?"
    a: Full width (12/12) on phones, half width (6/12) from 768px, and one third (4/12) from 1200px.
  - q: When do you use SimpleGrid instead of Grid?
    a: "When all items are the same width, like a card gallery: <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }}>. You don't need Grid.Col."
  - q: What are Mantine's default breakpoints?
    a: "xs 36em (576px), sm 48em (768px), md 62em (992px), lg 75em (1200px), xl 88em (1408px)."
  - q: Grid gap prop — gap or gutter?
    a: Mantine 9 uses gap (plus rowGap and columnGap). Mantine 7 and 8, including SkillKeepr's version, use gutter. Both default to md (16px).
---

## 💡 What is it?

**`Grid`** places things in **rows of 12 equal columns**. Each child, a `Grid.Col`, says how many columns it takes. `span={6}` means half the row, and `span={4}` means one third.

**`SimpleGrid`** is the easy version. You say how many columns you want, and every item gets the same width.

Both can change by **screen size**, so one layout works on a phone and a laptop. They use the theme's [breakpoints](glossary:breakpoint).

## 🏠 Real-life example

Think of **a chocolate bar with 12 pieces in a row**.

- **The 12 pieces** = the 12 grid columns.
- **"You get 6 pieces, your friend gets 6"** = two `Grid.Col span={6}` = half and half.
- **"Three friends, 4 pieces each"** = three `span={4}` = three equal thirds.
- **On a small plate only one share fits per row** = on phones, `span={{ base: 12 }}` gives each share the full row.
- **A box of cookies where all cookies are the same size** = `SimpleGrid`. You only say how many cookies fit in a row.

## 🧑‍💻 Code example

Use the setup from [Mantine setup](topic:mantine-tailwind/mantine-setup), then replace **`src/App.jsx`**:

```jsx
import { Container, Grid, Paper, SimpleGrid, Text, Title } from '@mantine/core'; // grid + display parts

const jobs = ['Frontend', 'Backend', 'Full stack', 'DevOps', 'QA', 'Data'];  // six sample job titles

export default function App() {                                         // our main component
  return (                                                              // what the screen shows
    <Container size="lg" py="xl">                                       {/* centred, max 1140px, 32px top/bottom */}
      <Title order={3} mb="md">Dashboard (Grid)</Title>                 {/* heading, 16px space below */}
      <Grid gap="md">                                                   {/* 12-column grid, 16px gaps (Mantine 7/8: gutter="md") */}
        <Grid.Col span={{ base: 12, md: 8 }}>                           {/* phones: full row; from 992px: 8/12 = two thirds */}
          <Paper p="md" withBorder>Candidate list</Paper>               {/* a bordered box with 16px padding */}
        </Grid.Col>                                                     {/* end of the big column */}
        <Grid.Col span={{ base: 12, md: 4 }}>                           {/* phones: full row; from 992px: 4/12 = one third */}
          <Paper p="md" withBorder>Filters</Paper>                      {/* the side panel */}
        </Grid.Col>                                                     {/* end of the small column */}
      </Grid>                                                           {/* end of the Grid */}

      <Title order={3} mt="xl" mb="md">Jobs (SimpleGrid)</Title>        {/* heading, 32px above, 16px below */}
      <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">        {/* 1 column, 2 from 768px, 3 from 1200px */}
        {jobs.map((job) => (                                            // one card per job title
          <Paper key={job} p="md" withBorder>                           {/* key = stable id for React */}
            <Text fw={600}>{job}</Text>                                 {/* job title in semi-bold (600) */}
          </Paper>                                                      // end of one card
        ))}                                                             {/* end of the list */}
      </SimpleGrid>                                                     {/* end of the SimpleGrid */}
    </Container>                                                        // end of the page box
  );                                                                    // end of what App returns
}                                                                       // end of App
```

Run `npm run dev` and resize the window.

```text
375px: everything is one column — Candidate list, then Filters, then 6 job cards stacked.
768px: still Candidate list above Filters; job cards are now 2 per row (3 rows).
1280px: Candidate list takes two thirds, Filters one third, side by side;
        job cards are 3 per row (2 rows).
```

## 🔍 Deeper version

**Breakpoints** (default theme, all min-width, mobile-first):

| Key | Starts at | Typical device |
|---|---|---|
| `base` | 0px | every screen |
| `xs` | 36em = 576px | large phones |
| `sm` | 48em = 768px | tablets |
| `md` | 62em = 992px | small laptops |
| `lg` | 75em = 1200px | laptops |
| `xl` | 88em = 1408px | big monitors |

**Grid props:**
- `columns` — the number of columns (default 12). `columns={24}` gives finer control.
- `gap` — the space between columns and rows (default `md` = 16px). `rowGap` and `columnGap` override one direction.
- `grow` — the last row's columns stretch to fill the free space.
- `justify` and `align` — like flexbox alignment for the columns.

**`Grid.Col` props:**
- `span` — a number (1–12), `'auto'` (take the free space), or `'content'` (as wide as its content). It can be responsive.
- `offset` — empty columns before this one, e.g. `offset={{ md: 2 }}`.
- `order` — change the visual order per screen size, e.g. show the filters first on phones.

**`SimpleGrid`** has `cols` (default 1), `spacing` (horizontal gap, default `md`) and `verticalSpacing` (falls back to `spacing`).

**Container queries.** Both components accept `type="container"`. Then the columns react to the **width of the grid's own box**, not the window. That's useful for cards inside a resizable sidebar. Mantine adds the wrapper element with `container-type: inline-size` for you. In container mode, `SimpleGrid` keys are widths you choose, like `cols={{ base: 1, '500px': 2 }}`. `Grid` also needs a `breakpoints` prop that says how wide each key (`xs`, `sm`…) is. See [Container queries](topic:responsive-design/container-queries).

**Grid vs SimpleGrid vs CSS Grid:**

| Use | When |
|---|---|
| `SimpleGrid` | all items equal width (cards, tiles) |
| `Grid` | items with different widths (8 + 4 columns), offsets, reordering |
| plain CSS grid | complex 2D layouts with named areas — write it in a CSS module |

:::version[Version note]
- In **Mantine 9** (current), the Grid spacing prop is **`gap`**, with `rowGap` and `columnGap`.
- **Mantine 7 and 8**, which SkillKeepr uses, call it **`gutter`**: `<Grid gutter="md">`.
- The 12-column default, `span`, `offset` and the breakpoint values are the same in 7, 8 and 9.
:::

## 🎯 Why do we use it?

- **Responsive layouts without media queries.** One `span` object replaces three CSS rules.
- **Dashboards.** A main panel plus a side panel, stacking on phones.
- **Card galleries.** `SimpleGrid` makes 1 → 2 → 3 columns in one line.
- **Consistent gaps** from the spacing scale.

## ⚠️ Common mistakes

- **Spans in one row that add up to more than 12.** The extra columns wrap to a new row.
- **Thinking `sm: 6` means "only on tablets".** It means "768px **and wider**", until a bigger key overrides it.
- **Using `Grid` for equal cards.** `SimpleGrid` is simpler and needs no `Grid.Col`.
- **Copying `gutter` from Mantine 7 code into a Mantine 9 project**, or the reverse. Check the version in `package.json`.

## 🗣️ How to answer in an interview

> "Mantine has two grid components. `Grid` is a 12-column layout where each `Grid.Col` takes a `span` of columns, and spans can be responsive, like `{ base: 12, md: 8 }` — full width on phones and two thirds from 992px. It also supports offset, order and `'auto'` spans. `SimpleGrid` is for equal-width items: you just set `cols={{ base: 1, sm: 2, lg: 3 }}`. Both are mobile-first with min-width breakpoints from the theme, and both can switch to container queries with `type="container"`. One version detail: the gap prop is `gutter` in Mantine 7 and 8 and `gap` in Mantine 9."

[FILL IN: a SkillKeepr screen where you used Grid or SimpleGrid, e.g. dashboard tiles.]

## 🔁 Follow-up questions

### How do you show the filters panel first on phones but second on laptops?

Use `order`: `<Grid.Col span={{ base: 12, md: 4 }} order={{ base: 1, md: 2 }}>`. On phones it comes first; from 992px it moves to second.

### What does `span="auto"` do?

The column takes the remaining free space in the row. Several `'auto'` columns share it equally.

### Mantine Grid vs CSS grid — which is better?

For common responsive column layouts, Mantine `Grid`/`SimpleGrid` is faster to write and uses the theme's breakpoints. For complex 2D layouts with named areas or rows of different heights, plain CSS grid in a CSS module gives more control. See [CSS Grid basics](topic:responsive-design/grid-basics).

### How do breakpoints compare with Tailwind?

Mantine's `sm` is 768px, while Tailwind's `sm` is 640px and `md` is 768px. The names don't match, so align them if you use both. See [Matching breakpoints](topic:responsive-design/matching-breakpoints).

## ✅ Quick check

### 1. Three `Grid.Col span={4}` children — how do they look on a laptop?

:::answer
Three equal columns in one row. 4 + 4 + 4 = 12, so each takes one third.
:::

### 2. `cols={{ base: 1, sm: 2, lg: 4 }}` with 8 cards — how many rows at 1000px wide?

:::answer
**4 rows.** At 1000px, `sm` (768px+) applies but `lg` (1200px+) doesn't, so there are 2 cards per row, and 8 ÷ 2 = 4 rows.
:::

### 3. A Mantine 7 project — which is correct?

- A) `<Grid gap="md">`
- B) `<Grid gutter="md">`

:::answer
**B.** Mantine 7 and 8 use `gutter`. `gap` is the Mantine 9 name.
:::
