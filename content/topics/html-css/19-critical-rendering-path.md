---
title: "Critical rendering path: reflow and repaint"
stack: html-css
order: 19
level: Advanced
mustKnow: false
askedFrequency: sometimes
summary:
  - "The critical rendering path is the steps from HTML to pixels: DOM → CSSOM → render tree → layout → paint → composite."
  - CSS blocks rendering, and normal scripts block HTML parsing. Keep both small and early.
  - Reflow (layout) means the browser recalculates sizes and positions. It is the most expensive step.
  - Repaint means redrawing pixels without changing layout, for example a colour change.
  - Layout thrashing is reading layout (offsetHeight) and writing styles again and again in a loop. Batch reads, then writes.
cards:
  - q: List the steps of the critical rendering path.
    a: Build the DOM from HTML, build the CSSOM from CSS, combine them into the render tree, layout (sizes and positions), paint (pixels), composite (stack layers on screen).
  - q: Reflow vs repaint?
    a: Reflow (layout) recalculates sizes and positions and usually causes a repaint too. Repaint only redraws pixels, like a colour change. Reflow is more expensive.
  - q: What is layout thrashing?
    a: Mixing layout reads (like offsetHeight) and style writes in a loop, which forces the browser to recalculate layout again and again.
  - q: Why is CSS called render-blocking?
    a: The browser won't paint the page until it has the CSS, to avoid showing unstyled content that then jumps.
  - q: Which property changes skip layout and paint?
    a: transform and opacity usually only need the composite step.
---

## 💡 What is it?

When you open a page, the browser turns HTML and CSS into pixels on the screen. The steps it follows are called the **critical rendering path**.

Some changes later make the browser redo part of this work:
- **Reflow** (also called layout) — it recalculates sizes and positions. This is expensive.
- **Repaint** — it redraws pixels, like a new colour. This is cheaper.

Knowing these steps helps you make pages load fast and scroll smoothly.

## 🏠 Real-life example

Think of **setting up a classroom for an exam**.

1. Read the list of students = **DOM** (from HTML).
2. Read the seating rules ("tall students at the back") = **CSSOM** (from CSS).
3. Combine them into the final seating chart = **render tree**.
4. Measure and mark every desk's position = **layout**.
5. Put name cards on each desk = **paint**.
6. Open the door so everyone sees the room = **composite**.

Now one desk becomes wider. You must **re-measure the whole row** (reflow). If you only change a name card's colour, you just rewrite that card (repaint).

And if a teacher keeps asking "how wide is row 3?" and then moving a desk, again and again, you re-measure every time. That's **layout thrashing**.

## 🧑‍💻 Code example

Save as `index.html`, open it in your browser, and open the Console (F12).

```html
<!DOCTYPE html>                                           <!-- modern HTML page -->
<html lang="en">                                          <!-- page language = English -->
<head>                                                    <!-- page settings -->
  <style>                                                 /* CSS starts here */
    .item { height: 20px; margin: 2px; background: #cbd5e1; } /* 500 grey bars, 20px tall */
  </style>                                                <!-- CSS ends here -->
</head>                                                   <!-- end of head -->
<body>                                                    <!-- visible content -->
  <div id="list"></div>                                   <!-- empty list we fill with JavaScript -->
  <script>                                                // JavaScript starts here
    const list = document.getElementById('list');         // find the list
    for (let i = 0; i < 500; i++) {                       // make 500 items
      const div = document.createElement('div');          // create one div
      div.className = 'item';                             // give it the "item" style
      list.appendChild(div);                              // add it to the list
    }                                                     // end of loop
    const items = [...list.children];                     // turn the children into a normal array

    console.time('thrashing');                            // start a timer named "thrashing"
    items.forEach((el) => {                               // for each item…
      const h = el.offsetHeight;                          // READ layout (forces the browser to calculate layout)
      el.style.height = (h + 1) + 'px';                   // WRITE a style (makes layout dirty again)
    });                                                   // read, write, read, write… = thrashing
    console.timeEnd('thrashing');                         // print how long it took

    console.time('batched');                              // start a timer named "batched"
    const heights = items.map((el) => el.offsetHeight);   // 1) read ALL heights first (one layout)
    items.forEach((el, i) => {                            // 2) then write all styles
      el.style.height = (heights[i] + 1) + 'px';          // set each new height
    });                                                   // end of writes
    console.timeEnd('batched');                           // print how long it took
  </script>                                               <!-- JavaScript ends here -->
</body>                                                   <!-- end of body -->
</html>                                                   <!-- end of page -->
```

**What you see in the Console** (a real run in Chrome; your numbers will differ by machine):

```text
thrashing: 56.52392578125 ms
batched: 0.357177734375 ms
```

The batched version is about **150 times faster**. It does one layout calculation instead of 500.

## 🔍 Deeper version

**The pipeline, step by step:**

| Step | What happens | Blocked by |
|---|---|---|
| Parse HTML → **DOM** | tree of elements | normal `<script>` tags (pause parsing) |
| Parse CSS → **CSSOM** | tree of style rules | — |
| **Render tree** | visible elements + their computed styles (`display: none` is left out) | waits for CSS |
| **Layout** (reflow) | exact size and position of every box | — |
| **Paint** | fill pixels: text, colours, borders, shadows | — |
| **Composite** | combine layers (often on the GPU) and show them | — |

