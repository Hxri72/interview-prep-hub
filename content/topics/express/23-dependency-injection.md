---
title: Dependency injection basics in Express
stack: express
order: 23
level: Advanced
mustKnow: false
askedFrequency: sometimes
summary:
  - "Dependency injection (DI) means a piece of code gets the things it needs (database, mailer, logger) from outside, instead of creating or requiring them itself."
  - In Express, the simple way is factory functions: createUserService({ userRepo, mailer }) and createApp({ userService }).
  - All the real parts are wired together in one place, called the composition root (often server.js).
  - The big win is testing. You pass in fake versions (an in-memory repo, a fake mailer) without jest.mock tricks.
  - DI containers (awilix, tsyringe, NestJS) automate the wiring, but plain functions are enough for most Express apps.
cards:
  - q: What is dependency injection?
    a: Giving a function or class the things it depends on (DB, mailer, config) from the outside, instead of it creating or importing them itself.
  - q: How do you do DI in a plain Express app?
    a: "With factory functions that take their dependencies as arguments, e.g. createUserService({ userRepo, mailer }) and createApp({ userService }), wired together in server.js."
  - q: What is a composition root?
    a: The single place (usually the app's entry file) where real implementations are created and connected together.
  - q: Why does DI make testing easier?
    a: You can pass fake dependencies (in-memory repo, fake mailer) directly into the code under test, so tests are fast, isolated and don't need module mocking.
  - q: Name a DI container for Node.js.
    a: awilix, tsyringe, InversifyJS, or the built-in DI in NestJS.
---

## 💡 What is it?

Most code **depends** on other things. A user service needs a database to save users. It needs a mailer to send emails. These are its **dependencies**.

**Dependency injection** (DI) means: the code doesn't create or `require` its dependencies itself. Instead, someone **gives** them to it from outside, usually as function arguments.

In Express, the simple way is to write **factory functions**. A factory function takes its dependencies and returns a ready-to-use service or app.

## 🏠 Real-life example

Think of **a cooking competition on TV**.

Each cook gets a basket of ingredients from the organisers. The cook doesn't go to the market. They just cook with whatever is in the basket.

During **practice**, the organisers give cheap ingredients. On the **final day**, they give the real, expensive ones. The cook's skill and steps stay exactly the same.

- **The cook** = your service, like `userService`.
- **The ingredients** = its dependencies: the database repo and the mailer.
- **The organisers handing over the basket** = the composition root, which creates and passes in the dependencies.
- **Cheap practice ingredients** = fake repos and fake mailers in tests.
- **Real ingredients on the final day** = the real database and email service in production.
- **A cook who must buy their own ingredients** = code that does `require('./db')` inside. You can't easily swap anything.

## 🧑‍💻 Code example

Set up:

```bash
npm init -y
npm install express
```

Save this as `di.js`. Run it with `node di.js`.

```js
const express = require('express');                                 // load Express

function createUserService({ userRepo, mailer }) {                  // a service gets its tools from outside (injected)
  return {                                                          // return an object with the service's functions
    async register(name, email) {                                   // business logic: register a user
      const user = await userRepo.create({ name, email });          // save using whatever repo we were given
      await mailer.send(email, `Welcome, ${name}!`);                // send mail using whatever mailer we were given
      return user;                                                  // give the new user back
    },                                                              // end of register
  };                                                                // end of the service object
}                                                                   // end of createUserService

function createApp({ userService }) {                               // the app also receives its service from outside
  const app = express();                                            // create the Express app
  app.use(express.json());                                          // read JSON bodies
  app.post('/users', async (req, res) => {                          // route: register a user
    const user = await userService.register(req.body.name, req.body.email); // call the injected service
    res.status(201).json(user);                                     // 201 = created
  });                                                               // end of the route
  return app;                                                       // give the app back (no listen here)
}                                                                   // end of createApp

// ---- the "composition root": the ONE place where real parts are wired together ----
const users = [];                                                   // a fake database table for this demo
const userRepo = { create: async (u) => { const user = { id: users.length + 1, ...u }; users.push(user); return user; } }; // fake repo
const mailer = { send: async (to, text) => console.log(`📧 to ${to}: ${text}`) }; // fake mailer that just prints
const app = createApp({ userService: createUserService({ userRepo, mailer }) }); // wire everything together

app.listen(3000, () => console.log('Listening on 3000'));           // start the server on port 3000
```

Try it:

```text
$ curl -X POST -H "Content-Type: application/json" \
    -d '{"name":"Asha","email":"asha@example.com"}' http://localhost:3000/users
{"id":1,"name":"Asha","email":"asha@example.com"}

Server terminal:
Listening on 3000
📧 to asha@example.com: Welcome, Asha!
```

In a real app, you'd only change the composition root. You'd pass a Mongoose-based repo and a real email client. `createUserService` and `createApp` stay exactly the same.

## 🔍 Deeper version

**Without DI vs with DI:**

```js
// Without DI: the service grabs its own dependencies
const User = require('../models/User');          // hard-wired to Mongoose
const mailer = require('../lib/sendgrid');        // hard-wired to one email provider
exports.register = async (name, email) => { /* uses User and mailer directly */ };

// With DI: the service receives them
const createUserService = ({ userRepo, mailer }) => ({ register: async (name, email) => { /* … */ } });
```

The first version is shorter. But to test it, you must use `jest.mock('../models/User')` and `jest.mock('../lib/sendgrid')`. These mocks depend on file paths and are easy to break.

**Testing with DI is just passing objects:**

```js
const sent = [];                                                   // remember what the fake mailer "sent"
const service = createUserService({
  userRepo: { create: async (u) => ({ id: 1, ...u }) },           // fake repo, no database needed
  mailer: { send: async (to) => sent.push(to) },                  // fake mailer
});
await service.register('Asha', 'asha@example.com');                // run the real business logic
expect(sent).toEqual(['asha@example.com']);                        // check the email was "sent"
```

**Layers and DI.** DI fits the usual layered structure:
- **Routes / controllers** get services.
- **Services** get repositories and clients (mailer, payment, queue).
- **Repositories** get the database connection.

Each layer only knows the *shape* of the layer below, not how it's built. See [project structure](topic:express/project-structure).

**The composition root.** All `new`/`create` calls for real parts live in one file, usually `server.js` or `container.js`. It reads config, connects the database, builds repos, builds services, builds the app and calls `listen`. So there's exactly one place to change when you swap a part.

**DI containers.** A container is a library that does the wiring for you. You register parts by name, and it builds them in the right order.
- **awilix** is popular with Express and works with plain functions.
- **tsyringe** and **InversifyJS** use TypeScript decorators.
- **NestJS** has DI built in. Classes ask for dependencies in their constructor.

For small and medium Express apps, plain factory functions are usually enough. A container helps when you have dozens of services.

**Other ways to inject in Express:**
- Put shared objects on `app.locals` (like `app.locals.db`), and read them in routes with `req.app.locals.db`.
- Attach per-request things in middleware, like `req.user` or `req.log` with the request ID.

These are simple, but they're a bit hidden. Plain arguments are clearer.

## 🎯 Why do we use it?

- **Easy testing.** Pass fake parts straight in. Tests are fast, need no real database, and don't break when files move.
- **Easy swapping.** Change the email provider or the database layer in one place.
- **Clear dependencies.** The function signature shows exactly what the code needs.
- **Fewer hidden globals.** No surprise `require` that connects to a real service as soon as a file loads.

## ⚠️ Common mistakes

- **Requiring the database inside every service file.** You can't test without heavy module mocking, and swapping gets painful.
- **Wiring things in many places.** Creating a new DB connection inside each service wastes connections and causes bugs. Wire once, in the composition root.
- **Over-engineering a tiny app.** A 3-route app doesn't need a DI container and interfaces for everything. Use plain factory functions.
- **Passing the whole `req` into services.** Then services depend on Express. Pass only the values they need, like `userId` and `body`.

## 🗣️ How to answer in an interview

> "Dependency injection means a module receives what it depends on, like the database repository, the mailer or the config, from outside, instead of requiring or creating it itself.
>
> In Express I do it with factory functions. `createUserService({ userRepo, mailer })` returns the service. `createApp({ userService })` returns the Express app. Then one composition root, usually `server.js`, creates the real Mongoose repos and clients and wires everything together.
>
> The main benefit is testing. I can pass an in-memory repo and a fake mailer straight into the service, with no `jest.mock` on file paths. It also makes swapping a provider a one-line change. For bigger codebases there are containers like awilix, and NestJS has DI built in. But plain functions are enough for most Express apps."

[FILL IN: how dependencies were shared in your SkillKeepr backend (e.g. the "reusable backend module patterns" on your resume) — only describe what was really done.]

## 🔁 Follow-up questions

### Is dependency injection the same as `require`?

No. With `require`, the module itself decides which dependency to load, and it's fixed at load time. With DI, the **caller** decides what to pass in, so you can pass different things in tests and in production.

### What's the difference between DI and a DI container?

DI is the idea: pass dependencies in. A container is a tool that builds and passes them for you automatically. You can do DI without a container, just with function arguments.

### How does NestJS do dependency injection?

You mark classes as `@Injectable()` and list dependencies in the constructor. Nest's built-in container creates one instance of each and gives it to every class that asks. In tests, you can override a provider with a fake.

### Doesn't DI make the code harder to follow?

It adds a little setup, but it makes dependencies visible. The danger is too much "magic" from containers. Plain factory functions keep it easy to follow.

## ✅ Quick check

### 1. Which version is easier to unit test?

- A) `const db = require('./db'); exports.getUser = (id) => db.find(id);`
- B) `const createUserService = ({ db }) => ({ getUser: (id) => db.find(id) });`

:::answer
**B.** You can pass a fake `db` straight in: `createUserService({ db: { find: async () => ({ id: 1 }) } })`. A needs module mocking.
:::

### 2. Where should the real database connection and services be created and wired together?

:::answer
In **one composition root**, usually `server.js` or `container.js`. The rest of the code only receives what it needs.
:::

### 3. True or false: you need a library like awilix to use dependency injection.

:::answer
**False.** Passing dependencies as function arguments is already DI. A container only automates the wiring.
:::
