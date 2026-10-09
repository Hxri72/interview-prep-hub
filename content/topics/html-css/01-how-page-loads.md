---
title: "How a web page loads (HTML, CSS, JavaScript)"
stack: html-css
order: 1
level: Basic
mustKnow: false
askedFrequency: common
summary:
  - "HTML is the skeleton, CSS is the paint, JavaScript is the brain."
  - "The browser downloads the HTML first, reads it top to bottom, and builds the DOM tree."
  - "CSS builds a second tree (the CSSOM). DOM + CSSOM together decide what gets painted."
  - "A normal script tag stops HTML reading until the script downloads and runs. Use defer or put scripts at the end."
  - "Steps to remember: request → HTML → DOM → CSSOM → layout → paint."
cards:
  - q: What are the three languages of a web page, and what does each do?
    a: HTML gives the structure, CSS gives the look, JavaScript gives the behaviour.
  - q: What is the DOM?
    a: The browser's tree of all elements on the page. JavaScript can read and change it.
  - q: Why can a script tag in the head slow the page?
    a: A normal script blocks HTML reading until it downloads and runs. The page stays blank longer. Use defer.
  - q: What is the CSSOM?
    a: The tree the browser builds from all the CSS rules. With the DOM it forms the render tree.
  - q: Name the main steps from URL to pixels.
    a: "DNS + request → download HTML → build DOM → build CSSOM → layout (sizes and positions) → paint → composite."
---

## 💡 What is it?

A web page is made of three languages. **[HTML](glossary:html)** is the structure. **[CSS](glossary:css)** is the look. **JavaScript** is the behaviour.

When you open a page, the browser downloads these files. Then it turns them into pixels on your screen in a fixed order of steps.

## 🏠 Real-life example

Think of **building a school stage for annual day**.

- The **HTML** = the wooden frame of the stage. Where the steps go, where the curtain goes.
- The **CSS** = the paint, lights and decorations. Red curtain, blue floor.
- The **JavaScript** = the stage crew. They open the curtain when the show starts.
- The **DOM** = the drawing of the stage on paper, with every part labelled.
- **Layout** = measuring where each part goes and how big it is.
- **Paint** = actually painting it.

If the stage crew arrives late and blocks the door (a slow script), nobody can keep building until they move.

## 🧑‍💻 Code example

Save this as `index.html` and open it in your browser. Then open DevTools (press F12) and look at the **Network** tab.

```html
<!DOCTYPE html>                                   <!-- tells the browser: this is modern HTML5 -->
<html lang="en">                                  <!-- root element; lang="en" = the page is in English -->
<head>                                            <!-- info about the page, not shown directly -->
  <meta charset="UTF-8">                          <!-- UTF-8 = text encoding that supports all languages -->
  <title>Loading demo</title>                     <!-- the text shown on the browser tab -->
  <style>                                         <!-- CSS inside the page -->
    h1 { color: teal; }                           /* every h1 heading becomes teal */
  </style>                                        <!-- end of CSS -->
  <script defer src="data:text/javascript,console.log('script ran after HTML was read')"></script> <!-- defer = download now, run after the HTML is fully read -->
</head>                                           <!-- end of head -->
<body>                                            <!-- everything visible goes here -->
  <h1>Hello</h1>                                  <!-- a big heading; CSS makes it teal -->
  <p id="msg">This text is HTML.</p>              <!-- a paragraph with id="msg" -->
  <script>                                        <!-- an inline script at the end of body -->
    document.getElementById('msg').textContent += ' JavaScript changed me.'; // find the paragraph and add text to it
    console.log('inline script ran');             // message in the Console tab
  </script>                                       <!-- end of the inline script -->
</body>                                           <!-- end of body -->
</html>                                           <!-- end of the page -->
```

```text
On screen: a teal "Hello" heading, and the line
"This text is HTML. JavaScript changed me."

In the Console:
inline script ran
script ran after HTML was read
```

The inline script runs first, because it sits at the end of the body. The `defer` script waits until all HTML is read.

## 🔍 Deeper version

**The steps (the "critical rendering path"):**

