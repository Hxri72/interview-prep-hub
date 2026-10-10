---
title: Validation with Joi in depth
stack: express
order: 25
level: Intermediate
mustKnow: true
askedFrequency: common
summary:
  - "Joi checks that incoming data has the right shape and rules (types, required fields, lengths, allowed values) before your code uses it."
  - "schema.validate(data) returns { value, error }. value is the cleaned data, with types converted and defaults added."
  - "Use abortEarly: false to get ALL errors, and stripUnknown: true to drop fields you didn't ask for."
  - "Build small shared schemas (address, phone, pagination) and compose them, so every API uses the same rules."
  - "In Express 5 req.query is read-only, so put the validated values on your own property like req.validated."
cards:
  - q: What does Joi's validate() return?
    a: "An object { value, error }. If the data is fine, error is undefined and value is the cleaned data (converted types, defaults added). If not, error.details lists the problems."
  - q: What does abortEarly false do?
    a: Joi normally stops at the first error. With abortEarly false it collects every error, so the user can fix all fields at once.
  - q: What does stripUnknown do?
    a: It removes fields that are not in the schema instead of failing. That stops unexpected fields like "role" sneaking into the database.
  - q: Why can't you write req.query = value in Express 5?
    a: In Express 5 req.query is a getter with no setter, so assigning to it throws an error. Store validated data on req.validated (or similar) instead.
  - q: Joi vs Zod in one line?
    a: Joi is a mature JavaScript-first validator with rich rules; Zod is TypeScript-first and also gives you the TypeScript type from the same schema.
---

## 💡 What is it?

**Joi** is a library that checks data against rules before you use it. You describe the rules once, in a **[schema](glossary:schema)**: "name is required text, email must be an email, experience is a number from 0 to 40".

Then you call `schema.validate(data)`. Joi tells you exactly what's wrong, or gives you back clean data.

You use it on every request that reaches your API, because data from outside can't be trusted.

## 🏠 Real-life example

Think of the **security check at an exam hall**.

Before you enter, a staff member checks a list: hall ticket ✔, photo ID ✔, no phone ✔, blue or black pen only ✔. If something is wrong, you hear exactly what, like "no hall ticket". You don't find out halfway through the exam.

- The **checklist** = the Joi schema.
- **The staff member checking you** = `schema.validate()`.
- **"No hall ticket"** = Joi's error message.
- **Checking everything and telling you all problems at once** = `abortEarly: false`.
- **Taking away things you're not allowed to bring** = `stripUnknown: true`.
- **Only checked students enter the hall** = only valid data reaches your service and database.

## 🧑‍💻 Code example

Set up and run it:

```bash
npm init -y          # create package.json
npm install joi      # install Joi (version 18 at the time of writing)
node joi-basic.js    # run the example below
```

Save this as `joi-basic.js`:

```js
const Joi = require('joi');                                         // load the Joi library

const STATUSES = ['applied', 'shortlisted', 'rejected'];            // shared list of allowed statuses

const candidateSchema = Joi.object({                                // the rules for one candidate object
  name: Joi.string().trim().min(2).max(50).required(),              // text, 2–50 letters, must be there
  email: Joi.string().email().lowercase().required(),               // must look like an email; saved in lowercase
  experience: Joi.number().integer().min(0).max(40).required(),     // whole number of years, 0–40
  status: Joi.string().valid(...STATUSES).default('applied'),       // one of the allowed values; 'applied' if missing
  skills: Joi.array().items(Joi.string()).max(10).default([]),      // list of text skills, at most 10
});                                                                 // end of schema

const good = { name: '  Asha ', email: 'ASHA@Mail.com', experience: '3' }; // note: experience is the text '3'
const bad = { name: 'A', email: 'not-an-email', experience: -1, role: 'admin' }; // 3 mistakes + an extra field

const r1 = candidateSchema.validate(good);                          // check the good object
console.log('good →', r1.error ? r1.error.message : r1.value);      // print the cleaned value

const r2 = candidateSchema.validate(bad, { abortEarly: false });    // abortEarly false = collect ALL errors
console.log('bad  →', r2.error.details.map((d) => d.message));      // print every error message

const r3 = candidateSchema.validate(bad, { abortEarly: false, stripUnknown: true }); // drop unknown keys like "role"
console.log('stripUnknown →', r3.error.details.map((d) => d.message)); // "role" error is gone
```

**Output (real run, Joi 18.2):**

```text
good → {
  name: 'Asha',
  email: 'asha@mail.com',
  experience: 3,
  status: 'applied',
  skills: []
}
bad  → [
  '"name" length must be at least 2 characters long',
  '"email" must be a valid email',
  '"experience" must be greater than or equal to 0',
  '"role" is not allowed'
]
stripUnknown → [
  '"name" length must be at least 2 characters long',
  '"email" must be a valid email',
  '"experience" must be greater than or equal to 0'
]
```

