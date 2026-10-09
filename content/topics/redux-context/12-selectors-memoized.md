---
title: Selectors and memoised selectors (createSelector)
stack: redux-context
order: 12
level: Intermediate
mustKnow: false
askedFrequency: common
summary:
  - "A selector is a function that reads a piece of data from the Redux state: (state) => state.candidates.list."
  - "createSelector (from Reselect, also exported by Redux Toolkit) remembers its last result and only recalculates when its inputs change."
  - "That keeps the same array or object reference between renders, so useSelector doesn't cause extra re-renders."
  - "Use memoised selectors for derived data: filtering, sorting, counting, joining."
  - "Selectors keep the shape of the state in one place, so components don't break when the state changes."
cards:
  - q: What is a selector?
    a: "A function that takes the state and returns some part of it, or something calculated from it, like (state) => state.user.name."
  - q: What does createSelector add?
    a: Memoisation. It caches the last result and returns the same reference while the inputs are the same, instead of recalculating.
  - q: Why can useSelector(state => state.list.filter(...)) cause extra re-renders?
    a: filter returns a new array every time. useSelector compares with ===, sees a different reference, and re-renders the component even if nothing changed.
  - q: What are "input selectors" and the "result function"?
    a: Input selectors pull raw values from the state. The result function gets those values and calculates the output. It only runs when an input changes.
  - q: When do you NOT need createSelector?
    a: When the selector just returns an existing value from the state, like state.user. There's nothing new to calculate.
---

## 💡 What is it?

A **selector** is a small function that **reads data from the Redux state**. For example: `(state) => state.candidates`.

Sometimes you need **derived data**: data calculated from the state, like "only shortlisted candidates". Calculating it on every render is wasteful. It also creates a **new array each time**, which makes React re-render.

`createSelector` makes a **memoised selector**. "Memoised" means it **remembers** its last answer. If the inputs didn't change, it gives back the same answer without calculating again.

## 🏠 Real-life example

Think of a **class teacher who counts the toppers**.

Every morning the principal asks, "Who scored above 90?" The teacher could check all 40 answer sheets again. But the marks haven't changed since yesterday.

So the smart teacher keeps a **note** with yesterday's answer. They only check the sheets again **when new marks come in**.

- **The answer sheets** = the Redux state.
- **"Who scored above 90?"** = the selector.
- **Checking all 40 sheets** = the filter (the expensive calculation).
- **The note with the last answer** = the memoised (cached) result.
- **New marks arriving** = an input of the selector changing.

## 🧑‍💻 Code example

Run `npm install @reduxjs/toolkit`. Save this as `selectors.js` and run `node selectors.js`. It uses CommonJS.

```js
const { createSelector } = require('@reduxjs/toolkit');           // RTK re-exports createSelector from Reselect

const state = {                                                   // a pretend Redux state
  candidates: [                                                   // a list of candidates
    { id: 1, name: 'Asha', status: 'shortlisted' },               // shortlisted
    { id: 2, name: 'Ravi', status: 'applied' },                   // not shortlisted
    { id: 3, name: 'Meera', status: 'shortlisted' },              // shortlisted
  ],                                                              // end of the list
  theme: 'light',                                                 // something unrelated to candidates
};                                                                // end of state

let runs = 0;                                                     // counts how often the filter really runs
const selectCandidates = (s) => s.candidates;                     // input selector: just reads the list
const selectShortlisted = createSelector(                         // memoised selector
  [selectCandidates],                                             // its input(s)
  (list) => {                                                     // the "result function": the expensive part
    runs++;                                                       // count a real run
    return list.filter((c) => c.status === 'shortlisted');        // a NEW array of shortlisted candidates
  },                                                              // end of the result function
);                                                                // end of createSelector

const a = selectShortlisted(state);                               // first call → filter runs
const b = selectShortlisted(state);                               // same input → cached result, no run
const c = selectShortlisted({ ...state, theme: 'dark' });         // theme changed, list is the same array → still cached
console.log('names:', a.map((x) => x.name));                      // show the result
console.log('same array each time?', a === b, a === c);           // true true → same reference
console.log('filter ran', runs, 'time(s)');                       // only once

const newState = { ...state, candidates: [...state.candidates] }; // a new list array (like after an update)
selectShortlisted(newState);                                      // input changed → filter runs again
console.log('after list changed, filter ran', runs, 'time(s)');   // now 2
```

**Output:**

```text
names: [ 'Asha', 'Meera' ]
same array each time? true true
filter ran 1 time(s)
after list changed, filter ran 2 time(s)
```

## 🔍 Deeper version

