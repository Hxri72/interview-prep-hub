---
title: "Events: bubbling, capturing and delegation"
stack: javascript
order: 28
level: Intermediate
mustKnow: true
askedFrequency: very common
summary:
  - "An event travels in 3 phases: capturing (down from the top), target (the clicked element), bubbling (back up to the top)."
  - "Listeners run in the bubbling phase by default. Pass { capture: true } to run in the capturing phase."
  - Event delegation means one listener on a parent handles events from many children, using event.target.
  - event.stopPropagation() stops the event from travelling further. event.preventDefault() stops the browser's default action.
  - Delegation saves memory and works for children added later.
cards:
  - q: What is event bubbling?
    a: After an event fires on an element, it travels up through its parents, all the way to the document. Each parent's listener for that event also runs.
  - q: What is event delegation?
    a: Putting one listener on a parent instead of many listeners on children. The parent checks event.target to see which child was clicked.
  - q: event.target vs event.currentTarget?
    a: target is the element that was actually clicked. currentTarget is the element whose listener is running right now.
  - q: stopPropagation vs preventDefault?
    a: stopPropagation stops the event travelling to other elements. preventDefault stops the browser's own action, like following a link or submitting a form.
  - q: Why does delegation work for items added later?
    a: The listener is on the parent, which already exists. New children's events bubble up to it too.
---

## 💡 What is it?

An **[event](glossary:event)** is a signal that something happened, like a click or a key press.

When you click a button, the event does not stay on the button. It **travels** through the page. First it goes down from the top to the button. Then it goes back up to the top. Going up is called **bubbling**.

**Event delegation** uses bubbling. You put **one** [listener](glossary:listener) on a parent. It catches events from all its children.

## 🏠 Real-life example

Think of a **school with classrooms**.

A student in Class 7B raises a complaint. The complaint first goes to the **class teacher**. Then it goes up to the **head of department**, and then to the **principal**. Each one hears it on the way up. That is **bubbling**.

Now, the school has 40 classrooms. Instead of hiring 40 helpers, the school puts **one helper at the main office**. Every complaint reaches the office anyway. The helper reads the note to see **which class** it came from. That is **event delegation**.

- **Student who complains** = the clicked element (`event.target`).
- **Teacher, head, principal** = the parent elements the event bubbles through.
- **One helper in the office** = one listener on the parent.
- **Reading which class it came from** = checking `event.target`.

## 🧑‍💻 Code example

Save this as `events.html`. Open it in the browser, then open DevTools (F12) and look at the Console.

```html
<!doctype html>                                                <!-- modern HTML -->
<ul id="jobs">                                                  <!-- the parent list; we put ONE listener here -->
  <li><button data-id="1">Apply: Node.js Developer</button></li> <!-- data-id="1" stores this job's id -->
  <li><button data-id="2">Apply: React Developer</button></li>   <!-- data-id="2" stores this job's id -->
</ul>                                                           <!-- end of the list -->
<script>                                                        <!-- JavaScript starts here -->
  const jobs = document.querySelector('#jobs');                 // find the parent list
  jobs.addEventListener('click', (event) => {                   // ONE listener for every button inside
    const btn = event.target.closest('button');                 // find the button that was clicked (or null)
    if (!btn) return;                                           // the click was not on a button → do nothing
    console.log('Applied to job', btn.dataset.id);              // dataset.id reads the data-id value
  });                                                           // end of the listener
  const li = document.createElement('li');                      // make a new list item LATER
  li.innerHTML = '<button data-id="3">Apply: Full Stack</button>'; // our own fixed HTML (no user input), so it is safe
  jobs.append(li);                                              // add it; the same listener still works for it
</script>                                                       <!-- JavaScript ends here -->
```

**Click each button. The Console shows:**

```text
Applied to job 1
Applied to job 2
Applied to job 3
```

Notice: button 3 was added after the listener, but it still works. That's the power of delegation.

## 🔍 Deeper version

**The 3 phases of an event:**

| Phase | Direction | When your listener runs |
|---|---|---|
| 1. Capturing | from `window` **down** to the target | only if you add `{ capture: true }` |
| 2. Target | at the clicked element | always |
| 3. Bubbling | from the target **up** to `window` | the default |

```js
parent.addEventListener('click', handler, { capture: true }); // run on the way DOWN (capturing phase)
parent.addEventListener('click', handler);                    // run on the way UP (bubbling phase, default)
```