| Step | What happens |
|---|---|
| 1. Request | DNS finds the server's address. The browser sends an HTTP request. |
| 2. HTML | The server sends HTML. The browser reads it top to bottom, in pieces. |
| 3. DOM | Each tag becomes a node in the [DOM](glossary:dom) tree. |
| 4. CSSOM | CSS files and `<style>` tags become the CSSOM tree. |
| 5. Render tree | DOM + CSSOM, without hidden things like `display: none`. |
| 6. Layout | The browser works out the size and position of every box. |
| 7. Paint | It fills pixels: text, colours, borders, images. |
| 8. Composite | It stacks the painted layers in the right order. |

**What blocks what:**
- **CSS blocks rendering.** The browser won't paint until it has the CSS. Otherwise you would see an ugly flash of unstyled page.
- **A normal `<script>` blocks parsing.** The HTML reader stops and waits for it.
- `async` and `defer` stop scripts from blocking. See [async vs defer](topic:html-css/async-defer).

**Reflow and repaint.** If JavaScript changes a size or position, the browser must redo layout ("reflow"). Changing only a colour needs just a repaint. Reflow is more expensive. See [critical rendering path](topic:html-css/critical-rendering-path).

**A React app is the same.** A Vite React app sends a tiny HTML file with an empty `<div id="root">`. JavaScript then builds the whole page. That's why a big JavaScript bundle makes the first load slow. See [the slow first load scenario](topic:debugging/slow-first-load).

## 🎯 Why do we use it?

Knowing the steps helps you make pages **load fast** and **feel smooth**.
- You know why to put scripts at the end or use `defer`.
- You know why big CSS or JavaScript files delay the first paint.
- You can explain what the browser does when an interviewer asks "what happens when you open a URL?".

## ⚠️ Common mistakes

- **Putting a normal `<script>` in the `<head>`** that touches the page. The elements don't exist yet, so you get `null`.
- **Thinking HTML controls the look.** HTML is structure. CSS does the colours and layout.
- **Loading huge CSS or JavaScript files** you don't need on the first screen.
- **Changing layout in a loop** with JavaScript (read size, write size, read size…). Each one can force a reflow.

## 🗣️ How to answer in an interview

> "A page has three parts. HTML gives the structure, CSS gives the look, and JavaScript adds behaviour. When the browser loads a page, it downloads the HTML and reads it top to bottom to build the DOM tree. It also builds the CSSOM from the CSS. It combines them into a render tree, then does layout to find every box's size and position, then paints the pixels.
>
> Two things block this. CSS blocks painting, and a normal script tag blocks HTML parsing. So I load scripts with defer, or put them at the end, and I keep the CSS and JavaScript for the first screen small. In a React app most of the page is built by JavaScript, so bundle size matters a lot for the first load."

## 🔁 Follow-up questions

### What happens when you type a URL and press Enter?

The browser finds the server's IP address with DNS. It opens a connection (TCP, plus TLS for HTTPS). It sends an HTTP request and gets the HTML back. Then it builds the DOM and CSSOM, does layout and paints. Extra files (CSS, JS, images) are downloaded as the browser finds them.

### Why does CSS block rendering but not parsing?

The browser can keep reading HTML while CSS downloads. But it won't paint, because painting without CSS would show the page with no styles first. That flash looks broken.

### What is the difference between reflow and repaint?

Reflow (layout) recalculates sizes and positions. Repaint only redraws pixels, like a new colour. Reflow is more costly, and it usually causes a repaint too.

### Where should script tags go?

In the `<head>` with `defer`, or at the end of `<body>`. Both let the HTML load first. `defer` also starts the download early.

## ✅ Quick check

### 1. Which is the correct order?

- A) Paint → DOM → Layout
- B) DOM → CSSOM → Layout → Paint
- C) Layout → DOM → Paint

:::answer
**B.** The browser builds the DOM and CSSOM first, then calculates layout, then paints.
:::

### 2. A normal script in the head runs `document.getElementById('msg')`. The paragraph is in the body. What does it return?

:::answer
**`null`.** The script runs before the browser has read the body, so the paragraph doesn't exist yet. Use `defer` or move the script to the end of the body.
:::

### 3. True or false: changing an element's `color` with JavaScript forces a full layout (reflow).

:::answer
**False.** A colour change only needs a repaint. Changing width, height or position needs a reflow.
:::
