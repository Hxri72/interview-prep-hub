---
title: Modular monolith in Node
stack: mern-architectures
order: 14
level: Intermediate
mustKnow: false
askedFrequency: common
template: pattern
section: Backend structure
summary:
  - "A modular monolith is one Node app, deployed as one piece, but split inside into clear modules like users, jobs and billing."
  - Each module owns its own routes, logic and MongoDB collections, and shows the others only a small public API (its index.js).
  - Modules never read another module's collections or import its internal files.
  - You get most of the clean boundaries of microservices without the network calls, many deployments and distributed bugs.
  - "If one module later needs to scale on its own, its clear boundary makes it easy to pull out as a microservice."
cards:
  - q: What is a modular monolith?
    a: One deployable backend app that is split inside into independent modules, each with its own code, data and a small public API.
  - q: What is the most important rule between modules?
    a: Talk only through the other module's public API (its index file). Never import its internal files or query its collections.
  - q: Why choose a modular monolith over microservices?
    a: You get clear boundaries but keep one deployment, in-process function calls, simple debugging and easy transactions.
  - q: How does it help if you later need microservices?
    a: A well-bounded module already has its own data and API, so you can move it into its own service with little change.
---

## 💡 What is it?

A **[monolith](glossary:monolith)** is one backend app that you deploy as one piece. A **modular monolith** is still one app. But inside, it is cut into clear **modules**, like `users`, `jobs` and `billing`.

Each module owns its own routes, logic and database collections. Other modules can only use it through a small **public API**, usually its `index.js` file.

So you get clean boundaries, but you still run and deploy only one Node app.

## 🏠 Real-life example

Think of **a big school building**.

It is one building with one main gate. But inside, there are separate departments: the library, the office and the sports room. Each has its own staff, its own cupboards and its own register.

- **The school building** = the one Node app you deploy.
- **The main gate** = the one Express server and port.
- **Each department** = a module (`users`, `jobs`, `billing`).
- **A department's cupboards** = the module's own MongoDB collections.
- **The department's front desk** = the module's public API (`index.js`).
- **The rule "don't open another department's cupboard; ask at its desk"** = never query another module's collections directly.

If the sports department grows huge, you can move it to its own building later. That is like pulling one module out as a [microservice](glossary:microservice).

## 🗺️ The diagram

```text
  React SPA
     │  HTTP (fetch /api/...)
     ▼
┌──────────────── ONE Node + Express app (one deploy) ────────────────┐
│                                                                     │
│  /api/users ─► ┌─ users module ─┐      /api/jobs ─► ┌─ jobs module ─┐│
│                │ routes         │                   │ routes        ││
│                │ service        │◄── public API ────│ service       ││
│                │ repo           │   (function call) │ repo          ││
│                └───────┬────────┘                   └──────┬────────┘│
│                        │                                    │        │
│  /api/billing ─► ┌─ billing module ─┐                       │        │
│                  │ ... same shape   │                       │        │
│                  └───────┬──────────┘                       │        │
└──────────────────────────┼──────────────────────────────────┼────────┘
                           ▼                                  ▼
                ┌──────────── one MongoDB database ─────────────┐
                │ users, sessions │ invoices, plans │ jobs, apps│
                │ (users owns)    │ (billing owns)  │ (jobs owns│
                └──────────────────────────────────────────────┘
```

## 🧑‍💻 Code example

Folder layout:

```text
src/
  modules/
    users/
      users.service.js     ← private
      users.routes.js      ← private
      index.js             ← public API of the module
    jobs/
      jobs.routes.js
      index.js
  app.js
```

Set up and run:

```bash
npm init -y
npm install express
node src/app.js
```

`src/modules/users/users.service.js`:

```js
const users = [{ id: 1, name: 'Asha', role: 'recruiter' }];          // fake "users" collection, owned only by this module

async function getUserById(id) {                                     // private logic of the users module
  return users.find((u) => u.id === id) ?? null;                      // null = not found
}                                                                     // end of getUserById

module.exports = { getUserById };                                    // used inside the module only
```

`src/modules/users/users.routes.js`:

```js
const { Router } = require('express');                               // Express router for this module
const { getUserById } = require('./users.service');                   // same-module import: allowed

const router = Router();                                             // a mini app for /api/users
router.get('/:id', async (req, res) => {                              // GET /api/users/1
  const user = await getUserById(Number(req.params.id));             // Number(...) = turn "1" into 1
  user ? res.json(user) : res.status(404).json({ error: 'Not found' }); // 404 = no such user
});                                                                   // end of the route

module.exports = router;                                             // the module's routes
```

`src/modules/users/index.js` (the public API):

```js
const router = require('./users.routes');                            // routes, for app.js to mount
const { getUserById } = require('./users.service');                   // the ONE function other modules may use

module.exports = { router, getUserById };                            // everything else in the folder stays private
```

`src/modules/jobs/jobs.routes.js`:

```js
const { Router } = require('express');                               // Express router for this module
const users = require('../users');                                    // import the users PUBLIC API (index.js), not its files

const jobs = [{ id: 10, title: 'Node developer', createdBy: 1 }];     // fake "jobs" collection, owned by jobs
const router = Router();                                             // a mini app for /api/jobs
router.get('/:id', async (req, res) => {                              // GET /api/jobs/10
  const job = jobs.find((j) => j.id === Number(req.params.id));      // find the job in our own data
  if (!job) return res.status(404).json({ error: 'Not found' });     // 404 = no such job
  const owner = await users.getUserById(job.createdBy);              // ask the users module, via its public API
  res.json({ ...job, createdByName: owner?.name });                   // send job + owner name
});                                                                   // end of the route

module.exports = router;                                             // the module's routes
```

`src/modules/jobs/index.js`:

