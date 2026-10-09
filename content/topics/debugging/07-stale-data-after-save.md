---
title: The UI shows old data after saving a form
template: scenario
stack: debugging
order: 7
level: Intermediate
mustKnow: false
askedFrequency: common
summary:
  - "Detect: the user saves, sees \"Saved!\", but the list or page still shows the old value until a refresh."
  - "Debug: Network tab — did the save succeed (200)? Was the list fetched again? Or is the UI showing old state or an old cache?"
  - "Fix: update state from the server's response, re-fetch or invalidate the cache after saving, and never mutate state directly — always return new objects."
  - "Prevent: one source of truth for server data (e.g. TanStack Query or RTK Query with cache invalidation) and tests for the save flow."
cards:
  - q: A user saves a form but the list still shows the old value. What do you check first?
    a: The Network tab — did the PUT/PATCH return 200, and was the list fetched again afterwards? Then whether the UI is reading old state or a cache.
  - q: Why can mutating state directly cause stale UI?
    a: "React (and Redux) detect changes by reference. If you change an object in place (list[0].name = 'x'), the reference stays the same, so React thinks nothing changed and doesn't re-render."
  - q: How do you update a list item without mutation?
    a: "Create new objects: setJobs(jobs.map(j => j.id === saved.id ? saved : j))."
  - q: What is cache invalidation in data-fetching libraries?
    a: Marking cached data as old after a change, so the library fetches it again. In TanStack Query you call queryClient.invalidateQueries({ queryKey }).
  - q: Why use the server's response to update the UI?
    a: The server may change things you didn't send, like updatedAt, computed fields or normalised values. Using its response keeps the UI exactly in sync.
---

## 💡 What is it?

The symptom: a recruiter edits a job title and clicks **Save**. They see "Saved successfully". But the job list **still shows the old title**. After a page refresh, the new title appears.

So the save worked. The screen just didn't update.

## 🏠 Real-life example

Think of a **school notice board** and the **office register**.

The office updates the exam date in the register. But nobody changes the paper on the notice board. Students still see the **old date**, until someone reprints the notice.

- **The office register** = the database on the server.
- **The notice board** = the UI (React state or a cache).
- **Updating the register only** = saving to the API without updating the UI.
- **Reprinting the notice** = re-fetching or updating state after the save.
- **Writing on the old paper with a pen** = mutating state directly — React doesn't notice it.

## 🔎 Detect

1. Reproduce: edit, save, and look at the list.
2. Refresh the page. If the new value appears now, the **server has it** and the **UI is stale**.
3. If it's still old after refresh, the save itself failed. That's a different bug.

## 🐞 Debug

Open the **Network** tab and go through these checks:

| Check | What it tells you |
|---|---|
| Did the `PUT`/`PATCH` return **200** with the new value? | If not, it's a backend/save bug |
| Was the list **fetched again** after the save? | If not, nobody told the list to refresh |
| Did the list's `GET` return the **new** value? | If not, a cache (browser, CDN or server) is serving old data |
| Does React DevTools show the **new value in state**? | If the state is new but the screen is old, a component isn't re-rendering |

Also look for **direct mutation** in the code, like `job.title = newTitle` or `list.push(x)`.

## 🔧 Fix

**Before (stale):** the object is changed in place, so React doesn't see a change.

```jsx
async function handleSave(updated) {                              // called when the form is saved
  await fetch(`/api/jobs/${updated.id}`, {                        // send the change to the server
    method: 'PATCH',                                              // PATCH = partial update
    headers: { 'Content-Type': 'application/json' },              // we are sending JSON
    body: JSON.stringify(updated),                                // the changed fields
  });                                                             // end of fetch options
  const job = jobs.find((j) => j.id === updated.id);              // find the same object that is in state
  job.title = updated.title;                                      // MUTATION: same reference, React won't re-render
  setJobs(jobs);                                                  // same array reference → React skips the update
}                                                                 // end of handleSave
```

