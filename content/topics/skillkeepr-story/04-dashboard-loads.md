---
template: chapter
title: "The dashboard loads: from a click to numbers on screen"
stack: skillkeepr-story
order: 4
level: Intermediate
mustKnow: true
askedFrequency: common
summary:
  - The dashboard page's code loads only when Priya opens it (React.lazy code splitting).
  - Redux + redux-saga runs the API call, tracks loading and error, and stores the result.
  - The request goes API Gateway → Lambda → Acme's MongoDB, where an aggregation counts many things in one go ($facet).
  - The backend sends one JSON shape (status, code, results). Selectors pick the numbers, and Mantine components draw the tiles.
  - Good dashboards show loading, error and empty states, not just the happy path.
cards:
  - q: What happens when Priya opens the dashboard?
    a: The page's code loads lazily, a saga calls the API, Lambda runs an aggregation in Acme's database, and the numbers come back as JSON and render as tiles.
  - q: Why use redux-saga for the dashboard call?
    a: Sagas keep side effects out of components, track loading and errors in one place, and can cancel old requests with takeLatest.
  - q: What does $facet do in a dashboard query?
    a: It runs several counting pipelines over the same documents in one query, so you get all the tile numbers at once.
  - q: Why does the backend return a fixed JSON shape?
    a: The frontend can handle every response the same way, for example reading results and mapping error codes to messages.
  - q: What makes a dashboard query slow?
    a: Missing indexes, scanning every document, or counting in many separate queries. Check with explain() and add indexes on the fields you filter by.
---

## 💡 What happens in this chapter

Priya is logged in. She clicks **Dashboard**.

The browser downloads the dashboard's code, asks the API for numbers, and draws tiles like "Total candidates" and "Shortlisted". In the backend, one database query counts everything at once.

This chapter follows that one click, from React to MongoDB and back.

## 🏠 Real-life example

Think of a **school principal asking for today's attendance summary**.

- **Opening the summary folder only when needed** = lazy-loading the dashboard page.
- **The assistant who goes to collect the numbers** = the saga that calls the API.
- **"Collecting… please wait" on the door** = the loading state.
- **The clerk who counts everyone in one round through the register** = the `$facet` aggregation counting many things in one query.
- **The summary sheet with a fixed format** = the JSON envelope the backend always returns.
- **The notice board showing the numbers** = Mantine components drawing the tiles.

## 🗺️ The flow

```text
Priya clicks "Dashboard"
   │
React Router → React.lazy loads the dashboard page's JS file
   │
Page mounts → dispatch(getDashboard())
   │
redux-saga: takeLatest(GET_DASHBOARD)
   ├─ set loading = true
   ├─ call the API helper → fetch with cookies + tenant header
   │      │
   │      ▼
   │   API Gateway → Lambda
   │      ├─ check token, tenant, permission
   │      ├─ connect to Acme's database
   │      └─ aggregate:
   │           [ { $facet: {
   │               total:        [ { $count: 'n' } ],
   │               shortlisted:  [ { $match: { status: 'shortlisted' } }, { $count: 'n' } ],
   │               interviewing: [ { $match: { status: 'interviewing' } }, { $count: 'n' } ] } } ]
   │      ▼
   │   { status: 1, code: ..., results: { total, shortlisted, ... } }
   │
   ├─ success → put(getDashboardSuccess(results))   loading = false
   └─ failure → error handler → toast message       loading = false
   │
Selector reads the numbers → Mantine cards render the tiles
```

## 🧱 Tech used

| Piece | Technology | Learn it |
|---|---|---|
| Loading the page's code | React.lazy + Suspense | [Code splitting](topic:react/code-splitting) |
| Running the API call | redux-saga (takeLatest, call, put) | [redux-saga basics](topic:redux-context/redux-saga), [Saga effects](topic:redux-context/saga-effects) |
| Storing the result | Redux store + selectors | [Redux data flow](topic:redux-context/redux-data-flow), [Memoised selectors](topic:redux-context/selectors-memoized) |
| Drawing tiles | Mantine Grid and cards | [Mantine Grid](topic:mantine-tailwind/mantine-grid) |
| Loading and error states | UI states | [Calling APIs](topic:react/calling-apis) |
| The query | MongoDB aggregation with `$facet` | [Aggregation basics](topic:mongodb/aggregation-basics), [Advanced aggregation](topic:mongodb/advanced-aggregation) |
| Speed | Indexes, explain() | [Indexes](topic:mongodb/indexes), [explain()](topic:mongodb/explain) |
| Response shape | One JSON envelope | [Consistent response format](topic:express/response-format) |

