---
title: Subqueries
stack: postgresql
order: 11
level: Intermediate
mustKnow: false
askedFrequency: common
summary:
  - A subquery is a query inside another query, written in brackets.
  - "It can return one value (salary > (SELECT AVG(salary) …)), a list (id IN (SELECT …)) or a whole table (FROM (SELECT …) AS t)."
  - EXISTS asks "is there at least one row?". NOT EXISTS is the safe way to find rows with no match.
  - A correlated subquery uses a column from the outer query, so it runs once per outer row.
  - Avoid NOT IN with a list that can contain NULL — it returns no rows. Use NOT EXISTS instead.
cards:
  - q: What is a subquery?
    a: A SELECT inside another SQL statement, in brackets. Its result is used by the outer query as a value, a list or a table.
  - q: What is a correlated subquery?
    a: A subquery that uses a column from the outer query, like WHERE a.job_id = j.id. It is logically run once for each outer row.
  - q: IN vs EXISTS?
    a: "IN checks if a value is in a list returned by the subquery. EXISTS only checks whether the subquery returns any row. For \"is there a match?\" both work, and PostgreSQL often runs them the same way."
  - q: Why is NOT IN dangerous?
    a: If the subquery returns even one NULL, NOT IN returns no rows at all, because comparing with NULL is "unknown". NOT EXISTS doesn't have this problem.
  - q: Subquery or join — which is better?
    a: Use whichever is clearer. PostgreSQL often rewrites one into the other. Check with EXPLAIN if speed matters.
---

## 💡 What is it?

A **subquery** is a [query](glossary:query) **inside another query**. You write it in brackets.

The inner query runs and gives an answer. The outer query then uses that answer. The answer can be **one value**, a **list**, or a **whole table**.

A special kind, the **correlated subquery**, uses a column from the outer query. It is checked once for every outer row.

## 🏠 Real-life example

Think of a **teacher choosing students for a prize**.

The rule is: "Give a prize to every student who scored **above the class average**."

First, someone works out the **class average** on a side sheet. Then the teacher checks each student against that number.

- The **side calculation** (class average) = the subquery `(SELECT AVG(…))`.
- The **main check** (who is above it) = the outer query.
- "Has this student submitted **at least one** project?" = an `EXISTS` subquery. You stop as soon as you find one.
- Checking **each student's own** project list = a correlated subquery. It runs once per student.

## 🧑‍💻 Code example

Run this in `psql` or any PostgreSQL tool.

```sql
CREATE TABLE jobs (id INT PRIMARY KEY, title TEXT, salary INT);           -- jobs with a salary
CREATE TABLE applications (candidate TEXT, job_id INT);                   -- who applied to which job
INSERT INTO jobs VALUES (10,'Node Developer',90000),(20,'QA Engineer',60000),(30,'Tech Lead',150000); -- three jobs
INSERT INTO applications VALUES ('Asha',10),('Ravi',10),('Meena',30);     -- nobody applied for QA

SELECT title FROM jobs                                                    -- 1) subquery in WHERE with IN
WHERE id IN (SELECT job_id FROM applications)                             -- inner query: ids of jobs that got applications
ORDER BY id;                                                              -- stable order

SELECT title FROM jobs j                                                  -- 2) EXISTS: "is there at least one row?"
WHERE NOT EXISTS (                                                        -- NOT EXISTS = keep jobs with zero applications
  SELECT 1 FROM applications a WHERE a.job_id = j.id                      -- correlated: uses j.id from the outer query
);                                                                        -- end of the subquery

SELECT title, salary FROM jobs                                            -- 3) scalar subquery: returns one single value
WHERE salary > (SELECT AVG(salary) FROM jobs);                            -- average is 100000, so only Tech Lead

SELECT j.title,                                                           -- 4) correlated subquery in SELECT
  (SELECT COUNT(*) FROM applications a WHERE a.job_id = j.id) AS applicants -- runs once per job row
FROM jobs j ORDER BY j.id;                                                -- stable order
```

**Output** (real run on PostgreSQL 18):

```text
 title
----------------
 Node Developer
 Tech Lead
(2 rows)

 title
-------------
 QA Engineer
(1 row)

 title     | salary
-----------+--------
 Tech Lead | 150000
(1 row)

 title          | applicants
----------------+------------
 Node Developer | 2
 QA Engineer    | 0
 Tech Lead      | 1
(3 rows)
```

## 🔍 Deeper version

**Where a subquery can go:**

