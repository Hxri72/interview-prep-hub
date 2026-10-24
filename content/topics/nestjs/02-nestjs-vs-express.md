---
title: NestJS vs Express (and moving from Express)
stack: nestjs
order: 2
level: Basic
mustKnow: true
askedFrequency: very common
summary:
  - Express is small and flexible. You choose the structure. NestJS gives you a fixed structure on top of Express.
  - Express route + handler → Nest controller method. Express service file → Nest provider. Express middleware → Nest middleware, guards, pipes or interceptors.
  - Nest has DI, validation, guards, filters and testing tools built in. In Express you add these yourself.
  - Express is better for tiny APIs and full control. Nest is better for big apps and big teams.
  - Coming from Express, most ideas carry over. You mainly learn where each piece belongs in Nest.
cards:
  - q: Main difference between Express and NestJS?
    a: Express is minimal and unopinionated. NestJS is opinionated, with modules, controllers, providers and built-in DI, and runs on Express by default.
  - q: What does Express middleware become in Nest?
    a: Depends on the job. Auth checks → guards, validation → pipes, logging/response shaping → interceptors, error handling → exception filters. Plain middleware still exists too.
  - q: When pick Express over Nest?
    a: For small APIs, quick prototypes, or when you want full control with very little framework code.
  - q: Can you use Express middleware in Nest?
    a: Yes. Nest runs on Express by default, so app.use(helmet()) or a custom middleware class works.
---

## 💡 What is it?

**Express** is a small Node.js web framework. It gives you routes and [middleware](glossary:middleware), and you decide everything else.

**NestJS** runs on top of Express. It adds fixed rules: where code goes, how classes are created, and how validation and auth work.

If you know Express, you already know most of Nest. You mainly learn **which Nest piece replaces which Express habit**.

## 🏠 Real-life example

Think of **cooking at home vs working in a restaurant kitchen**.

- **Express** = your home kitchen. You cook any way you like. Great for one family, but messy if 20 cooks join.
- **NestJS** = a restaurant kitchen. Every cook has a station, fixed recipes, and a head chef who hands out tools.
- **The stove and gas** = Node.js and Express. Both kitchens use the same stove.
- **Stations (grill, salad, desserts)** = **modules**.
- **The head chef handing out knives and pans** = **dependency injection**.
- **A food-safety check at the door** = a **guard**.

## 🧑‍💻 Code example

The same "get user by id" route, first in Express, then in Nest.

**Express** — save as `express-app.js`, run with `node express-app.js` (after `npm install express`):

```js
const express = require('express');                         // load Express
const app = express();                                      // create the app

const userService = {                                       // a simple service object
  findOne: (id) => ({ id, name: 'Asha' }),                  // pretend database lookup
};                                                          // end of userService

app.get('/users/:id', (req, res) => {                       // route: GET /users/:id (:id = a value in the URL)
  const user = userService.findOne(Number(req.params.id));  // read id from the URL and turn it into a number
  res.json(user);                                           // send the user as JSON
});                                                         // end of route

app.listen(3000);                                           // start on port 3000
```

**NestJS** — in a `nest new` project, save as `src/users.controller.ts`. Add `UsersController` to `controllers` and `UsersService` to `providers` in `src/app.module.ts`. Run `npm run start:dev`.

```ts
import { Controller, Get, Injectable, Param, ParseIntPipe } from '@nestjs/common'; // load Nest decorators and a pipe

@Injectable()                                                // mark this class so Nest can create and inject it
export class UsersService {                                  // the service (a "provider")
  findOne(id: number) {                                      // pretend database lookup
    return { id, name: 'Asha' };                             // return a fake user
  }                                                          // end of findOne
}                                                            // end of UsersService

@Controller('users')                                         // routes in this class start with /users
export class UsersController {                               // the controller
  constructor(private readonly usersService: UsersService) {} // Nest passes in UsersService for us (DI)

  @Get(':id')                                                // GET /users/:id
  findOne(@Param('id', ParseIntPipe) id: number) {           // read :id and turn it into a number (400 if not a number)
    return this.usersService.findOne(id);                    // returning an object = Nest sends it as JSON
  }                                                          // end of findOne
}                                                            // end of UsersController
```

```text
$ curl http://localhost:3000/users/7
{"id":7,"name":"Asha"}

$ curl http://localhost:3000/users/abc
{"message":"Validation failed (numeric string is expected)","error":"Bad Request","statusCode":400}
```

Nest gave us the number check and the 400 error for free. In Express we would write that ourselves.

## 🔍 Deeper version

**Side-by-side comparison:**

