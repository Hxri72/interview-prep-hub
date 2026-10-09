---
title: Managing secrets across environments
stack: devops
order: 18
level: Intermediate
mustKnow: true
askedFrequency: very common
summary:
  - Secrets are passwords, API keys and tokens. They must never be in Git, in the frontend bundle or in logs.
  - Locally, keep them in a .env file that is listed in .gitignore.
  - In production, keep them in a secret manager like AWS Secrets Manager or SSM Parameter Store, and load them at start time.
  - Check that every required secret exists when the app starts (fail fast).
  - If a secret leaks, rotate it (make a new one, disable the old one) — deleting the Git commit is not enough.
cards:
  - q: Where should secrets live locally and in production?
    a: Locally in a .env file that is git-ignored. In production in a secret manager (AWS Secrets Manager, SSM Parameter Store, or the platform's secret settings), loaded at runtime.
  - q: A key was pushed to GitHub. What do you do?
    a: Rotate it at once — create a new key and disable the old one. Then remove it from the code and history. Assume the old key is already stolen.
  - q: Why is .env not enough for production?
    a: Files on servers get copied, backed up and read by many people. A secret manager gives access control, audit logs, encryption and easy rotation.
  - q: What does "fail fast" mean for secrets?
    a: Check all required secrets when the app starts. If one is missing, stop with a clear error instead of failing later on a real user request.
  - q: Can a React app keep an API secret safe?
    a: No. Everything in the frontend bundle can be read by anyone. Secrets must stay on the server.
---

## 💡 What is it?

A **secret** is any value that gives access to something. Examples: a database password, a Stripe secret key, a JWT signing secret.

**Secrets management** means keeping these values safe. They live outside the code, each environment (development, test, production) has its own values, and only the right people and programs can read them.

## 🏠 Real-life example

Think of the **keys to a school building**.

- The **keys** = secrets.
- **Writing the key code on the notice board** = putting a secret in Git. Everyone can see it forever.
- Your **own house key in your pocket** = a `.env` file on your laptop. Fine for you, and nobody else gets it.
- The **key cabinet in the principal's office**, locked, with a register of who took which key = a secret manager. It has access control and an audit log.
- **Changing the locks after a key is lost** = rotating a secret.

## 🧑‍💻 Code example

Make a folder with these two files. Run with Node 24, which can read `.env` files by itself.

**`.env`** (add `.env` to `.gitignore` so it is never committed)

```text
# local-only secrets — never commit this file
# DATABASE_URL = where the local database is
DATABASE_URL=mongodb://localhost:27017/hiring
# STRIPE_SECRET_KEY = a Stripe TEST key (sk_test_…), never a live key on a laptop
STRIPE_SECRET_KEY=sk_test_local_example
```

(Comments sit on their own lines, because some `.env` loaders keep text after a value as part of the value.)

**`secrets.js`**

```js
const required = ['DATABASE_URL', 'STRIPE_SECRET_KEY', 'JWT_SECRET'];   // every secret the app needs to work
const missing = required.filter((name) => !process.env[name]);         // keep the names that have no value
if (missing.length) {                                                   // at least one secret is missing
  console.error(`Missing secrets: ${missing.join(', ')}`);              // say exactly which ones (names only, never values)
  process.exit(1);                                                      // stop now — "fail fast" — exit code 1 = error
}                                                                       // end of the check
console.log('All secrets loaded. Stripe key starts with:', process.env.STRIPE_SECRET_KEY.slice(0, 7)); // show only a safe prefix
```

Run it twice:

```bash
node --env-file=.env secrets.js                          # load .env, then run the check
JWT_SECRET=dev-only-secret node --env-file=.env secrets.js   # also give JWT_SECRET from the shell
```

**Output** (real run):

```text
Missing secrets: JWT_SECRET
All secrets loaded. Stripe key starts with: sk_test
```

The first run stops because `JWT_SECRET` is missing. The second run has everything. Notice the code never prints a full secret.

## 🔍 Deeper version

**Where secrets live, by environment:**

| Environment | Where | Who can read |
|---|---|---|
| Your laptop | `.env` (git-ignored) | only you |
| CI (GitHub Actions) | repository or environment secrets | the workflow at run time (see [CI secrets](topic:devops/ci-secrets)) |
| Production (AWS) | Secrets Manager or SSM Parameter Store | only the app's IAM role |

**AWS options:**
- **Secrets Manager.** Built for secrets. It encrypts them, controls access with IAM, logs every read in CloudTrail, and can rotate some secrets automatically (like database passwords). It costs a small fee per secret.
- **SSM Parameter Store.** Stores config and secrets (`SecureString` type, encrypted with KMS). It's cheaper and simpler, with no built-in rotation.
- The app's **IAM role** gets permission to read only its own secrets ("least privilege").

**How the app gets them.** Two common ways:
1. **At deploy time:** the pipeline reads the secret manager and passes the values as environment variables to the service.
2. **At start time:** the app calls the secret manager SDK during startup, then caches the values in memory.

Either way, the secret never sits in the code or the image.

**Rotation.** A good setup lets you change a secret without downtime. For example, accept both the old and the new JWT key for a short time, then remove the old one.

**Never leak them:**
- No secrets in the frontend. Anything in a React bundle is public. In Next.js, only `NEXT_PUBLIC_` variables reach the browser (see [Next.js env variables](topic:nextjs/env-variables)).
- No secrets in logs. Redact them in your logger.
- No secrets in Docker images (see [Dockerfile](topic:devops/dockerfile-node)).
- Use secret scanning (for example GitHub push protection) to block commits that contain keys.

**What SkillKeepr uses (public-safe):** the platform runs on AWS, and **Secrets Manager is the source of truth for configuration**, rendered into each service at deploy time. [FILL IN: your own part in this, if any — for example adding a new secret for the Stripe renewal work.]

:::version[Version note]
Since **Node.js 20.6**, `node --env-file=.env` loads a `.env` file without the `dotenv` package. See [environment variables](topic:nodejs/environment-variables).
:::

## 🎯 Why do we use it?

- **Leaked keys cost money and data.** Bots scan public GitHub for keys within minutes.
- **Different values per environment.** Test Stripe keys locally, live keys only in production.
- **Control and audit.** You know who can read a secret, and when it was read.
- **Easy rotation.** Change a secret in one place, without editing code.

## ⚠️ Common mistakes

- **Committing `.env`** because it wasn't in `.gitignore`.
- **Thinking "I deleted the commit, so it's safe."** Git history, forks and caches keep it. Always rotate.
- **Putting secret keys in the frontend** (React env variables are baked into the public bundle).
- **Printing secrets in logs or error messages.**

## 🗣️ How to answer in an interview

> "Secrets like database passwords, API keys and JWT secrets never go into Git or the frontend. Locally I keep them in a .env file that's git-ignored, and Node 24 can load it with --env-file. In production they live in a secret manager. On AWS that's Secrets Manager or SSM Parameter Store, and only the service's IAM role can read them. The values are injected at deploy or start time.
>
> When the app starts, I check that every required secret exists and stop with a clear error if one is missing, so problems show up at deploy time, not on a user's request. I never log secret values. And if a key ever leaks, the fix is to rotate it immediately, because removing it from Git history doesn't make it safe again."

## 🔁 Follow-up questions

### Secrets Manager vs Parameter Store — which would you pick?

Secrets Manager for real secrets that need rotation and auditing, like database passwords. Parameter Store for general config and simpler secrets when cost matters. Many teams use both.

### How do you give a teammate a secret?

Not over chat or email. Give them access to the secret manager, or use a shared password manager. In the best case they never need production secrets at all.

### How do you rotate a JWT secret without logging everyone out?

Support two keys for a while: sign new tokens with the new key, but still accept tokens signed with the old one. When the old tokens have expired, remove the old key.

### How do you stop secrets from being committed?

Add `.env` to `.gitignore`, turn on secret scanning and push protection, and add a pre-commit hook that checks for keys.

## ✅ Quick check

### 1. A Stripe live key was pushed to a public repo 2 minutes ago. What's the first step?

- A) Delete the commit
- B) Rotate the key in Stripe (create a new one, disable the old one)

:::answer
**B.** Assume the key is already copied by bots. Rotate first, then clean up the code and history.
:::

### 2. Is it safe to put `STRIPE_SECRET_KEY` in a React app's environment variables?

:::answer
**No.** Frontend environment variables are baked into the JavaScript bundle that every visitor downloads. Secret keys must stay on the server.
:::

### 3. What does the `secrets.js` example do when `JWT_SECRET` is missing?

:::answer
It prints `Missing secrets: JWT_SECRET` and stops with exit code 1, before the app starts serving requests. That's "fail fast".
:::
