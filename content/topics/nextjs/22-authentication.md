---
title: "Authentication in Next.js (overview)"
stack: nextjs
order: 22
level: Intermediate
mustKnow: false
askedFrequency: common
summary:
  - Authentication in Next.js usually means a session stored in an HttpOnly cookie, often a signed JWT or a session ID.
  - Next.js has no login system built in. Teams use a library (like Auth.js or Better Auth) or build their own with JWT cookies.
  - "Check the session in many places: proxy for quick redirects, and again in pages, Server Actions and Route Handlers."
  - "Read cookies on the server with await cookies() from next/headers. Set them only in Server Actions or Route Handlers."
  - "A good pattern: one small verifySession() helper that every server entry point calls."
cards:
  - q: Does Next.js come with authentication built in?
    a: No. It gives you the tools (cookies, proxy, Server Actions). You add a library like Auth.js or Better Auth, or write your own JWT-cookie logic.
  - q: Where should you store the session in a Next.js app?
    a: In an HttpOnly, Secure, SameSite cookie. JavaScript in the browser can't read it, which protects it from XSS.
  - q: Is checking the cookie in proxy.ts enough?
    a: No. Proxy is a fast first gate. Pages, Server Actions and Route Handlers must still verify the session, because they can be reached directly.
  - q: How do you read a cookie in a Server Component?
    a: "const token = (await cookies()).get('session')?.value — cookies() comes from next/headers and is async in recent versions."
  - q: Why verify the session inside a Server Action?
    a: A Server Action is a real endpoint that anyone can call. Without a check inside it, a logged-out or wrong user could run it.
---

## 💡 What is it?

[Authentication](glossary:authentication) means **checking who the user is**. [Authorisation](glossary:authorization) means **checking what they are allowed to do**.

Next.js doesn't come with a login system. It gives you the building blocks:
- [cookies](glossary:cookie) to store the session,
- `proxy.ts` to redirect early,
- server code (pages, Server Actions, Route Handlers) to check the user.

You either use a library or build it yourself with a signed token ([JWT](glossary:jwt)) in a cookie.

## 🏠 Real-life example

Think of **a school with ID cards**.

- **Getting your ID card from the office on day one** = logging in. The server gives you a signed session cookie.
- **Keeping the card in a locked pouch you can't open, only the guard's machine can read** = an HttpOnly cookie. Browser JavaScript can't read it.
- **The gate guard glancing at your card** = `proxy.ts`. A quick check before you enter.
- **The lab teacher checking your card again before you touch chemicals** = the page or Server Action verifying the session again.
- **Some rooms only for prefects** = authorisation, like role checks.

## 🧑‍💻 Code example

This is a **simplified custom setup** to show the idea. For a real app, a library handles many more cases. Install the JWT helper: `npm install jose`. Add the session secret to `.env.local` as `SESSION_SECRET=` plus a long random string.

**`lib/session.ts`** (server-only helper)

```ts
import 'server-only';                                           // build fails if client code ever imports this file
import { cookies } from 'next/headers';                          // read/write cookies on the server
import { SignJWT, jwtVerify } from 'jose';                       // create and check signed JWTs
import { redirect } from 'next/navigation';                      // send the user somewhere else

const key = new TextEncoder().encode(process.env.SESSION_SECRET); // the secret as bytes (no NEXT_PUBLIC_!)

export async function createSession(userId: string) {           // call this after a correct login
  const token = await new SignJWT({ userId })                    // the data inside the token
    .setProtectedHeader({ alg: 'HS256' })                        // HS256 = sign with our shared secret
    .setExpirationTime('1h')                                      // the token stops working after 1 hour
    .sign(key);                                                   // sign it with the secret
  (await cookies()).set('session', token, {                      // save it in a cookie named "session"
    httpOnly: true,                                               // browser JavaScript can't read it (XSS-safe)
    secure: true,                                                 // only sent over HTTPS
    sameSite: 'lax',                                              // not sent on most cross-site requests (CSRF help)
    maxAge: 60 * 60,                                              // cookie lives 3600 seconds = 1 hour
    path: '/',                                                    // sent for every path on the site
  });                                                             // end of cookie options
}                                                                 // end of createSession

export async function verifySession() {                          // call this in EVERY protected server entry point
  const token = (await cookies()).get('session')?.value;          // read the cookie (undefined if missing)
  if (!token) redirect('/login');                                 // no cookie → go to login (stops here)
  try {                                                           // jwtVerify throws if the token is bad
    const { payload } = await jwtVerify(token, key);              // check the signature and expiry
    return { userId: payload.userId as string };                  // a valid session → return who it is
  } catch {                                                       // tampered or expired token
    redirect('/login');                                           // treat it like no session
  }                                                               // end of try/catch
}                                                                 // end of verifySession
```

**`app/dashboard/page.tsx`**

```tsx
import { verifySession } from '@/lib/session';                   // our helper

export default async function Dashboard() {                       // a Server Component
  const { userId } = await verifySession();                       // check the user; redirects if not logged in
  return <h1>Welcome, user {userId}</h1>;                         // only logged-in users reach this line
}                                                                 // end of Dashboard
```

```text
No cookie         → GET /dashboard redirects to /login (307)
Valid cookie      → "Welcome, user 42"
Tampered cookie   → jwtVerify fails → redirect to /login
```

