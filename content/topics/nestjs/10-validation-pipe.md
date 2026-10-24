---
title: "Validation: ValidationPipe and class-validator"
stack: nestjs
order: 10
level: Intermediate
mustKnow: true
askedFrequency: very common
summary:
  - "ValidationPipe checks every incoming DTO using class-validator rules like @IsString() and @IsEmail(). Bad data gets a 400 Bad Request before your handler runs."
  - "Turn it on for the whole app with app.useGlobalPipes(new ValidationPipe({...}))."
  - "whitelist: true strips unknown fields; forbidNonWhitelisted: true rejects them with 400."
  - "transform: true turns plain JSON into real DTO instances and converts strings to numbers where the DTO says number."
  - "Use @ValidateNested() + @Type(() => Child) for nested objects, and @IsOptional() for optional fields."
cards:
  - q: What does ValidationPipe do?
    a: It validates the incoming data against the class-validator rules on the DTO and throws 400 Bad Request with error messages if anything fails.
  - q: Which two packages does ValidationPipe need?
    a: class-validator (the rules) and class-transformer (turning plain JSON into DTO class instances).
  - q: What does whitelist do?
    a: "It removes any property that has no validation decorator in the DTO, so clients can't sneak in extra fields like role: 'admin'."
  - q: What does transform do?
    a: It converts the payload into an instance of the DTO class and changes primitive types (e.g. "5" → 5) based on the DTO.
  - q: How do you validate a nested object?
    a: "Add @ValidateNested() and @Type(() => AddressDto) on the field."
---

## 💡 What is it?

**ValidationPipe** checks incoming data before your handler runs. If the data is wrong, Nest replies `400 Bad Request` with clear messages.

The rules live on your [DTO](glossary:dto) as small [decorators](glossary:decorator) from the **class-validator** library. For example `@IsEmail()` or `@Min(18)`.

A **pipe** is a class that checks or changes a value before it reaches the handler. More in [pipes](topic:nestjs/pipes).

## 🏠 Real-life example

Think of **the security check at a cricket stadium gate**.

Every fan shows a ticket. The guard checks the date, the seat and the stand. A wrong ticket is turned away at the gate. It never reaches the stands. The guard also takes away items that aren't allowed, like glass bottles.

- **The gate guard** = `ValidationPipe`.
- **The ticket rules** = class-validator decorators on the DTO.
- **Turning a fan away** = replying `400 Bad Request`.
- **Taking away banned items** = `whitelist: true`, which removes extra fields.
- **Refusing entry if you carry banned items** = `forbidNonWhitelisted: true`.
- **The stands** = your route handler. Only clean data gets there.

## 🧑‍💻 Code example

Create a project with `npx @nestjs/cli new signup-api`. Then install the two helper libraries:

```bash
npm install class-validator class-transformer
```

`src/create-user.dto.ts`:

```ts
import { IsEmail, IsInt, IsOptional, IsString, Max, Min, MinLength } from 'class-validator'; // load rule decorators

export class CreateUserDto {                                        // the shape + rules for sign-up
  @IsString()                                                       // must be text
  @MinLength(2)                                                     // 2 = at least two characters
  name: string;                                                     // e.g. "Asha"

  @IsEmail()                                                        // must look like an email
  email: string;                                                    // e.g. "asha@example.com"

  @IsInt()                                                          // must be a whole number
  @Min(18)                                                          // 18 = youngest allowed age
  @Max(100)                                                         // 100 = oldest allowed age
  age: number;                                                      // e.g. 25

  @IsOptional()                                                     // may be missing; if present, check the next rule
  @IsString()                                                       // must be text when sent
  city?: string;                                                    // e.g. "Kochi"
}                                                                   // end of CreateUserDto
```

`src/users.controller.ts` (add it to `controllers` in `src/app.module.ts`):

