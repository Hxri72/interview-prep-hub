---
title: Serverless and AWS Lambda
stack: architecture
order: 9
level: Intermediate
mustKnow: true
askedFrequency: very common
summary:
  - Serverless means you write small functions, and the cloud runs, scales and patches the servers for you. You pay per request and run time, not for idle servers.
  - AWS Lambda runs your function when an event arrives — an HTTP request (API Gateway), a queue message (SQS), a file upload (S3) or a schedule (EventBridge).
  - It scales automatically from zero to many copies, and each copy handles one request at a time.
  - "Limits to know: max 15 minutes per run, cold starts, API Gateway REST's 29-second timeout, and no local state you can rely on between calls."
  - Great for bursty, event-driven work; not great for long-running jobs, steady heavy load or always-open connections.
cards:
  - q: What does "serverless" mean?
    a: You deploy functions or code, and the cloud provider runs, scales and maintains the servers. You pay for requests and run time, not idle machines.
  - q: What can trigger an AWS Lambda function?
    a: HTTP requests via API Gateway or Function URLs, SQS messages, S3 uploads, EventBridge schedules and events, DynamoDB streams, Step Functions and more.
  - q: What is a cold start?
    a: The extra delay when Lambda must create a new container and load your code before running it. Warm containers reuse loaded code and connections.
  - q: What is the maximum run time of a Lambda function?
    a: 15 minutes.
  - q: Why create database connections outside the handler?
    a: Code outside the handler runs once per container, so warm invocations reuse the connection instead of opening a new one each time.
---

## 💡 What is it?

**Serverless** means you write **small functions**. The cloud runs them for you.

You don't buy, set up or patch servers. The cloud starts your function when it's needed and **scales it automatically**. You pay only for the requests and the time your code runs.

**AWS Lambda** is Amazon's serverless service. Your function runs when an **event** happens: an HTTP request, a new file, a queue message or a timer.

## 🏠 Real-life example

Think of **booking an auto-rickshaw** instead of **owning a car**.

With a car, you pay for it even when it's parked. You fix it, insure it and wash it. With an auto, you pay only for the trip. When many people need rides, more autos show up.

- **Owning a car** = running your own server all day.
- **Booking an auto per trip** = Lambda running per request.
- **Paying per trip** = paying per request and run time.
- **More autos at rush hour** = automatic scaling.
- **Waiting for an auto to arrive** = a cold start.
- **The auto that's already nearby** = a warm container.
- **Autos don't go on 3-day trips** = Lambda's 15-minute limit.

## 🧑‍💻 Code example

A Lambda handler, run **locally** with fake events — no AWS account needed. Save as `handler.js` and run `node handler.js`.

```js
let invocations = 0;                                        // lives OUTSIDE the handler: kept while the container is "warm"
const startedAt = new Date().toISOString();                 // runs once per container start ("cold start")

exports.handler = async (event) => {                        // Lambda calls this function for every request
  invocations += 1;                                         // count requests handled by THIS container
  const id = event.pathParameters?.id;                      // API Gateway puts "/jobs/{id}" values here
  if (!id) {                                                // no id in the path
    return { statusCode: 400, body: JSON.stringify({ error: 'id is required' }) }; // 400 = bad request
  }                                                         // end of check
  return {                                                  // the response object API Gateway expects
    statusCode: 200,                                        // 200 = OK
    headers: { 'Content-Type': 'application/json' },        // tell the browser it's JSON
    body: JSON.stringify({ jobId: id, invocations, startedAt }), // body must be a STRING
  };                                                        // end of response
};                                                          // end of handler

// ---- Run it locally with fake events (no AWS needed) ----
if (require.main === module) {                              // only when you run "node handler.js"
  (async () => {                                            // an async wrapper so we can use await
    console.log(await exports.handler({ pathParameters: { id: '1' } })); // first call
    console.log(await exports.handler({ pathParameters: { id: '2' } })); // second call: same container
    console.log(await exports.handler({}));                 // missing id
  })();                                                     // run the wrapper
}                                                           // end of local test
```

**Output** (your time will differ):

```text
{
  statusCode: 200,
  headers: { 'Content-Type': 'application/json' },
  body: '{"jobId":"1","invocations":1,"startedAt":"2026-10-09T15:01:00.108Z"}'
}
{
  statusCode: 200,
  headers: { 'Content-Type': 'application/json' },
  body: '{"jobId":"2","invocations":2,"startedAt":"2026-10-09T15:01:00.108Z"}'
}
{ statusCode: 400, body: '{"error":"id is required"}' }
```

**What to notice:** `invocations` went from 1 to 2 and `startedAt` stayed the same. On real Lambda, a **warm** container keeps module-level values like this. But a new container starts from zero, so never rely on it for real data.

## 🔍 Deeper version

**How Lambda runs your code:**
1. An event arrives (HTTP, SQS, S3, schedule…).
2. If no free container exists, Lambda creates one and runs your **init code** (everything outside the handler). This is the **cold start**.
3. It calls your **handler** with the event.
4. The container stays **warm** for a while and can be reused for the next event.
5. Each container handles **one request at a time**. More traffic = more containers (concurrency).

