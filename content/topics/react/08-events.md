---
title: Handling events
stack: react
order: 8
level: Basic
mustKnow: false
askedFrequency: common
summary:
  - "React events use camelCase names, like onClick and onChange, and you pass a function, not a string."
  - "Pass the function itself: onClick={handleClick}. Don't call it: onClick={handleClick()} runs it during render."
  - "To pass an argument, wrap it in an arrow function: onClick={() => remove(id)}."
  - React gives you a SyntheticEvent that works the same in every browser. Use e.preventDefault() to stop a form's page reload.
  - React attaches one listener at the root and uses event delegation behind the scenes.
cards:
  - q: How is React event handling different from HTML?
    a: "Events are camelCase (onClick), you pass a function instead of a string, and you call e.preventDefault() instead of returning false."
  - q: "What's wrong with onClick={handleClick()}?"
    a: It calls the function during render, not on click, and passes its return value as the handler. Pass the function itself, onClick={handleClick}.
  - q: How do you pass an id to a click handler?
    a: "Wrap it in an arrow function: onClick={() => remove(id)}."
  - q: What is a SyntheticEvent?
    a: React's wrapper around the browser's event. It has the same API (target, preventDefault, stopPropagation) and behaves the same in all browsers.
  - q: Where does React attach event listeners?
    a: Since React 17, on the root container of the app, not on each element. React uses event delegation to find the right handler.
---

## 💡 What is it?

**Event handling** means running code when the user does something: clicks, types, submits a form or presses a key.

In React you add a prop like **`onClick`** or **`onChange`** to an element. You give it a **function**. React calls that function when the [event](glossary:event) happens.

## 🏠 Real-life example

Think of a **doorbell**.

You fix a bell to the door. When someone presses the button, the bell rings. You don't ring the bell when you install it. You only connect it.

- **Installing the bell** = writing `onClick={handleClick}`.
- **Someone pressing the button** = the user clicking.
- **The bell ringing** = React calling your function.
- **Ringing the bell while installing it** = the bug `onClick={handleClick()}`, which runs during render.

## 🧑‍💻 Code example

Paste this into `src/App.jsx` of a Vite React app. Run `npm run dev`.

```jsx
import { useState } from 'react';                                    // bring in useState

export default function App() {                                      // the main component
  const [skills, setSkills] = useState(['React', 'Node']);           // a list of skills in state
  const [text, setText] = useState('');                              // what the user is typing

  function handleSubmit(e) {                                         // runs when the form is submitted
    e.preventDefault();                                              // stop the browser from reloading the page
    if (!text.trim()) return;                                        // ignore empty input
    setSkills([...skills, text.trim()]);                             // add the new skill (new array)
    setText('');                                                     // clear the input
  }                                                                  // end of handleSubmit

  function remove(skill) {                                           // removes one skill
    setSkills(skills.filter((s) => s !== skill));                    // keep every skill except this one
  }                                                                  // end of remove

  return (                                                           // what the screen shows
    <form onSubmit={handleSubmit}>                                   {/* pass the function, don't call it */}
      <input value={text} onChange={(e) => setText(e.target.value)} /> {/* e.target.value = what was typed */}
      <button type="submit">Add</button>                             {/* submits the form (also on Enter) */}
      <ul>                                                           {/* the skill list */}
        {skills.map((s) => (                                         // one row per skill
          <li key={s}>                                               {/* the skill name is unique here */}
            {s} <button type="button" onClick={() => remove(s)}>✕</button> {/* arrow passes the argument */}
          </li>                                                      // end of the row
        ))}                                                          {/* end of the map */}
      </ul>                                                          {/* end of the list */}
    </form>                                                          // end of the form
  );                                                                 // end of what App returns
}                                                                    // end of App
```

**What you see:**

```text
[__________] [Add]
• React ✕
• Node ✕

Type "MongoDB", press Enter → • MongoDB ✕ is added. The page does not reload.
Click ✕ next to Node → Node disappears.
```

## 🔍 Deeper version

**Pass a function, not a call.**

