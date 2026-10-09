---
title: Health checks and graceful shutdown
stack: express
order: 22
level: Intermediate
mustKnow: false
askedFrequency: sometimes
summary:
  - A health check is a small endpoint, like GET /health, that tells the platform "I'm alive" or "I'm ready for users".
  - "Liveness (/health) = is the process alive? Keep it cheap. Readiness (/ready) = can I take traffic now? Check the database too."
  - Return 200 when healthy and 503 when not, so load balancers stop sending users to a broken copy.
  - "On SIGTERM: make /ready return 503, wait a moment, call server.close(), close the database, then exit. Add a timeout."
  - This lets you deploy new versions with no failed requests.
cards:
  - q: What is a health check endpoint?
    a: A small route, like GET /health, that a load balancer or platform calls every few seconds to see if your app is working.
  - q: Liveness vs readiness?
    a: "Liveness: is the process alive and not stuck? If not, restart it. Readiness: can it take traffic now (DB connected, not shutting down)? If not, stop sending users but don't restart."
  - q: Which status code should a failing health check return?
    a: 503 Service Unavailable. Healthy returns 200.
  - q: Why shouldn't /health (liveness) check the database?
    a: If the DB is down, every copy of the app would be restarted again and again, which doesn't fix the DB and makes things worse. Put DB checks in readiness.
  - q: How do health checks help graceful shutdown?
    a: On SIGTERM, /ready starts returning 503, so the load balancer stops sending new users before server.close() finishes the open requests.
---

## 💡 What is it?

A **health check** is a tiny route, like `GET /health`. Other systems call it every few seconds to ask: **"Are you OK?"**

These systems are things like a load balancer, Docker, Kubernetes, Railway or an uptime monitor. If your app answers `200`, it's healthy. If it answers `503` or doesn't answer, something is wrong.

**Graceful shutdown** means stopping politely. You finish the work you started, then close. The full Node.js side is in [graceful shutdown](topic:nodejs/graceful-shutdown). Here we connect the two ideas in Express.

## 🏠 Real-life example

Think of **a shop with several billing counters**.

The manager walks past every few minutes and asks each cashier: "Are you OK?"
- If a cashier doesn't answer at all, the manager replaces them. That's the **liveness** check.
- If a cashier says "My card machine isn't working", the manager doesn't replace them. They just send customers to other counters for now. That's the **readiness** check.

At closing time, a cashier puts up a **"Counter closed"** sign. New customers go elsewhere. But the cashier still finishes billing the people already in the line. Then they count the cash and leave.

- **The manager** = the load balancer or platform.
- **"Are you OK?"** = a request to `/health` or `/ready`.
- **Card machine broken** = the database is down → `/ready` returns 503.
- **"Counter closed" sign** = `/ready` returns 503 after SIGTERM.
- **Finishing the people in the line** = `server.close()` waiting for open requests.
- **Counting cash and leaving** = closing the database and exiting.

## 🧑‍💻 Code example

Set up:

```bash
npm init -y
npm install express
```

Save this as `health.js`. Run it with `node health.js`.

```js
const express = require('express');                               // load Express
const app = express();                                            // create the app

let shuttingDown = false;                                         // becomes true when we start stopping
const db = { ping: async () => true, close: async () => {} };     // a fake database with ping and close

app.get('/health', (req, res) => {                                // LIVENESS: "is the process alive?"
  res.json({ status: 'ok', uptime: Math.round(process.uptime()) }); // cheap: no database call
});                                                               // end of /health

app.get('/ready', async (req, res) => {                           // READINESS: "can I take traffic right now?"
  if (shuttingDown) {                                             // we are stopping
    return res.status(503).json({ status: 'shutting down' });     // 503 = not available; load balancer stops sending users
  }                                                               // end of the check
  try {                                                           // try the things we depend on
    await db.ping();                                              // is the database reachable?
    res.json({ status: 'ready', db: 'up' });                      // all good → 200
  } catch {                                                       // the ping failed
    res.status(503).json({ status: 'not ready', db: 'down' });    // 503 again
  }                                                               // end of try/catch
});                                                               // end of /ready

app.get('/slow', async (req, res) => {                            // a slow request, to see shutdown wait for it
  await new Promise((r) => setTimeout(r, 2000));                  // pretend work takes 2 seconds
  res.send('slow request finished');                              // reply when done
});                                                               // end of /slow

const server = app.listen(3000, () => console.log('Listening on 3000')); // start; keep the server so we can close it

process.on('SIGTERM', () => {                                     // the platform asks us to stop
  console.log('SIGTERM received, stopping…');                     // log it
  shuttingDown = true;                                            // /ready now returns 503
  setTimeout(() => {                                              // wait a moment so the load balancer sees the 503
    server.close(async () => {                                    // stop new connections; wait for open requests
      await db.close();                                           // then close the database
      console.log('Closed cleanly');                              // log it
      process.exit(0);                                            // 0 = a normal, successful exit
    });                                                           // end of server.close
  }, 2000);                                                       // 2000 ms = 2 seconds of "draining"
  setTimeout(() => process.exit(1), 10_000).unref();              // safety net: force exit after 10 s; 1 = error exit
});                                                               // end of the SIGTERM handler
```

Try it. In a second terminal, start a slow request, then send SIGTERM (`kill -TERM <pid>`):

