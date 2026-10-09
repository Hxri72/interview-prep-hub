---
title: "CSS Grid basics: columns, fr, gap"
stack: responsive-design
order: 7
level: Basic
mustKnow: true
askedFrequency: very common
summary:
  - "CSS Grid lays things out in rows AND columns at the same time, like a table or a dashboard."
  - "Put display: grid on the parent, then grid-template-columns sets the columns."
  - "1fr = one equal share of the free space. repeat(3, 1fr) = 3 equal columns."
  - "gap sets the space between rows and columns. grid-column: span 2 makes an item 2 columns wide."
  - "Mobile-first: 1 column on phones, more columns at 768px and 1024px with media queries."
cards:
  - q: "What does 1fr mean?"
    a: "One fraction: one equal share of the free space in the grid container."
  - q: "What does grid-template-columns: repeat(3, 1fr) create?"
    a: "Three columns of equal width."
  - q: "What does grid-template-columns: 250px 1fr do?"
    a: "A fixed 250px first column (like a sidebar) and a second column that takes all the remaining space."
  - q: "How do you make one grid item two columns wide?"
    a: "grid-column: span 2 on that item."
  - q: "Grid vs Flexbox in one line?"
    a: "Flexbox is for one direction (a row or a column). Grid is for rows and columns together."
---

## 💡 What is it?

**[CSS Grid](glossary:css-grid)** is a layout tool for **rows and columns at the same time**.

You put `display: grid` on a parent. Then you say how many columns you want. The children fill the cells, one by one.

It is perfect for card galleries, dashboards and page layouts.

## 🏠 Real-life example

Think of a **chessboard** or a **classroom seating chart**.

- The **classroom floor** = the grid container (`display: grid`).
- The **rows and columns of desks** = `grid-template-rows` and `grid-template-columns`.
- The **students** = the grid items. They fill desks in order.
- The **aisles between desks** = `gap`.
- **A big table that takes two desk spaces** = `grid-column: span 2`.

## 🧑‍💻 Code example

Save as `index.html`, open it, and resize. Try 375px, 768px and 1280px.

```html
<!DOCTYPE html> <!-- a modern HTML5 page -->
<html lang="en"> <!-- English page -->
<head> <!-- page settings -->
  <meta name="viewport" content="width=device-width, initial-scale=1"> <!-- use the real phone width -->
  <style> /* CSS starts */
    .dashboard { /* the grid parent */
      display: grid; /* turn on Grid */
      grid-template-columns: 1fr; /* PHONE: one column taking all the width */
      gap: 1rem; /* 16px space between rows and between columns */
      padding: 1rem; /* 16px space inside the edges */
    } /* end of .dashboard for phones */
    .tile { /* one box on the dashboard */
      background: #e8f0fe; /* light blue */
      padding: 1rem; /* 16px inside space */
      border-radius: 8px; /* rounded corners */
    } /* end of .tile */
    @media (min-width: 768px) { /* tablets and bigger */
      .dashboard { grid-template-columns: repeat(2, 1fr); } /* 2 equal columns */
      .wide { grid-column: span 2; } /* the wide tile takes both columns */
    } /* end of tablet rules */
    @media (min-width: 1024px) { /* laptops and bigger */
      .dashboard { grid-template-columns: repeat(4, 1fr); } /* 4 equal columns */
    } /* end of laptop rules */
  </style> <!-- CSS ends -->
</head> <!-- end of settings -->
<body> <!-- visible part -->
  <div class="dashboard"> <!-- the grid -->
    <div class="tile">Open jobs</div> <!-- tile 1 -->
    <div class="tile">Candidates</div> <!-- tile 2 -->
    <div class="tile">Interviews</div> <!-- tile 3 -->
    <div class="tile">Offers</div> <!-- tile 4 -->
    <div class="tile wide">Hiring chart (wide)</div> <!-- tile 5, two columns wide -->
  </div> <!-- end of grid -->
</body> <!-- end of visible part -->
</html> <!-- end of page -->
```

**What you see:**

```text
At 375px:  5 tiles in one column, stacked.
At 768px:  2 columns: [Open jobs][Candidates] / [Interviews][Offers] / [Hiring chart — full width]
At 1280px: 4 columns: [Open jobs][Candidates][Interviews][Offers] / [Hiring chart spans 2 columns]
```

## 🔍 Deeper version

