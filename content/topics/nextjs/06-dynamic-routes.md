---
title: "Dynamic routes [id] and awaiting params"
stack: nextjs
order: 6
level: Basic
mustKnow: false
askedFrequency: common
summary:
  - A folder name in square brackets, like [id], is a dynamic segment. app/jobs/[id]/page.tsx matches /jobs/1, /jobs/42 and so on.
  - "The page receives params as a Promise: const { id } = await params. Since Next.js 16 you must await it."
  - "[...slug] catches many segments (/docs/a/b), [[...slug]] also matches the bare /docs."
  - With Cache Components on (the default in new apps), reading params needs a loading.tsx or Suspense around it, or the build fails.
  - generateStaticParams lists ids to build ahead of time; notFound() shows the 404 UI for unknown ids.
cards:
  - q: How do you create the URL /jobs/:id in the App Router?
    a: Create app/jobs/[id]/page.tsx. The value is in params, e.g. const { id } = await params.
  - q: Why must you await params in Next.js 15/16?
    a: params is a Promise, so Next.js can prerender the static parts first. Next.js 15 still allowed sync access temporarily; Next.js 16 removed it.
  - q: What is the type of params for app/shop/[...slug]/page.tsx?
    a: "{ slug: string[] } — a catch-all segment gives an array of the URL parts."
  - q: How do you show a 404 when the id doesn't exist?
    a: Call notFound() from next/navigation. Next.js renders the nearest not-found.tsx.
  - q: What does generateStaticParams do?
    a: "It returns a list of params, like [{ id: '1' }, { id: '2' }], so those pages are built at build time."
---

## 💡 What is it?

Often you don't know a URL part in advance. For example `/jobs/1`, `/jobs/2`, `/jobs/250`: one page design, many ids.

A **dynamic segment** handles this. You name a folder with **square brackets**, like `[id]`. Then `app/jobs/[id]/page.tsx` matches **every** `/jobs/something` URL.

The page gets the value through a prop called **`params`**. In Next.js 16, `params` is a [Promise](glossary:promise), so you **`await`** it.

## 🏠 Real-life example

Think of a **school report card template**.

The office has **one** printed template: "Report card for student number ___". They don't print a new design for every student. They fill in the blank.

- The **template** = `app/jobs/[id]/page.tsx`. One design for every job.
- The **blank "___"** = `[id]`, the dynamic segment.
- The **student number written in** = the value from the URL, like `1` or `42`.
- The **clerk opening the envelope with the number** = `await params`. You must open it before you can read it.
- "**No such student**" = `notFound()`. The office shows a polite "not found" note.

## 🧑‍💻 Code example

Show one job by its id. Start from `npx create-next-app@latest my-app --yes`.

**File: `app/jobs/[id]/page.tsx`** → matches `/jobs/1`, `/jobs/2`, `/jobs/99`…

```tsx
import { notFound } from 'next/navigation';                   // shows the 404 UI when called

const jobs: Record<string, string> = {                        // fake data: id → job title
  '1': 'Node.js Developer',                                   // job with id "1"
  '2': 'React Developer',                                     // job with id "2"
};                                                            // end of the fake data

export default async function JobPage({ params }: PageProps<'/jobs/[id]'>) { // async page; params is a Promise
  const { id } = await params;                                // wait for params, then read id ("1", "2", "99"…)
  const title = jobs[id];                                     // look up the job; undefined if it doesn't exist
  if (!title) notFound();                                     // unknown id → stop and show the not-found UI
  return <h1>Job {id}: {title}</h1>;                          // show the job
}                                                             // end of JobPage
```

**File: `app/jobs/[id]/loading.tsx`** (needed when Cache Components is on — see below)

```tsx
export default function Loading() {                           // shown while the page waits for params/data
  return <p>Loading job…</p>;                                 // a simple loading message
}                                                             // end of Loading
```

Run `npm run build` then `npm start`, and open:

```text
http://localhost:3000/jobs/1   →  Job 1: Node.js Developer
http://localhost:3000/jobs/2   →  Job 2: React Developer
http://localhost:3000/jobs/99  →  404 This page could not be found.

Without loading.tsx, `npm run build` fails with:
Error: Route "/jobs/[id]": Next.js encountered uncached or runtime data during prerendering.
`fetch(...)`, `cookies()`, `headers()`, `params`, `searchParams`, or `connection()` accessed
outside of `<Suspense>` prevents the route from being prerendered ...
```

**What to notice:** the folder name `[id]` becomes the key name: `params.id`. If the folder were `[jobId]`, you'd read `jobId`.

## 🔍 Deeper version

**The three kinds of dynamic segments:**

| Folder | Matches | `params` |
|---|---|---|
| `app/jobs/[id]/page.tsx` | `/jobs/1` | `{ id: '1' }` |
| `app/docs/[...slug]/page.tsx` | `/docs/a`, `/docs/a/b` | `{ slug: ['a', 'b'] }` |
| `app/docs/[[...slug]]/page.tsx` | `/docs` too | `{ slug: undefined }` for `/docs` |

Values are always **strings** (or string arrays). `/jobs/1` gives `'1'`, not the number `1`. Validate them like any user input.

