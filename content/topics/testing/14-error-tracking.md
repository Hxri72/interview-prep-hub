---
title: Error tracking and monitoring tools
stack: testing
order: 14
level: Intermediate
mustKnow: false
askedFrequency: common
summary:
  - "Error tracking tools (like Sentry) catch every crash, group the same errors into one \"issue\", and alert you with the stack and context."
  - Monitoring watches numbers over time — error rate, response time, CPU, memory — and alerts when they cross a limit.
  - Logs tell you the details, metrics tell you something is wrong, error tracking tells you which bug and how often.
  - Good alerts are few and actionable. Too many alerts and people start ignoring them.
  - Upload source maps so minified frontend stack traces point to your real code.
cards:
  - q: What does an error tracking tool do?
    a: It catches errors automatically, groups identical ones into one issue with a count, shows the stack and context (user, route, release) and sends alerts.
  - q: What is the difference between error tracking and monitoring?
    a: Error tracking is about individual bugs and their stack traces. Monitoring is about numbers over time, like error rate, latency and CPU.
  - q: What is a fingerprint in error tracking?
    a: A key made from the error type, message and code location. Errors with the same fingerprint are grouped as one issue.
  - q: Why do you need source maps for the frontend?
    a: Production JavaScript is minified, so stack traces show unreadable names. Source maps translate them back to your original files and lines.
  - q: What makes a good alert?
    a: It is rare, means real user impact, and tells the on-call person what to do — e.g. "5xx rate above 2% for 5 minutes".
---

## 💡 What is it?

**Error tracking** tools catch errors from your app automatically. Popular ones are Sentry, Datadog, New Relic and Rollbar.

They **group** the same error into one "issue", **count** how often it happens, and show the **stack trace** and **context**: which user, which route, which release.

**Monitoring** watches **numbers** over time, like error rate, response time, CPU and memory. It sends an **alert** when a number crosses a limit.

## 🏠 Real-life example

Think of a **school nurse's room**.

- **Each student who comes in hurt** = one error.
- **The nurse's chart: "12 students hurt their knee on the same broken step"** = one grouped issue with a count.
- **Name, class and time on each record** = the context (user, route, release).
- **The headteacher getting a call only when 5 students are hurt in one hour** = an alert with a threshold.
- **The daily attendance and temperature chart** = monitoring metrics.
- **Fixing the broken step** = fixing the bug. The count stops growing.

## 🧑‍💻 Code example

This is a tiny "Sentry-like" tracker, so you can see the idea without an account. Save as `tracker.js` and run `node tracker.js`.

```js
const issues = new Map();                                   // fingerprint → { count, first error } (like a tiny Sentry)

function captureException(err, context = {}) {              // call this whenever something fails
  const firstFrame = err.stack.split('\n')[1].trim();       // the line of code where it broke
  const fingerprint = `${err.name}: ${err.message} @ ${firstFrame}`; // same message + same place = same issue
  const issue = issues.get(fingerprint) ?? { count: 0, sample: context }; // new issue starts at 0
  issue.count += 1;                                         // count every time it happens
  issues.set(fingerprint, issue);                           // save it back
  if (issue.count === 1) console.log('🔔 NEW issue:', err.message, context); // alert only the first time
}                                                           // end of captureException

function getCandidate(id) {                                 // a buggy function
  const db = { c1: { name: 'Asha' } };                      // pretend database with one candidate
  return db[id].name.toUpperCase();                         // crashes when the id does not exist
}                                                           // end of getCandidate

for (const id of ['c1', 'c9', 'c9', 'c9']) {                // four requests; three use a missing id
  try {                                                     // run the request
    getCandidate(id);                                       // may throw
  } catch (err) {                                           // if it fails…
    captureException(err, { candidateId: id, route: 'GET /candidates/:id' }); // send to the tracker
  }                                                         // end of try/catch
}                                                           // end of the loop

for (const [key, issue] of issues) {                        // the "dashboard": one row per issue
  console.log(`${issue.count}× ${key.split(' @ ')[0]}`);    // how often it happened
}                                                           // end of the dashboard loop
```

**Output (real run):**

```text
🔔 NEW issue: Cannot read properties of undefined (reading 'name') { candidateId: 'c9', route: 'GET /candidates/:id' }
3× TypeError: Cannot read properties of undefined (reading 'name')
```

Three crashes became **one issue** with a **count of 3**, and only **one alert** was sent. That grouping is exactly what real tools do, at a much bigger scale.

## 🔍 Deeper version

**Logs vs metrics vs error tracking vs traces:**

