---
title: Middleware in Nest
stack: nestjs
order: 12
level: Intermediate
mustKnow: false
askedFrequency: common
summary:
  - "Nest middleware is the same idea as Express middleware: a function with (req, res, next) that runs before the route."
  - Middleware runs first in the request lifecycle, before guards, interceptors and pipes.
  - "You can write it as a class (with @Injectable() and use()) or as a plain function."
  - "You attach it in a module with configure(consumer) and consumer.apply(...).forRoutes(...)."
  - Middleware doesn't know which handler will run, so use guards for auth decisions and pipes for input checks.
cards:
  - q: What is middleware in NestJS?
    a: A function or class that runs before the route handler with access to req, res and next(), just like Express middleware.
  - q: How do you register class middleware in Nest?
    a: "Make the module implement NestModule, then in configure(consumer) call consumer.apply(LoggerMiddleware).forRoutes('cats')."
  - q: What happens if middleware doesn't call next()?
    a: The request hangs, unless the middleware sends a response itself.
  - q: Middleware or guard for checking a user's role?
    a: "A guard. Guards know which handler runs next (ExecutionContext), so they can read role metadata. Middleware can't."
  - q: How do you skip some routes?
    a: "Use consumer.apply(X).exclude({ path: 'health', method: RequestMethod.GET }).forRoutes(CatsController)."
---

## 💡 What is it?

[Middleware](glossary:middleware) is code that runs **before** your route handler. It gets the request (`req`), the response (`res`) and a `next()` function.

In NestJS, middleware works just like in [Express](topic:express/middleware). In fact, Nest uses Express by default, so it's the same thing.

Middleware is the **first** thing in Nest's request flow. It's good for simple jobs like logging or adding a request ID.

## 🏠 Real-life example

Think of **the security gate of an apartment building**.

Every visitor passes the gate first. The guard writes the name and time in a register. Then the visitor goes up to any flat.

- **The visitor** = the incoming request.
- **The gate register** = logging middleware. It notes every request.
- **Opening the gate** = calling `next()`. The request moves on.
- **Not opening the gate** = not calling `next()`. The visitor is stuck.
- **The gate guard doesn't know which flat you visit** = middleware doesn't know which handler will run. Room-level checks are done by [guards](topic:nestjs/guards).

## 🧑‍💻 Code example

Create a project with `npx @nestjs/cli new mw-demo`. Add the file `src/logger.middleware.ts`, then update `src/app.module.ts`. Run it with `npm run start:dev`.

`src/logger.middleware.ts`:

```ts
import { Injectable, NestMiddleware } from '@nestjs/common';          // load the decorator and the middleware interface
import { Request, Response, NextFunction } from 'express';           // Express types, because Nest uses Express by default

@Injectable()                                                         // lets Nest create it and inject things into it
export class LoggerMiddleware implements NestMiddleware {             // a class middleware must have use()
  use(req: Request, res: Response, next: NextFunction) {              // req = request, res = response, next = go on
    const start = Date.now();                                         // remember the start time in milliseconds
    res.on('finish', () => {                                          // runs when the response has been sent
      const ms = Date.now() - start;                                  // how long the request took
      console.log(`${req.method} ${req.originalUrl} ${res.statusCode} ${ms}ms`); // e.g. GET / 200 3ms
    });                                                               // end of the finish listener
    next();                                                           // pass the request on; without this it hangs
  }                                                                   // end of use
}                                                                     // end of LoggerMiddleware
```

`src/app.module.ts`:

```ts
import { Module, NestModule, MiddlewareConsumer, RequestMethod } from '@nestjs/common'; // load module tools
import { AppController } from './app.controller';                    // the default controller from nest new
import { AppService } from './app.service';                          // the default service from nest new
import { LoggerMiddleware } from './logger.middleware';              // our middleware

@Module({                                                             // describe this module
  controllers: [AppController],                                       // routes in this module
  providers: [AppService],                                            // services in this module
})                                                                    // end of @Module
export class AppModule implements NestModule {                        // NestModule = this module sets up middleware
  configure(consumer: MiddlewareConsumer) {                           // Nest calls this at startup
    consumer                                                          // the helper that attaches middleware
      .apply(LoggerMiddleware)                                        // which middleware to use
      .exclude({ path: 'health', method: RequestMethod.GET })         // skip GET /health (too noisy)
      .forRoutes(AppController);                                      // run for every route in this controller
  }                                                                   // end of configure
}                                                                     // end of AppModule
```

