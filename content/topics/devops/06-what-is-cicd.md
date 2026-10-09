---
title: What CI/CD means
stack: devops
order: 6
level: Basic
mustKnow: true
askedFrequency: very common
summary:
  - CI (Continuous Integration) = every push or pull request is automatically checked — install, lint, test, build.
  - CD (Continuous Delivery / Deployment) = code that passes the checks is automatically made ready to release (Delivery) or released (Deployment).
  - A pipeline is the list of steps. If any step fails, the pipeline stops and nothing is deployed.
  - It catches bugs early, keeps main always working, and makes releases small, frequent and boring.
  - Tools include GitHub Actions, GitLab CI, Jenkins, CircleCI and AWS CodeBuild/CodePipeline.
cards:
  - q: What is CI?
    a: Continuous Integration. Every push or PR automatically runs checks like lint, tests and build, so problems are found early.
  - q: Continuous Delivery vs Continuous Deployment?
    a: Delivery = every passing change is ready to deploy, but a human presses the button. Deployment = every passing change goes to production automatically.
  - q: What is a pipeline?
    a: An ordered list of automatic steps (install → lint → test → build → deploy). If a step fails, the pipeline stops.
  - q: What happens when a test fails in CI?
    a: The pipeline stops and is marked red. The PR can't be merged (if checks are required), and the developer fixes and pushes again.
  - q: Why is CI/CD useful?
    a: It catches bugs early, keeps main deployable, removes manual deploy mistakes, and makes releases small and frequent.
---

## 💡 What is it?

**[CI/CD](glossary:ci-cd)** is about **automatic checks and automatic releases**.

- **CI — Continuous Integration.** Every time someone pushes code or opens a pull request, a robot **installs, lints, tests and builds** it. Problems show up within minutes.
- **CD — Continuous Delivery or Deployment.** Code that passes all checks is **made ready to release** (Delivery) or **released automatically** (Deployment).

The list of automatic steps is called a **[pipeline](glossary:pipeline)**. If any step fails, the pipeline **stops**, and nothing broken reaches users.

## 🏠 Real-life example

Think of **a school canteen kitchen**.

- Every new dish a cook makes = a code change.
- Before serving, every dish goes through the **same checks**: taste test, temperature check, plating = the **CI pipeline** (lint, test, build).
- If the taste test fails, the dish **doesn't go out** = a failed step stops the pipeline.
- Dishes that pass go to the **serving counter, ready** = Continuous **Delivery** (ready, a person decides when).
- Or they go **straight to the students' plates** = Continuous **Deployment** (automatic).
- Checking every dish **right away** is easier than finding out at lunch that 200 plates are bad = catching bugs early.

## 🧑‍💻 Code example

A pipeline is just "run these steps in order, stop on failure". This tiny script does the same thing on your laptop. In a real project, a tool like [GitHub Actions](topic:devops/github-actions) runs these steps for you on every push.

`package.json` (the scripts the pipeline calls):

```json
{
  "name": "ci-demo",
  "version": "1.0.0",
  "type": "commonjs",
  "scripts": {
    "lint": "node --check sum.js",
    "test": "node --test",
    "build": "mkdir -p dist && cp sum.js dist/"
  }
}
```

`sum.js` and `sum.test.js`:

```js
module.exports = (a, b) => a + b;                              // sum.js: the code we ship — adds two numbers
```

```js
const test = require('node:test');                             // Node's built-in test runner
const assert = require('node:assert');                         // Node's built-in checks
const sum = require('./sum');                                  // load the code to test
test('adds two numbers', () => assert.strictEqual(sum(2, 3), 5));   // 2 + 3 must equal 5
```

`pipeline.sh` (the pipeline itself). Run it with `bash pipeline.sh`:

```bash
#!/usr/bin/env bash
set -e                      # stop at the first step that fails
echo "Step 1: lint"         # check the code for syntax errors
npm run lint --silent       # runs: node --check sum.js
echo "Step 2: test"         # run the automatic tests
npm test --silent           # runs: node --test
echo "Step 3: build"        # make the files we would deploy
npm run build --silent      # copies sum.js into dist/
echo "✅ Pipeline passed — safe to deploy"   # only reached if every step passed
```

**Real output — all steps pass:**

```text
Step 1: lint
Step 2: test
✔ adds two numbers (0.5895ms)
ℹ tests 1
ℹ pass 1
ℹ fail 0
Step 3: build
✅ Pipeline passed — safe to deploy
```

**Now break the code** (change `a + b` to `a - b`) and run it again:

```text
Step 1: lint
Step 2: test
✖ adds two numbers (0.657708ms)
ℹ pass 0
ℹ fail 1
✖ failing tests:
✖ adds two numbers (0.657708ms)
```

