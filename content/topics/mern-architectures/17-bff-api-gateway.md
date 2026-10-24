---
title: BFF (Backend for Frontend) and API gateway
stack: mern-architectures
order: 17
level: Intermediate
mustKnow: false
askedFrequency: common
template: pattern
section: Backend structure
summary:
  - "An API gateway is one front door for all backend services. It handles shared jobs like routing, auth checks, rate limits and CORS."
  - "A BFF (Backend for Frontend) is a small backend made for ONE frontend, like the recruiter web app or the mobile app. It shapes data exactly for that screen."
  - The BFF often calls several services in parallel and merges the results, so React makes one request instead of five.
  - "Gateway = generic and shared. BFF = specific to one client. Many systems use both: browser → gateway → BFF → services."
  - Keep business rules in the services. The BFF should only combine, filter and reshape data.
cards:
  - q: What is an API gateway?
    a: One entry point in front of many backend services that routes requests and handles shared concerns like auth, rate limiting, CORS and logging.
  - q: What is a BFF?
    a: A backend built for one specific frontend (web, mobile, admin) that combines and shapes data from several services for that client's screens.
  - q: What is the main difference between a gateway and a BFF?
    a: A gateway is generic and shared by all clients; a BFF is tailored to one client and knows its screens.
  - q: What should NOT go in a BFF?
    a: Core business rules. Those stay in the services; the BFF only fetches, merges and reshapes data.
---

## 💡 What is it?

When your backend has many services, the React app needs a simple way to reach them. Two patterns help:

- An **[API gateway](glossary:api-gateway)** is **one front door** for all services. It routes each request to the right service. It also does shared jobs like checking the token, rate limiting and CORS.
- A **BFF (Backend for Frontend)** is a small backend made for **one frontend**. It knows exactly what that app's screens need. It calls the services, merges the answers and sends back one neat response.

## 🏠 Real-life example

Think of **a big hotel**.

- **The reception desk** is the API gateway. Every guest goes there first. It checks your room key and sends you to the right place: restaurant, gym or laundry.
- **Your personal room-service waiter** is the BFF. You say "breakfast for my room". The waiter collects bread from the bakery, eggs from the kitchen and juice from the bar. Then they bring it all on one tray.

Mapping:
- **Guests** = the React web app, the mobile app and the admin app.
- **Bakery, kitchen and bar** = the backend services (users, jobs, interviews).
- **One tray with everything** = one JSON response shaped for one screen.
- **A different waiter for VIP guests** = a separate BFF for the mobile app, with smaller trays.

## 🗺️ The diagram

```text
  Recruiter web app (React)        Mobile app            Candidate portal (React)
          │                            │                         │
          ▼                            ▼                         ▼
   ┌──────────────────────── API gateway ────────────────────────────┐
   │  HTTPS · verify JWT · rate limit · CORS · route by path · logs  │
   └──────┬──────────────────────────┬──────────────────────┬────────┘
          ▼                          ▼                      ▼
   ┌────────────┐             ┌────────────┐          ┌────────────┐
   │  Web BFF   │             │ Mobile BFF │          │ Portal BFF │   shape data per client
   └──┬───┬───┬─┘             └──┬──────┬──┘          └──┬──────┬──┘
      │   │   │   (parallel calls)│      │                │      │
      ▼   ▼   ▼                   ▼      ▼                ▼      ▼
   [users] [jobs] [interviews]   ...    ...              ...    ...   services, each with its own MongoDB
```

## 🧑‍💻 Code example

A tiny BFF for a recruiter's dashboard. It calls two "services" in parallel and returns one response made for the screen. The services are fakes in the same file, so you can run it.

Set up and run:

```bash
npm init -y
npm install express
node bff.js
```

Save this as `bff.js`:

