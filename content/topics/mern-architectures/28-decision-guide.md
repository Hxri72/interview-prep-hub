---
title: "Decision guide: which architecture when"
stack: mern-architectures
order: 28
level: Intermediate
mustKnow: true
askedFrequency: very common
template: pattern
section: Choosing an architecture
summary:
  - "There is no single best architecture. Pick the simplest one that meets today's needs, and keep a path to grow."
  - "Ask five questions: Does it need SEO? How big is the team? How spiky is the traffic? Is it real-time? Will many companies (tenants) share it?"
  - "Most apps should start as a React SPA + one Express API (layered, modular monolith) + MongoDB Atlas on a PaaS."
  - "Move to SSR for SEO, microservices for many teams, serverless for spiky or event-driven work, WebSockets for real-time."
  - "In interviews, explain the trade-off and the reason, not just the name of the pattern."
cards:
  - q: What is the default architecture for a new MERN app?
    a: A React SPA (Vite) calling one Express API, built as a layered modular monolith, with MongoDB Atlas, deployed on a PaaS or simple cloud setup.
  - q: When do you choose SSR with Next.js?
    a: When public pages need SEO or a fast first paint, like a shop, blog or job board.
  - q: When do microservices make sense?
    a: When several teams need to deploy independently, or parts of the system have very different scaling needs. Not for a small team's first version.
  - q: When is serverless a good choice?
    a: For spiky traffic, event-driven work (webhooks, queues, crons), and teams that don't want to manage servers.
  - q: What are the five questions in the decision guide?
    a: SEO needed? Team size? Traffic pattern? Real-time? Multi-tenant?
---

## 💡 What is it?

This page is the **map** for the whole MERN App Architectures stack. It helps you pick the right design for a given app.

There is no "best" architecture. Each one fixes some problems and adds others. The skill is to ask the right questions, then choose the **simplest** design that fits.

Every option below links to its own page with code and details.

## 🏠 Real-life example

Think of **choosing how to travel**.

- Going to the shop next street? **Walk.** Don't book a flight.
- Going to the next city with your family? **A car** is good.
- Going to another country? **A flight**, even though it needs tickets, security and planning.

Nobody says "flights are the best, so always fly". You pick based on distance, people, budget and time.

| Travel | Architecture |
|---|---|
| Distance | How big and complex the app is |
| Number of people | Team size |
| Budget | Money and time to build and run |
| Walking | One simple Express server |
| Car | A modular monolith with good structure |
| Flight | Microservices, Kubernetes, many teams |
| Booking a flight to go next street | Over-engineering |

## 🗺️ The diagram

```text
START: a new MERN app
  │
  ├─ Do public pages need Google search (SEO) or a very fast first load?
  │     yes ─▶ SSR with Next.js            no ─▶ CSR SPA (React + Vite)
  │
  ├─ How many teams work on the backend?
  │     1 team ─▶ Modular monolith (layered)    many teams ─▶ Microservices
  │
  ├─ Traffic pattern?
  │     steady ─▶ PaaS / VPS / containers   spiky or event-driven ─▶ Serverless
  │
  ├─ Live updates needed (chat, notifications, dashboards)?
  │     yes ─▶ WebSockets / SSE            no ─▶ plain REST
  │
  ├─ Many companies share the app (SaaS)?
  │     yes ─▶ Multi-tenant design (tenant in token, data isolation)
  │
  └─ Slow work (emails, parsing, AI calls)?
        yes ─▶ Queues + background workers
```

## 🧑‍💻 Code example

A tiny "architecture advisor". It turns the questions above into code. Save as `advisor.js`. Run with `node advisor.js`.

```js
function recommend(app) {                                         // app = answers to the five questions
  const picks = [];                                               // list of suggestions we build up
  picks.push(app.needsSeo ? 'Next.js (SSR)' : 'React + Vite SPA (CSR)'); // SEO decides the rendering style
  picks.push(app.backendTeams > 2 ? 'Microservices' : 'Modular monolith (layered Express)'); // 2 = our cut-off for "many teams"
  picks.push(app.traffic === 'spiky' ? 'Serverless (Lambda)' : 'PaaS or containers'); // spiky = big ups and downs
  if (app.realtime) picks.push('WebSockets or SSE');              // live updates need a push channel
  if (app.multiTenant) picks.push('Multi-tenant: tenant ID in the JWT'); // SaaS for many companies
  if (app.slowJobs) picks.push('Queue + background workers');     // keep slow work out of the request
  picks.push('MongoDB Atlas');                                    // managed database in every case
  return picks;                                                   // give the list back
}                                                                 // end of recommend

const shop = { needsSeo: true, backendTeams: 1, traffic: 'steady', realtime: false, multiTenant: false, slowJobs: true }; // an online shop
const chat = { needsSeo: false, backendTeams: 1, traffic: 'steady', realtime: true, multiTenant: false, slowJobs: false }; // a chat app
const saas = { needsSeo: false, backendTeams: 2, traffic: 'spiky', realtime: false, multiTenant: true, slowJobs: true };   // a recruiting SaaS

console.log('Shop:', recommend(shop));                            // print advice for the shop
console.log('Chat:', recommend(chat));                            // print advice for the chat app
console.log('SaaS:', recommend(saas));                            // print advice for the SaaS
```

