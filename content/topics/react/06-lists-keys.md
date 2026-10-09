---
title: Rendering lists and keys
stack: react
order: 6
level: Basic
mustKnow: true
askedFrequency: very common
summary:
  - Use .map() to turn an array of data into an array of JSX elements.
  - Every item in a list needs a key prop that is unique among its siblings and stays the same between renders.
  - Use a stable id from your data (like a database _id) as the key. Avoid the array index if items can be added, removed or reordered.
  - Keys help React match old and new items, so it updates, moves or removes the right element and keeps the right state.
  - Changing a component's key makes React throw it away and create a fresh one, which resets its state.
cards:
  - q: Why does React need keys in lists?
    a: Keys let React match each item between renders. Then it can update, move or remove the right element and keep each item's state with it.
  - q: Why is the array index a bad key?
    a: The index changes when items are added, removed or reordered. React then matches the wrong items, which can show wrong input values or state.
  - q: When is the index OK as a key?
    a: When the list never changes order, never has items added or removed in the middle, and items have no state. For example, a fixed list of labels.
  - q: Do keys need to be unique across the whole app?
    a: No. Only among siblings in the same list.
  - q: How can a key reset a component?
    a: If you change the key, React treats it as a new component, throws away the old one and its state, and mounts a fresh one.
---

## 💡 What is it?

To show a list in React, you take an array and use **`.map()`** to turn each item into JSX.

Each item in the list needs a **`key`**. A key is a unique, stable label for that item, like its id.

React uses keys to know **which item is which** when the list changes.

## 🏠 Real-life example

Think of a **class roll call with roll numbers**.

The teacher knows each student by their **roll number**, not by where they sit. If students change seats, the teacher still knows who is who.

- The **students** = the list items.
- The **roll number** = the key (a stable id).
- **Seat position** = the array index.
- If the teacher used **seat numbers** to mark attendance, and two students swapped seats, the marks would go to the **wrong** students. That's the index-as-key bug.

## 🧑‍💻 Code example

Paste this into `src/App.jsx` of a Vite React app. Run `npm run dev`.

```jsx
import { useState } from 'react';                                     // bring in useState

const startList = [                                                   // starting data, like from an API
  { id: 'c1', name: 'Asha' },                                         // each item has a stable id
  { id: 'c2', name: 'Ravi' },                                         // second candidate
  { id: 'c3', name: 'Meera' },                                        // third candidate
];                                                                    // end of startList

export default function App() {                                       // the main component
  const [candidates, setCandidates] = useState(startList);            // the list lives in state
  function removeFirst() {                                            // removes the first person
    setCandidates(candidates.slice(1));                               // new array without item 0
  }                                                                   // end of removeFirst
  return (                                                            // what the screen shows
    <main>                                                            {/* a box around everything */}
      <button onClick={removeFirst}>Remove first</button>             {/* click to remove Asha */}
      <ul>                                                            {/* the list */}
        {candidates.map((c) => (                                      // turn each item into JSX
          <li key={c.id}>                                             {/* key = the stable id */}
            {c.name} <input placeholder="note" />                     {/* each row has its own input */}
          </li>                                                       // end of one row
        ))}                                                           {/* end of the map */}
      </ul>                                                           {/* end of the list */}
    </main>                                                           // end of the box
  );                                                                  // end of what App returns
}                                                                     // end of App
```

**What you see:**

```text
[Remove first]
• Asha  [note]
• Ravi  [note]
• Meera [note]

Type "good" in Ravi's note, then click Remove first:
• Ravi  [good]   ← the note stays with Ravi
• Meera [    ]
```

Now try `key={index}` instead. After removing Asha, the text "good" jumps to **Meera's** row. That is the bug keys prevent.

## 🔍 Deeper version