| Tool type | Answers | Example |
|---|---|---|
| Logs | What exactly happened in this request? | JSON lines with a request ID |
| Metrics | Is something wrong right now? | 5xx rate, p95 latency, CPU, memory |
| Error tracking | Which bug, how often, since which release? | Sentry issue with stack and users affected |
| Traces | Where did the time go across services? | API → DB → Stripe, with timings |

**A real Sentry setup in Node** (not run here, because it needs an account and a DSN key):

```js
const Sentry = require('@sentry/node');         // the official Node SDK
Sentry.init({                                   // start it once, before the rest of the app
  dsn: process.env.SENTRY_DSN,                  // your project key, from an environment variable
  environment: process.env.NODE_ENV,            // "production", "staging"…
  release: process.env.APP_VERSION,             // so you can see "started in v2.4.0"
  tracesSampleRate: 0.1,                        // record timings for 10% of requests
});                                             // end of init
```

With Express you also add Sentry's error handler, so every unhandled route error is reported.

**What makes it useful:**
- **Releases.** Tag every error with the app version. You'll see "this issue started right after v2.4.0".
- **Context.** Attach the user ID or tenant ID (an id, not personal details), route and request ID.
- **Source maps.** Upload them for the frontend, so minified traces show real file names and lines.
- **Scrubbing.** Remove passwords, tokens and personal data before sending, the same as with logs.

**Good alerts:**
- Alert on **user impact**, like the 5xx rate or failed payments, not on every single error.
- Use a **window**: "error rate above 2% for 5 minutes", not "one 500 happened".
- Every alert should have an **owner** and a clear **next step** (a runbook).
- Too many noisy alerts cause **alert fatigue**, and people start ignoring real ones.

**On AWS**, CloudWatch gives metrics (Lambda errors, duration, throttles), log queries with Logs Insights, and CloudWatch Alarms that can notify Slack or email.

## 🎯 Why do we use it?

- **Know before users complain.** An alert arrives within minutes, not when a customer emails.
- **Prioritise.** An issue hitting 2,000 users matters more than one hitting 2.
- **Fix faster.** The stack, context and release are already collected.
- **Check a fix.** After the deploy, the issue count stops growing.

## ⚠️ Common mistakes

- **Catching errors and hiding them.** `catch (e) {}` means the tracker never sees the error.
- **No source maps.** Frontend errors show `a.b is not a function at main.3f9c.js:1:48213`, which nobody can read.
- **Too many alerts.** People mute the channel, and then miss the real outage.
- **Sending secrets or personal data** to a third-party tool without scrubbing.

## 🗣️ How to answer in an interview

> "I separate three things. Logs give the details of one request. Metrics, like error rate and p95 latency, tell me something is wrong right now. An error tracking tool like Sentry catches every unhandled error, groups identical ones into one issue with a count, and shows the stack, the route, the user or tenant ID and the release it started in.
>
> I tag errors with the release and upload source maps for the frontend. I scrub secrets before anything leaves the app. For alerts, I prefer a few meaningful ones, like the 5xx rate staying high for five minutes, with a clear owner, instead of a ping for every single error."

The resume says you supported production with logging and error tracking. [FILL IN: which error tracking or monitoring tool you used at SkillKeepr, and one issue it helped you find.]

## 🔁 Follow-up questions

### How does a tool decide two errors are "the same"?

It builds a **fingerprint** from the error type, message and the top frames of the stack. Same fingerprint, same issue. You can customise it when grouping is too broad or too narrow.

### What is p95 latency, and why not use the average?

p95 is the time that 95% of requests are faster than. The average hides slow requests. p95 shows what your slower users actually feel.

### How do you avoid alert fatigue?

Alert only on user impact, use time windows and thresholds, group duplicates, and delete alerts nobody acts on.

### What are source maps?

Files that map minified production code back to the original source. Upload them to the error tracker (not to the public website) so stack traces are readable.

## ✅ Quick check

### 1. In the example, why is "🔔 NEW issue" printed only once, even though there were three errors?

:::answer
All three errors have the same fingerprint (same type, message and code line). The first one creates the issue and alerts. The next two only increase the count.
:::

### 2. Which tells you "error rate jumped from 0.1% to 6% in the last 10 minutes"?

- A) A single log line
- B) A metric with an alert
- C) A source map

:::answer
**B.** Rates over time are metrics, and an alert fires when they cross a threshold.
:::

### 3. Why tag every error with the release version?

:::answer
So you can see which deploy introduced a bug, and confirm that a later release fixed it.
:::
