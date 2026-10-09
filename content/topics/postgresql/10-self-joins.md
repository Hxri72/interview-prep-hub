---
title: Self joins
stack: postgresql
order: 10
level: Intermediate
mustKnow: false
askedFrequency: common
summary:
  - A self join joins a table to itself. You give the table two short names (aliases), like r and m.
  - It is used when a row points to another row in the same table, like a recruiter's manager_id pointing to another recruiter.
  - Use LEFT JOIN when some rows have no partner (the top manager has no manager).
  - It also finds pairs inside one table, like two candidates with the same phone number.
  - For many levels (manager of manager of manager), use a recursive CTE instead.
cards:
  - q: What is a self join?
    a: Joining a table to itself, using two different aliases, so you can compare or link rows inside the same table.
  - q: Give a real example of a self join.
    a: "A recruiters table where manager_id points to another recruiter's id. Join recruiters r to recruiters m ON m.id = r.manager_id to show each recruiter with their manager's name."
  - q: Why use LEFT JOIN in the manager example?
    a: The top person has manager_id NULL. An INNER JOIN would drop them. LEFT JOIN keeps them with an empty manager.
  - q: How do you find duplicate candidates with a self join?
    a: "Join candidates a to candidates b ON a.phone = b.phone AND a.id < b.id. The a.id < b.id part stops a row matching itself and stops each pair showing twice."
  - q: How do you get the whole chain of managers, not just one level?
    a: Use a recursive CTE (WITH RECURSIVE). A self join only goes one level per join.
---

## 💡 What is it?

A **self join** is when a table is [joined](glossary:join) **to itself**.

You use it when one row points to **another row in the same table**. For example, each recruiter has a `manager_id`, and the manager is also a recruiter.

You give the table **two short names** (aliases), like `r` for the recruiter and `m` for the manager. Then it works like a normal join.

## 🏠 Real-life example

Think of a **school class list** where each student also has a **"buddy"** written next to their name.

The buddy is another student in the same list. To print "student — buddy's name", you hold **two copies of the same list**.

- The **class list** = the `recruiters` table.
- **Copy 1** = alias `r` (the person).
- **Copy 2** = alias `m` (their manager / buddy).
- The **buddy roll number** = the `manager_id` column.
- A student with **no buddy** = the top manager with `manager_id` NULL. LEFT JOIN keeps them.

## 🧑‍💻 Code example

Run this in `psql` or any PostgreSQL tool.

```sql
CREATE TABLE recruiters (                                    -- one table for all recruiters
  id INT PRIMARY KEY,                                        -- each recruiter's id
  name TEXT,                                                 -- recruiter's name
  manager_id INT REFERENCES recruiters(id)                   -- points to ANOTHER row in the SAME table
);                                                           -- end of the table
INSERT INTO recruiters VALUES                                -- add some people
  (1, 'Divya', NULL),                                        -- Divya is the head; she has no manager (NULL)
  (2, 'Arun', 1),                                            -- Arun reports to Divya (id 1)
  (3, 'Sneha', 1),                                           -- Sneha also reports to Divya
  (4, 'Kiran', 2);                                           -- Kiran reports to Arun (id 2)

SELECT r.name AS recruiter,                                  -- the person
       m.name AS manager                                     -- their manager's name
FROM recruiters r                                            -- first copy of the table, called r
LEFT JOIN recruiters m ON m.id = r.manager_id                -- second copy, called m; LEFT keeps Divya
ORDER BY r.id;                                               -- stable order
```

**Output** (real run on PostgreSQL 18):

```text
 recruiter | manager
-----------+---------
 Divya     |
 Arun      | Divya
 Sneha     | Divya
 Kiran     | Arun
(4 rows)
```

Divya has no manager, so her `manager` is empty. With an INNER JOIN she would disappear.

## 🔍 Deeper version

**Aliases are required.** Without `r` and `m`, PostgreSQL can't tell which copy you mean. You get an error like `table name "recruiters" specified more than once`.

**Three common uses:**

