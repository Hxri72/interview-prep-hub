---
title: Layered / clean architecture
stack: architecture
order: 6
level: Intermediate
mustKnow: false
askedFrequency: common
summary:
  - Layered architecture splits code by job — routes/controllers (HTTP), services (business rules), repositories (data access), models (data shape).
  - Each layer only calls the layer below it. Business rules never know about HTTP or the database details.
  - Clean / hexagonal architecture goes one step further — the business core is in the middle, and the database and web framework are outer "plug-ins".
  - "Benefits: easy to test (mock the repository), easy to change (swap a database or framework), and easy to find code."
  - Don't over-engineer a tiny app — but for any real backend, at least separate controller, service and repository.
cards:
  - q: What are the usual layers in a Node.js backend?
    a: Routes/controllers (HTTP in and out), services (business rules), repositories (database access), models (data shape).
  - q: What is the main rule of layered architecture?
    a: Each layer only talks to the layer directly below it, and lower layers never know about upper ones.
  - q: Why keep business rules out of controllers?
    a: So rules can be reused (API, cron, queue worker) and tested without HTTP, and the controller stays thin.
  - q: What does clean/hexagonal architecture add?
    a: Dependencies point inward — the business core defines interfaces, and the database and web framework are outer adapters that plug into them.
  - q: How does layering help testing?
    a: You can test a service by giving it a fake repository, with no real database or HTTP server.
---

## 💡 What is it?

**Layered architecture** splits backend code **by job**.

- **Controller** — handles the HTTP request and reply.
- **Service** — holds the business rules.
- **Repository** — talks to the [database](glossary:database).

Each layer only calls the one **below** it. The rules in the middle don't know about HTTP or about the database details.

## 🏠 Real-life example

Think of a **school library**.

- The **front desk** takes your request and gives you the book. It does not decide the rules.
- The **librarian** decides: "Students can borrow 3 books. You already have 3, so no."
- The **store room staff** find the book on the shelves.

Mapping:
- **Front desk** = controller (request in, reply out).
- **Librarian** = service (the rules).
- **Store room** = repository (where data is kept).
- **The shelves** = the database.

If the library moves to a new building (a new database), only the store room staff change. The librarian's rules stay the same.

## 🧑‍💻 Code example

Three layers in one file, so it runs anywhere. Save as `layered.js` and run `node layered.js`.

```js
// ----- Repository layer: the ONLY place that talks to the data -----
const db = [{ id: 7, name: 'Asha', status: 'applied' }];        // a fake database (an array)
const candidateRepo = {                                         // data-access functions
  findById: async (id) => db.find((c) => c.id === id),          // read one candidate
  save: async (c) => c,                                         // pretend to save (data is already in the array)
};                                                              // end of repository

// ----- Service layer: business rules, no HTTP, no database code -----
const candidateService = {                                      // the "brain" of the feature
  async shortlist(id) {                                         // rule: shortlist a candidate
    const c = await candidateRepo.findById(id);                 // ask the repository for data
    if (!c) throw new Error('NOT_FOUND');                       // rule: must exist
    if (c.status !== 'applied') throw new Error('BAD_STATUS');  // rule: only applied candidates move on
    c.status = 'shortlisted';                                   // apply the change
    return candidateRepo.save(c);                               // ask the repository to save it
  },                                                            // end of shortlist
};                                                              // end of service

// ----- Controller layer: turns a request into a service call and a reply -----
async function shortlistController(req) {                       // req is a fake HTTP request object
  try {                                                         // catch rule errors here
    const result = await candidateService.shortlist(Number(req.params.id)); // "7" → 7, then call the service
    return { status: 200, body: result };                       // 200 = OK
  } catch (err) {                                               // a rule failed
    return { status: err.message === 'NOT_FOUND' ? 404 : 400, body: { error: err.message } }; // map rule → HTTP code
  }                                                             // end of catch
}                                                               // end of controller

// ----- Try it (a route would call the controller like this) -----
shortlistController({ params: { id: '7' } }).then(console.log); // first time: works
setTimeout(() => shortlistController({ params: { id: '7' } }).then(console.log), 10); // again: rule blocks it
setTimeout(() => shortlistController({ params: { id: '99' } }).then(console.log), 20); // unknown id: 404
```

**Output:**

