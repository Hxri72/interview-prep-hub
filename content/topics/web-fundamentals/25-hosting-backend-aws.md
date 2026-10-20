---
title: "Hosting a Node backend on AWS: EC2 vs Lambda + API Gateway vs containers"
stack: web-fundamentals
order: 25
level: Intermediate
mustKnow: true
askedFrequency: very common
summary:
  - "Three main ways to run a Node API on AWS: EC2 (your own server), Lambda + API Gateway (serverless functions), and containers (ECS Fargate or App Runner)."
  - "On EC2 you run app.listen() forever, usually with PM2 and nginx in front. You manage the server, updates and scaling."
  - On Lambda there is no app.listen(). AWS calls your handler(event) for each request and scales it for you. Watch cold starts and time limits.
  - Containers package your app with Docker. Fargate or App Runner run it without you managing servers.
  - Keep business logic separate from the hosting code, so the same logic can run in any of them.
cards:
  - q: Name three ways to host a Node API on AWS.
    a: EC2 virtual servers, Lambda functions behind API Gateway, and containers on ECS Fargate or App Runner.
  - q: What is the biggest code difference between EC2 and Lambda?
    a: On EC2 your app calls app.listen() and runs all the time. On Lambda you export a handler(event) that AWS calls once per request.
  - q: What is a cold start?
    a: The extra delay when Lambda has to start a new copy of your function — load the runtime and your code — before handling the request.
  - q: What is API Gateway's time limit, and what do you do for long jobs?
    a: REST API integrations time out at about 29 seconds by default. Long jobs go to a queue and a background worker, or a Lambda Function URL, or a container.
  - q: When would you pick containers over Lambda?
    a: For long-running work, steady high traffic, WebSockets held by your own server, or apps that need full control of the runtime.
---

## 💡 What is it?

Your Node.js API must run somewhere online. AWS gives three common choices:

- **EC2**: a virtual computer you rent. Your app runs on it all the time.
- **Lambda + API Gateway**: AWS runs your function only when a request comes in. This is "serverless".
- **Containers**: your app packed with Docker, run by AWS (ECS Fargate or App Runner).

Each choice changes how you write the start-up code, how it scales and what you must manage.

## 🏠 Real-life example

Think of **three ways to sell tea**.

- **Your own tea shop** = EC2. You rent the shop, keep it open all day and fix the leaking tap yourself. You pay rent even when no customers come.
- **Tea makers on call** = Lambda. When a customer arrives, a tea maker appears, makes one cup and leaves. You pay per cup. If one hasn't been called for a while, the first cup takes longer while they set up (a cold start).
- **A standard food truck** = containers. Everything is packed in a fixed box that works anywhere. A company parks and runs the truck for you (Fargate).
- **The street address customers use** = API Gateway or a load balancer. It sends each customer to the right place.

## 🧑‍💻 Code example

The same "get a job" logic, run two ways. First the shared logic, `logic.mjs`:

```js
export async function getJob(id) { // the real business logic, shared by both versions
  const jobs = { 42: { id: 42, title: 'Node.js Developer' } }; // pretend database
  return jobs[id] ?? null; // the job, or null if not found
} // end of getJob
```

**Way 1 — a long-running server** (EC2 or a container). `server.mjs`, run with `npm install express` and `node server.mjs`:

```js
import express from 'express'; // the web framework
import { getJob } from './logic.mjs'; // the shared logic
const app = express(); // create the app
app.get('/jobs/:id', async (req, res) => { // GET /jobs/42
  const job = await getJob(req.params.id); // run the shared logic
  if (!job) return res.status(404).json({ error: 'Not found' }); // 404 = no such job
  res.json(job); // 200 with the job as JSON
}); // end of route
const server = app.listen(4704, async () => { // EC2/container style: a long-running server on a port
  const r = await fetch('http://localhost:4704/jobs/42'); // call it like a browser would
  console.log('server  →', r.status, JSON.stringify(await r.json())); // show the result
  server.close(); // stop the demo
}); // end of listen
```

**Way 2 — a Lambda handler** called with a fake API Gateway event. `lambda.mjs`, run with `node lambda.mjs`:

```js
import { getJob } from './logic.mjs'; // the same shared logic
export async function handler(event) { // Lambda style: no listen(); AWS calls this function per request
  const job = await getJob(event.pathParameters.id); // API Gateway puts URL parts in pathParameters
  if (!job) return { statusCode: 404, body: JSON.stringify({ error: 'Not found' }) }; // 404 = no such job
  return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(job) }; // the response API Gateway sends back
} // end of handler
const fakeEvent = { httpMethod: 'GET', path: '/jobs/42', pathParameters: { id: '42' } }; // what API Gateway would pass in (shortened)
const result = await handler(fakeEvent); // call it locally, like AWS would
console.log('lambda  →', result.statusCode, result.body); // show the result
```

Real output (Node 24, Express 5.3):

```text
server  → 200 {"id":42,"title":"Node.js Developer"}
lambda  → 200 {"id":42,"title":"Node.js Developer"}
```

Same answer, two different "shells" around the same logic.

## 🔍 Deeper version

**Comparison:**

| | EC2 | Lambda + API Gateway | Containers (ECS Fargate / App Runner) |
|---|---|---|---|
| You manage | OS, Node, updates, scaling | only your code | the Docker image |
| Start-up code | `app.listen(port)` | `export const handler = async (event) => …` | `app.listen(port)` in a container |
| Scaling | you add servers (Auto Scaling group + load balancer) | automatic, per request | automatic by tasks or instances |
| Cost when idle | you pay for the server | close to zero | you pay for running tasks |
| Long jobs | fine | max 15 minutes; API Gateway REST waits about 29 s | fine |
| Cold starts | no | yes | no (once running) |
| Good for | full control, special software | spiky traffic, many small endpoints | steady APIs, long or heavy work |

