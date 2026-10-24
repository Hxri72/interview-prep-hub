---
title: Server state (React Query) vs client state (Redux)
stack: mern-architectures
order: 23
level: Intermediate
mustKnow: true
askedFrequency: common
template: pattern
section: State, auth and files
summary:
  - "Server state is data that really lives in MongoDB (jobs, users). React only holds a copy that can go stale."
  - "Client state is data that only exists in the browser (an open modal, the current tab, a form draft)."
  - "Server state needs caching, refetching, loading and error handling. TanStack Query (React Query) or RTK Query does this for you."
  - "Client state needs a simple store: useState, Context, Redux Toolkit or Zustand."
  - "A common mistake is copying all API data into Redux by hand. Let a server-state tool handle API data and keep Redux small."
cards:
  - q: What is server state?
    a: Data owned by the backend (like jobs in MongoDB). The frontend only has a cached copy, which can become out of date.
  - q: What is client state?
    a: Data that only lives in the browser, like whether a modal is open or which filter is selected.
  - q: What does TanStack Query give you?
    a: Caching by query key, loading and error states, background refetching, retries and cache invalidation after changes.
  - q: Redux Toolkit has its own tool for server state. What is it?
    a: RTK Query. It does caching and refetching inside the Redux store.
  - q: When is redux-saga still useful?
    a: For complex async flows like polling, cancelling, retries in a sequence, or workflows that react to many actions.
---

## 💡 What is it?

A React app holds two very different kinds of data.

- **Server state** is data that really lives on the server, like jobs in MongoDB. React only keeps a **copy**. The copy can go old (stale).
- **Client state** is data that only lives in the browser. Examples: "is the modal open?", "which tab is selected?".

Each kind needs a different tool. Mixing them up makes apps buggy.

## 🏠 Real-life example

Think of your school timetable.

- **The official timetable on the notice board** = server state. The school owns it. It can change at any time.
- **The photo of it on your phone** = the cached copy in React. It can be out of date.
- **Checking the notice board again each morning** = refetching.
- **Your own sticky note, "bring cricket bat today"** = client state. Only you have it. The school doesn't care.

You manage the photo and the sticky note in different ways.

## 🗺️ The diagram

```text
                    ┌────────────────────── React app ──────────────────────┐
                    │                                                       │
 MongoDB ◄── Express API ◄──► SERVER STATE (TanStack Query / RTK Query)     │
 (the truth)        │         cache: ['jobs'] → [...]  stale? → refetch     │
                    │         loading / error / retry handled for you       │
                    │                                                       │
                    │         CLIENT STATE (useState / Context / Redux)     │
                    │         isModalOpen, selectedTab, theme, form draft   │
                    └───────────────────────────────────────────────────────┘
```

## 🧑‍💻 Code example

One component that uses both kinds of state. Server state comes from TanStack Query; client state comes from `useState`.

Set up inside a Vite React app:

```bash
npm install @tanstack/react-query
```

Run any Express API with `GET /api/jobs` on port 3000 (for example from [CSR SPA with an Express API](topic:mern-architectures/csr-spa-api)). Then run `npm run dev`.

```jsx
import { useState } from 'react';                                        // client state hook
import { QueryClient, QueryClientProvider, useQuery, useMutation, useQueryClient } from '@tanstack/react-query'; // server state tools

const queryClient = new QueryClient();                                   // one cache for the whole app

function Jobs() {                                                        // the jobs screen
  const [showRemote, setShowRemote] = useState(false);                   // CLIENT state: a filter checkbox (false = show all)
  const qc = useQueryClient();                                           // access the shared cache

  const { data: jobs = [], isPending, error } = useQuery({               // SERVER state: the job list
    queryKey: ['jobs'],                                                  // the cache key for this data
    queryFn: () => fetch('/api/jobs').then((r) => r.json()),             // how to load it from Express
    staleTime: 30_000,                                                   // 30_000 ms = treat data as fresh for 30 s
  });                                                                    // end of useQuery

  const addJob = useMutation({                                           // SERVER state change: create a job
    mutationFn: (title) => fetch('/api/jobs', {                          // POST to Express
      method: 'POST',                                                    // create
      headers: { 'Content-Type': 'application/json' },                   // we send JSON
      body: JSON.stringify({ title }),                                   // the new job's data
    }),                                                                  // end of fetch
    onSuccess: () => qc.invalidateQueries({ queryKey: ['jobs'] }),       // mark ['jobs'] stale → refetch the list
  });                                                                    // end of useMutation

  if (isPending) return <p>Loading…</p>;                                 // first load
  if (error) return <p>Could not load jobs</p>;                          // network or server error
  const shown = showRemote ? jobs.filter((j) => j.remote) : jobs;        // apply the client-side filter

  return (                                                               // the UI
    <div>                                                                {/* wrapper */}
      <label>                                                            {/* clicking the text also ticks the box */}
        <input type="checkbox" checked={showRemote} onChange={(e) => setShowRemote(e.target.checked)} /> {/* client state */}
        Remote only                                                      {/* label text */}
      </label>                                                           {/* end of label */}
      <button onClick={() => addJob.mutate('New job')}>Add job</button>  {/* server state change */}
      <ul>{shown.map((j) => <li key={j.id}>{j.title}</li>)}</ul>          {/* show the jobs */}
    </div>                                                               {/* end of wrapper */}
  );                                                                     // end of the UI
}                                                                        // end of Jobs

export default function App() {                                          // the root component
  return <QueryClientProvider client={queryClient}><Jobs /></QueryClientProvider>; // share the cache
}                                                                        // end of App
```

