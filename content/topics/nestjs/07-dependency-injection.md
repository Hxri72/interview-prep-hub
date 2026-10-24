---
title: Dependency injection and the IoC container
stack: nestjs
order: 7
level: Intermediate
mustKnow: true
askedFrequency: very common
summary:
  - "Dependency injection (DI) means a class gets what it needs from outside, through its constructor, instead of creating it with new."
  - "Nest's IoC container reads each constructor, builds the needed providers in the right order, and passes them in."
  - "Nest finds a provider by its token. Usually the token is the class itself; it can also be a string or symbol used with @Inject()."
  - "It works because TypeScript emits constructor type info (emitDecoratorMetadata), which Nest reads at startup."
  - "The big wins are loose coupling and easy testing: in tests you swap a real provider for a fake one."
cards:
  - q: What is dependency injection?
    a: A class receives its dependencies (services, repos, config) from outside, usually through the constructor, instead of creating them itself.
  - q: What is the IoC container in Nest?
    a: The part of Nest that creates providers, keeps them, and injects them into the classes that ask for them.
  - q: How does Nest know what to inject into a constructor?
    a: It reads the parameter types (stored as metadata by TypeScript) and uses each type as a token to find the matching provider.
  - q: When do you need @Inject()?
    a: When the token isn't a class, for example a string like 'CONFIG' or a symbol, or an interface (interfaces don't exist at runtime).
  - q: What does "inversion of control" mean?
    a: The framework, not your code, controls creating and connecting objects. You only declare what you need.
---

## 💡 What is it?

**[Dependency injection](glossary:dependency-injection)** (DI) means a class gets the things it needs from outside. It does not create them with `new`.

In Nest, you list what you need in the **constructor**. Nest creates those things and passes them in.

The part of Nest that does this is the **[IoC container](glossary:ioc-container)**. "IoC" means inversion of control: Nest builds the objects, not you.

## 🏠 Real-life example

Think of **a school exam hall**.

A student needs a question paper, an answer sheet and a pen. The student does not print the paper. The exam office gives everything to each desk before the exam starts.

- **The student** = your class, like `OrdersService`.
- **The question paper and answer sheet** = its dependencies, like `PaymentsService`.
- **The exam office** = Nest's IoC container.
- **The list of items written on each desk** = the constructor parameters.
- **A practice exam with sample papers** = a unit test, where you give fake services.
- **A student who brings their own printed paper** = code that calls `new PaymentsService()` itself. It's hard to swap.

## 🧑‍💻 Code example

Create a project with `npx @nestjs/cli new di-demo`. Replace `src/app.module.ts` with this file and delete the other generated files in `src/` except `main.ts`. Run `npm run start:dev`.

`src/app.module.ts`:

```ts
import { Controller, Get, Injectable, Module } from '@nestjs/common'; // load Nest decorators

@Injectable()                                                      // a provider Nest can create
export class PaymentsService {                                     // a low-level service
  charge(amount: number) {                                         // pretend to charge money
    return `charged ₹${amount}`;                                   // ₹ amount = just a message for the demo
  }                                                                // end of charge
}                                                                  // end of PaymentsService

@Injectable()                                                      // another provider
export class OrdersService {                                       // depends on PaymentsService
  constructor(private readonly payments: PaymentsService) {}       // DI: Nest passes PaymentsService in here

  placeOrder() {                                                   // business logic
    return this.payments.charge(499);                              // 499 = order price for the demo
  }                                                                // end of placeOrder
}                                                                  // end of OrdersService

@Controller('orders')                                              // routes start with /orders
export class OrdersController {                                    // the HTTP layer
  constructor(private readonly orders: OrdersService) {}           // DI: Nest passes OrdersService in here

  @Get()                                                           // GET /orders
  create() {                                                       // route handler
    return { result: this.orders.placeOrder() };                   // call the service and return JSON
  }                                                                // end of create
}                                                                  // end of OrdersController

@Module({                                                          // the module ties everything together
  controllers: [OrdersController],                                 // the controller
  providers: [OrdersService, PaymentsService],                     // both services; order here doesn't matter
})                                                                 // end of module settings
export class AppModule {}                                          // root module
```

```text
$ curl http://localhost:3000/orders
{"result":"charged ₹499"}
```

Nothing calls `new`. At startup, Nest sees that `OrdersController` needs `OrdersService`, which needs `PaymentsService`. So it builds `PaymentsService` first, then `OrdersService`, then the controller.

## 🔍 Deeper version

**How Nest knows the types.** TypeScript types disappear when code is compiled to JavaScript. So how does Nest see `PaymentsService` in the constructor?

- `tsconfig.json` has `emitDecoratorMetadata: true` and `experimentalDecorators: true`.
- With these, TypeScript saves the constructor parameter types as **[metadata](glossary:metadata)** (key `design:paramtypes`) on any class that has a decorator.
- That's why `@Injectable()` matters even when the class has no options. It makes TypeScript save this metadata.
- At startup Nest reads that metadata, and uses each type as a **token** to find the provider.

**Tokens.** A token is the key Nest uses to look up a provider.

