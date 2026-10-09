---
title: Common SQL interview queries (2nd highest salary, duplicates, top N per group)
stack: postgresql
order: 20
level: Intermediate
mustKnow: true
askedFrequency: very common
summary:
  - "2nd highest: SELECT DISTINCT salary … ORDER BY salary DESC OFFSET 1 LIMIT 1, or a MAX subquery, or DENSE_RANK for the Nth."
  - "Duplicates: GROUP BY the column, then HAVING count(*) > 1."
  - "Top N per group: number the rows with ROW_NUMBER() OVER (PARTITION BY group ORDER BY value DESC), then keep rn <= N."
  - "Rows with no match (e.g. candidates with no applications): LEFT JOIN … WHERE right_side.id IS NULL."
  - Always ask about ties and NULLs before you write the query. They change the answer.
cards:
  - q: Write the 2nd highest salary query.
    a: "SELECT DISTINCT salary FROM recruiters ORDER BY salary DESC OFFSET 1 LIMIT 1. Or: SELECT max(salary) FROM recruiters WHERE salary < (SELECT max(salary) FROM recruiters)."
  - q: How do you find duplicate emails?
    a: "SELECT email, count(*) FROM users GROUP BY email HAVING count(*) > 1."
  - q: How do you get the top 2 earners in each team?
    a: Number rows per team with ROW_NUMBER() OVER (PARTITION BY team ORDER BY salary DESC) in a subquery, then keep rn <= 2.
  - q: How do you find candidates who never applied?
    a: "LEFT JOIN applications and keep rows where applications.id IS NULL. Or use NOT EXISTS."
  - q: Why does count(*) give the wrong number after a LEFT JOIN?
    a: count(*) counts rows, and an unmatched row still exists (with NULLs). Use count(a.id), which ignores NULLs.
---

## 💡 What is it?

Some SQL questions come up in **almost every** backend interview. They test whether you really understand `GROUP BY`, `HAVING`, joins, subqueries and window functions.

This page solves the most common ones on one small [database](glossary:database) of recruiters and candidates. Each answer is short. Learn the **pattern** behind it, not just the query.

## 🏠 Real-life example

Think of a **school sports day results sheet**.

- "Who came **second** in the 100 m race?" = the 2nd highest salary.
- "Which students' names are written **twice** on the list?" = finding duplicates.
- "Who were the **top 2 runners in each house** (red, blue, green)?" = top N per group.
- "Which students **didn't take part in any event**?" = rows with no match.
- **Two runners with the same time** = ties. The teacher must decide: both are second, or one is second and one is third?

That last point is why you should **always ask about ties** in the interview.

## 🧑‍💻 Code example

Run this file in any PostgreSQL: `psql -d mydb -f queries.sql`.

```sql
CREATE TABLE recruiters (                       -- recruiters and their salary
  id     serial PRIMARY KEY,                    -- 1, 2, 3...
  name   text NOT NULL,                         -- recruiter name
  team   text NOT NULL,                         -- 'tech' or 'sales'
  salary int  NOT NULL,                         -- monthly salary in rupees
  email  text NOT NULL                          -- NOT unique on purpose, so we can find duplicates
);                                              -- end of table
INSERT INTO recruiters (name, team, salary, email) VALUES   -- 6 sample rows
  ('Asha',  'tech',  90000, 'asha@x.com'),      -- top earner
  ('Bala',  'tech',  80000, 'bala@x.com'),      -- second in tech
  ('Chitra','tech',  80000, 'chitra@x.com'),    -- tie with Bala
  ('Dev',   'sales', 70000, 'dev@x.com'),       -- top in sales
  ('Esha',  'sales', 60000, 'esha@x.com'),      -- second in sales
  ('Asha2', 'sales', 50000, 'asha@x.com');      -- same email as Asha: a duplicate

-- Q1: second highest salary (DISTINCT so ties don't count twice)
SELECT DISTINCT salary FROM recruiters ORDER BY salary DESC OFFSET 1 LIMIT 1;  -- skip the top 1, take 1

-- Q2: emails that appear more than once
SELECT email, count(*) AS times FROM recruiters GROUP BY email HAVING count(*) > 1;  -- HAVING filters groups

-- Q3: top 2 earners in each team
SELECT team, name, salary FROM (                -- outer query reads the numbered rows
  SELECT team, name, salary,                    -- the columns we want
         ROW_NUMBER() OVER (PARTITION BY team ORDER BY salary DESC, name) AS rn  -- 1, 2, 3 within each team
  FROM recruiters                               -- from the table
) ranked                                        -- a name for the subquery
WHERE rn <= 2                                   -- keep the first 2 per team
ORDER BY team, rn;                              -- tidy order

-- Q4: delete duplicate emails, keep the row with the lowest id
DELETE FROM recruiters a USING recruiters b     -- join the table to itself
WHERE a.email = b.email AND a.id > b.id;        -- remove the later copy
SELECT count(*) AS left_rows FROM recruiters;   -- how many rows remain
```

