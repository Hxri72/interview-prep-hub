---
title: How the browser turns HTML, CSS and JS into pixels
stack: web-fundamentals
order: 9
level: Intermediate
mustKnow: false
askedFrequency: common
summary:
  - "The browser's pipeline: bytes → characters → tokens → DOM; CSS → CSSOM; DOM + CSSOM → render tree → layout → paint → composite."
  - "The render tree only has visible things: display: none elements and the <head> are left out; visibility: hidden elements still take space."
  - Layout (reflow) works out sizes and positions; paint fills in pixels; composite stacks painted layers on the GPU.
  - Changing width or height causes layout + paint + composite; changing colour causes paint + composite; transform and opacity can skip to composite only.
  - A normal <script> blocks the HTML parser; defer, async and type="module" don't.
cards:
  - q: What are the main steps from HTML to pixels?
    a: Parse HTML into the DOM, parse CSS into the CSSOM, combine them into the render tree, then layout (sizes and positions), paint (pixels) and composite (layers on the GPU).
  - q: Is an element with display none in the render tree?
    a: No. It's in the DOM but not in the render tree, so it takes no space. An element with visibility hidden is in the render tree and takes space, but isn't painted.
  - q: What is the difference between reflow and repaint?
    a: Reflow (layout) recalculates sizes and positions, which is expensive. Repaint only redraws pixels, such as a colour change, without moving anything.
  - q: Why are transform and opacity good for animations?
    a: The browser can apply them in the composite step on the GPU, without doing layout or paint again, so the animation stays smooth.
  - q: Why does a normal script tag slow down the first render?
    a: The HTML parser stops at it, downloads and runs the script, and only then continues building the DOM.
---

## 💡 What is it?

Your server sends plain text: HTML, CSS and JavaScript. The browser turns that text into **pixels** on the screen.

It does this in fixed steps called the **rendering pipeline**. First it builds the **[DOM](glossary:dom)** from HTML and the **CSSOM** from CSS. Then it works out positions, paints pixels and puts layers together.

This topic goes deeper than [the critical rendering path](topic:html-css/critical-rendering-path).

## 🏠 Real-life example

Think of **printing a school magazine**.

- **Reading the writers' pages** = parsing HTML into the DOM (what content exists).
- **Reading the style guide** = parsing CSS into the CSSOM (how each part should look).
- **Making the final list of what goes on each page** = the render tree. Notes marked "don't print" are left out.
- **Deciding where each article sits and how big it is** = layout.
- **Printing the ink** = paint.
- **Stacking the printed sheets in order** = composite.
- **Changing the size of one article** means re-planning the page = reflow. **Changing only the ink colour** means only reprinting = repaint.

## 🧑‍💻 Code example

Save this as `render.html` and open it in Chrome. Open DevTools → **Console** to see the output.

```html
<!doctype html>                                   <!-- use modern standards mode -->
<html>                                            <!-- root of the DOM tree -->
<head>                                            <!-- page settings; never drawn on screen -->
  <style>                                         /* CSS → the browser builds the CSSOM from this */
    .hidden { display: none; }                    /* display: none = left out of the render tree */
    .ghost { visibility: hidden; }                /* visibility: hidden = takes space, not painted */
    p { color: rgb(30, 41, 59); }                 /* every <p> gets dark text */
  </style>                                        <!-- end of CSS -->
</head>                                           <!-- end of head -->
<body>                                            <!-- the visible page -->
  <h1>Jobs</h1>                                   <!-- a heading -->
  <p>Node.js developer</p>                        <!-- a normal paragraph -->
  <p class="hidden">Secret note</p>              <!-- in the DOM, but not rendered -->
  <p class="ghost">Invisible but takes space</p> <!-- rendered (has a box), not painted -->
  <script>                                        // JavaScript that inspects the result
    function walk(node, depth) {                  // print one element and its children
      const box = node.getClientRects().length > 0; // true if the element got a layout box
      console.log('  '.repeat(depth) + node.nodeName + (box ? '  [has a layout box]' : '')); // indent by depth
      for (const child of node.children) walk(child, depth + 1); // go into each child
    }                                             // end of walk
    walk(document.documentElement, 0);           // start from <html>
    const p = document.querySelector('p');       // the first <p>
    console.log('CSSOM colour of first <p>:', getComputedStyle(p).color); // the final style value
  </script>                                       <!-- end of script -->
</body>                                           <!-- end of body -->
</html>                                           <!-- end of document -->
```

**Output** (run in Chrome):

```text
HTML  [has a layout box]
  HEAD
    STYLE
  BODY  [has a layout box]
    H1  [has a layout box]
    P  [has a layout box]
    P
    P  [has a layout box]
    SCRIPT
CSSOM colour of first <p>: rgb(30, 41, 59)
```

**What to notice:**
- Every element is in the **DOM**. But `HEAD`, `STYLE`, `SCRIPT` and the `display: none` paragraph have **no layout box**. They are not in the render tree.
- The `visibility: hidden` paragraph **has** a box. It takes space, but nothing is painted.

## 🔍 Deeper version

