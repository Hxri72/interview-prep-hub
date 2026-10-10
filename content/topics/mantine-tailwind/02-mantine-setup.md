---
title: "Mantine: setup and core components"
stack: mantine-tailwind
order: 2
level: Basic
mustKnow: true
askedFrequency: very common
summary:
  - Mantine is a React component library. It gives you ready-made, accessible parts like Button, TextInput, Modal and Table.
  - "Setup: install @mantine/core and @mantine/hooks, import '@mantine/core/styles.css', and wrap your app in <MantineProvider>."
  - Mantine styles are plain CSS (CSS modules) since v7, so there is no CSS-in-JS runtime.
  - postcss-preset-mantine adds helpers like rem() and light-dark() for your own CSS files.
  - Extra features live in separate packages, like @mantine/notifications, @mantine/form and @mantine/dates.
cards:
  - q: What is Mantine?
    a: A React component library with 100+ ready-made, accessible components (Button, TextInput, Modal, Table…) and a big hooks package.
  - q: What are the three setup steps for Mantine?
    a: "Install @mantine/core and @mantine/hooks, import '@mantine/core/styles.css' once, and wrap the app in <MantineProvider>."
  - q: Why do you need MantineProvider?
    a: It gives every Mantine component the theme (colours, spacing, fonts) and the colour scheme (light or dark).
  - q: How do you show a toast notification in Mantine?
    a: "Install @mantine/notifications, render <Notifications /> once inside MantineProvider, then call notifications.show({ title, message })."
  - q: How does Mantine style components since v7?
    a: With plain CSS files (CSS modules) and CSS variables, not with emotion at runtime. That makes it faster and works with server rendering.
---

## 💡 What is it?

**Mantine** is a [component](glossary:component) library for React. It gives you ready-made building blocks: buttons, text inputs, pop-up windows, tables and more.

You don't style these from zero. You import them, pass some [props](glossary:props), and they already look good and work with the keyboard.

Mantine also has a huge **hooks** package (`@mantine/hooks`) with small helpers like `useDisclosure` and `useDebouncedValue`.

## 🏠 Real-life example

Think of **building a house with ready-made parts**.

You could make every door and window yourself from wood. Or you could buy ready doors and windows that already fit, open, close and lock.

- **Ready-made doors and windows** = Mantine components (Button, Modal, TextInput).
- **The house plan that says "all doors are blue, all rooms have 16px gaps"** = the Mantine theme.
- **The main electric board that powers every room** = `MantineProvider`. Without it, nothing inside gets power.
- **Extra fittings you buy separately, like a doorbell** = extra packages like `@mantine/notifications`.

## 🧑‍💻 Code example

Create a Vite React app and add Mantine:

```bash
npm create vite@latest mantine-demo -- --template react   # new React app
cd mantine-demo                                           # go into the folder
npm install @mantine/core @mantine/hooks @mantine/notifications   # Mantine + hooks + toasts
npm install -D postcss postcss-preset-mantine             # optional CSS helpers (rem, light-dark)
```

**`postcss.config.cjs`** (new file):

```js
module.exports = {                                   // PostCSS settings for Vite
  plugins: { 'postcss-preset-mantine': {} },         // turns on Mantine's CSS helpers
};                                                   // end of config
```

**`src/main.jsx`** (replace everything):

```jsx
import { StrictMode } from 'react';                          // React's extra checks in development
import { createRoot } from 'react-dom/client';               // puts React on the page
import '@mantine/core/styles.css';                           // Mantine's CSS — import it ONCE
import '@mantine/notifications/styles.css';                  // CSS for the toast messages
import { MantineProvider } from '@mantine/core';             // gives theme to every component
import { Notifications } from '@mantine/notifications';      // the place where toasts appear
import App from './App.jsx';                                 // our app

createRoot(document.getElementById('root')).render(           // find <div id="root"> and draw into it
  <StrictMode>                                                {/* development checks */}
    <MantineProvider>                                         {/* default theme: blue, md spacing */}
      <Notifications />                                       {/* toasts will show here */}
      <App />                                                 {/* the rest of the app */}
    </MantineProvider>                                        {/* end of the provider */}
  </StrictMode>,                                              // end of StrictMode
);                                                            // end of render
```

