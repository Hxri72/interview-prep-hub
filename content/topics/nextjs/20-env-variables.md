---
title: "Environment variables and NEXT_PUBLIC_"
stack: nextjs
order: 20
level: Basic
mustKnow: true
askedFrequency: very common
summary:
  - Next.js loads environment variables from .env files, like .env.local, automatically. No dotenv package is needed.
  - Variables WITHOUT the NEXT_PUBLIC_ prefix stay on the server. Use them for secrets like database URLs and API keys.
  - Variables WITH NEXT_PUBLIC_ are copied into the browser JavaScript at build time. Anyone can read them, so never put secrets there.
  - Because NEXT_PUBLIC_ values are baked in at build time, changing them needs a new build.
  - .env.local holds your machine's secrets and must never be committed to Git.
cards:
  - q: What does the NEXT_PUBLIC_ prefix do?
    a: It tells Next.js to copy that variable's value into the browser JavaScript at build time, so client code can read it. Everyone can see it.
  - q: Where should a database password go?
    a: In a variable WITHOUT NEXT_PUBLIC_, for example DATABASE_URL in .env.local, used only in server code.
  - q: You changed NEXT_PUBLIC_API_URL on the server, but the site still shows the old value. Why?
    a: NEXT_PUBLIC_ values are written into the JavaScript at build time. You must rebuild the app.
  - q: Which .env file should never be committed?
    a: .env.local (and any .env*.local file). It holds your own secrets.
  - q: Can a Client Component read process.env.DATABASE_URL?
    a: Not in the browser — it is undefined there. Only server code and NEXT_PUBLIC_ variables work.
---

## 💡 What is it?

An [environment variable](glossary:environment-variable) is a setting given to your app from **outside the code**. Examples: a database URL, an API key or the site name.

Next.js reads these settings from `.env` files by itself.

There is one big rule:
- A normal name, like `DATABASE_URL`, stays **on the server only**.
- A name starting with **`NEXT_PUBLIC_`** is **sent to the browser**, where anyone can see it.

## 🏠 Real-life example

Think of **a school office**.

- **The locked cupboard in the office** = normal variables like `DATABASE_URL`. Only staff (the server) can open it. Exam papers and keys stay inside.
- **The notice board in the corridor** = `NEXT_PUBLIC_` variables. Every student and visitor (every browser) can read them.
- **Printing the notice in the morning** = the build. If the notice changes at noon, the printed copy on the board is still the old one until you print again (rebuild).
- **Never pinning the exam answers on the notice board** = never putting secrets in `NEXT_PUBLIC_` variables.

## 🧑‍💻 Code example

In a Next.js App Router project (`npx create-next-app@latest`), create these files. Run `npm run build` and then `npm start`.

**`.env.local`**

```bash
# a secret: no NEXT_PUBLIC_ prefix, so it stays on the server
DATABASE_URL=mongodb://localhost:27017/jobs
# public: this value WILL be copied into the browser JavaScript
NEXT_PUBLIC_APP_NAME=Mini Job Board
```

**`app/page.tsx`** (a Server Component)

```tsx
import PublicName from './public-name';                        // a small Client Component (below)

export default function Home() {                               // runs on the server
  const hasDb = Boolean(process.env.DATABASE_URL);             // server code CAN read the secret
  return (                                                     // what the page shows
    <main>                                                     {/* a wrapper */}
      <p>Server can see the database URL: {hasDb ? 'yes' : 'no'}</p> {/* never print the secret itself */}
      <PublicName />                                           {/* the client part */}
    </main>                                                    // end of the wrapper
  );                                                           // end of return
}                                                              // end of Home
```

**`app/public-name.tsx`** (a Client Component)

```tsx
'use client';                                                  // this code is also sent to the browser
export default function PublicName() {                         // a small component
  return <p>App: {process.env.NEXT_PUBLIC_APP_NAME}</p>;       // OK: public variable, copied in at build time
}                                                              // end of PublicName
```

Real results from a Next.js 16 test app:

```text
On screen:
  Server can see the database URL: yes
  App: Mini Job Board

Searching the browser JavaScript files in .next/static after the build:
  "Mini Job Board"              → found   (NEXT_PUBLIC_ value is inside the browser bundle)
  "mongodb://localhost:27017"   → not found (the secret never reached the browser)
```

## 🔍 Deeper version

**Which files are loaded, and their order.** Next.js checks these, and the first value found wins:

