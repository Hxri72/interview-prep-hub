---
title: Redis and cache-aside; cache invalidation
stack: system-design
order: 9
level: Intermediate
mustKnow: true
askedFrequency: very common
summary:
  - Redis is a very fast in-memory key-value store, often used as a shared cache between many app servers.
  - "Cache-aside: read the cache first; on a miss, read the database, then save the result in the cache with a TTL."
  - "On a write, update the database first, then delete the cache key, so the next read loads fresh data."
  - In a multi-tenant app, always put the tenant in the cache key, like acme:job:7, so tenants never see each other's data.
  - Always set a TTL, so mistakes and missed invalidations fix themselves over time.
cards:
  - q: What is Redis?
    a: An in-memory key-value data store. Reads and writes take about a millisecond, so it's used for caching, sessions, rate limits and queues.
  - q: Explain the cache-aside pattern.
    a: The app checks the cache; on a hit it returns the cached value; on a miss it reads the database, stores the value in the cache with a TTL, then returns it.
  - q: On an update, why delete the cache key instead of updating it?
    a: Deleting is simpler and safer. The next read loads the fresh value from the database, which avoids races where an old value overwrites a new one.
  - q: Why include the tenant in the cache key?
    a: Two tenants can have the same ids. Without the tenant in the key, one company could see another company's cached data.
  - q: What is a TTL?
    a: Time to live — how many seconds a cache entry lives before it expires automatically.
---

## 💡 What is it?

**Redis** is a database that keeps data **in memory (RAM)**, so it is **very fast**. Many app servers can share one Redis, which makes it a perfect **shared cache**.

**Cache-aside** is the most common way to use a cache. The app **checks the cache first**. If the data isn't there, it reads the [database](glossary:database), saves a copy in the cache, and returns it.

**Cache invalidation** means removing old copies when the real data changes.

## 🏠 Real-life example

Think of a **school office and the question "What is the bus route for class 8?"**

- The clerk first checks a **notice board** next to the desk = the **cache (Redis)**.
- If it's **not on the board**, the clerk opens the **big file in the cupboard** = the **database**, then **pins a copy on the board** for the next person = **cache-aside**.
- Each notice says **"valid till Friday"** = the **TTL**. Old notices get removed automatically.
- When the route **changes**, the clerk **removes the old notice** = **invalidation**.
- Each school in the group has its **own section of the board**, labelled with the school's name = the **tenant in the cache key**.

## 🧑‍💻 Code example

Cache-aside with a `Map` standing in for Redis (the logic is the same). Save as `cacheaside.js`, run `node cacheaside.js`.

```js
const cache = new Map();                                      // our "Redis": key → { value, expiresAt }
const TTL_MS = 60_000;                                        // TTL = time to live: 60,000 ms = 60 seconds
let dbCalls = 0;                                              // counts real database reads

async function dbGetJob(tenant, jobId) {                      // the slow database read
  dbCalls++;                                                  // count it
  await new Promise((r) => setTimeout(r, 200));               // pretend the database takes 200 ms
  return { tenant, jobId, title: `Job ${jobId} of ${tenant}` }; // the row we "found"
}                                                             // end of dbGetJob

async function getJob(tenant, jobId) {                        // cache-aside read
  const key = `${tenant}:job:${jobId}`;                       // the tenant is IN the key, so tenants never share data
  const hit = cache.get(key);                                 // 1. look in the cache first
  if (hit && hit.expiresAt > Date.now()) return { ...hit.value, from: 'cache' }; // fresh copy found → return it
  const value = await dbGetJob(tenant, jobId);                // 2. miss → read the database
  cache.set(key, { value, expiresAt: Date.now() + TTL_MS });  // 3. save it in the cache for next time
  return { ...value, from: 'database' };                      // return the fresh value
}                                                             // end of getJob

function updateJob(tenant, jobId) {                           // called after we change the job in the database
  cache.delete(`${tenant}:job:${jobId}`);                     // invalidate: delete the old cached copy
}                                                             // end of updateJob

(async () => {                                                // run the demo
  console.log((await getJob('acme', 7)).from);                // first read → database
  console.log((await getJob('acme', 7)).from);                // second read → cache
  console.log((await getJob('globex', 7)).from);              // same job id, other tenant → database (own key)
  updateJob('acme', 7);                                       // the job changed → delete its cache entry
  console.log((await getJob('acme', 7)).from);                // next read → database again, fresh data
  console.log('database calls:', dbCalls);                    // 3 of 4 reads hit the database
})();                                                         // end of demo
```

**Output:**

```text
database
cache
database
database
database calls: 3
```

