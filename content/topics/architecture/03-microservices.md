---
title: "Microservices: pros and cons"
stack: architecture
order: 3
level: Basic
mustKnow: true
askedFrequency: very common
summary:
  - Microservices split a system into small, separate services. Each one owns one business area and its own data, and is deployed on its own.
  - Services talk over the network — HTTP/REST calls or events and queues.
  - "Pros: independent deploys, independent scaling, isolated failures, teams own their service, each service can use different tech."
  - "Cons: network calls can fail or be slow, data is spread out (no easy joins or transactions), and you must run, monitor and debug many things."
  - Use them when a team or a part of the system really needs independence — not by default.
cards:
  - q: What are microservices?
    a: An architecture where the system is split into small services, each owning one business area and its own data, deployed and scaled independently, talking over the network.
  - q: Give three advantages of microservices.
    a: Independent deploys, independent scaling, and failure isolation — plus team ownership and freedom of tech per service.
  - q: Give three disadvantages of microservices.
    a: Network calls that can fail or be slow, no easy cross-service transactions or joins, and much more operational work (deploys, monitoring, tracing).
  - q: Should two microservices share one database?
    a: Ideally no. Each service owns its data; others ask through its API or events. A shared database couples them again.
  - q: Why is the AI voice agent a separate service?
    a: Voice calls are long-running, real-time and sensitive to delay, so a separate service can be deployed, scaled and fixed on its own without risking the main platform.
---

## 💡 What is it?

**Microservices** split one big system into **small, separate services**.

Each service owns **one business area**, like jobs, candidates or billing. It has **its own data**. It is **deployed on its own**.

The services talk to each other **over the network**, using HTTP calls or messages.

## 🏠 Real-life example

Think of a **food court** instead of one big restaurant.

Each stall has its own cook, its own kitchen and its own cash box. The dosa stall can open, close or hire more cooks without asking the juice stall.

- **Each stall** = one microservice.
- **Its own kitchen and cash box** = its own code and its own data.
- **Customers walking between stalls** = network calls between services.
- **One stall closing** = one service down. The others keep serving.
- **The food court manager** = the extra work of running many stalls (monitoring, deploys).

But if you want a combo meal from three stalls, you must walk to three counters. That's slower than one counter. That is the cost of microservices.

## 🧑‍💻 Code example

Two tiny services in one script, each on its own port. The candidates service asks the jobs service **over HTTP**. Save as `microservices.js` and run `node microservices.js` (Node 18+).

```js
const http = require('node:http');                            // Node's built-in web server module

// ---- Service 1: the jobs service. It owns the jobs data. ----
const jobs = [{ id: 1, title: 'Node.js Developer' }];           // only this service touches jobs
const jobsService = http.createServer((req, res) => {          // a small server just for jobs
  const id = Number(req.url.split('/')[2]);                    // "/jobs/1" → 1
  const job = jobs.find((j) => j.id === id);                   // look up the job
  res.statusCode = job ? 200 : 404;                            // 200 = found, 404 = not found
  res.end(JSON.stringify(job ?? { error: 'Job not found' }));  // reply with JSON
});                                                            // end of jobs service

// ---- Service 2: the candidates service. It owns the candidates data. ----
const candidates = [{ id: 7, name: 'Asha', jobId: 1 }];        // only this service touches candidates
const candidatesService = http.createServer(async (req, res) => { // a small server just for candidates
  const c = candidates[0];                                     // keep the example short: one candidate
  const reply = await fetch(`http://localhost:4001/jobs/${c.jobId}`); // ask the jobs service OVER THE NETWORK
  const job = await reply.json();                              // turn its reply into an object
  res.end(JSON.stringify({ ...c, job: job.title }));           // combine and send back
});                                                            // end of candidates service

