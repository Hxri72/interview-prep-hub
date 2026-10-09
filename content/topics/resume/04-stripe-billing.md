---
template: story
title: "Stripe subscription auto-renewal with webhooks"
stack: resume
order: 4
level: Intermediate
mustKnow: true
askedFrequency: very common
summary:
  - "My part of SkillKeepr billing was auto-renewal: a renewal cron and the Stripe webhook handling. Other developers built the purchase flow."
  - Stripe renews the subscription and charges the card; it then sends webhook events, and our backend updates the company's plan and access.
  - A scheduled cron job checks plans and expiry as a safety net, in case a webhook is missed or delayed.
  - I tested renewals with Stripe Test Clocks, which let you move time forward so a month's renewal happens in minutes.
  - "Standard safety rules for webhooks: verify the signature with the raw body, ignore duplicate events, and reply 200 quickly."
cards:
  - q: What exactly did you build in Stripe billing?
    a: The auto-renewal part — a renewal cron and the webhook handling that updates a company's plan when Stripe renews or fails a payment. Other developers built the purchase flow.
  - q: How did you test renewals without waiting a month?
    a: With Stripe Test Clocks. You attach a test customer to a clock and move the clock forward, so renewals, invoices and failed payments happen in minutes.
  - q: Why do you need both a webhook and a cron?
    a: The webhook reacts right away when Stripe renews or fails a payment. The cron is a safety net that checks plan status and expiry on a schedule, in case a webhook is missed.
  - q: How do you verify a Stripe webhook?
    a: Use the Stripe-Signature header and the webhook secret with the raw request body. If you parse the JSON first, the bytes change and verification fails.
  - q: What if Stripe sends the same event twice?
    a: "The standard approach is to store processed event IDs and skip repeats, or make the update idempotent. [FILL IN: what you actually did.]"
---

## 💡 What is it?

SkillKeepr sells **monthly or yearly plans** to companies. **Stripe** handles the cards and payments.

My part was **auto-renewal**. When a plan's period ends, it must renew by itself. If the payment works, the company keeps its access. If it fails, the company's access must change.

I built the **renewal cron** and the **[webhook](glossary:webhook) handling** for this. Other developers built the purchase flow.

## 🏠 Real-life example

Think of a **monthly school bus pass**.

- At the end of each month, the pass renews by itself = **Stripe auto-renewal**.
- The bank takes the money from the parent's account = **Stripe charges the card**.
- The bus company sends the school a message: "Paid" or "Payment failed" = the **webhook**.
- The school office updates its list of who may ride = **our backend updates the plan**.
- The office also checks the list every morning, in case a message got lost = the **cron safety net**.

## 🧩 The problem

Plans must renew **without anyone clicking a button**. The app must always know the true payment status:
- paid → keep access,
- failed → warn, then limit access,
- cancelled → end the plan.

The hard part is **time**. Renewals happen once a month. You can't wait a month to test them.

## 🛠️ What I built

**My part: the renewal cron and the webhook trigger.**

**How auto-renewal usually works with Stripe:**

```text
Plan period ends
   │
Stripe creates an invoice and tries to charge the saved card
   │
Stripe sends webhook events to our backend:
   invoice.payment_succeeded  /  invoice.payment_failed  /  customer.subscription.deleted ...
   │
Our webhook handler:
   1. verify the Stripe signature (raw body + webhook secret)
   2. find the company for this Stripe customer
   3. update the company's plan: status, expiry date, access
   4. send emails if needed
   5. reply 200 quickly
   │
Scheduled cron (safety net): check plans and expiry dates, fix anything a webhook missed
```

[FILL IN: which events your code handles.]
[FILL IN: what the cron does exactly, and how often it runs.]
[FILL IN: what happens to a company's access after a failed payment — grace period, emails, blocking?]

**Testing with Stripe Test Clocks.** A Test Clock is a fake clock in Stripe's test mode. You create a test customer and subscription on the clock. Then you **move the clock forward**, for example by one month. Stripe acts as if that time really passed. It creates the invoice, tries the payment and sends the webhooks — in minutes. You can also use a card that always fails to test failed renewals.

## 🧗 The hard part

**Testing time-based behaviour.** Without Test Clocks, you can't see a renewal until a real month passes. Test Clocks made it possible to test renewals and failures during development.

**Webhooks are unreliable by nature.** They can arrive late, twice, or out of order. The standard defences:
- verify every signature,
- skip events you've already processed ([idempotency](topic:rest-auth/idempotency-keys)),
- reply fast and do slow work after,
- keep a cron as a safety net.

[FILL IN: which of these you actually used, and any real bug you hit.]

## 🏆 The result

- Plans renew automatically, and access follows the real payment status.
- The cron catches anything a webhook misses.
- [FILL IN: any measurable result — fewer manual fixes, fewer support tickets, etc.]

## 🗣️ How to answer in an interview

> "In SkillKeepr's Stripe billing, my part was auto-renewal. Other developers built the purchase flow.
>
> When a plan period ends, Stripe creates an invoice and charges the saved card. Stripe then sends webhook events, like payment succeeded or payment failed. Our webhook handler verifies the Stripe signature using the raw request body and our webhook secret, finds the company, and updates their plan status, expiry and access. I also built a renewal cron that runs on a schedule as a safety net, in case a webhook is missed or delayed.
>
> The tricky part was testing. You can't wait a month for a renewal. So I used Stripe Test Clocks. You attach a test customer to a clock and move time forward, and Stripe really creates the invoice and sends the webhooks in minutes. That let me test successful renewals and failed payments during development.
>
> [FILL IN: one more sentence — e.g. how you handled duplicate events, or a result.]"

## 🔁 Follow-up questions

### Why verify the webhook signature, and why the raw body?

Anyone can send a POST to your webhook URL. The signature proves it really came from Stripe. Stripe signs the **exact bytes** it sent. If you parse the JSON and stringify it again, the bytes change, and verification fails. So the webhook route must read the raw body. See [Webhook signatures](topic:rest-auth/webhook-signatures).

### What if your server is down when Stripe sends the webhook?

Stripe **retries** failed deliveries for up to about three days. Your cron is a second safety net. You can also see and resend events from the Stripe dashboard.

### What if the same event arrives twice?

Store processed event IDs with a [unique index](topic:mongodb/special-indexes), and skip events you've seen. Or make the update idempotent, like "set status = active", which is safe to run twice. [FILL IN: what you did.]

### A customer says "I was charged but have no access." What do you check?

Look at the event in the Stripe dashboard. Did the webhook reach us? Did our handler return an error? Then check the company's plan record in the database. Fix the data, then fix the cause.

### Why both a webhook and a cron?

The webhook is fast and reacts right away. The cron is slow but reliable. Together they keep the plan status correct even if one message is lost.

## 📚 Topics to revise

- [Webhooks](topic:rest-auth/webhooks)
- [Verifying webhook signatures](topic:rest-auth/webhook-signatures)
- [Idempotency keys and duplicate events](topic:rest-auth/idempotency-keys)
- [Buffers (why the raw body matters)](topic:nodejs/buffers)
- [Atomic updates and race conditions](topic:mongodb/atomic-updates-locking)
