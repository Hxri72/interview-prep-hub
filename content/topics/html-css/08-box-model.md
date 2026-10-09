---
title: The box model and box-sizing
stack: html-css
order: 8
level: Basic
mustKnow: true
askedFrequency: very common
summary:
  - "Every element is a box with 4 layers, inside to outside: content → padding → border → margin."
  - "Padding is space inside the border. Margin is space outside it."
  - "With the default content-box, width covers only the content, so padding and border make the box wider."
  - "box-sizing: border-box makes width include padding and border. Most projects set it for every element."
  - "Vertical margins between blocks can collapse into one (the larger one wins)."
cards:
  - q: Name the 4 layers of the box model from inside to outside.
    a: Content, padding, border, margin.
  - q: Padding vs margin?
    a: Padding is space inside the border, around the content. Margin is space outside the border, between this box and others.
  - q: A box has width 300px, padding 20px and border 5px with content-box. How wide is it on screen?
    a: 300 + 20 + 20 + 5 + 5 = 350px.
  - q: What does box-sizing border-box do?
    a: The width you set includes padding and border, so a width of 300px stays 300px on screen.
  - q: What is margin collapsing?
    a: When two vertical margins between block elements touch, they merge into one margin equal to the larger of the two.
---

## 💡 What is it?

Every HTML element is drawn as a **box**. The **box model** describes the 4 layers of that box, from the inside out:

1. **Content** — the text or image.
2. **Padding** — space **inside** the border, around the content.
3. **Border** — the line around the box.
4. **Margin** — space **outside** the border, between this box and others.

`box-sizing` decides whether the `width` you set includes the padding and border.

## 🏠 Real-life example

Think of a **framed photo on a classroom wall**.

- The **photo** = the content.
- The **white card around the photo, inside the frame** = padding.
- The **wooden frame** = the border.
- The **gap on the wall between this frame and the next one** = margin.

Now imagine ordering a frame "30 cm wide". With **content-box**, the shop makes the *photo area* 30 cm, and adds the card and frame on top. The whole thing is bigger than you expected. With **border-box**, the shop makes the *whole frame* 30 cm, and the photo area shrinks to fit. That's usually what you wanted.

## 🧑‍💻 Code example

Save as `index.html` and open it in your browser.

```html
<!DOCTYPE html>                                    <!-- modern HTML5 page -->
<html lang="en">                                   <!-- page language: English -->
<head>                                             <!-- page info -->
  <meta charset="UTF-8">                           <!-- text encoding -->
  <title>Box model</title>                         <!-- tab title -->
  <style>                                          <!-- CSS starts -->
    .box {                                         /* shared style for both boxes */
      width: 300px;                                /* the width we ask for */
      padding: 20px;                               /* 20px space inside on every side */
      border: 5px solid teal;                      /* a 5px teal line around the box */
      margin: 16px;                                /* 16px space outside, between boxes */
      background: lightyellow;                     /* background covers content + padding (not margin) */
    }                                              /* end of .box */
    .content-box { box-sizing: content-box; }      /* the default: width = content only */
    .border-box  { box-sizing: border-box; }       /* width = content + padding + border */
  </style>                                         <!-- CSS ends -->
</head>                                            <!-- end of head -->
<body>                                             <!-- visible content -->
  <div class="box content-box">content-box</div>   <!-- 300 + 20+20 + 5+5 = 350px wide on screen -->
  <div class="box border-box">border-box</div>     <!-- exactly 300px wide on screen -->
  <script>                                         <!-- measure both boxes -->
    document.querySelectorAll('.box').forEach((el) => {       // loop over both boxes
      console.log(el.textContent, el.offsetWidth + 'px');     // offsetWidth = width + padding + border
    });                                            // end of loop
  </script>                                        <!-- end of script -->
</body>                                            <!-- end of body -->
</html>                                            <!-- end of page -->
```

