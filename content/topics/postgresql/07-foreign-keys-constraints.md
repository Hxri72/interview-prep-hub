---
title: Foreign keys and constraints
stack: postgresql
order: 7
level: Basic
mustKnow: false
askedFrequency: common
summary:
  - Constraints are rules the database checks on every insert and update. Bad rows are refused.
  - "The five main ones: NOT NULL, UNIQUE, PRIMARY KEY, CHECK and FOREIGN KEY."
  - A foreign key makes sure a link points to a row that really exists, like an application pointing to a real candidate.
  - "ON DELETE decides what happens to linked rows: CASCADE deletes them too, RESTRICT blocks the delete, SET NULL clears the link."
  - Constraints protect data even when code has bugs, or when someone edits the database by hand.
cards:
  - q: What is a foreign key?
    a: A column that must match a primary (or unique) key in another table. The database refuses values that don't exist there.
  - q: ON DELETE CASCADE vs RESTRICT?
    a: CASCADE deletes the child rows too (delete a candidate → their applications go). RESTRICT blocks the delete while children exist.
  - q: What does a CHECK constraint do?
    a: It runs a true/false test on each row, like CHECK (status IN ('applied','hired')) or CHECK (salary > 0). Rows that fail are rejected.
  - q: Does PostgreSQL index foreign key columns automatically?
    a: No. It indexes primary keys and UNIQUE columns, but not the foreign key column. Add an index yourself on things like applications.candidate_id.
  - q: Why put rules in the database and not only in app code?
    a: Every path that writes data — other services, scripts, manual fixes, buggy code — still has to obey them.
---

## 💡 What is it?

**Constraints** are **rules** that PostgreSQL checks every time a row is added or changed. If a row breaks a rule, it's **refused**.

A **[foreign key](glossary:foreign-key)** is a special rule for links. It says: "this column must point to a row that really exists in that other table". So an application can never point to a candidate who doesn't exist.

## 🏠 Real-life example

Think of a **library**.

- Every **library card** must have a member name → **NOT NULL**.
- No two members can have the **same card number** → **UNIQUE**.
- A book can be lent **only on a valid card number** that exists in the members list → **FOREIGN KEY**.
- **Borrowing days must be between 1 and 30** → **CHECK**.
- A member **can't leave the library** while they still have books out → **ON DELETE RESTRICT**.
- Or: when a member leaves, their **borrowing history is thrown away too** → **ON DELETE CASCADE**.

The librarian checks these rules at the desk. Even a careless helper can't break them.

## 🧑‍💻 Code example

Save this as `constraints.sql`. Run it with `psql -d postgres -f constraints.sql`.

```sql
CREATE TABLE candidates (id serial PRIMARY KEY, name text NOT NULL); -- parent table 1
CREATE TABLE jobs (id serial PRIMARY KEY, title text NOT NULL);      -- parent table 2

CREATE TABLE applications (                                    -- child table: links candidates and jobs
  id serial PRIMARY KEY,                                       -- its own id
  candidate_id int NOT NULL                                    -- must be filled in…
    REFERENCES candidates(id) ON DELETE CASCADE,               -- …must exist in candidates; delete candidate → delete their applications
  job_id int NOT NULL                                          -- must be filled in…
    REFERENCES jobs(id) ON DELETE RESTRICT,                    -- …must exist in jobs; a job with applications can't be deleted
  status text NOT NULL DEFAULT 'applied'                       -- 'applied' if not given
    CHECK (status IN ('applied', 'shortlisted', 'rejected', 'hired')), -- only these 4 values are allowed
  UNIQUE (candidate_id, job_id)                                -- one application per candidate per job
);                                                             -- end of the table

INSERT INTO candidates (name) VALUES ('Asha'), ('Ravi');       -- candidates 1 and 2
INSERT INTO jobs (title) VALUES ('Node.js Developer');         -- job 1
INSERT INTO applications (candidate_id, job_id) VALUES (1, 1), (2, 1); -- both apply to job 1 ✅

INSERT INTO applications (candidate_id, job_id) VALUES (99, 1);              -- ❌ candidate 99 doesn't exist
INSERT INTO applications (candidate_id, job_id) VALUES (1, 1);               -- ❌ Asha already applied to job 1
INSERT INTO applications (candidate_id, job_id, status) VALUES (2, 1, 'maybe'); -- ❌ 'maybe' isn't an allowed status
DELETE FROM jobs WHERE id = 1;                                 -- ❌ RESTRICT: job 1 still has applications
DELETE FROM candidates WHERE id = 1;                           -- ✅ CASCADE: Asha and her application are removed
SELECT * FROM applications;                                    -- only Ravi's application is left
```

**Output (what psql prints):**

```text
CREATE TABLE
CREATE TABLE
CREATE TABLE
INSERT 0 2
INSERT 0 1
INSERT 0 2
ERROR:  insert or update on table "applications" violates foreign key constraint "applications_candidate_id_fkey"
DETAIL:  Key (candidate_id)=(99) is not present in table "candidates".
ERROR:  duplicate key value violates unique constraint "applications_candidate_id_job_id_key"
DETAIL:  Key (candidate_id, job_id)=(1, 1) already exists.
ERROR:  new row for relation "applications" violates check constraint "applications_status_check"
DETAIL:  Failing row contains (5, 2, 1, maybe).
ERROR:  update or delete on table "jobs" violates RESTRICT setting of foreign key constraint "applications_job_id_fkey" on table "applications"
DETAIL:  Key (id)=(1) is referenced from table "applications".
DELETE 1
 id | candidate_id | job_id | status
----+--------------+--------+---------
  2 |            2 |      1 | applied
(1 row)
```

