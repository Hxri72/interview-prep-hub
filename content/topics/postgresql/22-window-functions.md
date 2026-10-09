---
title: Window functions (ROW_NUMBER, RANK)
stack: postgresql
order: 22
level: Advanced
mustKnow: false
askedFrequency: common
summary:
  - A window function calculates over a group of related rows but keeps every row. GROUP BY squashes rows into one, a window doesn't.
  - "Syntax: function() OVER (PARTITION BY group ORDER BY column). PARTITION BY = which rows belong together, ORDER BY = their order inside."
  - "ROW_NUMBER always counts 1, 2, 3. RANK gives ties the same number then skips. DENSE_RANK gives ties the same number with no gap."
  - "LAG/LEAD read the previous/next row. sum() OVER (ORDER BY …) gives a running total."
  - You can't use a window function in WHERE. Put it in a subquery or CTE, then filter outside.
cards:
  - q: How is a window function different from GROUP BY?
    a: GROUP BY collapses many rows into one row per group. A window function adds a calculated value to every row and keeps all the rows.
  - q: What do PARTITION BY and ORDER BY do inside OVER()?
    a: PARTITION BY splits rows into groups (like per job). ORDER BY sets the order inside each group, which matters for ranking, LAG and running totals.
  - q: "Scores 92, 85, 85, 80: what do ROW_NUMBER, RANK and DENSE_RANK give?"
    a: "ROW_NUMBER: 1, 2, 3, 4. RANK: 1, 2, 2, 4. DENSE_RANK: 1, 2, 2, 3."
  - q: Why does WHERE ROW_NUMBER() OVER (…) = 1 fail?
    a: "Window functions are calculated after WHERE. Postgres says: window functions are not allowed in WHERE. Wrap the query in a subquery or CTE and filter outside."
  - q: How do you get a running total?
    a: "sum(amount) OVER (ORDER BY date): each row gets the total of itself and all earlier rows."
---

## 💡 What is it?

A **window function** does a calculation across a **group of related rows**, but it **keeps every row** in the result.

`GROUP BY` squashes a group into **one** row. A window function adds a new column to **each** row instead. Examples: "this candidate's rank within the job", "this job's average score", "the score of the previous candidate".

You write it with `OVER (...)`.

## 🏠 Real-life example

Think of **class exam results** on a big sheet.

`GROUP BY class` would give you **one line per class**: "Class 10A average: 78". You lose the students.

A window function keeps **every student's line** and adds extra columns next to it:
- **"Your rank in your class"** = `RANK() OVER (PARTITION BY class ORDER BY marks DESC)`.
- **"Your class average"** = `avg(marks) OVER (PARTITION BY class)`.
- **"Marks of the student just above you"** = `LAG(marks)`.

And the words:
- **"in your class"** = `PARTITION BY` (which rows belong together).
- **"by marks, highest first"** = `ORDER BY` inside `OVER`.
- **Each class's list** = one **window** (partition).

## 🧑‍💻 Code example

Run this in any PostgreSQL: `psql -d mydb -f windows.sql`.

```sql
CREATE TABLE scores (                           -- AI match scores of candidates per job
  job       text NOT NULL,                      -- the job, e.g. 'backend'
  candidate text NOT NULL,                      -- the candidate's name
  score     int  NOT NULL                       -- match score out of 100
);                                              -- end of table
INSERT INTO scores VALUES                       -- 6 sample scores
  ('backend', 'Meena', 92), ('backend', 'Ravi', 85), ('backend', 'Sara', 85),  -- Ravi and Sara tie
  ('frontend', 'Arun', 78), ('frontend', 'Divya', 88), ('frontend', 'Kiran', 70); -- another job

SELECT job, candidate, score,                   -- normal columns, every row stays
  ROW_NUMBER() OVER w AS row_num,               -- 1, 2, 3 inside each job, always unique
  RANK()       OVER w AS rank,                  -- ties share a number, then a gap
  DENSE_RANK() OVER w AS dense,                 -- ties share a number, no gap
  round(avg(score) OVER (PARTITION BY job), 1) AS job_avg,  -- the job's average on every row
  score - LAG(score) OVER w AS diff_from_prev   -- gap to the previous row in the ranking
FROM scores                                     -- from the table
WINDOW w AS (PARTITION BY job ORDER BY score DESC) -- one named window: per job, best score first
ORDER BY job, score DESC, candidate;            -- tidy order for reading
```

