---
title: z-index and stacking context
stack: html-css
order: 11
level: Intermediate
mustKnow: false
askedFrequency: common
summary:
  - z-index decides which element sits on top when two elements overlap. A bigger number is closer to you.
  - z-index only works on positioned elements (relative, absolute, fixed, sticky), and on flex or grid children.
  - A stacking context is a "group" of layers. A child can never escape its parent's group, however big its z-index is.
  - Things that create a new stacking context include z-index with position, opacity below 1, transform, filter and isolation.
  - "If z-index 9999 does not work, look for a parent that creates a stacking context."
cards:
  - q: What does z-index do?
    a: It decides which element is drawn on top when elements overlap. A higher number comes to the front.
  - q: Why does z-index sometimes do nothing?
    a: The element is not positioned (it is position static), or it is trapped inside a parent's stacking context.
  - q: What is a stacking context?
    a: A group of layers that is sorted on its own. Children inside it can only move up and down inside that group, never above elements outside it.
  - q: Name three things that create a new stacking context.
    a: "position with a z-index value, opacity less than 1, and transform. Also filter, will-change and isolation: isolate."
  - q: How do you stop a modal from hiding behind other content?
    a: Render it near the end of body (for example with a React portal), so no parent stacking context traps it, then give it a high z-index.
---

## 💡 What is it?

Sometimes two elements overlap on the screen. For example, a pop-up and the page behind it.

`z-index` decides **which one sits on top**. A bigger number comes closer to you.

But `z-index` lives inside groups called **stacking contexts**. An element can only move up or down inside its own group.

## 🏠 Real-life example

Think of **papers on a teacher's desk**.

Each paper has a number. The paper with the biggest number is on top of the pile.

Now some papers are inside a **plastic folder**. The folder sits in the pile as one item.

- A **paper** = an element on the page.
- The **number on the paper** = its `z-index`.
- The **plastic folder** = a stacking context.
- A paper inside the folder can be number 1000. It still can't come out above a paper that sits on top of the whole folder.

That is why `z-index: 9999` sometimes "doesn't work".

## 🧑‍💻 Code example

Save this as `index.html` and open it in your browser.

```html
<!DOCTYPE html>                               <!-- tells the browser this is modern HTML -->
<html lang="en">                              <!-- the page; lang = English -->
<head>                                        <!-- settings for the page -->
  <style>                                     /* CSS starts here */
    .box {                                    /* style for every box */
      position: absolute;                     /* take the box out of normal flow so boxes can overlap */
      width: 150px;                           /* box is 150 pixels wide */
      height: 150px;                          /* box is 150 pixels tall */
      color: white;                           /* white text */
      padding: 8px;                           /* 8px space inside the box, around the text */
    }                                         /* end of .box */
    .red   { background: crimson; top: 20px;  left: 20px;  z-index: 1; }  /* red box, z-index 1 = bottom layer */
    .blue  { background: royalblue; top: 60px; left: 60px; z-index: 3; } /* blue box, z-index 3 = top layer */
    .green { background: seagreen; top: 100px; left: 100px; z-index: 2; } /* green box, z-index 2 = middle layer */
    .folder {                                 /* a parent that makes its own stacking context */
      position: relative;                     /* positioned, so z-index works on it */
      z-index: 0;                             /* z-index + position = a NEW stacking context (a "folder") */
      top: 220px;                             /* move the folder down below the first boxes */
    }                                         /* end of .folder */
    .trapped { background: darkorange; z-index: 999; top: 0; left: 0; }   /* huge z-index, but inside the folder */
    .outside { position: relative; z-index: 1; top: 250px; left: 60px;    /* a box outside the folder, z-index 1 */
               width: 150px; height: 60px; background: purple; color: white; } /* purple bar */
  </style>                                    <!-- CSS ends here -->
</head>                                       <!-- end of head -->
<body>                                        <!-- what we see -->
  <div class="box red">red z=1</div>          <!-- bottom -->
  <div class="box blue">blue z=3</div>        <!-- top, even though it is written second -->
  <div class="box green">green z=2</div>      <!-- middle -->
  <div class="folder">                        <!-- the "plastic folder" with z-index 0 -->
    <div class="box trapped">orange z=999</div> <!-- z-index 999, but stuck inside the folder -->
  </div>                                      <!-- end of folder -->
  <div class="outside">purple z=1</div>       <!-- z-index 1, outside the folder -->
</body>                                       <!-- end of body -->
</html>                                       <!-- end of page -->
```

**What you see:**

```text
Top three boxes: blue is on top, green is in the middle, red is at the bottom.
Lower down: the purple bar (z=1) covers the orange box (z=999).
Why? Orange lives inside the folder (z-index 0). Purple (z-index 1) is above the whole folder.
```

## 🔍 Deeper version

**1. When does z-index work?**

