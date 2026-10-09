---
title: "Redux Toolkit: configureStore and createSlice"
stack: redux-context
order: 8
level: Basic
mustKnow: true
askedFrequency: very common
summary:
  - Redux Toolkit (RTK) is the official, recommended way to write Redux. It removes most of the boilerplate.
  - createSlice makes the reducer AND the action creators from one object — name, initialState, reducers.
  - Inside createSlice reducers you can write "mutating" code — Immer turns it into immutable updates.
  - configureStore sets up the store with good defaults — Redux DevTools, the thunk middleware and safety checks.
  - "RTK 2 uses the builder callback for extraReducers: extraReducers: (builder) => builder.addCase(...)."
cards:
  - q: What is Redux Toolkit?
    a: The official, recommended way to write Redux. It gives configureStore, createSlice, createAsyncThunk and RTK Query to remove boilerplate and mistakes.
  - q: What does createSlice give you?
    a: A reducer and matching action creators (and action types like 'jobs/jobAdded') generated from one object with a name, initialState and reducers.
  - q: What does configureStore set up for you?
    a: It combines slice reducers, turns on Redux DevTools, adds the thunk middleware, and adds development checks for mutations and non-serialisable values.
  - q: Why can you write state.items.push(x) in createSlice?
    a: RTK uses Immer. The state is a draft; Immer records the changes and produces a new immutable state.
  - q: What is extraReducers for?
    a: Handling actions that weren't created by this slice, like createAsyncThunk's pending/fulfilled/rejected actions or another slice's actions.
---

## 💡 What is it?

**Redux Toolkit (RTK)** is the official way to write Redux today. Plain Redux needs a lot of repeated code: action types, action creators, switch statements and careful copying. RTK does most of that for you.

Two tools do most of the work:
- **`createSlice`** — you describe one part of the state and how it can change. RTK makes the reducer and the actions.
- **`configureStore`** — makes the store, with good settings already turned on.

## 🏠 Real-life example

Think of **school clubs**.

Each club (science club, sports club) runs its own small register with its own rules. The school office keeps the **main file**, with one section for each club.

- A **club** = a slice (`jobs`, `user`).
- The **club's register** = the slice's state.
- The **club's rules** ("a new member is added at the end") = the slice's reducers.
- The **request forms with the club's name printed on top** = action creators like `jobs/jobAdded`, made for you.
- The **main school file** = the store from `configureStore`, with one section per club.
- The **office's CCTV and rule-checker** = DevTools and safety checks, set up automatically.

## 🧑‍💻 Code example

Make a folder, run `npm init -y` and `npm install @reduxjs/toolkit`. Save this as `rtk.js`. Run `node rtk.js`.

```js
const { configureStore, createSlice } = require('@reduxjs/toolkit'); // the two main RTK tools

const jobsSlice = createSlice({                       // slice 1: jobs
  name: 'jobs',                                        // action types start with 'jobs/'
  initialState: { items: [], loading: false },         // starting data for this slice
  reducers: {                                          // the changes this slice allows
    jobAdded(state, action) {                          // 'jobs/jobAdded'
      state.items.push(action.payload);                // Immer turns this into a safe copy
    },                                                 // end of jobAdded
    jobRemoved(state, action) {                        // 'jobs/jobRemoved'
      state.items = state.items.filter((j) => j.id !== action.payload); // keep all except this id
    },                                                 // end of jobRemoved
  },                                                   // end of reducers
});                                                    // end of jobsSlice

const userSlice = createSlice({                       // slice 2: the logged-in user
  name: 'user',                                        // action types start with 'user/'
  initialState: { name: null },                        // nobody logged in yet
  reducers: {                                          // the changes this slice allows
    loggedIn: (state, action) => { state.name = action.payload; }, // save the name
  },                                                   // end of reducers
});                                                    // end of userSlice

const store = configureStore({                         // build the store
  reducer: { jobs: jobsSlice.reducer, user: userSlice.reducer }, // each slice gets a key
});                                                    // DevTools + thunk are added for you

const { jobAdded, jobRemoved } = jobsSlice.actions;    // action creators made by createSlice
console.log(jobAdded({ id: 1, title: 'Node Developer' })); // see the action object it makes

store.dispatch(userSlice.actions.loggedIn('Hari'));    // log in
store.dispatch(jobAdded({ id: 1, title: 'Node Developer' })); // add job 1
store.dispatch(jobAdded({ id: 2, title: 'React Developer' })); // add job 2
store.dispatch(jobRemoved(1));                         // remove job 1
console.log(JSON.stringify(store.getState()));         // the whole state tree
console.log('frozen?', Object.isFrozen(store.getState().jobs)); // RTK freezes state to stop mutations
```

**Output:**

```text
{ type: 'jobs/jobAdded', payload: { id: 1, title: 'Node Developer' } }
{"jobs":{"items":[{"id":2,"title":"React Developer"}],"loading":false},"user":{"name":"Hari"}}
frozen? true
```

## 🔍 Deeper version

**What `createSlice` generates:**

| You write | RTK gives you |
|---|---|
| `name: 'jobs'` | the type prefix `'jobs/'` |
| `reducers: { jobAdded(state, action) {…} }` | the action creator `jobsSlice.actions.jobAdded(payload)` and the type `'jobs/jobAdded'` |
| all the reducers | one `jobsSlice.reducer` with the switch statement built in |

