---
title: Components and props
stack: react
order: 3
level: Basic
mustKnow: true
askedFrequency: very common
summary:
  - A component is a JavaScript function that returns JSX. Its name must start with a capital letter.
  - Props are the inputs a parent passes to a child, like attributes on an HTML tag.
  - Props are read-only. A child must never change its props; it asks the parent to change data instead.
  - The special children prop holds whatever you put between a component's opening and closing tags.
  - Small components with one job are easier to reuse, test and read.
cards:
  - q: What is a React component?
    a: A JavaScript function that returns JSX. Its name starts with a capital letter, and you use it like a tag, e.g. <CandidateCard />.
  - q: What are props?
    a: The inputs a parent passes to a child component, written like HTML attributes. The child receives them as one object.
  - q: Can a child component change its props?
    a: No. Props are read-only. To change data, the parent passes a function as a prop, and the child calls it.
  - q: What is props.children?
    a: Whatever you put between the opening and closing tags of a component, e.g. the text inside <Card>Hello</Card>.
  - q: Why must component names start with a capital letter?
    a: JSX treats lowercase tags as HTML elements (div, span). A capital letter tells React it's your component.
---

## 💡 What is it?

A **[component](glossary:component)** is a JavaScript function that returns JSX. It is one reusable piece of the screen, like a card or a button.

**[Props](glossary:props)** (short for "properties") are the **inputs** you give a component. A parent passes props to a child, the same way you set attributes on an HTML tag.

The child can **read** its props, but it must **never change** them.

## 🏠 Real-life example

Think of a **school ID card printer**.

The printer has one fixed design. You give it a name, a class and a photo, and it prints a card. Give it different details, and you get a different card from the same design.

- The **card design** = the component.
- The **details you give** (name, class, photo) = the props.
- **Printing many cards** = using the component many times with different props.
- The **printed card can't change its own name** = props are read-only.

## 🧑‍💻 Code example

Paste this into `src/App.jsx` of a Vite React app. Run `npm run dev`.

```jsx
function CandidateCard({ name, years, skills = [] }) {   // a component; we take props out by name
  return (                                              // what the card shows
    <div className="card">                              {/* one card box */}
      <h3>{name}</h3>                                   {/* the name prop */}
      <p>{years} years of experience</p>                {/* the years prop */}
      <p>Skills: {skills.join(', ')}</p>                {/* skills = [] means "empty list if not given" */}
    </div>                                              // end of the card box
  );                                                    // end of what the card returns
}                                                       // end of CandidateCard

function Panel({ title, children }) {                   // children = whatever is between <Panel> and </Panel>
  return (                                              // what the panel shows
    <section>                                           {/* the panel box */}
      <h2>{title}</h2>                                  {/* the panel heading */}
      {children}                                        {/* the content passed inside the tags */}
    </section>                                          // end of the panel box
  );                                                    // end of what the panel returns
}                                                       // end of Panel

export default function App() {                         // the main component
  return (                                              // what App shows
    <Panel title="Shortlisted">                         {/* title is a string prop */}
      <CandidateCard name="Asha" years={3} skills={['React', 'Node']} /> {/* numbers and arrays go in {} */}
      <CandidateCard name="Ravi" years={5} />           {/* no skills given, so the default [] is used */}
    </Panel>                                            // end of the panel
  );                                                    // end of what App returns
}                                                       // end of App
```

**What you see:**

```text
Shortlisted
  Asha — 3 years of experience — Skills: React, Node
  Ravi — 5 years of experience — Skills:
```

## 🔍 Deeper version

**Props are one object.** React calls your component like `CandidateCard({ name: 'Asha', years: 3, skills: [...] })`. Destructuring (`{ name, years }`) is just a short way to read that object. See [destructuring](topic:javascript/destructuring-spread-rest).

**Strings vs everything else.** Strings can use quotes: `name="Asha"`. Every other type needs curly braces: `years={3}`, `isActive={true}`, `skills={['React']}`, `onSelect={handleSelect}`.

