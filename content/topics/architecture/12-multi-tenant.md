---
title: Multi-tenant architecture
stack: architecture
order: 12
level: Intermediate
mustKnow: true
askedFrequency: very common
summary:
  - A multi-tenant system serves many customer companies (tenants) from one shared product, while keeping each company's data separate.
  - "First, identify the tenant on every request: from the subdomain, a header, or a claim inside the login token."
  - "Never trust the tenant the browser sends on its own. Pin the tenant inside the signed JWT, and reject a request if the header and token disagree."
  - "Isolation models: shared everything (pool), separate database per tenant (silo), or a mix (bridge)."
  - "Also isolate caches, files, logs, background jobs and limits — not just the database."
cards:
  - q: What is a tenant?
    a: One customer company using a SaaS product. A multi-tenant system serves many tenants from the same code and infrastructure.
  - q: Name three ways to identify the tenant of a request.
    a: "From the subdomain (acme.app.com), from a header (like x-tenant-id), or from a claim inside the verified login token. Often a mix: the subdomain gives the header, and the JWT confirms it."
  - q: Why pin the tenant inside the JWT?
    a: So a token issued for one tenant can't be used against another. If the header says "zen" but the token says "acme", the server rejects the request.
  - q: What are the silo, pool and bridge models?
    a: "Silo: each tenant gets separate resources (like its own database). Pool: everyone shares the same resources, separated by a tenant id. Bridge: a mix, like shared servers with a database per tenant."
  - q: What is the noisy-neighbour problem?
    a: One big or busy tenant uses so much shared capacity that other tenants get slow. Fix it with per-tenant limits, quotas or moving big tenants to their own resources.
---

## 💡 What is it?

A **[multi-tenant](glossary:multi-tenant)** system is **one product used by many customer companies**. Each company is a **tenant**.

They all use the same code and the same servers. But each company must only ever see **its own data**.

So the system must do two jobs on **every** request:
1. **Find out which tenant** the request belongs to.
2. **Keep that tenant's data separate** from everyone else's.

## 🏠 Real-life example

Think of a **big apartment building**.

- Everyone shares the **building, the lift and the water tank**. That's shared infrastructure.
- Each family has **its own flat with its own key**. That's separate data.
- At the gate, the **watchman checks your ID card** before letting you go to flat 12. You can't just say "I live in flat 12".
- One family running a **huge party** uses all the lift time, and others wait. That's the noisy-neighbour problem.

Map it:
- **Building** = the SaaS product.
- **Family** = a tenant (a customer company).
- **Flat number on your address** = the subdomain (`acme.app.com`).
- **ID card checked at the gate** = the verified JWT with the tenant inside.
- **Your own flat** = the tenant's own data (its own database, or rows with its tenant id).
- **The party hogging the lift** = a noisy neighbour.

## 🧑‍💻 Code example

This shows the "find the tenant and check it" step. Save as `tenant.js` and run `node tenant.js`.

```js
function tenantFromHost(host) {                           // find the tenant from the web address
  const sub = host.split('.')[0];                         // "acme.admin.example.com" → "acme"
  return /^[a-z0-9-]+$/.test(sub) ? sub : null;           // allow only safe names, else null
}                                                         // end of tenantFromHost

function checkRequest(req) {                              // what middleware does on every request
  const headerTenant = req.headers['x-tenant-id'];        // tenant sent by the browser (from its subdomain)
  if (!headerTenant) return '400 no tenant';              // no tenant → reject
  const token = req.verifiedToken;                        // the JWT, already checked by the auth step
  if (!token) return '401 not logged in';                 // no valid token → reject
  if (token.tenantId !== headerTenant) return '403 tenant mismatch'; // token is pinned to ONE tenant
  return `200 OK — use the database for "${headerTenant}"`; // safe: pick this tenant's data
}                                                         // end of checkRequest

const tenant = tenantFromHost('acme.admin.example.com');  // the browser works out its tenant
console.log('tenant from host:', tenant);                 // prints "acme"
console.log(checkRequest({ headers: { 'x-tenant-id': 'acme' }, verifiedToken: { userId: 'u1', tenantId: 'acme' } })); // normal request
console.log(checkRequest({ headers: { 'x-tenant-id': 'zen' }, verifiedToken: { userId: 'u1', tenantId: 'acme' } }));  // acme's token used on zen
console.log(checkRequest({ headers: { 'x-tenant-id': 'acme' } }));       // no token at all
```

**Output:**

```text
tenant from host: acme
200 OK — use the database for "acme"
403 tenant mismatch
401 not logged in
```

The header tells the server **where** to look. The signed token proves the user **belongs** there. Both must agree.

## 🔍 Deeper version

**Ways to identify the tenant:**

| Method | Example | Notes |
|---|---|---|
| Subdomain | `acme.app.com` | clean for users; needs wildcard DNS and certificates |
| Path | `app.com/acme/...` | easy, but easy to forget in links |
| Header | `x-tenant-id: acme` | simple for APIs; must be verified, never trusted alone |
| Token claim | `tenantId` inside the JWT | the strongest proof, set by the server at login |
| Custom domain | `jobs.acme.com` | needs a domain → tenant lookup table |