**How it decides to recalculate.** `createSelector` runs the **input selectors** first. It compares each result with the last one using `===` (by reference). If all are the same, it returns the cached output. Otherwise it calls the **result function** again.

This works because Redux state is **immutable**. When data changes, you get a **new** object or array. When it doesn't, the old reference stays. See [immutability](topic:redux-context/immutability).

**Why this matters for React.** `useSelector` re-renders a component when the selected value changes by `===`.

```js
const shortlisted = useSelector((s) => s.candidates.filter((c) => c.shortlisted)); // ❌ new array every time → re-renders on ANY store change
const shortlisted2 = useSelector(selectShortlisted);                              // ✅ same reference until the list changes
```

**Selectors with arguments.** Pass extra arguments after `state`:

```js
const selectByStatus = createSelector(                    // a selector that takes a status
  [(s) => s.candidates, (s, status) => status],            // second input selector reads the argument
  (list, status) => list.filter((c) => c.status === status), // filter by the given status
);                                                         // end of createSelector
selectByStatus(state, 'applied');                          // call with an argument
```

In older Reselect (version 4 and below) the cache size was **1**. If two components called it with **different** arguments, they kept replacing each other's cache. The old fix was **one selector per component** (made with `useMemo`).

:::version[Version note]
**Reselect 5** (used by Redux Toolkit 2) uses `weakMapMemoize` by default. It can remember results for many argument combinations, so the "cache size 1" problem mostly goes away. In development it also warns when a result function just returns its input (no real work), or when an input selector returns a new reference every time.
:::

**RTK slice selectors.** In RTK 2 you can put selectors inside `createSlice` with the `selectors` field. They get the **slice** state, and the slice exports them ready to use.

**Real example.** SkillKeepr's frontend uses Reselect selectors so each page reads its slice in one memoised `useSelector`. [FILL IN: a selector you wrote there, if any.]

## 🎯 Why do we use it?

- **Speed.** Expensive calculations (filtering, sorting, grouping) run only when their data changes.
- **Fewer re-renders.** A stable reference stops `useSelector` from re-rendering components for no reason. See [what causes a re-render](topic:react/what-causes-a-re-render).
- **One place for the state shape.** If you rename a field in the state, you fix one selector, not 20 components.

## ⚠️ Common mistakes

- **Filtering or mapping directly inside `useSelector`.** It returns a new array every time.
- **Making the input selector do the work.** The inputs should only *read* values. Put the calculation in the result function.
- **Using `createSelector` for simple reads.** `(s) => s.user` needs no memoisation.
- **Building a new selector inside a component on every render** (`createSelector(...)` in the component body). The cache is thrown away each time. Create it once, outside the component (or with `useMemo`).

## 🗣️ How to answer in an interview

> "A selector is a function that reads data from the Redux state. For derived data, like a filtered or sorted list, I use createSelector from Reselect, which Redux Toolkit re-exports. It has input selectors that read raw values, and a result function that calculates the output. It only recalculates when an input changes by reference. Otherwise it returns the cached result.
>
> That matters for React. useSelector compares with ===, so if I filter inside useSelector, I get a new array every time and the component re-renders on any store change. A memoised selector keeps the same reference, so the component only re-renders when the data really changes. Selectors also keep the state shape in one place."

## 🔁 Follow-up questions

### Is createSelector part of Redux?

It comes from the **Reselect** library. Redux Toolkit re-exports it, so you can import it from `@reduxjs/toolkit`.

### What is `shallowEqual` and when do you use it?

It's a comparison function from react-redux. `useSelector(fn, shallowEqual)` compares the top-level fields of the result instead of the reference. It's useful when you return a small new object like `{ a, b }`.

### What happens if the input selector returns a new array each time?

Memoisation never works. The result function runs on every call. Reselect 5 warns about this in development.

### Should every selector be memoised?

No. Only memoise when you **calculate** something new (filter, map, sort, combine). Plain reads don't need it.

## ✅ Quick check

### 1. How many times does the result function run?

```js
const sel = createSelector([(s) => s.items], (items) => items.length); // count items
const s1 = { items: [1, 2], other: 1 };                               // state 1
sel(s1); sel(s1); sel({ ...s1, other: 2 });                           // three calls
```

:::answer
**Once.** `items` is the same array in all three calls, so the cached result is reused.
:::

### 2. Which line can cause extra re-renders?

- A) `useSelector((s) => s.user.name)`
- B) `useSelector((s) => s.jobs.filter((j) => j.open))`

:::answer
**B.** `filter` returns a new array on every call, so `===` fails and the component re-renders on every store update.
:::

### 3. True or false: you need `createSelector` for `(state) => state.theme`.

:::answer
**False.** It just returns an existing value. There's nothing to calculate or cache.
:::
