---
title: Clean / hexagonal architecture
stack: mern-architectures
order: 13
level: Advanced
mustKnow: false
askedFrequency: sometimes
template: pattern
section: Backend structure
summary:
  - "Clean (or hexagonal) architecture puts your business rules in the centre. Express, MongoDB and outside APIs sit at the edge."
  - "The core only talks to \"ports\": simple promises like \"save a user\" or \"send an email\". It never imports Express or Mongoose."
  - "\"Adapters\" plug real tools into those ports: an Express route, a Mongoose repository, an email client."
  - The big wins are easy testing and easy swapping (for example, Mongo to Postgres, or Express to a Lambda handler).
  - It adds files and layers, so it pays off in big, long-lived apps, not in small CRUD apps.
cards:
  - q: What is the main rule of clean / hexagonal architecture?
    a: "Dependencies point inwards: the business core never imports Express, Mongoose or any outside tool. The outer layers depend on the core."
  - q: What is a port?
    a: "A small contract the core needs, like \"findUserByEmail\" or \"sendEmail\". It says what is needed, not how it is done."
  - q: What is an adapter?
    a: "Code that connects a real tool to a port, like a Mongoose repository or an Express route that calls a use case."
  - q: When is hexagonal architecture worth it?
    a: For large, long-lived apps with real business rules, many entry points (HTTP, queue, cron) or a chance of changing the database or framework.
---

## 💡 What is it?

**Clean architecture** and **hexagonal architecture** are two names for one big idea. Your **business rules** live in the centre of the app. Tools like Express, MongoDB and email services live at the **edge**.

The centre never talks to those tools directly. It only says what it needs, like "save this user". The edge decides **how** to do it.

Hexagonal architecture is also called **ports and adapters**. A **port** is what the core needs. An **adapter** is the real tool that fills that need.

## 🏠 Real-life example

Think of **a phone charger and a wall socket** when you travel to another country.

Your phone (the core) only needs "electricity through a USB cable". It doesn't care if the wall socket is Indian, British or American. You just change the **travel adapter**.

- **Your phone** = the business core (the rules, like "a user's email must be unique").
- **The USB port on the phone** = a port: "I need power in this shape".
- **The travel adapter** = an adapter: the Mongoose repository or the Express route.
- **Different wall sockets** = different tools: MongoDB, PostgreSQL, a fake in-memory store for tests.
- **Changing countries** = changing the database or framework. Only the adapter changes. The phone stays the same.

## 🗺️ The diagram

```text
             ┌──────────────── ADAPTERS (the edge) ─────────────────┐
  React ───► │  Express route  ─┐                ┌─► Mongoose repo  │ ──► MongoDB
             │  Lambda handler ─┤                ├─► Email client   │ ──► Email service
             │  Queue worker   ─┤                └─► Payment client │ ──► Stripe
             │                  ▼                ▲                  │
             │       ┌──────── CORE (the centre) ┴──────┐           │
             │       │  Use cases: registerUser, ...    │           │
             │       │  Rules: "email must be unique"   │           │
             │       │  Ports: userRepo, mailer         │           │
             │       └──────────────────────────────────┘           │
             └──────────────────────────────────────────────────────┘

  Arrows into the core = "driving" adapters (they call the core).
  Arrows out of the core = "driven" adapters (the core calls them through ports).
  The core imports nothing from the edge.
```

## 🧑‍💻 Code example

Set up and run:

```bash
npm init -y
npm install express
node hex.js
```

Save this as `hex.js`. In a real project each part would be its own file. Here they are in one file so you can run it.

