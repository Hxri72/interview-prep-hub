---
title: What Next.js is and why it exists
stack: nextjs
order: 1
level: Basic
mustKnow: true
askedFrequency: very common
summary:
  - Next.js is a framework built on top of React. React only builds the UI; Next.js adds the rest a real website needs.
  - "It adds routing from folders, rendering on the server, backend code (API routes) in the same project, and image/font tools."
  - Pages can be made on the server, so the first load is fast and Google can read the content (good SEO).
  - New projects use the App Router (the app/ folder). Next.js 16 is the current major version.
  - "Honest interview line: I haven't used Next.js in production yet; my production work is React + Node.js."
cards:
  - q: What is Next.js, in one sentence?
    a: A React framework that adds file-based routing, server rendering, backend routes and performance tools on top of React.
  - q: What does React NOT give you that Next.js does?
    a: Routing, server rendering, a place for backend code, and image/font optimisation. With plain React you add libraries or a separate server for these.
  - q: Why is server rendering good for SEO?
    a: The server sends HTML that already contains the content. Search engines and users see it at once, instead of an empty page that fills in after JavaScript loads.
  - q: Which router should a new Next.js project use?
    a: The App Router (the app/ folder). The older Pages Router (pages/ folder) is still supported, but new features come to the App Router.
  - q: Have you used Next.js?
    a: Answer honestly. Not in production yet. My production work is React with Redux and Node.js. I have learned the App Router fundamentals.
---

## 💡 What is it?

**Next.js** is a [framework](glossary:framework) built on top of **React**.

React is a library for building the screen (the UI). It does not decide how pages, URLs or servers work. Next.js adds those missing parts.

With Next.js, **one project** can hold your web pages **and** a small backend. It is made by a company called Vercel.

## 🏠 Real-life example

Think of building a **school function**.

**React** is like a box of **chairs, tables and decorations**. They are great, but you still need a hall, a plan, food and a sound system.

**Next.js** is like booking a **full event package**. The hall, the seating plan, the kitchen and the speakers come ready. You just bring your decorations.

- The **chairs and decorations** = React components (the UI pieces).
- The **hall map** = routing. Each room (folder) has a name (URL).
- The **kitchen that prepares food before guests arrive** = server rendering. Food is ready when guests walk in.
- The **staff room behind the stage** = API routes. Backend work happens in the same building.
- The **event company** = Next.js. It set everything up for you.

## 🧑‍💻 Code example

Create a new app and see your first page. You need Node.js 20.9 or newer.

```bash
npx create-next-app@latest my-app --yes
cd my-app
npm run dev
```

`--yes` picks the recommended defaults: TypeScript, Tailwind CSS, ESLint, the **App Router** and **Turbopack** (a fast bundler). Open `http://localhost:3000`.

Now replace the home page with your own.

**File: `app/page.tsx`**

```tsx
// app/page.tsx = the page shown at the URL "/" (the home page)
export default function HomePage() {          // the default export is the page component
  const jobs = ['Node.js Developer', 'React Developer']; // a small list of job titles (fake data)
  return (                                    // the HTML this page shows
    <main>                                    {/* main content area */}
      <h1>Open jobs</h1>                       {/* the page heading */}
      <ul>                                    {/* a bullet list */}
        {jobs.map((title) => (                // one <li> for each job title
          <li key={title}>{title}</li>        // key = a unique value so React can track each item
        ))}                                   {/* end of the list items */}
      </ul>                                   {/* end of the list */}
    </main>                                   // end of the main area
  );                                          // end of what the page returns
}                                             // end of HomePage
```

Save the file. The browser updates by itself.

```text
http://localhost:3000

Open jobs
• Node.js Developer
• React Developer
```

**What to notice:** you did not install a router or set up a server. The file `app/page.tsx` **is** the route `/`. And this page ran **on the server**: right-click → "View page source", and you will see the job titles already inside the HTML.

## 🔍 Deeper version

**What Next.js adds on top of React:**

| Need | Plain React (Vite) | Next.js |
|---|---|---|
| Routing | Add a library (React Router) | Built in: **folders become URLs** |
| Where HTML is made | In the browser, after JS loads | On the server, at build time, or in the browser — you choose per page |
| SEO | Weaker: the first HTML is mostly empty | Strong: HTML arrives with content |
| Backend code | A separate Node/Express app | **Route Handlers** and **Server Actions** in the same project |
| Images and fonts | Do it yourself | `next/image`, `next/font` optimise them |
| Bundler setup | Vite config | Turbopack, configured for you |

