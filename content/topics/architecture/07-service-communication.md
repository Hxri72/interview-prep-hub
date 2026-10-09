---
title: "Service communication: REST vs events and queues"
stack: architecture
order: 7
level: Intermediate
mustKnow: true
askedFrequency: very common
summary:
  - "Synchronous (REST/HTTP): the caller sends a request and WAITS for the answer. Simple, but the caller is slowed or blocked if the other service is slow or down."
  - "Asynchronous (events/queues): the sender drops a message and moves on. Receivers process it later. Decoupled and resilient, but harder to trace and only eventually consistent."
  - Use sync when you need the answer right now. Use async for side effects and slow work — emails, scoring, imports, reports.
  - Queues need retries, a dead-letter queue and idempotent consumers, because messages can arrive more than once.
  - Real systems mix both — a fast REST reply to the user, then events for everything else.
cards:
  - q: What is the difference between synchronous and asynchronous communication?
    a: In sync (REST), the caller waits for the response. In async (queue/event), the sender puts a message on a queue and continues; a consumer handles it later.
  - q: When would you use REST between services?
    a: When the caller needs the answer immediately to continue — for example, checking a job is open before accepting an application.
  - q: When would you use a queue or events?
    a: For side effects and slow or bursty work — sending emails, scoring candidates, parsing resumes, imports — where the user doesn't need to wait.
  - q: What is a dead-letter queue (DLQ)?
    a: A separate queue where messages go after failing too many times, so they don't block the main queue and can be inspected later.
  - q: Why must queue consumers be idempotent?
    a: Most queues deliver at least once, so the same message can arrive twice; processing it twice must not create duplicates.
---

## 💡 What is it?

Services talk in two main ways.

**1. Synchronous (REST / HTTP).** One service asks another and **waits** for the answer. Like a phone call.

**2. Asynchronous (events / queues).** One service **drops a message** and moves on. Other services pick it up **later**. Like a WhatsApp message.

Most real systems use both.

## 🏠 Real-life example

Think of a **school office**.

- You need your marks card **now** to fill a form. You stand at the counter and **wait** while the clerk prints it. That's a **phone call / REST**.
- You want a bus pass. You **drop the form in a box** and go to class. The office processes it later and sends it to your class. That's a **queue**.

Mapping:
- **Standing at the counter** = a synchronous request. You can't do anything else.
- **The form box** = the [queue](glossary:queue).
- **The office staff who empty the box** = consumers.
- **"Your bus pass is ready" on the notice board** = an event others can react to.
- **A form that keeps getting rejected, put in a separate tray** = a dead-letter queue.

If the clerk is on leave, the counter line stops. But the form box still collects forms. That's why queues are more resilient.

## 🧑‍💻 Code example

Both styles in one script. Node's `EventEmitter` plays the role of a tiny queue. Save as `communication.js` and run `node communication.js`.

```js
const { EventEmitter } = require('node:events');            // Node's built-in event tool, used as a tiny queue

// ---- Style 1: synchronous request (like REST). The caller WAITS for the answer. ----
async function getJobTitle(jobId) {                         // pretend this is another service over HTTP
  await new Promise((r) => setTimeout(r, 100));             // 100 ms of "network time"
  return 'Node.js Developer';                               // the answer the caller needs right now
}                                                           // end of getJobTitle

// ---- Style 2: event / queue. The sender does NOT wait for the receivers. ----
const bus = new EventEmitter();                             // the "queue" everyone can publish to
bus.on('candidate.applied', (e) => {                        // receiver 1: email service
  setTimeout(() => console.log(`  email sent to ${e.name}`), 50);   // does its work later
});                                                         // end of receiver 1
bus.on('candidate.applied', (e) => {                        // receiver 2: scoring service
  setTimeout(() => console.log(`  ${e.name} scored`), 80);  // does its work later, on its own
});                                                         // end of receiver 2

async function applyToJob(name, jobId) {                    // the main action: a candidate applies
  const title = await getJobTitle(jobId);                   // REST style: we need the title, so we wait
  console.log(`${name} applied to ${title}`);               // save the application (pretend)
  bus.emit('candidate.applied', { name, jobId });           // EVENT style: announce it and move on
  console.log('reply sent to the user');                   // the user gets a fast reply
}                                                           // end of applyToJob

applyToJob('Asha', 1);                                      // run the example
```

**Output:**

```text
Asha applied to Node.js Developer
reply sent to the user
  email sent to Asha
  Asha scored
```

**What to notice:** the user got a reply **before** the email and scoring finished. A real queue (SQS, RabbitMQ, BullMQ) also keeps the message safe if a receiver is down, which `EventEmitter` does not.

## 🔍 Deeper version

**Comparison:**