**EC2 in practice.** Install Node, run the app with **PM2** (keeps it alive, restarts on crash, can use all CPU cores — see [cluster and PM2](topic:nodejs/cluster-and-pm2)). Put **nginx** in front as a reverse proxy: it handles HTTPS and forwards to `localhost:3000`. Security groups (AWS's firewall) open only ports 80 and 443. For more traffic, add an Auto Scaling group behind an Application Load Balancer. See [Load balancers and stateless services](topic:system-design/load-balancers-stateless).

**Lambda in practice.**
- **The event:** API Gateway turns the HTTP request into an `event` object (path, query, headers, body). You return `{ statusCode, headers, body }`.
- **Cold starts:** the first request on a new copy loads your code first. Keep bundles small, and keep connections (like the database client) outside the handler so warm calls reuse them.
- **Time limits:** Lambda runs up to 15 minutes. API Gateway REST waits only about 29 seconds by default. Long jobs move to a queue or to a **Lambda Function URL**.
- **Tools:** the **Serverless Framework**, AWS SAM or CDK describe functions, routes and permissions as code.
- More detail: [Serverless and AWS Lambda](topic:architecture/serverless-lambda) and [Serverless limits](topic:architecture/serverless-limits).

**Containers in practice.** Write a Dockerfile (see [Docker basics](topic:devops/docker-basics)) and push the image to ECR. Run it on **ECS Fargate** behind a load balancer, or on **App Runner**, which is simpler and gives you a URL with HTTPS. **Elastic Beanstalk** is an older, easier wrapper around EC2.

**Things every option needs:**
- **Database:** usually a managed service (MongoDB Atlas, Amazon RDS for PostgreSQL). If the database is in a private network (VPC), your Lambda or container must run in that VPC too.
- **Config and secrets:** environment variables for settings, and AWS Secrets Manager or SSM Parameter Store for secrets. See [Environments](topic:devops/environments).
- **Logs:** CloudWatch Logs collect `console.log` output from Lambda and ECS automatically. EC2 needs the CloudWatch agent.

**At SkillKeepr (public-safe level):** the backend is many Lambda functions behind API Gateway, deployed with the Serverless Framework. Long jobs use Lambda Function URLs. The AI voice service is a separate Python FastAPI service, also hosted on AWS. [FILL IN: the AWS service that runs the voice service, and your own part in deploying it.]

## 🎯 Why do we use it?

- **Picking the right option** saves money and effort. Spiky traffic fits Lambda; steady, heavy work fits containers.
- **Interviewers love "where does your code actually run?"** This shows you understand the system end to end, not only the code.
- **Separating logic from hosting** keeps your code testable and lets you move between options later.

## ⚠️ Common mistakes

- **Putting `app.listen()` in a Lambda.** Lambda needs an exported handler, or an adapter that wraps Express.
- **Opening a new database connection inside every Lambda call.** Create it once, outside the handler.
- **Sending a 2-minute job through API Gateway.** It times out at about 29 seconds. Use a queue or a background worker.
- **Running Node on EC2 without a process manager.** One crash and the API stays down.

## 🗣️ How to answer in an interview

> "There are three main ways to host a Node API on AWS. On EC2, I run a long-lived server with app.listen, managed by PM2, with nginx in front for HTTPS. I manage the machine, and I scale by adding instances behind a load balancer. With Lambda and API Gateway, there's no listen at all. I export a handler, AWS calls it per request and scales it automatically, and I pay per use. The trade-offs are cold starts, a 15-minute limit, and API Gateway's roughly 29-second timeout, so long jobs go to queues. Containers on ECS Fargate or App Runner sit in between: I ship a Docker image and AWS runs it without me managing servers.
>
> At SkillKeepr, the backend is many Lambda functions behind API Gateway on the Serverless Framework, and longer jobs run through Function URLs. I keep business logic separate from the handler, so it's easy to test and could move to a container if needed."

## 🔁 Follow-up questions

### Can you run an Express app on Lambda?

Yes, with an adapter (for example `serverless-http` or AWS's Lambda Web Adapter) that turns the API Gateway event into a request Express understands. Many teams instead write small handlers per route.

### How do you reduce Lambda cold starts?

Keep the bundle small, avoid heavy work at import time, reuse connections across calls, and choose more memory (which also gives more CPU). For critical paths, provisioned concurrency keeps copies warm, but it costs money.

### How does a Lambda reach a database in a private network?

Run the Lambda inside the same VPC, in private subnets, with security group rules that allow the database port. To reach the internet from there, it also needs a NAT gateway or VPC endpoints.

### Where do your logs go?

Lambda and ECS send `console.log` output to CloudWatch Logs automatically. You search them there or send them to another tool. See [Logging, monitoring and alerts](topic:devops/monitoring-alerts).

## ✅ Quick check

### 1. Which line would be wrong inside a plain Lambda handler file?

- A) `export async function handler(event) { … }`
- B) `app.listen(3000)`
- C) `return { statusCode: 200, body: '…' }`

:::answer
**B.** Lambda doesn't keep a server listening on a port. AWS calls your handler for each request.
:::

### 2. A report takes 2 minutes to build. Can it run as a normal API Gateway + Lambda request?

:::answer
**No.** API Gateway REST integrations time out at about 29 seconds by default. Start the job, put it on a queue for a background worker (or use a Function URL or container), and let the client check back for the result.
:::

### 3. Why create the database client outside the handler?

:::answer
So **warm** invocations reuse the same connection. Creating it inside the handler opens a new connection on every request, which is slow and can exhaust the database's connection limit.
:::
