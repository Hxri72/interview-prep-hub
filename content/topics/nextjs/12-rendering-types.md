---
title: "Rendering types: SSG, SSR, ISR, CSR"
stack: nextjs
order: 12
level: Intermediate
mustKnow: true
askedFrequency: very common
summary:
  - "SSG = HTML made once at build time. Good for pages that rarely change."
  - "SSR = HTML made on the server for every request. Good for fresh or personal data."
  - "ISR = static HTML that is rebuilt in the background every N seconds. Good for 'mostly static' pages."
  - "CSR = the page is filled in the browser after JavaScript loads. Good for highly interactive parts."
  - In the App Router you don't pick a mode by name; Next.js decides from what your page uses (dynamic APIs, fetch options, revalidate).
cards:
  - q: What is SSG?
    a: Static Site Generation. The HTML is built once at build time and served to everyone. Very fast, but the data can get old.
  - q: What is SSR?
    a: Server-Side Rendering. The server builds fresh HTML for every request. Good for personal or always-fresh data, but slower than static.
  - q: What is ISR?
    a: Incremental Static Regeneration. The page is static, but Next.js rebuilds it in the background after a time limit, like every 60 seconds.
  - q: What is CSR?
    a: Client-Side Rendering. The browser gets a shell, then JavaScript fetches data and fills the page.
  - q: In the App Router, what makes a page dynamic (SSR-style)?
    a: "Using request-time things like cookies(), headers() or searchParams, or fetching with cache: 'no-store'."
---

## 💡 What is it?

**Rendering** means turning your React components into HTML for the user.

The question is **when** the HTML is made:
- **SSG** (Static Site Generation): once, at **build time**.
- **SSR** (Server-Side Rendering): on the server, for **every request**.
- **ISR** (Incremental Static Regeneration): built once, then **rebuilt in the background** every few seconds or minutes.
- **CSR** (Client-Side Rendering): in the **browser**, after JavaScript loads.

## 🏠 Real-life example

Think of a **school notice board**.

- **SSG** = the **school timetable**. It's printed once at the start of the year and pinned up. Everyone reads the same copy. Fast, but it doesn't change.
- **SSR** = **asking the office for your own report card**. They print it fresh, just for you, each time. Always correct, but you wait a bit.
- **ISR** = the **canteen menu**. It's printed and pinned up, but the staff replace it every morning. Mostly fast, and never too old.
- **CSR** = a **blank whiteboard**. You walk up and write the details yourself after you arrive. Very flexible, but it starts empty.

## 🧑‍💻 Code example

In a Next.js 16 project, create this page. It shows ISR: the page is static, but refreshes at most every 10 seconds.

```tsx
// app/time/page.tsx
export const revalidate = 10; // ISR: rebuild this page in the background at most every 10 seconds

export default function TimePage() { // a Server Component
  const builtAt = new Date().toLocaleTimeString(); // the time when this HTML was made
  return <h1>Page built at {builtAt}</h1>; // show the build time
} // end of TimePage
```

Run it in production mode, because dev mode renders every request fresh:

```text
npm run build && npm start
```

**Real build output (Next.js 16.4):**

```text
Route (app)      Revalidate  Expire
┌ ○ /_not-found
└ ○ /time               10s      1y

○  (Static)  prerendered as static content
```

**What you see when you refresh (real run):**

```text
Page built at 9:02:37 pm   ← the copy made at build time
Page built at 9:02:37 pm   ← more than 10 s later: still the OLD copy, but a rebuild starts
Page built at 9:02:49 pm   ← next refresh: the NEW copy
Page built at 9:02:49 pm   ← same copy until 10 s pass again
```

That second-to-last line surprises people. ISR is "stale-while-revalidate": one visitor gets the old page while the new one is being made.

## 🔍 Deeper version

**The four types side by side:**

| Type | HTML made | Speed | Freshness | Good for |
|---|---|---|---|---|
| SSG | At build time | Fastest (from a CDN) | Old until next build | Home, about, docs, blog |
| ISR | Build time, then in the background every N s | Fast | At most N seconds old | Job listings, product pages |
| SSR | On every request | Slower | Always fresh | Dashboards, personal pages |
| CSR | In the browser | Shell is fast; data comes later | Fresh | Interactive widgets after login |

**How the App Router decides.** You don't write "SSR" anywhere. Next.js looks at what the route uses:

- **Static (SSG) by default.** If the page uses no request-time data, it's rendered at build time.
- **Dynamic (SSR)** if the page uses request-time APIs: `cookies()`, `headers()`, `searchParams`, or `await connection()`. Fetching with `{ cache: 'no-store' }` also makes it dynamic.
- **ISR** with `export const revalidate = 60` in the page, or `fetch(url, { next: { revalidate: 60 } })`.
- **CSR** happens inside Client Components that fetch data after loading, for example with TanStack Query (see [react/tanstack-query](topic:react/tanstack-query)).

**Dynamic routes at build time.** For a page like `app/jobs/[id]/page.tsx`, export `generateStaticParams()` to list which ids to build ahead of time. See [dynamic routes](topic:nextjs/dynamic-routes).

**Mixing on one page.** Modern Next.js can serve a static shell and **stream** in the dynamic parts. See [streaming](topic:nextjs/streaming). With the newer **Cache Components** model, you mark cached parts with `'use cache'`, and the rest renders per request. See [data fetching and caching](topic:nextjs/data-fetching-caching).

:::version[Version note]
In the old **Pages Router**, you chose the mode with functions: `getStaticProps` (SSG/ISR), `getServerSideProps` (SSR). The App Router replaced these with Server Components, `fetch` options and route settings like `revalidate`. Also, since **Next.js 15**, `fetch` is **not cached by default**. If a project turns on **Cache Components** in Next.js 16, it uses `'use cache'` and `cacheLife` instead of the `revalidate` route setting. Interviewers mostly want the *idea*: static vs fresh vs revalidate.
:::

**How to check what you got.** Run `npm run build`. The build output marks each route as static or dynamic, so you can confirm your choice.

## 🎯 Why do we use it?

Different pages need different trade-offs:
- A **marketing page** should be as fast as possible → static.
- A **job list** should be fast but not too old → ISR.
- A **recruiter's dashboard** must show that user's fresh data → SSR.
- A **live chat box** reacts in the browser → CSR.

Picking the right one per page gives you speed **and** correct data.

## ⚠️ Common mistakes

- **Testing ISR in dev mode.** `npm run dev` renders on every request. Test with `npm run build && npm start`.
- **Expecting ISR to show new data on the very first request after the time limit.** That request gets the old page and triggers the rebuild.
- **Accidentally making a page dynamic.** Reading `cookies()` in a shared layout makes every page under it dynamic.
- **Making a personal page static.** User-specific data must not be cached and shared with everyone.

## 🗣️ How to answer in an interview

> "SSG builds the HTML once at build time, so it's the fastest but can get old. SSR builds fresh HTML on the server for every request, which suits personal or real-time data. ISR is a middle ground: the page is static, but Next.js rebuilds it in the background after a time limit, like 60 seconds. CSR fills the page in the browser after JavaScript loads.
>
> In the App Router, I don't choose these by name. A page is static by default. It becomes dynamic if it uses request data like cookies, headers or searchParams, or fetches with no-store. I get ISR with a revalidate value. I'd also mention that default caching changed between versions — fetch isn't cached by default since Next.js 15 — so I'd follow the docs for the version in use.
>
> For a job board, I'd make the job list ISR, the job detail pages static with revalidation, and the recruiter dashboard dynamic. I haven't shipped Next.js in production yet. [FILL IN: once you've built the practice project, say which rendering type each page used.]"

## 🔁 Follow-up questions

### Which is best for SEO?

SSG, ISR and SSR all send ready HTML, so search engines can read the content. Pure CSR sends an almost empty page first, which is weaker for SEO.

### What happens if an ISR rebuild fails?

Next.js keeps serving the last good page. It tries again on a later request.

### How do you update a static page immediately after data changes?

Use on-demand revalidation: call `revalidatePath('/jobs')` or `revalidateTag('jobs', 'max')` from a [Server Action](topic:nextjs/server-actions) or a [Route Handler](topic:nextjs/route-handlers).

### Is a Client Component the same as CSR?

Not exactly. Client Components are still server-rendered to HTML first. It's CSR only when the **data** is fetched in the browser after loading.

## ✅ Quick check

### 1. A page reads `cookies()` to show the user's name. Static or dynamic?

:::answer
**Dynamic.** `cookies()` depends on the request, so the page must render per request.
:::

### 2. Which fits "a list of open jobs that may change every few minutes, and must load fast"?

- A) SSG with no revalidation
- B) ISR with `revalidate = 300`
- C) Pure CSR

:::answer
**B.** It's fast like static, and at most 5 minutes old.
:::

### 3. You set `revalidate = 10`, run `npm run dev`, and the time changes on every refresh. Is ISR broken?

:::answer
**No.** Dev mode renders on every request. Test ISR with `npm run build && npm start`.
:::
