---
title: What software architecture means
stack: architecture
order: 1
level: Basic
mustKnow: false
askedFrequency: common
summary:
  - Architecture is the big-picture plan of a system — its main parts, what each part does, and how the parts talk to each other.
  - Good architecture makes the system easy to change, easy to scale and hard to break.
  - Every architecture is a set of trade-offs. There is no "best" one — only the best one for this team, this product and this size.
  - "Common styles: monolith, modular monolith, microservices, serverless and event-driven."
  - In an interview, always explain WHY a choice was made and what it costs.
cards:
  - q: What is software architecture, in one sentence?
    a: The big-picture plan of a system — its main parts, their jobs, and how they talk to each other.
  - q: Why does architecture matter?
    a: It decides how easy the system is to change, scale, test and keep running. Changing it later is expensive.
  - q: Name four common architecture styles.
    a: Monolith, modular monolith, microservices, serverless (and event-driven as a way parts talk).
  - q: What is a trade-off?
    a: Getting one benefit by giving up another — for example, independent deploys (microservices) in exchange for more network calls and more things to run.
  - q: What are "non-functional requirements"?
    a: How well the system must work, not what it does — speed, uptime, security, cost and how many users it must handle.
---

## 💡 What is it?

**Software architecture** is the **big-picture plan** of a system.

It answers three questions. What are the main parts? What does each part do? How do the parts talk to each other?

It is not about one function or one file. It is about the shape of the whole system.

## 🏠 Real-life example

Think of building a **school**.

Before anyone lays a brick, someone draws a plan. Where are the classrooms? Where is the office? Where is the canteen? Which corridors connect them?

- The **building plan** = the software architecture.
- The **rooms** = the main parts of the system (services or modules).
- **Each room's purpose** = each part's single job.
- The **corridors and doors** = how parts talk (function calls, APIs, queues).
- **Moving a wall later** = changing architecture later. Possible, but slow and costly.

A small home for one family needs a simple plan. A school for 2,000 students needs a bigger one. Software is the same: the right plan depends on the size.

## 🧑‍💻 Code example

This tiny app is split into three clear parts. Save it as `parts.js` and run `node parts.js`.

```js
// A tiny app split into clear parts, each with ONE job.
const db = { jobs: [{ id: 1, title: 'Node.js Developer', salary: 900000 }] }; // DATA part: where things are stored

const jobService = {                                          // LOGIC part: the business rules
  listForCandidates() {                                       // what candidates are allowed to see
    return db.jobs.map(({ id, title }) => ({ id, title }));   // hide the salary field
  },                                                          // end of listForCandidates
};                                                            // end of logic part

function handleRequest(path) {                                // ENTRY part: receives requests
  if (path === '/jobs') return { status: 200, body: jobService.listForCandidates() }; // ask the logic part
  return { status: 404, body: { error: 'Not found' } };      // unknown path
}                                                             // end of entry part

console.log(handleRequest('/jobs'));                          // a valid request
console.log(handleRequest('/salaries'));                      // an unknown request
```

**Output:**

```text
{ status: 200, body: [ { id: 1, title: 'Node.js Developer' } ] }
{ status: 404, body: { error: 'Not found' } }
```

**What to notice:** each part has one job. The entry part never touches the data directly. That rule — "who may talk to whom" — is a small piece of architecture.

## 🔍 Deeper version

**Architecture is about decisions that are hard to change.** Choosing a variable name is easy to change. Choosing "one database per customer" or "50 separate services" is not.

**What architecture decides:**

| Question | Example answers |
|---|---|
| How is the code split? | One app (monolith), modules, many services |
| How do parts talk? | Function calls, REST/HTTP, queues and events |
| Where does data live? | One database, a database per service, a database per tenant |
| How does it run? | Servers, containers, serverless functions |
| How does it scale? | Bigger machine (vertical) or more copies (horizontal) |

