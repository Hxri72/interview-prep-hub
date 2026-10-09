---
title: One consistent response and error format
stack: express
order: 13
level: Intermediate
mustKnow: false
askedFrequency: common
summary:
  - Every endpoint should send the same JSON "shape", for success and for errors, so the frontend can handle all of them in one way.
  - A common success shape is { success, data, meta } — meta holds extra info like pagination.
  - A common error shape is { success false, error { code, message, details } } — code is a stable name like USER_NOT_FOUND that the frontend can check.
  - Always pair the body with the correct HTTP status code (200, 201, 400, 401, 403, 404, 409, 500). Don't send 200 with an error inside.
  - Build it with small helper functions and the central error handler, so no route makes its own shape. RFC 9457 (Problem Details) is a standard option.
cards:
  - q: Why use one consistent response format?
    a: The frontend can use one piece of code (for example one axios interceptor) to read data and show errors for every endpoint. It also makes the API easier to document and test.
  - q: What fields does a good error response have?
    a: A stable machine-readable code (like VALIDATION_ERROR), a human message, optional details (like field errors), and the correct HTTP status code.
  - q: Is it OK to return status 200 with { success false }?
    a: No. HTTP clients, caches, monitoring tools and logs rely on the status code. Errors must use 4xx or 5xx codes.
  - q: What is RFC 9457?
    a: A standard JSON format for HTTP API errors ("Problem Details") with fields type, title, status, detail and instance, sent with the content type application/problem+json.
  - q: How do you enforce the format across a whole Express app?
    a: Use small helpers (like sendSuccess) in controllers, and build every error response in one central error-handling middleware.
---

## 💡 What is it?

A **consistent response format** means every endpoint replies with the **same JSON shape**.

For example, success always looks like `{ success: true, data: ... }`. Errors always look like `{ success: false, error: { code, message } }`.

The **HTTP status code** still tells the main story: 200 for OK, 404 for not found, and so on. The body just follows one fixed pattern, so the frontend never has to guess.

## 🏠 Real-life example

Think of **school report cards**.

Every student gets the same printed form. Name at the top, then marks in the same order, then the teacher's remarks at the bottom.

Imagine if each teacher wrote marks on any paper they liked: one on a notebook page, one on a chit, one in a different order. Parents would be confused, and the office couldn't file them.

- The **printed report card form** = your response format.
- **Marks** = `data`.
- **"Absent for 3 exams — please meet the teacher"** = the `error` part.
- **Pass/fail stamp** = the HTTP status code.
- The **school office** that files every card the same way = the frontend code that reads every response.

## 🧑‍💻 Code example

Make a folder, run `npm init -y` and `npm install express`. Save this as `app.js`. Run it with `node app.js`.

```js
const express = require('express');                                  // load Express
const app = express();                                               // create the app

const sendSuccess = (res, data, status = 200, meta) =>               // helper for every success reply
  res.status(status).json({ success: true, data, ...(meta && { meta }) }); // add meta only if we have it

class AppError extends Error {                                       // our error type (see the async errors topic)
  constructor(code, message, status, details) {                      // code = stable name for the frontend
    super(message);                                                  // store the message and stack trace
    Object.assign(this, { code, status, details });                  // keep code, status and details on the error
  }                                                                  // end of constructor
}                                                                    // end of AppError

const jobs = [{ id: 1, title: 'Node.js Developer' }];                // a fake "database"

app.get('/jobs', (req, res) => {                                     // list all jobs
  sendSuccess(res, jobs, 200, { total: jobs.length, page: 1 });      // data + meta (pagination info)
});                                                                  // end of route

app.get('/jobs/:id', (req, res) => {                                 // get one job
  const job = jobs.find((j) => j.id === Number(req.params.id));      // look it up by id
  if (!job) throw new AppError('JOB_NOT_FOUND', 'Job not found', 404); // missing → a known error
  sendSuccess(res, job);                                             // found → 200 with the job
});                                                                  // end of route

app.use((err, req, res, next) => {                                   // ONE place builds every error reply
  const status = err.status || 500;                                  // unknown errors become 500
  res.status(status).json({                                          // the same error shape every time
    success: false,                                                  // easy flag for the frontend
    error: {                                                         // all error info lives here
      code: err.code || 'INTERNAL_ERROR',                            // stable name the frontend can check
      message: status === 500 ? 'Something went wrong' : err.message, // safe message for users
      ...(err.details && { details: err.details }),                  // extra info, e.g. field errors
    },                                                               // end of error
  });                                                                // end of json
});                                                                  // end of error handler

app.listen(3000, () => console.log('Running on port 3000'));          // start the server on port 3000
```

```text
$ curl localhost:3000/jobs
{"success":true,"data":[{"id":1,"title":"Node.js Developer"}],"meta":{"total":1,"page":1}}

$ curl localhost:3000/jobs/1
{"success":true,"data":{"id":1,"title":"Node.js Developer"}}

$ curl localhost:3000/jobs/9
{"success":false,"error":{"code":"JOB_NOT_FOUND","message":"Job not found"}}     ← status 404
```

## 🔍 Deeper version

**What a good format includes:**

