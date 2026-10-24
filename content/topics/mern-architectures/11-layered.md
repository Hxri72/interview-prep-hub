---
title: "Layered: controller → service → repository"
stack: mern-architectures
order: 11
level: Intermediate
mustKnow: true
askedFrequency: very common
template: pattern
section: Backend structure
summary:
  - "A layered backend splits code into controller (HTTP), service (business rules) and repository (database)."
  - Each layer only calls the layer below it. Controllers never touch Mongoose; repositories never see req or res.
  - The service layer is the heart. It holds the rules and is easy to unit test with a fake repository.
  - It's the usual next step after MVC, and NestJS uses the same idea (controllers + providers).
cards:
  - q: Name the three common layers in an Express backend.
    a: "Controller (HTTP in/out), service (business logic), repository (database access)."
  - q: What is the rule about calling between layers?
    a: Each layer only calls the one below it. A controller calls a service; a service calls a repository.
  - q: Why add a repository layer?
    a: It hides the database. Services don't know about Mongoose, so you can swap the DB or fake it in tests.
  - q: Where do business rules like "a closed job can't get new applications" go?
    a: In the service layer.
---

## 💡 What is it?

A **layered** backend stacks code in layers, like floors in a building. Each layer has one job.

- **Controller**: talks HTTP. It reads the request and sends the response.
- **Service**: the business rules. "A closed job can't get new applications."
- **Repository**: talks to the [database](glossary:database). It's the only place with Mongoose code.

Each layer only calls the layer **below** it.

## 🏠 Real-life example

Think of a **bank**.

- **The counter clerk** = the controller. They take your form and give you a receipt. They don't decide loans.
- **The manager** = the service. They apply the rules: "Is the balance enough? Is the limit crossed?"
- **The vault and the record room staff** = the repository. Only they open the vault (the database).
- The clerk never walks into the vault. The vault staff never talk to customers.

## 🗺️ The diagram

```text
React ──HTTP──▶ ┌──────────────────────────────┐
                │ Controller  (req/res, status)│  knows HTTP, not the DB
                └──────────────┬───────────────┘
                               ▼ calls
                ┌──────────────────────────────┐
                │ Service  (business rules)    │  knows rules, not HTTP or Mongoose
                └──────────────┬───────────────┘
                               ▼ calls
                ┌──────────────────────────────┐
                │ Repository (Mongoose queries)│  knows the DB, not HTTP
                └──────────────┬───────────────┘
                               ▼
                            MongoDB
```

## 🧑‍💻 Code example

One file, so it's easy to run. In a real app, each layer is its own folder.

Save as `layers.js`. Run `npm install express` then `node layers.js`.

```js
const express = require('express');                            // load Express

// ---- Repository: the ONLY place that touches data ----
const jobs = [{ id: 1, title: 'React Dev', open: false }];      // a fake DB table (Mongoose in real life)
const jobRepo = {                                               // the repository object
  findById: async (id) => jobs.find((j) => j.id === id),        // get one job by id
};                                                              // end of jobRepo
const applications = [];                                        // another fake table
const appRepo = {                                               // repository for applications
  create: async (data) => { applications.push(data); return data; }, // save one application
};                                                              // end of appRepo

// ---- Service: business rules, no req/res, no Mongoose ----
const applyService = {                                          // the service object
  async apply(jobId, candidateEmail) {                          // the use case: apply to a job
    const job = await jobRepo.findById(jobId);                  // ask the repository
    if (!job) throw { status: 404, message: 'Job not found' };  // rule 1: the job must exist
    if (!job.open) throw { status: 409, message: 'Job is closed' }; // rule 2: 409 = conflict with current state
    return appRepo.create({ jobId, candidateEmail });           // save through the repository
  },                                                            // end of apply
};                                                              // end of applyService

// ---- Controller: HTTP in, HTTP out ----
const app = express();                                          // create the app
app.use(express.json());                                        // read JSON bodies
app.post('/api/jobs/:id/apply', async (req, res) => {           // the route + controller
  try {                                                         // catch rule errors
    const result = await applyService.apply(Number(req.params.id), req.body.email); // call the service
    res.status(201).json(result);                               // 201 = created
  } catch (err) {                                               // a rule failed
    res.status(err.status ?? 500).json({ message: err.message }); // send its status, or 500
  }                                                             // end of try/catch
});                                                             // end of route

app.listen(3000, () => console.log('API on 3000'));             // start on port 3000
```

