---
title: "Putting it together: explain your app end to end in an interview"
stack: web-fundamentals
order: 28
level: Intermediate
mustKnow: true
askedFrequency: very common
summary:
  - "Interviewers love \"What happens when a user opens your app?\" Answer it as one journey: URL → DNS → HTTPS → CDN → index.html → JS bundle → React renders → API call → auth → database → response → re-render."
  - "Split the story into two halves: loading the app (static files) and using the app (API calls and data)."
  - Mention one detail per step (a cache header, the cookie with the JWT, the tenant check, an index on the query).
  - "Finish with what happens on a write (validation, database, background job) and how a deploy reaches users."
  - Tell it about your real app, and say "I'm not sure" for parts you didn't build.
cards:
  - q: What are the two halves of the "what happens when a user opens the app" story?
    a: Loading the app (DNS, HTTPS, CDN, index.html, JS bundles, React starts) and using the app (API calls, auth, database, response, re-render).
  - q: Where does the JWT travel in a cookie-based app?
    a: The browser sends the HttpOnly cookie automatically with each API request (credentials included). The backend verifies it before touching data.
  - q: How does a multi-tenant app know which company's data to load?
    a: From the request, for example the subdomain or a header, checked against the tenant inside the verified JWT. Then it queries only that tenant's data.
  - q: What happens on a slow task like parsing 500 resumes?
    a: The API saves the request, puts work on a queue and answers quickly. A background worker does the work and the UI shows progress.
  - q: How does a new deploy reach users?
    a: CI builds new hashed files, uploads them, and the CDN's index.html is refreshed. The next page load picks up the new file names.
---

## 💡 What is it?

A very common interview question is: **"Explain how your app works, from the moment a user opens it."**

A strong answer is one clear journey. It goes from the URL to pixels on the screen, then from a click to the database and back. This page gives you a template, a MERN version and a SkillKeepr version.

## 🏠 Real-life example

Think of **ordering food in a restaurant**.

- **Finding the restaurant's address** = DNS.
- **The security guard checking the door is genuine** = HTTPS.
- **The waiter bringing the menu from the counter near you** = the CDN serving `index.html` and JS.
- **You reading the menu** = React drawing the screen.
- **Placing an order with your table token** = an API call with the JWT cookie.
- **The kitchen checking your token and cooking** = the backend checking auth and querying the database.
- **A big catering order sent to the back kitchen to make later** = a queue and a background job.
- **The waiter bringing the dish** = the response, and React showing the data.

## 🧑‍💻 Code example

A small Node script that prints the journey as a timeline, so you can practise saying it in order. **The times are pretend values** to show the order, not real measurements. Save as `journey.mjs` and run `node journey.mjs`.

```js
const steps = []; // collects each step with a fake time
let t = 0; // milliseconds since the user pressed Enter
const step = (ms, who, what) => { t += ms; steps.push(`${String(t).padStart(4)} ms  ${who.padEnd(10)} ${what}`); }; // record one step
step(0, 'Browser', 'user opens https://app.example.com/jobs'); // start
step(20, 'DNS', 'app.example.com → CDN address (cached next time)'); // name → IP
step(30, 'TLS', 'secure connection agreed (HTTPS)'); // encryption handshake
step(15, 'CDN', 'index.html (no-cache: checked with origin, 304)'); // the page shell
step(25, 'CDN', 'index-CnceAJRU.js from edge cache (immutable)'); // the app code
step(40, 'Browser', 'JS runs: React draws the screen, router shows /jobs'); // app starts
step(5, 'Browser', 'fetch GET /api/jobs (cookie with JWT sent)'); // ask for data
step(35, 'API', 'gateway → backend: check JWT, find the tenant'); // auth
step(20, 'Database', 'find jobs for this tenant (uses an index)'); // query
step(10, 'API', '200 JSON sent back'); // response
step(15, 'Browser', 'React re-renders with the jobs list'); // user sees data
console.log(steps.join('\n')); // print the whole journey
```

Real output:

```text
   0 ms  Browser    user opens https://app.example.com/jobs
  20 ms  DNS        app.example.com → CDN address (cached next time)
  50 ms  TLS        secure connection agreed (HTTPS)
  65 ms  CDN        index.html (no-cache: checked with origin, 304)
  90 ms  CDN        index-CnceAJRU.js from edge cache (immutable)
 130 ms  Browser    JS runs: React draws the screen, router shows /jobs
 135 ms  Browser    fetch GET /api/jobs (cookie with JWT sent)
 170 ms  API        gateway → backend: check JWT, find the tenant
 190 ms  Database   find jobs for this tenant (uses an index)
 200 ms  API        200 JSON sent back
 215 ms  Browser    React re-renders with the jobs list
```

## 🔍 Deeper version

**The template (2–3 minutes, say it in this order):**

**Part 1 — Loading the app**
1. **DNS:** the domain turns into an IP address, usually a CDN's. See [DNS and HTTPS](topic:devops/dns-https).
2. **HTTPS:** a TLS handshake makes the connection secure.
3. **CDN:** returns `index.html` (`no-cache`) and the hashed JS and CSS files (long cache). See [Hosting a frontend on AWS](topic:web-fundamentals/hosting-frontend-aws).
4. **Browser:** parses the HTML, downloads the bundles, runs the JS. React mounts and the router picks the screen. See [How a React SPA is served](topic:web-fundamentals/spa-serving).

**Part 2 — Using the app**

