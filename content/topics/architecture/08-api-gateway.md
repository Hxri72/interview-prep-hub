---
title: API gateway
stack: architecture
order: 8
level: Intermediate
mustKnow: false
askedFrequency: common
summary:
  - An API gateway is one front door for all clients. It receives every request and forwards it to the right backend service.
  - It handles shared jobs in one place — routing, authentication, rate limiting, CORS, TLS, logging and request size limits.
  - Clients only know one address, so services can move, split or change without breaking clients.
  - "Examples: AWS API Gateway, Kong, NGINX, Azure API Management, or a small custom Node gateway."
  - "Watch out: it's a single point of failure and an extra hop, so keep business logic out of it and run it highly available."
cards:
  - q: What is an API gateway?
    a: A single entry point that sits in front of backend services, receives every client request, applies shared rules and forwards it to the right service.
  - q: Name four things an API gateway commonly handles.
    a: Routing, authentication/API keys, rate limiting, and TLS/CORS — also logging, request size limits and response caching.
  - q: Why not let clients call each service directly?
    a: Clients would need every service's address, every service would repeat auth and rate limits, and you couldn't move or split services without breaking clients.
  - q: What should NOT go in a gateway?
    a: Business logic. It should stay a thin layer of shared, cross-cutting rules.
  - q: What is a well-known limit of AWS API Gateway REST APIs?
    a: The integration timeout — 29 seconds by default — so long jobs need another path, like async processing or a Lambda Function URL.
---

## 💡 What is it?

An **API gateway** is **one front door** for all clients.

Every request from the web app or mobile app goes to the gateway first. The gateway checks it, then **forwards** it to the right backend service.

Shared jobs like checking the login, limiting too many requests, and logging happen **once**, at the door.

## 🏠 Real-life example

Think of the **school security gate**.

Every visitor enters through one gate. The guard checks their ID, writes their name in the register, and tells them which block to go to.

- **The one gate** = the API gateway.
- **Checking the ID** = authentication or an API key check.
- **The visitor register** = logging.
- **"Only 20 visitors per hour"** = rate limiting.
- **"Science block is to the left"** = routing to the right service.
- **The blocks inside** = the backend services.

The blocks don't each need their own guard. And if the science block moves, visitors still use the same gate.

## 🧑‍💻 Code example

A tiny gateway in front of two services. It checks an API key once, then forwards by path. Save as `gateway.js` and run `node gateway.js` (Node 18+).

```js
const http = require('node:http');                                  // Node's built-in web server module

const jobs = http.createServer((req, res) => res.end('jobs service: ' + req.url));             // service A on 8081
const candidates = http.createServer((req, res) => res.end('candidates service: ' + req.url)); // service B on 8082

const routes = { '/jobs': 8081, '/candidates': 8082 };               // the gateway's map: path start → service port

const gateway = http.createServer(async (req, res) => {             // the ONE front door for all clients
  if (req.headers['x-api-key'] !== 'secret-123') {                  // shared rule 1: check the key once, here
    res.statusCode = 401;                                           // 401 = who are you?
    return res.end('missing or wrong API key');                     // stop before any service is called
  }                                                                 // end of key check
  const prefix = '/' + req.url.split('/')[1];                       // "/jobs/1" → "/jobs"
  const port = routes[prefix];                                      // find which service owns this path
  if (!port) { res.statusCode = 404; return res.end('no such route'); } // unknown path → 404
  const reply = await fetch(`http://localhost:${port}${req.url}`); // forward the request to that service
  res.end(await reply.text());                                      // pass the service's answer back
});                                                                 // end of gateway

