---
title: "GitHub Actions: workflows, jobs and steps"
stack: devops
order: 7
level: Intermediate
mustKnow: true
askedFrequency: very common
summary:
  - GitHub Actions runs automatic jobs (test, build, deploy) when something happens in your repo, like a push or a pull request.
  - "A workflow is a YAML file in .github/workflows/. It has triggers (on), jobs, and steps inside each job."
  - Each job runs on a fresh virtual machine (a runner). Jobs run in parallel unless you link them with needs.
  - "A step either runs a command (run: npm test) or uses a ready-made action (uses: actions/checkout@v5)."
  - Use secrets for passwords and keys, cache dependencies for speed, and make CI a required check on main.
cards:
  - q: What is a GitHub Actions workflow?
    a: A YAML file in .github/workflows/ that says when to run (triggers) and what to run (jobs and steps), for example tests on every pull request.
  - q: What is the difference between a job and a step?
    a: A job is a group of steps that runs on one runner (a fresh machine). Steps run in order inside the job. Different jobs can run in parallel.
  - q: What does "needs" do?
    a: It makes one job wait for another to succeed. For example, deploy needs build, so deploy runs only if build passed.
  - q: What is the difference between run and uses?
    a: "run: executes a shell command. uses: runs a reusable action, like actions/checkout to get the code or actions/setup-node to install Node."
  - q: What is a matrix?
    a: A way to run the same job several times with different values, for example on Node 22 and Node 24, in parallel.
---

## 💡 What is it?

**GitHub Actions** is GitHub's built-in [CI/CD](glossary:ci-cd) tool. It runs automatic tasks when something happens in your [repository](glossary:repository), like a push or a pull request.

You describe the tasks in a **workflow file**, written in [YAML](glossary:yaml) and saved in `.github/workflows/`. A workflow has:
- **triggers** (`on:`) — when to run
- **jobs** — groups of work, each on its own fresh machine
- **steps** — the commands inside each job, run in order

## 🏠 Real-life example

Think of **the school's daily routine, written on the notice board**.

- The **notice board sheet** = the workflow file.
- "**When the morning bell rings**, do this" = the trigger (`on: push`).
- **Different classrooms** working at the same time = jobs running in parallel.
- Each classroom gets a **clean room** every morning = each job gets a fresh runner (machine).
- The **list of periods** in one classroom, in order = the steps.
- "**Sports day can start only after the assembly ends**" = `needs: build`.
- A **ready-made lesson plan** from the education board = a reusable action (`uses:`).
- The **locked staff cupboard** with keys = secrets.

## 🧑‍💻 Code example

Save this as `.github/workflows/ci.yml` in a Node project and push it to GitHub. Open the **Actions** tab to watch it run.

```yaml
name: CI                                   # the name shown in the Actions tab

on:                                        # TRIGGERS: when should this workflow run?
  push:                                    # on every push...
    branches: [main]                       # ...to the main branch
  pull_request:                            # and on every pull request (into any branch)

jobs:                                      # the work to do
  test:                                    # job 1, named "test"
    runs-on: ubuntu-latest                 # run it on a fresh Linux machine from GitHub
    strategy:                              # run this job more than once...
      matrix:                              # ...once for each value below
        node: [22, 24]                     # Node.js 22 and Node.js 24, in parallel
    steps:                                 # the steps, run in order
      - uses: actions/checkout@v5          # step 1: download the repo's code onto the machine
      - uses: actions/setup-node@v5        # step 2: install Node.js
        with:                              # settings for this action
          node-version: ${{ matrix.node }} # use the Node version from the matrix (22 or 24)
          cache: npm                       # cache npm downloads, so later runs are faster
      - run: npm ci                        # step 3: install exact versions from package-lock.json
      - run: npm run lint                  # step 4: check code style and simple mistakes
      - run: npm test                      # step 5: run the tests; a failure stops the job here

  build:                                   # job 2, named "build"
    needs: test                            # wait until ALL "test" jobs pass; skip if any failed
    runs-on: ubuntu-latest                 # another fresh Linux machine
    steps:                                 # its steps
      - uses: actions/checkout@v5          # get the code again (each job starts empty)
      - uses: actions/setup-node@v5        # install Node.js
        with:                              # settings for this action
          node-version: 24                 # one version is enough for the build
          cache: npm                       # reuse the npm cache
      - run: npm ci                        # install dependencies
      - run: npm run build                 # create the production build (e.g. dist/)
```

**What you see in the Actions tab** (described, not run here):

```text
CI  ·  push to main
  ✓ test (22)     — checkout, setup-node, npm ci, lint, test
  ✓ test (24)     — the same steps on Node 24, at the same time
  ✓ build         — starts only after both test jobs are green

If one test fails:
  ✗ test (24)
  ⊘ build         — skipped, because it needs test
  The pull request shows a red ✗ next to the "test (24)" check.
```

## 🔍 Deeper version

**The building blocks:**

| Word | Meaning |
|---|---|
| **Workflow** | one YAML file in `.github/workflows/` |
| **Event / trigger** | what starts it: `push`, `pull_request`, `schedule` (cron), `workflow_dispatch` (manual button), `release`… |
| **Job** | a group of steps on one **runner**; jobs run in parallel by default |
| **Step** | one `run:` command or one `uses:` action |
| **Runner** | the machine: GitHub-hosted (`ubuntu-latest`, `windows-latest`, `macos-latest`) or self-hosted |
| **Action** | reusable code from the Marketplace, pinned to a version (`@v5`) |
| **Artifact** | files saved from a job, for example a build folder, to pass to another job or download |

