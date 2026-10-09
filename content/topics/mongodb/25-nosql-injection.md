---
title: NoSQL injection and security
stack: mongodb
order: 25
level: Intermediate
mustKnow: false
askedFrequency: common
summary:
  - "NoSQL injection: a user sends an object like { \"$ne\": null } instead of a plain value, and it changes what your query does."
  - It can skip a password check, return every document, or read another tenant's data.
  - Fix 1 — validate input types (with Zod or Joi) so a field that must be a string can never be an object.
  - "Fix 2 — Mongoose sanitizeFilter: true wraps any $ key from user input in $eq, so it becomes a plain value."
  - Never pass req.body or req.query straight into find(), and never build $where or $function from user text.
cards:
  - q: What is NoSQL injection?
    a: "When user input contains MongoDB operators (like $ne or $gt) and your code puts it straight into a query, so the user changes what the query does."
  - q: "Why is find({ email, password: req.body.password }) dangerous?"
    a: "If the body sends password: { \"$ne\": null }, the filter means \"password is not null\", which matches every user. The password check is skipped."
  - q: What does Mongoose's sanitizeFilter option do?
    a: "It looks for keys starting with $ inside query filters and wraps them in $eq, so { $ne: null } is treated as a plain value, not an operator."
  - q: What is the best first defence?
    a: Validate types at the edge of your API. If email and password must be strings, reject anything else with a 400 before it reaches the database.
  - q: Why doesn't express-mongo-sanitize work well with Express 5?
    a: "In Express 5, req.query is read-only, so a middleware that rewrites req.query fails. Use validation plus Mongoose sanitizeFilter instead."
---

## 💡 What is it?

**NoSQL injection** is an attack on your [database](glossary:database) queries.

In MongoDB, a query is a JavaScript object. Special keys start with `$`, like `$ne` ("not equal") or `$gt` ("greater than"). These are called **operators**.

If a user can send an object instead of a plain value, they can put operators into your query. Then they control what the query does.

## 🏠 Real-life example

Think of a **school library card**.

The librarian asks: "What is your card number?" You should say a number, like `1042`. The librarian then gives you only the books for card `1042`.

Now a clever student says: "My card number is **any number that is not empty**." A careless librarian follows the words exactly. They hand over the books of **every** student!

- The **librarian** = your query code.
- The **card number** = a value from the user, like a password or an id.
- **"Any number that is not empty"** = the injected operator `{ "$ne": null }`.
- A **careful librarian** who only accepts digits = input validation.

## 🧑‍💻 Code example

Setup: run MongoDB locally (or use a free MongoDB Atlas cluster and change the URL). Then run `npm init -y` and `npm install mongoose`. Save this as `injection.js` and run `node injection.js`. It uses CommonJS.

```js
const mongoose = require('mongoose');                                   // load Mongoose (MongoDB library for Node)

const userSchema = new mongoose.Schema({ email: String, password: String }); // a simple user shape (demo only: never store plain passwords!)
const User = mongoose.model('User', userSchema);                         // the User model → "users" collection

async function main() {                                                  // async so we can use await
  await mongoose.connect('mongodb://127.0.0.1:27017/injection_demo');    // connect to a local database called injection_demo
  await User.deleteMany({});                                             // empty the collection so the demo starts clean
  await User.create({ email: 'admin@hire.io', password: 'secret123' });  // add one user

  const attack = { email: 'admin@hire.io', password: { $ne: null } };    // what an attacker sends as JSON: password is an OBJECT, not text

  const unsafe = await User.findOne(attack);                             // BAD: user input goes straight into the query
  console.log('unsafe login:', unsafe ? 'LOGGED IN 😱' : 'denied');      // $ne: null means "password is not empty" → it matches!

  try {                                                                  // the safe version may throw, so catch the error
    const safe = await User.findOne(attack).setOptions({ sanitizeFilter: true }); // GOOD: $ne is wrapped in $eq → treated as a plain value
    console.log('safe login:', safe ? 'LOGGED IN 😱' : 'denied');        // (only runs if no error was thrown)
  } catch (err) {                                                        // Mongoose can't turn the object into a String → CastError
    console.log('safe login: denied (' + err.name + ')');                // the attack is blocked either way
  }                                                                      // end of try/catch

  await mongoose.disconnect();                                           // close the connection so the script can end
}                                                                        // end of main

main().catch(console.error);                                             // run main and print any error
```

```text
unsafe login: LOGGED IN 😱
safe login: denied (CastError)
```

**What to notice:** the attacker never knew the password. They only changed its **type** from text to an object.

## 🔍 Deeper version

**How the attack arrives.** `express.json()` turns a JSON body into a real object. So `{"password": {"$ne": null}}` becomes an object with an operator inside. The same can happen with query strings if you use an "extended" query parser, like `?age[$gt]=0`.

**What attackers can do:**
- **Skip checks:** `{ $ne: null }` or `{ $gt: "" }` match almost anything.
- **Read too much:** a filter like `{ tenantId: req.query.tenantId }` with `{ $ne: null }` returns **every company's** data in a [multi-tenant](glossary:multi-tenant) app.
- **Run code on the server:** `$where` and `$function` run JavaScript inside the database. Never build them from user input.

