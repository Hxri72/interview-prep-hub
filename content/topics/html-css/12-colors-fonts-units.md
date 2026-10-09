---
title: Colours, fonts and units overview
stack: html-css
order: 12
level: Basic
mustKnow: false
askedFrequency: sometimes
summary:
  - "Colours can be written as names (red), hex (#1f5f99), rgb() or hsl(). Modern CSS also has oklch() for nicer colours."
  - Fonts are chosen with font-family, plus a fallback list that ends in a generic family like sans-serif.
  - px is fixed. rem follows the page's base font size (usually 16px), so it is the best default for text and spacing.
  - em follows the parent's font size and can grow when nested. % follows the parent's size.
  - Use enough contrast between text and background (at least 4.5 to 1 for normal text).
cards:
  - q: What does #1f5f99 mean?
    a: A hex colour. The pairs are red (1f), green (5f) and blue (99), each from 00 (none) to ff (full).
  - q: rem vs em?
    a: rem is based on the root (html) font size, usually 16px, so it is predictable. em is based on the parent's font size, so it can grow when elements are nested.
  - q: Why end a font list with sans-serif?
    a: It is a generic fallback. If none of the named fonts are available, the browser still uses some sans-serif font.
  - q: What is a good minimum contrast for normal text?
    a: "4.5 : 1 (WCAG AA). Large text needs at least 3 : 1."
  - q: Why prefer rem over px for font sizes?
    a: If a user sets a bigger default font size in the browser, rem sizes grow with it. px sizes ignore that setting.
---

## 💡 What is it?

Every page needs **colours**, **fonts** and **sizes**.

CSS gives you a few ways to write each one. For example, the same blue can be written as `#1f5f99` or `rgb(31 95 153)`.

Sizes use **units** like `px`, `rem`, `em` and `%`. Picking the right unit makes your page easier to read and easier to resize.

## 🏠 Real-life example

Think of **making a school poster**.

- **Colours** = your paint box. You can call a colour "red", or mix it from exact amounts of red, green and blue paint.
- **Fonts** = the handwriting style. If you can't find your favourite pen, you use any pen that's close (a fallback).
- **px** = a ruler in centimetres. 2 cm is always 2 cm.
- **rem** = "times the size of the main title on the class board". Change the board title size, and everything changes with it.
- **em** = "times the size of the box I'm writing in". Boxes inside boxes make the text grow, step by step.

## 🧑‍💻 Code example

Save this as `index.html` and open it in your browser.

```html
<!DOCTYPE html>                                   <!-- modern HTML page -->
<html lang="en">                                  <!-- page language = English -->
<head>                                            <!-- page settings -->
  <style>                                         /* CSS starts here */
    html { font-size: 16px; }                     /* base size; 1rem = 16px from now on */
    body {                                        /* style the whole page */
      font-family: "Inter", Arial, sans-serif;    /* try Inter, then Arial, then any sans-serif font */
      color: #1e293b;                             /* hex colour: dark slate text */
      background: rgb(248 250 252);               /* rgb(red green blue), each 0–255: very light grey */
    }                                             /* end of body */
    .brand { color: hsl(210 66% 36%); }           /* hsl(hue saturation lightness): a deep blue */
    .px    { font-size: 20px; }                   /* always 20 pixels */
    .rem   { font-size: 1.25rem; }                /* 1.25 × 16px = 20px, follows the base size */
    .outer { font-size: 1.25em; }                 /* 1.25 × parent size (16px) = 20px */
    .outer .outer { font-size: 1.25em; }          /* nested: 1.25 × 20px = 25px — it grows! */
    .half  { width: 50%; background: #e2e8f0; }   /* 50% of the parent's width; light grey box */
  </style>                                        <!-- CSS ends here -->
</head>                                           <!-- end of head -->
<body>                                            <!-- visible content -->
  <h1 class="brand">Colours and units</h1>        <!-- blue heading -->
  <p class="px">I am 20px (fixed).</p>            <!-- fixed size -->
  <p class="rem">I am 1.25rem = 20px.</p>         <!-- same size, but follows the base -->
  <div class="outer">1.25em = 20px                <!-- first level -->
    <div class="outer">nested 1.25em = 25px</div> <!-- second level: bigger -->
  </div>                                          <!-- end outer -->
  <div class="half">I am 50% wide.</div>          <!-- half the page width -->
</body>                                           <!-- end of body -->
</html>                                           <!-- end of page -->
```

**What you see:**

```text
A blue heading on a very light grey page.
"20px" and "1.25rem" lines look the same size.
The nested em line is bigger than its parent line (25px vs 20px).
A grey box that is half the width of the page.
Try: browser settings → font size "Large". The rem line grows. The px line does not.
```

## 🔍 Deeper version

**Colours:**

