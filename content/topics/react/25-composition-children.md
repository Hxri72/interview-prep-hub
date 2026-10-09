---
title: Composition and children (avoiding prop drilling)
stack: react
order: 25
level: Intermediate
mustKnow: false
askedFrequency: common
summary:
  - Composition means building components by putting other components inside them, instead of copying code or using inheritance.
  - "The children prop is whatever you put between a component's tags: <Card>…here…</Card>."
  - "Passing a ready-made element (like <Avatar user={user} />) down as children skips the middle components, so they don't need the data."
  - "You can also use named slots: props like header={…} and footer={…}."
  - Try composition first for prop drilling. Use Context or Redux when many far-away components need the same data.
cards:
  - q: What is the children prop?
    a: Whatever you put between a component's opening and closing tags. The component decides where to render it with {children}.
  - q: How does composition help with prop drilling?
    a: The top component builds the element that needs the data and passes it down as children. The middle components just render children, so they never receive the data prop.
  - q: Why does React prefer composition over inheritance?
    a: Components share behaviour by containing other components and taking props. It's simpler and more flexible than class hierarchies, and the React docs recommend it.
  - q: What is a "slot" in React?
    a: A prop that takes JSX, like header={<Title />} or footer={<Buttons />}. It lets one layout component show different content in different places.
  - q: When is composition not enough, so you need Context?
    a: When many components deep in different branches need the same changing data, like the logged-in user or theme. Then Context or a store is cleaner.
---

## 💡 What is it?

**Composition** means building bigger [components](glossary:component) by putting smaller ones **inside** them.

The key tool is the **`children`** prop. It holds whatever you write between a component's tags:

```text
<Card>  ← everything here becomes Card's children  </Card>
```

Composition is also the simplest fix for **prop drilling**. Prop drilling is passing a [prop](glossary:props) through many layers that don't use it, just to reach a deep child.

## 🏠 Real-life example

Think of a **gift box**.

The shop sells an empty decorated box. It doesn't care what you put inside: a watch, a book or chocolates. It just wraps whatever you give it.

- **The decorated box** = a component like `<Card>`.
- **What you put inside** = `children`.
- **A box with a separate lid label and a ribbon tag** = named slots (`header`, `footer`).

Prop drilling is like **passing a letter through five classmates** to reach the last bench. Each one must hold it. Composition is like **putting the letter directly inside the box you hand to the last student**. The classmates in between just pass the closed box. They never touch the letter.

## 🧑‍💻 Code example

Make a Vite React app. Paste this into `src/App.jsx`, then run `npm run dev`.

```jsx
function Card({ title, footer, children }) {                       // a reusable box with two slots + children
  return (                                                         // what the card shows
    <section style={{ border: '1px solid #ccc', padding: 12, margin: 8 }}> {/* simple border and spacing */}
      <h3>{title}</h3>                                             {/* the "title" slot */}
      <div>{children}</div>                                        {/* whatever was put between <Card> tags */}
      {footer && <footer>{footer}</footer>}                        {/* the "footer" slot, only if given */}
    </section>                                                     // end of section
  );                                                               // end of return
}                                                                  // end of Card

function Page({ children }) {                                      // middle layer: doesn't know about the user
  return <main>{children}</main>;                                  // just renders its children
}                                                                  // end of Page

function Sidebar({ children }) {                                   // another middle layer
  return <aside>{children}</aside>;                                // also just renders children
}                                                                  // end of Sidebar

function Avatar({ user }) {                                        // the deep component that needs the data
  return <p>👤 {user.name} ({user.role})</p>;                      // show the user's name and role
}                                                                  // end of Avatar

export default function App() {                                    // the top component owns the data
  const user = { name: 'Hari', role: 'Recruiter' };                // the data the deep component needs
  return (                                                         // compose the screen
    <Page>                                                         {/* Page does NOT get a user prop */}
      <Sidebar>                                                    {/* Sidebar does NOT get a user prop */}
        <Avatar user={user} />                                     {/* the data goes straight to where it's used */}
      </Sidebar>                                                   {/* end of Sidebar */}
      <Card title="Candidate" footer={<button>Shortlist</button>}> {/* fill both slots */}
        <p>Asha — 3 years, Node.js</p>                             {/* this paragraph becomes children */}
      </Card>                                                      {/* end of Card */}
    </Page>                                                        // end of Page
  );                                                               // end of return
}                                                                  // end of App
```

**What you see:**