**Defence 1 — validate types first.** This is the strongest fix. Check the input at the start of the route, for example with Zod:

```js
const { z } = require('zod');                                   // Zod: a schema validation library
const loginSchema = z.object({                                  // the only shape we accept
  email: z.email(),                                             // must be an email STRING
  password: z.string().min(8),                                  // must be a STRING of 8+ characters
});
const body = loginSchema.parse(req.body);                       // throws if password is an object → send 400
```

**Defence 2 — `sanitizeFilter`.** Mongoose can wrap any `$` key in a filter with `$eq`. If the field is a `String`, Mongoose then can't turn the object into text, so it throws a `CastError`. That still blocks the attack. Catch it and reply with 401 (or 400). Turn it on for the whole app with `mongoose.set('sanitizeFilter', true)`. If **your own** code needs an operator, mark it with `mongoose.trusted({ $gt: 18 })`.

**Defence 3 — whitelist fields.** Never do `User.find(req.query)` or `User.create(req.body)`. Pick the fields you allow:

```js
const filter = { tenantId: req.user.tenantId, status: String(req.query.status) }; // tenantId from the token, never from the user
```

**Defence 4 — don't trust the user for the tenant.** Take `tenantId` from the logged-in user's token. Never take it from the body or query.

:::version[Version note]
**Express 5** made `req.query` read-only. Older middleware like `express-mongo-sanitize` tries to rewrite `req.query`, so it fails on Express 5. Use validation plus Mongoose `sanitizeFilter` instead. Also, Mongoose 7+ sets `strictQuery` to `false` by default. So unknown fields in a filter are **not** removed for you.
:::

**Also secure the database itself:**
- Use a database user with only the rights the app needs, not an admin user.
- Keep the connection string in an [environment variable](glossary:environment-variable).
- Allow connections only from your servers (IP access list on Atlas).

## 🎯 Why do we use it?

One injected filter can log someone in as an admin. It can also leak every candidate's personal data, or show one company another company's data. For a hiring platform, that is a serious legal and trust problem.

Validation and sanitising are cheap. They stop this whole class of attack before the query ever runs.

## ⚠️ Common mistakes

- **Passing `req.body` or `req.query` straight into `find()`, `findOne()` or `updateOne()`.** Always build the filter yourself.
- **Thinking "MongoDB has no SQL, so it can't be injected".** Operators are the NoSQL version of SQL injection.
- **Taking `tenantId` or `role` from the request body.** Take them from the verified token.
- **Using `$where` or `$function` with user text.** This runs JavaScript inside the database.

## 🗣️ How to answer in an interview

> "NoSQL injection happens when user input contains MongoDB operators and the code puts that input straight into a query. The classic example is a login query where the password field arrives as `{ $ne: null }`. That matches every user, so the password check is skipped.
>
> I defend in layers. First, I validate types at the edge of the API with Zod or Joi, so a field that must be a string can never be an object. Second, I turn on Mongoose's `sanitizeFilter`, which wraps any `$` key from input in `$eq`. Third, I never pass `req.body` or `req.query` directly into a query. I build the filter myself, and I take the tenant ID from the verified token, not from the request. I also never use `$where` with user input."

[FILL IN: how input validation and tenant filtering are done in the SkillKeepr backend — only if true.]

## 🔁 Follow-up questions

### Is NoSQL injection the same as SQL injection?

Same idea, different form. SQL injection adds SQL text to a query string. NoSQL injection adds operator objects (like `$ne`) or JavaScript (`$where`) to a query object. The fix is also similar: never mix raw user input into the query.

### Does Mongoose schema typing protect me?

Partly. Schema casting helps on **writes**: a `String` field will reject or cast an object. But query **filters** can still carry operators. That's why `sanitizeFilter` and validation are needed for reads too.

### How do you safely let users filter or sort a list?

Use a whitelist. For example, allow `sort` to be only `createdAt` or `name`. Allow `status` to be only `applied`, `shortlisted` or `rejected`. Convert numbers with `Number()` and check the range. Build the filter object yourself from these safe values.

### What else protects the database besides code?

A least-privilege database user, network access limited to your servers, TLS for connections, secrets kept in environment variables, and regular backups.

## ✅ Quick check

### 1. A login route runs `User.findOne({ email: req.body.email, password: req.body.password })`. The body is `{"email": "a@b.com", "password": {"$gt": ""}}`. What happens?

:::answer
The filter means "password is greater than an empty string". That is true for almost any password, so the attacker is logged in. (Also, passwords should be hashed with bcrypt and compared in code, not matched in the query.)
:::

### 2. Which is the strongest single defence?

- A) Hiding the API URL
- B) Validating that each field has the right type before querying
- C) Using HTTPS

:::answer
**B.** If `password` must be a string, an object like `{ $ne: null }` is rejected with a 400. HTTPS protects data in transit, but not the query.
:::

### 3. True or false: `express-mongo-sanitize` is the recommended fix on Express 5.

:::answer
**False.** Express 5 made `req.query` read-only, so that middleware fails. Use validation plus Mongoose `sanitizeFilter`.
:::
