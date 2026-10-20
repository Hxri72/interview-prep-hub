---
title: "Hot reload (HMR): how the page updates without a refresh"
stack: web-fundamentals
order: 21
level: Intermediate
mustKnow: false
askedFrequency: sometimes
summary:
  - "HMR (Hot Module Replacement) swaps only the changed file in the running page, without a full reload."
  - "The chain: a file watcher sees your save → the dev server recompiles that one module → it sends a message over a WebSocket → the browser fetches the new module and swaps it in."
  - "React Fast Refresh keeps component state (like a counter value or typed text) while it swaps a component's code."
  - "If no module can accept the update (for example, you edit main.jsx or a file that isn't a component), the dev server sends 'full-reload' and the page refreshes."
  - "Backends don't use HMR. Tools like node --watch or nodemon restart the whole Node process when a file changes."
cards:
  - q: What is HMR?
    a: Hot Module Replacement — the dev server replaces just the changed module in the running app, without reloading the whole page.
  - q: How does the browser learn that a file changed?
    a: The dev server keeps a WebSocket open to the page and sends an update message naming the changed module. The browser then imports the new version.
  - q: What does React Fast Refresh add?
    a: It re-runs the edited component with its existing state, so a counter or form input keeps its value after you save.
  - q: When does HMR fall back to a full page reload?
    a: When no module in the chain can accept the update — for example editing the entry file (main.jsx), or a non-component module that nothing handles.
  - q: How does a Node backend reload on save?
    a: It restarts the whole process with node --watch (built in) or nodemon. State in memory is lost on each restart.
---

## 💡 What is it?

While you code, you save files many times a minute. Reloading the whole page each time is slow, and you lose what you typed.

**HMR (Hot Module Replacement)** fixes this. The dev server **swaps only the changed file** inside the page that's already running.

With React, **Fast Refresh** even **keeps the state**, like a counter's number or text in a form.

## 🏠 Real-life example

Think of **changing a flat tyre** on a moving bus versus **stopping the bus**.

- **Full page reload** = stopping the bus, making all passengers get off, fixing the tyre, and boarding everyone again. Slow, and people lose their seats (your state).
- **HMR** = a pit crew swaps **just that one tyre** while the passengers stay seated.
- **The radio message** from the depot ("tyre 3 is ready, swap it now") = the WebSocket message from the dev server.
- **Passengers keeping their seats** = React Fast Refresh keeping state.
- **Sometimes the engine itself must change** (main.jsx). Then the bus must stop: a full reload.

## 🧑‍💻 Code example

**Part 1 — feel it.** In a Vite React app (`npm create vite@latest`, pick React), put this in `src/App.jsx` and run `npm run dev`:

```jsx
import { useState } from 'react'; // React's state hook
export default function App() { // the main component
  const [count, setCount] = useState(0); // count starts at 0
  return <button onClick={() => setCount(count + 1)}>Clicked {count} times</button>; // clicking adds 1
} // end of App
```

Click the button 5 times. Then change the text `Clicked` to `Pressed` and save. The label updates, and the number **stays 5**. That's HMR + Fast Refresh.

**Part 2 — watch the messages.** The Vite page has a hidden WebSocket to the dev server. This script listens to it, like the browser does. Save as `hmr-listen.mjs`:

