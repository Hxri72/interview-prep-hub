---
title: Accessibility in component libraries
stack: mui-tailwind
order: 16
level: Intermediate
mustKnow: false
askedFrequency: sometimes
summary:
  - "Accessibility (a11y) means everyone can use the app, including keyboard users and people using screen readers."
  - "Libraries like MUI and antd do a lot for you: keyboard support, focus trapping in dialogs, ARIA attributes."
  - "They can't do everything. You still must add labels, alt text, good colour contrast and a sensible focus order."
  - "Icon-only buttons need an aria-label. Inputs need a real label. Dialogs need a title."
  - "Test it: use Tab through the page, run Lighthouse or axe, and try a screen reader."
cards:
  - q: What does a component library give you for accessibility?
    a: Keyboard support, focus management (like trapping focus inside a dialog), correct roles and ARIA attributes, and visible focus styles.
  - q: What must you still do yourself?
    a: Labels for inputs, aria-label for icon-only buttons, alt text for images, enough colour contrast, and a logical heading and focus order.
  - q: Why does an icon-only button need aria-label?
    a: A screen reader has no text to read for a picture. aria-label gives it a name, like "Delete candidate".
  - q: What is focus trapping?
    a: While a dialog is open, Tab stays inside the dialog. When it closes, focus goes back to the button that opened it.
  - q: How do you test accessibility quickly?
    a: Navigate with only the keyboard, run Lighthouse or the axe browser extension, and check contrast. For important flows, try a screen reader like NVDA or VoiceOver.
---

## 💡 What is it?

**Accessibility** (often written **a11y**: "a", then 11 letters, then "y") means **everyone can use your app**. That includes people who:
- use only a keyboard,
- use a screen reader (software that reads the page aloud),
- can't see some colours well,
- zoom the page to 200%.

Component libraries like **MUI** and **Ant Design** do a lot of this work for you. They also manage the [DOM](glossary:dom) focus for you. But they **can't do all of it**. Some parts are always your job.

## 🏠 Real-life example

Think of a **school building with a ramp and a lift**.

The builder added the ramp, the lift and handrails. That's great. But if a teacher puts a big table in front of the lift, or a sign has no braille, students still get stuck.

- **The ramp, lift and handrails** = what the library gives you: keyboard support, focus handling, ARIA roles.
- **The teacher's table blocking the lift** = your code breaking it, like removing focus outlines.
- **Signs on every door** = labels you must write, like `aria-label` and `<label>`.
- **Clear, high-contrast signs** = good colour contrast you must choose.
- **A student checking every door with a wheelchair** = testing with only a keyboard.

## 🧑‍💻 Code example

Setup: a Vite React app with `npm install @mui/material @emotion/react @emotion/styled @mui/icons-material`. Paste into `src/App.jsx`.

```jsx
import { useState } from 'react';                                     // React state hook
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, TextField } from '@mui/material'; // MUI components
import DeleteIcon from '@mui/icons-material/Delete';                  // a trash-can icon

export default function App() {                                       // the main component
  const [open, setOpen] = useState(false);                            // open = is the dialog showing? starts false
  return (                                                            // what the page shows
    <main style={{ padding: 24 }}>                                    {/* <main> = the main landmark for screen readers; 24px padding */}
      <TextField label="Candidate email" id="email" />                {/* label is linked to the input, so screen readers read "Candidate email" */}
      <IconButton aria-label="Delete candidate" onClick={() => setOpen(true)}> {/* icon-only button: aria-label gives it a spoken name */}
        <DeleteIcon />                                                {/* the picture only; MUI hides it from screen readers */}
      </IconButton>                                                   {/* end of the icon button */}
      <Dialog                                                         // MUI dialog: traps focus inside while open
        open={open}                                                   // show or hide
        onClose={() => setOpen(false)}                                // Esc key or backdrop click closes it
        aria-labelledby="delete-title"                                // the dialog's name comes from the title below
      >                                                               {/* end of the opening Dialog tag */}
        <DialogTitle id="delete-title">Delete this candidate?</DialogTitle> {/* read aloud when the dialog opens */}
        <DialogContent>This cannot be undone.</DialogContent>         {/* the message */}
        <DialogActions>                                               {/* the button row */}
          <Button onClick={() => setOpen(false)}>Cancel</Button>      {/* a real button with visible text */}
          <Button color="error" onClick={() => setOpen(false)}>Delete</Button> {/* red button; the text says what it does */}
        </DialogActions>                                              {/* end of the button row */}
      </Dialog>                                                       {/* end of the dialog */}
    </main>                                                           // end of main
  );                                                                  // end of what App returns
}                                                                     // end of App
```

**What you see (try it with only the keyboard):**

```text
Tab → focus moves to the email field, then to the trash button (a focus ring shows).
Enter on the trash button → the dialog opens and focus moves inside it.
Tab keeps cycling between Cancel and Delete — it can't escape to the page behind.
Esc → the dialog closes and focus goes back to the trash button.
A screen reader announces: "Delete candidate, button", then "Delete this candidate?, dialog".
```

