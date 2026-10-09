---
title: "Runtime validation with Zod (types vanish at runtime)"
stack: typescript
order: 21
level: Intermediate
mustKnow: true
askedFrequency: very common
summary:
  - TypeScript types are removed when the code runs. So data from outside (requests, APIs, AI output, files) is never checked by them.
  - Zod is a library that checks data at runtime, using a schema (a list of rules).
  - "z.infer<typeof Schema> makes the TypeScript type FROM the schema, so the rule and the type never drift apart."
  - "safeParse returns { success, data } or { success, error } and never throws. parse throws on bad data."
  - Joi does the same job (common in older Node APIs); Zod's advantage is the type inference.
cards:
  - q: Why do we need runtime validation if we already use TypeScript?
    a: Types are erased at compile time. A request body or API response can contain anything, so you must check the real data while the program runs.
  - q: What does z.infer do?
    a: It creates a TypeScript type from a Zod schema, so you write the shape once and get both the runtime check and the type.
  - q: What is the difference between parse and safeParse?
    a: "parse returns the data or throws an error. safeParse never throws; it returns { success: true, data } or { success: false, error }."
  - q: Zod vs Joi?
    a: Both validate at runtime with a schema. Zod is TypeScript-first and can infer types; Joi is older, very mature, and needs separate TypeScript types.
  - q: Where should validation happen?
    a: At the edges, where data enters your system — request bodies, query strings, API and AI responses, env variables, file uploads.
---

## 💡 What is it?

TypeScript types **disappear** when the code runs. They only help while you write code.

So data that comes from **outside** your code is never checked by them. That means request bodies, API responses, AI output and `.env` values.

**Zod** is a library that checks this data **while the program runs**. You describe the rules once in a [schema](glossary:schema). Zod can also turn that schema into a TypeScript type.

## 🏠 Real-life example

Think of a **school gate on exam day**.

- The **list of rules printed on the notice board** = your TypeScript types. Everyone can read them, but the board itself stops nobody.
- The **security guard who checks every student's hall ticket** = Zod. The guard checks **each real person** at the gate.
- The **rule book the guard follows** = the Zod schema.
- **"Wrong hall ticket" with a reason** = Zod's error message for each wrong field.
- The guard and the notice board use **the same rule book**. That's `z.infer`: one source for both.

## 🧑‍💻 Code example

Set up with `npm install zod` and `npm install -D typescript`. Save the code as `validate.ts` and run it with `node validate.ts` (Node 24).

```ts
import { z } from 'zod';                                   // Zod: checks data while the program runs

const CandidateSchema = z.object({                         // the rules for one candidate
  name: z.string().min(2),                                 // text, at least 2 letters
  email: z.email(),                                        // must look like an email (Zod 4 style)
  experience: z.number().int().min(0),                     // whole number, 0 or more
  status: z.enum(['applied', 'shortlisted', 'rejected']),  // only these 3 words
});                                                        // end of the schema

type Candidate = z.infer<typeof CandidateSchema>;          // make the TypeScript type FROM the schema (no duplicate)

const fromApi: unknown = JSON.parse('{"name":"Asha","email":"asha@mail.com","experience":3,"status":"applied"}'); // outside data
const ok = CandidateSchema.safeParse(fromApi);             // safeParse never throws; it returns success or error
if (ok.success) {                                          // narrowing: inside here, ok.data is a Candidate
  const c: Candidate = ok.data;                            // fully typed AND really checked
  console.log('valid:', c.name, c.experience);             // safe to use
}                                                          // end of the success branch

const badInput = { name: 'A', email: 'not-an-email', experience: -1, status: 'hired' }; // 4 mistakes on purpose
const bad = CandidateSchema.safeParse(badInput);           // check the bad data
if (!bad.success) {                                        // it failed
  for (const issue of bad.error.issues) {                  // each problem Zod found
    console.log('error at', issue.path.join('.'), '→', issue.message); // which field, and why
  }                                                        // end of loop
}                                                          // end of the error branch
```

**Output:**

```text
valid: Asha 3
error at name → Too small: expected string to have >=2 characters
error at email → Invalid email address
error at experience → Too small: expected number to be >=0
error at status → Invalid option: expected one of "applied"|"shortlisted"|"rejected"
```

`npx tsc --noEmit` reports no errors. Notice that **all four** mistakes are reported at once, each with its field name.

## 🔍 Deeper version

**Why types aren't enough.** This line compiles fine:

```ts
const job: Job = await res.json();   // looks safe, but it's only a promise, not a check
```

If the API sends `{ "openings": "two" }`, nothing stops it. The bug shows up much later, far from the cause. Validation **at the edge** stops bad data at the door, with a clear error.

**One source of truth.** Without Zod, you write a TypeScript type *and* a separate validation rule. Over time, they drift apart. With `z.infer<typeof Schema>`, the type is generated **from** the schema, so they can't drift.

