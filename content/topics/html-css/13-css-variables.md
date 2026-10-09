---
title: CSS variables (custom properties)
stack: html-css
order: 13
level: Basic
mustKnow: false
askedFrequency: common
summary:
  - "A CSS variable stores a value once: --brand: #1f5f99. You use it with var(--brand)."
  - Variables are usually declared on :root, so every element on the page can use them.
  - They follow the cascade and inheritance, so a section can override a variable for its own children.
  - They can change at runtime (in a media query, a class, or from JavaScript), which makes themes and dark mode easy.
  - var(--x, fallback) gives a backup value if the variable is missing.
cards:
  - q: How do you declare and use a CSS variable?
    a: "Declare it with two dashes, like --brand: #1f5f99; inside a selector (often :root). Use it with color: var(--brand);"
  - q: Sass variables vs CSS variables?
    a: Sass variables are replaced at build time and are gone in the browser. CSS variables live in the browser, follow the cascade and can change at runtime.
  - q: What does :root mean?
    a: The top element of the page (the html element). Variables declared there are available everywhere.
  - q: How do you change a CSS variable from JavaScript?
    a: "document.documentElement.style.setProperty('--brand', 'tomato');"
  - q: What is the second value in var(--gap, 16px)?
    a: A fallback. It is used if --gap is not defined.
---

## 💡 What is it?

A **CSS variable** is a named box that stores a value, like a colour or a size.

You write it once: `--brand: #1f5f99;`. Then you use it anywhere: `color: var(--brand);`.

If you change the value in one place, every element that uses it updates. The official name is **custom property**.

## 🏠 Real-life example

Think of the **school uniform colour**.

The principal writes one rule on the notice board: "Our colour is blue." Every class makes shirts, ties and badges in that colour.

- The **notice board** = `:root`, the top of the page.
- **"Our colour is blue"** = `--brand: blue;`
- **Making a shirt "in our colour"** = `color: var(--brand);`
- The **sports team** can have its own rule, "our colour is red". Only that team uses red. This is overriding the variable in one section.

If the principal changes the colour, everyone's shirt changes. You don't edit each shirt.

## 🧑‍💻 Code example

Save this as `index.html` and open it in your browser. Click the button.

```html
<!DOCTYPE html>                                         <!-- modern HTML page -->
<html lang="en">                                        <!-- page language = English -->
<head>                                                  <!-- page settings -->
  <style>                                               /* CSS starts here */
    :root {                                             /* :root = the html element, top of the page */
      --brand: #1f5f99;                                 /* a variable named --brand: dark blue */
      --space: 16px;                                    /* a variable for spacing: 16 pixels */
      --radius: 8px;                                    /* a variable for rounded corners: 8 pixels */
    }                                                   /* end of :root */
    .card {                                             /* style for each card */
      border: 2px solid var(--brand);                   /* border uses the brand colour */
      padding: var(--space);                            /* inside space uses the spacing variable */
      margin: var(--space);                             /* outside space uses the same variable */
      border-radius: var(--radius);                     /* rounded corners from the variable */
      color: var(--brand);                              /* text colour from the variable */
    }                                                   /* end of .card */
    .sports { --brand: crimson; }                       /* override --brand only inside .sports */
    .card small { color: var(--muted, grey); }          /* --muted is not defined, so the fallback grey is used */
  </style>                                              <!-- CSS ends here -->
</head>                                                 <!-- end of head -->
<body>                                                  <!-- visible content -->
  <div class="card">Normal card<br><small>hint</small></div>   <!-- blue card, grey hint -->
  <div class="sports">                                  <!-- this section overrides --brand -->
    <div class="card">Sports card</div>                 <!-- red card -->
  </div>                                                <!-- end of sports -->
  <button id="theme">Change brand colour</button>       <!-- a button to change the variable -->
  <script>                                              // JavaScript starts here
    const btn = document.getElementById('theme');       // find the button
    btn.addEventListener('click', () => {               // when the button is clicked…
      document.documentElement.style                    // …take the html element's inline style…
        .setProperty('--brand', 'seagreen');            // …and set --brand to green
    });                                                 // end of click handler
  </script>                                             <!-- JavaScript ends here -->
</body>                                                 <!-- end of body -->
</html>                                                 <!-- end of page -->
```

**What you see:**

```text
"Normal card" has a blue border and blue text, with a grey "hint".
"Sports card" is red, because .sports overrides --brand.
Click the button: the normal card turns green.
The sports card stays red, because its own --brand is closer to it.
```

## 🔍 Deeper version

