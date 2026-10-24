---
title: Nest CLI, a new project and the folder structure
stack: nestjs
order: 3
level: Basic
mustKnow: false
askedFrequency: common
summary:
  - The Nest CLI (@nestjs/cli) creates projects (nest new) and generates files (nest g).
  - main.ts starts the app with NestFactory.create(AppModule) and app.listen().
  - app.module.ts is the root module. It lists the other modules, controllers and providers.
  - The usual layout is one folder per feature, like src/users/ with its module, controller, service and DTOs.
  - "nest g resource users makes a full CRUD feature folder in one command."
cards:
  - q: What command creates a new Nest project?
    a: nest new <project-name> (after installing @nestjs/cli).
  - q: What does main.ts do?
    a: It creates the app from the root module with NestFactory.create(AppModule) and starts it with app.listen(port).
  - q: What is the root module?
    a: AppModule in app.module.ts. It's where Nest starts building the app, and it imports all the other modules.
  - q: How do you generate a full CRUD feature?
    a: nest g resource <name>. It creates the module, controller, service, DTOs and entity files.
---

## 💡 What is it?

The **Nest CLI** is a command-line tool. It creates new Nest projects and generates files for you.

Every Nest project starts with the same few files. `main.ts` starts the app. `app.module.ts` is the **root module**, the starting point of your app.

Each feature usually gets its own folder, like `src/users/`.

## 🏠 Real-life example

Think of **a new shopping mall**.

- **The CLI** = the builder who builds the mall and adds new shops with the same standard layout.
- **`main.ts`** = the main gate. When it opens, the mall starts working.
- **`AppModule`** = the mall's directory board at the entrance. It lists every shop.
- **A feature folder like `users/`** = one shop. It has a counter (controller), staff (service), and price lists (DTOs).
- **`nest g resource`** = the builder setting up a full new shop in one go, counter and shelves included.

## 🧑‍💻 Code example

Create a project and a feature:

```bash
npm i -g @nestjs/cli          # install the Nest CLI once
nest new shop-api             # create a new project (pick npm when asked)
cd shop-api
nest g resource products      # generate a full "products" feature (choose REST API, then Yes for CRUD)
npm run start:dev             # start in watch mode on port 3000
```

This is the `src/main.ts` the CLI creates (comments added):

```ts
import { NestFactory } from '@nestjs/core';                  // NestFactory builds the app
import { AppModule } from './app.module';                     // the root module of our app

async function bootstrap() {                                  // "bootstrap" = start-up function
  const app = await NestFactory.create(AppModule);            // build the app from the root module (Express by default)
  await app.listen(process.env.PORT ?? 3000);                 // listen on PORT, or 3000 if PORT is not set
}                                                             // end of bootstrap
bootstrap();                                                  // run the start-up function
```

After `nest g resource products`, the root module imports the new feature automatically:

```ts
import { Module } from '@nestjs/common';                      // the @Module decorator
import { AppController } from './app.controller';             // the starter controller
import { AppService } from './app.service';                   // the starter service
import { ProductsModule } from './products/products.module';  // added by "nest g resource"

@Module({                                                     // describe this module
  imports: [ProductsModule],                                  // other modules this app uses
  controllers: [AppController],                               // controllers that belong to this module
  providers: [AppService],                                    // services that belong to this module
})                                                            // end of @Module settings
export class AppModule {}                                     // the root module class (empty body is normal)
```

```text
$ curl http://localhost:3000/products
This action returns all products
```

## 🔍 Deeper version

**A typical folder layout:**

```text
shop-api/
├── src/
│   ├── main.ts                    ← starts the app
│   ├── app.module.ts              ← root module
│   ├── products/                  ← one feature
│   │   ├── products.module.ts
│   │   ├── products.controller.ts
│   │   ├── products.service.ts
│   │   ├── dto/
│   │   │   ├── create-product.dto.ts
│   │   │   └── update-product.dto.ts
│   │   └── entities/product.entity.ts
│   └── common/                    ← shared guards, pipes, filters, interceptors
├── test/                          ← end-to-end tests
├── nest-cli.json                  ← CLI settings
├── tsconfig.json
└── package.json
```