**Output** (real run on PostgreSQL 18.4):

```text
 job      | candidate | score | row_num | rank | dense | job_avg | diff_from_prev
----------+-----------+-------+---------+------+-------+---------+----------------
 backend  | Meena     |    92 |       1 |    1 |     1 |    87.3 |
 backend  | Ravi      |    85 |       2 |    2 |     2 |    87.3 |             -7
 backend  | Sara      |    85 |       3 |    2 |     2 |    87.3 |              0
 frontend | Divya     |    88 |       1 |    1 |     1 |    78.7 |
 frontend | Arun      |    78 |       2 |    2 |     2 |    78.7 |            -10
 frontend | Kiran     |    70 |       3 |    3 |     3 |    78.7 |             -8
(6 rows)
```

**What to notice:**
- All 6 rows are still there. `GROUP BY job` would give only 2.
- Numbering **restarts for each job**. That's `PARTITION BY job`.
- Ravi and Sara tie at 85. `RANK` and `DENSE_RANK` give both **2**. `ROW_NUMBER` must give them different numbers. Which of the two gets 2 is **not guaranteed**, so add a tie-breaker (`ORDER BY score DESC, candidate`) when it matters.
- `LAG` is empty (NULL) for the first row of each job, because there is no previous row.
- `WINDOW w AS (...)` names a window once, so you don't repeat it.

## 🔍 Deeper version

**The shape:** `function(...) OVER ( [PARTITION BY ...] [ORDER BY ...] [frame] )`.

**Common window functions:**

| Function | What it gives | Example use |
|---|---|---|
| `ROW_NUMBER()` | 1, 2, 3… unique | top N per group, de-duplicating |
| `RANK()` | ties same, then gap (1, 2, 2, 4) | sports-style ranking |
| `DENSE_RANK()` | ties same, no gap (1, 2, 2, 3) | "Nth highest salary" |
| `LAG(col)` / `LEAD(col)` | value from the previous / next row | change since last month |
| `sum/avg/count(...) OVER` | aggregate without collapsing rows | % of total, running total |
| `FIRST_VALUE / LAST_VALUE` | first / last value in the window | best score in the job |
| `NTILE(4)` | splits rows into 4 buckets | quartiles |

**Running total.** With `ORDER BY` inside `OVER`, `sum` adds up "this row and everything before it". Real output:

```sql
SELECT to_char(month, 'Mon') AS mon, hired,                  -- month name and hires that month
       sum(hired) OVER (ORDER BY month) AS running_total     -- add up all months so far
FROM hires ORDER BY month;                                   -- in date order
```

```text
 mon | hired | running_total
-----+-------+---------------
 Jan |     3 |             3
 Feb |     5 |             8
 Mar |     2 |            10
```

A real gotcha we hit while testing: we first named the column `month` too (`to_char(month,'Mon') AS month`). Then `ORDER BY month` sorted by the **text** alias, giving Feb, Jan, Mar. Avoid aliases that clash with real column names.

**Frames.** By default, with `ORDER BY`, the frame is "from the first row up to this row and its ties". You can change it, for example `ROWS BETWEEN 2 PRECEDING AND CURRENT ROW` for a 3-month moving average. `LAST_VALUE` often surprises people because of this default frame.

**Order of evaluation:** `FROM → WHERE → GROUP BY → HAVING → window functions → SELECT list → ORDER BY → LIMIT`. That's why this fails, with the real error:

