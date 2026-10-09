---
title: "Monolith: pros and cons"
stack: architecture
order: 2
level: Basic
mustKnow: true
askedFrequency: very common
summary:
  - A monolith is one application that contains all the features, built and deployed as one unit.
  - "Pros: simple to build, test, deploy and debug; features talk with fast function calls; one database makes joins and transactions easy."
  - "Cons: it grows big and slow to change; one bug can take everything down; you must scale the whole app even if one feature is busy."
  - Most products should START as a monolith. Split it only when there is a real reason.
  - A monolith is not "bad code". A well-structured monolith can serve millions of users.
cards:
  - q: What is a monolith?
    a: One application that holds all features, built and deployed together as one unit, usually with one database.
  - q: Give three advantages of a monolith.
    a: Simple to develop and deploy, fast in-process calls between features, and easy transactions and joins with one database.
  - q: Give three disadvantages of a monolith.
    a: A large codebase slows teams down, one bad deploy or crash affects every feature, and you must scale the whole app together.
  - q: Can a monolith scale?
    a: Yes. You can run many copies behind a load balancer (horizontal scaling) as long as the app is stateless.
  - q: When is a monolith the right choice?
    a: New products, small or medium teams, and when the feature boundaries are not clear yet.
---

## 💡 What is it?

A **monolith** is **one application** that contains **all the features**.

Jobs, candidates, billing, emails — all live in one codebase. You build it once and deploy it as one unit. Usually it uses one [database](glossary:database).

"Mono" means one. "Lith" means stone. So: one big stone.

## 🏠 Real-life example

Think of a **small family-run shop**.

One shop sells groceries, stationery and snacks. There is one shop owner, one counter and one cash box.

- The **one shop** = the monolith.
- The **sections** (groceries, stationery) = features.
- The **one cash box** = the one shared database.
- **Asking your brother at the next shelf** = a fast function call. No phone needed.
- **Closing the shop for repairs** = a deploy. Every section closes together.

It's easy to run. But if the shop gets very crowded, you can't make only the snacks section bigger. You must open a whole second shop.

## 🧑‍💻 Code example

One server, one process, two features sharing memory. Save as `monolith.js` and run `node monolith.js` (Node 18+ for built-in `fetch`).

```js
const http = require('node:http');                       // Node's built-in web server module

const jobs = [{ id: 1, title: 'Node.js Developer' }];      // jobs data, kept in memory
const candidates = [{ id: 7, name: 'Asha', jobId: 1 }];    // candidates data, in the SAME app

const server = http.createServer((req, res) => {          // one server handles every feature
  res.setHeader('Content-Type', 'application/json');      // every reply is JSON
  if (req.url === '/jobs') return res.end(JSON.stringify(jobs)); // the jobs feature
  if (req.url === '/candidates') {                        // the candidates feature
    const withJob = candidates.map((c) => ({              // join with jobs using a normal function call
      ...c,                                               // copy the candidate's fields
      job: jobs.find((j) => j.id === c.jobId).title,      // read jobs directly — same memory, no network
    }));                                                  // end of map
    return res.end(JSON.stringify(withJob));              // send the joined result
  }                                                       // end of /candidates
  res.statusCode = 404;                                   // 404 = no such page
  res.end(JSON.stringify({ error: 'Not found' }));        // tell the caller
});                                                       // end of the request handler

server.listen(3000, async () => {                         // start ONE process on port 3000
  console.log('One app on port 3000');                   // print that it started
  console.log(await (await fetch('http://localhost:3000/jobs')).text());       // call the jobs feature
  console.log(await (await fetch('http://localhost:3000/candidates')).text()); // call the candidates feature
  server.close();                                         // stop the server so the script ends
});                                                       // end of listen
```

**Output:**

```text
One app on port 3000
[{"id":1,"title":"Node.js Developer"}]
[{"id":7,"name":"Asha","jobId":1,"job":"Node.js Developer"}]
```

**What to notice:** the candidates feature reads jobs with a plain `find()`. No network, no extra service. Compare this with the [microservices example](topic:architecture/microservices).

## 🔍 Deeper version

**Pros and cons:**

