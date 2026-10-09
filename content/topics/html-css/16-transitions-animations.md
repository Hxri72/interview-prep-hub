---
title: Transitions and animations
stack: html-css
order: 16
level: Intermediate
mustKnow: false
askedFrequency: sometimes
summary:
  - "A transition animates a change between two states, like hover: transition: background 0.3s ease."
  - "An animation uses @keyframes for many steps, and can run by itself, repeat and loop."
  - Animate only transform and opacity when you can. They are cheap for the browser and stay smooth.
  - Animating width, height, top or left forces layout work on every frame and can feel janky.
  - Respect prefers-reduced-motion, so people who get dizzy from motion see little or none.
cards:
  - q: Transition vs animation?
    a: A transition runs when a property changes (from A to B), usually on hover or a class change. An animation uses @keyframes, can have many steps, and can start by itself and loop.
  - q: Which properties are cheapest to animate?
    a: transform and opacity. The browser can usually do them on the GPU (compositor) without recalculating layout.
  - q: What is prefers-reduced-motion?
    a: A media query that is true when the user asked their system for less motion. Use it to remove or shorten animations.
  - q: What does ease-in-out mean?
    a: The timing curve. It starts slowly, speeds up in the middle and slows down at the end.
  - q: Why not animate height from 0 to auto?
    a: Classic CSS can't transition to auto, and animating height causes layout on every frame. Modern CSS adds interpolate-size, or you can use a grid-rows trick or transform.
---

## 💡 What is it?

**Transitions** and **animations** make changes move smoothly, instead of jumping.

- A **transition** animates a change from one state to another. For example, a button that slowly darkens when you hover.
- An **animation** uses `@keyframes` to describe many steps. It can start by itself and repeat, like a loading spinner.

## 🏠 Real-life example

Think of a **classroom light with a dimmer switch**.

- A normal switch = **no transition**. The light jumps from off to on.
- A dimmer you turn slowly = **a transition**. It moves smoothly from one state to another.
- A disco light that changes colour in a pattern, again and again = **an animation with keyframes**.
- A student who gets headaches from flashing lights asks you to switch it off = **`prefers-reduced-motion`**.

## 🧑‍💻 Code example

Save this as `index.html` and open it in your browser. Hover over the button.

```html
<!DOCTYPE html>                                         <!-- modern HTML page -->
<html lang="en">                                        <!-- page language = English -->
<head>                                                  <!-- page settings -->
  <style>                                               /* CSS starts here */
    .btn {                                              /* a button with a transition */
      padding: 10px 20px;                               /* 10px top/bottom, 20px left/right */
      background: royalblue; color: white; border: 0;   /* blue, white text, no border */
      transition: background 0.3s ease,                 /* animate background over 0.3 seconds, gentle curve */
                  transform 0.2s ease;                  /* animate transform over 0.2 seconds */
    }                                                   /* end of .btn */
    .btn:hover {                                        /* the "to" state */
      background: navy;                                 /* darker blue */
      transform: translateY(-3px);                      /* move up 3 pixels (cheap to animate) */
    }                                                   /* end of hover */
    @keyframes spin {                                   /* define an animation called "spin" */
      from { transform: rotate(0deg); }                 /* start: not rotated */
      to   { transform: rotate(360deg); }               /* end: one full turn */
    }                                                   /* end of keyframes */
    .spinner {                                          /* a loading spinner */
      width: 32px; height: 32px;                        /* 32 × 32 pixels */
      border: 4px solid #cbd5e1;                        /* light grey ring, 4px thick */
      border-top-color: royalblue;                      /* one blue part, so you can see it turn */
      border-radius: 50%;                               /* 50% = a circle */
      animation: spin 1s linear infinite;               /* run "spin" for 1s, same speed, forever */
    }                                                   /* end of .spinner */
    @media (prefers-reduced-motion: reduce) {           /* the user asked for less motion */
      .spinner { animation-duration: 3s; }              /* spin much slower */
      .btn { transition: none; }                        /* no movement on hover */
    }                                                   /* end of media query */
  </style>                                              <!-- CSS ends here -->
</head>                                                 <!-- end of head -->
<body>                                                  <!-- visible content -->
  <button class="btn">Hover me</button>                 <!-- transition demo -->
  <div class="spinner" role="status" aria-label="Loading"></div> <!-- animation demo; role tells screen readers it's a status -->
</body>                                                 <!-- end of body -->
</html>                                                 <!-- end of page -->
```

**What you see:**

```text
Hover the button: it smoothly turns dark blue and lifts up a little.
Move away: it smoothly goes back.
The spinner turns round and round, forever.
Turn on "Reduce motion" in your OS settings and reload:
the button no longer moves, and the spinner turns slowly.
```

## 🔍 Deeper version

