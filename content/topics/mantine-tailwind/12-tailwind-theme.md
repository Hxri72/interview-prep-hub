---
title: "Customising Tailwind with @theme"
stack: mantine-tailwind
order: 12
level: Intermediate
mustKnow: false
askedFrequency: common
summary:
  - "In Tailwind v4, you customise the design in your CSS file with @theme, not in tailwind.config.js."
  - "Each variable in @theme makes new classes: --color-brand-500 gives bg-brand-500, text-brand-500 and more."
  - "Namespaces decide the class type: --color-*, --font-*, --spacing, --breakpoint-*, --radius-*."
  - "@theme variables are also normal CSS variables, so you can use var(--color-brand-500) anywhere."
  - "Use --color-*: initial; to remove all default colours and keep only your own."
cards:
  - q: Where do you customise Tailwind v4?
    a: "In your main CSS file, inside an @theme { } block. tailwind.config.js is optional in v4."
  - q: What classes does --color-brand-500 create?
    a: "Every colour utility with that name: bg-brand-500, text-brand-500, border-brand-500, ring-brand-500, and so on."
  - q: How do you change the md breakpoint to match Mantine's md (62em = 992px)?
    a: "Add --breakpoint-md: 62em; inside @theme. Then md: means 62em (992px) and up."
  - q: What is the difference between @theme and :root?
    a: "Both create CSS variables, but only @theme variables also create Tailwind classes."
  - q: How do you remove Tailwind's default colours?
    a: "Inside @theme, write --color-*: initial; then add only the colours you want."
---

## 💡 What is it?

Tailwind comes with a default design: colours, spacing, fonts and screen sizes. Real projects need **their own brand colours and fonts**.

In **Tailwind v4**, you change the design inside your CSS file with an **`@theme`** block. Each variable you add there creates **new classes** you can use right away.

## 🏠 Real-life example

Think of a **school uniform shop**.

The shop has standard colours: white, blue, grey. Your school wants **its own maroon** and **its own logo font**. So the shop adds them to its catalogue. From then on, anyone can order "maroon, size M" like any other colour.

- **The standard catalogue** = Tailwind's default theme.
- **Adding maroon to the catalogue** = adding `--color-maroon-600` in `@theme`.
- **Ordering "maroon, size M"** = writing `bg-maroon-600` in your JSX.
- **Removing colours the school never uses** = `--color-*: initial;`.

## 🧑‍💻 Code example

A Vite React app with Tailwind v4 (`npm install tailwindcss @tailwindcss/vite`). Put this in `src/index.css`.

```css
@import "tailwindcss";                                   /* load Tailwind and its default theme */

@theme {                                                 /* everything inside here becomes design tokens + classes */
  --color-brand-50: #eef4ff;                             /* lightest brand blue → bg-brand-50, text-brand-50 … */
  --color-brand-600: #2554d9;                            /* main brand blue → bg-brand-600 */
  --color-brand-700: #1d43b0;                            /* darker brand blue, for hover → hover:bg-brand-700 */
  --font-display: "Poppins", sans-serif;                 /* new font → class font-display */
  --radius-card: 1rem;                                   /* new corner size (16px) → class rounded-card */
  --breakpoint-3xl: 1920px;                              /* new screen size → prefix 3xl: (1920px and up) */
}                                                        /* end of @theme */
```

Then use the new classes in `src/App.jsx`:

```jsx
export default function App() {                                          // the main component
  return (                                                               // what the page shows
    <div className="p-6">                                                {/* p-6 = 24px padding */}
      <div className="rounded-card bg-brand-50 p-4 3xl:p-12">            {/* rounded-card = 16px corners; bg-brand-50 = light brand blue; 3xl:p-12 = 48px padding on 1920px+ screens */}
        <h1 className="font-display text-2xl text-brand-600">SkillKeepr</h1> {/* font-display = Poppins; text-2xl = 24px; text-brand-600 = main brand blue */}
        <button className="mt-4 rounded-lg bg-brand-600 px-4 py-2 text-white hover:bg-brand-700"> {/* brand button; darker brand blue on hover */}
          Post a job                                                     {/* the button label */}
        </button>                                                        {/* end of the button */}
      </div>                                                             {/* end of the card */}
    </div>                                                               // end of the page
  );                                                                     // end of what App returns
}                                                                        // end of App
```

**What you see:**

```text
A light-blue card with 16px round corners.
"SkillKeepr" in Poppins (if the font is loaded), in the brand blue.
A brand-blue button that gets darker on hover.
On a very wide 1920px+ screen, the card gets much more padding (48px).
```

## 🔍 Deeper version

**Namespaces.** The start of each variable name decides which classes it makes:

