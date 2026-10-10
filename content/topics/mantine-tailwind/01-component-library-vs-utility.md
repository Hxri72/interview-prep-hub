---
title: Component library vs utility-first CSS
stack: mantine-tailwind
order: 1
level: Basic
mustKnow: false
askedFrequency: common
summary:
  - A component library (like Mantine or Ant Design) gives you ready-made pieces such as Button, Modal and Table.
  - Utility-first CSS (like Tailwind) gives you tiny classes such as p-4 and flex, and you build the look yourself.
  - Component libraries are fast for complex widgets. Utility CSS gives full control over the design.
  - "Many teams mix them — Mantine for complex widgets, Tailwind for layout — but then they must keep spacing, colours and breakpoints matching."
cards:
  - q: What is a component library?
    a: A set of ready-made, styled React components, like Button, TextInput and Modal. Mantine and Ant Design are examples.
  - q: What is utility-first CSS?
    a: A style where you use many tiny classes, each doing one job, like p-4 (padding 16px) or text-lg. Tailwind is the best-known example.
  - q: When would you pick a component library?
    a: When you need complex widgets fast — date pickers, autocompletes, modals — with keyboard and screen-reader support already built in.
  - q: When would you pick Tailwind?
    a: When the design is custom and you want full control, small CSS output and no fight with a library's default look.
  - q: What is the main risk of using both in one app?
    a: Two different spacing, colour and breakpoint systems. If you don't make them match, the app looks inconsistent.
---

## 💡 What is it?

There are two popular ways to style a React app.

A **component library** gives you finished pieces. You write `<Button>` and get a styled button. **Mantine** and **Ant Design** work like this.

**Utility-first CSS** gives you tiny classes. Each class does one small job. You combine them to build the look yourself. **Tailwind CSS** works like this.

## 🏠 Real-life example

Think about getting a **school uniform**.

- **Option 1: buy a ready-made uniform** from the school shop. It fits most students. It looks the same for everyone. You can only change small things.
- **Option 2: buy cloth, buttons and thread**, and stitch your own. It takes more work. But you choose every detail.

The mapping:

- **Ready-made uniform** = a component library (Mantine, Ant Design).
- **Cloth, buttons, thread** = utility classes (Tailwind).
- **Small changes to the ready-made one** = the theme and style props.
- **Stitching yourself** = combining `flex`, `p-4`, `rounded-xl` and so on.

## 🧑‍💻 Code example

The same "Save" button, built both ways. Make a React app with `npm create vite@latest` (pick React). For the Mantine part run `npm install @mantine/core @mantine/hooks` (see [Mantine setup](topic:mantine-tailwind/mantine-setup)). For the Tailwind part, set up Tailwind first (see [Tailwind setup](topic:mantine-tailwind/tailwind-setup)). Paste into `src/App.jsx`.

```jsx
import '@mantine/core/styles.css';                           // Mantine's CSS file (needed once, at the top of the app)
import { MantineProvider, Button } from '@mantine/core';      // the provider and the ready-made Button

export default function App() {                              // our main component
  return (                                                   // what the screen shows
    <MantineProvider>                                        {/* gives every Mantine component its theme */}
      <div style={{ display: 'flex', gap: 16, padding: 24 }}> {/* a row with 16px gaps and 24px padding */}
        <Button>Save</Button>                                {/* Mantine: no classes, the look comes from the library */}
        <button className="rounded-md bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700"> {/* Tailwind: we build the look from small classes */}
          Save                                               {/* the button's text */}
        </button>                                            {/* end of the Tailwind button */}
      </div>                                                 {/* end of the row */}
    </MantineProvider>                                       // end of the provider
  );                                                         // end of what App returns
}                                                            // end of App
```

What each Tailwind class means:

- `rounded-md` = slightly rounded corners (6px).
- `bg-blue-600` = blue background. The number is the shade: 50 is very light, 950 is very dark.
- `px-4` = padding left and right of 4 units. In Tailwind 1 unit = 4px, so this is 16px.
- `py-2` = padding top and bottom of 2 units = 8px.
- `font-medium` = slightly bold text (weight 500).
- `text-white` = white text.
- `hover:bg-blue-700` = a darker blue when the mouse is over it.

```text
You see two blue "Save" buttons side by side.
The Mantine one uses the theme's blue, rounded corners and a hover shade — all from the library.
The Tailwind one looks exactly like the classes say — nothing more.
```

## 🔍 Deeper version

**How each one works:**

