---
title: React (Vite) vs Next.js
stack: nextjs
order: 2
level: Basic
mustKnow: true
askedFrequency: very common
summary:
  - "React + Vite builds a single-page app: the browser gets almost empty HTML, then JavaScript draws the page."
  - "Next.js can make the HTML on the server first, so content shows faster and search engines can read it."
  - Vite needs React Router for pages and a separate server for APIs; Next.js has routing and API routes built in.
  - Choose Vite for internal dashboards behind a login; choose Next.js for public pages that need SEO, or when you want UI and a small backend together.
  - "Both use the same React: components, props, state and hooks work the same way."
cards:
  - q: What is the main difference between React + Vite and Next.js?
    a: Vite gives a client-side single-page app (the browser builds the page). Next.js is a framework that can render on the server and adds routing and backend routes.
  - q: Why does a Vite React app have weaker SEO by default?
    a: Its first HTML is nearly empty (just a div with id root). Content appears only after JavaScript runs, so crawlers and slow phones see a blank page first.
  - q: How do you add routing in each?
    a: In Vite, install React Router and declare routes in code. In Next.js, create folders with page.tsx inside the app folder.
  - q: When is plain React + Vite the better choice?
    a: For apps behind a login with no SEO needs, like admin dashboards, or when the backend is already a separate API.
  - q: Do hooks like useState work in Next.js?
    a: Yes, but only in Client Components (files that start with 'use client'). Server Components can't use state or effects.
---

## 💡 What is it?

**React + Vite** and **Next.js** both use React. The difference is **where the page is built** and **what comes built in**.

With **Vite**, the browser downloads JavaScript and builds the page itself. This is a [single-page app](glossary:spa) (SPA).

With **Next.js**, the server can build the page's HTML first. Next.js also gives you routing and backend routes in the same project.

## 🏠 Real-life example

Think of **buying a study table**.

- **Vite (SPA)** = the table arrives **flat-packed** with an instruction sheet. You build it at home. It's cheap to send, but you wait before you can use it.
- **Next.js (server rendering)** = the table arrives **already built**. You use it immediately. Building happened at the shop (the server).

The mapping:
- The **flat-pack box** = the empty HTML + JavaScript bundle that Vite sends.
- **You, building at home** = the browser running JavaScript to draw the page.
- The **shop assembling it first** = the Next.js server making the HTML.
- **Using the table immediately** = the user seeing content on the first load.

Both tables are made from the same wood. That wood is **React**.

## 🧑‍💻 Code example

Let's make the same page in both, then compare what the browser receives first.

**Vite version** — set up with `npm create vite@latest jobs-vite -- --template react-ts`, then `npm install`, then `npm run dev`.

**File: `src/App.tsx`**

```tsx
// src/App.tsx in a Vite project — the browser runs this to draw the page
export default function App() {               // the root component Vite renders into <div id="root">
  return <h1>Open jobs: 2</h1>;               // the content, created by JavaScript in the browser
}                                             // end of App
```

**Next.js version** — set up with `npx create-next-app@latest jobs-next --yes`, then `npm run dev`.

**File: `app/page.tsx`**

```tsx
// app/page.tsx in a Next.js project — runs on the server by default
export default function Page() {              // a Server Component (no 'use client' at the top)
  return <h1>Open jobs: 2</h1>;               // the same content, but turned into HTML on the server
}                                             // end of Page
```

Now open each app and choose **View page source** (Ctrl+U / Cmd+Option+U). This shows the **first HTML** the server sent.

```text
Vite page source (shortened):
  <div id="root"></div>
  <script type="module" src="/src/main.tsx"></script>
  → no "Open jobs" text. JavaScript must run first.

Next.js page source (shortened):
  <h1>Open jobs: 2</h1>
  → the text is already in the HTML.
```

**What to notice:** the screen looks the same. But Google, slow phones and users on a weak network get the Next.js content **straight away**.

## 🔍 Deeper version

| Topic | React + Vite | Next.js (App Router) |
|---|---|---|
| Rendering | CSR — client-side rendering only | Server Components by default; static, dynamic or streamed; CSR for `'use client'` parts |
| First HTML | Almost empty shell | Contains content |
| Routing | React Router (or similar), defined in code | File-based: `app/jobs/page.tsx` → `/jobs` |
| Data fetching | `useEffect`, TanStack Query, Redux thunks/sagas in the browser | `async` Server Components fetch on the server; client libraries still possible |
| Backend | Separate API (Express etc.) | Route Handlers (`route.ts`) and Server Actions in the same project |
| Secrets | Never in the browser bundle | Safe in server code; only `NEXT_PUBLIC_*` env vars reach the browser |
| Deploy | Static files on S3/CloudFront, Netlify, GitHub Pages | Needs a Node server (or Vercel / Docker); can also do a static export |
| Bundler | Vite | Turbopack (default since v16) |

