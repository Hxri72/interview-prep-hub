---
title: "Useful Git commands: stash, reset, revert, cherry-pick"
stack: devops
order: 5
level: Intermediate
mustKnow: false
askedFrequency: common
summary:
  - "git stash puts unfinished changes aside, so you can switch branches. git stash pop brings them back."
  - "git restore throws away changes in a file. git switch changes branches. (Both replace parts of the old git checkout.)"
  - "git revert makes a NEW commit that undoes an old one. Safe on shared branches like main."
  - "git reset moves the branch back to an older commit. --soft keeps changes staged, --mixed keeps them unstaged, --hard deletes them."
  - git cherry-pick copies one commit from another branch onto your current branch.
cards:
  - q: When do you use git stash?
    a: When you have unfinished changes but need to switch branches, for example to fix an urgent bug. Stash saves them aside; stash pop brings them back.
  - q: What is the difference between git revert and git reset?
    a: Revert adds a new commit that undoes an old one, so history is kept — safe for shared branches. Reset moves the branch pointer back, removing commits from the branch — only for local, unshared work.
  - q: What are --soft, --mixed and --hard in git reset?
    a: "All move the branch back. --soft keeps the changes staged, --mixed (default) keeps them in the files but unstaged, --hard deletes them completely."
  - q: What is cherry-pick?
    a: Copying one specific commit from another branch onto the current branch, for example to bring a hotfix into a release branch.
  - q: How do you recover a commit after a bad reset --hard?
    a: git reflog shows where your branch pointed before. Find the old commit ID and git reset --hard to it (or create a branch from it).
---

## 💡 What is it?

Beyond `add`, `commit` and `merge`, a few commands save you in daily work:

- **`git stash`**: put unfinished changes **aside** for a moment.
- **`git restore`**: throw away changes in a file.
- **`git revert`**: undo an old [commit](glossary:commit) by adding a **new** commit.
- **`git reset`**: move your branch **back** to an older commit.
- **`git cherry-pick`**: copy **one** commit from another branch.

## 🏠 Real-life example

Think of **working on your school homework at a desk**.

- You're halfway through maths when your teacher asks for a quick science answer. You **put the maths sheets in a drawer** = `git stash`. Later you **take them out** = `git stash pop`.
- You scribbled on a page and want the clean version back = `git restore`.
- You handed in a wrong answer already. You can't take the paper back, so you hand in a **correction note** = `git revert` (a new commit that fixes it).
- You haven't handed anything in yet, so you **tear out the last pages** of your rough notebook = `git reset` (only safe when nobody else has seen them).
- Your friend solved one tricky question perfectly. You **copy just that one answer** into your notebook = `git cherry-pick`.

## 🧑‍💻 Code example

Run these in an empty folder to try every command.

```bash
git init -qb main                                     # new repo on branch main
echo "v1" > app.txt && git add . && git commit -qm "Add app"   # first commit
echo "half-done work" >> app.txt                      # unfinished change in the file
git stash push -m "wip: half-done"                    # put the change aside, with a label
git stash list                                        # show saved stashes
cat app.txt                                           # file is clean again: only v1
git stash pop                                         # bring the change back (and remove it from the stash list)
git restore app.txt                                   # throw away the change in this file (careful: it's gone)
echo "BUG" >> app.txt && git commit -qam "Add bug"    # commit a bad change
git revert --no-edit HEAD                             # make a NEW commit that undoes the last one; --no-edit = keep default message
git log --oneline                                     # history keeps both "Add bug" and the revert
echo "typo" >> app.txt && git commit -qam "Add typo"  # another commit we want to undo locally
git reset --soft HEAD~1                               # move the branch back 1 commit; the change stays staged
git status --short                                    # M in the first column = staged change is still there
git restore --staged app.txt && git restore app.txt   # unstage the change, then throw it away
git switch -qc hotfix                                 # make a hotfix branch
echo "fix login" > fix.txt && git add fix.txt && git commit -qm "Fix login bug"   # fix committed on hotfix
H=$(git rev-parse --short HEAD)                       # remember that commit's short ID in variable H
git switch -q main                                    # back to main
git cherry-pick $H                                    # copy just that one commit onto main
git log --oneline                                     # main now has the fix too
```

**Real output** (key parts; your IDs and dates will differ):

```text
Saved working directory and index state On main: wip: half-done
stash@{0}: On main: wip: half-done
v1
[main 25c3c7c] Revert "Add bug"
25c3c7c Revert "Add bug"
49be6e2 Add bug
075a333 Add app
M  app.txt
[main c9e1fb3] Fix login bug
c9e1fb3 Fix login bug
25c3c7c Revert "Add bug"
49be6e2 Add bug
075a333 Add app
```

