---
title: App Router vs Pages Router
stack: nextjs
order: 4
level: Basic
mustKnow: true
askedFrequency: very common
summary:
  - Next.js has two routers. The Pages Router (pages/ folder) is the original; the App Router (app/ folder) arrived in Next.js 13.
  - The App Router supports Server Components, nested layouts, loading and error files, streaming and Server Actions.
  - "Pages Router data loading uses getServerSideProps / getStaticProps; App Router pages simply await data in async Server Components."
  - The Pages Router is still supported, but new projects should use the App Router. Both can live in one project during a migration.
  - In the Pages Router every file is a route; in the App Router only page.tsx (or route.ts) makes a folder public.
cards:
  - q: What are the two routers in Next.js?
    a: The Pages Router (pages/ folder, the original) and the App Router (app/ folder, since Next.js 13, recommended for new projects).
  - q: How does a page get data in each router?
    a: Pages Router uses getServerSideProps or getStaticProps. App Router pages are async Server Components that await data directly.
  - q: Name three features only the App Router has.
    a: Server Components, nested layouts that keep state, and special files like loading.tsx and error.tsx. Also streaming and Server Actions.
  - q: Can a project use both routers?
    a: Yes. The pages and app folders can live side by side, which allows a gradual migration. One URL must not be defined in both.
  - q: In the App Router, is every file in a folder a route?
    a: No. Only a page.tsx (or route.ts) makes a folder a public URL. Other files can sit there safely.
---

## 💡 What is it?

A **router** decides which page to show for a URL. Next.js has **two routers**.

- The **Pages Router** uses the `pages/` folder. It was the only router until Next.js 13.
- The **App Router** uses the `app/` folder. It came in Next.js 13, and it's the one to use for new projects.

Both use files and folders for URLs. But the App Router is built on newer React features, like [Server Components](topic:nextjs/server-components).

## 🏠 Real-life example

Think of a school that moved from an **old building** to a **new building**.

- The **old building** = the Pages Router. Every room is a separate room, and each one has its own way to bring in supplies.
- The **new building** = the App Router. It has shared corridors that stay the same as you walk (layouts), a waiting area outside each room (`loading.tsx`) and a first-aid room on each floor (`error.tsx`).
- **Both buildings stay open during the move** = `pages/` and `app/` can live in one project.
- **New classes start in the new building** = new projects use the App Router.

## 🧑‍💻 Code example

The same "job details" page, written in both routers. The URL is `/jobs/1` in both.

**Pages Router — File: `pages/jobs/[id].tsx`**

```tsx
import type { GetServerSideProps } from 'next';             // type for the data-loading function

type Props = { title: string };                             // the props this page receives

export const getServerSideProps: GetServerSideProps<Props> = async (context) => { // runs on the server for every request
  const id = context.params?.id as string;                  // read [id] from the URL, e.g. "1"
  return { props: { title: `Job ${id}` } };                 // whatever is in props is passed to the page
};                                                          // end of getServerSideProps

export default function JobPage({ title }: Props) {         // the page component gets the props
  return <h1>{title}</h1>;                                  // render the title
}                                                           // end of JobPage
```

**App Router — File: `app/jobs/[id]/page.tsx`**

```tsx
export default async function JobPage({ params }: PageProps<'/jobs/[id]'>) { // an async Server Component
  const { id } = await params;                              // params is a Promise in Next.js 15+: await it
  return <h1>Job {id}</h1>;                                 // the data is used directly, no props hop
}                                                           // end of JobPage
```

```text
http://localhost:3000/jobs/1

Job 1        ← both routers show the same result
```

**What to notice:** the App Router version has **no special data function**. The page itself is `async` and gets its data right where it renders. With Cache Components on (the default in new apps), this route also needs a `loading.tsx` next to it — see [dynamic routes](topic:nextjs/dynamic-routes).

## 🔍 Deeper version