Output:

```text
Shop: [ 'Next.js (SSR)', 'Modular monolith (layered Express)', 'PaaS or containers', 'Queue + background workers', 'MongoDB Atlas' ]
Chat: [ 'React + Vite SPA (CSR)', 'Modular monolith (layered Express)', 'PaaS or containers', 'WebSockets or SSE', 'MongoDB Atlas' ]
SaaS: [ 'React + Vite SPA (CSR)', 'Modular monolith (layered Express)', 'Serverless (Lambda)', 'Multi-tenant: tenant ID in the JWT', 'Queue + background workers', 'MongoDB Atlas' ]
```

Real decisions need more thought than this. But the questions are the same ones an interviewer expects you to ask.

## 🔍 Deeper version

**The full map of this stack.** "Pick this when…" for every page:

| Area | Option | Pick this when… |
|---|---|---|
| Foundations | [3-tier MERN](topic:mern-architectures/three-tier) | Always: it's the base of every design below |
| Foundations | [One request end to end](topic:mern-architectures/request-end-to-end) | You need to explain how the pieces talk |
| Foundations | [One server vs separate](topic:mern-architectures/one-server-vs-separate) | Deciding if React and Express deploy together |
| Foundations | [Repo layouts](topic:mern-architectures/repo-layouts) | Choosing one repo, two repos or a [monorepo](glossary:monorepo) |
| Rendering | [CSR SPA + API](topic:mern-architectures/csr-spa-api) | Dashboards and apps behind a login |
| Rendering | [Express serves React](topic:mern-architectures/express-serves-react) | Small app, one deployment, no CORS |
| Rendering | [SSR with Next.js](topic:mern-architectures/ssr-nextjs) | Public pages need SEO or fast first paint |
| Rendering | [Jamstack](topic:mern-architectures/jamstack) | Content changes rarely: blogs, docs, landing pages |
| Rendering | [Micro-frontends](topic:mern-architectures/micro-frontends) | Many frontend teams own parts of one big UI |
| Backend | [MVC](topic:mern-architectures/mvc) | Small app, learning, quick CRUD |
| Backend | [Layered](topic:mern-architectures/layered) | Most real apps: logic separate from routes and DB |
| Backend | [Feature folders](topic:mern-architectures/feature-folders) | The app grows past 5–10 features |
| Backend | [Clean / hexagonal](topic:mern-architectures/clean-hexagonal) | Complex business rules, long-lived product |
| Backend | [Modular monolith](topic:mern-architectures/modular-monolith) | One team, want clear boundaries, simple deploys |
| Backend | [Microservices](topic:mern-architectures/microservices) | Many teams, independent deploys, different scaling |
| Backend | [Serverless MERN](topic:mern-architectures/serverless-mern) | Spiky traffic, events, no server management |
| Backend | [BFF + API gateway](topic:mern-architectures/bff-api-gateway) | Web and mobile need different API shapes |
| Backend | [Event-driven with queues](topic:mern-architectures/event-driven-queues) | Slow or retryable work: emails, parsing, AI |
| API style | [REST vs GraphQL vs tRPC vs gRPC](topic:mern-architectures/api-styles) | Choosing how frontend and backend talk |
| API style | [GraphQL with Apollo](topic:mern-architectures/graphql-apollo) | Many screens need different slices of data |
| API style | [Real-time options](topic:mern-architectures/realtime-options) | Live updates: chat, notifications, dashboards |
| API style | [Server Actions](topic:mern-architectures/nextjs-server-actions) | A Next.js app with simple forms and mutations |
| State | [Server vs client state](topic:mern-architectures/server-vs-client-state) | Deciding React Query vs Redux |
| Auth | [Auth designs](topic:mern-architectures/auth-designs) | Sessions vs JWT cookies vs hosted auth |
| Files | [Presigned uploads](topic:mern-architectures/presigned-uploads) | Users upload files, especially big ones |
| Deploy | [Deployment options](topic:mern-architectures/deployment-options) | VPS vs PaaS vs containers vs serverless |
| Deploy | [Docker Compose](topic:mern-architectures/docker-compose) | Same local setup for the whole team |

