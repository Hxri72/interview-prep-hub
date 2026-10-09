---
title: The DOM and DOM manipulation
stack: javascript
order: 27
level: Basic
mustKnow: false
askedFrequency: common
summary:
  - The DOM is the browser's tree of everything on the page. JavaScript can read it and change it.
  - Find elements with querySelector (first match) and querySelectorAll (all matches).
  - Change text with textContent, classes with classList, and attributes with setAttribute.
  - Create new elements with createElement, then add them with append.
  - "Avoid innerHTML with user input: it can run attacker code (XSS). Use textContent instead."
cards:
  - q: What is the DOM?
    a: The Document Object Model. It is the browser's tree of all elements on the page. JavaScript can read and change it.
  - q: querySelector vs querySelectorAll?
    a: querySelector returns the first matching element (or null). querySelectorAll returns a list (NodeList) of all matches.
  - q: textContent vs innerHTML?
    a: textContent sets plain text, so it is safe. innerHTML parses HTML, so user input in it can run attacker code (XSS).
  - q: How do you add a new item to a list with plain JavaScript?
    a: "Create it with document.createElement('li'), set its textContent, then add it with list.append(li)."
  - q: Why is changing the DOM many times in a loop slow?
    a: Each change can make the browser recalculate layout and repaint. Build the items first (for example in a DocumentFragment) and add them once.
---

## 💡 What is it?

When the browser loads a page, it turns the HTML into a **tree** of objects. This tree is called the **[DOM](glossary:dom)** (Document Object Model).

Every tag becomes a **node** (one item in the tree). JavaScript can find these nodes, read them and change them.

When you change the DOM, the page on the screen changes too.

## 🏠 Real-life example

Think of a **family tree** drawn on a big chart in your school hall.

- The **chart** = the whole page (`document`).
- **Each person** on the chart = one HTML element, like a `<button>` or a `<p>`.
- **Parents and children** on the chart = elements inside other elements.
- **The teacher with a marker** = JavaScript. The teacher can find a person, change their name, add a new baby, or remove someone.

When the teacher writes on the chart, everyone in the hall sees the change at once. That's what DOM manipulation does to a web page.

## 🧑‍💻 Code example

Save this as `dom.html`. Open it in your browser by double-clicking it.

```html
<!doctype html>                                         <!-- tells the browser this is modern HTML -->
<ul id="list"></ul>                                      <!-- an empty list; id="list" lets JS find it -->
<button id="add">Add candidate</button>                  <!-- a button; id="add" lets JS find it -->
<script>                                                 <!-- JavaScript starts here -->
  const list = document.querySelector('#list');          // find the element with id "list" (# means id)
  const btn = document.querySelector('#add');            // find the button with id "add"
  let count = 0;                                         // how many items we added; starts at 0
  btn.addEventListener('click', () => {                  // run this function every time the button is clicked
    count = count + 1;                                   // add 1 to the counter
    const li = document.createElement('li');             // make a new <li> element (not on the page yet)
    li.textContent = `Candidate ${count}`;               // put plain text inside it, e.g. "Candidate 1"
    li.classList.add('new');                             // add the CSS class "new" to it
    list.append(li);                                     // put the <li> at the end of the list → now it shows
  });                                                    // end of the click handler
</script>                                                <!-- JavaScript ends here -->
```

**What you will see:**

```text
Click 1 → a list item "Candidate 1" appears
Click 2 → "Candidate 2" appears below it
Click 3 → "Candidate 3" appears below that
```

## 🔍 Deeper version

**Finding elements:**

| Method | Returns | Example |
|---|---|---|
| `document.querySelector(css)` | the **first** match, or `null` | `querySelector('.card')` |
| `document.querySelectorAll(css)` | a **NodeList** (a list) of all matches | `querySelectorAll('li')` |
| `document.getElementById(id)` | one element by id, or `null` | `getElementById('list')` |

`querySelectorAll` returns a **static** list. It does not update when the page changes. Older methods like `getElementsByClassName` return a **live** list that does update.

