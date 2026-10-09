---
title: Modular monolith
stack: architecture
order: 5
level: Intermediate
mustKnow: false
askedFrequency: common
summary:
  - A modular monolith is one deployable app, split inside into strict modules — each owns its own data and exposes a small public API.
  - Modules talk only through those public APIs (or internal events), never by reaching into each other's tables or files.
  - You keep the monolith's simplicity (one deploy, fast calls, easy transactions) and gain clean boundaries.
  - It's the best middle step — if one module later needs to become a service, the boundary is already there.
  - Enforce the rules with folder structure, lint rules or dependency checks; otherwise they slowly break.
cards:
  - q: What is a modular monolith?
    a: One deployable application divided into strict modules by business area. Each module owns its data and exposes a small public API that other modules must use.
  - q: How is it different from a normal monolith?
    a: A normal monolith often has no inner boundaries — any code can touch any table. A modular monolith forbids that.
  - q: How is it different from microservices?
    a: It's still one process and one deploy, so module calls are fast function calls and transactions are easy. Microservices are separate deploys talking over the network.
  - q: How do you enforce module boundaries?
    a: One public entry file per module, lint or dependency rules that block deep imports, and separate tables or schemas per module.
  - q: Why is it a good step before microservices?
    a: The boundaries and APIs already exist, so extracting a module into a service is mostly moving code.
---

## 💡 What is it?

A **modular monolith** is **one app** that is split **inside** into strict **modules**.

Each module owns **one business area**, like jobs or applications. It owns **its own data**. It shares only a **small public API** with the other modules.

You still build and deploy **one app**. But inside, the parts don't reach into each other.

## 🏠 Real-life example

Think of a **school building with departments**.

One building, one gate, one timetable. But the science department has its own lab and its own cupboard. If the maths teacher needs a beaker, she asks the science office. She doesn't open their cupboard herself.

- **The one building** = one app, one deploy.
- **Each department** = one module.
- **Its locked cupboard** = the module's private data.
- **The department office window** = the module's public API.
- **Asking at the window** = calling the public API.

Later, if science grows huge, it can move to its own building easily. Its cupboard and office window already exist.

## 🧑‍💻 Code example

Two modules in one file. Each keeps its data private (using a [closure](topic:javascript/closures)) and shares only a public API. Save as `modular.js` and run `node modular.js`.

```js
// ===== Module 1: jobs. Other modules may ONLY use its public API below. =====
const jobsModule = (() => {                                    // a closure keeps the inside private
  const jobs = new Map([[1, { id: 1, title: 'Node.js Developer', open: true }]]); // private data
  function isOpen(jobId) {                                     // public: is this job still open?
    return jobs.get(jobId)?.open === true;                     // true only for an existing open job
  }                                                            // end of isOpen
  function closeJob(jobId) { jobs.get(jobId).open = false; }   // public: close a job
  return { isOpen, closeJob };                                 // the PUBLIC API — nothing else leaks out
})();                                                          // run it once to build the module

// ===== Module 2: applications. It depends on jobs only through that public API. =====
const applicationsModule = (() => {                            // another private box
  const applications = [];                                     // private data of this module
  function apply(candidate, jobId) {                           // public: apply to a job
    if (!jobsModule.isOpen(jobId)) return 'rejected: job is closed'; // ask jobs through its API
    applications.push({ candidate, jobId });                   // save the application
    return `accepted: ${candidate} → job ${jobId}`;            // success message
  }                                                            // end of apply
  return { apply };                                            // public API of this module
})();                                                          // run it once

console.log(applicationsModule.apply('Asha', 1));              // job is open → accepted
jobsModule.closeJob(1);                                        // jobs module closes the job
console.log(applicationsModule.apply('Ravi', 1));              // job is closed → rejected
console.log(jobsModule.jobs);                                  // the private Map is NOT reachable → undefined
```

**Output:**

```text
accepted: Asha → job 1
rejected: job is closed
undefined
```

**What to notice:** the applications module never reads the jobs `Map` directly. In a real project each module is a folder, and the public API is its `index.js`.

## 🔍 Deeper version

**Three styles compared:**

