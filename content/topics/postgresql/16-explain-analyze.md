---
title: EXPLAIN ANALYZE
stack: postgresql
order: 16
level: Intermediate
mustKnow: false
askedFrequency: common
summary:
  - EXPLAIN shows the plan PostgreSQL WILL use for a query. EXPLAIN ANALYZE really runs it and shows real times and row counts.
  - Seq Scan = reads the whole table. Index Scan = jumps to matching rows through an index.
  - Compare estimated rows with actual rows. A big difference means old statistics — run ANALYZE.
  - "Look at 'Rows Removed by Filter', the slowest node, and the total Execution Time."
  - EXPLAIN ANALYZE really runs the statement, so wrap INSERT/UPDATE/DELETE in BEGIN … ROLLBACK.
cards:
  - q: What is the difference between EXPLAIN and EXPLAIN ANALYZE?
    a: EXPLAIN only shows the planned steps and estimated costs. EXPLAIN ANALYZE actually runs the query and adds the real time and real row counts for each step.
  - q: Seq Scan vs Index Scan?
    a: A Seq Scan reads every row of the table. An Index Scan uses an index to find matching rows directly. For small tables or queries returning most rows, a Seq Scan can be the better choice.
  - q: What does "Rows Removed by Filter" tell you?
    a: How many rows were read and then thrown away. A big number means the database did a lot of useless work, which often means a missing index.
  - q: What does it mean when estimated rows are very different from actual rows?
    a: The planner's statistics are wrong or old, so it may pick a bad plan. Run ANALYZE on the table, or check data skew.
  - q: Is EXPLAIN ANALYZE safe on an UPDATE?
    a: "No — it really runs the UPDATE. Wrap it: BEGIN; EXPLAIN ANALYZE UPDATE …; ROLLBACK;"
---

## 💡 What is it?

When you run a [query](glossary:query), PostgreSQL first makes a **plan**: which table to read, which [index](glossary:index) to use, how to join.

`EXPLAIN` shows you that plan **without running** the query. `EXPLAIN ANALYZE` **runs it for real** and adds the **actual time** and **actual row counts**.

It is the main tool for finding out **why a query is slow**.

## 🏠 Real-life example

Think of **Google Maps before a trip**.

You ask for directions. Maps shows the route and says "about 25 minutes". Then you actually drive it and note the real time.

- The **route Maps suggests** = the plan from `EXPLAIN`.
- "**About 25 minutes**" = the estimated cost.
- **Driving it and timing it** = `EXPLAIN ANALYZE`.
- **Driving through every street** in the city to find one house = a Seq Scan.
- **Using the house number directly** = an Index Scan.
- Maps said 25 minutes but it **took 2 hours** = estimates far from reality, which usually means old map data (old statistics).

## 🧑‍💻 Code example

Run this in `psql` or any PostgreSQL tool.

```sql
CREATE TABLE candidates (id SERIAL PRIMARY KEY, email TEXT, city TEXT); -- a table with 100,000 rows
INSERT INTO candidates (email, city)                                   -- fill it with fake data
SELECT 'user' || g || '@mail.com',                                     -- unique emails
       (ARRAY['Kochi','Chennai','Pune','Delhi'])[g % 4 + 1]            -- 4 cities
FROM generate_series(1, 100000) AS g;                                  -- g = 1 … 100000
ANALYZE candidates;                                                    -- refresh the planner's statistics

EXPLAIN ANALYZE                                                        -- ANALYZE = really run it and time it
SELECT id FROM candidates WHERE email = 'user500@mail.com';            -- BEFORE: no index on email

CREATE INDEX idx_candidates_email ON candidates (email);               -- add a B-tree index on email

EXPLAIN ANALYZE                                                        -- run the same query again
SELECT id FROM candidates WHERE email = 'user500@mail.com';            -- AFTER: the index is used
```

**Output** (real run on PostgreSQL 18; your times will differ):

```text
 Seq Scan on candidates  (cost=0.00..1986.00 rows=1 width=4) (actual time=0.062..6.038 rows=1.00 loops=1)
   Filter: (email = 'user500@mail.com'::text)
   Rows Removed by Filter: 99999
   Buffers: shared hit=736
 Planning:
   Buffers: shared hit=19
 Planning Time: 0.124 ms
 Execution Time: 6.124 ms

 Index Scan using idx_candidates_email on candidates  (cost=0.42..8.44 rows=1 width=4) (actual time=0.066..0.068 rows=1.00 loops=1)
   Index Cond: (email = 'user500@mail.com'::text)
   Index Searches: 1
   Buffers: shared hit=1 read=3
 Planning:
   Buffers: shared hit=5 read=1
 Planning Time: 0.129 ms
 Execution Time: 0.088 ms
```

**Reading it:**
- **Before:** `Seq Scan` read all 100,000 rows and threw away **99,999** (`Rows Removed by Filter`). It took about **6 ms**. It read 736 data pages (`Buffers: shared hit=736`).
- **After:** `Index Scan` went straight to the 1 row. It took about **0.09 ms**, roughly 70 times faster, and read only 4 pages.

## 🔍 Deeper version

**How to read one line:**

```text
Seq Scan on candidates  (cost=0.00..1986.00 rows=1 width=4) (actual time=0.062..6.038 rows=1.00 loops=1)
```

| Part | Meaning |
|---|---|
| `cost=0.00..1986.00` | the planner's estimate: cost to get the first row .. cost for all rows (made-up units, not ms) |
| `rows=1` (first) | how many rows the planner **expected** |
| `width=4` | average row size in bytes |
| `actual time=0.062..6.038` | real ms to the first row .. to the last row |
| `rows=1.00` (second) | how many rows **really** came out |
| `loops=1` | how many times this step ran (multiply time × loops for nested loops) |