**`parse` vs `safeParse`:**
- `parse(data)` returns typed data or **throws** a `ZodError`. That's good inside a `try/catch` or an error middleware.
- `safeParse(data)` **never throws**. It returns `{ success: true, data }` or `{ success: false, error }`. Checking `if (result.success)` also **narrows** the type.

**Useful Zod features:**
- `z.coerce.number()`: turns `"2"` from a query string into `2`.
- `.default(1)` and `.optional()`: missing values.
- `.transform()`: clean data, for example trim and lowercase an email.
- `.refine()`: custom rules, like "endDate must be after startDate".
- `z.discriminatedUnion('type', [...])`: different shapes per `type`.

**In an Express route:**

```ts
app.post('/jobs', (req, res) => {                               // the route
  const result = JobSchema.safeParse(req.body);                 // check the real body
  if (!result.success) return res.status(400).json({ errors: result.error.issues }); // 400 = bad request
  createJob(result.data);                                       // result.data is checked AND typed
  res.status(201).end();                                        // 201 = created
});
```

**Zod vs Joi:**

| | Zod | Joi |
|---|---|---|
| TypeScript types | Inferred from the schema (`z.infer`) | Written separately |
| Style | TypeScript-first | JavaScript-first, very mature |
| Errors | `issues` array with `path` and `message` | `details` array with `path` and `message` |
| Common in | New TS projects, tRPC, Next.js, AI structured outputs | Older Express/Hapi APIs |

**AI structured outputs.** LLM replies are just text until you check them. A common pattern: ask for JSON that matches a schema, then `safeParse` the reply, and retry or fall back if it fails. See the [structured outputs story](topic:resume/openai-structured-outputs).

:::version[Version note]
This page uses **Zod 4**. Zod 4 has top-level helpers like `z.email()` (Zod 3 wrote `z.string().email()`), clearer error messages, and better speed. The core API (`z.object`, `parse`, `safeParse`, `z.infer`) stays the same.
:::

## 🎯 Why do we use it?

- **To trust data from outside.** Requests, other APIs, AI models and config files can all send surprises.
- **Clear errors for users.** You return a 400 with each field and the reason, instead of a 500 later.
- **No duplicate code.** One schema gives both the check and the TypeScript type.
- **Fail fast.** Validating `.env` at startup stops the app before it runs with a missing secret.

## ⚠️ Common mistakes

- **Typing data instead of checking it**, like `const user = req.body as User`.
- **Validating in the middle of the code** instead of at the edge, so bad data has already spread.
- **Writing the type and the schema separately.** Use `z.infer` instead.
- **Showing raw Zod errors to end users** without making them friendly. Map them to simple messages first.

## 🗣️ How to answer in an interview

> "TypeScript types are erased at runtime, so they can't protect me from data that comes from outside, like request bodies, third-party APIs, or AI responses. For that I use runtime validation.
>
> With Zod, I define a schema once, and I get both the runtime check and the TypeScript type through `z.infer`, so they never drift apart. I usually use `safeParse` at the edge. If it fails, I return a 400 with the field-level issues. If it passes, `result.data` is both checked and typed.
>
> Joi does the same job and is common in older Express APIs. The main advantage of Zod in a TypeScript codebase is the type inference."

[FILL IN: the SkillKeepr backend services validate with Joi — mention one place you added or changed a Joi schema. Only if it's true.]

## 🔁 Follow-up questions

### If the frontend already validates the form, why validate on the backend?

The frontend can be skipped. Anyone can call the API directly with curl or Postman. The backend must always validate. Frontend validation is only for a better user experience.

### How would you validate environment variables?

Make a schema like `z.object({ DATABASE_URL: z.url(), PORT: z.coerce.number().default(3000) })`. Then call `parse(process.env)` once at startup. If something is missing, the app stops with a clear message instead of failing later.

### Can the backend and frontend share the same schema?

Yes. Put the schemas in a shared package. The frontend uses them in forms (for example with React Hook Form's Zod resolver), and the backend uses them in routes. One schema, two places, the same rules.

### What does `z.infer` produce for an optional field?

A field like `email: z.email().optional()` becomes `email?: string | undefined` in the inferred type.

## ✅ Quick check

### 1. What does this print?

```ts
const S = z.object({ age: z.number() });       // age must be a number
console.log(S.safeParse({ age: '30' }).success); // ?
```

:::answer
**`false`.** `'30'` is a string. Use `z.coerce.number()` if you want strings like `'30'` to be turned into numbers.
:::

### 2. True or false: `const user: User = await res.json()` checks that the response matches `User`.

:::answer
**False.** It's only a type annotation, and types disappear at runtime. Nothing is checked. Use a schema's `safeParse` to check it.
:::

### 3. Which is the better place to validate a request body?

- A) Inside the database model, just before saving
- B) At the start of the route or in a middleware, before any logic runs
- C) In the React form only

:::answer
**B.** Validate at the edge, before any logic runs. C can be skipped by calling the API directly, and A is too late, because other code has already used the data.
:::
