---
template: chapter
title: "Growing to 10× more users: what changes"
stack: skillkeepr-story
order: 16
level: Advanced
mustKnow: false
askedFrequency: common
summary:
  - Start with rough maths: users → requests per second → peak → servers and database load.
  - Cache hot, rarely-changing data (config, lists) and always put the tenant in the cache key.
  - Check slow queries with explain(), add the right compound indexes, and use cursor pagination for long lists.
  - Move slow work to queues, and keep request handlers short.
  - Watch cold starts, connection counts, and add alarms so you hear about problems before users do.
cards:
  - q: How do you start a "10× more users" question?
    a: Do back-of-envelope maths first — requests per second, peak load, database reads — then find the first part that would break.
  - q: What would you cache first, and what is the danger?
    a: Data that's read a lot and changes rarely, like app config or job lists. The danger is mixing companies, so the tenant must be in every cache key.
  - q: Why cursor pagination at scale?
    a: skip/limit gets slower on deep pages because the database still walks the skipped documents. A cursor jumps straight to "after this ID".
  - q: How does serverless change scaling?
    a: Lambda adds instances by itself, but each new one can have a cold start and opens its own database connections, so connection limits matter.
  - q: What should run in a queue instead of the request?
    a: Slow or retryable work — parsing resumes, scoring, sending emails, calling AI — so the user gets a fast reply.
---

## 💡 What happens in this chapter

Imagine SkillKeepr suddenly has **10 times more** recruiters and candidates.

This chapter shows **how to think about growth**: measure first, then find the weakest part, then fix that part. These are things I'd consider, explained simply.

## 🏠 Real-life example

Think of a **school canteen** on the day the whole school comes at once.

- **Counting students and lunch time** = back-of-envelope maths.
- **Ready-made sandwiches on the counter** = caching popular data.
- **A token system so the line moves** = a queue for slow work.
- **Opening more counters** = adding servers or Lambda instances.
- **Arranging food so it's easy to find** = database indexes.
- **A teacher watching the line** = monitoring and alarms.

## 🗺️ The flow

```text
1. Measure          users × requests per user → requests per second (avg, peak)
2. Find the limit   which breaks first? database, connections, a slow endpoint, a 3rd-party API
3. Reduce work      cache hot reads (tenant in key) · indexes · cursor pagination · select fewer fields
4. Move work        slow jobs → queues and background workers
5. Add capacity     more Lambda concurrency / instances · read replicas for heavy reads
6. Protect          rate limits · timeouts and retries · alarms on errors and latency
7. Measure again    did it help? repeat
```

## 🧱 Tech used

| Piece | Technology | Learn it here |
|---|---|---|
| Thinking about scale | Vertical vs horizontal | [Vertical vs horizontal scaling](topic:system-design/scaling-vertical-horizontal) |
| Caching | Redis / in-memory, cache-aside | [Caching](topic:system-design/caching), [Redis and cache-aside](topic:system-design/redis-cache-aside) |
| Faster queries | Indexes, explain() | [Compound indexes (ESR)](topic:mongodb/compound-indexes-esr), [explain()](topic:mongodb/explain) |
| Long lists | Cursor pagination | [Pagination at scale](topic:mongodb/pagination) |
| Slow work | Queues, workers | [Queues and background jobs](topic:system-design/queues-background-jobs) |
| Database growth | Replicas, sharding | [Database scaling](topic:system-design/database-scaling) |
| Serverless limits | Cold starts, concurrency | [Serverless limits](topic:architecture/serverless-limits) |
| Protection | Rate limiting, resilience | [Rate limiting](topic:system-design/rate-limiting), [Resilience](topic:architecture/resilience) |
| Seeing problems | Monitoring, alarms | [Monitoring and alerts](topic:devops/monitoring-alerts) |

## 🧑‍💻 Key code idea

A back-of-envelope capacity calculator. The numbers are **assumptions** for practice, not SkillKeepr data. Save as `capacity.js`, run `node capacity.js`.