**Plans are trees.** Indented lines with `->` are child steps. Read from the **innermost** step outwards. The slowest step is usually where to look first.

**Common node types:**
- `Seq Scan` — whole table. Fine for small tables or when most rows match.
- `Index Scan` — index, then table, row by row.
- `Index Only Scan` — answered from the index alone.
- `Bitmap Index Scan` + `Bitmap Heap Scan` — collects many matches from the index, then reads table pages in order.
- `Nested Loop`, `Hash Join`, `Merge Join` — ways to [join](topic:postgresql/joins).
- `Sort`, `HashAggregate` — sorting and `GROUP BY`. `Sort Method: external merge Disk` means it spilled to disk, which is slow.

**What to look for:**
1. **Big `Rows Removed by Filter`** → a missing or wrong [index](topic:postgresql/indexes).
2. **Estimated rows ≠ actual rows** by 10× or more → old statistics. Run `ANALYZE table;`.
3. **A Nested Loop with a huge `loops`** count → the inner side runs many times. An index on the inner join column, or a hash join, helps.
4. **Sorts spilling to disk** → add an index that matches `ORDER BY`, or raise `work_mem` for that query.

:::version[PostgreSQL 18 changes]
In PostgreSQL 18, `EXPLAIN ANALYZE` shows **`Buffers`** by default. Before, you had to write `EXPLAIN (ANALYZE, BUFFERS)`. Row counts now show decimals (`rows=1.00`), and index scans show an `Index Searches` line. On older versions, add `BUFFERS` yourself.
:::

**Safety.** `EXPLAIN ANALYZE` **really runs** the statement. For an `UPDATE` or `DELETE`, do:

```sql
BEGIN;                                                        -- start a transaction
EXPLAIN ANALYZE UPDATE jobs SET state = 'expired' WHERE id = 10; -- runs for real, inside the transaction
ROLLBACK;                                                     -- undo the change
```

**Compared with MongoDB.** It is the same idea as [explain('executionStats')](topic:mongodb/explain): `COLLSCAN` ≈ `Seq Scan`, `IXSCAN` ≈ `Index Scan`, and `totalDocsExamined` vs `nReturned` ≈ rows read vs rows returned.

## 🎯 Why do we use it?

Guessing why a query is slow wastes time. `EXPLAIN ANALYZE` shows **exactly** which step is slow and **why**.

It also **proves** a fix worked. In an interview, "the Execution Time went from 6 ms to 0.09 ms after adding the index" is much stronger than "it felt faster".

## ⚠️ Common mistakes

- **Running `EXPLAIN ANALYZE` on a `DELETE`** without `BEGIN … ROLLBACK`. The rows are really deleted.
- **Reading `cost` as milliseconds.** It is a relative estimate. Use `actual time` and `Execution Time`.
- **Testing on a tiny local table.** PostgreSQL picks a Seq Scan, and you think the index is broken. Test with realistic data volumes.
- **Forgetting `loops`.** A step that takes 0.05 ms but runs 100,000 times costs 5 seconds.

## 🗣️ How to answer in an interview

> "EXPLAIN shows the plan PostgreSQL intends to use with estimated costs. EXPLAIN ANALYZE actually runs the query and adds real timings and row counts per step. When a query is slow, I first look for a Seq Scan on a big table with a large 'Rows Removed by Filter' — that usually means a missing index. Then I compare estimated rows to actual rows: if they're very different, the statistics are stale and I run ANALYZE. I also check loops on nested loops and whether sorts spill to disk.
>
> After a fix I run it again to prove it — for example a lookup going from a Seq Scan at about 6 milliseconds to an Index Scan under a tenth of a millisecond. And for UPDATE or DELETE I wrap it in BEGIN and ROLLBACK, because EXPLAIN ANALYZE really executes the statement. It's the same idea as explain('executionStats') in MongoDB."

[FILL IN: where you used PostgreSQL, and a slow query you investigated.]

## 🔁 Follow-up questions

### Why does PostgreSQL choose a Seq Scan even though an index exists?

If many rows match (say 30% of the table), reading the table in order is cheaper than jumping through the index. For a small table, a Seq Scan is also cheaper. Old statistics can cause it too.

### What is `pg_stat_statements`?

An extension that records every query's total and average time. You use it to find **which** queries to investigate. Then you use `EXPLAIN ANALYZE` to see **why** they're slow.

### How do you find slow queries in production?

Turn on `pg_stat_statements`, or set `log_min_duration_statement` so queries slower than a limit (like 500 ms) are logged. Then explain the worst ones.

## ✅ Quick check

### 1. A plan shows `rows=10` (estimated) and `actual … rows=250000`. What do you do first?

:::answer
Run **`ANALYZE`** on the table. The planner's statistics are badly wrong, so it may be choosing a poor plan.
:::

### 2. What does `Rows Removed by Filter: 99999` with 1 row returned suggest?

- A) The query is perfect
- B) A full scan threw away almost everything — an index on the filter column would likely help
- C) The table is empty

:::answer
**B.** The database read 100,000 rows to keep 1. An index on the filtered column lets it jump straight to the match.
:::

### 3. True or false: `EXPLAIN ANALYZE DELETE FROM jobs;` only shows a plan and deletes nothing.

:::answer
**False.** `EXPLAIN ANALYZE` really runs the statement, so the rows are deleted. Use `BEGIN; … ROLLBACK;` around it. (Plain `EXPLAIN` without ANALYZE does not run it.)
:::
