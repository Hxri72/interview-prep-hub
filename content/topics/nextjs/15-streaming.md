---
title: Streaming with Suspense
stack: nextjs
order: 15
level: Intermediate
mustKnow: false
askedFrequency: common
summary:
  - Streaming sends the page in pieces. The fast parts show at once; slow parts arrive when they're ready.
  - "Wrap a slow Server Component in <Suspense fallback={...}>. The fallback shows until the data arrives."
  - loading.tsx is a shortcut that wraps a whole page in Suspense automatically.
  - "In Next.js 16 with Cache Components, a static shell plus streamed dynamic parts is called Partial Prerendering (◐)."
  - Put Suspense boundaries around each slow part, so one slow API doesn't block the whole page.
cards:
  - q: What is streaming in Next.js?
    a: Sending the HTML in chunks. The server sends the ready parts first, then streams the slow parts as soon as their data arrives.
  - q: How do you stream a slow part of a page?
    a: "Wrap that Server Component in <Suspense fallback={<p>Loading…</p>}>. The fallback shows first, then the real content replaces it."
  - q: How is loading.tsx related to Suspense?
    a: Next.js wraps the page in a Suspense boundary and uses loading.tsx as the fallback, so the layout shows at once while the page loads.
  - q: Why use several Suspense boundaries instead of one?
    a: So each slow part loads on its own. One slow widget doesn't hold up the others.
  - q: What does ◐ mean in the Next.js build output?
    a: Partial Prerender — the page has a static HTML shell, and dynamic parts are streamed in from the server.
---

## 💡 What is it?

Normally, a server waits until **all** the data is ready, then sends the whole page. One slow API makes the whole page slow.

**Streaming** sends the page in **pieces**. The fast parts show **at once**. The slow parts arrive **when they're ready**.

In Next.js, you mark a slow part with React's **`<Suspense>`**. It shows a **fallback** (like "Loading…") until the real content arrives.

## 🏠 Real-life example

Think of a **school lunch** being served.

The plate comes with rice and salad straight away. The hot dosa takes longer, so the server puts a small card saying "Dosa coming" on your plate. You start eating. When the dosa is ready, they swap the card for the dosa.

- **Rice and salad** = the fast parts of the page (heading, layout).
- **The "Dosa coming" card** = the Suspense fallback.
- **The hot dosa** = the slow component, like stats from a slow API.
- **Swapping the card for the dosa** = streaming the finished HTML into the page.
- **Waiting for the whole meal before serving anything** = no streaming. Everyone waits for the slowest item.

## 🧑‍💻 Code example

In a Next.js 16 project with `cacheComponents: true` in `next.config.ts`, create this page.

```tsx
// app/dashboard/page.tsx
import { Suspense } from 'react'; // React's component for "show a fallback while waiting"
import { connection } from 'next/server'; // marks code as "needs a real request" (dynamic)

async function SlowStats() { // an async Server Component
  await connection(); // dynamic: render per request, not at build time
  await new Promise((r) => setTimeout(r, 3000)); // pretend a slow API takes 3000 ms = 3 seconds
  return <p>Applications today: 42</p>; // the real content
} // end of SlowStats

export default function DashboardPage() { // the page itself is fast
  return ( // what the page shows
    <main> {/* page wrapper */}
      <h1>Recruiter dashboard</h1> {/* fast part: sent immediately */}
      <Suspense fallback={<p>Loading stats…</p>}> {/* show this until SlowStats is ready */}
        <SlowStats /> {/* slow part: streamed in later */}
      </Suspense> {/* end of the Suspense boundary */}
    </main> // end of the wrapper
  ); // end of the returned JSX
} // end of DashboardPage
```

Build and start it: `npm run build && npm start`.

**Real output (Next.js 16.4):**

```text
Route (app)
└ ◐ /dashboard

◐  (Partial Prerender)  prerendered as static HTML with dynamic server-streamed content
```

Timing of the response when the page is requested:

```text
~0s  "Recruiter dashboard" and "Loading stats…" arrive
~3s  "Applications today: 42" arrives and replaces the fallback
```

The user sees the heading straight away, not after 3 seconds.

## 🔍 Deeper version

**How it works.** The server sends the HTML it already has, including the fallback. It keeps the connection open. When the slow component finishes, the server sends the extra HTML plus a tiny script that swaps it in. This uses HTTP **streaming**, so it's one response, not a new request.

**`loading.tsx` is automatic Suspense.** If you add `app/dashboard/loading.tsx`, Next.js wraps the page in a Suspense boundary and uses that file as the fallback. The [layout](topic:nextjs/layouts) shows at once, and the page streams in. See [special files](topic:nextjs/special-files).