**`event.target` vs `event.currentTarget`:**
- `target` is the element the user actually clicked. It might be an `<span>` inside your button.
- `currentTarget` is the element whose listener is running now. In delegation, that's the parent.

That's why we use `event.target.closest('button')`. `closest` walks up from the target and finds the nearest matching ancestor. It works even when the user clicks an icon inside the button.

**Stopping things:**
- `event.stopPropagation()` stops the event from moving to other elements. Use it rarely. It can break other code, like analytics or "click outside to close" menus.
- `event.preventDefault()` stops the browser's default action. Examples: a link going to a new page, or a form reloading the page on submit.

**Events that don't bubble.** Some events, like `focus`, `blur`, `mouseenter` and `mouseleave`, don't bubble. For delegation, use their bubbling versions: `focusin`, `focusout`, `mouseover`, `mouseout`.

**Removing listeners.** Use `removeEventListener` with the **same function**, or pass `{ once: true }` to run only once. Another way is an `AbortController`: pass `{ signal }` and call `controller.abort()` to remove many listeners at once.

**In React.** React already uses delegation. It attaches listeners at the root of your app, not on every element. Since React 17 the root is your app's container, not `document`. Your `onClick` props are handled through that one root listener.

## 🎯 Why do we use it?

- **Less memory.** One listener instead of hundreds, for example on a table with 500 rows.
- **Works for new items.** Rows added later by a fetch or a "load more" button work without extra code.
- **Simpler cleanup.** One listener to remove, not hundreds.
- **Understanding bubbling explains bugs.** For example, a click on a "Delete" button inside a clickable card also triggers the card's click.

## ⚠️ Common mistakes

- **Using `event.target` directly** when the button has an icon or `<span>` inside. The target becomes the inner element. Use `event.target.closest('button')`.
- **Adding a listener to every item in a loop.** It wastes memory and misses items added later.
- **Calling `stopPropagation()` to fix one bug.** It can break other features that rely on bubbling. Check the target instead.
- **Trying to delegate `focus` or `mouseenter`.** They don't bubble. Use `focusin` or `mouseover`.

## 🗣️ How to answer in an interview

> "When an event fires, it goes through three phases: capturing from the window down to the target, the target itself, and then bubbling back up through the parents. Listeners run in the bubbling phase by default, unless I pass capture: true.
>
> Event delegation uses bubbling. Instead of adding a listener to every child, I add one listener to the parent and check event.target, usually with closest(), to find which child was clicked. This saves memory and works for elements added later, like rows loaded from an API.
>
> I also know the difference between stopPropagation, which stops the event travelling, and preventDefault, which stops the browser's default action like a form submit. And React already uses delegation internally, with one listener at the root."

## 🔁 Follow-up questions

### What is the difference between `event.target` and `event.currentTarget`?

`target` is where the event started, the element the user actually clicked. `currentTarget` is the element whose listener is running right now. With delegation, `target` is the child and `currentTarget` is the parent.

### When would you use the capturing phase?

When a parent must react **before** its children. For example, closing all open menus before any child handles the click, or logging every click on the page first. It's rare in normal app code.

### Which events don't bubble?

`focus`, `blur`, `mouseenter`, `mouseleave`, `load` and some others. Use `focusin`/`focusout` and `mouseover`/`mouseout` for delegation instead.

### How does React handle events?

React attaches one listener per event type at the root container and uses delegation. Your `onClick` gets a "synthetic event" that wraps the real browser event. It works the same way across browsers.

## ✅ Quick check

### 1. A `<span>` icon sits inside a `<button>`. The user clicks the icon. What is `event.target`?

:::answer
**The `<span>`.** `target` is the exact element clicked. Use `event.target.closest('button')` to get the button.
:::

### 2. In what order do these logs print when you click the button?

```html
<div id="outer">                     <!-- the parent -->
  <button id="inner">Click</button>  <!-- the child -->
</div>
<script>
  outer.addEventListener('click', () => console.log('outer'));  // parent listener (bubbling)
  inner.addEventListener('click', () => console.log('inner'));  // child listener
</script>
```

:::answer
**`inner`, then `outer`.** The event fires on the button first. Then it bubbles up to the div.
:::

### 3. Which method stops a form from reloading the page on submit?

- A) `event.stopPropagation()`
- B) `event.preventDefault()`

:::answer
**B.** `preventDefault()` stops the browser's default action. `stopPropagation()` only stops the event travelling to other elements.
:::
