---
title: "Serverless limits: cold starts and time limits"
stack: architecture
order: 10
level: Intermediate
mustKnow: false
askedFrequency: common
summary:
  - A cold start is the extra wait when AWS must start a new Lambda container. It loads your code and runs your setup before the first request.
  - Code outside the handler runs once per container. Put slow setup there (like database connections), so warm requests reuse it.
  - "Hard limits: a Lambda runs at most 15 minutes, and an API Gateway REST call waits about 29 seconds by default."
  - Long jobs go to a queue, Step Functions, AWS Batch or containers — not to a request that the user waits for.
  - "Fixes for cold starts: smaller bundles, less setup, more memory, provisioned concurrency, and keeping heavy libraries out of the hot path."
cards:
  - q: What is a cold start?
    a: The extra delay when AWS creates a new container for a Lambda function. It downloads the code, starts the runtime and runs the setup code before handling the first request.
  - q: Where should you open a database connection in a Lambda function?
    a: Outside the handler, at module level, and reuse it. Warm invocations then skip the slow connection step.
  - q: What is the maximum time a Lambda function can run?
    a: 15 minutes. If a request waits on it through API Gateway REST, the default limit is about 29 seconds.
  - q: Name three ways to reduce cold starts.
    a: Make the bundle smaller, do less work at startup, give the function more memory (more CPU), or use provisioned concurrency to keep containers ready.
  - q: Where do you put a job that takes 10 minutes?
    a: Not in the request. Put it on a queue (SQS) or a workflow (Step Functions), or run it as a container job (AWS Batch, ECS). Tell the user it has started, and report the result later.
---

## 💡 What is it?

[Serverless](topic:architecture/serverless-lambda) means you give AWS a function, and AWS runs it when needed. You don't manage servers. But it has two well-known limits.

1. **Cold starts.** Sometimes AWS must start a fresh container first. The first request waits a little longer.
2. **Time limits.** A function can't run forever. A Lambda stops after **15 minutes**. A request through API Gateway REST gives up after about **29 seconds** by default.

Knowing these limits helps you decide what fits in a Lambda and what doesn't.

## 🏠 Real-life example

Think of a **tea stall that opens only when a customer comes**.

- The **first customer of the morning** waits longer. The owner must light the stove and boil the milk. That's a **cold start**.
- The **next customers** get tea fast. The stove is already hot. That's a **warm start**.
- If nobody comes for a long time, the owner **switches the stove off** again. The next customer is "cold" again.
- The stall closes **every evening at a fixed time**. You can't cook a 3-day wedding feast there. That's the **time limit**.
- A big order goes to a **catering kitchen** instead. That's a queue or a batch job.

Map it:
- **Tea stall** = a Lambda container.
- **Lighting the stove** = loading code and opening connections.
- **Hot stove** = a warm container that reuses setup.
- **Closing time** = the 15-minute (or 29-second) limit.
- **Catering kitchen** = SQS, Step Functions, AWS Batch or containers.

## 🧑‍💻 Code example

This simulates one Lambda container serving three requests. Save it as `cold.js` and run `node cold.js` (CommonJS).

```js
let connection = null;                                    // lives OUTSIDE the handler, so it survives between calls
const containerStartedAt = Date.now();                    // when this "container" started (the cold start)

async function getConnection() {                          // opens the database connection only once
  if (connection) return connection;                      // already open → reuse it (warm start)
  await new Promise((r) => setTimeout(r, 300));           // pretend connecting takes 300 ms
  connection = { openedAfterMs: Date.now() - containerStartedAt }; // remember the open connection
  return connection;                                      // give it back
}                                                         // end of getConnection

async function handler(event) {                           // the Lambda handler: runs on every request
  const t0 = Date.now();                                  // start a stopwatch for this request
  await getConnection();                                  // first call is slow, later calls are fast
  return { reply: `Hello ${event.name}`, tookMs: Date.now() - t0 }; // the response and how long it took
}                                                         // end of handler

async function main() {                                   // pretend three requests hit the same container
  console.log('request 1 (cold):', await handler({ name: 'Asha' })); // first request pays the setup cost
  console.log('request 2 (warm):', await handler({ name: 'Ravi' })); // reuses the connection
  console.log('request 3 (warm):', await handler({ name: 'Meera' })); // reuses it again
}                                                         // end of main
main();                                                   // run it
```

**Output** (the first number may vary by a few ms):

```text
request 1 (cold): { reply: 'Hello Asha', tookMs: 302 }
request 2 (warm): { reply: 'Hello Ravi', tookMs: 0 }
request 3 (warm): { reply: 'Hello Meera', tookMs: 0 }
```

Only the first request paid for the setup. In real Lambda, the module-level code (imports, config, connections) is the part that runs once per container.

## 🔍 Deeper version

**What happens in a cold start:**

```text
Request arrives, no free container
  → AWS creates a container (micro-VM)
  → downloads your code bundle
  → starts the Node.js runtime
  → runs your module-level code (imports, config, DB connect)   ← "INIT" phase
  → runs the handler                                             ← the request
Next request on the same container → handler only (warm)
```

A container handles **one request at a time**. Ten requests at the same moment need ten containers, so a traffic spike can cause many cold starts at once.

