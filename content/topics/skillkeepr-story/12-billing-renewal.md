---
template: chapter
title: Billing and auto-renewal with Stripe
stack: skillkeepr-story
order: 12
level: Intermediate
mustKnow: true
askedFrequency: very common
summary:
  - "Acme Hiring pays for SkillKeepr with a Stripe subscription that renews automatically."
  - "My part was only the auto-renewal: the renewal cron (scheduled job) and the webhook trigger. Other developers built the purchase flow."
  - "Webhooks tell us when a payment works or fails; a daily job moves an account between active, grace and blocked."
  - "Stripe can send the same event twice, so each event ID is handled only once (idempotency)."
  - "I tested renewals with Stripe Test Clocks, which fast-forward time so a month passes in minutes."
cards:
  - q: What exactly did you build in billing?
    a: Only the auto-renewal part — the renewal cron and the webhook trigger. Other developers built the purchase flow.
  - q: What are Stripe Test Clocks?
    a: A Stripe test feature that moves a test customer's clock forward, so renewals and failed payments happen in minutes instead of a month.
  - q: Why can't you just trust that each webhook arrives once?
    a: Stripe retries events, so the same event can arrive twice. You store processed event IDs and skip repeats.
  - q: What is a grace period?
    a: A few days after a missed payment when the account still works, with reminder emails, before it gets blocked.
  - q: Why have both webhooks and a daily cron?
    a: Webhooks react quickly to payments. The cron is a safety net that checks dates every day, in case an event was missed.
---

## 💡 What happens in this chapter

Acme Hiring pays for SkillKeepr every month. Nobody at Acme wants to click "pay" each time.

So the subscription **renews automatically** with Stripe. If a payment fails, Acme gets reminders and a few days of grace. If they still don't pay, the account is **blocked** until they renew.

I built the **auto-renewal** part of this.

## 🏠 Real-life example

Think of a **monthly bus pass**.

- The pass **renews itself** from your bank each month = auto-renewal.
- The **bank's SMS** saying "payment done" or "payment failed" = Stripe webhooks.
- The **conductor checking dates every morning** = the daily cron job.
- A few days of **"please renew soon" warnings** before the pass stops working = the grace period.
- If the bank sends the **same SMS twice**, you don't pay twice = handling each event only once.
- A **practice machine that fast-forwards the calendar** = Stripe Test Clocks.

## 🗺️ The flow

```text
Renewal day
   │
   ▼
Stripe tries to charge the saved card automatically
   │
   ├── success ─► webhook "payment succeeded" ─► our webhook route
   │                                            │ verify signature (raw body)
   │                                            │ skip if event ID already handled
   │                                            ▼
   │                                  update plan dates ─► account active
   │
   └── failure ─► webhook "payment failed" ─► record it, send reminder

Every day: cron job checks plan dates for each company
   active ─(end date passed)─► grace (reminder emails) ─(grace over)─► blocked
   blocked ─(customer renews manually)─► active
```

## 🧱 Tech used

| Piece | Technology | Learn it |
|---|---|---|
| Payments and subscriptions | Stripe (automatic collection) | [Stripe billing story](topic:resume/stripe-billing) |
| Payment events | Stripe webhooks | [Webhooks](topic:rest-auth/webhooks) |
| Trusting the event | Signature check on the raw body | [Verifying webhook signatures](topic:rest-auth/webhook-signatures) |
| No double processing | Store processed event IDs | [Idempotency keys and duplicate events](topic:rest-auth/idempotency-keys) |
| Daily checks | Scheduled job (cron) | [Queues and background jobs](topic:system-design/queues-background-jobs) |
| Plan dates and status | MongoDB per company | [Transactions and ACID](topic:mongodb/transactions) |
| Testing time-based logic | Stripe Test Clocks | [Mocking and test doubles](topic:testing/mocking) |

## 🧑‍💻 Key code idea

A tiny version of the two jobs: **handle a webhook once**, and a **daily check** that decides active, grace or blocked.

Save as `renewal.js` and run `node renewal.js`. (The 7-day grace is an example; the real value is a setting.)

