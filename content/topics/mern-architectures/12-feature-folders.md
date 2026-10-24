---
title: Feature folders vs layer folders
stack: mern-architectures
order: 12
level: Intermediate
mustKnow: false
askedFrequency: common
template: pattern
section: Backend structure
summary:
  - "Layer folders group files by type: all controllers together, all models together."
  - "Feature folders group files by feature: everything for jobs in /jobs, everything for users in /users."
  - "Feature folders scale better: one change touches one folder, and a feature can later become its own module or service."
  - "The same choice exists in React: components/hooks/pages folders vs features/jobs, features/candidates."
cards:
  - q: What are layer (type) folders?
    a: Folders by file type, like controllers/, services/, models/, routes/. One feature's files are spread across all of them.
  - q: What are feature folders?
    a: Folders by feature, like jobs/, candidates/, billing/. Each holds its own controller, service, model and tests.
  - q: Why do feature folders scale better?
    a: A change touches one folder, teams can own folders, and a feature can be moved out into a module or service later.
  - q: Can you mix both?
    a: Yes. Use feature folders for business features, and a shared/ or common/ folder for cross-cutting code like auth, logging and DB setup.
---

## 💡 What is it?

When a project grows, you must decide **how to group files**.

- **Layer folders** (also called "by type"): all controllers in one folder, all models in another.
- **Feature folders** (also called "by feature"): all the files for one feature live together.

Both work. Feature folders are easier to manage when the app gets big.

## 🏠 Real-life example

Think of **your school bag**.

- **Layer folders** = one pocket for all notebooks, one for all textbooks, one for all worksheets. To study Maths, you open every pocket.
- **Feature folders** = one folder per subject: Maths folder, Science folder. Each has its own notebook, textbook and worksheets. To study Maths, you open one folder.
- **The pencil box** = the shared folder. Every subject uses it (auth, logger, DB connection).

## 🗺️ The diagram

```text
LAYER FOLDERS (by type)                 FEATURE FOLDERS (by feature)
src/                                    src/
  controllers/                            jobs/
    jobController.js                        jobs.routes.js
    candidateController.js                  jobs.controller.js
  services/                                 jobs.service.js
    jobService.js                           job.model.js
    candidateService.js                     jobs.test.js
  models/                                 candidates/
    Job.js                                  candidates.routes.js
    Candidate.js                            candidates.controller.js
  routes/                                   candidates.service.js
    jobRoutes.js                            candidate.model.js
    candidateRoutes.js                    shared/
                                            auth.middleware.js
  "Add a job field" → touch 4 folders      db.js, logger.js
                                          app.js
                                          "Add a job field" → touch 1 folder
```

## 🧑‍💻 Code example

Each feature exports one router. `app.js` just plugs them in.

Set up:

```bash
npm init -y
npm install express
mkdir -p src/jobs src/candidates src/shared
```

`src/jobs/jobs.routes.js`: everything about jobs starts here.

```js
const router = require('express').Router();                 // a router just for jobs
const service = require('./jobs.service');                  // this feature's own service (same folder)
router.get('/', async (req, res) => res.json(await service.list())); // GET /api/jobs
module.exports = router;                                    // export the jobs router
```

`src/jobs/jobs.service.js`:

```js
const jobs = [{ id: 1, title: 'React Dev' }];               // fake data (a model in real life)
exports.list = async () => jobs;                            // business logic for jobs
```

`src/candidates/candidates.routes.js`:

```js
const router = require('express').Router();                 // a router just for candidates
router.get('/', (req, res) => res.json([{ id: 7, name: 'Asha' }])); // GET /api/candidates
module.exports = router;                                    // export it
```

`src/shared/logger.js`: shared code that every feature can use.

```js
module.exports = (req, res, next) => {                      // a tiny logging middleware
  console.log(req.method, req.url);                         // print e.g. "GET /api/jobs"
  next();                                                   // go on to the route
};                                                          // end of logger
```

`src/app.js`: wire the features together. Run `node src/app.js`.

