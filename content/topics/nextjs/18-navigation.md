---
title: "Link, useRouter and navigation"
stack: nextjs
order: 18
level: Basic
mustKnow: false
askedFrequency: common
summary:
  - "<Link href=\"/jobs\"> from next/link moves between pages without a full page reload. It also preloads the page."
  - "useRouter() from next/navigation lets you move in code, e.g. router.push('/login') after a form. It works only in Client Components."
  - usePathname() tells you the current URL path. It is handy for highlighting the active menu item.
  - "redirect('/login') sends the user away from inside server code. It answers with status 307."
  - "In the App Router, import from next/navigation, not the old next/router."
cards:
  - q: Why use <Link> instead of a normal <a> tag?
    a: Link changes the page without a full reload, keeps the shared layout on screen, and preloads the next page so it opens fast.
  - q: How do you navigate in code after a form submit?
    a: "In a Client Component, call useRouter() from next/navigation, then router.push('/jobs')."
  - q: How do you redirect from a Server Component?
    a: "Call redirect('/login') from next/navigation. Next.js stops rendering and sends a 307 redirect."
  - q: Which import is correct in the App Router — next/router or next/navigation?
    a: next/navigation. next/router belongs to the old Pages Router.
  - q: How do you highlight the current menu link?
    a: Use usePathname() in a Client Component and compare it with each link's href.
---

## 💡 What is it?

Navigation means **moving from one page to another**.

Next.js gives you three main tools:
- **`<Link>`** for links people click.
- **`useRouter()`** to move in code, for example after saving a form.
- **`redirect()`** to send the user somewhere else from server code.

All three change the page **without a full browser reload**. That makes the app feel fast.

## 🏠 Real-life example

Think of a **big school building with signboards**.

- **Signboards on the walls** = `<Link>`. You see one and walk to that room. The building around you stays the same.
- **A teacher saying "Go to the library now"** = `router.push('/library')`. You move because someone told you, not because you saw a sign.
- **The watchman at a locked lab saying "Not allowed. Go to the office first"** = `redirect('/login')`. You are turned away at the door.
- **Your class-ID card showing which room you're in** = `usePathname()`.
- **A helper who opens the next room's door before you reach it** = Link's **prefetching**.

## 🧑‍💻 Code example

In a Next.js App Router project (`npx create-next-app@latest`), add these two files. Run `npm run dev` and open `http://localhost:3000`.

**`app/page.tsx`** (a Server Component)

```tsx
import Link from 'next/link';                                  // Next.js link component
import NavInfo from './nav-info';                              // our small Client Component (below)

export default function Home() {                               // the page at "/"
  return (                                                     // what this page shows
    <main>                                                     {/* a wrapper for the page */}
      <Link href="/jobs">See all jobs</Link>                   {/* click → go to /jobs, no full reload */}
      <NavInfo />                                              {/* shows the path + a button */}
    </main>                                                    // end of the wrapper
  );                                                           // end of return
}                                                              // end of Home
```

**`app/nav-info.tsx`** (a Client Component)

```tsx
'use client';                                                  // hooks need the browser, so this is a Client Component
import { usePathname, useRouter } from 'next/navigation';      // App Router hooks (NOT next/router)

export default function NavInfo() {                            // a small component
  const pathname = usePathname();                              // the current path, e.g. "/"
  const router = useRouter();                                  // lets us move to another page in code
  return (                                                     // what it shows
    <div>                                                      {/* a box */}
      <span>You are on: {pathname}</span>                      {/* shows "You are on: /" */}
      <button onClick={() => router.push('/login')}>Log in</button>  {/* click → go to /login */}
    </div>                                                     // end of the box
  );                                                           // end of return
}                                                              // end of NavInfo
```

```text
On screen at http://localhost:3000:
  See all jobs   You are on: /   [Log in]

Click "See all jobs" → the URL becomes /jobs with no white flash.
Click "Log in"       → router.push sends you to /login.
```

## 🔍 Deeper version

**What `<Link>` does for you:**
- It renders a real `<a href>` tag, so search engines and "open in new tab" still work.
- It changes pages on the client side. Shared [layouts](topic:nextjs/layouts) stay on screen, and only the new part renders.
- In production, it **prefetches** links that appear on screen, so the next page is ready before the click. Turn this off with `prefetch={false}` for rarely used links.