| | Express | NestJS |
|---|---|---|
| Style | Minimal, unopinionated | Opinionated, structured |
| Language | JS or TS | TypeScript first |
| Routing | `app.get()`, `express.Router()` | `@Controller()`, `@Get()` decorators |
| Services | Plain modules / factory functions | `@Injectable()` providers |
| DI | Manual (see [DI in Express](topic:express/dependency-injection)) | Built-in IoC container |
| Validation | Joi/Zod middleware | `ValidationPipe` + DTO classes |
| Auth | Middleware | Guards |
| Errors | Error middleware `(err, req, res, next)` | Exception filters |
| Testing | Supertest + manual mocks | `TestingModule` + Supertest |
| Learning curve | Low | Medium (decorators, DI, modules) |
| Boilerplate | Little | More files per feature |

**Mapping Express habits to Nest:**

| You did this in Express | Do this in Nest |
|---|---|
| `router.get('/x', handler)` | A controller method with `@Get('x')` |
| `services/userService.js` | A class with `@Injectable()` |
| `requireAuth` middleware | A guard (`CanActivate`) |
| `validate(schema)` middleware | A pipe (`ValidationPipe` or a custom pipe) |
| Response wrapper / timing logs | An interceptor |
| `app.use((err, req, res, next) => …)` | An exception filter |
| `server.js` wiring | The root `AppModule` + `main.ts` |

**Performance.** Nest adds a small layer of its own, but the HTTP work is still done by Express or Fastify. For most APIs the difference is tiny. If speed matters a lot, switch Nest to the Fastify adapter.

**Mixing them.** Nest exposes the underlying app. You can call `app.use(helmet())` in `main.ts`, and you can use `@Req()` / `@Res()` to get the raw Express objects. Use `@Res()` rarely: it turns off Nest's normal response handling.

## 🎯 Why do we use it?

Comparing them helps you **pick the right tool**:
- A small service, a webhook receiver, or a quick prototype → Express is enough.
- A large API with many features and many developers → Nest's structure saves time and stops arguments about layout.

And if you already know Express, the map above lets you move to Nest quickly.

## ⚠️ Common mistakes

- **Saying Nest is "faster" than Express.** It runs on Express by default, so it's not faster. Its benefit is structure.
- **Copying Express patterns as-is.** Doing auth in plain middleware works, but guards are the Nest way. They know which route and handler will run.
- **Using `@Res()` everywhere.** You lose interceptors, automatic JSON and status handling.
- **Thinking you can't reuse Express middleware.** You can, with `app.use()` or Nest middleware classes.

## 🗣️ How to answer in an interview

> "Express is a minimal, unopinionated framework. You get routing and middleware and you design the rest yourself. NestJS sits on top of Express by default and adds an opinionated structure: modules, controllers, providers, and a built-in dependency injection container.
>
> The pieces map quite directly. An Express route becomes a controller method. A service file becomes an injectable provider. Auth middleware becomes a guard, validation middleware becomes a pipe, response wrappers become interceptors, and error middleware becomes an exception filter.
>
> I'd choose Express for small services or prototypes, and Nest for a larger codebase with a bigger team.
>
> My production experience is with Node.js and TypeScript in a serverless setup, not with Nest. But we used a shared library with authorizer decorators, a common response builder and Joi validation. That's the same separation Nest builds in, so moving to Nest was mostly learning where each piece goes."

## 🔁 Follow-up questions

### Is NestJS slower than Express?

Very slightly, because of its extra layer, but usually not in a way users notice. The database and network take far more time. For maximum speed, use Nest with the Fastify adapter.

### How would you migrate an Express app to Nest?

Step by step. Create a Nest app, then move one feature at a time into a module. Turn each router into a controller and each service into a provider. Turn auth middleware into guards. Keep the same URLs so clients don't notice.

### What does Nest give you that Express doesn't?

Built-in DI, a module system, DTO-based validation, guards, interceptors, exception filters, a testing module and a CLI that generates files.

### Is NestJS overkill for microservices?

Not always. Nest has a microservices package for message-based services. But for a single tiny function, plain Express or a bare handler is lighter.

## ✅ Quick check

### 1. In Nest, where does an Express `requireAuth` middleware usually go?

- A) A pipe
- B) A guard
- C) An exception filter

:::answer
**B) A guard.** Guards decide if a request may reach the handler. Pipes transform and validate input. Filters handle errors.
:::

### 2. What happens when the client calls `GET /users/abc` with `ParseIntPipe` on `id`?

:::answer
Nest sends **400 Bad Request** before the controller method runs, because `abc` is not a number.
:::

### 3. True or false: you can't use Express middleware like `helmet` in a Nest app.

:::answer
**False.** Nest runs on Express by default, so `app.use(helmet())` in `main.ts` works.
:::