```js
const express = require('express');                                         // load Express

// ---------- two fake services (in real life: separate apps) ----------
const svc = express();                                                      // one app plays both services for the demo
svc.get('/users/:id', (req, res) => res.json({ id: 1, name: 'Asha', email: 'asha@example.com', passwordHash: 'x' })); // users service
svc.get('/jobs', (req, res) => res.json([                                   // jobs service: all jobs of a recruiter
  { id: 10, title: 'Node developer', status: 'open', applicants: 42 },      // an open job
  { id: 11, title: 'React developer', status: 'closed', applicants: 17 },   // a closed job
]));                                                                        // end of jobs route
svc.listen(4000);                                                           // services live on port 4000

// ---------- the BFF for the recruiter web app ----------
const bff = express();                                                      // a backend made for ONE frontend
const SERVICES = 'http://localhost:4000';                                   // where the services are

bff.get('/bff/dashboard', async (req, res) => {                             // one endpoint = one screen
  const userId = 1;                                                         // in real life: from the verified JWT
  try {                                                                     // a service may fail
    const [user, jobs] = await Promise.all([                                // call both services AT THE SAME TIME
      fetch(`${SERVICES}/users/${userId}`).then((r) => r.json()),           // service call 1
      fetch(`${SERVICES}/jobs?owner=${userId}`).then((r) => r.json()),      // service call 2
    ]);                                                                     // end of Promise.all
    res.json({                                                              // shape the answer for the dashboard
      greeting: `Hi, ${user.name}`,                                         // only the name, never the password hash
      openJobs: jobs.filter((j) => j.status === 'open')                     // the screen shows open jobs only
        .map((j) => ({ id: j.id, title: j.title, applicants: j.applicants })), // only the fields the screen uses
      totalApplicants: jobs.reduce((sum, j) => sum + j.applicants, 0),      // a number the screen shows; 0 = start value
    });                                                                     // end of response
  } catch {                                                                 // a service was down
    res.status(502).json({ error: 'Dashboard data is not available' });     // 502 = bad gateway (upstream failed)
  }                                                                         // end of try/catch
});                                                                         // end of dashboard route

bff.listen(3000, () => console.log('BFF on 3000'));                         // React calls this port
```

```text
$ curl localhost:3000/bff/dashboard
{"greeting":"Hi, Asha","openJobs":[{"id":10,"title":"Node developer","applicants":42}],"totalApplicants":59}
```

React makes **one** call and gets exactly what the dashboard needs. The password hash and closed-job details never reach the browser.

## 🔍 Deeper version

The general gateway idea is in [API gateway](topic:architecture/api-gateway). Here's how both fit a MERN app.

**What a gateway usually does:**

| Job | Example |
|---|---|
| Routing | `/api/jobs/*` → jobs service |
| Auth check | Verify the JWT once, pass the user ID on |
| Rate limiting | 100 requests per minute per user |
| CORS and TLS | One place for HTTPS and allowed origins |
| Logging and IDs | Add a correlation ID to each request |

Common gateways: **AWS API Gateway**, NGINX, Kong, Envoy, or a small Express app with a proxy library.

**What a BFF usually does:**
- **Aggregation:** call 3–5 services in parallel with `Promise.all` and merge the results.
- **Shaping:** rename fields, drop secrets, compute small values like totals.
- **Client-specific rules:** the mobile BFF sends smaller images and fewer fields.
- **Session handling:** the BFF can keep the token in an HttpOnly cookie, so the browser never touches the raw token. This is a common, safe pattern for SPAs. See [token storage](topic:rest-auth/token-storage).

**Gateway vs BFF:**

| | API gateway | BFF |
|---|---|---|
| Built for | All clients | One client |
| Knows about screens? | No | Yes |
| Typical logic | Routing, auth, limits | Merge, filter, reshape |
| Who owns it | Platform / backend team | The frontend team often owns it |

**Next.js as a BFF.** A Next.js app's [route handlers](topic:nextjs/route-handlers) and [server actions](topic:mern-architectures/nextjs-server-actions) can act as the BFF for the React UI. This is a very common setup today.