## 🔍 Deeper version

**Revert vs reset — the most asked part:**

| | `git revert <commit>` | `git reset <commit>` |
|---|---|---|
| What it does | adds a new commit with the opposite changes | moves the branch pointer back |
| History | kept; nothing removed | commits after the target leave the branch |
| Safe on shared branches (main)? | **yes** | **no** — others still have those commits |
| Typical use | undo a bad change that's already pushed/deployed | clean up local commits before pushing |

**The three reset modes** (example: `git reset --<mode> HEAD~1`, meaning "one commit back"):

| Mode | Branch moves back | Changes kept in staging? | Changes kept in files? |
|---|---|---|---|
| `--soft` | yes | yes | yes |
| `--mixed` (default) | yes | no | yes |
| `--hard` | yes | no | **no — deleted** |

**`git switch` and `git restore`.** The old `git checkout` did two jobs: change branch, and restore files. Since Git 2.23 they're split:
- `git switch <branch>` / `git switch -c <new-branch>`
- `git restore <file>` (discard changes) / `git restore --staged <file>` (unstage)

**Stash details:**
- `git stash -u` also stashes **untracked** (new) files.
- `git stash apply` brings changes back but **keeps** them in the stash list; `pop` removes them.
- Stashes are local and easy to forget. Prefer a quick "wip" commit on a branch for long breaks.

**Cherry-pick details.** It creates a **new** commit with the same changes (new ID). Good for bringing a hotfix into a release branch. Overusing it causes duplicate commits and confusion when branches are merged later.

**Your safety net: `git reflog`.** It records every place `HEAD` has been, even after `reset --hard`. Find the old commit ID there and recover it with `git switch -c rescue <id>`.

## 🎯 Why do we use it?

- **Stash** lets you switch context quickly without making messy commits.
- **Revert** is the safe way to undo a bad change on main, for example to fix production fast. See [rolling back a deployment](topic:devops/rollback).
- **Reset** keeps your local history tidy before others see it.
- **Cherry-pick** moves a single fix where it's needed without merging a whole branch.

## ⚠️ Common mistakes

- **`git reset --hard` on main after pushing.** It rewrites shared history. Use `git revert` instead.
- **`git reset --hard` with uncommitted work.** That work is gone (reflog can't save changes that were never committed).
- **Forgetting old stashes.** Check `git stash list` now and then.
- **`git restore` by mistake** — it discards changes without asking.

## 🗣️ How to answer in an interview

> "I use `git stash` when I'm in the middle of something and need to switch branches, for example for an urgent fix, then `stash pop` to continue.
>
> For undoing, the key question is whether the commit is shared. If it's already pushed to main, I use `git revert`, which adds a new commit that reverses the old one, so history stays intact for everyone. If it's only my local work, I can use `git reset` — `--soft` keeps the changes staged, `--mixed` keeps them in the files, and `--hard` throws them away.
>
> `cherry-pick` copies one specific commit to another branch, like moving a hotfix into a release branch. And if I ever lose something after a reset, `git reflog` lets me find the old commit."

[FILL IN: a time you used revert or cherry-pick at work, if any.]

## 🔁 Follow-up questions

### A bad commit was merged and deployed. How do you undo it?

`git revert <commit>` (for a merge commit: `git revert -m 1 <merge-commit>`), open a PR, and let CI deploy the revert. It's fast and doesn't rewrite main's history.

### What is the difference between `git stash pop` and `git stash apply`?

Both bring the changes back. `pop` also removes the stash from the list; `apply` keeps it, so you can apply it again elsewhere.

### What does `HEAD~1` mean?

"One commit before HEAD" — the parent of your current commit. `HEAD~3` is three commits back.

### How do you undo `git add`?

`git restore --staged <file>`. The change stays in the file; it's just no longer staged.

## ✅ Quick check

### 1. The bad commit is already on the shared main branch. Revert or reset?

:::answer
**Revert.** It adds a new undo commit and keeps history intact for everyone. Reset would rewrite shared history.
:::

### 2. After `git reset --soft HEAD~1`, where is the undone change?

- A) Deleted
- B) In the files, unstaged
- C) In the files and still staged

:::answer
**C) Still staged.** `--soft` only moves the branch pointer back.
:::

### 3. You ran `git reset --hard HEAD~2` and lost two commits. How can you get them back?

:::answer
Run `git reflog`, find the commit ID from before the reset, and `git reset --hard <that-id>` (or `git switch -c rescue <that-id>`).
:::
