---
title: "Environments: dev, staging, production"
stack: devops
order: 9
level: Basic
mustKnow: false
askedFrequency: common
summary:
  - An environment is one full copy of your app that runs for a purpose — dev for building, staging for testing, production for real users.
  - The code is the same in every environment. Only the settings (environment variables) and the data change.
  - Staging should look like production as much as possible, so bugs show up there first.
  - Never use real customer data or real payment keys in dev or staging.
  - Code moves one way — dev → staging → production — usually through a CI/CD pipeline.
cards:
  - q: What is an environment in software?
    a: One running copy of the app for a purpose — dev (developers), staging (final testing), production (real users). Same code, different settings and data.
  - q: Why do we need a staging environment?
    a: To test the real build with production-like settings before real users see it. Many bugs only appear there, not on a laptop.
  - q: What changes between environments?
    a: Settings like the database URL, API keys, log level and domain. The code stays the same.
  - q: Should dev use the production database?
    a: No. Dev and staging get their own databases with fake or masked data. Production data stays in production.
  - q: How does code move between environments?
    a: Through a pipeline — merge to a branch, CI builds and tests it, it deploys to staging, then after checks it is promoted to production.
---

## 💡 What is it?

An **environment** is one full, running copy of your app, made for one purpose.

Most teams have at least three:
- **Development (dev)** — where developers build and try new code.
- **Staging** — a "dress rehearsal" copy for final testing.
- **Production (prod)** — the real app that real users use.

The **code is the same** everywhere. Only the **settings** ([environment variables](glossary:environment-variable)) and the **data** change.

## 🏠 Real-life example

Think of a **school drama**.

- **Practice at home** = dev. You try lines, make mistakes, nobody watches.
- **Dress rehearsal on the real stage** = staging. Same stage, costumes and lights — but no audience yet.
- **The real show** = production. Parents are watching. Mistakes now are public.

The **script** (the code) is the same in all three. What changes is the **place, the audience and the props** (settings and data).

You would never try a brand-new scene for the first time during the real show. In the same way, you never send untested code straight to production.

## 🧑‍💻 Code example

One app reads different settings for each environment. Save as `config.js` and run it three times with different `NODE_ENV` values.

```js
const settings = {                                        // one settings object per environment
  development: { db: 'mongodb://localhost/app_dev', logLevel: 'debug', payments: 'stripe-test' }, // local DB, chatty logs, test payments
  staging:     { db: 'mongodb://staging-db/app',     logLevel: 'info',  payments: 'stripe-test' }, // its own DB, still test payments
  production:  { db: 'mongodb://prod-db/app',        logLevel: 'warn',  payments: 'stripe-live' }, // real DB, quiet logs, real money
};                                                        // end of the settings object

const env = process.env.NODE_ENV || 'development';        // read the environment name; default is development
const config = settings[env];                             // pick the matching settings

if (!config) {                                            // a typo like NODE_ENV=prodution gives undefined
  throw new Error(`Unknown NODE_ENV: ${env}`);            // fail fast instead of running with no settings
}                                                         // end of the check

console.log(`env=${env} db=${config.db} log=${config.logLevel} payments=${config.payments}`); // show what this copy will use
```

Run it:

```bash
node config.js                         # no NODE_ENV set, so development is used
NODE_ENV=staging node config.js        # pretend we are on the staging server
NODE_ENV=production node config.js     # pretend we are on the production server
```

**Output:**

```text
env=development db=mongodb://localhost/app_dev log=debug payments=stripe-test
env=staging db=mongodb://staging-db/app log=info payments=stripe-test
env=production db=mongodb://prod-db/app log=warn payments=stripe-live
```

In a real app, the URLs and keys come from secret environment variables, not from the code. See [environment variables](topic:nodejs/environment-variables).

## 🔍 Deeper version

**What usually differs between environments:**

