---
title: "Grid repeat(auto-fit, minmax()) — responsive without media queries"
stack: responsive-design
order: 8
level: Intermediate
mustKnow: true
askedFrequency: common
summary:
  - "grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)) makes a card grid that adapts with no media queries."
  - "Read it as: fit as many columns as you can; each is at least 260px and grows to share the extra space."
  - "auto-fit collapses empty columns, so few cards stretch to fill the row. auto-fill keeps empty columns, so cards keep their size."
  - "Use min(260px, 100%) inside minmax to avoid overflow on very small screens."
  - "Perfect for card galleries, product lists and candidate cards."
cards:
  - q: "Read repeat(auto-fit, minmax(260px, 1fr)) out loud."
    a: "Fit as many columns as possible; each column is at least 260px wide and can grow to an equal share of the extra space."
  - q: "auto-fit vs auto-fill?"
    a: "auto-fit collapses empty tracks, so existing items stretch to fill the row. auto-fill keeps empty tracks, so items keep their minimum-ish size and the row has empty space."
  - q: "Why does this need no media queries?"
    a: "The browser works out the number of columns from the container width every time it changes."
  - q: "How do you stop it overflowing on a 240px-wide screen?"
    a: "Use minmax(min(260px, 100%), 1fr), so the minimum can never be wider than the container."
---

## 💡 What is it?

This one line makes a **responsive card grid with no media queries**:

```css
grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); /* as many columns as fit, each at least 260px */
```

The browser counts how many 260px columns fit. Then it shares the leftover space equally. When the screen changes, the number of columns changes by itself.

## 🏠 Real-life example

Think of **placing chairs in a room for an event**.

The rule is: "Each chair needs at least 260 cm of space. Fit as many chairs in a row as you can. Then spread them out to use the whole row."

- The **room width** = the container width.
- **260 cm per chair** = the minimum, `260px`.
- **Spreading chairs to use the whole row** = `1fr` (grow to share the extra space).
- **A small room fits 1 chair per row, a big hall fits 4** = the columns change by themselves.

## 🧑‍💻 Code example

Save as `index.html`, open it, and resize slowly. Try 375px, 768px and 1280px.

```html
<!DOCTYPE html> <!-- a modern HTML5 page -->
<html lang="en"> <!-- English page -->
<head> <!-- page settings -->
  <meta name="viewport" content="width=device-width, initial-scale=1"> <!-- use the real phone width -->
  <style> /* CSS starts */
    .cards { /* the card gallery */
      display: grid; /* turn on Grid */
      grid-template-columns: repeat(auto-fit, minmax(min(260px, 100%), 1fr)); /* as many columns as fit; each at least 260px (or full width if smaller) */
      gap: 1rem; /* 16px space between cards */
      padding: 1rem; /* 16px space inside the edges */
    } /* end of .cards */
    .card { /* one candidate card */
      background: #e8f0fe; /* light blue */
      padding: 1rem; /* 16px inside space */
      border-radius: 8px; /* rounded corners */
    } /* end of .card */
  </style> <!-- CSS ends -->
</head> <!-- end of settings -->
<body> <!-- visible part -->
  <div class="cards"> <!-- the gallery -->
    <div class="card">Asha — React</div> <!-- card 1 -->
    <div class="card">Bilal — Node.js</div> <!-- card 2 -->
    <div class="card">Chitra — MongoDB</div> <!-- card 3 -->
    <div class="card">Dev — AWS</div> <!-- card 4 -->
    <div class="card">Elena — TypeScript</div> <!-- card 5 -->
  </div> <!-- end of gallery -->
</body> <!-- end of visible part -->
</html> <!-- end of page -->
```

**What you see:**

```text
At 375px:  1 card per row (only one 260px column fits).
At 768px:  2 cards per row (two 260px columns + gap fit; three don't).
At 1280px: 4 cards per row (four fit; the 5th card goes to the next row).
Resize slowly: the number of columns changes by itself — no media queries.
```

## 🔍 Deeper version

**How the browser decides.** For each width, it asks: "How many columns of at least 260px, plus the gaps, fit?" That number becomes the column count. Then `1fr` shares the leftover space, so the columns fill the row exactly.