| | Plain monolith | Modular monolith | Microservices |
|---|---|---|---|
| Deploy | One | One | Many |
| Calls between parts | Anything calls anything | Public API only, in-process | Network (HTTP/events) |
| Data | Shared tables | Each module owns its tables | Each service owns its database |
| Transactions | Easy | Easy (same database) | Hard (sagas) |
| Operational cost | Low | Low | High |
| Boundaries | Weak | Strong (by rule) | Strong (by network) |

**A typical folder layout:**

```text
src/
  modules/
    jobs/
      index.js          ← public API (the ONLY file others may import)
      jobs.service.js   ← private
      jobs.model.js     ← private (owns the "jobs" collection)
    applications/
      index.js
      ...
  shared/               ← truly shared helpers (logging, config)
```

**How to enforce the rules** (without enforcement, they break within months):
- Lint rules that block deep imports like `modules/jobs/jobs.model`. Example: ESLint `no-restricted-imports`, or a tool like dependency-cruiser.
- Each module has its own tables or collections. No module queries another module's tables.
- Modules can also publish **in-process events** ("job.closed") for side effects, so they don't call each other directly.

**Inside each module** you can still use layers: routes → controllers → services → repositories. See [layered architecture](topic:architecture/layered-architecture) and [Express project structure](topic:express/project-structure).

**Why it's popular now.** Many teams that moved to microservices too early came back to this. You get clean boundaries without the network cost. Splitting a module out later is a simple [strangler-fig move](topic:architecture/when-to-split).

## 🎯 Why do we use it?

- **Keep it simple** — one deploy, one database, fast calls, easy transactions.
- **Stop the "big ball of mud"** — clear ownership and boundaries.
- **Let teams own modules** without the cost of separate services.
- **Keep options open** — a module can become a service later with little effort.

## ⚠️ Common mistakes

- **Boundaries only on paper.** Without lint or dependency checks, deep imports creep back in.
- **Sharing tables between modules** "just this once".
- **A giant "shared" or "utils" folder** that every module depends on, full of business logic.
- **Splitting by technical layer** (a "models" module, a "services" module) instead of by business area.

## 🗣️ How to answer in an interview

> "A modular monolith is a single deployable application that's divided internally into strict modules by business area — like jobs, applications and billing. Each module owns its own data and exposes a small public API, and other modules can only use that API, never reach into its tables or private files.
>
> It keeps the monolith's strengths — one deploy, in-process calls, easy transactions — while giving you the clean boundaries people usually want from microservices. The rules need enforcement, for example lint rules against deep imports and one set of tables per module.
>
> I like it as the default for most products, and it's also the best first step before microservices: if one module later needs to scale or deploy independently, its boundary already exists, so extracting it is mostly moving code."

## 🔁 Follow-up questions

### How do two modules share data they both need?

Through the owning module's public API — for example `jobs.getTitle(id)`. Or the owning module publishes events and the other keeps a small copy of what it needs.

### Can modules use different databases?

They can, but usually they share one database server, with separate tables or collections per module. That keeps transactions easy.

### How do you check that nobody breaks the boundaries?

Automate it in CI. A lint rule or dependency checker fails the build if code imports another module's private files.

### Is the shared code library in a multi-service project the same thing?

Not exactly. A shared library (like SkillKeepr's shared core-service code used by several services) shares **helpers and models** between deployables. A modular monolith is about **boundaries inside one deployable**. Both aim to avoid duplication without tight coupling. See [reusable modules](topic:resume/reusable-modules).

## ✅ Quick check

### 1. In the code example, why does `console.log(jobsModule.jobs)` print `undefined`?

:::answer
`jobs` lives inside the module's closure and is not returned. Only `isOpen` and `closeJob` are public, so nobody outside can touch the data directly.
:::

### 2. The applications module runs `db.collection('jobs').find(...)` directly. Is that OK in a modular monolith?

:::answer
**No.** The jobs data belongs to the jobs module. The applications module must use the jobs module's public API.
:::

### 3. Which is true about a modular monolith?

- A) Modules talk over HTTP
- B) It's one deployable app with strict inner boundaries
- C) Each module must use a different programming language

:::answer
**B.**
:::
