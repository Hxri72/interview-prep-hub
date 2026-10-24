---
title: Interceptors
stack: nestjs
order: 14
level: Intermediate
mustKnow: true
askedFrequency: common
summary:
  - "An interceptor wraps the route handler. It can run code before the handler and after it."
  - "It implements NestInterceptor with intercept(context, next). next.handle() runs the handler and returns an RxJS Observable."
  - "After the handler, you change the result with RxJS operators like map, tap, catchError and timeout."
  - "Common uses: wrap every response in one format, log timing, cache responses, add a timeout, hide fields."
  - Interceptors run after guards and before pipes. Their "after" part runs in reverse order.
cards:
  - q: What is an interceptor in NestJS?
    a: A class that wraps the route handler, so it can run logic before and after it and change the result or the error.
  - q: What does next.handle() return?
    a: An RxJS Observable of the handler's result. You change it with operators like map or tap.
  - q: Name three uses of interceptors.
    a: A common response format ({ success, data }), logging how long a request took, and caching or timeouts.
  - q: Interceptor vs middleware?
    a: "Middleware runs only before and doesn't know the handler. An interceptor knows the handler (ExecutionContext) and runs before AND after, so it can change the response."
  - q: How do you add a 5-second timeout to every request?
    a: "Return next.handle().pipe(timeout(5000)) in an interceptor, and turn the TimeoutError into a RequestTimeoutException."
---

## 💡 What is it?

An **interceptor** **wraps** your route handler. It can run code **before** the handler and **after** it.

So an interceptor can see the result the handler returns. It can **change** that result before it goes to the client.

A common use is making every response look the same, like `{ success: true, data: … }`.

## 🏠 Real-life example

Think of **a gift shop that wraps presents**.

You buy a toy. Before you pay, the shopkeeper notes the time. After you pay, a helper wraps the toy in gift paper with a ribbon. Every gift leaves the shop looking the same.

- **The toy** = the data your handler returns.
- **Noting the time first** = the "before" part of the interceptor.
- **`next.handle()`** = the shop actually selling you the toy (the handler runs).
- **The gift wrapping** = the "after" part. It changes the result into `{ success, data }`.
- **Every gift looks the same** = every API response has one shape.

## 🧑‍💻 Code example

Create a project with `npx @nestjs/cli new interceptors-demo`. Add `src/wrap.interceptor.ts`. Then in `src/main.ts`, add the line shown below. Run it with `npm run start:dev`.

`src/wrap.interceptor.ts`:

```ts
import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common'; // load Nest tools
import { Observable, map, tap } from 'rxjs';                          // RxJS: Nest returns results as an Observable

@Injectable()                                                         // lets Nest create it
export class WrapInterceptor implements NestInterceptor {             // an interceptor must have intercept()
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> { // context = which route; next = the handler
    const req = context.switchToHttp().getRequest();                  // get the request object
    const start = Date.now();                                         // BEFORE: remember the start time

    return next.handle().pipe(                                        // run the handler, then work on its result
      tap(() => console.log(`${req.method} ${req.url} took ${Date.now() - start}ms`)), // AFTER: log the time (doesn't change data)
      map((data) => ({ success: true, data })),                       // AFTER: wrap the result in one standard shape
    );                                                                // end of pipe
  }                                                                   // end of intercept
}                                                                     // end of WrapInterceptor
```

Add this to `src/main.ts`, after `const app = await NestFactory.create(AppModule);`:

```ts
import { WrapInterceptor } from './wrap.interceptor';                 // put this import at the top of main.ts
app.useGlobalInterceptors(new WrapInterceptor());                     // use the interceptor for every route
```

Try it (the default route returns `'Hello World!'`):

```text
$ curl http://localhost:3000/
{"success":true,"data":"Hello World!"}

Server terminal:
GET / took 2ms
```

## 🔍 Deeper version

**The shape of `intercept`.**
- `context` is the `ExecutionContext`. It tells you the handler, the class and the request, like in [guards](topic:nestjs/guards).
- `next` is a `CallHandler`. Calling `next.handle()` runs the rest of the chain (pipes + handler).
- If you **never call** `next.handle()`, the handler never runs. A cache interceptor uses this to return a saved answer.

