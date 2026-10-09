---
title: "Resilience: timeouts, retries with backoff, circuit breakers"
stack: architecture
order: 17
level: Advanced
mustKnow: false
askedFrequency: common
summary:
  - Every call to another service can be slow or fail. Resilience means your app keeps working, or fails politely, when that happens.
  - "Timeouts: never wait forever. Give every outside call a time limit."
  - "Retries with exponential backoff and jitter: try again, waiting longer each time, with some randomness. Retry only temporary errors, and only safe (idempotent) operations."
  - "Circuit breaker: after many failures, stop calling the broken service for a while, fail fast, then test it again."
  - Add fallbacks (cached data, a friendly message, a queue to retry later) so users aren't stuck.
cards:
  - q: Why does every outside call need a timeout?
    a: Without one, a slow partner keeps your request (and its memory and connections) waiting. Many waiting requests can bring your whole server down.
  - q: What is exponential backoff with jitter?
    a: Each retry waits longer than the last (for example 100, 200, 400 ms), plus a random extra amount, so many clients don't all retry at the same moment.
  - q: Which errors should you retry?
    a: Temporary ones — network errors, timeouts, 429 Too Many Requests and 5xx server errors. Don't retry 400 or 401; they will fail again.
  - q: What are the three states of a circuit breaker?
    a: "Closed: calls go through. Open: calls fail fast without trying. Half-open: a few test calls go through to check if the service recovered."
  - q: Why must retried operations be idempotent?
    a: The first attempt may have worked even if you saw an error. Retrying a non-idempotent call, like a charge, could do it twice. Use idempotency keys.
---

## 💡 What is it?

Your app calls other services all the time: payment providers, ATS APIs, AI models, phone services, databases. Sometimes they are **slow** or **down**.

**Resilience** means your app keeps working, or fails politely, when that happens. Three main tools:
1. **Timeouts:** don't wait forever.
2. **Retries with backoff:** try again, but wait longer each time.
3. **Circuit breakers:** if a service keeps failing, stop calling it for a while.

## 🏠 Real-life example

Think of **calling a friend who doesn't pick up**.

- You don't keep the phone ringing for an hour. After **30 seconds you hang up**. That's a **timeout**.
- You try again after **1 minute**, then after **5 minutes**, then after **15**. You don't call 100 times in a row. That's **backoff**.
- If **everyone** in class calls at exactly 5:00, the line is jammed. So each person waits a slightly random time. That's **jitter**.
- After many failed calls, you decide: "His phone is off. I'll **stop trying for an hour** and send a message instead." That's a **circuit breaker** with a **fallback**.

Map it:
- **Hanging up after 30 seconds** = a timeout.
- **Waiting longer between calls** = exponential backoff.
- **Random waiting** = jitter.
- **Stop trying for an hour** = the circuit is open.
- **Sending a message instead** = a fallback.

## 🧑‍💻 Code example

A partner API fails twice, then works. Save as `retry.js` and run `node retry.js`.

```js
let calls = 0;                                            // how many times the fake API was called
async function flakyApi() {                               // pretend partner API: fails twice, then works
  calls++;                                                // count this call
  if (calls <= 2) throw new Error('503 Service Unavailable'); // the first two calls fail
  return 'candidate list';                                // the third call works
}                                                         // end of flakyApi

const sleep = (ms) => new Promise((r) => setTimeout(r, ms)); // wait for some milliseconds

function withTimeout(promise, ms) {                       // give up if a call takes too long
  const timer = sleep(ms).then(() => { throw new Error(`timeout after ${ms} ms`); }); // a promise that fails after ms
  return Promise.race([promise, timer]);                  // whichever finishes first wins
}                                                         // end of withTimeout

async function retry(fn, tries = 4, baseMs = 100) {       // try again with growing waits
  for (let attempt = 1; attempt <= tries; attempt++) {    // attempt 1, 2, 3, 4
    try {                                                 // try the call
      return await withTimeout(fn(), 1000);               // every attempt has its own 1-second timeout
    } catch (err) {                                       // it failed
      if (attempt === tries) throw err;                   // no tries left → give up
      const wait = baseMs * 2 ** (attempt - 1);           // 100, 200, 400… (exponential backoff)
      const jitter = Math.random() * wait;                // a random extra wait so clients don't retry together
      console.log(`attempt ${attempt} failed (${err.message}), waiting ~${wait} ms + jitter`); // explain
      await sleep(wait + jitter);                         // wait before the next try
    }                                                     // end of catch
  }                                                       // end of the loop
}                                                         // end of retry

retry(flakyApi).then((data) => console.log('success:', data, `after ${calls} calls`)); // run it
```

**Output:**

```text
attempt 1 failed (503 Service Unavailable), waiting ~100 ms + jitter
attempt 2 failed (503 Service Unavailable), waiting ~200 ms + jitter
success: candidate list after 3 calls
```

In real code, use `fetch(url, { signal: AbortSignal.timeout(3000) })` for timeouts. It really cancels the request, while `Promise.race` only stops waiting for it.

## 🔍 Deeper version