| Tool | What it wraps | Use when |
|---|---|---|
| `loading.tsx` | The whole page segment | The page loads as one unit |
| `<Suspense>` | Any part of the page | Different parts load at different speeds |

**Where to put boundaries.** Wrap **each** independent slow part. If the stats, the job list and the activity feed each have their own boundary, they appear as soon as each is ready. One boundary around all three would wait for the slowest.

**Partial Prerendering (PPR).** With Cache Components on, Next.js builds a **static shell** at build time (everything outside Suspense, plus cached parts). At request time it streams in the dynamic parts. The build output marks this as **◐ Partial Prerender**. If dynamic data is accessed outside any Suspense boundary and isn't cached, the build fails and asks you to add `<Suspense>` or `'use cache'`. See [data fetching and caching](topic:nextjs/data-fetching-caching).

**Errors.** If the slow component throws, the nearest `error.tsx` (or error boundary) catches it. Suspense handles waiting; error boundaries handle failures.

**Waterfalls.** If component B needs data from component A, they can't load in parallel. Start independent fetches early, or fetch them together with `Promise.all`.

:::version[Version note]
Streaming with Suspense and `loading.tsx` has worked in the App Router since Next.js 13. **Partial Prerendering** was experimental in Next.js 14 and 15. In **Next.js 16** it's part of **Cache Components** (`cacheComponents: true`), and the old `experimental.ppr` flag was merged into it.
:::

## 🎯 Why do we use it?

- **The page feels fast.** Users see something useful at once.
- **One slow API doesn't block everything.** Each section loads on its own.
- **Better Core Web Vitals.** The first content paints sooner.
- **It's simple to write.** You just wrap the slow part in `<Suspense>`.

## ⚠️ Common mistakes

- **One big Suspense around the whole page.** Then everything waits for the slowest part.
- **Forgetting a fallback that keeps the layout stable.** Use a skeleton with the same size, so the page doesn't jump when content arrives.
- **Fetching in a parent and passing data down.** The parent then waits for everything. Fetch inside the slow child instead, so only that part waits.
- **Thinking `useEffect` is needed for loading states.** On the server, Suspense handles it.

## 🗣️ How to answer in an interview

> "Streaming lets the server send the page in chunks. The fast parts, like the header and layout, are sent immediately, and slow parts are streamed in when their data is ready. In Next.js I do this by wrapping a slow async Server Component in a Suspense boundary with a fallback, like a skeleton. loading.tsx does the same thing for a whole route segment automatically.
>
> I'd give each independent slow section its own boundary, so one slow API doesn't block the rest. In Next.js 16, with Cache Components, a page can have a static shell plus streamed dynamic parts — that's Partial Prerendering, shown with a half-filled circle in the build output.
>
> I haven't used Next.js in production, but I know Suspense and lazy loading from React, where we code-split pages. [FILL IN: once you've built the practice project, mention a part you streamed.]"

## 🔁 Follow-up questions

### Is streaming bad for SEO?

No. The streamed content is still part of the HTML response. Search engines that read the full response see it. Keep the most important text in the fast part if you're unsure.

### What's the difference between loading.tsx and a Suspense boundary?

`loading.tsx` wraps the whole page segment for you. `<Suspense>` can wrap any smaller part, so you can stream several parts separately.

### What happens if the slow component throws an error?

The nearest error boundary, like `error.tsx`, shows its fallback for that part. The rest of the page still works.

### Can Client Components use Suspense too?

Yes. In the browser, `<Suspense>` works with `React.lazy`, `use()` with a promise, and data libraries that support it. See [react/code-splitting](topic:react/code-splitting).

## ✅ Quick check

### 1. Three slow widgets are wrapped in ONE `<Suspense>`. Widget times are 1 s, 2 s and 5 s. When do they appear?

:::answer
**All at about 5 seconds.** One boundary waits for everything inside it. Give each widget its own boundary to show them at 1 s, 2 s and 5 s.
:::

### 2. What does `loading.tsx` do?

- A) Shows a spinner on every page of the app
- B) Acts as the Suspense fallback for that route segment
- C) Makes the page static

:::answer
**B.** Next.js wraps the segment's page in Suspense and shows `loading.tsx` while it loads.
:::

### 3. What does ◐ next to a route mean in the build output?

:::answer
**Partial Prerender.** The route has a static HTML shell, and its dynamic parts are streamed from the server at request time.
:::
