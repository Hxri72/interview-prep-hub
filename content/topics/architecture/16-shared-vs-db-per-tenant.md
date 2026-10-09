---
title: Shared database vs database per tenant
stack: architecture
order: 16
level: Advanced
mustKnow: false
askedFrequency: common
summary:
  - "Shared database: all tenants' data lives together, and every row or document carries a tenantId."
  - "Database per tenant: each customer company gets its own database, often on shared servers."
  - "Shared is cheaper and simpler to run. Per-tenant gives stronger isolation and easy per-customer backup, restore and deletion."
  - "Per-tenant costs: more connections, migrations run for every tenant, and reports across all tenants are harder."
  - SkillKeepr uses a database per tenant on shared servers. Many products start shared and move big customers out later.
cards:
  - q: Shared database vs database per tenant — the one-line difference?
    a: Shared keeps all tenants together and separates them with a tenantId filter. Per-tenant gives each tenant its own database, so separation comes from the connection itself.
  - q: Give two advantages of a database per tenant.
    a: Strong isolation (a forgotten filter can't leak another tenant's data) and easy per-tenant backup, restore and deletion.
  - q: Give two disadvantages of a database per tenant.
    a: More connections to manage, and every schema change or migration must run on every tenant's database. Cross-tenant reports also need extra work.
  - q: Which model makes cross-tenant analytics easiest?
    a: The shared database. All data is already in one place. With a database per tenant, you usually copy data into a separate analytics store.
  - q: What is a hybrid model?
    a: Most tenants share, and very large or regulated tenants get their own database. A tenant registry says where each tenant's data lives.
---

## 💡 What is it?

A [multi-tenant](glossary:multi-tenant) app must keep each customer company's data apart. There are two common ways to store it.

- **Shared database (pool):** one database for everyone. Every document has a `tenantId`. Every query must filter by it.
- **Database per tenant (silo for data):** each company gets **its own database**. The servers are usually still shared.

Neither is "right". Each one trades **cost and simplicity** against **isolation and control**.

## 🏠 Real-life example

Think of **storing students' notebooks**.

- **Shared:** one big cupboard for the whole school. Every notebook has the student's **name label**. The teacher must always check the label before handing one out.
- **Per student:** every student has **their own locker**. You can't take someone else's notebook by mistake, because you only open **your** locker.

The cupboard is cheaper and easier to clean. The lockers cost more and take more keys, but mix-ups are much harder.

Map it:
- **The big cupboard** = a shared database.
- **The name label** = `tenantId`.
- **Checking the label** = the tenant filter on every query.
- **One locker per student** = a database per tenant.
- **The bunch of keys** = connections to many databases.

## 🧑‍💻 Code example

Both models side by side, in plain JavaScript. Save as `pertenant.js` and run `node pertenant.js`.

```js
const pools = new Map();                                  // one cached connection per tenant
let opened = 0;                                           // how many connections we really opened

function getDb(tenant) {                                  // database-per-tenant: pick the tenant's own database
  if (!pools.has(tenant)) {                               // first time we see this tenant?
    opened++;                                             // count a real (slow) connection
    pools.set(tenant, { name: `db_${tenant}` });          // open it once and cache it
  }                                                       // end of the cache check
  return pools.get(tenant);                               // reuse the cached connection
}                                                         // end of getDb

const sharedRows = [                                      // shared database: everyone in one table
  { tenantId: 'acme', name: 'Asha' },                     // a candidate of acme
  { tenantId: 'zen', name: 'Ravi' },                      // a candidate of zen
];                                                        // end of sharedRows
const sharedQuery = (tenant) => sharedRows.filter((r) => r.tenantId === tenant).map((r) => r.name); // MUST filter by tenant

for (const t of ['acme', 'zen', 'acme', 'acme']) console.log('db-per-tenant →', getDb(t).name); // requests for different tenants
console.log('connections opened:', opened);               // 2, not 4: one per tenant
console.log('shared db, acme sees:', sharedQuery('acme')); // only works because we filtered
```

**Output:**

```text
db-per-tenant → db_acme
db-per-tenant → db_zen
db-per-tenant → db_acme
db-per-tenant → db_acme
connections opened: 2
shared db, acme sees: [ 'Asha' ]
```

In the per-tenant model, the **connection** decides whose data you see. In the shared model, the **filter** decides, and forgetting it is a leak. In Mongoose, per-tenant usually means `mongoose.createConnection(uri)` per tenant, cached in a `Map`, with models registered on each connection.

## 🔍 Deeper version

**Side by side:**

