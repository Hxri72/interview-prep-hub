---
title: A background job runs twice or never finishes
template: scenario
stack: debugging
order: 31
level: Advanced
mustKnow: false
askedFrequency: sometimes
summary:
  - Most queues deliver "at least once", so a job CAN run twice. Your job code must be safe to run twice (idempotent).
  - "A classic cause in SQS: the visibility timeout is shorter than the time the job takes, so the message comes back while the first worker is still busy."
  - Jobs that "never finish" usually have no timeout, are stuck waiting on an outside service, or failed silently with no retry limit.
  - Fix with idempotent logic (a unique key or a status check), timeouts, a retry limit and a dead-letter queue (DLQ).
  - With BullMQ, workers hold a lock on the job; long CPU work can lose the lock and the job is marked stalled and run again.
cards:
  - q: Why can a queue job run twice?
    a: Most queues guarantee "at least once" delivery. If a worker is slow, crashes, or doesn't confirm in time, the message is given to another worker.
  - q: What is the SQS visibility timeout?
    a: The time a message stays hidden after a worker takes it. If the worker doesn't delete it in time, it becomes visible again and another worker can take it.
  - q: What does "idempotent job" mean?
    a: Running it twice gives the same result as running it once — for example, it checks "already processed?" or uses a unique key before doing the work.
  - q: What is a dead-letter queue (DLQ)?
    a: A separate queue where messages go after failing too many times, so they stop blocking the main queue and a person can look at them.
  - q: A job is stuck as "processing" forever. What do you check?
    a: Whether the worker crashed mid-job, whether an outside call has no timeout, and whether there is any job timeout or cleanup for stuck jobs.
---

## 💡 What is it?

You have **background jobs**: work that runs later, outside the user's request. For example: parsing uploaded resumes, sending emails, or syncing candidates from an ATS.

Two kinds of bugs show up:
1. **A job runs twice.** A candidate is created twice, or an email is sent twice.
2. **A job never finishes.** It stays "processing" forever, or silently disappears.

Both are common with **queues** like Amazon SQS or BullMQ (a Node.js queue that uses Redis).

## 🏠 Real-life example

Think of a **school office with a tray of letters to post**.

A helper takes a letter from the tray. The rule is: "If you don't come back in **10 minutes**, we assume you lost it, and put a copy back in the tray."

One day, the post office queue is long. The helper takes **15 minutes**. Meanwhile, the copy goes back in the tray, and **a second helper posts the same letter**. The parent gets two letters.

Another day, a helper goes out and **never comes back**. Nobody checks, so the letter is never posted.

- **The tray** = the queue.
- **A letter** = a job (a message).
- **The helpers** = workers.
- **"Back in 10 minutes or we put a copy back"** = the **visibility timeout** (SQS) or the **lock** (BullMQ).
- **Checking a register "already posted?"** before posting = an **idempotent** job.
- **A "problem letters" box** after 3 failed tries = a **dead-letter queue**.

## 🔎 Detect

- **Duplicates in the database:** the same candidate or payment record twice, with the same source data.
- **Users report** two emails or two notifications.
- **Logs show the same job id or message id** processed by two workers, a few minutes apart.
- **Stuck jobs:** records sitting in a status like `PROCESSING` for hours.
- **Queue metrics:** the age of the oldest message keeps growing, or the DLQ starts filling up.

## 🐞 Debug

1. **Find one duplicate** and look up its job id in the logs. Did two workers handle it? At what times?
2. **Compare two numbers:**
   - how long the job **really takes** (look at the slowest runs, not the average), and
   - the queue's **visibility timeout** (SQS) or **lock duration** (BullMQ).

   If the job can take longer than the timeout, the message comes back while the first worker is still busy.
3. **Check if the job confirms success.** In SQS, the worker must delete the message (Lambda does this for you when the function succeeds). Is an error swallowed somewhere?
4. **For stuck jobs:** did the worker crash or get killed mid-job? Is an outside call missing a timeout? Is there a retry limit?
5. **In BullMQ:** look for "stalled" jobs. Long synchronous work can block the [event loop](glossary:event-loop), so the worker can't renew its lock.

## 🔧 Fix

**Before:** the job is not safe to run twice, and the timeouts don't match.

```js
// ❌ BEFORE — runs twice → two candidates; no timeout → can hang forever
async function processResume(msg) {                                 // a worker handles one queue message
  const data = await parseResume(msg.fileKey);                      // call the parser (no timeout!)
  await Candidate.create({ email: data.email, name: data.name });   // a second run creates a duplicate
}                                                                   // end of processResume
// queue visibility timeout: 5 minutes, but parsing sometimes takes 8 minutes
```

**After:** idempotent, with a timeout, a retry limit and a DLQ.

