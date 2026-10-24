---
title: Microservices with Node and MongoDB
stack: mern-architectures
order: 15
level: Intermediate
mustKnow: true
askedFrequency: very common
template: pattern
section: Backend structure
summary:
  - "In a MERN microservices setup, the backend is split into small Node services (users, jobs, payments). Each one runs, deploys and scales on its own."
  - Each service owns its own MongoDB database. Others get its data only through its API or its events, never by querying its database.
  - The React app usually talks to one front door (an API gateway or a BFF), which routes requests to the right service.
  - Services talk over HTTP for "I need an answer now" and over queues/events for "something happened, react when you can".
  - "It solves team and scaling problems, but adds network failures, harder debugging and data consistency work. Don't start here by default."
cards:
  - q: What does "database per service" mean?
    a: Each microservice has its own database that only it reads and writes. Other services must use its API or events to get that data.
  - q: How does the React app reach many microservices?
    a: Usually through one front door, an API gateway or a BFF, which routes each request to the right service.
  - q: When should a service call another over HTTP vs send an event?
    a: HTTP when it needs an answer right now to finish the request. An event or queue message when other services only need to react later.
  - q: What is the biggest new problem microservices bring?
    a: "Things now fail over the network: timeouts, partial failures and data spread across databases, so you need retries, idempotency and good logging."
---

## 💡 What is it?

In a normal MERN app, there is one Express backend. With **[microservices](glossary:microservice)**, you split the backend into several small Node services. For example: a **users** service, a **jobs** service and a **payments** service.

Each service is its own small Express (or NestJS) app. It has its own code, its own deploy and its own MongoDB database.

The React app doesn't call every service directly. It usually goes through one front door, called an **[API gateway](glossary:api-gateway)**.

## 🏠 Real-life example

Think of **a food court in a mall**.

There is no single big kitchen. Each stall (pizza, dosa, juice) has its own cooks, its own fridge and its own menu. One stall can be busy while another is quiet. One stall can close for repair, and the rest keep selling.

- **Each stall** = one microservice (users, jobs, payments).
- **Each stall's own fridge** = each service's own MongoDB database.
- **The food court's help desk that tells you where to go** = the API gateway.
- **The customer** = the React app.
- **A stall asking another "do you have cold milk?"** = one service calling another over HTTP.
- **The announcement "Table 5's order is ready"** = an event that any stall can listen for.
- **The juice stall can't open the pizza stall's fridge** = a service never reads another service's database.

## 🗺️ The diagram

```text
                     React SPA (browser)
                            │  HTTPS
                            ▼
                ┌──────────────────────────┐
                │  API gateway / BFF       │  checks the token, routes by path
                └───┬──────────┬───────────┘
          /users/*  │   /jobs/* │      /payments/*
                    ▼          ▼              ▼
             ┌──────────┐ ┌──────────┐  ┌─────────────┐
             │ users    │ │ jobs     │  │ payments    │   each: Node + Express,
             │ service  │◄┤ service  │  │ service     │   own deploy, own scaling
             └────┬─────┘ └────┬─────┘  └──────┬──────┘
          HTTP ▲  │            │               │
   ("who is user 1?")          │               │
                  ▼            ▼               ▼
             [users DB]   [jobs DB]      [payments DB]     database per service

         jobs ──"job.created" event──► queue ──► payments, notifications ...
```

## 🧑‍💻 Code example

This demo runs three small services from one file, so you can see the wiring. In real life, each is a separate project and deploy.

Set up and run (Node 24 has `fetch` built in):

```bash
npm init -y
npm install express
node micro.js
```

Save this as `micro.js`:

