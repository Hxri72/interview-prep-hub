---
template: chapter
title: Keeping every company's data apart
stack: skillkeepr-story
order: 13
level: Advanced
mustKnow: true
askedFrequency: very common
summary:
  - SkillKeepr gives every company (tenant) its own MongoDB database on shared servers.
  - "The tenant comes from the subdomain, travels as a header, and is locked inside the signed JWT. All three must match on every request."
  - Each request opens or reuses a connection to that company's database only.
  - Cache keys, background jobs and logs must carry the tenant too, or data can leak.
  - Write tests that try to read another company's data and expect a 403.
cards:
  - q: How does SkillKeepr keep companies apart?
    a: Each company has its own database. The tenant comes from the subdomain, is sent as a header, and is locked in the JWT. The server checks they match on every request.
  - q: Why put the tenant inside the JWT?
    a: The token is signed, so a user can't change it. A token from one company can't be reused against another company.
  - q: Where else must the tenant appear besides the database?
    a: In cache keys, background job messages, file paths in storage, and log lines. Anywhere data is stored or shared.
  - q: Database per tenant vs a tenantId field — one trade-off each?
    a: Per-tenant databases give strong isolation and easy per-company backup or delete. A shared collection with tenantId is cheaper and allows cross-company reports, but one missing filter leaks data.
  - q: How do you test tenant isolation?
    a: Log in as company A and call company B's URLs or IDs. The test passes only if every call returns 403 or 404.
---

## 💡 What happens in this chapter

Many companies use SkillKeepr at the same time. Each company is a **tenant** (a customer with its own private space).

Priya works at Acme Hiring. She must **only ever see Acme's** jobs and candidates. Never Globex's.

This chapter shows the locks that keep each company's data inside its own box.

## 🏠 Real-life example

Think of a **bank with safe-deposit lockers**.

- The **bank building** = the shared servers. Everyone uses the same building.
- **Each locker** = one company's database. It holds only that company's things.
- The **locker number on your key card** = the tenant inside the JWT. It's printed and can't be changed.
- The **guard who checks your card and the locker number** = the request guard. Both must match.
- A **bank clerk who mixes up two lockers** = a cache key without the tenant. A small mistake, a big leak.

## 🗺️ The flow

```text
Priya opens  acme.app.example.com
        │  (subdomain "acme" = the tenant)
        ▼
React app reads "acme" from the address
        │  sends header  x-tenant-id: acme
        │  sends HttpOnly cookie with the JWT { userId, role, tenantId: "acme" }
        ▼
API Gateway → Lambda
        │
        ▼
Request guard
   subdomain == header == JWT tenant ?  ── no ──► 403 "Wrong company"
        │ yes
        ▼
Open / reuse the connection to Acme's database only
        │
        ▼
Query  →  results from Acme's data  →  response
```

Background work follows the same rule. A job message always says which tenant it belongs to.

## 🧱 Tech used

