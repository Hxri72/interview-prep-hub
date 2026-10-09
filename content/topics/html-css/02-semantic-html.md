---
title: "Semantic HTML (header, nav, main, section, article, footer)"
stack: html-css
order: 2
level: Basic
mustKnow: true
askedFrequency: very common
summary:
  - "Semantic HTML means using tags that describe meaning: header, nav, main, article, footer, button."
  - "It helps screen readers, keyboard users, Google (SEO) and other developers."
  - "Use one main per page and one h1 per page. Keep headings in order (h1 → h2 → h3)."
  - "A real button works with the keyboard for free. A clickable div does not."
  - "div and span are fine for pure styling — they carry no meaning."
cards:
  - q: What is semantic HTML?
    a: Using HTML tags that describe what the content is, like nav for menus and article for a blog post, instead of divs everywhere.
  - q: Why use a button instead of a clickable div?
    a: A button can be focused with Tab and pressed with Enter or Space, and screen readers announce it as a button. A div needs extra code for all of that.
  - q: section vs article?
    a: An article makes sense on its own (a blog post, a job card). A section is a themed part of a page, usually with a heading.
  - q: How many main elements should a page have?
    a: One visible main, holding the page's main content.
  - q: Name three benefits of semantic HTML.
    a: Better accessibility, better SEO, and code that is easier to read.
---

## 💡 What is it?

**Semantic HTML** means choosing tags by their **meaning**. A menu goes in `<nav>`. The main content goes in `<main>`. A clickable action is a `<button>`.

"Semantic" just means "about meaning". The tag tells the browser, Google and [screen readers](glossary:screen-reader) what each part of the page **is**.

## 🏠 Real-life example

Think of a **school notice board** with labelled sections.

- The **title strip at the top** = `<header>`.
- The **list of class links** = `<nav>`.
- The **big middle area with today's notices** = `<main>`.
- **Each separate notice** you could take down and pin elsewhere = `<article>`.
- The **small "printed by the office" line at the bottom** = `<footer>`.

A blind student with a helper can ask, "read me the notices section". That only works because the sections have labels. A page made only of `<div>`s is a board with no labels.

## 🧑‍💻 Code example

Save as `index.html` and open it in your browser.

```html
<!DOCTYPE html>                                       <!-- modern HTML5 page -->
<html lang="en">                                      <!-- the page language is English -->
<head>                                                <!-- page info -->
  <meta charset="UTF-8">                              <!-- text encoding for all languages -->
  <title>Jobs board</title>                           <!-- tab title -->
</head>                                               <!-- end of head -->
<body>                                                <!-- visible content -->
  <header>                                            <!-- top part of the page -->
    <h1>Open jobs</h1>                                <!-- the ONE main heading of the page -->
    <nav aria-label="Main">                           <!-- the site menu; aria-label names it for screen readers -->
      <a href="/">Home</a>                            <!-- a link to the home page -->
      <a href="/jobs">Jobs</a>                        <!-- a link to the jobs page -->
    </nav>                                            <!-- end of menu -->
  </header>                                           <!-- end of top part -->
  <main>                                              <!-- the main content (one per page) -->
    <article>                                         <!-- one job card that makes sense on its own -->
      <h2>Node.js Developer</h2>                      <!-- heading for this job (h2 comes after h1) -->
      <p>3+ years, Kochi, hybrid.</p>                 <!-- job details -->
      <button type="button">Apply</button>            <!-- a real button: works with Tab + Enter -->
    </article>                                        <!-- end of job card -->
  </main>                                             <!-- end of main content -->
  <footer>© 2026 Jobs Board</footer>                  <!-- bottom part of the page -->
</body>                                               <!-- end of body -->
</html>                                               <!-- end of page -->
```

```text
On screen: a heading "Open jobs", two links, a job card with an "Apply" button,
and a footer line. It looks plain — semantic tags change meaning, not looks.

Press Tab: the focus moves Home → Jobs → Apply. Press Enter on Apply: it "clicks".
```

## 🔍 Deeper version

**Landmarks.** Screen readers let users jump between "landmarks":