**`src/App.jsx`** (replace everything):

```jsx
import { useState } from 'react';                                    // React state
import { Button, Container, Modal, Table, TextInput, Title } from '@mantine/core'; // ready components
import { useDisclosure } from '@mantine/hooks';                      // easy open/close state
import { notifications } from '@mantine/notifications';              // function to show a toast

const candidates = [                                                 // sample data for the table
  ['Asha', 'React', 3],                                              // name, skill, years
  ['Ravi', 'Node.js', 5],                                            // second row
];                                                                   // end of the data

export default function App() {                                      // our main component
  const [name, setName] = useState('');                              // text typed in the input
  const [opened, { open, close }] = useDisclosure(false);            // modal starts closed (false)

  return (                                                           // what the screen shows
    <Container size="sm" py="xl">                                    {/* centred box, max 720px wide, 32px top/bottom padding */}
      <Title order={2} mb="md">Candidates</Title>                    {/* an <h2>, 16px space below */}
      <Table                                                         // a styled HTML table
        striped                                                      // every second row is shaded
        data={{ head: ['Name', 'Skill', 'Years'], body: candidates }} // header row + body rows
      />                                                             {/* end of the table */}
      <Button mt="md" onClick={open}>Add candidate</Button>          {/* 16px space above; click opens the modal */}
      <Modal opened={opened} onClose={close} title="New candidate">  {/* the pop-up; Esc or ✕ closes it */}
        <TextInput                                                   // a labelled text box
          label="Name"                                               // the label above the box
          value={name}                                               // controlled: value comes from state
          onChange={(e) => setName(e.currentTarget.value)}           // save each key press
          error={name.length === 1 ? 'Too short' : null}             // red error text when 1 letter
        />                                                           {/* end of the input */}
        <Button                                                      // the save button
          mt="md"                                                    // 16px space above
          onClick={() => {                                           // when clicked:
            notifications.show({ title: 'Saved', message: name });   // show a toast with the name
            close();                                                 // close the modal
          }}                                                         // end of the click handler
        >                                                            {/* end of Button props */}
          Save                                                       {/* button text */}
        </Button>                                                    {/* end of the save button */}
      </Modal>                                                       {/* end of the modal */}
    </Container>                                                     // end of the page box
  );                                                                 // end of what App returns
}                                                                    // end of App
```

Run `npm run dev` and open the link.

```text
A heading "Candidates" and a 2-row table (rows are striped).
A blue "Add candidate" button. Clicking it opens a centred pop-up.
Typing one letter shows a red "Too short" under the box.
Clicking Save closes the pop-up and a toast "Saved — Asha" appears.
```

## 🔍 Deeper version

**What `MantineProvider` does.** It puts the **theme** (colours, spacing, radius, fonts, breakpoints) into React context. It also writes CSS variables like `--mantine-spacing-md` and `--mantine-color-blue-6` onto the page. Every component reads those variables. It also manages the **colour scheme** (`light`, `dark` or `auto`).

**How Mantine styles itself.** Since v7, every component has a plain CSS file, and `@mantine/core/styles.css` contains them all. Props like `size`, `color` and `radius` only change **CSS variables** on the element. Nothing is calculated in JavaScript at runtime.

| Package | What it gives you |
|---|---|
| `@mantine/core` | All the base components and the provider |
| `@mantine/hooks` | 80+ hooks (`useDisclosure`, `useDebouncedValue`, `useMediaQuery`…) — needed by core |
| `@mantine/form` | Form state and validation |
| `@mantine/notifications` | Toast messages |
| `@mantine/modals` | Modals opened from code (confirm dialogs) |
| `@mantine/dates` | Date pickers |
| `@mantine/dropzone` | Drag-and-drop file upload |
| `@mantine/tiptap` | Rich text editor |

