---
title: Micro-frontends
stack: mern-architectures
order: 9
level: Intermediate
mustKnow: false
askedFrequency: sometimes
template: pattern
section: Frontend and rendering
summary:
  - "Micro-frontends split one big frontend into smaller apps. Each team builds, tests and deploys its own part."
  - "A host app (the shell) loads the parts at runtime, often with webpack Module Federation, or simply by route or subdomain."
  - They help large organisations with many teams. For a small team they add more cost than benefit.
  - "Share a few things on purpose: React (as a singleton), a design system, and the auth session."
cards:
  - q: What is a micro-frontend?
    a: A separately built and deployed piece of the UI, owned by one team, that a host app puts together with other pieces.
  - q: Name three ways to combine micro-frontends.
    a: "Split by route or subdomain (separate apps), runtime loading with Module Federation, or build-time packages (npm libraries)."
  - q: What problem do micro-frontends solve?
    a: Many teams blocking each other in one huge frontend codebase. Each team can now release on its own.
  - q: What's a common pitfall?
    a: Loading several copies of React or different design styles, so the app gets heavy and looks inconsistent.
---

## 💡 What is it?

A **micro-frontend** is a small piece of a website that one team builds and deploys **on its own**.

Instead of one huge React app, you have several small apps. A **host** app (also called the shell) puts them together on one screen.

It's the frontend version of [microservices](glossary:microservice).

## 🏠 Real-life example

Think of a **food court in a mall**.

- **The food court** = the host (shell) app. It gives tables, signs and one entrance.
- **Each food stall** = a micro-frontend. The pizza stall and the dosa stall have their own staff and menus.
- **A stall changing its menu** = one team deploying its part. The other stalls don't close.
- **The mall's common rules** (same tray size, same payment card) = shared things: the design system and login.

## 🗺️ The diagram

```text
                       Browser
                          │ opens app.example.com
                          ▼
              ┌───────────────────────────┐
              │  Host / shell app (React) │  header, menu, login session
              └───┬───────────┬───────────┘
      loads at    │           │           │  runtime
      runtime     ▼           ▼           ▼
          Jobs MFE      Candidates MFE   Billing MFE      (each built + deployed by its own team)
          (team A)      (team B)         (team C)
             │              │               │
             ▼              ▼               ▼
          Jobs API     Candidates API   Billing API  ──▶ MongoDB (each service owns its data)
```

## 🧑‍💻 Code example

The simplest way: split by **route**. Each part is its own app at its own path. The host just links to them. No special tools.

Save as `host.js`. Run `npm install express` then `node host.js`. Open http://localhost:3000.

```js
const express = require('express');                         // load Express
const app = express();                                      // the host (shell) server

app.get('/', (req, res) => res.send(`                       <!-- home page of the shell -->
  <nav><a href="/jobs">Jobs</a> | <a href="/billing">Billing</a></nav> <!-- shared menu -->
  <p>Welcome! Pick a section.</p>`));                       // the shell: shared menu only

app.get('/jobs', (req, res) =>                              // team A's part
  res.send('<h1>Jobs app (team A, deployed on its own)</h1>')); // in real life: a separate React build

app.get('/billing', (req, res) =>                           // team C's part
  res.send('<h1>Billing app (team C, deployed on its own)</h1>')); // another separate build

app.listen(3000, () => console.log('Host on 3000'));        // 3000 = the port
```

In production, a CDN or load balancer sends `/jobs/*` to team A's files and `/billing/*` to team C's files.

**Runtime loading with Module Federation** (webpack 5 and Rspack). The host's config says where to load a remote app from:

```js
// webpack.config.js in the HOST
const { ModuleFederationPlugin } = require('webpack').container;   // the federation plugin
module.exports = {                                                  // the webpack config object
  plugins: [                                                        // list of plugins
    new ModuleFederationPlugin({                                    // create the federation plugin
      name: 'host',                                                 // this app's name
      remotes: { jobs: 'jobs@https://jobs.example.com/remoteEntry.js' }, // where the Jobs app lives
      shared: { react: { singleton: true }, 'react-dom': { singleton: true } }, // load React only once
    }),                                                             // end of plugin
  ],                                                                // end of plugins
};                                                                  // end of config
```

