---
title: "File-based routing: folders and page.tsx"
stack: nextjs
order: 5
level: Basic
mustKnow: true
askedFrequency: very common
summary:
  - In the App Router, folders become URL parts. app/jobs/page.tsx is the page at /jobs.
  - "A folder is only a public URL when it has a page.tsx (for a page) or route.ts (for an API)."
  - Nested folders make nested URLs. app/jobs/new/page.tsx is /jobs/new.
  - Use the Link component from next/link to move between pages without a full reload.
  - "Folders in (brackets) and _underscore folders never appear in the URL; [square brackets] make dynamic parts."
cards:
  - q: Which file makes the URL /jobs?
    a: app/jobs/page.tsx. The folder name is the URL part, and page.tsx makes it public.
  - q: If app/jobs/ has only a Card.tsx file and no page.tsx, is /jobs a page?
    a: No. Without page.tsx (or route.ts) the folder is not a public route, so /jobs gives a 404.
  - q: How do you link between pages in Next.js?
    a: With Link from next/link, e.g. Link href="/jobs". It navigates without a full page reload and can prefetch the next page.
  - q: What does a folder named [id] do?
    a: It creates a dynamic segment. app/jobs/[id]/page.tsx matches /jobs/1, /jobs/abc and so on.
  - q: Which folder names never appear in the URL?
    a: Route groups in brackets like (marketing) and private folders starting with an underscore like _components.
---

## 💡 What is it?

In Next.js you don't write a list of routes in code. **Your folders are the routes.**

Inside the `app/` folder, every folder is one **part of the URL**. A special file named **`page.tsx`** inside a folder says "show this page at this URL".

So `app/jobs/page.tsx` is the page at **`/jobs`**.

## 🏠 Real-life example

Think of a **school building with room signs**.

- The **building entrance** = `app/` (the URL `/`).
- A **corridor** = a folder, like `jobs/`.
- A **classroom door sign** = `page.tsx`. Without the sign, nobody can enter.
- A **room inside a room** = a nested folder (`jobs/new/` → `/jobs/new`).
- A **storeroom with no sign** = a folder without `page.tsx`. It exists, but visitors can't go in.
- **Walking through inside corridors** = `<Link>`. You move between rooms without going outside and coming back in through the main gate (a full page reload).

## 🧑‍💻 Code example

Make three pages and link them. Start with `npx create-next-app@latest my-app --yes`, then create these files.

**File: `app/about/page.tsx`** → URL `/about`

```tsx
// app/about/page.tsx: the folder "about" + page.tsx = the URL /about
export default function AboutPage() {          // the default export is what Next.js shows
  return <h1>About us</h1>;                    // the content of /about
}                                              // end of AboutPage
```

**File: `app/jobs/page.tsx`** → URL `/jobs`

```tsx
import Link from 'next/link';                  // Next.js link component for moving between pages

const jobs = [                                 // fake data: two jobs
  { id: '1', title: 'Node.js Developer' },     // job 1
  { id: '2', title: 'React Developer' },       // job 2
];                                             // end of the jobs list

export default function JobsPage() {           // the page shown at /jobs
  return (                                     // what this page renders
    <main>                                     {/* main content area */}
      <h1>Jobs</h1>                             {/* page heading */}
      <ul>                                     {/* the list of jobs */}
        {jobs.map((job) => (                   // one list item per job
          <li key={job.id}>                    {/* key = the job's unique id */}
            <Link href={`/jobs/${job.id}`}>{job.title}</Link> {/* goes to /jobs/1 or /jobs/2 */}
          </li>                                // end of one list item
        ))}                                    {/* end of the loop */}
      </ul>                                    {/* end of the list */}
      <Link href="/about">About us</Link>      {/* a link to the /about page */}
    </main>                                    // end of the main area
  );                                           // end of what JobsPage returns
}                                              // end of JobsPage
```

Run `npm run dev` and open the pages:

```text
http://localhost:3000/about  →  About us
http://localhost:3000/jobs   →  Jobs
                                • Node.js Developer
                                • React Developer
                                About us
http://localhost:3000/hello  →  404 This page could not be found.   (no app/hello/page.tsx)
```

Click "Node.js Developer". The URL changes to `/jobs/1` **without a full page reload**. That page needs its own file — see [dynamic routes](topic:nextjs/dynamic-routes).

## 🔍 Deeper version

**Route segments.** Each folder is a **segment**. The URL `/jobs/1/edit` has three segments: `jobs`, `1` and `edit`. Next.js matches folders to segments from left to right.

