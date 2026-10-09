---
title: Normalising state (createEntityAdapter)
stack: redux-context
order: 14
level: Advanced
mustKnow: false
askedFrequency: sometimes
summary:
  - "Normalised state stores items in a lookup object by id, plus an ids array for order: { ids: [], entities: {} }."
  - "Each item is stored once, so updating one item updates it everywhere it's shown."
  - "Finding or updating an item by id is instant; you don't loop through an array."
  - "createEntityAdapter gives you this shape plus ready-made reducers (addOne, setAll, updateOne, removeOne…) and selectors (selectAll, selectById…)."
  - "Store relations as ids (jobId, candidateIds), not as copies of other objects."
cards:
  - q: What does "normalised state" mean?
    a: "Storing each item once, in an object keyed by id ({ ids: [...], entities: { id: item } }), and referring to other items by id instead of copying them."
  - q: Why normalise instead of keeping arrays of nested objects?
    a: No duplicate copies to keep in sync, instant lookup and update by id, and smaller, simpler reducers.
  - q: What does createEntityAdapter give you?
    a: The { ids, entities } initial state, reducers like addOne, addMany, setAll, upsertOne, updateOne and removeOne, and selectors like selectAll, selectById and selectTotal.
  - q: How do you keep the list sorted with an entity adapter?
    a: Pass a sortComparer, for example (a, b) => a.name.localeCompare(b.name). The ids array stays sorted.
  - q: How should a job and its candidates be stored in normalised state?
    a: In two entity collections (jobs and candidates), with the job holding candidateIds (or each candidate holding jobId) instead of nested copies.
---

## 💡 What is it?

**Normalising** state means storing data like a **simple database table**.

Instead of an array of nested objects, you keep:
- **`entities`**: an object where each key is an id and the value is the item,
- **`ids`**: an array of ids, to remember the order.

Each item is stored **once**. Other places refer to it **by id**.

Redux Toolkit's **`createEntityAdapter`** builds this shape for you. It also gives you ready-made reducers and selectors.

## 🏠 Real-life example

Think of a **school library**.

One way is to write the **full book details** in every student's notebook whenever they borrow it. If the book's title changes, you must fix every notebook. That's slow and error-prone.

The better way: the library keeps **one card per book**, with a book number. Students only write the **book number**.

- **The library card drawer** = `entities` (look up by number instantly).
- **The book number** = the id.
- **The shelf order list** = `ids` (the order to show them).
- **Students writing only the book number** = storing ids instead of copies.
- **Fixing the title on one card** = `updateOne`. Everyone sees the change at once.

## 🧑‍💻 Code example

Run `npm install @reduxjs/toolkit`. Save this as `normalize.js` and run `node normalize.js`. It uses CommonJS.

```js
const { configureStore, createSlice, createEntityAdapter } = require('@reduxjs/toolkit'); // load Redux Toolkit

const candidatesAdapter = createEntityAdapter({                   // a helper that stores items by id
  sortComparer: (a, b) => a.name.localeCompare(b.name),           // keep the ids list sorted by name
});                                                               // end of createEntityAdapter

const candidatesSlice = createSlice({                             // the candidates slice
  name: 'candidates',                                             // slice name
  initialState: candidatesAdapter.getInitialState({ loading: false }), // { ids: [], entities: {}, loading: false }
  reducers: {                                                     // ready-made reducers from the adapter
    candidatesLoaded: candidatesAdapter.setAll,                   // replace everything with a new list
    candidateUpdated: candidatesAdapter.updateOne,                // change one item by id
    candidateRemoved: candidatesAdapter.removeOne,                // delete one item by id
  },                                                              // end of reducers
});                                                               // end of createSlice

const store = configureStore({ reducer: { candidates: candidatesSlice.reducer } }); // the store
const { candidatesLoaded, candidateUpdated, candidateRemoved } = candidatesSlice.actions; // action creators

store.dispatch(candidatesLoaded([                                 // load 3 candidates from an "API"
  { id: 'c1', name: 'Ravi', status: 'applied' },                  // id c1
  { id: 'c2', name: 'Asha', status: 'applied' },                  // id c2
  { id: 'c3', name: 'Meera', status: 'applied' },                 // id c3
]));                                                              // end of the list

console.log('shape:', JSON.stringify(store.getState().candidates)); // see { ids, entities, loading }

store.dispatch(candidateUpdated({ id: 'c2', changes: { status: 'shortlisted' } })); // update ONE item by id — no loop
store.dispatch(candidateRemoved('c1'));                           // remove ONE item by id

const selectors = candidatesAdapter.getSelectors((s) => s.candidates); // ready-made selectors
console.log('all:', selectors.selectAll(store.getState()).map((c) => `${c.name}:${c.status}`)); // sorted array
console.log('by id c2:', selectors.selectById(store.getState(), 'c2').status); // direct lookup, no searching
console.log('total:', selectors.selectTotal(store.getState()));   // how many are left
```

**Output:**

```text
shape: {"ids":["c2","c3","c1"],"entities":{"c1":{"id":"c1","name":"Ravi","status":"applied"},"c2":{"id":"c2","name":"Asha","status":"applied"},"c3":{"id":"c3","name":"Meera","status":"applied"}},"loading":false}
all: [ 'Asha:shortlisted', 'Meera:applied' ]
by id c2: shortlisted
total: 2
```