**What to notice:**
- In `good`, Joi **cleaned** the data. It trimmed spaces, lowercased the email, turned the text `'3'` into the number `3`, and added the defaults for `status` and `skills`.
- In `bad`, Joi listed **all 4 problems**, because of `abortEarly: false`. The extra `role` field is rejected by default.
- With `stripUnknown: true`, `role` is silently **removed** instead of causing an error.

## 🔍 Deeper version

**`validate()` vs `validateAsync()`.** `validate()` returns `{ value, error }` and never throws. `validateAsync()` returns a promise that **rejects** with a `ValidationError`, which suits `async` code with try/catch. Always use the returned `value`, not the original input, because `value` has the conversions and defaults.

**Useful options:**

| Option | Default | Meaning |
|---|---|---|
| `abortEarly` | `true` | Stop at the first error. Set `false` for forms, so users see every problem. |
| `stripUnknown` | `false` | Remove keys not in the schema instead of failing. |
| `allowUnknown` | `false` | Keep unknown keys without error. Usually avoid this. |
| `convert` | `true` | Turn `'6'` into `6`, trim, lowercase and so on. Set `false` for strict checks. |

**Custom messages, patterns, reusable pieces and conditional rules:**

```js
const Joi = require('joi');                                           // load Joi
const phone = Joi.string().pattern(/^[6-9]\d{9}$/).messages({         // Indian mobile: 10 digits starting 6–9
  'string.pattern.base': 'Phone must be a 10-digit Indian mobile number', // our own friendly message
});                                                                   // end of phone rule
const address = Joi.object({ city: Joi.string().required(), pin: Joi.string().length(6) }); // shared piece
const schema = Joi.object({                                           // compose shared pieces
  phone: phone.required(),                                            // reuse the phone rule
  address: address,                                                   // reuse the address rule
  type: Joi.string().valid('fulltime', 'contract').required(),        // job type
  contractMonths: Joi.number().when('type', {                         // rule depends on another field
    is: 'contract', then: Joi.required(), otherwise: Joi.forbidden(), // required for contract, not allowed otherwise
  }),                                                                 // end of when
});                                                                   // end of schema
```

Real results:

```text
A { phone: '12345', type: 'contract' }                          → [ 'Phone must be a 10-digit Indian mobile number', '"contractMonths" is required' ]
B { …, type: 'fulltime', contractMonths: 6 }                     → [ '"contractMonths" is not allowed' ]
C { …, type: 'contract', contractMonths: '6' }                   → { phone: '9876543210', type: 'contract', contractMonths: 6 }
D same as C but with { convert: false }                          → [ '"contractMonths" must be a number' ]
```

**Validating a request in Express 5 with one middleware.** Express 5 made `req.query` a **getter without a setter**. Assigning to it throws *"Cannot set property query of #&lt;IncomingMessage&gt; which has only a getter"* (checked on Express 5.3). So keep the clean values on your own property:

```js
const express = require('express');                                  // load Express 5
const Joi = require('joi');                                          // load Joi
const app = express();                                               // create the app

const validate = (schemas) => (req, res, next) => {                  // middleware factory: takes { params, query, body } schemas
  req.validated = {};                                                // clean values go here (Express 5 req.query is read-only)
  for (const part of ['params', 'query', 'body']) {                  // check each part of the request in order
    if (!schemas[part]) continue;                                    // no schema for this part → skip it
    const { value, error } = schemas[part].validate(req[part] ?? {}, { abortEarly: false, stripUnknown: true }); // all errors, drop extras
    if (error) {                                                     // something is wrong → stop here
      return res.status(400).json({                                  // 400 = Bad Request, one consistent shape
        code: 'VALIDATION_FAILED',                                   // an error code the frontend can map to a message
        errors: error.details.map((d) => ({ field: d.path.join('.'), message: d.message })), // every problem, per field
      });                                                            // end of response
    }                                                                // end of if
    req.validated[part] = value;                                     // save the cleaned, converted value
  }                                                                  // end of loop
  next();                                                            // all good → go to the route handler
};                                                                   // end of validate

app.get('/jobs/:jobId/candidates', validate({                        // a route with two schemas
  params: Joi.object({ jobId: Joi.string().hex().length(24).required() }), // a MongoDB id: 24 hex characters
  query: Joi.object({                                                // the ?page=&limit= part
    page: Joi.number().integer().min(1).default(1),                  // page 1 if not given
    limit: Joi.number().integer().min(1).max(50).default(20),        // 20 per page, never more than 50
  }),                                                                // end of query schema
}), (req, res) => res.json(req.validated.query));                    // the handler uses the CLEAN values
```

Calling it (real output):

```text
GET /jobs/64b7f0c2a1e4d5f6a7b8c9d0/candidates?page=2
200 {"page":2,"limit":20}

GET /jobs/64b7f0c2a1e4d5f6a7b8c9d0/candidates?page=0&limit=500
400 {"code":"VALIDATION_FAILED","errors":[{"field":"page","message":"\"page\" must be greater than or equal to 1"},{"field":"limit","message":"\"limit\" must be less than or equal to 50"}]}
```

