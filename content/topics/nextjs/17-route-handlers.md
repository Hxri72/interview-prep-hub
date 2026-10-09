---
title: "Route Handlers (route.ts APIs)"
stack: nextjs
order: 17
level: Intermediate
mustKnow: false
askedFrequency: common
summary:
  - A Route Handler is a backend API endpoint inside a Next.js project. You write it in a file called route.ts.
  - The folder path becomes the URL. app/api/jobs/route.ts answers at /api/jobs.
  - "You export one function per HTTP method: GET, POST, PUT, PATCH, DELETE."
  - Use Route Handlers when someone OUTSIDE your app calls you (mobile app, Stripe webhook). Use Server Actions for your own forms.
  - "For webhooks, read the body with request.text() so the signature check sees the exact raw bytes."
cards:
  - q: What is a Route Handler in Next.js?
    a: A file named route.ts inside the app folder that exports functions like GET and POST. It works as a backend API endpoint at that folder's URL.
  - q: Where does app/api/jobs/route.ts answer?
    a: At /api/jobs. The folders become the URL path.
  - q: Route Handler or Server Action — which one for a Stripe webhook?
    a: A Route Handler. Stripe is an outside caller that sends a normal HTTP POST. Server Actions are only for forms and buttons inside your own app.
  - q: Why use request.text() in a webhook route?
    a: The signature is calculated on the exact raw bytes. request.json() turns the body into an object, and you can no longer check the signature.
  - q: Can a page.tsx and a route.ts live in the same folder?
    a: No. A folder can be a page or an API endpoint, not both. Next.js shows a conflict error.
---

## 💡 What is it?

A **Route Handler** is a small backend [API](glossary:api) inside your Next.js project.

You create a file called `route.ts` inside the `app` folder. Inside it, you export a function for each HTTP method, like `GET` or `POST`.

The folder path becomes the URL. So `app/api/jobs/route.ts` answers requests at `/api/jobs`.

## 🏠 Real-life example

Think of a **school with a front gate and a side window**.

Students walk in through the front gate and go to their classroom. That is a normal **page**.

But delivery people don't go to classrooms. They come to the **side window**. They hand over a parcel, and the office gives back a receipt.

- The **side window** = a Route Handler (`route.ts`).
- The **delivery person** = an outside caller, like a mobile app or Stripe.
- **"I'm here to deliver" vs "I'm here to collect"** = the HTTP method (`POST` vs `GET`).
- The **receipt** = the response you send back (JSON and a status code).
- The **front gate and classrooms** = normal pages (`page.tsx`).

## 🧑‍💻 Code example

Create a project with `npx create-next-app@latest my-app` (choose TypeScript and the App Router). Add this file. Then run `npm run dev`.

**`app/api/jobs/route.ts`**

```ts
import { NextResponse } from 'next/server';                    // a helper to build JSON responses

const jobs = [{ id: 1, title: 'Node.js Developer' }];          // fake "database": a list kept in memory

export async function GET() {                                   // runs for GET /api/jobs
  return NextResponse.json(jobs);                               // send the list back as JSON (status 200)
}                                                               // end of GET

export async function POST(request: Request) {                 // runs for POST /api/jobs; request = the incoming call
  const body = await request.json();                            // read the JSON body, e.g. { "title": "React Developer" }
  const job = { id: jobs.length + 1, title: body.title };       // make a new job; id = next number
  jobs.push(job);                                               // save it in our fake list
  return NextResponse.json(job, { status: 201 });               // 201 = "Created"; send the new job back
}                                                               // end of POST
```

Test it with curl in another terminal:

```text
$ curl http://localhost:3000/api/jobs
[{"id":1,"title":"Node.js Developer"}]

$ curl -X POST http://localhost:3000/api/jobs -H "content-type: application/json" -d '{"title":"React Developer"}'
{"id":2,"title":"React Developer"}          ← status 201
```

(These are the real outputs from a Next.js 16 test app.)

## 🔍 Deeper version

**The rules of route files:**
- The file must be named `route.ts` (or `route.js`).
- You export named functions: `GET`, `POST`, `PUT`, `PATCH`, `DELETE`, `HEAD`, `OPTIONS`.
- If someone calls a method you didn't export, Next.js answers **405 Method Not Allowed**.
- A folder can have a `page.tsx` **or** a `route.ts`, not both.

**Standard Web objects.** The function gets a normal Web `Request`. You return a normal Web `Response`. `NextResponse` adds small helpers, like `NextResponse.json()` and cookie helpers. `Response.json(data)` also works.

**Dynamic segments** work like pages. In `app/api/jobs/[id]/route.ts`, the second argument has the params:

```ts
export async function GET(                                       // runs for GET /api/jobs/123
  request: Request,                                              // the incoming request (not used here)
  { params }: { params: Promise<{ id: string }> },               // the URL params; a Promise in recent versions
) {
  const { id } = await params;                                   // id = "123" (always a string)
  return Response.json({ id });                                  // send it back
}                                                                // end of GET
```

