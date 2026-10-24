---
title: "Scenario: small business / MVP"
stack: mern-architectures
order: 29
level: Basic
mustKnow: false
askedFrequency: common
template: pattern
section: Choosing an architecture
summary:
  - "An MVP (minimum viable product) is the smallest working version of an app. The goal is to launch fast and learn from real users."
  - "Best fit: one repo, one Express server that serves both the API and the React build, MongoDB Atlas, and one PaaS deploy (Railway or Render)."
  - "Inside the server, use simple layers (routes → controllers → services → models), so the code can grow later without a rewrite."
  - "Skip microservices, Kubernetes, GraphQL and Redis on day one. Add each one only when a real problem asks for it."
  - "Plan the growth path: split the frontend to a CDN, add a queue for slow work, then split services only if teams or load need it."
cards:
  - q: What architecture would you pick for an MVP?
    a: "A single Express server (a monolith) that serves a React SPA build and a REST API, with MongoDB Atlas, deployed to one PaaS like Railway or Render."
  - q: Why not microservices for an MVP?
    a: "They add network calls, many deploys and harder debugging. A small team gets nothing back until the app has real scale or many teams."
  - q: What do you still do properly even in an MVP?
    a: "Clean layers in the code, input validation, password hashing, HttpOnly cookies, environment variables for secrets, and backups of the database."
  - q: What is usually the first thing you change as an MVP grows?
    a: "Move slow work (emails, PDFs, imports) to a background queue, and serve the React build from a CDN."
---

## 💡 What is it?

An **MVP** (minimum viable product) is the smallest version of an app that real people can use. You build it fast, put it in front of users, and learn what they really need.

In this scenario, a small business wants an app. Our example is a tuition centre. Parents book demo classes, and the owner sees all bookings on an admin page.

The question is: how do you wire up React, Express and MongoDB for this? The answer is **keep it simple**: one server, one database, one deploy.

## 🏠 Real-life example

Think of opening a **small tea stall**.

You don't start with a big restaurant, five cooks and a separate kitchen building. You start with one counter, one stove and one person. If people love your tea, you add a second stove. Later, maybe a second shop.

- **One counter that makes and serves tea** = one Express server that serves the React page *and* the API.
- **The one stove** = one MongoDB database on Atlas.
- **Renting a ready-made shop, not building one** = deploying on a PaaS (Railway or Render). They run the server for you.
- **Keeping the counter tidy, with a shelf for each thing** = clean folders: routes, controllers, services, models.
- **Adding a second stove when the queue gets long** = adding a queue or a CDN only when real users need it.

## 🗺️ The diagram

```text
                     ONE deploy on a PaaS (Railway / Render)
                   ┌───────────────────────────────────────────┐
  Parent / Owner   │  Express 5 server (one Node.js process)   │
  ┌──────────┐     │                                           │
  │ Browser  │──►  │  GET /           → React build (dist/)    │
  │ (React)  │     │  GET /admin      → React build (SPA)      │
  └──────────┘     │  /api/bookings   → routes → controllers   │
       ▲           │                    → services → models    │
       │           └──────────────────────────┬────────────────┘
       │  JSON + HttpOnly cookie              │ Mongoose
       └──────────────────────────────────────▼
                                     ┌──────────────────┐
                                     │ MongoDB Atlas    │
                                     │ (free/small tier)│
                                     └──────────────────┘
       Email (later): a simple provider API, called from a service
```

One repo, one server, one database. That is the whole system.

## 🧑‍💻 Code example

This is the heart of the MVP: one Express file that serves the API **and** the React build. It uses an in-memory array instead of MongoDB, so you can run it right away.

Set up:

```bash
npm init -y
npm install express
mkdir -p client/dist && echo "<h1>Tuition Centre</h1>" > client/dist/index.html
```

Save this as `server.mjs`. Run it with `node server.mjs`.

