---
title: Redux DevTools and debugging
stack: redux-context
order: 13
level: Intermediate
mustKnow: false
askedFrequency: common
summary:
  - "Redux DevTools is a browser extension that shows every action, the state after it, and the difference (diff)."
  - "configureStore turns it on automatically in development; no extra setup is needed."
  - "Time travel lets you jump back to an older state to see exactly where things went wrong."
  - "trace shows which line of code dispatched an action; sanitizers hide secrets like tokens."
  - "Debug order: find the action → check its payload → check the diff → check the reducer or selector."
cards:
  - q: What does Redux DevTools show you?
    a: Every action in order, its payload, the full state after it, and the diff (what changed). You can also jump back in time to any earlier state.
  - q: How do you enable Redux DevTools with Redux Toolkit?
    a: You don't need to do anything. configureStore enables it by default in development. You can pass a devTools object for options, or devTools false to turn it off.
  - q: What is "time travel" debugging?
    a: Jumping back to the state after an earlier action, to see how the UI looked then and which action caused a problem.
  - q: How do you hide secrets like tokens from DevTools?
    a: Use the actionSanitizer and stateSanitizer options to replace secret values with something like '***'.
  - q: The UI shows wrong data. How do you use DevTools to find the bug?
    a: Find the last action that touched that data. Check its payload (was the API data wrong?), then the diff (did the reducer update the right field?), then the selector the component uses.
---

## 💡 What is it?

**Redux DevTools** is a browser extension for Chrome, Firefox and Edge. It lets you **see inside your Redux store**.

For every action, it shows:
- the **action** and its payload,
- the **state** after it,
- the **diff**: exactly what changed.

You can also **go back in time** to an older state. This is called **time-travel debugging**.

## 🏠 Real-life example

Think of a **CCTV recording in a school corridor**.

Something broke, and nobody knows how. Instead of guessing, the principal **rewinds the recording**. They watch each moment and see exactly who did what, and when.

- **The CCTV recording** = the list of actions in DevTools.
- **One moment in the video** = one action.
- **What the corridor looked like at that moment** = the state after that action.
- **Spotting what changed between two frames** = the diff.
- **Rewinding to a moment** = time travel.

## 🧑‍💻 Code example

DevTools itself runs in the browser. This Node example shows the `devTools` options, plus a tiny "recorder" middleware that does a mini version of what DevTools does.

Run `npm install @reduxjs/toolkit`. Save this as `devtools.js` and run `node devtools.js`. It uses CommonJS.

```js
const { configureStore, createSlice } = require('@reduxjs/toolkit'); // load Redux Toolkit

const authSlice = createSlice({                                   // a slice that holds the logged-in user
  name: 'auth',                                                   // slice name
  initialState: { user: null, token: null },                      // nobody logged in yet
  reducers: {                                                     // the ways this slice can change
    loggedIn: (state, action) => {                                // after a successful login
      state.user = action.payload.user;                           // save the user name
      state.token = action.payload.token;                         // save the token (a secret!)
    },                                                            // end of loggedIn
    loggedOut: () => ({ user: null, token: null }),               // logout: back to empty
  },                                                              // end of reducers
});                                                               // end of createSlice

const history = [];                                               // our own mini "DevTools" list of actions
const recorder = (api) => (next) => (action) => {                 // a middleware that records every step
  const result = next(action);                                    // let the reducer run first
  history.push({ action: action.type, state: api.getState() });   // save the action and the new state
  return result;                                                  // pass the result back
};                                                                // end of recorder

const store = configureStore({                                    // create the store
  reducer: { auth: authSlice.reducer },                           // our one slice
  middleware: (getDefault) => getDefault().concat(recorder),      // add the recorder after the defaults
  devTools: {                                                     // options for the real Redux DevTools extension
    name: 'Recruiter app',                                        // the name shown in the DevTools dropdown
    trace: true,                                                  // record a stack trace: which code dispatched each action
    stateSanitizer: (s) =>                                        // hide secrets before DevTools shows the state
      s.auth?.token ? { ...s, auth: { ...s.auth, token: '***' } } : s, // replace the real token with ***
  },                                                              // end of devTools options (ignored in Node)
});                                                               // end of configureStore

const { loggedIn, loggedOut } = authSlice.actions;                // the two action creators
store.dispatch(loggedIn({ user: 'Hari', token: 'abc.def.ghi' })); // step 1: log in
store.dispatch(loggedOut());                                      // step 2: log out

history.forEach((h, i) =>                                         // print each recorded step, like the DevTools list
  console.log(i + 1, h.action, '→ user =', h.state.auth.user),    // step number, action name, user after it
);                                                                // end of forEach
console.log('"Jump" to step 1 → user was:', history[0].state.auth.user); // time travel = look at an old saved state
```

