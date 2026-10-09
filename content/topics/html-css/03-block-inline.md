---
title: Block vs inline elements
stack: html-css
order: 3
level: Basic
mustKnow: false
askedFrequency: common
summary:
  - "Block elements start on a new line and take the full width (div, p, h1, section)."
  - "Inline elements sit inside a line of text and are only as wide as their content (span, a, strong)."
  - "Width, height and top/bottom margin are ignored on inline elements."
  - "inline-block sits in the line like inline, but respects width, height and all margins."
  - "You can change any element with the CSS display property."
cards:
  - q: What is a block element?
    a: An element that starts on a new line and stretches to the full width of its parent, like div or p.
  - q: What is an inline element?
    a: An element that flows inside text, only as wide as its content, like span or a.
  - q: Why does width have no effect on my span?
    a: Width and height don't apply to inline elements. Make it inline-block or block.
  - q: What is inline-block?
    a: It stays in the line like inline, but respects width, height, padding and margins like a block.
  - q: Can you put a div inside a span?
    a: It's not valid HTML. Block-level content shouldn't go inside an inline element like span.
---

## 💡 What is it?

Every HTML element has a default **display** type. The two basic ones are **block** and **inline**.

- A **block** element starts on a **new line** and takes the **full width**. Example: `<div>`, `<p>`, `<h1>`.
- An **inline** element sits **inside a line of text**. It is only as wide as its content. Example: `<span>`, `<a>`, `<strong>`.

## 🏠 Real-life example

Think of a **school notebook**.

- A **block** = a new paragraph. It always starts on a new line and uses the whole width of the page.
- An **inline** element = a **word you underline** inside a sentence. It stays in the same line. It's only as long as the word.
- **inline-block** = a **small sticker** you put inside a line of writing. It sits in the line, but it has its own fixed size.

## 🧑‍💻 Code example

Save as `index.html` and open it in your browser.

```html
<!DOCTYPE html>                                              <!-- modern HTML5 page -->
<html lang="en">                                             <!-- page language: English -->
<head>                                                       <!-- page info -->
  <meta charset="UTF-8">                                     <!-- text encoding -->
  <title>Block vs inline</title>                             <!-- tab title -->
  <style>                                                    <!-- CSS starts -->
    div  { background: lightblue; }                          /* blocks: light blue so you see their full width */
    span { background: yellow; width: 200px; }               /* inline: yellow; width 200px is IGNORED */
    .chip {                                                  /* class for an inline-block "chip" */
      display: inline-block;                                 /* stays in the line, but respects size */
      width: 80px;                                           /* now 80px wide really works */
      padding: 4px;                                          /* 4px space inside the chip */
      background: lightgreen;                                /* green so you can see it */
    }                                                        /* end of .chip */
  </style>                                                   <!-- CSS ends -->
</head>                                                      <!-- end of head -->
<body>                                                       <!-- visible content -->
  <div>Block 1</div>                                         <!-- full-width box on its own line -->
  <div>Block 2</div>                                         <!-- starts on a NEW line under Block 1 -->
  <p>Text with <span>an inline span</span> inside it.</p>    <!-- the span stays inside the sentence -->
  <p>Skills: <span class="chip">Node</span> <span class="chip">React</span></p> <!-- two chips side by side, each 80px -->
</body>                                                      <!-- end of body -->
</html>                                                      <!-- end of page -->
```

```text
Two light-blue bars, each across the whole page, one under the other.
A sentence where only "an inline span" has a yellow background — not 200px wide.
"Skills:" followed by two green chips side by side, each exactly 80px wide.
```

## 🔍 Deeper version

**What each type respects:**

| Property | block | inline | inline-block |
|---|---|---|---|
| Starts on a new line | ✅ | ❌ | ❌ |
| `width` / `height` | ✅ | ❌ ignored | ✅ |
| `margin` top/bottom | ✅ | ❌ ignored | ✅ |
| `margin` left/right | ✅ | ✅ | ✅ |
| `padding` | ✅ | ✅ but top/bottom don't push other lines away | ✅ |

**Common defaults:**
- Block: `div`, `p`, `h1`–`h6`, `ul`, `ol`, `li`, `section`, `article`, `header`, `footer`, `form`.
- Inline: `span`, `a`, `strong`, `em`, `code`, `label`.
- Inline-block by default: `button`, `input`, `select`, `img` (images are "replaced" inline elements, so they respect width and height).

**Changing it.** CSS `display` decides the type, not the tag. `display: block` on a link makes it fill the line, which is a nice big click area for a menu. See [display, visibility and opacity](topic:html-css/display-visibility).

**The gap under images.** An `<img>` sits on the text baseline, like a letter. So there is a small gap below it for letters like "g" and "y". Fix it with `display: block` or `vertical-align: middle`.

**Flex and grid change the rules.** Children of a flex or grid container become flex/grid items. Then block vs inline doesn't decide their layout any more. See [flexbox basics](topic:responsive-design/flexbox-basics).

:::version[Version note]
Modern CSS describes display with two parts: an outside type (block or inline) and an inside type (flow, flex, grid). So `display: inline-flex` means "inline on the outside, flex on the inside". The short names still work.
:::

## 🎯 Why do we use it?

Knowing the display type explains a lot of "why won't this work?" moments.
- Why your `<span>` ignores width.
- Why two `<div>`s stack instead of sitting side by side.
- Why a link's click area is tiny.

It's the base for all other layout, like Flexbox and Grid.

## ⚠️ Common mistakes

- **Setting width or height on an inline element** and wondering why nothing changes.
- **Putting block elements inside inline ones**, like a `<div>` inside a `<span>`. That's invalid HTML.
- **Expecting top/bottom margin on a link** to push things away.
- **Forgetting the image baseline gap** and adding random negative margins to "fix" it.

## 🗣️ How to answer in an interview

> "Block elements, like div, p and headings, start on a new line and take the full width of their parent. Inline elements, like span, a and strong, flow inside text and are only as wide as their content. The big practical difference is that width, height and vertical margins are ignored on inline elements.
>
> When I need something to sit in a line but still have a fixed size, like a skill chip or a button, I use inline-block. And I can change any element with the display property — for example, making a menu link display block so the whole row is clickable. Inside flex or grid containers, the children follow flex or grid rules instead."

## 🔁 Follow-up questions

### Is a button inline or block?

By default it's inline-block. It sits in a line of text but respects width, height and padding.

### Why is there a small gap below my image?

Images sit on the text baseline, which leaves room for letter tails like "g". Set `display: block` on the image, or `vertical-align: middle`.

### How do you make two divs sit side by side?

Put them in a parent with `display: flex`. Or make both `display: inline-block`, but flex is the modern, easier choice.

## ✅ Quick check

### 1. You set `width: 300px` on a `<span>`. How wide is it?

:::answer
**As wide as its text.** Width is ignored on inline elements. Use `display: inline-block` or `block`.
:::

### 2. Which of these starts on a new line by default?

- A) `<a>`
- B) `<strong>`
- C) `<p>`

:::answer
**C) `<p>`.** It's a block element. Links and strong are inline.
:::

### 3. What does `display: inline-block` give you?

:::answer
It **sits in the line like inline**, but **respects width, height and all margins** like a block.
:::
