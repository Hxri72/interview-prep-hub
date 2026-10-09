---
title: Layout breaks on mobile
template: scenario
stack: debugging
order: 14
level: Basic
mustKnow: false
askedFrequency: common
summary:
  - "Symptom: on a phone, the page scrolls sideways, text overlaps, or buttons go off the screen."
  - "Detect: Chrome DevTools device mode at 360–414px wide; look for a horizontal scrollbar."
  - "Debug: find the too-wide element — a fixed width, a big image, a long word or a table — with a temporary red outline on everything."
  - "Fix: flexible widths, max-width 100% on images, flex-wrap or grid, media queries (or Tailwind sm/md prefixes), and scrolling boxes for tables."
  - "Prevent: design mobile-first, check 360/375/768/1280 px on every change, and test on a real phone."
cards:
  - q: What is the quickest way to find the element that makes a page scroll sideways?
    a: "Add * { outline: 1px solid red; } for a moment. Every box gets a red border, so the one sticking out past the screen edge is easy to see."
  - q: Name four common causes of a broken mobile layout.
    a: A fixed width in px, an image without max-width 100%, a long word or URL that doesn't wrap, and a wide table. A missing viewport meta tag is another.
  - q: How do you make a wide table work on a phone?
    a: Put it inside a box with overflow-x auto so only the table scrolls sideways, or show each row as a card on small screens.
  - q: What does mobile-first mean?
    a: Write the styles for phones first, then add min-width media queries (or Tailwind md:, lg:) for bigger screens.
  - q: What does the viewport meta tag do?
    a: It tells the phone to use the real screen width instead of pretending to be a wide desktop and zooming out.
---

## 💡 What is it?

The page looks fine on a laptop. On a phone:

- the page **scrolls sideways**,
- text and buttons **overlap**,
- a button or a table **goes off the screen**,
- or everything looks **tiny and zoomed out**.

The layout is not **responsive**. Some element is wider than the phone screen, or the design only works for big screens.

## 🏠 Real-life example

Think of **packing a school bag**.

Most books fit. But one ruler is longer than the bag, so the zip won't close. The whole bag looks broken because of **one long thing**.

- **The bag** = the phone screen.
- **The books** = normal elements that fit.
- **The long ruler** = one element with a fixed width, a big image or a long word.
- **The open zip** = the page scrolling sideways.
- **Folding the ruler or using a smaller one** = making that element flexible.

## 🔎 Detect

1. Open Chrome DevTools (F12) and click the **phone icon** (device mode).
2. Check common widths: **360, 375, 414** (phones), **768** (tablet), **1280** (laptop).
3. Look for a **horizontal scrollbar**, or drag the page sideways with the mouse.
4. Open the page on a **real phone** too. Touch and the on-screen keyboard behave differently.

## 🐞 Debug

**Find the element that's too wide.** Add this CSS for a moment:

```css
* { outline: 1px solid red; } /* every box gets a red line; the one past the edge is the culprit */
```

Then check the usual suspects:

| Cause | Example |
|---|---|
| Fixed width | `width: 600px` on a card or form |
| Image or video | an `<img>` without `max-width: 100%` |
| Long word or URL | an email or link with no spaces |
| Table | many columns that can't shrink |
| Row that doesn't wrap | `display: flex` without `flex-wrap: wrap` |
| Missing viewport tag | the whole page looks zoomed out |
| `100vw` | includes the scrollbar width, so it's slightly too wide |

In DevTools, select the element and check the **Computed** tab. It shows the real width and which rule set it.

## 🔧 Fix

**Before — fixed widths and no wrapping:**

```css
.card { width: 600px; }                       /* ❌ always 600px, wider than a 375px phone */
.toolbar { display: flex; }                   /* ❌ items stay in one long row */
img { width: 800px; }                         /* ❌ image wider than the screen */
```

**After — flexible and mobile-first:**

```css
.card { width: 100%; max-width: 600px; }      /* ✅ full width on phones, at most 600px on big screens */
.toolbar { display: flex; flex-wrap: wrap; gap: 0.5rem; } /* ✅ items move to the next line if needed */
img { max-width: 100%; height: auto; }        /* ✅ never wider than its box; keeps its shape */
.email { overflow-wrap: anywhere; }           /* ✅ long words and URLs can break onto a new line */
.table-wrap { overflow-x: auto; }             /* ✅ only the table scrolls sideways, not the whole page */
@media (min-width: 768px) {                   /* from 768px wide and bigger (tablets, laptops) */
  .toolbar { flex-wrap: nowrap; }             /* one row is fine on bigger screens */
}                                             /* end of media query */
```