```text
ERROR:  window functions are not allowed in WHERE
```

Fix: compute it in a subquery or CTE, then filter outside. That's exactly the **top N per group** pattern in [Common SQL interview queries](topic:postgresql/interview-queries). CTEs are explained in [CTEs (WITH)](topic:postgresql/ctes).

**Performance.** A window with `PARTITION BY a ORDER BY b` usually needs a sort. An index on `(a, b)` can let Postgres skip it. Check with [EXPLAIN ANALYZE](topic:postgresql/explain-analyze). MongoDB has a similar stage called `$setWindowFields`.

## 🎯 Why do we use it?

Window functions answer "**compared with others**" questions in one query:
- Top 3 candidates per job by match score.
- Each candidate's score vs the job average.
- Month-over-month change in hires.
- Running totals for dashboards.

Without them, you'd need self-joins or several queries plus code in JavaScript. That's slower and easier to get wrong.

## ⚠️ Common mistakes

- **Using a window function in `WHERE`.** It isn't allowed. Wrap it and filter outside.
- **`ROW_NUMBER` with ties and no tie-breaker.** The result can change between runs.
- **Mixing up `RANK` and `DENSE_RANK`** for "Nth highest". Use `DENSE_RANK` so ties don't create gaps.
- **Forgetting `PARTITION BY`.** Then the whole table is one window, and the numbering doesn't restart per group.

## 🗣️ How to answer in an interview

> "A window function calculates across related rows but keeps every row, unlike GROUP BY, which collapses them. I write it with OVER: PARTITION BY says which rows belong together, like per job, and ORDER BY sets the order inside, which matters for ranking, LAG and running totals.
>
> ROW_NUMBER always gives unique numbers, RANK gives ties the same number and then skips, and DENSE_RANK gives ties the same number without gaps, so DENSE_RANK is what I use for 'Nth highest'. Window functions run after WHERE, so to get the top N per group I compute ROW_NUMBER in a subquery or CTE and filter rn ≤ N outside."

[FILL IN: where you used PostgreSQL, and any report where you used a window function.]

## 🔁 Follow-up questions

### Can you use a window function with GROUP BY in the same query?

Yes. Window functions run **after** grouping, so they work on the grouped rows. For example, `sum(count(*)) OVER ()` gives each group's share of the grand total.

### What is the difference between ROWS and RANGE in a frame?

`ROWS` counts physical rows ("the 2 rows before"). `RANGE` uses values, so all rows with the same `ORDER BY` value are treated together. That's why ties can make running totals jump.

### How would you calculate the percentage each job contributes to all applications?

`count(*) * 100.0 / sum(count(*)) OVER ()` with `GROUP BY job`. The empty `OVER ()` means "the whole result" as one window.

### Does MongoDB have window functions?

Yes, the `$setWindowFields` stage in aggregation does the same job, with `partitionBy` and `sortBy`.

## ✅ Quick check

### 1. Scores in one job are 90, 80, 80, 70. What does `DENSE_RANK()` give the 70?

:::answer
**3.** DENSE_RANK gives 1, 2, 2, 3. (RANK would give 4, and ROW_NUMBER 4.)
:::

### 2. What's wrong with this?

```sql
SELECT candidate FROM scores
WHERE ROW_NUMBER() OVER (ORDER BY score DESC) = 1;   -- the top candidate?
```

:::answer
Postgres gives **`ERROR: window functions are not allowed in WHERE`**. Put the `ROW_NUMBER` in a subquery or CTE, then filter `WHERE rn = 1` outside.
:::

### 3. How many rows does this return if `scores` has 6 rows across 2 jobs?

```sql
SELECT job, avg(score) OVER (PARTITION BY job) FROM scores;  -- window average
```

:::answer
**6 rows.** A window function never removes rows. Each row shows its own job's average. `GROUP BY job` would return 2.
:::
