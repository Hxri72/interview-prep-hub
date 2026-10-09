---
title: SELECT, WHERE, ORDER BY, LIMIT
stack: postgresql
order: 4
level: Basic
mustKnow: true
askedFrequency: very common
summary:
  - SELECT picks the columns. FROM picks the table. WHERE keeps only the rows that match a condition.
  - ORDER BY sorts the result. LIMIT keeps the first N rows, and OFFSET skips rows first.
  - "Handy filters: =, <>, >=, IN (...), BETWEEN a AND b, LIKE / ILIKE for patterns, IS NULL."
  - Never write = NULL. Nothing is ever equal to NULL, so use IS NULL or IS NOT NULL.
  - Without ORDER BY, the row order is not guaranteed. Always sort when you use LIMIT.
cards:
  - q: In what order does PostgreSQL logically run a SELECT?
    a: FROM → WHERE → GROUP BY → HAVING → SELECT → ORDER BY → LIMIT/OFFSET. That's why you can't use a SELECT alias inside WHERE.
  - q: Why does WHERE city = NULL return nothing?
    a: NULL means "unknown", and comparing anything with unknown gives unknown, not true. Use WHERE city IS NULL.
  - q: LIKE vs ILIKE?
    a: Both match patterns (% = any characters, _ = one character). LIKE is case-sensitive; ILIKE ignores case (PostgreSQL only).
  - q: Is LIMIT without ORDER BY safe?
    a: No. Without ORDER BY the order is not guaranteed, so you may get different rows each time.
  - q: Is BETWEEN inclusive?
    a: Yes. experience BETWEEN 2 AND 4 includes 2, 3 and 4.
---

## 💡 What is it?

`SELECT` is how you **read** data from a table.

- `SELECT` chooses **which columns** you want.
- `WHERE` keeps **only the rows** that match a condition.
- `ORDER BY` **sorts** the rows.
- `LIMIT` keeps only the **first few** rows.

Almost every screen in an app (lists, searches, "top 10") is a SELECT behind the scenes.

## 🏠 Real-life example

Think of a **teacher with the class register**.

The principal asks: "Give me the names and marks of students from Kochi with marks above 80. Highest first. Only the top 3."

The teacher:
1. opens the class register,
2. looks only at Kochi students with marks above 80,
3. writes down just their names and marks,
4. sorts them from highest to lowest,
5. stops after 3 names.

- The **class register** = `FROM students`.
- **"From Kochi, marks above 80"** = `WHERE city = 'Kochi' AND marks > 80`.
- **"Names and marks only"** = `SELECT name, marks`.
- **"Highest first"** = `ORDER BY marks DESC`.
- **"Only the top 3"** = `LIMIT 3`.

## 🧑‍💻 Code example

Save this as `select.sql`. Run it with `psql -d postgres -f select.sql`.

```sql
CREATE TABLE candidates (                       -- a small candidates table
  id serial PRIMARY KEY,                        -- auto-numbered id
  name text NOT NULL,                           -- candidate name
  city text,                                    -- city (may be NULL = unknown)
  experience int,                               -- years of experience
  expected_salary int,                          -- yearly salary in rupees
  email text UNIQUE                             -- email, no duplicates
);                                              -- end of the table
INSERT INTO candidates (name, city, experience, expected_salary, email) VALUES -- six candidates
  ('Asha', 'Kochi', 4, 1200000, 'asha@mail.com'),        -- 4 years, Kochi
  ('Ravi', 'Chennai', 2, 700000, 'ravi@mail.com'),       -- 2 years, Chennai
  ('Meera', 'Kochi', 6, 1800000, 'meera@mail.com'),      -- 6 years, Kochi
  ('John', 'Bengaluru', 3, 1000000, 'john@mail.com'),    -- 3 years, Bengaluru
  ('Fatima', 'Kochi', 1, 500000, 'fatima@mail.com'),     -- 1 year, Kochi
  ('Kiran', NULL, 5, NULL, 'kiran@mail.com');            -- city and salary unknown (NULL)

SELECT name, city, experience FROM candidates            -- 1) three columns only
WHERE city = 'Kochi' AND experience >= 3                 -- both conditions must be true
ORDER BY experience DESC;                                -- DESC = biggest first

SELECT name, experience FROM candidates ORDER BY experience DESC LIMIT 3;   -- 2) top 3 most experienced
SELECT name FROM candidates WHERE city IN ('Chennai', 'Bengaluru');         -- 3) IN = any value in the list
SELECT name, experience FROM candidates WHERE experience BETWEEN 2 AND 4 ORDER BY name; -- 4) 2, 3 or 4 (inclusive)
SELECT name FROM candidates WHERE name ILIKE 'm%';                          -- 5) starts with m or M (% = anything after)
SELECT name FROM candidates WHERE city = NULL;                              -- 6) ❌ wrong way to check for NULL
SELECT name FROM candidates WHERE city IS NULL;                             -- 7) ✅ right way
SELECT name, experience FROM candidates ORDER BY experience DESC LIMIT 2 OFFSET 2; -- 8) skip 2, then take 2 ("page 2")
```

**Output (the SELECT results, as psql prints them):**

```text
 name  | city  | experience
-------+-------+------------
 Meera | Kochi |          6
 Asha  | Kochi |          4
(2 rows)

 name  | experience
-------+------------
 Meera |          6
 Kiran |          5
 Asha  |          4
(3 rows)

 name
------
 Ravi
 John
(2 rows)

 name | experience
------+------------
 Asha |          4
 John |          3
 Ravi |          2
(3 rows)

 name
-------
 Meera
(1 row)

 name
------
(0 rows)

 name
-------
 Kiran
(1 row)

 name | experience
------+------------
 Asha |          4
 John |          3
(2 rows)
```

