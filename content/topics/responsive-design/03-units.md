---
title: "Units: px, %, rem, em, vw, vh"
stack: responsive-design
order: 3
level: Basic
mustKnow: true
askedFrequency: very common
summary:
  - "px is a fixed size. % is a part of the parent. rem follows the page's base font size (usually 16px)."
  - "em follows the parent's font size, so it can grow unexpectedly when nested. Prefer rem."
  - "vw and vh are 1% of the screen width and height. 100vw = full width, 100vh = full height."
  - "On phones, use dvh/svh instead of vh for full-height sections, because the browser bar changes the height."
  - "Rule of thumb: rem for fonts and spacing, % or fr for widths, px for borders."
cards:
  - q: "What is 2rem if the base font size is 16px?"
    a: "32px. rem = root em, a multiple of the <html> font size."
  - q: "rem vs em?"
    a: "rem follows the root (html) font size, so it is predictable. em follows the parent's font size, so nested ems multiply and grow."
  - q: "What does 50% width mean?"
    a: "Half of the parent element's width."
  - q: "What is 100vh, and why can it be a problem on phones?"
    a: "100vh is the full screen height. On phones, the address bar shows and hides, so 100vh can be taller than the visible area. Use 100dvh or 100svh."
  - q: "Why use rem for font sizes instead of px?"
    a: "If a user sets a bigger default font in the browser, rem sizes grow with it. px sizes ignore that setting."
---

## 💡 What is it?

CSS **units** say how big something is.

- **Fixed units** never change: `px`.
- **Relative units** depend on something else: the parent (`%`, `em`), the page font (`rem`) or the screen (`vw`, `vh`).

Relative units are the heart of responsive design. They let sizes grow and shrink with the screen.

## 🏠 Real-life example

Think of **measuring with different things**.

- **px** = a ruler. 10 cm is always 10 cm.
- **%** = "half of the cake". It depends on how big the cake is.
- **rem** = "2 cups", where everyone uses the same kitchen cup. Predictable.
- **em** = "2 of your mother's cups". If her cup is bigger, your 2 cups are bigger. And her mother's cup may be bigger still.
- **vw / vh** = "half of the classroom wall". It depends on the room you are standing in.

## 🧑‍💻 Code example

Save as `index.html`, open it, and resize the window. Try 375px, 768px and 1280px in DevTools.

```html
<!DOCTYPE html> <!-- a modern HTML5 page -->
<html lang="en"> <!-- English page -->
<head> <!-- page settings -->
  <meta name="viewport" content="width=device-width, initial-scale=1"> <!-- use the real phone width -->
  <style> /* CSS starts */
    html { font-size: 16px; } /* the root font size: 1rem = 16px (the browser default) */
    .px   { width: 300px; background: #fde2e2; } /* always 300px wide, even on a tiny phone */
    .pct  { width: 50%;   background: #e2f0fd; } /* half of the parent's width */
    .rem  { font-size: 2rem; } /* 2 x 16px = 32px text */
    .vw   { width: 50vw;  background: #e2fde8; } /* half of the browser window's width */
    .hero { height: 50dvh; background: #fff3cd; } /* half of the visible screen height (dvh = dynamic viewport height) */
    .parent { font-size: 20px; } /* the parent's text is 20px */
    .em   { font-size: 1.5em; } /* 1.5 x the parent's 20px = 30px */
    div { padding: 0.5rem; margin-bottom: 0.5rem; } /* every box: 8px inside space, 8px gap below */
  </style> <!-- CSS ends -->
</head> <!-- end of settings -->
<body> <!-- visible part -->
  <div class="px">300px wide (fixed)</div> <!-- fixed-width box -->
  <div class="pct">50% of the parent</div> <!-- percentage box -->
  <div class="vw">50vw = half the window</div> <!-- viewport-width box -->
  <div class="rem">2rem text = 32px</div> <!-- big text using rem -->
  <div class="parent">Parent 20px <span class="em">1.5em = 30px</span></div> <!-- em depends on the parent -->
  <div class="hero">50dvh tall = half the visible screen</div> <!-- a tall box using dvh -->
</body> <!-- end of visible part -->
</html> <!-- end of page -->
```

**What you see:**

```text
At 375px:  the pink 300px box is almost the full screen width.
           the blue 50% box and green 50vw box are about 180px wide.
At 768px:  the pink box is still 300px. blue and green grow to about 380px.
At 1280px: the pink box is still 300px. blue and green are about 630px.
At every width: the "2rem" text is 32px, the "1.5em" text is 30px.
The yellow box is always half the visible screen height.
```

## 🔍 Deeper version

**The full table:**