**SkillKeepr's approach (high level):** the browser reads the tenant from its subdomain and sends it as a header. The server picks the tenant's database from it. The tenant is also **pinned inside the JWT**, and a mismatch is rejected. So a token from one company can't be replayed against another.

**Isolation models:**

| Model | What is shared | Isolation | Cost |
|---|---|---|---|
| **Pool** | everything; rows carry a `tenantId` | logical (every query filters) | lowest |
| **Bridge** | servers shared, **database per tenant** | strong for data | medium |
| **Silo** | separate stack per tenant | strongest | highest |

SkillKeepr uses a **database per tenant on shared servers** (bridge). See [Shared database vs database per tenant](topic:architecture/shared-vs-db-per-tenant) and the MongoDB view in [Multi-tenant data design](topic:mongodb/multi-tenant-design).

**Carry the tenant through the request.** Middleware resolves the tenant once. Then it must reach every layer: repositories, logs, background jobs. In Node, `AsyncLocalStorage` can hold per-request context safely. Avoid one global "current tenant" variable shared by parallel requests; that's a classic leak.

**Isolate more than the database:**
- **Cache keys:** `tenant:acme:jobs`, never just `jobs`.
- **Files:** a folder (or bucket prefix) per tenant, checked before serving.
- **Background jobs and events:** put the tenant in the message, and set it again in the worker.
- **Scheduled jobs:** loop over tenants, and handle one tenant's failure without stopping the rest.
- **Limits:** rate limits and quotas per tenant, to stop noisy neighbours.
- **Config:** per-tenant settings (time zone, email setup, plan features).

**Tenant onboarding.** A new customer needs a record in a tenant registry, a database or schema, DNS (for subdomains), seed data and an admin user. Automate it so it's repeatable.

## 🎯 Why do we use it?

Running a separate copy of the whole app for every customer is expensive and slow to update. Multi-tenancy lets one team run **one** product for hundreds of companies. Updates ship to everyone at once, and costs are shared.

But hiring data is personal. A leak between companies destroys trust and can break privacy laws. Good multi-tenant architecture makes **isolation the default**: the tenant is checked on every request, and every layer respects it.

## ⚠️ Common mistakes

- **Trusting a tenant id from the body, query or header alone.** Anyone can change it. Confirm it against the verified token.
- **A global "current tenant" variable** in a server that handles many requests at once. Two requests can mix tenants.
- **Forgetting caches, files and background jobs.** The database is isolated, but a shared cache key leaks data anyway.
- **No per-tenant limits.** One heavy customer slows everyone down.

## 🗣️ How to answer in an interview

> "Multi-tenant means one product serves many customer companies, and each must only see its own data. There are two parts. First, identify the tenant on every request. That can come from the subdomain, a header or a claim in the token. In our platform, the frontend takes the tenant from the subdomain and sends it as a header, and the tenant is also pinned inside the JWT, so a token for one company is rejected on another.
>
> Second, isolate the data. You can share everything with a tenantId on every row, give each tenant its own database, or give each tenant a full separate stack. We use a database per tenant on shared servers, which gives strong data isolation without running a separate stack per customer.
>
> I also make sure caches, files, background jobs and logs carry the tenant, and that there are per-tenant limits for noisy neighbours."

[FILL IN: the part of the multi-tenant flow you personally worked on, if any.]

## 🔁 Follow-up questions

### How do you stop one tenant's token being used for another tenant?

Put the tenant id inside the signed JWT at login. On every request, compare it with the tenant the request is aimed at (header or subdomain). If they differ, return 403.

### How do background jobs know which tenant they're working for?

The job message includes the tenant id. The worker reads it and opens the right database (or sets the right filter) before doing any work. Scheduled jobs loop over the tenant list.

### How would you handle a customer who wants their data in a specific country?

Run a separate deployment or database in that region and route that tenant there. A tenant registry stores which region each tenant lives in.

### How do you test tenant isolation?

Create data for tenant A and tenant B. Then, logged in as A, try to read, change and delete B's records by id and by search. Every attempt must fail with 403 or 404. Run these tests in CI.

## ✅ Quick check

### 1. The header says `x-tenant-id: zen`, but the user's verified JWT says `tenantId: acme`. What should the server do?

:::answer
**Reject it (403).** The token is pinned to `acme`. Using it against `zen` is either a bug or an attack.
:::

### 2. Which model has the strongest data isolation?

- A) Pool: shared tables with a tenantId column
- B) Bridge: a database per tenant on shared servers
- C) Silo: a fully separate stack per tenant

:::answer
**C) Silo.** Nothing is shared. It's also the most expensive. Bridge is a common middle ground.
:::

### 3. Why is a cache key like `jobs:list` dangerous in a multi-tenant app?

:::answer
All tenants share it. One company's cached job list could be shown to another company. Use `tenant:<id>:jobs:list`.
:::
