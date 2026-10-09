---
title: JSONB in PostgreSQL
stack: postgresql
order: 23
level: Advanced
mustKnow: false
askedFrequency: sometimes
summary:
  - JSONB is a column type that stores JSON in a binary form you can search and index. It gives PostgreSQL some of MongoDB's flexibility.
  - "-> returns JSON, ->> returns text, #>> follows a path into nested objects."
  - "@> means 'contains this JSON piece', and ? means 'has this key or array string'."
  - A GIN index on the jsonb column speeds up @> searches. Searching one field with ->> needs its own expression index.
  - Keep fixed, important fields as real columns. Use JSONB for flexible or optional extras.
cards:
  - q: What is the difference between json and jsonb?
    a: json stores the exact text (spaces, duplicate keys, key order). jsonb stores a parsed binary form, so it's faster to query and can be indexed. Duplicate keys keep only the last value.
  - q: What is the difference between -> and ->>?
    a: "-> returns the value as jsonb (so you can keep going deeper). ->> returns it as plain text, ready to compare with a string."
  - q: What does @> do?
    a: "Containment: profile @> '{\"city\": \"Kochi\"}' is true when the profile contains that key and value. It can use a GIN index."
  - q: Which index helps JSONB searches?
    a: "A GIN index on the column helps @>, ? and ?| / ?& on top-level keys. For one field compared with ->> = 'value', create a B-tree expression index on (profile ->> 'field')."
  - q: When should you NOT put data in JSONB?
    a: When the field is always present, used in joins, needs a foreign key or a strict type, or is filtered on all the time. Make it a normal column.
---

## 💡 What is it?

**JSONB** is a PostgreSQL column type that stores **JSON data**: objects, arrays, nested values.

The "B" means **binary**. Postgres parses the JSON once and stores it in a form that is fast to search. You can query inside it and even index it.

So one table can have **fixed columns** (like `name`) and a **flexible JSONB column** (like `profile`) for data that changes shape from row to row.

## 🏠 Real-life example

Think of a **student file in the school office**.

The front of the file has **printed boxes**: name, class, roll number. Every student has these.

Inside the file is a **plastic pocket** where the teacher can drop any extra papers: a medical note, a sports certificate, a parent's letter. Each student's pocket has different papers.

- **The printed boxes** = normal columns (`name`, `class`).
- **The plastic pocket** = the `jsonb` column.
- **Looking inside the pocket for a sports certificate** = `profile @> '{"sports": true}'`.
- **A label list of what's inside every pocket**, kept at the office desk = a **GIN index**. You don't have to open every file.

## 🧑‍💻 Code example

Run this in any PostgreSQL: `psql -d mydb -f jsonb.sql`.

```sql
CREATE TABLE candidates (                       -- candidates with a flexible profile
  id      serial PRIMARY KEY,                   -- 1, 2, 3...
  name    text NOT NULL,                        -- normal column for fixed data
  profile jsonb NOT NULL DEFAULT '{}'           -- flexible JSON data, stored in binary form
);                                              -- end of table
INSERT INTO candidates (name, profile) VALUES   -- 3 candidates with different shapes of data
  ('Meena', '{"city": "Kochi", "skills": ["node", "react"], "notice": {"days": 30}}'),  -- nested object
  ('Ravi',  '{"city": "Pune",  "skills": ["java"]}'),                                  -- no notice field
  ('Sara',  '{"city": "Kochi", "skills": ["node", "go"], "remote": true}');            -- extra field

SELECT name,                                    -- the name column
  profile ->> 'city' AS city,                   -- ->> gives a field as TEXT
  profile -> 'skills' AS skills,                -- -> gives a field as JSONB (keeps the array)
  profile #>> '{notice,days}' AS notice_days    -- #>> follows a path into nested objects
FROM candidates ORDER BY id;                    -- every candidate

SELECT name FROM candidates                     -- who knows node?
WHERE profile -> 'skills' ? 'node'              -- ? = does this array contain the string 'node'
ORDER BY id;                                    -- tidy order

SELECT name FROM candidates                     -- who is in Kochi?
WHERE profile @> '{"city": "Kochi"}'            -- @> = contains this JSON piece (can use a GIN index)
ORDER BY id;                                    -- tidy order

UPDATE candidates                               -- change one field inside the JSON
SET profile = jsonb_set(profile, '{city}', '"Chennai"')  -- set city to "Chennai" (a JSON string)
WHERE name = 'Ravi';                            -- only Ravi
SELECT name, profile FROM candidates WHERE name = 'Ravi';  -- check Ravi's new profile
```

