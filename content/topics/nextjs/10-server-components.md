---
title: Server Components (the default)
stack: nextjs
order: 10
level: Basic
mustKnow: true
askedFrequency: very common
summary:
  - In the App Router, every component is a Server Component unless you add 'use client'.
  - Server Components run only on the server. The browser gets the finished result, not their JavaScript.
  - They can be async, fetch data, read a database and use secret keys safely.
  - "They cannot use useState, useEffect, onClick, window or localStorage."
  - Keep most components on the server; add 'use client' only to small interactive parts.
cards:
  - q: What is a Server Component?
    a: A React component that runs only on the server. Its code is not sent to the browser; only the rendered result is.
  - q: Is a component in the app folder a Server Component or a Client Component by default?
    a: A Server Component. You must add 'use client' at the top of a file to make it a Client Component.
  - q: Can a Server Component use useState or onClick?
    a: No. State, effects, event handlers and browser APIs only work in Client Components.
  - q: Why are Server Components good for performance?
    a: Their JavaScript never goes to the browser, so the bundle is smaller. They can also fetch data close to the database.
  - q: Is it safe to use an API key in a Server Component?
    a: Yes, as long as the env variable has no NEXT_PUBLIC_ prefix. The code runs only on the server, so the key never reaches the browser.
---

## 💡 What is it?

A **Server Component** is a React [component](glossary:component) that runs **only on the server**.

In the Next.js App Router, **every component is a Server Component by default**. The server runs it and sends the **finished result** to the browser. The component's own JavaScript is **not** sent.

Because it runs on the server, it can **fetch data**, read a [database](glossary:database), and use **secret keys** directly.

## 🏠 Real-life example

Think of a **restaurant kitchen**.

The chef cooks the food in the kitchen. You only get the **finished plate**. You never see the recipe book or the gas stove.

- The **kitchen** = the server.
- The **chef** = a Server Component.
- The **recipe book and gas stove** = secret keys and the database. They stay in the kitchen.
- The **finished plate** = the HTML and data sent to your browser.
- The **waiter who takes your requests at the table** = a Client Component. It is the part that reacts to you.

The chef can't come to your table and react when you wave. That's the waiter's job. In the same way, Server Components can't handle clicks.

## 🧑‍💻 Code example

Create a project with `npx create-next-app@latest my-app` (TypeScript, App Router). Replace `app/page.tsx` with this. Run `npm run dev` and open `http://localhost:3000`.

```tsx
// app/page.tsx — a Server Component (no 'use client' at the top)
type Post = { id: number; title: string }; // the shape of one post from the API

export default async function HomePage() { // async is allowed: this runs on the server
  const res = await fetch('https://jsonplaceholder.typicode.com/posts?_limit=3'); // fetch 3 posts from a free test API
  const posts: Post[] = await res.json(); // turn the reply into an array of posts
  console.log('Rendered on the server'); // appears in the TERMINAL, not the browser console

  return ( // what the page shows
    <main> {/* page wrapper */}
      <h1>Latest posts</h1> {/* page heading */}
      <ul> {/* list of posts */}
        {posts.map((p) => ( // one list item per post
          <li key={p.id}>{p.title}</li> // key = a stable id for React
        ))} {/* end of the map */}
      </ul> {/* end of the list */}
    </main> // end of the wrapper
  ); // end of the returned JSX
} // end of HomePage
```

**What you see:**

```text
Browser: "Latest posts" and three post titles.
Terminal (where npm run dev runs): "Rendered on the server".
Browser DevTools console: nothing — this code never ran in the browser.
View page source: the titles are already inside the HTML.
```

No `useEffect`, no loading state by hand. The page **waits for the data on the server**, then sends ready HTML.

## 🔍 Deeper version

**What runs where:**

| | Server Component | Client Component |
|---|---|---|
| Default in `app/`? | **Yes** | No — needs `'use client'` |
| Can be `async`? | Yes | No (use effects or a data library) |
| Fetch data / read DB directly | Yes | No (call an API) |
| Use secrets safely | Yes | No — the code is sent to the browser |
| `useState`, `useEffect`, `onClick` | No | Yes |
| `window`, `localStorage` | No | Yes |
| Sends its JavaScript to the browser | **No** | Yes |

**How the result gets to the browser.** The server renders Server Components into a special format called the **RSC payload** (React Server Components payload). It describes the UI and holds "holes" where Client Components go. For the first page load, Next.js also turns it into HTML, so the page shows fast. The browser then [hydrates](topic:nextjs/hydration) only the Client Components.

