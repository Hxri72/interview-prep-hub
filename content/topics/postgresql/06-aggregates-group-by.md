---
title: "Aggregates: COUNT, SUM, AVG, GROUP BY, HAVING"
stack: postgresql
order: 6
level: Basic
mustKnow: true
askedFrequency: very common
summary:
  - "Aggregate functions turn many rows into one number: COUNT, SUM, AVG, MIN, MAX."
  - GROUP BY makes one result row per group, like one row per job or per status.
  - WHERE filters rows before grouping. HAVING filters groups after grouping.
  - "COUNT(*) counts rows; COUNT(column) skips NULLs. AVG and SUM also ignore NULLs."
  - Every selected column must be in GROUP BY or inside an aggregate, or PostgreSQL gives an error.
cards:
  - q: WHERE vs HAVING?
    a: WHERE filters single rows before grouping. HAVING filters whole groups after grouping, so it can use aggregates like COUNT(*) > 2.
  - q: COUNT(*) vs COUNT(column)?
    a: COUNT(*) counts every row. COUNT(column) counts only rows where that column is not NULL.
  - q: Why does "SELECT job, status FROM applications GROUP BY job" fail?
    a: Each job group has many statuses, so PostgreSQL doesn't know which one to show. Put status in GROUP BY or wrap it in an aggregate.
  - q: How do you count different statuses in one query, side by side?
    a: "Use FILTER: COUNT(*) FILTER (WHERE status = 'applied') AS applied, COUNT(*) FILTER (WHERE status = 'shortlisted') AS shortlisted."
  - q: Does AVG include NULL values?
    a: No. AVG, SUM, MIN and MAX ignore NULLs. A NULL salary is skipped, not treated as 0.
---

## 💡 What is it?

**Aggregate functions** squeeze many rows into **one value**:

- `COUNT` — how many
- `SUM` — total
- `AVG` — average
- `MIN` / `MAX` — smallest / biggest

`GROUP BY` makes **one result row per group**. For example, one row per job showing how many people applied.

`HAVING` then keeps only the groups you want, like "jobs with at least 2 applicants".

## 🏠 Real-life example

Think of the **school sports day**.

All students' results are written on one long list. The principal asks:
- "How many students took part?" → count everyone → `COUNT(*)`.
- "How many from **each house** (Red, Blue, Green)?" → sort students into houses, then count each pile → `GROUP BY house`.
- "Only show houses with **more than 50** students" → look at the piles, keep the big ones → `HAVING COUNT(*) > 50`.
- "Ignore students who were **absent**" → remove them **before** making the piles → `WHERE`.

- The **long list** = the table.
- **Making piles by house** = GROUP BY.
- **Counting each pile** = COUNT.
- **Removing absent students first** = WHERE.
- **Keeping only big piles** = HAVING.

## 🧑‍💻 Code example

Save this as `aggregates.sql`. Run it with `psql -d postgres -f aggregates.sql`.

