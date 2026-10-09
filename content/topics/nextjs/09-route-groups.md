---
title: Route groups and private folders
stack: nextjs
order: 9
level: Intermediate
mustKnow: false
askedFrequency: sometimes
summary:
  - "A route group is a folder with brackets, like (auth). It organises files but does NOT appear in the URL."
  - "app/(auth)/login/page.tsx is the page at /login, not /auth/login."
  - Each route group can have its own layout.tsx, so different parts of the site can look different.
  - "A private folder starts with an underscore, like _components. Next.js never turns it into a page."
  - Use them to keep a big app tidy without changing any URLs.
cards:
  - q: What is a route group in Next.js?
    a: A folder whose name is in brackets, like (marketing). It groups files and layouts, but its name is not part of the URL.
  - q: "What URL does app/(shop)/cart/page.tsx create?"
    a: "/cart. The (shop) folder is ignored in the URL."
  - q: Why use route groups?
    a: To organise a big app by section, and to give each section its own layout (for example a marketing layout and a dashboard layout).
  - q: What is a private folder?
    a: A folder that starts with an underscore, like _lib. Next.js skips it for routing, so you can safely keep helper files there.
  - q: Can two route groups both have a page for the same URL?
    a: No. If (a)/about/page.tsx and (b)/about/page.tsx both exist, Next.js gives an error, because both would be /about.
---

## 💡 What is it?

In the App Router, **folders become URLs**. But sometimes you want a folder only to **organise** files.

A **route group** is a folder with its name in **brackets**, like `(auth)`. Next.js uses it for organising, but **leaves it out of the URL**.

A **private folder** starts with an **underscore**, like `_components`. Next.js never makes a page from it.

## 🏠 Real-life example

Think of a **school building** with two blocks: a **junior block** and a **senior block**.

Classroom "7B" is in the senior block. But students just say "go to 7B". Nobody says "go to senior-block 7B".

- The **block** = the route group, like `(senior)`. It helps you organise.
- **Classroom 7B** = the page, like `/login`.
- **What students say** = the URL. The block name is not in it.
- Each block has its **own notice board design** = each route group can have its own `layout.tsx`.
- The **staff room** that students can't enter = a private folder like `_components`.

## 🧑‍💻 Code example

Create a project with `npx create-next-app@latest my-app` (choose TypeScript and the App Router). Then make these files.

```text
app/
├── (marketing)/              → route group: NOT in the URL
│   ├── layout.tsx            → layout for marketing pages only
│   └── about/page.tsx        → the page at /about
├── (dashboard)/              → another route group
│   ├── layout.tsx            → layout for dashboard pages only
│   ├── _components/          → private folder: never a route
│   │   └── Sidebar.tsx       → a normal component file
│   └── jobs/page.tsx         → the page at /jobs
└── layout.tsx                → root layout for every page
```

```tsx
// app/(dashboard)/layout.tsx
import Sidebar from './_components/Sidebar'; // import from the private folder (it is not a route)

export default function DashboardLayout({ children }: { children: React.ReactNode }) { // children = the page inside this group
  return ( // what this layout draws
    <div style={{ display: 'flex' }}> {/* sidebar and page side by side */}
      <Sidebar /> {/* the same sidebar on every dashboard page */}
      <main>{children}</main> {/* the current page goes here */}
    </div> // end of the wrapper
  ); // end of the returned JSX
} // end of DashboardLayout
```

```tsx
// app/(dashboard)/_components/Sidebar.tsx
export default function Sidebar() { // a normal React component
  return <nav>Jobs | Candidates</nav>; // simple menu text
} // end of Sidebar
```

```tsx
// app/(dashboard)/jobs/page.tsx
export default function JobsPage() { // the page component
  return <h1>Open jobs</h1>; // shown at /jobs (no "(dashboard)" in the URL)
} // end of JobsPage
```

Run `npm run dev` and open the pages.

```text
http://localhost:3000/jobs    → "Jobs | Candidates" menu + "Open jobs"
http://localhost:3000/about   → the marketing layout, no sidebar
http://localhost:3000/dashboard/jobs → 404, because the group name is not part of the URL
http://localhost:3000/_components    → 404, private folders are never pages
```

## 🔍 Deeper version

**What route groups are for:**

