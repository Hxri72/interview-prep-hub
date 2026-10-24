---
title: Dynamic modules (forRoot / forRootAsync)
stack: nestjs
order: 21
level: Advanced
mustKnow: false
askedFrequency: sometimes
summary:
  - "A dynamic module is a module you can set up with options when you import it, like ConfigModule.forRoot({ isGlobal: true })."
  - A static module always gives the same providers. A dynamic module builds its providers from the options you pass.
  - "forRoot() = set up once for the whole app. forFeature() = add extra parts for one feature module. register() = set up per import."
  - forRootAsync() is used when the options come from somewhere else, like ConfigService, using useFactory and inject.
  - "Inside, a dynamic module is just a static method that returns an object: { module, providers, exports }."
cards:
  - q: What is a dynamic module in NestJS?
    a: A module that takes options when you import it and builds its providers from those options, for example MongooseModule.forRoot(uri).
  - q: What is the difference between forRoot and forFeature?
    a: forRoot sets up the shared thing once for the whole app (like the DB connection). forFeature adds parts for one feature module (like one model).
  - q: When do you use forRootAsync?
    a: When the options are not known in code and must come from another provider, like ConfigService reading environment variables.
  - q: What does a dynamic module's static method return?
    a: "A DynamicModule object: { module, providers, exports }, and optionally imports and global."
---

## 💡 What is it?

A normal [module](topic:nestjs/modules) is fixed. It always gives the same providers to whoever imports it.

A **dynamic module** takes **options** when you import it. It builds its providers from those options.

You already use them: `ConfigModule.forRoot()`, `MongooseModule.forRoot(uri)` and `JwtModule.register({ secret })` are all dynamic modules.

## 🏠 Real-life example

Think of **ordering a pizza** versus **buying a packed sandwich**.

The sandwich is the same for everyone. The pizza shop asks you: "Which size? Which toppings?" Then it makes a pizza just for you.

- **The packed sandwich** = a static module. Same providers every time.
- **The pizza shop** = a dynamic module.
- **Your order (size, toppings)** = the options you pass, like `{ secret: 'abc' }`.
- **The finished pizza** = the providers the module builds from your options.
- **Calling the shop to ask your friend's choice first** = `forRootAsync`. The options come from someone else (like ConfigService).

## 🧑‍💻 Code example

Create a project with `npx @nestjs/cli new dyn-demo` and add these files. Run it with `npm run start:dev`.

`src/greeting/greeting.module.ts`:

```ts
import { DynamicModule, Injectable, Inject, Module } from '@nestjs/common'; // Nest building blocks

export const GREETING_OPTIONS = 'GREETING_OPTIONS';                // a token (name) for our options provider

@Injectable()                                                      // Nest can create and inject this class
export class GreetingService {                                     // a service that uses the options
  constructor(@Inject(GREETING_OPTIONS) private opts: { word: string }) {} // ask Nest for the options by token
  greet(name: string) {                                            // a method that builds a greeting
    return `${this.opts.word}, ${name}!`;                          // e.g. "Namaste, Asha!"
  }                                                                // end of greet
}                                                                  // end of GreetingService

@Module({})                                                        // empty metadata: everything comes from forRoot
export class GreetingModule {                                      // our dynamic module
  static forRoot(options: { word: string }): DynamicModule {       // static method that takes options
    return {                                                       // return a DynamicModule object
      module: GreetingModule,                                      // which module this is
      providers: [                                                 // providers built from the options
        { provide: GREETING_OPTIONS, useValue: options },          // useValue = store the options object as a provider
        GreetingService,                                           // the service that reads them
      ],                                                           // end of providers
      exports: [GreetingService],                                  // let importing modules use the service
    };                                                             // end of returned object
  }                                                                // end of forRoot
}                                                                  // end of GreetingModule
```

`src/app.module.ts`:

```ts
import { Controller, Get, Module } from '@nestjs/common';          // Nest decorators
import { GreetingModule, GreetingService } from './greeting/greeting.module'; // our dynamic module

@Controller()                                                      // controller at the root path "/"
class AppController {                                              // a tiny controller
  constructor(private greeting: GreetingService) {}                // Nest injects the service
  @Get()                                                           // handles GET /
  hello() {                                                        // route handler
    return this.greeting.greet('Asha');                            // use the configured service
  }                                                                // end of hello
}                                                                  // end of AppController

@Module({                                                          // the root module
  imports: [GreetingModule.forRoot({ word: 'Namaste' })],          // import WITH options: word = "Namaste"
  controllers: [AppController],                                    // register the controller
})                                                                 // end of module metadata
export class AppModule {}                                          // end of AppModule
```

```text
$ curl http://localhost:3000
Namaste, Asha!
```

Change `'Namaste'` to `'Hello'` and the same module now says "Hello, Asha!". That is the whole idea.

## 🔍 Deeper version