**The same idea with Tailwind (phone first, then `md:` for 768px and up):**

```jsx
<div className="flex flex-col gap-2 md:flex-row">        {/* stacked on phones, one row from 768px */}
  <input className="w-full md:w-80" />                   {/* full width on phones, 320px from 768px */}
  <button className="w-full md:w-auto">Search</button>  {/* full-width button on phones */}
</div>                                                   // end of the toolbar
```

**And make sure the page has the viewport tag:**

```html
<meta name="viewport" content="width=device-width, initial-scale=1"> <!-- use the real phone width -->
```

## 🛡️ Prevent

- **Design mobile-first:** phone styles first, then `min-width` media queries or Tailwind `md:` / `lg:`.
- Use **flexible units**: `%`, `rem`, `max-width`, `minmax()` in Grid, instead of fixed `px` widths for layout.
- Give every image `max-width: 100%`.
- Wrap tables in a scrolling box, or show rows as cards on phones.
- Check **360, 375, 768 and 1280 px** before every merge. Open it on a real phone sometimes.
- If you use **both Tailwind and Material UI**, make their breakpoints match. Tailwind `md` = 768px, MUI `md` = 900px by default.

## 🗣️ How to answer in an interview

**Short version (20 seconds):**

> "I open DevTools device mode at phone widths and look for sideways scrolling. A temporary red outline on every element shows which box is too wide. Usually it's a fixed width, an image without max-width, a long word or a table. I fix it with flexible widths, flex-wrap or grid, max-width 100% on images, and media queries, and I test at 360 to 1280 pixels."

**Full version:**

> "First I reproduce it in Chrome's device mode at 360 and 375 pixels, and on a real phone if I can. A horizontal scrollbar tells me something is wider than the screen.
>
> To find it, I add an outline to every element for a moment. The box sticking past the edge is the culprit, and the Computed tab shows which CSS rule gives it that width. Common causes are fixed pixel widths, images without max-width, long URLs that don't wrap, flex rows without wrap, and wide tables. I also check the viewport meta tag.
>
> I fix it mobile-first: flexible widths with max-width, flex-wrap or grid, images at max-width 100%, overflow-wrap for long text, and a scrolling wrapper for tables. In Tailwind that's prefixes like md:flex-row.
>
> To prevent it, we check fixed widths in reviews and test the main breakpoints before merging."

[FILL IN: a real mobile layout bug you fixed with MUI or Tailwind, if you have one. Only add it if it's true.]

## 🔁 Follow-up questions

### Flexbox or Grid for a card list that must fit any screen?

Grid with `repeat(auto-fit, minmax(260px, 1fr))`. It fits as many columns as possible, each at least 260px, with no media queries. Flexbox is best for one row or one column.

### Why is `100vw` sometimes a problem?

`100vw` includes the width of the vertical scrollbar on desktop. So an element with `width: 100vw` is slightly wider than the visible page and causes sideways scrolling. Use `100%` instead.

### How do you handle a big data table on a phone?

Two common ways: put it in a box with `overflow-x: auto`, or show each row as a card on small screens. In MUI, `useMediaQuery(theme.breakpoints.down('md'))` can switch between the two.

### What do you check besides width?

Tap targets (about 44 × 44 px), text size (at least 16px for inputs, or iOS zooms in), hover-only features (phones have no hover), and the on-screen keyboard covering inputs.

## ✅ Quick check

### 1. An image is 900px wide and the page scrolls sideways on phones. Which CSS fixes it?

- A) `img { width: 900px; }`
- B) `img { max-width: 100%; height: auto; }`
- C) `img { display: none; }`

:::answer
**B.** The image can never be wider than its box, and `height: auto` keeps its shape.
:::

### 2. In Tailwind, what does `w-full md:w-80` mean?

:::answer
**Full width on all screens, but 20rem (320px) from 768px wide and up.** No prefix applies to every screen; `md:` applies from 768px and bigger.
:::
