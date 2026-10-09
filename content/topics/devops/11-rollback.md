---
title: Rolling back a bad deployment
stack: devops
order: 11
level: Intermediate
mustKnow: false
askedFrequency: common
summary:
  - A rollback means going back to the last version that worked, fast, when a new deploy breaks something.
  - "Fastest options: redeploy the previous build, or turn off a feature flag. Then fix the bug calmly."
  - git revert makes a new commit that undoes a bad one — safe for shared branches, unlike rewriting history.
  - Blue/green and canary deploys make rollback easy because the old version is still ready.
  - Database changes are the hard part — make migrations backward compatible so old code still works.
cards:
  - q: What is a rollback?
    a: Returning production to the last known good version after a bad deploy, so users stop seeing the problem while you fix it.
  - q: What is a feature flag?
    a: A switch (often in config or a flag service) that turns a feature on or off without a new deploy. Turning it off is the fastest "rollback".
  - q: Blue/green vs canary?
    a: Blue/green runs old and new side by side and switches all traffic at once (switch back to roll back). Canary sends a small % of traffic to the new version first and grows it if healthy.
  - q: git revert vs git reset for a bad commit on main?
    a: Use git revert — it adds a new commit that undoes the change and keeps history. git reset rewrites history and breaks teammates' copies.
  - q: Why are database migrations the hard part of rollback?
    a: Code can go back in seconds, but a dropped column can't. Make schema changes backward compatible (expand → migrate → contract) so the old code still works.
---

## 💡 What is it?

A **rollback** means going back to the **last version that worked**.

You do it when a new deploy breaks something in production. First you **stop the damage** by rolling back. Then you **fix the bug** calmly and deploy again.

## 🏠 Real-life example

Think of a **school notice board** where the class monitor puts up the timetable.

- The monitor pins up a **new timetable**, but it has a mistake = a bad deploy.
- Students start going to the wrong classroom = users see errors.
- The monitor quickly **puts the old timetable back up** = rollback.
- Then they **fix the new one at the desk** and pin it again later = fix forward.

Smart monitors **keep the old timetable** in a drawer, not in the dustbin. That's like keeping the previous build ready.

## 🧑‍💻 Code example

A **feature flag** plus a **canary** rule, in plain Node. Save as `flags.js` and run `node flags.js`.

```js
const flags = {                                          // our feature flag settings (in real life: config or a flag service)
  newCheckout: { enabled: true, canaryPercent: 20 },     // new checkout is ON, but only for about 20% of users
};                                                       // end of the flags object

function hashUser(userId) {                              // turn a user id into a stable number from 0 to 99
  let sum = 0;                                           // start the total at 0
  for (const ch of userId) sum += ch.charCodeAt(0);      // add up the character codes of the id
  return sum % 100;                                      // keep only 0–99, so the same user always gets the same number
}                                                        // end of hashUser

function useNewCheckout(userId) {                        // decide which checkout this user sees
  const flag = flags.newCheckout;                        // read the flag
  if (!flag.enabled) return false;                       // flag OFF → everyone gets the old version (instant rollback)
  return hashUser(userId) < flag.canaryPercent;          // flag ON → only users whose number is below 20 get the new one
}                                                        // end of useNewCheckout

const users = ['asha', 'ravi', 'meena', 'arun', 'divya', 'kiran']; // six sample users
console.log('Canary 20%:', users.map((u) => `${u}=${useNewCheckout(u) ? 'new' : 'old'}`).join(' ')); // who sees what now

flags.newCheckout.enabled = false;                       // errors went up! turn the flag OFF — no deploy needed
console.log('Flag off:  ', users.map((u) => `${u}=${useNewCheckout(u) ? 'new' : 'old'}`).join(' ')); // everyone is back on old
```

**Output:**

```text
Canary 20%: asha=new ravi=old meena=new arun=old divya=old kiran=old
Flag off:   asha=old ravi=old meena=old arun=old divya=old kiran=old
```

**Rolling back code with Git** (safe on a shared branch):

```bash
git log --oneline -3      # find the bad commit, e.g. a1b2c3d
git revert a1b2c3d        # make a NEW commit that undoes it (history is kept)
git push origin main      # CI/CD deploys the reverted code
```

## 🔍 Deeper version

