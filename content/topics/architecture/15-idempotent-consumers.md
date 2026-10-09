---
title: At-least-once delivery and idempotent consumers
stack: architecture
order: 15
level: Advanced
mustKnow: false
askedFrequency: common
summary:
  - Most queues and webhooks promise "at least once" delivery. A message can arrive twice, so your code must handle duplicates.
  - "An idempotent consumer gives the same result whether a message is processed once or five times."
  - "The usual tool: store each processed message id with a unique index. If the id is already there, skip the work but still reply OK."
  - "Prefer updates that are safe to repeat: $set a status is safe; $inc a balance is not."
  - "\"Exactly once\" is really at-least-once delivery plus idempotent processing."
cards:
  - q: What does at-least-once delivery mean?
    a: The system guarantees a message is delivered, but it may deliver it more than once (for example, after a timeout and a retry).
  - q: What is an idempotent consumer?
    a: A message handler that produces the same final result no matter how many times it receives the same message.
  - q: How do you make a webhook handler idempotent?
    a: Save the event id with a unique index before or with the work. If the insert fails because the id exists, skip the work and still return 200.
  - q: Why is $inc dangerous with duplicate messages?
    a: Each duplicate adds again, so the count or balance becomes wrong. $set to a final value is safe to repeat.
  - q: Can you get true exactly-once delivery?
    a: Not across a network in general. You get at-least-once delivery plus idempotent processing, which gives an "effectively once" result.
---

## 💡 What is it?

When a service sends you a message (a queue message or a webhook), it wants to be **sure** you got it. If it doesn't hear "OK" in time, it **sends it again**.

So you may receive the **same message twice**. This promise is called **at-least-once delivery**.

An **idempotent consumer** is code that is safe against this. Processing the same message twice gives **the same result** as processing it once.

## 🏠 Real-life example

Think of a **shop's delivery boy and a receipt book**.

The delivery boy brings a parcel and asks you to sign. If he isn't sure you signed, he comes back with **the same parcel** again.

A careful shopkeeper checks the **parcel number in the receipt book**:
- Not in the book → accept it, write the number down.
- Already in the book → "I already have this one," sign again, and **don't pay twice**.

Map it:
- **Delivery boy coming back** = the sender retrying.
- **Parcel number** = the message or event id.
- **Receipt book** = the "processed ids" table.
- **Signing again without paying again** = returning OK but skipping the work.

## 🧑‍💻 Code example

A payment event arrives twice. Save as `idem.js` and run `node idem.js`.

```js
const processed = new Set();                              // ids of events we already handled (in real life: a DB table with a unique index)
let balanceDays = 0;                                      // days of subscription the customer has

function handlePaymentEvent(event) {                      // our consumer
  if (processed.has(event.id)) {                          // seen this exact event before?
    console.log(`skip ${event.id} (duplicate)`);          // yes → do nothing, but still say "OK"
    return 'ok';                                          // the sender stops retrying
  }                                                       // end of the duplicate check
  balanceDays += 30;                                      // the real work: add 30 days
  processed.add(event.id);                                // remember we handled it
  console.log(`done ${event.id} → balance ${balanceDays} days`); // print the effect
  return 'ok';                                            // tell the sender it worked
}                                                         // end of handlePaymentEvent

const deliveries = [{ id: 'evt_1' }, { id: 'evt_1' }, { id: 'evt_2' }]; // evt_1 arrives twice (a retry)
deliveries.forEach(handlePaymentEvent);                   // deliver them one by one
console.log('final balance:', balanceDays, 'days');       // 60, not 90
```

**Output:**

```text
done evt_1 → balance 30 days
skip evt_1 (duplicate)
done evt_2 → balance 60 days
final balance: 60 days
```

Without the check, the customer would get 90 days. A `Set` in memory is only for the demo. Real servers restart and run as many copies, so the ids must live in a **database**.

## 🔍 Deeper version

**Delivery guarantees:**

| Guarantee | Meaning | Risk |
|---|---|---|
| At most once | send once, never retry | messages can be **lost** |
| At least once | retry until acknowledged | messages can be **duplicated** |
| Exactly once | each message processed once | not possible in general across networks |

Most real systems choose **at least once** (losing a payment event is worse than seeing it twice) and add idempotent processing.

**Why duplicates happen:**
- Your handler did the work, but the "OK" reply was lost or late. The sender retries.
- A queue worker crashed before deleting the message. It becomes visible again.
- An SQS **visibility timeout** shorter than the processing time makes the message reappear while the first worker is still working.
- Stripe retries failed webhook deliveries for up to about **3 days** in live mode.

