---
title: "\"I was charged but have no access\" (Stripe)"
template: scenario
stack: debugging
order: 33
level: Advanced
mustKnow: true
askedFrequency: common
summary:
  - The payment worked in Stripe, but your database never updated. The link between them is usually the webhook.
  - Check in order — the Stripe dashboard (payment and event), the webhook delivery log (status code), your server logs, then your database.
  - "Common causes: signature check failing (the body was parsed before verifying), the event not handled, an error swallowed with a 200, or wrong customer mapping."
  - Fix the customer now (resend the event or update access), then fix the cause and backfill everyone affected.
  - Prevent it with raw-body verification, idempotent handlers, alerts on webhook failures, and a daily reconciliation job that compares Stripe with your database.
cards:
  - q: A customer was charged but has no access. Where do you look first?
    a: The Stripe dashboard — confirm the payment and find the event (like invoice.paid). Then the webhook delivery log for that event, to see what your endpoint answered.
  - q: The webhook shows 400 "signature verification failed". Common cause?
    a: The body was parsed as JSON before verifying. Stripe signs the raw bytes, so you must verify with the raw body (express.raw) and the right webhook secret.
  - q: The webhook returned 200 but the database didn't change. Why?
    a: The handler swallowed an error and still replied 200, or the event type isn't handled, or the customer/subscription id didn't match any record.
  - q: How do you fix the customer quickly?
    a: Resend the event from the Stripe dashboard after fixing the handler, or update their access directly — then backfill anyone else affected.
  - q: What protects you even if a webhook is missed?
    a: A reconciliation job (for example daily) that reads subscription status from Stripe and fixes any record in your database that doesn't match.
---

## 💡 What is it?

A customer writes: **"My card was charged, but my account still says expired."**

The money reached Stripe. But your app never gave the access. Somewhere between **Stripe** and **your database**, the update was lost.

In most apps, that link is a **[webhook](glossary:webhook)**. Stripe sends an event like `invoice.paid` to your server. Your server updates the subscription. If that step fails, the customer pays but gets nothing.

This is a high-priority bug. Money is involved, and trust is at risk.

## 🏠 Real-life example

Think of **paying school fees at the bank**.

You pay at the bank counter. The bank is supposed to **send a slip to the school office**. Then the office marks you as "paid" and gives you your ID card.

This time, you paid, but the school still says "fees pending".

Where did it break?
- Did the **bank** really take the money? → Check the **Stripe dashboard**.
- Did the bank **send the slip**? → Check the **webhook delivery log**.
- Did the **office receive it** but **reject it** because the stamp looked wrong? → **Signature verification failed**.
- Did the office **receive it and lose it**? → An error was swallowed, but the office said "OK".
- Did they **mark the wrong student**? → The customer id didn't match.
- A **monthly check** where the office compares the bank statement with its register = a **reconciliation job**.

## 🔎 Detect

- **Support tickets:** "charged but no access", "plan still expired after paying".
- **Stripe dashboard → Webhooks:** failed deliveries, with status codes like `400` or `500`, or timeouts.
- **Stripe emails you** when webhook deliveries keep failing.
- **Your logs:** errors in the webhook route, or no logs at all for that event.
- **A reconciliation report** (if you have one) shows "active in Stripe, inactive in our database".

## 🐞 Debug

Follow the money, step by step:

1. **Stripe dashboard:** find the customer. Confirm the payment succeeded and the subscription is `active`. Note the event, for example `invoice.paid`, and its time.
2. **Webhook delivery log** for that event: did Stripe send it to the right URL? What did your endpoint answer?
   - **`400` with "signature" in the message** → verification is failing.
   - **`500` or timeout** → your handler crashed or was too slow.
   - **`200`** → your server said "OK". So the bug is inside your handler or your data.
3. **Your server logs** around that time: was the event received? Did it throw? Was the error caught and hidden?
4. **Your handler code:** is this event type handled at all? Many handlers only handle `checkout.session.completed`, but renewals arrive as `invoice.paid`.
5. **The mapping:** how does the handler find the right customer in your database? By `stripeCustomerId`, by subscription id, or by metadata? Is that value saved correctly for this customer?
6. **The environment:** is this the live webhook with the **live** secret? Test-mode and live-mode secrets are different.