**Functional vs non-functional requirements.**
- **Functional** = what the system does. "A recruiter can create a job."
- **Non-functional** = how well it must work. Speed, uptime, security, cost, number of users. These drive most architecture choices.

**Common styles** (each has its own topic):
- [Monolith](topic:architecture/monolith) — one app, one deploy.
- [Modular monolith](topic:architecture/modular-monolith) — one app with strict inner boundaries.
- [Microservices](topic:architecture/microservices) — many small apps, each deployed on its own.
- [Serverless](topic:architecture/serverless-lambda) — small functions run by the cloud on demand.
- [Event-driven](topic:architecture/event-driven) — parts react to events instead of calling each other directly.

**A real example.** At SkillKeepr, the main backend is **serverless**: many AWS Lambda functions behind API Gateway, built from one codebase. Slow work runs in the background on queues and scheduled jobs. The AI voice agent is a **separate service**. See [the platform architecture story](topic:resume/platform-architecture).

**Recording decisions.** Teams write short **architecture decision records (ADRs)**: the problem, the options, the choice and why. See [gap analysis and ADRs](topic:architecture/gap-analysis-adrs).

## 🎯 Why do we use it?

- **To make change cheap.** Clear parts mean a change stays in one place.
- **To let teams work in parallel.** Each team owns a part.
- **To meet the non-functional needs** — speed, uptime, cost and security.
- **To avoid expensive rewrites.** A wrong early choice can cost months later.

## ⚠️ Common mistakes

- **Copying big companies.** Netflix uses microservices because it has thousands of engineers. A team of five usually doesn't need that.
- **Choosing without reasons.** Every choice should have a written "why" and a known cost.
- **Ignoring non-functional needs** like cost and uptime until it's too late.
- **Drawing boxes but not rules.** A diagram means little if any part can still call any other part.

## 🗣️ How to answer in an interview

> "Software architecture is the big-picture plan of a system: the main parts, what each part is responsible for, and how they communicate. It's about the decisions that are expensive to change later — how the code is split, where data lives, how the parts talk, and how it runs and scales.
>
> There's no single best architecture; every style is a trade-off. A monolith is simple to build and deploy. Microservices give independent deploys and scaling, but add network calls and operational work. So I start from the requirements — especially non-functional ones like scale, uptime and cost — and the team's size.
>
> For example, the platform I work on runs its backend as many AWS Lambda functions from one codebase, with background work on queues, and our AI voice agent runs as a separate service."

## 🔁 Follow-up questions

### What is the difference between architecture and design?

Architecture is the high-level shape: the main parts and how they connect. Design is the lower level: classes, functions and patterns inside one part. The line is blurry. A simple test: architecture is what's expensive to change.

### How do you choose an architecture for a new project?

List the requirements, especially the non-functional ones: expected users, speed, uptime and budget. Consider the team size and skills. Start as simple as possible — often a well-structured monolith — and split only when there's a real reason.

### What is a trade-off? Give an example.

Gaining one thing by giving up another. Microservices let teams deploy independently, but you pay with network failures, harder debugging and more infrastructure.

### Who decides the architecture?

Usually senior engineers or an architect, with input from the team. Good teams write the decision and its reasons down, so new members understand why. [FILL IN: how architecture decisions are made in your team.]

## ✅ Quick check

### 1. Which of these is a non-functional requirement?

- A) "A candidate can upload a resume."
- B) "The search page must respond in under 1 second."
- C) "A recruiter can shortlist a candidate."

:::answer
**B.** It says how well the system must work (speed), not what it does.
:::

### 2. True or false: microservices are always better than a monolith.

:::answer
**False.** They solve problems of big teams and uneven scaling, but add network calls, more deployments and harder debugging. For a small team, a monolith is often better.
:::

### 3. In the code example, which part is allowed to read `db` directly?

:::answer
Only the **logic part** (`jobService`). The entry part asks the logic part, which keeps the rules (like hiding salary) in one place.
:::
