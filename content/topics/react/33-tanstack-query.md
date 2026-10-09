---
title: Server state with TanStack Query (React Query)
stack: react
order: 33
level: Advanced
mustKnow: false
askedFrequency: common
summary:
  - "Server state is data that lives on the server (candidates, jobs). TanStack Query fetches it, caches it and keeps it fresh."
  - "useQuery({ queryKey, queryFn }) gives you data, isPending, isError and error — no manual useEffect or loading state."
  - The queryKey is the cache key. Same key = same cached data, shared by every component that asks for it.
  - "useMutation changes data on the server. Then invalidateQueries marks old data as stale, so it is fetched again."
  - "It also gives you retries, de-duplication, background refetch, pagination helpers and DevTools."
cards:
  - q: What is TanStack Query (React Query)?
    a: A library for server state in React. It fetches data, caches it by a key, removes duplicate requests, retries failures and refetches in the background to keep data fresh.
  - q: What is a queryKey?
    a: An array that names the data, like ['candidates', page]. It is the cache key. When it changes, the query fetches again.
  - q: Why use it instead of useEffect + useState?
    a: It handles loading and error states, caching, de-duplication, retries, race conditions and refetching for you, so you write much less code with fewer bugs.
  - q: How do you refresh a list after creating an item?
    a: "Use useMutation for the POST, and in onSuccess call queryClient.invalidateQueries({ queryKey: ['candidates'] }). The list refetches automatically."
  - q: Redux or TanStack Query for API data?
    a: TanStack Query (or RTK Query) for server data; Redux or Context for client-only state like UI settings. Many apps no longer keep API data in Redux by hand.
---

## 💡 What is it?

Some data lives **on the server**, like a list of candidates or jobs. This is called **server state**. Your app only has a copy, and that copy can become old.

**TanStack Query** (it used to be called **React Query**) is a library that **fetches server data, keeps it in a cache and keeps it fresh**. You don't write `useEffect`, loading flags and error flags by hand.

## 🏠 Real-life example

Think of a **school library with a librarian**.

You ask for a book. If the librarian already has a copy on the desk, you get it **at once**. If it's been a while, the librarian quietly **checks the shelf for a newer edition** while you read. If two students ask for the same book together, the librarian fetches it **once**.

- The **book** = the server data.
- The **copy on the desk** = the cache.
- The **book's name** = the `queryKey`.
- **Checking for a newer edition** = background refetch.
- **Fetching once for two students** = de-duplication.
- **Returning an old book and marking the desk copy "old"** = a mutation plus `invalidateQueries`.

## 🧑‍💻 Code example

In a Vite React app run `npm install @tanstack/react-query`. Replace `src/main.jsx` and `src/App.jsx`, then run `npm run dev`.

```jsx
// src/main.jsx
import { createRoot } from 'react-dom/client';                          // starts React in the page
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'; // the cache and its provider
import App from './App';                                                // our app

const queryClient = new QueryClient();                                  // ONE cache for the whole app

createRoot(document.getElementById('root')).render(                     // draw into <div id="root">
  <QueryClientProvider client={queryClient}>                            {/* give the cache to every component */}
    <App />                                                             {/* the app inside the provider */}
  </QueryClientProvider>,                                               // end of the provider
);                                                                      // end of render
```

```jsx
// src/App.jsx
import { useQuery } from '@tanstack/react-query';                       // the hook to read server data

async function fetchUsers() {                                           // the function that gets the data
  const res = await fetch('https://jsonplaceholder.typicode.com/users');// call a free test API
  if (!res.ok) throw new Error(`HTTP ${res.status}`);                   // turn HTTP errors into real errors
  return res.json();                                                    // give back the list of users
}                                                                       // end of fetchUsers

export default function App() {                                         // the main component
  const { data, isPending, isError, error } = useQuery({                // read the data from the cache or the server
    queryKey: ['users'],                                                // the cache name for this data
    queryFn: fetchUsers,                                                // how to fetch it when needed
  });                                                                   // end of useQuery

  if (isPending) return <p>Loading…</p>;                                // first load: no data yet
  if (isError) return <p>Error: {error.message}</p>;                    // the fetch failed (after retries)
  return <ul>{data.map((u) => <li key={u.id}>{u.name}</li>)}</ul>;      // show the user names
}                                                                       // end of App
```

**What you see:**

```text
Loading…
(then a list of 10 names: Leanne Graham, Ervin Howell, …)

Switch to another tab and come back: the data refetches quietly
in the background, and the list never flashes "Loading…" again.
```

## 🔍 Deeper version

**Query states (v5):**
- `isPending` — no data yet (first load).
- `isFetching` — any fetch is running, including background refetches.
- `isError` and `error` — the query failed after the retries (3 by default in the browser).
- `data` — the cached result.

