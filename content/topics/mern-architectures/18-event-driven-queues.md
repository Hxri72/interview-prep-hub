---
title: Event-driven backend with queues
stack: mern-architectures
order: 18
level: Intermediate
mustKnow: false
askedFrequency: common
template: pattern
section: Backend structure
summary:
  - "In an event-driven MERN backend, the API does the quick part, puts a message on a queue and replies at once. Workers do the slow part in the background."
  - Use it for slow or unreliable work like emails, resume parsing, PDF making, webhooks to other systems and AI calls.
  - The API often replies 202 Accepted with a job ID. React then polls, or gets a push (SSE/WebSocket) when the job is done.
  - "Queues deliver at least once, so workers must be idempotent: running the same message twice must not do the work twice."
  - "Tools: BullMQ + Redis for a Node server; on AWS - SQS, EventBridge (events and schedules), Step Functions (workflows) and AWS Batch (heavy jobs)."
cards:
  - q: Why put work on a queue instead of doing it in the API request?
    a: "The API replies fast, slow work can't time out the request, and failed jobs can be retried without the user waiting."
  - q: What status code fits "job accepted, will finish later"?
    a: 202 Accepted, usually with a job ID the client can use to check progress.
  - q: What does "at-least-once delivery" mean for a worker?
    a: A message can arrive more than once, so the worker must be idempotent and not repeat side effects like sending the same email twice.
  - q: What is a dead-letter queue?
    a: A separate queue where messages go after failing too many times, so you can inspect and replay them instead of losing them.
---

## 💡 What is it?

Some backend work is **slow**: sending emails, parsing resumes or calling an AI model. If the Express route does all of it, the user waits, and the request may time out.

In an **event-driven** backend, the API does only the quick part. It saves the data and drops a message on a **[queue](glossary:queue)**: "please parse resume 42". Then it replies at once.

Separate programs called **workers** read the queue and do the slow work in the background.

## 🏠 Real-life example

Think of **a busy dosa shop**.

The cashier takes your order and money, gives you a **token number** and says "please wait". The cashier doesn't cook. Your order slip goes on a spike at the kitchen. The cooks take slips one by one. When your dosa is ready, they call your token number.

- **The cashier** = the Express API route. It's quick and doesn't do the slow work.
- **The order slip on the spike** = a message on the queue.
- **The token number** = the job ID in a `202 Accepted` reply.
- **The cooks** = workers. Add more cooks on busy days to scale.
- **Calling your token** = notifying React (polling, SSE or WebSocket).
- **A slip that falls and is picked up twice** = a duplicate message. A good cook checks "did I already make token 42?" That check is idempotency.
- **A slip for a dish they can't make, put aside for the manager** = the dead-letter queue.

## 🗺️ The diagram

```text
  React ── POST /api/resumes ──► Express API
                                    │ 1. save file info in MongoDB (status: "queued")
                                    │ 2. add message { resumeId: 42 } to the queue
                                    │ 3. reply 202 { jobId: 42 }  ◄── fast, under 100 ms
                                    ▼
                           ┌──────────────────┐
                           │      QUEUE       │   BullMQ + Redis, or AWS SQS
                           └───┬──────────┬───┘
                               ▼          ▼
                          ┌────────┐ ┌────────┐     workers (scale by adding more)
                          │worker 1│ │worker 2│
                          └───┬────┘ └───┬────┘
                              │ parse, call AI, update MongoDB (status: "done")
                              ▼
                           MongoDB ───► React learns "done" by polling GET /api/resumes/42
                                        or by a push (SSE / WebSocket)

      failed 3 times? ──► dead-letter queue (inspect, fix, replay)
```

## 🧑‍💻 Code example

An API that queues a welcome email, and a worker that sends it. It uses **BullMQ**, a popular Node queue library that stores jobs in **Redis** (a fast in-memory database).

Set up (Docker starts Redis on port 6379):

```bash
docker run -d -p 6379:6379 redis:7
npm init -y
npm install express bullmq
```

Save this as `api.js` and run `node api.js`:

