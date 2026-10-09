---
title: "Pagination at scale: cursor vs skip"
stack: mongodb
order: 23
level: Intermediate
mustKnow: false
askedFrequency: common
summary:
  - "Offset pagination uses skip() and limit(): page 5 = skip 40, limit 10. It's simple, but MongoDB still walks past every skipped entry, so deep pages get slow."
  - "Cursor (keyset) pagination remembers where the last page ended (like the last _id) and asks for \"the next 10 after this\". Every page is equally fast."
  - Cursor pagination needs a stable, unique sort order. Sort by a field plus _id as a tie-breaker, and back it with a matching index.
  - Cursor pagination can't jump straight to page 50, and it's best for infinite scroll and "Load more". Offset is fine for small lists with page numbers.
  - Exact total counts on big collections are expensive too. Show "1,000+" or count less often.
cards:
  - q: Why is skip() slow for deep pages?
    a: MongoDB can't jump to item 100,000. It must walk past all the skipped index entries (or documents) first, so the work grows with the page number.
  - q: What is cursor (keyset) pagination?
    a: "Instead of a page number, the client sends the last item's sort value (e.g. its _id). The next query asks for items after that value: { _id: { $lt: lastId } }, sorted and limited."
  - q: Why add _id to the sort in cursor pagination?
    a: "So the order is unique and stable. If two items have the same createdAt, _id breaks the tie, so no item is skipped or shown twice."
  - q: What are the downsides of cursor pagination?
    a: You can't jump to a random page number, and going backwards needs extra logic. It's best for "Load more" and infinite scroll.
  - q: Do items move between pages with offset pagination?
    a: Yes. If a new item is added while the user is browsing, everything shifts by one, so the next page can repeat or skip an item. Cursor pagination doesn't have this problem.
---

## 💡 What is it?

**Pagination** means sending a long list in small parts, called **pages**. For example, 10 candidates at a time.

There are two common ways:
- **Offset**: "skip the first 40, give me the next 10". This uses `skip()` and `limit()`.
- **Cursor** (also called keyset): "give me the next 10 **after this last item**". This uses a filter like `_id < lastId`.

Both work for small lists. For big lists, cursor pagination stays fast on every page.

## 🏠 Real-life example

Think of **reading a long story book**.

- **Offset way**: every time you sit down to read, you say, "I'm on page 300." So you count pages from page 1 to page 300 again. Every time. The further you get, the longer the counting takes.
- **Cursor way**: you keep a **bookmark** in the book. You open it straight at the bookmark and continue. It's just as fast on page 300 as on page 3.

The bookmark has one limit. You can't say "jump to page 250" without counting. You just continue from where you stopped.

- **Counting pages from the start** = `skip()`.
- **The bookmark** = the cursor (the last item's `_id`).
- **"Continue from the bookmark"** = `{ _id: { $lt: lastId } }`.

## 🧑‍💻 Code example

You need MongoDB (local, or a free Atlas cluster). Make a folder, run `npm init -y` and `npm install mongoose`. Save this as `paginate.js` (CommonJS). Run it with `node paginate.js`, or `MONGODB_URI="your-connection-string" node paginate.js`.

```js
const mongoose = require('mongoose');                                        // load Mongoose
const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/hiring';   // where MongoDB is; local by default

async function main() {                                                      // all the steps, in order
  await mongoose.connect(uri);                                               // connect to the database
  const col = mongoose.connection.db.collection('candidates');               // the raw candidates collection
  await col.drop().catch(() => {});                                          // remove old data and old indexes
  const tenantId = new mongoose.Types.ObjectId();                            // one company
  const docs = Array.from({ length: 1000 }, (_, i) => ({ tenantId, name: `Candidate ${i}` })); // 1,000 candidates
  await col.insertMany(docs);                                                // save them; _id values grow in insert order
  await col.createIndex({ tenantId: 1, _id: -1 });                           // index: company, then newest _id first
  const sort = { _id: -1 };                                                  // newest first

  // OFFSET: page 91 = skip 900, take 10
  const offsetQuery = col.find({ tenantId }).sort(sort).skip(900).limit(10); // walk past 900, then take 10
  const offsetPage = await offsetQuery.toArray();                            // the actual page
  const offsetPlan = await col.find({ tenantId }).sort(sort).skip(900).limit(10).explain('executionStats'); // how much work?
  console.log('skip 900 → index keys read:', offsetPlan.executionStats.totalKeysExamined); // work grows with the page number

  // CURSOR: the client sends the last _id of page 90; we continue after it
  const [lastOfPage90] = await col.find({ tenantId }).sort(sort).skip(899).limit(1).toArray(); // (only to get a bookmark for this demo)
  const cursorFilter = { tenantId, _id: { $lt: lastOfPage90._id } };          // "items older than the bookmark"
  const cursorPage = await col.find(cursorFilter).sort(sort).limit(10).toArray(); // the next 10 after the bookmark
  const cursorPlan = await col.find(cursorFilter).sort(sort).limit(10).explain('executionStats'); // how much work?
  console.log('cursor   → index keys read:', cursorPlan.executionStats.totalKeysExamined); // about 10, on ANY page

  console.log('Same page?', offsetPage[0].name === cursorPage[0].name);      // both ways return the same candidates
  console.log('Next cursor:', cursorPage[cursorPage.length - 1]._id.toString()); // send this to the client for the next page
  await mongoose.disconnect();                                               // close the connection
}                                                                            // end of main
main().catch(console.error);                                                 // run main and print any error
```

**Output** (key counts can differ by one; your `_id` will differ):

```text
skip 900 → index keys read: 910
cursor   → index keys read: 10
Same page? true
Next cursor: 66f1c0e2a1b2c3d4e5f60123
```

Same page of results. But offset read **910** index entries, and cursor read only **10**. At page 10,000, the gap is huge.

## 🔍 Deeper version

**Why `skip` gets slow.** An index lets MongoDB **find** a value fast. It can't jump to "the 100,000th entry". To skip N items, it must walk past N entries one by one. So page 1 is fast, but page 5,000 reads 50,000 extra entries. Without a matching index, it's even worse: it reads and sorts the documents too.

**Cursor (keyset) pagination, the full pattern.**
1. Sort by a field that is **unique and stable**. `_id` is perfect: it's unique and grows over time.
2. If you sort by something else, like `appliedAt`, add `_id` as a **tie-breaker**: `sort({ appliedAt: -1, _id: -1 })`.
3. Back it with a matching index: `{ tenantId: 1, appliedAt: -1, _id: -1 }`.
4. For the next page, filter "after the last item":

```js
const filter = {                                                   // next page after the last item (appliedAt, _id)
  tenantId,                                                        // always scope to the company
  $or: [                                                           // either…
    { appliedAt: { $lt: last.appliedAt } },                        // …an older date
    { appliedAt: last.appliedAt, _id: { $lt: last._id } },          // …or the same date with a smaller _id
  ],                                                               // end of $or
};                                                                 // end of filter
```

5. Send the cursor to the client as an opaque string. For example, base64 of `{ appliedAt, _id }`. The client sends it back for the next page.
6. Ask for `limit + 1` items. If you get the extra one, you know there's a next page (`hasNextPage: true`), and you don't need a count.

**A typical API response:**

```json
{ "data": [ ... ], "pageInfo": { "nextCursor": "eyJhcHBsaWVkQXQiOi4uLn0=", "hasNextPage": true } }
```

**Trade-offs:**

| | Offset (`skip`/`limit`) | Cursor (keyset) |
|---|---|---|
| Speed on deep pages | gets slower | stays fast |
| Jump to page 50 | ✅ easy | ❌ not directly |
| New items while browsing | items can repeat or be skipped | stable |
| Best for | admin tables with page numbers, small data | infinite scroll, "Load more", APIs, big data |

**Counting.** "Page 3 of 2,481" needs a total. `countDocuments(filter)` also has to scan matching entries, so it's slow on big data. Options:
- show "1,000+" (count with a limit),
- cache the count for a short time,
- use `estimatedDocumentCount()` when there's no filter (it's very fast but approximate).

