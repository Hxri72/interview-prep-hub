---
title: "Git basics: commit, branch, merge"
stack: devops
order: 1
level: Basic
mustKnow: true
askedFrequency: very common
summary:
  - Git is a tool that saves snapshots of your code over time. Each snapshot is called a commit.
  - "The three steps: change files → git add (choose what to save) → git commit (save the snapshot with a message)."
  - A branch is a separate line of work. You can try new things without touching the main code.
  - git merge brings the work from one branch into another.
  - Git runs on your own computer. GitHub is a website that stores a copy and lets a team work together.
cards:
  - q: What is Git?
    a: A version control tool. It saves snapshots (commits) of your project, so you can see history, go back, and work in parallel on branches.
  - q: What is the difference between git add and git commit?
    a: git add puts changes in the staging area (the "ready to save" list). git commit saves everything in that list as one snapshot with a message.
  - q: What is a branch?
    a: A movable pointer to a commit. It lets you work on a feature separately, without changing main, and merge it later.
  - q: What is a fast-forward merge?
    a: When main has no new commits since the branch started, Git just moves main forward to the branch's last commit. No merge commit is needed.
  - q: Git vs GitHub?
    a: Git is the tool on your computer that tracks changes. GitHub is a website that hosts Git repositories and adds pull requests, reviews and Actions.
---

## 💡 What is it?

**Git** is a tool that **saves snapshots of your code** over time. It is called a **version control** tool.

Each snapshot is a **[commit](glossary:commit)**. You can look back at old commits, or go back to one if something breaks.

A **[branch](glossary:branch)** is a separate line of work. You build a new feature on a branch, then **merge** it back into the main code.

## 🏠 Real-life example

Think of **writing a school project in a notebook, with photos**.

