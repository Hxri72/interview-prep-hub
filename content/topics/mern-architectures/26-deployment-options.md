---
title: VPS vs PaaS vs containers vs serverless
stack: mern-architectures
order: 26
level: Intermediate
mustKnow: true
askedFrequency: very common
template: pattern
section: Deployment
summary:
  - "There are four common ways to host a MERN backend: a VPS (your own rented server), a PaaS (Railway, Render, Heroku), containers (Docker on ECS or Kubernetes), and serverless (AWS Lambda)."
  - "They differ in how much you manage: a VPS needs the most work, serverless the least."
  - "The React frontend is usually built to static files and served from a CDN (S3 + CloudFront, Vercel, Netlify) in every option."
  - "MongoDB is usually a managed service like MongoDB Atlas, so you don't run the database yourself."
  - "Write the app the same way for all of them: read PORT and secrets from environment variables, keep no state in memory, add a health check."
cards:
  - q: Name four ways to deploy a Node/Express backend.
    a: A VPS (EC2, DigitalOcean), a PaaS (Railway, Render), containers (Docker on ECS/Kubernetes), and serverless functions (AWS Lambda).
  - q: What is a PaaS?
    a: Platform as a Service. You push code and the platform builds, runs, scales and gives it HTTPS. Railway and Render are examples.
  - q: What is the main trade-off of serverless?
    a: No servers to manage and pay-per-use, but you get cold starts, time limits and no long-lived connections like WebSockets on plain Lambda.
  - q: Where does the React build usually go?
    a: Static hosting on a CDN, like S3 + CloudFront, Vercel or Netlify.
  - q: What should an app do so it can move between hosting types easily?
    a: Read config from environment variables, listen on process.env.PORT, keep no state in memory, log to stdout, and expose a health check.
---

## 💡 What is it?

When your MERN app works on your laptop, it must go on the internet. That is **deployment**.

There are four common ways to run the Node backend: a **VPS**, a **PaaS**, **[containers](glossary:container)**, or **[serverless](glossary:serverless)**. They differ in how much you manage yourself.

The React part and MongoDB usually go to their own places in all four. React goes to a [CDN](glossary:cdn), and MongoDB to a managed service like MongoDB Atlas.

## 🏠 Real-life example

Think of **four ways to run a food business**.

- **VPS = renting an empty shop.** You get walls and electricity. You buy the stove, fix the gas, clean, and lock up yourself.
- **PaaS = a food court stall.** The mall gives you a ready counter, power, cleaning and security. You just cook. You follow their rules and pay their rent.
- **Containers = a food truck.** Your whole kitchen is packed in one box. You can drive it to any parking spot, and it works the same everywhere. You still need a parking manager when you have many trucks.
- **Serverless = a cloud kitchen that charges per order.** You give them your recipe. They cook only when an order comes. No orders, no bill. But each dish must be ready within a time limit.

| Food business | Hosting |
|---|---|
| Empty shop | VPS like EC2 or DigitalOcean |
| Food court stall | PaaS like Railway or Render |
| Food truck | Docker container on ECS or Kubernetes |
| Parking manager | ECS / Kubernetes (an orchestrator) |
| Pay-per-order kitchen | AWS Lambda |

## 🗺️ The diagram

```text
                    ┌────────────────────────────────┐
  Browser ─────────▶│ CDN: React build (S3+CloudFront │  same in all four options
                    │      or Vercel / Netlify)       │
                    └────────────────────────────────┘
     │ API calls
     ▼
 ┌─────────────── pick ONE way to run the Express API ───────────────┐
 │ A) VPS:        Nginx ─▶ PM2 ─▶ node server.js   (you manage it all)│
 │ B) PaaS:       git push ─▶ Railway/Render builds and runs it       │
 │ C) Containers: Docker image ─▶ ECS / Kubernetes ─▶ many copies     │
 │ D) Serverless: API Gateway ─▶ Lambda functions (run per request)   │
 └────────────────────────────────────────────────────────────────────┘
     │
     ▼
  MongoDB Atlas (managed database)
```

