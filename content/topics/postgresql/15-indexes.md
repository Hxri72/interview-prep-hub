---
title: Indexes in PostgreSQL (B-tree, composite)
stack: postgresql
order: 15
level: Intermediate
mustKnow: true
askedFrequency: very common
summary:
  - An index is a sorted lookup structure that lets PostgreSQL find rows without reading the whole table.
  - B-tree is the default. It handles =, <, >, BETWEEN, ORDER BY and LIKE 'abc%'.
  - "A composite index (job_id, status) works best when the query filters on the first column. Put equality columns first."
  - "Partial indexes cover only some rows (WHERE status = 'shortlisted'). Expression indexes cover a computed value (lower(email)). GIN indexes arrays, JSONB and full-text."
  - Indexes speed up reads but slow down writes and use space. PostgreSQL does NOT index foreign keys automatically.
cards:
  - q: What is a B-tree index good for?
    a: "Equality and range lookups (=, <, >, BETWEEN), sorting (ORDER BY) and prefix searches (LIKE 'abc%'). It is PostgreSQL's default index type."
  - q: Why does column order matter in a composite index?
    a: "The index is sorted by the first column, then the second. A query filtering only on the second column usually can't use it well. PostgreSQL 18's skip scan helps only when the first column has few distinct values."
  - q: What is a partial index?
    a: "An index with a WHERE clause, like CREATE INDEX … WHERE status = 'shortlisted'. It is smaller and faster, and is used only by queries with a matching condition."
  - q: When do you need an expression index?
    a: "When the query filters on a computed value, like WHERE lower(email) = '…'. A plain index on email can't be used for lower(email)."
  - q: Does PostgreSQL index foreign keys automatically?
    a: No. Primary keys and UNIQUE constraints get an index automatically. Foreign key columns don't, so add one if you join or filter on them.
---

## 💡 What is it?

An **[index](glossary:index)** is a separate, **sorted** structure that points to rows in a table.

Without an index, PostgreSQL must read **every row** to find matches. This is called a **sequential scan**. With an index, it jumps straight to the matching rows.

The default type is the **B-tree**. PostgreSQL also has **GIN**, **GiST**, **BRIN** and **hash** indexes for special data.

## 🏠 Real-life example

Think of the **index at the back of a textbook**.

To find "photosynthesis", you don't read all 400 pages. You look in the index, which is sorted A–Z, and it says "page 213".

- The **book pages** = the table rows.
- The **index at the back** = a B-tree index.
- **Reading every page** = a sequential scan.
- An index sorted by **chapter, then topic** = a composite index. Easy to search by chapter. Hard to search by topic alone.
- A small extra index of **only the "important" boxes** = a partial index.
- Adding a page means **updating the index too** = indexes make writes slower.

## 🧑‍💻 Code example

Run this in `psql` or any PostgreSQL tool. It creates 100,000 rows, so it takes a second.

```sql
CREATE TABLE applications (                                       -- a big table to search
  id SERIAL PRIMARY KEY,                                          -- primary key: gets a B-tree index automatically
  job_id INT,                                                     -- which job
  status TEXT,                                                    -- applied / shortlisted / rejected
  email TEXT,                                                     -- candidate email
  skills TEXT[]                                                   -- an array of skills, e.g. {Node,React}
);                                                                -- end of the table
INSERT INTO applications (job_id, status, email, skills)          -- add 100,000 fake rows
SELECT g % 500,                                                   -- 500 different jobs
       (ARRAY['applied','shortlisted','rejected'])[g % 3 + 1],    -- rotate through 3 statuses
       'User' || g || '@Mail.com',                                -- mixed-case emails
       CASE WHEN g % 10 = 0 THEN ARRAY['Node','React'] ELSE ARRAY['Java'] END -- 1 in 10 knows Node
FROM generate_series(1, 100000) AS g;                             -- g = 1, 2, 3 … 100000
ANALYZE applications;                                             -- update statistics so the planner can choose well

EXPLAIN SELECT * FROM applications WHERE job_id = 42 AND status = 'shortlisted'; -- BEFORE: no index

CREATE INDEX idx_job_status ON applications (job_id, status);     -- composite B-tree: job_id first, then status
EXPLAIN SELECT * FROM applications WHERE job_id = 42 AND status = 'shortlisted'; -- AFTER: uses the index

CREATE INDEX idx_shortlisted ON applications (job_id) WHERE status = 'shortlisted'; -- partial: only shortlisted rows
CREATE INDEX idx_email_lower ON applications (lower(email));      -- expression index on lower(email)
EXPLAIN SELECT id FROM applications WHERE lower(email) = 'user7@mail.com'; -- the query must use the same expression

CREATE INDEX idx_skills ON applications USING GIN (skills);       -- GIN: indexes every value inside the array
EXPLAIN SELECT id FROM applications WHERE skills @> ARRAY['Node']; -- @> means "contains"
```

