---
title: Data fetching and caching in Next.js 16
stack: nextjs
order: 14
level: Intermediate
mustKnow: false
askedFrequency: common
summary:
  - In a Server Component you fetch data with a plain await — no useEffect, no loading flags.
  - "Since Next.js 15, fetch is NOT cached by default. You opt in to caching."
  - "Next.js 16's Cache Components: turn on cacheComponents, then mark cached functions or components with 'use cache'."
  - "cacheLife sets how long a cached result lives; cacheTag gives it a name you can clear later."
  - "To clear a cache: updateTag (in a Server Action, takes effect at once), revalidateTag(tag, 'max') (refresh in the background), or revalidatePath."
cards:
  - q: Is fetch cached by default in Next.js 16?
    a: No. Since Next.js 15, fetch results are not cached by default. You choose what to cache.
  - q: What does 'use cache' do?
    a: It marks a function or component so Next.js stores its result and reuses it, instead of running it on every request. It needs cacheComponents turned on.
  - q: What are cacheLife and cacheTag?
    a: "cacheLife sets how long a cached result stays fresh (e.g. 'minutes'). cacheTag gives it a label, so you can clear it later with updateTag or revalidateTag."
  - q: What's the difference between updateTag and revalidateTag in Next.js 16?
    a: "updateTag (only in Server Actions) expires the tag at once, so the user sees their own change. revalidateTag(tag, 'max') marks it stale and refreshes it in the background."
  - q: With Cache Components on, what happens if a page fetches data without caching it or wrapping it in Suspense?
    a: The build fails with an error saying uncached data was found outside Suspense. You fix it by adding 'use cache' or a <Suspense> boundary.
---

## 💡 What is it?

In the App Router, a [Server Component](topic:nextjs/server-components) can be `async`. So you **fetch data with a plain `await`**. No `useEffect`, no loading flags by hand.

**Caching** means saving a result and reusing it, so you don't fetch the same thing again and again.

In **Next.js 16**, caching is **opt-in**. You choose what to cache. The new way is **Cache Components**: you mark a function with `'use cache'`, then say how long to keep it.

## 🏠 Real-life example

Think of the **school canteen menu board**.

The cook doesn't phone the supplier every time a student looks at the menu. The menu is written once and **kept on the board** for a while.

- **Phoning the supplier** = fetching data from an API or database.
- **Writing the menu on the board** = caching the result (`'use cache'`).
- **"Change the board every hour"** = `cacheLife('hours')`.
- **The label "Lunch menu" on the board** = `cacheTag('lunch')`.
- **A new dish is added, so the cook wipes the board right away** = `updateTag('lunch')`.
- **"Update the board when you're free"** = `revalidateTag('lunch', 'max')`.

## 🧑‍💻 Code example

Create a Next.js 16 project (`npx create-next-app@latest my-app`) and turn on Cache Components.

```ts
// next.config.ts
import type { NextConfig } from 'next'; // type for the config object

const nextConfig: NextConfig = { // the Next.js settings
  cacheComponents: true, // turn on Cache Components ('use cache', cacheLife, cacheTag)
}; // end of the settings

export default nextConfig; // Next.js reads this export
```

```ts
// app/jobs/data.ts — a cached data function
import { cacheLife, cacheTag } from 'next/cache'; // caching helpers

export async function getJobs() { // runs on the server
  'use cache'; // cache this function's result
  cacheLife('minutes'); // built-in profile: refresh after about 1 minute, expire after 1 hour
  cacheTag('jobs'); // name this cache "jobs" so we can clear it later
  const res = await fetch('https://jsonplaceholder.typicode.com/posts?_limit=3'); // pretend these are jobs
  const posts: { id: number; title: string }[] = await res.json(); // the list of items
  return { posts, fetchedAt: new Date().toISOString() }; // also return when we fetched
} // end of getJobs
```