```js
const express = require('express');                         // load Express
const app = express();                                      // create the app
app.use(require('./shared/logger'));                        // shared middleware for all features
app.use('/api/jobs', require('./jobs/jobs.routes'));        // plug in the jobs feature
app.use('/api/candidates', require('./candidates/candidates.routes')); // plug in the candidates feature
app.listen(3000, () => console.log('API on 3000'));         // 3000 = port
```

```text
GET /api/jobs        → [{"id":1,"title":"React Dev"}]
GET /api/candidates  → [{"id":7,"name":"Asha"}]
```

## 🔍 Deeper version

**Rules that keep feature folders clean:**
- Each feature has a small **public surface**, often an `index.js`. Other features import only from there, not from deep files.
- Features don't reach into each other's models. If `candidates` needs job data, it calls the jobs **service**.
- Cross-cutting code (auth, logging, DB connection, error handling) lives in `shared/` or `common/`.

**Layers still exist inside a feature.** A feature folder still has a controller, a service and a model. You've only changed **how you group** them. See [layered](topic:mern-architectures/layered).

**Path to bigger designs.** A clean feature folder is almost a module already. That's the base of a [modular monolith](topic:mern-architectures/modular-monolith). Later it could even become a [microservice](topic:mern-architectures/microservices). NestJS makes this official with [modules](topic:nestjs/modules).

**Same idea in React:**

| By type | By feature |
|---|---|
| `components/`, `hooks/`, `pages/`, `api/` | `features/jobs/` (JobList.tsx, useJobs.ts, jobsApi.ts), `features/candidates/` |

With Redux, the "ducks" or slice style already groups state by feature: `features/jobs/jobsSlice.ts`.

## ⚖️ Pros and cons

| | Layer folders | Feature folders |
|---|---|---|
| Easy for beginners | ✅ | ⚠️ needs a few rules |
| One change touches | many folders | one folder |
| Team ownership | hard | ✅ a team owns a folder |
| Deleting a feature | hunt across folders | delete one folder |
| Moving to modules/services later | hard | ✅ easy |

## 🎯 When to choose it

- **Layer folders:** a small API with 2–5 resources, a learning project, or a short-lived prototype.
- **Feature folders:** a product with many features (jobs, candidates, interviews, billing), several developers, or a plan to grow.
- **Mixed:** feature folders for business code plus a `shared/` folder. This is the most common setup in real projects.

## ⚠️ Common mistakes

- **Features importing each other's internal files.** It creates a tangle. Go through the feature's service or index.
- **A huge `shared/` or `utils/` folder.** It turns into a junk drawer. Only truly common code belongs there.
- **Circular imports**: jobs imports candidates and candidates imports jobs. Move the shared part out, or use events.
- **Changing structure halfway** and leaving both styles mixed with no rule.

## 🗣️ How to answer in an interview

> "There are two ways to group files. By layer means controllers, services and models each get their own folder. By feature means each feature, like jobs or candidates, has its own folder with its controller, service, model and tests.
>
> For small apps, by layer is fine. For anything that grows, I prefer feature folders. A change stays in one folder, a team can own a feature, and a feature can later become a module or even a separate service. Shared things like auth, logging and the DB connection go in a shared folder.
>
> I use the same idea in React, with a features folder that holds the components, hooks and API calls for each feature."

## 🔁 Follow-up questions

### Do feature folders replace layers?

No. Inside each feature you still have a controller, a service and a model. Feature folders only change how you group them.

### How do two features share data?

Through each other's **service** or public index, not by importing the other feature's model directly. For loose coupling, use events.

### How does NestJS relate to this?

NestJS modules are feature folders with rules. A module lists what it provides and what it exports, so other modules can only use the exported parts.

## ✅ Quick check

### 1. You add a `deadline` field to jobs. How many folders change with feature folders?

:::answer
Usually **one**: `src/jobs/`. With layer folders, you'd touch model, service, controller and maybe routes folders.
:::

### 2. Where should JWT auth middleware live in a feature-folder project?

:::answer
In **`shared/`** (or `common/`), because every feature uses it.
:::
