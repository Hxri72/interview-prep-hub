---
title: "Normalisation: 1NF, 2NF, 3NF"
stack: postgresql
order: 13
level: Intermediate
mustKnow: true
askedFrequency: very common
summary:
  - Normalisation means splitting data into tables so each fact is stored only once.
  - "1NF: one value per cell and no repeating groups (skills go in their own rows, not 'Node, React' in one cell)."
  - "2NF: every column depends on the whole key, not just part of a composite key."
  - "3NF: no column depends on another non-key column (company name belongs in companies, not copied into every job row)."
  - It prevents update, insert and delete anomalies. You join the tables back together when you read.
cards:
  - q: What is normalisation?
    a: Organising tables so each fact is stored in one place only. This avoids duplicated data that can get out of sync.
  - q: What is 1NF?
    a: First normal form. Each cell holds one single value, there are no repeating groups like skill1, skill2, skill3, and each row is unique (has a key).
  - q: What is 2NF?
    a: In 1NF, and every non-key column depends on the WHOLE primary key. It matters for composite keys — a column that depends on only part of the key must move to another table.
  - q: What is 3NF?
    a: "In 2NF, and no non-key column depends on another non-key column. Example: jobs has company_id; the company's name and city live in the companies table, not in jobs."
  - q: What are update anomalies?
    a: Problems from duplicated data. Update anomaly - you change a value in one copy but not the others. Insert anomaly - you can't store a fact without unrelated data. Delete anomaly - deleting a row loses another fact by accident.
---

## 💡 What is it?

**Normalisation** means arranging your tables so that **each fact is stored only once**.

Instead of one big table that repeats the same details again and again, you split it into smaller tables. Then you link them with ids, called [foreign keys](glossary:foreign-key).

There are steps, called **normal forms**: **1NF**, **2NF** and **3NF**. Most real apps aim for **3NF**.

## 🏠 Real-life example

Think of a **school office that writes the principal's phone number on every student's form**.

When the principal gets a new phone, the office must fix **hundreds of forms**. If they miss one, the forms disagree.

- Writing the **phone on every form** = a messy, not-normalised table.
- Keeping **one "school contacts" sheet**, and writing just "see contacts" on each form = normalisation.
- Fixing the phone **in one place** = updating one row.
- A form that lists **"Maths, Science, Art"** in one box = breaks 1NF. Each subject should get its own line.

## 🧑‍💻 Code example

Run this in `psql` or any PostgreSQL tool.

```sql
CREATE TABLE messy (                                         -- BEFORE: one big table (not normalised)
  candidate TEXT, email TEXT,                                -- candidate details
  job TEXT, company TEXT,                                    -- job details, repeated on every row
  skills TEXT                                                -- many values in one cell: 'Node, React'
);                                                           -- end of the messy table
INSERT INTO messy VALUES                                     -- the same facts are copied again and again
  ('Asha','asha@mail.com','Node Developer','Acme','Node, React'), -- Asha's first application
  ('Asha','asha@mail.com','Tech Lead','Acme','Node, React');      -- Asha's details copied again

CREATE TABLE candidates (id INT PRIMARY KEY, name TEXT, email TEXT UNIQUE); -- AFTER: each fact stored once
CREATE TABLE candidate_skills (candidate_id INT REFERENCES candidates(id), skill TEXT); -- 1NF: one skill per row
CREATE TABLE companies (id INT PRIMARY KEY, name TEXT);      -- company stored once
CREATE TABLE jobs (id INT PRIMARY KEY, title TEXT, company_id INT REFERENCES companies(id)); -- 3NF: company via id
CREATE TABLE applications (candidate_id INT REFERENCES candidates(id), job_id INT REFERENCES jobs(id)); -- just the link
INSERT INTO candidates VALUES (1,'Asha','asha@mail.com');    -- Asha appears ONE time
INSERT INTO candidate_skills VALUES (1,'Node'),(1,'React');  -- two skills, two rows
INSERT INTO companies VALUES (100,'Acme');                   -- Acme appears ONE time
INSERT INTO jobs VALUES (10,'Node Developer',100),(20,'Tech Lead',100); -- both jobs point to Acme
INSERT INTO applications VALUES (1,10),(1,20);               -- Asha applied twice

UPDATE candidates SET email = 'asha@new.com' WHERE id = 1;   -- change the email in ONE place only

SELECT c.name, c.email, j.title, co.name AS company          -- join the tables back together to read
FROM applications a                                          -- start from the links
JOIN candidates c ON c.id = a.candidate_id                   -- add the candidate
JOIN jobs j ON j.id = a.job_id                               -- add the job
JOIN companies co ON co.id = j.company_id                    -- add the company
ORDER BY j.id;                                               -- stable order
```

**Output** (real run on PostgreSQL 18):

```text
 name | email        | title          | company
------+--------------+----------------+---------
 Asha | asha@new.com | Node Developer | Acme
 Asha | asha@new.com | Tech Lead      | Acme
(2 rows)
```

