---
title: Idempotency keys and duplicate events
stack: rest-auth
order: 23
level: Advanced
mustKnow: true
askedFrequency: common
summary:
  - "Idempotent means: doing the same thing twice has the same result as doing it once. Retries are safe."
  - Networks fail, so senders retry. Without protection, one payment can be charged twice or one webhook processed twice.
  - "For incoming webhooks: save each event id with a UNIQUE index before doing the work. A second copy hits the unique index and is skipped."
  - "For outgoing requests (like creating a Stripe charge): send an Idempotency-Key header. If you retry with the same key, Stripe returns the first result instead of charging again."
  - Make the duplicate check and the work atomic (a unique index, an upsert, or a transaction) — a simple "find, then insert" can still race.
cards:
  - q: What does idempotent mean?
    a: An operation you can repeat many times with the same final result as doing it once. For example, "set status to paid" is idempotent; "add 500 to balance" is not.
  - q: Why do duplicate webhook events happen?
    a: Providers deliver "at least once". If your 200 reply is lost or slow, they retry, so the same event id arrives again.
  - q: How do you stop duplicate webhook processing?
    a: Store each processed event id in a table or collection with a unique index. Insert it first; if the insert fails with a duplicate-key error, skip the event and still reply 200.
  - q: What is an Idempotency-Key header?
    a: A unique id (like a UUID) the client sends with a POST. The server remembers the result for that key. If the same request is retried with the same key, it returns the saved result instead of doing the action again.
  - q: Why isn't "check if it exists, then insert" enough?
    a: Two copies can arrive at the same moment, both see "not found", and both insert. A unique index (or atomic upsert) lets the database decide, so only one wins.
---

## 💡 What is it?

**Idempotent** means: **doing it twice gives the same result as doing it once.**

Networks are unreliable. A request can succeed, but the reply can get lost. The sender doesn't know, so it **retries**. If your code isn't idempotent, a retry can **charge a card twice** or **give a customer two credits**.

An **idempotency key** is a unique id attached to a request or event. The server remembers which keys it has already handled. When the same key comes again, it **skips the work** (or returns the saved result).

## 🏠 Real-life example

Think of a **school canteen token**.

You pay at the counter and get **token number 47**. You give the token to the food counter and get your lunch. The server **tears the token**. If you show token 47 again, they say "already served". You can't get a second lunch with the same token.

- The **token number** = the idempotency key or event id.
- **Showing the token** = sending the request.
- The **food counter** = your server.
- **Tearing the token** = saving the key as "done".
- **Showing an old torn token again** = a retry or duplicate event. You get "already served", not a second lunch.
- **Two friends rushing to the counter with copies of the same token at the same time** = a race condition. The counter must check and tear in **one move**, or both might get lunch.

## 🧑‍💻 Code example

No packages needed. Save this as `idem.js` and run `node idem.js`. A `Set` stands in for a database table of processed event ids.

```js
const processedEvents = new Set();                             // ids of events we already handled (a DB table in real life)
let balance = 0;                                               // the account balance we update

function handlePaymentEvent(event) {                           // runs for every webhook delivery
  if (processedEvents.has(event.id)) {                         // seen this id before?
    console.log(`skip ${event.id} (duplicate)`);               // yes → do nothing
    return;                                                    // stop here, but still reply 200 to the sender
  }                                                            // end of the duplicate check
  processedEvents.add(event.id);                               // remember this id FIRST
  balance += event.amount;                                     // then do the real work
  console.log(`applied ${event.id}: balance = ${balance}`);    // show the new balance
}                                                              // end of handlePaymentEvent

const event = { id: 'evt_9001', amount: 500 };                 // one payment of 500
handlePaymentEvent(event);                                     // first delivery
handlePaymentEvent(event);                                     // the sender retried: same event again
handlePaymentEvent({ id: 'evt_9002', amount: 200 });           // a different, new event
console.log('final balance:', balance);                        // 700, not 1200
```

**Output:**

```text
applied evt_9001: balance = 500
skip evt_9001 (duplicate)
applied evt_9002: balance = 700
final balance: 700
```

Without the check, the balance would be **1200**. The customer would get 500 for free.

## 🔍 Deeper version

**1. Incoming duplicates (webhooks, queue messages).** Let the **[database](glossary:database)** decide, with a **unique [index](glossary:index)**:

```js
// Mongoose model: one document per processed event
const ProcessedEvent = mongoose.model('ProcessedEvent', new mongoose.Schema({
  eventId: { type: String, required: true, unique: true },     // unique index → no two docs with the same id
  processedAt: { type: Date, default: Date.now, expires: '30d' }, // TTL: delete after 30 days to save space
}));

async function handleOnce(event, work) {
  try {
    await ProcessedEvent.create({ eventId: event.id });        // try to claim this event id
  } catch (err) {
    if (err.code === 11000) return 'duplicate';                // E11000 = duplicate key → already handled
    throw err;                                                 // any other error is real
  }
  await work(event);                                           // only the first copy gets here
  return 'processed';
}
```

Why not `findOne` and then `create`? Two copies can arrive at the **same moment**. Both `findOne` calls return "not found", and both run the work. That's a [race condition](glossary:race-condition). A unique index makes the database the referee, and only one insert wins.

