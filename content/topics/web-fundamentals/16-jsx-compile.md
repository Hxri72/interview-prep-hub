---
title: How JSX becomes JavaScript
stack: web-fundamentals
order: 16
level: Basic
mustKnow: false
askedFrequency: common
summary:
  - "JSX is not JavaScript. Browsers can't run it. A tool (Babel, esbuild, SWC or Oxc) turns each tag into a function call."
  - "Classic transform: <h2>Hi</h2> becomes React.createElement('h2', null, 'Hi'). You had to import React in every file."
  - "Automatic runtime (React 17+): it becomes jsx('h2', { children: 'Hi' }), and the import from react/jsx-runtime is added for you."
  - "Props become an object. Children go into props.children. The key is passed separately, because it's for React, not your component."
  - "The result of a JSX tag is a plain JavaScript object (an element) with type, key and props — a description, not a real DOM node."
cards:
  - q: Can a browser run JSX directly?
    a: No. JSX is not valid JavaScript. A tool like Babel, esbuild, SWC or Oxc compiles each tag into a function call first.
  - q: What does <h2>Hi</h2> compile to with the automatic runtime?
    a: "jsx('h2', { children: 'Hi' }), with an import of jsx from react/jsx-runtime added automatically."
  - q: Why don't you need `import React` in every file any more?
    a: Since React 17, the automatic JSX runtime imports the jsx function itself. Old classic JSX used React.createElement, so React had to be in scope.
  - q: Why isn't key inside props?
    a: Key is for React's list matching, not for your component. The compiler passes it as a separate argument, so props.key is undefined.
  - q: What does a JSX expression produce?
    a: "A plain object (a React element) like { type: 'h2', key: null, props: { children: 'Hi' } }. React uses it to decide what to draw."
---

## 💡 What is it?

**JSX** is the HTML-like syntax you write in React, like `<h2>{name}</h2>`.

But JSX is **not JavaScript**. No browser and no Node version can run it.

So a build tool turns every JSX tag into a normal **function call**. The function returns a plain object that describes what to draw. See [JSX](topic:react/jsx) for how to write it.

## 🏠 Real-life example

Think of **ordering food by pointing at pictures** in a menu.

- **You (the developer)** point at pictures. That's easy and quick, like writing JSX tags.
- **The waiter (Babel / esbuild)** writes your order as text on a slip: "1 dosa, extra chutney". That's the function call.
- **The order slip** is just a description. It is not food yet. That's the element object.
- **The kitchen (React + the browser)** reads the slip and makes the real food. That's React creating real DOM nodes.

The kitchen never sees your pointing. It only reads the slip.

## 🧑‍💻 Code example

Make a folder, run `npm init -y`, then `npm install -D @babel/core @babel/preset-react esbuild`. Save this as `Card.jsx`:

```jsx
export function Card({ name, skills }) { // a component; name and skills come in as props
  return ( // what the component shows
    <div className="card" /* outer box with CSS class "card" */>
      <h2 /* the candidate's name goes inside */>{name}</h2>
      <ul /* one <li> per skill; key = the skill text */>{skills.map((s) => <li key={s}>{s}</li>)}</ul>
    </div> // end of the outer box
  ); // end of return
} // end of Card
```

The comments sit **inside** the tags on purpose. A `{/* … */}` comment between tags can leave extra space text in the output.

Save this as `compile.mjs`. It compiles the file both ways:

```js
import { transformSync } from '@babel/core'; // Babel's compile function
import fs from 'node:fs'; // Node's file module, to read the source file
const code = fs.readFileSync('Card.jsx', 'utf8'); // read the JSX source as text
for (const runtime of ['classic', 'automatic']) { // try both JSX transforms, one after the other
  const out = transformSync(code, { presets: [['@babel/preset-react', { runtime, development: false }]], comments: false, configFile: false, babelrc: false }); // compile; comments: false = drop comments
  console.log(`=== runtime: ${runtime}\n${out.code}\n`); // print the compiled JavaScript
} // end of loop
```

Run `node compile.mjs`. Real output:

```text
=== runtime: classic
export function Card({
  name,
  skills
}) {
  return (React.createElement("div", {
      className: "card"
    }, React.createElement("h2", null, name), React.createElement("ul", null, skills.map(s => React.createElement("li", {
      key: s
    }, s))))
  );
}

=== runtime: automatic
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export function Card({
  name,
  skills
}) {
  return (_jsxs("div", {
      className: "card",
      children: [_jsx("h2", {
        children: name
      }), _jsx("ul", {
        children: skills.map(s => _jsx("li", {
          children: s
        }, s))
      })]
    })
  );
}
```

**What to notice:**
- Every tag became **one function call**. Nested tags became nested calls.
- **Classic** uses `React.createElement`, but never imports `React`. So you had to write `import React from 'react'` yourself.
- **Automatic** adds `import { jsx, jsxs } from "react/jsx-runtime"` for you.
- In both, `key={s}` is **not** in the props object. It's passed separately.

## 🔍 Deeper version

