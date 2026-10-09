---
title: RTK Query basics
stack: redux-context
order: 15
level: Advanced
mustKnow: false
askedFrequency: sometimes
summary:
  - "RTK Query is the data-fetching and caching tool built into Redux Toolkit."
  - "You describe endpoints once with createApi; it generates hooks like useGetJobsQuery and useAddJobMutation."
  - "It caches results, removes duplicate requests, tracks loading and error states, and refetches when needed."
  - "Tags link queries and mutations: a mutation that invalidates 'Job' makes every query that provides 'Job' refetch."
  - "Use it for server data; keep plain Redux slices for UI state like filters and open dialogs."
cards:
  - q: What is RTK Query?
    a: The data-fetching and caching layer built into Redux Toolkit. You define endpoints with createApi, and it handles requests, caching, loading/error states and refetching.
  - q: What is the difference between a query and a mutation?
    a: A query reads data (GET) and is cached. A mutation changes data (POST/PUT/PATCH/DELETE) and usually invalidates cached queries.
  - q: How does cache invalidation with tags work?
    a: "Queries say what they provide (providesTags: ['Job']). Mutations say what they invalidate (invalidatesTags: ['Job']). After the mutation, matching queries refetch automatically."
  - q: Two components call useGetJobsQuery() at the same time. How many requests are sent?
    a: One. RTK Query removes duplicate requests and shares the cached result.
  - q: When would you still use createAsyncThunk instead?
    a: For one-off async logic that isn't really "server data to cache", or complex custom flows across several slices.
---

## 💡 What is it?

**RTK Query** is a tool inside Redux Toolkit for **getting data from a server and caching it**.

You describe your [API](glossary:api) endpoints once. RTK Query then:
- sends the requests,
- **caches** the results,
- tracks **loading** and **error** states,
- **removes duplicate** requests,
- **refetches** data when it becomes out of date.

In React, it even generates **hooks** for you, like `useGetJobsQuery()`.

## 🏠 Real-life example

Think of a **class monitor who brings the notice board updates**.

Every student wants today's timetable. Instead of each student running to the office, the **monitor** fetches it **once** and pins it on the class board. Everyone reads the board.

When the office **changes** the timetable, it tells the monitor: "The timetable is old now." The monitor fetches the new one.

- **The office** = the server.
- **The monitor** = RTK Query.
- **The class board** = the cache in the Redux store.
- **Students reading the board** = components using `useGetJobsQuery()`.
- **"The timetable is old now"** = a mutation that invalidates a tag.

## 🧑‍💻 Code example

RTK Query also works without React. This example uses `queryFn` with fake data, so no real server is needed.

Run `npm install @reduxjs/toolkit`. Save this as `rtkq.js` and run `node rtkq.js`. It uses CommonJS.

```js
const { configureStore } = require('@reduxjs/toolkit');           // load the store creator
const { createApi, fakeBaseQuery } = require('@reduxjs/toolkit/query'); // RTK Query without React

let serverCalls = 0;                                              // counts how often the "server" is really called
const jobsApi = createApi({                                       // describe our API once
  reducerPath: 'jobsApi',                                         // where the cache lives in the store
  baseQuery: fakeBaseQuery(),                                     // we use queryFn below instead of real HTTP
  tagTypes: ['Job'],                                              // a label used to refresh data after changes
  endpoints: (build) => ({                                        // the list of endpoints
    getJobs: build.query({                                        // a "query" = read data
      queryFn: async () => {                                      // pretend to call GET /jobs
        serverCalls++;                                            // count a real call
        return { data: [`Job list v${serverCalls}`] };            // RTK Query wants { data } (or { error })
      },                                                          // end of queryFn
      providesTags: ['Job'],                                      // this data is tagged "Job"
    }),                                                           // end of getJobs
    addJob: build.mutation({                                      // a "mutation" = change data
      queryFn: async () => ({ data: 'created' }),                 // pretend to call POST /jobs
      invalidatesTags: ['Job'],                                   // after it, anything tagged "Job" is stale → refetch
    }),                                                           // end of addJob
  }),                                                             // end of endpoints
});                                                               // end of createApi

const store = configureStore({                                    // the store
  reducer: { [jobsApi.reducerPath]: jobsApi.reducer },            // add the API's cache reducer
  middleware: (getDefault) => getDefault().concat(jobsApi.middleware), // add its middleware (caching, refetching)
});                                                               // end of configureStore

async function main() {                                           // async so we can await
  const sub1 = store.dispatch(jobsApi.endpoints.getJobs.initiate()); // component 1 asks for jobs
  const sub2 = store.dispatch(jobsApi.endpoints.getJobs.initiate()); // component 2 asks too → shares the same request
  console.log('first:', (await sub1).data, '| calls:', serverCalls); // data arrives; only 1 server call
  await sub2;                                                     // second subscriber gets the same cached data
  await store.dispatch(jobsApi.endpoints.addJob.initiate());      // create a job → invalidates the "Job" tag
  await new Promise((r) => setTimeout(r, 50));                    // give RTK Query a moment to refetch
  const fresh = jobsApi.endpoints.getJobs.select()(store.getState()); // read the cached result from the store
  console.log('after mutation:', fresh.data, '| calls:', serverCalls); // refetched automatically → 2 calls
  sub1.unsubscribe(); sub2.unsubscribe();                         // components "unmount"
}                                                                 // end of main
main();                                                           // run it
```

