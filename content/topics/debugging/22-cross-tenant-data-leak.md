---
template: scenario
title: A user sees another tenant's data
stack: debugging
order: 22
level: Advanced
mustKnow: true
askedFrequency: common
summary:
  - The most serious multi-tenant bug — company A sees company B's candidates. Treat it as a security incident first, a bug second.
  - "Shared-collection design: usually a query missing the tenantId filter. Database-per-tenant design: usually the wrong connection, shared module-level state between requests, or a cache key without the tenant."
  - Debug by auditing the query path, middleware order, connection selection and cache keys for the affected request.
  - Fix by enforcing the tenant in ONE place (middleware + repository layer), pinning the tenant inside the JWT, and adding the tenant to every cache key.
  - Prevent with automated cross-tenant tests ("user of A must get 404 for B's record") on every endpoint.
cards:
  - q: In a shared-collection multi-tenant app, what usually causes one tenant to see another's data?
    a: A query that forgot the tenantId filter — often a new endpoint, an aggregation, or a raw driver call that skips the shared repository layer.
  - q: In a database-per-tenant app, what can cause a leak?
    a: Picking the wrong database connection — for example a "current tenant" stored in module-level state that another request changes, or a cache key that doesn't include the tenant.
  - q: What is your first step when this is reported?
    a: Treat it as a security incident — stop the leak (disable the feature or hotfix), find which data was exposed and to whom, inform the right people, then fix the root cause.
  - q: How do you stop this bug class for good?
    a: Enforce the tenant in one place (middleware + repository), never trust a tenant ID from the request body, put the tenant inside the JWT, include the tenant in cache keys, and add cross-tenant tests.
  - q: Why put the tenant ID inside the JWT?
    a: So a token issued for company A can't be used against company B. The server rejects a request if the token's tenant doesn't match the requested tenant.
---

## 💡 What is it?

A recruiter from **company A** opens a list and sees **candidates from company B**.

In a [multi-tenant](glossary:multi-tenant) app, many companies (tenants) share one system. Each company must only ever see its own data. A leak between tenants is a **data breach**, not just a bug. It can break customer trust and data-protection laws.

There are two common designs, and each leaks in a different way:
- **Shared collection:** all tenants' rows are in one [collection](glossary:collection), with a `tenantId` field on every [document](glossary:document).
- **Database per tenant:** each tenant has its own [database](glossary:database). The app picks the right connection for each request.

## 🏠 Real-life example

Think of a **school with many classes**, and one **shared notice board**.

- **Shared collection** = one big notice board. Every paper has a class label. A careless helper reads out **all** papers without checking the label → class 6 hears class 9's marks. That's a **missing tenantId filter**.
- **Database per tenant** = each class has its **own cupboard**. A helper keeps "which class am I serving right now?" on **one sticky note on the office wall**. Two helpers use the same note at the same time. One changes it mid-task → the other opens the **wrong cupboard**. That's **shared module-level state** choosing the wrong connection.
- A **photocopy pile** at the office with no class name on top = a **cache key without the tenant**. The next class gets the last class's copies.

The fix: every paper has a class label, every helper carries their **own** note, and every photocopy pile has the class name on it.

## 🔎 Detect

- A **customer reports** seeing names or jobs they don't recognise.
- **Support** sees a record ID from tenant B in tenant A's logs.
- **Automated cross-tenant tests** fail (the best way to find it early).
- **Audit logs** show a user reading records that belong to another tenant.

**First, treat it as an incident:**
1. **Stop the leak.** Disable the endpoint or feature, or hotfix it quickly.
2. **Find the impact.** Which records, which tenants, which users, and for how long?
3. **Tell the right people** (your lead, security, and the customers if needed).

## 🐞 Debug

Find the exact request from the report: the URL, the user, the tenant, the time. Then follow its path.

**If you use a shared collection (`tenantId` on every document):**
- Does **every** query include `{ tenantId }`? Check `find`, `findOne`, `updateMany`, `countDocuments` and especially **aggregations** — the first `$match` must contain the tenant.
- Did someone use `findById(id)` alone? An ID from another tenant still matches.
- Does any code take the tenant from the **request body or query string**? A user can change those.
- Is the auth middleware running **before** the route? Check the middleware order.

**If you use database per tenant:**
- How is the connection picked? From the **verified token**, or from a header the user can change?
- Is the "current tenant" kept in **module-level (global) state**? In Node, many requests are in progress at the same time. If request 1 is awaiting a query and request 2 changes the global, request 1 may continue with the **wrong** tenant's connection.
- Do **background jobs and crons** switch tenants correctly while looping?

**For both designs — caches:**
- Is the tenant part of **every cache key**? `cache.get('jobs:open')` will happily return tenant B's jobs to tenant A.

## 🔧 Fix

**Broken: three classic leaks.**

```js
let currentTenant;                                                 // module-level: SHARED by every request in this process
app.use((req, res, next) => {                                      // middleware that runs on each request
  currentTenant = req.headers['x-tenant'];                         // BUG 1: global value, and the header comes straight from the user
  next();                                                          // continue to the route
});                                                                // end of middleware
app.get('/candidates/:id', async (req, res) => {                   // get one candidate
  res.json(await Candidate.findById(req.params.id));               // BUG 2 (shared collection): no tenant filter at all
});                                                                // end of route
app.get('/jobs/open', async (req, res) => {                        // list open jobs
  const cached = await redis.get('jobs:open');                     // BUG 3: cache key has no tenant → shared by all tenants
  res.json(JSON.parse(cached ?? '[]'));                            // tenant A may get tenant B's cached list
});                                                                // end of route
```

**Fixed: the tenant comes from the verified token, lives on the request, and is enforced in one place.**

