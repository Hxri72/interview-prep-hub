---
title: Responsive design with Material UI (xs → xl, Grid, useMediaQuery)
stack: responsive-design
order: 14
level: Intermediate
mustKnow: true
askedFrequency: very common
summary:
  - "MUI is mobile-first too. Instead of prefixes, you give an object: { xs: 2, md: 4 }."
  - "MUI breakpoints: xs 0px, sm 600px, md 900px, lg 1200px, xl 1536px. Each means \"this width and wider\"."
  - "Grid has 12 columns. size={{ xs: 12, sm: 6, lg: 4 }} = full width, then half from 600px, then one-third from 1200px."
  - "useMediaQuery(theme.breakpoints.down('md')) is true below 900px. Use it to swap whole components."
  - "MUI md (900px) is NOT the same as Tailwind md (768px)."
cards:
  - q: What are MUI's default breakpoints?
    a: "xs = 0px, sm = 600px, md = 900px, lg = 1200px, xl = 1536px. Each applies from that width and up."
  - q: "What does sx={{ p: { xs: 2, md: 4 } }} mean?"
    a: "Padding of 2 units (16px) on all screens, and 4 units (32px) from 900px. 1 MUI spacing unit = 8px."
  - q: "What does <Grid size={{ xs: 12, sm: 6, lg: 4 }}> mean?"
    a: "Full width (12 of 12) on phones, half (6 of 12) from 600px, one-third (4 of 12) from 1200px."
  - q: "What does useMediaQuery(theme.breakpoints.down('md')) return?"
    a: true when the screen is narrower than 900px (md), false otherwise.
  - q: When should you use useMediaQuery instead of sx breakpoints?
    a: When you need to render a DIFFERENT component (like cards on phones and a table on laptops), not just change styles.
---

## 💡 What is it?

Material UI (MUI) also works **mobile-first**.

But instead of class prefixes, you pass an **object with sizes**:
`sx={{ p: { xs: 2, md: 4 } }}`.

- `xs` is for phones **and up**.
- `md` is for 900px **and up**.

MUI also gives you a 12-column **Grid** and a `useMediaQuery` hook for bigger changes.

## 🏠 Real-life example

Think of a **school canteen menu board** with 12 slots in each row.

- On a **small board** (phone), each dish takes all 12 slots, so one dish per row.
- On a **medium board** (tablet), each dish takes 6 slots, so two per row.
- On a **big board** (laptop), each dish takes 4 slots, so three per row.
- For the **tiny board near the gate**, the canteen uses a **completely different list** instead of the board. That is `useMediaQuery`: switching the whole component.

Mapping:
- **Dish** = a Grid item.
- **12 slots** = MUI Grid's 12 columns.
- **"takes 6 slots on the medium board"** = `size={{ sm: 6 }}`.
- **Switching to a list** = `isMobile ? <Cards /> : <Table />`.

## 🧑‍💻 Code example

Set up once:

```bash
npm create vite@latest mui-demo -- --template react
cd mui-demo
npm install @mui/material @emotion/react @emotion/styled
```

Paste this into `src/App.jsx` and run `npm run dev`.

```jsx
import Box from '@mui/material/Box'; // a div with the sx prop
import Grid from '@mui/material/Grid'; // MUI v7 Grid (12 columns)
import Stack from '@mui/material/Stack'; // one-direction layout with spacing
import Typography from '@mui/material/Typography'; // text with theme styles
import useMediaQuery from '@mui/material/useMediaQuery'; // hook that checks the screen size
import { useTheme } from '@mui/material/styles'; // gives us the theme and its breakpoints

const jobs = ['Node.js Developer', 'React Developer', 'QA Engineer', 'DevOps Engineer']; // sample jobs

export default function App() { // our main component
  const theme = useTheme(); // read the default theme
  const isMobile = useMediaQuery(theme.breakpoints.down('md')); // true when the screen is narrower than 900px
  return ( // what we draw
    <Box sx={{ p: { xs: 2, md: 4 } }}> {/* padding: 2 units (16px) on phones, 4 units (32px) from 900px */}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 2 }}> {/* stacked on phones, in a row from 600px; 16px gaps; 16px bottom margin */}
        <Typography variant="h6">Open jobs</Typography> {/* page title */}
        <Typography sx={{ display: { xs: 'none', md: 'block' } }}>4 roles · updated today</Typography> {/* hidden on phones, shown from 900px */}
      </Stack> {/* end of the header row */}
      <Typography sx={{ mb: 2 }}>{isMobile ? 'Phone view: cards' : 'Desktop view: grid'}</Typography> {/* shows which view the hook picked */}
      <Grid container spacing={2}> {/* the Grid parent; spacing 2 = 16px gaps */}
        {jobs.map((job) => ( // one item per job
          <Grid key={job} size={{ xs: 12, sm: 6, lg: 3 }}> {/* 12/12 on phones, 6/12 from 600px, 3/12 (4 per row) from 1200px */}
            <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 2, p: 2 }}>{job}</Box> {/* bordered card, 16px padding */}
          </Grid> // end of one item
        ))} {/* end of the list */}
      </Grid> {/* end of the Grid */}
    </Box> // end of the page
  ); // end of what App returns
} // end of App
```

**What you see:**

