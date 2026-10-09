---
title: "Queues and background jobs (BullMQ + Redis)"
stack: system-design
order: 12
level: Intermediate
mustKnow: true
askedFrequency: very common
summary:
  - A queue lets the API say "accepted" fast, while a worker does the slow job later.
  - Producers add jobs. Workers take jobs and do them. The queue sits in the middle and keeps the jobs safe.
  - Failed jobs are retried with backoff. Jobs that keep failing go to a dead-letter queue (DLQ) for a human to check.
  - Most queues deliver "at least once", so a job can run twice. Make every job idempotent.
  - Common tools are BullMQ (Node + Redis) and AWS SQS (managed, with FIFO queues and DLQs).
cards:
  - q: Why put work in a queue instead of doing it in the request?
    a: Slow work (emails, file parsing, AI calls) makes the user wait and can time out. A queue returns fast and lets workers do it in the background, at their own speed.
  - q: What is a dead-letter queue?
    a: A separate queue for jobs that failed too many times. They wait there so a person can look at them, fix the cause and retry.
  - q: What does "at-least-once delivery" mean for your code?
    a: The same job may be delivered more than once. The job must be idempotent — running it twice gives the same result as once.
  - q: When would you pick SQS over BullMQ?
    a: When you are on AWS and want a fully managed queue with no Redis to run. BullMQ is nice in Node apps that already use Redis and want features like delays and repeatable jobs.
  - q: What is a FIFO queue?
    a: A queue that keeps the order of messages inside a group and removes duplicates within a short window. SQS FIFO queues use a message group ID for ordering.
---

## 💡 What is it?

A **[queue](glossary:queue)** is a waiting line for jobs.

The API puts a job in the line and replies "accepted" right away. A separate **worker** takes jobs from the line and does the slow work later. This is called a **background job**.

## 🏠 Real-life example

Think of a **restaurant order counter**.

- The cashier takes your order and gives you a **token number**. You don't stand in the kitchen.
- Orders go on a **rail of tickets** in the kitchen.
- **Cooks** take the next ticket and cook it.
- If a dish fails (the oven breaks), the cook **tries again**.
- If it fails three times, the ticket goes to the **manager's tray** for a decision.
- If the same ticket was printed twice, the cook **checks the token number** and doesn't cook it twice.

Map it:
- **Cashier** = the API (the producer).
- **Ticket rail** = the queue.
- **Cooks** = workers.
- **Trying again** = retries.
- **Manager's tray** = the dead-letter queue.
- **Checking the token number** = idempotency.

## 🧑‍💻 Code example

A tiny in-memory queue with retries, a dead-letter queue and duplicate protection. Save as `queue.js` and run `node queue.js`.

```js
const queue = [];                                           // waiting jobs, first in first out
const deadLetter = [];                                      // jobs that failed too many times
const done = new Set();                                     // ids of jobs already finished (idempotency)
const MAX_ATTEMPTS = 3;                                     // try each job at most 3 times
let emailCalls = 0;                                         // count calls to the fake email service

function addJob(job) { queue.push({ ...job, attempts: 0 }); } // producer: put a job in line

async function sendEmail(job) {                             // the slow work a worker does
  emailCalls++;                                             // count this call
  if (job.to === 'bad@x.com') throw new Error('mailbox not found'); // this one always fails
  if (job.id === 'j2' && job.attempts === 1) throw new Error('timeout'); // j2 fails once, then works
}                                                           // end of sendEmail

async function worker() {                                   // consumer: takes jobs and runs them
  while (queue.length) {                                    // keep going while jobs are waiting
    const job = queue.shift();                              // take the oldest job
    if (done.has(job.id)) { console.log(job.id, 'skipped (already done)'); continue; } // duplicate → skip
    job.attempts++;                                         // count this try
    try {                                                   // try to do the work
      await sendEmail(job);                                 // do the slow work
      done.add(job.id);                                     // remember it is finished
      console.log(job.id, 'done on attempt', job.attempts); // success
    } catch (err) {                                         // the work failed
      if (job.attempts < MAX_ATTEMPTS) queue.push(job);     // retry later: back to the end of the line
      else { deadLetter.push(job); console.log(job.id, 'moved to dead-letter queue:', err.message); } // give up
    }                                                       // end of try/catch
  }                                                         // end of while
}                                                           // end of worker

addJob({ id: 'j1', to: 'meena@x.com' });                    // a normal job
addJob({ id: 'j2', to: 'ravi@x.com' });                     // a job that fails once
addJob({ id: 'j3', to: 'bad@x.com' });                      // a job that always fails
addJob({ id: 'j1', to: 'meena@x.com' });                    // the same job sent twice by mistake
worker().then(() => console.log('email calls:', emailCalls, '| dead letters:', deadLetter.length)); // summary
```

**Output:**