**Output:**

```text
first: [ 'Job list v1' ] | calls: 1
after mutation: [ 'Job list v2' ] | calls: 2
```

Two "components" asked for jobs, but the server was called **once**. After the mutation, the list refetched **by itself**.

## 🔍 Deeper version

**In a React app** you use `createApi` from `@reduxjs/toolkit/query/react` with `fetchBaseQuery`:

```js
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'; // React version (generates hooks)

export const jobsApi = createApi({                                        // define the API once
  baseQuery: fetchBaseQuery({ baseUrl: '/api', credentials: 'include' }), // fetch wrapper; send cookies
  tagTypes: ['Job'],                                                      // cache labels
  endpoints: (build) => ({                                                // endpoints
    getJobs: build.query({ query: () => '/jobs', providesTags: ['Job'] }), // GET /api/jobs
    addJob: build.mutation({                                              // POST /api/jobs
      query: (body) => ({ url: '/jobs', method: 'POST', body }),          // request details
      invalidatesTags: ['Job'],                                           // refetch job lists afterwards
    }),                                                                   // end of addJob
  }),                                                                     // end of endpoints
});                                                                       // end of createApi
export const { useGetJobsQuery, useAddJobMutation } = jobsApi;            // auto-generated hooks
```

In a component: `const { data, isLoading, error } = useGetJobsQuery();` and `const [addJob, { isLoading: saving }] = useAddJobMutation();`.

**What it handles for you:**

| Feature | Meaning |
|---|---|
| Caching | results are stored per endpoint + argument |
| Deduplication | the same request at the same time is sent once |
| Cache lifetime | unused data is removed after `keepUnusedDataFor` (60 seconds by default) |
| Refetching | on tag invalidation, `refetchOnMountOrArgChange`, `refetchOnFocus`, `pollingInterval` |
| Status flags | `isLoading`, `isFetching`, `isSuccess`, `isError` |
| Optimistic updates | change the cache first with `updateQueryData`, roll back if the request fails |

**Specific tags.** `providesTags: (result) => result.map((j) => ({ type: 'Job', id: j.id }))` lets a mutation invalidate only **one** job: `invalidatesTags: (r, e, arg) => [{ type: 'Job', id: arg.id }]`.

**RTK Query vs TanStack Query:** both solve the same problem. RTK Query fits teams that already use Redux. TanStack Query is independent of Redux and very popular. See [TanStack Query](topic:react/tanstack-query) and [how to choose](topic:redux-context/how-to-choose).

## 🎯 Why do we use it?

- **Server data is different from UI state.** It can go stale, it's shared, and it needs caching. Writing that by hand with thunks takes a lot of code.
- **Less code.** No more hand-written `loading`/`error` reducers for every endpoint.
- **Fewer network calls.** Caching and deduplication avoid repeated requests.
- **Consistent UI.** After a change, every screen that shows the data refreshes automatically.

## ⚠️ Common mistakes

- **Forgetting to add `api.middleware`** to the store. Caching, invalidation and polling stop working.
- **Copying query results into a normal slice.** Now you have two copies that can disagree. Read from the query hook instead.
- **Not setting tags.** Mutations then don't refresh anything, and the UI shows old data.
- **Confusing `isLoading` with `isFetching`.** `isLoading` is only the **first** load. `isFetching` is true on **every** refetch.

## 🗣️ How to answer in an interview

> "RTK Query is the data-fetching and caching layer built into Redux Toolkit. I define endpoints once with createApi. Queries read data and mutations change it. In React it generates hooks like useGetJobsQuery, which give me data, isLoading and error.
>
> It caches results per endpoint and argument, deduplicates requests, and removes unused data after a timeout. Cache invalidation works with tags: queries say what they provide, mutations say what they invalidate, and the matching queries refetch automatically. I'd use it for server data and keep normal slices for pure UI state, like filters. If the project doesn't use Redux, TanStack Query solves the same problem."

## 🔁 Follow-up questions

### What's the difference between `isLoading` and `isFetching`?

`isLoading` is true only during the **first** request, when there's no data yet. `isFetching` is true during **any** request, including background refetches.

### How do you do an optimistic update?

In the mutation's `onQueryStarted`, call `api.util.updateQueryData` to change the cache right away. Keep the returned patch. If the request fails, call `patch.undo()`.

### How do you skip a query until you have an id?

Pass `skip`: `useGetJobQuery(id, { skip: !id })`, or pass the special `skipToken` value as the argument.

### Can RTK Query and slices live in the same store?

Yes. The API's reducer is just one more slice. Many apps use RTK Query for server data and normal slices for UI state.

## ✅ Quick check

### 1. Three components mount at the same time and all call `useGetJobsQuery()`. How many network requests are made?

:::answer
**One.** RTK Query deduplicates the requests and shares the cached result.
:::

### 2. After `addJob` runs, the job list doesn't update. What's the most likely missing piece?

- A) `api.middleware` in the store, or matching `providesTags` / `invalidatesTags`
- B) `React.memo` on the list
- C) A `useEffect` that refetches

:::answer
**A.** Refetching after a mutation depends on tags, and the middleware must be added to the store.
:::

### 3. True or false: you should copy RTK Query data into a separate slice to use it.

:::answer
**False.** Read it from the query hook (or `endpoint.select()`). Copying creates two sources of truth.
:::
