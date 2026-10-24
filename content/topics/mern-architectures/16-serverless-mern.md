---
title: Serverless MERN (S3/CloudFront + Lambda + Atlas)
stack: mern-architectures
order: 16
level: Intermediate
mustKnow: true
askedFrequency: common
template: pattern
section: Backend structure
summary:
  - "Serverless MERN: the React build sits in S3 behind CloudFront, the API is AWS Lambda functions behind API Gateway, and the data is in MongoDB Atlas."
  - There is no always-on Express server. Each request starts (or reuses) a small function, and you pay per request.
  - "Connect to MongoDB outside the handler and reuse the connection, or every request opens a new one and Atlas runs out of connections."
  - Watch the limits - cold starts, a 29-second default API Gateway timeout, and 15 minutes max per Lambda run. Long jobs go to queues, Step Functions or AWS Batch.
  - SkillKeepr uses this style - three React SPAs on S3 + CloudFront and many Node + TypeScript Lambdas behind API Gateway.
cards:
  - q: What are the three parts of a serverless MERN app on AWS?
    a: "React build in S3 served by CloudFront, the API as Lambda functions behind API Gateway, and MongoDB Atlas (or another managed MongoDB) for data."
  - q: Why do you create the Mongoose connection outside the Lambda handler?
    a: "Code outside the handler runs once per warm container, so the connection is reused across requests instead of opening a new one each time."
  - q: What is a cold start?
    a: The extra delay when AWS must start a new Lambda container and load your code before it can run the first request.
  - q: Where does long-running work go in serverless?
    a: "Into async services: SQS queues, Step Functions, EventBridge schedules or AWS Batch, not into the API Lambda."
---

## 💡 What is it?

In a classic MERN app, an Express server runs all day, waiting for requests. In a **[serverless](glossary:serverless)** MERN app, there is no always-on server.

- **React (frontend):** the build files sit in **S3** (file storage) and are served fast by **CloudFront** (a [CDN](glossary:cdn)).
- **Express-style API:** each route is an **AWS Lambda** function. **API Gateway** receives the HTTP request and runs the right function.
- **MongoDB:** a managed database like **MongoDB Atlas**.

AWS starts the functions only when requests come in. You pay per request, not per hour.

## 🏠 Real-life example

Think of **booking an auto-rickshaw with an app** instead of owning a car.

You don't buy a car, park it or service it. When you need a ride, the app sends one. You pay only for the trip. During a festival, many autos come at once.

- **Owning a car that sits in the parking lot** = an always-on Express server you pay for 24/7.
- **Booking an auto per trip** = a Lambda function that runs per request.
- **The booking app** = API Gateway, which takes the request and sends the right function.
- **The auto taking a minute to arrive** = a cold start.
- **Many autos on a festival day** = Lambda scaling up automatically.
- **The printed bus timetable at the bus stand** = the React files in S3 + CloudFront. They are ready for anyone, and no driver is needed.
- **Your bank locker** = MongoDB Atlas: the data stays safe, whichever auto you took.

## 🗺️ The diagram

```text
 Browser
   │ 1. GET app.example.com                       │ 3. fetch /api/jobs (cookie with JWT)
   ▼                                              ▼
┌───────────────┐                         ┌─────────────────┐
│  CloudFront   │  (CDN, HTTPS, caching)  │  API Gateway    │  routes + (optional) authorizer
└──────┬────────┘                         └───┬─────────┬───┘
       │ 2. index.html, JS, CSS               │         │
       ▼                                      ▼         ▼
┌───────────────┐                      ┌──────────┐ ┌──────────┐
│  S3 bucket    │  React build (dist/) │ Lambda:  │ │ Lambda:  │   Node 24 + TypeScript,
└───────────────┘                      │ getJobs  │ │ createJob│   Mongoose, Joi
                                       └────┬─────┘ └────┬─────┘
                                            │ reused connection
                                            ▼
                                     ┌─────────────────┐
                                     │  MongoDB Atlas  │
                                     └─────────────────┘
   Background:  createJob ──► SQS queue ──► worker Lambda
                EventBridge schedule (cron) ──► Lambda
                Step Functions ──► multi-step workflows │ AWS Batch ──► long, heavy jobs
```

## 🧑‍💻 Code example

One Lambda handler with a reused Mongoose connection.

Set up:

```bash
npm init -y
npm install mongoose
```

Save this as `getJob.mjs`:

