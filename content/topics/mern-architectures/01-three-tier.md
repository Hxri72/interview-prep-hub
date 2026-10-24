---
title: The 3-tier architecture of a MERN app
stack: mern-architectures
order: 1
level: Basic
mustKnow: true
askedFrequency: very common
template: pattern
section: Foundations
summary:
  - "A MERN app has three tiers (layers): the React frontend, the Node + Express backend, and the MongoDB database."
  - Each tier has one job. React shows the screen, Express runs the rules, MongoDB stores the data.
  - Tiers talk only to their neighbour. React never talks to MongoDB directly; it always goes through the Express API.
  - The backend is the safe place for secrets, checks and business rules, because users can read and change anything in the browser.
  - Almost every other MERN architecture (SSR, microservices, serverless) is this same 3-tier idea, split or moved around.
cards:
  - q: What are the three tiers of a MERN app?
    a: "Presentation tier = React in the browser, application tier = Node.js + Express API, data tier = MongoDB."
  - q: Why can't React talk to MongoDB directly?
    a: The database password would be in the browser for anyone to steal, and users could skip all your checks. The API sits in the middle and protects the data.
  - q: How do the React and Express tiers talk?
    a: Over HTTP, usually with JSON. React calls fetch or axios, Express answers with a status code and JSON.
  - q: Where should business rules and validation live?
    a: In the backend tier. Frontend checks are only for a nicer user experience; the backend must check again.
---

## 💡 What is it?

A MERN app is split into **three tiers**. A tier is one layer with one job.

- **React** (the frontend) shows the screen and handles clicks.
- **Node.js + Express** (the backend) receives requests, checks them and runs the business rules.
- **MongoDB** (the [database](glossary:database)) stores the data.

Each tier only talks to the tier next to it. This simple split is called the **3-tier architecture**.

## 🏠 Real-life example

Think of **a restaurant**.

- **The dining area and menu** = React. This is what the customer sees and touches.
- **The waiter and the kitchen** = Express. They take the order, check it ("we have no fish today"), and prepare the food.
- **The store room** = MongoDB. It keeps all the ingredients safe.
- **The customer never walks into the store room.** In the same way, the browser never opens the database directly. It always asks the API (the waiter).

If the restaurant gets busy, you can add more waiters without moving the store room. Tiers can grow on their own.

## 🗺️ The diagram

```text
 ┌──────────────────────┐   HTTP + JSON    ┌──────────────────────┐   MongoDB driver   ┌──────────────────────┐
 │  TIER 1: Presentation│  ─────────────▶  │  TIER 2: Application │  ───────────────▶  │  TIER 3: Data        │
 │  React in the browser│                  │  Node.js + Express   │                    │  MongoDB             │
 │  (screens, clicks)   │  ◀─────────────  │  (routes, rules,     │  ◀───────────────  │  (collections of     │
 │                      │   200 + JSON     │   validation, auth)  │   documents        │   documents)         │
 └──────────────────────┘                  └──────────────────────┘                    └──────────────────────┘
        runs on the user's device              runs on your server                         runs on a DB server
```

## 🧑‍💻 Code example

This tiny app lists and adds tasks. It needs MongoDB running on your laptop, or a free MongoDB Atlas link.

Backend set-up:

```bash
mkdir api && cd api
npm init -y
npm install express mongoose cors
```

Save this as `api/server.js`. Run it with `node server.js`.

```js
const express = require('express');                                  // tier 2: the web framework
const mongoose = require('mongoose');                                // talks to tier 3 (MongoDB)
const cors = require('cors');                                        // lets the React app on another port call us

const Task = mongoose.model('Task', new mongoose.Schema({ title: String })); // a "tasks" collection with one field

const app = express();                                               // create the Express app
app.use(cors({ origin: 'http://localhost:5173' }));                  // 5173 = Vite's dev port (tier 1)
app.use(express.json());                                             // read JSON bodies from the browser

app.get('/api/tasks', async (req, res) => {                          // GET = read all tasks
  res.json(await Task.find());                                       // ask MongoDB, send the list as JSON
});                                                                  // end of GET route

app.post('/api/tasks', async (req, res) => {                         // POST = add a task
  if (!req.body.title) return res.status(400).json({ error: 'title is required' }); // 400 = bad request; rules live here
  res.status(201).json(await Task.create({ title: req.body.title })); // 201 = created; save, then send it back
});                                                                  // end of POST route

mongoose.connect('mongodb://127.0.0.1:27017/tasksdb')                // 27017 = MongoDB's default port; tasksdb = database name
  .then(() => app.listen(4000, () => console.log('API on 4000')));   // start the API on port 4000 after the DB connects
```

Frontend: create it with `npm create vite@latest web -- --template react`, then put this in `web/src/App.jsx`. Run `npm run dev` inside `web`.

```jsx
import { useEffect, useState } from 'react';                         // React hooks for state and side effects

export default function App() {                                      // tier 1: the screen
  const [tasks, setTasks] = useState([]);                            // [] = start with an empty list
  useEffect(() => {                                                  // run once when the page opens
    fetch('http://localhost:4000/api/tasks')                         // call tier 2 over HTTP
      .then((r) => r.json())                                         // read the JSON body
      .then(setTasks);                                               // put the tasks into state
  }, []);                                                            // [] = run only once
  return (                                                           // what to show
    <ul>{tasks.map((t) => <li key={t._id}>{t.title}</li>)}</ul>       // one <li> per task; _id comes from MongoDB
  );                                                                 // end of return
}                                                                    // end of App
```

Add a task from the terminal and refresh the page:

