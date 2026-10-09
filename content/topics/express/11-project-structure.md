---
title: "Project structure: routes → controllers → services → models"
stack: express
order: 11
level: Intermediate
mustKnow: true
askedFrequency: very common
summary:
  - Split an Express app into layers, each with one job — routes (URLs), controllers (HTTP in/out), services (business rules), models (database).
  - "A request flows down: route → middleware → controller → service → model. The answer flows back up."
  - Controllers know about req and res. Services do NOT — they take plain values and return plain values, so they are easy to test and reuse.
  - Common folders — config, routes, controllers, services, models, middleware, utils, plus app.js (the app) and server.js (starts it).
  - Bigger apps often group by feature (users/, billing/) instead of by layer. Either way, keep the same layers inside.
cards:
  - q: Name the main layers of a layered Express app.
    a: Routes (which URL goes where), controllers (read the request, send the response), services (business logic), models or repositories (talk to the database).
  - q: Why shouldn't a service use req and res?
    a: Then it can be reused from other places (a cron job, a queue worker, another service) and tested without fake HTTP objects. It just takes data in and returns data.
  - q: What goes in a controller?
    a: Read params, query and body; call the right service; choose the status code; send the response. No database queries and no big business rules.
  - q: Why split app.js and server.js?
    a: app.js builds and exports the Express app. server.js imports it and calls listen. Tests (Supertest) can import the app without starting a real server.
  - q: Layer-based vs feature-based folders?
    a: "Layer-based: controllers/, services/… — simple for small apps. Feature-based: users/, billing/ each with its own routes, controller, service — scales better in big apps."
---

## 💡 What is it?

**Project structure** is how you split your Express code into folders and files.

The common way is **layers**. Each layer has **one job**:
- **routes**: which URL goes to which function
- **controllers**: read the request and send the response
- **services**: the business rules (the real "thinking")
- **models**: talk to the database

A request goes **down** through the layers. The answer comes back **up**.

## 🏠 Real-life example

Think of a **restaurant**.

- The **menu card** tells you what you can order. That's the **routes**: `GET /dishes`, `POST /orders`.
- The **waiter** takes your order, and later brings your plate. That's the **controller**. The waiter talks to customers, but doesn't cook.
- The **chef** decides how to make the dish: the recipe, the rules, the order of steps. That's the **service**. The chef never talks to customers directly.
- The **store room** holds the raw items. That's the **model** (the database).
- The **security guard at the door** checks people before they enter. That's **middleware** (auth, validation).

If the waiter also cooked and also bought vegetables, the restaurant would be chaos. Each person doing one job keeps it fast and clean.

## 🧑‍💻 Code example

Make a folder, run `npm init -y` and `npm install express`. Create these files, then run `node server.js`.

```text
my-api/
├── server.js                  ← starts the server
└── src/
    ├── app.js                 ← builds the Express app
    ├── routes/user.routes.js
    ├── controllers/user.controller.js
    ├── services/user.service.js
    └── models/user.model.js
```

