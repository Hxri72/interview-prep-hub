---
title: loading.tsx, error.tsx and not-found.tsx
stack: nextjs
order: 8
level: Basic
mustKnow: false
askedFrequency: common
summary:
  - loading.tsx shows instantly while a page waits for data. Next.js wraps the page in React Suspense for you.
  - error.tsx catches errors in its folder and shows a fallback with a "Try again" button. It must be a Client Component ('use client').
  - not-found.tsx is shown when you call notFound(). app/not-found.tsx also covers URLs that match no route.
  - Each file works for its own folder and all sub-folders, so different sections can have different loading and error screens.
  - global-error.tsx catches errors in the root layout itself and must render its own html and body tags.
cards:
  - q: What does loading.tsx do?
    a: It shows a loading UI immediately while the page in that folder waits for data. Next.js wraps the page in a Suspense boundary using it as the fallback.
  - q: Why must error.tsx start with 'use client'?
    a: Error boundaries are a client-side React feature, and the file needs a button that runs a function (retry) in the browser.
  - q: How do you show the not-found UI for a missing record?
    a: Call notFound() from next/navigation. Next.js renders the nearest not-found.tsx.
  - q: What props does error.tsx receive in Next.js 16?
    a: error (the Error object, with a digest id) and retry() to try rendering the segment again. reset() still exists for special cases.
  - q: Does error.tsx catch errors in the layout of the same folder?
    a: No. It wraps the page and nested parts, not the layout above it in the same folder. Use the parent's error.tsx, or global-error.tsx for the root layout.
---

## 💡 What is it?

Three **special file names** handle the "not normal" moments of a page:

- **`loading.tsx`** — shown **while** the page is loading data.
- **`error.tsx`** — shown **if** something crashes.
- **`not-found.tsx`** — shown **when** the thing the user asked for doesn't exist (404).

You don't wire them up anywhere. You just put the file in a route folder, and Next.js uses it for that folder and every folder below it.

## 🏠 Real-life example

Think of a **school canteen counter**.

- **"Your food is being prepared, please wait"** board = `loading.tsx`. You see it straight away, so you know the order was taken.
- **"Sorry, the stove broke — tap here to try again"** card = `error.tsx`. The rest of the canteen still works; only your counter shows the problem.
- **"We don't serve pizza here"** sign = `not-found.tsx`. You asked for something that doesn't exist.
- **Each counter can have its own boards** = each folder can have its own special files.
- The **whole canteen losing power** = `global-error.tsx`, for when even the main building (root layout) fails.

## 🧑‍💻 Code example

A job page with all three special files. Start from `npx create-next-app@latest my-app --yes`.

**File: `app/jobs/[id]/page.tsx`**

```tsx
import { notFound } from 'next/navigation';                  // function that triggers the not-found UI

const jobs: Record<string, string> = {                       // fake data: id → title
  '1': 'Node.js Developer',                                  // job 1
  '2': 'React Developer',                                    // job 2
};                                                           // end of the fake data

export default async function JobPage({ params }: PageProps<'/jobs/[id]'>) { // async page
  const { id } = await params;                               // read the id from the URL
  if (id === 'crash') throw new Error('Database is down');   // pretend the database failed (to test error.tsx)
  const title = jobs[id];                                    // find the job
  if (!title) notFound();                                    // missing job → show not-found.tsx
  return <h1>Job {id}: {title}</h1>;                         // normal case
}                                                            // end of JobPage
```

**File: `app/jobs/[id]/loading.tsx`**

```tsx
export default function Loading() {                          // no props; shown while the page loads
  return <p>Loading job…</p>;                                // keep it small and fast (a skeleton is nice)
}                                                            // end of Loading
```

**File: `app/jobs/[id]/not-found.tsx`**

```tsx
export default function NotFound() {                         // shown when the page calls notFound()
  return <h2>Sorry, this job does not exist.</h2>;           // a friendly message
}                                                            // end of NotFound
```

**File: `app/jobs/[id]/error.tsx`**

```tsx
'use client';                                                // error boundaries must be Client Components

export default function Error({ error, retry }: {            // Next.js passes these two props
  error: Error & { digest?: string };                        // the error; digest = an id to find it in server logs
  retry: () => void;                                         // call this to try rendering the page again
}) {                                                         // end of the props type
  return (                                                   // the fallback UI
    <div>                                                    {/* wrapper */}
      <h2>Something went wrong.</h2>                          {/* never show raw error details to users */}
      <button onClick={() => retry()}>Try again</button>     {/* re-fetch and re-render this part */}
    </div>                                                   // end of wrapper
  );                                                         // end of what Error returns
}                                                            // end of Error
```

Tested with `npm run build` + `npm start`:

```text
/jobs/1      →  Job 1: Node.js Developer
/jobs/99     →  Sorry, this job does not exist.        (notFound() → not-found.tsx)
/jobs/crash  →  Something went wrong. [Try again]      (the thrown error → error.tsx)
/whatever    →  404 This page could not be found.      (no route at all → default 404)
While a page is loading you briefly see: Loading job…
```

## 🔍 Deeper version

**How they nest.** For one folder, Next.js wraps the parts like this:

```text
layout.tsx
└── error.tsx        (React error boundary)
    └── loading.tsx  (React <Suspense> fallback)
        └── not-found.tsx
            └── page.tsx
```