```sql
CREATE TABLE applications (                       -- one row per application
  id serial PRIMARY KEY,                          -- auto id
  job text NOT NULL,                              -- which job
  status text NOT NULL,                           -- applied / shortlisted / rejected
  expected_salary int                             -- may be NULL (not given)
);                                                -- end of the table
INSERT INTO applications (job, status, expected_salary) VALUES -- six applications
  ('Node.js Developer', 'applied', 900000),       -- Node 1
  ('Node.js Developer', 'applied', 1100000),      -- Node 2
  ('Node.js Developer', 'shortlisted', 1300000),  -- Node 3
  ('React Developer', 'applied', 800000),         -- React 1
  ('React Developer', 'rejected', NULL),          -- React 2: no salary given
  ('QA Engineer', 'applied', 600000);             -- QA 1

SELECT COUNT(*) AS total FROM applications;       -- 1) how many rows in total

SELECT status, COUNT(*) AS how_many               -- 2) one row per status, with its count
FROM applications                                 -- from applications
GROUP BY status                                   -- make one group per status
ORDER BY how_many DESC, status;                   -- biggest group first (then by name)

SELECT job,                                       -- 3) one row per job
       COUNT(*) AS applicants,                    -- how many applied
       ROUND(AVG(expected_salary)) AS avg_salary, -- average salary (NULLs skipped), rounded
       MAX(expected_salary) AS top_salary         -- highest salary asked
FROM applications                                 -- from applications
GROUP BY job                                      -- one group per job
ORDER BY applicants DESC;                         -- most popular job first

SELECT job, COUNT(*) AS applicants                -- 4) only busy jobs
FROM applications                                 -- from applications
GROUP BY job                                      -- one group per job
HAVING COUNT(*) >= 2                              -- keep groups with 2 or more rows
ORDER BY job;                                     -- sort by job name

SELECT COUNT(*) AS all_rows,                      -- 5) every row
       COUNT(expected_salary) AS with_salary      -- only rows where salary is NOT NULL
FROM applications;                                -- from applications

SELECT job,                                       -- 6) statuses side by side, one row per job
       COUNT(*) FILTER (WHERE status = 'applied') AS applied,          -- count only 'applied' rows
       COUNT(*) FILTER (WHERE status = 'shortlisted') AS shortlisted   -- count only 'shortlisted' rows
FROM applications                                 -- from applications
GROUP BY job                                      -- one group per job
ORDER BY job;                                     -- sort by job name

SELECT job, status FROM applications GROUP BY job; -- 7) ❌ status is not grouped or aggregated
```

**Output (what psql prints):**

```text
 total
-------
     6
(1 row)

   status    | how_many
-------------+----------
 applied     |        4
 rejected    |        1
 shortlisted |        1
(3 rows)

        job        | applicants | avg_salary | top_salary
-------------------+------------+------------+------------
 Node.js Developer |          3 |    1100000 |    1300000
 React Developer   |          2 |     800000 |     800000
 QA Engineer       |          1 |     600000 |     600000
(3 rows)

        job        | applicants
-------------------+------------
 Node.js Developer |          3
 React Developer   |          2
(2 rows)

 all_rows | with_salary
----------+-------------
        6 |           5
(1 row)

        job        | applied | shortlisted
-------------------+---------+-------------
 Node.js Developer |       2 |           1
 QA Engineer       |       1 |           0
 React Developer   |       1 |           0
(3 rows)

ERROR:  column "applications.status" must appear in the GROUP BY clause or be used in an aggregate function
```

**What to notice:**
- React's average is **800000**, not 400000. The NULL salary was **skipped**, not counted as 0.
- `COUNT(*)` gave 6, but `COUNT(expected_salary)` gave 5.

## 🔍 Deeper version

**Order of steps.** `FROM → WHERE → GROUP BY → HAVING → SELECT → ORDER BY → LIMIT`. So:
- WHERE can't use `COUNT(*)` — groups don't exist yet.
- HAVING can use aggregates — it runs after grouping.
- Filtering early with WHERE is faster: fewer rows reach the grouping step.

**The GROUP BY rule.** Every column in SELECT must be either in `GROUP BY` or inside an aggregate. Exception: if you group by a table's **primary key**, PostgreSQL lets you select the other columns of that table, because they're fixed for that key.

**NULLs in aggregates.** `SUM`, `AVG`, `MIN`, `MAX` and `COUNT(col)` skip NULLs. `SUM` over zero rows returns **NULL**, not 0. Use `COALESCE(SUM(x), 0)` to get 0.

**Useful extras:**

| Want | Write |
|---|---|
| count distinct values | `COUNT(DISTINCT city)` |
| conditional counts | `COUNT(*) FILTER (WHERE …)` |
| a list per group | `array_agg(name)` or `string_agg(name, ', ')` |
| JSON per group | `json_agg(row)` |
| subtotals and grand total | `GROUP BY ROLLUP (job, status)` |

