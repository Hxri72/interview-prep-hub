---
title: Layouts and nested layouts
stack: nextjs
order: 7
level: Basic
mustKnow: false
askedFrequency: common
summary:
  - A layout.tsx is shared UI (header, sidebar, footer) that wraps every page in its folder and all sub-folders.
  - The root layout app/layout.tsx is required and must render the html and body tags.
  - Layouts nest. app/layout.tsx wraps app/dashboard/layout.tsx, which wraps app/dashboard/jobs/page.tsx.
  - "When you move between pages inside a layout, the layout does NOT re-render and keeps its state (like a counter or open menu)."
  - Use template.tsx instead when you want the wrapper to reset on every navigation.
cards:
  - q: What is a layout in the Next.js App Router?
    a: A layout.tsx file that exports a component with a children prop. It wraps every page in its folder and sub-folders with shared UI.
  - q: What is special about the root layout?
    a: It's required, it lives at app/layout.tsx, and it must render the html and body tags.
  - q: Does a layout re-render when you navigate between its pages?
    a: No. The layout stays mounted and keeps its state; only the page part (children) changes.
  - q: How do you give the /dashboard section its own sidebar?
    a: Create app/dashboard/layout.tsx with the sidebar and render children next to it. It nests inside the root layout.
  - q: When would you use template.tsx instead of layout.tsx?
    a: When the wrapper should reset on every navigation, like replaying an enter animation or resetting a form.
---

## 💡 What is it?

Many pages share the same frame: a header, a sidebar, a footer. In Next.js, you put that frame in a file called **`layout.tsx`**.

A layout **wraps** every page in its folder and all folders below it. The page is passed in as the [`children`](glossary:props) prop.

The big benefit: when you move between pages **inside** a layout, the layout **stays on screen and keeps its state**. Only the page part changes.

## 🏠 Real-life example

Think of a **school notebook with a printed cover and a fixed index tab**.

- The **cover and binding** = the root layout (`app/layout.tsx`). Every page of every subject sits inside it.
- The **subject divider with tabs** for "Maths" = a nested layout (`app/maths/layout.tsx`). Every Maths page sits behind it.
- The **pages you write on** = `page.tsx` files. You turn pages, but the cover and dividers don't change.
- A **sticky note on the divider** = state in the layout. It stays there while you flip pages.
- **Ripping out the whole notebook and opening a new one** = a full browser reload. Then the sticky note is gone.

## 🧑‍💻 Code example

A dashboard with a sidebar that stays while you switch pages. Start from `npx create-next-app@latest my-app --yes`.

**File: `app/dashboard/LikeCounter.tsx`** (a small Client Component with state)

```tsx
'use client';                                              // runs in the browser, so it can use state and clicks
import { useState } from 'react';                          // React hook for remembering a value

export default function LikeCounter() {                    // a button that counts clicks
  const [count, setCount] = useState(0);                   // count starts at 0
  return <button onClick={() => setCount(count + 1)}>Clicked {count} times</button>; // add 1 on each click
}                                                          // end of LikeCounter
```

**File: `app/dashboard/layout.tsx`** (wraps every page under `/dashboard`)

```tsx
import Link from 'next/link';                              // links that don't reload the whole page
import LikeCounter from './LikeCounter';                   // the counter from the file above

export default function DashboardLayout({ children }: LayoutProps<'/dashboard'>) { // children = the current page
  return (                                                 // the shared frame
    <div>                                                  {/* outer wrapper */}
      <aside>                                              {/* the sidebar: stays on screen */}
        <Link href="/dashboard/jobs">Jobs</Link>           {/* go to /dashboard/jobs */}
        <Link href="/dashboard/candidates">Candidates</Link> {/* go to /dashboard/candidates */}
        <LikeCounter />                                    {/* state lives here, inside the layout */}
      </aside>                                             {/* end of sidebar */}
      <section>{children}</section>                        {/* the page for the current URL goes here */}
    </div>                                                 // end of the wrapper
  );                                                       // end of what the layout returns
}                                                          // end of DashboardLayout
```

**File: `app/dashboard/jobs/page.tsx`**

```tsx
export default function JobsPage() {                       // the page at /dashboard/jobs
  return <h2>Jobs list</h2>;                               // only this part changes when you switch pages
}                                                          // end of JobsPage
```

**File: `app/dashboard/candidates/page.tsx`**

```tsx
export default function CandidatesPage() {                 // the page at /dashboard/candidates
  return <h2>Candidates list</h2>;                         // the other page in the same layout
}                                                          // end of CandidatesPage
```

What happens (tested with `npm run build` + `npm start`):

```text
1. Open /dashboard/jobs        →  Jobs | Candidates | [Clicked 0 times]   Jobs list
2. Click the button 3 times    →  [Clicked 3 times]
3. Click the "Candidates" link →  Jobs | Candidates | [Clicked 3 times]   Candidates list
                                  ↑ the sidebar did NOT reset — the layout stayed mounted
4. Reload the browser          →  [Clicked 0 times]  (a full reload starts everything fresh)
```