**What to notice:** query 6 (`= NULL`) returned **0 rows**, even though Kiran's city is NULL. Query 7 (`IS NULL`) found Kiran.

## 🔍 Deeper version

**Logical order of a query.** You write `SELECT … FROM … WHERE … ORDER BY … LIMIT`, but PostgreSQL thinks about it in this order:

1. `FROM` (and JOINs) — which rows exist
2. `WHERE` — filter rows
3. `GROUP BY` / `HAVING` — group and filter groups (see [aggregates](topic:postgresql/aggregates-group-by))
4. `SELECT` — choose columns and make aliases
5. `ORDER BY` — sort (aliases work here)
6. `LIMIT` / `OFFSET` — cut the result

So `SELECT experience * 12 AS months … WHERE months > 24` fails: `months` doesn't exist yet at the WHERE step.

**NULL is "unknown".** Comparisons with NULL give NULL, not true. That's **three-valued logic**: true, false, unknown. WHERE keeps only rows where the condition is **true**. So `WHERE city <> 'Kochi'` also skips Kiran, whose city is NULL. Use `IS NULL`, `IS NOT NULL`, or `IS DISTINCT FROM`.

**Operators cheat sheet:**

| Want | Write |
|---|---|
| equal / not equal | `=`, `<>` (or `!=`) |
| one of a list | `IN ('a','b')` |
| inclusive range | `BETWEEN 2 AND 4` |
| text pattern | `LIKE 'A%'` (case-sensitive), `ILIKE 'a%'` (any case) |
| combine conditions | `AND`, `OR`, `NOT` (use brackets with OR) |

**Sorting rules.** `ORDER BY experience DESC, name` sorts by experience, then by name for ties. In PostgreSQL, NULLs come **last** when sorting ASC and **first** with DESC. Change it with `NULLS FIRST` or `NULLS LAST`.

**LIMIT/OFFSET and pagination.** `OFFSET 10000` still reads and throws away 10,000 rows, so deep pages get slow. For big lists, use **keyset pagination**: `WHERE id > $lastSeenId ORDER BY id LIMIT 20`. Same idea as [cursor pagination in MongoDB](topic:mongodb/pagination) and [offset vs cursor](topic:rest-auth/pagination-offset-cursor).

**SELECT \* in production.** It sends columns you don't need, and your code breaks or slows down when someone adds a big column. Name the columns you need.

**Speed.** A WHERE on an unindexed column scans the whole table. See [PostgreSQL indexes](topic:postgresql/indexes).

## 🎯 Why do we use it?

- **Every read screen needs it.** Lists, filters, search, "top N", detail pages.
- **The database does the filtering.** It sends back 20 rows, not 2 million rows for your Node code to filter.
- **Correct, predictable results.** ORDER BY + LIMIT gives the same page every time.

## ⚠️ Common mistakes

- **`= NULL` instead of `IS NULL`.** It always returns nothing.
- **LIMIT without ORDER BY.** You get "some" rows, and they may change between runs.
- **Mixing AND and OR without brackets.** `city = 'Kochi' OR city = 'Chennai' AND experience > 3` means `Kochi OR (Chennai AND exp > 3)`. Add brackets.
- **Building WHERE with string concatenation** from user input. That's [SQL injection](topic:postgresql/sql-injection). Use `$1` parameters.

## 🗣️ How to answer in an interview

> "SELECT reads data: I choose the columns, FROM picks the table, WHERE filters rows, ORDER BY sorts and LIMIT/OFFSET cut the result. Logically PostgreSQL runs FROM, then WHERE, GROUP BY, HAVING, SELECT, ORDER BY and finally LIMIT — which is why an alias from SELECT can't be used in WHERE.
>
> Two things I watch for. First, NULL: `= NULL` never matches, so I use IS NULL. Second, pagination: I always pair LIMIT with ORDER BY, and for large tables I use keyset pagination — `WHERE id > last_id ORDER BY id LIMIT 20` — instead of a big OFFSET, because OFFSET still reads all the skipped rows. And I always pass user input as parameters, never by concatenating strings."

[FILL IN: if you used PostgreSQL, a real query you wrote (what it filtered and sorted).]

## 🔁 Follow-up questions

### Why can't I use a column alias in WHERE?

Because WHERE runs before SELECT, so the alias doesn't exist yet. Repeat the expression, or wrap the query in a subquery or [CTE](topic:postgresql/ctes).

### How do you search names case-insensitively?

`WHERE name ILIKE 'asha%'`, or `WHERE lower(name) = lower($1)`. For speed, add an index on `lower(name)`, or use the `citext` type.

### Why is a big OFFSET slow?

PostgreSQL must read and throw away every skipped row. Keyset pagination jumps straight to the next rows using an index.

### What is the difference between `<> 'Kochi'` and `IS DISTINCT FROM 'Kochi'`?

`<>` skips rows where city is NULL (the result is unknown). `IS DISTINCT FROM` treats NULL as a normal value, so NULL-city rows are included.

## ✅ Quick check

### 1. Using the table above, what does this return?

```sql
SELECT name FROM candidates WHERE city <> 'Kochi' ORDER BY name; -- everyone not in Kochi?
```

:::answer
`John` and `Ravi`. Kiran is **not** included: Kiran's city is NULL, and `NULL <> 'Kochi'` is unknown, not true.
:::

### 2. What's wrong with this query?

```sql
SELECT name FROM candidates LIMIT 5; -- "the top 5 candidates"
```

:::answer
There's no `ORDER BY`, so "top 5" means nothing. The order is not guaranteed and can change. Add something like `ORDER BY experience DESC`.
:::

### 3. Is `BETWEEN 2 AND 4` inclusive of 2 and 4?

:::answer
**Yes.** It's the same as `>= 2 AND <= 4`.
:::