**Expressions and contexts.** `${{ … }}` reads values: `${{ matrix.node }}`, `${{ secrets.API_KEY }}`, `${{ vars.REGION }}`, `${{ github.ref_name }}`. `if:` conditions skip steps or jobs, for example `if: github.ref == 'refs/heads/main'`.

**A real example — this website's own deploy workflow.** This study site deploys to GitHub Pages with `.github/workflows/deploy.yml`. In short:

```yaml
on:
  push:
    branches: [main]                 # deploy whenever main changes
  workflow_dispatch:                 # plus a manual "Run workflow" button
permissions:
  contents: read                     # the job can read the repo
  pages: write                       # and publish to GitHub Pages
  id-token: write                    # needed for the Pages deploy (OIDC)
concurrency:
  group: pages
  cancel-in-progress: true           # a newer push cancels an older running deploy
jobs:
  build:                             # checkout → setup-node 24 (with cache) → npm ci → npm run build → upload dist/
  deploy:
    needs: build                     # deploy only if build passed
    environment: github-pages        # shows up as a "deployment" in the repo
```

It shows four useful ideas: **least-privilege `permissions`**, **`concurrency`** to avoid two deploys at once, **`needs`** to chain jobs, and an **environment** for the deploy.

**Speed and safety tips:**
- `cache: npm` in `setup-node`, or `actions/cache`.
- Pin third-party actions to a version (or a commit SHA for extra safety).
- Keep `permissions` minimal (the default token can do more than you need).
- Make the CI job a **required status check** on main. See [pull requests](topic:devops/branching-prs).
- Secrets go in repo/environment secrets, never in the YAML. See [secrets in CI](topic:devops/ci-secrets).
- **Reusable workflows** (`workflow_call`) and **composite actions** remove copy-paste between repos.

At SkillKeepr, GitHub Actions runs code-quality scans on pushes and pull requests, while deployments run through AWS CodeBuild. [FILL IN: which workflows you wrote or changed, if any.]

## 🎯 Why do we use it?

- It lives **inside GitHub**, next to the code and pull requests. No separate CI server to manage.
- Every PR gets **automatic checks**, so reviewers see a green tick before reading the code.
- It can **deploy** too: to AWS, GitHub Pages, Vercel, Railway, a Docker registry…
- Thousands of **ready-made actions** save time.

## ⚠️ Common mistakes

- **Wrong indentation in YAML.** YAML uses spaces, and one wrong space breaks the file.
- **Forgetting `actions/checkout`.** Each job starts on an empty machine, so there's no code until you check it out.
- **Putting secrets in the YAML** or `echo`-ing them in logs.
- **Expecting files to pass between jobs automatically.** Each job is a new machine; use artifacts or rebuild.

## 🗣️ How to answer in an interview

> "GitHub Actions is GitHub's built-in CI/CD. A workflow is a YAML file in `.github/workflows`. It has triggers, like push to main or pull_request, and jobs. Each job runs on a fresh runner, and inside it the steps run in order — either a shell command with `run`, or a reusable action with `uses`, like `actions/checkout` and `actions/setup-node`.
>
> A typical Node workflow I'd write: checkout, setup Node with npm caching, `npm ci`, lint, test, and build. I can use a matrix to test on more than one Node version, and `needs` so the deploy job only runs after the build passes. Secrets come from GitHub secrets, never from the file, and I keep the token's permissions minimal.
>
> Then I make the CI job a required check on main, so nothing broken gets merged."

[FILL IN: a workflow you wrote or maintained — e.g. for a personal project deployed to Railway or GitHub Pages.]

## 🔁 Follow-up questions

### How do you pass the build output from one job to another?

Each job runs on a separate machine. Use `actions/upload-artifact` in the first job and `actions/download-artifact` in the next (GitHub Pages has its own `upload-pages-artifact`). Or do build and deploy in one job.

### How do you run a workflow only on main, or only for some files?

Use `on.push.branches: [main]`, and `paths:` (for example `paths: ['src/**']`) to trigger only when those files change. For single steps or jobs, use `if:` conditions.

### How do you avoid two deployments running at the same time?

Use `concurrency` with a group name. `cancel-in-progress: true` cancels the older run when a newer one starts.

### Where do secrets come from in GitHub Actions?

From repository, organisation or environment secrets, read as `${{ secrets.NAME }}`. They're masked as `***` in logs. Better still, use OIDC to get short-lived cloud credentials. See [secrets in CI](topic:devops/ci-secrets).

## ✅ Quick check

### 1. Job `deploy` has `needs: build`. The build job fails. What happens to deploy?

:::answer
**It is skipped.** `needs` means "run only if that job succeeded".
:::

### 2. Your second job runs `npm test` but fails with "package.json not found". Why?

:::answer
The job didn't run `actions/checkout`. Each job starts on a fresh, empty machine, so it needs its own checkout step.
:::

### 3. What does this run? `matrix: node: [22, 24]`

- A) One job on Node 22, then a second job on Node 24, one after another
- B) Two copies of the job, one per Node version, in parallel
- C) One job that installs both versions

:::answer
**B) Two copies of the job in parallel**, one on Node 22 and one on Node 24.
:::
