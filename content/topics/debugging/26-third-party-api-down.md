---
title: A third-party API (Stripe, Twilio, an ATS) is down or slow
template: scenario
stack: debugging
order: 26
level: Intermediate
mustKnow: true
askedFrequency: very common
summary:
  - Every call to an outside service needs a timeout. Without one, your request can hang for a very long time.
  - Retry only safe, temporary errors (timeouts, 429, 5xx). Wait longer each time (exponential backoff) and add a little randomness (jitter).
  - A circuit breaker stops calling a service that keeps failing, so your app fails fast instead of piling up.
  - Work that can wait (sync, emails, imports) goes into a queue and is retried later.
  - Tell the user clearly what happened. Never show a spinning wheel forever.
cards:
  - q: An outside API is slow and your endpoint hangs. First fix?
    a: Add a timeout to every outside call, for example with AbortSignal.timeout(5000), so one slow service can't hang your request.
  - q: What is exponential backoff with jitter?
    a: "After each failed try, wait longer (1s, 2s, 4s…) and add a small random extra. The randomness stops all clients from retrying at the same moment."
  - q: Which errors should you retry?
    a: "Temporary ones: timeouts, network errors, 429 Too Many Requests and 5xx. Never retry 400, 401, 403 or 404 — they will fail again."
  - q: What does a circuit breaker do?
    a: It counts failures. After too many, it "opens" and fails fast for a while without calling the service. Then it lets one test call through to see if the service is back.
  - q: Is it safe to retry a payment call?
    a: Only with an idempotency key, so the provider knows the second call is the same request and doesn't charge twice.
---

## 💡 What is it?

Your app depends on **outside services**. For example: Stripe for payments, Twilio for phone calls, or an ATS (applicant tracking system) like Greenhouse.

One day that service is **down or very slow**. Now your own [API](glossary:api) becomes slow too. Requests hang. Users see errors or a spinner that never stops.

The bug is not in the outside service. The bug is that **your code trusts it too much**.

## 🏠 Real-life example

Think of a **school canteen that buys bread from one bakery**.

One morning, the bakery is late. The canteen staff just stand and wait at the door. The whole lunch queue stops. Nobody gets anything, not even tea.

A smart canteen does this instead:
- **Wait only 10 minutes** for the bakery = a **timeout**.
- If the bakery is late, **call again after a short wait**, then a longer wait = **retry with backoff**.
- If the bakery was late **every day this week**, stop calling for now and serve rice instead = a **circuit breaker** and a **fallback**.
- **Write down the bread order** and collect it in the afternoon = a **queue**.
- **Put up a notice**: "Bread is late today" = a **clear message to the user**.

## 🔎 Detect

You usually notice it in one of these ways:

- **Error spikes** in your logs, all for one outside service. For example, many `ETIMEDOUT` or `503` errors when calling Stripe.
- **Slow responses** on endpoints that call that service, while other endpoints are fine.
- **Users complain** that one feature hangs, like "Sync candidates" or "Pay now".
- The provider's **status page** (like status.stripe.com) shows an incident.

The key clue: **only the endpoints that call that service are slow.** Everything else is normal.

## 🐞 Debug

1. **Find the slow step.** Add timing logs around each outside call. Log how long it took and the status code.
2. **Check the error type.** Is it a timeout? A `429` (you sent too many requests)? A `5xx` (their server failed)? Or a `4xx` (your request is wrong)?
3. **Check their status page** and your account dashboard for incidents or rate limits.
4. **Check your own timeouts.** Many HTTP clients wait a very long time by default. If your code has no timeout, one slow call can hold a request open for minutes.
5. **Check what piles up.** Slow outside calls keep connections and memory busy. Under load, this can make your whole server slow.

## 🔧 Fix

**Before:** no timeout, no retry, no plan.

```js
// ❌ BEFORE — trusts the outside API completely
async function getAtsCandidates(jobId) {                          // fetch candidates for one job from the ATS
  const res = await fetch(`https://ats.example.com/jobs/${jobId}/candidates`); // no timeout: can wait for minutes
  return res.json();                                              // even a 500 error page is treated as data
}                                                                 // end of getAtsCandidates
```

**After:** timeout + retry with backoff and jitter + a simple circuit breaker.

```js
// ✅ AFTER — fails fast, retries safely, and stops hammering a broken service
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));      // helper: wait for ms milliseconds

const breaker = { failures: 0, openUntil: 0 };                     // circuit breaker state for this one service
const MAX_FAILURES = 5;                                            // 5 failures in a row → open the circuit
const COOL_DOWN_MS = 30_000;                                       // stay open for 30 seconds before trying again

