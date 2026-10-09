---
title: "Reliability: timeouts, retries, circuit breakers"
stack: system-design
order: 14
level: Intermediate
mustKnow: false
askedFrequency: common
summary:
  - In a system design answer, show what happens when each part is slow or down.
  - Every network call gets a timeout, safe retries with backoff, and a fallback.
  - A circuit breaker stops calling a broken dependency for a while, so failures don't spread.
  - Remove single points of failure with more than one instance, health checks and failover.
  - Use queues to absorb spikes and retry later, and monitor error rate and latency.
cards:
  - q: What is a single point of failure?
    a: One part that, if it breaks, takes down the whole system — like one database server with no replica, or one app server.
  - q: Why add a timeout to every outside call?
    a: Without it, a slow dependency keeps your requests waiting. They pile up and use all your connections and memory.
  - q: What is a cascading failure?
    a: One slow or broken service makes the services that call it slow, which makes their callers slow, until everything is down.
  - q: What is graceful degradation?
    a: When a non-critical part fails, the app keeps working without it — for example showing cached results or hiding recommendations.
  - q: What does "99.9% availability" mean in time?
    a: About 43 minutes of downtime a month, or about 8.8 hours a year.
---

## 💡 What is it?

**Reliability** means the system keeps working, or fails politely, when parts break.

In a system design interview, the interviewer will ask: "What if this is slow? What if this is down?" You answer with a few standard tools:
- **Timeouts** — don't wait forever.
- **Retries with backoff** — try again, carefully.
- **Circuit breakers** — stop calling something that keeps failing.
- **Redundancy** — more than one copy of each important part.

The code-level details are in [resilience](topic:architecture/resilience). This page is about using them in a design.

## 🏠 Real-life example

Think of a **school bus service**.

- The bus waits at each stop for **2 minutes only**. It doesn't wait forever for one late student. That is a **timeout**.
- If the road is blocked, the driver **tries again later**, not every 5 seconds. That is a **retry with backoff**.
- If a bridge is closed, the driver **stops trying that route for the day** and uses another road. That is a **circuit breaker**.
- The school has **two buses**, so one breakdown doesn't stop everyone. That is **redundancy**.

Map it:
- **2-minute wait** = a timeout.
- **Trying later** = retry with backoff.
- **Avoiding the closed bridge** = an open circuit breaker.
- **Second bus** = a second instance (no single point of failure).
- **Another road** = a fallback.

## 🧑‍💻 Code example

A slow partner service, a 200 ms timeout, retries with backoff and a fallback. Save as `reliable.js` and run `node reliable.js`.

```js
function withTimeout(promise, ms) {                         // fail if a promise takes longer than ms
  const timer = new Promise((_, reject) =>                  // a promise that only rejects
    setTimeout(() => reject(new Error(`timeout after ${ms}ms`)), ms)); // ...after ms milliseconds
  return Promise.race([promise, timer]);                    // whichever finishes first wins
}                                                           // end of withTimeout

let attempt = 0;                                            // counts calls to the fake service
function slowService() {                                    // fake partner: slow twice, then fast
  attempt++;                                                // count this call
  const delay = attempt <= 2 ? 500 : 50;                    // first two calls take 500ms, then 50ms
  return new Promise((resolve) => setTimeout(() => resolve('OK'), delay)); // answer after the delay
}                                                           // end of slowService

async function callWithRetry(retries) {                     // try up to `retries` extra times
  for (let i = 0; i <= retries; i++) {                      // first try + retries
    try {                                                   // one attempt
      const result = await withTimeout(slowService(), 200); // give each try only 200ms
      console.log(`try ${i + 1}: ${result}`);               // it worked
      return result;                                        // stop trying
    } catch (err) {                                         // this try failed
      const wait = 100 * 2 ** i;                            // backoff: 100, 200, 400 ms ...
      console.log(`try ${i + 1}: ${err.message}, waiting ${wait}ms`); // explain what happened
      await new Promise((r) => setTimeout(r, wait));        // wait before the next try
    }                                                       // end of try/catch
  }                                                         // end of loop
  return 'fallback: show cached data';                      // all tries failed → fail politely
}                                                           // end of callWithRetry

callWithRetry(3).then((r) => console.log('final:', r));     // run it
```