**1. They follow the cascade.** A custom property is a normal CSS property. It is **inherited** by children, and a closer declaration wins. That is why the sports card stayed red.

**2. Sass/Less variables vs CSS variables:**

| | Sass `$brand` | CSS `--brand` |
|---|---|---|
| When it is resolved | at build time | in the browser, at runtime |
| Can change per section | no | yes, via the cascade |
| Can change in a media query | no | yes |
| Can JavaScript read/change it | no | yes (`getComputedStyle`, `setProperty`) |

**3. Fallbacks.** `var(--gap, 1rem)` uses `1rem` if `--gap` is not set. Fallbacks can nest: `var(--a, var(--b, 10px))`.

**4. Invalid values.** If a variable holds something invalid for a property, like `--size: red` in `width: var(--size)`, the property becomes `unset` (its inherited or initial value). The browser does not "skip to the previous rule". This surprises people.

**5. Theming and dark mode.** Put a palette in `:root`. Override it for a dark theme:

```css
:root { --bg: white; --text: #1e293b; }                   /* light theme values */
[data-theme="dark"] { --bg: #0f172a; --text: #e2e8f0; }   /* dark theme overrides the same names */
body { background: var(--bg); color: var(--text); }       /* components only use the names */
```

Components never change. Only the variable values change.

**6. `@property`.** You can register a variable with a type and a default value. Then the browser can animate it (for example, a gradient angle).

```css
@property --angle { syntax: '<angle>'; inherits: false; initial-value: 0deg; }   /* typed variable */
```

**7. Design tokens.** Tailwind v4 and MUI v6+ expose their theme as CSS variables. See [customising Tailwind with @theme](topic:mui-tailwind/tailwind-theme) and [dark mode in MUI](topic:mui-tailwind/mui-dark-mode).

:::version[Version note]
`@property` works in all major browsers since mid-2024 (Firefox was last). Plain custom properties have worked everywhere for years.
:::

## 🎯 Why do we use it?

- **One source of truth.** The brand colour is written once. Changing it is a one-line edit.
- **Themes and dark mode** without duplicating every rule.
- **Responsive values.** Change `--space` inside a media query, and every component that uses it adapts.
- **A bridge to JavaScript.** JavaScript can set a variable, and CSS does the rest. For example, mouse position for an effect.

## ⚠️ Common mistakes

- **Forgetting the two dashes.** `brand: blue` is not a variable. It must be `--brand`.
- **Using it without `var()`.** `color: --brand` doesn't work. Write `color: var(--brand)`.
- **Using variables inside media query conditions.** `@media (min-width: var(--bp))` does not work. Media query conditions can't read custom properties.
- **Thinking a typo falls back to the old value.** An invalid value makes the property `unset`, not "the previous rule".

## 🗣️ How to answer in an interview

> "CSS variables, or custom properties, let me store a value once, like --brand: #1f5f99, and use it with var(--brand). I usually declare them on :root so the whole page can use them.
>
> Unlike Sass variables, which are replaced at build time, CSS variables live in the browser. They follow the cascade, so a section can override a variable for its children, and they can change at runtime: in a media query, under a data-theme attribute, or from JavaScript with setProperty. That's what makes theming and dark mode simple: components use the variable names, and only the values change.
>
> I also use the fallback form, var(--gap, 1rem), and I know a variable can't be used inside a media query condition."

## 🔁 Follow-up questions

### How do you read a CSS variable in JavaScript?

`getComputedStyle(document.documentElement).getPropertyValue('--brand')` gives the current value as a string.

### Why can't I use a variable in `@media (min-width: var(--bp))`?

Media query conditions are evaluated at the document level, not per element, so custom properties are not available there. Use a hard value, or a build tool.

### Are CSS variables slow?

No, not for normal use. Changing a variable on `:root` makes the browser recalculate styles for elements that use it. That is fine for themes. Avoid changing it on every mouse move on a huge page without testing.

### How do Tailwind v4 and MUI use CSS variables?

Tailwind v4 turns everything in `@theme` into CSS variables, like `--color-brand-500`. MUI can output its theme as variables with `cssVariables: true`, which helps dark mode avoid a flash.

## ✅ Quick check

### 1. What colour is the text?

```css
:root { --c: blue; }        /* page-wide value */
.box  { --c: green; }       /* override inside .box */
.box p { color: var(--c); } /* a paragraph inside .box */
```

:::answer
**Green.** The paragraph inherits `--c` from its closest ancestor that sets it, which is `.box`.
:::

### 2. `--muted` is not defined. What colour is used by `color: var(--muted, grey)`?

:::answer
**Grey.** The second value is the fallback, used when the variable is missing.
:::