**Transition shorthand:** `transition: property duration timing-function delay;`
- `property` — what to animate. Avoid `all`, because it can animate things you didn't plan for.
- `duration` — `0.2s` to `0.4s` feels natural for UI.
- `timing-function` — `ease` (default), `linear`, `ease-in`, `ease-out`, `ease-in-out`, `cubic-bezier(...)`, `steps(n)`.
- `delay` — wait before starting.

**Animation shorthand:** `animation: name duration timing-function delay iteration-count direction fill-mode;`
- `infinite` repeats forever. `alternate` plays forwards, then backwards.
- `animation-fill-mode: forwards` keeps the last keyframe after the end.

**Performance: the rendering pipeline.** On each frame, the browser can do **layout** (sizes and positions), **paint** (pixels) and **composite** (stack layers).

| You animate | Browser work per frame | Smooth? |
|---|---|---|
| `transform`, `opacity` | composite only (often on the GPU) | ✅ yes |
| `color`, `background` | paint + composite | usually OK |
| `width`, `height`, `top`, `left`, `margin` | layout + paint + composite | ⚠️ can jank |

"Jank" means dropped frames. The goal is 60 frames per second, which is about 16 ms per frame. See [critical rendering path](topic:html-css/critical-rendering-path).

`will-change: transform` hints the browser to prepare a layer. Use it only on a few elements, because each layer costs memory.

**Accessibility.** Some people get dizzy or sick from motion (vestibular disorders). Always add a `prefers-reduced-motion` block. Many teams flip it around: no motion by default, and motion only inside `@media (prefers-reduced-motion: no-preference)`.

**Modern features:**
- **View Transitions API** — `document.startViewTransition(() => updateDom())` animates between two page states. Same-page view transitions work in all major browsers now.
- **`@starting-style`** lets you transition an element as it first appears (for example, fading in a popover).
- **`interpolate-size: allow-keywords`** lets you transition `height: 0` to `height: auto`. It's newer, so check browser support first.
- **Scroll-driven animations** (`animation-timeline: scroll()`) tie an animation to the scroll position, with no JavaScript.

:::version[Version note]
`@starting-style` and same-document View Transitions reached all major browsers during 2024–2025. `interpolate-size` and scroll-driven animations are newer. Check caniuse.com before relying on them.
:::

## 🎯 Why do we use it?

- **Feedback.** A button that reacts on hover or press feels responsive.
- **Explaining change.** A panel that slides in shows the user where it came from.
- **Waiting.** A spinner or skeleton tells the user "loading", so they don't think the app is frozen.

Used well, motion makes an app easier to understand. Used badly, it's slow, distracting or even makes people sick.

## ⚠️ Common mistakes

- **`transition: all`.** It animates surprise properties and costs performance.
- **Animating `width`, `height`, `top` or `left`** for movement. Use `transform: translate()` / `scale()` instead.
- **Ignoring `prefers-reduced-motion`.**
- **Long animations on frequent actions.** A 1-second animation on every click quickly feels slow.
- **Putting `will-change` on everything.** It wastes memory.

## 🗣️ How to answer in an interview

> "A transition animates a property change between two states. I add transition: background 0.3s ease, and when the hover state or a class changes the background, it fades instead of jumping. An animation uses @keyframes, can have many steps, and can run by itself and loop, like a spinner.
>
> For performance, I try to animate only transform and opacity. The browser can handle those in the compositor without recalculating layout. Animating width, height, top or left forces layout on every frame and can drop frames. So to move something I use translate, not left.
>
> I also respect prefers-reduced-motion, removing or slowing animations for users who asked for less motion. And for page-state changes there's now the View Transitions API."

## 🔁 Follow-up questions

### How do you animate an element appearing from `display: none`?

Classic transitions can't animate from `display: none`. Modern CSS supports it with `@starting-style` and `transition-behavior: allow-discrete`. The older way is to animate `opacity` and `transform`, and toggle visibility after the animation ends.

### How do you know an animation is janky?

Record it in the Chrome DevTools **Performance** panel. Look for long frames and "Layout" or "Recalculate Style" blocks on each frame. Turn on "Paint flashing" in the Rendering panel to see what repaints.

### CSS animation or JavaScript animation?

Use CSS for simple state changes and loops. Use JavaScript (the Web Animations API, or libraries like Motion) when you need control: pause, reverse, follow a gesture, or chain steps based on logic.

### How do you run code when a transition ends?

Listen for the `transitionend` event (or `animationend`) in JavaScript.

## ✅ Quick check

### 1. Which is smoother to animate for moving a card 100px to the right?

- A) `left: 0` → `left: 100px`
- B) `transform: translateX(0)` → `transform: translateX(100px)`

:::answer
**B.** `transform` usually only needs compositing. Changing `left` makes the browser do layout and paint on every frame.
:::

### 2. What does `animation: spin 1s linear infinite;` mean?

:::answer
Run the `@keyframes` called **spin**, taking **1 second** per loop, at a **constant speed** (linear), **forever** (infinite).
:::
