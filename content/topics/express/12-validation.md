---
title: Request validation with Joi or Zod
stack: express
order: 12
level: Intermediate
mustKnow: false
askedFrequency: common
summary:
  - Validation means checking the data a client sends (body, params, query) BEFORE your code uses it. Never trust input.
  - You describe the expected shape once as a schema (Joi or Zod), then check every request against it in a middleware.
  - Bad input → reply 400 (or 422) with a clear list of what's wrong. Good input → continue to the controller.
  - Zod can also give you the TypeScript type from the same schema. Joi is older and very popular in plain JavaScript projects.
  - Validation also blocks attacks — wrong types, extra fields, and objects where a string was expected (NoSQL injection).
cards:
  - q: Why validate requests on the server if the frontend already validates?
    a: Anyone can call your API directly with Postman or curl and skip the frontend. The server must check every request itself.
  - q: What is a validation schema?
    a: A description of what valid data looks like — which fields, their types, required or optional, min/max length, formats like email.
  - q: Which status code do you send for invalid input?
    a: 400 Bad Request is the most common. Some APIs use 422 Unprocessable Content when the JSON is well-formed but fails the rules.
  - q: Joi vs Zod?
    a: Both validate data at runtime. Zod is TypeScript-first and can infer the TypeScript type from the schema. Joi is older, mature and common in JavaScript Express apps.
  - q: Where should validation live in an Express app?
    a: In a reusable middleware that runs before the controller, with schemas kept in their own folder. Business rules (like a unique email) stay in the service.
---

## 💡 What is it?

**Validation** means checking the data a user sends **before** you use it.

The data comes in three places: the body (`req.body`), the URL params (`req.params`) and the query string (`req.query`). Any of them can be wrong, missing or even dangerous.

You describe the correct shape once, as a **schema**. A schema is a description of valid data. Libraries like **Joi** and **Zod** check each request against the schema. If the data is bad, you reply with **400** and a clear message.

## 🏠 Real-life example

Think of an **exam hall entry check**.

Before a student can enter, the teacher at the door checks:
- Do you have your **hall ticket**? (a required field)
- Is your **roll number** a number with 8 digits? (type and length)
- Is your **photo** on the ticket? (format)

If something is wrong, the teacher stops you **at the door** and tells you exactly what is missing. You don't get inside to the exam room first.

- The **hall ticket rules** = the schema.
- The **teacher at the door** = the validation middleware.
- **"Your roll number must have 8 digits"** = the 400 error message.
- The **exam room** = your controller and database.

## 🧑‍💻 Code example

Make a folder, run `npm init -y` and `npm install express zod`. Save this as `app.js`. Run it with `node app.js`.

```js
const express = require('express');                               // load Express
const { z } = require('zod');                                     // load Zod (version 4)
const app = express();                                            // create the app
app.use(express.json());                                          // read JSON bodies into req.body

const createUserSchema = z.object({                               // describe what a valid body looks like
  name: z.string().trim().min(2),                                 // a string; spaces removed; at least 2 letters
  email: z.email(),                                               // must be a valid email address
  age: z.number().int().min(18).optional(),                       // a whole number, 18 or more; may be missing
});                                                               // end of the schema

const validate = (schema) => (req, res, next) => {                // a reusable middleware maker
  const result = schema.safeParse(req.body);                      // check the body; never throws
  if (!result.success) {                                          // the data broke at least one rule
    const errors = result.error.issues.map((i) => ({              // turn each problem into a small object
      field: i.path.join('.'),                                    // which field, e.g. "email"
      message: i.message,                                         // what is wrong with it
    }));                                                          // end of map
    return res.status(400).json({ message: 'Invalid input', errors }); // 400 = bad request
  }                                                               // end of the if
  req.body = result.data;                                         // use the cleaned data (trimmed, no extra fields)
  next();                                                         // all good → go to the route
};                                                                // end of validate

app.post('/users', validate(createUserSchema), (req, res) => {    // the validator runs before the route
  res.status(201).json({ saved: req.body });                      // here we know the data is safe
});                                                               // end of the route

app.listen(3000, () => console.log('Running on port 3000'));       // start the server on port 3000
```

```text
$ curl -X POST localhost:3000/users -H "Content-Type: application/json" -d '{"name":"Hari","email":"hari@example.com","role":"admin"}'
{"saved":{"name":"Hari","email":"hari@example.com"}}       ← 201; the extra "role" field was removed

$ curl -X POST localhost:3000/users -H "Content-Type: application/json" -d '{"name":"H","email":"nope"}'
{"message":"Invalid input","errors":[
  {"field":"name","message":"Too small: expected string to have >=2 characters"},
  {"field":"email","message":"Invalid email address"}]}    ← 400
```

## 🔍 Deeper version

**Never trust the client.** Frontend validation is only for a nice user experience. Anyone can skip it and call your API with Postman, curl or a script. The server must check **every** request.

**What to validate:**
- **body**: the main data for POST, PUT and PATCH.
- **params**: for example, is `:id` a valid ObjectId or number?
- **query**: for example, is `page` a positive number, and is `sort` one of the allowed fields?
- **headers** sometimes, for example an API version or an idempotency key.

**Parse, don't just check.** A good validator also **cleans** the data. Zod's `safeParse` returns `result.data`, the safe version. Strings are trimmed and unknown keys are removed (by default). Types are converted if you ask: `z.coerce.number()` turns `"5"` into `5`. Use that cleaned data, not the raw input.

