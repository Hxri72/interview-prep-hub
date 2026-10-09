---
title: The cost of indexes
stack: mongodb
order: 26
level: Advanced
mustKnow: false
askedFrequency: common
summary:
  - Indexes make reads fast, but they are not free. Every insert, update and delete must also update every index on that collection.
  - Each index uses disk space and, more importantly, RAM. If indexes don't fit in memory, queries slow down.
  - Too many indexes = slower writes, more memory, and more work for the query planner.
  - Find unused indexes with $indexStats, test removal safely with hideIndex, then drop them.
  - Rule of thumb — index your real, frequent queries (with the ESR rule), not every field "just in case".
cards:
  - q: What are the costs of an index?
    a: Slower writes (every write updates every index), extra disk space, extra RAM, and more choices for the query planner.
  - q: Why does an index slow down inserts?
    a: Because MongoDB must add a new entry to every index on the collection, not just store the document.
  - q: How do you find indexes nobody uses?
    a: "Run db.collection.aggregate([{ $indexStats: {} }]). It shows how many times each index was used (accesses.ops) since the server started."
  - q: How can you test removing an index safely?
    a: "Hide it with db.collection.hideIndex(name). The planner ignores it, but it's still kept up to date. If queries get slow, unhideIndex brings it back instantly."
  - q: Should you index every field you filter on?
    a: No. Index the frequent, important queries, usually with one good compound index, instead of many single-field indexes.
---

## 💡 What is it?

An **[index](glossary:index)** makes finding data fast. But every index has a **cost**.

When you add, change or delete a document, MongoDB must also update **every index** on that collection. Indexes also take up disk space and memory.

So more indexes means faster reads, but slower writes and more memory use. A good developer keeps only the indexes that are really used.

## 🏠 Real-life example

Think of a **school library with many catalogues**.

The library has one catalogue sorted by **title**, one by **author**, and one by **subject**. Finding a book is very fast.

But every time a **new book arrives**, the librarian must add a card to **all three** catalogues. Ten catalogues means ten cards for one book! The catalogues also fill up shelf space.

- The **books on the shelves** = the documents.
- Each **catalogue** = one index.
- **Adding a card to every catalogue** = the extra work on each write.
- **Shelf space for catalogues** = disk and RAM used by indexes.
- A catalogue **nobody ever opens** = an unused index. It costs work but gives nothing.

## 🧑‍💻 Code example

Setup: start MongoDB locally (or use a free Atlas cluster) and open the shell with `mongosh`. Paste these lines one by one. They use the shell's JavaScript.

```js
use hiring_demo                                                     // switch to (or create) a database called hiring_demo
db.candidates.insertMany([                                          // add 3 sample candidates
  { tenantId: 1, name: 'Asha', status: 'applied', city: 'Kochi' },  // tenantId = which company owns this candidate
  { tenantId: 1, name: 'Ravi', status: 'rejected', city: 'Pune' },  // same company, different status
  { tenantId: 2, name: 'Meera', status: 'applied', city: 'Delhi' }, // a different company
])                                                                  // end of insertMany

db.candidates.createIndex({ tenantId: 1, status: 1 })               // index for our real query: by company, then status
db.candidates.createIndex({ city: 1 })                              // an index "just in case" — nobody filters by city

db.candidates.find({ tenantId: 1, status: 'applied' })              // the real query: uses the first index
db.candidates.aggregate([{ $indexStats: {} }]).forEach(i => print(i.name, '→ used', Number(i.accesses.ops), 'times')) // how often each index was used (keep it on ONE line; Number() turns Long('0') into 0)

db.candidates.hideIndex('city_1')                                   // safe test: the planner ignores it, but it stays updated
db.candidates.dropIndex('city_1')                                   // if nothing got slower, remove it for good
```

```text
_id_ → used 0 times
tenantId_1_status_1 → used 1 times
city_1 → used 0 times
```

The three lines may come out in a different order on your computer. The `find` line also prints Asha's document.

**What to notice:** `city_1` costs work on every insert but was never used. It's a good candidate to drop. (Use counts reset when the server restarts, so check over a long, normal period.)

## 🔍 Deeper version

**1. Write cost.** An insert writes the document **plus one entry in every index**. An update only touches indexes whose fields changed. But a collection with 10 indexes can make inserts several times slower than one with 2. Heavy write paths, like logs or events, suffer most.

**2. Memory cost.** MongoDB's storage engine (WiredTiger) keeps hot data and indexes in a RAM cache. The data and indexes your queries touch often are called the **working set**. If the working set doesn't fit in RAM, MongoDB reads from disk and everything slows down. Check sizes with `db.collection.stats()` (look at `totalIndexSize` and `indexSizes`).