**1. Parsing HTML.** The browser reads **bytes**, decodes them into **characters** using the encoding (like UTF-8), splits them into **tokens** (start tag, end tag, text), and builds **nodes** into the DOM tree. It does this bit by bit, as data arrives.

**2. Parsing CSS.** CSS becomes the **CSSOM**, a tree of style rules. Rendering waits for CSS, because a page without styles would flash and then jump. That's why CSS is called **render-blocking**.

**3. Scripts and the parser.**

| Script type | Blocks the HTML parser? | Runs when |
|---|---|---|
| `<script src>` | Yes | As soon as it's downloaded |
| `<script defer>` | No | After HTML is parsed, in order |
| `<script async>` | No (pauses only to run) | As soon as it's downloaded, any order |
| `<script type="module">` | No (deferred by default) | After HTML is parsed |

More in [async vs defer](topic:html-css/async-defer).

**4. Render tree → layout → paint → composite.**
- **Render tree:** DOM + CSSOM, only the visible nodes.
- **Layout (reflow):** works out the exact size and position of every box, from the viewport size and CSS.
- **Paint:** turns boxes into pixels (text, colours, borders, shadows), often into several **layers**.
- **Composite:** the GPU (graphics chip) stacks the layers in the right order and shows the frame.

**5. What each change costs.**

| You change… | Steps the browser repeats |
|---|---|
| `width`, `height`, `top`, `font-size`, adding elements | Layout → paint → composite (most expensive) |
| `color`, `background`, `box-shadow` | Paint → composite |
| `transform`, `opacity` (on its own layer) | Composite only (cheapest) |

**6. Frames.** For smooth motion, the browser wants a new frame about every **16 ms** (60 frames a second). Long JavaScript on the main thread or forced layouts can miss frames, and the page feels janky. Reading `offsetHeight` right after a style change forces an early layout. Do it in a loop and you get **layout thrashing**.

## 🎯 Why do we use it?

Knowing the pipeline helps you build fast pages:
- **Put CSS early and scripts at the end, or use `defer`**, so the first paint happens sooner.
- **Animate `transform` and `opacity`**, not `top` or `width`.
- **Batch DOM reads and writes**, to avoid layout thrashing.
- **Explain Core Web Vitals.** For example, layout shifts (CLS) happen when layout changes after the first paint. See [Core Web Vitals](topic:html-css/core-web-vitals).

## ⚠️ Common mistakes

- **Animating `left`, `top` or `width`.** Each frame repeats layout. Use `transform: translate()` or `scale()`.
- **Reading layout values in a loop while changing styles.** This forces a layout on every step (thrashing). Read everything first, then write.
- **Putting big `<script>` tags in the `<head>` without `defer`.** The page stays blank until they load and run.
- **Thinking `display: none` and `visibility: hidden` are the same.** The first removes the box. The second keeps the space.

## 🗣️ How to answer in an interview

> "The browser parses HTML into the DOM and CSS into the CSSOM. It combines them into the render tree, which only has visible elements, so display none and the head are left out. Then it does layout, which calculates every box's size and position, then paint, which fills in pixels, and finally composite, where the GPU stacks the layers.
>
> CSS is render-blocking, and a normal script tag blocks the HTML parser, which is why we use defer or modules. For performance I keep in mind the cost of each change: width or height triggers layout, colour triggers paint, and transform and opacity can be done on the compositor only. So I animate with transform and opacity, and I batch DOM reads and writes to avoid layout thrashing."

## 🔁 Follow-up questions

### What is a repaint vs a reflow, with an example?

Changing `background-color` is a **repaint**: pixels change, but nothing moves. Changing `width` is a **reflow**: sizes and positions change, so layout runs again, and then paint and composite.

### Why does CSS block rendering but not parsing?

The HTML parser can keep building the DOM. But the browser won't paint until the CSSOM is ready. Painting unstyled content would cause a flash and then a jump.

### What is a compositor layer?

A separate painted surface that the GPU can move or fade on its own. Elements with things like `will-change: transform`, video or canvas often get their own layer. Too many layers use a lot of memory, so don't add them everywhere.

### How does React fit into this pipeline?

React works out the smallest set of [DOM changes](topic:react/virtual-dom). Then the browser runs its normal pipeline for those changes. Fewer DOM changes means less layout and paint work.

## ✅ Quick check

### 1. Which change is cheapest for the browser?

- A) `width: 300px` → `400px`
- B) `color: black` → `blue`
- C) `transform: translateX(0)` → `translateX(100px)`

:::answer
**C.** Transform can be handled in the composite step only. A needs layout, and B needs paint.
:::

### 2. Is an element with `display: none` in the DOM?

:::answer
**Yes, it's in the DOM**, so JavaScript can find it. But it's **not** in the render tree, so it has no box and no size.
:::

### 3. Which script tag stops the HTML parser?

- A) `<script src="app.js">`
- B) `<script defer src="app.js">`
- C) `<script type="module" src="app.js">`

:::answer
**A.** The parser waits for it to download and run. `defer` and `type="module"` let parsing continue.
:::
