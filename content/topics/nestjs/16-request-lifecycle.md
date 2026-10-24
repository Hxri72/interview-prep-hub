---
title: The request lifecycle (the order of everything)
stack: nestjs
order: 16
level: Intermediate
mustKnow: true
askedFrequency: very common
summary:
  - "A request in NestJS passes through fixed steps: middleware → guards → interceptors (before) → pipes → your handler → interceptors (after) → response."
  - If anything throws an error on the way, an exception filter catches it and builds the error response.
  - "Inside each step, the order is global first, then controller level, then route level. Pipes on parameters run last."
  - "Interceptors wrap the handler: their 'after' part runs in the reverse order of their 'before' part."
  - Knowing the order tells you where to put each job: login check in a guard, data checks in a pipe, response shaping in an interceptor.
cards:
  - q: What is the order of the NestJS request lifecycle?
    a: Middleware → guards → interceptors (before) → pipes → route handler → interceptors (after) → response. Exception filters catch any error thrown along the way.
  - q: Do guards run before or after middleware?
    a: After. Middleware runs first, then guards decide if the request may continue.
  - q: Do pipes run before or after guards?
    a: After guards and after the 'before' part of interceptors, right before the handler gets its arguments.
  - q: Which exception filter handles an error if there are several?
    a: The most specific one. Route-level filters are checked first, then controller-level, then global. Only one filter handles each error.
  - q: Why does the order matter?
    a: It decides where each job belongs. For example, a guard can't see validated DTO data, because pipes run after guards.
---

## 💡 What is it?

When a request reaches a NestJS app, it doesn't go straight to your code. It passes through a **line of checkpoints** first. Each checkpoint has one job.

This fixed path is called the **request lifecycle**. If you know the order, you know where to put each piece of logic.

## 🏠 Real-life example

Think of **entering a cricket stadium for a match**.

1. **The main gate** writes down that you came in. It does the same for everyone.
2. **The ticket checker** looks at your ticket. No ticket? You are sent back.
3. **The usher** starts a timer and walks you in. Later, the usher will also walk you out.
4. **The security check** looks inside your bag. Bottles are removed or you are stopped.
5. **You watch the match.** This is the main event.
6. **The usher walks you out** and notes how long you stayed.
7. **The help desk** handles any problem on the way, like a lost ticket.

Mapping:

| Stadium | NestJS |
|---|---|
| Main gate | [Middleware](topic:nestjs/middleware) |
| Ticket checker | [Guard](topic:nestjs/guards) (may the request go on?) |
| Usher (in and out) | [Interceptor](topic:nestjs/interceptors) (before and after) |
| Bag check | [Pipe](topic:nestjs/pipes) (check and change the data) |
| Watching the match | Your route handler (the controller method) |
| Help desk | [Exception filter](topic:nestjs/exception-filters) (handles errors) |

## 🧑‍💻 Code example

This app logs a line from every step. Then you can see the order for yourself.

Set up:

```bash
npm i -g @nestjs/cli
nest new lifecycle-demo
cd lifecycle-demo
```

Replace `src/main.ts` with this code. Run it with `npm run start:dev`.

