---
title: "Flexbox vs Grid: when to use which"
stack: responsive-design
order: 9
level: Basic
mustKnow: true
askedFrequency: very common
summary:
  - "Flexbox is for ONE direction: a row or a column. Grid is for rows AND columns together."
  - "Flexbox is content-first: items decide their size and the layout adapts. Grid is layout-first: you define the columns, items fill them."
  - "Use Flexbox for navbars, toolbars, button groups and centring. Use Grid for galleries, dashboards and page layouts."
  - "They work well together: a Grid page layout with Flexbox inside each card."
  - "Both support gap, and both can be responsive with or without media queries."
cards:
  - q: "Flexbox or Grid — the one-line rule?"
    a: "Flexbox for one direction (a row or a column). Grid for rows and columns at the same time."
  - q: "Which would you use for a navbar?"
    a: "Flexbox: logo on the left, links on the right, all in one row with space-between."
  - q: "Which would you use for a card gallery?"
    a: "Grid with repeat(auto-fit, minmax(260px, 1fr)), so every card lines up in equal columns."
  - q: "Can you use both on one page?"
    a: "Yes. A common pattern is Grid for the overall page and gallery, and Flexbox inside each card for its header and buttons."
  - q: "What does 'content-first vs layout-first' mean?"
    a: "In Flexbox, item sizes come from their content and the line adapts. In Grid, you set the tracks first and items are placed into them."
---

## 💡 What is it?

[Flexbox](topic:responsive-design/flexbox-basics) and [Grid](topic:responsive-design/grid-basics) are the two main CSS layout tools.

- **Flexbox** lines things up in **one direction**: a row **or** a column.
- **Grid** places things in **rows and columns at the same time**.

They are not rivals. Most pages use both.

## 🏠 Real-life example

Think of a **train** and a **chessboard**.

- A **train** = Flexbox. The coaches go in one line. Each coach can be a different length, and the train adjusts.
- A **chessboard** = Grid. There are fixed rows and columns. Each piece sits in a square that lines up with the squares above and beside it.
- **A train parked on a chessboard square** = Flexbox inside a Grid cell. You can mix them.

## 🧑‍💻 Code example

Save as `index.html`, open it, and resize. Try 375px, 768px and 1280px.

```html
<!DOCTYPE html> <!-- a modern HTML5 page -->
<html lang="en"> <!-- English page -->
<head> <!-- page settings -->
  <meta name="viewport" content="width=device-width, initial-scale=1"> <!-- use the real phone width -->
  <style> /* CSS starts */
    body { margin: 0; font-family: system-ui, sans-serif; } /* no default outer space; clean font */
    .nav { /* the top bar: ONE row, so Flexbox */
      display: flex; /* turn on Flexbox */
      justify-content: space-between; /* logo on the left, links on the right */
      align-items: center; /* line them up vertically in the middle */
      padding: 1rem; /* 16px inside space */
      background: #1d43b0; /* dark blue bar */
      color: white; /* white text */
    } /* end of .nav */
    .nav a { color: white; margin-left: 1rem; } /* white links with 16px space before each */
    .gallery { /* rows AND columns of cards: Grid */
      display: grid; /* turn on Grid */
      grid-template-columns: repeat(auto-fit, minmax(min(240px, 100%), 1fr)); /* as many 240px+ columns as fit */
      gap: 1rem; /* 16px space between cards */
      padding: 1rem; /* 16px space around the gallery */
    } /* end of .gallery */
    .card { /* inside each card: one column of content, so Flexbox again */
      display: flex; /* turn on Flexbox */
      flex-direction: column; /* title, text, button stacked */
      gap: 0.5rem; /* 8px space between them */
      padding: 1rem; /* 16px inside space */
      background: #e8f0fe; /* light blue */
      border-radius: 8px; /* rounded corners */
    } /* end of .card */
    .card button { margin-top: auto; } /* push the button to the bottom of every card */
  </style> <!-- CSS ends -->
</head> <!-- end of settings -->
<body> <!-- visible part -->
  <nav class="nav"><strong>HireHub</strong><div><a href="#">Jobs</a><a href="#">Candidates</a></div></nav> <!-- Flexbox navbar -->
  <main class="gallery"> <!-- Grid gallery -->
    <div class="card"><h3>Frontend Dev</h3><p>React, TypeScript</p><button>Apply</button></div> <!-- card 1 -->
    <div class="card"><h3>Backend Dev</h3><p>Node.js, MongoDB, AWS, Docker, queues and caching</p><button>Apply</button></div> <!-- card 2, longer text -->
    <div class="card"><h3>QA Engineer</h3><p>Jest</p><button>Apply</button></div> <!-- card 3 -->
  </main> <!-- end of gallery -->
</body> <!-- end of visible part -->
</html> <!-- end of page -->
```

