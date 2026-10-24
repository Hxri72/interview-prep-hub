---
title: Swagger with @nestjs/swagger
stack: nestjs
order: 23
level: Basic
mustKnow: false
askedFrequency: common
summary:
  - "@nestjs/swagger reads your controllers, routes and DTOs and builds an OpenAPI document for you."
  - "In main.ts: DocumentBuilder sets the title and version, SwaggerModule.createDocument builds the doc, SwaggerModule.setup serves the UI at a path like /docs."
  - "@ApiProperty() on DTO fields describes the request body. @ApiTags, @ApiResponse and @ApiBearerAuth add more detail."
  - The CLI plugin can add @ApiProperty for you by reading your TypeScript types and comments.
  - "Docs come from the code, so they stay in sync. In Express, you usually write them by hand."
cards:
  - q: What does @nestjs/swagger do?
    a: It builds an OpenAPI (Swagger) document from your Nest controllers and DTOs, and can serve the Swagger UI page.
  - q: Which decorator describes a DTO field for Swagger?
    a: "@ApiProperty() (or @ApiPropertyOptional() for optional fields)."
  - q: How do you show a "lock" for JWT routes in Swagger UI?
    a: Call .addBearerAuth() on DocumentBuilder and put @ApiBearerAuth() on the controller or route.
  - q: Why is Swagger in Nest easier than in plain Express?
    a: Nest already knows your routes and DTO classes through decorators, so it can generate most of the docs from code.
---

## 💡 What is it?

**Swagger** is a web page that lists every API route. You can read about each route and try it with a button. The format behind it is called **OpenAPI**. See [Swagger and OpenAPI](topic:rest-auth/swagger-openapi).

`@nestjs/swagger` is the official Nest package for this. It reads your [controllers](topic:nestjs/controllers) and [DTOs](topic:nestjs/dtos-and-request-data) and builds the docs for you.

## 🏠 Real-life example

Think of a **restaurant menu that the kitchen prints itself**.

Every time the chef adds a dish, the menu updates. The waiter never prints an old menu by mistake.

- **The kitchen's dishes** = your controllers and routes.
- **The ingredients list of each dish** = the DTO fields with `@ApiProperty()`.
- **The printed menu** = the OpenAPI document.
- **The menu board customers read** = the Swagger UI page at `/docs`.
- **A hand-written menu that someone forgets to update** = docs written by hand in a plain Express app.

## 🧑‍💻 Code example

In a project made with `npx @nestjs/cli new docs-demo`, install the package:

```bash
npm install @nestjs/swagger
```

Replace `src/main.ts` and add `src/notes.controller.ts` (add `NotesController` to `controllers` in `app.module.ts`). Run `npm run start:dev`, then open `http://localhost:3000/docs`.

`src/notes.controller.ts`:

```ts
import { Body, Controller, Get, Post } from '@nestjs/common';      // Nest route decorators
import { ApiProperty, ApiResponse, ApiTags } from '@nestjs/swagger'; // Swagger decorators

export class CreateNoteDto {                                       // the shape of the request body
  @ApiProperty({ example: 'Buy milk' })                            // show this field in docs, with an example
  title: string;                                                   // the note's title

  @ApiProperty({ required: false, example: false })                // optional field in docs
  done?: boolean;                                                  // is the note finished?
}                                                                  // end of CreateNoteDto

@ApiTags('notes')                                                  // group these routes under "notes" in the UI
@Controller('notes')                                               // base path: /notes
export class NotesController {                                     // the controller
  private notes: CreateNoteDto[] = [];                             // in-memory list for the demo

  @Get()                                                           // GET /notes
  list() {                                                         // return all notes
    return this.notes;                                             // the array
  }                                                                // end of list

  @Post()                                                          // POST /notes
  @ApiResponse({ status: 201, description: 'Note created' })       // 201 = created, shown in docs
  create(@Body() dto: CreateNoteDto) {                             // read the JSON body
    this.notes.push(dto);                                          // save it
    return dto;                                                    // send it back
  }                                                                // end of create
}                                                                  // end of NotesController
```

`src/main.ts`:

```ts
import { NestFactory } from '@nestjs/core';                        // creates the Nest app
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';  // Swagger helpers
import { AppModule } from './app.module';                          // the root module

async function bootstrap() {                                       // start-up function
  const app = await NestFactory.create(AppModule);                 // build the app
  const config = new DocumentBuilder()                             // start describing the API
    .setTitle('Notes API')                                         // title shown at the top
    .setVersion('1.0')                                             // API version label
    .addBearerAuth()                                               // allow a JWT "Authorize" button
    .build();                                                      // finish the settings
  const document = SwaggerModule.createDocument(app, config);      // scan the app and build OpenAPI
  SwaggerModule.setup('docs', app, document);                      // serve the UI at /docs
  await app.listen(3000);                                          // start on port 3000
}                                                                  // end of bootstrap
bootstrap();                                                       // run it
```

