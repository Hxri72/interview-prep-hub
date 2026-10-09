---
title: Testing responsive pages (DevTools widths, tap targets, no sideways scroll)
stack: responsive-design
order: 17
level: Basic
mustKnow: false
askedFrequency: common
summary:
  - "Check in Chrome DevTools device mode at 360, 375, 414, 768, 1024, 1280 and 1440px."
  - "There must be no sideways scrolling at any width. Find the guilty element with * { outline: 1px solid red; }."
  - "Buttons must be big enough for a thumb: about 44 × 44 px."
  - Nothing important may work only on hover — phones have no hover.
  - Zoom the browser to 200% and check the text still reads well. Then test on a real phone.
cards:
  - q: Which widths do you check?
    a: Common ones like 360, 375, 414 (phones), 768 (tablet), 1024, 1280 and 1440 (laptops). And drag slowly between them to find breakpoints that look bad.
  - q: How do you find what causes sideways scrolling?
    a: "Add * { outline: 1px solid red; } for a moment. The box that sticks out past the right edge is the culprit. Or run a small script that lists elements wider than the window."
  - q: How big should tap targets be?
    a: About 44 × 44 px (Apple's guideline; Google suggests 48 × 48 dp). WCAG 2.2 sets a minimum of 24 × 24 CSS px.
  - q: Why test at 200% zoom?
    a: Some users zoom in to read. WCAG asks that text can be resized to 200% without losing content or function.
  - q: Why still test on a real phone after DevTools?
    a: Real phones show touch, the on-screen keyboard, browser bars, notches and real performance, which DevTools can't fully copy.
---

## 💡 What is it?

**Responsive testing** means checking your page at many screen sizes, and fixing what breaks.

A simple checklist:
1. Check common widths in **Chrome DevTools device mode**.
2. **No sideways scrolling** at any width.
3. **Buttons big enough** to tap with a thumb (about 44 × 44 px).
4. **Nothing works only on hover.**
5. **Text still readable at 200% zoom.**
6. **Test on a real phone.**

## 🏠 Real-life example

Think of a **tailor fitting a school uniform**.

- The tailor makes the student **stand, sit, raise their arms and walk**. Each pose can show a problem.
- If one **sleeve sticks out**, it gets fixed.
- **Buttons must be easy to open**, even with cold fingers.
- Finally, the student wears it **for a real school day**.

Mapping:
- **The poses** = screen widths (360, 768, 1280…).
- **A sleeve sticking out** = an element wider than the screen, causing sideways scroll.
- **Easy buttons** = 44px tap targets.
- **A real school day** = testing on a real phone.

## 🧑‍💻 Code example

Two small tools. Open any page, press F12, go to the **Console** tab and paste one.

**Tool 1: outline every box** to see what sticks out.

```js
const style = document.createElement('style'); // make a new <style> tag
style.textContent = '* { outline: 1px solid red; }'; // a red outline on EVERY element (outline doesn't change the layout)
document.head.appendChild(style); // add it to the page; refresh the page to remove it
```

**Tool 2: list the elements that are too wide.**

```js
const pageWidth = document.documentElement.clientWidth; // the visible page width in pixels
const tooWide = [...document.querySelectorAll('body *')] // every element inside <body>
  .filter((el) => el.getBoundingClientRect().right > pageWidth + 1) // keep ones whose right edge is past the screen
  .map((el) => `${el.tagName.toLowerCase()}.${el.className} → right edge ${Math.round(el.getBoundingClientRect().right)}px`); // describe each one
console.log(`Page width: ${pageWidth}px`); // print the page width
console.log(tooWide.length ? tooWide : 'No element sticks out 🎉'); // print the guilty elements, or a happy message
```

**Example output** on a broken page at 375px:

```text
Page width: 375px
[ 'img.hero → right edge 812px', 'table. → right edge 640px' ]
```

Here, the hero image needs `max-width: 100%`, and the table needs an `overflow-x: auto` wrapper. After the fix:

```text
Page width: 375px
No element sticks out 🎉
```

## 🔍 Deeper version

**DevTools device mode (Chrome).**
- Press **F12**, then the **phone icon** (or Ctrl+Shift+M / Cmd+Shift+M).
- Pick devices or type a width. Choose **Responsive** and **drag** the edge slowly. Breakpoints should sit where the design starts to look bad.
- Turn on **touch simulation** and test **landscape**.
- Use **throttling** (slow 4G, CPU 4× slowdown) to feel what phone users feel.

**Widths to check:** 360, 375, 414 (phones); 768 (tablet portrait); 1024 (tablet landscape / small laptop); 1280, 1440 (laptops). Also test just below and above each breakpoint (767 and 768, for example).

**Common causes of sideways scrolling:**

| Cause | Fix |
|---|---|
| Image wider than the screen | `max-width: 100%; height: auto;` |
| Fixed widths like `width: 600px` | `max-width`, `%`, or `min(100%, 600px)` |
| Long words or URLs | `overflow-wrap: anywhere;` |
| Wide tables or code blocks | wrap in `overflow-x: auto` |
| `100vw` with a scrollbar | use `100%` instead |
| Negative margins | check the parent padding |

**Tap targets.** Apple suggests 44 × 44 pt, and Google 48 × 48 dp. **WCAG 2.2** (success criterion 2.5.8) sets a minimum of **24 × 24 CSS px**, with some exceptions. Also leave space between targets.

**Hover.** Don't hide important actions behind `:hover`. Use `@media (hover: hover)` for hover-only extras.

**Zoom and text.** At 200% zoom, text must still fit and work (WCAG 1.4.4 Resize Text). A related rule (WCAG 1.4.10 Reflow) says content should work at a 320px-wide view without two-way scrolling.

**Automated help.**
- **Lighthouse** (in DevTools) checks the viewport tag, tap targets, font sizes and performance.
- **Playwright** can take screenshots at many sizes in CI, so layout changes are caught in review.

**Real devices.** Test on at least one Android and one iPhone. Look for keyboard covering inputs, browser bars changing the height (`100vh` problems; use `100dvh`), and notches.

## 🎯 Why do we use it?

Most traffic to many sites comes from phones. A page that scrolls sideways, has tiny buttons or hides actions behind hover feels broken, and users leave.

A short, repeatable checklist catches these problems **before** users see them.

## ⚠️ Common mistakes

- **Testing only at one phone size** like 375px.
- **Never dragging between breakpoints.** Many bugs live at 800px, between "tablet" and "laptop".
- **Trusting DevTools only.** Real keyboards, touch and browser bars behave differently.
- **Ignoring zoom and accessibility.** Pages must still work at 200% zoom.

## 🗣️ How to answer in an interview

> "I test in Chrome DevTools device mode at common widths: 360, 375 and 414 for phones, 768 for tablets, and 1024, 1280 and 1440 for laptops. I also drag the width slowly to catch awkward in-between sizes. My checklist is: no sideways scrolling at any width, tap targets about 44 by 44 pixels, nothing that only works on hover, and text that still works at 200% zoom. To find sideways scroll, I temporarily add a red outline to every element, or run a small script that lists elements wider than the viewport. Then I check on a real Android phone and an iPhone, because the keyboard, touch and browser bars behave differently. Lighthouse helps too."

## 🔁 Follow-up questions

### Why does `width: 100vw` sometimes cause sideways scrolling?

`100vw` includes the vertical scrollbar's width on desktop. So the element is a little wider than the visible area. Use `width: 100%` instead.

### What is `100dvh`, and why use it?

On phones, the browser bars appear and disappear, so `100vh` can be taller than the visible area. `100dvh` (dynamic viewport height) follows the real visible height.

### How can you automate responsive checks?

Playwright or Cypress can open the page at several viewport sizes and take screenshots. Visual-diff tools then flag changes in pull requests.

### How do you test a hover-only feature?

Turn on touch simulation in DevTools, and check it on a real phone. If the action can't be reached, add a click or tap way to open it.

## ✅ Quick check

### 1. Which CSS rule is a quick way to see every box on the page?

:::answer
`* { outline: 1px solid red; }`. Outlines don't change the layout, so you see the real sizes.
:::

### 2. A hero image causes sideways scroll on phones. Which fix is best?

- A) `overflow: hidden` on `<body>`
- B) `img { max-width: 100%; height: auto; }`
- C) `width: 100vw` on the image

:::answer
**B.** It fixes the cause. Hiding overflow on `<body>` only hides the problem, and can cut off content.
:::

### 3. What is a good tap-target size for a mobile button?

:::answer
About **44 × 44 px**. (WCAG 2.2's absolute minimum is 24 × 24 px.)
:::
