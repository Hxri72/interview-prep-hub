---
title: "SSR: Next.js in front of, or instead of, Express"
stack: mern-architectures
order: 7
level: Intermediate
mustKnow: true
askedFrequency: very common
template: pattern
section: Frontend and rendering
summary:
  - "SSR (server-side rendering) means the server builds the HTML for each page, so the user sees content before the JavaScript loads."
  - "With Next.js you have two shapes: Next.js as the frontend in front of a separate Express API, or Next.js as the whole app (it replaces Express)."
  - "Shape 1 (Next.js + Express) keeps one API for web, mobile and other clients. Shape 2 (Next.js only) has fewer moving parts."
  - "Pick SSR when SEO and the first page load matter: shops, blogs, job boards, landing pages. A logged-in dashboard rarely needs it."
  - "Next.js 16 uses the App Router: Server Components fetch data on the server by default."
cards:
  - q: What is SSR?
    a: The server builds the page's HTML for each request and sends it ready to show. The browser then adds interactivity (hydration).
  - q: What are the two ways to use Next.js in a MERN-style app?
    a: "1) Next.js as the frontend that calls a separate Express API. 2) Next.js as the full stack, talking to MongoDB directly, with no Express."
  - q: When should you keep a separate Express API next to Next.js?
    a: When other clients (a mobile app, partners, background jobs) need the same API, or when a separate backend team owns it.
  - q: Why is SSR good for SEO?
    a: Search engine bots get full HTML with the content in it, instead of an empty div that needs JavaScript to fill.
---

## 💡 What is it?

In a plain React app, the browser gets an almost empty page. Then JavaScript builds the page. This is called [CSR](glossary:csr).

With [SSR](glossary:ssr), the **server** builds the full HTML first. The user sees the content straight away.

Next.js is a React [framework](glossary:framework) that does SSR. In a MERN app, you can put Next.js **in front of** Express. Or you can use Next.js **instead of** Express.

## 🏠 Real-life example

Think of buying a **cake**.

- **CSR** = you get a box of flour, eggs and a recipe. You bake it at home before you can eat. (The browser builds the page.)
- **SSR** = the bakery gives you a ready cake. You can eat at once. (The server sends ready HTML.)
- **Next.js + Express** = the bakery shop (Next.js) gets its cream and sponge from a separate factory (Express API). Other shops can buy from that factory too.
- **Next.js only** = a small bakery that makes everything in its own kitchen. No factory needed.

## 🗺️ The diagram

```text
Shape 1: Next.js IN FRONT OF Express

  Browser ──request /jobs──▶ Next.js server ──fetch /api/jobs──▶ Express API ──▶ MongoDB
     ▲                         (builds HTML)                        (JSON)
     └──────── ready HTML ─────────┘
  Mobile app ───────────────────────────────fetch /api/jobs──▶ Express API   (same API reused)


Shape 2: Next.js INSTEAD OF Express

  Browser ──request /jobs──▶ Next.js server ──Mongoose──▶ MongoDB
     ▲                         (Server Component reads the DB,
     └──── ready HTML ─────────  builds HTML)
```

## 🧑‍💻 Code example

This is **Shape 1**: a Next.js page that calls an Express API on the server.

Set up:

```bash
npx create-next-app@latest jobs-web     # make a Next.js 16 app (choose App Router, TypeScript)
mkdir jobs-api && cd jobs-api && npm init -y && npm install express
```

Save the API as `jobs-api/server.js`. Run it with `node server.js`.

```js
const express = require('express');                         // load Express
const app = express();                                      // create the API app

app.get('/api/jobs', (req, res) => {                        // route: list jobs
  res.json([{ id: 1, title: 'React Developer' }]);          // send a fake list (a real app reads MongoDB)
});                                                         // end of the route

app.listen(4000, () => console.log('API on 4000'));         // 4000 = the API's port
```

Save the page as `jobs-web/app/jobs/page.tsx`. Run `npm run dev` in `jobs-web`, then open http://localhost:3000/jobs.

```tsx
type Job = { id: number; title: string };                    // the shape of one job

export default async function JobsPage() {                   // a Server Component: it runs on the server
  const res = await fetch('http://localhost:4000/api/jobs', { cache: 'no-store' }); // call Express; no-store = fresh data every request (SSR)
  const jobs: Job[] = await res.json();                      // read the JSON body
  return (                                                   // return the HTML for the page
    <ul>                                                     {/* a list */}
      {jobs.map((j) => <li key={j.id}>{j.title}</li>)}       {/* one item per job; key = unique id */}
    </ul>                                                    // end of list
  );                                                         // end of return
}                                                            // end of JobsPage
```

Open "View page source" in the browser. You'll see `React Developer` inside the HTML. In a plain React SPA, the source would be almost empty.

```text
<ul><li>React Developer</li></ul>
```

## 🔍 Deeper version

**Rendering words, in plain terms:**

| Word | Who builds the HTML | When |
|---|---|---|
| CSR | the browser | after JS downloads |
| SSR | the server | on every request |
| SSG (static generation) | the build step | once, at build time |
| ISR (incremental static regeneration) | the server | at build time, then refreshed every N seconds |