```js
const GRACE_DAYS = 7;                                            // example grace period (the real setting is a config value)
const DAY = 24 * 60 * 60 * 1000;                                 // one day in milliseconds
const seen = new Set();                                          // Stripe event IDs we already handled

const account = { status: 'active', paidUntil: new Date('2026-11-01T00:00:00Z') }; // Acme Hiring's plan

function handleEvent(event) {                                    // called by the webhook route after the signature check
  if (seen.has(event.id)) return console.log(`skip ${event.id} (duplicate)`); // Stripe can send the same event twice
  seen.add(event.id);                                            // remember it (a unique index in a real database)
  if (event.type === 'invoice.paid') {                           // renewal payment worked
    account.paidUntil = new Date(event.periodEnd);               // move the plan end date forward
    account.status = 'active';                                   // full access again
  }                                                              // end of invoice.paid
  console.log(`handled ${event.type} → paidUntil ${account.paidUntil.toISOString().slice(0, 10)}`); // log the result
}                                                                // end of handleEvent

function dailyCheck(today) {                                     // the scheduled job (cron) runs this every day
  const lateBy = (today - account.paidUntil) / DAY;              // days past the paid date (negative = still paid)
  if (lateBy <= 0) account.status = 'active';                    // still inside the paid period
  else if (lateBy <= GRACE_DAYS) account.status = 'grace';       // payment late, but give them a few days + reminder emails
  else account.status = 'blocked';                               // grace is over → block the account
  console.log(`${today.toISOString().slice(0, 10)}: ${account.status}`); // show the state for that day
}                                                                // end of dailyCheck

dailyCheck(new Date('2026-10-30T00:00:00Z'));                    // before the end date
dailyCheck(new Date('2026-11-04T00:00:00Z'));                    // card failed, 3 days late
dailyCheck(new Date('2026-11-10T00:00:00Z'));                    // 9 days late → blocked
const paid = { id: 'evt_123', type: 'invoice.paid', periodEnd: '2026-12-10T00:00:00Z' }; // customer fixed the card
handleEvent(paid);                                               // first delivery
handleEvent(paid);                                               // Stripe retries the same event
dailyCheck(new Date('2026-11-11T00:00:00Z'));                    // back to active
```

```text
2026-10-30: active
2026-11-04: grace
2026-11-10: blocked
handled invoice.paid → paidUntil 2026-12-10
skip evt_123 (duplicate)
2026-11-11: active
```

`invoice.paid` is used here as an example event. [FILL IN: the exact Stripe events your code handles]

## 🧗 Hard parts and trade-offs

- **Time is hard to test.** A real renewal happens once a month. Stripe Test Clocks let me move time forward and watch renewals and failures in minutes.
- **Duplicate and out-of-order events.** Stripe retries webhooks. The code must skip events it has already handled, and not assume a fixed order.
- **Webhooks can be missed.** If our server is down, an event may arrive late. The daily cron re-checks dates, so no account stays wrong for long.
- **Being fair to customers.** Blocking too fast is harsh; never blocking loses money. A grace period with reminders is the middle path.
- **Raw body for signatures.** Parsing the JSON first changes the bytes, and the signature check fails. The webhook route needs the raw body.

## 🙋 My part

- I built **only the auto-renewal part**: the **renewal cron** and the **webhook trigger**. Other developers built the purchase flow.
- I tested it with **Stripe Test Clocks**.
- The platform also has (not necessarily built by me): automatic collection, stored subscription ID and plan dates, scheduled expiry reminders and blocked-account notices, blocking after a configured grace period, a manual renewal path, and a separate free-tier extension flow.
- [FILL IN: the exact events you handle, retry rules, and how you stored processed event IDs]
- If asked about low-level details I don't remember, I say I would revisit the module.

## 🗣️ How to explain it in an interview

> "In SkillKeepr, companies pay with a Stripe subscription that renews automatically. My part was the auto-renewal: the renewal cron and the webhook trigger. Other developers built the purchase flow.
>
> When Stripe charges the card, it sends a webhook. Our route verifies the signature using the raw body, skips the event if we've already handled its ID, and updates the plan dates. A daily scheduled job is the safety net: it checks dates and moves accounts from active to a grace period with reminders, and then to blocked if they still haven't paid.
>
> The hardest part was testing time-based logic. I used Stripe Test Clocks to fast-forward the clock, so I could see renewals and failed payments in minutes instead of waiting a month."

## 🔁 Follow-up questions

### Stripe sends the same event twice. What happens?

The second one is skipped, because its event ID is already stored. In a database, a unique index on the event ID makes this safe even with two servers.

### What if your server was down when the webhook arrived?

Stripe retries for a while. And the daily cron re-checks every account's dates, so the status gets corrected anyway.

### Why does the webhook route need the raw body?

The signature is calculated on the exact bytes Stripe sent. If you parse and re-stringify the JSON, the bytes change and the check fails.

### How did you test this without waiting a month?

With Stripe Test Clocks. You attach a test customer to a clock and move it forward, and Stripe runs renewals and failures as if the time passed.

### A customer says "I was charged but I have no access". What do you check?

Stripe's event log, our webhook logs and the account's plan dates. See [charged but no access](topic:debugging/charged-no-access).

## 📚 Topics to revise

- [Stripe billing story](topic:resume/stripe-billing)
- [Webhooks](topic:rest-auth/webhooks)
- [Verifying webhook signatures](topic:rest-auth/webhook-signatures)
- [Idempotency keys and duplicate events](topic:rest-auth/idempotency-keys)
- [Duplicate webhook events](topic:debugging/duplicate-webhook-events)
- ["I was charged but have no access"](topic:debugging/charged-no-access)
- [At-least-once delivery and idempotent consumers](topic:architecture/idempotent-consumers)
