---
template: chapter
title: "Shipping a change: from my laptop to production"
stack: skillkeepr-story
order: 15
level: Intermediate
mustKnow: true
askedFrequency: very common
summary:
  - "A change goes: localhost → feature branch → pull request → code review → checks → build → deploy."
  - Locally, developers use a custom hostname, because SkillKeepr finds the company from the subdomain.
  - "Checks before merging: pre-commit type-check and lint, Jest unit tests, and code-quality scans in GitHub Actions."
  - "Two builds: webpack + Babel for the React apps, and Serverless Framework packaging for the Lambda functions."
  - "Deploy: the React build is synced to S3 and CloudFront is refreshed; Lambdas are deployed with the Serverless Framework through AWS CodeBuild."
cards:
  - q: Walk me through how a change reaches production.
    a: I build and test it on localhost, push a feature branch, open a pull request, get a code review, pass the checks, merge, then the pipeline builds and deploys it.
  - q: Why does SkillKeepr need a custom hostname on localhost?
    a: The app reads the company from the subdomain. Plain "localhost" has no subdomain, so developers map a name like acme.local to their machine.
  - q: How is the React frontend deployed?
    a: It's built with webpack and Babel into static files, synced to an S3 bucket, and then CloudFront's cache is invalidated so users get the new files.
  - q: How are the Lambda functions deployed?
    a: The Serverless Framework packages the functions and creates the AWS resources; the deploy runs in AWS CodeBuild.
  - q: What checks run before code is merged?
    a: A pre-commit hook runs type-check and lint, unit tests cover the logic, and GitHub Actions runs code-quality scans on pull requests.
---

## 💡 What happens in this chapter

I fix a bug or add a small feature. How does it go from my laptop to every recruiter using SkillKeepr?

This chapter follows one change through **every step**: local development, review, checks, build and deploy.

## 🏠 Real-life example

Think of **publishing a school magazine article**.

- **Writing the draft at home** = coding on localhost.
- **Saving it as "draft v2"** = a feature branch.
- **The teacher reads and marks it** = the pull request and code review.
- **Spell-check and page-format rules** = lint, type-check and tests.
- **The printing press** = the build (webpack, Serverless packaging).
- **Putting copies in every classroom** = deploying to S3, CloudFront and Lambda.
- **Recalling a page with a mistake** = rolling back.

## 🗺️ The flow

```text
Laptop (localhost)
  custom host e.g. acme.local → my machine   (tenant comes from the subdomain)
  run frontend + backend locally, test the change
        │
        ▼
git: feature branch → commit
  pre-commit hook: type-check + lint
        │
        ▼
Pull request on GitHub
  code review by a teammate
  GitHub Actions: code-quality scans
  Jest unit tests for the changed logic
        │ merge
        ▼
Build
  React apps  → webpack + Babel → hashed JS/CSS + index.html
  Backend     → Serverless Framework packages the Lambda functions
        │
        ▼
Deploy (AWS CodeBuild)
  Frontend → sync files to S3 → invalidate CloudFront cache
  Backend  → Serverless deploy → API Gateway + Lambda updated
        │
        ▼
Check in production (logs, a quick test) — roll back if needed
```

## 🧱 Tech used

| Piece | Technology | Learn it here |
|---|---|---|
| Local setup | localhost, custom hostnames | [localhost and the dev server](topic:web-fundamentals/localhost-dev-server) |
| Branches and reviews | Git, pull requests | [Branching and PRs](topic:devops/branching-prs), [Code reviews](topic:testing/code-reviews) |
| Checks | Lint, type-check, unit tests | [Linting and formatting](topic:testing/linting-formatting), [Jest basics](topic:testing/jest-basics) |
| CI | GitHub Actions | [GitHub Actions](topic:devops/github-actions), [What CI/CD means](topic:devops/what-is-cicd) |
| Frontend build | webpack + Babel | [webpack](topic:web-fundamentals/webpack), [Babel](topic:web-fundamentals/babel) |
| Frontend hosting | S3 + CloudFront | [Hosting a frontend on AWS](topic:web-fundamentals/hosting-frontend-aws) |
| Backend deploy | Serverless Framework, Lambda, API Gateway | [Hosting a Node backend on AWS](topic:web-fundamentals/hosting-backend-aws), [Serverless and Lambda](topic:architecture/serverless-lambda) |
| Undo | Rollback | [Rolling back a bad deployment](topic:devops/rollback) |