## 🔧 Fix

**Before:** JSON is parsed before verifying, and every error becomes a 200.

```js
// ❌ BEFORE — the signature always fails, and failures are hidden
app.use(express.json());                                        // parses EVERY body, including Stripe's, as JSON
app.post('/webhooks/stripe', async (req, res) => {              // Stripe sends events here
  try {                                                         // wrap everything
    const event = stripe.webhooks.constructEvent(               // check the signature
      JSON.stringify(req.body),                                 // re-built JSON is not the original bytes → fails
      req.headers['stripe-signature'],                          // the signature Stripe sent
      process.env.STRIPE_WEBHOOK_SECRET,                        // our webhook secret
    );                                                          // end of constructEvent
    if (event.type === 'checkout.session.completed') { /* … */ } // renewals (invoice.paid) are never handled
  } catch (err) {                                               // the signature error lands here
    console.log(err.message);                                   // logged quietly…
  }                                                             // end of catch
  res.sendStatus(200);                                          // …and Stripe is told "all good", so it never retries
});                                                             // end of the route
```

**After:** raw body, honest status codes, idempotent handling and the renewal event.

```js
// ✅ AFTER — the webhook route gets the RAW body, before express.json() runs
app.post('/webhooks/stripe', express.raw({ type: 'application/json' }), async (req, res) => { // req.body is a Buffer
  let event;                                                    // will hold the verified event
  try {                                                         // only the signature check here
    event = stripe.webhooks.constructEvent(                     // check the signature on the raw bytes
      req.body,                                                 // the exact bytes Stripe signed
      req.headers['stripe-signature'],                          // the signature header
      process.env.STRIPE_WEBHOOK_SECRET,                        // the secret for THIS endpoint and mode
    );                                                          // end of constructEvent
  } catch (err) {                                               // bad or fake signature
    return res.status(400).send(`Webhook error: ${err.message}`); // 400 → visible in Stripe's delivery log
  }                                                             // end of the signature check

  const seen = await ProcessedEvent.findOne({ eventId: event.id }); // did we already handle this event?
  if (seen) return res.sendStatus(200);                         // duplicate delivery → nothing to do

  try {                                                         // the real work
    if (event.type === 'invoice.paid') {                        // a payment went through, including renewals
      const invoice = event.data.object;                        // the Stripe invoice
      await Subscription.updateOne(                             // update OUR record
        { stripeCustomerId: invoice.customer },                 // find the customer by their Stripe id
        { $set: { status: 'active', paidUntil: new Date(invoice.lines.data[0].period.end * 1000) } }, // seconds → ms
      );                                                        // end of updateOne
    }                                                           // end of invoice.paid
    await ProcessedEvent.create({ eventId: event.id });         // remember it (unique index on eventId)
    res.sendStatus(200);                                        // tell Stripe it worked
  } catch (err) {                                               // our own bug or a database error
    console.error('Stripe webhook failed', event.id, err);      // log with the event id for tracing
    res.sendStatus(500);                                        // 500 → Stripe will retry this event later
  }                                                             // end of catch
});                                                             // end of the route

app.use(express.json());                                        // JSON parsing for all OTHER routes, after the webhook
```

**What the values mean:**
- `express.raw(...)` = keep the body as raw bytes. Stripe signs those exact bytes.
- `400` for a bad signature, `500` for our errors = honest answers. Stripe **retries** failed deliveries for up to 3 days in live mode.
- `invoice.lines.data[0].period.end * 1000` = Stripe times are in **seconds**, JavaScript dates use **milliseconds**.

