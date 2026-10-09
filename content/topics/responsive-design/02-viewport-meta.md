---
title: The viewport meta tag
stack: responsive-design
order: 2
level: Basic
mustKnow: false
askedFrequency: common
summary:
  - "The viewport is the visible area of the browser window. On a phone it is small."
  - "<meta name='viewport' content='width=device-width, initial-scale=1'> tells the phone to use its real width and not zoom."
  - "Without it, phones pretend to be about 980px wide and shrink the whole page, so text is tiny."
  - "Media queries only work properly on phones when this tag is present."
  - "Don't block zooming with user-scalable=no or maximum-scale=1; it hurts accessibility."
cards:
  - q: "What does width=device-width mean?"
    a: "Make the page's layout width equal to the device's screen width (for example 375px on many phones)."
  - q: "What does initial-scale=1 mean?"
    a: "Start at 100% zoom: no zooming in or out when the page first opens."
  - q: "What happens if you forget the viewport tag?"
    a: "Phones lay out the page as if the screen were about 980px wide, then shrink it to fit. Text is tiny and your phone media queries never match."
  - q: "Should you add user-scalable=no?"
    a: "No. It stops people from zooming, which hurts users with poor eyesight and fails accessibility rules."
---

## 💡 What is it?

The **[viewport](glossary:viewport)** is the visible area of the browser window. On a phone, it is small. On a laptop, it is big.

The **viewport meta tag** is one line in the HTML `<head>`. It tells phones: "Use your real screen width. Don't zoom out."

Without it, responsive design does not work properly on phones.

## 🏠 Real-life example

Think of **printing a poster to fit an A4 sheet**.

If the printer thinks the poster is huge, it shrinks everything to fit the small sheet. The words become tiny. If you tell the printer the real size, it prints normally.

- The **poster** = your web page.
- The **A4 sheet** = the phone screen.
- The **printer shrinking everything** = a phone without the viewport tag, pretending to be 980px wide.
- **Telling the printer the real size** = `width=device-width`.

## 🧑‍💻 Code example

Make two files. Open both on your phone, or in DevTools device mode at 375px.

`with-tag.html`:

```html
<!DOCTYPE html> <!-- a modern HTML5 page -->
<html lang="en"> <!-- page language is English -->
<head> <!-- page settings -->
  <meta name="viewport" content="width=device-width, initial-scale=1"> <!-- use the real phone width, start at 100% zoom -->
  <style> /* CSS starts */
    body { font-size: 16px; } /* normal readable text, 16px */
    @media (max-width: 600px) { /* only when the screen is 600px or narrower */
      body { background: #fff3cd; } /* light yellow background on phones */
    } /* end of the media query */
  </style> <!-- CSS ends -->
</head> <!-- end of settings -->
<body> <!-- visible content -->
  <p>Hello from a phone-friendly page.</p> <!-- one paragraph of text -->
</body> <!-- end of visible content -->
</html> <!-- end of page -->
```

`without-tag.html`: copy the same file, but **delete the `<meta name="viewport" …>` line**.

**What you see at 375px:**

```text
with-tag.html:    normal-sized text, yellow background (the 600px media query matches)

without-tag.html: tiny, zoomed-out text, white background
                  (the phone pretends to be about 980px wide, so max-width: 600px does not match)
```

## 🔍 Deeper version

**Why phones zoom out by default.** Early smartphones had to show desktop websites. So mobile browsers invented a "layout viewport" about 980px wide (the exact number varies by browser). They lay the page out at that width, then scale it down to fit the screen. That kept old sites usable, but made them tiny.

**Two viewports:**

| Name | What it is |
|---|---|
| Layout viewport | The width the browser uses for layout and media queries |
| Visual viewport | The part you can actually see right now (changes when you pinch-zoom) |

`width=device-width` sets the **layout viewport** to the real device width, in CSS pixels. A CSS pixel is not a screen dot. A phone may have 3 screen dots per CSS pixel. That's why an iPhone with a 1179-dot-wide screen reports a width around 393px.

**The full recommended tag:**

```html
<meta name="viewport" content="width=device-width, initial-scale=1"> <!-- the standard line every page needs -->
```

**Optional extras you may see:**
- `viewport-fit=cover` — lets content go under the notch on iPhones. Then you add padding with `env(safe-area-inset-top)` and similar.
- `interactive-widget=resizes-content` — controls how the on-screen keyboard resizes the page in some browsers.

**Don't block zoom.** `user-scalable=no` or `maximum-scale=1` stop users from zooming. This fails accessibility rules (WCAG asks that text can zoom to 200%). Some browsers ignore it anyway.

**Frameworks add it for you.** Vite's starter `index.html` already has it. In Next.js, the tag is added by default.

## 🎯 Why do we use it?

- **Readable text on phones** without pinching and zooming.
- **Media queries work.** Your `min-width`/`max-width` rules see the real phone width.
- **It is the first step** of every responsive page. Nothing else works well without it.

## ⚠️ Common mistakes

- **Forgetting it** in a hand-made HTML page or an old template.
- **Adding `user-scalable=no`** to "fix" layout bugs. It hides the real problem and hurts users.
- **Writing it wrong**, like `width=device_width` (underscore). The browser ignores the bad value.
- **Using a fixed width**, like `width=1024`. Then phones zoom out again.

## 🗣️ How to answer in an interview

> "The viewport meta tag tells mobile browsers to lay out the page at the device's real width. The standard line is width=device-width, initial-scale=1. Without it, phones pretend the screen is about 980 pixels wide and shrink the whole page, so text is tiny and my phone media queries never match.
>
> I always include it, and I never add user-scalable=no, because blocking zoom is an accessibility problem. Most starters like Vite and Next.js add the tag for me, but I check it's there when something looks zoomed out on a phone."

## 🔁 Follow-up questions

### What is a CSS pixel vs a device pixel?

A device pixel is one dot on the screen. A CSS pixel is the unit you write in CSS. High-density screens use 2–3 device pixels per CSS pixel. `window.devicePixelRatio` tells you the ratio.

### My media query for phones doesn't work on a real phone, but works in DevTools. Why?

Most likely the viewport tag is missing or wrong. DevTools device mode can hide this. Check the `<head>` of the real page.

### How do you handle the iPhone notch?

Add `viewport-fit=cover` to the viewport tag. Then add padding with `env(safe-area-inset-top)` and the other safe-area values, so content doesn't hide behind the notch.

## ✅ Quick check

### 1. What does `initial-scale=1` do?

:::answer
It opens the page at 100% zoom, with no zoom in or out at the start.
:::

### 2. A page has no viewport tag. On a 375px phone, does `@media (max-width: 600px)` match?

:::answer
**No.** Without the tag, the phone uses a layout width of about 980px. 980 is more than 600, so the rule does not match.
:::

### 3. Is `user-scalable=no` a good way to stop layout problems on phones?

:::answer
**No.** It blocks zooming, which hurts accessibility. Fix the layout itself instead.
:::
