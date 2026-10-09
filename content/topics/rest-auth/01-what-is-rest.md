---
title: What an API is and what REST means
stack: rest-auth
order: 1
level: Basic
mustKnow: true
askedFrequency: very common
summary:
  - An API is a set of rules that lets one program ask another program for data or actions.
  - REST is a popular style for web APIs. You work with "resources" (like jobs or candidates) using URLs and HTTP methods.
  - "The URL says WHAT (/jobs/2). The method says WHAT TO DO (GET = read, POST = create, PATCH = change, DELETE = remove)."
  - REST is stateless. Every request carries everything the server needs, like the login token.
  - Responses use HTTP status codes (200, 201, 404…) and usually JSON.
cards:
  - q: What is an API?
    a: A set of rules that lets one program ask another program for data or to do something, like a menu of requests a server accepts.
  - q: What does REST mean?
    a: "REpresentational State Transfer. A style for web APIs: resources live at URLs, and you act on them with HTTP methods like GET, POST, PATCH and DELETE."
  - q: What does "stateless" mean in REST?
    a: The server keeps no memory of earlier requests. Each request must carry everything needed, like the auth token and the data.
  - q: What is a resource in REST?
    a: A "thing" your API manages, like a job or a candidate. Each has a URL, like /jobs or /jobs/2.
  - q: REST vs GraphQL in one line?
    a: REST has many URLs, one per resource, with fixed response shapes. GraphQL has one URL where the client asks for exactly the fields it wants.
---

## 💡 What is it?

An **[API](glossary:api)** (Application Programming Interface) is a set of rules. It lets one program ask another program for data or for an action.

**REST** is the most common style for web APIs. In REST, everything is a **resource**, like a job or a candidate. Each resource has a **URL**. You use **HTTP methods** to work with it: `GET` to read, `POST` to create, `PATCH` to change, `DELETE` to remove.

The answer usually comes back as **JSON**, with a **status code** like `200` (OK) or `404` (not found).

## 🏠 Real-life example

Think of a **school library counter**.

You don't walk into the store room yourself. You go to the counter and ask using fixed rules: "Give me book number 42." "Return this book." The librarian does the work and gives you an answer.

- The **counter and its rules** = the API.
- **Books, members, shelves** = resources.
- The **book number and shelf label** = the URL, like `/books/42`.
- "**Give me**", "**add**", "**change**", "**remove**" = the HTTP methods GET, POST, PATCH, DELETE.
- The librarian's reply ("Here it is" / "No such book") = the status code and the response.
- You show your **library card every time** = stateless: each request carries your identity.

## 🧑‍💻 Code example

A tiny REST API for jobs. Run `npm init -y` and `npm install express`. Save as `api.js` and run `node api.js`. This uses CommonJS (`require`).

```js
const express = require('express');                    // load Express, the web framework
const app = express();                                 // create the app (our server)
app.use(express.json());                               // read JSON bodies into req.body

const jobs = [                                         // fake data instead of a database
  { id: 1, title: 'Node.js Developer' },               // job 1
  { id: 2, title: 'React Developer' },                 // job 2
];                                                     // end of the list

app.get('/jobs', (req, res) => {                       // GET /jobs → read the whole list
  res.json(jobs);                                      // send the list as JSON (status 200)
});                                                    // end of route

app.get('/jobs/:id', (req, res) => {                   // GET /jobs/2 → read one job; :id is a placeholder
  const job = jobs.find((j) => j.id === Number(req.params.id)); // find the job; '2' → 2
  if (!job) return res.status(404).json({ error: 'Job not found' }); // 404 = "no such thing"
  res.json(job);                                       // send the one job
});                                                    // end of route

app.post('/jobs', (req, res) => {                      // POST /jobs → create a new job
  const job = { id: jobs.length + 1, title: req.body.title }; // build it from the body
  jobs.push(job);                                      // save it in our list
  res.status(201).json(job);                           // 201 = "created", send the new job back
});                                                    // end of route

app.listen(3000, () => console.log('API on http://localhost:3000')); // start listening on port 3000
```

Try it from a second terminal with `curl` (a command-line tool that sends HTTP requests):

```text
$ curl localhost:3000/jobs
[{"id":1,"title":"Node.js Developer"},{"id":2,"title":"React Developer"}]

$ curl localhost:3000/jobs/2
{"id":2,"title":"React Developer"}

$ curl -i localhost:3000/jobs/9
HTTP/1.1 404 Not Found
{"error":"Job not found"}

$ curl -X POST localhost:3000/jobs -H 'Content-Type: application/json' -d '{"title":"MongoDB Expert"}'
{"id":3,"title":"MongoDB Expert"}
```

**What to notice:** the URL names the thing (`/jobs/2`). The method says what to do. The status code tells the result.

## 🔍 Deeper version