**Read-only, one-way data.** Data flows **down** from parent to child. If a child needs to change something, the parent passes a **function** as a prop. The child calls it. This is how a child "talks up".

```jsx
function Child({ onSave }) {                            // the child gets a function as a prop
  return <button onClick={() => onSave('done')}>Save</button>; // and calls it to tell the parent
}                                                       // end of Child
```

**Default values.** Use default parameters: `{ skills = [] }`. (The old `Component.defaultProps` is removed for function components in React 19.)

**Spreading props.** `<CandidateCard {...candidate} />` passes every field of the object as a prop. It's handy, but it can hide what is passed, so use it with care.

**Composition with `children`.** Layout components like `Panel`, `Modal` or `Card` take `children`, so they can wrap anything. This is a clean way to avoid passing props through many layers. See [composition](topic:react/composition-children).

**Pure components.** A component should behave like a pure function: same props in, same JSX out. Don't change props or outside variables during render.

:::version[Version note]
Class components (`class Card extends React.Component`) still work, but new code uses function components and hooks. **React 19** removed `defaultProps` and `propTypes` checks for function components. Use default parameters and TypeScript instead.
:::

## 🎯 Why do we use it?

- **Reuse.** One `CandidateCard` design shows hundreds of candidates.
- **Clear data flow.** You can always see where data comes from: the parent.
- **Easier testing.** Give a component props, and check what it shows.
- **Teamwork.** Different people can build different components at the same time.

## ⚠️ Common mistakes

- **Changing a prop inside the child** (`props.name = 'x'`). Props are read-only. Ask the parent to change it.
- **Lowercase component names** (`<candidateCard />`). React thinks it's an HTML tag. Use a capital letter.
- **Passing a number as a string** (`years="3"`). That's the text "3". Use `years={3}`.
- **One giant component.** Split it when it does more than one job.

## 🗣️ How to answer in an interview

> "A component is a function that returns JSX, and it's the basic building block of a React app. Props are the inputs a parent passes to a child, like attributes on an HTML tag. React passes them as one object, which I usually destructure.
>
> Props are read-only, and data flows one way, from parent to child. If a child needs to change something, the parent passes a callback as a prop, and the child calls it. I also use the `children` prop to build layout components like panels and modals that can wrap any content.
>
> I try to keep components small, with one job each, and pure, so the same props always give the same output. That makes them easy to reuse and test."

## 🔁 Follow-up questions

### How does a child send data back to the parent?

The parent passes a function as a prop, like `onSelect`. The child calls `onSelect(id)`. The parent's function then updates the parent's state.

### What is the `children` prop?

Everything between a component's opening and closing tags. For `<Panel>Hello</Panel>`, `children` is `"Hello"`. It lets layout components wrap any content.

### How do you give a prop a default value?

Use a default parameter in the function: `function Card({ size = 'md' })`. In React 19, `defaultProps` no longer works on function components.

### What does "pure component" mean?

A component that returns the same JSX for the same props and state, and doesn't change anything outside itself while rendering. React depends on this to render safely.

## ✅ Quick check

### 1. What is wrong here?

```jsx
function Badge(props) {                     // a component
  props.label = props.label.toUpperCase();  // changes the prop
  return <span>{props.label}</span>;        // shows it
}
```

:::answer
It changes a prop. Props are read-only. Make a new variable instead: `const label = props.label.toUpperCase();`
:::

### 2. What does `children` contain here?

```jsx
<Card><p>Hi</p></Card>                       // Card wraps a paragraph
```

:::answer
The `<p>Hi</p>` element. `children` is whatever is between the opening and closing tags.
:::

### 3. Which passes the number 5 as a prop?

- A) `<Card count="5" />`
- B) `<Card count={5} />`

:::answer
**B.** Quotes give the string `"5"`. Curly braces give the number `5`.
:::