| File | URL |
|---|---|
| `app/page.tsx` | `/` |
| `app/jobs/page.tsx` | `/jobs` |
| `app/jobs/new/page.tsx` | `/jobs/new` |
| `app/jobs/[id]/page.tsx` | `/jobs/1`, `/jobs/abc` (dynamic) |
| `app/docs/[...slug]/page.tsx` | `/docs/a`, `/docs/a/b` (catch-all) |
| `app/(marketing)/pricing/page.tsx` | `/pricing` (group name hidden) |
| `app/jobs/_components/Card.tsx` | not a route (private folder) |

**Only `page` and `route` are public.** You can keep components, tests and helpers inside route folders. They never become URLs unless they're named `page.tsx` or `route.ts`. A folder can't have **both** `page.tsx` and `route.ts`.

**`<Link>` and prefetching.** `<Link>` renders a normal `<a>` tag. When the user clicks it, Next.js swaps the page in the browser instead of reloading everything. It also **prefetches** linked routes that are visible on screen, so clicks feel instant. For navigation in code (after a form submit), use `useRouter()` from `next/navigation` inside a Client Component. See [navigation](topic:nextjs/navigation).

**Other special files** in a route folder: `layout.tsx`, `loading.tsx`, `error.tsx`, `not-found.tsx`. See [layouts](topic:nextjs/layouts) and [special files](topic:nextjs/special-files). Route groups and private folders are covered in [route groups](topic:nextjs/route-groups).

**Typed routes.** Next.js generates types from your folders. `PageProps<'/jobs/[id]'>` and `LayoutProps<'/'>` give correct prop types without writing them by hand.

## 🎯 Why do we use it?

- **No router config to maintain.** Add a folder → you have a page. Delete it → the page is gone.
- **Easy to find code.** The URL `/jobs/new` tells you exactly where the file is.
- **Layouts, loading and error UI attach to the same folders**, so each part of the site can have its own.
- **Code-splitting per route** happens automatically. Each page loads only its own JavaScript.

## ⚠️ Common mistakes

- **Naming the file `index.tsx` or `Jobs.tsx`.** In the App Router it must be `page.tsx`.
- **Forgetting the default export.** `page.tsx` must `export default` a component.
- **Using `<a href>` for internal links.** It works, but it does a full page reload. Use `<Link>`.
- **Importing from `next/router`.** That's the Pages Router. Use `next/navigation`.

## 🗣️ How to answer in an interview

> "Next.js uses file-based routing. In the App Router, every folder inside app is one segment of the URL, and a page.tsx file makes that folder a public page. So app/jobs/page.tsx is /jobs, and app/jobs/new/page.tsx is /jobs/new.
>
> A folder without page.tsx isn't a route, so I can keep components next to the page safely. Square brackets like [id] create dynamic segments, folders in round brackets group routes without changing the URL, and underscore folders are private.
>
> To move between pages I use the Link component. It navigates on the client without a full reload, and it prefetches visible links.
>
> In my production React work I used React Router, where routes are declared in code [FILL IN: confirm React Router version used at SkillKeepr]. Next.js replaces that config with folders."

## 🔁 Follow-up questions

### How is this different from React Router?

React Router declares routes **in code** (`<Route path="/jobs" …>` or a route config object). Next.js declares them **with folders**. The idea is the same; the place is different. See [React Router](topic:react/react-router).

### How do you make a 404 page?

Unknown URLs show Next.js's default 404. To customise it, add `app/not-found.tsx`. See [special files](topic:nextjs/special-files).

### Can two folders create the same URL?

Yes, by accident — for example `app/(shop)/about/page.tsx` and `app/(blog)/about/page.tsx` both make `/about`. Next.js reports an error, so keep URLs unique.

### What is prefetching?

Loading a page's code and data **before** the user clicks, so the navigation is instant. `<Link>` does it automatically for links in the viewport.

## ✅ Quick check

### 1. Which file creates the URL `/jobs/new`?

- A) `app/jobs-new/page.tsx`
- B) `app/jobs/new/page.tsx`
- C) `app/jobs/new.tsx`

:::answer
**B) `app/jobs/new/page.tsx`.** Each folder is one URL segment, and the file must be named `page.tsx`.
:::

### 2. `app/reports/` contains only `Chart.tsx`. What does `/reports` show?

:::answer
A **404 page**. Without `page.tsx` (or `route.ts`), the folder is not a public route.
:::

### 3. Why use `<Link href="/about">` instead of `<a href="/about">`?

:::answer
`<Link>` navigates in the browser **without a full page reload** and **prefetches** the page, so it's faster. A plain `<a>` reloads the whole site.
:::
