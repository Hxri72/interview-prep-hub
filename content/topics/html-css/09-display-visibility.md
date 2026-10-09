---
title: "display, visibility and opacity"
stack: html-css
order: 9
level: Basic
mustKnow: false
askedFrequency: common
summary:
  - "display: none removes the element completely. It takes no space and screen readers skip it."
  - "visibility: hidden hides it but keeps its space. It can't be clicked."
  - "opacity: 0 makes it invisible but it still takes space, can be clicked and is still read by screen readers."
  - "To hide something visually but keep it for screen readers, use a 'visually hidden' (sr-only) class."
  - "display also sets the layout type: block, inline, inline-block, flex, grid."
cards:
  - q: display none vs visibility hidden?
    a: display none removes the element and its space. visibility hidden keeps the space but hides the element.
  - q: Can you click an element with opacity 0?
    a: Yes. It's invisible but still there and still clickable, unless you also add pointer-events none.
  - q: Which of the three can be animated smoothly?
    a: opacity animates smoothly. display can't fade (it switches instantly), and visibility switches at one point.
  - q: How do you hide text visually but keep it for screen readers?
    a: Use a visually-hidden (sr-only) class that shrinks it to 1px and clips it, instead of display none.
  - q: Does display none hide the element from screen readers?
    a: Yes. Elements with display none are removed from the accessibility tree.
---

## 💡 What is it?

These three CSS properties all "hide" things, but in different ways.

- `display: none` → the element is **gone**. No space, no clicks, no screen reader.
- `visibility: hidden` → the element is **invisible but keeps its space**.
- `opacity: 0` → the element is **see-through**, but it's still there. It keeps its space and can even be clicked.

`display` also has a second job: it sets the **layout type** of a box (block, inline, flex, grid).

## 🏠 Real-life example

Think of **a student in a class photo**.

- `display: none` = the student **is absent**. The others move closer to fill the gap.
- `visibility: hidden` = the student **stands there under an invisibility cloak**. There's an empty gap, and you can't touch them.
- `opacity: 0` = the student is **made of clear glass**. You can't see them, but they're still there, and you can still bump into them.

## 🧑‍💻 Code example

Save as `index.html` and open it in your browser.

```html
<!DOCTYPE html>                                           <!-- modern HTML5 page -->
<html lang="en">                                          <!-- page language: English -->
<head>                                                    <!-- page info -->
  <meta charset="UTF-8">                                  <!-- text encoding -->
  <title>Hiding things</title>                            <!-- tab title -->
  <style>                                                 <!-- CSS starts -->
    .row { display: flex; gap: 8px; }                     /* put the boxes in one row, 8px apart */
    .row div { width: 80px; padding: 8px; background: lightblue; } /* each box: 80px wide, light blue */
    .gone      { display: none; }                         /* removed: the next box slides left */
    .invisible { visibility: hidden; }                    /* hidden: an empty gap stays */
    .clear     { opacity: 0; }                            /* see-through: gap stays, still clickable */
    .sr-only {                                            /* hide visually, keep for screen readers */
      position: absolute; width: 1px; height: 1px;        /* make it a 1px dot, out of the layout */
      overflow: hidden; clip-path: inset(50%);            /* clip it so nothing shows */
      white-space: nowrap;                                /* keep the text on one line */
    }                                                     /* end of .sr-only */
  </style>                                                <!-- CSS ends -->
</head>                                                   <!-- end of head -->
<body>                                                    <!-- visible content -->
  <div class="row">                                       <!-- one row of boxes -->
    <div>A</div>                                          <!-- normal box -->
    <div class="gone">B</div>                             <!-- display none: no space at all -->
    <div class="invisible">C</div>                        <!-- visibility hidden: empty space -->
    <div class="clear" onclick="alert('You clicked D!')">D</div> <!-- opacity 0: invisible but clickable -->
    <div>E</div>                                          <!-- normal box -->
  </div>                                                  <!-- end of row -->
  <button type="button">✕ <span class="sr-only">Close dialog</span></button> <!-- screen readers hear "Close dialog" -->
</body>                                                   <!-- end of body -->
</html>                                                   <!-- end of page -->
```

