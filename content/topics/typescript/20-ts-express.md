---
title: "TypeScript with Express (typed req/res, extending Request)"
stack: typescript
order: 20
level: Intermediate
mustKnow: false
askedFrequency: common
summary:
  - Install @types/express (Express 5 types) and import Request, Response and NextFunction.
  - "Request takes type parameters: Request<Params, ResBody, ReqBody, Query>. Use them to type params and the body."
  - "Add your own fields, like req.user, with declaration merging: declare global { namespace Express { interface Request { user?: … } } }."
  - Types are only a promise. The real JSON body can be anything, so validate it at runtime (Joi or Zod).
  - Keep shared types (like the response envelope) in one place, so the backend and frontend agree.
cards:
  - q: How do you type the body of a POST request in Express?
    a: "Request<{}, {}, CreateJobBody>. The third type parameter is the request body. Remember to validate it too, because the type alone checks nothing."
  - q: How do you add req.user to Express's Request type?
    a: "Declaration merging: declare global { namespace Express { interface Request { user?: { id: string; role: string } } } }, in a .ts or .d.ts file that TypeScript loads."
  - q: What are the four type parameters of Request?
    a: Route params, response body, request body, and query string — in that order.
  - q: Why is typing req.body not enough?
    a: Types are removed at runtime. A client can send any JSON, so you still need runtime validation (Joi, Zod) before trusting it.
  - q: How do you type an error-handling middleware?
    a: "(err: unknown, req: Request, res: Response, next: NextFunction) => …. It must have four parameters so Express knows it's an error handler."
---

## 💡 What is it?

Express is written in JavaScript. The package `@types/express` adds **types** for it.

With these types, `req`, `res` and `next` are fully typed. You can also say what the **params**, **query** and **body** of each route look like.

You can even add your own fields to `req`, like `req.user` after login.

## 🏠 Real-life example

Think of a **school office with labelled trays**.

- The **office** = your Express app.
- Each **tray label** ("Leave letters: name, class, dates") = the type of a route's body.
- The **office rule book** = `@types/express`. It says what every request and reply looks like.
- A **sticky note added to every letter** ("checked by: Ms. Rao") = `req.user`, added by the auth [middleware](glossary:middleware).
- The **clerk who actually reads each letter** = runtime validation. A label on the tray doesn't stop someone from dropping the wrong letter in it.

## 🧑‍💻 Code example

Set up with `npm install express` and `npm install -D typescript @types/express @types/node`. Save the code as `server.ts`, check it with `npx tsc --noEmit`, and run it with `node server.ts` (Node 24 runs `.ts` files directly).

```ts
import express, { type Request, type Response, type NextFunction } from 'express'; // Express + its types

declare global {                                          // add to Express's own types (only for TypeScript)
  namespace Express {                                     // Express keeps its Request type in this namespace
    interface Request {                                   // "declaration merging": add a field to Request
      user?: { id: string; role: 'admin' | 'recruiter' }; // the logged-in user, set by auth middleware
    }                                                     // end of Request
  }                                                       // end of namespace
}                                                         // end of declare global

type CreateJobBody = { title: string; openings: number }; // the shape of the JSON body we expect
type JobParams = { id: string };                          // route params are always strings

const app = express();                                    // create the app
app.use(express.json());                                  // read JSON bodies into req.body

function fakeAuth(req: Request, _res: Response, next: NextFunction) { // a typed middleware
  req.user = { id: 'u1', role: 'recruiter' };             // TypeScript knows req.user now
  next();                                                 // go to the next handler
}                                                         // end of fakeAuth

app.post('/jobs', fakeAuth, (req: Request<{}, {}, CreateJobBody>, res: Response) => { // Request<params, resBody, reqBody>
  const { title, openings } = req.body;                   // TypeScript knows: title is string, openings is number
  res.status(201).json({ title, openings, createdBy: req.user?.id }); // 201 = created
});                                                       // end of POST /jobs

app.get('/jobs/:id', (req: Request<JobParams>, res: Response) => { // typed params
  res.json({ id: req.params.id.toUpperCase() });          // id is a string, so toUpperCase is allowed
});                                                       // end of GET /jobs/:id

const server = app.listen(3931, async () => {             // start on port 3931
  const post = await fetch('http://localhost:3931/jobs', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ title: 'Node dev', openings: 2 }) }); // test the POST
  console.log(post.status, await post.json());            // print status and body
  const get = await fetch('http://localhost:3931/jobs/j7'); // test the GET
  console.log(get.status, await get.json());              // print status and body
  server.close();                                         // stop the server so the script ends
});                                                       // end of listen
```

**Output (`npx tsc --noEmit` shows no errors, then `node server.ts`):**

```text
201 { title: 'Node dev', openings: 2, createdBy: 'u1' }
200 { id: 'J7' }
```

## 🔍 Deeper version

**The four type parameters of `Request`:**

```ts
Request<Params, ResBody, ReqBody, Query>   // the order matters
```