| Topic | Pages Router (`pages/`) | App Router (`app/`) |
|---|---|---|
| Since | Next.js 1 | Next.js 13 (stable in 13.4) |
| Route file | Every file is a route: `pages/about.tsx` → `/about` | Only `page.tsx` / `route.ts` make a URL; other files are safe to keep in the folder |
| Components | All Client Components (rendered on the server, then hydrated) | **Server Components by default**, `'use client'` where needed |
| Data loading | `getServerSideProps`, `getStaticProps`, `getStaticPaths` | `async` components + `fetch`/DB calls; `generateStaticParams` |
| Layouts | `_app.tsx` and `_document.tsx`, plus manual per-page layouts | Nested `layout.tsx` files that keep their state between pages |
| Loading / errors | Manual | `loading.tsx`, `error.tsx`, `not-found.tsx` |
| Streaming | Limited | Built in with Suspense |
| Mutations | API routes (`pages/api`) | **Server Actions** + Route Handlers (`route.ts`) |
| React version | The one in your `package.json` | Built-in React canary channel (includes React 19 features) |

**Why the change?** React added Server Components, which run only on the server and send no JavaScript for themselves. The Pages Router could not use them without a redesign, so Next.js built a new router around them.

**Migration.** Teams move one route at a time from `pages/` to `app/`. You move `_app`/`_document` into a root `layout.tsx`, replace `getServerSideProps` with `async` components, and swap `next/router` for `next/navigation` (`useRouter`, `usePathname`, `useSearchParams`).

:::version[Version note]
The App Router arrived in **Next.js 13** (2022) and became stable in **13.4**. The Pages Router is **still supported**, but the docs recommend the App Router for new work, and new features (Cache Components, Server Actions, streaming) target it. In **Next.js 15+**, `params` and `searchParams` are Promises; **Next.js 16** removed the temporary sync access.
:::

## 🎯 Why do we use it?

Knowing both matters because:
- **New projects** should use the App Router: less JavaScript, simpler data loading, better layouts.
- **Many existing projects** still use the Pages Router. Interviewers may ask how you'd maintain or migrate one.
- Tutorials and Stack Overflow answers mix both. You must spot which router an example uses (`pages/` vs `app/`, `getServerSideProps` vs `async` components).

## ⚠️ Common mistakes

- **Copying `getServerSideProps` into an `app/` page.** It doesn't run there. Use an `async` Server Component.
- **Importing `useRouter` from `next/router` in the App Router.** Use `next/navigation`.
- **Defining the same URL in both folders.** That's a conflict.
- **Thinking the Pages Router is "removed".** It is still supported; it's just not where new features go.

## 🗣️ How to answer in an interview

> "Next.js has two routers. The Pages Router uses the pages folder. Every file is a route, and data is loaded with functions like getServerSideProps and getStaticProps. The App Router came in Next.js 13 and uses the app folder.
>
> The App Router is built on React Server Components. Pages are server components by default, so they can be async and await data directly, and they send less JavaScript. It also adds nested layouts that keep their state, special files like loading, error and not-found, streaming, and Server Actions for forms.
>
> For a new project I'd choose the App Router. For an existing Pages Router app, both folders can live together, so I'd migrate route by route.
>
> I haven't used Next.js in production yet — I've learned the App Router by studying it. [FILL IN: once you've built the practice project, mention it here.]"

## 🔁 Follow-up questions

### What replaces `getStaticProps` and `getStaticPaths` in the App Router?

The page fetches its own data. With caching, that result can be reused, like a static page. `generateStaticParams` replaces `getStaticPaths` to list which `[id]` values to build ahead of time.

### What replaces `_app.tsx` and `_document.tsx`?

The root `app/layout.tsx`. It renders `<html>` and `<body>` and wraps every page.

### Are Pages Router components Server Components?

No. In the Pages Router, components are rendered on the server and then hydrated, but they're all **client** components, so their JavaScript ships to the browser.

### How do API routes differ?

Pages Router: `pages/api/jobs.ts` exports one handler. App Router: `app/api/jobs/route.ts` exports one function per HTTP method (`GET`, `POST`, …). See [Route Handlers](topic:nextjs/route-handlers).

## ✅ Quick check

### 1. You see `export async function getServerSideProps()` in a file. Which router is it?

:::answer
The **Pages Router**. The App Router doesn't use this function.
:::

### 2. In the App Router, a folder `app/jobs/_components/` has a `Card.tsx` file. Is `/jobs/_components/Card` a URL?

:::answer
**No.** Only `page.tsx` or `route.ts` creates a URL. Also, folders starting with `_` are private and are never routes.
:::

### 3. True or false: you must migrate the whole app from `pages/` to `app/` in one go.

:::answer
**False.** Both folders can live in one project, so you can migrate one route at a time.
:::
