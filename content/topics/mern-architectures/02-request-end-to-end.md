---
title: "One request end to end: React → Express → MongoDB"
stack: mern-architectures
order: 2
level: Basic
mustKnow: true
askedFrequency: very common
template: pattern
section: Foundations
summary:
  - "A click in React becomes an HTTP request, goes through Express middleware and a route, becomes a MongoDB query, and comes back as JSON."
  - "The order inside Express is: CORS → body parsing → auth → validation → route handler → database → response (or the error handler)."
  - React shows three states for every request - loading, success and error.
  - Every step can fail, so each one needs a clear status code and error message.
  - Being able to walk through this path is one of the most common MERN interview questions.
cards:
  - q: What happens when a user clicks "Save" in a MERN app?
    a: "React sends a fetch POST with JSON → Express middleware (CORS, JSON parsing, auth, validation) → route handler → Mongoose saves to MongoDB → Express sends 201 + JSON → React updates the state and the screen."
  - q: What does express.json() do?
    a: It reads the JSON text in the request body and turns it into a JavaScript object on req.body.
  - q: Which three UI states should every API call handle?
    a: Loading, success and error.
  - q: Where are errors from any step caught in Express 5?
    a: In the error-handling middleware. Express 5 also passes rejected promises from async handlers to it automatically.
---

## 💡 What is it?

This page follows **one click** all the way through a MERN app and back.

The user clicks "Save". React sends a request. Express checks it and asks MongoDB to save the data. MongoDB answers, Express replies, and React updates the screen.

If you can explain this path step by step, you understand how the whole stack fits together.

## 🏠 Real-life example

Think of **sending a parcel by courier**.

- **You fill the form and hand over the parcel** = React builds the request and calls `fetch`.
- **The security check at the counter** = CORS and auth middleware. "Are you allowed to send this?"
- **Checking the address is complete** = validation. "Pin code missing? Rejected."
- **The sorting office** = the route handler. It decides where the parcel goes.
- **The warehouse** = MongoDB. The parcel is stored there.
- **The receipt with a tracking number** = the response: `201` and the saved record with its `_id`.
- **You see the receipt and smile** = React updates the screen.

## 🗺️ The diagram

```text
 BROWSER (React)                      SERVER (Express)                               DATABASE
 ───────────────                      ────────────────                               ────────
 1. user clicks "Save"
 2. setLoading(true)
 3. fetch POST /api/notes  ───────▶  4. cors()          → is this origin allowed?
    body: {"text":"Hi"}              5. express.json()  → body text → req.body object
                                     6. auth            → who is the user? (401 if none)
                                     7. validate        → is text present? (400 if not)
                                     8. route handler   → Note.create(...)  ─────────▶  9. insert document
                                                                              ◀─────────  10. saved doc with _id
                                     11. res.status(201).json(note)
 12. response arrives  ◀──────────
 13. add note to state, setLoading(false) → screen re-renders

 Any error in 4–10  →  error-handling middleware  →  { error: "..." } with 4xx/5xx  →  React shows the message
```

## 🧑‍💻 Code example

Set up an API folder with `npm init -y` and `npm install express mongoose cors`. MongoDB must be running locally.

Save this as `server.js`. Run it with `node server.js`.

