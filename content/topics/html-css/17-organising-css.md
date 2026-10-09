---
title: "Organising CSS: BEM, CSS Modules, CSS-in-JS"
stack: html-css
order: 17
level: Intermediate
mustKnow: false
askedFrequency: common
summary:
  - In a big app, global CSS class names clash. We need a way to keep styles organised and local.
  - "BEM is a naming rule: block__element--modifier, like card__title--large."
  - CSS Modules rename classes at build time so they are unique to one file (scoped automatically).
  - "CSS-in-JS (styled-components, Emotion, MUI's sx) writes styles in JavaScript next to the component."
  - "Modern CSS adds native nesting and @layer, so you control which group of styles wins."
cards:
  - q: What does BEM stand for?
    a: "Block, Element, Modifier. Example: .card (block), .card__title (element), .card--featured (modifier)."
  - q: How do CSS Modules avoid name clashes?
    a: At build time each class name gets a unique suffix (like title_x8f2), so the same name in two files never collides.
  - q: One downside of runtime CSS-in-JS?
    a: Styles are created in the browser while the app runs, which costs JavaScript time, and it needs extra setup with React Server Components.
  - q: What does @layer do?
    a: It groups CSS into named layers with a fixed order. A later layer wins over an earlier one, no matter how specific the selectors are.
  - q: Is CSS nesting native now?
    a: Yes. Modern browsers support writing .card { & .title { … } } without Sass.
---

## 💡 What is it?

On a small page, one CSS file is fine. In a big app with hundreds of components, problems start:
- Two people both write `.title`, and one breaks the other.
- Nobody dares to delete old CSS.
- Selectors get longer and longer to "win".

So teams use a **system** to keep CSS organised. The common ones are **BEM** (a naming rule), **CSS Modules** (automatic local class names), and **CSS-in-JS** (styles written in JavaScript). Utility CSS like Tailwind is another option.

## 🏠 Real-life example

Think of **lunch boxes in a big school**.

Every student has a "blue lunch box". At lunch, people take the wrong one.

- **BEM** = everyone writes their full name and class on the box: "Rahul — 10B — blue lunch box". It's a naming rule that everyone must follow.
- **CSS Modules** = the school office sticks a unique barcode on every box. You still call it "blue lunch box", but the barcode keeps it separate.
- **CSS-in-JS** = each student's lunch is packed inside their own school bag. It never sits on the shared table.
- **`@layer`** = the rule "teachers' boxes go on the top shelf, students' boxes on the lower shelf". The shelf decides the order, not the size of the box.

## 🧑‍💻 Code example

Save this as `index.html` and open it in your browser. It shows BEM naming, native nesting and `@layer` in plain CSS.

```html
<!DOCTYPE html>                                         <!-- modern HTML page -->
<html lang="en">                                        <!-- page language = English -->
<head>                                                  <!-- page settings -->
  <style>                                               /* CSS starts here */
    @layer base, components, overrides;                 /* declare the layer order: later layers win */
    @layer base {                                       /* layer 1: basic page styles */
      p { color: #334155; }                             /* paragraphs are dark grey */
    }                                                   /* end of base */
    @layer components {                                 /* layer 2: component styles */
      .card {                                           /* BEM "block": the card */
        border: 1px solid #cbd5e1;                      /* thin grey border */
        padding: 12px;                                  /* 12px inside space */
        margin-bottom: 12px;                            /* 12px space below */
        & .card__title { font-weight: bold; }           /* native nesting; BEM "element": the card's title */
        &.card--featured { border-color: gold; }        /* BEM "modifier": a featured card has a gold border */
      }                                                 /* end of .card */
      #main p { color: crimson; }                       /* an ID selector: very specific, but in a lower layer */
    }                                                   /* end of components */
    @layer overrides {                                  /* layer 3: small fixes that must win */
      .text-muted { color: grey; }                      /* a simple class, but its layer is last, so it wins */
    }                                                   /* end of overrides */
  </style>                                              <!-- CSS ends here -->
</head>                                                 <!-- end of head -->
<body>                                                  <!-- visible content -->
  <div id="main">                                       <!-- main area -->
    <div class="card">                                  <!-- a normal card (block) -->
      <p class="card__title">Normal card</p>            <!-- element of the block -->
    </div>                                              <!-- end card -->
    <div class="card card--featured">                   <!-- a featured card (block + modifier) -->
      <p class="card__title text-muted">Featured card</p> <!-- muted text -->
    </div>                                              <!-- end card -->
  </div>                                                <!-- end main -->
</body>                                                 <!-- end of body -->
</html>                                                 <!-- end of page -->
```

**What you see:**

```text
Two cards. The second card has a gold border (the modifier).
"Normal card" is red: #main p (components layer) beats p (base layer).
"Featured card" is GREY, not red: .text-muted is a weaker selector than #main p,
but it lives in the "overrides" layer, which comes later, so it wins.
```

## 🔍 Deeper version

**1. BEM — Block, Element, Modifier.**
- Block: `.candidate-card` — a standalone component.
- Element: `.candidate-card__avatar` — a part of the block (two underscores).
- Modifier: `.candidate-card--shortlisted` — a variation (two dashes).

