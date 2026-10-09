---
title: Controlled vs uncontrolled components
stack: react
order: 9
level: Basic
mustKnow: true
askedFrequency: very common
summary:
  - "Controlled input: React state holds the value. You pass value and onChange, so state is the single source of truth."
  - "Uncontrolled input: the browser (DOM) holds the value. You read it when needed, with a ref or FormData."
  - Controlled is best for instant validation, formatting, and inputs that depend on each other.
  - Uncontrolled is simpler and re-renders less, which suits big forms. React Hook Form uses it.
  - "Don't switch between them: value={undefined} first and a string later causes a warning. Start with value={''}."
cards:
  - q: What is a controlled component?
    a: An input whose value comes from React state (value={name}) and changes only through onChange calling the setter. React is the single source of truth.
  - q: What is an uncontrolled component?
    a: An input that keeps its own value in the DOM. You set a starting value with defaultValue and read the value later with a ref or FormData.
  - q: When would you choose uncontrolled inputs?
    a: For simple or large forms where you only need values on submit. They re-render less. File inputs are always uncontrolled.
  - q: What causes the "changing an uncontrolled input to be controlled" warning?
    a: The value starts as undefined (uncontrolled) and later becomes a string (controlled). Start with an empty string instead.
  - q: How does React 19 change form handling?
    a: A form can take an action function that receives FormData on submit, so simple forms can stay uncontrolled without onChange handlers.
---

## 💡 What is it?

There are two ways to manage a form input in React.

- **Controlled:** React [state](glossary:state) holds the value. You pass `value` and `onChange`. Every keystroke updates state.
- **Uncontrolled:** the browser's [DOM](glossary:dom) holds the value. You read it only when you need it, for example on submit.

## 🏠 Real-life example

Think of **writing an exam answer**.

- **Controlled:** a teacher stands next to you and checks **every word as you write**. They can stop a spelling mistake at once. But it's a lot of work for the teacher.
- **Uncontrolled:** you write freely, and the teacher **reads the paper only when you submit**. Less work, but mistakes are found later.

Mapping:
- The **teacher** = React state.
- **Checking every word** = `onChange` updating state on each keystroke.
- **Reading at the end** = reading the value with a ref or `FormData` on submit.

## 🧑‍💻 Code example

Paste this into `src/App.jsx` of a Vite React app. Run `npm run dev`.

```jsx
import { useState, useRef } from 'react';                              // bring in two hooks

function ControlledEmail() {                                           // React state holds the value
  const [email, setEmail] = useState('');                              // start with '' (not undefined)
  const isValid = email.includes('@');                                 // check on every keystroke
  return (                                                             // what this form shows
    <div>                                                              {/* a box */}
      <input value={email} onChange={(e) => setEmail(e.target.value.trim())} /> {/* value + onChange = controlled */}
      <p>{isValid ? '✅ looks fine' : '❌ needs an @'}</p>             {/* instant feedback */}
    </div>                                                             // end of the box
  );                                                                   // end of the return
}                                                                      // end of ControlledEmail

function UncontrolledName() {                                          // the DOM holds the value
  const inputRef = useRef(null);                                       // a ref to reach the real input
  function handleSubmit(e) {                                           // runs on submit
    e.preventDefault();                                                // stop the page reload
    alert('Name: ' + inputRef.current.value);                          // read the value only now
  }                                                                    // end of handleSubmit
  return (                                                             // what this form shows
    <form onSubmit={handleSubmit}>                                     {/* a form */}
      <input ref={inputRef} defaultValue="Hari" />                     {/* defaultValue = starting text only */}
      <button type="submit">Save</button>                              {/* submits the form */}
    </form>                                                            // end of the form
  );                                                                   // end of the return
}                                                                      // end of UncontrolledName

export default function App() {                                        // the main component
  return (                                                             // show both examples
    <main>                                                             {/* a box around both */}
      <ControlledEmail />                                              {/* the controlled example */}
      <UncontrolledName />                                             {/* the uncontrolled example */}
    </main>                                                            // end of the box
  );                                                                   // end of what App returns
}                                                                      // end of App
```

**What you see:**

```text
[ hari          ]  ❌ needs an @     ← the message changes as you type
[ hari@x.com    ]  ✅ looks fine

[ Hari          ] [Save]            ← click Save → alert "Name: Hari"
```

## 🔍 Deeper version

| | Controlled | Uncontrolled |
|---|---|---|
| Who holds the value | React state | The DOM |
| How you set it | `value={x}` + `onChange` | `defaultValue={x}` |
| How you read it | From state, any time | Ref or `FormData`, when needed |
| Re-renders | On every keystroke | Only when you choose |
| Best for | Live validation, formatting, dependent fields | Simple or large forms, file inputs |

