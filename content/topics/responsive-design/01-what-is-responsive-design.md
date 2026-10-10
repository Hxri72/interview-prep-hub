---
title: "What responsive design is; mobile-first"
stack: responsive-design
order: 1
level: Basic
mustKnow: true
askedFrequency: very common
summary:
  - "Responsive design means one page that changes its layout to fit any screen: phone, tablet or laptop."
  - "It uses flexible widths, Flexbox, Grid, media queries and images that shrink."
  - "Mobile-first means you write the phone styles first, then add rules for bigger screens with min-width."
  - "Tailwind and Mantine both work mobile-first, so this one idea helps everywhere."
  - "Always check the page at 375px (phone), 768px (tablet) and 1280px (laptop)."
cards:
  - q: "What is responsive design?"
    a: "One page that changes its layout to fit any screen size, using flexible widths, Flexbox, Grid, media queries and shrinking images."
  - q: "What does mobile-first mean?"
    a: "Write the CSS for phones first. Then add min-width media queries that change the layout on bigger screens."
  - q: "Why is mobile-first easier than desktop-first?"
    a: "Phone layouts are simple (one column). Adding columns for big screens is easier than removing them for small screens, and phones load less CSS they don't need."
  - q: "Which widths should you test?"
    a: "At least 375px (phone), 768px (tablet) and 1280px (laptop). Also check that nothing scrolls sideways."
  - q: "Is responsive design the same as having a separate mobile site?"
    a: "No. Responsive design is one page and one URL that adapts. A separate mobile site (like m.example.com) is a second site to build and maintain."
---

## 💡 What is it?

**Responsive design** means building **one page** that fits **every screen**.

On a phone, things stack in **one column**. On a laptop, they sit **side by side**. You write the code once, and it adapts.

**Mobile-first** is the usual way to do it. You write the phone styles first. Then you add extra rules for bigger screens.

## 🏠 Real-life example

Think of **water poured into different glasses**.

The same water fills a thin glass, a wide bowl or a big jug. It takes the shape of whatever holds it.

- The **water** = your page content (text, images, buttons).
- The **glasses** = different screens (phone, tablet, laptop).
- **Taking the shape of the glass** = the layout changing to fit the screen.
- **Starting with the smallest glass** = mobile-first. If it fits the small glass, a bigger glass is easy.

## 🧑‍💻 Code example

Save this as `index.html` and open it in your browser. Then make the window narrow and wide. Or press F12, click the phone icon, and try 375px, 768px and 1280px.

```html
<!DOCTYPE html> <!-- tells the browser this is a modern HTML5 page -->
<html lang="en"> <!-- the page is in English -->
<head> <!-- settings for the page, not shown on screen -->
  <meta charset="UTF-8"> <!-- use UTF-8 so all letters show correctly -->
  <meta name="viewport" content="width=device-width, initial-scale=1"> <!-- make the page as wide as the phone, no zoom at the start -->
  <style> /* our CSS starts here */
    .cards { /* the box that holds all the cards */
      display: flex; /* line the cards up using Flexbox */
      flex-direction: column; /* PHONE FIRST: cards stacked top to bottom */
      gap: 1rem; /* 1rem = 16px space between cards */
      padding: 1rem; /* 16px space inside the edges of the box */
    } /* end of .cards for phones */
    .card { /* one single card */
      background: #e8f0fe; /* light blue background */
      padding: 1rem; /* 16px space inside each card */
      border-radius: 8px; /* rounded corners, 8px curve */
    } /* end of .card */
    @media (min-width: 768px) { /* from 768px wide and bigger (tablet, laptop) */
      .cards { /* change the card box on bigger screens */
        flex-direction: row; /* put the cards side by side */
      } /* end of .cards change */
      .card { /* change each card on bigger screens */
        flex: 1; /* each card takes an equal share of the width */
      } /* end of .card change */
    } /* end of the media query */
  </style> <!-- our CSS ends here -->
</head> <!-- end of the settings -->
<body> <!-- everything visible goes inside body -->
  <div class="cards"> <!-- the box holding the cards -->
    <div class="card">Card 1</div> <!-- first card -->
    <div class="card">Card 2</div> <!-- second card -->
    <div class="card">Card 3</div> <!-- third card -->
  </div> <!-- end of the card box -->
</body> <!-- end of the visible part -->
</html> <!-- end of the page -->
```

**What you see:**

```text
At 375px (phone):   Card 1
                    Card 2        ← one column, stacked
                    Card 3

At 768px (tablet):  [ Card 1 ] [ Card 2 ] [ Card 3 ]   ← side by side, equal widths

At 1280px (laptop): [  Card 1  ] [  Card 2  ] [  Card 3  ]   ← same row, just wider
```

## 🔍 Deeper version

**The tools of responsive design:**

