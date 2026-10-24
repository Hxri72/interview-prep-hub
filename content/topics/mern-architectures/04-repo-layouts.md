---
title: "Repo layouts: single repo, two repos, monorepo"
stack: mern-architectures
order: 4
level: Basic
mustKnow: false
askedFrequency: common
template: pattern
section: Foundations
summary:
  - "You can keep a MERN app's code in one folder, in two repos (frontend and backend), or in a monorepo with npm workspaces."
  - Two repos give clear ownership and separate pipelines, but sharing code and changing both sides together is harder.
  - "A monorepo keeps apps/web, apps/api and shared packages (types, validation) in one Git repo, so one pull request can change both."
  - Tools like npm/pnpm workspaces link local packages; Turborepo or Nx add fast, cached builds for bigger monorepos.
  - Repo layout is separate from deployment; a monorepo can still deploy the frontend and backend separately.
cards:
  - q: What is a monorepo?
    a: One Git repository that holds several projects, like the React app, the API and shared code, side by side.
  - q: What do npm workspaces do?
    a: They let one root package.json manage several packages in one repo, install everything with one command, and link local packages to each other.
  - q: Give one benefit of two separate repos.
    a: Clear ownership and simple, separate CI/CD pipelines and permissions for each team.
  - q: What can a shared package hold in a MERN monorepo?
    a: Shared TypeScript types, validation schemas, constants and small helpers used by both the frontend and the backend.
---

## 💡 What is it?

A **repo** (repository) is a project folder tracked by Git. A MERN app has frontend code and backend code. You can store them in different ways:

- **Single repo, simple folders:** `client/` and `server/` in one repo, each with its own `package.json`.
- **Two repos:** one repo for React, one for the API.
- **Monorepo with workspaces:** one repo, with a proper set-up for apps and shared packages.

This is about **where the code lives**, not where it runs.

## 🏠 Real-life example

Think of **how a family stores its documents**.

- **One drawer with two files inside** = single repo with `client/` and `server/`. Easy to find, but no real system.
- **Two separate cupboards in two rooms** = two repos. Each person controls their own cupboard. But if a document belongs to both, you keep two copies.
- **One big filing cabinet with labelled drawers and a shared drawer** = a [monorepo](glossary:monorepo). Everyone uses the same cabinet. Shared papers sit in one drawer that all can use.

## 🗺️ The diagram

```text
 A) SINGLE REPO, TWO FOLDERS        B) TWO REPOS                     C) MONOREPO WITH WORKSPACES
 my-app/                            my-app-web/   (repo 1)           my-app/
 ├── client/   (React)              └── src/ ...                     ├── package.json  (workspaces)
 │   └── package.json                                                ├── apps/
 └── server/   (Express)            my-app-api/   (repo 2)           │   ├── web/   (React + Vite)
     └── package.json               └── src/ ...                     │   └── api/   (Express)
                                                                     └── packages/
  install twice, no sharing          shared code = copy or           └── shared/ (types, schemas)
                                     publish an npm package               used by web AND api
```

## 🧑‍💻 Code example

This sets up a small monorepo with npm workspaces. Create the folders, then save this as `package.json` in the root.

```jsonc
{
  "name": "my-app",                                   // the root project name
  "private": true,                                    // true = never publish the root to npm
  "workspaces": ["apps/*", "packages/*"],             // every folder here is a package npm manages
  "scripts": {                                        // shortcuts for the whole repo
    "dev:web": "npm run dev -w apps/web",             // -w = run the script inside one workspace
    "dev:api": "npm run dev -w apps/api",             // start the API
    "build": "npm run build --workspaces --if-present" // build every package that has a build script
  }                                                   // end of scripts
}
```

Save this as `packages/shared/index.js`, with a `package.json` whose `"name"` is `"@my-app/shared"`.

```js
export const MAX_TITLE = 100;                                        // one rule, used by both sides
export function validateTask(task) {                                 // a shared check
  if (!task.title) return 'Title is required';                       // the message both UI and API show
  if (task.title.length > MAX_TITLE) return `Max ${MAX_TITLE} characters`; // same limit everywhere
  return null;                                                       // null = no error
}                                                                    // end of validateTask
```

Use it in the API (`apps/api/server.js`) and in React the same way:

```js
import { validateTask } from '@my-app/shared';                       // npm linked the local package for us
const error = validateTask({ title: '' });                           // run the shared rule
console.log(error);                                                  // prints: Title is required
```

Run `npm install` once in the root. npm installs packages for every workspace and links `@my-app/shared`.

## 🔍 Deeper version

**Comparing the three layouts:**

