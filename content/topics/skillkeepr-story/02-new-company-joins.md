---
template: chapter
title: "A new company joins: tenants, subdomains and a database per company"
stack: skillkeepr-story
order: 2
level: Intermediate
mustKnow: true
askedFrequency: common
summary:
  - A new customer company is called a tenant. SkillKeepr staff set it up from the cloud-admin portal.
  - The company gets its own subdomain (like acme.skillkeepr...) and its own MongoDB database.
  - A tenant registry maps each subdomain to the right database, so every request knows where its data lives.
  - Setup also creates the company's first admin user, default roles and a trial plan, then checks that everything works.
  - Database-per-tenant gives strong isolation, but you manage many databases and many connections.
cards:
  - q: What is a tenant in SkillKeepr?
    a: One customer company. Each tenant gets its own subdomain and its own MongoDB database.
  - q: Who creates a new tenant?
    a: SkillKeepr staff, from the cloud-admin portal. An automated setup process does the rest.
  - q: How does the backend know which database to use?
    a: The tenant comes from the subdomain. A tenant registry maps that tenant to its database, and the backend opens or reuses a connection to it.
  - q: Why one database per company instead of a tenantId field?
    a: Strong isolation, easy per-company backup and delete, and no risk of forgetting a tenant filter. The cost is many databases and connections to manage.
  - q: What gets created for a new company?
    a: Its database, the default roles and permissions, the first admin user, a starting plan, and the DNS name for its subdomain.
---

## 💡 What happens in this chapter

**Acme Hiring** signs up for SkillKeepr. Before Priya can log in, Acme must exist in the system.

In SkillKeepr, each customer company is a **tenant**. A new tenant gets two things of its own: a **subdomain** (its own web address) and its **own MongoDB database**.

SkillKeepr staff start this from the **cloud-admin portal**. An automated setup process does the heavy work.

## 🏠 Real-life example

Think of a **bank opening a locker for a new family**.

- The **bank building** = SkillKeepr. Everyone uses the same building.
- The **new family** = Acme Hiring, the new tenant.
- **Their own locker, with their own key** = Acme's own database. Other families can't open it.
- The **locker number on their card** = the subdomain, `acme`. It tells the staff which locker is theirs.
- The **bank's register of families → locker numbers** = the tenant registry.
- The **bank manager who opens the account** = SkillKeepr staff in the cloud-admin portal.

## 🗺️ The flow

```text
SkillKeepr staff (cloud-admin portal)
   │  "Add company: Acme Hiring, plan: trial"
   ▼
Cloud-admin backend saves Acme as "in progress"
   │
   ▼
Automated setup process (runs in the background)
   ├─ create Acme's MongoDB database
   ├─ add default roles + permissions + first admin user + starting plan
   ├─ add Acme to the tenant registry  (acme → acme's database)
   └─ create the DNS name for acme's subdomain
   │
   ▼
Health check: do the Acme portals and APIs answer?
   │
   ├─ yes → mark Acme "completed", email the admin login details
   └─ no  → staff look at the setup logs
```

After this, a request to `acme.<platform domain>` always reaches Acme's database.

## 🧱 Tech used

| Piece | Technology | Learn it |
|---|---|---|
| Who is the tenant? | Subdomain of the address | [Multi-tenant architecture](topic:architecture/multi-tenant) |
| Where is the data? | One MongoDB database per company | [Shared vs per-tenant database](topic:architecture/shared-vs-db-per-tenant) |
| Finding the right database | Tenant registry + reused connections per tenant | [Connection pooling and scaling](topic:mongodb/scaling-overview) |
| Web address | DNS records for the subdomain | [Domains, DNS and HTTPS](topic:devops/dns-https) |
| Background setup | Automated setup jobs and status tracking | [Queues and background jobs](topic:system-design/queues-background-jobs) |
| Data design | Multi-tenant data rules | [Multi-tenant data design](topic:mongodb/multi-tenant-design) |

## 🧑‍💻 Key code idea

How a request finds its company's database. Save it as `tenant.js` and run `node tenant.js`.

