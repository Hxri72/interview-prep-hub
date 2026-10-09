---
template: scenario
title: Intermittent 500 errors
stack: debugging
order: 23
level: Intermediate
mustKnow: false
askedFrequency: common
summary:
  - Some requests fail with 500, most don't, and there is no clear pattern. You can't reproduce it on demand.
  - Make the invisible visible — a request ID on every log line, error tracking with stack traces, and timing for every outside call.
  - "Common causes: external API timeouts, database connection pool exhaustion, race conditions, a bad instance or bad deploy, rare data shapes (null fields)."
  - Fix with timeouts on every call, retries with backoff for safe operations, a right-sized pool, and graceful handling of odd data.
  - Prevent with alerts on error rate, structured logs and tests for the edge cases you found.
cards:
  - q: How do you debug a 500 that happens only sometimes?
    a: Correlate. Give every request an ID, log it everywhere, and use error tracking to get the stack trace. Then group failures by route, instance, time and input to find the pattern.
  - q: Name four common causes of intermittent 500s.
    a: External API timeouts, database connection pool running out, race conditions under concurrency, and rare data (like a null field) that the code doesn't handle. Also one bad instance after a deploy.
  - q: What is a request ID and why does it help?
    a: A unique ID given to each request and written in every log line for it. You can then follow one failing request across middleware, services and other APIs.
  - q: When are retries safe?
    a: For idempotent operations (reads, upserts, calls with an idempotency key), with exponential backoff and a small limit. Don't blindly retry things like "charge card".
  - q: What should every outside call have?
    a: A timeout. Without one, a slow dependency makes your requests hang and pile up, which causes more errors.
---

## 💡 What is it?

Most requests work. But **some** fail with **500 Internal Server Error**. There is no clear pattern. When you try it yourself, it works.

"Intermittent" means "comes and goes". These bugs are hard because you can't see them happen. The first job is to **collect enough information** to find the pattern.

## 🏠 Real-life example

Think of a **school bus that is sometimes late**, maybe once a week. When the principal rides it, it's always on time.

To find the cause, the principal starts a **logbook**: date, driver, route, weather, and arrival time for **every** trip.

After two weeks the pattern is clear: it's late only **on Mondays, on route 3**, because of a market on that road.

- **Late bus** = a 500 error.
- **The logbook** = structured logs with a **request ID**.
- **Finding "Mondays, route 3"** = grouping errors by route, server, time and input.
- **The market** = the real cause, like a slow external API at busy hours.

## 🔎 Detect

- **Error-rate graphs** show small spikes of 5xx responses.
- **Error tracking** (a tool that collects crashes with stack traces) shows a new or growing error.
- **Users** say "it failed, then worked when I tried again".

Collect the facts for each failure:
- Which **route**? Which **server instance**? What **time**?
- Which **user or tenant**? What **input**?
- What happened **just before** it: a deploy, a traffic spike, a dependency incident?

## 🐞 Debug

**Step 1 — Add a request ID.** Give each request a unique ID and put it on **every** log line, and in the error response. Now a user can send you the ID, and you can see the whole story of that one request. See [logging](topic:express/logging).

**Step 2 — Get the real error.** Your error handler should log the **stack trace** with the request ID, not just "500". See [error middleware](topic:express/error-middleware).

**Step 3 — Group the failures** by route, instance, time and input. Patterns tell you the cause:

| Pattern | Likely cause |
|---|---|
| Only during busy hours | Connection pool exhausted, or a dependency is slow under load |
| Only on one server | A bad instance: low disk, old code, wrong config |
| Only right after a deploy | A bug or config change in the new version |
| Only for some records | Rare data, like a `null` field or a very long string |
| Error mentions a timeout | An external API or the database is slow |
| Two updates at the same moment | A [race condition](glossary:race-condition) |

**Step 4 — Check the dependencies.** Timing logs for every outside call (database, Stripe, ATS, email) show if one of them is slow or failing.

**Step 5 — Check the connection pool.** If all database connections are busy, new queries wait and time out. Look for errors like "connection pool timeout" or "server selection timed out".

## 🔧 Fix

**Broken: no timeout, no context, raw error to the client.**

```js
app.get('/jobs/:id/ats-status', async (req, res) => {               // route that calls an outside ATS API
  const r = await fetch(`${ATS_URL}/jobs/${req.params.id}`);        // no timeout: if the ATS hangs, this request hangs
  const data = await r.json();                                      // crashes if the ATS returned an HTML error page
  res.json({ status: data.status.name });                           // crashes if status is null for some jobs → random 500s
});                                                                 // end of route
```

**Fixed: request ID, timeout, retry with backoff, safe data handling, useful error logs.**