| | Single repo, two folders | Two repos | Monorepo (workspaces) |
|---|---|---|---|
| Install | Twice (`client`, `server`) | Per repo | Once, from the root |
| Sharing code | Copy or relative imports | Publish a private npm package | Local package, linked |
| One change across UI + API | One PR | Two PRs, must be merged in order | One PR |
| CI/CD | Can be messy | Simple, one pipeline per repo | Needs path filters or a build tool |
| Permissions | Everyone sees everything | Per-repo access | Everyone sees everything |

**Workspace tools.**
- **npm, pnpm and Yarn workspaces** link packages and share one lockfile.
- **pnpm** saves disk space and is strict about which packages you can import.
- **Turborepo** and **Nx** sit on top. They know which package depends on which, run tasks in the right order, and cache results, so unchanged packages don't rebuild.

**What goes in a shared package:**
- TypeScript types for API requests and responses, so the UI and API agree.
- Validation schemas (for example, Zod or Joi rules).
- Constants like roles, status names and limits.

Don't put server-only code (database models, secrets) in a package the browser imports. It would be bundled into the frontend.

**Deploying from a monorepo.** CI checks which folders changed. A change only in `apps/web` deploys only the frontend. GitHub Actions supports `paths:` filters for this. See [GitHub Actions](topic:devops/github-actions).

**Layout ≠ architecture.** A monorepo can hold [microservices](topic:mern-architectures/microservices), and two repos can hold a simple 3-tier app. The repo shape is about how people work, not how the app runs.

## ⚖️ Pros and cons

| Layout | Pros | Cons |
|---|---|---|
| Single repo, two folders | Easiest start, one clone | No proper sharing, two installs, scripts get messy |
| Two repos | Clear ownership, simple pipelines, separate access | Cross-cutting changes need two PRs; shared code must be published |
| Monorepo | One PR for full features, shared types and rules, one install | Set-up effort; CI needs filters; big repos need Turborepo/Nx |

## 🎯 When to choose it

- **Single repo, two folders:** a learning project, a hackathon, or a portfolio app.
- **Two repos:** separate frontend and backend teams, different release cycles, or strict access rules.
- **Monorepo:** a small or medium full-stack team that often changes the UI and API together, or several apps sharing UI components and types. SkillKeepr shares backend and UI libraries across services, which is the same goal of not repeating code. [FILL IN: how SkillKeepr's repos are actually organised, if you want to mention it — keep it public-safe.]

## ⚠️ Common mistakes

- **Copy-pasting types and rules into both apps.** They drift apart, and bugs appear when one side changes.
- **Importing server code into React through a shared package.** Secrets or heavy libraries end up in the browser bundle.
- **Running every pipeline on every change in a monorepo.** Builds get slow. Use path filters or Turborepo/Nx.
- **Having two lockfiles in a workspace monorepo.** Keep one lockfile in the root.

## 🗣️ How to answer in an interview

> "There are three common layouts. The simplest is one repo with `client` and `server` folders. Then there's two separate repos, which gives clear ownership and simple pipelines, but cross-cutting changes need two PRs and shared code must be published as a package.
>
> The third is a monorepo with npm or pnpm workspaces, with `apps/web`, `apps/api` and `packages/shared`. The shared package holds types, validation schemas and constants, so the frontend and backend never drift. One PR can change both sides. For bigger monorepos, Turborepo or Nx add caching and run only what changed.
>
> The repo layout doesn't decide deployment. A monorepo can still deploy the frontend to a CDN and the backend separately, with CI path filters."

## 🔁 Follow-up questions

### Do big companies use monorepos?

Yes, many do, often with special tooling. But many also use many repos. Both work; the choice depends on team structure and tooling.

### How do you share code between two separate repos?

Publish it as a private npm package (for example on GitHub Packages or a private registry) and install it in both. You then version it with semver and update both apps.

### What's the difference between npm workspaces and Turborepo?

Workspaces handle installing and linking packages. Turborepo is a task runner on top: it runs builds and tests in dependency order and caches the results.

### Can a monorepo make the frontend bundle bigger?

Only if the frontend imports server-side code or big shared files. Keep shared packages small and browser-safe.

## ✅ Quick check

### 1. Your UI and API both need the same list of user roles. Which layout makes sharing easiest?

:::answer
A **monorepo with workspaces**. Put the roles in `packages/shared` and import them in both apps.
:::

### 2. True or false: using a monorepo means the frontend and backend must be deployed together.

:::answer
**False.** CI can deploy each app on its own, based on which folders changed.
:::

### 3. What does `npm run dev -w apps/api` do?

:::answer
It runs the `dev` script inside the `apps/api` workspace only.
:::