**1. Timeouts.**
- Set a timeout on **every** outside call: HTTP, database, queue, AI model.
- The total time must fit inside your own limit. If your API must answer in 10 seconds, three retries of 5 seconds each can't fit.
- A missing timeout is how one slow partner takes down your whole server: requests pile up, holding memory and connections.

**2. Retries with exponential backoff and jitter.**

| Retry? | Errors |
|---|---|
| ✅ Yes | network errors, timeouts, `429 Too Many Requests` (respect `Retry-After`), `500`, `502`, `503`, `504` |
| ❌ No | `400`, `401`, `403`, `404`, `422` — they will fail again |

- **Backoff:** wait 100 ms, 200, 400, 800… so a struggling service gets room to recover.
- **Jitter:** add randomness. Without it, 1,000 clients retry at the same moment and knock the service down again (a "thundering herd").
- **Limit** the number of tries, and the total time.
- **Retry only safe operations.** A charge might have succeeded even though you saw a timeout. Use an **idempotency key**, so the provider ignores the repeat. Stripe supports an `Idempotency-Key` header. See [idempotency keys](topic:rest-auth/idempotency-keys) and [idempotent consumers](topic:architecture/idempotent-consumers).

**3. Circuit breaker.**

```text
          many failures
 CLOSED ───────────────► OPEN ──(wait e.g. 30 s)──► HALF-OPEN
   ▲  calls go through     fail fast, no calls        a few test calls
   └────────────── test calls succeed ◄──────────────────┘
                   (test calls fail → back to OPEN)
```

- **Closed:** normal. Count failures.
- **Open:** after too many failures, fail immediately without calling. This protects your app's resources and gives the partner time to recover.
- **Half-open:** after a pause, let a few calls through. If they work, close the circuit. If not, open it again.

In Node, the `opossum` library is a popular circuit breaker.

**4. Other tools:**
- **Fallbacks:** show cached data, a default, or "we'll email you when it's ready".
- **Queue it for later:** if the ATS is down, put the sync job on a queue and retry in the background.
- **Bulkheads:** separate pools or limits per partner, so a slow AI provider doesn't use up the connections your login needs.
- **Rate limiting** your own calls, so you don't cause the partner's `429` errors.
- **Monitoring:** alert on error rate, timeouts and an open circuit.

**In a platform like SkillKeepr**, many partners are involved: Stripe, ATS providers through unified.to, OpenAI, Twilio, speech services and Claude for the voice agent. Each one can be slow or down. [FILL IN: one real case where a partner was slow or failing, and what you did — only if true.]

## 🎯 Why do we use it?

In a distributed system, **something is always failing somewhere**. Without resilience:
- one slow partner makes your whole app slow,
- your retries pile onto a struggling service and keep it down,
- users see endless spinners instead of a clear message.

With timeouts, smart retries and circuit breakers, small failures stay small, and the system heals itself when the partner recovers.

## ⚠️ Common mistakes

- **No timeout at all.** The default for many HTTP clients is to wait a very long time.
- **Retrying immediately, in a tight loop.** It hammers a service that is already struggling.
- **Retrying non-idempotent operations** (charges, emails) without an idempotency key, which causes duplicates.
- **Retrying at every layer.** If the frontend, the API and the worker each retry 3 times, one failure becomes 27 calls.

## 🗣️ How to answer in an interview

> "Any call to another service can be slow or fail, so I build in three things. First, timeouts on every outside call, so one slow partner can't tie up my server. Second, retries with exponential backoff and jitter, but only for temporary errors like timeouts, 429 and 5xx, and only for idempotent operations. For things like payments, I use idempotency keys so a retry can't charge twice. Third, a circuit breaker for partners that keep failing: after a number of failures it opens and fails fast, then half-opens to test if the service is back.
>
> On top of that, I add fallbacks. For example, if an ATS is down, I queue the sync job to retry later and show the user a clear message. And I monitor error rates and timeouts per partner."

## 🔁 Follow-up questions

### Where should retries live — frontend, API or worker?

Usually in **one** layer, close to the call. Background workers are a good place, because nobody is waiting. Avoid stacking retries in every layer, which multiplies the load.

### How do you handle `429 Too Many Requests`?

Wait for the time given in the `Retry-After` header, if present, or back off. Then slow your own call rate (queue the work and limit concurrency), so you stay under the partner's limit.

### What is a thundering herd?

Many clients retrying at exactly the same moments, for example after an outage ends. They overload the service again. Jitter spreads the retries out.

### How do you choose timeout values?

Look at the partner's normal response times (for example, p99). Set the timeout a bit above that, and make sure all retries together fit inside your own response deadline.

## ✅ Quick check

### 1. Which errors should be retried?

- A) 400 Bad Request
- B) 503 Service Unavailable
- C) 401 Unauthorized

:::answer
**B.** It's temporary. 400 and 401 will fail the same way again.
:::

### 2. Why add jitter to backoff?

:::answer
So many clients don't retry at **exactly the same time**. Without jitter, they hit the recovering service together and knock it over again.
:::

### 3. A circuit breaker is OPEN. What happens to a new call?

:::answer
It **fails fast**, without calling the broken service. After a waiting period, the breaker goes half-open and lets a few test calls through.
:::