```js
import express from 'express';                                     // load Express 5
import path from 'node:path';                                      // helps build folder paths safely

const app = express();                                              // create the app
app.use(express.json());                                            // read JSON request bodies into req.body

const bookings = [];                                                // fake database table (MongoDB in real life)

app.post('/api/bookings', (req, res) => {                           // API: a parent books a demo class
  const { parentName, phone, subject } = req.body;                  // read the three form fields
  if (!parentName || !phone) {                                      // simple validation: two fields are required
    return res.status(400).json({ error: 'parentName and phone are required' }); // 400 = bad request
  }                                                                 // end of validation
  const booking = { id: bookings.length + 1, parentName, phone, subject }; // build the new booking
  bookings.push(booking);                                           // "save" it
  res.status(201).json(booking);                                    // 201 = created, send it back
});                                                                 // end of POST route

app.get('/api/bookings', (req, res) => {                            // API: the owner sees all bookings
  res.json(bookings);                                               // send the list as JSON
});                                                                 // end of GET route

const dist = path.resolve('client/dist');                           // folder where `vite build` puts the React app
app.use(express.static(dist));                                      // serve JS, CSS and images from that folder

app.get('/{*splat}', (req, res) => {                                // any other path (like /admin) → the React app
  res.sendFile(path.join(dist, 'index.html'));                      // React Router then shows the right page
});                                                                 // end of SPA fallback

const port = process.env.PORT ?? 3000;                              // the PaaS gives a PORT; 3000 on your laptop
app.listen(port, () => console.log(`Running on ${port}`));          // start the one and only server
```

Try it:

```text
$ curl -X POST -H "Content-Type: application/json" \
    -d '{"parentName":"Asha","phone":"98450 00000","subject":"Maths"}' http://localhost:3000/api/bookings
{"id":1,"parentName":"Asha","phone":"98450 00000","subject":"Maths"}

$ curl http://localhost:3000/admin
<h1>Tuition Centre</h1>
```

:::version[Version note]
Express 5 changed wildcard routes. The old `app.get('*', …)` must now be written with a named wildcard, like `'/{*splat}'`.
:::

## 🔍 Deeper version

**The full MVP stack, piece by piece:**

| Piece | MVP choice | Why it fits |
|---|---|---|
| Frontend | React 19 + Vite SPA ([CSR](glossary:csr)) | Fast to build. No SEO needed for a booking form behind a link. |
| Serving | Express serves `dist/` | One deploy, same origin, so no CORS setup. See [Express serving the React build](topic:mern-architectures/express-serves-react). |
| Backend | One Express [monolith](glossary:monolith), layered | Simple to run and debug. See [layered](topic:mern-architectures/layered). |
| API style | REST + JSON | Everyone knows it. See [API styles](topic:mern-architectures/api-styles). |
| Data | MongoDB Atlas + Mongoose | Managed backups. Free or small tier to start. |
| Auth | Session or JWT in an HttpOnly cookie, for the owner only | Parents don't need accounts. See [auth designs](topic:mern-architectures/auth-designs). |
| Files | None yet; later, [presigned uploads](topic:mern-architectures/presigned-uploads) | Don't build what you don't need. |
| Slow work | Send the email inside the request, at first | One email per booking is fast enough. |
| Deploy | Railway or Render (PaaS) | Push to Git and it deploys. See [deployment options](topic:mern-architectures/deployment-options). |

**Folder layout.** Even a tiny app gets clean layers. A single repo is enough (see [repo layouts](topic:mern-architectures/repo-layouts)):

```text
tuition-app/
  client/            ← React + Vite (builds to client/dist)
  server/
    routes/          ← URL → controller
    controllers/     ← read req, send res
    services/        ← business rules (e.g. "max 5 demos per day")
    models/          ← Mongoose schemas
    server.js        ← creates the app, serves client/dist
```

**What you still do properly, even in an MVP.** "Simple" does not mean "unsafe":
- Validate input with Joi or Zod.
- Hash passwords with bcrypt.
- Keep secrets in [environment variables](glossary:environment-variable), never in Git.
- Use HTTPS (the PaaS gives it to you).
- Add a [health check](topic:devops/health-checks) and turn on Atlas backups.

**The growth path.** Change one thing at a time, and only when a real problem shows up:

