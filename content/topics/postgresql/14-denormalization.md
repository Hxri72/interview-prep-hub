---
title: When to denormalise
stack: postgresql
order: 14
level: Intermediate
mustKnow: false
askedFrequency: common
summary:
  - Denormalisation means storing some data twice on purpose, to make reads faster or simpler.
  - Common forms are a stored count column, a copied field, a summary table, or a materialised view.
  - The cost is keeping the copies in sync. Stale or wrong copies are the main risk.
  - Normalise first. Denormalise only where you measured a slow, read-heavy query.
  - "Keep copies in sync with a transaction, a trigger, a scheduled refresh, or a background job."
cards:
  - q: What is denormalisation?
    a: Deliberately duplicating data (a count, a name, a summary) so common reads need fewer joins or calculations.
  - q: When would you denormalise?
    a: When a read-heavy screen is slow because of many joins or big aggregations, you measured it, and the data can tolerate being slightly stale or you can keep it in sync.
  - q: What is a materialised view?
    a: A saved copy of a query's result. Reads are fast, but the copy is only updated when you run REFRESH MATERIALIZED VIEW.
  - q: How do you keep a stored count correct?
    a: Update it in the same transaction as the insert/delete, use a trigger, or recalculate it on a schedule. Atomic updates like SET applicants = applicants + 1 avoid race conditions.
  - q: What is the main risk of denormalisation?
    a: The copies can get out of sync, so users see wrong or old numbers, and writes become more complex.
---

## 💡 What is it?

**Denormalisation** is the opposite of [normalisation](topic:postgresql/normalization). You **copy some data on purpose**.

You do it to make **reading faster or simpler**. For example, you store `applicants_count` on each job, instead of counting every time.

The price: you must **keep the copy correct** every time the original data changes.

## 🏠 Real-life example

Think of the **class attendance register** and a small board on the classroom door that says **"Present today: 38"**.

The register is the truth. But the principal walking past doesn't want to count 40 names. So the monitor writes the total on the board.

- The **register** = the normalised tables (the source of truth).
- The **number on the door** = the denormalised copy (a stored count).
- The **monitor updating the board** when someone arrives late = keeping the copy in sync.
- If the monitor **forgets** = stale data. The board shows the wrong number.

## 🧑‍💻 Code example

Run this in `psql` or any PostgreSQL tool.

```sql
CREATE TABLE jobs (id INT PRIMARY KEY, title TEXT);                      -- normalised jobs table
CREATE TABLE applications (id SERIAL PRIMARY KEY, job_id INT REFERENCES jobs(id)); -- one row per application
INSERT INTO jobs VALUES (10,'Node Developer'),(20,'QA Engineer');        -- two jobs
INSERT INTO applications (job_id) SELECT 10 FROM generate_series(1, 3);  -- 3 applications for job 10
INSERT INTO applications (job_id) VALUES (20);                           -- 1 application for job 20

CREATE MATERIALIZED VIEW job_stats AS                                    -- a saved COPY of a query result
SELECT j.id, j.title, COUNT(a.id) AS applicants                          -- the count is stored, not recomputed
FROM jobs j LEFT JOIN applications a ON a.job_id = j.id                  -- normal join to build it once
GROUP BY j.id, j.title;                                                  -- one row per job

INSERT INTO applications (job_id) VALUES (20);                           -- a new application arrives
SELECT title, applicants FROM job_stats ORDER BY id;                     -- still the OLD number (stale copy)

REFRESH MATERIALIZED VIEW job_stats;                                     -- rebuild the copy
SELECT title, applicants FROM job_stats ORDER BY id;                     -- now the number is fresh
```

**Output** (real run on PostgreSQL 18):

```text
 title          | applicants
----------------+------------
 Node Developer | 3
 QA Engineer    | 1
(2 rows)

 title          | applicants
----------------+------------
 Node Developer | 3
 QA Engineer    | 2
(2 rows)
```

**What to notice:** after the new application, the view still said **1** for QA. It only showed **2** after `REFRESH`. That gap is the trade-off.

## 🔍 Deeper version

**Ways to denormalise, and how to keep each in sync:**