**Mixing them.**
- A Server Component **can render** a Client Component inside it.
- A Client Component **cannot import** a Server Component. But it can receive one as `children` or another prop. This is called the "slot" pattern.
- **Props passed from server to client must be serialisable.** That means plain data like strings, numbers, arrays and objects. You **can't** pass normal functions. (Server Actions are the exception.)

**Keeping secrets.** Environment variables **without** `NEXT_PUBLIC_` are only available on the server. A Server Component can use them safely. See [env variables](topic:nextjs/env-variables). Add `import 'server-only'` to a file to make the build fail if a Client Component imports it by mistake.

**Data fetching.** A Server Component can `await` a `fetch`, an ORM call or a Mongoose query. In Next.js 15 and 16, `fetch` is **not cached by default**. See [data fetching and caching](topic:nextjs/data-fetching-caching).

:::version[Version note]
Server Components arrived with the **App Router in Next.js 13**. In the older **Pages Router** (`pages/` folder), every component ran in the browser too, and data came from `getServerSideProps` or `getStaticProps`. Learn the App Router; it's the default for new projects in Next.js 16.
:::

## 🎯 Why do we use it?

- **Less JavaScript in the browser.** Pages load faster, especially on phones.
- **Data fetching is simple.** Just `await` the data. You don't need `useEffect` and loading flags for the first load.
- **Secrets stay safe.** Database code and API keys never leave the server.
- **Better SEO.** The HTML arrives with the content already inside, so search engines can read it.

## ⚠️ Common mistakes

- **Using `useState` or `onClick` in a Server Component.** You get an error. Move that part into a small Client Component.
- **Adding `'use client'` to the whole page "to be safe".** Then the whole page ships its JavaScript, and you lose the benefits.
- **Passing a function as a prop from server to client.** Props must be serialisable data.
- **Looking for server logs in the browser console.** `console.log` in a Server Component prints in the terminal.

## 🗣️ How to answer in an interview

> "In the App Router, components are Server Components by default. They run only on the server, and the browser receives the rendered result, not the component's JavaScript. So they can be async, fetch data or query the database directly, and safely use secret keys that don't have the NEXT_PUBLIC_ prefix.
>
> The limit is that they can't use state, effects, event handlers or browser APIs like window. For interactive parts, I add 'use client' to a small component, like a button or a form, and render it inside the server page.
>
> My rule is: keep as much as possible on the server, and push 'use client' down to the leaves. That keeps the bundle small and the first load fast. I haven't used Next.js in production yet — my production work is React with Redux — but I've learned this model. [FILL IN: once you've built the practice project, mention one Server Component you wrote.]"

## 🔁 Follow-up questions

### Are Server Components the same as server-side rendering (SSR)?

No. SSR means "make HTML on the server". Server Components mean "this component's code runs only on the server". Client Components are also server-rendered to HTML on the first load. The difference is that Server Components **never** run in the browser.

### Can a Client Component show a Server Component?

It can't import one. But a Server Component can pass another Server Component **as `children`** to a Client Component. The client then just places it.

### Why can't Server Components use useState?

State and effects need a component that stays alive in the browser and re-renders. A Server Component runs once on the server per request or build, then it's gone.

### How do you stop server code from being imported in the browser by mistake?

Add `import 'server-only'` at the top of the file. If a Client Component imports it, the build fails.

## ✅ Quick check

### 1. Does this component work?

```tsx
// app/counter/page.tsx (no 'use client')
import { useState } from 'react'; // import a hook
export default function Page() { // a Server Component by default
  const [n, setN] = useState(0); // try to use state
  return <button onClick={() => setN(n + 1)}>{n}</button>; // try to handle a click
}
```

:::answer
**No.** It's a Server Component, so `useState` and `onClick` are not allowed. Add `'use client'` at the top, or move the button into its own Client Component.
:::

### 2. Where does `console.log` inside a Server Component print?

- A) The browser console
- B) The terminal running the Next.js server
- C) Both

:::answer
**B.** Server Components run only on the server, so the log appears in the terminal.
:::

### 3. True or false: a Server Component can safely read `process.env.STRIPE_SECRET_KEY`.

:::answer
**True.** The variable has no `NEXT_PUBLIC_` prefix, and the code runs only on the server, so the key never reaches the browser.
:::