`z-index` only works when the element is:
- positioned: `position` is `relative`, `absolute`, `fixed` or `sticky`, **or**
- a child of a **flex** or **grid** container.

On a normal `position: static` element, `z-index` is ignored.

**2. The default order (no z-index).** The browser paints in this order, back to front:
1. The background of the stacking context.
2. Elements with a **negative** z-index.
3. Normal block elements, in the order they appear in the HTML.
4. Positioned elements with `z-index: auto` or `0`, in HTML order.
5. Elements with a **positive** z-index, smallest first.

So, with no z-index, a later element covers an earlier one.

**3. What creates a new stacking context?**

| Property | Example |
|---|---|
| `position` (not static) + `z-index` (not auto) | `position: relative; z-index: 0;` |
| `position: fixed` or `sticky` | always |
| `opacity` less than 1 | `opacity: 0.99;` |
| `transform`, `filter`, `perspective` | `transform: translateX(0);` |
| `isolation: isolate` | made for this purpose |
| flex/grid child with a z-index | `z-index: 1` inside a flex box |
| `will-change` on those properties | `will-change: transform;` |

The surprise ones are `opacity` and `transform`. A fade-in animation can suddenly trap a dropdown inside it.

**4. `isolation: isolate`.** This creates a stacking context **without** changing anything else. Use it on a component to keep its inner z-index values local.

**5. Modals and the "z-index war".** Teams often pile up numbers like 999, 9999, 99999. A better way:
- Render modals and dropdowns at the end of `<body>`. In React this is a portal. See [portals](topic:react/portals-forward-ref).
- Keep a small **scale** in CSS variables: `--z-dropdown: 10`, `--z-modal: 100`, `--z-toast: 200`. See [CSS variables](topic:html-css/css-variables).

**6. The new `<dialog>` and popovers.** `dialog.showModal()` and the `popover` attribute put the element in the browser's **top layer**. The top layer is above everything, with no z-index needed.

:::version[Version note]
The **top layer** (`<dialog>` with `showModal()`, and the `popover` attribute) works in all major browsers since 2024. It removes most z-index problems for modals and menus.
:::

## 🎯 Why do we use it?

Real pages overlap all the time. Think of sticky headers, dropdown menus, tooltips, pop-ups, toast messages and chat buttons.

Without clear layering, a menu hides behind the page, or a pop-up appears under the header. `z-index` and stacking contexts let you decide what goes on top, on purpose.

## ⚠️ Common mistakes

- **Using z-index on a static element.** It does nothing. Add `position: relative` first.
- **Fighting with bigger numbers.** `z-index: 99999` won't help if a parent traps the element. Find the parent's stacking context instead.
- **Forgetting that `transform` or `opacity` creates a context.** An animation library can add `transform` and break your menu.
- **Random numbers everywhere.** Keep a small, named scale in one place.

## 🗣️ How to answer in an interview

> "z-index controls which element is painted on top when elements overlap. It only works on positioned elements, or on flex and grid children. The key idea is the stacking context. A stacking context is a group that is layered on its own. Its children can only be sorted inside it, so a child with z-index 9999 can still sit below an element outside the group.
>
> Many things create a stacking context. For example, position with a z-index, opacity below 1, transform, filter, and isolation: isolate. So when z-index 'doesn't work', I check the parents in DevTools for one of those.
>
> For modals, I render them at the end of the body with a portal, or use the native dialog element, which uses the browser's top layer. And I keep a small z-index scale in CSS variables, instead of random large numbers."

## 🔁 Follow-up questions

### My dropdown has z-index 9999 but hides behind the header. Why?

Some parent of the dropdown creates a stacking context with a lower layer than the header. Common causes are `transform`, `opacity` or `position` + `z-index` on a parent. Fix it by moving the dropdown out (a portal), or by raising the parent's z-index.

### Does z-index work on flex items without position?

Yes. A flex or grid child can use `z-index` even if it is `position: static`.

### What does `isolation: isolate` do?

It creates a new stacking context and changes nothing else. It keeps a component's z-index values local, so they don't fight with the rest of the page.

### Can z-index be negative?

Yes. A negative z-index puts the element behind its parent's content, but still inside the parent's stacking context.

## ✅ Quick check

### 1. Box A has `z-index: 5` and `position: static`. Box B has `z-index: 1` and `position: relative`. They overlap. Which is on top?

:::answer
**Box B.** Box A is static, so its z-index is ignored. Box B is positioned with z-index 1, so it is painted above normal elements.
:::

### 2. A parent has `opacity: 0.9`. Its child has `z-index: 1000`. Another element outside has `z-index: 1`. Can the child appear above the outside element?

- A) Yes, 1000 is bigger
- B) Only if the parent's layer is above the outside element
- C) z-index never works with opacity

:::answer
**B.** `opacity: 0.9` makes the parent a stacking context. The child is sorted only inside it. It can only appear above the outside element if the parent itself is layered above that element.
:::
