---
title: Multi-tenant data design (tenantId on everything)
stack: mongodb
order: 24
level: Intermediate
mustKnow: true
askedFrequency: very common
summary:
  - Multi-tenant means many customer companies (tenants) share one app. In the shared-collection model, every document has a tenantId saying which company owns it.
  - Every query must filter by tenantId. Enforce it in one central place (a repository layer or a Mongoose plugin), not by hoping each developer remembers.
  - Take tenantId from the verified login token, never from the request body or query string.
  - Start compound indexes with tenantId, and make unique rules per tenant, like { tenantId, email }. Put the tenant in cache keys too.
  - Write tests that prove company A cannot read, change or delete company B's data.
cards:
  - q: What is a multi-tenant application?
    a: One application (and often one database) that serves many customer companies, called tenants. Each tenant must only ever see its own data.
  - q: Name three ways to store multi-tenant data in MongoDB.
    a: "Shared collections with a tenantId field on every document; a separate database per tenant; or a separate collection per tenant. Shared collections are the cheapest and simplest to run."
  - q: Where should tenantId come from in an API request?
    a: From the verified JWT or session of the logged-in user, set by auth middleware. Never trust a tenantId sent in the body or query string.
  - q: Why should indexes start with tenantId?
    a: Every query filters by tenantId (an equality), so it belongs first in compound indexes. Then each company's data sits together in the index and queries stay fast.
  - q: How do you stop a developer from forgetting the tenant filter?
    a: Put all database access behind a tenant-scoped repository or a Mongoose plugin that adds or requires tenantId on every query, and add tests for cross-tenant access.
---

## 💡 What is it?

A **[multi-tenant](glossary:multi-tenant)** app serves many customer companies from **one** system. Each company is called a **tenant**.

The most common MongoDB design is **shared collections**. All companies' candidates live in one `candidates` collection. Every [document](glossary:document) has a `tenantId` field that says which company owns it.

The golden rule: **every query must filter by `tenantId`**. If one query forgets, company A could see company B's candidates. That's a serious data leak.

## 🏠 Real-life example

Think of a **big apartment building** with one shared **letterbox room**.

All the families' letters arrive in the same room. Each letter has a **flat number** on it. The watchman puts each letter only into the box with **that** flat number.

- If the watchman ignores the flat number, a family gets someone else's bank letters. That's a leak.
- A careful building has **one strict rule at the gate**: no letter goes in without a flat number. It doesn't trust each watchman to remember.
- You can't just **say** "I'm from flat 12". The watchman checks your **ID card** first.

Now map it:
- **The building** = one app and database.
- **Each family** = a tenant (a company).
- **The flat number on each letter** = `tenantId` on each document.
- **The strict rule at the gate** = a repository layer or Mongoose plugin that always adds `tenantId`.
- **The ID card check** = taking `tenantId` from the verified login token, not from what the user types.

## 🧑‍💻 Code example

You need MongoDB (local, or a free Atlas cluster). Make a folder, run `npm init -y` and `npm install mongoose`. Save this as `tenants.js` (CommonJS). Run it with `node tenants.js`, or `MONGODB_URI="your-connection-string" node tenants.js`.

