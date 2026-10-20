---
title: "Client and server: who runs what"
stack: web-fundamentals
order: 2
level: Basic
mustKnow: true
askedFrequency: very common
summary:
  - The client is the user's browser (or app). The server is a computer you control. The database keeps the data.
  - Anything sent to the browser can be read by the user, so secrets (API keys, passwords, DB links) stay on the server.
  - The browser shows the screen and reacts to clicks. The server checks permissions, runs business rules and talks to the database.
  - Never trust the client. The server must check login, permissions and input again, even if the frontend already did.
  - SPA = the browser builds the page with JavaScript. Server-rendered = the server sends ready HTML.
cards:
  - q: What is the client and what is the server?
    a: The client is the program the user runs, usually the browser. The server is a computer you control that answers the client's requests and talks to the database.
  - q: Why can't you put an API key in your React code?
    a: All React code is downloaded to the user's browser. Anyone can open DevTools and read it. Keys must stay on the server.
  - q: If the frontend already checks a form, why check it again on the server?
    a: A user can skip your frontend and send any request directly, for example with curl. Only the server's checks are guaranteed to run.
  - q: What is the difference between an SPA and a server-rendered page?
    a: In an SPA the server sends a mostly empty HTML page plus JavaScript, and the browser builds the screen. In a server-rendered page the server sends HTML that already contains the content.
  - q: What is a thick client?
    a: A client that does a lot of work itself, like a React SPA that handles routing, state and rendering. A thin client mostly shows what the server sends.
---

## 💡 What is it?

Every web app has at least **three parts**. The **client** is the user's browser. The **server** is a computer you control. The **database** stores the data.

Each part runs **different code** and has **different jobs**. Knowing who does what is the base of web development.

## 🏠 Real-life example

Think of a **bank**.

- The **customer at the counter** = the client (the browser). They can ask for things, but they can't walk into the vault.
- The **bank clerk** = the server. The clerk checks your ID, follows the bank's rules and decides what you're allowed.
- The **vault** = the database. Only staff can open it.
- The **clerk's vault key** = a secret, like an API key. The customer never holds it.
- The **form you fill at the counter** = frontend validation. The clerk still **checks it again**. Customers can make mistakes, or try tricks.

## 🧑‍💻 Code example

This server uses a secret key, but sends only the **result** to the browser. Save as `secret.js`, run `node secret.js`, then in another terminal run `curl http://localhost:4804/api/summary`.

```js
const http = require('node:http');                                  // built-in web server
const OPENAI_KEY = process.env.OPENAI_KEY ?? 'sk-demo-secret';      // the secret lives ONLY on the server

http.createServer((req, res) => {                                   // handle every request
  const usedKey = OPENAI_KEY.length > 0;                            // the server uses the key here (pretend AI call)
  const summary = 'Strong Node.js candidate';                      // pretend this came back from the AI
  res.setHeader('Content-Type', 'application/json');                // reply with JSON
  res.end(JSON.stringify({ summary, usedKey }));                    // send the RESULT, never the key
}).listen(4804, () => console.log('server ready'));                 // 4804 = the port number
```

Real output from `curl`:

```text
{"summary":"Strong Node.js candidate","usedKey":true}
```

The browser gets the answer. The key **never leaves the server**.

## 🔍 Deeper version

**Who runs what:**

| Part | Where it runs | Typical code | Its jobs |
|---|---|---|---|
| **Client** | The user's browser (or mobile app) | HTML, CSS, React, the JS bundle | Draw the screen, handle clicks, call the API, keep UI state |
| **Server** | Your machine in the cloud (EC2, container, or Lambda) | Node.js + Express or Lambda handlers | Log in users, check permissions, run business rules, validate input, call other services, keep secrets |
| **Database** | A database server (e.g. MongoDB) | Queries, indexes | Store and find data safely, keep it consistent |

**Why the client can't be trusted.** Every request the browser sends is just text over HTTP. A user can copy it, change it and resend it with curl or Postman. So:
- **Validation** on the frontend is for a nice user experience. Validation on the server is for **safety**.
- **Permission checks** must happen on the server. Hiding a button in React doesn't stop the request.
- **Prices, roles, tenant IDs** must come from the server's own data, never from the request body.

