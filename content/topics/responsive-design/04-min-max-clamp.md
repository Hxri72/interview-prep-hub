---
title: "min(), max() and clamp()"
stack: responsive-design
order: 4
level: Intermediate
mustKnow: false
askedFrequency: sometimes
summary:
  - "min(a, b) picks the SMALLER value. max(a, b) picks the BIGGER value."
  - "clamp(MIN, PREFERRED, MAX) tries the preferred value but never goes below MIN or above MAX."
  - "width: min(100% - 2rem, 1200px) makes a centred container that fits phones and stops at 1200px."
  - "font-size: clamp(1.5rem, 4vw, 3rem) makes fluid headings that grow with the screen, without media queries."
  - "Keep a rem part in fluid font sizes so text still grows when users zoom."
cards:
  - q: "What does min(100% - 2rem, 1200px) do?"
    a: "It picks the smaller of 'full width minus 32px' and 1200px. On phones it fills the screen with 16px space on each side; on big screens it stops at 1200px."
  - q: "Read clamp(1.5rem, 4vw, 3rem) out loud."
    a: "Try to be 4% of the screen width, but never smaller than 1.5rem (24px) and never bigger than 3rem (48px)."
  - q: "max(16px, 1rem) — when is it useful?"
    a: "It makes sure a size never drops below 16px, even if rem is set smaller."
  - q: "Why is clamp() good for responsive typography?"
    a: "The heading size changes smoothly with the screen width, so you don't need several media queries for font sizes."
---

## 💡 What is it?

`min()`, `max()` and `clamp()` are CSS **math functions**. They pick a size for you.

- `min(a, b)` picks the **smaller** value.
- `max(a, b)` picks the **bigger** value.
- `clamp(MIN, PREFERRED, MAX)` tries the preferred value, but keeps it **between** MIN and MAX.

They let sizes change smoothly with the screen, often **without any media queries**.

## 🏠 Real-life example

Think of **school uniform sizes** and a **thermostat**.

- `min()` = "Take the shirt that fits you, but never bigger than size L." You pick the smaller of the two.
- `max()` = "Your shoe must be at least size 5." You pick the bigger of the two.
- `clamp()` = an AC thermostat set to "follow the weather, but stay between 22°C and 26°C."
- The **weather** = the screen width (the preferred value).
- **22°C and 26°C** = the MIN and MAX limits.

## 🧑‍💻 Code example

Save as `index.html`, open it, and resize the window. Try 375px, 768px and 1280px.

```html
<!DOCTYPE html> <!-- a modern HTML5 page -->
<html lang="en"> <!-- English page -->
<head> <!-- page settings -->
  <meta name="viewport" content="width=device-width, initial-scale=1"> <!-- use the real phone width -->
  <style> /* CSS starts */
    body { margin: 0; font-family: system-ui, sans-serif; } /* no default outer space; a clean system font */
    .container { /* the main content box */
      width: min(100% - 2rem, 1200px); /* the SMALLER of: full width minus 32px, or 1200px */
      margin: 0 auto; /* 0 space top/bottom, auto left/right = centred */
      background: #e8f0fe; /* light blue so you can see the box */
    } /* end of .container */
    h1 { /* the big heading */
      font-size: clamp(1.5rem, 4vw, 3rem); /* try 4% of screen width, but stay between 24px and 48px */
    } /* end of h1 */
    .note { /* a small box of text */
      padding: max(1rem, 2vw); /* at least 16px of inside space, more on wide screens */
      background: #fff3cd; /* light yellow */
    } /* end of .note */
  </style> <!-- CSS ends -->
</head> <!-- end of settings -->
<body> <!-- visible part -->
  <div class="container"> <!-- the centred container -->
    <h1>Fluid heading</h1> <!-- heading that grows with the screen -->
    <p class="note">This box always has at least 16px padding.</p> <!-- box using max() -->
  </div> <!-- end of container -->
</body> <!-- end of visible part -->
</html> <!-- end of page -->
```

**What you see:**

```text
At 375px:  container = 343px wide (375 − 32), with 16px space each side.
           heading = 24px (4vw = 15px is too small, so clamp uses the 24px minimum).
           padding = 16px (2vw = 7.5px is smaller, so max picks 16px).
At 768px:  container = 736px wide.
           heading = 30.7px (4vw of 768 = 30.72px, inside the limits).
At 1280px: container = 1200px wide and centred (1248px would be bigger, so min picks 1200px).
           heading = 48px (4vw = 51.2px is too big, so clamp uses the 48px maximum).
           padding = 25.6px (2vw = 25.6px is bigger than 16px).
```