| Place | Returns | Example |
|---|---|---|
| `WHERE x = (…)` / `> (…)` | one value (scalar) | `salary > (SELECT AVG(salary) FROM jobs)` |
| `WHERE x IN (…)` | a list | `id IN (SELECT job_id FROM applications)` |
| `WHERE EXISTS (…)` | true / false | jobs that have at least one application |
| `FROM (…) AS t` | a table (derived table) | `FROM (SELECT … GROUP BY …) AS t` |
| `SELECT (…)` | one value per row | the applicants count above |

A scalar subquery must return **at most one row**. If it returns two, you get the error `more than one row returned by a subquery used as an expression`.

**Correlated vs not.** `(SELECT AVG(salary) FROM jobs)` doesn't use the outer row, so it runs once. `WHERE a.job_id = j.id` uses the outer `j`, so it is logically run once per job. PostgreSQL can often turn `EXISTS` / `IN` into a **semi-join** or **anti-join**, which is as fast as a normal join.

**The NOT IN + NULL trap.** This is a classic interview question:

```sql
SELECT title FROM jobs                                     -- jobs nobody applied for… or so we think
WHERE id NOT IN (SELECT job_id FROM applications);         -- if ANY job_id is NULL, this returns 0 rows
```

`x NOT IN (1, NULL)` means `x <> 1 AND x <> NULL`. Anything compared with NULL is **unknown**, so the whole test is never true. `NOT EXISTS` doesn't compare values, so NULLs don't break it. **Prefer `NOT EXISTS`.**

**Subquery vs join vs CTE.** They can often express the same thing. Pick the clearest one. For a long query with several steps, a [CTE](topic:postgresql/ctes) reads better. Check speed with [EXPLAIN ANALYZE](topic:postgresql/explain-analyze).

## 🎯 Why do we use it?

Some questions have **two steps**: "first find X, then use X". For example, "jobs paying above the average", or "jobs with no applications".

A subquery lets you write both steps in **one query**, close to how you'd say it in English. It also gives the database the chance to plan both steps together.

## ⚠️ Common mistakes

- **`NOT IN` with a subquery that can return NULL.** It returns no rows. Use `NOT EXISTS`.
- **A scalar subquery that returns more than one row.** It throws an error at run time.
- **A slow correlated subquery in `SELECT`** on a big table. A `LEFT JOIN … GROUP BY` may be faster; check with EXPLAIN.
- **Forgetting the alias** for a subquery in `FROM`. PostgreSQL used to require `AS t`; it is optional since PostgreSQL 16, but adding it is clearer.

## 🗣️ How to answer in an interview

> "A subquery is a query nested inside another, in brackets. It can return a single value, like comparing salary to the average; a list, used with IN; or a whole table in the FROM clause. A correlated subquery uses a column from the outer query, so it's evaluated per outer row, like counting applications for each job.
>
> For 'does a match exist' questions I like EXISTS and NOT EXISTS. One trap I always mention is NOT IN: if the subquery returns any NULL, NOT IN returns nothing, so for 'jobs with no applications' I use NOT EXISTS. Performance-wise, PostgreSQL often rewrites IN and EXISTS into joins, so I pick the clearest form and check with EXPLAIN if it matters."

[FILL IN: where you used PostgreSQL, and one subquery you wrote.]

## 🔁 Follow-up questions

### Is EXISTS faster than IN?

Often they run the same way, because PostgreSQL turns both into a semi-join. `EXISTS` can stop at the first match. The real difference is `NOT IN` vs `NOT EXISTS`, where NULLs make `NOT IN` wrong.

### What is a derived table?

A subquery in the `FROM` clause. You treat its result like a temporary table, for example to filter on a `COUNT` you just calculated.

### How would you find the second highest salary?

`SELECT MAX(salary) FROM jobs WHERE salary < (SELECT MAX(salary) FROM jobs);` — a scalar subquery inside another. Window functions like `DENSE_RANK()` are another way.

## ✅ Quick check

### 1. `applications.job_id` contains (10, 10, NULL). What does this return?

```sql
SELECT title FROM jobs WHERE id NOT IN (SELECT job_id FROM applications); -- NOT IN with a NULL in the list
```

:::answer
**No rows.** Because the list contains NULL, every `NOT IN` test is "unknown", never true. Use `NOT EXISTS` instead.
:::

### 2. Which subquery is correlated?

- A) `WHERE salary > (SELECT AVG(salary) FROM jobs)`
- B) `WHERE EXISTS (SELECT 1 FROM applications a WHERE a.job_id = j.id)`

:::answer
**B.** It uses `j.id` from the outer query. A uses nothing from outside, so it runs once.
:::

### 3. What error do you get if `(SELECT salary FROM jobs)` is used in `WHERE salary > (…)` and returns 3 rows?

:::answer
`more than one row returned by a subquery used as an expression`. A comparison needs exactly one value.
:::