Rules: keep selectors flat (one class each), and never style by tag inside a block. It's pure convention, so it needs team discipline.

**2. CSS Modules.** The file `Card.module.css` contains `.title { … }`. In React: `import styles from './Card.module.css'` and `<h2 className={styles.title}>`. The build tool (Vite, webpack) renames it to something like `_title_x8f2`, so it's **local by default**. Vite supports this with no setup.

**3. CSS-in-JS.**
- **Runtime** libraries (styled-components, Emotion — which MUI uses) build styles in the browser. You get dynamic styles from props, and styles live next to the component. The cost is JavaScript work at runtime, and extra setup with React Server Components.
- **Zero-runtime** libraries (vanilla-extract, Linaria, Panda CSS, MUI's Pigment CSS) extract real CSS files at build time.

**4. Utility-first (Tailwind).** There are no class names to invent. You compose small classes like `p-4 font-bold`. See [component library vs utility CSS](topic:mui-tailwind/component-library-vs-utility).

**Comparison:**

| | Scoping | Runtime cost | Dynamic styles | Learning curve |
|---|---|---|---|---|
| BEM | by convention | none | via classes | low |
| CSS Modules | automatic | none | via classes / variables | low |
| Runtime CSS-in-JS | automatic | some | very easy (props) | medium |
| Tailwind | no names needed | none | via classes / variables | medium |

**5. Native CSS features that help:**
- **Nesting:** `.card { & .title { } &:hover { } }` works in browsers without Sass.
- **`@layer`:** declares an order of layers. Specificity only matters **inside** one layer, and unlayered styles beat all layers. Tailwind v4 uses layers (`theme`, `base`, `components`, `utilities`). It's also how you make MUI and Tailwind work together. See [MUI and Tailwind together](topic:mui-tailwind/mui-and-tailwind-together).
- **`@scope`:** limits styles to a part of the page. It's newer, so check support.
- **Custom properties** for design tokens. See [CSS variables](topic:html-css/css-variables).

:::version[Version note]
Native CSS nesting and `@layer` work in all major browsers since 2023. `@scope` reached all major browsers more recently, so check caniuse.com before relying on it.
:::

## 🎯 Why do we use it?

- **No clashes.** One team's `.title` can't break another page.
- **Safe deletion.** With local styles, deleting a component deletes its CSS too.
- **Predictable overrides.** Layers and flat selectors end the "specificity war".
- **Faster onboarding.** New developers know where styles live and how to name them.

## ⚠️ Common mistakes

- **Mixing systems randomly** in one codebase (BEM here, inline styles there, global CSS everywhere).
- **Deep selectors** like `.page .sidebar ul li a span`. They're hard to override and break when the HTML changes.
- **`!important` everywhere** to win fights. It's a sign that structure, or layers, are missing.
- **Heavy runtime CSS-in-JS** in very large lists, which costs performance.

## 🗣️ How to answer in an interview

> "The core problem is that CSS is global, so in a large app class names clash and overrides become a specificity war. There are a few ways to organise it.
>
> BEM is a naming convention, block__element--modifier, which keeps selectors flat and readable, but it relies on discipline. CSS Modules make class names local automatically at build time, so I can write .title in every component without clashes. CSS-in-JS like styled-components or Emotion puts styles next to the component and makes prop-based styling easy, at some runtime cost. Utility frameworks like Tailwind avoid naming altogether.
>
> Modern CSS also helps: native nesting, and @layer to fix the order of style groups, so a later layer wins regardless of specificity. That's very useful when combining a component library with Tailwind. The most important thing is that a team picks one approach and sticks to it."

[FILL IN: which approach your SkillKeepr frontend uses — e.g. the component library's sx / styled API, plain CSS, or utility classes.]

## 🔁 Follow-up questions

### CSS Modules or Tailwind for a new React app?

Both scope well and have no runtime cost. Tailwind is faster for building UIs and keeps spacing consistent. CSS Modules feel like normal CSS and suit custom, complex designs. Many teams pick Tailwind plus a small component library.

### Why is runtime CSS-in-JS harder with React Server Components?

Server Components don't run in the browser and can't use React context or hooks, which runtime CSS-in-JS often relies on. Zero-runtime tools avoid this.

### What happens to unlayered CSS when you use `@layer`?

Styles that aren't in any layer beat all layered styles (for normal declarations). So a stray global stylesheet can override your carefully layered system.

### What is the "specificity war"?

Developers keep making selectors more specific (adding IDs, nesting, `!important`) to override each other. Flat class names, scoping and `@layer` prevent it.

## ✅ Quick check

### 1. Which is a correct BEM class for the "large" version of a card's button?

- A) `.card .button.large`
- B) `.card__button--large`
- C) `.card-button-large`

:::answer
**B.** Block `card`, element `button` (two underscores), modifier `large` (two dashes).
:::

### 2. Layer order is `@layer base, components, overrides;`. A `.x` rule in `overrides` and a `#main .x` rule in `components` both set `color`. Which wins?

:::answer
**The `.x` rule in `overrides`.** Layer order is checked before specificity, and `overrides` comes later.
:::