```js
// capacity.js — rough maths before scaling
const today = { activeUsers: 2000, requestsPerUserPerMin: 6 };   // assumed numbers, not real data
const growth = 10;                                                // the "10× more users" question
const users = today.activeUsers * growth;                         // 20,000 users after growth
const perSecond = (users * today.requestsPerUserPerMin) / 60;     // requests every second on average
const peak = perSecond * 3;                                       // assume the busiest minute is 3× average
const perInstance = 500;                                          // assume one function/server handles 500 req/s
const needed = Math.ceil(peak / perInstance);                     // round up: you can't run half a server
const cacheHit = 0.7;                                             // assume 70% of reads come from cache
const dbReads = Math.round(peak * (1 - cacheHit));                // reads that still reach the database
console.log('Average req/s:', perSecond);                        // print the average
console.log('Peak req/s:', peak);                                 // print the peak
console.log('Instances needed at peak:', needed);                 // capacity estimate
console.log('DB reads/s with 70% cache:', dbReads);               // what caching saves the database
```

```text
Average req/s: 2000
Peak req/s: 6000
Instances needed at peak: 12
DB reads/s with 70% cache: 1800
```

The point is the method: a 70% cache hit rate cuts database reads from 6,000 to 1,800 a second.

## 🧗 Hard parts and trade-offs

- **Caching vs fresh data.** Cached data can be a little old. Choose a short expiry, or clear the cache when the data changes.
- **Indexes vs writes.** Every index speeds reads but slows writes and uses memory. Add the ones your hot queries need, checked with `explain()`. See [the cost of indexes](topic:mongodb/index-costs).
- **Serverless connections.** Lambda scales out on its own, but each instance opens database connections. With a database per company, connection counts grow fast. Reuse connections and set limits.
- **Cold starts.** New Lambda instances start slowly. Smaller bundles and, for hot endpoints, provisioned concurrency help, at extra cost.
- **Queues add delay.** Moving work to a queue makes requests fast, but the result arrives later. The UI must show "processing".

## 🙋 My part

- These are **ideas I'd consider**, not a project I've finished.
- I've worked on **backend code optimisation** and on **MongoDB aggregation and indexing** over multi-tenant data. [FILL IN: one real optimisation you made, with before/after if you have it.]
- [FILL IN: one improvement from this list you'd pick first at SkillKeepr, and why.]

## 🗣️ How to explain it in an interview

> "I'd start with rough numbers: users, requests per second, and the peak. Then I'd find what breaks first, which is usually the database or a slow endpoint.
>
> First I'd reduce work. Cache hot data like config and job lists, with the tenant in every cache key. Check the slowest queries with explain() and add compound indexes. Use cursor pagination for long lists. Then I'd move slow work, like resume parsing, scoring and emails, into queues so requests stay fast.
>
> On serverless, Lambda scales out on its own, so I'd watch cold starts and database connection counts, especially with a database per company. Finally I'd add rate limits, timeouts and alarms on error rate and latency, and measure again after each change. [FILL IN: one optimisation you've already done.]"

## 🔁 Follow-up questions

### What would you measure first?

Requests per second, response time (p95), error rate, and database CPU and connections. Then the slowest endpoints and queries.

### Read replicas or caching first?

Caching first: it's cheaper and removes repeated reads. Read replicas help when many different reads still hit the database.

### How do you scale background jobs?

Add more workers for the queue, but limit how many run at once if they call rate-limited services like AI or parsers.

### When would you shard MongoDB?

Only when one database server can't hold the data or the writes, even after indexes and replicas. With a database per company, a very large company could also move to its own server.

## 📚 Topics to revise

- [How to approach a system design question](topic:system-design/how-to-approach)
- [Caching](topic:system-design/caching)
- [Queues and background jobs](topic:system-design/queues-background-jobs)
- [Pagination at scale](topic:mongodb/pagination)
- [Serverless limits](topic:architecture/serverless-limits)
- [Monitoring and alerts](topic:devops/monitoring-alerts)