**The two transforms side by side.**

| | Classic (before React 17) | Automatic (React 17+, today's default) |
|---|---|---|
| Function called | `React.createElement(type, props, ...children)` | `jsx(type, props, key)` / `jsxs(...)` |
| Children | extra arguments | inside `props.children` |
| Import | you write `import React` | added by the compiler from `react/jsx-runtime` |
| `jsxs` | — | used when there are several static children (an array), so React can skip some key warnings |

Vite's React plugin, Next.js and Create React App all use the automatic runtime.

**What the call returns: the element object.** "Element" means a small plain object that **describes** UI. Running `jsx('h2', { className: 'title', children: 'Hari' }, 'k1')` in Node (production mode) gives this real result:

```js
console.log(el.type, el.key, el.props); // h2 k1 { className: 'title', children: 'Hari' }
console.log(Object.keys(el));           // [ '$$typeof', 'type', 'key', 'ref', 'props' ]
```

- `type` is the tag name (`'h2'`) or, for a component, the function itself (`Card`).
- `$$typeof` is a special symbol. It marks real React elements, which helps block some injection attacks.
- React reads these objects, compares them with the last render ([reconciliation](glossary:reconciliation)), and only then touches the real DOM.

**Development vs production.** With `development: true`, Babel uses `jsxDEV` and adds the file name, line and column. That's how React shows "error in Card.jsx line 4". Production builds drop this to stay small.

**Who does the compiling?**

| Tool | Where |
|---|---|
| Babel (`@babel/preset-react`) | webpack setups (`babel-loader`), older projects |
| Oxc | Vite 8 (dev server and build) |
| esbuild | Vite 7 and older, many build scripts (`--jsx=automatic`) |
| SWC | Next.js, `@vitejs/plugin-react-swc` |

All of them produce the same kind of `jsx()` calls.

**`/* @__PURE__ */` comments.** esbuild marks each call as "pure", meaning it has no side effects. This tells the minifier it can delete elements that are never used.

## 🎯 Why do we use it?

- Writing `<Card name="Hari" />` is far easier to read than nested function calls.
- A compile step lets us use a nicer syntax **without** waiting for browsers to support it.
- Knowing the output explains real behaviour: why `key` isn't in props, why `class` is `className`, and why a component must return one root (one function call).

## ⚠️ Common mistakes

- **Reading `props.key` inside a component.** It's `undefined`. Pass the id again as another prop (`id={item.id}`) if you need it.
- **Putting `{/* comments */}` between tags carelessly.** It can create extra whitespace text children. Put comments inside the tag or on their own line.
- **Forgetting `import React` in a classic-runtime project.** You get "React is not defined". Modern setups don't need it.
- **Thinking JSX creates DOM elements.** It only creates plain objects. React decides later what DOM to create.

## 🗣️ How to answer in an interview

> "JSX isn't valid JavaScript, so a compiler like Babel, esbuild, SWC or Oxc turns each tag into a function call. With the old classic transform, `<h2>Hi</h2>` became `React.createElement('h2', null, 'Hi')`, so React had to be imported in every file. Since React 17 we use the automatic runtime: it becomes `jsx('h2', { children: 'Hi' })`, and the compiler adds the import from `react/jsx-runtime` itself.
>
> The call returns a plain object — a React element — with a type, a key and props. Children go into `props.children`, but the key is passed separately because it's only for React's list matching. React compares these element objects between renders and then updates the real DOM. In development the compiler also adds file and line info, which is how React points to the right line in errors."

[FILL IN: which tool compiled JSX in your SkillKeepr frontend — e.g. Babel through webpack. Only if you know.]

## 🔁 Follow-up questions

### Why must a component return a single root element?

Because the JSX becomes **one** expression: one `jsx()` call. You can't return two calls side by side. A Fragment (`<>…</>`) is one call that holds several children.

### What does `className` compile to?

It stays `className` in the props object. React later sets the DOM's `class` attribute from it. JSX uses `className` because `class` is a reserved word in JavaScript.

### Can you use React without JSX?

Yes. You can call `jsx()` or `React.createElement()` yourself. JSX is only nicer syntax for the same calls.

### Where does the file and line number in React errors come from?

From the development transform. `jsxDEV` adds `fileName`, `lineNumber` and `columnNumber` to each element. Production builds leave these out.

## ✅ Quick check

### 1. What does `<p className="tip">Hi</p>` compile to with the automatic runtime?

:::answer
`jsx("p", { className: "tip", children: "Hi" })`, plus an automatic `import { jsx } from "react/jsx-runtime"`.
:::

### 2. Inside a component used as `<Row key="7" id="7" />`, what is `props.key`?

- A) `"7"`
- B) `undefined`
- C) an error

:::answer
**B) `undefined`.** The compiler passes `key` separately to React. Use `props.id` instead.
:::

### 3. True or false: a JSX expression creates a real DOM node right away.

:::answer
**False.** It creates a plain JavaScript object (an element). React creates or updates DOM nodes later, after comparing elements.
:::