```ts
import { NestFactory } from '@nestjs/core';                          // creates the Nest app
import {                                                              // building blocks from Nest
  Module, Controller, Get, Param, Injectable,                         // app parts and route decorators
  CanActivate, ExecutionContext, NestInterceptor, CallHandler,        // types for the guard and interceptor
  PipeTransform, NestMiddleware, MiddlewareConsumer, NestModule,      // types for the pipe and middleware
  UseGuards, UseInterceptors,                                         // decorators to attach a guard / interceptor
} from '@nestjs/common';                                              // end of the import list
import { Observable, tap } from 'rxjs';                               // rxjs: the stream library Nest uses for interceptors
import type { Request, Response, NextFunction } from 'express';       // Express types (Nest uses Express by default)

@Injectable()                                                         // Nest can create this class for us
class LogMiddleware implements NestMiddleware {                       // a middleware class
  use(req: Request, res: Response, next: NextFunction) {              // runs for every matching request
    console.log('1. middleware');                                     // step 1
    next();                                                           // pass the request to the next step
  }                                                                   // end of use
}                                                                     // end of LogMiddleware

@Injectable()                                                         // Nest can create this class for us
class LogGuard implements CanActivate {                               // a guard decides "allowed or not"
  canActivate(context: ExecutionContext): boolean {                   // context = info about the current request
    console.log('2. guard');                                          // step 2
    return true;                                                      // true = let the request continue
  }                                                                   // end of canActivate
}                                                                     // end of LogGuard

@Injectable()                                                         // Nest can create this class for us
class LogInterceptor implements NestInterceptor {                     // an interceptor wraps the handler
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> { // next = the rest of the chain
    console.log('3. interceptor (before)');                           // step 3: before the handler
    return next.handle().pipe(                                        // run the handler and get its result as a stream
      tap(() => console.log('6. interceptor (after)')),               // step 6: after the handler has returned
    );                                                                // end of pipe
  }                                                                   // end of intercept
}                                                                     // end of LogInterceptor

@Injectable()                                                         // Nest can create this class for us
class LogPipe implements PipeTransform {                              // a pipe checks or changes one value
  transform(value: string) {                                          // value = the raw route param (always a string)
    console.log('4. pipe');                                           // step 4
    return value;                                                     // give the (unchanged) value to the handler
  }                                                                   // end of transform
}                                                                     // end of LogPipe

@Controller('items')                                                  // all routes here start with /items
class ItemsController {                                               // the controller
  @Get(':id')                                                         // GET /items/:id
  @UseGuards(LogGuard)                                                // attach the guard to this route
  @UseInterceptors(LogInterceptor)                                    // attach the interceptor to this route
  findOne(@Param('id', LogPipe) id: string) {                         // run LogPipe on the "id" param
    console.log('5. handler');                                        // step 5: our real code
    return { id };                                                    // Nest turns this object into JSON
  }                                                                   // end of findOne
}                                                                     // end of ItemsController

@Module({ controllers: [ItemsController] })                           // the root module lists our controller
class AppModule implements NestModule {                               // NestModule lets us add middleware
  configure(consumer: MiddlewareConsumer) {                           // Nest calls this at start-up
    consumer.apply(LogMiddleware).forRoutes(ItemsController);         // use LogMiddleware for every ItemsController route
  }                                                                   // end of configure
}                                                                     // end of AppModule

async function bootstrap() {                                          // start-up function
  const app = await NestFactory.create(AppModule);                    // build the app from the root module
  await app.listen(3000);                                             // 3000 = the port number
}                                                                     // end of bootstrap
bootstrap();                                                          // run it
```

Open `http://localhost:3000/items/7`. The terminal shows:

```text
1. middleware
2. guard
3. interceptor (before)
4. pipe
5. handler
6. interceptor (after)
```

The browser shows `{"id":"7"}`.

## 🔍 Deeper version

**The full order:**

```text
Incoming request
  → Middleware        (global, then module-bound)
  → Guards            (global → controller → route)
  → Interceptors      (before part: global → controller → route)
  → Pipes             (global → controller → route → parameter)
  → Route handler     (your controller method, which calls services)
  → Interceptors      (after part: route → controller → global, the reverse)
  → Response sent
Any error thrown on the way → Exception filters (route → controller → global)
```

**Words used above:**
- **Global** means it's set for the whole app, for example `app.useGlobalGuards(...)`.
- **Controller level** means a decorator on the controller class. It applies to every route in it.
- **Route level** means a decorator on one method.
- **Parameter level** means a pipe on one argument, like `@Param('id', ParseIntPipe)`.

**Why interceptors run "inside out".** An interceptor wraps everything after it. Think of it like layers of an onion. The outer layer starts first and finishes last. So the global interceptor's "after" code runs last.

**Exception filters.** Any step can throw an error, even middleware or a guard. Nest then looks for a filter. It checks route filters first, then controller, then global. The **first match handles it, and only that one**. If none matches, Nest's built-in filter sends a JSON error with the right [status code](glossary:status-code).

