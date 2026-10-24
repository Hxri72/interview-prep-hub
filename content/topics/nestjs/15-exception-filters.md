---
title: Exception filters and HttpException
stack: nestjs
order: 15
level: Intermediate
mustKnow: true
askedFrequency: very common
summary:
  - "In Nest, you send an error by throwing an HttpException, or a built-in one like NotFoundException (404) or BadRequestException (400)."
  - "Nest's built-in exception layer catches every error. Unknown errors become 500 Internal Server Error."
  - "An exception filter is a class with @Catch() and a catch(exception, host) method. It controls the error response."
  - "Use filters for one standard error format across the app, plus logging. @Catch() with no argument catches everything."
  - Filters are the last step in the request lifecycle. They run when anything earlier throws.
cards:
  - q: How do you return a 404 from a Nest handler?
    a: "Throw new NotFoundException('User not found'). Nest turns it into a 404 JSON response."
  - q: What happens if a handler throws a normal Error?
    a: "Nest's built-in filter sends 500 with { statusCode: 500, message: 'Internal server error' }."
  - q: What is an exception filter?
    a: "A class with @Catch(...) and catch(exception, host) that builds the error response for the exceptions it catches."
  - q: What does @Catch() with no arguments do?
    a: It catches every exception, including non-HTTP errors.
  - q: How do you register a global filter with DI?
    a: "Add { provide: APP_FILTER, useClass: AllExceptionsFilter } to a module's providers."
---

## 💡 What is it?

When something goes wrong in Nest, you **throw** an error. For example, `throw new NotFoundException()` sends a `404`.

Nest has a built-in **exception layer**. It catches every error and turns it into a JSON response. Unknown errors become `500 Internal Server Error`.

An **exception filter** lets you take control of that response. You decide what the error JSON looks like.

## 🏠 Real-life example

Think of **the complaint desk in a big shop**.

Any problem in the shop goes to one desk. A broken toy, a wrong bill, a lost bag. The desk writes every complaint on the same form and gives you a reply.

- **A problem in any part of the shop** = an error thrown anywhere: a guard, a pipe, a service.
- **A known problem, like "item out of stock"** = an `HttpException` with a clear [status code](glossary:status-code), like `404`.
- **A strange, unknown problem** = a normal `Error`. It becomes `500`.
- **The complaint desk** = the exception filter.
- **The same complaint form for everyone** = one standard error JSON shape for the whole API.

## 🧑‍💻 Code example

Create a project with `npx @nestjs/cli new filters-demo`. Add `src/all-exceptions.filter.ts`, replace `src/app.controller.ts`, and add one line to `src/main.ts`. Run it with `npm run start:dev`.

`src/all-exceptions.filter.ts`:

```ts
import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common'; // load Nest tools

@Catch()                                                              // empty @Catch() = catch EVERY error
export class AllExceptionsFilter implements ExceptionFilter {         // a filter must have catch()
  catch(exception: unknown, host: ArgumentsHost) {                    // exception = what was thrown; host = request info
    const ctx = host.switchToHttp();                                  // we are in an HTTP request
    const res = ctx.getResponse();                                    // the Express response object
    const req = ctx.getRequest();                                     // the Express request object

    const isHttp = exception instanceof HttpException;                // is it a known Nest HTTP error?
    const status = isHttp ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR; // known? use its code; else 500
    const message = isHttp ? exception.message : 'Something went wrong'; // never show internal error details

    if (!isHttp) console.error(exception);                            // log unknown errors on the server for debugging

    res.status(status).json({                                         // send one standard error shape
      success: false,                                                 // false = this is an error
      statusCode: status,                                             // e.g. 404 or 500
      message,                                                        // a short, safe message
      path: req.url,                                                  // which URL failed
      timestamp: new Date().toISOString(),                            // when it failed
    });                                                               // end of the JSON
  }                                                                   // end of catch
}                                                                     // end of AllExceptionsFilter
```

`src/app.controller.ts`:

```ts
import { Controller, Get, Param, NotFoundException } from '@nestjs/common'; // load Nest tools

@Controller('users')                                                  // routes start with /users
export class AppController {                                          // the controller
  @Get('crash')                                                       // GET /users/crash (put fixed routes before :id)
  crash() {                                                           // simulate a bug
    throw new Error('DB password is abc123');                         // an unknown error with a secret inside
  }                                                                   // end of crash

  @Get(':id')                                                         // GET /users/:id
  findOne(@Param('id') id: string) {                                  // id comes from the URL
    if (id !== '1') throw new NotFoundException(`User ${id} not found`); // only user 1 exists; others = 404
    return { id, name: 'Asha' };                                      // the found user
  }                                                                   // end of findOne
}                                                                     // end of AppController
```

In `src/main.ts`, after `const app = await NestFactory.create(AppModule);`:

```ts
import { AllExceptionsFilter } from './all-exceptions.filter';       // put this import at the top
app.useGlobalFilters(new AllExceptionsFilter());                      // use the filter for every route
```

Try it:

```text
$ curl http://localhost:3000/users/7
{"success":false,"statusCode":404,"message":"User 7 not found","path":"/users/7","timestamp":"2026-10-24T10:00:00.000Z"}

$ curl http://localhost:3000/users/crash
{"success":false,"statusCode":500,"message":"Something went wrong","path":"/users/crash","timestamp":"2026-10-24T10:00:01.000Z"}
```