jobsService.listen(4001, () => {                               // start the jobs service on port 4001
  candidatesService.listen(4002, async () => {                 // start the candidates service on port 4002
    console.log('jobs service on 4001, candidates service on 4002'); // two separate apps now
    const res = await fetch('http://localhost:4002/candidates/7');   // a user calls the candidates service
    console.log(await res.text());                             // print the combined answer
    jobsService.close();                                       // stop service 1
    candidatesService.close();                                 // stop service 2
  });                                                          // end of service 2 start
});                                                            // end of service 1 start
```

**Output:**

```text
jobs service on 4001, candidates service on 4002
{"id":7,"name":"Asha","jobId":1,"job":"Node.js Developer"}
```

**What to notice:** the same result as the [monolith example](topic:architecture/monolith), but now getting the job title is a **network call**. In real life it could be slow, time out, or fail.

## 🔍 Deeper version

**Pros and cons:**

| | Microservices |
|---|---|
| ✅ Deploys | Each service ships on its own schedule |
| ✅ Scaling | Scale only the busy service |
| ✅ Failure isolation | One service crashing doesn't stop the others (if designed well) |
| ✅ Team ownership | One team owns one service end to end |
| ✅ Tech freedom | A Python service for AI next to Node services |
| ❌ Network | Calls can be slow, time out or fail |
| ❌ Data | No easy joins or transactions across services |
| ❌ Operations | Many deploys, logs, dashboards and alerts |
| ❌ Debugging | One user request crosses many services — you need request IDs and tracing |
| ❌ Testing | Contract tests between services, harder end-to-end tests |

**Key rules for good microservices:**
- **Own your data.** One database per service. Others ask through an API or listen to events.
- **Split by business area**, not by technical layer. "Billing service", not "database service".
- **Design for failure.** Use timeouts, retries with backoff and circuit breakers. See [resilience](topic:architecture/resilience).
- **Prefer events for side effects.** "Candidate applied" can trigger emails and scoring without the caller waiting. See [service communication](topic:architecture/service-communication).
- **Use an [API gateway](topic:architecture/api-gateway)** as one front door for clients.

**The "distributed monolith" trap.** Services that must always deploy together, or that share one database, give you the costs of microservices without the benefits.

**A real example.** At SkillKeepr, the AI voice agent is a **separate service** in its own repository, hosted on AWS. Phone calls are long-running and real-time, so it makes sense to deploy and scale it apart from the main platform. See [the voice agent story](topic:resume/voice-agent-microservice). [FILL IN: how the voice service and the main platform talk to each other.]

## 🎯 Why do we use it?

- **Big organisations.** Many teams can ship without waiting for each other.
- **Uneven load.** One busy part (like video processing) can scale alone.
- **Different needs.** One part needs Python and GPUs; another needs Node and low latency.
- **Safer failures.** A broken report service shouldn't stop people from logging in.

## ⚠️ Common mistakes

- **Starting with microservices** on a new product with a small team.
- **Sharing one database** between services, which couples them again.
- **Chatty services.** One page that needs 20 network calls is slow and fragile.
- **No timeouts.** One slow service makes every caller wait and pile up.
- **No tracing.** Without request IDs across services, debugging is guesswork.

## 🗣️ How to answer in an interview

> "Microservices split a system into small services, each owning one business area and its own data, deployed and scaled independently and talking over the network, through REST calls or events.
>
> The benefits are independent deploys, independent scaling, failure isolation and clear team ownership. The costs are real: network calls can fail or be slow, you lose easy joins and transactions across services, and you need much more operational work — monitoring, tracing, many pipelines.
>
> So I don't start with microservices. I'd split out a service when there's a clear reason. A good example from my work is our AI voice agent: phone calls are long-running and real-time, so it runs as a separate service on AWS and can be deployed and scaled on its own."

## 🔁 Follow-up questions

### How do microservices keep data consistent without a shared transaction?

They use **eventual consistency**. One service makes its change and publishes an event; others update themselves. For multi-step flows, a **saga** runs each step and runs "undo" steps if one fails. Consumers must be [idempotent](topic:architecture/idempotent-consumers), because events can arrive twice.

### How do you debug a request that crosses five services?

Give every request a **request ID** (or trace ID) and pass it in a header to every service. Log it everywhere. Tools like OpenTelemetry show the whole trace. See [logging with request IDs](topic:express/logging).

### How big should a microservice be?

Big enough to own one business area completely, small enough for one team to understand. "Micro" is about independence, not lines of code.

### What happens if a service you depend on is down?

Set a timeout, retry a few times with backoff, then fail gracefully: show cached data or a clear message, or queue the work to retry later. A circuit breaker stops calling a service that keeps failing.

## ✅ Quick check

### 1. In the code example, what could go wrong that can't happen in the monolith version?

:::answer
The call to the jobs service could **fail, time out or be slow**, because it goes over the network. In the monolith it was a plain function call.
:::

### 2. Two services read and write the same database tables. Is this a good microservice design?

:::answer
**No.** They're coupled through the database: a schema change in one breaks the other. Each service should own its data.
:::

### 3. Which is a real benefit of microservices?

- A) Fewer things to deploy
- B) Scaling only the service that is busy
- C) Easier transactions

:::answer
**B.** A and C are the opposite — microservices mean more deploys and harder transactions.
:::