| Position | What it types | Example |
|---|---|---|
| 1. `Params` | `req.params` | `{ id: string }` |
| 2. `ResBody` | what `res.json()` sends | `{ success: boolean }` |
| 3. `ReqBody` | `req.body` | `CreateJobBody` |
| 4. `Query` | `req.query` | `{ page?: string }` |

Params and query values always arrive as **strings**. Turn them into numbers yourself, for example `Number(req.query.page ?? 1)`.

**Declaration merging.** TypeScript lets you **reopen** an interface and add fields. Express keeps `Request` inside `namespace Express`, so you can add `user` to it once. After that, every route sees `req.user`. Put this block in a file that TypeScript loads, like `src/types/express.d.ts`. In a `.d.ts` file, add `export {}` so it counts as a module and `declare global` is allowed.

Make the new field **optional** (`user?`). Public routes don't have a user, so code must check it.

**Typed middleware and error handlers:**

```ts
const requireRole = (role: 'admin' | 'recruiter') =>               // a typed middleware factory (a closure)
  (req: Request, res: Response, next: NextFunction) => {            // the middleware itself
    if (req.user?.role !== role) return res.status(403).json({ message: 'Forbidden' }); // wrong role → 403
    next();                                                         // allowed → continue
  };

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => { // 4 params = error handler
  const message = err instanceof Error ? err.message : 'Unknown error';        // err is unknown, so check it
  res.status(500).json({ message });                                           // one consistent error format
});
```

**Types vs validation.** `Request<{}, {}, CreateJobBody>` is a *promise*, not a check. A client can send `{ "title": 5 }`. So validate the body at runtime with [Joi or Zod](topic:express/validation). With Zod, you can even get the type **from** the schema (`z.infer`), so you never write it twice. See [Zod](topic:typescript/zod).

**Express 5 types.** `@types/express` version 5 matches Express 5. For example, async handlers are allowed to return a promise, and errors from them go to the error handler. See [Express 5](topic:express/express-5).

**Sharing types with the frontend.** Put request and response types, like a `{ status, code, message, results }` envelope, in a shared package or folder. Then the React app and the API can't drift apart.

## 🎯 Why do we use it?

- **Fewer silly bugs:** a wrong field name in `req.body.titel` is caught immediately.
- **`req.user` is known everywhere**, with the right shape, after one small type file.
- **Safer refactoring** in big APIs with many routes.
- **Clear contracts:** the body and response types document each endpoint.

## ⚠️ Common mistakes

- **Trusting `req.body` because it's typed.** Always validate at runtime.
- **Treating `req.params.id` or `req.query.page` as numbers.** They are strings. Convert them.
- **Making `user` required** (`user: User`) in the merged type. Then TypeScript thinks every request is logged in.
- **Putting the merge in a file TypeScript never loads.** Check that it's covered by `include` in `tsconfig.json`.

## 🗣️ How to answer in an interview

> "With Express and TypeScript, I install @types/express and type handlers with Request, Response and NextFunction. Request takes type parameters for params, response body, request body and query, so I can type the body of a POST route.
>
> To add things like `req.user` after authentication, I use declaration merging. I declare `user` as an optional field on Express's Request interface in a global types file, and every route can then use it safely.
>
> I always remember that those types disappear at runtime. A client can still send any JSON, so I validate the body with Joi or Zod. With Zod I can infer the TypeScript type from the same schema, so the validation and the type never drift apart."

[FILL IN: the SkillKeepr backend services are written in TypeScript and validate with Joi — add one route or service you typed and validated. Only if it's true.]

## 🔁 Follow-up questions

### Why do we write `{}` for the first two type parameters?

To skip them. Generic parameters are positional, so to type the body (3rd), you must fill the 1st and 2nd. `{}` means "nothing special here".

### How do you type `req.query` safely?

Treat every value as `string | undefined`, because users can type anything in the URL. Validate and convert with Zod, for example `z.coerce.number().int().min(1).default(1)` for `page`.

### Where do you put the `declare global` block?

In a `.d.ts` or `.ts` file inside the folders that `tsconfig.json` includes, often `src/types/express.d.ts`. In a `.d.ts` file, add `export {}` so `declare global` is allowed.

### Can you type `res.json()`?

Yes, with the second type parameter: `Response<ApiResponse<Job>>`. Then `res.json()` only accepts that shape. It's handy for keeping one response format across the API.

## ✅ Quick check

### 1. In `Request<A, B, C, D>`, which letter types `req.body`?

:::answer
**C.** The order is params, response body, **request body**, query.
:::

### 2. A client sends `{ "openings": "two" }` to a route typed `Request<{}, {}, { openings: number }>`. What happens if there is no validation?

:::answer
The request is **accepted**. Types are removed at runtime, so `openings` is the string `"two"`, and your code may break later. Validation (Joi or Zod) is what rejects it with a 400.
:::

### 3. What type does `req.params.id` have?

- A) `number`
- B) `string`
- C) `any`

:::answer
**B, `string`.** Route params always arrive as text, even `/jobs/42`.
:::
