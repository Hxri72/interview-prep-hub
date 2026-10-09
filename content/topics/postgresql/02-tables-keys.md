---
title: Tables, rows, columns and primary keys
stack: postgresql
order: 2
level: Basic
mustKnow: false
askedFrequency: common
summary:
  - A table is like one sheet. A row is one item, and a column is one detail with a fixed type.
  - A primary key is the column that uniquely identifies each row. It must be unique and can never be empty.
  - "Modern PostgreSQL makes ids with GENERATED ALWAYS AS IDENTITY (the older way is serial)."
  - Natural keys (like email) can change, so most tables use a surrogate key (a number or UUID) plus a UNIQUE constraint on email.
  - Generated ids can have gaps. A failed insert still uses up a number, and that is normal.
cards:
  - q: What is a primary key?
    a: The column (or columns) that uniquely identifies each row. PostgreSQL makes it UNIQUE and NOT NULL, and builds an index on it.
  - q: Natural key vs surrogate key?
    a: A natural key comes from real data, like an email. A surrogate key is a made-up id, like 1, 2, 3 or a UUID. Surrogate keys never need to change, so they're the usual choice.
  - q: serial vs GENERATED ALWAYS AS IDENTITY?
    a: Both auto-number rows. IDENTITY is the SQL-standard way and blocks accidental manual ids. serial is the older PostgreSQL shortcut.
  - q: Why are there gaps in my id numbers?
    a: Ids come from a sequence. A number is used even if the insert later fails or is rolled back, and it is never given back. Gaps are normal.
  - q: Can a table have two primary keys?
    a: No, only one. But one primary key can be made of several columns (a composite key). Other unique columns use UNIQUE constraints.
---

## 💡 What is it?

A **table** is like one sheet in a spreadsheet. Each **row** is one item, like one recruiter. Each **column** is one detail, like the email, and has a fixed type.

A **[primary key](glossary:primary-key)** is the column that **uniquely identifies** each row. No two rows can share it, and it can never be empty.

## 🏠 Real-life example

Think of your **school's admission register**.

Every student gets an **admission number** on day one. Names can repeat — there may be two students called "Rahul". But admission number 1042 belongs to only one student, forever.

- The **register** = the table.
- One **line per student** = a row.
- The **headings** (name, class, phone) = columns.
- The **admission number** = the primary key.
- **"Every student must have one"** = NOT NULL.
- **"No two students share one"** = UNIQUE.

If a student changes their phone number or even their name, the admission number stays the same. That's why the school uses it to link everything else.

## 🧑‍💻 Code example

Save this as `keys.sql`. Run it with `psql -d postgres -f keys.sql`. (No PostgreSQL? See the Docker command in [What a relational database is](topic:postgresql/what-is-relational).)

```sql
CREATE TABLE recruiters (                                -- a new table for recruiters
  id    integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY, -- 1, 2, 3… made by the database; the primary key
  email text UNIQUE NOT NULL,                             -- UNIQUE = no two recruiters share an email
  name  text NOT NULL                                     -- NOT NULL = a name is required
);                                                        -- end of the table

INSERT INTO recruiters (email, name) VALUES               -- add two recruiters (no id given)
  ('meena@acme.com', 'Meena'),                            -- gets id 1
  ('arun@acme.com', 'Arun');                              -- gets id 2
SELECT * FROM recruiters;                                 -- show every column of every row

INSERT INTO recruiters (email, name) VALUES ('meena@acme.com', 'Meena Again'); -- ❌ same email again
INSERT INTO recruiters (id, email, name) VALUES (5, 'x@acme.com', 'X');        -- ❌ we try to choose the id ourselves
INSERT INTO recruiters (email) VALUES ('y@acme.com');                          -- ❌ name is missing
```

**Output (what psql prints):**

```text
CREATE TABLE
INSERT 0 2
 id |     email      | name
----+----------------+-------
  1 | meena@acme.com | Meena
  2 | arun@acme.com  | Arun
(2 rows)

ERROR:  duplicate key value violates unique constraint "recruiters_email_key"
DETAIL:  Key (email)=(meena@acme.com) already exists.
ERROR:  cannot insert a non-DEFAULT value into column "id"
DETAIL:  Column "id" is an identity column defined as GENERATED ALWAYS.
ERROR:  null value in column "name" of relation "recruiters" violates not-null constraint
DETAIL:  Failing row contains (4, y@acme.com, null).
```

(Real psql also prints a `LINE 1:` hint with a `^` under each error.)

**What to notice:**
- The database **refused** all three bad inserts. Your app didn't need any extra checks.
- Look at the last line: the failing row got **id 4**, not 3. The duplicate-email insert already used up number 3. Gaps like this are normal.

## 🔍 Deeper version

**What a primary key really is.** `PRIMARY KEY` = `UNIQUE` + `NOT NULL` + an automatic **B-tree [index](glossary:index)**. Lookups by id are fast because of that index. A table can have only one primary key, but it can span several columns (a **composite key**), like `(candidate_id, job_id)`.

**How ids are made.** Both `serial` and `IDENTITY` use a hidden **sequence** — a counter object.