```jsx
<button onClick={handleClick}>OK</button>       // ✅ React calls it on click
<button onClick={handleClick()}>OK</button>     // ❌ runs during render; the result becomes the handler
<button onClick={() => remove(id)}>✕</button>  // ✅ an arrow function lets you pass an argument
```

The third style creates a new function on every render. That's fine almost always. It only matters when the child is memoised; see [useMemo and useCallback](topic:react/use-memo-use-callback).

**SyntheticEvent.** React wraps the browser event in a **SyntheticEvent**. It has the same methods: `e.target`, `e.currentTarget`, `e.preventDefault()`, `e.stopPropagation()`. It behaves the same in every browser. The real browser event is at `e.nativeEvent`.

**Delegation at the root.** React doesn't add a [listener](glossary:listener) to every button. Since React 17, it adds listeners to the **root container** of your app. When you click, the event bubbles up to the root, and React finds your handler. This is [event delegation](topic:javascript/events-delegation).

**`onChange` is different from HTML.** In plain HTML, `change` on a text input fires when you leave the box. In React, `onChange` fires on **every keystroke**, like the native `input` event.

**Bubbling.** React events bubble like browser events. A click on a button inside a clickable card triggers both handlers. Use `e.stopPropagation()` to stop it. Use `onClickCapture` to handle the capture phase.

**`type="button"` inside forms.** A `<button>` inside a `<form>` is `type="submit"` by default. A delete button without `type="button"` will also submit the form.

**Expensive events.** For fast events like typing in a search box or scrolling, use [debounce or throttle](topic:javascript/debounce-throttle).

:::version[Version note]
**React 17** moved event listeners from `document` to the root container and removed "event pooling". You no longer need `e.persist()` to read an event later. **React 19** lets a form take an `action` function, which receives the form data. See [controlled vs uncontrolled](topic:react/controlled-uncontrolled).
:::

## 🎯 Why do we use it?

Events make the page **interactive**. Clicking, typing, submitting and dragging all run code through event handlers. React's way keeps the handler next to the element it belongs to, and works the same in every browser.

## ⚠️ Common mistakes

- **Calling the handler** (`onClick={save()}`) instead of passing it.
- **Forgetting `e.preventDefault()`** on form submit, so the page reloads.
- **Buttons inside forms without `type="button"`**, which submit the form by accident.
- **Using lowercase names** like `onclick`. React needs `onClick`.

## 🗣️ How to answer in an interview

> "In React I attach handlers with camelCase props like onClick and onChange, and I pass a function, not a string. The most common bug is calling the function, like `onClick={save()}`, which runs during render. To pass an argument, I wrap it in an arrow function.
>
> React gives me a SyntheticEvent, a cross-browser wrapper with the usual methods like preventDefault and stopPropagation. For forms, I call preventDefault in the submit handler so the page doesn't reload. Under the hood, since React 17, React attaches listeners to the root container and uses event delegation, so it doesn't add a listener to every element.
>
> One difference from HTML: React's onChange fires on every keystroke. For heavy work like search, I debounce the handler."

## 🔁 Follow-up questions

### How do you stop a click on a child from triggering the parent's click?

Call `e.stopPropagation()` in the child's handler. The event then stops bubbling up.

### Why does the page reload when I submit a form?

That's the browser's default. Call `e.preventDefault()` in your submit handler, or use a React 19 form `action`.

### Is creating arrow functions in JSX bad for performance?

Usually no. It only matters if the child is wrapped in `React.memo` and compares props. Then use `useCallback` to keep the same function.

### What is `e.target` vs `e.currentTarget`?

`e.target` is the element that was actually clicked. `e.currentTarget` is the element the handler is attached to. They differ when you click a child inside it.

## ✅ Quick check

### 1. When does `sayHi` run?

```jsx
<button onClick={sayHi()}>Hi</button>     // note the ()
```

:::answer
During **render**, not on click. Remove the `()`: `onClick={sayHi}`.
:::

### 2. How do you call `deleteCandidate(id)` on click?

:::answer
Wrap it: `onClick={() => deleteCandidate(id)}`.
:::

### 3. A ✕ button inside a form keeps submitting the form. Why?

:::answer
Buttons inside a form are `type="submit"` by default. Add `type="button"` to the ✕ button.
:::