```js
const express = require('express');                                       // load Express
const { Queue } = require('bullmq');                                       // the BullMQ queue (producer side)

const connection = { host: 'localhost', port: 6379 };                      // where Redis runs; 6379 = Redis default port
const emailQueue = new Queue('emails', { connection });                    // a queue named "emails"

const app = express();                                                     // create the app
app.use(express.json());                                                   // read JSON bodies
app.post('/api/signup', async (req, res) => {                              // route: sign up
  const { email } = req.body;                                              // the new user's email
  // ...save the user in MongoDB here (fast)...
  const job = await emailQueue.add('welcome', { email }, {                 // put a message on the queue
    jobId: `welcome-${email}`,                                             // same ID twice = added only once (no duplicates)
    attempts: 3,                                                           // 3 = retry up to 3 times if it fails
    backoff: { type: 'exponential', delay: 1000 },                         // wait 1 s, then 2 s, then 4 s between tries
  });                                                                      // end of add
  res.status(202).json({ jobId: job.id });                                 // 202 = accepted, will finish later
});                                                                        // end of route
app.listen(3000, () => console.log('API on 3000'));                        // start on port 3000
```

Save this as `worker.js` and run `node worker.js` in a second terminal:

```js
const { Worker } = require('bullmq');                                      // the BullMQ worker (consumer side)

const connection = { host: 'localhost', port: 6379 };                      // same Redis as the API
const sent = new Set();                                                    // demo only; in real life store "sent" in MongoDB

const worker = new Worker('emails', async (job) => {                       // read jobs from the "emails" queue
  const { email } = job.data;                                              // the message the API added
  if (sent.has(email)) return 'already sent';                              // idempotent: skip if done before
  await new Promise((r) => setTimeout(r, 2000));                           // pretend sending takes 2000 ms (2 s)
  sent.add(email);                                                         // remember it is done
  console.log(`📧 welcome email sent to ${email}`);                        // show the result
  return 'sent';                                                           // saved as the job's return value
}, { connection, concurrency: 5 });                                        // 5 = handle up to 5 jobs at the same time

worker.on('failed', (job, err) => console.error(`job ${job.id} failed: ${err.message}`)); // log failures
```

```text
$ curl -X POST -H "Content-Type: application/json" -d '{"email":"asha@example.com"}' localhost:3000/api/signup
{"jobId":"welcome-asha@example.com"}          ← returns at once

Worker terminal (2 seconds later):
📧 welcome email sent to asha@example.com
```

## 🔍 Deeper version

The general ideas are in [event-driven architecture](topic:architecture/event-driven), [queues and background jobs](topic:system-design/queues-background-jobs) and [idempotent consumers](topic:architecture/idempotent-consumers).

**Commands vs events.**
- A **command** says "do this": `parseResume { id: 42 }`. One worker handles it. Use a queue.
- An **event** says "this happened": `candidate.created`. Many listeners may react: email, search index, analytics. Use pub/sub (one message, many subscribers), like SNS or EventBridge.

**Tools in a MERN app:**

| Need | On your own Node server | On AWS (serverless) |
|---|---|---|
| Job queue | BullMQ + Redis | SQS + a worker Lambda |
| One event, many listeners | Redis pub/sub, RabbitMQ, Kafka | SNS, EventBridge |
| Scheduled jobs (cron) | BullMQ repeatable jobs, node-cron | EventBridge schedules |
| Multi-step workflow with retries | Chained jobs ("flows") | Step Functions |
| Long, heavy jobs | A separate worker server | AWS Batch, ECS tasks |

**Reliability rules:**
- **At-least-once delivery.** SQS and BullMQ can deliver a message twice. Make workers **idempotent**: check a status field or use a unique key before doing side effects.
- **Retries with backoff.** Wait longer between each try.
- **Dead-letter queue (DLQ).** After N failures, move the message aside so it doesn't block the queue. Set an alarm on it.
- **Visibility timeout (SQS).** While a worker handles a message, SQS hides it from other workers. If the worker crashes, the message comes back. Set the timeout longer than the job takes.

**Telling React the job is done:**
1. **Polling:** React calls `GET /api/jobs/42` every few seconds. Simple and works everywhere.
2. **SSE or WebSocket push:** the server tells the browser when the status changes. See [real-time options](topic:mern-architectures/realtime-options).

**The outbox pattern.** What if you save to MongoDB, then crash before adding the message? The message is lost. The fix:
1. Write the message into an `outbox` collection in the **same** MongoDB transaction as the data.
2. A small process sends outbox messages to the queue and marks them sent.

