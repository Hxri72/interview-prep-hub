---
title: Container queries
stack: responsive-design
order: 11
level: Intermediate
mustKnow: false
askedFrequency: sometimes
summary:
  - A container query changes a component's style based on its PARENT's width, not the screen's width.
  - "Step 1: mark the parent with container-type: inline-size. Step 2: write @container (min-width: 400px) { … }."
  - The same card can look different in a wide main area and a narrow sidebar on the same screen.
  - "cqi = 1% of the container's width, like vw but for the container."
  - Supported in all modern browsers since 2023. Tailwind v4 has @container and @md: built in.
cards:
  - q: What is a container query?
    a: A CSS rule that applies when a parent element (the container) is a certain size, instead of when the whole screen is.
  - q: How do you make an element a container?
    a: "Give it container-type: inline-size. Then its children can use @container rules."
  - q: When is a container query better than a media query?
    a: For reusable components that appear in places of different widths, like a card in a main area and in a sidebar.
  - q: What is the cqi unit?
    a: 1% of the container's inline size (its width). 50cqi = half the container's width.
  - q: Why can't the container's own size depend on its children?
    a: That would create a loop. So the container's width must come from outside, and only its children react to it.
---

## 💡 What is it?

A **container query** is like a media query, but it looks at the **parent box**, not the whole screen.

You mark a parent as a **container**. Then its children can say: "if my container is at least 400px wide, use these styles".

It is perfect for **components** that appear in different places.

## 🏠 Real-life example

Think of a **school notice** that is pinned in two places.

- On the **big main board**, there is room. The notice shows a photo on the left and text on the right.
- On the **small board near the door**, it is narrow. The same notice puts the photo on top and the text below.

The notice doesn't care how big the school is. It only cares how big **its board** is.

Mapping:
- The **notice** = the card component.
- The **board** = the container (the parent element).
- **"If my board is wide, put the photo on the left"** = `@container (min-width: 400px)`.
- The **size of the whole school** = the screen width. Media queries look at that instead.

## 🧑‍💻 Code example

Save this as `index.html` and open it in Chrome. The same card appears twice: in a wide area and in a narrow sidebar.

```html
<!DOCTYPE html> <!-- modern HTML page -->
<html lang="en"> <!-- page language: English -->
<head> <!-- page settings -->
  <meta name="viewport" content="width=device-width, initial-scale=1"> <!-- fit the phone width -->
  <style> /* CSS starts */
    body { font-family: sans-serif; margin: 0; padding: 16px; } /* simple page spacing: 16px */
    .layout { display: grid; grid-template-columns: 1fr 220px; gap: 16px; } /* wide area + 220px sidebar, 16px gap */
    .slot { container-type: inline-size; } /* make each slot a container that tracks its WIDTH */
    .card { display: flex; flex-direction: column; gap: 8px; border: 1px solid #ccc; padding: 12px; } /* NARROW (base): photo on top, text below */
    .photo { background: #9ad; height: 80px; } /* a grey-blue box standing in for a photo, 80px tall */
    @container (min-width: 400px) { /* if THIS slot is 400px or wider */
      .card { flex-direction: row; } /* photo on the left, text on the right */
      .photo { width: 120px; height: auto; } /* photo becomes 120px wide */
    } /* end of the container rule */
  </style> <!-- CSS ends -->
</head> <!-- end of settings -->
<body> <!-- visible page -->
  <div class="layout"> <!-- two columns: main area and sidebar -->
    <div class="slot"> <!-- WIDE container -->
      <div class="card"><div class="photo"></div><p>Hari — Full stack developer</p></div> <!-- card in the wide slot -->
    </div> <!-- end of wide slot -->
    <div class="slot"> <!-- NARROW container (220px) -->
      <div class="card"><div class="photo"></div><p>Hari — Full stack developer</p></div> <!-- the SAME card in the sidebar -->
    </div> <!-- end of narrow slot -->
  </div> <!-- end of layout -->
</body> <!-- end of visible page -->
</html> <!-- end of page -->
```

**What you see at 1280px:**

```text
Main area (about 1000px wide) → card in a ROW: photo on the left, text on the right
Sidebar (220px wide)          → card in a COLUMN: photo on top, text below
Same screen, same card CSS, two different layouts.
```

## 🔍 Deeper version