There is no `useEffect`, no `loading` flag and no reducer for the API data. TanStack Query handles them.

## 🔍 Deeper version

**Why server state is hard.** A copy of server data needs:
- caching, so you don't fetch the same thing twice;
- **deduplication**, so two components asking at once send one request;
- refetching when stale, on window focus, or on reconnect;
- retries, loading and error states;
- **invalidation**: after a change, refetch what is now wrong.

Writing this by hand in Redux (actions, reducers, `loading` flags) is a lot of code, and easy to get wrong.

**The tools.**

| Tool | Kind | Notes |
|---|---|---|
| TanStack Query v5 | server state | cache by `queryKey`; works with any fetch code |
| RTK Query | server state | part of Redux Toolkit; cache lives in the Redux store |
| Apollo Client | server state | for GraphQL APIs |
| useState / useReducer | client state | local to one component |
| Context | client state | share rarely-changing values (theme, user) |
| Redux Toolkit / Zustand | client state | big shared client state with dev tools |

**Where redux-saga fits.** Sagas handle complex **async workflows**: polling, cancelling a request when the user leaves, or a chain of calls that react to actions. Many older apps use Redux + saga for all API data. That works, but you write the caching yourself. See [redux-saga](topic:redux-context/redux-saga) and [how to choose](topic:redux-context/how-to-choose).

**SSR and Server Components.** In Next.js, much server state is fetched on the server and sent as HTML. Client-side tools are then needed mostly for interactive parts.

## ⚖️ Pros and cons

| Approach | Pros | Cons |
|---|---|---|
| All API data in Redux by hand | one store, full control, great DevTools | lots of code; you build caching, staleness and retries yourself |
| Redux + redux-saga | powerful for complex async flows | steep learning curve, even more code |
| TanStack Query + small client store | less code; caching and refetch built in | two tools to learn; cache lives outside Redux |
| RTK Query | server cache inside Redux, one ecosystem | tied to Redux Toolkit |

## 🎯 When to choose it

- **New app, mostly CRUD screens:** TanStack Query for API data, plus `useState` or Context for UI state.
- **Already on Redux Toolkit:** RTK Query, so everything stays in one store.
- **Complex flows (polling, cancelling, multi-step processes):** redux-saga or careful TanStack Query options.
- **GraphQL backend:** Apollo Client. See [GraphQL with Apollo](topic:mern-architectures/graphql-apollo).

## ⚠️ Common mistakes

- **Putting a copy of API data in Redux and in `useState`.** Two copies drift apart.
- **Storing UI-only data (modal open) in the server cache,** or API data in Context. Each kind has its own tool.
- **Forgetting to invalidate after a mutation,** so the list shows old data.
- **Same `queryKey` for different data,** like `['jobs']` for both page 1 and page 2. Include the inputs: `['jobs', page]`.

## 🗣️ How to answer in an interview

> "I split state into two kinds. Server state is data the backend owns, like jobs in MongoDB. The frontend only has a cached copy, so it needs caching, refetching, loading and error handling, and invalidation after changes. Client state is UI-only, like an open modal or a selected filter.
>
> For server state, tools like TanStack Query or RTK Query handle the cache for me. For client state, `useState`, Context or a small Redux store is enough.
>
> At SkillKeepr the frontend uses Redux with redux-saga, so I've handled API calls and async flows through sagas. I haven't used TanStack Query in production, but I understand why it removes a lot of that hand-written loading and caching code."

## 🔁 Follow-up questions

### What is a query key?

A unique label for a piece of cached data, like `['jobs']` or `['job', 42]`. TanStack Query stores and refetches data by that key.

### What does "stale" mean in TanStack Query?

Stale data may be out of date. TanStack Query still shows it, but refetches it in the background at the next chance (like on window focus). `staleTime` sets how long data counts as fresh.

### What is an optimistic update?

You update the screen before the server answers, as if the change already worked. If the server fails, you roll the change back. It makes apps feel fast.

### Can you use TanStack Query and Redux together?

Yes. TanStack Query holds API data. Redux holds shared client state. Many apps do this.

## ✅ Quick check

### 1. Which is server state: (A) the logged-in user's job applications, (B) whether the sidebar is collapsed?

:::answer
**A.** It lives in the database. B is client state.
:::

### 2. After `POST /api/jobs` succeeds, the job list still shows old data. What did you forget?

:::answer
To **invalidate** the `['jobs']` query (or update the cache), so it refetches.
:::

### 3. True or false: TanStack Query replaces the need for any client state at all.

:::answer
**False.** It manages server state. You still need `useState`, Context or a store for UI-only state.
:::