```js
import mongoose from 'mongoose';                                          // the MongoDB ODM

const Job = mongoose.models.Job ??                                        // reuse the model if it already exists
  mongoose.model('Job', new mongoose.Schema({ title: String }));          // otherwise create it once

let conn = null;                                                          // lives OUTSIDE the handler = survives between warm calls

async function connect() {                                                // connect once per container
  if (!conn) {                                                            // first call in this container?
    conn = mongoose.connect(process.env.MONGODB_URI, {                    // MONGODB_URI = Atlas connection string
      maxPoolSize: 2,                                                     // 2 = small pool; many containers share Atlas
      serverSelectionTimeoutMS: 5000,                                     // 5000 ms = give up fast if Atlas can't be reached
    });                                                                   // end of connect options
  }                                                                       // end of if
  return conn;                                                            // the same promise every time after
}                                                                         // end of connect

export async function handler(event) {                                    // API Gateway calls this per request
  await connect();                                                        // fast after the first (cold) call
  const id = event.pathParameters?.id;                                    // from the route GET /jobs/{id}
  const job = await Job.findById(id).lean();                              // lean() = plain object, faster
  return {                                                                // the HTTP response for API Gateway
    statusCode: job ? 200 : 404,                                          // 200 = OK, 404 = not found
    headers: { 'Content-Type': 'application/json' },                      // tell the browser it's JSON
    body: JSON.stringify(job ?? { error: 'Not found' }),                  // body must be a string
  };                                                                      // end of the response
}                                                                         // end of handler
```

Try it locally without AWS. Save this as `invoke.mjs`:

```js
import { handler } from './getJob.mjs';                                   // load the Lambda handler

const fakeEvent = { pathParameters: { id: '665f1c2e8a1b2c3d4e5f6a7b' } };  // shaped like an API Gateway event
console.log(await handler(fakeEvent));                                   // call it like AWS would
process.exit(0);                                                         // 0 = success; close the open DB connection
```

```bash
MONGODB_URI="mongodb+srv://..." node invoke.mjs
```

```text
{ statusCode: 404, headers: { 'Content-Type': 'application/json' }, body: '{"error":"Not found"}' }
```

The route itself is declared in config. With the Serverless Framework, part of `serverless.yml` looks like this:

```yaml
functions:                       # every Lambda in this service
  getJob:                        # the function's name
    handler: getJob.handler      # file getJob, exported function handler
    events:                      # what triggers it
      - httpApi:                 # an API Gateway HTTP API route
          path: /jobs/{id}       # {id} becomes event.pathParameters.id
          method: get            # only GET requests
```

## 🔍 Deeper version

General Lambda ideas are in [serverless and Lambda](topic:architecture/serverless-lambda) and [serverless limits](topic:architecture/serverless-limits). Hosting the React part is in [hosting the frontend on AWS](topic:web-fundamentals/hosting-frontend-aws).

**Frontend: S3 + CloudFront.**
- `npm run build` makes `dist/`. You upload it to a private S3 bucket.
- CloudFront serves it over HTTPS from locations near users.
- For an [SPA](glossary:spa), CloudFront must return `index.html` for unknown paths like `/jobs/10`, so React Router can handle them.
- After each deploy, you invalidate CloudFront's cache for `index.html`. Hashed JS files can be cached for a long time.

**Backend: one function per route, or one per area.**

| Style | How | Trade-off |
|---|---|---|
| One function per route | `getJob`, `createJob`, ... | Small, focused; many functions to manage |
| One function per area ("lambdalith") | Run a whole Express app in one Lambda with an adapter | Easy to move existing Express code; bigger cold starts |

**MongoDB connections.** Each warm container holds its own pool. 200 containers × 5 connections = 1000 connections. So:
- Connect **outside** the handler and reuse it.
- Keep `maxPoolSize` small.
- Watch Atlas connection limits. Pick a cluster size that fits your peak.

**Limits to plan for:**
- **Cold starts:** often a few hundred ms for Node. Smaller bundles help. Provisioned concurrency keeps some containers warm, for a cost.
- **Time:** API Gateway REST APIs time out at 29 seconds by default. Lambda can run up to 15 minutes.
- **No local state:** don't keep sessions in memory. Use JWT cookies, the database or a cache.

**Background work.** Anything slow leaves the request:
- **SQS:** a queue a worker Lambda reads from.
- **EventBridge:** cron-like schedules (like "every day at 2 AM").
- **Step Functions:** multi-step workflows with retries.
- **AWS Batch:** long or heavy jobs that don't fit in Lambda.

See [event-driven backend with queues](topic:mern-architectures/event-driven-queues).

