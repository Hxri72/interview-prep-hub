---
title: "Pagination: offset vs cursor"
stack: rest-auth
order: 7
level: Intermediate
mustKnow: false
askedFrequency: common
summary:
  - Pagination means sending a big list in small pages, like 20 items at a time.
  - "Offset paging (?page=3&limit=20) skips items. It's simple and allows \"jump to page 7\", but it gets slow on deep pages and can repeat or miss items when data changes."
  - "Cursor paging (?after=<last id>&limit=20) continues after the last item you saw. It's fast at any depth and stable when new items arrive."
  - Cursor paging needs a stable, unique sort order, like createdAt plus _id, backed by an index.
  - Use offset for small admin tables with page numbers. Use cursor for feeds, infinite scroll, big data and syncing.
cards:
  - q: What is offset pagination?
    a: "The client asks for a page number or offset (?page=3&limit=20). The database skips (page-1) × limit rows and returns the next limit."
  - q: What is cursor pagination?
    a: "The client sends a pointer to the last item it saw (?after=abc&limit=20). The server returns items after that point, plus the next cursor."
  - q: Two problems with offset pagination?
    a: "1) Deep pages are slow, because the database still walks through all skipped rows. 2) If items are added or removed between requests, items repeat or get skipped."
  - q: What does cursor pagination need to work well?
    a: A stable, unique sort order (like createdAt + _id) and an index on those fields.
  - q: What can't you easily do with cursor pagination?
    a: Jump straight to page 50, or show "page 7 of 120". You move only next or previous.
---

## 💡 What is it?

When a list is big, the [API](glossary:api) sends it in **pages**: 20 items now, 20 more later. This is **pagination**.

There are two main styles:

- **Offset:** "Give me page 3" → `?page=3&limit=20`. The server **skips** 40 items and sends the next 20.
- **Cursor:** "Give me 20 items **after** the last one I saw" → `?after=<id>&limit=20`.

## 🏠 Real-life example

Think of **reading names from a long attendance register**.

**Offset style:** "Read from **line 41**." But while you were away, the teacher added a new student at the **top**. Now line 41 is the person you already read! You read one name **twice**.

**Cursor style:** you keep a **bookmark** on the last name you read, "Ravi". Next time you say, "Continue **after Ravi**." New names at the top don't matter. You never repeat or miss anyone.

- **Line number** = the offset.
- **Bookmark** = the cursor.
- **New student at the top** = new data arriving while the user is paging.

## 🧑‍💻 Code example

Plain JavaScript, no database. It shows the problem with offset paging. Save as `paging.js` and run `node paging.js`.

```js
let jobs = [50, 49, 48, 47, 46, 45].map((id) => ({ id }));        // newest first: job 50 is the newest

function offsetPage(page, limit) {                                  // OFFSET style: ?page=2&limit=2
  const skip = (page - 1) * limit;                                  // page 2 → skip the first 2
  return jobs.slice(skip, skip + limit).map((j) => j.id);           // take the next 2 ids
}                                                                   // end of offsetPage

function cursorPage(after, limit) {                                 // CURSOR style: ?after=49&limit=2
  const list = after ? jobs.filter((j) => j.id < after) : jobs;     // only items older than the cursor
  const items = list.slice(0, limit).map((j) => j.id);              // take the next 2 ids
  return { items, nextCursor: items.at(-1) };                       // the last id becomes the next cursor
}                                                                   // end of cursorPage

console.log('offset page 1:', offsetPage(1, 2));                   // user reads page 1
const c1 = cursorPage(null, 2);                                    // same user, cursor style, page 1
console.log('cursor page 1:', c1.items, 'next =', c1.nextCursor);  // shows the cursor for page 2

jobs.unshift({ id: 51 });                                          // a NEW job is posted before the user clicks "next"

console.log('offset page 2:', offsetPage(2, 2));                   // offset: everything shifted by one
console.log('cursor page 2:', cursorPage(c1.nextCursor, 2).items); // cursor: continues exactly after 49
```

Output:

```text
offset page 1: [ 50, 49 ]
cursor page 1: [ 50, 49 ] next = 49
offset page 2: [ 49, 48 ]
cursor page 2: [ 48, 47 ]
```

**What to notice:** with offset paging, job **49 appears twice**, because a new job pushed everything down by one. The cursor continued exactly after 49.

## 🔍 Deeper version

**Offset in MongoDB:** `find(filter).sort({ createdAt: -1 }).skip(40).limit(20)`.
**Cursor in MongoDB:** `find({ ...filter, createdAt: { $lt: lastCreatedAt } }).sort({ createdAt: -1 }).limit(20)`.