jobs.listen(8081);                                                  // start service A
candidates.listen(8082);                                            // start service B
gateway.listen(8080, async () => {                                  // start the gateway on 8080
  const call = (path, key) => fetch('http://localhost:8080' + path, { headers: { 'x-api-key': key } }).then((r) => r.text()); // helper to call the gateway
  console.log(await call('/jobs/1', 'secret-123'));                 // goes to the jobs service
  console.log(await call('/candidates/7', 'secret-123'));           // goes to the candidates service
  console.log(await call('/jobs/1', 'wrong'));                      // blocked at the gateway
  [jobs, candidates, gateway].forEach((s) => s.close());            // stop everything
});                                                                 // end of gateway start
```

**Output:**

```text
jobs service: /jobs/1
candidates service: /candidates/7
missing or wrong API key
```

**What to notice:** the services never check the API key. The gateway did it once, for both. A real gateway would also add a timeout to `fetch` and pass on headers like a request ID.

## 🔍 Deeper version

**What a gateway usually does:**

| Job | Example |
|---|---|
| Routing | `/jobs/*` → jobs service, `/billing/*` → billing service |
| Authentication | Check a JWT or API key; pass the user ID on in a header |
| Rate limiting / throttling | 100 requests per minute per API key |
| TLS termination | Handle HTTPS certificates in one place |
| CORS | Answer browser preflight requests |
| Request limits | Reject bodies that are too large |
| Logging and metrics | One place to see all traffic |
| Caching | Cache simple GET responses |
| Transformation | Change paths or headers between client and service |

**Popular options:**
- **AWS API Gateway** — managed. REST APIs, HTTP APIs and WebSocket APIs. Common in front of Lambda.
- **Kong, NGINX, Traefik, Envoy** — self-hosted or managed.
- **Cloud load balancers** — some simple routing, but fewer gateway features.
- **A small Node/Express gateway** — fine for small systems.

**AWS API Gateway facts worth knowing:**
- REST APIs have a default **integration timeout of 29 seconds**. Longer work must run asynchronously, or through another path like a **Lambda Function URL**.
- It supports **custom domains**, usage plans and API keys, request validation, and **authorizers** (a function that checks the token before your code runs).
- WebSocket APIs keep connections open for real-time features.

**Backend for Frontend (BFF).** Sometimes each client gets its own small gateway — one for the web app, one for the mobile app. Each returns exactly the data its client needs.

**Gateway vs load balancer.** A load balancer spreads traffic across **copies of one service**. A gateway routes across **different services** and applies API rules. Many systems use both.

**A real example.** At SkillKeepr, the backend's HTTP routes sit behind **AWS API Gateway**, which forwards requests to AWS Lambda functions. Some long-running jobs use Lambda Function URLs because of the gateway's timeout. See [the platform architecture story](topic:resume/platform-architecture). [FILL IN: anything you configured in API Gateway yourself.]

## 🎯 Why do we use it?

- **One address for clients.** Services can move or split behind it.
- **No repeated code.** Auth, rate limits and CORS are done once, not in every service.
- **Security at the edge.** Bad or unauthenticated requests are stopped before they reach your code.
- **One place to watch traffic.**

## ⚠️ Common mistakes

- **Putting business logic in the gateway.** It becomes a hidden monolith that every team must change.
- **Running only one gateway instance.** If it falls over, everything is down.
- **Trusting the gateway alone.** Services should still check permissions for their own data.
- **Forgetting timeouts and limits**, like long jobs hitting the 29-second limit on AWS API Gateway REST APIs.

## 🗣️ How to answer in an interview

> "An API gateway is the single entry point in front of backend services. Every client request hits it first; it applies shared rules and forwards the request to the right service. Typical jobs are routing, authentication and API keys, rate limiting, TLS and CORS, request size limits, and logging.
>
> The benefits are that clients only know one address, so services can change behind it, and cross-cutting concerns aren't repeated in every service. The risks are that it's an extra hop and a single point of failure, so it must be highly available and stay thin — no business logic.
>
> On the platform I work on, AWS API Gateway sits in front of our Lambda functions. One practical thing I learned is its 29-second integration timeout for REST APIs, so long-running work has to go async or through a different path."

## 🔁 Follow-up questions

### Where should authentication happen — gateway or service?

Both, in different ways. The gateway checks **who you are** (a valid token or key) and rejects bad requests early. Each service still checks **what you can do** with its own data (authorization), because it knows the business rules.

### How does a gateway do rate limiting?

It counts requests per key, user or IP in a time window (for example with a token bucket). Over the limit, it returns `429 Too Many Requests`. With several gateway copies, the counters live in a shared store like Redis.

### What is the difference between an API gateway and a reverse proxy?

A reverse proxy forwards requests to servers behind it. An API gateway is a reverse proxy **plus** API features: auth, rate limits, API keys, request validation and usage tracking.

### How do you handle a request that takes 2 minutes behind AWS API Gateway?

Don't keep the HTTP request open. Return `202 Accepted` with a job ID, process it in the background (a queue or worker), and let the client poll for status or get a push notification.

## ✅ Quick check

### 1. In the code example, why doesn't the jobs service check the API key?

:::answer
The gateway already checked it. Requests without a valid key are stopped at the door (`401`) and never reach the services.
:::

### 2. Which job does NOT belong in an API gateway?

- A) Rate limiting
- B) Calculating a candidate's match score
- C) Checking an API key

:::answer
**B.** That's business logic, which belongs in a service.
:::

### 3. A request to an AWS API Gateway REST API needs 60 seconds of processing. What happens, and what's a fix?

:::answer
It hits the default **29-second integration timeout** and the client gets a timeout error. Fix: process it asynchronously (return `202` plus a job ID) or use a path without that limit, like a Lambda Function URL.
:::