| Use | Join condition |
|---|---|
| Parent / child in one table (manager, category tree) | `m.id = r.manager_id` |
| Find duplicates (same phone, same email) | `a.phone = b.phone AND a.id < b.id` |
| Compare rows (candidates with more experience than X) | `a.experience > b.experience` |

**Finding duplicates:**

```sql
SELECT a.id, b.id, a.phone                         -- each duplicate pair once
FROM candidates a                                  -- first copy
JOIN candidates b                                  -- second copy
  ON a.phone = b.phone                             -- same phone number
 AND a.id < b.id;                                  -- skip "row matches itself" and skip the mirror pair
```

The `a.id < b.id` part matters. Without it, every row matches itself, and every pair shows twice (A–B and B–A).

**One level only.** A self join goes up **one level** per join. "Kiran → Arun → Divya" needs two self joins, and you don't know the depth ahead of time. A **recursive CTE** walks the whole tree. See [CTEs](topic:postgresql/ctes).

**Performance.** Index the column you join on (here `manager_id`). For "find duplicates" on a big table, `GROUP BY phone HAVING COUNT(*) > 1` is often simpler and faster than a self join.

## 🎯 Why do we use it?

Some data is naturally a **hierarchy inside one table**: managers and staff, categories and sub-categories, comments and replies.

Storing them in one table keeps the design simple. The self join lets you read "row + its related row" in one query, without a second table.

## ⚠️ Common mistakes

- **Using INNER JOIN for a hierarchy.** The top row (no parent) disappears. Use LEFT JOIN.
- **Forgetting `a.id < b.id`** when finding pairs. You get self-matches and every pair twice.
- **Mixing up the aliases.** `m.id = r.manager_id` and `r.id = m.manager_id` mean opposite things (manager vs direct reports).
- **Chaining many self joins** for an unknown depth. Use a recursive CTE.

## 🗣️ How to answer in an interview

> "A self join is joining a table to itself with two aliases. I use it when a row references another row in the same table. The classic example is an employees or recruiters table with a manager_id column: I join recruiters r to recruiters m on m.id = r.manager_id to show each person with their manager. I use a LEFT JOIN there, because the top manager has no manager and would otherwise disappear.
>
> It's also handy for finding pairs, like duplicate candidates with the same phone, where I add a.id < b.id so a row doesn't match itself and each pair appears once. If I need the full chain of managers, I switch to a recursive CTE, because a self join only goes one level at a time."

[FILL IN: where you used PostgreSQL, and a self join you wrote, if any.]

## 🔁 Follow-up questions

### How do you list each manager with the number of people reporting to them?

`SELECT m.name, COUNT(r.id) FROM recruiters m LEFT JOIN recruiters r ON r.manager_id = m.id GROUP BY m.name;` Here the manager is the left side, so managers with zero reports still show.

### Is a self join slow?

It is a normal join, so it is as fast as the index allows. Index the join column. For duplicate checks, `GROUP BY … HAVING COUNT(*) > 1` is usually simpler.

### How would you store a deep tree instead?

Options: an `id/parent_id` column with recursive CTEs, a materialised path like `'1/2/4'`, or PostgreSQL's `ltree` extension. Recursive CTEs are the most common.

## ✅ Quick check

### 1. Kiran (id 4) has manager_id 2 (Arun). Arun has manager_id 1 (Divya). With one self join, what manager does Kiran show?

:::answer
**Arun.** One self join goes up one level only. To also reach Divya, you need another join or a recursive CTE.
:::

### 2. In the duplicate query, what does `a.id < b.id` do?

- A) Sorts the result
- B) Stops a row matching itself and stops each pair appearing twice
- C) Makes the query use an index

:::answer
**B.** Without it, every row matches itself, and every pair appears as both A–B and B–A.
:::

### 3. Why does the example use LEFT JOIN, not JOIN?

:::answer
Divya's `manager_id` is NULL, so there is no matching manager row. An INNER JOIN would drop her. LEFT JOIN keeps her with an empty manager.
:::