```text
You see:  [A]  (gap)  (gap)  [E]
- B is gone completely (no gap for it).
- C leaves an empty gap.
- D leaves an empty gap too — click that second gap and an alert says "You clicked D!".
The button shows only "✕", but a screen reader reads "✕ Close dialog".
```

## 🔍 Deeper version

**Comparison:**

| | Takes space | Clickable | Screen reader | Smooth animation |
|---|---|---|---|---|
| `display: none` | ❌ | ❌ | ❌ hidden | ❌ (switches instantly) |
| `visibility: hidden` | ✅ | ❌ | ❌ hidden | switches at a point |
| `opacity: 0` | ✅ | ✅ | ✅ still read | ✅ |
| `.sr-only` | ❌ (absolute) | ❌ | ✅ read | — |

**The `hidden` attribute.** `<div hidden>` works like `display: none` without any CSS. But a CSS rule like `.card { display: flex }` can override it. Many resets add `[hidden] { display: none !important; }`.

**Fading in and out.** A common pattern is `opacity` plus `visibility` with a transition. The element fades, and at the end `visibility: hidden` makes it unclickable. Modern CSS can also animate to and from `display: none` using `transition-behavior: allow-discrete` and `@starting-style`.

**`display` as a layout switch:** `block`, `inline`, `inline-block`, `flex`, `inline-flex`, `grid`, `contents` (the box disappears and its children act as if they belong to the parent), `none`. See [block vs inline](topic:html-css/block-inline) and [flexbox basics](topic:responsive-design/flexbox-basics).

**Performance.** Changing `display` or `visibility` can trigger layout. Changing `opacity` can usually be handled by the GPU without layout, which is why it's the best choice for animations.

**React side.** In React you usually hide something by not rendering it at all (`{open && <Modal />}`), which is like `display: none` but also removes it from the DOM. Keep it mounted and hide it with CSS when you want to keep its state. See [conditional rendering](topic:react/conditional-rendering).

## 🎯 Why do we use it?

Pages show and hide things all the time: menus, modals, tooltips, error messages, tabs. Picking the right method decides:
- whether the layout jumps,
- whether keyboard and screen reader users can still reach it,
- whether it animates smoothly.

## ⚠️ Common mistakes

- **Hiding with `opacity: 0` and forgetting it's still clickable.** Users click invisible buttons. Add `visibility: hidden` or `pointer-events: none`.
- **Using `display: none` for screen-reader-only text.** It hides it from screen readers too.
- **Trying to fade with `display`.** It switches instantly.
- **Inline `hidden` overridden by a class** that sets `display: flex`.

## 🗣️ How to answer in an interview

> "display none removes the element completely — no space, no clicks, and screen readers skip it. visibility hidden hides it but keeps its space, and it can't be clicked. opacity 0 makes it transparent but it's still there: it keeps its space, it can still be clicked and screen readers still read it.
>
> For animations I use opacity, because it's smooth and cheap, often together with visibility so the hidden element can't be clicked. When I want text only for screen readers, like a label on an icon button, I use a visually-hidden class instead of display none."

## 🔁 Follow-up questions

### How do you make a fade-out that also removes the element from clicks?

Transition `opacity` to 0 and set `visibility: hidden` at the end of the transition (or use `pointer-events: none`).

### Is `display: none` bad for SEO?

Not by itself. Hiding content behind tabs or menus is normal. Hiding text only to stuff keywords for search engines is bad practice.

### What does `display: contents` do?

The element's own box disappears, and its children are laid out as if they were children of its parent. It's useful with flex or grid, but be careful with semantics on some elements, like buttons.

## ✅ Quick check

### 1. Which keeps the element's space on the page?

- A) `display: none`
- B) `visibility: hidden`
- C) Both

:::answer
**B.** `visibility: hidden` keeps the space. `display: none` removes it.
:::

### 2. A button has `opacity: 0`. Can a user still click it?

:::answer
**Yes.** It's invisible but still in place. Add `visibility: hidden` or `pointer-events: none` to stop clicks.
:::

### 3. You want "Close dialog" read aloud, but only an ✕ shown. What do you use?

:::answer
A **visually-hidden (sr-only) class** on the text, or `aria-label="Close dialog"` on the button. Not `display: none`, which hides it from screen readers too.
:::
