---
title: PostgreSQL data types
stack: postgresql
order: 3
level: Basic
mustKnow: false
askedFrequency: common
summary:
  - Every column has one type. PostgreSQL rejects values that don't fit, so bad data can't get in.
  - "Everyday types: text, integer/bigint, numeric(p,s) for money, boolean, date, timestamptz, uuid, jsonb, arrays."
  - "Use numeric (not float) for money: 0.1 + 0.2 is exactly 0.3 in numeric, but 0.30000000000000004 in float."
  - Use timestamptz for moments in time. It stores UTC and shows time in the session's time zone.
  - In PostgreSQL, text and varchar perform the same. Use varchar(n) only when you really want a length limit.
cards:
  - q: Which type should you use for money?
    a: numeric(p, s), for example numeric(10,2). It is exact. float/double can give rounding errors like 0.30000000000000004.
  - q: timestamp vs timestamptz?
    a: timestamptz stores an exact moment (saved as UTC) and converts to your time zone when shown. timestamp has no time zone and can be ambiguous. Prefer timestamptz.
  - q: text vs varchar(n) in PostgreSQL?
    a: Same speed and storage. varchar(n) just adds a length check. Many teams use text plus a CHECK, or varchar(n) where a limit is a real rule.
  - q: json vs jsonb?
    a: jsonb stores parsed binary JSON. It is faster to query and can be indexed, but it drops duplicate keys and key order. Use jsonb almost always.
  - q: What happens if you insert 'two' into an integer column?
    a: "PostgreSQL rejects it: invalid input syntax for type integer: \"two\". The row is not saved."
---

## 💡 What is it?

Every column in PostgreSQL has a **type**. The type says what kind of value is allowed: text, whole numbers, money, true/false, dates, and more.

If a value doesn't fit the type, PostgreSQL **refuses it**. So a column of numbers can never contain the word "two".

## 🏠 Real-life example

Think of an **exam answer sheet** with boxes.

- The **roll number box** only takes digits.
- The **date of birth box** has DD / MM / YYYY spaces.
- The **"Do you need a bus pass? Yes / No"** box takes only a tick.
- The **address box** takes any words.

If a student writes "twelve" in the roll number box, the teacher rejects the sheet.

- Each **box** = a column.
- The **kind of box** (digits, date, tick, words) = the data type.
- The **teacher rejecting the sheet** = PostgreSQL refusing a wrong value.

## 🧑‍💻 Code example

Save this as `types.sql`. Run it with `psql -d postgres -f types.sql`.

```sql
CREATE TABLE jobs (                                     -- a jobs table with many types
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(), -- uuid = a random 128-bit id, made automatically
  title      varchar(100) NOT NULL,                     -- text with a 100-character limit
  openings   integer NOT NULL,                          -- a whole number (up to about 2.1 billion)
  salary     numeric(10,2),                             -- exact decimal: 10 digits in total, 2 after the point
  is_remote  boolean DEFAULT false,                     -- true / false; false if not given
  skills     text[],                                    -- an array (list) of text values
  extra      jsonb,                                     -- JSON data, stored in a fast binary form
  closes_on  date,                                      -- a calendar date with no time
  created_at timestamptz DEFAULT now()                  -- a moment in time with time zone; now() = this moment
);                                                      -- end of the table

INSERT INTO jobs (title, openings, salary, is_remote, skills, extra, closes_on) VALUES ( -- one job
  'Node.js Developer', 2, 1200000.50, true,             -- title, openings, salary, remote
  ARRAY['node','mongodb'], '{"level": "mid"}', '2026-11-30' -- skills list, JSON, date
);                                                      -- end of the insert
SELECT title, openings, salary, is_remote, skills, extra, closes_on FROM jobs; -- show the stored values

SELECT extra->>'level' AS level,                        -- ->> reads a JSON field as text
       'node' = ANY(skills) AS needs_node,              -- is 'node' inside the skills array?
       pg_typeof(salary) AS salary_type                 -- ask PostgreSQL which type salary has
FROM jobs;                                              -- from the jobs table

INSERT INTO jobs (title, openings) VALUES ('React Developer', 'two'); -- ❌ text into an integer column

SELECT 0.1 + 0.2 AS numeric_sum,                        -- decimals are numeric by default → exact
       0.1::float8 + 0.2::float8 AS float_sum;          -- ::float8 turns them into floating point → rounding error
```

**Output (what psql prints):**

```text
CREATE TABLE
INSERT 0 1
       title       | openings |   salary   | is_remote |     skills     |      extra       | closes_on
-------------------+----------+------------+-----------+----------------+------------------+------------
 Node.js Developer |        2 | 1200000.50 | t         | {node,mongodb} | {"level": "mid"} | 2026-11-30
(1 row)

 level | needs_node | salary_type
-------+------------+-------------
 mid   | t          | numeric
(1 row)

ERROR:  invalid input syntax for type integer: "two"
 numeric_sum |      float_sum
-------------+---------------------
         0.3 | 0.30000000000000004
(1 row)
```

**What to notice:**
- psql shows booleans as `t` / `f` and arrays as `{node,mongodb}`.
- The bad insert was **rejected**. Nothing was saved.
- `numeric` gave exactly `0.3`. `float8` gave `0.30000000000000004`. That's why money uses numeric.

