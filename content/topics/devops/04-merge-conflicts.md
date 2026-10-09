---
title: Resolving merge conflicts
stack: devops
order: 4
level: Basic
mustKnow: false
askedFrequency: common
summary:
  - A merge conflict happens when two branches change the same lines, and Git can't decide which version to keep.
  - "Git marks the conflict in the file with <<<<<<<, ======= and >>>>>>> lines."
  - "To fix: open the file, decide the correct final code, delete the markers, then git add and git commit."
  - Always run the tests after resolving. A conflict-free file can still be wrong code.
  - Avoid conflicts with small PRs, short-lived branches and pulling main often.
cards:
  - q: What causes a merge conflict?
    a: Two branches changed the same lines of the same file (or one deleted a file the other changed). Git can't safely choose, so it asks you.
  - q: What do the conflict markers mean?
    a: "<<<<<<< HEAD starts your current branch's version. ======= separates the two versions. >>>>>>> branch-name ends the incoming branch's version."
  - q: What are the steps to resolve a conflict?
    a: Open each conflicted file, choose or combine the right code, delete the markers, run the tests, then git add the file and git commit (or git rebase --continue).
  - q: How do you cancel a merge that has conflicts?
    a: git merge --abort. It returns everything to the state before the merge started.
  - q: How do you reduce conflicts in a team?
    a: Small, short-lived branches, pulling main often, formatting code with the same tool (like Prettier), and talking when two people touch the same files.
---

## 💡 What is it?

A **merge conflict** happens when two [branches](glossary:branch) change **the same lines** of the same file. Git can't know which change is right, so it **stops and asks you**.

Git marks the problem area in the file. You decide the correct final code, then finish the merge.

Conflicts are **normal** in a team. They are not an error in Git. They just need a human decision.

## 🏠 Real-life example

Think of **two friends editing the same line of a party invitation**.

The invitation says "Party starts at 6 PM". Riya changes it to "5 PM". Arun changes the same line to "7 PM". Now the printer (Git) can't decide which time to print.

- The **invitation** = the file.
- **Riya's copy** = your current branch (`HEAD`).
- **Arun's copy** = the branch being merged in.
- The printer **shows both times and asks** = the conflict markers.
- You **call both friends and agree on 6:30 PM** = resolving the conflict.
- **Printing the final card** = `git add` and `git commit`.

## 🧑‍💻 Code example

This creates a real conflict on purpose. Run it in an empty folder.

```bash
git init -qb main                                        # new repo; first branch is "main"
printf 'PORT=3000\nLIMIT=10\n' > config.txt              # a config file with two lines
git add . && git commit -qm "Add config"                 # save it on main
git switch -qc feature/limit                             # create and switch to a branch
sed -i '' 's/LIMIT=10/LIMIT=20/' config.txt              # branch changes LIMIT to 20 (on Linux: sed -i without '')
git commit -qam "Raise limit to 20"                      # save that on the branch
git switch -q main                                       # back to main
sed -i '' 's/LIMIT=10/LIMIT=50/' config.txt              # main changes the SAME line to 50
git commit -qam "Raise limit to 50"                      # save that on main
git merge feature/limit                                  # try to merge → conflict!
git status --short                                       # list files; UU = both sides changed it (unmerged)
cat config.txt                                           # look at the conflict markers inside the file
printf 'PORT=3000\nLIMIT=25\n' > config.txt              # resolve: write the agreed final content, no markers
git add config.txt                                       # tell Git this file is resolved
git commit -m "Merge feature/limit: agree on LIMIT=25"   # finish the merge with a merge commit
git log --oneline --graph                                # see both branches joined
```

**Real output:**

```text
Auto-merging config.txt
CONFLICT (content): Merge conflict in config.txt
Automatic merge failed; fix conflicts and then commit the result.
UU config.txt
PORT=3000
<<<<<<< HEAD
LIMIT=50
=======
LIMIT=20
>>>>>>> feature/limit
[main 71133e3] Merge feature/limit: agree on LIMIT=25
*   71133e3 Merge feature/limit: agree on LIMIT=25
|\
| * 1854a2b Raise limit to 20
* | 5ff364c Raise limit to 50
|/
* 18c2e58 Add config
```

**What to notice:** `PORT=3000` was not touched by either branch, so Git merged it by itself. Only the `LIMIT` line needed a human.