**Server Components by default.** In the App Router, every component is a [Server Component](topic:nextjs/server-components) unless the file starts with `'use client'`. Server Components run only on the server. They can read a database or use secret keys, and they send **no JavaScript** for themselves to the browser. You add `'use client'` only for parts that need clicks, state or browser APIs. See [Client Components](topic:nextjs/client-components).

**Rendering choices.** Next.js can build a page **once at build time** (static), **on every request** (dynamic), or a mix: a static "shell" with dynamic parts streamed in later. See [rendering types](topic:nextjs/rendering-types).

**Full-stack in one repo.** A `route.ts` file creates an API endpoint, for example `/api/jobs`. A function marked `'use server'` (a [Server Action](topic:nextjs/server-actions)) can be called straight from a form. For a big backend, many teams still keep a separate Express service. Next.js is often the "frontend plus a thin backend".

:::version[Version note]
**Next.js 16** (released October 2025) made **Turbopack** the default bundler and renamed `middleware.ts` to **`proxy.ts`**. It also made `params` and `searchParams` **async only**. New apps from `create-next-app` now turn on **Cache Components** by default, where caching is opt-in with the `"use cache"` directive. Older tutorials (Next.js 12–14) often show the **Pages Router** and sync `params`. Learn the App Router.
:::

## 🎯 Why do we use it?

- **Fast first load.** The server sends ready HTML, so users see content before all the JavaScript loads.
- **SEO.** Search engines read the content directly. This matters for public pages: job listings, blogs, product pages, landing pages.
- **Less setup.** Routing, bundling, TypeScript, image and font optimisation come ready.
- **One project for UI and a small backend.** Good for small teams and for "backend for frontend" APIs.
- **Less JavaScript in the browser**, because Server Components don't ship their code to the user.

## ⚠️ Common mistakes

- **Learning from old tutorials.** Many show the Pages Router (`pages/`, `getServerSideProps`). New projects use the App Router (`app/`).
- **Putting `'use client'` on every file.** Then you lose the main benefit: less JavaScript and server-side data access.
- **Thinking Next.js replaces every backend.** It has API routes, but heavy jobs, queues and big services often stay in Node/Express.
- **Reading `params` without `await`.** In Next.js 16, `params` is a Promise. See [dynamic routes](topic:nextjs/dynamic-routes).

## 🗣️ How to answer in an interview

> "Next.js is a React framework. React gives me components, but Next.js adds what a real website needs: file-based routing, rendering on the server for a fast first load and good SEO, backend code like Route Handlers and Server Actions in the same project, and image and font optimisation.
>
> In the App Router, components are Server Components by default. They run on the server and send less JavaScript to the browser. I add 'use client' only where I need state or clicks.
>
> To be honest, I haven't used Next.js in production yet. My production work is React with Redux on the frontend and Node.js on the backend. I've learned the App Router fundamentals. [FILL IN: once you've built the practice project, add — 'I built a small job board with Server Components and a Server Action'.]"

## 🔁 Follow-up questions

### When would you NOT choose Next.js?

For an app behind a login with no SEO needs, like an internal dashboard, a plain React + Vite single-page app is often simpler. Also when you only need a backend API — then Express or another Node framework fits better.

### Is Next.js a frontend or a backend framework?

Both. It renders React on the server and in the browser, and it can host API endpoints. People call it a **full-stack React framework**.

### What does "framework vs library" mean here?

A library (React) is code **you call**. A framework (Next.js) **calls your code** and decides the structure: where files go, how routes work, how it builds.

### Who makes Next.js and where can it run?

Vercel makes it. It runs best on Vercel, but it also runs on any Node.js server with `npm run build` and `npm start`, or in Docker. See [deployment](topic:nextjs/deployment).

## ✅ Quick check

### 1. Which file creates the home page `/` in the App Router?

- A) `pages/index.tsx`
- B) `app/page.tsx`
- C) `src/App.tsx`

:::answer
**B) `app/page.tsx`.** A is the old Pages Router way. C is a Vite/React convention, not Next.js routing.
:::

### 2. True or false: in the App Router, components run in the browser unless you mark them as server code.

:::answer
**False.** It's the other way round. Components are **Server Components** by default. You add `'use client'` to make a component run in the browser too.
:::

### 3. Name two things Next.js gives you that plain React does not.

:::answer
Any two of: file-based routing, server rendering (SSR/static), API routes / Server Actions, image and font optimisation, a pre-configured bundler (Turbopack).
:::
