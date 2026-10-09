---
title: Graceful shutdown (SIGTERM)
stack: nodejs
order: 28
level: Intermediate
mustKnow: false
askedFrequency: sometimes
summary:
  - When a server is stopped (a deploy, a scale-down), the platform sends the signal SIGTERM to your Node process.
  - A graceful shutdown means: stop taking new requests, finish the ones in progress, close the DB and other connections, then exit.
  - "In Node: listen with process.on('SIGTERM'), call server.close(), then close the database, then process.exit(0)."
  - Always add a timeout. If cleanup hangs, force the exit after a few seconds.
  - Without it, users get errors during every deploy and some work (like a payment update) can be lost halfway.
cards:
  - q: What is SIGTERM?
    a: A signal the operating system or platform (Docker, Kubernetes, Railway, PM2) sends to ask a process to stop politely.
  - q: What are the steps of a graceful shutdown?
    a: Stop accepting new requests (server.close), let in-flight requests finish, close DB/Redis/queue connections, then exit. Add a timeout that forces exit.
  - q: SIGTERM vs SIGKILL?
    a: SIGTERM asks the process to stop and can be handled. SIGKILL stops it immediately and cannot be caught.
  - q: Why add a timeout to the shutdown?
    a: Some connections or requests may never finish. The platform will SIGKILL you anyway after its grace period, so you force a clean exit first.
  - q: What does server.close() do?
    a: It stops the server from accepting new connections and calls its callback once all existing connections have ended.
---

## 💡 What is it?

Servers get stopped all the time. It happens when you deploy a new version, when the platform moves your app, or when it removes extra copies.

Before stopping your app, the platform sends it a polite message: **SIGTERM**. It means "please stop now".

A **graceful shutdown** means your app finishes its work properly before it exits. It doesn't just cut everything in the middle.

## 🏠 Real-life example

Think of a **shop closing for the night**.

At 9 pm, the owner doesn't push customers out mid-payment. Instead:

1. They lock the **front door**, so no new customers come in.
2. The customers already inside **finish paying**.
3. They **close the cash register** and switch off the lights.
4. Then they **leave**.

If someone is still inside at 9:30, the owner asks them to leave. They can't wait forever.

- **"Closing time" announcement** = the SIGTERM signal.
- **Locking the front door** = `server.close()`, which stops new requests.
- **Customers finishing payment** = requests already in progress.
- **Closing the register** = closing the database and Redis connections.
- **The 9:30 limit** = a timeout that forces the exit.

## 🧑‍💻 Code example

Save this as `shutdown.js`. Run it with `node shutdown.js`. Open http://localhost:3000, then quickly press **Ctrl+C** in the terminal.

```js
const http = require('node:http');                        // built-in module to make a web server

const server = http.createServer((req, res) => {          // make a server; this runs for every request
  setTimeout(() => res.end('Done!\n'), 3000);             // pretend each request takes 3 seconds (3000 ms)
});                                                       // end of the request handler
server.listen(3000, () => console.log('Listening on 3000')); // start listening on port 3000

function shutdown(signal) {                               // our clean-up function; signal = the signal's name
  console.log(`${signal} received. Shutting down...`);    // say what happened
  server.close(() => {                                    // 1) stop new requests; this callback runs when old ones finish
    console.log('All requests finished.');                // every request in progress is done
    // 2) close other connections here, e.g. await mongoose.disconnect()
    process.exit(0);                                      // 3) exit; 0 means "ended without errors"
  });                                                     // end of server.close callback
  setTimeout(() => {                                      // safety net in case something hangs
    console.error('Took too long. Forcing exit.');        // say we are forcing it
    process.exit(1);                                      // exit; 1 means "ended with a problem"
  }, 10000).unref();                                      // 10000 ms = 10 s; unref() = don't keep Node alive just for this timer
}                                                         // end of shutdown

process.on('SIGTERM', () => shutdown('SIGTERM'));         // sent by Docker, Kubernetes, PM2, Railway when stopping
process.on('SIGINT', () => shutdown('SIGINT'));           // sent when you press Ctrl+C in the terminal
```

**Output (if a request was running when you pressed Ctrl+C):**

```text
Listening on 3000
SIGINT received. Shutting down...
All requests finished.
```

The browser still gets "Done!". The request was not cut off.

## 🔍 Deeper version

**Signals.** A signal is a short message from the operating system to a process.

| Signal | Who sends it | Can you handle it? |
|---|---|---|
| `SIGTERM` | Docker (`docker stop`), Kubernetes, PM2, most platforms | yes |
| `SIGINT` | Ctrl+C in the terminal | yes |
| `SIGKILL` | the platform, after the grace period ends | **no** — the process dies instantly |

