---
title: INSERT, UPDATE, DELETE
stack: postgresql
order: 5
level: Basic
mustKnow: false
askedFrequency: common
summary:
  - INSERT adds rows, UPDATE changes rows, and DELETE removes rows.
  - Always put a WHERE on UPDATE and DELETE. Without it, every row in the table changes or disappears.
  - "RETURNING gives back the changed rows (for example the new id), so you don't need a second SELECT."
  - "Upsert = INSERT … ON CONFLICT: insert, or update/skip if the unique key already exists."
  - Upsert is atomic, so it stays correct even when two requests arrive at the same moment.
cards:
  - q: What does RETURNING do?
    a: It makes INSERT, UPDATE or DELETE return the affected rows, like the new id or the updated values. You get them in the same round trip.
  - q: What is an upsert in PostgreSQL?
    a: "INSERT … ON CONFLICT (unique_column) DO UPDATE SET … (or DO NOTHING). Insert if the row is new; otherwise update or skip it, in one atomic step."
  - q: What is EXCLUDED in ON CONFLICT DO UPDATE?
    a: A special row holding the values you tried to insert. EXCLUDED.name is the new name from the INSERT.
  - q: What happens if you run UPDATE candidates SET experience = 0; with no WHERE?
    a: Every single row gets experience = 0. Always write the WHERE first, or run it inside a transaction you can roll back.
  - q: DELETE vs TRUNCATE?
    a: DELETE removes rows one by one, can have a WHERE, and fires triggers. TRUNCATE empties the whole table very fast, with no WHERE.
---

## 💡 What is it?

These three commands **change** data:

- `INSERT` **adds** new rows.
- `UPDATE` **changes** existing rows.
- `DELETE` **removes** rows.

PostgreSQL adds two great helpers. `RETURNING` gives you back the changed rows. `ON CONFLICT` (an "upsert") inserts a row, or updates it if it already exists.

## 🏠 Real-life example

Think of a **class attendance register**.

- A **new student joins** → the teacher writes a new line → `INSERT`.
- A student **changes their phone number** → the teacher corrects that one line → `UPDATE … WHERE roll_no = 12`.
- A student **leaves the school** → the teacher strikes out that line → `DELETE … WHERE roll_no = 12`.
- A student shows a **new admission form, but they're already in the register** → the teacher just updates their line instead of writing a second one → **upsert**.

Now imagine the teacher says "change the phone number" **without saying whose**. They would change it for **every** student. That's an `UPDATE` without `WHERE`.

## 🧑‍💻 Code example

Save this as `changes.sql`. Run it with `psql -d postgres -f changes.sql`.

```sql
CREATE TABLE candidates (                            -- the candidates table
  id serial PRIMARY KEY,                             -- auto id
  name text NOT NULL,                                -- name
  city text,                                         -- city
  experience int,                                    -- years of experience
  expected_salary int,                               -- salary
  email text UNIQUE                                  -- UNIQUE: needed for ON CONFLICT (email)
);                                                   -- end of the table
INSERT INTO candidates (name, city, experience, expected_salary, email) VALUES -- six starting rows (ids 1–6)
  ('Asha', 'Kochi', 4, 1200000, 'asha@mail.com'),    -- id 1
  ('Ravi', 'Chennai', 2, 700000, 'ravi@mail.com'),   -- id 2
  ('Meera', 'Kochi', 6, 1800000, 'meera@mail.com'),  -- id 3
  ('John', 'Bengaluru', 3, 1000000, 'john@mail.com'),-- id 4
  ('Fatima', 'Kochi', 1, 500000, 'fatima@mail.com'), -- id 5
  ('Kiran', NULL, 5, NULL, 'kiran@mail.com');        -- id 6

INSERT INTO candidates (name, city, experience, email)   -- 1) add one candidate
VALUES ('Divya', 'Pune', 3, 'divya@mail.com')             -- the new values
RETURNING id, name;                                       -- give back the new id straight away

UPDATE candidates SET experience = experience + 1        -- 2) add 1 year…
WHERE name = 'Ravi'                                       -- …only to Ravi (never forget WHERE)
RETURNING name, experience;                               -- show the new value

DELETE FROM candidates WHERE id = 5                       -- 3) remove the row with id 5
RETURNING id, name;                                       -- show what was deleted

INSERT INTO candidates (name, city, experience, email)   -- 4) ❌ plain insert with an existing email
VALUES ('Asha K', 'Kochi', 5, 'asha@mail.com');          -- fails: the email must be unique

INSERT INTO candidates (name, city, experience, email)   -- 5) ✅ upsert with the same data
VALUES ('Asha K', 'Kochi', 5, 'asha@mail.com')           -- the values we want
ON CONFLICT (email) DO UPDATE                             -- if this email already exists…
SET name = EXCLUDED.name,                                 -- …use the new name (EXCLUDED = the values we tried to insert)
    experience = EXCLUDED.experience                      -- …and the new experience
RETURNING id, name, experience;                           -- same id 1, new values

INSERT INTO candidates (name, email)                      -- 6) insert only if new
VALUES ('Someone', 'john@mail.com')                       -- john@mail.com already exists
ON CONFLICT (email) DO NOTHING                            -- so skip it quietly
RETURNING id;                                             -- returns no rows

SELECT id, name, experience FROM candidates ORDER BY id; -- 7) see the final table
```

