---
title: "Practice: interview-reminder notification system (email + SMS)"
stack: system-design
order: 18
level: Intermediate
mustKnow: true
askedFrequency: common
summary:
  - A scheduler finds interviews that start soon and puts reminder messages on a queue.
  - Workers send each message through a provider (an email service or SMS service), using templates.
  - Respect each user's channel preferences and each tenant's settings, like time zone and sender details.
  - Retries with backoff for temporary failures, a dead-letter queue for permanent ones, and a unique key so no one gets the same reminder twice.
  - Log every send and its status, so support can answer "did the candidate get the reminder?".
cards:
  - q: Why use a queue between the scheduler and the senders?
    a: The scheduler only decides what to send. Workers send at a safe speed, retry failures and don't block each other. A slow SMS provider doesn't delay emails.
  - q: How do you stop a person getting the same reminder twice?
    a: Give each message a unique key, like interviewId:channel:reminderType, store it with a unique index, and mark the interview as reminded.
  - q: How do you handle time zones?
    a: Store all times in UTC. Convert to the tenant's or the person's time zone only when writing the message text.
  - q: What should happen if the SMS provider is down?
    a: Retry with backoff. If it stays down, move the message to a dead-letter queue, alert, and maybe fall back to email if the user allows it.
  - q: How do you let users control notifications?
    a: Store preferences per user and channel (email, SMS, push) and check them before queuing. Always include an unsubscribe option where required.
---

## 💡 What is it?

A **notification system** sends messages like "Your interview starts in 1 hour" by **email** and **SMS**.

In a hiring app, it must:
- find interviews that start soon,
- send each reminder **once**, at the right time,
- use the person's preferred channels,
- and keep working when an email or SMS provider fails.

## 🏠 Real-life example

Think of a **school office that reminds parents about meetings**.

- Every morning, a clerk checks the **diary** for meetings today. That is the **scheduler**.
- She writes a **reminder slip** for each one and puts it in a **tray**. That is the **queue**.
- Two helpers take slips: one **sends letters**, one **sends SMS**. Those are **workers**.
- Some parents said "**SMS only, please**". That is a **preference**.
- She **ticks** each meeting in the diary after writing the slip, so nobody gets two reminders. That is **de-duplication**.
- If the phone network is down, the helper **tries again later**. If it keeps failing, the slip goes to the **principal's tray**. That is the **dead-letter queue**.

Map it:
- **Diary check** = the scheduler.
- **Tray of slips** = the queue.
- **Helpers** = workers.
- **"SMS only"** = channel preferences.
- **Tick in the diary** = the "reminded" flag / unique key.
- **Principal's tray** = the dead-letter queue.

## 🧑‍💻 Code example

The scheduler loop: find interviews within the window, respect preferences, queue one message per channel, and mark them so the next run doesn't repeat them. Save as `reminders.js` and run `node reminders.js`.

```js
const interviews = [                                        // upcoming interviews (from the database)
  { id: 'i1', tenant: 'acme', candidate: 'Meena', startsAt: 40, reminded: false }, // in 40 minutes
  { id: 'i2', tenant: 'acme', candidate: 'Ravi', startsAt: 300, reminded: false }, // in 5 hours
  { id: 'i3', tenant: 'zenco', candidate: 'Asha', startsAt: 55, reminded: false }, // in 55 minutes
];                                                          // end of list
const prefs = { Meena: ['email', 'sms'], Asha: ['email'] }; // which channels each person allows
const queue = [];                                           // messages waiting to be sent

function runScheduler(now, windowMinutes) {                 // runs every 30 minutes
  for (const iv of interviews) {                            // check each interview
    const soon = iv.startsAt - now <= windowMinutes;        // starts within the window?
    if (!soon || iv.reminded) continue;                     // not yet, or already reminded → skip
    for (const channel of prefs[iv.candidate] ?? ['email']) { // respect the person's preferences
      queue.push({ key: `${iv.id}:${channel}`, tenant: iv.tenant, channel, to: iv.candidate }); // one message per channel
    }                                                       // end of channel loop
    iv.reminded = true;                                     // mark it so the next run doesn't repeat it
  }                                                         // end of interview loop
}                                                           // end of runScheduler

runScheduler(0, 60);                                        // first run: window of 60 minutes
runScheduler(30, 60);                                       // next run 30 minutes later
for (const msg of queue) console.log(msg);                  // what the workers will send
console.log('messages queued:', queue.length);             // total
```

**Output:**

```text
{ key: 'i1:email', tenant: 'acme', channel: 'email', to: 'Meena' }
{ key: 'i1:sms', tenant: 'acme', channel: 'sms', to: 'Meena' }
{ key: 'i3:email', tenant: 'zenco', channel: 'email', to: 'Asha' }
messages queued: 3
```

The second run found nothing new, because both soon-starting interviews were already marked. Ravi's interview is 5 hours away, so it waits.

## 🔍 Deeper version

