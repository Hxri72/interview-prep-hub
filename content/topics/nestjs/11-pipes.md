---
title: Pipes (built-in and custom)
stack: nestjs
order: 11
level: Intermediate
mustKnow: false
askedFrequency: common
summary:
  - A pipe runs just before your route handler. It works on the values the handler will receive.
  - "Pipes do two jobs: transform (change \"42\" into the number 42) and validate (reject bad input with a 400 error)."
  - "Built-in pipes include ParseIntPipe, ParseBoolPipe, ParseUUIDPipe, ParseEnumPipe, DefaultValuePipe and ValidationPipe."
  - "A custom pipe is a class with @Injectable() that implements PipeTransform and has a transform(value, metadata) method."
  - "Pipes can be used on one parameter, one handler, one controller, or the whole app (useGlobalPipes)."
cards:
  - q: What is a pipe in NestJS?
    a: A class that runs right before the route handler and transforms or validates the handler's arguments.
  - q: What does ParseIntPipe do?
    a: "It turns a string like \"42\" into the number 42. If the value is not a number, it throws a 400 Bad Request."
  - q: What method must a custom pipe have?
    a: "transform(value, metadata). It returns the new value, or throws an exception to reject the request."
  - q: What happens when a pipe throws an error?
    a: The handler never runs. Nest sends an error response, usually 400 Bad Request.
  - q: How do you give a query parameter a default value?
    a: "Use DefaultValuePipe before the parse pipe, e.g. @Query('page', new DefaultValuePipe(1), ParseIntPipe)."
---

## 💡 What is it?

A **pipe** is a small class that runs **just before** your route handler. It looks at the values the handler will receive, like an `id` from the URL.

A pipe does one of two jobs. It can **transform** a value, like turning the text `"42"` into the number `42`. Or it can **validate** a value and stop the request if it is wrong.

If a pipe throws an error, your handler never runs. Nest sends back an error instead.

## 🏠 Real-life example

Think of **a water purifier at home**.

Tap water goes in. Clean water comes out. If the water is too dirty, the purifier shows a red light and gives you nothing.

- **The tap water** = the raw value from the request, like `"42"` as text.
- **The purifier** = the pipe.
- **Clean water** = the transformed value, like the number `42`.
- **The red light** = the pipe throws an error, so Nest sends a `400 Bad Request`.
- **The glass you drink from** = your route handler. It only gets clean water.

## 🧑‍💻 Code example

Create a project with `npx @nestjs/cli new pipes-demo`. Replace `src/app.controller.ts` with this code. Run it with `npm run start:dev`.

```ts
import { Controller, Get, Param, Query, ParseIntPipe, DefaultValuePipe } from '@nestjs/common'; // load Nest decorators and built-in pipes
import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';                 // load what we need for a custom pipe

@Injectable()                                                         // lets Nest create this class for us
export class TrimUpperPipe implements PipeTransform {                 // our own pipe: it must have transform()
  transform(value: string) {                                          // value = the raw text from the request
    const clean = (value ?? '').trim().toUpperCase();                 // remove spaces and make it CAPITAL letters
    if (clean.length !== 3) {                                         // a currency code must have exactly 3 letters
      throw new BadRequestException('Currency must be 3 letters');    // stop here: Nest sends 400 Bad Request
    }                                                                 // end of the if
    return clean;                                                     // the handler receives this cleaned value
  }                                                                   // end of transform
}                                                                     // end of TrimUpperPipe

@Controller('products')                                               // all routes here start with /products
export class AppController {                                          // the controller class
  @Get(':id')                                                         // GET /products/:id
  findOne(@Param('id', ParseIntPipe) id: number) {                    // ParseIntPipe turns "42" into 42, or sends 400
    return { id, type: typeof id };                                   // show that id is now a real number
  }                                                                   // end of findOne

  @Get()                                                              // GET /products?page=2&currency=inr
  findAll(                                                            // the handler for the list
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number, // no page given? use 1, then make it a number
    @Query('currency', TrimUpperPipe) currency: string,               // run our custom pipe on the currency
  ) {                                                                 // end of the parameter list
    return { page, currency };                                        // send back the cleaned values
  }                                                                   // end of findAll
}                                                                     // end of AppController
```

Try it:

```text
$ curl http://localhost:3000/products/42
{"id":42,"type":"number"}

$ curl http://localhost:3000/products/abc
{"message":"Validation failed (numeric string is expected)","error":"Bad Request","statusCode":400}

$ curl "http://localhost:3000/products?currency=%20inr%20"
{"page":1,"currency":"INR"}
```

## 🔍 Deeper version

**Where pipes run.** Pipes run after guards and interceptors (the "before" part), and right before the handler. Nest runs them once for **each argument** of the handler. See [the request lifecycle](topic:nestjs/request-lifecycle).

**Built-in pipes** (all from `@nestjs/common`):

