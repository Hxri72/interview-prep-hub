---
title: "Advanced aggregation: $facet and $bucket"
stack: mongodb
order: 27
level: Advanced
mustKnow: false
askedFrequency: sometimes
summary:
  - "$facet runs several small pipelines on the same input in ONE query, and returns all the results together (great for dashboards: counts + list + total)."
  - "$bucket groups documents into ranges you choose (like 0–2, 2–5, 5–10 years of experience). $bucketAuto picks the ranges for you."
  - Put $match first (with an index) so $facet and $bucket work on fewer documents.
  - $facet returns one document, so the whole result must fit in 16 MB. Sub-pipelines inside $facet cannot use indexes.
  - "A common pattern: $facet with { items: [skip, limit], total: [$count] } for paginated lists with a total count."
cards:
  - q: What does $facet do?
    a: It runs several sub-pipelines on the same input documents in one query and returns their results together in one document, each under its own name.
  - q: Give a real use of $facet.
    a: "A recruiter dashboard: counts by status, counts by city and the 10 newest applications — all in one database round trip. Or a paginated list with its total count."
  - q: What does $bucket do?
    a: "It puts documents into ranges (buckets) based on boundaries you give, like years of experience [0, 2, 5, 10], and lets you count or sum per bucket."
  - q: What is the difference between $bucket and $bucketAuto?
    a: "$bucket uses the exact boundaries you choose. $bucketAuto takes a number of buckets and picks the boundaries to spread documents evenly."
  - q: What are two limits of $facet?
    a: Its output is a single document, so it must stay under 16 MB, and the stages inside each facet can't use indexes. Filter with $match before $facet.
---

## 💡 What is it?

These are two powerful stages in an [aggregation pipeline](glossary:aggregation-pipeline).

- **`$facet`** runs **several small pipelines at the same time** on the same data. It returns all their answers together in one result.
- **`$bucket`** puts documents into **ranges** that you choose, like "0–2 years", "2–5 years" and "5–10 years". Then it counts or adds them up per range.

Both are very useful for dashboards and reports.

## 🏠 Real-life example

Think of a **class teacher on result day**.

The teacher gets one pile of answer sheets. From that same pile, they need three things:
1. how many students passed and failed,
2. the top 5 students,
3. how many students scored 0–40, 40–60, 60–80 and 80–100.

They don't fetch the pile three times. They look at it once and fill three reports at the same time. That is **`$facet`**.

The fourth job, putting marks into ranges like 0–40 and 40–60, is **`$bucket`**.

- The **pile of answer sheets** = the documents after `$match`.
- **Three reports from one pile** = the sub-pipelines inside `$facet`.
- **Mark ranges** (0–40, 40–60…) = the bucket boundaries.
- **Students in each range** = the count per bucket.

## 🧑‍💻 Code example

Setup: start MongoDB locally (or use a free Atlas cluster) and open the shell with `mongosh`. Paste these lines.

```js
use hiring_demo                                                         // switch to (or create) the hiring_demo database
db.applications.insertMany([                                            // sample job applications
  { tenantId: 1, status: 'applied',     experience: 1 },                // tenantId = company; experience = years
  { tenantId: 1, status: 'applied',     experience: 4 },                // another applied candidate
  { tenantId: 1, status: 'shortlisted', experience: 6 },                // a shortlisted candidate
  { tenantId: 1, status: 'rejected',    experience: 2 },                // a rejected candidate
  { tenantId: 2, status: 'applied',     experience: 9 },                // a different company — must not be counted
])                                                                      // end of insertMany

db.applications.aggregate([                                             // start an aggregation pipeline
  { $match: { tenantId: 1 } },                                          // FIRST: only company 1 (can use an index)
  { $facet: {                                                           // run 3 small pipelines on the same documents
      byStatus: [                                                       // report 1: count per status
        { $group: { _id: '$status', count: { $sum: 1 } } },             // group by status and count each one
        { $sort: { _id: 1 } },                                          // sort A → Z so the output is stable
      ],                                                                // end of report 1
      byExperience: [                                                   // report 2: count per experience range
        { $bucket: {                                                    // put each document into a range
            groupBy: '$experience',                                     // the field that decides the range
            boundaries: [0, 2, 5, 10],                                  // ranges: 0–1, 2–4, 5–9 (lower included, upper excluded)
            default: 'other',                                           // where values outside all ranges go
            output: { count: { $sum: 1 } },                             // count documents in each range
        } },                                                            // end of $bucket
      ],                                                                // end of report 2
      total: [{ $count: 'value' }],                                     // report 3: the total number of applications
  } },                                                                  // end of $facet
])                                                                      // end of aggregate
```

```text
[
  {
    byStatus: [
      { _id: 'applied', count: 2 },
      { _id: 'rejected', count: 1 },
      { _id: 'shortlisted', count: 1 }
    ],
    byExperience: [
      { _id: 0, count: 1 },
      { _id: 2, count: 2 },
      { _id: 5, count: 1 }
    ],
    total: [ { value: 4 } ]
  }
]
```

**What to notice:** one query returned three reports. Each bucket's `_id` is its **lower boundary**: `2` means "2 up to, but not including, 5".

## 🔍 Deeper version