**GraphQL as a BFF.** A [GraphQL](glossary:graphql) server lets each screen ask for exactly the fields it wants. It does the same job as a BFF in a different way. See [GraphQL with Apollo](topic:mern-architectures/graphql-apollo).

**Watch out for failures.** If one of three services fails, should the whole dashboard fail? Often it's better to return partial data. Use `Promise.allSettled` and show "not available" for that box.

## ⚖️ Pros and cons

| Pros | Cons |
|---|---|
| React makes one call per screen, not five | One more service to build, deploy and monitor |
| Secrets and extra fields never reach the browser | An extra network hop adds a little delay |
| Each client gets exactly the data it needs | Business logic can slowly leak into the BFF |
| The gateway does auth, limits and CORS once | Several BFFs can duplicate code |
| Services stay generic and simple | If the gateway is down, everything is down |

## 🎯 When to choose it

- **Several backend services** and the React app would otherwise call many of them per screen.
- **Several different clients** (web, mobile, admin portal) need different data shapes.
- **Security:** you don't want tokens or internal fields in the browser.
- **Not needed when:** you have one Express monolith. It already acts as the "BFF" for your React app.

## ⚠️ Common mistakes

- **Putting business rules in the BFF**, like "a candidate can apply only once". Then the mobile BFF needs the same rule again. Keep rules in services.
- **Calling services one after another** instead of in parallel. Use `Promise.all` when calls don't depend on each other.
- **One giant BFF for all clients.** Then it's just another monolith. One BFF per client type is the idea.
- **No timeouts on service calls.** One slow service makes the whole screen hang.

## 🗣️ How to answer in an interview

> "An API gateway is the single entry point in front of all backend services. It handles shared concerns like routing, verifying the JWT, rate limiting, CORS and logging. A BFF, or Backend for Frontend, is a backend built for one specific client, like the recruiter web app or the mobile app.
>
> The BFF calls several services in parallel, merges the results and returns exactly what one screen needs. So the React app makes one request, and internal fields never reach the browser. The gateway is generic and shared; the BFF is client-specific. Many systems have both: browser, then gateway, then BFF, then services.
>
> The key rule is to keep business logic in the services, not the BFF. At SkillKeepr, the React apps talk to Lambda functions behind AWS API Gateway, so I've worked with the gateway side of this."

[FILL IN: if any SkillKeepr endpoint combined data from several sources for one screen, describe it briefly. Only say what was really done.]

## 🔁 Follow-up questions

### Is AWS API Gateway a BFF?

No. It's a gateway: it routes requests, can check tokens with an authorizer and can limit traffic. It doesn't merge data for a screen. A Lambda behind it could act as a BFF.

### Is a BFF the same as GraphQL?

No, but they solve a similar problem. Both give the client exactly the data it needs. A BFF does it with fixed endpoints per screen. GraphQL lets the client write its own query.

### Who should own the BFF?

Often the frontend team. They know the screens best and can change the BFF when the UI changes, without waiting for the service teams.

### What if one service is down?

Use timeouts and `Promise.allSettled`. Return the parts that worked and mark the missing part, so the page still loads.

## ✅ Quick check

### 1. Which job belongs in the gateway, not the BFF?

- A) Merge user and job data for the dashboard
- B) Rate limit every client to 100 requests per minute
- C) Hide fields the mobile app doesn't need

:::answer
**B.** Rate limiting is a shared, generic job for all clients. A and C are client-specific, so they belong in a BFF.
:::

### 2. Why does the example use `Promise.all`?

:::answer
To call the users and jobs services **at the same time**. The total wait is the slowest call, not the sum of both.
:::

### 3. True or false: a single Express monolith serving one React app needs a separate BFF.

:::answer
**False.** The monolith already serves that one frontend. A BFF helps when there are many services or many different clients.
:::