Notice `page` arrived as the **text** `"2"`, and the handler got the **number** `2`.

**Where to validate.** Many teams validate in [middleware](glossary:middleware) at the route, as above. Others call `schema.validate()` at the start of the **service** function, so the same rule protects the service even when it's called from a cron job or a queue worker, not only from HTTP. Both are fine; be consistent.

**Joi vs Zod:**

| | Joi | Zod |
|---|---|---|
| Language focus | JavaScript-first | TypeScript-first |
| TypeScript type from schema | Not built in | `z.infer<typeof schema>` |
| Error style | `error.details[]` with `message`, `path`, `type` | `error.issues[]` |
| Strength | Very rich rules (`when`, references, custom messages), long history in Express/Hapi apps | One schema gives both runtime checks and types; popular in React/Next.js |

See [Zod](topic:typescript/zod) and the general overview in [request validation](topic:express/validation).

## 🎯 Why do we use it?

- **Types disappear at runtime.** TypeScript can't stop a client sending `"experience": "lots"`. Joi can.
- **Security.** Unknown fields like `role: 'admin'` are rejected or stripped, and lengths and formats are limited.
- **Clean data for the rest of the code.** Numbers are numbers, emails are lowercase, defaults are filled in.
- **One consistent error format.** The frontend can show the right message next to the right field.
- **Reuse.** Shared schemas (phone, address, pagination) keep every API's rules the same.

## ⚠️ Common mistakes

- **Using the original input instead of the returned `value`.** You lose the conversions and defaults.
- **Leaving `abortEarly` on for forms.** The user fixes one error, submits, and sees the next one, again and again.
- **Allowing unknown keys,** with `allowUnknown: true` everywhere, and then saving the whole body into the database.
- **Trying `req.query = value` in Express 5.** It throws. Use `req.validated` or a similar property.
- **Returning Joi's raw error object to the client.** Map it to your own consistent `{ code, errors[] }` shape.

## 🗣️ How to answer in an interview

> "At SkillKeepr our backend services validate requests with Joi. We keep shared, reusable schemas, for things like location or business hours, and compose them into each endpoint's schema. Allowed values come from shared constants using `valid()`. Validation runs in the service layer, and a failure returns a 400 with our app error code and Joi's message.
>
> The things I pay attention to: I always use the returned `value`, because it has the converted types and defaults. I use `abortEarly: false` when the user needs to see every problem at once. I strip or reject unknown fields, so nothing like a `role` field sneaks into the database. In Express 5, `req.query` is read-only, so I put validated data on my own property.
>
> If the project were TypeScript-heavy, I'd consider Zod, because one schema gives both the runtime check and the type. [FILL IN: one schema you wrote, e.g. for which endpoint, and anything tricky like a when() rule.]"

## 🔁 Follow-up questions

### Why validate on the server if the frontend already validates?

Frontend validation is only for user experience. Anyone can call your API directly with curl or Postman and skip the frontend. The server must always check.

### How do you return all validation errors in one consistent format?

Use `abortEarly: false`. Then map `error.details` to `{ field: d.path.join('.'), message: d.message }`, and always send it in the same `{ code, errors }` shape with status 400.

### How do you make one field required only when another field has a value?

Use `.when()`: `contractMonths: Joi.number().when('type', { is: 'contract', then: Joi.required(), otherwise: Joi.forbidden() })`.

### How do you share an enum between the database model and the validator?

Keep the allowed values in one constants file, for example `const STATUSES = [...]`. Use it in the Mongoose schema's `enum` and in Joi's `.valid(...STATUSES)`. Then they can never drift apart.

### 400 or 422 for a validation error?

Both are used. 400 means "bad request", and 422 means "well-formed, but the content fails the rules". Pick one and use it everywhere. See [PUT vs PATCH, 401 vs 403, 400 vs 422](topic:rest-auth/put-patch-401-403-400-422).

## ✅ Quick check

### 1. What does this print?

```js
Joi.object({ age: Joi.number() }).validate({ age: '7' }) // age is the text '7'
```

:::answer
**`{ value: { age: 7 } }`**. `convert` is on by default, so the text `'7'` becomes the number `7`, and there's no error.
:::

### 2. A schema has two required fields, and the data is `{}`. How many errors are in `error.details` with default options, and with `{ abortEarly: false }`?

:::answer
**1 and 2.** By default Joi stops at the first error. With `abortEarly: false` it reports both missing fields.
:::

### 3. What message does this give?

```js
Joi.object({ status: Joi.string().valid('applied', 'rejected') }).validate({ status: 'hired' }) // 'hired' isn't allowed
```

:::answer
**`"status" must be one of [applied, rejected]`**, which is the real Joi 18 message.
:::