**Output (what psql prints for steps 1–7):**

```text
 id | name
----+-------
  7 | Divya
(1 row)

INSERT 0 1
 name | experience
------+------------
 Ravi |          3
(1 row)

UPDATE 1
 id |  name
----+--------
  5 | Fatima
(1 row)

DELETE 1
ERROR:  duplicate key value violates unique constraint "candidates_email_key"
DETAIL:  Key (email)=(asha@mail.com) already exists.
 id |  name  | experience
----+--------+------------
  1 | Asha K |          5
(1 row)

INSERT 0 1
 id
----
(0 rows)

INSERT 0 0
 id |  name  | experience
----+--------+------------
  1 | Asha K |          5
  2 | Ravi   |          3
  3 | Meera  |          6
  4 | John   |          3
  6 | Kiran  |          5
  7 | Divya  |          3
(6 rows)
```

**What to notice:**
- `UPDATE 1` and `DELETE 1` tell you **how many rows** changed. Check this number in your app.
- The upsert kept **id 1** and updated Asha's row. `DO NOTHING` returned `INSERT 0 0`, so nothing was added.

## 🔍 Deeper version

**INSERT many rows at once.** One `INSERT … VALUES (…), (…), (…)` is much faster than many single inserts, because it's one round trip. For very big loads, `COPY` is fastest.

**RETURNING.** It works with `INSERT`, `UPDATE`, `DELETE` and `MERGE`. In Node: `const { rows } = await pool.query('INSERT … RETURNING id', [...])`. No second query, and no race condition where you fetch the "latest" id and get someone else's row.

:::version[Version note]
**PostgreSQL 18** lets `RETURNING` show **both** the old and new values: `UPDATE … RETURNING old.experience, new.experience`.
:::

**Upsert details.**
- `ON CONFLICT (email)` needs a **UNIQUE constraint or unique index** on `email`.
- `EXCLUDED` is the row you **tried** to insert. Use it to copy the new values.
- `DO UPDATE … WHERE …` can add a condition, like "only update if the new data is newer".
- Upsert is **atomic**. Two requests at the same time can't both insert a duplicate. "SELECT, then INSERT if missing" in app code is **not** safe.

This is exactly what you want for syncing data from another system, like candidates from an ATS: match on a unique external id or email, then insert or update. Compare with Mongo's `updateOne(…, { upsert: true })` in [update operators](topic:mongodb/update-operators).

**UPDATE with values from another table.** `UPDATE applications a SET status = 'closed' FROM jobs j WHERE j.id = a.job_id AND j.closed = true;`

