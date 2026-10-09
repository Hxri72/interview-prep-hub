---
title: "proxy.ts (called middleware.ts before v16)"
stack: nextjs
order: 21
level: Intermediate
mustKnow: false
askedFrequency: common
summary:
  - proxy.ts is one file in the project root that runs BEFORE a request reaches a page or route. Next.js 16 renamed it from middleware.ts.
  - You export a function named proxy. It can redirect, rewrite, add headers or let the request continue with NextResponse.next().
  - "A config.matcher (e.g. '/dashboard/:path*') limits which URLs it runs on."
  - Use it for quick checks, like "no session cookie → go to /login". Still check auth again in the page or API itself.
  - In Next.js 16, proxy runs on the Node.js runtime, so Node APIs work there.
cards:
  - q: What is proxy.ts in Next.js 16?
    a: A file in the project root whose proxy function runs before matching requests reach a page. It's the new name for middleware.ts.
  - q: What can the proxy function do?
    a: Redirect (NextResponse.redirect), rewrite to another path (NextResponse.rewrite), set headers or cookies, or let the request continue (NextResponse.next()).
  - q: How do you make proxy run only for /dashboard pages?
    a: "Export config = { matcher: ['/dashboard/:path*'] }."
  - q: Is a cookie check in proxy enough to protect a page?
    a: No. Proxy is a fast first gate, but the page, Server Action or Route Handler must still verify the session, because those can be reached in other ways.
  - q: What happens if a project has both middleware.ts and proxy.ts?
    a: The build fails and asks you to keep only proxy.ts. A middleware.ts on its own still works in v16 but shows a deprecation warning.
---

## 💡 What is it?

`proxy.ts` is a special file in the root of a Next.js project. Its `proxy` function runs **before** a request reaches your page or API.

It can look at the request and decide:
- let it continue,
- send the user somewhere else (redirect),
- quietly show a different path (rewrite),
- or add headers.

In **Next.js 16**, this file was **renamed** from `middleware.ts` to `proxy.ts`. The idea is the same.

## 🏠 Real-life example

Think of **the security guard at the school gate**.

- **The guard** = the `proxy` function. Everyone passes the guard before entering.
- **"Show your ID card"** = checking for a session [cookie](glossary:cookie).
- **"No ID? Go to the office first"** = `NextResponse.redirect('/login')`.
- **"Fine, go in"** = `NextResponse.next()`.
- **The guard only checks people going to the staff block** = the `matcher` (only some URLs).
- **The staff room still has its own lock** = the page still checks the session itself. The guard is not the only protection.

## 🧑‍💻 Code example

In a Next.js 16 App Router project (`npx create-next-app@latest`), add this file **in the project root** (next to `package.json`, or inside `src/` if you use it). Run `npm run build` and then `npm start`.

**`proxy.ts`**

```ts
import { NextResponse, type NextRequest } from 'next/server';  // tools to read the request and answer

export function proxy(request: NextRequest) {                   // Next.js runs this before matching requests
  const hasSession = request.cookies.has('session');            // is there a cookie named "session"?
  if (!hasSession) {                                            // no cookie → not logged in
    return NextResponse.redirect(new URL('/login', request.url)); // send them to /login (same site)
  }                                                             // end of the check
  return NextResponse.next();                                   // has the cookie → continue to the page
}                                                               // end of proxy

export const config = {                                         // settings for this proxy
  matcher: ['/dashboard/:path*'],                               // run ONLY for /dashboard and anything under it
};                                                              // end of config
```

Real results from a Next.js 16 test app:

```text
$ curl -i http://localhost:3000/dashboard
HTTP/1.1 307 Temporary Redirect
location: /login                         ← no cookie, so the proxy redirected

$ curl -H "Cookie: session=abc123" http://localhost:3000/dashboard
<h1>Welcome ...</h1>                     ← cookie present, so the page rendered

next build output also lists:  ƒ Proxy (Middleware)
```

## 🔍 Deeper version

**What it can return:**

| Return | Effect |
|---|---|
| `NextResponse.next()` | Continue normally (you can add headers to it) |
| `NextResponse.redirect(url)` | Tell the browser to go to another URL (the URL changes) |
| `NextResponse.rewrite(url)` | Serve another path, but keep the URL the user sees |
| `new Response(...)` / `NextResponse.json(...)` | Answer directly, e.g. a 401 for an API |

