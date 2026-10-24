---
title: "Request data: @Param, @Query, @Body and DTOs"
stack: nestjs
order: 9
level: Basic
mustKnow: true
askedFrequency: very common
summary:
  - "@Param('id') reads a part of the URL path, @Query() reads ?key=value, @Body() reads the JSON body, @Headers() reads headers."
  - "A DTO (Data Transfer Object) is a class that describes the shape of incoming or outgoing data."
  - "Use a class, not an interface, for DTOs: classes exist at runtime, so ValidationPipe and Swagger can read them."
  - "Every value from the URL is a string. Convert it with a pipe like ParseIntPipe, or with transform: true."
  - "Mapped types (PartialType, PickType, OmitType) build new DTOs from old ones, like UpdateUserDto = PartialType(CreateUserDto)."
cards:
  - q: How do you read a route param in Nest?
    a: "With @Param('id') on a handler argument, for a route like @Get(':id')."
  - q: What is a DTO?
    a: A class that describes the shape of data sent to or from the API, such as the fields of a create-user request.
  - q: Why is a DTO a class and not an interface?
    a: Interfaces disappear when TypeScript compiles. Classes stay at runtime, so ValidationPipe and Swagger can read their decorators.
  - q: What type is @Param('id') by default?
    a: A string. Use ParseIntPipe or transform to get a number.
  - q: What does PartialType(CreateUserDto) give you?
    a: A new DTO class with the same fields, all optional. Handy for update (PATCH) requests.
---

## 💡 What is it?

A request carries data in a few places: the URL path, the query string, the body and the headers. Nest gives you a [decorator](glossary:decorator) to read each one.

- `@Param('id')` reads `/users/42` → `'42'`.
- `@Query('page')` reads `/users?page=2` → `'2'`.
- `@Body()` reads the JSON body.

A **[DTO](glossary:dto)** (Data Transfer Object) is a class that describes the shape of that data.

## 🏠 Real-life example

Think of **a school admission form**.

The school prints a form with fixed boxes: name, age, class, parent's phone. Every parent fills the same boxes. The office knows exactly what to expect.

- **The printed form** = the DTO class, like `CreateStudentDto`.
- **Each box on the form** = a field in the DTO, like `name: string`.
- **The roll number on the envelope** = `@Param('id')`, part of the address.
- **A note like "send copy by email"** = `@Query()`, an extra option.
- **The filled-in form inside** = `@Body()`, the main data.
- **The clerk who checks the boxes are filled correctly** = [ValidationPipe](topic:nestjs/validation-pipe).

## 🧑‍💻 Code example

Create a project with `npx @nestjs/cli new students-api`. Save this file as `src/students.controller.ts`. Add `StudentsController` to `controllers` in `src/app.module.ts`. Run `npm run start:dev`.

```ts
import { Body, Controller, Get, Param, ParseIntPipe, Post, Query } from '@nestjs/common'; // load decorators and a pipe

export class CreateStudentDto {                                    // DTO: the shape of the POST body
  name: string;                                                    // student's name, e.g. "Asha"
  age: number;                                                     // student's age, e.g. 15
  className: string;                                               // class, e.g. "10-B"
}                                                                  // end of CreateStudentDto

@Controller('students')                                            // routes start with /students
export class StudentsController {                                  // the controller
  private students = [{ id: 1, name: 'Ravi', age: 15, className: '10-A' }]; // fake data; id 1 = first student

  @Get()                                                           // GET /students?page=1
  list(@Query('page') page = '1') {                                // read ?page=...; default '1' (a string!)
    return { page: Number(page), items: this.students };           // convert to a number for the reply
  }                                                                // end of list

  @Get(':id')                                                      // GET /students/1 ; ":id" = a path variable
  findOne(@Param('id', ParseIntPipe) id: number) {                 // read id and turn "1" into 1 (or reply 400)
    return this.students.find((s) => s.id === id);                 // find by number id
  }                                                                // end of findOne

  @Post()                                                          // POST /students
  create(@Body() dto: CreateStudentDto) {                          // read the whole JSON body as the DTO
    const student = { id: this.students.length + 1, ...dto };      // new id = list length + 1
    this.students.push(student);                                   // save it
    return student;                                                // Nest sends it with status 201
  }                                                                // end of create
}                                                                  // end of StudentsController
```

```text
$ curl "http://localhost:3000/students?page=2"
{"page":2,"items":[{"id":1,"name":"Ravi","age":15,"className":"10-A"}]}

$ curl http://localhost:3000/students/abc
{"message":"Validation failed (numeric string is expected)","error":"Bad Request","statusCode":400}

$ curl -X POST -H "Content-Type: application/json" \
    -d '{"name":"Asha","age":15,"className":"10-B"}' http://localhost:3000/students
{"id":2,"name":"Asha","age":15,"className":"10-B"}
```

This DTO only describes the shape. It does **not** check anything yet. Sending `"age": "abc"` would still be saved. The next topic adds real checks.

## 🔍 Deeper version

**All request decorators.**