5. **API call:** React calls `fetch('/api/jobs')`. The browser adds the auth cookie (or the app adds an `Authorization` header). If the API is on another origin, CORS rules apply. See [Same-origin policy](topic:web-fundamentals/same-origin-policy).
6. **Backend entry:** a load balancer or API Gateway receives it and runs your code (Express on a server, or a Lambda). See [Hosting a Node backend on AWS](topic:web-fundamentals/hosting-backend-aws).
7. **Middleware:** check the [JWT](glossary:jwt), find the user and their permissions, validate the input.
8. **Database:** run the query, ideally using an [index](glossary:index).
9. **Response:** JSON with a status code. React updates state and re-renders.

**Part 3 — Writes, background work and deploys**

10. **A write** (like "create job"): validate, save, return 201. Slow work (emails, parsing, AI calls) goes to a [queue](topic:system-design/queues-background-jobs). A worker does it later, and the UI shows progress.
11. **A deploy:** CI builds and tests, uploads new hashed files, deploys the backend, and refreshes the CDN. The next page load gets the new code.

**Generic MERN version** (good if they ask about "a typical app"):

```text
React (Vite build) on S3 + CloudFront  — or Vercel / Netlify
   │  fetch with JWT (HttpOnly cookie or Authorization header)
   ▼
Express API on EC2 (PM2 + nginx) or a container (ECS Fargate / App Runner)
   │  auth middleware → validation → service → Mongoose
   ▼
MongoDB Atlas (indexes on the main queries)  + Redis cache / queue for slow jobs
```

**SkillKeepr version (public-safe level):**

```text
tenant subdomain (company.app…)
   → CloudFront + S3: the React app (Redux + redux-saga, Mantine)
   → API call with the JWT in an HttpOnly cookie, and the tenant sent as a header
   → API Gateway → Lambda functions (Node.js + TypeScript)
        → check the JWT; the tenant must match the one inside the token
        → Joi validation → service → Mongoose
   → MongoDB: one database per tenant
   → slow work (resume parsing, scoring, reminders) → SQS queues / Step Functions / scheduled jobs
```

You can say this structure confidently, because it's how the platform is built. Say only what you know about the parts you didn't build: [FILL IN: which parts of this flow you personally worked on — e.g. the Stripe renewal job, the JD chatbot backend, the ATS sync].

**Extra details that impress (pick one or two):**
- `index.html` is `no-cache`, while hashed bundles are cached for a year.
- The tenant is checked against the JWT, so a token from one company can't read another's data.
- A compound index matches the main list query.
- Long jobs avoid API Gateway's timeout by using queues.

## 🎯 Why do we use it?

- **It shows you understand the whole system**, not just your own files. Seniors are expected to.
- **It turns scattered knowledge into one story.** That story is easy to remember and easy to follow.
- **It opens good follow-ups** on topics you know well, like caching, auth, indexes and queues.

## ⚠️ Common mistakes

- **Jumping straight to React or Express** and skipping DNS, HTTPS and the CDN.
- **Listing tools without the flow** ("we use AWS, Mongo, React…"). Tell it as a journey.
- **Claiming parts you didn't build.** Interviewers dig, so say "another team owned that, but the idea is…".
- **Going too deep on one step.** Keep each step to one or two sentences, and let them ask for more.

## 🗣️ How to answer in an interview

> "When a user opens our app, DNS points the company's subdomain to CloudFront. Over HTTPS, CloudFront serves index.html and the hashed React bundles from S3. index.html isn't cached long, while the bundles are cached for a year. React starts, the router picks the screen, and the page calls our API. The browser sends the JWT automatically in an HttpOnly cookie, along with the tenant.
>
> The request goes through API Gateway to a Lambda function in Node and TypeScript. It verifies the JWT and checks that the tenant matches the token, validates the input with Joi, and queries MongoDB, where each company has its own database. The JSON comes back and React re-renders. For slow work like resume parsing or reminders, we put jobs on queues or scheduled workflows, so the API answers fast. On a deploy, CI builds new hashed files and refreshes CloudFront, so users get the new version on their next load."

## 🔁 Follow-up questions

### Where can this flow get slow, and how would you find out?

DNS and TLS on first visit, large JS bundles, cold starts, slow queries or slow third-party APIs. Measure with the browser Network tab and Lighthouse on the frontend, and with logs and timings (CloudWatch) on the backend. See [One API endpoint is slow](topic:debugging/slow-endpoint).

### What if the API is down but the CDN is up?

The app shell still loads, because it's static files. API calls fail, so the UI should show a friendly error and retry, not a blank screen.

### How is a user from company A kept away from company B's data?

The tenant comes with the request and must match the tenant inside the verified token. Each query then runs against only that tenant's data. At SkillKeepr, each tenant has its own database.

### What changes if this were a Next.js app?

Some pages would be rendered on the server per request or at build time. So the first response already contains HTML with data, and a Node server or serverless functions must run the rendering. See [Rendering types](topic:nextjs/rendering-types).

## ✅ Quick check

### 1. Put these in order: React renders, DNS lookup, API call, index.html download.

:::answer
**DNS lookup → index.html download → React renders → API call.** (Then the response triggers a re-render.)
:::

### 2. In a cookie-based app, who adds the JWT to API requests?

:::answer
**The browser.** It sends the HttpOnly cookie automatically when the request includes credentials. JavaScript can't even read that cookie.
:::

### 3. Why mention queues in this story?

:::answer
Because slow work (parsing, emails, AI calls) shouldn't keep the user waiting or hit API time limits. The API queues the job and answers fast. A worker finishes it in the background.
:::