**Same idea with Joi:**

```js
const Joi = require('joi');                                         // load Joi
const schema = Joi.object({                                         // describe the body
  name: Joi.string().trim().min(2).required(),                      // required string, at least 2 letters
  email: Joi.string().email().required(),                           // required, must look like an email
});                                                                 // end of the schema
const { error, value } = schema.validate(req.body, {                // check the body
  abortEarly: false,                                                // collect ALL errors, not just the first
  stripUnknown: true,                                               // drop fields that are not in the schema
});                                                                 // value = the cleaned data
```

**Joi vs Zod:**

| | Joi | Zod |
|---|---|---|
| Style | `Joi.string().email()` | `z.email()` (v4), `z.string()` |
| TypeScript | types written separately | `z.infer<typeof schema>` gives the type for free |
| Unknown keys | kept unless `stripUnknown: true` | removed by default (`z.object`) |
| Popular in | JavaScript Express apps | TypeScript projects, Next.js, tRPC |

:::version[Version note]
**Zod 4** (released in 2025) moved string formats to the top level: `z.email()`, `z.url()`, `z.uuid()`. The old `z.string().email()` still works but is deprecated. Error details are in `error.issues` in both versions.
:::

**TypeScript bonus.** With Zod, one schema gives you both the runtime check and the type: `type CreateUser = z.infer<typeof createUserSchema>`. This matters because TypeScript types disappear at runtime. They can't protect you from bad JSON.

**Security.** Validation also blocks many attacks:
- **NoSQL injection**: a user sends `{"email": {"$ne": null}}` instead of a string. A schema that says "email must be a string" rejects it.
- **Mass assignment**: a user adds `"role": "admin"` to the body. Removing unknown keys stops it from reaching the database.
- **Huge input**: max lengths and array sizes stop very large payloads.

**400 vs 422.** Use **400 Bad Request** when the input is invalid. Some teams use **422 Unprocessable Content** for "valid JSON, but it fails the rules". Pick one and use it everywhere.

**Shape vs business rules.** The schema checks the **shape** ("email is a valid email"). The **service** checks rules that need the database ("email is not already used").

## 🎯 Why do we use it?

- **Safety.** Bad or dangerous data stops at the door, before it reaches your database.
- **Clear errors for users.** The frontend gets a list of fields to fix, not a confusing 500 error.
- **Simpler code.** Controllers and services can trust the data. They don't need `if (!req.body.email)` checks everywhere.
- **One source of truth.** The schema documents what the API expects. It can even be used to generate API docs or TypeScript types.

## ⚠️ Common mistakes

- **Only validating on the frontend.** The API is still open to anyone.
- **Validating but then using `req.body` instead of the cleaned data.** You lose the trimming, type conversion and removed fields.
- **Forgetting params and query.** For example, `?limit=1000000` or an invalid `:id`.
- **Sending a 500 for bad input.** If the database throws because the data was invalid, you check too late. Validate first and send 400.

## 🗣️ How to answer in an interview

> "I never trust input from the client, even if the frontend validates it, because anyone can call the API directly. I define a schema per endpoint with Joi or Zod, describing the body, params and query: required fields, types, lengths and formats. A reusable validate middleware runs before the controller. If the data is invalid, it returns 400 with a list of field errors. If it's valid, it replaces req.body with the parsed, cleaned data, so unknown fields like role are stripped.
>
> In TypeScript projects I prefer Zod, because z.infer gives me the type from the same schema, and types don't exist at runtime anyway. Validation also helps security: it blocks NoSQL injection objects and mass-assignment fields. Business rules that need the database, like a unique email, I still check in the service layer."

[FILL IN: which validation library the SkillKeepr Express services use (Joi, Zod, express-validator, or something else). Only add it if it's true.]

## 🔁 Follow-up questions

### Why validate on the server if the frontend already does it?

Because the frontend can be skipped. Anyone can send requests with curl, Postman or a script. Frontend checks are for a nice user experience. Server checks are for safety.

### How do you validate route params and the query string?

Use the same middleware with a target, for example `validate(schema, 'params')` or `validate(schema, 'query')`. Use `z.coerce.number()` for numbers in the query, because everything in a URL arrives as a string.

:::note
In **Express 5**, `req.query` is a getter and can't be replaced. Store the parsed query in your own place, like `res.locals.query`, instead of assigning `req.query = ...`.
:::

### How does validation help against NoSQL injection?

An attacker can send an object like `{"$ne": null}` where you expect a string. MongoDB treats it as an operator, which can match every record. A schema that requires a string rejects the object before it reaches the query.

### Where do you check "this email is already registered"?

In the service layer, because it needs a database lookup. The schema only checks the format of the email. To be fully safe from race conditions, also add a **unique index** in the database.

## ✅ Quick check

### 1. The schema is `z.object({ name: z.string() })`. The body is `{ "name": "Hari", "isAdmin": true }`. What is in `result.data`?

:::answer
`{ "name": "Hari" }`. A Zod object removes keys that are not in the schema by default. So `isAdmin` is dropped.
:::

### 2. Which status code fits best when the body is missing a required field?

- A) 200
- B) 400
- C) 500

:::answer
**B) 400 Bad Request.** The client sent invalid data. 500 means the server itself failed.
:::

### 3. True or false: TypeScript types on `req.body` are enough to reject bad JSON at runtime.

:::answer
**False.** TypeScript types are removed when the code is compiled. At runtime, only a validator like Zod or Joi can check the real data.
:::