```js
const express = require('express');                                       // load Express

// ---------- users service (port 4001), owns the users data ----------
const usersApp = express();                                               // its own Express app
const usersDb = [{ id: 1, name: 'Asha' }];                                // stands in for the users MongoDB database
usersApp.get('/users/:id', (req, res) => {                                // its public API
  const user = usersDb.find((u) => u.id === Number(req.params.id));       // look up in ITS OWN data
  user ? res.json(user) : res.status(404).json({ error: 'Not found' });   // 404 = no such user
});                                                                       // end of users route
usersApp.listen(4001, () => console.log('users service on 4001'));       // runs on its own port

// ---------- jobs service (port 4002), owns the jobs data ----------
const jobsApp = express();                                                // a separate Express app
const jobsDb = [{ id: 10, title: 'Node developer', createdBy: 1 }];       // stands in for the jobs MongoDB database
jobsApp.get('/jobs/:id', async (req, res) => {                            // its public API
  const job = jobsDb.find((j) => j.id === Number(req.params.id));        // look up in ITS OWN data
  if (!job) return res.status(404).json({ error: 'Not found' });         // 404 = no such job
  try {                                                                   // the users service may be down
    const r = await fetch(`http://localhost:4001/users/${job.createdBy}`, { signal: AbortSignal.timeout(2000) }); // HTTP call, 2000 ms timeout
    const owner = r.ok ? await r.json() : null;                           // r.ok = status 200–299
    res.json({ ...job, createdByName: owner?.name ?? 'unknown' });        // combine the two answers
  } catch {                                                               // timeout or network error
    res.json({ ...job, createdByName: 'unknown' });                       // degrade gracefully, don't crash
  }                                                                       // end of try/catch
});                                                                       // end of jobs route
jobsApp.listen(4002, () => console.log('jobs service on 4002'));         // runs on its own port