**Multi-tenant.** SkillKeepr reads the tenant from the subdomain. It travels as a header and is locked inside the JWT. Each tenant has its own MongoDB database. See [multi-tenant SaaS scenario](topic:mern-architectures/scenario-multi-tenant-saas).

:::version[Version note]
Node.js 24 is a supported Lambda runtime. Older Node runtimes reach end of support over time, so keep the runtime in your config up to date. Also check the Serverless Framework licence terms: v4 changed them for larger companies. AWS SAM and AWS CDK are common free alternatives.
:::

## ⚖️ Pros and cons

| Pros | Cons |
|---|---|
| No servers to patch or keep running | Cold starts add delay on the first request |
| Scales up and down automatically | Time limits: 29 s API Gateway default, 15 min Lambda max |
| Pay per request; cheap when traffic is low | Database connections need care |
| Each function deploys and fails on its own | Harder to run and debug the whole system locally |
| Fits well with SQS, EventBridge and Step Functions | Many functions and configs to manage; vendor lock-in |

## 🎯 When to choose it

- **Traffic that goes up and down**, like a recruitment SaaS that is busy in office hours and quiet at night.
- **A small team** that doesn't want to manage servers, patches and scaling.
- **Lots of background and event work** (queues, crons, webhooks) that fits AWS services well.
- **Not ideal for:** constant heavy traffic (servers can be cheaper), very low-latency APIs that can't accept cold starts, or long-lived connections like a busy WebSocket chat (possible, but simpler with servers).

## ⚠️ Common mistakes

- **Connecting to MongoDB inside the handler.** Every request opens a new connection, and Atlas hits its connection limit.
- **Doing slow work in the API function**, like parsing 500 resumes. It times out. Push it to a queue.
- **Storing state in memory** (sessions, caches) and expecting it to be there next time. A different container may handle the next request.
- **Forgetting the SPA fallback in CloudFront.** Refreshing `/jobs/10` shows an S3 "Access Denied" error instead of the app.

## 🗣️ How to answer in an interview

> "Serverless MERN on AWS has three parts. The React build is in S3 and served through CloudFront. The API is Lambda functions behind API Gateway, written in Node.js and TypeScript. The data is in MongoDB, usually Atlas.
>
> That's how SkillKeepr is built. We have three React SPAs on S3 and CloudFront, and the backend is many Lambda functions deployed with the Serverless Framework, using Mongoose and Joi validation, with shared core libraries across services. Slow work goes to SQS, Step Functions, EventBridge crons and AWS Batch. Each tenant has its own MongoDB database. The tenant comes from the subdomain and is locked inside an HttpOnly JWT cookie.
>
> The things I watch for are cold starts, the API Gateway timeout, and MongoDB connections. I create the connection outside the handler and reuse it across warm calls. Anything long-running goes to a queue or a workflow."

[FILL IN: one backend feature you built on this setup and which AWS pieces it used, e.g. the Stripe auto-renewal cron and webhook, the AI JD chatbot backend, or the ATS sync.]

## 🔁 Follow-up questions

### How do you reduce cold starts?

Keep the bundle small (bundle and tree-shake with esbuild). Load heavy libraries only where needed. Keep the database connection outside the handler. For critical paths, use provisioned concurrency.

### Why not just run Express on an EC2 server?

You can. EC2 or containers are simpler for steady, heavy traffic and long connections. Serverless wins when traffic is uneven, the team is small and you want automatic scaling with no servers to manage.

### Can you run an existing Express app on Lambda?

Yes. An adapter turns API Gateway events into Express requests, and the whole app runs in one function. It's a quick way to migrate, but cold starts are bigger and you scale the whole app as one.

### How do you test Lambdas locally?

Call the handler directly with a fake event in unit tests (with Jest). Use emulators like `serverless offline` or SAM local for HTTP-level testing. Then test in a dev stage on AWS.

## ✅ Quick check

### 1. Where should `mongoose.connect` be called in a Lambda?

- A) Inside the handler, on every request
- B) Outside the handler, cached and reused
- C) In the React app

:::answer
**B.** Code outside the handler runs once per container, so warm requests reuse the same connection.
:::

### 2. A recruiter uploads 500 resumes to parse. Where should the parsing run?

:::answer
**Not in the API Lambda.** The API should save the files, put a job on a queue (like SQS) and reply quickly. Workers, Step Functions or AWS Batch do the parsing in the background.
:::

### 3. A user refreshes `https://app.example.com/jobs/10` and sees "Access Denied". What's missing?

:::answer
The **SPA fallback**. CloudFront must return `index.html` for unknown paths, so React Router can show the page.
:::