**Output** (real run on PostgreSQL 18; cost numbers will differ on your machine):

```text
 Seq Scan on applications  (cost=0.00..2709.00 rows=66 width=65)
   Filter: ((job_id = 42) AND (status = 'shortlisted'::text))

 Bitmap Heap Scan on applications  (cost=4.97..220.74 rows=66 width=65)
   Recheck Cond: ((job_id = 42) AND (status = 'shortlisted'::text))
   ->  Bitmap Index Scan on idx_job_status  (cost=0.00..4.95 rows=66 width=0)
         Index Cond: ((job_id = 42) AND (status = 'shortlisted'::text))

 Bitmap Heap Scan on applications  (cost=16.29..954.37 rows=500 width=4)
   Recheck Cond: (lower(email) = 'user7@mail.com'::text)
   ->  Bitmap Index Scan on idx_email_lower  (cost=0.00..16.17 rows=500 width=0)
         Index Cond: (lower(email) = 'user7@mail.com'::text)

 Bitmap Heap Scan on applications  (cost=86.83..1423.37 rows=10203 width=4)
   Recheck Cond: (skills @> '{Node}'::text[])
   ->  Bitmap Index Scan on idx_skills  (cost=0.00..84.28 rows=10203 width=0)
         Index Cond: (skills @> '{Node}'::text[])
```

**How to read it:**
- **Before:** `Seq Scan` reads all 100,000 rows. Its cost estimate is 2709.
- **After:** `Bitmap Index Scan on idx_job_status` finds the rows through the index. The cost drops to about 220.
- The `lower(email)` and `@>` queries use their special indexes.

## 🔍 Deeper version

**Index types:**

| Type | Good for | Example |
|---|---|---|
| **B-tree** (default) | `=`, `<`, `>`, `BETWEEN`, `ORDER BY`, `LIKE 'abc%'` | `(job_id, status)` |
| **GIN** | values *inside* something: arrays, JSONB keys, full-text search | `skills @> ARRAY['Node']` |
| **GiST** | ranges, geometry, "nearest" searches | location / date-range overlap |
| **BRIN** | huge tables where data is stored in order, like logs by time | `created_at` on an append-only table |
| **Hash** | equality only | rarely needed; B-tree is usually fine |

**Composite indexes and column order.** A B-tree on `(job_id, status)` is sorted by `job_id` first, then `status` inside each job. So:
- `WHERE job_id = 42` ✅ uses it (the leftmost column).
- `WHERE job_id = 42 AND status = 'shortlisted'` ✅ uses both columns.
- `WHERE status = 'shortlisted'` alone ❌ usually not. Our test fell back to a `Seq Scan`.

Rule of thumb: put **equality** columns first, then **sort**, then **range** columns. MongoDB calls this the [ESR rule](topic:mongodb/compound-indexes-esr), and the same idea works here.

:::version[PostgreSQL 18: skip scan]
PostgreSQL 18 added **skip scan** for B-tree indexes. It can use `(a, b)` for `WHERE b = 500` **when `a` has only a few distinct values**. It "skips" through each value of `a`. In our test, with 3 values of `a`, the planner used an Index Only Scan. With 500 job ids it still chose a sequential scan. Don't rely on it: design the column order for your queries.
:::

**Partial indexes.** `CREATE INDEX … ON applications (job_id) WHERE status = 'shortlisted'` indexes only shortlisted rows. It is small and fast. The query must include a matching condition (`status = 'shortlisted'`), or the planner can't use it. It's great for "active", "not deleted" or "pending" rows.

**Expression indexes.** `WHERE lower(email) = …` can't use a plain index on `email`. Index the **same expression**: `(lower(email))`. For case-insensitive uniqueness, use `CREATE UNIQUE INDEX … (lower(email))`.

**Covering indexes.** `CREATE INDEX … ON applications (job_id) INCLUDE (status)` stores extra columns in the index. Then some queries can be answered from the index alone (an **Index Only Scan**), without visiting the table.