```js
const mongoose = require('mongoose');                                        // load Mongoose
const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/hiring';   // where MongoDB is; local by default
const { ObjectId } = mongoose.Types;                                         // helper to make ids

const candidateSchema = new mongoose.Schema({                                // the shape of one candidate
  tenantId: { type: mongoose.Schema.Types.ObjectId, required: true },         // which company owns it — always required
  name: String,                                                              // candidate's name
  email: String,                                                             // candidate's email
});                                                                          // end of the schema
candidateSchema.index({ tenantId: 1, email: 1 }, { unique: true });          // index starts with tenantId; email unique PER company

const queryTypes = ['find', 'findOne', 'countDocuments', 'updateOne', 'updateMany', 'deleteOne', 'deleteMany', 'findOneAndUpdate']; // reads, updates and deletes
candidateSchema.pre(queryTypes, async function () {                          // runs before each of those queries
  if (!this.getFilter().tenantId) throw new Error('tenantId is required in every candidate query'); // no tenant → refuse
});                                                                          // end of the safety net
const Candidate = mongoose.model('Candidate', candidateSchema);              // the model

function forTenant(tenantId) {                                               // a repository locked to ONE company
  return {                                                                   // the only functions the app may use
    list: (filter = {}) => Candidate.find({ ...filter, tenantId }).lean(),   // tenantId goes LAST, so callers can't override it
    create: (data) => Candidate.create({ ...data, tenantId }),               // new data always gets this tenantId
  };                                                                         // end of the repository
}                                                                            // end of forTenant

async function main() {                                                      // all the steps, in order
  await mongoose.connect(uri);                                               // connect to the database
  await Candidate.collection.drop().catch(() => {});                         // start clean (a raw drop skips our hooks)
  await Candidate.createIndexes();                                           // build the indexes from the schema again
  const companyA = new ObjectId(), companyB = new ObjectId();                // two tenants (in real life: from the JWT)
  const repoA = forTenant(companyA), repoB = forTenant(companyB);            // one repository per request/tenant
  await repoA.create({ name: 'Asha', email: 'asha@mail.com' });              // a candidate in company A
  await repoB.create({ name: 'Ravi', email: 'ravi@mail.com' });              // a candidate in company B

  console.log('A sees:', (await repoA.list()).map((c) => c.name));          // only company A's candidates
  console.log('B sees:', (await repoB.list()).map((c) => c.name));          // only company B's candidates
  const sneaky = await repoA.list({ tenantId: companyB });                   // A tries to ask for B's data
  console.log('A asks for B:', sneaky.map((c) => c.name));                  // still only A's data
  try {                                                                      // a query that forgot the tenant
    await Candidate.find({ name: 'Ravi' });                                  // no tenantId in the filter!
  } catch (err) {                                                            // the plugin blocks it
    console.log('Blocked:', err.message);                                    // print why it was blocked
  }                                                                          // end of try/catch
  await mongoose.disconnect();                                               // close the connection
}                                                                            // end of main
main().catch(console.error);                                                 // run main and print any error
```

**Output:**

```text
A sees: [ 'Asha' ]
B sees: [ 'Ravi' ]
A asks for B: [ 'Asha' ]
Blocked: tenantId is required in every candidate query
```

Two layers of safety: the **repository** always adds the right `tenantId`, and the **hook** refuses any query that has none.

## 🔍 Deeper version

**Three ways to store tenants in MongoDB:**

| Model | How | Good | Hard |
|---|---|---|---|
| **Shared collections** (pool) | one `candidates` collection, `tenantId` on every document | cheapest, simple to run, easy reports across tenants | strict filtering needed everywhere; a "noisy" big tenant affects others |
| **Database per tenant** (silo) | `tenant_acme`, `tenant_zen`… | strong isolation, easy per-tenant backup/delete | many databases to migrate and monitor; more connections |
| **Collection per tenant** | `acme_candidates`… | some isolation | MongoDB gets slow with too many collections and indexes |

Many SaaS products start with shared collections. They move very big or regulated customers to their own database later (a hybrid).