:::note
Saving `ProcessedEvent` after the update keeps it simple. If the update succeeds but saving the event fails, Stripe retries and the update runs again — which is fine, because it only sets the same values (it's idempotent).
:::

**Then fix the people:**
1. **This customer now:** after deploying the fix, **resend the event** from the Stripe dashboard, or update their access directly.
2. **Everyone else affected:** list subscriptions that are `active` in Stripe but not in your database, and fix them (a **backfill**).
3. **Tell the customer** it's fixed. If needed, extend their plan for the trouble.

## 🛡️ Prevent

- **Verify with the raw body**, and keep the webhook route above `express.json()`. See [verifying webhook signatures](topic:rest-auth/webhook-signatures).
- **Never hide errors with a 200.** Let Stripe retry.
- **Idempotent handlers**, keyed on the event id. See [duplicate webhook events](topic:debugging/duplicate-webhook-events).
- **Handle every event you depend on:** `invoice.paid`, `invoice.payment_failed`, `customer.subscription.updated`, `customer.subscription.deleted`.
- **Alerts** on webhook failures and on Stripe's "failing webhook" emails.
- **A reconciliation cron** (for example daily) that compares Stripe's subscription status with your database and fixes differences. This catches anything the webhook missed.
- **Test renewals before release** with **Stripe Test Clocks**, which move a test customer's time forward so a monthly renewal or a failed payment happens in minutes.

## 🗣️ How to answer in an interview

**Short version (20 seconds):**

> "I follow the money: the Stripe dashboard to confirm the payment and find the event, the webhook delivery log to see what my endpoint returned, then my logs and database. Usual causes are a signature check on a parsed body, an unhandled event like invoice.paid, or an error hidden behind a 200. I fix the customer by resending the event, fix the code, backfill everyone affected, and add a reconciliation job."

**Full version:**

> "First I make sure the customer is unblocked quickly, but I start by confirming the facts. In the Stripe dashboard I check the payment succeeded and find the event — for a renewal that's usually `invoice.paid`. Then I open the webhook delivery log to see what my endpoint answered.
>
> A 400 with a signature error usually means the body was parsed as JSON before verification — Stripe signs the raw bytes, so the route needs `express.raw` and the right secret for live mode. A 500 means the handler crashed. A 200 means the bug is inside my handler: maybe the event type isn't handled, the error was swallowed, or the customer id didn't match.
>
> After fixing the code, I resend the event from the dashboard for that customer, and I backfill everyone else: subscriptions active in Stripe but not in our database. To prevent it, handlers are idempotent on the event id, errors return 500 so Stripe retries, failures alert us, and a daily reconciliation job compares Stripe with our data. This connects to my own work: I built the auto-renewal part of our Stripe billing — the renewal cron and the webhook trigger — and I tested renewals with Stripe Test Clocks."

[FILL IN: a real "charged but no access" or renewal issue you saw, and how you fixed it. Only if it really happened — otherwise, keep the answer as "how I would debug it".]

## 🔁 Follow-up questions

### Why must the webhook use the raw body?

Stripe signs the exact bytes it sent. `express.json()` turns them into an object; turning it back into a string can change spaces and key order. The signature check then fails.

### What if your server was down when Stripe sent the event?

Stripe retries failed deliveries with backoff for up to three days in live mode. After the server is back, the events usually arrive. A reconciliation job covers anything that still slips through.

### Should the webhook do all the work before answering?

Keep it fast. Verify, record the event, do quick database updates, and answer. Slow work (emails, PDFs) should go to a queue, so Stripe doesn't time out and retry.

### How do you test this before customers hit it?

Use the Stripe CLI (`stripe listen` and `stripe trigger`) to send test events locally, and Test Clocks to simulate renewals and failed payments over weeks in a few minutes.

## ✅ Quick check

### 1. The Stripe delivery log shows `400 — No signatures found matching the expected signature`. Most likely cause?

:::answer
The body was parsed (for example by `express.json()`) before verification, or the wrong webhook secret is used (test vs live). Verify with the **raw body** and the endpoint's correct secret.
:::

### 2. The delivery log shows `200`, but the customer has no access. Where is the bug?

:::answer
Inside **your handler or data**. Stripe delivered the event and you said "OK". Maybe the event type isn't handled, an error was caught and hidden, or the customer id didn't match a record.
:::

### 3. Why is `invoice.lines.data[0].period.end * 1000` needed?

:::answer
Stripe times are in **seconds** since 1970. JavaScript `Date` uses **milliseconds**. Without `* 1000`, the date would be in January 1970.
:::
