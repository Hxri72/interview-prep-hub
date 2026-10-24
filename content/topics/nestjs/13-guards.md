---
title: "Guards: auth and roles"
stack: nestjs
order: 13
level: Intermediate
mustKnow: true
askedFrequency: very common
summary:
  - "A guard decides if a request may reach the route handler. It returns true (allow) or false (block)."
  - "A guard implements CanActivate and has a canActivate(context) method. If it returns false, Nest sends 403 Forbidden."
  - "Guards get an ExecutionContext, so they know which class and method will run. That lets them read metadata like @Roles('admin')."
  - Guards run after middleware and before interceptors and pipes.
  - "Typical use: an auth guard checks the JWT (401 if missing), then a roles guard checks the user's role (403 if not allowed)."
cards:
  - q: What is a guard in NestJS?
    a: "A class with canActivate() that decides if a request may reach the handler. It is used for authentication and authorization."
  - q: What status does Nest send when a guard returns false?
    a: 403 Forbidden. To send 401, throw an UnauthorizedException yourself.
  - q: Why use a guard instead of middleware for roles?
    a: "Guards get the ExecutionContext, so they know the handler and can read its metadata (like @Roles) with Reflector."
  - q: How do you read @Roles() metadata inside a guard?
    a: "Inject Reflector and call reflector.getAllAndOverride(ROLES_KEY, [context.getHandler(), context.getClass()])."
  - q: How do you apply a guard to the whole app with DI?
    a: "Add { provide: APP_GUARD, useClass: AuthGuard } to a module's providers."
---

## 💡 What is it?

A **guard** decides one thing: **may this request reach the route handler?** It answers `true` (yes) or `false` (no).

Guards are mainly used for [authentication](glossary:authentication) (who are you?) and [authorization](glossary:authorization) (are you allowed?).

If a guard says no, the handler never runs. Nest sends back `403 Forbidden`.

## 🏠 Real-life example

Think of **the staff room in a school**.

A teacher stands at the door. First she checks your school ID card. Then she checks if you are a teacher. A student with a valid ID still can't enter.

- **The ID card check** = the auth guard. It checks the [JWT](glossary:jwt). No valid card means `401 Unauthorized`.
- **The "teachers only" sign on the door** = `@Roles('teacher')` [metadata](glossary:metadata) on the route.
- **The teacher reading the sign** = the roles guard reading the metadata with `Reflector`.
- **"You can't come in"** = the guard returns `false`, so Nest sends `403 Forbidden`.
- **The staff room** = the route handler.

## 🧑‍💻 Code example

Create a project with `npx @nestjs/cli new guards-demo`. Put all of this in `src/app.controller.ts` (it replaces the default file). Run it with `npm run start:dev`.

This demo reads the role from a header to keep it short. A real app reads it from a verified JWT. See [JWT auth](topic:nestjs/jwt-auth).

```ts
import { Controller, Get, Injectable, CanActivate, ExecutionContext, SetMetadata, UseGuards, UnauthorizedException } from '@nestjs/common'; // load Nest tools
import { Reflector } from '@nestjs/core';                             // Reflector reads metadata from decorators

export const ROLES_KEY = 'roles';                                     // the name we store the roles under
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles); // our own @Roles('admin') decorator

@Injectable()                                                         // Nest creates it and injects Reflector
export class RolesGuard implements CanActivate {                      // a guard must have canActivate()
  constructor(private reflector: Reflector) {}                        // ask Nest for a Reflector

  canActivate(context: ExecutionContext): boolean {                   // context = info about this request and handler
    const needed = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [ // read @Roles(...) from…
      context.getHandler(),                                           // …the method first
      context.getClass(),                                             // …then the controller class
    ]);                                                               // end of the metadata lookup
    if (!needed) return true;                                         // no @Roles on this route = anyone may enter

    const req = context.switchToHttp().getRequest();                  // get the Express request object
    const role = req.headers['x-role'];                               // demo only: role from a header
    if (!role) throw new UnauthorizedException('Please log in');      // no role at all = 401 Unauthorized
    return needed.includes(role);                                     // true = allowed, false = 403 Forbidden
  }                                                                   // end of canActivate
}                                                                     // end of RolesGuard

@Controller('reports')                                                // routes start with /reports
@UseGuards(RolesGuard)                                                // run RolesGuard for every route in this class
export class AppController {                                          // the controller
  @Get('public')                                                      // GET /reports/public
  open() {                                                            // no @Roles here
    return { msg: 'Anyone can see this' };                            // always allowed
  }                                                                   // end of open

  @Get('salary')                                                      // GET /reports/salary
  @Roles('admin')                                                     // only admins may enter
  salary() {                                                          // runs only if the guard said true
    return { msg: 'Secret salary report' };                           // the protected data
  }                                                                   // end of salary
}                                                                     // end of AppController
```

Try it:

```text
$ curl http://localhost:3000/reports/public
{"msg":"Anyone can see this"}

$ curl http://localhost:3000/reports/salary
{"message":"Please log in","error":"Unauthorized","statusCode":401}

$ curl -H "x-role: user" http://localhost:3000/reports/salary
{"message":"Forbidden resource","error":"Forbidden","statusCode":403}

$ curl -H "x-role: admin" http://localhost:3000/reports/salary
{"msg":"Secret salary report"}
```

