---
title: Modules
stack: nestjs
order: 4
level: Basic
mustKnow: true
askedFrequency: very common
summary:
  - A module is a class with @Module(). It groups one feature's controllers and providers.
  - "@Module has four lists: imports, controllers, providers and exports."
  - Providers are private to their module unless you put them in exports.
  - Another module uses an exported provider by adding the module to its imports.
  - Every app has one root module (AppModule). @Global() modules are available everywhere, but use them sparingly.
cards:
  - q: What is a module in NestJS?
    a: A class marked with @Module() that groups related controllers and providers into one feature.
  - q: What are the four properties of @Module()?
    a: imports (other modules), controllers, providers, and exports (providers other modules may use).
  - q: Why do you get "Nest can't resolve dependencies" for a service from another module?
    a: Usually the other module doesn't export that service, or your module doesn't import that module.
  - q: What does @Global() do?
    a: Makes a module's exported providers available in every module without importing it. Use it only for truly shared things like config.
---

## 💡 What is it?

A **module** is a class marked with `@Module()`. It groups the pieces of one feature: its controllers and its providers.

A users feature gets a `UsersModule`. An orders feature gets an `OrdersModule`. The root `AppModule` imports them all.

By default, a module's services are **private**. Other modules can use them only if the module **exports** them.

## 🏠 Real-life example

Think of **departments in a hospital**.

- **Each department (Cardiology, X-ray)** = a **module**.
- **The reception desk of each department** = its **controllers**. They take requests.
- **Doctors and machines inside** = its **providers** (services).
- **Cardiology sending patients to the X-ray department** = Cardiology **imports** the X-ray module.
- **X-ray allowing other departments to use its machine** = X-ray **exports** that service.
- **A private machine that only X-ray staff use** = a provider that isn't exported.
- **The main hospital building** = **AppModule**, which holds all departments.

## 🧑‍💻 Code example

In a `nest new` project, create these files. Then add `UsersModule` and `OrdersModule` to `imports` in `src/app.module.ts`. Run `npm run start:dev`.

`src/users/users.module.ts`:

```ts
import { Injectable, Module } from '@nestjs/common';   // load the decorators we need

@Injectable()                                           // Nest can create and inject this class
export class UsersService {                             // a service owned by the users feature
  findName(id: number) {                                // look up a user's name
    return id === 1 ? 'Asha' : 'Unknown';               // fake data: id 1 = Asha
  }                                                     // end of findName
}                                                       // end of UsersService

@Module({                                               // describe the users module
  providers: [UsersService],                            // UsersService lives in this module
  exports: [UsersService],                              // let other modules use UsersService
})                                                      // end of @Module settings
export class UsersModule {}                             // the module class
```

`src/orders/orders.module.ts`:

```ts
import { Controller, Get, Module } from '@nestjs/common';  // load the decorators we need
import { UsersModule, UsersService } from '../users/users.module'; // the module and the service we want to use

@Controller('orders')                                      // routes start with /orders
export class OrdersController {                            // the orders controller
  constructor(private readonly users: UsersService) {}     // Nest injects UsersService from UsersModule

  @Get()                                                   // GET /orders
  list() {                                                 // return a fake order list
    return [{ id: 101, customer: this.users.findName(1) }]; // use the other module's service
  }                                                        // end of list
}                                                          // end of OrdersController

@Module({                                                  // describe the orders module
  imports: [UsersModule],                                  // we need UsersModule's exported providers
  controllers: [OrdersController],                         // this module's controller
})                                                         // end of @Module settings
export class OrdersModule {}                               // the module class
```

```text
$ curl http://localhost:3000/orders
[{"id":101,"customer":"Asha"}]
```

Now remove `exports: [UsersService]` and save. Nest fails at start-up with an error like "Nest can't resolve dependencies of the OrdersController (?)…".

## 🔍 Deeper version

**The four `@Module()` properties:**

| Property | Meaning |
|---|---|
| `imports` | Other modules whose **exported** providers this module needs |
| `controllers` | Controllers that belong to this module |
| `providers` | Services (and other providers) this module creates |
| `exports` | Which of this module's providers other modules may use |