| | Component library (Mantine) | Utility-first (Tailwind) |
|---|---|---|
| What you get | Ready React components with behaviour | CSS classes only, no behaviour |
| Styling engine | A plain CSS file plus CSS variables (since Mantine 7) | Plain CSS made at build time |
| Accessibility | Built in for complex widgets (focus, keyboard, ARIA) | You add it yourself |
| Design | Mantine's neutral look, changed with the theme | Looks like whatever you build |
| Spacing scale | Named sizes: `xs` 10px, `sm` 12px, `md` 16px, `lg` 20px, `xl` 32px | Numbers: 1 unit = 4px (`p-4` = 16px) |
| Learning | Learn the component APIs (props) | Learn the class names |

:::version[Version note]
Mantine 6 and older styled components with Emotion (CSS-in-JS, made while the app runs). **Since Mantine 7**, it ships a normal CSS file and uses CSS variables. The old `sx` prop and `createStyles` moved to an optional package, `@mantine/emotion`. Mantine 9 is the current version in October 2026.
:::

**Behaviour matters more than looks.** A date picker, autocomplete or modal needs keyboard handling, focus trapping and screen-reader labels. Building those yourself takes a long time and is easy to get wrong. That is the strongest reason to use a component library.

**Headless libraries are the middle path.** Libraries like Radix UI or Headless UI give the *behaviour* without any styles. You add the look with Tailwind. Many modern teams (for example with shadcn/ui) do this.

**Mixing both.** It is common to use Mantine for complex widgets and Tailwind for page layout. It works, but you must make them agree: same colours, same spacing, same breakpoints, and a clear CSS order. See [Mantine and Tailwind together](topic:mantine-tailwind/mantine-and-tailwind-together).

## 🎯 Why do we use it?

- **Speed.** You don't design every button and input from scratch.
- **Consistency.** Every page uses the same pieces, so the app looks like one product.
- **Accessibility.** Good libraries handle the keyboard and screen readers for you.
- **Control (Tailwind).** When the designer's look is very custom, utility classes avoid fighting a library's default style.

## ⚠️ Common mistakes

- **Fighting the library.** Overriding Mantine's look with lots of `!important` CSS. Use the theme instead (see [Mantine theming](topic:mantine-tailwind/mantine-theming)).
- **Two spacing systems.** Mantine's `md` is 16px and Tailwind's `p-4` is 16px, so they can match. Mixing random values from both looks messy.
- **Rebuilding complex widgets with Tailwind only**, and forgetting keyboard and screen-reader support.
- **Very long class strings** that nobody can read. Pull repeated ones into a small component.

## 🗣️ How to answer in an interview

> "A component library like Mantine gives ready-made React components — buttons, modals, inputs — with behaviour and accessibility built in. Utility-first CSS like Tailwind gives small single-purpose classes, and you build the design yourself.
>
> I pick a component library when I need complex widgets quickly, like date pickers, autocompletes or modals, because keyboard and screen-reader support is already done. I pick Tailwind when the design is very custom, or I want full control and small CSS.
>
> At SkillKeepr the UI is built with Mantine. Earlier in my career I used Ant Design and Tailwind. If a team mixes a library with Tailwind, I make sure both use the same colours, spacing and breakpoints, so the app still looks consistent."

[FILL IN: one SkillKeepr screen you built with Mantine, if you want a concrete example.]

## 🔁 Follow-up questions

### Which one gives smaller CSS?

Usually Tailwind. It only outputs the classes you actually used. A component library ships styles for its components. Mantine lets you import only the CSS files for the components you use, to cut this down.

### What is a headless component library?

A library that gives behaviour (open/close, keyboard, focus, ARIA) but no styles. Radix UI and Headless UI are examples. You style them yourself, often with Tailwind.

### Can a component library be customised to a brand?

Yes. Mantine has a theme for colours, fonts, spacing, radius and default props. Each component also accepts `classNames` and `styles` to change its inner parts.

### Is Tailwind just "inline styles"?

No. Inline styles can't do hover, focus, media queries or dark mode. Tailwind classes can (`hover:`, `md:`, `dark:`), and they come from one shared design scale.

## ✅ Quick check

### 1. In Tailwind, what does `px-4` mean?

- A) 4px padding on all sides
- B) 16px padding on left and right
- C) 4% padding

:::answer
**B.** `px` = padding on the x-axis (left and right). 4 units × 4px = **16px**.
:::

### 2. You need an accessible autocomplete with keyboard support by Friday. Which approach is safer?

:::answer
**A component library** (like Mantine's `Autocomplete`). The keyboard, focus and screen-reader behaviour is already built and tested.
:::

### 3. True or false: Mantine 9 creates its CSS with JavaScript while the app runs.

:::answer
**False.** Since Mantine 7, components are styled with a normal CSS file and CSS variables. Only the optional `@mantine/emotion` package adds runtime CSS-in-JS.
:::