**Controlled = single source of truth.** Because state holds the value, you can do things on every keystroke: trim spaces, force uppercase, block letters in a phone field, or enable the Save button only when valid.

**Uncontrolled = less work for React.** The browser keeps the text. React doesn't re-render on each key. Libraries like **React Hook Form** use uncontrolled inputs with refs, which is why big forms stay fast. See [forms and validation](topic:react/forms-validation) and [a 20-field form is slow](topic:debugging/slow-big-form).

**File inputs are always uncontrolled.** You can't set a file input's value from JavaScript for security reasons. You read `e.target.files`.

**The switch warning.** `value={user.name}` where `user.name` is `undefined` at first makes the input uncontrolled. When the data loads, it becomes controlled, and React warns. Fix: `value={user.name ?? ''}`.

**`value` without `onChange`.** The input becomes **read-only**: typing does nothing. Add `onChange`, use `defaultValue`, or add `readOnly` on purpose.

**React 19 form actions.** A form can take a function as its `action`. React calls it with the form's data on submit:

```jsx
function SaveForm() {                                         // a simple uncontrolled form
  async function save(formData) {                             // React passes a FormData object
    const name = formData.get('name');                        // read a field by its name attribute
    await fetch('/api/candidates', { method: 'POST', body: JSON.stringify({ name }) }); // send it
  }                                                           // end of save
  return (                                                    // the form
    <form action={save}>                                      {/* no onSubmit or preventDefault needed */}
      <input name="name" />                                   {/* uncontrolled: no value, no onChange */}
      <button type="submit">Save</button>                     {/* submit */}
    </form>                                                   // end of the form
  );                                                          // end of the return
}                                                             // end of SaveForm
```

:::version[Version note]
Form `action` functions, `useActionState` and `useFormStatus` arrived in **React 19** (Dec 2024). Before that, you always wrote `onSubmit` + `e.preventDefault()`.
:::

## 🎯 Why do we use it?

Forms are everywhere: login, job descriptions, candidate profiles. Choosing the right style matters:
- **Controlled** when the UI must react to every keystroke.
- **Uncontrolled** when you only need the values at the end, and you want fewer re-renders.

## ⚠️ Common mistakes

- **Starting with `undefined`** and later passing a string. Use `''` as the starting value.
- **Setting `value` without `onChange`.** The user can't type.
- **Using both `value` and `defaultValue`** on one input. Pick one style.
- **Controlling 30 fields with 30 `useState` calls** in one big component. Every key re-renders the whole form. Use React Hook Form or split the form.

## 🗣️ How to answer in an interview

> "A controlled input gets its value from React state and updates it through onChange, so state is the single source of truth. I use that when I need instant validation, formatting, or fields that depend on each other.
>
> An uncontrolled input keeps its value in the DOM. I give it a defaultValue and read it with a ref or FormData when needed, usually on submit. It re-renders less, which is why libraries like React Hook Form use it for big forms. File inputs are always uncontrolled.
>
> One common bug is starting a controlled input with undefined, which makes React warn when it switches to controlled. I start with an empty string. In React 19, form actions also make simple uncontrolled forms very easy, because the action receives FormData directly."

[FILL IN: which approach the SkillKeepr forms you worked on used, if you know.]

## 🔁 Follow-up questions

### Which is better, controlled or uncontrolled?

Neither is always better. Controlled gives instant control over every keystroke. Uncontrolled is simpler and faster for big forms. Many apps use a form library that mixes both.

### Why can't a file input be controlled?

Browsers don't let JavaScript set a file input's value, for security. You can only read the chosen files from `e.target.files`.

### How do you reset an uncontrolled form?

Call `formRef.current.reset()`, or change the form's `key` to mount a fresh one. React 19 form actions reset the form automatically after a successful action.

### Why does my input not let me type?

You set `value` but no `onChange`, so React keeps forcing the same value. Add an `onChange` that updates state.

## ✅ Quick check

### 1. Controlled or uncontrolled?

```jsx
<input defaultValue="Asha" ref={nameRef} />      // starting value + a ref
```

:::answer
**Uncontrolled.** The DOM holds the value. `defaultValue` only sets the starting text.
:::

### 2. Why does React warn here when the data loads?

```jsx
<input value={user.email} onChange={onChange} /> // user.email is undefined at first
```

:::answer
The input starts uncontrolled (`value` is `undefined`) and becomes controlled when `email` arrives. Use `value={user.email ?? ''}`.
:::

### 3. You must block letters in a phone-number field as the user types. Which style?

:::answer
**Controlled.** You need to check and change the value on every keystroke in `onChange`.
:::