| Technique | Example | Keep in sync by |
|---|---|---|
| **Stored counter** | `jobs.applicants_count` | `UPDATE jobs SET applicants_count = applicants_count + 1` in the same transaction, or a trigger |
| **Copied field** | `applications.job_title` | update copies when the title changes, or accept that it's a historical snapshot |
| **Summary table** | `daily_job_stats(day, job_id, applicants)` | a nightly job or a queue worker |
| **Materialised view** | `job_stats` above | `REFRESH MATERIALIZED VIEW` on a schedule |
| **JSONB snapshot** | an order stores the price at purchase time | never updated — it's meant to be frozen |

**Refreshing without blocking readers.** A normal `REFRESH` locks the view while it rebuilds. `REFRESH MATERIALIZED VIEW CONCURRENTLY job_stats;` lets reads continue. It needs a **unique index** on the view.

**Counters and race conditions.** Never do "read count, add 1 in Node, write it back". Two requests at once lose an update. Use one atomic statement, `SET applicants_count = applicants_count + 1`. See [atomic updates](topic:mongodb/atomic-updates-locking); the idea is the same in SQL.

**Snapshots are a special case.** Sometimes a copy is **correct** because it must not change. An invoice keeps the plan price at the time of purchase. A plan "snapshot" freezes what the customer bought. That isn't stale data, it's history.

**Decision checklist:**
1. Is the query actually slow? Measure with [EXPLAIN ANALYZE](topic:postgresql/explain-analyze).
2. Did a better [index](topic:postgresql/indexes) fix it? Try that first.
3. Is it read far more than written?
4. Can users accept slightly old numbers? If yes, a scheduled refresh is simplest.
5. Who updates the copy, and what happens if that fails?

**Compared with MongoDB.** MongoDB designs often start denormalised (embedding). SQL designs start normalised and add copies only where needed.

## 🎯 Why do we use it?

Normalised data is **correct** but can be **slow to read**. A dashboard tile that counts millions of rows on every page load wastes the database's time.

A stored count or a summary table turns an expensive calculation into a **simple lookup**. It is how most dashboards and reports stay fast as data grows.

## ⚠️ Common mistakes

- **Denormalising before measuring.** Often a missing index was the real problem.
- **Forgetting one write path.** The count goes up on insert, but nobody decreases it on delete.
- **Read-modify-write counters** in app code. Concurrent requests lose updates.
- **Never refreshing** a materialised view, so users see days-old numbers.

## 🗣️ How to answer in an interview

> "Denormalisation is storing some data twice on purpose to make reads faster — a stored count, a copied field, a summary table or a materialised view. I start with a normalised design for correctness, and denormalise only when I've measured a slow, read-heavy query and an index didn't solve it.
>
> The cost is keeping copies in sync. For a counter I update it atomically in the same transaction, like applicants_count = applicants_count + 1, or use a trigger. For reports where slightly old data is fine, a materialised view refreshed on a schedule is the simplest — with REFRESH CONCURRENTLY so reads aren't blocked. And some copies are intentional snapshots, like the price on an invoice, which should never change."

[FILL IN: where you used PostgreSQL, and a place where you stored a count or snapshot on purpose.]

## 🔁 Follow-up questions

### View vs materialised view?

A normal **view** is a saved query; it runs every time you read it, so it's always fresh but not faster. A **materialised view** stores the result, so it's fast but can be stale until refreshed.

### How would you keep `applicants_count` correct?

Increase and decrease it in the same transaction as the insert and delete, with atomic `+ 1` / `- 1`. Or use a trigger. Add a nightly job that recalculates and fixes any drift.

### When is a snapshot better than a reference?

When the value must stay as it was at that moment: an invoice's price, the plan a customer bought, a candidate's profile at the time they applied.

## ✅ Quick check

### 1. A materialised view was built when QA had 1 applicant. A new application is inserted. What does the view show?

:::answer
**Still 1.** A materialised view is a saved copy. It only changes after `REFRESH MATERIALIZED VIEW`.
:::

### 2. What does `REFRESH MATERIALIZED VIEW CONCURRENTLY` need?

- A) A primary key on the base table
- B) A unique index on the materialised view
- C) Nothing extra

:::answer
**B.** It needs a unique index on the view, so PostgreSQL can match old and new rows while readers keep reading.
:::

### 3. Why is "read the count in Node, add 1, write it back" a problem?

:::answer
Two requests can read the same old value and both write `old + 1`, so one increase is lost (a race condition). Use `SET count = count + 1` in one statement.
:::
