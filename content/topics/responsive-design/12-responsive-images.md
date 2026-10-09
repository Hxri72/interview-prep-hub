---
title: Responsive images and video (object-fit, aspect-ratio, lazy loading)
stack: responsive-design
order: 12
level: Basic
mustKnow: false
askedFrequency: common
summary:
  - "max-width: 100%; height: auto; = the image shrinks to fit its box and keeps its shape."
  - "object-fit: cover fills the box and crops the edges. object-fit: contain shows the whole image."
  - "aspect-ratio: 16 / 9 keeps a box 16 wide by 9 tall at any size, and stops the page jumping."
  - "loading=\"lazy\" downloads an image only when the user scrolls near it."
  - srcset + sizes let the browser pick a small file for phones and a big file for laptops.
cards:
  - q: How do you stop an image overflowing on a phone?
    a: "img { max-width: 100%; height: auto; } — never wider than its parent, and the height follows to keep the shape."
  - q: object-fit cover vs contain?
    a: Cover fills the whole box and crops edges (good for profile photos). Contain shows the whole image and may leave empty space (good for logos).
  - q: What does aspect-ratio do?
    a: It keeps a box at a fixed shape, like 16 / 9 for video, at any width. It also reserves space so the page doesn't jump while the image loads.
  - q: What does loading="lazy" do?
    a: The browser waits until the image is near the screen before downloading it. The first load is faster and uses less data.
  - q: What are srcset and sizes for?
    a: You list the same image in several widths (srcset) and how wide it will show (sizes). The browser downloads the best-sized file for the screen.
---

## 💡 What is it?

**Responsive images** fit any screen without breaking the layout or wasting data.

The main tools:
- `max-width: 100%` stops images from overflowing.
- `object-fit` decides how an image fills its box.
- `aspect-ratio` keeps a box the right shape.
- `loading="lazy"` downloads images only when needed.
- `srcset` lets the browser choose a smaller file for phones.

## 🏠 Real-life example

Think of **putting photos into a school album**.

- Some photos are bigger than the page. You **shrink them to fit**: `max-width: 100%`.
- For the **class photo frame**, you **trim the edges** so it fills the frame: `object-fit: cover`.
- For the **school logo**, you never cut it. You **fit the whole logo** and leave white space: `object-fit: contain`.
- Every frame is **cut to the same shape** first, so the page doesn't move later: `aspect-ratio`.
- You **only print photos for pages people open**: `loading="lazy"`.
- You keep a **small print and a poster print**, and hand out the right one: `srcset`.

## 🧑‍💻 Code example

Save this as `index.html` and open it in Chrome. Resize the window, or use device mode (F12 → phone icon).

```html
<!DOCTYPE html> <!-- modern HTML page -->
<html lang="en"> <!-- page language: English -->
<head> <!-- page settings -->
  <meta name="viewport" content="width=device-width, initial-scale=1"> <!-- fit the phone width -->
  <style> /* CSS starts */
    body { font-family: sans-serif; margin: 0 auto; padding: 16px; max-width: 900px; } /* centred page, at most 900px wide */
    img { max-width: 100%; height: auto; display: block; } /* never wider than the parent; keep the shape */
    .avatar { width: 120px; aspect-ratio: 1 / 1; object-fit: cover; border-radius: 50%; } /* 120px square, fill and crop, made round */
    .logo { width: 200px; aspect-ratio: 16 / 9; object-fit: contain; background: #eee; } /* whole logo visible inside a 16:9 grey box */
    .video { width: 100%; aspect-ratio: 16 / 9; border: 0; } /* full width, always 16 wide by 9 tall */
  </style> <!-- CSS ends -->
</head> <!-- end of settings -->
<body> <!-- visible page -->
  <img class="avatar" src="https://picsum.photos/id/64/600/400" alt="Candidate profile photo"> <!-- wide photo cropped into a circle -->
  <img class="logo" src="https://picsum.photos/id/10/600/400" alt="Company logo"> <!-- whole image shown, empty space allowed -->
  <!-- next line: srcset = three file sizes (400w, 800w, 1600w); sizes = 900px wide on big screens, else full width (100vw) -->
  <img src="https://picsum.photos/id/1015/800/450" srcset="https://picsum.photos/id/1015/400/225 400w, https://picsum.photos/id/1015/800/450 800w, https://picsum.photos/id/1015/1600/900 1600w" sizes="(min-width: 900px) 900px, 100vw" width="800" height="450" loading="lazy" alt="Mountain landscape"> <!-- width/height reserve the space; lazy = download when near the screen -->
  <iframe class="video" src="https://www.youtube.com/embed/dQw4w9WgXcQ" title="Demo video" loading="lazy"></iframe> <!-- video box keeps 16:9 at every width -->
</body> <!-- end of visible page -->
</html> <!-- end of page -->
```

**What you see:**

