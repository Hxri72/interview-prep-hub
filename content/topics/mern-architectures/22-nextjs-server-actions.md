---
title: Next.js Server Actions and route handlers as the API
stack: mern-architectures
order: 22
level: Basic
mustKnow: false
askedFrequency: common
template: pattern
section: How frontend talks to backend
summary:
  - "In a Next.js app, you may not need a separate Express server. Next.js itself can be the backend."
  - "Route handlers (route.ts files) are API endpoints, like Express routes. Anyone can call them with fetch."
  - "Server Actions are server functions that a form or button can call directly. Next.js makes the network request for you."
  - "MongoDB is still used through Mongoose, but the code runs inside Next.js on the server."
  - "Keep Express when mobile apps or other services need the API, or when you need long-running jobs or WebSockets."
cards:
  - q: What is a route handler in Next.js?
    a: A route.ts file in the app folder that exports functions like GET and POST. It works like an Express route.
  - q: What is a Server Action?
    a: An async function marked 'use server' that runs on the server. Forms and buttons can call it without you writing a fetch.
  - q: Do Server Actions need auth checks?
    a: Yes. Each action is a public endpoint behind the scenes, so check the user and validate input inside every action.
  - q: When should you keep a separate Express API with Next.js?
    a: When other clients (mobile, partners) need the API, or when you need WebSockets, long jobs or a separately scaled backend.
---

## 💡 What is it?

In classic MERN, React and Express are two separate apps. In **Next.js**, the frontend and backend can live in **one app**.

Next.js gives you two ways to write backend code:
- **Route handlers**: API endpoints in `route.ts` files.
- **Server Actions**: server functions that a form can call directly.

So the "E" (Express) may disappear. MongoDB and Mongoose stay.

## 🏠 Real-life example

Think of a small family restaurant.

- **Classic MERN** = the dining hall and the kitchen are two buildings. A waiter (fetch) carries every order across the road (the API).
- **Next.js with Server Actions** = the kitchen is inside the dining hall. You hand your order slip straight through a window. You don't see a waiter, but someone still carries it.
- **Route handlers** = a takeaway counter on the street. Outsiders (mobile apps, other services) can order there too.

## 🗺️ The diagram

```text
CLASSIC MERN                              NEXT.JS AS THE BACKEND
┌────────────┐   fetch /api/todos   ┌──────────┐      ┌──────────────── Next.js app ───────────────┐
│ React (SPA)│ ───────────────────► │ Express  │      │ page.tsx (Server Component) ── reads DB    │
└────────────┘                      └────┬─────┘      │ <form action={addTodo}> ── Server Action   │
                                         │            │ app/api/todos/route.ts ── GET / POST       │
                                         ▼            └───────────────────┬────────────────────────┘
                                      MongoDB                             ▼
                                                                       MongoDB (Mongoose)
```

## 🧑‍💻 Code example

A to-do list where Next.js is the whole backend. Set up:

```bash
npx create-next-app@latest todo-app --ts --app
cd todo-app
npm install mongoose
```

Put your MongoDB connection string in `.env.local` as `MONGODB_URI=...`. Run `npm run dev` and open http://localhost:3000.

`lib/db.ts` connects once and reuses the connection:

```ts
import mongoose from 'mongoose';                                    // the MongoDB library

const TodoSchema = new mongoose.Schema({ text: String });           // one field: the to-do text
export const Todo = mongoose.models.Todo || mongoose.model('Todo', TodoSchema); // reuse the model if it exists

export async function connectDB() {                                 // call before every query
  if (mongoose.connection.readyState === 1) return;                 // 1 = already connected, skip
  await mongoose.connect(process.env.MONGODB_URI!);                 // connect using the env variable
}                                                                   // end of connectDB
```

`app/actions.ts` holds the Server Action:

```ts
'use server';                                                       // everything here runs only on the server

import { revalidatePath } from 'next/cache';                        // tells Next.js to refresh a page's data
import { connectDB, Todo } from '@/lib/db';                         // our DB helpers

export async function addTodo(formData: FormData) {                 // a form will call this
  const text = String(formData.get('text') ?? '').trim();           // read the "text" input; '' if missing
  if (!text) return;                                                // ignore empty input (always validate)
  await connectDB();                                                // make sure we are connected
  await Todo.create({ text });                                      // save the new to-do in MongoDB
  revalidatePath('/');                                              // '/' = re-render the home page with new data
}                                                                   // end of addTodo
```

`app/page.tsx` reads the data and shows the form:

