---
title: Health checks and uptime
stack: devops
order: 20
level: Basic
mustKnow: false
askedFrequency: common
summary:
  - A health check is a small URL, like /health, that says "I'm OK" (200) or "I'm not OK" (503).
  - Load balancers and container platforms call it every few seconds, and stop sending traffic to unhealthy copies.
  - Uptime monitors call your public site from outside and alert you when it goes down.
  - "Liveness = is the process alive? Readiness = can it serve users right now (database connected)?"
  - Uptime is often promised as a percent, like 99.9% — about 43 minutes of downtime a month.
cards:
  - q: What is a health check endpoint?
    a: A small route like GET /health that returns 200 when the service can work, and 503 when it can't. Machines call it to decide where to send traffic.
  - q: Liveness vs readiness?
    a: Liveness asks "is the process alive, or should it be restarted?". Readiness asks "can it serve requests right now?" — for example, is the database connected.
  - q: What does a load balancer do with a failing health check?
    a: It marks that server or container unhealthy and stops sending it traffic until it passes again.
  - q: How much downtime is 99.9% uptime?
    a: About 43 minutes per month, or about 8.8 hours per year.
  - q: Why monitor from outside?
    a: Inside checks can all look fine while users can't reach you — for example a DNS or certificate problem. An outside monitor sees what users see.
---

## 💡 What is it?

A **health check** is a tiny URL your app offers, usually `GET /health`. It answers one question: "Can you do your job right now?"

- **200 OK** means yes.
- **503 Service Unavailable** means no.

Machines call it all the time. Load balancers use it to decide where to send traffic. Uptime monitors use it to alert you when your site is down. **Uptime** is the share of time your service works, like 99.9%.

## 🏠 Real-life example

Think of **morning attendance at school**.

- The **teacher calling names** every morning = the load balancer calling `/health` every few seconds.
- A student saying **"Present!"** = 200 OK.
- **No answer, or "I'm sick"** = 503. That student doesn't get work today; other students get it.
- **A parent phoning the school from home** to check it's open = an outside uptime monitor.
- **"Present, but my books are at home"** = the process is alive (liveness OK) but not ready to work (readiness fails).

## 🧑‍💻 Code example

This script starts a tiny server with a `/health` route. Then it acts like an uptime monitor and checks it 3 times. Before the 3rd check, the server becomes unhealthy. Save it as `uptime.js` and run `node uptime.js`.

```js
const http = require('node:http');                                   // Node's built-in web server module
let healthy = true;                                                  // pretend status: the database is connected
http.createServer((req, res) => {                                    // create a server that handles every request
  if (req.url === '/health') {                                       // the health check route
    res.statusCode = healthy ? 200 : 503;                            // 200 = OK, 503 = "can't serve right now"
    return res.end(healthy ? 'ok' : 'not ok');                       // short body; machines only read the status
  }                                                                  // end of /health
  res.end('home');                                                   // any other page
}).listen(4700, async () => {                                        // listen on port 4700, then run the monitor
  for (let check = 1; check <= 3; check++) {                         // do 3 checks, like a monitor every minute
    if (check === 3) healthy = false;                                // before check 3, "the database goes down"
    const started = Date.now();                                      // note the time to measure response time
    const r = await fetch('http://localhost:4700/health', { signal: AbortSignal.timeout(2000) }); // call /health, give up after 2 s
    const status = r.ok ? 'UP' : 'DOWN';                             // r.ok is true for 200–299
    console.log(`check ${check}: ${r.status} ${status} (${Date.now() - started} ms)`); // what a monitor would record
  }                                                                  // end of the checks
  process.exit(0);                                                   // stop the demo
});                                                                  // end of listen
```

**Output** (real run; the milliseconds will differ on your computer):

```text
check 1: 200 UP (32 ms)
check 2: 200 UP (2 ms)
check 3: 503 DOWN (0 ms)
```

A real load balancer would now stop sending users to this copy, and an uptime monitor would alert you.

## 🔍 Deeper version

**Two kinds of checks:**

| Check | Question | If it fails |
|---|---|---|
| **Liveness** | Is the process alive and not stuck? | The platform **restarts** it |
| **Readiness** | Can it serve users now (database, cache reachable)? | The platform **stops sending traffic** until it's ready |