Kubernetes waits for a **grace period** (30 seconds by default) after SIGTERM. Then it sends SIGKILL. Docker waits 10 seconds by default. So your cleanup must finish before that.

**The full order for an Express + MongoDB app:**
1. Mark the app as "not ready", so the health check fails and the load balancer stops sending traffic.
2. `server.close()` — stop accepting new connections.
3. Let in-flight requests finish.
4. Stop background work: queue workers (`await worker.close()` in BullMQ), cron jobs and intervals.
5. Close connections: `await mongoose.connection.close()`, `await redis.quit()`.
6. `process.exit(0)`.
7. A **timeout** (shorter than the platform's grace period) that calls `process.exit(1)`.

**Keep-alive connections.** Browsers and load balancers keep connections open for reuse. `server.close()` waits for them too, which can take a long time. Since Node 18.2, you can call `server.closeIdleConnections()` to close idle ones. `server.closeAllConnections()` closes them all (use it only in the timeout path).

:::version[Version note]
Since **Node.js 19**, `server.close()` also closes idle keep-alive connections by itself. On older versions, the shutdown could hang until those connections timed out.
:::

**Docker gotcha: PID 1.** In a container, your command runs as process number 1. If you start the app with `npm start`, npm may not pass SIGTERM on to Node. Then Node never gets the signal, and Docker kills it after 10 seconds. Fix: use `CMD ["node", "server.js"]` directly, or run with `docker run --init`.

**Don't do slow work in `process.on('exit')`.** The `exit` event only allows synchronous code. Async cleanup must happen in the SIGTERM handler, *before* you call `process.exit()`.

## 🎯 Why do we use it?

- **No errors during deploys.** Users in the middle of a request still get their answer.
- **No half-done work.** A payment status or a database write isn't cut in the middle.
- **Clean connections.** The database doesn't keep old, open connections. Queue jobs aren't left "stuck" as active.
- **Faster deploys.** The app exits quickly by itself, instead of waiting to be SIGKILLed.

## ⚠️ Common mistakes

- **Calling `process.exit()` right away** in the SIGTERM handler. In-flight requests get cut off.
- **No timeout.** One hanging connection can block the shutdown until the platform kills the app.
- **Starting the app with `npm start` in Docker.** The signal may not reach Node.
- **Forgetting background workers.** A queue worker that dies mid-job leaves that job stuck or done twice.

## 🗣️ How to answer in an interview

> "When a platform like Docker or Kubernetes stops my app, it sends SIGTERM, waits for a grace period, and then sends SIGKILL, which can't be caught. So I handle SIGTERM and shut down gracefully.
>
> First I stop accepting new requests with server.close(). Then I let the in-flight requests finish. I stop background workers, and close the database and Redis connections. Then I exit with code 0. I also add a timeout, shorter than the grace period, that forces an exit if something hangs.
>
> In Kubernetes, I also fail the readiness check first, so the load balancer stops sending traffic. And in Docker, I start Node directly instead of through npm, so the signal actually reaches the process."

[FILL IN: if your SkillKeepr services (Railway, GCP voice service) had shutdown handling, add one line. Only if it's true.]

## 🔁 Follow-up questions

### What is the difference between SIGTERM and SIGKILL?

SIGTERM is a polite request to stop. Your app can catch it and clean up. SIGKILL ends the process instantly. Your app can't catch it or run any code.

### Why might your app not receive SIGTERM in Docker?

The first process in a container is PID 1. If that is `npm` or a shell script, it may not pass the signal to Node. Start Node directly in the Dockerfile `CMD`, or use `docker run --init` (or `tini`).

### How do you handle a WebSocket server during shutdown?

Stop accepting new connections. Tell connected clients the server is going away, so they can reconnect to another instance. Then close the sockets. Clients should have reconnect logic.

### What should a health check return during shutdown?

The readiness check should return an error (like 503) as soon as shutdown starts. Then the load balancer stops sending new traffic before the server closes.

## ✅ Quick check

### 1. What is the first thing to do when SIGTERM arrives?

- A) `process.exit(0)` immediately
- B) Stop accepting new requests with `server.close()`
- C) Delete the database

:::answer
**B.** Stop new requests first. Then let current ones finish, close connections, and exit.
:::

### 2. Can your Node app run cleanup code when it receives SIGKILL?

:::answer
**No.** SIGKILL can't be caught. The process stops instantly. That's why you must finish cleanup after SIGTERM, before the grace period ends.
:::

### 3. Why does the code call `.unref()` on the timeout?

:::answer
So the timer itself doesn't keep Node running. If everything closes early, Node can exit without waiting the full 10 seconds.
:::