**1. Requirements**
- Send reminders (for example 24 hours and 1 hour before) by email and SMS.
- Per-tenant settings: sender name, templates, time zone, which reminders are on.
- Per-user preferences and opt-out.
- At most one copy of each reminder; reasonably on time (a few minutes late is OK).
- Scale guess: 50,000 interviews a day across all tenants, peaks in office hours.

**2. API** (internal, mostly)

```text
PUT  /api/users/:id/notification-preferences   { "email": true, "sms": false }
GET  /api/interviews/:id/notifications         → list of sent reminders and their status
POST /webhooks/sms-status                      ← delivery receipts from the SMS provider
```

**3. Data model**
- `interviews`: `startTime` (UTC), participants, `reminders: { h24: sentAt, h1: sentAt }`. Index on `startTime`.
- `notification_log`: `key` (unique: `interviewId:type:channel`), `channel`, `status` (queued, sent, delivered, failed), provider message ID, attempts.
- `templates` per tenant and type, with placeholders like `{{candidateName}}`.

**4. Architecture**

```text
Scheduler (every N minutes) ──finds due reminders──► Queue (email) ──► Email workers ──► Email provider
         │                                        └► Queue (SMS)   ──► SMS workers   ──► SMS provider
         └── per tenant: settings, time zone                    │ failures ──► retry with backoff ──► DLQ
                                                                 └► notification_log  ◄── provider webhooks (delivered / bounced)
```

- **Scheduler options:** a cron job, EventBridge Scheduler, or an orchestrated workflow that loops over tenants and their upcoming interviews. Delayed jobs in BullMQ also work ("send at 09:00").
- **Separate queues per channel** so a slow SMS provider doesn't block emails. See [queues](topic:system-design/queues-background-jobs).
- **Idempotency:** insert into `notification_log` with the unique key **before** sending; if the insert fails, it was already handled. See [idempotent consumers](topic:architecture/idempotent-consumers).
- **Templates:** fill per tenant, in the reader's time zone. Escape user content.
- **Provider failures:** timeouts, retries with jitter, circuit breaker, maybe a backup provider. See [third-party API down](topic:debugging/third-party-api-down).
- **Delivery status:** providers send [webhooks](topic:rest-auth/webhooks) (delivered, bounced). Verify their signatures.

**5. Trade-offs**

| Choice | Option A | Option B |
|---|---|---|
| Scheduling | Poll every N minutes (simple, a bit late) | Exact delayed jobs (precise, more to manage) |
| Per-tenant loop | One by one (simple, slow with many tenants) | Fan out one job per tenant (parallel, more moving parts) |
| Provider | One provider (simple) | Primary + backup (resilient, more work) |

**At SkillKeepr (public-safe):** interview reminder emails are sent by a scheduled workflow that runs every 30 minutes, goes through each tenant, finds upcoming interviews and sends the reminders. [FILL IN: did you work on reminders or notifications? What part?]

## 🎯 Why do we use it?

Missed interviews waste recruiters' and candidates' time. A reliable reminder system sends the right message, once, on the right channel — even when a provider has a bad day.

## ⚠️ Common mistakes

- **Sending inside the scheduler loop.** One slow provider makes the whole run late or time out.
- **No de-duplication.** Overlapping runs send two reminders.
- **Storing local times.** Reminders go out an hour early or late across time zones and daylight saving.
- **Ignoring preferences and opt-outs.** Annoyed users, and sometimes legal problems for SMS.

## 🗣️ How to answer in an interview

> "I split it into a scheduler and senders. The scheduler runs every few minutes, finds interviews due for a reminder, checks each person's channel preferences and the tenant's settings, and puts one message per channel on a queue. Each message has a unique key like interviewId plus reminder type plus channel, stored with a unique index, so overlapping runs never send twice.
>
> Separate email and SMS workers send through providers using per-tenant templates, with all times stored in UTC and shown in the reader's time zone. Temporary failures retry with backoff; permanent ones go to a dead-letter queue with an alert. Provider webhooks update the delivery status in a notification log, so support can see exactly what was sent.
>
> [FILL IN: any part of this you built, if true.]"

## 🔁 Follow-up questions

### How would you send 10,000 reminders at 9:00 without overloading the provider?

Queue them and let workers send at the provider's allowed rate. Spread non-urgent messages over a few minutes.

### What if the interview is rescheduled after the reminder was queued?

Workers re-check the interview just before sending. If the time changed or it was cancelled, skip it and let the new schedule create new reminders.

### How do you test this?

Unit-test the "is it due?" logic with fake times. Use the provider's sandbox mode in staging. Check the log for duplicates.

## ✅ Quick check

### 1. In the code, why did the second scheduler run queue nothing?

:::answer
Both interviews starting within the window were already marked `reminded: true` in the first run. Ravi's interview was still more than 60 minutes away.
:::

### 2. The SMS provider is down for 2 hours. What should happen to SMS reminders?

:::answer
Retry with backoff. If they still fail, move them to a dead-letter queue and alert. If the user allows email, an email fallback can still reach them.
:::

### 3. Should interview times be stored in local time or UTC?

:::answer
**UTC.** Convert to the reader's time zone only when writing the message. This avoids time-zone and daylight-saving bugs.
:::
