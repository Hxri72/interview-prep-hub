---
title: Custom providers, scopes and forwardRef
stack: nestjs
order: 20
level: Advanced
mustKnow: false
askedFrequency: sometimes
summary:
  - "A custom provider tells Nest exactly what to give for a token: useClass (a class), useValue (a ready object), useFactory (a function's result) or useExisting (an alias)."
  - "Tokens can be classes or strings/symbols. For string or symbol tokens, inject with @Inject('TOKEN')."
  - "Scopes decide how many copies exist: DEFAULT = one for the whole app (singleton), REQUEST = a new one per request, TRANSIENT = a new one for each class that asks."
  - Request scope spreads up the chain and costs speed, so use it only when you really need per-request data.
  - "forwardRef(() => X) breaks a circular dependency between two providers or modules, but it's better to redesign."
cards:
  - q: Name the four kinds of custom providers.
    a: useClass, useValue, useFactory and useExisting.
  - q: When do you use useFactory?
    a: When the value must be built by code, often from other providers (listed in inject), like a client created from ConfigService values.
  - q: What is the default provider scope in NestJS?
    a: Singleton (Scope.DEFAULT). One instance is created at start-up and shared by the whole app.
  - q: What does Scope.REQUEST do, and what does it cost?
    a: A new instance for every request. Everything that depends on it also becomes request-scoped, which adds work on every request.
  - q: What is forwardRef for?
    a: To let two classes or modules depend on each other (a circular dependency), by delaying when Nest resolves the reference.
---

## 💡 What is it?

Normally you write `providers: [UsersService]`, and Nest creates the class for you. A **custom provider** lets you decide exactly **what** Nest gives when someone asks for a token.

A **scope** decides **how many copies** Nest creates: one for the app, one per request, or one per user of it. `forwardRef` helps when two classes need each other.

## 🏠 Real-life example

Think of **a restaurant kitchen ordering supplies**.

- **useClass**: "Send me a cook." The agency sends a trained cook. You could ask for a trainee cook during practice.
- **useValue**: "Use this exact jar of spice mix." A ready-made thing, given as it is.
- **useFactory**: "Make fresh dough every morning using today's flour and water." Built by a recipe, from other supplies.
- **useExisting**: "When someone asks for 'the chef', send the head cook." Two names, same person.

Scopes:
- **Singleton** = one shared fridge for the whole restaurant.
- **Request** = a fresh plate for every customer's order.
- **Transient** = each cook gets their own knife.

**forwardRef** = two cooks each waiting for the other to start. The manager says, "Start now; you'll meet the other cook later."

## 🧑‍💻 Code example

Set up:

```bash
nest new providers-demo
cd providers-demo
```

Replace `src/main.ts` with this code. Run it with `npm run start:dev`.