**`postcss-preset-mantine`** lets *your own* CSS use helpers: `rem(16px)` becomes a scaled rem value, `light-dark(white, black)` picks a colour per colour scheme, and `@mixin dark { … }` writes dark-mode rules. To use breakpoint variables like `$mantine-breakpoint-sm` in your CSS, you also add `postcss-simple-vars`.

**Importing only some CSS.** For a smaller bundle, you can import per-component files, like `@mantine/core/styles/Button.css`, instead of the full `styles.css`. You must then keep the right import order: base styles first.

:::version[Version note]
- **Mantine 7 (2023)** removed emotion from the core. Styles moved to CSS files and CSS variables, and `createStyles` and the `sx` prop moved to an optional package, `@mantine/emotion`.
- **Mantine 9** (current, 9.7 in October 2026) needs **React 19.2 or newer**. Mantine 7 and 8 work with React 18 or 19.
- At **SkillKeepr**, the UIs use **Mantine 7** with `@mantine/form`, notifications, modals, dropzone and the Tiptap editor.
:::

## 🎯 Why do we use it?

- **Speed.** A table, a modal and a form with validation take minutes, not days.
- **Accessibility built in.** Modals trap the keyboard focus, inputs connect labels for screen readers, and Esc closes pop-ups.
- **One consistent look.** All spacing, colours and corner radius come from one theme.
- **Hooks for everyday problems.** For example, debouncing a search box or tracking open and closed state.

## ⚠️ Common mistakes

- **Forgetting `import '@mantine/core/styles.css'`.** The components then render with no styling at all.
- **Using a component outside `MantineProvider`.** It throws an error about a missing provider.
- **Importing styles in many files.** Import them **once**, in `main.jsx`.
- **Forgetting the package's own CSS**, for example `@mantine/notifications/styles.css`. The toasts then appear unstyled.

## 🗣️ How to answer in an interview

> "Mantine is a React component library with over a hundred accessible components and a large hooks package. Setup is three steps: install `@mantine/core` and `@mantine/hooks`, import the core CSS once, and wrap the app in `MantineProvider`, which passes the theme and colour scheme to every component. Since version 7, Mantine uses plain CSS modules and CSS variables, so there's no runtime styling cost. Extra features like notifications, forms and date pickers are separate packages. At SkillKeepr our UIs are built on Mantine 7, with `@mantine/form` for forms and the notifications package for toasts."

[FILL IN: one screen or component you built with Mantine at SkillKeepr.]

## 🔁 Follow-up questions

### Why is MantineProvider required?

It provides the theme and the colour scheme to every component through React context. It also writes the theme's CSS variables. Without it, components can't find their settings and throw an error.

### Mantine vs Material UI — what is different?

Both are full React component libraries. Material UI follows Google's Material Design look and uses emotion for styling. Mantine has its own neutral look, styles with plain CSS modules since v7, and ships a very large hooks package. The ideas (theme, provider, style props) are similar.

### How do you keep the bundle small?

Import components from `@mantine/core` (tree-shaking removes unused ones). Import only the CSS files you need instead of the full `styles.css`, and only install the extra packages you use.

### Does Mantine work with server rendering (Next.js)?

Yes. Since v7, styles are static CSS, so they work with server rendering. You add `ColorSchemeScript` in the HTML head to avoid a flash of the wrong colour scheme.

## ✅ Quick check

### 1. You install Mantine and use `<Button>`, but it looks like a plain browser button. What did you forget?

:::answer
`import '@mantine/core/styles.css';` — usually in `main.jsx`. Mantine's styles are plain CSS files, so they must be imported once.
:::

### 2. Which package do you need for toast messages?

- A) `@mantine/core`
- B) `@mantine/notifications`
- C) `@mantine/hooks`

:::answer
**B.** Then render `<Notifications />` once inside `MantineProvider` and call `notifications.show({ title, message })`.
:::

### 3. True or false: Mantine 9 can be used with React 18.

:::answer
**False.** Mantine 9 needs React 19.2 or newer. Mantine 7 and 8 support React 18 and 19.
:::