| Setting | Dev | Staging | Production |
|---|---|---|---|
| Database | local or shared dev DB | its own DB, fake/masked data | real DB, real data |
| Payment keys | Stripe **test** keys | Stripe **test** keys | Stripe **live** keys |
| Log level | debug (very chatty) | info | warn / error |
| Domain | `localhost` | `staging.example.com` | `example.com` |
| Who uses it | developers | developers, QA, product | real customers |

**Promotion, not rebuilding.** A good pipeline builds the code **once**. The same build (the same Docker image or bundle) is deployed to staging, then promoted to production. If you rebuild for production, you are shipping something you never tested.

**Parity.** "Environment parity" means staging is as close to production as you can afford: same runtime version, same services, similar data size. Big gaps cause "works in staging, breaks in production". A query that is fast on 100 test rows can be slow on 1 million real rows.

**Config, not code.** The [twelve-factor app](https://12factor.net/config) idea: anything that changes between environments goes in environment variables, never in `if (env === 'production')` branches spread across the code.

**More environments.** Some teams add:
- **Preview environments** — a short-lived copy for every pull request.
- **QA / test** — for a test team.
- **Demo** — for sales, with nice fake data.

**At SkillKeepr**, the platform has several deployment stages, each with its own settings. [FILL IN: which stages you deploy to and how a change gets to production.]

## 🎯 Why do we use it?

- **Safety.** Mistakes happen in dev and staging, not in front of customers.
- **Real testing.** Staging catches problems that a laptop can't show — real network, real build, real settings.
- **Protecting data and money.** Test payment keys and fake data mean testing can't charge a real card or leak a real candidate's details.
- **Calm releases.** When staging passes, production deploys are routine, not scary.

## ⚠️ Common mistakes

- **Using production data in dev.** It leaks private data to laptops and test tools.
- **Hard-coding settings** like `if (process.env.NODE_ENV === 'production')` all over the code. Put the values in environment variables instead.
- **Staging that doesn't match production** — different Node version, missing services, tiny data.
- **Rebuilding for production** instead of promoting the tested build.

## 🗣️ How to answer in an interview

> "An environment is one running copy of the app for a purpose. We usually have dev for building, staging for final testing, and production for real users. The code is the same in all of them — only configuration and data change, and that configuration lives in environment variables, not in the code.
>
> Staging should be as close to production as possible: same runtime, same services, similar data. That's where we catch build and config problems before users do. Dev and staging use test payment keys and fake data, so testing can never charge a real card or expose real customer data.
>
> Code moves one way through a CI/CD pipeline: build once, test, deploy to staging, then promote the same build to production."

[FILL IN: one sentence about the environments you deploy to at SkillKeepr.]

## 🔁 Follow-up questions

### What is NODE_ENV used for?

It tells libraries and your app which mode they run in. Express and React, for example, turn off slow debug checks when it is `production`. Keep it to a few values (`development`, `test`, `production`) and put other settings in their own variables.

### How do you test with realistic data without using real customer data?

Use seed scripts with fake data, or a copy of production where personal fields are masked (names, emails and phone numbers replaced). Keep the data *size* realistic so slow queries show up.

### What is a preview environment?

A short-lived copy of the app created for one pull request. Reviewers can click a link and try the change. It is deleted when the PR is merged or closed.

### Why build once and promote, instead of building for each environment?

Because then production runs exactly what you tested. A fresh build could pull a newer package version or pick up a different setting.

## ✅ Quick check

### 1. What should change between staging and production?

- A) The source code
- B) Settings like the database URL and API keys
- C) Nothing at all

:::answer
**B.** The code stays the same. Only configuration and data change.
:::

### 2. With the code example above, what prints for `NODE_ENV=prodution node config.js` (note the typo)?

:::answer
It throws **`Error: Unknown NODE_ENV: prodution`**. The check catches the typo instead of silently running with no settings.
:::

### 3. True or false: it's fine to use live Stripe keys in staging if you are careful.

:::answer
**False.** Staging uses test keys. Live keys there can create real charges by mistake.
:::