**Immer** lets you "mutate" the draft state safely. See [immutability](topic:redux-context/immutability).

**What `configureStore` turns on:**
- **Combines** your slice reducers (`reducer: { jobs, user }`).
- **Redux DevTools** in the browser.
- **The thunk middleware**, so you can dispatch functions (used by `createAsyncThunk`).
- **Development checks**: an error if you mutate state outside reducers, and a warning if you put things like Promises, class instances or functions in the state or actions (they break DevTools and persistence).

**`prepare` callbacks** let an action creator build the payload, for example adding an id:

```js
jobAdded: {                                            // a reducer with a prepare step
  reducer(state, action) { state.items.push(action.payload); }, // the normal reducer
  prepare(title) { return { payload: { id: crypto.randomUUID(), title } }; }, // build the payload
},                                                     // end of jobAdded
```

**`extraReducers`** handles actions that this slice didn't create. Examples: the `pending`, `fulfilled` and `rejected` actions from [createAsyncThunk](topic:redux-context/create-async-thunk), or a `logout` action from another slice.

```js
extraReducers: (builder) => {                          // the builder callback (required in RTK 2)
  builder
    .addCase(fetchJobs.pending, (state) => { state.loading = true; })   // request started
    .addCase(fetchJobs.fulfilled, (state, action) => {                  // request succeeded
      state.loading = false;                                            // stop the spinner
      state.items = action.payload;                                     // save the jobs
    });                                                                  // end of the chain
},                                                     // end of extraReducers
```

:::version[Version note]
**Redux Toolkit 2** (2023) removed the old **object syntax** for `extraReducers` and `createReducer`. You must use the **builder callback** shown above. It also added `combineSlices` for lazy-loading slices, and the `selectors` field inside `createSlice`.
:::

**Lazy-loaded slices.** Big apps add a slice only when its page loads, so the first bundle stays small. RTK 2 has `combineSlices(...).inject(slice)` for this. **At SkillKeepr**, the frontend adds each page's reducer when the page loads, in a similar way. [FILL IN: confirm whether your project uses RTK or plain Redux with this pattern.]

## 🎯 Why do we use it?

- **Much less code.** One `createSlice` replaces action types, action creators and the switch reducer.
- **Fewer bugs.** Immer prevents mutation bugs. Dev checks catch mistakes early.
- **Good defaults.** DevTools and thunk work with zero setup.
- **It's the official recommendation.** New Redux code should use RTK.

## ⚠️ Common mistakes

- **Using the old object syntax** in `extraReducers` (`{ [fetchJobs.fulfilled]: … }`). It was removed in RTK 2. Use the builder.
- **Mutating the draft AND returning a new object** in the same reducer. Immer throws.
- **Putting non-serialisable values** (Dates, class instances, Promises) in state. Store plain data, like ISO date strings.
- **Destructuring the state into local variables and changing them.** Only changes to `state.something` are recorded.

## 🗣️ How to answer in an interview

> "Redux Toolkit is the official way to write Redux. createSlice takes a name, an initial state and reducer functions, and it generates the reducer plus action creators with types like 'jobs/jobAdded'. Inside those reducers I can write code that looks like mutation, because RTK uses Immer to turn it into an immutable update.
>
> configureStore combines the slice reducers and turns on Redux DevTools, the thunk middleware, and dev checks for accidental mutations and non-serialisable values. For async work, I use createAsyncThunk and handle its pending, fulfilled and rejected actions in extraReducers with the builder callback, which RTK 2 requires.
>
> Compared with plain Redux, it removes most of the boilerplate and a whole class of mutation bugs."

## 🔁 Follow-up questions

### What's the difference between reducers and extraReducers in createSlice?

`reducers` defines actions that **this slice owns**, and RTK generates their action creators. `extraReducers` responds to actions **created elsewhere**, like thunk actions or another slice's actions. It generates no action creators.

### Why does RTK warn about non-serialisable values?

Redux state should be plain data. Functions, Promises and class instances can't be saved, logged in DevTools or replayed. Store plain objects, arrays, strings and numbers.

### What does configureStore add that createStore doesn't?

DevTools setup, the thunk middleware, slice combining, and dev-time mutation and serialisability checks.

### How do you reset the whole store on logout?

Wrap the root reducer: when a `logout` action arrives, call the real reducer with `undefined` as the state, so every slice goes back to its initial state. (SkillKeepr's frontend resets the store on logout too.)

## ✅ Quick check

### 1. What action does this dispatch?

```js
const slice = createSlice({ name: 'todos', initialState: [], reducers: { added: (s, a) => { s.push(a.payload); } } });
store.dispatch(slice.actions.added('Learn RTK'));
```

:::answer
**`{ type: 'todos/added', payload: 'Learn RTK' }`.** The type is `name` + `/` + the reducer key, and the argument becomes `payload`.
:::

### 2. Is this a valid RTK 2 `extraReducers`?

```js
extraReducers: { [fetchJobs.fulfilled]: (state, action) => { state.items = action.payload; } }
```

:::answer
**No.** The object syntax was removed in RTK 2. Use `extraReducers: (builder) => { builder.addCase(fetchJobs.fulfilled, …) }`.
:::

### 3. Which of these does `configureStore` turn on by default?

- A) Redux DevTools and thunk middleware
- B) redux-saga
- C) Saving state to localStorage

:::answer
**A.** Sagas and persistence need extra setup.
:::
