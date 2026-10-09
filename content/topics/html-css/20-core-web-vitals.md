---
title: Web performance basics (Core Web Vitals)
stack: html-css
order: 20
level: Advanced
mustKnow: false
askedFrequency: common
summary:
  - "Core Web Vitals are Google's three main user-experience scores: LCP (loading), INP (responsiveness) and CLS (visual stability)."
  - "Good targets: LCP 2.5 s or less, INP 200 ms or less, CLS 0.1 or less, measured at the 75th percentile of real visits."
  - INP replaced FID as a Core Web Vital in March 2024.
  - Lab tools (Lighthouse) test one load in a fixed setup. Field data (real users, e.g. the web-vitals library) is what really counts.
  - Fix LCP with fast servers, small images and no render-blocking files; INP with less JavaScript work; CLS by reserving space.
cards:
  - q: What are the three Core Web Vitals?
    a: LCP (Largest Contentful Paint, loading), INP (Interaction to Next Paint, responsiveness) and CLS (Cumulative Layout Shift, visual stability).
  - q: What are the "good" thresholds?
    a: LCP ≤ 2.5 seconds, INP ≤ 200 milliseconds, CLS ≤ 0.1.
  - q: What replaced FID?
    a: INP, in March 2024. FID only measured the delay of the first interaction; INP looks at all interactions on the page.
  - q: How do you prevent layout shift from images?
    a: Give images width and height attributes (or aspect-ratio), so the browser reserves the space before the image loads.
  - q: Lab data vs field data?
    a: Lab data (Lighthouse) is one test in a controlled setup, good for debugging. Field data comes from real users on real devices, and is what Google uses.
---

## 💡 What is it?

**Core Web Vitals** are three scores that measure how a page *feels* to a real user:

- **LCP — Largest Contentful Paint:** how fast the main content appears. (Loading.)
- **INP — Interaction to Next Paint:** how fast the page reacts when you click or type. (Responsiveness.)
- **CLS — Cumulative Layout Shift:** how much the page jumps around while loading. (Stability.)

Google uses them as one signal in search ranking. More importantly, they show where users suffer.

## 🏠 Real-life example

Think of **going to a school canteen**.

- **LCP** = how long until your plate of food arrives. You care about the main dish, not the spoon.
- **INP** = when you call the server, how long until they look at you and react. If they're busy, you wait and feel ignored.
- **CLS** = while you're about to sit, someone moves your chair, and you fall. It's annoying and dangerous, just like a "Buy" button that jumps as you tap it.

## 🧑‍💻 Code example

This page measures its own Core Web Vitals with Google's small `web-vitals` library. Save it as `index.html`, open it in **Chrome**, click the button, then switch to another tab and back. Watch the Console (F12).

```html
<!DOCTYPE html>                                                    <!-- modern HTML page -->
<html lang="en">                                                   <!-- page language = English -->
<head>                                                             <!-- page settings -->
  <meta name="viewport" content="width=device-width, initial-scale=1"> <!-- fit the phone screen -->
  <style>                                                          /* CSS starts here */
    .hero { width: 100%; height: auto; aspect-ratio: 16 / 9;       /* reserve a 16:9 box before the image loads (no CLS) */
            background: #e2e8f0; }                                 /* grey placeholder colour */
  </style>                                                         <!-- CSS ends here -->
</head>                                                            <!-- end of head -->
<body>                                                             <!-- visible content -->
  <!-- below: the big image is likely the LCP element; width/height + high priority help LCP and CLS -->
  <img class="hero" src="https://picsum.photos/1200/675" width="1200" height="675" fetchpriority="high" alt="Hero"> <!-- hero image -->

  <button id="btn">Click me</button>                               <!-- an interaction to measure INP -->
  <script type="module">                                           // module script: deferred by default
    import { onLCP, onINP, onCLS }                                 // three helper functions
      from 'https://unpkg.com/web-vitals@4?module';                // load the web-vitals library from a CDN
    onLCP((m) => console.log('LCP', Math.round(m.value), 'ms', m.rating)); // log LCP in ms + good/needs-improvement/poor
    onINP((m) => console.log('INP', Math.round(m.value), 'ms', m.rating)); // log INP (reported when you leave the tab)
    onCLS((m) => console.log('CLS', m.value.toFixed(3), m.rating));        // log CLS score (no unit)
    document.getElementById('btn').addEventListener('click', () => {      // when the button is clicked…
      const end = performance.now() + 300;                         // …plan to stay busy for 300 ms
      while (performance.now() < end) {}                           // block the main thread on purpose (bad INP!)
    });                                                            // end of click handler
  </script>                                                        <!-- end of script -->
</body>                                                            <!-- end of body -->
</html>                                                            <!-- end of page -->
```

**What you see in the Console** (a real run in Chrome; your numbers will differ):

```text
LCP 708 ms good
CLS 0.000 good
```

After you click the button and switch tabs, one more line appears. Because the click handler blocks for 300 ms, expect something like `INP 3xx ms needs-improvement` (200–500 ms).

The busy loop makes INP bad. Remove the `while` loop and INP drops below 200 ms. Remove `width`, `height` and `aspect-ratio` from the image, and CLS goes up.

## 🔍 Deeper version

**Thresholds** (Google, measured at the 75th percentile of page visits):

