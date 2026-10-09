---
title: Component library vs utility-first CSS
stack: mui-tailwind
order: 1
level: Basic
mustKnow: false
askedFrequency: common
summary:
  - A component library (like Material UI) gives you ready-made pieces such as Button, Dialog and Table.
  - Utility-first CSS (like Tailwind) gives you tiny classes such as p-4 and flex, and you build the look yourself.
  - Component libraries are fast for complex widgets. Utility CSS gives full control over the design.
  - Many teams mix them — MUI for complex widgets, Tailwind for layout — but then they must keep spacing and colours matching.
cards:
  - q: What is a component library?
    a: A set of ready-made, styled React components, like Button, TextField and Dialog. Material UI and Ant Design are examples.
  - q: What is utility-first CSS?
    a: A style where you use many tiny classes, each doing one job, like p-4 (padding 16px) or text-lg. Tailwind is the best-known example.
  - q: When would you pick a component library?
    a: When you need complex widgets fast — date pickers, data tables, dialogs — with keyboard and screen-reader support already built in.
  - q: When would you pick Tailwind?
    a: When the design is custom and you want full control, small CSS output and no fight with a library's default look.
  - q: What is the main risk of using both in one app?
    a: Two different spacing and colour systems. If you don't make them match, the app looks inconsistent.
---

## 💡 What is it?

There are two popular ways to style a React app.

A **component library** gives you finished pieces. You write `<Button>` and get a styled button. **Material UI (MUI)** and **Ant Design** work like this.

**Utility-first CSS** gives you tiny classes. Each class does one small job. You combine them to build the look yourself. **Tailwind CSS** works like this.

## 🏠 Real-life example

Think about getting a **school uniform**.

- **Option 1: buy a ready-made uniform** from the school shop. It fits most students. It looks the same for everyone. You can only change small things.
- **Option 2: buy cloth, buttons and thread**, and stitch your own. It takes more work. But you choose every detail.

The mapping:

- **Ready-made uniform** = a component library (MUI, Ant Design).
- **Cloth, buttons, thread** = utility classes (Tailwind).
- **Small changes to the ready-made one** = theming and style overrides.
- **Stitching yourself** = combining `flex`, `p-4`, `rounded-xl` and so on.

## 🧑‍💻 Code example

The same "Save" button, built both ways. Make a React app with `npm create vite@latest` (pick React). For the MUI part run `npm install @mui/material @emotion/react @emotion/styled`. For the Tailwind part, set up Tailwind first (see [Tailwind setup](topic:mui-tailwind/tailwind-setup)). Paste into `src/App.jsx`.

```jsx
import Button from '@mui/material/Button';                  // the ready-made Button component from Material UI

export default function App() {                              // our main component
  return (                                                   // what the screen shows
    <div style={{ display: 'flex', gap: 16, padding: 24 }}>  {/* a row with 16px gaps and 24px padding */}
      <Button variant="contained">Save</Button>              {/* MUI: one prop, and the whole style comes from the library */}
      <button className="rounded-md bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700"> {/* Tailwind: we build the look from small classes */}
        Save                                                 {/* the button's text */}
      </button>                                              {/* end of the Tailwind button */}
    </div>                                                   // end of the row
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
You see two blue "SAVE"/"Save" buttons side by side.
The MUI one has uppercase text, a shadow and a ripple effect when clicked.
The Tailwind one looks exactly like the classes say — nothing more.
```

## 🔍 Deeper version

**How each one works:**

| | Component library (MUI) | Utility-first (Tailwind) |
|---|---|---|
| What you get | Ready React components with behaviour | CSS classes only, no behaviour |
| Styling engine | CSS-in-JS (Emotion) by default; values set at runtime | Plain CSS made at build time |
| Accessibility | Built in for complex widgets (focus, keyboard, ARIA) | You add it yourself |
| Design | Looks like Material Design unless you theme it | Looks like whatever you build |
| CSS size | The library's JS + CSS for the parts you use | Only the classes you used |
| Learning | Learn the component APIs (props) | Learn the class names |

**CSS-in-JS** means the styles are written in JavaScript and turned into CSS while the app runs. That is flexible, but it has a small runtime cost. Tailwind does its work when you build the app, so the browser just loads a normal CSS file.

**Behaviour matters more than looks.** A date picker, autocomplete or modal needs keyboard handling, focus trapping and screen-reader labels. Building those yourself takes a long time and is easy to get wrong. That is the strongest reason to use a component library.

**Headless libraries are the middle path.** Libraries like Radix UI or Headless UI give the *behaviour* without any styles. You add the look with Tailwind. Many modern teams (for example with shadcn/ui) do this.

**Mixing both.** It is common to use MUI for complex widgets and Tailwind for page layout. It works, but you must make them agree: same colours, same spacing scale, same breakpoints. See [MUI and Tailwind together](topic:mui-tailwind/mui-and-tailwind-together).

## 🎯 Why do we use it?

- **Speed.** You don't design every button and input from scratch.
- **Consistency.** Every page uses the same pieces, so the app looks like one product.
- **Accessibility.** Good libraries handle the keyboard and screen readers for you.
- **Control (Tailwind).** When the designer's look is very custom, utility classes avoid fighting a library's default style.

## ⚠️ Common mistakes

- **Fighting the library.** Overriding MUI's look with lots of `!important` CSS. Use the theme instead (see [MUI theming](topic:mui-tailwind/mui-theming)).
- **Two spacing systems.** MUI spacing is 8px per unit, Tailwind is 4px per unit. Mixing `sx={{ p: 2 }}` and `p-4` is fine (both 16px), but mixing random values looks messy.
- **Rebuilding complex widgets with Tailwind only**, and forgetting keyboard and screen-reader support.
- **Very long class strings** that nobody can read. Pull repeated ones into a small component.

## 🗣️ How to answer in an interview

> "A component library like Material UI gives ready-made React components — buttons, dialogs, tables — with behaviour and accessibility built in. Utility-first CSS like Tailwind gives small single-purpose classes, and you build the design yourself.
>
> I pick a component library when I need complex widgets quickly, like date pickers, autocompletes or data tables, because keyboard and screen-reader support is already done. I pick Tailwind when the design is very custom, or I want full control and small CSS.
>
> They can be mixed — library for complex widgets, Tailwind for layout — but then I make sure both use the same colours, spacing and breakpoints, so the app still looks consistent."

[FILL IN: which approach your SkillKeepr screens use — confirm the UI library used at SkillKeepr — and one example screen.]

## 🔁 Follow-up questions

### Which one gives smaller CSS?

Usually Tailwind. It only outputs the classes you actually used. A component library ships the JavaScript and styles for each component you import.

### What is a headless component library?

A library that gives behaviour (open/close, keyboard, focus, ARIA) but no styles. Radix UI and Headless UI are examples. You style them yourself, often with Tailwind.

### Can a component library be customised to a brand?

Yes. MUI has a theme for colours, fonts, spacing and default props, plus style overrides per component.

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
**A component library** (like MUI's `Autocomplete`). The keyboard, focus and screen-reader behaviour is already built and tested.
:::

### 3. True or false: Tailwind generates CSS while the app runs in the browser.

:::answer
**False.** Tailwind builds the CSS file at build time. CSS-in-JS libraries like Emotion (used by MUI) work at runtime.
:::