| Pipe | What it does |
|---|---|
| `ParseIntPipe` / `ParseFloatPipe` | text → number, or 400 |
| `ParseBoolPipe` | `"true"` / `"false"` → boolean |
| `ParseUUIDPipe` | checks the value is a UUID (a long unique id string) |
| `ParseEnumPipe` | checks the value is one of an enum's values |
| `ParseArrayPipe` | `"a,b,c"` → `['a','b','c']` |
| `DefaultValuePipe` | uses a default when the value is missing |
| `ValidationPipe` | checks a whole [DTO](glossary:dto) with class-validator. See [validation](topic:nestjs/validation-pipe) |

**The `transform` signature.** It gets two arguments:
- `value`: the current argument value.
- `metadata`: an `ArgumentMetadata` object. It has `type` (`'body'`, `'query'`, `'param'` or `'custom'`), `metatype` (the TypeScript class of the argument, if any) and `data` (the name, like `'id'`).

A pipe may also be `async`. It can return a Promise, for example to look something up in the database.

**Four places to bind a pipe:**

```ts
@Param('id', ParseIntPipe) id: number          // 1. one parameter
@UsePipes(new ValidationPipe())                 // 2. one handler, or 3. a whole controller (put it on the class)
app.useGlobalPipes(new ValidationPipe());       // 4. the whole app, in main.ts
```

Passing the **class** (`ParseIntPipe`) lets Nest create it with [dependency injection](topic:nestjs/dependency-injection). Passing an **instance** (`new ParseIntPipe({ errorHttpStatusCode: 422 })`) lets you set options.

A global pipe set with `useGlobalPipes` can't inject other providers. To get DI for a global pipe, register it in a module as `{ provide: APP_PIPE, useClass: MyPipe }`.

**Pipes vs middleware.** [Middleware](topic:nestjs/middleware) doesn't know which handler or which argument comes next. A pipe knows the exact argument and its type. So pipes are the right place for per-argument checks.

## 🎯 Why do we use it?

- **Clean handlers.** The handler gets ready-to-use values. No `parseInt` and `if` checks in every route.
- **One rule, many routes.** Write a check once as a pipe and reuse it everywhere.
- **Safe input.** Bad values are stopped with a clear `400` before they reach your business logic.
- **Correct types.** URL params and query strings are always text. Pipes turn them into real numbers and booleans.

## ⚠️ Common mistakes

- **Thinking `id: number` converts the value.** TypeScript types disappear at runtime. Without `ParseIntPipe` (or `transform: true` in ValidationPipe), `id` is still the text `"42"`.
- **Putting `DefaultValuePipe` after `ParseIntPipe`.** Pipes run left to right. The parse pipe fails on a missing value first.
- **Doing business logic in a pipe.** Pipes are for shaping and checking input. Saving data or sending emails belongs in a service.
- **Expecting DI in a pipe added with `useGlobalPipes(new X())`.** It's created outside any module. Use `APP_PIPE` instead.

## 🗣️ How to answer in an interview

> "A pipe in NestJS runs right before the route handler, once for each argument. It has two jobs: transformation, like turning the string id into a number with ParseIntPipe, and validation, where it throws a BadRequestException so the handler never runs.
>
> Nest gives built-in pipes like ParseIntPipe, ParseUUIDPipe, DefaultValuePipe and ValidationPipe. For a custom pipe, I write an injectable class that implements PipeTransform and its transform method. I can bind pipes to a parameter, a handler, a controller, or globally.
>
> I haven't used NestJS in production. My backend work at SkillKeepr was Node.js and TypeScript on AWS Lambda, where we validated requests with Joi. A Nest pipe is the same idea, just plugged into the framework, so the handler only ever sees clean input."

## 🔁 Follow-up questions

### What is the difference between a pipe and a guard?

A [guard](topic:nestjs/guards) answers "**may** this request continue?" It's for auth and roles. A pipe answers "is this **input** correct, and in what shape?" Guards run before pipes.

### Can a pipe be async?

Yes. `transform` can return a Promise. For example, a pipe can load a user by id from the database and pass the user object to the handler.

### How do you change the error status code of ParseIntPipe?

Create an instance with options: `new ParseIntPipe({ errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE })`. Most teams keep the default `400`.

### How do you make a global pipe that uses dependency injection?

Add `{ provide: APP_PIPE, useClass: MyPipe }` to the `providers` of a module. Nest then creates it inside the DI system, so it can inject services.

## ✅ Quick check

### 1. A route has `@Param('id') id: number` with no pipe. A user calls `/items/7`. What is `typeof id`?

:::answer
**`'string'`.** The type annotation does nothing at runtime. You need `ParseIntPipe` (or ValidationPipe with `transform: true`) to get a number.
:::

### 2. Which of these runs right before the handler and can change its arguments?

- A) Middleware
- B) Guard
- C) Pipe
- D) Exception filter

:::answer
**C) Pipe.** Pipes work on each handler argument, just before the handler runs.
:::

### 3. What does `@Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number` give when no `limit` is sent?

:::answer
The number **`10`**. DefaultValuePipe fills in `10` first, then ParseIntPipe keeps it as a number.
:::