```ts
import { NestFactory } from '@nestjs/core';                             // creates the Nest app
import { Module, Controller, Get, Inject, Injectable } from '@nestjs/common'; // building blocks

const APP_SETTINGS = 'APP_SETTINGS';                                     // a string token (a name for a provider)
const GREETER = 'GREETER';                                               // another string token

interface Greeter { greet(name: string): string; }                       // the shape every greeter must have

@Injectable()                                                            // Nest can create this class
class EnglishGreeter implements Greeter {                                // one implementation
  greet(name: string) { return `Hello, ${name}!`; }                      // English greeting
}                                                                        // end of EnglishGreeter

@Injectable()                                                            // Nest can create this class
class MalayalamGreeter implements Greeter {                              // another implementation
  greet(name: string) { return `Namaskaram, ${name}!`; }                 // Malayalam greeting
}                                                                        // end of MalayalamGreeter

@Controller('hello')                                                     // routes start with /hello
class HelloController {                                                  // the controller
  constructor(                                                           // dependencies
    @Inject(APP_SETTINGS) private readonly settings: { appName: string; lang: string }, // useValue provider
    @Inject(GREETER) private readonly greeter: Greeter,                  // useFactory provider
  ) {}                                                                   // end of constructor

  @Get()                                                                 // GET /hello
  hello() {                                                              // the handler
    return { app: this.settings.appName, message: this.greeter.greet('Asha') }; // use both providers
  }                                                                      // end of hello
}                                                                        // end of HelloController

@Module({                                                                // the root module
  controllers: [HelloController],                                        // our controller
  providers: [                                                           // what Nest can inject
    EnglishGreeter,                                                      // short form = { provide: EnglishGreeter, useClass: EnglishGreeter }
    MalayalamGreeter,                                                    // same short form
    { provide: APP_SETTINGS, useValue: { appName: 'Prep Hub', lang: 'ml' } }, // useValue: a ready object; 'ml' = Malayalam
    {                                                                    // a factory provider
      provide: GREETER,                                                  // the token it answers to
      inject: [APP_SETTINGS, EnglishGreeter, MalayalamGreeter],          // what the factory needs, in order
      useFactory: (s: { lang: string }, en: EnglishGreeter, ml: MalayalamGreeter) => // receives those, in the same order
        s.lang === 'ml' ? ml : en,                                       // pick one based on the setting
    },                                                                   // end of the factory provider
  ],                                                                     // end of providers
})                                                                       // end of the module settings
class AppModule {}                                                       // empty body

async function bootstrap() {                                             // start-up function
  const app = await NestFactory.create(AppModule);                       // build the app
  await app.listen(3000);                                                // 3000 = port
}                                                                        // end of bootstrap
bootstrap();                                                             // run it
```

Open `http://localhost:3000/hello`:

```text
{"app":"Prep Hub","message":"Namaskaram, Asha!"}
```

Change `lang: 'ml'` to `lang: 'en'`, and the message becomes `Hello, Asha!`. The controller code doesn't change.

## 🔍 Deeper version

**The four provider types:**

| Type | Example | Use it for |
|---|---|---|
| `useClass` | `{ provide: MailService, useClass: FakeMailService }` | swap one class for another (tests, per environment) |
| `useValue` | `{ provide: 'CONFIG', useValue: { retries: 3 } }` | constants, ready objects, mocks in tests |
| `useFactory` | `{ provide: 'REDIS', inject: [ConfigService], useFactory: (c) => new Redis(c.get('REDIS_URL')) }` | values built by code, maybe `async` |
| `useExisting` | `{ provide: 'LOGGER', useExisting: AppLogger }` | an alias: two tokens, one instance |

A factory can be `async`. Nest waits for it before the app starts. This is handy for opening a connection at start-up.

**Tokens.** A token is the "name" Nest uses to find a provider. A class works as a token. Strings work too, but two modules could pick the same string by mistake. A `Symbol('GREETER')` or a constant exported from one file is safer. TypeScript interfaces **can't** be tokens, because they don't exist at runtime. That is why you need `@Inject(TOKEN)` when the type is an interface.

**Scopes:**

| Scope | How many instances | When created | Typical use |
|---|---|---|---|
| `DEFAULT` ([singleton](glossary:singleton)) | one per app | at start-up | almost everything |
| `REQUEST` | one per request | for each request | per-request data, like the current tenant |
| `TRANSIENT` | one per class that injects it | when injected | a logger that holds the caller's name |

```ts
@Injectable({ scope: Scope.REQUEST })                                   // a new instance for every request
export class TenantContext {                                            // holds the current tenant
  constructor(@Inject(REQUEST) private readonly req: Request) {}        // REQUEST (from @nestjs/core) = the current request
  get tenantId() { return this.req.headers['x-tenant-id'] as string; }  // read the tenant from a header
}                                                                       // end of TenantContext
```

**Scope bubbles up.** If `CandidatesService` injects the request-scoped `TenantContext`, then `CandidatesService` becomes request-scoped too. So does the controller that uses it. Nest now builds that whole chain on every request. That costs speed and memory.

Ways to avoid this cost:
- Pass the tenant ID as a normal argument from the controller to the service.
- Use `AsyncLocalStorage` from Node (for example through a package like `nestjs-cls`) to read request data anywhere, while classes stay singletons.
- Use **durable providers**: Nest can keep one instance tree per tenant instead of per request. This is an advanced feature built for multi-tenant apps.