**What makes cold starts slower:**
- A **big bundle**: many dependencies, the whole app imported by every function.
- **Heavy setup**: reading config from the network, opening many connections, loading big SDKs.
- **Low memory**: Lambda gives CPU in proportion to memory, so 128 MB starts slower than 1024 MB.

**Fixes:**

| Fix | What it does | Cost |
|---|---|---|
| Smaller bundle (tree-shaking, import only what you use) | less to download and load | build work |
| Lazy-load rare dependencies | setup only when needed | slightly slower first use of that path |
| Reuse connections at module level | warm calls skip connecting | must handle a dropped connection |
| More memory | more CPU for startup | higher price per ms |
| **Provisioned concurrency** | keeps N containers always warm | you pay even when idle |

:::version[Version note]
Since **August 2025**, AWS also bills the INIT phase (cold-start setup) for on-demand functions. Slow startup now costs money as well as time. SnapStart (saving a warmed-up snapshot) exists for Java, Python and .NET, but not for Node.js.
:::

**Time and size limits to remember:**

| Limit | Value |
|---|---|
| Lambda maximum run time | **15 minutes** |
| API Gateway REST integration timeout | **about 29 seconds** by default (AWS lets you ask for more on regional APIs) |
| API Gateway HTTP API timeout | 30 seconds |
| Synchronous request/response payload | about 6 MB |
| Memory | 128 MB to 10 GB |
| Temporary disk (`/tmp`) | 512 MB by default, up to 10 GB |

**Long work patterns:**
- **Queue + worker:** the API puts a message on SQS and returns "accepted". A worker Lambda processes it.
- **Step Functions:** a workflow of many short steps, with retries and waits between them.
- **AWS Batch / ECS containers:** for jobs longer than 15 minutes or that need large native tools.
- **Lambda Function URLs:** called directly, without API Gateway, so a request can run up to Lambda's own 15-minute limit.

**Connections and databases.** Every container keeps its own connection pool. A spike of 200 containers can mean 200 pools hitting MongoDB at once. Keep pools small (`maxPoolSize`), and watch the database's connection count.

## 🎯 Why do we use it?

Serverless is cheap and scales by itself. You pay only when code runs, and you don't patch servers. But users notice delays, and some work simply takes longer than the limits allow.

Knowing the limits lets you:
- keep the request path fast (small handlers, reused connections),
- move slow work to the right place (queues, workflows, containers),
- explain the trade-off clearly in an interview, instead of saying "serverless is always better".

## ⚠️ Common mistakes

- **Opening a new database connection inside the handler on every call.** It's slow and can flood the database. Open it once at module level.
- **Putting a long job in an API request.** It hits the 29-second limit, and the user sees a timeout. Use a queue and report the result later.
- **Importing the whole app in every function.** Each function then loads code it never uses, and cold starts grow.
- **Testing only warm performance.** The first request after a quiet period is the one users complain about.

## 🗣️ How to answer in an interview

> "Serverless has two main limits. The first is cold starts. When there's no warm container, AWS has to create one, load the code and run the module-level setup before the handler runs, so that first request is slower. I reduce it by keeping bundles small, putting connections and config at module level so warm calls reuse them, giving the function enough memory, and using provisioned concurrency for latency-critical paths.
>
> The second is time limits. A Lambda can run at most 15 minutes, and through API Gateway REST a request waits about 29 seconds by default. So anything long, like parsing many files or scoring candidates, goes to a queue, a Step Functions workflow or a container job, and the user gets the result later."

The SkillKeepr backend runs on many Lambda functions, with SQS, Step Functions and AWS Batch for background work. [FILL IN: a real cold-start or timeout issue you handled there, if any — only if true.]

## 🔁 Follow-up questions

### How do you measure cold starts?

CloudWatch logs show an `Init Duration` line on cold-start invocations. You can also add timing logs around module-level setup, or use X-Ray traces. Compare p50 and p99 latency: cold starts show up in the high percentiles.

### Is provisioned concurrency always the answer?

No. It costs money even when nobody uses the function. Use it only for paths where latency really matters, like login or a checkout API. For background workers, cold starts usually don't matter.

### What happens to a module-level connection if the database restarts?

The cached connection may be dead. Your code should check that it is still connected (for Mongoose, `readyState === 1`) and reconnect if not. Also set short server-selection timeouts so a dead connection fails fast.

### Why not just put everything in containers then?

Containers have no cold start per request and no 15-minute limit. But you pay for them all the time, and you manage scaling. Many teams mix both: Lambda for spiky APIs and events, containers for long or always-on work.

## ✅ Quick check

### 1. Where is the best place to create a database connection in a Lambda function?

- A) Inside the handler, on every request
- B) Outside the handler, at module level, and reuse it
- C) In a separate Lambda that runs before each request

:::answer
**B.** Module-level code runs once per container. Warm requests reuse the connection, so they skip the slow connect step.
:::

### 2. A report takes 4 minutes to build. The frontend calls it through API Gateway REST. What happens, and what's the fix?

:::answer
The request **times out at about 29 seconds**, even though Lambda itself could run longer. The fix: return "accepted" right away, build the report in the background (SQS + worker, or Step Functions), and notify the user or let them poll for the result.
:::

### 3. True or false: one warm Lambda container can serve many requests at the same time.

:::answer
**False.** A container handles one request at a time. Parallel requests need more containers, and each new one has a cold start.
:::
