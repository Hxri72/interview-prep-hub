---
title: Lifting state up
stack: react
order: 10
level: Basic
mustKnow: false
askedFrequency: common
summary:
  - Lifting state up means moving shared state to the closest common parent of the components that need it.
  - The parent owns the state. It passes the value down as props, and passes a function down to change it.
  - Do it when two sibling components must show or change the same data.
  - Keep state as low as possible. Lift it only as high as it needs to go.
  - If you lift state through many levels, consider composition, Context or Redux instead.
cards:
  - q: What does "lifting state up" mean?
    a: Moving state from a child into the closest common parent, so several children can share it through props.
  - q: When do you lift state up?
    a: When two or more sibling components need the same data, or one needs to change what another shows.
  - q: How does a child change state that lives in the parent?
    a: The parent passes a function (like onChange) as a prop. The child calls it. The parent updates its state and re-renders.
  - q: What is the downside of lifting state too high?
    a: More components re-render when it changes, and you may end up passing props through many levels (prop drilling).
  - q: What is the "single source of truth" idea?
    a: Each piece of data lives in exactly one place. Other components read it from there instead of keeping their own copy.
---

## 💡 What is it?

Sometimes two [components](glossary:component) need the **same data**. For example, a search box and a list that shows the search results.

**Lifting state up** means moving that [state](glossary:state) out of the children and into their **common parent**.

The parent keeps the value. It gives the value to the children as [props](glossary:props). It also gives them a function to change it.

## 🏠 Real-life example

Think of **two brothers sharing one TV remote**.

If each brother has his own remote, they fight. One changes the channel. The other changes it back. Nobody knows the "real" channel.

So **the mother keeps the one remote**. A brother asks her, "Please change to channel 5." She changes it. Both brothers watch the same channel.

- The **brothers** = the two child components.
- The **remote** = the state (the current value).
- The **mother** = the common parent component that owns the state.
- **Asking the mother** = the child calling a function prop, like `onChange`.
- **Both watching the same channel** = both children showing the same data.

## 🧑‍💻 Code example

Paste this into `src/App.jsx` of a Vite React app (`npm create vite@latest`, pick React). Run `npm run dev`.

```jsx
import { useState } from 'react';                                        // bring in the useState hook

function SearchBox({ text, onTextChange }) {                             // child 1: gets the text and a function from the parent
  return (                                                               // what SearchBox draws
    <input                                                               // a text box
      value={text}                                                       // its value comes from the parent's state
      onChange={(e) => onTextChange(e.target.value)}                     // on typing, ask the parent to change the state
      placeholder="Search candidates"                                    // grey hint text
    />                                                                   // end of the input
  );                                                                     // end of what SearchBox returns
}                                                                        // end of SearchBox

function ResultList({ text, names }) {                                   // child 2: gets the same text, plus all names
  const shown = names.filter((n) => n.toLowerCase().includes(text.toLowerCase())); // keep names that contain the text
  return <ul>{shown.map((n) => <li key={n}>{n}</li>)}</ul>;              // draw one list item per matching name
}                                                                        // end of ResultList

export default function App() {                                          // the PARENT — the state lives here
  const [text, setText] = useState('');                                 // the shared state; '' = empty search at the start
  const names = ['Anu', 'Arjun', 'Hari', 'Meera'];                       // sample data
  return (                                                               // what App draws
    <main>                                                               {/* a wrapper */}
      <SearchBox text={text} onTextChange={setText} />                   {/* give child 1 the value AND the setter */}
      <ResultList text={text} names={names} />                           {/* give child 2 the same value */}
    </main>                                                              // end of the wrapper
  );                                                                     // end of what App returns
}                                                                        // end of App
```

**What you see:**

```text
Type "ar" → the list shows only: Arjun
Clear the box → the list shows all 4 names again
```

`SearchBox` and `ResultList` never talk to each other. They both talk to `App`.

## 🔍 Deeper version

**One source of truth.** Each piece of data should live in **one place**. If two components keep their own copy, the copies drift apart. Lifting state fixes that.

**Data flows down, events flow up.** React uses **one-way data flow**:
- The value goes **down** from parent to child as a prop.
- A change request goes **up** when the child calls a function prop.

This makes bugs easier to find. You always know who owns the data.

**Controlled children.** In the example, `SearchBox` is a "controlled" component. Its value comes from props, not from its own state. See [controlled vs uncontrolled](topic:react/controlled-uncontrolled).

**How high should you lift?** Lift to the **closest common parent**, and no higher.

| Lift too low | Lift too high |
|---|---|
| Siblings can't share the data | Many components re-render on every change |
| Copies go out of sync | Props pass through components that don't use them |

**When lifting is not enough.** If the shared state must travel through 4–5 levels, you get **prop drilling**. Options:
- **Composition:** pass components as `children`. See [composition and children](topic:react/composition-children).
- **Context:** for data many components read, like the logged-in user. See [Context API](topic:redux-context/context-api).
- **Redux:** for big, often-changing shared state. See [how to choose](topic:redux-context/how-to-choose).

**Derived values.** Don't put "filtered names" in state too. Work it out during render from `text` and `names`, like `ResultList` does. Storing it would create a second copy that can go stale.

## 🎯 Why do we use it?

- **To keep sibling components in sync.** A filter, a count and a list all show the same data.
- **To avoid duplicate state.** One copy means no "which value is right?" bugs.
- **To make data flow easy to follow.** The parent owns it. The children only show it or ask for changes.

## ⚠️ Common mistakes

- **Copying props into state** (`useState(props.text)`). The copy doesn't update when the prop changes. Use the prop directly.
- **Lifting state to the very top "just in case".** The whole app re-renders on every keystroke.
- **Storing derived data in state**, like a filtered list. Calculate it during render instead.
- **Passing the setter through 5 levels.** That's prop drilling. Use composition or Context.

## 🗣️ How to answer in an interview

> "Lifting state up means moving state into the closest common parent of the components that share it. The parent owns the value, passes it down as props, and passes a callback down so children can request changes. That gives one source of truth, so siblings like a search box and a result list always stay in sync.
>
> I lift only as high as needed, because state that lives too high makes more components re-render and leads to prop drilling. If data has to go through many levels, I'd use composition, Context for things like the current user, or Redux for big shared state. I also avoid putting derived data in state — I calculate it during render."

[FILL IN: a real example from the recruiter or candidate screens where two components shared the same state, if you have one.]

## 🔁 Follow-up questions

### What is one-way data flow?

Data moves down from parent to child as props. Children can't change props. To change data, a child calls a function the parent gave it. So changes always go up, and data always comes down.

### What is the difference between lifting state and using Context?

Lifting passes data through props, level by level. Context lets any component below a Provider read the data directly, without passing props through the middle. Lifting is simpler. Context helps when many distant components need the same data.

### Can a child change the parent's state directly?

No. A child can only call a function the parent passed down. The parent decides how to update its own state.

### What is prop drilling, and how do you avoid it?

Passing props through components that don't use them, just to reach a deep child. Avoid it with composition (`children`), Context, or a store like Redux.

## ✅ Quick check

### 1. Two sibling components need the same `selectedId`. Where should it live?

:::answer
In their **closest common parent**. The parent passes `selectedId` down as a prop, and passes a setter like `onSelect` down too.
:::

### 2. What's wrong with this child?

```jsx
function Child({ name }) {                  // gets name as a prop
  const [value] = useState(name);           // copies the prop into state
  return <p>{value}</p>;                    // shows the copy
}
```

:::answer
It copies the prop into state. If the parent changes `name` later, `value` stays the old one. Just use `name` directly.
:::