These are real results from a Next.js 16 test app with this exact code. Use the same `verifySession()` call at the top of Server Actions and Route Handlers.

## 🔍 Deeper version

**Your choices:**

| Option | What it is | When to pick it |
|---|---|---|
| **A library** (Auth.js, Better Auth, Clerk and others) | Ready-made login, OAuth ("Login with Google"), sessions, and sometimes a UI | Most new projects. Less to get wrong |
| **Custom JWT cookie** (like above) | You sign a token and check it yourself | Simple apps, or when you must match an existing backend |
| **Your existing backend does auth** | The Express/Node API sets the cookie; Next.js forwards it | When a separate API already owns users |

**Stateless vs database sessions.** A signed JWT in a cookie is **stateless**. The server checks the signature, with no database lookup. But it's hard to revoke early. A **database session** stores a random session ID in the cookie and looks it up on every request. It's easy to revoke, but each check needs a lookup. See [logout and token revocation](topic:rest-auth/logout-revocation).

**Where to check (defence in depth):**
1. **`proxy.ts`**: optimistic, fast redirect if the cookie is missing. Don't do database calls here. See [proxy](topic:nextjs/proxy).
2. **Pages and layouts**: call `verifySession()`. Careful: a layout doesn't re-run on every navigation, so checks in pages are more reliable.
3. **Server Actions and Route Handlers**: always call it. They are real endpoints.
4. **Data access**: a "data access layer" that checks the user before returning data. This is the strongest pattern.

**Cookie rules in the App Router:**
- `cookies()` from `next/headers` is **async** in recent versions: `await cookies()`.
- You can **read** cookies in Server Components, but you can only **set or delete** them in Server Actions, Route Handlers or proxy.

Cookie flags matter: `httpOnly`, `secure`, `sameSite`. See [where to store tokens](topic:rest-auth/token-storage).

:::version[Version note]
In Next.js 15+, `cookies()` and `headers()` return Promises, so you `await` them. In Next.js 16, `middleware.ts` became `proxy.ts`. Old tutorials using `getServerSideProps` and `next-auth` v4 belong to the Pages Router.
:::

## 🎯 Why do we use it?

- **Protect private pages and data.** Only logged-in users see their dashboard.
- **Safe session storage.** HttpOnly cookies keep tokens away from browser JavaScript, so an [XSS](glossary:xss) bug can't steal them.
- **One app, one check.** A shared `verifySession()` helper keeps the rule in one place.

## ⚠️ Common mistakes

- **Only checking auth in `proxy.ts`.** Server Actions and Route Handlers stay open. Check inside them too.
- **Storing the token in `localStorage`.** Any XSS bug can read it. Use an HttpOnly cookie.
- **Putting the signing secret in a `NEXT_PUBLIC_` variable.** It goes to the browser. Keep it server-only.
- **Trying to set a cookie in a Server Component.** It throws an error. Set cookies in Server Actions or Route Handlers.

## 🗣️ How to answer in an interview

> "Next.js doesn't ship a login system, so I'd use a library like Auth.js or Better Auth, or a simple custom setup: after login, the server signs a JWT and stores it in an HttpOnly, Secure, SameSite cookie. Browser JavaScript can't read that cookie, which protects it from XSS.
>
> I'd write one verifySession helper that reads the cookie with `await cookies()` and checks the signature and expiry. Then I'd call it everywhere that matters: a quick redirect in proxy.ts, and a real check inside pages, Server Actions and Route Handlers, because those are all reachable directly.
>
> I haven't used Next.js in production. In my current work, auth uses HttpOnly JWT cookies too, so the ideas carry over."

[FILL IN: confirm you're comfortable saying the last line — your resume says you worked on authentication modules in the shared backend library.]

## 🔁 Follow-up questions

### Why not just check auth in proxy.ts?

Proxy only runs on matched paths, and it's meant to be fast. Server Actions and Route Handlers can be called directly. Also, a 2025 Next.js security issue let attackers skip middleware in older versions. So the real checks belong in server code that touches data.

### Stateless JWT or database sessions — which would you choose?

For small apps, a short-lived JWT in a cookie is simple and fast. If I need instant logout or "log out all devices", I'd use database sessions, or short JWTs with a refresh token stored on the server.

### How does "Login with Google" fit in?

That's OAuth/OpenID Connect. A library handles the redirect to Google, the callback and the session cookie. See [OAuth](topic:rest-auth/oauth).

### How do you protect a Server Action?

Call `verifySession()` at the top of the action. Then check the role or ownership before changing data, for example "can this user edit this job?"

## ✅ Quick check

### 1. Where is it safe to SET a cookie in the App Router?

- A) Inside a Server Component's render
- B) Inside a Server Action or Route Handler
- C) Inside a Client Component with `document.cookie` for an HttpOnly cookie

:::answer
**B.** Server Components can only read cookies. HttpOnly cookies can't be set or read by browser JavaScript at all.
:::

### 2. Your proxy redirects logged-out users away from `/admin/*`. Do you still need a check inside the `deleteJob` Server Action?

:::answer
**Yes.** The Server Action is a real endpoint that can be called on its own. Always verify the session and permissions inside it.
:::

### 3. True or false: storing the session JWT in `localStorage` is as safe as an HttpOnly cookie.

:::answer
**False.** Any JavaScript on the page, including injected XSS code, can read `localStorage`. An HttpOnly cookie can't be read by JavaScript.
:::