**Output** (real run on PostgreSQL 18.4):

```text
CREATE TABLE
INSERT 0 6
 salary
--------
  80000
(1 row)

 email      | times
------------+-------
 asha@x.com |     2
(1 row)

 team  | name | salary
-------+------+--------
 sales | Dev  |  70000
 sales | Esha |  60000
 tech  | Asha |  90000
 tech  | Bala |  80000
(4 rows)

DELETE 1
 left_rows
-----------
         5
(1 row)
```

**What to notice:**
- Q1 gives **80000**, even though two people earn it. `DISTINCT` made the tie count once.
- In Q3, Bala and Chitra tie in tech. `ROW_NUMBER` must pick one, so we added `name` to the `ORDER BY` to make the pick predictable.
- Q4 deleted only the **later** Asha row (`a.id > b.id`).

## 🔍 Deeper version

**Q1 has three good answers.** Know at least two:

```sql
SELECT max(salary) FROM recruiters                         -- the biggest salary...
WHERE salary < (SELECT max(salary) FROM recruiters);       -- ...among those below the top one

SELECT DISTINCT salary FROM (                              -- Nth highest: change r = 3 to any N
  SELECT salary, DENSE_RANK() OVER (ORDER BY salary DESC) AS r FROM recruiters  -- rank without gaps
) x WHERE r = 3;                                           -- 3rd highest
```

On the same data, the `max` version returns **80000** and the `DENSE_RANK … r = 3` version returns **70000**. Those are the real results.

**Ties: ROW_NUMBER vs RANK vs DENSE_RANK.** Real output on the same 5 recruiters:

```text
 name   | salary | rnk | drnk | rn
--------+--------+-----+------+----
 Asha   |  90000 |   1 |    1 |  1
 Bala   |  80000 |   2 |    2 |  2
 Chitra |  80000 |   2 |    2 |  3
 Dev    |  70000 |   4 |    3 |  4
 Esha   |  60000 |   5 |    4 |  5
```

- `ROW_NUMBER`: always unique. Ties get different numbers.
- `RANK`: ties share a number, then it **skips** (2, 2, 4).
- `DENSE_RANK`: ties share a number, **no gaps** (2, 2, 3). Best for "Nth highest".

More in [Window functions](topic:postgresql/window-functions).

**Rows with no match (anti-join).** Candidates who never applied:

```sql
SELECT c.name                                   -- candidate names
FROM candidates c                               -- every candidate
LEFT JOIN applications a ON a.candidate_id = c.id  -- attach applications if any
WHERE a.id IS NULL;                             -- keep only those with no application
```

With 3 candidates where only Ravi has no application, this returned `Ravi`. `NOT EXISTS (SELECT 1 FROM applications a WHERE a.candidate_id = c.id)` gives the same answer, and it's often what the planner likes best.

**The `count(*)` trap after a LEFT JOIN.** Counting applications per candidate, real output:
- `count(a.id)` → Meena 2, **Ravi 0**, Sara 1. ✅
- `count(*)` → Meena 2, **Ravi 1**, Sara 1. ❌ The unmatched row still counts as one row.