```text
$ curl http://localhost:3000/health
{"status":"ok","uptime":1}
$ curl http://localhost:3000/ready
{"status":"ready","db":"up"}

… start  curl http://localhost:3000/slow  … then send SIGTERM …

$ curl http://localhost:3000/ready
{"status":"shutting down"}                 ← 503, so no new users are sent here
slow request finished                      ← the open request still completed

Server terminal:
Listening on 3000
SIGTERM received, stopping…
Closed cleanly
```

## 🔍 Deeper version

**Three kinds of checks.** Kubernetes names them clearly. Other platforms use the same ideas.

| Check | Question | If it fails | What to check |
|---|---|---|---|
| **Liveness** (`/health`, `/livez`) | Is the process alive and not frozen? | Restart the app | Almost nothing. Just answer quickly |
| **Readiness** (`/ready`, `/readyz`) | Can it handle users right now? | Stop sending traffic, but don't restart | Database, cache, not shutting down |
| **Startup** | Has it finished starting? | Wait longer before other checks | Migrations done, connections open |

**Why liveness must stay cheap.** Say the database goes down and `/health` checks it. Then every copy of your app fails liveness, and the platform restarts them all again and again. That doesn't fix the database. It just adds more load. So database checks belong in **readiness**.

**Make checks fast and safe:**
- Add a short timeout to the DB ping (like 1 second). A hanging check is as bad as a failing one.
- Don't run heavy queries. A simple `ping` command is enough.
- Don't expose secrets or versions of internal systems in the response. Keep it short.
- Skip health-check URLs in your access logs, or they flood the logs with a line every few seconds.

**Why wait before `server.close()`?** `server.close()` stops new connections at once. But the load balancer may still send a few requests for a short time, until it notices. The pattern is:
1. On SIGTERM, make readiness fail (503).
2. Wait a few seconds, so the load balancer removes this copy.
3. Call `server.close()`. It waits for open requests to finish.
4. Close the database, queues and caches.
5. Exit with code 0. Force exit with a timeout if anything hangs.

**Keep-alive connections.** Browsers and proxies reuse connections. Since Node.js 19, `server.close()` also closes idle keep-alive connections. Long requests still finish normally.

**Where these are configured:**
- **Docker**: the `HEALTHCHECK` line in a Dockerfile.
- **Kubernetes**: `livenessProbe` and `readinessProbe`.
- **Railway / cloud load balancers**: a "health check path" setting.
- **Uptime monitors**: an external service pings `/health` and alerts you.

## 🎯 Why do we use it?

- **Zero-downtime deploys.** Old copies stop cleanly, and new copies only get users when they are ready.
- **Self-healing.** A frozen process gets restarted without anyone waking up at night.
- **Fewer errors for users.** Traffic goes only to copies that can really serve it.
- **Early alerts.** An uptime monitor tells you the site is down before users do.

## ⚠️ Common mistakes

- **Checking the database in the liveness check.** A DB outage then causes restart loops across every copy.
- **No health check at all.** The platform assumes "process running = healthy", even if the app is stuck.
- **Calling `process.exit()` right away on SIGTERM.** Requests in progress fail. Users see errors on every deploy.
- **No timeout on shutdown.** One stuck connection keeps the old copy alive until the platform kills it with SIGKILL.

## 🗣️ How to answer in an interview

> "I add two small endpoints. `/health` is the liveness check: it just returns 200 if the process can answer, with no database call. `/ready` is the readiness check: it pings the database with a short timeout and returns 503 if something it needs is down, or if the app is shutting down. Load balancers and platforms like Kubernetes call these every few seconds.
>
> I keep the database check out of liveness. Otherwise a database outage would make the platform restart every copy of the app in a loop.
>
> For graceful shutdown, on SIGTERM I mark the app as shutting down, so readiness returns 503 and traffic moves away. I wait a few seconds, then call `server.close()` to finish open requests, close the database, and exit. There's a forced-exit timeout as a safety net. That gives deploys with no failed requests."

[FILL IN: what health checks or uptime monitoring you used for SkillKeepr services (Railway, AWS, GCP) — only if you know.]

## 🔁 Follow-up questions

### What status code should a health check return?

`200` when healthy and `503 Service Unavailable` when not. Most platforms only look at the status code, not the body.

### Should the health check need authentication?

Usually no, because the load balancer must call it easily. So keep the response small and harmless. If you want a detailed status page with dependency details, protect that separate endpoint.

### What's the difference between a health check and monitoring?

A health check answers "yes or no, right now" for one copy of the app. Monitoring collects numbers over time, like response time, error rate and memory. It also alerts you when they look bad. Health checks are one input to monitoring.

### How long should you wait before closing the server?

Long enough for the load balancer to notice the failing readiness check. That is usually a bit more than its check interval, for example 5–10 seconds. It must stay shorter than the platform's grace period (often 30 seconds) before it sends SIGKILL.

## ✅ Quick check

### 1. The database is down. What should `/health` (liveness) and `/ready` (readiness) return?

:::answer
`/health` → **200** (the process itself is fine; restarting won't fix the DB). `/ready` → **503** (don't send users here until the DB is back).
:::

### 2. On SIGTERM, why make `/ready` return 503 *before* calling `server.close()`?

:::answer
So the load balancer notices and stops sending new users to this copy. Then `server.close()` only has to finish the requests that are already running, and no new user hits a closed server.
:::

### 3. Which is the better liveness check?

- A) Run a big report query and return 200 if it works
- B) Return 200 immediately with `{ status: 'ok' }`

:::answer
**B.** Liveness should be fast and cheap. A heavy query wastes resources every few seconds, and it can fail for reasons a restart won't fix.
:::
