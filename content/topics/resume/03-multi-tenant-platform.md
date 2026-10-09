---
template: story
title: "Multi-tenant platform: API design to production"
stack: resume
order: 3
level: Intermediate
mustKnow: true
askedFrequency: very common
summary:
  - SkillKeepr uses database-per-tenant — each customer company has its own MongoDB database, but all companies share the same servers and code.
  - The tenant comes from the company's subdomain, travels to the API as a request header, and is also locked inside the login token (JWT).
  - If the token's tenant and the header's tenant don't match, the request is rejected — a token can't be used on another company.
  - "Upside: strong isolation and easy per-company backup or deletion. Downside: many database connections and per-tenant migrations."
cards:
  - q: How is multi-tenancy done at SkillKeepr?
    a: Database-per-tenant on shared compute. Each company has its own MongoDB database; the code picks the right database for each request.
  - q: How does the backend know which company a request is for?
    a: The frontend reads the company from the subdomain and sends it as a header. The same tenant is stored inside the JWT, and the server checks they match.
  - q: Why put the tenant inside the JWT too?
    a: So a user logged in to company A cannot reuse their token against company B by changing the header.
  - q: Database-per-tenant vs a shared collection with tenantId — trade-offs?
    a: "Per-tenant: strong isolation, no forgotten filter, easy backup/delete, but more connections and per-tenant migrations. Shared: cheaper and simpler to query across tenants, but every query must filter by tenantId."
---

## 💡 What is it?

**[Multi-tenant](glossary:multi-tenant)** means one app serves many customer companies (tenants) at the same time.

SkillKeepr uses **database-per-tenant**. Every customer company gets **its own MongoDB [database](glossary:database)**. The servers and the code are shared.

This page explains how a request finds the right company's data, and how a company's data is kept safe from other companies.

## 🏠 Real-life example

Think of a **bank with private lockers**.

- The **bank building** = the shared servers and code.
- Each **locker** = one company's own database.
- Your **locker number on the door** = the subdomain (like `acme.yourapp.com`).
- Your **key** = the login token (JWT). The key has the locker number printed on it.
- The **guard** checks that the number on your key matches the locker you are opening. If not, you are stopped.

## 🧩 The problem

Many companies use SkillKeepr. One company must **never** see another company's candidates or jobs. A leak would be a serious legal and trust problem.

At the same time, running a separate copy of the whole app for every company would be too expensive.

## 🛠️ What I built

**How it works at SkillKeepr (team design):**

```text
User opens  acme.<app domain>
   │  the React app reads "acme" from the subdomain
   ▼
Every API request carries a tenant header: acme
   │
   ▼
Lambda: read the tenant → open (or reuse) the connection to acme's database
   │
   ▼
Auth check: the JWT says tenant = acme? → yes → continue
                                        → no  → reject the request
   ▼
Queries run on acme's database only — no tenantId filter needed in each query
```

- Database connections are **kept and reused** between requests, so each request doesn't reconnect.
- **Scheduled jobs** (crons) loop over every tenant, one by one.
- A separate **cloud-admin portal** adds new companies. It creates their database and settings.

**The other common design** is one shared database, with a `tenantId` field on every document. That is explained in [Multi-tenant data design](topic:mongodb/multi-tenant-design).

**What I personally did here:** [FILL IN: your part — e.g. tenant-aware endpoints you wrote, auth module work, a bug you fixed. Only what is true.]

## 🧗 The hard part

**Keeping isolation correct everywhere.** Every place that touches data must use the right tenant connection. That includes background jobs and queues, not only HTTP requests.

**Connections.** Each tenant needs its own database connection. With many tenants and many Lambda copies, the number of open connections can grow fast.

[FILL IN: the hardest tenant-related issue you personally hit.]

## 🏆 The result

- Each company's data lives in its own database, so a forgotten filter can't leak data.
- Backing up or deleting one company is simple.
- [FILL IN: number of tenants, if you know and can share it.]

## 🗣️ How to answer in an interview

> "SkillKeepr is multi-tenant with a database-per-tenant model. Every customer company has its own MongoDB database, but they all share the same Lambda code and servers.
>
> The frontend reads the company from the subdomain and sends it as a header on every request. The backend uses that to open, or reuse, the connection to that company's database. The same tenant is stored inside the JWT, and our auth check rejects the request if the token's tenant doesn't match the header. So a token from one company can't be used on another.
>
> The benefit is strong isolation. We don't need a tenantId filter on every query, and backing up or deleting one customer is simple. The cost is many database connections, and running migrations once per tenant. If I had to choose for a small product, I might start with a shared database and a tenantId on every document, because it's cheaper. For a B2B product with strict data separation, database-per-tenant makes sense."

[FILL IN: add one sentence about what you personally built or fixed in this area.]

## 🔁 Follow-up questions

### Shared database vs database-per-tenant — which would you pick?

It depends. A shared database is cheaper and easy to query across tenants, but every query must filter by `tenantId`. Database-per-tenant gives stronger isolation and easy per-customer backup or delete, but costs more connections and work per tenant. Many SaaS products start shared and move big customers to their own database later.

### How do you stop a user from reading another company's data?

Two locks. The request is routed to that company's database. And the tenant inside the JWT must match the tenant in the request. Then the user's role and permissions are checked.

### What happens with background jobs?

There is no HTTP header in a cron. So the job **loops over all tenants**, connects to each database in turn, does its work, and moves on. One slow tenant can slow the whole loop, so timeouts matter.

### How do you add a new company?

Through the cloud-admin portal. It creates the company's database, seed data (roles, admin user, plan) and settings, then sends the admin their login details. [FILL IN: if you worked on any of this.]

### How would you test tenant isolation?

Write tests where a user of tenant A calls an API with tenant B's header, and expect a rejection. Also test that a cron touches each tenant's data only in that tenant's database.

## 📚 Topics to revise

- [Multi-tenant data design](topic:mongodb/multi-tenant-design)
- [Multi-tenant architecture](topic:architecture/multi-tenant)
- [Writing custom middleware (auth, roles)](topic:express/custom-middleware)
- [Connection pooling and replica sets](topic:mongodb/scaling-overview)
- [Platform architecture](topic:resume/platform-architecture)