**Encapsulation.** A provider is visible only inside its own module. This keeps features separate. The orders module can't accidentally use a private helper from the users module.

**Shared instances.** Providers are [singletons](glossary:singleton) by default. If `UsersModule` is imported by three modules, they all get the **same** `UsersService` instance. Nest creates it only once.

**Re-exporting.** A module can export a module it imports:

```ts
@Module({ imports: [DatabaseModule], exports: [DatabaseModule] }) // anyone importing CoreModule also gets DatabaseModule
export class CoreModule {}                                        // a "barrel" module that bundles shared modules
```

**Global modules.** `@Global()` makes a module's exports available everywhere without importing it. It's handy for config or a logger. Use it rarely, because it hides where dependencies come from.

**Dynamic modules.** Some modules need settings, like a database URL. They offer static methods such as `MongooseModule.forRoot(url)` or `ConfigModule.forRoot()`. These return a configured module. See [dynamic modules](topic:nestjs/dynamic-modules).

**The module graph.** At start-up, Nest starts from `AppModule` and walks through all `imports`. It builds a graph of modules and creates every provider in the right order. If two modules import each other, you get a circular dependency. See [custom providers, scopes and forwardRef](topic:nestjs/custom-providers-scopes).

## 🎯 Why do we use it?

- **Organise by feature.** Each feature has a clear boundary and owner.
- **Hide internals.** Only exported providers can be used outside, like a public API for the feature.
- **Reuse.** A shared module, like auth or database, can be imported by any feature.
- **Easier split later.** A well-separated module can later become its own microservice.

## ⚠️ Common mistakes

- **Importing the service instead of the module.** You put `UsersService` in `imports`. `imports` takes **modules**; the service must be exported by `UsersModule`.
- **Listing the same provider in two modules' `providers`.** You get **two different instances**. Export it from one module and import that module instead.
- **Making everything `@Global()`.** Dependencies become invisible and modules get tangled.
- **One giant `AppModule`.** Split features into their own modules.

## 🗣️ How to answer in an interview

> "A module in NestJS is a class with the `@Module()` decorator that groups a feature's controllers and providers. It has four properties: `imports`, `controllers`, `providers` and `exports`.
>
> Providers are encapsulated, so they're private to their module by default. If another module needs one, the owning module adds it to `exports`, and the consumer adds that module to `imports`. Providers are singletons by default, so every importer shares the same instance.
>
> The root `AppModule` imports all feature modules, and Nest builds a dependency graph from it at start-up. For config-driven modules there are dynamic modules like `forRoot()`. I use `@Global()` only for truly app-wide things like config."

## 🔁 Follow-up questions

### What's the difference between `imports` and `providers`?

`providers` lists classes **this** module creates. `imports` lists **other modules** whose exported providers you want to use.

### What happens if two modules both list `UsersService` in `providers`?

Nest creates two separate instances, one in each module. Any data cached in one isn't seen by the other. Usually that's a bug. Export it from one module instead.

### When would you use `@Global()`?

For things almost every module needs, like configuration or a logger. Even then, many teams prefer explicit imports for clarity. Note: a global module still has to be imported once, usually in the root module.

### What is a feature module vs a shared module?

A feature module holds one business feature, like orders. A shared module holds reusable providers, like a mail or database service, and exports them for features to import.

## ✅ Quick check

### 1. `OrdersModule` needs `UsersService`. What two things must be true?

:::answer
`UsersModule` must list `UsersService` in **`exports`**, and `OrdersModule` must list `UsersModule` in **`imports`**.
:::

### 2. What's wrong here?

```ts
@Module({ imports: [UsersService], controllers: [OrdersController] }) // trying to import a service
export class OrdersModule {}                                          // the orders module
```

:::answer
`imports` takes **modules**, not services. Use `imports: [UsersModule]` and make sure `UsersModule` exports `UsersService`.
:::

### 3. Three modules import `UsersModule`. How many `UsersService` instances exist (default scope)?

- A) One
- B) Three
- C) Four

:::answer
**A) One.** Providers are singletons by default, so all importers share the same instance.
:::