// ---------- a tiny gateway (port 3000): the ONE address React calls ----------
const gateway = express();                                                // the front door
const routes = { users: 'http://localhost:4001', jobs: 'http://localhost:4002' }; // path prefix → service address
gateway.get('/api/:service/:id', async (req, res) => {                    // e.g. /api/jobs/10
  const base = routes[req.params.service];                                // pick the service by name
  if (!base) return res.status(404).json({ error: 'Unknown service' });   // 404 = no such service
  const r = await fetch(`${base}/${req.params.service}/${req.params.id}`); // forward the request
  res.status(r.status).json(await r.json());                              // pass the answer back to React
});                                                                       // end of gateway route
gateway.listen(3000, () => console.log('gateway on 3000'));              // React only knows this port
```

```text
$ curl localhost:3000/api/jobs/10
{"id":10,"title":"Node developer","createdBy":1,"createdByName":"Asha"}
```

Stop the users service and try again. The jobs service still answers, with `"createdByName":"unknown"`. That is a partial failure handled well.

## 🔍 Deeper version

General pros, cons and "when to split" are in [microservices](topic:architecture/microservices) and [when to split](topic:architecture/when-to-split). This page is about wiring them in a MERN app.

**1. Database per service.** Each service has its own MongoDB database (often on the same Atlas cluster at first). Only that service has the connection string. This keeps services independent. But you lose:
- `$lookup` across services. You join in code or keep copies.
- One transaction across services. You use a **saga**: a chain of local steps, each with an "undo" step if a later one fails.

**2. How services talk.** See [service communication](topic:architecture/service-communication).

| Style | Use when | Tools |
|---|---|---|
| Sync HTTP (REST, gRPC) | You need the answer to finish this request | `fetch`, axios, gRPC |
| Async events / queues | Others only need to react later | SQS, SNS, RabbitMQ, Kafka, BullMQ |

Every HTTP call needs a **timeout**, limited **retries** and ideally a **circuit breaker** (stop calling a service that keeps failing). See [resilience](topic:architecture/resilience).

**3. The front door.** React calls one address. An [API gateway or a BFF](topic:mern-architectures/bff-api-gateway) checks the JWT once, then routes `/api/jobs/*` to the jobs service.

**4. Keeping copies of data.** The jobs service often needs a user's name. Calling users every time is slow. Instead, users publishes `user.updated` events, and jobs keeps a small copy (`createdByName`). The copy is **eventually consistent**: it may be a few seconds old.

**5. Observability (seeing what's happening).** One click can touch five services. So:
- Pass a **correlation ID** (one ID per request) in a header to every service, and log it.
- Use structured JSON logs and central logging (for example CloudWatch).
- Add tracing with OpenTelemetry if you can.

**6. Shared code.** Teams often share a small library for auth checks, logging and response shapes. Keep it about **plumbing**, not business rules. Otherwise every service must redeploy for one change.

**7. NestJS** has a built-in [microservices](topic:nestjs/microservices) package with transports like TCP, Redis and RabbitMQ.

## ⚖️ Pros and cons

| Pros | Cons |
|---|---|
| Scale only the busy service | Network calls can fail, time out or be slow |
| Deploy one service without touching others | Debugging a request across services is hard |
| A bug in one service doesn't crash the rest | No easy joins or transactions across databases |
| Different teams own different services | More pipelines, configs, dashboards and cost |
| Each service can use the best tool (for example, a Python AI service) | Shared data must be kept in sync with events |

## 🎯 When to choose it

- **Several teams** keep blocking each other in one codebase.
- **Very different load:** for example, resume parsing needs lots of CPU, but the profile API is light.
- **Different languages or runtimes:** a Python AI service next to Node services.
- **Different release speeds:** payments must be very stable, but the UI-facing API changes daily.
- **Not for:** a new product, a small team or an MVP. Start with a [modular monolith](topic:mern-architectures/modular-monolith) and split later.

## ⚠️ Common mistakes

- **A shared database.** If two services read the same collection, they are tied together. That is a "distributed monolith".
- **Long chains of sync calls.** If A calls B calls C calls D, one slow service makes everything slow. Use events where you can.
- **No timeouts.** One stuck service then ties up every service that calls it.
- **Splitting too small, too early.** Ten tiny services for a 3-person team means more ops work than feature work.

## 🗣️ How to answer in an interview

> "In a MERN microservices setup, the backend is split into small Node services by business area, like users, jobs and payments. Each one deploys and scales on its own and owns its own MongoDB database. No other service touches that database.
>
> The React app talks to one front door, an API gateway or a BFF, which checks the JWT and routes the request. Services call each other over HTTP when they need an answer right away, with timeouts and retries. For 'something happened' they publish events on a queue.
>
> The trade-off is complexity. You get network failures, no cross-database joins or transactions, and harder debugging. So you need correlation IDs, central logs and idempotent consumers. I'd only split when team size or very different scaling needs justify it, and start with a modular monolith otherwise.
>
> At SkillKeepr, the backend is many AWS Lambda functions behind API Gateway, with shared core libraries. The AI voice agent is a separate Python FastAPI service that the Node backend calls over HTTP and that calls back with the result."

## 🔁 Follow-up questions

### How do you handle a transaction that spans two services?

Use a **saga**. Each service does its own local step and publishes an event. If a later step fails, earlier services run a "compensating" step, like refunding a payment. It's eventually consistent, not instant.

### How does authentication work across services?

The gateway checks the JWT once. Then it forwards the user ID and roles in headers or passes the token along. Each service still checks what that user is allowed to do. Service-to-service calls can use their own tokens or keys.

### How is this different from serverless?

Microservices is about **splitting by business area**. Serverless is about **how code runs** (functions, no servers to manage). You can have serverless microservices, where each service is a set of Lambda functions. See [serverless MERN](topic:mern-architectures/serverless-mern).

### How do you find a bug that crosses three services?

Search the logs by one correlation ID that every service logs. Distributed tracing shows the full path and where the time went.

## ✅ Quick check

### 1. The jobs service needs a user's email. Which is wrong?

- A) Call `GET /users/:id` on the users service
- B) Keep a copy of the email, updated from `user.updated` events
- C) Connect to the users MongoDB database and query it directly

:::answer
**C.** Reading another service's database breaks the "database per service" rule and ties the two services together.
:::

### 2. Why does the code example pass `AbortSignal.timeout(2000)` to `fetch`?

:::answer
So the jobs service stops waiting after 2 seconds if the users service is slow or down. Without a timeout, requests can hang and pile up.
:::

### 3. True or false: microservices are the best default for a new MVP.

:::answer
**False.** For a new product, a monolith or modular monolith is usually faster to build and run. Split later when there's a real reason.
:::
