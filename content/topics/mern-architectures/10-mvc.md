---
title: MVC in Express
stack: mern-architectures
order: 10
level: Basic
mustKnow: true
askedFrequency: very common
template: pattern
section: Backend structure
summary:
  - "MVC = Model, View, Controller. It splits the code into data (Model), what the user sees (View) and the glue that handles requests (Controller)."
  - "In a MERN API, the Model is a Mongoose model, the Controller is an Express handler, and the View is the JSON response (React is the real view)."
  - "Routes map a URL to a controller. The controller reads the request, calls the model, and sends a response."
  - "It is the most common starting structure for Express apps. As the app grows, add a service layer so controllers stay thin."
cards:
  - q: What does MVC stand for?
    a: Model (data and rules), View (what the user sees), Controller (handles the request and connects the two).
  - q: In a MERN app, what is the View?
    a: For the Express API, the View is the JSON it sends back. The real UI is the React app.
  - q: What goes in an Express controller?
    a: Read req (params, query, body), call the model or service, and send res with the right status code.
  - q: What is a "fat controller" and why is it bad?
    a: A controller full of business logic and DB queries. It is hard to test and reuse; move that logic into services or models.
---

## 💡 What is it?

**MVC** stands for **Model, View, Controller**. It's a way to split backend code into three jobs.

- **Model**: the data and its rules. In MERN, a Mongoose model.
- **View**: what the user gets back. For an API, the JSON.
- **Controller**: the glue. It takes the request, asks the model, and sends the view.

## 🏠 Real-life example

Think of a **restaurant**.

- **The waiter** = the controller. They take your order and bring your food.
- **The kitchen and the store room** = the model. Food (data) is stored and prepared there, with rules (no raw chicken!).
- **The plate on your table** = the view. It's what you finally see.
- **The menu board with table numbers** = the routes. They tell which waiter handles which order.

The waiter doesn't cook. The cook doesn't talk to customers. Each has one job.

## 🗺️ The diagram

```text
React app (the real UI)
   │  fetch('/api/jobs')
   ▼
Express ── routes/jobRoutes.js ──▶ controllers/jobController.js ──▶ models/Job.js ──▶ MongoDB
              (URL → which          (read req, call model,          (Mongoose schema
               controller)           send JSON = the "view")          + rules)
   ◀────────────────────────── JSON response ◀──────────────────────────
```

Folders:

```text
src/
  models/Job.js
  controllers/jobController.js
  routes/jobRoutes.js
  app.js
```

## 🧑‍💻 Code example

Set up:

```bash
npm init -y
npm install express mongoose
```

Start MongoDB locally (or use an Atlas connection string). Save the files below, then run `node src/app.js`.

`src/models/Job.js`: the **Model**.

```js
const mongoose = require('mongoose');                        // load Mongoose (talks to MongoDB)
const jobSchema = new mongoose.Schema({                      // the shape and rules of a job
  title: { type: String, required: true },                   // required = must be present
  salary: { type: Number, min: 0 },                          // min: 0 = no negative salary
});                                                          // end of schema
module.exports = mongoose.model('Job', jobSchema);           // 'Job' → the "jobs" collection
```

`src/controllers/jobController.js`: the **Controller**.

```js
const Job = require('../models/Job');                        // the controller uses the model

exports.list = async (req, res) => {                         // GET /api/jobs
  const jobs = await Job.find().limit(20);                   // ask the model; 20 = max items
  res.json(jobs);                                            // the "view": JSON back to React
};                                                           // end of list

exports.create = async (req, res) => {                       // POST /api/jobs
  const job = await Job.create(req.body);                    // the model checks the rules and saves
  res.status(201).json(job);                                 // 201 = created
};                                                           // end of create
```

`src/routes/jobRoutes.js`: maps URLs to controllers.

```js
const router = require('express').Router();                  // a mini router
const jobs = require('../controllers/jobController');        // load the controller
router.get('/', jobs.list);                                  // GET /  → list
router.post('/', jobs.create);                               // POST / → create
module.exports = router;                                     // export it
```

`src/app.js`: puts it together.