**Two steps.**
1. Mark the parent: `container-type: inline-size`. "Inline size" means width, in left-to-right languages.
2. Query it: `@container (min-width: 400px) { … }`. Range syntax also works: `@container (width >= 400px)`.

**Named containers.** If containers are nested, give one a name and query that name:

```css
.sidebar { container: side / inline-size; } /* name "side", tracks width */
@container side (min-width: 300px) { .card { gap: 16px; } } /* only checks the container named "side" */
```

**Container units.** `cqi` = 1% of the container's width. `cqb` = 1% of its height (block size). Great for text that scales with the card:

```css
.card h2 { font-size: clamp(1rem, 5cqi, 1.5rem); } /* 5% of the card width, between 16px and 24px */
```

**The one rule.** A container's size **cannot depend on its children**. That would be a loop. So `inline-size` containers get their width from their parent, like a grid column.

**Media query vs container query:**

| | Media query | Container query |
|---|---|---|
| Looks at | the screen (viewport) | the parent element |
| Best for | page layout (sidebar shown or hidden) | reusable components (cards, widgets) |
| Setup | none | parent needs `container-type` |

**Support.** All major browsers since 2023 (Chrome 105+, Safari 16+, Firefox 110+).

**In Tailwind v4** it's built in. Mark the parent with `@container`, and use size variants on children:

```html
<div class="@container"> <!-- this div is now a container -->
  <div class="flex flex-col @md:flex-row"> <!-- column normally; row when the CONTAINER is md (28rem = 448px) or wider -->
  </div> <!-- end of card -->
</div> <!-- end of container -->
```

Note: Tailwind's container sizes (`@sm`, `@md`…) are **different numbers** from its screen breakpoints. `@md` is 28rem (448px), but `md:` is 768px.

## 🎯 Why do we use it?

Media queries only know the screen size. But a card might sit in a **wide** column on one page and a **narrow** sidebar on another, **on the same screen**.

With media queries, you'd need special classes for each place. With container queries, the component **adapts by itself**. That makes design-system components truly reusable.

## ⚠️ Common mistakes

- **Forgetting `container-type`** on the parent. Then `@container` rules never match.
- **Putting `container-type` on the element you're styling.** It must be on the **parent**. The element can't query itself.
- **Using `container-type: size`** when you only need width. `size` needs a fixed height too, or the box can collapse to 0 height.
- **Mixing up Tailwind's `@md:` and `md:`.** One is container size (448px), the other is screen size (768px).

## 🗣️ How to answer in an interview

> "A container query lets a component change its style based on its parent's size instead of the screen's. I mark the parent with `container-type: inline-size`, then write `@container (min-width: 400px)` rules for the children. It's great for reusable components, like a card that shows the image beside the text in a wide column, but stacks in a narrow sidebar, on the same screen. Media queries can't do that, because they only see the viewport. There are also container units like `cqi` for sizing text relative to the card. They've been supported in all modern browsers since 2023, and Tailwind v4 has `@container` and `@md:` variants built in. I still use media queries for the overall page layout."

## 🔁 Follow-up questions

### Do container queries replace media queries?

No. Media queries are still best for page-level layout, like showing or hiding the sidebar. Container queries are for components inside that layout.

### Why do we need `container-type` at all?

The browser needs to know which elements to measure. Measuring every element would be slow, and could create layout loops. So you opt in on purpose.

### What does `cqi` mean?

1% of the container's inline size (width). `10cqi` in a 300px card is 30px.

### Can I use container queries with Mantine or CSS-in-JS?

Yes. Container queries are plain CSS, so they work anywhere CSS works. Mantine's `Grid` and `SimpleGrid` accept `type="container"`, so their responsive values follow the parent's width instead of the screen. In CSS modules you write `@container` rules as usual.

## ✅ Quick check

### 1. Where must `container-type: inline-size` go?

- A) On the element whose style changes
- B) On its parent
- C) On `<body>` only

:::answer
**B.** On the parent. Children query the nearest container above them.
:::

### 2. The screen is 1440px wide. A card's container is 300px wide. Does `@container (min-width: 400px)` apply?

:::answer
**No.** Container queries ignore the screen. The container is only 300px, which is less than 400px.
:::

### 3. In Tailwind v4, is `@md:` the same width as `md:`?

:::answer
**No.** `@md:` checks the container (28rem = 448px). `md:` checks the screen (768px).
:::