```js
// ----- src/models/user.model.js — talks to the "database" -----
const users = [{ id: 1, name: 'Hari', email: 'hari@example.com' }];      // a fake database table (an array)
exports.findById = async (id) => users.find((u) => u.id === id);       // find one user by id
exports.findByEmail = async (email) => users.find((u) => u.email === email); // find one user by email
exports.create = async (data) => {                                       // add a new user
  const user = { id: users.length + 1, ...data };                        // give it the next id
  users.push(user);                                                      // save it in the array
  return user;                                                           // give back the saved user
};                                                                       // end of create

// ----- src/services/user.service.js — business rules, no req/res -----
const User = require('../models/user.model');                            // the service uses the model
exports.getUser = async (id) => User.findById(id);                       // simple: just fetch the user
exports.register = async ({ name, email }) => {                          // takes plain data, not req
  if (await User.findByEmail(email)) throw new Error('Email already used'); // a business rule: emails must be unique
  return User.create({ name, email });                                   // rule passed → save the user
};                                                                       // end of register

// ----- src/controllers/user.controller.js — HTTP in, HTTP out -----
const userService = require('../services/user.service');                 // the controller uses the service
exports.getUser = async (req, res) => {                                  // handles GET /users/:id
  const user = await userService.getUser(Number(req.params.id));         // read the id from the URL, ask the service
  if (!user) return res.status(404).json({ message: 'Not found' });      // 404 = no such user
  res.json(user);                                                        // 200 + the user as JSON
};                                                                       // end of getUser
exports.register = async (req, res) => {                                 // handles POST /users
  const user = await userService.register(req.body);                     // pass the body data to the service
  res.status(201).json(user);                                            // 201 = "created"
};                                                                       // end of register

// ----- src/routes/user.routes.js — URL → controller -----
const router = require('express').Router();                              // a mini app just for /users
const ctrl = require('../controllers/user.controller');                  // the controller functions
router.get('/:id', ctrl.getUser);                                        // GET /users/:id → getUser
router.post('/', ctrl.register);                                         // POST /users → register
module.exports = router;                                                 // share the router with app.js

// ----- src/app.js — builds the app, does NOT listen -----
const express = require('express');                                      // load Express
const app = express();                                                   // create the app
app.use(express.json());                                                 // read JSON request bodies into req.body
app.use('/users', require('./routes/user.routes'));                      // every /users URL goes to the user router
module.exports = app;                                                    // export it (tests can import this)

// ----- server.js — starts the server -----
const server = require('./src/app');                                     // import the ready-made app
server.listen(3000, () => console.log('API on port 3000'));              // start listening on port 3000
```

```text
$ curl http://localhost:3000/users/1
{"id":1,"name":"Hari","email":"hari@example.com"}

$ curl -X POST http://localhost:3000/users -H "Content-Type: application/json" -d '{"name":"Anu","email":"anu@example.com"}'
{"id":2,"name":"Anu","email":"anu@example.com"}    ← status 201
```

(Each `// -----` block is a separate file. In a real app, add the [error handler](topic:express/error-middleware) in `app.js` too.)

## 🔍 Deeper version

**The flow of one request:**

```text
HTTP request
  → app.js        (global middleware: json, cors, helmet, logging)
  → routes        (match the URL + route middleware: auth, validation)
  → controller    (read req, call service, send res)
  → service       (business rules, can call several models or other services)
  → model / repo  (the database query)
  ← back up the same way, and the controller sends the response
```

**The golden rule: dependencies point down.** A controller may use a service. A service may use a model. A model must **never** import a controller. A service must **never** touch `req` or `res`.

**Why services must not know about HTTP.** The same "register user" logic may be needed from many places:
- an HTTP route,
- a CSV import script,
- a queue worker or a [webhook](glossary:webhook) handler,
- a unit test.

If the service only takes plain values and returns plain values, all of these can call it. If it reads `req.body`, only HTTP can.

**Repository layer.** Some teams add a **repository** between service and model, for example `userRepository.findActiveByTenant(tenantId)`. All database queries live there. This is a good place to enforce rules like "every query includes `tenantId`" in a [multi-tenant](glossary:multi-tenant) app.

**Other common folders:**

| Folder | What goes in it |
|---|---|
| `config/` | settings read from [environment variables](topic:nodejs/environment-variables), DB connection |
| `middleware/` | auth, roles, validation, error handler |
| `utils/` | small helpers: `AppError`, date formatting, pagination helper |
| `validators/` | Joi/Zod schemas (see [validation](topic:express/validation)) |
| `jobs/` | background jobs, cron tasks |
| `tests/` | unit and integration tests |

**Layer-based vs feature-based.** The example above groups files **by layer** (`controllers/`, `services/`). In bigger apps, many teams group **by feature** (a "module"):