**How `$facet` works.** It takes all the documents that reach it and passes **the same set** into each named sub-pipeline. The output is **one document**, with one array per facet name.

**Two important limits of `$facet`:**
- **16 MB.** The output is a single document, so it must fit under MongoDB's 16 MB document limit. Never return a huge list inside a facet. Always `$limit` it.
- **No indexes inside.** Stages inside a facet can't use indexes. So do the filtering with `$match` (and `$sort`, if possible) **before** `$facet`, where indexes can help.

**The pagination pattern.** A very common real use:

```js
{ $match: { tenantId: 1, status: 'applied' } },                 // filter first (uses the index)
{ $sort: { createdAt: -1 } },                                   // newest first (index can help here too)
{ $facet: {                                                     // two answers from one query
    items: [{ $skip: 20 }, { $limit: 10 }],                     // page 3 when each page has 10 items
    total: [{ $count: 'value' }],                               // total, for "Page 3 of 12"
} }                                                             // end of $facet
```

This saves a second round trip for `countDocuments()`. But the count still scans every matching document. On very large collections, a separate, cached count may be faster.

**How `$bucket` works:**
- `boundaries` must be sorted and of the same type. A value goes into a bucket when `lower <= value < upper`.
- Values outside all ranges go to the `default` bucket. If you don't set `default` and such a value exists, the query **fails** with an error.
- `output` lets you add more numbers per bucket, like `avgExp: { $avg: '$experience' }`.

**`$bucketAuto`.** You give it the number of buckets you want, for example `buckets: 4`. It picks the boundaries itself, to spread documents about evenly. It's useful when you don't know the data's range.

**Performance tips:**
- `$match` early, and make sure it uses an index (check with [explain](topic:mongodb/explain)).
- `$project` only the fields you need before `$facet`, to keep memory low.
- A pipeline stage has a memory limit (100 MB per stage). Big `$group` or `$sort` stages may need `allowDiskUse`. (Recent MongoDB versions allow disk use by default.)

## 🎯 Why do we use it?

Dashboards need many numbers about the same data. Without `$facet`, you send 3–5 separate queries. That means more round trips, more code and slower pages. With `$facet`, it's one query and one response.

`$bucket` turns raw numbers into **ranges** that people understand, like "candidates with 2–5 years of experience". That's perfect for charts and reports.

## ⚠️ Common mistakes

- **Putting `$facet` first, without `$match`.** Every document in the collection flows into every facet, and no index is used.
- **Returning big lists inside a facet.** The single output document can hit the 16 MB limit. Always `$limit`.
- **Forgetting `default` in `$bucket`.** One value outside the boundaries makes the whole query fail.
- **Expecting the upper boundary to be included.** In `[2, 5]`, the value 5 goes to the **next** bucket.

## 🗣️ How to answer in an interview

> "`$facet` runs several sub-pipelines on the same input in a single query and returns them together in one document. I'd use it for a dashboard, like counts by status plus the latest applications, or for pagination with `items` and `total` in one round trip. Two limits matter: the result is one document, so it must stay under 16 MB, and stages inside a facet can't use indexes. So I always `$match` on indexed fields, like the tenant ID, before the facet.
>
> `$bucket` groups documents into ranges I define, such as years of experience 0–2, 2–5 and 5–10, and lets me count or average per range. I always set a `default` bucket, because a value outside the boundaries would make the query fail. If I don't know the ranges, `$bucketAuto` picks them for me."

[FILL IN: if you used $facet or $bucket in the multi-tenant aggregation pipelines at SkillKeepr, describe the report here — only if true.]

## 🔁 Follow-up questions

### Is $facet always faster than separate queries?

Not always. It saves round trips. But the facet stages can't use indexes, and all sub-pipelines run on the full matched set. If one facet needs an indexed sort over a huge collection, a separate query may be faster. Measure with `explain`.

### How would you count candidates per city per status?

Use `$group` with a compound `_id`: `{ $group: { _id: { city: '$city', status: '$status' }, count: { $sum: 1 } } }`. Use `$facet` when you need **different kinds** of reports at the same time.

### What happens with null or missing values in $bucket?

A missing or null `groupBy` value doesn't fit any numeric range. So it goes to the `default` bucket. If there is no `default`, the query fails with an error.

### Can you use $lookup inside $facet?

Yes. Most stages work inside a facet. You can't put `$facet` inside another `$facet`, or use stages like `$out` and `$merge` there. Keep `$lookup` after filtering, so it joins fewer documents.

## ✅ Quick check

### 1. With `boundaries: [0, 2, 5, 10]`, which bucket does `experience: 5` go into?

:::answer
The bucket with `_id: 5` (the range 5 up to, but not including, 10). The lower boundary is included and the upper is excluded.
:::

### 2. Why put `$match` before `$facet`?

- A) `$facet` needs it to run
- B) So fewer documents enter every facet, and the filter can use an index
- C) It changes the output format

:::answer
**B.** Stages inside `$facet` can't use indexes. Filtering first with an indexed `$match` makes the whole pipeline much faster.
:::

### 3. A `$bucket` has no `default`, and one document has `experience: 15`. What happens?

:::answer
The aggregation fails with an error, because 15 is outside all the boundaries. Add `default: 'other'` (or extend the boundaries).
:::
