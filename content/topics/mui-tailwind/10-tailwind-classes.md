---
title: Tailwind spacing, colours and typography classes
stack: mui-tailwind
order: 10
level: Basic
mustKnow: true
askedFrequency: very common
summary:
  - "Tailwind gives you tiny ready-made classes. Each class does one job, like p-4 or text-lg."
  - "Spacing uses a scale of 4px steps: p-1 = 4px, p-4 = 16px, p-6 = 24px."
  - "Colours are name + shade: bg-blue-500. 50 is very light, 950 is very dark."
  - "Typography classes set size (text-sm, text-lg), weight (font-bold) and line height (leading-6)."
  - "For a one-off value, use square brackets: w-[350px]. Use the scale whenever you can."
cards:
  - q: What does p-4 mean in Tailwind?
    a: "Padding of 4 steps on all sides. One step is 4px (0.25rem), so p-4 = 16px."
  - q: What is the difference between px-4 and py-4?
    a: "px-4 = padding left and right (16px each). py-4 = padding top and bottom (16px each)."
  - q: What does the number in bg-blue-500 mean?
    a: "The shade. 50 is very light, 500 is the middle, 950 is very dark."
  - q: How do you write a value that is not on the scale?
    a: "Use an arbitrary value in square brackets, like w-[350px] or text-[13px]."
  - q: What does mx-auto do?
    a: "Margin left and right = auto. On a block with a width, this centres it horizontally."
---

## 💡 What is it?

**Tailwind CSS** is a styling tool. It gives you thousands of **tiny classes**. Each class does **one small job**.

`p-4` adds padding. `text-lg` makes text bigger. `bg-blue-500` paints the background blue.

You style an element by putting these classes in its `className`. You rarely write your own CSS file.

## 🏠 Real-life example

Think of a **box of Lego bricks**.

Each brick has a fixed size. You don't cut bricks to any size you like. You pick from the sizes in the box. That keeps everything neat and lined up.

- **Each Lego brick** = one Tailwind class, like `p-4`.
- **Fixed brick sizes** = the spacing scale (4px, 8px, 16px…).
- **The colour chart on the box** = Tailwind's colour palette (`blue-50` to `blue-950`).
- **Building a house from bricks** = building a card from many small classes.
- **A special custom-cut piece** = an arbitrary value like `w-[350px]`. You can make one, but you rarely need it.

## 🧑‍💻 Code example

Make a Vite React app with Tailwind v4 (`npm create vite@latest`, pick React, then `npm install tailwindcss @tailwindcss/vite`). Add `@import "tailwindcss";` to `src/index.css`. Paste this into `src/App.jsx` and run `npm run dev`.

```jsx
export default function App() {                                     // the main component of the page
  return (                                                          // what the page shows
    <div className="min-h-screen bg-slate-100 p-6">                 {/* min-h-screen = at least full screen height; bg-slate-100 = very light grey; p-6 = 24px padding */}
      <div className="mx-auto max-w-sm rounded-xl bg-white p-4 shadow"> {/* mx-auto = centre it; max-w-sm = at most 384px wide; rounded-xl = 12px round corners; p-4 = 16px padding; shadow = small shadow */}
        <h2 className="text-lg font-bold text-slate-900">Hari K H</h2> {/* text-lg = 18px text; font-bold = weight 700; text-slate-900 = almost black */}
        <p className="mt-1 text-sm text-slate-600">Full stack developer</p> {/* mt-1 = 4px margin on top; text-sm = 14px; text-slate-600 = medium grey */}
        <span className="mt-3 inline-block rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-800"> {/* mt-3 = 12px top margin; px-3 = 12px left and right; py-1 = 4px top and bottom; text-xs = 12px */}
          Node.js                                                   {/* the badge text */}
        </span>                                                     {/* end of the badge */}
        <button className="mt-4 w-full rounded-lg bg-blue-600 py-2 font-medium text-white"> {/* w-full = 100% width; bg-blue-600 = strong blue; py-2 = 8px top and bottom; text-white = white text */}
          View profile                                              {/* the button label */}
        </button>                                                   {/* end of the button */}
      </div>                                                        {/* end of the card */}
    </div>                                                          // end of the page wrapper
  );                                                                // end of what App returns
}                                                                   // end of App
```

**What you see:**

```text
A light grey page. In the middle, a white card 384px wide with round corners.
Inside: "Hari K H" in bold, "Full stack developer" in small grey text,
a light-blue pill that says "Node.js", and a full-width blue "View profile" button.
```

## 🔍 Deeper version

**The spacing scale.** In Tailwind v4, one spacing step is `--spacing: 0.25rem`. That is **4px** when the root font size is 16px. So the number is "how many steps":

| Class | Means | Size |
|---|---|---|
| `p-1` | padding, 1 step | 4px |
| `p-2` | padding, 2 steps | 8px |
| `p-4` | padding, 4 steps | 16px |
| `p-6` | padding, 6 steps | 24px |
| `p-8` | padding, 8 steps | 32px |

