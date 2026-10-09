---
title: "Flexbox: wrap, gap and flex: 1"
stack: responsive-design
order: 6
level: Basic
mustKnow: false
askedFrequency: common
summary:
  - "flex-wrap: wrap moves children to the next line when there is no room, instead of squeezing them."
  - "gap: 1rem adds 16px between children, without margins on the edges."
  - "flex: 1 on a child means 'take an equal share of the leftover space'."
  - "flex is short for flex-grow, flex-shrink and flex-basis. flex: 1 1 250px = grow, shrink, start at 250px."
  - "Add min-width: 0 to a flex child when long text overflows instead of shrinking."
cards:
  - q: "What does flex-wrap: wrap do?"
    a: "When the children don't fit in one line, the extra ones move to a new line instead of shrinking or overflowing."
  - q: "What does flex: 1 mean?"
    a: "flex-grow 1, flex-shrink 1, flex-basis 0 — the item grows to take an equal share of the free space."
  - q: "Why use gap instead of margin?"
    a: "gap only adds space BETWEEN items, never on the outer edges, and it works the same when items wrap."
  - q: "Why does a flex child with long text overflow, and how do you fix it?"
    a: "Flex items don't shrink below their content's minimum size by default (min-width: auto). Add min-width: 0 to that child."
  - q: "What does flex: 1 1 250px do?"
    a: "Start at 250px wide, grow to fill extra space, and shrink if needed."
---

## 💡 What is it?

These three tools make [Flexbox](topic:responsive-design/flexbox-basics) responsive:

- **`flex-wrap: wrap`** — if children don't fit in one line, move them to the next line.
- **`gap`** — the space between children.
- **`flex: 1`** — "take an equal share of the leftover space."

Together they make rows that wrap neatly on small screens.

## 🏠 Real-life example

Think of **kids sitting on benches in a hall**.

- A **bench** = one line of the flex row.
- **Too many kids for one bench, so some move to the next bench** = `flex-wrap: wrap`.
- The **gap between kids** = `gap`.
- **Kids spreading out to fill an empty bench equally** = `flex: 1` (each grows to an equal share).
- **"Everyone needs at least a 250px seat"** = `flex-basis: 250px`.

## 🧑‍💻 Code example

Save as `index.html`, open it, and resize. Try 375px, 768px and 1280px.

```html
<!DOCTYPE html> <!-- a modern HTML5 page -->
<html lang="en"> <!-- English page -->
<head> <!-- page settings -->
  <meta name="viewport" content="width=device-width, initial-scale=1"> <!-- use the real phone width -->
  <style> /* CSS starts */
    .tags { /* a row of skill tags */
      display: flex; /* turn on Flexbox */
      flex-wrap: wrap; /* move tags to the next line when the row is full */
      gap: 0.5rem; /* 0.5rem = 8px space between tags */
    } /* end of .tags */
    .tag { /* one skill tag */
      padding: 0.25rem 0.75rem; /* 4px top/bottom, 12px left/right inside space */
      background: #e8f0fe; /* light blue */
      border-radius: 999px; /* very round ends: a pill shape */
    } /* end of .tag */
    .cards { /* a row of cards */
      display: flex; /* turn on Flexbox */
      flex-wrap: wrap; /* wrap cards onto new lines */
      gap: 1rem; /* 16px space between cards */
      margin-top: 1rem; /* 16px space above the cards */
    } /* end of .cards */
    .card { /* one card */
      flex: 1 1 250px; /* start at 250px, grow to fill space, shrink if needed */
      background: #fff3cd; /* light yellow */
      padding: 1rem; /* 16px inside space */
    } /* end of .card */
  </style> <!-- CSS ends -->
</head> <!-- end of settings -->
<body> <!-- visible part -->
  <div class="tags"> <!-- tag row -->
    <span class="tag">React</span><span class="tag">Node.js</span><span class="tag">MongoDB</span> <!-- three tags -->
    <span class="tag">TypeScript</span><span class="tag">Express</span><span class="tag">AWS</span> <!-- three more tags -->
  </div> <!-- end of tag row -->
  <div class="cards"> <!-- card row -->
    <div class="card">Candidate A</div> <!-- card 1 -->
    <div class="card">Candidate B</div> <!-- card 2 -->
    <div class="card">Candidate C</div> <!-- card 3 -->
  </div> <!-- end of card row -->
</body> <!-- end of visible part -->
</html> <!-- end of page -->
```

