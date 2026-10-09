---
template: scenario
title: Duplicate webhook events create duplicate records
stack: debugging
order: 21
level: Intermediate
mustKnow: true
askedFrequency: very common
summary:
  - Webhook providers (Stripe, ATS tools) deliver "at least once". The same event can arrive twice — after a timeout, a retry, or a network problem.
  - Logs show the same event ID processed two times, creating two payments, two invoices or two emails.
  - Fix by making the handler idempotent — store processed event IDs with a unique index, and use upserts / $set instead of blind inserts.
  - Reply 200 quickly; do slow work after (or in a queue), so the provider doesn't time out and retry.
  - Prevent with a unique index, tests that send the same event twice, and Stripe Test Clocks / the Stripe CLI for replays.
cards:
  - q: Why do webhooks arrive twice?
    a: Providers like Stripe deliver at least once. If your server is slow, returns an error, or the network drops, they retry — so the same event can arrive more than once.
  - q: What does idempotent mean?
    a: Doing the same operation twice gives the same result as doing it once. A second copy of the event changes nothing.
  - q: How do you make a webhook handler idempotent?
    a: Save each event ID in a collection with a unique index before processing. If the insert fails as a duplicate, skip it and still return 200. Also prefer upserts and $set over plain inserts.
  - q: Why reply 200 quickly?
    a: If processing takes too long, the provider times out and retries, which causes more duplicates. Acknowledge fast, then do heavy work in the background.
  - q: What do you do if processing fails after you saved the event ID?
    a: Remove the saved ID (or mark it failed) and return a 500, so the provider retries and the event is processed later.
---

## 💡 What is it?

Your server receives a [webhook](glossary:webhook) — for example from Stripe, saying "invoice paid". Your code creates a record.

Then the **same event arrives again**. Now you have **two** payment records, two invoices, or the customer gets **two emails**.

This is normal behaviour from the provider. Most webhook providers promise **"at least once"** delivery, not "exactly once". Your code must handle the same event safely more than once.

## 🏠 Real-life example

Think of a **school fee receipt book**.

A parent pays the fee. The clerk writes a receipt. Then the parent's message "I paid" arrives again, because the parent wasn't sure the first one reached. A careless clerk writes a **second receipt**. Now the accounts say the parent paid twice.

A careful clerk first checks the **transaction number** in the register:

- The **parent's message** = the webhook event.
- The **message sent again** = a retry from Stripe.
- The **transaction number** = the event ID (like `evt_123`).
- The **register of numbers already handled** = a collection of processed event IDs, with a unique [index](glossary:index).
- "Already in the register? Just say OK and do nothing" = an **idempotent** handler.

## 🔎 Detect

- **Duplicate rows** in the database: two payment records with the same Stripe invoice ID.
- Customers report **two emails** or two charges shown in your app.
- **Logs show the same event ID twice**, often a few seconds or minutes apart.
- The provider's dashboard (for example Stripe → Developers → Webhooks) shows **retries** or failed deliveries for that event.

## 🐞 Debug

**Step 1 — Find the event ID in the logs.** Search for it. If you see it two or more times, it was delivered more than once.

**Step 2 — Check why it was retried.** In the provider's dashboard, look at the first attempt:
- Did your server reply with an error (4xx or 5xx)?
- Did it **time out** because your handler was slow?
- Was the server down or restarting?

**Step 3 — Check the handler code.** Does it **insert** a new record every time, with no check for an existing one? That's the bug.

**Step 4 — Check concurrency.** Two copies can arrive **at the same time**, on two servers. A "check first, then insert" in code is not enough. Both checks can pass before either insert finishes. This is a [race condition](glossary:race-condition). Only a **unique index** in the database is fully safe.

## 🔧 Fix

**Broken: blind insert, slow work before replying.**

```js
app.post('/webhooks/stripe', express.raw({ type: 'application/json' }), async (req, res) => { // raw body: needed to verify the signature
  const event = stripe.webhooks.constructEvent(req.body, req.headers['stripe-signature'], process.env.STRIPE_WEBHOOK_SECRET); // check it really came from Stripe
  if (event.type === 'invoice.paid') {                              // only handle "invoice paid" events
    await Payment.create({ invoiceId: event.data.object.id });      // BUG: inserts a new row every time the event arrives
    await sendReceiptEmail(event.data.object);                      // slow email BEFORE replying → Stripe may time out and retry
  }                                                                 // end of the if
  res.sendStatus(200);                                              // reply comes late
});                                                                 // end of the route
```

**Fixed: dedupe by event ID with a unique index, idempotent updates, reply fast.**

