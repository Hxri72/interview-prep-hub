---
title: SQL injection and how to prevent it
stack: postgresql
order: 8
level: Basic
mustKnow: true
askedFrequency: very common
summary:
  - SQL injection happens when user input is glued into the SQL text, so the input can change what the query does.
  - "The fix: parameterised queries. Write $1, $2 in the SQL and pass the values in a separate array."
  - With parameters, the database treats input only as data, never as SQL code.
  - "Placeholders can't be used for table or column names. For those, pick from a fixed allow-list in code."
  - Also use least-privilege database users, validate input, and never show raw database errors to users.
cards:
  - q: What is SQL injection?
    a: An attack where user input is concatenated into a SQL string and changes the query's meaning, for example "x' OR '1'='1" returning every row.
  - q: How do you prevent SQL injection in Node with pg?
    a: "Use parameterised queries: pool.query('SELECT * FROM users WHERE email = $1', [email]). Never build SQL with string concatenation or template literals."
  - q: Can you use $1 for a column name in ORDER BY?
    a: No. Placeholders are for values only. Map the user's choice to a fixed allow-list of column names in code.
  - q: Does escaping quotes by hand fix it?
    a: Not reliably — it's easy to miss a case. Parameters are the standard fix. ORMs and query builders use parameters under the hood.
  - q: Is NoSQL injection the same thing?
    a: 'Same idea, different form. In MongoDB, an attacker sends objects like { "$ne": null } instead of a string. Validate types and sanitize filters.'
---

## 💡 What is it?

**SQL injection** is an attack. It happens when your code **glues user input into the SQL text**.

The attacker types something clever, like `x' OR '1'='1`. Now the input **changes the query itself**. It can leak every row, skip a password check, or even delete data.

The fix is **parameterised queries**: write `$1` in the SQL, and send the value separately.

## 🏠 Real-life example

Think of a **school office form**: "Give me the marks of student: ______".

A clerk reads the whole form out loud and does exactly what it says.

A naughty student writes in the blank: **"Rahul, and also give me everyone's marks"**. The clerk reads the full sentence, follows it, and hands over everyone's marks. That's injection: the "answer" in the blank turned into an **instruction**.

A careful office uses a form with a **sealed box** for the name. The clerk treats whatever is in the box only as a name to look up, never as an instruction. There's no student called "Rahul, and also give me everyone's marks", so nothing is returned.

- The **form's printed question** = your SQL with `$1`.
- The **blank filled by the student** = user input.
- **Reading the blank as an instruction** = string concatenation (unsafe).
- The **sealed box** = a parameter (safe).

## 🧑‍💻 Code example

This runs a real PostgreSQL inside Node, so no server is needed.

```bash
mkdir sqli-demo && cd sqli-demo   # a new folder
npm init -y                       # create package.json
npm pkg set type=module           # allow "import" syntax
npm install @electric-sql/pglite  # PostgreSQL that runs inside Node
```

Save this as `injection.js`. Run it with `node injection.js`.

```js
import { PGlite } from '@electric-sql/pglite';                         // in-process PostgreSQL (no server needed)

const db = new PGlite();                                                // start an empty database in memory
await db.exec('CREATE TABLE candidates (id serial PRIMARY KEY, email text, salary int)'); // a tiny table
await db.exec("INSERT INTO candidates (email, salary) VALUES ('asha@mail.com', 1200000), ('ravi@mail.com', 700000)"); // two rows

const input = "x' OR '1'='1";                                           // what an attacker types into the search box

const unsafeSql = `SELECT email, salary FROM candidates WHERE email = '${input}'`; // ❌ input glued into the SQL text
console.log('UNSAFE SQL:', unsafeSql);                                  // show the SQL the database really receives
const bad = await db.query(unsafeSql);                                  // run it
console.log('UNSAFE rows:', bad.rows);                                  // every candidate leaks

const good = await db.query(                                            // ✅ parameterised query
  'SELECT email, salary FROM candidates WHERE email = $1',              // $1 = a placeholder, not text
  [input],                                                              // the value travels separately
);
console.log('SAFE rows:', good.rows);                                   // nobody has that strange email → []
```

**Output:**

```text
UNSAFE SQL: SELECT email, salary FROM candidates WHERE email = 'x' OR '1'='1'
UNSAFE rows: [
  { email: 'asha@mail.com', salary: 1200000 },
  { email: 'ravi@mail.com', salary: 700000 }
]
SAFE rows: []
```

**What to notice:** the attacker's quote `'` closed the string early, and `OR '1'='1'` is always true. So the unsafe query returned **everyone's salary**. With `$1`, the whole input was treated as one strange email address, and nothing matched.

## 🔍 Deeper version

**Why parameters work.** With `pool.query(text, values)`, the `pg` driver sends the SQL text and the values **separately** (PostgreSQL's extended query protocol). The database parses the SQL first, **then** fills in the values as plain data. There's no way for the data to become SQL.

**The same thing in a real Express + `pg` app:**

```js
import pg from 'pg';                                                    // node-postgres driver
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL }); // pool of reusable connections

