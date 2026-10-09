---
title: Merge vs rebase
stack: devops
order: 3
level: Basic
mustKnow: true
askedFrequency: very common
summary:
  - Both bring changes from one branch into another. They differ in how the history looks.
  - Merge keeps the history exactly as it happened and adds a merge commit. Safe for shared branches.
  - Rebase replays your commits on top of the other branch. History becomes one straight line, but your commits get new IDs.
  - "Golden rule: don't rebase commits that others already have (a shared branch). Rebase only your own local work."
  - "After rebasing a pushed branch, push with git push --force-with-lease, never plain --force."
cards:
  - q: What is the difference between merge and rebase?
    a: Merge combines branches with a new merge commit and keeps the real history. Rebase moves your commits to start from the tip of the other branch, giving a straight line but new commit IDs.
  - q: When should you NOT rebase?
    a: On branches other people already pulled, like main or a shared feature branch. Rebasing rewrites history and breaks their copies.
  - q: Why do commit IDs change after a rebase?
    a: A commit's ID is a hash of its content and its parent. Rebase gives each commit a new parent, so it becomes a new commit with a new ID.
  - q: Why use --force-with-lease instead of --force?
    a: --force-with-lease refuses to overwrite the remote if someone else pushed new commits since you last fetched. --force overwrites blindly.
  - q: Which is "better"?
    a: Neither. Merge is safe and keeps true history; rebase gives cleaner history. Many teams rebase their own feature branch and squash or merge into main.
---

## 💡 What is it?

**Merge** and **rebase** both bring the work from one [branch](glossary:branch) into another. The result in the code is usually the same. The **history** looks different.

- **Merge** joins the two branches and adds a **merge commit**. History shows exactly what happened, including the fork and the join.
- **Rebase** picks up your [commits](glossary:commit) and **replays them on top of** the other branch. History becomes one straight line.

## 🏠 Real-life example

Think of **a class diary that two students write**.

Riya writes pages 1–3 in the main diary. Meanwhile, you write pages A and B in a separate notebook, starting from page 1.

- **Merge** = you staple your pages A and B into the diary, plus a note: "Joined my pages here." The diary shows both paths and the join. Nothing is rewritten.
- **Rebase** = you **rewrite** pages A and B on fresh paper, as if you had started **after page 3**. The diary reads as one clean story. But your pages are now **new copies**, with new page numbers.
- **The golden rule** = if friends already **photocopied** your old pages A and B, don't rewrite them. Their copies won't match yours anymore.

## 🧑‍💻 Code example

This builds the same situation twice: once with merge, once with rebase. Run it in an empty folder.

```bash
git init -qb main                              # new repo, first branch "main"; -q = quiet
echo a > app.txt && git add . && git commit -qm "A: start app"   # commit A on main
git switch -qc feature                         # create and switch to a branch called feature
echo f1 > feature.txt && git add . && git commit -qm "F1: add filter"   # commit F1 on feature
echo f2 >> feature.txt && git commit -qam "F2: add sort"          # commit F2 on feature
git switch -q main                             # back to main
echo m >> app.txt && git commit -qam "M: fix typo on main"        # commit M on main (main moved on)
cp -r . ../rebase-copy                         # make an identical copy to try rebase later

git switch -q feature                          # MERGE version: go to feature
git merge main -m "Merge branch 'main' into feature"              # bring main's new commit into feature
git log --oneline --graph                      # draw the history as a graph

cd ../rebase-copy                              # REBASE version: use the identical copy
git switch -q feature                          # go to feature
git rebase main                                # replay F1 and F2 on top of main's latest commit
git log --oneline --graph                      # draw the history again
```

**Real output:**

```text
=== MERGE ===
Merge made by the 'ort' strategy.
 app.txt | 1 +
 1 file changed, 1 insertion(+)
*   73bb5b8 Merge branch 'main' into feature
|\
| * 0497569 M: fix typo on main
* | 01bc185 F2: add sort
* | ec9c60f F1: add filter
|/
* 942e399 A: start app

=== REBASE ===
Successfully rebased and updated refs/heads/feature.
* e6f057c F2: add sort
* 0fe6db4 F1: add filter
* 0497569 M: fix typo on main
* 942e399 A: start app
```

**What to notice:**
- Merge drew a **fork and a join**, and added a merge commit `73bb5b8`.
- Rebase drew **one straight line**. And look: "F1: add filter" was `ec9c60f`, but after rebase it's `0fe6db4`. **Rebase made new commits.**

## 🔍 Deeper version

