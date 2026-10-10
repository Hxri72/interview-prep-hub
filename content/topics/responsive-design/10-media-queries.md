---
title: "Media queries: min-width vs max-width"
stack: responsive-design
order: 10
level: Basic
mustKnow: true
askedFrequency: very common
summary:
  - "A media query is an if-statement for CSS: \"if the screen is this wide, use these rules\"."
  - "min-width: 768px = \"768px and WIDER\". This is what mobile-first uses."
  - "max-width: 767px = \"767px and NARROWER\". Use it only for small fixes."
  - "Modern range syntax: @media (width >= 768px) means the same as (min-width: 768px)."
  - Pick breakpoints where YOUR design starts to look bad, not for a phone model.
cards:
  - q: What is a media query?
    a: A CSS rule that only applies when a condition is true, like "the screen is 768px or wider".
  - q: "What does @media (min-width: 768px) mean?"
    a: "Apply these styles when the screen is 768px wide or wider. It's the mobile-first way."
  - q: "What does @media (max-width: 767px) mean?"
    a: Apply these styles when the screen is 767px wide or narrower.
  - q: Why do mobile-first sites use min-width?
    a: You write phone styles first, with no media query. Then you add min-width rules that only add changes for bigger screens.
  - q: How do you choose a breakpoint?
    a: Make the window wider slowly. Where the design starts to look bad, put a breakpoint there. Don't pick a number for one phone model.
---

## 💡 What is it?

A **media query** is an "if" for CSS.

It says: "**If** the screen is this wide, **then** use these styles." The width where the design changes is called a [breakpoint](glossary:breakpoint).

There are two common kinds:
- `min-width: 768px` means "768px **and wider**".
- `max-width: 767px` means "767px **and narrower**".

## 🏠 Real-life example

Think of a **school uniform rule** that changes with age.

- **All students** wear a white shirt. That is the base rule.
- **"Class 8 and above"** also wear a tie. That is `min-width`. It applies from that point upward.
- **"Class 3 and below"** may wear sandals. That is `max-width`. It applies from that point downward.

Mapping:
- The **student's class** = the screen width.
- The **white shirt for everyone** = your base CSS, with no media query.
- **"Class 8 and above"** = `@media (min-width: 768px)`.
- **"Class 3 and below"** = `@media (max-width: 767px)`.

## 🧑‍💻 Code example

Save this as `index.html`. Open it in Chrome. Press F12, then click the phone icon to change the width.

```html
<!DOCTYPE html> <!-- tells the browser this is a modern HTML page -->
<html lang="en"> <!-- page language is English -->
<head> <!-- settings for the page -->
  <meta name="viewport" content="width=device-width, initial-scale=1"> <!-- page width = phone width, no zoom at start -->
  <style> /* our CSS starts here */
    body { font-family: sans-serif; margin: 0; padding: 16px; } /* simple font, 16px space around the page */
    .box { background: tomato; color: white; padding: 16px; } /* PHONE (base): red box, 16px inner space */
    .box::after { content: "Phone layout"; } /* show a label so we can see which rule wins */
    @media (min-width: 768px) { /* 768px AND WIDER (tablet and laptop) */
      .box { background: seagreen; } /* green box from 768px */
      .box::after { content: "Tablet or bigger"; } /* change the label */
    } /* end of the 768px rule */
    @media (min-width: 1280px) { /* 1280px AND WIDER (laptop) */
      .box { background: royalblue; } /* blue box from 1280px */
      .box::after { content: "Laptop or bigger"; } /* change the label again */
    } /* end of the 1280px rule */
    @media (max-width: 400px) { /* 400px AND NARROWER (small phones only) */
      .box { font-size: 14px; } /* slightly smaller text on tiny phones */
    } /* end of the small-phone fix */
  </style> <!-- CSS ends here -->
</head> <!-- end of settings -->
<body> <!-- what the user sees -->
  <div class="box"></div> <!-- one coloured box with a label -->
</body> <!-- end of visible content -->
</html> <!-- end of the page -->
```

**What you see:**

```text
375px  (phone)   → red box,   "Phone layout", 14px text (the max-width: 400px fix applies too)
768px  (tablet)  → green box, "Tablet or bigger"
1280px (laptop)  → blue box,  "Laptop or bigger"
```

**Why it works:** the min-width rules come **in order, small to big**. At 1280px, both the 768px and 1280px rules are true. The later one wins.

## 🔍 Deeper version

**Mobile-first vs desktop-first.**

| Style | Base CSS is for | Media queries use | Used by |
|---|---|---|---|
| Mobile-first | phones | `min-width` (grow up) | Tailwind, Mantine, most modern sites |
| Desktop-first | laptops | `max-width` (shrink down) | many older sites |