**More classics to practise:**
- Count per status: `SELECT status, count(*) FROM applications GROUP BY status`.
- Latest application per candidate: `DISTINCT ON (candidate_id) … ORDER BY candidate_id, created_at DESC` (a Postgres-only shortcut).
- Running total per month: `sum(amount) OVER (ORDER BY month)`.
- Employees earning more than their manager: a **self join**. See [Self joins](topic:postgresql/self-joins).

## 🎯 Why do we use it?

These patterns aren't just interview tricks. In a hiring product they answer real questions:
- "Show the **top 3 candidates per job** by match score." → top N per group.
- "Find **duplicate candidates** imported from different ATSs." → GROUP BY + HAVING.
- "Which jobs have **no applicants** yet?" → anti-join.

If you know the patterns, you can solve new questions you haven't seen before.

## ⚠️ Common mistakes

- **Forgetting ties.** `ORDER BY salary DESC OFFSET 1 LIMIT 1` without `DISTINCT` returns 80000 here by luck, but can return the **top** salary again if two people share it.
- **Using `WHERE` instead of `HAVING`** for a condition on `count(*)`. `WHERE` runs before grouping, `HAVING` after.
- **`count(*)` after a LEFT JOIN.** It counts unmatched rows as 1. Count a column from the right table.
- **`NOT IN` with NULLs.** If the subquery returns any NULL, `NOT IN` returns no rows at all. Prefer `NOT EXISTS`.

## 🗣️ How to answer in an interview

> "First I'd ask: should ties count as one salary or separately, and can there be NULLs? For the second highest salary I'd use SELECT DISTINCT salary ORDER BY salary DESC OFFSET 1 LIMIT 1, or a MAX with a subquery. For the Nth highest, DENSE_RANK in a subquery is cleanest, because ties share a rank without gaps.
>
> For duplicates I GROUP BY the column and use HAVING count(*) > 1, because WHERE runs before grouping. For top N per group I number the rows with ROW_NUMBER over PARTITION BY the group, ordered by the value, and keep rn ≤ N. And for 'records with no match' I use a LEFT JOIN with IS NULL, or NOT EXISTS, and I count a right-side column, not count(*)."

[FILL IN: where you used PostgreSQL, and one real query like these that you wrote.]

## 🔁 Follow-up questions

### How would you delete duplicates but keep one copy?

Self-join delete: `DELETE FROM t a USING t b WHERE a.email = b.email AND a.id > b.id`. This keeps the lowest id. Then add a `UNIQUE` constraint so it can't happen again.

### What is the difference between WHERE and HAVING?

`WHERE` filters **rows before** grouping. `HAVING` filters **groups after** `GROUP BY`, so it can use aggregates like `count(*)`.

### LEFT JOIN … IS NULL vs NOT EXISTS vs NOT IN?

The first two are safe and usually equally fast in Postgres. `NOT IN` breaks when the subquery contains a NULL, so avoid it for "no match" questions.

### How do you get the latest row per group?

Either `ROW_NUMBER() … ORDER BY created_at DESC` and keep `rn = 1`, or Postgres's `DISTINCT ON (group_col) … ORDER BY group_col, created_at DESC`.

## ✅ Quick check

### 1. Salaries are 90000, 80000, 80000, 70000. What does this return?

```sql
SELECT salary FROM recruiters ORDER BY salary DESC OFFSET 1 LIMIT 1;  -- no DISTINCT
```

:::answer
**80000.** It skips the first row (90000) and takes the next row, which is 80000. But if the top salary were tied (90000, 90000), it would wrongly return 90000. That's why `DISTINCT` matters.
:::

### 2. Which clause is wrong?

```sql
SELECT email, count(*) FROM recruiters WHERE count(*) > 1 GROUP BY email;  -- find duplicates?
```

:::answer
`WHERE count(*) > 1` is an error, because aggregates aren't allowed in `WHERE`. Use `GROUP BY email HAVING count(*) > 1`.
:::

### 3. In top-N-per-group, which window function would show **both** tied recruiters as rank 2?

- A) ROW_NUMBER
- B) RANK or DENSE_RANK

:::answer
**B.** `RANK` and `DENSE_RANK` give ties the same number. `ROW_NUMBER` always gives different numbers.
:::
