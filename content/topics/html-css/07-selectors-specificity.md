---
title: CSS selectors and specificity
stack: html-css
order: 7
level: Basic
mustKnow: true
askedFrequency: very common
summary:
  - "A selector picks which elements a CSS rule styles: tag (p), class (.card), id (#save), attribute, and combinations."
  - "When two rules clash, the more specific one wins: inline style > id > class > tag."
  - "If specificity is equal, the rule written later wins."
  - ":is() takes the strongest selector inside it, :where() always counts as zero, :has() selects a parent by its children."
  - "Avoid !important and ids for styling; keep specificity low and flat with classes."
cards:
  - q: What is CSS specificity?
    a: The score the browser uses to decide which rule wins when two rules style the same property on the same element.
  - q: Order the selectors from weakest to strongest — id, tag, class.
    a: "Tag (0,0,1) < class (0,1,0) < id (1,0,0). Inline styles beat all of them, and !important beats normal rules."
  - q: Two rules have the same specificity. Which wins?
    a: The one that comes later in the CSS.
  - q: What does :has() do?
    a: It selects an element based on what it contains, like .card:has(img) selects cards that contain an image.
  - q: Difference between :is() and :where()?
    a: Both group selectors. :is() takes the specificity of its strongest selector; :where() always has zero specificity.
---

## 💡 What is it?

A **[selector](glossary:selector)** is the part of a CSS rule that **picks which elements to style**. For example, `.card` picks every element with `class="card"`.

Sometimes two rules try to style the same thing. **Specificity** is the score that decides **which rule wins**. More specific selectors beat less specific ones.

## 🏠 Real-life example

Think of **instructions given to students**.

- "All students, wear white" = a **tag selector** (`p`). It's very general.
- "Class 10-B, wear blue" = a **class selector** (`.class-10b`). More specific.
- "Hari, wear red" = an **id selector** (`#hari`). Most specific.
- A note pinned **on Hari's shirt** = an **inline style**. It beats all the others.
- "**MUST** wear green, no matter what" = `!important`. It overrides almost everything, and causes confusion.

If two class teachers give equal instructions, the **later** one counts. That's the "last rule wins" tie-break.

## 🧑‍💻 Code example

Save as `index.html` and open it in your browser.

```html
<!DOCTYPE html>                                          <!-- modern HTML5 page -->
<html lang="en">                                         <!-- page language: English -->
<head>                                                   <!-- page info -->
  <meta charset="UTF-8">                                 <!-- text encoding -->
  <title>Specificity</title>                             <!-- tab title -->
  <style>                                                <!-- CSS starts -->
    p { color: gray; }                                   /* tag selector: score (0,0,1) */
    .note { color: blue; }                               /* class selector: score (0,1,0) — beats p */
    #first { color: red; }                               /* id selector: score (1,0,0) — beats .note */
    .note { color: green; }                              /* same score as the earlier .note, but LATER, so it wins over it */
    .card:has(img) { border: 2px solid orange; }         /* :has() = any .card that CONTAINS an img */
    :where(.box) p { font-style: italic; }               /* :where() adds 0 to the score: easy to override */
  </style>                                               <!-- CSS ends -->
</head>                                                  <!-- end of head -->
<body>                                                   <!-- visible content -->
  <p>Plain paragraph</p>                                 <!-- only the tag rule matches: gray -->
  <p class="note">Note paragraph</p>                     <!-- tag + class match: class wins, latest .note = green -->
  <p class="note" id="first">Note with an id</p>         <!-- id beats class: red -->
  <p class="note" style="color: purple">Inline style</p> <!-- inline style beats id and class: purple -->
  <div class="card"><img src="https://picsum.photos/40" alt=""></div> <!-- has an img: gets the orange border -->
  <div class="card">No image here</div>                  <!-- no img: no border -->
  <div class="box"><p>Inside a box</p></div>             <!-- italic from the :where() rule -->
</body>                                                  <!-- end of body -->
</html>                                                  <!-- end of page -->
```

```text
"Plain paragraph" is gray.
"Note paragraph" is green (not blue — the later .note rule wins).
"Note with an id" is red.
"Inline style" is purple.
The card with the picture has an orange border; the other card has none.
"Inside a box" is gray and italic.
```

## 🔍 Deeper version