Open `http://localhost:3000/docs`. You'll see a "notes" group with `GET /notes` and `POST /notes`. Click "Try it out" to send a request.

## 🔍 Deeper version

**Common decorators:**

| Decorator | Where | What it adds |
|---|---|---|
| `@ApiTags('users')` | Controller | Groups routes in the UI |
| `@ApiProperty()` / `@ApiPropertyOptional()` | DTO field | Field type, example, required or not |
| `@ApiResponse({ status, type })` | Route | A possible response and its shape |
| `@ApiOkResponse`, `@ApiCreatedResponse`, `@ApiNotFoundResponse` | Route | Short forms of `@ApiResponse` |
| `@ApiBearerAuth()` | Controller or route | Shows a lock; sends the JWT from "Authorize" |
| `@ApiQuery`, `@ApiParam` | Route | Describe query and path values |

**Why DTOs must be classes.** TypeScript interfaces disappear when the code is compiled. Classes stay, so Nest can read their [metadata](glossary:metadata). This is the same reason [validation](topic:nestjs/validation-pipe) needs classes.

**The CLI plugin.** Adding `@ApiProperty` to every field is boring. In `nest-cli.json` you can turn on the Swagger plugin:

```json
{ "compilerOptions": { "plugins": ["@nestjs/swagger"] } }
```

At build time, it reads your TypeScript types (and `?` for optional) and adds the Swagger info for you. It can also read JSDoc comments as descriptions.

**Mapped types.** `@nestjs/swagger` exports `PartialType`, `PickType`, `OmitType` and `IntersectionType`. For example, `UpdateNoteDto extends PartialType(CreateNoteDto)` makes all fields optional. Import them from `@nestjs/swagger`, not `@nestjs/mapped-types`, so the docs stay correct.

**JSON output.** `SwaggerModule.setup` also serves the raw JSON document. You can share it with the frontend team or generate a typed API client from it.

**Production.** Many teams turn off `/docs` in production, or protect it with a login. Public docs show attackers every route.

## 🎯 Why do we use it?

- **Docs that match the code.** The routes and DTOs are the source, so the docs don't go out of date.
- **Easy testing.** Frontend developers and QA can try routes in the browser.
- **Contract for other teams.** The OpenAPI JSON can generate client code.

## ⚠️ Common mistakes

- **Using interfaces for DTOs.** Swagger shows an empty body. Use classes.
- **Importing `PartialType` from the wrong package.** The update DTO shows no fields in the docs.
- **Forgetting `@ApiBearerAuth()`.** The "Authorize" token isn't sent, so protected routes return 401 in the UI.
- **Leaving `/docs` open in production** without thinking about who should see it.

## 🗣️ How to answer in an interview

> "In NestJS I use `@nestjs/swagger`. In `main.ts` I build a config with `DocumentBuilder` — title, version, `addBearerAuth` — then `SwaggerModule.createDocument` scans the app, and `SwaggerModule.setup('docs', ...)` serves the UI.
>
> DTOs are classes with `@ApiProperty`, or I turn on the Swagger CLI plugin so it reads the TypeScript types for me. I add `@ApiTags` to group routes and `@ApiBearerAuth` on protected ones.
>
> At my current job I've written Swagger docs for our Node.js APIs. The nice thing in Nest is that the docs come from the decorators, so they stay in sync with the code."

## 🔁 Follow-up questions

### What is the difference between Swagger and OpenAPI?

OpenAPI is the standard format for describing an API. Swagger is the set of tools around it, like Swagger UI. People often use the names for the same thing.

### How do you document an optional query parameter?

Use `@ApiQuery({ name: 'page', required: false })` on the route. Or use a query DTO class with `@ApiPropertyOptional()`.

### How do you document the response shape?

Make a response class with `@ApiProperty` fields. Then use `@ApiOkResponse({ type: UserResponse })`.

### Should Swagger be public in production?

Usually not fully public. Turn it off with an environment check, or put it behind basic auth.

## ✅ Quick check

### 1. Your DTO is `interface CreateUserDto { name: string }`. Swagger shows an empty body. Why?

:::answer
Interfaces don't exist after compiling, so Nest can't read them. Change it to a **class** with `@ApiProperty()` or use the CLI plugin.
:::

### 2. Which call serves the Swagger UI at `/docs`?

- A) `SwaggerModule.createDocument('docs', app)`
- B) `SwaggerModule.setup('docs', app, document)`

:::answer
**B.** `createDocument` builds the OpenAPI object. `setup` serves it with the UI at a path.
:::

### 3. True or false: `@ApiBearerAuth()` checks the JWT and blocks bad requests.

:::answer
**False.** It only changes the docs. A [guard](topic:nestjs/guards) does the real check.
:::