```js
const express = require('express');                          // load Express
const mongoose = require('mongoose');                        // load Mongoose
const app = express();                                       // create the app
app.use(express.json());                                     // read JSON bodies
app.use('/api/jobs', require('./routes/jobRoutes'));         // all /api/jobs URLs go to these routes

mongoose.connect('mongodb://127.0.0.1:27017/mvcdemo')        // connect; mvcdemo = database name
  .then(() => app.listen(3000, () => console.log('API on 3000'))); // start only after the DB is ready
```

```text
$ curl -X POST -H "Content-Type: application/json" -d '{"title":"React Dev","salary":50000}' localhost:3000/api/jobs
{"title":"React Dev","salary":50000,"_id":"...","__v":0}
```

Express 5 passes errors from `async` handlers to the error handler for you. So a failed `Job.create` doesn't crash the app. See [async errors](topic:express/async-errors).

## 🔍 Deeper version

**Classic MVC vs API MVC.** Classic MVC apps render HTML views on the server (for example, EJS or Pug templates). In MERN, React is the view. So the Express "view" is just the JSON response.

**What goes where:**

| Part | Holds | Must not hold |
|---|---|---|
| Route | URL + method → controller, middleware list | logic |
| Controller | read `req`, call model/service, pick status code | big business rules, raw DB tricks |
| Model | schema, validation, small helpers (`virtuals`, `methods`) | HTTP things like `req`/`res` |

**Fat controllers.** In small apps, controllers grow. They check rules, call other APIs, send emails and query the DB. That code is hard to test, because you need a fake `req` and `res`. The usual next step is a **service layer**. See [layered architecture](topic:mern-architectures/layered).

**Middleware fits around controllers.** Auth, validation and logging run **before** the controller in the route: `router.post('/', auth, validate(jobSchema), jobs.create)`. See [middleware](topic:express/middleware).

## ⚖️ Pros and cons

| Pros | Cons |
|---|---|
| Very easy to learn; most tutorials use it | Controllers get fat as the app grows |
| Clear place for each file type | Business logic has no clear home |
| Good for small and medium CRUD APIs | Folders by type spread one feature across many folders |
| Easy for new developers to find code | Testing logic needs fake `req`/`res` |

## 🎯 When to choose it

- **Your first Express API**, a college project, or a small CRUD app (a todo app, a blog API).
- **A small team** that wants a simple, familiar structure.
- **Upgrade to layered** (controller → service → repository) when controllers pass about 50 lines or the same logic repeats.

## ⚠️ Common mistakes

- **Putting all logic in the controller.** Move rules into services.
- **Passing `req`/`res` into models.** Models shouldn't know about HTTP.
- **Wrong status codes.** Create = `201`, not found = `404`, bad input = `400`.
- **No error handling in older Express 4 code.** A rejected promise in an async handler can hang the request. Use Express 5 or an async wrapper.

## 🗣️ How to answer in an interview

> "MVC splits the code into Model, View and Controller. In a MERN API the Model is the Mongoose schema and model, with validation. The Controller is the Express handler: it reads the request, calls the model and sends the response. The View is the JSON, because React is the real UI.
>
> Routes map URLs to controllers, and middleware like auth and validation run before them.
>
> MVC is a good start. But controllers get fat, so in bigger apps I add a service layer for business logic. Then controllers only deal with HTTP and services are easy to unit test."

## 🔁 Follow-up questions

### Where does validation belong in MVC?

Two places. Request validation (is the body shaped right?) goes in middleware, for example Joi. Data rules (salary can't be negative) go in the model schema.

### Is React part of MVC?

From the backend's view, React is the "View" layer. Inside React itself, people don't usually use MVC terms. They talk about components and state.

### How would you test an MVC controller?

Either call it with fake `req` and `res` objects, or test the whole route with Supertest. Supertest is usually simpler. See [Supertest](topic:express/supertest).

## ✅ Quick check

### 1. Which file should hold `required: true` for a job title?

- A) the route
- B) the controller
- C) the model

:::answer
**C) the model.** Data rules belong in the Mongoose schema.
:::

### 2. In a MERN API, what is the "View"?

:::answer
The **JSON response** that Express sends. The actual UI is the React app.
:::
