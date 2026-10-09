---
title: Immutability and why Redux needs it
stack: redux-context
order: 7
level: Basic
mustKnow: false
askedFrequency: common
summary:
  - Immutability means you never change existing data — you make a new copy with the change.
  - Redux and React check for changes with === (same reference?). If you mutate, the reference stays the same, so nobody sees the change.
  - "By hand, use spread and non-mutating methods: { ...obj }, [...arr, x], map, filter."
  - Redux Toolkit uses Immer, so you can write state.list.push(x) inside createSlice, and Immer makes a safe copy for you.
  - Immutability also makes undo, time-travel debugging and memoised selectors possible.
cards:
  - q: What does immutability mean?
    a: Never changing existing objects or arrays. To "update", you create a new copy that includes the change.
  - q: Why does Redux need immutable updates?
    a: Redux and React detect changes by comparing references with ===. A mutated object is still the same reference, so the change is missed and the UI doesn't update.
  - q: How does Redux Toolkit let you write state.push(x)?
    a: createSlice uses Immer. You change a "draft" copy, and Immer builds a new, immutable state from your changes.
  - q: Name three array methods that mutate and three that don't.
    a: Mutating — push, splice, sort. Non-mutating — map, filter, concat (also toSorted, toSpliced, with).
  - q: Is a spread copy a deep copy?
    a: No. { ...obj } copies only the top level. Nested objects are still shared, so you must copy each level you change.
---

## 💡 What is it?

**Immutability** means you **never change** data that already exists. When something needs to change, you make a **new copy** with the change in it.

Redux depends on this. It finds out "did the state change?" by asking a quick question: **is it the same object as before?** (`===`). If you change the old object in place, the answer is "yes, same object", and the change is missed.

## 🏠 Real-life example

Think of your **school report card**.

The school never scratches out a mark and writes a new one on the same card. If a mark changes, they **print a new card**. The old card stays in the file, untouched.

- The **report card** = the state object.
- **Scratching out a mark** = mutating. Hard to notice, and the history is lost.
- **Printing a new card** = an immutable update.
- **Checking "is this a new card?"** = the `===` check. One glance tells you something changed.
- **The file of old cards** = Redux DevTools history (time travel).

## 🧑‍💻 Code example

Make a folder, run `npm init -y` and `npm install @reduxjs/toolkit`. Save this as `immutable.js`. Run `node immutable.js`.

```js
const { createSlice, configureStore } = require('@reduxjs/toolkit'); // Redux Toolkit helpers

// ❌ The bug: changing the old object instead of making a new one
const oldState = { tags: ['node'] };                 // the state before
function badReducer(state) {                         // a wrong, mutating reducer
  state.tags.push('react');                          // changes the SAME array in place
  return state;                                      // returns the SAME object
}                                                    // end of badReducer
const badNext = badReducer(oldState);                // run it
console.log('bad: same object?', badNext === oldState); // true → React/Redux think nothing changed

// ✅ The fix by hand: copy, then change the copy
function goodReducer(state) {                        // a correct, immutable reducer
  return { ...state, tags: [...state.tags, 'react'] }; // new object AND new array
}                                                    // end of goodReducer
const start = { tags: ['node'] };                    // a fresh starting state
const goodNext = goodReducer(start);                 // run it
console.log('good: same object?', goodNext === start); // false → a change is detected
console.log('old state untouched:', start.tags);     // the old state did not change

// ✅ The fix with Redux Toolkit: write "mutating" code, Immer makes the copy
const slice = createSlice({                          // a slice with one reducer
  name: 'skills',                                    // action prefix
  initialState: { tags: ['node'] },                  // starting data
  reducers: { added: (state, action) => { state.tags.push(action.payload); } }, // Immer-powered
});                                                  // end of createSlice
const store = configureStore({ reducer: slice.reducer }); // make a store
const before = store.getState();                     // remember the old state
store.dispatch(slice.actions.added('react'));        // add a tag
const after = store.getState();                      // read the new state
console.log('RTK: same object?', after === before);  // false → a new object was made
console.log('RTK old:', before.tags, 'new:', after.tags); // old is untouched
```

**Output:**

```text
bad: same object? true
good: same object? false
old state untouched: [ 'node' ]
RTK: same object? false
RTK old: [ 'node' ] new: [ 'node', 'react' ]
```

## 🔍 Deeper version

**Why `===` and not a deep compare?** Comparing every field of a big state tree after every action would be slow. Comparing references is instant. Immutability is the deal that makes the fast check correct: *if anything inside changed, the outer object is new.*

**Update every level you touch.** A spread copy is **shallow**. To change a nested field, copy each level on the path:

