---
title: "Accessibility basics (alt text, labels, ARIA, keyboard)"
stack: html-css
order: 5
level: Intermediate
mustKnow: true
askedFrequency: common
summary:
  - "Accessibility (a11y) means everyone can use the page, including people using screen readers, keyboards or zoom."
  - "Basics: alt text on images, labels on inputs, real buttons and links, headings in order."
  - "Everything must work with the keyboard alone, with a visible focus outline."
  - "Text needs enough colour contrast: 4.5:1 for normal text."
  - "ARIA adds meaning only when HTML can't. First rule: prefer a native HTML element."
cards:
  - q: What is accessibility (a11y)?
    a: Making a website usable for everyone, including people who are blind, use only a keyboard, have low vision or other disabilities.
  - q: What should alt text say?
    a: What the image means in context. Use alt="" for purely decorative images so screen readers skip them.
  - q: What is the first rule of ARIA?
    a: Don't use ARIA if a native HTML element already gives the meaning and behaviour, like a real button.
  - q: Why must you not remove the focus outline?
    a: Keyboard users need it to see where they are. If you restyle it, keep a clear visible focus style.
  - q: What contrast ratio does WCAG AA need for normal text?
    a: At least 4.5 to 1 between text and background (3 to 1 for large text).
---

## 💡 What is it?

**[Accessibility](glossary:accessibility)** (short form: **a11y**) means making a website that **everyone can use**.

That includes people who are blind and use a **[screen reader](glossary:screen-reader)**, people who use only the **keyboard**, and people with low vision who **zoom in**. Good accessibility also makes the page easier for everyone else.

## 🏠 Real-life example

Think of a **school building**.

- **Stairs only** = a page that works only with a mouse.
- A **ramp next to the stairs** = keyboard support.
- **Braille labels on doors** = alt text and labels for screen readers.
- **Big, clear signs** = good colour contrast and readable text.
- **A guide who reads signs aloud** = the screen reader.

A ramp helps wheelchair users, but also parents with prams and someone carrying boxes. Accessibility helps more people than you expect.

## 🧑‍💻 Code example

Save as `index.html`, open it, and try using it **with only the Tab and Enter keys**.

```html
<!DOCTYPE html>                                                    <!-- modern HTML5 page -->
<html lang="en">                                                   <!-- lang tells screen readers which voice/language to use -->
<head>                                                             <!-- page info -->
  <meta charset="UTF-8">                                           <!-- text encoding -->
  <title>Accessible card</title>                                   <!-- tab title, also read by screen readers -->
  <style>                                                          <!-- CSS starts -->
    body { font-family: sans-serif; color: #1f2937; }              /* dark grey text on white: high contrast */
    button:focus-visible { outline: 3px solid #2563eb; }           /* clear blue ring when reached by keyboard */
  </style>                                                         <!-- CSS ends -->
</head>                                                            <!-- end of head -->
<body>                                                             <!-- visible content -->
  <main>                                                           <!-- main landmark: screen readers can jump here -->
    <h1>Candidate</h1>                                             <!-- the page heading -->
    <img src="https://picsum.photos/80" alt="Photo of Asha Menon"> <!-- alt = what the image means -->
    <img src="https://picsum.photos/20" alt="">                    <!-- alt="" = decorative, screen readers skip it -->
    <label for="note">Note for recruiter</label>                   <!-- visible label linked to the textarea -->
    <textarea id="note"></textarea>                                <!-- the field the label describes -->
    <button type="button" aria-label="Shortlist Asha Menon">★</button> <!-- icon button: aria-label gives it a name -->
    <p id="status" aria-live="polite"></p>                         <!-- aria-live: screen readers read changes here -->
  </main>                                                          <!-- end of main -->
  <script>                                                         <!-- small script for the button -->
    document.querySelector('button').addEventListener('click', () => { // when the star button is clicked
      document.getElementById('status').textContent = 'Asha shortlisted'; // update the live region
    });                                                            // end of click handler
  </script>                                                        <!-- end of script -->
</body>                                                            <!-- end of body -->
</html>                                                            <!-- end of page -->
```

```text
Press Tab: focus moves into the textarea, then to the ★ button with a blue ring.
Press Enter on ★: "Asha shortlisted" appears.
With a screen reader on (VoiceOver: Cmd+F5 on Mac), you hear:
"Photo of Asha Menon, image" … "Note for recruiter, edit text" …
"Shortlist Asha Menon, button" … then "Asha shortlisted" after pressing it.
```

## 🔍 Deeper version

**WCAG** (Web Content Accessibility Guidelines) is the standard. Most companies aim for **WCAG 2.2 level AA**. Its 4 principles are **POUR**: Perceivable, Operable, Understandable, Robust.