**Why a Promise?** Next.js wants to render the parts of a page that **don't** depend on the URL (headers, layout, static text) **before** it knows the params. Making `params` a Promise lets React render the static shell first and fill in the rest when the value is ready.

**Cache Components and `<Suspense>`.** New apps from `create-next-app` turn on `cacheComponents`. Next.js then prerenders a static shell for every route at build time. Reading `params` (or `cookies()`, `headers()`, uncached `fetch`) is **runtime data**, so it must sit inside a `<Suspense>` boundary. A `loading.tsx` file gives the whole page one. Otherwise the build fails, as shown above. Your options:

1. Add `loading.tsx` (page-level fallback).
2. Wrap only the part that reads params in `<Suspense fallback={…}>`.
3. Export `generateStaticParams()` so known ids are built ahead of time.

**`generateStaticParams`:**

```tsx
export async function generateStaticParams() {                // runs at build time
  return [{ id: '1' }, { id: '2' }];                          // build /jobs/1 and /jobs/2 as static HTML
}                                                             // end of generateStaticParams
```

**In Client Components** you can't `await` in the component body. Use React's `use(params)` on the page, or the `useParams()` hook from `next/navigation` anywhere below it.

**Status code detail.** With `loading.tsx`, Next.js starts streaming HTML **before** your page calls `notFound()`. The status code is already sent as 200, so Next.js shows the not-found UI and adds `<meta name="robots" content="noindex">` instead. Without streaming, `notFound()` returns a real 404.

:::version[Version note]
- **Next.js 14 and earlier:** `params` was a plain object (`params.id`).
- **Next.js 15:** it became a Promise. Sync access still worked temporarily, with a warning.
- **Next.js 16:** sync access is **removed** — you must `await params` (or `use(params)` in a Client Component). A codemod helps upgrade old code.
:::

## 🎯 Why do we use it?

- **One file serves thousands of pages**: every job, product, user profile or blog post.
- **Clean, shareable URLs** like `/jobs/42` instead of `/job?id=42`. These are better for SEO and easier to read.
- **Build what you can ahead of time** with `generateStaticParams`, and render the rest on demand.

## ⚠️ Common mistakes

- **Reading `params.id` without `await`.** In Next.js 16, `params` is a Promise, so `params.id` is `undefined` and TypeScript shows an error.
- **Treating the id as a number.** It's a string. Convert and validate it (`Number(id)`, or a Zod schema).
- **No check for unknown ids.** Always call `notFound()` when the record doesn't exist, instead of crashing.
- **Forgetting `loading.tsx`/`<Suspense>` with Cache Components.** The build fails with "uncached or runtime data during prerendering".

## 🗣️ How to answer in an interview

> "A dynamic route uses a folder in square brackets. app/jobs/[id]/page.tsx matches /jobs/1, /jobs/2 and so on, and the value comes in the params prop.
>
> Since Next.js 15, params is a Promise, and Next.js 16 removed the old synchronous access, so I write const { id } = await params in an async server component. In a client component I'd use React's use() or the useParams hook. The value is always a string, so I validate it, and if the record doesn't exist I call notFound().
>
> For known ids I can export generateStaticParams to build those pages at build time. And with Cache Components on, I wrap the params access in Suspense or add a loading.tsx, so the rest of the page can still be prerendered.
>
> I haven't used Next.js in production yet. [FILL IN: once you've built the practice project, mention your /jobs/[id] page.]"

## 🔁 Follow-up questions

### How would you read a query string like `/jobs?page=2`?

In a page, use the `searchParams` prop. It's also a Promise: `const { page } = await searchParams`. In a Client Component, use the `useSearchParams()` hook.

### What's the difference between `[...slug]` and `[[...slug]]`?

`[...slug]` needs at least one segment (`/docs/a`). `[[...slug]]` is optional, so it also matches `/docs` with `slug` being `undefined`.

### Can a layout read params too?

Yes. Layouts get `params` as well. The docs advise **not** to await it at the top of a layout, because that blocks prerendering of the layout. Pass the Promise down to the component that needs it.

### How do you set the page title from the id?

Export `generateMetadata({ params })` from the page. It also receives `params` and returns `{ title }`. See [metadata](topic:nextjs/image-font-metadata).

## ✅ Quick check

### 1. What's wrong here (Next.js 16)?

```tsx
export default function Page({ params }: PageProps<'/jobs/[id]'>) { // not async
  return <h1>Job {params.id}</h1>;                                   // reading params directly
}
```

:::answer
`params` is a **Promise** in Next.js 16. You must make the component `async` and write `const { id } = await params`. `params.id` is `undefined` here, and TypeScript reports an error.
:::

### 2. For `app/shop/[...slug]/page.tsx`, what is `params` for `/shop/men/shirts`?

:::answer
`{ slug: ['men', 'shirts'] }`, an **array** of the segments.
:::

### 3. Your page calls `notFound()` for `/jobs/99`. Which file decides what the user sees?

:::answer
The nearest **`not-found.tsx`**, in this folder or a parent. Without one, Next.js shows its default "This page could not be found." See [special files](topic:nextjs/special-files).
:::
