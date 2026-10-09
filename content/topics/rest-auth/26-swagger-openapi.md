---
title: API documentation with Swagger / OpenAPI
stack: rest-auth
order: 26
level: Basic
mustKnow: false
askedFrequency: common
summary:
  - OpenAPI is a standard file format (YAML or JSON) that describes your REST API — every path, method, parameter, request body, response and error.
  - Swagger is the set of tools around it. Swagger UI turns the file into an interactive web page where people can read the docs and try requests.
  - "Two ways to work: design-first (write the spec, then the code) or code-first (generate the spec from annotations or validation schemas in the code)."
  - The spec can also generate client SDKs, mock servers and contract tests, and validate requests.
  - Docs are only useful if they're correct. Generate them from code or check them in CI, so they don't drift from the real API.
cards:
  - q: What's the difference between OpenAPI and Swagger?
    a: OpenAPI is the specification (the file format describing an API). Swagger is a set of tools (Swagger UI, Swagger Editor, codegen) that work with OpenAPI files. The spec used to be called "Swagger" before version 3.
  - q: What goes into an OpenAPI document?
    a: "The API's info and servers, every path and method, parameters, request bodies, responses with status codes, reusable schemas (components), and security schemes like bearer JWT or API keys."
  - q: How do you serve Swagger docs in Express?
    a: "Load the OpenAPI spec (YAML or JSON) and mount swagger-ui-express: app.use('/docs', swaggerUi.serve, swaggerUi.setup(spec))."
  - q: Design-first vs code-first?
    a: Design-first means you write the spec first and agree on it, then build. Code-first means you write code and generate the spec from comments, decorators or validation schemas.
  - q: How do you stop docs from going out of date?
    a: Generate the spec from the code or the validation schemas, validate the spec in CI, and add contract tests that check real responses against it.
---

## 💡 What is it?

**OpenAPI** is a standard way to **describe a REST [API](glossary:api) in one file**, written in YAML or JSON. It lists every **URL**, **method**, **input**, **output** and **error**.

**Swagger** is a set of **tools** for OpenAPI files. The best known is **Swagger UI**. It turns the file into a **web page** where developers can read the docs and **try real requests** with a "Try it out" button.

Frontend developers, testers and partner companies can then use your API **without reading your code**.

## 🏠 Real-life example

Think of a **restaurant menu**.

The kitchen can cook many dishes. But customers don't go into the kitchen to find out. They read the **menu**: the dish name, what's in it, the price and the options.

- The **kitchen** = your backend code.
- The **menu** = the OpenAPI document.
- **Each dish** = one endpoint, like `GET /jobs/{id}`.
- **"Choose: spicy or mild"** = the parameters.
- **The photo and description of the dish** = the response example and its schema.
- **A waiter who lets you taste a sample** = Swagger UI's "Try it out" button.
- **An old menu showing dishes the kitchen stopped making** = docs that drifted from the real API. That's worse than no menu.

## 🧑‍💻 Code example

Make a folder, run `npm init -y` and `npm install express swagger-ui-express`. Save this as `swagger.js` and run `node swagger.js`. Then open `http://localhost:3106/docs` in a browser to see the interactive page (remove the `server.close()` line to keep it running).

```js
const express = require('express');                            // load Express
const swaggerUi = require('swagger-ui-express');               // serves the Swagger UI web page

const spec = {                                                 // the OpenAPI document (usually a YAML file)
  openapi: '3.1.0',                                            // which OpenAPI version this file follows
  info: { title: 'Jobs API', version: '1.0.0' },               // the API's name and version
  paths: {                                                     // every URL the API has
    '/jobs/{id}': {                                            // a path with a parameter
      get: {                                                   // the GET method on that path
        summary: 'Get one job',                                // a short description shown in the UI
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], // the {id} part
        responses: {                                           // what the API can reply
          200: { description: 'The job' },                     // success
          404: { description: 'Job not found' },               // no job with that id
        },                                                     // end of responses
      },                                                       // end of get
    },                                                         // end of /jobs/{id}
  },                                                           // end of paths
};                                                             // end of spec

const app = express();                                         // create the app
app.get('/openapi.json', (req, res) => res.json(spec));        // the raw spec, for tools and code generators
app.use('/docs', swaggerUi.serve, swaggerUi.setup(spec));      // the interactive docs page at /docs

const server = app.listen(3106, async () => {                  // start on port 3106
  const json = await (await fetch('http://localhost:3106/openapi.json')).json(); // read the spec back
  console.log(json.openapi, Object.keys(json.paths));          // print the version and the paths
  const page = await fetch('http://localhost:3106/docs/');     // load the docs page
  console.log('/docs →', page.status, page.headers.get('content-type')); // it's an HTML page
  server.close();                                              // stop the server
});                                                            // end of listen
```

**Output:**

```text
3.1.0 [ '/jobs/{id}' ]
/docs → 200 text/html; charset=utf-8
```

## 🔍 Deeper version

**The main parts of an OpenAPI document (YAML):**

