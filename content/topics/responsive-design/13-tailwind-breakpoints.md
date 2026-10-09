---
title: Responsive design with Tailwind breakpoints (sm → 2xl)
stack: responsive-design
order: 13
level: Basic
mustKnow: true
askedFrequency: very common
summary:
  - "A class with no prefix works on ALL screens. A prefix like md: works from that width AND BIGGER."
  - "Tailwind breakpoints: sm 640px, md 768px, lg 1024px, xl 1280px, 2xl 1536px."
  - "Write the phone style first, then add md: / lg: for bigger screens. That is mobile-first."
  - "md: does NOT mean \"only tablets\". It means 768px and everything above."
  - "For \"only below md\", use max-md:, e.g. max-md:hidden."
cards:
  - q: What are Tailwind's default breakpoints?
    a: "sm = 640px, md = 768px, lg = 1024px, xl = 1280px, 2xl = 1536px. Each one means \"this width and wider\"."
  - q: "What does className=\"grid-cols-1 md:grid-cols-3\" mean?"
    a: One column on all screens; from 768px and wider, three columns.
  - q: "Does md:flex mean \"flex only on tablets\"?"
    a: No. It means flex from 768px and every bigger screen. Tailwind is mobile-first.
  - q: How do you hide something on phones but show it from 768px?
    a: "className=\"hidden md:block\". hidden = display none everywhere; md:block = display block from 768px."
  - q: How do you target only one range, like tablets?
    a: "Stack a min and a max variant: md:max-lg:flex = flex only from 768px up to (not including) 1024px."
---

## 💡 What is it?

In Tailwind, every class can get a **screen-size prefix**.

- A class with **no prefix**, like `p-4`, works on **all screens**.
- A class **with a prefix**, like `md:p-6`, works from that [breakpoint](glossary:breakpoint) **and bigger**.

So you write the phone style first, then add bigger-screen changes. This is called **mobile-first**.

## 🏠 Real-life example

Think of **school rules by class**.

- "Everyone wears a white shirt" = a class with no prefix. It applies to all.
- "From Class 6 up, wear a tie" = `md:`. It applies from that level **and above**, not only Class 6.
- "From Class 9 up, wear a blazer" = `lg:`. Higher classes get the tie **and** the blazer.

Mapping:
- **Students** = screen widths.
- **Class 6** = 768px (`md`).
- **Class 9** = 1024px (`lg`).
- **"and above"** = Tailwind prefixes are always minimum widths.

## 🧑‍💻 Code example

Set up once:

```bash
npm create vite@latest tw-demo -- --template react
cd tw-demo
npm install tailwindcss @tailwindcss/vite
```

Add `tailwindcss()` to the `plugins` list in `vite.config.js`. Put `@import "tailwindcss";` at the top of `src/index.css`. Then paste this into `src/App.jsx` and run `npm run dev`.

```jsx
export default function App() { // our main component
  const people = ['Hari', 'Asha', 'Rahul', 'Meera']; // four sample candidates
  return ( // what we draw on screen
    <main className="p-4 md:p-8"> {/* p-4 = 16px padding on phones; md:p-8 = 32px from 768px */}
      <nav className="flex flex-col gap-2 md:flex-row md:justify-between"> {/* phone: links stacked; from 768px: in one row, spread out */}
        <span className="font-bold">Hiring Hub</span> {/* logo text in bold */}
        <span className="hidden md:inline">Jobs · Candidates · Reports</span> {/* hidden on phones; shown from 768px */}
      </nav> {/* end of the navbar */}
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"> {/* mt-4 = 16px top margin; 1 col → 2 cols from 640px → 4 cols from 1024px; gap-4 = 16px */}
        {people.map((name) => ( // one card per person
          <div key={name} className="rounded-xl border p-4 text-lg md:text-xl"> {/* rounded corners, thin border, 16px padding; text bigger from 768px */}
            {name} {/* the person's name */}
          </div> // end of one card
        ))} {/* end of the list */}
      </div> {/* end of the grid */}
    </main> // end of the page
  ); // end of what App returns
} // end of App
```

**What you see:**

```text
375px  → 16px padding; logo only (links hidden); 1 card per row
640px  → 2 cards per row (sm:)
768px  → 32px padding; logo left, links right in one row; bigger text (md:)
1280px → 4 cards per row (lg: started at 1024px)
```

## 🔍 Deeper version

**The default breakpoints:**

