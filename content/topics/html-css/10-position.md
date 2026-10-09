---
title: "position: static, relative, absolute, fixed, sticky"
stack: html-css
order: 10
level: Basic
mustKnow: true
askedFrequency: very common
summary:
  - "static is the default: the element sits where it normally falls; top/left do nothing."
  - "relative keeps its normal space, can be nudged, and becomes the anchor for absolute children."
  - "absolute leaves the normal flow and is placed inside the nearest positioned parent."
  - "fixed sticks to the screen, even when you scroll (unless a parent has a transform)."
  - "sticky scrolls normally until it reaches a point, then sticks inside its parent."
cards:
  - q: What is the default position value?
    a: static. The element sits in the normal flow, and top, left, right, bottom and z-index have no effect.
  - q: Where is an absolute element placed?
    a: Relative to its nearest ancestor that has a position other than static. If there is none, relative to the page.
  - q: What is the common pattern for a badge on a card?
    a: Give the card position relative and the badge position absolute with top and right values.
  - q: fixed vs sticky?
    a: fixed always stays at the same spot on the screen. sticky scrolls with the page until it hits its offset, then sticks while its parent is visible.
  - q: Why might position sticky not work?
    a: It needs a top (or bottom) value, and a parent with overflow hidden or auto can stop it, or the parent is too short.
---

## 💡 What is it?

The CSS `position` property decides **how an element is placed** on the page.

There are 5 values: `static`, `relative`, `absolute`, `fixed` and `sticky`. Together with `top`, `right`, `bottom` and `left`, they let you move boxes away from where they would normally sit.

## 🏠 Real-life example

Think of **students in a school assembly**.

- `static` = a student **standing in their normal place** in the line.
- `relative` = a student who **steps a little to the left**, but their spot in the line is kept for them.
- `absolute` = a student taken out of the line and **placed at "2 steps from the right corner of the stage"**. The stage (the nearest positioned parent) is their reference.
- `fixed` = the **school logo painted on the window**. However the crowd moves, it stays at the same spot on the glass.
- `sticky` = the **class leader's flag**. It moves with the class until it reaches the front rope, then stays there while the class is still in the hall.

## 🧑‍💻 Code example

Save as `index.html`, open it in your browser and **scroll down**.

```html
<!DOCTYPE html>                                           <!-- modern HTML5 page -->
<html lang="en">                                          <!-- page language: English -->
<head>                                                    <!-- page info -->
  <meta charset="UTF-8">                                  <!-- text encoding -->
  <title>Position</title>                                 <!-- tab title -->
  <style>                                                 <!-- CSS starts -->
    body { height: 2000px; font-family: sans-serif; }     /* a tall page so we can scroll */
    .card { position: relative; width: 220px; padding: 16px; background: #eef; } /* relative = anchor for the badge */
    .badge { position: absolute; top: -8px; right: -8px; background: crimson; color: white; padding: 2px 8px; border-radius: 999px; } /* placed 8px outside the card's top-right corner */
    .nudge { position: relative; left: 20px; }            /* moved 20px to the right; its old space stays */
    .header { position: sticky; top: 0; background: gold; padding: 8px; } /* scrolls, then sticks at the top (0px) */
    .chat { position: fixed; bottom: 16px; right: 16px; background: teal; color: white; padding: 12px; } /* always 16px from the screen's bottom-right */
  </style>                                                <!-- CSS ends -->
</head>                                                   <!-- end of head -->
<body>                                                    <!-- visible content -->
  <p>Some text above the header.</p>                      <!-- normal (static) paragraph -->
  <div class="header">Sticky header</div>                 <!-- sticks to the top when you scroll past it -->
  <div class="card">Job card<span class="badge">New</span></div> <!-- the badge sits on the card's corner -->
  <p class="nudge">I am nudged 20px right.</p>            <!-- relative + left -->
  <div class="chat">💬 Chat</div>                          <!-- fixed to the screen corner -->
</body>                                                   <!-- end of body -->
</html>                                                   <!-- end of page -->
```

```text
A red "New" badge sits on the top-right corner of the job card.
"I am nudged 20px right" is shifted right compared with the other text.
A teal "💬 Chat" button stays in the bottom-right corner, even while scrolling.
Scroll down: the gold "Sticky header" moves up, then stays stuck at the top of the window.
```

