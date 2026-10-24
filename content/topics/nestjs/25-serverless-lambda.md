---
title: NestJS on AWS Lambda (serverless)
stack: nestjs
order: 25
level: Advanced
mustKnow: false
askedFrequency: sometimes
summary:
  - A Nest app expects a long-running server. Lambda runs a function per request. An adapter connects the two.
  - The common way is @codegenie/serverless-express. It turns the API Gateway event into an Express request for your Nest app.
  - "Create the Nest app once, outside the handler, and cache it. Warm calls then reuse it instead of booting Nest again."
  - "Cold starts are the main cost: Nest loads modules and builds DI on boot. Keep the app small, bundle the code, avoid heavy imports."
  - "Options: one Lambda for the whole Nest app (\"Lambdalith\"), or one Lambda per module. Serverless Framework, SAM or CDK can deploy it."
cards:
  - q: How do you run a Nest app on AWS Lambda?
    a: Wrap the Nest app's Express instance with an adapter like @codegenie/serverless-express and export that as the Lambda handler.
  - q: Why cache the Nest app outside the handler?
    a: So warm Lambda calls reuse the already-built app. Booting Nest on every request would make each call slow.
  - q: What is a cold start?
    a: The extra time when Lambda starts a new container and your code boots for the first time, before it can handle a request.
  - q: What is a "Lambdalith"?
    a: One Lambda function that runs the whole API (all routes), instead of one function per route.
---

## 💡 What is it?

A normal Nest app is a **server**. It starts once, then waits for requests on a port.

**AWS Lambda** works differently. It runs **a function for each request** and may sleep between them. See [serverless and Lambda](topic:architecture/serverless-lambda).

To run Nest on Lambda, you use an **adapter**. It turns the Lambda event into a normal HTTP request that Nest understands.

## 🏠 Real-life example

Think of **a wedding caterer** versus **a restaurant**.

A restaurant (a normal server) keeps its kitchen open all day. A caterer sets up a kitchen only when there is an event. Setting up takes time the first time. If events come back to back, the kitchen stays set up.

- **The restaurant open all day** = a Nest server on EC2 or a container.
- **The caterer** = Lambda.
- **Setting up the kitchen** = a cold start: booting Nest and building all modules.
- **Keeping the kitchen set up between events** = caching the Nest app outside the handler.
- **The translator who turns a guest's order into the chef's language** = the serverless-express adapter.

## 🧑‍💻 Code example

In a project made with `npx @nestjs/cli new lambda-demo`, install the adapter and Lambda types:

```bash
npm install @codegenie/serverless-express
npm install -D @types/aws-lambda
```

Save this as `src/lambda.ts`. It is the Lambda entry point. Locally, you can still run `npm run start:dev` with `main.ts`.

```ts
import { NestFactory } from '@nestjs/core';                        // creates the Nest app
import serverlessExpress from '@codegenie/serverless-express';     // adapter: Lambda event ⇄ Express request
import type { Context } from 'aws-lambda';                        // Lambda types (TypeScript only)
import { AppModule } from './app.module';                          // the root module

type AsyncHandler = (event: unknown, context: Context) => Promise<unknown>; // an async handler: no callback
let cachedServer: AsyncHandler | undefined;                        // stays alive between warm calls

async function bootstrap(): Promise<AsyncHandler> {                // build the app once
  const app = await NestFactory.create(AppModule);                 // create Nest (uses Express by default)
  app.enableCors();                                                // allow browser calls from other origins
  await app.init();                                                // run startup, but don't listen on a port
  const expressApp = app.getHttpAdapter().getInstance();           // the Express app inside Nest
  return serverlessExpress({ app: expressApp }) as unknown as AsyncHandler; // wrap it; it returns a Promise when no callback is passed
}                                                                  // end of bootstrap

export const handler = async (event: unknown, context: Context) => { // Lambda calls this (async, no callback)
  cachedServer = cachedServer ?? (await bootstrap());               // cold start: build; warm call: reuse
  return cachedServer(event, context);                             // pass the request to Nest and await the reply
};                                                                 // end of handler
```

:::version[Version note]
The Node.js 24 Lambda runtime no longer supports callback-style handlers. Write `async` handlers that return a value, like the one above.
:::

A small Serverless Framework config, `serverless.yml`. Deploy with `npx serverless deploy` (after `npm run build`).

```yaml
service: nest-api                                  # name of this service
provider:                                          # where and how to run
  name: aws                                        # AWS
  runtime: nodejs24.x                              # Node.js 24 LTS on Lambda
  memorySize: 1024                                 # 1024 MB; more memory also gives more CPU, so faster boot
functions:                                         # the Lambda functions
  api:                                             # one function for the whole API
    handler: dist/lambda.handler                   # file dist/lambda.js, export "handler"
    events:                                        # what triggers it
      - httpApi: '*'                               # every route on API Gateway (HTTP API)
```

