---
title: JSX
stack: react
order: 2
level: Basic
mustKnow: false
askedFrequency: common
summary:
  - JSX lets you write HTML-like code inside JavaScript. A build tool turns it into normal JavaScript function calls.
  - "Use {curly braces} to put any JavaScript expression inside JSX, like {name} or {price * 2}."
  - "A few names are different from HTML: className instead of class, htmlFor instead of for, and camelCase events like onClick."
  - A component must return one parent element. Use a Fragment (<>...</>) to group items without an extra div.
  - JSX escapes text automatically, which protects you from most XSS attacks.
cards:
  - q: What is JSX?
    a: A syntax that lets you write HTML-like tags inside JavaScript. A tool like Vite (with Babel or SWC) turns it into plain JavaScript function calls before the browser runs it.
  - q: Why className instead of class in JSX?
    a: Because JSX is JavaScript, and class is a reserved word in JavaScript. So the attribute is called className.
  - q: Can you put an if statement inside JSX curly braces?
    a: "No. Curly braces take expressions, not statements. Use a ternary (a ? b : c), &&, or put the if before the return."
  - q: What is a Fragment?
    a: "A wrapper (<>...</>) that groups several elements without adding an extra element to the page."
  - q: Is JSX safe from XSS?
    a: Mostly yes. React escapes any text you put in {curly braces}. The danger is dangerouslySetInnerHTML, which inserts raw HTML.
---

## 💡 What is it?

**JSX** lets you write **HTML-like tags inside JavaScript**. For example: `const title = <h1>Hello</h1>;`.

Browsers don't understand JSX. A build tool (like Vite) turns it into normal JavaScript before the page runs. This step is done by a [compiler](glossary:compiler).

Inside JSX, **curly braces `{}`** let you add any JavaScript value, like a name or a total.

## 🏠 Real-life example

Think of a **birthday card with blanks**.

The card already has the design printed: "Happy birthday, ____! You are ____ years old." You only write the name and the age in the blanks.

- The **printed card** = the JSX tags (the fixed layout).
- The **blanks** = the curly braces `{}`.
- **What you write in the blanks** = JavaScript values like `{name}` and `{age}`.
- **The printing press** = the build tool that turns JSX into real JavaScript.

## 🧑‍💻 Code example

Paste this into `src/App.jsx` of a Vite React app. Run `npm run dev`.

```jsx
export default function App() {                         // a component is a function that returns JSX
  const name = 'Hari';                                  // a normal JavaScript string
  const skills = ['Node', 'React', 'MongoDB'];          // a normal JavaScript array
  const isAvailable = true;                             // a true/false value
  return (                                              // the JSX starts here
    <>                                                  {/* a Fragment: groups items with no extra div */}
      <h1 className="title">Hi, {name}</h1>             {/* className (not class); {name} inserts the string */}
      <p>Skills: {skills.length}</p>                    {/* any expression works inside {} — here 3 */}
      <p>Status: {isAvailable ? 'Open to work' : 'Busy'}</p> {/* a ternary picks one text */}
      <label htmlFor="email">Email</label>              {/* htmlFor (not for) links the label to the input */}
      <input id="email" type="email" />                 {/* tags with no children must self-close: /> */}
      <p>{'<b>not bold</b>'}</p>                        {/* text is escaped, so tags show as plain text */}
    </>                                                 // end of the Fragment
  );                                                    // end of the JSX
}                                                       // end of App
```

**What you see:**

```text
Hi, Hari            (big heading)
Skills: 3
Status: Open to work
Email [__________]
<b>not bold</b>     ← shown as text, not as bold HTML
```

## 🔍 Deeper version

**What JSX becomes.** With the modern "automatic runtime", this:

```jsx
const el = <h1 className="title">Hi, {name}</h1>;      // JSX you write
```

becomes roughly this:

```js
import { jsx as _jsx } from 'react/jsx-runtime';       // added by the build tool for you
const el = _jsx('h1', { className: 'title', children: ['Hi, ', name] }); // a plain function call
```

The result is a small JavaScript **object** that describes the element. React reads these objects to build the page.

**Rules to remember:**