```text
👤 Hari (Recruiter)
┌───────────────────────────┐
│ Candidate                 │
│ Asha — 3 years, Node.js   │
│ [Shortlist]               │
└───────────────────────────┘
```

`Page` and `Sidebar` never received `user`. Only `Avatar` did.

## 🔍 Deeper version

**What `children` really is.** JSX like `<Card>…</Card>` compiles to a function call. Everything inside becomes `props.children`. It can be text, one element, many elements or even a function. React treats it like any other [prop](glossary:props).

**Composition vs prop drilling.** Without composition, you might write `<Page user={user}>` → `<Sidebar user={user}>` → `<Avatar user={user}>`. `Page` and `Sidebar` only forward the prop. When the shape of `user` changes, you edit all three. With composition, the top component creates `<Avatar user={user} />` itself and passes the **finished element** down. The middle layers are simpler and reusable. See [prop drilling through 5 levels](topic:debugging/prop-drilling).

**Slots.** A component can accept JSX in any prop, not just `children`. For example `header`, `footer`, `actions`, `emptyState`. This is how libraries build flexible layouts like `Modal`, `Card` and `Table`.

**Render props.** A prop can also be a **function** that returns JSX, like `renderItem={(item) => <Row item={item} />}`. The component calls it with its own data. Hooks replaced many render-prop uses, but list components still use it.

**A small performance bonus.** If a parent re-renders because its own state changed, `children` passed from **above** keep the same element identity. React can then skip some work for them. Moving state down and passing the rest as `children` is a known way to cut re-renders. See [what causes a re-render](topic:react/what-causes-a-re-render).

**When to use Context instead.** Composition works when the data owner can build the element. If many components in different branches need the same changing value (theme, logged-in user, language), use [Context](topic:redux-context/context-api) or a store.

## 🎯 Why do we use it?

- **Reuse.** One `Card` or `Modal` works for any content.
- **Simpler middle components.** They don't need to know about data they don't use.
- **Less prop drilling** without adding Context or a global store.
- **Flexible layouts.** Slots let one layout show different content in different places.

## ⚠️ Common mistakes

- **Jumping to Context or Redux too early.** Often, passing children solves prop drilling more simply.
- **Forgetting to render `{children}`.** The content you passed silently disappears.
- **Building huge "do everything" components with many boolean props** (`showHeader`, `showFooter`, `isCompact`…). Slots are usually cleaner.
- **Using class inheritance to share UI.** React recommends composition instead.

## 🗣️ How to answer in an interview

> "Composition means building components by nesting other components, mainly through the children prop and named slots like header and footer. A Card or Modal component doesn't care what's inside; it just renders children where it should.
>
> It's also my first fix for prop drilling. Instead of passing a user prop through Page and Sidebar just to reach Avatar, the top component creates the Avatar element itself and passes it down as children. The middle components never see the data, so they stay simple and reusable.
>
> If many components in different parts of the tree need the same changing data, like the logged-in user or the theme, then I use Context or a store. React's docs recommend composition over inheritance, and I follow that."

[FILL IN: a reusable component you built with children or slots — for example a modal, card or table wrapper in the SkillKeepr UI.]

## 🔁 Follow-up questions

### What is the difference between children and a render prop?

`children` is ready-made JSX. A render prop is a function the component calls with its own data, like `renderRow={(row) => <Row row={row} />}`. Use a render prop when the child needs data that only the parent component has.

### Can a component change its children before rendering them?

Yes, with `React.Children` and `cloneElement`. But this is fragile and rarely needed today. Prefer passing props or using Context.

### Does composition help performance?

Sometimes. Elements passed as `children` from a parent that didn't re-render keep the same identity. So when a wrapper's own state changes, those children can be skipped.

### Composition or Context — how do you decide?

If one owner can build the element that needs the data, use composition. If many far-away components need the same changing value, use Context or a store.

## ✅ Quick check

### 1. What does this component render?

```jsx
function Box({ children }) {      // a box component
  return <div>Box</div>;          // forgets to render children
}
// usage: <Box><p>Hello</p></Box>
```

:::answer
Only **"Box"**. The `<p>Hello</p>` is passed as `children`, but the component never renders `{children}`, so it doesn't appear.
:::

### 2. Which fixes prop drilling without Context?

- A) Passing the finished element down as `children`
- B) Adding more props to each middle component
- C) Using `useMemo`

:::answer
**A.** The top component builds the element and passes it down, so middle components don't need the data.
:::

### 3. True or false: React recommends class inheritance to share UI between components.

:::answer
**False.** React recommends composition: nesting components and passing props or children.
:::