**3. Disk cost.** Every index is stored on disk. Indexes on big arrays (**multikey** indexes) or long text can be very large.

**4. Planner cost.** For a new query shape, the **query planner** tries the possible indexes and picks a winner. It then caches that choice. Many overlapping indexes mean more candidates to test, and a higher chance of a poor pick.

**5. Build cost.** Creating an index on a big collection takes time and I/O. Since MongoDB 4.2, index builds lock the collection only briefly at the start and end. But they still add load, so build big indexes at quiet times.

**Common sources of waste:**
- **Duplicate prefixes.** If you have `{ tenantId: 1, status: 1 }`, a separate `{ tenantId: 1 }` index is usually not needed. The compound index already covers queries on `tenantId` alone. (See [compound indexes and the ESR rule](topic:mongodb/compound-indexes-esr).)
- **Low-selectivity fields alone.** A field with only 2–3 values (like `isActive`) rarely helps on its own.
- **Indexes for old features.** The feature was removed, but the index stayed.

**Safe clean-up process:**
1. Run `$indexStats` over a normal period (days, not minutes).
2. **Hide** the unused index with `hideIndex`. This needs MongoDB 4.4+.
3. Watch query times and slow-query logs.
4. If nothing got worse, `dropIndex`. If something broke, `unhideIndex` brings it back instantly, with no rebuild.

**Ways to reduce cost:**
- **Partial indexes** only index documents that match a filter, like `{ status: 'active' }`. They are smaller and cheaper.
- **TTL indexes** delete old documents automatically, so the collection (and its indexes) stay small.

## 🎯 Why do we use it?

Adding indexes is easy, and they make reads fast. So teams keep adding them. Over months, writes get slower, memory fills up, and the database bill grows.

Understanding index costs helps you keep **the right indexes**: few, well-designed, and actually used. This keeps both reads **and** writes fast as the data grows.

## ⚠️ Common mistakes

- **Indexing every field "just in case".** Each one slows every write and uses RAM.
- **Keeping single-field indexes that a compound index already covers** (a duplicate prefix).
- **Reading `$indexStats` right after a restart.** The counters start from zero, so a useful index can look unused.
- **Dropping an index directly in production without hiding it first.** If it was needed, the rebuild takes a long time.

## 🗣️ How to answer in an interview

> "Indexes speed up reads, but they have costs. Every insert, and every update that changes an indexed field, must also update each index, so writes get slower. Indexes also use disk and, more importantly, RAM. If the working set of data and indexes doesn't fit in memory, performance drops. And more indexes give the query planner more options, which can lead to a poor choice.
>
> So I index the real, frequent queries, usually with one compound index that follows the ESR rule, instead of many single-field indexes. To clean up, I check `$indexStats` over a normal period. Then I hide an unused index with `hideIndex`, watch performance, and only then drop it. Hiding is safe because I can unhide it instantly."

[FILL IN: a real index you added or removed on the multi-tenant collections at SkillKeepr, and how you measured it — only if true.]

## 🔁 Follow-up questions

### How do you know if your indexes fit in RAM?

Compare `totalIndexSize` from `db.collection.stats()` (summed over collections) with the RAM given to the WiredTiger cache. Watch cache metrics and disk reads in monitoring, such as Atlas metrics. Rising disk reads with slow queries often mean the working set no longer fits.

### Does an update always touch every index?

No. MongoDB only updates indexes whose fields changed. Inserts and deletes touch every index.

### What is a hidden index?

An index the query planner ignores, but that MongoDB still keeps up to date. It lets you test "what if I drop this?" safely. If queries get slow, `unhideIndex` brings it back straight away, with no rebuild.

### When would you accept a write-heavy cost for an index?

When an important, frequent read needs it. For example, a dashboard query used by every recruiter. Or when a `unique` index is required to keep data correct, like one application per candidate per job.

## ✅ Quick check

### 1. A collection has 12 indexes. Inserts have become slow. What is the most likely reason?

:::answer
Each insert must also write an entry into all 12 indexes. Check `$indexStats` for unused ones, hide them, and then drop them.
:::

### 2. You have an index `{ tenantId: 1, status: 1 }`. Do you also need `{ tenantId: 1 }`?

- A) Yes, always
- B) Usually no — the compound index can serve queries on `tenantId` alone
- C) Only on Atlas

:::answer
**B.** `tenantId` is the leading (first) field of the compound index, so the compound index covers it. The extra index mostly adds write and memory cost.
:::

### 3. What's the safest way to remove an index you think is unused?

:::answer
Hide it first with `hideIndex`, watch performance for a while, then `dropIndex`. If something gets slow, `unhideIndex` restores it instantly.
:::