```js
// ✅ AFTER — safe to run twice, can't hang, and gives up cleanly
async function processResume(msg) {                                 // a worker handles one queue message
  const job = await Job.findOneAndUpdate(                           // claim the job atomically
    { _id: msg.jobId, status: { $in: ['QUEUED', 'FAILED'] } },      // only if nobody finished or holds it
    { $set: { status: 'PROCESSING', startedAt: new Date() } },      // mark it as ours
    { returnDocument: 'after' },                                    // return the updated document
  );                                                                // end of findOneAndUpdate
  if (!job) return;                                                 // already done or in progress → skip quietly

  const data = await withTimeout(parseResume(msg.fileKey), 120_000); // give up after 120 seconds
  await Candidate.updateOne(                                        // upsert instead of create
    { email: data.email },                                          // the unique key: one candidate per email
    { $setOnInsert: { name: data.name, email: data.email } },       // only set fields if it's a new candidate
    { upsert: true },                                               // create it if it doesn't exist yet
  );                                                                // end of updateOne
  await Job.updateOne({ _id: job._id }, { $set: { status: 'DONE' } }); // mark the job finished
}                                                                   // end of processResume

function withTimeout(promise, ms) {                                 // helper: reject if a promise is too slow
  return Promise.race([                                             // whichever settles first wins
    promise,                                                        // the real work
    new Promise((_, reject) => setTimeout(() => reject(new Error('Job timed out')), ms)), // the timer
  ]);                                                               // end of Promise.race
}                                                                   // end of withTimeout
```

Plus a unique index, so the database itself blocks duplicates:

```js
candidateSchema.index({ email: 1 }, { unique: true });              // a second insert with the same email fails (E11000)
```

**And match the queue settings to the job:**

```text
SQS visibility timeout   >  the longest job time        (AWS suggests 6× the Lambda timeout for Lambda workers)
maxReceiveCount = 3      →  after 3 failed tries, move the message to a dead-letter queue (DLQ)
A cleanup job (cron)     →  marks jobs stuck in PROCESSING for too long as FAILED, so they can retry
```

For BullMQ, set `attempts` and `backoff` when adding the job, and keep CPU-heavy work out of the worker's main thread so it can renew its lock.

:::note
"At least once" is normal. Even with perfect settings, a crash at the wrong moment can repeat a job. That's why the job itself must be idempotent — settings only make duplicates rarer.
:::

## 🛡️ Prevent

- **Every job is idempotent.** Use a unique key, an upsert, or an atomic "claim" step. See [idempotency keys](topic:rest-auth/idempotency-keys).
- **Timeouts on every outside call** inside jobs. See [a third-party API is down](topic:debugging/third-party-api-down).
- **Queue timeouts longer than the slowest job**, checked whenever job code changes.
- **A retry limit and a DLQ,** plus an alert when the DLQ is not empty.
- **A cleanup cron** for jobs stuck in a "processing" status.
- **Dashboards:** queue length, age of the oldest message, failures per hour.

## 🗣️ How to answer in an interview

**Short version (20 seconds):**

> "Queues usually deliver at least once, so jobs must be idempotent — a unique key, an upsert, or an atomic claim. Duplicates often come from a visibility timeout shorter than the job, so I set it above the slowest run. For jobs that never finish, I add timeouts, a retry limit, a dead-letter queue, and a cron that resets stuck jobs."

**Full version:**

> "First I find one duplicate and trace its job id in the logs. If two workers handled it minutes apart, the message came back while the first worker was still busy. In SQS that means the visibility timeout is shorter than the slowest job. In BullMQ, the worker lost its lock, often because CPU work blocked the event loop.
>
> I fix the root cause by setting the timeout above the slowest job. But I also make the job idempotent, because 'at least once' is how these queues work: the job first claims itself with an atomic update, and writes use an upsert on a unique key like email, backed by a unique index.
>
> For jobs that never finish, I add a timeout to every outside call, a retry limit with backoff, and a dead-letter queue with an alert. A small cron marks jobs stuck in 'processing' as failed, so they can be retried or checked by a person."

[FILL IN: a real duplicate or stuck job you saw — for example in resume parsing or ATS candidate sync — and what you changed. Only if true.]

## 🔁 Follow-up questions

### Doesn't SQS FIFO give "exactly once"?

FIFO queues remove duplicate **sends** within a 5-minute window and keep order inside a group. But processing can still repeat if a worker doesn't finish in time. So the job should still be idempotent.

### What's the difference between a retry and a DLQ?

Retries try the same job again, usually with a delay. After too many failed tries, the message moves to the DLQ, so it stops blocking the queue and someone can inspect it.

### How does a unique index help if the code already checks "exists?" first?

Two workers can both check "not exists" at the same moment, then both insert — a [race condition](glossary:race-condition). The unique index makes the database reject the second insert, whatever the timing.

### Why can a long CPU task make a BullMQ job run twice?

The worker renews its lock using timers on the event loop. If CPU work blocks the loop for too long, the lock expires, BullMQ marks the job "stalled", and another worker picks it up.

## ✅ Quick check

### 1. A job takes up to 8 minutes. The SQS visibility timeout is 5 minutes. What happens?

:::answer
After 5 minutes, the message becomes visible again and **another worker can take it**, while the first is still working. The job runs twice. Set the timeout above 8 minutes, and make the job idempotent anyway.
:::

### 2. Which write is safe to run twice?

- A) `Candidate.create({ email, name })`
- B) `Candidate.updateOne({ email }, { $setOnInsert: { email, name } }, { upsert: true })`

:::answer
**B.** The upsert creates the candidate only if that email doesn't exist yet. Running it twice still leaves one candidate. A creates a duplicate (or an error, if there's a unique index).
:::

### 3. What does `maxReceiveCount = 3` do with a DLQ?

:::answer
After a message has been received (tried) 3 times without success, SQS moves it to the dead-letter queue instead of retrying forever.
:::
