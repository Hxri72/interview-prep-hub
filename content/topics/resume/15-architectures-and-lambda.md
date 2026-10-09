---
title: Monolith, microservices and AWS Lambda work
template: story
stack: resume
order: 15
level: Intermediate
mustKnow: false
askedFrequency: common
summary:
  - The main SkillKeepr platform is serverless — many AWS Lambda functions behind API Gateway, deployed with the Serverless Framework.
  - "It is a \"serverless monolith\": one codebase, deployed as many small functions."
  - "Background work runs on AWS services: SQS queues, Step Functions, scheduled (cron) jobs and AWS Batch."
  - The AI voice agent is a separate service (a microservice) in its own repo, also hosted on AWS.
  - Know the trade-offs of each style — that's what interviewers ask.
cards:
  - q: What is a serverless monolith?
    a: One codebase with shared code, deployed as many separate Lambda functions. You get shared code like a monolith, but each function scales on its own.
  - q: Why use Lambda for a multi-tenant SaaS?
    a: Traffic is bursty, you pay per use, and AWS gives built-in triggers for crons, queues, file uploads and WebSockets.
  - q: What are the downsides of Lambda?
    a: Cold starts, the 15-minute maximum run time, API Gateway's ~29-second request limit, and more moving parts to monitor.
  - q: Why is the voice agent a separate service?
    a: "It has different needs — long phone calls, real-time audio and its own release cycle — so it lives in its own repo and runs on its own. [FILL IN: confirm your reasons]"
  - q: When would you use a queue instead of doing the work in the request?
    a: When the work is slow or calls rate-limited services, like resume parsing. The request returns quickly and a worker processes the queue.
---

## 💡 What is it?

Your resume says you worked across **monolith, microservices and serverless (AWS Lambda)** architectures.

At SkillKeepr, all three show up:
- The main platform is **serverless**: many AWS Lambda functions behind API Gateway.
- It is organised as a **"serverless monolith"**: one codebase, deployed as many functions.
- The **AI voice agent** is a separate **microservice** in its own repo, hosted on AWS.

## 🏠 Real-life example

Think of a **big restaurant**.

- A **monolith** is one kitchen where every cook shares one big room.
- **Microservices** are separate food stalls, each with its own kitchen and staff.
- **Serverless** is a cloud kitchen. You only pay for the cooks while they are cooking, and more cooks appear when orders rush in.
- A **serverless monolith** is one recipe book (one codebase) shared by many cloud-kitchen cooks (many functions).

## 🧩 The problem

A recruitment SaaS has bursty traffic. Many recruiters log in in the morning. Bulk resume uploads arrive at random times. Reminders must go out on a schedule.

Running big servers all day for peaks is wasteful. Some jobs are also slow, like parsing resumes or importing candidates from an ATS. They can't run inside a normal web request.

## 🛠️ What I built

**The platform (team-level facts, high level):**

```text
React apps (S3 + CloudFront)
        │
API Gateway ─► many Lambda functions (Node.js + TypeScript, one shared codebase)
        │
        ├─ MongoDB (one database per tenant)
        ├─ SQS queues      → slow work like resume parsing
        ├─ Step Functions  → multi-step jobs like reminder emails
        ├─ Cron schedules  → daily checks like subscription renewals
        └─ AWS Batch       → very long jobs like ATS candidate imports

AI voice agent (separate service, own repo, hosted on AWS)
```

**My parts:**
- I built the **AI voice agent**, a separate service. See [the voice agent story](topic:resume/voice-agent-microservice).
- I worked on the **Stripe auto-renewal**: a renewal cron and the webhook trigger. See [Stripe billing](topic:resume/stripe-billing).

[FILL IN: which Lambda functions or areas of the main platform you built or changed.]
[FILL IN: how the voice agent talks to the main platform, if it does — API calls, webhooks, a shared database.]

## 🧗 The hard part

**Common hard parts with this setup:**
- **Time limits.** API Gateway stops a request after about 29 seconds. Long jobs must move to queues or other services.
- **Cold starts.** A Lambda that hasn't run recently starts slower, especially with a big shared codebase.
- **Debugging.** One user action can touch several functions, so you follow it through the logs.

[FILL IN: the real hard part you faced.]

## 🏆 The result

[FILL IN: a measurable or clear result — e.g. a job moved to a queue so the API stayed fast, or a function you made faster.]

## 🗣️ How to answer in an interview

> "At SkillKeepr the main platform is serverless. It's a single TypeScript codebase deployed as many AWS Lambda functions behind API Gateway, with the Serverless Framework. You could call it a serverless monolith: shared code, but each function deploys and scales on its own. Slow work goes to SQS queues, Step Functions, cron jobs or AWS Batch.
>
> I also built a separate service, an AI voice agent that phones candidates for recruiters. It lives in its own repo and runs on AWS, because its needs are different: real-time audio, long calls and its own release cycle.
>
> On the main platform I worked on [FILL IN: your Lambda work], for example the Stripe auto-renewal cron and webhook."

## 🔁 Follow-up questions

### Monolith vs microservices — when do you split?

Split when a part has clearly different needs, like scaling, speed, release cycle or team ownership. Don't split by default. Every service adds network calls, deployments and monitoring.

### What are cold starts and how do you reduce them?

The first request to an idle Lambda loads the code, which is slow. To reduce them: use a smaller bundle, lazy-load heavy modules, add more memory, or use provisioned concurrency for hot paths.

### How do you handle a job that takes longer than 15 minutes?

Lambda's limit is 15 minutes. Split the job into smaller pieces on a queue, use Step Functions, or run it as a container job (AWS Batch, ECS).

### How do services talk to each other?

Synchronous HTTP calls when you need an answer now. Queues or events when the work can happen later. Always add timeouts and retries.

## 📚 Topics to revise

- [Monolith: pros and cons](topic:architecture/monolith)
- [Microservices](topic:architecture/microservices)
- [Serverless and AWS Lambda](topic:architecture/serverless-lambda)
- [Event-driven architecture](topic:architecture/event-driven)
- [Blocking the event loop](topic:nodejs/blocking-the-event-loop)