## 🔍 Deeper version

**Reading the markers:**

```text
<<<<<<< HEAD                 ← start of YOUR current branch's version (main here)
LIMIT=50
=======                      ← divider
LIMIT=20
>>>>>>> feature/limit        ← end of the INCOMING branch's version
```

During a **rebase**, the labels are flipped in a confusing way: `HEAD` is the branch you are rebasing **onto**, and the other side is your own commit being replayed.

**The resolution checklist:**
1. `git status` — list every conflicted file (`UU`, `AA`, `DU`…).
2. Open each file. **Understand both changes** (read the commit messages, or ask the author).
3. Write the correct final code. It may be one side, the other side, or a mix of both.
4. Delete **all** markers. Search for `<<<<<<<` to be sure.
5. **Run the app and the tests.** A file with no markers can still be broken.
6. `git add <file>`, then `git commit` (merge) or `git rebase --continue` (rebase).

**Escape hatches:**
- `git merge --abort` or `git rebase --abort`: go back to before you started.
- `git checkout --ours <file>` / `git checkout --theirs <file>`: take one whole side for that file (use carefully).
- VS Code shows "Accept Current / Accept Incoming / Accept Both" buttons above each conflict. They're handy, but you still need to think.

**Lock file conflicts** (`package-lock.json`). Don't hand-edit it. Take one side, run `npm install`, and commit the regenerated file.

**Semantic conflicts.** Sometimes there's **no** Git conflict but the code is still wrong. For example, one branch renames a function while another adds a new call to the old name. Only [tests and CI](topic:devops/what-is-cicd) catch this.

## 🎯 Why do we use it?

Conflict resolution is how a team **safely combines** parallel work. Git merges everything it can by itself, and asks a human only where two people disagreed. Doing it carefully stops one person's change from silently deleting another's.

## ⚠️ Common mistakes

- **Leaving a marker** like `<<<<<<<` in the code. It can break the build or appear on screen. Search for markers before committing.
- **Always picking "mine"** without reading the other change. You may delete a teammate's bug fix.
- **Not running tests** after resolving.
- **Hand-editing `package-lock.json`.** Regenerate it with `npm install` instead.

## 🗣️ How to answer in an interview

> "A merge conflict happens when two branches change the same lines, so Git can't choose automatically. Git marks the spot with `<<<<<<<`, `=======` and `>>>>>>>`: the top part is my current branch, the bottom part is the incoming branch.
>
> I first run `git status` to see all conflicted files. For each one, I understand both changes — if needed I check the commit or ask the other developer. Then I write the correct final code, remove all markers, run the app and the tests, and `git add` and commit. If things get messy, `git merge --abort` takes me back to the start.
>
> To avoid conflicts, I keep branches small and short-lived and pull from main often."

[FILL IN: a real conflict you resolved at work, if you remember one — e.g. two people editing the same route or config.]

## 🔁 Follow-up questions

### How do you resolve a conflict in package-lock.json?

Don't edit it by hand. Keep one version (for example main's), run `npm install` so npm rebuilds it with both sides' dependencies, then commit the result.

### What's the difference between "ours" and "theirs"?

In a merge, "ours" is your current branch and "theirs" is the branch you're merging in. In a rebase, it's reversed, because Git is replaying your commits on top of the other branch.

### Can there be a bug even without a conflict?

Yes. Two changes can merge cleanly but not work together — like a renamed function plus a new call to its old name. That's why tests must run after every merge.

### How do you prevent conflicts?

Small PRs, short-lived branches, pulling main often, one shared code formatter, and telling teammates when you're changing a shared file.

## ✅ Quick check

### 1. What does `UU config.txt` in `git status --short` mean?

:::answer
The file is **unmerged**: both sides changed it, and it still has a conflict to resolve.
:::

### 2. You deleted the markers but forgot to run `git add`. Can you commit the merge?

:::answer
**No.** Git still sees the file as unresolved. You must `git add` it to mark it resolved, then commit.
:::

### 3. Which command cancels a merge with conflicts and restores the previous state?

- A) `git reset --hard origin/main`
- B) `git merge --abort`
- C) `git stash`

:::answer
**B) `git merge --abort`.** (A also discards work, but it throws away more than just the merge — use it only if you mean to.)
:::
