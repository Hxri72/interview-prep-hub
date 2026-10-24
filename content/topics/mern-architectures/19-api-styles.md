---
title: REST vs GraphQL vs tRPC vs gRPC
stack: mern-architectures
order: 19
level: Intermediate
mustKnow: true
askedFrequency: very common
template: pattern
section: How frontend talks to backend
summary:
  - "An API style is the set of rules React and the backend use to talk. The four common ones are REST, GraphQL, tRPC and gRPC."
  - "REST uses many URLs, one per resource, with HTTP methods like GET and POST. It is the default for most MERN apps."
  - "GraphQL uses one URL. The client sends a query that names exactly the fields it wants."
  - "tRPC lets a TypeScript frontend call backend functions with shared types and no schema file. It only works when both sides are TypeScript."
  - "gRPC is a fast binary style, mostly for service-to-service calls. Browsers can't call it directly without a proxy."
cards:
  - q: What is the default API style for a MERN app?
    a: REST. Express routes like GET /api/jobs and POST /api/jobs, returning JSON.
  - q: What problem does GraphQL solve?
    a: Over-fetching and under-fetching. The client asks for exactly the fields it needs, often in one request.
  - q: When does tRPC make sense?
    a: When the frontend and backend are both TypeScript, usually in one monorepo, and no outside client needs the API.
  - q: Why is gRPC rarely used from React?
    a: Browsers can't speak gRPC's HTTP/2 framing directly. You need gRPC-Web and a proxy, so gRPC is mostly for backend-to-backend calls.
  - q: Which style is easiest to cache with a CDN or browser cache?
    a: REST, because each resource has its own URL and GET requests can be cached by URL.
---

## 💡 What is it?

Your React app and your backend need a way to talk. The **API style** is the set of rules for that talk.

There are four styles you should know: **REST**, **[GraphQL](glossary:graphql)**, **tRPC** and **gRPC**.

All four move data between the frontend and the server. They differ in how you ask for data and how strict the types are.

## 🏠 Real-life example

Think of four ways to order food at a big school canteen.

- **REST = separate counters.** One counter for rice, one for curry, one for juice. You walk to each counter. Each counter is one URL.
- **GraphQL = one order form.** You tick exactly what you want on one form: "rice, small; curry, no onion". One counter gives you only that.
- **tRPC = ordering from your own family kitchen.** You and the cook speak the same language at home. No menu card is needed. It only works inside the same family (both sides TypeScript).
- **gRPC = the walkie-talkie between kitchen staff.** Very fast and short codes. Customers (browsers) don't use it. Staff (backend services) do.

## 🗺️ The diagram

```text
REST                          GraphQL                       tRPC                          gRPC
React                         React                         React (TS)                    Service A (Node)
  │ GET  /api/jobs              │ POST /graphql               │ trpc.job.list()             │ JobService.List()
  │ GET  /api/jobs/7            │ { jobs { title } }          │  (types shared)             │  (binary, HTTP/2)
  │ POST /api/jobs              ▼                             ▼                             ▼
  ▼                           One endpoint                  Router of functions           Service B (Node / Go)
Many endpoints (Express)      (Apollo Server)               (tRPC server on Express)      (.proto contract)
  │                             │                             │                             │
  └──────────── MongoDB ────────┴─────────────────────────────┴─────────────────────────────┘
```

## 🧑‍💻 Code example

The same "list jobs" feature in REST, shown end to end. It is the style most MERN apps use.

Set up:

```bash
npm init -y
npm install express
```

Save this as `server.js` and run `node server.js`.

```js
const express = require('express');                         // load Express
const app = express();                                      // create the app

const jobs = [{ id: 1, title: 'React Developer', salary: 0 }]; // fake data; 0 = salary hidden

app.get('/api/jobs', (req, res) => {                        // REST: GET + a resource URL = "list jobs"
  res.json(jobs);                                           // send every field of every job as JSON
});                                                         // end of GET /api/jobs

app.listen(3000, () => console.log('API on port 3000'));    // start on port 3000
```

In React, call it with `fetch`:

```jsx
import { useEffect, useState } from 'react';                // React hooks for effects and state

export default function Jobs() {                            // a component that lists jobs
  const [jobs, setJobs] = useState([]);                     // [] = no jobs loaded yet
  useEffect(() => {                                         // run after the first render
    fetch('/api/jobs')                                      // REST call: one URL per resource
      .then((res) => res.json())                            // read the JSON body
      .then(setJobs);                                       // save the list in state
  }, []);                                                   // [] = run only once
  return <ul>{jobs.map((j) => <li key={j.id}>{j.title}</li>)}</ul>; // show each title
}                                                           // end of Jobs
```

```text
$ curl http://localhost:3000/api/jobs
[{"id":1,"title":"React Developer","salary":0}]
```

Notice: React only shows `title`, but the server also sent `salary`. That extra data is called **over-fetching**. GraphQL fixes it. See [GraphQL with Apollo](topic:mern-architectures/graphql-apollo).

## 🔍 Deeper version

**REST** maps resources to URLs and actions to HTTP methods (GET, POST, PATCH, DELETE). Responses are usually JSON. Its big strength is HTTP caching: a GET URL can be cached by the browser or a [CDN](glossary:cdn). See [What is REST](topic:rest-auth/what-is-rest).

