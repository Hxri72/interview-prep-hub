---
title: API versioning without breaking clients
stack: rest-auth
order: 8
level: Intermediate
mustKnow: false
askedFrequency: common
summary:
  - Versioning lets you change your API without breaking apps that already use it.
  - "The most common way is a version in the URL: /api/v1/jobs, then /api/v2/jobs. Headers and query params also work."
  - "Additive changes (a new optional field or a new endpoint) don't need a new version. Removing or renaming fields does."
  - Keep the old version running for a while, warn clients with Deprecation and Sunset headers, then remove it.
  - Mobile apps make this important, because old app versions stay on users' phones for months.
cards:
  - q: Why version an API?
    a: To make breaking changes (renaming or removing fields, changing types) without breaking clients that still expect the old shape.
  - q: Name three ways to version an API.
    a: "URL path (/api/v2/jobs), a header (Accept: application/vnd.app.v2+json or a custom API-Version header), or a query parameter (?version=2). The URL path is the most common."
  - q: Which changes are breaking?
    a: Removing or renaming a field, changing a field's type or meaning, making an optional input required, or changing status codes and error formats.
  - q: Which changes are safe without a new version?
    a: Adding a new endpoint, adding an optional request field, or adding a new response field that clients can ignore.
  - q: How do you retire an old version?
    a: Announce it, add Deprecation and Sunset headers, track who still calls it, give a migration window, then remove it.
---

## 💡 What is it?

Your [API](glossary:api) will change. Fields get renamed, and features get redesigned. But **apps already use the old shape**. If you change it suddenly, they break.

**Versioning** means you keep the old version working while you add a new one:

```text
/api/v1/candidates/7   → old shape (old apps keep working)
/api/v2/candidates/7   → new shape (new apps use this)
```

Later, when everyone has moved, you **retire** v1.

## 🏠 Real-life example

Think of **your school changing its timetable format**.

The school wants a new format next term. But many parents printed the old one and stuck it on their fridge.

- The school **keeps sending the old timetable** for a while = keeping v1 running.
- It **also publishes the new timetable** = v2.
- It writes a note: "The old format stops on 31 March" = the Deprecation and Sunset headers.
- **Adding a new "sports day" row** doesn't confuse anyone = an additive change, so no new version is needed.
- **Renaming "Period 1" to "Slot A"** confuses everyone = a breaking change, so it needs a new version.

## 🧑‍💻 Code example

Two versions, side by side, with Express 5 routers. Run `npm init -y` and `npm install express`. Save as `versions.js` and run `node versions.js`. (CommonJS.)

```js
const express = require('express');                                        // load Express
const app = express();                                                     // create the app

const candidate = { id: 7, firstName: 'Asha', lastName: 'Nair' };         // how we store it today

const v1 = express.Router();                                               // routes for old clients
v1.get('/candidates/:id', (req, res) => {                                  // the v1 endpoint
  res.set('Deprecation', '@1790812800');                                   // v1 deprecated since 1 Oct 2026 (Unix time)
  res.set('Sunset', 'Wed, 31 Mar 2027 23:59:59 GMT');                      // the date v1 will be removed
  res.json({ id: candidate.id, name: `${candidate.firstName} ${candidate.lastName}` }); // old shape: one "name"
});                                                                        // end of v1 route

const v2 = express.Router();                                               // routes for new clients
v2.get('/candidates/:id', (req, res) => {                                  // the v2 endpoint
  res.json(candidate);                                                     // new shape: firstName + lastName
});                                                                        // end of v2 route

app.use('/api/v1', v1);                                                    // old clients keep calling /api/v1
app.use('/api/v2', v2);                                                    // new clients call /api/v2

app.listen(3000, () => console.log('listening on 3000'));                  // start on port 3000
```

Output:

```text
$ curl -i localhost:3000/api/v1/candidates/7
HTTP/1.1 200 OK
Deprecation: @1790812800
Sunset: Wed, 31 Mar 2027 23:59:59 GMT
{"id":7,"name":"Asha Nair"}

$ curl localhost:3000/api/v2/candidates/7
{"id":7,"firstName":"Asha","lastName":"Nair"}
```

**What to notice:** the data is stored **one** way. Each version only changes the **shape** it sends. Old clients still get `name`.

## 🔍 Deeper version

**Ways to version**