See [rendering types](topic:nextjs/rendering-types) for details.

**Hydration.** After SSR, the browser downloads the JavaScript. React then attaches click handlers to the HTML it already has. This step is called hydration. See [hydration](topic:nextjs/hydration).

**Shape 1: Next.js + Express.**
- Next.js does pages and rendering. Express owns business logic and the database.
- Server Components call Express with `fetch`. The call happens server-to-server, so it can use a private network URL.
- Auth: the browser sends its cookie to Next.js. Next.js must **forward** it to Express (or a token). Plan this early.

**Shape 2: Next.js as the full stack.**
- Server Components and [Server Actions](topic:nextjs/server-actions) read and write MongoDB with Mongoose directly.
- [Route handlers](topic:nextjs/route-handlers) (`app/api/.../route.ts`) give you JSON endpoints if you need them.
- Watch out: in development, hot reload can open many Mongoose connections. Cache the connection in a global variable.

:::version[Version note]
Next.js 15 changed `fetch` so it is **not cached by default**. Next.js 16 adds opt-in caching with the `'use cache'` directive. Older tutorials that say "fetch is cached by default" are about Next.js 14. See [data fetching and caching](topic:nextjs/data-fetching-caching).
:::

## ⚖️ Pros and cons

| | Next.js + Express | Next.js only |
|---|---|---|
| Moving parts | two apps to deploy | one app |
| Reuse API for mobile/partners | ✅ easy | ⚠️ need route handlers |
| SEO and fast first paint | ✅ | ✅ |
| Team split (frontend vs backend) | ✅ clear | ⚠️ one codebase |
| Extra network hop | ⚠️ Next → Express | ✅ none |
| Long background jobs, websockets | ✅ Express handles it | ⚠️ awkward on serverless hosts |

## 🎯 When to choose it

- **Public pages that must rank on Google:** a job board, a shop, a blog. Use SSR or SSG.
- **Next.js + Express:** you already have an Express API, or a mobile app uses the same API. A bigger team with a backend group.
- **Next.js only:** a small team building a new product. Mostly CRUD (create, read, update, delete), with no mobile app yet.
- **Not needed:** a dashboard behind a login. Google can't see it anyway, so a [CSR SPA](topic:mern-architectures/csr-spa-api) is simpler.

## ⚠️ Common mistakes

- **Using SSR for everything.** Every request now costs server time. Static pages should use SSG instead.
- **Forgetting to forward cookies.** Next.js calls Express on the server, so the browser's cookie isn't sent automatically. The API then thinks the user is logged out.
- **Putting secrets in client components.** Anything in a `'use client'` file goes to the browser. Keep DB strings and API keys in server code.
- **Hydration mismatch.** Showing `new Date()` or `Math.random()` gives different HTML on the server and the browser. React then warns.

## 🗣️ How to answer in an interview

> "With SSR, the server renders the HTML for each request. The user sees content fast, and search engines can read it. In a MERN setup there are two common shapes with Next.js.
>
> One is Next.js in front of an Express API. Next.js handles rendering, and Server Components fetch from Express. Express stays the single API for web, mobile and jobs.
>
> The other is Next.js as the full stack. Server Components and Server Actions talk to MongoDB directly, with no Express.
>
> I'd choose the first when the API is shared or owned by another team. I'd choose the second for a smaller new product. For a dashboard behind login, I'd keep a plain React SPA. In my current work our apps are React SPAs on S3 and CloudFront, so I haven't run Next.js in production. I've learned the App Router and built practice projects with it."

## 🔁 Follow-up questions

### Does SSR make the whole app faster?

It makes the **first** view faster and better for SEO. But the server works harder on every request. Later page changes are client-side anyway, so they're not faster.

### Can Next.js replace Express completely?

For many apps, yes. Route handlers give you API endpoints, and Server Actions handle form posts. You'd still want a separate service for long jobs, queues or websockets.

### How does auth work when Next.js calls Express?

The browser sends its cookie to Next.js. In the Server Component, read it with `cookies()` from `next/headers`. Then pass it on to Express in the `fetch` headers.

### What is the difference between SSR and SSG?

SSR builds the HTML on **every request**. SSG builds it **once at build time**. SSG is faster and cheaper, but the data can get old.

## ✅ Quick check

### 1. A logged-in admin dashboard doesn't need Google to find it. Do you need SSR?

:::answer
**Usually no.** A CSR SPA is simpler and cheaper. SSR mainly helps SEO and the first paint of public pages.
:::

### 2. Your company has a React Native app and a website. Both need the same jobs data. Which shape fits?

- A) Next.js only, reading MongoDB in Server Components
- B) Next.js in front of a shared Express API

:::answer
**B.** One Express API serves both the mobile app and Next.js, so the business logic lives in one place.
:::

### 3. Where does a Server Component's `fetch` run?

:::answer
**On the server.** So the URL can be a private address, and secrets stay out of the browser.
:::
