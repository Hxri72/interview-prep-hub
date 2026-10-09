---
title: Event-driven architecture
stack: architecture
order: 11
level: Intermediate
mustKnow: true
askedFrequency: very common
summary:
  - In event-driven architecture, a service announces "something happened" (an event). Other services react on their own.
  - The producer doesn't know or wait for the consumers. This is called loose coupling.
  - "Events travel through a broker: a queue (SQS), a pub/sub bus (SNS, EventBridge) or a log (Kafka). Webhooks are events between companies."
  - "Benefits: services stay independent, slow work happens in the background, and new features just add a new listener."
  - "Costs: harder to debug, events can arrive twice or out of order, and data is only eventually consistent."
cards:
  - q: What is event-driven architecture?
    a: A design where services publish events ("candidate applied") and other services react to them, instead of calling each other directly and waiting.
  - q: Producer, consumer, broker — what are they?
    a: The producer publishes the event. The broker (SQS, EventBridge, Kafka) stores and delivers it. Consumers receive the event and do their own work.
  - q: Queue vs pub/sub — what's the difference?
    a: In a queue, each message goes to one worker (work sharing). In pub/sub, each event goes to every subscriber (broadcast).
  - q: Give two downsides of event-driven systems.
    a: Debugging is harder because the flow is spread across services, and you must handle duplicate and out-of-order events. Data is eventually consistent, not instant.
  - q: Is a Stripe webhook an event?
    a: Yes. Stripe publishes "invoice.paid" and calls your endpoint. Your server is the consumer, and it must handle retries and duplicates.
---

## 💡 What is it?

In **event-driven architecture**, parts of a system talk by **announcing events**. An [event](glossary:event) is a short message that says "something happened". For example: `candidate.applied` or `invoice.paid`.

The service that announces it is the **producer**. The services that react are **consumers**. The producer doesn't call them directly, and it doesn't wait for them.

A **broker** sits in the middle and delivers the events. SQS, SNS, EventBridge and Kafka are common brokers.

## 🏠 Real-life example

Think of the **school bell**.

When the bell rings, nobody tells each person what to do. Everyone reacts **on their own**:
- Teachers go to their next class.
- The canteen starts serving lunch.
- The guard opens the gate.

The bell doesn't know who is listening. A new rule ("the library closes at the bell") needs **no change to the bell**. The library just starts listening.

Map it:
- **The bell ringing** = an event, like `candidate.applied`.
- **Whoever rings the bell** = the producer.
- **The bell wire and speakers** = the broker (SQS, EventBridge…).
- **Teachers, canteen, guard** = consumers. Each does its own job.
- **Adding the library** = adding a new consumer, without changing the producer.

## 🧑‍💻 Code example

Node's `EventEmitter` shows the idea inside one program. Save as `events.js` and run `node events.js` (CommonJS).

```js
const { EventEmitter } = require('node:events');          // Node's built-in event tool
const bus = new EventEmitter();                           // our tiny "event bus" (in real life: SQS, EventBridge, Kafka…)

bus.on('candidate.applied', (e) => {                      // consumer 1: the email service
  console.log(`email   → thank-you mail to ${e.email}`);  // it reacts by sending an email
});                                                       // end of consumer 1
bus.on('candidate.applied', (e) => {                      // consumer 2: the scoring service
  console.log(`scoring → score ${e.name} for job ${e.jobId}`); // it reacts by scoring the candidate
});                                                       // end of consumer 2
bus.on('candidate.applied', (e) => {                      // consumer 3: the audit log
  console.log(`audit   → saved event at ${e.at}`);        // it reacts by writing a log entry
});                                                       // end of consumer 3

function applyToJob(name, email, jobId) {                 // the producer: the "apply" API
  console.log(`apply   → ${name} applied to ${jobId}`);   // do the main work first
  bus.emit('candidate.applied', { name, email, jobId, at: '10:00' }); // announce what happened; don't wait for anyone
}                                                         // end of applyToJob

applyToJob('Asha', 'asha@mail.com', 'JD-42');             // one person applies → three services react
```

**Output:**

```text
apply   → Asha applied to JD-42
email   → thank-you mail to asha@mail.com
scoring → score Asha for job JD-42
audit   → saved event at 10:00
```

`applyToJob` doesn't know about email, scoring or audit. Adding a fourth consumer needs no change to it. In a real system, the bus is a broker between separate services, and consumers run in the background. See [EventEmitter](topic:nodejs/event-emitter).

## 🔍 Deeper version

**Request-driven vs event-driven:**

```text
Request-driven:  Apply API ──call──► Email ──call──► Scoring ──call──► Audit   (waits for each)
Event-driven:    Apply API ──event──► Broker ──► Email
                                            ├──► Scoring
                                            └──► Audit                        (nobody waits)
```

**Kinds of brokers:**