**`useRouter()` methods** (Client Components only):

| Method | What it does |
|---|---|
| `router.push('/jobs')` | Go to a page and add it to history |
| `router.replace('/jobs')` | Go to a page without adding history (Back skips it) |
| `router.back()` | Go back one page |
| `router.refresh()` | Re-fetch the current page's server data without losing client state |
| `router.prefetch('/jobs')` | Load a page early |

**Other hooks from `next/navigation`:** `usePathname()` for the path, `useSearchParams()` for `?page=2`, and `useParams()` for `[id]` values.

**`redirect()` in server code.** You can call `redirect('/login')` in Server Components, Route Handlers and Server Actions. It throws a special error, so the code after it never runs. In a real Next.js 16 test, a Server Component calling `redirect('/login')` answered **307** with a `Location: /login` header. Use `permanentRedirect()` for a permanent move (308).

:::version[Version note]
The old Pages Router used `import { useRouter } from 'next/router'`, with `router.query` and `router.pathname`. In the App Router, import from **`next/navigation`**, and use `usePathname()`, `useSearchParams()` and `useParams()` instead. Mixing them up is a common error.
:::

## 🎯 Why do we use it?

- **Speed.** No full reload means no white flash. Shared parts like the header stay on screen.
- **Prefetching.** Pages often open almost instantly.
- **Control.** You can move users after an action, like saving a form, or block pages they can't see.

## ⚠️ Common mistakes

- **Importing `useRouter` from `next/router`** in the App Router. It throws an error. Use `next/navigation`.
- **Using `useRouter` or `usePathname` in a Server Component.** Hooks only work in Client Components (`'use client'`).
- **Using a plain `<a>` for internal links.** It works, but it does a full reload and loses the speed benefits.
- **Wrapping `redirect()` in `try/catch`.** `redirect` works by throwing. If you catch it, the redirect doesn't happen.

## 🗣️ How to answer in an interview

> "In the App Router, I use the Link component from next/link for normal links. It renders a real anchor tag, changes the page without a full reload, keeps shared layouts on screen, and prefetches visible links in production.
>
> To navigate in code, like after submitting a form, I use useRouter from next/navigation in a Client Component and call router.push or router.replace. usePathname gives the current path, which helps highlight the active menu item.
>
> In server code, I call redirect, for example to send a logged-out user to /login. It answers with a 307.
>
> I haven't used Next.js in production yet. But I've used React Router heavily in React apps, and the ideas are very similar."

[FILL IN: once you've built the practice project, mention one place you used Link or redirect.]

## 🔁 Follow-up questions

### What's the difference between `router.push` and `router.replace`?

`push` adds a new entry to browser history, so Back returns to the old page. `replace` swaps the current entry, so Back skips it. Use `replace` after login, so Back doesn't return to the login page.

### What does `router.refresh()` do?

It asks the server for fresh data for the current page, then updates the screen. Client state, like text typed in an input, is kept. It's useful after a change that affects server data.

### How is this different from React Router?

The ideas match: `<Link>`, a hook to navigate, and params. But in Next.js, routes come from **folders**, not a route config. Some code runs on the server, so `redirect()` exists for server code. See [React Router](topic:react/react-router).

### Can I turn off prefetching?

Yes: `<Link href="/reports" prefetch={false}>`. That makes sense for heavy pages people rarely open.

## ✅ Quick check

### 1. This file has no `'use client'` line. Will it work?

```tsx
import { useRouter } from 'next/navigation';                   // the router hook
export default function Page() {                               // a page component
  const router = useRouter();                                  // use the hook
  return <button onClick={() => router.push('/jobs')}>Go</button>; // a button that navigates
}
```

:::answer
**No.** Without `'use client'`, this is a Server Component. Hooks and `onClick` only work in Client Components. Add `'use client'` at the top, or move the button into a small client component.
:::

### 2. After login, the user presses Back and sees the login page again. Which method should you use?

- A) `router.push('/dashboard')`
- B) `router.replace('/dashboard')`
- C) `router.back()`

:::answer
**B.** `replace` swaps the login page out of history, so Back doesn't return to it.
:::

### 3. What status code does `redirect('/login')` send from a Server Component?

:::answer
**307** (Temporary Redirect), with a `Location: /login` header. `permanentRedirect()` sends 308.
:::