| Unit | Based on | Best used for |
|---|---|---|
| `px` | Fixed CSS pixel | Borders, shadows, small fixed things |
| `%` | The parent's size (for width: the parent's width) | Widths that should shrink and grow |
| `rem` | The `<html>` font size (usually 16px) | Font sizes, padding, margin, gaps |
| `em` | The current element's font size (inherited from the parent) | Spacing that should scale with that element's text, e.g. button padding |
| `vw` / `vh` | 1% of the viewport width / height | Full-width sections, big headings |
| `dvh` / `svh` / `lvh` | Dynamic / small / large viewport height | Full-screen sections on phones |
| `fr` | One share of the free space in a Grid | Grid columns ([Grid basics](topic:responsive-design/grid-basics)) |
| `ch` | Width of the "0" character | Limiting line length, e.g. `max-width: 65ch` |

**Why `em` "grows unexpectedly".** Each `em` multiplies by its parent's font size. Nest three elements with `font-size: 1.2em`, and the inner one is 1.2 × 1.2 × 1.2 = 1.73 times bigger. `rem` always looks at the root, so it never compounds.

**The phone `vh` problem.** Mobile browsers show and hide the address bar as you scroll. `100vh` uses the **largest** height (bar hidden). So a `100vh` hero can be cut off behind the bar. New units fix this:
- `svh` — small viewport height (bar visible). Never too tall.
- `lvh` — large viewport height (bar hidden).
- `dvh` — dynamic: updates as the bar shows and hides.

:::version[Version note]
`dvh`, `svh` and `lvh` have worked in all major browsers since 2023. Old tutorials only show `vh`.
:::

**`100vw` and scrollbars.** On desktop, `100vw` includes the scrollbar width. A `width: 100vw` box can be a little wider than the page and cause sideways scrolling. Use `width: 100%` for "full width" boxes.

**rem respects user settings.** People with poor eyesight often set their browser's default font to 20px or more. If your fonts use `rem`, the whole page grows for them. With `px`, it ignores their setting.

**Related topics:** [min(), max() and clamp()](topic:responsive-design/min-max-clamp) combine these units, like `clamp(1.5rem, 4vw, 3rem)`. In Tailwind, `p-4` = 1rem = 16px ([Tailwind classes](topic:mui-tailwind/tailwind-classes)). In MUI, 1 spacing unit = 8px ([sx spacing](topic:mui-tailwind/sx-spacing)).

## 🎯 Why do we use it?

- **Layouts that fit any screen.** `%` and `vw` stretch with the screen; `px` doesn't.
- **Accessible text.** `rem` grows when users raise their browser font size.
- **Consistent spacing.** A spacing scale in `rem` (0.5rem, 1rem, 2rem) keeps the design tidy.

## ⚠️ Common mistakes

- **Fixed `px` widths** on big boxes. They overflow on phones. Use `%`, `max-width` or Grid.
- **Nesting `em` font sizes** and getting huge text. Use `rem` for font sizes.
- **`100vh` full-screen sections on phones** that hide behind the browser bar. Use `100dvh` or `100svh`.
- **`width: 100vw`** causing a sideways scrollbar on desktop. Use `width: 100%`.

## 🗣️ How to answer in an interview

> "px is a fixed size. Percent is relative to the parent. rem is relative to the root font size, usually 16 pixels, so 2rem is 32 pixels. em is relative to the parent's font size, so nested ems can compound, which is why I prefer rem for fonts and spacing. vw and vh are one percent of the viewport width and height.
>
> My rule of thumb: rem for font sizes and spacing, percent or Grid fr for widths, px for borders. rem also respects the user's browser font setting, which helps accessibility.
>
> On phones, 100vh can be taller than what you see because of the address bar, so for full-screen sections I use 100dvh or 100svh."

## 🔁 Follow-up questions

### When would you choose `em` over `rem`?

For spacing that should scale with that component's own text. For example, button padding in `em` grows when you make one button's font bigger. For font sizes themselves, `rem` is safer.

### What does `%` mean for height?

It is a percentage of the parent's **height**. But it only works if the parent has a defined height. Otherwise `height: 50%` often does nothing.

### What is the difference between `dvh`, `svh` and `lvh`?

`svh` is the height with the browser bars showing (smallest). `lvh` is the height with them hidden (largest). `dvh` changes between the two as the bars appear and disappear.

## ✅ Quick check

### 1. The `<html>` font size is 16px. What is `1.5rem`?

:::answer
**24px** (1.5 × 16).
:::

### 2. A parent has `font-size: 20px`. A child has `font-size: 2em`, and its child has `font-size: 2em` too. What is the grandchild's font size?

:::answer
**80px.** 20 × 2 = 40px for the child, then 40 × 2 = 80px for the grandchild. That is why `em` "grows" when nested.
:::

### 3. Which is the safest choice for a full-screen hero on phones?

- A) `height: 100vh`
- B) `height: 100svh`
- C) `height: 100%` with no height on the parent

:::answer
**B.** `100svh` uses the height with the browser bars visible, so it never hides behind them. C usually does nothing, because the parent has no height.
:::