**What a dynamic module returns.** A static method returns a `DynamicModule` object:

```ts
{
  module: GreetingModule,        // the class this belongs to
  imports: [],                   // other modules it needs
  providers: [/* ... */],        // providers built from the options
  exports: [/* ... */],          // what importers can use
  global: false,                 // true = available everywhere without importing again
}
```

Nest merges this with the `@Module()` metadata on the class.

**Naming conventions.** The names are only conventions, but most libraries follow them:

| Method | Meaning | Example |
|---|---|---|
| `forRoot()` | Set up once, for the whole app | `MongooseModule.forRoot(uri)` |
| `forFeature()` | Add parts for one feature module, reusing the root setup | `MongooseModule.forFeature([{ name: User.name, schema: UserSchema }])` |
| `register()` | Set up each time you import it, maybe with different options | `JwtModule.register({ secret })` |

**forRootAsync: options from another provider.** Often the options depend on [config](topic:nestjs/config). You can't read `ConfigService` at import time. So you give Nest a factory instead:

```ts
MongooseModule.forRootAsync({
  imports: [ConfigModule],                             // the module that has ConfigService
  inject: [ConfigService],                             // inject ConfigService into the factory
  useFactory: (config: ConfigService) => ({            // a factory function that builds the options
    uri: config.get<string>('MONGO_URI'),              // read the DB URL from env
  }),                                                  // end of useFactory
}),                                                    // end of forRootAsync
```

Nest first creates `ConfigService`, then calls your factory, then builds the module. This uses the same `useFactory` idea as [custom providers](topic:nestjs/custom-providers-scopes).

**ConfigurableModuleBuilder.** Writing `forRoot` and `forRootAsync` by hand is repetitive. Nest has a helper, `ConfigurableModuleBuilder`, that creates both methods for you. Library authors use it a lot.

**Global modules.** Setting `global: true` (or `isGlobal: true` in `ConfigModule.forRoot`) means other modules can inject its exports without importing it. Use it only for truly app-wide things, like config.

## 🎯 Why do we use it?

- **Reusable modules.** One database or mail module works in many apps with different settings.
- **Config at the right time.** `forRootAsync` waits for config to load before connecting.
- **Clean app module.** All setup for a library sits in one `imports` line.

## ⚠️ Common mistakes

- **Calling `forRoot` in many modules.** That can create several DB connections. Use `forRoot` once in `AppModule` and `forFeature` in feature modules.
- **Reading `process.env` directly in `forRoot`.** It may run before `.env` loads. Use `forRootAsync` with `ConfigService`.
- **Forgetting `exports`.** The module builds the service, but importers can't inject it.
- **Making everything global.** Then you can't see which module depends on what.

## 🗣️ How to answer in an interview

> "A dynamic module is a module that takes options when you import it. Inside, it's a static method like `forRoot` that returns a `DynamicModule` object with `module`, `providers` and `exports`, built from those options.
>
> The usual pattern is `forRoot` once in the app module, for things like the Mongoose connection, and `forFeature` in feature modules to register models. When the options depend on config, I use `forRootAsync` with `useFactory` and `inject: [ConfigService]`, so the connection string comes from environment variables after config has loaded.
>
> I haven't used NestJS in production. At my current job our backend is Node.js and TypeScript on AWS Lambda, with a shared library used across services. The idea of one reusable module, set up with options per service, maps well to that."

## 🔁 Follow-up questions

### What is the difference between a static and a dynamic module?

A static module has fixed metadata in `@Module()`. A dynamic module returns its metadata from a static method, so the providers can change based on the options you pass.

### Why does forRootAsync exist?

Because some options are only known after other providers are ready. For example, the DB URL comes from `ConfigService`. `forRootAsync` lets you inject that service into a factory.

### Is forRoot a special Nest keyword?

No. It's just a naming convention. Nest only cares that the method returns a valid `DynamicModule` object.

### What does `global: true` do?

It makes the module's exports available in every module without importing it again. It's handy for config, but too much of it hides dependencies.

## ✅ Quick check

### 1. You want to register the `User` model inside `UsersModule`. Which do you use?

- A) `MongooseModule.forRoot(uri)`
- B) `MongooseModule.forFeature([{ name: User.name, schema: UserSchema }])`

:::answer
**B.** `forRoot` creates the connection once in `AppModule`. `forFeature` registers models for one feature module.
:::

### 2. The JWT secret is in a `.env` file read by `ConfigService`. Which method fits best?

:::answer
`JwtModule.registerAsync({ inject: [ConfigService], useFactory: (config) => ({ secret: config.get('JWT_SECRET') }) })`. The async version waits for `ConfigService`.
:::

### 3. True or false: a dynamic module's static method must be named `forRoot`.

:::answer
**False.** Any name works. `forRoot`, `forFeature` and `register` are conventions.
:::