**Circular dependencies and forwardRef.** If `UsersService` needs `AuthService` and `AuthService` needs `UsersService`, Nest can't decide which to build first. You'll see an error about a circular dependency.

```ts
@Injectable()                                                           // Nest can create it
export class UsersService {                                             // one side of the circle
  constructor(                                                          // dependencies
    @Inject(forwardRef(() => AuthService)) private readonly auth: AuthService, // "resolve AuthService later"
  ) {}                                                                  // end of constructor
}                                                                       // end of UsersService
// Do the same on the other side. For modules: imports: [forwardRef(() => AuthModule)]
```

`forwardRef` is a patch. A better fix is often to move the shared logic into a third service that both can use.

**Optional dependencies.** Add `@Optional()` before a parameter. If no provider exists, Nest passes `undefined` instead of failing.

## 🎯 Why do we use it?

- **Swap parts without touching callers.** Real mailer in production, fake one in tests, with only the provider line changed.
- **Inject things that aren't classes.** Config objects, SDK clients and database connections.
- **Control lifetime.** Most things should be shared. A few need a fresh copy per request.
- **Untangle two-way dependencies** when you can't redesign right away.

## ⚠️ Common mistakes

- **Making things request-scoped "just in case".** It slows every request and spreads up the chain.
- **Using an interface as a token.** Interfaces vanish at runtime. Use a string, symbol or abstract class.
- **Getting the `inject` order wrong** in a factory. The factory receives values in the same order as the `inject` array.
- **Using `forwardRef` everywhere** instead of fixing a tangled design.

## 🗣️ How to answer in an interview

> "Custom providers let me control what Nest injects for a token. `useClass` swaps an implementation, `useValue` gives a ready object like config or a mock, `useFactory` builds a value with code and can inject other providers, and `useExisting` is an alias. For string or symbol tokens I use `@Inject(TOKEN)`.
>
> By default every provider is a singleton. `Scope.REQUEST` gives a new instance per request, and `TRANSIENT` gives one per consumer. I'm careful with request scope, because it bubbles up to everything that depends on it and costs performance. For per-request data like the tenant, I'd rather pass it explicitly or use `AsyncLocalStorage`.
>
> For circular dependencies, `forwardRef` works, but I'd first try to move the shared logic into its own service. I haven't used Nest in production. But at SkillKeepr the tenant comes from the subdomain and travels with each request, so per-request context is a problem I understand well."

## 🔁 Follow-up questions

### How do you replace a provider in a unit test?

In `Test.createTestingModule`, list `{ provide: MailService, useValue: fakeMailer }`. Or use `.overrideProvider(MailService).useValue(fakeMailer)`. See [testing](topic:nestjs/testing).

### Can a factory provider be async?

Yes. If `useFactory` returns a Promise, Nest waits for it before starting the app. Classes that inject it get the resolved value.

### Why does a request-scoped provider make its consumers request-scoped?

A singleton is built once, at start-up. It can't hold a new copy of something that changes every request. So Nest must rebuild the consumer per request too.

### What is the difference between useClass and useExisting?

`useClass` creates a new instance of that class for this token. `useExisting` points the token at a provider that already exists, so both tokens share one instance.

## ✅ Quick check

### 1. `providers: [UsersService]` is short for which custom provider?

:::answer
`{ provide: UsersService, useClass: UsersService }`.
:::

### 2. A singleton `ReportsService` injects a `Scope.REQUEST` provider. What is the scope of `ReportsService` now?

:::answer
**Request scope.** Request scope bubbles up the chain, so `ReportsService` is now created for every request.
:::

### 3. You inject a `PaymentGateway` interface and Nest fails. Why, and what's the fix?

:::answer
**Interfaces don't exist at runtime**, so Nest can't use them as tokens. Register the provider with a string or symbol token, like `{ provide: 'PAYMENT_GATEWAY', useClass: StripeGateway }`, and inject it with `@Inject('PAYMENT_GATEWAY')`.
:::
