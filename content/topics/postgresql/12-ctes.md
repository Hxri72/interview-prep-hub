---
title: CTEs (WITH)
stack: postgresql
order: 12
level: Intermediate
mustKnow: false
askedFrequency: common
summary:
  - "A CTE (Common Table Expression) gives a name to a small query with WITH name AS (...), so the main query can use it like a table."
  - It breaks a long query into readable steps, top to bottom.
  - WITH RECURSIVE lets a CTE use itself. It walks trees and chains, like manager → manager → manager.
  - A recursive CTE has a starting query, UNION ALL, and a repeating query. It stops when no new rows appear.
  - Since PostgreSQL 12, simple CTEs are inlined (optimised like subqueries). Use MATERIALIZED to force a separate step.
cards:
  - q: What is a CTE?
    a: "A named temporary result defined with WITH name AS (SELECT …). The main query can read it like a table. It exists only for that one statement."
  - q: CTE vs subquery?
    a: They can do the same job. A CTE is easier to read for multi-step logic, can be referenced more than once, and can be recursive.
  - q: What are the parts of a recursive CTE?
    a: An anchor (starting rows), UNION ALL, and a recursive part that joins the table to the CTE itself. It repeats until the recursive part returns no new rows.
  - q: What did PostgreSQL 12 change about CTEs?
    a: "Before 12, every CTE was computed separately (an \"optimisation fence\"). From 12, a simple CTE used once is inlined into the main query. You can control it with MATERIALIZED or NOT MATERIALIZED."
  - q: How do you stop a recursive CTE from looping forever?
    a: Use UNION instead of UNION ALL, add a depth limit (WHERE level < 10), or use PostgreSQL 14's CYCLE clause to detect loops.
---

## 💡 What is it?

A **CTE** (Common Table Expression) is a **named step** inside one [query](glossary:query). You write it with `WITH name AS (…)`.

The main query then uses that name **like a table**. This turns a long, nested query into clear steps that read from top to bottom.

`WITH RECURSIVE` is a special kind. It can **use itself**, so it can walk a tree, like a chain of managers.

## 🏠 Real-life example

Think of **solving a long maths problem in your notebook**.

You don't write it all in one line. You write: "Step 1: total marks = …". "Step 2: average = total ÷ 5". "Step 3: is the average above 60?".

- Each **numbered step with a name** = one CTE (`WITH step1 AS (…)`).
- The **final answer line** = the main `SELECT`.
- A **family tree** (grandfather → father → you) where you keep asking "who are this person's children?" = a recursive CTE.
- **Stopping when nobody has more children** = the recursion ends when no new rows appear.

## 🧑‍💻 Code example

Run this in `psql` or any PostgreSQL tool.

```sql
CREATE TABLE applications (candidate TEXT, job TEXT, status TEXT);        -- one row per application
INSERT INTO applications VALUES                                           -- sample data
  ('Asha','Node Developer','shortlisted'), ('Ravi','Node Developer','rejected'), -- two for Node
  ('Meena','Tech Lead','shortlisted'), ('John','Tech Lead','shortlisted'), -- two for Tech Lead
  ('Lina','Tech Lead','applied');                                         -- one more for Tech Lead

WITH shortlist AS (                                                       -- step 1: give a name to a small result
  SELECT job, COUNT(*) AS total                                           -- count shortlisted people per job
  FROM applications                                                       -- read from applications
  WHERE status = 'shortlisted'                                            -- only shortlisted rows
  GROUP BY job                                                            -- one row per job
)                                                                         -- end of the CTE
SELECT job, total FROM shortlist                                          -- step 2: use it like a table
WHERE total >= 2;                                                         -- jobs with 2 or more shortlisted

CREATE TABLE recruiters (id INT, name TEXT, manager_id INT);              -- a team with managers
INSERT INTO recruiters VALUES (1,'Divya',NULL),(2,'Arun',1),(3,'Kiran',2),(4,'Sneha',1); -- Divya > Arun > Kiran

WITH RECURSIVE chain AS (                                                 -- RECURSIVE: the CTE can use itself
  SELECT id, name, 1 AS level FROM recruiters WHERE manager_id IS NULL    -- start: the person with no manager
  UNION ALL                                                               -- then keep adding rows
  SELECT r.id, r.name, c.level + 1                                        -- the next level down
  FROM recruiters r JOIN chain c ON r.manager_id = c.id                   -- people whose manager is already in chain
)                                                                         -- stops when no new rows are found
SELECT name, level FROM chain ORDER BY level, name;                       -- show the whole tree, level by level
```

**Output** (real run on PostgreSQL 18):

```text
 job       | total
-----------+-------
 Tech Lead | 2
(1 row)

 name  | level
-------+-------
 Divya | 1
 Arun  | 2
 Sneha | 2
 Kiran | 3
(4 rows)
```