```js
const express = require('express');                                   // load Express (only the edge uses it)

// ---------- CORE: business rules only. No Express, no Mongoose here. ----------
function makeRegisterUser({ userRepo, mailer }) {                     // a use case; userRepo and mailer are its ports
  return async function registerUser({ name, email }) {              // the use case itself
    if (!email || !email.includes('@')) {                            // business rule: email must look valid
      throw new Error('INVALID_EMAIL');                               // a plain error the core understands
    }                                                                 // end of email check
    const existing = await userRepo.findByEmail(email);               // ask the port: is this email taken?
    if (existing) throw new Error('EMAIL_TAKEN');                     // business rule: emails are unique
    const user = await userRepo.save({ name, email });                // ask the port to save the user
    await mailer.send(email, `Welcome, ${name}!`);                    // ask the port to send a welcome mail
    return user;                                                      // give the new user back
  };                                                                  // end of registerUser
}                                                                     // end of makeRegisterUser

// ---------- DRIVEN ADAPTERS: real tools that fill the ports ----------
const rows = [];                                                      // fake table, so the demo needs no database
const memoryUserRepo = {                                              // an adapter for the userRepo port
  findByEmail: async (email) => rows.find((u) => u.email === email),  // look up a user by email
  save: async (u) => { const user = { id: rows.length + 1, ...u }; rows.push(user); return user; }, // add a row
};                                                                    // end of memoryUserRepo
const consoleMailer = {                                               // an adapter for the mailer port
  send: async (to, text) => console.log(`📧 to ${to}: ${text}`),      // "send" by printing
};                                                                    // end of consoleMailer

// ---------- DRIVING ADAPTER: Express turns HTTP into a use-case call ----------
const registerUser = makeRegisterUser({ userRepo: memoryUserRepo, mailer: consoleMailer }); // wire core + adapters
const app = express();                                                // create the Express app
app.use(express.json());                                              // read JSON request bodies
app.post('/users', async (req, res) => {                              // route: POST /users
  try {                                                               // try to run the use case
    const user = await registerUser(req.body);                        // call the core with plain data (not req)
    res.status(201).json(user);                                       // 201 = created
  } catch (err) {                                                     // the core said no
    const status = { INVALID_EMAIL: 400, EMAIL_TAKEN: 409 }[err.message] ?? 500; // 400 = bad input, 409 = conflict
    res.status(status).json({ error: err.message });                  // send the error back
  }                                                                   // end of try/catch
});                                                                   // end of the route
app.listen(3000, () => console.log('Listening on 3000'));             // start the server on port 3000
```

Try it twice with the same email:

```text
$ curl -X POST -H "Content-Type: application/json" -d '{"name":"Asha","email":"asha@example.com"}' localhost:3000/users
{"id":1,"name":"Asha","email":"asha@example.com"}
$ curl -X POST -H "Content-Type: application/json" -d '{"name":"Asha","email":"asha@example.com"}' localhost:3000/users
{"error":"EMAIL_TAKEN"}
```

To use MongoDB, you only write a new `mongoUserRepo` with the same two functions. `makeRegisterUser` doesn't change.

## 🔍 Deeper version

**The dependency rule.** Code dependencies point **inwards** only. The core knows nothing about the outer rings. The outer rings import the core.

Clean architecture (from Robert C. Martin) draws this as circles:

| Ring | What lives there | MERN example |
|---|---|---|
| Entities | Core business objects and rules | `User` rules: email unique, role must be valid |
| Use cases | One action the app can do | `registerUser`, `scheduleInterview` |
| Interface adapters | Converters between the core and tools | Express controllers, Mongoose repositories, DTO mappers |
| Frameworks and drivers | The tools themselves | Express, Mongoose, MongoDB, AWS SDK |

Hexagonal architecture (from Alistair Cockburn) says the same thing with "ports and adapters":
- **Driving (primary) adapters** call the core: an Express route, a Lambda handler, a queue worker, a CLI script.
- **Driven (secondary) adapters** are called by the core: the database, email, payments, file storage.

**Ports in JavaScript.** JS has no interfaces, so a port is just "an object with these functions". In TypeScript, you write a real `interface`:

```ts
export interface UserRepo {                                      // the port, owned by the core
  findByEmail(email: string): Promise<User | null>;              // what the core needs
  save(data: NewUser): Promise<User>;                            // what the core needs
}                                                                // end of UserRepo
```

The Mongoose adapter then does `class MongoUserRepo implements UserRepo`. TypeScript checks that it fills the port.

**Mapping data at the edge.** Don't let Mongoose documents leak into the core. The adapter turns a document into a plain object (for example with `.lean()` and mapping `_id` to `id`). Then the core never depends on Mongoose types.