```js
const processedEventSchema = new mongoose.Schema({                  // a small collection that remembers handled events
  eventId: { type: String, required: true, unique: true },          // unique index: the database rejects a second copy
  createdAt: { type: Date, default: Date.now, expires: '30d' },     // TTL index: delete the record after 30 days
});                                                                 // end of the schema
const ProcessedEvent = mongoose.model('ProcessedEvent', processedEventSchema); // the model

app.post('/webhooks/stripe', express.raw({ type: 'application/json' }), async (req, res) => { // raw body for the signature check
  let event;                                                        // will hold the verified event
  try {                                                             // signature check can throw
    event = stripe.webhooks.constructEvent(req.body, req.headers['stripe-signature'], process.env.STRIPE_WEBHOOK_SECRET); // verify
  } catch {                                                         // bad or fake signature
    return res.sendStatus(400);                                     // 400 = reject; don't process it
  }                                                                 // end of try/catch
  try {                                                             // try to claim this event ID
    await ProcessedEvent.create({ eventId: event.id });             // first copy: insert works
  } catch (err) {                                                   // insert failed
    if (err.code === 11000) return res.sendStatus(200);             // 11000 = duplicate key → already handled → say OK, do nothing
    throw err;                                                      // any other error: let the error handler return 500
  }                                                                 // end of the claim
  try {                                                             // now process the event once
    if (event.type === 'invoice.paid') {                            // only this event type here
      await Payment.updateOne(                                      // update-or-insert, keyed on the invoice
        { invoiceId: event.data.object.id },                        // filter: this invoice
        { $set: { status: 'paid', amount: event.data.object.amount_paid } }, // $set is safe to repeat
        { upsert: true },                                           // create the row only if it doesn't exist yet
      );                                                            // end of updateOne
      emailQueue.add('receipt', { invoiceId: event.data.object.id }); // slow email goes to a background queue
    }                                                               // end of the if
    res.sendStatus(200);                                            // reply fast, so Stripe doesn't retry
  } catch (err) {                                                   // processing failed
    await ProcessedEvent.deleteOne({ eventId: event.id });          // un-claim, so Stripe's retry can try again
    throw err;                                                      // Express 5 sends this to the error handler → 500 → Stripe retries
  }                                                                 // end of try/catch
});                                                                 // end of the route

paymentSchema.index({ invoiceId: 1 }, { unique: true });            // a second safety net: one payment row per invoice
```

Two layers of safety:
1. The **event ID** register stops the same event being processed twice.
2. **Upserts with `$set`** and a unique key on the business ID (the invoice) mean even a different event about the same invoice can't create a second row.

See [idempotency keys](topic:rest-auth/idempotency-keys), [webhook signatures](topic:rest-auth/webhook-signatures), [special indexes (unique, TTL)](topic:mongodb/special-indexes) and [atomic updates](topic:mongodb/atomic-updates-locking).

## 🛡️ Prevent

- **Every webhook handler is idempotent** by design: dedupe by event ID, and use upserts on a business key.
- **Unique indexes** in the database, not just checks in code.
- **Reply quickly** (within a few seconds); push slow work to a queue.
- **Test the duplicate case**: send the same event twice in an automated test and check there is only one record.
- For Stripe, replay events with the **Stripe CLI** (`stripe events resend`), and use **Test Clocks** to simulate renewals and failed payments in minutes.
- **Monitor** webhook failures and retries in the provider's dashboard.

## 🗣️ How to answer in an interview

**Short version (20 seconds):**

> "Webhook providers deliver at least once, so duplicates are expected. I make the handler idempotent: I save the event ID in a collection with a unique index before processing, and if it's a duplicate I return 200 and skip it. I use upserts and $set instead of blind inserts, and I reply fast and push slow work to a queue."

**Full version:**

> "First I confirm it in the logs — the same event ID processed twice — and check the provider's dashboard to see why it was retried: usually a timeout or an error on our side.
>
> The real fix is idempotency. Before processing, I insert the event ID into a processed-events collection that has a unique index. If the insert fails with a duplicate-key error, the event was already handled, so I return 200 and do nothing. A unique index matters because two copies can arrive at the same time on two servers — a simple 'check then insert' in code isn't safe.
>
> I also make the business update itself safe to repeat: an upsert with $set keyed on the invoice ID, with a unique index there too. And I reply 200 quickly and move slow work like emails to a queue, so the provider doesn't time out and retry. If processing fails, I remove the claimed ID and return 500, so the retry can succeed later.
>
> On the auto-renewal work I did with Stripe, we tested renewals with Stripe Test Clocks. [FILL IN: whether you saw duplicate events and what safeguard the renewal webhook actually uses — only what's true.]"

## 🔁 Follow-up questions

### Why not just check "does this payment exist?" before inserting?

Two copies of the event can arrive at the same moment, on two servers. Both checks see "no payment yet", and both insert. Only a **unique index** in the database stops this, because the database itself rejects the second insert.

### Why return 200 for a duplicate instead of an error?

Because the event **was** handled. If you return an error, the provider keeps retrying it — and sends you even more copies.

### Should you trust the order of webhook events?

No. Events can arrive **out of order**. For example "subscription updated" can come before "subscription created". Store a timestamp or version and ignore older updates, or fetch the latest object from the provider's API.

### How long should you keep processed event IDs?

Longer than the provider's retry window. Stripe retries for up to about 3 days, so keeping IDs for 30 days with a TTL index is a safe choice.

## ✅ Quick check

### 1. Stripe sends `evt_1` twice. Your handler does `Payment.create(...)` with no checks. What happens?

:::answer
**Two payment records** are created. The handler isn't idempotent. Dedupe by event ID (unique index) and use upserts.
:::

### 2. Your handler takes 40 seconds before replying. Why does this cause duplicates?

:::answer
The provider **times out** waiting for your reply, marks the delivery as failed, and **retries** — sending the same event again. Reply fast and do slow work in the background.
:::

### 3. True or false: checking `findOne({ eventId })` in code before inserting is enough to stop duplicates.

:::answer
**False.** Two copies can pass the check at the same time (a race condition). A **unique index** in the database is what truly stops the second insert.
:::