```text
$ curl -X POST -H "Content-Type: application/json" -d '{"title":"Revise closures"}' http://localhost:4000/api/tasks
{"title":"Revise closures","_id":"6718...","__v":0}
```

## 🔍 Deeper version

**The three tiers, in technical words:**

| Tier | MERN part | Main job | Where it runs |
|---|---|---|---|
| Presentation | React (+ router, state library) | UI, user input, calling the API | The user's browser |
| Application (logic) | Node.js + Express | Routing, validation, auth, business rules | Your server, container or Lambda |
| Data | MongoDB (+ Mongoose) | Storing and querying documents | A database server or MongoDB Atlas |

**"Tier" vs "layer".** People mix these words. Strictly, a **tier** is a separate running place (browser, server, DB server). A **layer** is a split inside the code, like controller → service → repository. The backend tier usually has layers inside it. See [layered architecture](topic:mern-architectures/layered).

**The contract between tiers.** React and Express agree on an [API](glossary:api): URLs, methods, request bodies and JSON responses. This is usually REST. As long as the contract stays the same, you can rewrite one tier without touching the others. See [what REST is](topic:rest-auth/what-is-rest).

**Why the middle tier matters:**
- **Secrets stay on the server.** The database password lives in an [environment variable](glossary:environment-variable) on the server, never in the browser.
- **Trust.** Anyone can change browser code with DevTools. So validation and permission checks must run in Express.
- **One source of rules.** A web app, a mobile app and a partner system can all use the same API.

**Scaling each tier separately.**
- React files are static, so a [CDN](glossary:cdn) serves them cheaply.
- The API is [stateless](topic:system-design/load-balancers-stateless) (it keeps no user data in memory), so you can run many copies behind a load balancer.
- MongoDB scales with indexes, replica sets and sharding.

**Everything else is a variation.** SSR moves some React work to the server. [Microservices](topic:mern-architectures/microservices) split tier 2 into many small services. [Serverless](topic:mern-architectures/serverless-mern) runs tier 2 as functions. The three jobs stay the same.

## ⚖️ Pros and cons

| Pros | Cons |
|---|---|
| Clear jobs: UI, logic and data are separate | More moving parts than a single script |
| Secrets and rules stay safe on the server | Every screen needs an API call, so you must handle loading and errors |
| Each tier can scale on its own | Network calls between tiers add a little delay |
| You can swap one tier (say, a new UI) without rewriting the rest | Two codebases to keep in sync (API contract) |
| Easy for a team to split work: frontend and backend developers | CORS set-up is needed when tiers run on different domains |

## 🎯 When to choose it

- **Almost always.** This is the default shape for any MERN app: a to-do app, a college project, a job portal or a SaaS product.
- **When you need a mobile app later.** The same API serves both the web and the mobile app.
- **When frontend and backend people work in parallel.** They agree on the API and work separately.
- **The only real question is how to run the tiers.** One server, or separate deployments? See [one server vs separate](topic:mern-architectures/one-server-vs-separate).

## ⚠️ Common mistakes

- **Putting the MongoDB connection string in React.** Anything in the browser is public. Only the backend should know it.
- **Trusting frontend validation.** A user can skip it with curl or DevTools. Always validate again in Express.
- **Putting business rules in React.** For example, calculating the final price in the browser. Someone can change it. Calculate it on the server.
- **Mixing up tiers and layers.** In an interview, say "3 tiers" for browser / server / database, and "layers" for the code structure inside the server.

## 🗣️ How to answer in an interview

> "A MERN app follows a 3-tier architecture. The presentation tier is React running in the browser. The application tier is Node.js with Express, which exposes a REST API. The data tier is MongoDB, which I access through Mongoose.
>
> React talks only to the API over HTTP with JSON. It never talks to the database. That keeps secrets on the server, and it means validation, authentication and business rules all run in a place the user can't change.
>
> Each tier can also scale on its own. The React build can sit on a CDN, the API can run as many stateless copies, and MongoDB scales with indexes and replicas. At SkillKeepr it's the same idea: React frontends on S3 and CloudFront, a Node.js and TypeScript backend on AWS Lambda behind API Gateway, and MongoDB as the data tier."

## 🔁 Follow-up questions

### What's the difference between a tier and a layer?

A tier is a separate place where code runs: the browser, the API server, the database server. A layer is a split inside one codebase, like routes, services and models. One tier can have many layers.

### Can React connect to MongoDB directly?

It shouldn't. The connection string would be visible to everyone, and users could read or delete any data. A normal MERN app always goes through its own API.

### Is MERN always 3-tier?

The jobs are always three. But how you run them can change. With Next.js, the UI and the API can live in one project. With microservices, the API tier is split into many services. See the [decision guide](topic:mern-architectures/decision-guide).

### Where does authentication fit in the 3 tiers?

The login screen is in React. The checking of the password and the creation of the token or session happen in Express. The user record lives in MongoDB. The browser only keeps a cookie or token. See [auth designs](topic:mern-architectures/auth-designs).

## ✅ Quick check

### 1. Which tier should check that a product's price is not negative?

- A) React only
- B) Express only
- C) Both, but Express must always check

:::answer
**C.** React can check to show a quick message, but the user can skip that. Express must check every time, because it's the tier you control.
:::

### 2. Where should the MongoDB connection string be stored?

:::answer
In an environment variable on the **backend server**. Never in React code, because everything in the browser is public.
:::

### 3. True or false: in a 3-tier app, you can redesign the React UI without changing the database.

:::answer
**True.** As long as the API contract stays the same, the other tiers don't need to change.
:::