**Selector types:**

| Selector | Example | Picks |
|---|---|---|
| Tag | `p` | every `<p>` |
| Class | `.card` | elements with `class="card"` |
| Id | `#save` | the element with `id="save"` |
| Attribute | `input[type="email"]` | email inputs |
| Descendant | `.card p` | `p` anywhere inside `.card` |
| Child | `.card > p` | `p` directly inside `.card` |
| Sibling | `h2 + p` | the `p` right after an `h2` |
| Pseudo-class | `a:hover`, `li:nth-child(2)` | elements in a state or position |
| Pseudo-element | `p::first-line` | a part of an element |

**How the score works.** Think of three columns: **(ids, classes, tags)**.
- Ids → first column. Classes, attributes and pseudo-classes → second column. Tags and pseudo-elements → third.
- Compare from left to right. `#nav a` = (1,0,1) beats `.menu .item a` = (0,2,1), because the first column wins.
- The universal selector `*` adds nothing.

**The full order (simplified "cascade"):**
1. `!important` rules beat normal rules.
2. Then **cascade layers** (`@layer`): later layers win. (Tailwind v4 uses layers.)
3. Then **specificity**.
4. Then **source order**: the last one wins.

Inline `style=""` beats any selector, unless the other rule uses `!important`.

**Modern selectors:**
- `:is(h1, h2, h3) a` — a shorter way to write a group. Its score = its strongest item.
- `:where(...)` — the same, but its score is **0**. Great for base styles that are easy to override.
- `:has(...)` — the "parent selector". `form:has(input:invalid) button { opacity: .5 }` dims the button while any field is invalid.

:::version[Version note]
`:has()` is supported in all major browsers since late 2023. Native CSS nesting (`.card { & p { … } }`) has been supported since 2023 too. Both are safe to use in 2026.
:::

## 🎯 Why do we use it?

Understanding specificity lets you **predict which style wins**. You stop the "why is my CSS not working?" problem and the habit of adding `!important` everywhere. It's also the base for how libraries like MUI and Tailwind decide which style applies. See [MUI and Tailwind together](topic:mui-tailwind/mui-and-tailwind-together).

## ⚠️ Common mistakes

- **Using `!important` to win a fight.** The next fix needs another `!important`. It snowballs.
- **Styling with ids.** Their high score makes them hard to override.
- **Long chains** like `.page .main .list .item a`. Fragile and hard to override.
- **Forgetting source order** when two rules have the same score.

## 🗣️ How to answer in an interview

> "A selector picks which elements a rule applies to — tags, classes, ids, attributes, pseudo-classes and combinations like child or descendant. When two rules set the same property on the same element, the browser uses the cascade. Important rules win first, then cascade layers, then specificity, then source order — the later rule wins.
>
> Specificity is like a score of ids, classes and tags, compared left to right. So an id beats any number of classes, and a class beats any number of tags. Inline styles beat selectors. In practice I keep specificity low and flat with single classes, avoid ids and !important for styling, and use :where() for base styles that should be easy to override."

## 🔁 Follow-up questions

### Does `!important` always win?

It beats normal rules. If two rules both use `!important`, the normal rules apply between them (layers, specificity, order). Inline styles with `!important` are very hard to beat.

### What is the specificity of `ul li.active a:hover`?

Ids: 0. Classes and pseudo-classes: `.active` + `:hover` = 2. Tags: `ul`, `li`, `a` = 3. So **(0,2,3)**.

### How does Tailwind avoid specificity fights?

Almost every utility is a single class with the same low score, and they're placed in a known cascade layer. So the order of the layers decides, not long selectors.

## ✅ Quick check

### 1. Which colour is the text?

```css
.title { color: blue; }  /* class */
h1 { color: red; }       /* tag, written later */
```

with `<h1 class="title">Hi</h1>`.

:::answer
**Blue.** The class (0,1,0) beats the tag (0,0,1). Source order only matters when the scores are equal.
:::

### 2. Which selector has the higher score: `#menu a` or `.nav .list .item a`?

:::answer
**`#menu a`** — (1,0,1). One id beats any number of classes, (0,3,1).
:::

### 3. What is the specificity of `:where(#app) .btn`?

:::answer
**(0,1,0).** `:where()` adds nothing, so only `.btn` counts.
:::