Then in the host: `const JobsPage = React.lazy(() => import('jobs/JobsPage'));`.

## 🔍 Deeper version

**Ways to put micro-frontends together:**

| Way | How | Good for |
|---|---|---|
| Route / subdomain split | each app owns a path, like `/jobs` | simple, very independent apps |
| Runtime (Module Federation) | host loads remote JS bundles at runtime | one screen built from many teams' parts |
| Build time (npm packages) | each part is a library the host installs | shared components; but releases are coupled |
| iframes | each part in an iframe | strong isolation; but poor UX and styling |

**What to share on purpose:**
- **React** as a singleton. Two copies of React break hooks and waste bytes.
- **A design system** (like a shared Mantine theme). Without it, every part looks different.
- **Auth.** Usually an HttpOnly cookie on the parent domain, so all parts are logged in.

**Talking between parts.** Keep it small: URL params, browser custom events, or a tiny shared store. Don't share one big Redux store between teams.

**Backend side.** Each micro-frontend often pairs with its own backend service. See [microservices](topic:mern-architectures/microservices) and [BFF](topic:mern-architectures/bff-api-gateway).

## ⚖️ Pros and cons

| Pros | Cons |
|---|---|
| Teams deploy on their own | More build and deploy setup |
| Smaller codebases per team | Risk of duplicate libraries (bigger downloads) |
| A bug in one part is easier to isolate | UI can look inconsistent without a design system |
| Can upgrade parts one at a time | Harder end-to-end testing and debugging |

## 🎯 When to choose it

- **A big company with many frontend teams** on one product. For example, a bank portal where loans, cards and accounts are separate teams.
- **Slowly replacing an old frontend.** New sections are built as new apps beside the old one.
- **Not for:** a team of 2–10 developers. A single SPA, maybe split into [feature folders](topic:mern-architectures/feature-folders), is much simpler.

## ⚠️ Common mistakes

- **Using micro-frontends because it sounds modern.** For a small team it only adds cost.
- **Not sharing React as a singleton.** Two Reacts load, hooks break, and the bundle doubles.
- **Teams calling each other's internal code.** Then they can't deploy separately any more.
- **No shared design system.** Buttons and colours differ across the app.

## 🗣️ How to answer in an interview

> "Micro-frontends split a large frontend into smaller apps that separate teams own and deploy on their own. A host or shell app puts them together.
>
> You can split by route or subdomain, load parts at runtime with webpack Module Federation, or share them as npm packages. The things to share on purpose are React as a singleton, a design system and the auth session.
>
> It's worth it for big organisations where many teams block each other. For a small team, it adds build complexity and bigger bundles, so I'd keep one SPA with clear feature folders."

[FILL IN: if asked how the three SkillKeepr portals relate, they are three separate React SPAs; don't call them micro-frontends unless they share a host app at runtime.]

## 🔁 Follow-up questions

### Are three separate SPAs on three subdomains micro-frontends?

Loosely, yes: they're split by subdomain and deployed separately. But usually "micro-frontends" means parts that are combined into **one** user experience, often on one screen.

### How do micro-frontends share login?

Usually with an HttpOnly cookie set on the parent domain. Each part sends it with its API calls. The shell may also pass basic user info down.

### What is Module Federation?

A webpack 5 feature (also in Rspack) that lets one app load JavaScript modules from another app's build **at runtime**, and share libraries like React between them.

## ✅ Quick check

### 1. A team of 4 developers builds one admin dashboard. Should they use micro-frontends?

:::answer
**No.** The extra setup isn't worth it. One SPA with feature folders is simpler.
:::

### 2. Why mark React as `singleton: true` in Module Federation?

:::answer
So only **one copy** of React loads. Two copies break hooks and make the download bigger.
:::