## 🧑‍💻 Code example

The trick is to write **one** Express app that runs on all four. Save as `server.js`.

Set up and run:

```bash
npm init -y
npm install express mongoose
MONGO_URL="mongodb://localhost:27017/demo" PORT=4000 node server.js
```

```js
const express = require('express');                            // load Express
const mongoose = require('mongoose');                          // MongoDB library

const app = express();                                         // create the app
app.use(express.json());                                       // read JSON bodies

app.get('/health', (req, res) => {                             // health check for the host or load balancer
  const dbUp = mongoose.connection.readyState === 1;           // 1 = connected
  res.status(dbUp ? 200 : 503).json({ ok: dbUp });             // 200 = healthy, 503 = not ready
});                                                            // end of /health

app.get('/api/hello', (req, res) => res.json({ msg: 'hi' }));  // a normal route

const PORT = process.env.PORT || 3000;                         // the host decides the port; 3000 = local default
mongoose.connect(process.env.MONGO_URL)                        // the database address comes from an env variable
  .then(() => app.listen(PORT, () => console.log(`API on ${PORT}`))) // start only after the DB connects
  .catch((err) => { console.error(err); process.exit(1); });   // crash loudly, so the host restarts it

process.on('SIGTERM', async () => {                            // hosts send SIGTERM before stopping the app
  await mongoose.disconnect();                                 // close DB connections cleanly
  process.exit(0);                                             // 0 = normal exit
});                                                            // end of SIGTERM handler

module.exports = app;                                          // export, so a Lambda wrapper can reuse the app
```

How the **same file** is deployed each way:
- **VPS:** copy it to the server, run it with PM2, and put Nginx in front for HTTPS.
- **PaaS:** push to GitHub. Railway or Render runs `npm start` and sets `PORT` for you.
- **Containers:** add a Dockerfile (see [Docker Compose for a MERN app](topic:mern-architectures/docker-compose)) and run the image on ECS.
- **Serverless:** wrap `app` with a library like `serverless-http` and deploy it as a Lambda. Or, better, split routes into small functions (see [serverless MERN](topic:mern-architectures/serverless-mern)).

## 🔍 Deeper version

**Who manages what:**

| Task | VPS | PaaS | Containers (ECS/K8s) | Serverless (Lambda) |
|---|---|---|---|---|
| OS updates and security patches | You | Platform | Mostly the platform (Fargate) | AWS |
| HTTPS certificates | You (Certbot) | Platform | Load balancer | API Gateway |
| Restart on crash | You (PM2/systemd) | Platform | Orchestrator | AWS |
| Scaling | Manual | Slider or auto | Auto-scaling rules | Automatic per request |
| Long-lived connections (WebSockets) | Yes | Yes | Yes | Not on plain Lambda (use API Gateway WebSocket APIs) |
| Cost when idle | Full price | Small/fixed | Pay for running tasks | Almost zero |

**Words, in plain English:**
- **VPS** (Virtual Private Server): a rented virtual machine, like AWS EC2.
- **PaaS** (Platform as a Service): you give code, it gives a running URL.
- **Orchestrator**: software (ECS, Kubernetes) that starts, stops and spreads containers across machines.
- **Cold start**: the delay when a Lambda runs for the first time after being idle. See [serverless limits](topic:architecture/serverless-limits).

**The "twelve-factor" habits** make any option easy:
- Config in environment variables, never in code.
- No files or sessions saved on the server's disk or memory ([stateless](topic:system-design/load-balancers-stateless)).
- Logs go to stdout, and the platform collects them.
- Handle `SIGTERM` for [graceful shutdown](topic:nodejs/graceful-shutdown).

**Frontend hosting.** The React build is just static files. See [hosting the frontend on AWS](topic:web-fundamentals/hosting-frontend-aws). For the backend side, see [hosting the backend on AWS](topic:web-fundamentals/hosting-backend-aws).