**Secrets and the bundle.** At build time, tools like Vite put some environment variables **into** the JS files. Anything there is public. Only variables with special prefixes (like `VITE_` or `NEXT_PUBLIC_`) are meant for the client, and they must not be secrets. See [build-time vs run-time variables](topic:web-fundamentals/env-build-vs-runtime).

**Thin vs thick client.**
- **Thin client:** the server builds the HTML; the browser mostly displays it. Old PHP sites and classic server-rendered pages work this way.
- **Thick client:** the browser does a lot — routing, state, rendering. A React SPA is a thick client.

**SPA vs server-rendered page:**

| | SPA (e.g. Vite + React) | Server-rendered (e.g. Next.js SSR) |
|---|---|---|
| First HTML from the server | Almost empty + a `<script>` | Full content |
| Who builds the screen | The browser | The server first, then the browser "hydrates" it |
| SEO and first view | Weaker / slower | Stronger / faster |
| Server work per page | Very little (static files) | More (renders HTML each time, or caches it) |

SkillKeepr's three portals are SPAs (public, high level). The backend is a serverless API on AWS Lambda.

## 🎯 Why do we use it?

Splitting the work keeps the app **safe, fast and scalable**:
- **Safe:** secrets and permission checks stay where users can't change them.
- **Fast:** the browser handles clicks instantly, without asking the server each time.
- **Scalable:** the frontend is just files on a CDN. The server only answers data requests, so it does less work.

## ⚠️ Common mistakes

- **Putting secrets in frontend code or `VITE_` variables.** They end up in the bundle, where anyone can read them.
- **Checking permissions only in the UI.** A hidden "Delete" button doesn't stop someone from calling the delete API.
- **Trusting IDs from the request,** like `role` or `tenantId` in the body. Read them from the verified token or the database.
- **Thinking the database is safe because the frontend can't reach it.** It must still have its own login and network rules.

## 🗣️ How to answer in an interview

> "The client is the browser running my React bundle. It draws the UI, handles user input and calls the API. The server is my Node.js code — for example Express or Lambda functions — and it owns authentication, authorization, validation, business rules and secrets. The database only talks to the server.
>
> The key rule is: never trust the client. Everything in the bundle is public, so API keys stay on the server, and the server checks login, permissions and input on every request, even if the UI already checked.
>
> A React SPA is a thick client: the server sends a mostly empty HTML page and the JS bundle, and the browser builds the screen. With server-side rendering, like Next.js, the server sends ready HTML first."

## 🔁 Follow-up questions

### How would you call OpenAI from a React app safely?

Don't call it from the browser. The React app calls **your** backend endpoint. The backend adds the API key, calls OpenAI, checks the result, and returns only what the user needs. This also lets you add rate limits and logging.

### Is it okay to store a JWT in the browser?

The browser must hold *something* to prove who the user is. The safer option is an HttpOnly cookie, which JavaScript can't read. See [where to store tokens](topic:rest-auth/token-storage).

### Can the client ever talk to the database directly?

Some services allow it, like Firebase, with strict per-user security rules. With MongoDB or PostgreSQL in a normal backend, no: the client goes through your API.

### What is "business logic"?

The rules of your product, like "a recruiter can only see candidates of their own company" or "a plan blocks after a grace period". It belongs on the server, so users can't change it.

## ✅ Quick check

### 1. Where should the check "only admins can delete a job" live?

- A) Only in React (hide the button)
- B) On the server (and optionally also in React)
- C) In the database only

:::answer
**B.** The server must check it on every request. Hiding the button in React is only for a nicer UI.
:::

### 2. You put `VITE_STRIPE_SECRET_KEY` in your `.env` and use it in React. Is it safe?

:::answer
**No.** Vite puts `VITE_` variables into the built JavaScript, so every user can read them. Secret keys must only be used on the server.
:::

### 3. In a React SPA, what does the first HTML response usually contain?

:::answer
Almost nothing visible: a `<div id="root">` and `<script>` tags. The browser downloads the JS bundle, and React builds the screen inside that div.
:::
