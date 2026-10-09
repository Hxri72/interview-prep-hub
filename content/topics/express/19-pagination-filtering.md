---
title: Pagination, filtering and sorting in routes
stack: express
order: 19
level: Intermediate
mustKnow: false
askedFrequency: common
summary:
  - "Pagination means sending a big list in small pages, like ?page=2&limit=20, instead of everything at once."
  - "Filtering keeps only matching items (?status=open). Sorting orders them (?sort=-salary means biggest first)."
  - Always set a default and a maximum limit, and only allow sorting on fields you choose (a whitelist).
  - Send page info back with the data (page, limit, total, totalPages) so the frontend can draw page buttons.
  - "Offset (skip) pagination is simple but gets slow on huge tables. Cursor pagination (?after=<lastId>) stays fast."
cards:
  - q: Why paginate an API list?
    a: Sending thousands of rows at once is slow for the database, the network and the browser. Pages keep each response small and fast.
  - q: How do you calculate which items belong to page 3 with limit 10?
    a: "Skip (page - 1) × limit = 20 items, then take 10. So items 21 to 30."
  - q: Why put a maximum on limit?
    a: Otherwise a user can send ?limit=1000000 and make the server load the whole table, which can crash it.
  - q: Why use a whitelist for sort fields?
    a: So users can only sort by safe, indexed fields. Sorting by any field could be slow, or leak data like a hidden password field.
  - q: Offset vs cursor pagination?
    a: "Offset: ?page=50 skips many rows, which is slow on big data and can show duplicates when data changes. Cursor: ?after=lastId continues from the last item, fast and stable."
---

## 💡 What is it?

When an API returns a list, the list can be huge. So we don't send everything at once. We use three tools:

- **Pagination**: send the list in small **pages**, like 20 items at a time.
- **Filtering**: send only the items that **match**, like jobs that are "open".
- **Sorting**: send the items in a chosen **order**, like highest salary first.

The client asks for these with **query strings** in the URL, like `/jobs?page=2&limit=20&status=open&sort=-salary`.

## 🏠 Real-life example

Think of **a big online shopping site**.

You search for "school shoes". There are 5,000 results. The site doesn't show all 5,000 on one screen. It shows **20 per page**, with buttons "1, 2, 3 … Next".

On the left side you can tick **"Black"** and **"Size 7"**. Now you only see black shoes in size 7. At the top you choose **"Price: low to high"**.

- **20 per page with Next buttons** = pagination (`page`, `limit`).
- **Ticking "Black" and "Size 7"** = filtering (`?color=black&size=7`).
- **"Price: low to high"** = sorting (`?sort=price`).
- **"Showing 21–40 of 5,000"** = the page info the server sends back (`total`, `totalPages`).
- The site **won't let you pick "show 1,000,000 per page"** = a maximum limit.

## 🧑‍💻 Code example

Set up:

```bash
npm init -y
npm install express
```

Save this as `page.js`. Run it with `node page.js`.

```js
const express = require('express');                                   // load Express
const app = express();                                                // create the app

const jobs = Array.from({ length: 23 }, (_, i) => ({                  // 23 fake jobs for the demo
  id: i + 1,                                                          // ids 1 to 23
  title: `Job ${i + 1}`,                                              // a simple title
  status: i % 3 === 0 ? 'closed' : 'open',                            // every 3rd job is closed
  salary: 30000 + i * 1000,                                           // salaries go up by 1000
}));                                                                  // end of the fake data

const SORTABLE = ['id', 'salary', 'title'];                           // the only fields users may sort by

app.get('/jobs', (req, res) => {                                      // GET /jobs?page=2&limit=5&status=open&sort=-salary
  const page = Math.max(1, Number(req.query.page) || 1);              // page number; at least 1; default 1
  const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 10)); // items per page; between 1 and 50; default 10
  let list = jobs;                                                    // start with all jobs

  if (req.query.status) {                                             // filter: only if ?status= is given
    list = list.filter((j) => j.status === req.query.status);         // keep jobs with that status
  }                                                                   // end of filter

  const sort = String(req.query.sort || 'id');                        // e.g. "salary" (small→big) or "-salary" (big→small)
  const field = sort.replace(/^-/, '');                               // remove the "-" to get the field name
  if (!SORTABLE.includes(field)) {                                    // block fields we don't allow
    return res.status(400).json({ error: `Cannot sort by ${field}` }); // 400 = bad request
  }                                                                   // end of the check
  const dir = sort.startsWith('-') ? -1 : 1;                          // -1 = descending, 1 = ascending
  list = [...list].sort((a, b) => (a[field] > b[field] ? dir : -dir)); // sort a copy, not the original

  const total = list.length;                                          // how many items match, before paging
  const items = list.slice((page - 1) * limit, page * limit);         // cut out just this page
  res.json({ items, page, limit, total, totalPages: Math.ceil(total / limit) }); // data + info for the UI
});                                                                   // end of the route

app.listen(3000, () => console.log('Listening on 3000'));             // start the server on port 3000
```

Try it:

```text
$ curl "http://localhost:3000/jobs?page=2&limit=3&status=open&sort=-salary"
{"items":[{"id":18,"title":"Job 18","status":"open","salary":47000},
          {"id":17,"title":"Job 17","status":"open","salary":46000},
          {"id":15,"title":"Job 15","status":"open","salary":44000}],
 "page":2,"limit":3,"total":15,"totalPages":5}

$ curl "http://localhost:3000/jobs?sort=password"
{"error":"Cannot sort by password"}

$ curl "http://localhost:3000/jobs?limit=1000"
… "limit":50 …        ← the server lowered it to the maximum
```