| Problem you see | What you change |
|---|---|
| Emails or PDFs make requests slow | Move them to a background [queue](glossary:queue). See [event-driven with queues](topic:mern-architectures/event-driven-queues). |
| Pages load slowly far away | Put the React build on a [CDN](glossary:cdn) (S3 + CloudFront or the PaaS CDN). |
| One server is not enough | Run 2+ copies behind a load balancer. Keep the server stateless. |
| Code gets tangled with many features | Group code by feature: a [modular monolith](topic:mern-architectures/modular-monolith). |
| Many teams step on each other | Only now think about [microservices](topic:mern-architectures/microservices). |

## ⚖️ Pros and cons

| Pros | Cons |
|---|---|
| Fastest way to launch | One server is a single point of failure |
| One repo, one deploy, one log to read | Frontend and backend deploy together |
| No CORS, because it's the same origin | Scaling means scaling everything together |
| Cheap: one small server + a small Atlas tier | Slow work inside requests can hurt speed |
| Easy for one or two developers to understand | Needs discipline (layers) to stay clean as it grows |

## 🎯 When to choose it

- A **new product** where you are not yet sure what users want.
- A **small business** app: bookings, orders, a small CRM, an internal tool.
- A team of **one to three developers**.
- Traffic in the **hundreds or low thousands** of users a day.
- A **college project or a portfolio project** you want to put online quickly.

Choose something else when you already know you need SEO for many public pages (look at [SSR with Next.js](topic:mern-architectures/ssr-nextjs)), or real-time features (look at the [chat app scenario](topic:mern-architectures/scenario-chat-app)).

## ⚠️ Common mistakes

- **Over-engineering on day one.** Microservices, Kubernetes, Redis and GraphQL for 50 users. You spend weeks on setup instead of features.
- **No layers at all.** All the logic sits inside route handlers. It works for a month, then nobody can change it safely.
- **Secrets in the code.** The Atlas password pushed to GitHub. Use environment variables from the first commit.
- **Forgetting the SPA fallback.** Refreshing `/admin` gives a 404, because Express only knows the API routes.

## 🗣️ How to answer in an interview

> "For an MVP I'd keep the architecture as simple as possible, because speed of learning matters more than scale.
>
> I'd build a React SPA with Vite and one Express 5 server. The server serves the React build and a REST API, so it's one deploy on the same origin, with no CORS setup. Inside, I'd still use layers: routes, controllers, services and Mongoose models. The data goes in MongoDB Atlas, so backups are managed. I'd deploy it on a PaaS like Railway or Render.
>
> I'd still do the basics right: validation, bcrypt for passwords, HttpOnly cookies, secrets in environment variables, and a health check.
>
> Then I'd grow it step by step. First a queue for slow work like emails, then a CDN for the frontend, then more server copies behind a load balancer. I'd only split into services if teams or load really need it."

## 🔁 Follow-up questions

### Why is a monolith fine for an MVP?

It has one codebase, one deploy and one place to debug. A small team moves fastest this way. Most apps never reach the scale where a [monolith](topic:architecture/monolith) becomes the problem.

### Would you use Next.js instead?

Only if public pages need SEO, like a blog or a course catalogue. For a booking form and an admin page, a Vite SPA is simpler. Next.js is a good choice too, but it brings more concepts to learn.

### How would you handle the confirmation email?

At first, I'd call the email provider inside the request, after saving the booking. If it gets slow or fails often, I'd move it to a background job with retries.

### How do you keep the MVP easy to split later?

Keep clean layers and group code by feature. Then one feature folder can become its own service later, without a rewrite.

## ✅ Quick check

### 1. A two-person startup wants to launch a booking app in 4 weeks. Which setup fits best?

- A) Five microservices on Kubernetes
- B) One Express server serving the React build + MongoDB Atlas on a PaaS
- C) A GraphQL gateway with three databases

:::answer
**B.** It is the fastest to build, deploy and debug. A and C add a lot of setup with no benefit at this size.
:::

### 2. The React app loads, but refreshing `/admin` shows "Cannot GET /admin". What is missing?

:::answer
The **SPA fallback** route. Express must send `index.html` for unknown paths, so React Router can show the page. In Express 5, write it as `app.get('/{*splat}', …)`.
:::

### 3. Users complain that booking takes 6 seconds, because the server builds a PDF receipt during the request. What is the first change?

:::answer
Move the PDF work to a **background queue**. Save the booking, reply at once, and let a worker build and email the PDF.
:::