| | Offset (`?page=3`) | Cursor (`?after=…`) |
|---|---|---|
| Speed on deep pages | Gets slower. The database still walks past every skipped item. | Same speed on any page. The index jumps straight to the cursor. |
| Data changes between requests | Items can repeat or be skipped | Stable |
| Jump to page N | ✅ Easy | ❌ Only next/previous |
| "Page 7 of 120" | ✅ (needs a count query) | ❌ Usually not |
| Good for | Small admin tables, reports | Feeds, infinite scroll, large lists, API syncs |

**Tie-breakers.** If two items share the same `createdAt`, a cursor on `createdAt` alone can skip one of them. Sort by **two fields**, like `createdAt` and then `_id`, and use both in the cursor:

```js
// next page: items older than the cursor, using _id to break ties
{ $or: [ { createdAt: { $lt: c.createdAt } },
         { createdAt: c.createdAt, _id: { $lt: c._id } } ] }
```

Back it with a **compound index**: `{ createdAt: -1, _id: -1 }`. See [Pagination at scale](topic:mongodb/pagination) and [Compound indexes](topic:mongodb/compound-indexes-esr).

**Opaque cursors.** Don't expose raw field values. Encode them, for example as base64 JSON: `?cursor=eyJjcmVhdGVkQXQiOi…`. Then you can change the inner format later without breaking clients.

**Response shape.** A common format:

```json
{ "data": [ … ], "nextCursor": "eyJ…", "hasMore": true }
```

For offset paging: `{ "data": […], "page": 3, "limit": 20, "total": 512 }`. Remember that `total` costs an **extra count query**. On huge collections, consider dropping it or caching it.

**Always cap `limit`.** Never let a client ask for `?limit=100000`. Set a maximum, like 100.

## 🎯 Why do we use it?

- **Speed.** Sending 50,000 candidates at once would be slow for the server, the network and the browser.
- **Memory.** Small pages keep server memory steady.
- **Better UX.** Users see the first results quickly.
- **Correct syncs.** Cursor paging lets another system read "everything since my last sync" without gaps.

## ⚠️ Common mistakes

- **No maximum `limit`**, so one request can pull the whole collection.
- **Sorting by a non-unique field only**, like `createdAt`, so ties are skipped or repeated.
- **No index on the sort fields**, so every page sorts in memory.
- **Using `skip` for deep pages on big collections.** Page 5,000 is very slow.
- **Counting the total on every request** for huge collections.

## 🗣️ How to answer in an interview

> "There are two main styles. Offset pagination uses page and limit, so the database skips rows. It's simple and supports page numbers, so it's fine for small admin tables. But it slows down on deep pages, because the database still walks past the skipped rows, and if data changes between requests, items can repeat or be missed.
>
> Cursor pagination returns items after the last one the client saw, using a cursor like createdAt plus _id as a tie-breaker. With a matching compound index it stays fast at any depth and is stable when new items arrive, so I use it for feeds, infinite scroll and large lists. The trade-off is no 'jump to page 50'.
>
> Either way, I cap the page size and return a clear shape: the data, plus either the next cursor or the page and total."

[FILL IN: which pagination style the lists you built at SkillKeepr use, if you know.]

## 🔁 Follow-up questions

### Why is `skip(100000)` slow even with an index?

The database still has to **walk past** 100,000 index entries to find where to start. A cursor query uses the index to **jump** straight to the starting point.

### How do you add "previous page" to cursor paging?

Return a `prevCursor` as well (the first item's position). For "previous", query the other direction (`$gt`, sorted ascending), then reverse the results.

### Can you show a total count with cursor paging?

Yes, but it's a separate, often expensive, count query. Many feeds just show `hasMore` instead.

### Which pagination does a "load more" button use?

Usually cursor. Each click sends the last cursor and appends the next items.

## ✅ Quick check

### 1. A user is on page 2 of a job list sorted newest first. Three new jobs are posted. With offset paging, what do they see on page 3?

:::answer
Three items they **already saw** on page 2 appear again, because everything moved down by three.
:::

### 2. Why add `_id` to a cursor that already uses `createdAt`?

:::answer
To **break ties**. Many items can share the same `createdAt`. Without a unique second field, items with the same time can be skipped or repeated.
:::

### 3. An admin table needs "Go to page 15 of 40". Offset or cursor?

:::answer
**Offset.** It supports jumping to a page number and showing totals. For a small admin table, its downsides don't matter much.
:::