**Why RxJS?** `next.handle()` returns an **Observable**. An Observable is a stream of values over time, from the RxJS library. Nest uses it because a handler might return a value, a Promise or a stream. You change the result with **operators**:

| Operator | Use in an interceptor |
|---|---|
| `map` | change the response (wrap it, remove fields) |
| `tap` | do something without changing it (logging) |
| `catchError` | turn one error into another |
| `timeout` | fail if the handler is too slow |
| `of(value)` | return a value without calling the handler (cache hit) |

**Timeout example:**

```ts
return next.handle().pipe(
  timeout(5000),                                                     // 5000 ms = 5 seconds
  catchError((err) => throwError(() =>                               // turn the RxJS error into an HTTP one
    err instanceof TimeoutError ? new RequestTimeoutException() : err)), // 408, or the original error
);
```

**Binding.** `@UseInterceptors(X)` on a method or controller. `app.useGlobalInterceptors(new X())` for the whole app without DI. `{ provide: APP_INTERCEPTOR, useClass: X }` for the whole app with DI.

**Built-in helpers.**
- `ClassSerializerInterceptor` uses `class-transformer` to hide fields marked `@Exclude()`, like a password.
- `CacheInterceptor` from `@nestjs/cache-manager` caches GET responses.

**Order.** Interceptors run after guards and before pipes. If you have A and B, the "before" parts run A → B. The "after" parts run B → A, like layers of an onion. See [the request lifecycle](topic:nestjs/request-lifecycle).

## 🎯 Why do we use it?

- **One response format.** Wrap every result as `{ success, data }` in one place, not in every handler.
- **Logging and timing.** Measure every request without touching the handlers.
- **Caching and timeouts.** Skip the handler, or stop it if it is too slow.
- **Shaping data.** Remove secret fields or rename keys before the response leaves.

## ⚠️ Common mistakes

- **Forgetting to return `next.handle()`.** The handler never runs, and the request hangs or returns nothing.
- **Changing data inside `tap`.** `tap` is for side jobs. Use `map` to change the response.
- **Wrapping error responses here too.** Errors skip `map`. Format errors in an [exception filter](topic:nestjs/exception-filters).
- **Using an interceptor for auth.** Interceptors run after guards. Auth checks belong in a guard.

## 🗣️ How to answer in an interview

> "An interceptor wraps the route handler, like the decorator pattern. It implements NestInterceptor, and in intercept I get the ExecutionContext and a CallHandler. Code before next.handle() runs before the handler. next.handle() returns an RxJS Observable, so I use operators like map, tap, catchError and timeout to work on the result afterwards.
>
> I'd use it for a standard response envelope, logging response time, caching, timeouts, and hiding fields with ClassSerializerInterceptor.
>
> At SkillKeepr our shared backend library had a response builder that gave every API the same response shape. In NestJS, a global interceptor is the natural place for that. I haven't used Nest in production, but the idea is the same."

## 🔁 Follow-up questions

### What is the difference between an interceptor and middleware?

Middleware runs only **before** and doesn't know the handler. An interceptor gets the `ExecutionContext` and runs **before and after**. So it can change the response.

### Can an interceptor stop the handler from running?

Yes. Return a value with `of(cachedValue)` and don't call `next.handle()`. Caching interceptors work this way.

### Why does NestJS use RxJS here?

The handler can return a plain value, a Promise or a stream. An Observable can represent all of them. RxJS operators then give one way to change, delay or retry the result.

### Can interceptors handle errors?

Yes, with `catchError`. For example, turn a timeout into `408 Request Timeout`. But for a common error format across the app, an exception filter is the usual choice.

## ✅ Quick check

### 1. A handler returns `{ id: 1 }`. The global interceptor is `next.handle().pipe(map((d) => ({ ok: true, d })))`. What does the client get?

:::answer
`{"ok":true,"d":{"id":1}}`. The `map` operator wraps the handler's result.
:::

### 2. Which runs first for a request: a guard or an interceptor?

:::answer
**The guard.** Order: middleware → guards → interceptors → pipes → handler.
:::

### 3. An interceptor logs a message but never calls `next.handle()`. What happens to the handler?

- A) It runs as usual
- B) It never runs
- C) It runs twice

:::answer
**B) It never runs.** `next.handle()` is what calls the handler.
:::