At a 1280px window, the space for columns is about 1232px (1280 minus the browser's default 8px body margin on each side, minus the 16px padding on each side). Four columns need 4 × 260 + 3 × 16 = 1088px. Five need 1364px. So four fit.

**`auto-fit` vs `auto-fill`.** The difference only shows when there are **fewer items than columns that would fit**.

| | `auto-fit` | `auto-fill` |
|---|---|---|
| Empty column tracks | Collapsed to 0 | Kept as empty space |
| 2 cards on a wide screen | Both stretch to fill the whole row | They keep about 260px each; the rest of the row stays empty |
| Use when | Few items should fill the space | Items should keep the same size, like a product grid that is still loading |

```css
.fit  { grid-template-columns: repeat(auto-fit,  minmax(200px, 1fr)); } /* 2 cards stretch across the row */
.fill { grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); } /* 2 cards stay small, empty space to the right */
```

**The tiny-screen overflow.** `minmax(260px, 1fr)` forces at least 260px. On a container narrower than 260px, the card overflows. Wrapping the minimum in `min(260px, 100%)` caps it at the container width. That is why the example uses `minmax(min(260px, 100%), 1fr)`.

**Limiting the maximum columns.** `auto-fit` keeps adding columns on very wide screens. To stop at, say, 4 columns, put a `max-width` on the container, or use a media query for that one case.

**In Tailwind or Mantine.** Tailwind: `grid-cols-[repeat(auto-fit,minmax(260px,1fr))]`. Mantine: `<SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="md">` (md = 16px gap), or recent versions' `minColWidth` prop for auto-fit. See [Mantine Grid](topic:mantine-tailwind/mantine-grid).

## 🎯 Why do we use it?

- **No media queries** for the most common responsive layout: a card gallery.
- **Works at every width,** not only at your chosen breakpoints.
- **Works inside any container.** The grid looks at its own width, so the same component fits a sidebar or a full page.
- **Less code to maintain.**

## ⚠️ Common mistakes

- **Swapping `auto-fit` and `auto-fill`** and wondering why two cards are huge, or tiny.
- **Writing `repeat(auto-fit, 260px)`** without `minmax`. Columns then never grow, and you get uneven empty space at the end of the row.
- **A minimum that is too big for phones** (like 400px) causing overflow. Use `min(400px, 100%)`.
- **Expecting a maximum column count.** `auto-fit` has no maximum; add a container `max-width` if needed.

## 🗣️ How to answer in an interview

> "For card galleries I use grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)). The browser fits as many columns as it can where each is at least 260 pixels, and 1fr makes them share the leftover space. So I get one column on a phone, two on a tablet and four on a laptop with no media queries at all, and it adapts to the container, not just the screen.
>
> The difference between auto-fit and auto-fill shows with few items: auto-fit collapses empty tracks so the items stretch, auto-fill keeps the empty tracks so items keep their size.
>
> I also wrap the minimum as min(260px, 100%) so nothing overflows on very narrow screens."

[FILL IN: a list or card view you built this way, if you did.]

## 🔁 Follow-up questions

### Why not just use media queries?

Media queries change the layout only at the widths you picked. `auto-fit` adapts at every width, and to the container size. It is less code for the same result.

### What happens if there are only 2 cards on a 1280px screen?

With `auto-fit`, the two cards stretch to share the full row. With `auto-fill`, they stay about the minimum width and the rest of the row is empty.

### Is this better than Flexbox wrap for cards?

Usually, yes. With Flexbox wrap, a lonely last card stretches to full width. With Grid, every card lines up in the same column sizes.

## ✅ Quick check

### 1. The container is 600px wide, `gap: 20px`, columns `repeat(auto-fit, minmax(250px, 1fr))`. How many columns?

:::answer
**2.** Two columns need 250 + 20 + 250 = 520px, which fits. Three need 790px, which doesn't. Each column then grows to 290px.
:::

### 2. Which keeps empty columns: `auto-fit` or `auto-fill`?

:::answer
**`auto-fill`.** `auto-fit` collapses the empty columns so items stretch.
:::

### 3. Why write `minmax(min(260px, 100%), 1fr)` instead of `minmax(260px, 1fr)`?

:::answer
So the minimum can never be wider than the container. On a screen narrower than 260px, cards shrink instead of overflowing.
:::
