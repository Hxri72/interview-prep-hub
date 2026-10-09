---
title: Branching workflow and pull requests
stack: devops
order: 2
level: Basic
mustKnow: true
askedFrequency: very common
summary:
  - "Feature branch workflow: pull the latest main → create a branch → commit → push → open a pull request → review → merge."
  - A pull request (PR) asks the team to review your branch before it goes into main.
  - Checks run on every PR (tests, lint, scans). Branch protection blocks the merge until they pass and a reviewer approves.
  - "Keep branches small and short-lived. Name them clearly, like feature/job-search or fix/login-cookie."
  - "Three ways to merge a PR: merge commit, squash, or rebase. Teams pick one style."
cards:
  - q: What is a pull request?
    a: A request on GitHub to merge one branch into another, usually into main. Teammates review the changes, and automatic checks run before it is merged.
  - q: Describe the feature branch workflow.
    a: Pull the latest main, create a branch, commit small changes, push the branch, open a PR, get review and passing checks, then merge and delete the branch.
  - q: What is branch protection?
    a: Rules on a branch like main. For example, no direct pushes, at least one approval, and required checks must pass before merging.
  - q: What does "squash and merge" do?
    a: It combines all commits of the PR into one commit on main. History stays short and clean.
  - q: Why keep pull requests small?
    a: Small PRs are faster and easier to review, have fewer conflicts, and are easier to undo if something goes wrong.
---

## 💡 What is it?

A **branching workflow** is the team's agreed way of using [branches](glossary:branch). The most common one is the **feature branch workflow**.

Each new feature or fix gets **its own branch**. When it's ready, you open a **[pull request](glossary:pull-request)** (PR). Teammates **review** it, automatic **checks** run, and then it is **merged** into `main`.

`main` stays stable, because nothing enters it without review.

## 🏠 Real-life example

Think of **submitting an assignment to your teacher**.

- The **class register** that must stay correct = the `main` branch.
- You write your assignment in **your own notebook** first = your feature branch.
- You **hand it in** and ask the teacher to check it = opening a pull request.
- The teacher writes **red-pen comments** = code review comments.
- A **spell-checker** runs on it automatically = CI checks (tests, lint).
- The **school rule**: "nothing goes into the register without the teacher's signature" = branch protection.
- After approval, the marks go **into the register** = merging the PR.

## 🧑‍💻 Code example

This runs the Git part of the workflow. A local folder plays the role of GitHub, so you can try it offline.

```bash
git init --bare -b main remote.git            # make an empty "server" repository (stands in for GitHub)
git clone remote.git my-app                   # copy it to a working folder called my-app
cd my-app                                     # go into the working folder
echo "# Jobs API" > README.md                 # create a first file
git add README.md                             # stage it
git commit -qm "Initial commit"               # save it; -q = quiet output
git push -q origin main                       # send main to the "server"; origin = the remote's name
git switch main                               # step 1: be on main
git pull                                      # step 2: get the latest main from the team
git switch -c feature/job-search              # step 3: create a feature branch with a clear name
echo "GET /jobs?search=node" > routes.txt     # step 4: make your change
git add routes.txt                            # stage the change
git commit -m "feat: add job search route"    # commit it with a clear message
git push -u origin feature/job-search         # step 5: push the branch; -u = remember origin for next time
git branch -a                                 # list local and remote branches (-a = all)
```

**Real output** of the steps from `git switch main` onwards:

```text
Already on 'main'
Your branch is up to date with 'origin/main'.
Already up to date.
Switched to a new branch 'feature/job-search'
[feature/job-search 560a6b3] feat: add job search route
 1 file changed, 1 insertion(+)
 create mode 100644 routes.txt
To .../remote.git
 * [new branch]      feature/job-search -> feature/job-search
branch 'feature/job-search' set up to track 'origin/feature/job-search'.
* feature/job-search
  main
  remotes/origin/HEAD -> origin/main
  remotes/origin/feature/job-search
  remotes/origin/main
```

On real GitHub, the push also prints a link like "Create a pull request for 'feature/job-search'". Step 6 is to open that link and create the PR.

## 🔍 Deeper version

**A good pull request has:**
- a clear **title** and a short **description**: what changed, why, how to test it
- a link to the **ticket** or issue
- **screenshots** for UI changes
- a **small size** (a few hundred lines at most, if possible)