**After (fresh):** use the server's response and create new objects.

```jsx
async function handleSave(updated) {                              // called when the form is saved
  const res = await fetch(`/api/jobs/${updated.id}`, {            // send the change to the server
    method: 'PATCH',                                              // PATCH = partial update
    headers: { 'Content-Type': 'application/json' },              // we are sending JSON
    body: JSON.stringify(updated),                                // the changed fields
  });                                                             // end of fetch options
  if (!res.ok) throw new Error(`Save failed: ${res.status}`);     // don't update the UI if the save failed
  const saved = await res.json();                                 // the server's version (with updatedAt etc.)
  setJobs((prev) => prev.map((j) => (j.id === saved.id ? saved : j))); // NEW array, NEW item → React re-renders
}                                                                 // end of handleSave
```

**With a data-fetching library**, tell it the data is old:

```js
await updateJob(updated);                                         // save to the server
queryClient.invalidateQueries({ queryKey: ['jobs'] });            // TanStack Query: re-fetch every "jobs" query
```

**With Redux Toolkit**, the reducer can "mutate" safely inside `createSlice`, because Immer creates new objects for you. Outside RTK, always return new objects.

## 🛡️ Prevent

- Keep **one source of truth** for server data. A library like TanStack Query or RTK Query, with cache invalidation after each save, removes this whole class of bugs.
- **Never mutate** state. Use `map`, `filter`, spread (`{ ...job, title }`), or Immer.
- Turn on **Redux's immutability check** in development (it's on by default in RTK's `configureStore`).
- Add a test: "after saving, the list shows the new title".
- Check **cache headers** on API responses that change often.

## 🗣️ How to answer in an interview

> **Short version:** "I'd check the Network tab: did the save succeed, and was the list re-fetched? If the save worked, I update the state from the response, or re-fetch or invalidate the cache. I also look for direct state mutation, because React only re-renders when the reference changes."
>
> **Full version:** "First I refresh the page. If the new value appears, the server is fine and the UI is stale. Then I check the Network tab: the PATCH returned 200, but the list wasn't fetched again, or it came from a cache. In React DevTools I check if the state has the new value. A common cause is mutating state, like changing an object in place, so the reference doesn't change and React skips the re-render. The fix is to update state from the server's response with new objects, using map and spread, or to invalidate the cache with a library like TanStack Query or RTK Query. To prevent it, I keep one source of truth for server data and add a test for the save flow."

[FILL IN: SkillKeepr uses Redux with sagas — add a real case where you refreshed data after a save, if you have one.]

## 🔁 Follow-up questions

### What is an optimistic update?

Updating the UI **before** the server replies, to make it feel instant. If the save fails, you roll the UI back and show an error.

### Why can a CDN or browser serve old API data?

If the response has long cache headers, the browser or a CDN may reuse it. API responses that change often should use `Cache-Control: no-store` or a short max-age.

### How does Redux Toolkit let you write `state.title = x`?

`createSlice` uses Immer. You write "mutating" code on a draft, and Immer produces a new immutable state object behind the scenes.

### Should you re-fetch the whole list or just update one item?

Updating one item from the response is faster. Re-fetching is simpler and safer when the save can affect sorting, counts or other items.

## ✅ Quick check

### 1. After saving, a refresh shows the new value. Where is the bug?

:::answer
**In the UI**, not the server. The state or cache wasn't updated after the save.
:::

### 2. Why doesn't this re-render? `jobs[0].title = 'New'; setJobs(jobs);`

:::answer
`jobs` is the **same array reference**, so React thinks nothing changed. Create a new array and a new object instead.
:::

### 3. Which TanStack Query call makes the job list re-fetch after a save?

- A) `queryClient.clear()`
- B) `queryClient.invalidateQueries({ queryKey: ['jobs'] })`
- C) `useEffect(() => {}, [])`

:::answer
**B.** It marks the "jobs" data as old, so it is fetched again.
:::
