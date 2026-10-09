---
title: "Webhooks: what they are and how to receive them"
stack: rest-auth
order: 21
level: Intermediate
mustKnow: true
askedFrequency: very common
summary:
  - A webhook is an HTTP POST that another service sends to YOUR server when something happens — like Stripe telling you "the invoice was paid".
  - It's the opposite of polling. Instead of asking "anything new?" again and again, you get a message the moment it happens.
  - "Receiving one well: verify it's real (signature), reply 2xx quickly, then do the slow work in the background."
  - Senders retry when you're slow or down, so the same event can arrive twice. Make your handler idempotent (skip event ids you've already processed).
  - Events can also arrive out of order. Don't trust the order; re-read the latest state from the provider's API when it matters.
cards:
  - q: What is a webhook?
    a: An HTTP request (usually POST with JSON) that another service sends to a URL on your server when an event happens, so you don't have to keep asking for updates.
  - q: Webhook vs polling?
    a: Polling means you call their API again and again to check for changes. A webhook means they call you once, when the change happens. Webhooks are faster and use fewer requests.
  - q: Why should a webhook handler reply quickly?
    a: Senders wait only a few seconds. If you're slow, they mark it as failed and retry, which causes duplicates. So reply 200 fast and do heavy work in a background job.
  - q: Can the same webhook event arrive twice?
    a: Yes. Most providers promise "at least once" delivery and retry on timeouts or errors. Store processed event ids and skip repeats.
  - q: How do you know a webhook really came from Stripe and not an attacker?
    a: Verify the signature header with the shared signing secret, using the raw request body. Reject anything that doesn't match.
---

## 💡 What is it?

A **[webhook](glossary:webhook)** is an **HTTP request that another service sends to your server** when something happens.

For example, when a customer's subscription renews, **Stripe sends a POST** to `https://your-api.com/webhooks/stripe`. The JSON body says what happened: `invoice.paid`.

You give the provider a **URL** once. After that, they **call you** whenever an [event](glossary:event) happens. You don't need to keep asking them.

## 🏠 Real-life example

Think of **waiting for exam results**.

- **Polling** = you call the school office every hour: "Are the results out?" Most calls are wasted.
- **Webhook** = you leave your phone number at the office. **They call you** the moment the results are out.

- The **school office** = the other service (Stripe, an ATS, GitHub).
- **Your phone number on their list** = the webhook URL you registered.
- **Their phone call** = the POST request to your server.
- **Checking it's really the school calling** = verifying the signature.
- **Saying "thanks, got it!" quickly and hanging up** = replying 200 fast.
- **Telling your family afterwards** = doing the slow work in the background.
- **If you don't pick up, they call again** = retries, which is why the same news can come twice.

## 🧑‍💻 Code example

Make a folder, run `npm init -y` and `npm install express`. Save this as `webhook.js` and run `node webhook.js`. It starts a receiver, then pretends to be the other service sending one event.

```js
const express = require('express');                            // load Express
const app = express();                                         // create the app
app.use(express.json());                                       // read JSON bodies

const jobs = [];                                               // a pretend background queue

app.post('/webhooks/ats', (req, res) => {                      // the URL we give to the other service
  const event = req.body;                                      // the event they sent us
  console.log('received', event.type, event.id);               // log what arrived
  jobs.push(event);                                            // save it for later work
  res.sendStatus(200);                                         // reply 200 FAST, so the sender doesn't retry
  setImmediate(() => {                                         // do the slow work after replying
    const e = jobs.shift();                                    // take the event from the queue
    console.log('processed', e.type, 'for', e.data.email);     // pretend to update our database
  });                                                          // end of setImmediate
});                                                            // end of the route

const server = app.listen(3102, async () => {                  // start on port 3102
  const res = await fetch('http://localhost:3102/webhooks/ats', { // pretend to be the ATS sending a webhook
    method: 'POST',                                            // webhooks are POST requests
    headers: { 'Content-Type': 'application/json' },           // the body is JSON
    body: JSON.stringify({ id: 'evt_1', type: 'candidate.created', data: { email: 'asha@example.com' } }), // the event
  });                                                          // end of fetch
  console.log('sender got', res.status);                       // the sender only cares about 2xx
  setTimeout(() => server.close(), 50);                        // stop after the background work finishes
});                                                            // end of listen
```

**Output:**

```text
received candidate.created evt_1
processed candidate.created for asha@example.com
sender got 200
```

This example skips the signature check to stay short. A real receiver must always check it first. See [verifying webhook signatures](topic:rest-auth/webhook-signatures).

## 🔍 Deeper version

**What a provider usually sends:**
- A `POST` with a JSON body: an **event id**, a **type** (like `invoice.paid`), a **timestamp** and the **data**.
- A **signature header** (like `Stripe-Signature`), so you can prove it's real.
- **Retries** if you don't reply with 2xx in time. Stripe, for example, retries with backoff for up to about three days.

