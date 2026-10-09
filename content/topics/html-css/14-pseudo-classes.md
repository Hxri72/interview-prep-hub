---
title: Pseudo-classes and pseudo-elements
stack: html-css
order: 14
level: Basic
mustKnow: false
askedFrequency: common
summary:
  - "A pseudo-class (one colon) styles an element in a special STATE: :hover, :focus, :first-child, :checked, :disabled."
  - "A pseudo-element (two colons) styles a PART of an element, or adds one: ::before, ::after, ::placeholder, ::first-line."
  - ::before and ::after need a content property, even if it is empty (content "").
  - :focus-visible shows a focus ring only for keyboard users, which keeps the page accessible and clean.
  - "Modern selectors :has(), :is() and :where() let you style a parent based on its children and group selectors."
cards:
  - q: Pseudo-class vs pseudo-element?
    a: A pseudo-class picks an element in a state (like :hover). A pseudo-element picks or creates a part of an element (like ::before).
  - q: Why do ::before and ::after need content?
    a: Without the content property, the pseudo-element is not created at all. Use content "" for a purely decorative shape.
  - q: What does :has() do?
    a: It selects an element that contains something matching the selector inside it, so you can style a parent based on its children.
  - q: :focus vs :focus-visible?
    a: :focus matches every focus, including mouse clicks. :focus-visible matches when the browser thinks a focus ring is useful, mainly keyboard focus.
  - q: What is the specificity of :where()?
    a: Zero. Everything inside :where() adds no specificity, so it is easy to override.
---

## 💡 What is it?

Sometimes you want to style an element only **in a certain state**. For example, when the mouse is over a button.

Sometimes you want to style **a part** of an element. Or you want to add a small decoration before it.

- A **pseudo-class** (one colon, `:hover`) picks an element **in a state**.
- A **pseudo-element** (two colons, `::before`) picks **a part** of an element, or adds an extra part.

## 🏠 Real-life example

Think of **students in a classroom**.

- **Pseudo-class** = a *situation* a student is in. "The student who raised their hand" (`:hover`). "The first student in the row" (`:first-child`). "The student who is absent" (`:disabled`). It's the same student, just in a special moment or place.
- **Pseudo-element** = a *part* of a student, or something added to them. "The student's name badge" (`::before`). "The first line of their essay" (`::first-line`).

## 🧑‍💻 Code example

Save this as `index.html` and open it in your browser. Hover, click and press Tab.

```html
<!DOCTYPE html>                                         <!-- modern HTML page -->
<html lang="en">                                        <!-- page language = English -->
<head>                                                  <!-- page settings -->
  <style>                                               /* CSS starts here */
    button { padding: 8px 16px; border: 0;              /* 8px top/bottom, 16px left/right; no border */
             background: royalblue; color: white; }     /* blue button, white text */
    button:hover { background: navy; }                  /* pseudo-class: darker when the mouse is over it */
    button:focus-visible { outline: 3px solid orange; } /* pseudo-class: orange ring for keyboard focus */
    button:disabled { opacity: 0.5; cursor: not-allowed; } /* pseudo-class: faded when disabled */
    li:first-child { font-weight: bold; }               /* pseudo-class: only the first list item is bold */
    li:nth-child(even) { background: #f1f5f9; }         /* pseudo-class: every 2nd item gets a grey background */
    .required::after { content: " *"; color: red; }     /* pseudo-element: adds a red star after the text */
    .tag::before {                                      /* pseudo-element: adds a dot before the text */
      content: "";                                      /* empty content: needed, or nothing appears */
      display: inline-block;                            /* lets us give the dot a size */
      width: 8px; height: 8px;                          /* the dot is 8 × 8 pixels */
      border-radius: 50%;                               /* 50% = a perfect circle */
      background: seagreen;                             /* green dot */
      margin-right: 6px;                                /* 6px gap between the dot and the text */
    }                                                   /* end of .tag::before */
    input::placeholder { color: #94a3b8; }              /* pseudo-element: light grey placeholder text */
    .card:has(input:checked) { border-color: seagreen; } /* :has() — the card turns green when its checkbox is ticked */
    .card { border: 2px solid #cbd5e1; padding: 12px; } /* grey border, 12px inside space */
  </style>                                              <!-- CSS ends here -->
</head>                                                 <!-- end of head -->
<body>                                                  <!-- visible content -->
  <button>Hover or Tab to me</button>                   <!-- shows :hover and :focus-visible -->
  <button disabled>Disabled</button>                    <!-- shows :disabled -->
  <ul>                                                  <!-- a list -->
    <li>First (bold)</li>                               <!-- :first-child -->
    <li>Second (grey)</li>                              <!-- even = grey -->
    <li>Third</li>                                      <!-- odd = no background -->
    <li>Fourth (grey)</li>                              <!-- even = grey -->
  </ul>                                                 <!-- end of list -->
  <label class="required">Email</label>                 <!-- red star added by ::after -->
  <input placeholder="you@example.com">                 <!-- grey placeholder -->
  <p class="tag">Shortlisted</p>                        <!-- green dot added by ::before -->
  <div class="card"><label><input type="checkbox"> Select me</label></div> <!-- :has() demo -->
</body>                                                 <!-- end of body -->
</html>                                                 <!-- end of page -->
```

**What you see:**