Try it:

```text
$ curl http://localhost:3000/
Hello World!

Server terminal:
GET / 200 3ms
```

## 🔍 Deeper version

**Two ways to write middleware:**

| Type | How | When |
|---|---|---|
| Class middleware | `@Injectable()` class with `use(req, res, next)` | It needs injected services (config, logger) |
| Functional middleware | `export function logger(req, res, next) { … next(); }` | It needs nothing injected. Simpler. |

**Binding options** with `MiddlewareConsumer`:
- `.apply(A, B)` runs A, then B, in that order.
- `.forRoutes('cats')`, `.forRoutes({ path: 'cats', method: RequestMethod.POST })` or `.forRoutes(CatsController)`.
- `.exclude(...)` skips some routes.

**Global middleware.** In `main.ts`, `app.use(helmet())` adds middleware for the whole app. This works for plain functions like `helmet` or `cors`. It can't use DI. For class middleware with DI, register it in a module with `forRoutes`.

**Where it sits in the lifecycle:**

```text
Request → Middleware → Guards → Interceptors (before) → Pipes → Handler → Interceptors (after) → Exception filters → Response
```

**What middleware can't do.** It runs before Nest picks the handler's details. So it has no `ExecutionContext` (Nest's object that tells you which class and method will run). It can't read [metadata](glossary:metadata) like `@Roles('admin')`. That is why auth checks belong in [guards](topic:nestjs/guards).

:::version[Version note]
NestJS 11 moved to Express 5 by default. Express 5 changed how wildcard paths are written: a bare `*` became a named wildcard like `*splat`. If you match "all routes" with a path string in `forRoutes`, check the current Nest docs for the right wildcard. Passing a controller class avoids the problem.
:::

## 🎯 Why do we use it?

- **Cross-cutting jobs that don't care about the handler:** logging, request IDs, security headers (`helmet`), CORS, body parsing.
- **Reuse Express middleware.** Almost any Express middleware package works in Nest.
- **Run early.** It can stop a bad request before Nest does more work.

## ⚠️ Common mistakes

- **Forgetting `next()`.** The request hangs until it times out.
- **Doing role checks in middleware.** Middleware can't see `@Roles()` metadata. Use a guard.
- **Expecting DI in `app.use(new MyMiddleware())`.** That copy is created by you, not Nest, so nothing gets injected.
- **Forgetting `implements NestModule`.** Without the `configure` method, Nest never attaches the middleware.

## 🗣️ How to answer in an interview

> "Middleware in NestJS is the same as Express middleware: it gets req, res and next, and it runs first in the request lifecycle, before guards, interceptors and pipes.
>
> I can write it as an injectable class with a use method, or as a plain function. I register it in a module that implements NestModule, using consumer.apply(...).forRoutes(...), with exclude for routes like health checks.
>
> I use middleware for things that don't depend on the handler, like logging, request IDs and helmet. For auth and roles I'd use a guard, because a guard gets the ExecutionContext and can read decorators like @Roles. I've written a lot of Express middleware. I haven't used Nest in production, but this maps directly."

## 🔁 Follow-up questions

### Can I use existing Express middleware like helmet or cors in Nest?

Yes. Call `app.use(helmet())` in `main.ts`. For CORS, Nest also has `app.enableCors()`.

### What is the difference between middleware and an interceptor?

Middleware runs only **before** the handler and doesn't know the handler. An [interceptor](topic:nestjs/interceptors) wraps the handler. It runs before **and after**, and can change the result.

### Can middleware be async?

Yes. Make `use` an `async` function, and call `next()` after your `await` finishes.

### In which order does middleware run?

Global middleware (`app.use`) runs first. Then module middleware runs in the order you applied it.

## ✅ Quick check

### 1. What runs first for a request in NestJS?

- A) Guard
- B) Pipe
- C) Middleware
- D) Interceptor

:::answer
**C) Middleware.** It is the first step, before guards, interceptors and pipes.
:::

### 2. Your middleware logs the request but the client waits forever. Why?

:::answer
The middleware **doesn't call `next()`** (and doesn't send a response). Nest never moves to the next step.
:::

### 3. True or false: middleware can read `@Roles('admin')` metadata on the handler.

:::answer
**False.** Middleware has no `ExecutionContext`. Use a guard with `Reflector` to read handler metadata.
:::
