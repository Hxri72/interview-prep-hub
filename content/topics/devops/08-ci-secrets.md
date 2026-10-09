---
title: Secrets and environment variables in CI
stack: devops
order: 8
level: Intermediate
mustKnow: false
askedFrequency: common
summary:
  - "Never put passwords, API keys or tokens in code or in the workflow file. Store them as CI secrets."
  - "In GitHub Actions: secrets → ${{ secrets.NAME }} (hidden as *** in logs); plain settings → ${{ vars.NAME }}."
  - "Environments (like staging and production) can have their own secrets plus protection rules, such as a required approval."
  - "Best for cloud access: OIDC. The workflow gets short-lived AWS credentials by assuming an IAM role — no long-lived keys stored at all."
  - "Least privilege: give each workflow only the permissions and secrets it really needs."
cards:
  - q: Where should CI secrets live?
    a: In the CI tool's secret store (GitHub repo/org/environment secrets) or a cloud secret manager — never in the code or the YAML file.
  - q: How does a workflow read a secret?
    a: "As ${{ secrets.NAME }}, usually passed into a step's env. GitHub masks the value as *** in logs."
  - q: What is a GitHub environment used for?
    a: Grouping secrets and rules per target, like staging and production — for example, production secrets only, plus a required reviewer before the deploy job runs.
  - q: What is OIDC in CI/CD?
    a: The CI job proves its identity to the cloud with a short-lived signed token. The cloud gives back temporary credentials for one role. No long-lived access keys are stored.
  - q: Are secrets available to pull requests from forks?
    a: No. Workflows triggered by pull requests from forks don't get your repository secrets, so strangers can't steal them.
---

## 💡 What is it?

A **[secret](glossary:secret)** is a value that must stay private: a database password, an API key, a deploy token.

A CI pipeline often needs secrets, for example to deploy to AWS or call Stripe in tests. But they must **never be written in the code or the workflow file**, because everyone with repo access (and Git history forever) would see them.

So CI tools have a **secret store**. You save the secret there once. The pipeline reads it while it runs, and the logs hide it.

Plain settings that are **not** secret (like a region name) are just [environment variables](glossary:environment-variable).

## 🏠 Real-life example

Think of **a school's exam papers**.

- The **exam paper** = a secret (like an API key).
- **Leaving it on the notice board** = writing the key in the code. Everyone can see it.
- The **locked cupboard in the principal's office** = the CI secret store.
- The **invigilator gets the paper only on exam day**, for that one room = the job gets the secret only while it runs.
- **Covering the answers** if someone peeks = masking secrets as `***` in logs.
- Instead of giving the invigilator a master key to the whole school, the office gives a **one-day visitor pass for one room** = OIDC: short-lived credentials for one role.
- **Board exam papers need the principal's signature** before release = a protected "production" environment with a required approval.

## 🧑‍💻 Code example

A deploy workflow that uses a secret, a plain variable, an environment, and OIDC to AWS. Save as `.github/workflows/deploy.yml`.

```yaml
name: Deploy                                        # name shown in the Actions tab

on:                                                 # when to run
  push:                                             # on every push...
    branches: [main]                                # ...to main

permissions:                                        # what the job's GitHub token may do (least privilege)
  contents: read                                    # read the repo code
  id-token: write                                   # allow requesting an OIDC token (needed for AWS login without keys)

jobs:                                               # the work
  deploy:                                           # one job called "deploy"
    runs-on: ubuntu-latest                          # a fresh Linux machine
    environment: production                         # use the "production" environment's secrets and rules
    steps:                                          # steps, in order
      - uses: actions/checkout@v5                   # download the code
      - uses: aws-actions/configure-aws-credentials@v4          # official AWS login action
        with:                                       # its settings
          role-to-assume: ${{ vars.AWS_DEPLOY_ROLE_ARN }}       # which IAM role to become (not secret, so a variable)
          aws-region: ${{ vars.AWS_REGION }}        # e.g. ap-south-1, stored as a plain variable
      - run: npm ci                                 # install dependencies
      - run: npm run build                          # build the app
        env:                                        # environment variables for this step only
          VITE_API_URL: ${{ vars.API_URL }}         # public setting baked into the frontend build
      - run: aws s3 sync dist/ s3://${{ vars.BUCKET }} --delete # upload the build; uses the temporary OIDC credentials
      - run: node scripts/notify.js                 # run a script that needs a secret
        env:                                        # give the secret only to this step
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}   # read from the secret store; shown as *** in logs
```

**What you see when it runs** (described, not run here):

```text
✓ Configure AWS credentials   — "Assuming role with OIDC" → temporary credentials (about 1 hour)
✓ npm run build
✓ aws s3 sync …               — files uploaded
✓ node scripts/notify.js      — if the script logs the URL, the log shows: ***
```

There is **no `AWS_ACCESS_KEY_ID` secret anywhere**. AWS trusts GitHub's OIDC token instead.