| Token type | Example | How to inject |
|---|---|---|
| Class | `PaymentsService` | `constructor(private p: PaymentsService)` |
| String | `'APP_CONFIG'` | `constructor(@Inject('APP_CONFIG') private cfg: AppConfig)` |
| Symbol | `PAYMENT_GATEWAY` | `constructor(@Inject(PAYMENT_GATEWAY) private gw: Gateway)` |

**Interfaces can't be tokens.** A TypeScript interface doesn't exist at runtime. So to "inject an interface", you use a string or symbol token:

```ts
export const PAYMENT_GATEWAY = Symbol('PAYMENT_GATEWAY');          // a unique token at runtime
providers: [{ provide: PAYMENT_GATEWAY, useClass: StripeGateway }] // bind the token to a real class
constructor(@Inject(PAYMENT_GATEWAY) private gw: PaymentGateway) {} // ask for it by token; type is just for TS
```

Now you can swap `StripeGateway` for a `FakeGateway` without changing the service. See [custom providers](topic:nestjs/custom-providers-scopes).

**Resolution order and errors.** Nest builds a graph of who needs whom. If a dependency is missing, startup fails with "Nest can't resolve dependencies of X (?). Please make sure that the argument Y at index [0] is available in the Z context". The `?` shows which parameter is missing. Fix it by adding the provider, or by exporting/importing its module.

**Circular dependencies.** If A needs B and B needs A, Nest can't decide which to build first. You can use `forwardRef(() => B)`, but it's usually better to move the shared logic into a third service.

**Testing with DI.** You build a small module just for the test and replace providers:

```ts
const moduleRef = await Test.createTestingModule({                 // a mini Nest app for this test
  providers: [OrdersService, { provide: PaymentsService, useValue: { charge: () => 'fake' } }], // fake payments
}).compile();                                                      // build the container
const orders = moduleRef.get(OrdersService);                       // get the real OrdersService with the fake inside
```

More in [testing](topic:nestjs/testing). Compare this with manual DI in [Express](topic:express/dependency-injection).

## 🎯 Why do we use it?

- **Loose coupling.** `OrdersService` only knows it needs "a payments service". It doesn't know how to build one.
- **Easy testing.** Swap any provider for a fake in a test, with no module mocking.
- **One copy shared.** The container creates each singleton once, so you don't open five database connections by mistake.
- **Less wiring code.** In Express you wire things by hand in one file. Nest does it from the constructors.

## ⚠️ Common mistakes

- **Calling `new SomeService()` inside a class.** You skip DI, so you can't swap it in tests, and its own dependencies are missing.
- **Turning off `emitDecoratorMetadata`.** Nest can no longer see constructor types, and injection fails.
- **Trying to inject an interface without a token.** Interfaces vanish at runtime. Use a string or symbol token with `@Inject()`.
- **Using `import type` for an injected class.** It removes the class at runtime, so Nest gets `undefined` as the token. Use a normal import.

## 🗣️ How to answer in an interview

> "Dependency injection means a class receives its dependencies from outside instead of creating them. In Nest, I declare them as constructor parameters. Nest's IoC container reads the parameter types from TypeScript's decorator metadata, uses them as tokens, builds the providers in dependency order, and injects them. By default each provider is a singleton.
>
> When the dependency isn't a class, like a config object or an interface, I use a string or symbol token with `@Inject()`.
>
> The main benefits are loose coupling and testing. In a `TestingModule` I can override a provider with a fake using `useValue`.
>
> In my Express work I did DI by hand with factory functions and a composition root. Nest automates that wiring. I learned NestJS on my own; I haven't used it in production yet."

## 🔁 Follow-up questions

### What is the difference between DI and IoC?

IoC (inversion of control) is the general idea: the framework controls the flow and object creation, not your code. DI is one way to do IoC: dependencies are passed into your class.

### Why does a service need `@Injectable()` if it has no options?

The decorator makes TypeScript emit the constructor's type metadata. Without it, Nest can't see what to inject into that class.

### What does the error "Nest can't resolve dependencies of X (?)" mean?

A constructor asks for something Nest can't find in that module. Either the provider isn't in `providers`, or it lives in another module that doesn't export it, or your module doesn't import that module.

### Can you inject something optional?

Yes. Add `@Optional()` before the parameter. If no provider exists, Nest passes `undefined` instead of failing.

## ✅ Quick check

### 1. Which line breaks DI?

- A) `constructor(private users: UsersService) {}`
- B) `private users = new UsersService();`

:::answer
**B.** The class builds its own `UsersService`. Nest can't inject or swap it, and its dependencies (like a repository) won't be passed in.
:::

### 2. You want to inject a `PaymentGateway` interface. What do you need?

:::answer
A **token** (a string or symbol), a provider like `{ provide: PAYMENT_GATEWAY, useClass: StripeGateway }`, and `@Inject(PAYMENT_GATEWAY)` in the constructor. Interfaces don't exist at runtime.
:::

### 3. True or false: the order of classes in the `providers` array decides the build order.

:::answer
**False.** Nest builds a dependency graph from the constructors and decides the order itself.
:::