| | Sync (REST / HTTP) | Async (queue / events) |
|---|---|---|
| Caller waits? | Yes | No |
| Coupling | Tight — both must be up at the same time | Loose — receiver can be down for a while |
| Latency for the user | Adds up across calls | User gets a fast reply |
| Consistency | Immediate | Eventual |
| Debugging | Easy (one request, one response) | Harder (trace across messages) |
| Failure handling | Timeouts, retries, circuit breakers | Retries, dead-letter queues, idempotency |
| Good for | Reads, "I need the answer now" | Side effects, slow work, spikes |

**Queue vs event (pub/sub):**
- **Queue (point-to-point):** each message is handled by **one** consumer. Good for jobs: "parse this resume".
- **Event / pub-sub:** each event goes to **every** subscriber. Good for facts: "candidate applied" → email, scoring and analytics all react.

**Delivery guarantees.** Most managed queues are **at least once**. A message can arrive twice (a retry after a timeout). So consumers must be **idempotent**. See [idempotent consumers](topic:architecture/idempotent-consumers). **FIFO** queues add ordering, usually per group key.

**Must-haves for queues:**
- A **retry** limit with backoff.
- A **dead-letter queue (DLQ)** for messages that keep failing.
- A **visibility timeout** longer than the worker's run time, or the message is handed to a second worker while the first is still working.
- **Monitoring**: queue depth and the age of the oldest message.

**Sync must-haves:** always set **timeouts** on HTTP calls. Retry only safe operations, with backoff. Add a circuit breaker for flaky services. See [resilience](topic:architecture/resilience).

**Tools:** AWS SQS, SNS, EventBridge; RabbitMQ; Kafka (high-volume event streams); BullMQ + Redis (Node job queues). Webhooks are "events over HTTP" between companies. See [webhooks](topic:rest-auth/webhooks).

**A real example.** At SkillKeepr, slow work runs asynchronously on AWS: queues (SQS) for background jobs, Step Functions and scheduled EventBridge jobs for reminders and cleanups, and AWS Batch for long imports. The user gets a quick reply while the heavy work runs in the background. [FILL IN: one async flow you worked on, e.g. the Stripe renewal cron and webhook.]

## 🎯 Why do we use it?

- **Fast replies** — users don't wait for emails, scoring or reports.
- **Resilience** — if the email service is down, messages wait in the queue instead of failing the user's request.
- **Absorb spikes** — 5,000 resumes uploaded at once go into a queue and are processed at a steady pace.
- **Loose coupling** — new consumers can react to an event without changing the sender.

## ⚠️ Common mistakes

- **No timeout on HTTP calls** — one slow service makes every caller hang.
- **Long chains of sync calls** — A → B → C → D. Latency and failure risk add up.
- **Non-idempotent consumers** — a duplicate message creates duplicate records or charges.
- **No dead-letter queue** — one bad message is retried forever and blocks others.
- **Using async when the user needs the answer now** — then you need polling and it gets complicated.

## 🗣️ How to answer in an interview

> "Services talk either synchronously or asynchronously. With REST, the caller sends a request and waits for the response — simple and immediately consistent, but the caller is slowed or blocked if the other service is slow or down, so I always use timeouts and careful retries.
>
> With queues or events, the sender publishes a message and moves on, and consumers process it later. That gives fast replies, absorbs spikes and keeps working if a consumer is temporarily down. The cost is eventual consistency and harder tracing, and since most queues deliver at least once, consumers must be idempotent, with a retry limit and a dead-letter queue.
>
> My rule: sync when I need the answer to continue, async for side effects and slow work. On the platform I work on, the API replies quickly while things like background jobs, reminders and imports run through queues, scheduled jobs and batch jobs on AWS."

## 🔁 Follow-up questions

### What happens if a consumer fails halfway through a message?

The message isn't deleted, so after the visibility timeout it becomes visible again and is retried. After too many failures, it moves to the dead-letter queue. That's why processing must be safe to repeat.

### How do you return a result to the user from async work?

Give the user a job ID right away (`202 Accepted`). Then the client polls a status endpoint, or the server pushes the result with WebSockets, or sends an email or notification when it's done.

### What is the difference between SQS and SNS?

SQS is a **queue**: each message goes to one consumer, and it waits until processed. SNS is **pub/sub**: each message is pushed to all subscribers. A common pattern is SNS → several SQS queues ("fan-out").

### What is eventual consistency?

Different parts of the system may be briefly out of date after a change, but they all catch up soon. For example, a candidate's score appears a few seconds after they apply.

## ✅ Quick check

### 1. In the code example, why is "reply sent to the user" printed before "email sent to Asha"?

:::answer
`emit` only announces the event. The email receiver does its work later (in a timer), so `applyToJob` continues and replies first. That's the asynchronous style.
:::

### 2. Which should be synchronous?

- A) Sending a welcome email
- B) Checking a coupon is valid before showing the final price
- C) Generating a monthly report

:::answer
**B.** The user needs the answer right now to continue. A and C can run in the background.
:::

### 3. A queue delivers the same "payment succeeded" message twice. What prevents a double update?

:::answer
An **idempotent consumer**: for example, store each processed message ID with a unique index and skip any ID already seen.
:::