```ts
import { Body, Controller, Post } from '@nestjs/common';            // load decorators
import { CreateUserDto } from './create-user.dto';                  // load the DTO with rules

@Controller('users')                                                // routes start with /users
export class UsersController {                                      // the controller
  @Post()                                                           // POST /users
  create(@Body() dto: CreateUserDto) {                              // body is checked before we get here
    return { saved: dto, isDto: dto instanceof CreateUserDto };     // show the data and that it's a real class instance
  }                                                                 // end of create
}                                                                   // end of UsersController
```

`src/main.ts`:

```ts
import { ValidationPipe } from '@nestjs/common';                    // load the built-in validation pipe
import { NestFactory } from '@nestjs/core';                         // load the app factory
import { AppModule } from './app.module';                           // load the root module

async function bootstrap() {                                        // start-up function
  const app = await NestFactory.create(AppModule);                  // create the Nest app
  app.useGlobalPipes(new ValidationPipe({                           // check every request body/query/param
    whitelist: true,                                                // true = remove fields with no rules
    forbidNonWhitelisted: true,                                     // true = reply 400 if extra fields are sent
    transform: true,                                                // true = make real DTO instances and convert types
  }));                                                              // end of pipe options
  await app.listen(3000);                                           // 3000 = port number
}                                                                   // end of bootstrap
bootstrap();                                                        // run it
```

Run `npm run start:dev`, then try:

```text
$ curl -X POST -H "Content-Type: application/json" \
    -d '{"name":"A","email":"not-an-email","age":15}' http://localhost:3000/users
{"message":["name must be longer than or equal to 2 characters","email must be an email","age must not be less than 18"],"error":"Bad Request","statusCode":400}

$ curl -X POST -H "Content-Type: application/json" \
    -d '{"name":"Asha","email":"asha@example.com","age":25,"role":"admin"}' http://localhost:3000/users
{"message":["property role should not exist"],"error":"Bad Request","statusCode":400}

$ curl -X POST -H "Content-Type: application/json" \
    -d '{"name":"Asha","email":"asha@example.com","age":25}' http://localhost:3000/users
{"saved":{"name":"Asha","email":"asha@example.com","age":25},"isDto":true}
```

## 🔍 Deeper version

**How it works.**
1. `class-transformer` turns the plain JSON into a `CreateUserDto` instance (`plainToInstance`).
2. `class-validator` runs every rule decorator on that instance.
3. If there are errors, the pipe throws a `BadRequestException` with the messages.
4. If not, the handler gets the value (the instance when `transform: true`).

**Important options.**

| Option | What it does | Why |
|---|---|---|
| `whitelist: true` | strips fields without decorators | stops mass assignment, like `role: 'admin'` |
| `forbidNonWhitelisted: true` | 400 for extra fields instead of stripping | tells clients they sent something wrong |
| `transform: true` | real class instances; `"5"` → `5` for `number` params | typed values in handlers |
| `transformOptions: { enableImplicitConversion: true }` | converts query strings by TS type | `?page=2` arrives as a number |
| `stopAtFirstError: true` | one error per field | shorter messages |
| `disableErrorMessages: true` | hides details | some teams use it in production |

**Nested objects and arrays.**

```ts
class AddressDto { @IsString() city: string; }                      // a child DTO
class CreateUserDto {                                               // parent DTO
  @ValidateNested()                                                 // check the child object's rules too
  @Type(() => AddressDto)                                           // tell class-transformer which class to build
  address: AddressDto;                                              // nested object
  @IsArray() @IsString({ each: true }) skills: string[];            // each = check every item in the array
}                                                                   // end of CreateUserDto
```

Without `@Type()`, the nested object stays plain, and its rules are skipped.

**Scopes.** You can apply the pipe globally (`useGlobalPipes`), per controller or per route (`@UsePipes()`), or per parameter (`@Body(new ValidationPipe())`). Global is the usual choice. If you need DI inside a global pipe, register it with the `APP_PIPE` token in a module instead.