| Piece | Technology | Learn it here |
|---|---|---|
| Tenant from the address | Subdomain per company | [Multi-tenant architecture](topic:architecture/multi-tenant) |
| Isolation model | One MongoDB database per company | [Shared DB vs DB per tenant](topic:architecture/shared-vs-db-per-tenant) |
| Locked identity | Signed JWT in an HttpOnly cookie | [JWT](topic:rest-auth/jwt), [Where to store tokens](topic:rest-auth/token-storage) |
| The check on every request | Auth guard (decorator / middleware) | [Custom middleware](topic:express/custom-middleware), [RBAC](topic:rest-auth/rbac) |
| Data design | Multi-tenant MongoDB design | [Multi-tenant data design](topic:mongodb/multi-tenant-design) |
| Shared caches | Tenant in every cache key | [Redis and cache-aside](topic:system-design/redis-cache-aside) |
| When it goes wrong | Debugging a leak | [A user sees another tenant's data](topic:debugging/cross-tenant-data-leak) |

## 🧑‍💻 Key code idea

A guard that checks all three tenant sources, plus a cache key that includes the tenant. Save as `tenant-guard.js`, run `node tenant-guard.js`.

```js
// tenant-guard.js — every request must stay inside one company's data
const companyFromHost = (host) => host.split('.')[0];       // "acme.app.example.com" → "acme"
const cache = new Map();                                     // a tiny in-memory cache (stands in for Redis)
function guard(req) {                                        // runs before every API handler
  const fromHost = companyFromHost(req.host);                // the company from the subdomain
  const fromHeader = req.headers['x-tenant-id'];             // the company the browser sends in a header
  const fromToken = req.token.tenantId;                      // the company locked inside the signed JWT
  if (fromHeader !== fromHost || fromToken !== fromHeader) { // all three must agree
    return { status: 403, body: 'Wrong company' };           // 403 = logged in, but not allowed here
  }                                                          // end of the check
  return null;                                               // null = the request may continue
}                                                            // end of guard
const cacheKey = (tenant, name) => `${tenant}:${name}`;      // the tenant is part of every cache key
function getJobs(tenant) {                                   // pretend database read, cached per company
  const key = cacheKey(tenant, 'jobs');                      // e.g. "acme:jobs"
  if (!cache.has(key)) cache.set(key, [`${tenant} job list`]); // fill the cache on the first read
  return cache.get(key);                                     // later reads come from the cache
}                                                            // end of getJobs
const priya = { host: 'acme.app.example.com', headers: { 'x-tenant-id': 'acme' }, token: { tenantId: 'acme' } }; // a normal request
const trick = { host: 'acme.app.example.com', headers: { 'x-tenant-id': 'globex' }, token: { tenantId: 'acme' } }; // a changed header
console.log('Priya:', guard(priya) ?? getJobs('acme'));      // allowed → Acme's jobs only
console.log('Trick:', guard(trick));                         // blocked → 403
console.log('Cache keys:', [...cache.keys()]);               // shows the tenant inside the key
```

```text
Priya: [ 'acme job list' ]
Trick: { status: 403, body: 'Wrong company' }
Cache keys: [ 'acme:jobs' ]
```

In the real platform, the token is verified first. Only then is its `tenantId` trusted.

## 🧗 Hard parts and trade-offs

- **Many connections.** Each company's database needs its own connection pool. More companies means more open connections, so pools must be reused and limited.
- **Hidden shared places.** The database is split, but caches, queues, file storage and logs are shared. Each one needs the tenant in its key, message or path.
- **Jobs without a request.** A scheduled job has no subdomain. It must loop over companies and set the tenant for each one on purpose.
- **Changes for every company.** A new index or data migration must run once per database, not once.

| | Database per tenant (SkillKeepr) | Shared collection + `tenantId` |
|---|---|---|
| Isolation | Strong: separate databases | Depends on every query having the filter |
| Backup / delete one company | Easy | Harder |
| Cost with many small tenants | Higher | Lower |
| Reports across all companies | Hard | Easy |
| Migrations | Run per database | Run once |

## 🙋 My part

- I worked on the **authentication modules** in the shared backend library, together with the team. Those modules check the token and its tenant on each request.
- [FILL IN: which part of the auth or tenant check you personally wrote or changed — only if true.]
- [FILL IN: a real tenant-related bug or test you worked on, if any.]

## 🗣️ How to explain it in an interview

> "SkillKeepr is multi-tenant, and we isolate tenants with a database per company on shared compute. The tenant comes from the subdomain. The frontend sends it as a header, and it's also locked inside the signed JWT, which lives in an HttpOnly cookie. On every request the auth layer checks that the header and the token's tenant match. Only then do we use that company's database connection, so a query can't even see another company's data.
>
> The tricky part is everything shared outside the database. Cache keys, queue messages and storage paths must all include the tenant. I worked on the shared authentication modules with the team. [FILL IN: your exact part.] To prove isolation, the test I'd write logs in as one company and tries another company's IDs, expecting 403."

## 🔁 Follow-up questions

### Why not just trust the tenant header?

Anyone can change a header in the browser. The JWT is signed by the server, so its tenant can't be faked. The header must match it.

### What happens in a scheduled job, with no user request?

The job lists all companies, then sets the tenant and opens that company's connection for each one in turn. It must never reuse one company's connection for another.

### Would you ever switch to a shared collection with tenantId?

Maybe for very many small customers, to save cost. Then every query needs the tenant filter, ideally added automatically in one data-access layer, and every index should start with `tenantId`.

### How would you find a cross-tenant leak?

Check the request logs for the tenant and user. Then look for queries, caches or jobs that ran without a tenant. See [this debugging scenario](topic:debugging/cross-tenant-data-leak).

## 📚 Topics to revise

- [Multi-tenant architecture](topic:architecture/multi-tenant)
- [Shared database vs database per tenant](topic:architecture/shared-vs-db-per-tenant)
- [Multi-tenant data design in MongoDB](topic:mongodb/multi-tenant-design)
- [JWT login flow](topic:rest-auth/jwt-login-flow)
- [Redis and cache-aside](topic:system-design/redis-cache-aside)
- [Resume: multi-tenant platform](topic:resume/multi-tenant-platform)