**What runs on a PR.** [CI](topic:devops/what-is-cicd) runs automatically: install, [lint](topic:testing/linting-formatting), tests, build, and sometimes code-quality or security scans. The PR shows a green tick or a red cross.

**Branch protection (or rulesets) on main:**
- no direct pushes, only PRs
- at least 1–2 approvals
- required status checks must pass
- the branch must be up to date with main
- **CODEOWNERS:** certain folders need approval from certain people

**Three merge buttons on GitHub:**

| Option | What happens | Good for |
|---|---|---|
| **Create a merge commit** | keeps all commits plus a merge commit | full history |
| **Squash and merge** | all PR commits become one commit | a clean, short main history |
| **Rebase and merge** | replays each commit on top of main, no merge commit | a straight line, but keeps every commit |

**Popular workflows:**
- **GitHub Flow:** main + short feature branches + PRs. Simple; good with frequent deploys.
- **Git Flow:** `main`, `develop`, `feature/*`, `release/*`, `hotfix/*`. More structure, slower. Many teams merge features into a `develop` branch first, then promote to main.
- **Trunk-based development:** very short branches (hours, not weeks), merged to main often, with **feature flags** to hide unfinished work.

**Keeping a long branch up to date.** Pull main into it often, by [merging or rebasing](topic:devops/merge-vs-rebase). That keeps [conflicts](topic:devops/merge-conflicts) small.

## 🎯 Why do we use it?

- **Quality.** A second pair of eyes catches bugs, security problems and unclear code. See [code reviews](topic:testing/code-reviews).
- **Stable main.** Main is always in a working state, so it can be deployed at any time.
- **Parallel work.** Many people work on many features without stepping on each other.
- **Traceability.** Each change has a PR with the reason, the discussion and the checks.

## ⚠️ Common mistakes

- **Giant PRs** with weeks of work. Nobody can review them properly.
- **Long-lived branches** that drift far from main and end in painful conflicts.
- **Merging with red checks** or without review "just this once".
- **Unclear branch names** like `test2` or `hari-changes`.

## 🗣️ How to answer in an interview

> "I use a feature branch workflow. I pull the latest main, create a branch named after the work, like `feature/job-search`, and make small commits with clear messages. Then I push the branch and open a pull request with a description, how to test it, and screenshots if it's UI.
>
> CI runs on the PR, so lint, tests and the build must pass. Main is protected: no direct pushes, at least one approval, and the checks must be green. I reply to review comments, fix them, and when it's approved, it gets merged and the branch is deleted.
>
> I try to keep PRs small, because they're easier to review and easier to roll back."

[FILL IN: your team's real flow at SkillKeepr — e.g. feature branches into develop, how many approvals, which checks run on PRs.]

## 🔁 Follow-up questions

### Squash merge or merge commit — which do you prefer?

Squash keeps main clean: one commit per PR, easy to revert. A merge commit keeps every small commit, which helps when you need detailed history. Most teams I know prefer squash for feature PRs. The important thing is that the team is consistent.

### What if your PR has conflicts with main?

Update your branch from main (merge or rebase), resolve the conflicts locally, run the tests again, and push. The PR updates automatically.

### What do you write in a PR description?

What changed, why, how to test it, any risks, and the ticket link. For UI changes, before/after screenshots.

### How do you review someone else's PR?

I check correctness, edge cases, security, tests and readability. I ask questions instead of giving orders, and I separate "must fix" from "nice to have". See [code reviews](topic:testing/code-reviews).

## ✅ Quick check

### 1. What does `git push -u origin feature/x` do?

:::answer
It sends the branch `feature/x` to the remote called `origin`. `-u` sets it as the upstream, so later you can just type `git push` or `git pull`.
:::

### 2. Main is protected with "require 1 approval" and "require checks to pass". Your tests fail. Can you merge?

:::answer
**No.** The merge button stays blocked until the required checks pass and the PR has an approval (unless an admin bypasses the rule, which should be rare).
:::

### 3. Which merge option turns all of a PR's commits into one commit on main?

- A) Create a merge commit
- B) Squash and merge
- C) Rebase and merge

:::answer
**B) Squash and merge.**
:::