**Limits and facts to know (2026):**

| Item | Value / note |
|---|---|
| Max run time | 15 minutes |
| Memory | 128 MB – 10,240 MB (CPU grows with memory) |
| API Gateway REST integration timeout | 29 seconds by default |
| Function URLs | HTTPS endpoint straight to a function, without API Gateway |
| Node.js runtime | Node 22 and Node 24 are current managed runtimes |
| State | No guaranteed state between calls — use a database, S3 or cache |
| `/tmp` disk | Small temporary space, cleared when the container goes away |

More detail: [serverless limits](topic:architecture/serverless-limits).

**Reducing cold starts:** keep the bundle small (only import what you need), set up clients and DB connections **outside** the handler, give more memory (more CPU), and use provisioned concurrency for critical paths. Functions inside a VPC can be slower to start.

**Database connections.** Thousands of Lambda copies can open thousands of connections. Reuse a connection created outside the handler, keep the pool small, and set a sensible max concurrency. See [connection pooling](topic:mongodb/scaling-overview).

**Common event sources:**
- **API Gateway / Function URL** → HTTP APIs.
- **SQS** → queue workers. Use partial batch responses so one bad message doesn't retry the whole batch.
- **S3** → react to uploads.
- **EventBridge** → cron schedules and events.
- **Step Functions** → multi-step workflows with retries.

**Pros and cons:**

| ✅ Pros | ❌ Cons |
|---|---|
| No servers to manage | Cold starts |
| Scales automatically, even to zero | 15-minute limit; 29 s behind API Gateway REST |
| Pay per use — cheap for bursty traffic | Can cost more than servers at steady high load |
| Built-in triggers (queues, files, schedules) | Harder local testing and debugging |
| Each function scales on its own | Vendor lock-in; many small pieces to manage |

**A real example.** At SkillKeepr, the main backend is serverless. It's built with the **Serverless Framework**: one Node.js/TypeScript codebase deployed as **many Lambda functions behind API Gateway**. Background work runs through SQS queues, Step Functions, scheduled EventBridge jobs and AWS Batch for imports longer than Lambda allows. See [architectures and Lambda](topic:resume/architectures-and-lambda). [FILL IN: which Lambda functions or features you built.]

## 🎯 Why do we use it?

- **No server work** — no patching, no capacity planning.
- **Bursty traffic** — scales up for spikes and down to zero at night.
- **Cost** — pay only for what runs.
- **Event-driven glue** — react to uploads, queue messages and schedules with very little code.

## ⚠️ Common mistakes

- **Long jobs in Lambda** that hit the 15-minute limit. Use queues to split work, Step Functions, or containers (Batch, ECS).
- **Opening a new DB connection on every call**, which floods the database.
- **Storing state in memory or `/tmp`** and expecting it next time.
- **Huge bundles** that make cold starts slow.
- **Synchronous chains** of functions calling functions, which add latency and cost.

## 🗣️ How to answer in an interview

> "Serverless means I deploy functions and the cloud runs and scales the servers; I pay per request and run time. With AWS Lambda, a function runs in response to an event — an HTTP request through API Gateway, an SQS message, an S3 upload or an EventBridge schedule. It scales by running more containers, each handling one request at a time.
>
> The trade-offs I keep in mind are cold starts, the 15-minute maximum run time, the 29-second default timeout behind API Gateway REST, and that there's no reliable state between calls. So I create database clients outside the handler to reuse them on warm starts, keep bundles small, and move long work to queues, Step Functions or containers.
>
> The platform I work on is a good example: the backend is one Node and TypeScript codebase on the Serverless Framework, deployed as many Lambda functions behind API Gateway, with SQS, Step Functions and scheduled jobs for background work."

## 🔁 Follow-up questions

### When would you NOT use Lambda?

For jobs longer than 15 minutes, steady high traffic where a server is cheaper, always-open connections (some real-time cases), or work that needs heavy native tools and large disk. Containers (ECS, Batch) or EC2 fit those better.

### How do you test a Lambda function locally?

Call the handler with a fake event, like the code example. Unit-test the business logic separately. Tools like `serverless-offline`, AWS SAM or LocalStack can run a local API Gateway.

### What is provisioned concurrency?

Lambda keeps a set number of containers already warm, so those requests skip the cold start. You pay for it even when idle.

### How do you handle a failing SQS message in Lambda?

Return a **partial batch response** listing only the failed message IDs, so the others aren't retried. After a few failures, the message moves to the dead-letter queue. Make the handler idempotent.

## ✅ Quick check

### 1. In the code example, why did `invocations` reach 2?

:::answer
`invocations` is defined outside the handler, so it lives as long as the container. Both calls ran in the same "warm" process. A new container would start again from 0.
:::

### 2. A data import takes 40 minutes. Is one Lambda run a good fit?

:::answer
**No.** Lambda stops at 15 minutes. Split the work into smaller jobs on a queue, use Step Functions, or run it in a container service like AWS Batch.
:::

### 3. Where should you create a MongoDB connection in a Lambda function, and why?

:::answer
**Outside the handler**, at module level. Warm invocations then reuse the same connection instead of opening a new one per request.
:::
