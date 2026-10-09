---
title: "Flexbox basics: direction, justify-content, align-items"
stack: responsive-design
order: 5
level: Basic
mustKnow: true
askedFrequency: very common
summary:
  - "Put display: flex on a parent, and its children line up in a row."
  - "flex-direction sets the main direction: row (side by side) or column (stacked)."
  - "justify-content places children ALONG the main direction; align-items places them ACROSS it."
  - "Centre anything: display: flex; justify-content: center; align-items: center."
  - "Mobile-first pattern: flex-direction: column on phones, row from 768px."
cards:
  - q: "justify-content vs align-items?"
    a: "justify-content works along the main direction (horizontal in a row). align-items works across it (vertical in a row)."
  - q: "How do you centre a box in the middle of its parent?"
    a: "On the parent: display: flex; justify-content: center; align-items: center. The parent needs a height for vertical centring to show."
  - q: "What does justify-content: space-between do?"
    a: "First child at the start, last child at the end, equal space between the others."
  - q: "What changes when flex-direction is column?"
    a: "The main direction becomes vertical, so justify-content now works top-to-bottom and align-items works left-to-right."
  - q: "What is the default flex-direction?"
    a: "row — children sit side by side, left to right."
---

## 💡 What is it?

**[Flexbox](glossary:flexbox)** is a CSS layout tool. It lines things up in **one direction**: a row or a column.

You put `display: flex` on a **parent**. Its children then line up in a row. Then you control the **direction**, the **spacing** and the **alignment**.

## 🏠 Real-life example

Think of **students standing in a line for assembly**.

- The **line** = the flex parent (`display: flex`).
- The **students** = the children (flex items).
- **Standing side by side or one behind another** = `flex-direction: row` or `column`.
- **Where the group stands along the line** (start, middle, end, spread out) = `justify-content`.
- **Lining up by shoulders, feet or middle** (tall and short students) = `align-items`.

## 🧑‍💻 Code example

Save as `index.html`, open it, and resize. Try 375px, 768px and 1280px in DevTools.

```html
<!DOCTYPE html> <!-- a modern HTML5 page -->
<html lang="en"> <!-- English page -->
<head> <!-- page settings -->
  <meta name="viewport" content="width=device-width, initial-scale=1"> <!-- use the real phone width -->
  <style> /* CSS starts */
    .toolbar { /* the parent box */
      display: flex; /* turn on Flexbox: children line up */
      flex-direction: column; /* PHONE: search box and buttons stacked top to bottom */
      gap: 1rem; /* 1rem = 16px space between children */
      padding: 1rem; /* 16px space inside the toolbar */
      background: #e8f0fe; /* light blue so you can see it */
    } /* end of .toolbar for phones */
    @media (min-width: 768px) { /* from 768px wide and bigger */
      .toolbar { /* change the toolbar on bigger screens */
        flex-direction: row; /* put the children side by side */
        justify-content: space-between; /* search on the left, buttons on the right */
        align-items: center; /* line them up vertically in the middle */
      } /* end of the change */
    } /* end of the media query */
    .center-box { /* a box that centres its child */
      display: flex; /* turn on Flexbox */
      justify-content: center; /* centre horizontally (along the row) */
      align-items: center; /* centre vertically (across the row) */
      height: 150px; /* give it a height so vertical centring is visible */
      background: #fff3cd; /* light yellow */
    } /* end of .center-box */
  </style> <!-- CSS ends -->
</head> <!-- end of settings -->
<body> <!-- visible part -->
  <div class="toolbar"> <!-- the toolbar parent -->
    <input placeholder="Search candidates"> <!-- a search box -->
    <div><button>Filter</button> <button>Add</button></div> <!-- a group of two buttons -->
  </div> <!-- end of toolbar -->
  <div class="center-box"><span>I am centred</span></div> <!-- a perfectly centred child -->
</body> <!-- end of visible part -->
</html> <!-- end of page -->
```

**What you see:**

```text
At 375px:  the search box on top, the buttons below it (stacked column).
At 768px:  search box on the LEFT, buttons on the RIGHT, both lined up in the middle.
At 1280px: same as 768px, just more space between them.
Always:    "I am centred" sits exactly in the middle of the yellow box.
```