```js
const express = require('express');                                  // the web framework
const mongoose = require('mongoose');                                // MongoDB library
const cors = require('cors');                                        // allows calls from the React dev server

const Note = mongoose.model('Note', new mongoose.Schema({            // the "notes" collection
  text: { type: String, required: true },                            // required: true = Mongoose also checks it
  userId: String,                                                    // who wrote the note
}));                                                                 // end of the model

const app = express();                                               // create the app
app.use(cors({ origin: 'http://localhost:5173' }));                  // step 4: only our React app may call us
app.use(express.json());                                             // step 5: JSON text → req.body

function auth(req, res, next) {                                      // step 6: a fake login check for the demo
  const user = req.get('x-user');                                    // real apps read a cookie or JWT instead
  if (!user) return res.status(401).json({ error: 'Please log in' }); // 401 = not logged in
  req.user = { id: user };                                           // remember who is calling
  next();                                                            // go to the next step
}                                                                    // end of auth

function validateNote(req, res, next) {                              // step 7: check the input
  if (!req.body.text?.trim()) return res.status(400).json({ error: 'text is required' }); // 400 = bad input
  next();                                                            // input is fine, continue
}                                                                    // end of validateNote

app.post('/api/notes', auth, validateNote, async (req, res) => {     // step 8: the route handler
  const note = await Note.create({ text: req.body.text, userId: req.user.id }); // steps 9–10: save in MongoDB
  res.status(201).json(note);                                        // step 11: 201 = created, send it back
});                                                                  // end of the route

app.use((err, req, res, next) => {                                   // the error handler (4 arguments)
  console.error(err);                                                // log the real error for us
  res.status(500).json({ error: 'Something went wrong' });           // 500 = server error; hide details from users
});                                                                  // end of the error handler

mongoose.connect('mongodb://127.0.0.1:27017/notesdb')                // connect to the local database "notesdb"
  .then(() => app.listen(4000, () => console.log('API on 4000')));   // then start listening on port 4000
```

In the React app (`npm create vite@latest web -- --template react`), save this as `src/AddNote.jsx` and render it from `App.jsx`.

```jsx
import { useState } from 'react';                                    // state hook

export default function AddNote() {                                  // a small form component
  const [text, setText] = useState('');                              // '' = empty input at the start
  const [status, setStatus] = useState('idle');                      // idle | loading | done | error
  const [error, setError] = useState('');                            // the error message to show

  async function save() {                                            // steps 1–3 and 12–13
    setStatus('loading');                                            // 2: show "Saving..."
    const res = await fetch('http://localhost:4000/api/notes', {     // 3: send the request
      method: 'POST',                                                // POST = create something
      headers: { 'Content-Type': 'application/json', 'x-user': 'asha' }, // tell Express the body is JSON; fake user
      body: JSON.stringify({ text }),                                // the object → JSON text
    });                                                              // end of fetch options
    const data = await res.json();                                   // 12: read the JSON reply
    if (!res.ok) { setError(data.error); setStatus('error'); return; } // res.ok = status 200–299
    setText(''); setStatus('done');                                  // 13: clear the box, show success
  }                                                                  // end of save

  return (                                                           // the UI
    <div>                                                            {/* the form wrapper */}
      <input value={text} onChange={(e) => setText(e.target.value)} /> {/* controlled input */}
      <button onClick={save} disabled={status === 'loading'}>Save</button> {/* disabled while saving */}
      {status === 'loading' && <p>Saving...</p>}                     {/* loading state */}
      {status === 'done' && <p>Saved ✅</p>}                          {/* success state */}
      {status === 'error' && <p style={{ color: 'red' }}>{error}</p>} {/* error state */}
    </div>                                                           // end of the wrapper
  );                                                                 // end of return
}                                                                    // end of AddNote
```

Try saving an empty note, then a real one:

```text
Empty box  → "text is required"   (400 from validateNote)
"Hi"       → "Saved ✅"            (201 from the route; a new document in notesdb.notes)
```

## 🔍 Deeper version

**Before the request even reaches Express:**
1. The browser looks up the domain name (DNS) and opens a connection (TCP + TLS for HTTPS).
2. If React runs on another origin (port or domain), the browser may first send an `OPTIONS` **preflight** request. CORS middleware must answer it, or the real request never goes out.

See [what happens when you type a URL](topic:system-design/what-happens-url) and [CORS and preflight](topic:rest-auth/headers-cors-preflight).

**Inside Express, order matters.** [Middleware](glossary:middleware) runs top to bottom. If `express.json()` comes after your route, `req.body` is `undefined`. If auth comes after the handler, the handler runs for everyone.

**Inside Mongoose:** `Note.create()` runs schema validation, then any `pre('save')` hooks, then sends an insert command to MongoDB over a connection pool (a set of open connections that get reused). MongoDB adds the `_id` and writes the document.

**Errors at each step:**

| Step | Typical failure | Status code |
|---|---|---|
| CORS | Origin not allowed | Browser blocks it; no useful status in JS |
| JSON parsing | Broken JSON body | 400 |
| Auth | No or expired token | 401 |
| Permission | Logged in, but not allowed | 403 |
| Validation | Missing or wrong fields | 400 or 422 |
| Database | Duplicate key, DB down | 409 or 500 |

