---
title: "Scaling deployments: horizontal scaling and load balancers"
stack: devops
order: 22
level: Intermediate
mustKnow: false
askedFrequency: common
summary:
  - "Vertical scaling = a bigger machine. Horizontal scaling = more machines (or containers) sharing the work."
  - A load balancer sits in front and spreads requests across the copies, skipping unhealthy ones.
  - Horizontal scaling only works if the app is stateless — sessions, files and caches live outside the app (Redis, S3, the database).
  - Auto-scaling adds or removes copies based on load (CPU, request count, queue length).
  - Serverless (Lambda) scales horizontally by itself, but the database and other services must keep up.
cards:
  - q: Vertical vs horizontal scaling?
    a: Vertical means a bigger machine (more CPU and RAM) — simple but has a limit and one point of failure. Horizontal means more copies behind a load balancer — scales further and survives one copy failing.
  - q: What does a load balancer do?
    a: It receives all requests and spreads them across healthy copies of the app, using rules like round robin or least connections.
  - q: Why must the app be stateless to scale horizontally?
    a: The next request may go to a different copy. If a session or upload lives only in one copy's memory or disk, the other copies don't have it.
  - q: What is auto-scaling?
    a: Automatically adding copies when load goes up and removing them when it goes down, based on metrics like CPU, requests per target or queue length.
  - q: Does Lambda need a load balancer to scale?
    a: No — AWS runs more copies of the function as requests grow. But the database can become the bottleneck, so connection limits and reserved concurrency matter.
---

## 💡 What is it?

When more users come, your app needs more power. There are two ways to get it:

- **Vertical scaling:** buy a **bigger** machine, with more CPU and RAM.
- **Horizontal scaling:** run **more copies** of the app on more machines or containers.

With many copies, you need a **load balancer**. It receives every request and passes it to one of the copies.

## 🏠 Real-life example

Think of a **busy railway ticket counter**.

- **One clerk who works faster** = vertical scaling. It helps, but one person has a limit, and if they fall sick, the counter closes.
- **Opening more counters** = horizontal scaling.
- The **guard at the entrance**, sending each person to the shortest line = the load balancer.
- A counter that is **closed for lunch is skipped** = health checks.
- **Opening extra counters at festival time** and closing them later = auto-scaling.
- **Any clerk can serve you**, because tickets are printed from the central computer and not from one clerk's notebook = a stateless app.

## 🧑‍💻 Code example

This script starts two tiny servers and a simple load balancer in front of them. The balancer sends requests to the servers in turn ("round robin"). Save it as `lb.js` and run `node lb.js`.

```js
const http = require('node:http');                                        // Node's built-in HTTP module
function startServer(name, port) {                                        // helper: start one copy of the "app"
  http.createServer((req, res) => res.end(`answered by ${name}`)).listen(port); // each copy says who answered
}                                                                         // end of startServer
startServer('server-A', 4601);                                            // copy 1 on port 4601
startServer('server-B', 4602);                                            // copy 2 on port 4602
const servers = [4601, 4602];                                             // the list of copies behind the balancer
let next = 0;                                                             // which copy gets the next request
http.createServer((req, res) => {                                         // the load balancer itself
  const port = servers[next];                                             // pick the current copy
  next = (next + 1) % servers.length;                                     // move to the next one (0, 1, 0, 1, …)
  http.get({ port, path: req.url }, (up) => up.pipe(res));                // forward the request, stream the answer back
}).listen(4600, async () => {                                             // the balancer listens on port 4600
  for (let i = 1; i <= 4; i++) {                                          // send 4 test requests to the balancer
    const r = await fetch('http://localhost:4600/');                      // the client only knows the balancer's address
    console.log(`request ${i}:`, await r.text());                         // print which copy answered
  }                                                                       // end of the loop
  process.exit(0);                                                        // stop the demo
});                                                                       // end of listen
```

**Output** (real run):

```text
request 1: answered by server-A
request 2: answered by server-B
request 3: answered by server-A
request 4: answered by server-B
```

The client always calls one address (`:4600`). The balancer shares the work between the copies. In real life you use a managed balancer, like an AWS Application Load Balancer (ALB) or nginx, not your own code.

## 🔍 Deeper version

**Vertical vs horizontal:**

| | Vertical (bigger machine) | Horizontal (more copies) |
|---|---|---|
| How | More CPU or RAM | More servers or containers + a load balancer |
| Limit | The biggest machine you can buy | Very high |
| If one fails | Everything is down | The others keep serving |
| App changes needed | Usually none | The app must be **stateless** |
| Good for | Databases (at first), quick fixes | Web and API servers |

**Load-balancing methods:**
- **Round robin:** take turns (like the example).
- **Least connections:** send to the copy with the fewest active requests.
- **Sticky sessions:** keep a user on the same copy. Avoid this if you can; it fights against scaling.
- The balancer also **ends HTTPS** (TLS termination) and runs **health checks**, skipping unhealthy copies (see [health checks](topic:devops/health-checks)).