The script exits with code `1`. **Step 3 never runs**, and no `dist/` folder is made. That is exactly what a CI pipeline does with broken code.

## 🔍 Deeper version

**A typical pipeline for a Node/React project:**

```text
push / pull request
   │
   ▼
CI:  checkout → install (npm ci) → lint → type-check → unit tests → build → (security / quality scan)
   │  any step fails → stop, mark red, block the merge
   ▼
CD:  deploy to staging → smoke tests → (approval) → deploy to production → health check
```

**Delivery vs Deployment:**

| | Continuous Delivery | Continuous Deployment |
|---|---|---|
| After checks pass | build is ready; a human clicks "deploy" | goes to production automatically |
| Needs | good tests | very good tests, monitoring, easy [rollback](topic:devops/rollback) |

**Good CI habits:**
- Use `npm ci`, not `npm install`. It installs exactly what `package-lock.json` says, and fails if the lock file is out of date.
- Make CI **fast** (cache dependencies, run jobs in parallel). Slow CI gets ignored.
- **Required checks** on main, so red code can't be merged. See [pull requests](topic:devops/branching-prs).
- **Build once, deploy the same artifact** to staging and production.
- Keep secrets out of the code and logs. See [secrets in CI](topic:devops/ci-secrets).

**Where checks can run:**
- **Before commit:** git hooks (for example husky) run lint or type-check on your laptop.
- **On push/PR:** the CI server runs the full pipeline.
- **After deploy:** health checks and monitoring.

**Common tools:** GitHub Actions, GitLab CI, Jenkins, CircleCI, AWS CodeBuild + CodePipeline, Vercel/Netlify (for frontends).

At SkillKeepr, the main platform deploys to AWS through AWS CodeBuild, GitHub Actions runs code-quality scans, and a pre-commit hook runs type-checks and lint. [FILL IN: your own part in the pipelines, if any.]

## 🎯 Why do we use it?

- **Bugs are found early**, minutes after the push, while the change is fresh in your mind.
- **Main stays working**, because broken code can't be merged.
- **No manual deploy mistakes** like "forgot to run the build" or "deployed the wrong folder".
- **Small, frequent releases** are less risky than big, rare ones. If something breaks, the cause is easy to find.

## ⚠️ Common mistakes

- **Ignoring a red pipeline** or re-running it until it turns green ("flaky tests"). Fix flaky tests instead.
- **No tests in the pipeline.** Then CI only checks that the code builds.
- **Using `npm install` in CI.** It can change the lock file and install different versions than your laptop.
- **Printing secrets in logs** while debugging a pipeline.

## 🗣️ How to answer in an interview

> "CI means every push or pull request is automatically checked: install with `npm ci`, lint, type-check, run the tests, and build. If any step fails, the pipeline stops, the PR shows red, and it can't be merged. That finds problems within minutes and keeps main always working.
>
> CD is what happens after the checks pass. With Continuous Delivery, the build is ready and a person decides when to release. With Continuous Deployment, it goes to production automatically, which needs good tests, monitoring and an easy rollback.
>
> The benefit is small, frequent, low-risk releases instead of big stressful ones."

[FILL IN: what the pipeline you used at SkillKeepr runs — e.g. type-check and lint before commit, scans in GitHub Actions, deploys through AWS CodeBuild — and what part you set up or changed.]

## 🔁 Follow-up questions

### What happens when a test fails in CI?

The pipeline stops and turns red. If the check is required, the PR can't be merged. The developer reads the logs, fixes the issue, and pushes again; the pipeline re-runs automatically.

### Why `npm ci` instead of `npm install`?

`npm ci` installs the exact versions from `package-lock.json`, starts from a clean `node_modules`, and fails if the lock file doesn't match `package.json`. That makes CI repeatable.

### How do you make a slow pipeline faster?

Cache `node_modules` (or the npm cache), run independent jobs in parallel (lint and tests at the same time), run only affected tests in big repos, and avoid rebuilding the same thing twice.

### What is a flaky test and why is it dangerous?

A test that sometimes passes and sometimes fails with no code change. People stop trusting CI and start ignoring red builds. Fix or quarantine flaky tests quickly.

## ✅ Quick check

### 1. In the pipeline script above, the test step fails. Does the build step run?

:::answer
**No.** `set -e` stops the script at the first failing command, so step 3 never runs and no `dist/` folder is made.
:::

### 2. Every passing change goes to production automatically, with no human click. Is that Continuous Delivery or Continuous Deployment?

:::answer
**Continuous Deployment.** In Continuous Delivery, a person still decides when to release.
:::

### 3. Which install command should CI use for a Node project with a lock file?

- A) `npm install`
- B) `npm ci`
- C) `npm update`

:::answer
**B) `npm ci`** — exact, repeatable installs from `package-lock.json`.
:::