1. Real environment variables (from the server or hosting platform). These always win.
2. `.env.development.local` / `.env.production.local` (depends on dev or build)
3. `.env.local` (skipped when running tests)
4. `.env.development` / `.env.production`
5. `.env`

Commit `.env` / `.env.production` only if they contain **no secrets**, like default settings. Keep secrets in `.env.local` locally and in the hosting platform's secret settings in production.

**How `NEXT_PUBLIC_` works.** At build time, Next.js finds every `process.env.NEXT_PUBLIC_X` in your code and **replaces it with the actual text**. So:
- The value is frozen in the build. Changing it later needs a rebuild.
- A dynamic lookup like `process.env[name]` is **not** replaced. Write the full name.

**Server variables are read at runtime.** In server code (Server Components, Route Handlers, Server Actions), `process.env.DATABASE_URL` is read when the server runs. So you can build once and use different secrets in staging and production.

**A trap with Client Components.** Client Components also render **on the server** first. So `process.env.DATABASE_URL` might show a value in that first server render, but it is `undefined` in the browser. Never use non-public variables in Client Components.

**Extra safety.** Add `import 'server-only'` at the top of files that use secrets. If a Client Component ever imports that file, the build fails.

:::version[Version note]
In plain Node.js 20.6+ you can use `--env-file`, and many Express apps use the `dotenv` package. Next.js has **always loaded `.env` files by itself**, so you don't need either. See [environment variables in Node.js](topic:nodejs/environment-variables).
:::

## 🎯 Why do we use it?

- **Keep secrets out of code.** Database passwords and API keys don't belong in Git.
- **Different settings per environment.** Local, staging and production can use different databases with the same code.
- **Safe sharing with the browser.** `NEXT_PUBLIC_` makes it clear which values are public, like a public API URL or an analytics ID.

## ⚠️ Common mistakes

- **Putting a secret in a `NEXT_PUBLIC_` variable**, like `NEXT_PUBLIC_STRIPE_SECRET_KEY`. It goes into the browser bundle, and anyone can steal it.
- **Expecting a `NEXT_PUBLIC_` change without rebuilding.** The old value stays in the built files.
- **Committing `.env.local`** to Git. Check that `.gitignore` covers `.env*.local`.
- **Reading a non-public variable in a Client Component.** It's `undefined` in the browser.

## 🗣️ How to answer in an interview

> "Next.js loads .env files automatically, like .env.local, so I don't need dotenv. Variables without a prefix stay on the server. I use those for secrets like the database URL or API keys, and only read them in server code: Server Components, Route Handlers and Server Actions.
>
> Variables prefixed with NEXT_PUBLIC_ are inlined into the browser JavaScript at build time. So anyone can see them, and changing them needs a rebuild. I only use that prefix for values that are safe to be public, like a public API URL.
>
> I keep .env.local out of Git. In production, secrets come from the hosting platform's settings.
>
> I haven't used Next.js in production, but in my Node.js work the rule is the same: secrets come from the environment and never go into code or the frontend bundle."

[FILL IN: once you've built the practice project, mention which variables it uses.]

## 🔁 Follow-up questions

### How do you keep a secret from leaking into the client by mistake?

Never prefix it with `NEXT_PUBLIC_`. Read it only in server files, and add `import 'server-only'` to those files. Then the build fails if client code imports them.

### Can I change `NEXT_PUBLIC_` values per environment without rebuilding?

Not with the built-in inlining. Build separately per environment, or read the value at runtime on the server and pass it down as a prop.

### Which value wins if the same name is in `.env` and `.env.local`?

`.env.local`. And a real environment variable set on the server beats both.

### How is this different from Vite?

The idea is the same, but the prefix differs. Vite exposes `VITE_*` variables through `import.meta.env`. Next.js exposes `NEXT_PUBLIC_*` through `process.env`.

## ✅ Quick check

### 1. Which variable is safe to use in a Client Component?

- A) `STRIPE_SECRET_KEY`
- B) `NEXT_PUBLIC_API_URL`
- C) `DATABASE_URL`

:::answer
**B.** Only `NEXT_PUBLIC_` variables reach the browser. A and C are secrets and stay on the server.
:::

### 2. You deploy with `NEXT_PUBLIC_API_URL=https://old.api`. Later you change it on the server to `https://new.api` and restart, without rebuilding. Which URL does the browser use?

:::answer
**`https://old.api`.** The value was written into the JavaScript at build time. You must rebuild.
:::

### 3. True or false: you need to install `dotenv` for Next.js to read `.env.local`.

:::answer
**False.** Next.js loads `.env` files automatically.
:::
