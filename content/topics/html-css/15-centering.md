---
title: Centering anything in CSS
stack: html-css
order: 15
level: Basic
mustKnow: true
askedFrequency: very common
summary:
  - "Centre text inside a box: text-align: center."
  - "Centre a block with a width horizontally: margin: 0 auto (or margin-inline: auto)."
  - "Centre anything both ways with flexbox: display: flex; justify-content: center; align-items: center on the parent."
  - "Shortest modern way: display: grid; place-items: center on the parent."
  - "For overlays: position: absolute; inset: 0; margin: auto (with a size), or top/left 50% + transform: translate(-50%, -50%)."
cards:
  - q: How do you centre a div both horizontally and vertically?
    a: "On the parent: display: flex; justify-content: center; align-items: center. Or display: grid; place-items: center. The parent needs a height."
  - q: Why does margin 0 auto sometimes not centre?
    a: The element is inline, or it has no set width (a block is full width by default), or it is absolutely positioned without inset values.
  - q: What does place-items center do?
    a: In a grid, it is short for align-items center + justify-items center, so each item is centred in its cell both ways.
  - q: How do you centre a modal over the page?
    a: "position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%). Or use a flex/grid overlay. Or the native dialog element, which is centred by default."
  - q: Why does vertical centring 'not work' even with flexbox?
    a: The parent has no height, so it is only as tall as its content. Give it a height, like min-height 100vh.
---

## 💡 What is it?

"Centre this box" is one of the most common tasks in CSS. It's also a classic interview question.

There is no single magic property. The right method depends on **what** you centre:
- text,
- a block with a width, or
- anything, in both directions.

Today, **flexbox** and **grid** make centring easy.

## 🏠 Real-life example

Think of **hanging a photo frame in the middle of a wall**.

- **Text in a box** = writing a title in the middle of a page. Just say "centre the writing" (`text-align: center`).
- **A frame with a known width** = leave equal space on the left and right (`margin: 0 auto`).
- **Exactly in the middle of the wall, up-down and left-right** = ask a helper with a measuring tape to do it for you. The helper is flexbox or grid.
- **The wall's height** matters. If the "wall" is only as tall as the photo, there is no up-down space to centre in. So the parent needs a height.

## 🧑‍💻 Code example

Save this as `index.html` and open it in your browser.

```html
<!DOCTYPE html>                                       <!-- modern HTML page -->
<html lang="en">                                      <!-- page language = English -->
<head>                                                <!-- page settings -->
  <style>                                             /* CSS starts here */
    .stage {                                          /* a grey area to centre things in */
      height: 140px;                                  /* the parent NEEDS a height for vertical centring */
      background: #e2e8f0;                            /* light grey */
      margin-bottom: 12px;                            /* 12px gap below each stage */
    }                                                 /* end of .stage */
    .box { width: 120px; padding: 8px;                /* the box is 120px wide, 8px inside space */
           background: royalblue; color: white; }     /* blue box, white text */
    .text-center { text-align: center; }              /* 1) centres the TEXT inside the stage */
    .auto .box { margin: 0 auto; }                    /* 2) block box: 0 top/bottom, auto left/right = centred */
    .flex {                                           /* 3) flexbox centring */
      display: flex;                                  /* children line up in a row */
      justify-content: center;                        /* centre along the row (left–right) */
      align-items: center;                            /* centre across the row (up–down) */
    }                                                 /* end of .flex */
    .grid { display: grid; place-items: center; }     /* 4) grid: one line centres both ways */
    .abs { position: relative; }                      /* 5) the parent becomes the anchor */
    .abs .box {                                       /* the box to centre */
      position: absolute;                             /* placed relative to the .abs parent */
      top: 50%; left: 50%;                            /* move the box's top-left corner to the middle */
      transform: translate(-50%, -50%);               /* pull it back by half its own size = truly centred */
    }                                                 /* end of .abs .box */
  </style>                                            <!-- CSS ends here -->
</head>                                               <!-- end of head -->
<body>                                                <!-- visible content -->
  <div class="stage text-center">1. Centred text only</div>   <!-- text centred, top of the stage -->
  <div class="stage auto"><div class="box">2. margin auto</div></div>        <!-- left-right only -->
  <div class="stage flex"><div class="box">3. flexbox</div></div>            <!-- both ways -->
  <div class="stage grid"><div class="box">4. grid</div></div>               <!-- both ways -->
  <div class="stage abs"><div class="box">5. absolute</div></div>            <!-- both ways -->
</body>                                               <!-- end of body -->
</html>                                               <!-- end of page -->
```

**What you see:**

```text
1. The text is centred left-right, but sits at the top of the grey area.
2. The blue box is centred left-right, but sits at the top.
3, 4, 5. The blue box is exactly in the middle of the grey area, both ways.
```