```js
const next = {                                       // new root object
  ...state,                                          // keep the other fields
  user: {                                            // new user object
    ...state.user,                                   // keep the other user fields
    address: { ...state.user.address, city: 'Kochi' }, // new address with the new city
  },                                                 // end of user
};                                                   // end of next
```

Untouched parts keep their old references. That's good: components reading them don't re-render. See [shallow vs deep copy](topic:javascript/shallow-vs-deep-copy).

**Mutating vs non-mutating methods:**

| Mutates (avoid on state) | Safe alternative |
|---|---|
| `push`, `unshift` | `[...arr, x]`, `[x, ...arr]` |
| `splice` | `filter`, `toSpliced` |
| `sort`, `reverse` | `toSorted`, `toReversed` |
| `arr[i] = x` | `arr.with(i, x)`, `map` |
| `obj.key = x`, `delete obj.key` | `{ ...obj, key: x }`, destructure out |

**Immer inside Redux Toolkit.** In `createSlice` reducers, `state` is a **draft** (a special Proxy). You "mutate" the draft. Immer records the changes and builds a new immutable state. Two rules:
- Either **mutate the draft** or **return a new value**, not both at once.
- Immer only works inside RTK reducers (`createSlice`, `createReducer`). Mutating state anywhere else is still a bug.

**Freezing.** In development, Redux Toolkit **freezes** the state (`Object.freeze`). Accidental mutations outside reducers then throw an error, and you catch the bug early. It also has a check that warns if you mutate between dispatches.

**What immutability gives you:**
- Fast change detection for `useSelector`, `React.memo` and memoised selectors.
- **Time-travel debugging** in Redux DevTools, because old states still exist.
- Easy undo/redo.

## 🎯 Why do we use it?

- **The UI updates correctly.** Change detection with `===` only works if changes create new objects.
- **Fewer hidden bugs.** No code can quietly change data that another part of the app is using.
- **Faster apps.** Unchanged parts keep their references, so memoised components and selectors can skip work.

## ⚠️ Common mistakes

- **Using `push` or `sort` on state outside Immer.** The reference doesn't change, so the screen doesn't update.
- **Shallow-copying only the top level** when changing a nested field. The nested object is still shared and mutated.
- **In `createSlice`, mutating the draft AND returning a new object.** Immer throws an error. Do one or the other.
- **Deep-cloning the whole state** on every change (`structuredClone`). Every part gets a new reference, so everything re-renders.

## 🗣️ How to answer in an interview

> "Immutability means I never change existing state. I create a new copy with the change. Redux and React detect changes by comparing references with ===, because deep comparisons would be slow. If I mutate an object, it's still the same reference, so the change is missed and the UI doesn't update.
>
> Without Immer, I use spread syntax and non-mutating methods like map and filter, and I copy every level I touch. In Redux Toolkit, createSlice uses Immer, so I can write state.items.push(item) on a draft, and Immer produces a new immutable state. RTK also freezes state in development, so accidental mutations throw.
>
> Immutability also enables memoised selectors, React.memo and time-travel debugging in Redux DevTools."

## 🔁 Follow-up questions

### Doesn't copying objects all the time make Redux slow?

Not really. You only copy the path you change. Everything else is shared by reference. That's cheap, and it makes change detection very fast.

### Can I mutate state in a createSlice reducer?

You can write code that *looks* like mutation, because `state` is an Immer draft. Immer turns it into an immutable update. You still can't mutate the real state anywhere else.

### What happens if I mutate the draft and also return a new object?

Immer throws an error: you either modified the draft or returned a new value, not both. The one exception is `return` without a value after mutating.

### Why is deep cloning the whole state a bad idea?

Every nested object gets a new reference. Every selector and memoised component thinks its data changed, so the whole app re-renders.

## ✅ Quick check

### 1. Does this create a new reference for `state.items`?

```js
const next = { ...state };                           // copy the top level
next.items.push('x');                                // add to items
```

:::answer
**No.** `next` is a new object, but `next.items` is the **same array** as `state.items`. `push` mutates it, so the old state changes too. Use `{ ...state, items: [...state.items, 'x'] }`.
:::

### 2. Which of these does NOT mutate the original array?

- A) `arr.sort()`
- B) `arr.toSorted()`
- C) `arr.reverse()`

:::answer
**B.** `toSorted()` returns a new sorted array. `sort()` and `reverse()` change the original.
:::

### 3. Inside a Redux Toolkit `createSlice` reducer, is `state.count += 1` a bug?

:::answer
**No.** `state` is an Immer draft, so this is safe. Immer creates a new state object for you. The same line outside a slice reducer would be a bug.
:::