**Webhooks need the raw body.** Stripe signs the **exact bytes** it sends. If you call `request.json()`, you get an object, and the original bytes are gone. So for webhooks, read the body as text first:

```ts
export async function POST(request: Request) {                  // Stripe calls this URL
  const raw = await request.text();                              // the exact raw body, byte for byte
  const sig = request.headers.get('stripe-signature');           // Stripe's signature header
  // stripe.webhooks.constructEvent(raw, sig, secret) checks it  // verify BEFORE trusting the event
  return Response.json({ received: true });                     // reply 200 quickly
}                                                                // end of POST
```

In Express you need `express.raw()` for this. In Next.js, `request.text()` already gives you the raw body. See [webhook signatures](topic:rest-auth/webhook-signatures).

**Caching.** Since Next.js 15, `GET` handlers are **dynamic by default**. They run on every request. (In Next.js 14 they were cached by default, which surprised many people.)

:::version[Version note]
In the old **Pages Router**, APIs lived in `pages/api/*.ts` with `(req, res)` functions, like Express. In the **App Router**, you use `app/**/route.ts` with Web `Request` and `Response`. Learn the App Router style.
:::

**Route Handler vs Server Action:**

| | Route Handler (`route.ts`) | Server Action (`'use server'`) |
|---|---|---|
| Who calls it | Anyone: mobile apps, other servers, webhooks | Only your own forms and buttons |
| URL | A real, public URL | A hidden internal endpoint |
| Best for | Public APIs, webhooks, file downloads | Create/update/delete from your own UI |

See [Server Actions](topic:nextjs/server-actions).

## 🎯 Why do we use it?

- **One project for frontend and a small backend.** You don't need a separate Express app for simple APIs.
- **Outside callers need a real URL.** Stripe [webhooks](glossary:webhook), mobile apps and partner systems can't call a Server Action.
- **Secrets stay on the server.** Code in `route.ts` never goes to the browser, so it can use database passwords and API keys.

For a big backend, many teams still keep a separate Node/Express service. Route Handlers are great for small or medium APIs.

## ⚠️ Common mistakes

- **Using `request.json()` in a webhook.** The signature check then fails. Use `request.text()`.
- **Putting `page.tsx` and `route.ts` in the same folder.** Next.js reports a conflict.
- **Calling your own Route Handler from a Server Component** with `fetch('/api/...')`. That's an extra network hop. In a Server Component, call the database or function directly.
- **Forgetting auth checks.** A Route Handler is a public URL. Check the user's session inside it, every time.

## 🗣️ How to answer in an interview

> "A Route Handler is a backend endpoint inside a Next.js App Router project. I create a `route.ts` file, and the folder path becomes the URL, so `app/api/jobs/route.ts` is `/api/jobs`. I export one function per HTTP method, like GET and POST. Each gets a standard Web Request and returns a Response.
>
> I'd use a Route Handler when something outside the app calls it, like a mobile app or a Stripe webhook. For forms inside my own app, a Server Action is simpler. For webhooks, I'd read the body with `request.text()`, because the signature is checked against the raw bytes.
>
> I haven't used Next.js in production yet. My production APIs are Node.js services. But the ideas are the same: status codes, validation, and auth on every endpoint."

[FILL IN: once you've built the practice project, add one line about the Route Handler you wrote.]

## 🔁 Follow-up questions

### When would you still use a separate Express or Node backend?

When the backend is big, has its own team, or runs long jobs, queues and WebSockets. Then a separate service is easier to scale and deploy. Route Handlers suit small or medium APIs inside the same app.

### What happens if I call a method that isn't exported?

Next.js answers with **405 Method Not Allowed**. Only exported methods are handled.

### How do you read query strings in a Route Handler?

Use the URL: `new URL(request.url).searchParams.get('page')`. If you type the request as `NextRequest`, you can use `request.nextUrl.searchParams`.

### Are Route Handlers cached?

Not by default since Next.js 15. GET handlers run on every request. You can opt in to caching if the data rarely changes. See [data fetching and caching](topic:nextjs/data-fetching-caching).

## ✅ Quick check

### 1. Which file makes `/api/candidates/42` work, where 42 can be any id?

- A) `app/api/candidates/42/route.ts`
- B) `app/api/candidates/[id]/route.ts`
- C) `pages/api/candidates.ts`

:::answer
**B.** `[id]` is a dynamic segment. It matches any value, and you read it from `params`. A would only match 42. C is the old Pages Router style.
:::

### 2. A Stripe webhook keeps failing signature checks. The code starts with `const event = await request.json();`. What's wrong?

:::answer
`request.json()` throws away the exact raw bytes that Stripe signed. Read the body with `request.text()` and pass that raw string to `stripe.webhooks.constructEvent`.
:::

### 3. True or false: a Server Action is the right choice for an API your mobile app calls.

:::answer
**False.** A mobile app needs a real, public URL. Use a Route Handler. Server Actions are for forms and buttons inside your own Next.js app.
:::
