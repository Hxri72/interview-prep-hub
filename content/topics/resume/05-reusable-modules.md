---
template: story
title: "Reusable backend modules: the shared core-service library"
stack: resume
order: 5
level: Intermediate
mustKnow: false
askedFrequency: common
summary:
  - SkillKeepr has a shared backend library ("core-service") used by several services, so common code is written once.
  - I worked on this library, including the authentication modules, together with the team.
  - "Shared patterns: a response builder, an authorizer decorator for protected handlers, pagination and sorting helpers, and data-transformation helpers."
  - "The ~30% faster development is an estimate, not a measured number. Always say \"about\" or \"an estimated\"."
  - I don't claim I built the whole library. I say which parts I worked on and which ones I reused.
cards:
  - q: What were the reusable backend modules?
    a: A shared library used across services — models, repositories, database connection handling, authentication and utilities — so new features don't rebuild the same code.
  - q: What did you work on in it?
    a: "The authentication modules, together with the team. [FILL IN: one more concrete piece you touched.]"
  - q: How do you share code between services without copy-paste?
    a: As a shared library — a private npm package, a monorepo package, or a git submodule. Each service uses a pinned version.
  - q: What is the risk of a shared library?
    a: Drift and breaking changes. If services use different versions, a fix in one place isn't everywhere. You need versioning and clear ownership.
  - q: How did you measure "30% faster"?
    a: We didn't measure it formally. It's an estimate of the time saved by reusing shared code instead of rewriting it for each feature.
  - q: What is an authorizer decorator?
    a: A small wrapper you put around a protected handler. It runs the login and permission checks first, so each handler doesn't repeat that code.
---

## 💡 What is it?

SkillKeepr has several backend services. Many of them need the **same building blocks**:
- connecting to the right database,
- the data models,
- checking who is logged in,
- sending emails and storing files.

Instead of writing these again in every service, the team keeps them in **one shared library**, called **core-service**. Each service imports it.

I worked on this library, including the **authentication modules**, together with the team.

## 🏠 Real-life example

Think of a **school with one shared science lab**.

- Each **class** = one backend service.
- The **lab equipment** = the shared library: microscopes, beakers, safety rules.
- Every class uses the **same lab**, instead of buying its own microscopes.
- If the lab gets a **better microscope**, every class benefits.
- But if one teacher **changes the safety rules**, every class must know. That's the risk of sharing.

## 🧩 The problem

Without a shared library:
- the same code is **copied** into many services,
- a bug fixed in one copy stays **broken** in the others,
- new features take longer, because developers rebuild the same pieces.

Authentication is the worst place for copies. One weak copy can become a security hole.

## 🛠️ What I built

**What's in the shared library (high level):**
- **Data models** — the shapes of candidates, jobs, interviews and so on.
- **Repositories** — reusable query code for the database.
- **Database connection handling** — picking and reusing the right tenant database.
- **Authentication** — reading the login token, checking the tenant and checking permissions.
- **Utilities** — file storage, email and other common helpers.

**Common patterns the team reused in every service:**

| Pattern | What it does in simple words |
|---|---|
| **Response builder** | Builds every API reply in the same shape, e.g. `{ success, data, message }`. |
| **Authorizer decorator** | A wrapper around a protected handler. It checks the login token and permissions before the handler runs. |
| **Pagination and sorting helpers** | Turn `?page=2&sort=name` into the right database query, the same way everywhere. |
| **Data-transformation helpers** | Turn database records into the shape the frontend expects. |
| **Stripe and integration wrappers** | One place to call outside services like Stripe. |

A **decorator** is a function that wraps another function and adds extra behaviour, like a check that runs first. Here is the idea (not the real code). Save it as `authorize.js` and run `node authorize.js`:

```js
function withAuth(handler, role) {                      // takes a handler and the role it needs, e.g. 'admin'
  return (req) => {                                     // returns a new handler that wraps the old one
    if (!req.user) return { status: 401 };              // 401 = not logged in
    if (req.user.role !== role) return { status: 403 }; // 403 = logged in, but not allowed
    return handler(req);                                // checks passed → run the real handler
  };                                                    // end of the wrapper
}                                                       // end of withAuth

const deleteJob = withAuth(() => ({ status: 200 }), 'admin'); // 200 = OK; only admins may delete a job
console.log(deleteJob({ user: { role: 'admin' } }));    // an admin → allowed
console.log(deleteJob({ user: { role: 'viewer' } }));   // a viewer → blocked
```

```text
{ status: 200 }
{ status: 403 }
```

When I built features, I followed these patterns and reused the shared modules instead of writing the same logic again.

**My part:** I worked on the authentication modules with the team.
[FILL IN: exactly what you did in auth — e.g. token checks, permission checks, login flow — and anything else you added to the library.]

**How code sharing usually works:**
- a **private npm package**, with versions,
- a **monorepo** (many projects in one repository),
- or a **git submodule** (one repository inside another, pinned to a commit).

[FILL IN: which one SkillKeepr uses, if you want to mention it.]

## 🧗 The hard part

**Changing shared code is risky.** One change can affect every service that uses it. You must think about every caller, and test more than one service.

**Keeping versions in sync.** Different services can use different versions of the library. A fix may reach one service but not another.

[FILL IN: a real moment where a shared-library change was tricky for you.]

## 🏆 The result

- New features reuse ready-made pieces, so they are faster to build.
- Auth works the same way in every service.
- Endpoints look and behave the same, because they share the response, auth and pagination code.
- The resume says development time was cut by **about 30%**. This is an **estimate**, not a before-and-after measurement. Always say "about" or "an estimated".

## 🗣️ How to answer in an interview

> "At SkillKeepr we have several backend services, and they share a lot: the data models, repository code, database connection handling for each tenant, authentication, and utilities like email and file storage. So the team keeps all of that in one shared library, which every service imports.
>
> I worked on that library with the team, especially the authentication modules — reading the login token, checking the tenant and checking permissions. Having auth in one place means every service checks access the same way.
>
> We also reused common patterns: a response builder so every endpoint replies in the same shape, an authorizer decorator for protected handlers, and pagination and sorting helpers. When I built features, I followed these instead of rewriting the logic.
>
> The benefit is speed and consistency. We estimate it cut development time by about 30%, but that's an estimate, not a formal measurement. The risk is that one change affects every service, so we test changes against more than one service before releasing."

## 🔁 Follow-up questions

### What exactly was reusable?

Models, repositories, database connection handling, authentication and utilities like email and file storage. [FILL IN: the pieces you know best.]

### How do you share code between services?

Common ways are a private npm package with versions, a monorepo with workspaces, or a git submodule. Packages give clear versions. Submodules are simple, but each service pins a different commit, so they can drift apart.

### How do you change shared code safely?

Keep changes backward-compatible when you can. Add tests in the library. Test it inside more than one service before releasing. Tell the team what changed.

### How would you prove the 30%?

Compare the time to build similar features before and after, using sprint tickets or story points. If there's no data, say it honestly: "it was the team's estimate."

### Did you build the whole shared library yourself?

No, and I don't claim that. I worked on parts of it, especially authentication, with the team. Many other utilities already existed, and I reused them. I can explain which parts I worked on and which I only used.

### How do you explain the "about 30%" number?

It's an estimate of the time saved by reusing shared patterns. The code clearly shows less repeated code. But we didn't measure the exact percentage before and after.

### Why put authentication in a shared library?

Security code should exist **once**. One correct, tested version is safer than five copies, where one might have a bug.

## 📚 Topics to revise

- [Project structure: routes → controllers → services → models](topic:express/project-structure)
- [Writing custom middleware (auth, roles)](topic:express/custom-middleware)
- [Modules: CommonJS vs ES Modules](topic:nodejs/commonjs-vs-esm)
- [npm and package.json](topic:nodejs/npm-and-package-json)
- [Multi-tenant platform](topic:resume/multi-tenant-platform)