| Tag | Landmark role | Use for |
|---|---|---|
| `<header>` (top level) | banner | site header |
| `<nav>` | navigation | groups of links |
| `<main>` | main | the page's main content |
| `<aside>` | complementary | side content, related links |
| `<footer>` (top level) | contentinfo | site footer |
| `<section>` with a heading | region | a named part of the page |

**Headings make an outline.** Screen reader users often jump by headings. Use one `<h1>`, then `<h2>`, `<h3>` in order. Don't pick a heading level just for its size. Use CSS for size.

**Interactive elements.** `<button>`, `<a href>`, `<input>`, `<select>`, `<details>` and `<dialog>` come with keyboard support and roles built in. A `<div onclick>` has none. You'd need `role="button"`, `tabindex="0"` and key handlers to copy a button. The first rule of ARIA is: don't use ARIA if a native element does the job. See [accessibility basics](topic:html-css/accessibility).

**Button vs link.** A link (`<a href>`) **goes somewhere**. A button **does something** on this page. Mixing them confuses keyboard and screen reader users.

**Other useful semantic tags:** `<time datetime="2026-10-09">`, `<figure>` + `<figcaption>`, `<address>`, `<mark>`, `<ul>`/`<ol>` for real lists, `<table>` for real tabular data (not for layout).

**In React.** JSX is still HTML in the end. Components should render `<nav>`, `<button>` and `<label>`, not plain divs. Component libraries like MUI already do this inside their components.

## 🎯 Why do we use it?

- **Accessibility.** Screen readers and keyboard users can find their way around.
- **SEO.** Google understands the page better, because it knows what the main content is.
- **Readable code.** `<nav>` explains itself. `<div class="nav-wrapper-2">` doesn't.
- **Free behaviour.** A real button gives you focus, keyboard support and form submit for nothing.

## ⚠️ Common mistakes

- **Clickable `<div>`s** instead of buttons. Keyboard users can't reach them.
- **Choosing headings by size** (`<h4>` because it "looks right"). Use CSS for size.
- **More than one `<h1>`** or skipping levels (h1 → h4).
- **Using `<section>` as a styling wrapper** with no heading. Use a `<div>` for pure styling.

## 🗣️ How to answer in an interview

> "Semantic HTML means using tags that describe what the content is, like header, nav, main, article and footer, instead of divs everywhere. It matters for three reasons. Screen readers use these tags as landmarks, so users can jump to the menu or the main content. Search engines understand the page better. And the code is easier to read.
>
> The most practical example is buttons. A real button can be focused with Tab and pressed with Enter or Space, and it's announced as a button. A clickable div gets none of that. So I use button for actions and a link for navigation, keep one h1 per page with headings in order, and use divs only for styling."

## 🔁 Follow-up questions

### When is a div the right choice?

When the box has no meaning and is only there for layout or styling, like a flex wrapper. A `<div>` is neutral, so it adds no wrong meaning.

### What is the difference between section and article?

An `<article>` makes sense on its own and could be shared or reused, like a blog post, a job card or a comment. A `<section>` is a themed part of a page, usually with a heading, like "Experience" on a profile page.

### Does semantic HTML change how the page looks?

Not much. Browsers add a few default styles (headings are bigger). Mainly it changes meaning, which helps tools and people using assistive tech.

### How would you check if a page is semantic?

Tab through it with only the keyboard. Look at the Accessibility tree in Chrome DevTools. Run Lighthouse's accessibility audit, or a tool like axe.

## ✅ Quick check

### 1. Which element should wrap the site's main menu links?

- A) `<menu>`
- B) `<nav>`
- C) `<div class="menu">`

:::answer
**B) `<nav>`.** It marks a group of navigation links, and screen readers list it as a landmark.
:::

### 2. A "Delete" action that removes a row on the same page should be a…

:::answer
**`<button type="button">`.** It does an action on this page. A link is for going to another URL.
:::

### 3. True or false: you should use `<h3>` instead of `<h2>` because the `<h2>` font is too big.

:::answer
**False.** Pick the heading level by the outline of the page. Change the size with CSS.
:::