```ts
// app/jobs/actions.ts — a Server Action that clears the cache
'use server'; // functions in this file run on the server

import { updateTag } from 'next/cache'; // clears a tagged cache immediately

export async function refreshJobs() { // called by the form below
  updateTag('jobs'); // expire the "jobs" cache now; the next render fetches fresh data
} // end of refreshJobs
```

```tsx
// app/jobs/page.tsx — the page uses the cached function
import { getJobs } from './data'; // the cached function
import { refreshJobs } from './actions'; // the Server Action

export default async function JobsPage() { // an async Server Component
  const { posts, fetchedAt } = await getJobs(); // served from the cache when fresh
  return ( // what the page shows
    <main> {/* page wrapper */}
      <p>Fetched at {fetchedAt}</p> {/* shows when the data was really fetched */}
      <ul>{posts.map((p) => <li key={p.id}>{p.title}</li>)}</ul> {/* the list */}
      <form action={refreshJobs}> {/* submitting runs the Server Action */}
        <button type="submit">Refresh jobs</button> {/* click to clear the cache */}
      </form> {/* end of the form */}
    </main> // end of the wrapper
  ); // end of the returned JSX
} // end of JobsPage
```

Run `npm run build`.

**Real build output (Next.js 16.4):**

```text
Route (app)      Revalidate  Expire
┌ ○ /_not-found
└ ○ /jobs                1m      1h

○  (Static)  prerendered as static content
```

The page is **static**, refreshed about every minute and expired after an hour, because of `cacheLife('minutes')`.

**Now remove the three cache lines from `getJobs` and build again.** Real output:

```text
Error: Route "/jobs": Next.js encountered uncached or runtime data during prerendering.

Ways to fix this:
  - [stream] Provide a placeholder with `<Suspense fallback={...}>` around the data access
  - [cache] For uncached data (`fetch`, database calls): cache the access with `"use cache"` …
```

With Cache Components on, Next.js makes you **decide**: cache the data, or stream it in with `<Suspense>`.

## 🔍 Deeper version

**Fetching on the server.** You can `await` anything in a Server Component: `fetch`, a Mongoose query, an ORM call. The code never reaches the browser, so secrets are safe. Fetch in parallel with `Promise.all` when the calls don't depend on each other.

**Three ways to clear or refresh a cache:**

| Function | Where | What happens |
|---|---|---|
| `updateTag('jobs')` | **Only in Server Actions** | Expires the tag **at once**. The user sees their own change on the next render ("read your own writes"). |
| `revalidateTag('jobs', 'max')` | Server Actions, Route Handlers | Marks the tag stale. The next visitor may get the old data while fresh data loads in the background. The second argument is required in Next.js 16. |
| `revalidatePath('/jobs')` | Server Actions, Route Handlers | Refreshes everything for that path. |

**cacheLife profiles** (built in): `seconds`, `minutes`, `hours`, `days`, `weeks`, `max`, plus `default`. Each sets three times:
- **stale**: how long the browser can use it without asking.
- **revalidate**: after this, the server refreshes it in the background.
- **expire**: after this with no traffic, it's thrown away.

You can also pass your own numbers: `cacheLife({ revalidate: 300 })`.

**What can be cached.** A `'use cache'` function's **arguments become part of the cache key**. So `getJob(42)` and `getJob(43)` are cached separately. Request-time values like `cookies()` or `headers()` can't be read inside a cached function. Read them outside, and pass plain values in.

**Without Cache Components.** Projects that don't turn on `cacheComponents` use the older options:
- `fetch(url, { cache: 'force-cache' })` to cache one fetch.
- `fetch(url, { next: { revalidate: 60 } })` for time-based refresh.
- `export const revalidate = 60` on a page (see [rendering types](topic:nextjs/rendering-types)).

