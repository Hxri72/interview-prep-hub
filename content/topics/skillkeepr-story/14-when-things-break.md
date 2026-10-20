---
template: chapter
title: When things break in production
stack: skillkeepr-story
order: 14
level: Intermediate
mustKnow: true
askedFrequency: very common
summary:
  - Problems are found through logs (AWS CloudWatch), error tracking and user reports.
  - "Use the same four steps every time: Detect → Debug → Fix → Prevent."
  - "Real story 1: the voice agent cut candidates off. I raised the end-of-turn wait from about 2–3 s to 5–7 s and checked it with test calls and logs."
  - "Real story 2: scoring in production didn't match the prototype. I traced the formulas, aligned production with the prototype, and checked it in CloudWatch logs."
  - Structured logs with a request ID let you follow one call or request from start to end.
cards:
  - q: What are the four steps for any production problem?
    a: Detect (confirm it's real), Debug (find the exact cause), Fix (change only what's broken), Prevent (logs, tests or alerts so it doesn't come back).
  - q: The voice agent interrupted candidates. What was the cause and the fix?
    a: It treated a short pause as the end of the candidate's turn. I raised the wait from about 2–3 seconds to 5–7 seconds, then tested with calls and checked the logs.
  - q: What was the scoring problem?
    a: Resume and candidate scores in production didn't match the prototype. The formulas for skills, experience and trust score were different, so I aligned production with the prototype's rules.
  - q: Why log a request ID on every line?
    a: Many requests run at once, so their log lines mix. The ID lets you filter one request's whole story.
  - q: How did you check the scoring fix?
    a: "I looked at the applied formula and the results in CloudWatch logs. [FILL IN: any automated test, only if you added one.]"
---

## 💡 What happens in this chapter

Something goes wrong for a real user. A call sounds rude, or a score looks wrong.

This chapter shows **how problems are found and fixed** on SkillKeepr, using two real stories from my work.

## 🏠 Real-life example

Think of a **doctor seeing a patient**.

- **The patient says "I feel sick"** = a user report or an alert. That's **Detect**.
- **Tests and scans** = reading logs and traces. That's **Debug**.
- **The right medicine** = a small, targeted code change. That's **Fix**.
- **Advice and check-ups** = tests, alerts and better logs. That's **Prevent**.

A good doctor doesn't give medicine before the tests. A good developer doesn't change code before finding the cause.

## 🗺️ The flow

```text
Detect
  user report / error-tracking alert / odd numbers in logs
        │
        ▼
Debug
  find one failing example → its request ID / call ID
  read its logs in CloudWatch, step by step
  compare with what *should* happen
        │
        ▼
Fix
  smallest change that removes the cause
  test with real or realistic cases
        │
        ▼
Prevent
  better logs, a test, or an alert for next time
```

**Story 1, the voice agent cutting candidates off:**

```text
Rahul pauses to think (2.5 s)
  → agent decides "turn over" after ~2–3 s of silence
  → agent starts speaking while Rahul is still thinking   ← the bug
Fix: wait ~5–7 s before treating silence as the end of the turn
Check: test calls + CloudWatch and voice-service logs
```

**Story 2, scoring not matching the prototype:**

```text
Same resume → prototype score  ≠  production score
  → trace the formula: technical skills, experience, trust score
  → production used different rules from the prototype
Fix: align production with the prototype (it held the intended business rules)
Check: applied formula and results in CloudWatch logs
```

## 🧱 Tech used

| Piece | Technology | Learn it here |
|---|---|---|
| Method | Detect → Debug → Fix → Prevent | [How to answer any debugging question](topic:debugging/how-to-answer) |
| Logs | AWS CloudWatch, structured logs | [Logging](topic:testing/logging), [Monitoring and alerts](topic:devops/monitoring-alerts) |
| Error alerts | Error-tracking tool [FILL IN: name] | [Error tracking](topic:testing/error-tracking) |
| Live incident steps | Triage, fix, post-mortem | [Handling a live incident](topic:testing/production-incidents) |
| Voice turn-taking | Speech pipeline timing | [Voice AI](topic:ai/voice-ai), [Voice state machine](topic:resume/voice-state-machine) |
| Comparing two versions | Gap analysis | [Gap analysis and ADRs](topic:architecture/gap-analysis-adrs) |

## 🧑‍💻 Key code idea

Structured logs with a request ID, then filtering one call's story. This is how you find one bad call among many. Save as `logger.js`, run `node logger.js`.

```js
// logger.js — structured logs with a request ID, then find one request's story
const { randomUUID } = require('node:crypto');                 // built-in random ID maker
const lines = [];                                              // pretend log store (stands in for CloudWatch)
function log(requestId, level, msg, extra = {}) {              // one log line = one JSON object
  lines.push(JSON.stringify({ requestId, level, msg, ...extra })); // keep it as text, like a real log
}                                                              // end of log
const a = randomUUID().slice(0, 8);                            // short request ID for call A
const b = randomUUID().slice(0, 8);                            // short request ID for call B
log(a, 'info', 'call started', { candidate: 'Rahul' });        // call A begins
log(b, 'info', 'call started', { candidate: 'Meena' });        // call B begins at the same time
log(a, 'info', 'silence detected', { pauseMs: 2500 });         // A: the candidate paused for 2.5 s
log(a, 'warn', 'agent spoke during candidate turn');           // A: the bug we are hunting
log(b, 'info', 'call finished');                               // B: a normal call
const story = lines.map((l) => JSON.parse(l)).filter((l) => l.requestId === a); // keep only call A
for (const l of story) console.log(l.level.padEnd(4), l.msg, l.pauseMs ?? ''); // print A's steps
console.log('Total lines:', lines.length, '| lines for call A:', story.length);  // filter result
```

```text
info call started 
info silence detected 2500
warn agent spoke during candidate turn 
Total lines: 5 | lines for call A: 3
```

In CloudWatch you do the same filter with a query on the request or call ID.

## 🧗 Hard parts and trade-offs

- **Turn-taking is a balance.** A short wait interrupts slow thinkers. A long wait makes the agent feel slow. Raising it to 5–7 s fixed the interruptions, at the cost of a slightly slower reply.
- **Calls that connect but stay silent.** No error was thrown, so nothing alerted. Only the logs showed where the call stopped. [FILL IN: what you found as the cause, if you know it.]
- **Which version is "right"?** For scoring, the prototype and production disagreed. The team decided the prototype held the intended business rules, so production was aligned to it.
- **Proof.** Checking logs shows the fix worked for the cases you looked at. An automated test would guard it for the future. [FILL IN: whether you added one.]

## 🙋 My part

- **Voice agent:** I saw that the agent took a short pause as the end of the candidate's turn and interrupted. I raised the wait from about **2–3 seconds to 5–7 seconds**, tested with calls, and checked AWS CloudWatch and the voice-service logs.
- I also traced calls that **connected but where the agent didn't respond**, using the logs. [FILL IN: the cause and fix.]
- **Scoring:** my tech lead asked me to find why resume and candidate scores differed between the **prototype and production**. I traced the logic (technical skills, experience, trust score), found the formulas were different, aligned production with the prototype, and checked the applied formula in **CloudWatch logs**.
- I investigated how the **Trust Score** is calculated, but I did **not** fix a Trust Score issue.

## 🗣️ How to explain it in an interview

> "When something breaks, I use four steps: detect, debug, fix, prevent.
>
> A real example is our AI voice agent. It was interrupting candidates: it treated a short pause as the end of their turn. So I raised the end-of-turn wait from about two or three seconds to five to seven seconds. I tested it with real calls and checked CloudWatch and the service logs. It's a trade-off: the agent replies a bit later, but it stops cutting people off.
>
> Another one: resume scores in production didn't match the prototype. I traced the formula for skills, experience and trust score, found the two were different, and aligned production with the prototype, because that held the agreed business rules. Then I checked the applied formula in CloudWatch logs. [FILL IN: how you'd prevent it next time — for example a test with fixed sample resumes.]"

## 🔁 Follow-up questions

### How did you know the interruption fix worked?

I made test calls with natural pauses and checked the logs for the agent speaking during a candidate's turn. [FILL IN: any numbers or feedback you have.]

### Why not make the wait even longer?

Long silences make the call feel slow and robotic. 5–7 seconds was the balance we chose after testing.

### How would you stop the scoring bug from coming back?

Keep one shared scoring function used by both, and add tests with fixed sample resumes and expected scores. Then any formula change shows up as a failing test.

### What if logs don't show enough?

Add structured logs at each step with the request or call ID, deploy, and reproduce the problem. Better logs are often the first fix.

### What do you never log?

Passwords, tokens, API keys and personal data like full candidate details. See [logging](topic:testing/logging).

## 📚 Topics to revise

- [How to answer any debugging question](topic:debugging/how-to-answer)
- [Handling a live incident](topic:testing/production-incidents)
- [Logging](topic:testing/logging)
- [Monitoring and alerts](topic:devops/monitoring-alerts)
- [Resume: voice agent](topic:resume/voice-agent-microservice)
- [Resume: gap analysis](topic:resume/gap-analysis)