```text
On screen: two yellow boxes with teal borders. The first is clearly wider.

Console:
content-box 350px
border-box 300px
```

Open DevTools → Elements → **Computed** tab. You'll see a coloured diagram of content, padding, border and margin for the selected box.

## 🔍 Deeper version

**The width maths:**

| box-sizing | You set `width: 300px` | Width on screen |
|---|---|---|
| `content-box` (default) | content = 300 | 300 + padding + border |
| `border-box` | content + padding + border = 300 | 300 |

**The usual reset.** Almost every project starts with:

```css
*, *::before, *::after { box-sizing: border-box; } /* every element and pseudo-element uses border-box */
```

Tailwind's base styles (Preflight) and MUI's `CssBaseline` both include this.

**Shorthand values.** `padding: 10px 20px` = 10px top and bottom, 20px left and right. `margin: 0 auto` = 0 top and bottom, and `auto` left and right, which **centres a block** that has a width.

**Margin collapsing.** When two block elements are stacked, their vertical margins **merge**. A `margin-bottom: 20px` and a `margin-top: 30px` give a 30px gap, not 50px. It also happens between a parent and its first or last child. It does **not** happen inside flex or grid containers, which is one reason people prefer `gap` there.

**`outline` is not part of the box.** It draws outside the border and takes no space, so it never moves the layout. That makes it great for focus rings and quick debugging: `* { outline: 1px solid red; }`.

**Inline elements** follow the box model too, but vertical padding and margin don't push other lines. See [block vs inline](topic:html-css/block-inline).

## 🎯 Why do we use it?

The box model explains **how big things really are** and **where the spaces come from**. Without it, layouts break by a few pixels: two "50%" boxes don't fit on one line, or a card overflows on a phone. `border-box` makes sizes predictable, which matters a lot for responsive layouts.

## ⚠️ Common mistakes

- **Two `width: 50%` boxes with padding** that wrap to two lines, because of content-box.
- **Expecting margins to add up** between stacked blocks, when they collapse.
- **Using margin for space inside a box** (that's padding), or padding for space between boxes.
- **Adding a border on hover**, which makes the box bigger and the layout jump. Use outline or a transparent border.

## 🗣️ How to answer in an interview

> "Every element is a box with four layers: the content, then padding inside the border, the border, and then margin outside. Padding is space inside the box, margin is space between boxes, and the background covers content and padding but not margin.
>
> By default, box-sizing is content-box, so width only covers the content and padding and border make the box bigger. With box-sizing border-box, the width includes padding and border, which is much easier to reason about. So I set border-box on everything at the start of a project — Tailwind and MUI's baseline do this too. One gotcha is margin collapsing: vertical margins between blocks merge into the larger one, but not inside flex or grid containers."

## 🔁 Follow-up questions

### How do you centre a block horizontally?

Give it a width (or max-width) and `margin: 0 auto`. Or put it in a flex parent with `justify-content: center`. See [centering anything](topic:html-css/centering).

### Why do my two 50% boxes not fit side by side?

With content-box, their padding and borders are added on top of 50%. So together they're more than 100%. Use `border-box`, or flex with `gap`.

### How do you stop margin collapsing?

Use flex or grid on the parent (and use `gap`), or add padding or a border to the parent, or use `display: flow-root` on the parent.

## ✅ Quick check

### 1. `width: 200px; padding: 10px; border: 2px solid;` with content-box. How wide is the box on screen?

:::answer
**224px.** 200 + 10 + 10 + 2 + 2 = 224.
:::

### 2. The same box with `box-sizing: border-box`. How wide now?

:::answer
**200px.** Padding and border now fit inside the 200px. The content area becomes 176px.
:::

### 3. Box A has `margin-bottom: 20px`. Box B below it has `margin-top: 40px`. Both are normal blocks. What is the gap?

:::answer
**40px.** The vertical margins collapse, and the larger one wins.
:::