**REST rules (constraints).** Roy Fielding described REST in 2000. The main ideas:

| Rule | Simple meaning |
|---|---|
| Client–server | The frontend and backend are separate. They only talk through the API. |
| Stateless | The server keeps no session memory between requests. Each request carries its token and data. |
| Cacheable | Responses say if they can be cached (saved and reused), using headers like `Cache-Control`. |
| Uniform interface | Same patterns everywhere: resources at URLs, standard methods, standard status codes. |
| Layered system | There can be proxies, load balancers or CDNs in between. The client doesn't need to know. |

**"RESTful" in real life.** Most "REST APIs" follow the main ideas, not every rule. One rule teams often skip is **HATEOAS**: putting links to the next actions inside each response. That's fine. Interviewers mostly want: clear resource URLs, correct methods, correct status codes, JSON, and statelessness.

**Stateless does not mean "no login".** The user is still logged in. But the proof (a [JWT](topic:rest-auth/jwt) in a header or an HttpOnly [cookie](glossary:cookie)) is sent with **every** request. Any server can handle any request. That makes it easy to run many servers behind a load balancer.

**REST vs other API styles:**

| Style | When it fits |
|---|---|
| REST | Most CRUD apps and public APIs. Simple, cacheable, every tool supports it. |
| GraphQL | Many different screens need different fields from the same data. One flexible URL. |
| gRPC | Fast service-to-service calls with strict contracts (binary, HTTP/2). |
| WebSockets | Live two-way updates, like chat or a live code editor. See [WebSockets](topic:rest-auth/websockets). |

## 🎯 Why do we use it?

- **Frontend and backend can grow separately.** The React app only needs to know the URLs and the JSON shape.
- **Everyone already knows it.** Browsers, mobile apps, Postman, curl and other companies' systems all speak HTTP.
- **Easy to scale.** Because it's stateless, you can add more servers.
- **Easy to document and test.** Tools like [Swagger / OpenAPI](topic:rest-auth/swagger-openapi) describe every endpoint.

## ⚠️ Common mistakes

- **Verbs in URLs**, like `/getJobs` or `/deleteJob/5`. Use nouns (`/jobs/5`) and let the method be the verb.
- **Always returning 200**, even for errors, with `{ success: false }`. Use real [status codes](topic:rest-auth/status-codes).
- **Keeping user state in server memory** (like "current page" in a variable). It breaks with more than one server.
- **Using GET to change data.** GET must only read. Browsers and caches may repeat it.

## 🗣️ How to answer in an interview

> "An API is a contract that lets one program request data or actions from another. REST is a style for web APIs where everything is a resource with its own URL, like /jobs or /jobs/42, and you act on it with HTTP methods: GET to read, POST to create, PUT or PATCH to update, and DELETE to remove. Results come back with standard status codes and usually JSON.
>
> REST is stateless: the server doesn't remember earlier requests, so each request carries its own auth, like a JWT in a header or an HttpOnly cookie. That's what makes it easy to scale across many servers or serverless functions.
>
> In my backend work I follow these rules: nouns in URLs, correct methods and status codes, one consistent JSON response format, and documentation with Swagger."

## 🔁 Follow-up questions

### What is the difference between an API and an endpoint?

The API is the whole set of rules and operations. An endpoint is one specific URL + method in it, like `GET /jobs/:id`.

### Is REST the same as HTTP?

No. HTTP is the protocol, the language of the web. REST is a **style** of designing APIs on top of HTTP. You can use HTTP in a non-REST way, for example with only POST requests to `/doSomething`.

### What is HATEOAS?

"Hypermedia As The Engine Of Application State." Each response includes links to related actions, like `"links": { "apply": "/jobs/2/applications" }`. It's part of strict REST, but most real APIs skip it.

### When would you choose GraphQL over REST?

When many screens need different shapes of the same data, and REST would need many endpoints or return too much data. For simple CRUD, REST is easier to build, cache and secure.

### What does "idempotent" mean?

Doing the same request many times has the same effect as doing it once. GET, PUT and DELETE are idempotent; POST is not. See [Idempotency](topic:rest-auth/idempotency-safe-methods).

## ✅ Quick check

### 1. Which URL design is RESTful for "delete candidate 7"?

- A) `POST /deleteCandidate?id=7`
- B) `DELETE /candidates/7`
- C) `GET /candidates/7/delete`

:::answer
**B.** The URL names the resource (`/candidates/7`). The method (`DELETE`) says the action.
:::

### 2. True or false: "stateless" means the user can't stay logged in.

:::answer
**False.** The user stays logged in, but every request carries proof of who they are, like a JWT or a session cookie. The server doesn't keep per-request memory.
:::

### 3. A new job was created successfully. Which status code fits best?

:::answer
**201 Created.** 200 also "works", but 201 tells the client a new resource now exists.
:::