| | `serial` | `GENERATED ALWAYS AS IDENTITY` |
|---|---|---|
| Standard | PostgreSQL-only shortcut | SQL standard |
| Manual ids | silently allowed | blocked (needs `OVERRIDING SYSTEM VALUE`) |
| Recommended today | older code | ✅ new tables |

`GENERATED BY DEFAULT AS IDENTITY` is the relaxed version. It allows manual ids when you really need them, like data migrations.

**Why gaps happen.** A sequence hands out numbers without waiting for your transaction to finish. If the insert fails or rolls back, the number is not returned. So never use ids to count rows or to mean "the 4th customer".

**Natural vs surrogate keys.**

| | Natural key (email, phone) | Surrogate key (1, 2, 3 or UUID) |
|---|---|---|
| Comes from | real-world data | the database |
| Can it change? | yes — people change emails | never |
| Size | often long text | small number or 16-byte UUID |
| Typical use | add a `UNIQUE` constraint | the primary key |

**Integer vs UUID ids.** `bigint` identity ids are small and fast, but guessable (`/candidates/41`, `/candidates/42`). **UUIDs** (`gen_random_uuid()`) are hard to guess and can be made by any server, but they're bigger. Random UUIDs spread inserts across the index; time-ordered **UUIDv7** keeps them in order.

:::version[Version note]
`gen_random_uuid()` is built into PostgreSQL 13 and later. **PostgreSQL 18** added `uuidv7()`, which makes time-ordered UUIDs that are friendlier to indexes.
:::

**MongoDB comparison.** MongoDB gives every document an `_id` automatically — an [ObjectId](glossary:objectid) by default. See [BSON, _id and ObjectId](topic:mongodb/bson-objectid).

## 🎯 Why do we use it?

- **To find one row fast and for sure.** "Update recruiter 2" can never touch the wrong row.
- **To link tables.** Other tables store this key to point here (a [foreign key](topic:postgresql/foreign-keys-constraints)).
- **To stop duplicates.** UNIQUE on email stops two accounts with the same email, even if two requests arrive at the same moment.
- **To keep the shape fixed.** Column types and NOT NULL mean every row looks the same, so your code can trust it.

## ⚠️ Common mistakes

- **Using email or phone as the primary key.** When a user changes their email, every linked row must change too.
- **Checking for duplicates only in app code** (`SELECT` first, then `INSERT`). Two requests at once can both pass. A UNIQUE constraint is the real guard.
- **Worrying about gaps in ids.** They're normal. Don't "fix" them.
- **Exposing guessable integer ids in public URLs** without checking permissions. Always check that the user may see that row.

## 🗣️ How to answer in an interview

> "A table stores one kind of entity: each row is one item and each column is one typed attribute. The primary key uniquely identifies a row — PostgreSQL makes it unique, not null, and indexes it automatically.
>
> For new tables I use a surrogate key — `bigint GENERATED ALWAYS AS IDENTITY`, or a UUID when ids shouldn't be guessable or are created outside the database — and I put a UNIQUE constraint on natural keys like email. I don't use email as the primary key because it can change. I also rely on the database's UNIQUE constraint for duplicates, not just an app-level check, because two requests at the same time can both pass an app check."

[FILL IN: if you used PostgreSQL, which id type your tables used.]

## 🔁 Follow-up questions

### What is a composite primary key? When would you use one?

A primary key made of two or more columns, like `PRIMARY KEY (candidate_id, job_id)` in a join table. It guarantees one row per pair. Many teams still add a simple `id` column and put a UNIQUE constraint on the pair instead.

### UNIQUE vs PRIMARY KEY?

Both stop duplicates. A primary key also forbids NULL, and there is only one per table. You can have many UNIQUE constraints, and a UNIQUE column may hold NULLs.

### Why not just use auto-increment ids everywhere?

They're great inside the database, but they leak information ("we have about 42 candidates") and are guessable in URLs. For public ids, UUIDs or a separate random public id are common.

### Can you insert your own id into an identity column?

With `GENERATED ALWAYS`, only with `OVERRIDING SYSTEM VALUE`. With `GENERATED BY DEFAULT`, yes. After loading old data with manual ids, reset the sequence so new ids don't clash.

## ✅ Quick check

### 1. What happens here?

```sql
CREATE TABLE tags (name text PRIMARY KEY);  -- name is the primary key
INSERT INTO tags VALUES ('node');           -- first insert
INSERT INTO tags VALUES ('node');           -- second insert
```

:::answer
The first insert works. The second fails with `duplicate key value violates unique constraint "tags_pkey"`, because a primary key must be unique.
:::

### 2. True or false: if ids jump from 3 to 5, a row was deleted.

:::answer
**False.** Maybe a row was deleted, but gaps also come from failed or rolled-back inserts. The sequence never gives a number back.
:::

### 3. Which is the better primary key for a `candidates` table?

- A) `email`
- B) `id bigint GENERATED ALWAYS AS IDENTITY`, with `email UNIQUE`

:::answer
**B.** The id never changes, it is small and fast to join, and UNIQUE still stops duplicate emails.
:::
