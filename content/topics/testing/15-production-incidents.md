---
title: "Production support: handling a live incident"
stack: testing
order: 15
level: Intermediate
mustKnow: true
askedFrequency: very common
summary:
  - "An incident is when production is broken or slow for users. The first goal is to stop the damage, not to find the perfect fix."
  - "Steps: confirm the symptom → check impact → look at logs, errors and recent deploys → mitigate (rollback, flag off) → fix the root cause → write a postmortem."
  - "\"What changed recently?\" is the fastest question. A deploy, a config change or a third-party outage is behind most incidents."
  - Communicate early and often — tell your team and support what you know, even if it's 'still investigating'.
  - A blameless postmortem asks how the system allowed the mistake, and adds a test, alert or guard so it can't happen again.
cards:
  - q: What do you do first when production breaks?
    a: Confirm the symptom and its impact (who and how many users), tell the team, then look at what changed recently — deploys, config, third-party status.
  - q: Mitigate vs fix — what's the difference?
    a: Mitigation stops the damage fast (rollback, turn a feature flag off, scale up). The fix removes the root cause and can come after.
  - q: How do you find the root cause?
    a: Follow the evidence — error tracker, logs filtered by route and time, the request ID of a failing request, and the timeline of deploys and config changes.
  - q: What is a blameless postmortem?
    a: A short write-up of what happened, the timeline, the root cause, the impact and follow-up actions — focused on fixing the system, not blaming a person.
  - q: Why is a rollback often the best first move after a bad deploy?
    a: It is fast and known to work. You can investigate calmly once users are no longer affected.
---

## 💡 What is it?

A **production incident** is when the live app is **broken or very slow** for real users. For example, "nobody can apply for jobs", or "payments are failing".

**Production support** means handling it calmly, in steps:
1. confirm it,
2. stop the damage,
3. find the real cause,
4. fix it,
5. make sure it can't happen again.

## 🏠 Real-life example

Think of a **water pipe bursting in the school**.

1. A student shouts, "Water in the corridor!" → **the symptom is reported**.
2. The caretaker checks: one corridor or the whole floor? → **the impact**.
3. "The plumber worked on this pipe this morning" → **what changed recently**.
4. First, **turn off the main valve** → **mitigate** (like a rollback). The water stops.
5. Then find the loose joint and repair it → **the root-cause fix**.
6. Later, a note: "Pipes must be pressure-tested after repairs" → **the postmortem and prevention**.

Nobody shouts "Who broke it?" The question is "How do we stop it happening again?" That's **blameless**.

## 🧑‍💻 Code example

Logs are JSON lines. This script does the first 5 minutes of investigation: **which route is failing, when it started, and what changed just before**.

Save the log as `app.log`, the script as `triage.js`, and run `node triage.js`.

```text
{"time":"10:00:05","level":"info","route":"GET /jobs","status":200,"ms":80}
{"time":"10:01:10","level":"info","route":"POST /applications","status":201,"ms":120}
{"time":"10:02:00","level":"info","msg":"deploy finished","version":"v2.4.0"}
{"time":"10:02:30","level":"error","route":"POST /applications","status":500,"ms":15,"err":"Cannot read properties of undefined (reading 'email')"}
{"time":"10:02:41","level":"info","route":"GET /jobs","status":200,"ms":75}
{"time":"10:03:12","level":"error","route":"POST /applications","status":500,"ms":12,"err":"Cannot read properties of undefined (reading 'email')"}
{"time":"10:04:55","level":"error","route":"POST /applications","status":500,"ms":14,"err":"Cannot read properties of undefined (reading 'email')"}
```

```js
const fs = require('node:fs');                                   // read files

const lines = fs.readFileSync('app.log', 'utf8').trim().split('\n'); // one JSON log entry per line
const entries = lines.map((line) => JSON.parse(line));           // turn each line into an object

const errors = entries.filter((e) => e.status >= 500);           // keep only server errors (5xx)
const byRoute = {};                                              // route → number of errors
for (const e of errors) byRoute[e.route] = (byRoute[e.route] || 0) + 1; // count errors per route

const deploy = entries.find((e) => e.msg === 'deploy finished'); // did we ship something just before?
const firstError = errors[0];                                    // when did the trouble start?

console.log('5xx per route:', byRoute);                          // which endpoint is broken
console.log('first error at', firstError.time, '-', firstError.err); // the exact message to search for
console.log('last deploy at', deploy.time, '→', deploy.version); // a deploy right before = prime suspect
```

**Output (real run):**

```text
5xx per route: { 'POST /applications': 3 }
first error at 10:02:30 - Cannot read properties of undefined (reading 'email')
last deploy at 10:02:00 → v2.4.0
```