Keep liveness **simple and cheap**. If liveness checks the database and the database blips, the platform restarts every copy at once and makes things worse. Put dependency checks in readiness.

**Who calls health checks:**
- **Load balancers** (like AWS ALB) call each target every few seconds. After a few failures in a row, the target is marked unhealthy.
- **Container platforms** (ECS, Kubernetes) use them to restart broken containers and during rolling deploys. A new version only gets traffic after it passes.
- **Uptime monitors** (like UptimeRobot, Better Stack, or CloudWatch Synthetics canaries) call your **public** URL from several countries and alert you if it fails. They catch problems inside checks can't see, like DNS errors or an expired certificate.

**Serverless note.** With API Gateway and Lambda, there are no long-running servers for a load balancer to check, because AWS manages that. You still want an **outside uptime check** on a public endpoint, plus alarms on errors (see [monitoring](topic:devops/monitoring-alerts)).

**Uptime numbers ("nines"):**

| Uptime | Downtime per month (about) |
|---|---|
| 99% | 7.3 hours |
| 99.9% | 43 minutes |
| 99.99% | 4.4 minutes |

An **SLA** is a promise to customers. An **SLO** is your internal target, like 99.9% of requests succeeding.

**Graceful shutdown.** When a deploy stops a container, it should first fail readiness (so new traffic goes elsewhere), finish the requests in progress, then exit. The Express side of this is in [Express health checks](topic:express/health-checks) and [graceful shutdown](topic:nodejs/graceful-shutdown).

**Security.** Health responses should not show versions, hostnames or secrets. Keep detailed diagnostics on a protected route.

## 🎯 Why do we use it?

- **Users never hit a broken copy.** The load balancer routes around it.
- **Self-healing.** Stuck processes are restarted automatically.
- **Safe deploys.** New versions get traffic only after they're healthy.
- **You hear about downtime first**, not from an angry customer.

## ⚠️ Common mistakes

- **A `/health` that always returns 200**, even when the database is down.
- **A heavy health check** that runs slow queries every 5 seconds on every copy.
- **Checking the database in liveness**, so one database blip restarts everything.
- **No outside monitor**, so a DNS or certificate problem goes unnoticed.

## 🗣️ How to answer in an interview

> "A health check is a small endpoint, like GET /health, that returns 200 when the service can work and 503 when it can't. Load balancers and container platforms call it every few seconds. If a copy fails a few checks in a row, it stops getting traffic, and a stuck process can be restarted.
>
> I separate liveness and readiness. Liveness is cheap: is the process responding? Readiness checks dependencies like the database, so a copy that lost its connection is taken out of rotation without being restarted. During a deploy, a new version only gets traffic after it passes readiness, and when shutting down we fail readiness first and drain requests. On top of that, I'd have an outside uptime monitor on the public URL, because it catches DNS or certificate problems that internal checks can't see."

[FILL IN: any uptime monitor or health check you set up or used at work. Only if true.]

## 🔁 Follow-up questions

### What should a readiness check test?

The things a request truly needs, such as a quick database ping or a cache ping. Keep it fast (a few milliseconds) and give each check a short timeout.

### What happens during a rolling deploy?

The platform starts a new copy and waits for it to pass health checks. It sends that copy traffic, then stops an old copy. If the new copy never becomes healthy, the deploy stops and the old copies keep serving users.

### Should /health be public?

A simple OK/not OK is fine. Detailed info (versions, dependency status) should be protected or internal only.

### What does 99.9% availability mean for a month?

About 43 minutes of allowed downtime. That's why you need fast detection and fast rollbacks.

## ✅ Quick check

### 1. The database is down, but the Node process is fine. Which check should fail?

- A) Liveness
- B) Readiness

:::answer
**B.** The process is alive, so it shouldn't be restarted. But it can't serve users, so readiness fails and traffic goes elsewhere.
:::

### 2. In the example, why does check 3 say DOWN?

:::answer
Before check 3, `healthy` is set to `false`, so `/health` returns **503**. `r.ok` is false for 503, so the monitor records DOWN.
:::

### 3. All your internal health checks pass, but users can't open the site. What could an outside uptime monitor catch?

:::answer
Problems outside the app, like a broken DNS record or an expired HTTPS certificate. An outside monitor sees what real users see.
:::
