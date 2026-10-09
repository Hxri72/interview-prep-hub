---
title: Rate limiting
stack: system-design
order: 13
level: Intermediate
mustKnow: false
askedFrequency: common
summary:
  - Rate limiting caps how many requests a user, IP or API key can make in a time window. Extra requests get 429 Too Many Requests.
  - It protects the server from abuse, brute-force logins, bugs in clients, and noisy tenants.
  - "Common algorithms: fixed window, sliding window and token bucket (allows short bursts)."
  - With many servers, keep the counters in a shared store like Redis, not in each server's memory.
  - Tell clients when to retry with the Retry-After and RateLimit headers.
cards:
  - q: What status code does a rate limiter return?
    a: 429 Too Many Requests, often with a Retry-After header saying how many seconds to wait.
  - q: How does a token bucket work?
    a: Each user has a bucket of tokens that refills at a steady rate. Each request takes one token. If the bucket is empty, the request is rejected. A full bucket allows a short burst.
  - q: What is the problem with a fixed window?
    a: A user can send the full limit at the end of one window and again at the start of the next, so double the limit in a few seconds.
  - q: Why store rate-limit counters in Redis?
    a: With several server instances, each would have its own counter in memory. Redis gives all instances one shared counter.
  - q: What should you rate limit by?
    a: It depends — IP for login and public pages, user ID or API key for logged-in APIs, and tenant ID to stop one company using everything.
---

## 💡 What is it?

**Rate limiting** sets a maximum number of requests in a time window. For example: "10 login tries per minute per IP".

Requests above the limit get **[429 Too Many Requests](glossary:status-code)**. The client must wait and try later.

## 🏠 Real-life example

Think of a **water cooler at school with a cup dispenser**.

- The dispenser holds **5 cups**.
- The canteen adds **1 new cup every minute**.
- Each drink uses one cup.
- If a group arrives together, the first 5 drink at once. The rest must **wait** for new cups.
- One greedy student can't drink 100 cups, because cups come slowly.

Map it:
- **Cups** = tokens.
- **Dispenser** = the token bucket.
- **New cup every minute** = the refill rate.
- **5 friends drinking at once** = a burst.
- **"Wait for a cup"** = 429 Too Many Requests.

## 🧑‍💻 Code example

A token bucket with 5 tokens that refills 1 token per second. Time is passed in, so the result is the same every run. Save as `bucket.js` and run `node bucket.js`.

```js
function createBucket(capacity, refillPerSecond) {         // make a token bucket for one user
  let tokens = capacity;                                    // start full: e.g. 5 tokens
  let last = 0;                                             // time (in seconds) of the last check
  return function allow(now) {                              // call this for every request; now = time in seconds
    tokens = Math.min(capacity, tokens + (now - last) * refillPerSecond); // add tokens for the time that passed
    last = now;                                             // remember this time for next call
    if (tokens >= 1) { tokens -= 1; return true; }          // a token is free → take it, allow the request
    return false;                                           // no token → reject (HTTP 429)
  };                                                        // end of allow
}                                                           // end of createBucket

const allow = createBucket(5, 1);                           // 5 tokens max, 1 new token every second
const times = [0, 0, 0, 0, 0, 0, 0.5, 1, 3];                // when each request arrives (seconds)
for (const t of times) {                                    // send each request at its time
  console.log(`t=${t}s ->`, allow(t) ? '200 OK' : '429 Too Many Requests'); // show the result
}                                                           // end of loop
```

**Output:**

```text
t=0s -> 200 OK
t=0s -> 200 OK
t=0s -> 200 OK
t=0s -> 200 OK
t=0s -> 200 OK
t=0s -> 429 Too Many Requests
t=0.5s -> 429 Too Many Requests
t=1s -> 200 OK
t=3s -> 200 OK
```

Five requests pass as a burst. The sixth is rejected. At 0.5 s there is only half a token. At 1 s a full token is back.

## 🔍 Deeper version

**The main algorithms:**