| Part | Example | Why |
|---|---|---|
| HTTP status | `404` | Browsers, proxies, monitoring and retries depend on it |
| `data` | the user, the list | The actual result |
| `meta` | `{ page, limit, total, nextCursor }` | Pagination and extra info, kept apart from data |
| `error.code` | `"VALIDATION_ERROR"` | A **stable** name the frontend can `switch` on. Messages may change; codes shouldn't. |
| `error.message` | `"Email is invalid"` | For humans; can be shown to the user |
| `error.details` | `[{ field: "email", message: "..." }]` | Field-level errors for forms |
| `requestId` | `"a1b2c3"` | Lets support find the exact request in the logs |

**Status code first, body second.** Never send `200` with `{ success: false }`. Many tools only look at the status code. axios rejects only on 4xx/5xx. Caches may store a 200. Monitoring counts errors by status. The body adds detail, but the status code must be honest.

**Key status codes for a JSON API:**
- `200` OK, `201` Created (POST that made something), `204` No Content (DELETE, no body)
- `400` bad input, `401` not logged in, `403` logged in but not allowed, `404` not found, `409` conflict (duplicate), `422` fails the rules, `429` too many requests
- `500` server bug, `502`/`503`/`504` problems with an upstream service

**Standard option: RFC 9457 Problem Details.** This is an official standard for API errors. (It replaced RFC 7807 in 2023.) The content type is `application/problem+json`, with fields:

```json
{
  "type": "https://example.com/errors/job-not-found",
  "title": "Job not found",
  "status": 404,
  "detail": "No job with id 9 exists.",
  "instance": "/jobs/9"
}
```

You can add your own fields too, like `code` or `errors`. Using a standard is helpful for public APIs. For an internal API, a simple custom shape like the one above is also fine. The important thing is that it is **the same everywhere**.

**Enforcing it.**
- Success: use helpers (`sendSuccess`, `sendCreated`, `sendPaginated`) instead of raw `res.json` in controllers.
- Errors: **all** errors go through the [error-handling middleware](topic:express/error-middleware). This includes validation errors, auth errors, 404s and library errors.
- Document the shapes in Swagger/OpenAPI once, as shared components.
- Test it: a Supertest test can check that every error body has `success`, `error.code` and `error.message`.

**Envelope or no envelope?** Some teams don't wrap success data at all. They return the object itself and use only the status code. That's fine too. The real rule is: **pick one style and use it everywhere.**

## 🎯 Why do we use it?

- **One frontend handler.** An axios interceptor can read `error.message` and show a toast for every API. No special code per endpoint.
- **Forms are easy.** `error.details` maps straight onto form fields.
- **Debugging is faster.** The request ID and error code point straight to the right log line.
- **Docs and tests are simpler.** You describe and test one shape, not fifty.
- **New developers can't "invent" their own style**, because the helpers make the right way the easy way.

## ⚠️ Common mistakes

- **Every route builds its own JSON.** One route uses `{ msg }`, another `{ error }`, another `{ message }`. The frontend breaks in small ways.
- **Status 200 with an error inside.** Retries, caches and monitoring all get it wrong.
- **Leaking internal details** in the message, like SQL errors, stack traces or file paths.
- **Changing error codes or field names** without versioning. Frontend code that checks `code === 'NOT_FOUND'` suddenly stops working.

## 🗣️ How to answer in an interview

> "I make every endpoint return the same JSON shape. For success, something like success true, data, and an optional meta for pagination. For errors, success false and an error object with a stable code, a safe message, and optional details like field errors. The HTTP status code always matches. I never return 200 with an error inside, because clients, caches and monitoring rely on the status.
>
> I enforce it in two places. Controllers use small helpers like sendSuccess instead of raw res.json. All errors, including validation, auth and 404s, go through one central error middleware that builds the error shape. Unknown errors become a 500 with a generic message, and the details stay in the logs. For public APIs, I'd consider the RFC 9457 Problem Details standard. On the frontend, this lets one axios interceptor handle errors for the whole app."

[FILL IN: the response format used in the SkillKeepr APIs and how it appears in your Swagger docs. Only add it if it's true.]

## 🔁 Follow-up questions

### Why have an error code if you already have a message?

Messages are for humans. They may change wording or be translated. Codes like `EMAIL_TAKEN` are for code. The frontend can safely write `if (code === 'EMAIL_TAKEN')` to highlight the email field.

### Where do you put pagination info?

In a separate `meta` object: `page`, `limit`, `total`, or `nextCursor` for cursor pagination. Keeping it outside `data` means `data` is always just the list.

### What is RFC 9457?

It is the official standard for JSON error responses in HTTP APIs, called "Problem Details". It has the fields `type`, `title`, `status`, `detail` and `instance`, and uses the `application/problem+json` content type. It replaced RFC 7807.

### How would you add this format to an existing API without breaking clients?

Add it in a new API version (for example `/v2`), or add new fields alongside the old ones first. Tell the frontend teams, give them time to switch, and only then remove the old fields.

## ✅ Quick check

### 1. Which response is best for "user not found"?

- A) Status 200, body `{ "success": false, "message": "not found" }`
- B) Status 404, body `{ "success": false, "error": { "code": "USER_NOT_FOUND", "message": "User not found" } }`
- C) Status 500, body `"User not found"`

:::answer
**B.** The status code is honest (404), and the body follows the agreed error shape with a stable code.
:::

### 2. Where should the error JSON shape be built?

:::answer
In **one central error-handling middleware**. Routes just throw or call `next(err)`. Then every error, from any route, gets the same shape.
:::

### 3. True or false: the frontend should check `error.message` text to decide what to do.

:::answer
**False.** Messages can change. The frontend should check the stable `error.code`. The message is just for showing to the user.
:::