**The checklist I use:**

| Area | What to check |
|---|---|
| Images | Meaningful `alt`; `alt=""` for decoration |
| Forms | Every input has a label; errors are linked with `aria-describedby` |
| Keyboard | Everything works with Tab, Shift+Tab, Enter, Space, Esc; logical order; no keyboard traps |
| Focus | Visible focus style; focus moves into a dialog and back when it closes |
| Contrast | 4.5:1 normal text, 3:1 large text and UI parts |
| Structure | One `h1`, headings in order, landmarks (`main`, `nav`) |
| Motion | Respect `prefers-reduced-motion` |
| Zoom | Page still works at 200% zoom |

**ARIA in short.** ARIA attributes add meaning for assistive tech:
- `aria-label` names something with no visible text (an icon button).
- `aria-describedby` links extra help or error text.
- `aria-expanded` says whether a dropdown is open.
- `aria-live` announces changes, like "Saved".

But ARIA only changes what screen readers **hear**. It doesn't add keyboard behaviour. So prefer native elements: `<button>`, `<dialog>`, `<details>`. Wrong ARIA is worse than no ARIA.

**`:focus` vs `:focus-visible`.** `:focus-visible` shows the ring for keyboard users, not after every mouse click. So designers are happier, and keyboard users still see where they are.

**Testing.** Tab through the page. Run Lighthouse or axe DevTools. Try a real screen reader (VoiceOver on Mac, NVDA on Windows). Automatic tools find only part of the problems.

**Component libraries** like MUI give you many accessible parts (dialogs with focus traps, menus with arrow keys). You still need to add labels and alt text yourself. See [accessibility in UI libraries](topic:mui-tailwind/accessibility-ui-libraries).

## 🎯 Why do we use it?

- **People.** Many users have a disability, temporary injury or old device.
- **Law.** Many countries require accessible websites, and big clients ask for it.
- **Better product.** Keyboard support, clear labels and good contrast help every user.
- **SEO.** Semantic, well-labelled pages are easier for search engines too.

## ⚠️ Common mistakes

- **Removing the focus outline** with `outline: none` and adding nothing back.
- **Clickable divs** that the keyboard can't reach.
- **Icon buttons with no name.** The screen reader just says "button".
- **Light grey text on white** with poor contrast.
- **Adding ARIA everywhere** instead of using the right HTML element.

## 🗣️ How to answer in an interview

> "Accessibility means the app works for everyone, including screen reader users, keyboard-only users and people who zoom. My baseline is: semantic HTML with landmarks and headings in order, meaningful alt text and alt empty for decoration, a real label for every input, and real buttons and links.
>
> Everything has to work with the keyboard, with a visible focus style — I use focus-visible rather than removing outlines. I check contrast is at least 4.5 to 1. I only add ARIA when HTML can't express something, like aria-label on an icon button or aria-live for status messages. To test, I tab through the page, run Lighthouse or axe, and try a screen reader for key flows."

[FILL IN: one accessibility fix you made in a real project, if any. Only if it's true.]

## 🔁 Follow-up questions

### What is the difference between aria-label and a visible label?

A visible `<label>` helps everyone, including sighted users. `aria-label` is only heard by screen readers. Use a visible label when you can, and `aria-label` for things like icon-only buttons.

### How do you make a custom dropdown accessible?

First try a native `<select>`. If you must build your own, follow the ARIA pattern for that widget (roles, `aria-expanded`, arrow-key support, focus handling). Or use a tested library component.

### What happens to focus when a modal opens?

Focus should move into the modal and stay inside it while it's open. Esc should close it, and focus should return to the button that opened it. The native `<dialog>` with `showModal()` does most of this for you.

### What is a skip link?

A link at the top, "Skip to content", that becomes visible on focus. It lets keyboard users jump past the menu straight to `<main>`.

## ✅ Quick check

### 1. An image is only a decorative swirl. What alt should it have?

:::answer
**`alt=""`** (empty). Screen readers then skip it. Don't leave out the attribute, or some readers will read the file name.
:::

### 2. Which is better for an action button?

- A) `<div onclick="save()">Save</div>`
- B) `<button type="button">Save</button>`
- C) `<span role="button">Save</span>`

:::answer
**B.** A real button works with Tab, Enter and Space and is announced correctly, with no extra code.
:::

### 3. Grey text `#9ca3af` on a white background has a contrast of about 2.5:1. Does it pass WCAG AA for normal text?

:::answer
**No.** Normal text needs at least **4.5:1**. Use a darker grey.
:::