**Freshness:**
- `staleTime` (default **0**) — how long data counts as fresh. Fresh data is never refetched.
- `gcTime` (default **5 minutes**) — how long **unused** data stays in the cache before it's removed.
- Stale data is refetched when a component mounts, the window gets focus again, or the network reconnects.

**Query keys are everything:**

```jsx
useQuery({                                              // a query that depends on two values
  queryKey: ['candidates', { page, status }],           // a new page or status = a new cache entry
  queryFn: () => getCandidates({ page, status }),       // fetch with those same values
  placeholderData: keepPreviousData,                    // keep the old page on screen while the next one loads
});                                                     // end of the query
```

Put **every value the fetch uses** into the key. Then the cache and the request always match. Race conditions disappear, because each key has its own result.

**Changing data (mutations):**

```jsx
const queryClient = useQueryClient();                              // get the shared cache
const addCandidate = useMutation({                                 // a server change
  mutationFn: (body) => api.post('/candidates', body),             // how to change it
  onSuccess: () => queryClient.invalidateQueries({ queryKey: ['candidates'] }), // mark lists as stale → refetch
});                                                                // end of the mutation
// later: addCandidate.mutate({ name: 'Hari' })                    // run it, e.g. on form submit
```

For a snappy UI, you can also do **optimistic updates**: change the cache first, then undo it if the server fails.

**Other features:** `useInfiniteQuery` for "load more", prefetching, `useSuspenseQuery` for `Suspense`, and the **React Query DevTools** to look inside the cache.

**Where it fits:**

| Kind of state | Example | Tool |
|---|---|---|
| Server state | candidates, jobs, the user profile | TanStack Query or RTK Query |
| Client state | sidebar open, theme, form drafts | `useState`, Context, Redux or Zustand |

:::version[Version note]
**v5** (from late 2023) uses a single object: `useQuery({ queryKey, queryFn })`. It renamed `isLoading` to `isPending` and `cacheTime` to `gcTime`. Older tutorials show `useQuery(['users'], fetchUsers)` — that is the v4 style.
:::

## 🎯 Why do we use it?

Fetching with `useEffect` by hand means writing the same code again and again: loading flag, error flag, cancelling old requests, refetching after a save, and sharing the data between components. Each copy can have bugs, like race conditions or stale lists after saving.

TanStack Query does all of this in one tested library. You write less code, the app feels faster because of the cache, and the data stays fresh.

## ⚠️ Common mistakes

- **Leaving a value out of the `queryKey`.** The cache then shows the wrong page or filter.
- **Copying query data into `useState`.** You now have two copies that can disagree. Use `data` directly.
- **Forgetting to invalidate after a mutation**, so the list shows old data.
- **Creating a new `QueryClient` inside a component.** The cache is thrown away on every render. Create it once, outside.

## 🗣️ How to answer in an interview

> "TanStack Query manages server state. I call useQuery with a queryKey and a queryFn, and I get data, isPending and error, with caching, de-duplication, retries and background refetching built in. The queryKey is the cache key, so I put every parameter in it, like the page and filters. That also removes race conditions.
>
> For writes I use useMutation, and in onSuccess I invalidate the related queries so the lists refetch. I tune staleTime for data that doesn't change often. I keep server data in the query cache and use useState, Context or Redux only for client state like UI settings. It replaces most of the useEffect-based fetching code."

[FILL IN: SkillKeepr's frontend fetches data with Redux and redux-saga. Have you used TanStack Query or RTK Query in any project? Say so honestly.]

## 🔁 Follow-up questions

### `isPending` vs `isFetching`?

`isPending` means there's no data yet, so show a full loader. `isFetching` is true for any running fetch, including background refetches when old data is already showing. Use it for a small "refreshing" hint.

### How does it avoid race conditions?

Each `queryKey` has its own cache entry. When the key changes, the component reads the entry for the **new** key. A slow response for an old key only updates the old entry, so it never overwrites the screen.

### How is it different from RTK Query?

Both manage server state with caching. RTK Query is built into Redux Toolkit and defines endpoints in one API slice. TanStack Query works without Redux and is configured per hook. See [RTK Query](topic:redux-context/rtk-query).

### What is `staleTime` and why change it?

It's how long data counts as fresh. With the default 0, data refetches often. For lists that rarely change, like countries or job categories, set a longer `staleTime` to avoid extra requests.

## ✅ Quick check

### 1. Two components on the same page both call `useQuery({ queryKey: ['jobs'], queryFn: getJobs })`. How many network requests are made on load?

:::answer
**One.** Both use the same `queryKey`, so TanStack Query removes the duplicate request and shares the result.
:::

### 2. A list is filtered by `status`, but changing the status still shows the old list. The code uses `queryKey: ['candidates']`. What's wrong?

:::answer
`status` is missing from the key. Use `queryKey: ['candidates', status]`. Then each status gets its own cache entry and a new fetch.
:::