```text
375px  → round avatar, logo inside a grey box, landscape photo full width (about 343px), video 16:9
768px  → same, the photo and video grow with the screen
1280px → page stops at 900px wide; the browser downloads the 1600w photo on a sharp (2×) screen,
         the 800w photo on a normal one
DevTools → Network tab: the landscape photo and the video only load when you scroll near them
```

## 🔍 Deeper version

**`object-fit` values:**

| Value | What happens | Good for |
|---|---|---|
| `fill` (default) | stretches to the box, can look squashed | almost never |
| `cover` | fills the box, crops the edges | avatars, thumbnails, hero images |
| `contain` | whole image inside, empty space allowed | logos, product photos |
| `none` | original size, cropped by the box | rare |

Use `object-position: top` to choose which part stays visible when cropping.

**Layout shift (CLS).** When an image loads without a reserved space, the text below jumps down. Google measures this as **Cumulative Layout Shift**, a Core Web Vital. Fix it by setting `width` and `height` attributes, or `aspect-ratio` in CSS. Modern browsers use them to reserve the space before the image arrives.

**`srcset` with `w` descriptors.** `400w` means "this file is 400 pixels wide". The `sizes` attribute tells the browser how wide the image will **show**. The browser then does the maths, including screen density (2× and 3× screens need bigger files), and picks the best file.

**`<picture>` for art direction or formats:**

```html
<picture> <!-- a set of choices -->
  <source type="image/avif" srcset="hero.avif"> <!-- newest, smallest format if supported -->
  <source media="(max-width: 600px)" srcset="hero-tall.jpg"> <!-- a different crop on small screens -->
  <img src="hero.jpg" alt="Office team"> <!-- the fallback; alt text lives here -->
</picture> <!-- end of choices -->
```

**Lazy loading rules.**
- Don't lazy-load the **first big image** at the top of the page (the LCP image). It should load as soon as possible. You can even add `fetchpriority="high"` to it.
- Lazy-load images further down.

**Video.** Use `aspect-ratio: 16 / 9` on the `<video>` or `<iframe>`. Add `preload="none"` or `metadata` to `<video>` so it doesn't download the whole file at once.

**In React/Next.js.** Next.js's `<Image>` component does `srcset`, lazy loading and size reserving for you. In a Vite React app you write the HTML attributes yourself.

## 🎯 Why do we use it?

- **No broken layouts.** A 2000px photo inside a 375px phone creates sideways scrolling.
- **Faster pages.** Phones download small files, not desktop-sized ones. Lazy loading skips images nobody scrolls to.
- **No jumping content.** Reserved space keeps the page still while images load.
- **Nice crops.** Profile photos and thumbnails look neat at any size.

## ⚠️ Common mistakes

- **Fixed widths** like `width: 800px` on images. They overflow on phones. Use `max-width: 100%`.
- **Setting width and height in CSS** without `height: auto`. The image gets stretched.
- **Lazy-loading the top hero image.** It makes the most important image load late.
- **Missing `alt` text.** Screen readers can't describe the image. Use `alt=""` only for purely decorative images.

## 🗣️ How to answer in an interview

> "First I make sure images never overflow, with `max-width: 100%` and `height: auto`. For thumbnails and avatars I use `object-fit: cover` so they fill the box and crop neatly, and `contain` for logos. I reserve space with `width` and `height` attributes or `aspect-ratio`, so the page doesn't jump while images load, which helps the Cumulative Layout Shift score. Images below the fold get `loading="lazy"`, but never the main hero image. For performance I use `srcset` and `sizes` so phones download small files, and `<picture>` when I need a different crop or modern formats like AVIF. Videos get `aspect-ratio: 16 / 9` so they scale at any width."

## 🔁 Follow-up questions

### What is the difference between `srcset` and `<picture>`?

`srcset` gives the **same** image in different sizes, and the browser chooses. `<picture>` lets **you** choose different images or formats with rules, like a tall crop on phones or AVIF when supported.

### Why set `width` and `height` if CSS changes the size anyway?

The browser uses them to work out the **shape** (aspect ratio) before the image loads. It reserves the right space, so the layout doesn't shift.

### What is Cumulative Layout Shift?

A Core Web Vital that measures how much content jumps around while the page loads. Images without reserved space are a common cause.

### Should every image be lazy-loaded?

No. The image at the top of the page should load immediately. Lazy loading it makes the Largest Contentful Paint (LCP) slower.

## ✅ Quick check

### 1. A profile photo looks squashed in a 120×120 box. Which CSS fixes it?

- A) `object-fit: fill`
- B) `object-fit: cover`
- C) `max-width: 100%`

:::answer
**B.** `cover` keeps the photo's shape and crops the extra edges instead of stretching it.
:::

### 2. What does `400w` mean in `srcset`?

:::answer
The file is **400 pixels wide**. The browser uses this, plus `sizes` and the screen density, to choose a file.
:::

### 3. True or false: add `loading="lazy"` to the big hero image at the top of the page.

:::answer
**False.** It's visible straight away, so it should load immediately. Lazy-load images further down the page.
:::