## 🔍 Deeper version

**Comparison:**

| Value | In normal flow? | Placed relative to | Common use |
|---|---|---|---|
| `static` | ✅ | — (top/left ignored) | default |
| `relative` | ✅ (space kept) | its own normal spot | small nudges; anchor for absolute children |
| `absolute` | ❌ | nearest positioned ancestor (else the page) | badges, tooltips, dropdowns, close buttons |
| `fixed` | ❌ | the viewport (screen) | chat buttons, fixed headers, toasts |
| `sticky` | ✅ until it sticks | its scroll container, inside its parent | table headers, section titles, sidebars |

**"Positioned"** means any value except `static`. That's why the badge pattern is: parent `relative`, child `absolute`.

**Gotchas:**
- **Fixed inside a transform.** If a parent has `transform`, `filter` or `perspective`, a `fixed` child is positioned relative to that parent instead of the screen.
- **Sticky that doesn't stick.** It needs `top` (or `bottom`). It only sticks inside its parent, so a short parent ends it early. A parent with `overflow: hidden` or `auto` becomes the scroll container and can break it.
- **Absolute elements don't push others.** They're out of the flow, so the parent doesn't grow to fit them.

**`inset` shorthand.** `inset: 0` = `top: 0; right: 0; bottom: 0; left: 0`. It's handy to make an overlay cover its whole parent.

**Stacking.** Positioned elements can use `z-index` to sit above or below each other. See [z-index and stacking context](topic:html-css/z-index).

**Modern alternatives.** Use Flexbox and Grid for page layout, not `absolute`. Keep `position` for overlays and small details. The new CSS anchor positioning and the `popover` attribute make tooltips easier without manual math.

## 🎯 Why do we use it?

Normal flow puts boxes one after another. `position` lets you **break out** of that for things that must sit **on top of** or **stuck to** something:
- badges and close buttons on cards,
- dropdown menus and tooltips,
- sticky headers and table headings,
- chat buttons and toast messages fixed on screen.

## ⚠️ Common mistakes

- **Absolute element flying to the page corner** because no parent is positioned. Add `position: relative` to the parent.
- **Building the whole layout with absolute.** It breaks on other screen sizes. Use flex or grid.
- **Sticky not working** because of a missing `top` or a parent with `overflow: hidden`.
- **Fixed header covering content.** Add padding at the top of the page, or use `scroll-padding-top` for anchor links.

## 🗣️ How to answer in an interview

> "There are five values. Static is the default — normal flow, and top or left do nothing. Relative keeps the element's space but lets me nudge it, and, more importantly, it makes it the anchor for absolute children. Absolute takes the element out of the flow and places it inside its nearest positioned ancestor — that's how I put a badge on a card corner: card relative, badge absolute.
>
> Fixed pins the element to the screen, like a chat button. Sticky scrolls normally until it hits its top offset, then sticks while its parent is on screen, which is great for table headers. Two gotchas I watch for: sticky needs a top value and breaks inside overflow-hidden parents, and fixed elements behave like absolute inside a parent with a transform. For page layout itself I use flex and grid, not absolute."

## 🔁 Follow-up questions

### How do you centre an absolute element inside its parent?

`top: 50%; left: 50%; transform: translate(-50%, -50%);`. Or `inset: 0; margin: auto;` when the element has a fixed size. See [centering anything](topic:html-css/centering).

### Why is my sticky table header not sticking?

Usually because it has no `top` value, or a wrapper has `overflow: auto` or `hidden`, or the sticky element's parent ends too soon.

### Does an absolute element take up space?

No. It's removed from the normal flow, so other elements act as if it isn't there, and the parent doesn't grow to fit it.

## ✅ Quick check

### 1. A badge has `position: absolute; top: 0; right: 0;` but appears at the top-right of the whole page, not the card. Why?

:::answer
**The card isn't positioned.** Add `position: relative` to the card, so it becomes the badge's anchor.
:::

### 2. Which value keeps the element's original space empty after you move it with `left: 20px`?

:::answer
**`relative`.** The element moves, but its original space in the flow is kept.
:::

### 3. You need a "Back to top" button that always stays in the screen's corner while scrolling. Which value?

:::answer
**`fixed`**, with `bottom` and `right` values.
:::