## 🔍 Deeper version

**How to read each function:**

| Function | Picks | Typical use |
|---|---|---|
| `min(a, b, …)` | The smallest value | A max width that also shrinks: `min(100%, 600px)` |
| `max(a, b, …)` | The biggest value | A minimum size: `max(44px, 3rem)` for tap targets |
| `clamp(MIN, VAL, MAX)` | `VAL`, limited to MIN…MAX | Fluid font sizes and spacing |

`clamp(MIN, VAL, MAX)` is the same as `max(MIN, min(VAL, MAX))`.

**Mixing units is allowed.** `min(100% - 2rem, 1200px)` mixes `%`, `rem` and `px`. The browser works it out at layout time. Inside these functions you can do math (`+ - * /`) without writing `calc()`. Note: `+` and `-` need spaces around them (`100% - 2rem`, not `100%-2rem`).

**The container pattern explained.** Before `min()`, people wrote:

```css
.container { width: 100%; max-width: 1200px; padding: 0 1rem; margin: 0 auto; } /* the older way: 3 properties */
```

`width: min(100% - 2rem, 1200px)` does the same in one line.

**Fluid typography and accessibility.** A font size of only `vw`, like `font-size: 4vw`, does **not** grow when users zoom the browser. That fails accessibility. Mixing in `rem` fixes it, for example `clamp(1.5rem, 1rem + 2vw, 3rem)`. The `1rem` part grows with zoom.

**Browser support.** `min()`, `max()` and `clamp()` work in every modern browser.

## 🎯 Why do we use it?

- **Fewer media queries.** One `clamp()` line replaces several breakpoint rules for font sizes.
- **Smooth changes.** Sizes grow gradually instead of jumping at breakpoints.
- **Safe limits.** Text never gets too tiny on phones or too huge on big monitors.

## ⚠️ Common mistakes

- **Mixing up min and max.** `min()` is used to set a **maximum** size (it picks the smaller). That feels backwards at first.
- **No spaces around `+` and `-`.** `min(100%-2rem, 1200px)` is invalid. Write `100% - 2rem`.
- **Using only `vw` for font sizes.** Text then ignores browser zoom. Add a `rem` part.
- **Putting MIN bigger than MAX** in `clamp()`. Then MIN always wins, which is confusing.

## 🗣️ How to answer in an interview

> "min picks the smallest value and max picks the biggest, and clamp takes a minimum, a preferred value and a maximum. I use them to make layouts responsive without extra media queries.
>
> For example, width: min(100% minus 2rem, 1200px) gives me a centred container that fills a phone with 16 pixels on each side but stops at 1200 pixels on large screens. For headings I use something like clamp(1.5rem, 4vw, 3rem), so the size grows with the screen but stays between 24 and 48 pixels.
>
> One thing I watch is accessibility: if the preferred value is pure vw, text won't grow when the user zooms, so I mix in a rem part."

## 🔁 Follow-up questions

### How is `clamp()` related to `min()` and `max()`?

`clamp(MIN, VAL, MAX)` equals `max(MIN, min(VAL, MAX))`. It is just a shorter way to write both limits.

### Can you replace media queries completely with clamp?

Not for layout changes like "one column → three columns". `clamp()` changes **sizes** smoothly. Changing the **structure** still needs media queries, container queries or Grid `auto-fit`.

### Do Tailwind or Mantine support this?

Yes. In Tailwind you can write arbitrary values like `text-[clamp(1.5rem,4vw,3rem)]`. In Mantine you can use the `style` prop or a CSS module, like `style={{ fontSize: 'clamp(1.5rem, 4vw, 3rem)' }}`.

## ✅ Quick check

### 1. The screen is 400px wide. What is `width: min(100% - 2rem, 1200px)` (no body margin)?

:::answer
**368px.** 400 − 32 = 368, which is smaller than 1200.
:::

### 2. The screen is 1600px wide. What size is `font-size: clamp(1.5rem, 4vw, 3rem)`?

:::answer
**48px (3rem).** 4vw = 64px, which is above the 48px maximum, so clamp uses the maximum.
:::

### 3. Which picks the bigger value?

- A) `min()`
- B) `max()`

:::answer
**B.** `max()` picks the biggest value, so it sets a **minimum** size.
:::