**Safer deletes.**
- **Soft delete**: `UPDATE … SET deleted_at = now()` keeps history. Remember to filter `WHERE deleted_at IS NULL` everywhere.
- **Foreign keys** decide what happens to linked rows (`CASCADE`, `RESTRICT`). See [foreign keys and constraints](topic:postgresql/foreign-keys-constraints).
- `TRUNCATE` empties a whole table instantly. Never use it on production by accident.

**Do risky changes inside a transaction.** Run `BEGIN; UPDATE …; SELECT …` to check the result, then `COMMIT` or `ROLLBACK`. See [ACID and transactions](topic:postgresql/acid-transactions).

## 🎯 Why do we use it?

- **Every write in an app** — sign-up, edit profile, apply to a job, withdraw — is one of these.
- **RETURNING** saves a round trip and gives you the real saved values (ids, defaults, timestamps).
- **Upsert** makes syncs and "create or update" endpoints safe and simple, even under load.
- **Affected-row counts** let you return 404 when an UPDATE or DELETE matched nothing.

## ⚠️ Common mistakes

- **UPDATE or DELETE without WHERE.** Every row changes. Write the WHERE first.
- **"SELECT, then INSERT if not found"** in app code. Two requests can insert duplicates. Use a UNIQUE constraint plus `ON CONFLICT`.
- **Ignoring the affected-row count.** `UPDATE 0` means nothing matched. Your API should say "not found", not "success".
- **Inserting rows one by one in a loop** for big imports. Use multi-row INSERT or COPY.

## 🗣️ How to answer in an interview

> "INSERT adds rows, UPDATE changes them and DELETE removes them. I always write the WHERE clause first for UPDATE and DELETE, and for risky changes I run them in a transaction so I can check the result and roll back.
>
> In PostgreSQL I use RETURNING a lot — an INSERT can give back the new id and defaults in the same round trip. For create-or-update logic I use an upsert: INSERT … ON CONFLICT on a unique column, DO UPDATE with EXCLUDED values, or DO NOTHING. That's atomic, so it's safe when two requests arrive together, unlike checking with a SELECT first in application code. It's the right tool for syncing records from an external system by a unique key."

[FILL IN: if you used PostgreSQL, a real write you built — e.g. an upsert for a sync.]

## 🔁 Follow-up questions

### How does the unified.to ATS sync idea map to SQL?

Our sync skips candidates whose email already exists. In SQL that's `INSERT … ON CONFLICT (email) DO NOTHING`, or `DO UPDATE` to refresh their details. A UNIQUE constraint on email makes it safe. [FILL IN: only if your sync used PostgreSQL — otherwise say "in MongoDB we did the same with an email check".]

### What's the difference between ON CONFLICT DO NOTHING and DO UPDATE?

DO NOTHING skips the row and returns nothing. DO UPDATE changes the existing row, usually with EXCLUDED values, and returns it with RETURNING.

### What is MERGE?

A SQL-standard command that can insert, update or delete in one statement, based on matching rows from a source. PostgreSQL has had it since version 15. For a simple "insert or update" on one unique key, ON CONFLICT is shorter.

### Soft delete vs hard delete?

Soft delete sets a `deleted_at` column and keeps the row (good for history and undo). Hard delete removes it. Soft delete needs a filter in every query and a partial index for speed.

## ✅ Quick check

### 1. What does this print, if no candidate has id 999?

```sql
UPDATE candidates SET city = 'Pune' WHERE id = 999; -- change a row that doesn't exist
```

:::answer
`UPDATE 0`. It's not an error — zero rows matched. Your API should treat this as "not found".
:::

### 2. What does `EXCLUDED.experience` mean in `ON CONFLICT (email) DO UPDATE SET experience = EXCLUDED.experience`?

:::answer
The `experience` value from the row you **tried to insert**. It replaces the old value in the existing row.
:::

### 3. Why is "SELECT by email; if not found, INSERT" unsafe?

:::answer
Two requests can both run the SELECT, both see "not found", and both INSERT. That creates a duplicate (or an error). A UNIQUE constraint plus `ON CONFLICT` does it in one atomic step.
:::