**Changing elements:**
- `el.textContent = 'Hi'` sets plain text. It is safe.
- `el.innerHTML = '<b>Hi</b>'` reads the string as HTML. **Never put user input here.** An attacker could add a `<img onerror=...>` tag that runs their code. This attack is called **[XSS](glossary:xss)** (cross-site scripting).
- `el.classList.add / remove / toggle('active')` changes CSS classes.
- `el.setAttribute('aria-expanded', 'true')` changes an attribute.
- `el.style.color = 'red'` sets one inline style. Prefer classes for most styling.

**Creating and removing:** `document.createElement('li')` makes a node. `parent.append(child)` adds it at the end. `el.remove()` deletes it.

**Performance: reflow and repaint.** When you change size or position, the browser must recalculate the layout. This is called **reflow**. Then it draws again, which is called **repaint**. Many changes inside a loop can mean many reflows. A better way is to build all items in a `DocumentFragment` (a lightweight box that is not on the page). Then add the fragment once.

**Scripts and loading.** A script at the top of the page runs before the HTML below it exists. So `querySelector` returns `null`. Put scripts at the end of `<body>`, or use `<script defer>`, or wait for the `DOMContentLoaded` event.

**How React relates.** React keeps a "virtual DOM" in memory. It compares old and new versions and changes only what is needed in the real DOM. So in React you rarely touch the DOM yourself. You use a `ref` when you must, for example to focus an input.

## 🎯 Why do we use it?

- **To make pages interactive.** Show a message, open a menu, add a list item, all without reloading the page.
- **To show data from a server.** You fetch data, then create elements for it.
- **To understand React and other libraries.** They all change the DOM in the end. Knowing the DOM helps you debug them.

## ⚠️ Common mistakes

- **Running the script before the HTML exists.** `querySelector` returns `null`, and then `null.addEventListener` crashes. Use `defer` or put the script at the end.
- **Using `innerHTML` with user input.** This opens the door to XSS. Use `textContent`.
- **Changing the DOM one item at a time in a big loop.** Build in a fragment and add once.
- **Forgetting that `querySelectorAll` is not a real array** in old code. It has `forEach`, but not `map`. Use `Array.from(list)` or `[...list]` to get an array.

## 🗣️ How to answer in an interview

> "The DOM is the browser's tree of objects built from the HTML. Every element is a node, and JavaScript can read and change it. I find elements with querySelector or querySelectorAll, change text with textContent, classes with classList, and create new nodes with createElement and append.
>
> Two things I'm careful about. First, security: I never put user input into innerHTML, because that can lead to XSS. I use textContent instead. Second, performance: many DOM changes in a loop can cause repeated reflows, so I batch them, for example with a DocumentFragment.
>
> In React I rarely touch the DOM directly, because React updates it for me. I use refs only for things like focusing an input."

## 🔁 Follow-up questions

### What is the difference between the DOM and the HTML source?

The HTML is the text file the server sends. The DOM is the live tree the browser builds from it. JavaScript can change the DOM later. So "View source" can look different from what you see in DevTools' Elements tab.

### What is the difference between a NodeList and an array?

A NodeList is a list of nodes returned by methods like `querySelectorAll`. It has `length` and `forEach`. But it doesn't have array methods like `map` or `filter`. Turn it into an array with `Array.from(nodeList)` or `[...nodeList]`.

### Why is innerHTML dangerous?

It turns a string into real HTML. If that string comes from a user, they can add tags with event attributes like `onerror` that run JavaScript. This is XSS. Use `textContent` for text, or clean the HTML with a sanitizer library if you really need HTML.

### What are reflow and repaint?

Reflow is the browser recalculating sizes and positions after a layout change. Repaint is drawing pixels again. Reflow is more expensive. Reading layout values (like `offsetHeight`) right after writing styles can force extra reflows.

## ✅ Quick check

### 1. What does this return if there is no element with class "card"?

```js
document.querySelector('.card');   // look for the first element with class "card"
```

:::answer
**`null`.** `querySelector` returns `null` when nothing matches. Calling a method on it, like `.textContent`, would then crash.
:::

### 2. Which is safe for showing a user's name?

- A) `el.innerHTML = userName`
- B) `el.textContent = userName`

:::answer
**B.** `textContent` treats the value as plain text. `innerHTML` would run any HTML or script tricks inside the name.
:::

### 3. True or false: `querySelectorAll` returns a live list that updates when you add new elements.

:::answer
**False.** It returns a **static** NodeList. It shows the elements that matched at the moment you called it.
:::