**Same idea in MongoDB.** `GROUP BY job` with `COUNT(*)` is `{ $group: { _id: '$job', applicants: { $sum: 1 } } }`. `HAVING` is a `$match` after the `$group`. See [aggregation pipeline basics](topic:mongodb/aggregation-basics).

**Aggregates vs window functions.** GROUP BY collapses rows into one per group. **Window functions** (`COUNT(*) OVER (PARTITION BY job)`) keep every row and add the group total next to it. See [window functions](topic:postgresql/window-functions).

**Speed.** For "count per status" on a big table, an index on the WHERE columns helps most. Counting a whole huge table (`COUNT(*)`) still has to scan it — PostgreSQL doesn't keep a ready-made row count.

## 🎯 Why do we use it?

- **Dashboards and reports.** "Applications per job", "average expected salary", "hires this month".
- **The database does the maths.** It sends back 3 summary rows, not 300,000 raw rows for Node to loop over.
- **One query for many numbers.** FILTER gives several counts side by side in a single pass.

## ⚠️ Common mistakes

- **Using WHERE for a group condition**, like `WHERE COUNT(*) > 2`. That's an error — use HAVING.
- **Forgetting that AVG skips NULLs.** If NULL should mean 0, use `AVG(COALESCE(salary, 0))`.
- **Selecting a column that isn't grouped.** PostgreSQL refuses (some other databases silently pick a random value).
- **Expecting `SUM` of no rows to be 0.** It's NULL. Wrap it in `COALESCE`.

## 🗣️ How to answer in an interview

> "Aggregates like COUNT, SUM, AVG, MIN and MAX collapse many rows into one value, and GROUP BY gives one result row per group — for example applications per job. WHERE filters individual rows before grouping, and HAVING filters the groups afterwards, so HAVING is where conditions like COUNT(*) >= 2 go.
>
> A few details I keep in mind: COUNT(*) counts rows but COUNT(column) skips NULLs, and AVG and SUM also ignore NULLs, which changes averages. Every selected column must be grouped or aggregated. And for dashboards I like FILTER, which counts several statuses side by side in one pass. It's the same idea as $group in a MongoDB aggregation pipeline, which I've used more."

[FILL IN: a real report you built — in MongoDB aggregation or in SQL — and what it counted.]

## 🔁 Follow-up questions

### Can you use a SELECT alias in HAVING?

Not portably. HAVING runs before SELECT. In PostgreSQL, repeat the expression: `HAVING COUNT(*) >= 2`. (You **can** use the alias in ORDER BY.)

### How do you get the job with the most applicants?

`SELECT job, COUNT(*) AS n FROM applications GROUP BY job ORDER BY n DESC LIMIT 1;` If ties matter, use a [window function](topic:postgresql/window-functions) like `RANK()`.

### How do you count unique candidates who applied?

`COUNT(DISTINCT candidate_id)`. Plain `COUNT(*)` would count a candidate twice if they applied to two jobs.

### Where does GROUP BY show up in your MongoDB work?

The `$group` stage in an aggregation pipeline does the same job. `$match` before `$group` is WHERE, and `$match` after it is HAVING.

## ✅ Quick check

### 1. Using the table above, what does this return?

```sql
SELECT COUNT(DISTINCT job) AS jobs FROM applications; -- how many different jobs
```

:::answer
**3** — Node.js Developer, React Developer and QA Engineer.
:::

### 2. Spot the error:

```sql
SELECT job, COUNT(*) FROM applications WHERE COUNT(*) > 1 GROUP BY job; -- busy jobs?
```

:::answer
Aggregates aren't allowed in WHERE, because groups don't exist yet at that step. Move the condition: `GROUP BY job HAVING COUNT(*) > 1`.
:::

### 3. What does `SELECT SUM(expected_salary) FROM applications WHERE job = 'Designer';` return if there are no designers?

:::answer
**NULL** (shown as an empty cell), not 0. Use `COALESCE(SUM(expected_salary), 0)` to get 0.
:::