## ⚖️ Pros and cons

| Option | Pros | Cons |
|---|---|---|
| VPS | Full control; cheap for steady traffic; any software | You do security, updates, backups and scaling |
| PaaS | Fastest to ship; HTTPS and deploys built in | Costs grow with scale; less control; platform limits |
| Containers | Same image everywhere; scales well; no vendor lock-in for the app | Docker, ECS or Kubernetes add a lot to learn |
| Serverless | No servers; scales to zero; pay per request | Cold starts, time limits, harder local testing, no plain WebSockets |

## 🎯 When to choose it

- **Personal project, demo or MVP:** a PaaS like Railway or Render. One push and it's live.
- **Steady traffic, small team, tight budget, and someone who knows Linux:** a VPS.
- **Many services, a team with DevOps skills, or a need to run the same thing on any cloud:** containers on ECS or Kubernetes.
- **Spiky traffic, event-driven work (webhooks, queues, crons), or "we don't want to manage servers":** serverless on Lambda.
- **Real-time chat with lots of WebSockets:** a VPS, PaaS or containers, not plain Lambda.

## ⚠️ Common mistakes

- **Hard-coding the port or database URL.** The platform can't change them. Use `process.env`.
- **Saving uploads on the server's disk.** Containers and Lambdas lose the disk on restart. Use S3.
- **No health check.** The load balancer can't tell a dead copy from a live one.
- **Choosing Kubernetes for a 3-page app.** Pick the simplest option that meets the need.

## 🗣️ How to answer in an interview

> "I think of it as how much I want to manage. A VPS gives full control, but I handle patching, HTTPS and scaling. A PaaS like Railway or Render just runs my code from a git push, which is great for MVPs. Containers give me one Docker image that runs the same everywhere, and ECS or Kubernetes scale it. Serverless on Lambda removes servers completely and scales per request, but I have to design around cold starts, time limits and no long-lived connections.
>
> In every option, the React build goes to a CDN and MongoDB is usually Atlas.
>
> At SkillKeepr the backend is serverless: many Lambda functions behind API Gateway, deployed with the Serverless Framework, and the React apps are on S3 and CloudFront. For my personal projects I've used Railway."

[FILL IN: your exact part in SkillKeepr deployments (e.g. writing functions, editing the Serverless config, CI/CD) — only what you really did.]

## 🔁 Follow-up questions

### Can I move an Express app to Lambda without rewriting it?

Yes, with a wrapper like `serverless-http`, which turns a Lambda event into a normal request. It works, but one big function has slower cold starts. Many teams later split it into smaller functions.

### What is the difference between ECS and Kubernetes?

Both run containers. ECS is AWS's own, simpler service. Kubernetes is open source, runs on any cloud, and is more powerful but harder to run.

### Where do secrets go in each option?

Environment variables set in the platform's settings, or a secrets manager like AWS Secrets Manager or SSM Parameter Store. Never commit them. See [secrets management](topic:devops/secrets-management).

### Why is MongoDB usually not deployed with the app?

Running a database well needs backups, replicas and upgrades. A managed service like Atlas does that for you, so it's safer and less work.

## ✅ Quick check

### 1. A startup needs a demo live by tomorrow with no DevOps person. Which option?

:::answer
A **PaaS** like Railway or Render (plus Atlas for MongoDB). It's the fastest way to go live.
:::

### 2. Your app saves uploaded photos in a local `uploads/` folder. After moving to containers, photos disappear. Why?

:::answer
Container disks are temporary. When the container restarts or a new copy starts, the files are gone. Store files in S3 instead.
:::

### 3. Which option is the worst fit for a chat app with 10,000 open WebSocket connections: VPS, containers, or plain Lambda?

:::answer
**Plain Lambda.** Each Lambda run is short-lived and can't hold a socket open. You'd need API Gateway WebSocket APIs or a server-based option.
:::
