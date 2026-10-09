---
title: "Joins: INNER, LEFT, RIGHT, FULL"
stack: postgresql
order: 9
level: Intermediate
mustKnow: true
askedFrequency: very common
summary:
  - A join puts rows from two tables side by side, using a column they share, like applications.job_id = jobs.id.
  - INNER JOIN keeps only rows that match on both sides.
  - LEFT JOIN keeps every row from the left table. Missing matches become NULL. Use it for "show all jobs, even with 0 applicants".
  - RIGHT JOIN is the mirror of LEFT. FULL JOIN keeps unmatched rows from both sides.
  - "Count with COUNT(right_table.column), not COUNT(*), so a LEFT JOIN with no match gives 0, not 1."
cards:
  - q: What is the difference between INNER JOIN and LEFT JOIN?
    a: INNER JOIN returns only rows that match in both tables. LEFT JOIN returns every row from the left table, and fills NULL where the right table has no match.
  - q: How do you list all jobs with their number of applicants, including jobs with zero?
    a: "jobs LEFT JOIN applications ON applications.job_id = jobs.id, then GROUP BY the job and COUNT(applications.job_id)."
  - q: Why can COUNT(*) give 1 instead of 0 after a LEFT JOIN?
    a: A job with no applications still appears as one row (with NULLs). COUNT(*) counts that row. COUNT(a.job_id) skips NULLs, so it gives 0.
  - q: When would you use a FULL JOIN?
    a: When you need unmatched rows from both sides, for example comparing two lists to find what is missing on either side.
  - q: How is a SQL join different from MongoDB's $lookup?
    a: Both combine data from two places. In SQL, joins are the normal way to read related data. In MongoDB you often embed data instead, and use $lookup when you must join.
---

## 💡 What is it?

In a relational [database](glossary:database), related data lives in **separate tables**. Candidates are in one table. Jobs are in another. Applications link them.

A **[join](glossary:join)** puts rows from two tables side by side. It uses a shared column to match them, like `applications.job_id = jobs.id`.

There are four main kinds: **INNER**, **LEFT**, **RIGHT** and **FULL**. They differ in what happens to rows that have **no match**.

## 🏠 Real-life example

Think of a **class photo day**.

The teacher has two lists: the **class register** (all students) and the **photo list** (students who brought the photo fee).

- **INNER JOIN** = only students who are on both lists. They get a photo.
- **LEFT JOIN** (register on the left) = every student in the register. Those who didn't pay show "fee: missing".
- **RIGHT JOIN** = every name on the photo list, even a fee paid by a student who left the school.
- **FULL JOIN** = everyone from both lists, with gaps marked on either side.
- The **shared column** = the roll number, used to match the two lists.

## 🧑‍💻 Code example

Run this in `psql` or any PostgreSQL tool (it also runs in PGlite, a small in-browser PostgreSQL).

```sql
CREATE TABLE candidates (id INT PRIMARY KEY, name TEXT);              -- table of people who apply
CREATE TABLE jobs (id INT PRIMARY KEY, title TEXT);                   -- table of open jobs
CREATE TABLE applications (                                           -- links a candidate to a job
  candidate_id INT REFERENCES candidates(id),                         -- who applied
  job_id INT REFERENCES jobs(id)                                      -- which job they applied to
);                                                                    -- end of the applications table
INSERT INTO candidates VALUES (1, 'Asha'), (2, 'Ravi'), (3, 'Meena'); -- Meena has not applied yet
INSERT INTO jobs VALUES (10, 'Node Developer'), (20, 'QA Engineer');  -- QA Engineer has no applicants
INSERT INTO applications VALUES (1, 10), (2, 10);                     -- Asha and Ravi applied for job 10

SELECT c.name, j.title                                                -- INNER JOIN: only rows that match on both sides
FROM applications a                                                   -- start from the applications table (a = short name)
JOIN candidates c ON c.id = a.candidate_id                            -- find the candidate for each application
JOIN jobs j ON j.id = a.job_id                                        -- find the job for each application
ORDER BY c.name;                                                      -- sort by name so the output is stable

SELECT j.title, COUNT(a.job_id) AS applicants                         -- LEFT JOIN: keep every job, even with 0 applicants
FROM jobs j                                                           -- jobs is the "left" table, so all jobs stay
LEFT JOIN applications a ON a.job_id = j.id                           -- attach applications if they exist
GROUP BY j.title                                                      -- one row per job
ORDER BY j.title;                                                     -- stable order

SELECT c.name, a.job_id                                               -- FULL JOIN: keep unmatched rows from BOTH sides
FROM candidates c                                                     -- left side: all candidates
FULL JOIN applications a ON a.candidate_id = c.id                     -- right side: all applications
ORDER BY c.name;                                                      -- Meena shows with an empty job_id
```

**Output** (real run on PostgreSQL 18):

```text
 name | title
------+----------------
 Asha | Node Developer
 Ravi | Node Developer
(2 rows)

 title          | applicants
----------------+------------
 Node Developer | 2
 QA Engineer    | 0
(2 rows)

 name  | job_id
-------+--------
 Asha  | 10
 Meena |
 Ravi  | 10
(3 rows)
```

**What to notice:**
- The INNER JOIN hides Meena and the QA job, because they have no match.
- The LEFT JOIN keeps the QA job with **0** applicants.
- The FULL JOIN shows Meena with an empty (NULL) `job_id`.

## 🔍 Deeper version

**`JOIN` means `INNER JOIN`.** The word `INNER` is optional. `LEFT JOIN` is short for `LEFT OUTER JOIN`.

