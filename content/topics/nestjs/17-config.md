---
title: Config and environment variables (@nestjs/config)
stack: nestjs
order: 17
level: Basic
mustKnow: false
askedFrequency: common
summary:
  - "@nestjs/config loads your .env file and gives the values to any class through ConfigService."
  - "Call ConfigModule.forRoot({ isGlobal: true }) once in the root module, so every module can use ConfigService."
  - "Validate the config at start-up (for example with a Joi validationSchema). Then the app refuses to start if a value is missing."
  - "Read values with configService.get('KEY'), or getOrThrow('KEY') when the value is required."
  - Never commit .env files. In production, the hosting platform or a secrets manager sets the real values.
cards:
  - q: How do you read environment variables in NestJS?
    a: Import ConfigModule.forRoot() in the root module, then inject ConfigService and call configService.get('KEY').
  - q: What does isGlobal true do in ConfigModule.forRoot?
    a: It makes ConfigService available in every module, so you don't have to import ConfigModule again in each one.
  - q: Why validate config at start-up?
    a: So a missing or wrong value (like no database URL) stops the app right away with a clear error, instead of failing later on a real request.
  - q: What is the difference between get and getOrThrow?
    a: get returns undefined when the key is missing. getOrThrow throws an error, so you notice the problem at once.
---

## 💡 What is it?

Your app needs settings like the database address, the port and secret keys. These change between your laptop and production. So you keep them outside the code, in [environment variables](glossary:environment-variable).

`@nestjs/config` is the official NestJS package for this. It reads your `.env` file and gives the values to your classes through a service called `ConfigService`.

## 🏠 Real-life example

Think of **a school timetable on the notice board**.

The teachers don't memorise the timetable. They look at the notice board each day. When the timetable changes, only the board is updated. The teachers keep doing the same job.

- **The notice board** = the `.env` file or the server's environment variables.
- **The office staff who put up the board** = `ConfigModule`, which loads the values at start-up.
- **A teacher reading the board** = a service that asks `ConfigService` for a value.
- **The principal checking the board is complete before school starts** = config validation. If a period has no teacher, school doesn't open until it's fixed.

## 🧑‍💻 Code example

Set up:

```bash
nest new config-demo
cd config-demo
npm install @nestjs/config
```

Create a file `.env` in the project root (next to `package.json`):

```text
PORT=3000
APP_NAME=Prep Hub
```

Replace `src/main.ts` with this code. Run it with `npm run start:dev`.

```ts
import { NestFactory } from '@nestjs/core';                          // creates the Nest app
import { Module, Controller, Get } from '@nestjs/common';            // building blocks
import { ConfigModule, ConfigService } from '@nestjs/config';       // the config package

@Controller('info')                                                  // routes start with /info
class InfoController {                                               // a small controller
  constructor(private readonly config: ConfigService) {}             // Nest injects ConfigService for us

  @Get()                                                             // GET /info
  getInfo() {                                                        // the handler
    const name = this.config.get<string>('APP_NAME');                // read APP_NAME from .env (<string> = its type)
    return { name };                                                 // returns {"name":"Prep Hub"}
  }                                                                  // end of getInfo
}                                                                    // end of InfoController

@Module({                                                            // the root module
  imports: [ConfigModule.forRoot({ isGlobal: true })],               // load .env once; isGlobal = usable in every module
  controllers: [InfoController],                                     // our controller
})                                                                   // end of the module settings
class AppModule {}                                                   // empty class body; the decorator does the work

async function bootstrap() {                                         // start-up function
  const app = await NestFactory.create(AppModule);                   // build the app
  const config = app.get(ConfigService);                             // get ConfigService outside a class too
  const port = config.get<number>('PORT', 3000);                     // read PORT; 3000 = default if it's missing
  await app.listen(port);                                            // start listening on that port
  console.log(`Running on port ${port}`);                            // confirm in the terminal
}                                                                    // end of bootstrap
bootstrap();                                                         // run it
```

Open `http://localhost:3000/info`:

```text
{"name":"Prep Hub"}
```

## 🔍 Deeper version

**Validate at start-up.** A missing database URL should stop the app at once, not crash it on the first request. `ConfigModule.forRoot` accepts a **Joi** schema. Joi is the validation library you may know from Express.

```ts
import * as Joi from 'joi';                                          // Joi validation library (npm install joi)

ConfigModule.forRoot({                                               // load .env as before
  isGlobal: true,                                                    // ConfigService everywhere
  validationSchema: Joi.object({                                     // rules for the env values
    NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'), // allowed values
    PORT: Joi.number().default(3000),                                // a number; 3000 if missing
    MONGO_URI: Joi.string().uri().required(),                        // must exist and look like a URL
    JWT_SECRET: Joi.string().min(32).required(),                     // must exist, at least 32 characters
  }),                                                                // end of the schema
});                                                                  // end of forRoot
```