**Useful CLI generators** (`nest g <type> <name>`):

| Command | Creates |
|---|---|
| `nest g module users` | `users.module.ts` and imports it into the parent module |
| `nest g controller users` | a controller + test file, added to the module |
| `nest g service users` | a provider + test file, added to the module |
| `nest g resource users` | module, controller, service, DTOs, entity (full CRUD) |
| `nest g guard auth` / `pipe` / `interceptor` / `filter` | the matching class |

Add `--no-spec` to skip test files. Add `--dry-run` to see what would be created without writing anything.

**npm scripts** in a new project:
- `start:dev` — runs with file watching, so it restarts when you save.
- `build` — compiles TypeScript into `dist/`.
- `start:prod` — runs the compiled `dist/main.js`. Use this in production.

**Feature folders, not type folders.** Nest projects group by feature (`users/`, `orders/`), not by type (`controllers/`, `services/`). Everything for one feature lives together, so a module can grow or move easily.

:::version[Version note]
NestJS 12 (August 2026) changed the default tools in **new** projects. New scaffolds use ES modules and Vitest instead of Jest. Older projects keep their existing setup, so check `package.json` to see which one a project uses.
:::

## 🎯 Why do we use it?

- **Speed.** One command makes a working feature with the right wiring.
- **Consistency.** Every file is named and placed the same way across the team.
- **Fewer mistakes.** The CLI adds new controllers and providers to the module for you, so you don't forget.

## ⚠️ Common mistakes

- **Forgetting to register a class.** If you create a file by hand, add it to the module's `controllers` or `providers`. Otherwise Nest ignores it or throws a DI error.
- **Running `start:dev` in production.** It's slower and watches files. Build and use `start:prod`.
- **Putting everything in `app.module.ts`.** Make one module per feature and import it.
- **Grouping by file type.** Large `controllers/` and `services/` folders get hard to navigate.

## 🗣️ How to answer in an interview

> "I start a project with the Nest CLI using `nest new`. `main.ts` is the entry point. It calls `NestFactory.create(AppModule)` and then `app.listen()`. `AppModule` is the root module and imports every feature module.
>
> I organise by feature: each feature folder has its own module, controller, service and DTOs. Shared guards, pipes and filters go in a common folder. For a new CRUD feature, `nest g resource` generates all of that and registers it in the module.
>
> For production I run `npm run build` and start the compiled `dist/main.js`, not the watch mode."

## 🔁 Follow-up questions

### What is `nest-cli.json` for?

It holds settings for the CLI. For example, the source folder, compiler options, and settings for monorepo projects with many apps.

### What's the difference between `start:dev` and `start:prod`?

`start:dev` compiles and runs your code in watch mode, restarting on every save. `start:prod` runs the already-built JavaScript in `dist/`, which is faster and has no file watching.

### Can one Nest project contain several apps?

Yes. Nest's monorepo mode (`nest g app` and `nest g library`) holds several apps and shared libraries in one repository.

### Where do shared guards and pipes go?

Usually in a `common/` or `shared/` folder. If they need providers, put them in a shared module that other modules import.

## ✅ Quick check

### 1. Which file starts the Nest application?

- A) `app.module.ts`
- B) `main.ts`
- C) `nest-cli.json`

:::answer
**B) `main.ts`.** It calls `NestFactory.create(AppModule)` and `app.listen()`.
:::

### 2. You wrote `orders.service.ts` by hand, but injecting it fails. What did you probably forget?

:::answer
Adding `OrdersService` to the **`providers`** array of the module (for example `OrdersModule`).
:::

### 3. Which command generates a module, controller, service and DTOs for `orders` in one go?

:::answer
`nest g resource orders`
:::