**Things PostgreSQL does and doesn't do for you:**
- `PRIMARY KEY` and `UNIQUE` → automatic B-tree index.
- `FOREIGN KEY` → **no** automatic index. Add one on columns you join on.

**Costs of indexes.**
- Every `INSERT`/`UPDATE`/`DELETE` must also update every index. More indexes mean slower writes.
- Indexes use disk space and memory.
- Unused indexes are pure cost. Find them with the `pg_stat_user_indexes` view (`idx_scan = 0`).

**Building indexes on a live table.** A normal `CREATE INDEX` blocks writes while it builds. In production, use `CREATE INDEX CONCURRENTLY`. It is slower, but writes keep working. It can't run inside a transaction block.

**Why wasn't my index used?** Common reasons: the query reads a large share of the table (a seq scan is cheaper), the statistics are old (run `ANALYZE`), a function wraps the column (`lower(email)`), or the types don't match. Check with [EXPLAIN ANALYZE](topic:postgresql/explain-analyze).

## 🎯 Why do we use it?

Tables grow. A query that is instant with 1,000 rows can take seconds with 10 million. The right index keeps lookups fast as data grows, because the database reads a few index pages instead of the whole table.

It's usually the **first fix** for a slow query, before caching or denormalising.

## ⚠️ Common mistakes

- **Wrong column order** in a composite index. The query filters on the second column only.
- **Forgetting to index foreign keys.** Joins and deletes on the parent table become slow.
- **Indexing everything.** Writes slow down, and many indexes are never used.
- **Wrapping the column in a function** (`WHERE lower(email) = …`) without an expression index.
- **`CREATE INDEX` on a busy production table** without `CONCURRENTLY`. It blocks writes.

## 🗣️ How to answer in an interview

> "An index is a separate sorted structure that lets PostgreSQL find rows without scanning the whole table. The default is a B-tree, which handles equality, ranges, sorting and prefix LIKE. For a composite index the column order matters: it's sorted by the first column, so I put the equality filters first, then sort, then range columns — same idea as MongoDB's ESR rule. PostgreSQL 18 added skip scan, but I don't rely on it.
>
> I also use partial indexes for hot subsets like 'only shortlisted' or 'not deleted', expression indexes for things like lower(email), and GIN for arrays, JSONB and full-text. I remember that foreign keys aren't indexed automatically. And indexes aren't free — they slow writes and take space — so I add them for real query patterns, check them with EXPLAIN ANALYZE, and build them with CREATE INDEX CONCURRENTLY in production."

[FILL IN: where you used PostgreSQL, and an index you added and how you proved it helped.]

## 🔁 Follow-up questions

### Why might PostgreSQL ignore my index?

If the query returns a big part of the table, reading the table directly is cheaper. Other reasons are old statistics (run `ANALYZE`), a function on the column, or a type mismatch.

### What is an Index Only Scan?

When every column the query needs is inside the index, PostgreSQL can answer from the index without touching the table. `INCLUDE` columns help make this possible.

### How do you index a JSONB column?

A GIN index: `CREATE INDEX … USING GIN (data)`. It supports `@>` (contains) and key-exists queries. For one specific key, an expression B-tree index on `(data->>'city')` is often better.

### How do you find unused indexes?

Query `pg_stat_user_indexes` and look for indexes with `idx_scan = 0` over a long period. Then drop them carefully.

## ✅ Quick check

### 1. Index on `(job_id, status)`. Which query is most likely to use it fully?

- A) `WHERE status = 'shortlisted'`
- B) `WHERE job_id = 42 AND status = 'shortlisted'`
- C) `WHERE email = 'a@b.com'`

:::answer
**B.** It filters on both columns, starting with the leftmost one. A filters only on the second column, so it usually gets a sequential scan. C uses a column that isn't in the index.
:::

### 2. You have an index on `email`. Will `WHERE lower(email) = 'asha@mail.com'` use it?

:::answer
**No.** The index stores `email`, not `lower(email)`. Create an expression index on `(lower(email))`.
:::

### 3. True or false: adding `REFERENCES jobs(id)` to `applications.job_id` also creates an index on `job_id`.

:::answer
**False.** PostgreSQL creates indexes for primary keys and unique constraints only. Add `CREATE INDEX ON applications (job_id)` yourself.
:::
