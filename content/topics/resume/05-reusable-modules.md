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
  - "It holds shared pieces: data models, repositories (database query code), database connection handling, authentication and utilities like file storage and email."
  - I worked on this library, including the authentication modules, together with the team.
  - "The resume says this cut development time by about 30% — only say a number if you can explain how it was measured."
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
    a: "[FILL IN: the honest answer — or say it was the team's rough estimate.]"
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
- The resume says development time was cut by **about 30%**. [FILL IN: how this was measured — compare ticket times before/after, or the team's estimate. If it was only an estimate, say "roughly" or remove the number.]

## 🗣️ How to answer in an interview

> "At SkillKeepr we have several backend services, and they share a lot: the data models, repository code, database connection handling for each tenant, authentication, and utilities like email and file storage. So the team keeps all of that in one shared library, which every service imports.
>
> I worked on that library with the team, especially the authentication modules — reading the login token, checking the tenant and checking permissions. Having auth in one place means every service checks access the same way.
>
> The benefit is speed and consistency: new features reuse tested building blocks instead of copying code. [FILL IN: the 30% claim and how it was measured — or say 'it noticeably cut our development time'.] The risk is that one change affects every service, so we test changes against more than one service before releasing."

## 🔁 Follow-up questions

### What exactly was reusable?

Models, repositories, database connection handling, authentication and utilities like email and file storage. [FILL IN: the pieces you know best.]

### How do you share code between services?

Common ways are a private npm package with versions, a monorepo with workspaces, or a git submodule. Packages give clear versions. Submodules are simple, but each service pins a different commit, so they can drift apart.

### How do you change shared code safely?

Keep changes backward-compatible when you can. Add tests in the library. Test it inside more than one service before releasing. Tell the team what changed.

### How would you prove the 30%?

Compare the time to build similar features before and after, using sprint tickets or story points. If there's no data, say it honestly: "it was the team's estimate."

### Why put authentication in a shared library?

Security code should exist **once**. One correct, tested version is safer than five copies, where one might have a bug.

## 📚 Topics to revise

- [Project structure: routes → controllers → services → models](topic:express/project-structure)
- [Writing custom middleware (auth, roles)](topic:express/custom-middleware)
- [Modules: CommonJS vs ES Modules](topic:nodejs/commonjs-vs-esm)
- [npm and package.json](topic:nodejs/npm-and-package-json)
- [Multi-tenant platform](topic:resume/multi-tenant-platform)