| Prefix | Starts at | Roughly |
|---|---|---|
| *(none)* | 0px | all screens, phones included |
| `sm:` | 640px (40rem) | large phones in landscape |
| `md:` | 768px (48rem) | tablets |
| `lg:` | 1024px (64rem) | laptops |
| `xl:` | 1280px (80rem) | desktops |
| `2xl:` | 1536px (96rem) | big monitors |

Each prefix is a `min-width` [media query](topic:responsive-design/media-queries) underneath. `md:flex` compiles to roughly `@media (width >= 48rem) { .md\:flex { display: flex } }`.

**`max-*` variants.** For "below a size", use `max-md:` (narrower than 768px). Stack two variants for a range: `md:max-lg:hidden` hides only between 768px and 1023px.

**Custom breakpoints in Tailwind v4.** There's no `tailwind.config.js` needed. Change them in CSS:

```css
@import "tailwindcss"; /* load Tailwind */
@theme { /* our design values */
  --breakpoint-xs: 30rem; /* adds a new xs: prefix at 480px */
  --breakpoint-2xl: 100rem; /* moves 2xl: to 1600px */
} /* end of @theme */
```

**Arbitrary one-off breakpoints:** `min-[900px]:grid-cols-3` works without changing the theme.

**Container queries are separate.** `@md:` (with the `@`) checks the parent's width, not the screen. See [container queries](topic:responsive-design/container-queries).

:::version[Version note]
In **Tailwind v3**, breakpoints lived in `tailwind.config.js` under `theme.screens`. In **v4**, they are CSS variables in `@theme` (`--breakpoint-md`, and so on). The default numbers did not change.
:::

## 🎯 Why do we use it?

- **Fast.** You change layouts right in the markup. No separate CSS file and no media query by hand.
- **Readable.** `grid-cols-1 md:grid-cols-3` tells you the whole story in one line.
- **Consistent.** The whole team uses the same five breakpoints, so pages change layout at the same widths.

## ⚠️ Common mistakes

- **Thinking `md:` means "only tablets".** It means tablets **and everything bigger**.
- **Writing the desktop style first** and trying to undo it on phones. Write the phone style with no prefix, then add prefixes.
- **Using `sm:` for phones.** Plain classes are for phones. `sm:` starts at 640px.
- **Mixing up `md:` (768px screen) and MUI's `md` (900px).** See [matching breakpoints](topic:responsive-design/matching-breakpoints).

## 🗣️ How to answer in an interview

> "Tailwind is mobile-first. A class with no prefix applies to every screen, and a prefix like `md:` applies from that breakpoint and up. The defaults are sm 640, md 768, lg 1024, xl 1280 and 2xl 1536. So I write the phone layout first, for example `grid-cols-1`, then add `sm:grid-cols-2 lg:grid-cols-4` for bigger screens. A common mistake is thinking `md:` means 'only tablets', but it's 768 and wider. For 'below' I use `max-md:`, and I can stack `md:max-lg:` for a range. In Tailwind v4, breakpoints are CSS variables in `@theme`, so customising them is just CSS."

[FILL IN: if you built a responsive screen with Tailwind early in your career, name it here.]

## 🔁 Follow-up questions

### How do you hide an element only on phones?

`hidden md:block`. It's hidden by default (phones), and shown from 768px.

### How do you show something only on phones?

`md:hidden`. It shows by default and disappears from 768px.

### How are Tailwind breakpoints implemented?

Each prefix becomes a `min-width` media query in the generated CSS, in rem units (md = 48rem = 768px).

### How do you add a custom breakpoint?

In v4, add `--breakpoint-name: <size>;` inside `@theme`. Or use an arbitrary variant like `min-[900px]:`.

## ✅ Quick check

### 1. The screen is 900px wide. How many columns does `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4` show?

:::answer
**2.** 900px is above `sm` (640) but below `lg` (1024).
:::

### 2. What does `hidden md:flex` do on a 1440px laptop?

:::answer
**`display: flex`.** `md:` applies from 768px and every bigger width, so it overrides `hidden`.
:::

### 3. Which class pads 16px on phones and 24px from 768px?

- A) `md:p-4 p-6`
- B) `p-4 md:p-6`
- C) `p-6 sm:p-4`

:::answer
**B.** `p-4` = 16px everywhere; `md:p-6` = 24px from 768px. (1 Tailwind unit = 4px.)
:::