```tsx
import { connectDB, Todo } from '@/lib/db';                         // DB helpers (server-only code)
import { addTodo } from './actions';                                // the Server Action

export default async function Home() {                              // a Server Component can be async
  await connectDB();                                                // connect on the server
  const todos = await Todo.find().lean();                           // read all to-dos; lean() = plain objects
  return (                                                          // the page UI
    <main>                                                          {/* page wrapper */}
      <form action={addTodo}>                                       {/* submitting calls the Server Action */}
        <input name="text" placeholder="New to-do" />               {/* name="text" = the key in formData */}
        <button type="submit">Add</button>                          {/* submit button */}
      </form>                                                       {/* end of form */}
      <ul>{todos.map((t) => <li key={String(t._id)}>{t.text}</li>)}</ul> {/* list every to-do */}
    </main>                                                         {/* end of page wrapper */}
  );                                                                // end of the UI
}                                                                   // end of Home
```

And `app/api/todos/route.ts`, a route handler for other clients:

```ts
import { connectDB, Todo } from '@/lib/db';                         // DB helpers

export async function GET() {                                       // handles GET /api/todos
  await connectDB();                                                // connect first
  const todos = await Todo.find().lean();                           // read all to-dos
  return Response.json(todos);                                      // send JSON, like res.json() in Express
}                                                                   // end of GET
```

Notice: there is no Express and no `fetch` in the page. The page reads MongoDB directly on the server.

## 🔍 Deeper version

The basics are in [Server Actions](topic:nextjs/server-actions) and [Route Handlers](topic:nextjs/route-handlers). Here is how they change the MERN shape.

**Three ways data moves:**

| Need | Use |
|---|---|
| Show data on a page | A Server Component reads the database directly |
| A form or button changes data | A Server Action |
| Mobile apps, webhooks, other services | A route handler (`route.ts`) |

**Server Actions are still HTTP.** Next.js turns each action into a POST endpoint with a hidden id. So anyone can call it. Treat it like a public API route:
- check the logged-in user,
- validate input (for example with Zod or Joi),
- never trust ids from the form without checking ownership.

**Connection reuse.** In development, hot reload can create many Mongoose connections. The `readyState` check above helps. On serverless hosts, the connection is reused while the function stays "warm".

**Where Express still wins:**
- **WebSockets** and long-lived connections.
- **Long jobs** (big CSV imports). Use a queue and a worker instead.
- **Many clients** that share one API, and a backend that scales on its own.

A common hybrid: Next.js for the UI and simple data, and an Express (or NestJS) API for the heavy backend. Next.js then calls that API from the server. See [SSR with Next.js](topic:mern-architectures/ssr-nextjs).

## ⚖️ Pros and cons

| Pros | Cons |
|---|---|
| One app, one deploy, one language | Backend is tied to the frontend's deploys |
| No fetch code or API layer for your own forms | Server Actions are only easy to call from your Next.js app |
| End-to-end TypeScript types | WebSockets and long jobs don't fit well |
| Data loads on the server, so pages are fast | Easy to forget auth checks inside actions |

## 🎯 When to choose it

- **A small product or MVP** built by one person or a small team: Next.js alone is enough.
- **An admin panel or content site** where only your own web app uses the data.
- **Keep a separate Express API** when a mobile app, partners or other services need the same API.
- **Keep Express** for chat, video, or heavy background work.

## ⚠️ Common mistakes

- **No auth check inside a Server Action.** Hiding the button is not security.
- **Connecting to MongoDB inside a Client Component.** Database code must stay on the server.
- **Forgetting `revalidatePath`** after a change, so the page shows old data.
- **Putting long work (like sending 1,000 emails) in an action.** Push it to a queue instead.

## 🗣️ How to answer in an interview

> "In Next.js, the app can be its own backend. Server Components read data directly on the server. Server Actions handle form submissions without a hand-written fetch. And route handlers in `route.ts` expose normal API endpoints for other clients.
>
> So for a small product I might not need Express at all. Mongoose runs inside Next.js on the server.
>
> I'd keep a separate Express API when a mobile app or other services need it, or when I need WebSockets or long background jobs.
>
> I should be honest: I haven't used Next.js in production. My production backend work is Node and TypeScript APIs on AWS Lambda. But I've learned the App Router model and understand these trade-offs."

## 🔁 Follow-up questions

### Server Action vs route handler: which one should a form use?

Use a Server Action for forms inside your own Next.js app. It needs less code and gets typed arguments. Use a route handler when something outside your app must call it.

### Is a Server Action secure because it runs on the server?

No. Running on the server keeps your secrets hidden. But anyone can still call the action, so check the user and validate the input every time.

### Can Next.js and Express run together?

Yes. Next.js can call an Express API from Server Components or route handlers. Or you can run Next.js as a custom server inside Express, but that loses some Next.js features, so it is less common.

## ✅ Quick check

### 1. A mobile app needs to read the to-do list. Which Next.js feature do you use?

:::answer
A **route handler** (`app/api/todos/route.ts`). Server Actions are meant for your own Next.js forms.
:::

### 2. What does `'use server'` at the top of a file mean?

:::answer
Every exported function in that file is a **Server Action**. It runs only on the server, and the client can call it.
:::

### 3. True or false: you can skip input validation in a Server Action because only your form calls it.

:::answer
**False.** Anyone can send a POST to the action's endpoint. Always validate and check auth.
:::