**Stateless apps.** Any copy must be able to handle any request:
- **Sessions:** in Redis or a database, or use JWTs, not in server memory.
- **Uploaded files:** in S3, not on the server's disk.
- **Caches:** in Redis, or accept that each copy has its own small cache.
- **Scheduled jobs:** run them once (a separate worker or a scheduler), not on every copy.

**Auto-scaling.** Platforms like AWS ECS, EC2 Auto Scaling or Kubernetes add copies when a metric is high (CPU above 60%, requests per copy, or SQS queue length) and remove them when it drops. Set a **minimum** of at least 2 copies so one failure doesn't take you down, and a **maximum** to control cost.

**Scaling on one machine first.** A Node process uses one CPU core for JavaScript. Running one process per core with the `cluster` module or PM2 is horizontal scaling inside one machine (see [cluster and PM2](topic:nodejs/cluster-and-pm2)).

**Serverless.** AWS Lambda scales horizontally by itself: each concurrent request can get its own copy. There's no load balancer to manage; API Gateway sits in front. But:
- **The database becomes the bottleneck.** Many Lambda copies can open too many database connections. Use connection reuse, a proxy, or **reserved concurrency** to cap a function.
- **Account limits** on concurrency exist and can be raised.
- **Queues** (SQS) smooth out spikes, so workers process at a safe speed.

**At SkillKeepr (public-safe):** the backend is serverless (many Lambda functions behind API Gateway), so AWS scales the functions, and heavy background work goes through SQS queues with limited concurrency. [FILL IN: any scaling problem you saw or handled.]

**Deploying many copies safely:**
- **Rolling deploy:** replace copies a few at a time; each new copy must pass health checks.
- **Blue/green:** run the new version next to the old one, then switch traffic all at once (easy rollback).
- **Canary:** send a small share of traffic (say 5%) to the new version first, watch the error rate, then increase it.

See also [rollback](topic:devops/rollback) and the [system design scaling topic](topic:system-design/scaling-vertical-horizontal).

## 🎯 Why do we use it?

- **Handle more users** without one machine's limits.
- **Stay up when one copy fails.** The balancer routes around it.
- **Pay for what you use.** Auto-scaling adds copies at busy times and removes them at quiet times.
- **Deploy without downtime** using rolling or blue/green deploys.

## ⚠️ Common mistakes

- **Keeping sessions or uploads in one server's memory or disk**, then wondering why users get logged out after scaling to 2 copies.
- **Only one copy "for now"**, so any crash or deploy means downtime.
- **Scaling the app but not the database.** More app copies just send more load to the same database.
- **Running a cron job inside every copy**, so it runs 5 times when you have 5 copies.

## 🗣️ How to answer in an interview

> "There are two ways to scale. Vertical means a bigger machine. It's simple, but it has a ceiling and it's a single point of failure. Horizontal means running more copies behind a load balancer, which spreads requests with round robin or least connections, ends HTTPS, and skips copies that fail health checks.
>
> For horizontal scaling the app must be stateless: sessions go in Redis or JWTs, files go in S3, and scheduled jobs run once, not in every copy. Then auto-scaling can add copies when CPU, request count or queue length goes up, with a minimum of at least two for availability. I'd deploy with rolling or blue/green deploys behind health checks. With serverless like Lambda, AWS handles the scaling, but I still protect the database with connection reuse or reserved concurrency, and use queues to smooth spikes."

## 🔁 Follow-up questions

### A user gets logged out randomly after you added a second server. Why?

Sessions were stored in one server's memory, and the balancer sent them to the other server. Move sessions to Redis or use stateless tokens. See [random logouts](topic:debugging/random-logouts).

### Sticky sessions — good or bad?

They work as a quick fix, but they spread load unevenly, and users lose their session when their server dies. A stateless design is better.

### What metric would you auto-scale on for a worker that reads from a queue?

The **queue length** (or the age of the oldest message), not CPU. If jobs pile up, add workers.

### How do you scale the database?

Add indexes first, then read replicas for reads, caching, and finally sharding for very large data. See the system design topics.

## ✅ Quick check

### 1. In the example, which copy answers request 5?

:::answer
**server-A.** Round robin goes A, B, A, B, so the 5th request goes back to A.
:::

### 2. Which change is needed before running 3 copies of an app that keeps uploaded files on its own disk?

- A) Nothing
- B) Store uploads in shared storage like S3

:::answer
**B.** Each copy has its own disk, so a file uploaded to copy 1 is missing on copies 2 and 3. Shared storage fixes it.
:::

### 3. Your Lambda functions scale to 500 copies and the database starts refusing connections. What can you do?

:::answer
Reuse connections between calls, put a connection proxy in front of the database, or cap the function with **reserved concurrency**. Use a queue to smooth the load if the work can wait.
:::