**What you see:**

```text
At 375px:  navbar in one row (logo left, links right). Cards stacked, 1 per row.
At 768px:  3 cards: 2 on the first row, 1 on the second. Columns line up.
At 1280px: 3 cards in one row, equal widths, same height.
Always:    the "Apply" buttons line up at the bottom of each card,
           even though card 2 has more text (Flexbox column + margin-top: auto).
```

## 🔍 Deeper version

**The comparison table:**

| | Flexbox | Grid |
|---|---|---|
| Dimensions | One (row **or** column) | Two (rows **and** columns) |
| Who decides size | Mostly the content (content-first) | Mostly the layout you define (layout-first) |
| Items line up across rows? | No, each line is separate | Yes, all rows share the same column lines |
| Great for | Navbars, toolbars, button groups, form rows, centring | Galleries, dashboards, page shells, calendars |
| Responsive trick | `flex-wrap: wrap` + `flex: 1 1 250px` | `repeat(auto-fit, minmax(250px, 1fr))` |
| Overlapping items | Hard | Easy: put two items in the same cell |

**The "wrapped row" test.** If items wrap onto a second line, ask: "Should they line up with the items above?"
- **Yes** → Grid. Columns stay aligned.
- **No, each line can be its own size** → Flexbox. For example, skill tags of different lengths.

**They nest.** A grid cell can be a flex container, and a flex item can be a grid. In the example: Grid for the gallery, Flexbox inside each card to push the button to the bottom.

**Equal-height cards.** Both give equal heights in one row. Grid also keeps rows aligned across the whole gallery. With subgrid (all major browsers since 2023), even the titles and buttons inside different cards can line up.

**In Tailwind and MUI.** Tailwind: `flex justify-between items-center` and `grid grid-cols-1 md:grid-cols-3 gap-4`. MUI: `<Stack direction="row">` is Flexbox, and `<Grid container>` is a 12-column layout built on Flexbox in v7 ([MUI layout](topic:mui-tailwind/mui-layout), [MUI Grid](topic:mui-tailwind/mui-grid)).

## 🎯 Why do we use it?

- **Picking the right tool means less CSS** and fewer hacks.
- **Flexbox** makes one-direction alignment and centring trivial.
- **Grid** keeps complex layouts aligned and easy to change per breakpoint.
- **Interviewers ask this a lot,** because it shows you understand layout, not just syntax.

## ⚠️ Common mistakes

- **Using Flexbox for a card gallery** and getting a stretched lonely last card. Use Grid.
- **Using Grid for a simple row of buttons.** Flexbox is shorter and clearer.
- **Thinking you must choose one per page.** Mix them: Grid outside, Flexbox inside.
- **Nesting many wrapper divs to fake columns** with Flexbox. That is a sign you need Grid.

## 🗣️ How to answer in an interview

> "Flexbox is one-dimensional: it lays items out in a row or a column, and the item sizes mostly come from their content. Grid is two-dimensional: I define rows and columns, and items are placed into them, so everything lines up across rows.
>
> I use Flexbox for navbars, toolbars, button groups and centring, and Grid for card galleries, dashboards and page layouts. A simple test: if items wrap and should line up with the row above, I use Grid.
>
> In practice I mix them. For example, Grid with auto-fit for a card gallery, and Flexbox column inside each card so the buttons line up at the bottom."

## 🔁 Follow-up questions

### Can Grid do everything Flexbox does?

Almost, but Flexbox is simpler for one-direction content where sizes come from the content, like tags or a navbar. Use the simplest tool for the job.

### How do you make all card buttons line up at the bottom?

Make each card a Flexbox column and give the button `margin-top: auto`. The auto margin pushes it to the bottom.

### Which one is better for performance?

Both are fast in modern browsers. Choose by layout needs, not speed. Huge, deeply nested layouts of either kind can be slow, but that is rare.

## ✅ Quick check

### 1. Logo on the left and three links on the right in a header. Flexbox or Grid?

:::answer
**Flexbox:** one row, with `justify-content: space-between`.
:::

### 2. A 12-card job gallery that should line up in neat columns. Flexbox or Grid?

:::answer
**Grid**, for example `repeat(auto-fit, minmax(260px, 1fr))`. Every row shares the same column lines.
:::

### 3. True or false: you should not use Flexbox inside a Grid.

:::answer
**False.** Nesting is normal: Grid for the overall layout, Flexbox inside each cell.
:::