**Output** (real run on PostgreSQL 18.4):

```text
CREATE TABLE
INSERT 0 3
 name  | city  | skills            | notice_days
-------+-------+-------------------+-------------
 Meena | Kochi | ["node", "react"] | 30
 Ravi  | Pune  | ["java"]          |
 Sara  | Kochi | ["node", "go"]    |
(3 rows)

 name
-------
 Meena
 Sara
(2 rows)

 name
-------
 Meena
 Sara
(2 rows)

UPDATE 1
 name | profile
------+-----------------------------------------
 Ravi | {"city": "Chennai", "skills": ["java"]}
(1 row)
```

**What to notice:**
- Ravi has no `notice` field, so `notice_days` is simply empty (NULL). No error.
- `notice_days` shows `30` as **text**, because `#>>` and `->>` always return text. Cast it if you need a number: `(profile #>> '{notice,days}')::int`.
- `jsonb_set` changed just one field. The new value must be valid JSON, so the string is written as `'"Chennai"'` (quotes inside quotes).

## 🔍 Deeper version

**The main operators:**

| Operator | Meaning | Example | Returns |
|---|---|---|---|
| `->` | get field / array item | `profile -> 'skills'` | jsonb |
| `->>` | get field as text | `profile ->> 'city'` | text |
| `#>` / `#>>` | follow a path | `profile #>> '{notice,days}'` | jsonb / text |
| `@>` | contains | `profile @> '{"city":"Kochi"}'` | boolean |
| `?` | has key / array string | `profile ? 'remote'` | boolean |
| `?|` / `?&` | has any / all of these keys | `profile ?| array['remote','notice']` | boolean |
| `||` | merge two objects | `profile || '{"remote": false}'` | jsonb |
| `-` | remove a key | `profile - 'remote'` | jsonb |

**Indexing: what works and what doesn't.** We loaded 20,000 candidates and created `CREATE INDEX idx_profile ON candidates USING GIN (profile);`. Real `EXPLAIN` results:

```text
WHERE profile @> '{"skills": ["node"]}'   →  Bitmap Index Scan on idx_profile   ✅ uses the GIN index
WHERE profile -> 'skills' ? 'node'        →  Seq Scan                           ❌ reads every row
WHERE profile ->> 'city' = 'Goa'          →  Seq Scan                           ❌ reads every row
```

- The GIN index helps **`@>`** on the whole column, plus `?`, `?|` and `?&` on **top-level** keys.
- `profile -> 'skills' ? 'node'` works on an extracted piece, not the indexed column, so it can't use that index. Rewrite it as `profile @> '{"skills": ["node"]}'`, which gives the same answer and uses the index.
- For `profile ->> 'city' = 'Goa'`, add a normal **expression index**: `CREATE INDEX ON candidates ((profile ->> 'city'));`.
- `jsonb_path_ops` is a smaller, faster GIN variant that supports `@>` only: `USING GIN (profile jsonb_path_ops)`.

**json vs jsonb.** Real result of the same text stored both ways:

```text
 as_json               | as_jsonb
-----------------------+------------------
 {"a":1,"a":2, "b": 3} | {"a": 2, "b": 3}
```

`json` keeps the exact text, including the duplicate key. `jsonb` keeps only the **last** duplicate, and normalises spacing and key order. Use `jsonb` almost always.