| Metric | Good | Needs improvement | Poor |
|---|---|---|---|
| LCP | ≤ 2.5 s | 2.5–4 s | > 4 s |
| INP | ≤ 200 ms | 200–500 ms | > 500 ms |
| CLS | ≤ 0.1 | 0.1–0.25 | > 0.25 |

"75th percentile" means 3 out of 4 real visits must be at least that good.

**How to improve LCP** (the largest image or text block):
- **Fast server response.** Low TTFB (time to first byte), use a CDN, cache HTML.
- **Find the LCP resource early.** Use a real `<img>` in the HTML, not a CSS background added later by JavaScript. Add `fetchpriority="high"`, and never `loading="lazy"` on the hero image.
- **Smaller images.** Use AVIF or WebP, and `srcset` for the right size. See [responsive images](topic:responsive-design/responsive-images).
- **Remove render-blocking work.** Keep critical CSS small, and `defer` scripts. See [critical rendering path](topic:html-css/critical-rendering-path).
- **SPAs.** A client-only React app shows nothing useful until JavaScript loads. Use code splitting, or server rendering (Next.js), to help. See [code splitting](topic:react/code-splitting).

**How to improve INP** (input delay + processing time + time to paint):
- **Break up long tasks** (over 50 ms). Yield to the browser with `await scheduler.yield()` or `setTimeout`.
- **Do less work on each interaction.** Debounce search, avoid huge re-renders, use `useTransition` for non-urgent updates. See [useTransition](topic:react/use-transition-deferred).
- **Ship less JavaScript.** Remove unused libraries, and lazy-load heavy parts.
- **Move heavy work** to a Web Worker.

**How to improve CLS:**
- Set `width`/`height` or `aspect-ratio` on images, videos and ads.
- Reserve space for banners and late content, using skeletons.
- Use `font-display: swap` with a similar fallback font (or `size-adjust`) to avoid text jumping.
- Animate with `transform`, not `top`/`height`.

**Lab vs field data:**

| | Lab (Lighthouse, DevTools) | Field (real users) |
|---|---|---|
| Source | one simulated load | Chrome UX Report, `web-vitals` sent to your analytics |
| Good for | debugging, before release | the true picture, ranking |
| INP | can't measure well (no real clicks); uses TBT as a hint | ✅ |

**Other useful metrics:** TTFB (server speed), FCP (first content), TBT (Total Blocking Time, a lab metric).

:::version[Version note]
**INP replaced FID** (First Input Delay) as a Core Web Vital on **12 March 2024**. FID only measured the delay before the *first* interaction was handled. INP covers the whole response for interactions across the visit, so it's much harder to "pass by accident".
:::

## 🎯 Why do we use it?

- **Users leave slow pages.** Faster loading and quick reactions keep people on the site.
- **One shared language.** Product, design and engineering can agree on numbers like "LCP under 2.5 s".
- **Search ranking.** Page experience is one of Google's ranking signals.
- **They catch real problems.** For example, a jumping button that causes wrong clicks, or a heavy script freezing the page.

## ⚠️ Common mistakes

- **Trusting only Lighthouse.** A great lab score on a fast laptop can hide poor field data on cheap phones.
- **Lazy-loading the hero image.** It delays LCP.
- **Images and ads without reserved space.** This causes CLS.
- **One huge JavaScript bundle**, plus heavy work in click handlers, which makes INP poor.

## 🗣️ How to answer in an interview

> "Core Web Vitals are three user-centred metrics. LCP measures loading: when the largest content element appears; good is 2.5 seconds or less. INP measures responsiveness: the time from a user interaction to the next paint, across the visit; good is 200 milliseconds or less. It replaced FID in March 2024. CLS measures visual stability, how much content jumps; good is 0.1 or less. They're judged at the 75th percentile of real users.
>
> To improve LCP I make the hero resource load early and small: a real img tag with fetchpriority high, modern formats, a CDN, and no render-blocking scripts. For INP I reduce JavaScript work per interaction: break up long tasks, debounce, avoid big re-renders. For CLS I reserve space with width and height or aspect-ratio, and use skeletons.
>
> I use Lighthouse for debugging, but I trust field data from real users, for example the web-vitals library sending metrics to analytics."

[FILL IN: any real performance improvement you made on the SkillKeepr frontend — e.g. code splitting or image handling — and its effect, if you measured it.]

## 🔁 Follow-up questions

### Why is INP hard to measure in Lighthouse?

Lighthouse loads the page but doesn't click anything like a real user, so it uses Total Blocking Time as a hint. Real INP needs field data from real interactions.

### What is a "long task"?

Any main-thread task over 50 ms. While it runs, the browser can't respond to clicks or typing, which hurts INP.

### How does a single-page React app affect LCP?

The HTML is nearly empty, so the browser must download, parse and run JavaScript before showing the main content. Smaller bundles, code splitting, preloading, and server rendering or static generation all help.

### What causes CLS from fonts?

The fallback font and the web font have different sizes. When the web font arrives, text re-flows. Use a fallback with matching metrics (`size-adjust`), or preload the font.

## ✅ Quick check

### 1. A page's main image loads at 3.2 s for most users. Which metric is affected, and is it good?

:::answer
**LCP**, and it **needs improvement** (2.5–4 s). Good is 2.5 s or less.
:::

### 2. Which change most directly reduces CLS?

- A) Minifying JavaScript
- B) Adding `width` and `height` to images
- C) Using a CDN

:::answer
**B.** Reserving the image's space stops the content below it from jumping. A and C mainly help loading speed (LCP).
:::