**What you see:**

```text
At 375px:  tags wrap onto 2 lines. Cards stack: 1 per line (only one 250px card fits).
At 768px:  tags fit on 1 line. 2 cards on the first line, the 3rd card alone on line 2,
           and it stretches to the full width (flex-grow fills the empty space).
At 1280px: all 3 cards sit in one row, each an equal third of the width.
```

## 🔍 Deeper version

**`flex` is a shorthand for three properties:**

| Part | Meaning | Default |
|---|---|---|
| `flex-grow` | How much of the **extra** space this item takes | `0` (don't grow) |
| `flex-shrink` | How much it shrinks when there **isn't** enough space | `1` (can shrink) |
| `flex-basis` | The starting size before growing or shrinking | `auto` (use width or content) |

**Common shortcuts:**

| You write | It means | Effect |
|---|---|---|
| `flex: 1` | `1 1 0%` | Equal shares, ignoring content size |
| `flex: auto` | `1 1 auto` | Grow and shrink, starting from content size |
| `flex: none` | `0 0 auto` | Fixed: never grow or shrink |
| `flex: 1 1 250px` | grow, shrink, start at 250px | Wrapping card rows |

**The "last row stretches" effect.** With `flex: 1 1 250px` and wrapping, a lonely last card grows to fill the whole line. Sometimes that is fine. If you want every card the same width in every row, use [Grid with auto-fit](topic:responsive-design/grid-auto-fit) instead.

**`gap` vs margins.** `gap` puts space only **between** items. Margins also add space on the outer edges, and you then need tricks like negative margins. `gap` works in Flexbox in all modern browsers.

**The `min-width: auto` trap.** A flex item will not shrink smaller than its content's minimum width. A long email address or a long word can push the layout wider than the screen. Fix it on that child:

```css
.card { min-width: 0; } /* allow the child to shrink below its content width */
.card p { overflow-wrap: anywhere; } /* and let long words break */
```

## 🎯 Why do we use it?

- **No overflow on phones.** Wrapping stops a row from running off the screen.
- **Clean spacing.** One `gap` value replaces many margins.
- **Fluid sizes.** `flex: 1` and `flex-basis` let items share the space without fixed widths.
- **Fewer media queries.** A wrapping row adapts to any width by itself.

## ⚠️ Common mistakes

- **Forgetting `flex-wrap: wrap`.** By default, items squeeze into one line, and may overflow.
- **Using margins for spacing** and getting extra space at the edges. Use `gap`.
- **Long text breaking the layout.** Add `min-width: 0` to the flex child.
- **Expecting equal-width rows** from a wrapping Flexbox. The last row stretches. Use Grid for strict columns.

## 🗣️ How to answer in an interview

> "flex-wrap: wrap lets flex items move to a new line when there isn't room, so a row of tags or cards doesn't overflow on a phone. gap adds space only between items, so I don't need margins and edge fixes.
>
> flex is shorthand for flex-grow, flex-shrink and flex-basis. flex: 1 means each item takes an equal share of the free space. For card rows I like flex: 1 1 250px: start at 250 pixels, grow to fill, and shrink if needed. That gives one card per line on a phone and three in a row on a laptop without media queries.
>
> One gotcha: flex items don't shrink below their content's minimum width, so a long email can overflow. Adding min-width: 0 to the child fixes it."

## 🔁 Follow-up questions

### What is the difference between `flex: 1` and `flex: auto`?

`flex: 1` sets the basis to 0, so all items get **equal** widths. `flex: auto` starts from each item's **content size**, so bigger content stays bigger.

### When would you use `flex: none`?

For something that must keep its size, like an avatar or an icon next to growing text.

### How do you make wrapped flex cards all the same width?

Give them a fixed `flex-basis` and `flex-grow: 0`, or better, use Grid with `repeat(auto-fit, minmax(250px, 1fr))`.

## ✅ Quick check

### 1. A row has 5 items that don't fit. There is no `flex-wrap`. What happens by default?

:::answer
They stay on **one line** and shrink (`flex-shrink: 1`). If they can't shrink enough, they overflow the parent.
:::

### 2. What does `gap: 1.5rem` add between items?

:::answer
**24px** (1.5 × 16px) between items, and no space on the outer edges.
:::

### 3. Three items have `flex: 1`. The parent is 900px wide with no gap. How wide is each?

:::answer
**300px.** `flex: 1` gives each an equal share: 900 ÷ 3.
:::