**How merge works.** Git finds the common ancestor (A), compares both sides, and creates a **merge commit with two parents**. Existing commits are never changed. That's why merge is always safe on shared branches.

**How rebase works.** Git takes your commits (F1, F2), temporarily removes them, moves your branch to the tip of `main`, and **re-applies** each commit one by one. A commit's ID is a [hash](glossary:hash) of its content **and its parent**. The parent changed, so every replayed commit gets a **new ID**. This is called **rewriting history**.

| | Merge | Rebase |
|---|---|---|
| History shape | true history, with forks and joins | one straight line |
| Existing commits | unchanged | replaced by new copies |
| Safe on shared branches? | yes | no — breaks others' copies |
| Conflicts | resolved once, in the merge commit | may need resolving per commit |
| Extra commit | merge commit | none |

**The golden rule.** Never rebase commits that exist outside your machine and that others may have pulled. If you rebase a branch you already pushed (only you use it), push with:

```bash
git push --force-with-lease                    # overwrite the remote branch, but ONLY if nobody else pushed meanwhile
```

**Interactive rebase.** `git rebase -i HEAD~3` lets you squash, reorder or reword your last 3 commits before opening a PR. Great for cleaning up "wip" commits.

**Common team setup:**
- Rebase your **own** feature branch on main to stay up to date (`git pull --rebase`).
- Merge into main through a **PR**, often with **squash and merge**. See [pull requests](topic:devops/branching-prs).

**If a rebase goes wrong:** `git rebase --abort` returns to the state before you started. `git reflog` shows where your branch pointed before, so you can recover.

## 🎯 Why do we use it?

- **Merge** keeps an honest record. You can see when work was combined, and nothing is rewritten. Best for shared branches.
- **Rebase** keeps history clean and linear. `git log` reads like a simple story, and `git bisect` (finding which commit broke something) is easier.
- Knowing both lets you keep a clean history **without** breaking teammates' work.

## ⚠️ Common mistakes

- **Rebasing main or a shared branch.** Teammates suddenly get duplicate commits and confusing conflicts.
- **Using `git push --force`** after a rebase. It can delete a teammate's commits. Use `--force-with-lease`.
- **Panicking mid-rebase.** Use `git rebase --abort` to go back, or `git rebase --continue` after fixing a conflict.
- **Thinking rebase changes the final code.** Usually the final files are the same as with merge. Only the history differs.

## 🗣️ How to answer in an interview

> "Both merge and rebase integrate changes from one branch into another. Merge creates a merge commit with two parents and keeps the real history, so it's always safe, even on shared branches. Rebase replays my commits on top of the other branch, so the history becomes a straight line. But it creates new commits with new IDs, because each commit's hash depends on its parent.
>
> So my rule is: I rebase only my own local or personal feature branch, for example to update it from main before opening a PR, or `rebase -i` to squash small fix-up commits. I never rebase main or a branch others are using. If I must update a branch I already pushed, I use `--force-with-lease`, not `--force`.
>
> Into main itself, we merge through pull requests."

[FILL IN: does your team prefer merge or rebase for updating feature branches, and squash or merge commits for PRs?]

## 🔁 Follow-up questions

### What is `git pull --rebase`?

It fetches the remote changes, then rebases your local commits on top of them instead of making a merge commit. It avoids "Merge branch 'main' of …" noise when you and a teammate both committed.

### What is the difference between `--force` and `--force-with-lease`?

`--force` overwrites the remote branch no matter what. `--force-with-lease` first checks that the remote is still where you last saw it. If a teammate pushed meanwhile, it refuses, so their work isn't lost.

### How do you resolve conflicts during a rebase?

Git stops at the commit that conflicts. Fix the files, `git add` them, then `git rebase --continue`. Repeat for each conflicting commit. Or `git rebase --abort` to cancel everything.

### What is `git rebase -i` used for?

Interactive rebase. You can squash several commits into one, reword messages, reorder or drop commits — useful to tidy your branch before a PR.

## ✅ Quick check

### 1. After rebasing your feature branch onto main, do your commits keep the same IDs?

:::answer
**No.** Each replayed commit has a new parent, so it gets a new hash ID.
:::

### 2. Your teammates pulled the shared `develop` branch yesterday. Should you rebase `develop` today?

:::answer
**No.** It rewrites commits they already have. Use merge on shared branches.
:::

### 3. Which command safely updates a remote branch after you rebased it?

- A) `git push --force`
- B) `git push --force-with-lease`
- C) `git push --rebase`

:::answer
**B) `git push --force-with-lease`.** It refuses to overwrite commits someone else pushed after your last fetch. (Option C doesn't exist.)
:::