| Algorithm | How it works | Good | Bad |
|---|---|---|---|
| **Fixed window** | count requests per minute (12:00–12:01) | simplest, one counter | bursts at window edges (double limit) |
| **Sliding window log** | store a timestamp per request, count the last 60 s | exact | stores many timestamps |
| **Sliding window counter** | mix this window and last window by weight | close to exact, cheap | small estimate error |
| **Token bucket** | tokens refill steadily; each request takes one | allows bursts, smooth average | two values per key |
| **Leaky bucket** | requests leave a queue at a fixed rate | very smooth output | adds waiting |

**Many servers → shared counters.** If each instance keeps counters in memory, a user gets the limit **per instance**. Keep counters in **Redis**:
- Fixed window: `INCR key` then `EXPIRE key 60`. If the count is above the limit, reject.
- Token bucket or sliding window: use a small Lua script, so read-and-update is atomic.
- Libraries: `express-rate-limit` with a Redis store, or `rate-limiter-flexible`. See [security middleware](topic:express/security-middleware).

**Where to rate limit:**
- **At the edge** (API Gateway throttling, a WAF, a CDN) — stops floods before they reach your code.
- **In the app** — fine-grained rules per user, route or tenant.
- **For partners you call** — limit yourself so you stay under *their* rate limit (often with a queue).

**What key to use:** IP for login and public endpoints. User ID or API key for logged-in APIs. Tenant ID to stop one company slowing down everyone else in a [multi-tenant](glossary:multi-tenant) system.

**Good responses:** return `429` with `Retry-After: 30`. Newer `RateLimit` headers tell clients how much they have left.

## 🎯 Why do we use it?

- Stop **brute-force** login attempts. See [login brute force](topic:debugging/login-brute-force).
- Stop one buggy client in a loop from taking the server down.
- Keep things **fair** between users and tenants.
- Control **cost** for expensive endpoints, like AI calls.

## ⚠️ Common mistakes

- **In-memory counters with many instances.** The real limit becomes limit × number of servers.
- **Limiting only by IP.** Many users share one office IP. Attackers rotate IPs.
- **No Retry-After.** Clients retry at once and make it worse.
- **Same limit for every route.** Login needs a strict limit. A cheap read can allow more.

## 🗣️ How to answer in an interview

> "Rate limiting caps requests per key in a time window and returns 429 with a Retry-After header. I usually use a token bucket, because it allows short bursts but keeps the average rate fixed. A fixed window is simpler but lets users double the limit at the window edge.
>
> With several server instances, I keep the counters in Redis so all instances share them, with atomic updates. I choose the key per route: IP for login, user or API key for normal APIs, and tenant ID so one customer can't slow down others. I also add coarse limits at the edge, like API Gateway throttling or a WAF.
>
> [FILL IN: any rate limit you added or saw in your work, if true.]"

## 🔁 Follow-up questions

### How would you rate limit a login endpoint?

A strict limit per IP and per email (for example 5 tries per 15 minutes). After that, add a delay, a CAPTCHA or a short lockout. Alert on spikes.

### How do you rate limit yourself when calling a partner API?

Put calls in a queue and process them at the partner's allowed rate. Respect their 429 and Retry-After. See [third-party API down](topic:debugging/third-party-api-down).

### Token bucket vs leaky bucket?

A token bucket allows bursts up to the bucket size. A leaky bucket sends requests out at a fixed steady rate, so it smooths bursts by making them wait.

## ✅ Quick check

### 1. A fixed window allows 100 requests per minute. How many can a user send between 12:00:59 and 12:01:01?

:::answer
**Up to 200.** 100 at the end of the first window and 100 at the start of the next. That edge burst is the main weakness of a fixed window.
:::

### 2. You run 4 API instances, each with an in-memory limit of 10 per minute. What is the real limit?

:::answer
**Up to 40 per minute**, because each instance counts separately. A shared Redis counter fixes this.
:::

### 3. In the code, why is the request at t=0.5s rejected?

:::answer
After 0.5 seconds only half a token has been added. The bucket needs at least one full token to allow a request.
:::