| Tool | What it does | Topic |
|---|---|---|
| Viewport meta tag | Makes phones use the real screen width | [Viewport](topic:responsive-design/viewport-meta) |
| Relative units (`%`, `rem`, `vw`) | Sizes that grow and shrink | [Units](topic:responsive-design/units) |
| Flexbox | Lines things up in one row or one column | [Flexbox](topic:responsive-design/flexbox-basics) |
| Grid | Rows and columns together | [Grid](topic:responsive-design/grid-basics) |
| Media queries | "If the screen is this wide, change this" | [Media queries](topic:responsive-design/media-queries) |
| Container queries | Same idea, but checks the parent box size | [Container queries](topic:responsive-design/container-queries) |
| Responsive images | Images shrink and load the right size | [Images](topic:responsive-design/responsive-images) |

**Mobile-first vs desktop-first.**
- **Mobile-first:** base CSS is for phones. You add `@media (min-width: …)` rules. Each rule *adds* layout for bigger screens.
- **Desktop-first:** base CSS is for laptops. You add `@media (max-width: …)` rules. Each rule *takes away* layout for smaller screens.

Mobile-first is the common choice today. Phones get the simplest CSS. And [Tailwind](topic:responsive-design/tailwind-breakpoints) and [Mantine](topic:responsive-design/mantine-breakpoints) both work this way. In Tailwind, `md:flex-row` means "from 768px **and up**". In Mantine, `{ base: 'column', md: 'row' }` means the same idea.

**Choose breakpoints by content, not by phone model.** A [breakpoint](glossary:breakpoint) is a width where the design changes. Make the window wider slowly. When the layout starts to look bad, that is your breakpoint. Don't design for "iPhone 15" — new phones come out every year.

**Responsive is more than layout.** It also means:
- buttons big enough for a thumb (about 44×44px),
- nothing that only works on mouse hover (phones have no hover),
- text still readable when zoomed to 200%,
- no sideways scrolling at any width.

## 🎯 Why do we use it?

- **Most users are on phones.** A page that only works on a laptop loses them.
- **One codebase.** You don't build and fix two separate sites.
- **One URL.** Links and search engines work the same for everyone. Google also ranks mobile-friendly pages better.
- **Future screens.** Flexible layouts keep working on screen sizes that don't exist yet.

## ⚠️ Common mistakes

- **Forgetting the viewport meta tag.** Phones then show a tiny, zoomed-out desktop page.
- **Fixed widths** like `width: 1200px`. On a phone this causes sideways scrolling. Use `max-width` and `%` instead.
- **Thinking `md:` means "only tablets".** In mobile-first systems, it means "tablets **and everything bigger**".
- **Testing only on your laptop.** Always check 375px, 768px and 1280px, and a real phone too.

## 🗣️ How to answer in an interview

> "Responsive design means one page that adapts its layout to any screen size. I use flexible units like percent and rem, Flexbox for one-direction layouts, Grid for rows and columns, media queries for breakpoints, and images with max-width 100% so they shrink.
>
> I work mobile-first. I write the phone layout first, usually one column, then add min-width media queries to add columns on bigger screens. Tailwind and Mantine both follow this, so md:flex-row in Tailwind means 'from 768px and up'.
>
> I pick breakpoints where the content starts to look bad, not for a specific phone. And I test at 375, 768 and 1280 pixels in DevTools, check for sideways scrolling, and try a real phone."

[FILL IN: one screen you made responsive at work, e.g. a recruiter list that becomes cards on phones.]

## 🔁 Follow-up questions

### Mobile-first or desktop-first — which do you use and why?

Mobile-first. Phone CSS stays simple, and bigger screens only add rules. It also matches how Tailwind and Mantine breakpoints work, so the same thinking applies everywhere.

### What is the difference between responsive and adaptive design?

Responsive layouts are fluid. They stretch smoothly at every width. Adaptive design picks from a few fixed layouts, one per breakpoint. Most modern sites are responsive, with a few breakpoints.

### How do you find the element causing sideways scrolling?

Add `* { outline: 1px solid red; }` for a moment. Every box gets a red border, and the too-wide one stands out. Fixed widths, long words and wide images are the usual causes.

### How do you show a big data table on a phone?

Either let it scroll sideways inside its own box (`overflow-x: auto`), or show each row as a card on small screens.

## ✅ Quick check

### 1. In mobile-first CSS, which media query do you mostly use?

- A) `@media (max-width: 767px)`
- B) `@media (min-width: 768px)`

:::answer
**B.** Mobile-first starts with phone styles and adds rules for screens **768px and wider** with `min-width`.
:::

### 2. True or false: `md:flex-row` in Tailwind applies only to tablets.

:::answer
**False.** It applies from 768px **and every bigger screen**, including laptops and big monitors.
:::

### 3. Why is `width: 1200px` on a container a problem?

:::answer
On a 375px phone, the box is wider than the screen, so the page scrolls sideways. Use `max-width: 1200px` with `width: 100%` instead.
:::