**JSONB vs MongoDB.** JSONB gives you flexible documents **inside** a relational database, with transactions and joins to normal tables. MongoDB is built entirely around documents, with richer document updates and easier horizontal scaling. JSONB is great for "mostly relational + some flexible fields". Compare [Embedding vs referencing](topic:mongodb/embedding-vs-referencing).

**SQL/JSON.** Postgres also supports SQL/JSON path queries (`jsonb_path_query`, `@?`, `@@`), and newer versions add standard functions like `JSON_VALUE` and `JSON_TABLE`. These are useful for complex filters.

## 🎯 Why do we use it?

- **Data that changes shape.** For example, parsed resume details, ATS-specific extra fields, or user settings.
- **Storing API payloads**, like a webhook body, exactly as received, for audits or replays.
- **Avoiding dozens of nullable columns** for optional extras.
- **Still one database**, with transactions and joins to your normal tables.

## ⚠️ Common mistakes

- **Putting everything in JSONB.** You lose types, foreign keys and simple constraints. Keep core fields (ids, emails, statuses) as real columns.
- **Comparing `->` with a string.** `profile -> 'city' = 'Kochi'` compares jsonb to text and errors. Use `->>` for text comparisons.
- **Forgetting that `->>` returns text.** `'10' > '9'` is false as text. Cast first: `(profile ->> 'years')::int > 9`.
- **Expecting a GIN index to help every query.** It helps `@>` and key checks, not `->> 'field' = 'x'`. Check with `EXPLAIN`.

## 🗣️ How to answer in an interview

> "JSONB stores JSON in a parsed binary form, so Postgres can search and index inside it. I use -> to get a value as JSON, ->> to get it as text, and @> to check if a document contains a piece of JSON.
>
> For performance, a GIN index on the jsonb column speeds up @> and top-level key checks. If I filter on one field with ->>, like the city, I add a B-tree expression index on that expression, because the GIN index won't be used there. I always confirm with EXPLAIN.
>
> My rule is: core fields that are always present, joined or constrained stay as real columns, and only flexible or optional extras go into JSONB. Compared with MongoDB, JSONB gives some document flexibility while keeping transactions and joins."

[FILL IN: where you used PostgreSQL, and whether you stored any JSON in it.]

## 🔁 Follow-up questions

### When would you choose JSONB in Postgres over MongoDB?

When most of the data is relational (needs joins, foreign keys and transactions across tables), and only some fields are flexible. If almost everything is document-shaped and you need easy horizontal scaling, MongoDB may fit better.

### How do you update one nested field?

Use `jsonb_set(profile, '{notice,days}', '45')`. Each update still writes a new version of the whole row, so very large documents make updates more expensive.

### How do you index a field inside JSONB for equality searches?

Create an expression index: `CREATE INDEX ON candidates ((profile ->> 'city'));`. The query must use exactly the same expression to use it.

### Can you add constraints on JSONB?

Yes, with `CHECK` constraints, for example `CHECK (profile ? 'city')` or `CHECK (jsonb_typeof(profile -> 'skills') = 'array')`.

## ✅ Quick check

### 1. What type does `profile ->> 'city'` return?

- A) jsonb
- B) text
- C) boolean

:::answer
**B) text.** `->` returns jsonb, `->>` returns text.
:::

### 2. You have a GIN index on `profile`. Which query can use it?

- A) `WHERE profile ->> 'city' = 'Kochi'`
- B) `WHERE profile @> '{"city": "Kochi"}'`

:::answer
**B.** `@>` on the whole column can use the GIN index. A needs a separate expression index on `(profile ->> 'city')`. In our real test, A did a full Seq Scan.
:::

### 3. What does this return?

```sql
SELECT '{"a": 1, "a": 2}'::jsonb;   -- a duplicate key
```

:::answer
`{"a": 2}`. jsonb keeps only the last value for a duplicate key. (Plain `json` would keep the text exactly as written.)
:::