| Variable namespace | Makes classes like | Example |
|---|---|---|
| `--color-*` | `bg-*`, `text-*`, `border-*`, `fill-*` | `--color-brand-600` → `bg-brand-600` |
| `--font-*` | `font-*` | `--font-display` → `font-display` |
| `--text-*` | `text-*` (font size) | `--text-tiny: 0.625rem` → `text-tiny` (10px) |
| `--spacing` | all spacing (`p-*`, `m-*`, `w-*`, `gap-*`) | `--spacing: 0.25rem` = 4px per step |
| `--radius-*` | `rounded-*` | `--radius-card` → `rounded-card` |
| `--breakpoint-*` | responsive prefixes | `--breakpoint-md: 62em` → `md:` starts at 62em (992px) |
| `--shadow-*` | `shadow-*` | `--shadow-soft` → `shadow-soft` |

**Override vs extend.**
- Adding a new name **extends** the theme. The defaults stay.
- Using an existing name **overrides** it. `--breakpoint-md: 62em;` changes what `md:` means.
- `--color-*: initial;` **removes** all default colours. Then only your colours exist. This stops people using random off-brand colours.

**They are real CSS variables.** Tailwind also writes the theme values as variables on `:root`. So you can use `var(--color-brand-600)` in plain CSS, inline styles, or a chart library. (If a variable seems missing because no class uses it, `@theme static { … }` tells Tailwind to always output it.) This is how you share brand colours with non-Tailwind code, like Mantine's theme.

**`@theme` vs `:root`.** A variable in `:root` is only a CSS variable. A variable in `@theme` is a CSS variable **and** a Tailwind class generator. Use `@theme` for design tokens. Use `:root` for values that shouldn't become classes.

**The JS config still works.** Big projects moving from v3 can keep `tailwind.config.js` and load it with `@config "./tailwind.config.js";`. New projects usually don't need it.

:::version[Version note]
**Tailwind v3** customised everything in `tailwind.config.js` under `theme.extend`. **Tailwind v4** (released January 2025) moved this into CSS with `@theme`. It also finds your source files automatically, so you no longer list `content` paths.
:::

## 🎯 Why do we use it?

- **One place for brand decisions.** Change `--color-brand-600` once, and every button and link updates.
- **Design tokens.** Designers and developers share the same names: "brand-600", "radius-card".
- **No magic numbers.** People write `bg-brand-600`, not `bg-[#2554d9]` copied around the codebase.
- **Sharing with other tools.** The same values exist as CSS variables for Mantine, charts or plain CSS.

## ⚠️ Common mistakes

- **Putting tokens in `:root`** and expecting classes. Only `@theme` creates classes.
- **Using the wrong namespace**, like `--brand-600` instead of `--color-brand-600`. No `bg-` class appears.
- **Following v3 tutorials** and editing `tailwind.config.js` in a v4 project. It is ignored unless you add `@config`.
- **Overriding `--spacing` by accident.** It changes every padding, margin and width in the app.

## 🗣️ How to answer in an interview

> "In Tailwind v4, theming moved from the JavaScript config into CSS. I add an @theme block in the main CSS file. Each variable there is a design token and also creates utilities. For example, --color-brand-600 gives me bg-brand-600, text-brand-600 and so on. The namespace decides the class type: color, font, radius, breakpoint, and so on.
>
> A new name extends the theme, and an existing name overrides it, so --breakpoint-md: 62em changes what md: means. If I want to lock the team to brand colours only, I reset all colours with --color-*: initial.
>
> Because the tokens are also plain CSS variables, I can share them with other libraries, like a Mantine theme or a chart."

## 🔁 Follow-up questions

### How would you make Tailwind and Mantine use the same brand colour?

Define the colour once as an `@theme` variable. In Mantine's `createTheme`, add the same colour as a 10-shade array in `colors` and set it as `primaryColor`. Mantine also exposes its own CSS variables, like `var(--mantine-color-blue-6)`. See [Using Mantine and Tailwind together](topic:mantine-tailwind/mantine-and-tailwind-together).

### How do you add a custom font?

Load the font (for example with a Google Fonts `<link>` or `@font-face`). Then add `--font-display: "Poppins", sans-serif;` in `@theme`. Use it with `font-display`.

### Can you have more than one theme, like light and dark brand colours?

Yes. Point the `@theme` variables at other CSS variables, then change those inside `.dark` or a `[data-theme]` selector. Tailwind has `@theme inline` for this pattern, so the class uses the variable's live value.

### What happens to `tailwind.config.js` when you upgrade to v4?

Tailwind provides an upgrade tool (`npx @tailwindcss/upgrade`) that moves most config into `@theme`. You can also keep the old file for a while with `@config`.

## ✅ Quick check

### 1. You add `--color-accent-500: #f59e0b;` inside `@theme`. Name two classes you can now use.

:::answer
For example **`bg-accent-500`** and **`text-accent-500`**. Also `border-accent-500`, `ring-accent-500` and others.
:::

### 2. You put `--color-accent-500: #f59e0b;` inside `:root` instead. Does `bg-accent-500` work?

:::answer
**No.** `:root` only creates a CSS variable. Only `@theme` makes Tailwind create classes.
:::

### 3. After adding `--breakpoint-md: 62em;`, when does `md:flex-row` start to apply?

:::answer
**At 62em (992px) wide and up**, instead of the default 768px. (With the default 16px font size, 1em = 16px.)
:::