```js
const { randomUUID } = require('node:crypto');                      // built-in function to make unique IDs

app.use((req, res, next) => {                                       // request-ID middleware, runs first
  req.id = req.headers['x-request-id'] ?? randomUUID();             // reuse the caller's ID, or make a new one
  res.setHeader('x-request-id', req.id);                            // send it back so users can quote it
  next();                                                           // continue
});                                                                 // end of middleware

async function fetchWithRetry(url, tries = 3) {                     // helper: GET with timeout and retries
  for (let i = 1; i <= tries; i++) {                                // try up to 3 times
    try {                                                           // one attempt
      const r = await fetch(url, { signal: AbortSignal.timeout(3000) }); // give up after 3000 ms (3 seconds)
      if (r.status >= 500) throw new Error(`ATS ${r.status}`);      // server-side error → worth retrying
      return r;                                                     // success (or a 4xx, which retrying won't fix)
    } catch (err) {                                                 // timeout or network error
      if (i === tries) throw err;                                   // last try failed → give up
      await new Promise((ok) => setTimeout(ok, 200 * 2 ** i));      // wait 400 ms, then 800 ms (exponential backoff)
    }                                                               // end of try/catch
  }                                                                 // end of loop
}                                                                   // end of helper

app.get('/jobs/:id/ats-status', async (req, res) => {               // same route
  let r;                                                            // will hold the ATS response
  try {                                                             // the outside call can still fail after 3 tries
    r = await fetchWithRetry(`${ATS_URL}/jobs/${req.params.id}`);   // safe to retry: it's a read (GET)
  } catch {                                                         // timeout or repeated 5xx from the ATS
    return res.status(502).json({ message: 'ATS unavailable', requestId: req.id }); // 502 = an upstream service failed
  }                                                                 // end of try/catch
  if (!r.ok) return res.status(502).json({ message: 'ATS error', requestId: req.id }); // a 4xx from the ATS: also report it as upstream
  const data = await r.json();                                      // parse the JSON
  res.json({ status: data.status?.name ?? 'unknown' });             // ?. and ?? handle a missing status safely
});                                                                 // end of route

app.use((err, req, res, next) => {                                  // error handler (4 arguments)
  console.error({ requestId: req.id, route: req.originalUrl, err }); // log the full error WITH the request ID
  res.status(500).json({ message: 'Something went wrong', requestId: req.id }); // don't leak internals; give the ID
});                                                                 // end of error handler
```

**Other fixes by cause:**
- **Pool exhausted:** make slow queries faster, then size the pool to your load (Mongoose `maxPoolSize`). See [scaling overview](topic:mongodb/scaling-overview).
- **Bad instance:** take it out of the load balancer, compare its config, redeploy.
- **Race condition:** atomic updates or a version field. See [lost update](topic:debugging/lost-update).
- **Dependency often down:** add a **circuit breaker** (stop calling it for a while after many failures) and a friendly fallback.

## 🛡️ Prevent

- **Alert on error rate** (for example "5xx above 1% for 5 minutes"), not just on single errors.
- Use **error tracking** with stack traces and request IDs.
- Write **structured logs** (JSON) with request ID, route, tenant and duration.
- Put **timeouts on every outside call**, and retries only for safe operations.
- Turn every bug you find into a **test** with that rare input.

## 🗣️ How to answer in an interview

**Short version (20 seconds):**

> "For intermittent 500s I first make them visible: a request ID on every log line, and error tracking with stack traces. Then I group failures by route, instance, time and input to find the pattern. Common causes are external API timeouts, an exhausted connection pool, race conditions, or rare null data. I fix the cause, add timeouts and safe retries, and alert on error rate."

**Full version:**

> "Intermittent errors are hard because I can't reproduce them on demand, so I start by collecting evidence. Every request gets an ID that appears in every log line and in the error response, and the error handler logs the full stack trace with that ID.
>
> Then I look for a pattern: only at busy hours points to the connection pool or a slow dependency; only on one server points to a bad instance; only after a deploy points to the new code; only for certain records points to rare data like a null field.
>
> The fixes match the cause: timeouts on every outside call, retries with exponential backoff for safe operations like reads, a right-sized connection pool and faster queries, atomic updates for race conditions, and null-safe code for odd data. To prevent it, I alert on the error rate and add a test for each edge case I find."

[FILL IN: a real intermittent error you investigated in production — what the pattern was and the fix. Only if it happened.]

## 🔁 Follow-up questions

### What is exponential backoff and why add "jitter"?

Each retry waits **longer** than the last (for example 200 ms, 400 ms, 800 ms), so you don't hammer a struggling service. **Jitter** adds a small random amount to the wait, so thousands of clients don't all retry at the exact same moment.

### Which operations are safe to retry?

**Idempotent** ones: reads (GET), upserts with `$set`, and writes protected by an idempotency key. Don't blindly retry "create order" or "charge card" — you could do it twice. See [idempotency keys](topic:rest-auth/idempotency-keys).

### 500 vs 502 vs 503 vs 504 — what's the difference?

- **500**: your own code failed.
- **502 Bad Gateway**: a service you called sent a bad reply.
- **503 Service Unavailable**: you're overloaded or down for maintenance.
- **504 Gateway Timeout**: a service you called didn't reply in time.

### What is a circuit breaker?

A wrapper around a dependency. After many failures it "opens" and **stops calling** that service for a while, returning a fallback at once. Later it tries again. This protects your app from piling up slow, failing requests.

## ✅ Quick check

### 1. Errors happen only between 10 and 11 am, when traffic is highest. What do you suspect first?

:::answer
Something that fails **under load**: the database connection pool running out, slow queries timing out, or an external API slowing down at busy times.
:::

### 2. Is it safe to automatically retry a `POST /payments/charge` call 3 times?

:::answer
**Not by itself.** If the first call actually succeeded but the reply was lost, a retry could **charge twice**. Only retry it with an **idempotency key**, so the server can recognise the repeat.
:::

### 3. What does `data.status?.name ?? 'unknown'` protect against?

:::answer
A **missing `status`** in some records. `?.` stops the crash if `status` is `null` or `undefined`, and `??` gives a default value. Without it, those rare records cause random 500s.
:::
