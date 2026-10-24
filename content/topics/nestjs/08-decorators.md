---
title: How decorators work in Nest
stack: nestjs
order: 8
level: Intermediate
mustKnow: true
askedFrequency: very common
summary:
  - "A decorator is a function you attach with @ to a class, method, property or parameter. Nest uses them everywhere."
  - "Most Nest decorators don't run your logic. They save metadata (labels) that Nest reads at startup to build routes, DI and guards."
  - "Kinds: class (@Module, @Controller, @Injectable), method (@Get, @UseGuards), parameter (@Body, @Param), property."
  - "SetMetadata / Reflector.createDecorator let you make your own labels, like @Roles('admin'), which a guard reads later."
  - "createParamDecorator makes your own parameter decorator, like @CurrentUser()."
cards:
  - q: What is a decorator in TypeScript?
    a: A function attached with @ to a class, method, property or parameter. It runs when the class is defined and can add metadata or change behaviour.
  - q: What do most Nest decorators actually do?
    a: They store metadata on the class or method. Nest reads that metadata at startup to register routes, inject providers and apply guards, pipes and interceptors.
  - q: When does a decorator run?
    a: Once, when the class is defined (when the file loads), not on every request.
  - q: How do you build a custom @Roles() decorator?
    a: "Use Reflector.createDecorator<string[]>() (or SetMetadata('roles', roles)), then read it in a guard with reflector.get / getAllAndOverride."
  - q: How do you build @CurrentUser()?
    a: With createParamDecorator, returning ctx.switchToHttp().getRequest().user.
---

## 💡 What is it?

A **[decorator](glossary:decorator)** is a special label that starts with `@`. You put it above a class, a method, a property or a parameter.

In Nest you see them everywhere: `@Module()`, `@Controller()`, `@Get()`, `@Body()`. They tell Nest what each piece is and how to use it.

A decorator is really a **function**. Most Nest decorators just save extra information, called **[metadata](glossary:metadata)**. Nest reads it when the app starts.

## 🏠 Real-life example

Think of **labels on boxes when a family moves house**.

Each box gets a sticker: "Kitchen", "Fragile", "Open first". The stickers don't move the box. The movers read the stickers and decide where each box goes.

- **The sticker** = a decorator, like `@Get('users')`.
- **What's written on it** = the metadata, like "method GET, path users".
- **The box** = your class or method.
- **The movers who read stickers** = Nest at startup. It reads the labels and builds routes and DI.
- **A "Fragile" sticker** = `@UseGuards(AuthGuard)`. It says "check this one carefully before opening".
- **Writing your own sticker** = a custom decorator, like `@Roles('admin')`.

## 🧑‍💻 Code example

This shows a plain TypeScript decorator first, so you see what Nest does. Make a folder, run `npm init -y` and `npm install -D typescript tsx`. Save as `logger.ts`. Run `npx tsx logger.ts`.

```ts
function LogCall(target: any, name: string, descriptor: PropertyDescriptor) { // a method decorator: gets the class, method name and method details
  const original = descriptor.value;                                 // keep the real method
  descriptor.value = function (...args: any[]) {                     // replace it with a wrapper
    console.log(`calling ${name} with`, args);                       // print the method name and arguments
    return original.apply(this, args);                               // then run the real method
  };                                                                 // end of wrapper
}                                                                    // end of LogCall

class Calculator {                                                   // a normal class
  @LogCall                                                           // attach the decorator to add()
  add(a: number, b: number) {                                        // the real method
    return a + b;                                                    // add the two numbers
  }                                                                  // end of add
}                                                                    // end of Calculator

console.log(new Calculator().add(2, 3));                             // 2 and 3 = sample numbers
```

```text
calling add with [ 2, 3 ]
5
```

Most Nest decorators are simpler than this. They don't wrap your method. They only stick a label on it. Here's a custom Nest label, `@Roles()`, read by a guard. Put it in `src/roles.ts` of a Nest project:

```ts
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common'; // guard types from Nest
import { Reflector } from '@nestjs/core';                            // Reflector reads metadata

export const Roles = Reflector.createDecorator<string[]>();          // makes @Roles([...]); stores a string array as metadata

@Injectable()                                                        // the guard is a provider
export class RolesGuard implements CanActivate {                     // a guard decides allow or block
  constructor(private reflector: Reflector) {}                       // Nest injects Reflector

  canActivate(ctx: ExecutionContext): boolean {                      // runs before the route handler
    const roles = this.reflector.get(Roles, ctx.getHandler());       // read the @Roles label from the method
    if (!roles) return true;                                         // no label = route is open to all
    const user = ctx.switchToHttp().getRequest().user;               // the logged-in user (set by auth earlier)
    return roles.includes(user?.role);                               // true = allow, false = 403 Forbidden
  }                                                                  // end of canActivate
}                                                                    // end of RolesGuard
```

Use it on a route: `@Roles(['admin'])` and `@UseGuards(RolesGuard)` above a handler. See [guards](topic:nestjs/guards).

## 🔍 Deeper version

**Kinds of decorators.**