| HTML | JSX | Why |
|---|---|---|
| `class` | `className` | `class` is a JavaScript keyword |
| `for` | `htmlFor` | `for` is a JavaScript keyword |
| `onclick` | `onClick` | events use camelCase |
| `style="color: red"` | `style={{ color: 'red' }}` | style takes an object |
| `<br>` | `<br />` | every tag must be closed |
| `<!-- comment -->` | `{/* comment */}` | comments are JavaScript comments |

**Expressions, not statements.** Inside `{}` you can use values, function calls, ternaries and `.map()`. You cannot use `if`, `for` or `const` there. Put those above the `return`.

**One parent element.** A component returns one thing. If you need several siblings, wrap them in a Fragment `<>...</>`. If you need a `key` on the group, write `<Fragment key={id}>`.

**Safety.** React escapes text in `{}`. So `{userInput}` with `<script>` inside just shows the text. That blocks most [XSS](glossary:xss) attacks. The escape hatch `dangerouslySetInnerHTML` skips this protection. Only use it with HTML you have cleaned (for example with DOMPurify).

**What renders.** Strings and numbers show. `null`, `undefined`, `true` and `false` show nothing. That's why `{isLoggedIn && <Menu />}` works. (Careful with `0`; see [conditional rendering](topic:react/conditional-rendering).)

:::version[Version note]
Before React 17, every file with JSX needed `import React from 'react'`. Since React 17's new JSX transform, you don't need that import just for JSX.
:::

## 🎯 Why do we use it?

- **Layout and logic together.** You see the markup and the data it uses in one place.
- **Easy to read.** JSX looks like HTML, so it is easier to read than nested function calls.
- **Safer by default.** Automatic escaping protects you from most XSS.
- **Better tooling.** Editors and TypeScript can check your tags and props.

## ⚠️ Common mistakes

- **Writing `class` instead of `className`.** React warns, and your CSS may not apply.
- **Returning two elements side by side** without a parent. Wrap them in a Fragment.
- **Using `if` inside `{}`.** Use a ternary, `&&`, or move the `if` above `return`.
- **Forgetting the double braces for style.** It's `style={{ color: 'red' }}` — one pair for JSX, one for the object.

## 🗣️ How to answer in an interview

> "JSX is a syntax extension that lets me write HTML-like markup inside JavaScript. It isn't understood by the browser directly. The build tool compiles it into calls like `jsx('h1', props)`, which create plain objects describing the UI, and React uses those to render.
>
> Inside JSX I use curly braces for any JavaScript expression, like a value, a function call, a ternary or a `.map()`. A few attributes differ from HTML: `className`, `htmlFor`, camelCase events, and `style` takes an object. A component returns one root, so I use Fragments to avoid extra wrapper divs.
>
> JSX also escapes text automatically, which protects against most XSS. The only thing I'm careful with is `dangerouslySetInnerHTML`, which I'd only use with sanitised HTML."

## 🔁 Follow-up questions

### Do you need JSX to use React?

No. You can call `React.createElement('h1', null, 'Hi')` yourself. JSX is just easier to read, so almost everyone uses it.

### Why does a component need one root element?

A function can only return one value. JSX turns into one function call, so you need one parent. A Fragment gives you a parent without adding a real element to the page.

### How do you add comments inside JSX?

Use a JavaScript comment inside curly braces: `{/* my comment */}`. HTML comments `<!-- -->` don't work in JSX.

### What is `dangerouslySetInnerHTML`?

A prop that inserts a raw HTML string into an element. It skips React's escaping, so it can open an XSS hole. Only use it with trusted or sanitised HTML.

## ✅ Quick check

### 1. What is wrong here?

```jsx
return <h1>Hi</h1><p>Welcome</p>;                 // two elements side by side
```

:::answer
It returns two elements with no parent. Wrap them: `return <><h1>Hi</h1><p>Welcome</p></>;`
:::

### 2. What shows on screen?

```jsx
const price = 50;                                  // a number
return <p>Total: {price * 2}</p>;                  // an expression inside {}
```

- A) `Total: {price * 2}`
- B) `Total: 100`
- C) `Total: price * 2`

:::answer
**B) `Total: 100`.** The expression inside `{}` is run, and its result is shown.
:::

### 3. Which attribute is correct in JSX for a CSS class?

:::answer
**`className`.** `class` is a reserved word in JavaScript.
:::