```text
$ curl -X POST -H "Content-Type: application/json" -d '{"email":"a@b.com"}' localhost:3000/api/jobs/1/apply
{"message":"Job is closed"}        ← status 409, the rule lives in the service
```

**Testing the service needs no HTTP and no DB.** Pass a fake repository:

```js
// a Jest test idea: give the service a fake jobRepo that returns a closed job,
// then expect apply() to reject with status 409
```

## 🔍 Deeper version

**What each layer may know:**

| Layer | Knows | Must not know |
|---|---|---|
| Route / controller | `req`, `res`, status codes, input DTOs | Mongoose, business rules |
| Service | business rules, other services, repositories | `req`/`res`, Express |
| Repository | Mongoose models, queries, indexes | HTTP, business rules |

**Dependency injection.** To swap a real repository for a fake one, pass it into the service: `createApplyService({ jobRepo, appRepo })`. See [DI in Express](topic:express/dependency-injection).

**Errors.** Services throw **domain errors** like `NotFoundError` or `ConflictError`. One error middleware turns them into HTTP status codes. See [error middleware](topic:express/error-middleware).

**Is the repository layer always needed?** With Mongoose, the model already acts like a repository. Many teams skip a separate repository and call models from services. Add it when queries get complex, or when you want to fake the DB easily.

**NestJS** builds this in: controllers + `@Injectable()` services, with repositories as more providers. See [NestJS providers](topic:nestjs/providers). The general idea is also in [layered architecture](topic:architecture/layered-architecture).

## ⚖️ Pros and cons

| Pros | Cons |
|---|---|
| Business rules in one testable place | More files and a bit more boilerplate |
| Controllers stay thin | Can feel heavy for a tiny CRUD app |
| Easy to swap the DB or fake it | "Pass-through" services that only call the repo add noise |
| Reuse services from HTTP, queues and crons | Needs team discipline to respect the layers |

## 🎯 When to choose it

- **Any API with real business rules:** billing, applications, approvals, scoring.
- **The same logic runs from many entry points:** an HTTP route, a queue worker and a cron job can all call one service.
- **A team that writes unit tests.** Services are easy to test.
- **Too much for:** a 3-route hobby API. Plain [MVC](topic:mern-architectures/mvc) is fine there.

## ⚠️ Common mistakes

- **Passing `req` into the service.** Now the service depends on Express. Pass plain values, like `jobId` and `email`.
- **Mongoose queries leaking into controllers.** It breaks the layers.
- **Business rules in the repository.** The repository should only read and write.
- **Services calling controllers.** Calls only go downwards.

## 🗣️ How to answer in an interview

> "I structure Express backends in three layers. The controller handles HTTP: it reads the request, calls a service and sends the response with the right status. The service holds the business rules and knows nothing about Express. The repository does the database work with Mongoose.
>
> Each layer only calls the one below. The big benefit is that services are easy to unit test with a fake repository. The same service can run from an HTTP route, a queue consumer or a cron job.
>
> On a serverless backend the idea is the same: the Lambda handler is the thin controller, and it calls shared services. NestJS uses the same pattern with controllers and injectable providers."

[FILL IN: how SkillKeepr Lambda handlers, services and models are split — confirm from the code before describing it.]

## 🔁 Follow-up questions

### What is the difference between MVC and layered?

MVC has no clear home for business rules, so they often end up in controllers. Layered adds a **service** layer for rules and, often, a **repository** layer for DB access.

### Should the service return Mongoose documents?

It's better to return plain objects (`.lean()` or a mapped object). Then callers don't depend on Mongoose features by accident.

### How do you handle transactions across two repositories?

The service starts a Mongoose session and passes it to both repository calls. Then it commits or aborts. See [transactions](topic:mongodb/transactions).

## ✅ Quick check

### 1. Where should this rule live: "a closed job can't get new applications"?

- A) controller
- B) service
- C) repository

:::answer
**B) service.** It's a business rule.
:::

### 2. What's wrong with this service?

```js
async function apply(req, res) { const job = await Job.findById(req.params.id); res.json(job); }
```

:::answer
It uses `req`/`res` (HTTP) and calls Mongoose directly. A service should take plain values, call a repository, and return data. The controller sends the response.
:::