```js
app.use(requireAuth);                                              // verifies the JWT first and sets req.user
app.use((req, res, next) => {                                      // tenant middleware, runs after auth
  const tenantId = req.user.tenantId;                              // tenant comes from the VERIFIED token, not from the user
  if (req.headers['x-tenant'] && req.headers['x-tenant'] !== tenantId) { // the subdomain/header must match the token
    return res.status(403).json({ message: 'Tenant mismatch' });   // 403 = logged in, but not allowed here
  }                                                                // end of the check
  req.tenantId = tenantId;                                         // stored on THIS request only, never in a global
  next();                                                          // continue
});                                                                // end of middleware

const candidateRepo = {                                            // repository: the ONLY place that queries candidates
  findById: (tenantId, id) => Candidate.findOne({ _id: id, tenantId }).lean(), // tenant is always part of the filter
};                                                                 // end of the repository

app.get('/candidates/:id', async (req, res) => {                   // same route
  const c = await candidateRepo.findById(req.tenantId, req.params.id); // goes through the repository
  if (!c) return res.sendStatus(404);                              // B's record looks "not found" to A — don't even confirm it exists
  res.json(c);                                                     // safe reply
});                                                                // end of route

app.get('/jobs/open', async (req, res) => {                        // same list route
  const key = `t:${req.tenantId}:jobs:open`;                       // cache key ALWAYS starts with the tenant
  const cached = await redis.get(key);                             // each tenant has its own cache entry
  res.json(JSON.parse(cached ?? '[]'));                            // no mixing between tenants
});                                                                // end of route
```

**For database-per-tenant apps,** the same idea applies: choose the connection from `req.tenantId` (per request), not from a module-level "current tenant". If you need the tenant deep in the code without passing it around, Node's `AsyncLocalStorage` (from `node:async_hooks`) keeps a value **per request**, even across `await`.

See [multi-tenant data design](topic:mongodb/multi-tenant-design) and [custom middleware](topic:express/custom-middleware).

## 🛡️ Prevent

- **Cross-tenant tests** on every endpoint: "a user of tenant A asks for tenant B's record → must get 404". Run them in CI.
- **One repository layer.** Raw queries outside it fail code review.
- **Tenant inside the JWT**, checked against the subdomain or header on every request.
- **Never** read the tenant from the body or query string.
- **Tenant in every cache key**, file path and queue job.
- **Compound indexes starting with `tenantId`** (shared-collection design) — they make the filter fast, so nobody is tempted to skip it.
- **Audit logs** of who read what, to measure impact if it ever happens.

## 🗣️ How to answer in an interview

**Short version (20 seconds):**

> "I treat it as a security incident first: stop the leak, find what was exposed, and inform the team. Then I trace the request. With a shared collection, it's usually a query missing the tenant filter. With database-per-tenant, it's the wrong connection — often shared global state — or a cache key without the tenant. I fix it by enforcing the tenant in one place from the verified token, and I add cross-tenant tests."

**Full version:**

> "This is the most serious bug in a multi-tenant system, so first I contain it: disable or hotfix the feature, find which records leaked to whom, and tell my lead and security.
>
> Then I follow the exact request. In a shared-collection design, I check that every query — especially aggregations and findById calls — includes the tenantId, and that the tenant comes from the verified token, not from the request body. In a database-per-tenant design, I check how the connection is chosen: if the current tenant is kept in module-level state, two concurrent requests can mix it up. And for both, I check cache keys.
>
> The fix is to enforce the tenant in one place: middleware that takes it from the JWT and rejects a mismatch with the subdomain, a repository layer that always adds it, per-request context instead of globals, and the tenant in every cache key. Then I add automated cross-tenant tests for every endpoint.
>
> At SkillKeepr the platform uses a separate database per tenant: the tenant comes from the subdomain and is locked inside the JWT, so a token for one company is rejected for another. [FILL IN: any tenant-isolation work you did yourself — only if true.]"

## 🔁 Follow-up questions

### Database-per-tenant vs shared collection — which is safer?

**Database per tenant** gives harder isolation: a forgotten filter can't leak, and backup or deletion per customer is easy. But it costs more connections and per-tenant migrations. **Shared collection** is simpler and cheaper, but every query must include the tenant filter. See [multi-tenant data design](topic:mongodb/multi-tenant-design).

### Why return 404, not 403, for another tenant's record?

A 403 tells the attacker "this record exists, you just can't see it". A 404 reveals nothing. Inside your own tenant, 403 is fine for "you don't have permission".

### What is AsyncLocalStorage and why does it help?

It stores a value (like the tenant ID) for **one request**, and keeps it correct across `await` and callbacks. It replaces dangerous global variables when you need the tenant deep in your code.

### How do you write a cross-tenant test?

Create two tenants with one record each. Log in as tenant A and request tenant B's record ID. Expect 404. Do this for every route, ideally generated from your route list.

## ✅ Quick check

### 1. `Candidate.findById(req.params.id)` in a shared-collection app. What's the risk?

:::answer
It finds the candidate **by ID only**. A user from tenant A can pass tenant B's ID and read it. Always filter by both: `findOne({ _id: id, tenantId })`.
:::

### 2. Why is `let currentTenant` at the top of a module dangerous in Node.js?

:::answer
Node handles **many requests at the same time** in one process. While one request waits (`await`), another can change the global — so the first request may continue with the **wrong tenant**. Keep the tenant on `req` or in `AsyncLocalStorage`.
:::

### 3. Your cache key is `'dashboard:stats'`. What's wrong in a multi-tenant app?

:::answer
It has **no tenant** in it, so every tenant shares the same cached stats. Use a key like `` `t:${tenantId}:dashboard:stats` ``.
:::