- After each good part, you **take a photo** of the page. That photo is a **commit**.
- Under each photo, you write **what changed** ("added the diagram"). That is the **commit message**.
- Before taking the photo, you **choose which pages** go in it. That is **git add** (the staging area).
- You want to try a new idea without spoiling the main notebook. So you **photocopy it** and try the idea on the copy. That copy is a **branch**.
- The idea works, so you **copy the new pages back** into the main notebook. That is a **merge**.
- The **album of all photos** is the **[repository](glossary:repository)** (the project's full history).

## 🧑‍💻 Code example

Open a terminal in an empty folder. Run these commands one by one.

```bash
git init -b main                              # start a new Git repository; the first branch is called "main"
echo "Hello" > notes.txt                      # create a file called notes.txt with the word Hello
git add notes.txt                             # put notes.txt in the staging area ("ready to save")
git commit -m "Add notes"                     # save a snapshot; -m = the message describing the change
git switch -c feature/greeting                # create a new branch and move to it; -c = create
echo "Welcome to the team" >> notes.txt       # add a second line to the file (>> means "add at the end")
git commit -am "Add greeting"                 # -a = add all changed tracked files, -m = message; saves a snapshot on the branch
git switch main                               # go back to the main branch (the file shows only "Hello" again)
git merge feature/greeting                    # bring the branch's work into main
git log --oneline                             # list commits, one line each: short ID + message
cat notes.txt                                 # print the file to check the merged result
```

**Real output** (your commit IDs will be different):

```text
Initialized empty Git repository in .../g1/.git/
[main (root-commit) fd861f5] Add notes
 1 file changed, 1 insertion(+)
 create mode 100644 notes.txt
Switched to a new branch 'feature/greeting'
[feature/greeting cfb1fce] Add greeting
 1 file changed, 1 insertion(+)
Switched to branch 'main'
Updating fd861f5..cfb1fce
Fast-forward
 notes.txt | 1 +
 1 file changed, 1 insertion(+)
cfb1fce Add greeting
fd861f5 Add notes
Hello
Welcome to the team
```

**What to notice:** the merge says **Fast-forward**. Main had no new commits, so Git simply moved main forward to the branch's commit.

## 🔍 Deeper version

**The three areas.** Every file change moves through three places:

| Area | What it is | Command to move forward |
|---|---|---|
| **Working directory** | the files you edit | `git add` |
| **Staging area (index)** | the list of changes for the next commit | `git commit` |
| **Repository (.git folder)** | saved history | `git push` (to share it) |

**What a commit really is.** A commit stores a full snapshot of the project, plus the author, time, message, and a link to its **parent** commit. Its ID (like `fd861f5`) is a **hash** of all that content. Change anything, and the ID changes. That's why history can't be edited secretly.

**What a branch really is.** A branch is just a **small pointer** to one commit. Making a branch is instant and cheap. `HEAD` is another pointer. It says "which branch am I on right now?".

**Two kinds of merge:**
- **Fast-forward:** the target branch has no new commits. Git just moves the pointer forward. No extra commit.
- **Three-way merge:** both branches have new commits. Git combines them and makes a new **merge commit** with two parents. If both changed the same lines, you get a [merge conflict](topic:devops/merge-conflicts).

**Local vs remote.** Git works fully on your computer. A **remote** (like GitHub) is another copy. `git push` sends your commits there. `git pull` gets new commits from it (it is `fetch` + `merge`).

:::version[Version note]
`git switch` and `git restore` arrived in **Git 2.23** (2019). They split the old, confusing `git checkout` into two clear commands. Old tutorials still use `git checkout -b` to create a branch; it still works.
:::

**Good commit habits:**
- Small commits that do **one** thing.
- Clear messages in the imperative: "Add job search", not "added stuff".
- Many teams use **Conventional Commits**: `feat:`, `fix:`, `docs:`, `chore:`.

## 🎯 Why do we use it?

- **Safety.** Every change is saved. If a change breaks something, you can see exactly what changed and undo it.
- **Teamwork.** Many developers work on the same project at the same time, each on their own branch.
- **History.** `git log` and `git blame` show who changed a line, when, and why.
- **Automation.** Tools like [GitHub Actions](topic:devops/github-actions) run tests and deploy whenever new commits arrive.

## ⚠️ Common mistakes

- **Committing secrets** like `.env` files or API keys. Add them to `.gitignore` before the first commit. Once pushed, assume the secret is leaked and rotate it.
- **Huge commits** that mix many unrelated changes. They are hard to review and hard to undo.
- **Vague messages** like "update" or "fix". Future you won't know what changed.
- **Working directly on main** in a team. Use a branch and a [pull request](topic:devops/branching-prs).

## 🗣️ How to answer in an interview

> "Git is a version control tool. It saves snapshots of the project called commits. Each commit has a message, an author, and a link to its parent, and its ID is a hash of the content, so history can't be changed silently.
>
> My daily flow is: edit files, `git add` to stage the changes I want, and `git commit` with a clear message. For a new feature I create a branch with `git switch -c`, so main stays stable. When the work is ready, I push the branch and open a pull request. After review, it gets merged into main.
>
> A merge can be a fast-forward, when main hasn't moved, or a three-way merge, which creates a merge commit. If both branches changed the same lines, I resolve the conflict by hand."

[FILL IN: your team's branch naming or commit message style at SkillKeepr, if you have one.]

## 🔁 Follow-up questions

### What is the staging area for?

It lets you choose exactly what goes into the next commit. You might change five files but commit only two now, with a focused message. The rest can go in a separate commit.

### What does git pull do?

It is `git fetch` (download new commits from the remote) plus `git merge` (combine them with your branch). Some teams set `git pull --rebase` to keep a straight history instead.

### How do you stop Git from tracking a file?

Add it to `.gitignore`, for example `.env` or `node_modules/`. If it's already tracked, also run `git rm --cached <file>` to stop tracking it without deleting it.

### What is HEAD?

A pointer to the commit you are on right now. Usually it points to a branch name, like `main`. When you switch branches, HEAD moves.

## ✅ Quick check

### 1. You edited a file and ran `git commit -m "Fix"` without `git add`. What happens?

:::answer
Nothing is committed (Git says "no changes added to commit"). The change is not in the staging area. Use `git add` first, or `git commit -am` for files Git already tracks.
:::

### 2. Main has no new commits since you created your branch. You merge the branch into main. What kind of merge is it?

- A) Three-way merge with a merge commit
- B) Fast-forward
- C) Rebase

:::answer
**B) Fast-forward.** Git just moves main forward to the branch's last commit. No merge commit is created.
:::

### 3. True or false: making a new branch copies all the project files.

:::answer
**False.** A branch is only a small pointer to a commit. That's why creating a branch is instant.
:::