## 🔍 Deeper version

**Which method when?**

| Goal | Use | Notes |
|---|---|---|
| Text or inline content | `text-align: center` | Works on the **parent** of the text |
| Block with a width, left–right | `margin-inline: auto` (or `margin: 0 auto`) | Needs a width or `max-width`, and `display: block` |
| One item, both ways | parent: `display: grid; place-items: center` | Shortest |
| Several items in a row, both ways | parent: `display: flex; justify-content: center; align-items: center` | Most common |
| One flex child only | child: `margin: auto` inside a flex parent | Auto margins eat all the free space |
| Overlay / badge / modal | `position: absolute; inset: 0; margin: auto;` with a width and height | Or `top/left: 50%` + `translate(-50%, -50%)` |
| Single line of text, vertically | `line-height` equal to the height | Old trick, breaks with two lines |

**Why `translate(-50%, -50%)`?** `top: 50%` and `left: 50%` move the box's **top-left corner** to the centre. In `translate`, percentages are of the box's **own** size, so `-50%` pulls it back by half its width and height.

**Justify vs align.** In flexbox, `justify-content` works along the main direction, and `align-items` works across it. If you set `flex-direction: column`, they swap. This is a common trap. See [flexbox basics](topic:responsive-design/flexbox-basics).

**Vertical centring needs height.** A block parent is only as tall as its content. Give it a `height`, a `min-height: 100dvh`, or let a grid or flex layout give it height.

**The newest way.** Browsers now support `align-content: center` on a plain block element, with no flex or grid needed.

```css
.stage { align-content: center; }   /* centres the children up–down in a normal block */
```

:::version[Version note]
`align-content` on normal block elements arrived in all major browsers in 2024. Older answers say "you need flex or grid for vertical centring", which is no longer strictly true. In interviews, lead with flexbox and grid. They are what everyone expects.
:::

**Modals.** The native `<dialog>` element opened with `showModal()` is centred by default, and appears above everything. See [z-index and stacking context](topic:html-css/z-index).

## 🎯 Why do we use it?

Centring is everywhere:
- login cards in the middle of the page,
- loading spinners,
- empty states ("No candidates yet"),
- icons inside buttons,
- modals and badges.

Knowing the right tool for each case saves time, and avoids hacks like fixed pixel offsets that break on other screen sizes.

## ⚠️ Common mistakes

- **Using `text-align: center` to centre a block box.** It only centres inline content (text, images, inline-block).
- **`margin: 0 auto` with no width.** A block is already full width, so there is nothing to centre.
- **No height on the parent.** Vertical centring "does nothing".
- **Mixing up `justify-content` and `align-items`** after changing `flex-direction` to `column`.
- **Hard-coding `top: 200px`.** It looks centred on your laptop only.

## 🗣️ How to answer in an interview

> "It depends on what I'm centring. For text, text-align: center on the parent. For a block with a width, margin-inline: auto. To centre anything both ways, my default is flexbox on the parent: display: flex, justify-content: center, align-items: center. Or with grid, the shortest version is display: grid and place-items: center.
>
> For overlays like a modal or a badge, I use position absolute or fixed with top and left 50% and transform: translate(-50%, -50%). The translate percentages are based on the element's own size, so it pulls the box back by half.
>
> The usual reason vertical centring 'fails' is that the parent has no height, so I make sure it has one, like min-height: 100dvh for a full-page login card."

## 🔁 Follow-up questions

### How do you centre a login card in the middle of the screen?

On `body` or a wrapper, use `min-height: 100dvh; display: grid; place-items: center;`. The card sits in the exact centre on every screen size.

### What does `margin: auto` do inside a flex container?

Auto margins take up all the free space. `margin: auto` on one flex child centres it both ways. `margin-left: auto` pushes it to the right end.

### Why use `translate(-50%, -50%)` and not negative margins?

Negative margins need the element's exact size. `translate` percentages use the element's own size automatically, so it works for any size.

### How do you centre an image?

An image is inline. Use `text-align: center` on its parent, or make it `display: block; margin-inline: auto;`.

## ✅ Quick check

### 1. This box is not centred up–down. Why?

```css
.parent { display: flex; justify-content: center; align-items: center; } /* centring on the parent */
```

The parent contains one small box. The page shows the box at the top.

:::answer
**The parent has no height.** It is only as tall as the box, so there is no vertical space to centre in. Add `min-height: 100dvh` or a fixed height.
:::

### 2. Which is the shortest way to centre one child both ways?

- A) `text-align: center`
- B) `display: grid; place-items: center` on the parent
- C) `margin: 0 auto` on the child

:::answer
**B.** A only centres inline content left–right. C only centres left–right. B centres both ways.
:::