| Format | Example | Notes |
|---|---|---|
| Name | `red`, `royalblue` | Easy, but only ~140 names |
| Hex | `#1f5f99`, `#fff` | Pairs of red, green, blue in base 16; 8 digits adds alpha (transparency) |
| `rgb()` | `rgb(31 95 153 / 50%)` | 0–255 per channel; `/ 50%` = half transparent |
| `hsl()` | `hsl(210 66% 36%)` | Hue (0–360 on a colour wheel), saturation, lightness. Easy to make lighter/darker |
| `oklch()` | `oklch(0.5 0.12 250)` | Modern; equal steps look equally bright to the eye; wider colours |
| `color-mix()` | `color-mix(in srgb, blue 40%, white)` | Mix two colours in CSS |

`currentColor` means "use the text colour". It's handy for icons and borders.

**Fonts:**
- `font-family` takes a **fallback list**. Always end with a generic family: `serif`, `sans-serif`, `monospace`, or `system-ui`.
- Web fonts load with `@font-face` or a link to a font service. Use `font-display: swap`. It shows a fallback font first, then swaps when the web font arrives, so text is never invisible.
- `line-height: 1.5` (no unit) means 1.5 × the font size. A number without a unit is the safest choice.
- `font-weight`: 400 = normal, 700 = bold.

**Units:**

| Unit | Based on | Good for |
|---|---|---|
| `px` | fixed | borders, tiny fixed details |
| `rem` | root `html` font size (16px by default) | font sizes, spacing — best default |
| `em` | parent's font size | padding that should grow with a button's own text |
| `%` | parent's size | widths |
| `vw` / `vh` | 1% of the screen width / height | big hero sections |
| `dvh` | 1% of the **dynamic** screen height | full-height sections on phones (address bar changes) |
| `ch` | width of the "0" character | max line length, e.g. `max-width: 65ch` |

More on units for screen sizes: [responsive units](topic:responsive-design/units).

**Contrast.** WCAG (the web accessibility rules) asks for at least **4.5 : 1** for normal text and **3 : 1** for large text. Chrome DevTools shows the contrast ratio when you click a colour.

## 🎯 Why do we use it?

- **Readable pages.** Good colours and contrast mean everyone can read the text, including people with weak eyesight.
- **One look across the app.** A small set of colours and fonts makes the product feel professional.
- **Respecting user settings.** `rem` sizes follow the user's browser font size. That matters for accessibility.
- **Easier changes.** With `rem` and CSS variables, you change one value, and the whole page updates.

## ⚠️ Common mistakes

- **Using `px` for all font sizes.** Users who increase the browser's font size get no bigger text.
- **Nested `em` surprise.** Text keeps growing inside nested elements. Use `rem` for font sizes.
- **No generic fallback font.** If the web font fails, the browser picks a random default.
- **Light grey text on white.** It looks stylish but fails contrast rules.

## 🗣️ How to answer in an interview

> "For colours I mostly use hex or hsl, and I keep them in CSS variables or the theme, so the app uses one palette. hsl is nice because I can make a colour lighter or darker by changing one number. Modern CSS also supports oklch, which gives more even-looking colour steps.
>
> For fonts I always give a fallback list that ends in a generic family like sans-serif, and I use font-display swap for web fonts.
>
> For units, I use rem for font sizes and spacing. rem follows the root font size, so if the user increases their browser font size, the whole layout scales. em follows the parent, so it grows when nested; I only use it when something should scale with its own text, like button padding. px is for borders. And I check text contrast is at least 4.5 to 1."

## 🔁 Follow-up questions

### What is the difference between `vh` and `dvh`?

`vh` uses the full screen height, ignoring the phone's address bar, so a `100vh` section can be cut off on phones. `dvh` follows the visible height as the bar shows and hides.

### Why is `line-height: 1.5` better than `line-height: 24px`?

A plain number is multiplied by each element's own font size. A fixed `24px` stays 24px even for big headings, so the lines overlap.

### What does `font-display: swap` do?

It shows the text in a fallback font straight away. When the web font finishes loading, the browser swaps it in. Without it, text can be invisible for a moment.

### How do you set a 62.5% base font size, and should you?

`html { font-size: 62.5%; }` makes 1rem = 10px, which makes maths easy. Many teams now avoid it and just think "1rem = 16px", because some third-party components assume the 16px default.

## ✅ Quick check

### 1. The parent has `font-size: 20px`. The child has `font-size: 1.5em`. The root is 16px. How big is the child's text?

:::answer
**30px.** em follows the parent: 1.5 × 20px = 30px. (With `1.5rem` it would be 1.5 × 16px = 24px.)
:::

### 2. Which colour is half transparent?

- A) `rgb(0 0 0)`
- B) `rgb(0 0 0 / 50%)`
- C) `#000000`

:::answer
**B.** The `/ 50%` part is the alpha (transparency). A and C are solid black.
:::