**Real example: SkillKeepr.** SkillKeepr's serverless backend uses SQS, Step Functions, EventBridge crons and AWS Batch for background work. Hari's Stripe **auto-renewal** used a renewal cron and a webhook trigger. He tested it with Stripe Test Clocks. Webhooks are also "at least once", so duplicates matter. See [duplicate webhook events](topic:debugging/duplicate-webhook-events).

## ⚖️ Pros and cons

| Pros | Cons |
|---|---|
| The API stays fast; users don't wait | More moving parts: a queue, workers, monitoring |
| Slow or flaky work is retried automatically | The result isn't ready right away; the UI must show "processing" |
| Scale workers on their own when the queue grows | Duplicates and out-of-order messages need handling |
| One failing worker doesn't break the API | Harder to debug: the work happens later, somewhere else |
| Services are loosely coupled through events | Need DLQs, alarms and idempotency from day one |

## 🎯 When to choose it

- **Slow work:** resume parsing, PDF reports, video processing, AI calls.
- **Unreliable outside services:** email, SMS, payment providers and ATS APIs that may fail or rate-limit you.
- **Bulk work:** importing 1,000 candidates or sending 10,000 reminders.
- **Scheduled work:** daily reminders, subscription renewals, cleanup jobs.
- **Not needed for:** fast CRUD where the user needs the answer right now, like loading a profile.

## ⚠️ Common mistakes

- **Non-idempotent workers.** A retry sends the same email or charges the card twice.
- **No dead-letter queue.** A "poison" message fails forever, or it is silently lost.
- **Putting huge data in the message.** Put an ID in the message, and keep the file in S3 and the record in MongoDB.
- **Forgetting the UI.** The API returns 202, but React has no way to show "processing" or "done".

## 🗣️ How to answer in an interview

> "In an event-driven backend, the API only does the quick part. It validates, saves to MongoDB, puts a message on a queue and replies 202 with a job ID. Workers pick up messages and do the slow work, like sending emails, parsing resumes or calling an AI model. React finds out it's done by polling or by a push over SSE or WebSockets.
>
> The key design points are retries with backoff, a dead-letter queue for messages that keep failing, and idempotent workers, because queues and webhooks deliver at least once. On a Node server I'd use BullMQ with Redis. On AWS I'd use SQS with worker Lambdas, EventBridge for schedules, and Step Functions for multi-step flows.
>
> At SkillKeepr the backend uses SQS, Step Functions, EventBridge crons and AWS Batch for background work. I built the Stripe auto-renewal part, with a renewal cron and a webhook trigger, and tested it using Stripe Test Clocks."

[FILL IN: Stripe event names and retry rules used for renewal; confirm before quoting them.]

## 🔁 Follow-up questions

### What's the difference between a queue and pub/sub?

In a queue, each message is handled by **one** worker, like a to-do list. In pub/sub, one event goes to **every** subscriber, like a group announcement. Many systems use both: SNS or EventBridge fans out to several SQS queues.

### How do you make a worker idempotent?

Before doing the side effect, check if it's already done. For example, keep `emailSentAt` on the record, or store processed message IDs with a unique index. Then a second delivery just returns.

### Does a queue keep messages in order?

Not always. Standard SQS doesn't promise order. SQS FIFO queues and Kafka partitions keep order per group or key. Design so that order doesn't matter when you can.

### How do you watch a queue in production?

Track queue length, the age of the oldest message, the failure rate and the DLQ size. Alert when the DLQ isn't empty or the oldest message gets too old.

## ✅ Quick check

### 1. A signup route sends a welcome email and takes 4 seconds. What's the better design?

:::answer
Save the user, put a "send welcome email" job on a queue and reply right away (201 or 202). A worker sends the email in the background, with retries.
:::

### 2. The worker sent the same email twice after a retry. What's missing?

- A) A bigger Redis server
- B) Idempotency in the worker
- C) A faster email provider

:::answer
**B.** Queues deliver at least once. The worker must check "already sent?" before sending.
:::

### 3. What should the message contain when parsing a 5 MB resume?

:::answer
Just a small reference, like `{ resumeId: 42 }`. The file lives in S3 and the record in MongoDB. The worker loads them by ID.
:::