**Enforce it in one place.** Don't rely on every developer remembering `{ tenantId }` in every query. Use one or more of these:
- **A repository / service layer** created per request with the tenant (`forTenant(req.tenantId)`). Controllers never touch models directly.
- **A Mongoose plugin** with query hooks that add or require `tenantId`. Remember that hooks don't cover everything: `aggregate()` needs an `'aggregate'` hook (check that the first stage is a `$match` on tenantId), and raw `Model.collection` calls skip hooks.
- **AsyncLocalStorage** (Node's per-request storage) to carry the tenant through the request, so deep code can read it safely.

**Where tenantId comes from.**
1. The user logs in. The server signs a JWT that contains the user's `tenantId`.
2. Auth [middleware](glossary:middleware) verifies the token and sets `req.tenantId`.
3. Everything else uses `req.tenantId`. **Never** use `req.body.tenantId` or `req.query.tenantId`. Users can change those.

**Indexes and uniqueness.**
- Put `tenantId` **first** in compound indexes: `{ tenantId: 1, status: 1, appliedAt: -1 }`. It's an equality filter in every query, so ESR puts it first. See [compound indexes and ESR](topic:mongodb/compound-indexes-esr).
- Make unique rules per tenant: `{ tenantId: 1, email: 1 }, { unique: true }`. See [special indexes](topic:mongodb/special-indexes).
- Aggregations must **start** with `$match: { tenantId }`. See [aggregation basics](topic:mongodb/aggregation-basics).

**Other places tenants leak:**
- **Caches**: a Redis key like `jobs:list` would show one company's cached list to another. Use `tenant:${tenantId}:jobs:list`.
- **Files**: store uploads under a tenant prefix, and check the owner before serving a file.
- **Look-ups by `_id` alone**: `findById(id)` can return another tenant's document if someone guesses an id. Use `findOne({ _id: id, tenantId })`.
- **Background jobs and webhooks**: include `tenantId` in the job data, and check it again when the job runs.
- **Logs**: include `tenantId` so you can debug, but don't log personal data.

**Test it.** Write integration tests that create data in tenants A and B. Then, as A, try to read, update and delete B's records by id. Every attempt must return 404 or 403. Run these tests in CI.

## 🎯 Why do we use it?

A SaaS hiring platform serves many companies. Running a separate server and database for each one is expensive and hard to maintain. Shared collections let one system serve them all.

But candidate data is **personal**. A leak between companies breaks trust and can break privacy laws. So the design must make the safe path the **default**: tenantId on every document, added automatically to every query, and covered by tests.

It also keeps things fast. Indexes that start with `tenantId` keep each company's queries quick, even as the total data grows.

## ⚠️ Common mistakes

- **Taking `tenantId` from the request body or query string.** Anyone can change it. Take it from the verified token.
- **`findById(id)` without a tenant check.** A guessed or leaked id exposes another company's record.
- **Cache keys without the tenant**, which can show one company's data to another.
- **Indexes that don't start with `tenantId`**, which make every tenant's queries scan other tenants' entries.

## 🗣️ How to answer in an interview

> "Multi-tenant means many companies share one system. In MongoDB, the simplest model is shared collections with a tenantId on every document. You can also use a database per tenant for stronger isolation, but that's more to operate.
>
> The key is that every query filters by tenantId, and I don't leave that to memory. The tenantId comes from the verified JWT, set by auth middleware, never from the body or query. Then data access goes through a tenant-scoped repository, or a Mongoose plugin that adds or requires tenantId. I use findOne with _id and tenantId instead of findById, and every aggregation starts with a $match on tenantId.
>
> For performance, compound indexes start with tenantId, and unique rules are per tenant, like tenantId plus email. Cache keys include the tenant too. And I write tests where tenant A tries to read and change tenant B's data and must get a 404."

[FILL IN: how SkillKeepr's multi-tenant data is actually separated (shared collections vs database per tenant) and where tenantId is enforced. Only add what's true.]

## 🔁 Follow-up questions

### Shared database or database per tenant — how do you choose?

Shared is cheaper and simpler. It's great for many small tenants. Database per tenant gives stronger isolation, easy per-tenant backup, restore and deletion, and room for big customers. But migrations, monitoring and connection counts grow with every tenant. Many products start shared and move large or regulated customers out later.

### How do you stop one big tenant from slowing everyone down?

Use rate limits and quotas per tenant, and indexes that start with `tenantId`. Run heavy reports on a background queue or a read replica. If a tenant is very big, move it to its own database or cluster.

### How do you delete all data for one tenant (for example, when they leave)?

With shared collections, run `deleteMany({ tenantId })` on every collection, in batches, from a background job. Also clean their files, caches and search indexes. With database per tenant, you drop their database. That's much simpler.

### Should an admin or support user be able to see all tenants?

Only through a separate, audited path. For example, a special role with logging of every cross-tenant access. Normal code paths should still always require a tenant.

## ✅ Quick check

### 1. A route does `Candidate.findById(req.params.id)`. What's the multi-tenant risk?

:::answer
It can return **another company's** candidate if someone passes that id. Use `Candidate.findOne({ _id: req.params.id, tenantId: req.tenantId })`.
:::

### 2. Where should the API get `tenantId` from?

- A) `req.body.tenantId`
- B) `req.query.tenantId`
- C) The verified JWT of the logged-in user (set by auth middleware)

:::answer
**C.** The body and query string are controlled by the user, so they can be faked.
:::

### 3. A Redis cache key is `jobs:open`. What's wrong on a multi-tenant platform?

:::answer
It isn't scoped to a tenant. One company could see another company's cached jobs. Use a key like `tenant:<tenantId>:jobs:open`.
:::