**With real Redis** (`npm install redis`), the same three steps look like this: `await redis.get(key)`, then on a miss `await redis.set(key, JSON.stringify(value), { EX: 60 })`, and on update `await redis.del(key)`. `EX: 60` means "expire in 60 seconds".

## 🔍 Deeper version

**Cache-aside, step by step:**

```text
READ:   app ──GET key──► Redis ──hit──► return
                           └──miss──► DB ──► SET key value EX 60 ──► return
WRITE:  app ──UPDATE──► DB ──then──► DEL key
```

**Why "update the database, then delete the key"?**
- If you delete first and then update, another request could read the **old** value in between and put it back in the cache.
- If you **update** the cache instead of deleting, two writes racing can leave the **older** value in the cache.
- Delete-after-write is the simple, safe default. A TTL catches any rare race that still slips through.

**Other caching patterns:**

| Pattern | How it works | Trade-off |
|---|---|---|
| Cache-aside | App reads cache, loads DB on miss | Simple; first read is slow |
| Read-through | Cache library loads from DB itself | Cleaner code; needs support |
| Write-through | Write to cache and DB together | Cache always fresh; slower writes |
| Write-behind | Write to cache, DB later | Very fast writes; risk of losing data |

**Good cache keys:**
- Include **tenant**, **resource** and **id**: `acme:job:7`.
- Include **query options** for lists: `acme:jobs:status=open:page=1`.
- Lists are hard to invalidate. A short TTL (30–60 s) is often simpler than tracking every change.

**Multi-tenant safety.** Two companies can both have "job 7". If the key is just `job:7`, the second company might see the first company's job. Always add the tenant. See [multi-tenant architecture](topic:architecture/multi-tenant) and [the cross-tenant leak scenario](topic:debugging/cross-tenant-data-leak).

**What else Redis does:** sessions, rate limiting counters, job queues (BullMQ), pub/sub for WebSockets, leaderboards (sorted sets). See [rate limiting](topic:system-design/rate-limiting) and [queues](topic:system-design/queues-background-jobs).

**Eviction.** When Redis runs out of memory, it removes keys based on a policy, like `allkeys-lru` (least recently used first). Set a memory limit and a policy for cache use.

## 🎯 Why do we use it?

- **Speed:** Redis reads are about 1 ms, far faster than a busy database query.
- **Shared across servers:** every app server sees the same cache, so it works with [horizontal scaling](topic:system-design/scaling-vertical-horizontal).
- **Protects the database:** popular data is served from memory, so the database can handle more users.

## ⚠️ Common mistakes

- **No TTL.** A missed invalidation leaves wrong data forever.
- **Forgetting the tenant (or user) in the key.** A serious data leak.
- **Updating the cache instead of deleting it on write,** which can leave old values after a race.
- **Treating Redis as the only copy of important data.** It's a cache: the database is the source of truth.

## 🗣️ How to answer in an interview

> "I usually use the cache-aside pattern with Redis. On a read, the app checks Redis first. On a hit it returns the cached value. On a miss it reads the database, saves the result in Redis with a TTL, and returns it. On a write, I update the database first and then delete the cache key, so the next read loads fresh data. I always set a TTL, so any missed invalidation fixes itself. In a multi-tenant app, the tenant is always part of the key, like acme:job:7, otherwise two companies with the same ids could see each other's data. For lists, a short TTL is often simpler than tracking every change."

[FILL IN: whether you've used Redis in a project, and for what. If not, say you've learned the pattern and would use it this way.]

## 🔁 Follow-up questions

### What happens if Redis goes down?

With cache-aside, the app should treat errors as a miss and read from the database. Responses get slower, but the app keeps working. Add timeouts so a slow Redis doesn't slow every request.

### How do you avoid a cache stampede on a hot key?

Let only one request rebuild the key (a short lock in Redis), add a little random jitter to TTLs, or refresh popular keys before they expire.

### Redis vs an in-memory `Map` in the app?

A `Map` is faster but lives in one process. Each server has a different copy, and it's lost on restart. Redis is shared by all servers and survives app restarts.

### How do you invalidate a list like "open jobs, page 1"?

Simplest: a short TTL. Better: a version number per tenant (`acme:jobs:v12:...`). Bump the version when any job changes, so all old list keys are ignored.

## ✅ Quick check

### 1. In cache-aside, what happens on a cache miss?

:::answer
The app **reads the database**, **stores the result in the cache** with a TTL, and **returns** it.
:::

### 2. Which cache key is safe in a multi-tenant app?

- A) `job:7`
- B) `acme:job:7`
- C) `7`

:::answer
**B.** The tenant in the key keeps each company's data separate.
:::

### 3. A job title is updated. What should the app do with the cache?

:::answer
**Update the database first, then delete the job's cache key.** The next read loads the fresh value.
:::