:::version[Version note]
In **Express 5**, if an `async` route handler throws or its promise rejects, Express sends the error to your error middleware automatically. In Express 4, you needed a try/catch or a wrapper. See [Express 5 changes](topic:express/express-5).
:::

**Back in React:** setting state after the response makes React re-render. Libraries like React Query handle loading, error, retry and caching for you. See [server state vs client state](topic:mern-architectures/server-vs-client-state).

## ⚖️ Pros and cons

This path is the same in almost every MERN app. The trade-offs are about how you build it.

| Choice | Pros | Cons |
|---|---|---|
| Middleware chain (cors → json → auth → validate → handler) | Each step is small, reusable and testable | Wrong order causes confusing bugs |
| Central error handler | One consistent error format | Must remember to pass errors on (Express 4) |
| Manual `fetch` + state in React | No extra library, easy to understand | Repeated loading/error code on every screen |
| React Query / RTK Query | Caching, retries and loading states for free | One more library to learn |

## 🎯 When to choose it

- **Every MERN feature** follows this path: login, saving a form, loading a list.
- **In an interview**, use this walk-through when asked "What happens when a user clicks a button in your app?"
- **When debugging**, follow the same steps. Check the Network tab first (did the request leave?), then server logs (which step failed?), then the database.

## ⚠️ Common mistakes

- **Forgetting `Content-Type: application/json`.** Then `express.json()` skips the body and `req.body` is empty.
- **Putting `express.json()` after the routes.** Middleware order matters.
- **Not checking `res.ok` in fetch.** `fetch` only rejects on network failure. A `400` or `500` still "succeeds", so you must check the status yourself.
- **Showing raw server errors to users.** Log the full error on the server; send a short, safe message to the browser.

## 🗣️ How to answer in an interview

> "When the user clicks Save, React sets a loading state and sends a fetch or axios POST with a JSON body. If the frontend is on another origin, the browser may send a CORS preflight first.
>
> In Express, the request goes through the middleware chain in order: CORS, then `express.json()` to parse the body, then auth to read the token or cookie, then validation. If everything passes, the route handler calls a service, which uses Mongoose to save the document in MongoDB.
>
> Express replies with 201 and the saved JSON. React reads it, updates state, and the component re-renders. If any step fails, the error goes to the central error handler, which returns a consistent JSON error with the right status code, like 400, 401 or 500. React then shows the error state. At SkillKeepr the path is the same idea, but the backend runs on Lambda behind API Gateway, and inputs are validated with Joi."

## 🔁 Follow-up questions

### Why does fetch not throw on a 404 or 500?

`fetch` only rejects when the request can't complete at all, like no network. Any HTTP reply, even 500, counts as a response. So you check `res.ok` or `res.status` yourself. Axios is different: it throws for non-2xx statuses by default.

### What is a preflight request?

Before some cross-origin requests (like POST with JSON), the browser sends an `OPTIONS` request to ask "may I?". The server must reply with the right CORS headers. Only then does the browser send the real request.

### Where would you add logging to trace a request?

Add a middleware at the top that gives each request an ID and logs method, URL, status and time taken. Pass that ID to the service logs too. Then you can follow one request across all steps. See [logging](topic:express/logging).

### What if the database is slow?

The request waits at step 9. Set a timeout, add the right index, and show a loading state in React. If it's very slow work, move it to a background job. See [event-driven backends with queues](topic:mern-architectures/event-driven-queues).

## ✅ Quick check

### 1. Put these in the right order: route handler, express.json(), auth, cors()

:::answer
`cors()` → `express.json()` → `auth` → route handler.
:::

### 2. The API returns 400. What does this code print?

```js
const res = await fetch('/api/notes', { method: 'POST' }); // the server replies 400
console.log('ok?', res.ok);                                 // print whether the status was 200–299
```

:::answer
`ok? false`. There's no exception. `fetch` resolved normally, but `res.ok` is false because 400 is not in the 200–299 range.
:::

### 3. Which step returns 401, and which returns 400?

:::answer
**Auth** returns **401** (not logged in). **Validation** returns **400** (bad input).
:::