| Way | Example | Pros | Cons |
|---|---|---|---|
| URL path | `/api/v2/jobs` | Very clear, easy to test in a browser, easy to route and cache | Not "pure" REST (the URL should be the resource, not the version) |
| Header | `API-Version: 2` or `Accept: application/vnd.app.v2+json` | Clean URLs | Harder to see and test; caches must vary by that header |
| Query param | `/jobs?version=2` | Easy to add | Easy to forget; messy with caching |
| Date-based | `Stripe-Version: 2025-…` | Fine-grained, per-account pinning | Complex to build |

Most teams use the **URL path**. Stripe is a well-known example of **date-based versions in a header**: each account is pinned to the API version it started with.

**Breaking vs non-breaking changes**

| Non-breaking (no new version) | Breaking (needs a new version) |
|---|---|
| New endpoint | Removing or renaming a field |
| New optional request field | Changing a type (`"7"` → `7`) |
| New response field | Making an optional field required |
| New enum value *only if* clients handle unknown values | Changing error format or status codes |

**Tolerant readers.** Ask clients to **ignore unknown fields**. Then adding fields is always safe.

**Retiring a version.**
1. Announce it, and update the docs and the changelog.
2. Add response headers. `Deprecation` (RFC 9745) says when it was deprecated. `Sunset` (RFC 8594) says when it will stop.
3. **Log who still calls v1**, using the API key, the tenant or the app version.
4. Contact those clients, wait out the migration window, then remove it (or return `410 Gone`).

**Keep versions thin.** Don't copy the whole codebase per version. Share the services and database, and keep version-specific code only in the **controller or response mapping layer**, like in the example.

**Contract tests.** Tests that check the exact response shape of each version catch accidental breaking changes before release. An OpenAPI spec per version helps too. See [Swagger / OpenAPI](topic:rest-auth/swagger-openapi).

## 🎯 Why do we use it?

- **Mobile apps update slowly.** Users keep old app versions for months, and they must keep working.
- **Other companies integrate with you.** Partners, ATS tools and customers' scripts can't change the same day you do.
- **Safe progress.** You can redesign without fear, step by step.

## ⚠️ Common mistakes

- **No version at the start**, then a painful change later. Start with `/api/v1` on day one.
- **Making a new version for every small change.** Additive changes don't need one.
- **Copy-pasting the whole app for v2**, so every bug must be fixed twice.
- **Removing v1 without warning** or without checking who still uses it.

## 🗣️ How to answer in an interview

> "I version from day one with a prefix like /api/v1. Most changes don't need a new version: adding endpoints or optional fields is backward compatible, as long as clients ignore unknown fields. A new version is only for breaking changes, like renaming or removing a field, changing a type, or changing the error format.
>
> When I need v2, both versions share the same services and database, and only the controller or response-mapping layer differs. Then I deprecate v1: announce it, add Deprecation and Sunset headers, log which clients still call it, and remove it after the migration window.
>
> URL versioning is my default because it's clear and easy to route. Header-based versioning, like Stripe's dated versions, is more flexible but harder to test and cache."

## 🔁 Follow-up questions

### URL versioning vs header versioning — which do you prefer?

URL versioning for most teams: it's visible, easy to test with curl or a browser, and easy to route in API Gateway or Express. Header versioning keeps URLs clean, but it's harder to debug, and caches must vary by the header.

### Is adding a new enum value a breaking change?

It can be. If a client has a `switch` with no default case, an unknown status like `"on_hold"` can break it. Document that clients must handle unknown values.

### How do you know when it's safe to remove v1?

Measure. Log every v1 call with who made it. When traffic is near zero, and the important clients have confirmed they moved, remove it.

### How would you version a GraphQL API?

GraphQL usually avoids versions. You add new fields and mark old ones `@deprecated`, and clients ask only for the fields they need.

## ✅ Quick check

### 1. You add a new optional field `skills` to the candidate response. Do you need `/api/v2`?

:::answer
**No.** Adding a field is non-breaking, as long as clients ignore fields they don't know.
:::

### 2. You change `experience` from a string (`"3 years"`) to a number (`3`). New version or not?

:::answer
**Yes, it's a breaking change.** Old clients expect a string and may crash on a number. Ship it in v2, or add a new field like `experienceYears` and keep the old one.
:::

### 3. What do the `Deprecation` and `Sunset` headers tell a client?

:::answer
`Deprecation` says the endpoint is deprecated (since a given time). `Sunset` gives the date it will stop working. Together they warn clients to move.
:::
