---
title: What NestJS is and why it exists
stack: nestjs
order: 1
level: Basic
mustKnow: true
askedFrequency: very common
summary:
  - NestJS is a Node.js framework for building backend APIs with TypeScript.
  - It runs on top of Express by default (or Fastify), so it still uses Node's HTTP server underneath.
  - It gives every project the same structure — modules, controllers and providers (services).
  - Dependency injection is built in. Nest creates your classes and passes each one what it needs.
  - It exists because big Express apps often become messy. Nest adds rules and ready-made building blocks.
cards:
  - q: What is NestJS?
    a: A TypeScript framework for building Node.js backend apps. It sits on top of Express (or Fastify) and adds structure and dependency injection.
  - q: What are the three main building blocks of a Nest app?
    a: Modules (group features), controllers (handle routes) and providers (services with business logic).
  - q: Does NestJS replace Express?
    a: No. By default it uses Express underneath. Nest adds a structure on top of it.
  - q: Why do teams pick NestJS?
    a: It gives a fixed project structure, built-in DI, and ready tools for validation, auth, testing and docs, so large teams write code the same way.
---

## 💡 What is it?

**NestJS** is a [framework](glossary:framework) for building backend APIs with Node.js and TypeScript.

It runs on top of **Express** by default. So it still handles HTTP requests the same way. But it adds a clear structure that every Nest project follows.

You build a Nest app from three parts: **modules**, **controllers** and **providers**. Nest also creates your classes for you and connects them. This is called [dependency injection](glossary:dependency-injection).

## 🏠 Real-life example

Think of **a big school**.

A small tuition class with one teacher needs no rules. But a school with 2,000 students needs departments, timetables and fixed roles. Otherwise it becomes chaos.

- **Express** = the small tuition class. Very free. You decide everything yourself.
- **NestJS** = the organised school. It has fixed rules for where everything goes.
- **Departments (Science, Maths)** = **modules**. Each one groups related things.
- **The front-office clerk** who takes your request and sends it to the right person = a **controller**.
- **The teachers** who do the real work = **providers** (services).
- **The principal's office** that assigns teachers to departments = Nest's **DI system**. Teachers don't hire themselves.

## 🧑‍💻 Code example

Create a project and start it:

```bash
npm i -g @nestjs/cli
nest new hello-nest
cd hello-nest
npm run start:dev
```

Replace `src/app.controller.ts` with this. The dev server reloads by itself.

```ts
import { Controller, Get } from '@nestjs/common';   // load two decorators from Nest's main package

@Controller('hello')                                 // this class handles URLs that start with /hello
export class AppController {                         // a normal TypeScript class
  @Get()                                             // run the method below for GET /hello
  sayHello(): string {                               // the method returns a string
    return 'Hello from NestJS!';                     // Nest sends this text back as the response
  }                                                  // end of sayHello
}                                                    // end of AppController
```

Try it:

```text
$ curl http://localhost:3000/hello
Hello from NestJS!
```

You never wrote `app.get(...)` or `res.send(...)`. The `@Controller` and `@Get` [decorators](glossary:decorator) told Nest what to do.

## 🔍 Deeper version

**What Nest adds on top of Express:**

| Need | Plain Express | NestJS |
|---|---|---|
| Project structure | You decide | Modules → controllers → providers |
| Dependency injection | Manual (factory functions) | Built in ([IoC container](glossary:ioc-container)) |
| Validation | Add Joi/Zod middleware yourself | `ValidationPipe` + DTO classes |
| Auth checks | Custom middleware | Guards (`CanActivate`) |
| Error format | Your own error middleware | Exception filters + `HttpException` |
| Response shaping / logging | Middleware | Interceptors |
| API docs | Add Swagger yourself | `@nestjs/swagger` reads your DTOs |
| Testing | Wire mocks yourself | `Test.createTestingModule()` swaps providers |

**How a request flows.** Nest starts an HTTP server using a **platform adapter**. The default is Express, and Fastify is the other option. A request goes through middleware, guards, interceptors and pipes. Then it reaches your controller method. Nest turns the return value into the response. See [the request lifecycle](topic:nestjs/request-lifecycle).

**Decorators and metadata.** `@Controller('hello')` doesn't run your code. It stores [metadata](glossary:metadata) on the class: "this is a controller at path /hello". At start-up, Nest reads all this metadata and registers the real Express routes for you.

**Inspired by Angular.** Nest borrows Angular's ideas: modules, decorators and DI. Developers who know Angular find it familiar.

:::version[Version note]
NestJS 11 (January 2025) made **Express 5** the default HTTP adapter. NestJS 12 (August 2026) moved the official packages to **ES modules**. Existing CommonJS apps keep working.
:::

## 🎯 Why do we use it?

- **Same structure everywhere.** A new developer can open any Nest project and find things quickly.
- **Large teams.** Fixed rules stop every developer from inventing their own folder layout.
- **Less wiring code.** DI, validation, auth hooks and docs come ready to use.
- **TypeScript first.** Types are used for routes, DTOs and services from day one.
- **Easy testing.** You can swap any service for a fake in tests.

## ⚠️ Common mistakes

- **Thinking Nest replaces Node or Express.** It runs on Node and uses Express (or Fastify) underneath.
- **Using Nest for a tiny script.** For a 2-route API, plain Express is smaller and simpler.
- **Writing Express-style code inside Nest.** Using `@Res()` and `res.send()` everywhere skips Nest's interceptors and filters.
- **Putting business logic in controllers.** Controllers should be thin. Logic goes in providers (services).

## 🗣️ How to answer in an interview

> "NestJS is a TypeScript framework for building Node.js backends. By default it runs on Express, and it can also run on Fastify.
>
> What it adds is structure. You split the app into modules, and each module has controllers for routes and providers for business logic. Dependency injection is built in, so Nest creates the services and passes them into the classes that need them.
>
> It also has ready building blocks: pipes for validation, guards for auth, interceptors for things like logging, and exception filters for errors.
>
> In my current role I've built backends with Express-style Node.js and TypeScript on AWS Lambda, not with Nest. But we had a shared library with things like authorizer decorators, a common response builder and Joi validation. Those map closely to Nest's guards, interceptors and pipes, so the concepts felt familiar when I learned NestJS."

## 🔁 Follow-up questions

### Is NestJS a backend or frontend framework?

Backend. It runs on Node.js and builds APIs, microservices and background workers. It only looks like Angular in style.

### Can NestJS use Fastify instead of Express?

Yes. You install `@nestjs/platform-fastify` and create the app with the Fastify adapter. Most of your code stays the same. Express-specific middleware may need changes.

### Do you have to use TypeScript with Nest?

Nest is built for TypeScript, and nearly all projects use it. Plain JavaScript is possible but rare, and you lose most of the benefits.

### When would you NOT choose NestJS?

For a very small API, a quick prototype, or a single Lambda function where start-up time matters a lot. Plain Express or a light handler is simpler there.

## ✅ Quick check

### 1. What does NestJS use underneath by default to handle HTTP?

- A) Fastify
- B) Express
- C) Its own HTTP server written from scratch

:::answer
**B) Express.** Fastify is an option, but Express is the default.
:::

### 2. Match each part: (a) module, (b) controller, (c) provider → (1) business logic, (2) groups a feature, (3) handles routes.

:::answer
**a → 2, b → 3, c → 1.** Modules group features, controllers handle routes, providers hold the business logic.
:::

### 3. True or false: `@Get()` runs the method immediately when the file loads.

:::answer
**False.** The decorator only stores metadata. Nest reads it at start-up and calls the method when a matching GET request arrives.
:::