**How the recursion runs:**
1. **Start:** Divya (no manager) → level 1.
2. **Round 1:** whose manager is Divya? Arun and Sneha → level 2.
3. **Round 2:** whose manager is Arun or Sneha? Kiran → level 3.
4. **Round 3:** whose manager is Kiran? Nobody → stop.

## 🔍 Deeper version

**Several CTEs in a row.** Separate them with commas. Each one can use the ones before it:

```sql
WITH active_jobs AS (SELECT id FROM jobs WHERE state = 'active'),        -- step 1: active jobs
     counts AS (                                                         -- step 2: uses step 1
       SELECT job_id, COUNT(*) AS n FROM applications                    -- applications per job
       WHERE job_id IN (SELECT id FROM active_jobs) GROUP BY job_id      -- only active ones
     )                                                                   -- end of step 2
SELECT * FROM counts WHERE n > 10;                                       -- final answer
```

**Inlining (PostgreSQL 12+).** Before version 12, every CTE was computed **on its own** first. The planner could not push filters into it, so CTEs were sometimes slow. Since 12, a non-recursive CTE that is used **once** is **inlined**, like a subquery. You can choose:
- `WITH x AS MATERIALIZED (…)` — compute it once, separately (useful if it's expensive and used several times).
- `WITH x AS NOT MATERIALIZED (…)` — always inline it.

**Recursive CTE rules:**
- It must be `anchor UNION [ALL] recursive part`.
- The recursive part must reference the CTE **once**.
- `UNION ALL` keeps duplicates and is faster. `UNION` removes duplicates, which can also stop simple loops.
- **Guard against cycles** (A manages B, B manages A). Add `WHERE level < 20`, or use the `CYCLE` clause (PostgreSQL 14+).

**Data-modifying CTEs.** PostgreSQL also lets a CTE run `INSERT`, `UPDATE` or `DELETE … RETURNING`, and use the result in the main query. For example, move rows to an archive table in one statement.

**Compared with MongoDB.** A recursive CTE is like MongoDB's `$graphLookup` stage. Multi-step CTEs feel like an [aggregation pipeline](glossary:aggregation-pipeline): each step feeds the next.

## 🎯 Why do we use it?

- **Readability.** A report with five steps is far easier to read and review as five named CTEs than as five nested subqueries.
- **Reuse inside one query.** You can reference the same CTE twice.
- **Trees and hierarchies.** Managers, categories, comment threads and referral chains need recursion. A self join only goes one level.

## ⚠️ Common mistakes

- **Infinite recursion** when the data has a cycle. Add a depth limit or `CYCLE`.
- **Thinking a CTE is a stored table.** It exists only for that one statement.
- **Assuming CTEs are always slower** (or always faster). Since PostgreSQL 12 most are inlined. Measure with EXPLAIN.
- **Forgetting the comma** between multiple CTEs, or writing `WITH` twice.

## 🗣️ How to answer in an interview

> "A CTE is a named sub-result defined with WITH, which the main query can use like a table. I mainly use them to make long queries readable: each step gets a name, and the logic reads top to bottom instead of being nested. They can also be recursive. A recursive CTE has an anchor query, UNION ALL, and a part that joins back to the CTE itself, and it repeats until no new rows come out. That's how I'd get a full management chain or a category tree.
>
> On performance: since PostgreSQL 12, simple CTEs are inlined like subqueries, so they're not automatically slower. If a CTE is expensive and used several times, I can mark it MATERIALIZED. For recursive ones, I always add a depth limit or a CYCLE check so bad data can't loop forever."

[FILL IN: where you used PostgreSQL, and a CTE you wrote, if any.]

## 🔁 Follow-up questions

### CTE vs temporary table?

A CTE lives only for one statement. A temporary table lives for the whole session, can have indexes, and can be reused across many queries. Use a temp table for big intermediate data you query many times.

### Can a CTE be used more than once in the same query?

Yes. Reference its name as many times as you need. If it's expensive, `MATERIALIZED` makes sure it is computed only once.

### How would you show the full path, like "Divya > Arun > Kiran"?

Carry a text column in the recursion: start with `name AS path`, then in the recursive part use `c.path || ' > ' || r.name`.

## ✅ Quick check

### 1. In a recursive CTE, what makes it stop?

:::answer
It stops when the recursive part returns **no new rows**. (Or when you add a limit like `WHERE level < 10`.)
:::

### 2. Which keyword is needed for a CTE to reference itself?

- A) `WITH LOOP`
- B) `WITH RECURSIVE`
- C) `WITH MATERIALIZED`

:::answer
**B) `WITH RECURSIVE`.** `MATERIALIZED` only controls whether the CTE is computed separately.
:::

### 3. True or false: in PostgreSQL 17, every CTE is always computed separately before the main query.

:::answer
**False.** Since PostgreSQL 12, a non-recursive CTE used once is usually inlined. Write `MATERIALIZED` to force it to be computed separately.
:::