```text
$ curl https://abc123.execute-api.ap-south-1.amazonaws.com/
Hello World!
```

The first call is slower (cold start). The next calls reuse `cachedServer`, so they are fast.

## 🔍 Deeper version

**How a request flows:**

```text
Browser → API Gateway → Lambda (handler)
        → serverless-express turns the event into req/res
        → Nest: middleware → guards → pipes → controller
        → response → serverless-express → API Gateway → Browser
```

So your Nest code doesn't change. Only the entry file is different (`lambda.ts` instead of `main.ts`).

**Cold starts.** On a cold start, Lambda loads your code, then Nest scans all modules and builds the [IoC container](glossary:ioc-container). Ways to make it faster:

| Idea | Why it helps |
|---|---|
| Bundle the code (esbuild, webpack, Rspack) | Fewer files to load |
| Remove unused modules and heavy libraries | Less work at boot |
| Lazy-load rare modules (`LazyModuleLoader`) | Load them only when a route needs them |
| More memory | Lambda gives more CPU with more memory |
| Provisioned concurrency | Keeps some containers always warm (costs money) |

**Database connections.** Create the Mongoose connection during bootstrap, so warm calls reuse it. Many Lambdas can open many connections at once, so keep the pool small.

**One Lambda or many?**

| Style | Good | Bad |
|---|---|---|
| One Lambda for the whole Nest app ("Lambdalith") | Simple. Nest routing works as normal | Bigger bundle, slower cold start, one setting for all routes |
| One Lambda per module or route group | Smaller bundles, separate scaling and permissions | More config, shared code must be packaged into each |

**Background work.** Lambda can also be triggered by SQS, EventBridge or Step Functions. For those, you don't need HTTP. You can create a Nest **application context** with `NestFactory.createApplicationContext(AppModule)`, take a service with `app.get(MyService)`, and call it.

**When not to use Lambda.** WebSockets, long jobs over 15 minutes, or steady high traffic often fit containers (ECS, Fargate) better.

## 🎯 Why do we use it?

- **Pay per use.** No cost when nobody calls the API.
- **Auto-scaling.** Lambda runs more copies when traffic grows.
- **Keep Nest's structure.** You get modules, DI and guards on a serverless platform.

## ⚠️ Common mistakes

- **Creating the Nest app inside the handler every time.** Every call becomes a cold start.
- **Calling `app.listen()` in Lambda.** There is no port to listen on. Use `app.init()`.
- **Opening a new DB connection per request.** You hit the database's connection limit fast.
- **Shipping all of `node_modules` unbundled.** The package is big and cold starts get slow.

## 🗣️ How to answer in an interview

> "Nest expects a long-running server, so on Lambda I'd use an adapter like `@codegenie/serverless-express`. In a `lambda.ts` file, I create the Nest app, call `app.init()` instead of `listen()`, take the underlying Express instance, and wrap it as the handler.
>
> The important part is caching: I keep the built server in a variable outside the handler, so warm calls reuse it and only cold starts pay the boot cost. To keep cold starts small, I'd bundle the code, avoid heavy modules, and reuse the database connection.
>
> At my current job our backend runs on AWS Lambda behind API Gateway, deployed with the Serverless Framework, with background work on SQS, Step Functions and EventBridge crons. We don't use Nest there, but the Lambda side is familiar."

## 🔁 Follow-up questions

### Why `app.init()` and not `app.listen()`?

`init()` runs all the startup work, like building modules and lifecycle hooks. `listen()` also opens a port, which Lambda doesn't use. API Gateway sends the event straight to the handler.

### How would you run a Nest service from an SQS-triggered Lambda?

Use `NestFactory.createApplicationContext(AppModule)`, cache it, then `app.get(OrdersService)` and call a method with each message from the event. No HTTP adapter is needed.

### How do you reduce cold start time?

Bundle and tree-shake the code, remove unused modules, lazy-load rare ones, give the function more memory, and use provisioned concurrency for critical APIs.

### Is NestJS a good fit for Lambda at all?

It works well for APIs with normal traffic. Nest's boot time is bigger than a plain handler's. If cold starts are critical, use smaller functions or a container.

## ✅ Quick check

### 1. Where should `bootstrap()` results be stored?

- A) In a local variable inside the handler
- B) In a variable outside the handler (module scope)

:::answer
**B.** Module-scope variables survive between warm calls, so the Nest app is built only once per container.
:::

### 2. True or false: you must rewrite your controllers to run Nest on Lambda.

:::answer
**False.** Only the entry file changes. The adapter turns Lambda events into normal requests for the same controllers.
:::

### 3. Predict: three requests hit the same warm Lambda container. How many times does `NestFactory.create` run?

:::answer
**Once** (on the first, cold call). The other two reuse `cachedServer`.
:::