**Hydration.** After Next.js sends HTML, React loads in the browser and "attaches" click handlers to it. This is called [hydration](topic:nextjs/hydration). A Vite SPA has nothing to hydrate. It builds the DOM from scratch.

**Cost of server rendering.** Rendering on the server needs a running server and adds work per request (for dynamic pages). Static Vite files can sit on a cheap CDN. Next.js reduces this with static rendering and caching where data doesn't change.

**Mental model change.** In a Vite app you think "the component loads, then `useEffect` fetches data". In Next.js you often think "the page component is `async` and awaits data on the server". Hooks like `useState` and `useEffect` still exist, but only in Client Components.

:::version[Version note]
Older comparisons mention **Create React App (CRA)**. The React team deprecated CRA in February 2025. Today the usual choices are **Vite** for SPAs, or a framework like **Next.js** or **React Router v7 framework mode** for server rendering.
:::

## 🎯 Why do we use it?

The choice solves **different problems**:

- **Vite SPA** — simple, fast to develop, cheap to host as static files. Great for dashboards behind a login, where SEO doesn't matter and the backend is a separate API.
- **Next.js** — fast first load, SEO, built-in routing and a backend in the same repo. Great for public pages: job boards, marketing sites, blogs, e-commerce.

Knowing both lets you pick the right tool and explain **why**. Interviewers like that more than "Next.js is always better".

## ⚠️ Common mistakes

- **Saying "Next.js is faster" without nuance.** It shows content faster on the first load. A badly built Next.js app can still be slow.
- **Using `useEffect` to fetch data in every Next.js page.** In the App Router, fetch in an `async` Server Component instead.
- **Putting secrets in a Vite app's env vars.** Anything in a Vite bundle (`VITE_*`) is public. Next.js keeps non-`NEXT_PUBLIC_` vars on the server.
- **Assuming a Next.js app can be dropped onto S3 like a Vite build.** Server features need a Node runtime, unless you use a static export.

## 🗣️ How to answer in an interview

> "Both use the same React. The difference is where the page is built and what's built in.
>
> A React app with Vite is a single-page app. The browser gets an almost empty HTML file, downloads JavaScript, and builds the page. Routing comes from React Router, and the backend is a separate API. It's simple and cheap to host, so it's great for dashboards behind a login.
>
> Next.js can render on the server. The HTML arrives with content, so the first load is faster and SEO is better. It also has file-based routing and backend code like Route Handlers and Server Actions.
>
> My production experience is React SPAs talking to Node.js APIs. [FILL IN: name the build tool your SkillKeepr frontend uses, only if you know it.] I'd pick Next.js for public, SEO-heavy pages, and keep a Vite SPA for internal tools."

## 🔁 Follow-up questions

### Can you add server rendering to a Vite app?

Yes, with extra work: Vite has SSR APIs, or you use a framework on top, like React Router v7 framework mode. Next.js gives it to you ready-made.

### Is a Next.js app still a single-page app after it loads?

Mostly yes. After hydration, `<Link>` navigation happens in the browser without full page reloads. Next.js fetches only what the new route needs.

### Which one is easier to deploy?

Vite: upload static files to any host or CDN. Next.js: needs a Node server, Vercel, or Docker — unless you use `output: 'export'` for a fully static site, which turns off server-only features.

### Does Next.js mean you don't need Redux?

Not exactly. Server Components reduce how much data you keep in client state. You may still need client state for things like filters, modals or carts. See [state management choices](topic:redux-context/how-to-choose).

## ✅ Quick check

### 1. You open "View page source" on a Vite React app. Will you see your page's text inside the HTML?

:::answer
**No** (by default). You see an empty `<div id="root">` and script tags. The text is created by JavaScript after the page loads.
:::

### 2. Which is the better fit for an internal admin dashboard behind a login, with an existing Express API?

- A) React + Vite
- B) Next.js, because it's always better

:::answer
**A) React + Vite** is a fine, simpler choice. There's no SEO need, and the backend already exists. Next.js would also work, but its main advantages don't matter much here.
:::

### 3. In Next.js, where can you use `useState`?

:::answer
Only in **Client Components**, files that start with `'use client'`. Server Components can't use state or effects.
:::