So `error.tsx` catches errors from the page, `loading.tsx` and `not-found.tsx` below it. It does **not** catch errors in the `layout.tsx` of the **same** folder. Those bubble up to the parent folder's `error.tsx`. For the root layout, use **`app/global-error.tsx`**, which must render its own `<html>` and `<body>`.

**`loading.tsx` = automatic Suspense.** It is the same as wrapping the page in `<Suspense fallback={<Loading />}>`. The loading UI is **prefetched** with `<Link>`, so it appears instantly on click. The layout stays interactive while the page streams in. For finer control, use `<Suspense>` around individual slow components. See [streaming](topic:nextjs/streaming).

**`error.tsx` details:**
- `error.message` in **production**: for errors thrown in Server Components, Next.js hides the real message (so secrets don't leak). It sends a generic message plus `error.digest`, which matches the entry in the server logs.
- `retry()` re-fetches and re-renders the failed segment. `reset()` only clears the error state without re-fetching, for rare cases.
- To log errors, send them to a monitoring tool from a `useEffect` in `error.tsx`, or on the server.

**`not-found.tsx` details:**
- `app/not-found.tsx` (root level) handles **all unmatched URLs** plus `notFound()` calls that have no closer file.
- A not-found page gets `<meta name="robots" content="noindex">`. If streaming already started (for example because `loading.tsx` showed first), the HTTP status stays 200 instead of 404.

**Forbidden / unauthorized.** Since Next.js 15.1 there are also `forbidden.tsx` and `unauthorized.tsx`, with matching `forbidden()` / `unauthorized()` functions for 403 and 401 screens. They are still **experimental** (behind a config flag), so mention them as "newer, experimental" in an interview.

:::version[Version note]
- **Next.js 13:** `error`, `loading` and `not-found` files were introduced with the App Router.
- **Next.js 16.2:** added `unstable_retry`.
- **Next.js 16.3:** made it stable as **`retry`**. Older tutorials use **`reset`** for the "Try again" button. `reset` still exists, but `retry` is the recommended prop now, because it also re-fetches the data.
:::

## 🎯 Why do we use it?

- **Better UX.** Users see a loading state instantly instead of a frozen screen.
- **Contained failures.** One broken widget or section shows an error box. The rest of the app (header, sidebar) keeps working.
- **Clear 404s.** Missing records get a proper "not found" page, which is also good for SEO.
- **Less boilerplate.** No manual `isLoading` / `error` state in every page — the files handle it.

## ⚠️ Common mistakes

- **Forgetting `'use client'` in `error.tsx`.** The build fails with "error.tsx must be a Client Component. Add the "use client" directive the top of the file".
- **Showing `error.message` to users.** In production it's generic for server errors anyway. Show a friendly message and log the details.
- **Expecting `error.tsx` to catch errors in the same folder's `layout.tsx`.** Put an `error.tsx` one level up, or use `global-error.tsx`.
- **Making `loading.tsx` heavy.** It should be light (text or a skeleton), so it shows instantly.
- **Throwing a normal error for "not found".** Call `notFound()` instead, so users get the 404 UI, not the error UI.

## 🗣️ How to answer in an interview

> "The App Router has special files for the non-happy paths. loading.tsx shows instantly while a page loads. Next.js wraps the page in Suspense with it as the fallback, so the layout stays usable while data streams in.
>
> error.tsx is a React error boundary for its folder. It has to be a client component, and it gets the error and a retry function to try rendering again. It doesn't catch errors in the layout of the same folder, so for the root layout there's global-error.tsx.
>
> not-found.tsx shows when I call notFound() — for example when a job id doesn't exist — and the root one also handles unknown URLs.
>
> Each file applies to its folder and everything below, so different sections can have their own loading and error screens.
>
> I haven't used Next.js in production; in my React work the equivalent was an error boundary component and manual loading states. [FILL IN: confirm how your SkillKeepr app showed loading and errors, e.g. per-slice loading/error state.]"

## 🔁 Follow-up questions

### What's the difference between `loading.tsx` and `<Suspense>`?

`loading.tsx` is a shortcut that wraps the **whole page** in Suspense. Writing `<Suspense>` yourself lets you show the fast parts first and stream each slow part separately.

### How would you log errors from `error.tsx`?

In a `useEffect`, send `error` (and `error.digest`) to a monitoring service. On the server, use `instrumentation.ts` hooks or your logger, and match by digest.

### Why does the user see a generic message instead of my error text in production?

For errors from **Server Components**, Next.js removes the original message so secrets like database details don't leak to the browser. The `digest` links it to the full server log.

### Where do you put a custom 404 for the whole site?

`app/not-found.tsx`. It's used for every URL that matches no route.

## ✅ Quick check

### 1. Your page throws `new Error('DB down')`. Which file's UI appears?

:::answer
The nearest **`error.tsx`** (in the same folder or a parent). If there is none, the error bubbles up. In the end, Next.js shows its default error page.
:::

### 2. True or false: `error.tsx` can be a Server Component.

:::answer
**False.** It must start with `'use client'`. Error boundaries run in the browser.
:::

### 3. A job id isn't in the database. Should the page `throw new Error()` or call `notFound()`?

:::answer
Call **`notFound()`**. Then the user sees the not-found UI (and search engines get a noindex 404 page). Throwing an error would show the error UI, which is wrong for "this doesn't exist".
:::