**Scenarios that put it all together:**
- [Small business / MVP](topic:mern-architectures/scenario-mvp)
- [Multi-tenant SaaS](topic:mern-architectures/scenario-multi-tenant-saas)
- [Real-time chat app](topic:mern-architectures/scenario-chat-app)
- [High-traffic e-commerce](topic:mern-architectures/scenario-ecommerce)
- [Explaining your own architecture](topic:mern-architectures/explain-your-architecture)

**Rules of thumb:**
- **Start simple, but structured.** A layered [modular monolith](topic:architecture/modular-monolith) is easy to split later. A messy monolith is not.
- **Split for people or scale, not fashion.** See [when to split a monolith](topic:architecture/when-to-split).
- **Non-functional needs decide.** SEO, latency, cost, team size and compliance matter more than features. See [requirements](topic:system-design/requirements).
- **Write it down.** Record big choices and why, in an ADR (architecture decision record). See [ADRs](topic:architecture/gap-analysis-adrs).

## ⚖️ Pros and cons

| Approach | Pros | Cons |
|---|---|---|
| Start simple (SPA + monolith + PaaS) | Fast to build; cheap; easy to debug | May need restructuring at large scale |
| Start complex (microservices + K8s) | Ready for huge scale on paper | Slow to build; costly; hard to debug; usually not needed yet |
| Decide with the five questions | Choices have clear reasons you can explain | Needs real knowledge of the trade-offs (this stack!) |

## 🎯 When to choose it

Use this guide:
- **At the start of a project**, to pick the first architecture.
- **In system design interviews**, to ask clarifying questions before drawing boxes.
- **When the app hurts**: slow deploys, teams blocking each other, huge bills. Re-ask the questions and see what changed.

## ⚠️ Common mistakes

- **Copying big-tech architecture.** Netflix needs microservices. A 3-person startup doesn't.
- **Choosing by trend, not need.** "Let's use GraphQL and Kubernetes" without a problem they solve.
- **Ignoring team skills.** The best design on paper fails if nobody can run it.
- **Jumping to the answer in interviews.** Ask about users, traffic, SEO and team first.

## 🗣️ How to answer in an interview

> "I don't think there's one best architecture. I start by asking a few questions. Do the public pages need SEO? How many teams work on it? Is the traffic steady or spiky? Do we need real-time updates? Will many customer companies share it?
>
> For most new MERN apps, my default is a React SPA with Vite, one Express API structured in layers as a modular monolith, and MongoDB Atlas. That's fast to build and easy to split later. If public pages need SEO, I'd use Next.js. For spiky or event-driven work, serverless fits well. For slow work like parsing or AI calls, I'd add a queue. I'd only move to microservices when several teams need to deploy independently.
>
> At SkillKeepr the setup is three React SPAs on S3 and CloudFront, a serverless Node.js backend on Lambda behind API Gateway, background work on SQS and Step Functions, and MongoDB with one database per tenant."

## 🔁 Follow-up questions

### What would you change in your answer for a startup with 2 developers?

Keep it as simple as possible: one repo, a React SPA or Next.js, one Express API, MongoDB Atlas, and Railway or Render. No microservices, no Kubernetes.

### How do you know it's time to move away from a monolith?

Signs: teams block each other's deploys, one part needs very different scaling, or builds and tests take too long. Even then, first try clearer modules inside the monolith.

### Is serverless always cheaper?

No. It's cheap for low or spiky traffic. For high, steady traffic, always-on containers or servers are often cheaper per request.

### What do you ask first in a system design question?

Who the users are, the main features, expected traffic, and the non-functional needs like latency, SEO, availability and cost. See [how to approach system design](topic:system-design/how-to-approach).

## ✅ Quick check

### 1. A college wants a public admissions website that ranks on Google, plus a staff dashboard. Which rendering choice fits the public part?

:::answer
**SSR with Next.js** (or static generation) for the public pages, because they need SEO. The staff dashboard behind a login can be a simple SPA.
:::

### 2. A 3-person team is building its first version. Someone suggests 8 microservices on Kubernetes. What's your advice?

:::answer
Start with a **modular monolith** on a PaaS. Microservices add network calls, deployments and DevOps work the team doesn't need yet. Keep clean module boundaries so splitting later is easy.
:::

### 3. An app sends 10,000 emails after each job post, and requests time out. What should you add?

:::answer
A **queue with background workers**. The API puts a job on the queue and answers at once, and workers send the emails with retries.
:::