**GraphQL** has one endpoint and a typed **schema** (a list of types and fields the server offers). The client sends a **query** (read) or **mutation** (write). It fixes:
- **Over-fetching:** getting fields you don't need.
- **Under-fetching:** needing many calls to build one screen.

The cost: caching moves into the client library, and you must guard against very deep, expensive queries.

**tRPC** stands for "TypeScript remote procedure call". You write backend functions. The frontend imports their **types** (not the code) and calls them like local functions. If you rename a field on the server, the frontend fails at compile time. There is no schema file and no code generation. It needs TypeScript on both sides, and it is usually used inside a [monorepo](glossary:monorepo).

**gRPC** uses **Protocol Buffers** (a compact binary format) and a `.proto` contract file. It runs on HTTP/2 and supports streaming. It is fast and strongly typed. But browsers can't call it directly; you need **gRPC-Web** plus a proxy. So in MERN apps it appears between backend services, not between React and the server. See [microservices](topic:mern-architectures/microservices).

| | REST | GraphQL | tRPC | gRPC |
|---|---|---|---|---|
| Endpoints | many URLs | one URL | one router of functions | service methods |
| Data format | JSON | JSON | JSON | binary (Protobuf) |
| Contract | optional (OpenAPI) | schema (required) | TypeScript types | `.proto` file |
| Who can call it | anyone | anyone | TS clients you own | backend services |
| HTTP caching | easy | hard | medium | none |

## ⚖️ Pros and cons

| Style | Pros | Cons |
|---|---|---|
| REST | simple, known by everyone, easy HTTP caching, great tools (Swagger) | over-fetching, many calls for one screen, versioning work |
| GraphQL | exact fields, one request per screen, typed schema | harder caching, query-cost limits needed, more setup |
| tRPC | end-to-end types, no schema, very fast to build | TypeScript only, tight coupling, not for public APIs |
| gRPC | very fast, streaming, strict contract | not browser-friendly, binary is hard to debug |

## 🎯 When to choose it

- **A normal MERN app, public API or mobile + web clients:** REST.
- **Many screens that each need a different mix of data (dashboards, mobile apps on slow networks):** GraphQL.
- **One small team, TypeScript everywhere, frontend and backend in one monorepo, no outside users of the API:** tRPC.
- **Many backend services calling each other at high speed:** gRPC between services, REST or GraphQL at the edge for React.

You can mix them. A common setup is REST or GraphQL for the browser, and gRPC or queues between services.

## ⚠️ Common mistakes

- **Picking GraphQL "because it is modern".** For a simple CRUD app, REST is less work and easier to cache.
- **Using tRPC for a public API.** Outside clients can't share your TypeScript types.
- **Trying to call gRPC from React directly.** Browsers need gRPC-Web and a proxy.
- **Ignoring over-fetching in REST.** You can add a `fields` query parameter or a dedicated endpoint for one screen.

## 🗣️ How to answer in an interview

> "REST, GraphQL, tRPC and gRPC are all ways for a client to call a server.
>
> REST is resource-based. Each resource has a URL and I use HTTP methods on it. It's simple and easy to cache, so it's my default for a MERN app.
>
> GraphQL has one endpoint and a typed schema. The client asks for exactly the fields it needs. That solves over-fetching and under-fetching, but caching and query cost need more care.
>
> tRPC gives end-to-end TypeScript types without a schema. It fits a full-stack TypeScript monorepo, not a public API.
>
> gRPC uses Protobuf over HTTP/2. It's fast and fits service-to-service calls, but browsers need a proxy.
>
> At work I've built REST APIs in Node and TypeScript on AWS Lambda behind API Gateway. I haven't used GraphQL, tRPC or gRPC in production, but I know when each one fits."

## 🔁 Follow-up questions

### What is over-fetching and under-fetching?

Over-fetching is getting more fields than the screen needs. Under-fetching is getting too little, so you must make more calls to build one screen. GraphQL solves both by letting the client pick fields.

### Can a REST API avoid over-fetching?

Yes, partly. You can support a `fields` query, like `GET /api/jobs?fields=title,location`. Or you can build a special endpoint for one screen (a BFF). See [BFF and API gateway](topic:mern-architectures/bff-api-gateway).

### Is tRPC the same as GraphQL?

No. GraphQL has a schema language and works with any client. tRPC has no schema; it reuses TypeScript types, so only TypeScript clients you own get the benefit.

### Why can't the browser call gRPC directly?

gRPC needs low-level HTTP/2 features that browser JavaScript can't control. gRPC-Web is a browser version, and it needs a proxy (like Envoy) to translate.

## ✅ Quick check

### 1. A public API used by partners in Python and Java. Which style is the safest default?

- A) tRPC
- B) REST
- C) gRPC-Web

:::answer
**B) REST.** Any language can call it, and it is easy to document with OpenAPI. tRPC needs TypeScript clients.
:::

### 2. True or false: GraphQL usually has one endpoint, like `/graphql`.

:::answer
**True.** All queries and mutations go to one URL. The query body says what you want.
:::

### 3. Two Node services call each other thousands of times a second. Which style fits best?

:::answer
**gRPC.** It is fast, binary and has a strict contract. It is a good fit between backend services.
:::