## 🔍 Deeper version

**The `CanActivate` interface.** `canActivate(context)` can return `boolean`, `Promise<boolean>` or an `Observable<boolean>`. So a guard can be `async`, for example to load the user from the database.

**`ExecutionContext`** is Nest's object about the current call:
- `context.getHandler()` gives the method that will run (like `salary`).
- `context.getClass()` gives the controller class.
- `context.switchToHttp().getRequest()` gives the request. For WebSockets or [microservices](topic:nestjs/microservices), you use `switchToWs()` or `switchToRpc()`.

This is the big difference from [middleware](topic:nestjs/middleware). Middleware has no idea which handler runs next.

**Reading metadata with `Reflector`.** `SetMetadata(key, value)` stores data on a method or class. The guard reads it back:

| Method | What it does |
|---|---|
| `reflector.get(KEY, context.getHandler())` | read from the method only |
| `reflector.getAllAndOverride(KEY, [handler, class])` | method wins; fall back to the class |
| `reflector.getAllAndMerge(KEY, [handler, class])` | combine both lists |

Newer Nest versions also have `Reflector.createDecorator<string[]>()`. It creates a typed decorator without `SetMetadata`.

**401 vs 403.**
- `401 Unauthorized` = "we don't know who you are". Throw `UnauthorizedException`.
- `403 Forbidden` = "we know you, but you're not allowed". Returning `false` gives this.

**Binding guards:**

```ts
@UseGuards(AuthGuard, RolesGuard)   // on a method or controller; runs left to right
app.useGlobalGuards(new AuthGuard()); // global, but no DI
{ provide: APP_GUARD, useClass: AuthGuard } // global WITH DI, in a module's providers
```

A common pattern is a **global auth guard** plus a `@Public()` decorator. The guard skips routes marked `@Public()`, like login and health checks.

**Order:** Middleware → **Guards** → Interceptors → Pipes → Handler. See [the request lifecycle](topic:nestjs/request-lifecycle).

## 🎯 Why do we use it?

- **Security in one place.** Auth and role rules are not copied into every handler.
- **Readable routes.** `@Roles('admin')` above a method tells every reader who may call it.
- **Handler-aware.** Guards can read decorators, so each route can have its own rules.
- **Stops early.** Pipes and the handler never run for blocked requests.

## ⚠️ Common mistakes

- **Returning `false` when the user isn't logged in.** That sends 403. Throw `UnauthorizedException` to send the correct 401.
- **Reading only the handler metadata.** If `@Roles` is on the controller class, `reflector.get(KEY, handler)` misses it. Use `getAllAndOverride` with both.
- **Trusting data the client can change.** Like the `x-role` header in the demo. Real roles must come from a verified JWT or the database.
- **Forgetting the global guard on public routes.** With `APP_GUARD`, login also gets blocked unless you add a `@Public()` skip.

## 🗣️ How to answer in an interview

> "A guard decides whether a request can reach the handler. It implements CanActivate, and canActivate returns true or false, or a Promise of it. If it returns false, Nest sends 403 Forbidden.
>
> The key point is that a guard gets the ExecutionContext. So it knows the handler and controller, and with Reflector it can read metadata like a custom @Roles('admin') decorator. That's why auth and roles go in guards, not middleware.
>
> A typical setup is a global JWT auth guard registered with APP_GUARD, a @Public() decorator to skip it, and a roles guard on top. At SkillKeepr our serverless backend had shared authorizer decorators in a common library, which is the same idea. I haven't used NestJS in production, but guards map directly to that pattern."

## 🔁 Follow-up questions

### What is the difference between a guard and middleware?

Both run before the handler. But a guard gets the `ExecutionContext`, so it knows which handler runs and can read its metadata. Middleware only gets `req`, `res` and `next`. Guards also run **after** all middleware.

### How does `AuthGuard('jwt')` from @nestjs/passport work?

It runs a Passport strategy. The JWT strategy checks the token's signature and expiry, then puts the user on `req.user`. If the token is bad, it throws 401. See [JWT auth](topic:nestjs/jwt-auth).

### Can a guard be async?

Yes. `canActivate` can return a `Promise<boolean>`. For example, you can check in the database if the user's account is blocked.

### How do you make some routes public when the auth guard is global?

Create `@Public()` with `SetMetadata('isPublic', true)`. In the guard, read it with `Reflector`. If it's `true`, return `true` straight away.

## ✅ Quick check

### 1. A guard returns `false`. What does the client get?

- A) 400 Bad Request
- B) 401 Unauthorized
- C) 403 Forbidden
- D) 500 Internal Server Error

:::answer
**C) 403 Forbidden.** Throw `UnauthorizedException` yourself if you want 401.
:::

### 2. Which object lets a guard find out which handler will run?

:::answer
**`ExecutionContext`**, using `context.getHandler()` and `context.getClass()`.
:::

### 3. `@Roles('admin')` is on the controller class, not the method. The guard uses `reflector.get(ROLES_KEY, context.getHandler())`. What happens?

:::answer
The guard gets **`undefined`** and lets everyone in. Use `getAllAndOverride(ROLES_KEY, [context.getHandler(), context.getClass()])` to check both.
:::