**Custom rules.** Write a class with `@ValidatorConstraint()` that implements `ValidatorConstraintInterface`. Or use simple ones like `@Matches(/regex/)` and `@IsIn(['admin', 'user'])`.

**Other approaches.** class-validator is the classic choice. Some teams use a schema library instead (Zod or Joi) with a custom pipe.

:::version[Version note]
NestJS 12 (August 2026) added support for **Standard Schema** libraries (a shared interface used by Zod, Valibot and others) in route decorators. class-validator with `ValidationPipe` still works and is still what most existing projects use. Check the official docs before using the new style.
:::

## 🎯 Why do we use it?

- **Bad data never reaches your logic.** No `if (!email)` checks spread across services.
- **Security.** `whitelist` blocks extra fields that could change roles or prices.
- **Clear errors.** Clients get a list of what's wrong, with status 400.
- **One source of truth.** The DTO holds the shape, the rules and (with Swagger) the docs.

## ⚠️ Common mistakes

- **Forgetting to install or register the pipe.** The DTO's rules then do nothing.
- **Leaving out `whitelist`.** A client can send `isAdmin: true`, and if you spread the body into the DB, it gets saved.
- **Missing `@Type()` on nested objects.** Nested rules are skipped silently.
- **Expecting `@IsInt()` to pass for query strings.** `?page=2` is the string `"2"`. Turn on `transform` with implicit conversion, or use `@Type(() => Number)`.

## 🗣️ How to answer in an interview

> "In Nest I validate input with the global `ValidationPipe` plus `class-validator` decorators on DTO classes. The pipe uses `class-transformer` to turn the JSON into a DTO instance, runs the rules, and throws a 400 with the messages if anything fails. So bad data never reaches the handler.
>
> I always set `whitelist: true` to strip unknown fields, which stops mass assignment, and often `forbidNonWhitelisted` to reject them. I set `transform: true` so handlers get typed values. For nested objects I use `@ValidateNested` with `@Type`.
>
> At SkillKeepr we validated requests with Joi schemas in our services. The idea is the same: validate at the edge, fail fast with a 400. In Nest I'd use `ValidationPipe`, or a custom pipe if the team prefers a schema library."

## 🔁 Follow-up questions

### What is the difference between `whitelist` and `forbidNonWhitelisted`?

`whitelist` silently removes unknown fields. `forbidNonWhitelisted` (which needs `whitelist`) rejects the whole request with 400 instead.

### Why do you need class-transformer?

The body arrives as a plain object. class-validator needs a real class instance to find the rules. class-transformer builds that instance, and also handles `@Type()` for nested data.

### How do you validate query parameters?

Make a query DTO, like `ListUsersQueryDto` with `@IsOptional() @Type(() => Number) @IsInt() page`. Then use `@Query() query: ListUsersQueryDto`. The global pipe checks it too.

### How would you use Joi or Zod instead?

Write a custom pipe that implements `PipeTransform`. In `transform()`, run `schema.validate(value)` (Joi) or `schema.safeParse(value)` (Zod), and throw `BadRequestException` on failure. Apply it with `@UsePipes(new SchemaPipe(schema))`.

## ✅ Quick check

### 1. With `whitelist: true` only, what does the handler receive for `{"name":"Asha","role":"admin"}` if the DTO has only `name`?

:::answer
`{ name: "Asha" }`. `role` is removed silently. With `forbidNonWhitelisted: true` too, the client would get a 400 instead.
:::

### 2. A DTO has `address: AddressDto` with `@ValidateNested()` but no `@Type()`. A client sends `address: { city: 5 }`. What happens?

:::answer
It **passes**. Without `@Type(() => AddressDto)`, the nested value stays a plain object, so its rules aren't run.
:::

### 3. Which status code does ValidationPipe return for invalid data?

- A) 401
- B) 400
- C) 422

:::answer
**B) 400 Bad Request.** (You can change it with the `errorHttpStatusCode` option, for example to 422.)
:::