```js
module.exports = { router: require('./jobs.routes') };               // jobs shares only its routes for now
```

`src/app.js`:

```js
const express = require('express');                                  // load Express
const users = require('./modules/users');                            // users module (public API)
const jobs = require('./modules/jobs');                              // jobs module (public API)

const app = express();                                               // ONE app for all modules
app.use(express.json());                                             // read JSON bodies
app.use('/api/users', users.router);                                 // mount the users module
app.use('/api/jobs', jobs.router);                                   // mount the jobs module
app.listen(3000, () => console.log('Listening on 3000'));            // ONE server, port 3000
```

```text
$ curl localhost:3000/api/jobs/10
{"id":10,"title":"Node developer","createdBy":1,"createdByName":"Asha"}
```

## 🔍 Deeper version

This page is about **how to build one in Node**. For the general idea and trade-offs, see [modular monolith](topic:architecture/modular-monolith) and [monolith](topic:architecture/monolith).

**The three boundary rules:**
1. **Code:** import another module only through its `index.js`. A lint rule can enforce it (for example ESLint's `no-restricted-imports` or a boundaries plugin).
2. **Data:** each module owns its collections. In MongoDB, use a name prefix or a separate database per module. No `$lookup` across modules.
3. **Calls:** cross-module calls go through public functions, or through in-process events.

**In-process events.** Sometimes one module should react to another without a direct call. Node's built-in `EventEmitter` works for this:
- `billing` emits `invoice.paid`.
- `users` listens and upgrades the plan.

This is the same idea as [event-driven](topic:mern-architectures/event-driven-queues) design, but in memory. If the work must survive a crash, use a real queue instead.

**Transactions are easy here.** All modules share one MongoDB connection. So a [transaction](topic:mongodb/transactions) can cover writes in two modules. In microservices, you'd need a saga pattern instead (a chain of steps with "undo" steps).

**Feature folders.** A modular monolith is [feature folders](topic:mern-architectures/feature-folders) plus strict rules. Inside each module you can still use [layers](topic:mern-architectures/layered): routes → service → repository.

**NestJS fits well.** Nest [modules](topic:nestjs/modules) give you this structure. A module only shares what it lists in `exports`.

**Extracting a service later.** When the `billing` module must scale alone, you:
1. Move its folder into a new service with its own deploy.
2. Move its collections to its own database.
3. Replace the in-process function calls with HTTP calls or queue messages.

Because the boundary already existed, the other modules barely change.

## ⚖️ Pros and cons

| Pros | Cons |
|---|---|
| One deploy, one log stream, one place to debug | Whole app scales together, even if only one module is busy |
| Function calls are fast and can't fail like network calls | A crash or memory leak in one module takes down the whole app |
| Easy MongoDB transactions across modules | Boundaries need discipline; one shortcut import can start a mess |
| Clear ownership: each team or person owns modules | All modules share one Node version and one set of dependency versions |
| Easy path to microservices later | Large codebases mean longer builds and test runs |

## 🎯 When to choose it

- **A new product or startup** with a small or medium team. You don't yet know which parts will need to scale.
- **A growing monolith that has become messy.** Cutting it into modules is the safe first step before any microservices talk.
- **A team of 2–15 developers** that wants clear ownership without running many services.
- **Not for:** parts that truly need separate scaling, separate languages (like a Python AI service) or separate release cycles. Those can be separate services next to the monolith.

## ⚠️ Common mistakes

- **Reaching into another module's files**, like `require('../users/users.model')`. Always go through `index.js`.
- **Sharing collections between modules.** If `jobs` writes to the `users` collection, the boundary is gone.
- **A giant "shared" or "utils" module** that every module depends on and that slowly holds business logic.
- **Splitting by technical layer instead of feature**, such as one `controllers/` folder for everything. That isn't modular.

## 🗣️ How to answer in an interview

> "A modular monolith is one deployable Node app that's split inside into modules by business area, like users, jobs and billing. Each module owns its routes, logic and MongoDB collections, and other modules can only use it through its public API, usually its index file.
>
> I like it as the default for a new product. You get clear boundaries and ownership, but you keep one deployment, fast in-process calls, simple debugging and easy transactions. I'd enforce the rules with lint rules on imports and by never sharing collections.
>
> If one module later needs to scale or deploy on its own, the boundary is already there, so pulling it out as a microservice is much easier."

## 🔁 Follow-up questions

### How is it different from a normal monolith?

A normal monolith can have any file import any other file and any code touch any table. A modular monolith has strict boundaries: each module owns its data and exposes a small API.

### How do modules share data they both need?

Ask the owning module through its public function, like `users.getUserById(id)`. If you need speed, a module can keep a small copy that it updates from events, but the owner stays the source of truth.

### Can a modular monolith use separate databases?

Yes. Some teams give each module its own MongoDB database on the same cluster. It makes extraction easier later. But you lose easy cross-module transactions.

### How do you enforce the boundaries?

Use folder rules and lint rules on imports. Review pull requests for cross-module imports. Some teams add a test that fails when a module imports another module's private files.

## ✅ Quick check

### 1. Which import is allowed inside the `jobs` module?

- A) `require('../users/users.service')`
- B) `require('../users')`
- C) `require('../users/users.model')`

:::answer
**B.** It loads the users module's public API (`index.js`). A and C reach into private files.
:::

### 2. True or false: a modular monolith runs as several separate servers.

:::answer
**False.** It runs and deploys as **one** app. The modules are boundaries inside the code, not separate servers.
:::

### 3. Why are transactions easier in a modular monolith than in microservices?

:::answer
All modules share one database connection, so one MongoDB transaction can cover writes in two modules. Microservices have separate databases, so they need a saga (steps plus undo steps) instead.
:::