## 🔍 Deeper version

**With a real database (MongoDB + Mongoose):**

```js
const filter = { tenantId: req.user.tenantId };              // always limit to the user's company first (multi-tenant)
if (req.query.status) filter.status = String(req.query.status); // String() stops tricks like ?status[$ne]=x
const [items, total] = await Promise.all([                   // run both queries at the same time
  Job.find(filter).sort({ salary: -1 }).skip((page - 1) * limit).limit(limit).lean(), // one page of results
  Job.countDocuments(filter),                                // total count for the page buttons
]);                                                          // end of Promise.all
```

Add a database index that matches the filter and the sort, for example `{ tenantId: 1, status: 1, salary: -1 }`. Without it, the database reads every row. See the MongoDB topics on indexes.

**Offset vs cursor pagination:**

| | Offset (`?page=50`) | Cursor (`?after=<lastId>`) |
|---|---|---|
| How it works | Skip `(page-1) × limit` rows, then take `limit` | "Give me items after this ID" |
| Speed on big data | Gets slower, because the DB still walks past all skipped rows | Stays fast, because it uses an index to jump straight there |
| Jump to page 37 | Yes | No, only next or previous |
| New items added while you browse | You may see duplicates or miss items | Stable |
| Good for | Admin tables with page numbers | Infinite scroll, feeds, huge lists |

A cursor query looks like `Job.find({ _id: { $gt: after } }).sort({ _id: 1 }).limit(limit)`. You send back `nextCursor` (the last item's ID) with the data.

**Count is expensive.** On very big collections, `countDocuments` can be slow. Some APIs skip the total and only return `hasNextPage`.

**Express 5 query parsing.** Express 5 uses the "simple" query parser by default. `?tags=a&tags=b` becomes an array `['a', 'b']`. But nested syntax like `?filter[status]=open` is **not** turned into an object; you get a key called `"filter[status]"`. If you need nested objects, turn on the extended parser with `app.set('query parser', 'extended')`. Also, `req.query` is now a getter, so you can't replace it. Put cleaned values in a new variable instead. See [Express 5 changes](topic:express/express-5).

**Always treat query values as untrusted input.** A value can be a string, an array, or missing. Convert numbers with `Number()`, give defaults, set limits, and validate with a schema (Zod or Joi). See [validation](topic:express/validation).

## 🎯 Why do we use it?

- **Speed.** Small pages mean fast database queries, small responses and a fast UI.
- **Safety.** A maximum limit stops one request from loading a million rows and crashing the server.
- **Better user experience.** Users find things faster with filters and sorting.
- **Lower cost.** Less data moves between the database, the server and the browser.

## ⚠️ Common mistakes

- **No maximum limit.** `?limit=999999` can bring the server down.
- **Sorting by any field the user sends.** It can be slow (no index), or it can sort by a field that should stay hidden. Use a whitelist.
- **Putting raw query values into a database query.** `?status[$ne]=closed` can become an object in some setups, which is a NoSQL injection trick. Convert values with `String()` or validate them.
- **Forgetting the tenant filter.** In a [multi-tenant](glossary:multi-tenant) app, every list query must include the tenant's ID first. Otherwise one company can see another company's data.

## 🗣️ How to answer in an interview

> "For list endpoints, I support pagination, filtering and sorting through query strings, like `?page=2&limit=20&status=open&sort=-createdAt`. I always parse and validate them: default values, a minimum and a maximum limit, and a whitelist of sortable fields, so nobody can request a million rows or sort by a hidden field.
>
> In MongoDB I build the filter, add the tenant ID first, and use skip and limit with a matching compound index. I run the find and the count in parallel. The response includes the items plus page, limit, total and totalPages for the UI.
>
> For very large or fast-changing lists, I prefer cursor pagination with `?after=<lastId>`. Large skips get slow, and cursors stay fast and don't show duplicates when new data arrives."

[FILL IN: a real list endpoint you paginated at SkillKeepr (e.g. candidates or jobs), and whether it used page numbers or cursors — only if you know.]

## 🔁 Follow-up questions

### Why does `skip` get slow on big collections?

The database can't jump straight to row 100,000. It still walks past all the skipped rows, one by one. So page 5,000 is much slower than page 1. Cursor pagination uses an index to jump straight to the right place.

### How do you return the total count efficiently?

Run the count in parallel with the page query, using `Promise.all`. Make sure the filter uses an index. For huge collections, return `hasNextPage` instead of an exact total. You can find it by fetching `limit + 1` items and checking if the extra one exists.

### How would you support searching by text?

For simple cases, a case-insensitive filter on an indexed field. For real search, a text index (MongoDB `$text`), Atlas Search, or a search engine like Elasticsearch. Always escape regex characters in the user's text.

### Where should the validation of page and limit live?

In a validation middleware or schema (Zod or Joi) before the controller. Then every list route gets the same rules, and the controller receives clean numbers.

## ✅ Quick check

### 1. `page=4`, `limit=25`. How many items are skipped?

:::answer
**75.** The formula is `(page - 1) × limit = 3 × 25`. The response shows items 76 to 100.
:::

### 2. Which request should your API reject or limit?

- A) `/jobs?page=2&limit=20`
- B) `/jobs?limit=500000`
- C) `/jobs?status=open`

:::answer
**B.** The limit is far too big. Cap it at a maximum (like 50 or 100), or return a 400 error.
:::

### 3. A feed gets new posts every second. Which pagination type avoids showing the same post twice?

:::answer
**Cursor pagination** (`?after=<lastId>`). With page numbers, new posts push older ones onto the next page, so the user sees duplicates.
:::