```text
src/modules/
├── users/     user.routes.js, user.controller.js, user.service.js, user.model.js
├── billing/   billing.routes.js, billing.controller.js, billing.service.js
└── jobs/      ...
```

Everything about one feature sits together. That makes it easier to find code, and easier to move a feature into its own microservice later.

**Thin controllers, fat services.** Controllers should be short. If a controller has `if` statements about business rules, move them into the service.

## 🎯 Why do we use it?

- **Easy to find things.** "Where is the email rule?" → the user service. Every developer knows where to look.
- **Easy to test.** Services can be tested with plain values, without starting a server.
- **Easy to reuse.** The same service works for HTTP, jobs and scripts.
- **Easy to change.** You can switch the database, or move from REST to GraphQL, and change only one layer.
- **Teams can work in parallel** on different layers and features without conflicts.

## ⚠️ Common mistakes

- **Everything in the route file.** Database queries, business rules and responses mixed in one 300-line file.
- **Passing `req` or `res` into services.** The service is then tied to HTTP and hard to test.
- **Business rules in controllers.** Controllers grow huge, and the rules are repeated in other places.
- **Calling `app.listen` inside `app.js`.** Then tests that import the app also start a real server. The port is already in use, so they fail.

## 🗣️ How to answer in an interview

> "I structure Express apps in layers. Routes map URLs and attach middleware like auth and validation. Controllers handle HTTP: they read params and the body, call a service, and send the response with the right status code. Services hold the business logic. They don't know about req or res, so I can reuse them from jobs or webhooks and test them easily. The model or repository layer does the database queries.
>
> Around that, I keep config, middleware and utils folders. I also split app.js, which builds and exports the app, from server.js, which calls listen. That way Supertest can import the app directly. For bigger codebases I prefer grouping by feature, like users or billing, with the same layers inside each feature. It keeps related code together and makes it easier to split out a service later."

[FILL IN: how the SkillKeepr backend services are organised (layer-based or feature-based), and which parts were in the "reusable backend module patterns" on your resume that cut development time by ~30%. Only add what's true.]

## 🔁 Follow-up questions

### What's the difference between a controller and a service?

A controller deals with HTTP. It reads `req`, sends `res` and picks status codes. A service deals with business rules. It takes plain data and returns plain data. Keeping them apart makes services reusable and easy to test.

### Where does validation belong?

Check the **shape** of the input (types, required fields) in middleware, before the controller runs, with Joi or Zod. Check **business rules** in the service, such as "email must be unique" or "a candidate can't apply twice".

### How do you share code between many Express services?

Put common pieces into shared modules or a private npm package. Good examples: the error class and error handler, auth middleware, the logger, and response and validation helpers. Each service then uses the same tested code.

### Why export the app separately from calling listen?

So tests can import the app without opening a port. Supertest can send requests straight to the exported app. It also lets `server.js` handle startup jobs like connecting to the database and graceful shutdown.

## ✅ Quick check

### 1. Where should this line live: `if (await User.findByEmail(email)) throw new Error('Email already used')`?

- A) Route
- B) Controller
- C) Service
- D) Model

:::answer
**C) Service.** "Emails must be unique" is a business rule. The model only runs the query, and the controller only handles HTTP.
:::

### 2. What is wrong with this service function?

```js
exports.register = async (req, res) => {        // a service that takes req and res
  const user = await User.create(req.body);     // uses req directly
  res.status(201).json(user);                   // sends the response itself
};
```

:::answer
The service depends on `req` and `res`. That is the controller's job. Now it can't be reused from a job or a script, and it is hard to unit test. Make it take `{ name, email }` and **return** the user. Let the controller send the response.
:::

### 3. True or false: in a layered app, a model file may import a controller to send a reply.

:::answer
**False.** Dependencies only point down: controller → service → model. A model must never know about controllers or HTTP.
:::