**Which side?** The letter after `p` or `m` picks the side:
- `p` = all sides, `px` = left + right, `py` = top + bottom.
- `pt` / `pr` / `pb` / `pl` = top / right / bottom / left.
- `m` works the same way for margin. `-mt-2` is a **negative** margin of 8px.
- `gap-4` = 16px space between flex or grid children. `space-y-2` = 8px between stacked children.

**Colours.** Each colour has 11 shades: `50, 100, 200 … 900, 950`. 50 is almost white. 950 is almost black. The same shade number works with many prefixes: `bg-` (background), `text-` (text colour), `border-` (border colour), `ring-` (focus ring).

Opacity uses a slash: `bg-blue-600/50` = the same blue at **50% opacity**.

**Typography.**

| Class | Font size | Notes |
|---|---|---|
| `text-xs` | 12px | small labels |
| `text-sm` | 14px | secondary text |
| `text-base` | 16px | normal body text |
| `text-lg` | 18px | slightly bigger |
| `text-2xl` | 24px | headings |

Weight: `font-normal` (400), `font-medium` (500), `font-semibold` (600), `font-bold` (700). Line height: `leading-6` = 24px, `leading-tight` = 1.25. Each `text-*` size also comes with a sensible default line height.

**Arbitrary values.** If the design needs an exact value, use brackets: `w-[350px]`, `text-[13px]`, `bg-[#1f5f99]`. Use these rarely. Too many arbitrary values break the "one shared scale" idea.

:::version[Version note]
In **Tailwind v4**, the default colours are written in the `oklch()` colour format, and spacing comes from one `--spacing` variable. Tailwind v3 had a fixed list of spacing values in `tailwind.config.js`. The class names you type are mostly the same.
:::

## 🎯 Why do we use it?

- **Speed.** You style while writing JSX. You don't jump to a CSS file and invent class names.
- **Consistency.** Everyone picks from the same scale. You don't get 13px here and 15px there.
- **No dead CSS.** Tailwind only creates CSS for classes you actually use. Old, unused styles don't pile up.
- **Safe changes.** Styles live on the element. Deleting a component deletes its styles too.

## ⚠️ Common mistakes

- **Thinking `p-4` means 4px.** It means 4 **steps**, which is 16px.
- **Building class names with string joining**, like `` `bg-${color}-500` ``. Tailwind scans your files for full class names, so it never sees `bg-red-500`. Write the full class name, or use a lookup object.
- **Using arbitrary values everywhere**, like `p-[13px]`. It breaks the shared scale.
- **Mixing `text-` for size and colour by mistake.** `text-lg` is size, `text-slate-600` is colour. Both start with `text-`.

## 🗣️ How to answer in an interview

> "Tailwind is a utility-first CSS framework. Instead of writing my own classes, I put small ready-made classes on the element. Each one does one job.
>
> Spacing uses a scale where one step is 4px, so p-4 is 16px padding, and px-4 is just left and right. Colours are a name plus a shade from 50 to 950, like bg-blue-500. Typography classes set size, weight and line height, like text-lg and font-bold.
>
> I stick to the scale for consistency, and only use arbitrary values like w-[350px] when the design really needs an exact size. One gotcha: never build class names with string templates, because Tailwind only generates classes it can see written in full."

[FILL IN: a project where you used Tailwind — your notes say it was early in your career.]

## 🔁 Follow-up questions

### Why can't I write `bg-${color}-500`?

Tailwind reads your source files as plain text and looks for complete class names. It doesn't run your code. A string built at runtime is invisible to it, so the CSS for it is never created. Use a map instead: `const colors = { error: 'bg-red-500', ok: 'bg-green-500' }`.

### How is `rem` related to the spacing scale?

One step is `0.25rem`. `rem` follows the page's root font size, usually 16px. If a user makes their browser text bigger, all spacing grows with it. That's good for accessibility.

### What is the difference between `space-y-4` and `gap-4`?

`gap-4` works on flex and grid parents and adds 16px between children. `space-y-4` adds a 16px top margin to every child except the first. Prefer `gap` in flex and grid layouts.

### How do you set a custom brand colour?

Add it in CSS with `@theme`, like `--color-brand-500: #1f5f99;`. Then `bg-brand-500` and `text-brand-500` work. See [Customising Tailwind with @theme](topic:mui-tailwind/tailwind-theme).

## ✅ Quick check

### 1. How much padding does `px-6` add, and where?

:::answer
**24px on the left and 24px on the right.** One step is 4px, and `x` means left + right.
:::

### 2. Which is the darkest?

- A) `bg-blue-100`
- B) `bg-blue-500`
- C) `bg-blue-900`

:::answer
**C.** Higher numbers are darker. 50 is the lightest and 950 is the darkest.
:::

### 3. Will this button turn red?

```jsx
const tone = 'red';                                   // the colour name
<button className={`bg-${tone}-500`}>Delete</button>  // class built with a template string
```

:::answer
**Probably not.** Tailwind never sees the full text `bg-red-500` in your files, so it doesn't create that CSS. Write the full class name instead.
:::