| Type | Example | Delivery | Good for |
|---|---|---|---|
| **Queue** | SQS | each message to **one** worker | background jobs, sharing work, smoothing spikes |
| **Pub/sub** | SNS, EventBridge | each event to **every** subscriber | "tell everyone that X happened" |
| **Log / stream** | Kafka, Kinesis | consumers read at their own position; events kept for days | high volume, replay, analytics |
| **Webhook** | Stripe, ATS providers | HTTP POST to your URL | events between companies |

**Scheduled events** are events too. An EventBridge rule can fire every night ("expire old job posts").

**Three styles of events:**
- **Event notification:** a small message, "candidate 42 applied". Consumers fetch details if needed.
- **Event-carried state transfer:** the event includes the data the consumers need, so they don't call back.
- **Event sourcing:** the list of events *is* the data. Current state is rebuilt by replaying them. Powerful but complex.

**Choreography vs orchestration:**
- **Choreography:** each service reacts to events and emits its own. There's no central boss. It's flexible, but the full flow is hard to see.
- **Orchestration:** one coordinator (like AWS Step Functions) tells each step what to do, in order. It's easier to see and retry, but there's a central piece.

**Problems you must design for:**
- **Duplicates.** Most brokers deliver **at least once**, so consumers must be idempotent. See [idempotent consumers](topic:architecture/idempotent-consumers).
- **Ordering.** Events can arrive out of order. Use timestamps or version numbers, or FIFO queues with a message group.
- **Failures.** Retry with backoff. After a few tries, move the message to a **dead-letter queue (DLQ)** for a human to check.
- **Eventual consistency.** For a moment, the email is sent but the score isn't saved yet. The UI should tolerate "in progress".
- **Tracing.** Pass a correlation ID in every event, so logs across services can be joined.

**In a platform like SkillKeepr:** background work runs on SQS queues, Step Functions workflows, EventBridge scheduled jobs and AWS Batch. Stripe sends payment events by webhook. The ATS integration syncs data from outside systems. [FILL IN: one event flow you built yourself, e.g. the Stripe renewal webhook, and what reacts to it.]

## 🎯 Why do we use it?

- **Independence.** The apply API keeps working even if the email service is down. The event waits in the broker.
- **Speed for the user.** Slow work (emails, scoring, file parsing) happens in the background. The user gets a fast reply.
- **Easy to extend.** A new feature subscribes to an existing event. You don't touch the producer.
- **Handles spikes.** A queue absorbs a burst of 10,000 uploads, and workers process them at a safe pace.

## ⚠️ Common mistakes

- **Assuming each event arrives exactly once.** Retries cause duplicates. Make consumers idempotent.
- **No dead-letter queue.** A "poison" message fails forever, or disappears silently.
- **Putting everything on events.** Simple, instant reads ("get this candidate") are fine as direct calls. Events add complexity.
- **No correlation ID.** When something goes wrong, you can't follow one request across five services.

## 🗣️ How to answer in an interview

> "In event-driven architecture, a service publishes an event when something happens, like candidate.applied, and other services react to it on their own. The producer doesn't know who's listening and doesn't wait. A broker sits in between: a queue like SQS when one worker should handle each message, pub/sub like SNS or EventBridge when everyone should hear it, or Kafka for high-volume streams. Webhooks are the same idea between companies. Stripe sends us events like invoice.paid.
>
> The benefits are loose coupling, fast responses because slow work runs in the background, and easy extension. The costs are that it's harder to trace, and events can come twice or out of order. So I make consumers idempotent, add retries with a dead-letter queue, and pass a correlation ID through every event."

## 🔁 Follow-up questions

### When would you NOT use events?

When the caller needs the answer **right now** to continue, like "is this password correct?" or "show me this candidate". A direct API call is simpler and easier to debug.

### What is a dead-letter queue?

A separate queue where messages go after failing a set number of times. They don't block the main queue, and a developer can inspect and replay them later.

### How do you keep the database and the event in sync?

If you save to the database and then publish, a crash in between loses the event. The **outbox pattern** fixes this. In the same database transaction, you save the data **and** an "outbox" row. A separate process reads the outbox and publishes the events.

### How do you guarantee order?

Use a FIFO queue with a message group per entity (for example, per candidate), so events for one candidate are processed in order. Or include a version number and ignore older updates.

## ✅ Quick check

### 1. A new "send SMS when someone applies" feature is needed. In an event-driven design, what changes?

- A) The apply API must call the SMS service
- B) A new consumer subscribes to `candidate.applied`
- C) The broker must be replaced

:::answer
**B.** The producer stays the same. You just add a new consumer for the existing event.
:::

### 2. Queue or pub/sub? "Every uploaded resume should be parsed by exactly one of our 5 parser workers."

:::answer
**A queue (like SQS).** Each message goes to one worker, so the 5 workers share the load.
:::

### 3. True or false: in an event-driven system, all services always have the same data at the same moment.

:::answer
**False.** Data is **eventually consistent**. For a short time, some consumers have processed the event and others haven't yet.
:::