```yaml
openapi: 3.1.0                     # spec version
info: { title: Jobs API, version: 1.2.0 }
servers:
  - url: https://api.example.com/v1
paths:
  /jobs:
    post:
      summary: Create a job
      security: [{ bearerAuth: [] }]          # this route needs a JWT
      requestBody:
        required: true
        content:
          application/json:
            schema: { $ref: '#/components/schemas/NewJob' }
      responses:
        '201': { description: Created }
        '400': { $ref: '#/components/responses/ValidationError' }
components:
  schemas:
    NewJob:
      type: object
      required: [title]
      properties:
        title: { type: string, minLength: 3 }
        remote: { type: boolean, default: false }
  securitySchemes:
    bearerAuth: { type: http, scheme: bearer, bearerFormat: JWT }
```

- **`components`** keeps reusable schemas, responses and parameters, so you don't repeat them. `$ref` points to them.
- **`securitySchemes`** describes how to log in (bearer JWT, API key header, OAuth 2). Swagger UI then shows an "Authorize" button.
- **Examples** in responses make the docs much easier to understand.

**OpenAPI versions:**
- **2.0** was called the "Swagger specification".
- **3.0** renamed it OpenAPI and added `components`, better request bodies and `oneOf`.
- **3.1** fully aligns schemas with **JSON Schema**, so the same schema can be used for validation and docs.

**Code-first in Node.js.** Popular ways to generate the spec from code:
- **JSDoc comments** above routes, collected by `swagger-jsdoc`.
- **Validation schemas turned into OpenAPI**, for example Zod schemas (`zod-to-openapi`) or Joi schemas (converters exist). One schema then validates requests **and** documents them.
- **Frameworks that do it for you**, like NestJS (decorators) or Fastify (route schemas).

**Design-first.** Write the YAML first (Swagger Editor helps). The frontend and backend agree on the contract, and the frontend can start with a **mock server** generated from the spec.

**More than docs:**
- **Client SDK generation** (`openapi-generator`): a typed TypeScript client for the frontend.
- **Request validation** (`express-openapi-validator`): reject requests that don't match the spec.
- **Contract tests**: check that real responses match the documented schemas.
- **Linting** (for example Spectral): enforce naming and versioning rules.

**Security of the docs page.** Docs for a public API can be public. For internal APIs, protect `/docs` with authentication or show it only outside production. Never put real secrets in examples.

## 🎯 Why do we use it?

- **Faster teamwork.** Frontend developers and partners see every endpoint, field and error without asking.
- **One source of truth** for the API contract, which helps when frontend and backend teams work in parallel.
- **Try requests from the browser** without Postman.
- **Automation:** typed clients, mocks, validation and tests from the same file.
- **Onboarding:** new developers understand the API in minutes.

## ⚠️ Common mistakes

- **Docs written by hand and never updated,** so they drift from the real API.
- **Documenting only the happy path.** Error responses (400, 401, 403, 404, 409, 422) matter just as much.
- **No examples,** which makes schemas hard to read.
- **Exposing internal docs publicly,** including admin endpoints.
- **Mixing OpenAPI 2.0 and 3.x syntax,** for example `definitions` instead of `components/schemas`.

## 🗣️ How to answer in an interview

> "OpenAPI is the standard file format for describing a REST API: paths, methods, parameters, request bodies, responses, error codes and auth schemes. Swagger is the tooling around it. Swagger UI turns the spec into an interactive page where people can try requests.
>
> In Express, I serve the spec with swagger-ui-express on a docs route. The big risk is docs drifting from the code, so I prefer generating the spec from the code or from the validation schemas, and checking it in CI. Good docs also cover error responses and include examples. The same spec can generate a typed client for the frontend and mock servers, so frontend and backend can work in parallel."

At SkillKeepr, I used **Swagger to document our backend APIs**. [FILL IN: how the docs were made — hand-written YAML, JSDoc comments, or generated — and who used them.]

## 🔁 Follow-up questions

### How do you keep Swagger docs in sync with the code?

Generate them from code (JSDoc, decorators or validation schemas), validate the spec in CI, and add contract tests that compare real responses with the spec. Reviewers should also check the docs change in the same pull request as the code.

### How do you document authentication in OpenAPI?

Add a `securitySchemes` entry (for example `bearerAuth` with `scheme: bearer` and `bearerFormat: JWT`, or an `apiKey` in a header). Then mark routes with `security`. Swagger UI shows an "Authorize" button for it.

### How would you document API versions?

Keep one spec per major version (for example `/v1` and `/v2`). Mark old operations with `deprecated: true`, and explain the migration in the description. See [API versioning](topic:rest-auth/api-versioning).

### What else can you do with an OpenAPI file besides docs?

Generate typed clients and server stubs, create mock servers, validate requests and responses, run contract tests, and import it into Postman.

## ✅ Quick check

### 1. True or false: OpenAPI and Swagger UI are the same thing.

:::answer
**False.** OpenAPI is the specification (the file format). Swagger UI is a tool that shows an OpenAPI file as an interactive web page.
:::

### 2. Where in an OpenAPI 3 document do you put a schema that many endpoints reuse?

- A) `paths`
- B) `components/schemas`
- C) `info`

:::answer
**B.** Put it under `components/schemas`, then point to it with `$ref: '#/components/schemas/Name'`.
:::

### 3. What's the biggest risk with hand-written API docs?

:::answer
They **drift** from the real API as the code changes, so people trust wrong information. Generate them from code or check them automatically.
:::