**The `fr` unit.** `fr` means "fraction of the **free** space". The grid first gives fixed sizes (like `250px`) their space. Then it splits what is left by the `fr` numbers.
- `1fr 1fr 1fr` = three equal columns.
- `2fr 1fr` = the first column is twice as wide as the second.
- `250px 1fr` = a fixed sidebar plus a flexible main area.

**Useful properties:**

| Property | On | What it does |
|---|---|---|
| `grid-template-columns` | Parent | Sizes of the columns |
| `grid-template-rows` | Parent | Sizes of the rows (often left automatic) |
| `gap` / `row-gap` / `column-gap` | Parent | Space between cells |
| `grid-column: span 2` | Child | Item takes 2 columns |
| `grid-column: 1 / -1` | Child | Item stretches from the first to the last column line |
| `grid-template-areas` | Parent | Name areas like "header", "sidebar", "main" |
| `justify-items` / `align-items` | Parent | Position each item inside its cell |

**Named areas** make page layouts easy to read:

```css
.page { display: grid; grid-template-areas: "header" "main" "footer"; } /* phone: stacked areas */
@media (min-width: 1024px) { /* laptops and bigger */
  .page { grid-template-columns: 250px 1fr; grid-template-areas: "header header" "sidebar main"; } /* sidebar + main */
} /* end of laptop rule */
```

**`fr` vs `%`.** `25%` columns plus a `gap` add up to more than 100%, so they overflow. `fr` shares the space **after** the gaps, so it never overflows.

**`minmax()`.** `minmax(200px, 1fr)` means "at least 200px, at most one share". It is the key to [responsive grids without media queries](topic:responsive-design/grid-auto-fit).

**Subgrid.** `grid-template-columns: subgrid` lets a child grid line up with its parent's columns. It works in all major browsers since 2023. It is great for card rows where titles and buttons must line up.

## 🎯 Why do we use it?

- **Two-dimensional layouts** that are hard with Flexbox: galleries, dashboards, page shells.
- **Clean HTML.** No extra wrapper `div`s for rows.
- **Easy responsive changes.** Change one line, `grid-template-columns`, at each breakpoint.
- **Exact alignment.** Every item lines up with the same column lines.

## ⚠️ Common mistakes

- **Using `%` columns with `gap`** and causing overflow. Use `fr`.
- **Putting `display: grid` on the children** instead of the parent.
- **Forgetting that `span 2` needs 2 columns.** On a 1-column phone layout, `span 2` creates an extra column. Add the `span` only inside the wider media query.
- **Using Grid for a simple row of buttons.** Flexbox is simpler there. See [Flexbox vs Grid](topic:responsive-design/flexbox-vs-grid).

## 🗣️ How to answer in an interview

> "CSS Grid is a two-dimensional layout system: rows and columns at the same time. I set display: grid on the parent and define columns with grid-template-columns. The fr unit means a fraction of the free space, so repeat(3, 1fr) gives three equal columns, and 250px 1fr gives a fixed sidebar and a flexible main area. gap sets the space between cells, and grid-column: span 2 makes an item two columns wide.
>
> I work mobile-first: one column on phones, then two columns from 768 pixels and four from 1024. For card galleries I often skip media queries and use repeat(auto-fit, minmax(250px, 1fr)).
>
> I choose Grid for dashboards and galleries, and Flexbox for one-direction things like navbars."

## 🔁 Follow-up questions

### What is the difference between `fr` and `%`?

`%` is a share of the whole container, before gaps. `fr` is a share of the space **left after** fixed sizes and gaps. So `fr` columns with a gap never overflow.

### How do you make an item stretch across all columns?

`grid-column: 1 / -1`. It goes from the first column line to the last one, whatever the number of columns.

### What are `grid-template-areas`?

A way to name parts of the layout, like `"header header" "sidebar main"`. Children then use `grid-area: header`. It makes page layouts easy to read and easy to change per breakpoint.

## ✅ Quick check

### 1. A grid is 1000px wide with no gap. Columns are `200px 1fr 1fr`. How wide are the `1fr` columns?

:::answer
**400px each.** 1000 − 200 = 800px free, split into 2 equal shares.
:::

### 2. What does `grid-template-columns: repeat(4, 1fr)` give?

:::answer
**4 equal columns.**
:::

### 3. Columns are `25% 25% 25% 25%` with `gap: 16px`. What goes wrong?

:::answer
The columns add up to 100% **plus** 48px of gaps, so the grid overflows its parent. Use `repeat(4, 1fr)` instead.
:::