| Topic | Shared database | Database per tenant |
|---|---|---|
| Isolation | logical: every query must filter | strong: the connection is the boundary |
| Risk of a leak | a forgotten filter leaks data | very low inside one database |
| Cost | lowest | higher (more storage overhead, more connections) |
| Connections | one pool | one pool **per tenant** per server process |
| Migrations / indexes | run once | run for **every** tenant; need tooling |
| Backup, restore, delete one tenant | hard (filter by tenantId) | easy (one database) |
| Noisy neighbour | one tenant's load affects all | still shares servers, but data and indexes are separate |
| Cross-tenant reports | easy | hard: query many DBs or copy to a warehouse |
| Custom per-tenant changes | hard | possible (but avoid drift) |
| Data location (a country) | hard | easier: put that DB in that region |

**Connection math matters.** With a database per tenant, each server process may keep a pool for every tenant it serves. On serverless, many containers × many tenants × pool size can add up to thousands of connections. Keep pools small, close idle ones, and watch the database's connection count.

**Tenant registry.** Per-tenant setups need a place that maps `tenant → database details` (a control-plane database, a secrets store or config files). Every request looks it up, so **cache** it.

**Many databases in MongoDB.** MongoDB handles many databases fine. But every collection and index is a file on disk. Thousands of tenants × dozens of collections means a lot of files and memory. At large scale, teams spread tenants across several clusters.

**Hybrid.** Very common in practice:
- Small tenants share a database with `tenantId`.
- Large or regulated tenants get their own database or cluster.
- The tenant registry says where each one lives, so the app code stays the same.

**SkillKeepr** uses a **database per tenant on shared compute**. The tenant comes from the subdomain, travels as a header, and is pinned in the JWT. Then the backend opens (or reuses) that tenant's database connection. See [Multi-tenant architecture](topic:architecture/multi-tenant) and [the multi-tenant resume page](topic:resume/multi-tenant-platform). For the shared model in MongoDB, see [Multi-tenant data design](topic:mongodb/multi-tenant-design).

## 🎯 Why do we use it?

The choice affects **safety, cost and daily work** for years.

- B2B products with sensitive data (like candidates and salaries) often choose per-tenant for **isolation and easy deletion** when a customer leaves.
- Products with thousands of small customers often choose shared, because per-tenant would mean thousands of databases to manage.

Knowing both lets you explain **why** your product made its choice, and what it costs.

## ⚠️ Common mistakes

- **Choosing per-tenant and then running migrations by hand.** Schema changes must be scripted to run across every tenant, with progress tracking.
- **No connection limits.** Per-tenant pools multiply and exhaust the database.
- **Choosing shared and enforcing the filter only by habit.** Put it in one central layer, and test cross-tenant access.
- **Forgetting cross-tenant reporting needs.** If the business wants "all customers" dashboards, plan an analytics pipeline from the start.

## 🗣️ How to answer in an interview

> "There are two common ways to store multi-tenant data. A shared database keeps everyone together with a tenantId on every record. It's cheapest and simplest, and cross-tenant reports are easy, but every query must filter correctly, and deleting one customer's data is harder. A database per tenant gives each customer their own database. Isolation is much stronger because the connection itself is the boundary, and backup, restore or deletion per customer is simple. The costs are more connections, and migrations and indexes that must run on every tenant's database.
>
> Our platform uses a database per tenant on shared servers. The tenant comes from the subdomain and is pinned in the JWT, and the backend picks that tenant's connection. In practice many products go hybrid: shared for small tenants, dedicated for big ones."

[FILL IN: anything you personally handled with per-tenant databases, e.g. migrations, seed data or connection issues — only if true.]

## 🔁 Follow-up questions

### How do you run a migration on 200 tenant databases?

Write the migration as a script that loops over the tenant registry. Track which tenants are done, make each step safe to re-run, and run it in batches with logging. Never rely on someone running it by hand per tenant.

### How do you build a dashboard across all tenants with a database per tenant?

Copy the needed data into a separate analytics store (a data warehouse or a reporting database), using scheduled jobs or change streams. Don't query 200 databases live for every dashboard load.

### Can a database per tenant still leak data?

Yes, through other paths: a shared cache key, a file folder without a tenant prefix, a background job that opened the wrong connection, or a global "current tenant" variable mixed up between parallel requests.

## ✅ Quick check

### 1. A customer leaves and asks you to delete all their data. Which model makes this simplest?

:::answer
**Database per tenant.** You drop their database (plus their files and caches). In a shared database, you must delete by `tenantId` from every collection.
:::

### 2. Which is a real cost of the database-per-tenant model?

- A) Every query must include a `tenantId` filter
- B) Migrations must run once for every tenant's database
- C) Cross-tenant reports become easier

:::answer
**B.** A is a cost of the shared model, and C is the opposite: reports across tenants become harder.
:::