**Output:**

```text
1 auth/loggedIn → user = Hari
2 auth/loggedOut → user = null
"Jump" to step 1 → user was: Hari
```

Time travel is easy because Redux states are **immutable**. Each saved state is a separate snapshot, and nothing changes it later.

## 🔍 Deeper version

**The main DevTools tabs:**

| Tab | What it shows | Use it to answer |
|---|---|---|
| **Action** | the action object and payload | "Did the API send the right data?" |
| **State** | the full state after the action | "What is in the store right now?" |
| **Diff** | only the fields that changed | "Did this action change the field I expected?" |
| **Trace** | the code that dispatched the action (needs `trace: true`) | "Who sent this action?" |
| **Slider / Jump** | move to any earlier action | "When did it go wrong?" |

**Useful `devTools` options in `configureStore`:**
- `name`: label for the store in the dropdown.
- `trace: true`: capture a stack trace for each action. It's slower, so use it in development only.
- `actionSanitizer` / `stateSanitizer`: hide secrets or huge data (like file blobs).
- `actionsDenylist`: hide noisy actions, such as a timer that ticks every second.
- `devTools: false` (or `process.env.NODE_ENV !== 'production'`): turn it off in production.

**Debugging flow for "the screen shows wrong data":**
1. **Find the action** that last touched that data. Search by name in the action list.
2. **Check the payload.** If it's wrong, the bug is in the API or the thunk/saga, not the reducer.
3. **Check the diff.** If the payload is right but the diff is wrong, the bug is in the **reducer**.
4. **Check the selector.** If the state is right but the screen is wrong, the bug is in the **selector** or the component.

**Other tools that work with it:**
- **React DevTools**: shows component props, state and re-renders. See [unnecessary re-renders](topic:debugging/unnecessary-re-renders).
- **RTK Query** shows each query's status and cache entries in Redux DevTools too.
- **redux-logger**: prints actions in the console, useful when the extension isn't installed.

## 🎯 Why do we use it?

- **No guessing.** You can see exactly which action changed which field.
- **Fast bug reports.** You can export the action history and share it with a teammate.
- **Learning a new codebase.** Clicking around the app and watching the actions shows how the data flows.

## ⚠️ Common mistakes

- **Leaving DevTools on in production with secrets in the state.** Anyone with the extension could read them. Turn it off in production, or sanitise.
- **Putting non-serialisable values in state** (class instances, `Date`, functions). DevTools can't show or replay them properly.
- **Leaving `trace: true` on everywhere.** It slows the app down.
- **Debugging with `console.log` in reducers** instead of just reading the diff.

## 🗣️ How to answer in an interview

> "Redux DevTools is a browser extension that shows every action, its payload, the state after it, and a diff of what changed. configureStore enables it automatically in development. You can also jump back to any earlier state, which is time-travel debugging. That works because Redux state is immutable, so each state is a separate snapshot.
>
> When the UI shows wrong data, I find the last action that touched that field. If the payload is wrong, the problem is the API call or the thunk. If the payload is right but the diff is wrong, it's the reducer. If the state is right but the screen is wrong, it's the selector or the component. I use trace to see who dispatched an action, and sanitizers to hide tokens. In production I turn it off."

## 🔁 Follow-up questions

### Does Redux DevTools work in production?

It can, if it's not disabled. Many teams turn it off in production, or keep it on with sanitisers if they need to debug live issues.

### Why do non-serialisable values break DevTools?

DevTools stores and replays state as JSON. Functions, class instances and `Map`s don't turn into JSON cleanly, so the display and time travel break.

### How do you find which component dispatched an action?

Turn on `trace: true` and open the **Trace** tab. It shows the call stack, including the component and line.

### How do you debug when the reducer looks correct but nothing re-renders?

Check that the reducer returned a **new** reference. With plain Redux (no Immer), mutating state keeps the same reference, so `useSelector` thinks nothing changed.

## ✅ Quick check

### 1. The action payload is correct, but the state diff doesn't show the field changing. Where is the bug most likely?

:::answer
**In the reducer.** The data arrived correctly, but the reducer didn't update the right field.
:::

### 2. Which option hides a token from Redux DevTools?

- A) `trace`
- B) `stateSanitizer`
- C) `name`

:::answer
**B) `stateSanitizer`.** Together with `actionSanitizer`, it lets you replace secret values before DevTools shows them.
:::

### 3. Why is time travel possible in Redux?

:::answer
Because state is **immutable**. Every action creates a new state, and old states are never changed. So each one is a reliable snapshot you can go back to.
:::