## 🔍 Deeper version

**What good libraries handle for you:**
- **Roles and states.** A menu says `role="menu"`, and a checkbox exposes `aria-checked`.
- **Keyboard patterns** from the WAI-ARIA Authoring Practices: arrow keys in menus and tabs, Esc to close, Enter or Space to activate.
- **Focus management.** Dialogs trap focus and return it on close. Menus move focus to the first item.
- **Visible focus styles** (as long as you don't remove them).

**What stays your job:**

| Your job | Example |
|---|---|
| Names for controls | `aria-label="Delete candidate"` on icon-only buttons |
| Labels for inputs | `label` prop / `<label htmlFor>`; a placeholder is not a label |
| Alt text | `alt="Hari's profile photo"`; `alt=""` for decorative images |
| Colour contrast | text at least **4.5:1** against its background (WCAG AA); 3:1 for large text |
| Not colour alone | an error shows red **and** an icon or text |
| Logical structure | one `h1`, headings in order, landmarks like `<main>` and `<nav>` |
| Real buttons and links | `<button>` for actions, `<a href>` for navigation, never a clickable `<div>` |

**ARIA rule number one:** don't use ARIA if a native HTML element already does the job. A `<button>` is better than `<div role="button" tabindex="0">`, because it already supports keyboard, focus and screen readers.

**Headless libraries** (like Radix UI, React Aria or Headless UI) give you only the behaviour and accessibility, with no styles. Teams that style with Tailwind often pair them, so they don't have to build focus traps and keyboard patterns themselves.

**Testing:**
1. Tab through every screen with no mouse.
2. Run Lighthouse (in Chrome DevTools) or the axe extension for automatic checks.
3. Zoom to 200% and check nothing breaks.
4. For key flows, use a screen reader: NVDA on Windows, VoiceOver on Mac.
5. In tests, query by role: `getByRole('button', { name: 'Delete candidate' })`. If the test can't find it, a screen reader can't either.

## 🎯 Why do we use it?

- **Real people need it.** Many users rely on keyboards, screen readers or zoom.
- **Legal and business reasons.** Many countries and big customers require WCAG accessibility.
- **Better for everyone.** Clear labels, good contrast and keyboard shortcuts help all users.
- **Libraries save time.** Building accessible dialogs and menus from scratch is hard. Libraries already did it.

## ⚠️ Common mistakes

- **Icon-only buttons with no `aria-label`.** A screen reader just says "button".
- **Using a placeholder instead of a label.** It disappears when you type and is often low contrast.
- **Removing focus outlines** (`outline: none`) without a replacement.
- **Clickable `<div>`s** instead of `<button>`. They don't work with the keyboard.

## 🗣️ How to answer in an interview

> "Component libraries like MUI give a lot of accessibility for free: correct roles, keyboard support, and focus management. For example, a Dialog traps focus while it's open and returns it to the trigger when it closes.
>
> But some things are always my job: a label for every input, an aria-label for icon-only buttons, alt text, enough colour contrast — 4.5 to 1 for normal text — and real button and link elements instead of clickable divs.
>
> To check it, I tab through the screen with no mouse, run Lighthouse or axe, and in tests I query by role, like getByRole button with a name. If the test can't find it by its accessible name, a screen reader user can't either."

## 🔁 Follow-up questions

### What is WCAG?

The Web Content Accessibility Guidelines. Level **AA** is the usual target. It covers contrast, keyboard access, labels, focus and more.

### aria-label vs aria-labelledby?

`aria-label` gives the name as a string directly. `aria-labelledby` points to the id of another element whose text becomes the name, like a dialog pointing to its title. Prefer visible text when you can.

### How do you make a custom dropdown accessible?

Use a library component, or a headless one like Radix or React Aria. A custom dropdown needs the right roles, arrow-key support, typeahead, Esc to close and focus management. It's easy to get wrong.

### How do you announce a toast or a saved message?

Use a live region (`aria-live="polite"` or `role="status"`). Screen readers read changes in it without moving focus. Library snackbars usually do this already.

## ✅ Quick check

### 1. What will a screen reader say for this button?

```jsx
<IconButton onClick={remove}><DeleteIcon /></IconButton> {/* no aria-label */}
```

:::answer
Just **"button"**, with no name. Add `aria-label="Delete candidate"`.
:::

### 2. Which is better for an action, and why?

- A) `<div onClick={save}>Save</div>`
- B) `<button onClick={save}>Save</button>`

:::answer
**B.** A real button works with Tab, Enter and Space, and screen readers announce it as a button. The div does none of that.
:::

### 3. What is the minimum contrast ratio for normal text at WCAG AA?

:::answer
**4.5:1.** Large text (about 24px, or 18.66px bold) needs 3:1.
:::