## 🔍 Deeper version

**Two axes.** Flexbox has a **main axis** and a **cross axis**.
- The main axis follows `flex-direction`. In a `row` it is horizontal. In a `column` it is vertical.
- The cross axis is the other direction.

| Property | Works on | Common values |
|---|---|---|
| `flex-direction` | Sets the main axis | `row` (default), `column`, `row-reverse`, `column-reverse` |
| `justify-content` | Main axis | `flex-start`, `center`, `flex-end`, `space-between`, `space-around`, `space-evenly` |
| `align-items` | Cross axis (each line) | `stretch` (default), `center`, `flex-start`, `flex-end`, `baseline` |
| `align-self` | One child only | Same values as `align-items` |
| `gap` | Space between children | `1rem` = 16px ([Wrap and gap](topic:responsive-design/flexbox-wrap-gap)) |

**Memory trick:** **J**ustify = along the **J**ourney (main axis). **A**lign = **A**cross.

**`align-items: stretch` is the default.** In a row, children stretch to the same height. This is why equal-height cards are easy with Flexbox.

**Vertical centring needs height.** `align-items: center` centres across the parent's height. If the parent is only as tall as its content, there is nothing to see. Give the parent a height, or `min-height: 100dvh` for a full page.

**`baseline`** lines items up by their text baseline. It is handy when a label and a big number sit in one row.

**`row-reverse` is only visual.** It reverses the order on screen, but keyboard Tab order and screen readers still follow the HTML order. Don't use it to reorder important content.

## 🎯 Why do we use it?

- **Easy alignment.** Centring and spreading items used to need tricks. Now it is three lines.
- **Responsive switching.** Change one property, `flex-direction`, to go from stacked (phone) to side by side (laptop).
- **Equal heights** for cards in a row, by default.
- **Perfect for one-direction pieces:** navbars, toolbars, button groups, form rows.

## ⚠️ Common mistakes

- **Putting `display: flex` on the children** instead of the parent. The parent controls the layout.
- **Mixing up justify and align.** In a `column`, `justify-content` becomes vertical. Check the direction first.
- **Expecting vertical centring with no parent height.** Add a height or `min-height`.
- **Using Flexbox for a full grid of rows and columns.** That is what [Grid](topic:responsive-design/grid-basics) is for. See [Flexbox vs Grid](topic:responsive-design/flexbox-vs-grid).

## 🗣️ How to answer in an interview

> "Flexbox is a one-dimensional layout system. I set display: flex on the parent, and the children line up in a row by default. flex-direction picks the main axis, row or column. justify-content places items along the main axis, for example space-between to push them to the two ends. align-items places them across it, for example center to line them up vertically in a row.
>
> To centre anything, I use display flex with justify-content center and align-items center, and make sure the parent has a height.
>
> For responsive design I go mobile-first: flex-direction column on phones, then switch to row at a 768 pixel breakpoint. I use it for navbars, toolbars and button groups. For real rows-and-columns layouts I use Grid instead."

## 🔁 Follow-up questions

### What is the difference between `justify-content` and `justify-items`?

`justify-content` is for Flexbox (and also Grid) and places the whole group along the main axis. `justify-items` is for Grid only and places each item inside its cell. In Flexbox, `justify-items` does nothing.

### How do you push one item to the far right in a row?

Give that item `margin-left: auto`. The auto margin takes all the free space on its left, so it moves to the end.

### What is the difference between `align-items` and `align-content`?

`align-items` aligns items inside each line. `align-content` aligns the lines themselves, so it only matters when items wrap onto several lines.

## ✅ Quick check

### 1. A parent has `display: flex; flex-direction: column; justify-content: center;`. Which way are the children centred?

:::answer
**Vertically.** In a column, the main axis is vertical, so `justify-content` works top to bottom.
:::

### 2. Which three lines centre a child inside its parent?

:::answer
On the parent: `display: flex; justify-content: center; align-items: center;` (and the parent needs a height for vertical centring to show).
:::

### 3. What is the default `flex-direction`?

- A) `column`
- B) `row`

:::answer
**B.** `row`: children sit side by side, left to right.
:::