Mobile-first is easier. Phones get the simplest CSS. Bigger screens only *add* things.

**Order matters.** With `min-width`, write small → big. With `max-width`, write big → small. Otherwise an earlier rule can be overwritten by a later one, because CSS uses the last matching rule when specificity is equal.

**The 767 / 768 gap.** If you mix `max-width: 768px` and `min-width: 768px`, both are true at exactly 768px. Use `767px` for the max side, or use range syntax.

**Range syntax (Media Queries Level 4).** All modern browsers support it:

```css
@media (width >= 768px) { /* same as min-width: 768px */ }
@media (width < 768px) { /* below 768px, no 767/768 overlap */ }
@media (768px <= width < 1280px) { /* tablet only */ }
```

**Other useful media features:**
- `(orientation: landscape)`: the phone is turned sideways.
- `(hover: hover)`: the device has a mouse. Phones don't hover.
- `(prefers-reduced-motion: reduce)`: the user wants fewer animations.
- `(prefers-color-scheme: dark)`: the user's system is in dark mode.

**`em` breakpoints.** Some teams write `min-width: 48em` instead of `768px`. `em` in media queries is based on the browser's default font size (usually 16px). So the layout also changes when the user makes text bigger.

**Media query vs container query.** A media query looks at the **whole screen**. A [container query](topic:responsive-design/container-queries) looks at the **parent box**. Use container queries for reusable components.

## 🎯 Why do we use it?

One HTML page must look good on a 360px phone and a 1440px laptop.

Media queries let the **same page** change its layout at certain widths. You don't need a separate mobile site. Frameworks use the same idea: Tailwind's `md:` and Mantine's `md` key are media queries underneath.

## ⚠️ Common mistakes

- **Mixing min and max randomly.** Pick mobile-first (`min-width`) and stay with it.
- **Wrong order.** Writing the 1280px rule before the 768px rule. The 768px rule then wins on laptops.
- **Breakpoints for phone models** ("iPhone 15 width"). New phones come out every year. Break where your design breaks.
- **Forgetting the viewport meta tag.** Without it, phones pretend to be about 980px wide, so your phone styles never apply. See [the viewport meta tag](topic:responsive-design/viewport-meta).

## 🗣️ How to answer in an interview

> "A media query applies CSS only when a condition is true, usually the screen width. `min-width: 768px` means 768 and wider, and `max-width: 767px` means 767 and narrower. I work mobile-first: the base CSS is for phones, and I add `min-width` rules from small to big, so bigger screens only add changes. That's also how Tailwind's `md:` prefix and Mantine's breakpoints work. I choose breakpoints where my layout starts to look bad, not for a specific device. Modern browsers also support range syntax like `width >= 768px`, which avoids the 767/768 overlap. For reusable components I'd consider container queries, because they react to the parent's size instead of the screen."

## 🔁 Follow-up questions

### Why is mobile-first better than desktop-first?

Phones get the simplest CSS and download less override code. Bigger screens add features step by step. It also matches Tailwind and Mantine, so the whole team thinks the same way.

### Can two media queries be true at the same time?

Yes. At 1300px, both `min-width: 768px` and `min-width: 1280px` are true. Both apply, and if they set the same property, the later rule wins.

### What is the difference between a media query and a container query?

A media query checks the screen (viewport) size. A container query checks the size of a parent element. The same card can then look different in a wide main area and a narrow sidebar.

### How do you test media queries?

Chrome DevTools device mode at common widths like 360, 375, 768, 1024 and 1280. Then on a real phone. See [testing responsive pages](topic:responsive-design/testing-responsive).

## ✅ Quick check

### 1. The screen is 1000px wide. Which rule applies?

```css
.a { color: red; } /* base */
@media (min-width: 768px) { .a { color: green; } } /* 768 and wider */
@media (min-width: 1280px) { .a { color: blue; } } /* 1280 and wider */
```

:::answer
**Green.** 1000px is wider than 768 but narrower than 1280. Only the first media query is true.
:::

### 2. True or false: `@media (min-width: 768px)` applies only to tablets.

:::answer
**False.** It applies to 768px **and every width above it**, including laptops and big monitors.
:::

### 3. What does `@media (width < 768px)` mean in older syntax?

- A) `min-width: 768px`
- B) `max-width: 767px` (roughly; range syntax has no 767/768 gap)
- C) `max-width: 768px`

:::answer
**B.** "Narrower than 768px." Range syntax is exact, so it avoids the gap problem completely.
:::