async function callWithRetry(url, tries = 3) {                     // call url, up to 3 tries
  if (Date.now() < breaker.openUntil) {                            // circuit is open right now
    throw new Error('ATS unavailable, try later');                 // fail fast without calling the service
  }                                                                // end of the open-circuit check
  for (let attempt = 1; attempt <= tries; attempt++) {             // try 1, 2, 3
    try {                                                          // anything inside can throw
      const res = await fetch(url, { signal: AbortSignal.timeout(5000) }); // give up after 5 seconds
      if (res.status === 429 || res.status >= 500) {              // 429 = too many requests, 5xx = their server failed
        throw new Error(`Retryable status ${res.status}`);         // temporary problem → worth retrying
      }                                                            // end of the retryable-status check
      if (!res.ok) {                                               // other 4xx = our request is wrong
        breaker.failures = 0;                                      // the service answered, so it is up
        throw Object.assign(new Error(`Bad request ${res.status}`), { noRetry: true }); // retrying won't help
      }                                                            // end of the 4xx check
      breaker.failures = 0;                                        // success → reset the failure count
      return await res.json();                                     // return the real data
    } catch (err) {                                                // a timeout, network error or our thrown errors
      if (err.noRetry) throw err;                                  // don't retry a bad request
      breaker.failures++;                                          // count one more failure
      if (breaker.failures >= MAX_FAILURES) {                      // too many failures in a row
        breaker.openUntil = Date.now() + COOL_DOWN_MS;             // open the circuit for 30 seconds
      }                                                            // end of the breaker update
      if (attempt === tries) throw err;                            // last try failed → give up
      const backoff = 500 * 2 ** (attempt - 1);                    // 500ms, then 1000ms, then 2000ms
      const jitter = Math.random() * 250;                          // up to 250ms of random extra wait
      await sleep(backoff + jitter);                               // wait before the next try
    }                                                              // end of catch
  }                                                                // end of the retry loop
}                                                                  // end of callWithRetry
```

**In the route:** show a clear message, or queue the work for later.

```js
app.post('/jobs/:id/sync', async (req, res) => {                   // the "Sync candidates" button calls this
  try {                                                            // the outside call can fail
    const data = await callWithRetry(`https://ats.example.com/jobs/${req.params.id}/candidates`); // safe call
    res.json({ synced: data.length });                             // success → tell the UI how many came in
  } catch (err) {                                                  // the ATS is down even after retries
    await syncQueue.add({ jobId: req.params.id });                 // save the job to retry later in the background
    res.status(503).json({ message: 'The ATS is not responding. We will sync automatically soon.' }); // clear message
  }                                                                // end of catch
});                                                                // end of the route
```

`503` means "service unavailable, try again later". `syncQueue` is any job queue, like BullMQ or SQS.

## 🛡️ Prevent

- **A timeout on every outside call.** Make it a rule in code review.
- **One shared HTTP helper** for each outside service, with timeout, retry and logging built in. Then nobody forgets.
- **Idempotency keys** for anything that changes data, like payments. Then a retry can't charge twice. See [idempotency keys](topic:rest-auth/idempotency-keys).
- **Queues for work that can wait**, like ATS syncs, emails and imports. See [queues and background jobs](topic:system-design/queues-background-jobs).
- **Monitoring:** alert when the error rate or response time for one provider goes up.
- **Webhooks over polling** where the provider supports them, so you depend on fewer live calls. See [webhooks](topic:rest-auth/webhooks).

## 🗣️ How to answer in an interview

**Short version (20 seconds):**

> "First I confirm it's the outside service, using logs and their status page. Then I protect my app: a timeout on every call, retries with exponential backoff and jitter for temporary errors only, a circuit breaker to fail fast, and a queue for work that can wait. The user gets a clear message instead of a hanging page."

**Full version:**

> "I'd notice it as an error spike in the logs for one provider, and slow responses only on the endpoints that call it. I check their status page, and I check the error types — timeouts, 429s and 5xx are temporary, but 4xx means my request is wrong.
>
> To fix it, every outside call gets a timeout, for example `AbortSignal.timeout` with fetch. I retry only temporary errors, with exponential backoff and jitter, so many clients don't retry at the same moment. For payments I always send an idempotency key, so a retry can't charge twice. A circuit breaker stops calling a service that keeps failing, so my app fails fast instead of piling up open requests.
>
> Work that doesn't need to happen right now, like syncing candidates from an ATS, goes into a queue and runs later. And the user sees a clear message, like 'the ATS is not responding, we'll sync soon'."

[FILL IN: a real time an outside service (Stripe, Twilio, unified.to, Google speech) was slow or down for you, and what you did. Only if true.]

## 🔁 Follow-up questions

### Why add jitter? Isn't backoff enough?

If 1,000 clients fail at the same moment, they all retry after exactly 1 second. That is a new spike, which can knock the service down again. Jitter spreads the retries out, so the service can recover.

### How many times should you retry?

Usually 2–3 times for a user request, because the user is waiting. Background jobs can retry more times over a longer period, for example over an hour.

### Circuit breaker vs retry — what's the difference?

A retry handles **one** request that failed. A circuit breaker looks at **many** requests. If a service keeps failing, it stops all calls for a while. They work together: retry for short blips, breaker for real outages.

### What if the outside service rate-limits you (429)?

Slow down. Read the `Retry-After` header if they send it, and wait that long. Also check if you call too often — batch requests or cache results.

### Where should the timeout value come from?

From the provider's normal response time, plus a margin. If Stripe usually answers in 300ms, a 5–10 second timeout is plenty. Keep it below your own endpoint's limit.

## ✅ Quick check

### 1. Which of these should you retry?

- A) `400 Bad Request`
- B) `503 Service Unavailable`
- C) `401 Unauthorized`

:::answer
**B.** `503` is temporary — the server may be back soon. `400` and `401` will fail the same way every time, so retrying wastes time.
:::

### 2. With `500 * 2 ** (attempt - 1)`, how long is the base wait before the 3rd try?

:::answer
**1000ms.** The wait happens after a failed try. After try 1 fails: `500 * 2**0 = 500ms`. After try 2 fails: `500 * 2**1 = 1000ms`. Then the 3rd try runs. Jitter adds up to 250ms on top.
:::

### 3. True or false: retrying a "create payment" call is always safe.

:::answer
**False.** If the first call actually worked but the answer was lost, a retry can charge twice. Send an **idempotency key** so the provider treats both calls as one.
:::