## 🔍 Deeper version

**Secrets vs variables in GitHub Actions:**

| | `secrets.NAME` | `vars.NAME` |
|---|---|---|
| For | passwords, tokens, keys | region, bucket name, public URLs |
| Visible after saving? | no — write-only in the UI | yes |
| In logs | masked as `***` | shown |
| Levels | repository, organisation, environment | repository, organisation, environment |

**Environments.** Create `staging` and `production` under the repo's Settings → Environments. Each can have:
- its **own secrets** (production database password only in `production`)
- **required reviewers** — the job waits for approval before it starts
- **branch rules** — only `main` may deploy to production

**OIDC (OpenID Connect) — the modern way to reach the cloud.**
1. You create an **IAM role** in AWS that **trusts GitHub's OIDC provider**, limited to your repo (and even a branch or environment).
2. The workflow has `permissions: id-token: write`.
3. During the job, GitHub issues a short-lived signed token saying "I'm repo X, branch main".
4. AWS checks it and returns **temporary credentials** for that role.

Benefits: no long-lived keys to leak or rotate, and access is tied to one repo and branch. GCP (Workload Identity Federation) and Azure support the same idea.

**Masking has limits.** GitHub hides the exact secret text. But if a script prints it base64-encoded or split up, it can leak. Never `echo` secrets, and don't turn on debug output that dumps the environment.

**Forks.** Workflows from pull requests opened from **forks** don't receive your secrets. Be very careful with the `pull_request_target` trigger, which does run with secrets.

**Runtime secrets are different.** CI secrets are for the pipeline. The **running app** should read its secrets from the platform at runtime (AWS Secrets Manager or Parameter Store, Railway variables…). See [secrets management](topic:devops/secrets-management) and [environment variables in Node](topic:nodejs/environment-variables).

## 🎯 Why do we use it?

- **Keys stay out of Git.** Git history is forever; a key committed once is leaked forever.
- **Different values per environment** (test keys in staging, live keys in production) without changing code.
- **Less damage if something leaks**: masked logs, per-environment secrets, short-lived OIDC credentials, least-privilege roles.
- **Safe production releases**: a protected environment can require an approval first.

## ⚠️ Common mistakes

- **Committing `.env`** or pasting a key "just for testing" into the YAML.
- **One all-powerful AWS admin key** stored as a secret for years. Prefer OIDC with a narrow role.
- **Printing secrets** while debugging (`echo $API_KEY`, `env`, `printenv`).
- **Putting real secrets in frontend build variables** (`VITE_…`). Anything in the frontend bundle is public.

## 🗣️ How to answer in an interview

> "Secrets never go in the code or the workflow file. In GitHub Actions I store them as repository or environment secrets and read them with `secrets.NAME`, passing them only to the step that needs them. GitHub masks them as stars in the logs. Non-secret settings like the region go in `vars`.
>
> I use environments like staging and production, so each has its own secrets, and production can require an approval before the deploy job runs.
>
> For cloud access, I prefer OIDC over stored access keys. The job asks GitHub for a short-lived token, AWS checks it and lets the job assume one IAM role, scoped to that repo and branch. So there are no long-lived keys to leak or rotate. And I keep the job's permissions as small as possible."

[FILL IN: how secrets were handled in pipelines you worked with — e.g. at SkillKeepr or in your personal projects on Railway.]

## 🔁 Follow-up questions

### A secret was accidentally committed to Git. What do you do?

Rotate it immediately (create a new key, disable the old one) — assume it's already stolen. Then remove it from the code, move it to the secret store, and optionally clean the history. Deleting the commit alone is not enough.

### Why is OIDC safer than storing AWS access keys?

The credentials last about an hour, are created per job, and the role only trusts your repo (and branch or environment). There's nothing long-lived to leak, and nothing to rotate.

### Can frontend environment variables hold secrets?

No. Variables baked into a frontend build (`VITE_…`, `NEXT_PUBLIC_…`) end up in JavaScript that every user downloads. Secrets must stay on the server.

### How do you give production stricter rules than staging?

Use a `production` environment with its own secrets, required reviewers, and a rule that only `main` can deploy to it.

## ✅ Quick check

### 1. You run `echo ${{ secrets.DB_PASSWORD }}` in a step. What appears in the log?

:::answer
`***` — GitHub masks the exact secret value. But don't rely on it: encoded or split values can still leak. Never print secrets.
:::

### 2. Which permission does a workflow need to use OIDC with AWS?

- A) `contents: write`
- B) `id-token: write`
- C) `secrets: read`

:::answer
**B) `id-token: write`** — it lets the job request the OIDC token. (C isn't a real permission.)
:::

### 3. True or false: storing the S3 bucket name as a secret is required.

:::answer
**False.** A bucket name isn't secret. Store it as a variable (`vars.BUCKET`). Keep secrets for real secrets.
:::