```js
const registry = new Map([                          // the tenant registry: subdomain → database name
  ['acme', 'acme_db'],                              // Acme Hiring has its own database
  ['globex', 'globex_db'],                          // another company, another database
]);                                                 // end of the registry
const connections = new Map();                      // open connections we can reuse, one per tenant
function tenantFromHost(host) {                     // read the tenant from a hostname
  return host.split('.')[0];                        // "acme.skillkeepr.example" → "acme"
}                                                   // end of tenantFromHost
function getConnection(tenant) {                    // find (or open) the database for a tenant
  const dbName = registry.get(tenant);              // look up the tenant's database name
  if (!dbName) throw new Error(`Unknown tenant: ${tenant}`); // stop if the company doesn't exist
  if (!connections.has(tenant)) {                   // first request for this tenant?
    console.log(`  opening a new connection to ${dbName}`); // pretend to connect (real code: mongoose.createConnection)
    connections.set(tenant, { dbName });            // remember it for the next request
  }                                                 // end of the "first time" branch
  return connections.get(tenant);                   // give back the same connection every time
}                                                   // end of getConnection
for (const host of ['acme.skillkeepr.example', 'acme.skillkeepr.example', 'globex.skillkeepr.example', 'evil.skillkeepr.example']) { // four requests
  try {                                             // a bad tenant must not crash the server
    const tenant = tenantFromHost(host);            // step 1: which company is this?
    console.log(`${host} → ${getConnection(tenant).dbName}`); // step 2: which database answers?
  } catch (err) {                                   // the tenant was not found
    console.log(`${host} → rejected (${err.message})`); // reply with an error instead
  }                                                 // end of try/catch
}                                                   // end of the loop
```

```text
  opening a new connection to acme_db
acme.skillkeepr.example → acme_db
acme.skillkeepr.example → acme_db
  opening a new connection to globex_db
globex.skillkeepr.example → globex_db
evil.skillkeepr.example → rejected (Unknown tenant: evil)
```

Notice: the second Acme request **reuses** the connection. Opening a database connection is slow, so you keep it. The unknown tenant is **rejected**, not guessed.

## 🧗 Hard parts and trade-offs

| Database per company (SkillKeepr) | One shared database with a `tenantId` field |
|---|---|
| Strong isolation: data lives apart | Isolation depends on every query having the filter |
| Easy to back up or delete one company | Deleting one company means filtering everywhere |
| No tenant filter needed inside one database | Every query and index must start with `tenantId` |
| Many databases, many connection pools | One database, simpler to run |
| Changes to the schema run once per company | Changes run once |
| Reports across all companies are harder | Cross-company reports are easy |

Other hard parts:
- **Setup can fail halfway.** So each step reports its status, and staff can see where it stopped.
- **Connections add up.** Each server keeps a pool per company it has served. With many companies, that needs care (see [connection pooling](topic:mongodb/scaling-overview)).

## 🙋 My part

[FILL IN: Did you work on tenant setup or the connection handling? If not, say "I didn't build tenant setup, but I worked inside this design every day — every API I wrote ran against the tenant's own database."]

What I can say for sure: the backend I worked on runs on this **database-per-tenant** design, and I worked on the shared backend library that many services use, including the auth modules.

## 🗣️ How to explain it in an interview

> "SkillKeepr is multi-tenant with a database per company. When a new company signs up, our staff add it from a cloud-admin portal. An automated process creates the company's MongoDB database, seeds roles and the first admin user, registers the company in a tenant registry, and sets up its subdomain. After a health check, the admin gets their login details.
>
> At runtime, the tenant comes from the subdomain. The backend looks it up in the registry and opens or reuses a connection to that company's database. I like this design because isolation is strong and you can't forget a tenant filter. The trade-off is managing many databases and connection pools, and cross-company reports are harder."

## 🔁 Follow-up questions

### What happens if the setup fails halfway?

The company stays "in progress" and each step's status is logged. Staff can see the failed step, fix it and run it again. Steps should be safe to repeat.

### How would you delete a company's data?

With a database per company, you can back up and then drop that one database. You also remove its registry entry and DNS name.

### What's the risk of keeping a connection per tenant?

Memory and connection limits. Many tenants means many pools on each server. You can close idle ones, set smaller pool sizes, or cap how many you keep.

### Would you choose the same design for a new product?

For a few large customers with strict data rules, yes. For thousands of tiny customers, a shared database with a `tenantId` on every document is often simpler. See [shared vs per-tenant database](topic:architecture/shared-vs-db-per-tenant).

## 📚 Topics to revise

- [Multi-tenant architecture](topic:architecture/multi-tenant)
- [Shared database vs database per tenant](topic:architecture/shared-vs-db-per-tenant)
- [Multi-tenant data design in MongoDB](topic:mongodb/multi-tenant-design)
- [Multi-tenant platform (resume)](topic:resume/multi-tenant-platform)
- [Domains, DNS and HTTPS](topic:devops/dns-https)