```text
375px  → 16px padding; title only (subtitle hidden); "Phone view: cards"; 1 job per row
768px  → header in a row; still "Phone view: cards" (768 < 900); 2 jobs per row (sm = 600px)
1280px → 32px padding; subtitle shown; "Desktop view: grid"; 4 jobs per row (lg = 1200px)
```

## 🔍 Deeper version

**The default breakpoints:**

| Key | Starts at | Roughly |
|---|---|---|
| `xs` | 0px | all screens |
| `sm` | 600px | large phones, small tablets |
| `md` | 900px | tablets (landscape), small laptops |
| `lg` | 1200px | laptops |
| `xl` | 1536px | big monitors |

**Three ways to be responsive in MUI:**
1. **Responsive values in `sx`** or system props: `{ xs: …, md: … }`. Best for spacing, sizes and showing/hiding.
2. **Grid `size`**: how many of the 12 columns an item takes at each breakpoint.
3. **`useMediaQuery`**: returns `true`/`false`, so you can render different components.

**Breakpoint helpers on the theme:**
- `theme.breakpoints.up('md')` → `@media (min-width: 900px)`.
- `theme.breakpoints.down('md')` → `@media (max-width: 899.95px)` (below md).
- `theme.breakpoints.between('sm', 'lg')` → from 600px up to just below 1200px.
- You can use them in `styled()`: `[theme.breakpoints.up('md')]: { flexDirection: 'row' }`.

**`useMediaQuery` and the first render.** On a server-rendered page, the hook doesn't know the screen size at first. It returns `false`, then updates. That can cause a flash. In a client-only Vite app this is less of a problem. Prefer `sx` breakpoints when CSS alone can do the job, because they never flash.

**Custom breakpoints.** In `createTheme({ breakpoints: { values: { xs: 0, sm: 640, md: 768, lg: 1024, xl: 1280 } } })`. This is how you match Tailwind. See [matching breakpoints](topic:responsive-design/matching-breakpoints).

:::version[Version note]
**MUI v5** wrote Grid items as `<Grid item xs={12} sm={6}>`. **MUI v7** uses `<Grid size={{ xs: 12, sm: 6 }}>` with no `item` prop. The old one is still available as `GridLegacy`. See [MUI Grid](topic:mui-tailwind/mui-grid).
:::

## 🎯 Why do we use it?

- **One component works on every screen**, with small changes per breakpoint.
- **Grid** handles card galleries and dashboards without writing media queries.
- **`useMediaQuery`** handles the big cases, like a data table on laptops but cards on phones, or a full-screen dialog on phones (`fullScreen={isMobile}`).

## ⚠️ Common mistakes

- **Assuming MUI `md` = 768px.** It's **900px**. Tailwind's `md` is 768px.
- **Forgetting `container`** on the Grid parent. Items won't line up.
- **Using `useMediaQuery` for simple style changes.** `sx` breakpoints are simpler and don't flash.
- **Mixing v5 Grid code** (`item xs={6}`) with the v7 Grid. It won't work; use `size`.

## 🗣️ How to answer in an interview

> "MUI is mobile-first, like Tailwind, but it uses breakpoint objects instead of prefixes. The keys are xs 0, sm 600, md 900, lg 1200 and xl 1536, and each means 'this width and up'. For spacing and visibility I use responsive values in `sx`, like `p: { xs: 2, md: 4 }`, where one unit is 8px. For layouts I use the 12-column Grid. In MUI v7 that's `size={{ xs: 12, sm: 6, lg: 4 }}`, so full width on phones, half from 600, and a third from 1200. When I need a completely different component, like cards on mobile and a table on desktop, I use `useMediaQuery(theme.breakpoints.down('md'))`. One thing to watch is that MUI's md is 900 while Tailwind's is 768, so if a project uses both, I align them in the theme."

[FILL IN: confirm the UI library used at SkillKeepr before saying you used MUI breakpoints there.]

## 🔁 Follow-up questions

### How do you show a table on desktop and cards on mobile?

`const isMobile = useMediaQuery(theme.breakpoints.down('md'));` then `return isMobile ? <CandidateCards /> : <CandidateTable />;`.

### How do you make a dialog full screen on phones?

`<Dialog fullScreen={isMobile}>`, using the same `useMediaQuery` result.

### What does `theme.breakpoints.down('md')` produce?

A media query for widths **below** 900px (`max-width: 899.95px`). `up('md')` is 900px and above.

### Can you change MUI's breakpoints?

Yes. Pass `breakpoints.values` to `createTheme`. All `sx` objects, Grid sizes and helpers then use the new numbers.

## ✅ Quick check

### 1. The screen is 1000px wide. What padding does `sx={{ p: { xs: 1, md: 3 } }}` give?

:::answer
**24px.** 1000px is above md (900px), so `p: 3` applies. 3 units × 8px = 24px.
:::

### 2. How many cards per row does `size={{ xs: 12, sm: 6, lg: 4 }}` give at 800px?

:::answer
**2.** 800px is above sm (600px) and below lg (1200px), so each card takes 6 of 12 columns.
:::

### 3. True or false: `useMediaQuery(theme.breakpoints.down('md'))` is true on a 768px tablet.

:::answer
**True.** 768px is below MUI's md (900px).
:::