Notice that `ids` is sorted by name (Asha, Meera, Ravi), because of `sortComparer`.

## 🔍 Deeper version

**Nested vs normalised:**

```js
// ❌ nested: the same candidate is copied inside every job
{ jobs: [ { id: 'j1', title: 'Node dev', candidates: [ { id: 'c2', name: 'Asha' } ] },
          { id: 'j2', title: 'React dev', candidates: [ { id: 'c2', name: 'Asha' } ] } ] }

// ✅ normalised: each item once, relations by id
{ jobs:       { ids: ['j1', 'j2'], entities: { j1: { id: 'j1', title: 'Node dev', candidateIds: ['c2'] },
                                               j2: { id: 'j2', title: 'React dev', candidateIds: ['c2'] } } },
  candidates: { ids: ['c2'],       entities: { c2: { id: 'c2', name: 'Asha' } } } }
```

If Asha changes her name, the nested version needs **two** updates. The normalised version needs **one**.

**Adapter reducers you'll use:**

| Reducer | Does |
|---|---|
| `addOne` / `addMany` | add; ignore ids that already exist |
| `setOne` / `setMany` / `setAll` | add or fully replace |
| `upsertOne` / `upsertMany` | add, or **merge** into an existing item |
| `updateOne` / `updateMany` | change fields: `{ id, changes }` |
| `removeOne` / `removeMany` / `removeAll` | delete |

You can call them inside your own reducers too, for example in `extraReducers` after a thunk: `candidatesAdapter.setAll(state, action.payload)`.

**Custom ids.** If your items use `_id` (like MongoDB), pass `selectId: (c) => c._id`.

**Joining data back for the UI.** Use a [memoised selector](topic:redux-context/selectors-memoized):

```js
const selectJobWithCandidates = createSelector(                         // join a job with its candidates
  [(s, jobId) => s.jobs.entities[jobId], (s) => s.candidates.entities], // the job + all candidate entities
  (job, cands) => ({ ...job, candidates: job.candidateIds.map((id) => cands[id]) }), // look each id up
);                                                                       // end of createSelector
```

**Lists from the server.** For paged lists, keep the ids per page or per query separately, for example `pages: { 1: ['c2', 'c3'] }`. The entities stay in one shared table. [RTK Query](topic:redux-context/rtk-query) caches per query instead, so you often don't need to normalise server data yourself.

## 🎯 Why do we use it?

- **One source of truth.** Each item exists once, so the UI never shows two different versions of it.
- **Fast updates and lookups.** `entities[id]` is instant. With an array, you'd search through every item.
- **Less code.** The adapter writes the common reducers and selectors for you.
- **Fewer re-renders.** Updating one item only changes that item's reference, not every item in a nested tree.

## ⚠️ Common mistakes

- **Copying related objects** into other objects (a full candidate inside each job) instead of storing ids.
- **Forgetting `selectId`** when your id field isn't called `id`. Everything ends up stored under `undefined`.
- **Using `addMany` when you mean `upsertMany`.** `addMany` skips items that already exist, so changed data doesn't update.
- **Normalising tiny, simple state.** A short list that never changes doesn't need it.

## 🗣️ How to answer in an interview

> "Normalising state means storing data like database tables: an entities object keyed by id, plus an ids array for order. Each item is stored once, and relations are stored as ids, not as nested copies. That avoids duplicate data getting out of sync, and it makes lookups and updates by id instant.
>
> Redux Toolkit's createEntityAdapter builds that shape for me. It gives reducers like setAll, upsertMany, updateOne and removeOne, selectors like selectAll and selectById, and a sortComparer to keep the ids sorted. When the UI needs a joined view, like a job with its candidates, I build it with a memoised selector. For server data, RTK Query often removes the need to normalise by hand."

## 🔁 Follow-up questions

### What's the difference between `addOne`, `setOne` and `upsertOne`?

`addOne` skips the item if the id already exists. `setOne` replaces the whole item. `upsertOne` adds it, or **merges** new fields into the existing item.

### Isn't an object keyed by id the same as a `Map`?

The idea is the same. But Redux state should be serialisable, so a plain object is used instead of a `Map`.

### How would you store many-to-many data, like candidates applying to many jobs?

Use a third collection, like `applications`, with `{ id, jobId, candidateId, status }`. Each side looks up the others by id. This is like a join table in SQL.

### Does normalising help React performance?

Yes. Updating one item creates a new reference only for that item and the `entities` object. Components that select other items by id don't re-render.

## ✅ Quick check

### 1. What is the shape of `adapter.getInitialState()`?

:::answer
`{ ids: [], entities: {} }`, plus any extra fields you pass in, like `{ loading: false }`.
:::

### 2. Which reducer changes only the `status` of candidate `c5`?

- A) `setAll`
- B) `updateOne({ id: 'c5', changes: { status: 'hired' } })`
- C) `addOne({ id: 'c5', status: 'hired' })`

:::answer
**B.** `updateOne` changes the given fields of one existing item. `addOne` would be ignored, because `c5` already exists.
:::

### 3. Your MongoDB items use `_id`. What adapter option do you need?

:::answer
`selectId: (item) => item._id`.
:::