**What to notice:** four bad changes were stopped by the database itself. Deleting Asha also removed her application automatically (CASCADE).

## 🔍 Deeper version

**The constraint types:**

| Constraint | Rule | Example |
|---|---|---|
| `NOT NULL` | value required | `name text NOT NULL` |
| `UNIQUE` | no duplicates (NULLs allowed, by default) | `email text UNIQUE` |
| `PRIMARY KEY` | UNIQUE + NOT NULL, one per table | `id … PRIMARY KEY` |
| `CHECK` | any true/false test on the row | `CHECK (salary > 0)` |
| `FOREIGN KEY` | must match a key in another table | `REFERENCES candidates(id)` |
| `EXCLUDE` | no two rows may "overlap" (advanced) | no overlapping interview slots |

**ON DELETE / ON UPDATE options:**

| Option | When the parent row is deleted… | Good for |
|---|---|---|
| `NO ACTION` (default) / `RESTRICT` | the delete fails | data you must not lose (jobs with applicants) |
| `CASCADE` | the children are deleted too | rows that only make sense with the parent |
| `SET NULL` | the children's link becomes NULL | optional links (an "assigned recruiter") |
| `SET DEFAULT` | the link gets its default value | rare |

`RESTRICT` checks immediately. `NO ACTION` checks at the end of the statement (or transaction, if the constraint is deferred).

**Index your foreign keys.** PostgreSQL does **not** index the child column automatically. Without an index on `applications.candidate_id`, deleting a candidate scans all of applications, and joins get slow. Add: `CREATE INDEX ON applications (candidate_id);`

**Name your constraints** so errors are easy to read: `CONSTRAINT valid_status CHECK (…)`.

**Adding constraints to a big existing table.** `ALTER TABLE … ADD CONSTRAINT … NOT VALID` adds the rule for new rows only. Then `VALIDATE CONSTRAINT` checks old rows later, without a long lock.

**Constraint errors in your API.** Catch them and turn them into clean responses. In `pg`, the error has a `code`: `23505` = unique violation → **409 Conflict**; `23503` = foreign key violation → **400** or **422**; `23514` = check violation → **400**. See [status codes](topic:rest-auth/status-codes).

**MongoDB comparison.** MongoDB has no foreign keys. A deleted candidate can leave "orphan" applications, so the app must clean up. Unique indexes and schema validation exist, but links are your code's job. See [relationships](topic:mongodb/relationships).

## 🎯 Why do we use it?

- **Data stays correct, whatever writes it.** App code, admin scripts, other services and manual SQL fixes all obey the same rules.
- **No orphans.** No application pointing to a deleted candidate or job.
- **No duplicates under load.** UNIQUE holds even when two requests arrive at the same moment.
- **Less code.** Many checks you'd write in Node are one line in the table definition.

## ⚠️ Common mistakes

- **Using CASCADE everywhere.** One delete can wipe out huge amounts of related data. Use it only for true "child" rows.
- **Not indexing foreign key columns.** Deletes and joins get slow as tables grow.
- **Keeping rules only in app code.** The next script or service that writes data will skip them.
- **Showing raw constraint errors to users.** Map the error code to a clear message and the right HTTP status.

## 🗣️ How to answer in an interview

> "Constraints are rules the database enforces on every write: NOT NULL, UNIQUE, PRIMARY KEY, CHECK and FOREIGN KEY. A foreign key guarantees a reference is valid — an application can't point to a candidate that doesn't exist — and ON DELETE decides what happens to children: CASCADE deletes them, RESTRICT blocks the delete, SET NULL clears the link.
>
> I like keeping important rules in the database because they hold no matter which code path writes the data. Two practical points: PostgreSQL doesn't automatically index foreign key columns, so I add those indexes; and in the API I map constraint errors by code — a unique violation becomes a 409, for example — instead of leaking raw database messages. In MongoDB there are no foreign keys, so the same integrity has to be handled in application code."

[FILL IN: if you used PostgreSQL, a constraint that caught a real bug, or how your schema linked tables.]

## 🔁 Follow-up questions

### CASCADE or RESTRICT for "delete a job"?

Usually RESTRICT (or a soft delete). Applications are valuable history, so you don't want them disappearing because someone deleted a job by mistake.

### Can a UNIQUE column have several NULLs?

Yes, by default — NULLs are not equal to each other. PostgreSQL 15+ supports `UNIQUE NULLS NOT DISTINCT` to allow only one NULL.

### What is a deferred constraint?

A constraint checked at COMMIT instead of after each statement (`DEFERRABLE INITIALLY DEFERRED`). Useful when two rows must point to each other inside one transaction.

### How would you handle a unique violation in Node?

Catch the error, check `err.code === '23505'`, and return 409 with a clear message like "This email is already registered". Better still, use `INSERT … ON CONFLICT` when a duplicate is expected. See [INSERT, UPDATE, DELETE](topic:postgresql/insert-update-delete).

## ✅ Quick check

### 1. Candidate 1 has two applications with `ON DELETE CASCADE`. What happens on `DELETE FROM candidates WHERE id = 1;`?

:::answer
The candidate **and both of their applications** are deleted. psql prints `DELETE 1` (it counts only the candidate row).
:::

### 2. Which constraint stops a candidate from applying to the same job twice?

:::answer
`UNIQUE (candidate_id, job_id)` — a unique constraint on the pair of columns.
:::

### 3. True or false: `REFERENCES candidates(id)` creates an index on `applications.candidate_id`.

:::answer
**False.** It only creates the rule. Add `CREATE INDEX ON applications (candidate_id);` yourself.
:::