One `UPDATE` changed the email everywhere, because it is stored **once**. In the `messy` table you would have to update every copy.

## 🔍 Deeper version

**The three normal forms, simply:**

| Form | Rule | Breaks it | Fix |
|---|---|---|---|
| **1NF** | One value per cell; no repeating groups; rows have a key | `skills = 'Node, React'`, or columns `skill1, skill2, skill3` | A `candidate_skills` table, one skill per row |
| **2NF** | 1NF + every non-key column depends on the **whole** key | In `applications(candidate_id, job_id, job_title)`, `job_title` depends only on `job_id` | Move `job_title` to `jobs` |
| **3NF** | 2NF + no column depends on another **non-key** column | `jobs(id, title, company_id, company_name)` — `company_name` depends on `company_id` | Move `company_name` to `companies` |

A short way to remember 3NF: every non-key column depends on **"the key, the whole key, and nothing but the key"**.

**2NF only matters for composite keys.** If a table's primary key is one column (like `id`), a column can't depend on "part" of it. So a 1NF table with a single-column key is already in 2NF.

**The three anomalies normalisation prevents:**
- **Update anomaly:** Asha's email is in 50 rows. You fix 49. Now the data disagrees.
- **Insert anomaly:** you can't add a new company until it has a job, because company data only lives in job rows.
- **Delete anomaly:** you delete the last job of a company and accidentally lose the company's details.

**Beyond 3NF.** BCNF (Boyce–Codd) is a slightly stricter 3NF. 4NF and 5NF deal with rarer cases. In interviews, 1NF–3NF plus "and BCNF is a stricter 3NF" is usually enough.

**PostgreSQL arrays and JSONB.** A `TEXT[]` skills column or a `JSONB` column technically bends 1NF. It is fine for data you read together and don't need to join on. It is a deliberate trade-off, see [denormalisation](topic:postgresql/denormalization).

**Compared with MongoDB.** MongoDB often **embeds** data on purpose (the opposite direction). The same "read together vs shared and changing" thinking applies. See [embedding vs referencing](topic:mongodb/embedding-vs-referencing).

## 🎯 Why do we use it?

- **Correct data.** Each fact lives in one place, so it can't disagree with itself.
- **Easy changes.** Update a company name once, not in every job row.
- **Less storage** and smaller rows, because nothing is repeated.
- **Clear design.** Each table is about one thing: candidates, jobs, companies.

## ⚠️ Common mistakes

- **Comma-separated values in one column** (`'Node, React'`). You can't index, join or count them properly.
- **Columns like `skill1`, `skill2`, `skill3`.** It breaks 1NF and limits you to three.
- **Copying a name instead of storing an id** (`company_name` in `jobs`). It breaks 3NF.
- **Over-normalising** read-heavy reports until every screen needs ten joins. Sometimes a little [denormalisation](topic:postgresql/denormalization) is the right call.

## 🗣️ How to answer in an interview

> "Normalisation is designing tables so each fact is stored once, to avoid duplicated data getting out of sync. First normal form means one value per cell and no repeating groups — so skills go in their own table, one per row, not 'Node, React' in one cell. Second normal form means every non-key column depends on the whole key, which matters when the key is composite. Third normal form means no non-key column depends on another non-key column — for example jobs store company_id, and the company name lives only in the companies table.
>
> The payoff is avoiding update, insert and delete anomalies. I usually design to third normal form, and then denormalise on purpose only where a read-heavy screen really needs it."

[FILL IN: where you used PostgreSQL, and a schema you designed or improved.]

## 🔁 Follow-up questions

### What is the difference between 3NF and BCNF?

BCNF is stricter. In 3NF, a column can depend on a non-key column if that column is part of some candidate key. BCNF says every determinant must be a candidate key. In practice, most 3NF designs are already BCNF.

### Is normalisation always good?

No. It is the right default for correctness. But heavy reports may need many joins. For those, a materialised view or a stored count (denormalisation) can be better.

### How do you store many-to-many data in a normalised way?

With a join table. For example, `applications(candidate_id, job_id)` links candidates and jobs. Each pair is one row.

### Does storing JSONB break normalisation?

Technically it bends 1NF. It's a reasonable choice for flexible data you read as a whole, like a parsed resume, but not for data you join or filter on often.

## ✅ Quick check

### 1. `candidates(id, name, skills)` with `skills = 'Node, React, SQL'`. Which normal form does it break?

:::answer
**1NF.** A cell holds several values. Move skills to a `candidate_skills` table, one skill per row.
:::

### 2. `jobs(id, title, company_id, company_city)`. Which normal form does `company_city` break?

- A) 1NF
- B) 2NF
- C) 3NF

:::answer
**C) 3NF.** `company_city` depends on `company_id`, which is not the key of `jobs`. Move it to `companies`.
:::

### 3. Name the anomaly: deleting a company's last job also loses the company's address.

:::answer
**Delete anomaly.** The company's facts only lived inside job rows, so deleting the row lost them.
:::
