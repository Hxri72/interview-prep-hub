---
title: Providers and services
stack: nestjs
order: 6
level: Basic
mustKnow: true
askedFrequency: very common
summary:
  - "A provider is any class that Nest can create and give to other classes. The most common provider is a service."
  - "You mark a provider with @Injectable() and list it in the providers array of a module."
  - "Services hold the business logic. Controllers stay thin: they read the request and call a service."
  - "By default, every provider is a singleton: Nest creates one copy and shares it across the whole app."
  - "To use a provider in another module, the first module must export it, and the second module must import that module."
cards:
  - q: What is a provider in NestJS?
    a: A class (or value) that Nest's DI container can create and inject into other classes. Services, repositories, helpers and factories are all providers.
  - q: What does @Injectable() do?
    a: It marks a class as a provider, so Nest can manage it and inject its own dependencies through the constructor.
  - q: Where do you register a provider?
    a: In the providers array of a module's @Module() decorator.
  - q: How many instances of a service does Nest create by default?
    a: One. Providers are singletons by default and are shared by every class that asks for them.
  - q: Why keep logic in services and not in controllers?
    a: Controllers handle HTTP only. Services can be reused by other controllers, jobs or modules, and are easy to unit test.
---

## 💡 What is it?

A **provider** is a class that Nest can create for you and give to other classes. The most common provider is a **service**.

A service holds your **business logic**: the real work, like "create a user" or "find all jobs". A [controller](topic:nestjs/controllers) only reads the request and calls the service.

You mark a provider with the `@Injectable()` [decorator](glossary:decorator). Then you list it in a [module](topic:nestjs/modules).

## 🏠 Real-life example

Think of **a restaurant**.

The waiter takes your order. The waiter does not cook. The waiter passes the order to the kitchen. The kitchen cooks the food and sends it back.

- **The waiter** = the controller. It talks to the customer (the HTTP request).
- **The kitchen** = the service. It does the real work.
- **The restaurant manager who hires one kitchen team** = Nest's [IoC container](glossary:ioc-container). It creates the service once.
- **Many waiters sharing the same kitchen** = many controllers using the same service. It is a [singleton](glossary:singleton).
- **The staff list on the wall** = the `providers` array in the module.

## 🧑‍💻 Code example

Create a project with `npx @nestjs/cli new shop-api`, then `cd shop-api`. Save the three files below inside `src/`. Run `npm run start:dev`.

`src/products.service.ts`:

```ts
import { Injectable } from '@nestjs/common';                      // load the @Injectable decorator from Nest

@Injectable()                                                      // mark this class as a provider Nest can create and inject
export class ProductsService {                                     // the service: holds the business logic
  private products = [{ id: 1, name: 'Pen' }];                     // fake data in memory; id 1 = first product

  findAll() {                                                      // business logic: return all products
    return this.products;                                          // give back the whole list
  }                                                                // end of findAll

  create(name: string) {                                           // business logic: add one product
    const product = { id: this.products.length + 1, name };        // new id = list length + 1
    this.products.push(product);                                   // save it in the list
    return product;                                                // give back the new product
  }                                                                // end of create
}                                                                  // end of ProductsService
```

`src/products.controller.ts`:

```ts
import { Body, Controller, Get, Post } from '@nestjs/common';      // load decorators for routes and the body
import { ProductsService } from './products.service';              // load the service class we want injected

@Controller('products')                                            // every route here starts with /products
export class ProductsController {                                  // the controller: handles HTTP only
  constructor(private readonly productsService: ProductsService) {} // Nest injects the service here (DI)

  @Get()                                                           // GET /products
  findAll() {                                                      // handler for listing products
    return this.productsService.findAll();                         // ask the service; Nest sends it as JSON
  }                                                                // end of findAll

  @Post()                                                          // POST /products
  create(@Body('name') name: string) {                             // read "name" from the JSON body
    return this.productsService.create(name);                      // ask the service to create it
  }                                                                // end of create
}                                                                  // end of ProductsController
```

`src/app.module.ts`:

```ts
import { Module } from '@nestjs/common';                           // load the @Module decorator
import { ProductsController } from './products.controller';        // load our controller
import { ProductsService } from './products.service';              // load our service

@Module({                                                          // describe this module
  controllers: [ProductsController],                               // controllers that handle routes
  providers: [ProductsService],                                    // providers Nest should create and inject
})                                                                 // end of module settings
export class AppModule {}                                          // the root module of the app
```

Try it:

```text
$ curl -X POST -H "Content-Type: application/json" -d '{"name":"Book"}' http://localhost:3000/products
{"id":2,"name":"Book"}

$ curl http://localhost:3000/products
[{"id":1,"name":"Pen"},{"id":2,"name":"Book"}]
```