If `MONGO_URI` is missing, the app fails at start-up with a clear message. You can also pass a custom `validate(config)` function instead, for example with class-validator or Zod.

**Useful `forRoot` options:**

| Option | What it does |
|---|---|
| `isGlobal: true` | `ConfigService` can be injected in every module |
| `envFilePath: ['.env.local', '.env']` | which files to read; the first file wins for a key |
| `ignoreEnvFile: true` | don't read any file; use only real env vars (common in production) |
| `load: [databaseConfig]` | load config objects built by your own functions |
| `cache: true` | remember values after the first read, for speed |

Real environment variables (set by the server) win over values in `.env`.

**Grouped config with `registerAs`.** In bigger apps, group related values under a name:

```ts
import { registerAs } from '@nestjs/config';                         // helper to make a named config group

export default registerAs('database', () => ({                        // group name = 'database'
  uri: process.env.MONGO_URI,                                        // read the raw env var
  poolSize: parseInt(process.env.DB_POOL_SIZE ?? '10', 10),          // env vars are strings; convert to number (10 = default)
}));                                                                 // end of the group
```

After you add it with `load: [databaseConfig]`, you read it with `config.get('database.uri')`.

**`get` vs `getOrThrow`.** `get('KEY')` returns `undefined` if the key is missing. `getOrThrow('KEY')` throws an error at once. Use `getOrThrow` for values the app can't work without.

**Using config to set up other modules.** Database and JWT modules often need config values. You use their async setup for this:

```ts
MongooseModule.forRootAsync({                                        // set up Mongoose after config has loaded
  inject: [ConfigService],                                           // ask Nest for ConfigService
  useFactory: (config: ConfigService) => ({ uri: config.getOrThrow('MONGO_URI') }), // build the options
});                                                                  // end of forRootAsync
```

See [MongoDB with Mongoose](topic:nestjs/mongoose) and [dynamic modules](topic:nestjs/dynamic-modules).

:::version[Version note]
Node.js 20.6+ and Node.js 24 can load a `.env` file without any package: `node --env-file=.env app.js`. In NestJS apps, `@nestjs/config` is still the usual choice, because it adds validation and injection.
:::

## 🎯 Why do we use it?

- **Same code, different settings.** Dev, test and production each get their own values, with no code change.
- **Secrets stay out of the code.** Passwords and keys aren't committed to Git.
- **Fail fast.** Validation catches a missing value at start-up, not in front of a user.
- **Easy testing.** In tests you can give `ConfigService` fake values.

## ⚠️ Common mistakes

- **Using `process.env` all over the code.** It skips validation and is hard to fake in tests. Use `ConfigService`.
- **Forgetting that env values are strings.** `PORT` is `"3000"`, not `3000`. Convert it, or let the Joi schema convert it.
- **Committing `.env` to Git.** Add it to `.gitignore`. Commit a `.env.example` with fake values instead.
- **Forgetting `isGlobal: true`.** Then other modules can't inject `ConfigService` unless they import `ConfigModule` too.

## 🗣️ How to answer in an interview

> "In NestJS I use `@nestjs/config`. I call `ConfigModule.forRoot` once in the root module with `isGlobal: true`. Then any class can inject `ConfigService` and read values with `get` or `getOrThrow`.
>
> I always validate config at start-up. Joi works directly as a `validationSchema`, and I already use Joi for validation in Node. So if the database URI or JWT secret is missing, the app won't start.
>
> For modules that need config, like Mongoose or JWT, I use `forRootAsync` or `registerAsync` with a factory that injects `ConfigService`. In production, I don't read a `.env` file. The real values come from the platform's environment or a secrets manager, and I never commit secrets to Git."

## 🔁 Follow-up questions

### Where should secrets live in production?

In the hosting platform's environment variables or a secrets manager, like AWS Secrets Manager or SSM Parameter Store. The `.env` file is only for local development.

### Can you have different .env files per environment?

Yes. Pass `envFilePath`, for example based on `NODE_ENV`. Many teams keep `.env.development` and `.env.test` locally, and use real env vars in production.

### How do you use ConfigService inside main.ts?

Call `app.get(ConfigService)` after `NestFactory.create`. Then read values like the port.

### How do you give fake config values in a test?

Provide a fake object for `ConfigService` in the testing module, with `{ provide: ConfigService, useValue: { get: () => 'test-value' } }`. See [testing](topic:nestjs/testing).

## ✅ Quick check

### 1. `.env` has `PORT=4000`. What is the type of `process.env.PORT`?

:::answer
**A string: `"4000"`.** All environment variables are strings. Convert it with `Number()` or let the validation schema do it.
:::

### 2. What happens if `MONGO_URI` is marked `.required()` in the Joi schema and it's missing?

:::answer
**The app fails to start**, with an error saying `MONGO_URI` is required. This is good: you find the problem at once.
:::

### 3. True or false: without `isGlobal: true`, every module that wants `ConfigService` must import `ConfigModule`.

:::answer
**True.**
:::
