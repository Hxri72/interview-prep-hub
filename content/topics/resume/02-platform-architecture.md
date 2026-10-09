---
template: story
title: Drawing the platform architecture
stack: resume
order: 2
level: Intermediate
mustKnow: true
askedFrequency: very common
summary:
  - "Frontend: three React single-page apps, served from S3 through CloudFront."
  - "Backend: serverless on AWS — API Gateway in front of many Lambda functions, written in Node.js and TypeScript with the Serverless Framework."
  - "Data: MongoDB with one database per customer company, accessed with Mongoose; requests are validated with Joi."
  - "Background work: SQS queues, Step Functions, EventBridge scheduled jobs and AWS Batch for long imports."
  - "Outside services: Stripe, unified.to for ATS data, OpenAI for job descriptions, video interviews. The AI voice agent is a separate service, also on AWS."
cards:
  - q: Draw the SkillKeepr architecture in one line.
    a: "React SPAs (S3 + CloudFront) → API Gateway → Lambda functions (Node/TS) → MongoDB, one database per tenant; plus queues, crons and Batch for background work."
  - q: Why serverless (Lambda) instead of one always-on server?
    a: Traffic is bursty, there are many independent endpoints, you pay only for use, and AWS gives built-in triggers for queues, crons, file uploads and WebSockets.
  - q: Name two downsides of Lambda you have to design around.
    a: Cold starts (slow first call after idle) and API Gateway's ~29-second limit, so long jobs must run in the background.
  - q: Where does long-running work go?
    a: Into queues (SQS) and background workers, Step Functions for multi-step jobs, and AWS Batch for very long imports.
  - q: Where does the AI voice agent fit?
    a: It is a separate service in its own repository, also hosted on AWS, that recruiters use to have an AI phone candidates.
---

## 💡 What is it?

This page helps you **draw SkillKeepr on a whiteboard**. Interviewers love "draw your architecture". They want to see that you understand the whole system, not only your own part.

SkillKeepr runs fully on **AWS**. The backend is **serverless**. That means you write small functions, and AWS runs them only when a request comes in. You don't manage servers.

## 🏠 Real-life example

Think of a **food court**.

- The **front counter and menu board** = the React apps the users see.
- The **order desk** = API Gateway. It takes every order and sends it to the right cook.
- The **cooks** = Lambda functions. Each cook does one dish. More cooks appear when it gets busy, and they leave when it's quiet.
- The **storerooms** = MongoDB. Each restaurant brand has its own locked storeroom (one database per company).
- The **order tickets on a rail** = queues. Slow dishes wait there and are cooked in the background.
- **Suppliers** = outside services like Stripe, unified.to and OpenAI.

## 🧩 The problem

A recruitment platform does many different jobs:
- quick screens, like listing jobs,
- slow jobs, like parsing thousands of resumes,
- scheduled jobs, like reminder emails,
- and calls to outside services.

Many companies use it at once, and their data must stay apart. Traffic goes up and down a lot during the day.

## 🛠️ What I built

This is the **team's** architecture. Here is the high-level picture:

```text
Browser (company subdomain)
   │
   ▼
CloudFront + S3  ──►  React apps: admin portal, talent portal, cloud-admin portal
   │
   ▼
API Gateway (REST + WebSocket)
   │
   ▼
Lambda functions (Node.js + TypeScript, Serverless Framework)
   │   controller → service (auth check + Joi validation) → repository → Mongoose model
   ▼
MongoDB — one database per customer company
   │
   ├── SQS queues ........ resume parsing, candidate scoring
   ├── Step Functions .... interview reminder emails
   ├── EventBridge crons . expiry checks, subscription renewal checks, clean-up
   ├── AWS Batch ......... long ATS/CRM candidate imports
   └── Outside services .. Stripe, unified.to (ATS), OpenAI (job descriptions), video interviews, email

Separate service (my recent project, also on AWS):
   AI voice agent ── Twilio + speech-to-text / text-to-speech + Claude
```

**How this usually works, and why this design:**
- **Lambda** is good for bursty traffic, and you pay per use.
- AWS can start a function from many **triggers**: HTTP, queues, file uploads, timers.
- Each function can have its own **timeout**: short for normal screens, long for AI jobs.

**Trade-offs to mention:**
- **Cold starts.** The first request after a quiet time is slower.
- **API Gateway's ~29-second limit.** Slow work must go to queues or background jobs.
- **Many functions = more to deploy and watch.**

Where my work sits on this diagram:
- the renewal cron and Stripe webhook,
- the JD chatbot backend,
- the ATS sync through unified.to,
- the shared core-service library,
- and the separate voice agent service.

[FILL IN: any part of this diagram you set up or changed yourself.]

## 🧗 The hard part

Understanding the **async parts** is the hard bit. A request can start work that finishes later in a queue, a cron or another service. When something breaks, you must follow it across several places.

[FILL IN: one time you traced a problem across these pieces — what you followed and what you found.]

## 🏆 The result

- One codebase serves many companies, with each company's data kept apart.
- Heavy work runs in the background, so screens stay fast.
- [FILL IN: anything measurable — number of customer companies, number of functions, uptime, etc. Only if you know it.]

## 🗣️ How to answer in an interview

> "SkillKeepr is fully on AWS. The frontend is three React single-page apps, for recruiters, candidates and our internal admin team, served from S3 through CloudFront. Requests go through API Gateway to Lambda functions written in Node.js and TypeScript, deployed with the Serverless Framework. Inside each function we follow layers: controller, then a service that checks auth and validates input with Joi, then a repository and Mongoose models.
>
> The data is in MongoDB, with one database per customer company, so tenants are fully separated. Anything slow runs in the background: SQS queues for resume parsing and scoring, Step Functions for reminder emails, EventBridge crons for things like subscription renewal checks, and AWS Batch for long ATS imports. We call out to Stripe, to unified.to for ATS data, and to OpenAI for job descriptions.
>
> The trade-offs with Lambda are cold starts and API Gateway's 29-second limit, which is why long jobs go to queues. My own pieces on this diagram are the renewal cron and Stripe webhook, the JD chatbot backend, the ATS sync, the shared core library, and the AI voice agent, which runs as a separate service on AWS."

## 🔁 Follow-up questions

### Is it a monolith or microservices?

A mix. The main platform is one codebase per portal, deployed as many separate Lambda functions. Some people call that a "serverless monolith". Heavy or very different work runs as separate services, like the voice agent. See [Monolith vs microservices](topic:resume/architectures-and-lambda).

### How do you handle a job that takes longer than 29 seconds?

You don't keep the HTTP request open. You put the job on a queue, or start a background function. You return "accepted" right away, then report progress later, for example with a WebSocket push or polling.

### How do services talk to each other?

Mostly through the shared database, queues, direct function calls and HTTP calls to helper services. [FILL IN: confirm any detail you are sure of.]

### What would you improve?

Talk about general ideas you understand, such as caching config that is read on every request, or reducing cold starts. [FILL IN: one improvement you would really suggest.]

### How do you deploy it?

[FILL IN: what you know of the deploy process — which tool runs the deploy, and what the CI pipeline checks.]

## 📚 Topics to revise

- [Multi-tenant platform](topic:resume/multi-tenant-platform)
- [Monolith, microservices and Lambda](topic:resume/architectures-and-lambda)
- [Serverless and AWS Lambda](topic:architecture/serverless-lambda)
- [Event-driven architecture](topic:architecture/event-driven)
- [Blocking the event loop](topic:nodejs/blocking-the-event-loop)