You never wrote `new ProductsService()`. Nest created it and passed it to the controller.

## 🔍 Deeper version

**What counts as a provider?** Anything Nest's container can create and inject:
- **Services**: business logic (`UsersService`).
- **Repositories**: database access (`UsersRepository`).
- **Helpers and clients**: a mailer, a payment client, a logger.
- **Values and factories**: a config object or a database connection. See [custom providers](topic:nestjs/custom-providers-scopes).

**`providers: [ProductsService]` is a short form.** It means:

```ts
providers: [{ provide: ProductsService, useClass: ProductsService }] // token = the class; Nest creates that class
```

The **token** is the key Nest uses to find a provider. Here the token is the class itself.

**Sharing a provider between modules.** A provider is private to its module by default. To share it:

| Step | Where | Code |
|---|---|---|
| 1. Export it | the module that owns it | `exports: [ProductsService]` |
| 2. Import the module | the module that needs it | `imports: [ProductsModule]` |
| 3. Inject it | any class in the second module | `constructor(private products: ProductsService) {}` |

If you skip step 1 or 2, Nest fails at startup with "Nest can't resolve dependencies of …".

**Lifetime (scope).** By default, providers are **singletons**. Nest creates one copy at startup and shares it. That is fast. But never store per-request data (like the current user) in a field of a singleton service. Two requests would overwrite each other. Request-scoped providers exist, but they are slower. See [scopes](topic:nestjs/custom-providers-scopes).

**Thin controllers, fat services.**

| Controller | Service |
|---|---|
| Reads params, query and body | Holds the business rules |
| Returns the response and status | Talks to the database and other services |
| Knows about HTTP | Knows nothing about HTTP |

Because the service knows nothing about HTTP, you can reuse it from a cron job, a queue worker or another module.

## 🎯 Why do we use it?

- **Reuse.** One service can serve many controllers, jobs and modules.
- **Testing.** You can test a service alone, and swap it for a fake in controller tests.
- **Clean code.** HTTP code and business logic stay in separate files.
- **No manual wiring.** Nest creates each provider once and passes it where needed.

## ⚠️ Common mistakes

- **Forgetting to add the service to `providers`.** Nest throws "can't resolve dependencies" at startup.
- **Using a service from another module without `exports` and `imports`.** Same error. Export it from its module, then import that module.
- **Putting business logic in the controller.** It can't be reused and is harder to test.
- **Storing per-request data in a singleton service field.** Requests share the same copy, so data leaks between users.

## 🗣️ How to answer in an interview

> "A provider is any class that Nest's IoC container can create and inject. The most common kind is a service. I mark it with `@Injectable()`, register it in the module's `providers` array, and ask for it in a constructor.
>
> I keep controllers thin. They read the request and call a service. The service holds the business logic and the database calls, so it's reusable and easy to unit test.
>
> Providers are singletons by default, so I never keep per-request state in a service field. To share a service across modules, I export it from its module and import that module where I need it.
>
> At SkillKeepr I work on a serverless Node.js and TypeScript backend on AWS Lambda. Nest makes that pattern the default. I've learned NestJS on my own, not in production."

## 🔁 Follow-up questions

### What is the difference between a provider and a service?

"Provider" is the general word for anything Nest can inject. A service is one kind of provider, the one that holds business logic. Repositories, factories and config values are providers too.

### What happens if two modules both list the same service in `providers`?

Each module gets its **own copy**. They don't share data. If you want one shared copy, put it in one module, export it, and import that module elsewhere.

### How do you make a service available everywhere without importing its module?

Mark its module with `@Global()`. Use this only for truly shared things like config or logging. Too many global modules hide where things come from.

### Can a service inject another service?

Yes. List it in the constructor. Nest builds them in the right order. If two services need each other, you get a circular dependency. Fix it with `forwardRef()` or, better, by moving shared logic to a third service.

## ✅ Quick check

### 1. You add `UsersService` to a controller's constructor, but forget to add it to `providers`. What happens?

:::answer
Nest fails at **startup** with an error like "Nest can't resolve dependencies of the UsersController". The container doesn't know how to create `UsersService`.
:::

### 2. By default, how many `UsersService` objects exist if three controllers inject it (same module)?

- A) 3
- B) 1
- C) One per request

:::answer
**B) 1.** Providers are singletons by default. All three controllers get the same copy.
:::

### 3. Where should the rule "a user can't have more than 5 active jobs" live: controller or service?

:::answer
In the **service**. It's business logic. The controller only reads the request and calls the service.
:::