| Kind | Nest examples | What it labels |
|---|---|---|
| Class | `@Module()`, `@Controller('users')`, `@Injectable()` | the whole class |
| Method | `@Get()`, `@Post()`, `@HttpCode(204)`, `@UseGuards()` | one route handler |
| Parameter | `@Body()`, `@Param('id')`, `@Query()`, `@Req()` | one argument of a handler |
| Property | `@Inject()` on a field, `@Prop()` in Mongoose schemas | one class field |

**When they run.** A decorator runs **once**, when the class is defined (the file loads). It does not run on each request. Nest then reads the saved metadata during startup. That's how it builds the route table and the DI graph.

**Where metadata lives.** Nest uses the `reflect-metadata` library. A decorator like `@Get('list')` saves something like `path = 'list'` and `method = GET` on that method. Later, Nest's router reads them back. `SetMetadata(key, value)` is the raw form of this.

**Custom metadata decorators.**

```ts
export const Public = () => SetMetadata('isPublic', true);          // @Public() marks a route as open
// in a guard:
const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [ctx.getHandler(), ctx.getClass()]); // method label wins over class label
```

`getAllAndOverride` checks the method first, then the class. Use it when a label may sit on either.

**Custom parameter decorators.**

```ts
export const CurrentUser = createParamDecorator(                     // makes @CurrentUser()
  (data: unknown, ctx: ExecutionContext) => ctx.switchToHttp().getRequest().user, // return req.user
);                                                                   // end of CurrentUser
// usage: getProfile(@CurrentUser() user: User) { ... }
```

**Combining decorators.** `applyDecorators()` merges many into one:

```ts
export const Auth = (...roles: string[]) =>                          // one decorator for auth + roles
  applyDecorators(Roles(roles), UseGuards(JwtAuthGuard, RolesGuard)); // apply both at once
```

:::version[Version note]
Nest uses TypeScript's **legacy** ("experimental") decorators with `experimentalDecorators` and `emitDecoratorMetadata` in `tsconfig.json`. The newer standard (TC39) decorators in TypeScript 5+ work differently and don't emit parameter types. New Nest projects still come set up for the legacy style.
:::

## 🎯 Why do we use it?

- **Less boilerplate.** `@Get(':id')` replaces manual `router.get('/:id', …)` wiring.
- **Code that explains itself.** You read the labels and know what a class or route does.
- **Separation of concerns.** Auth, roles and caching sit as labels. The handler only has business logic.
- **Reuse.** One custom decorator like `@Auth('admin')` is used on many routes.

## ⚠️ Common mistakes

- **Thinking a decorator runs per request.** It runs once at load time. Per-request logic belongs in guards, pipes or interceptors.
- **Forgetting the guard.** `@Roles('admin')` alone does nothing. Some guard must read the label.
- **Reading metadata only from the method.** If you put the label on the controller class, use `getAllAndOverride` with both handler and class.
- **Mixing up `@Req()` with `@Body()`.** Using the raw request everywhere ties your code to Express and skips validation pipes.

## 🗣️ How to answer in an interview

> "A decorator is a function attached with `@` to a class, method, property or parameter. It runs once when the class is defined.
>
> Most Nest decorators don't change behaviour directly. They store metadata using `reflect-metadata`. At startup Nest reads it: `@Controller` and `@Get` build the routes, `@Injectable` plus the emitted parameter types drive DI, and `@UseGuards` attaches guards.
>
> I can write custom ones. For roles, I create a `@Roles()` decorator with `Reflector.createDecorator` or `SetMetadata`, and a guard reads it with the `Reflector`. For the current user, I use `createParamDecorator` to return `request.user`.
>
> At SkillKeepr our shared library had authorizer decorators that protected handlers, so the idea is familiar. In Nest, I've learned it through practice, not production."

## 🔁 Follow-up questions

### What is `reflect-metadata`?

A small library that lets you store and read extra data on classes and methods. Nest decorators use it to save labels, and TypeScript uses it to save constructor parameter types.

### What is the difference between `SetMetadata` and `Reflector.createDecorator`?

Both store metadata. `createDecorator` is newer and type-safe: the same object is used to set and read the value, so you don't repeat a string key.

### Can a decorator change what a method returns?

A plain TypeScript method decorator can wrap the method, like the logging example. In Nest, you usually use an [interceptor](topic:nestjs/interceptors) for that instead, so it fits the request lifecycle.

### In what order do multiple decorators run?

Decorator factories are evaluated top to bottom, but the decorators are applied bottom to top (closest to the method first). For metadata-only decorators, the order rarely matters.

## ✅ Quick check

### 1. How many times does `@Get('users')` run if the route gets 1,000 requests?

:::answer
**Once**, when the class is defined. Nest reads the stored metadata at startup and builds the route.
:::

### 2. You add `@Roles(['admin'])` to a route, but normal users can still call it. Why?

:::answer
No guard reads the label. Add `@UseGuards(RolesGuard)` (or register the guard globally). The decorator only stores metadata.
:::

### 3. Which makes `@CurrentUser()`?

- A) `SetMetadata`
- B) `createParamDecorator`
- C) `@Injectable`

:::answer
**B) `createParamDecorator`.** It returns a value (like `request.user`) to a handler parameter.
:::