## 🧑‍💻 Key code idea

A tiny pre-deploy checker. It runs each step in order and stops at the first failure, like a real pipeline. Save as `predeploy.js`, run `node predeploy.js`.

```js
// predeploy.js — run every check in order; stop at the first failure
const steps = [                                                  // the checks a change must pass
  { name: 'type-check', run: () => true },                       // pretend `tsc --noEmit` passed
  { name: 'lint', run: () => true },                             // pretend ESLint passed
  { name: 'unit tests', run: () => 2 + 2 === 4 },                // a tiny real test: true means pass
  { name: 'build', run: () => true },                            // pretend webpack/Serverless build passed
];                                                               // end of the list
function check(list) {                                           // runs the steps one by one
  for (const step of list) {                                     // go through each step in order
    const ok = step.run();                                       // run it; true = pass
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${step.name}`);        // print the result
    if (!ok) return 'Stopped: fix it before deploying';          // stop at the first failure
  }                                                              // end of the loop
  return 'All green: ready to deploy';                           // every step passed
}                                                                // end of check
console.log(check(steps));                                       // run 1: everything passes
steps[2].run = () => 2 + 2 === 5;                                // break the unit test on purpose
console.log(check(steps));                                       // run 2: stops at the tests
```

```text
PASS  type-check
PASS  lint
PASS  unit tests
PASS  build
All green: ready to deploy
PASS  type-check
PASS  lint
FAIL  unit tests
Stopped: fix it before deploying
```

## 🧗 Hard parts and trade-offs

- **"Works on my machine."** Local runs use a custom hostname and local config. Production uses real domains, real secrets and real data sizes. Always test a production build too. See [works locally, broken in production](topic:debugging/works-locally-not-prod).
- **Two deploys that must agree.** The frontend and backend deploy separately. If the frontend needs a new API field, deploy the backend first, or keep the API backward compatible.
- **Old files in caches.** Hashed file names let browsers cache JS for a long time, but `index.html` must not be cached long. CloudFront is invalidated after each frontend deploy.
- **Fast vs safe.** More checks catch more bugs but slow every merge. Unit tests and lint are cheap; full end-to-end tests are slower.

## 🙋 My part

- I write **Jest unit tests** for backend logic, and I take part in **code reviews**.
- I work in an **Agile (Scrum)** team, so changes usually come from a sprint ticket.
- [FILL IN: your role in the pipeline — do you deploy yourself, or does a lead or a scheduled release do it?]
- [FILL IN: how often you release, and how you roll back in practice.]

## 🗣️ How to explain it in an interview

> "I develop on localhost. Because SkillKeepr finds the company from the subdomain, we map a custom hostname to our machine. I work on a feature branch, and a pre-commit hook runs type-check and lint. Then I open a pull request. A teammate reviews it, GitHub Actions runs code-quality scans, and I add Jest unit tests for the logic I changed.
>
> After merge, the React apps are built with webpack and Babel into hashed static files. They're synced to S3, and we invalidate CloudFront so users get the new version. The backend is a set of Lambda functions deployed with the Serverless Framework through AWS CodeBuild. After deploy I check the logs, and if something's wrong we roll back to the previous version. [FILL IN: your exact role in deploys.]"

## 🔁 Follow-up questions

### Why invalidate CloudFront after a deploy?

CloudFront keeps copies of files near users. Invalidating clears old copies, especially `index.html`, so users load the new version. See [browser caching](topic:web-fundamentals/browser-caching).

### How do you deploy frontend and backend safely in two steps?

Make backend changes backward compatible first, deploy the backend, then deploy the frontend that uses it.

### What happens if a test fails in CI?

The pull request can't be merged. You fix the code or the test, push again, and the checks run again.

### How would you roll back?

Redeploy the previous build or revert the commit. For Lambdas, deploy the earlier version; for the frontend, sync the earlier build and invalidate CloudFront.

## 📚 Topics to revise

- [What CI/CD means](topic:devops/what-is-cicd)
- [GitHub Actions](topic:devops/github-actions)
- [webpack](topic:web-fundamentals/webpack)
- [Hosting a frontend on AWS](topic:web-fundamentals/hosting-frontend-aws)
- [Hosting a Node backend on AWS](topic:web-fundamentals/hosting-backend-aws)
- [Rolling back a bad deployment](topic:devops/rollback)
- [Resume: production support and quality](topic:resume/production-support-quality)