| Use | Example |
|---|---|
| Organise by section or team | `(marketing)`, `(shop)`, `(admin)` |
| Different layouts for different sections | a public layout vs a logged-in dashboard layout |
| A layout for only some pages at the same level | put `/cart` and `/checkout` in `(checkout)` with their own layout |
| Several root layouts | each group has its own `layout.tsx` with `<html>` and `<body>` |

**Several root layouts.** If you remove the top `app/layout.tsx`, each group must have its own root layout with `<html>` and `<body>`. Moving between pages in **different** root layouts causes a **full page reload**, not a fast client-side change.

**Conflicts.** Two groups cannot make the same URL. `(a)/about/page.tsx` and `(b)/about/page.tsx` both mean `/about`, and Next.js shows an error.

**Private folders (`_name`).** By default, only `page.tsx` and `route.ts` files become public. So a `components` folder without a `page.tsx` is already safe. An underscore makes this **clear to everyone** and avoids clashes with Next.js's special file names. Many teams also keep shared code **outside** `app/`, in folders like `src/components` or `src/lib`.

**Related folder conventions:**
- `[id]` = a [dynamic segment](topic:nextjs/dynamic-routes) (part of the URL).
- `(group)` = a route group (not part of the URL).
- `_folder` = a private folder (never routed).
- `@slot` = a parallel route slot (advanced; for showing two pages in one layout).

## 🎯 Why do we use it?

- **A big app stays tidy.** You can group files by feature without changing URLs.
- **Different looks for different sections.** The marketing pages and the logged-in dashboard can each have their own [layout](topic:nextjs/layouts).
- **Clean URLs.** Users see `/login`, not `/auth/login`.
- **Safe helper files.** Components and utilities can sit next to the pages that use them.

## ⚠️ Common mistakes

- **Expecting the group name in the URL.** `(auth)/login` is `/login`, not `/auth/login`.
- **Two groups making the same URL.** This causes a build error.
- **Forgetting the full reload.** Moving between pages with different root layouts reloads the whole page.
- **Thinking you need `_` for everything.** A folder without `page.tsx` is already not a route. The underscore just makes it obvious.

## 🗣️ How to answer in an interview

> "In the App Router, folders map to URL segments. A route group is a folder in brackets, like `(marketing)` or `(dashboard)`. It organises routes and can have its own layout, but its name is left out of the URL. So `app/(auth)/login/page.tsx` is just `/login`.
>
> I'd use route groups to give the public pages and the logged-in dashboard different layouts, without changing the URLs. Private folders start with an underscore, like `_components`. Next.js never routes them, so they're a safe place for helper components next to the pages.
>
> One thing to watch: two groups can't resolve to the same URL, and moving between different root layouts causes a full page reload. I haven't used Next.js in production yet, but I've learned these App Router conventions. [FILL IN: once you've built the practice project, mention how you used a route group in it.]"

## 🔁 Follow-up questions

### Can a route group have its own loading.tsx or error.tsx?

Yes. A route group is a normal folder for everything except the URL. It can have `layout.tsx`, `loading.tsx`, `error.tsx` and more. See [special files](topic:nextjs/special-files).

### How is (group) different from [id]?

`[id]` is part of the URL and its value changes, like `/jobs/42`. `(group)` is never part of the URL. It only organises files.

### Where should shared components live: in `app/` or outside it?

Both work. Teams often keep page-specific components in a private folder next to the page, and shared ones in `src/components`. Pick one style and stay consistent.

### Why would you want more than one root layout?

When two parts of a site are completely different, like a marketing site and an admin app with different `<html>` setups. Each gets its own root layout inside its route group.

## ✅ Quick check

### 1. What URL does `app/(shop)/products/[id]/page.tsx` create for product 7?

:::answer
**`/products/7`.** `(shop)` is ignored in the URL, and `[id]` is filled with `7`.
:::

### 2. Which folder can never become a route?

- A) `app/reports`
- B) `app/_utils`
- C) `app/(admin)`

:::answer
**B) `app/_utils`.** Underscore folders are private. A can become `/reports` if it has a `page.tsx`. C is a route group; its pages still become routes, just without `(admin)` in the URL.
:::

### 3. True or false: `app/(a)/about/page.tsx` and `app/(b)/about/page.tsx` can both exist.

:::answer
**False.** Both would be `/about`. Next.js reports a conflict.
:::