The secret password stays in the server log. The client never sees it.

## 🔍 Deeper version

**Built-in HTTP exceptions** (all extend `HttpException`):

| Exception | Status |
|---|---|
| `BadRequestException` | 400 |
| `UnauthorizedException` | 401 |
| `ForbiddenException` | 403 |
| `NotFoundException` | 404 |
| `ConflictException` | 409 (like a duplicate email) |
| `UnprocessableEntityException` | 422 |
| `InternalServerErrorException` | 500 |

You can also throw `new HttpException({ code: 'PLAN_EXPIRED' }, 402)` with any body and status.

**Default behaviour (no custom filter).**
- `HttpException` → its status and a body like `{ statusCode, message, error }`.
- Anything else → `{ statusCode: 500, message: 'Internal server error' }`.

**Custom exceptions.** Extend `HttpException` to name your own errors:

```ts
export class PlanExpiredException extends HttpException {           // our own error type
  constructor() { super('Your plan has expired', HttpStatus.PAYMENT_REQUIRED); } // 402 = payment required
}                                                                    // end of PlanExpiredException
```

**`@Catch()` targets.**
- `@Catch(HttpException)` catches only HTTP errors.
- `@Catch(MongoServerError)` can turn a duplicate-key error (code `11000`) into a `409`.
- `@Catch()` with nothing catches everything.

**`ArgumentsHost`** is like `ExecutionContext` without the handler info. Use `switchToHttp()`, `switchToWs()` or `switchToRpc()` to get the right objects. So one filter can work for HTTP, WebSockets and [microservices](topic:nestjs/microservices).

**Binding:** `@UseFilters(X)` on a method or controller, `app.useGlobalFilters(new X())` globally without DI, or `{ provide: APP_FILTER, useClass: X }` globally with DI (for example, to inject a logger). Method-level filters win over global ones.

**`BaseExceptionFilter`.** Extend it and call `super.catch(exception, host)` to keep Nest's default response but add logging.

**Where filters sit.** Filters are the last step. An error thrown in middleware, a guard, an interceptor, a pipe, the handler or a service ends up here. See [the request lifecycle](topic:nestjs/request-lifecycle).

## 🎯 Why do we use it?

- **One error format.** The frontend can always read `success`, `statusCode` and `message` the same way.
- **No secret leaks.** Stack traces and database messages stay in the logs, not in the response.
- **Less code in handlers.** Just `throw new NotFoundException()`. No `try/catch` and `res.status()` everywhere.
- **Mapping errors.** Turn database or library errors into clear HTTP codes, like a duplicate key into `409`.

## ⚠️ Common mistakes

- **Throwing plain `Error` for user mistakes.** The client gets `500` instead of `400` or `404`. Throw the right `HttpException`.
- **Sending `exception.message` for unknown errors.** It may contain secrets or SQL. Send a safe message and log the real one.
- **Using `res.status().json()` in handlers and in filters.** Mixing both styles gets messy. Throw exceptions and let the filter respond.
- **Expecting DI in `useGlobalFilters(new X())`.** Use `APP_FILTER` if the filter needs a logger service.

## 🗣️ How to answer in an interview

> "In NestJS I don't write res.status in handlers. I throw an exception, like NotFoundException or BadRequestException, which all extend HttpException. Nest's built-in exception layer turns them into JSON, and anything unknown becomes a 500.
>
> To control the shape, I write an exception filter: a class with @Catch and a catch method that gets the exception and an ArgumentsHost. A global catch-all filter gives one error format, logs unknown errors, and hides internal details. I can also map database errors, like a Mongo duplicate key, to a 409.
>
> In Express I do the same with an error-handling middleware at the end. At SkillKeepr our services returned errors through a shared response builder. A global filter is the Nest version of that. I haven't used NestJS in production, but I've learned how these pieces fit."

## 🔁 Follow-up questions

### What is the difference between an exception filter and an interceptor's catchError?

An interceptor's `catchError` only sees errors from the handler side of its chain. A filter is the final catch for **all** errors, including ones from guards and middleware. Use filters for the app-wide error format.

### How do you return a 409 for a duplicate MongoDB email?

Write a filter with `@Catch(MongoServerError)`. If `exception.code === 11000`, send `409 Conflict`. Or catch the error in the service and throw `ConflictException`.

### What does `@Catch()` with no arguments mean?

It catches every exception, not just `HttpException`. Use it for a global catch-all filter.

### How is this different from Express error handling?

Express uses a middleware with four arguments `(err, req, res, next)`. Nest gives you typed exceptions and filters you can bind to one route, one controller or the whole app. See [Express error middleware](topic:express/error-middleware).

## ✅ Quick check

### 1. A handler runs `throw new Error('oops')`. There is no custom filter. What status does the client get?

:::answer
**500.** Nest's default filter turns unknown errors into `{"statusCode":500,"message":"Internal server error"}`.
:::

### 2. Which exception gives a 404?

- A) `BadRequestException`
- B) `ForbiddenException`
- C) `NotFoundException`
- D) `ConflictException`

:::answer
**C) `NotFoundException`.**
:::

### 3. A guard throws `UnauthorizedException`. Will a global exception filter catch it?

:::answer
**Yes.** Filters catch errors from every step: middleware, guards, interceptors, pipes and handlers.
:::