**The matcher.** Without a `matcher`, proxy runs for **every** request, including images and static files. Always limit it. Patterns like `'/dashboard/:path*'` work, and you can also exclude paths such as `/_next/static`.

**Runtime.** In Next.js 16, proxy runs on the **Node.js runtime** by default. In a test app, a proxy that used `node:fs` worked and added a header. (Old `middleware.ts` used the limited Edge runtime by default.) Even so, keep proxy **fast**: it runs on many requests.

**Proxy is not your only security check.** Proxy is great for quick redirects. But it should not be the only place you check auth:
- A matcher mistake can skip a path.
- Server Actions and Route Handlers are reachable on their own.

So also verify the session inside the page, the Server Action or the Route Handler. The Next.js docs recommend this too, after a 2025 security issue where middleware checks could be bypassed in older versions.

**Good uses:** redirect logged-out users, redirect old URLs, A/B testing with rewrites, adding security headers, choosing a language from a header, and picking a tenant from the subdomain.

:::version[Version note]
In **Next.js 16**, `middleware.ts` became **`proxy.ts`**, and the exported function is named `proxy`. A `middleware.ts` file alone still works but prints a deprecation warning. If both files exist, the build fails. To migrate, run `npx @next/codemod@canary middleware-to-proxy .` (this command is shown in the Next.js 16.4 warning message).
:::

## 🎯 Why do we use it?

- **One place for request-level rules.** You don't repeat "if not logged in, go to /login" in every page.
- **It runs before rendering.** A logged-out user is redirected before the page does any work.
- **URL tricks.** Rewrites and redirects without touching page code.

## ⚠️ Common mistakes

- **Trusting proxy as the only auth check.** Verify the session again in pages, Server Actions and Route Handlers.
- **No matcher.** Proxy then runs for every image and script, which slows the site.
- **Heavy work in proxy**, like slow database queries. Keep it light, such as checking a cookie or reading a header.
- **Using the old name in Next.js 16.** Rename `middleware.ts` → `proxy.ts`, and the function to `proxy`.

## 🗣️ How to answer in an interview

> "proxy.ts is a file in the project root that runs before a request reaches a page or route. Next.js 16 renamed it from middleware.ts. I export a function called proxy. It can let the request continue with NextResponse.next(), redirect, rewrite, or add headers. I always set a matcher so it only runs on the paths that need it, like /dashboard.
>
> A typical use is redirecting logged-out users to /login when there's no session cookie. But I'd treat that as a first gate only. The page, Server Actions and Route Handlers still verify the session themselves.
>
> I haven't used Next.js in production yet. It's very similar to Express middleware, which I've written a lot of: code that runs before the main handler and can stop or change the request."

[FILL IN: once you've built the practice project, mention the proxy rule you added.]

## 🔁 Follow-up questions

### How is proxy different from Express middleware?

Express middleware runs inside your app for each route, in a chain, and can change `req`. Next.js proxy is **one** function that runs before routing, for matched paths. It mainly redirects, rewrites or sets headers. It's not a chain of handlers. See [Express middleware](topic:express/middleware).

### What's the difference between redirect and rewrite?

A **redirect** tells the browser to go to a new URL, so the address bar changes. A **rewrite** serves different content but keeps the URL the user sees.

### Can proxy read the request body?

You can, but don't. Proxy should be fast and only look at the URL, headers and cookies. Handle bodies in Route Handlers or Server Actions.

### How would you use proxy in a multi-tenant app?

Read the subdomain from the `host` header, for example `acme.app.com`. Then rewrite to a tenant path or set a header with the tenant name. The server code still has to check that the logged-in user belongs to that tenant. See [multi-tenant architecture](topic:architecture/multi-tenant).

## ✅ Quick check

### 1. A Next.js 16 project has both `middleware.ts` and `proxy.ts`. What happens on build?

:::answer
The build **fails** with an error asking you to use only `proxy.ts`.
:::

### 2. The proxy checks for a session cookie on `/dashboard/:path*`. Is the Server Action that deletes a job also protected?

:::answer
**Not necessarily.** Server Actions can be called outside that matcher. Always check the session inside the Server Action itself.
:::

### 3. Which return keeps the URL `/old-jobs` in the address bar but shows the `/jobs` page?

- A) `NextResponse.redirect(new URL('/jobs', request.url))`
- B) `NextResponse.rewrite(new URL('/jobs', request.url))`
- C) `NextResponse.next()`

:::answer
**B) rewrite.** A redirect would change the address bar to `/jobs`.
:::