**A production-ready receiver does these steps:**
1. **Verify the signature** using the **raw body** and your signing secret. If it fails, reply 400.
2. **Check for duplicates.** Look up the event id. If you've already processed it, reply 200 and stop. See [idempotency keys](topic:rest-auth/idempotency-keys).
3. **Store or queue the event** (for example in a database table or a queue like SQS or BullMQ).
4. **Reply 2xx fast**, within a few seconds.
5. **Process in the background**: update your database, send emails, and so on. Retry failures there, not by making the sender retry.

**Delivery is "at least once", not "exactly once".** Networks fail. If your 200 reply gets lost, the sender thinks you failed and sends the event again. So your handler **must be safe to run twice**.

**Order isn't guaranteed.** `customer.subscription.updated` might arrive before `customer.subscription.created`. Ways to handle it:
- Use the event's timestamp, and ignore events older than what you already stored.
- Or, when an event arrives, **fetch the current object from the provider's API** and save that. The latest state is always right.

**Status codes matter:**
- **2xx**: "got it". The sender won't retry.
- **4xx/5xx or a timeout**: "failed". The sender will retry.
- So don't reply 500 for events you simply don't care about. Reply 200 and ignore them.

**Don't trust it, double-check it.** For money events, many teams treat the webhook as a **signal**. They then call the provider's API to read the real status before giving access.

**Webhooks + a backup cron.** If your server is down longer than the retry window, events are lost. A scheduled job that compares your data with the provider (for example "which subscriptions renewed today?") catches anything you missed.

**Testing webhooks locally:** use the provider's CLI (like `stripe listen --forward-to localhost:3000/webhooks/stripe`) or a tunnel like ngrok. Stripe also has **Test Clocks**, which let you move time forward to trigger renewal events in minutes instead of a month.

## 🎯 Why do we use it?

- **Instant updates.** You learn about a payment or a new candidate right away, not on the next poll.
- **Less waste.** No thousands of "anything new?" calls that return nothing. That also helps you stay under the provider's rate limits.
- **Event-driven design.** Other systems can react to events without being tightly connected to each other. See [event-driven architecture](topic:architecture/event-driven).
- **Some things only come as webhooks,** like Stripe's automatic renewal results.

## ⚠️ Common mistakes

- **Not verifying the signature.** Anyone who finds your URL could send fake "payment succeeded" events.
- **Doing slow work before replying** (sending emails, calling other APIs). The sender times out and retries, and you get duplicates.
- **Not handling duplicates.** A retry gives the customer two credits or sends two emails.
- **Parsing the body as JSON before checking the signature.** Signature checks need the exact raw bytes.
- **Assuming events arrive in order.**

## 🗣️ How to answer in an interview

> "A webhook is an HTTP POST that another service sends to my server when an event happens, so I don't have to poll their API. For example, Stripe sends invoice.paid when a subscription renews.
>
> When I build a receiver, I first verify the signature using the raw request body and the signing secret. Then I check the event id against the events I've already processed, because delivery is at least once and retries can send duplicates. I store or queue the event and reply 200 quickly. The real work, like updating the subscription or sending emails, happens in the background.
>
> I also don't trust the order of events, and for important things I re-read the latest state from the provider's API. A backup cron job can catch events missed during a long outage."

At SkillKeepr, I worked on the **Stripe auto-renewal** part, which is triggered by webhooks. I tested it with Stripe Test Clocks. [FILL IN: which events the renewal flow handles, and how duplicates were handled.]

## 🔁 Follow-up questions

### What happens if your server is down when the webhook is sent?

The provider retries with increasing delays (Stripe keeps trying for up to about three days). If you're down longer, events are lost. That's why a backup job that compares your data with the provider is useful.

### Why reply 200 even for event types you don't use?

If you reply with an error, the provider keeps retrying an event you'll never handle. That wastes work, and some providers disable webhook endpoints that fail too often.

### Webhooks or polling — when would you still poll?

When the provider has no webhooks, when you can't expose a public URL, or as a safety net to catch missed events. Some integrations also use a manual "sync" button that pulls the latest data on demand.

### How do you test webhooks on your laptop?

Use the provider's CLI to forward events (for example `stripe listen`), or a tunnel like ngrok. You can also replay saved test events against your local server.

## ✅ Quick check

### 1. Your webhook handler takes 40 seconds because it sends emails before replying. What will most likely happen?

:::answer
The sender times out and **retries**. You may process the same event several times, like sending duplicate emails. Reply 200 first, then send emails in a background job.
:::

### 2. True or false: if you reply 200, the provider guarantees it will never send that event again.

:::answer
**False.** Delivery is "at least once". If your 200 reply is lost on the network, the event is sent again. Always make handlers safe to run twice.
:::

### 3. Which should come first in a webhook handler?

- A) Update the database
- B) Verify the signature
- C) Send a confirmation email

:::answer
**B.** Prove the request is real first. Otherwise an attacker could trigger database changes with fake events.
:::