| Decorator | Reads | Express equivalent |
|---|---|---|
| `@Param('id')` | path variable | `req.params.id` |
| `@Query('page')` | query string | `req.query.page` |
| `@Body()` / `@Body('name')` | JSON body / one field | `req.body` |
| `@Headers('authorization')` | one header | `req.headers.authorization` |
| `@Ip()` | client IP | `req.ip` |
| `@Req()` / `@Res()` | raw request / response | `req` / `res` |

Without a key, `@Param()` and `@Query()` give the whole object.

**Why a class, not an interface?** TypeScript removes interfaces and types when it compiles. A class stays as real JavaScript. So:
- [ValidationPipe](topic:nestjs/validation-pipe) can read `class-validator` decorators on its fields.
- [Swagger](topic:nestjs/swagger) can read the fields to build API docs.
- `class-transformer` can turn the plain JSON into a real instance.

**Strings everywhere.** Path params, query values and headers are always strings. Fix it with:
- A pipe per param: `ParseIntPipe`, `ParseBoolPipe`, `ParseUUIDPipe`, `ParseEnumPipe`.
- Or globally: `new ValidationPipe({ transform: true })` converts values based on the DTO types.

**Mapped types.** Build new DTOs without repeating fields (from `@nestjs/mapped-types`, or `@nestjs/swagger` if you use Swagger):

```ts
export class UpdateStudentDto extends PartialType(CreateStudentDto) {} // all fields optional (for PATCH)
export class StudentNameDto extends PickType(CreateStudentDto, ['name'] as const) {} // only "name"
export class NoAgeDto extends OmitType(CreateStudentDto, ['age'] as const) {} // everything except "age"
```

**Response DTOs.** A DTO can also shape the **reply**. For example, a `UserResponseDto` with no `password` field. With `ClassSerializerInterceptor` and `@Exclude()`, you hide fields you must never send.

**Avoid `@Res()` when you can.** If you inject `@Res()`, Nest stops sending the reply for you. Interceptors and the normal return flow no longer apply. Use `@Res({ passthrough: true })` if you only need to set a cookie or header.

## 🎯 Why do we use it?

- **A clear contract.** Anyone reading the DTO knows what the API accepts.
- **Validation in one place.** Add rules to the DTO, and every route that uses it is checked.
- **Auto docs.** Swagger reads DTOs to show request shapes.
- **Type safety.** Your handler gets typed data instead of `any`.

## ⚠️ Common mistakes

- **Treating `@Param('id')` as a number.** It's a string. `'5' === 5` is false, so `find` fails silently. Use `ParseIntPipe`.
- **Using an interface for a DTO.** Validation and Swagger can't see it at runtime.
- **Thinking a DTO validates by itself.** Without `ValidationPipe` and `class-validator` rules, anything passes.
- **Using `@Res()` and forgetting to send a reply.** The request hangs until it times out.

## 🗣️ How to answer in an interview

> "Nest has a decorator for each part of the request: `@Param` for path variables, `@Query` for the query string, `@Body` for the JSON body and `@Headers` for headers. They map to `req.params`, `req.query` and `req.body` in Express.
>
> For the body I use a DTO, which is a class describing the shape of the data. I use a class, not an interface, because classes survive compilation, so `ValidationPipe` and Swagger can read them. For updates I use `PartialType` of the create DTO.
>
> Path and query values are always strings, so I use `ParseIntPipe` or the `transform` option.
>
> At SkillKeepr we validated request bodies with Joi schemas in our Node.js services. A Nest DTO with a validation pipe does the same job, using classes instead of schemas."

## 🔁 Follow-up questions

### What is the difference between a DTO and an entity or schema?

A DTO describes data **at the API edge**: what the client sends or gets. An entity or Mongoose schema describes how data is **stored**. They often differ: the DB has `passwordHash` and `createdAt`; the create DTO has `password` only.

### How do you read the whole query object?

Use `@Query()` with no key, ideally typed with a DTO like `ListStudentsQueryDto`, so you can validate `page`, `limit` and `sort` together.

### When would you use `@Req()`?

Rarely. Use it when you need something not covered by a decorator. Better: create a custom param decorator like `@CurrentUser()`, so handlers stay clean.

### How do you set a default value for a query param?

Use `DefaultValuePipe`: `@Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number`. Or set a default in the query DTO.

## ✅ Quick check

### 1. Predict the result: `@Get(':id') find(@Param('id') id: number) { return typeof id; }` called with `/students/7`.

:::answer[Show output]
`"string"`. The TypeScript type `number` doesn't convert anything. Add `ParseIntPipe` or `transform: true` to get a real number.
:::

### 2. Why does this DTO not show up in Swagger: `export interface CreateUserDto { name: string }`?

:::answer
It's an **interface**, so it doesn't exist at runtime. Make it a `class`.
:::

### 3. Which decorator reads `?sort=name` from `/users?sort=name`?

- A) `@Param('sort')`
- B) `@Query('sort')`
- C) `@Body('sort')`

:::answer
**B) `@Query('sort')`.**
:::