**Ways to be idempotent:**

1. **Processed-id table with a unique index** (most common):

```js
try {                                                      // try to claim this event
  await ProcessedEvent.create({ _id: event.id });          // _id is unique, so a second insert fails
} catch (err) {                                            // the insert failed
  if (err.code === 11000) return res.sendStatus(200);      // E11000 duplicate key → already done → reply OK
  throw err;                                               // any other error → let it retry
}                                                          // end of try/catch
await renewSubscription(event.data);                       // do the real work only once
```

If the work can fail after the insert, do the insert and the work in **one transaction**, or record the id only **after** success and make the work itself safe to repeat.

2. **Naturally idempotent updates.** `$set: { status: 'active', periodEnd: X }` gives the same result every time. `$inc: { credits: 30 }` doesn't. Prefer setting final values taken from the event.

3. **Upsert on an external id.** For syncing candidates from an ATS, `updateOne({ externalId }, { $set: data }, { upsert: true })` with a unique index on `externalId` never creates duplicates.

4. **Version or timestamp checks.** Ignore an update older than what you already have. This also fixes **out-of-order** events.

5. **Queue-level dedup.** SQS FIFO queues drop a message with the same deduplication id within a **5-minute** window. It helps, but don't rely on it alone.

**Keep the handler fast.** Reply 200 quickly, then do slow work in the background (put it on a queue). Slow replies cause timeouts, and timeouts cause more retries.

**Dead-letter queue (DLQ).** After N failures, move the message aside so it doesn't block others or retry forever.

## 🎯 Why do we use it?

Money, emails and records must not be doubled. Real examples:
- A Stripe renewal event processed twice gives the customer extra days, or charges them twice.
- A "candidate applied" message processed twice sends two thank-you emails, or creates a duplicate candidate.

You can't stop the duplicates from **arriving**. You can only make your code **safe** when they do.

## ⚠️ Common mistakes

- **Trusting the sender to deliver once.** Queues and webhooks almost always say "at least once".
- **Keeping processed ids in memory.** They vanish on restart, and other server copies don't see them.
- **Returning an error for a duplicate.** The sender thinks it failed and retries again, forever. Return success.
- **Doing slow work before replying.** The sender times out, retries, and creates more duplicates.

## 🗣️ How to answer in an interview

> "Queues like SQS and webhooks like Stripe's give at-least-once delivery. If they don't get an acknowledgement in time, they send again, so the same message can arrive twice. So I make consumers idempotent: processing a message twice gives the same result as once.
>
> The usual way is to store the event id with a unique index. If the insert fails as a duplicate, I skip the work and still return 200, so the sender stops retrying. I also prefer updates that are safe to repeat, like setting a status and period end from the event, rather than incrementing a counter. For syncs, I upsert on the external id. And I reply quickly and push slow work to a queue, because slow replies cause more retries."

[FILL IN: how duplicates were handled in the Stripe renewal webhook or the ATS sync you worked on — only what's true.]

## 🔁 Follow-up questions

### Where would you store processed event ids, and for how long?

In the database, in a small collection with the event id as a unique key. Add a TTL index to delete old ids after the sender's retry window (for Stripe, a few days is enough, keep a safety margin).

### What if the work fails after you saved the event id?

Then a retry would be skipped, and the work never happens. Fix it by saving the id and doing the work in one transaction, or by saving the id only after the work succeeds (and making the work itself repeat-safe).

### How do you handle events that arrive out of order?

Compare a version or timestamp in the event with what you stored. Ignore older ones. Or, for webhooks, fetch the latest state of the object from the provider's API instead of trusting the event body.

### Isn't SQS FIFO exactly-once?

It removes duplicates **sent within 5 minutes** with the same deduplication id, and processes messages in order within a group. But your consumer can still crash after doing the work and before deleting the message, so it can still run twice. Keep the consumer idempotent anyway.

## ✅ Quick check

### 1. A webhook handler receives an event it has already processed. What should it return?

- A) 409 Conflict
- B) 500 Internal Server Error
- C) 200 OK, without doing the work again

:::answer
**C.** Return success so the sender stops retrying. An error would make it retry again and again.
:::

### 2. Which update is safe to run twice?

- A) `updateOne({ _id }, { $inc: { credits: 30 } })`
- B) `updateOne({ _id }, { $set: { plan: 'pro', periodEnd: '2026-11-09' } })`

:::answer
**B.** Setting the same final values twice gives the same result. Option A adds 30 again each time.
:::

### 3. In the code example, what would the final balance be without the `processed` check?

:::answer
**90 days.** `evt_1` would add 30 twice, and `evt_2` once.
:::