app.get('/candidates', async (req, res) => {                            // GET /candidates?email=…
  const { rows } = await pool.query(                                    // run a query
    'SELECT id, name, email FROM candidates WHERE email = $1',          // $1 = placeholder
    [req.query.email],                                                  // value array: $1 → req.query.email
  );                                                                    // end of query
  res.json(rows);                                                       // send the rows as JSON
});                                                                     // end of the route
```

PGlite's `db.query(text, values)` has the same shape, which is why the demo above works the same way.

**What can't be a parameter.** Placeholders are for **values only** — not table names, column names, `ASC`/`DESC` or SQL keywords. For a "sort by" option, use an allow-list:

```js
const SORTABLE = { name: 'name', experience: 'experience' };           // allowed columns only
const col = SORTABLE[req.query.sort] ?? 'name';                         // unknown input → safe default
const dir = req.query.dir === 'desc' ? 'DESC' : 'ASC';                  // only two possible values
await pool.query(`SELECT * FROM candidates ORDER BY ${col} ${dir} LIMIT $1`, [20]); // safe: col/dir come from our list
```

**Other places injection hides:**
- `IN` lists: use `WHERE id = ANY($1)` and pass an array, not a joined string.
- `LIKE` searches: pass `'%' + term + '%'` as a parameter. Also escape `%` and `_` in the term if users shouldn't use them as wildcards.
- Dynamic SQL inside database functions (`EXECUTE`): use `format('%I', name)` for identifiers and `USING` for values.
- ORMs and query builders (Prisma, Knex, Sequelize) are safe by default. Their **raw** methods (`$queryRawUnsafe`, `knex.raw` with string building) are not.

**Defence in depth:**
- The app's database user should **not** be a superuser. Give it only the rights it needs (no `DROP`).
- Validate input types and lengths, for example with [Zod or Joi](topic:express/validation).
- Never send raw database errors to the client. They help attackers map your tables.

**NoSQL injection** is the MongoDB version: the attacker sends `{ "$ne": null }` instead of a string. See [NoSQL injection](topic:mongodb/nosql-injection). Injection is one of the OWASP Top 10 web risks — see also [API security](topic:rest-auth/api-security).

## 🎯 Why do we use it?

- **Stop data leaks.** One injectable endpoint can expose every user's salary, email or password hash.
- **Stop login bypass and data loss.** Injection can skip a password check, or run `DELETE`.
- **It's free.** Parameterised queries are no harder to write than string concatenation, and the driver may reuse query plans too.

## ⚠️ Common mistakes

- **Using template literals** for values: `` `… WHERE id = ${req.params.id}` ``. Looks neat, but it's injectable.
- **Escaping quotes by hand.** Easy to get wrong. Use parameters.
- **Putting user input into ORDER BY or table names** directly. Use an allow-list.
- **Thinking an ORM makes you 100% safe.** Its raw-query helpers can still be misused.

## 🗣️ How to answer in an interview

> "SQL injection happens when user input is concatenated into a SQL string, so the input can change the query — the classic example is `x' OR '1'='1`, which turns a lookup into 'return every row'. The fix is parameterised queries: with node-postgres I write `WHERE email = $1` and pass the values in an array, so the database treats the input strictly as data.
>
> Placeholders only work for values, so for things like a dynamic sort column I map the user's choice to an allow-list in code. On top of that I validate input with a schema library, run the app with a least-privilege database user, and never return raw database errors. The MongoDB version of this is NoSQL injection with operator objects like `$ne`, which I handle by validating types and sanitising filters."

[FILL IN: if you used PostgreSQL, which library you used (pg, Prisma, an ORM) and how queries were parameterised.]

## 🔁 Follow-up questions

### Are prepared statements and parameterised queries the same thing?

Close. A parameterised query sends values separately from the SQL. A prepared statement is parsed once, given a name, and reused many times with different values. Both stop injection. In `pg`, passing a `name` in the query config makes it a named prepared statement.

### Is input validation enough on its own?

No. Validation reduces risk, but parameters are the real fix. Use both.

### How do ORMs prevent injection?

They build parameterised queries for you. But raw-query escape hatches, like `$queryRawUnsafe` or string-built `knex.raw`, bring the risk back.

### What's second-order SQL injection?

The bad input is first saved safely, then later read back and concatenated into another query. The fix is the same: always use parameters, even for data from your own database.

## ✅ Quick check

### 1. Is this safe?

```js
await pool.query(`SELECT * FROM jobs WHERE id = ${req.params.id}`); // template literal
```

:::answer
**No.** A template literal is still string concatenation. Use `pool.query('SELECT * FROM jobs WHERE id = $1', [req.params.id])`.
:::

### 2. Can you write `ORDER BY $1` to let users choose the sort column?

:::answer
**No.** `$1` would be treated as a constant value, not a column name, so it wouldn't sort the way you want. Map the user's choice to a fixed allow-list of column names in code.
:::

### 3. With `WHERE email = $1` and the input `x' OR '1'='1`, how many rows come back from the demo table?

:::answer
**Zero.** The whole input is compared as one email string, and no candidate has that email.
:::