**What if the work fails after the id is saved?** Then the event is marked "done" but nothing happened. Fixes:
- Do the insert and the work in **one [transaction](glossary:transaction)** (see [MongoDB transactions](topic:mongodb/transactions)), or
- Save a `status: 'processing'` first, mark it `'done'` at the end, and let a retry pick up rows stuck in `processing`, or
- Make the work itself idempotent, like `$set: { status: 'active', periodEnd }` instead of `$inc`.

**2. Outgoing requests: the `Idempotency-Key` header.** When your server creates a charge, the network can fail after Stripe has already charged. If you just retry, you could charge twice. Instead:

```js
await stripe.paymentIntents.create(
  { amount: 49900, currency: 'inr', customer: customerId },   // what to charge (49900 paise = ₹499)
  { idempotencyKey: `renewal-${subscriptionId}-${periodStart}` }, // same key on every retry of THIS charge
);
```

Stripe saves the result for that key (for at least 24 hours). A retry with the same key gets the **same response** back, and there is no second charge. Build the key from something stable, like the subscription and billing period. Don't use a new random id per retry.

**3. HTTP methods and idempotency** (see [idempotency and safe methods](topic:rest-auth/idempotency-safe-methods)):
- `GET`, `PUT` and `DELETE` are idempotent **by design**. "Set this record to X" twice gives the same result.
- `POST` is **not**. "Create an order" twice makes two orders. That's why POST endpoints that move money accept an `Idempotency-Key` header.

**4. Make operations idempotent by design.** Prefer "set to a value" over "change by an amount". Use **upserts** keyed on an external id. For example, when syncing candidates from an ATS, match on email or the external candidate id, so a second sync updates instead of duplicating.

## 🎯 Why do we use it?

- **Retries are normal.** Webhook providers, queues (SQS, BullMQ), mobile apps on bad networks and payment SDKs all retry.
- **Money and trust.** Double charges and double credits cause refunds, support tickets and angry customers.
- **Safe recovery.** Once handlers are idempotent, you can replay events after an outage without fear.
- **It's how "at least once" delivery becomes "effectively once".**

## ⚠️ Common mistakes

- **"Check, then insert"** without a unique index, which still races under load.
- **Using `$inc` or "add" operations** for events that may repeat.
- **A new random idempotency key on each retry,** which defeats the purpose.
- **Saving the event id only after the work,** so a crash in between processes it again. Or saving it before, with no plan if the work fails.
- **Replying 500 for a duplicate.** The sender then keeps retrying it. Reply 200 and skip it.

## 🗣️ How to answer in an interview

> "Idempotent means repeating an operation gives the same result as doing it once. It matters because retries are normal: webhook providers deliver at least once, and if my 200 reply is lost, they send the same event again.
>
> For incoming events, I store each event id in a collection with a unique index before doing the work. If the insert fails with a duplicate-key error, I skip it and still reply 200. I don't use find-then-insert, because two copies arriving at once can both pass the check. For the work itself, I prefer set operations over increments, and a transaction or a processing status so a crash in the middle can be retried safely.
>
> For outgoing calls that move money, like creating a Stripe payment, I send an Idempotency-Key built from stable values like the subscription and billing period. Then a retry returns the first result instead of charging again."

[FILL IN: how duplicate Stripe events were handled in the auto-renewal flow you worked on. Only add it if it's true.]

## 🔁 Follow-up questions

### Which HTTP methods are idempotent?

`GET`, `HEAD`, `PUT`, `DELETE` and `OPTIONS` are defined as idempotent. `POST` and `PATCH` are not guaranteed to be. That's why risky POSTs accept an idempotency key.

### How long should you keep processed event ids?

Longer than the sender's retry window. For Stripe, that's about three days, so many teams keep them for 30 days and remove them with a TTL index.

### How would you handle a queue message that is delivered twice?

The same way: the consumer checks a unique id (the message id or a business id) before doing the work, and the work is written to be safe to repeat. See [idempotent consumers](topic:architecture/idempotent-consumers).

### What should the server return when it sees a repeated Idempotency-Key?

The **saved response from the first request**, with the same status code. If the first request is still running, a common answer is `409 Conflict`, telling the client to try again shortly.

## ✅ Quick check

### 1. Which of these operations is idempotent?

- A) `balance = balance + 100`
- B) `status = 'paid'`
- C) `orders.insert(newOrder)`

:::answer
**B.** Setting a value twice leaves it the same. A adds again each time, and C creates a new order each time.
:::

### 2. Two copies of the same webhook arrive at the same millisecond. Your code does `findOne({ eventId })`, then `create(...)`. What can go wrong?

:::answer
Both `findOne` calls can return "not found" before either insert happens, so **both process the event**. A unique index on `eventId` makes the second insert fail, so only one copy is processed.
:::

### 3. Your server times out while creating a Stripe charge and retries. How do you avoid charging twice?

:::answer
Send the **same `Idempotency-Key`** on the retry, built from stable data like the subscription id and billing period. Stripe then returns the first result instead of creating a new charge.
:::
