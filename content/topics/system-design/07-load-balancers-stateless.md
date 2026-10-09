---
title: Load balancers and stateless services
stack: system-design
order: 7
level: Intermediate
mustKnow: false
askedFrequency: common
summary:
  - A load balancer sits in front of many app servers and sends each request to one of them.
  - Common methods are round robin (take turns), least connections, and IP hash (same user → same server).
  - Health checks remove broken servers automatically, so users don't hit them.
  - A stateless service keeps no user data in its own memory, so any server can handle any request.
  - "Sticky sessions are a workaround for stateful servers. Prefer making servers stateless."
cards:
  - q: What does a load balancer do?
    a: It spreads incoming requests across several servers, skips unhealthy ones, and gives clients one stable address.
  - q: What is round robin?
    a: Sending requests to servers in turn — 1, 2, 3, 1, 2, 3 — so each gets an equal share.
  - q: What is a health check?
    a: The load balancer regularly calls a URL like /health on each server. If a server fails, it stops sending traffic to it.
  - q: What does "stateless service" mean?
    a: The server keeps no per-user data in its own memory between requests. Sessions, files and shared caches live in Redis, S3 or the database.
  - q: What are sticky sessions and why avoid them?
    a: Always sending a user to the same server. It hides stateful design, causes uneven load, and loses sessions when that server dies.
---

## 💡 What is it?

When you run several copies of your app, users need **one address** to talk to. A **load balancer** is that address. It receives every request and **forwards it to one of your servers**.

For this to work well, the servers must be **stateless**. That means a server keeps **no user data in its own memory** between requests. Then any server can answer any request.

## 🏠 Real-life example

Think of **a bank with many counters and a token machine**.

- You don't choose a counter. You take a **token**, and the display sends you to the **next free counter** = the **load balancer**.
- The **counters** = the app servers.
- If one clerk goes on a **break**, the display stops calling that counter = the **health check**.
- Your **account details are in the bank's central computer**, not in one clerk's notebook = **stateless servers**. Any clerk can help you.
- If only **one clerk** remembered your details, you'd have to wait for that clerk = **sticky sessions** (avoid).

## 🧑‍💻 Code example

A tiny round-robin load balancer in front of two app servers, using only Node's built-in `http`. Save as `lb.js`, run `node lb.js`.