```text
j1 done on attempt 1
j1 skipped (already done)
j2 done on attempt 2
j3 moved to dead-letter queue: mailbox not found
email calls: 6 | dead letters: 1
```

A real queue keeps jobs in Redis or SQS, so they survive a crash. The ideas are the same.

## 🔍 Deeper version

**The flow:**

```text
API (producer) ──add job──► Queue (Redis / SQS) ──► Worker 1
      │                                       └──► Worker 2   ──fails 3×──► Dead-letter queue
      └─ replies 202 Accepted at once
```

**BullMQ (Node + Redis):**
- `new Queue('emails').add('reminder', data, { attempts: 3, backoff: { type: 'exponential', delay: 1000 } })` adds a job with retries.
- A `Worker` processes jobs with a `concurrency` setting (how many at once).
- It also supports **delayed jobs**, **repeatable (cron) jobs**, **priorities** and **rate limits**.
- A worker holds a **lock** on a job. If the worker dies, the job becomes "stalled" and runs again. So jobs must be idempotent.

**AWS SQS:**
- Fully managed, no server to run. Works well with Lambda (an SQS event triggers a function).
- **Visibility timeout:** while a worker processes a message, it is hidden. If not deleted in time, it appears again. Set it **longer** than the worker's maximum run time, or jobs run twice. See [background job runs twice](topic:debugging/background-job-twice).
- **Redrive policy:** after N receives, the message moves to a DLQ.
- **FIFO queues:** keep order inside a message group and remove duplicates within 5 minutes. Standard queues are faster but may reorder and duplicate.
- With Lambda, report **partial batch failures** so only the failed messages are retried.

**Delivery guarantees:**

| Guarantee | Meaning | Reality |
|---|---|---|
| At most once | may be lost, never repeated | rare; you lose data |
| At least once | never lost, may repeat | the common default |
| Exactly once | once, always | very hard; you fake it with idempotent consumers |

See [idempotent consumers](topic:architecture/idempotent-consumers).

**At SkillKeepr (public-safe):** heavy work like resume parsing and candidate scoring runs through SQS FIFO queues, so the API stays fast and slow external services are not flooded. [FILL IN: did you work on a queue worker? What did it do?]

## 🎯 Why do we use it?

- **Fast responses.** The user doesn't wait for slow work.
- **Smoothing spikes.** 5,000 resume uploads become a steady stream of work, not 5,000 requests at once.
- **Protecting partners.** Workers limit how fast you call rate-limited APIs.
- **Safe retries.** Failures are retried automatically, and nothing is lost.

## ⚠️ Common mistakes

- **Jobs that are not idempotent.** A retried "send payment" or "create candidate" runs twice.
- **Visibility timeout shorter than the job.** The same job runs on two workers.
- **No dead-letter queue.** Broken jobs retry forever or disappear silently.
- **Putting big files in the message.** Store the file in S3 and put only its key in the job.

## 🗣️ How to answer in an interview

> "When work is slow or can fail, like sending emails, parsing files or calling an AI model, I don't do it inside the request. The API adds a job to a queue and replies straight away. Workers take jobs and process them in the background.
>
> Failed jobs retry with exponential backoff. After a few attempts they go to a dead-letter queue so we can check them. Queues usually deliver at least once, so every job must be idempotent. I use a job ID or a unique key so running it twice does no harm.
>
> In Node I'd use BullMQ with Redis. On AWS I'd use SQS with a DLQ, and make sure the visibility timeout is longer than the job's run time."

## 🔁 Follow-up questions

### How do you make a job idempotent?

Give it a stable ID. Before doing the work, check if that ID is already done (a unique index in the database works well). Use upserts instead of inserts.

### How do you handle a job that must run at a certain time?

Use a delayed job (BullMQ `delay`), a scheduler like EventBridge, or a cron that adds jobs to the queue. See [notification system](topic:system-design/notification-system).

### How many workers should you run?

Enough to keep the queue short, but not so many that you overload the database or a rate-limited partner. Watch "age of oldest message" and scale on it.

### Queue vs pub/sub?

A queue gives each job to **one** worker. Pub/sub sends each message to **every** subscriber. Use a queue for work, pub/sub for events many parts care about. See [event-driven architecture](topic:architecture/event-driven).

## ✅ Quick check

### 1. In the code, why was `j1` skipped the second time?

:::answer
Its ID was already in the `done` set. The worker checks this before doing the work, so a duplicate job does nothing. That is idempotency.
:::

### 2. A job takes up to 8 minutes. The SQS visibility timeout is 5 minutes. What happens?

:::answer
After 5 minutes the message becomes visible again, and a second worker starts the same job. Set the visibility timeout above the longest run time.
:::

### 3. Which belongs in a job message: the 5 MB resume file, or its S3 key?

:::answer
**The S3 key.** Messages should be small. Workers read the file from storage using the key.
:::