**What each step can see:**

| Step | Knows which handler will run? | Can change the data? | Typical job |
|---|---|---|---|
| Middleware | No | Yes (`req`, `res`) | logging, request IDs, raw body, cookies |
| Guard | Yes (via `ExecutionContext`) | No | [authentication](glossary:authentication), roles |
| Interceptor | Yes | Yes (input and output) | timing, response shape, caching |
| Pipe | Only its own argument | Yes (that one value) | validation, type conversion |
| Filter | Yes | Builds the error response | one error format |

This is the key difference between middleware and guards. Middleware doesn't know which route will run. A guard does, so it can read [metadata](glossary:metadata) like `@Roles('admin')` from the handler.

**A common trap.** Guards run **before** pipes. So a guard can't use a validated [DTO](glossary:dto). It only sees the raw `request.body`. If the auth check needs clean data, do it in the handler or service.

:::version[Version note]
The lifecycle order has stayed the same through NestJS 10, 11 and 12. NestJS 11 made Express 5 the default HTTP layer. That changed some route wildcard syntax, but not this order.
:::

## 🎯 Why do we use it?

- **Each job has one home.** Auth goes in a guard, validation in a pipe, response shape in an interceptor. The controller stays small.
- **Easier debugging.** If a request is blocked, you can ask "which step stopped it?" and check that step.
- **Reuse.** You write a guard once and attach it to many routes, or make it global.

## ⚠️ Common mistakes

- **Doing auth in middleware.** It works, but middleware can't see route metadata like `@Roles()`. Use a guard instead.
- **Expecting a guard to see the validated DTO.** Pipes run after guards, so the guard only sees raw data.
- **Thinking the global interceptor's "after" runs first.** It runs last, because interceptors wrap each other.
- **Forgetting that only one filter handles an error.** A global filter won't run if a route filter already caught that error.

## 🗣️ How to answer in an interview

> "In NestJS a request goes through a fixed pipeline. First middleware, then guards, then the 'before' part of interceptors, then pipes, and then the route handler. On the way back, the interceptors' 'after' part runs, in reverse order. If anything throws, an exception filter catches it, and the most specific filter wins.
>
> Within each type, global runs first, then controller, then route. Pipes on a parameter run last.
>
> I use this order to place logic. Auth and roles go in a guard, because guards can read route metadata. Validation goes in a pipe. Response wrapping and timing go in an interceptor.
>
> My production work is in Express and serverless Node. There I built the same ideas by hand: shared authorizer decorators, Joi validation and a common response builder. NestJS gives each of these a fixed place in the lifecycle, which is why I find it easy to map."

## 🔁 Follow-up questions

### Where does middleware run compared to guards?

Middleware runs first. Guards run after all middleware. That is why a guard can trust that things like a request ID or parsed cookies are already there.

### Can middleware or guards throw errors that filters catch?

Yes. An error from any step, including middleware and guards, goes to the exception filters. For example, a guard that returns `false` makes Nest throw a `ForbiddenException` (403).

### In what order do global, controller and route guards run?

Global first, then controller, then route. If any of them returns `false`, the rest don't run.

### Why do interceptors have a "before" and an "after" part?

Because `next.handle()` runs the handler and returns its result as a stream. Code before that call is "before". Code inside `.pipe(...)` runs on the result, so it is "after".

## ✅ Quick check

### 1. Put these in order: pipe, guard, middleware, handler.

:::answer
**Middleware → guard → pipe → handler.**
:::

### 2. A global interceptor and a route interceptor both log in their "after" part. Which logs first?

:::answer
**The route interceptor.** The "after" parts run in reverse order, so the global one (the outer layer) finishes last.
:::

### 3. You want to check `@Roles('admin')` on a route. Which piece should do it?

- A) Middleware
- B) Guard
- C) Pipe

:::answer
**B) Guard.** A guard knows which handler will run, so it can read the roles [metadata](glossary:metadata). Middleware can't.
:::