```js
const http = require('node:http');                            // Node's built-in HTTP module

function startBackend(port) {                                 // starts one copy of our app on a port
  return http.createServer((req, res) => {                    // runs for every request this copy gets
    res.end(`hello from server ${port}`);                     // reply with which copy answered
  }).listen(port);                                            // listen on that port
}                                                             // end of startBackend

const backends = [7301, 7302];                                // two identical, stateless copies of the app
const servers = backends.map(startBackend);                   // start both copies
let next = 0;                                                 // index of the backend to use next

const lb = http.createServer(async (req, res) => {            // the load balancer: clients only talk to this
  const port = backends[next];                                // pick the current backend
  next = (next + 1) % backends.length;                        // round robin: 0 → 1 → 0 → 1 …
  const reply = await fetch(`http://localhost:${port}${req.url}`); // forward the request to that backend
  res.end(await reply.text());                                // send the backend's answer back to the client
}).listen(7300, async () => {                                 // the load balancer listens on port 7300
  for (let i = 1; i <= 4; i++) {                              // send 4 requests, like 4 users
    const r = await fetch('http://localhost:7300/');          // every request goes to the SAME address
    console.log(`request ${i}:`, await r.text());             // see which backend answered
  }                                                           // end of loop
  lb.close(); servers.forEach((s) => s.close());              // stop everything so the script ends
});                                                           // end of listen
```

**Output:**

```text
request 1: hello from server 7301
request 2: hello from server 7302
request 3: hello from server 7301
request 4: hello from server 7302
```

The client always calls port 7300. The load balancer takes turns between the two servers.

## 🔍 Deeper version

**Balancing methods:**

| Method | How it picks | Good for |
|---|---|---|
| Round robin | Takes turns | Servers of equal size, similar requests |
| Weighted round robin | Bigger servers get more turns | Mixed server sizes |
| Least connections | Server with fewest open requests | Requests of very different lengths |
| IP hash | Same client IP → same server | When you need stickiness (avoid if you can) |

**Layer 4 vs layer 7.**
- **Layer 4** (network level) forwards TCP connections without reading the HTTP. Very fast. Example: AWS Network Load Balancer.
- **Layer 7** (HTTP level) reads the URL and headers. It can route `/api` to one group and `/images` to another, end TLS, and add headers. Example: AWS Application Load Balancer, Nginx.

**Health checks.** The load balancer calls something like `GET /health` every few seconds. Two or three failures in a row → the server is removed. When it passes again → added back. See [health checks](topic:express/health-checks).

**Making a service stateless:**

| State | Don't keep it in… | Put it in… |
|---|---|---|
| Login sessions | server memory | Redis, or a signed token (JWT cookie) |
| Uploaded files | local disk | S3 / object storage |
| Shared cache | one server's memory | Redis |
| Background jobs | an in-memory array | a queue (SQS, BullMQ) |
| WebSocket messages for other users | one server | Redis pub/sub adapter |

**The load balancer must not be a single point of failure either.** Cloud load balancers run on several machines across zones for you.

**API Gateway** is a related idea: a front door that also handles auth, rate limits and routing to many services. See [API gateway](topic:architecture/api-gateway). At SkillKeepr, requests go through API Gateway to Lambda functions, and Lambda itself creates as many copies as needed, so there is no separate load balancer to manage.

## 🎯 Why do we use it?

- **To scale out:** add servers without changing the address clients use.
- **To survive failures:** broken servers are removed automatically.
- **To deploy without downtime:** take servers out one by one, update them, put them back.

## ⚠️ Common mistakes

- **In-memory sessions with several servers.** Users get logged out at random.
- **No health check endpoint,** so traffic keeps going to a dead server.
- **A health check that is too deep,** like one that fails whenever a third-party API is slow. Then all servers get removed at once.
- **Relying on sticky sessions** instead of fixing the state problem.

## 🗣️ How to answer in an interview

> "A load balancer gives clients one address and spreads requests across several app servers, using round robin or least connections. It runs health checks, so a broken server is taken out automatically, and it lets me deploy one server at a time without downtime. For this to work, the app servers must be stateless: sessions go into Redis or a signed JWT cookie, uploads go to S3, shared caches to Redis, and background work to a queue. Then any server can handle any request. I avoid sticky sessions, because they hide state problems and break when that server dies. On a serverless setup like API Gateway plus Lambda, the platform does this spreading for you."

## 🔁 Follow-up questions

### What is the difference between a load balancer and a reverse proxy?

A reverse proxy sits in front of servers and forwards requests (and can cache, compress, end TLS). A load balancer is a reverse proxy whose main job is spreading load across many servers. Nginx can be both.

### How does a deploy work without downtime?

Rolling deploy: remove one server from the load balancer, wait for its requests to finish, update it, check health, add it back, repeat. See [graceful shutdown](topic:nodejs/graceful-shutdown).

### Where does TLS end?

Often at the load balancer ("TLS termination"). It decrypts HTTPS and forwards plain HTTP inside the private network, which saves work on app servers.

### When would you use least connections over round robin?

When requests take very different times, like quick reads mixed with slow report exports. Least connections avoids piling up on a busy server.

## ✅ Quick check

### 1. With round robin and 3 servers, which server gets the 4th request?

:::answer
**Server 1.** It goes 1, 2, 3, then back to 1.
:::

### 2. Which of these makes a server stateful (bad for scaling out)?

- A) Storing sessions in Redis
- B) Storing uploaded files on the server's local disk
- C) Reading data from a shared database

:::answer
**B.** The next request may go to a different server that doesn't have the file. Use S3.
:::

### 3. What does the load balancer do when a server fails its health checks?

:::answer
It **stops sending traffic** to that server until it passes the health checks again.
:::