```text
The first button turns dark blue on hover. Press Tab: an orange ring appears.
The disabled button is faded.
List: "First" is bold. "Second" and "Fourth" have a grey background.
"Email *" — the red star comes from ::after.
A green dot appears before "Shortlisted" — from ::before.
Tick the checkbox: the whole card's border turns green — :has() styles the parent.
```

## 🔍 Deeper version

**Common pseudo-classes:**

| Group | Examples |
|---|---|
| User action | `:hover`, `:active`, `:focus`, `:focus-visible`, `:focus-within` |
| Form state | `:checked`, `:disabled`, `:required`, `:invalid`, `:user-invalid`, `:placeholder-shown` |
| Position | `:first-child`, `:last-child`, `:nth-child(2n)`, `:only-child`, `:nth-of-type()` |
| Logic | `:not()`, `:is()`, `:where()`, `:has()` |
| Links | `:link`, `:visited` |

**Common pseudo-elements:** `::before`, `::after`, `::placeholder`, `::selection` (highlighted text), `::first-line`, `::first-letter`, `::marker` (list bullet), `::backdrop` (behind a modal `<dialog>`), `::file-selector-button`.

**Key details:**
- `::before` and `::after` are **inline** by default. They are children of the element, placed before or after its content. They don't work on elements with no content box, like `<img>` or `<input>`.
- Old CSS used one colon for pseudo-elements (`:before`). Browsers still accept it. Two colons is the modern way.
- **Specificity:** a pseudo-class counts like a class (0,1,0). A pseudo-element counts like a tag (0,0,1). `:is()` and `:not()` take the specificity of their most specific argument. `:where()` is always **zero**. See [specificity](topic:html-css/selectors-specificity).
- `:nth-child(2n+1)` means odd items. The formula is `an + b`, where n counts 0, 1, 2…
- `:user-invalid` shows invalid styles only after the user has interacted. `:invalid` shows errors before the user types anything.

**`:has()` — the "parent selector".** For years CSS could not style a parent based on its children. `:has()` fixes this:

```css
form:has(:user-invalid) button[type="submit"] { opacity: 0.5; }   /* dim submit while a field is invalid */
li:has(> img) { padding: 0; }                                       /* list items that directly contain an image */
```

**Accessibility:**
- Never remove focus outlines without a replacement. Use `:focus-visible` to show a clear ring for keyboard users. See [accessibility basics](topic:html-css/accessibility).
- Text added with `::before`/`::after` may be read by screen readers. Don't put important information only there.

:::version[Version note]
`:has()` works in all major browsers since late 2023 (Firefox 121). `:user-invalid` and `:focus-visible` are also widely supported now.
:::

## 🎯 Why do we use it?

- **Interactive feedback** (hover, focus, active) without any JavaScript.
- **Cleaner HTML.** Decorations like icons, stars and dividers come from CSS, not extra `<span>`s.
- **Smart lists and tables.** Striped rows, first or last item styles.
- **Form UX.** Show errors only after the user has interacted.
- **Parent styling with `:has()`.** This used to need JavaScript.

## ⚠️ Common mistakes

- **Forgetting `content` on `::before`/`::after`.** Nothing appears.
- **Trying `::before` on `<input>` or `<img>`.** It does not work there. Wrap the element instead.
- **`outline: none` on focus with no replacement.** Keyboard users get lost.
- **Mixing up `:nth-child` and `:nth-of-type`.** `:nth-child` counts all siblings. `:nth-of-type` counts only the same tag.

## 🗣️ How to answer in an interview

> "A pseudo-class selects an element in a particular state or position, with one colon, like :hover, :focus-visible, :disabled or :nth-child(even). A pseudo-element selects or creates part of an element, with two colons, like ::before, ::after, ::placeholder or ::selection.
>
> For ::before and ::after, you must set content, even an empty string, or nothing is rendered. They're great for decorative things like icons or a required-field star, but not for important text, because of accessibility.
>
> Modern CSS adds :has(), which finally lets me style a parent based on its children, and :is() and :where() for grouping. :where() has zero specificity, which is useful for base styles that should be easy to override. For focus I use :focus-visible, so keyboard users get a clear ring."

## 🔁 Follow-up questions

### Can you use `::after` on an `<input>`?

No. Inputs are "replaced elements" without a content box for children, so `::before` and `::after` don't render. Wrap the input in a `<span>` or `<label>` and style that.

### `:is()` vs `:where()`?

Both group selectors: `:is(h1, h2) a`. The difference is specificity. `:is()` takes the highest specificity inside it. `:where()` always has zero.

### How do you style the bullet of a list item?

Use `li::marker { color: red; }`. You can change colour, font size and `content`.

### What is `:focus-within`?

It matches an element when it, or anything inside it, has focus. For example, it can highlight a whole form group while the user types in one of its inputs.

## ✅ Quick check

### 1. Which line adds a red star after every `.required` label?

- A) `.required:after { color: red; }`
- B) `.required::after { content: " *"; color: red; }`
- C) `.required::before { color: red; }`

:::answer
**B.** You need `::after` (after the text) and a `content` value. A and C have no `content`, so nothing appears.
:::

### 2. In a list of 6 items, which items does `li:nth-child(2n+1)` select?

:::answer
**Items 1, 3 and 5** (the odd ones). With n = 0, 1, 2 you get 1, 3, 5. It's the same as `:nth-child(odd)`.
:::