## 🎯 Why do we use it?

A recruiter's candidate list might have 200,000 entries. With `skip`, the first pages are fast, but the database works harder on every later page. Bots or "jump to last page" can then put real load on the server.

Cursor pagination keeps **every** page as cheap as the first. It also avoids duplicate or missing rows when new applications arrive while someone is scrolling. That's common on a busy hiring platform.

## ⚠️ Common mistakes

- **Sorting by a non-unique field without a tie-breaker.** Items with the same date can repeat or vanish between pages. Add `_id`.
- **No index that matches the filter + sort.** Then even cursor pagination does a SORT in memory.
- **Running `countDocuments` on every request** for a huge collection.
- **Trusting the client's cursor blindly.** Decode and validate it. Always add `tenantId` from the logged-in user, not from the cursor.

## 🗣️ How to answer in an interview

> "There are two main ways to paginate. Offset uses skip and limit. It's simple and supports page numbers. But MongoDB still walks past every skipped entry, so page 5,000 is much slower than page 1. Items can also shift between pages when new data arrives.
>
> For big lists, I use cursor or keyset pagination. I sort by a stable, unique order, for example appliedAt plus _id as a tie-breaker, with a matching compound index that starts with tenantId. The client sends back the last item's values as an opaque cursor, and I query for items after it, with a limit. Every page costs about the same. I fetch limit plus one to know if there's a next page, so I don't need a total count.
>
> The trade-off is that you can't jump to a random page. So I'd keep offset for small admin tables, and use cursors for infinite scroll and public APIs."

[FILL IN: which pagination style SkillKeepr's candidate or application lists use. Only add it if it's true.]

## 🔁 Follow-up questions

### How do you go to the previous page with cursor pagination?

Keep a "before" cursor, too. Query with the comparison flipped (`$gt`) and the sort reversed, then reverse the results back. Many apps use only "Load more", so they skip this.

### Is `_id` always a safe sort key for "newest first"?

Mostly. ObjectIds start with a timestamp in seconds, so they grow over time. But items created in the same second, on different servers, aren't perfectly in time order. They're still unique, so pagination stays correct. For exact time order, sort by `createdAt` plus `_id`.

### When is offset pagination totally fine?

When the list is small (a few thousand items), when users need page numbers, or for internal admin screens. Simple is good when it's fast enough.

### How does GraphQL or Relay do this?

Relay-style "connections" use the same cursor idea. The API returns `edges` with a `cursor`, and `pageInfo` with `hasNextPage` and `endCursor`.

## ✅ Quick check

### 1. Why does `skip(100000).limit(10)` get slower than `skip(0).limit(10)`?

:::answer
MongoDB has to walk past 100,000 index entries (or documents) before it can return the 10 you want. The work grows with the skip amount.
:::

### 2. You paginate by `sort({ appliedAt: -1 })` with a cursor on `appliedAt` only. Many applications share the same `appliedAt`. What can go wrong?

:::answer
Items with the same `appliedAt` can be **repeated or skipped** between pages, because the order between them isn't fixed. Add `_id` as a tie-breaker in the sort and in the cursor filter.
:::

### 3. Which pagination style fits an infinite-scroll candidate list with 500,000 items?

- A) Offset with `skip`
- B) Cursor (keyset)

:::answer
**B.** Every "load more" stays fast, and new items don't cause repeats.
:::