## 🧑‍💻 Key code idea

What a `$facet` dashboard query does, in plain JavaScript: **many counts in one pass**. Save as `dashboard.js` and run `node dashboard.js`.

```js
const candidates = [                                 // pretend rows from Acme's database
  { name: 'Rahul', status: 'shortlisted' },          // our running example candidate
  { name: 'Meena', status: 'applied' },              // another candidate
  { name: 'Arjun', status: 'applied' },              // another candidate
  { name: 'Sara', status: 'interviewing' },          // another candidate
];                                                   // end of the sample data
function dashboardTiles(rows) {                      // works like $facet: many counts in one pass
  const tiles = { total: 0, applied: 0, shortlisted: 0, interviewing: 0 }; // every tile starts at 0
  for (const row of rows) {                          // look at each candidate once
    tiles.total += 1;                                // count everyone
    if (row.status in tiles) tiles[row.status] += 1; // count by status if it has a tile
  }                                                  // end of the loop
  return { status: 1, code: 200, results: tiles };   // the same envelope shape the API sends back
}                                                    // end of dashboardTiles
console.log(JSON.stringify(dashboardTiles(candidates))); // print what the browser receives
```

```text
{"status":1,"code":200,"results":{"total":4,"applied":2,"shortlisted":1,"interviewing":1}}
```

In the real backend, MongoDB does this counting inside the database with `$facet`, so millions of rows never travel to the server.

## 🧗 Hard parts and trade-offs

- **`$facet` as the first stage reads every document.** Each branch can't use an index on its own. For big collections, put a `$match` with an indexed field **before** `$facet`, or keep counts in a summary document.
- **Many small queries vs one big one.** One aggregation means one round trip. But one huge pipeline is harder to read and tune.
- **Loading states matter.** Without them, Priya sees zeros or a blank screen and thinks the data is wrong.
- **Old requests.** If she clicks fast between pages, `takeLatest` cancels the older saga so stale data doesn't overwrite new data.
- **Re-renders.** A selector that returns a new object every time makes the page re-render too often. Memoised selectors fix this (see [memoised selectors](topic:redux-context/selectors-memoized)).

## 🙋 My part

- My resume says I wrote **complex queries and MongoDB aggregation pipelines over multi-tenant data**, and applied indexing so response times held as data grew.
- [FILL IN: confirm ONE real pipeline you wrote — which screen, which stages — and ONE index you added, before claiming them. See [MongoDB aggregation and indexing (resume)](topic:resume/mongodb-aggregation-indexing).]
- [FILL IN: which frontend screens you built, if any.]

## 🗣️ How to explain it in an interview

> "When a recruiter opens the dashboard, the page's code is lazy-loaded, and a saga fires the API call. It sets a loading flag, calls our API helper with the cookies and tenant header, and stores the result or shows an error toast.
>
> On the backend, API Gateway invokes a Lambda function. It checks the token, tenant and permission, connects to that company's database, and runs an aggregation. For dashboards we use `$facet` to compute several counts in one query. The response always has the same envelope, so the frontend handles it the same way. Selectors read the numbers and Mantine components render the tiles.
>
> The main performance points are indexes on the fields we filter by, and checking the query with explain()."

## 🔁 Follow-up questions

### Why not compute the counts in Node.js?

You'd have to send every document from the database to the server. Counting inside MongoDB sends back only the numbers, which is much faster.

### How would you make the dashboard faster if it grew huge?

Filter early with an indexed `$match`, keep pre-computed counts updated by background jobs, or cache the result for a short time per company. See [caching](topic:system-design/caching).

### Why redux-saga and not just useEffect?

Sagas keep API logic out of components, share one error handler, and can cancel stale requests with `takeLatest`. For a new project, a data library like TanStack Query is also a good choice. See [how to choose](topic:redux-context/how-to-choose).

### What do you show when there's no data yet?

An empty state that explains what to do next, like "Add your first job". Zeros alone confuse users.

## 📚 Topics to revise

- [Code splitting](topic:react/code-splitting)
- [redux-saga basics](topic:redux-context/redux-saga)
- [Calling APIs: loading, error and empty states](topic:react/calling-apis)
- [Aggregation basics](topic:mongodb/aggregation-basics)
- [explain(): COLLSCAN vs IXSCAN](topic:mongodb/explain)
- [MongoDB aggregation and indexing (resume)](topic:resume/mongodb-aggregation-indexing)