**Many entry points, one core.** The same `registerUser` can be called from an Express route, a Lambda handler and a bulk-import worker. This is the main reason big serverless apps like this style. See [serverless MERN](topic:mern-architectures/serverless-mern).

**How it compares to the layered style.** [Layered](topic:mern-architectures/layered) is controller → service → repository. The service often imports the Mongoose model directly. Clean architecture flips that last arrow. The service defines the repository port, and Mongoose plugs into it. NestJS gets close to this with [providers and dependency injection](topic:nestjs/dependency-injection).

## ⚖️ Pros and cons

| Pros | Cons |
|---|---|
| Business rules are easy to unit test with fakes, no database needed | More files, folders and mapping code |
| Swap the database, framework or email provider by writing one adapter | Overkill for simple CRUD apps |
| Same core works for HTTP, queues, crons and Lambda | New developers need time to learn where things go |
| Framework upgrades (like Express 4 → 5) touch only the edge | Easy to over-abstract things that will never change |

## 🎯 When to choose it

- **A big SaaS product with real business rules** (billing, scoring, scheduling) that will live for years.
- **Many ways in:** the same logic runs from an API, a queue worker, a cron job and an admin script.
- **A likely tool change:** for example, moving part of the data from MongoDB to PostgreSQL.
- **Not for:** a small CRUD app, a hackathon project or an MVP. Start with [MVC](topic:mern-architectures/mvc) or [layered](topic:mern-architectures/layered) and move here only when it hurts.

## ⚠️ Common mistakes

- **Importing Mongoose models inside a use case.** Then the core depends on the database, and the whole idea is lost.
- **Passing `req` and `res` into the core.** Pass plain data (`{ name, email }`) and return plain results.
- **Making a port for everything.** You don't need an interface for `Math.random` or a date formatter. Add ports for real outside systems.
- **Throwing HTTP errors from the core.** The core throws business errors (`EMAIL_TAKEN`). The Express adapter turns them into status codes.

## 🗣️ How to answer in an interview

> "Clean or hexagonal architecture keeps the business rules in the centre and pushes frameworks and databases to the edge. The core defines ports, like a user repository or a mailer, and adapters plug real tools into them: a Mongoose repository, an email client, an Express route or a Lambda handler.
>
> The key rule is that dependencies point inwards. The core never imports Express or Mongoose. That makes the use cases easy to unit test with fakes, and it lets the same use case run from an API, a queue worker or a cron.
>
> I'd use it for a large, long-lived product with real business logic. For a small CRUD service, a simple layered structure is enough, and I'd only move towards ports and adapters when a real need shows up."

[FILL IN: if your SkillKeepr services kept business logic separate from the Lambda handler or Mongoose code, describe how in one sentence. Only say what was really done.]

## 🔁 Follow-up questions

### Is hexagonal architecture the same as clean architecture?

They are very close. Both keep business rules in the centre and tools at the edge, with dependencies pointing inwards. Hexagonal talks about "ports and adapters". Clean architecture adds named rings like entities and use cases.

### Where does validation go?

Two places. Shape checks (is `email` a string?) go at the edge, for example with Joi in the Express adapter. Business rules (is this email already taken?) go in the core use case.

### How do you test it?

Unit test use cases with fake adapters, like an in-memory repo. Then write a few integration tests for each real adapter, like the Mongoose repository against a test database.

### Doesn't this slow the team down?

At the start, a little. It pays off when the app grows, rules get complex, or tools change. For small apps, the extra layers cost more than they save.

## ✅ Quick check

### 1. Which line breaks the dependency rule if it is inside a use case?

- A) `const user = await userRepo.findByEmail(email);`
- B) `const User = require('../models/User');`
- C) `throw new Error('EMAIL_TAKEN');`

:::answer
**B.** The core is importing a Mongoose model, so it now depends on the database. It should use the `userRepo` port (A).
:::

### 2. Is an Express route a driving or a driven adapter?

:::answer
**Driving.** It calls into the core. Driven adapters (database, email) are called by the core.
:::

### 3. You switch from MongoDB to PostgreSQL. Which code should change?

:::answer
Only the **driven adapter** (the repository) and the wiring. The use cases and business rules stay the same.
:::