**Ways to roll back, fastest first:**

| Method | How fast | How it works |
|---|---|---|
| Turn off a feature flag | Seconds | The new code is still deployed but switched off |
| Switch traffic back (blue/green) | Seconds | The old version is still running; the load balancer points back to it |
| Redeploy the previous build | Minutes | Deploy the last good image/bundle again (Railway, Vercel, Lambda versions, etc.) |
| `git revert` + pipeline | Minutes | A new commit undoes the change, then CI/CD deploys it |

**Deployment strategies that make rollback easy:**
- **Blue/green** — two full copies. Blue is live, green gets the new version. Test green, then switch all traffic. Problem? Switch back to blue.
- **Canary** — send a small share (say 5%) of traffic to the new version. Watch error rates and latency. If healthy, grow to 25%, 50%, 100%. If not, send everyone back.
- **Rolling** — replace servers a few at a time. Slower to roll back.

**On AWS Lambda**, each deploy can publish a **version**, and an **alias** points to it. Rolling back means pointing the alias to the previous version. Aliases can also split traffic for a canary.

**The database is the hard part.** Code goes back in seconds. Data changes don't. So use **expand → migrate → contract**:
1. **Expand** — add the new column, keep the old one. Both old and new code work.
2. **Migrate** — move data, deploy code that uses the new column.
3. **Contract** — remove the old column only after everything is stable.

**Roll back vs fix forward.** If the fix is tiny and you are confident, fixing forward can be fine. If you are unsure, **roll back first** — stopping user pain beats being clever.

**After the incident**, write a short postmortem: what broke, why tests didn't catch it, and what you changed. See [production incidents](topic:testing/production-incidents).

## 🎯 Why do we use it?

- **To stop user pain fast.** Every minute of a broken checkout or login costs trust and money.
- **To make deploys less scary.** If going back is easy, teams can ship small changes often.
- **To separate "stop the damage" from "find the cause".** You debug calmly while users are safe.

## ⚠️ Common mistakes

- **Using `git reset --hard` and force-pushing main.** It rewrites shared history. Use `git revert`.
- **Deleting the old build.** Then there is nothing to go back to.
- **Destructive database migrations in the same deploy** (dropping a column). The old code can't run any more.
- **Rolling back without telling the team**, so someone redeploys the bad version.

## 🗣️ How to answer in an interview

> "When a deploy breaks production, my first goal is to stop the damage, then fix the cause. The fastest options are turning off the feature flag if the change is behind one, or redeploying the previous good build. For code history I use git revert, which adds an undo commit, instead of rewriting main.
>
> To make rollback easy in the first place, I like canary or blue/green deploys, so the old version is still ready, and I keep database changes backward compatible with expand, migrate, contract — because code rolls back in seconds but a dropped column doesn't.
>
> After it's stable, I find the root cause, add a test that would have caught it, and share a short write-up."

[FILL IN: how a bad deploy is rolled back in your team, and one real time you did it, if you have one.]

## 🔁 Follow-up questions

### How do you decide between rolling back and fixing forward?

Roll back if users are hurting and the cause isn't 100% clear. Fix forward only if the fix is tiny, well understood and quick to ship — and the rollback itself would be risky.

### How do you know a canary is unhealthy?

Compare the canary's error rate, latency and key business numbers (like checkouts) with the old version. Set automatic alerts so the rollout stops by itself.

### What is a feature flag's downside?

Old flags pile up and make code messy. Remove a flag once the feature is fully live.

### How do you roll back a Lambda function?

Point its alias back to the previous published version, or redeploy the previous package from your pipeline.

## ✅ Quick check

### 1. In the code example, what does turning `enabled` to `false` do?

:::answer
Every user gets the **old** checkout immediately — **no deploy** needed. That's why flags are the fastest rollback.
:::

### 2. A bad commit is already on the shared `main` branch. Which is safer?

- A) `git reset --hard HEAD~1` and force-push
- B) `git revert <commit>` and push

:::answer
**B.** Revert adds a new undo commit and keeps history. Force-pushing a reset breaks teammates' copies.
:::

### 3. Why add a new column instead of renaming one in the same deploy?

:::answer
So the **old code still works** if you roll back. Rename/drop only after the new code is stable (expand → migrate → contract).
:::