**Reading it:** only `POST /applications` fails. It started **30 seconds after** the v2.4.0 deploy. Other routes are fine. The best first move is to **roll back to the previous version**, then find the `email` bug calmly. In real life you'd run the same kind of query in your log tool, for example CloudWatch Logs Insights, instead of a script.

## 🔍 Deeper version

**The incident flow:**

| Step | Questions | Tools |
|---|---|---|
| 1. Detect | Alert, error spike, or a user report? Can I reproduce it? | Alerts, error tracker, support tickets |
| 2. Assess impact | All users or one tenant? One route or the whole app? Money involved? | Metrics, error counts, logs by route/tenant |
| 3. Communicate | Who needs to know now? | Team channel, a status note for support |
| 4. What changed? | Deploy? Config or secret change? Data migration? Third-party outage? Traffic spike? | Deploy history, provider status pages |
| 5. Mitigate | Fastest safe way to stop the damage? | Rollback, feature flag off, scale up, block a bad client |
| 6. Root cause | Why exactly did it break? | Request ID → logs, stack trace, reproduce locally |
| 7. Fix and verify | Does the fix work in production? | Deploy, watch error rate drop |
| 8. Postmortem | How did it get through? What stops it next time? | Write-up, test, alert, guard |

**Mitigation options:**
- **Rollback** the last deploy. This is usually the fastest and safest.
- **Feature flag off** for the new feature.
- **Scale up** or restart if it's load or memory related.
- **Rate-limit or block** one abusive client.
- **Queue and retry later** if a third-party API is down.

**Root cause, not the first cause.** "The code read `undefined.email`" is the first cause. The root cause might be "the frontend stopped sending `candidate` after a form change, and no test or validation caught it". The fix then includes **request validation** and a **test**.

**Postmortem template (blameless):**
- Summary and impact (who, how many, how long).
- Timeline (detected → mitigated → resolved).
- Root cause and contributing factors.
- What went well, and what went badly.
- Action items with owners: a test, an alert, validation, a runbook update.

For specific symptoms, see the [Debugging Scenarios](topic:debugging/how-to-answer) stack, for example [intermittent 500 errors](topic:debugging/intermittent-500s) and [a slow endpoint](topic:debugging/slow-endpoint).

## 🎯 Why do we use it?

- **Less damage.** A clear process gets users working again faster.
- **Less panic.** Everyone knows the next step, so nobody makes random changes in production.
- **Real fixes.** The root cause gets fixed, not just the symptom.
- **Fewer repeats.** The postmortem adds tests and alerts, so the same incident doesn't come back.

## ⚠️ Common mistakes

- **Debugging live for an hour instead of rolling back.** Stop the damage first.
- **Changing many things at once.** Then you don't know which change fixed it, or what broke something else.
- **Silence.** Not telling the team or support what is happening.
- **No postmortem.** The same incident happens again next month.
- **Blaming a person.** People start hiding mistakes, and the system never improves.

## 🗣️ How to answer in an interview

> "First I confirm the symptom and the impact: which route, which users or tenants, and how many. I tell the team early, even if I only know 'investigating'. Then I ask what changed recently: a deploy, a config or secret change, a migration, or a third-party outage.
>
> If a deploy lines up with the errors, I roll back first to stop the damage, and investigate calmly after. To find the root cause, I use the error tracker and the logs, filtered by route and time, and follow one failing request by its request ID. After the fix, I watch the error rate go back to normal, and write a short blameless postmortem with follow-ups, like a test, validation or a new alert."

You supported production services at SkillKeepr. [FILL IN: one real incident — symptom → how logs or the error tracker found it → root cause → fix → what you changed so it doesn't repeat.]

## 🔁 Follow-up questions

### When should you NOT roll back?

When the deploy included a database migration that can't be reversed, or when the problem isn't caused by the deploy (for example, a third-party outage). Then use a feature flag, a quick fix forward, or another mitigation.

### What is a feature flag?

A switch that turns a feature on or off without a new deploy. During an incident, turning the new feature off can stop the damage in seconds.

### What do you include in the update message to the team?

What's broken, who is affected, what you're doing now, and when you'll update next. Short and factual.

### How do you prevent the same incident next time?

Add a test that reproduces it, validation to block bad input, an alert that would have caught it earlier, and update the runbook.

## ✅ Quick check

### 1. Errors start 30 seconds after a deploy, on one route only. What is the best first move?

:::answer
**Roll back the deploy** (or turn off the new feature with a flag). Stop the damage first, then find the root cause calmly.
:::

### 2. Put these in order: root-cause fix, mitigate, assess impact, postmortem.

:::answer
**Assess impact → mitigate → root-cause fix → postmortem.**
:::

### 3. What does "blameless" mean in a postmortem?

:::answer
It focuses on how the system allowed the problem and how to prevent it, not on punishing the person who made the change.
:::