## 🔍 Deeper version

**How nesting works.** For `/dashboard/jobs`, Next.js builds this tree:

```text
app/layout.tsx              ← root: <html><body>
└── app/dashboard/layout.tsx  ← sidebar
    └── app/dashboard/jobs/page.tsx  ← the page
```

Every folder can have its own `layout.tsx`. Each one wraps everything below it.

**Why layouts keep state.** When you navigate with `<Link>`, Next.js compares the old and new route trees. Layouts that are shared by both routes are **kept** (not unmounted). Only the segments that changed are rendered again. So sidebar scroll position, open menus and Client Component state survive. This is called **partial rendering**, and it also means less work per navigation.

**Rules for layouts:**
- A layout must accept and render `children`.
- The **root layout** is required and must contain `<html>` and `<body>`. Next.js doesn't add them for you.
- Layouts are **Server Components** by default. Put interactive parts (like the counter) in a separate `'use client'` component, so the layout itself stays on the server.
- A layout **can't** pass props down to its page. Fetch data in both places, or use a shared cached function.
- Layouts get `params` (for dynamic segments) but **not** `searchParams`, because a shared layout doesn't re-render when only the query string changes.

**`template.tsx`** looks like a layout, but it **remounts on every navigation**. Use it when you need the reset, for example to replay an enter animation or clear a form on every page change.

**Metadata.** A layout can export `metadata` (title, description). Child pages can override it. See [metadata](topic:nextjs/image-font-metadata).

**Different layouts for different sections.** Use [route groups](topic:nextjs/route-groups) like `app/(marketing)/layout.tsx` and `app/(app)/layout.tsx` to give two areas different frames without changing their URLs.

:::version[Version note]
In the old **Pages Router**, shared UI went in `_app.tsx`, and per-page layouts needed a manual pattern (`Component.getLayout`). The App Router's nested `layout.tsx` files replaced both. In Next.js 15+, a layout's `params` is a Promise, like a page's.
:::

## 🎯 Why do we use it?

- **No repeated code.** Header and sidebar are written once, not in every page.
- **Faster navigation.** Only the changed part is rendered; the rest stays.
- **Better UX.** Scroll position, open menus, a playing video or a search box in the sidebar don't reset when the user changes page.
- **Clear structure.** Each section of the site (marketing, dashboard, settings) can own its frame.

## ⚠️ Common mistakes

- **Forgetting `{children}`.** The page never shows.
- **Adding `<html>` or `<body>` in a nested layout.** Only the root layout should have them.
- **Expecting a layout to reset between its pages.** It doesn't. Use `template.tsx` or a `key` if you need a reset.
- **Putting `'use client'` on the whole layout just for one button.** Move the button into its own Client Component instead.
- **Reading `searchParams` in a layout.** Layouts don't receive it. Read it in the page, or in a Client Component with `useSearchParams()`.

## 🗣️ How to answer in an interview

> "A layout is a layout.tsx file with shared UI, like a header or sidebar. It wraps every page in its folder and all sub-folders through the children prop. The root layout in app/layout.tsx is required and renders the html and body tags, and layouts nest, so a dashboard folder can add its own sidebar inside the root layout.
>
> The key behaviour is that layouts don't re-render on navigation. When I move between pages inside a layout, it stays mounted and keeps its state. Only the page part changes, which is faster and keeps things like scroll position and open menus. If I need a reset on every navigation, I use template.tsx.
>
> Layouts are server components by default, so I put interactive bits in small client components.
>
> I haven't used Next.js in production. In my React work, the same idea was a shared layout component around routes [FILL IN: confirm how your SkillKeepr app wrapped pages in a layout]."

## 🔁 Follow-up questions

### What's the difference between `layout.tsx` and `template.tsx`?

Both wrap child pages. A **layout** keeps its state across navigation. A **template** creates a new instance on every navigation, so state resets and effects run again.

### Can a page override the layout?

Not remove it — every page inside the folder gets it. To give some pages a different frame, move them into a different [route group](topic:nextjs/route-groups) with its own layout.

### How do you share data between a layout and a page?

You can't pass props from layout to page. Fetch the data in both. With `fetch` or a cached function, the same request is deduplicated, so it isn't fetched twice.

### Where do global styles go?

Import `globals.css` in the root layout. Then it applies to every page.

## ✅ Quick check

### 1. You navigate from `/dashboard/jobs` to `/dashboard/candidates` with `<Link>`. Does `app/dashboard/layout.tsx` re-render?

:::answer
**No.** Both routes share that layout, so it stays mounted and keeps its state. Only the page part changes.
:::

### 2. Which layout must contain `<html>` and `<body>`?

- A) Every layout
- B) Only the root layout `app/layout.tsx`
- C) None, Next.js adds them

:::answer
**B) Only the root layout.** Nested layouts must not add them, and Next.js doesn't add them for you.
:::

### 3. You want a fade-in animation to replay every time the user changes page inside a section. Which file do you use?

:::answer
**`template.tsx`.** It remounts on every navigation, unlike `layout.tsx`.
:::