| Join | Keeps unmatched rows from… | Typical use |
|---|---|---|
| `INNER JOIN` | neither side | applications with their job and candidate |
| `LEFT JOIN` | the left table | all jobs, even with no applicants |
| `RIGHT JOIN` | the right table | rarely used; swap the tables and use LEFT |
| `FULL JOIN` | both tables | compare two lists, find gaps on each side |
| `CROSS JOIN` | — | every row × every row (all combinations) |

**The COUNT trap.** After a LEFT JOIN, a job with no applications still produces **one row** full of NULLs. `COUNT(*)` counts that row and says 1. `COUNT(a.job_id)` ignores NULLs and says 0. Always count a column from the right table.

**ON vs WHERE in a LEFT JOIN.** A filter on the right table changes the result:

```sql
SELECT j.title, a.candidate_id                                -- all jobs, plus shortlisted applications
FROM jobs j                                                   -- left side: every job
LEFT JOIN applications a                                      -- right side: applications
  ON a.job_id = j.id AND a.status = 'shortlisted';            -- filter INSIDE ON: jobs without a match still show
-- If you put "a.status = 'shortlisted'" in WHERE instead,     -- WHERE runs after the join
-- the NULL rows fail the test and the LEFT JOIN acts like an INNER JOIN.
```

**Finding "missing" rows (anti-join).** `LEFT JOIN … WHERE right.id IS NULL` finds left rows with no match. For example, candidates who never applied. `NOT EXISTS` does the same, and often reads more clearly (see [subqueries](topic:postgresql/subqueries)).

**Performance.** PostgreSQL chooses a join method for you: **nested loop**, **hash join** or **merge join**. An [index](glossary:index) on the join column (like `applications.job_id`) helps a lot. Foreign key columns are **not indexed automatically** in PostgreSQL, so add the index yourself. See [EXPLAIN ANALYZE](topic:postgresql/explain-analyze).

**Compared with MongoDB.** In SQL, joins are the everyday way to read related data. In MongoDB you usually embed data, and use [$lookup](topic:mongodb/lookup-unwind) when you must join.

## 🎯 Why do we use it?

Good table design stores each fact **once** (see [normalisation](topic:postgresql/normalization)). So the data you need for one screen is spread over several tables.

Joins put it back together when you read. For example, one query can return "candidate name + job title + company" for a recruiter's dashboard.

## ⚠️ Common mistakes

- **Using INNER JOIN when you need LEFT JOIN.** Jobs with zero applicants silently disappear from the report.
- **`COUNT(*)` after a LEFT JOIN.** It shows 1 instead of 0. Count a right-table column.
- **Putting a right-table filter in `WHERE`** after a LEFT JOIN. It turns it into an INNER JOIN.
- **Forgetting the `ON` condition or joining on the wrong column.** You get far too many rows (a cross product).
- **No index on the foreign key column.** Joins on big tables become slow.

## 🗣️ How to answer in an interview

> "A join combines rows from two tables using a shared column, usually a foreign key like applications.job_id matching jobs.id. INNER JOIN keeps only rows that match on both sides. LEFT JOIN keeps every row from the left table and fills NULL where there's no match, so it's what I use for things like 'all jobs with their applicant count, including zero'. RIGHT JOIN is the mirror, and FULL JOIN keeps unmatched rows from both sides.
>
> Two traps I watch for: after a LEFT JOIN, I count a column from the right table, not COUNT(*), so empty matches give 0. And I put filters on the right table inside the ON clause, otherwise the WHERE turns my LEFT JOIN into an INNER JOIN. For speed, I make sure the join columns are indexed, because PostgreSQL doesn't index foreign keys automatically."

[FILL IN: where you used PostgreSQL, and one real query with a join that you wrote.]

## 🔁 Follow-up questions

### How do you find candidates who never applied for any job?

Use an anti-join: `candidates LEFT JOIN applications ON … WHERE applications.candidate_id IS NULL`. Or use `WHERE NOT EXISTS (SELECT 1 FROM applications a WHERE a.candidate_id = c.id)`.

### What join algorithms does PostgreSQL use?

Nested loop (good when one side is small and the other has an index), hash join (builds a hash table from one side; good for big unsorted sets) and merge join (both sides sorted). The planner picks one based on statistics. `EXPLAIN` shows which one.

### Does PostgreSQL index foreign keys automatically?

No. It indexes primary keys and unique columns. Add an index on foreign key columns you join or filter on.

### What happens if the join condition matches many rows?

Each match produces a row. One candidate with three applications gives three rows. This "fan-out" can inflate sums and counts, so group or use `COUNT(DISTINCT …)` carefully.

## ✅ Quick check

### 1. Jobs: Node (2 applications), QA (0 applications). What does this return?

```sql
SELECT j.title, COUNT(*)                          -- counts rows, including NULL rows
FROM jobs j LEFT JOIN applications a ON a.job_id = j.id -- keep all jobs
GROUP BY j.title;                                 -- one row per job
```

:::answer
**Node 2, QA 1.** QA has no applications, but the LEFT JOIN still makes one row of NULLs for it, and `COUNT(*)` counts that row. Use `COUNT(a.job_id)` to get 0.
:::

### 2. Which join keeps rows from both tables even when there is no match?

- A) INNER JOIN
- B) LEFT JOIN
- C) FULL JOIN

:::answer
**C) FULL JOIN.** LEFT keeps only the left side's unmatched rows. INNER keeps no unmatched rows.
:::

### 3. True or false: `LEFT JOIN … WHERE a.status = 'shortlisted'` still shows jobs with no applications.

:::answer
**False.** For those jobs `a.status` is NULL, so the WHERE removes them. Put the condition in the `ON` clause to keep them.
:::