**Render-blocking vs parser-blocking:**
- **CSS is render-blocking.** The browser won't paint until it has the CSS, to avoid a "flash of unstyled content".
- **Classic scripts are parser-blocking.** The HTML parser stops at them. They also wait for earlier CSS. See [async vs defer](topic:html-css/async-defer).

**What triggers which work:**

| Change | Layout | Paint | Composite |
|---|---|---|---|
| `width`, `height`, `margin`, `top`, font size, adding DOM nodes | ✅ | ✅ | ✅ |
| `color`, `background`, `box-shadow`, `visibility` | — | ✅ | ✅ |
| `transform`, `opacity` (on its own layer) | — | — | ✅ |

**Forced synchronous layout.** Reading properties like `offsetHeight`, `offsetTop`, `getBoundingClientRect()`, `scrollTop` or `getComputedStyle()` right after a style change forces the browser to do layout **immediately**. In a loop, this is layout thrashing.

**Fixes:**
- **Batch reads, then writes.** Or use `requestAnimationFrame` to do writes just before the next frame.
- **Animate `transform` and `opacity`.** See [transitions and animations](topic:html-css/transitions-animations).
- **Make many DOM changes off-screen.** Build them in a `DocumentFragment`, then insert once. (React already batches DOM updates.)
- **`content-visibility: auto`** skips layout and paint for off-screen sections until they're needed.
- **CSS containment** (`contain: layout paint`) tells the browser a change inside a box won't affect the outside.
- **Virtualise long lists.** Only render the rows on screen. See [Profiler and list virtualisation](topic:react/performance-profiler).

**Speeding up the first render:**
- Inline the small "critical CSS" for above-the-fold content, and load the rest later.
- Use `defer`/module scripts.
- Preload key fonts. Use `font-display: swap`.
- Give images `width` and `height` so there's no layout shift.

**Tools:** the Chrome DevTools **Performance** panel shows purple "Layout" and green "Paint" blocks, and warns about "Forced reflow". The **Rendering** tab has "Paint flashing" and "Layout Shift Regions".

## 🎯 Why do we use it?

- **Faster first paint.** Users see content sooner, which improves Core Web Vitals. See [Core Web Vitals](topic:html-css/core-web-vitals).
- **Smooth interactions.** 60 frames per second leaves about 16 ms per frame. Expensive reflows cause dropped frames and "janky" scrolling.
- **Better debugging.** When a page feels slow, you know what to look for: blocking resources, layout thrashing or big paints.

## ⚠️ Common mistakes

- **Reading layout values inside a loop** that also changes styles.
- **Animating `top`/`left`/`width`** instead of `transform`.
- **Huge CSS and JS bundles in the `<head>`** that block the first paint.
- **Images without size**, which cause the page to jump (layout shift) when they load.

## 🗣️ How to answer in an interview

> "The critical rendering path is how the browser turns HTML and CSS into pixels: it parses HTML into the DOM and CSS into the CSSOM, combines them into the render tree, then does layout to calculate sizes and positions, paints the pixels, and composites the layers.
>
> CSS is render-blocking, and classic scripts block parsing, so for a fast first paint I keep critical CSS small and load scripts with defer.
>
> Reflow is when layout must be recalculated, for example after changing width or adding elements. It's the expensive step, and it usually causes a repaint too. Repaint alone is cheaper, like a colour change. transform and opacity can often skip both.
>
> A common bug is layout thrashing, reading offsetHeight and writing styles in a loop, which forces layout every time. The fix is to batch all reads, then all writes, or use requestAnimationFrame. I check this in the DevTools Performance panel."

## 🔁 Follow-up questions

### Does `display: none` vs `visibility: hidden` affect layout?

`display: none` removes the element from the render tree, so it takes no space, and toggling it causes reflow. `visibility: hidden` keeps the space and only affects paint.

### What does `requestAnimationFrame` help with?

It runs your code just before the browser's next paint. Doing style writes there groups them into the frame, and avoids extra layouts in between.

### What is a "layer" in compositing?

A part of the page the browser paints separately and can move on its own, often on the GPU. Elements with `transform` animations, `will-change`, video or `position: fixed` often get their own layer.

### Does React avoid reflows?

React batches DOM updates for a render, which helps. But your own code (effects reading layout) can still cause thrashing, and big re-renders still cause layout. Use `useLayoutEffect` for measure-then-change cases, and keep it light.

## ✅ Quick check

### 1. Which change triggers layout (reflow)?

- A) `element.style.color = 'red'`
- B) `element.style.width = '300px'`
- C) `element.style.opacity = '0.5'`

:::answer
**B.** Changing width changes geometry, so layout must run. A is paint only. C is usually composite only.
:::

### 2. Why is this slow?

```js
for (const el of items) {                       // loop over many elements
  el.style.width = el.offsetWidth + 10 + 'px';  // read offsetWidth, then write width, each time
}
```

:::answer
**Layout thrashing.** Each `offsetWidth` read forces a fresh layout, because the previous iteration wrote a style. Read all widths first, then write all new widths.
:::