**Output:**

```text
try 1: timeout after 200ms, waiting 100ms
try 2: timeout after 200ms, waiting 200ms
try 3: OK
final: OK
```

If all four tries had failed, the user would get the fallback instead of an error.

## 🔍 Deeper version

**A reliability checklist for any design:**

| Risk | Tool |
|---|---|
| One app server dies | Several instances behind a [load balancer](topic:system-design/load-balancers-stateless) with health checks |
| Database server dies | Replicas with automatic failover. See [database scaling](topic:system-design/database-scaling) |
| Partner API is slow | Timeouts on every call, then retries with backoff + jitter |
| Partner API is down | Circuit breaker + fallback, or a [queue](topic:system-design/queues-background-jobs) to retry later |
| Traffic spike | Queues, autoscaling, [rate limiting](topic:system-design/rate-limiting) |
| Duplicate messages from retries | Idempotency keys. See [idempotency keys](topic:rest-auth/idempotency-keys) |
| A whole region goes down | Backups in another region; multi-region only if the business needs it |

**Timeouts must get shorter as you go deeper.** If the API Gateway times out at 29 s, your function must give up on a partner earlier, maybe at 5–10 s. Otherwise the user gets a gateway error while your code still waits.

**Retry rules:** retry only temporary errors (network errors, timeouts, 429, 5xx). Add **jitter** (random wait) so all clients don't retry together. Cap total retries, because retries **multiply load** on a struggling service.

**Bulkheads.** Give each dependency its own limited pool of connections or workers. If one partner hangs, it uses only its own pool, not all of them.

**Graceful degradation.** Decide what is critical. Login and payments must work. Recommendations can disappear for a while.

**Measure it.** Health-check endpoints, error rate, latency (p95/p99), queue age, and alerts. Common targets:

| Availability | Downtime per month |
|---|---|
| 99% | about 7.2 hours |
| 99.9% | about 43 minutes |
| 99.99% | about 4.3 minutes |

## 🎯 Why do we use it?

Everything fails sometimes: networks, partners, disks, deploys. A reliable design keeps one failure small. Users see a slower feature or a polite message, not a dead app.

## ⚠️ Common mistakes

- **No timeout.** One slow partner freezes all requests.
- **Retrying everything at once with no backoff.** Retry storms knock the partner down again.
- **Retrying non-idempotent writes.** Double charges and duplicate records.
- **One instance of anything important.** One crash means full downtime.

## 🗣️ How to answer in an interview

> "For each component I ask: what if it's slow, and what if it's down? Every outside call gets a timeout that is shorter than the caller's timeout. Temporary errors are retried with exponential backoff and jitter, and only for idempotent operations or with an idempotency key. If a dependency keeps failing, a circuit breaker opens, so we fail fast and show a fallback, like cached data.
>
> I avoid single points of failure with several app instances behind a load balancer and database replicas with failover. Slow or risky work goes through a queue, so it can retry later. And I monitor error rate, latency and queue age, with alerts."

## 🔁 Follow-up questions

### How do you choose a timeout value?

Look at the dependency's normal latency, for example its p99, and add a margin. It must also fit inside the caller's own timeout budget.

### What is a health check?

An endpoint like `/health` that the load balancer calls. If an instance fails it, traffic stops going there until it recovers.

### Circuit breaker vs retry?

Retries handle short glitches. A circuit breaker handles longer outages by stopping calls for a while. Use both: retry a little, then let the breaker open.

## ✅ Quick check

### 1. The API Gateway timeout is 29 seconds. Your function calls a partner with a 60-second timeout. What goes wrong?

:::answer
The gateway gives up first and returns an error, while your code is still waiting. The partner timeout must be shorter than 29 seconds, with time left to respond.
:::

### 2. Which errors are safe to retry: 400, 401, 503, timeout?

:::answer
**503 and timeout.** They are temporary. 400 and 401 will fail the same way again.
:::

### 3. What is a single point of failure in "one app server + one database"?

:::answer
**Both.** If either the app server or the database dies, the whole system stops. Add more app instances and a database replica with failover.
:::