| | Monolith |
|---|---|
| ✅ Development | One repo, one setup, easy to run locally |
| ✅ Speed of calls | In-process function calls (nanoseconds, never "network down") |
| ✅ Data | One database: easy joins and [transactions](glossary:transaction) |
| ✅ Deploy | One pipeline, one thing to roll back |
| ✅ Debugging | One log stream, one stack trace |
| ❌ Size | The codebase grows; build and test get slow |
| ❌ Teams | Many teams in one codebase step on each other |
| ❌ Blast radius | A memory leak or crash in one feature can take down all features |
| ❌ Scaling | You scale everything together, even if only one feature is busy |
| ❌ Tech choice | Usually one language and one framework for everything |

**Scaling a monolith.** A monolith can scale **horizontally**: run many copies behind a load balancer. It must be **stateless** — keep sessions and cache in a shared place like Redis, not in memory. See [cluster and PM2](topic:nodejs/cluster-and-pm2).

**The "big ball of mud".** The real problem is usually not "one deploy" but **no boundaries inside**. Any file calls any other file. The fix is often a [modular monolith](topic:architecture/modular-monolith), not microservices.

**Serverless monolith.** One codebase can be deployed as many small cloud functions. SkillKeepr's main backend works this way: one codebase, deployed as many AWS Lambda functions. It shares code like a monolith, but each function scales on its own. See [serverless and Lambda](topic:architecture/serverless-lambda).

**Famous examples.** Shopify and Basecamp run very large, successful monoliths. Size alone is not a reason to split.

## 🎯 Why do we use it?

- **Speed at the start.** A new product changes every week. One codebase is the fastest way to move.
- **Low cost.** One app to host, monitor and deploy.
- **Simple data.** One database keeps data consistent with transactions.
- **Small teams.** A team of 3–15 people works well in one codebase.

## ⚠️ Common mistakes

- **Calling a monolith "legacy" by default.** A well-structured monolith is a good architecture.
- **No inner boundaries.** Letting every module touch every table creates a "big ball of mud".
- **Keeping state in memory** (sessions, caches), which stops you running more than one copy.
- **Splitting too early** into microservices before the boundaries are clear.

## 🗣️ How to answer in an interview

> "A monolith is one application with all the features, built and deployed as one unit, usually with one database. Its strengths are simplicity: one codebase, fast in-process calls, easy transactions and joins, and one thing to deploy and debug.
>
> Its weaknesses show up with size: builds and tests get slow, many teams collide in one codebase, a crash in one feature can take down everything, and you have to scale the whole app even if only one part is busy.
>
> I think most products should start as a well-structured monolith with clear modules inside. It can still scale horizontally if it's stateless. I'd only split out a service when there's a concrete reason, like a part that needs to scale or deploy independently."

## 🔁 Follow-up questions

### Can a monolith handle a lot of traffic?

Yes. Run many identical copies behind a load balancer. Keep the app stateless, add caching and database indexes, and move slow work to background queues.

### What is the biggest risk of a monolith?

Losing structure as it grows. When every part depends on every other part, any change becomes risky and slow. Clear module boundaries prevent this.

### How do you deploy a monolith without downtime?

Run at least two copies. Replace them one at a time (a rolling deploy), or start the new version next to the old one and switch traffic (blue-green). A [health check](topic:express/health-checks) tells the load balancer when the new copy is ready.

### Is a serverless backend a monolith or microservices?

It depends on how it's organised. One codebase deployed as many functions is often called a **serverless monolith**: shared code and one deploy pipeline, but each function runs and scales separately.

## ✅ Quick check

### 1. In the code example, how does the candidates feature get the job title?

:::answer
With a normal function call, `jobs.find(...)`, on data in the same process. There is no network call.
:::

### 2. Which is NOT usually a monolith advantage?

- A) Easy transactions across features
- B) Scaling one feature independently
- C) One simple deploy

:::answer
**B.** In a monolith you scale the whole app together. Independent scaling is a microservices strength.
:::

### 3. True or false: to run a monolith on 3 servers, sessions should be kept in the app's memory.

:::answer
**False.** In-memory sessions break when a user's next request hits another copy. Keep shared state in Redis or a database.
:::