```text
{ status: 200, body: { id: 7, name: 'Asha', status: 'shortlisted' } }
{ status: 400, body: { error: 'BAD_STATUS' } }
{ status: 404, body: { error: 'NOT_FOUND' } }
```

**What to notice:** the service throws plain rule errors. Only the controller knows HTTP codes like 404 and 400.

## 🔍 Deeper version

**The usual Node.js layers:**

| Layer | Job | Knows about |
|---|---|---|
| Routes | Map URL + method → controller | Express |
| Controller | Read `req`, call the service, send `res` | HTTP |
| Service | Business rules, orchestration | Repositories (through simple functions) |
| Repository | Queries | Mongoose, SQL, the database |
| Model | Data shape and validation | The database schema |

Express version of this: [project structure](topic:express/project-structure).

**Why the rule "only call down" matters:**
- **Reuse.** The same `shortlist()` service can be called from an API route, a cron job or a queue worker.
- **Testing.** Give the service a fake repository. No database needed. See [dependency injection](topic:express/dependency-injection).
- **Change.** Moving from MongoDB to PostgreSQL changes the repository only.

**Clean / hexagonal architecture.** It's the same idea, made stricter:
- The **core** (entities and use cases) is in the middle. It has **no** imports of Express or Mongoose.
- The core defines **ports** — interfaces like `CandidateRepository`.
- The outside world plugs in with **adapters** — a Mongo adapter, an HTTP adapter, a queue adapter.
- **Dependencies point inward.** The database depends on the core, not the other way round.

```text
   HTTP adapter ─┐            ┌─ Mongo adapter
   Queue worker ─┼─► [ core: rules + use cases ] ◄─┤
   Cron job     ─┘            └─ Email adapter
```

**Not only web frameworks.** A serverless backend uses the same idea. A Lambda handler is just another kind of controller. At SkillKeepr, the backend separates the HTTP entry, business services and data access in a similar layered way. [FILL IN: which layers you personally worked in.]

**Don't over-do it.** A 50-line script doesn't need five layers. Interfaces for everything in a small app add ceremony without value.

## 🎯 Why do we use it?

- **Find code fast.** Everyone knows where rules live and where queries live.
- **Test rules alone**, with fake data access.
- **Reuse rules** from APIs, crons and queue workers.
- **Swap technology** (database, framework) with less pain.

## ⚠️ Common mistakes

- **Fat controllers** — business rules written inside route handlers.
- **Services that use `req` and `res`** — now they only work over HTTP.
- **Database queries inside services** instead of the repository.
- **Layers that only pass data through** with no reason, adding files but no value.

## 🗣️ How to answer in an interview

> "Layered architecture splits backend code by responsibility: routes and controllers deal with HTTP, services hold the business rules, and repositories handle database access. Each layer only calls the one below it, so business rules don't know about HTTP or the database details.
>
> The big wins are testability and reuse: I can unit-test a service with a fake repository, and the same service can be called from an API, a cron job or a queue worker. Clean or hexagonal architecture takes it further — the business core defines interfaces, and the database and web framework are adapters plugged in from outside, so dependencies point inward.
>
> I keep it practical: for a real backend I always separate controller, service and repository, but I don't add layers that only pass data through."

## 🔁 Follow-up questions

### Where should validation go?

Input shape validation (types, required fields) goes at the edge — the controller or a validation middleware. Business validation ("only applied candidates can be shortlisted") goes in the service. See [request validation](topic:express/validation).

### Should a service call another service?

Yes, inside the same app. But avoid circles (A calls B, B calls A). If two services keep needing each other, they may be one business area.

### What is the difference between a repository and a model?

The model defines the data's shape (a Mongoose schema). The repository holds the query functions that use it, like `findOpenJobsByDepartment()`.

### Is layered architecture slower?

The extra function calls cost almost nothing. The real costs are database and network calls, and layers don't add those.

## ✅ Quick check

### 1. In the code example, which layer decides that a candidate must be in `applied` status?

:::answer
The **service** layer (`candidateService.shortlist`). Business rules live there.
:::

### 2. A developer writes `Candidate.find()` (a Mongoose query) inside a controller. Which rule is broken?

:::answer
The controller skips the service and repository layers. Data access should go through the repository, and rules through the service.
:::

### 3. How would you unit-test `candidateService.shortlist` without a database?

:::answer
Give it a **fake repository** that returns test data (for example with `jest.mock` or by injecting a stub), then check the result and the errors.
:::