:::version[Version note — a known interview trap]
- **Next.js 13–14:** `fetch` was **cached by default**. Many people were surprised by stale data.
- **Next.js 15:** `fetch` and GET Route Handlers became **not cached by default**.
- **Next.js 16:** **Cache Components** (`cacheComponents: true`) with `'use cache'`, `cacheLife` and `cacheTag`. `revalidateTag` now needs a second argument (a cacheLife profile like `'max'`), and `updateTag` was added for Server Actions.

In an interview, explain the **idea** (static vs fresh vs revalidate), and say you'd follow the docs for the version in use.
:::

## 🎯 Why do we use it?

- **Speed.** Cached data is served at once, often as static HTML.
- **Lower cost.** Fewer calls to the database and paid APIs.
- **Control.** You decide what must be fresh (a user's dashboard) and what can be a little old (a job list).
- **Correctness after changes.** Tags let you clear exactly the right cache when data changes.

## ⚠️ Common mistakes

- **Assuming `fetch` is cached.** Since Next.js 15 it isn't. Opt in.
- **Caching per-user data.** A cached result is shared. Never cache something that depends on who is logged in, unless the user id is part of the key.
- **Calling `updateTag` in a Route Handler.** It only works in Server Actions. Use `revalidateTag` there.
- **Reading `cookies()` inside a `'use cache'` function.** Read it outside and pass the value in.

## 🗣️ How to answer in an interview

> "In the App Router, I fetch data directly in async Server Components with await, so there's no useEffect for the first load. Caching is opt-in now. Since Next.js 15, fetch isn't cached by default, which is a big change from 13 and 14.
>
> In Next.js 16, the new model is Cache Components. I turn on cacheComponents, then mark a data function with 'use cache', set its lifetime with cacheLife, and label it with cacheTag. When the data changes, a Server Action calls updateTag so the user sees their own update immediately, or I use revalidateTag with a profile for a background refresh.
>
> The rule I follow is: cache shared, slow-changing data, keep per-user data dynamic, and wrap dynamic parts in Suspense. Since caching defaults changed between versions, I'd always check the docs for the version the project uses. I haven't used Next.js in production yet, but I've tried this model. [FILL IN: once you've built the practice project, describe what you cached and how you cleared it.]"

## 🔁 Follow-up questions

### How is 'use cache' different from React's cache() function?

React's `cache()` removes duplicate calls **within one request**. `'use cache'` stores the result **across requests** in Next.js's cache, with a lifetime and tags.

### How do you fetch two things in parallel in a Server Component?

Start both, then await them together: `const [jobs, user] = await Promise.all([getJobs(), getUser()]);`. See [javascript/promise-combinators](topic:javascript/promise-combinators).

### When would you still fetch on the client?

For data that changes while the user is on the page, like live search results or polling. Use a Client Component with TanStack Query (see [react/tanstack-query](topic:react/tanstack-query)).

### How do you refresh a static page right after a database update?

In the Server Action that saves the change, call `updateTag('jobs')` or `revalidatePath('/jobs')`. See [Server Actions](topic:nextjs/server-actions).

## ✅ Quick check

### 1. In Next.js 16, is this result cached?

```ts
const res = await fetch('https://api.example.com/jobs'); // no options
```

:::answer
**No.** Since Next.js 15, `fetch` isn't cached by default. Add `'use cache'` around it (Cache Components) or a cache option.
:::

### 2. A user edits a job, then must see the change immediately. Which do you call in the Server Action?

- A) `revalidateTag('jobs', 'max')`
- B) `updateTag('jobs')`
- C) Nothing; it updates automatically

:::answer
**B.** `updateTag` expires the cache at once, so the user reads their own change. A refreshes in the background, so the user might briefly see old data.
:::

### 3. With `cacheComponents: true`, a page awaits an uncached `fetch` with no `<Suspense>`. What happens at build time?

:::answer
The **build fails** with "Next.js encountered uncached or runtime data during prerendering". Fix it with `'use cache'` or by wrapping that part in `<Suspense>`.
:::