**Why keys matter.** When a list re-renders, React compares the old items with the new ones. This comparison is part of reconciliation (see [the virtual DOM](topic:react/virtual-dom)). Keys tell React "this new item is the same as that old item".
- **Same key** → keep the element and its state; update what changed.
- **New key** → create a new element.
- **Missing key** → remove the old element.

**Index keys and the shifting bug.** With `key={index}`, removing item 0 makes Ravi's row get key `0`. React thinks the **first row** stayed and the **last row** was removed. So DOM state (like input text) and component state stay in the wrong rows.

| Key choice | Safe when… |
|---|---|
| Database id (`_id`, `uuid`) | Always — the best choice |
| A unique field (email, slug) | It's truly unique and never changes |
| Array index | The list is fixed: no add, remove or reorder, and rows have no state |
| `Math.random()` | **Never** — a new key every render remakes every row and loses state |

**Rules.**
- Keys must be **unique among siblings**, not across the whole app.
- Put the key on the **outermost element** returned from `map`.
- `key` is not passed to your component as a prop. If the child needs the id, pass it separately: `<Row key={c.id} id={c.id} />`.
- For a group without a wrapper, use `<Fragment key={c.id}>…</Fragment>`.

**Resetting with a key.** `<ProfileForm key={candidateId} />` gives you a **fresh** form whenever `candidateId` changes. Old state is thrown away. This is a clean way to reset a component.

**Big lists.** For thousands of rows, keys alone aren't enough. Use pagination or list virtualisation. See [a 5,000-row list scrolls slowly](topic:debugging/slow-long-list).

## 🎯 Why do we use it?

- **Correct updates.** The right row changes, moves or disappears.
- **State stays with its item.** Inputs, checkboxes and expanded panels don't jump between rows.
- **Speed.** React can move existing elements instead of rebuilding them.

## ⚠️ Common mistakes

- **No key at all.** React shows a warning, and updates can go wrong.
- **Index as key** in lists that can change.
- **Random keys** (`Math.random()`, `Date.now()`). Every render looks like a new list.
- **Keys on the wrong element** — on an inner `<span>` instead of the element returned from `map`.

## 🗣️ How to answer in an interview

> "To render a list, I map over the array and return JSX for each item. Every item needs a key that's unique among its siblings and stable between renders, ideally the id from the database.
>
> Keys are how React matches old and new items during reconciliation. With a stable key, React keeps each item's DOM and state attached to the right data when items are added, removed or reordered. Using the array index breaks this, because indexes shift, so input values or state can end up in the wrong row. Random keys are even worse, because every render looks like a brand-new list.
>
> I also use keys on purpose to reset a component: changing the key mounts a fresh instance with clean state."

## 🔁 Follow-up questions

### Why not use `Math.random()` as a key?

It gives a new key on every render. React thinks every item is new, so it destroys and recreates every row. You lose state and focus, and it's slow.

### Do keys have to be globally unique?

No. They only need to be unique among siblings in the same list. Two different lists can both use key `1`.

### Can you read `props.key` in a child?

No. `key` is used by React and isn't passed as a prop. Pass the id as a separate prop if the child needs it.

### What if the data has no id?

Create stable ids when the data is created or loaded (for example with `crypto.randomUUID()`), and store them with the item. Don't create them during render.

## ✅ Quick check

### 1. What's wrong here?

```jsx
{items.map((item) => <li>{item.name}</li>)}       // no key
```

:::answer
There's no `key`. Add a stable one: `<li key={item.id}>{item.name}</li>`.
:::

### 2. A list of todos can be reordered by dragging. Which key is best?

- A) `key={index}`
- B) `key={todo.id}`
- C) `key={Math.random()}`

:::answer
**B.** The id stays with the todo when it moves. The index changes on reorder, and a random key changes every render.
:::

### 3. You change `<Editor key="a" />` to `<Editor key="b" />`. What happens to Editor's state?

:::answer
It's **reset**. React throws away the old Editor and mounts a new one with fresh state.
:::