```js
const TOKEN = process.argv[2]; // the dev server's token, passed on the command line
const ws = new WebSocket(`ws://localhost:5173/?token=${TOKEN}`, 'vite-hmr'); // connect like the browser does
ws.onmessage = (e) => console.log('message:', e.data); // print every message from the dev server
setTimeout(() => ws.close(), 10000); // stop listening after 10 seconds
```

Get the token and run it (Node 24 has `WebSocket` built in):

```bash
TOKEN=$(curl -s http://localhost:5173/@vite/client | grep -o 'wsToken = "[^"]*"' | cut -d'"' -f2) # read the token from Vite's client file
node hmr-listen.mjs "$TOKEN" # start listening, then edit App.jsx, then edit main.jsx
```

Real output (I edited `App.jsx`, then `main.jsx`; my dev server ran on port 4210, and the long file path is shortened):

```text
message: {"type":"connected"}
message: {"type":"update","updates":[{"type":"js-update","timestamp":1792519260723,"path":"/src/App.jsx","acceptedPath":"/src/App.jsx","explicitImportRequired":false,"isWithinCircularImport":false}]}
message: {"type":"full-reload","triggeredBy":"/…/src/main.jsx","path":"*"}
```

And the dev server's own log:

```text
11:31:00 PM [vite] (client) hmr update /src/App.jsx
11:31:02 PM [vite] (client) page reload src/main.jsx
```

**What to notice:**
- Editing a **component** sent a small `js-update` for just `/src/App.jsx`.
- Editing **`main.jsx`** (the entry file) sent `full-reload`, so the whole page refreshed.

## 🔍 Deeper version

**The full chain, step by step.**

1. **Watch.** The dev server watches your files (with a file-system watcher, like `chokidar` or the OS's own events).
2. **Recompile one module.** Only the changed file is transformed again (JSX/TS → JS).
3. **Find who accepts it.** The dev server walks the **module graph**, which is the tree of who imports whom. It looks for a module that "accepts" updates.
4. **Notify.** It sends a message over the **WebSocket** opened by `/@vite/client`.
5. **Swap.** The browser imports the new version with a fresh query (like `?t=1792519260723`), so the cache can't serve the old one. Then it runs the accept handler.
6. **Fast Refresh.** For React components, the plugin re-renders them with **existing state**.

**Who can "accept" an update?**

| You edit… | What happens |
|---|---|
| a React component file | Fast Refresh swaps it, keeps state → `js-update` |
| a CSS file | the `<style>` is replaced → `css-update`, no reload |
| `main.jsx` (entry, nothing above it) | nobody accepts → `full-reload` |
| a plain module imported by components | the update bubbles up to the components that import it |
| a file not loaded by the page | nothing is sent (it's not in the module graph) |

I saw that last row myself. My first test sent no update, because no browser had loaded `App.jsx` yet. Vite only tracks modules a page has actually requested.

**When Fast Refresh resets state.**
- The file exports **things other than components** (like a constant together with a component). Then Fast Refresh can't safely swap it, and does a full reload.
- You **change hook order** (add or remove a `useState`). That component's state is reset.
- You add `// @refresh reset` to force a reset.

**Live reload vs HMR.**

| | Live reload | HMR |
|---|---|---|
| On save | whole page reloads | only the changed module is swapped |
| State | lost | usually kept (with Fast Refresh) |
| Speed | slower in big apps | fast |

**webpack** has HMR too (`webpack-dev-server` with `hot: true`, and the React Refresh plugin). The idea is the same. The difference is that webpack re-bundles the affected part first.

**Backends: restart, not swap.** Node servers don't hot-swap modules. They **restart** the whole process. Real `node --watch` output:

```text
server v1 started
Completed running 'server.mjs'. Waiting for file changes before restarting...
Change detected in '…/watch/server.mjs'
Restarting 'server.mjs'
server v2 started
```

- `node --watch server.js` is built into Node (stable since Node 22). See [modern Node features](topic:nodejs/modern-node-features).
- `nodemon` is the older package that does the same, with more options.
- Anything kept in memory (caches, in-memory sessions) is lost on each restart.

## 🎯 Why do we use it?

- **Speed.** You see changes in about a second, without losing your place.
- **Keeps state.** No refilling a 10-field form or clicking back to the same screen after every save.
- **Understanding it helps debugging.** When "my change didn't show up" or "state keeps resetting", you know which part of the chain to check.

## ⚠️ Common mistakes

- **Exporting a constant from a component file.** Fast Refresh may do a full reload every time. Put constants in their own file.
- **Thinking HMR runs in production.** It's development only. Production files are built once and don't change.
- **Trusting stale state after big edits.** If something looks odd after many hot updates, do a real refresh.
- **Expecting a backend to keep in-memory data across `--watch` restarts.** Each restart is a fresh process.

## 🗣️ How to answer in an interview

> "HMR — hot module replacement — lets the dev server update the running page without a full reload. When I save a file, the watcher notices, the dev server recompiles just that module, and it walks the module graph to find a module that accepts the update. Then it sends a message over a WebSocket the page keeps open, and the browser imports the new version of that module. For React, Fast Refresh re-renders the component with its existing state, so a counter or a half-filled form keeps its values.
>
> If nothing accepts the update — for example when I edit the entry file — it falls back to a full reload. CSS changes are just swapped in place. On the backend there's no HMR; I use `node --watch` or nodemon, which restart the whole process, so in-memory state is lost."

[FILL IN: your daily dev setup — e.g. webpack dev server with hot reload for the frontend, and how you restarted backend services locally. Only if you know.]

## 🔁 Follow-up questions

### Why does the new module URL have `?t=…` on it?

It's a timestamp to **bust the cache**. The browser treats it as a new URL, so it downloads the fresh code instead of reusing the old module.

### Why did my state reset after I saved?

Common reasons: the file exports something that isn't a component, you changed hook order, or the edit was in a file above the component that nothing could accept. Then Fast Refresh does a remount or a full reload.

### Does HMR work with Redux or Context state?

Yes. Store and context state live outside the edited component, so they survive a component swap. Editing the store file itself may cause a full reload.

### How is this different from what a production deploy does?

A deploy builds new hashed files once and users load them on their next visit. Nothing is pushed into open pages, and there's no WebSocket. See [minification and hashed files](topic:web-fundamentals/minify-sourcemaps).

## ✅ Quick check

### 1. You edit `src/main.jsx` in a Vite React app. What message does the browser get?

:::answer
**`full-reload`.** The entry file has no parent to accept the update, so the whole page reloads.
:::

### 2. A counter shows 7. You change the button text in that component and save. With React Fast Refresh, what does it show?

:::answer
**The new text, still showing 7.** Fast Refresh swaps the component code but keeps its state.
:::

### 3. True or false: `node --watch` hot-swaps the changed module inside the running server.

:::answer
**False.** It restarts the whole Node process. Memory and state from the old process are gone.
:::
