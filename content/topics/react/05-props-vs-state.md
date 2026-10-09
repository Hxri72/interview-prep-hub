---
title: Props vs state
stack: react
order: 5
level: Basic
mustKnow: true
askedFrequency: very common
summary:
  - Props come from the parent and are read-only. State belongs to the component and can change.
  - Changing state (with its setter) re-renders the component. New props from a parent also cause a re-render.
  - One piece of data should live in one place. The owner keeps it in state and passes it down as props.
  - A child changes the parent's state by calling a function the parent passed as a prop.
  - Don't copy props into state unless you really want a starting value that then goes its own way.
cards:
  - q: What is the main difference between props and state?
    a: Props are inputs from the parent and are read-only. State is the component's own memory and can change with its setter.
  - q: Can a component change its own props?
    a: No. Only the parent can change what it passes. The child can ask by calling a callback prop.
  - q: Do both props and state cause a re-render?
    a: Yes. Calling a state setter re-renders the component. When the parent re-renders with new props, the child re-renders too.
  - q: How do you decide whether data should be props or state?
    a: If the component owns the data and it changes over time, it's state. If it comes from outside, it's props. Data you can calculate from others is neither — calculate it.
  - q: Why is copying props into state risky?
    a: The state only uses the prop's first value. If the parent later sends a new prop, the state copy stays old and the UI gets out of sync.
---

## 💡 What is it?

**[Props](glossary:props)** are data a parent **gives** to a child. The child can read them but not change them.

**[State](glossary:state)** is data a component **owns** and can change. Changing it re-renders the component.

Simple rule: **props come in from outside; state lives inside.**

## 🏠 Real-life example

Think of a **student in a classroom**.

- The **school uniform and timetable** are given by the school. The student can't change them. That's like **props**.
- The **student's own notebook** belongs to them. They can write, erase and rewrite. That's like **state**.
- If the student wants a different timetable, they **ask the teacher** (the parent). That's like calling a callback prop.
- When the school gives a **new timetable**, the student follows the new one. That's like a re-render with new props.

## 🧑‍💻 Code example

Paste this into `src/App.jsx` of a Vite React app. Run `npm run dev`.

```jsx
import { useState } from 'react';                         // bring in useState

function LikeButton({ label, onLiked }) {                 // props: label (read-only) and onLiked (a callback)
  const [likes, setLikes] = useState(0);                  // state: this button's own like count
  function handleClick() {                                // runs on click
    setLikes(likes + 1);                                  // change OWN state
    onLiked(label);                                       // tell the parent, using the callback prop
  }                                                       // end of handleClick
  return <button onClick={handleClick}>{label}: {likes} 👍</button>; // shows prop + state
}                                                         // end of LikeButton

export default function App() {                           // the parent
  const [lastLiked, setLastLiked] = useState('nothing');  // parent state: which button was clicked last
  return (                                                // what App shows
    <main>                                                {/* a box around everything */}
      <LikeButton label="React" onLiked={setLastLiked} /> {/* pass a string and a function as props */}
      <LikeButton label="Node" onLiked={setLastLiked} />  {/* same component, different props */}
      <p>Last liked: {lastLiked}</p>                      {/* parent state shown here */}
    </main>                                               // end of the box
  );                                                      // end of what App returns
}                                                         // end of App
```

**What you see:**

```text
[ React: 0 👍 ]  [ Node: 0 👍 ]
Last liked: nothing

Click "Node" twice → [ Node: 2 👍 ], Last liked: Node
```

Each button keeps its own `likes` (state). The `label` (prop) never changes inside the button.

## 🔍 Deeper version

| | Props | State |
|---|---|---|
| Who owns it | The parent | The component itself |
| Can the component change it? | No (read-only) | Yes, with its setter |
| How it changes | Parent re-renders with a new value | Calling `setX(newValue)` |
| Causes a re-render? | Yes, when the parent re-renders | Yes |
| Typical use | Settings and data passed down | Values that change from user actions or loaded data |

**Single source of truth.** Each piece of data should live in **one** component's state. That owner passes it down as props. If two components need the same data, move the state up to their common parent. See [lifting state up](topic:react/lifting-state).

**Derived data is neither.** If you can calculate a value from props or state (a filtered list, a total, a full name), calculate it during render. Storing it in state too creates two copies that can disagree.

**The "copy props into state" trap.**

```jsx
function NameEditor({ initialName }) {                    // prop from the parent
  const [name, setName] = useState(initialName);          // OK ONLY as a starting value
  // if the parent later sends a new initialName, name will NOT update
}                                                         // end of NameEditor
```

This is fine when the prop is truly just a starting value (name it `initialX`). If you need it to follow the parent, use the prop directly, or reset the component with a `key`.

**Re-render rules.** A component re-renders when its state changes, when its parent re-renders, or when a context it uses changes. Same props don't stop a re-render by themselves; that needs [`React.memo`](topic:react/react-memo). See [what causes a re-render](topic:react/what-causes-a-re-render).

## 🎯 Why do we use it?

Keeping props and state separate makes data flow **predictable**:
- You always know **who owns** a value.
- Bugs are easier to find, because a value can only change in one place.
- Components with only props are easy to reuse and test.

## ⚠️ Common mistakes

- **Changing props** inside a child. Use a callback to ask the parent.
- **Duplicating data** in two components' state. They get out of sync. Keep one owner.
- **Storing derived values in state.** Calculate them during render.
- **Copying a prop into state** and expecting it to follow later changes.

## 🗣️ How to answer in an interview

> "Props are inputs that a parent passes to a child, and they're read-only. State is a component's own memory, and it changes through the setter, which triggers a re-render. Both cause re-renders: state when the setter is called, props when the parent re-renders with new values.
>
> I keep one source of truth for each piece of data. The owner holds it in state and passes it down as props. If a child needs to change it, the parent passes a callback. If two siblings need the same data, I lift the state up to their parent.
>
> I also avoid storing derived values or copying props into state, because those create two copies that can drift apart."

## 🔁 Follow-up questions

### Can props change?

Yes, but only from the outside. When the parent re-renders with a new value, the child gets the new prop. The child itself can't change it.

### When would you copy a prop into state?

Only when the prop is truly an initial value, like `initialCount`, and the component should then manage it on its own. Name it clearly.

### Where should state live if two components need it?

In their closest common parent. The parent passes the value and a setter function down as props.

### Is `children` a prop or state?

A prop. It's what the parent puts between the component's tags.

## ✅ Quick check

### 1. Props or state? "The text a user is typing into a search box."

:::answer
**State.** It belongs to the search box component and changes as the user types.
:::

### 2. Props or state? "The candidate's name shown on a card, given by the list."

:::answer
**Props.** The list (parent) gives it to the card (child), and the card only reads it.
:::

### 3. What's the problem here?

```jsx
const [total, setTotal] = useState(price * qty);  // stores a calculated value
```

:::answer
`total` can be calculated from `price` and `qty`. Storing it means it won't update when they change. Calculate it during render: `const total = price * qty;`
:::