## 🔍 Deeper version

**The types you'll use most:**

| Need | Type | Notes |
|---|---|---|
| Short or long text | `text` | no length limit; same speed as varchar |
| Text with a hard limit | `varchar(n)` | adds a length check only |
| Whole numbers | `integer` (4 bytes), `bigint` (8 bytes) | use `bigint` for ids that may grow huge |
| Money, exact decimals | `numeric(p, s)` | exact, but slower than integers |
| Scientific numbers | `double precision` (`float8`) | fast, but not exact |
| Yes / no | `boolean` | `true`, `false` or NULL |
| A day | `date` | no time part |
| A moment | `timestamptz` | stored as UTC, shown in the session time zone |
| Ids | `uuid`, `bigint` identity | see [tables and keys](topic:postgresql/tables-keys) |
| Flexible fields | `jsonb` | can be indexed with GIN; see [JSONB](topic:postgresql/jsonb) |
| Lists | `text[]`, `int[]` | handy, but a separate table is better if you join on it |
| A fixed set of values | `text` + `CHECK`, or `CREATE TYPE … AS ENUM` | |

**Money tip.** Many payment systems store money as **integer minor units** (paise or cents), like `120000050` for ₹12,00,000.50. Stripe's API works this way. Integers are exact and fast. `numeric(12,2)` is also fine.

**Time zones.** `timestamptz` does **not** store the time zone. It converts the input to UTC, then shows it in the session's `TimeZone` setting. Store UTC, and convert to the user's zone when you display it.

**Casting.** `'42'::int` changes a value's type. A cast fails loudly if the value can't be converted, just like the insert above.

**Fewer surprises than MongoDB.** In MongoDB, one field can hold a string in one document and a number in another (unless you add validation). PostgreSQL stops that at the column level. Compare with [Mongoose schema types](topic:mongodb/schema-validation).

:::version[Version note]
`gen_random_uuid()` is built in from PostgreSQL 13. PostgreSQL 18 added `uuidv7()` for time-ordered UUIDs.
:::

## 🎯 Why do we use it?

- **Bad data can't get in.** A typo like "two" is caught at insert time, not weeks later in a report.
- **Correct maths.** `numeric` keeps money exact. Date types make "jobs closing this week" easy and correct.
- **Speed and space.** An `integer` takes 4 bytes. Storing the same number as text takes more space and sorts wrongly ("10" comes before "9").
- **Better indexes and queries.** Typed columns let PostgreSQL compare, sort and index correctly.

## ⚠️ Common mistakes

- **Using `float` for money.** Rounding errors appear in totals.
- **Using `timestamp` (without time zone)** for events. Times become ambiguous when servers or users are in different zones.
- **Storing numbers or dates as text.** Sorting breaks ("10" < "9") and range filters get slow and wrong.
- **Putting everything into one `jsonb` column.** You lose types, constraints and simple joins. Use jsonb for truly flexible parts only.

## 🗣️ How to answer in an interview

> "Every PostgreSQL column has a type, and the database rejects values that don't fit — for example, inserting 'two' into an integer column fails. The types I use most are text, integer and bigint, numeric for money, boolean, date, timestamptz, uuid and jsonb.
>
> Two choices I'm careful about: money goes in numeric, or integer minor units like paise, never float, because float has rounding errors — 0.1 plus 0.2 isn't exactly 0.3. And timestamps go in timestamptz, which stores UTC and converts for display, so there's no time-zone confusion. I use jsonb for genuinely flexible fields, but I keep core fields as real typed columns so constraints and indexes still work."

[FILL IN: if you used PostgreSQL, which types mattered in your tables, e.g. how money or dates were stored.]

## 🔁 Follow-up questions

### Why is `text` vs `varchar(255)` not a performance question in PostgreSQL?

PostgreSQL stores both the same way. `varchar(n)` only adds a length check. The `255` habit comes from other databases.

### How would you store a fixed set of statuses like applied / shortlisted / rejected?

Use `text` with a `CHECK (status IN (...))` constraint, or a PostgreSQL `ENUM` type. CHECK is easier to change later; an ENUM is stricter but needs `ALTER TYPE` to add values.

### When is jsonb a good choice?

For data whose shape varies, like custom form answers or third-party API payloads (an ATS webhook body). Keep fields you filter and join on as normal columns.

### What does `numeric(10,2)` mean?

Up to 10 digits in total, with 2 after the decimal point. So the biggest value is 99,999,999.99.

## ✅ Quick check

### 1. What does this return?

```sql
SELECT 0.1::float8 + 0.2::float8 = 0.3::float8 AS equal; -- compare floats exactly
```

:::answer
`f` (false). In floating point, 0.1 + 0.2 is 0.30000000000000004, which is not exactly 0.3. With `numeric`, the answer would be `t`.
:::

### 2. Which type is best for "the exact moment a candidate applied"?

- A) `date`
- B) `timestamp`
- C) `timestamptz`

:::answer
**C) `timestamptz`.** It records the exact moment in UTC and shows it correctly in any time zone. `date` loses the time, and `timestamp` loses the zone.
:::
